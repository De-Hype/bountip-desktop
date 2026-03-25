import { useState, useEffect } from "react";
import { X, Check, Loader2, Trash2 } from "lucide-react";
import { Dropdown, type DropdownOption } from "@/features/settings/ui/Dropdown";
import useBusinessStore from "@/stores/useBusinessStore";
import useToastStore from "@/stores/toastStore";
import { getCurrencySymbol } from "@/utils/getCurrencySymbol";
import { SYNC_ACTIONS } from "../../../electron/types/action.types";
import ImageHandler from "@/shared/Image/ImageHandler";
import DeleteConfirmModal from "./DeleteConfirmModal";

type ProductUpdatePayload = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  preparationArea: string | null;
  price: number | null;
  priceTierId: string[] | null;
  allergens: string[];
  allergenList: string[];
  weight: number | null;
  weightScale: string | null;
  packagingMethod: string[];
  leadTime: number | null;
  availableAtStorefront: 0 | 1;
  createdAtStorefront: 0 | 1;
  isDeleted: 0 | 1;
  isActive: 0 | 1;
  productAvailableStock: number | null;
  productCode: string | null;
  logoUrl: string | null;
  logoHash: string | null;
  outletId: string;
};

type ElectronAPI = {
  createProduct: (payload: any) => Promise<{ id: string }>;
  getSystemDefaults: (key: string, outletId?: string) => Promise<any[]>;
  addSystemDefault: (key: string, data: any, outletId: string) => Promise<any>;
  deleteSystemDefault: (id: string) => Promise<void>;
  queueAdd: (op: any) => Promise<void>;
};

const getElectronAPI = (): ElectronAPI | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { electronAPI?: ElectronAPI };
  return w.electronAPI ?? null;
};

type ProductCategory = {
  id: number | string;
  name: string;
};

type PriceTier = {
  id: number | string;
  name: string;
  value: string;
  active: boolean;
  pricingRules?: {
    markupPercentage?: number;
    discountPercentage?: number;
    fixedMarkup?: number;
    fixedDiscount?: number;
  };
};

type PreparationAreaOption = {
  id: number | string;
  name: string;
};

type Allergen = {
  id: number | string;
  name: string;
  selected: boolean;
};

type WeightUnit = {
  id: number | string;
  name: string;
};

type PackagingMethod = {
  id: number | string;
  name: string;
};

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  preparationArea?: string;
  allergenList?: string | string[];
  isActive: number;
  availableAtStorefront: number;
  logoUrl: string | null;
  weight?: number;
  weightScale?: string;
  packagingMethod?: string | string[];
  leadTime?: number;
  priceTierId?: string | string[];
}

type EditProductProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  product: Product | null;
};

type AddEntityModalProps = {
  isOpen: boolean;
  title?: string;
  fieldLabel?: string;
  fieldPlaceholder?: string;
  submitLabel?: string;
  onClose: () => void;
  onSubmit: (value: string) => void;
};

type ToggleSwitchProps = {
  checked: boolean;
  onToggle: () => void;
};

const ToggleSwitch = ({ checked, onToggle }: ToggleSwitchProps) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={checked ? "Turn off" : "Turn on"}
      title={checked ? "Turn off" : "Turn on"}
      className={`relative inline-flex h-4 w-10 items-center rounded-full transition-colors duration-200 ${
        checked ? "bg-[#15BA5C]" : "bg-[#D1D5DB]"
      }`}
    >
      <span
        className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
};

const AddEntityModal = ({
  isOpen,
  title = "Add item",
  fieldLabel = "Name",
  fieldPlaceholder = "Enter name",
  submitLabel = "Add",
  onClose,
  onSubmit,
}: AddEntityModalProps) => {
  const [value, setValue] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4 sm:p-6 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-[24px] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F4F6] text-[#111827] cursor-pointer hover:bg-[#E5E7EB] transition-colors"
          aria-label="Close add item modal"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-6 sm:px-8 pt-8 pb-6">
          <h2 className="text-lg font-semibold text-[#1C1B20]">{title}</h2>

          <div className="mt-6 space-y-2">
            <p className="text-sm font-medium text-[#111827]">{fieldLabel}</p>
            <input
              type="text"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={fieldPlaceholder}
              className="w-full rounded-[12px] border border-[#E5E7EB] bg-[#FAFAFC] px-4 py-3 text-sm text-[#111827] placeholder-[#A6A6A6] outline-none focus:border-[#15BA5C] focus:ring-1 focus:ring-[#15BA5C] transition-all"
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-[12px] bg-[#15BA5C] px-4 text-sm font-medium text-white cursor-pointer hover:bg-[#13A652] active:scale-[0.98] transition-all"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const EditProduct = ({
  isOpen,
  onClose,
  onSuccess,
  product,
}: EditProductProps) => {
  const { showToast } = useToastStore();
  const [activeTab, setActiveTab] = useState<"basic" | "modifiers">("basic");
  const { selectedOutletId, selectedOutlet } = useBusinessStore();

  const [productName, setProductName] = useState("");
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    number | string | undefined
  >(undefined);
  const [defaultPrice, setDefaultPrice] = useState("");
  const [priceTierEnabled, setPriceTierEnabled] = useState(false);
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([]);
  const [description, setDescription] = useState("");
  const [preparationAreas, setPreparationAreas] = useState<
    PreparationAreaOption[]
  >([]);
  const [selectedPreparationAreaId, setSelectedPreparationAreaId] = useState<
    number | string | undefined
  >(undefined);
  const [leadTimeDays, setLeadTimeDays] = useState("");
  const [leadTimeHours, setLeadTimeHours] = useState("");
  const [leadTimeMinutes, setLeadTimeMinutes] = useState("");
  const [allergensEnabled, setAllergensEnabled] = useState(false);
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [weight, setWeight] = useState("");
  const [weightUnits, setWeightUnits] = useState<WeightUnit[]>([]);
  const [selectedWeightUnitId, setSelectedWeightUnitId] = useState<
    number | string | undefined
  >(undefined);
  const [packagingMethods, setPackagingMethods] = useState<PackagingMethod[]>(
    [],
  );
  const [selectedPackagingMethods, setSelectedPackagingMethods] = useState<
    Record<string, boolean>
  >({});
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isAddAllergenModalOpen, setIsAddAllergenModalOpen] = useState(false);
  const [isAddWeightUnitModalOpen, setIsAddWeightUnitModalOpen] =
    useState(false);
  const [isAddPreparationAreaModalOpen, setIsAddPreparationAreaModalOpen] =
    useState(false);

  const currencySymbol = selectedOutlet?.currency
    ? getCurrencySymbol(selectedOutlet.currency)
    : "";

  // Fetch initial data
  const fetchSystemDefaults = async (
    key: string,
    setter: (data: any[]) => void,
  ) => {
    const api = getElectronAPI();
    if (api && selectedOutletId) {
      try {
        const result = await api.getSystemDefaults(key, selectedOutletId);
        const dbItems: any[] = [];

        for (const row of result) {
          try {
            const data = JSON.parse(row.data);
            if (Array.isArray(data)) {
              data.forEach((item: any, index: number) => {
                dbItems.push({
                  id: item.id || `${row.id}-${index}`,
                  name: item.name || item,
                  selected: item.selected ?? false,
                });
              });
            } else if (data?.name || typeof data === "string") {
              dbItems.push({
                id: row.id,
                name: data.name || data,
                selected: data.selected ?? false,
              });
            }
          } catch (e) {
            console.error(`Failed to parse ${key} row data`, row, e);
          }
        }
        setter(dbItems);
      } catch (error) {
        console.error(`Failed to fetch ${key} from DB`, error);
      }
    }
  };

  useEffect(() => {
    const resetState = () => {
      setProductName("");
      setDescription("");
      setLogoUrl(null);
      setDefaultPrice("");
      setWeight("");
      setLeadTimeDays("");
      setLeadTimeHours("");
      setLeadTimeMinutes("");
      setSelectedCategoryId(undefined);
      setSelectedPreparationAreaId(undefined);
      setSelectedWeightUnitId(undefined);
      setAllergens([]);
      setAllergensEnabled(false);
      setPackagingMethods([]);
      setSelectedPackagingMethods({});
      setPriceTiers([]);
      setPriceTierEnabled(false);
    };

    if (!isOpen) {
      resetState();
      return;
    }

    if (product) {
      // Initialize simple fields
      setProductName(product.name);
      setDefaultPrice(product.price.toString());
      setDescription(product.description || "");
      setLogoUrl(product.logoUrl);
      setWeight(product.weight?.toString() || "");

      if (product.leadTime) {
        const days = Math.floor(product.leadTime / (24 * 60));
        const hours = Math.floor((product.leadTime % (24 * 60)) / 60);
        const minutes = product.leadTime % 60;
        setLeadTimeDays(days > 0 ? days.toString() : "");
        setLeadTimeHours(hours > 0 ? hours.toString() : "");
        setLeadTimeMinutes(minutes > 0 ? minutes.toString() : "");
      }

      const api = getElectronAPI();
      if (api && selectedOutletId) {
        // Fetch and set complex fields
        fetchSystemDefaults("category", (items) => {
          setCategories(items);
          const cat = items.find((c) => c.name === product.category);
          if (cat) setSelectedCategoryId(cat.id);
        });

        fetchSystemDefaults("preparation-area", (items) => {
          setPreparationAreas(items);
          const area = items.find((a) => a.name === product.preparationArea);
          if (area) setSelectedPreparationAreaId(area.id);
        });

        fetchSystemDefaults("weight-scale", (items) => {
          setWeightUnits(items);
          const unit = items.find((u) => u.name === product.weightScale);
          if (unit) setSelectedWeightUnitId(unit.id);
        });

        fetchSystemDefaults("allergens", (items) => {
          const productAllergens = product.allergenList
            ? Array.isArray(product.allergenList)
              ? product.allergenList
              : JSON.parse(product.allergenList as string)
            : [];
          const allItems = items.map((i) => ({
            ...i,
            selected: productAllergens.includes(i.name),
          }));
          setAllergens(allItems);
          if (productAllergens.length > 0) {
            setAllergensEnabled(true);
          }
        });

        fetchSystemDefaults("packaging-method", (items) => {
          setPackagingMethods(items);
          const productMethods = product.packagingMethod
            ? Array.isArray(product.packagingMethod)
              ? product.packagingMethod
              : JSON.parse(product.packagingMethod as string)
            : [];
          const methodMap: Record<string, boolean> = {};
          items.forEach((item) => {
            if (productMethods.includes(item.name)) {
              methodMap[String(item.id)] = true;
            }
          });
          setSelectedPackagingMethods(methodMap);
        });
      }

      // Price Tiers
      if (selectedOutlet?.priceTier) {
        try {
          const parsedTiers =
            typeof selectedOutlet.priceTier === "string"
              ? JSON.parse(selectedOutlet.priceTier)
              : selectedOutlet.priceTier;
          const productTiers = product.priceTierId
            ? Array.isArray(product.priceTierId)
              ? product.priceTierId
              : JSON.parse(product.priceTierId as string)
            : [];

          if (productTiers.length > 0) {
            setPriceTierEnabled(true);
          }

          const tiers = (Array.isArray(parsedTiers) ? parsedTiers : []).map(
            (t: any) => ({
              id: t.id,
              name: t.name,
              value: "",
              active: productTiers.includes(t.name),
              pricingRules: t.pricingRules,
            }),
          );
          setPriceTiers(tiers);
        } catch (e) {
          console.error("Failed to parse price tiers", e);
          setPriceTiers([]);
        }
      }
    }
  }, [isOpen, product, selectedOutletId, selectedOutlet?.priceTier]);

  const calculateTierPrice = (rules?: PriceTier["pricingRules"]) => {
    const price = parseFloat(defaultPrice);
    if (isNaN(price)) return "0.00";

    let finalPrice = price;
    if (rules) {
      if (rules.markupPercentage)
        finalPrice += price * (Number(rules.markupPercentage) / 100);
      if (rules.fixedMarkup) finalPrice += Number(rules.fixedMarkup);
      if (rules.discountPercentage)
        finalPrice -= price * (Number(rules.discountPercentage) / 100);
      if (rules.fixedDiscount) finalPrice -= Number(rules.fixedDiscount);
    }
    return finalPrice.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const renderPricingRuleBadges = (rules?: PriceTier["pricingRules"]) => {
    if (!rules) return null;
    const badges = [];
    if (rules.markupPercentage)
      badges.push(
        <span
          key="markup-pct"
          className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700"
        >
          +{rules.markupPercentage}% Markup
        </span>,
      );
    if (rules.fixedMarkup)
      badges.push(
        <span
          key="markup-fixed"
          className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700"
        >
          +{currencySymbol}
          {Number(rules.fixedMarkup).toLocaleString("en-US")} Markup
        </span>,
      );
    if (rules.discountPercentage)
      badges.push(
        <span
          key="discount-pct"
          className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700"
        >
          -{rules.discountPercentage}% Discount
        </span>,
      );
    if (rules.fixedDiscount)
      badges.push(
        <span
          key="discount-fixed"
          className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700"
        >
          -{currencySymbol}
          {Number(rules.fixedDiscount).toLocaleString("en-US")} Discount
        </span>,
      );
    return <div className="flex flex-wrap gap-1">{badges}</div>;
  };

  const handleUpdateProduct = async () => {
    const api = getElectronAPI();
    if (!api || !selectedOutletId || !product) return;

    try {
      const dup =
        (await ((window as any).electronAPI?.dbQuery?.(
          "SELECT id FROM product WHERE outletId = ? AND isDeleted = 0 AND LOWER(name) = LOWER(?) AND id != ? LIMIT 1",
          [selectedOutletId, productName.trim(), product.id],
        ) as Promise<any[]>)) || [];
      if (dup.length > 0) {
        showToast(
          "error",
          "Duplicate product",
          "Another product with this name already exists in this outlet.",
        );
        return;
      }
    } catch (e) {
      console.error("Duplicate check failed:", e);
    }

    setIsUpdating(true);
    const selectedCategory = categories.find(
      (c) => c.id === selectedCategoryId,
    );
    const selectedPreparationArea = preparationAreas.find(
      (a) => a.id === selectedPreparationAreaId,
    );
    const selectedPriceTier = priceTiers.find((tier) => tier.active);
    const activePackagingMethods = packagingMethods
      .filter((m) => selectedPackagingMethods[String(m.id)])
      .map((m) => m.name);
    const activeAllergens = allergens
      .filter((a) => a.selected)
      .map((a) => a.name);
    const leadTimeTotalMinutes =
      (Number(leadTimeDays) || 0) * 24 * 60 +
      (Number(leadTimeHours) || 0) * 60 +
      (Number(leadTimeMinutes) || 0);
    const selectedWeightUnit = weightUnits.find(
      (u) => u.id === selectedWeightUnitId,
    );

    const payload: ProductUpdatePayload = {
      id: product.id,
      name: productName,
      description,
      category: selectedCategory?.name ?? null,
      preparationArea: selectedPreparationArea?.name ?? null,
      price: defaultPrice ? Number(defaultPrice) : null,
      priceTierId: selectedPriceTier ? [selectedPriceTier.name] : null,
      allergens: activeAllergens,
      allergenList: activeAllergens,
      weight: weight ? Number(weight) : null,
      weightScale: selectedWeightUnit?.name ?? null,
      packagingMethod: activePackagingMethods,
      leadTime: leadTimeTotalMinutes || null,
      availableAtStorefront: product.availableAtStorefront as 0 | 1,
      createdAtStorefront: 1 as 1,
      isDeleted: 0 as 0,
      isActive: product.isActive as 0 | 1,
      productAvailableStock: null,
      productCode: null,
      logoUrl: logoUrl,
      logoHash: null,
      outletId: selectedOutletId,
    };

    try {
      await api.createProduct(payload); // Using createProduct for upsert
      showToast(
        "success",
        "Product Updated",
        `${productName} has been updated successfully.`,
      );
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to update product:", error);
      showToast(
        "error",
        "Update Failed",
        "Failed to update product. Please try again.",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteProduct = async () => {
    const api = getElectronAPI();
    if (!api || !selectedOutletId || !product) return;

    setIsDeleteConfirmOpen(false);
    setIsDeleting(true);

    const selectedCategory = categories.find(
      (c) => c.id === selectedCategoryId,
    );
    const selectedPreparationArea = preparationAreas.find(
      (a) => a.id === selectedPreparationAreaId,
    );
    const selectedPriceTier = priceTiers.find((tier) => tier.active);
    const activePackagingMethods = packagingMethods
      .filter((m) => selectedPackagingMethods[String(m.id)])
      .map((m) => m.name);
    const activeAllergens = allergens
      .filter((a) => a.selected)
      .map((a) => a.name);
    const leadTimeTotalMinutes =
      (Number(leadTimeDays) || 0) * 24 * 60 +
      (Number(leadTimeHours) || 0) * 60 +
      (Number(leadTimeMinutes) || 0);
    const selectedWeightUnit = weightUnits.find(
      (u) => u.id === selectedWeightUnitId,
    );

    const payload: ProductUpdatePayload = {
      id: product.id,
      name: productName,
      description,
      category: selectedCategory?.name ?? null,
      preparationArea: selectedPreparationArea?.name ?? null,
      price: defaultPrice ? Number(defaultPrice) : null,
      priceTierId: selectedPriceTier ? [selectedPriceTier.name] : null,
      allergens: activeAllergens,
      allergenList: activeAllergens,
      weight: weight ? Number(weight) : null,
      weightScale: selectedWeightUnit?.name ?? null,
      packagingMethod: activePackagingMethods,
      leadTime: leadTimeTotalMinutes || null,
      availableAtStorefront: product.availableAtStorefront as 0 | 1,
      createdAtStorefront: 1 as 1,
      isDeleted: 1 as 1, // SET TO DELETED
      isActive: 0 as 0, // DEACTIVATE
      productAvailableStock: null,
      productCode: null,
      logoUrl: logoUrl,
      logoHash: null,
      outletId: selectedOutletId,
    };

    try {
      await api.createProduct(payload); // Using createProduct for upsert
      showToast(
        "success",
        "Product Deleted",
        `${productName} has been deleted successfully.`,
      );
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to delete product:", error);
      showToast(
        "error",
        "Delete Failed",
        "Failed to delete product. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  const handleEntityAdded = async (
    key: string,
    name: string,
    setter: React.Dispatch<React.SetStateAction<any[]>>,
    modalSetter?: (open: boolean) => void,
    extraFields: Record<string, any> = {},
  ) => {
    const api = getElectronAPI();
    if (api && selectedOutletId) {
      try {
        const result = await api.addSystemDefault(
          key,
          [{ name, ...extraFields }],
          selectedOutletId,
        );
        const newItem = { id: result.id, name, ...extraFields };
        await api.queueAdd({
          tableName: "system_default",
          action: SYNC_ACTIONS.CREATE,
          id: result.id,
          data: {
            id: result.id,
            key,
            data: [{ name, ...extraFields }],
            outletId: selectedOutletId,
          },
        });
        setter((prev) => [...prev, newItem]);
        modalSetter?.(false);
        return newItem;
      } catch (error) {
        console.error(`Failed to add ${key} to DB`, error);
      }
    }
  };

  const handleEntityDeleted = async (
    id: string | number,
    setter: React.Dispatch<React.SetStateAction<any[]>>,
  ) => {
    const api = getElectronAPI();
    if (api) {
      try {
        await api.deleteSystemDefault(String(id));
        setter((prev) => prev.filter((item) => item.id !== id));
      } catch (error) {
        console.error("Failed to delete item", error);
      }
    }
  };

  const handleCategoryDelete = (option: DropdownOption) => {
    handleEntityDeleted(option.value, setCategories);
    if (selectedCategoryId === option.value) setSelectedCategoryId(undefined);
  };

  const handleCategoryAdded = async (name: string) => {
    const newItem = await handleEntityAdded(
      "category",
      name,
      setCategories,
      setIsAddCategoryModalOpen,
    );
    if (newItem) setSelectedCategoryId(newItem.id);
  };

  const handleAllergenToggle = (id: number | string) => {
    setAllergens((prev) =>
      prev.map((a) => (a.id === id ? { ...a, selected: !a.selected } : a)),
    );
  };

  const handleAllergenDelete = (id: number | string) =>
    handleEntityDeleted(id, setAllergens);

  const handleAllergenAdded = (name: string) => {
    handleEntityAdded(
      "allergen",
      name,
      setAllergens,
      setIsAddAllergenModalOpen,
      { selected: true },
    );
  };

  const handleWeightUnitDelete = (option: DropdownOption) => {
    handleEntityDeleted(option.value, setWeightUnits);
    if (selectedWeightUnitId === option.value)
      setSelectedWeightUnitId(undefined);
  };

  const handleWeightUnitAdded = async (name: string) => {
    const newItem = await handleEntityAdded(
      "weightUnit",
      name,
      setWeightUnits,
      setIsAddWeightUnitModalOpen,
    );
    if (newItem) setSelectedWeightUnitId(newItem.id);
  };

  const handlePreparationAreaDelete = (option: DropdownOption) => {
    handleEntityDeleted(option.value, setPreparationAreas);
    if (selectedPreparationAreaId === option.value)
      setSelectedPreparationAreaId(undefined);
  };

  const handlePreparationAreaAdded = async (name: string) => {
    const newItem = await handleEntityAdded(
      "preparationArea",
      name,
      setPreparationAreas,
      setIsAddPreparationAreaModalOpen,
    );
    if (newItem) setSelectedPreparationAreaId(newItem.id);
  };

  const handlePackagingMethodDelete = (option: DropdownOption) => {
    handleEntityDeleted(option.value, setPackagingMethods);
    setSelectedPackagingMethods((prev) => {
      const next = { ...prev };
      delete next[option.value];
      return next;
    });
  };

  const handlePackagingMethodAdded = (name: string) =>
    handleEntityAdded("packagingMethod", name, setPackagingMethods);

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40">
      <div className="relative flex h-full w-full max-w-[840px] flex-col rounded-l-[20px] bg-white shadow-2xl">
        <div className="flex items-center justify-between px-8 py-6">
          <h2 className="text-[24px] font-bold text-[#000000]">Edit Product</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FEE2E2] text-[#EF4444] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b border-[#E5E7EB] px-8 pt-4">
            <div className="flex gap-6 text-sm font-medium">
              <button
                type="button"
                onClick={() => setActiveTab("basic")}
                className={`pb-3 ${activeTab === "basic" ? "border-b-2 border-[#15BA5C] text-[#111827]" : "text-[#6B7280]"}`}
              >
                Basic Information
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("modifiers")}
                className={`pb-3 ${activeTab === "modifiers" ? "border-b-2 border-[#15BA5C] text-[#111827]" : "text-[#6B7280]"}`}
              >
                Modifiers
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-8 pb-8 pt-6">
            {activeTab === "basic" ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[15px] font-medium text-[#1C1B20]">
                    Product Name <span className="text-[#EF4444]">*</span>
                  </p>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Enter Product Name"
                    className="w-full rounded-[12px] border border-[#E5E7EB] bg-[#FAFAFC] px-4 py-3 text-sm text-[#111827] outline-none focus:border-[#15BA5C] focus:ring-1 focus:ring-[#15BA5C]"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-[15px] font-medium text-[#1C1B20]">
                    Product Category <span className="text-[#EF4444]">*</span>
                  </p>
                  <Dropdown
                    name="productCategory"
                    options={categories.map((c) => ({
                      value: String(c.id),
                      label: c.name,
                    }))}
                    selectedValue={
                      selectedCategoryId
                        ? String(selectedCategoryId)
                        : undefined
                    }
                    onChange={setSelectedCategoryId}
                    placeholder="Click to select category"
                    className="w-full"
                    allowAddNew
                    onAddNewClick={() => setIsAddCategoryModalOpen(true)}
                    addNewLabel="+"
                    onDeleteOption={handleCategoryDelete}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-[15px] font-medium text-[#1C1B20]">
                    Set Default Selling Price{" "}
                    <span className="text-[#EF4444]">*</span>
                  </p>
                  <div className="flex items-center rounded-[12px] border border-[#E5E7EB] bg-[#FAFAFC] px-4 py-3 text-sm text-[#111827]">
                    <input
                      type="text"
                      value={defaultPrice}
                      onChange={(e) => setDefaultPrice(e.target.value)}
                      placeholder="Enter Selling Price"
                      className="flex-1 bg-transparent outline-none"
                    />
                    <span className="text-xs font-semibold text-[#15BA5C]">
                      {currencySymbol}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[15px] font-medium text-[#1C1B20]">
                        Price Tier
                      </p>
                      <p className="text-xs text-[#6B7280]">
                        Activate price tiers for your selling price
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={priceTierEnabled}
                      onToggle={() => setPriceTierEnabled(!priceTierEnabled)}
                    />
                  </div>
                  {priceTierEnabled && (
                    <div className="space-y-3">
                      {priceTiers.map((tier) => (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() =>
                            setPriceTiers((prev) =>
                              prev.map((t) =>
                                t.id === tier.id
                                  ? { ...t, active: !t.active }
                                  : t,
                              ),
                            )
                          }
                          className={`flex w-full items-center justify-between rounded-[12px] border px-4 py-3 text-left text-sm ${tier.active ? "border-[#15BA5C] bg-white" : "border-[#E5E7EB] bg-white"}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6]">
                              <svg
                                width="32"
                                height="32"
                                viewBox="0 0 32 32"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M16.4997 5.15625L16.177 5.445L4.41349 17.3384L3.70605 18.0479L4.41452 18.7904L14.2114 28.5873L14.9539 29.2958L15.6655 28.5873L27.5558 16.8238L27.8435 16.5V5.15625H16.4997ZM17.3701 7.21875H25.781V15.6296L14.9529 26.3938L6.60593 18.0469L17.3701 7.21875ZM22.6872 9.28125C22.4137 9.28125 22.1514 9.3899 21.958 9.5833C21.7646 9.77669 21.656 10.039 21.656 10.3125C21.656 10.586 21.7646 10.8483 21.958 11.0417C22.1514 11.2351 22.4137 11.3438 22.6872 11.3438C22.9607 11.3438 23.223 11.2351 23.4164 11.0417C23.6098 10.8483 23.7185 10.586 23.7185 10.3125C23.7185 10.039 23.6098 9.77669 23.4164 9.5833C23.223 9.3899 22.9607 9.28125 22.6872 9.28125Z"
                                  fill="#15BA5C"
                                />
                              </svg>
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">
                                  {tier.name}
                                </span>
                                {renderPricingRuleBadges(tier.pricingRules)}
                              </div>
                              <span className="text-sm font-bold text-gray-900">
                                {currencySymbol}
                                {calculateTierPrice(tier.pricingRules)}
                              </span>
                            </div>
                          </div>
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-[4px] border ${tier.active ? "border-[#15BA5C] bg-[#15BA5C]" : "border-[#D1D5DB] bg-white"}`}
                          >
                            {tier.active && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-[15px] font-medium text-[#1C1B20]">
                    Product Description
                  </p>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter Description"
                    rows={4}
                    className="w-full resize-none rounded-[12px] border border-[#E5E7EB] bg-[#FAFAFC] px-4 py-3 text-sm outline-none focus:border-[#15BA5C] focus:ring-1 focus:ring-[#15BA5C]"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-[15px] font-medium text-[#1C1B20]">
                    Preparation Area <span className="text-[#EF4444]">*</span>
                  </p>
                  <Dropdown
                    name="preparationArea"
                    options={preparationAreas.map((a) => ({
                      value: String(a.id),
                      label: a.name,
                    }))}
                    selectedValue={
                      selectedPreparationAreaId
                        ? String(selectedPreparationAreaId)
                        : undefined
                    }
                    onChange={setSelectedPreparationAreaId}
                    placeholder="Select Area"
                    className="w-full"
                    allowAddNew
                    onAddNewClick={() => setIsAddPreparationAreaModalOpen(true)}
                    addNewLabel="+"
                    onDeleteOption={handlePreparationAreaDelete}
                  />
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[15px] font-medium text-[#1C1B20]">
                          Add Allergens
                        </p>
                        <p className="text-xs text-[#6B7280]">
                          Select or add all allergens associated with this
                          Product
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={allergensEnabled}
                        onToggle={() => setAllergensEnabled(!allergensEnabled)}
                      />
                    </div>

                    {allergensEnabled && (
                      <div className="flex flex-wrap gap-3">
                        {allergens.map((a) => (
                          <div
                            key={a.id}
                            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${a.selected ? "border-[#15BA5C] bg-[#ECFDF3] text-[#047857]" : "border-[#E5E7EB] bg-white"}`}
                          >
                            <button
                              type="button"
                              onClick={() => handleAllergenToggle(a.id)}
                            >
                              {a.name}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAllergenDelete(a.id)}
                              className="ml-1 text-[#9CA3AF] hover:text-[#EF4444]"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setIsAddAllergenModalOpen(true)}
                          className="flex items-center gap-2 rounded-full border border-[#15BA5C] px-4 py-2 text-sm text-[#15BA5C]"
                        >
                          <span className="text-base leading-none">+</span>
                          <span>Add</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-[15px] font-medium text-[#1C1B20]">
                      Lead Time <span className="text-[#EF4444]">*</span>
                    </p>
                    <div className="grid gap-3 md:grid-cols-3">
                      {["Days", "Hours", "Minutes"].map((label, i) => {
                        const value =
                          i === 0
                            ? leadTimeDays
                            : i === 1
                              ? leadTimeHours
                              : leadTimeMinutes;
                        const setter =
                          i === 0
                            ? setLeadTimeDays
                            : i === 1
                              ? setLeadTimeHours
                              : setLeadTimeMinutes;
                        return (
                          <div
                            key={label}
                            className="flex items-center rounded-[12px] bg-[#FAFAFC] px-3 py-3 text-sm"
                          >
                            <input
                              type="number"
                              value={value}
                              onChange={(e) => setter(e.target.value)}
                              placeholder={label}
                              className="flex-1 bg-transparent outline-none"
                            />
                            <Check className="h-4 w-4 text-[#9CA3AF]" />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-[15px] font-medium text-[#1C1B20]">
                        Weight
                      </p>
                      <input
                        type="text"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-[12px] border border-[#E5E7EB] bg-[#FAFAFC] px-4 py-3 text-sm outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[15px] font-medium text-[#1C1B20]">
                        Weight Unit of Measure
                      </p>
                      <Dropdown
                        name="weightUnit"
                        options={weightUnits.map((u) => ({
                          value: String(u.id),
                          label: u.name,
                        }))}
                        selectedValue={
                          selectedWeightUnitId
                            ? String(selectedWeightUnitId)
                            : undefined
                        }
                        onChange={setSelectedWeightUnitId}
                        placeholder="Select unit"
                        className="w-full"
                        allowAddNew
                        onAddNewClick={() => setIsAddWeightUnitModalOpen(true)}
                        addNewLabel="+"
                        onDeleteOption={handleWeightUnitDelete}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[15px] font-medium text-[#1C1B20]">
                      Packaging Method
                    </p>
                    <Dropdown
                      name="packagingMethod"
                      mode="checkbox"
                      options={packagingMethods.map((m) => ({
                        value: String(m.id),
                        label: m.name,
                      }))}
                      selectedValues={selectedPackagingMethods}
                      onMultiChange={setSelectedPackagingMethods}
                      placeholder="Select method"
                      className="w-full"
                      allowAddNew
                      onAddNew={handlePackagingMethodAdded}
                      onDeleteOption={handlePackagingMethodDelete}
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-[15px] font-medium text-[#1C1B20]">
                      Product Image
                    </p>
                    <ImageHandler
                      value={logoUrl}
                      onChange={({ url }) => setLogoUrl(url)}
                      label=""
                      className="w-full"
                      previewSize="lg"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className=""></div>
              // <div className="space-y-6">
              //   <div className="space-y-3">
              //     <div className="flex items-center justify-between">
              //       <div>
              //         <p className="text-[15px] font-medium text-[#1C1B20]">
              //           Add Allergens
              //         </p>
              //         <p className="text-xs text-[#6B7280]">
              //           Select or add all allergens associated with this Product
              //         </p>
              //       </div>
              //       <ToggleSwitch
              //         checked={allergensEnabled}
              //         onToggle={() => setAllergensEnabled(!allergensEnabled)}
              //       />
              //     </div>

              //     {allergensEnabled && (
              //       <div className="flex flex-wrap gap-3">
              //         {allergens.map((a) => (
              //           <div
              //             key={a.id}
              //             className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${a.selected ? "border-[#15BA5C] bg-[#ECFDF3] text-[#047857]" : "border-[#E5E7EB] bg-white"}`}
              //           >
              //             <button
              //               type="button"
              //               onClick={() => handleAllergenToggle(a.id)}
              //             >
              //               {a.name}
              //             </button>
              //             <button
              //               type="button"
              //               onClick={() => handleAllergenDelete(a.id)}
              //               className="ml-1 text-[#9CA3AF] hover:text-[#EF4444]"
              //             >
              //               <X className="h-3 w-3" />
              //             </button>
              //           </div>
              //         ))}
              //         <button
              //           type="button"
              //           onClick={() => setIsAddAllergenModalOpen(true)}
              //           className="flex items-center gap-2 rounded-full border border-[#15BA5C] px-4 py-2 text-sm text-[#15BA5C]"
              //         >
              //           <span className="text-base leading-none">+</span>
              //           <span>Add</span>
              //         </button>
              //       </div>
              //     )}
              //   </div>

              //   <div className="space-y-2">
              //     <p className="text-[15px] font-medium text-[#1C1B20]">
              //       Lead Time <span className="text-[#EF4444]">*</span>
              //     </p>
              //     <div className="grid gap-3 md:grid-cols-3">
              //       {["Days", "Hours", "Minutes"].map((label, i) => {
              //         const value =
              //           i === 0
              //             ? leadTimeDays
              //             : i === 1
              //               ? leadTimeHours
              //               : leadTimeMinutes;
              //         const setter =
              //           i === 0
              //             ? setLeadTimeDays
              //             : i === 1
              //               ? setLeadTimeHours
              //               : setLeadTimeMinutes;
              //         return (
              //           <div
              //             key={label}
              //             className="flex items-center rounded-[12px] bg-[#FAFAFC] px-3 py-3 text-sm"
              //           >
              //             <input
              //               type="number"
              //               value={value}
              //               onChange={(e) => setter(e.target.value)}
              //               placeholder={label}
              //               className="flex-1 bg-transparent outline-none"
              //             />
              //             <Check className="h-4 w-4 text-[#9CA3AF]" />
              //           </div>
              //         );
              //       })}
              //     </div>
              //   </div>

              //   <div className="grid gap-6 md:grid-cols-2">
              //     <div className="space-y-2">
              //       <p className="text-[15px] font-medium text-[#1C1B20]">
              //         Weight
              //       </p>
              //       <input
              //         type="text"
              //         value={weight}
              //         onChange={(e) => setWeight(e.target.value)}
              //         placeholder="0.00"
              //         className="w-full rounded-[12px] border border-[#E5E7EB] bg-[#FAFAFC] px-4 py-3 text-sm outline-none"
              //       />
              //     </div>
              //     <div className="space-y-2">
              //       <p className="text-[15px] font-medium text-[#1C1B20]">
              //         Weight Unit of Measure
              //       </p>
              //       <Dropdown
              //         name="weightUnit"
              //         options={weightUnits.map((u) => ({
              //           value: String(u.id),
              //           label: u.name,
              //         }))}
              //         selectedValue={
              //           selectedWeightUnitId
              //             ? String(selectedWeightUnitId)
              //             : undefined
              //         }
              //         onChange={setSelectedWeightUnitId}
              //         placeholder="Select unit"
              //         className="w-full"
              //         allowAddNew
              //         onAddNewClick={() => setIsAddWeightUnitModalOpen(true)}
              //         addNewLabel="+"
              //         onDeleteOption={handleWeightUnitDelete}
              //       />
              //     </div>
              //   </div>

              //   <div className="space-y-2">
              //     <p className="text-[15px] font-medium text-[#1C1B20]">
              //       Packaging Method
              //     </p>
              //     <Dropdown
              //       name="packagingMethod"
              //       mode="checkbox"
              //       options={packagingMethods.map((m) => ({
              //         value: String(m.id),
              //         label: m.name,
              //       }))}
              //       selectedValues={selectedPackagingMethods}
              //       onMultiChange={setSelectedPackagingMethods}
              //       placeholder="Select method"
              //       className="w-full"
              //       allowAddNew
              //       onAddNew={handlePackagingMethodAdded}
              //       onDeleteOption={handlePackagingMethodDelete}
              //     />
              //   </div>

              //   <div className="space-y-2">
              //     <p className="text-[15px] font-medium text-[#1C1B20]">
              //       Product Image
              //     </p>
              //     <ImageHandler
              //       value={logoUrl}
              //       onChange={({ url }) => setLogoUrl(url)}
              //       label=""
              //       className="w-full"
              //       previewSize="lg"
              //     />
              //   </div>
              // </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 px-8 py-4 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => setIsDeleteConfirmOpen(true)}
              disabled={isDeleting || isUpdating}
              className={`rounded-[12px] w-full border px-6 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                isDeleting || isUpdating
                  ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                  : "border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444] hover:text-white cursor-pointer"
              }`}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleUpdateProduct}
              disabled={isDeleting || isUpdating}
              className={`rounded-[12px] w-full px-10 py-3 text-sm font-bold text-white transition-colors flex items-center justify-center gap-2 ${
                isDeleting || isUpdating
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#15BA5C] hover:bg-[#13A652] cursor-pointer"
              }`}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Update Product
                </>
              )}
            </button>
          </div>
        </div>

        <AddEntityModal
          isOpen={isAddCategoryModalOpen}
          onClose={() => setIsAddCategoryModalOpen(false)}
          title="Add Product Category"
          fieldLabel="Category Name"
          fieldPlaceholder="Enter the name of the category"
          submitLabel="Add Category"
          onSubmit={handleCategoryAdded}
        />
        <AddEntityModal
          isOpen={isAddAllergenModalOpen}
          onClose={() => setIsAddAllergenModalOpen(false)}
          title="Add Allergen"
          fieldLabel="Allergen Name"
          fieldPlaceholder="Enter the name of the allergen"
          submitLabel="Add Allergen"
          onSubmit={handleAllergenAdded}
        />
        <AddEntityModal
          isOpen={isAddWeightUnitModalOpen}
          onClose={() => setIsAddWeightUnitModalOpen(false)}
          title="Add Weight Unit"
          fieldLabel="Unit Name"
          fieldPlaceholder="Enter unit name"
          submitLabel="Add Unit"
          onSubmit={handleWeightUnitAdded}
        />
        <AddEntityModal
          isOpen={isAddPreparationAreaModalOpen}
          onClose={() => setIsAddPreparationAreaModalOpen(false)}
          title="Add Preparation Area"
          fieldLabel="Area Name"
          fieldPlaceholder="Enter the name of the preparation area"
          submitLabel="Add Area"
          onSubmit={handlePreparationAreaAdded}
        />

        <DeleteConfirmModal
          isOpen={isDeleteConfirmOpen}
          onClose={() => setIsDeleteConfirmOpen(false)}
          onConfirm={handleDeleteProduct}
          productName={productName}
        />
      </div>
    </div>
  );
};

export default EditProduct;
