import {
  HashRouter,
  Routes,
  Route,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Providers } from "./app/providers";
import { useBusinessStore } from "./stores/useBusinessStore";
import { useEffect } from "react";

import HomePage from "./app/page";
import AuthPage from "./app/(auth)/auth/page";
import ResetPasswordPage from "./app/(auth)/reset-password/page";
import VerifyPage from "./app/(auth)/verify/page";
import DashboardPage from "./app/dashboard/page";
import DashboardLayout from "./app/dashboard/layout";
import SettingsPage from "./app/dashboard/settings/page";
import CustomizationSettingsPage from "./app/dashboard/settings/customization/page";
import ReportAnalysisPage from "./app/dashboard/report-analysis/page";
import RolesAndPermissionPage from "./app/dashboard/roles-permissions/page";
import OnboardingPage from "./app/onboarding/page";
import PrivacyPolicyPage from "./app/privacy-policy/page";
import TermsPage from "./app/terms-and-conditions/page";
import ProductManagementPage from "./app/dashboard/product-management/page";
import ProductionManagementPage from "./app/dashboard/production-management/page";
import RecipeManagementPage from "./app/dashboard/recipe-management/page";
import InventoryPage from "./app/dashboard/inventory/page";
import CustomerManagementPage from "./app/dashboard/customer-management/page";
import POSPage from "./app/dashboard/pos/page";
import DatabaseViewerPage from "./app/dashboard/debug/database/page";
import MainDashboardPage from "./app/dashboard/dashboard/page";

/**
 * Global guard to ensure users are redirected to onboarding
 * as soon as an un-onboarded outlet is selected.
 */
const OnboardingGuard = ({ children }: { children: React.ReactNode }) => {
  const { selectedOutlet, hasInitialized } = useBusinessStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // 🛡️ Wait for basic initialization to be complete
    if (!hasInitialized || !selectedOutlet) return;

    const isUnonboarded = !selectedOutlet.isOnboarded;
    const isDashboardPath = location.pathname.startsWith("/dashboard");
    const isOnboardingPath = location.pathname.startsWith("/onboarding");

    if (isUnonboarded && isDashboardPath && !isOnboardingPath) {
      console.log(
        "[OnboardingGuard] Redirecting to onboarding because outlet is not onboarded:",
        selectedOutlet.id,
      );
      navigate(`/onboarding?outletId=${selectedOutlet.id}`, { replace: true });
    }
  }, [selectedOutlet, hasInitialized, location.pathname, navigate]);

  return <>{children}</>;
};

const DashboardLayoutWrapper = () => (
  <DashboardLayout>
    <Outlet />
  </DashboardLayout>
);

export default function App() {
  return (
    <HashRouter>
      <Providers>
        <OnboardingGuard>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify" element={<VerifyPage />} />

            <Route path="/dashboard" element={<DashboardLayoutWrapper />}>
              <Route index element={<DashboardPage />} />
              <Route path="dashboard" element={<MainDashboardPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route
                path="settings/customization"
                element={<CustomizationSettingsPage />}
              />
              <Route path="report-analysis" element={<ReportAnalysisPage />} />
              <Route
                path="roles-permissions"
                element={<RolesAndPermissionPage />}
              />
              <Route
                path="recipe-management"
                element={<RecipeManagementPage />}
              />
              <Route path="inventory" element={<InventoryPage />} />
              <Route
                path="customer-management"
                element={<CustomerManagementPage />}
              />
              <Route
                path="product-management"
                element={<ProductManagementPage />}
              />
              <Route
                path="production-management"
                element={<ProductionManagementPage />}
              />
              <Route path="pos" element={<POSPage />} />
              <Route path="debug/database" element={<DatabaseViewerPage />} />
            </Route>

            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms-and-conditions" element={<TermsPage />} />
          </Routes>
        </OnboardingGuard>
      </Providers>
    </HashRouter>
  );
}
