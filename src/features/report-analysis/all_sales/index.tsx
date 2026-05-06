import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import {
  Globe,
  Mail,
  MessageCircle,
  Search,
  SlidersHorizontal,
  Timer,
  X,
} from "lucide-react";
import ReportsStatsCards from "@/features/report-analysis/ReportsStatsCards";
import ReportsAnalysisAssets from "@/assets/images/reports-analysis";
import { Pagination } from "@/shared/Pagination/pagination";
import { formatPrice } from "@/utils/formatPrice";
import { useBusinessStore } from "@/stores/useBusinessStore";
import { Dropdown } from "@/shared/AppDropdowns/CreateDropdown";

type AllSalesTabProps = {
  outletId?: string;
  dateRange?: DateRange;
};

type AnyRow = Record<string, any>;

type AllSalesRow = {
  key: string;
  orderId: string;
  customerName: string;
  orderValue: number;
  channel: string;
  createdAt: string | null;
  orderStatus: string;
  paymentStatus: string;
  dueDate: string | null;
  initiator: string;
};

type AllSalesFilters = {
  channel: string;
  orderStatus: string;
  paymentStatus: string;
};

const normalizeText = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const toNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const getRangeBounds = (range: DateRange | undefined) => {
  if (!range?.from) return null;
  const start = new Date(range.from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(range.to ?? range.from);
  end.setHours(23, 59, 59, 999);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
};

const formatOrderIndexCode = (index: number) => {
  const n = Math.max(0, index);
  return `ORD${String(n + 1).padStart(3, "0")}`;
};

const formatDateTimeLabel = (iso: string | null) => {
  if (!iso) return { date: "-", time: "-" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "-", time: "-" };
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${mi}:${ss}` };
};

const channelPill = (channel: string) => {
  const c = normalizeText(channel);
  if (!c) return { label: "-", cls: "bg-[#F3F4F6] text-[#6B7280]", Icon: null };
  if (c.includes("whatsapp")) {
    return {
      label: "WhatsApp",
      cls: "bg-[#E9FBF0] text-[#15BA5C]",
      Icon: MessageCircle,
    };
  }
  if (c.includes("email")) {
    return { label: "Email", cls: "bg-[#DBEAFE] text-[#2563EB]", Icon: Mail };
  }
  if (c.includes("website") || c.includes("web")) {
    return {
      label: "Website",
      cls: "bg-[#FFEFE5] text-[#F97316]",
      Icon: Globe,
    };
  }
  if (c.includes("pre") && c.includes("order")) {
    return {
      label: "Pre-Order",
      cls: "bg-[#F3E8FF] text-[#7C3AED]",
      Icon: Timer,
    };
  }
  return { label: channel, cls: "bg-[#F3F4F6] text-[#6B7280]", Icon: null };
};

const statusPill = (status: string) => {
  const s = normalizeText(status);
  if (!s) return { label: "-", cls: "bg-[#F3F4F6] text-[#6B7280]" };
  if (s.includes("to be produced")) {
    return { label: "To be Produced", cls: "bg-[#E9FBF0] text-[#15BA5C]" };
  }
  if (s.includes("in production")) {
    return { label: "In Production", cls: "bg-[#F3E8FF] text-[#7C3AED]" };
  }
  if (s.includes("confirmed")) {
    return { label: "Confirmed", cls: "bg-[#FEF3C7] text-[#B45309]" };
  }
  if (s.includes("ready")) {
    return { label: "Ready", cls: "bg-[#EEF2F7] text-[#374151]" };
  }
  return { label: status, cls: "bg-[#F3F4F6] text-[#6B7280]" };
};

const paymentPill = (status: string) => {
  const s = normalizeText(status);
  if (!s) return { label: "-", cls: "bg-[#F3F4F6] text-[#6B7280]" };
  if (s.includes("paid") && !s.includes("partial")) {
    return { label: "Paid", cls: "bg-[#E9FBF0] text-[#15BA5C]" };
  }
  if (s.includes("partial")) {
    return { label: "Partially Paid", cls: "bg-[#FFEFE5] text-[#F97316]" };
  }
  if (s.includes("unpaid")) {
    return { label: "Unpaid", cls: "bg-[#FEE2E2] text-[#EF4444]" };
  }
  return { label: status, cls: "bg-[#F3F4F6] text-[#6B7280]" };
};

const AllSalesFilter = ({
  isOpen,
  onClose,
  value,
  onChange,
  channelOptions,
  orderStatusOptions,
  paymentStatusOptions,
}: {
  isOpen: boolean;
  onClose: () => void;
  value: AllSalesFilters;
  onChange: (next: AllSalesFilters) => void;
  channelOptions: string[];
  orderStatusOptions: string[];
  paymentStatusOptions: string[];
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/30 cursor-pointer"
      />

      <div className="relative w-full max-w-[560px] rounded-[14px] border border-[#E5E7EB] bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <div className="text-[16px] font-bold text-[#111827]">Filters</div>
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 rounded-[10px] border border-[#E5E7EB] bg-white flex items-center justify-center hover:bg-[#F9FAFB] cursor-pointer"
          >
            <X className="h-4 w-4 text-[#6B7280]" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-[13px] font-semibold text-[#111827]">
                Channel
              </div>
              <Dropdown
                options={channelOptions.map((c) => ({ value: c, label: c }))}
                selectedValue={
                  value.channel !== "All" ? value.channel : undefined
                }
                onChange={(val) =>
                  onChange({ ...value, channel: val || "All" })
                }
                placeholder="All channels"
                searchPlaceholder="Search channel"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="text-[13px] font-semibold text-[#111827]">
                Order Status
              </div>
              <Dropdown
                options={orderStatusOptions.map((s) => ({
                  value: s,
                  label: s,
                }))}
                selectedValue={
                  value.orderStatus !== "All" ? value.orderStatus : undefined
                }
                onChange={(val) =>
                  onChange({ ...value, orderStatus: val || "All" })
                }
                placeholder="All statuses"
                searchPlaceholder="Search status"
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[13px] font-semibold text-[#111827]">
              Payment Status
            </div>
            <Dropdown
              options={paymentStatusOptions.map((s) => ({
                value: s,
                label: s,
              }))}
              selectedValue={
                value.paymentStatus !== "All" ? value.paymentStatus : undefined
              }
              onChange={(val) =>
                onChange({ ...value, paymentStatus: val || "All" })
              }
              placeholder="All payment statuses"
              searchPlaceholder="Search payment status"
              className="w-full"
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-[#E5E7EB] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() =>
              onChange({
                channel: "All",
                orderStatus: "All",
                paymentStatus: "All",
              })
            }
            className="h-10 px-4 rounded-[10px] border border-[#E5E7EB] bg-white text-[14px] font-medium text-[#111827] hover:bg-[#F9FAFB] cursor-pointer"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-[10px] bg-[#15BA5C] text-white text-[14px] font-semibold hover:bg-[#119E4D] cursor-pointer"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

const AllSalesTab = ({ outletId, dateRange }: AllSalesTabProps) => {
  const { selectedOutlet } = useBusinessStore();
  const effectiveOutletId = outletId ?? selectedOutlet?.id;
  const currencyCode = selectedOutlet?.currency || "USD";

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AllSalesRow[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<AllSalesFilters>({
    channel: "All",
    orderStatus: "All",
    paymentStatus: "All",
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    itemsPerPage,
    filters.channel,
    filters.orderStatus,
    filters.paymentStatus,
    effectiveOutletId,
    dateRange?.from ? dateRange.from.getTime() : 0,
    dateRange?.to ? dateRange.to.getTime() : 0,
  ]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const api = (window as any)?.electronAPI;
      if (!api?.dbQuery) {
        if (!cancelled) setRows([]);
        return;
      }

      const bounds = getRangeBounds(dateRange);
      const params: any[] = [];
      const where: string[] = [];

      if (effectiveOutletId) {
        where.push("o.outletId = ?");
        params.push(effectiveOutletId);
      }

      if (bounds) {
        where.push("COALESCE(o.createdAt, o.updatedAt) >= ?");
        where.push("COALESCE(o.createdAt, o.updatedAt) <= ?");
        params.push(bounds.startIso, bounds.endIso);
      }

      where.push("o.deletedAt IS NULL");
      where.push("LOWER(COALESCE(o.status, '')) NOT LIKE '%draft%'");
      where.push("LOWER(COALESCE(o.status, '')) NOT LIKE '%cancel%'");

      const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

      setLoading(true);
      try {
        const data = (await api.dbQuery(
          `
            SELECT
              o.id as orderId,
              COALESCE(c.name, o.recipientName, '') as customerName,
              COALESCE(o.total, o.amount, 0) as orderValue,
              COALESCE(o.orderChannel, o.orderMode, '') as channel,
              o.createdAt as createdAt,
              COALESCE(o.status, '') as orderStatus,
              COALESCE(o.paymentStatus, '') as paymentStatus,
              COALESCE(o.scheduledAt, o.createdAt) as dueDate,
              COALESCE(o.initiator, '') as initiator
            FROM orders o
            LEFT JOIN customers c ON c.id = o.customerId
            ${whereClause}
            ORDER BY COALESCE(o.updatedAt, o.createdAt) DESC
          `,
          params,
        )) as AnyRow[];

        const mapped: AllSalesRow[] = (data || []).map((r) => {
          const orderId = String(r?.orderId ?? "").trim();
          return {
            key: orderId || crypto.randomUUID(),
            orderId,
            customerName: String(r?.customerName ?? "").trim() || "-",
            orderValue: toNumber(r?.orderValue),
            channel: String(r?.channel ?? "").trim() || "-",
            createdAt: r?.createdAt ? String(r.createdAt) : null,
            orderStatus: String(r?.orderStatus ?? "").trim() || "-",
            paymentStatus: String(r?.paymentStatus ?? "").trim() || "-",
            dueDate: r?.dueDate ? String(r.dueDate) : null,
            initiator: String(r?.initiator ?? "").trim() || "-",
          };
        });

        if (!cancelled) setRows(mapped);
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [dateRange, effectiveOutletId]);

  const channelOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      const v = String(r.channel ?? "").trim();
      if (v && v !== "-") set.add(v);
    });
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [rows]);

  const orderStatusOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      const v = String(r.orderStatus ?? "").trim();
      if (v && v !== "-") set.add(v);
    });
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [rows]);

  const paymentStatusOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      const v = String(r.paymentStatus ?? "").trim();
      if (v && v !== "-") set.add(v);
    });
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [rows]);

  const filteredRows = useMemo(() => {
    let list = rows;

    const q = normalizeText(search);
    if (q) {
      list = list.filter((r) => {
        return (
          normalizeText(r.customerName).includes(q) ||
          normalizeText(r.channel).includes(q) ||
          normalizeText(r.orderStatus).includes(q) ||
          normalizeText(r.paymentStatus).includes(q)
        );
      });
    }

    if (filters.channel !== "All") {
      const v = normalizeText(filters.channel);
      list = list.filter((r) => normalizeText(r.channel) === v);
    }
    if (filters.orderStatus !== "All") {
      const v = normalizeText(filters.orderStatus);
      list = list.filter((r) => normalizeText(r.orderStatus) === v);
    }
    if (filters.paymentStatus !== "All") {
      const v = normalizeText(filters.paymentStatus);
      list = list.filter((r) => normalizeText(r.paymentStatus) === v);
    }

    return list;
  }, [
    filters.channel,
    filters.orderStatus,
    filters.paymentStatus,
    rows,
    search,
  ]);

  const totals = useMemo(() => {
    const acc = {
      totalSales: 0,
      totalOrders: 0,
      totalPaidOrders: 0,
      totalUnpaidOrders: 0,
    };

    acc.totalOrders = rows.length;
    rows.forEach((r) => {
      acc.totalSales += r.orderValue || 0;
      const p = normalizeText(r.paymentStatus);
      if (p.includes("paid") && !p.includes("partial"))
        acc.totalPaidOrders += 1;
      else if (p.includes("unpaid") || p.includes("partial"))
        acc.totalUnpaidOrders += 1;
    });

    return acc;
  }, [rows]);

  const reportsStats = useMemo(
    () => [
      {
        label: "Total Sales",
        value: formatPrice({ amount: totals.totalSales || 0, currencyCode }),
        bgColor: "#E9FBF0",
        iconColor: "#15BA5C1A",
        image: ReportsAnalysisAssets.MoneyIcon,
      },
      {
        label: "Total Orders",
        value: String(totals.totalOrders || 0),
        bgColor: "#9747FF0D",
        iconColor: "#9747FF1A",
        image: ReportsAnalysisAssets.MoneyIconPurple,
      },
      {
        label: "Total Unpaid Orders",
        value: String(totals.totalUnpaidOrders || 0),
        bgColor: "#FEE2E20D",
        iconColor: "#EF44441A",
        image: ReportsAnalysisAssets.MoneyIconRed,
      },
      {
        label: "Total Paid Orders",
        value: String(totals.totalPaidOrders || 0),
        bgColor: "#E9FBF0",
        iconColor: "#15BA5C1A",
        image: ReportsAnalysisAssets.MoneyIcon,
      },
    ],
    [
      currencyCode,
      totals.totalOrders,
      totals.totalPaidOrders,
      totals.totalSales,
      totals.totalUnpaidOrders,
    ],
  );

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredRows.length / itemsPerPage));
  }, [filteredRows.length, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const visibleRows = useMemo(() => {
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    const start = (safePage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredRows.slice(start, end);
  }, [currentPage, filteredRows, itemsPerPage, totalPages]);

  const StatsSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={`stats-sk-${i}`}
          className="p-6 px-3 rounded-xl bg-white border border-[#E5E7EB] animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded bg-gray-200" />
            <div className="h-6 w-40 rounded bg-gray-200" />
          </div>
          <div className="mt-4 h-4 w-32 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );

  const TableSkeleton = () => (
    <>
      {Array.from({ length: itemsPerPage }).map((_, i) => (
        <tr key={`sk-${i}`} className="animate-pulse">
          {Array.from({ length: 9 }).map((__, j) => (
            <td
              key={`sk-${i}-${j}`}
              className="px-6 py-4 border border-[#EEF2F7]"
            >
              <div className="h-4 w-full rounded bg-gray-200" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );

  return (
    <section className="">
      <div className="space-y-6 p-4 sm:p-6">
        {loading ? (
          <StatsSkeleton />
        ) : (
          <ReportsStatsCards reportsStats={reportsStats} columns={4} />
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[18px] font-bold text-[#111827]">All Sales</div>

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
              onClick={() => setIsFilterOpen(true)}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-[10px] border border-[#E5E7EB] bg-white text-[14px] font-medium text-[#111827] hover:bg-[#F9FAFB] cursor-pointer"
            >
              <SlidersHorizontal className="h-4 w-4 text-[#6B7280]" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        <div className="rounded-[14px] border border-[#E5E7EB] bg-white overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1200px] border border-[#EEF2F7] border-collapse">
              <thead className="bg-[#F9FAFB]">
                <tr className="text-left text-[12px] font-medium text-[#9CA3AF]">
                  <th className="px-6 py-4 border border-[#EEF2F7]">ID</th>
                  <th className="px-6 py-4 border border-[#EEF2F7]">
                    Customer Name
                  </th>
                  <th className="px-6 py-4 border border-[#EEF2F7]">
                    Order Value
                  </th>
                  <th className="px-6 py-4 border border-[#EEF2F7]">Channel</th>
                  <th className="px-6 py-4 border border-[#EEF2F7]">
                    Order Create Date
                  </th>
                  <th className="px-6 py-4 border border-[#EEF2F7]">
                    Order Status
                  </th>
                  <th className="px-6 py-4 border border-[#EEF2F7]">
                    Payment Status
                  </th>
                  <th className="px-6 py-4 border border-[#EEF2F7]">
                    Due Date
                  </th>
                  <th className="px-6 py-4 border border-[#EEF2F7]">
                    Initiator
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton />
                ) : visibleRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-12 text-center text-[14px] text-[#6B7280] border border-[#EEF2F7]"
                    >
                      No sales records found.
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((r, index) => {
                    const channel = channelPill(r.channel);
                    const orderStatus = statusPill(r.orderStatus);
                    const paymentStatus = paymentPill(r.paymentStatus);
                    const created = formatDateTimeLabel(r.createdAt);
                    const due = formatDateTimeLabel(r.dueDate);
                    return (
                      <tr key={r.key}>
                        <td className="px-6 py-4 text-[14px] font-medium text-[#15BA5C]">
                          {formatOrderIndexCode(
                            (Math.min(currentPage, totalPages) - 1) *
                              itemsPerPage +
                              index,
                          )}
                        </td>
                        <td className="px-6 py-4 text-[14px] text-[#111827] ]">
                          {r.customerName}
                        </td>
                        <td className="px-6 py-4 text-[14px] text-[#111827] ">
                          {formatPrice({
                            amount: r.orderValue || 0,
                            currencyCode,
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-medium ${channel.cls}`}
                          >
                            {channel.Icon ? (
                              <channel.Icon className="h-4 w-4" />
                            ) : null}
                            {channel.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[14px] text-[#111827]">
                          <div className="leading-5">
                            <div>{created.date}</div>
                            <div className="text-[#6B7280]">{created.time}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 ">
                          <span
                            className={`inline-flex items-center px-4 py-2 rounded-[10px] text-[13px] font-medium ${orderStatus.cls}`}
                          >
                            {orderStatus.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 ">
                          <span
                            className={`inline-flex items-center px-4 py-2 rounded-[10px] text-[13px] font-medium ${paymentStatus.cls}`}
                          >
                            {paymentStatus.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[14px] text-[#111827] ">
                          {due.date}
                        </td>
                        <td className="px-6 py-4 text-[14px] text-[#111827] ">
                          {r.initiator}
                        </td>
                      </tr>
                    );
                  })
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
            totalItems={filteredRows.length}
          />
        </div>
      </div>

      <AllSalesFilter
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        value={filters}
        onChange={setFilters}
        channelOptions={channelOptions}
        orderStatusOptions={orderStatusOptions}
        paymentStatusOptions={paymentStatusOptions}
      />
    </section>
  );
};

export default AllSalesTab;
