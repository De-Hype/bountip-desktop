import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Search, SlidersHorizontal } from "lucide-react";
import { Pagination } from "@/shared/Pagination/pagination";
import { useBusinessStore } from "@/stores/useBusinessStore";
import { formatPrice } from "@/utils/formatPrice";
import ReportsStatsCards from "@/features/report-analysis/ReportsStatsCards";
import ReportsAnalysisAssets from "@/assets/images/reports-analysis";
import ViewDebtorsInfo from "./ViewDebtorsInfo";
import DebtorsNotFound from "./NotFound";

type DebtorsTabsTypeProps = {
  outletId?: string;
  dateRange?: DateRange;
};

type DebtorRow = {
  key: string;
  customerId: string | null;
  customerCode: string;
  customerName: string;
  customerEmail: string;
  paymentTerm: string;
  amountDue: number;
  unpaidOrdersCount: number;
  partiallyPaidOrdersCount: number;
};

type AnyRow = Record<string, any>;

const normalizeText = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const toNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const getRowDate = (row: AnyRow) => {
  const candidates = [
    row.createdAt,
    row.created_at,
    row.createdOn,
    row.created_on,
    row.date,
  ];
  for (const c of candidates) {
    if (!c) continue;
    const d = new Date(c);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
};

const isWithinRange = (d: Date | null, range: DateRange | undefined) => {
  if (!range?.from) return true;
  if (!d) return true;

  const start = new Date(range.from);
  start.setHours(0, 0, 0, 0);

  const end = new Date(range.to ?? range.from);
  end.setHours(23, 59, 59, 999);

  return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
};

const isExcludedOrder = (row: AnyRow) => {
  const paymentStatus = normalizeText(
    row.paymentStatus ?? row.payment_status ?? row.payment_state,
  );
  const status = normalizeText(
    row.status ?? row.orderStatus ?? row.order_status,
  );
  const merged = `${paymentStatus} ${status}`.trim();
  if (merged.includes("draft")) return true;
  if (merged.includes("cancel")) return true;
  if (merged.includes("refunded")) return true;
  return false;
};

const isPaidOrder = (row: AnyRow) => {
  const paymentStatus = normalizeText(
    row.paymentStatus ?? row.payment_status ?? row.payment_state,
  );
  const status = normalizeText(
    row.status ?? row.orderStatus ?? row.order_status,
  );
  const merged = `${paymentStatus} ${status}`.trim();

  if (merged.includes("unpaid")) return false;
  if (merged.includes("not paid")) return false;
  if (merged.includes("pending")) return false;
  if (merged.includes("draft")) return false;
  if (merged.includes("cancel")) return false;
  if (merged.includes("refunded")) return false;

  if (merged.includes("verified")) return true;
  if (merged.includes("paid")) return true;
  if (merged.includes("completed")) return true;
  if (merged.includes("success")) return true;

  const explicitIsPaid = row.isPaid ?? row.is_paid;
  if (typeof explicitIsPaid === "boolean") return explicitIsPaid;
  if (explicitIsPaid === 1) return true;
  if (explicitIsPaid === 0) return false;

  return false;
};

const getOrderTotal = (row: AnyRow) => {
  const candidates = [
    row.total,
    row.amount,
    row.totalAmount,
    row.grandTotal,
    row.totalPrice,
    row.total_price,
    row.subTotal,
    row.sub_total,
  ];
  for (const c of candidates) {
    const v = toNumber(c);
    if (v !== 0) return v;
  }
  return 0;
};

const getCashCollected = (row: AnyRow) => {
  const candidates = [row.cashCollected, row.cash_collected];
  for (const c of candidates) {
    const v = toNumber(c);
    if (v !== 0) return v;
  }
  return 0;
};

const getAmountDueForOrder = (row: AnyRow) => {
  if (isExcludedOrder(row)) return 0;
  if (isPaidOrder(row)) return 0;
  const total = getOrderTotal(row);
  const collected = getCashCollected(row);
  return Math.max(0, total - collected);
};

const getCustomerCode = (row: AnyRow) => {
  const candidates = [
    row.customerCode,
    row.customer_code,
    row.customerReference,
    row.customer_reference,
    row.reference,
    row.customerRef,
  ];
  for (const c of candidates) {
    const s = String(c ?? "").trim();
    if (s) return s;
  }
  const id = String(row.customerId ?? row.customer_id ?? row.id ?? "").trim();
  if (id) return id.slice(0, 6).toUpperCase();
  return "-";
};

const DebtorsTab = ({ outletId, dateRange }: DebtorsTabsTypeProps) => {
  const { selectedOutlet } = useBusinessStore();
  const [rawRows, setRawRows] = useState<AnyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedDebtorKey, setSelectedDebtorKey] = useState<string | null>(
    null,
  );
  const [selectedDebtorName, setSelectedDebtorName] = useState<string>("");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const api = (window as any)?.electronAPI;
      if (!api?.dbQuery) {
        if (!cancelled) setRawRows([]);
        return;
      }

      setLoading(true);
      try {
        const rows = (await api.dbQuery(
          `
            SELECT
              o.*,
              c.id as customerId,
              c.name as customerName,
              c.email as customerEmail,
              c.customerCode as customerCode,
              c.reference as customerRef,
              pt.name as paymentTermName
            FROM orders o
            LEFT JOIN customers c ON c.id = o.customerId
            LEFT JOIN payment_terms pt ON pt.id = c.paymentTermId
            ${outletId ? "WHERE o.outletId = ?" : ""}
          `,
          outletId ? [outletId] : [],
        )) as AnyRow[];
        if (!cancelled) setRawRows(Array.isArray(rows) ? rows : []);
      } catch {
        if (!cancelled) setRawRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [outletId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    itemsPerPage,
    outletId,
    dateRange?.from ? dateRange.from.getTime() : 0,
    dateRange?.to ? dateRange.to.getTime() : 0,
  ]);

  const debtors = useMemo<DebtorRow[]>(() => {
    const safeRows = Array.isArray(rawRows) ? rawRows : [];
    const filteredByDate = safeRows.filter((row) =>
      isWithinRange(getRowDate(row), dateRange),
    );

    const map = new Map<string, DebtorRow>();

    for (const row of filteredByDate) {
      if (isExcludedOrder(row)) continue;

      const amountDue = getAmountDueForOrder(row);
      if (amountDue <= 0) continue;

      const customerIdRaw = row.customerId ?? row.customer_id ?? null;
      const customerId =
        customerIdRaw != null && String(customerIdRaw).trim()
          ? String(customerIdRaw)
          : null;
      const key =
        customerId ||
        `guest:${String(row.id ?? "").trim() || crypto.randomUUID()}`;

      const customerName =
        String(row.customerName ?? row.recipientName ?? "").trim() ||
        "Customer";
      const customerEmail = String(row.customerEmail ?? "").trim();
      const paymentTerm = String(row.paymentTermName ?? "").trim() || "Default";
      const customerCode = getCustomerCode(row);

      const total = getOrderTotal(row);
      const collected = getCashCollected(row);
      const isPartial =
        collected > 0 ||
        normalizeText(row.paymentStatus).includes("partial") ||
        normalizeText(row.status).includes("partial");
      const isUnpaid =
        collected <= 0 &&
        total > 0 &&
        !isPaidOrder(row) &&
        (normalizeText(row.paymentStatus).includes("pending") ||
          normalizeText(row.paymentStatus).includes("unpaid") ||
          normalizeText(row.status).includes("pending") ||
          normalizeText(row.status).includes("unpaid"));

      const existing = map.get(key);
      if (existing) {
        existing.amountDue += amountDue;
        if (isUnpaid) existing.unpaidOrdersCount += 1;
        if (isPartial) existing.partiallyPaidOrdersCount += 1;
      } else {
        map.set(key, {
          key,
          customerId,
          customerCode,
          customerName,
          customerEmail,
          paymentTerm,
          amountDue,
          unpaidOrdersCount: isUnpaid ? 1 : 0,
          partiallyPaidOrdersCount: isPartial ? 1 : 0,
        });
      }
    }

    const q = normalizeText(search);
    const list = Array.from(map.values())
      .filter((r) => {
        if (!q) return true;
        const hay = normalizeText(
          `${r.customerCode} ${r.customerName} ${r.customerEmail} ${r.paymentTerm}`,
        );
        return hay.includes(q);
      })
      .sort((a, b) => b.amountDue - a.amountDue);

    return list;
  }, [rawRows, dateRange, search]);

  const stats = useMemo(() => {
    const safeRows = Array.isArray(rawRows) ? rawRows : [];
    const filteredByDate = safeRows.filter((row) =>
      isWithinRange(getRowDate(row), dateRange),
    );

    let totalAmountDue = 0;
    let totalUnpaidOrders = 0;
    let totalPartiallyPaidOrders = 0;
    let totalPartiallyPaidAmountDue = 0;

    for (const row of filteredByDate) {
      if (isExcludedOrder(row)) continue;
      const amountDue = getAmountDueForOrder(row);
      if (amountDue <= 0) continue;

      totalAmountDue += amountDue;

      const total = getOrderTotal(row);
      const collected = getCashCollected(row);
      const isPartial =
        collected > 0 ||
        normalizeText(row.paymentStatus).includes("partial") ||
        normalizeText(row.status).includes("partial");
      const isUnpaid =
        collected <= 0 &&
        total > 0 &&
        !isPaidOrder(row) &&
        (normalizeText(row.paymentStatus).includes("pending") ||
          normalizeText(row.paymentStatus).includes("unpaid") ||
          normalizeText(row.status).includes("pending") ||
          normalizeText(row.status).includes("unpaid"));

      if (isUnpaid) totalUnpaidOrders += 1;
      if (isPartial) {
        totalPartiallyPaidOrders += 1;
        totalPartiallyPaidAmountDue += amountDue;
      }
    }

    return {
      totalAmountDue,
      totalUnpaidOrders,
      totalPartiallyPaidOrders,
      totalPartiallyPaidAmountDue,
    };
  }, [rawRows, dateRange]);

  const totalPages = useMemo(() => {
    const totalItems = debtors.length;
    return Math.max(1, Math.ceil(totalItems / Math.max(1, itemsPerPage)));
  }, [debtors.length, itemsPerPage]);

  const visibleRows = useMemo(() => {
    const start = (Math.max(1, currentPage) - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return debtors.slice(start, end);
  }, [currentPage, debtors, itemsPerPage]);

  const selectedOrders = useMemo(() => {
    if (!isDetailsOpen || !selectedDebtorKey) return [];
    const safeRows = Array.isArray(rawRows) ? rawRows : [];
    const filteredByDate = safeRows.filter((row) =>
      isWithinRange(getRowDate(row), dateRange),
    );

    const list = filteredByDate
      .filter((row) => {
        if (isExcludedOrder(row)) return false;
        const amountDue = getAmountDueForOrder(row);
        if (amountDue <= 0) return false;
        const customerIdRaw = row.customerId ?? row.customer_id ?? null;
        const customerId =
          customerIdRaw != null && String(customerIdRaw).trim()
            ? String(customerIdRaw)
            : null;
        const key = customerId || `guest:${String(row.id ?? "").trim() || ""}`;
        return key === selectedDebtorKey;
      })
      .sort((a, b) => {
        const da = getRowDate(a);
        const db = getRowDate(b);
        const ta = da ? da.getTime() : 0;
        const tb = db ? db.getTime() : 0;
        return tb - ta;
      });

    return list;
  }, [dateRange, isDetailsOpen, rawRows, selectedDebtorKey]);

  const reportsStats = useMemo(
    () => [
      {
        label: "Total Amount Due",
        value: formatPrice({
          amount: stats.totalAmountDue || 0,
          currencyCode: selectedOutlet?.currency || "USD",
        }),
        bgColor: "#15BA5C0D",
        iconColor: "#15BA5C1A",
        image: ReportsAnalysisAssets.MoneyIcon,
      },
      {
        label: "Total Unpaid Orders",
        value: `${stats.totalUnpaidOrders || 0}`,
        bgColor: "#E336290D",
        iconColor: "#E336291A",
        image: ReportsAnalysisAssets.MoneyIconRed,
      },
      {
        label: "Total Partially Paid Orders",
        value: `${formatPrice({
          amount: stats.totalPartiallyPaidAmountDue || 0,
          currencyCode: selectedOutlet?.currency || "USD",
        })} | ${stats.totalPartiallyPaidOrders || 0}`,
        bgColor: "#9747FF0D",
        iconColor: "#9747FF1A",
        image: ReportsAnalysisAssets.MoneyIconPurple,
      },
    ],
    [selectedOutlet?.currency, stats],
  );

  return (
    <div className="">
      <div className="space-y-6 p-4 sm:p-6">
        <ReportsStatsCards reportsStats={reportsStats} columns={3} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[18px] font-bold text-[#111827]">
            All Debtors
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center w-full sm:w-[320px] rounded-[10px] border border-[#E5E7EB] bg-white overflow-hidden">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="flex-1 h-10 px-3 text-[14px] text-[#111827] outline-none"
              />
              <button
                type="button"
                className="h-10 w-11 bg-[#15BA5C] flex items-center justify-center cursor-pointer"
              >
                <Search className="h-4 w-4 text-white" />
              </button>
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-[10px] border border-[#E5E7EB] bg-white text-[14px] font-medium text-[#111827] hover:bg-[#F9FAFB] cursor-pointer"
            >
              <SlidersHorizontal className="h-4 w-4 text-[#6B7280]" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        <div className="rounded-[14px] border border-[#E5E7EB] bg-white overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead className="bg-[#F9FAFB]">
                <tr className="text-left text-[12px] font-medium text-[#6B7280]">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Customer Name</th>
                  <th className="px-6 py-4">Amount Due</th>
                  <th className="px-6 py-4">Customer Email</th>
                  <th className="px-6 py-4">Payment Term</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <>
                    {Array.from({ length: itemsPerPage }).map((_, i) => (
                      <tr
                        key={`sk-${i}`}
                        className="border-t border-[#F3F4F6] animate-pulse"
                      >
                        <td className="px-6 py-4">
                          <div className="h-4 w-16 rounded bg-gray-200" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-40 rounded bg-gray-200" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-24 rounded bg-gray-200" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-56 rounded bg-gray-200" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-20 rounded bg-gray-200" />
                        </td>
                      </tr>
                    ))}
                  </>
                ) : visibleRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-[14px] text-[#6B7280]"
                    >
                      <DebtorsNotFound />
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((row) => (
                    <tr key={row.key} className="border-t border-[#F3F4F6]">
                      <td className="px-6 py-4 text-[14px] font-medium text-[#15BA5C]">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDebtorKey(row.key);
                            setSelectedDebtorName(row.customerName);
                            setIsDetailsOpen(true);
                          }}
                          className="cursor-pointer hover:underline"
                        >
                          {row.customerCode}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#111827]">
                        {row.customerName}
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#111827]">
                        {formatPrice({
                          amount: row.amountDue || 0,
                          currencyCode: selectedOutlet?.currency || "USD",
                        })}
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#111827]">
                        {row.customerEmail || "-"}
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#111827]">
                        {row.paymentTerm}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={Math.min(currentPage, totalPages)}
            totalPages={totalPages}
            onPageChange={(p) =>
              setCurrentPage(Math.max(1, Math.min(totalPages, p)))
            }
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(next) => setItemsPerPage(next)}
            totalItems={debtors.length}
          />
        </div>
      </div>

      <ViewDebtorsInfo
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedDebtorKey(null);
          setSelectedDebtorName("");
        }}
        customerName={selectedDebtorName}
        orders={selectedOrders}
      />
    </div>
  );
};

export default DebtorsTab;
