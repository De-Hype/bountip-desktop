"use client";

import React from "react";
import { ChevronRight, Check, MoveRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import AssetsFiles from "@/assets";
import { useBusinessStore } from "@/stores/useBusinessStore";

import { getCurrencySymbol } from "@/utils/getCurrencySymbol";
import {
  Order,
  OrderStatus,
  OrderChannel,
} from "../../../../electron/types/order.types";

interface OrderCardProps {
  order: Order;
  onViewDetails?: (order: Order) => void;
}

const OrderCard = ({ order, onViewDetails }: OrderCardProps) => {
  const { selectedOutlet } = useBusinessStore();
  const currencySymbol = selectedOutlet?.currency
    ? getCurrencySymbol(selectedOutlet.currency)
    : "£";

  const steps = [
    {
      label: "Pending",
      value: "Pending",
      color: "text-[#F97316]",
      bg: "bg-[#F97316]",
      icon: <span className="text-[14px] font-black text-white">!</span>,
    },
    {
      label: "To be produced",
      value: "To be produced",
      color: "text-[#15BA5C]",
      bg: "bg-[#15BA5C]",
      icon: <Check className="w-4 h-4 text-white" strokeWidth={4} />,
    },
    {
      label: "Scheduled for Production",
      value: "Scheduled for Production",
      color: "text-[#15BA5C]",
      bg: "bg-[#15BA5C]",
      icon: <Check className="w-4 h-4 text-white" strokeWidth={4} />,
    },
    {
      label: "Ready",
      value: "Ready",
      color: "text-[#15BA5C]",
      bg: "bg-[#15BA5C]",
      icon: <Check className="w-4 h-4 text-white" strokeWidth={4} />,
    },
    {
      label: "Completed",
      value: "Completed",
      color: "text-[#15BA5C]",
      bg: "bg-[#15BA5C]",
      icon: <Check className="w-4 h-4 text-white" strokeWidth={4} />,
    },
  ];

  // Map order status to step index
  const statusToStep: Record<string, number> = {
    Pending: 0,
    Intent: 0,
    "To be produced": 1,
    "Scheduled for Production": 2,
    Ready: 3,
    Completed: 4,
    Cancelled: -1,
  };

  const currentStepIndex = statusToStep[order.status] ?? 0;

  const getSourceIcon = (channel: string) => {
    switch (channel?.toLowerCase()) {
      case "whatsapp":
        return (
          <img
            src={AssetsFiles.whatsappLogo}
            className="w-5 h-5"
            alt="WhatsApp"
          />
        );
      case "email":
        return (
          <img src={AssetsFiles.emailLogo} className="w-5 h-5" alt="Email" />
        );
      case "pos":
      case "in-store":
        return (
          <img src={AssetsFiles.cardpos} className="w-5 h-5" alt="In-store" />
        );
      default:
        return (
          <img
            src={AssetsFiles.websiteLogo}
            className="w-5 h-5"
            alt="Website"
          />
        );
    }
  };

  const getSourceColor = (channel: string) => {
    switch (channel?.toLowerCase()) {
      case "whatsapp":
        return "text-[#15BA5C]";
      case "email":
        return "text-[#F97316]";
      default:
        return "text-[#3B82F6]";
    }
  };

  return (
    <div
      onClick={() => onViewDetails?.(order)}
      className="bg-white border border-[#E5E7EB] rounded-[16px] p-6 mb-4 hover:shadow-sm transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl border border-[#F3F4F6] flex items-center justify-center bg-white">
            {getSourceIcon(order.orderChannel)}
          </div>
          <div>
            <h3 className="text-[18px] font-bold text-[#1C1B20]">
              {order.customerName || order.initiator || "Devon Lane"}
            </h3>
            <div className="flex items-center gap-1.5 text-[14px] text-[#6B7280] mt-0.5">
              <span>#{order.reference || "0001234"}</span>
              <span>•</span>
              <span>{order.itemCount || 0} items</span>
              <span>•</span>
              <span>
                {currencySymbol}
                {order.total || "23"}
              </span>
              <span>•</span>
              <span>{order.paymentMethod || "Cash on Delivery"}</span>
              <span>•</span>
              <span>
                Ordered {formatDistanceToNow(new Date(order.createdAt))} ago
              </span>
              <span>•</span>
              <span
                className={`font-medium ${getSourceColor(order.orderChannel)}`}
              >
                {order.orderChannel || "Email"}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails?.(order);
          }}
          className="flex items-center gap-2 border border-[#15BA5C] text-[#15BA5C] px-5 py-2.5 rounded-[12px] hover:bg-[#15BA5C]/5 transition-colors cursor-pointer font-medium text-[15px]"
        >
          View Details
          <MoveRight className="w-4 h-4" />
        </button>
      </div>

      {/* Status Stepper */}
      <div className="relative flex items-center justify-between w-full px-2">
        {/* Progress Line Background */}
        <div className="absolute top-[14px] left-0 right-0 h-[2px] bg-[#E5E7EB] -z-0 mx-8" />

        {/* Active Progress Line */}
        {currentStepIndex > 0 && (
          <div
            className="absolute top-[14px] left-0 h-[2px] bg-[#15BA5C] -z-0 transition-all duration-500 mx-8"
            style={{
              width: `calc(${(currentStepIndex / (steps.length - 1)) * 100}% - 64px)`,
            }}
          />
        )}

        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex;
          const isReached = index <= currentStepIndex;

          return (
            <div
              key={step.label}
              className="relative flex flex-col items-center z-10 min-w-[100px]"
            >
              <div
                className={`w-[28px] h-[28px] rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                  isReached
                    ? `${step.bg} border-transparent`
                    : "bg-white border-[#E5E7EB]"
                }`}
              >
                {isReached ? step.icon : null}
              </div>
              <span
                className={`mt-2 text-[12px] font-medium whitespace-nowrap text-center transition-colors duration-300 ${
                  isReached ? step.color : "text-[#9CA3AF]"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderCard;
