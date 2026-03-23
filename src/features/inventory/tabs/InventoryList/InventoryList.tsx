import React, { useState, useEffect } from "react";
import {
  Search,
  SlidersHorizontal,
  ChevronRight,
  ChevronUp,
  X,
} from "lucide-react";
import NotFound from "../../NotFound";
import CreateInventoryItems from "./CreateInventoryItems";
import { Pagination } from "@/shared/Pagination/pagination";

const InventoryList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const headers = [
    "ITEM ID",
    "ITEM NAME",
    "CATEGORY",
    "CURRENT STOCK",
    "LOT QTY",
    "MIN LEVEL",
    "RE-ORDER LEVEL",
    "ITEM TYPE",
    "LAST UPDATE",
  ];

  const TableSkeleton = () => (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="animate-pulse border-b border-gray-50">
          {headers.map((_, j) => (
            <td key={j} className="px-3 py-4">
              <div className="h-4 bg-gray-100 rounded w-full"></div>
            </td>
          ))}
        </tr>
      ))}
    </>
  );

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-bold text-[#1C1B20]">Inventory List</h1>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="flex items-center">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search inventory..."
              className="w-[280px] h-11 px-4 bg-white border border-gray-200 rounded-l-[10px] outline-none focus:border-[#15BA5C] transition-all text-sm placeholder:text-gray-400"
            />
            <button className="h-11 px-4 bg-[#15BA5C] text-white rounded-r-[10px] hover:bg-[#119E4D] transition-colors cursor-pointer flex items-center justify-center">
              <Search className="size-5" />
            </button>
          </div>

          {/* Activity Log Button */}
          <button className="h-11 px-5 bg-white border border-gray-200 rounded-[10px] text-[14px] font-medium text-[#4B5563] hover:bg-gray-50 transition-all flex items-center gap-2 cursor-pointer">
            Activity Log
            <ChevronRight className="size-4 text-gray-400" />
          </button>

          {/* Filters Button */}
          <button className="h-11 px-5 bg-white border border-gray-200 rounded-[10px] text-[14px] font-medium text-[#4B5563] hover:bg-gray-50 transition-all flex items-center gap-2 cursor-pointer">
            <SlidersHorizontal className="size-4 text-gray-400" />
            Filters
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className=" rounded-[12px]  overflow-hidden">
        {isLoading || items.length > 0 ? (
          <div
            className={`custom-scrollbar ${isLoading || items.length > 0 ? "overflow-x-auto" : ""}`}
          >
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#F9FAFB]">
                <tr>
                  {headers.map((header) => (
                    <th
                      key={header}
                      className="px-3 py-4 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1.5 cursor-pointer hover:text-gray-600 transition-colors group">
                        {header}
                        <ChevronUp className="size-3.5 text-gray-300 group-hover:text-gray-400 transition-colors" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <TableSkeleton />
                ) : (
                  items.map((item, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Data rows would go here */}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-4">
            <NotFound
              title="No Inventory Items"
              description="You don't have any inventory items yet. Click on 'Add' to get started."
              onAddClick={() => setIsCreateModalOpen(true)}
            />
          </div>
        )}

        {/* Pagination */}
        {!isLoading && items.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            totalItems={items.length}
          />
        )}
      </div>

      {/* Creation Modal Placeholder */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full relative">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="size-6 text-gray-400" />
            </button>
            <CreateInventoryItems />
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryList;
