import React, { useState, useEffect, useMemo, useRef } from "react";
import { X, Info, Trash2, Loader2, Search } from "lucide-react";
import { PhoneInput } from "@/features/settings/ui/PhoneInput";
import { getPhoneCountries, PhoneCountry } from "@/utils/getPhoneCountries";
import useBusinessStore from "@/stores/useBusinessStore";

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplierData: any) => Promise<void>;
}

type InventoryPick = {
  inventoryItemId: string;
  itemName: string;
  category: string | null;
};

const AddSupplierModal: React.FC<AddSupplierModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const outlet = useBusinessStore((s) => s.selectedOutlet);
  const phoneCountries = useMemo(() => getPhoneCountries(), []);
  const [activeTab, setActiveTab] = useState<"basic" | "items">("basic");
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    supplierName: "",
    representatives: [""],
    phoneNumbers: [{ number: "", country: phoneCountries[0] }],
    emails: [""],
    address: "",
    taxNumber: "",
    notes: "",
    itemsToSupply: [] as InventoryPick[],
  });

  const itemsDropdownRef = useRef<HTMLDivElement>(null);
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [inventoryOptions, setInventoryOptions] = useState<InventoryPick[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        supplierName: "",
        representatives: [""],
        phoneNumbers: [{ number: "", country: phoneCountries[0] }],
        emails: [""],
        address: "",
        taxNumber: "",
        notes: "",
        itemsToSupply: [],
      });
      setActiveTab("basic");
      setIsSaving(false);
      setItemSearchTerm("");
      setInventoryOptions([]);
      setIsLoadingItems(false);
    }
  }, [isOpen, phoneCountries]);

  useEffect(() => {
    if (!isOpen) return;
    if (!outlet?.id) return;
    const api = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    setIsLoadingItems(true);
    (async () => {
      try {
        const rows = await api.dbQuery(
          `
            SELECT
              ii.id as inventoryItemId,
              im.name as itemName,
              im.category as category
            FROM inventory_item ii
            JOIN inventory i ON ii.inventoryId = i.id
            JOIN item_master im ON ii.itemMasterId = im.id
            WHERE i.outletId = ? AND ii.isDeleted = 0
            ORDER BY im.name ASC
          `,
          [outlet.id],
        );
        setInventoryOptions(
          (rows || []).map((r: any) => ({
            inventoryItemId: String(r.inventoryItemId),
            itemName: String(r.itemName || ""),
            category: r.category != null ? String(r.category) : null,
          })),
        );
      } catch (err) {
        console.error("Failed to load inventory items:", err);
      } finally {
        setIsLoadingItems(false);
      }
    })();
  }, [isOpen, outlet?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        itemsDropdownRef.current &&
        !itemsDropdownRef.current.contains(event.target as Node)
      ) {
        setItemSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleAddField = (
    field: "representatives" | "phoneNumbers" | "emails",
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]:
        field === "phoneNumbers"
          ? [...prev[field], { number: "", country: phoneCountries[0] }]
          : [...prev[field], ""],
    }));
  };

  const handleRemoveField = (
    field: "representatives" | "phoneNumbers" | "emails",
    index: number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] as any[]).filter((_, i) => i !== index),
    }));
  };

  const handleFieldChange = (
    field: "representatives" | "phoneNumbers" | "emails",
    index: number,
    value: string | { number: string; country: PhoneCountry },
  ) => {
    const newArray = [...(formData[field] as any[])];
    newArray[index] = value;
    setFormData((prev) => ({
      ...prev,
      [field]: newArray,
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const filteredItems = useMemo(() => {
    const q = itemSearchTerm.trim().toLowerCase();
    if (!q) return [];
    return inventoryOptions
      .filter((it) => (it.itemName || "").toLowerCase().includes(q))
      .filter(
        (it) =>
          !formData.itemsToSupply.some(
            (s) => s.inventoryItemId === it.inventoryItemId,
          ),
      )
      .slice(0, 8);
  }, [formData.itemsToSupply, inventoryOptions, itemSearchTerm]);

  const addSupplyItem = (it: InventoryPick) => {
    setFormData((prev) => {
      if (
        prev.itemsToSupply.some((x) => x.inventoryItemId === it.inventoryItemId)
      )
        return prev;
      return { ...prev, itemsToSupply: [...prev.itemsToSupply, it] };
    });
    setItemSearchTerm("");
  };

  const removeSupplyItem = (inventoryItemId: string) => {
    setFormData((prev) => ({
      ...prev,
      itemsToSupply: prev.itemsToSupply.filter(
        (x) => x.inventoryItemId !== inventoryItemId,
      ),
    }));
  };

  const handleSave = async () => {
    if (!isFormValid || isSaving) return;
    setIsSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error("Failed to save supplier", error);
    } finally {
      setIsSaving(false);
      onClose();
    }
  };

  const isFormValid =
    formData.supplierName.trim() !== "" &&
    formData.representatives.some((rep) => rep.trim() !== "") &&
    formData.phoneNumbers.some((phone) => phone.number.trim() !== "") &&
    formData.emails.some((email) => email.trim() !== "") &&
    formData.address.trim() !== "";

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex justify-end">
      <div className="bg-white shadow-2xl w-full max-w-[720px] h-full flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-8 py-6 flex items-center justify-between ">
          <h2 className="text-[20px] font-bold text-[#1C1B20]">
            Add a Supplier
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 cursor-pointer hover:bg-red-50 rounded-full transition-colors group"
          >
            <X className="size-6 text-white bg-red-500 rounded-full p-1 group-hover:bg-red-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-8 flex gap-8 border-b border-gray-100">
          <button
            type="button"
            onClick={() => setActiveTab("basic")}
            className={`py-4 text-[15px] font-medium transition-all relative ${
              activeTab === "basic" ? "text-[#1C1B20]" : "text-[#9CA3AF]"
            }`}
          >
            Basic Information
            {activeTab === "basic" && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#15BA5C] rounded-t-full" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("items")}
            className={`py-4 text-[15px] font-medium transition-all relative ${
              activeTab === "items" ? "text-[#1C1B20]" : "text-[#9CA3AF]"
            }`}
          >
            Items to Supply
            {activeTab === "items" && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#15BA5C] rounded-t-full" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-6">
          {activeTab === "basic" ? (
            <div className="grid grid-cols-2 gap-x-8 gap-y-20">
              <div className="space-y-4">
                <label className="text-sm font-semibold text-[#1C1B20]">
                  Supplier Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter Supplier Name"
                  value={formData.supplierName}
                  onChange={(e) =>
                    handleInputChange("supplierName", e.target.value)
                  }
                  className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#15BA5C] transition-all"
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-semibold text-[#1C1B20]">
                  Representative Name (s){" "}
                  <span className="text-red-500">*</span>
                </label>
                {formData.representatives.map((rep, index) => (
                  <div key={index} className="flex gap-2 mb-5">
                    <input
                      type="text"
                      placeholder="Enter representative Name"
                      value={rep}
                      onChange={(e) =>
                        handleFieldChange(
                          "representatives",
                          index,
                          e.target.value,
                        )
                      }
                      className="flex-1 h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#15BA5C] transition-all"
                    />
                    {formData.representatives.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveField("representatives", index)
                        }
                        className="p-3 cursor-pointer hover:bg-red-50 rounded-xl text-red-500 transition-colors border border-[#E5E7EB]"
                      >
                        <Trash2 className="size-5" />
                      </button>
                    )}
                  </div>
                ))}
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-[#15BA5C]">
                    <Info className="size-3.5" />
                    <span>
                      If there are more than 1, click 'Enter' after each
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddField("representatives")}
                    className="text-[#15BA5C] font-semibold hover:underline"
                  >
                    Add Another
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-semibold text-[#1C1B20]">
                  Phone Number (s) <span className="text-red-500">*</span>
                </label>
                {formData.phoneNumbers.map((phone, index) => (
                  <div key={index} className="flex gap-2 mb-5">
                    <PhoneInput
                      value={phone.number}
                      onChange={(val) =>
                        handleFieldChange("phoneNumbers", index, {
                          ...phone,
                          number: val,
                        })
                      }
                      selectedCountry={phone.country}
                      onCountryChange={(country) =>
                        handleFieldChange("phoneNumbers", index, {
                          ...phone,
                          country,
                        })
                      }
                      className="flex-1"
                      placeholder="Enter Phone Number"
                    />
                    {formData.phoneNumbers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveField("phoneNumbers", index)}
                        className="p-3 cursor-pointer hover:bg-red-50 rounded-xl text-red-500 transition-colors border border-[#E5E7EB]"
                      >
                        <Trash2 className="size-5" />
                      </button>
                    )}
                  </div>
                ))}
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-[#15BA5C]">
                    <Info className="size-3.5" />
                    <span>
                      If there are more than 1, click 'Enter' after each
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddField("phoneNumbers")}
                    className="text-[#15BA5C] font-semibold hover:underline"
                  >
                    Add Another
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-semibold text-[#1C1B20]">
                  Email Address (s) <span className="text-red-500">*</span>
                </label>
                {formData.emails.map((email, index) => (
                  <div key={index} className="flex gap-2 mb-5">
                    <input
                      type="email"
                      placeholder="Enter Email address"
                      value={email}
                      onChange={(e) =>
                        handleFieldChange("emails", index, e.target.value)
                      }
                      className="flex-1 h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#15BA5C] transition-all"
                    />
                    {formData.emails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveField("emails", index)}
                        className="p-3 cursor-pointer hover:bg-red-50 rounded-xl text-red-500 transition-colors border border-[#E5E7EB]"
                      >
                        <Trash2 className="size-5" />
                      </button>
                    )}
                  </div>
                ))}
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-[#15BA5C]">
                    <Info className="size-3.5" />
                    <span>
                      If there are more than 1, click 'Enter' after each
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddField("emails")}
                    className="text-[#15BA5C] cursor-pointer font-semibold hover:underline"
                  >
                    Add Another
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-semibold text-[#1C1B20]">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter Address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#15BA5C] transition-all"
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-semibold text-[#1C1B20]">
                  Tax Number (optional)
                </label>
                <input
                  type="text"
                  placeholder="Enter Tax Number"
                  value={formData.taxNumber}
                  onChange={(e) =>
                    handleInputChange("taxNumber", e.target.value)
                  }
                  className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#15BA5C] transition-all"
                />
              </div>

              <div className="col-span-2 space-y-4">
                <label className="text-sm font-semibold text-[#1C1B20]">
                  Notes
                </label>
                <textarea
                  placeholder="Leave a note"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  className="w-full h-32 p-4 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#15BA5C] transition-all resize-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-[18px] font-bold text-[#1C1B20]">
                  Link Items to your Supplier
                </h3>
                <div className="relative" ref={itemsDropdownRef}>
                  <input
                    type="text"
                    value={itemSearchTerm}
                    onChange={(e) => setItemSearchTerm(e.target.value)}
                    placeholder="Search for an Item"
                    className="w-full h-12 px-4 pr-12 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#15BA5C] transition-all placeholder:text-gray-400"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="size-5" />
                  </div>

                  {itemSearchTerm.trim() && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-[210]">
                      {isLoadingItems ? (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          Loading...
                        </div>
                      ) : filteredItems.length > 0 ? (
                        filteredItems.map((it) => (
                          <button
                            key={it.inventoryItemId}
                            type="button"
                            onClick={() => addSupplyItem(it)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                          >
                            <span className="text-sm font-medium text-gray-900">
                              {it.itemName}
                            </span>
                            <span className="text-xs text-gray-400">
                              {it.category || ""}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          No matching items
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#F9FAFB]">
                      <tr>
                        <th className="px-6 py-4 text-[13px] font-semibold text-[#6B7280]">
                          Item
                        </th>
                        <th className="px-6 py-4 text-[13px] font-semibold text-[#6B7280]">
                          Category
                        </th>
                        <th className="px-6 py-4 text-[13px] font-semibold text-[#6B7280] text-center">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {formData.itemsToSupply.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-10">
                            <div className="text-sm text-[#6B7280] text-center">
                              No items linked yet
                            </div>
                          </td>
                        </tr>
                      ) : (
                        formData.itemsToSupply.map((it) => (
                          <tr key={it.inventoryItemId}>
                            <td className="px-6 py-5 text-[15px] text-[#111827]">
                              {it.itemName}
                            </td>
                            <td className="px-6 py-5 text-[15px] text-[#111827]">
                              {it.category || "-"}
                            </td>
                            <td className="px-6 py-5 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  removeSupplyItem(it.inventoryItemId)
                                }
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center justify-center"
                              >
                                <Trash2 className="size-5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-gray-100">
          <button
            type="button"
            onClick={handleSave}
            disabled={!isFormValid || isSaving}
            className={`w-full h-14 rounded-xl font-bold text-[16px] transition-colors flex items-center justify-center ${
              isFormValid && !isSaving
                ? "bg-[#15BA5C] text-white hover:bg-[#13A652] cursor-pointer"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isSaving ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              "Save Supplier"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddSupplierModal;
