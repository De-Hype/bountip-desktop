import React from "react";

interface StatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  pending: "bg-[#FFF8E5] text-[#E4A801]",
  approved: "bg-[#ECFDF3] text-[#027A48]",
  Failed: "bg-[#FEF3F2] text-[#B42318]",
  Cancelled: "bg-[#F2F4F7] text-[#667085]",
};

const ApprovalLogStatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const s = status.toLowerCase();

  const styles = statusStyles[s] || "bg-[#F2F4F7] text-[#667085]";
  const capitalizeFirst = (str = "") => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  return (
    <span
      className={`inline-flex h-8 items-center px-3 rounded-[8px] text-[14px] font-medium ${styles}`}
    >
      {capitalizeFirst(status)}
    </span>
  );
};

export default ApprovalLogStatusBadge;
