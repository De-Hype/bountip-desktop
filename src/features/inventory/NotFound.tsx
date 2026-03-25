import EmptyStateAssests from "@/assets/images/empty-state";
import React from "react";

interface NotFoundProps {
  title: string;
  description: string;
  onAddClick?: () => void;
  actionText?: string;
  imageSrc?: string;
  imageAlt?: string;
}

const NotFound = ({
  title,
  description,
  onAddClick,
  actionText,
  imageSrc,
  imageAlt = "empty",
}: NotFoundProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 bg-white w-full">
      <div
        className={`relative mb-2 ${onAddClick ? "cursor-pointer group" : ""}`}
        onClick={onAddClick}
      >
        <img
          src={imageSrc || EmptyStateAssests.InventoryEmptyState}
          alt={imageAlt}
          width={240}
          height={240}
          className="w-60 h-60 transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-center mb-6 max-w-md">{description}</p>
      {onAddClick && actionText && (
        <button
          onClick={onAddClick}
          className="px-6 py-2.5 bg-[#15BA5C] text-white rounded-lg font-semibold hover:bg-[#119E4D] transition-all active:scale-95 cursor-pointer shadow-sm"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default NotFound;
