import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  Ban,
  ChevronDown,
  Loader2,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Button } from "../../settings/ui/Button";
import { PhoneInput } from "../../settings/ui/PhoneInput";
import { getPhoneCountries, PhoneCountry } from "@/utils/getPhoneCountries";
import useBusinessStore from "@/stores/useBusinessStore";
import useCustomerStore from "@/stores/useCustomerStore";
import useToastStore from "@/stores/toastStore";
import { format, formatDistanceToNow } from "date-fns";

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
  onSuccess?: () => void;
}

const EditCustomerModal = ({
  isOpen,
  onClose,
  customer,
  onSuccess,
}: EditCustomerModalProps) => {
  const { selectedOutlet } = useBusinessStore();
  const { showToast } = useToastStore();
  const [activeTab, setActiveTab] = useState<"details" | "orders">("details");
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

  // Form State
  const [customerType, setCustomerType] = useState<
    "Individual" | "Organization"
  >("Individual");
  const [customerName, setCustomerName] = useState("");
  const [phoneNumbers, setPhoneNumbers] = useState<
    { number: string; country: PhoneCountry }[]
  >([]);
  const [emails, setEmails] = useState<string[]>([""]);
  const [organizationAddresses, setOrganizationAddresses] = useState<string[]>([
    "",
  ]);
  const [representativeNames, setRepresentativeNames] = useState<string[]>([
    "",
  ]);
  const [pricingTier, setPricingTier] = useState<string>("");
  const [paymentTerm, setPaymentTerm] = useState<string>("");
  const [actualPaymentTerms, setActualPaymentTerms] = useState<any[]>([]);
  const [isPricingTierOpen, setIsPricingTierOpen] = useState(false);
  const [isPaymentTermOpen, setIsPaymentTermOpen] = useState(false);
  const [isDeactivateConfirmOpen, setIsDeactivateConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const phoneCountries = useMemo(() => getPhoneCountries(), []);

  const parseStringArray = (value: any): string[] => {
    if (Array.isArray(value)) {
      return value.map((v) => String(v || "").trim()).filter(Boolean);
    }
    if (typeof value !== "string") return [];
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((v) => String(v || "").trim()).filter(Boolean);
        }
      } catch {}
    }
    return trimmed
      .split(",")
      .map((v) => String(v || "").trim())
      .filter(Boolean);
  };

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

  const splitPhoneForInput = (full: string) => {
    const raw = String(full || "").trim();
    const normalized = raw.replace(/[^\d+]/g, "");
    const withPlus = normalized.startsWith("+")
      ? `+${normalized.slice(1).replace(/\D/g, "")}`
      : `+${normalized.replace(/\D/g, "")}`;

    let best: PhoneCountry | undefined;
    for (const c of phoneCountries) {
      const dial = normalizeDialCode(c?.dialCode || "");
      if (!dial) continue;
      if (withPlus.startsWith(dial)) {
        if (!best || dial.length > normalizeDialCode(best.dialCode).length) {
          best = c;
        }
      }
    }

    if (!best) {
      return { country: phoneCountries[0], number: raw };
    }

    const dial = normalizeDialCode(best.dialCode);
    let remainder = withPlus.slice(dial.length);
    remainder = remainder.replace(/^0+/, "");
    return { country: best, number: remainder };
  };

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

  // Load customer data
  useEffect(() => {
    if (isOpen && customer) {
      setCustomerType(
        customer.customerType === "organization"
          ? "Organization"
          : "Individual",
      );
      setCustomerName(customer.name || "");

      // Handle phone numbers
      const mainPhone = customer.phoneNumber || "";
      const otherPhones = parseStringArray(customer.otherPhoneNumbers);
      const allPhones = [mainPhone, ...otherPhones].filter(Boolean);

      if (allPhones.length > 0) {
        setPhoneNumbers(allPhones.map((num) => splitPhoneForInput(num)));
      } else {
        setPhoneNumbers([{ number: "", country: phoneCountries[0] }]);
      }

      // Handle emails
      const mainEmail = customer.email || "";
      const otherEmails = parseStringArray(customer.otherEmails);
      const allEmails = [mainEmail, ...otherEmails].filter(Boolean);
      setEmails(allEmails.length > 0 ? allEmails : [""]);

      // Handle addresses
      const addresses = customer.address ? customer.address.split(",") : [""];
      setOrganizationAddresses(addresses);

      // Handle representative names
      const reps = customer.representativeNames
        ? customer.representativeNames.split(",")
        : [""];
      setRepresentativeNames(reps);

      setPricingTier(customer.pricingTier || "");
      setPaymentTerm(customer.paymentTermId || "");
    }
  }, [isOpen, customer, phoneCountries]);

  useEffect(() => {
    if (isOpen) return;
    setIsDeactivateConfirmOpen(false);
    setIsDeleteConfirmOpen(false);
    setIsDeactivating(false);
    setIsDeleting(false);
  }, [isOpen]);

  // Fetch payment terms
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

  const isFormValid = useMemo(() => {
    const isNameValid = customerName.trim() !== "";
    const arePhoneNumbersValid = phoneNumbers.every(
      (p) => p.number.trim() !== "",
    );
    const areEmailsValid = emails.every((e) => e.trim() !== "");
    return isNameValid && arePhoneNumbersValid && areEmailsValid;
  }, [customerName, phoneNumbers, emails]);

  const handleUpdateCustomer = async () => {
    if (!isFormValid) {
      showToast(
        "error",
        "Validation Error",
        "Please fill in all required fields.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const api = (window as any).electronAPI;
      if (!api) return;

      const emailValues = emails.map((e) => e.trim()).filter(Boolean);
      const phoneValues = phoneNumbers
        .map((p) => normalizePhoneForStorage(p.country, p.number))
        .filter(Boolean);

      const payload = {
        id: customer.id,
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
        status: String(customer.status || "active").toLowerCase(),
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.name || "System",
      };

      await api.upsertCustomer(payload);

      // Update the local state in the store immediately
      const { fetchCustomers } = useCustomerStore.getState();
      await fetchCustomers(selectedOutlet?.id);

      showToast("success", "Success", "Customer updated successfully.");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to update customer:", error);
      showToast("error", "Error", "Failed to update customer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivateCustomer = async () => {
    if (!customer?.id || !selectedOutlet?.id) return;
    const api = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    setIsDeactivating(true);
    try {
      const now = new Date().toISOString();
      await api.dbQuery(
        `
          UPDATE customers
          SET status = ?, updatedAt = ?, updatedBy = ?, version = COALESCE(version, 0) + 1
          WHERE id = ? AND outletId = ? AND deletedAt IS NULL
        `,
        [
          "inactive",
          now,
          currentUser?.name || "System",
          customer.id,
          selectedOutlet.id,
        ],
      );

      if (api.queueAdd) {
        const row = await api.dbQuery("SELECT * FROM customers WHERE id = ?", [
          customer.id,
        ]);
        if (row?.[0]) {
          await api.queueAdd({
            table: "customers",
            action: "UPDATE",
            data: row[0],
            id: customer.id,
          });
        }
      }

      const { fetchCustomers } = useCustomerStore.getState();
      await fetchCustomers(selectedOutlet.id);

      showToast("success", "Success", "Customer deactivated successfully.");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to deactivate customer:", error);
      showToast("error", "Error", "Failed to deactivate customer.");
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customer?.id || !selectedOutlet?.id) return;
    const api = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    setIsDeleting(true);
    try {
      const now = new Date().toISOString();
      await api.dbQuery(
        `
          UPDATE customers
          SET deletedAt = ?, reason = ?, updatedAt = ?, updatedBy = ?, version = COALESCE(version, 0) + 1
          WHERE id = ? AND outletId = ? AND deletedAt IS NULL
        `,
        [
          now,
          "deleted",
          now,
          currentUser?.name || "System",
          customer.id,
          selectedOutlet.id,
        ],
      );

      if (api.queueAdd) {
        const row = await api.dbQuery("SELECT * FROM customers WHERE id = ?", [
          customer.id,
        ]);
        if (row?.[0]) {
          await api.queueAdd({
            table: "customers",
            action: "DELETE",
            data: row[0],
            id: customer.id,
          });
        }
      }

      const { fetchCustomers } = useCustomerStore.getState();
      await fetchCustomers(selectedOutlet.id);

      showToast("success", "Success", "Customer deleted successfully.");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to delete customer:", error);
      showToast("error", "Error", "Failed to delete customer.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReactivateCustomer = async () => {
    if (!customer?.id || !selectedOutlet?.id) return;
    const api = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    setIsDeactivating(true);
    try {
      const now = new Date().toISOString();
      await api.dbQuery(
        `
          UPDATE customers
          SET status = ?, updatedAt = ?, updatedBy = ?, version = COALESCE(version, 0) + 1
          WHERE id = ? AND outletId = ? AND deletedAt IS NULL
        `,
        [
          "active",
          now,
          currentUser?.name || "System",
          customer.id,
          selectedOutlet.id,
        ],
      );

      if (api.queueAdd) {
        const row = await api.dbQuery("SELECT * FROM customers WHERE id = ?", [
          customer.id,
        ]);
        if (row?.[0]) {
          await api.queueAdd({
            table: "customers",
            action: "UPDATE",
            data: row[0],
            id: customer.id,
          });
        }
      }

      const { fetchCustomers } = useCustomerStore.getState();
      await fetchCustomers(selectedOutlet.id);

      showToast("success", "Success", "Customer reactivated successfully.");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to reactivate customer:", error);
      showToast("error", "Error", "Failed to reactivate customer.");
    } finally {
      setIsDeactivating(false);
    }
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

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/20 backdrop-blur-sm transition-all duration-300">
      <div
        className="h-full w-full max-w-[750px] bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">
                {customerName}
              </h2>
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-lg bg-green-50 text-green-600 text-xs font-semibold">
                  {customerType}
                </span>
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize ${
                    String(customer.status || "active").toLowerCase() ===
                    "active"
                      ? "bg-green-50 text-green-600"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {String(customer.status || "active")}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0 cursor-pointer"
            >
              <X className="size-6 text-gray-400" />
            </button>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-green-500" />
              <span>
                Last Updated{" "}
                <span className="font-medium text-gray-700">
                  {customer.updatedAt
                    ? formatDistanceToNow(new Date(customer.updatedAt), {
                        addSuffix: true,
                      })
                    : "never"}
                </span>{" "}
                by{" "}
                <span className="font-medium text-gray-700">
                  {customer.updatedBy || "Unknown"}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-green-500" />
              <span>
                Created on{" "}
                <span className="font-medium text-gray-700">
                  {customer.createdAt
                    ? format(new Date(customer.createdAt), "MMMM dd, yyyy")
                    : "Unknown"}
                </span>
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-8 flex bg-gray-100/50 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab("details")}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all \${
                activeTab === "details"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Customer Details
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all \${
                activeTab === "orders"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Order History
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
          {activeTab === "details" ? (
            <div className="space-y-8">
              {/* Customer Name */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-[#15BA5C0D] focus:border-[#15BA5C] transition-all text-sm font-medium"
                />
              </div>

              {/* Phone Numbers */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">
                  Phone Number(s)
                </label>
                <div className="space-y-3">
                  {phoneNumbers.map((phoneEntry, index) => (
                    <div key={index} className="flex gap-3 items-center">
                      <PhoneInput
                        value={phoneEntry.number}
                        onChange={(val) => {
                          const updated = [...phoneNumbers];
                          if (
                            String(val || "")
                              .trim()
                              .startsWith("+")
                          ) {
                            updated[index] = splitPhoneForInput(val);
                          } else {
                            updated[index].number = val;
                          }
                          setPhoneNumbers(updated);
                        }}
                        selectedCountry={phoneEntry.country}
                        onCountryChange={(country) => {
                          const updated = [...phoneNumbers];
                          updated[index].country = country;
                          setPhoneNumbers(updated);
                        }}
                        className="flex-1 bg-gray-50 border-gray-100"
                      />
                      {phoneNumbers.length > 1 && (
                        <button
                          onClick={() =>
                            setPhoneNumbers(
                              phoneNumbers.filter((_, i) => i !== index),
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
                  onClick={() =>
                    setPhoneNumbers([
                      ...phoneNumbers,
                      { number: "", country: phoneCountries[0] },
                    ])
                  }
                  className="text-[#15BA5C] text-sm font-semibold flex items-center gap-1.5 hover:underline cursor-pointer"
                >
                  <Plus className="size-4" />
                  <span>Add new</span>
                </button>
              </div>

              {/* Email Addresses */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">
                  Customer Email Address
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
                        className="flex-1 px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-[#15BA5C0D] focus:border-[#15BA5C] transition-all text-sm font-medium"
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
                  className="text-[#15BA5C] text-sm font-semibold flex items-center gap-1.5 hover:underline cursor-pointer"
                >
                  <Plus className="size-4" />
                  <span>Add new</span>
                </button>
              </div>

              {/* Address */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">
                  Address
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
                        className="flex-1 px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-[#15BA5C0D] focus:border-[#15BA5C] transition-all text-sm font-medium"
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
                  className="text-[#15BA5C] text-sm font-semibold flex items-center gap-1.5 hover:underline cursor-pointer"
                >
                  <Plus className="size-4" />
                  <span>Add new</span>
                </button>
              </div>

              {/* Payment Terms */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Payment Terms
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsPaymentTermOpen(!isPaymentTermOpen)}
                    className="w-full px-4 py-3.5 text-left bg-white rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#15BA5C0D] focus:border-[#15BA5C] transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <span
                      className={
                        paymentTerm ? "text-gray-900" : "text-gray-500"
                      }
                    >
                      {actualPaymentTerms.find((t) => t.id === paymentTerm)
                        ?.name || "Select a Payment Term"}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 text-gray-400 transition-transform duration-200 \${isPaymentTermOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isPaymentTermOpen && (
                    <div className="absolute z-[110] w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
                      <div className="py-1 max-h-60 overflow-y-auto">
                        {actualPaymentTerms.map((term) => (
                          <button
                            key={term.id}
                            type="button"
                            onClick={() => {
                              setPaymentTerm(term.id);
                              setIsPaymentTermOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-[#15BA5C0D] hover:text-[#15BA5C] text-sm font-medium transition-colors"
                          >
                            {term.name}
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
                      className={
                        pricingTier ? "text-gray-900" : "text-gray-500"
                      }
                    >
                      {pricingTiers.find(
                        (t: any) => (t.id || t.name) === pricingTier,
                      )?.name ||
                        pricingTier ||
                        "Select tier"}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 text-gray-400 transition-transform duration-200 \${isPricingTierOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isPricingTierOpen && (
                    <div className="absolute z-[110] w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
                      <div className="py-1 max-h-60 overflow-y-auto">
                        {pricingTiers.map((tier: any) => (
                          <button
                            key={tier.id || tier.name}
                            type="button"
                            onClick={() => {
                              setPricingTier(tier.id || tier.name);
                              setIsPricingTierOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-[#15BA5C0D] hover:text-[#15BA5C] text-sm font-medium transition-colors"
                          >
                            {tier.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
              <Clock className="size-12 opacity-20" />
              <p className="text-lg font-medium">Order history coming soon</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-gray-100 bg-white sticky bottom-0">
          <div className="grid grid-cols-3 gap-3">
            <Button
              onClick={handleUpdateCustomer}
              disabled={!isFormValid || isSubmitting}
              className={`w-full rounded-xl py-3 font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                !isFormValid || isSubmitting
                  ? "bg-gray-400 text-white shadow-none"
                  : "bg-[#15BA5C] hover:bg-[#119E4D] text-white shadow-lg shadow-[#15BA5C33]"
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-1.5">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Updating...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5">
                  <span>Edit Customer Details</span>
                </div>
              )}
            </Button>

            {String(customer.status || "active").toLowerCase() === "active" ? (
              <button
                type="button"
                onClick={() => setIsDeactivateConfirmOpen(true)}
                disabled={isSubmitting || isDeleting || isDeactivating}
                className="w-full rounded-xl py-3 font-semibold text-sm transition-all active:scale-[0.98] border border-[#EF4444] text-[#EF4444] bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isDeactivating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Ban className="size-4" />
                    <span>Deactivate Customer</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReactivateCustomer}
                disabled={isSubmitting || isDeleting || isDeactivating}
                className="w-full rounded-xl py-3 font-semibold text-sm transition-all active:scale-[0.98] border border-[#15BA5C] text-[#15BA5C] bg-white hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isDeactivating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="size-4" />
                    <span>Reactivate Customer</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsDeleteConfirmOpen(true)}
              disabled={isSubmitting || isDeleting || isDeactivating}
              className="w-full rounded-xl py-3 font-semibold text-sm transition-all active:scale-[0.98] bg-[#EF4444] hover:bg-[#DC2626] text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isDeleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="size-4" />
                  <span>Delete Customer</span>
                </>
              )}
            </button>
          </div>
        </div>

        {isDeactivateConfirmOpen ? (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-[520px] rounded-[20px] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#FEF3C7]">
                  <AlertTriangle className="h-8 w-8 text-[#F59E0B]" />
                </div>

                <h2 className="text-[22px] font-bold text-[#1C1B20]">
                  Deactivate Customer
                </h2>

                <p className="mt-3 text-[15px] text-[#6B7280] leading-relaxed">
                  You are about to deactivate this customer,
                  <br />
                  Do you wish to continue?
                </p>

                <div className="mt-8 flex w-full gap-4">
                  <button
                    type="button"
                    onClick={() => setIsDeactivateConfirmOpen(false)}
                    className="h-12 flex-1 cursor-pointer rounded-full border border-[#EF4444] text-[15px] font-bold text-[#EF4444] hover:bg-red-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsDeactivateConfirmOpen(false);
                      await handleDeactivateCustomer();
                    }}
                    className="h-12 flex-1 cursor-pointer rounded-full bg-[#15BA5C] text-[15px] font-bold text-white hover:bg-[#119E4D] transition-colors"
                  >
                    Yes, Deactivate
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {isDeleteConfirmOpen ? (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-[520px] rounded-[20px] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#FEE2E2]">
                  <AlertTriangle className="h-8 w-8 text-[#EF4444]" />
                </div>

                <h2 className="text-[22px] font-bold text-[#1C1B20]">
                  Delete Customer
                </h2>

                <p className="mt-3 text-[15px] text-[#6B7280] leading-relaxed">
                  You are about to delete this customer,
                  <br />
                  Do you wish to continue?
                </p>

                <div className="mt-8 flex w-full gap-4">
                  <button
                    type="button"
                    onClick={() => setIsDeleteConfirmOpen(false)}
                    className="h-12 flex-1 cursor-pointer rounded-full border border-[#EF4444] text-[15px] font-bold text-[#EF4444] hover:bg-red-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsDeleteConfirmOpen(false);
                      await handleDeleteCustomer();
                    }}
                    className="h-12 flex-1 cursor-pointer rounded-full bg-[#E33629] text-[15px] font-bold text-white hover:bg-[#C52B1F] transition-colors"
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default EditCustomerModal;
