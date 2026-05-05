"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, MoreVertical, Trash2 } from "lucide-react";
import { useBusinessStore } from "@/stores/useBusinessStore";
import { Pagination } from "@/shared/Pagination/pagination";
import NotFound from "./NotFound";
import { PreOrderTabs } from ".";
import EditPreOrder from "./EditPreOrder";
import useToastStore from "@/stores/toastStore";
import { OrderStatus } from "../../../../electron/types/order.types";

type PreOrderListProps = {
  searchTerm?: string;
  refreshToken?: number;
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return "-";
  const raw = String(value).trim();
  if (!raw) return "-";

  const iso = new Date(raw);
  if (!Number.isNaN(iso.getTime())) return iso.toLocaleDateString("en-GB");

  const dmY = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
  if (dmY) {
    const dd = Number(dmY[1]);
    const mm = Number(dmY[2]);
    const yyyy = Number(dmY[3]);
    const hh = dmY[4] != null ? Number(dmY[4]) : 0;
    const min = dmY[5] != null ? Number(dmY[5]) : 0;
    const d = new Date(yyyy, mm - 1, dd, hh, min);
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString("en-GB");
  }

  const yMd = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (yMd) {
    const yyyy = Number(yMd[1]);
    const mm = Number(yMd[2]);
    const dd = Number(yMd[3]);
    const hh = yMd[4] != null ? Number(yMd[4]) : 0;
    const min = yMd[5] != null ? Number(yMd[5]) : 0;
    const d = new Date(yyyy, mm - 1, dd, hh, min);
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString("en-GB");
  }

  return raw;
};

const getOrderStatusPillClass = (status: string) => {
  const s = status.toLowerCase();
  if (s === "pending") return "bg-[#FFF7ED] text-[#F97316]";
  if (s === "confirmed") return "bg-[#E0F2FE] text-[#0284C7]";
  if (s === "in production") return "bg-[#F3F4F6] text-[#374151]";
  if (s === "to be produced") return "bg-[#E9FBF0] text-[#15BA5C]";
  if (s === "ready") return "bg-[#E0F2FE] text-[#0284C7]";
  if (s === "delivered") return "bg-[#E9FBF0] text-[#15BA5C]";
  if (s === "completed") return "bg-[#E9FBF0] text-[#15BA5C]";
  if (s === "cancelled") return "bg-[#FEE2E2] text-[#EF4444]";
  return "bg-[#F3F4F6] text-[#374151]";
};

const getPaymentStatusLabel = (status: unknown) => {
  const s = String(status ?? "")
    .toLowerCase()
    .trim();
  if (s === "verified" || s === "paid") return "Paid";
  return "Unpaid";
};

const getPaymentStatusPillClass = (label: string) => {
  if (label === "Paid") return "bg-[#E9FBF0] text-[#15BA5C]";
  return "bg-[#FEE2E2] text-[#EF4444]";
};

const PreOrderList = ({
  searchTerm = "",
  refreshToken = 0,
}: PreOrderListProps) => {
  const { selectedOutletId } = useBusinessStore();
  const { showToast } = useToastStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [openActionsForId, setOpenActionsForId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!selectedOutletId) {
      setOrders([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    const api = (window as any).electronAPI;
    if (!api?.dbQuery) {
      setOrders([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      let whereClause =
        "o.outletId = ? AND o.orderMode = 'Preorder' AND o.orderType = 'Order' AND (o.deletedAt IS NULL OR o.deletedAt = '')";
      const params: any[] = [selectedOutletId];

      if (searchTerm.trim()) {
        whereClause +=
          " AND (o.reference LIKE ? OR c.name LIKE ? OR o.status LIKE ? OR o.paymentStatus LIKE ?)";
        const pattern = `%${searchTerm.trim()}%`;
        params.push(pattern, pattern, pattern, pattern);
      }

      const countSql = `
        SELECT COUNT(*) as count
        FROM orders o
        LEFT JOIN customers c ON o.customerId = c.id
        WHERE ${whereClause}
      `;
      const countResult = await api.dbQuery(countSql, params);
      setTotalCount(countResult?.[0]?.count || 0);

      const sql = `
        SELECT
          o.id as id,
          o.reference as reference,
          o.status as status,
          o.paymentStatus as paymentStatus,
          o.createdAt as createdAt,
          o.scheduledAt as dueDate,
          c.name as customerName
        FROM orders o
        LEFT JOIN customers c ON o.customerId = c.id
        WHERE ${whereClause}
        ORDER BY COALESCE(o.createdAt, o.updatedAt) DESC
        LIMIT ? OFFSET ?
      `;
      const rows = await api.dbQuery(sql, [...params, itemsPerPage, offset]);
      setOrders(rows || []);
    } catch (e) {
      console.error("Failed to fetch pre-order orders:", e);
      setOrders([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, refreshToken, searchTerm, selectedOutletId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const onMouseDown = () => setOpenActionsForId(null);
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const queueOrderUpdate = useCallback(async (orderId: string) => {
    const api = (window as any).electronAPI;
    if (!api?.dbQuery || !api?.queueAdd) return;
    const rows = await api.dbQuery(
      "SELECT * FROM orders WHERE id = ? LIMIT 1",
      [orderId],
    );
    const row = rows?.[0] ?? null;
    if (!row) return;
    let timelineValue: any = row?.timeline;
    if (typeof timelineValue === "string" && timelineValue.trim()) {
      try {
        const parsed = JSON.parse(timelineValue);
        if (parsed && typeof parsed === "object") timelineValue = parsed;
      } catch {}
    }
    await api.queueAdd({
      table: "orders",
      action: "UPDATE",
      data: {
        ...row,
        timeline: timelineValue,
        cashCollected: row?.cashCollected ?? 0,
        changeGiven: row?.changeGiven ?? 0,
      },
      id: orderId,
    });
  }, []);

  const updateOrder = useCallback(
    async (
      orderId: string,
      patch: { status?: string; paymentStatus?: any },
      event?: { action: string; description: string },
    ) => {
      if (!selectedOutletId) return false;
      const api = (window as any).electronAPI;
      if (!api?.dbQuery) return false;
      const now = new Date().toISOString();
      try {
        const existingRows = await api.dbQuery(
          "SELECT timeline, status, paymentStatus FROM orders WHERE id = ? LIMIT 1",
          [orderId],
        );
        const existing = existingRows?.[0] ?? {};
        const currentTimelineRaw = existing?.timeline;
        let timelineArr: any[] = [];
        if (Array.isArray(currentTimelineRaw)) {
          timelineArr = currentTimelineRaw;
        } else if (
          typeof currentTimelineRaw === "string" &&
          currentTimelineRaw.trim()
        ) {
          try {
            const parsed = JSON.parse(currentTimelineRaw);
            timelineArr = Array.isArray(parsed) ? parsed : [];
          } catch {
            timelineArr = [];
          }
        }
        const inferredEvent =
          event ??
          (patch.status === OrderStatus.CANCELLED
            ? { action: "cancelled", description: "Order cancelled" }
            : patch.status === "Confirmed"
              ? { action: "confirmed", description: "Order confirmed" }
              : null);
        if (inferredEvent) {
          timelineArr.push({
            action: inferredEvent.action,
            timestamp: now,
            description: inferredEvent.description,
          });
        }
        const nextTimeline = JSON.stringify(timelineArr);

        await api.dbQuery(
          `
            UPDATE orders
            SET
              status = COALESCE(?, status),
              paymentStatus = COALESCE(?, paymentStatus),
              cancelledAt = CASE WHEN ? IS NOT NULL THEN ? ELSE cancelledAt END,
              confirmedAt = CASE WHEN ? IS NOT NULL THEN ? ELSE confirmedAt END,
              timeline = ?,
              updatedAt = ?
            WHERE id = ? AND outletId = ?
          `,
          [
            patch.status ?? null,
            patch.paymentStatus ?? null,
            patch.status === OrderStatus.CANCELLED ? "1" : null,
            patch.status === OrderStatus.CANCELLED ? now : null,
            patch.status === "Confirmed" ? "1" : null,
            patch.status === "Confirmed" ? now : null,
            nextTimeline,
            now,
            orderId,
            selectedOutletId,
          ],
        );
        await queueOrderUpdate(orderId);
        await fetchOrders();
        return true;
      } catch (e) {
        console.error("Failed to update order:", e);
        return false;
      }
    },
    [fetchOrders, queueOrderUpdate, selectedOutletId],
  );

  const tableRows = useMemo(() => {
    return (orders || []).map((o: any) => ({
      orderId: String(o.id || ""),
      id: String(o.reference || "-"),
      customerName: String(o.customerName || "-"),
      status: String(o.status || "Pending"),
      paymentStatusLabel: getPaymentStatusLabel(o.paymentStatus),
      createdAt: String(o.createdAt || ""),
      dueDate: String(o.dueDate || ""),
    }));
  }, [orders]);

  return (
    <div className="w-full h-full bg-white overflow-hidden flex flex-col">
      <div className="w-full flex-1 overflow-auto">
        <table className="w-full min-w-[860px]">
          <thead>
            <tr className="text-left text-[13px] font-semibold text-[#6B7280] bg-white border-b border-[#E5E7EB]">
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Customer Name</th>
              <th className="px-6 py-4">Order Status</th>
              <th className="px-6 py-4">Order Create Date</th>
              <th className="px-6 py-4">Payment Status</th>
              <th className="px-6 py-4">Due Date</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-[#F3F4F6] animate-pulse">
                  <td className="px-6 py-5">
                    <div className="h-4 w-28 rounded bg-[#F3F4F6]" />
                  </td>
                  <td className="px-6 py-5">
                    <div className="h-4 w-40 rounded bg-[#F3F4F6]" />
                  </td>
                  <td className="px-6 py-5">
                    <div className="h-7 w-28 rounded-full bg-[#F3F4F6]" />
                  </td>
                  <td className="px-6 py-5">
                    <div className="h-4 w-24 rounded bg-[#F3F4F6]" />
                  </td>
                  <td className="px-6 py-5">
                    <div className="h-7 w-20 rounded-full bg-[#F3F4F6]" />
                  </td>
                  <td className="px-6 py-5">
                    <div className="h-4 w-24 rounded bg-[#F3F4F6]" />
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="h-7 w-7 rounded bg-[#F3F4F6] ml-auto" />
                  </td>
                </tr>
              ))
            ) : tableRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-0 py-0">
                  <NotFound tab={PreOrderTabs.ORDER} />
                </td>
              </tr>
            ) : (
              tableRows.map((row, idx) => (
                <tr
                  key={`${row.id}-${idx}`}
                  className="border-b border-[#F3F4F6] text-[14px] text-[#111827]"
                >
                  <td className="px-6 py-5">
                    <span
                      onClick={() => setEditingOrderId(row.orderId)}
                      className="text-[#15BA5C] font-semibold cursor-pointer"
                    >
                      {row.id}
                    </span>
                  </td>
                  <td className="px-6 py-5">{row.customerName}</td>
                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold ${getOrderStatusPillClass(
                        row.status,
                      )}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">{formatDate(row.createdAt)}</td>
                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold ${getPaymentStatusPillClass(
                        row.paymentStatusLabel,
                      )}`}
                    >
                      {row.paymentStatusLabel}
                    </span>
                  </td>
                  <td className="px-6 py-5">{formatDate(row.dueDate)}</td>
                  <td className="px-6 py-5 text-right">
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenActionsForId((prev) =>
                            prev === row.orderId ? null : row.orderId,
                          );
                        }}
                        className="inline-flex items-center justify-center h-9 w-9 rounded-[10px] hover:bg-[#F3F4F6] transition-colors"
                        title="Actions"
                      >
                        <MoreVertical className="h-5 w-5 text-[#6B7280]" />
                      </button>

                      {openActionsForId === row.orderId && (
                        <div
                          onMouseDown={(e) => e.stopPropagation()}
                          className="absolute right-0 mt-2 w-[280px] rounded-[16px] bg-gradient-to-b from-[#111827] to-[#0B1220] shadow-lg overflow-hidden z-[220]"
                        >
                          {row.paymentStatusLabel !== "Paid" && (
                            <button
                              type="button"
                              onClick={async () => {
                                setOpenActionsForId(null);
                                const ok = await updateOrder(
                                  row.orderId,
                                  {
                                    status: "Confirmed",
                                    paymentStatus: "Pending",
                                  },
                                  {
                                    action: "invoice_sent",
                                    description: "Invoice sent",
                                  },
                                );
                                if (ok) {
                                  showToast(
                                    "success",
                                    "Invoice sent",
                                    "Invoice has been queued",
                                  );
                                } else {
                                  showToast(
                                    "error",
                                    "Send failed",
                                    "Could not send invoice",
                                  );
                                }
                              }}
                              className="w-full px-6 py-5 text-left text-[15px] font-semibold text-white hover:bg-white/5 transition-colors flex items-center gap-4"
                            >
                              <FileText className="h-4 w-4 text-white" />
                              <span>Send Invoice</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={async () => {
                              setOpenActionsForId(null);
                              const ok = await updateOrder(
                                row.orderId,
                                {
                                  status: OrderStatus.CANCELLED,
                                },
                                {
                                  action: "cancelled",
                                  description: "Order cancelled",
                                },
                              );
                              if (ok) {
                                showToast(
                                  "success",
                                  "Order cancelled",
                                  "Order has been cancelled",
                                );
                              } else {
                                showToast(
                                  "error",
                                  "Cancel failed",
                                  "Could not cancel order",
                                );
                              }
                            }}
                            className={`w-full px-6 py-5 text-left text-[15px] font-semibold text-[#F87171] hover:bg-white/5 transition-colors flex items-center gap-4 ${
                              row.paymentStatusLabel !== "Paid"
                                ? "border-t border-white/10"
                                : ""
                            }`}
                          >
                            <Trash2 className="h-4 w-4 text-[#F87171]" />
                            <span>Cancel Order</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && totalCount > 0 && (
        <div className="px-4 py-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(n) => {
              setItemsPerPage(n);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      <EditPreOrder
        isOpen={Boolean(editingOrderId)}
        orderId={editingOrderId}
        onClose={() => setEditingOrderId(null)}
        onUpdated={() => fetchOrders()}
      />
    </div>
  );
};

export default PreOrderList;
