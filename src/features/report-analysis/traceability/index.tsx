"use client";

import { RefreshCw, Search, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import TraceabilityCatalogueProducts from "./TraceabilityCatalogueProducts";

type ReportTraceabilityProps = {
  outletId?: string;
  dateRange?: DateRange;
};

const ReportTraceability = ({
  outletId,
  dateRange,
}: ReportTraceabilityProps) => {
  const [showTraceSearch, setshowTraceSearch] = useState<boolean>(false);
  const searchTypeOptions = useMemo(
    () => [
      { label: "Product or Batch", value: "product_or_batch" },
      { label: "Customer", value: "customer" },
      { label: "Order", value: "order" },
    ],
    [],
  );

  const [searchType, setSearchType] = useState(searchTypeOptions[0].value);
  const [searchQuery, setSearchQuery] = useState("");
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [lastSearch, setLastSearch] = useState<{
    searchType: string;
    searchQuery: string;
  } | null>(null);

  const selectedTypeLabel =
    searchTypeOptions.find((o) => o.value === searchType)?.label ||
    "Product or Batch";

  const runSearch = () => {
    const q = String(searchQuery || "").trim();
    if (!q) {
      setLastSearch(null);
      setIsTypeOpen(false);
      return;
    }

    setLastSearch({ searchType, searchQuery: q });
    setIsTypeOpen(false);
  };

  const reset = () => {
    setSearchQuery("");
    setSearchType(searchTypeOptions[0].value);
    setLastSearch(null);
    setIsTypeOpen(false);
  };

  return (
    <section className="bg-white p-4 sm:p-6">
      <button
        onClick={() => setshowTraceSearch((v) => !v)}
        type="button"
        className="flex mb-6 mt-4 items-center gap-[40px] hover:bg-[#F3F4F6] cursor-pointer transition-colors duration-200 ease-out w-fit"
      >
        <h3 className="">Show Report Filters</h3>
        <ChevronDown
          className={`size-5 text-[#15BA5C] transition-transform duration-200 ease-out ${
            showTraceSearch ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>
      {showTraceSearch && (
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-[260px]">
            <div className="text-[#6B7280] text-[12px] font-medium mb-2">
              Search type
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsTypeOpen((v) => !v)}
                className="w-full h-[48px] rounded-[10px] border border-[#E5E7EB] bg-white overflow-hidden flex items-stretch cursor-pointer"
              >
                <div className="flex-1 px-4 flex items-center justify-between">
                  <span className="text-[14px] font-medium text-[#111827] truncate">
                    {selectedTypeLabel}
                  </span>
                </div>
                <div className="w-[48px] bg-[#15BA5C] flex items-center justify-center">
                  <ChevronDown
                    className={`size-5 text-white transition-transform duration-200 ease-out ${
                      isTypeOpen ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </div>
              </button>

              {isTypeOpen ? (
                <div className="absolute left-0 top-full mt-2 w-full bg-white rounded-[12px] border border-[#E5E7EB] shadow-lg overflow-hidden z-200">
                  {searchTypeOptions.map((opt) => {
                    const isSelected = opt.value === searchType;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setSearchType(opt.value);
                          setIsTypeOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-[14px] font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-[#15BA5C]/10 text-[#15BA5C]"
                            : "bg-white text-[#111827] hover:bg-[#F7F8FA]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>

          <div className="w-full md:flex-1">
            <div className="text-[#6B7280] text-[12px] font-medium mb-2">
              Search Query
            </div>
            <div className="h-[48px] rounded-[10px] border border-[#E5E7EB] bg-white px-4 flex items-center gap-3">
              <Search className="size-4 text-[#9CA3AF]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") runSearch();
                }}
                placeholder="Enter search query"
                className="flex-1 outline-none text-[14px] text-[#111827] placeholder:text-[#9CA3AF]"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={runSearch}
            className="w-full md:w-[170px] h-[48px] rounded-[10px] bg-[#15BA5C] text-white text-[14px] font-semibold hover:bg-[#119E4D] transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Search className="size-4 text-white" />
            Search
          </button>

          <button
            type="button"
            onClick={reset}
            className="h-[48px] w-[48px] rounded-[10px] border border-[#E5E7EB] bg-white flex items-center justify-center hover:bg-[#F7F8FA] transition-colors cursor-pointer"
          >
            <RefreshCw className="size-4 text-[#6B7280]" />
          </button>
        </div>
      )}

      <TraceabilityCatalogueProducts
        outletId={outletId}
        dateRange={dateRange}
        search={lastSearch}
      />
    </section>
  );
};

export default ReportTraceability;
