import { useState, useEffect, useCallback } from "react";
import {
  Search,
  SlidersHorizontal,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import NotFound from "../../NotFound";
import CreateInventoryItems from "./CreateInventoryItems";
import ViewAndEditInventoryList from "./ViewAndEditInventoryList";
import { Pagination } from "@/shared/Pagination/pagination";
import { useBusinessStore } from "@/stores/useBusinessStore";
import { useAuthStore } from "@/stores/authStore";
import useInventoryStore from "@/stores/useInventoryStore";
import { format } from "date-fns";
import InventoryListFilter, {
  InventoryFilterState,
} from "./InventoryListFilter";

const InventoryList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewEditOpen, setIsViewEditOpen] = useState(false);
  const [selectedInventoryItemId, setSelectedInventoryItemId] = useState<
    string | null
  >(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ASC" | "DESC";
  }>({
    key: "name",
    direction: "ASC",
  });

  const { selectedOutlet } = useBusinessStore();
  const authUser = useAuthStore((s) => s.user);
  const lastUpdated = useInventoryStore((s) => s.lastUpdated);
  const refreshInventory = useInventoryStore((s) => s.refreshInventory);

  const [filters, setFilters] = useState<InventoryFilterState>({
    category: "All",
    minStockLevel: "",
    maxStockLevel: "",
    reOrderLevel: "",
    actionBy: "All",
    lastUpdate: undefined,
    itemCode: "",
  });

  const [categories, setCategories] = useState<
    { value: string; label: string }[]
  >([]);
  const [users, setUsers] = useState<{ value: string; label: string }[]>([]);

  const fetchInventory = useCallback(async () => {
    if (!selectedOutlet?.id) return;

    try {
      setIsLoading(true);
      const api = (window as any).electronAPI;
      if (!api?.dbQuery) return;

      let whereClause = "WHERE i.outletId = ? AND ii.isDeleted = 0";
      const params: any[] = [selectedOutlet.id];

      // Search logic
      if (searchTerm) {
        whereClause +=
          " AND (im.name LIKE ? OR im.itemCode LIKE ? OR im.id LIKE ?)";
        const searchPattern = `%${searchTerm}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      // Filter logic
      if (filters.category !== "All") {
        whereClause += " AND im.category = ?";
        params.push(filters.category);
      }
      if (filters.minStockLevel) {
        whereClause += " AND ii.currentStockLevel >= ?";
        params.push(parseFloat(filters.minStockLevel));
      }
      if (filters.maxStockLevel) {
        whereClause += " AND ii.currentStockLevel <= ?";
        params.push(parseFloat(filters.maxStockLevel));
      }
      if (filters.reOrderLevel) {
        whereClause += " AND ii.reOrderLevel = ?";
        params.push(parseFloat(filters.reOrderLevel));
      }
      if (filters.actionBy !== "All") {
        whereClause += " AND ii.addedBy = ?";
        params.push(filters.actionBy);
      }
      if (filters.itemCode) {
        whereClause += " AND im.itemCode LIKE ?";
        params.push(`%${filters.itemCode}%`);
      }
      if (filters.lastUpdate) {
        const startOfDay = new Date(filters.lastUpdate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(filters.lastUpdate);
        endOfDay.setHours(23, 59, 59, 999);
        whereClause += " AND ii.updatedAt >= ? AND ii.updatedAt <= ?";
        params.push(startOfDay.toISOString(), endOfDay.toISOString());
      }

      // 1. Get total count for pagination
      const countSql = `
        SELECT COUNT(*) as count
        FROM inventory_item ii
        JOIN inventory i ON ii.inventoryId = i.id
        JOIN item_master im ON ii.itemMasterId = im.id
        ${whereClause}
      `;
      const countResult = await api.dbQuery(countSql, params);
      setTotalCount(countResult[0]?.count || 0);

      // 2. Get paginated items
      const offset = (currentPage - 1) * itemsPerPage;

      let orderBy = "";
      const dir = sortConfig.direction;

      switch (sortConfig.key) {
        case "name":
          orderBy = `im.name ${dir}, im.itemCode ${dir}, im.category ${dir}`;
          break;
        case "itemCode":
          orderBy = `im.itemCode ${dir}, im.name ${dir}, im.category ${dir}`;
          break;
        case "category":
          orderBy = `im.category ${dir}, im.name ${dir}, im.itemCode ${dir}`;
          break;
        case "currentStockLevel":
          orderBy = `ii.currentStockLevel ${dir}, im.name ${dir}, im.itemCode ${dir}, im.category ${dir}`;
          break;
        case "minimumStockLevel":
          orderBy = `ii.minimumStockLevel ${dir}, im.name ${dir}, im.itemCode ${dir}, im.category ${dir}`;
          break;
        case "reOrderLevel":
          orderBy = `ii.reOrderLevel ${dir}, im.name ${dir}, im.itemCode ${dir}, im.category ${dir}`;
          break;
        case "updatedAt":
          orderBy = `ii.updatedAt ${dir}, im.name ${dir}, im.itemCode ${dir}, im.category ${dir}`;
          break;
        default:
          orderBy = `im.name ASC, im.itemCode ASC, im.category ASC`;
      }

      const sql = `
        SELECT 
          ii.*, 
          im.name as itemName, 
          im.category, 
          im.itemType, 
          im.itemCode,
          (SELECT SUM(quantityPurchased) FROM item_lot WHERE itemId = ii.id) as lotQty
        FROM inventory_item ii
        JOIN inventory i ON ii.inventoryId = i.id
        JOIN item_master im ON ii.itemMasterId = im.id
        ${whereClause}
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
      `;
      const dataParams = [...params, itemsPerPage, offset];
      const result = await api.dbQuery(sql, dataParams);
      setItems(result || []);

      // 3. Fetch unique categories and users for filter dropdowns
      const catSql = `
        SELECT DISTINCT im.category as category
        FROM inventory_item ii
        JOIN inventory i ON ii.inventoryId = i.id
        JOIN item_master im ON ii.itemMasterId = im.id
        WHERE i.outletId = ? AND ii.isDeleted = 0 AND im.category IS NOT NULL AND im.category != ''
        ORDER BY im.category ASC
      `;
      const [catResult, systemDefaultRows] = await Promise.all([
        api.dbQuery(catSql, [selectedOutlet.id]),
        api.getSystemDefaults("item-category", selectedOutlet.id),
      ]);

      const categorySet = new Set<string>();
      (catResult || []).forEach((c: any) => {
        if (c?.category) categorySet.add(String(c.category));
      });
      (systemDefaultRows || []).forEach((r: any) => {
        try {
          const parsed = typeof r.data === "string" ? JSON.parse(r.data) : r.data;
          const arr = Array.isArray(parsed) ? parsed : [parsed];
          arr.forEach((x: any) => {
            const name = x?.name ?? x;
            if (name) categorySet.add(String(name));
          });
        } catch {}
      });

      const categoryOptions = Array.from(categorySet)
        .sort((a, b) => a.localeCompare(b))
        .map((c) => ({ value: c, label: c }));
      setCategories(categoryOptions);

      const userSql = `
        SELECT DISTINCT ii.addedBy as addedBy
        FROM inventory_item ii
        JOIN inventory i ON ii.inventoryId = i.id
        WHERE i.outletId = ? AND ii.addedBy IS NOT NULL AND ii.addedBy != ''
        ORDER BY ii.addedBy ASC
      `;
      const userResult = await api.dbQuery(userSql, [selectedOutlet.id]);
      const userIds = (userResult || [])
        .map((u: any) => u.addedBy)
        .filter(Boolean);

      let nameRows: any[] = [];
      if (userIds.length > 0) {
        const placeholders = userIds.map(() => "?").join(",");
        const nameSql = `SELECT id, fullName FROM user WHERE id IN (${placeholders})`;
        nameRows = await api.dbQuery(nameSql, userIds);
      }

      setUsers(
        userIds.map((id: string) => {
          const found = nameRows.find((r: any) => r.id === id);
          const authId = authUser?.id != null ? String(authUser.id) : null;
          const fallbackName =
            authId && id === authId && authUser?.name
              ? authUser.name
              : undefined;
          return { value: id, label: found?.fullName || fallbackName || id };
        }),
      );
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedOutlet,
    searchTerm,
    filters,
    currentPage,
    itemsPerPage,
    refreshNonce,
    sortConfig,
    authUser?.id,
    authUser?.name,
    lastUpdated,
  ]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleApplyFilters = (newFilters: InventoryFilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      category: "All",
      minStockLevel: "",
      maxStockLevel: "",
      reOrderLevel: "",
      actionBy: "All",
      lastUpdate: undefined,
      itemCode: "",
    });
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "ASC" ? "DESC" : "ASC",
    }));
    setCurrentPage(1);
  };

  const headers = [
    { label: "ITEM ID", key: "itemCode" },
    { label: "ITEM NAME", key: "name" },
    { label: "CATEGORY", key: "category" },
    { label: "CURRENT STOCK", key: "currentStockLevel" },
    { label: "LOT QTY", key: "lotQty" },
    { label: "MIN LEVEL", key: "minimumStockLevel" },
    { label: "RE-ORDER LEVEL", key: "reOrderLevel" },
    { label: "ITEM TYPE", key: "itemType" },
    { label: "LAST UPDATE", key: "updatedAt" },
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
            <button
              type="button"
              className="h-11 px-4 bg-[#15BA5C] text-white rounded-r-[10px] hover:bg-[#119E4D] transition-colors cursor-pointer flex items-center justify-center"
            >
              <Search className="size-5" />
            </button>
          </div>

          {/* Activity Log Button */}
          <button
            type="button"
            className="h-11 px-5 bg-white border border-gray-200 rounded-[10px] text-[14px] font-medium text-[#4B5563] hover:bg-gray-50 transition-all flex items-center gap-2 cursor-pointer"
          >
            Activity Log
            <ChevronRight className="size-4 text-gray-400" />
          </button>

          {/* Filters Button */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className="h-11 px-5 bg-white border border-gray-200 rounded-[10px] text-[14px] font-medium text-[#4B5563] hover:bg-gray-50 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
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
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead className="bg-[#F9FAFB]">
                <tr>
                  {headers.map((header) => (
                    <th
                      key={header.key}
                      onClick={() => handleSort(header.key)}
                      className="px-3 py-4 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1.5 cursor-pointer hover:text-gray-600 transition-colors group">
                        {header.label}
                        <div className="flex flex-col">
                          <ChevronUp
                            className={`size-3 ${
                              sortConfig.key === header.key &&
                              sortConfig.direction === "ASC"
                                ? "text-gray-900"
                                : "text-gray-300 group-hover:text-gray-400"
                            } transition-colors`}
                          />
                          <ChevronDown
                            className={`size-3 -mt-1.5 ${
                              sortConfig.key === header.key &&
                              sortConfig.direction === "DESC"
                                ? "text-gray-900"
                                : "text-gray-300 group-hover:text-gray-400"
                            } transition-colors`}
                          />
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
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
                            setSelectedInventoryItemId(item.id);
                            setIsViewEditOpen(true);
                          }}
                          className="hover:underline"
                        >
                          {item.itemCode ||
                            item.id?.slice(0, 8).toUpperCase() ||
                            "N/A"}
                        </button>
                      </td>
                      <td className="px-3 py-5 text-sm font-bold text-[#1C1B20]">
                        {item.itemName}
                      </td>
                      <td className="px-3 py-5 text-sm text-gray-600">
                        {item.category}
                      </td>
                      <td className="px-3 py-5 text-sm font-bold text-[#1C1B20]">
                        {item.currentStockLevel}
                      </td>
                      <td className="px-3 py-5 text-sm text-gray-600 font-medium">
                        {item.lotQty || 0}
                      </td>
                      <td className="px-3 py-5 text-sm text-gray-600 font-medium">
                        {item.minimumStockLevel}
                      </td>
                      <td className="px-3 py-5 text-sm text-gray-600 font-medium">
                        {item.reOrderLevel}
                      </td>
                      <td className="px-3 py-5">
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[12px] font-medium rounded-full">
                          {item.itemType}
                        </span>
                      </td>
                      <td className="px-3 py-5 text-sm text-gray-600">
                        {format(new Date(item.updatedAt), "eee do MMM, yyyy")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-4 bg-white border border-gray-100 rounded-xl">
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
            totalPages={Math.ceil(totalCount / itemsPerPage)}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            totalItems={totalCount}
          />
        )}
      </div>

      {/* Creation Modal Placeholder */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-150 bg-black/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-[840px] h-full bg-white shadow-2xl animate-in slide-in-from-right duration-300">
            <CreateInventoryItems
              onClose={() => setIsCreateModalOpen(false)}
              onSuccess={() => {
                setIsCreateModalOpen(false);
                setSearchTerm("");
                setFilters({
                  category: "All",
                  minStockLevel: "",
                  maxStockLevel: "",
                  reOrderLevel: "",
                  actionBy: "All",
                  lastUpdate: undefined,
                  itemCode: "",
                });
                setSortConfig({ key: "updatedAt", direction: "DESC" });
                setCurrentPage(1);
                setRefreshNonce((n) => n + 1);
                refreshInventory();
              }}
            />
          </div>
        </div>
      )}

      {/* Filters Modal */}
      <InventoryListFilter
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        initialFilters={filters}
        categories={categories}
        users={users}
      />

      <ViewAndEditInventoryList
        isOpen={isViewEditOpen}
        inventoryItemId={selectedInventoryItemId}
        onClose={() => {
          setIsViewEditOpen(false);
          setSelectedInventoryItemId(null);
        }}
        onUpdated={() => {
          setRefreshNonce((n) => n + 1);
          refreshInventory();
        }}
        onDeleted={() => {
          setRefreshNonce((n) => n + 1);
          refreshInventory();
        }}
      />
    </div>
  );
};

export default InventoryList;
