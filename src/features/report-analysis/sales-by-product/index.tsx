import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Search } from "lucide-react";
import ReportsStatsCards from "@/features/report-analysis/ReportsStatsCards";
import ReportsAnalysisAssets from "@/assets/images/reports-analysis";
import { Pagination } from "@/shared/Pagination/pagination";
import { Dropdown } from "@/shared/AppDropdowns/CreateDropdown";
import { formatPrice } from "@/utils/formatPrice";
import { useBusinessStore } from "@/stores/useBusinessStore";

type SalesByProductTabsProps = {
  outletId?: string;
  dateRange?: DateRange;
};

type AnyRow = Record<string, any>;

type SalesByProductRow = {
  key: string;
  productId: string;
  productCode: string;
  productName: string;
  categoryName: string;
  unitPrice: number;
  totalSales: number;
  amountSold: number;
  tax: number;
  net: number;
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

const formatProductIndexCode = (index: number) => {
  const n = Math.max(0, index);
  return `PRD${String(n + 1).padStart(3, "0")}`;
};

const SalesByProductTabs = ({
  outletId,
  dateRange,
}: SalesByProductTabsProps) => {
  const { selectedOutlet } = useBusinessStore();
  const effectiveOutletId = outletId ?? selectedOutlet?.id;
  const currencyCode = selectedOutlet?.currency || "USD";

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<SalesByProductRow[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    selectedCategory,
    itemsPerPage,
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

      setLoading(true);
      try {
        const baseParams: any[] = [];
        const where: string[] = [];

        if (effectiveOutletId) {
          where.push("o.outletId = ?");
          baseParams.push(effectiveOutletId);
        }

        if (bounds) {
          where.push("COALESCE(o.createdAt, o.updatedAt) >= ?");
          where.push("COALESCE(o.createdAt, o.updatedAt) <= ?");
          baseParams.push(bounds.startIso, bounds.endIso);
        }

        where.push("o.deletedAt IS NULL");
        where.push("LOWER(COALESCE(o.status, '')) NOT LIKE '%draft%'");
        where.push("LOWER(COALESCE(o.status, '')) NOT LIKE '%cancel%'");

        const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

        const raw = (await api.dbQuery(
          `
            WITH cart_totals AS (
              SELECT
                ci.cartId as cartId,
                SUM(
                  COALESCE(ci.quantity, 0) *
                  (
                    COALESCE(ci.unitPrice, 0) +
                    COALESCE(ci.priceTierMarkup, 0) -
                    COALESCE(ci.priceTierDiscount, 0)
                  )
                ) as cartGross
              FROM cart_item ci
              GROUP BY ci.cartId
            )
            SELECT
              ci.productId as productId,
              COALESCE(p.productCode, p.id, ci.productId) as productCode,
              COALESCE(p.name, '') as productName,
              COALESCE(p.category, '') as categoryName,
              AVG(COALESCE(ci.unitPrice, 0)) as unitPrice,
              SUM(COALESCE(ci.quantity, 0)) as amountSold,
              SUM(
                COALESCE(ci.quantity, 0) *
                (
                  COALESCE(ci.unitPrice, 0) +
                  COALESCE(ci.priceTierMarkup, 0) -
                  COALESCE(ci.priceTierDiscount, 0)
                )
              ) as totalSales,
              SUM(
                COALESCE(o.tax, 0) *
                (
                  (
                    COALESCE(ci.quantity, 0) *
                    (
                      COALESCE(ci.unitPrice, 0) +
                      COALESCE(ci.priceTierMarkup, 0) -
                      COALESCE(ci.priceTierDiscount, 0)
                    )
                  ) / NULLIF(ct.cartGross, 0)
                )
              ) as tax
            FROM cart_item ci
            JOIN orders o ON o.cartId = ci.cartId
            JOIN cart_totals ct ON ct.cartId = ci.cartId
            LEFT JOIN product p ON p.id = ci.productId
            ${whereClause}
            GROUP BY productId, productCode, productName, categoryName
            ORDER BY totalSales DESC
          `,
          baseParams,
        )) as AnyRow[];

        const mapped: SalesByProductRow[] = (raw || [])
          .map((r) => {
            const productId = String(r?.productId ?? "").trim();
            const productCode = String(r?.productCode ?? "").trim();
            const productName = String(r?.productName ?? "").trim();
            const categoryName = String(r?.categoryName ?? "").trim();

            const unitPrice = toNumber(r?.unitPrice);
            const totalSales = toNumber(r?.totalSales);
            const amountSold = toNumber(r?.amountSold);
            const tax = toNumber(r?.tax);
            const net = totalSales - tax;

            const key = productId || productName || crypto.randomUUID();

            return {
              key,
              productId: productId || "-",
              productCode: productCode || "-",
              productName: productName || "-",
              categoryName: categoryName || "-",
              unitPrice,
              totalSales,
              amountSold,
              tax,
              net,
            };
          })
          .filter((r) => r.productId !== "-" && r.productId !== "");

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

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      const c = String(r.categoryName ?? "").trim();
      if (c && c !== "-") set.add(c);
    });

    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [rows]);

  const filteredRows = useMemo(() => {
    let list = rows;

    const q = normalizeText(search);
    if (q) {
      list = list.filter((r) => {
        const name = normalizeText(r.productName);
        const code = normalizeText(r.productCode);
        const cat = normalizeText(r.categoryName);
        return name.includes(q) || code.includes(q) || cat.includes(q);
      });
    }

    if (selectedCategory !== "All") {
      const s = normalizeText(selectedCategory);
      list = list.filter((r) => normalizeText(r.categoryName) === s);
    }

    return list;
  }, [rows, search, selectedCategory]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.totalProductsSold += r.amountSold;
        acc.totalSales += r.totalSales;
        acc.totalTax += r.tax;
        acc.totalNet += r.net;
        return acc;
      },
      {
        totalProductsSold: 0,
        totalSales: 0,
        totalTax: 0,
        totalNet: 0,
      },
    );
  }, [rows]);

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

  const reportsStats = useMemo(
    () => [
      {
        label: "Total Products Sold",
        value: String(Math.round(totals.totalProductsSold || 0)),
        bgColor: "#E9FBF0",
        iconColor: "#15BA5C1A",
        image: ReportsAnalysisAssets.MoneyIcon,
      },
      {
        label: "Total Sales",
        value: formatPrice({ amount: totals.totalSales || 0, currencyCode }),
        bgColor: "#9747FF0D",
        iconColor: "#9747FF1A",
        image: ReportsAnalysisAssets.MoneyIconPurple,
      },
      {
        label: "Total Tax",
        value: formatPrice({ amount: totals.totalTax || 0, currencyCode }),
        bgColor: "#FEE2E20D",
        iconColor: "#EF44441A",
        image: ReportsAnalysisAssets.MoneyIconRed,
      },
      {
        label: "Total Net",
        value: formatPrice({ amount: totals.totalNet || 0, currencyCode }),
        bgColor: "#E9FBF0",
        iconColor: "#15BA5C1A",
        image: ReportsAnalysisAssets.MoneyIcon,
      },
    ],
    [
      currencyCode,
      totals.totalNet,
      totals.totalProductsSold,
      totals.totalSales,
      totals.totalTax,
    ],
  );

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
          {Array.from({ length: 8 }).map((__, j) => (
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
          <div className="text-[18px] font-bold text-[#111827]">
            Sales by Product
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

            <div className="w-full sm:w-[220px]">
              <Dropdown
                options={[
                  { value: "All", label: "All categories" },
                  ...categoryOptions
                    .filter((c) => c !== "All")
                    .map((c) => ({ value: c, label: c })),
                ]}
                selectedValue={
                  selectedCategory !== "All" ? selectedCategory : undefined
                }
                onChange={(val) => setSelectedCategory(val || "All")}
                placeholder="Select category"
                searchPlaceholder="Search category"
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="rounded-[14px] border border-[#E5E7EB] bg-white overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1100px] border border-[#EEF2F7] border-collapse">
              <thead className="bg-[#F9FAFB]">
                <tr className="text-left text-[12px] font-medium text-[#9CA3AF]">
                  <th className="px-6 py-4 border border-[#EEF2F7]">ID</th>
                  <th className="px-6 py-4 border border-[#EEF2F7]">
                    Product Name
                  </th>
                  <th className="px-6 py-4 border border-[#EEF2F7]">
                    Product Category
                  </th>
                  <th className="px-6 py-4 border border-[#EEF2F7]">
                    Unit Price
                  </th>
                  <th className="px-6 py-4 border border-[#EEF2F7]">
                    Total Sales
                  </th>
                  <th className="px-6 py-4 border border-[#EEF2F7]">
                    Amount sold
                  </th>
                  <th className="px-6 py-4 border border-[#EEF2F7]">Tax</th>
                  <th className="px-6 py-4 border border-[#EEF2F7]">Net</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton />
                ) : visibleRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-[14px] text-[#6B7280] border border-[#EEF2F7]"
                    >
                      No sales records found.
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((r, index) => (
                    <tr key={r.key}>
                      <td className="px-6 py-4 text-[14px] text-[#111827] ">
                        {formatProductIndexCode(
                          (Math.min(currentPage, totalPages) - 1) *
                            itemsPerPage +
                            index,
                        )}
                      </td>
                      <td className="px-6 py-4 text-[14px] font-medium text-[#111827] ">
                        {r.productName}
                      </td>
                      <td className="px-6 py-4 ">
                        <span className="inline-flex items-center px-4 py-2 rounded-[10px] border border-[#BBF7D0] bg-[#ECFDF5] text-[#15BA5C] text-[13px] font-medium">
                          {r.categoryName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#111827] ">
                        {formatPrice({
                          amount: r.unitPrice || 0,
                          currencyCode,
                        })}
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#111827] ">
                        {formatPrice({
                          amount: r.totalSales || 0,
                          currencyCode,
                        })}
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#111827] ">
                        {Math.round(r.amountSold || 0)}
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#111827] ">
                        {formatPrice({ amount: r.tax || 0, currencyCode })}
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#111827] ">
                        {formatPrice({ amount: r.net || 0, currencyCode })}
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
            totalItems={filteredRows.length}
          />
        </div>
      </div>
    </section>
  );
};

export default SalesByProductTabs;
