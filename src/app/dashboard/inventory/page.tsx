import { useEffect, useState } from "react";
import { UploadCloud, Share2, Plus, MoveUpRight } from "lucide-react";
import { PiTrashFill } from "react-icons/pi";
import useInventoryStore from "@/stores/useInventoryStore";
import useBusinessStore from "@/stores/useBusinessStore";
import InventoryNavigation from "@/features/inventory/InventoryNavigation";
import CreateInventoryItems from "@/features/inventory/tabs/InventoryList/CreateInventoryItems";

const InventoryPage = () => {
  const { inventoryItems, refreshInventory } = useInventoryStore();
  const { selectedOutlet } = useBusinessStore();

  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaries, setSummaries] = useState({
    totalItems: 0,
    expiringItems: 0,
    expiredItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
  });

  useEffect(() => {
    if (!selectedOutlet?.id) return;
    const api = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    const fetchSummary = async () => {
      setIsSummaryLoading(true);
      try {
        const now = new Date();
        const nowIso = now.toISOString();
        const expiringUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const expiringUntilIso = expiringUntil.toISOString();

        const sql = `
          WITH lot_min AS (
            SELECT itemId, MIN(expiryDate) AS minExpiry
            FROM item_lot
            WHERE expiryDate IS NOT NULL AND expiryDate != ''
            GROUP BY itemId
          ),
          base AS (
            SELECT
              ii.id AS inventoryItemId,
              COALESCE(ii.currentStockLevel, 0) AS currentStockLevel,
              COALESCE(ii.minimumStockLevel, 0) AS minimumStockLevel,
              lot_min.minExpiry AS minExpiry
            FROM inventory_item ii
            JOIN inventory i ON ii.inventoryId = i.id
            LEFT JOIN lot_min ON lot_min.itemId = ii.id
            WHERE i.outletId = ? AND ii.isDeleted = 0
          )
          SELECT
            COUNT(*) AS totalItems,
            SUM(CASE WHEN minExpiry IS NOT NULL AND minExpiry < ? THEN 1 ELSE 0 END) AS expiredItems,
            SUM(CASE WHEN minExpiry IS NOT NULL AND minExpiry >= ? AND minExpiry <= ? THEN 1 ELSE 0 END) AS expiringItems,
            SUM(CASE WHEN currentStockLevel = 0 THEN 1 ELSE 0 END) AS outOfStockItems,
            SUM(CASE WHEN currentStockLevel > 0 AND currentStockLevel < minimumStockLevel THEN 1 ELSE 0 END) AS lowStockItems
          FROM base
        `;

        const rows = await api.dbQuery(sql, [
          selectedOutlet.id,
          nowIso,
          nowIso,
          expiringUntilIso,
        ]);
        const row = rows?.[0] || {};
        setSummaries({
          totalItems: Number(row.totalItems || 0),
          expiringItems: Number(row.expiringItems || 0),
          expiredItems: Number(row.expiredItems || 0),
          lowStockItems: Number(row.lowStockItems || 0),
          outOfStockItems: Number(row.outOfStockItems || 0),
        });
      } catch (err) {
        console.error("Failed to fetch inventory summary:", err);
      } finally {
        setIsSummaryLoading(false);
      }
    };

    fetchSummary();
  }, [selectedOutlet?.id, inventoryItems.length]);

  // State for modals/tables visibility
  const [, setShowTotalNumberOfItemsTable] = useState(false);
  const [, setShowTotalExpiringItemsTable] = useState(false);
  const [, setShowTotalNumberOfExpiredItemsTable] = useState(false);
  const [, setShowTotalLowInStockItemsTable] = useState(false);
  const [, setShowTotalOutOfStocksTable] = useState(false);
  const [isCreateInventoryOpen, setIsCreateInventoryOpen] = useState(false);

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Inventory Management
          </h1>
          <p className="text-sm text-gray-500">
            Add, edit and manage your Inventory with ease
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-[#15BA5C] px-4 py-2 text-sm font-medium text-[#15BA5C] hover:bg-green-50"
          >
            <UploadCloud className="h-4 w-4" />
            Bulk Upload
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-[#15BA5C] px-4 py-2 text-sm font-medium text-[#15BA5C] hover:bg-green-50"
          >
            <Share2 className="h-4 w-4" />
            Export
          </button>
          <button
            type="button"
            onClick={() => setIsCreateInventoryOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-[#15BA5C] px-4 py-2 text-sm font-medium text-white hover:bg-[#119E4D] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create Inventory Item
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="my-2 grid grid-cols-5 gap-[10px] bg-[#FFFFFF] px-3.5 py-2.5">
        <div className="bg-[#15BA5C0D] py-[25px] px-3.5 rounded-[10px] relative">
          <div className="flex items-center gap-[11px] ">
            <div className="bg-[#15BA5C0D] px-2.5 rounded-lg py-2.5">
              <PiTrashFill className="text-[#15BA5C] text-[22px]" />
            </div>
            <h2 className="text-[20px] font-bold">
              {isSummaryLoading ? 0 : summaries.totalItems || 0}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowTotalNumberOfItemsTable(true)}
            className="cursor-pointer hover:bg-[#15BA5C]/10 absolute flex items-center rounded-full h-[30px] w-[30px] right-4 top-3 justify-center border border-[#15BA5C]"
          >
            <MoveUpRight className="text-[#15BA5C] h-[16px] " />
          </button>

          <p className="text-[14px] font-normal pt-2.5"> Total No of Items</p>
        </div>

        <div className="bg-[#F8BD000D] py-[25px] px-3.5 rounded-[10px] relative">
          <div className="flex items-center gap-[11px] ">
            <div className="bg-[#F8BD00]/10 px-2.5 rounded-lg py-2.5">
              <PiTrashFill className="text-[#F8BD00] text-[22px]" />
            </div>
            <h2 className="text-[20px] font-bold">
              {isSummaryLoading ? 0 : summaries.expiringItems || 0}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowTotalExpiringItemsTable(true)}
            className="cursor-pointer hover:bg-[#F8BD00]/10 absolute flex items-center rounded-full h-[30px] w-[30px] right-4 top-3 justify-center border border-[#F8BD00]"
          >
            <MoveUpRight className="text-[#F8BD00] h-[16px] " />
          </button>

          <p className="text-[14px] font-normal pt-2.5">
            {" "}
            Total Expiring Items
          </p>
        </div>

        <div className="bg-[#E336290D] py-[25px] px-3.5 rounded-[10px] relative">
          <div className="flex items-center gap-[11px] ">
            <div className="bg-[#E33629]/10  px-2.5 rounded-lg py-2.5">
              <PiTrashFill className="text-[#E33629] text-[22px]" />
            </div>
            <h2 className="text-[20px] font-bold">
              {isSummaryLoading ? 0 : summaries.expiredItems || 0}
            </h2>
          </div>
          <div
            className="absolute cursor-pointer hover:bg-[#E33629]/20 flex items-center rounded-full h-[30px] w-[30px] right-4 top-3 justify-center border border-[#E33629]"
            onClick={() => setShowTotalNumberOfExpiredItemsTable(true)}
          >
            <MoveUpRight className="text-[#E33629] h-[16px] " />
          </div>

          <p className="text-[14px] font-normal pt-2.5"> Total Expired Items</p>
        </div>

        <div className="bg-[#9747FF0D] py-[25px] px-3.5 rounded-[10px] relative">
          <div className="flex items-center gap-[11px] ">
            <div className="bg-[#9747FF]/10 px-2.5 rounded-lg py-2.5">
              <PiTrashFill className="text-[#9747FF] text-[22px]" />
            </div>
            <h2 className="text-[20px] font-bold">
              {isSummaryLoading ? 0 : summaries.lowStockItems || 0}
            </h2>
          </div>
          <div
            className="cursor-pointer hover:bg-[#9747FF]/20 absolute flex items-center rounded-full h-[30px] w-[30px] right-4 top-3 justify-center border border-[#9747FF]"
            onClick={() => setShowTotalLowInStockItemsTable(true)}
          >
            <MoveUpRight className="text-[#9747FF] h-[16px] " />
          </div>

          <p className="text-[14px] font-normal pt-2.5"> Low In-stock Items</p>
        </div>

        <div className="bg-[#73737314]  py-[25px] px-3.5 rounded-[10px] relative">
          <div className="flex items-center gap-[11px] ">
            <div className="bg-[#737373]/10 px-2.5 rounded-lg py-2.5">
              <PiTrashFill className="text-[#737373] text-[22px]" />
            </div>
            <h2 className="text-[20px] font-bold">
              {isSummaryLoading ? 0 : summaries.outOfStockItems || 0}
            </h2>
          </div>
          <div
            className="absolute cursor-pointer hover:bg-[#737373]/20 flex items-center rounded-full h-[30px] w-[30px] right-4 top-3 justify-center border border-[#737373]"
            onClick={() => setShowTotalOutOfStocksTable(true)}
          >
            <MoveUpRight className="text-[#737373] h-[16px] " />
          </div>

          <p className="text-[14px] font-normal pt-2.5"> Out of Stock Items</p>
        </div>
      </div>
      <InventoryNavigation />

      {/* Create Inventory Drawer */}
      {isCreateInventoryOpen && (
        <div className="fixed inset-0 z-150 bg-black/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-[840px] h-full bg-white shadow-2xl animate-in slide-in-from-right duration-300">
            <CreateInventoryItems
              onClose={() => setIsCreateInventoryOpen(false)}
              onSuccess={() => {
                setIsCreateInventoryOpen(false);
                refreshInventory();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
