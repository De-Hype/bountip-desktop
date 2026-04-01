"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Download,
  FileText,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useBusinessStore from "@/stores/useBusinessStore";
import useToastStore from "@/stores/toastStore";
import { useAuthStore } from "@/stores/authStore";
import { SYNC_ACTIONS } from "../../../electron/types/action.types";

type InventoryPick = {
  id: string;
  itemName: string;
  costPrice: number;
  displayedUnitOfMeasure: string;
  unitOfPurchase: string;
  unitOfTransfer: string;
  unitOfConsumption: string;
};

type ProductPick = {
  id: string;
  name: string;
};

type ParsedIngredient = {
  itemName: string;
  quantity: number;
  foodCost: number | null;
  prepWaste: number;
  critical: boolean;
};

type ParsedVariant = {
  name: string;
  quantity: number;
};

type ParsedRecipe = {
  row: number;
  productName: string;
  mix: string;
  totalPortions: number;
  preparationTime: number;
  difficultyLevel: "Easy" | "Medium" | "Hard";
  instructions: string;
  imageUrl: string;
  ingredients: ParsedIngredient[];
  variants: ParsedVariant[];
  isValid: boolean;
  isDuplicate: boolean;
  errors: string[];
  status: "ready" | "duplicate" | "error" | "success";
};

type BulkUploadResult = {
  success: number;
  duplicates: number;
  errors: number;
  total: number;
};

type BulkUploadRecipesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
};

const normalize = (v: unknown) => String(v ?? "").trim();
const toNumber = (v: unknown) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
};
const parseBool = (v: unknown) => {
  const s = String(v ?? "")
    .trim()
    .toLowerCase();
  if (s === "true" || s === "yes" || s === "1") return true;
  return false;
};
const normalizeDifficulty = (v: unknown): "Easy" | "Medium" | "Hard" => {
  const s = String(v ?? "")
    .trim()
    .toLowerCase();
  if (s === "easy") return "Easy";
  if (s === "hard") return "Hard";
  return "Medium";
};

const resolveDisplayedUnitLabel = (inv: InventoryPick | null) => {
  if (!inv) return "";
  const raw = String(inv.displayedUnitOfMeasure || "").trim();
  if (!raw) return "";
  if (raw === "unitOfPurchase") return inv.unitOfPurchase || "";
  if (raw === "unitOfTransfer") return inv.unitOfTransfer || "";
  if (raw === "unitOfConsumption") return inv.unitOfConsumption || "";
  return raw;
};

const headers = [
  "productName",
  "mix",
  "totalPortions",
  "preparationTime",
  "difficultyLevel",
  "instructions",
  "imageUrl",
  "ingredient1_name",
  "ingredient1_quantity",
  "ingredient1_foodCost",
  "ingredient1_prepWaste",
  "ingredient1_critical",
  "ingredient2_name",
  "ingredient2_quantity",
  "ingredient2_foodCost",
  "ingredient2_prepWaste",
  "ingredient2_critical",
  "ingredient3_name",
  "ingredient3_quantity",
  "ingredient3_foodCost",
  "ingredient3_prepWaste",
  "ingredient3_critical",
  "ingredient4_name",
  "ingredient4_quantity",
  "ingredient4_foodCost",
  "ingredient4_prepWaste",
  "ingredient4_critical",
  "ingredient5_name",
  "ingredient5_quantity",
  "ingredient5_foodCost",
  "ingredient5_prepWaste",
  "ingredient5_critical",
  "variant1_name",
  "variant1_quantity",
  "variant2_name",
  "variant2_quantity",
  "variant3_name",
  "variant3_quantity",
  "variant4_name",
  "variant4_quantity",
  "variant5_name",
  "variant5_quantity",
] as const;

const BulkUploadRecipesModal = ({
  isOpen,
  onClose,
  onUploadSuccess,
}: BulkUploadRecipesModalProps) => {
  const outlet = useBusinessStore((s) => s.selectedOutlet);
  const authUser = useAuthStore((s) => s.user);
  const { showToast } = useToastStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedRecipes, setParsedRecipes] = useState<ParsedRecipe[]>([]);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(
    null,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [products, setProducts] = useState<ProductPick[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryPick[]>([]);
  const [inventoryId, setInventoryId] = useState<string | null>(null);

  const productByName = useMemo(() => {
    const map = new Map<string, ProductPick>();
    for (const p of products) map.set(p.name.toLowerCase(), p);
    return map;
  }, [products]);

  const inventoryByName = useMemo(() => {
    const map = new Map<string, InventoryPick>();
    for (const it of inventoryItems) map.set(it.itemName.toLowerCase(), it);
    return map;
  }, [inventoryItems]);

  const loadRefs = useCallback(async () => {
    if (!outlet?.id) return;
    const api: any = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    const [productRows, inventoryRows, invRows] = await Promise.all([
      api.dbQuery(
        "SELECT id, name FROM product WHERE outletId = ? AND isDeleted = 0 ORDER BY name COLLATE NOCASE ASC",
        [outlet.id],
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
        [outlet.id],
      ),
      api.dbQuery("SELECT id FROM inventory WHERE outletId = ? LIMIT 1", [
        outlet.id,
      ]),
    ]);

    setProducts(
      (productRows || []).map((p: any) => ({
        id: String(p.id || ""),
        name: String(p.name || ""),
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
  }, [outlet?.id]);

  useEffect(() => {
    if (!isOpen) return;
    setCurrentStep(1);
    setUploadedFile(null);
    setParsedRecipes([]);
    setUploadResult(null);
    setIsUploading(false);
    setUploadProgress(0);
    loadRefs();
  }, [isOpen, loadRefs]);

  const downloadTemplate = useCallback(() => {
    const p1 = products[0]?.name || "Cake";
    const p2 = products[1]?.name || "Bread";
    const p3 = products[2]?.name || products[0]?.name || "Pie";
    const p4 = products[3]?.name || products[1]?.name || "Coffee";
    const p5 = products[4]?.name || products[0]?.name || "Salad";
    const i1 = inventoryItems[0];
    const i2 = inventoryItems[1];
    const i3 = inventoryItems[2];
    const i4 = inventoryItems[3];
    const i5 = inventoryItems[4];
    const i6 = inventoryItems[5];
    const i7 = inventoryItems[6];

    const data = [
      {
        productName: p1,
        mix: "Small",
        totalPortions: 100,
        preparationTime: 30,
        difficultyLevel: "Easy",
        instructions: "1. Prepare the pan.\n2. Combine ingredients.\n3. Bake.",
        imageUrl: "",
        ingredient1_name: i1?.itemName || "Flour",
        ingredient1_quantity: 10,
        ingredient1_foodCost: i1?.costPrice ?? 10,
        ingredient1_prepWaste: 0,
        ingredient1_critical: "TRUE",
        ingredient2_name: i2?.itemName || "Sugar",
        ingredient2_quantity: 5,
        ingredient2_foodCost: i2?.costPrice ?? 5,
        ingredient2_prepWaste: 0,
        ingredient2_critical: "FALSE",
        ingredient3_name: i3?.itemName || "",
        ingredient3_quantity: i3 ? 2 : "",
        ingredient3_foodCost: i3?.costPrice ?? "",
        ingredient3_prepWaste: 0,
        ingredient3_critical: "FALSE",
        ingredient4_name: "",
        ingredient4_quantity: "",
        ingredient4_foodCost: "",
        ingredient4_prepWaste: "",
        ingredient4_critical: "",
        ingredient5_name: "",
        ingredient5_quantity: "",
        ingredient5_foodCost: "",
        ingredient5_prepWaste: "",
        ingredient5_critical: "",
        variant1_name: "Small",
        variant1_quantity: 15,
        variant2_name: "Medium",
        variant2_quantity: 10,
        variant3_name: "Large",
        variant3_quantity: 5,
        variant4_name: "",
        variant4_quantity: "",
        variant5_name: "",
        variant5_quantity: "",
      },
      {
        productName: p2,
        mix: "Large",
        totalPortions: 50,
        preparationTime: 45,
        difficultyLevel: "Medium",
        instructions: "1. Mix.\n2. Proof.\n3. Bake.",
        imageUrl: "",
        ingredient1_name: i2?.itemName || "Sugar",
        ingredient1_quantity: 3,
        ingredient1_foodCost: i2?.costPrice ?? 5,
        ingredient1_prepWaste: 0,
        ingredient1_critical: "FALSE",
        ingredient2_name: i4?.itemName || "",
        ingredient2_quantity: i4 ? 1 : "",
        ingredient2_foodCost: i4?.costPrice ?? "",
        ingredient2_prepWaste: 0,
        ingredient2_critical: "FALSE",
        ingredient3_name: "",
        ingredient3_quantity: "",
        ingredient3_foodCost: "",
        ingredient3_prepWaste: "",
        ingredient3_critical: "",
        ingredient4_name: "",
        ingredient4_quantity: "",
        ingredient4_foodCost: "",
        ingredient4_prepWaste: "",
        ingredient4_critical: "",
        ingredient5_name: "",
        ingredient5_quantity: "",
        ingredient5_foodCost: "",
        ingredient5_prepWaste: "",
        ingredient5_critical: "",
        variant1_name: "Regular",
        variant1_quantity: 20,
        variant2_name: "",
        variant2_quantity: "",
        variant3_name: "",
        variant3_quantity: "",
        variant4_name: "",
        variant4_quantity: "",
        variant5_name: "",
        variant5_quantity: "",
      },
      {
        productName: p3,
        mix: "Medium",
        totalPortions: 80,
        preparationTime: 25,
        difficultyLevel: "Hard",
        instructions:
          "1. Prep ingredients.\n2. Mix thoroughly.\n3. Cook until done.",
        imageUrl: "",
        ingredient1_name: i3?.itemName || "Butter",
        ingredient1_quantity: 2,
        ingredient1_foodCost: i3?.costPrice ?? 2,
        ingredient1_prepWaste: 0,
        ingredient1_critical: "TRUE",
        ingredient2_name: i5?.itemName || i1?.itemName || "Flour",
        ingredient2_quantity: 6,
        ingredient2_foodCost: i5?.costPrice ?? i1?.costPrice ?? 10,
        ingredient2_prepWaste: 0,
        ingredient2_critical: "FALSE",
        ingredient3_name: i6?.itemName || "",
        ingredient3_quantity: i6 ? 1 : "",
        ingredient3_foodCost: i6?.costPrice ?? "",
        ingredient3_prepWaste: 0,
        ingredient3_critical: "FALSE",
        ingredient4_name: "",
        ingredient4_quantity: "",
        ingredient4_foodCost: "",
        ingredient4_prepWaste: "",
        ingredient4_critical: "",
        ingredient5_name: "",
        ingredient5_quantity: "",
        ingredient5_foodCost: "",
        ingredient5_prepWaste: "",
        ingredient5_critical: "",
        variant1_name: "Slice",
        variant1_quantity: 10,
        variant2_name: "Whole",
        variant2_quantity: 5,
        variant3_name: "",
        variant3_quantity: "",
        variant4_name: "",
        variant4_quantity: "",
        variant5_name: "",
        variant5_quantity: "",
      },
      {
        productName: p4,
        mix: "Small",
        totalPortions: 40,
        preparationTime: 10,
        difficultyLevel: "Easy",
        instructions: "1. Add ingredients.\n2. Stir.\n3. Serve.",
        imageUrl: "",
        ingredient1_name: i2?.itemName || "Sugar",
        ingredient1_quantity: 1,
        ingredient1_foodCost: i2?.costPrice ?? 5,
        ingredient1_prepWaste: 0,
        ingredient1_critical: "FALSE",
        ingredient2_name: i7?.itemName || "",
        ingredient2_quantity: i7 ? 1 : "",
        ingredient2_foodCost: i7?.costPrice ?? "",
        ingredient2_prepWaste: 0,
        ingredient2_critical: "FALSE",
        ingredient3_name: "",
        ingredient3_quantity: "",
        ingredient3_foodCost: "",
        ingredient3_prepWaste: "",
        ingredient3_critical: "",
        ingredient4_name: "",
        ingredient4_quantity: "",
        ingredient4_foodCost: "",
        ingredient4_prepWaste: "",
        ingredient4_critical: "",
        ingredient5_name: "",
        ingredient5_quantity: "",
        ingredient5_foodCost: "",
        ingredient5_prepWaste: "",
        ingredient5_critical: "",
        variant1_name: "Hot",
        variant1_quantity: 20,
        variant2_name: "Iced",
        variant2_quantity: 10,
        variant3_name: "",
        variant3_quantity: "",
        variant4_name: "",
        variant4_quantity: "",
        variant5_name: "",
        variant5_quantity: "",
      },
      {
        productName: p5,
        mix: "Large",
        totalPortions: 60,
        preparationTime: 15,
        difficultyLevel: "Medium",
        instructions: "1. Wash.\n2. Chop.\n3. Toss with dressing.",
        imageUrl: "",
        ingredient1_name: i1?.itemName || "Flour",
        ingredient1_quantity: 1,
        ingredient1_foodCost: i1?.costPrice ?? 10,
        ingredient1_prepWaste: 0.2,
        ingredient1_critical: "TRUE",
        ingredient2_name: i4?.itemName || "",
        ingredient2_quantity: i4 ? 1 : "",
        ingredient2_foodCost: i4?.costPrice ?? "",
        ingredient2_prepWaste: 0,
        ingredient2_critical: "FALSE",
        ingredient3_name: i5?.itemName || "",
        ingredient3_quantity: i5 ? 1 : "",
        ingredient3_foodCost: i5?.costPrice ?? "",
        ingredient3_prepWaste: 0,
        ingredient3_critical: "FALSE",
        ingredient4_name: "",
        ingredient4_quantity: "",
        ingredient4_foodCost: "",
        ingredient4_prepWaste: "",
        ingredient4_critical: "",
        ingredient5_name: "",
        ingredient5_quantity: "",
        ingredient5_foodCost: "",
        ingredient5_prepWaste: "",
        ingredient5_critical: "",
        variant1_name: "No onions",
        variant1_quantity: 5,
        variant2_name: "Extra dressing",
        variant2_quantity: 5,
        variant3_name: "",
        variant3_quantity: "",
        variant4_name: "",
        variant4_quantity: "",
        variant5_name: "",
        variant5_quantity: "",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(data, { header: [...headers] as any });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Recipes");
    XLSX.writeFile(wb, "recipe_upload_template.xlsx");
  }, [inventoryItems, products]);

  const parseCSVFile = useCallback(
    (file: File) =>
      new Promise<any[]>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results: any) => resolve(results.data || []),
          error: (err: any) => reject(err),
        });
      }),
    [],
  );

  const parseExcelFile = useCallback(
    (file: File) =>
      new Promise<any[]>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const wb = XLSX.read(data, { type: "array" });
            const firstSheet = wb.SheetNames[0];
            const ws = wb.Sheets[firstSheet];
            const json = XLSX.utils.sheet_to_json(ws, { defval: "" }) as any[];
            resolve(json);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsArrayBuffer(file);
      }),
    [],
  );

  const parseRows = useCallback(
    async (rows: any[]) => {
      if (!outlet?.id) return [];
      const api: any = (window as any).electronAPI;
      if (!api?.dbQuery) return [];

      const existingRows = await api.dbQuery(
        "SELECT id, productName, mix FROM recipes WHERE outletId = ? AND isDeleted = 0",
        [outlet.id],
      );
      const existingKey = new Set<string>();
      for (const r of existingRows || []) {
        const k = `${String(r.productName || "").toLowerCase()}::${String(
          r.mix || "",
        ).toLowerCase()}`;
        existingKey.add(k);
      }

      return rows.map((raw: any, idx: number): ParsedRecipe => {
        const productName = normalize(raw.productName);
        const mix = normalize(raw.mix);
        const totalPortions = Math.max(0, toNumber(raw.totalPortions));
        const preparationTime = Math.max(0, toNumber(raw.preparationTime));
        const difficultyLevel = normalizeDifficulty(raw.difficultyLevel);
        const instructions = normalize(raw.instructions);
        const imageUrl = normalize(raw.imageUrl);

        const ingredients: ParsedIngredient[] = [];
        for (let i = 1; i <= 5; i++) {
          const name = normalize(raw[`ingredient${i}_name`]);
          if (!name) continue;
          const qty = toNumber(raw[`ingredient${i}_quantity`]);
          const foodCostRaw = normalize(raw[`ingredient${i}_foodCost`]);
          const foodCost = foodCostRaw ? toNumber(foodCostRaw) : null;
          const prepWaste = toNumber(raw[`ingredient${i}_prepWaste`]);
          const critical = parseBool(raw[`ingredient${i}_critical`]);
          ingredients.push({
            itemName: name,
            quantity: qty,
            foodCost,
            prepWaste,
            critical,
          });
        }

        const variants: ParsedVariant[] = [];
        for (let i = 1; i <= 5; i++) {
          const name = normalize(raw[`variant${i}_name`]);
          if (!name) continue;
          const qty = Math.max(0, toNumber(raw[`variant${i}_quantity`]));
          variants.push({ name, quantity: qty });
        }

        const errors: string[] = [];
        if (!productName) errors.push("Product name is required");
        if (!mix) errors.push("Mix is required");
        if (!(totalPortions > 0)) errors.push("Total portions must be > 0");
        if (!(preparationTime > 0)) errors.push("Preparation time must be > 0");
        if (!instructions) errors.push("Instructions are required");
        if (ingredients.length === 0)
          errors.push("At least 1 ingredient is required");

        const product = productByName.get(productName.toLowerCase()) || null;
        if (productName && !product) errors.push("Product not found");

        for (const ing of ingredients) {
          if (!(ing.quantity > 0))
            errors.push(`Ingredient '${ing.itemName}' quantity must be > 0`);
          const inv = inventoryByName.get(ing.itemName.toLowerCase()) || null;
          if (!inv) errors.push(`Inventory item not found: ${ing.itemName}`);
        }

        const key = `${productName.toLowerCase()}::${mix.toLowerCase()}`;
        const isDuplicate = existingKey.has(key);
        if (isDuplicate) errors.push("Duplicate recipe (same product + mix)");

        const isValid = errors.length === 0;
        return {
          row: idx + 2,
          productName,
          mix,
          totalPortions,
          preparationTime,
          difficultyLevel,
          instructions,
          imageUrl,
          ingredients,
          variants,
          isValid,
          isDuplicate,
          errors,
          status: isDuplicate ? "duplicate" : isValid ? "ready" : "error",
        };
      });
    },
    [inventoryByName, outlet?.id, productByName],
  );

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploadedFile(file);
      setCurrentStep(3);
      setUploadResult(null);

      try {
        const fileName = file.name.toLowerCase();
        let rows: any[] = [];
        if (fileName.endsWith(".csv")) rows = await parseCSVFile(file);
        else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls"))
          rows = await parseExcelFile(file);
        else throw new Error("Unsupported file format. Upload CSV or Excel.");

        const parsed = await parseRows(rows);
        setParsedRecipes(parsed);
      } catch (e) {
        console.error("Recipe bulk upload parse failed:", e);
        showToast("error", "File parsing failed", "Could not parse the file");
        setUploadedFile(null);
        setParsedRecipes([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setCurrentStep(1);
      }
    },
    [parseCSVFile, parseExcelFile, parseRows, showToast],
  );

  const uploadValidRecipes = useCallback(async () => {
    if (!outlet?.id) return;
    const api: any = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    const valid = parsedRecipes.filter((r) => r.isValid && !r.isDuplicate);
    const duplicates = parsedRecipes.filter((r) => r.isDuplicate).length;
    const errors = parsedRecipes.filter((r) => !r.isValid).length;
    if (valid.length === 0) {
      showToast(
        "error",
        "No valid recipes",
        "Please fix errors before uploading",
      );
      return;
    }
    if (!inventoryId) {
      showToast("error", "No inventory", "Inventory not found for this outlet");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    try {
      const createdBy = authUser?.name ? String(authUser.name) : "system";
      const now = new Date().toISOString();

      let successCount = 0;
      for (let i = 0; i < valid.length; i++) {
        const r = valid[i];
        const product = productByName.get(r.productName.toLowerCase())!;

        const ingredientRows = r.ingredients.map((ing) => {
          const inv = inventoryByName.get(ing.itemName.toLowerCase())!;
          const foodCost =
            ing.foodCost != null ? ing.foodCost : Number(inv.costPrice || 0);
          const prepWaste = Number(ing.prepWaste || 0);
          const quantity = Number(ing.quantity || 0);
          const total = quantity * prepWaste + quantity * foodCost;
          return { ing, inv, foodCost, prepWaste, quantity, total };
        });
        const baseTotal = ingredientRows.reduce((acc, x) => acc + x.total, 0);
        const basePerPortion = baseTotal / Math.max(1, r.totalPortions);
        const variantQty = r.variants.reduce(
          (acc, v) => acc + (v.quantity || 0),
          0,
        );
        const totalMixCost = baseTotal + basePerPortion * variantQty;

        const recipeId = crypto.randomUUID();
        const recipeRecord = {
          id: recipeId,
          name: r.productName,
          productReference: product.id,
          productName: r.productName,
          outletId: outlet.id,
          mix: r.mix,
          totalPortions: r.totalPortions,
          totalMixCost: totalMixCost,
          preparationTime: r.preparationTime,
          difficulty_level: r.difficultyLevel,
          instructions: r.instructions,
          imageUrl: r.imageUrl || null,
          createdAt: now,
          updatedAt: now,
          createdBy,
          isDeleted: false,
          inventoryId,
        };

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
            recipeRecord.id,
            recipeRecord.name,
            recipeRecord.productReference,
            recipeRecord.productName,
            recipeRecord.outletId,
            recipeRecord.mix,
            recipeRecord.totalPortions,
            recipeRecord.totalMixCost,
            recipeRecord.preparationTime,
            recipeRecord.difficulty_level,
            recipeRecord.instructions,
            recipeRecord.imageUrl,
            recipeRecord.createdAt,
            recipeRecord.updatedAt,
            recipeRecord.createdBy,
            0,
            recipeRecord.inventoryId,
          ],
        );

        if (api?.queueAdd) {
          await api.queueAdd({
            table: "recipes",
            action: SYNC_ACTIONS.CREATE,
            id: recipeId,
            data: recipeRecord,
          });
        }

        for (const row of ingredientRows) {
          const ingId = crypto.randomUUID();
          const unitLabel = resolveDisplayedUnitLabel(row.inv) || "";
          const record = {
            id: ingId,
            itemName: row.inv.itemName,
            unitOfMeasure: unitLabel,
            quantity: row.quantity,
            proposedFoodCost: row.foodCost,
            prepWaste: row.prepWaste,
            critical: Boolean(row.ing.critical),
            isDeleted: false,
            createdAt: now,
            updatedAt: now,
            recipeId: recipeId,
            itemId: row.inv.id,
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
              record.id,
              record.itemName,
              record.unitOfMeasure,
              record.quantity,
              record.proposedFoodCost,
              record.prepWaste,
              record.critical ? 1 : 0,
              0,
              record.createdAt,
              record.updatedAt,
              record.recipeId,
              record.itemId,
            ],
          );
          if (api?.queueAdd) {
            await api.queueAdd({
              table: "recipe_ingredients",
              action: SYNC_ACTIONS.CREATE,
              id: ingId,
              data: record,
            });
          }
        }

        for (const v of r.variants) {
          if (!v.name || !(v.quantity > 0)) continue;
          const varId = crypto.randomUUID();
          const record = {
            id: varId,
            modifierName: v.name,
            quantity: v.quantity,
            createdAt: now,
            updatedAt: now,
            isDeleted: false,
            recipeId: recipeId,
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
              id: varId,
              data: record,
            });
          }
        }

        successCount += 1;
        setUploadProgress(Math.round(((i + 1) / valid.length) * 100));
      }

      setUploadResult({
        success: successCount,
        duplicates,
        errors,
        total: parsedRecipes.length,
      });

      setParsedRecipes((prev) =>
        prev.map((r) =>
          r.isValid && !r.isDuplicate ? { ...r, status: "success" } : { ...r },
        ),
      );
      showToast(
        "success",
        "Upload complete",
        `${successCount} recipes uploaded`,
      );
      onUploadSuccess?.();
    } catch (e) {
      console.error("Recipe bulk upload failed:", e);
      showToast("error", "Upload failed", "Could not upload recipes");
    } finally {
      setIsUploading(false);
    }
  }, [
    authUser?.name,
    inventoryByName,
    inventoryId,
    outlet?.id,
    onUploadSuccess,
    parsedRecipes,
    productByName,
    showToast,
  ]);

  const handleReupload = useCallback(() => {
    setUploadedFile(null);
    setParsedRecipes([]);
    setUploadResult(null);
    setUploadProgress(0);
    setIsUploading(false);
    setCurrentStep(1);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const validCount = parsedRecipes.filter(
    (r) => r.isValid && !r.isDuplicate,
  ).length;
  const errorCount = parsedRecipes.filter((r) => !r.isValid).length;
  const duplicateCount = parsedRecipes.filter((r) => r.isDuplicate).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="h-2 bg-green-500 rounded-t-lg" />
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-black">
                Bulk Upload Recipes
              </h2>
              <p className="text-green-600">
                Upload your data through CSV or Excel file.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-black hover:bg-gray-100 rounded-full p-1 cursor-pointer"
              title="Close"
            >
              <X size={24} />
            </button>
          </div>

          <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-start mb-6">
              <div className="shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center mr-4">
                <CheckCircle size={16} />
              </div>
              <div className="grow">
                <div className="flex items-center justify-between mb-2 gap-4">
                  <div>
                    <p className="text-green-500 font-medium text-sm">Step 1</p>
                    <h3 className="font-semibold text-lg">
                      Download our Recipe Upload Template
                    </h3>
                    <p className="text-gray-600 text-sm">
                      The template includes dummy data based on your current
                      products and inventory items.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2 cursor-pointer"
                  >
                    <Download size={16} />
                    Download Excel Template
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start mb-6">
              <div className="shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center mr-4">
                <CheckCircle size={16} />
              </div>
              <div className="grow">
                <p className="text-green-500 font-medium text-sm">Step 2</p>
                <h3 className="font-semibold text-lg">
                  Fill the template with your recipes
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Use ingredient and variant columns to add up to 5 ingredients
                  and 5 variants per recipe.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div
                className={`shrink-0 w-8 h-8 ${
                  currentStep >= 3 ? "bg-green-500" : "bg-gray-300"
                } text-white rounded-full flex items-center justify-center mr-4`}
              >
                <CheckCircle size={16} />
              </div>
              <div className="grow">
                <p className="text-green-500 font-medium text-sm">Step 3</p>
                <h3 className="font-semibold text-lg mb-2">
                  Upload your completed template
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  CSV and Excel files are supported.
                </p>

                {!uploadedFile && !uploadResult && (
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-green-500 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex justify-center mb-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <Upload className="text-green-500" size={24} />
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Upload size={20} />
                      <span className="font-medium">
                        Click to upload a file
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm">
                      CSV and Excel files are supported
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv, .xlsx, .xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                )}

                {(uploadedFile || uploadResult) && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="text-green-500" size={24} />
                        <div>
                          <p className="font-medium">{uploadedFile?.name}</p>
                          <p className="text-sm text-gray-500">
                            {parsedRecipes.length} rows
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleReupload}
                        className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw size={16} />
                        Reupload
                      </button>
                    </div>
                  </div>
                )}

                {isUploading && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {parsedRecipes.length > 0 && (
            <div className="mt-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <CheckCircle className="text-green-500" size={20} />
                    <span className="text-2xl font-bold">
                      {uploadResult ? uploadResult.success : validCount}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {uploadResult
                      ? "Successfully uploaded"
                      : "Valid recipes ready"}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <AlertCircle className="text-yellow-500" size={20} />
                    <span className="text-2xl font-bold">
                      {uploadResult ? uploadResult.duplicates : duplicateCount}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {uploadResult ? "Duplicates skipped" : "Duplicate entries"}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <AlertCircle className="text-red-500" size={20} />
                    <span className="text-2xl font-bold">
                      {uploadResult ? uploadResult.errors : errorCount}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {uploadResult ? "Failed rows" : "Rows with errors"}
                  </p>
                </div>
              </div>

              {!uploadResult && (
                <button
                  type="button"
                  onClick={uploadValidRecipes}
                  disabled={isUploading || validCount === 0}
                  className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                    isUploading || validCount === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-500 text-white hover:bg-green-600 cursor-pointer"
                  }`}
                >
                  <Upload size={16} />
                  Upload {validCount} Valid Recipes
                </button>
              )}

              {duplicateCount > 0 && !uploadResult && (
                <div className="mt-4 flex items-start gap-2 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <AlertCircle className="h-5 w-5 mt-0.5" />
                  <div>
                    Duplicate recipes detected (same product + mix). They will
                    be skipped; only valid, non-duplicate rows will be uploaded.
                  </div>
                </div>
              )}
              <div className="mt-6 border rounded-lg overflow-hidden">
                <div className="max-h-[420px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Mix</TableHead>
                        <TableHead>Ingredients</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Errors</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedRecipes.map((r) => (
                        <TableRow key={`${r.row}-${r.productName}-${r.mix}`}>
                          <TableCell className="font-medium">{r.row}</TableCell>
                          <TableCell>{r.productName}</TableCell>
                          <TableCell>{r.mix}</TableCell>
                          <TableCell>{r.ingredients.length}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                r.status === "success"
                                  ? "bg-green-100 text-green-800"
                                  : r.status === "duplicate"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : r.status === "error"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {r.status}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-[420px]">
                            {r.errors.length > 0 ? (
                              <div className="text-xs text-red-600 space-y-1">
                                {r.errors.slice(0, 3).map((e, i) => (
                                  <div key={i}>{e}</div>
                                ))}
                                {r.errors.length > 3 && (
                                  <div>+{r.errors.length - 3} more</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkUploadRecipesModal;
