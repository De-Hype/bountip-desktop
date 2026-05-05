"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, MoreVertical, Trash2 } from "lucide-react";
import { Pagination } from "@/shared/Pagination/pagination";
import { useBusinessStore } from "@/stores/useBusinessStore";
import NotFound from "./NotFound";
import { PreOrderTabs } from ".";
import EditPreOrderQuote from "./EditPreOrderQuote";
import useToastStore from "@/stores/toastStore";

type PreOrderQuoteListProps = {
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

const PreOrderQuoteList = ({
  searchTerm = "",
  refreshToken = 0,
}: PreOrderQuoteListProps) => {
  const { selectedOutletId } = useBusinessStore();
  const { showToast } = useToastStore();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const [viewingQuoteId, setViewingQuoteId] = useState<string | null>(null);
  const [openActionsForId, setOpenActionsForId] = useState<string | null>(null);

  const fetchQuotes = useCallback(async () => {
    if (!selectedOutletId) {
      setRows([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    const api = (window as any).electronAPI;
    if (!api?.dbQuery) {
      setRows([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      let whereClause =
        "o.outletId = ? AND o.orderMode = 'Preorder' AND o.orderType = 'Quote' AND (o.deletedAt IS NULL OR o.deletedAt = '')";
      const params: any[] = [selectedOutletId];

      if (searchTerm.trim()) {
        whereClause += " AND (o.reference LIKE ? OR c.name LIKE ?)";
        const pattern = `%${searchTerm.trim()}%`;
        params.push(pattern, pattern);
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
          o.createdAt as createdAt,
          c.name as customerName
        FROM orders o
        LEFT JOIN customers c ON o.customerId = c.id
        WHERE ${whereClause}
        ORDER BY COALESCE(o.createdAt, o.updatedAt) DESC
        LIMIT ? OFFSET ?
      `;
      const result = await api.dbQuery(sql, [...params, itemsPerPage, offset]);
      setRows(result || []);
    } catch (e) {
      console.error("Failed to fetch pre-order quotes:", e);
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, refreshToken, searchTerm, selectedOutletId]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  useEffect(() => {
    const onMouseDown = () => setOpenActionsForId(null);
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const queueQuoteUpdate = useCallback(async (quoteId: string) => {
    const api = (window as any).electronAPI;
    if (!api?.dbQuery || !api?.queueAdd) return;
    const rows = await api.dbQuery(
      "SELECT * FROM orders WHERE id = ? LIMIT 1",
      [quoteId],
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
      id: quoteId,
    });
  }, []);

  const updateQuote = useCallback(
    async (
      quoteId: string,
      patch: {
        orderType?: "Order" | "Quote";
        status?: string;
        deletedAt?: string | null;
        timelineEvent?: { action: string; description: string } | null;
      },
    ) => {
      if (!selectedOutletId) return false;
      const api = (window as any).electronAPI;
      if (!api?.dbQuery) return false;
      const now = new Date().toISOString();
      try {
        const timelineRows = await api.dbQuery(
          "SELECT timeline FROM orders WHERE id = ? LIMIT 1",
          [quoteId],
        );
        const currentTimelineRaw = timelineRows?.[0]?.timeline;
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
        if (patch.timelineEvent) {
          timelineArr.push({
            action: patch.timelineEvent.action,
            timestamp: now,
            description: patch.timelineEvent.description,
          });
        }
        const nextTimeline = JSON.stringify(timelineArr);

        await api.dbQuery(
          `
            UPDATE orders
            SET
              orderType = COALESCE(?, orderType),
              status = COALESCE(?, status),
              deletedAt = COALESCE(?, deletedAt),
              timeline = ?,
              updatedAt = ?
            WHERE id = ? AND outletId = ?
          `,
          [
            patch.orderType ?? null,
            patch.status ?? null,
            patch.deletedAt ?? null,
            nextTimeline,
            now,
            quoteId,
            selectedOutletId,
          ],
        );
        await queueQuoteUpdate(quoteId);
        await fetchQuotes();
        return true;
      } catch (e) {
        console.error("Failed to update quote:", e);
        return false;
      }
    },
    [fetchQuotes, queueQuoteUpdate, selectedOutletId],
  );

  const tableRows = useMemo(() => {
    return (rows || []).map((r: any) => ({
      quoteId: String(r.id || ""),
      id: String(r.reference || "-"),
      customerName: String(r.customerName || "Unknown Customer"),
      createdAt: String(r.createdAt || ""),
    }));
  }, [rows]);

  return (
    <div className="w-full h-full bg-white overflow-hidden flex flex-col">
      <div className="w-full flex-1 overflow-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="text-left text-[13px] font-semibold text-[#6B7280] bg-white border-b border-[#E5E7EB]">
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Customer Name</th>
              <th className="px-6 py-4">Order Create Date</th>
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
                    <div className="h-4 w-24 rounded bg-[#F3F4F6]" />
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="h-7 w-7 rounded bg-[#F3F4F6] ml-auto" />
                  </td>
                </tr>
              ))
            ) : tableRows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-0 py-0">
                  <NotFound tab={PreOrderTabs.QUOTE} />
                </td>
              </tr>
            ) : (
              tableRows.map((row, idx) => (
                <tr
                  key={`${row.id}-${idx}`}
                  className="border-b border-[#F3F4F6] text-[14px] text-[#111827]"
                >
                  <td className="px-6 py-5">
                    <button
                      type="button"
                      onClick={() => setViewingQuoteId(row.quoteId)}
                      className="text-[#15BA5C] font-semibold hover:underline"
                      title="View quote"
                    >
                      {row.id}
                    </button>
                  </td>
                  <td className="px-6 py-5">{row.customerName}</td>
                  <td className="px-6 py-5">{formatDate(row.createdAt)}</td>
                  <td className="px-6 py-5 text-right">
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenActionsForId((prev) =>
                            prev === row.quoteId ? null : row.quoteId,
                          );
                        }}
                        className="inline-flex items-center justify-center h-9 w-9 rounded-[10px] hover:bg-[#F3F4F6] transition-colors"
                        title="Actions"
                      >
                        <MoreVertical className="h-5 w-5 text-[#6B7280]" />
                      </button>

                      {openActionsForId === row.quoteId && (
                        <div
                          onMouseDown={(e) => e.stopPropagation()}
                          className="absolute right-0 mt-2 w-[280px] rounded-[16px] bg-gradient-to-b from-[#111827] to-[#0B1220] shadow-lg overflow-hidden z-[220]"
                        >
                          <button
                            type="button"
                            onClick={async () => {
                              setOpenActionsForId(null);
                              const ok = await updateQuote(row.quoteId, {
                                orderType: "Order",
                                status: "Pending",
                                timelineEvent: {
                                  action: "quote_converted",
                                  description: "Quote converted to order",
                                },
                              });
                              if (ok) {
                                showToast(
                                  "success",
                                  "Moved to Order",
                                  "Quote is now an order",
                                );
                              } else {
                                showToast(
                                  "error",
                                  "Move failed",
                                  "Could not move quote to order",
                                );
                              }
                            }}
                            className="w-full px-6 py-5 text-left text-[15px] font-semibold text-white hover:bg-white/5 transition-colors flex items-center gap-4"
                          >
                            <ArrowLeftRight className="h-4 w-4 text-white" />
                            <span>Move to Order</span>
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              setOpenActionsForId(null);
                              const now = new Date().toISOString();
                              const ok = await updateQuote(row.quoteId, {
                                status: "Cancelled",
                                deletedAt: now,
                                timelineEvent: {
                                  action: "deleted",
                                  description: "Quote deleted",
                                },
                              });
                              if (ok) {
                                showToast(
                                  "success",
                                  "Quote deleted",
                                  "Quote has been deleted",
                                );
                              } else {
                                showToast(
                                  "error",
                                  "Delete failed",
                                  "Could not delete quote",
                                );
                              }
                            }}
                            className="w-full px-6 py-5 text-left text-[15px] font-semibold text-[#F87171] hover:bg-white/5 transition-colors flex items-center gap-4 border-t border-white/10"
                          >
                            <Trash2 className="h-4 w-4 text-[#F87171]" />
                            <span>Delete Quote</span>
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

      <EditPreOrderQuote
        isOpen={Boolean(viewingQuoteId)}
        quoteId={viewingQuoteId}
        onClose={() => setViewingQuoteId(null)}
        onUpdated={() => fetchQuotes()}
      />
    </div>
  );
};

export default PreOrderQuoteList;
