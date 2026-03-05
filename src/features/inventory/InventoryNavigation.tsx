"use client";
import { useState } from "react";

import InventoryList from "./tabs/InventoryList/InventoryList";
import TraceabilityList from "./tabs/Traceability/TraceabilityList";
import AddReceiveList from "./tabs/Add&Recieve/AddReceiveList";
import WasteList from "./tabs/Waste/WasteList";
import ProcurementList from "./tabs/Procurement/ProcurementList";
import ComponentList from "./tabs/InventoryComponent/ComponentList";
import TransferList from "./tabs/Transfer/TransferList";
import StockList from "./tabs/Stock/StockList";
import SupplierList from "./tabs/Reconciliation/SupplierList";

enum InventoryTab {
  InventoryItems = "inventory_items",
  Traceability = "traceability",
  AddReceive = "add_receive",
  Components = "components",
  Reconciliation = "reconciliation",
  StockCount = "stock_count",
  Waste = "waste",
  Transfer = "transfer",
  Procurement = "procurement",
}

const TAB_LABELS: Record<InventoryTab, string> = {
  [InventoryTab.InventoryItems]: "Inventory Items",
  [InventoryTab.Traceability]: "Traceability",
  [InventoryTab.AddReceive]: "Add/Receive",
  [InventoryTab.Components]: "Components",
  [InventoryTab.Reconciliation]: "Reconciliation",
  [InventoryTab.StockCount]: "Stock Count",
  [InventoryTab.Waste]: "Waste",
  [InventoryTab.Transfer]: "Transfer",
  [InventoryTab.Procurement]: "Procurement",
};

export default function InventoryNavigation() {
  const [activeTab, setActiveTab] = useState<InventoryTab>(
    InventoryTab.InventoryItems,
  );

  const tabs = Object.values(InventoryTab);

  return (
    <div className="w-full flex flex-col gap-[20px]">
      <div className="bg-white rounded-[10px]">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => (
            <div key={tab} className="flex flex-col items-center">
              <button
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 font-normal text-sm transition-colors duration-200 ${
                  activeTab === tab
                    ? "text-[#1C1B20]"
                    : "text-[#A6A6A6] hover:text-gray-700"
                }`}
              >
                {TAB_LABELS[tab]}
              </button>
              <div
                className={`transition-all duration-300 ${
                  activeTab === tab
                    ? " w-full h-[6px] bg-[#15BA5C] rounded-t-full"
                    : "h-[6px] w-full bg-transparent"
                }`}
              />
            </div>
          ))}
        </nav>
      </div>

      <div className="bg-white p-6">
        {activeTab === InventoryTab.InventoryItems ? (
          <InventoryList />
        ) : activeTab === InventoryTab.Traceability ? (
          <TraceabilityList />
        ) : activeTab === InventoryTab.AddReceive ? (
          <AddReceiveList />
        ) : activeTab === InventoryTab.Components ? (
          <ComponentList />
        ) : activeTab === InventoryTab.Transfer ? (
          <TransferList />
        ) : activeTab === InventoryTab.StockCount ? (
          <StockList />
        ) : activeTab === InventoryTab.Reconciliation ? (
          <SupplierList />
        ) : activeTab === InventoryTab.Waste ? (
          <WasteList />
        ) : activeTab === InventoryTab.Procurement ? (
          <ProcurementList />
        ) : (
          <p className="text-gray-500 text-sm">
            Coming soon: {TAB_LABELS[activeTab]}
          </p>
        )}
      </div>
    </div>
  );
}
