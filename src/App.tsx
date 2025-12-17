import { HashRouter, Routes, Route, Outlet } from "react-router-dom";
import { Providers } from "./app/providers";

// Pages
import HomePage from "./app/page";
import AuthPage from "./app/(auth)/auth/page";
import ResetPasswordPage from "./app/(auth)/reset-password/page";
import VerifyPage from "./app/(auth)/verify/page";
import DashboardPage from "./app/dashboard/page";
import DashboardLayout from "./app/dashboard/layout";
import SettingsPage from "./app/dashboard/settings/page";
import CustomerSettingsPage from "./app/dashboard/settings/customer/page";
import CustomizationSettingsPage from "./app/dashboard/settings/customization/page";
import OnboardingPage from "./app/onboarding/page";
import PrivacyPolicyPage from "./app/privacy-policy/page";
import TermsPage from "./app/terms-and-conditions/page";

const DashboardLayoutWrapper = () => (
  <DashboardLayout>
    <Outlet />
  </DashboardLayout>
);

export default function App() {
  return (
    <HashRouter>
      <Providers>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify" element={<VerifyPage />} />

          <Route path="/dashboard" element={<DashboardLayoutWrapper />}>
            <Route index element={<DashboardPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route
              path="settings/customer"
              element={<CustomerSettingsPage />}
            />
            <Route
              path="settings/customization"
              element={<CustomizationSettingsPage />}
            />
          </Route>

          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-and-conditions" element={<TermsPage />} />
        </Routes>
      </Providers>
    </HashRouter>
  );
}
