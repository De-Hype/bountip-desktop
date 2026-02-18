import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Switch } from "../ui/Switch";
import { Trash2 } from "lucide-react";
import SettingFiles from "@/assets/icons/settings";

import useToastStore from "@/stores/toastStore";
import { useBusinessStore } from "@/stores/useBusinessStore";

interface PaymentMethod {
  id: number;
  name: string;
  isActive: boolean;
}

interface PaymentMethodsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const defaultMethods: PaymentMethod[] = [
  { id: 1, name: "Cash", isActive: false },
  // { id: 2, name: "Virtual Tab", isActive: false },
  { id: 3, name: "Others", isActive: false },
];

export const PaymentMethodsModal: React.FC<PaymentMethodsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { selectedOutlet: outlet } = useBusinessStore();

  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [customName, setCustomName] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToastStore();

  useEffect(() => {
    if (!isOpen) return;

    if (outlet?.paymentMethods?.methods) {
      const outletPaymentMethods = outlet.paymentMethods.methods as Array<{
        id?: number;
        name: string;
        isActive: boolean;
      }>;

      const merged = defaultMethods.map((def, index) => {
        const existing = outletPaymentMethods.find((m) => m.name === def.name);
        return existing
          ? {
              id: existing.id ?? def.id ?? index,
              name: existing.name,
              isActive: existing.isActive,
            }
          : { id: def.id ?? index, name: def.name, isActive: def.isActive };
      });

      const customs = outletPaymentMethods
        .filter((m) => !defaultMethods.some((def) => def.name === m.name))
        .map((m, index) => ({
          id: m.id ?? Date.now() + index,
          name: m.name,
          isActive: m.isActive,
        }));

      setMethods([...merged, ...customs]);
    } else {
      // if no backend data, show only defaults
      setMethods(defaultMethods);
    }

    setCustomName("");
  }, [isOpen, outlet]);

  // Handle errors from business or store queries

  // Track unsaved changes - improved logic
  useEffect(() => {
    if (!isOpen) return;

    // If no store data loaded yet, no changes
    if (!outlet) {
      // setUnsaved(false);
      return;
    }

    // FIXED: Check if paymentMethods exists before accessing methods
    const paymentMethodsData = outlet.paymentMethods;
    const initialMethods =
      paymentMethodsData && paymentMethodsData.methods
        ? (paymentMethodsData.methods as Array<{
            name: string;
            isActive: boolean;
          }>)
        : [];

    // Create simplified versions for comparison
    const currentSimple = methods.map(({ name, isActive }) => ({
      name,
      isActive,
    }));
    const initialSimple = initialMethods.map(({ name, isActive }) => ({
      name,
      isActive,
    }));

    // Check if any method's state changed
    let hasChanges = false;

    // If paymentMethods was null/empty, any active toggle or added method is a change
    if (initialMethods.length === 0) {
      // Check if any method is active
      hasChanges = currentSimple.some((m) => m.isActive);

      // Or if any custom methods were added (beyond the 3 defaults)
      if (!hasChanges && methods.length > defaultMethods.length) {
        hasChanges = true;
      }
    } else {
      // Check if lengths differ
      if (currentSimple.length !== initialSimple.length) {
        hasChanges = true;
      } else {
        // Check each method
        for (const currentMethod of currentSimple) {
          const initialMethod = initialSimple.find(
            (m) => m.name === currentMethod.name,
          );

          if (!initialMethod) {
            // New method added
            hasChanges = true;
            break;
          }

          if (currentMethod.isActive !== initialMethod.isActive) {
            // Toggle state changed
            hasChanges = true;
            break;
          }
        }

        // Check if any method was deleted
        if (!hasChanges) {
          for (const initialMethod of initialSimple) {
            const currentMethod = currentSimple.find(
              (m) => m.name === initialMethod.name,
            );
            if (!currentMethod) {
              hasChanges = true;
              break;
            }
          }
        }
      }
    }

    // Also consider custom name input as unsaved
    // setUnsaved(hasChanges || !!customName.trim());
  }, [methods, customName, outlet, isOpen]);

  const handleToggle = (id: number, isActive: boolean) => {
    setMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isActive } : m)),
    );
  };

  const handleCustomSubmit = () => {
    if (!customName.trim()) return;
    setMethods((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: customName.trim(),
        isActive: false,
      },
    ]);
    setCustomName("");
  };

  const handleDelete = (id?: number, name?: string) => {
    console.log(id || name, "This is the one that is deleted");

    if (!outlet) {
      const errorMessage = "Store information is missing.";
      showToast("error", "Missing Store ID", errorMessage);

      return;
    }

    setLoading(true);

    if (id || name) {
      setMethods((prev) =>
        id
          ? prev.filter((m) => m.id !== id)
          : prev.filter((m) => m.name !== name),
      );

      showToast(
        "success",
        "Payment Methods",
        "Payment method deleted successfully",
      );
    }

    setLoading(false);
  };

  const handleSave = () => {
    if (!outlet) {
      const errorMessage = "Store information is missing.";
      showToast("error", "Missing Store ID", errorMessage);

      return;
    }

    setLoading(true);

    // Include any pending custom method in the input
    let methodsToSave = [...methods];
    if (customName.trim()) {
      methodsToSave = [
        ...methods,
        {
          id: Math.random(),
          name: customName.trim(),
          isActive: false,
        },
      ];
    }

    // Prepare data for API
    const paymentMethodsData = methodsToSave.map(({ name, isActive }) => ({
      name,
      isActive,
    }));

    console.log("Saving payment methods:", paymentMethodsData);

    showToast(
      "success",
      "Payment Methods",
      "Payment Methods updated successfully",
    );

    setLoading(false);
    onClose();
  };

  return (
    <Modal
      size="sm"
      image={SettingFiles.PaymentMethods}
      isOpen={isOpen}
      onClose={onClose}
      title="Payment Methods"
      subtitle="Add Multiple Payment methods"
    >
      <div className="space-y-4">
        <PaymentBanner heading="Activate Payment Methods for your Business" />
        <div className="flex flex-col gap-6">
          {methods.map((method) => {
            const isDefault = defaultMethods.some(
              (def) => def.name === method.name,
            );
            const isCustom = !isDefault;

            return (
              <div
                key={method.id}
                className={`flex items-center justify-between p-4 border rounded-lg ${
                  method.isActive
                    ? "border-[#15BA5C] bg-[#15BA5C]/5"
                    : "border-[#D1D1D1]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-[#1C1B20]">
                    {method.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={method.isActive}
                    onChange={(enabled) => handleToggle(method.id, enabled)}
                  />
                  {/* Only show delete button for custom methods */}
                  {isCustom && (
                    <button
                      onClick={() => handleDelete(method.id, method.name)}
                      className="text-red-500 hover:text-red-700 transition"
                      title="Delete custom payment method"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {/* Show custom payment method form only when "Others" is toggled on */}
        {methods.find(
          (method) => method.name === "Others" && method.isActive,
        ) && (
          <div className="mt-5 flex flex-col gap-3 mb-7 rounded-lg">
            <label className="text-[#1C1B20] font-bold text-[16px]">
              Name of Payment Method
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Enter the Name of the Payment Method"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customName.trim()) {
                    handleCustomSubmit();
                  }
                }}
                className="flex-1 bg-[#FAFAFC] border border-[#D1D1D1] outline-none rounded-[10px] px-4 py-3 focus:border-[#15BA5C] transition"
              />
            </div>
            <button
              onClick={handleCustomSubmit}
              className="w-full hover:bg-[#15BA5C] hover:text-white border border-[#15BA5C] py-[9.8px] text-[#15BA5C] rounded-[9.8px] text-[15px] font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!customName.trim()}
            >
              + Add a Payment Method
            </button>
          </div>
        )}
        <div className="flex justify-end mt-6">
          <button
            onClick={handleSave}
            className={`w-full text-white h-12 rounded-lg transition font-medium bg-[#15BA5C] hover:bg-[#129b4f] cursor-pointer`}
            // disabled={!unsaved || loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

interface PaymentBannerProps {
  className?: string;
  heading: string;
}

const PaymentBanner: React.FC<PaymentBannerProps> = ({
  className = "",
  heading,
}) => {
  return (
    <div
      className={`relative bg-[#15BA5C] rounded-lg px-6 py-6 overflow-hidden ${className}`}
    >
      <h2 className="text-white text-lg font-medium relative z-10">
        {heading}
      </h2>
      <div className="absolute right-0 bottom-1/2 transform -translate-y-1/2 pointer-events-none">
        <div className="absolute w-40 h-40 border-2 border-white/30 rounded-full -top-24 -right-20"></div>
        <div className="absolute w-24 h-24 border-2 border-white/40 rounded-full -top-12 -right-10"></div>
        <div className="absolute w-5 h-5 bg-white rounded-full -top-3 right-10"></div>
        <div className="absolute w-8 h-8 bg-green-900 rounded-full top-2 right-2"></div>
      </div>
    </div>
  );
};
