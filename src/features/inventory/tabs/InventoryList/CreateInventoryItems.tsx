"use client";

import { useState, useEffect } from "react";
import { X, Copy, Plus, Info } from "lucide-react";
import { Dropdown } from "@/shared/AppDropdowns/CreateDropdown";
import { DatePicker } from "@/components/ui/date-picker";
import { useBusinessStore } from "@/stores/useBusinessStore";
import { SystemDefaultType } from "../../../../../electron/types/system-default";
import SystemDefaultModal from "@/shared/SystemDefaultModal";
import AddSupplierModal from "./AddSupplierModal";

interface CreateInventoryItemsProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateInventoryItems = ({
  onClose,
  onSuccess,
}: CreateInventoryItemsProps) => {
  const [activeTab, setActiveTab] = useState<"basic" | "lot">("basic");
  const { selectedOutlet } = useBusinessStore();

  // Form State
  const [formData, setFormData] = useState({
    itemName: "",
    itemCode: "ITM83YD9", // Placeholder/Generated
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
    lotNumber: "ITM83YD9",
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
    { value: string; label: string }[]
  >([]);

  const [isDefaultModalOpen, setIsDefaultModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    inputLabel: "",
    placeholder: "",
    buttonText: "",
    key: "" as SystemDefaultType | "",
  });

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
        "SELECT id, name FROM customers WHERE outletId = ? AND customerType = 'organization'";
      const supplierRes = await api.dbQuery(supplierSql, [selectedOutlet.id]);
      setSuppliers(
        supplierRes.map((s: any) => ({ value: s.id, label: s.name })),
      );
    } catch (err) {
      console.error("Failed to fetch suppliers:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const api = (window as any).electronAPI;
      if (!api?.dbQuery || !selectedOutlet?.id) return;
      const catSql =
        "SELECT data FROM system_default WHERE key = ? AND (outletId = ? OR outletId IS NULL)";
      const catRes = await api.dbQuery(catSql, [
        SystemDefaultType.ITEM_CATEGORY,
        selectedOutlet.id,
      ]);
      if (catRes?.[0]?.data) {
        const catData = JSON.parse(catRes[0].data);
        setCategories(
          catData.map((c: any) => ({
            value: c.name || c,
            label: c.name || c,
          })),
        );
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const fetchUnits = async () => {
    try {
      const api = (window as any).electronAPI;
      if (!api?.dbQuery || !selectedOutlet?.id) return;
      const unitSql =
        "SELECT data FROM system_default WHERE key = ? AND (outletId = ? OR outletId IS NULL)";
      const unitRes = await api.dbQuery(unitSql, [
        SystemDefaultType.INVENTORY_UNIT,
        selectedOutlet.id,
      ]);
      if (unitRes?.[0]?.data) {
        const unitData = JSON.parse(unitRes[0].data);
        setUnits(
          unitData.map((u: any) => ({
            value: u.name || u,
            label: u.name || u,
          })),
        );
      }
    } catch (err) {
      console.error("Failed to fetch units:", err);
    }
  };

  const handleAddNewDefault = async (newValue: string) => {
    try {
      const api = (window as any).electronAPI;
      if (!api?.updateSystemDefault || !selectedOutlet?.id || !modalConfig.key)
        return;

      await api.updateSystemDefault({
        key: modalConfig.key,
        outletId: selectedOutlet.id,
        newValue: { name: newValue },
      });

      // Refetch the appropriate list
      if (modalConfig.key === SystemDefaultType.INVENTORY_UNIT) {
        fetchUnits();
      } else if (modalConfig.key === SystemDefaultType.ITEM_CATEGORY) {
        fetchCategories();
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
        INSERT INTO customers (
          id, name, representativeName, phoneNumber, email, address, taxNumber, notes, 
          customerType, outletId, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await api.dbQuery(sql, [
        id,
        supplierData.supplierName,
        supplierData.representatives
          .filter((r: string) => r.trim() !== "")
          .join(", "),
        supplierData.phoneNumbers
          .filter((p: any) => p.number.trim() !== "")
          .map((p: any) => `${p.country.dialCode}${p.number}`)
          .join(", "),
        supplierData.emails.filter((e: string) => e.trim() !== "").join(", "),
        supplierData.address,
        supplierData.taxNumber,
        supplierData.notes,
        "organization",
        selectedOutlet.id,
        now,
        now,
      ]);

      await fetchSuppliers();
      setIsSupplierModalOpen(false);
    } catch (err) {
      console.error("Failed to save supplier:", err);
    }
  };

  useEffect(() => {
    const fetchDefaults = async () => {
      if (!selectedOutlet?.id) return;
      await Promise.all([fetchCategories(), fetchUnits(), fetchSuppliers()]);
    };

    fetchDefaults();
  }, [selectedOutlet?.id]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1C1B20]">
                    Item Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Product Name"
                    value={formData.itemName}
                    onChange={(e) =>
                      handleInputChange("itemName", e.target.value)
                    }
                    className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#15BA5C] transition-all"
                  />
                </div>
                <div className="space-y-2">
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
                </div>
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
                      className="h-12 w-12 flex items-center justify-center bg-[#F3F4F6] rounded-xl text-[#737373] hover:bg-gray-200 transition-colors"
                    >
                      <Plus className="size-5" />
                    </button>
                    <Dropdown
                      mode="select"
                      placeholder="Select a category"
                      options={categories}
                      selectedValue={formData.itemCategory}
                      onChange={(val) => handleInputChange("itemCategory", val)}
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
                    }}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setIsSupplierModalOpen(true)}
                    className="h-12 w-12 flex items-center justify-center bg-[#D1D5DB] rounded-xl text-white hover:bg-gray-400 transition-colors"
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
                      className="h-12 w-12 flex items-center justify-center bg-[#F3F4F6] rounded-xl text-[#737373] hover:bg-gray-200 transition-colors"
                    >
                      <Plus className="size-5" />
                    </button>
                    <Dropdown
                      mode="select"
                      placeholder="Click to select unit of Purchase"
                      options={units}
                      selectedValue={formData.unitOfPurchase}
                      onChange={(val) =>
                        handleInputChange("unitOfPurchase", val)
                      }
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
                      className="h-12 w-12 flex items-center justify-center bg-[#F3F4F6] rounded-xl text-[#737373] hover:bg-gray-200 transition-colors"
                    >
                      <Plus className="size-5" />
                    </button>
                    <Dropdown
                      mode="select"
                      placeholder="Click to select unit of Transfer"
                      options={units}
                      selectedValue={formData.unitOfTransfer}
                      onChange={(val) =>
                        handleInputChange("unitOfTransfer", val)
                      }
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
                      className="h-12 w-12 flex items-center justify-center bg-[#F3F4F6] rounded-xl text-[#737373] hover:bg-gray-200 transition-colors"
                    >
                      <Plus className="size-5" />
                    </button>
                    <Dropdown
                      mode="select"
                      placeholder="Click to select unit of consumption"
                      options={units}
                      selectedValue={formData.unitOfConsumption}
                      onChange={(val) =>
                        handleInputChange("unitOfConsumption", val)
                      }
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
                      type="number"
                      value={formData.noOfTransferBasedOnPurchase}
                      onChange={(e) =>
                        handleInputChange(
                          "noOfTransferBasedOnPurchase",
                          e.target.value,
                        )
                      }
                      className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#15BA5C] font-medium text-sm">
                      Units
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-[#15BA5C]">
                    <Info className="size-3.5" />
                    <span>0 Unit = 1 Unit</span>
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
                      type="number"
                      value={formData.noOfConsumptionUnitBasedOnPurchase}
                      onChange={(e) =>
                        handleInputChange(
                          "noOfConsumptionUnitBasedOnPurchase",
                          e.target.value,
                        )
                      }
                      className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#15BA5C] font-medium text-sm">
                      Units
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-[#15BA5C]">
                    <Info className="size-3.5" />
                    <span>0 Unit = 1 Unit</span>
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
                  options={units}
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
                    type="number"
                    value={formData.minimumStockLevel}
                    onChange={(e) =>
                      handleInputChange("minimumStockLevel", e.target.value)
                    }
                    className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1C1B20]">
                    Re-Order Level <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.reOrderLevel}
                    onChange={(e) =>
                      handleInputChange("reOrderLevel", e.target.value)
                    }
                    className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("lot")}
              className="w-full h-14 bg-[#15BA5C] text-white rounded-[12px] font-bold text-[16px] hover:bg-[#13A652] transition-colors mt-4"
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
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
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
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#1C1B20]">
                      Supplier Barcode Number{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter Supplier Barcode"
                      value={formData.supplierBarcode}
                      onChange={(e) =>
                        handleInputChange("supplierBarcode", e.target.value)
                      }
                      className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none"
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
                    type="number"
                    value={formData.quantityPurchased}
                    onChange={(e) =>
                      handleInputChange("quantityPurchased", e.target.value)
                    }
                    className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none"
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
                      type="number"
                      value={formData.costPrice}
                      onChange={(e) =>
                        handleInputChange("costPrice", e.target.value)
                      }
                      className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none"
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
              onClick={() => {
                console.log("Creating item:", formData);
                onSuccess?.();
                onClose();
              }}
              className="w-full h-14 bg-[#15BA5C] text-white rounded-[12px] font-bold text-[16px] hover:bg-[#13A652] transition-colors mt-4"
            >
              Create Item
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
