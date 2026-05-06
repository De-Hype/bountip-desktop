import { X } from "lucide-react";

export type InventoryMovementFilter =
  | "all"
  | "received"
  | "used"
  | "expired"
  | "transferred";

export type InventorySortBy =
  | "name_asc"
  | "name_desc"
  | "closing_qty_desc"
  | "received_qty_desc";

export type InventoryReportFilters = {
  movement: InventoryMovementFilter;
  activityOnly: boolean;
  sortBy: InventorySortBy;
};

type InventoryReportFilterProps = {
  isOpen: boolean;
  onClose: () => void;
  value: InventoryReportFilters;
  onChange: (next: InventoryReportFilters) => void;
};

const InventoryReportFilter = ({
  isOpen,
  onClose,
  value,
  onChange,
}: InventoryReportFilterProps) => {
  if (!isOpen) return null;

  const setMovement = (movement: InventoryMovementFilter) =>
    onChange({ ...value, movement });

  const setSortBy = (sortBy: InventorySortBy) => onChange({ ...value, sortBy });

  const toggleActivityOnly = () =>
    onChange({ ...value, activityOnly: !value.activityOnly });

  const reset = () =>
    onChange({
      movement: "all",
      activityOnly: false,
      sortBy: "name_asc",
    });

  const MovementButton = ({
    movement,
    label,
  }: {
    movement: InventoryMovementFilter;
    label: string;
  }) => {
    const active = value.movement === movement;
    return (
      <button
        type="button"
        onClick={() => setMovement(movement)}
        className={`h-10 px-4 rounded-[10px] text-[14px] font-medium border cursor-pointer transition-colors ${
          active
            ? "bg-[#15BA5C] text-white border-[#15BA5C]"
            : "bg-white text-[#111827] border-[#E5E7EB] hover:bg-[#F9FAFB]"
        }`}
      >
        {label}
      </button>
    );
  };

  const SortButton = ({
    sortBy,
    label,
  }: {
    sortBy: InventorySortBy;
    label: string;
  }) => {
    const active = value.sortBy === sortBy;
    return (
      <button
        type="button"
        onClick={() => setSortBy(sortBy)}
        className={`h-10 px-4 rounded-[10px] text-[14px] font-medium border cursor-pointer transition-colors ${
          active
            ? "bg-[#15BA5C] text-white border-[#15BA5C]"
            : "bg-white text-[#111827] border-[#E5E7EB] hover:bg-[#F9FAFB]"
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/30 cursor-pointer"
      />

      <div className="relative w-full max-w-[560px] rounded-[14px] border border-[#E5E7EB] bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <div className="text-[16px] font-bold text-[#111827]">Filters</div>
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 rounded-[10px] border border-[#E5E7EB] bg-white flex items-center justify-center hover:bg-[#F9FAFB] cursor-pointer"
          >
            <X className="h-4 w-4 text-[#6B7280]" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <div className="space-y-3">
            <div className="text-[13px] font-semibold text-[#111827]">
              Sort By
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SortButton sortBy="name_asc" label="Name (A - Z)" />
              <SortButton sortBy="name_desc" label="Name (Z - A)" />
              <SortButton
                sortBy="closing_qty_desc"
                label="Closing Qty (High)"
              />
              <SortButton
                sortBy="received_qty_desc"
                label="Received Qty (High)"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-[13px] font-semibold text-[#111827]">
              Movement
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MovementButton movement="all" label="All" />
              <MovementButton movement="received" label="Received" />
              <MovementButton movement="used" label="Used" />
              <MovementButton movement="expired" label="Expired" />
              <MovementButton movement="transferred" label="Transferred" />
            </div>
          </div>

          <button
            type="button"
            onClick={toggleActivityOnly}
            className="w-full flex items-center justify-between rounded-[12px] border border-[#E5E7EB] px-4 py-3 cursor-pointer hover:bg-[#F9FAFB]"
          >
            <div className="text-[14px] font-medium text-[#111827]">
              Show only items with activity
            </div>
            <div
              className={`h-6 w-11 rounded-full transition-colors ${
                value.activityOnly ? "bg-[#15BA5C]" : "bg-[#E5E7EB]"
              }`}
            >
              <div
                className={`h-5 w-5 rounded-full bg-white mt-0.5 transition-transform ${
                  value.activityOnly ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </div>
          </button>
        </div>

        <div className="px-5 py-4 border-t border-[#E5E7EB] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={reset}
            className="h-10 px-4 rounded-[10px] border border-[#E5E7EB] bg-white text-[14px] font-medium text-[#111827] hover:bg-[#F9FAFB] cursor-pointer"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-[10px] bg-[#15BA5C] text-white text-[14px] font-semibold hover:bg-[#119E4D] cursor-pointer"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryReportFilter;
