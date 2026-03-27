"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { Dropdown, type DropdownOption } from "@/features/settings/ui/Dropdown";
import {
  Dropdown as CreateDropdown,
  type DropdownOption as CreateDropdownOption,
} from "@/shared/AppDropdowns/CreateDropdown";
import SystemDefaultModal from "@/shared/SystemDefaultModal";
import { useBusinessStore } from "@/stores/useBusinessStore";
import { useAuthStore } from "@/stores/authStore";
import useToastStore from "@/stores/toastStore";
import { SystemDefaultType } from "../../../electron/types/system-default";
import { getCurrencySymbol } from "@/utils/getCurrencySymbol";

type CreateRecipeProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

type ProductPick = {
  id: string;
  name: string;
  productCode: string | null;
};

type InventoryPick = {
  id: string;
  itemName: string;
  costPrice: number;
  displayedUnitOfMeasure: string;
  unitOfPurchase: string;
  unitOfTransfer: string;
  unitOfConsumption: string;
};

type IngredientLine = {
  id: string;
  itemId: string;
  itemName: string;
  unitOfMeasure: string;
  quantity: string;
  foodCost: string;
  prepWaste: string;
  critical: boolean;
};

type VariantLine = {
  id: string;
  optionName: string;
  portions: string;
  isOpen: boolean;
  ingredients: IngredientLine[];
};

const sanitizeNumber = (value: string) => value.replace(/[^0-9.]/g, "");

const CreateRecipe = ({ isOpen, onClose, onCreated }: CreateRecipeProps) => {
  const { selectedOutlet } = useBusinessStore();
  const authUser = useAuthStore((s) => s.user);
  const { showToast } = useToastStore();
  const currencySymbol = selectedOutlet?.currency
    ? getCurrencySymbol(selectedOutlet.currency)
    : "";

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [products, setProducts] = useState<ProductPick[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryPick[]>([]);
  const [inventoryId, setInventoryId] = useState<string | null>(null);

  const [selectedProductId, setSelectedProductId] = useState("");
  const [mix, setMix] = useState("");
  const [mixes, setMixes] = useState<string[]>([]);
  const [isMixLoading, setIsMixLoading] = useState(false);
  const [isAddMixModalOpen, setIsAddMixModalOpen] = useState(false);
  const [totalPortions, setTotalPortions] = useState("1");

  const [ingredients, setIngredients] = useState<IngredientLine[]>([]);
  const [varianceOpen, setVarianceOpen] = useState(true);
  const [variants, setVariants] = useState<VariantLine[]>([]);

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  const productOptions: DropdownOption[] = useMemo(() => {
    return products.map((p) => ({ value: p.id, label: p.name }));
  }, [products]);

  const inventoryOptions: DropdownOption[] = useMemo(() => {
    return inventoryItems.map((it) => ({ value: it.id, label: it.itemName }));
  }, [inventoryItems]);

  const mixOptions: CreateDropdownOption[] = useMemo(() => {
    return mixes.map((m) => ({ value: m, label: m }));
  }, [mixes]);

  const ingredientTotal = useCallback((it: IngredientLine) => {
    const q = parseFloat(it.quantity) || 0;
    const waste = parseFloat(it.prepWaste) || 0;
    const unitCost = parseFloat(it.foodCost) || 0;
    return (q + waste) * unitCost;
  }, []);

  const totalMixCost = useMemo(() => {
    return ingredients.reduce((acc, it) => acc + ingredientTotal(it), 0);
  }, [ingredientTotal, ingredients]);

  const resetForm = useCallback(() => {
    setSelectedProductId("");
    setMix("");
    setTotalPortions("1");
    setIngredients([]);
    setVarianceOpen(true);
    setVariants([]);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    resetForm();
  }, [isOpen, resetForm]);

  useEffect(() => {
    if (!isOpen || !selectedOutlet?.id) return;
    const api: any = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    setIsLoading(true);
    setIsMixLoading(true);
    (async () => {
      try {
        const [productRows, inventoryRows, invRows, mixRows] =
          await Promise.all([
            api.dbQuery(
              "SELECT id, name, productCode FROM product WHERE outletId = ? AND isDeleted = 0 ORDER BY name COLLATE NOCASE ASC",
              [selectedOutlet.id],
            ),
            api.dbQuery(
              `
              SELECT
                ii.id as id,
                im.name as itemName,
                COALESCE(ii.costPrice, 0) as costPrice,
                COALESCE(im.displayedUnitOfMeasure, '') as displayedUnitOfMeasure,
                COALESCE(im.unitOfPurchase, '') as unitOfPurchase,
                COALESCE(im.unitOfTransfer, '') as unitOfTransfer,
                COALESCE(im.unitOfConsumption, '') as unitOfConsumption
              FROM inventory_item ii
              JOIN inventory i ON ii.inventoryId = i.id
              JOIN item_master im ON ii.itemMasterId = im.id
              WHERE i.outletId = ? AND ii.isDeleted = 0
              ORDER BY im.name COLLATE NOCASE ASC
            `,
              [selectedOutlet.id],
            ),
            api.dbQuery("SELECT id FROM inventory WHERE outletId = ? LIMIT 1", [
              selectedOutlet.id,
            ]),
            api.getSystemDefaults
              ? api.getSystemDefaults(
                  SystemDefaultType.RECIPE_MIX,
                  selectedOutlet.id,
                )
              : [],
          ]);

        setProducts(
          (productRows || []).map((p: any) => ({
            id: String(p.id || ""),
            name: String(p.name || ""),
            productCode: p.productCode != null ? String(p.productCode) : null,
          })),
        );

        setInventoryItems(
          (inventoryRows || []).map((r: any) => ({
            id: String(r.id || ""),
            itemName: String(r.itemName || ""),
            costPrice: Number(r.costPrice || 0),
            displayedUnitOfMeasure: String(r.displayedUnitOfMeasure || ""),
            unitOfPurchase: String(r.unitOfPurchase || ""),
            unitOfTransfer: String(r.unitOfTransfer || ""),
            unitOfConsumption: String(r.unitOfConsumption || ""),
          })),
        );

        setInventoryId(invRows?.[0]?.id ? String(invRows[0].id) : null);

        const allMixes = (mixRows || []).flatMap((row: any) => {
          try {
            const data = JSON.parse(row.data);
            return Array.isArray(data) ? data : [data];
          } catch {
            return [];
          }
        });
        const uniqueMixes = Array.from<string>(
          new Set(
            allMixes
              .map((m: any) => (typeof m === "string" ? m : m?.name))
              .filter(Boolean)
              .map((m: any) => String(m)),
          ),
        ).sort((a, b) => a.localeCompare(b));
        setMixes(uniqueMixes);
      } catch (e) {
        console.error("Failed to load create recipe data:", e);
        setProducts([]);
        setInventoryItems([]);
        setInventoryId(null);
        setMixes([]);
      } finally {
        setIsLoading(false);
        setIsMixLoading(false);
      }
    })();
  }, [isOpen, selectedOutlet?.id]);

  const addMixDefault = useCallback(
    async (newValue: string) => {
      const v = newValue.trim();
      if (!v || !selectedOutlet?.id) return;
      const api: any = (window as any).electronAPI;
      if (!api?.addSystemDefault || !api?.getSystemDefaults) return;

      await api.addSystemDefault(
        SystemDefaultType.RECIPE_MIX,
        { name: v },
        selectedOutlet.id,
      );

      const mixRows = await api.getSystemDefaults(
        SystemDefaultType.RECIPE_MIX,
        selectedOutlet.id,
      );
      const all = (mixRows || []).flatMap((row: any) => {
        try {
          const data = JSON.parse(row.data);
          return Array.isArray(data) ? data : [data];
        } catch {
          return [];
        }
      });
      const unique = Array.from<string>(
        new Set(
          all
            .map((m: any) => (typeof m === "string" ? m : m?.name))
            .filter(Boolean)
            .map((m: any) => String(m)),
        ),
      ).sort((a, b) => a.localeCompare(b));

      setMixes(unique);
      setMix(v);
    },
    [selectedOutlet?.id],
  );

  const addIngredientRow = useCallback(() => {
    setIngredients((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        itemId: "",
        itemName: "",
        unitOfMeasure: "",
        quantity: "",
        foodCost: "",
        prepWaste: "",
        critical: false,
      },
    ]);
  }, []);

  const addVariant = useCallback(() => {
    const base = ingredients.map((it) => ({
      ...it,
      id: crypto.randomUUID(),
    }));
    setVariants((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        optionName: "",
        portions: "1",
        isOpen: true,
        ingredients: base,
      },
    ]);
  }, [ingredients]);

  const updateVariant = useCallback(
    (variantId: string, patch: Partial<VariantLine>) => {
      setVariants((prev) =>
        prev.map((v) => (v.id === variantId ? { ...v, ...patch } : v)),
      );
    },
    [],
  );

  const addVariantIngredientRow = useCallback((variantId: string) => {
    setVariants((prev) =>
      prev.map((v) => {
        if (v.id !== variantId) return v;
        return {
          ...v,
          ingredients: [
            ...v.ingredients,
            {
              id: crypto.randomUUID(),
              itemId: "",
              itemName: "",
              unitOfMeasure: "",
              quantity: "",
              foodCost: "",
              prepWaste: "",
              critical: false,
            },
          ],
        };
      }),
    );
  }, []);

  const removeVariantIngredientRow = useCallback(
    (variantId: string, rowId: string) => {
      setVariants((prev) =>
        prev.map((v) => {
          if (v.id !== variantId) return v;
          return {
            ...v,
            ingredients: v.ingredients.filter((r) => r.id !== rowId),
          };
        }),
      );
    },
    [],
  );

  const updateVariantIngredient = useCallback(
    (variantId: string, rowId: string, patch: Partial<IngredientLine>) => {
      setVariants((prev) =>
        prev.map((v) => {
          if (v.id !== variantId) return v;
          return {
            ...v,
            ingredients: v.ingredients.map((r) =>
              r.id === rowId ? { ...r, ...patch } : r,
            ),
          };
        }),
      );
    },
    [],
  );

  const removeIngredientRow = useCallback((rowId: string) => {
    setIngredients((prev) => prev.filter((r) => r.id !== rowId));
  }, []);

  const updateIngredient = useCallback(
    (rowId: string, patch: Partial<IngredientLine>) => {
      setIngredients((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
      );
    },
    [],
  );

  const unitOptionsFor = useCallback((inv: InventoryPick | null) => {
    const set = new Set<string>();
    if (inv?.displayedUnitOfMeasure) set.add(inv.displayedUnitOfMeasure);
    if (inv?.unitOfPurchase) set.add(inv.unitOfPurchase);
    if (inv?.unitOfTransfer) set.add(inv.unitOfTransfer);
    if (inv?.unitOfConsumption) set.add(inv.unitOfConsumption);
    return Array.from(set);
  }, []);

  const save = useCallback(async () => {
    if (!selectedOutlet?.id) {
      showToast("error", "No outlet selected", "Please select an outlet first");
      return;
    }
    if (!selectedProduct) {
      showToast("error", "Missing product", "Please select a product");
      return;
    }
    const mixValue = mix.trim();
    if (mixValue === "") {
      showToast("error", "Missing mix", "Please select a mix");
      return;
    }

    const portions = Math.max(1, parseFloat(totalPortions) || 0);
    const validIngredients = ingredients.filter(
      (it) => it.itemId && (parseFloat(it.quantity) || 0) > 0,
    );
    if (validIngredients.length === 0) {
      showToast(
        "error",
        "Missing ingredients",
        "Please add at least one ingredient",
      );
      return;
    }

    const api: any = (window as any).electronAPI;
    if (!api?.dbQuery) {
      showToast("error", "Unavailable", "Database API not available");
      return;
    }

    const now = new Date().toISOString();
    const recipeId = crypto.randomUUID();
    const createdBy = authUser?.name ? String(authUser.name) : "system";
    const recipeTotal = validIngredients.reduce(
      (acc, it) => acc + ingredientTotal(it),
      0,
    );

    setIsSubmitting(true);
    try {
      await api.dbQuery(
        `
          INSERT INTO recipes (
            id,
            name,
            productReference,
            productName,
            outletId,
            mix,
            totalPortions,
            totalMixCost,
            preparationTime,
            difficulty_level,
            instructions,
            imageUrl,
            createdAt,
            updatedAt,
            createdBy,
            isDeleted,
            inventoryId
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          recipeId,
          selectedProduct.name,
          selectedProduct.id,
          selectedProduct.name,
          selectedOutlet.id,
          mixValue,
          portions,
          recipeTotal,
          0,
          "Medium",
          "",
          null,
          now,
          now,
          createdBy,
          0,
          inventoryId,
        ],
      );

      for (const it of validIngredients) {
        const inv = inventoryItems.find((x) => x.id === it.itemId) || null;
        await api.dbQuery(
          `
            INSERT INTO recipe_ingredients (
              id,
              itemName,
              unitOfMeasure,
              quantity,
              proposedFoodCost,
              prepWaste,
              critical,
              isDeleted,
              createdAt,
              updatedAt,
              recipeId,
              itemId
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            crypto.randomUUID(),
            it.itemName || inv?.itemName || "Item",
            it.unitOfMeasure || inv?.displayedUnitOfMeasure || "",
            parseFloat(it.quantity) || 0,
            ingredientTotal(it),
            parseFloat(it.prepWaste) || 0,
            it.critical ? 1 : 0,
            0,
            now,
            now,
            recipeId,
            it.itemId,
          ],
        );
      }

      showToast("success", "Recipe created", "Recipe created successfully");
      onCreated?.();
      onClose();
    } catch (e) {
      console.error("Failed to create recipe:", e);
      showToast("error", "Creation failed", "Failed to create recipe");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    authUser?.name,
    ingredients,
    ingredientTotal,
    inventoryId,
    inventoryItems,
    mix,
    onClose,
    onCreated,
    selectedOutlet?.id,
    selectedProduct,
    showToast,
    totalPortions,
  ]);

  const canSubmit =
    !isLoading &&
    !isSubmitting &&
    selectedProductId !== "" &&
    mix.trim() !== "";

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40">
        <div className="relative flex h-full w-full max-w-[1100px] flex-col rounded-l-[20px] bg-white shadow-2xl">
          <div className="flex items-start justify-between px-10 py-8">
            <div>
              <h2 className="text-[28px] font-bold text-[#000000]">
                Create a Recipe
              </h2>
              <p className="mt-2 text-[14px] text-gray-500 max-w-[740px]">
                Use this form to detail the essential elements of your dish,
                from its name and associated product item to the precise serving
                size and linked inventory items.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FEE2E2] text-[#EF4444] cursor-pointer"
              aria-label="Close create recipe modal"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-10 pb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="text-[14px] font-semibold text-[#111827]">
                  Product<span className="text-red-500">*</span>
                </label>
                <div className="mt-3">
                  <Dropdown
                    options={productOptions}
                    selectedValue={selectedProductId || undefined}
                    onChange={(value) => setSelectedProductId(value)}
                    placeholder="Select Product"
                    className="w-full"
                    loading={isLoading}
                    searchPlaceholder="Search products..."
                  />
                </div>
              </div>

              <div>
                <label className="text-[14px] font-semibold text-[#111827]">
                  Select Mix<span className="text-red-500">*</span>
                </label>
                <div className="mt-3">
                  <CreateDropdown
                    options={[
                      ...mixOptions,
                      ...(mix && !mixes.includes(mix)
                        ? [{ value: mix, label: mix }]
                        : []),
                    ]}
                    selectedValue={mix || undefined}
                    onChange={(val) => setMix(val)}
                    placeholder="Select Size of the mix"
                    className="w-full"
                    allowAddNew
                    addNewLabel="+"
                    onAddNewClick={() => setIsAddMixModalOpen(true)}
                    loading={isMixLoading}
                    searchPlaceholder="Search mixes..."
                  />
                </div>
              </div>
            </div>

            <div className="mt-10">
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-semibold text-[#111827]">
                  Add Ingredient<span className="text-red-500">*</span>
                </h3>
              </div>

              <div className="mt-4 overflow-hidden rounded-[14px] border border-gray-100">
                <table className="w-full">
                  <thead className="bg-[#F9FAFB]">
                    <tr className="text-left text-[12px] text-gray-500">
                      <th className="px-4 py-4 font-medium">Item</th>
                      <th className="px-4 py-4 font-medium">Quantity</th>
                      <th className="px-4 py-4 font-medium">Unit of measure</th>
                      <th className="px-4 py-4 font-medium">Food Cost</th>
                      <th className="px-4 py-4 font-medium">
                        Prep waste (unit)
                      </th>
                      <th className="px-4 py-4 font-medium">Total Cost</th>
                      <th className="px-4 py-4 font-medium">Critical</th>
                      <th className="px-4 py-4 font-medium">
                        <span className="sr-only">Remove</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {ingredients.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-8 text-sm text-gray-500"
                        >
                          No ingredients added yet.
                        </td>
                      </tr>
                    ) : (
                      ingredients.map((row) => {
                        const inv =
                          inventoryItems.find((x) => x.id === row.itemId) ||
                          null;
                        const unitOptions = unitOptionsFor(inv);
                        const rowTotal = ingredientTotal(row);
                        return (
                          <tr key={row.id}>
                            <td className="px-4 py-4">
                              <Dropdown
                                options={inventoryOptions}
                                selectedValue={row.itemId || undefined}
                                onChange={(value) => {
                                  const picked =
                                    inventoryItems.find(
                                      (x) => x.id === value,
                                    ) || null;
                                  const nextUom =
                                    picked?.displayedUnitOfMeasure || "";
                                  updateIngredient(row.id, {
                                    itemId: value,
                                    itemName: picked?.itemName || "",
                                    unitOfMeasure: nextUom,
                                    foodCost:
                                      picked != null
                                        ? String(picked.costPrice || 0)
                                        : "",
                                  });
                                }}
                                placeholder="Select item"
                                className="w-full"
                                loading={isLoading}
                                searchPlaceholder="Search inventory items..."
                              />
                            </td>
                            <td className="px-4 py-4">
                              <input
                                value={row.quantity}
                                onChange={(e) =>
                                  updateIngredient(row.id, {
                                    quantity: sanitizeNumber(e.target.value),
                                  })
                                }
                                className="h-11 w-full rounded-[10px] border border-gray-200 bg-white px-3 text-sm outline-none"
                              />
                            </td>
                            <td className="px-4 py-4">
                              <Dropdown
                                options={unitOptions.map((u) => ({
                                  value: u,
                                  label: u,
                                }))}
                                selectedValue={row.unitOfMeasure || undefined}
                                onChange={(value) =>
                                  updateIngredient(row.id, {
                                    unitOfMeasure: value,
                                  })
                                }
                                placeholder="Select"
                                className="w-full"
                                searchPlaceholder="Search units..."
                              />
                            </td>
                            <td className="px-4 py-4">
                              <input
                                value={row.foodCost}
                                onChange={(e) =>
                                  updateIngredient(row.id, {
                                    foodCost: sanitizeNumber(e.target.value),
                                  })
                                }
                                className="h-11 w-full rounded-[10px] border border-gray-200 bg-white px-3 text-sm outline-none"
                              />
                            </td>
                            <td className="px-4 py-4">
                              <input
                                value={row.prepWaste}
                                onChange={(e) =>
                                  updateIngredient(row.id, {
                                    prepWaste: sanitizeNumber(e.target.value),
                                  })
                                }
                                className="h-11 w-full rounded-[10px] border border-gray-200 bg-white px-3 text-sm outline-none"
                              />
                            </td>
                            <td className="px-4 py-4">
                              <input
                                value={rowTotal.toFixed(2)}
                                readOnly
                                className="h-11 w-full rounded-[10px] border border-gray-200 bg-gray-50 px-3 text-sm outline-none"
                              />
                            </td>
                            <td className="px-4 py-4">
                              <button
                                type="button"
                                onClick={() =>
                                  updateIngredient(row.id, {
                                    critical: !row.critical,
                                  })
                                }
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${
                                  row.critical ? "bg-[#15BA5C]" : "bg-gray-300"
                                }`}
                                aria-label="Toggle critical"
                              >
                                <span
                                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                    row.critical
                                      ? "translate-x-6"
                                      : "translate-x-1"
                                  }`}
                                />
                              </button>
                            </td>
                            <td className="px-4 py-4">
                              <button
                                type="button"
                                onClick={() => removeIngredientRow(row.id)}
                                className="h-10 w-10 rounded-[10px] bg-[#FEE2E2] text-[#EF4444] inline-flex items-center justify-center cursor-pointer"
                                aria-label="Remove ingredient"
                                title="Remove"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={addIngredientRow}
                className="mt-4 text-[#15BA5C] font-medium inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="h-5 w-5" />
                Add Item
              </button>

              <div className="mt-8">
                <label className="text-[14px] font-semibold text-[#111827]">
                  Total Portions (in Unit Quantity)
                  <span className="text-red-500">*</span>
                </label>
                <input
                  value={totalPortions}
                  onChange={(e) =>
                    setTotalPortions(sanitizeNumber(e.target.value))
                  }
                  placeholder="Enter total portion"
                  className="mt-3 h-12 w-full rounded-[12px] border border-gray-200 bg-white px-4 text-sm outline-none"
                />

                <div className="mt-8">
                  <label className="text-[14px] font-semibold text-[#111827]">
                    Variance<span className="text-red-500">*</span>
                  </label>

                  <div className="mt-3 rounded-[14px] border border-gray-100 overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={() => setVarianceOpen((v) => !v)}
                      className="w-full px-5 py-4 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-[#E9FBF0] border border-green-100 flex items-center justify-center text-[#15BA5C]">
                          <Plus className="size-5" />
                        </div>
                        <div className="text-left">
                          <div className="text-[14px] font-medium text-[#111827]">
                            {(mix || "Size") + " || Single Choice"}
                          </div>
                        </div>
                      </div>
                      {varianceOpen ? (
                        <ChevronDown className="size-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="size-5 text-gray-500" />
                      )}
                    </button>

                    {varianceOpen && (
                      <div className="px-5 pb-5">
                        <div className="space-y-4">
                          {variants.map((v) => {
                            const variantTotal = v.ingredients.reduce(
                              (acc, it) => acc + ingredientTotal(it),
                              0,
                            );
                            const portions = Math.max(
                              1,
                              parseFloat(v.portions) || 0,
                            );
                            const costPerUnit = variantTotal / portions;
                            const extraCount = Math.max(
                              0,
                              v.ingredients.length - ingredients.length,
                            );

                            return (
                              <div
                                key={v.id}
                                className="rounded-[14px] border border-gray-100 overflow-hidden"
                              >
                                <div className="px-5 py-5 bg-white">
                                  <div className="grid grid-cols-1 md:grid-cols-[36px_1fr_1fr_1fr_auto] gap-4 items-center">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateVariant(v.id, {
                                          isOpen: !v.isOpen,
                                        })
                                      }
                                      className="h-10 w-9 flex items-center justify-center cursor-pointer"
                                      aria-label="Toggle variant"
                                    >
                                      {v.isOpen ? (
                                        <ChevronDown className="size-5 text-gray-600" />
                                      ) : (
                                        <ChevronRight className="size-5 text-gray-600" />
                                      )}
                                    </button>

                                    <div>
                                      <div className="text-[12px] font-medium text-gray-500">
                                        Variant Option
                                      </div>
                                      <input
                                        value={v.optionName}
                                        onChange={(e) =>
                                          updateVariant(v.id, {
                                            optionName: e.target.value,
                                          })
                                        }
                                        placeholder="e.g. Small"
                                        className="mt-2 h-11 w-full rounded-[10px] border border-gray-200 bg-[#F3F4F6] px-3 text-sm outline-none"
                                      />
                                    </div>

                                    <div>
                                      <div className="text-[12px] font-medium text-gray-500">
                                        Quantity (Portions)
                                      </div>
                                      <input
                                        value={v.portions}
                                        onChange={(e) =>
                                          updateVariant(v.id, {
                                            portions: sanitizeNumber(
                                              e.target.value,
                                            ),
                                          })
                                        }
                                        className="mt-2 h-11 w-full rounded-[10px] border border-gray-200 bg-white px-3 text-sm outline-none"
                                      />
                                    </div>

                                    <div>
                                      <div className="text-[12px] font-medium text-gray-500">
                                        Cost Per Unit
                                      </div>
                                      <div className="mt-2 relative">
                                        {currencySymbol && (
                                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                                            {currencySymbol}
                                          </span>
                                        )}
                                        <input
                                          value={costPerUnit.toFixed(2)}
                                          readOnly
                                          className={`h-11 w-full rounded-[10px] border border-gray-200 bg-[#F3F4F6] ${
                                            currencySymbol ? "pl-7" : "pl-3"
                                          } pr-3 text-sm outline-none`}
                                        />
                                      </div>
                                    </div>

                                    {extraCount > 0 ? (
                                      <span className="inline-flex h-9 items-center justify-center rounded-full bg-[#15BA5C] px-4 text-white text-[12px] font-medium">
                                        {extraCount} extra
                                      </span>
                                    ) : (
                                      <span />
                                    )}
                                  </div>
                                </div>

                                {v.isOpen && (
                                  <div className="border-t border-gray-100 bg-white px-5 py-6">
                                    <div className="flex gap-4">
                                      <div className="w-1 rounded-full bg-[#15BA5C]" />
                                      <div className="flex-1">
                                        <div className="text-[16px] font-semibold text-[#111827]">
                                          Variant Option
                                        </div>
                                        <div className="mt-1 text-[13px] text-gray-500">
                                          Override base ingredient quantities or
                                          add new ingredients unique to this
                                          variant.
                                        </div>

                                        <div className="mt-4 overflow-hidden rounded-[14px] border border-gray-100">
                                          <table className="w-full">
                                            <thead className="bg-[#F9FAFB]">
                                              <tr className="text-left text-[12px] text-gray-500">
                                                <th className="px-4 py-4 font-medium">
                                                  Item
                                                </th>
                                                <th className="px-4 py-4 font-medium">
                                                  Quantity
                                                </th>
                                                <th className="px-4 py-4 font-medium">
                                                  Unit
                                                </th>
                                                <th className="px-4 py-4 font-medium">
                                                  Food Cost
                                                </th>
                                                <th className="px-4 py-4 font-medium">
                                                  Prep Waste
                                                </th>
                                                <th className="px-4 py-4 font-medium">
                                                  Total Cost
                                                </th>
                                                <th className="px-4 py-4 font-medium">
                                                  Critical
                                                </th>
                                                <th className="px-4 py-4 font-medium">
                                                  <span className="sr-only">
                                                    Remove
                                                  </span>
                                                </th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 bg-white">
                                              {v.ingredients.map((row) => {
                                                const inv =
                                                  inventoryItems.find(
                                                    (x) => x.id === row.itemId,
                                                  ) || null;
                                                const unitOptions =
                                                  unitOptionsFor(inv);
                                                const rowTotal =
                                                  ingredientTotal(row);

                                                return (
                                                  <tr key={row.id}>
                                                    <td className="px-4 py-4">
                                                      <Dropdown
                                                        options={
                                                          inventoryOptions
                                                        }
                                                        selectedValue={
                                                          row.itemId ||
                                                          undefined
                                                        }
                                                        onChange={(value) => {
                                                          const picked =
                                                            inventoryItems.find(
                                                              (x) =>
                                                                x.id === value,
                                                            ) || null;
                                                          const nextUom =
                                                            picked?.displayedUnitOfMeasure ||
                                                            "";
                                                          updateVariantIngredient(
                                                            v.id,
                                                            row.id,
                                                            {
                                                              itemId: value,
                                                              itemName:
                                                                picked?.itemName ||
                                                                "",
                                                              unitOfMeasure:
                                                                nextUom,
                                                              foodCost:
                                                                picked != null
                                                                  ? String(
                                                                      picked.costPrice ||
                                                                        0,
                                                                    )
                                                                  : "",
                                                            },
                                                          );
                                                        }}
                                                        placeholder="Select item"
                                                        className="w-full"
                                                        loading={isLoading}
                                                        searchPlaceholder="Search inventory items..."
                                                      />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                      <input
                                                        value={row.quantity}
                                                        onChange={(e) =>
                                                          updateVariantIngredient(
                                                            v.id,
                                                            row.id,
                                                            {
                                                              quantity:
                                                                sanitizeNumber(
                                                                  e.target
                                                                    .value,
                                                                ),
                                                            },
                                                          )
                                                        }
                                                        className="h-11 w-full rounded-[10px] border border-gray-200 bg-white px-3 text-sm outline-none"
                                                      />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                      <Dropdown
                                                        options={unitOptions.map(
                                                          (u) => ({
                                                            value: u,
                                                            label: u,
                                                          }),
                                                        )}
                                                        selectedValue={
                                                          row.unitOfMeasure ||
                                                          undefined
                                                        }
                                                        onChange={(value) =>
                                                          updateVariantIngredient(
                                                            v.id,
                                                            row.id,
                                                            {
                                                              unitOfMeasure:
                                                                value,
                                                            },
                                                          )
                                                        }
                                                        placeholder="Select"
                                                        className="w-full"
                                                        searchPlaceholder="Search units..."
                                                      />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                      <input
                                                        value={row.foodCost}
                                                        onChange={(e) =>
                                                          updateVariantIngredient(
                                                            v.id,
                                                            row.id,
                                                            {
                                                              foodCost:
                                                                sanitizeNumber(
                                                                  e.target
                                                                    .value,
                                                                ),
                                                            },
                                                          )
                                                        }
                                                        className="h-11 w-full rounded-[10px] border border-gray-200 bg-white px-3 text-sm outline-none"
                                                      />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                      <input
                                                        value={row.prepWaste}
                                                        onChange={(e) =>
                                                          updateVariantIngredient(
                                                            v.id,
                                                            row.id,
                                                            {
                                                              prepWaste:
                                                                sanitizeNumber(
                                                                  e.target
                                                                    .value,
                                                                ),
                                                            },
                                                          )
                                                        }
                                                        className="h-11 w-full rounded-[10px] border border-gray-200 bg-white px-3 text-sm outline-none"
                                                      />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                      <input
                                                        value={rowTotal.toFixed(
                                                          2,
                                                        )}
                                                        readOnly
                                                        className="h-11 w-full rounded-[10px] border border-gray-200 bg-gray-50 px-3 text-sm outline-none"
                                                      />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                      <button
                                                        type="button"
                                                        onClick={() =>
                                                          updateVariantIngredient(
                                                            v.id,
                                                            row.id,
                                                            {
                                                              critical:
                                                                !row.critical,
                                                            },
                                                          )
                                                        }
                                                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${
                                                          row.critical
                                                            ? "bg-[#15BA5C]"
                                                            : "bg-gray-300"
                                                        }`}
                                                        aria-label="Toggle critical"
                                                      >
                                                        <span
                                                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                                            row.critical
                                                              ? "translate-x-6"
                                                              : "translate-x-1"
                                                          }`}
                                                        />
                                                      </button>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                      <button
                                                        type="button"
                                                        onClick={() =>
                                                          removeVariantIngredientRow(
                                                            v.id,
                                                            row.id,
                                                          )
                                                        }
                                                        className="h-10 w-10 rounded-[10px] bg-[#FEE2E2] text-[#EF4444] inline-flex items-center justify-center cursor-pointer"
                                                        aria-label="Remove ingredient"
                                                        title="Remove"
                                                      >
                                                        <Trash2 className="h-5 w-5" />
                                                      </button>
                                                    </td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            addVariantIngredientRow(v.id)
                                          }
                                          className="mt-4 text-[#15BA5C] font-medium inline-flex items-center gap-2 cursor-pointer"
                                        >
                                          <Plus className="h-5 w-5" />
                                          Add Item
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          <button
                            type="button"
                            onClick={addVariant}
                            className="mt-2 text-[#15BA5C] font-medium inline-flex items-center gap-2 cursor-pointer"
                          >
                            <Plus className="h-5 w-5" />
                            Add Variant Option
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Total Mix Cost:{" "}
                  <span className="font-semibold text-[#111827]">
                    {totalMixCost.toFixed(2)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={save}
                  disabled={!canSubmit}
                  className="h-11 px-6 rounded-[12px] bg-[#15BA5C] text-white font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#119E4D] transition-colors"
                >
                  {isSubmitting ? "Creating..." : "Create Recipe"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SystemDefaultModal
        isOpen={isAddMixModalOpen}
        onClose={() => setIsAddMixModalOpen(false)}
        onAdd={addMixDefault}
        title="Recipe Mix"
        inputLabel="Mix"
        placeholder="Enter mix name"
        buttonText="Add Mix"
      />
    </>
  );
};

export default CreateRecipe;
