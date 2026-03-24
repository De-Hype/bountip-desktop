import ProductionManagementAssets from "@/assets/images/products-management";
import React, { useEffect, useMemo } from "react";
import useProductionStore from "@/stores/useProductionStore";
import useOrderStore from "@/stores/useOrderStore";
import { useBusinessStore } from "@/stores/useBusinessStore";

const ProductionStats = () => {
  const { productions, fetchProductions } = useProductionStore();
  const { orders, fetchOrders } = useOrderStore();
  const { selectedOutlet } = useBusinessStore();

  useEffect(() => {
    fetchProductions(selectedOutlet?.id);
    fetchOrders(selectedOutlet?.id);
  }, [fetchProductions, fetchOrders, selectedOutlet?.id]);

  const stats = useMemo(() => {
    return {
      newOrders: orders.filter((o) => o.status === "Pending" || o.status === "To be produced").length,
      scheduledProductions: productions.filter((p) => p.status === "Scheduled for Production").length,
      readyOrders: productions.filter((p) => p.status === "Ready").length,
      cancelledOrders: productions.filter((p) => p.status === "Cancelled").length,
    };
  }, [orders, productions]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 bg-white py-8 p-4 sm:p-6">
      {/* New Orders */}
      <div className="relative p-6 rounded-xl overflow-hidden bg-[#F8BD00]/5 border border-yellow-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(224,200,115,0.18)_0%,transparent_65%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(224,200,115,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(224,200,115,0.10)_1px,transparent_1px)] bg-size-[36px_36px] opacity-40 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-center gap-3">
              <div className="size-10 rounded-sm bg-[#F8BD00]/20 flex justify-center items-center p-2">
                <img
                  src={ProductionManagementAssets.ProductionStatsIcon1}
                  className="h-8 w-8"
                  alt="New orders icon"
                />
              </div>
              <span className="text-4xl sm:text-3xl font-bold text-[#1C1B20]">
                {stats.newOrders}
              </span>
            </div>
            <div className="w-10 h-10 flex items-center justify-center rounded-full border border-yellow-500 text-yellow-600">
              ↗
            </div>
          </div>
          <p className="text-base sm:text-lg text-gray-900">New Orders</p>
        </div>
      </div>

      {/* Scheduled Production */}
      <div className="relative p-6 rounded-xl overflow-hidden bg-[#9747FF]/5 border border-purple-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(180,140,255,0.20)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(180,140,255,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(180,140,255,0.15)_1px,transparent_1px)] bg-size-[36px_36px] opacity-40 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-center gap-3">
              <div className="size-10 rounded-sm bg-[#9747FF]/20 flex justify-center items-center p-2">
                <img
                  src={ProductionManagementAssets.ProductionStatsIcon2}
                  className="h-8 w-8"
                  alt="Scheduled production icon"
                />
              </div>
              <span className="text-4xl sm:text-3xl font-bold text-gray-900">
                {stats.scheduledProductions}
              </span>
            </div>
            <div className="w-10 h-10 flex items-center justify-center rounded-full border border-purple-500 text-purple-600">
              ↗
            </div>
          </div>
          <p className="text-base sm:text-lg text-gray-900">
            Scheduled for Production
          </p>
        </div>
      </div>

      {/* Ready Orders */}
      <div className="relative p-6 rounded-xl overflow-hidden bg-[#15BA5C]/5 border border-green-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(120,200,140,0.20)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(120,200,140,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,200,140,0.15)_1px,transparent_1px)] bg-size-[36px_36px] opacity-40 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-center gap-3">
              <div className="size-10 rounded-sm bg-[#15BA5C]/20 flex justify-center items-center p-2">
                <img
                  src={ProductionManagementAssets.ProductionStatsIcon3}
                  className="h-8 w-8"
                  alt="Production icon 1"
                />
              </div>
              <span className="text-4xl sm:text-3xl font-bold text-gray-900">
                {stats.readyOrders}
              </span>
            </div>
            <div className="w-10 h-10 flex items-center justify-center rounded-full border border-green-500 text-green-600">
              ↗
            </div>
          </div>
          <p className="text-base sm:text-lg text-[#1C1B20]">Ready Orders</p>
        </div>
      </div>

      {/* Cancelled Orders */}
      <div className="relative p-6 rounded-xl overflow-hidden bg-[#E33629]/5 border border-red-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(230,55,55,0.20)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(230,55,55,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(230,55,55,0.15)_1px,transparent_1px)] bg-size-[36px_36px] opacity-40 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-center gap-3">
              <div className="size-10 rounded-sm bg-[#E33629]/20 flex justify-center items-center p-2">
                <img
                  src={ProductionManagementAssets.ProductionStatsIcon4}
                  className="h-8 w-8"
                  alt="Production icon 1"
                />
              </div>
              <span className="text-4xl sm:text-3xl font-bold text-[#1C1B20]">
                {stats.cancelledOrders}
              </span>
            </div>
            <div className="w-10 h-10 flex items-center justify-center rounded-full border border-red-500 text-red-600">
              ↗
            </div>
          </div>
          <p className="text-base sm:text-lg text-[#1C1B20]">
            Cancelled Orders
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductionStats;
