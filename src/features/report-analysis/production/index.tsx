import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Download, Search, SlidersHorizontal, X } from "lucide-react";
import ReportsStatsCards from "@/features/report-analysis/ReportsStatsCards";
import ReportsAnalysisAssets from "@/assets/images/reports-analysis";
import { Pagination } from "@/shared/Pagination/pagination";
import { useBusinessStore } from "@/stores/useBusinessStore";

type ProductionTabsTypeProps = {
  outletId?: string;
  dateRange?: DateRange;
};

type AnyRow = Record<string, any>;

type ProductionRow = {
  key: string;
  scheduleId: string;
  batchId: string;
  status: string;
  productionDate: string | null;
  productionTime: string | null;
  initiator: string;
};

type ProductionFilters = {
  status: string;
};

const normalizeText = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const getRangeBounds = (range: DateRange | undefined) => {
  if (!range?.from) return null;
  const start = new Date(range.from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(range.to ?? range.from);
  end.setHours(23, 59, 59, 999);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
};

const toNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatScheduledDateLabel = (
  productionDate: string | null,
  productionTime: string | null,
) => {
  const date = String(productionDate ?? "").trim();
  const time = String(productionTime ?? "").trim();

  if (!date) return { date: "-", time: "-" };
  if (!time) return { date, time: "-" };

  return { date, time };
};

const statusPill = (status: string) => {
  const s = normalizeText(status);
  if (!s) return { label: "-", cls: "bg-[#F3F4F6] text-[#6B7280]" };

  if (s.includes("submitted")) {
    return { label: "Submitted", cls: "bg-[#E9FBF0] text-[#15BA5C]" };
  }
  if (s.includes("in production") || s.includes("in_production")) {
    return { label: "In Production", cls: "bg-[#F3E8FF] text-[#7C3AED]" };
  }
  if (s.includes("preparation")) {
    return { label: "In Preparation", cls: "bg-[#FEF3C7] text-[#B45309]" };
  }
  if (s.includes("schedule")) {
    return {
      label: "Schedule for Production",
      cls: "bg-[#FFEFE5] text-[#F97316]",
    };
  }
  if (s.includes("quality")) {
    return { label: "Quality Control", cls: "bg-[#DBEAFE] text-[#2563EB]" };
  }
  if (s.includes("ready")) {
    return { label: "Ready", cls: "bg-[#E9FBF0] text-[#15BA5C]" };
  }

  return { label: status, cls: "bg-[#F3F4F6] text-[#6B7280]" };
};

const ProductionReportFilter = ({
  isOpen,
  onClose,
  value,
  onChange,
  statusOptions,
}: {
  isOpen: boolean;
  onClose: () => void;
  value: ProductionFilters;
  onChange: (next: ProductionFilters) => void;
  statusOptions: { value: string; label: string }[];
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/30 cursor-pointer"
      />

      <div className="relative w-full max-w-[520px] rounded-[14px] border border-[#E5E7EB] bg-white overflow-hidden">
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

        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <div className="text-[13px] font-semibold text-[#111827]">
              Status
            </div>
            <div className="relative">
              <select
                value={value.status}
                onChange={(e) => onChange({ ...value, status: e.target.value })}
                className="w-full h-11 px-4 border border-[#E5E7EB] rounded-[12px] bg-white text-[14px] text-[#111827] outline-none focus:border-[#15BA5C] cursor-pointer"
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-[#E5E7EB] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => onChange({ status: "All" })}
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

const ProductionTabReport = ({
  outletId,
  dateRange,
}: ProductionTabsTypeProps) => {
  const { selectedOutlet } = useBusinessStore();
  const effectiveOutletId = outletId ?? selectedOutlet?.id;

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ProductionRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalProductsInOrders, setTotalProductsInOrders] = useState(0);
  const [totalSchedules, setTotalSchedules] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<ProductionFilters>({ status: "All" });
  const [statusOptions, setStatusOptions] = useState<
    { value: string; label: string }[]
  >([{ value: "All", label: "All" }]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    itemsPerPage,
    filters.status,
    effectiveOutletId,
    dateRange?.from ? dateRange.from.getTime() : 0,
    dateRange?.to ? dateRange.to.getTime() : 0,
  ]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const api = (window as any)?.electronAPI;
      if (!api?.dbQuery) {
        if (!cancelled) {
          setRows([]);
          setTotalCount(0);
          setTotalOrders(0);
          setTotalProductsInOrders(0);
          setTotalSchedules(0);
          setStatusOptions([{ value: "All", label: "All" }]);
        }
        return;
      }

      const bounds = getRangeBounds(dateRange);
      const paramsBase: any[] = [];
      const where: string[] = [];

      if (effectiveOutletId) {
        where.push("p.outletId = ?");
        paramsBase.push(effectiveOutletId);
      }
      if (bounds) {
        where.push("COALESCE(p.createdAt, p.updatedAt) >= ?");
        where.push("COALESCE(p.createdAt, p.updatedAt) <= ?");
        paramsBase.push(bounds.startIso, bounds.endIso);
      }

      const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

      setLoading(true);
      try {
        const statusWhereClause = where.length
          ? `WHERE ${where.join(" AND ")} AND COALESCE(p.status, '') != ''`
          : "WHERE COALESCE(p.status, '') != ''";

        const statusRows = (await api.dbQuery(
          `
            SELECT DISTINCT COALESCE(status, '') as status
            FROM productions p
            ${statusWhereClause}
            ORDER BY status ASC
          `,
          paramsBase,
        )) as AnyRow[];
        const opts = [
          { value: "All", label: "All" },
          ...(statusRows || [])
            .map((r) => String(r?.status ?? "").trim())
            .filter(Boolean)
            .map((s) => ({ value: s, label: s })),
        ];
        if (!cancelled) setStatusOptions(opts);

        const orderWhere: string[] = [];
        const orderParams: any[] = [];
        if (effectiveOutletId) {
          orderWhere.push("o.outletId = ?");
          orderParams.push(effectiveOutletId);
        }
        if (bounds) {
          orderWhere.push("o.createdAt >= ?");
          orderWhere.push("o.createdAt <= ?");
          orderParams.push(bounds.startIso, bounds.endIso);
        }
        orderWhere.push("LOWER(COALESCE(o.status, '')) NOT LIKE '%draft%'");
        orderWhere.push("LOWER(COALESCE(o.status, '')) NOT LIKE '%cancel%'");
        const orderWhereClause = `WHERE ${orderWhere.join(" AND ")}`;

        const [countOrdersRows, productQtyRows, schedulesCountRows] =
          await Promise.all([
            api.dbQuery(
              `
                SELECT COUNT(*) as count
                FROM orders o
                ${orderWhereClause}
              `,
              orderParams,
            ),
            api.dbQuery(
              `
                SELECT SUM(COALESCE(ci.quantity, 0)) as qty
                FROM cart_item ci
                JOIN orders o ON o.cartId = ci.cartId
                ${orderWhereClause}
              `,
              orderParams,
            ),
            api.dbQuery(
              `
                SELECT COUNT(*) as count
                FROM productions p
                ${whereClause}
              `,
              paramsBase,
            ),
          ]);

        if (!cancelled) {
          setTotalOrders(toNumber(countOrdersRows?.[0]?.count));
          setTotalProductsInOrders(toNumber(productQtyRows?.[0]?.qty));
          setTotalSchedules(toNumber(schedulesCountRows?.[0]?.count));
        }

        const searchQ = search.trim();
        const dataWhere: string[] = [...where];
        const dataParams: any[] = [...paramsBase];
        if (filters.status !== "All") {
          dataWhere.push("p.status = ?");
          dataParams.push(filters.status);
        }
        if (searchQ) {
          dataWhere.push(
            "(p.scheduleId LIKE ? OR p.batchId LIKE ? OR p.status LIKE ? OR p.initiator LIKE ? OR p.id LIKE ?)",
          );
          const pat = `%${searchQ}%`;
          dataParams.push(pat, pat, pat, pat, pat);
        }
        const dataWhereClause = dataWhere.length
          ? `WHERE ${dataWhere.join(" AND ")}`
          : "";

        const countRows = (await api.dbQuery(
          `
            SELECT COUNT(*) as count
            FROM productions p
            ${dataWhereClause}
          `,
          dataParams,
        )) as AnyRow[];
        const count = toNumber(countRows?.[0]?.count);
        if (!cancelled) setTotalCount(count);

        const totalPagesLocal = Math.max(1, Math.ceil(count / itemsPerPage));
        const safePage = Math.min(Math.max(1, currentPage), totalPagesLocal);
        if (safePage !== currentPage) {
          if (!cancelled) setCurrentPage(safePage);
          return;
        }

        const offset = (safePage - 1) * itemsPerPage;
        const data = (await api.dbQuery(
          `
            SELECT
              COALESCE(p.scheduleId, p.id) as scheduleId,
              COALESCE(p.batchId, '') as batchId,
              COALESCE(p.status, '') as status,
              p.productionDate as productionDate,
              p.productionTime as productionTime,
              COALESCE(p.initiator, '') as initiator,
              COALESCE(p.id, '') as id
            FROM productions p
            ${dataWhereClause}
            ORDER BY COALESCE(p.updatedAt, p.createdAt) DESC
            LIMIT ? OFFSET ?
          `,
          [...dataParams, itemsPerPage, offset],
        )) as AnyRow[];

        const mapped: ProductionRow[] = (data || []).map((r) => ({
          key: String(r?.id ?? r?.scheduleId ?? crypto.randomUUID()),
          scheduleId: String(r?.scheduleId ?? "").trim() || "-",
          batchId: String(r?.batchId ?? "").trim() || "-",
          status: String(r?.status ?? "").trim() || "-",
          productionDate: r?.productionDate ? String(r.productionDate) : null,
          productionTime: r?.productionTime ? String(r.productionTime) : null,
          initiator: String(r?.initiator ?? "").trim() || "-",
        }));

        if (!cancelled) setRows(mapped);
      } catch {
        if (!cancelled) {
          setRows([]);
          setTotalCount(0);
          setTotalOrders(0);
          setTotalProductsInOrders(0);
          setTotalSchedules(0);
          setStatusOptions([{ value: "All", label: "All" }]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [
    currentPage,
    dateRange,
    effectiveOutletId,
    filters.status,
    itemsPerPage,
    search,
  ]);

  const reportsStats = useMemo(
    () => [
      {
        label: "Total Orders",
        value: String(totalOrders || 0),
        bgColor: "#E9FBF0",
        iconColor: "#15BA5C1A",
        image: ReportsAnalysisAssets.MoneyIcon,
      },
      {
        label: "Total Products in Orders",
        value: String(totalProductsInOrders || 0),
        bgColor: "#FEF3C70D",
        iconColor: "#B453091A",
        image: ReportsAnalysisAssets.MoneyIcon,
      },
      {
        label: "Production Schedule Created",
        value: String(totalSchedules || 0),
        bgColor: "#9747FF0D",
        iconColor: "#9747FF1A",
        image: ReportsAnalysisAssets.MoneyIconPurple,
      },
    ],
    [totalOrders, totalProductsInOrders, totalSchedules],
  );

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalCount / itemsPerPage));
  }, [itemsPerPage, totalCount]);

  const TableSkeleton = () => (
    <>
      {Array.from({ length: itemsPerPage }).map((_, i) => (
        <tr key={`sk-${i}`} className="animate-pulse">
          {Array.from({ length: 6 }).map((__, j) => (
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

  const StatsSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
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

  return (
    <section className="">
      <div className="space-y-6 p-4 sm:p-6">
        {loading ? (
          <StatsSkeleton />
        ) : (
          <ReportsStatsCards reportsStats={reportsStats} columns={3} />
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[18px] font-bold text-[#111827]">
            Production Breakdown
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
            <table className="w-full min-w-[980px] border border-[#EEF2F7] border-collapse">
              <thead className="bg-[#F9FAFB]">
                <tr className="text-left text-[12px] font-medium text-[#9CA3AF]">
                  <th className="px-6 py-4 border border-[#EEF2F7]">
                    Schedule ID
                  </th>
                  <th className="px-6 py-4 border border-[#EEF2F7]">
                    Batch Number
                  </th>
                  <th className="px-6 py-4 border border-[#EEF2F7]">Status</th>
                  <th className="px-6 py-4 border border-[#EEF2F7]">
                    Scheduled Date
                  </th>
                  <th className="px-6 py-4 border border-[#EEF2F7]">
                    Initiated by
                  </th>
                  <th className="px-6 py-4 border border-[#EEF2F7]">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton />
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-[14px] text-[#6B7280] border border-[#EEF2F7]"
                    >
                      No production records found.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const pill = statusPill(r.status);
                    const scheduled = formatScheduledDateLabel(
                      r.productionDate,
                      r.productionTime,
                    );
                    return (
                      <tr key={r.key}>
                        <td className="px-6 py-4 text-[14px] font-medium text-[#15BA5C] border border-[#EEF2F7]">
                          {r.scheduleId}
                        </td>
                        <td className="px-6 py-4 text-[14px] text-[#111827] border border-[#EEF2F7]">
                          {r.batchId}
                        </td>
                        <td className="px-6 py-4 border border-[#EEF2F7]">
                          <span
                            className={`inline-flex items-center px-4 py-2 rounded-[10px] text-[13px] font-medium ${pill.cls}`}
                          >
                            {pill.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[14px] text-[#111827] border border-[#EEF2F7]">
                          <div className="leading-5">
                            <div>{scheduled.date}</div>
                            <div className="text-[#6B7280]">
                              {scheduled.time}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[14px] text-[#111827] border border-[#EEF2F7]">
                          {r.initiator}
                        </td>
                        <td className="px-6 py-4 border border-[#EEF2F7]">
                          <button
                            type="button"
                            className="h-10 w-10 rounded-[10px] border border-[#E5E7EB] bg-white flex items-center justify-center hover:bg-[#F9FAFB] cursor-pointer"
                          >
                            <Download className="h-4 w-4 text-[#111827]" />
                          </button>
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
            totalItems={totalCount}
          />
        </div>
      </div>

      <ProductionReportFilter
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        value={filters}
        onChange={setFilters}
        statusOptions={statusOptions}
      />
    </section>
  );
};

export default ProductionTabReport;
