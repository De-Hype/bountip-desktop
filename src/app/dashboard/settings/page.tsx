"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Image from "next/image";
import { ChevronRight } from "lucide-react";
import settingsItems from "@/data/settingItems";
import { BusinessDetailsModal } from "@/features/settings/components/BusinessDetailsModal";
//import { PaymentMethodsModal } from "@/features/settings/components/PaymentMethodsModal";

import { useBusinessStore } from "@/stores/useBusinessStore";
//import { PriceSettingsModal } from "@/features/settings/components/PriceSettingsModal";

const SettingsPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const { fetchBusinessData } = useBusinessStore();

  // Check for modal parameter on mount
  useEffect(() => {
    const modalParam = searchParams.get("modal");
    if (modalParam) {
      setActiveModal(modalParam);
    }
  }, [searchParams]);

  const handleSettingClick = (id: string) => {
    if (id === "customer-Tiers") {
      router.push("settings/customer/");
    } else if (id === "customise-modal") {
      router.push("settings/customization/");
    } else {
      setActiveModal(id);
    }
  };

  const handleModalClose = () => {
    setActiveModal(null);
    // Clear modal param from URL
    router.push("/dashboard/settings/");
  };

  useEffect(() => {
    fetchBusinessData();
  }, [fetchBusinessData]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-5 py-3">
        <hr className="border border-[#E7E7E7] my-8" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-white px-2 py-3.5">
          {settingsItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSettingClick(item.id)}
              className="relative overflow-hidden bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="absolute -top-14 right-0 h-[100px] w-[100px] rounded-full border border-[#15BA5C80]" />
              <div className="absolute -top-7 -right-12 h-[100px] w-[100px] rounded-full border border-[#15BA5C80]" />

              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-full ${item.color}`}>
                  <Image
                    src={item.icon}
                    alt={item.title}
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <ChevronRight className="h-[14px]" />
              </div>

              <p className="text-sm text-[#737373]">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <BusinessDetailsModal
        isOpen={activeModal === "business-info"}
        onClose={handleModalClose}
      />

      {/* <PriceSettingsModal
        isOpen={activeModal === "pricing"}
        onClose={handleModalClose}
      /> */}

      {/* <PaymentMethodsModal
        isOpen={activeModal === "payment-methods"}
        onClose={handleModalClose}
      /> */}

      {/* <LocationSettingsModal
        isOpen={activeModal === "location"}
        onClose={handleModalClose}
      /> */}

      {/* <PasswordSettingsModal
        isOpen={activeModal === "password-settings"}
        onClose={handleModalClose}
      /> */}

      {/* <LabellingSettingsModal
        isOpen={activeModal === "labelling-settings"}
        onClose={handleModalClose}
      /> */}

      {/* <InventoryHubModal
        isOpen={activeModal === "inventory-hub"}
        onClose={handleModalClose}
      /> */}

      {/* <InvoiceCustomizationModal
        isOpen={activeModal === "invoice-customization"}
        onClose={handleModalClose}
      /> */}

      {/* <OperatingHoursModal
        isOpen={activeModal === "operating-hours"}
        onClose={handleModalClose}
      /> */}

      {/* <ReceiptSettingsModal
        isOpen={activeModal === "receipt-customization"}
        onClose={handleModalClose}
      /> */}

      {/* <AccountSettingsModal
        isOpen={activeModal === "account-settings"}
        onClose={handleModalClose}
      /> */}

      {/* <PaymentTierModal
        isOpen={activeModal === "payment-Tiers"}
        onClose={handleModalClose}
      /> */}

      {/* <RegisterSettingsModal
        isOpen={activeModal === "register"}
        onClose={handleModalClose}
      /> */}
    </div>
  );
};

export default SettingsPage;
