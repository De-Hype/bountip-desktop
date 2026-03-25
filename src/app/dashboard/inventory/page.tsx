import { useEffect, useState } from "react";
import {
  UploadCloud,
  Share2,
  Plus,
  MoveUpRight,
  ChevronDown,
  Upload,
  Loader2,
} from "lucide-react";
import { PiTrashFill } from "react-icons/pi";
import useInventoryStore from "@/stores/useInventoryStore";
import useBusinessStore from "@/stores/useBusinessStore";
import InventoryNavigation from "@/features/inventory/InventoryNavigation";
import CreateInventoryItems from "@/features/inventory/tabs/InventoryList/CreateInventoryItems";
import BulkUploadInventoryItemsModal from "@/features/inventory/BulkUploadInventoryItemsModal";
import useToastStore from "@/stores/toastStore";
import * as XLSX from "xlsx";

const InventoryPage = () => {
  const { refreshInventory, lastUpdated } = useInventoryStore();
  const { selectedOutlet } = useBusinessStore();
  const { showToast } = useToastStore();

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
  }, [selectedOutlet?.id, lastUpdated]);

  // State for modals/tables visibility
  const [, setShowTotalNumberOfItemsTable] = useState(false);
  const [, setShowTotalExpiringItemsTable] = useState(false);
  const [, setShowTotalNumberOfExpiredItemsTable] = useState(false);
  const [, setShowTotalLowInStockItemsTable] = useState(false);
  const [, setShowTotalOutOfStocksTable] = useState(false);
  const [isCreateInventoryOpen, setIsCreateInventoryOpen] = useState(false);
  const [isBulkMenuOpen, setIsBulkMenuOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const INVENTORY_HEADERS = [
    "itemName",
    "itemCode",
    "itemCategory",
    "itemType",
    "unitOfPurchase",
    "unitOfTransfer",
    "unitOfConsumption",
    "displayedUnitOfMeasure",
    "noOfTransferBasedOnPurchase",
    "noOfConsumptionUnitBasedOnPurchase",
    "minimumStockLevel",
    "reOrderLevel",
    "lotNumber",
    "supplierBarcode",
    "quantityPurchased",
    "expiryDate",
    "costPrice",
    "suppliers",
    "trackInventory",
    "makeItemTraceable",
  ] as const;

  const handleExport = async () => {
    if (!selectedOutlet?.id) {
      showToast("error", "No outlet selected", "Please select an outlet first");
      return;
    }

    setIsExporting(true);
    try {
      const api = window.electronAPI as any;
      if (!api?.dbQuery) throw new Error("Database API not available");

      const rows = await api.dbQuery(
        `
          SELECT
            im.name as itemName,
            im.itemCode as itemCode,
            im.category as itemCategory,
            im.itemType as itemType,
            im.unitOfPurchase as unitOfPurchase,
            im.unitOfTransfer as unitOfTransfer,
            im.unitOfConsumption as unitOfConsumption,
            im.displayedUnitOfMeasure as displayedUnitOfMeasure,
            COALESCE(im.transferPerPurchase, 0) as transferPerPurchase,
            COALESCE(im.consumptionPerTransfer, 0) as consumptionPerTransfer,
            COALESCE(ii.minimumStockLevel, 0) as minimumStockLevel,
            COALESCE(ii.reOrderLevel, 0) as reOrderLevel,
            COALESCE(il.lotNumber, '') as lotNumber,
            COALESCE(il.supplierSesrialNumber, '') as supplierBarcode,
            COALESCE(il.quantityPurchased, 0) as quantityPurchased,
            COALESCE(il.expiryDate, '') as expiryDate,
            COALESCE(il.costPrice, 0) as costPrice,
            COALESCE(il.supplierName, '') as suppliers,
            COALESCE(im.isTrackable, 0) as trackInventory,
            COALESCE(im.isTraceable, 1) as makeItemTraceable
          FROM inventory_item ii
          JOIN inventory i ON ii.inventoryId = i.id
          JOIN item_master im ON ii.itemMasterId = im.id
          LEFT JOIN item_lot il ON il.id = (
            SELECT id FROM item_lot
            WHERE itemId = ii.id
            ORDER BY createdAt DESC
            LIMIT 1
          )
          WHERE i.outletId = ? AND ii.isDeleted = 0
          ORDER BY im.name ASC
        `,
        [selectedOutlet.id],
      );

      if (!rows || rows.length === 0) {
        showToast(
          "warning",
          "No items to export",
          "You don't have any inventory items in this outlet",
        );
        return;
      }

      const data = (rows || []).map((r: any) => {
        const transferPerPurchase = Number(r.transferPerPurchase || 0);
        const consumptionPerTransfer = Number(r.consumptionPerTransfer || 0);
        const noOfConsumptionUnitBasedOnPurchase =
          transferPerPurchase > 0
            ? consumptionPerTransfer * transferPerPurchase
            : 0;

        return {
          itemName: r.itemName ?? "",
          itemCode: r.itemCode ?? "",
          itemCategory: r.itemCategory ?? "",
          itemType: r.itemType ?? "",
          unitOfPurchase: r.unitOfPurchase ?? "",
          unitOfTransfer: r.unitOfTransfer ?? "",
          unitOfConsumption: r.unitOfConsumption ?? "",
          displayedUnitOfMeasure: r.displayedUnitOfMeasure ?? "",
          noOfTransferBasedOnPurchase: transferPerPurchase,
          noOfConsumptionUnitBasedOnPurchase,
          minimumStockLevel: Number(r.minimumStockLevel || 0),
          reOrderLevel: Number(r.reOrderLevel || 0),
          lotNumber: r.lotNumber ?? "",
          supplierBarcode: r.supplierBarcode ?? "",
          quantityPurchased: Number(r.quantityPurchased || 0),
          expiryDate: r.expiryDate ?? "",
          costPrice: Number(r.costPrice || 0),
          suppliers: r.suppliers ?? "",
          trackInventory: Number(r.trackInventory || 0) ? "TRUE" : "FALSE",
          makeItemTraceable: Number(r.makeItemTraceable || 0)
            ? "TRUE"
            : "FALSE",
        };
      });

      const ws = XLSX.utils.json_to_sheet(data, {
        header: [...INVENTORY_HEADERS],
      });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Inventory Items");

      const safeOutletName = String(selectedOutlet.name || "outlet")
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "_");
      const date = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `inventory_items_${safeOutletName}_${date}.xlsx`);

      showToast("success", "Export complete", "Inventory items exported");
    } catch (err) {
      console.error("Failed to export inventory items:", err);
      showToast("error", "Export failed", "Could not export inventory items");
    } finally {
      setIsExporting(false);
    }
  };

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
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsBulkMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-lg border border-[#15BA5C] px-4 py-2 text-sm font-medium text-[#15BA5C] hover:bg-green-50"
            >
              <UploadCloud className="h-4 w-4" />
              Bulk Upload
              <ChevronDown className="h-4 w-4" />
            </button>

            {isBulkMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-[10px] border border-gray-200 bg-white shadow-lg py-2 z-10">
                <button
                  type="button"
                  onClick={() => {
                    setIsBulkMenuOpen(false);
                    setIsBulkUploadOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsBulkMenuOpen(false)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-400 text-[10px] text-gray-500">
                    ↺
                  </span>
                  <span>View Upload History</span>
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-lg border border-[#15BA5C] px-4 py-2 text-sm font-medium text-[#15BA5C] hover:bg-green-50"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
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

      <BulkUploadInventoryItemsModal
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onUploadSuccess={() => {
          refreshInventory();
        }}
      />
    </div>
  );
};

export default InventoryPage;
