"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { MoreVertical, Search, SlidersHorizontal } from "lucide-react";
import { useBusinessStore } from "@/stores/useBusinessStore";
import { Pagination } from "@/shared/Pagination/pagination";
import { format } from "date-fns";
import CreateProductionSchedule from "../orders/CreateProductionSchedule";
import ViewProductionSchedule from "../orders/ViewProductionSchedule";
import { getCurrencySymbol } from "@/utils/getCurrencySymbol";
import NotFound from "@/features/inventory/NotFound";
import { OrderStatus } from "../../../../electron/types/order.types";

const ToBeProducedList: React.FC = () => {
  const { selectedOutlet } = useBusinessStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreateScheduleOpen, setIsCreateScheduleOpen] = useState(false);
  const [isViewScheduleOpen, setIsViewScheduleOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const filterRef = useRef<HTMLDivElement>(null);

  const [initiatorFilter, setInitiatorFilter] = useState<string>("All");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [initiators, setInitiators] = useState<string[]>([]);

  useEffect(() => {
    if (!isFilterOpen) return;
    const api: any = (window as any).electronAPI;
    if (!api?.dbQuery || !selectedOutlet?.id) return;
    (async () => {
      try {
        const list = await api.dbQuery(
          `
            SELECT DISTINCT COALESCE(initiator, '') as initiator
            FROM orders
            WHERE outletId = ?
              AND (deletedAt IS NULL OR deletedAt = '')
              AND LOWER(status) = LOWER(?)
            ORDER BY initiator ASC
          `,
          [selectedOutlet.id, OrderStatus.TO_BE_PRODUCED],
        );
        setInitiators(
          (list || [])
            .map((r: any) => String(r.initiator || "").trim())
            .filter(Boolean),
        );
      } catch (e) {
        console.error("Failed to fetch initiators", e);
      }
    })();
  }, [isFilterOpen, selectedOutlet?.id]);

  const currencySymbol = selectedOutlet?.currency
    ? getCurrencySymbol(selectedOutlet.currency)
    : "₦";

  const fetchPage = useMemo(
    () => async () => {
      if (!selectedOutlet?.id) return;
      const api: any = (window as any).electronAPI;
      if (!api?.dbQuery) return;

      setIsLoading(true);
      try {
        const where: string[] = [
          "outletId = ?",
          "(deletedAt IS NULL OR deletedAt = '')",
          "LOWER(status) = LOWER(?)",
        ];
        const params: any[] = [selectedOutlet.id, OrderStatus.TO_BE_PRODUCED];

        if (searchTerm.trim()) {
          const pattern = `%${searchTerm.trim()}%`;
          where.push("(id LIKE ? OR initiator LIKE ?)");
          params.push(pattern, pattern);
        }
        if (initiatorFilter && initiatorFilter !== "All") {
          where.push("initiator = ?");
          params.push(initiatorFilter);
        }
        if (dateFrom) {
          where.push("createdAt >= ?");
          params.push(dateFrom);
        }
        if (dateTo) {
          where.push("createdAt <= ?");
          params.push(dateTo);
        }
        const whereClause = `WHERE ${where.join(" AND ")}`;

        const countRows = await api.dbQuery(
          `
            SELECT COUNT(*) as count
            FROM orders
            ${whereClause}
          `,
          params,
        );
        const count = Number(countRows?.[0]?.count || 0);
        setTotalCount(count);

        const totalPagesLocal = Math.max(
          1,
          Math.ceil(count / Math.max(1, itemsPerPage)),
        );
        const safePage = Math.min(Math.max(1, currentPage), totalPagesLocal);
        const offset = (safePage - 1) * itemsPerPage;

        const rows = await api.dbQuery(
          `
            SELECT id, total, createdAt, initiator
            FROM orders
            ${whereClause}
            ORDER BY createdAt DESC
            LIMIT ? OFFSET ?
          `,
          [...params, itemsPerPage, offset],
        );
        setRows(rows || []);
        if (safePage !== currentPage) setCurrentPage(safePage);
      } catch (e) {
        console.error("Failed to fetch to-be-produced orders:", e);
        setRows([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
      }
    },
    [
      currentPage,
      dateFrom,
      dateTo,
      initiatorFilter,
      itemsPerPage,
      searchTerm,
      selectedOutlet?.id,
    ],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, initiatorFilter, dateFrom, dateTo, itemsPerPage]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (
        isFilterOpen &&
        filterRef.current &&
        !filterRef.current.contains(e.target as Node)
      ) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [isFilterOpen]);

  const statusBadge =
    "px-3 py-1 rounded-full text-[12px] font-medium bg-[#FFEDD5] text-[#F97316]";

  return (
    <div className="p-4 sm:p-6 bg-white rounded-[12px]">
      <div className="flex items-center justify-between mb-6 relative">
        <h2 className="text-xl font-bold text-[#1C1B20]">Confirmed Orders</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search"
              className="w-[280px] h-11 px-4 bg-white border border-gray-200 rounded-l-[10px] outline-none focus:border-[#15BA5C] transition-all text-sm placeholder:text-gray-400"
            />
            <button
              type="button"
              className="h-11 px-4 bg-[#15BA5C] text-white rounded-r-[10px] hover:bg-[#119E4D] transition-colors cursor-pointer flex items-center justify-center"
            >
              <Search className="size-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className="h-11 px-5 bg-white border border-gray-200 rounded-[10px] text-[14px] font-medium text-[#4B5563] hover:bg-gray-50 transition-all flex items-center gap-2 cursor-pointer"
          >
            Filters
            <SlidersHorizontal className="size-4 text-gray-400" />
          </button>
          {isFilterOpen && (
            <div
              ref={filterRef}
              className="absolute right-4 top-full mt-2 w-[360px] bg-white rounded-[12px] border border-gray-200 shadow-xl p-4 z-[1000]"
            >
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1C1B20]">
                    Initiator
                  </label>
                  <select
                    value={initiatorFilter}
                    onChange={(e) => setInitiatorFilter(e.target.value)}
                    className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm outline-none focus:border-[#15BA5C]"
                  >
                    <option value="All">All</option>
                    {initiators.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#1C1B20]">
                      From
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm outline-none focus:border-[#15BA5C]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#1C1B20]">
                      To
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm outline-none focus:border-[#15BA5C]"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setInitiatorFilter("All");
                      setDateFrom("");
                      setDateTo("");
                      setIsFilterOpen(false);
                    }}
                    className="flex-1 h-10 rounded-lg border border-[#15BA5C] text-[#15BA5C] font-semibold hover:bg-green-50 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(false)}
                    className="flex-1 h-10 rounded-lg bg-[#15BA5C] text-white font-semibold hover:bg-[#119E4D] transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsViewScheduleOpen(true)}
            className="h-11 px-5 bg-white border border-[#15BA5C] text-[#15BA5C] rounded-[10px] text-[14px] font-medium hover:bg-green-50 transition-all cursor-pointer"
          >
            View Production Schedule
          </button>

          <button
            type="button"
            onClick={() => setIsCreateScheduleOpen(true)}
            className="h-11 px-5 bg-[#15BA5C] text-white rounded-[10px] text-[14px] font-medium hover:bg-[#119E4D] transition-all cursor-pointer"
          >
            Create Production Schedule
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[12px]">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead className="bg-[#F9FAFB]">
            <tr>
              <th className="px-4 py-4 text-[13px] font-medium text-gray-500">
                <input type="checkbox" className="rounded" />
              </th>
              <th className="px-4 py-4 text-[13px] font-medium text-gray-500">
                Order ID
              </th>
              <th className="px-4 py-4 text-[13px] font-medium text-gray-500">
                Order Value
              </th>
              <th className="px-4 py-4 text-[13px] font-medium text-gray-500">
                Created Date
              </th>
              <th className="px-4 py-4 text-[13px] font-medium text-gray-500">
                Status
              </th>
              <th className="px-4 py-4 text-[13px] font-medium text-gray-500">
                Initiator
              </th>
              <th className="px-4 py-4 text-[13px] font-medium text-gray-500">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading
              ? [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-5">
                        <div className="h-4 bg-gray-100 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.length > 0
                ? rows.map((order: any) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-5">
                        <input type="checkbox" className="rounded" />
                      </td>
                      <td className="px-4 py-5 text-sm font-medium text-[#15BA5C]">
                        {order.id}
                      </td>
                      <td className="px-4 py-5 text-sm text-[#1C1B20] font-bold">
                        {currencySymbol}
                        {new Intl.NumberFormat().format(order.total)}
                      </td>
                      <td className="px-4 py-5 text-sm text-gray-600">
                        {order.createdAt
                          ? format(
                              new Date(order.createdAt),
                              "yyyy-MM-dd | hh:mm a",
                            )
                          : "-"}
                      </td>
                      <td className="px-4 py-5">
                        <span className={statusBadge}>To be Produced</span>
                      </td>
                      <td className="px-4 py-5 text-sm text-[#1C1B20] font-medium">
                        {order.initiator || "—"}
                      </td>
                      <td className="px-4 py-5">
                        <button
                          type="button"
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <MoreVertical className="size-4 text-gray-400" />
                        </button>
                      </td>
                    </tr>
                  ))
                : null}
          </tbody>
        </table>
      </div>

      {!isLoading && rows.length === 0 && (
        <div className="px-6 py-8">
          <NotFound
            title="No Orders"
            description="You don’t have any orders to be produced yet."
          />
        </div>
      )}

      <div className="mt-4">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          totalItems={totalCount}
        />
      </div>

      <CreateProductionSchedule
        isOpen={isCreateScheduleOpen}
        onClose={() => setIsCreateScheduleOpen(false)}
        orders={rows}
        onCreated={() => {
          setIsCreateScheduleOpen(false);
        }}
      />

      <ViewProductionSchedule
        isOpen={isViewScheduleOpen}
        onClose={() => setIsViewScheduleOpen(false)}
      />
    </div>
  );
};

export default ToBeProducedList;
