"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import OrderCard from "./OrderCard";
import NotFound from "./NotFound";
import { useBusinessStore } from "@/stores/useBusinessStore";
import { Pagination } from "@/shared/Pagination/pagination";

const OnlineOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const { selectedOutletId } = useBusinessStore();

  const fetchOrders = useCallback(async () => {
    if (!selectedOutletId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const api = (window as any).electronAPI;
      if (!api?.dbQuery) {
        console.warn("electronAPI.dbQuery not found");
        return;
      }

      const offset = (currentPage - 1) * itemsPerPage;

      // Base filters for Online orders
      let whereClause = `o.outletId = ? AND (o.orderMode = 'Online' OR o.orderChannel = 'Online')`;
      const params: any[] = [selectedOutletId];

      if (searchTerm) {
        whereClause += ` AND (o.reference LIKE ? OR c.name LIKE ? OR o.recipientName LIKE ? OR o.orderMode LIKE ? OR o.orderChannel LIKE ?)`;
        const searchPattern = `%${searchTerm}%`;
        params.push(
          searchPattern,
          searchPattern,
          searchPattern,
          searchPattern,
          searchPattern,
        );
      }

      // 1. Get Total Count for Pagination
      const countSql = `
        SELECT COUNT(*) as count 
        FROM orders o
        LEFT JOIN customers c ON o.customerId = c.id
        WHERE ${whereClause}
      `;
      const countResult = await api.dbQuery(countSql, params);
      setTotalCount(countResult[0]?.count || 0);

      // 2. Get Paginated Data
      const sql = `
        SELECT 
          o.*, 
          c.name as customerName,
          ct.id as cart_id,
          ct.reference as cart_reference,
          ct.status as cart_status,
          ct.totalAmount as cart_totalAmount,
          ct.totalQuantity as cart_totalQuantity,
          ct.itemCount as cart_itemCount,
          COALESCE(NULLIF(ct.itemCount, 0), (SELECT COUNT(*) FROM cart_item WHERE cartId = o.cartId), 0) as itemCount,
          COALESCE(NULLIF(ct.totalAmount, 0), o.total, 0) as total
        FROM orders o
        LEFT JOIN customers c ON o.customerId = c.id
        LEFT JOIN cart ct ON o.cartId = ct.id
        WHERE ${whereClause}
        ORDER BY o.createdAt DESC
        LIMIT ? OFFSET ?
      `;

      const dataParams = [...params, itemsPerPage, offset];
      const result = await api.dbQuery(sql, dataParams);
      setOrders(result || []);
    } catch (err) {
      console.error("Failed to fetch online orders:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedOutletId, currentPage, itemsPerPage, searchTerm]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const renderSkeletons = () => {
    return Array.from({ length: 3 }).map((_, i) => (
      <div
        key={i}
        className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 mb-4 animate-pulse shadow-sm"
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-100 border border-[#F3F4F6]" />
            <div className="space-y-2">
              <div className="h-6 w-40 bg-gray-100 rounded" />
              <div className="flex items-center gap-2">
                <div className="h-4 w-20 bg-gray-50 rounded" />
                <div className="h-4 w-4 bg-gray-50 rounded-full" />
                <div className="h-4 w-16 bg-gray-50 rounded" />
                <div className="h-4 w-4 bg-gray-50 rounded-full" />
                <div className="h-4 w-24 bg-gray-50 rounded" />
              </div>
            </div>
          </div>
          <div className="h-10 w-32 bg-gray-100 rounded-[12px]" />
        </div>

        {/* Status Stepper Skeleton */}
        <div className="relative flex items-center justify-between w-full px-2 mt-8">
          <div className="absolute top-[14px] left-0 right-0 h-[2px] bg-gray-100 mx-8" />
          {Array.from({ length: 5 }).map((_, j) => (
            <div
              key={j}
              className="relative flex flex-col items-center z-10 min-w-[100px]"
            >
              <div className="w-[28px] h-[28px] rounded-full bg-gray-100 border-2 border-white" />
              <div className="h-3 w-16 bg-gray-50 rounded mt-2" />
            </div>
          ))}
        </div>
      </div>
    ));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[24px] font-bold text-[#1C1B20]">
            Online Orders
          </h1>
          <p className="text-[15px] text-[#6B7280] mt-1">
            Manage all your orders from third party sources
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="flex items-center border border-[#15BA5C] rounded-[12px] overflow-hidden bg-white">
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={handleSearch}
              className="px-4 py-2.5 w-[200px] outline-none text-[15px] text-[#1C1B20] placeholder-[#9CA3AF]"
            />
            <button className="bg-[#15BA5C] p-3 text-white hover:bg-[#13A652] transition-colors">
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Filter by Online Channel */}
          <button className="flex items-center gap-2 px-4 py-2.5 border border-[#E5E7EB] rounded-[12px] bg-white text-[#1C1B20] hover:bg-gray-50 transition-colors">
            <SlidersHorizontal className="w-5 h-5 text-[#6B7280]" />
            <span className="text-[15px] font-medium">
              Filter by Online Channel
            </span>
          </button>

          {/* Filter by Status */}
          <button className="flex items-center gap-2 px-4 py-2.5 border border-[#E5E7EB] rounded-[12px] bg-white text-[#1C1B20] hover:bg-gray-50 transition-colors">
            <SlidersHorizontal className="w-5 h-5 text-[#6B7280]" />
            <span className="text-[15px] font-medium">Filter by Status</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
          {loading ? (
            renderSkeletons()
          ) : orders.length > 0 ? (
            <div className="flex flex-col">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center py-12">
              <NotFound />
            </div>
          )}
        </div>

        {/* Pagination - only show if we have data or are loading first page */}
        {!loading && totalCount > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(items) => {
              setItemsPerPage(items);
              setCurrentPage(1);
            }}
            className="mt-4"
          />
        )}
      </div>
    </div>
  );
};

export default OnlineOrders;
