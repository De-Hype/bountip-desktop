"use client";

import { useState, useEffect } from "react";
import { X, Copy, Plus, Info } from "lucide-react";
import { Dropdown } from "@/shared/AppDropdowns/CreateDropdown";
import { DatePicker } from "@/components/ui/date-picker";
import { useBusinessStore } from "@/stores/useBusinessStore";
import { SystemDefaultType } from "../../../../../electron/types/system-default";
import SystemDefaultModal from "@/shared/SystemDefaultModal";
import AddSupplierModal from "../Procurement/tabs/suppliers/AddSupplierModal";
import useToastStore from "@/stores/toastStore";

interface CreateInventoryItemsProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const generateItemCode = () => {
  return "ITM" + Math.random().toString(36).substring(2, 8).toUpperCase();
};

const CreateInventoryItems = ({
  onClose,
  onSuccess,
}: CreateInventoryItemsProps) => {
  const [activeTab, setActiveTab] = useState<"basic" | "lot">("basic");
  const { selectedOutlet } = useBusinessStore();
  const { showToast } = useToastStore();

  // Form State
  const [formData, setFormData] = useState({
    itemName: "",
    itemCode: generateItemCode(),
    itemCategory: "",
    itemType: "",
    suppliers: [] as string[],
    unitOfPurchase: "",
    unitOfTransfer: "",
    unitOfConsumption: "",
    noOfTransferBasedOnPurchase: "0",
    noOfConsumptionUnitBasedOnPurchase: "0",
    displayedUnitOfMeasure: "",
    minimumStockLevel: "0",
    reOrderLevel: "0",
    // Lot Information
    lotNumber: generateItemCode(),
    supplierBarcode: "",
    quantityPurchased: "0",
    expiryDate: undefined as Date | undefined,
    costPrice: "0.00",
    costPerUnitOfPurchase: "0.00",
    costPerUnitOfTransfer: "0.00",
    costPerUnitOfConsumption: "0.00",
    trackInventory: false,
    makeItemTraceable: true,
  });

  // Dropdown Options
  const [categories, setCategories] = useState<
    { value: string; label: string }[]
  >([]);
  const [units, setUnits] = useState<{ value: string; label: string }[]>([]);
  const [suppliers, setSuppliers] = useState<
    { value: string; label: string; meta?: { supplierCode?: string | null } }[]
  >([]);

  const [isDefaultModalOpen, setIsDefaultModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [lotSupplierId, setLotSupplierId] = useState("");
  const [modalConfig, setModalConfig] = useState({
    title: "",
    inputLabel: "",
    placeholder: "",
    buttonText: "",
    key: "" as SystemDefaultType | "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const openDefaultModal = (
    key: SystemDefaultType,
    title: string,
    inputLabel: string,
    placeholder: string,
    buttonText: string,
  ) => {
    setModalConfig({ title, inputLabel, placeholder, buttonText, key });
    setIsDefaultModalOpen(true);
  };

  const fetchSuppliers = async () => {
    try {
      const api = (window as any).electronAPI;
      if (!api?.dbQuery || !selectedOutlet?.id) return;
      const supplierSql =
        "SELECT id, name, supplierCode FROM suppliers WHERE outletId = ? AND deletedAt IS NULL ORDER BY name ASC";
      const supplierRes = await api.dbQuery(supplierSql, [selectedOutlet.id]);
      setSuppliers(
        (supplierRes || []).map((s: any) => ({
          value: String(s.id),
          label: String(s.name || ""),
          meta: { supplierCode: s.supplierCode },
        })),
      );
    } catch (err) {
      console.error("Failed to fetch suppliers:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const api = (window as any).electronAPI;
      if (!api?.getSystemDefaults || !selectedOutlet?.id) return;

      const results = await api.getSystemDefaults(
        SystemDefaultType.ITEM_CATEGORY,
        selectedOutlet.id,
      );

      const options = (results || []).flatMap((row: any) => {
        const systemDefaultId = String(row?.id || "");
        let data: any[] = [];
        try {
          const parsed =
            typeof row.data === "string" ? JSON.parse(row.data) : row.data;
          data = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          data = [];
        }

        return data
          .map((c: any) => c?.name ?? c)
          .map((value: any) => String(value || "").trim())
          .filter(Boolean)
          .map((value: string) => ({
            value,
            label: value,
            id: `${systemDefaultId}:${value}`,
            meta: {
              systemDefaultId,
              systemDefaultKey: SystemDefaultType.ITEM_CATEGORY,
            },
          }));
      });

      setCategories(options);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const fetchUnits = async () => {
    try {
      const api = (window as any).electronAPI;
      if (!api?.getSystemDefaults || !selectedOutlet?.id) return;

      const results = await api.getSystemDefaults(
        SystemDefaultType.INVENTORY_UNIT,
        selectedOutlet.id,
      );

      const options = (results || []).flatMap((row: any) => {
        const systemDefaultId = String(row?.id || "");
        let data: any[] = [];
        try {
          const parsed =
            typeof row.data === "string" ? JSON.parse(row.data) : row.data;
          data = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          data = [];
        }

        return data
          .map((u: any) => u?.name ?? u)
          .map((value: any) => String(value || "").trim())
          .filter(Boolean)
          .map((value: string) => ({
            value,
            label: value,
            id: `${systemDefaultId}:${value}`,
            meta: {
              systemDefaultId,
              systemDefaultKey: SystemDefaultType.INVENTORY_UNIT,
            },
          }));
      });

      setUnits(options);
    } catch (err) {
      console.error("Failed to fetch units:", err);
    }
  };

  const handleDeleteDefault = async (option: any) => {
    try {
      const api = (window as any).electronAPI;
      if (!api?.deleteSystemDefault) return;

      const systemDefaultId =
        option?.meta?.systemDefaultId ||
        (typeof option?.id === "string" ? option.id.split(":")[0] : option.id);
      if (!systemDefaultId) return;

      await api.deleteSystemDefault(systemDefaultId, option.value);
      showToast("success", "Success", "Item removed successfully");

      if (option.value === formData.itemCategory) {
        handleInputChange("itemCategory", "");
      }
      if (option.value === formData.unitOfPurchase) {
        handleInputChange("unitOfPurchase", "");
      }
      if (option.value === formData.unitOfTransfer) {
        handleInputChange("unitOfTransfer", "");
      }
      if (option.value === formData.unitOfConsumption) {
        handleInputChange("unitOfConsumption", "");
      }
      if (option.value === formData.displayedUnitOfMeasure) {
        handleInputChange("displayedUnitOfMeasure", "");
      }

      const systemDefaultKey = option?.meta?.systemDefaultKey;
      if (systemDefaultKey === SystemDefaultType.ITEM_CATEGORY) {
        await fetchCategories();
      } else if (systemDefaultKey === SystemDefaultType.INVENTORY_UNIT) {
        await fetchUnits();
      } else {
        await Promise.all([fetchCategories(), fetchUnits()]);
      }
    } catch (err) {
      console.error("Failed to delete system default:", err);
      showToast("error", "Error", "Failed to remove item");
    }
  };

  const handleAddNewDefault = async (newValue: string) => {
    try {
      const api = (window as any).electronAPI;
      if (!api?.addSystemDefault || !selectedOutlet?.id || !modalConfig.key)
        return;

      const typesWithKey = [
        SystemDefaultType.ITEM_CATEGORY,
        SystemDefaultType.INVENTORY_UNIT,
      ];

      const payload = typesWithKey.includes(modalConfig.key)
        ? { key: modalConfig.key, name: newValue }
        : { name: newValue };

      await api.addSystemDefault(modalConfig.key, payload, selectedOutlet.id);

      showToast(
        "success",
        "Success",
        `${modalConfig.inputLabel} added successfully`,
      );

      // Refetch the appropriate list
      if (modalConfig.key === SystemDefaultType.INVENTORY_UNIT) {
        await fetchUnits();
      } else if (modalConfig.key === SystemDefaultType.ITEM_CATEGORY) {
        await fetchCategories();
      }

      setIsDefaultModalOpen(false);
    } catch (err) {
      console.error("Failed to add new system default:", err);
    }
  };

  const handleSaveSupplier = async (supplierData: any) => {
    try {
      const api = (window as any).electronAPI;
      if (!api?.dbQuery || !selectedOutlet?.id) return;

      const sql = `
        INSERT INTO suppliers (
          id, isActive, name, representativeName, phoneNumbers, emailAddress, address,
          supplierCode, notes, taxNumber, createdAt, updatedAt, deletedAt, outletId, recordId, version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const id =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : String(Date.now());
      const now = new Date().toISOString();

      await api.dbQuery(sql, [
        id,
        1,
        supplierData.supplierName,
        JSON.stringify(
          (supplierData.representatives || [])
            .map((r: any) => r?.name)
            .filter((name: string) => String(name || "").trim() !== ""),
        ),
        JSON.stringify(
          (supplierData.phoneNumbers || [])
            .filter((p: any) => String(p?.number || "").trim() !== "")
            .map((p: any) => `${p.country.dialCode}${p.number}`),
        ),
        JSON.stringify(
          (supplierData.emails || [])
            .map((e: any) => e?.email)
            .filter((email: string) => String(email || "").trim() !== ""),
        ),
        supplierData.address,
        id,
        supplierData.notes, // notes
        supplierData.taxNumber,
        now,
        now,
        null,
        selectedOutlet.id,
        null,
        1,
      ]);

      if (api.queueAdd) {
        const supplierRow = await api.dbQuery(
          "SELECT * FROM suppliers WHERE id = ?",
          [id],
        );
        if (supplierRow?.[0]) {
          await api.queueAdd({
            table: "suppliers",
            action: "CREATE",
            data: supplierRow[0],
            id,
          });
        }
      }

      if (
        supplierData.itemsToSupply &&
        Array.isArray(supplierData.itemsToSupply)
      ) {
        for (const item of supplierData.itemsToSupply) {
          const supplierItemId =
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function"
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
          await api.dbQuery(
            `
              INSERT INTO supplier_items (
                id, totalSupplied, createdAt, updatedAt, deletedAt, supplierId, itemId, recordId, version
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
              supplierItemId,
              0,
              now,
              now,
              null,
              id,
              item.inventoryItemId,
              null,
              1,
            ],
          );

          if (api.queueAdd) {
            const siRow = await api.dbQuery(
              "SELECT * FROM supplier_items WHERE id = ?",
              [supplierItemId],
            );
            if (siRow?.[0]) {
              await api.queueAdd({
                table: "supplier_items",
                action: "CREATE",
                data: siRow[0],
                id: supplierItemId,
              });
            }
          }
        }
      }

      showToast("success", "Success", "Supplier added successfully");

      await fetchSuppliers();
      setIsSupplierModalOpen(false);
    } catch (err) {
      console.error("Failed to save supplier:", err);
      showToast("error", "Error", "Failed to save supplier");
    }
  };

  const handleDeleteSupplier = async (option: {
    value: string;
    label: string;
  }) => {
    try {
      const api = (window as any).electronAPI;
      if (!api?.dbQuery || !selectedOutlet?.id) return;

      const now = new Date().toISOString();
      await api.dbQuery(
        `
          UPDATE suppliers
          SET deletedAt = ?, updatedAt = ?, version = COALESCE(version, 0) + 1
          WHERE id = ? AND outletId = ? AND deletedAt IS NULL
        `,
        [now, now, option.value, selectedOutlet.id],
      );

      if (api.queueAdd) {
        const row = await api.dbQuery("SELECT * FROM suppliers WHERE id = ?", [
          option.value,
        ]);
        if (row?.[0]) {
          await api.queueAdd({
            table: "suppliers",
            action: "UPDATE",
            data: row[0],
            id: option.value,
          });
        }
      }

      const nextSelected = (formData.suppliers || []).filter(
        (id) => id !== option.value,
      );
      handleInputChange("suppliers", nextSelected);

      showToast("success", "Success", "Supplier deleted");
      await fetchSuppliers();
    } catch (err) {
      console.error("Failed to delete supplier:", err);
      showToast("error", "Error", "Failed to delete supplier");
    }
  };

  useEffect(() => {
    const fetchDefaults = async () => {
      if (!selectedOutlet?.id) return;
      await Promise.all([fetchCategories(), fetchUnits(), fetchSuppliers()]);
    };

    fetchDefaults();
  }, [selectedOutlet?.id]);

  useEffect(() => {
    const costPrice = parseFloat(formData.costPrice) || 0;
    const qtyPurchased = parseFloat(formData.quantityPurchased) || 0;
    const transferFactor =
      parseFloat(formData.noOfTransferBasedOnPurchase) || 0;
    const consumptionFactor =
      parseFloat(formData.noOfConsumptionUnitBasedOnPurchase) || 0;

    const costPerPurchase = qtyPurchased > 0 ? costPrice / qtyPurchased : 0;
    const costPerTransfer =
      transferFactor > 0 ? costPerPurchase / transferFactor : 0;
    const costPerConsumption =
      consumptionFactor > 0 ? costPerTransfer / consumptionFactor : 0;

    setFormData((prev) => ({
      ...prev,
      costPerUnitOfPurchase: costPerPurchase.toFixed(2),
      costPerUnitOfTransfer: costPerTransfer.toFixed(2),
      costPerUnitOfConsumption: costPerConsumption.toFixed(2),
    }));
  }, [
    formData.costPrice,
    formData.quantityPurchased,
    formData.noOfTransferBasedOnPurchase,
    formData.noOfConsumptionUnitBasedOnPurchase,
  ]);

  const handleNumericInputChange = (
    field: string,
    value: string,
    isFloat = false,
  ) => {
    let sanitizedValue = isFloat
      ? value.replace(/[^0-9.]/g, "")
      : value.replace(/[^0-9]/g, "");

    if (isFloat && (sanitizedValue.match(/\./g) || []).length > 1) {
      const parts = sanitizedValue.split(".");
      sanitizedValue = parts[0] + "." + parts.slice(1).join("");
    }

    setFormData((prev) => ({ ...prev, [field]: sanitizedValue }));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isBasicInfoValid =
    formData.itemName.trim() !== "" &&
    formData.itemCategory !== "" &&
    formData.itemType !== "" &&
    formData.suppliers.length > 0 &&
    formData.unitOfPurchase !== "" &&
    formData.unitOfTransfer !== "" &&
    formData.unitOfConsumption !== "" &&
    parseFloat(formData.noOfTransferBasedOnPurchase) > 0 &&
    parseFloat(formData.noOfConsumptionUnitBasedOnPurchase) > 0 &&
    formData.displayedUnitOfMeasure !== "";

  const isFormValid =
    isBasicInfoValid &&
    (parseFloat(formData.minimumStockLevel) >= 0 || formData.minimumStockLevel !== "") &&
    (parseFloat(formData.reOrderLevel) >= 0 || formData.reOrderLevel !== "") &&
    formData.supplierBarcode.trim() !== "" &&
    parseFloat(formData.quantityPurchased) > 0 &&
    formData.expiryDate !== undefined &&
    parseFloat(formData.costPrice) > 0;

  const handleCreateItem = async () => {
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const api = (window as any).electronAPI;
      if (!api?.createInventoryItem) return;

      const payload = {
        ...formData,
        outletId: selectedOutlet?.id,
        expiryDate: formData.expiryDate?.toISOString(),
      };

      await api.createInventoryItem(payload);
      showToast("success", "Success", "Inventory item created successfully");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Failed to create inventory item:", err);
      showToast("error", "Error", "Failed to create inventory item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const itemTypes = [
    { value: "Raw Material", label: "Raw Material" },
    { value: "Intermediate", label: "Intermediate" },
    { value: "Store Items", label: "Store Items" },
  ];

  return (
    <div className="w-full max-w-[840px] bg-white flex flex-col h-full overflow-hidden shadow-2xl rounded-l-[24px]">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[24px] font-bold text-[#1C1B20]">
            Create an Inventory
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
          >
            <X className="size-6 text-[#737373]" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-8">
          <button
            type="button"
            onClick={() => setActiveTab("basic")}
            className={`pb-4 text-[15px] font-medium transition-all relative ${
              activeTab === "basic" ? "text-[#1C1B20]" : "text-[#6B7280]"
            }`}
          >
            Basic Information
            {activeTab === "basic" && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#15BA5C] rounded-t-full" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("lot")}
            className={`pb-4 text-[15px] font-medium transition-all relative ${
              activeTab === "lot" ? "text-[#1C1B20]" : "text-[#6B7280]"
            }`}
          >
            Lot Information
            {activeTab === "lot" && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#15BA5C] rounded-t-full" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">
        {activeTab === "basic" ? (
          <>
            {/* Section: Item / Supplier Details */}
            <div className="space-y-6">
              <h3 className="text-[18px] font-bold text-[#1C1B20]">
                Item / Supplier Details
              </h3>

              <div className="grid  gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1C1B20]">
                    Item Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Item Name"
                    value={formData.itemName}
                    onChange={(e) =>
                      handleInputChange("itemName", e.target.value)
                    }
                    className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#15BA5C] transition-all"
                  />
                </div>
                {/* <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1C1B20]">
                    Item Code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={formData.itemCode}
                      className="w-full h-12 px-4 bg-[#F3F4F6] border border-transparent rounded-xl text-[#1C1B20] font-medium"
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#1C1B20]"
                    >
                      <Copy className="size-4" />
                    </button>
                  </div>
                </div> */}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1C1B20]">
                    Item Category <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openDefaultModal(
                          SystemDefaultType.ITEM_CATEGORY,
                          "Add Item Category",
                          "Category Name",
                          "Enter category name (e.g., Drinks, Food)",
                          "Add Category",
                        )
                      }
                      className="h-12 w-12 cursor-pointer flex items-center justify-center bg-[#F3F4F6] rounded-xl text-[#737373] hover:bg-gray-200 transition-colors"
                    >
                      <Plus className="size-5" />
                    </button>
                    <Dropdown
                      mode="select"
                      placeholder="Click to select item category"
                      options={categories}
                      selectedValue={formData.itemCategory}
                      onChange={(val) => handleInputChange("itemCategory", val)}
                      onDeleteOption={handleDeleteDefault}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-[#15BA5C]">
                    <Info className="size-3.5" />
                    <span>Click the field to select, or add a category</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1C1B20]">
                    Item Type <span className="text-red-500">*</span>
                  </label>
                  <Dropdown
                    mode="select"
                    placeholder="Select item type"
                    options={itemTypes}
                    selectedValue={formData.itemType}
                    onChange={(val) => handleInputChange("itemType", val)}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#1C1B20]">
                  Suppliers <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <Dropdown
                    mode="checkbox"
                    placeholder="Click to select Suppliers"
                    options={suppliers}
                    selectedValues={formData.suppliers.reduce(
                      (acc: Record<string, boolean>, cur: string) => ({
                        ...acc,
                        [cur]: true,
                      }),
                      {},
                    )}
                    onMultiChange={(newValues) => {
                      const selected = Object.keys(newValues).filter(
                        (key) => newValues[key],
                      );
                      handleInputChange("suppliers", selected);
                      if (lotSupplierId && !selected.includes(lotSupplierId)) {
                        setLotSupplierId("");
                        handleInputChange("supplierBarcode", "");
                      }
                    }}
                    onDeleteOption={handleDeleteSupplier}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setIsSupplierModalOpen(true)}
                    className="h-12 w-12 cursor-pointer flex items-center justify-center bg-[#D1D5DB] rounded-xl text-white hover:bg-gray-400 transition-colors"
                  >
                    <Plus className="size-5" />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-[12px] text-[#15BA5C]">
                  <Info className="size-3.5" />
                  <span>Click the field to select, or add a Supplier</span>
                </div>
              </div>
            </div>

            {/* Section: Unit of Measurement */}
            <div className="space-y-6 pt-4">
              <h3 className="text-[18px] font-bold text-[#1C1B20]">
                Unit of Measurement (Purchase, Transfer and Consumption)
              </h3>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1C1B20]">
                    Unit of Purchase <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openDefaultModal(
                          SystemDefaultType.INVENTORY_UNIT,
                          "Add Unit of Purchase",
                          "Unit Name",
                          "Enter unit name (e.g., KG, PCS)",
                          "Add Unit",
                        )
                      }
                      className="h-12 w-12 cursor-pointer flex items-center justify-center bg-[#F3F4F6] rounded-xl text-[#737373] hover:bg-gray-200 transition-colors"
                    >
                      <Plus className="size-5" />
                    </button>
                    <Dropdown
                      mode="select"
                      placeholder="Click to select unit of Purchase"
                      options={units.filter(
                        (u) =>
                          u.value !== formData.unitOfTransfer &&
                          u.value !== formData.unitOfConsumption,
                      )}
                      selectedValue={formData.unitOfPurchase}
                      onChange={(val) =>
                        handleInputChange("unitOfPurchase", val)
                      }
                      onDeleteOption={handleDeleteDefault}
                      className="flex-1 border-red-100" // Red border as per screenshot
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-[#15BA5C]">
                    <Info className="size-3.5" />
                    <span>
                      Click the field to select, or add a unit of Purchase
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1C1B20]">
                    Unit of Transfer <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openDefaultModal(
                          SystemDefaultType.INVENTORY_UNIT,
                          "Add Unit of Transfer",
                          "Unit Name",
                          "Enter unit name (e.g., KG, PCS)",
                          "Add Unit",
                        )
                      }
                      className="h-12 w-12 cursor-pointer flex items-center justify-center bg-[#F3F4F6] rounded-xl text-[#737373] hover:bg-gray-200 transition-colors"
                    >
                      <Plus className="size-5" />
                    </button>
                    <Dropdown
                      mode="select"
                      placeholder="Click to select unit of Transfer"
                      options={units.filter(
                        (u) =>
                          u.value !== formData.unitOfPurchase &&
                          u.value !== formData.unitOfConsumption,
                      )}
                      selectedValue={formData.unitOfTransfer}
                      onChange={(val) =>
                        handleInputChange("unitOfTransfer", val)
                      }
                      onDeleteOption={handleDeleteDefault}
                      className="flex-1 border-red-100"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-[#15BA5C]">
                    <Info className="size-3.5" />
                    <span>
                      Click the field to select, click plus to add a unit of
                      Transfer
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1C1B20]">
                    Unit of consumption <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openDefaultModal(
                          SystemDefaultType.INVENTORY_UNIT,
                          "Add Unit of Consumption",
                          "Unit Name",
                          "Enter unit name (e.g., KG, PCS)",
                          "Add Unit",
                        )
                      }
                      className="h-12 w-12 cursor-pointer flex items-center justify-center bg-[#F3F4F6] rounded-xl text-[#737373] hover:bg-gray-200 transition-colors"
                    >
                      <Plus className="size-5" />
                    </button>
                    <Dropdown
                      mode="select"
                      placeholder="Click to select unit of consumption"
                      options={units.filter(
                        (u) =>
                          u.value !== formData.unitOfPurchase &&
                          u.value !== formData.unitOfTransfer,
                      )}
                      selectedValue={formData.unitOfConsumption}
                      onChange={(val) =>
                        handleInputChange("unitOfConsumption", val)
                      }
                      onDeleteOption={handleDeleteDefault}
                      className="flex-1 border-red-100"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-[#15BA5C]">
                    <Info className="size-3.5" />
                    <span>
                      Click the field to select, click plus to add a unit of
                      consumption
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1C1B20]">
                    No of Transfer based on Purchase{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.noOfTransferBasedOnPurchase}
                      onChange={(e) =>
                        handleNumericInputChange(
                          "noOfTransferBasedOnPurchase",
                          e.target.value,
                        )
                      }
                      className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#15BA5C] transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#15BA5C] font-medium text-sm">
                      Units
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-[#15BA5C]">
                    <Info className="size-3.5" />
                    <span>
                      {formData.noOfTransferBasedOnPurchase || 0}{" "}
                      {formData.unitOfTransfer || "Unit"} = 1{" "}
                      {formData.unitOfPurchase || "Unit of Purchase"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1C1B20]">
                    No of Consumption Unit based on Purchase{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.noOfConsumptionUnitBasedOnPurchase}
                      onChange={(e) =>
                        handleNumericInputChange(
                          "noOfConsumptionUnitBasedOnPurchase",
                          e.target.value,
                        )
                      }
                      className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#15BA5C] transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#15BA5C] font-medium text-sm">
                      Units
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-[#15BA5C]">
                    <Info className="size-3.5" />
                    <span>
                      {formData.noOfConsumptionUnitBasedOnPurchase || 0}{" "}
                      {formData.unitOfConsumption || "Unit"} = 1{" "}
                      {formData.unitOfPurchase || "Unit of Purchase"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Displayed unit of Measure */}
            <div className="space-y-6 pt-4">
              <h3 className="text-[18px] font-bold text-[#1C1B20]">
                Displayed unit of Measure
              </h3>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#1C1B20]">
                  Displayed Unit of Measure{" "}
                  <span className="text-red-500">*</span>
                </label>
                <Dropdown
                  mode="select"
                  placeholder="Select your preferred unit of measurement"
                  options={[
                    {
                      label: "Unit of Purchase",
                      value: formData.unitOfPurchase,
                    },
                    {
                      label: "Unit of Transfer",
                      value: formData.unitOfTransfer,
                    },
                    {
                      label: "Unit of consumption",
                      value: formData.unitOfConsumption,
                    },
                  ].filter((opt) => opt.value)}
                  selectedValue={formData.displayedUnitOfMeasure}
                  onChange={(val) =>
                    handleInputChange("displayedUnitOfMeasure", val)
                  }
                  className="w-full"
                />
              </div>
            </div>

            {/* Section: Stock and Re-order Level */}
            <div className="space-y-6 pt-4">
              <h3 className="text-[18px] font-bold text-[#1C1B20]">
                Stock and Re-order Level
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1C1B20]">
                    Minimum Stock Level <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.minimumStockLevel}
                    onChange={(e) =>
                      handleNumericInputChange(
                        "minimumStockLevel",
                        e.target.value,
                      )
                    }
                    className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#15BA5C] transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1C1B20]">
                    Re-Order Level <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.reOrderLevel}
                    onChange={(e) =>
                      handleNumericInputChange("reOrderLevel", e.target.value)
                    }
                    className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#15BA5C] transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={!isBasicInfoValid}
              onClick={() => setActiveTab("lot")}
              className={`w-full h-11 rounded-[12px] font-bold text-[16px] transition-colors mt-4 ${
                isBasicInfoValid
                  ? "bg-[#15BA5C] text-white hover:bg-[#13A652] cursor-pointer"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              Next
            </button>
          </>
        ) : (
          <>
            {/* Lot Information View */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h3 className="text-[18px] font-bold text-[#1C1B20]">
                  Lot Numbers
                </h3>
                <div className="grid  gap-6">
                  {/* <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#1C1B20]">
                      Lot Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={formData.lotNumber}
                        className="w-full h-12 px-4 bg-[#F3F4F6] border border-transparent rounded-xl text-[#1C1B20] font-medium"
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#1C1B20]"
                      >
                        <Copy className="size-4" />
                      </button>
                    </div>
                  </div> */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#1C1B20]">
                      Main Supplier for this Lot{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <Dropdown
                      mode="select"
                      placeholder="Select Supplier"
                      options={suppliers.filter((s) =>
                        (formData.suppliers || []).includes(s.value),
                      )}
                      selectedValue={lotSupplierId}
                      onChange={(val) => {
                        setLotSupplierId(val);
                        const selectedSupplier = suppliers.find(
                          (s) => s.value === val,
                        );
                        handleInputChange(
                          "supplierBarcode",
                          selectedSupplier?.meta?.supplierCode || val,
                        );
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-4">
                <h3 className="text-[18px] font-bold text-[#1C1B20]">
                  Quantity Details Based on Purchase
                </h3>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1C1B20]">
                    Quantity Purchased <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.quantityPurchased}
                    onChange={(e) =>
                      handleNumericInputChange(
                        "quantityPurchased",
                        e.target.value,
                      )
                    }
                    className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#15BA5C] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-6 pt-4">
                <h3 className="text-[18px] font-bold text-[#1C1B20]">
                  Expiry Date
                </h3>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1C1B20]">
                    Expiry Date <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    // disabledDates={(date) => {
                    //   const today = new Date();
                    //   today.setHours(0, 0, 0, 0);
                    //   return date < today;
                    // }}
                    date={formData.expiryDate}
                    onDateChange={(date) =>
                      handleInputChange("expiryDate", date)
                    }
                    className="w-full h-12 border-[#E5E7EB] rounded-xl justify-between flex-row-reverse"
                    popoverClassName="z-[160]"
                    placeholder="dd/mm/yyyy"
                  />
                </div>
              </div>

              <div className="space-y-6 pt-4">
                <h3 className="text-[18px] font-bold text-[#1C1B20]">
                  Cost Details
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#1C1B20]">
                      Cost Price <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.costPrice}
                      onChange={(e) =>
                        handleNumericInputChange(
                          "costPrice",
                          e.target.value,
                          true,
                        )
                      }
                      className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#15BA5C] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#1C1B20]">
                      Cost Per unit of Purchase{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formData.costPerUnitOfPurchase}
                      className="w-full h-12 px-4 bg-[#F3F4F6] border border-transparent rounded-xl text-[#1C1B20] font-medium"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#1C1B20]">
                      Cost Per unit of Transfer{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formData.costPerUnitOfTransfer}
                      className="w-full h-12 px-4 bg-[#F3F4F6] border border-transparent rounded-xl text-[#1C1B20] font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#1C1B20]">
                      Cost Per unit of Consumption{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formData.costPerUnitOfConsumption}
                      className="w-full h-12 px-4 bg-[#F3F4F6] border border-transparent rounded-xl text-[#1C1B20] font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-4">
                <h3 className="text-[18px] font-bold text-[#1C1B20]">
                  Settings
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-[15px] text-[#1C1B20]">
                    Track Inventory for this Item
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleInputChange(
                        "trackInventory",
                        !formData.trackInventory,
                      )
                    }
                    className={`w-12 h-6 rounded-full transition-colors relative ${formData.trackInventory ? "bg-[#15BA5C]" : "bg-gray-200"}`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.trackInventory ? "right-1" : "left-1"}`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[15px] text-[#1C1B20]">
                    Make this Item Traceable
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleInputChange(
                        "makeItemTraceable",
                        !formData.makeItemTraceable,
                      )
                    }
                    className={`w-12 h-6 rounded-full transition-colors relative ${formData.makeItemTraceable ? "bg-[#15BA5C]" : "bg-gray-200"}`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.makeItemTraceable ? "right-1" : "left-1"}`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={!isFormValid || isSubmitting}
              onClick={handleCreateItem}
              className={`w-full h-12 rounded-[12px] font-bold text-[16px] transition-colors mt-4 flex items-center justify-center gap-2 ${
                isFormValid && !isSubmitting
                  ? "bg-[#15BA5C] text-white hover:bg-[#13A652] cursor-pointer"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Item"
              )}
            </button>
          </>
        )}
      </div>

      <SystemDefaultModal
        isOpen={isDefaultModalOpen}
        onClose={() => setIsDefaultModalOpen(false)}
        onAdd={handleAddNewDefault}
        title={modalConfig.title}
        inputLabel={modalConfig.inputLabel}
        placeholder={modalConfig.placeholder}
        buttonText={modalConfig.buttonText}
      />

      <AddSupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        onSave={handleSaveSupplier}
      />
    </div>
  );
};

export default CreateInventoryItems;
