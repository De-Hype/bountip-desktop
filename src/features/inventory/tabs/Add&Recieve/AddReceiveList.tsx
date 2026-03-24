import { useState, useEffect } from "react";
import {
  Search,
  SlidersHorizontal,
  Plus,
  MoreHorizontal,
  ChevronUp,
} from "lucide-react";
import NotFound from "../../NotFound";
import { Pagination } from "@/shared/Pagination/pagination";
import CreateAddReceive from "./CreateAddReceive";

const AddReceiveList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [items] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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
    "INVOICE #",
    "SUPPLIER",
    "TOTAL ITEMS ADDED/RECEIVED",
    "TOTAL COST",
    "STATUS",
    "SUBMITTED BY",
    "DATE",
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
        {/* Search Bar */}
        <div className="flex items-center">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by invoice number, supplier, or..."
            className="w-[380px] h-11 px-4 bg-white border border-gray-200 rounded-l-[10px] outline-none focus:border-[#15BA5C] transition-all text-sm placeholder:text-gray-400"
          />
          <button
            type="button"
            className="h-11 px-4 bg-[#15BA5C] text-white rounded-r-[10px] hover:bg-[#119E4D] transition-colors cursor-pointer flex items-center justify-center"
          >
            <Search className="size-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* More Actions Button */}
          <button
            type="button"
            className="h-11 px-5 bg-white border border-gray-200 rounded-[10px] text-[14px] font-medium text-[#4B5563] hover:bg-gray-50 transition-all flex items-center gap-2 cursor-pointer"
          >
            <MoreHorizontal className="size-4 text-gray-400" />
            More Actions
          </button>

          {/* Filters Button */}
          <button
            type="button"
            className="h-11 px-5 bg-white border border-gray-200 rounded-[10px] text-[14px] font-medium text-[#4B5563] hover:bg-gray-50 transition-all flex items-center gap-2 cursor-pointer"
          >
            <SlidersHorizontal className="size-4 text-gray-400" />
            Filters
          </button>

          {/* Add Button */}
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="h-11 px-5 bg-[#15BA5C] text-white rounded-[10px] text-[14px] font-medium hover:bg-[#119E4D] transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="size-4" />
            Add
          </button>
        </div>
      </div>

      {/* Add & Receive Table */}
      <div className="rounded-[12px]  overflow-hidden">
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
                  items.map((_, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Render rows based on actual data structure later */}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-4">
            <NotFound
              title="No Invoices here"
              description="You don't have any invoices. Click on 'Add' to get started."
              onAddClick={() => setIsCreateOpen(true)}
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

      {isCreateOpen && (
        <div className="fixed inset-0 z-150 bg-black/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-[1100px] h-full bg-white shadow-2xl animate-in slide-in-from-right duration-300">
            <CreateAddReceive onClose={() => setIsCreateOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AddReceiveList;
