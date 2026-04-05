import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  User,
  Building2,
  Plus,
  Trash2,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Button } from "../../settings/ui/Button";
import { PhoneInput } from "../../settings/ui/PhoneInput";
import { getPhoneCountries, PhoneCountry } from "@/utils/getPhoneCountries";
import useBusinessStore from "@/stores/useBusinessStore";
import useToastStore from "@/stores/toastStore";
import useCustomerStore from "@/stores/useCustomerStore";

interface CreateCustomerProps {
  isOpen: boolean;
  onClose: () => void;
  fetchCustomers?: () => void;
}

const CreateCustomer = ({
  isOpen,
  onClose,
  fetchCustomers,
}: CreateCustomerProps) => {
  const { selectedOutlet } = useBusinessStore();
  const { fetchCustomers: refreshCustomers } = useCustomerStore();
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
  const { showToast } = useToastStore();
  const [pricingTier, setPricingTier] = useState<string>("");
  const [paymentTerm, setPaymentTerm] = useState<string>("");
  const [actualPaymentTerms, setActualPaymentTerms] = useState<any[]>([]);
  const [isPricingTierOpen, setIsPricingTierOpen] = useState(false);
  const [isPaymentTermOpen, setIsPaymentTermOpen] = useState(false);

  useEffect(() => {
    const fetchPaymentTerms = async () => {
      try {
        const api = (window as any).electronAPI;
        if (api && api.dbQuery && selectedOutlet?.id) {
          const result = await api.dbQuery(
            "SELECT id, name FROM payment_terms WHERE outletId = ? ORDER BY name ASC",
            [selectedOutlet.id],
          );
          if (result && Array.isArray(result)) {
            setActualPaymentTerms(result);
          }
        }
      } catch (error) {
        console.error("Failed to fetch payment terms:", error);
      }
    };

    if (isOpen) {
      fetchPaymentTerms();
    }
  }, [isOpen, selectedOutlet?.id]);

  const [customerName, setCustomerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const api = (window as any).electronAPI;
        if (api && api.getUser) {
          const user = await api.getUser();
          setCurrentUser(user);
        }
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      }
    };
    fetchUser();
  }, []);

  const resetForm = () => {
    setCustomerType("Individual");
    setPhoneNumbers([{ number: "", country: phoneCountries[0] }]);
    setEmails([""]);
    setRepresentativeNames([""]);
    setOrganizationAddresses([""]);
    setPricingTier("");
    setPaymentTerm("");
    setCustomerName("");
    setIsPricingTierOpen(false);
    setIsPaymentTermOpen(false);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const isFormValid = useMemo(() => {
    const isNameValid = customerName.trim() !== "";
    const arePhoneNumbersValid = phoneNumbers.every(
      (p) => p.number.trim() !== "",
    );
    const areEmailsValid = emails.every((e) => e.trim() !== "");
    const areAddressesValid = organizationAddresses.every(
      (a) => a.trim() !== "",
    );
    const areRepresentativeNamesValid =
      customerType === "Individual" ||
      representativeNames.every((n) => n.trim() !== "");
    const isPricingTierValid = pricingTier !== "";
    const isPaymentTermValid = paymentTerm !== "";

    return (
      isNameValid &&
      arePhoneNumbersValid &&
      areEmailsValid &&
      areAddressesValid &&
      areRepresentativeNamesValid &&
      isPricingTierValid &&
      isPaymentTermValid
    );
  }, [
    customerName,
    phoneNumbers,
    emails,
    organizationAddresses,
    representativeNames,
    customerType,
    pricingTier,
    paymentTerm,
  ]);

  const normalizeDialCode = (dialCode: string) => {
    const trimmed = String(dialCode || "").trim();
    if (!trimmed) return "";
    return trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
  };

  const normalizePhoneForStorage = (
    country: PhoneCountry,
    rawNumber: string,
  ) => {
    const input = String(rawNumber || "").trim();
    if (!input) return "";

    const compact = input.replace(/[^\d+]/g, "");
    if (compact.startsWith("+")) {
      return `+${compact.slice(1).replace(/\D/g, "")}`;
    }

    const dial = normalizeDialCode(country?.dialCode || "");
    const dialDigits = dial.replace(/\D/g, "");
    let digits = compact.replace(/\D/g, "");

    if (dialDigits && digits.startsWith(dialDigits)) {
      return `+${digits}`;
    }

    if (digits.startsWith("0")) {
      digits = digits.replace(/^0+/, "");
    }

    return dial ? `${dial}${digits}` : digits;
  };

  const handleCreateCustomer = async () => {
    if (!isFormValid) {
      showToast("error", "Validation Error", "Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const api = (window as any).electronAPI;
      if (!api) return;

      // Check for existing email or phone number
      const emailList = emails.map((e) => e.trim()).filter(Boolean);
      const formattedPhoneList = phoneNumbers
        .map((p) => normalizePhoneForStorage(p.country, p.number))
        .filter(Boolean);
      const phoneQueryList = Array.from(
        new Set(
          [
            ...formattedPhoneList,
            ...phoneNumbers.map((p) => String(p.number || "").trim()),
          ].filter(Boolean),
        ),
      );

      if (emailList.length > 0 || phoneQueryList.length > 0) {
        const emailPlaceholders = emailList.map(() => "?").join(",");
        const phonePlaceholders = phoneQueryList.map(() => "?").join(",");

        let checkQuery = `SELECT email, phoneNumber FROM customers WHERE outletId = ? AND (deletedAt IS NULL OR deletedAt = '') AND (`;
        const queryParts = [];
        const params = [selectedOutlet?.id];

        if (emailList.length > 0) {
          queryParts.push(`email IN (${emailPlaceholders})`);
          params.push(...emailList);
        }

        if (phoneQueryList.length > 0) {
          queryParts.push(`phoneNumber IN (${phonePlaceholders})`);
          params.push(...phoneQueryList);
        }

        checkQuery += queryParts.join(" OR ") + ")";

        const existingRecords = await api.dbQuery(checkQuery, params);

        if (existingRecords && existingRecords.length > 0) {
          showToast(
            "error",
            "Duplicate Customer",
            "A customer with this email or phone number already exists.",
          );
          setIsSubmitting(false);
          return;
        }
      }

      // Proceed with creation
      const emailValues = emails.map((e) => e.trim()).filter(Boolean);
      const phoneValues = formattedPhoneList;

      const payload = {
        id: crypto.randomUUID(),
        name: customerName,
        email: emailValues[0] || "",
        otherEmails: emailValues.slice(1),
        phoneNumber: phoneValues[0] || "",
        otherPhoneNumbers: phoneValues.slice(1),
        customerType: customerType.toLowerCase(),
        organizationName: customerType === "Organization" ? customerName : null,
        representativeNames:
          customerType === "Organization"
            ? representativeNames.join(",")
            : null,
        address: organizationAddresses.join(","),
        pricingTier,
        paymentTermId: paymentTerm,
        outletId: selectedOutlet?.id,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.name || "System",
      };

      await api.upsertCustomer(payload);

      showToast("success", "Success", "Customer created successfully.");
      onClose();
      if (typeof fetchCustomers === "function") {
        fetchCustomers();
      } else if (selectedOutlet?.id) {
        refreshCustomers(selectedOutlet.id);
      }
    } catch (error) {
      console.error("Failed to create customer:", error);
      showToast("error", "Error", "Failed to create customer.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
      const next = { ...updated[index], ...updates };

      if (typeof updates.number === "string") {
        const raw = updates.number.trim();
        if (raw.startsWith("+")) {
          const normalized = `+${raw.slice(1).replace(/[^\d]/g, "")}`;
          let best: PhoneCountry | undefined;
          for (const c of phoneCountries) {
            const dial = normalizeDialCode(c?.dialCode || "");
            if (!dial) continue;
            if (normalized.startsWith(dial)) {
              if (
                !best ||
                dial.length > normalizeDialCode(best.dialCode).length
              ) {
                best = c;
              }
            }
          }
          if (best) {
            const dial = normalizeDialCode(best.dialCode);
            const remainder = normalized.slice(dial.length).replace(/^0+/, "");
            next.country = best;
            next.number = remainder;
          }
        }
      }

      updated[index] = next;
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
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
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
                    {actualPaymentTerms.find((t) => t.id === paymentTerm)
                      ?.name || "Select a Payment Term"}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isPaymentTermOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isPaymentTermOpen && (
                  <div className="absolute z-[110] w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="py-1 max-h-60 overflow-y-auto custom-scrollbar">
                      {actualPaymentTerms.length > 0 ? (
                        actualPaymentTerms.map((term) => (
                          <button
                            key={term.id}
                            type="button"
                            onClick={() => {
                              setPaymentTerm(term.id);
                              setIsPaymentTermOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-[#15BA5C0D] hover:text-[#15BA5C] flex items-center justify-between group transition-colors"
                          >
                            <span className="text-sm font-medium">
                              {term.name}
                            </span>
                            {paymentTerm === term.id && (
                              <div className="size-2 rounded-full bg-[#15BA5C]" />
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500 italic">
                          No payment terms found
                        </div>
                      )}
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
            onClick={handleCreateCustomer}
            disabled={!isFormValid || isSubmitting}
            className={`rounded-xl py-4 font-bold text-base transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
              !isFormValid || isSubmitting
                ? "bg-gray-400 text-white shadow-none"
                : "bg-[#15BA5C] hover:bg-[#119E4D] text-white shadow-lg shadow-[#15BA5C33]"
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="size-5 animate-spin" />
                <span>Creating...</span>
              </div>
            ) : (
              "Create Customer"
            )}
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
