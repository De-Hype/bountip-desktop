import React from "react";
import { X, ChevronDown } from "lucide-react";
import useCustomerStore from "@/stores/useCustomerStore";
import { DatePicker } from "@/components/ui/date-picker";

interface CustomerFiltersProps {
  isOpen: boolean;
  onClose: () => void;
}

const CustomerFilters = ({ isOpen, onClose }: CustomerFiltersProps) => {
  const { filters, setFilter, resetFilters } = useCustomerStore();

  if (!isOpen) return null;

  const handleApply = () => {
    onClose();
  };

  const handleClearAll = () => {
    resetFilters();
    onClose();
  };

  const handleResetField = (field: string, defaultValue: any) => {
    setFilter(field, defaultValue);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm">
      <div className="h-full w-[450px] bg-white shadow-xl animate-in slide-in-from-right duration-300 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F3F4F6]">
          <h2 className="text-xl font-bold text-[#1C1B20]">Filters</h2>
          <button
            onClick={onClose}
            className="rounded-full cursor-pointer p-2 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-[#737373]" />
          </button>
        </div>

        {/* Filter Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
          {/* Date Filter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#1C1B20]">
                Date
              </label>
              <button
                onClick={() => handleResetField("date", undefined)}
                className="text-sm font-medium text-[#15BA5C] hover:underline"
              >
                Reset
              </button>
            </div>
            <DatePicker
              date={filters.date}
              onDateChange={(date) => setFilter("date", date)}
              className="w-full justify-between border-[#E5E7EB] h-12"
            />
          </div>

          {/* Customer Type Filter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#1C1B20]">
                Customer Type
              </label>
              <button
                onClick={() => handleResetField("type", "All")}
                className="text-sm font-medium text-[#15BA5C] hover:underline"
              >
                Reset
              </button>
            </div>
            <div className="relative">
              <select
                value={filters.type}
                onChange={(e) => setFilter("type", e.target.value)}
                className="w-full appearance-none rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#737373] outline-none focus:border-[#15BA5C] focus:ring-1 focus:ring-[#15BA5C]"
              >
                <option value="All">Select Type</option>
                <option value="Individual">Individual</option>
                <option value="Organization">Organization</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#737373] pointer-events-none" />
            </div>
          </div>

          {/* Payment Term Filter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#1C1B20]">
                Payment Term
              </label>
              <button
                onClick={() => handleResetField("paymentTerm", "All")}
                className="text-sm font-medium text-[#15BA5C] hover:underline"
              >
                Reset
              </button>
            </div>
            <div className="relative">
              <select
                value={filters.paymentTerm}
                onChange={(e) => setFilter("paymentTerm", e.target.value)}
                className="w-full appearance-none rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#737373] outline-none focus:border-[#15BA5C] focus:ring-1 focus:ring-[#15BA5C]"
              >
                <option value="All">Select Payment Terms</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 60">Net 60</option>
                <option value="Due on Receipt">Due on Receipt</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#737373] pointer-events-none" />
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#1C1B20]">
                Status
              </label>
              <button
                onClick={() => handleResetField("status", "All")}
                className="text-sm font-medium text-[#15BA5C] hover:underline"
              >
                Reset
              </button>
            </div>
            <div className="relative">
              <select
                value={filters.status}
                onChange={(e) => setFilter("status", e.target.value)}
                className="w-full appearance-none rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#737373] outline-none focus:border-[#15BA5C] focus:ring-1 focus:ring-[#15BA5C]"
              >
                <option value="All">Select Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#737373] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#F3F4F6] space-y-4">
          <button
            onClick={handleClearAll}
            className="w-full py-3.5 rounded-xl border border-[#15BA5C] text-[#15BA5C] text-sm font-semibold hover:bg-green-50 transition-colors cursor-pointer"
          >
            Clear All Filters
          </button>
          <button
            onClick={handleApply}
            className="w-full py-3.5 rounded-xl bg-[#15BA5C] text-white text-sm font-semibold hover:bg-[#119E4D] transition-colors cursor-pointer"
          >
            See Results
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerFilters;
