import AppHeader from "@/shared/Header/AppHeader";
import React, { useEffect } from "react";
import { useBusinessStore } from "@/stores/useBusinessStore";
import { useNavigate, useLocation } from "react-router-dom";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AppHeader />
      <main className="flex flex-1 overflow-hidden">
        <section className="flex-1 overflow-auto">{children}</section>
      </main>
    </div>
  );
};

export default DashboardLayout;
