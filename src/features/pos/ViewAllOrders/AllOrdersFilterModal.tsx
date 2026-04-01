"use client";

import React, { useMemo, useState } from "react";
import { X } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Dropdown } from "@/shared/AppDropdowns/CreateDropdown";
import {
  OnlineOrderStatus,
  OrderChannel,
  OrderStatus,
} from "../../../../electron/types/order.types";

export type AllOrdersFilterState = {
  createDate?: Date;
  dueDate?: Date;
  paymentStatus: "All" | "Paid" | "Unpaid";
  orderStatus: string;
  channel: string;
  orderMode: string;
};

type AllOrdersFilterModalProps = {
  isOpen: boolean;
  value: AllOrdersFilterState;
  onClose: () => void;
  onApply: (value: AllOrdersFilterState) => void;
};

const AllOrdersFilterModal = ({
  isOpen,
  value,
  onClose,
  onApply,
}: AllOrdersFilterModalProps) => {
  const [filters, setFilters] = useState<AllOrdersFilterState>(value);

  const statusOptions = useMemo(() => {
    const unique = new Set<string>([
      "All",
      ...Object.values(OrderStatus),
      ...Object.values(OnlineOrderStatus),
    ]);
    return Array.from(unique).map((s) => ({ value: s, label: s }));
  }, []);

  const paymentStatusOptions = useMemo(
    () => [
      { value: "All", label: "All" },
      { value: "Paid", label: "Paid" },
      { value: "Unpaid", label: "Unpaid" },
    ],
    [],
  );

  const channelOptions = useMemo(() => {
    const unique = new Set<string>([
      "All",
      "Preorder",
      ...Object.values(OrderChannel),
    ]);
    return Array.from(unique).map((s) => ({ value: s, label: s }));
  }, []);

  const modeOptions = useMemo(
    () => [
      { value: "All", label: "All" },
      { value: "Online", label: "Online" },
      { value: "Preorder", label: "Preorder" },
      { value: "In-store", label: "In-store" },
    ],
    [],
  );

  if (!isOpen) return null;

  const handleResetField = (
    field: keyof AllOrdersFilterState,
    defaultValue: any,
  ) => {
    setFilters((prev) => ({ ...prev, [field]: defaultValue }));
  };

  const handleClearAll = () => {
    setFilters({
      paymentStatus: "All",
      orderStatus: "All",
      channel: "All",
      orderMode: "All",
      createDate: undefined,
      dueDate: undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-[520px] rounded-[24px] bg-white shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <h2 className="text-[22px] font-bold text-[#1C1B20]">Filters</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-6 h-6 text-[#737373]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#1C1B20]">
                Create date
              </label>
              <button
                type="button"
                onClick={() => handleResetField("createDate", undefined)}
                className={`text-sm font-medium hover:text-[#15BA5C] transition-colors ${
                  filters.createDate ? "text-[#15BA5C]" : "text-[#D1D5DB]"
                }`}
              >
                Reset
              </button>
            </div>
            <DatePicker
              date={filters.createDate}
              onDateChange={(d) => setFilters((p) => ({ ...p, createDate: d }))}
              className="w-full h-12 border-[#E5E7EB] rounded-xl justify-between flex-row-reverse"
              popoverClassName="z-[2100]"
              placeholder=""
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#1C1B20]">
                Due date
              </label>
              <button
                type="button"
                onClick={() => handleResetField("dueDate", undefined)}
                className={`text-sm font-medium hover:text-[#15BA5C] transition-colors ${
                  filters.dueDate ? "text-[#15BA5C]" : "text-[#D1D5DB]"
                }`}
              >
                Reset
              </button>
            </div>
            <DatePicker
              date={filters.dueDate}
              onDateChange={(d) => setFilters((p) => ({ ...p, dueDate: d }))}
              className="w-full h-12 border-[#E5E7EB] rounded-xl justify-between flex-row-reverse"
              popoverClassName="z-[2100]"
              placeholder=""
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#1C1B20]">
                Payment Status
              </label>
              <button
                type="button"
                onClick={() => handleResetField("paymentStatus", "All")}
                className={`text-sm font-medium hover:text-[#15BA5C] transition-colors ${
                  filters.paymentStatus !== "All"
                    ? "text-[#15BA5C]"
                    : "text-[#D1D5DB]"
                }`}
              >
                Reset
              </button>
            </div>
            <Dropdown
              mode="select"
              options={paymentStatusOptions}
              selectedValue={filters.paymentStatus}
              onChange={(v) =>
                setFilters((p) => ({ ...p, paymentStatus: v as any }))
              }
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#1C1B20]">
                Order Status
              </label>
              <button
                type="button"
                onClick={() => handleResetField("orderStatus", "All")}
                className={`text-sm font-medium hover:text-[#15BA5C] transition-colors ${
                  filters.orderStatus !== "All"
                    ? "text-[#15BA5C]"
                    : "text-[#D1D5DB]"
                }`}
              >
                Reset
              </button>
            </div>
            <Dropdown
              mode="select"
              options={statusOptions}
              selectedValue={filters.orderStatus}
              onChange={(v) => setFilters((p) => ({ ...p, orderStatus: v }))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#1C1B20]">
                Order Mode
              </label>
              <button
                type="button"
                onClick={() => handleResetField("orderMode", "All")}
                className={`text-sm font-medium hover:text-[#15BA5C] transition-colors ${
                  filters.orderMode !== "All"
                    ? "text-[#15BA5C]"
                    : "text-[#D1D5DB]"
                }`}
              >
                Reset
              </button>
            </div>
            <Dropdown
              mode="select"
              options={modeOptions}
              selectedValue={filters.orderMode}
              onChange={(v) => setFilters((p) => ({ ...p, orderMode: v }))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#1C1B20]">
                Channel
              </label>
              <button
                type="button"
                onClick={() => handleResetField("channel", "All")}
                className={`text-sm font-medium hover:text-[#15BA5C] transition-colors ${
                  filters.channel !== "All"
                    ? "text-[#15BA5C]"
                    : "text-[#D1D5DB]"
                }`}
              >
                Reset
              </button>
            </div>
            <Dropdown
              mode="select"
              options={channelOptions}
              selectedValue={filters.channel}
              onChange={(v) => setFilters((p) => ({ ...p, channel: v }))}
              className="w-full"
            />
          </div>
        </div>

        <div className="p-8 border-t border-gray-100 space-y-4">
          <button
            type="button"
            onClick={handleClearAll}
            className="w-full h-14 rounded-full border border-[#15BA5C] text-[#15BA5C] text-base font-bold hover:bg-green-50 transition-colors cursor-pointer"
          >
            Clear All Filters
          </button>
          <button
            type="button"
            onClick={() => onApply(filters)}
            className="w-full h-14 rounded-full bg-[#15BA5C] text-white text-base font-bold hover:bg-[#119E4D] transition-colors cursor-pointer"
          >
            See Results
          </button>
        </div>
      </div>
    </div>
  );
};

export default AllOrdersFilterModal;
