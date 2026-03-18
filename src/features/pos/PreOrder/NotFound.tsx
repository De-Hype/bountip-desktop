"use client";
import EmptyStateAssests from "@/assets/images/empty-state";
import { Plus } from "lucide-react";
import { PreOrderTabs } from ".";

type NotFoundProps = {
  tab: PreOrderTabs;
};

const NotFound = ({ tab }: NotFoundProps) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12">
      <div className="w-[180px] h-[140px] mb-8 flex items-center justify-center">
        <img
          src={EmptyStateAssests.OnlineOrdersEmptyState}
          alt="Pre-orders Empty State"
        />
      </div>
      <h2 className="text-[25px] font-bold text-[#1C1B20] mb-4 text-center">
        Your {tab === PreOrderTabs.ORDER ? "Orders" : "Quotes"} List is Empty
      </h2>
      <p className="text-[16px] text-[#6B7280] text-center max-w-[450px] leading-relaxed">
        Start by saving a new {tab === PreOrderTabs.ORDER ? "pre-order" : "quote"} to track details like payment status,
        progress, and due dates—all in one convenient view!
      </p>
      <div className="max-w-[450px] w-[450px] mt-2">
        <button
          type="button"
          className="flex justify-center items-center w-full gap-2 border border-[#15BA5C] bg-[#15BA5C] text-[#15BA5C] px-5 py-2.5 rounded-[12px] hover:bg-[#15BA5C]/5 transition-colors cursor-pointer font-medium text-[15px] text-white hover:text-[#15BA5C] "
        >
          <Plus />
          <span className="">Create Order</span>
        </button>
      </div>
    </div>
  );
};

export default NotFound;
