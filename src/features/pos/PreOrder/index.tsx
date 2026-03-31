"use client";

import React, { useState } from "react";
import { Search, SlidersHorizontal, Plus } from "lucide-react";
import NotFound from "./NotFound";
import CreatePreOrder from "./CreatePreOrder";
import PreOrderList from "./PreOrderList";
import PreOrderQuoteList from "./PreOrderQuoteList";

export enum PreOrderTabs {
  ORDER = "order",
  QUOTE = "quote",
}

const PreOrder = () => {
  const [activeTab, setActiveTab] = useState<PreOrderTabs>(PreOrderTabs.ORDER);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreatePreOrderOpen, setIsCreatePreOrderOpen] = useState(false);
  const [createPreOrderDefaultType, setCreatePreOrderDefaultType] = useState<
    "order" | "quote"
  >("order");
  const [refreshToken, setRefreshToken] = useState(0);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header Section */}
      <div className="flex flex-col mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[24px] font-bold text-[#1C1B20]">Pre Order</h1>
            <p className="text-[15px] text-[#6B7280] mt-1">
              Create a walk in order
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center border border-[#15BA5C] rounded-[8px] overflow-hidden bg-white">
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={handleSearch}
                className="px-4 py-2 w-[220px] outline-none text-[15px] text-[#1C1B20] placeholder-[#9CA3AF]"
              />
              <button className="bg-[#15BA5C] p-2.5 text-white hover:bg-[#13A652] transition-colors">
                <Search className="w-5 h-5" />
              </button>
            </div>

            <button className="flex items-center gap-2 px-4 py-2 border border-[#15BA5C] rounded-[8px] bg-white text-[#15BA5C] hover:bg-[#15BA5C]/5 transition-colors font-medium">
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-[15px]">Filters</span>
            </button>

            <button
              className="flex items-center gap-2 px-4 py-2 bg-[#15BA5C] text-white rounded-[8px] hover:bg-[#13A652] transition-colors font-medium"
              type="button"
              onClick={() => {
                setCreatePreOrderDefaultType(
                  activeTab === PreOrderTabs.QUOTE ? "quote" : "order",
                );
                setIsCreatePreOrderOpen(true);
              }}
            >
              <Plus className="w-5 h-5" />
              <span className="text-[15px]">Create Order</span>
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-3">
          {[
            { id: PreOrderTabs.ORDER, label: "Order" },
            { id: PreOrderTabs.QUOTE, label: "Quotes" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-8 py-2.5 rounded-full border border-[#15BA5C] cursor-pointer font-medium text-[15px] transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-[#15BA5C] text-white shadow-sm"
                  : " text-[#15BA5C] hover:bg-[#15BA5C]/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
          {activeTab === "order" ? (
            <PreOrderList searchTerm={searchTerm} refreshToken={refreshToken} />
          ) : (
            <PreOrderQuoteList
              searchTerm={searchTerm}
              refreshToken={refreshToken}
            />
          )}
        </div>
      </div>

      <CreatePreOrder
        isOpen={isCreatePreOrderOpen}
        onClose={() => setIsCreatePreOrderOpen(false)}
        defaultOrderType={createPreOrderDefaultType}
        onCreated={() => setRefreshToken((v) => v + 1)}
      />
    </div>
  );
};

export default PreOrder;
