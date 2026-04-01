"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Info,
  Leaf,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Dropdown, type DropdownOption } from "@/features/settings/ui/Dropdown";
import {
  Dropdown as CreateDropdown,
  type DropdownOption as CreateDropdownOption,
} from "@/shared/AppDropdowns/CreateDropdown";
import ImageHandler from "@/shared/Image/ImageHandler";
import SystemDefaultModal from "@/shared/SystemDefaultModal";
import { useBusinessStore } from "@/stores/useBusinessStore";
import { useAuthStore } from "@/stores/authStore";
import useToastStore from "@/stores/toastStore";
import { getCurrencySymbol } from "@/utils/getCurrencySymbol";
import { SYNC_ACTIONS } from "../../../electron/types/action.types";
import { SystemDefaultType } from "../../../electron/types/system-default";

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

type ModifierOptionLine = {
  id: string;
  groupId?: string;
  groupName?: string;
  groupMode?: string;
  groupType?: string;
  optionId?: string;
  optionName: string;
  portions: string;
  isOpen: boolean;
  ingredients: IngredientLine[];
};

type GroupedModifier = {
  groupId: string;
  groupName: string;
  groupMode: string;
  groupType: string;
  items: ModifierOptionLine[];
};

type EditRecipeProps = {
  isOpen: boolean;
  recipeId: string | null;
  onClose: () => void;
  onUpdated?: () => void;
};

const sanitizeNumber = (value: string) => value.replace(/[^0-9.]/g, "");

const EditRecipe = ({
  isOpen,
  recipeId,
  onClose,
  onUpdated,
}: EditRecipeProps) => {
  const { selectedOutlet } = useBusinessStore();
  const authUser = useAuthStore((s) => s.user);
  const { showToast } = useToastStore();
  const currencySymbol = selectedOutlet?.currency
    ? getCurrencySymbol(selectedOutlet.currency)
    : "";

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMixLoading, setIsMixLoading] = useState(false);
  const [isAddMixModalOpen, setIsAddMixModalOpen] = useState(false);

  const [recipeName, setRecipeName] = useState("");
  const [productReference, setProductReference] = useState("");
  const [productName, setProductName] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [mix, setMix] = useState("");
  const [mixes, setMixes] = useState<string[]>([]);

  const [totalPortions, setTotalPortions] = useState("1");
  const [preparationTime, setPreparationTime] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("Medium");
  const [instructions, setInstructions] = useState("");
  const [recipeImageUrl, setRecipeImageUrl] = useState<string>("");

  const [inventoryItems, setInventoryItems] = useState<InventoryPick[]>([]);
  const [ingredients, setIngredients] = useState<IngredientLine[]>([]);
  const [modifierOptions, setModifierOptions] = useState<ModifierOptionLine[]>(
    [],
  );
  const [openModifierGroups, setOpenModifierGroups] = useState<
    Record<string, boolean>
  >({});

  const inventoryOptions: DropdownOption[] = useMemo(() => {
    return inventoryItems.map((it) => ({ value: it.id, label: it.itemName }));
  }, [inventoryItems]);

  const productOptions: DropdownOption[] = useMemo(() => {
    return products.map((p) => ({ value: p.id, label: p.name }));
  }, [products]);

  const mixOptions: CreateDropdownOption[] = useMemo(() => {
    return mixes.map((m) => ({ value: m, label: m }));
  }, [mixes]);

  const resolveUnitLabel = useCallback(
    (inv: InventoryPick | null, uom: string) => {
      if (!inv) return "";
      const raw = String(uom || "").trim();
      if (raw === "unitOfPurchase") return inv.unitOfPurchase || "";
      if (raw === "unitOfTransfer") return inv.unitOfTransfer || "";
      if (raw === "unitOfConsumption") return inv.unitOfConsumption || "";
      return raw;
    },
    [],
  );

  const resolveDisplayedUnitLabel = useCallback((inv: InventoryPick | null) => {
    if (!inv) return "";
    const raw = String(inv.displayedUnitOfMeasure || "").trim();
    if (raw === "unitOfPurchase") return inv.unitOfPurchase || "";
    if (raw === "unitOfTransfer") return inv.unitOfTransfer || "";
    if (raw === "unitOfConsumption") return inv.unitOfConsumption || "";
    return raw;
  }, []);

  const ingredientTotal = useCallback((item: IngredientLine) => {
    const quantity = parseFloat(item.quantity) || 0;
    const waste = parseFloat(item.prepWaste) || 0;
    const unitCost = parseFloat(item.foodCost) || 0;
    return quantity * waste + quantity * unitCost;
  }, []);

  const baseTotal = useMemo(() => {
    return ingredients.reduce((acc, it) => acc + ingredientTotal(it), 0);
  }, [ingredientTotal, ingredients]);

  const totalMixCost = useMemo(() => {
    const portions = Math.max(1, parseFloat(totalPortions) || 0);
    const basePerPortion = baseTotal / portions;
    const variantQty = modifierOptions.reduce((acc, v) => {
      const q = parseFloat(v.portions) || 0;
      return acc + (Number.isFinite(q) ? Math.max(0, q) : 0);
    }, 0);
    return baseTotal + basePerPortion * variantQty;
  }, [baseTotal, modifierOptions, totalPortions]);

  const costPerUnitOfVariant = useMemo(() => {
    const portions = Math.max(1, parseFloat(totalPortions) || 0);
    return baseTotal / portions;
  }, [baseTotal, totalPortions]);

  const groupedModifiers = useMemo(() => {
    const map = new Map<string, GroupedModifier>();
    for (const v of modifierOptions) {
      const groupId = String(v.groupId || "modifier");
      const groupName = String(v.groupName || "Modifier");
      const groupMode = String(v.groupMode || "SINGLE_CHOICE");
      const groupType = String(v.groupType || "");
      const existing = map.get(groupId);
      if (existing) existing.items.push(v);
      else
        map.set(groupId, {
          groupId,
          groupName,
          groupMode,
          groupType,
          items: [v],
        });
    }
    const rank = (t: string) =>
      String(t || "").toUpperCase() === "VARIANCE" ? 0 : 1;
    return Array.from(map.values()).sort((a, b) => {
      const r = rank(a.groupType) - rank(b.groupType);
      if (r !== 0) return r;
      return a.groupName.localeCompare(b.groupName);
    });
  }, [modifierOptions]);

  const varianceGroups = useMemo(() => {
    return groupedModifiers.filter(
      (g) => String(g.groupType || "").toUpperCase() === "VARIANCE",
    );
  }, [groupedModifiers]);

  const addOnGroups = useMemo(() => {
    return groupedModifiers.filter(
      (g) => String(g.groupType || "").toUpperCase() !== "VARIANCE",
    );
  }, [groupedModifiers]);

  useEffect(() => {
    if (!isOpen) return;
    setOpenModifierGroups((prev) => {
      const next: Record<string, boolean> = {};
      for (const g of groupedModifiers) {
        next[g.groupId] = prev[g.groupId] ?? true;
      }
      return next;
    });
  }, [groupedModifiers, isOpen]);

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

  const updateIngredient = useCallback(
    (rowId: string, patch: Partial<IngredientLine>) => {
      setIngredients((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
      );
    },
    [],
  );

  const removeIngredientRow = useCallback((rowId: string) => {
    setIngredients((prev) => prev.filter((r) => r.id !== rowId));
  }, []);

  const updateModifierOption = useCallback(
    (id: string, patch: Partial<ModifierOptionLine>) => {
      setModifierOptions((prev) =>
        prev.map((v) => (v.id === id ? { ...v, ...patch } : v)),
      );
    },
    [],
  );

  const updateVariantIngredient = useCallback(
    (variantId: string, rowId: string, patch: Partial<IngredientLine>) => {
      setModifierOptions((prev) =>
        prev.map((v) => {
          if (v.id !== variantId) return v;
          return {
            ...v,
            ingredients: v.ingredients.map((row) =>
              row.id === rowId ? { ...row, ...patch } : row,
            ),
          };
        }),
      );
    },
    [],
  );

  const addVariantIngredientRow = useCallback((variantId: string) => {
    setModifierOptions((prev) =>
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
      setModifierOptions((prev) =>
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

  const loadModifierOptions = useCallback(
    async (
      productId: string,
      variantRows: Array<{ id: string; name: string; qty: string }>,
      baseIngredients: IngredientLine[],
    ) => {
      const api: any = (window as any).electronAPI;
      if (!api?.dbQuery || !selectedOutlet?.id) return [];

      const modRows = await api.dbQuery(
        `
          SELECT id, name, modifierMode, modifierType
          FROM modifier
          WHERE productId = ? AND outletId = ?
            AND (deletedAt IS NULL OR deletedAt = '')
          ORDER BY COALESCE(updatedAt, createdAt) DESC
        `,
        [productId, selectedOutlet.id],
      );

      const mods = (modRows || []).map((m: any, idx: number) => {
        const name = String(m?.name || "").trim();
        return {
          id: String(m?.id || ""),
          name: name || `Modifier ${idx + 1}`,
          mode: String(m?.modifierMode || "SINGLE_CHOICE"),
          type: String(m?.modifierType || "ADD_ON"),
        };
      });

      const generated: ModifierOptionLine[] = [];
      for (const m of mods) {
        const optRows = await api.dbQuery(
          `
            SELECT id, name
            FROM modifier_option
            WHERE modifierId = ?
              AND (deletedAt IS NULL OR deletedAt = '')
            ORDER BY COALESCE(updatedAt, createdAt) ASC
          `,
          [m.id],
        );

        for (const o of optRows || []) {
          const optionName = String(o?.name || "");
          const existing = variantRows.find((x: any) => x.name === optionName);
          const clonedIngredients = baseIngredients.map((bi) => ({
            ...bi,
            id: crypto.randomUUID(),
          }));
          generated.push({
            id: existing?.id || crypto.randomUUID(),
            groupId: m.id,
            groupName: m.name,
            groupMode: m.mode,
            groupType: m.type,
            optionId: String(o?.id || ""),
            optionName,
            portions: existing?.qty || "0",
            isOpen: false,
            ingredients: clonedIngredients,
          });
        }
      }

      return generated;
    },
    [selectedOutlet?.id],
  );

  const load = useCallback(async () => {
    if (!isOpen || !recipeId || !selectedOutlet?.id) return;
    const api: any = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    setIsLoading(true);
    setIsMixLoading(true);
    try {
      const [
        recipeRows,
        productRows,
        inventoryRows,
        ingRows,
        varRows,
        mixRows,
      ] = await Promise.all([
        api.dbQuery(
          `
            SELECT
              id,
              name,
              productReference,
              productName,
              mix,
              COALESCE(totalPortions, 1) as totalPortions,
              COALESCE(totalMixCost, 0) as totalMixCost,
              COALESCE(preparationTime, 0) as preparationTime,
              COALESCE(difficulty_level, 'Medium') as difficulty_level,
              COALESCE(instructions, '') as instructions,
              imageUrl
            FROM recipes
            WHERE id = ? AND outletId = ? AND isDeleted = 0
            LIMIT 1
          `,
          [recipeId, selectedOutlet.id],
        ),
        api.dbQuery(
          "SELECT id, name FROM product WHERE outletId = ? AND isDeleted = 0 ORDER BY name COLLATE NOCASE ASC",
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
        api.dbQuery(
          `
            SELECT
              id,
              itemId,
              itemName,
              unitOfMeasure,
              COALESCE(quantity, 0) as quantity,
              COALESCE(proposedFoodCost, 0) as proposedFoodCost,
              COALESCE(prepWaste, 0) as prepWaste,
              COALESCE(critical, 0) as critical
            FROM recipe_ingredients
            WHERE recipeId = ? AND isDeleted = 0
            ORDER BY COALESCE(updatedAt, createdAt) ASC
          `,
          [recipeId],
        ),
        api.dbQuery(
          `
            SELECT
              id,
              COALESCE(modifierName, '') as modifierName,
              COALESCE(quantity, 0) as quantity
            FROM recipe_variants
            WHERE recipeId = ? AND isDeleted = 0
            ORDER BY COALESCE(updatedAt, createdAt) ASC
          `,
          [recipeId],
        ),
        api.getSystemDefaults
          ? api.getSystemDefaults(
              SystemDefaultType.RECIPE_MIX,
              selectedOutlet.id,
            )
          : [],
      ]);

      const r = recipeRows?.[0] || null;
      if (!r) {
        showToast("error", "Not found", "Recipe could not be loaded");
        onClose();
        return;
      }

      setProducts(
        (productRows || []).map((p: any) => ({
          id: String(p.id || ""),
          name: String(p.name || ""),
        })),
      );

      const invList: InventoryPick[] = (inventoryRows || []).map((x: any) => ({
        id: String(x.id || ""),
        itemName: String(x.itemName || ""),
        costPrice: Number(x.costPrice || 0),
        displayedUnitOfMeasure: String(x.displayedUnitOfMeasure || ""),
        unitOfPurchase: String(x.unitOfPurchase || ""),
        unitOfTransfer: String(x.unitOfTransfer || ""),
        unitOfConsumption: String(x.unitOfConsumption || ""),
      }));
      setInventoryItems(invList);

      setRecipeName(String(r.name || ""));
      setProductReference(String(r.productReference || ""));
      setProductName(String(r.productName || ""));
      setSelectedProductId(String(r.productReference || ""));
      setMix(String(r.mix || ""));
      setTotalPortions(String(Number(r.totalPortions || 1)));
      setPreparationTime(String(Number(r.preparationTime || 0)));
      setDifficultyLevel(String(r.difficulty_level || "Medium"));
      setInstructions(String(r.instructions || ""));
      setRecipeImageUrl(r.imageUrl != null ? String(r.imageUrl) : "");

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

      const ingList: IngredientLine[] = (ingRows || []).map((it: any) => ({
        id: String(it.id || crypto.randomUUID()),
        itemId: String(it.itemId || it.itemId || ""),
        itemName: String(it.itemName || ""),
        unitOfMeasure: String(it.unitOfMeasure || ""),
        quantity: String(Number(it.quantity || 0)),
        foodCost: String(Number(it.proposedFoodCost || 0)),
        prepWaste: String(Number(it.prepWaste || 0)),
        critical: Number(it.critical || 0) === 1,
      }));
      setIngredients(ingList.length > 0 ? ingList : []);

      const variantRows = (varRows || []).map((v: any) => ({
        id: String(v.id || ""),
        name: String(v.modifierName || ""),
        qty: String(Number(v.quantity || 0)),
      }));
      const generated = await loadModifierOptions(
        String(r.productReference || ""),
        variantRows,
        ingList,
      );
      setModifierOptions(generated);
    } catch (e) {
      console.error("Failed to load recipe for edit:", e);
      showToast("error", "Error", "Could not load recipe");
      onClose();
    } finally {
      setIsLoading(false);
      setIsMixLoading(false);
    }
  }, [
    isOpen,
    loadModifierOptions,
    onClose,
    recipeId,
    selectedOutlet?.id,
    showToast,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  const canSubmit =
    !isLoading &&
    !isSaving &&
    recipeId != null &&
    selectedProductId !== "" &&
    mix.trim() !== "" &&
    preparationTime.trim() !== "" &&
    difficultyLevel.trim() !== "" &&
    instructions.trim() !== "" &&
    ingredients.some((it) => it.itemId && (parseFloat(it.quantity) || 0) > 0);

  const save = useCallback(async () => {
    if (!recipeId || !selectedOutlet?.id) return;
    const api: any = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    const now = new Date().toISOString();
    const updatedBy = authUser?.name ? String(authUser.name) : "system";
    const portions = Math.max(1, parseFloat(totalPortions) || 0);
    const prepMinutes = Number(preparationTime || 0) || 0;

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

    if (mix.trim() === "") {
      showToast("error", "Missing mix", "Please select a mix");
      return;
    }

    setIsSaving(true);
    try {
      const recipeRows = await api.dbQuery(
        "SELECT * FROM recipes WHERE id = ? AND outletId = ? LIMIT 1",
        [recipeId, selectedOutlet.id],
      );
      const previous = recipeRows?.[0] || null;

      const nextRecipe = {
        ...(previous || {}),
        id: recipeId,
        name: recipeName || productName || (previous?.name ?? ""),
        productReference: productReference || previous?.productReference,
        productName: productName || previous?.productName,
        outletId: selectedOutlet.id,
        mix: mix.trim(),
        totalPortions: portions,
        totalMixCost: totalMixCost,
        preparationTime: prepMinutes,
        difficulty_level: difficultyLevel,
        instructions: instructions,
        imageUrl: recipeImageUrl || null,
        updatedAt: now,
        createdBy: previous?.createdBy || updatedBy,
        isDeleted: false,
      };

      await api.dbQuery(
        `
          UPDATE recipes
          SET
            mix = ?,
            totalPortions = ?,
            totalMixCost = ?,
            preparationTime = ?,
            difficulty_level = ?,
            instructions = ?,
            imageUrl = ?,
            updatedAt = ?
          WHERE id = ? AND outletId = ?
        `,
        [
          nextRecipe.mix,
          nextRecipe.totalPortions,
          nextRecipe.totalMixCost,
          nextRecipe.preparationTime,
          nextRecipe.difficulty_level,
          nextRecipe.instructions,
          nextRecipe.imageUrl,
          nextRecipe.updatedAt,
          recipeId,
          selectedOutlet.id,
        ],
      );

      if (api?.queueAdd) {
        await api.queueAdd({
          table: "recipes",
          action: SYNC_ACTIONS.UPDATE,
          id: recipeId,
          data: nextRecipe,
        });
      }

      const existingIngredients = await api.dbQuery(
        "SELECT * FROM recipe_ingredients WHERE recipeId = ? AND isDeleted = 0",
        [recipeId],
      );
      await api.dbQuery(
        "UPDATE recipe_ingredients SET isDeleted = 1, updatedAt = ? WHERE recipeId = ?",
        [now, recipeId],
      );
      if (api?.queueAdd) {
        for (const row of existingIngredients || []) {
          await api.queueAdd({
            table: "recipe_ingredients",
            action: SYNC_ACTIONS.DELETE,
            id: row.id,
            data: { ...row, isDeleted: true, updatedAt: now },
          });
        }
      }

      for (const it of validIngredients) {
        const inv = inventoryItems.find((x) => x.id === it.itemId) || null;
        const ingredientId = crypto.randomUUID();
        const ingredientRecord = {
          id: ingredientId,
          itemName: it.itemName || inv?.itemName || "Item",
          unitOfMeasure:
            resolveUnitLabel(inv, it.unitOfMeasure) ||
            resolveDisplayedUnitLabel(inv),
          quantity: parseFloat(it.quantity) || 0,
          proposedFoodCost: parseFloat(it.foodCost) || 0,
          prepWaste: parseFloat(it.prepWaste) || 0,
          critical: Boolean(it.critical),
          isDeleted: false,
          createdAt: now,
          updatedAt: now,
          recipeId,
          itemId: it.itemId,
        };

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
            ingredientRecord.id,
            ingredientRecord.itemName,
            ingredientRecord.unitOfMeasure,
            ingredientRecord.quantity,
            ingredientRecord.proposedFoodCost,
            ingredientRecord.prepWaste,
            ingredientRecord.critical ? 1 : 0,
            0,
            ingredientRecord.createdAt,
            ingredientRecord.updatedAt,
            ingredientRecord.recipeId,
            ingredientRecord.itemId,
          ],
        );

        if (api?.queueAdd) {
          await api.queueAdd({
            table: "recipe_ingredients",
            action: SYNC_ACTIONS.CREATE,
            id: ingredientId,
            data: ingredientRecord,
          });
        }
      }

      const existingVariants = await api.dbQuery(
        "SELECT * FROM recipe_variants WHERE recipeId = ? AND isDeleted = 0",
        [recipeId],
      );
      const existingByName = new Map<string, any>();
      for (const row of existingVariants || []) {
        existingByName.set(String(row.modifierName || ""), row);
      }

      const seen = new Set<string>();
      for (const v of modifierOptions) {
        const name = String(v.optionName || "");
        const qty = Number(parseFloat(v.portions) || 0);
        const existing = existingByName.get(name) || null;

        if (existing) {
          seen.add(String(existing.id || ""));
          await api.dbQuery(
            `
              UPDATE recipe_variants
              SET quantity = ?, updatedAt = ?, isDeleted = 0
              WHERE id = ?
            `,
            [qty, now, existing.id],
          );
          if (api?.queueAdd) {
            await api.queueAdd({
              table: "recipe_variants",
              action: SYNC_ACTIONS.UPDATE,
              id: existing.id,
              data: {
                ...existing,
                quantity: qty,
                updatedAt: now,
                isDeleted: false,
              },
            });
          }
        } else {
          const id = crypto.randomUUID();
          const record = {
            id,
            modifierName: name,
            quantity: qty,
            createdAt: now,
            updatedAt: now,
            isDeleted: false,
            recipeId,
            recordId: null,
            version: 0,
          };
          await api.dbQuery(
            `
              INSERT INTO recipe_variants (
                id,
                modifierName,
                quantity,
                createdAt,
                updatedAt,
                isDeleted,
                recipeId,
                recordId,
                version
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
              record.id,
              record.modifierName,
              record.quantity,
              record.createdAt,
              record.updatedAt,
              0,
              record.recipeId,
              null,
              0,
            ],
          );
          if (api?.queueAdd) {
            await api.queueAdd({
              table: "recipe_variants",
              action: SYNC_ACTIONS.CREATE,
              id,
              data: record,
            });
          }
        }
      }

      for (const row of existingVariants || []) {
        const id = String(row.id || "");
        if (!id || seen.has(id)) continue;
        await api.dbQuery(
          "UPDATE recipe_variants SET isDeleted = 1, updatedAt = ? WHERE id = ?",
          [now, id],
        );
        if (api?.queueAdd) {
          await api.queueAdd({
            table: "recipe_variants",
            action: SYNC_ACTIONS.DELETE,
            id,
            data: { ...row, isDeleted: true, updatedAt: now },
          });
        }
      }

      showToast("success", "Recipe updated", "Recipe updated successfully");
      onUpdated?.();
      onClose();
    } catch (e) {
      console.error("Failed to update recipe:", e);
      showToast("error", "Update failed", "Failed to update recipe");
    } finally {
      setIsSaving(false);
    }
  }, [
    authUser?.name,
    difficultyLevel,
    ingredients,
    inventoryItems,
    mix,
    onClose,
    onUpdated,
    preparationTime,
    productName,
    productReference,
    recipeId,
    recipeImageUrl,
    recipeName,
    resolveDisplayedUnitLabel,
    resolveUnitLabel,
    selectedOutlet?.id,
    showToast,
    totalMixCost,
    totalPortions,
    instructions,
    modifierOptions,
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-3500 bg-black/40">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-[1100px] bg-white shadow-2xl rounded-l-[20px] overflow-hidden">
        <div className="flex items-start justify-between px-10 py-8">
          <div>
            <h2 className="text-[22px] font-bold text-[#000000]">
              Edit Recipe
            </h2>
            <p className="mt-2 text-[14px] text-gray-500 max-w-[740px]">
              Update your recipe details, ingredients and modifiers.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FEE2E2] text-[#EF4444] cursor-pointer"
            aria-label="Close edit recipe modal"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="h-px w-full bg-[#E5E7EB]" />

        <div className="h-[calc(100vh-120px)] overflow-y-auto px-10 py-8">
          {isLoading ? (
            <div className="min-h-[420px] flex items-center justify-center text-sm text-gray-500">
              Loading...
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="text-[14px] font-semibold text-[#111827]">
                    Product<span className="text-red-500">*</span>
                  </label>
                  <div className="mt-3">
                    <Dropdown
                      options={productOptions}
                      selectedValue={selectedProductId || undefined}
                      onChange={async (value) => {
                        setSelectedProductId(value);
                        const picked =
                          products.find((p) => p.id === value) || null;
                        setProductReference(value);
                        setProductName(picked?.name || "");
                        const generated = await loadModifierOptions(
                          value,
                          [],
                          ingredients,
                        );
                        setModifierOptions(generated);
                      }}
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
                  <div className="mt-2 flex items-center gap-2 text-[12px] text-gray-500">
                    <Info className="h-4 w-4 text-[#15BA5C]" />
                    <span>
                      Click the field to select, click plus to add a Mix
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[16px] font-bold text-[#111827]">
                  Ingredients
                </div>
                <div className="mt-4 overflow-hidden rounded-[14px] border border-gray-100 bg-white">
                  <table className="w-full">
                    <thead className="bg-[#F9FAFB]">
                      <tr className="text-left text-[12px] text-gray-500">
                        <th className="px-4 py-4 font-medium">Item</th>
                        <th className="px-4 py-4 font-medium">Quantity</th>
                        <th className="px-4 py-4 font-medium">
                          Unit of measure
                        </th>
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
                            className="px-4 py-10 text-sm text-gray-500"
                          >
                            <div className="flex flex-col items-center justify-center gap-2">
                              <div className="h-10 w-10 rounded-full bg-[#F3F4F6] flex items-center justify-center">
                                <Leaf className="h-5 w-5 text-[#9CA3AF]" />
                              </div>
                              <div>No ingredients added yet.</div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        ingredients.map((row) => {
                          const inv =
                            inventoryItems.find((x) => x.id === row.itemId) ||
                            null;
                          const rowTotal = ingredientTotal(row);
                          const unitLabel =
                            resolveUnitLabel(inv, row.unitOfMeasure) ||
                            resolveDisplayedUnitLabel(inv);
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
                                    updateIngredient(row.id, {
                                      itemId: value,
                                      itemName: picked?.itemName || "",
                                      unitOfMeasure: picked
                                        ? String(
                                            picked.displayedUnitOfMeasure || "",
                                          )
                                        : "",
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
                                <input
                                  value={unitLabel}
                                  readOnly
                                  className="h-11 w-full rounded-[10px] border border-gray-200 bg-[#F3F4F6] px-3 text-sm outline-none"
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
              </div>

              <div className="w-full gap-6">
                <div>
                  <label className="text-[14px] font-semibold text-[#111827]">
                    Total Portions (in Unit Quantity)
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={totalPortions}
                    onChange={(e) =>
                      setTotalPortions(sanitizeNumber(e.target.value))
                    }
                    className="mt-3 h-12 w-full rounded-[12px] border border-gray-200 bg-white px-4 text-sm outline-none"
                  />
                </div>
              </div>

              {groupedModifiers.length > 0 && (
                <div className="mt-8">
                  <label className="text-[14px] font-semibold text-[#111827]">
                    Variance<span className="text-red-500">*</span>
                  </label>

                  <div className="mt-3 rounded-[14px] border border-gray-100 overflow-hidden bg-white">
                    <div className="px-5 pb-5">
                      <div className="space-y-4">
                        {groupedModifiers.map((g, idx) => (
                          <div key={g.groupId} className="pt-2">
                            {idx === varianceGroups.length &&
                              addOnGroups.length > 0 && (
                                <div className="pt-2 text-[14px] font-semibold text-[#111827]">
                                  Add Ons
                                </div>
                              )}
                            <button
                              type="button"
                              onClick={() =>
                                setOpenModifierGroups((prev) => ({
                                  ...prev,
                                  [g.groupId]: !(prev[g.groupId] ?? true),
                                }))
                              }
                              className="w-full flex items-center justify-between gap-3 cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <div className="text-[16px] font-bold text-[#111827]">
                                  {g.groupName} ||{" "}
                                  {g.groupMode === "MULTI_CHOICE"
                                    ? "Multi Choice"
                                    : "Single Choice"}
                                </div>
                                {String(g.groupType || "").toUpperCase() ===
                                  "VARIANCE" && (
                                  <div className="px-4 py-2 rounded-full bg-[#FEE2E2] text-[#EF4444] text-[12px] font-semibold">
                                    Required
                                  </div>
                                )}
                              </div>
                              {(openModifierGroups[g.groupId] ?? true) ? (
                                <ChevronDown className="size-5 text-gray-500" />
                              ) : (
                                <ChevronRight className="size-5 text-gray-500" />
                              )}
                            </button>

                            {(openModifierGroups[g.groupId] ?? true) && (
                              <div className="mt-5 space-y-4">
                                {g.items.map((v) => {
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
                                              updateModifierOption(v.id, {
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
                                            <div className="mt-2 h-11 w-full rounded-[10px] border border-gray-200 bg-[#F3F4F6] px-3 text-sm outline-none flex items-center">
                                              <span className="text-[#111827] font-semibold">
                                                {v.optionName}
                                              </span>
                                            </div>
                                          </div>

                                          <div>
                                            <div className="text-[12px] font-medium text-gray-500">
                                              Quantity (Portions)
                                            </div>
                                            <input
                                              value={v.portions}
                                              onChange={(e) =>
                                                updateModifierOption(v.id, {
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
                                                  currencySymbol
                                                    ? "pl-7"
                                                    : "pl-3"
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
                                                Override base ingredient
                                                quantities or add new
                                                ingredients unique to this
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
                                                    {v.ingredients.map(
                                                      (row) => {
                                                        const inv =
                                                          inventoryItems.find(
                                                            (x) =>
                                                              x.id ===
                                                              row.itemId,
                                                          ) || null;
                                                        const rowTotal =
                                                          ingredientTotal(row);
                                                        const unitLabel =
                                                          resolveUnitLabel(
                                                            inv,
                                                            row.unitOfMeasure,
                                                          ) ||
                                                          resolveDisplayedUnitLabel(
                                                            inv,
                                                          );

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
                                                                onChange={(
                                                                  value,
                                                                ) => {
                                                                  const picked =
                                                                    inventoryItems.find(
                                                                      (x) =>
                                                                        x.id ===
                                                                        value,
                                                                    ) || null;
                                                                  const nextUom =
                                                                    resolveDisplayedUnitLabel(
                                                                      picked,
                                                                    );
                                                                  updateVariantIngredient(
                                                                    v.id,
                                                                    row.id,
                                                                    {
                                                                      itemId:
                                                                        value,
                                                                      itemName:
                                                                        picked?.itemName ||
                                                                        "",
                                                                      unitOfMeasure:
                                                                        nextUom,
                                                                      foodCost:
                                                                        picked !=
                                                                        null
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
                                                                loading={
                                                                  isLoading
                                                                }
                                                                searchPlaceholder="Search inventory items..."
                                                              />
                                                            </td>
                                                            <td className="px-4 py-4">
                                                              <input
                                                                value={
                                                                  row.quantity
                                                                }
                                                                onChange={(e) =>
                                                                  updateVariantIngredient(
                                                                    v.id,
                                                                    row.id,
                                                                    {
                                                                      quantity:
                                                                        sanitizeNumber(
                                                                          e
                                                                            .target
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
                                                                value={
                                                                  unitLabel
                                                                }
                                                                readOnly
                                                                className="h-11 w-full rounded-[10px] border border-gray-200 bg-[#F3F4F6] px-3 text-sm outline-none"
                                                              />
                                                            </td>
                                                            <td className="px-4 py-4">
                                                              <input
                                                                value={
                                                                  row.foodCost
                                                                }
                                                                onChange={(e) =>
                                                                  updateVariantIngredient(
                                                                    v.id,
                                                                    row.id,
                                                                    {
                                                                      foodCost:
                                                                        sanitizeNumber(
                                                                          e
                                                                            .target
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
                                                                value={
                                                                  row.prepWaste
                                                                }
                                                                onChange={(e) =>
                                                                  updateVariantIngredient(
                                                                    v.id,
                                                                    row.id,
                                                                    {
                                                                      prepWaste:
                                                                        sanitizeNumber(
                                                                          e
                                                                            .target
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
                                                      },
                                                    )}
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
                              </div>
                            )}
                            <div className="mt-6 h-[6px] w-full rounded-full bg-[#F3F4F6]" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[14px] font-semibold text-[#111827]">
                    Select Difficulty Level
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-2">
                    <Dropdown
                      mode="select"
                      options={[
                        { value: "Easy", label: "Easy" },
                        { value: "Medium", label: "Medium" },
                        { value: "Hard", label: "Hard" },
                      ]}
                      selectedValue={difficultyLevel}
                      onChange={(v) => setDifficultyLevel(String(v))}
                      className="w-full bg-[#F9FAFB]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[14px] font-semibold text-[#111827]">
                    Preparation Time<span className="text-red-500">*</span>
                  </label>
                  <div className="mt-3 relative">
                    <input
                      value={preparationTime}
                      onChange={(e) =>
                        setPreparationTime(sanitizeNumber(e.target.value))
                      }
                      className="h-12 w-full rounded-[12px] border border-gray-200 bg-white px-4 text-sm outline-none pr-20"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center text-[#6B7280] text-[12px] font-semibold bg-gray-100 px-3 py-1 rounded-[10px]">
                      Minutes
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[14px] font-semibold text-[#111827]">
                  Preparation Instructions
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="mt-3 h-32 w-full rounded-[12px] border border-gray-200 bg-white px-4 py-3 text-sm outline-none"
                />
                <div className="mt-2 text-[12px] text-[#6B7280]">
                  Instruction Guidelines: Please ensure each step is entered on
                  a new line for clarity. Let's make your recipe easy to follow.
                </div>
              </div>

              <div className="mt-10 border-t border-gray-200">
                <div className="flex items-center justify-between py-5 text-[14px] font-semibold text-[#111827]">
                  <span className="uppercase tracking-wide text-gray-500">
                    Total Mix Cost
                  </span>
                  <span>
                    {currencySymbol}
                    {totalMixCost.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between py-5 text-[14px] font-semibold text-[#111827] border-t border-gray-100">
                  <span className="uppercase tracking-wide text-gray-500">
                    Cost Per Unit Of Variant
                  </span>
                  <span>
                    {currencySymbol}
                    {costPerUnitOfVariant.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
              <div>
                <div className="mt-3">
                  <ImageHandler
                    value={recipeImageUrl || null}
                    onChange={(img) => setRecipeImageUrl(img.url)}
                    onError={(error) =>
                      showToast("error", "Image upload failed", error)
                    }
                    label="Upload Recipe Image"
                    previewSize="md"
                    className="w-full"
                    showFileName
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={save}
                disabled={!canSubmit}
                className="mt-8 h-14 w-full rounded-[14px] bg-[#15BA5C] text-white font-semibold text-[16px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#119E4D] transition-colors"
              >
                {isSaving ? "Updating..." : "Save & Update"}
              </button>
            </div>
          )}
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
    </div>
  );
};

export default EditRecipe;
