"use client";

import { useCallback, useEffect, useState } from "react";
import CustomizationSidebar from "@/features/settings/tabs/customization/CustomizationSidebar";
import NotFound from "@/features/settings/tabs/customization/NotFound";
import BasicInfo from "@/features/settings/tabs/customization/BasicInfo";
import { StoreFrontCustomizationStep } from "@/types/settings/customization";
import CustomizeTab from "@/features/settings/tabs/customization/CustomizeTab";
import BusinessOperations from "@/features/settings/tabs/customization/BusinessOperations";
import ProductInfo from "@/features/settings/tabs/customization/ProductInfo";
import PreviewStoreFront from "@/features/settings/tabs/customization/PreviewStoreFront";
import storeFrontService from "@/services/storefrontService";
import useBusinessStore from "@/stores/useBusinessStore";
import useToastStore from "@/stores/toastStore";
import { BusinessOutlet } from "@/types/storefront";

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
  const { selectedOutlet } = useBusinessStore();
  const { showToast } = useToastStore();
  const [isLoadingStorefront, setIsLoadingStorefront] = useState(false);
  const [hasStorefrontInfo, setHasStorefrontInfo] = useState(true);
  const [storefrontOutlet, setStorefrontOutlet] =
    useState<BusinessOutlet | null>(null);

  const refreshStorefrontInfo = useCallback(async () => {
    if (!selectedOutlet?.id) return;
    setIsLoadingStorefront(true);
    try {
      const res = await storeFrontService.loadStorefrontInfo(selectedOutlet.id);
      const raw = (res as any)?.data as string | BusinessOutlet;
      if (typeof raw === "string") {
        const trimmed = raw.trim();
        if (trimmed.length === 0) {
          setHasStorefrontInfo(false);
          setStorefrontOutlet(null);
        } else {
          try {
            const parsed = JSON.parse(trimmed) as BusinessOutlet;
            setHasStorefrontInfo(true);
            setStorefrontOutlet(parsed);
          } catch {
            setHasStorefrontInfo(true);
            setStorefrontOutlet(null);
          }
        }
      } else {
        setHasStorefrontInfo(true);
        setStorefrontOutlet(raw);
      }
    } catch (err) {
      setHasStorefrontInfo(false);
      setStorefrontOutlet(null);
      showToast("error", "Error", "Failed to load storefront info");
    } finally {
      setIsLoadingStorefront(false);
    }
  }, [selectedOutlet?.id, showToast]);

  useEffect(() => {
    refreshStorefrontInfo();
  }, [refreshStorefrontInfo]);

  return (
    <section className="min-h-[calc(100vh-5rem)]">
      <div className="px-5 py-6">
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="bg-white px-4 py-3 min-h-[calc(100vh-5rem)] lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto">
            <CustomizationSidebar
              activeStep={activeStep}
              onStepChange={setActiveStep}
              disabled={isLoadingStorefront || !hasStorefrontInfo}
              steps={steps}
            />
          </div>

          <section className="rounded-[14px] bg-white px-4 py-4 h-[calc(100vh-5rem)] overflow-y-auto">
            {isLoadingStorefront && (
              <div className="flex h-full items-center justify-center text-sm text-gray-400 italic">
                Loading...
              </div>
            )}

            {!isLoadingStorefront && !hasStorefrontInfo && (
              <NotFound
                outletId={selectedOutlet?.id}
                onActivated={refreshStorefrontInfo}
              />
            )}

            {!isLoadingStorefront && hasStorefrontInfo && (
              <>
                {activeStep === "basic-information" && (
                  <BasicInfo
                    outletId={selectedOutlet?.id}
                    customSubDomain={storefrontOutlet?.customSubDomain}
                    emailAlias={storefrontOutlet?.emailAlias}
                    whatsappChannel={
                      storefrontOutlet?.waChannel ??
                      (selectedOutlet as any)?.whatsappChannel ??
                      false
                    }
                    whatsappNumber={
                      storefrontOutlet?.waPhoneNumber ??
                      (selectedOutlet as any)?.whatsappNumber ??
                      null
                    }
                    webChannel={
                      storefrontOutlet?.webChannel ??
                      (selectedOutlet as any)?.webChannel ??
                      false
                    }
                    onChannelsUpdated={refreshStorefrontInfo}
                  />
                )}
                {activeStep === "customization" && (
                  <CustomizeTab
                    outletId={selectedOutlet?.id}
                    initialLogoUrl={storefrontOutlet?.logoUrl ?? null}
                    initialCoverUrl={storefrontOutlet?.coverUrl ?? null}
                    initialColor={storefrontOutlet?.colourTheme ?? null}
                    onSaved={refreshStorefrontInfo}
                  />
                )}
                {activeStep === "business-operations" && (
                  <BusinessOperations
                    outletId={selectedOutlet?.id}
                    country={storefrontOutlet?.country ?? null}
                    storeCode={storefrontOutlet?.storeCode ?? null}
                    initialOperatingHours={
                      storefrontOutlet?.operatingHours ?? null
                    }
                    initialLeadTime={storefrontOutlet?.leadTime ?? null}
                    initialBankDetails={storefrontOutlet?.bankDetails ?? null}
                    initialBusinessOperation={
                      storefrontOutlet?.businessOperation ?? null
                    }
                    onSaved={refreshStorefrontInfo}
                  />
                )}
                {activeStep === "products" && <ProductInfo />}
                {activeStep === "preview-storefront" && (
                  <PreviewStoreFront storeInfo={storefrontOutlet} />
                )}
                {activeStep !== "basic-information" &&
                  activeStep !== "customization" &&
                  activeStep !== "business-operations" &&
                  activeStep !== "products" &&
                  activeStep !== "preview-storefront" && (
                    <NotFound outletId={selectedOutlet?.id} />
                  )}
              </>
            )}
          </section>
        </div>
      </div>
    </section>
  );
};

export default CustomizationPage;
