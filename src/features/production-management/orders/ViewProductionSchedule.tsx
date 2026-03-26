"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle,
  Download,
  MoreVertical,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { Pagination } from "@/shared/Pagination/pagination";
import { useBusinessStore } from "@/stores/useBusinessStore";
import NotFound from "@/features/inventory/NotFound";
import { OrderStatus } from "../../../../electron/types/order.types";

type ProductionScheduleRow = {
  id: string;
  scheduleId: string | null;
  batchId: string | null;
  status: string | null;
  initiator: string | null;
  productionDate: string | null;
  productionDueDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type ViewProductionScheduleProps = {
  isOpen: boolean;
  onClose: () => void;
};

const formatDateLabel = (iso: string | null | undefined) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return format(d, "dd MMM, yyyy");
};

const formatScheduledDate = (iso: string | null | undefined) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return format(d, "eee do MMM, yyyy");
};

const statusPill = (status: string | null | undefined) => {
  const s = String(status || "").toLowerCase();
  if (!s || s === "draft" || s === "ready") {
    return { label: "Ready", cls: "bg-[#E0EAFF] text-[#1D4ED8]" };
  }
  if (s.includes("scheduled")) {
    return {
      label: "Scheduled for Production",
      cls: "bg-[#FEF3C7] text-[#B45309]",
    };
  }
  if (s.includes("cancel")) {
    return { label: "Cancelled", cls: "bg-[#FEE2E2] text-[#EF4444]" };
  }
  return { label: status || "-", cls: "bg-gray-100 text-gray-600" };
};

const ViewProductionSchedule = ({
  isOpen,
  onClose,
}: ViewProductionScheduleProps) => {
  const selectedOutlet = useBusinessStore((s) => s.selectedOutlet);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [rows, setRows] = useState<ProductionScheduleRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [meta, setMeta] = useState<{
    createdAt: string | null;
    updatedAt: string | null;
  }>({
    createdAt: null,
    updatedAt: null,
  });
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [actionMenuPlacement, setActionMenuPlacement] = useState<"up" | "down">(
    "down",
  );
  const [actionMenuRow, setActionMenuRow] =
    useState<ProductionScheduleRow | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<{
    top: number;
    left: number;
    isSimple: boolean;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setCurrentPage(1);
      setItemsPerPage(10);
      setTotalCount(0);
      setRows([]);
      setIsLoading(false);
      setMeta({ createdAt: null, updatedAt: null });
      setOpenActionId(null);
      setActionMenuPlacement("down");
      setActionMenuRow(null);
      setActionMenuPosition(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (!target.closest('[data-production-action-menu="true"]')) {
        setOpenActionId(null);
        setActionMenuPlacement("down");
        setActionMenuRow(null);
        setActionMenuPosition(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchSchedules = useCallback(async () => {
    if (!isOpen) return;
    if (!selectedOutlet?.id) return;
    const api: any = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    setIsLoading(true);
    try {
      const where: string[] = ["outletId = ?"];
      const params: any[] = [selectedOutlet.id];

      const q = searchTerm.trim();
      if (q) {
        where.push(
          "(scheduleId LIKE ? OR batchId LIKE ? OR status LIKE ? OR initiator LIKE ? OR id LIKE ?)",
        );
        const pattern = `%${q}%`;
        params.push(pattern, pattern, pattern, pattern, pattern);
      }

      const whereClause = `WHERE ${where.join(" AND ")}`;

      const metaRows = await api.dbQuery(
        `
          SELECT
            MIN(createdAt) as createdAt,
            MAX(COALESCE(updatedAt, createdAt)) as updatedAt
          FROM productions
          WHERE outletId = ?
        `,
        [selectedOutlet.id],
      );
      setMeta({
        createdAt: metaRows?.[0]?.createdAt || null,
        updatedAt: metaRows?.[0]?.updatedAt || null,
      });

      const countRows = await api.dbQuery(
        `
          SELECT COUNT(*) as count
          FROM productions
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
            id,
            scheduleId,
            batchId,
            status,
            initiator,
            productionDate,
            productionDueDate,
            createdAt,
            updatedAt
          FROM productions
          ${whereClause}
          ORDER BY COALESCE(updatedAt, createdAt) DESC
          LIMIT ? OFFSET ?
        `,
        [...params, itemsPerPage, offset],
      );
      setRows(data || []);
    } catch (e) {
      console.error("Failed to fetch production schedules:", e);
      setRows([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, isOpen, itemsPerPage, searchTerm, selectedOutlet?.id]);

  const updateScheduleStatus = useCallback(
    async (row: ProductionScheduleRow, nextStatus: string) => {
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
            "SELECT * FROM productions WHERE id = ?",
            [row.id],
          );
          if (rec?.[0]) {
            await api.queueAdd({
              table: "productions",
              action: "UPDATE",
              data: rec[0],
              id: row.id,
            });
          }
        }
        await fetchSchedules();
      } catch (e) {
        console.error("Failed to update production status:", e);
      }
    },
    [fetchSchedules, selectedOutlet?.id],
  );

  const downloadScheduleRow = useCallback((row: ProductionScheduleRow) => {
    const csvEscape = (v: any) => {
      const s = String(v ?? "");
      if (s.includes('"') || s.includes(",") || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const schedDate = row.productionDueDate || row.productionDate || "";
    const data = [
      ["Schedule ID", row.scheduleId || row.id || ""],
      ["Batch Number", row.batchId || ""],
      ["Status", row.status || ""],
      ["Initiator", row.initiator || ""],
      ["Scheduled Date", schedDate],
      ["Created At", row.createdAt || ""],
      ["Updated At", row.updatedAt || ""],
    ];

    const csv = data.map((r) => r.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `production_schedule_${row.scheduleId || row.id}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / itemsPerPage)),
    [itemsPerPage, totalCount],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-[1120px] max-h-[90vh] bg-white rounded-[14px]  overflow-hidden flex flex-col">
        <div className="px-8 py-5 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[20px] font-bold text-[#1C1B20]">
                View Production Schedule
              </h2>
              <div className="mt-2 flex items-center gap-6 text-[12px] text-[#6B7280]">
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-[#15BA5C]" />
                  <span>
                    Created on:{" "}
                    <span className="text-[#15BA5C] font-semibold">
                      {formatDateLabel(meta.createdAt)}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-[#15BA5C]" />
                  <span>
                    Last update:{" "}
                    <span className="text-[#15BA5C] font-semibold">
                      {formatDateLabel(meta.updatedAt)}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="size-5 text-[#737373]" />
            </button>
          </div>
        </div>

        <div
          className="px-8 py-6 flex-1 overflow-y-auto custom-scrollbar"
          data-production-schedule-scroll="true"
        >
          <div className="flex items-center gap-0">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full h-11 px-4 bg-white border border-gray-200 rounded-l-[10px] outline-none focus:border-[#15BA5C] transition-all text-sm placeholder:text-gray-400"
            />
            <button
              type="button"
              onClick={() => fetchSchedules()}
              className="h-11 px-4 bg-[#15BA5C] text-white rounded-r-[10px] hover:bg-[#119E4D] transition-colors cursor-pointer flex items-center justify-center"
            >
              <Search className="size-5" />
            </button>
          </div>

          <div className="mt-6 rounded-[12px] overflow-visible border border-gray-100">
            {isLoading || rows.length > 0 ? (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead className="bg-[#F9FAFB]">
                    <tr>
                      <th className="px-4 py-4 text-[13px] font-medium text-gray-500">
                        Schedule ID
                      </th>
                      <th className="px-4 py-4 text-[13px] font-medium text-gray-500">
                        Batch Number
                      </th>
                      <th className="px-4 py-4 text-[13px] font-medium text-gray-500">
                        Status
                      </th>
                      <th className="px-4 py-4 text-[13px] font-medium text-gray-500">
                        Initiator
                      </th>
                      <th className="px-4 py-4 text-[13px] font-medium text-gray-500">
                        Scheduled Date
                      </th>
                      <th className="px-4 py-4 text-[13px] font-medium text-gray-500 text-center">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
                    {isLoading
                      ? [...Array(8)].map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            {Array.from({ length: 6 }).map((__, j) => (
                              <td key={j} className="px-4 py-5">
                                <div className="h-4 bg-gray-100 rounded w-full" />
                              </td>
                            ))}
                          </tr>
                        ))
                      : rows.map((r) => {
                          const displayId = r.scheduleId || r.id || "";
                          const pill = statusPill(r.status);
                          const schedDate =
                            r.productionDueDate || r.productionDate;

                          return (
                            <tr
                              key={r.id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-4 py-5 text-sm font-medium text-[#15BA5C] whitespace-nowrap">
                                {displayId}
                              </td>
                              <td className="px-4 py-5 text-sm text-[#1C1B20] font-medium whitespace-nowrap">
                                {r.batchId || "-"}
                              </td>
                              <td className="px-4 py-5">
                                <span
                                  className={`px-3 py-1 rounded-full text-[12px] font-medium whitespace-nowrap ${pill.cls}`}
                                >
                                  {pill.label}
                                </span>
                              </td>
                              <td className="px-4 py-5 text-sm text-[#1C1B20] font-medium whitespace-nowrap">
                                {r.initiator || "Unknown"}
                              </td>
                              <td className="px-4 py-5 text-sm text-gray-600 whitespace-nowrap">
                                {formatScheduledDate(schedDate)}
                              </td>
                              <td className="px-4 py-5 text-center">
                                <div
                                  className="relative inline-block"
                                  data-production-action-menu="true"
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      const btn =
                                        e.currentTarget as HTMLElement | null;
                                      setOpenActionId((prev) => {
                                        const nextOpen =
                                          prev === r.id ? null : r.id;
                                        if (!nextOpen) {
                                          setActionMenuPlacement("down");
                                          setActionMenuRow(null);
                                          setActionMenuPosition(null);
                                          return null;
                                        }

                                        if (!btn) {
                                          setActionMenuPlacement("down");
                                          setActionMenuRow(r);
                                          setActionMenuPosition(null);
                                          return nextOpen;
                                        }
                                        const container = btn.closest(
                                          '[data-production-schedule-scroll="true"]',
                                        ) as HTMLElement | null;
                                        const containerRect = container
                                          ? container.getBoundingClientRect()
                                          : null;
                                        const btnRect =
                                          btn.getBoundingClientRect();

                                        const isSimple =
                                          r.status === OrderStatus.READY ||
                                          r.status === OrderStatus.CANCELLED;
                                        const estimatedHeight = isSimple
                                          ? 76
                                          : 232;
                                        const padding = 16;
                                        const menuWidth = 240;

                                        const bottomLimit = containerRect
                                          ? containerRect.bottom
                                          : window.innerHeight;
                                        const topLimit = containerRect
                                          ? containerRect.top
                                          : 0;

                                        const fitsDown =
                                          btnRect.bottom +
                                            estimatedHeight +
                                            padding <=
                                          bottomLimit;
                                        const fitsUp =
                                          btnRect.top -
                                            estimatedHeight -
                                            padding >=
                                          topLimit;

                                        setActionMenuPlacement(
                                          fitsDown
                                            ? "down"
                                            : fitsUp
                                              ? "up"
                                              : "up",
                                        );

                                        const placement = fitsDown
                                          ? "down"
                                          : "up";

                                        const top =
                                          placement === "down"
                                            ? btnRect.bottom + 8
                                            : btnRect.top - estimatedHeight - 8;
                                        const left = btnRect.right - menuWidth;

                                        setActionMenuRow(r);
                                        setActionMenuPosition({
                                          top: Math.max(8, top),
                                          left: Math.max(8, left),
                                          isSimple,
                                        });

                                        return nextOpen;
                                      });
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                  >
                                    <MoreVertical className="size-4 text-gray-400" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-4">
                <NotFound
                  title="No Production Schedule"
                  description="You don’t have any Production Schedule yet."
                />
              </div>
            )}
          </div>

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
      </div>

      {openActionId &&
        actionMenuRow &&
        actionMenuPosition &&
        openActionId === actionMenuRow.id && (
          <div
            className="fixed w-[240px] rounded-[16px] bg-[#0B0B0C] shadow-2xl overflow-hidden z-[10044440]"
            style={{
              top: actionMenuPosition.top,
              left: actionMenuPosition.left,
            }}
            data-production-action-menu="true"
          >
            {actionMenuRow.status !== OrderStatus.READY &&
              actionMenuRow.status !== OrderStatus.CANCELLED && (
                <>
                  <button
                    type="button"
                    onClick={async () => {
                      setOpenActionId(null);
                      setActionMenuRow(null);
                      setActionMenuPosition(null);
                      setActionMenuPlacement("down");
                      await updateScheduleStatus(
                        actionMenuRow,
                        OrderStatus.READY,
                      );
                    }}
                    className="w-full px-5 py-4 text-left text-[#15BA5C] font-semibold text-[16px] hover:bg-white/5 transition-colors flex items-center gap-4 cursor-pointer"
                  >
                    <CheckCircle className="size-6 text-[#15BA5C]" />
                    <span>Mark as Ready</span>
                  </button>
                  <div className="h-px bg-white/10" />
                </>
              )}

            <button
              type="button"
              onClick={() => {
                setOpenActionId(null);
                setActionMenuRow(null);
                setActionMenuPosition(null);
                setActionMenuPlacement("down");
                downloadScheduleRow(actionMenuRow);
              }}
              className="w-full px-5 py-4 text-left text-white font-medium text-[16px] hover:bg-white/5 transition-colors flex items-center gap-4 cursor-pointer"
            >
              <Download className="size-6 text-white" />
              <span>Download</span>
            </button>

            {actionMenuRow.status !== OrderStatus.READY &&
              actionMenuRow.status !== OrderStatus.CANCELLED && (
                <>
                  <div className="h-px bg-white/10" />
                  <button
                    type="button"
                    onClick={async () => {
                      setOpenActionId(null);
                      setActionMenuRow(null);
                      setActionMenuPosition(null);
                      setActionMenuPlacement("down");
                      await updateScheduleStatus(
                        actionMenuRow,
                        OrderStatus.CANCELLED,
                      );
                    }}
                    className="w-full px-5 py-4 text-left text-[#EF4444] font-medium text-[16px] hover:bg-white/5 transition-colors flex items-center gap-4 cursor-pointer"
                  >
                    <Trash2 className="size-6 text-[#EF4444]" />
                    <span>Cancel Production</span>
                  </button>
                </>
              )}
          </div>
        )}
    </div>
  );
};

export default ViewProductionSchedule;
