"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { useBusinessStore } from "@/stores/useBusinessStore";
import { Pagination } from "@/shared/Pagination/pagination";
import StatsGrid from "./StatsGrid";
import EmptyStateAssests from "@/assets/images/empty-state";
import { getCurrencySymbol } from "@/utils/getCurrencySymbol";
import AllOrdersFilterModal, {
  type AllOrdersFilterState,
} from "./AllOrdersFilterModal";
import EditPreOrder from "@/features/pos/PreOrder/EditPreOrder";

const ViewAllOrders = () => {
  const { selectedOutletId, selectedOutlet } = useBusinessStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<AllOrdersFilterState>({
    paymentStatus: "All",
    orderStatus: "All",
    channel: "All",
    orderMode: "All",
    createDate: undefined,
    dueDate: undefined,
  });
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    total: number;
    pending: number;
    confirmed: number;
    inProduction: number;
    delivered: number;
  }>({
    total: 0,
    pending: 0,
    confirmed: 0,
    inProduction: 0,
    delivered: 0,
  });

  const formatDate = (value: string | null | undefined) => {
    if (!value) return "-";
    const raw = String(value).trim();
    if (!raw) return "-";
    const iso = new Date(raw);
    if (!Number.isNaN(iso.getTime())) return iso.toLocaleDateString("en-GB");
    return raw;
  };

  const getOrderStatusPillClass = (status: string) => {
    const s = String(status || "").toLowerCase();
    if (s === "pending") return "bg-[#FFF7ED] text-[#F97316]";
    if (s === "confirmed") return "bg-[#E0F2FE] text-[#0284C7]";
    if (s === "in production") return "bg-[#F3F4F6] text-[#374151]";
    if (s === "to be produced") return "bg-[#E9FBF0] text-[#15BA5C]";
    if (s === "scheduled for production") return "bg-[#F3F4F6] text-[#374151]";
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

  const buildWhereForTable = useCallback(() => {
    if (!selectedOutletId) return { whereClause: "1=0", params: [] as any[] };

    let whereClause =
      "o.outletId = ? AND (o.deletedAt IS NULL OR o.deletedAt = '')";
    const params: any[] = [selectedOutletId];

    if (filters.orderStatus !== "All") {
      whereClause += " AND o.status = ?";
      params.push(filters.orderStatus);
    }

    if (filters.orderMode !== "All") {
      whereClause += " AND o.orderMode = ?";
      params.push(filters.orderMode);
    }

    if (filters.channel !== "All") {
      whereClause += " AND o.orderChannel = ?";
      params.push(filters.channel);
    }

    if (filters.paymentStatus === "Paid") {
      whereClause +=
        " AND LOWER(COALESCE(o.paymentStatus, '')) IN ('verified','paid')";
    } else if (filters.paymentStatus === "Unpaid") {
      whereClause +=
        " AND LOWER(COALESCE(o.paymentStatus, '')) NOT IN ('verified','paid')";
    }

    if (filters.createDate) {
      const start = new Date(filters.createDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(filters.createDate);
      end.setHours(24, 0, 0, 0);
      whereClause += " AND o.createdAt >= ? AND o.createdAt < ?";
      params.push(start.toISOString(), end.toISOString());
    }

    if (filters.dueDate) {
      const start = new Date(filters.dueDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(filters.dueDate);
      end.setHours(24, 0, 0, 0);
      whereClause += " AND o.scheduledAt >= ? AND o.scheduledAt < ?";
      params.push(start.toISOString(), end.toISOString());
    }

    if (searchTerm.trim()) {
      whereClause +=
        " AND (o.reference LIKE ? OR c.name LIKE ? OR o.status LIKE ? OR o.orderChannel LIKE ? OR o.orderMode LIKE ?)";
      const pattern = `%${searchTerm.trim()}%`;
      params.push(pattern, pattern, pattern, pattern, pattern);
    }

    return { whereClause, params };
  }, [
    filters.channel,
    filters.createDate,
    filters.dueDate,
    filters.orderMode,
    filters.orderStatus,
    filters.paymentStatus,
    searchTerm,
    selectedOutletId,
  ]);

  const fetchStats = useCallback(async () => {
    if (!selectedOutletId) {
      setStats({
        total: 0,
        pending: 0,
        confirmed: 0,
        inProduction: 0,
        delivered: 0,
      });
      return;
    }

    const api = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    const whereClause =
      "o.outletId = ? AND (o.deletedAt IS NULL OR o.deletedAt = '')";
    const params: any[] = [selectedOutletId];
    const sql = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN LOWER(o.status) = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN LOWER(o.status) = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN LOWER(o.status) = 'in production' THEN 1 ELSE 0 END) as inProduction,
        SUM(CASE WHEN LOWER(o.status) = 'delivered' THEN 1 ELSE 0 END) as delivered
      FROM orders o
      WHERE ${whereClause}
    `;
    const rows = await api.dbQuery(sql, params);
    const r = rows?.[0] || {};
    setStats({
      total: Number(r.total || 0) || 0,
      pending: Number(r.pending || 0) || 0,
      confirmed: Number(r.confirmed || 0) || 0,
      inProduction: Number(r.inProduction || 0) || 0,
      delivered: Number(r.delivered || 0) || 0,
    });
  }, [selectedOutletId]);

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
      const { whereClause, params } = buildWhereForTable();

      const countSql = `
        SELECT COUNT(*) as count
        FROM orders o
        LEFT JOIN customers c ON o.customerId = c.id
        WHERE ${whereClause}
      `;
      const countResult = await api.dbQuery(countSql, params);
      setTotalCount(Number(countResult?.[0]?.count || 0) || 0);

      const sql = `
        SELECT
          o.id as id,
          o.reference as reference,
          o.status as status,
          o.paymentStatus as paymentStatus,
          o.orderChannel as orderChannel,
          o.orderMode as orderMode,
          o.createdAt as createdAt,
          COALESCE(NULLIF(ct.totalAmount, 0), o.total, 0) as total,
          c.name as customerName
        FROM orders o
        LEFT JOIN customers c ON o.customerId = c.id
        LEFT JOIN cart ct ON o.cartId = ct.id
        WHERE ${whereClause}
        ORDER BY COALESCE(o.createdAt, o.updatedAt) DESC
        LIMIT ? OFFSET ?
      `;
      const rows = await api.dbQuery(sql, [...params, itemsPerPage, offset]);
      setOrders(rows || []);
    } catch (e) {
      console.error("Failed to fetch orders:", e);
      setOrders([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [buildWhereForTable, currentPage, itemsPerPage, selectedOutletId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm]);

  const statsData = useMemo(() => {
    return [
      {
        bgColor: "bg-blue-50",
        iconColor: "bg-blue-500",
        borderColor: "border-blue-400",
        gridColor: "rgba(59, 130, 246, 0.4)",
        value: String(stats.total),
        label: "Total Orders",
      },
      {
        bgColor: "bg-yellow-50",
        iconColor: "bg-yellow-500",
        borderColor: "border-yellow-400",
        gridColor: "rgba(234, 179, 8, 0.4)",
        value: String(stats.pending),
        label: "Pending Orders",
      },
      {
        bgColor: "bg-green-50",
        iconColor: "bg-green-500",
        borderColor: "border-green-400",
        gridColor: "rgba(34, 197, 94, 0.4)",
        value: String(stats.confirmed),
        label: "Confirmed Orders",
      },
      {
        bgColor: "bg-purple-50",
        iconColor: "bg-purple-500",
        borderColor: "border-purple-400",
        gridColor: "rgba(168, 85, 247, 0.4)",
        value: String(stats.inProduction),
        label: "In Production",
      },
      {
        bgColor: "bg-emerald-50",
        iconColor: "bg-emerald-500",
        borderColor: "border-emerald-400",
        gridColor: "rgba(16, 185, 129, 0.4)",
        value: String(stats.delivered),
        label: "Delivered Orders",
      },
    ];
  }, [
    stats.confirmed,
    stats.delivered,
    stats.inProduction,
    stats.pending,
    stats.total,
  ]);

  const tableRows = useMemo(() => {
    const currency = selectedOutlet?.currency
      ? getCurrencySymbol(selectedOutlet.currency)
      : "₦";
    return (orders || []).map((o: any) => ({
      orderId: String(o.id || ""),
      id: String(o.reference || "-"),
      customerName: String(o.customerName || "-"),
      status: String(o.status || "Pending"),
      channel: String(o.orderChannel || o.orderMode || "-"),
      createdAt: String(o.createdAt || ""),
      paymentStatusLabel: getPaymentStatusLabel(o.paymentStatus),
      total: Number(o.total || 0) || 0,
      currency,
    }));
  }, [orders, selectedOutlet?.currency]);

  const renderSkeleton = () => {
    return Array.from({ length: 8 }).map((_, i) => (
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
          <div className="h-4 w-20 rounded bg-[#F3F4F6]" />
        </td>
        <td className="px-6 py-5">
          <div className="h-4 w-24 rounded bg-[#F3F4F6]" />
        </td>
        <td className="px-6 py-5">
          <div className="h-7 w-20 rounded-full bg-[#F3F4F6]" />
        </td>
        <td className="px-6 py-5">
          <div className="h-4 w-16 rounded bg-[#F3F4F6] ml-auto" />
        </td>
      </tr>
    ));
  };

  return (
    <div className="flex flex-col h-full">
      <StatsGrid stats={statsData} columns={5} />

      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center border border-[#15BA5C] rounded-[12px] overflow-hidden bg-white">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2.5 w-[220px] outline-none text-[15px] text-[#1C1B20] placeholder-[#9CA3AF]"
          />
          <button className="bg-[#15BA5C] p-3 text-white hover:bg-[#13A652] transition-colors">
            <Search className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-[#E5E7EB] rounded-[12px] bg-white text-[#1C1B20] hover:bg-gray-50 transition-colors"
          >
            <SlidersHorizontal className="w-5 h-5 text-[#6B7280]" />
            <span className="text-[15px] font-medium">Filters</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col bg-white rounded-[14px]  overflow-hidden">
        <div className="flex-1 overflow-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="text-left text-[13px] font-semibold text-[#6B7280] bg-white border-b border-[#E5E7EB]">
                <th className="px-6 py-4">Order Reference</th>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Order Status</th>
                <th className="px-6 py-4">Order Channel</th>
                <th className="px-6 py-4">Order Creation Date</th>
                <th className="px-6 py-4">Payment Status</th>
                <th className="px-6 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                renderSkeleton()
              ) : tableRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-0 py-0">
                    <div className="flex-1 flex flex-col items-center justify-center py-14">
                      <div className="w-[180px] h-[140px] mb-6 flex items-center justify-center">
                        <img
                          src={EmptyStateAssests.OnlineOrdersEmptyState}
                          alt="Orders Empty State"
                        />
                      </div>
                      <h2 className="text-[26px] font-bold text-[#1C1B20] mb-3 text-center">
                        No Orders Found
                      </h2>
                      <p className="text-[16px] text-[#6B7280] text-center max-w-[520px] leading-relaxed">
                        Orders will appear here once you start receiving orders
                        from your channels.
                      </p>
                    </div>
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
                        onClick={() => setEditingOrderId(row.orderId)}
                        className="text-[#15BA5C] font-semibold hover:underline"
                        title="View order"
                      >
                        {row.id}
                      </button>
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
                    <td className="px-6 py-5">{row.channel}</td>
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
                    <td className="px-6 py-5 text-right font-semibold">
                      {row.currency}
                      {row.total.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && totalCount > 0 && (
          <div className="px-4 py-4 ">
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
      </div>

      <AllOrdersFilterModal
        isOpen={isFilterOpen}
        value={filters}
        onClose={() => setIsFilterOpen(false)}
        onApply={(v) => {
          setFilters(v);
          setIsFilterOpen(false);
        }}
      />

      <EditPreOrder
        isOpen={Boolean(editingOrderId)}
        orderId={editingOrderId}
        onClose={() => setEditingOrderId(null)}
        onUpdated={() => {
          fetchOrders();
          fetchStats();
        }}
      />
    </div>
  );
};

export default ViewAllOrders;
