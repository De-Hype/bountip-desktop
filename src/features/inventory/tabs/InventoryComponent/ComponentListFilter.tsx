"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Dropdown } from "@/shared/AppDropdowns/CreateDropdown";

export interface ComponentFilterState {
  status: string;
  size: string;
  actionBy: string;
  lastUpdate: Date | undefined;
  componentCode: string;
}

interface ComponentListFilterProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: ComponentFilterState) => void;
  onReset: () => void;
  initialFilters: ComponentFilterState;
  statuses: { value: string; label: string }[];
  sizes: { value: string; label: string }[];
  users: { value: string; label: string }[];
}

const ComponentListFilter = ({
  isOpen,
  onClose,
  onApply,
  onReset,
  initialFilters,
  statuses,
  sizes,
  users,
}: ComponentListFilterProps) => {
  const [localFilters, setLocalFilters] =
    useState<ComponentFilterState>(initialFilters);

  useEffect(() => {
    if (!isOpen) return;
    setLocalFilters(initialFilters);
  }, [isOpen, initialFilters]);

  if (!isOpen) return null;

  const handleResetField = (field: keyof ComponentFilterState, value: any) => {
    setLocalFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleFilterChange = (field: keyof ComponentFilterState, value: any) => {
    setLocalFilters((prev) => ({ ...prev, [field]: value }));
  };

  const isFieldModified = (field: keyof ComponentFilterState, defaultValue: any) => {
    if (field === "lastUpdate") return localFilters[field] !== undefined;
    return localFilters[field] !== defaultValue;
  };

  const resetColor = (modified: boolean) =>
    modified ? "text-[#15BA5C]" : "text-[#D1D5DB] hover:text-[#15BA5C]";

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleGlobalReset = () => {
    onReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-150 flex justify-end bg-black/20 backdrop-blur-sm transition-all duration-300">
      <div className="h-full w-full max-w-[450px] bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
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

        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 custom-scrollbar">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#1C1B20]">
                Status
              </label>
              <button
                type="button"
                onClick={() => handleResetField("status", "All")}
                className={`text-sm font-medium transition-colors ${resetColor(isFieldModified("status", "All"))}`}
              >
                Reset
              </button>
            </div>
            <Dropdown
              mode="select"
              options={[{ value: "All", label: "Select Status" }, ...statuses]}
              selectedValue={localFilters.status}
              onChange={(val) => handleFilterChange("status", val)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#1C1B20]">Size</label>
              <button
                type="button"
                onClick={() => handleResetField("size", "All")}
                className={`text-sm font-medium transition-colors ${resetColor(isFieldModified("size", "All"))}`}
              >
                Reset
              </button>
            </div>
            <Dropdown
              mode="select"
              options={[{ value: "All", label: "Select Size" }, ...sizes]}
              selectedValue={localFilters.size}
              onChange={(val) => handleFilterChange("size", val)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#1C1B20]">
                Action Taken By
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
              popoverClassName="z-160"
              placeholder="Choose a date"
            />
          </div>

          <div className="space-y-2 pb-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#1C1B20]">
                Component Code
              </label>
              <button
                type="button"
                onClick={() => handleResetField("componentCode", "")}
                className={`text-sm font-medium transition-colors ${resetColor(isFieldModified("componentCode", ""))}`}
              >
                Reset
              </button>
            </div>
            <input
              type="text"
              placeholder="Enter Component Code"
              value={localFilters.componentCode}
              onChange={(e) =>
                handleFilterChange("componentCode", e.target.value)
              }
              className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#15BA5C] transition-all text-sm"
            />
          </div>
        </div>

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

export default ComponentListFilter;

