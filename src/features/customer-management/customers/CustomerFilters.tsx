import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import useCustomerStore from "@/stores/useCustomerStore";
import useBusinessStore from "@/stores/useBusinessStore";
import { DatePicker } from "@/components/ui/date-picker";
import { Dropdown } from "@/shared/AppDropdowns/CreateDropdown";

interface CustomerFiltersProps {
  isOpen: boolean;
  onClose: () => void;
}

const CustomerFilters = ({ isOpen, onClose }: CustomerFiltersProps) => {
  const { filters, applyFilters, resetFilters } = useCustomerStore();
  const selectedOutlet = useBusinessStore((state) => state.selectedOutlet);

  // Local state to store pending filters
  const [localFilters, setLocalFilters] = useState(filters);
  const [paymentTerms, setPaymentTerms] = useState<
    { value: string; label: string }[]
  >([]);

  // Fetch payment terms from the database
  useEffect(() => {
    const fetchPaymentTerms = async () => {
      try {
        const api = (window as any).electronAPI;
        if (api && api.dbQuery && selectedOutlet?.id) {
          const result = await api.dbQuery(
            "SELECT id, name FROM payment_terms WHERE outletId = ? ORDER BY name ASC",
            [selectedOutlet.id],
          );
          if (result && Array.isArray(result)) {
            const options = result.map((term: any) => ({
              value: term.name, // Use name for filtering as per useCustomerStore logic
              label: term.name,
            }));
            setPaymentTerms([
              { value: "All", label: "Select Payment Terms" },
              ...options,
            ]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch payment terms:", error);
      }
    };

    if (isOpen) {
      fetchPaymentTerms();
    }
  }, [isOpen, selectedOutlet?.id]);

  // Sync local filters with store filters when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  if (!isOpen) return null;

  const handleApply = () => {
    applyFilters(localFilters);
    onClose();
  };

  const handleClearAll = () => {
    resetFilters();
    onClose();
  };

  const handleResetField = (field: string, defaultValue: any) => {
    setLocalFilters((prev) => ({ ...prev, [field]: defaultValue }));
  };

  const handleFilterChange = (field: string, value: any) => {
    setLocalFilters((prev) => ({ ...prev, [field]: value }));
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
              date={localFilters.date}
              onDateChange={(date) => handleFilterChange("date", date)}
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
            <Dropdown
              mode="select"
              options={[
                { value: "All", label: "Select Type" },
                { value: "Individual", label: "Individual" },
                { value: "Organization", label: "Organization" },
              ]}
              selectedValue={localFilters.type}
              onChange={(value) => handleFilterChange("type", value)}
              className="w-full"
            />
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
            <Dropdown
              mode="select"
              options={
                paymentTerms.length > 0
                  ? paymentTerms
                  : [{ value: "All", label: "Select Payment Terms" }]
              }
              selectedValue={localFilters.paymentTerm}
              onChange={(value) => handleFilterChange("paymentTerm", value)}
              className="w-full"
            />
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
            <Dropdown
              mode="select"
              options={[
                { value: "All", label: "Select Status" },
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
              ]}
              selectedValue={localFilters.status}
              onChange={(value) => handleFilterChange("status", value)}
              className="w-full"
            />
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
