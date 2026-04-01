"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  LayoutGrid,
  List,
  Plus,
  Search,
  Signal,
  UploadCloud,
  X,
} from "lucide-react";
import { Pagination } from "@/shared/Pagination/pagination";
import { useBusinessStore } from "@/stores/useBusinessStore";
import useToastStore from "@/stores/toastStore";
import NotFound from "@/features/inventory/NotFound";
import RecipeAssets from "@/assets/images/recipe-management";
import CreateRecipe from "@/features/recipe-management/CreateRecipe";
import ViewRecipe from "@/features/recipe-management/ViewRecipe";
import BulkUploadRecipesModal from "@/features/recipe-management/BulkUploadRecipesModal";
import { getCurrencySymbol } from "@/utils/getCurrencySymbol";

type RecipeRow = {
  id: string;
  name: string;
  difficulty_level: string;
  preparationTime: number;
  imageUrl: string | null;
  instructions: string;
  totalPortions: number;
  totalMixCost: number;
  productName: string;
};

type IngredientRow = {
  id: string;
  itemName: string;
  unitOfMeasure: string;
  quantity: number;
  proposedFoodCost: number;
};

type RecipeVariantRow = {
  id: string;
  modifierName: string;
  quantity: number;
};

const formatPrepTime = (minutes: number) => {
  const n = Number(minutes || 0);
  const safe = Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
  return `${safe} Mins`;
};

const RecipeDetailsModal = ({
  isOpen,
  recipeId,
  onClose,
}: {
  isOpen: boolean;
  recipeId: string | null;
  onClose: () => void;
}) => {
  const { selectedOutlet } = useBusinessStore();
  const { showToast } = useToastStore();
  const [isLoading, setIsLoading] = useState(false);
  const [recipe, setRecipe] = useState<RecipeRow | null>(null);
  const [ingredients, setIngredients] = useState<IngredientRow[]>([]);
  const [recipeVariants, setRecipeVariants] = useState<RecipeVariantRow[]>([]);

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
            difficulty_level,
            COALESCE(preparationTime, 0) as preparationTime,
            imageUrl,
            COALESCE(instructions, '') as instructions,
            COALESCE(totalPortions, 0) as totalPortions,
            COALESCE(totalMixCost, 0) as totalMixCost,
            COALESCE(productName, '') as productName
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
        return;
      }

      setRecipe({
        id: String(r.id),
        name: String(r.name || ""),
        difficulty_level: String(r.difficulty_level || "Medium"),
        preparationTime: Number(r.preparationTime || 0),
        imageUrl: r.imageUrl != null ? String(r.imageUrl) : null,
        instructions: String(r.instructions || ""),
        totalPortions: Number(r.totalPortions || 0),
        totalMixCost: Number(r.totalMixCost || 0),
        productName: String(r.productName || ""),
      });

      const ingRows = await api.dbQuery(
        `
          SELECT
            id,
            itemName,
            unitOfMeasure,
            COALESCE(quantity, 0) as quantity,
            COALESCE(proposedFoodCost, 0) as proposedFoodCost
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

      setRecipeVariants(
        (varRows || []).map((v: any) => ({
          id: String(v.id || ""),
          modifierName: String(v.modifierName || ""),
          quantity: Number(v.quantity || 0),
        })),
      );
    } catch (e) {
      console.error("Failed to load recipe:", e);
      showToast("error", "Error", "Could not load recipe");
      setRecipe(null);
      setIngredients([]);
      setRecipeVariants([]);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, recipeId, selectedOutlet?.id, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const visibleVariants = useMemo(() => {
    return recipeVariants.filter((v) => (Number(v.quantity || 0) || 0) > 0);
  }, [recipeVariants]);

  return (
    <div
      className="fixed inset-0 z-1000 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[860px] max-h-[calc(100vh-2rem)] bg-white rounded-[18px] shadow-2xl overflow-y-auto">
        <div className="relative px-6 sm:px-8 py-8">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 size-10 rounded-full bg-[#EF4444] flex items-center justify-center cursor-pointer"
            aria-label="Close"
          >
            <X className="size-5 text-white" />
          </button>

          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 className="text-[22px] font-semibold text-[#111827]">
                {recipe?.name || "Recipe"}
              </h2>
              <p className="mt-1 text-[14px] text-gray-500">
                {recipe?.productName || ""}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="px-3 h-8 inline-flex items-center rounded-[10px] bg-[#E9FBF0] text-[#15BA5C] text-[12px] font-medium">
                  {recipe?.difficulty_level || "Medium"}
                </span>
                <span className="px-3 h-8 inline-flex items-center rounded-[10px] bg-gray-100 text-gray-600 text-[12px] font-medium">
                  {formatPrepTime(recipe?.preparationTime || 0)}
                </span>
                <span className="px-3 h-8 inline-flex items-center rounded-[10px] bg-gray-100 text-gray-600 text-[12px] font-medium">
                  Portions: {Number(recipe?.totalPortions || 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-[14px] font-semibold text-[#111827]">
              Instructions
            </p>
            <div className="mt-2 rounded-[14px] border border-gray-200 p-4 text-[14px] text-[#111827] whitespace-pre-wrap min-h-[120px]">
              {isLoading ? "Loading..." : recipe?.instructions || "-"}
            </div>
          </div>

          <div className="mt-6 rounded-[16px] border border-gray-100 overflow-hidden bg-white">
            <div className="px-6 py-4 bg-[#F9FAFB]">
              <p className="text-[14px] font-semibold text-[#111827]">
                Ingredients
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-white">
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-4 text-left text-[13px] font-medium text-gray-500">
                      Item
                    </th>
                    <th className="px-6 py-4 text-left text-[13px] font-medium text-gray-500">
                      Quantity
                    </th>
                    <th className="px-6 py-4 text-left text-[13px] font-medium text-gray-500">
                      Cost
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {Array.from({ length: 3 }).map((__, j) => (
                          <td key={j} className="px-6 py-5">
                            <div className="h-4 bg-gray-100 rounded w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : ingredients.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center">
                        <p className="text-[14px] text-gray-500">
                          No ingredients
                        </p>
                      </td>
                    </tr>
                  ) : (
                    ingredients.map((it) => (
                      <tr key={it.id}>
                        <td className="px-6 py-5 text-[14px] text-[#111827]">
                          {it.itemName}
                        </td>
                        <td className="px-6 py-5 text-[14px] text-[#111827]">
                          {Number(it.quantity || 0)} {it.unitOfMeasure}
                        </td>
                        <td className="px-6 py-5 text-[14px] text-[#111827]">
                          {Number(it.proposedFoodCost || 0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {visibleVariants.length > 0 && (
            <div className="mt-6 rounded-[16px] border border-gray-100 overflow-hidden bg-white">
              <div className="px-6 py-4 bg-[#F9FAFB]">
                <p className="text-[14px] font-semibold text-[#111827]">
                  Variants
                </p>
              </div>
              <div className="px-6 py-6 overflow-x-auto">
                <table className="w-full min-w-[520px]">
                  <thead className="bg-[#F9FAFB]">
                    <tr className="text-left text-[12px] text-gray-500">
                      <th className="px-4 py-3 font-medium">Variant</th>
                      <th className="px-4 py-3 font-medium">Quantity</th>
                      <th className="px-4 py-3 font-medium">Estimated Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {visibleVariants.map((v) => (
                      <tr key={v.id}>
                        <td className="px-4 py-4 text-[13px] text-[#111827] font-medium">
                          {v.modifierName}
                        </td>
                        <td className="px-4 py-4 text-[13px] text-[#111827]">
                          {v.quantity}
                        </td>
                        <td className="px-4 py-4 text-[13px] text-[#111827]">
                          {formatMoney(
                            (Number(recipe?.totalMixCost || 0) /
                              Math.max(1, Number(recipe?.totalPortions || 0))) *
                              Number(v.quantity || 0),
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const RecipeManagementPage = () => {
  const { selectedOutlet } = useBusinessStore();
  const { showToast } = useToastStore();
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

  const [viewMode, setViewMode] = useState<"list" | "card">("card");
  const [isLoading, setIsLoading] = useState(false);
  const [recipes, setRecipes] = useState<RecipeRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [browseSearch, setBrowseSearch] = useState("");
  const [recentIsLoading, setRecentIsLoading] = useState(false);
  const [recentRecipes, setRecentRecipes] = useState<RecipeRow[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [activeRecipeId, setActiveRecipeId] = useState<string | null>(null);
  const cardRowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedOutlet?.id, itemsPerPage]);

  const fetchRecipes = useCallback(async () => {
    if (!selectedOutlet?.id) return;
    const api: any = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    setIsLoading(true);
    try {
      const q = browseSearch.trim();
      let whereSql = "outletId = ? AND isDeleted = 0";
      const whereParams: any[] = [selectedOutlet.id];
      if (q !== "") {
        whereSql += " AND (name LIKE ? OR productName LIKE ?)";
        const pattern = `%${q}%`;
        whereParams.push(pattern, pattern);
      }

      const [countRows, dataRows] = await Promise.all([
        api.dbQuery(
          `SELECT COUNT(*) as count FROM recipes WHERE ${whereSql}`,
          whereParams,
        ),
        api.dbQuery(
          `
            SELECT
              id,
              name,
              COALESCE(difficulty_level, 'Medium') as difficulty_level,
              COALESCE(preparationTime, 0) as preparationTime,
              imageUrl,
              COALESCE(instructions, '') as instructions,
              COALESCE(totalPortions, 0) as totalPortions,
              COALESCE(totalMixCost, 0) as totalMixCost,
              COALESCE(productName, '') as productName
            FROM recipes
            WHERE ${whereSql}
            ORDER BY LOWER(COALESCE(name, '')) ASC
            LIMIT ? OFFSET ?
          `,
          [...whereParams, itemsPerPage, (currentPage - 1) * itemsPerPage],
        ),
      ]);

      const count = Number(countRows?.[0]?.count || 0);
      setTotalCount(count);

      setRecipes(
        (dataRows || []).map((r: any) => ({
          id: String(r.id || ""),
          name: String(r.name || ""),
          difficulty_level: String(r.difficulty_level || "Medium"),
          preparationTime: Number(r.preparationTime || 0),
          imageUrl: r.imageUrl != null ? String(r.imageUrl) : null,
          instructions: String(r.instructions || ""),
          totalPortions: Number(r.totalPortions || 0),
          totalMixCost: Number(r.totalMixCost || 0),
          productName: String(r.productName || ""),
        })),
      );
    } catch (e) {
      console.error("Failed to fetch recipes:", e);
      setRecipes([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [browseSearch, currentPage, itemsPerPage, selectedOutlet?.id]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const fetchRecentRecipes = useCallback(async () => {
    if (!selectedOutlet?.id) return;
    const api: any = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    setRecentIsLoading(true);
    try {
      const dataRows = await api.dbQuery(
        `
          SELECT
            id,
            name,
            COALESCE(difficulty_level, 'Medium') as difficulty_level,
            COALESCE(preparationTime, 0) as preparationTime,
            imageUrl,
            COALESCE(instructions, '') as instructions,
            COALESCE(totalPortions, 0) as totalPortions,
            COALESCE(totalMixCost, 0) as totalMixCost,
            COALESCE(productName, '') as productName
          FROM recipes
          WHERE outletId = ? AND isDeleted = 0
          ORDER BY COALESCE(updatedAt, createdAt) DESC
          LIMIT 5
        `,
        [selectedOutlet.id],
      );

      setRecentRecipes(
        (dataRows || []).map((r: any) => ({
          id: String(r.id || ""),
          name: String(r.name || ""),
          difficulty_level: String(r.difficulty_level || "Medium"),
          preparationTime: Number(r.preparationTime || 0),
          imageUrl: r.imageUrl != null ? String(r.imageUrl) : null,
          instructions: String(r.instructions || ""),
          totalPortions: Number(r.totalPortions || 0),
          totalMixCost: Number(r.totalMixCost || 0),
          productName: String(r.productName || ""),
        })),
      );
    } catch (e) {
      console.error("Failed to fetch recent recipes:", e);
      setRecentRecipes([]);
    } finally {
      setRecentIsLoading(false);
    }
  }, [selectedOutlet?.id]);

  useEffect(() => {
    fetchRecentRecipes();
  }, [fetchRecentRecipes]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalCount / itemsPerPage));
  }, [itemsPerPage, totalCount]);

  const openRecipe = useCallback((id: string) => {
    setActiveRecipeId(id);
    setIsViewOpen(true);
  }, []);

  const scrollCards = useCallback((dir: "left" | "right") => {
    const el = cardRowRef.current;
    if (!el) return;
    const amount = Math.max(260, Math.round(el.clientWidth * 0.7));
    el.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }, []);

  return (
    <section className="px-6 py-6">
      <div className="bg-white py-5 px-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-[#111827]">
            Recipe Management
          </h1>
          <div className="mt-1 inline-flex items-center px-2 py-1 rounded-[6px]  text-[#111827] text-[13px] font-medium">
            Add, edit and manage your Recipe
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsBulkUploadOpen(true)}
            className="h-11 px-4 rounded-[10px] border border-[#15BA5C] text-[#15BA5C] bg-white flex items-center gap-2 font-medium cursor-pointer hover:bg-[#E9FBF0] transition-colors"
          >
            <UploadCloud className="size-5" />
            <span className="text-[14px]">Bulk Upload</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="h-11 px-4 rounded-[10px] bg-[#15BA5C] text-white flex items-center gap-2 font-medium cursor-pointer hover:bg-[#119E4D] transition-colors"
          >
            <Plus className="size-5" />
            <span className="text-[14px]">Create Recipe</span>
          </button>
        </div>
      </div>

      <div className="bg-white py-5 px-4  flex flex-col gap-6  ">
        <div className="flex justify-between">
          <div className="flex items-center">
            <div className="flex items-center bg-[#E9FAF2] rounded-2xl px-8 py-4 border border-green-100">
              <div className="mr-8">
                <p className="text-sm text-gray-600">Total Recipe</p>
                <p className="text-4xl font-semibold text-gray-900">
                  {totalCount}
                </p>
              </div>
              <div className="h-10 border-r border-dashed border-green-300 mr-8" />
              <div className="flex items-center justify-center">
                <img src={RecipeAssets.Cup} width={57} height={57} alt="Cups" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-start">
            <div className="inline-flex items-center rounded-[10px] border border-gray-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`h-10 px-4 rounded-[8px] text-[14px] font-medium flex items-center gap-2 cursor-pointer ${
                  viewMode === "list"
                    ? "bg-[#F3F4F6] text-[#111827]"
                    : "bg-white text-gray-500"
                }`}
              >
                <List className="size-4" />
                List View
              </button>
              <button
                type="button"
                onClick={() => setViewMode("card")}
                className={`h-10 px-4 rounded-[8px] text-[14px] font-medium flex items-center gap-2 cursor-pointer ${
                  viewMode === "card"
                    ? "bg-[#F3F4F6] text-[#111827]"
                    : "bg-white text-gray-500"
                }`}
              >
                <LayoutGrid className="size-4" />
                Card View
              </button>
            </div>
          </div>
        </div>

        <div className="">
          {!isLoading && recipes.length > 0 && viewMode === "card" && (
            <div className="mt-6 relative rounded-[14px] border border-gray-100 bg-white px-6 py-6">
              <button
                type="button"
                onClick={() => scrollCards("left")}
                className="absolute -left-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-[#15BA5C] text-white flex items-center justify-center cursor-pointer shadow-md"
                aria-label="Scroll left"
              >
                <ArrowLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollCards("right")}
                className="absolute -right-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-[#15BA5C] text-white flex items-center justify-center cursor-pointer shadow-md"
                aria-label="Scroll right"
              >
                <ArrowRight className="size-5" />
              </button>

              <div
                ref={cardRowRef}
                className="flex gap-4 overflow-x-auto scroll-smooth px-4"
              >
                {recipes.map((r) => (
                  <div
                    key={r.id}
                    className="min-w-[210px] max-w-[210px] rounded-[14px] border border-gray-200 bg-white overflow-hidden"
                  >
                    <div className="h-[110px] bg-gray-100 flex items-center justify-center">
                      {r.imageUrl ? (
                        <img
                          src={r.imageUrl}
                          alt={r.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-[13px] text-gray-400">
                          No Image
                        </span>
                      )}
                    </div>

                    <div className="px-4 py-4">
                      <p className="text-[15px] font-semibold text-[#111827] truncate">
                        {r.name}
                      </p>

                      <div className="mt-3 flex items-center justify-between text-[12px] text-gray-500">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">
                            {r.difficulty_level}
                          </span>
                          <Signal className="size-4 text-[#15BA5C]" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span>{formatPrepTime(r.preparationTime)}</span>
                          <img
                            src={RecipeAssets.Cup}
                            width={16}
                            height={16}
                            alt="Time"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openRecipe(r.id)}
                        className="mt-4 w-full h-10 rounded-[12px] bg-[#15BA5C] text-white font-medium text-[13px] flex items-center justify-center gap-2 cursor-pointer hover:bg-[#119E4D] transition-colors"
                      >
                        View Recipe
                        <Eye className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!isLoading && recipes.length > 0 && viewMode === "list" && (
            <div className="mt-6 relative rounded-[14px] border border-gray-100 bg-white px-6 py-6">
              <button
                type="button"
                onClick={() => scrollCards("left")}
                className="absolute -left-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-[#15BA5C] text-white flex items-center justify-center cursor-pointer shadow-md"
                aria-label="Scroll left"
              >
                <ArrowLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollCards("right")}
                className="absolute -right-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-[#15BA5C] text-white flex items-center justify-center cursor-pointer shadow-md"
                aria-label="Scroll right"
              >
                <ArrowRight className="size-5" />
              </button>

              <div
                ref={cardRowRef}
                className="flex gap-4 overflow-x-auto scroll-smooth px-4"
              >
                {recipes.map((r) => (
                  <div
                    key={r.id}
                    className="min-w-[210px] max-w-[210px] rounded-[14px] border border-gray-200 bg-white overflow-hidden"
                  >
                    <div className="px-4 py-4">
                      <p className="text-[15px] font-semibold text-[#111827] truncate">
                        {r.name}
                      </p>

                      <div className="mt-3 flex items-center justify-between text-[12px] text-gray-500">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">
                            {r.difficulty_level}
                          </span>
                          <Signal className="size-4 text-[#15BA5C]" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span>{formatPrepTime(r.preparationTime)}</span>
                          <img
                            src={RecipeAssets.Cup}
                            width={16}
                            height={16}
                            alt="Time"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openRecipe(r.id)}
                        className="mt-4 w-full h-10 rounded-[12px] bg-[#15BA5C] text-white font-medium text-[13px] flex items-center justify-center gap-2 cursor-pointer hover:bg-[#119E4D] transition-colors"
                      >
                        View Recipe
                        <Eye className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
        <div className="rounded-[14px] border border-gray-100 bg-white px-6 py-6">
          <div className="flex flex-col gap-4 ">
            <h2 className="text-[18px] font-semibold text-[#111827]">
              Browse Recipe Items
            </h2>

            <div className="flex flex-1 justify-between gap-3 ">
              <div className="w-full md:w-[260px]">
                <select className="h-11 w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-sm text-[#111827] outline-none">
                  <option>All Categories</option>
                </select>
              </div>

              <div className="flex w-full max-w-md items-stretch overflow-hidden rounded-[10px] border border-[#E5E7EB] h-11">
                <input
                  type="text"
                  placeholder="Search by keyword"
                  value={browseSearch}
                  onChange={(e) => {
                    setBrowseSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="flex-1 px-3 py-2.5 text-sm outline-none placeholder-[#A6A6A6]"
                />
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center bg-[#15BA5C] text-white font-medium"
                >
                  <Search />
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            viewMode === "card" ? (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={`browse-skeleton-${i}`}
                    className="rounded-[14px] border border-gray-200 bg-white overflow-hidden animate-pulse"
                  >
                    <div className="h-[140px] bg-gray-100" />
                    <div className="px-4 py-4">
                      <div className="h-4 w-40 bg-gray-100 rounded" />
                      <div className="mt-3 flex items-center justify-between">
                        <div className="h-3 w-20 bg-gray-100 rounded" />
                        <div className="h-3 w-16 bg-gray-100 rounded" />
                      </div>
                      <div className="mt-4 h-10 w-full bg-gray-100 rounded-[12px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 overflow-hidden rounded-[14px] ">
                <table className="w-full">
                  <thead className="bg-[#F9FAFB]">
                    <tr className="text-left text-[12px] text-gray-500">
                      <th className="px-6 py-4 font-medium">Product</th>
                      <th className="px-6 py-4 font-medium">Prep Time</th>
                      <th className="px-6 py-4 font-medium">Standard Cost</th>
                      <th className="px-6 py-4 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <tr
                        key={`browse-table-skeleton-${i}`}
                        className="animate-pulse"
                      >
                        <td className="px-6 py-5">
                          <div className="h-4 w-36 bg-gray-100 rounded" />
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-4 w-20 bg-gray-100 rounded" />
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-4 w-24 bg-gray-100 rounded" />
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-10 w-32 bg-gray-100 rounded-[12px]" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : recipes.length === 0 ? (
            <div className="mt-6">
              <NotFound
                title="No recipes found"
                description="Create a recipe to see it listed here."
              />
            </div>
          ) : viewMode === "card" ? (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map((r) => (
                <div
                  key={r.id}
                  className="rounded-[14px] border border-gray-200 bg-white overflow-hidden"
                >
                  <div className="h-[140px] bg-gray-100 flex items-center justify-center">
                    {r.imageUrl ? (
                      <img
                        src={r.imageUrl}
                        alt={r.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-[13px] text-gray-400">
                        No Image
                      </span>
                    )}
                  </div>

                  <div className="px-4 py-4">
                    <p className="text-[15px] font-semibold text-[#111827] truncate">
                      {r.name}
                    </p>

                    <div className="mt-3 flex items-center justify-between text-[12px] text-gray-500">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">
                          {r.difficulty_level}
                        </span>
                        <Signal className="size-4 text-[#15BA5C]" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{formatPrepTime(r.preparationTime)}</span>
                        <img
                          src={RecipeAssets.Cup}
                          width={16}
                          height={16}
                          alt="Time"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openRecipe(r.id)}
                      className="mt-4 w-full h-10 rounded-[12px] bg-[#15BA5C] text-white font-medium text-[13px] flex items-center justify-center gap-2 cursor-pointer hover:bg-[#119E4D] transition-colors"
                    >
                      View Recipe
                      <Eye className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-[14px] border border-gray-100">
              <table className="w-full">
                <thead className="bg-[#F9FAFB]">
                  <tr className="text-left text-[12px] text-gray-500">
                    <th className="px-6 py-4 font-medium">Product</th>
                    <th className="px-6 py-4 font-medium">Prep Time</th>
                    <th className="px-6 py-4 font-medium">Standard Cost</th>
                    <th className="px-6 py-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {recipes.map((r) => (
                    <tr key={r.id} className="text-[14px] text-[#111827]">
                      <td className="px-6 py-5 font-medium">{r.name}</td>
                      <td className="px-6 py-5">
                        {formatPrepTime(r.preparationTime)}
                      </td>
                      <td className="px-6 py-5">
                        {formatMoney(Number(r.totalMixCost || 0))}
                      </td>
                      <td className="px-6 py-5">
                        <button
                          type="button"
                          onClick={() => openRecipe(r.id)}
                          className="h-10 px-6 rounded-[12px] bg-[#15BA5C] text-white font-medium text-[13px] inline-flex items-center justify-center gap-2 cursor-pointer hover:bg-[#119E4D] transition-colors"
                        >
                          View Recipe
                          <Eye className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && totalCount > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={(n) => {
                setItemsPerPage(n);
                setCurrentPage(1);
              }}
              totalItems={totalCount}
              className="mt-6"
            />
          )}
        </div>

        <div className="rounded-[14px] border border-gray-100 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-[18px] font-semibold text-[#111827]">
              Recent Recipes
            </h2>
          </div>

          {recentIsLoading ? (
            <div className="px-6 py-6">
              <div className="divide-y divide-gray-100">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={`recent-skeleton-${i}`}
                    className="py-6 animate-pulse"
                  >
                    {viewMode === "card" && (
                      <div className="h-[150px] rounded-[12px] bg-gray-100" />
                    )}

                    <div className={viewMode === "card" ? "mt-4" : ""}>
                      <div className="h-4 w-40 bg-gray-100 rounded" />
                      <div className="mt-3 flex items-center justify-between">
                        <div className="h-3 w-20 bg-gray-100 rounded" />
                        <div className="h-3 w-16 bg-gray-100 rounded" />
                      </div>
                      <div className="mt-4 h-10 w-full bg-gray-100 rounded-[12px]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : recentRecipes.length === 0 ? (
            <div className="px-6 py-6 text-sm text-gray-500">
              No recent recipes.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentRecipes.map((r) => (
                <div key={r.id} className="px-6 py-6">
                  {viewMode === "card" && (
                    <div className="h-[150px] rounded-[12px] overflow-hidden bg-gray-100 flex items-center justify-center">
                      {r.imageUrl ? (
                        <img
                          src={r.imageUrl}
                          alt={r.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-[13px] text-gray-400">
                          No Image
                        </span>
                      )}
                    </div>
                  )}

                  <div className={viewMode === "card" ? "mt-4" : ""}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[15px] font-semibold text-[#111827] truncate">
                        {r.name}
                      </p>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[12px] text-gray-500">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">
                          {r.difficulty_level}
                        </span>
                        <Signal className="size-4 text-[#15BA5C]" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{formatPrepTime(r.preparationTime)}</span>
                        <img
                          src={RecipeAssets.Cup}
                          width={16}
                          height={16}
                          alt="Time"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openRecipe(r.id)}
                      className="mt-4 w-full h-10 rounded-[12px] border border-[#15BA5C] text-[#15BA5C] bg-white font-medium text-[13px] flex items-center justify-center gap-2 cursor-pointer hover:bg-[#E9FBF0] transition-colors"
                    >
                      View Recipe
                      <Eye className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ViewRecipe
        isOpen={isViewOpen}
        recipeId={activeRecipeId}
        onClose={() => {
          setIsViewOpen(false);
          setActiveRecipeId(null);
        }}
        onDeleted={() => {
          fetchRecipes();
          fetchRecentRecipes();
        }}
      />

      <BulkUploadRecipesModal
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onUploadSuccess={() => {
          fetchRecipes();
          fetchRecentRecipes();
          setIsBulkUploadOpen(false);
        }}
      />

      <CreateRecipe
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          fetchRecipes();
          fetchRecentRecipes();
        }}
      />
    </section>
  );
};

export default RecipeManagementPage;
