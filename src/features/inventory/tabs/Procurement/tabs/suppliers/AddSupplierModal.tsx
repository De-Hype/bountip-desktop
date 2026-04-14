import React, { useState, useEffect, useMemo, useRef } from "react";
import { X, Info, Trash2, Loader2, Search } from "lucide-react";
import { PhoneInput } from "@/features/settings/ui/PhoneInput";
import { getPhoneCountries, PhoneCountry } from "@/utils/getPhoneCountries";
import useBusinessStore from "@/stores/useBusinessStore";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const supplierSchema = z.object({
  supplierName: z.string().min(1, "Supplier Name is required"),
  representatives: z
    .array(
      z.object({
        name: z.string().min(1, "Representative Name is required"),
      }),
    )
    .min(1, "At least one representative is required"),
  phoneNumbers: z
    .array(
      z.object({
        number: z.string().min(1, "Phone Number is required"),
        country: z.any(),
      }),
    )
    .min(1, "At least one phone number is required"),
  emails: z
    .array(
      z.object({
        email: z.string().email("Invalid email address"),
      }),
    )
    .min(1, "At least one email is required"),
  address: z.string().min(1, "Address is required"),
  taxNumber: z.string().optional(),
  notes: z.string().optional(),
  itemsToSupply: z.array(z.any()),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

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

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
    watch,
    setValue,
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    mode: "onChange",
    defaultValues: {
      supplierName: "",
      representatives: [{ name: "" }],
      phoneNumbers: [{ number: "", country: phoneCountries[0] }],
      emails: [{ email: "" }],
      address: "",
      taxNumber: "",
      notes: "",
      itemsToSupply: [],
    },
  });

  const {
    fields: representativeFields,
    append: appendRepresentative,
    remove: removeRepresentative,
  } = useFieldArray({
    control,
    name: "representatives",
  });

  const {
    fields: phoneFields,
    append: appendPhone,
    remove: removePhone,
  } = useFieldArray({
    control,
    name: "phoneNumbers",
  });

  const {
    fields: emailFields,
    append: appendEmail,
    remove: removeEmail,
  } = useFieldArray({
    control,
    name: "emails",
  });

  const itemsToSupply = watch("itemsToSupply");

  const itemsDropdownRef = useRef<HTMLDivElement>(null);
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [inventoryOptions, setInventoryOptions] = useState<InventoryPick[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      reset({
        supplierName: "",
        representatives: [{ name: "" }],
        phoneNumbers: [{ number: "", country: phoneCountries[0] }],
        emails: [{ email: "" }],
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
  }, [isOpen, phoneCountries, reset]);

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

  const filteredItems = useMemo(() => {
    const q = itemSearchTerm.trim().toLowerCase();
    if (!q) return [];
    return inventoryOptions
      .filter((it) => (it.itemName || "").toLowerCase().includes(q))
      .filter(
        (it) =>
          !itemsToSupply.some(
            (s: any) => s.inventoryItemId === it.inventoryItemId,
          ),
      )
      .slice(0, 8);
  }, [itemsToSupply, inventoryOptions, itemSearchTerm]);

  const addSupplyItem = (it: InventoryPick) => {
    if (
      itemsToSupply.some((x: any) => x.inventoryItemId === it.inventoryItemId)
    )
      return;
    setValue("itemsToSupply", [...itemsToSupply, it], { shouldValidate: true });
    setItemSearchTerm("");
  };

  const removeSupplyItem = (inventoryItemId: string) => {
    setValue(
      "itemsToSupply",
      itemsToSupply.filter((x: any) => x.inventoryItemId !== inventoryItemId),
      { shouldValidate: true },
    );
  };

  const onSubmit = async (data: SupplierFormValues) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onSave(data);
    } catch (error) {
      console.error("Failed to save supplier", error);
    } finally {
      setIsSaving(false);
      onClose();
    }
  };

  if (!isOpen) return null;

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
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 flex flex-col min-h-0"
        >
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
                    {...register("supplierName")}
                    className={`w-full h-12 px-4 border ${
                      errors.supplierName
                        ? "border-red-500"
                        : "border-[#E5E7EB]"
                    } rounded-xl outline-none focus:border-[#15BA5C] transition-all`}
                  />
                  {errors.supplierName && (
                    <p className="text-red-500 text-xs">
                      {errors.supplierName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-semibold text-[#1C1B20]">
                    Representative Name (s){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  {representativeFields.map((field, index) => (
                    <div key={field.id} className="flex flex-col gap-1">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter representative Name"
                          {...register(`representatives.${index}.name`)}
                          className={`flex-1 h-12 px-4 border ${
                            errors.representatives?.[index]?.name
                              ? "border-red-500"
                              : "border-[#E5E7EB]"
                          } rounded-xl outline-none focus:border-[#15BA5C] transition-all`}
                        />
                        {representativeFields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRepresentative(index)}
                            className="p-3 cursor-pointer hover:bg-red-50 rounded-xl text-red-500 transition-colors border border-[#E5E7EB]"
                          >
                            <Trash2 className="size-5" />
                          </button>
                        )}
                      </div>
                      {errors.representatives?.[index]?.name && (
                        <p className="text-red-500 text-xs">
                          {errors.representatives[index]?.name?.message}
                        </p>
                      )}
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-[#15BA5C]">
                      <Info className="size-3.5" />
                      <span>
                        If there are more than 1, click 'Add Another' after each
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => appendRepresentative({ name: "" })}
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
                  {phoneFields.map((field, index) => (
                    <div key={field.id} className="flex flex-col gap-1">
                      <div className="flex gap-2">
                        <Controller
                          control={control}
                          name={`phoneNumbers.${index}.number`}
                          render={({ field: phoneField }) => (
                            <PhoneInput
                              value={phoneField.value}
                              onChange={phoneField.onChange}
                              selectedCountry={watch(
                                `phoneNumbers.${index}.country`,
                              )}
                              onCountryChange={(country) =>
                                setValue(
                                  `phoneNumbers.${index}.country`,
                                  country,
                                )
                              }
                              className="flex-1"
                              placeholder="Enter Phone Number"
                            />
                          )}
                        />
                        {phoneFields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePhone(index)}
                            className="p-3 cursor-pointer hover:bg-red-50 rounded-xl text-red-500 transition-colors border border-[#E5E7EB]"
                          >
                            <Trash2 className="size-5" />
                          </button>
                        )}
                      </div>
                      {errors.phoneNumbers?.[index]?.number && (
                        <p className="text-red-500 text-xs">
                          {errors.phoneNumbers[index]?.number?.message}
                        </p>
                      )}
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-[#15BA5C]">
                      <Info className="size-3.5" />
                      <span>
                        If there are more than 1, click 'Add Another' after each
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        appendPhone({ number: "", country: phoneCountries[0] })
                      }
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
                  {emailFields.map((field, index) => (
                    <div key={field.id} className="flex flex-col gap-1">
                      <div className="flex gap-2">
                        <input
                          type="email"
                          placeholder="Enter Email address"
                          {...register(`emails.${index}.email`)}
                          className={`flex-1 h-12 px-4 border ${
                            errors.emails?.[index]?.email
                              ? "border-red-500"
                              : "border-[#E5E7EB]"
                          } rounded-xl outline-none focus:border-[#15BA5C] transition-all`}
                        />
                        {emailFields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEmail(index)}
                            className="p-3 cursor-pointer hover:bg-red-50 rounded-xl text-red-500 transition-colors border border-[#E5E7EB]"
                          >
                            <Trash2 className="size-5" />
                          </button>
                        )}
                      </div>
                      {errors.emails?.[index]?.email && (
                        <p className="text-red-500 text-xs">
                          {errors.emails[index]?.email?.message}
                        </p>
                      )}
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-[#15BA5C]">
                      <Info className="size-3.5" />
                      <span>
                        If there are more than 1, click 'Add Another' after each
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => appendEmail({ email: "" })}
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
                    {...register("address")}
                    className={`w-full h-12 px-4 border ${
                      errors.address ? "border-red-500" : "border-[#E5E7EB]"
                    } rounded-xl outline-none focus:border-[#15BA5C] transition-all`}
                  />
                  {errors.address && (
                    <p className="text-red-500 text-xs">
                      {errors.address.message}
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-semibold text-[#1C1B20]">
                    Tax Number (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Tax Number"
                    {...register("taxNumber")}
                    className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#15BA5C] transition-all"
                  />
                </div>

                <div className="col-span-2 space-y-4">
                  <label className="text-sm font-semibold text-[#1C1B20]">
                    Notes
                  </label>
                  <textarea
                    placeholder="Leave a note"
                    {...register("notes")}
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
                        {itemsToSupply.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-6 py-10">
                              <div className="text-sm text-[#6B7280] text-center">
                                No items linked yet
                              </div>
                            </td>
                          </tr>
                        ) : (
                          itemsToSupply.map((it: any) => (
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
              type="submit"
              disabled={!isValid || isSaving}
              className={`w-full h-14 rounded-xl font-bold text-[16px] transition-colors flex items-center justify-center ${
                isValid && !isSaving
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
        </form>
      </div>
    </div>
  );
};

export default AddSupplierModal;
