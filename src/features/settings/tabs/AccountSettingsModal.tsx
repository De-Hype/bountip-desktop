import React, { useEffect, useState } from "react";
import { Modal } from "../ui/Modal";
import SettingFiles from "@/assets/icons/settings";
import { Dropdown } from "../ui/Dropdown";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import { useBusinessStore } from "@/stores/useBusinessStore";
import useToastStore from "@/stores/toastStore";

interface DropdownOption {
  value: string;
  label: string;
}

interface TaxItem {
  id: string;
  name: string;
  rate: string;
  includeInMenuPrices: boolean;
  applyAtOrderCheckout: boolean;
  productSetup: "all" | "categories" | "certain";
  selectedCategories: Record<string, boolean>;
  selectedProducts: Record<string, boolean>;
}

const parseRateValue = (rate: string | number): number => {
  if (typeof rate === "number") return rate;
  const parsed = parseFloat(rate);
  return Number.isFinite(parsed) ? parsed : NaN;
};

export const AccountSettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
    const {showToast}=useToastStore()
  const { selectedOutlet: outlet } = useBusinessStore();
  const [activeTab, setActiveTab] = useState<"taxes" | "service">("taxes");
  const [taxes, setTaxes] = useState<TaxItem[]>([]);
  const [categoriesList, setCategoriesList] = useState<DropdownOption[]>([]);
  const [productOptions] = useState<DropdownOption[]>([]);
  const [isLoadingTaxes, setIsLoadingTaxes] = useState(false);
  const [taxErrors, setTaxErrors] = useState<
    Record<string, { name: boolean; rate: boolean }>
  >({});
  const [isSavingTaxes, setIsSavingTaxes] = useState(false);

  // Transform outlet tax data to component format
  const transformOutletTaxData = (taxData: unknown[]): TaxItem[] => {
    if (!Array.isArray(taxData)) return [];

    return taxData.map((raw, index) => {
      const tax = raw as {
        id?: unknown;
        _id?: unknown;
        name?: string;
        rate?: string | number;
        applicationType?: string;
        scope?: string;
        categoryIdList?: string[];
        productCode?: string[];
        productIdList?: string[];
        selectedCategories?: Record<string, boolean>;
        selectedProducts?: Record<string, boolean>;
      };

      const id =
        (typeof tax.id === "string" && tax.id) ||
        (typeof tax._id === "string" && tax._id) ||
        Date.now().toString() + index;

      const numericRate = parseRateValue(tax.rate ?? "");

      const applicationType = tax.applicationType ?? "included";
      const scope = tax.scope ?? "all";

      const selectedCategories =
        Array.isArray(tax.categoryIdList) && tax.categoryIdList.length > 0
          ? tax.categoryIdList.reduce<Record<string, boolean>>((acc, catId) => {
              acc[catId] = true;
              return acc;
            }, {})
          : tax.selectedCategories || {};

      const selectedProducts =
        Array.isArray(tax.productCode) && tax.productCode.length > 0
          ? tax.productCode.reduce<Record<string, boolean>>((acc, code) => {
              acc[code] = true;
              return acc;
            }, {})
          : Array.isArray(tax.productIdList) && tax.productIdList.length > 0
            ? tax.productIdList.reduce<Record<string, boolean>>(
                (acc, productId) => {
                  acc[productId] = true;
                  return acc;
                },
                {},
              )
            : tax.selectedProducts || {};

      return {
        id,
        name: tax.name || "",
        rate:
          numericRate === 0
            ? "0"
            : Number.isFinite(numericRate)
              ? String(numericRate)
              : "",
        includeInMenuPrices: applicationType === "included",
        applyAtOrderCheckout: applicationType === "checkout",
        productSetup:
          scope === "all"
            ? "all"
            : scope === "category"
              ? "categories"
              : "certain",
        selectedCategories,
        selectedProducts,
      };
    });
  };

  // Load existing tax data when modal opens
  useEffect(() => {
    if (!isOpen || !outlet) return;

    setIsLoadingTaxes(true);
    try {
      const currentTaxSettings = (
        outlet as unknown as {
          taxSettings?: { taxes?: unknown[] };
        } | null
      )?.taxSettings;

      if (currentTaxSettings?.taxes) {
        const transformedTaxes = transformOutletTaxData(
          currentTaxSettings.taxes as unknown[],
        );
        setTaxes(transformedTaxes);
      } else {
        setTaxes([]);
      }
    } catch (error) {
      console.error("Error fetching tax data:", error);
      showToast("error","Failed to load taxes", "Failed to fetch tax data");
      setTaxes([]);
    } finally {
      setIsLoadingTaxes(false);
    }
  }, [isOpen, outlet]);
  // Fetch categories and products are intentionally omitted to avoid API integration

  const addNewTax = () => {
    const newTax: TaxItem = {
      id: Date.now().toString(),
      name: "",
      rate: "",
      includeInMenuPrices: true,
      applyAtOrderCheckout: false,
      productSetup: "all",
      selectedCategories: {},
      selectedProducts: {},
    };
    setTaxes([...taxes, newTax]);
  };

  const addNewCategory = (categoryName: string) => {
    const trimmed = categoryName.trim();
    if (!trimmed) return;

    setCategoriesList((prev) => {
      const exists = prev.some(
        (category) => category.label.toLowerCase() === trimmed.toLowerCase(),
      );
      if (exists) return prev;
      const value = trimmed.toLowerCase().replace(/\s+/g, "-");
      return [...prev, { value, label: trimmed }];
    });
  };

  const updateTaxLocal = (id: string, updates: Partial<TaxItem>) => {
    setTaxes(
      taxes.map((tax) => (tax.id === id ? { ...tax, ...updates } : tax)),
    );
  };

  const saveTax = () => {
    if (!outlet) {
            showToast("error","Failed to save tax", "Outlet not available");
      return;
    }
    const errors: Record<string, { name: boolean; rate: boolean }> = {};
    taxes.forEach((tax) => {
      const numericRate = parseRateValue(tax.rate);
      errors[tax.id] = {
        name: !tax.name.trim(),
        rate: numericRate <= 0 || isNaN(numericRate),
      };
    });
    setTaxErrors(errors);

    const hasErrors = Object.values(errors).some((err) => err.name || err.rate);
    if (hasErrors) {
            showToast("error",
        "Invalid tax data",
        "Please provide valid tax names and rates for all taxes",
      );
      return;
    }

    setIsSavingTaxes(true);

    taxes.forEach((tax) => {
      const numericRate = parseRateValue(tax.rate);
      const appType: "checkout" | "included" | "excluded" =
        tax.applyAtOrderCheckout
          ? "checkout"
          : tax.includeInMenuPrices
            ? "included"
            : "excluded";
      const selectedCategoryIds = Object.entries(tax.selectedCategories)
        .filter(([, isSelected]) => isSelected)
        .map(([id]) => id);
      const selectedProductIds = Object.entries(tax.selectedProducts || {})
        .filter(([, isSelected]) => isSelected)
        .map(([productCode]) => productCode);
      const hasCategorySelection = selectedCategoryIds.length > 0;
      const hasProductSelection = selectedProductIds.length > 0;
      const scope: "all" | "category" | "product" =
        tax.productSetup === "categories" && hasCategorySelection
          ? "category"
          : tax.productSetup === "certain" && hasProductSelection
            ? "product"
            : "all";

      void appType;
      void scope;
      void numericRate;
      void selectedProductIds;
    });

    showToast("success","Save Successful!", "Your Tax has been saved successfully");
    setIsSavingTaxes(false);
  };

  const deleteTaxLocal = (id: string) => {
    if (!outlet) {
            showToast("error","Failed to delete tax", "Outlet not available");
      return;
    }

    setTaxes((prev) => prev.filter((tax) => tax.id !== id));
    showToast("success","Tax Deleted", "Tax has been deleted successfully");
  };

  return (
    <Modal
      image={SettingFiles.AccountSettings}
      isOpen={isOpen}
      onClose={onClose}
      title="Account Settings"
      subtitle="Manage your Business tax and service Charge"
    >
      {!isLoadingTaxes && (
        <div className="space-y-6">
          <div className="flex border-b border-[#E6E6E6]">
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === "taxes"
                  ? "text-green-600 border-b-2 border-green-600"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveTab("taxes")}
            >
              Taxes
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === "service"
                  ? "text-green-600 border-b-2 border-green-600"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveTab("service")}
            >
              Service Charge
            </button>
          </div>
          {activeTab === "taxes" && (
            <div className="space-y-6">
              {taxes.map((tax, index) => (
                <TaxItemComponent
                  key={tax.id}
                  tax={tax}
                  index={index}
                  categories={categoriesList}
                  products={productOptions}
                  onUpdate={updateTaxLocal}
                  onAddCategory={addNewCategory}
                  onDelete={deleteTaxLocal}
                  taxErrors={taxErrors[tax.id] || { name: false, rate: false }}
                />
              ))}
              <button
                onClick={addNewTax}
                className="w-full cursor-pointer mb-4 px-4 py-3 border border-[#15BA5C] text-[#15BA5C] rounded-lg hover:bg-green-50 transition-colors flex items-center justify-center bg-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add a new Tax
              </button>
              <button
                onClick={saveTax}
                className="w-full cursor-pointer px-6 py-3 bg-[#15BA5C] text-white font-medium rounded-lg hover:bg-[#13A652] transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={taxes.length === 0 || isSavingTaxes}
              >
                {isSavingTaxes ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving Tax...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save Tax
                  </>
                )}
              </button>
            </div>
          )}
          {activeTab === "service" && (
            <ServiceCharge
              
              storeId={outlet?.id ?? null}
            />
          )}
        </div>
      )}
    </Modal>
  );
};

interface TaxItemComponentProps {
  tax: TaxItem;
  index: number;
  categories: DropdownOption[];
  products: DropdownOption[];
  onUpdate: (id: string, updates: Partial<TaxItem>) => void;
  onAddCategory: (categoryName: string) => void;
  onDelete: (id: string) => void;
  taxErrors?: { name: boolean; rate: boolean };
}

const TaxItemComponent: React.FC<TaxItemComponentProps> = ({
  tax,
  index,
  categories,
  products,
  onUpdate,
  onAddCategory,
  onDelete,
  taxErrors,
}) => {
  const getTaxTitle = () => {
    return `Tax ${index + 1}`;
  };

  const getNamePlaceholder = () => {
    return `Tax ${index + 1}`;
  };

  return (
    <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-white">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        {getTaxTitle()}
      </h3>
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tax Name
          </label>
          <input
            type="text"
            value={tax.name}
            onChange={(e) => onUpdate(tax.id, { name: e.target.value })}
            placeholder={getNamePlaceholder()}
            className={`outline-none text-[12px] border-2 w-full px-3.5 py-2.5 bg-[#FAFAFC] rounded-[10px] ${
              taxErrors?.name ? "border-red-500" : "border-[#D1D1D1]"
            }`}
          />
          {taxErrors?.name && (
            <p className="text-red-500 text-xs mt-1">Tax name is required</p>
          )}
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tax Rate (%)
          </label>
          <input
            type="number"
            value={tax.rate}
            onChange={(e) => onUpdate(tax.id, { rate: e.target.value })}
            step="any"
            placeholder="0"
            className={`outline-none text-[12px] border-2 w-full px-3.5 py-2.5 bg-[#FAFAFC] rounded-[10px] ${
              taxErrors?.rate ? "border-red-500" : "border-[#D1D1D1]"
            }`}
          />
          {taxErrors?.rate && (
            <p className="text-red-500 text-xs mt-1">Valid rate is required</p>
          )}
        </div>
        <div className="">
          <label className="block h-[20px] text-sm font-medium text-gray-700 mb-2"></label>
          <button
            type="button"
            className="border border-[#E33629] h-[40px] w-[45px] rounded-[10px] flex items-center justify-center cursor-pointer hover:bg-red-50 transition"
            onClick={() => onDelete(tax.id)}
            title="Delete Tax"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center">
          <div className="relative">
            <input
              type="radio"
              id={`includeInMenuPrices-${tax.id}`}
              name={`applicationType-${tax.id}`}
              checked={tax.includeInMenuPrices}
              onChange={(e) =>
                onUpdate(tax.id, {
                  includeInMenuPrices: e.target.checked,
                  applyAtOrderCheckout: !e.target.checked,
                })
              }
              className="sr-only"
            />
            <label
              htmlFor={`includeInMenuPrices-${tax.id}`}
              className="flex items-center cursor-pointer"
            >
              <div
                className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                  tax.includeInMenuPrices
                    ? "border-[#15BA5C] bg-[#15BA5C]"
                    : "border-gray-300"
                }`}
              >
                {tax.includeInMenuPrices && (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
              </div>
              <span className="text-sm text-gray-700">
                Include Tax in Menu Prices
              </span>
            </label>
          </div>
        </div>
        <div className="flex items-center">
          <div className="relative">
            <input
              type="radio"
              id={`applyAtOrderCheckout-${tax.id}`}
              name={`applicationType-${tax.id}`}
              checked={tax.applyAtOrderCheckout}
              onChange={(e) =>
                onUpdate(tax.id, {
                  applyAtOrderCheckout: e.target.checked,
                  includeInMenuPrices: !e.target.checked,
                })
              }
              className="sr-only"
            />
            <label
              htmlFor={`applyAtOrderCheckout-${tax.id}`}
              className="flex items-center cursor-pointer"
            >
              <div
                className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                  tax.applyAtOrderCheckout
                    ? "border-[#15BA5C] bg-[#15BA5C]"
                    : "border-gray-300"
                }`}
              >
                {tax.applyAtOrderCheckout && (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
              </div>
              <span className="text-sm text-gray-700">
                Apply Tax at order checkout
              </span>
            </label>
          </div>
        </div>
      </div>
      <div className="space-y-4 mt-4">
        <h4 className="font-medium text-gray-700">Product Setup</h4>
        <div className="space-y-3">
          <div className="flex items-center">
            <div className="relative">
              <input
                type="radio"
                id={`productSetup-all-${tax.id}`}
                name={`productSetup-${tax.id}`}
                checked={tax.productSetup === "all"}
                onChange={() => onUpdate(tax.id, { productSetup: "all" })}
                className="sr-only"
              />
              <label
                htmlFor={`productSetup-all-${tax.id}`}
                className="flex items-center cursor-pointer"
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                    tax.productSetup === "all"
                      ? "border-[#15BA5C] bg-[#15BA5C]"
                      : "border-gray-300"
                  }`}
                >
                  {tax.productSetup === "all" && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
                <span className="text-sm text-gray-700">
                  Apply to all products
                </span>
              </label>
            </div>
          </div>
          <div className="flex items-center">
            <div className="relative">
              <input
                type="radio"
                id={`productSetup-categories-${tax.id}`}
                name={`productSetup-${tax.id}`}
                checked={tax.productSetup === "categories"}
                onChange={() =>
                  onUpdate(tax.id, { productSetup: "categories" })
                }
                className="sr-only"
              />
              <label
                htmlFor={`productSetup-categories-${tax.id}`}
                className="flex items-center cursor-pointer"
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                    tax.productSetup === "categories"
                      ? "border-[#15BA5C] bg-[#15BA5C]"
                      : "border-gray-300"
                  }`}
                >
                  {tax.productSetup === "categories" && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
                <span className="text-sm text-gray-700">
                  Apply to all Categories
                </span>
              </label>
            </div>
          </div>
          <div className="flex items-center">
            <div className="relative">
              <input
                type="radio"
                id={`productSetup-certain-${tax.id}`}
                name={`productSetup-${tax.id}`}
                checked={tax.productSetup === "certain"}
                onChange={() => onUpdate(tax.id, { productSetup: "certain" })}
                className="sr-only"
              />
              <label
                htmlFor={`productSetup-certain-${tax.id}`}
                className="flex items-center cursor-pointer"
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                    tax.productSetup === "certain"
                      ? "border-[#15BA5C] bg-[#15BA5C]"
                      : "border-gray-300"
                  }`}
                >
                  {tax.productSetup === "certain" && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
                <span className="text-sm text-gray-700">
                  Apply to certain products
                </span>
              </label>
            </div>
          </div>
        </div>
        {tax.productSetup === "categories" && (
          <div className="mt-4">
            <Dropdown
              mode="checkbox"
              options={categories}
              selectedValues={tax.selectedCategories}
              onMultiChange={(values) =>
                onUpdate(tax.id, { selectedCategories: values })
              }
              placeholder="Select All that apply"
              label="Categories"
              allowAddNew={true}
              onAddNew={onAddCategory}
              addNewLabel="Add Category"
              className="w-full"
            />
          </div>
        )}
        {tax.productSetup === "certain" && (
          <div className="mt-4">
            <Dropdown
              mode="checkbox"
              options={products}
              selectedValues={tax.selectedProducts}
              onMultiChange={(values) =>
                onUpdate(tax.id, { selectedProducts: values })
              }
              placeholder="Select products"
              label="Products"
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
};

interface ServiceChargeProps {
  
  storeId: string | null;
}

const ServiceCharge: React.FC<ServiceChargeProps> = ({
  
  storeId,
}) => {
    const {showToast}=useToastStore()
  const { selectedOutlet: outlet } = useBusinessStore();
  const [serviceName, setServiceName] = useState("");
  const [serviceRate, setServiceRate] = useState("");
  const [selectedOption, setSelectedOption] = useState<
    "included" | "checkout" | "excluded"
  >("included");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [serviceChargeId, setServiceChargeId] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);

  // Load existing service charge data
  useEffect(() => {
    if (!storeId || !isInitialLoad || !outlet) return;

    try {
      const charges = outlet.serviceCharges?.charges;
      if (charges && charges.length > 0) {
        const firstCharge = charges[0];
        if (firstCharge?.id) setServiceChargeId(firstCharge.id);
        if (firstCharge?.name) setServiceName(firstCharge.name);
        if (firstCharge?.rate !== undefined)
          setServiceRate(String(firstCharge.rate));
        if (firstCharge?.applicationType) {
          setSelectedOption(
            firstCharge.applicationType as "included" | "checkout" | "excluded",
          );
        }
      }
    } catch (error) {
      console.error("Error fetching service charge:", error);
            showToast("error",
        "Failed to load service charge",
        "Failed to fetch service charge data",
      );
    } finally {
      setIsInitialLoad(false);
    }
  }, [storeId, outlet,  isInitialLoad]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!storeId) {
            showToast("error","Failed to save service charge", "Store ID not available");
      return;
    }

    if (!serviceName.trim()) {
            showToast("error","Invalid input", "Service charge name is required");
      return;
    }

    const rate = parseFloat(serviceRate);
    if (Number.isNaN(rate) || rate < 0) {
            showToast("error","Invalid input", "Please provide a valid service charge rate");
      return;
    }

    setIsLoading(true);
    const title = serviceChargeId
      ? "Service Charge Updated"
      : "Service Charge Created";

    const message = `Service Charge has been ${
      serviceChargeId ? "updated" : "created"
    } successfully`;

            showToast("success",title, message);
    setIsLoading(false);
  };

  const handleDelete = () => {
    if (!storeId || !serviceChargeId) {
            showToast("error",
        "Failed to delete service charge",
        "Service charge ID or store ID not available",
      );
      return;
    }

    setServiceName("");
    setServiceRate("");
    setServiceChargeId(null);
    setSelectedOption("included");

    showToast("success",
      "Service Charge Deleted",
      "Service Charge has been deleted successfully",
    );
  };

  return (
    <div className="bg-white p-3 rounded-lg">
      <div className="border border-[#E6E6E6] rounded-[10px] mb-7 relative px-5 py-9">
        <h2 className="text-lg font-semibold bg-white text-gray-900 mb-6 absolute z-50 -top-3.5">
          Service Charge
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="serviceName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Service Charge Name
              </label>
              <input
                type="text"
                id="serviceName"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="Enter name of Service Charge"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label
                htmlFor="serviceRate"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Service Charge Rate (%)
              </label>
              <input
                type="number"
                id="serviceRate"
                value={serviceRate}
                onChange={(e) => setServiceRate(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                required
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="relative">
                <input
                  type="radio"
                  id="includeMenu"
                  name="serviceChargeOption"
                  value="included"
                  checked={selectedOption === "included"}
                  onChange={(e) =>
                    setSelectedOption(
                      e.target.value as "included" | "checkout" | "excluded",
                    )
                  }
                  className="sr-only"
                  disabled={isLoading}
                />
                <label
                  htmlFor="includeMenu"
                  className="flex items-center cursor-pointer"
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                      selectedOption === "included"
                        ? "border-green-500 bg-green-500"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedOption === "included" && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <span className="text-sm text-gray-900">
                    Include Service Charge in Menu Prices
                  </span>
                </label>
              </div>
            </div>
            <div className="flex items-center">
              <div className="relative">
                <input
                  type="radio"
                  id="applyCheckout"
                  name="serviceChargeOption"
                  value="checkout"
                  checked={selectedOption === "checkout"}
                  onChange={(e) =>
                    setSelectedOption(
                      e.target.value as "included" | "checkout" | "excluded",
                    )
                  }
                  className="sr-only"
                  disabled={isLoading}
                />
                <label
                  htmlFor="applyCheckout"
                  className="flex items-center cursor-pointer"
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                      selectedOption === "checkout"
                        ? "border-green-500 bg-green-500"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedOption === "checkout" && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <span className="text-sm text-gray-900">
                    Apply Service Charge at Order checkout
                  </span>
                </label>
              </div>
            </div>
            {/* <div className="flex items-center">
              <div className="relative">
                <input
                  type="radio"
                  id="applyTax"
                  name="serviceChargeOption"
                  value="excluded"
                  checked={selectedOption === "excluded"}
                  onChange={(e) =>
                    setSelectedOption(
                      e.target.value as "included" | "checkout" | "excluded"
                    )
                  }
                  className="sr-only"
                  disabled={isLoading}
                />
                <label
                  htmlFor="applyTax"
                  className="flex items-center cursor-pointer"
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                      selectedOption === "excluded"
                        ? "border-green-500 bg-green-500"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedOption === "excluded" && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <span className="text-sm text-gray-900">
                    Apply Tax at order checkout (optional)
                  </span>
                </label>
              </div>
            </div> */}
          </div>
        </form>
      </div>
      <div className="flex gap-4">
        <button
          onClick={handleSubmit}
          type="button"
          className="w-full bg-[#15BA5C] cursor-pointer hover:bg-green-600 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || !serviceName.trim() || !serviceRate.trim()}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
            </span>
          ) : serviceChargeId ? (
            "Update Service Charge"
          ) : (
            "Create Service Charge"
          )}
        </button>
        {serviceChargeId && (
          <button
            onClick={handleDelete}
            type="button"
            className="w-full border border-[#E33629] text-[#E33629] font-medium py-3 px-4 rounded-md hover:bg-red-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            Delete Service Charge
          </button>
        )}
      </div>
    </div>
  );
};
