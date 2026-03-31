"use client";

import * as Tabs from "@radix-ui/react-tabs";
import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import OnlineOrders from "@/features/pos/OnlineOrders";
import PreOrder from "@/features/pos/PreOrder";
import InStoreOrder from "@/features/pos/InstoreOrder";
import ViewAllOrders from "@/features/pos/ViewAllOrders";

const POSPage = () => {
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);
  const [lastTabValue, setLastTabValue] = useState<string>("online_orders");
  const viewAllValue = "__view_all__";
  const tabs = [
    {
      label: "Online Orders",
      value: "online_orders",
      component: <OnlineOrders />,
    },
    {
      label: "Pre Order",
      value: "pre_order",
      component: <PreOrder />,
    },
    {
      label: "In-store Order",
      value: "in_store_order",
      component: <InStoreOrder />,
    },
  ];

  return (
    <Tabs.Root
      defaultValue={tabs[0].value}
      value={isViewAllOpen ? viewAllValue : lastTabValue}
      onValueChange={(v) => {
        if (v === viewAllValue) return;
        setLastTabValue(v);
        setIsViewAllOpen(false);
      }}
      className="flex flex-col h-full bg-[#F9FAFB]"
    >
      {/* Tab Navigation Section */}
      <div className="bg-white mb-3">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Tabs List */}
            <Tabs.List className="flex items-center p-1.5 bg-[#F3F4F6] rounded-[16px]">
              {tabs.map((tab) => (
                <Tabs.Trigger
                  key={tab.value}
                  value={tab.value}
                  className="px-6  py-2.5 cursor-pointer text-[15px] font-medium transition-all duration-200 rounded-[12px] text-[#6B7280] hover:text-[#1C1B20] data-[state=active]:bg-white data-[state=active]:text-[#1C1B20] data-[state=active]:shadow-[0px_1px_2px_rgba(16,24,40,0.05)]"
                >
                  {tab.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            {/* View All Orders Button */}
            <button
              type="button"
              onClick={() => setIsViewAllOpen(true)}
              className="flex items-center gap-2 cursor-pointer bg-[#15BA5C] hover:bg-[#13A652] text-white px-6 py-3 rounded-[12px] transition-colors duration-200"
            >
              <span className="text-[15px] font-bold">View All Orders</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      <div className=""></div>

      {/* Tab Content Section */}
      <div className="flex-1 bg-white px-8 pt-3 pb-8 overflow-hidden">
        <div className="h-full overflow-auto">
          <Tabs.Content
            value={viewAllValue}
            className="h-full outline-none data-[state=inactive]:hidden"
          >
            <div className="h-full flex flex-col min-h-0">
              <div className="flex-1 min-h-0 overflow-hidden">
                <ViewAllOrders />
              </div>
            </div>
          </Tabs.Content>

          {tabs.map((tab) => (
            <Tabs.Content
              key={tab.value}
              value={tab.value}
              className="h-full outline-none data-[state=inactive]:hidden"
            >
              {tab.component}
            </Tabs.Content>
          ))}
        </div>
      </div>
    </Tabs.Root>
  );
};

export default POSPage;
