"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Dropdown } from "@/shared/AppDropdowns/CreateDropdown";

export interface SupplierFilterState {
  supplierName: string;
  representatives: string;
  phoneNumber: string;
  emailAddress: string;
}

type Option = { value: string; label: string };

interface SupplierListFilterProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: SupplierFilterState) => void;
  onReset: () => void;
  initialFilters: SupplierFilterState;
  supplierOptions: Option[];
  representativeOptions: Option[];
  phoneOptions: Option[];
  emailOptions: Option[];
}

const SupplierListFilter = ({
  isOpen,
  onClose,
  onApply,
  onReset,
  initialFilters,
  supplierOptions,
  representativeOptions,
  phoneOptions,
  emailOptions,
}: SupplierListFilterProps) => {
  const [localFilters, setLocalFilters] =
    useState<SupplierFilterState>(initialFilters);

  useEffect(() => {
    if (!isOpen) return;
    setLocalFilters(initialFilters);
  }, [isOpen, initialFilters]);

  if (!isOpen) return null;

  const handleResetField = (field: keyof SupplierFilterState, value: string) => {
    setLocalFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleFilterChange = (field: keyof SupplierFilterState, value: string) => {
    setLocalFilters((prev) => ({ ...prev, [field]: value }));
  };

  const isFieldModified = (
    field: keyof SupplierFilterState,
    defaultValue: string,
  ) => localFilters[field] !== defaultValue;

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
                Supplier Name
              </label>
              <button
                type="button"
                onClick={() => handleResetField("supplierName", "All")}
                className={`text-sm font-medium transition-colors ${resetColor(
                  isFieldModified("supplierName", "All"),
                )}`}
              >
                Reset
              </button>
            </div>
            <Dropdown
              mode="select"
              options={[{ value: "All", label: "All" }, ...supplierOptions]}
              selectedValue={localFilters.supplierName}
              onChange={(val) => handleFilterChange("supplierName", val)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#1C1B20]">
                Representative(s)
              </label>
              <button
                type="button"
                onClick={() => handleResetField("representatives", "All")}
                className={`text-sm font-medium transition-colors ${resetColor(
                  isFieldModified("representatives", "All"),
                )}`}
              >
                Reset
              </button>
            </div>
            <Dropdown
              mode="select"
              options={[{ value: "All", label: "All" }, ...representativeOptions]}
              selectedValue={localFilters.representatives}
              onChange={(val) => handleFilterChange("representatives", val)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#1C1B20]">
                Phone Number
              </label>
              <button
                type="button"
                onClick={() => handleResetField("phoneNumber", "All")}
                className={`text-sm font-medium transition-colors ${resetColor(
                  isFieldModified("phoneNumber", "All"),
                )}`}
              >
                Reset
              </button>
            </div>
            <Dropdown
              mode="select"
              options={[{ value: "All", label: "All" }, ...phoneOptions]}
              selectedValue={localFilters.phoneNumber}
              onChange={(val) => handleFilterChange("phoneNumber", val)}
              className="w-full"
            />
          </div>

          <div className="space-y-2 pb-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#1C1B20]">
                Email Address
              </label>
              <button
                type="button"
                onClick={() => handleResetField("emailAddress", "All")}
                className={`text-sm font-medium transition-colors ${resetColor(
                  isFieldModified("emailAddress", "All"),
                )}`}
              >
                Reset
              </button>
            </div>
            <Dropdown
              mode="select"
              options={[{ value: "All", label: "All" }, ...emailOptions]}
              selectedValue={localFilters.emailAddress}
              onChange={(val) => handleFilterChange("emailAddress", val)}
              className="w-full"
            />
          </div>
        </div>

        <div className="p-6 border-t border-[#F3F4F6] space-y-4">
          <button
            type="button"
            onClick={handleGlobalReset}
            className="w-full py-4 rounded-xl border border-[#15BA5C] text-[#15BA5C] text-sm font-bold hover:bg-green-50 transition-colors cursor-pointer"
          >
            Clear All Filters
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

export default SupplierListFilter;

