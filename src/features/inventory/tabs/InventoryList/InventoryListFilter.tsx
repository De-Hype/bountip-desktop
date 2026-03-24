"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Dropdown } from "@/shared/AppDropdowns/CreateDropdown";

export interface InventoryFilterState {
  category: string;
  minStockLevel: string;
  maxStockLevel: string;
  reOrderLevel: string;
  actionBy: string;
  lastUpdate: Date | undefined;
  itemCode: string;
}

interface InventoryListFilterProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: InventoryFilterState) => void;
  onReset: () => void;
  initialFilters: InventoryFilterState;
  categories: { value: string; label: string }[];
  users: { value: string; label: string }[];
}

const InventoryListFilter = ({
  isOpen,
  onClose,
  onApply,
  onReset,
  initialFilters,
  categories,
  users,
}: InventoryListFilterProps) => {
  const [localFilters, setLocalFilters] =
    useState<InventoryFilterState>(initialFilters);

  useEffect(() => {
    if (!isOpen) return;
    setLocalFilters(initialFilters);
  }, [isOpen, initialFilters]);

  if (!isOpen) return null;

  const handleResetField = (
    field: keyof InventoryFilterState,
    defaultValue: any,
  ) => {
    setLocalFilters((prev) => ({ ...prev, [field]: defaultValue }));
  };

  const handleFilterChange = (
    field: keyof InventoryFilterState,
    value: any,
  ) => {
    setLocalFilters((prev) => ({ ...prev, [field]: value }));
  };

  const isFieldModified = (
    field: keyof InventoryFilterState,
    defaultValue: any,
  ) => {
    if (field === "lastUpdate") return localFilters[field] !== undefined;
    return localFilters[field] !== defaultValue;
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleGlobalReset = () => {
    onReset();
    onClose();
  };

  const resetColor = (modified: boolean) =>
    modified
      ? "text-[#15BA5C]"
      : "text-[#D1D5DB] cursor-pointer hover:text-[#15BA5C]";

  return (
    <div className="fixed inset-0 z-150 flex justify-end bg-black/20 backdrop-blur-sm transition-all duration-300">
      <div className="h-full w-full max-w-[450px] bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F3F4F6]">
          <h2 className="text-xl font-bold text-[#1C1B20]">Filters</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full cursor-pointer p-2 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-[#737373]" />
          </button>
        </div>

        {/* Filter Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 custom-scrollbar">
          {/* Category */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#1C1B20]">
                Category
              </label>
              <button
                type="button"
                onClick={() => handleResetField("category", "All")}
                className={`text-sm font-medium transition-colors ${resetColor(isFieldModified("category", "All"))}`}
              >
                Reset
              </button>
            </div>
            <Dropdown
              mode="select"
              options={[
                { value: "All", label: "Select Category" },
                ...categories,
              ]}
              selectedValue={localFilters.category}
              onChange={(val) => handleFilterChange("category", val)}
              className="w-full"
            />
          </div>

          {/* Min Stock Level */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#1C1B20]">
                Min Stock Level
              </label>
              <button
                type="button"
                onClick={() => handleResetField("minStockLevel", "")}
                className={`text-sm font-medium transition-colors ${resetColor(isFieldModified("minStockLevel", ""))}`}
              >
                Reset
              </button>
            </div>
            <input
              type="number"
              placeholder="Enter Min Stock"
              value={localFilters.minStockLevel}
              onChange={(e) =>
                handleFilterChange("minStockLevel", e.target.value)
              }
              className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#15BA5C] transition-all text-sm"
            />
          </div>

          {/* Max Stock Level */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#1C1B20]">
                Max Stock Level
              </label>
              <button
                type="button"
                onClick={() => handleResetField("maxStockLevel", "")}
                className={`text-sm font-medium transition-colors ${resetColor(isFieldModified("maxStockLevel", ""))}`}
              >
                Reset
              </button>
            </div>
            <input
              type="number"
              placeholder="Enter Max Stock"
              value={localFilters.maxStockLevel}
              onChange={(e) =>
                handleFilterChange("maxStockLevel", e.target.value)
              }
              className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#15BA5C] transition-all text-sm"
            />
          </div>

          {/* Re-Order Level */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#1C1B20]">
                Re-Order Level
              </label>
              <button
                type="button"
                onClick={() => handleResetField("reOrderLevel", "")}
                className={`text-sm font-medium transition-colors ${resetColor(isFieldModified("reOrderLevel", ""))}`}
              >
                Reset
              </button>
            </div>
            <input
              type="number"
              placeholder="Enter Re-Order Level"
              value={localFilters.reOrderLevel}
              onChange={(e) =>
                handleFilterChange("reOrderLevel", e.target.value)
              }
              className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#15BA5C] transition-all text-sm"
            />
          </div>

          {/* Action taken by */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#1C1B20]">
                Action taken by
              </label>
              <button
                type="button"
                onClick={() => handleResetField("actionBy", "All")}
                className={`text-sm font-medium transition-colors ${resetColor(isFieldModified("actionBy", "All"))}`}
              >
                Reset
              </button>
            </div>
            <Dropdown
              mode="select"
              options={[{ value: "All", label: "Select User" }, ...users]}
              selectedValue={localFilters.actionBy}
              onChange={(val) => handleFilterChange("actionBy", val)}
              className="w-full"
            />
          </div>

          {/* Last Update */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#1C1B20]">
                Last Update
              </label>
              <button
                type="button"
                onClick={() => handleResetField("lastUpdate", undefined)}
                className={`text-sm font-medium transition-colors ${resetColor(isFieldModified("lastUpdate", undefined))}`}
              >
                Reset
              </button>
            </div>
            <DatePicker
              date={localFilters.lastUpdate}
              onDateChange={(date) => handleFilterChange("lastUpdate", date)}
              className="w-full h-12 border-[#E5E7EB] rounded-xl justify-between flex-row-reverse"
              popoverClassName="z-[160]"
              placeholder="Choose a date"
            />
          </div>

          {/* Item Code */}
          <div className="space-y-2 pb-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#1C1B20]">
                Item Code
              </label>
              <button
                type="button"
                onClick={() => handleResetField("itemCode", "")}
                className={`text-sm font-medium transition-colors ${resetColor(isFieldModified("itemCode", ""))}`}
              >
                Reset
              </button>
            </div>
            <input
              type="text"
              placeholder="Enter Item Code"
              value={localFilters.itemCode}
              onChange={(e) => handleFilterChange("itemCode", e.target.value)}
              className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#15BA5C] transition-all text-sm"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#F3F4F6] space-y-4">
          <button
            type="button"
            onClick={handleGlobalReset}
            className="w-full py-4 rounded-xl border border-[#15BA5C] text-[#15BA5C] text-sm font-bold hover:bg-green-50 transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="w-full py-4 rounded-xl bg-[#15BA5C] text-white text-sm font-bold hover:bg-[#119E4D] transition-colors cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryListFilter;
