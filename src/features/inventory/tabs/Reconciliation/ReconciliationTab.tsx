import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, SlidersHorizontal, LayoutGrid, ChevronUp } from "lucide-react";
import NotFound from "../../NotFound";
import { useBusinessStore } from "@/stores/useBusinessStore";
import useToastStore from "@/stores/toastStore";

interface LotRecord {
  id: string;
  lotNumber: string;
  unitOfMeasure: string;
  recordedLevel: number;
  countedQuantity: string;
  variance: number;
  reason: string;
}

interface ReconciledItem {
  inventoryItemId: string;
  name: string;
  unitOfMeasure: string;
  lots: LotRecord[];
  totalStock: number;
}

type InventoryItemOption = {
  inventoryItemId: string;
  itemName: string;
  itemCode: string | null;
  displayedUnitOfMeasure: string | null;
  unitOfPurchase: string | null;
  unitOfTransfer: string | null;
  unitOfConsumption: string | null;
  currentStockLevel: number | null;
};

const ReconciliationTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ReconciledItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [items, setItems] = useState<InventoryItemOption[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  const { selectedOutlet } = useBusinessStore();
  const { showToast } = useToastStore();

  const roundNumber = (value: number, decimals = 3) => {
    const factor = 10 ** decimals;
    return Math.round((value + Number.EPSILON) * factor) / factor;
  };

  const formatNumber = (value: number) =>
    new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 }).format(
      Number.isFinite(value) ? value : 0,
    );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const api = (window as any).electronAPI;
    if (!api?.dbQuery || !selectedOutlet?.id) return;

    let cancelled = false;
    (async () => {
      setIsLoadingItems(true);
      try {
        const sql = `
          SELECT
            ii.id as inventoryItemId,
            im.name as itemName,
            im.itemCode as itemCode,
            im.displayedUnitOfMeasure as displayedUnitOfMeasure,
            im.unitOfPurchase as unitOfPurchase,
            im.unitOfTransfer as unitOfTransfer,
            im.unitOfConsumption as unitOfConsumption,
            ii.currentStockLevel as currentStockLevel
          FROM inventory_item ii
          JOIN inventory i ON ii.inventoryId = i.id
          JOIN item_master im ON ii.itemMasterId = im.id
          WHERE i.outletId = ? AND ii.isDeleted = 0
          ORDER BY LOWER(im.name) ASC
        `;
        const res = await api.dbQuery(sql, [selectedOutlet.id]);
        if (cancelled) return;
        setItems(res || []);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to fetch inventory items:", err);
        showToast("error", "Error", "Failed to fetch inventory items");
      } finally {
        if (!cancelled) setIsLoadingItems(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedOutlet?.id, showToast]);

  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const base = q
      ? items.filter((it) => {
          const name = String(it.itemName || "").toLowerCase();
          const code = String(it.itemCode || "").toLowerCase();
          return name.includes(q) || code.includes(q);
        })
      : items;
    return base.slice(0, 200);
  }, [items, searchTerm]);

  const resolveDisplayedUnit = (item: InventoryItemOption) => {
    const keyRaw = String(item.displayedUnitOfMeasure || "").trim();
    const key = keyRaw.toLowerCase().replace(/\s+/g, "");
    if (key === "unitofpurchase") return item.unitOfPurchase || "-";
    if (key === "unitoftransfer") return item.unitOfTransfer || "-";
    if (key === "unitofconsumption") return item.unitOfConsumption || "-";
    return (
      keyRaw ||
      item.unitOfPurchase ||
      item.unitOfTransfer ||
      item.unitOfConsumption ||
      "-"
    );
  };

  const loadItemLots = async (inventoryItemId: string) => {
    const api = (window as any).electronAPI;
    if (!api?.dbQuery) return [];
    const sql = `
      SELECT id, lotNumber, currentStockLevel
      FROM item_lot
      WHERE itemId = ?
      ORDER BY datetime(createdAt) DESC
    `;
    const rows = await api.dbQuery(sql, [inventoryItemId]);
    return rows || [];
  };

  const handleSelectItem = async (item: InventoryItemOption) => {
    if (!selectedOutlet?.id) return;
    const api = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    setIsLoading(true);
    try {
      const lotsRows = await loadItemLots(item.inventoryItemId);
      const unitOfMeasure = resolveDisplayedUnit(item);
      const lots: LotRecord[] = lotsRows.map((r: any) => {
        const recordedLevel = Number(r?.currentStockLevel ?? 0) || 0;
        return {
          id: String(r?.id),
          lotNumber: String(r?.lotNumber || "-"),
          unitOfMeasure,
          recordedLevel,
          countedQuantity: "",
          variance: 0,
          reason: "",
        };
      });

      const totalFromLots = roundNumber(
        lots.reduce((sum, l) => sum + l.recordedLevel, 0),
      );
      const totalStock =
        lots.length > 0
          ? totalFromLots
          : roundNumber(Number(item.currentStockLevel ?? 0) || 0);

      setSelectedItem({
        inventoryItemId: item.inventoryItemId,
        name: item.itemName,
        unitOfMeasure,
        lots,
        totalStock,
      });

      setShowSearchResults(false);
      setSearchTerm("");
    } catch (err) {
      console.error("Failed to load item lots:", err);
      showToast("error", "Error", "Failed to load item lots");
    } finally {
      setIsLoading(false);
    }
  };

  const updateLot = (id: string, field: keyof LotRecord, value: string) => {
    if (!selectedItem) return;
    const nextLots = selectedItem.lots.map((lot) => {
      if (lot.id !== id) return lot;
      const updatedLot = { ...lot, [field]: value };
      if (field === "countedQuantity") {
        const counted = parseFloat(value) || 0;
        updatedLot.variance = roundNumber(counted - lot.recordedLevel);
      }
      return updatedLot;
    });

    const nextTotalStock = roundNumber(
      nextLots.reduce((sum, lot) => {
        const counted = parseFloat(lot.countedQuantity);
        const v = Number.isFinite(counted) ? counted : lot.recordedLevel;
        return sum + v;
      }, 0),
    );

    setSelectedItem({
      ...selectedItem,
      lots: nextLots,
      totalStock: nextTotalStock,
    });
  };

  const handleSave = async () => {
    if (!selectedItem) return;
    const api = (window as any).electronAPI;
    if (!api?.dbQuery) return;
    if (isSaving) return;

    const now = new Date().toISOString();
    const updates = selectedItem.lots
      .map((l) => {
        const counted = parseFloat(l.countedQuantity);
        if (!Number.isFinite(counted)) return null;
        return { lotId: l.id, counted };
      })
      .filter(Boolean) as Array<{ lotId: string; counted: number }>;

    if (updates.length === 0) {
      showToast("error", "Error", "Enter counted quantities before saving");
      return;
    }

    setIsSaving(true);
    try {
      for (const u of updates) {
        await api.dbQuery(
          `
            UPDATE item_lot
            SET currentStockLevel = ?,
                updatedAt = ?,
                version = COALESCE(version, 0) + 1
            WHERE id = ?
          `,
          [u.counted, now, u.lotId],
        );

        if (api.queueAdd) {
          const row = await api.dbQuery("SELECT * FROM item_lot WHERE id = ?", [
            u.lotId,
          ]);
          if (row?.[0]) {
            await api.queueAdd({
              table: "item_lot",
              action: "UPDATE",
              data: row[0],
              id: u.lotId,
            });
          }
        }
      }

      const nextTotalStock = roundNumber(
        selectedItem.lots.reduce((sum, l) => {
          const counted = parseFloat(l.countedQuantity);
          const v = Number.isFinite(counted) ? counted : l.recordedLevel;
          return sum + v;
        }, 0),
      );

      await api.dbQuery(
        `
          UPDATE inventory_item
          SET currentStockLevel = ?,
              updatedAt = ?,
              version = COALESCE(version, 0) + 1
          WHERE id = ?
        `,
        [nextTotalStock, now, selectedItem.inventoryItemId],
      );

      if (api.queueAdd) {
        const row = await api.dbQuery(
          "SELECT * FROM inventory_item WHERE id = ?",
          [selectedItem.inventoryItemId],
        );
        if (row?.[0]) {
          await api.queueAdd({
            table: "inventory_item",
            action: "UPDATE",
            data: row[0],
            id: selectedItem.inventoryItemId,
          });
        }
      }

      const lotsRows = await loadItemLots(selectedItem.inventoryItemId);
      const lots: LotRecord[] = lotsRows.map((r: any) => {
        const recordedLevel = Number(r?.currentStockLevel ?? 0) || 0;
        return {
          id: String(r?.id),
          lotNumber: String(r?.lotNumber || "-"),
          unitOfMeasure: selectedItem.unitOfMeasure,
          recordedLevel,
          countedQuantity: "",
          variance: 0,
          reason: "",
        };
      });
      const totalFromLots = roundNumber(
        lots.reduce((sum, l) => sum + l.recordedLevel, 0),
      );
      setSelectedItem({
        ...selectedItem,
        lots,
        totalStock: lots.length > 0 ? totalFromLots : nextTotalStock,
      });

      showToast("success", "Success", "Reconciliation saved");
    } catch (err) {
      console.error("Failed to save reconciliation:", err);
      showToast("error", "Error", "Failed to save reconciliation");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8 px-1">
        <div className="relative w-[280px]" ref={searchRef}>
          <div className="flex items-center">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              placeholder="Search"
              className="w-full h-11 px-4 bg-white border border-gray-200 rounded-l-[10px] outline-none focus:border-[#15BA5C] transition-all text-sm placeholder:text-gray-400"
            />
            <button className="h-11 px-4 bg-[#15BA5C] text-white rounded-r-[10px] hover:bg-[#119E4D] transition-colors cursor-pointer flex items-center justify-center shrink-0">
              <Search className="size-5" />
            </button>
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-[10px] shadow-xl z-[100] py-1 max-h-[300px] overflow-y-auto custom-scrollbar">
              {isLoadingItems && (
                <div className="px-4 py-3 text-sm text-gray-400 italic text-center">
                  Loading items...
                </div>
              )}
              {!isLoadingItems &&
                filteredItems.map((opt, idx) => (
                  <button
                    key={opt.inventoryItemId || idx}
                    onClick={() => handleSelectItem(opt)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between group"
                  >
                    <span className="text-sm font-medium text-gray-700 group-hover:text-[#15BA5C]">
                      {opt.itemName}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatNumber(Number(opt.currentStockLevel ?? 0) || 0)}{" "}
                      {resolveDisplayedUnit(opt)}
                    </span>
                  </button>
                ))}
              {!isLoadingItems && filteredItems.length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-400 italic text-center">
                  No items found
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button className="h-11 px-5 bg-white border border-gray-200 rounded-[10px] text-[14px] font-medium text-[#4B5563] hover:bg-gray-50 transition-all flex items-center gap-2 cursor-pointer shadow-sm">
            More Actions
            <LayoutGrid className="size-4 text-gray-400" />
          </button>
          <button className="h-11 px-5 bg-white border border-gray-200 rounded-[10px] text-[14px] font-medium text-[#4B5563] hover:bg-gray-50 transition-all flex items-center gap-2 cursor-pointer shadow-sm">
            Filters
            <SlidersHorizontal className="size-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="flex-1 overflow-hidden">
        {selectedItem ? (
          <div className="space-y-6">
            <h2 className="text-[20px] font-bold text-gray-900 px-1">
              {selectedItem.name}
            </h2>

            {isLoading ? (
              <div className="px-4 py-12 text-sm text-gray-400 italic text-center">
                Loading lots...
              </div>
            ) : selectedItem.lots.length === 0 ? (
              <div className="px-4 py-12 text-sm text-gray-400 italic text-center">
                No lots found for this item.
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead className="bg-[#F9FAFB]">
                    <tr>
                      <th className="px-4 py-4 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                        <div className="flex items-center gap-1.5 cursor-pointer hover:text-gray-600 transition-colors group">
                          Lot Number
                          <ChevronUp className="size-3.5 text-gray-300 group-hover:text-gray-400" />
                        </div>
                      </th>
                      <th className="px-4 py-4 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                        <div className="flex items-center gap-1.5 cursor-pointer hover:text-gray-600 transition-colors group">
                          Unit of Measure
                          <ChevronUp className="size-3.5 text-gray-300 group-hover:text-gray-400" />
                        </div>
                      </th>
                      <th className="px-4 py-4 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                        <div className="flex items-center gap-1.5 cursor-pointer hover:text-gray-600 transition-colors group">
                          Recorded Level
                          <ChevronUp className="size-3.5 text-gray-300 group-hover:text-gray-400" />
                        </div>
                      </th>
                      <th className="px-4 py-4 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                        Counted Quantity
                      </th>
                      <th className="px-4 py-4 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                        <div className="flex items-center gap-1.5 cursor-pointer hover:text-gray-600 transition-colors group">
                          Variance
                          <ChevronUp className="size-3.5 text-gray-300 group-hover:text-gray-400" />
                        </div>
                      </th>
                      <th className="px-4 py-4 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                        <div className="flex items-center gap-1.5 cursor-pointer hover:text-gray-600 transition-colors group">
                          Reason for Discrepancy
                          <ChevronUp className="size-3.5 text-gray-300 group-hover:text-gray-400" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
                    {selectedItem.lots.map((lot) => (
                      <tr
                        key={lot.id}
                        className="hover:bg-gray-50/50 transition-colors group"
                      >
                        <td className="px-4 py-5 text-sm font-medium text-gray-700">
                          {lot.lotNumber}
                        </td>
                        <td className="px-4 py-5 text-sm text-gray-600">
                          {lot.unitOfMeasure}
                        </td>
                        <td className="px-4 py-5 text-sm text-gray-600">
                          {lot.recordedLevel}
                        </td>
                        <td className="px-4 py-5">
                          <input
                            type="text"
                            value={lot.countedQuantity}
                            onChange={(e) =>
                              updateLot(
                                lot.id,
                                "countedQuantity",
                                e.target.value,
                              )
                            }
                            className="w-[120px] h-10 px-3 border border-gray-200 rounded-[8px] outline-none focus:border-[#15BA5C] transition-all text-sm text-center"
                          />
                        </td>
                        <td
                          className={`px-4 py-5 text-sm font-medium ${lot.variance < 0 ? "text-red-500" : lot.variance > 0 ? "text-[#15BA5C]" : "text-gray-600"}`}
                        >
                          {lot.variance > 0 ? `+${lot.variance}` : lot.variance}
                        </td>
                        <td className="px-4 py-5">
                          <input
                            type="text"
                            value={lot.reason}
                            onChange={(e) =>
                              updateLot(lot.id, "reason", e.target.value)
                            }
                            className="w-full min-w-[200px] h-10 px-3 border border-gray-200 rounded-[8px] outline-none focus:border-[#15BA5C] transition-all text-sm"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Total Summary Section */}
            <div className="flex items-center justify-between py-6 px-4 border-t border-gray-100">
              <span className="text-[16px] font-bold text-gray-900 uppercase">
                Total Stock
              </span>
              <span className="text-[18px] font-bold text-gray-900 uppercase">
                {formatNumber(selectedItem.totalStock)}{" "}
                {selectedItem.unitOfMeasure}
              </span>
            </div>

            {/* Action Buttons Footer */}
            <div className="grid grid-cols-2 gap-4 pt-6">
              <button
                onClick={handleSave}
                disabled={isSaving || isLoading}
                className="h-12 bg-[#15BA5C] text-white font-bold rounded-[8px] hover:bg-[#119E4D] transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Save
              </button>
              <button
                onClick={() => setSelectedItem(null)}
                disabled={isSaving || isLoading}
                className="h-12 bg-[#F3F4F6] text-[#4B5563] font-bold rounded-[8px] hover:bg-gray-200 transition-all active:scale-[0.99] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20  w-full rounded-[12px] ">
            <NotFound
              title="No Inventory Item Selected"
              description="Search for an inventory item to start the reconciliation process."
              onAddClick={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ReconciliationTab;
