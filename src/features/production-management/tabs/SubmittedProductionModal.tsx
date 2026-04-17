"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Info, Search, SlidersHorizontal } from "lucide-react";
import { format } from "date-fns";
import { Pagination } from "@/shared/Pagination/pagination";
import { useBusinessStore } from "@/stores/useBusinessStore";
import NotFound from "@/features/inventory/NotFound";
import { ProductionV2Status } from "../../../../electron/types/productionV2.types";

type SubmittedScheduleRow = {
  id: string;
  batchId: string | null;
  status: string | null;
  productionDueDate: string | null;
  productionTime: string | null;
  ordersCount: number;
};

const statusPill = (status: string | null | undefined) => {
  const s = String(status || "")
    .trim()
    .toLowerCase();
  if (s.includes("inventory_approved")) {
    return { label: "Approved", cls: "bg-[#DCFCE7] text-[#16A34A]" };
  }
  if (s.includes("inventory_pending")) {
    return { label: "Pending", cls: "bg-gray-100 text-gray-500" };
  }
  if (s.includes("in_preparation")) {
    return { label: "In preparation", cls: "bg-[#FEF3C7] text-[#B45309]" };
  }
  if (s.includes("quality_control")) {
    return { label: "Quality Control", cls: "bg-[#F3E8FF] text-[#A855F7]" };
  }
  if (s.includes("ready")) {
    return { label: "Ready", cls: "bg-[#DCFCE7] text-[#16A34A]" };
  }
  if (s.includes("cancel")) {
    return { label: "Cancelled", cls: "bg-[#FEE2E2] text-[#EF4444]" };
  }
  return { label: status || "-", cls: "bg-gray-100 text-gray-500" };
};

const formatDueDate = (dueDate: string | null, dueTime: string | null) => {
  const raw = dueDate || null;
  if (!raw) return "-";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "-";

  const dateLabel = format(d, "yyyy-MM-dd");
  if (!dueTime) return `${dateLabel} || -`;

  const time = String(dueTime).trim();
  if (!time) return `${dateLabel} || -`;
  return `${dateLabel} || ${time}`;
};

const SubmittedProductionModal = () => {
  const selectedOutlet = useBusinessStore((s) => s.selectedOutlet);

  const [statusFilter, setStatusFilter] = useState<
    "All" | "Approved" | "Rejected" | "Pending"
  >("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState<SubmittedScheduleRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, selectedOutlet?.id]);

  const fetchRows = useCallback(async () => {
    if (!selectedOutlet?.id) return;
    const api: any = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    setIsLoading(true);
    try {
      const where: string[] = ["p.outletId = ?"];
      const params: any[] = [selectedOutlet.id];

      where.push("LOWER(COALESCE(p.status, '')) IN (LOWER(?), LOWER(?))");
      params.push(
        ProductionV2Status.INVENTORY_PENDING,
        ProductionV2Status.INVENTORY_APPROVED,
      );

      if (statusFilter !== "All") {
        if (statusFilter === "Approved") {
          where.push("LOWER(COALESCE(p.status, '')) = LOWER(?)");
          params.push(ProductionV2Status.INVENTORY_APPROVED);
        } else if (statusFilter === "Pending") {
          where.push("LOWER(COALESCE(p.status, '')) = LOWER(?)");
          params.push(ProductionV2Status.INVENTORY_PENDING);
        } else {
          where.push("1 = 0");
        }
      }

      const q = searchTerm.trim();
      if (q) {
        where.push("(p.batchId LIKE ? OR p.scheduleId LIKE ? OR p.id LIKE ?)");
        const pattern = `%${q}%`;
        params.push(pattern, pattern, pattern);
      }

      const whereClause = `WHERE ${where.join(" AND ")}`;

      const countRows = await api.dbQuery(
        `
          SELECT COUNT(*) as count
          FROM productions_v2 p
          ${whereClause}
        `,
        params,
      );
      const count = Number(countRows?.[0]?.count || 0);
      setTotalCount(count);

      const totalPagesLocal = Math.max(1, Math.ceil(count / itemsPerPage));
      const safePage = Math.min(Math.max(1, currentPage), totalPagesLocal);
      if (safePage !== currentPage) {
        setCurrentPage(safePage);
        return;
      }

      const offset = (currentPage - 1) * itemsPerPage;
      const data = await api.dbQuery(
        `
          SELECT
            p.id as id,
            p.batchId as batchId,
            p.status as status,
            p.productionDueDate as productionDueDate,
            p.productionTime as productionTime,
            (
              SELECT COUNT(*)
              FROM production_v2_items pi
              WHERE pi.productionId = p.id
            ) as ordersCount
          FROM productions_v2 p
          ${whereClause}
          ORDER BY COALESCE(p.updatedAt, p.createdAt) DESC
          LIMIT ? OFFSET ?
        `,
        [...params, itemsPerPage, offset],
      );

      setRows(
        (data || []).map((r: any) => ({
          id: String(r.id || ""),
          batchId: r.batchId != null ? String(r.batchId) : null,
          status: r.status != null ? String(r.status) : null,
          productionDueDate:
            r.productionDueDate != null ? String(r.productionDueDate) : null,
          productionTime:
            r.productionTime != null ? String(r.productionTime) : null,
          ordersCount: Number(r.ordersCount || 0),
        })),
      );
    } catch (e) {
      console.error("Failed to fetch submitted schedules:", e);
      setRows([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, selectedOutlet?.id, statusFilter]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalCount / itemsPerPage));
  }, [itemsPerPage, totalCount]);

  const updateScheduleStatus = useCallback(
    async (row: SubmittedScheduleRow, nextStatus: string) => {
      if (!selectedOutlet?.id) return;
      const api: any = (window as any).electronAPI;
      if (!api?.dbQuery) return;

      try {
        const now = new Date().toISOString();
        await api.dbQuery(
          `
            UPDATE productions
            SET
              status = ?,
              previousStatus = ?,
              updatedAt = ?,
              version = COALESCE(version, 0) + 1
            WHERE id = ? AND outletId = ?
          `,
          [nextStatus, row.status || null, now, row.id, selectedOutlet.id],
        );

        if (api.queueAdd) {
          const rec = await api.dbQuery(
            "SELECT * FROM productions_v2 WHERE id = ?",
            [row.id],
          );
          if (rec?.[0]) {
            await api.queueAdd({
              table: "productions_v2",
              action: "UPDATE",
              data: rec[0],
              id: row.id,
            });
          }
        }
        await fetchRows();
      } catch (e) {
        console.error("Failed to update submitted schedule:", e);
      }
    },
    [fetchRows, selectedOutlet?.id],
  );

  return (
    <div className="px-4 sm:px-6 py-6 bg-white">
      <div className="flex flex-col gap-4 w-full">
        <h2 className="text-[18px] font-semibold text-[#111827]">
          Submitted Schedules
        </h2>

        <div className="flex justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as typeof statusFilter)
                  }
                  className="h-11 w-[140px] pl-4 pr-10 bg-white border border-gray-200 rounded-l-[10px] text-[14px] text-[#111827] outline-none appearance-none"
                >
                  <option value="All">All</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Pending">Pending</option>
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <ChevronDown className="size-4" />
                </div>
              </div>
              <button
                type="button"
                className="h-11 w-11 bg-[#15BA5C] text-white rounded-r-[10px] flex items-center justify-center cursor-pointer"
                aria-label="Open status filter"
              >
                <ChevronDown className="size-4" />
              </button>
            </div>

            <button
              type="button"
              className="h-11 px-4 bg-white border border-gray-200 rounded-[10px] text-[14px] text-[#111827] flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <SlidersHorizontal className="size-4 text-gray-400" />
              Filters
            </button>
          </div>

          <div className="flex items-center w-full md:w-auto md:min-w-[360px]">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search"
              className="h-11 flex-1 px-4 bg-white border border-gray-200 rounded-l-[10px] text-[14px] outline-none"
            />
            <button
              type="button"
              className="h-11 w-11 bg-[#15BA5C] rounded-r-[10px] flex items-center justify-center cursor-pointer"
              aria-label="Search"
            >
              <Search className="size-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-[12px] bg-white">
        <table className="w-full text-left border-collapse min-w-[920px]">
          <thead className="bg-[#F9FAFB]">
            <tr>
              <th className="px-4 py-4 text-[13px] font-medium text-gray-500">
                Batch Number
              </th>
              <th className="px-4 py-4 text-[13px] font-medium text-gray-500">
                Amount of Orders
              </th>
              <th className="px-4 py-4 text-[13px] font-medium text-gray-500">
                Status
              </th>
              <th className="px-4 py-4 text-[13px] font-medium text-gray-500">
                Due Date
              </th>
              <th className="px-4 py-4 text-[13px] font-medium text-gray-500 text-center">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {isLoading
              ? [...Array(7)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-4 py-6">
                        <div className="h-4 bg-gray-100 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((r) => {
                  const pill = statusPill(r.status);
                  const raw = String(r.status || "").toLowerCase();
                  const isPending = raw.includes("inventory_pending");
                  const isApproved = raw.includes("inventory_approved");
                  const primaryLabel = isPending
                    ? "Approve Inventory"
                    : "Start Production";
                  const primaryNextStatus = isPending
                    ? ProductionV2Status.INVENTORY_APPROVED
                    : ProductionV2Status.IN_PREPARATION;
                  const primaryDisabled =
                    raw.includes("cancel") || (!isPending && !isApproved);

                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-6">
                        <span className="text-[14px] font-medium text-[#15BA5C]">
                          {r.batchId || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-6">
                        <span className="text-[14px] text-[#111827]">
                          {r.ordersCount}
                        </span>
                      </td>
                      <td className="px-4 py-6">
                        <div className="inline-flex items-center gap-2">
                          <span
                            className={`px-4 h-9 inline-flex items-center rounded-[10px] text-[12px] font-medium ${pill.cls}`}
                          >
                            {pill.label}
                          </span>
                          {pill.label === "Rejected" ? (
                            <span className="inline-flex items-center justify-center size-6 rounded-full bg-[#FEE2E2]">
                              <Info className="size-4 text-[#EF4444]" />
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-6">
                        <span className="text-[14px] text-[#111827]">
                          {formatDueDate(r.productionDueDate, r.productionTime)}
                        </span>
                      </td>
                      <td className="px-4 py-6">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              updateScheduleStatus(r, primaryNextStatus)
                            }
                            disabled={primaryDisabled}
                            className={`h-10 px-4 rounded-[10px] text-[13px] font-medium transition-colors cursor-pointer ${
                              primaryDisabled
                                ? "bg-gray-200 text-white cursor-not-allowed"
                                : "bg-[#15BA5C] text-white hover:bg-[#119E4D]"
                            }`}
                          >
                            {primaryLabel}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateScheduleStatus(
                                r,
                                ProductionV2Status.CANCELLED,
                              )
                            }
                            disabled={raw.includes("cancel")}
                            className={`h-10 px-4 rounded-[10px] text-[13px] font-medium transition-colors cursor-pointer ${
                              raw.includes("cancel")
                                ? "bg-[#FCA5A5] text-white cursor-not-allowed"
                                : "bg-[#EF4444] text-white hover:bg-[#DC2626]"
                            }`}
                          >
                            Cancel Schedule
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {!isLoading && rows.length === 0 && (
        <div className="px-6 py-8">
          <NotFound
            title="No Submitted Schedules"
            description="You don’t have any submitted schedules yet."
          />
        </div>
      )}

      {!isLoading && totalCount > 0 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(n) => {
              setItemsPerPage(n);
              setCurrentPage(1);
            }}
            totalItems={totalCount}
          />
        </div>
      )}
    </div>
  );
};

export default SubmittedProductionModal;
