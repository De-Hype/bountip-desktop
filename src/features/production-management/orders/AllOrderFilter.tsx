import React, { useState } from "react";
import { X, Calendar as CalendarIcon } from "lucide-react";

import { DatePicker } from "@/components/ui/date-picker";
import { Dropdown } from "@/shared/AppDropdowns/CreateDropdown";
import {
  OrderChannel,
  OrderStatus,
} from "../../../../electron/types/order.types";

interface AllOrderFilterProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: OrderFilterState) => void;
}

export interface OrderFilterState {
  createDate?: Date;
  dueDate?: Date;
  paymentStatus: string;
  orderStatus: string;
  channel: string;
}

const AllOrderFilter = ({ isOpen, onClose, onApply }: AllOrderFilterProps) => {
  const [filters, setFilters] = useState<OrderFilterState>({
    paymentStatus: "Select Status",
    orderStatus: "To be produced",
    channel: "Select Channel",
  });

  if (!isOpen) return null;

  const handleResetField = (
    field: keyof OrderFilterState,
    defaultValue: any,
  ) => {
    setFilters((prev) => ({ ...prev, [field]: defaultValue }));
  };

  const handleFilterChange = (field: keyof OrderFilterState, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleClearAll = () => {
    setFilters({
      paymentStatus: "Select Status",
      orderStatus: "To be produced",
      channel: "Select Channel",
      createDate: undefined,
      dueDate: undefined,
    });
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const paymentStatusOptions = [
    { value: "Select Status", label: "Select Status" },
    { value: "Paid", label: "Paid" },
    { value: "Unpaid", label: "Unpaid" },
    { value: "Partially Paid", label: "Partially Paid" },
  ];

  const orderStatusOptions = [
    { value: "All", label: "All" },
    ...Object.values(OrderStatus).map((status) => ({
      value: status,
      label: status,
    })),
  ];

  const channelOptions = [
    { value: "Select Channel", label: "Select Channel" },
    ...Object.values(OrderChannel).map((channel) => ({
      value: channel,
      label: channel,
    })),
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-[500px] rounded-[24px] bg-white shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <h2 className="text-[22px] font-bold text-[#1C1B20]">Filters</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-6 h-6 text-[#737373]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {/* Create Date */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#1C1B20]">
                Create date
              </label>
              <button
                onClick={() => handleResetField("createDate", undefined)}
                className={`text-sm font-medium hover:text-[#15BA5C] transition-colors ${filters.createDate ? "text-[#15BA5C]" : "cursor-pointer text-[#D1D5DB]"}`}
              >
                Reset
              </button>
            </div>
            <div className="relative">
              <DatePicker
                date={filters.createDate}
                onDateChange={(date) => handleFilterChange("createDate", date)}
                className="w-full h-12 border-[#E5E7EB] rounded-xl justify-between flex-row-reverse"
                popoverClassName="z-[150]"
                placeholder=""
              />
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#1C1B20]">
                Due date
              </label>
              <button
                onClick={() => handleResetField("dueDate", undefined)}
                className={`text-sm font-medium  hover:text-[#15BA5C] transition-colors ${filters.dueDate ? "text-[#15BA5C]" : "cursor-pointer text-[#D1D5DB]"}`}
              >
                Reset
              </button>
            </div>
            <div className="relative">
              <DatePicker
                date={filters.dueDate}
                onDateChange={(date) => handleFilterChange("dueDate", date)}
                className="w-full h-12 border-[#E5E7EB] rounded-xl justify-between flex-row-reverse"
                popoverClassName="z-[150]"
                placeholder=""
              />
            </div>
          </div>

          {/* Payment Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#1C1B20]">
                Payment Status
              </label>
              <button
                onClick={() =>
                  handleResetField("paymentStatus", "Select Status")
                }
                className={`text-sm font-medium hover:text-[#15BA5C] transition-colors ${filters.paymentStatus !== "Select Status" ? "text-[#15BA5C]" : "cursor-pointer text-[#D1D5DB]"}`}
              >
                Reset
              </button>
            </div>
            <Dropdown
              mode="select"
              options={paymentStatusOptions}
              selectedValue={filters.paymentStatus}
              onChange={(value) => handleFilterChange("paymentStatus", value)}
              className="w-full"
            />
          </div>

          {/* Order Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#1C1B20]">
                Order Status
              </label>
              <button
                onClick={() =>
                  handleResetField("orderStatus", "To be produced")
                }
                className={`text-sm font-medium hover:text-[#15BA5C] transition-colors ${filters.orderStatus !== "To be produced" ? "text-[#15BA5C]" : "cursor-pointer text-[#D1D5DB]"}`}
              >
                Reset
              </button>
            </div>
            <Dropdown
              mode="select"
              options={orderStatusOptions}
              selectedValue={filters.orderStatus}
              onChange={(value) => handleFilterChange("orderStatus", value)}
              className="w-full"
            />
          </div>

          {/* Channel */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#1C1B20]">
                Channel
              </label>
              <button
                onClick={() => handleResetField("channel", "Select Channel")}
                className={`text-sm font-medium hover:text-[#15BA5C] transition-colors ${filters.channel !== "Select Channel" ? "text-[#15BA5C]" : "cursor-pointer text-[#D1D5DB]"}`}
              >
                Reset
              </button>
            </div>
            <Dropdown
              mode="select"
              options={channelOptions}
              selectedValue={filters.channel}
              onChange={(value) => handleFilterChange("channel", value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-gray-100 space-y-4">
          <button
            onClick={handleClearAll}
            className="w-full h-14 rounded-full border border-[#15BA5C] text-[#15BA5C] text-base font-bold hover:bg-green-50 transition-colors cursor-pointer"
          >
            Clear All Filters
          </button>
          <button
            onClick={handleApply}
            className="w-full h-14 rounded-full bg-[#15BA5C] text-white text-base font-bold hover:bg-[#119E4D] transition-colors cursor-pointer"
          >
            See Results
          </button>
        </div>
      </div>
    </div>
  );
};

export default AllOrderFilter;
