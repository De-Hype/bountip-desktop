"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Search, Send, SlidersHorizontal, X } from "lucide-react";
import { Pagination } from "@/shared/Pagination/pagination";
import { useBusinessStore } from "@/stores/useBusinessStore";
import NotFound from "@/features/inventory/NotFound";
import { ProductionV2Status } from "../../../../electron/types/productionV2.types";
import { useAuthStore } from "@/stores/authStore";

type ScheduledRow = {
  id: string;
  batchId: string | null;
  status: string | null;
  updatedAt: string | null;
  createdAt: string | null;
  ordersCount: number;
};

const QualityControlModal = () => {
  const selectedOutlet = useBusinessStore((s) => s.selectedOutlet);
  const authUser = useAuthStore((s) => s.user);

  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState<ScheduledRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
  const [transitionRow, setTransitionRow] = useState<ScheduledRow | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const closeTransitionModal = useCallback(() => {
    setIsTransitionModalOpen(false);
    setTransitionRow(null);
    setIsTransitioning(false);
  }, []);

  const openTransitionModal = useCallback((row: ScheduledRow) => {
    setTransitionRow(row);
    setIsTransitionModalOpen(true);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedOutlet?.id]);

  const fetchRows = useCallback(async () => {
    if (!selectedOutlet?.id) return;
    const api: any = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    setIsLoading(true);
    try {
      const where: string[] = ["p.outletId = ?"];
      const params: any[] = [selectedOutlet.id];

      where.push("LOWER(COALESCE(p.status, '')) = LOWER(?)");
      params.push(ProductionV2Status.QUALITY_CONTROL);

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
            p.createdAt as createdAt,
            p.updatedAt as updatedAt,
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
          createdAt: r.createdAt != null ? String(r.createdAt) : null,
          updatedAt: r.updatedAt != null ? String(r.updatedAt) : null,
          ordersCount: Number(r.ordersCount || 0),
        })),
      );
    } catch (e) {
      console.error("Failed to fetch quality control productions:", e);
      setRows([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, selectedOutlet?.id]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalCount / itemsPerPage));
  }, [itemsPerPage, totalCount]);

  const markAsReady = useCallback(
    async (row: ScheduledRow) => {
      if (!selectedOutlet?.id) return;
      const api: any = (window as any).electronAPI;
      if (!api?.dbQuery) return;
      try {
        setIsTransitioning(true);
        const now = new Date().toISOString();
        const actor = authUser?.name || authUser?.email || "";
        await api.dbQuery(
          `
            UPDATE productions_v2
            SET
              status = ?,
              previousStatus = ?,
              readyAt = ?,
              qcApprovedBy = ?,
              updatedAt = ?,
              version = COALESCE(version, 0) + 1
            WHERE id = ? AND outletId = ?
          `,
          [
            ProductionV2Status.READY,
            row.status || null,
            now,
            actor || null,
            now,
            row.id,
            selectedOutlet.id,
          ],
        );
        setRows((prev) => prev.filter((r) => r.id !== row.id));
        setTotalCount((prev) => Math.max(0, prev - 1));
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

        let traceColumns: string[] = [];
        try {
          const info = await api.dbQuery(
            "PRAGMA table_info('production_v2_traces')",
          );
          traceColumns = (info || [])
            .map((c: any) => String(c?.name || "").trim())
            .filter(Boolean);
        } catch {
          traceColumns = [];
        }

        if (traceColumns.length > 0) {
          const traceId =
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function"
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random()}`;

          const traceRow = {
            id: traceId,
            event: "ready",
            fromStatus: row.status || null,
            toStatus: ProductionV2Status.READY,
            actorId: actor || null,
            metadata: JSON.stringify({ batchId: row.batchId || null }),
            createdAt: now,
            productionId: row.id,
            recordId: null,
            version: 0,
          };

          try {
            await api.dbQuery(
              `
                INSERT INTO production_v2_traces (
                  id,
                  event,
                  fromStatus,
                  toStatus,
                  actorId,
                  metadata,
                  createdAt,
                  productionId,
                  recordId,
                  version
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `,
              [
                traceRow.id,
                traceRow.event,
                traceRow.fromStatus,
                traceRow.toStatus,
                traceRow.actorId,
                traceRow.metadata,
                traceRow.createdAt,
                traceRow.productionId,
                traceRow.recordId,
                traceRow.version,
              ],
            );

            if (api.queueAdd) {
              await api.queueAdd({
                table: "production_v2_traces",
                action: "INSERT",
                data: traceRow,
                id: traceRow.id,
              });
            }
          } catch {}
        }

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("production-updated", {
              detail: { productionId: row.id },
            }),
          );
        }
        await fetchRows();
        closeTransitionModal();
      } catch (e) {
        console.error("Failed to mark as ready:", e);
      } finally {
        setIsTransitioning(false);
      }
    },
    [
      authUser?.email,
      authUser?.name,
      closeTransitionModal,
      fetchRows,
      selectedOutlet?.id,
    ],
  );

  useEffect(() => {
    if (!isTransitionModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeTransitionModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeTransitionModal, isTransitionModalOpen]);

  return (
    <div className="px-4 sm:px-6 py-6 bg-white">
      <div className="flex flex-col gap-4 ">
        <h2 className="text-[18px] font-semibold text-[#111827]">
          Quality Control
        </h2>
        <div className="flex justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <div className="relative">
                <select
                  defaultValue="All"
                  className="h-11 w-[140px] pl-4 pr-10 bg-white border border-gray-200 rounded-l-[10px] text-[14px] text-[#111827] outline-none appearance-none"
                >
                  <option value="All">All</option>
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <ChevronDown className="size-4" />
                </div>
              </div>
              <button
                type="button"
                className="h-11 w-11 bg-[#15BA5C] text-white rounded-r-[10px] flex items-center justify-center cursor-pointer"
                aria-label="Open filter"
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
                Batch No
              </th>
              <th className="px-4 py-4 text-[13px] font-medium text-gray-500">
                Amount of Orders
              </th>
              <th className="px-4 py-4 text-[13px] font-medium text-gray-500">
                Status
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
                    {Array.from({ length: 4 }).map((__, j) => (
                      <td key={j} className="px-4 py-6">
                        <div className="h-4 bg-gray-100 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((r) => (
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
                      <span className="px-4 h-9 inline-flex items-center rounded-[10px] text-[12px] font-medium bg-[#F3E8FF] text-[#A855F7]">
                        Quality Control
                      </span>
                    </td>
                    <td className="px-4 py-6">
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => openTransitionModal(r)}
                          className="h-10 px-4 rounded-[10px] text-[13px] font-medium transition-colors cursor-pointer bg-[#15BA5C] text-white hover:bg-[#119E4D]"
                        >
                          Mark as Ready
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {isTransitionModalOpen && transitionRow && (
        <div className="fixed inset-0 z-220 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-[860px] bg-white rounded-[16px] shadow-2xl overflow-hidden">
            <button
              type="button"
              onClick={closeTransitionModal}
              className="absolute top-4 right-4 size-10 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer"
              aria-label="Close"
              disabled={isTransitioning}
            >
              <X className="size-6 text-gray-700" />
            </button>

            <div className="px-6 sm:px-10 pt-12 pb-10 flex flex-col items-center text-center">
              <div className="w-full flex items-center justify-center mb-8">
                <div className="size-16 rounded-full bg-[#E0F2FE] flex items-center justify-center">
                  <Send className="size-8 text-[#0284C7]" />
                </div>
              </div>

              <h3 className="text-[26px] sm:text-[32px] font-bold text-[#111827]">
                Transition Batch to Ready
              </h3>

              <p className="mt-4 text-[15px] sm:text-[17px] text-gray-600">
                Are you sure you want to mark this batch as Ready?
              </p>
              <p className="mt-1 text-[15px] sm:text-[17px] text-gray-600">
                Once moved, no further edits will be allowed
              </p>

              <div className="mt-10 w-full flex flex-col sm:flex-row items-stretch justify-center gap-4 sm:gap-6">
                <button
                  type="button"
                  onClick={closeTransitionModal}
                  disabled={isTransitioning}
                  className={`h-14 sm:h-16 w-full sm:w-[320px] rounded-[12px] text-[18px] font-semibold transition-colors cursor-pointer ${
                    isTransitioning
                      ? "bg-gray-200 text-[#111827]/60 cursor-not-allowed"
                      : "bg-gray-200 text-[#111827] hover:bg-gray-300"
                  }`}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => markAsReady(transitionRow)}
                  disabled={isTransitioning}
                  className={`h-14 sm:h-16 w-full sm:w-[420px] rounded-[12px] text-[18px] font-semibold transition-colors cursor-pointer inline-flex items-center justify-center gap-3 ${
                    isTransitioning
                      ? "bg-[#15BA5C]/70 text-white cursor-not-allowed"
                      : "bg-[#15BA5C] text-white hover:bg-[#119E4D]"
                  }`}
                >
                  <Send className="size-5" />
                  Confirm & Mark as Ready
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isLoading && rows.length === 0 && (
        <div className="px-6 py-8">
          <NotFound
            title="No Quality Control Batches"
            description="You don’t have any batches in quality control yet."
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

export default QualityControlModal;
