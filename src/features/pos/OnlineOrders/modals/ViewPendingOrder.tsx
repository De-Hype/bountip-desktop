"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import AssetsFiles from "@/assets";
import { useBusinessStore } from "@/stores/useBusinessStore";
import { getCurrencySymbol } from "@/utils/getCurrencySymbol";

interface ViewPendingOrderProps {
  order: any;
  onClose: () => void;
  onConfirm?: (orderId: string) => void;
  onDecline?: (orderId: string) => void;
}

const ViewPendingOrder = ({
  order,
  onClose,
  onConfirm,
  onDecline,
}: ViewPendingOrderProps) => {
  const [activeTab, setActiveTab] = useState<"details" | "info">("details");
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { selectedOutlet } = useBusinessStore();

  const currencySymbol = selectedOutlet?.currency
    ? getCurrencySymbol(selectedOutlet.currency)
    : "₦";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const api = (window as any).electronAPI;
        if (!api?.dbQuery) return;

        // Fetch cart items
        const cartId = order.cartId || order.cart_id;
        const itemsSql = `
          SELECT ci.*, p.name as productName, p.logoUrl as productLogo
          FROM cart_item ci
          LEFT JOIN product p ON ci.productId = p.id
          WHERE ci.cartId = ?
        `;
        const items = await api.dbQuery(itemsSql, [cartId]);
        setCartItems(items || []);

        // Fetch customer info
        const customerSql = `SELECT * FROM customers WHERE id = ?`;
        const customerData = await api.dbQuery(customerSql, [order.customerId]);
        if (customerData && customerData.length > 0) {
          setCustomer(customerData[0]);
        }
      } catch (err) {
        console.error("Failed to fetch order details:", err);
      } finally {
        setLoading(false);
      }
    };

    if (order) {
      fetchData();
    }
  }, [order]);

  if (!order) return null;

  const subtotal = cartItems.reduce(
    (acc, item) =>
      acc + Number(item.unitPrice || 0) * Number(item.quantity || 0),
    0,
  );
  const tax = Number(order.tax || 0);
  const total = Number(order.total || 0) || subtotal + tax;

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden shadow-xl border-l border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <h2 className="text-[24px] font-bold text-[#1C1B20]">
              {order.customerName || order.recipientName || "Anthony Nwanze"}
            </h2>
            <span className="px-3 py-1 bg-[#FFF7ED] text-[#F97316] text-[13px] font-medium rounded-full">
              Pending
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-[#EF4444] rounded-full text-white hover:bg-[#DC2626] transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-[14px] text-[#6B7280]">
          <span>{order.reference || "ORD-9DA62BA846EA8E"}</span>
          <span>•</span>
          <span>{order.itemCount || cartItems.length} items</span>
          <span>•</span>
          <span>{order.paymentMethod || "Transfer"}</span>
          <span>•</span>
          <span>
            Ordered {formatDistanceToNow(new Date(order.createdAt))} ago
          </span>
          <span>•</span>
          <span className="text-[#F97316] font-medium">
            {order.orderChannel || "Website"}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-6 border-b border-gray-100">
        <button
          onClick={() => setActiveTab("details")}
          className={`py-4 px-2 text-[15px] font-medium transition-all relative ${
            activeTab === "details" ? "text-[#1C1B20]" : "text-[#6B7280]"
          }`}
        >
          Order Details
          {activeTab === "details" && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#15BA5C] rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("info")}
          className={`py-4 px-8 text-[15px] font-medium transition-all relative ${
            activeTab === "info" ? "text-[#1C1B20]" : "text-[#6B7280]"
          }`}
        >
          Other Information
          {activeTab === "info" && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#15BA5C] rounded-t-full" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#15BA5C]"></div>
          </div>
        ) : activeTab === "details" ? (
          <>
            {/* Items List */}
            <div className="space-y-3">
              {cartItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-4 border border-[#F3F4F6] rounded-[16px] bg-white relative"
                >
                  <div className="w-20 h-20 rounded-[12px] overflow-hidden bg-gray-50 flex-shrink-0">
                    <img
                      src={item.productLogo || AssetsFiles.NoProductImage}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[18px] font-bold text-[#1C1B20]">
                      {item.productName}
                    </h4>
                    <p className="text-[16px] font-bold text-[#15BA5C] mt-1">
                      {currencySymbol}
                      {formatAmount(Number(item.unitPrice || 0))}
                    </p>
                  </div>
                  <div className="absolute top-4 right-4 bg-[#F0FDF4] text-[#15BA5C] text-[13px] font-bold px-2 py-0.5 rounded">
                    {item.quantity}x
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-8 p-6 bg-white border border-[#F3F4F6] rounded-[16px] space-y-4">
              <div className="flex justify-between text-[16px]">
                <span className="text-[#6B7280]">Subtotal</span>
                <span className="text-[#1C1B20] font-medium">
                  {currencySymbol}
                  {formatAmount(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-[16px]">
                <span className="text-[#6B7280]">Tax</span>
                <span className="text-[#1C1B20] font-medium">
                  {currencySymbol}
                  {formatAmount(tax)}
                </span>
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-between text-[18px] font-bold">
                <span className="text-[#1C1B20]">Total</span>
                <span className="text-[#1C1B20]">
                  {currencySymbol}
                  {formatAmount(total)}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="p-6 bg-white border border-[#F3F4F6] rounded-[16px]">
            <h3 className="text-[20px] font-bold text-[#1C1B20] mb-6">
              Customer Information
            </h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                <span className="text-[14px] font-bold text-[#1C1B20] uppercase">
                  Name:
                </span>
                <span className="text-[15px] text-[#1C1B20]">
                  {customer?.name || order.customerName || "Not provided"}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                <span className="text-[14px] font-bold text-[#1C1B20] uppercase">
                  Email:
                </span>
                <span className="text-[15px] text-[#1C1B20]">
                  {customer?.email || "Not provided"}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                <span className="text-[14px] font-bold text-[#1C1B20] uppercase">
                  Phone:
                </span>
                <span className="text-[15px] text-[#1C1B20]">
                  {customer?.phoneNumber || "Not provided"}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2">
                <span className="text-[14px] font-bold text-[#1C1B20] uppercase">
                  Address:
                </span>
                <span className="text-[15px] text-[#1C1B20]">
                  {customer?.address || "Not provided"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-100 flex gap-4">
        <button
          onClick={() => onConfirm?.(order.id)}
          className="flex-1 h-14 bg-[#15BA5C] text-white rounded-[12px] font-bold text-[16px] hover:bg-[#13A652] transition-colors cursor-pointer"
        >
          Confirm & Accept Order
        </button>
        <button
          onClick={() => onDecline?.(order.id)}
          className="flex-1 h-14 bg-[#FEF2F2] border border-[#FEE2E2] text-[#EF4444] rounded-[12px] font-bold text-[16px] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
        >
          Decline Order
        </button>
      </div>
    </div>
  );
};

export default ViewPendingOrder;
