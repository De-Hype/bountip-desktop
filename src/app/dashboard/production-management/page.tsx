import React from "react";
import AllOrdersList from "@/features/production-management/orders/AllOrdersList";
import useProductionStore from "@/stores/useProductionStore";
import useOrderStore from "@/stores/useOrderStore";
import { useBusinessStore } from "@/stores/useBusinessStore";
import { OrderStatus } from "../../../../electron/types/order.types";
import { ProductionV2Status } from "../../../../electron/types/productionV2.types";
import ToBeProducedList from "@/features/production-management/tabs/ToBeProducedList";
import ProductionStats from "@/features/production-management/stats/ProductionStats";
import SubmittedProductionModal from "@/features/production-management/tabs/SubmittedProductionModal";
import ScheduledProductionModal from "@/features/production-management/tabs/ScheduledProductionModal";
import QualityControlModal from "@/features/production-management/tabs/QualityControlModal";
import ReadyModal from "@/features/production-management/tabs/ReadyModal";
import DraftModal from "@/features/production-management/tabs/DraftModal";

const ProductionManagementPage = () => {
  const { productions, fetchProductions } = useProductionStore();
  const { orders, fetchOrders } = useOrderStore();
  const { selectedOutlet } = useBusinessStore();

  React.useEffect(() => {
    fetchProductions(selectedOutlet?.id);
    fetchOrders(selectedOutlet?.id);

    // Refresh data every 5 seconds for "real-time" updates
    const interval = setInterval(() => {
      fetchProductions(selectedOutlet?.id);
      fetchOrders(selectedOutlet?.id);
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchProductions, fetchOrders, selectedOutlet?.id]);

  const chips = React.useMemo(() => {
    const toBeProduced =
      orders.filter((o) => {
        const s = (o.status || "").toLowerCase();
        return (
          s === "to be produced" ||
          s === "to-be-produced" ||
          s === "confirmed" ||
          s === OrderStatus.TO_BE_PRODUCED.toLowerCase()
        );
      }).length || 0;
    const draft =
      orders.filter((o) => (o.status || "").toLowerCase() === "draft").length ||
      0;
    const submitted =
      productions.filter((p) => {
        const s = String(p.status || "").toLowerCase();
        return (
          s === ProductionV2Status.INVENTORY_PENDING ||
          s === ProductionV2Status.INVENTORY_APPROVED
        );
      }).length || 0;
    const scheduled =
      productions.filter((p) => {
        const s = (p.status || "").toLowerCase();
        return s === ProductionV2Status.IN_PREPARATION;
      }).length || 0;
    const qualityControl =
      productions.filter((p) => {
        const s = String(p.status || "").toLowerCase();
        return s === ProductionV2Status.QUALITY_CONTROL;
      }).length || 0;
    const ready =
      productions.filter((p) => {
        const s = String(p.status || "").toLowerCase();
        return s === ProductionV2Status.READY;
      }).length || 0;

    return [
      {
        label: "To be Produced",
        count: toBeProduced,
        pill: "bg-[#FFEDD5] text-[#F97316]",
      },
      { label: "Draft", count: draft, pill: "bg-gray-100 text-gray-500" },
      {
        label: "Submitted",
        count: submitted,
        pill: "bg-[#DBEAFE] text-[#1D4ED8]",
      },
      {
        label: "Scheduled for production",
        count: scheduled,
        pill: "bg-[#FEF3C7] text-[#B45309]",
      },
      {
        label: "Quality Control",
        count: qualityControl,
        pill: "bg-[#FFF7ED] text-[#EA580C]",
      },
      {
        label: "Ready",
        count: ready,
        pill: "bg-[#DCFCE7] text-[#16A34A]",
      },
    ];
  }, [orders, productions]);

  const [activeTab, setActiveTab] = React.useState<string>("To be Produced");

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto">
        <div className="p-4 sm:p-6">
          <p className="text-gray-600 text-sm sm:text-base">
            Schedule, track, and control each batch to ensure quality and
            consistency
          </p>
        </div>
      </main>

      {/* Status Chips Row */}
      <ProductionStats />
      <div className="px-4 sm:px-6 bg-white my-3 py-3">
        <div className="bg-[#F3F4F6] rounded-[12px] p-1 grid grid-cols-3 md:grid-cols-6 gap-1">
          {chips.map((c) => {
            const isActive = activeTab === c.label;
            return (
              <button
                key={c.label}
                type="button"
                onClick={() => setActiveTab(c.label)}
                className={`h-11 w-full rounded-[10px] transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isActive
                    ? "bg-white shadow-sm"
                    : "bg-transparent text-[#6B7280] hover:text-[#1C1B20]"
                }`}
                aria-pressed={isActive}
              >
                <span
                  className={`inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-full text-[11px] font-semibold ${c.pill}`}
                >
                  {c.count}
                </span>
                <span
                  className={`text-[13px] font-medium ${
                    isActive ? "text-[#1C1B20]" : "text-inherit"
                  }`}
                >
                  {c.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Section */}
      {activeTab === "To be Produced" ? (
        <ToBeProducedList />
      ) : activeTab === "Draft" ? (
        <DraftModal />
      ) : activeTab === "Submitted" ? (
        <SubmittedProductionModal />
      ) : activeTab === "Scheduled for production" ? (
        <ScheduledProductionModal />
      ) : activeTab === "Quality Control" ? (
        <QualityControlModal />
      ) : activeTab === "Ready" ? (
        <ReadyModal />
      ) : (
        <AllOrdersList />
      )}
    </div>
  );
};

export default ProductionManagementPage;
