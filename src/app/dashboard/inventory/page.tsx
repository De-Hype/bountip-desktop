import React, { useEffect, useState } from "react";
import { UploadCloud, Share2, Plus, MoveUpRight } from "lucide-react";
import { PiTrashFill } from "react-icons/pi";
import useInventoryStore from "@/stores/useInventoryStore";
import useBusinessStore from "@/stores/useBusinessStore";
import InventoryNavigation from "@/features/inventory/InventoryNavigation";

const InventoryPage = () => {
  const { inventoryItems, refreshInventory } = useInventoryStore();
  const { selectedOutlet } = useBusinessStore();

  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaries, setSummaries] = useState({
    totalItems: 150,
    expiringItems: 23,
    expiredItems: 10,
    lowStockItems: 100,
    outOfStockItems: 23,
  });

  // State for modals/tables visibility
  const [showTotalNumberOfItemsTable, setShowTotalNumberOfItemsTable] =
    useState(false);
  const [showTotalExpiringItemsTable, setShowTotalExpiringItemsTable] =
    useState(false);
  const [
    showTotalNumberOfExpiredItemsTable,
    setShowTotalNumberOfExpiredItemsTable,
  ] = useState(false);
  const [showTotalLowInStockItemsTable, setShowTotalLowInStockItemsTable] =
    useState(false);
  const [showTotalOutOfStocksTable, setShowTotalOutOfStocksTable] =
    useState(false);

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
          <button className="flex items-center gap-2 rounded-lg border border-[#15BA5C] px-4 py-2 text-sm font-medium text-[#15BA5C] hover:bg-green-50">
            <UploadCloud className="h-4 w-4" />
            Bulk Upload
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-[#15BA5C] px-4 py-2 text-sm font-medium text-[#15BA5C] hover:bg-green-50">
            <Share2 className="h-4 w-4" />
            Export
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-[#15BA5C] px-4 py-2 text-sm font-medium text-white hover:bg-[#119E4D]">
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

      {/* Main Content Area (Placeholder for list/table) */}
      <div className="flex-1 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex h-full items-center justify-center text-gray-400">
          <p>Inventory list will appear here</p>
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;
