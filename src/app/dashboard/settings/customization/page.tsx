"use client";

import { useState } from "react";
import CustomizationSidebar from "@/features/settings/tabs/customization/CustomizationSidebar";
import NotFound from "@/features/settings/tabs/customization/NotFound";
import BasicInfo from "@/features/settings/tabs/customization/BasicInfo";
import { StoreFrontCustomizationStep } from "@/types/settings/customization";
import CustomizeTab from "@/features/settings/tabs/customization/CustomizeTab";
import BusinessOperations from "@/features/settings/tabs/customization/BusinessOperations";
import ProductInfo from "@/features/settings/tabs/customization/ProductInfo";
import PreviewStoreFront from "@/features/settings/tabs/customization/PreviewStoreFront";

const steps: { id: StoreFrontCustomizationStep; label: string }[] = [
  { id: "basic-information", label: "Basic Information" },
  { id: "customization", label: "Customization" },
  { id: "business-operations", label: "Business Operations" },
  { id: "products", label: "Products" },
  { id: "preview-storefront", label: "Preview Storefront" },
];

const CustomizationPage = () => {
  const [activeStep, setActiveStep] =
    useState<StoreFrontCustomizationStep>("basic-information");

  return (
    <section className="min-h-[calc(100vh-5rem)]">
      <div className="px-5 py-6">
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="bg-white px-4 py-3 min-h-[calc(100vh-5rem)] lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto">
            <CustomizationSidebar
              activeStep={activeStep}
              onStepChange={setActiveStep}
              disabled={false}
              steps={steps}
            />
          </div>

          <section className="rounded-[14px] bg-white px-4 py-4 h-[calc(100vh-5rem)] overflow-y-auto">
            {activeStep === "basic-information" && <BasicInfo />}
            {activeStep === "customization" && <CustomizeTab />}
            {activeStep === "business-operations" && <BusinessOperations />}
            {activeStep === "products" && <ProductInfo />}
            {activeStep === "preview-storefront" && <PreviewStoreFront />}
            {activeStep !== "basic-information" &&
              activeStep !== "customization" &&
              activeStep !== "business-operations" &&
              activeStep !== "products" &&
              activeStep !== "preview-storefront" && <NotFound />}
          </section>
        </div>
      </div>
    </section>
  );
};

export default CustomizationPage;
