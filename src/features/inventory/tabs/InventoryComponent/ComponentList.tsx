import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  SlidersHorizontal,
  Plus,
  MoreHorizontal,
  ChevronUp,
  LayoutGrid,
  Send,
  X,
} from "lucide-react";
import NotFound from "../../NotFound";
import { Pagination } from "@/shared/Pagination/pagination";
import CreateComponent from "./CreateComponent";

const ComponentList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isMoreActionsOpen, setIsMoreActionsOpen] = useState(false);
  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const moreActionsRef = useRef<HTMLDivElement>(null);
  const createDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        moreActionsRef.current &&
        !moreActionsRef.current.contains(event.target as Node)
      ) {
        setIsMoreActionsOpen(false);
      }
      if (
        createDropdownRef.current &&
        !createDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCreateDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const headers = [
    "COMPONENT NAME",
    "COMPONENT CODE",
    "SIZE",
    "QTY",
    "CURRENT STOCK LEVEL",
    "REORDER LEVEL",
    "UNIT COST OF PURCHASE",
    "TOTAL COST",
    "ACTION TAKEN BY",
    "TIME STAMP",
  ];

  const TableSkeleton = () => (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="animate-pulse border-b border-gray-50">
          {headers.map((_, j) => (
            <td key={j} className="px-3 py-3">
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
        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="flex items-center">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search"
              className="w-[240px] h-11 px-4 bg-white border border-gray-200 rounded-l-[10px] outline-none focus:border-[#15BA5C] transition-all text-sm placeholder:text-gray-400"
            />
            <button className="h-11 px-4 bg-[#15BA5C] text-white rounded-r-[10px] hover:bg-[#119E4D] transition-colors cursor-pointer flex items-center justify-center">
              <Search className="size-5" />
            </button>
          </div>

          {/* Filters Button */}
          <button className="h-11 px-5 bg-white border border-gray-200 rounded-[10px] text-[14px] font-medium text-[#4B5563] hover:bg-gray-50 transition-all flex items-center gap-2 cursor-pointer">
            Filters
            <SlidersHorizontal className="size-4 text-gray-400" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* More Actions Dropdown */}
          <div className="relative" ref={moreActionsRef}>
            <button
              onClick={() => setIsMoreActionsOpen(!isMoreActionsOpen)}
              className="h-11 px-5 bg-white border border-gray-200 rounded-[10px] text-[14px] font-medium text-[#4B5563] hover:bg-gray-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              More Actions
              <LayoutGrid className="size-4 text-gray-400" />
            </button>

            {isMoreActionsOpen && (
              <div className="absolute top-full right-0 mt-2 w-[180px] bg-[#1C1B20] rounded-[10px] shadow-lg z-[100] overflow-hidden py-1">
                <button className="w-full px-4 py-2.5 text-left text-[14px] text-white hover:bg-white/10 transition-colors cursor-pointer">
                  Activity Log
                </button>
                <button className="w-full px-4 py-2.5 text-left text-[14px] text-white hover:bg-white/10 transition-colors cursor-pointer">
                  Approval Log
                </button>
                <button className="w-full px-4 py-2.5 text-left text-[14px] text-white hover:bg-white/10 transition-colors flex items-center justify-between cursor-pointer">
                  Export
                  <Send className="size-4 text-white rotate-[-45deg]" />
                </button>
              </div>
            )}
          </div>

          {/* Create Component Dropdown */}
          <div className="relative" ref={createDropdownRef}>
            <button
              onClick={() => setIsCreateDropdownOpen(!isCreateDropdownOpen)}
              className="h-11 px-5 bg-[#15BA5C] text-white rounded-[10px] text-[14px] font-medium hover:bg-[#119E4D] transition-all flex items-center gap-2 cursor-pointer"
            >
              Create a Component
              <Plus className="size-4" />
            </button>

            {isCreateDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-[200px] bg-[#1C1B20] rounded-[10px] shadow-lg z-[100] overflow-hidden py-1">
                <button
                  onClick={() => {
                    setIsCreateModalOpen(true);
                    setIsCreateDropdownOpen(false);
                  }}
                  className="w-full cursor-pointer px-4 py-2.5 text-left text-[14px] text-white hover:bg-white/10 transition-colors"
                >
                  Create Component
                </button>
                <div className="h-[1px] bg-white/10 mx-1" />
                <button className="w-full cursor-pointer px-4 py-2.5 text-left text-[14px] text-white hover:bg-white/10 transition-colors">
                  Prepare Component
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Component Table */}
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
                      {/* Render rows based on actual data structure later */}
                      {/* Example of green green ID/Name: 
                          <td className="px-3 py-4 text-[#15BA5C] font-medium underline cursor-pointer hover:text-[#119E4D]">
                            {item.name}
                          </td>
                      */}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-4">
            <NotFound
              title="No Components found"
              description="You don't have any components yet. Click on 'Create a Component' to get started."
              onAddClick={() => setIsCreateModalOpen(true)}
              actionText="Create a Component"
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

      {/* Create Component Modal (Right Drawer) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-[840px] h-full bg-white shadow-2xl animate-in slide-in-from-right duration-300">
            <CreateComponent onClose={() => setIsCreateModalOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ComponentList;
