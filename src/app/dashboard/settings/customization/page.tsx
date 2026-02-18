"use client";

import { useState } from "react";
import CustomizationSidebar from "@/features/settings/tabs/customization/CustomizationSidebar";
import NotFound from "@/features/settings/tabs/customization/NotFound";
import { StoreFrontCustomizationStep } from "@/types/settings/customization";

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
              disabled={true}
              steps={steps}
            />
          </div>

          <section className="rounded-[14px] bg-white px-4 py-4 min-h-[60vh]">
            <NotFound />
          </section>
        </div>
      </div>
    </section>
  );
};

export default CustomizationPage;
