import { useState, useEffect, useCallback } from "react";
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
import useBusinessStore from "@/stores/useBusinessStore";
import { getCurrencySymbol } from "@/utils/getCurrencySymbol";
import AddReceiveListFilter, {
  AddReceiveFilterState,
} from "./AddReceiveListFilter";
import { format } from "date-fns";
import ViewAndEditAddAndReceive from "./ViewAndEditAddAndReceive";

const AddReceiveList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isViewEditOpen, setIsViewEditOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const { selectedOutlet } = useBusinessStore();

  const currencySymbol = selectedOutlet?.currency
    ? getCurrencySymbol(selectedOutlet.currency)
    : "";
  const formatMoney = (amount: number) => {
    const value = Number.isFinite(amount) ? amount : 0;
    const formatted = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
    return `${currencySymbol}${formatted}`;
  };

  const [filters, setFilters] = useState<AddReceiveFilterState>({
    supplierId: "All",
    status: "All",
    submittedBy: "All",
    date: undefined,
  });

  const [suppliers, setSuppliers] = useState<
    { value: string; label: string }[]
  >([]);
  const [statuses, setStatuses] = useState<{ value: string; label: string }[]>(
    [],
  );
  const [submitters, setSubmitters] = useState<
    { value: string; label: string }[]
  >([]);

  const fetchInvoices = useCallback(async () => {
    if (!selectedOutlet?.id) return;
    const api = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    setIsLoading(true);
    try {
      let whereClause = "WHERE inv.outletId = ? AND inv.deletedAt IS NULL";
      const params: any[] = [selectedOutlet.id];

      if (searchTerm) {
        whereClause +=
          " AND (inv.invoiceNumber LIKE ? OR s.name LIKE ? OR inv.submittedBy LIKE ?)";
        const pattern = `%${searchTerm}%`;
        params.push(pattern, pattern, pattern);
      }

      if (filters.supplierId !== "All") {
        whereClause += " AND inv.supplierId = ?";
        params.push(filters.supplierId);
      }
      if (filters.status !== "All") {
        whereClause += " AND inv.status = ?";
        params.push(filters.status);
      }
      if (filters.submittedBy !== "All") {
        whereClause += " AND inv.submittedBy = ?";
        params.push(filters.submittedBy);
      }
      if (filters.date) {
        const startOfDay = new Date(filters.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(filters.date);
        endOfDay.setHours(23, 59, 59, 999);
        whereClause += " AND inv.createdAt >= ? AND inv.createdAt <= ?";
        params.push(startOfDay.toISOString(), endOfDay.toISOString());
      }

      const countSql = `
        SELECT COUNT(*) as count
        FROM invoices inv
        LEFT JOIN suppliers s ON s.id = inv.supplierId
        ${whereClause}
      `;
      const countRows = await api.dbQuery(countSql, params);
      const count = countRows?.[0]?.count || 0;
      setTotalCount(count);

      const offset = (currentPage - 1) * itemsPerPage;
      const dataSql = `
        SELECT
          inv.*,
          s.name as supplierName,
          COALESCE(
            NULLIF(inv.totalItemCount, 0),
            (SELECT COUNT(*) FROM invoice_items ii WHERE ii.invoiceId = inv.id AND ii.deletedAt IS NULL),
            0
          ) as totalItemCount
        FROM invoices inv
        LEFT JOIN suppliers s ON s.id = inv.supplierId
        ${whereClause}
        ORDER BY inv.createdAt DESC
        LIMIT ? OFFSET ?
      `;
      const dataRows = await api.dbQuery(dataSql, [
        ...params,
        itemsPerPage,
        offset,
      ]);
      setItems(dataRows || []);

      const [supplierRows, statusRows, submitterRows] = await Promise.all([
        api.dbQuery(
          "SELECT id, name FROM suppliers WHERE outletId = ? AND deletedAt IS NULL ORDER BY name ASC",
          [selectedOutlet.id],
        ),
        api.dbQuery(
          "SELECT DISTINCT status FROM invoices WHERE outletId = ? AND deletedAt IS NULL AND status IS NOT NULL AND status != '' ORDER BY status ASC",
          [selectedOutlet.id],
        ),
        api.dbQuery(
          "SELECT DISTINCT submittedBy FROM invoices WHERE outletId = ? AND deletedAt IS NULL AND submittedBy IS NOT NULL AND submittedBy != '' ORDER BY submittedBy ASC",
          [selectedOutlet.id],
        ),
      ]);

      setSuppliers(
        (supplierRows || []).map((s: any) => ({ value: s.id, label: s.name })),
      );
      setStatuses(
        (statusRows || []).map((r: any) => ({
          value: r.status,
          label: r.status,
        })),
      );
      setSubmitters(
        (submitterRows || []).map((r: any) => ({
          value: r.submittedBy,
          label: r.submittedBy,
        })),
      );
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedOutlet?.id, searchTerm, filters, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

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

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

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
            onClick={() => setIsFilterOpen(true)}
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
                  items.map((item, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-3 py-5 text-sm font-medium text-[#15BA5C]">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInvoiceId(item.id);
                            setIsViewEditOpen(true);
                          }}
                          className="hover:underline"
                        >
                          {item.invoiceNumber || item.id?.slice(0, 8) || "N/A"}
                        </button>
                      </td>
                      <td className="px-3 py-5 text-sm font-bold text-[#1C1B20]">
                        {item.supplierName || "N/A"}
                      </td>
                      <td className="px-3 py-5 text-sm text-gray-600 font-medium">
                        {item.totalItemCount || 0}
                      </td>
                      <td className="px-3 py-5 text-sm font-bold text-[#1C1B20]">
                        {formatMoney(parseFloat(item.totalAmount || 0))}
                      </td>
                      <td className="px-3 py-5 text-sm text-gray-600">
                        {item.status || "-"}
                      </td>
                      <td className="px-3 py-5 text-sm text-gray-600">
                        {item.submittedBy || "-"}
                      </td>
                      <td className="px-3 py-5 text-sm text-gray-600">
                        {item.createdAt
                          ? format(new Date(item.createdAt), "eee do MMM, yyyy")
                          : "-"}
                      </td>
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
            totalItems={totalCount}
          />
        )}
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-150 bg-black/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-[1100px] h-full bg-white shadow-2xl animate-in slide-in-from-right duration-300">
            <CreateAddReceive
              onClose={() => setIsCreateOpen(false)}
              onSuccess={() => {
                setIsCreateOpen(false);
                fetchInvoices();
              }}
            />
          </div>
        </div>
      )}

      <AddReceiveListFilter
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={(next) => {
          setFilters(next);
          setCurrentPage(1);
        }}
        onReset={() => {
          setFilters({
            supplierId: "All",
            status: "All",
            submittedBy: "All",
            date: undefined,
          });
          setCurrentPage(1);
        }}
        initialFilters={filters}
        suppliers={suppliers}
        statuses={statuses}
        submitters={submitters}
      />

      <ViewAndEditAddAndReceive
        isOpen={isViewEditOpen}
        invoiceId={selectedInvoiceId}
        onClose={() => {
          setIsViewEditOpen(false);
          setSelectedInvoiceId(null);
        }}
        onUpdated={() => {
          fetchInvoices();
        }}
      />
    </div>
  );
};

export default AddReceiveList;
