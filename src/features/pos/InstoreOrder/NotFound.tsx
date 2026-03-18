"use client";
import EmptyStateAssests from "@/assets/images/empty-state";

const NotFound = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12">
      <div className="w-[180px] h-[140px] mb-8 flex items-center justify-center">
        <img
          src={EmptyStateAssests.OnlineOrdersEmptyState}
          alt="In-store Orders Empty State"
        />
      </div>
      <h2 className="text-[32px] font-bold text-[#1C1B20] mb-4 text-center">
        No In-store Orders Yet
      </h2>
      <p className="text-[18px] text-[#6B7280] text-center max-w-[450px] leading-relaxed">
        You do not have any in-store orders at the moment.
      </p>
    </div>
  );
};

export default NotFound;
