import React from "react";
import AllOrdersList from "@/features/production-management/orders/AllOrdersList";
import ProductionStats from "@/features/production-management/stats/ProductionStats";

const ProductionManagementPage = () => {
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

      {/* Stats Section */}
      <ProductionStats />

      {/* Orders Section */}
      <AllOrdersList />
    </div>
  );
};

export default ProductionManagementPage;
