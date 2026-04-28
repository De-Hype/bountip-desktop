"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Clock,
  Info,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { Pagination } from "@/shared/Pagination/pagination";
import { useBusinessStore } from "@/stores/useBusinessStore";
import NotFound from "@/features/inventory/NotFound";
import { ProductionV2Status } from "../../../../electron/types/productionV2.types";
import { useAuthStore } from "@/stores/authStore";

type SubmittedScheduleRow = {
  id: string;
  batchId: string | null;
  productionStatus: string | null;
  approvalStatus: string | null;
  productionDueDate: string | null;
  productionTime: string | null;
  ordersCount: number;
};

const statusPill = (status: string | null | undefined) => {
  const s = String(status || "")
    .trim()
    .toLowerCase();
  if (s === "approved") {
    return { label: "Approved", cls: "bg-[#DCFCE7] text-[#16A34A]" };
  }
  if (s === "pending") {
    return { label: "Pending", cls: "bg-gray-100 text-gray-500" };
  }
  if (s === "rejected") {
    return { label: "Rejected", cls: "bg-[#FEE2E2] text-[#EF4444]" };
  }
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
  const authUser = useAuthStore((s) => s.user);

  const [statusFilter, setStatusFilter] = useState<
    "All" | "Approved" | "Rejected" | "Pending"
  >("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState<SubmittedScheduleRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [startRow, setStartRow] = useState<SubmittedScheduleRow | null>(null);
  const [startProductNames, setStartProductNames] = useState<string[]>([]);
  const [isStartingProduction, setIsStartingProduction] = useState(false);

  const formatProductList = (names: string[]) => {
    const clean = (names || [])
      .map((n) => String(n || "").trim())
      .filter(Boolean);
    if (clean.length === 0) return "-";
    if (clean.length === 1) return clean[0];
    if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
    return `${clean.slice(0, -1).join(", ")}, and ${clean[clean.length - 1]}`;
  };

  const closeStartModal = useCallback(() => {
    setIsStartModalOpen(false);
    setStartRow(null);
    setStartProductNames([]);
    setIsStartingProduction(false);
  }, []);

  const loadStartModalProducts = useCallback(async (productionId: string) => {
    const api: any = (window as any).electronAPI;
    if (!api?.dbQuery) return [];
    try {
      const productRows = await api.dbQuery(
        `
          SELECT DISTINCT
            COALESCE(pr.name, '') as name
          FROM production_v2_items pi
          LEFT JOIN product pr ON pr.id = pi.productId
          WHERE pi.productionId = ?
          ORDER BY COALESCE(pr.name, '') ASC
        `,
        [productionId],
      );
      return (productRows || [])
        .map((r: any) => String(r?.name || "").trim())
        .filter(Boolean);
    } catch {
      try {
        const fallback = await api.dbQuery(
          `
            SELECT DISTINCT
              COALESCE(pi.productId, '') as productId
            FROM production_v2_items pi
            WHERE pi.productionId = ?
          `,
          [productionId],
        );
        const ids = (fallback || [])
          .map((r: any) => String(r?.productId || "").trim())
          .filter(Boolean);
        return ids.length > 0 ? ["Products loaded"] : [];
      } catch {
        return [];
      }
    }
  }, []);

  const openStartProductionModal = useCallback(
    async (row: SubmittedScheduleRow) => {
      setStartRow(row);
      setIsStartModalOpen(true);
      const names = await loadStartModalProducts(row.id);
      setStartProductNames(names);
    },
    [loadStartModalProducts],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, selectedOutlet?.id]);

  const fetchRows = useCallback(async () => {
    if (!selectedOutlet?.id) return;
    const api: any = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    setIsLoading(true);
    try {
      let approvalLogColumns: string[] = [];
      try {
        const info = await api.dbQuery(
          "PRAGMA table_info('production_v2_approval_logs')",
        );
        approvalLogColumns = (info || [])
          .map((c: any) => String(c?.name || "").trim())
          .filter(Boolean);
      } catch {
        approvalLogColumns = [];
      }

      const approvalLogHasStatus = approvalLogColumns.includes("status");
      const approvalLogHasApprovedAt =
        approvalLogColumns.includes("approvedAt");
      const approvalLogHasRejectedAt =
        approvalLogColumns.includes("rejectedAt");
      const approvalLogHasApprovedBy =
        approvalLogColumns.includes("approvedBy");
      const approvalLogHasRejectedBy =
        approvalLogColumns.includes("rejectedBy");
      const approvalLogHasUpdatedAt = approvalLogColumns.includes("updatedAt");
      const approvalLogHasCreatedAt = approvalLogColumns.includes("createdAt");

      const canJoinApprovalLogs =
        approvalLogColumns.length > 0 &&
        (approvalLogHasStatus ||
          approvalLogHasApprovedAt ||
          approvalLogHasRejectedAt ||
          approvalLogHasApprovedBy ||
          approvalLogHasRejectedBy);

      const rejectedChecks: string[] = [];
      if (approvalLogHasRejectedAt) {
        rejectedChecks.push("COALESCE(pal.rejectedAt, '') <> ''");
      }
      if (approvalLogHasRejectedBy) {
        rejectedChecks.push("COALESCE(pal.rejectedBy, '') <> ''");
      }

      const approvedChecks: string[] = [];
      if (approvalLogHasApprovedAt) {
        approvedChecks.push("COALESCE(pal.approvedAt, '') <> ''");
      }
      if (approvalLogHasApprovedBy) {
        approvedChecks.push("COALESCE(pal.approvedBy, '') <> ''");
      }

      const approvalStatusExpr = canJoinApprovalLogs
        ? approvalLogHasStatus
          ? "COALESCE(pal.status, 'Pending')"
          : `CASE
              WHEN (${rejectedChecks.length ? rejectedChecks.join(" OR ") : "0"}) THEN 'Rejected'
              WHEN (${approvedChecks.length ? approvedChecks.join(" OR ") : "0"}) THEN 'Approved'
              ELSE 'Pending'
            END`
        : "NULL";
      const approvalStatusExprLower = `LOWER(${approvalStatusExpr})`;

      const where: string[] = ["p.outletId = ?"];
      const params: any[] = [selectedOutlet.id];

      where.push("LOWER(COALESCE(p.status, '')) IN (LOWER(?), LOWER(?))");
      params.push(
        ProductionV2Status.INVENTORY_PENDING,
        ProductionV2Status.INVENTORY_APPROVED,
      );

      if (statusFilter !== "All") {
        if (statusFilter === "Approved") {
          if (canJoinApprovalLogs) {
            where.push(
              `(LOWER(COALESCE(p.status, '')) = LOWER(?) OR ${approvalStatusExprLower} = 'approved')`,
            );
            params.push(ProductionV2Status.INVENTORY_APPROVED);
          } else {
            where.push("LOWER(COALESCE(p.status, '')) = LOWER(?)");
            params.push(ProductionV2Status.INVENTORY_APPROVED);
          }
        } else if (statusFilter === "Pending") {
          if (canJoinApprovalLogs) {
            where.push(
              `(LOWER(COALESCE(p.status, '')) = LOWER(?) OR ${approvalStatusExprLower} = 'pending')`,
            );
            params.push(ProductionV2Status.INVENTORY_PENDING);
          } else {
            where.push("LOWER(COALESCE(p.status, '')) = LOWER(?)");
            params.push(ProductionV2Status.INVENTORY_PENDING);
          }
        } else if (statusFilter === "Rejected") {
          if (canJoinApprovalLogs) {
            where.push(`${approvalStatusExprLower} = 'rejected'`);
          } else {
            where.push("1 = 0");
          }
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

      const approvalLogOrderExpr = approvalLogHasUpdatedAt
        ? approvalLogHasCreatedAt
          ? "COALESCE(pal2.updatedAt, pal2.createdAt)"
          : "pal2.updatedAt"
        : approvalLogHasCreatedAt
          ? "pal2.createdAt"
          : "pal2.id";

      const joinApprovalLogsSql = canJoinApprovalLogs
        ? `
          LEFT JOIN production_v2_approval_logs pal
            ON pal.id = (
              SELECT pal2.id
              FROM production_v2_approval_logs pal2
              WHERE pal2.productionId = p.id
              ORDER BY ${approvalLogOrderExpr} DESC
              LIMIT 1
            )
        `
        : "";

      const fromClause = `
        FROM productions_v2 p
        ${joinApprovalLogsSql}
      `;

      const countRows = await api.dbQuery(
        `
          SELECT COUNT(*) as count
          ${fromClause}
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
            p.status as productionStatus,
            (${approvalStatusExpr}) as approvalStatus,
            p.productionDueDate as productionDueDate,
            p.productionTime as productionTime,
            (
              SELECT COUNT(*)
              FROM production_v2_items pi
              WHERE pi.productionId = p.id
            ) as ordersCount
          ${fromClause}
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
          productionStatus:
            r.productionStatus != null ? String(r.productionStatus) : null,
          approvalStatus:
            r.approvalStatus != null ? String(r.approvalStatus) : null,
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

  useEffect(() => {
    const handler = () => {
      fetchRows();
    };
    window.addEventListener("production-approval-updated", handler as any);
    return () => {
      window.removeEventListener("production-approval-updated", handler as any);
    };
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
            UPDATE productions_v2
            SET
              status = ?,
              previousStatus = ?,
              updatedAt = ?,
              version = COALESCE(version, 0) + 1
            WHERE id = ? AND outletId = ?
          `,
          [
            nextStatus,
            row.productionStatus || null,
            now,
            row.id,
            selectedOutlet.id,
          ],
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

  const startProduction = useCallback(async () => {
    if (!selectedOutlet?.id) return;
    if (!startRow?.id) return;
    const api: any = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    setIsStartingProduction(true);
    try {
      const now = new Date().toISOString();
      const actor = authUser?.name || authUser?.email || "";

      const currentProd = await api.dbQuery(
        "SELECT status FROM productions_v2 WHERE id = ? LIMIT 1",
        [startRow.id],
      );
      const fromStatus = String(
        currentProd?.[0]?.status || startRow.productionStatus || "",
      );

      await api.dbQuery(
        `
          UPDATE productions_v2
          SET
            status = ?,
            previousStatus = ?,
            preparationStartedAt = ?,
            productionStartedBy = ?,
            updatedAt = ?,
            version = COALESCE(version, 0) + 1
          WHERE id = ? AND outletId = ?
        `,
        [
          ProductionV2Status.IN_PREPARATION,
          fromStatus || null,
          now,
          actor || null,
          now,
          startRow.id,
          selectedOutlet.id,
        ],
      );

      if (api.queueAdd) {
        const rec = await api.dbQuery(
          "SELECT * FROM productions_v2 WHERE id = ?",
          [startRow.id],
        );
        if (rec?.[0]) {
          await api.queueAdd({
            table: "productions_v2",
            action: "UPDATE",
            data: rec[0],
            id: startRow.id,
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
          event: "preparation_started",
          fromStatus: fromStatus || null,
          toStatus: ProductionV2Status.IN_PREPARATION,
          actorId: actor || null,
          metadata: JSON.stringify({
            batchId: startRow.batchId || null,
            products: startProductNames,
          }),
          createdAt: now,
          productionId: startRow.id,
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
            detail: { productionId: startRow.id },
          }),
        );
      }

      closeStartModal();
      await fetchRows();
    } catch (e) {
      console.error("Failed to start production:", e);
    } finally {
      setIsStartingProduction(false);
    }
  }, [
    authUser?.email,
    authUser?.name,
    closeStartModal,
    fetchRows,
    selectedOutlet?.id,
    startProductNames,
    startRow?.batchId,
    startRow?.id,
    startRow?.productionStatus,
  ]);

  useEffect(() => {
    if (!isStartModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeStartModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeStartModal, isStartModalOpen]);

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
                  const displayStatus =
                    r.approvalStatus != null && String(r.approvalStatus).trim()
                      ? r.approvalStatus
                      : r.productionStatus;
                  const pill = statusPill(displayStatus);
                  const approvalRaw = String(r.approvalStatus || "")
                    .trim()
                    .toLowerCase();
                  const prodRaw = String(r.productionStatus || "")
                    .trim()
                    .toLowerCase();
                  const isApproved =
                    approvalRaw === "approved" ||
                    prodRaw === ProductionV2Status.INVENTORY_APPROVED;
                  const primaryLabel = isApproved
                    ? "Start Production"
                    : "Awaiting Approval";
                  const primaryDisabled =
                    prodRaw.includes("cancel") || !isApproved;

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
                            onClick={() => {
                              if (isApproved) openStartProductionModal(r);
                            }}
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
                            disabled={prodRaw.includes("cancel")}
                            className={`h-10 px-4 rounded-[10px] text-[13px] font-medium transition-colors cursor-pointer ${
                              prodRaw.includes("cancel")
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

      {isStartModalOpen && startRow && (
        <div className="fixed inset-0 z-220 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-[860px] bg-white rounded-[16px] shadow-2xl overflow-hidden">
            <button
              type="button"
              onClick={closeStartModal}
              className="absolute top-4 right-4 size-10 rounded-full bg-white flex items-center justify-center cursor-pointer"
              aria-label="Close"
            >
              <X className="size-6 text-[#EF4444]" />
            </button>

            <div className="px-6 sm:px-10 pt-10 pb-8 flex flex-col items-center text-center">
              <div className="w-full flex items-center justify-center mb-6">
                {/* <div className="w-[220px] h-[140px] flex items-center justify-center">
                  <div className="size-16 rounded-full bg-[#DCFCE7] flex items-center justify-center">
                    <Clock className="size-8 text-[#16A34A]" />
                  </div>
                </div> */}
                <svg
                  width="327"
                  height="207"
                  viewBox="0 0 327 207"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M305.412 203.965C305.412 204.035 237.033 204.095 152.706 204.095C68.3799 204.095 0 204.05 0 203.965C0 203.881 68.3649 203.836 152.726 203.836C237.087 203.836 305.412 203.896 305.412 203.965Z"
                    fill="#263238"
                  />
                  <path
                    d="M212.021 30.7622L207.285 34.8125L213.607 42.2036L218.342 38.1533L212.021 30.7622Z"
                    fill="#263238"
                  />
                  <path
                    d="M216.114 30.1821L206.369 38.5535L199.535 30.5902C202.223 26.8176 205.428 23.9707 209.265 22.2188L216.114 30.1821Z"
                    fill="#455A64"
                  />
                  <path
                    d="M208.012 37.1571C207.958 37.2068 206.31 35.3952 204.329 33.1207C202.348 30.8462 200.786 28.9648 200.845 28.9151C200.905 28.8653 202.548 30.6769 204.528 32.9515C206.509 35.226 208.067 37.1123 208.012 37.1571Z"
                    fill="#263238"
                  />
                  <path
                    d="M209.853 35.5587C209.459 35.1755 209.093 34.7647 208.758 34.3294C208.101 33.5579 207.21 32.4878 206.23 31.2934L203.741 28.2275L202.994 27.2968C202.815 27.0678 202.721 26.9633 202.721 26.9484C202.82 26.8588 204.478 28.7451 206.439 31.1291C207.434 32.3236 208.29 33.4136 208.927 34.2149C209.275 34.6347 209.584 35.0844 209.853 35.5587Z"
                    fill="#263238"
                  />
                  <path
                    d="M212.342 33.435C211.943 33.0531 211.572 32.6422 211.232 32.2057C210.571 31.4243 209.675 30.3343 208.689 29.1249L206.201 26.0093L205.454 25.0586C205.357 24.9453 205.271 24.8237 205.195 24.6953C205.623 25.0486 206.007 25.4512 206.34 25.8948C207.012 26.6662 207.918 27.7512 208.898 28.9607C209.879 30.1701 210.76 31.28 211.387 32.0912C211.742 32.5115 212.062 32.9611 212.342 33.435Z"
                    fill="#263238"
                  />
                  <path
                    d="M214.586 31.4469C214.532 31.4917 212.894 29.6652 210.928 27.3658C208.962 25.0664 207.419 23.1601 207.474 23.1104C207.529 23.0606 209.161 24.8922 211.127 27.1965C213.093 29.5009 214.641 31.4022 214.586 31.4469Z"
                    fill="#263238"
                  />
                  <path
                    d="M295.416 35.7941L291.111 31.2891L284.08 38.008L288.385 42.513L295.416 35.7941Z"
                    fill="#263238"
                  />
                  <path
                    d="M295.623 40.2192L286.754 30.9369L294.334 23.6953C298.236 26.1838 301.252 29.2348 303.198 32.9775L295.623 40.2192Z"
                    fill="#455A64"
                  />
                  <path
                    d="M288.235 32.5023C288.186 32.4476 289.903 30.7056 292.073 28.6103C294.243 26.5149 296.054 24.8576 296.089 24.9073C296.124 24.9571 294.422 26.6991 292.252 28.7994C290.082 30.8997 288.285 32.5521 288.235 32.5023Z"
                    fill="#263238"
                  />
                  <path
                    d="M289.93 34.2669C290.283 33.8489 290.669 33.4595 291.084 33.1022C291.816 32.4055 292.841 31.4548 293.981 30.4097L296.912 27.7569L297.803 26.9605C298.017 26.7714 298.122 26.6769 298.137 26.6719C298.231 26.7664 296.435 28.5233 294.155 30.6038C293.015 31.644 291.97 32.5946 291.204 33.2366C290.807 33.613 290.381 33.9575 289.93 34.2669Z"
                    fill="#263238"
                  />
                  <path
                    d="M292.18 36.6256C292.538 36.2037 292.929 35.8109 293.349 35.451C294.091 34.7492 295.131 33.7936 296.291 32.7484L299.277 30.0907L300.188 29.2943C300.299 29.1954 300.415 29.1023 300.536 29.0156C300.207 29.4622 299.826 29.8682 299.401 30.2251C298.665 30.9368 297.625 31.8973 296.47 32.9425C295.315 33.9877 294.25 34.9334 293.484 35.5903C293.076 35.9684 292.64 36.3145 292.18 36.6256Z"
                    fill="#263238"
                  />
                  <path
                    d="M294.282 38.7681C294.233 38.7134 295.974 36.9864 298.169 34.901C300.364 32.8156 302.186 31.1731 302.236 31.2279C302.285 31.2826 300.543 33.0097 298.349 35.0901C296.154 37.1705 294.332 38.8129 294.282 38.7681Z"
                    fill="#263238"
                  />
                  <path
                    d="M255.681 14.2812H248.305V25.7932H255.681V14.2812Z"
                    fill="#263238"
                  />
                  <path
                    d="M259.623 17.728H244.443V5.32023C249.764 4.00628 254.84 3.92665 259.638 5.32023L259.623 17.728Z"
                    fill="#15BA5C"
                  />
                  <path
                    d="M259.818 5.37103C259.64 5.48228 259.451 5.57564 259.255 5.64975C258.735 5.87862 258.202 6.07477 257.658 6.23704C256.842 6.48819 256.011 6.6844 255.169 6.82433C254.147 6.9866 253.114 7.07311 252.078 7.08314C251.044 7.08467 250.011 7.00814 248.988 6.8542C248.146 6.72371 247.315 6.5358 246.499 6.29179C245.954 6.13235 245.419 5.94123 244.896 5.71942C244.699 5.65089 244.51 5.559 244.334 5.44569C244.334 5.40089 245.17 5.74431 246.549 6.11261C247.358 6.32645 248.179 6.49263 249.007 6.61032C250.02 6.74736 251.041 6.81719 252.063 6.81936C253.086 6.80772 254.107 6.72791 255.119 6.58046C255.944 6.46113 256.762 6.29496 257.568 6.08275C258.981 5.67961 259.798 5.32624 259.818 5.37103Z"
                    fill="#263238"
                  />
                  <path
                    d="M249.461 17.6956C249.392 17.6956 249.332 15.3116 249.332 12.3752C249.332 9.4387 249.392 7.05469 249.461 7.05469C249.531 7.05469 249.591 9.43372 249.591 12.3752C249.591 15.3166 249.536 17.6956 249.461 17.6956Z"
                    fill="#263238"
                  />
                  <path
                    d="M252.352 17.7639C252.282 17.7639 252.223 15.3699 252.223 12.4185C252.223 9.46712 252.282 7.07812 252.352 7.07812C252.422 7.07812 252.481 9.46712 252.481 12.4185C252.481 15.3699 252.427 17.7639 252.352 17.7639Z"
                    fill="#263238"
                  />
                  <path
                    d="M255.243 17.722C255.173 17.722 255.113 15.328 255.113 12.3766C255.113 9.42522 255.173 7.03125 255.243 7.03125C255.312 7.03125 255.372 9.42522 255.372 12.3766C255.372 15.328 255.317 17.722 255.243 17.722Z"
                    fill="#263238"
                  />
                  <path
                    d="M257.633 17.7208C257.559 17.7208 257.504 15.1327 257.504 11.9424C257.504 8.75214 257.559 6.16406 257.633 6.16406C257.708 6.16406 257.763 8.75214 257.763 11.9424C257.763 15.1327 257.723 17.7208 257.633 17.7208Z"
                    fill="#263238"
                  />
                  <path
                    d="M246.727 17.6427C246.657 17.6427 246.598 15.0546 246.598 11.8643C246.598 8.67401 246.657 6.08594 246.727 6.08594C246.797 6.08594 246.856 8.67401 246.856 11.8643C246.856 15.0546 246.802 17.6427 246.727 17.6427Z"
                    fill="#263238"
                  />
                  <path
                    d="M289.051 113.847C310.01 92.8887 310.01 58.9082 289.051 37.9497C268.093 16.9911 234.112 16.9911 213.154 37.9497C192.195 58.9082 192.195 92.8887 213.154 113.847C234.112 134.806 268.093 134.806 289.051 113.847Z"
                    fill="#15BA5C"
                  />
                  <path
                    d="M251.104 120.551C275.996 120.551 296.176 100.371 296.176 75.4785C296.176 50.5858 275.996 30.4062 251.104 30.4062C226.211 30.4062 206.031 50.5858 206.031 75.4785C206.031 100.371 226.211 120.551 251.104 120.551Z"
                    fill="#FAFAFA"
                  />
                  <path
                    d="M296.176 75.4745C296.176 75.4745 296.176 75.2306 296.141 74.7478C296.107 74.265 296.141 73.5434 296.047 72.6027C295.869 69.8582 295.439 67.1359 294.763 64.4702C294.275 62.5462 293.658 60.6572 292.916 58.8162C292.044 56.6213 290.996 54.5007 289.781 52.4755C286.808 47.5276 282.924 43.1888 278.334 39.6894C272.762 35.4507 266.277 32.5737 259.396 31.2881C253.563 30.215 247.578 30.2843 241.772 31.4922C239.733 31.9347 237.725 32.5083 235.76 33.2092C227.397 36.2554 220.124 41.7088 214.856 48.882C213.481 50.7501 212.257 52.7238 211.193 54.7848C210.641 55.8151 210.168 56.8851 209.7 57.9602C209.232 59.0352 208.814 60.1501 208.461 61.2849C207.697 63.5557 207.124 65.8865 206.748 68.2527C206.371 70.6451 206.173 73.0625 206.156 75.4844C206.174 77.9078 206.37 80.3266 206.743 82.7211C207.125 85.0862 207.697 87.4165 208.456 89.689C208.814 90.8187 209.262 91.9137 209.695 93.0087C210.128 94.1036 210.65 95.1587 211.188 96.189C212.252 98.2512 213.478 100.225 214.856 102.092C220.123 109.268 227.396 114.723 235.76 117.77C237.725 118.47 239.733 119.044 241.772 119.487C243.76 119.902 245.774 120.183 247.799 120.328C251.676 120.621 255.574 120.407 259.396 119.691C266.277 118.405 272.762 115.528 278.334 111.289C282.925 107.791 286.81 103.452 289.781 98.5033C290.995 96.4775 292.043 94.3571 292.916 92.1626C294.684 87.7621 295.741 83.1085 296.047 78.3761C296.132 77.4354 296.117 76.7138 296.141 76.231C296.166 75.7482 296.176 75.4993 296.176 75.4993C296.176 75.4993 296.176 75.7482 296.176 76.231C296.176 76.7138 296.176 77.4354 296.107 78.3761C295.834 83.1217 294.797 87.7923 293.036 92.2073C292.169 94.4124 291.124 96.543 289.91 98.578C286.945 103.551 283.06 107.914 278.463 111.434C272.872 115.698 266.361 118.596 259.451 119.895C255.612 120.62 251.695 120.841 247.799 120.552C245.764 120.407 243.74 120.126 241.742 119.711C239.691 119.269 237.671 118.694 235.695 117.989C227.283 114.931 219.966 109.449 214.667 102.236C213.284 100.359 212.052 98.3755 210.984 96.3035C210.427 95.2682 209.949 94.1832 209.461 93.1032C208.973 92.0232 208.575 90.9034 208.217 89.7636C207.453 87.4818 206.877 85.1414 206.495 82.7659C205.705 77.947 205.705 73.0318 206.495 68.2129C206.879 65.8475 207.455 63.5173 208.217 61.245C208.58 60.1053 209.028 59.0054 209.466 57.9054C209.904 56.8055 210.427 55.7454 210.984 54.7102C212.056 52.639 213.289 50.6554 214.672 48.7775C219.969 41.5652 227.285 36.0852 235.695 33.0301C237.669 32.3251 239.688 31.7499 241.737 31.308C243.737 30.8926 245.762 30.6116 247.799 30.4669C251.693 30.1776 255.609 30.3985 259.446 31.1239C266.358 32.4172 272.87 35.3153 278.458 39.5849C283.055 43.107 286.94 47.4715 289.905 52.4456C292.135 56.2003 293.811 60.2569 294.882 64.4901C295.546 67.1651 295.961 69.8959 296.122 72.6475C296.196 73.5882 296.171 74.3098 296.191 74.7926C296.211 75.2754 296.176 75.4745 296.176 75.4745Z"
                    fill="#263238"
                  />
                  <path
                    d="M289.561 73.8401C288.133 73.8998 286.968 73.8401 286.963 73.7156C286.958 73.5912 288.108 73.422 289.536 73.3424C290.964 73.2627 292.129 73.3125 292.139 73.4618C292.149 73.6111 290.979 73.7803 289.561 73.8401Z"
                    fill="#263238"
                  />
                  <path
                    d="M288.6 84.2196C287.206 83.8911 286.111 83.5277 286.111 83.4033C286.111 83.2789 287.296 83.4282 288.694 83.7318C290.093 84.0354 291.183 84.4037 291.183 84.548C291.183 84.6924 289.983 84.5431 288.6 84.2196Z"
                    fill="#263238"
                  />
                  <path
                    d="M284.882 93.9568C283.623 93.27 282.658 92.618 282.717 92.5085C282.777 92.399 283.852 92.8519 285.116 93.5039C286.381 94.1559 287.351 94.8278 287.281 94.9572C287.212 95.0866 286.137 94.6487 284.882 93.9568Z"
                    fill="#263238"
                  />
                  <path
                    d="M278.685 102.33C277.66 101.334 276.898 100.448 276.988 100.339C277.077 100.229 277.983 100.971 279.028 101.956C280.073 102.942 280.825 103.823 280.725 103.947C280.626 104.072 279.705 103.33 278.685 102.33Z"
                    fill="#263238"
                  />
                  <path
                    d="M270.474 108.753C269.757 107.514 269.259 106.458 269.369 106.394C269.478 106.329 270.165 107.275 270.902 108.499C271.638 109.723 272.136 110.779 272.011 110.858C271.887 110.938 271.195 109.982 270.474 108.753Z"
                    fill="#263238"
                  />
                  <path
                    d="M260.843 112.733C260.484 111.344 260.29 110.195 260.415 110.165C260.539 110.135 260.942 111.225 261.325 112.603C261.709 113.982 261.898 115.132 261.753 115.172C261.609 115.211 261.201 114.116 260.843 112.733Z"
                    fill="#263238"
                  />
                  <path
                    d="M250.496 113.968C250.496 112.535 250.64 111.375 250.765 111.375C250.889 111.375 250.993 112.54 250.993 113.968C250.993 115.396 250.869 116.561 250.725 116.561C250.58 116.561 250.471 115.406 250.496 113.968Z"
                    fill="#263238"
                  />
                  <path
                    d="M240.213 112.412C240.621 111.038 241.049 109.958 241.174 109.993C241.298 110.028 241.079 111.173 240.676 112.551C240.273 113.93 239.86 115.04 239.715 114.97C239.571 114.9 239.78 113.786 240.213 112.412Z"
                    fill="#263238"
                  />
                  <path
                    d="M230.692 108.118C231.453 106.908 232.155 105.978 232.265 106.042C232.374 106.107 231.856 107.157 231.115 108.381C230.373 109.606 229.666 110.532 229.542 110.457C229.418 110.382 229.93 109.332 230.692 108.118Z"
                    fill="#263238"
                  />
                  <path
                    d="M222.683 101.453C223.743 100.488 224.674 99.7811 224.753 99.8757C224.833 99.9702 224.066 100.836 223.021 101.817C221.976 102.797 221.055 103.504 220.951 103.399C220.846 103.295 221.628 102.419 222.683 101.453Z"
                    fill="#263238"
                  />
                  <path
                    d="M216.752 92.8809C218.031 92.2389 219.116 91.8059 219.171 91.9154C219.226 92.0249 218.25 92.657 216.981 93.3239C215.712 93.9908 214.632 94.4238 214.562 94.2894C214.492 94.1551 215.478 93.5279 216.752 92.8809Z"
                    fill="#263238"
                  />
                  <path
                    d="M213.337 83.0379C214.745 82.7592 215.905 82.6348 215.93 82.7592C215.955 82.8836 214.84 83.227 213.441 83.5257C212.043 83.8243 210.878 83.9487 210.848 83.8044C210.818 83.66 211.943 83.3166 213.337 83.0379Z"
                    fill="#263238"
                  />
                  <path
                    d="M212.705 72.6586C214.133 72.7631 215.283 72.9523 215.278 73.0767C215.273 73.2011 214.103 73.236 212.675 73.1514C211.246 73.0668 210.092 72.8826 210.102 72.7333C210.112 72.584 211.276 72.5292 212.705 72.6586Z"
                    fill="#263238"
                  />
                  <path
                    d="M214.87 62.4364C216.218 62.9341 217.273 63.4318 217.234 63.5363C217.194 63.6409 216.059 63.3721 214.705 62.9043C213.352 62.4364 212.296 61.9487 212.341 61.8093C212.386 61.67 213.526 61.9487 214.87 62.4364Z"
                    fill="#263238"
                  />
                  <path
                    d="M219.703 53.2072C220.867 54.0384 221.753 54.7949 221.693 54.8994C221.634 55.0039 220.608 54.4266 219.429 53.6153C218.249 52.8041 217.363 52.0475 217.438 51.9231C217.513 51.7987 218.533 52.376 219.703 53.2072Z"
                    fill="#263238"
                  />
                  <path
                    d="M226.825 45.5989C227.726 46.7088 228.378 47.6743 228.283 47.7589C228.189 47.8435 227.358 47.0124 226.442 45.9124C225.526 44.8125 224.869 43.8519 224.984 43.7574C225.098 43.6628 225.924 44.489 226.825 45.5989Z"
                    fill="#263238"
                  />
                  <path
                    d="M235.732 40.1723C236.3 41.4862 236.673 42.5911 236.554 42.6608C236.434 42.7305 235.867 41.6952 235.279 40.3913C234.692 39.0873 234.319 37.9824 234.453 37.9027C234.588 37.8231 235.15 38.8633 235.732 40.1723Z"
                    fill="#263238"
                  />
                  <path
                    d="M245.758 37.3489C245.952 38.7674 246.012 39.932 245.882 39.9519C245.753 39.9718 245.479 38.8371 245.265 37.4236C245.051 36.0101 244.991 34.8405 245.136 34.8206C245.28 34.8007 245.564 35.9305 245.758 37.3489Z"
                    fill="#263238"
                  />
                  <path
                    d="M256.179 37.3142C255.99 38.7327 255.736 39.8724 255.611 39.8575C255.487 39.8425 255.517 38.6729 255.686 37.2545C255.855 35.836 256.109 34.6913 256.253 34.7112C256.398 34.7311 256.368 35.8908 256.179 37.3142Z"
                    fill="#263238"
                  />
                  <path
                    d="M266.228 40.0642C265.666 41.3831 265.113 42.4084 264.994 42.3586C264.874 42.3088 265.228 41.1989 265.77 39.8701C266.313 38.5412 266.87 37.5209 267.005 37.5806C267.139 37.6403 266.796 38.7502 266.228 40.0642Z"
                    fill="#263238"
                  />
                  <path
                    d="M275.167 45.4373C274.272 46.5572 273.465 47.3983 273.366 47.3187C273.266 47.239 273.898 46.2586 274.779 45.1288C275.66 43.999 276.462 43.1379 276.581 43.2524C276.7 43.3669 276.048 44.3225 275.167 45.4373Z"
                    fill="#263238"
                  />
                  <path
                    d="M282.35 52.9895C281.185 53.8257 280.185 54.4229 280.11 54.3184C280.035 54.2139 280.906 53.4424 282.056 52.5864C283.206 51.7303 284.206 51.138 284.296 51.2575C284.385 51.3769 283.514 52.1534 282.35 52.9895Z"
                    fill="#263238"
                  />
                  <path
                    d="M287.242 62.202C285.898 62.6997 284.753 62.9934 284.723 62.8789C284.693 62.7644 285.719 62.2468 287.067 61.7342C288.416 61.2215 289.526 60.9179 289.581 61.0573C289.636 61.1966 288.585 61.7043 287.242 62.202Z"
                    fill="#263238"
                  />
                  <path
                    d="M289.486 72.3697C288.057 72.4842 286.893 72.4742 286.883 72.3697C286.873 72.2652 288.018 72.0362 289.441 71.872C290.865 71.7078 292.034 71.7476 292.044 71.8969C292.054 72.0462 290.899 72.2552 289.486 72.3697Z"
                    fill="#263238"
                  />
                  <path
                    d="M233.598 26.7188L233.443 26.7884L232.985 26.9726C232.587 27.1418 231.99 27.3459 231.228 27.6793C229.083 28.5763 226.999 29.6155 224.992 30.79C223.718 31.5266 222.369 32.4075 220.951 33.398C219.532 34.3884 218.084 35.5431 216.636 36.8421C210.277 42.4469 205.42 49.5521 202.506 57.5118C201.824 59.3334 201.311 61.1152 200.868 62.7826C200.425 64.4499 200.127 66.0425 199.903 67.4958C199.539 69.792 199.328 72.1098 199.271 74.4339C199.231 75.26 199.271 75.8971 199.271 76.3301C199.271 76.5392 199.271 76.6984 199.271 76.8278C199.275 76.8841 199.275 76.9407 199.271 76.997C199.264 76.9425 199.264 76.8873 199.271 76.8328C199.271 76.7084 199.271 76.5441 199.271 76.3351C199.271 75.9021 199.216 75.265 199.241 74.4388C199.259 72.106 199.443 69.7774 199.793 67.4709C200.002 66.0077 200.326 64.42 200.729 62.7328C201.179 60.9393 201.72 59.1701 202.352 57.4322C205.251 49.4192 210.137 42.2731 216.551 36.6629C218.009 35.3639 219.493 34.2441 220.896 33.2238C222.3 32.2035 223.683 31.3574 224.972 30.6307C226.993 29.4683 229.094 28.4505 231.258 27.5848C232.02 27.2662 232.632 27.0871 233.04 26.9228L233.508 26.7635C233.537 26.7464 233.567 26.7315 233.598 26.7188Z"
                    fill="white"
                  />
                  <path
                    d="M248.581 23.8088C248.069 23.915 247.55 23.9832 247.028 24.0128C246.062 24.1124 244.738 24.2567 243.275 24.4458C241.812 24.6349 240.493 24.834 239.537 24.9833C239.025 25.0886 238.506 25.1551 237.984 25.1824C238.479 25.0099 238.989 24.8833 239.507 24.8042C240.458 24.6101 241.777 24.3811 243.24 24.192C244.703 24.0029 246.042 23.8834 247.013 23.8287C247.534 23.773 248.058 23.7663 248.581 23.8088Z"
                    fill="white"
                  />
                  <g opacity="0.4">
                    <path
                      d="M215.078 102.568C215.078 102.568 238.435 139.428 274.668 120.55C312.494 100.841 291.591 55.6641 291.591 55.6641C291.591 55.6641 309.388 91.6681 272.518 115.14C263.336 120.988 253.337 120.993 245.712 120.227C226.227 118.276 215.078 102.568 215.078 102.568Z"
                      fill="black"
                    />
                  </g>
                  <path
                    d="M263.664 51.5234C263.888 58.134 263.689 64.7521 263.067 71.3371C262.838 73.7211 262.569 76.13 261.648 78.3448C260.727 80.5596 259.16 82.5903 256.95 83.526C254.74 84.4616 251.913 84.0734 250.375 82.2419L263.664 51.5234Z"
                    fill="#E0E0E0"
                  />
                  <path
                    d="M250.123 71.9266L266.503 44.3438L256.618 75.4852L251.566 76.9933L250.123 71.9266Z"
                    fill="#15BA5C"
                  />
                  <g opacity="0.4">
                    <path
                      d="M266.501 44.3438L254.352 72.5289L256.616 75.4852L266.501 44.3438Z"
                      fill="black"
                    />
                  </g>
                  <path
                    d="M251.566 82.2602C254.477 82.2602 256.836 79.9004 256.836 76.9895C256.836 74.0785 254.477 71.7188 251.566 71.7188C248.655 71.7188 246.295 74.0785 246.295 76.9895C246.295 79.9004 248.655 82.2602 251.566 82.2602Z"
                    fill="#FAFAFA"
                  />
                  <path
                    d="M256.837 76.9911C256.789 76.5627 256.718 76.1373 256.623 75.7169C256.317 74.5818 255.641 73.5814 254.702 72.875C254.011 72.3557 253.202 72.0175 252.347 71.8914C251.493 71.7654 250.62 71.8554 249.809 72.1534C249.342 72.3186 248.904 72.5553 248.51 72.8551C248.091 73.1594 247.722 73.5291 247.42 73.9501C246.773 74.832 246.424 75.8973 246.424 76.9911C246.424 78.0849 246.773 79.1501 247.42 80.0321C248.024 80.852 248.855 81.4781 249.809 81.8338C250.49 82.0835 251.216 82.1882 251.94 82.141C252.664 82.0939 253.37 81.896 254.013 81.56C254.656 81.224 255.221 80.7573 255.673 80.1899C256.125 79.6226 256.454 78.967 256.638 78.2652C256.734 77.845 256.805 77.4196 256.852 76.9911C256.882 77.4274 256.844 77.8659 256.737 78.2901C256.465 79.4768 255.79 80.5323 254.826 81.2763C254.165 81.7892 253.393 82.1388 252.571 82.2966C251.626 82.4772 250.65 82.4016 249.744 82.0776C249.252 81.9077 248.79 81.6608 248.376 81.346C247.936 81.0279 247.549 80.6414 247.231 80.2013C246.546 79.2788 246.176 78.1601 246.176 77.011C246.176 75.8618 246.546 74.7432 247.231 73.8207C247.55 73.3817 247.937 72.9954 248.376 72.676C248.792 72.3656 249.254 72.1206 249.744 71.9493C250.65 71.6229 251.627 71.5473 252.571 71.7303C253.575 71.9233 254.502 72.4015 255.241 73.1076C255.98 73.8138 256.499 74.718 256.737 75.712C256.837 76.1306 256.87 76.5621 256.837 76.9911Z"
                    fill="#263238"
                  />
                  <path
                    d="M255.426 77.7806C255.856 75.6575 254.483 73.5885 252.36 73.1592C250.236 72.73 248.167 74.1031 247.738 76.2262C247.309 78.3492 248.682 80.4183 250.805 80.8475C252.928 81.2768 254.997 79.9036 255.426 77.7806Z"
                    fill="#455A64"
                  />
                  <path
                    d="M210.012 203.502H235.942L223.853 99.3125L210.012 203.502Z"
                    fill="#E0E0E0"
                  />
                  <path
                    d="M82.4213 99.3125L65.5391 204.732L209.6 206.608L223.854 99.3125H82.4213Z"
                    fill="#FAFAFA"
                  />
                  <path
                    d="M217.44 147.606H74.6875L77.7932 128.195H220.018L217.44 147.606Z"
                    fill="#EBEBEB"
                  />
                  <path
                    d="M217.449 147.615H74.6719L77.7825 128.205H220.032L217.449 147.615ZM74.7017 147.59H217.429L220.002 128.18H77.8074L74.7017 147.59Z"
                    fill="#263238"
                  />
                  <path
                    d="M82.4216 99.3125L77.793 128.194H220.018L223.855 99.3125H82.4216Z"
                    fill="#15BA5C"
                  />
                  <path
                    d="M82.4415 99.307L223.875 99.1875H224.009V99.3219C219.843 130.732 215.115 166.353 210.118 203.975V204.089H208.386L65.6589 204.049H65.5195V203.925L82.4415 99.307C82.3022 100.173 75.8718 140.592 65.7833 203.975L65.6788 203.85H208.351H209.969L209.844 203.96C214.846 166.338 219.585 130.722 223.78 99.3119L223.895 99.4413L82.4415 99.307Z"
                    fill="#263238"
                  />
                  <path
                    d="M220.018 128.192C220.018 128.262 188.164 128.321 148.91 128.321C109.656 128.321 77.793 128.262 77.793 128.192C77.793 128.122 109.646 128.062 148.91 128.062C188.174 128.062 220.018 128.117 220.018 128.192Z"
                    fill="#263238"
                  />
                  <path
                    d="M217.44 147.606C217.44 147.681 185.417 147.735 145.929 147.735C106.441 147.735 74.4141 147.681 74.4141 147.606C74.4141 147.531 106.427 147.477 145.929 147.477C185.432 147.477 217.44 147.536 217.44 147.606Z"
                    fill="#263238"
                  />
                  <path
                    d="M214.533 165.465C214.533 165.54 182.516 165.595 143.028 165.595C103.539 165.595 71.4922 165.54 71.4922 165.465C71.4922 165.391 103.505 165.336 143.008 165.336C182.511 165.336 214.533 165.396 214.533 165.465Z"
                    fill="#263238"
                  />
                  <path
                    d="M211.631 183.333C211.631 183.402 179.609 183.462 140.121 183.462C100.633 183.462 68.6055 183.402 68.6055 183.333C68.6055 183.263 100.618 183.203 140.121 183.203C179.624 183.203 211.631 183.263 211.631 183.333Z"
                    fill="#263238"
                  />
                  <path
                    d="M85.7611 204.125C85.6914 204.125 88.3044 187.104 91.6042 166.14C94.904 145.177 97.6264 128.18 97.6961 128.195C97.7658 128.21 95.1528 145.207 91.858 166.18C88.5632 187.154 85.8358 204.135 85.7611 204.125Z"
                    fill="#263238"
                  />
                  <path
                    d="M107.775 204.125C107.7 204.125 110.318 187.104 113.613 166.14C116.908 145.177 119.635 128.18 119.71 128.195C119.785 128.21 117.167 145.207 113.867 166.18C110.567 187.154 107.825 204.135 107.775 204.125Z"
                    fill="#263238"
                  />
                  <path
                    d="M128.232 203.364C128.162 203.364 130.75 186.517 134.01 165.762C137.27 145.008 139.983 128.18 140.047 128.195C140.112 128.21 137.529 145.038 134.269 165.802C131.009 186.566 128.297 203.374 128.232 203.364Z"
                    fill="#263238"
                  />
                  <path
                    d="M148.462 203.966C148.393 203.966 151.001 186.979 154.29 166.061C157.58 145.142 160.303 128.18 160.372 128.195C160.442 128.21 157.834 145.172 154.544 166.101C151.254 187.029 148.532 203.976 148.462 203.966Z"
                    fill="#263238"
                  />
                  <path
                    d="M168.794 203.966C168.725 203.966 171.333 186.979 174.622 166.061C177.912 145.142 180.635 128.18 180.704 128.195C180.774 128.21 178.171 145.172 174.881 166.101C171.591 187.029 168.869 203.976 168.794 203.966Z"
                    fill="#263238"
                  />
                  <path
                    d="M189.111 204.06C189.041 204.06 191.654 187.053 194.949 166.1C198.244 145.147 200.966 128.165 201.041 128.18C201.115 128.195 198.497 145.181 195.203 166.14C191.908 187.098 189.18 204.09 189.111 204.06Z"
                    fill="#263238"
                  />
                  <g opacity="0.2">
                    <path
                      d="M176.318 129.547C178.767 128.462 180.3 125.914 180.932 123.311C181.564 120.707 181.464 117.99 181.559 115.307C181.653 112.625 181.972 109.862 183.341 107.558C184.152 106.199 185.292 105.07 186.193 103.761C187.093 102.452 187.76 100.859 187.427 99.2812L172.107 99.3609L176.318 129.547Z"
                      fill="black"
                    />
                  </g>
                  <path
                    d="M112.801 149.039C112.76 149.106 112.71 149.166 112.652 149.218L112.194 149.716C111.791 150.129 111.199 150.711 110.452 151.438C108.959 152.871 106.884 154.822 104.519 156.913C102.155 159.003 99.9655 160.825 98.3579 162.119C97.5516 162.766 96.8946 163.283 96.4367 163.612L95.9042 164.01C95.8449 164.062 95.7777 164.104 95.7051 164.134C95.7051 164.134 95.7598 164.07 95.8693 163.97L96.367 163.532L98.2334 161.955C99.8161 160.626 101.986 158.779 104.345 156.699C106.704 154.618 108.825 152.687 110.318 151.289L112.114 149.631L112.612 149.188C112.669 149.131 112.732 149.081 112.801 149.039Z"
                    fill="#263238"
                  />
                  <path
                    d="M111.651 164.332C111.44 164.148 111.242 163.948 111.059 163.735L109.501 162.073C108.157 160.644 106.356 158.723 104.37 156.598L99.1838 151.173L97.6111 149.526C97.4125 149.33 97.2279 149.12 97.0586 148.898C97.284 149.065 97.4939 149.252 97.6857 149.456C98.0739 149.824 98.6313 150.367 99.3132 151.044C100.677 152.397 102.538 154.294 104.554 156.424C106.57 158.554 108.362 160.515 109.636 161.953C110.273 162.67 110.785 163.257 111.129 163.665C111.323 163.871 111.498 164.094 111.651 164.332Z"
                    fill="#263238"
                  />
                  <path
                    d="M116.967 153.614C116.967 153.614 117.017 153.484 117.122 153.23C117.287 152.862 117.487 152.51 117.719 152.18C118.634 150.902 119.925 149.94 121.412 149.428C122.477 149.043 123.613 148.893 124.742 148.99C126.085 149.12 127.38 149.562 128.524 150.279C129.845 151.093 130.96 152.2 131.784 153.514C132.737 154.981 133.212 156.708 133.143 158.456C133.086 159.399 132.793 160.313 132.292 161.114C131.766 161.945 131.067 162.651 130.241 163.185C128.483 164.312 126.413 164.854 124.329 164.732C123.237 164.674 122.161 164.44 121.143 164.041C120.084 163.627 119.132 162.981 118.356 162.149C117.971 161.712 117.646 161.225 117.39 160.701C117.147 160.166 116.98 159.6 116.893 159.019C116.728 157.828 116.831 156.615 117.196 155.47C117.957 153.082 119.607 151.077 121.805 149.871C122.944 149.245 124.212 148.889 125.51 148.829C126.809 148.77 128.104 149.009 129.296 149.527C130.53 150.048 131.612 150.875 132.436 151.931C133.262 153.016 133.778 154.304 133.929 155.659C134.102 157.033 133.879 158.428 133.287 159.681C132.983 160.309 132.584 160.887 132.103 161.393C131.613 161.892 131.061 162.325 130.46 162.682C129.248 163.349 127.912 163.76 126.534 163.889C125.156 164.017 123.767 163.86 122.452 163.428C121.158 163.031 119.968 162.351 118.968 161.438C117.977 160.524 117.299 159.32 117.032 157.998C116.752 156.699 116.937 155.343 117.555 154.166C117.868 153.586 118.299 153.078 118.819 152.673C119.331 152.286 119.903 151.986 120.511 151.782C121.706 151.399 122.96 151.23 124.214 151.284C125.435 151.293 126.65 151.461 127.827 151.782C128.992 152.088 130.068 152.665 130.968 153.464C131.83 154.269 132.419 155.324 132.65 156.48C132.879 157.598 132.812 158.756 132.456 159.84C132.104 160.885 131.509 161.832 130.719 162.602C129.22 164.068 127.234 164.932 125.14 165.031C124.159 165.083 123.178 164.941 122.253 164.613C121.365 164.294 120.566 163.767 119.924 163.075C119.316 162.415 118.856 161.633 118.575 160.781C118.298 159.982 118.175 159.137 118.212 158.292C118.283 156.727 118.907 155.239 119.974 154.091C120.885 153.094 122.039 152.348 123.323 151.926C124.401 151.575 125.543 151.466 126.668 151.608C128.222 151.801 129.699 152.396 130.953 153.335C131.279 153.574 131.586 153.837 131.874 154.121C132.068 154.315 132.162 154.42 132.162 154.42C132.162 154.42 132.053 154.325 131.859 154.141C131.563 153.867 131.251 153.611 130.923 153.375C129.667 152.464 128.199 151.89 126.658 151.707C125.443 151.567 124.212 151.719 123.068 152.152C121.924 152.585 120.9 153.286 120.083 154.196C119.044 155.318 118.439 156.774 118.376 158.302C118.342 159.131 118.465 159.958 118.739 160.741C119.017 161.567 119.466 162.326 120.058 162.966C120.682 163.636 121.457 164.148 122.318 164.459C123.22 164.772 124.176 164.908 125.13 164.857C127.174 164.756 129.11 163.908 130.57 162.473C131.332 161.727 131.907 160.811 132.247 159.8C132.588 158.752 132.649 157.634 132.426 156.555C132.202 155.445 131.637 154.432 130.809 153.658C129.933 152.889 128.89 152.333 127.763 152.036C126.604 151.719 125.41 151.551 124.209 151.538C122.985 151.492 121.762 151.66 120.596 152.036C119.406 152.4 118.399 153.202 117.779 154.281C117.189 155.406 117.013 156.702 117.281 157.944C117.539 159.213 118.192 160.368 119.147 161.243C120.116 162.138 121.272 162.805 122.532 163.194C123.811 163.615 125.164 163.768 126.505 163.643C127.846 163.518 129.146 163.118 130.326 162.468C130.908 162.126 131.442 161.707 131.914 161.224C132.376 160.738 132.76 160.184 133.053 159.581C133.626 158.373 133.842 157.026 133.675 155.699C133.533 154.391 133.04 153.146 132.247 152.096C131.45 151.075 130.405 150.275 129.211 149.771C128.055 149.266 126.798 149.033 125.537 149.09C124.276 149.147 123.046 149.492 121.94 150.1C119.804 151.276 118.2 153.227 117.46 155.55C117.105 156.661 117.002 157.837 117.157 158.994C117.246 159.555 117.414 160.101 117.654 160.616C117.901 161.119 118.212 161.588 118.58 162.01C119.331 162.815 120.253 163.441 121.278 163.842C122.273 164.235 123.325 164.467 124.393 164.528C126.433 164.653 128.461 164.131 130.187 163.035C130.984 162.547 131.656 161.878 132.148 161.083C132.64 160.288 132.938 159.388 133.018 158.456C133.088 156.746 132.627 155.057 131.7 153.619C130.894 152.321 129.801 151.226 128.504 150.418C127.381 149.707 126.109 149.266 124.786 149.129C123.675 149.024 122.554 149.163 121.502 149.537C120.028 150.036 118.742 150.974 117.819 152.225C117.58 152.55 117.374 152.896 117.201 153.26C117.032 153.489 116.967 153.614 116.967 153.614Z"
                    fill="#15BA5C"
                  />
                  <path
                    d="M130.449 167.36C130.494 167.415 126.547 170.789 121.629 174.9C116.712 179.011 112.671 182.291 112.641 182.236C112.611 182.182 116.543 178.807 121.46 174.701C126.377 170.595 130.404 167.305 130.449 167.36Z"
                    fill="#263238"
                  />
                  <path
                    d="M131.312 181.792C131.078 181.654 130.856 181.496 130.65 181.319L128.898 179.956C127.43 178.791 125.414 177.168 123.194 175.367C120.975 173.565 118.979 171.923 117.541 170.723L115.843 169.29C115.628 169.125 115.428 168.942 115.246 168.742C115.479 168.881 115.701 169.04 115.908 169.215L117.655 170.579C119.123 171.743 121.139 173.366 123.359 175.168C125.578 176.969 127.574 178.612 129.018 179.811L130.71 181.24C130.924 181.409 131.125 181.594 131.312 181.792Z"
                    fill="#263238"
                  />
                  <path
                    d="M172 167.548C172.039 167.603 168.267 170.494 163.563 174.018C158.86 177.542 155.018 180.324 154.973 180.264C154.928 180.204 158.706 177.318 163.409 173.794C168.112 170.27 171.955 167.488 172 167.548Z"
                    fill="#263238"
                  />
                  <path
                    d="M173.461 179.798C173.426 179.858 169.414 177.374 164.502 174.243C159.59 171.113 155.653 168.535 155.688 168.47C155.723 168.405 159.734 170.899 164.646 174.024C169.559 177.15 173.521 179.738 173.461 179.798Z"
                    fill="#263238"
                  />
                  <path
                    d="M131.098 203.969C131.043 203.919 134.965 199.808 139.853 194.796C144.74 189.784 148.747 185.748 148.812 185.797C148.876 185.847 144.944 189.958 140.057 194.975C135.169 199.992 131.148 204.018 131.098 203.969Z"
                    fill="#15BA5C"
                  />
                  <path
                    d="M147.677 203.969C147.677 203.969 147.612 203.914 147.513 203.795L147.094 203.297C146.706 202.799 146.189 202.157 145.557 201.371C144.258 199.748 142.416 197.544 140.281 195.199C138.146 192.855 136.12 190.82 134.627 189.376L132.855 187.634L132.357 187.166C132.3 187.114 132.248 187.056 132.203 186.992C132.203 186.992 132.278 187.032 132.392 187.127L132.89 187.56C133.333 187.938 133.96 188.5 134.726 189.207C136.249 190.62 138.3 192.641 140.445 194.99C142.59 197.34 144.427 199.569 145.671 201.222C146.308 202.048 146.811 202.715 147.164 203.212L147.547 203.76C147.599 203.824 147.642 203.894 147.677 203.969Z"
                    fill="#15BA5C"
                  />
                  <path
                    d="M106.934 183.034C106.934 183.034 107.093 195.262 104.008 202.584L85.1992 199.378C85.1992 199.378 90.8631 187.792 89.3202 181.352L106.934 183.034Z"
                    fill="#EBEBEB"
                  />
                  <path
                    d="M106.93 182.574C106.93 182.574 104.571 197.585 103.127 202.064L84.4336 198.351C84.4336 198.351 88.2809 183.838 88.2311 179.797L106.93 182.574Z"
                    fill="#15BA5C"
                  />
                  <path
                    d="M90.125 186.522C90.125 186.591 92.9022 187.238 96.3613 187.965C99.8203 188.692 102.632 189.224 102.647 189.16C102.662 189.095 99.8701 188.443 96.411 187.716C92.952 186.99 90.1399 186.452 90.125 186.522Z"
                    fill="white"
                  />
                  <path
                    d="M89.6484 189.704C89.6484 189.774 92.4256 190.416 95.8847 191.147C99.3438 191.879 102.156 192.406 102.171 192.342C102.186 192.277 99.3935 191.625 95.9345 190.898C92.4754 190.172 89.6634 189.619 89.6484 189.704Z"
                    fill="white"
                  />
                  <path
                    d="M92.3945 193.297C92.7133 193.435 93.0475 193.536 93.3899 193.596C94.032 193.75 94.9229 193.954 95.9034 194.163C96.8838 194.372 97.7847 194.541 98.4367 194.661C98.7849 194.748 99.1427 194.791 99.5018 194.79C99.1708 194.651 98.8252 194.549 98.4715 194.486C97.8345 194.327 96.9436 194.123 95.9581 193.919C94.9727 193.715 94.0768 193.536 93.4298 193.421C93.091 193.338 92.7434 193.296 92.3945 193.297Z"
                    fill="white"
                  />
                  <path
                    d="M195.919 148.695C195.919 148.695 197.845 160.61 195.894 168.21L177.061 167.807C177.061 167.807 180.913 155.673 178.469 149.606L195.919 148.695Z"
                    fill="#EBEBEB"
                  />
                  <path
                    d="M195.833 148.25C195.833 148.25 195.708 163.236 194.947 167.81L176.148 166.919C176.148 166.919 177.796 152.187 177.144 148.25H195.833Z"
                    fill="#455A64"
                  />
                  <path
                    d="M179.812 154.912C179.812 154.981 182.639 155.041 186.128 155.046C189.617 155.051 192.449 155.001 192.449 154.932C192.449 154.862 189.622 154.802 186.128 154.797C182.634 154.792 179.812 154.842 179.812 154.912Z"
                    fill="white"
                  />
                  <path
                    d="M179.992 158.084C179.992 158.153 182.819 158.213 186.308 158.218C189.797 158.223 192.629 158.173 192.629 158.103C192.629 158.034 189.802 157.974 186.308 157.969C182.814 157.964 179.992 158.014 179.992 158.084Z"
                    fill="white"
                  />
                  <path
                    d="M183.361 161.004C183.708 161.078 184.062 161.11 184.416 161.098C185.068 161.098 185.969 161.133 186.965 161.138C187.96 161.143 188.856 161.138 189.508 161.103C189.862 161.118 190.216 161.089 190.563 161.019C190.217 160.945 189.862 160.915 189.508 160.929C188.856 160.904 187.96 160.889 186.965 160.884C185.969 160.879 185.068 160.884 184.416 160.919C184.063 160.905 183.708 160.933 183.361 161.004Z"
                    fill="white"
                  />
                  <path
                    d="M199.901 114.335C196.387 114.335 192.848 112.13 190.987 108.661C189.177 105.206 188.616 101.233 189.399 97.4126C190.429 92.4356 193.724 88.3544 197.795 87.0504C201.254 85.9405 207.436 86.5527 210.352 91.4352C211.742 93.8227 212.432 96.5529 212.343 99.3139C212.33 99.5099 212.279 99.7015 212.192 99.8777C212.104 100.054 211.983 100.211 211.836 100.34C211.688 100.47 211.516 100.569 211.33 100.632C211.143 100.695 210.947 100.721 210.751 100.707C210.355 100.681 209.985 100.498 209.724 100.2C209.463 99.901 209.331 99.5108 209.357 99.1148C209.384 96.9592 208.83 94.8361 207.754 92.9681C205.505 89.2104 200.573 89.2851 198.671 89.8923C195.187 91.0071 192.958 94.7748 192.286 98.0148C191.641 101.152 192.099 104.415 193.585 107.252C195.053 109.99 198.024 111.692 200.657 111.289C201.046 111.235 201.44 111.336 201.755 111.57C202.07 111.804 202.279 112.153 202.339 112.541C202.398 112.929 202.303 113.325 202.073 113.643C201.843 113.96 201.497 114.175 201.11 114.24C200.71 114.302 200.306 114.334 199.901 114.335Z"
                    fill="#263238"
                  />
                  <path
                    d="M103.504 114.339C99.985 114.339 96.4513 112.134 94.5899 108.665C92.7787 105.211 92.2161 101.238 92.9972 97.4171C93.8682 93.2165 96.8146 88.3787 101.458 87.0449C103.697 86.4385 106.071 86.5587 108.237 87.3883L107.162 90.1755C105.603 89.583 103.898 89.4909 102.284 89.9117C98.8602 90.9071 96.6305 94.6996 95.9436 98.0193C95.2985 101.156 95.7574 104.42 97.2427 107.257C98.7109 109.999 101.687 111.696 104.315 111.293L104.768 114.245C104.35 114.309 103.927 114.341 103.504 114.339Z"
                    fill="#263238"
                  />
                  <path
                    d="M198.671 99.3906L197.297 106.911H217.509L219.305 99.4653L198.671 99.3906Z"
                    fill="#15BA5C"
                  />
                  <path
                    d="M108.626 113.148C108.627 113.784 108.439 114.406 108.086 114.936C107.733 115.465 107.231 115.878 106.643 116.122C106.055 116.366 105.409 116.43 104.784 116.306C104.16 116.182 103.587 115.876 103.137 115.426C102.687 114.976 102.381 114.403 102.257 113.779C102.133 113.155 102.197 112.508 102.441 111.92C102.685 111.332 103.098 110.83 103.627 110.477C104.157 110.124 104.779 109.937 105.415 109.938C106.266 109.939 107.082 110.277 107.684 110.879C108.286 111.481 108.624 112.297 108.626 113.148Z"
                    fill="#263238"
                  />
                  <path
                    d="M204.938 113.148C204.939 113.784 204.751 114.406 204.398 114.936C204.045 115.465 203.543 115.878 202.956 116.122C202.368 116.366 201.721 116.43 201.097 116.306C200.473 116.182 199.899 115.876 199.45 115.426C199 114.976 198.693 114.403 198.569 113.779C198.445 113.155 198.51 112.508 198.754 111.92C198.997 111.332 199.41 110.83 199.94 110.477C200.469 110.124 201.092 109.937 201.728 109.938C202.579 109.939 203.395 110.277 203.996 110.879C204.598 111.481 204.937 112.297 204.938 113.148Z"
                    fill="#263238"
                  />
                  <path
                    d="M151.895 50.9219L146.609 70.9695L128.363 72.9304V76.1655L154 77.0664L158.818 54.575L151.895 50.9219Z"
                    fill="#FFBE9D"
                  />
                  <path
                    d="M159.584 77.592C159.584 77.592 131.076 76.2333 122.958 82.5691C114.84 88.9049 118.772 99.307 118.772 99.307L164.651 99.1875L168.702 75.9297L159.584 77.592Z"
                    fill="#263238"
                  />
                  <path
                    d="M164.438 92.9361C164.3 92.9396 164.162 92.9296 164.025 92.9062C163.757 92.8764 163.363 92.8366 162.856 92.7719C161.86 92.6474 160.367 92.4384 158.576 92.1348C153.871 91.3347 149.218 90.2595 144.64 88.9146C141.962 88.1233 139.429 87.3269 137.09 86.7446C135.025 86.2102 132.913 85.8769 130.784 85.7492C129.347 85.6688 127.906 85.7523 126.488 85.9981C125.991 86.0578 125.607 86.1872 125.339 86.232C125.206 86.2648 125.071 86.2897 124.936 86.3066C125.062 86.2522 125.194 86.2105 125.329 86.1822C125.703 86.0657 126.083 85.9709 126.468 85.8985C127.889 85.6115 129.34 85.4995 130.789 85.5651C132.948 85.668 135.093 85.9864 137.189 86.5157C139.543 87.0831 142.082 87.8794 144.749 88.6707C149.303 90.004 153.923 91.0988 158.59 91.9506C160.387 92.2791 161.845 92.513 162.856 92.6723L164.02 92.8565C164.162 92.8713 164.302 92.8979 164.438 92.9361Z"
                    fill="#455A64"
                  />
                  <path
                    d="M137.94 86.5913C137.148 85.9382 136.304 85.3506 135.417 84.8344C134.487 84.3993 133.523 84.0398 132.535 83.7594C132.842 83.7327 133.151 83.7631 133.446 83.849C134.174 84.0057 134.877 84.2601 135.536 84.6055C136.195 84.9528 136.804 85.3863 137.348 85.8946C137.587 86.0882 137.788 86.3245 137.94 86.5913Z"
                    fill="#455A64"
                  />
                  <path
                    d="M162.606 139.57L162.989 151.55L160.58 161.116C160.541 161.28 160.536 161.45 160.566 161.616C160.596 161.782 160.659 161.939 160.753 162.08C160.846 162.22 160.967 162.339 161.109 162.43C161.251 162.521 161.41 162.582 161.576 162.609C161.768 162.644 161.966 162.633 162.153 162.576C162.34 162.518 162.511 162.417 162.651 162.281C164.462 160.509 171.112 153.959 171.027 153.088C170.938 152.093 171.46 140.416 171.46 140.416L162.606 139.57Z"
                    fill="#15BA5C"
                  />
                  <g opacity="0.6">
                    <path
                      d="M161.531 162.621L170.988 152.289V152.787C170.993 153.226 170.842 153.654 170.56 153.991C169.808 154.892 167.673 157.336 162.651 162.283C162.508 162.425 162.331 162.529 162.137 162.587C161.944 162.644 161.739 162.653 161.541 162.611L161.531 162.621Z"
                      fill="white"
                    />
                  </g>
                  <g opacity="0.6">
                    <path
                      d="M168.48 148.439C168.328 148.55 168.224 148.715 168.188 148.899C168.152 149.084 168.187 149.275 168.286 149.435C168.39 149.584 168.548 149.687 168.726 149.724C168.905 149.761 169.091 149.729 169.246 149.634C169.402 149.518 169.509 149.348 169.546 149.157C169.583 148.967 169.547 148.769 169.445 148.604C169.321 148.458 169.146 148.366 168.955 148.347C168.765 148.329 168.575 148.385 168.425 148.504"
                      fill="white"
                    />
                  </g>
                  <path
                    d="M164.225 157.361C164.155 157.396 163.877 156.774 163.165 156.44C162.724 156.267 162.254 156.183 161.781 156.191C161.781 156.161 161.921 156.067 162.199 156.022C162.569 155.977 162.943 156.039 163.278 156.201C163.614 156.362 163.895 156.616 164.091 156.933C164.23 157.177 164.25 157.351 164.225 157.361Z"
                    fill="#263238"
                  />
                  <path
                    d="M163.384 158.977C163.04 158.789 162.684 158.623 162.319 158.479C161.931 158.411 161.538 158.364 161.145 158.34C161.327 158.222 161.536 158.151 161.753 158.131C161.969 158.111 162.187 158.143 162.389 158.226C163.096 158.415 163.444 158.942 163.384 158.977Z"
                    fill="#263238"
                  />
                  <path
                    d="M165.792 155.274C165.284 154.939 164.752 154.641 164.2 154.383C163.617 154.205 163.021 154.072 162.418 153.985C163.045 153.854 163.696 153.905 164.295 154.134C164.893 154.362 165.413 154.758 165.792 155.274Z"
                    fill="#263238"
                  />
                  <path
                    d="M165.982 151.633C165.952 151.708 165.285 151.434 164.424 151.414C163.563 151.394 162.881 151.603 162.852 151.529C163.334 151.263 163.88 151.132 164.431 151.15C164.982 151.169 165.518 151.335 165.982 151.633Z"
                    fill="#263238"
                  />
                  <path
                    d="M165.956 148.122C165.432 147.957 164.888 147.865 164.339 147.848C163.794 147.912 163.262 148.051 162.756 148.262C162.756 148.237 162.865 148.082 163.139 147.923C163.505 147.716 163.916 147.599 164.336 147.581C164.756 147.562 165.175 147.644 165.558 147.819C165.832 147.953 165.976 148.092 165.956 148.122Z"
                    fill="#263238"
                  />
                  <path
                    d="M164.353 147.17C164.322 147.021 164.322 146.867 164.353 146.717C164.39 146.301 164.51 145.897 164.706 145.528C164.823 145.244 165.031 145.007 165.298 144.856C165.391 144.815 165.494 144.802 165.593 144.821C165.693 144.84 165.785 144.888 165.856 144.96C165.984 145.11 166.053 145.301 166.05 145.498C166.026 145.899 165.865 146.28 165.593 146.576C165.321 146.871 164.955 147.064 164.557 147.12C164.16 147.165 163.758 147.09 163.404 146.906C163.049 146.721 162.758 146.436 162.566 146.085C162.518 145.997 162.489 145.899 162.482 145.798C162.475 145.698 162.49 145.597 162.526 145.503C162.573 145.414 162.645 145.341 162.734 145.294C162.823 145.247 162.924 145.228 163.024 145.239C163.32 145.302 163.594 145.441 163.82 145.642C164.147 145.901 164.426 146.214 164.646 146.568C164.734 146.693 164.798 146.833 164.835 146.981C164.519 146.531 164.138 146.131 163.706 145.792C163.504 145.626 163.265 145.511 163.009 145.458C162.954 145.449 162.897 145.457 162.847 145.482C162.797 145.507 162.756 145.548 162.73 145.598C162.712 145.661 162.708 145.728 162.716 145.794C162.725 145.86 162.747 145.923 162.78 145.981C162.954 146.277 163.21 146.517 163.517 146.673C163.825 146.828 164.17 146.892 164.512 146.857C164.851 146.813 165.166 146.655 165.402 146.407C165.639 146.16 165.783 145.839 165.811 145.498C165.818 145.362 165.775 145.228 165.691 145.12C165.654 145.077 165.604 145.048 165.548 145.036C165.492 145.025 165.434 145.031 165.383 145.055C165.164 145.188 164.991 145.384 164.885 145.617C164.62 146.101 164.44 146.626 164.353 147.17Z"
                    fill="#263238"
                  />
                  <path
                    d="M168.678 75.9351C168.678 75.9351 156.35 99.2427 156.181 103.309C156.011 107.375 156.181 144.858 156.181 144.858H175.263C175.76 144.858 178.622 127.97 178.04 124.083C177.458 120.196 175.402 99.3025 175.402 99.3025H186.381C186.381 99.3025 189.393 96.0823 189.283 91.9961C189.218 89.7415 187.745 85.1328 186.297 82.689C185.356 81.1212 179.329 72.9141 179.329 72.9141L168.678 75.9351Z"
                    fill="#263238"
                  />
                  <path
                    d="M167.852 77.5161C167.838 77.5628 167.82 77.6078 167.797 77.6505C167.752 77.7501 167.692 77.8745 167.618 78.0288L166.901 79.4821C166.578 80.1142 166.194 80.8806 165.746 81.7715L165.03 83.2L164.278 84.8275L160.58 92.8355C159.878 94.3287 159.142 95.9263 158.375 97.5638L157.216 100.052C156.841 100.913 156.557 101.81 156.37 102.73C156.181 103.652 156.082 104.591 156.076 105.532C156.046 106.463 156.026 107.384 156.011 108.284C156.011 110.096 155.976 111.838 155.981 113.5C155.981 116.825 156.021 119.821 156.056 122.335C156.091 124.848 156.121 126.864 156.146 128.307C156.146 128.994 156.146 129.536 156.146 129.925C156.146 130.099 156.146 130.238 156.146 130.348C156.146 130.457 156.146 130.492 156.146 130.492C156.137 130.444 156.137 130.395 156.146 130.348C156.146 130.238 156.146 130.099 156.146 129.93C156.146 129.536 156.106 128.999 156.076 128.307C156.026 126.904 155.961 124.868 155.907 122.335C155.852 119.801 155.792 116.83 155.777 113.5C155.777 111.838 155.777 110.091 155.777 108.284C155.777 107.379 155.807 106.458 155.842 105.522C155.847 104.566 155.945 103.612 156.136 102.675C156.328 101.738 156.619 100.824 157.002 99.9478L158.166 97.4592L160.386 92.741L164.159 84.7528L164.925 83.1303C165.189 82.6326 165.423 82.1349 165.662 81.7118L166.851 79.4423C167.175 78.8301 167.434 78.3523 167.613 78.0089C167.697 77.8596 167.767 77.7401 167.817 77.6406C167.867 77.541 167.847 77.5112 167.852 77.5161Z"
                    fill="#455A64"
                  />
                  <path
                    d="M163.86 85.4461C163.464 84.4986 163.132 83.5259 162.865 82.5345C162.515 81.5692 162.231 80.5815 162.014 79.5781C162.478 80.4981 162.845 81.4639 163.109 82.4598C163.461 83.4268 163.713 84.4275 163.86 85.4461Z"
                    fill="#455A64"
                  />
                  <path
                    d="M178.079 123.351C178.048 123.266 178.027 123.177 178.02 123.087C177.996 122.884 177.962 122.631 177.915 122.325C177.825 121.624 177.711 120.668 177.567 119.508C177.293 117.099 176.925 113.83 176.517 110.216C176.108 106.603 175.775 103.293 175.571 100.909C175.476 99.7444 175.397 98.7888 175.337 98.0871C175.337 97.7735 175.297 97.5197 175.282 97.3156C175.276 97.2262 175.276 97.1363 175.282 97.0469C175.314 97.1316 175.332 97.2205 175.337 97.3107C175.362 97.5147 175.397 97.7686 175.437 98.0771C175.516 98.7789 175.626 99.7295 175.755 100.894C176.019 103.303 176.377 106.578 176.75 110.191C177.124 113.805 177.477 117.075 177.746 119.488C177.855 120.653 177.95 121.609 178.015 122.31C178.04 122.619 178.059 122.878 178.074 123.082C178.084 123.171 178.085 123.261 178.079 123.351Z"
                    fill="#455A64"
                  />
                  <path
                    d="M173.232 13.5132C172.939 11.5224 174.646 9.60619 176.617 9.37227C178.588 9.13835 180.573 10.3677 181.479 12.1644C181.901 13.068 182.132 14.0488 182.157 15.0455C182.183 16.0423 182.003 17.0336 181.629 17.9577C181.131 19.2169 180.21 20.491 178.871 20.5906C177.532 20.6901 176.507 19.6698 175.621 18.7292"
                    fill="#263238"
                  />
                  <path
                    d="M159.223 23.3837C155.241 14.6589 164.697 10.2741 169.839 11.7274C174.676 13.0961 176.742 15.505 177.538 18.7401C178.411 21.9858 178.236 25.4239 177.041 28.5648C176.413 30.0878 175.289 31.6307 173.656 31.8198"
                    fill="#263238"
                  />
                  <path
                    d="M172.924 16.5732C173.333 16.6156 173.712 16.8108 173.984 17.1198C174.256 17.4288 174.402 17.8289 174.392 18.2405L173.461 40.4482C173.427 43.0711 169.599 44.5542 166.787 44.4945C163.955 44.4348 163.861 43.0412 163.801 40.5477C163.736 36.3819 163.736 34.8141 163.736 34.839C163.736 34.8639 160.153 34.2418 159.411 29.5683C159.038 27.244 159.157 23.4316 159.351 20.3159C159.531 17.5139 161.387 14.0697 164.184 14.3435L172.924 16.5732Z"
                    fill="#FFBE9D"
                  />
                  <path
                    d="M161.184 22.974C161.181 23.1307 161.24 23.2822 161.348 23.3958C161.456 23.5094 161.604 23.576 161.761 23.5812C161.837 23.5873 161.914 23.578 161.987 23.5538C162.06 23.5296 162.127 23.4911 162.184 23.4405C162.242 23.3899 162.289 23.3283 162.322 23.2593C162.355 23.1902 162.374 23.1152 162.378 23.0387C162.38 22.8823 162.32 22.7316 162.212 22.6182C162.105 22.5049 161.957 22.438 161.801 22.4315C161.724 22.4254 161.648 22.4347 161.575 22.4589C161.502 22.483 161.435 22.5216 161.377 22.5722C161.32 22.6228 161.273 22.6844 161.24 22.7534C161.207 22.8224 161.187 22.8975 161.184 22.974Z"
                    fill="#263238"
                  />
                  <path
                    d="M160.192 22.304C160.267 22.3787 160.725 22.0452 161.367 22.0452C162.009 22.0452 162.487 22.3687 162.556 22.2891C162.626 22.2095 162.516 22.1149 162.307 21.9656C162.028 21.7727 161.696 21.6702 161.357 21.6719C161.022 21.6687 160.695 21.7753 160.426 21.9755C160.227 22.1249 160.157 22.2692 160.192 22.304Z"
                    fill="#263238"
                  />
                  <path
                    d="M167.488 22.9728C167.487 23.1259 167.543 23.2739 167.647 23.3867C167.75 23.4995 167.893 23.5686 168.046 23.58C168.122 23.5861 168.199 23.5767 168.272 23.5526C168.344 23.5284 168.412 23.4899 168.469 23.4393C168.527 23.3887 168.573 23.3271 168.607 23.258C168.64 23.189 168.659 23.114 168.663 23.0375C168.664 22.8811 168.605 22.7303 168.497 22.617C168.389 22.5037 168.242 22.4367 168.086 22.4303C167.935 22.4235 167.787 22.4767 167.675 22.5784C167.563 22.68 167.496 22.8218 167.488 22.9728Z"
                    fill="#263238"
                  />
                  <path
                    d="M166.553 22.4212C166.627 22.4959 167.08 22.1624 167.722 22.1624C168.364 22.1624 168.842 22.4859 168.912 22.4112C168.982 22.3366 168.872 22.2321 168.663 22.0828C168.384 21.8889 168.052 21.7864 167.712 21.7891C167.378 21.7891 167.052 21.8954 166.782 22.0927C166.553 22.242 166.498 22.3913 166.553 22.4212Z"
                    fill="#263238"
                  />
                  <path
                    d="M164.195 27.2005C163.856 27.0959 163.505 27.0324 163.15 27.0114C162.986 27.0114 162.827 26.9616 162.802 26.8521C162.786 26.6789 162.824 26.5051 162.911 26.3544C163.066 25.9563 163.225 25.5382 163.409 25.1002C163.86 24.0376 164.226 22.9408 164.504 21.8203C163.965 22.8433 163.51 23.9086 163.145 25.0056L162.677 26.2698C162.575 26.469 162.545 26.6979 162.593 26.9168C162.617 26.9747 162.655 27.0262 162.702 27.0676C162.75 27.1089 162.806 27.1391 162.866 27.1557C162.958 27.1798 163.051 27.1932 163.145 27.1955C163.494 27.2406 163.846 27.2423 164.195 27.2005Z"
                    fill="#263238"
                  />
                  <path
                    d="M163.752 34.8314C165.962 34.8716 168.139 34.2942 170.038 33.1641C170.038 33.1641 168.515 36.3792 163.837 35.9413L163.752 34.8314Z"
                    fill="#EB996E"
                  />
                  <path
                    d="M164.468 28.7558C164.591 28.6025 164.751 28.4828 164.933 28.4079C165.115 28.3331 165.312 28.3055 165.508 28.3278C165.651 28.3398 165.79 28.3808 165.917 28.4484C166.043 28.5161 166.155 28.6088 166.244 28.721C166.33 28.8284 166.381 28.9594 166.39 29.0964C166.399 29.2335 166.365 29.3699 166.294 29.4875C166.191 29.6038 166.055 29.6865 165.904 29.7246C165.753 29.7628 165.594 29.7547 165.448 29.7015C165.142 29.5936 164.861 29.4242 164.622 29.2038C164.55 29.1523 164.487 29.0883 164.438 29.0147C164.415 28.9791 164.402 28.9376 164.402 28.8952C164.402 28.8528 164.415 28.8113 164.438 28.7758"
                    fill="#EB996E"
                  />
                  <path
                    d="M166.095 27.6485C165.99 27.6485 165.985 28.3404 165.388 28.8381C164.791 29.3358 164.044 29.2561 164.039 29.3358C164.034 29.4154 164.203 29.4701 164.537 29.4801C164.948 29.4848 165.347 29.3457 165.667 29.0869C165.97 28.8375 166.166 28.4812 166.214 28.0915C166.219 27.8178 166.139 27.6436 166.095 27.6485Z"
                    fill="#263238"
                  />
                  <path
                    d="M166.245 21.2911C166.31 21.4653 166.957 21.3807 167.713 21.4753C168.47 21.5698 169.082 21.7689 169.181 21.6146C169.226 21.54 169.117 21.3757 168.873 21.2015C168.545 20.9906 168.171 20.8609 167.783 20.8233C167.396 20.775 167.003 20.8211 166.638 20.9577C166.36 21.0672 166.22 21.2065 166.245 21.2911Z"
                    fill="#263238"
                  />
                  <path
                    d="M160.432 20.4319C160.547 20.5812 160.99 20.4319 161.527 20.4319C162.065 20.4319 162.523 20.5314 162.617 20.3771C162.662 20.3025 162.617 20.1532 162.393 20.0188C162.131 19.8464 161.821 19.761 161.507 19.7749C161.194 19.7814 160.89 19.8839 160.636 20.0685C160.447 20.2129 160.382 20.3622 160.432 20.4319Z"
                    fill="#263238"
                  />
                  <path
                    d="M166.519 12.8108C164.932 12.8917 163.392 13.371 162.039 14.2043C161.281 14.5973 160.608 15.1358 160.058 15.7891C159.508 16.4424 159.092 17.1977 158.834 18.0118C158.769 18.1811 158.738 18.362 158.745 18.5435C158.752 18.7249 158.796 18.903 158.874 19.0669C159.022 19.2544 159.231 19.3843 159.464 19.4343C159.698 19.4843 159.941 19.4512 160.153 19.3407C160.575 19.1113 160.934 18.7813 161.198 18.3801C161.303 18.8189 161.554 19.2089 161.91 19.4863C162.266 19.7636 162.706 19.9118 163.157 19.9066C163.608 19.9014 164.044 19.7431 164.394 19.4576C164.743 19.1721 164.985 18.7764 165.08 18.3353C165.116 18.7837 165.323 19.201 165.659 19.5005C165.994 19.7999 166.432 19.9584 166.882 19.9429C167.33 19.9041 167.758 19.735 168.112 19.4565C168.465 19.1779 168.73 18.8021 168.873 18.3751C168.982 19.1844 169.262 19.9613 169.694 20.6546C169.915 20.9987 170.236 21.2665 170.615 21.4214C170.993 21.5764 171.41 21.611 171.809 21.5206C171.642 22.2087 171.652 22.928 171.839 23.611C172.088 24.268 173.078 35.5111 173.745 35.2822C174.412 35.0533 174.387 23.5861 174.537 22.9192C174.868 21.6399 175.035 20.3237 175.034 19.0022C175.079 17.6409 174.638 16.3081 173.79 15.2422C172.942 14.1763 171.742 13.4468 170.406 13.184C169.071 12.878 167.702 12.7524 166.334 12.8108"
                    fill="#263238"
                  />
                  <path
                    d="M175.884 33.2838C175.884 33.2838 175.84 33.3136 175.74 33.3485C175.6 33.3997 175.455 33.4348 175.307 33.453C174.615 33.5409 173.912 33.4304 173.28 33.1343C172.648 32.8383 172.114 32.3688 171.738 31.7807C171.23 30.8947 171.015 29.8699 171.126 28.8542C171.201 27.7841 171.45 26.8086 171.564 25.9128C171.677 25.1174 171.747 24.3166 171.773 23.5138C171.773 22.827 171.773 22.2745 171.773 21.8863C171.752 21.6878 171.752 21.4876 171.773 21.2891C171.832 21.4848 171.868 21.687 171.878 21.8913C171.932 22.4354 171.959 22.9819 171.957 23.5287C171.956 24.3391 171.905 25.1486 171.803 25.9526C171.694 26.8684 171.46 27.8488 171.385 28.8791C171.279 29.8434 171.473 30.817 171.942 31.6662C172.352 32.3423 172.981 32.8572 173.724 33.1245C174.224 33.3151 174.758 33.3965 175.292 33.3634C175.675 33.3385 175.879 33.2589 175.884 33.2838Z"
                    fill="#263238"
                  />
                  <path
                    d="M164.871 12.2031C165.052 12.5439 165.136 12.9277 165.114 13.313C165.132 14.2561 164.775 15.1677 164.122 15.8486C163.469 16.5294 162.573 16.9241 161.63 16.9463C161.248 16.983 160.862 16.9141 160.516 16.7472C160.516 16.7024 160.944 16.8218 161.621 16.7472C162.505 16.6871 163.336 16.3003 163.951 15.662C164.567 15.0236 164.923 14.1793 164.95 13.2931C164.965 12.6312 164.826 12.2131 164.871 12.2031Z"
                    fill="#455A64"
                  />
                  <path
                    d="M165.558 17.712C165.583 17.712 165.524 18.0305 165.165 18.3789C164.927 18.5928 164.649 18.7564 164.346 18.8599C164.043 18.9634 163.722 19.0046 163.403 18.9811C162.778 18.9253 162.175 18.7186 161.646 18.3789C161.243 18.1251 161.024 17.931 161.044 17.8812C161.285 17.9571 161.516 18.0624 161.731 18.1947C162.256 18.4677 162.829 18.6367 163.418 18.6924C164.003 18.7269 164.58 18.5503 165.046 18.1947C165.409 17.9658 165.529 17.6921 165.558 17.712Z"
                    fill="#455A64"
                  />
                  <path
                    d="M176.833 16.2812C176.866 16.7097 176.836 17.1407 176.743 17.5604C176.602 18.5999 176.209 19.5893 175.598 20.4421C175.279 20.865 174.877 21.2182 174.417 21.4801C173.956 21.742 173.447 21.907 172.921 21.9651C172.601 21.9939 172.278 21.9618 171.97 21.8705C171.756 21.8058 171.651 21.7411 171.656 21.7262C172.067 21.7996 172.485 21.818 172.901 21.7809C173.891 21.6202 174.781 21.0858 175.389 20.2878C175.972 19.4632 176.371 18.5228 176.559 17.5305C176.624 17.1088 176.716 16.6916 176.833 16.2812Z"
                    fill="#455A64"
                  />
                  <path
                    d="M177.687 18.5469C177.732 18.6748 177.758 18.8092 177.761 18.945C177.795 19.3074 177.803 19.6716 177.786 20.035C177.76 21.2597 177.322 22.4398 176.542 23.3846C176.102 23.904 175.529 24.2945 174.885 24.5144C174.356 24.6872 173.793 24.7215 173.247 24.6139C172.881 24.544 172.533 24.3982 172.227 24.1859C172.018 24.0316 171.928 23.9171 171.938 23.9072C172.347 24.167 172.801 24.3461 173.277 24.4347C173.791 24.5085 174.314 24.4591 174.805 24.2904C175.403 24.0698 175.934 23.6997 176.348 23.2154C177.087 22.3056 177.527 21.1895 177.607 20.0201C177.687 19.1192 177.642 18.5519 177.687 18.5469Z"
                    fill="#455A64"
                  />
                  <path
                    d="M112.084 78.7111L103.051 99.3709H115.488L124.348 78.5469L112.084 78.7111Z"
                    fill="#455A64"
                  />
                  <path
                    d="M105.516 56.7288L115.704 76.7665H147.836L146.537 74.1485L137.23 73.8698L129.64 56.9777C129.409 56.4631 129.035 56.0262 128.561 55.7197C128.088 55.4133 127.536 55.2503 126.972 55.2506H106.422C106.245 55.2443 106.071 55.2849 105.915 55.3683C105.76 55.4517 105.629 55.5749 105.537 55.7253C105.445 55.8757 105.395 56.0478 105.391 56.2242C105.387 56.4005 105.43 56.5747 105.516 56.7288Z"
                    fill="#E0E0E0"
                  />
                  <path
                    d="M121.605 65.7137C121.605 65.9568 121.533 66.1945 121.398 66.3967C121.263 66.5989 121.071 66.7564 120.846 66.8495C120.622 66.9425 120.374 66.9669 120.136 66.9194C119.898 66.872 119.678 66.7549 119.507 66.583C119.335 66.4111 119.218 66.192 119.17 65.9535C119.123 65.7151 119.147 65.4679 119.24 65.2433C119.333 65.0186 119.491 64.8266 119.693 64.6916C119.895 64.5565 120.133 64.4844 120.376 64.4844C120.701 64.4857 121.013 64.6156 121.244 64.8459C121.474 65.0761 121.604 65.3881 121.605 65.7137Z"
                    fill="#263238"
                  />
                  <path
                    d="M151.259 76.8125H111.98V78.7287H151.259V76.8125Z"
                    fill="#455A64"
                  />
                  <path
                    d="M139.16 77.7734L151.11 99.3888H156.824L158.068 96.9152L159.213 94.3122L151.259 78.729L139.16 77.7734Z"
                    fill="#455A64"
                  />
                  <path
                    d="M159.923 40.7109C159.923 40.7109 152.985 43.1547 151.492 50.9189L158.818 54.5721L159.923 40.7109Z"
                    fill="#15BA5C"
                  />
                  <path
                    d="M159.924 40.7126C159.924 40.7126 155.071 51.5924 155.255 57.5351C155.32 59.6005 156.674 65.0007 156.674 65.0007L159.197 78.369C159.197 78.369 178.513 75.7561 178.941 75.7561C179.369 75.7561 178.294 64.7817 178.294 64.7817L181.444 43.6938C181.444 43.6938 180.001 40.8221 173.481 39.8267C169.574 39.2145 159.924 40.7126 159.924 40.7126Z"
                    fill="#15BA5C"
                  />
                  <path
                    d="M158.094 47.0234C158.139 47.0483 157.631 47.8596 157.019 49.2631C156.664 50.0849 156.365 50.9296 156.123 51.7915C155.832 52.8476 155.621 53.924 155.491 55.0116C155.376 56.1009 155.341 57.1971 155.386 58.2915C155.432 59.1851 155.536 60.0746 155.7 60.9542C155.979 62.4474 156.297 63.3631 156.247 63.3781C156.143 63.1799 156.06 62.9714 155.999 62.7559C155.91 62.5094 155.833 62.2586 155.77 62.0044C155.69 61.7058 155.585 61.3723 155.516 61.009C155.329 60.123 155.206 59.2249 155.147 58.3214C155.088 57.2126 155.116 56.101 155.232 54.9967C155.365 53.894 155.586 52.8038 155.894 51.7367C156.15 50.8692 156.471 50.0224 156.855 49.2034C156.994 48.8853 157.151 48.5746 157.322 48.2727C157.441 48.0386 157.573 47.811 157.716 47.5908C157.822 47.3894 157.949 47.1992 158.094 47.0234Z"
                    fill="#263238"
                  />
                  <path
                    d="M162.273 40.6113L162.552 37.6251C162.583 37.3147 162.726 37.0265 162.956 36.8154C163.185 36.6042 163.485 36.485 163.796 36.4804L173.327 36.336C173.617 36.3326 173.896 36.4392 174.11 36.6342C174.323 36.8291 174.455 37.098 174.477 37.3862L174.721 40.6063C173.923 42.2975 172.573 43.6667 170.894 44.4884C168.092 45.8472 163.737 45.892 163.737 45.892L162.273 40.6113Z"
                    fill="#15BA5C"
                  />
                  <path
                    d="M164.767 36.5029C164.797 36.5029 164.658 36.697 164.598 37.0006C164.544 37.4403 164.544 37.8848 164.598 38.3245C164.682 38.9655 164.682 39.6146 164.598 40.2556C164.427 39.6313 164.34 38.9868 164.339 38.3394C164.273 37.8785 164.293 37.4092 164.399 36.9558C164.563 36.6124 164.752 36.478 164.767 36.5029Z"
                    fill="#263238"
                  />
                  <path
                    d="M167.052 40.1961C166.885 39.5865 166.805 38.9566 166.813 38.3247C166.776 37.8775 166.776 37.4281 166.813 36.9809C166.863 36.6225 167.007 36.4384 167.037 36.4832C167.067 36.528 166.992 36.6922 166.997 37.0207C167.002 37.3492 167.052 37.817 167.052 38.3147C167.136 38.9391 167.136 39.5718 167.052 40.1961Z"
                    fill="#263238"
                  />
                  <path
                    d="M169.913 40.1219C169.708 39.5411 169.582 38.935 169.54 38.3202C169.417 37.7112 169.379 37.0882 169.426 36.4688C169.634 37.0541 169.759 37.6655 169.799 38.2854C169.92 38.8895 169.959 39.5074 169.913 40.1219Z"
                    fill="#263238"
                  />
                  <path
                    d="M172.38 40.3077C172.153 39.6681 172.032 38.9956 172.022 38.3169C171.926 37.6402 171.943 36.9524 172.072 36.2812C172.202 36.9371 172.272 37.6035 172.281 38.2721C172.377 38.946 172.411 39.6275 172.38 40.3077Z"
                    fill="#263238"
                  />
                  <g opacity="0.3">
                    <path
                      d="M174.271 51.7109C173.888 55.0605 174.142 60.8339 175.326 63.9943L180.891 54.8017L174.271 51.7109Z"
                      fill="black"
                    />
                  </g>
                  <path
                    d="M180.928 43L180.958 43.0299C182.536 44.6862 183.69 46.6993 184.322 48.8978L185.348 53.5713L174.398 55.2635C173.795 53.2812 173.652 51.1875 173.98 49.1417C174.518 45.6179 180.928 43 180.928 43Z"
                    fill="#15BA5C"
                  />
                  <path
                    d="M185.347 53.5722C185.276 53.5973 185.203 53.6156 185.128 53.627L184.501 53.7414L182.157 54.1247L174.224 55.3291H174.084V55.1848C174.059 54.5228 174.039 53.836 174.024 53.1292C174 51.2927 174.024 49.5358 174.134 47.9382C174.21 46.5065 174.648 45.1176 175.408 43.9018C175.919 43.084 176.619 42.4012 177.449 41.911C177.673 41.7779 177.909 41.6678 178.155 41.5825C178.237 41.5448 178.325 41.5196 178.414 41.5078C178.414 41.5078 178.066 41.6422 177.498 42.0055C176.709 42.5115 176.046 43.1928 175.562 43.9963C174.841 45.2045 174.431 46.5725 174.368 47.978C174.253 49.5607 174.258 51.3126 174.288 53.1492C174.288 53.846 174.323 54.5378 174.338 55.1947L174.194 55.0703L182.157 53.9505L184.511 53.6469L185.148 53.5722C185.214 53.5636 185.281 53.5636 185.347 53.5722Z"
                    fill="#263238"
                  />
                  <path
                    d="M162.219 46.7095C161.661 46.3849 161.149 45.9883 160.696 45.5299C160.184 45.1353 159.729 44.6732 159.342 44.1562C160.41 44.8752 161.378 45.7339 162.219 46.7095Z"
                    fill="#FAFAFA"
                  />
                  <path
                    d="M160.74 52.4688C160.35 52.8697 159.898 53.2058 159.401 53.4642C158.946 53.7944 158.442 54.0529 157.908 54.2306C158.753 53.5046 159.705 52.9137 160.73 52.4787L160.74 52.4688Z"
                    fill="#FAFAFA"
                  />
                  <path
                    d="M166.848 53.8889C166.759 53.1816 166.759 52.466 166.848 51.7587C166.851 51.0476 166.938 50.3393 167.106 49.6484C167.193 50.3542 167.193 51.0679 167.106 51.7736C167.105 52.4865 167.018 53.1966 166.848 53.8889Z"
                    fill="#FAFAFA"
                  />
                  <path
                    d="M172.784 59.6425C172.288 59.1775 171.826 58.6786 171.4 58.1494C170.911 57.6831 170.453 57.1842 170.031 56.6562C170.629 57.0028 171.157 57.4567 171.589 57.9951C172.082 58.4692 172.486 59.027 172.784 59.6425Z"
                    fill="#FAFAFA"
                  />
                  <path
                    d="M173.62 47.6016C173.193 48.0459 172.705 48.4279 172.172 48.7363C171.683 49.1125 171.146 49.4206 170.574 49.6521C171.003 49.207 171.492 48.825 172.028 48.5173C172.516 48.1431 173.051 47.8352 173.62 47.6016Z"
                    fill="#FAFAFA"
                  />
                  <path
                    d="M168.254 43.25C167.782 43.7095 167.249 44.1029 166.671 44.4196C166.141 44.8119 165.562 45.1332 164.949 45.3752C165.422 44.915 165.954 44.5199 166.532 44.2006C167.064 43.8131 167.643 43.4938 168.254 43.25Z"
                    fill="#FAFAFA"
                  />
                  <path
                    d="M173.094 44.9829C172.768 44.5012 172.513 43.9748 172.338 43.4201C172.093 42.8928 171.925 42.333 171.84 41.7578C172.17 42.2391 172.425 42.7677 172.596 43.3256C172.844 43.85 173.012 44.4087 173.094 44.9829Z"
                    fill="#FAFAFA"
                  />
                  <path
                    d="M179.748 47.1684C178.952 46.6166 178.261 45.9272 177.707 45.1328C178.129 45.3738 178.504 45.6871 178.817 46.0585C179.192 46.369 179.507 46.7451 179.748 47.1684Z"
                    fill="#FAFAFA"
                  />
                  <path
                    d="M177.006 52.0169C176.848 51.5252 176.776 51.01 176.792 50.4939C176.718 49.9842 176.733 49.4654 176.837 48.9609C177.066 49.9627 177.123 50.996 177.006 52.0169Z"
                    fill="#FAFAFA"
                  />
                  <path
                    d="M182.534 51.0148C181.955 51.1071 181.364 51.0868 180.793 50.9551C180.209 50.9074 179.64 50.7503 179.115 50.4922C179.694 50.4983 180.269 50.5684 180.832 50.7012C181.409 50.7448 181.98 50.8499 182.534 51.0148Z"
                    fill="#FAFAFA"
                  />
                  <path
                    d="M160.238 61.0474C159.833 60.4855 159.498 59.8753 159.243 59.2308C158.91 58.6226 158.652 57.9757 158.477 57.3047C158.882 57.8666 159.217 58.4768 159.472 59.1213C159.807 59.729 160.064 60.376 160.238 61.0474Z"
                    fill="#FAFAFA"
                  />
                  <path
                    d="M167.549 68.8947C167.081 68.4697 166.674 67.9823 166.339 67.4464C165.939 66.9575 165.605 66.4188 165.344 65.8438C165.812 66.2691 166.221 66.7564 166.558 67.2921C166.96 67.7786 167.293 68.3178 167.549 68.8947Z"
                    fill="#FAFAFA"
                  />
                  <path
                    d="M173.591 65.6016C173.078 65.9355 172.522 66.1968 171.938 66.378C171.385 66.6392 170.796 66.8186 170.191 66.9105C171.256 66.3137 172.401 65.8729 173.591 65.6016Z"
                    fill="#FAFAFA"
                  />
                  <path
                    d="M158.703 71.9638C158.942 71.0248 159.345 70.1352 159.893 69.3359C159.808 69.8179 159.64 70.2812 159.395 70.7046C159.24 71.1617 159.006 71.588 158.703 71.9638Z"
                    fill="#FAFAFA"
                  />
                  <path
                    d="M154.022 49.4716C153.734 49.1071 153.561 48.6654 153.524 48.2025C153.407 47.7539 153.428 47.2803 153.584 46.8438C153.686 47.2755 153.753 47.715 153.783 48.1577C153.898 48.5885 153.978 49.0279 154.022 49.4716Z"
                    fill="#FAFAFA"
                  />
                  <path
                    d="M162.339 66.9271C161.808 66.7871 161.303 66.5601 160.846 66.2552C160.35 66.0301 159.893 65.7277 159.492 65.3594C160.023 65.5017 160.527 65.7285 160.985 66.0313C161.479 66.26 161.935 66.5621 162.339 66.9271Z"
                    fill="#FAFAFA"
                  />
                  <path
                    d="M167.141 58.6328C166.325 59.6103 165.377 60.4695 164.324 61.186C164.702 60.6709 165.147 60.2088 165.648 59.8124C166.09 59.353 166.592 58.9561 167.141 58.6328Z"
                    fill="#FAFAFA"
                  />
                  <g opacity="0.3">
                    <path
                      d="M164.199 58.4766C164.441 60.2115 165.214 61.8288 166.414 63.1052C167.658 64.3196 169.584 64.9318 171.202 64.2997C171.379 64.2511 171.541 64.1606 171.675 64.0358C171.81 63.911 171.912 63.7557 171.973 63.583C172.001 63.3708 171.954 63.1556 171.84 62.9741C171.727 62.7926 171.554 62.6561 171.351 62.5876C170.948 62.458 170.526 62.3974 170.102 62.4084C168.895 62.3293 167.728 61.9429 166.713 61.2862C165.697 60.6294 164.866 59.7239 164.299 58.6557"
                      fill="black"
                    />
                  </g>
                  <path
                    d="M170.669 62.4886C170.669 62.4886 170.555 62.5284 170.336 62.5483C170.028 62.5794 169.718 62.5794 169.41 62.5483C168.953 62.4946 168.504 62.3877 168.071 62.2298C167.004 61.8461 166.057 61.1888 165.324 60.3236C165.026 59.973 164.771 59.5888 164.562 59.1789C164.416 58.9057 164.301 58.6169 164.219 58.3178C164.179 58.2111 164.157 58.0984 164.154 57.9844C164.204 57.9844 164.338 58.4323 164.722 59.0893C164.946 59.4726 165.208 59.8327 165.503 60.1643C165.869 60.5677 166.278 60.9299 166.722 61.2444C167.172 61.5488 167.652 61.804 168.156 62.0058C168.569 62.1683 168.998 62.2884 169.435 62.3642C170.187 62.4737 170.669 62.4388 170.669 62.4886Z"
                    fill="#263238"
                  />
                  <path
                    d="M143.271 70.5175L150.477 69.6764L155.559 73.0061L174.969 68.3475L175.427 55.0488L184.053 53.9141V70.0149C184.004 71.9695 183.183 73.8253 181.769 75.1753C180.354 76.5253 178.462 77.2594 176.507 77.2167L148.058 76.4253L146.849 74.0065L140.742 73.8223L143.271 70.5175Z"
                    fill="#FFBE9D"
                  />
                  <path
                    d="M174.742 68.3203C174.622 68.3679 174.499 68.4062 174.373 68.4348L173.318 68.7085L169.421 69.6741L156.54 72.7947L155.341 73.0834H155.291H155.251L150.175 69.7438H150.244L143.033 70.5799L143.082 70.55L141.171 72.9739L140.674 73.6109C140.618 73.6872 140.555 73.7573 140.484 73.82C140.531 73.7387 140.582 73.6606 140.639 73.586L141.136 72.9291L142.988 70.4704H143.018L150.22 69.5696H150.259H150.289L155.376 72.8942H155.286L156.486 72.6056L169.381 69.5496L173.298 68.6488L174.363 68.4149C174.487 68.3735 174.613 68.3419 174.742 68.3203Z"
                    fill="#EB996E"
                  />
                  <path
                    d="M147.207 72.582C146.277 72.6908 145.34 72.7274 144.405 72.6915H143.907L143.977 72.6666C143.414 73.1841 142.806 73.6505 142.16 74.0602C142.673 73.4938 143.233 72.971 143.832 72.4974L143.862 72.4675H144.415C145.347 72.4292 146.281 72.4675 147.207 72.582Z"
                    fill="#EB996E"
                  />
                  <path
                    d="M178.32 70.496C177.949 69.9106 177.467 69.4033 176.901 69.0029C176.301 68.6638 175.64 68.4472 174.955 68.3658C175.156 68.296 175.372 68.2789 175.582 68.316C176.09 68.3697 176.579 68.54 177.011 68.8137C177.443 69.0873 177.805 69.457 178.071 69.8938C178.205 70.0692 178.291 70.2769 178.32 70.496Z"
                    fill="#EB996E"
                  />
                  <path
                    d="M53.8479 176.812H21.3477V181.277H53.8479V176.812Z"
                    fill="#263238"
                  />
                  <path
                    d="M53.9007 181.337H21.291V176.758H53.9007V181.337ZM21.4005 181.222H53.7912V176.867H21.4005V181.222Z"
                    fill="#263238"
                  />
                  <path
                    d="M24.3633 179.797L29.0367 202.876H46.347L50.8711 181.285L24.3633 179.797Z"
                    fill="#263238"
                  />
                  <path
                    d="M24.3633 200.688L26.8568 204.122H47.8948L50.8711 200.688H24.3633Z"
                    fill="#455A64"
                  />
                  <path
                    d="M36.3762 180.467C36.3115 180.467 36.2319 169.777 36.192 156.577C36.1522 143.378 36.192 132.688 36.2418 132.688C36.2916 132.688 36.3861 143.378 36.426 156.577C36.4658 169.777 36.4409 180.467 36.3762 180.467Z"
                    fill="#263238"
                  />
                  <path
                    d="M43.6178 153.711C43.5961 153.797 43.5661 153.88 43.5282 153.96C43.4535 154.144 43.354 154.373 43.2395 154.652C43.1748 154.806 43.1051 154.97 43.0255 155.149C42.9458 155.328 42.8861 155.542 42.8115 155.757L42.5576 156.453C42.473 156.702 42.4033 156.951 42.3187 157.25C41.9326 158.557 41.6284 159.886 41.4079 161.231C41.1582 162.881 40.9921 164.542 40.9102 166.208C40.7927 169.24 40.8792 172.276 41.169 175.296C41.2736 176.461 41.3781 177.397 41.4577 178.044C41.4876 178.347 41.5174 178.596 41.5373 178.79C41.544 178.878 41.544 178.966 41.5373 179.054C41.506 178.971 41.4859 178.884 41.4776 178.795C41.4428 178.601 41.403 178.357 41.3532 178.059C41.2487 177.412 41.1143 176.476 40.9899 175.316C40.6514 172.29 40.5432 169.242 40.6664 166.198C40.7402 164.523 40.9063 162.853 41.1641 161.196C41.3942 159.849 41.7168 158.518 42.1296 157.215C42.2192 156.936 42.2939 156.667 42.3834 156.423L42.6522 155.727L42.8911 155.124C42.9707 154.94 43.0504 154.781 43.12 154.627L43.4535 153.95C43.4952 153.862 43.5507 153.781 43.6178 153.711Z"
                    fill="#263238"
                  />
                  <path
                    d="M42.7864 145.062C42.7589 145.182 42.724 145.3 42.6819 145.416C42.5973 145.66 42.4828 145.993 42.3435 146.411L42.0946 147.128C42.015 147.397 41.9254 147.685 41.8308 147.994C41.6417 148.611 41.4227 149.313 41.2286 150.104L40.9001 151.344C40.8006 151.777 40.701 152.229 40.5965 152.692C40.3676 153.623 40.2033 154.633 39.9943 155.679C39.6359 157.799 39.3224 160.158 39.1034 162.622C38.8844 165.085 38.8098 167.469 38.7799 169.624C38.75 171.779 38.7799 173.72 38.8894 175.348C38.9143 176.164 38.969 176.896 39.0088 177.543C39.0487 178.19 39.0885 178.747 39.1283 179.2C39.1681 179.653 39.188 179.987 39.2079 180.25C39.2146 180.371 39.2146 180.493 39.2079 180.614C39.176 180.497 39.1559 180.376 39.1482 180.255C39.1183 179.992 39.0785 179.648 39.0238 179.21C38.969 178.772 38.9143 178.215 38.8645 177.553C38.8147 176.891 38.75 176.174 38.7102 175.358C38.6007 173.725 38.5559 171.784 38.551 169.624C38.546 167.464 38.6505 165.09 38.8595 162.607C39.0686 160.123 39.402 157.769 39.7703 155.639C39.9843 154.579 40.1585 153.568 40.3925 152.653C40.502 152.185 40.6115 151.732 40.711 151.299L41.0544 150.064C41.2585 149.273 41.4924 148.571 41.6965 147.954C41.796 147.646 41.8906 147.362 41.9752 147.093C42.0598 146.824 42.1593 146.595 42.2439 146.381L42.6222 145.386C42.6646 145.272 42.7197 145.164 42.7864 145.062Z"
                    fill="#263238"
                  />
                  <path
                    d="M34.32 182.359C34.3148 182.318 34.3148 182.276 34.32 182.235C34.32 182.14 34.32 182.021 34.2902 181.866C34.2653 181.528 34.2354 181.055 34.1956 180.453C34.116 179.204 34.0065 177.432 33.8671 175.242C33.5884 170.847 33.1803 164.79 32.4387 158.096C32.0604 154.751 31.6225 151.581 31.1646 148.704C30.9257 147.271 30.7067 145.907 30.4529 144.633C30.199 143.359 29.9551 142.179 29.7561 141.099C29.557 140.019 29.3032 139.054 29.109 138.203C28.9149 137.352 28.7407 136.615 28.6113 136.018C28.4819 135.42 28.3575 134.972 28.2729 134.639C28.243 134.495 28.2132 134.375 28.1933 134.281C28.1856 134.24 28.1856 134.197 28.1933 134.156C28.2138 134.194 28.2288 134.234 28.2381 134.276L28.3376 134.629C28.4322 134.958 28.5566 135.415 28.7208 135.998C28.8851 136.58 29.0792 137.317 29.2832 138.173C29.4873 139.029 29.7362 139.989 29.9601 141.069C30.1841 142.149 30.4578 143.324 30.6868 144.598C30.9157 145.872 31.1845 147.236 31.4234 148.674C31.8912 151.551 32.3342 154.726 32.7124 158.066C33.454 164.755 33.8373 170.832 34.0762 175.232C34.1956 177.437 34.2802 179.214 34.33 180.448C34.33 181.05 34.3698 181.523 34.3798 181.866C34.3798 182.016 34.3798 182.14 34.3798 182.235C34.3662 182.279 34.346 182.321 34.32 182.359Z"
                    fill="#263238"
                  />
                  <path
                    d="M36.113 137.852C35.9686 136.359 34.4407 135.195 32.9177 135.18C32.1559 135.213 31.4118 135.42 30.7418 135.784C30.0717 136.148 29.4934 136.659 29.0505 137.28C28.1745 138.529 27.5413 139.932 27.1841 141.416C26.1588 144.985 25.6014 148.732 26.0394 152.42C26.4774 156.108 27.9705 159.737 30.6183 162.34C31.0463 162.768 31.6137 163.191 32.196 163.061C32.5111 162.969 32.7973 162.798 33.0272 162.563C35.6187 160.191 37.6727 157.291 39.0514 154.059C40.43 150.827 41.1013 147.338 41.0203 143.825C40.9805 142.426 40.7964 140.963 40.0249 139.798C39.2535 138.634 37.4369 137.39 36.1179 137.857"
                    fill="#15BA5C"
                  />
                  <path
                    d="M24.7506 125.715L22.6104 129.597C22.5607 129.687 22.496 129.791 22.3915 129.796C22.2869 129.801 22.1924 129.702 22.1326 129.607L16.4688 120.937L17.7727 120.195L24.7506 125.715Z"
                    fill="#15BA5C"
                  />
                  <g opacity="0.2">
                    <path
                      d="M24.7506 125.715L22.6104 129.597C22.5607 129.687 22.496 129.791 22.3915 129.796C22.2869 129.801 22.1924 129.702 22.1326 129.607L16.4688 120.937L17.7727 120.195L24.7506 125.715Z"
                      fill="black"
                    />
                  </g>
                  <path
                    d="M36.2421 132.705L16.9211 121.302C16.8111 121.26 16.7106 121.196 16.6252 121.115C16.5398 121.034 16.4712 120.937 16.4234 120.829C16.3487 120.546 16.5628 120.267 16.7668 120.053C18.0963 118.675 19.7067 117.6 21.4887 116.9C23.2708 116.2 25.1826 115.892 27.0942 115.997C29.0051 116.134 30.8538 116.735 32.4806 117.747C34.1073 118.759 35.4633 120.151 36.4312 121.805C38.2926 125.134 38.3573 129.544 36.2172 132.705"
                    fill="#15BA5C"
                  />
                  <path
                    d="M19.7285 117.668C19.8111 117.645 19.8967 117.635 19.9823 117.638C20.1466 117.638 20.3954 117.598 20.714 117.603C21.611 117.591 22.5073 117.661 23.3916 117.812C24.7091 118.038 25.9932 118.427 27.214 118.972C29.3211 119.92 31.1925 121.322 32.694 123.078C34.1955 124.834 35.2899 126.901 35.899 129.13C36.1483 129.995 36.315 130.881 36.3967 131.778C36.4365 132.091 36.4266 132.34 36.4365 132.509C36.4451 132.594 36.4451 132.679 36.4365 132.763C36.4365 132.763 36.3917 132.415 36.3121 131.768C36.2019 130.883 36.0204 130.01 35.7696 129.155C34.9594 126.318 33.3701 123.765 31.1822 121.785C28.9943 119.806 26.2953 118.479 23.3916 117.956C22.5165 117.79 21.6293 117.695 20.7389 117.673C20.057 117.678 19.7285 117.688 19.7285 117.668Z"
                    fill="#263238"
                  />
                  <path
                    d="M33.6243 124.836C33.3129 125.026 32.9783 125.175 32.6289 125.279C32.0118 125.523 31.1358 125.831 30.1902 126.14C29.2445 126.449 28.3486 126.687 27.7016 126.847C27.3583 126.952 27.0044 127.018 26.6465 127.046C26.9648 126.892 27.2985 126.772 27.6419 126.687L30.1006 125.916L32.5543 125.125C32.9005 124.993 33.259 124.897 33.6243 124.836Z"
                    fill="#263238"
                  />
                  <path
                    d="M30.5837 116.672C30.7566 117.377 30.8336 118.102 30.8126 118.827C30.8694 119.551 30.8293 120.279 30.6932 120.992C30.5999 120.276 30.5633 119.554 30.5837 118.832C30.5268 118.113 30.5268 117.391 30.5837 116.672Z"
                    fill="#263238"
                  />
                  <path
                    d="M16.7422 121.09C17.1942 120.882 17.6639 120.716 18.1457 120.592C19.0217 120.319 20.246 119.975 21.6297 119.647C23.0133 119.318 24.2376 119.069 25.1136 118.91C25.6046 118.8 26.1042 118.734 26.6067 118.711C26.1342 118.863 25.652 118.983 25.1634 119.069C24.2675 119.268 23.0332 119.567 21.6794 119.876C20.3257 120.184 19.0963 120.518 18.1955 120.747C17.7192 120.893 17.2337 121.008 16.7422 121.09Z"
                    fill="#263238"
                  />
                  <path
                    d="M27.3334 134.266C25.6711 133.007 23.9142 132.773 21.8288 132.838C19.7431 132.971 17.7006 133.492 15.8066 134.376C12.5466 135.799 9.4857 137.905 7.53967 140.881C5.59363 143.857 4.91178 147.799 6.37006 151.044C6.4848 151.383 6.72043 151.669 7.032 151.845C7.39397 151.946 7.77991 151.916 8.12198 151.761C11.8299 150.551 15.5577 149.332 18.967 147.441C22.3763 145.549 25.477 142.916 27.3036 139.477C27.7713 138.675 28.0726 137.786 28.1895 136.864C28.2393 136.398 28.1892 135.926 28.0425 135.481C27.8957 135.036 27.6557 134.627 27.3384 134.281"
                    fill="#15BA5C"
                  />
                  <path
                    d="M27.3632 133.875C27.2802 133.922 27.1916 133.959 27.0995 133.984L26.323 134.253L25.7606 134.437C25.5566 134.512 25.3376 134.602 25.1037 134.696C24.6358 134.885 24.1082 135.074 23.516 135.353L22.6101 135.766C22.2916 135.911 21.9781 136.09 21.6446 136.264C20.9727 136.592 20.2958 137.016 19.5692 137.444C16.4655 139.368 13.7037 141.795 11.3968 144.625C10.8991 145.287 10.3765 145.91 9.96342 146.537C9.74941 146.845 9.5354 147.134 9.34627 147.428L8.84856 148.274C8.50017 148.806 8.24136 149.324 7.99251 149.767C7.87306 149.986 7.75361 150.19 7.65407 150.384C7.55453 150.578 7.4749 150.752 7.40024 150.916L7.03194 151.653C6.99725 151.742 6.95034 151.826 6.89258 151.902C6.91682 151.809 6.95017 151.719 6.99212 151.633L7.31563 150.877C7.39028 150.712 7.46992 150.533 7.55453 150.334C7.63914 150.135 7.76357 149.931 7.87804 149.707C8.11694 149.254 8.37574 148.712 8.70423 148.189C8.87345 147.915 9.04267 147.627 9.20193 147.328C9.3612 147.029 9.6001 146.741 9.80914 146.427C10.2173 145.79 10.7199 145.163 11.2326 144.491C12.3925 143.065 13.664 141.734 15.0351 140.509C16.4213 139.305 17.9027 138.215 19.4646 137.249C20.1963 136.821 20.8831 136.403 21.56 136.08C21.8984 135.911 22.217 135.736 22.5554 135.582L23.4762 135.184C24.0585 134.91 24.6059 134.731 25.0837 134.552C25.3226 134.467 25.5416 134.383 25.7507 134.313L26.3181 134.144L27.1094 133.92C27.1928 133.899 27.2776 133.884 27.3632 133.875Z"
                    fill="#263238"
                  />
                  <path
                    d="M14.3829 140.906C13.0597 141.41 11.7106 141.844 10.3415 142.205C8.993 142.644 7.62038 143.004 6.23047 143.285C7.5537 142.781 8.90272 142.348 10.2718 141.986C11.6212 141.551 12.9936 141.19 14.3829 140.906Z"
                    fill="#263238"
                  />
                  <path
                    d="M14.214 149.799C14.1461 149.382 14.1161 148.961 14.1244 148.539C14.1244 147.763 14.1244 146.683 14.1244 145.498C14.1244 144.314 14.2239 143.234 14.2886 142.457C14.2988 142.035 14.3521 141.615 14.4479 141.203C14.4814 141.624 14.4814 142.047 14.4479 142.467C14.418 143.318 14.3882 144.354 14.3533 145.503C14.3185 146.653 14.2986 147.688 14.2737 148.539C14.2923 148.96 14.2723 149.381 14.214 149.799Z"
                    fill="#263238"
                  />
                  <path
                    d="M21.8602 145.926C21.7955 145.926 21.5914 143.741 21.4073 141.038C21.2231 138.336 21.1186 136.141 21.1833 136.141C21.248 136.141 21.4471 138.321 21.6362 141.023C21.8253 143.726 21.9249 145.921 21.8602 145.926Z"
                    fill="#263238"
                  />
                  <path
                    d="M12.3477 135.929C12.7768 135.875 13.2101 135.861 13.6417 135.889C14.438 135.889 15.5429 135.919 16.7623 135.959C17.9817 135.999 19.0816 136.048 19.878 136.093C20.3104 136.099 20.7415 136.14 21.167 136.218C20.7379 136.272 20.3046 136.285 19.873 136.257C19.0766 136.257 17.9717 136.232 16.7524 136.188C15.533 136.143 14.433 136.098 13.6317 136.053C13.201 136.048 12.7714 136.007 12.3477 135.929Z"
                    fill="#263238"
                  />
                  <path
                    d="M31.4484 163.38C31.4262 163.292 31.4162 163.201 31.4185 163.111C31.4185 162.917 31.4185 162.663 31.3837 162.354C31.3538 161.692 31.3488 160.742 31.3837 159.557C31.4185 158.373 31.4832 156.974 31.6226 155.421C31.7619 153.868 31.9909 152.161 32.3044 150.385C32.618 148.608 33.0062 146.94 33.3994 145.407C33.7926 143.875 34.2206 142.556 34.6088 141.426C34.997 140.296 35.3255 139.435 35.6042 138.808C35.7237 138.519 35.8182 138.31 35.8979 138.106C35.9284 138.023 35.9667 137.943 36.0123 137.867C36.0014 137.955 35.9762 138.041 35.9377 138.121L35.654 138.853C35.425 139.47 35.1115 140.346 34.7482 141.49C34.3848 142.635 33.9867 143.979 33.5935 145.472C33.2003 146.965 32.832 148.648 32.5135 150.419C32.1949 152.191 31.9809 153.903 31.8217 155.431C31.6624 156.959 31.5728 158.378 31.533 159.552C31.4932 160.727 31.4683 161.682 31.4683 162.344C31.4683 162.653 31.4683 162.902 31.4683 163.101C31.4682 163.194 31.4615 163.287 31.4484 163.38Z"
                    fill="#263238"
                  />
                  <path
                    d="M32.4663 150.195C32.2404 150.504 31.9817 150.788 31.6949 151.041C31.1972 151.539 30.4854 152.206 29.6791 152.918C28.8729 153.629 28.1114 154.242 27.549 154.675C27.2613 154.925 26.9476 155.143 26.6133 155.327C26.8666 155.04 27.1466 154.779 27.4494 154.545L29.5249 152.744L31.5854 150.922C31.8552 150.652 32.1502 150.409 32.4663 150.195Z"
                    fill="#263238"
                  />
                  <path
                    d="M38.5809 155.117C38.2782 154.761 38.0037 154.381 37.7597 153.983L35.8535 151.195L33.9025 148.438C33.6131 148.07 33.3519 147.681 33.1211 147.273C33.4579 147.599 33.7629 147.955 34.0319 148.339C34.5694 149.02 35.2861 149.976 36.0227 151.066C36.7593 152.156 37.4263 153.156 37.8792 153.893C38.1509 154.278 38.3858 154.688 38.5809 155.117Z"
                    fill="#263238"
                  />
                  <path
                    d="M35.3758 139.626C35.4106 139.681 33.385 141.05 30.8417 142.682C28.2984 144.315 26.213 145.599 26.1782 145.544C26.1433 145.489 28.169 144.121 30.7173 142.488C33.2655 140.856 35.3459 139.577 35.3758 139.626Z"
                    fill="#263238"
                  />
                  <path
                    d="M41.1309 145.82C40.0583 144.927 39.0333 143.979 38.06 142.978C37.0352 142.037 36.0632 141.041 35.1484 139.992C36.2248 140.883 37.2516 141.831 38.2243 142.834C39.2497 143.773 40.2202 144.77 41.1309 145.82Z"
                    fill="#263238"
                  />
                  <path
                    d="M42.5469 145.689L44.2888 145.545C45.5276 145.444 46.7297 145.075 47.8126 144.465C48.3426 144.156 48.8911 143.88 49.455 143.639C51.6101 142.778 54.019 142.932 56.3383 142.813C60.1384 142.621 63.8615 141.67 67.2878 140.016C67.4936 139.925 67.6671 139.774 67.7856 139.583C68.1439 138.931 67.477 138.348 66.9046 137.995C63.9632 136.183 60.972 134.352 57.6423 133.451C54.3126 132.55 50.5251 132.704 47.6882 134.66C44.3535 136.96 43.1342 141.678 42.5718 145.689"
                    fill="#15BA5C"
                  />
                  <path
                    d="M67.8017 139.349C67.7014 139.308 67.6034 139.261 67.508 139.21L66.6819 138.777C65.9652 138.399 64.9349 137.841 63.6259 137.219C62.1099 136.47 60.529 135.86 58.9027 135.397C56.9139 134.826 54.831 134.656 52.7759 134.9C50.718 135.129 48.7744 135.963 47.1917 137.299C45.9555 138.447 44.9664 139.836 44.2851 141.38C43.6729 142.689 43.2897 143.804 43.0209 144.56L42.7073 145.441C42.6765 145.546 42.6365 145.647 42.5879 145.745C42.6022 145.636 42.6272 145.53 42.6626 145.426C42.7322 145.202 42.8218 144.904 42.9313 144.535C43.2634 143.448 43.659 142.381 44.1159 141.34C44.7865 139.76 45.7799 138.338 47.0324 137.164C48.6373 135.782 50.6214 134.915 52.7262 134.676C54.8091 134.424 56.9213 134.593 58.9375 135.173C60.573 135.653 62.1608 136.283 63.6807 137.055C64.9797 137.702 66 138.279 66.7067 138.682L67.513 139.155C67.617 139.207 67.714 139.273 67.8017 139.349Z"
                    fill="#263238"
                  />
                  <path
                    d="M63.6167 141.616C63.5819 141.666 61.2974 140.192 58.5202 138.321C55.743 136.45 53.5183 134.887 53.5432 134.837C53.5681 134.787 55.8575 136.261 58.6347 138.132C61.4119 140.003 63.6516 141.561 63.6167 141.616Z"
                    fill="#263238"
                  />
                  <path
                    d="M61.4265 134.611C60.2643 134.976 59.0377 135.09 57.8281 134.944C58.4196 134.821 59.0209 134.751 59.6248 134.735C60.2207 134.642 60.8235 134.6 61.4265 134.611Z"
                    fill="#263238"
                  />
                  <path
                    d="M51.1972 132.781C50.7619 133.811 50.1912 134.779 49.5 135.658C49.6782 135.128 49.9294 134.625 50.2466 134.165C50.4962 133.661 50.8163 133.195 51.1972 132.781Z"
                    fill="#263238"
                  />
                  <path
                    d="M53.2395 142.962C52.8547 142.802 52.4877 142.602 52.1446 142.365C51.4826 141.967 50.5917 141.369 49.656 140.688C48.7203 140.006 47.8693 139.344 47.2621 138.866C46.9222 138.626 46.6056 138.354 46.3164 138.055C46.6862 138.247 47.0363 138.476 47.3616 138.737L49.7954 140.503C50.741 141.19 51.612 141.792 52.2491 142.23C52.5999 142.445 52.9313 142.69 53.2395 142.962Z"
                    fill="#263238"
                  />
                  <path
                    d="M45.1106 153.094C43.4483 152.651 41.4625 154.268 41.129 155.956C40.7955 157.643 41.4226 159.365 42.1592 160.933C43.7444 164.414 46.0957 167.492 49.0375 169.936C52.0048 172.369 55.7073 173.729 59.5441 173.793C58.8424 170.528 59.7283 167.114 59.3401 163.794C58.9933 160.87 57.6649 158.151 55.572 156.079C53.4791 154.008 50.7456 152.708 47.8182 152.392C46.7581 152.278 45.5287 152.113 45.1057 153.094"
                    fill="#15BA5C"
                  />
                  <path
                    d="M59.5436 173.8C59.4601 173.773 59.38 173.736 59.3047 173.691C59.0867 173.568 58.8787 173.428 58.6825 173.273C57.9855 172.666 57.4256 171.918 57.0401 171.078C56.7763 170.58 56.4777 170.003 56.189 169.381C55.9003 168.759 55.6117 168.102 55.2931 167.39C54.9739 166.661 54.6064 165.955 54.1932 165.275C53.75 164.55 53.2508 163.861 52.7001 163.214C51.5653 161.88 50.341 160.726 49.2809 159.616C48.3224 158.65 47.4498 157.602 46.6729 156.485C46.1524 155.728 45.7247 154.911 45.3987 154.051C45.2942 153.748 45.2146 153.504 45.1748 153.34C45.1472 153.258 45.1305 153.172 45.125 153.086C45.125 153.086 45.2395 153.424 45.4833 154.022C45.8383 154.858 46.2821 155.654 46.8072 156.396C47.599 157.488 48.4778 158.515 49.4351 159.467C50.5002 160.561 51.7296 161.716 52.8793 163.065C53.4427 163.721 53.9536 164.419 54.4072 165.155C54.8187 165.846 55.1861 166.563 55.5072 167.3L56.3831 169.291C56.6618 169.908 56.9505 170.476 57.2093 170.988C57.5726 171.821 58.1008 172.571 58.7621 173.193C59.2399 173.621 59.5684 173.781 59.5436 173.8Z"
                    fill="#263238"
                  />
                  <path
                    d="M50.9492 171.083C50.9592 170.706 51.011 170.33 51.1035 169.964C51.2329 169.277 51.4469 168.336 51.7356 167.311C52.0243 166.286 52.3328 165.375 52.5817 164.723C52.6907 164.361 52.8427 164.013 53.0346 163.688C52.9674 164.057 52.8674 164.42 52.736 164.772C52.527 165.439 52.2383 166.355 51.9596 167.376C51.6808 168.396 51.4619 169.322 51.2628 169.998C51.1942 170.37 51.0892 170.733 50.9492 171.083Z"
                    fill="#263238"
                  />
                  <path
                    d="M59.2421 163.069C58.8436 163.011 58.4508 162.919 58.0675 162.795C57.3508 162.611 56.3604 162.352 55.2604 162.104C54.1605 161.855 53.1551 161.666 52.4285 161.526C52.03 161.475 51.6369 161.389 51.2539 161.267C51.6562 161.257 52.0583 161.291 52.4534 161.367C53.19 161.462 54.2053 161.631 55.3102 161.865C56.4151 162.099 57.4056 162.397 58.1123 162.626C58.5032 162.734 58.8819 162.883 59.2421 163.069Z"
                    fill="#263238"
                  />
                  <path
                    d="M44.7773 165.402C44.7961 164.964 44.8561 164.529 44.9565 164.103C45.1058 163.311 45.3348 162.216 45.6483 161.027C45.9619 159.837 46.2904 158.767 46.5492 158.001C46.6769 157.58 46.8435 157.171 47.0469 156.781C46.9746 157.212 46.8681 157.636 46.7284 158.05C46.5094 158.827 46.2008 159.897 45.8922 161.081C45.5836 162.266 45.3248 163.356 45.1407 164.137C45.0558 164.568 44.9342 164.991 44.7773 165.402Z"
                    fill="#263238"
                  />
                  <path
                    d="M55.4243 156.082C55.4243 156.142 53.3389 155.978 50.7856 155.704C48.2324 155.43 46.162 155.161 46.1719 155.102C47.7235 155.146 49.2718 155.271 50.8105 155.475C52.3578 155.599 53.8977 155.801 55.4243 156.082Z"
                    fill="#263238"
                  />
                  <path
                    d="M53.9007 181.263C53.9007 181.328 46.5994 181.377 37.5959 181.377C28.5924 181.377 21.291 181.328 21.291 181.263C21.291 181.198 28.5924 181.148 37.5959 181.148C46.5994 181.148 53.9007 181.198 53.9007 181.263Z"
                    fill="#455A64"
                  />
                  <path
                    d="M48.8253 190.654C48.8253 190.718 43.903 190.773 37.8359 190.773C31.7689 190.773 26.8516 190.718 26.8516 190.654C26.8516 190.589 31.7689 190.539 37.8359 190.539C43.903 190.539 48.8253 190.614 48.8253 190.654Z"
                    fill="#455A64"
                  />
                  <path
                    d="M49.0137 191.997C49.0137 192.062 44.0963 192.112 38.0293 192.112C31.9623 192.112 27.0449 192.062 27.0449 191.997C27.0449 191.933 31.9623 191.883 38.0293 191.883C44.0963 191.883 49.0137 191.933 49.0137 191.997Z"
                    fill="#455A64"
                  />
                  <path
                    d="M49.0143 189.552C49.0143 189.617 43.9278 189.666 37.6517 189.666C31.3756 189.666 26.2891 189.617 26.2891 189.552C26.2891 189.487 31.3756 189.438 37.6517 189.438C43.9278 189.438 49.0143 189.487 49.0143 189.552Z"
                    fill="#455A64"
                  />
                </svg>
              </div>

              <h3 className="text-[28px] sm:text-[34px] font-bold text-[#111827]">
                Ready to Start Production?
              </h3>

              <p className="mt-4 text-[16px] sm:text-[18px] text-gray-600">
                You are about to start production for Batch{" "}
                <span className="font-semibold text-[#111827]">
                  {startRow.batchId || "-"}
                </span>
                .
              </p>

              <p className="mt-4 text-[16px] sm:text-[18px] text-gray-500">
                Products: {formatProductList(startProductNames)}.
              </p>

              <div className="mt-10 w-full flex flex-col sm:flex-row items-stretch justify-center gap-4 sm:gap-6">
                <button
                  type="button"
                  onClick={startProduction}
                  disabled={isStartingProduction}
                  className={`h-14 sm:h-16 w-full sm:w-[420px] rounded-[12px] text-[18px] font-semibold transition-colors cursor-pointer ${
                    isStartingProduction
                      ? "bg-[#15BA5C]/70 text-white cursor-not-allowed"
                      : "bg-[#15BA5C] text-white hover:bg-[#119E4D]"
                  }`}
                >
                  Confirm
                </button>

                <button
                  type="button"
                  onClick={closeStartModal}
                  disabled={isStartingProduction}
                  className={`h-14 sm:h-16 w-full sm:w-[420px] rounded-[12px] text-[18px] font-semibold transition-colors cursor-pointer ${
                    isStartingProduction
                      ? "bg-gray-200 text-[#111827]/60 cursor-not-allowed"
                      : "bg-gray-200 text-[#111827] hover:bg-gray-300"
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
