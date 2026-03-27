"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { Pagination } from "@/shared/Pagination/pagination";
import { useBusinessStore } from "@/stores/useBusinessStore";
import NotFound from "@/features/inventory/NotFound";
import { OrderStatus } from "../../../../electron/types/order.types";
import ViewDeliveryNote from "@/features/production-management/orders/ViewDeliveryNote";

type ScheduledRow = {
  id: string;
  batchId: string | null;
  status: string | null;
  updatedAt: string | null;
  createdAt: string | null;
  ordersCount: number;
};

const ReadyModal = () => {
  const selectedOutlet = useBusinessStore((s) => s.selectedOutlet);

  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState<ScheduledRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDeliveryNoteOpen, setIsDeliveryNoteOpen] = useState(false);
  const [deliveryProductionId, setDeliveryProductionId] = useState<
    string | null
  >(null);

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

      where.push("p.status = ?");
      params.push(OrderStatus.READY);

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
          FROM productions p
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
              FROM production_items pi
              WHERE pi.productionId = p.id
            ) as ordersCount
          FROM productions p
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
      console.error("Failed to fetch ready productions:", e);
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

  const viewDeliveryNote = useCallback((row: ScheduledRow) => {
    setDeliveryProductionId(row.id);
    setIsDeliveryNoteOpen(true);
  }, []);

  return (
    <div className="px-4 sm:px-6 py-6 bg-white">
      <div className="flex flex-col gap-4 ">
        <h2 className="text-[18px] font-semibold text-[#111827]">Ready</h2>
        <div className="flex justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <div className="relative">
                <select
                  value={"All"}
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
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded border-gray-300" />
                  Batch No
                </div>
              </th>
              <th className="px-4 py-4 text-[13px] font-medium text-gray-500 text-center">
                Amount of Orders
              </th>
              <th className="px-4 py-4 text-[13px] font-medium text-gray-500 text-center">
                Status
              </th>
              <th className="px-4 py-4 text-[13px] font-medium text-gray-500 text-center">
                Quantity Produced
              </th>
              <th className="px-4 py-4 text-[13px] font-medium text-gray-500 text-center">
                Quantity Fulfilled
              </th>
              <th className="px-4 py-4 text-[13px] font-medium text-gray-500 text-center">
                Remaining Quantity
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
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-6">
                        <div className="h-4 bg-gray-100 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-6">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 accent-[#15BA5C]"
                          defaultChecked
                        />
                        <span className="text-[14px] font-medium text-[#15BA5C]">
                          {r.batchId || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-6 text-center">
                      <span className="text-[14px] text-[#111827]">
                        {r.ordersCount}
                      </span>
                    </td>
                    <td className="px-4 py-6 text-center">
                      <span className="px-4 h-9 inline-flex items-center justify-center rounded-[10px] text-[12px] font-medium bg-[#DCFCE7] text-[#16A34A]">
                        Ready
                      </span>
                    </td>
                    <td className="px-4 py-6 text-center">
                      <span className="text-[14px] text-[#111827]">33 Kg</span>
                    </td>
                    <td className="px-4 py-6 text-center">
                      <span className="text-[14px] text-[#111827]">10Kg</span>
                    </td>
                    <td className="px-4 py-6 text-center">
                      <span className="text-[14px] text-[#111827]">10Kg</span>
                    </td>
                    <td className="px-4 py-6">
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => viewDeliveryNote(r)}
                          className="h-10 px-4 rounded-[10px] text-[13px] font-medium transition-colors cursor-pointer bg-[#15BA5C] text-white hover:bg-[#119E4D]"
                        >
                          View Delivery Note
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {!isLoading && rows.length === 0 && (
        <div className="px-6 py-8">
          <NotFound
            title="No Ready Batches"
            description="You don’t have any batches ready yet."
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

      <ViewDeliveryNote
        isOpen={isDeliveryNoteOpen}
        productionId={deliveryProductionId}
        onClose={() => {
          setIsDeliveryNoteOpen(false);
          setDeliveryProductionId(null);
        }}
      />
    </div>
  );
};

export default ReadyModal;
