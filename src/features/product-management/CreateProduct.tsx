import { useState } from "react";
import { X, Check } from "lucide-react";
import AssetsFiles from "@/assets";
import { Dropdown, type DropdownOption } from "@/features/settings/ui/Dropdown";
import useBusinessStore from "@/stores/useBusinessStore";

type ProductCreatePayload = {
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
  createProduct: (payload: ProductCreatePayload) => Promise<{ id: string }>;
};

const getElectronAPI = (): ElectronAPI | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { electronAPI?: ElectronAPI };
  return w.electronAPI ?? null;
};

type ProductCategory = {
  id: number;
  name: string;
};

type PriceTier = {
  id: number;
  name: string;
  value: string;
  active: boolean;
};

type PreparationAreaOption = {
  id: number;
  name: string;
};

type Allergen = {
  id: number;
  name: string;
  selected: boolean;
};

type WeightUnit = {
  id: number;
  name: string;
};

type PackagingMethod = {
  id: number;
  name: string;
};

type CreateProductProps = {
  isOpen: boolean;
  onClose: () => void;
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

const initialCategories: ProductCategory[] = [
  { id: 1, name: "Bread" },
  { id: 2, name: "Dough" },
];

const initialPreparationAreas: PreparationAreaOption[] = [
  { id: 1, name: "Bakery" },
  { id: 2, name: "Kitchen" },
];

const initialPriceTiers: PriceTier[] = [
  { id: 1, name: "Retail Price Tier", value: "£40", active: true },
  { id: 2, name: "Wholesale Price Tier", value: "£35", active: false },
];

const initialAllergens: Allergen[] = [
  { id: 1, name: "Cereals", selected: true },
  { id: 2, name: "Crustaceans", selected: false },
  { id: 3, name: "Eggs", selected: true },
  { id: 4, name: "Fish", selected: false },
  { id: 5, name: "Peanuts", selected: false },
  { id: 6, name: "Soybeans", selected: false },
  { id: 7, name: "Milk", selected: false },
  { id: 8, name: "Mollusks", selected: false },
  { id: 9, name: "Nuts", selected: false },
  { id: 10, name: "Celery", selected: false },
  { id: 11, name: "Mustard", selected: false },
  { id: 12, name: "Sesame seed", selected: false },
  {
    id: 13,
    name: "Sulphur dioxide and sulphites",
    selected: false,
  },
  { id: 14, name: "Lupin", selected: false },
];

const initialWeightUnits: WeightUnit[] = [
  { id: 1, name: "Milligrams (mg)" },
  { id: 2, name: "Grams (g)" },
  { id: 3, name: "Kilogram (kg)" },
  { id: 4, name: "Ounce (oz)" },
];

const initialPackagingMethods: PackagingMethod[] = [
  { id: 1, name: "Box" },
  { id: 2, name: "Trey" },
];

const initialSelectedPackagingMethods: Record<string, boolean> = {
  "1": true,
  "2": false,
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="relative w-full max-w-md rounded-[24px] bg-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F4F6] text-[#111827] cursor-pointer"
          aria-label="Close add item modal"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-8 pt-8 pb-6">
          <h2 className="text-lg font-semibold text-[#1C1B20]">{title}</h2>

          <div className="mt-6 space-y-2">
            <p className="text-sm font-medium text-[#111827]">{fieldLabel}</p>
            <input
              type="text"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={fieldPlaceholder}
              className="w-full rounded-[12px] border border-[#E5E7EB] bg-[#FAFAFC] px-4 py-3 text-sm text-[#111827] placeholder-[#A6A6A6] outline-none focus:border-[#15BA5C] focus:ring-1 focus:ring-[#15BA5C]"
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-[12px] bg-[#15BA5C] px-4 text-sm font-medium text-white cursor-pointer hover:bg-[#13A652]"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const CreateProduct = ({ isOpen, onClose }: CreateProductProps) => {
  const [activeTab, setActiveTab] = useState<"basic" | "modifiers">("basic");
  const { selectedOutletId } = useBusinessStore();
  const [productName, setProductName] = useState("");
  const [categories, setCategories] =
    useState<ProductCategory[]>(initialCategories);
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    number | undefined
  >(undefined);
  const [defaultPrice, setDefaultPrice] = useState("");
  const [priceTierEnabled, setPriceTierEnabled] = useState(false);
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>(initialPriceTiers);
  const [description, setDescription] = useState("");
  const [preparationAreas] = useState<PreparationAreaOption[]>(
    initialPreparationAreas,
  );
  const [selectedPreparationAreaId, setSelectedPreparationAreaId] = useState<
    number | undefined
  >(undefined);
  const [leadTimeDays, setLeadTimeDays] = useState("");
  const [leadTimeHours, setLeadTimeHours] = useState("");
  const [leadTimeMinutes, setLeadTimeMinutes] = useState("");
  const [allergensEnabled, setAllergensEnabled] = useState(false);
  const [allergens, setAllergens] = useState<Allergen[]>(initialAllergens);
  const [weight, setWeight] = useState("");
  const [weightUnits, setWeightUnits] =
    useState<WeightUnit[]>(initialWeightUnits);
  const [selectedWeightUnitId, setSelectedWeightUnitId] = useState<
    number | undefined
  >(undefined);
  const [packagingMethods, setPackagingMethods] = useState<PackagingMethod[]>(
    initialPackagingMethods,
  );
  const [selectedPackagingMethods, setSelectedPackagingMethods] = useState<
    Record<string, boolean>
  >(initialSelectedPackagingMethods);

  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isAddAllergenModalOpen, setIsAddAllergenModalOpen] = useState(false);
  const [isAddWeightUnitModalOpen, setIsAddWeightUnitModalOpen] =
    useState(false);

  const handleSaveProduct = async () => {
    const api = getElectronAPI();
    if (!api || !selectedOutletId) return;

    const selectedCategory = categories.find(
      (category) => category.id === selectedCategoryId,
    );

    const selectedPreparationArea = preparationAreas.find(
      (area) => area.id === selectedPreparationAreaId,
    );

    const selectedPriceTier = priceTiers.find((tier) => tier.active);

    const activePackagingMethods = packagingMethods
      .filter((method) => selectedPackagingMethods[String(method.id)])
      .map((method) => method.name);

    const activeAllergens = allergens
      .filter((allergen) => allergen.selected)
      .map((allergen) => allergen.name);

    const leadTimeTotalMinutes =
      (Number(leadTimeDays) || 0) * 24 * 60 +
      (Number(leadTimeHours) || 0) * 60 +
      (Number(leadTimeMinutes) || 0);

    const selectedWeightUnit = weightUnits.find(
      (unit) => unit.id === selectedWeightUnitId,
    );

    const payload = {
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
      availableAtStorefront: 1 as 1,
      createdAtStorefront: 1 as 1,
      isDeleted: 0 as 0,
      isActive: 1 as 1,
      productAvailableStock: null,
      productCode: null,
      logoUrl: null,
      logoHash: null,
      outletId: selectedOutletId,
    };

    try {
      await api.createProduct(payload);
      onClose();
    } catch {}
  };

  if (!isOpen) return null;

  const selectedCategory = categories.find(
    (category) => category.id === selectedCategoryId,
  );

  const selectedPreparationArea = preparationAreas.find(
    (area) => area.id === selectedPreparationAreaId,
  );

  const handleCategoryDelete = (option: DropdownOption) => {
    const id = Number(option.value);
    setCategories((previous) =>
      previous.filter((category) => category.id !== id),
    );
    if (selectedCategoryId === id) {
      setSelectedCategoryId(undefined);
    }
  };

  const handleCategoryAdded = (name: string) => {
    setCategories((previous) => {
      const nextId =
        previous.length > 0
          ? Math.max(...previous.map((category) => category.id)) + 1
          : 1;
      const newCategory = { id: nextId, name };
      setSelectedCategoryId(newCategory.id);
      return [...previous, newCategory];
    });
    setIsAddCategoryModalOpen(false);
  };

  const handleAllergenToggle = (id: number) => {
    setAllergens((previous) =>
      previous.map((allergen) =>
        allergen.id === id
          ? { ...allergen, selected: !allergen.selected }
          : allergen,
      ),
    );
  };

  const handleAllergenDelete = (id: number) => {
    setAllergens((previous) =>
      previous.filter((allergen) => allergen.id !== id),
    );
  };

  const handleAllergenAdded = (name: string) => {
    setAllergens((previous) => {
      const nextId =
        previous.length > 0
          ? Math.max(...previous.map((allergen) => allergen.id)) + 1
          : 1;
      const newAllergen: Allergen = {
        id: nextId,
        name,
        selected: true,
      };
      return [...previous, newAllergen];
    });
    setIsAddAllergenModalOpen(false);
  };

  const handleWeightUnitDelete = (option: DropdownOption) => {
    const id = Number(option.value);
    setWeightUnits((previous) => previous.filter((unit) => unit.id !== id));
    if (selectedWeightUnitId === id) {
      setSelectedWeightUnitId(undefined);
    }
  };

  const handleWeightUnitAdded = (name: string) => {
    setWeightUnits((previous) => {
      const nextId =
        previous.length > 0
          ? Math.max(...previous.map((unit) => unit.id)) + 1
          : 1;
      const newUnit: WeightUnit = {
        id: nextId,
        name,
      };
      setSelectedWeightUnitId(newUnit.id);
      return [...previous, newUnit];
    });
    setIsAddWeightUnitModalOpen(false);
  };

  const handlePackagingMethodsChange = (
    values: Record<string, boolean>,
    name?: string,
  ) => {
    if (name !== undefined) {
      setSelectedPackagingMethods(values);
      return;
    }
    setSelectedPackagingMethods(values);
  };

  const handlePackagingMethodDelete = (option: DropdownOption) => {
    const optionId = option.value;
    setPackagingMethods((previous) =>
      previous.filter((method) => String(method.id) !== optionId),
    );
    setSelectedPackagingMethods((previous) => {
      const updated = { ...previous };
      delete updated[optionId];
      return updated;
    });
  };

  const handlePackagingMethodAdded = (value: string) => {
    setPackagingMethods((previous) => {
      const nextId =
        previous.length > 0
          ? Math.max(...previous.map((method) => method.id)) + 1
          : 1;
      const newMethod: PackagingMethod = {
        id: nextId,
        name: value,
      };
      const newIdKey = String(newMethod.id);
      setSelectedPackagingMethods((previousSelected) => ({
        ...previousSelected,
        [newIdKey]: true,
      }));
      return [...previous, newMethod];
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40">
      <div className="relative flex h-full w-full max-w-[840px] flex-col rounded-l-[20px] bg-white shadow-2xl">
        <div className="flex items-center justify-between  px-8 py-6">
          <div>
            <h2 className="text-[24px] font-bold text-[#000000]">
              Create a Product
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FEE2E2] text-[#EF4444] cursor-pointer"
            aria-label="Close create product modal"
            title="Close"
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
                className={`pb-3 ${
                  activeTab === "basic"
                    ? "border-b-2 border-[#15BA5C] text-[#111827]"
                    : "text-[#6B7280]"
                }`}
              >
                Basic Information
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("modifiers")}
                className={`pb-3 ${
                  activeTab === "modifiers"
                    ? "border-b-2 border-[#15BA5C] text-[#111827]"
                    : "text-[#6B7280]"
                }`}
              >
                Modifiers
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-8 pb-8 pt-6">
            {activeTab === "basic" && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[15px] font-medium text-[#1C1B20]">
                    Product Name <span className="text-[#EF4444]">*</span>
                  </p>
                  <input
                    type="text"
                    value={productName}
                    onChange={(event) => setProductName(event.target.value)}
                    placeholder="Enter Product Name"
                    className="w-full rounded-[12px] border border-[#E5E7EB] bg-[#FAFAFC] px-4 py-3 text-sm text-[#111827] placeholder-[#A6A6A6] outline-none focus:border-[#15BA5C] focus:ring-1 focus:ring-[#15BA5C]"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-[15px] font-medium text-[#1C1B20]">
                    Product Category <span className="text-[#EF4444]">*</span>
                  </p>
                  <Dropdown
                    name="productCategory"
                    options={categories.map((category) => ({
                      value: String(category.id),
                      label: category.name,
                    }))}
                    selectedValue={
                      selectedCategory ? String(selectedCategory.id) : undefined
                    }
                    onChange={(value) =>
                      setSelectedCategoryId(Number(value) || undefined)
                    }
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
                      onChange={(event) => setDefaultPrice(event.target.value)}
                      placeholder="Enter Selling Price"
                      className="flex-1 bg-transparent outline-none placeholder-[#A6A6A6]"
                    />
                    <span className="text-xs font-semibold text-[#15BA5C]">
                      GBP
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
                      onToggle={() =>
                        setPriceTierEnabled((previous) => !previous)
                      }
                    />
                  </div>

                  {priceTierEnabled && (
                    <div className="space-y-3">
                      {priceTiers.map((tier) => (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() =>
                            setPriceTiers((previous) =>
                              previous.map((item) =>
                                item.id === tier.id
                                  ? { ...item, active: !item.active }
                                  : item,
                              ),
                            )
                          }
                          className={`flex w-full items-center justify-between rounded-[12px] border px-4 py-3 text-left text-sm ${
                            tier.active
                              ? "border-[#15BA5C] bg-white text-[#111827]"
                              : "border-[#E5E7EB] bg-white text-[#111827]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#15BA5C] text-[#15BA5C]">
                              <svg
                                width="30"
                                height="30"
                                viewBox="0 0 33 33"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M16.4997 5.15625L16.177 5.445L4.41349 17.3384L3.70605 18.0479L4.41452 18.7904L14.2114 28.5873L14.9539 29.2958L15.6655 28.5873L27.5558 16.8238L27.8435 16.5V5.15625H16.4997ZM17.3701 7.21875H25.781V15.6296L14.9529 26.3938L6.60593 18.0469L17.3701 7.21875ZM22.6872 9.28125C22.4137 9.28125 22.1514 9.3899 21.958 9.5833C21.7646 9.77669 21.656 10.039 21.656 10.3125C21.656 10.586 21.7646 10.8483 21.958 11.0417C22.1514 11.2351 22.4137 11.3438 22.6872 11.3438C22.9607 11.3438 23.223 11.2351 23.4164 11.0417C23.6098 10.8483 23.7185 10.586 23.7185 10.3125C23.7185 10.039 23.6098 9.77669 23.4164 9.5833C23.223 9.3899 22.9607 9.28125 22.6872 9.28125Z"
                                  fill="#15BA5C"
                                />
                              </svg>
                            </div>
                            <span>
                              {tier.name} – Value: {tier.value}
                            </span>
                          </div>
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-[4px] border ${
                              tier.active
                                ? "border-[#15BA5C] bg-[#15BA5C]"
                                : "border-[#D1D5DB] bg-white"
                            }`}
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
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Enter Description"
                    rows={4}
                    className="w-full resize-none rounded-[12px] border border-[#E5E7EB] bg-[#FAFAFC] px-4 py-3 text-sm text-[#111827] placeholder-[#A6A6A6] outline-none focus:border-[#15BA5C] focus:ring-1 focus:ring-[#15BA5C]"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-[15px] font-medium text-[#1C1B20]">
                    Preparation Area <span className="text-[#EF4444]">*</span>
                  </p>
                  <div className="flex overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-[#FAFAFC]">
                    <Dropdown
                      options={preparationAreas.map((area) => ({
                        value: String(area.id),
                        label: area.name,
                      }))}
                      selectedValue={
                        selectedPreparationArea
                          ? String(selectedPreparationArea.id)
                          : ""
                      }
                      onChange={(value) =>
                        setSelectedPreparationAreaId(Number(value) || undefined)
                      }
                      placeholder="Select Area"
                      className="flex-1"
                    />
                    <button
                      type="button"
                      className="flex w-16 items-center justify-center bg-[#E5E7EB] text-[#6B7280]"
                      aria-label="Add preparation area"
                      title="Add preparation area"
                    >
                      <span className="text-xl leading-none">+</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[15px] font-medium text-[#1C1B20]">
                        Add Allergens
                      </p>
                      <p className="text-xs text-[#6B7280]">
                        Select or add all allergens associated with this Product
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={allergensEnabled}
                      onToggle={() =>
                        setAllergensEnabled((previous) => !previous)
                      }
                    />
                  </div>

                  {allergensEnabled && (
                    <div className="flex flex-wrap gap-3">
                      {allergens.map((allergen) => (
                        <div
                          key={allergen.id}
                          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${
                            allergen.selected
                              ? "border-[#15BA5C] bg-[#ECFDF3] text-[#047857]"
                              : "border-[#E5E7EB] bg-white text-[#111827]"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleAllergenToggle(allergen.id)}
                            className="cursor-pointer"
                          >
                            {allergen.name}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAllergenDelete(allergen.id)}
                            className="ml-1 text-[#9CA3AF] hover:text-[#EF4444]"
                            aria-label={`Remove ${allergen.name}`}
                            title={`Remove ${allergen.name}`}
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
                    <div className="space-y-1">
                      <div className="flex items-center rounded-[12px] bg-[#FAFAFC] px-3 py-3 text-sm text-[#111827]">
                        <input
                          type="number"
                          value={leadTimeDays}
                          onChange={(event) =>
                            setLeadTimeDays(event.target.value)
                          }
                          placeholder="Days"
                          className="flex-1 bg-transparent outline-none placeholder-[#A6A6A6]"
                        />
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-[#9CA3AF]"
                        >
                          <path
                            d="M8 3.33331V8.00065L10.6667 9.33331"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M8 14.6666C11.6819 14.6666 14.6667 11.6818 14.6667 7.99998C14.6667 4.31808 11.6819 1.33331 8 1.33331C4.3181 1.33331 1.33333 4.31808 1.33333 7.99998C1.33333 11.6818 4.3181 14.6666 8 14.6666Z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center rounded-[12px] bg-[#FAFAFC] px-3 py-3 text-sm text-[#111827]">
                        <input
                          type="number"
                          value={leadTimeHours}
                          onChange={(event) =>
                            setLeadTimeHours(event.target.value)
                          }
                          placeholder="Hours"
                          className="flex-1 bg-transparent outline-none placeholder-[#A6A6A6]"
                        />
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-[#9CA3AF]"
                        >
                          <path
                            d="M8 3.33331V8.00065L10.6667 9.33331"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M8 14.6666C11.6819 14.6666 14.6667 11.6818 14.6667 7.99998C14.6667 4.31808 11.6819 1.33331 8 1.33331C4.3181 1.33331 1.33333 4.31808 1.33333 7.99998C1.33333 11.6818 4.3181 14.6666 8 14.6666Z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center rounded-[12px] bg-[#FAFAFC] px-3 py-3 text-sm text-[#111827]">
                        <input
                          type="number"
                          value={leadTimeMinutes}
                          onChange={(event) =>
                            setLeadTimeMinutes(event.target.value)
                          }
                          placeholder="Minutes"
                          className="flex-1 bg-transparent outline-none placeholder-[#A6A6A6]"
                        />
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-[#9CA3AF]"
                        >
                          <path
                            d="M8 3.33331V8.00065L10.6667 9.33331"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M8 14.6666C11.6819 14.6666 14.6667 11.6818 14.6667 7.99998C14.6667 4.31808 11.6819 1.33331 8 1.33331C4.3181 1.33331 1.33333 4.31808 1.33333 7.99998C1.33333 11.6818 4.3181 14.6666 8 14.6666Z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-[15px] font-medium text-[#1C1B20]">
                      Weight <span className="text-[#EF4444]">*</span>
                    </p>
                    <input
                      type="text"
                      value={weight}
                      onChange={(event) => setWeight(event.target.value)}
                      placeholder="Enter Weight"
                      className="w-full rounded-[12px] border border-[#E5E7EB] bg-[#FAFAFC] px-4 py-3 text-sm text-[#111827] placeholder-[#A6A6A6] outline-none focus:border-[#15BA5C] focus:ring-1 focus:ring-[#15BA5C]"
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-[15px] font-medium text-[#1C1B20]">
                      Weight Unit of Measure{" "}
                      <span className="text-[#EF4444]">*</span>
                    </p>
                    <Dropdown
                      name="weightUnit"
                      options={weightUnits.map((unit) => ({
                        value: String(unit.id),
                        label: unit.name,
                      }))}
                      selectedValue={
                        selectedWeightUnitId
                          ? String(selectedWeightUnitId)
                          : undefined
                      }
                      onChange={(value) =>
                        setSelectedWeightUnitId(Number(value) || undefined)
                      }
                      placeholder="Select unit of measure"
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
                    Packaging Method <span className="text-[#EF4444]">*</span>
                  </p>
                  <Dropdown
                    name="packagingMethod"
                    mode="checkbox"
                    options={packagingMethods.map((method) => ({
                      value: String(method.id),
                      label: method.name,
                    }))}
                    selectedValues={selectedPackagingMethods}
                    onMultiChange={handlePackagingMethodsChange}
                    placeholder="Select multiple Packaging Method"
                    className="w-full"
                    allowAddNew
                    addNewLabel="+"
                    onAddNew={handlePackagingMethodAdded}
                    onDeleteOption={handlePackagingMethodDelete}
                    searchPlaceholder="Search Packaging Method"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 w-full  py-4">
                  <button
                    type="button"
                    onClick={handleSaveProduct}
                    className="rounded-[10px] bg-[#15BA5C] w-full px-8 py-2.5 text-sm font-medium text-white cursor-pointer hover:bg-[#13A652]"
                  >
                    Save Product
                  </button>
                </div>
              </div>
            )}

            {activeTab === "modifiers" && (
              <div className="flex h-full items-center justify-center text-sm text-[#6B7280]">
                <span>Modifiers content will go here.</span>
              </div>
            )}
          </div>

          {/* <div className="flex items-center justify-end gap-3 border-t border-[#E5E7EB] px-8 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[10px] bg-[#E5E7EB] px-6 py-2.5 text-sm font-medium text-[#111827] cursor-pointer hover:bg-[#D1D5DB]"
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-[10px] bg-[#15BA5C] px-8 py-2.5 text-sm font-medium text-white cursor-pointer hover:bg-[#13A652]"
            >
              Save Product
            </button>
          </div> */}
        </div>

        <AddEntityModal
          isOpen={isAddCategoryModalOpen}
          onClose={() => setIsAddCategoryModalOpen(false)}
          title="Add a new product category"
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
          title="Add Weight Unit of Measure"
          fieldLabel="Unit Name"
          fieldPlaceholder="Enter the name of the unit"
          submitLabel="Add Unit"
          onSubmit={handleWeightUnitAdded}
        />
      </div>
    </div>
  );
};

export default CreateProduct;
