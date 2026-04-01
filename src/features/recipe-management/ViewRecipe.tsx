"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Clock,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { format, formatDistanceToNowStrict } from "date-fns";
import { useBusinessStore } from "@/stores/useBusinessStore";
import useToastStore from "@/stores/toastStore";
import { getCurrencySymbol } from "@/utils/getCurrencySymbol";
import { SYNC_ACTIONS } from "../../../electron/types/action.types";
import RecipeAssets from "@/assets/images/recipe-management";
import EditRecipe from "@/features/recipe-management/EditRecipe";

type RecipeRecord = {
  id: string;
  name: string;
  productReference: string;
  productName: string;
  outletId: string;
  preparationTime: number;
  difficulty_level: string;
  instructions: string;
  totalPortions: number;
  totalMixCost: number;
  imageUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: string | null;
};

type RecipeIngredientRecord = {
  id: string;
  itemName: string;
  unitOfMeasure: string;
  quantity: number;
  proposedFoodCost: number;
  prepWaste: number;
  critical: boolean;
};

type RecipeVariantRecord = {
  id: string;
  modifierName: string;
  quantity: number;
};

type ModifierGroup = {
  id: string;
  name: string;
  mode: string;
  type: string;
  options: Array<{ id: string; name: string; quantity: number }>;
};

type ViewRecipeProps = {
  isOpen: boolean;
  recipeId: string | null;
  onClose: () => void;
  onDeleted?: () => void;
};

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

const formatCreatedOn = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const day = ordinal(d.getDate());
  const monthYear = format(d, "MMMM yyyy");
  return `${day}, ${monthYear}`;
};

const ViewRecipe = ({
  isOpen,
  recipeId,
  onClose,
  onDeleted,
}: ViewRecipeProps) => {
  const { selectedOutlet } = useBusinessStore();
  const { showToast } = useToastStore();
  const [activeTab, setActiveTab] = useState<
    "basic" | "ingredients" | "modifiers"
  >("basic");
  const [entered, setEntered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recipe, setRecipe] = useState<RecipeRecord | null>(null);
  const [ingredients, setIngredients] = useState<RecipeIngredientRecord[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const hasModifiers = modifierGroups.length > 0;
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const currencySymbol = selectedOutlet?.currency
    ? getCurrencySymbol(selectedOutlet.currency)
    : "";

  const formatMoney = useCallback(
    (amount: number) => {
      const value = Number.isFinite(amount) ? amount : 0;
      const formatted = new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
      return `${currencySymbol}${formatted}`;
    },
    [currencySymbol],
  );

  const ingredientRowTotal = useCallback((it: RecipeIngredientRecord) => {
    const q = Number(it.quantity || 0) || 0;
    const waste = Number(it.prepWaste || 0) || 0;
    const cost = Number(it.proposedFoodCost || 0) || 0;
    return q * waste + q * cost;
  }, []);

  const ingredientsTotal = useMemo(() => {
    return ingredients.reduce((acc, it) => acc + ingredientRowTotal(it), 0);
  }, [ingredientRowTotal, ingredients]);

  const baseCostPerUnit = useMemo(() => {
    const portions = Math.max(1, Number(recipe?.totalPortions || 0) || 0);
    const base = ingredientsTotal;
    return base / portions;
  }, [ingredientsTotal, recipe?.totalPortions]);

  const load = useCallback(async () => {
    if (!isOpen || !recipeId || !selectedOutlet?.id) return;
    const api: any = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    setIsLoading(true);
    try {
      const recipeRows = await api.dbQuery(
        `
          SELECT
            id,
            name,
            productReference,
            productName,
            outletId,
            COALESCE(preparationTime, 0) as preparationTime,
            COALESCE(difficulty_level, 'Medium') as difficulty_level,
            COALESCE(instructions, '') as instructions,
            COALESCE(totalPortions, 0) as totalPortions,
            COALESCE(totalMixCost, 0) as totalMixCost,
            imageUrl,
            createdAt,
            updatedAt,
            createdBy
          FROM recipes
          WHERE id = ? AND outletId = ? AND isDeleted = 0
          LIMIT 1
        `,
        [recipeId, selectedOutlet.id],
      );
      const r = recipeRows?.[0] || null;
      if (!r) {
        setRecipe(null);
        setIngredients([]);
        setModifierGroups([]);
        setOpenGroups({});
        return;
      }

      setRecipe({
        id: String(r.id || ""),
        name: String(r.name || ""),
        productReference: String(r.productReference || ""),
        productName: String(r.productName || ""),
        outletId: String(r.outletId || ""),
        preparationTime: Number(r.preparationTime || 0),
        difficulty_level: String(r.difficulty_level || "Medium"),
        instructions: String(r.instructions || ""),
        totalPortions: Number(r.totalPortions || 0),
        totalMixCost: Number(r.totalMixCost || 0),
        imageUrl: r.imageUrl != null ? String(r.imageUrl) : null,
        createdAt: r.createdAt != null ? String(r.createdAt) : null,
        updatedAt: r.updatedAt != null ? String(r.updatedAt) : null,
        createdBy: r.createdBy != null ? String(r.createdBy) : null,
      });

      const ingRows = await api.dbQuery(
        `
          SELECT
            id,
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
      );
      setIngredients(
        (ingRows || []).map((it: any) => ({
          id: String(it.id || ""),
          itemName: String(it.itemName || ""),
          unitOfMeasure: String(it.unitOfMeasure || ""),
          quantity: Number(it.quantity || 0),
          proposedFoodCost: Number(it.proposedFoodCost || 0),
          prepWaste: Number(it.prepWaste || 0),
          critical: Number(it.critical || 0) === 1,
        })),
      );

      const varRows = await api.dbQuery(
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
      );
      const variantList: RecipeVariantRecord[] = (varRows || []).map(
        (v: any) => ({
          id: String(v.id || ""),
          modifierName: String(v.modifierName || ""),
          quantity: Number(v.quantity || 0),
        }),
      );

      const modRows = await api.dbQuery(
        `
          SELECT id, name, modifierMode, modifierType
          FROM modifier
          WHERE productId = ? AND outletId = ?
            AND (deletedAt IS NULL OR deletedAt = '')
          ORDER BY COALESCE(updatedAt, createdAt) DESC
        `,
        [String(r.productReference || ""), selectedOutlet.id],
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

      const groups: ModifierGroup[] = [];
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
        const options = (optRows || []).map((o: any) => {
          const optionName = String(o?.name || "");
          const q =
            variantList.find((v) => v.modifierName === optionName)?.quantity ??
            0;
          return {
            id: String(o?.id || ""),
            name: optionName,
            quantity: Number(q || 0),
          };
        });
        groups.push({
          id: m.id,
          name: m.name,
          mode: m.mode,
          type: m.type,
          options,
        });
      }

      const ranked = groups.sort((a, b) => {
        const ra = a.type.toUpperCase() === "VARIANCE" ? 0 : 1;
        const rb = b.type.toUpperCase() === "VARIANCE" ? 0 : 1;
        if (ra !== rb) return ra - rb;
        return a.name.localeCompare(b.name);
      });

      setModifierGroups(ranked);
      setOpenGroups((prev) => {
        const next: Record<string, boolean> = {};
        for (const g of ranked) next[g.id] = prev[g.id] ?? true;
        return next;
      });
    } catch (e) {
      console.error("Failed to load recipe:", e);
      showToast("error", "Error", "Could not load recipe");
      setRecipe(null);
      setIngredients([]);
      setModifierGroups([]);
      setOpenGroups({});
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, recipeId, selectedOutlet?.id, showToast]);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab("basic");
    setEntered(false);
    requestAnimationFrame(() => setEntered(true));
    load();
  }, [isOpen, load]);

  useEffect(() => {
    if (!hasModifiers && activeTab === "modifiers") {
      setActiveTab("basic");
    }
  }, [activeTab, hasModifiers]);

  const ingredientsSummary = useMemo(() => {
    if (ingredients.length === 0) return "";
    return ingredients
      .map((i) => i.itemName)
      .filter(Boolean)
      .join("\n");
  }, [ingredients]);

  const lastUpdatedText = useMemo(() => {
    const d = recipe?.updatedAt ? new Date(recipe.updatedAt) : null;
    if (!d || Number.isNaN(d.getTime())) return "";
    const suffix = formatDistanceToNowStrict(d, { addSuffix: true });
    const by = recipe?.createdBy ? ` by ${recipe.createdBy}` : "";
    return `Last Updated ${suffix}${by}`;
  }, [recipe?.createdBy, recipe?.updatedAt]);

  const createdOnText = useMemo(() => {
    const text = formatCreatedOn(recipe?.createdAt || null);
    return text ? `Created on ${text}` : "";
  }, [recipe?.createdAt]);

  const performDelete = useCallback(async () => {
    if (isDeleting) return;
    if (!recipeId || !selectedOutlet?.id) return;
    const api: any = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    const now = new Date().toISOString();
    setIsDeleting(true);
    try {
      const recipeRows = await api.dbQuery(
        "SELECT * FROM recipes WHERE id = ? AND outletId = ? LIMIT 1",
        [recipeId, selectedOutlet.id],
      );
      const r = recipeRows?.[0];
      await api.dbQuery(
        "UPDATE recipes SET isDeleted = 1, updatedAt = ? WHERE id = ? AND outletId = ?",
        [now, recipeId, selectedOutlet.id],
      );
      if (api?.queueAdd && r) {
        await api.queueAdd({
          table: "recipes",
          action: SYNC_ACTIONS.DELETE,
          id: recipeId,
          data: { ...r, isDeleted: true, updatedAt: now },
        });
      }

      const ingRows = await api.dbQuery(
        "SELECT * FROM recipe_ingredients WHERE recipeId = ? AND isDeleted = 0",
        [recipeId],
      );
      await api.dbQuery(
        "UPDATE recipe_ingredients SET isDeleted = 1, updatedAt = ? WHERE recipeId = ?",
        [now, recipeId],
      );
      if (api?.queueAdd) {
        for (const ing of ingRows || []) {
          await api.queueAdd({
            table: "recipe_ingredients",
            action: SYNC_ACTIONS.DELETE,
            id: ing.id,
            data: { ...ing, isDeleted: true, updatedAt: now },
          });
        }
      }

      const varRows = await api.dbQuery(
        "SELECT * FROM recipe_variants WHERE recipeId = ? AND isDeleted = 0",
        [recipeId],
      );
      await api.dbQuery(
        "UPDATE recipe_variants SET isDeleted = 1, updatedAt = ? WHERE recipeId = ?",
        [now, recipeId],
      );
      if (api?.queueAdd) {
        for (const v of varRows || []) {
          await api.queueAdd({
            table: "recipe_variants",
            action: SYNC_ACTIONS.DELETE,
            id: v.id,
            data: { ...v, isDeleted: true, updatedAt: now },
          });
        }
      }

      showToast("success", "Recipe deleted", "Recipe deleted successfully");
      onDeleted?.();
      onClose();
    } catch (e) {
      console.error("Failed to delete recipe:", e);
      showToast("error", "Delete failed", "Failed to delete recipe");
    } finally {
      setIsDeleting(false);
    }
  }, [isDeleting, onClose, onDeleted, recipeId, selectedOutlet?.id, showToast]);

  const handleEdit = useCallback(() => {
    setIsEditOpen(true);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-3000 bg-black/40">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 cursor-pointer"
        aria-label="Close view recipe"
      />
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-[980px] bg-white shadow-2xl rounded-l-[20px] overflow-hidden transform transition-transform duration-300 ${
          entered ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="absolute top-5 right-5 z-10">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FEE2E2] text-[#EF4444] cursor-pointer"
            aria-label="Close view recipe"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-8 pt-8 pb-5">
          <h1 className="text-[28px] font-bold text-[#111827]">
            {recipe?.name || "Recipe"}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-5 text-[13px] text-gray-600">
            {lastUpdatedText && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#15BA5C]" />
                <span>{lastUpdatedText}</span>
              </div>
            )}
            {createdOnText && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#15BA5C]" />
                <span>{createdOnText}</span>
              </div>
            )}
          </div>

          <div className="mt-6 border-b border-gray-200">
            <div className="flex items-center gap-8 text-[16px] font-medium text-gray-400">
              <button
                type="button"
                onClick={() => setActiveTab("basic")}
                className={`pb-3 cursor-pointer ${
                  activeTab === "basic"
                    ? "text-[#111827] border-b-2 border-[#15BA5C]"
                    : ""
                }`}
              >
                Basic Information
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ingredients")}
                className={`pb-3 cursor-pointer ${
                  activeTab === "ingredients"
                    ? "text-[#111827] border-b-2 border-[#15BA5C]"
                    : ""
                }`}
              >
                Ingredients
              </button>
              {hasModifiers && (
                <button
                  type="button"
                  onClick={() => setActiveTab("modifiers")}
                  className={`pb-3 cursor-pointer ${
                    activeTab === "modifiers"
                      ? "text-[#111827] border-b-2 border-[#15BA5C]"
                      : ""
                  }`}
                >
                  Modifiers
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="px-8 pb-24 overflow-y-auto h-[calc(100vh-190px)]">
          {isLoading ? (
            <div className="py-20 text-center text-sm text-gray-500">
              Loading...
            </div>
          ) : activeTab === "basic" ? (
            <div className="space-y-8">
              <div>
                <label className="text-[14px] font-semibold text-[#111827]">
                  Product<span className="text-red-500">*</span>
                </label>
                <input
                  value={recipe?.productName || ""}
                  readOnly
                  className="mt-2 h-12 w-full rounded-[12px] border border-gray-200 bg-[#F3F4F6] px-4 text-[14px] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="text-[14px] font-semibold text-[#111827]">
                    Preparation Time<span className="text-red-500">*</span>
                  </label>
                  <div className="mt-2 relative">
                    <input
                      value={String(
                        Math.round(Number(recipe?.preparationTime || 0)),
                      )}
                      readOnly
                      className="h-12 w-full rounded-[12px] border border-gray-200 bg-[#F3F4F6] px-4 text-[14px] outline-none pr-24"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-2 bg-gray-200 text-gray-700 px-3 py-1.5 rounded-[12px] text-[12px] font-semibold">
                      Minutes
                      <Clock className="h-4 w-4" />
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[14px] font-semibold text-[#111827]">
                    Select Difficulty Level
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={recipe?.difficulty_level || "Medium"}
                    readOnly
                    className="mt-2 h-12 w-full rounded-[12px] border border-gray-200 bg-[#F3F4F6] px-4 text-[14px] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[14px] font-semibold text-[#111827]">
                  Ingredients<span className="text-red-500">*</span>
                </label>
                <textarea
                  value={ingredientsSummary}
                  readOnly
                  className="mt-2 min-h-[100px] w-full rounded-[12px] border border-gray-200 bg-[#F3F4F6] px-4 py-3 text-[14px] outline-none"
                />
              </div>

              <div>
                <label className="text-[14px] font-semibold text-[#111827]">
                  Preparation Instructions
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={recipe?.instructions || ""}
                  readOnly
                  className="mt-2 min-h-[130px] w-full rounded-[12px] border border-gray-200 bg-[#F3F4F6] px-4 py-3 text-[14px] outline-none"
                />
                <div className="mt-3 text-[13px] text-gray-500">
                  Instruction Guidelines: Please ensure each step is entered on
                  a new line for clarity. Let's make your recipe easy to follow!
                </div>
              </div>
              {recipe?.imageUrl ? (
                <div className="mb-5 h-[180px] w-full overflow-hidden rounded-[16px] bg-gray-100">
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.name || "Recipe image"}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
            </div>
          ) : activeTab === "ingredients" ? (
            <div>
              <div className="rounded-[16px] border border-gray-100 bg-white px-8 py-4 relative overflow-hidden">
                <div className="flex items-center justify-between gap-6">
                  <div className="z-10">
                    <p className="text-[20px] font-bold text-[#111827]">
                      Recipe Ingredients
                    </p>
                    <p className="mt-1 text-[13px] text-gray-600">
                      Manage, modify ingredients of the recipe
                    </p>
                    <img
                      title="s"
                      src={RecipeAssets.RecipeSnake}
                      className="absolute z-10 pointer-events-none left-[30px] top-[87px] h-[27px] opacity-90"
                    />
                  </div>
                  <img
                    title="s"
                    src={RecipeAssets.RecipeBook}
                    className="h-[90px]"
                  />
                </div>
              </div>

              <div className="mt-6 rounded-[16px] border border-gray-100 overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px]">
                    <thead className="bg-[#F9FAFB]">
                      <tr className="text-left text-[12px] text-gray-500">
                        <th className="px-5 py-4 font-medium">Item</th>
                        <th className="px-5 py-4 font-medium">Quantity</th>
                        <th className="px-5 py-4 font-medium">
                          Unit of measure
                        </th>
                        <th className="px-5 py-4 font-medium">Food Cost</th>
                        <th className="px-5 py-4 font-medium">Prep waste</th>
                        <th className="px-5 py-4 font-medium">Total Cost</th>
                        <th className="px-5 py-4 font-medium">Critical</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {ingredients.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-6 py-10 text-sm text-gray-500 text-center"
                          >
                            No ingredients
                          </td>
                        </tr>
                      ) : (
                        ingredients.map((row) => {
                          const total = ingredientRowTotal(row);
                          return (
                            <tr
                              key={row.id}
                              className="text-[13px] text-[#111827]"
                            >
                              <td className="px-5 py-4">{row.itemName}</td>
                              <td className="px-5 py-4">{row.quantity}</td>
                              <td className="px-5 py-4">{row.unitOfMeasure}</td>
                              <td className="px-5 py-4">
                                {formatMoney(row.proposedFoodCost)}
                              </td>
                              <td className="px-5 py-4">{row.prepWaste}</td>
                              <td className="px-5 py-4">
                                {formatMoney(total)}
                              </td>
                              <td className="px-5 py-4">
                                {row.critical ? "Yes" : "No"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-4 flex items-center justify-between border-t border-gray-100">
                  <div className="text-[13px] font-bold text-[#111827]">
                    INGREDIENTS TOTAL
                  </div>
                  <div className="text-[13px] font-bold text-[#111827]">
                    {formatMoney(ingredientsTotal)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div>
                <label className="text-[14px] font-semibold text-[#111827]">
                  Total Portions (in Unit Quantity)
                  <span className="text-red-500">*</span>
                </label>
                <input
                  value={String(Math.round(Number(recipe?.totalPortions || 0)))}
                  readOnly
                  className="mt-2 h-12 w-full rounded-[12px] border border-gray-200 bg-[#F3F4F6] px-4 text-[14px] outline-none"
                />
              </div>

              {hasModifiers && (
                <div>
                  <label className="text-[14px] font-semibold text-[#111827]">
                    Modifiers
                  </label>
                  <div className="mt-4 space-y-6">
                    {modifierGroups.map((g) => (
                      <div
                        key={g.id}
                        className="rounded-[16px] border border-gray-100 bg-white overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenGroups((prev) => ({
                              ...prev,
                              [g.id]: !prev[g.id],
                            }))
                          }
                          className="w-full px-5 py-4 flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-[#F3F4F6] flex items-center justify-center">
                              <Clock className="h-4 w-4 text-[#15BA5C]" />
                            </div>
                            <div className="text-[14px] font-bold text-[#111827]">
                              {g.name} ||{" "}
                              {g.mode === "MULTI_CHOICE"
                                ? "Multi Choice"
                                : "Single Choice"}
                            </div>
                          </div>
                          {openGroups[g.id] ? (
                            <ChevronDown className="h-5 w-5 text-gray-600" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-600" />
                          )}
                        </button>

                        {openGroups[g.id] && (
                          <div className="px-6 pb-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {g.options.map((o) => (
                                <div key={o.id} className="space-y-3">
                                  <div>
                                    <div className="text-[12px] font-medium text-gray-500">
                                      Variant Option
                                    </div>
                                    <div className="mt-2 h-11 w-full rounded-[12px] border border-gray-200 bg-[#F3F4F6] px-4 flex items-center text-[13px] font-medium text-[#111827]">
                                      {o.name}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-[12px] font-medium text-gray-500">
                                      Quantity (Portions)
                                    </div>
                                    <div className="mt-2 h-11 w-full rounded-[12px] border border-gray-200 bg-[#F3F4F6] px-4 flex items-center text-[13px] font-medium text-[#111827]">
                                      {Number(o.quantity || 0)}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-[12px] font-medium text-gray-500">
                                      Cost Per Unit
                                    </div>
                                    <div className="mt-2 h-11 w-full rounded-[12px] border border-gray-200 bg-[#F3F4F6] px-4 flex items-center text-[13px] font-medium text-[#111827]">
                                      {formatMoney(baseCostPerUnit)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-8 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={handleEdit}
              disabled={isLoading || !recipe}
              className="h-14 rounded-[14px] bg-[#15BA5C] text-white font-bold text-[16px] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Pencil className="h-5 w-5" />
              Edit Recipe
            </button>
            <button
              type="button"
              onClick={() => {
                setDeleteReason("");
                setIsDeleteModalOpen(true);
              }}
              disabled={isLoading || !recipe || isDeleting}
              className="h-14 rounded-[14px] border-2 border-[#EF4444] text-[#EF4444] font-bold text-[16px] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-5 w-5" />
              Delete Recipe
            </button>
          </div>
        </div>
      </div>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-4000 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-[650px] rounded-[18px] bg-white shadow-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 cursor-pointer"
              aria-label="Close delete recipe modal"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="px-10 py-10">
              <div className="text-[24px] font-bold text-[#111827] leading-none">
                Delete Recipe
              </div>
              <div className="mt-3 text-[14px] text-gray-500">
                Please provide a reason for deleting this recipe
              </div>

              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Start typing..."
                className="mt-8 h-[160px] resize-none w-full rounded-[12px] border border-gray-200 bg-white px-5 py-4 text-[16px] outline-none"
              />

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  type="button"
                  onClick={async () => {
                    const reason = deleteReason.trim();
                    if (!reason) {
                      showToast(
                        "error",
                        "Reason required",
                        "Please enter a reason before deleting",
                      );
                      return;
                    }
                    setIsDeleteModalOpen(false);
                    await performDelete();
                  }}
                  disabled={isDeleting || deleteReason.trim() === ""}
                  className="h-14 rounded-[12px] bg-[#EF4444] text-white font-medium text-[16px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#DC2626] transition-colors"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeleting}
                  className="h-14 rounded-[12px] bg-gray-100 text-[#111827] font-medium text-[16px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <EditRecipe
        isOpen={isEditOpen}
        recipeId={recipeId}
        onClose={() => setIsEditOpen(false)}
        onUpdated={() => {
          setIsEditOpen(false);
          load();
          onDeleted?.();
        }}
      />
    </div>
  );
};

export default ViewRecipe;
