import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  SlidersHorizontal,
  Plus,
  ChevronUp,
  LayoutGrid,
  Send,
} from "lucide-react";
import { format } from "date-fns";
import NotFound from "../../NotFound";
import { Pagination } from "@/shared/Pagination/pagination";
import CreateComponent from "./CreateComponent";
import PrepareComponent from "./PrepareComponent";
import useBusinessStore from "@/stores/useBusinessStore";
import { getCurrencySymbol } from "@/utils/getCurrencySymbol";
import ComponentListFilter, {
  ComponentFilterState,
} from "./ComponentListFilter";
import ViewAndEditComponent from "./ViewAndEditComponent";

const ComponentList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [isMoreActionsOpen, setIsMoreActionsOpen] = useState(false);
  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPrepareModalOpen, setIsPrepareModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isViewEditOpen, setIsViewEditOpen] = useState(false);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    null,
  );
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

  const [filters, setFilters] = useState<ComponentFilterState>({
    status: "All",
    size: "All",
    actionBy: "All",
    lastUpdate: undefined,
    componentCode: "",
  });

  const [statuses, setStatuses] = useState<{ value: string; label: string }[]>(
    [],
  );
  const [sizes, setSizes] = useState<{ value: string; label: string }[]>([]);
  const [users, setUsers] = useState<{ value: string; label: string }[]>([]);

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

  const fetchComponents = useCallback(async () => {
    if (!selectedOutlet?.id) return;
    const api = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    setIsLoading(true);
    try {
      let whereClause = "WHERE inv.outletId = ? AND c.deletedAt IS NULL";
      const params: any[] = [selectedOutlet.id];

      if (searchTerm) {
        whereClause += " AND (c.name LIKE ? OR c.reference LIKE ?)";
        const pattern = `%${searchTerm}%`;
        params.push(pattern, pattern);
      }

      if (filters.status !== "All") {
        whereClause += " AND c.status = ?";
        params.push(filters.status);
      }
      if (filters.size !== "All") {
        whereClause += " AND c.componentSize = ?";
        params.push(filters.size);
      }
      if (filters.actionBy !== "All") {
        whereClause +=
          " AND COALESCE(cll.actionTakenBy, c.updatedBy, c.createdBy) = ?";
        params.push(filters.actionBy);
      }
      if (filters.componentCode) {
        whereClause += " AND c.reference LIKE ?";
        params.push(`%${filters.componentCode}%`);
      }
      if (filters.lastUpdate) {
        const startOfDay = new Date(filters.lastUpdate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(filters.lastUpdate);
        endOfDay.setHours(23, 59, 59, 999);
        whereClause += " AND c.updatedAt >= ? AND c.updatedAt <= ?";
        params.push(startOfDay.toISOString(), endOfDay.toISOString());
      }

      const countSql = `
        SELECT COUNT(*) as count
        FROM components c
        JOIN inventory inv ON inv.id = c.inventoryId
        LEFT JOIN component_lots cl ON cl.id = (
          SELECT id FROM component_lots
          WHERE componentId = c.id AND deletedAt IS NULL
          ORDER BY updatedAt DESC
          LIMIT 1
        )
        LEFT JOIN component_lot_logs cll ON cll.id = (
          SELECT id FROM component_lot_logs
          WHERE lotId = cl.id AND deletedAt IS NULL
          ORDER BY createdAt DESC
          LIMIT 1
        )
        ${whereClause}
      `;
      const countRows = await api.dbQuery(countSql, params);
      const count = countRows?.[0]?.count || 0;
      setTotalCount(count);

      const offset = (currentPage - 1) * itemsPerPage;
      const dataSql = `
        SELECT
          c.id,
          c.name,
          c.reference,
          c.componentSize,
          c.minimumStockLevel,
          c.unitOfMeasure,
          c.status,
          c.createdAt,
          c.updatedAt,
          COALESCE(cl.quantity, 0) as qty,
          COALESCE(cl.currentStockLevel, 0) as currentStockLevel,
          COALESCE(cl.unitCost, 0) as unitCost,
          COALESCE(cl.totalCost, 0) as totalCost,
          COALESCE(cll.actionTakenBy, c.updatedBy, c.createdBy) as actionTakenBy,
          COALESCE(cll.createdAt, c.updatedAt, c.createdAt) as timeStamp
        FROM components c
        JOIN inventory inv ON inv.id = c.inventoryId
        LEFT JOIN component_lots cl ON cl.id = (
          SELECT id FROM component_lots
          WHERE componentId = c.id AND deletedAt IS NULL
          ORDER BY updatedAt DESC
          LIMIT 1
        )
        LEFT JOIN component_lot_logs cll ON cll.id = (
          SELECT id FROM component_lot_logs
          WHERE lotId = cl.id AND deletedAt IS NULL
          ORDER BY createdAt DESC
          LIMIT 1
        )
        ${whereClause}
        ORDER BY c.updatedAt DESC
        LIMIT ? OFFSET ?
      `;
      const dataRows = await api.dbQuery(dataSql, [
        ...params,
        itemsPerPage,
        offset,
      ]);
      setItems(dataRows || []);

      const [statusRows, sizeRows, actionRows] = await Promise.all([
        api.dbQuery(
          `
            SELECT DISTINCT c.status as status
            FROM components c
            JOIN inventory inv ON inv.id = c.inventoryId
            WHERE inv.outletId = ? AND c.deletedAt IS NULL AND c.status IS NOT NULL AND c.status != ''
            ORDER BY c.status ASC
          `,
          [selectedOutlet.id],
        ),
        api.dbQuery(
          `
            SELECT DISTINCT c.componentSize as componentSize
            FROM components c
            JOIN inventory inv ON inv.id = c.inventoryId
            WHERE inv.outletId = ? AND c.deletedAt IS NULL AND c.componentSize IS NOT NULL AND c.componentSize != ''
            ORDER BY c.componentSize ASC
          `,
          [selectedOutlet.id],
        ),
        api.dbQuery(
          `
            SELECT DISTINCT COALESCE(cll.actionTakenBy, c.updatedBy, c.createdBy) as actionTakenBy
            FROM components c
            JOIN inventory inv ON inv.id = c.inventoryId
            LEFT JOIN component_lots cl ON cl.id = (
              SELECT id FROM component_lots
              WHERE componentId = c.id AND deletedAt IS NULL
              ORDER BY updatedAt DESC
              LIMIT 1
            )
            LEFT JOIN component_lot_logs cll ON cll.id = (
              SELECT id FROM component_lot_logs
              WHERE lotId = cl.id AND deletedAt IS NULL
              ORDER BY createdAt DESC
              LIMIT 1
            )
            WHERE inv.outletId = ? AND c.deletedAt IS NULL
              AND COALESCE(cll.actionTakenBy, c.updatedBy, c.createdBy) IS NOT NULL
              AND COALESCE(cll.actionTakenBy, c.updatedBy, c.createdBy) != ''
            ORDER BY actionTakenBy ASC
          `,
          [selectedOutlet.id],
        ),
      ]);

      setStatuses(
        (statusRows || []).map((r: any) => ({
          value: r.status,
          label: r.status,
        })),
      );
      setSizes(
        (sizeRows || []).map((r: any) => ({
          value: r.componentSize,
          label: r.componentSize,
        })),
      );
      setUsers(
        (actionRows || []).map((r: any) => ({
          value: r.actionTakenBy,
          label: r.actionTakenBy,
        })),
      );
    } catch (err) {
      console.error("Failed to fetch components:", err);
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedOutlet?.id,
    searchTerm,
    filters,
    currentPage,
    itemsPerPage,
    refreshNonce,
  ]);

  useEffect(() => {
    fetchComponents();
  }, [fetchComponents]);

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

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

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
            <button
              type="button"
              className="h-11 px-4 bg-[#15BA5C] text-white rounded-r-[10px] hover:bg-[#119E4D] transition-colors cursor-pointer flex items-center justify-center"
            >
              <Search className="size-5" />
            </button>
          </div>

          {/* Filters Button */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className="h-11 px-5 bg-white border border-gray-200 rounded-[10px] text-[14px] font-medium text-[#4B5563] hover:bg-gray-50 transition-all flex items-center gap-2 cursor-pointer"
          >
            Filters
            <SlidersHorizontal className="size-4 text-gray-400" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* More Actions Dropdown */}
          <div className="relative" ref={moreActionsRef}>
            <button
              type="button"
              onClick={() => setIsMoreActionsOpen(!isMoreActionsOpen)}
              className="h-11 px-5 bg-white border border-gray-200 rounded-[10px] text-[14px] font-medium text-[#4B5563] hover:bg-gray-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              More Actions
              <LayoutGrid className="size-4 text-gray-400" />
            </button>

            {isMoreActionsOpen && (
              <div className="absolute top-full right-0 mt-2 w-[180px] bg-[#1C1B20] rounded-[10px] shadow-lg z-100 overflow-hidden py-1">
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-left text-[14px] text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Activity Log
                </button>
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-left text-[14px] text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Approval Log
                </button>
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-left text-[14px] text-white hover:bg-white/10 transition-colors flex items-center justify-between cursor-pointer"
                >
                  Export
                  <Send className="size-4 text-white -rotate-45" />
                </button>
              </div>
            )}
          </div>

          {/* Create Component Dropdown */}
          <div className="relative" ref={createDropdownRef}>
            <button
              type="button"
              onClick={() => setIsCreateDropdownOpen(!isCreateDropdownOpen)}
              className="h-11 px-5 bg-[#15BA5C] text-white rounded-[10px] text-[14px] font-medium hover:bg-[#119E4D] transition-all flex items-center gap-2 cursor-pointer"
            >
              Create a Component
              <Plus className="size-4" />
            </button>

            {isCreateDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-[200px] bg-[#1C1B20] rounded-[10px] shadow-lg z-100 overflow-hidden py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(true);
                    setIsCreateDropdownOpen(false);
                  }}
                  className="w-full cursor-pointer px-4 py-2.5 text-left text-[14px] text-white hover:bg-white/10 transition-colors"
                >
                  Create Component
                </button>
                <div className="h-px bg-white/10 mx-1" />
                <button
                  type="button"
                  onClick={() => {
                    setIsPrepareModalOpen(true);
                    setIsCreateDropdownOpen(false);
                  }}
                  className="w-full cursor-pointer px-4 py-2.5 text-left text-[14px] text-white hover:bg-white/10 transition-colors"
                >
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
                      <td className="px-3 py-5 text-sm font-bold text-[#1C1B20]">
                        {item.name || "N/A"}
                      </td>
                      <td className="px-3 py-5 text-sm font-medium text-[#15BA5C]">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedComponentId(item.id);
                            setIsViewEditOpen(true);
                          }}
                          className="hover:underline"
                        >
                          {item.reference || item.id?.slice(0, 8) || "N/A"}
                        </button>
                      </td>
                      <td className="px-3 py-5 text-sm text-gray-600">
                        {item.componentSize || "-"}
                      </td>
                      <td className="px-3 py-5 text-sm text-gray-600 font-medium">
                        {parseFloat(item.qty || 0)}
                      </td>
                      <td className="px-3 py-5 text-sm font-bold text-[#1C1B20]">
                        {parseFloat(item.currentStockLevel || 0)}
                      </td>
                      <td className="px-3 py-5 text-sm text-gray-600 font-medium">
                        {parseFloat(item.minimumStockLevel || 0)}
                      </td>
                      <td className="px-3 py-5 text-sm text-gray-600 font-medium">
                        {formatMoney(parseFloat(item.unitCost || 0))}
                      </td>
                      <td className="px-3 py-5 text-sm font-bold text-[#1C1B20]">
                        {formatMoney(parseFloat(item.totalCost || 0))}
                      </td>
                      <td className="px-3 py-5 text-sm text-gray-600">
                        {item.actionTakenBy || "-"}
                      </td>
                      <td className="px-3 py-5 text-sm text-gray-600">
                        {item.timeStamp
                          ? format(new Date(item.timeStamp), "eee do MMM, yyyy")
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
            totalItems={totalCount}
          />
        )}
      </div>

      {/* Create Component Modal (Right Drawer) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-150 bg-black/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-[840px] h-full bg-white shadow-2xl animate-in slide-in-from-right duration-300">
            <CreateComponent
              onClose={() => setIsCreateModalOpen(false)}
              onSuccess={() => {
                setCurrentPage(1);
                setRefreshNonce((n) => n + 1);
              }}
            />
          </div>
        </div>
      )}

      {isPrepareModalOpen && (
        <div className="fixed inset-0 z-150 bg-black/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-[840px] h-full bg-white shadow-2xl animate-in slide-in-from-right duration-300">
            <PrepareComponent
              onClose={() => setIsPrepareModalOpen(false)}
              onSuccess={() => {
                setCurrentPage(1);
                setRefreshNonce((n) => n + 1);
              }}
            />
          </div>
        </div>
      )}

      <ComponentListFilter
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={(next) => {
          setFilters(next);
          setCurrentPage(1);
        }}
        onReset={() => {
          setFilters({
            status: "All",
            size: "All",
            actionBy: "All",
            lastUpdate: undefined,
            componentCode: "",
          });
          setCurrentPage(1);
        }}
        initialFilters={filters}
        statuses={statuses}
        sizes={sizes}
        users={users}
      />

      <ViewAndEditComponent
        isOpen={isViewEditOpen}
        componentId={selectedComponentId}
        onClose={() => {
          setIsViewEditOpen(false);
          setSelectedComponentId(null);
        }}
        onUpdated={() => {
          setRefreshNonce((n) => n + 1);
        }}
      />
    </div>
  );
};

export default ComponentList;
