import React, { useState, useEffect, useRef } from "react";
import { Modal } from "../ui/Modal";
import SettingFiles from "@/assets/icons/settings";
import { Input } from "../ui/Input";
import { Percent, Wallet } from "lucide-react";
import useToastStore from "@/stores/toastStore";
import { useBusinessStore } from "@/stores/useBusinessStore";

interface PriceTier {
  id: string | number;
  name: string;
  description: string;
  pricingRules: {
    markupPercentage?: number;
    discountPercentage?: number;
    fixedMarkup?: number;
    fixedDiscount?: number;
  };
  isActive: boolean;
  isEditing?: boolean;
  isNew?: boolean;
}

interface PriceTierFormRef {
  addPendingTier: () => PriceTier | null;
  getPendingTier: () => PriceTier | null;
  resetForm: () => void;
  hasFormData: () => boolean;
}

interface PriceTierFormProps {
  onAdd: (tier: Omit<PriceTier, "id" | "isActive">) => void;
}

interface PriceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

let tempIdCounter = -1;

export const PriceSettingsModal: React.FC<PriceSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { selectedOutlet, updateOutletLocal } = useBusinessStore();
  const [tiers, setTiers] = useState<PriceTier[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<{
    [key: string | number]: boolean;
  }>({});
  const [, setIsEditing] = useState<{ [key: string | number]: boolean }>({});
  const [isUpdating, setIsUpdating] = useState<{
    [key: string | number]: boolean;
  }>({});
  const priceTierFormRef = useRef<PriceTierFormRef>(null);
  const { showToast } = useToastStore();

  useEffect(() => {
    if (isOpen && selectedOutlet?.priceTier) {
      try {
        const parsedTiers =
          typeof selectedOutlet.priceTier === "string"
            ? JSON.parse(selectedOutlet.priceTier)
            : selectedOutlet.priceTier;

        const loadedTiers = (Array.isArray(parsedTiers) ? parsedTiers : []).map(
          (t: any) => ({
            ...t,
            isActive: t.isActive ?? true,
            isNew: false,
          }),
        );
        setTiers(loadedTiers);
      } catch (e) {
        console.error("Failed to parse price tiers", e);
        setTiers([]);
      }
    } else if (isOpen && !selectedOutlet?.priceTier) {
      setTiers([]);
    }
  }, [isOpen, selectedOutlet?.id]);

  useEffect(() => {
    if (!isOpen) {
      setTiers([]);
      setIsSaving(false);
      setIsDeleting({});
      setIsEditing({});
      setIsUpdating({});
      priceTierFormRef.current?.resetForm();
    }
  }, [isOpen]);

  const addTier = async (tier: Omit<PriceTier, "id" | "isActive">) => {
    setIsSaving(true);
    const newTier: PriceTier = {
      ...tier,
      id: tempIdCounter--,
      isActive: true,
      isNew: true,
    };

    try {
      if (selectedOutlet) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { isNew, isEditing, ...rest } = newTier;
        const result = await (window as any).electronAPI.addPaymentTier({
          outletId: selectedOutlet.id,
          tier: rest,
        });

        if (result.success) {
          updateOutletLocal(selectedOutlet.id, { priceTier: result.tiers });
          setTiers((prev) => [...prev, { ...result.tier, isNew: false }]);
          showToast(
            "success",
            "Create Successful!",
            "Price tier created successfully",
          );
        } else {
          throw new Error(result.message || "Failed to create tier");
        }
      } else {
        setTiers((prev) => [...prev, newTier]);
      }
    } catch (error: unknown) {
      console.error("Failed to create tier:", error);
      showToast(
        "error",
        "Create Failed",
        (error as Error).message || "Failed to create price tier",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTier = async (id: string | number) => {
    const tierToDelete = tiers.find((t) => t.id === id);
    setIsDeleting((prev) => ({ ...prev, [id]: true }));

    try {
      if (tierToDelete?.isNew) {
        setTiers((prev) => prev.filter((t) => t.id !== id));
        return;
      }

      if (selectedOutlet) {
        const result = await (window as any).electronAPI.deletePaymentTier({
          outletId: selectedOutlet.id,
          tierId: id,
        });

        if (result.success) {
          updateOutletLocal(selectedOutlet.id, { priceTier: result.tiers });
          setTiers((prev) => prev.filter((t) => t.id !== id));
          showToast(
            "success",
            "Delete Successful!",
            "Price tier deleted successfully",
          );
          onClose();
        } else {
          throw new Error(result.message || "Failed to delete tier");
        }
      }
    } catch (error: unknown) {
      console.error("Failed to delete tier:", error);
      showToast(
        "error",
        "Delete Failed",
        (error as Error).message ||
          "Failed to delete price tier. Please confirm it is not a default tier",
      );
    } finally {
      setIsDeleting((prev) => ({ ...prev, [id]: false }));
    }
  };

  const toggleEdit = (id: string | number) => {
    setTiers((prev) =>
      prev.map((tier) =>
        tier.id === id ? { ...tier, isEditing: !tier.isEditing } : tier,
      ),
    );
    setIsEditing((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const updateTier = async (
    id: string | number,
    updatedTier: Partial<PriceTier>,
  ) => {
    const tier = tiers.find((t) => t.id === id);
    if (!tier) return;

    setIsUpdating((prev) => ({ ...prev, [id]: true }));

    try {
      if (selectedOutlet) {
        const result = await (window as any).electronAPI.editPaymentTier({
          outletId: selectedOutlet.id,
          tier: { ...tier, ...updatedTier, isEditing: false },
        });

        if (result.success) {
          updateOutletLocal(selectedOutlet.id, { priceTier: result.tiers });
          setTiers((prev) =>
            prev.map((t) =>
              t.id === id ? { ...t, ...updatedTier, isEditing: false } : t,
            ),
          );
          setIsEditing((prev) => ({ ...prev, [id]: false }));
          showToast(
            "success",
            "Update Successful!",
            "Price tier updated successfully",
          );
          onClose();
        } else {
          throw new Error(result.message || "Failed to update tier");
        }
      }
    } catch (error: unknown) {
      console.error("Failed to update tier:", error);
      showToast(
        "error",
        "Update Failed",
        (error as { data?: { message?: string }; message?: string })?.data
          ?.message ||
          (error as { message?: string })?.message ||
          "Failed to update price tier",
      );
    } finally {
      setIsUpdating((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleSaveAll = async () => {
    // This function might be redundant if all operations are granular now.
    // However, if the user fills the form and clicks "Save Price Tiers" instead of "Add",
    // we should treat it as an Add operation for the pending tier.
    // Or if "Save Price Tiers" is meant to be a bulk update (which we are moving away from).

    // For now, let's keep it but make it use granular add for pending tier,
    // or if no pending tier, maybe just show a success message as everything is already saved.

    setIsSaving(true);
    try {
      const formRef = priceTierFormRef.current;
      const hasFormData = formRef?.hasFormData();

      if (hasFormData) {
        const pendingTier = formRef?.addPendingTier();
        if (pendingTier) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, isNew, isEditing, ...rest } = pendingTier;
          await addTier(rest);
          formRef?.resetForm();
          onClose();
          return;
        }
      }

      // If no form data, we can just say saved successfully since other ops are immediate
      showToast(
        "success",
        "Save Successful!",
        "All price tiers saved successfully!",
      );
      onClose();
    } catch (error: unknown) {
      console.error("Failed to save tiers:", error);
      const errorMessage =
        (error as { message?: string })?.message ||
        "An error occurred while saving price tiers";
      showToast("error", "Save Failed", errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const getDisplayValue = (tier: PriceTier) => {
    const rules = tier.pricingRules;
    const markup = rules.markupPercentage || rules.fixedMarkup || 0;
    const discount = rules.discountPercentage || rules.fixedDiscount || 0;
    const markupType = rules.markupPercentage ? "percentage" : "absolute";
    const discountType = rules.discountPercentage ? "percentage" : "absolute";
    return { markup, discount, markupType, discountType };
  };

  return (
    <Modal
      size="md"
      subtitle="Add, create and remove price tiers"
      image={SettingFiles.PriceTier}
      isOpen={isOpen}
      onClose={onClose}
      title="Price Settings"
    >
      <div className="space-y-6">
        {tiers.length > 0 &&
          tiers.map((tier) => {
            const { markup, discount, markupType, discountType } =
              getDisplayValue(tier);
            const isCurrentlyDeleting = isDeleting[tier.id];
            const isCurrentlyUpdating = isUpdating[tier.id] || false;

            return (
              <div
                key={tier.id}
                className="rounded-lg p-4 border border-gray-200"
              >
                {tier.isEditing ? (
                  <EditableTierForm
                    tier={tier}
                    onSave={async (updatedTier) => {
                      await updateTier(tier.id, {
                        ...updatedTier,
                        isEditing: false,
                      });
                    }}
                    onCancel={() => toggleEdit(tier.id)}
                    isLoading={isCurrentlyUpdating}
                  />
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{tier.name}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleEdit(tier.id)}
                          type="button"
                          disabled={isCurrentlyDeleting || isCurrentlyUpdating}
                          className={`bg-[#15BA5C] flex items-center rounded-[20px] px-2.5 py-1.5 transition-colors ${
                            isCurrentlyDeleting || isCurrentlyUpdating
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-[#13a552]"
                          }`}
                        >
                          <img
                            src={SettingFiles.EditIcon}
                            alt="Edit"
                            className="h-[14px] w-[14px] mr-1"
                          />
                          <span className="text-white">Edit</span>
                        </button>
                        <button
                          onClick={() => deleteTier(tier.id)}
                          type="button"
                          disabled={isCurrentlyDeleting || isCurrentlyUpdating}
                          className={`border border-[#E33629] flex items-center rounded-[20px] px-2.5 py-1.5 transition-colors ${
                            isCurrentlyDeleting || isCurrentlyUpdating
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-red-50"
                          }`}
                        >
                          <img
                            src={SettingFiles.TrashIcon}
                            alt="Delete"
                            className="h-[14px] w-[14px] mr-1"
                          />
                          <span className="text-[#E33629]">
                            {isCurrentlyDeleting ? "Deleting..." : "Delete"}
                          </span>
                        </button>
                      </div>
                    </div>
                    {tier.description && (
                      <div className="text-sm text-gray-600 mb-2">
                        {tier.description}
                      </div>
                    )}
                    <div className="text-sm text-gray-600 space-y-2">
                      {markup > 0 && (
                        <div className="border border-[#E6E6E6] px-3.5 py-2.5 rounded-[12px]">
                          Markup: {markup}
                          {markupType === "percentage" ? "%" : ""}
                        </div>
                      )}
                      {discount > 0 && (
                        <div className="border border-[#E6E6E6] px-3.5 py-2.5 rounded-[12px]">
                          Discount: {discount}
                          {discountType === "percentage" ? "%" : ""}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}

        <div>
          <h4 className="font-medium mb-4">Add New Price Tier</h4>
          <PriceTierForm ref={priceTierFormRef} onAdd={addTier} />
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className={`w-full cursor-pointer text-white py-3 rounded-[10px] font-medium text-base transition-colors ${
              isSaving
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#15BA5C] hover:bg-[#13a552]"
            }`}
            type="button"
          >
            {isSaving ? "Saving..." : "Save Price Tiers"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

interface PaymentTierModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentTierModal: React.FC<PaymentTierModalProps> = ({
  isOpen,
  onClose,
}) => {
  return <PriceSettingsModal isOpen={isOpen} onClose={onClose} />;
};

interface EditableTierFormProps {
  tier: PriceTier;
  onSave: (tier: Partial<PriceTier>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const EditableTierForm: React.FC<EditableTierFormProps> = ({
  tier,
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const { showToast } = useToastStore();
  const [editedTier, setEditedTier] = useState({
    name: tier.name,
    description: tier.description || "",
    markupValue:
      tier.pricingRules.markupPercentage || tier.pricingRules.fixedMarkup || 0,
    discountValue:
      tier.pricingRules.discountPercentage ||
      tier.pricingRules.fixedDiscount ||
      0,
  });

  const [markupEnabled, setMarkupEnabled] = useState(
    (tier.pricingRules.markupPercentage || tier.pricingRules.fixedMarkup || 0) >
      0,
  );
  const [discountEnabled, setDiscountEnabled] = useState(
    (tier.pricingRules.discountPercentage ||
      tier.pricingRules.fixedDiscount ||
      0) > 0,
  );

  const [valueType, setValueType] = useState<"percentage" | "absolute">(
    tier.pricingRules.fixedMarkup || tier.pricingRules.fixedDiscount
      ? "absolute"
      : "percentage",
  );

  const handleMarkupToggle = (enabled: boolean) => {
    setMarkupEnabled(enabled);
    if (enabled) {
      setDiscountEnabled(false);
      setEditedTier((prev) => ({ ...prev, discountValue: 0 }));
    } else {
      setEditedTier((prev) => ({ ...prev, markupValue: 0 }));
    }
  };

  const handleDiscountToggle = (enabled: boolean) => {
    setDiscountEnabled(enabled);
    if (enabled) {
      setMarkupEnabled(false);
      setEditedTier((prev) => ({ ...prev, markupValue: 0 }));
    } else {
      setEditedTier((prev) => ({ ...prev, discountValue: 0 }));
    }
  };

  const handleSave = async () => {
    if (!editedTier.name || editedTier.name.trim() === "") {
      showToast(
        "error",
        "Please enter a price tier name.",
        "Please enter a price tier name.",
      );
      return;
    }

    await onSave({
      name: editedTier.name.trim(),
      description: editedTier.description.trim(),
      pricingRules: {
        markupPercentage:
          markupEnabled && valueType === "percentage"
            ? editedTier.markupValue
            : 0,
        discountPercentage:
          discountEnabled && valueType === "percentage"
            ? editedTier.discountValue
            : 0,
        fixedMarkup:
          markupEnabled && valueType === "absolute"
            ? editedTier.markupValue
            : 0,
        fixedDiscount:
          discountEnabled && valueType === "absolute"
            ? editedTier.discountValue
            : 0,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Price Tier Name
        </label>
        <input
          type="text"
          className="w-full px-4 py-3 bg-white border border-[#D1D1D1] outline-none rounded-lg"
          value={editedTier.name}
          onChange={(e) =>
            setEditedTier({ ...editedTier, name: e.target.value })
          }
          placeholder="Enter the name of the Price Tier"
          disabled={isLoading}
        />
      </div>
      <div>
        <label className="text-sm flex items-center gap-1.5 font-medium mb-1">
          <span>Description</span>
          <span className="text-[#15BA5C]">(optional)</span>
        </label>
        <textarea
          className="w-full px-4 py-3 bg-white border border-gray-300 outline-none rounded-lg resize-none text-sm"
          value={editedTier.description}
          onChange={(e) =>
            setEditedTier({ ...editedTier, description: e.target.value })
          }
          placeholder="Enter description"
          rows={3}
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Value Type</label>
        <div className="flex gap-4 p-1 bg-gray-100 rounded-lg">
          <button
            type="button"
            onClick={() => setValueType("percentage")}
            className={`flex-1 cursor-pointer flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
              valueType === "percentage"
                ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Percent className="w-4 h-4" />
            Percentage
          </button>
          <button
            type="button"
            onClick={() => setValueType("absolute")}
            className={`flex-1 cursor-pointer flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
              valueType === "absolute"
                ? "bg-[#15BA5C] text-white shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Wallet className="w-4 h-4" />
            Absolute
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id={`markup-checkbox-${tier.id}`}
            checked={markupEnabled}
            onChange={(e) => handleMarkupToggle(e.target.checked)}
            className="appearance-none w-3 h-3 border-2 border-[#15BA5C] rounded-full checked:bg-[#15BA5C] checked:border-[#15BA5C] focus:outline-none focus:ring-2 focus:ring-[#15BA5C] cursor-pointer"
            disabled={isLoading}
          />
          <label
            htmlFor={`markup-checkbox-${tier.id}`}
            className="text-sm font-medium"
          >
            {valueType === "percentage" ? "Markup %" : "Markup"}
          </label>
        </div>
        {markupEnabled && (
          <Input
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg outline-none"
            type="number"
            min={0}
            max={valueType === "percentage" ? 100 : undefined}
            value={editedTier.markupValue || ""}
            onChange={(e) =>
              setEditedTier({
                ...editedTier,
                markupValue: parseFloat(e.target.value) || 0,
              })
            }
            placeholder={
              valueType === "percentage"
                ? "Enter markup percentage"
                : "Enter markup amount"
            }
            disabled={isLoading}
          />
        )}
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id={`discount-checkbox-${tier.id}`}
            checked={discountEnabled}
            onChange={(e) => handleDiscountToggle(e.target.checked)}
            className="appearance-none w-3 h-3 border-2 border-[#15BA5C] rounded-full checked:bg-[#15BA5C] checked:border-[#15BA5C] focus:outline-none focus:ring-2 focus:ring-[#15BA5C] cursor-pointer"
            disabled={isLoading}
          />
          <label
            htmlFor={`discount-checkbox-${tier.id}`}
            className="text-sm font-medium"
          >
            {valueType === "percentage" ? "Discount %" : "Discount"}
          </label>
        </div>
        {discountEnabled && (
          <Input
            type="number"
            min={0}
            max={valueType === "percentage" ? 100 : undefined}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg outline-none"
            value={editedTier.discountValue || ""}
            onChange={(e) =>
              setEditedTier({
                ...editedTier,
                discountValue: parseFloat(e.target.value) || 0,
              })
            }
            placeholder={
              valueType === "percentage"
                ? "Enter discount percentage"
                : "Enter discount amount"
            }
            disabled={isLoading}
          />
        )}
      </div>
      <div className="flex gap-2 pt-2">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className={`flex-1 text-white py-2.5 rounded-[10px] font-medium text-base transition-colors ${
            isLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#15BA5C] hover:bg-[#13a552]"
          }`}
          type="button"
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </button>
        <button
          onClick={onCancel}
          disabled={isLoading}
          className={`flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-[10px] font-medium text-base transition-colors ${
            isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
          }`}
          type="button"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export const PriceTierForm = React.forwardRef<
  PriceTierFormRef,
  PriceTierFormProps
>(({ onAdd }, ref) => {
  const [tier, setTier] = useState({
    name: "",
    description: "",
    markupValue: 0,
    discountValue: 0,
  });
  const [markupEnabled, setMarkupEnabled] = useState(false);
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [valueType, setValueType] = useState<"percentage" | "absolute">(
    "percentage",
  );
  const { showToast } = useToastStore();

  const handleMarkupToggle = (enabled: boolean) => {
    setMarkupEnabled(enabled);
    if (enabled) {
      setDiscountEnabled(false);
      setTier((prev) => ({ ...prev, discountValue: 0 }));
    }
  };

  const handleDiscountToggle = (enabled: boolean) => {
    setDiscountEnabled(enabled);
    if (enabled) {
      setMarkupEnabled(false);
      setTier((prev) => ({ ...prev, markupValue: 0 }));
    }
  };

  const resetForm = () => {
    setTier({
      name: "",
      description: "",
      markupValue: 0,
      discountValue: 0,
    });
    setMarkupEnabled(false);
    setDiscountEnabled(false);
    setValueType("percentage");
  };

  const hasFormData = () => {
    return tier.name.trim() !== "" || tier.description.trim() !== "";
  };

  const createTierObject = (): PriceTier => {
    return {
      id: tempIdCounter--,
      name: tier.name.trim(),
      description: tier.description.trim(),
      pricingRules: {
        markupPercentage:
          markupEnabled && valueType === "percentage" ? tier.markupValue : 0,
        discountPercentage:
          discountEnabled && valueType === "percentage"
            ? tier.discountValue
            : 0,
        fixedMarkup:
          markupEnabled && valueType === "absolute" ? tier.markupValue : 0,
        fixedDiscount:
          discountEnabled && valueType === "absolute" ? tier.discountValue : 0,
      },
      isActive: true,
      isNew: true,
    };
  };

  const addTierInternal = () => {
    if (!tier.name || tier.name.trim() === "") {
      return false;
    }
    const newTier = {
      name: tier.name.trim(),
      description: tier.description.trim(),
      pricingRules: {
        markupPercentage:
          markupEnabled && valueType === "percentage" ? tier.markupValue : 0,
        discountPercentage:
          discountEnabled && valueType === "percentage"
            ? tier.discountValue
            : 0,
        fixedMarkup:
          markupEnabled && valueType === "absolute" ? tier.markupValue : 0,
        fixedDiscount:
          discountEnabled && valueType === "absolute" ? tier.discountValue : 0,
      },
    };
    onAdd(newTier);
    resetForm();
    return true;
  };

  React.useImperativeHandle(ref, () => ({
    getPendingTier: () => {
      const hasRule = markupEnabled || discountEnabled;
      if (tier.name.trim() !== "" && hasRule) {
        return createTierObject();
      }
      return null;
    },
    addPendingTier: () => {
      const hasRule = markupEnabled || discountEnabled;
      if (tier.name.trim() !== "" && hasRule) {
        const newTier = createTierObject();
        // onAdd is removed to prevent double creation when called from handleSaveAll
        resetForm();
        return newTier;
      }
      showToast(
        "error",
        "Price tier must have either a markup or discount rule.",
        "Price tier must have either a markup or discount rule.",
      );
      return null;
    },
    resetForm,
    hasFormData,
  }));

  const handleAdd = () => {
    if (!tier.name || tier.name.trim() === "") {
      showToast(
        "error",
        "Please enter a price tier name.",
        "Please enter a price tier name.",
      );
      return;
    }
    const hasRule = markupEnabled || discountEnabled;
    if (!hasRule) {
      showToast(
        "error",
        "Please select a pricing rule (markup or discount).",
        "Please select a pricing rule (markup or discount).",
      );
      return;
    }
    addTierInternal();
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Price Tier Name
        </label>
        <input
          type="text"
          className="w-full px-4 py-3 bg-white border outline-none border-[#D1D1D1] rounded-lg"
          value={tier.name}
          onChange={(e) => setTier({ ...tier, name: e.target.value })}
          placeholder="Enter the name of the Price Tier"
        />
      </div>
      <div>
        <label className="text-sm flex items-center gap-1.5 font-medium mb-1">
          <span>Description</span>
          <span className="text-[#15BA5C]">(optional)</span>
        </label>
        <textarea
          className="w-full px-4 py-3 bg-white border border-[#D1D1D1] outline-none rounded-lg resize-none text-sm"
          value={tier.description}
          onChange={(e) => setTier({ ...tier, description: e.target.value })}
          placeholder="Enter description"
          rows={3}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Value Type</label>
        <div className="flex gap-4 p-1 bg-gray-100 rounded-lg">
          <button
            type="button"
            onClick={() => setValueType("percentage")}
            className={`flex-1 cursor-pointer flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
              valueType === "percentage"
                ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Percent className="w-4 h-4" />
            Percentage
          </button>
          <button
            type="button"
            onClick={() => setValueType("absolute")}
            className={`flex-1 cursor-pointer flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
              valueType === "absolute"
                ? "bg-[#15BA5C] text-white shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Wallet className="w-4 h-4" />
            Absolute
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="new-markup-checkbox"
            checked={markupEnabled}
            onChange={(e) => handleMarkupToggle(e.target.checked)}
            className="appearance-none w-3 h-3 border-2 border-[#15BA5C] rounded-full checked:bg-[#15BA5C] checked:border-[#15BA5C] focus:outline-none focus:ring-2 focus:ring-[#15BA5C] cursor-pointer"
          />
          <label htmlFor="new-markup-checkbox" className="text-sm font-medium">
            {valueType === "percentage" ? "Markup %" : "Markup"}
          </label>
        </div>
        {markupEnabled && (
          <Input
            className="w-full px-4 py-3 bg-white border border-[#D1D1D1] rounded-lg outline-none"
            type="number"
            min={0}
            max={valueType === "percentage" ? 100 : undefined}
            value={tier.markupValue || ""}
            onChange={(e) =>
              setTier({
                ...tier,
                markupValue: parseFloat(e.target.value) || 0,
              })
            }
            placeholder={
              valueType === "percentage"
                ? "Enter markup percentage"
                : "Enter markup amount"
            }
          />
        )}
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="new-discount-checkbox"
            checked={discountEnabled}
            onChange={(e) => handleDiscountToggle(e.target.checked)}
            className="appearance-none w-3 h-3 border-2 border-[#15BA5C] rounded-full checked:bg-[#15BA5C] checked:border-[#15BA5C] focus:outline-none focus:ring-2 focus:ring-[#15BA5C] cursor-pointer"
          />
          <label
            htmlFor="new-discount-checkbox"
            className="text-sm font-medium"
          >
            {valueType === "percentage" ? "Discount %" : "Discount"}
          </label>
        </div>
        {discountEnabled && (
          <Input
            type="number"
            min={0}
            max={valueType === "percentage" ? 100 : undefined}
            className="w-full px-4 py-3 bg-white border border-[#D1D1D1] rounded-lg outline-none"
            value={tier.discountValue || ""}
            onChange={(e) =>
              setTier({
                ...tier,
                discountValue: parseFloat(e.target.value) || 0,
              })
            }
            placeholder={
              valueType === "percentage"
                ? "Enter discount percentage"
                : "Enter discount amount"
            }
          />
        )}
      </div>
      <button
        onClick={handleAdd}
        className="border cursor-pointer border-[#15BA5C] w-full text-[#15BA5C] py-2.5 rounded-[10px] font-medium text-base mt-4 hover:bg-green-50 transition-colors"
        type="button"
      >
        + Add a new Price Tier
      </button>
    </div>
  );
});

PriceTierForm.displayName = "PriceTierForm";
