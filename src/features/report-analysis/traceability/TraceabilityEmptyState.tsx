"use client";

import { Search } from "lucide-react";

const TraceabilityEmptyState = () => {
  return (
    <div className="w-full flex flex-col items-center justify-center py-16 px-4">
      <div className="flex items-center justify-center h-[84px] w-[84px] rounded-full bg-[#F3F4F6] text-[#9CA3AF]">
        <Search className="size-9" />
      </div>

      <div className="mt-6 text-center">
        <div className="text-[#111827] text-[28px] font-semibold">
          Search For Traceability
        </div>
        <div className="mt-2 text-[#6B7280] text-[16px] max-w-[640px]">
          Enter a Batch number for forward traceability, or an ingredient lot
          number for backward traceability to see the complete product chain.
        </div>
      </div>

      <div className="mt-10 w-full max-w-[920px] grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-[16px] bg-[#15BA5C]/5 border border-[#15BA5C]/10 px-8 py-6">
          <div className="text-[#15BA5C] text-[22px] font-semibold">
            Product or Batch Traceability
          </div>
          <div className="mt-2 text-[#6B7280] text-[16px]">
            Search by Batch number to see all ingredients used in production
          </div>
        </div>

        <div className="rounded-[16px] bg-[#15BA5C]/5 border border-[#15BA5C]/10 px-8 py-6">
          <div className="text-[#15BA5C] text-[22px] font-semibold">
            Ingredient or Lot Traceability
          </div>
          <div className="mt-2 text-[#6B7280] text-[16px]">
            Search by ingredient lot to find all batches
          </div>
        </div>
      </div>
    </div>
  );
};

export default TraceabilityEmptyState;
