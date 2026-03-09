import React, { useState, useMemo } from "react";
import { X, User, Building2, Plus, Trash2, ChevronDown } from "lucide-react";
import { Button } from "../../settings/ui/Button";
import { PhoneInput } from "../../settings/ui/PhoneInput";
import { getPhoneCountries, PhoneCountry } from "@/utils/getPhoneCountries";
import useBusinessStore from "@/stores/useBusinessStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateCustomerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateCustomer = ({ isOpen, onClose }: CreateCustomerProps) => {
  const { selectedOutlet } = useBusinessStore();
  const [customerType, setCustomerType] = useState<
    "Individual" | "Organization"
  >("Individual");

  const pricingTiers = useMemo(() => {
    if (!selectedOutlet?.priceTier) return [];
    try {
      const tiers =
        typeof selectedOutlet.priceTier === "string"
          ? JSON.parse(selectedOutlet.priceTier)
          : selectedOutlet.priceTier;
      return Array.isArray(tiers) ? tiers : [];
    } catch (e) {
      console.error("Failed to parse pricing tiers", e);
      return [];
    }
  }, [selectedOutlet]);

  const phoneCountries = useMemo(() => getPhoneCountries(), []);
  const [phoneNumbers, setPhoneNumbers] = useState<
    { number: string; country: PhoneCountry }[]
  >([{ number: "", country: phoneCountries[0] }]);
  const [emails, setEmails] = useState<string[]>([""]);
  const [representativeNames, setRepresentativeNames] = useState<string[]>([
    "",
  ]);
  const [organizationAddresses, setOrganizationAddresses] = useState<string[]>([
    "",
  ]);
  const [pricingTier, setPricingTier] = useState<string>("");
  const [paymentTerm, setPaymentTerm] = useState<string>("");
  const [isPricingTierOpen, setIsPricingTierOpen] = useState(false);
  const [isPaymentTermOpen, setIsPaymentTermOpen] = useState(false);

  const addPhoneNumber = () => {
    setPhoneNumbers((prev) => [
      ...prev,
      { number: "", country: phoneCountries[0] },
    ]);
  };

  const removePhoneNumber = (index: number) => {
    if (phoneNumbers.length > 1) {
      setPhoneNumbers((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updatePhoneNumber = (
    index: number,
    updates: Partial<{ number: string; country: PhoneCountry }>,
  ) => {
    setPhoneNumbers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  };

  const addField = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => [...prev, ""]);
  };

  const removeField = (
    index: number,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    fields: string[],
  ) => {
    if (fields.length > 1) {
      setter((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updateField = (
    index: number,
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setter((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/20 backdrop-blur-sm transition-all duration-300">
      <div
        className="h-full w-full max-w-[600px] bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-start justify-between bg-white sticky top-0 z-10">
          <div className="space-y-1 pr-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Create Customer
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              A simple and efficient way to create new customer profiles. By
              filling out the form below, you can seamlessly capture essential
              details, ensuring a personalized and memorable experience for your
              customers.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0 cursor-pointer"
          >
            <X className="size-6 text-gray-400" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 custom-scrollbar">
          {/* Customer Type */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700">
              Customer Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setCustomerType("Individual")}
                className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border transition-all cursor-pointer ${
                  customerType === "Individual"
                    ? "border-[#15BA5C] bg-[#15BA5C0D] text-[#15BA5C] ring-1 ring-[#15BA5C]"
                    : "border-gray-200 text-gray-400 hover:border-gray-300 bg-white"
                }`}
              >
                <User className="size-5" />
                <span className="font-medium">Individual</span>
              </button>
              <button
                onClick={() => setCustomerType("Organization")}
                className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border transition-all cursor-pointer ${
                  customerType === "Organization"
                    ? "border-[#15BA5C] bg-[#15BA5C0D] text-[#15BA5C] ring-1 ring-[#15BA5C]"
                    : "border-gray-200 text-gray-400 hover:border-gray-300 bg-white"
                }`}
              >
                <Building2 className="size-5" />
                <span className="font-medium">Organization</span>
              </button>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700">
              {customerType === "Organization"
                ? "Customer / Organization Name"
                : "Customer Name"}
            </label>
            <input
              type="text"
              placeholder="Enter name"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#15BA5C0D] focus:border-[#15BA5C] transition-all text-sm"
            />
          </div>

          {/* Representative Phone Number(s) */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700">
              {customerType === "Organization"
                ? "Representative Phone Number(s)"
                : "Phone Number(s)"}
            </label>
            <div className="space-y-3">
              {phoneNumbers.map((phoneEntry, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <PhoneInput
                    value={phoneEntry.number}
                    onChange={(val) =>
                      updatePhoneNumber(index, { number: val })
                    }
                    selectedCountry={phoneEntry.country}
                    onCountryChange={(country) =>
                      updatePhoneNumber(index, { country })
                    }
                    className="flex-1"
                    placeholder="Enter Phone Number"
                  />
                  {phoneNumbers.length > 1 && (
                    <button
                      onClick={() => removePhoneNumber(index)}
                      className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0 cursor-pointer"
                    >
                      <Trash2 className="size-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addPhoneNumber}
              className="text-[#15BA5C] text-sm font-semibold flex items-center gap-1.5 hover:underline cursor-pointer transition-all"
            >
              <Plus className="size-4" />
              <span>Add new</span>
            </button>
          </div>

          {/* Email Address(es) */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700">
              {customerType === "Organization"
                ? "Customer / Organization Email Address"
                : "Customer Email Address"}
            </label>
            <div className="space-y-3">
              {emails.map((email, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      updateField(index, e.target.value, setEmails)
                    }
                    placeholder="Enter email address"
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#15BA5C0D] focus:border-[#15BA5C] transition-all text-sm"
                  />
                  {emails.length > 1 && (
                    <button
                      onClick={() => removeField(index, setEmails, emails)}
                      className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0 cursor-pointer"
                    >
                      <Trash2 className="size-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => addField(setEmails)}
              className="text-[#15BA5C] text-sm font-semibold flex items-center gap-1.5 hover:underline cursor-pointer transition-all"
            >
              <Plus className="size-4" />
              <span>Add new</span>
            </button>
          </div>

          {customerType === "Organization" && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700">
                Representative Full Name(s)
              </label>
              <div className="space-y-3">
                {representativeNames.map((name, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) =>
                        updateField(
                          index,
                          e.target.value,
                          setRepresentativeNames,
                        )
                      }
                      placeholder="Enter representative name"
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#15BA5C0D] focus:border-[#15BA5C] transition-all text-sm"
                    />
                    {representativeNames.length > 1 && (
                      <button
                        onClick={() =>
                          removeField(
                            index,
                            setRepresentativeNames,
                            representativeNames,
                          )
                        }
                        className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0 cursor-pointer"
                      >
                        <Trash2 className="size-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => addField(setRepresentativeNames)}
                className="text-[#15BA5C] text-sm font-semibold flex items-center gap-1.5 hover:underline cursor-pointer transition-all"
              >
                <Plus className="size-4" />
                <span>Add new</span>
              </button>
            </div>
          )}

          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700">
              {customerType === "Organization"
                ? "Organization Address"
                : "Address"}
            </label>
            <div className="space-y-3">
              {organizationAddresses.map((address, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) =>
                      updateField(
                        index,
                        e.target.value,
                        setOrganizationAddresses,
                      )
                    }
                    placeholder="Enter address"
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#15BA5C0D] focus:border-[#15BA5C] transition-all text-sm"
                  />
                  {organizationAddresses.length > 1 && (
                    <button
                      onClick={() =>
                        removeField(
                          index,
                          setOrganizationAddresses,
                          organizationAddresses,
                        )
                      }
                      className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0 cursor-pointer"
                    >
                      <Trash2 className="size-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => addField(setOrganizationAddresses)}
              className="text-[#15BA5C] text-sm font-semibold flex items-center gap-1.5 hover:underline cursor-pointer transition-all"
            >
              <Plus className="size-4" />
              <span>Add new</span>
            </button>
          </div>

          <div className="flex flex-col gap-6">
            {/* Payment Term */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Payment Term
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsPaymentTermOpen(!isPaymentTermOpen)}
                  className="w-full px-4 py-3.5 text-left bg-white rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#15BA5C0D] focus:border-[#15BA5C] transition-all flex items-center justify-between group cursor-pointer"
                >
                  <span
                    className={paymentTerm ? "text-gray-900" : "text-gray-500"}
                  >
                    {paymentTerm
                      ? paymentTerm
                          .split("-")
                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                          .join(" ")
                      : "Select a Payment Term"}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isPaymentTermOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isPaymentTermOpen && (
                  <div className="absolute z-[110] w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="py-1 max-h-60 overflow-y-auto custom-scrollbar">
                      {["Net 30", "Net 60", "Due on Receipt"].map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => {
                            setPaymentTerm(
                              term.toLowerCase().replace(/ /g, "-"),
                            );
                            setIsPaymentTermOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-[#15BA5C0D] hover:text-[#15BA5C] flex items-center justify-between group transition-colors"
                        >
                          <span className="text-sm font-medium">{term}</span>
                          {paymentTerm ===
                            term.toLowerCase().replace(/ /g, "-") && (
                            <div className="size-2 rounded-full bg-[#15BA5C]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing Tier */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Pricing Tier
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsPricingTierOpen(!isPricingTierOpen)}
                  className="w-full px-4 py-3.5 text-left bg-white rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#15BA5C0D] focus:border-[#15BA5C] transition-all flex items-center justify-between group cursor-pointer"
                >
                  <span
                    className={pricingTier ? "text-gray-900" : "text-gray-500"}
                  >
                    {pricingTiers.find(
                      (t: any) => (t.id || t.name) === pricingTier,
                    )?.name ||
                      pricingTier ||
                      "Select tier"}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isPricingTierOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isPricingTierOpen && (
                  <div className="absolute z-[110] w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="py-1 max-h-60 overflow-y-auto custom-scrollbar">
                      {pricingTiers.length > 0
                        ? pricingTiers.map((tier: any) => (
                            <button
                              key={tier.id || tier.name}
                              type="button"
                              onClick={() => {
                                setPricingTier(tier.id || tier.name);
                                setIsPricingTierOpen(false);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-[#15BA5C0D] hover:text-[#15BA5C] flex items-center justify-between group transition-colors"
                            >
                              <span className="text-sm font-medium">
                                {tier.name}
                              </span>
                              {pricingTier === (tier.id || tier.name) && (
                                <div className="size-2 rounded-full bg-[#15BA5C]" />
                              )}
                            </button>
                          ))
                        : ["Retail", "Wholesale", "VIP"].map((tier) => (
                            <button
                              key={tier}
                              type="button"
                              onClick={() => {
                                setPricingTier(tier.toLowerCase());
                                setIsPricingTierOpen(false);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-[#15BA5C0D] hover:text-[#15BA5C] flex items-center justify-between group transition-colors"
                            >
                              <span className="text-sm font-medium">
                                {tier}
                              </span>
                              {pricingTier === tier.toLowerCase() && (
                                <div className="size-2 rounded-full bg-[#15BA5C]" />
                              )}
                            </button>
                          ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 border-t border-gray-100 bg-white grid grid-cols-2 gap-4 sticky bottom-0">
          <Button
            onClick={() => {}}
            className="rounded-xl py-4 bg-[#15BA5C] hover:bg-[#119E4D] text-white font-bold text-base shadow-lg shadow-[#15BA5C33] transition-all active:scale-[0.98]"
          >
            Create Customer
          </Button>
          <Button
            onClick={onClose}
            variant="secondary"
            className="rounded-xl py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-base transition-all active:scale-[0.98]"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateCustomer;
