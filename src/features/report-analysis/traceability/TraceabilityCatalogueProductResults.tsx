import { Pagination } from "@/shared/Pagination/pagination";
import ProductAssets from "@/assets/images/products";
import TraceabilityEmptyState from "./TraceabilityEmptyState";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Clock,
  Package,
  PackageOpen,
  Soup,
  User,
} from "lucide-react";
import type { ReactNode } from "react";

export type ProductStatus =
  | "in_production"
  | "quality_control"
  | "ready"
  | "scheduled_for_production";

export type CatalogueProduct = {
  id: string;
  productId: string | null;
  name: string;
  productCode: string;
  batchCode: string;
  category: string;
  logoUrl: string | null;
  producedOnValue: string;
  dueOnValue: string;
  createdByValue: string;
  ingredientsCount: number;
  unitsCreated: number;
  unitsRemaining: number;
  status: ProductStatus;
};

export type BatchOption = { id: string; label: string };

export type ProductionDetailRow = {
  productionId: string;
  batchId: string | null;
  status: string | null;
  productionDate: string | null;
  productionTime: string | null;
  createdAt: string | null;
  preparationStartedAt: string | null;
  qcStartedAt: string | null;
  readyAt: string | null;
  initiator: string | null;
  productionStartedBy: string | null;
  productId: string | null;
  productName: string | null;
  productCode: string | null;
  logoUrl: string | null;
  category: string | null;
  totalRequestedQuantity: number | null;
  totalFinalQuantity: number | null;
  totalUnitsRemaining: number | null;
};

export type TimelineItem = {
  title: string;
  subtitle: string;
  timeLabel: string;
};

export type TraceTab = "timeline" | "ingredients" | "customers";

const statusMeta: Record<
  ProductStatus,
  { label: string; pillClassName: string; dotClassName: string }
> = {
  in_production: {
    label: "In Production",
    pillClassName:
      "bg-[#FFF7ED] text-[#F97316] ring-1 ring-inset ring-[#FED7AA]",
    dotClassName: "bg-[#F97316]",
  },
  quality_control: {
    label: "Quality Control",
    pillClassName:
      "bg-[#F5F3FF] text-[#8B5CF6] ring-1 ring-inset ring-[#DDD6FE]",
    dotClassName: "bg-[#8B5CF6]",
  },
  ready: {
    label: "Ready",
    pillClassName:
      "bg-[#ECFDF5] text-[#16A34A] ring-1 ring-inset ring-[#BBF7D0]",
    dotClassName: "bg-[#16A34A]",
  },
  scheduled_for_production: {
    label: "Scheduled for Production",
    pillClassName:
      "bg-[#EFF6FF] text-[#2563EB] ring-1 ring-inset ring-[#BFDBFE]",
    dotClassName: "bg-[#2563EB]",
  },
};

export const ProductCard = ({
  product,
  isSelected,
  onClick,
}: {
  product: CatalogueProduct;
  isSelected?: boolean;
  onClick?: () => void;
}) => {
  const status = statusMeta[product.status];

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full text-left rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md",
        onClick ? "cursor-pointer" : "",
        isSelected ? "border-[#15BA5C] ring-1 ring-inset ring-[#15BA5C]/35" : "border-[#E5E7EB]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-[#F3F4F6] overflow-hidden">
            <img
              src={product.logoUrl || ProductAssets.Broken}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="min-w-0">
            <div className="truncate text-[14px] font-semibold text-[#111827]">
              {product.name}
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[12px] text-[#6B7280]">
              
              <span className="truncate">{product.batchCode}</span>
            </div>
          </div>
        </div>

        <div className="shrink-0 rounded-full bg-[#ECFDF5] px-3 py-1 text-[12px] font-medium text-[#16A34A] ring-1 ring-inset ring-[#BBF7D0]">
          {product.category}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-4 pb-4 text-[12px] text-[#6B7280]">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#9CA3AF]" />
          <span className="truncate">{product.producedOnValue}</span>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Package className="h-4 w-4 text-[#9CA3AF]" />
          <span className="truncate">
            {product.unitsCreated.toLocaleString()} units created
          </span>
        </div>

        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-[#9CA3AF]" />
          <span className="truncate">{product.createdByValue}</span>
        </div>

        <div className="flex items-center justify-end gap-2">
          <PackageOpen className="h-4 w-4 text-[#9CA3AF]" />
          <span className="truncate">
            {product.unitsRemaining.toLocaleString()} units remaining
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3  px-4 py-3">
        <div
          className={[
            "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-medium",
            status.pillClassName,
          ].join(" ")}
        >
          <Clock className={`h-4 w-4 text-[${status.dotClassName}]`} />
          <span>{status.label}</span>
        </div>

        <div className="flex items-center gap-2 text-[12px] text-[#6B7280]">
          <Soup className="h-4 w-4 text-[#9CA3AF]" />
          <span>
            {product.ingredientsCount} ingredient
            {product.ingredientsCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </button>
  );
};

type ResultsProps = {
  title: string;
  onBack: () => void;
  selectedProductionId: string | null;
  batchOptions: BatchOption[];
  onSelectProductionId: (id: string | null) => void;
  showEmptyState: boolean;
  cards: CatalogueProduct[];
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  creationDateTime: string;
  initiatedBy: string;
  totalUnitsCreated: string;
  totalUnitsRemaining: string;
  activeTab: TraceTab;
  onTabChange: (tab: TraceTab) => void;
  timeline: TimelineItem[];
  ingredients: ReactNode;
  customers: ReactNode;
};

export const TraceabilityCatalogueProductResults = ({
  title,
  onBack,
  selectedProductionId,
  batchOptions,
  onSelectProductionId,
  showEmptyState,
  cards,
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
  creationDateTime,
  initiatedBy,
  totalUnitsCreated,
  totalUnitsRemaining,
  activeTab,
  onTabChange,
  timeline,
  ingredients,
  customers,
}: ResultsProps) => {
  return (
    <>
      <div className="my-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="h-9 w-9 rounded-[10px] border border-[#E5E7EB] bg-white flex items-center justify-center hover:bg-[#F7F8FA] transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 text-[#374151]" />
          </button>
          <h2 className="text-[18px] font-semibold text-[#111827] sm:text-[20px]">
            {title}
          </h2>
        </div>

        <div className="relative w-full sm:w-[260px]">
          <select
            value={selectedProductionId || ""}
            onChange={(e) => onSelectProductionId(e.target.value || null)}
            className="w-full h-[40px] rounded-[10px] border border-[#E5E7EB] bg-white pl-3 pr-10 text-[14px] text-[#111827] outline-none focus:ring-2 focus:ring-[#15BA5C]"
          >
            <option value="" disabled>
              Select a batch
            </option>
            {batchOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-0 top-0 h-[40px] w-[44px] bg-[#15BA5C] rounded-r-[10px] flex items-center justify-center pointer-events-none">
            <ChevronDown className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>

      {showEmptyState ? (
        <TraceabilityEmptyState />
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="w-full lg:max-w-[420px] rounded-[14px] border border-[#E5E7EB] bg-white overflow-hidden">
            <div className="p-4 space-y-5">
              {cards.map((product) => (
                <div key={product.id}>
                  <div className="mb-2 text-[14px] font-semibold text-[#111827]">
                    {product.batchCode}
                  </div>
                  <ProductCard
                    product={product}
                    isSelected={product.id === selectedProductionId}
                    onClick={() => onSelectProductionId(product.id)}
                  />
                </div>
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={(nextItemsPerPage: number) => {
                onItemsPerPageChange(nextItemsPerPage);
                onPageChange(1);
              }}
              totalItems={totalItems}
            />
          </div>

          <div className="flex-1 space-y-4">
            <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <div className="text-[10px] font-medium uppercase text-[#9CA3AF]">
                    Creation date / time
                  </div>
                  <div className="mt-1 text-[14px] font-semibold text-[#111827]">
                    {creationDateTime}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-medium uppercase text-[#9CA3AF]">
                    Initiated by
                  </div>
                  <div className="mt-1 text-[14px] font-semibold text-[#111827]">
                    {initiatedBy}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-medium uppercase text-[#9CA3AF]">
                    Total units created
                  </div>
                  <div className="mt-1 text-[14px] font-semibold text-[#111827]">
                    {totalUnitsCreated}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-medium uppercase text-[#9CA3AF]">
                    Total units remaining
                  </div>
                  <div className="mt-1 text-[14px] font-semibold text-[#111827]">
                    {totalUnitsRemaining}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[14px] border border-[#E5E7EB] bg-white overflow-hidden">
              <div className="px-4 py-3 bg-[#F9FAFB] border-b border-[#F3F4F6]">
                <div className="grid grid-cols-3 gap-2 rounded-[10px] bg-white p-1 border border-[#E5E7EB]">
                  <button
                    type="button"
                    onClick={() => onTabChange("timeline")}
                    className={[
                      "h-9 rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer",
                      activeTab === "timeline"
                        ? "bg-[#15BA5C]/10 text-[#15BA5C]"
                        : "text-[#6B7280] hover:bg-[#F3F4F6]",
                    ].join(" ")}
                  >
                    Timeline
                  </button>
                  <button
                    type="button"
                    onClick={() => onTabChange("ingredients")}
                    className={[
                      "h-9 rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer",
                      activeTab === "ingredients"
                        ? "bg-[#15BA5C]/10 text-[#15BA5C]"
                        : "text-[#6B7280] hover:bg-[#F3F4F6]",
                    ].join(" ")}
                  >
                    Ingredients (Items)
                  </button>
                  <button
                    type="button"
                    onClick={() => onTabChange("customers")}
                    className={[
                      "h-9 rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer",
                      activeTab === "customers"
                        ? "bg-[#15BA5C]/10 text-[#15BA5C]"
                        : "text-[#6B7280] hover:bg-[#F3F4F6]",
                    ].join(" ")}
                  >
                    Customers
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-5">
                {activeTab === "timeline" ? (
                  <div className="relative">
                    <div className="absolute left-[10px] top-2 bottom-2 w-px bg-[#E5E7EB]" />
                    <div className="space-y-4">
                      {timeline.length === 0 ? (
                        <div className="text-[13px] text-[#6B7280]">
                          No timeline events found
                        </div>
                      ) : (
                        timeline.map((item, idx) => (
                          <div key={`${item.title}-${idx}`} className="flex gap-4">
                            <div className="relative">
                              <div className="mt-1 h-3 w-3 rounded-full bg-[#15BA5C]" />
                            </div>
                            <div className="flex-1 rounded-[12px] border border-[#E5E7EB] bg-white px-4 py-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-[14px] font-semibold text-[#111827]">
                                    {item.title}
                                  </div>
                                  <div className="mt-1 text-[12px] text-[#6B7280]">
                                    {item.subtitle}
                                  </div>
                                </div>
                                <div className="text-[12px] text-[#9CA3AF]">
                                  {item.timeLabel}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : activeTab === "ingredients" ? (
                  ingredients
                ) : (
                  customers
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

