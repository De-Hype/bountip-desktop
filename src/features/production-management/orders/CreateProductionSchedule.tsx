"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Package,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { useAuthStore } from "@/stores/authStore";
import useBusinessStore from "@/stores/useBusinessStore";
import useToastStore from "@/stores/toastStore";
import { getCurrencySymbol } from "@/utils/getCurrencySymbol";
import type { Order } from "@/stores/useOrderStore";
import { OrderStatus } from "../../../../electron/types/order.types";
import {
  ProductionV2Status,
  ProductionV2WorkflowPath,
} from "../../../../electron/types/productionV2.types";

type CreateProductionScheduleProps = {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onCreated?: () => void;
};

type RecipeRow = {
  recipeId: string | null;
  totalPortions: number;
  totalMixCost: number;
};

type RecipeIngredientRow = {
  itemId: string | null;
  itemName: string;
  unitOfMeasure: string;
  quantity: number;
  proposedFoodCost: number;
};

type ProductGroup = {
  productId: string;
  productName: string;
  productCode: string | null;
  confirmedQty: number;
  quantityForProduction: string;
  finalQuantity: string;
  recipe: RecipeRow | null;
  ingredients: RecipeIngredientRow[];
  isOpen: boolean;
};

const generateBatchId = () => {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `QOR${yy}${mm}${dd}${rand}`;
};

const sanitizeNumber = (value: string) => value.replace(/[^0-9.]/g, "");

const CreateProductionSchedule = ({
  isOpen,
  onClose,
  orders,
  onCreated,
}: CreateProductionScheduleProps) => {
  const authUser = useAuthStore((s: any) => s.user);
  const { selectedOutlet } = useBusinessStore();
  const { showToast } = useToastStore();

  const currencySymbol = selectedOutlet?.currency
    ? getCurrencySymbol(selectedOutlet.currency)
    : "";
  const formatMoney = (amount: number) => {
    const value = Number.isFinite(amount) ? amount : 0;
    const formatted = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
    return `${currencySymbol}${formatted}`;
  };

  const [batchId, setBatchId] = useState("");
  const [productionManager, setProductionManager] = useState("");
  const [productionDate, setProductionDate] = useState<Date | undefined>(
    undefined,
  );
  const [productionTime, setProductionTime] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

  const [isOrderMenuOpen, setIsOrderMenuOpen] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [draftOrderIds, setDraftOrderIds] = useState<string[]>([]);
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitDecisionOpen, setIsSubmitDecisionOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setBatchId(generateBatchId());
    setProductionManager(authUser?.name || "");
    setProductionDate(undefined);
    setProductionTime("");
    setAdditionalInfo("");
    setIsOrderMenuOpen(false);
    setOrderSearch("");
    setSelectedOrderIds([]);
    setDraftOrderIds([]);
    setIsSavingDraft(false);
    setIsSubmitting(false);
  }, [authUser?.name, isOpen]);

  const disablePastDates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (day: Date) => {
      const d = new Date(day);
      d.setHours(0, 0, 0, 0);
      return d < today;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (!selectedOutlet?.id) return;
    const api = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    if (selectedOrderIds.length === 0) {
      setProductGroups([]);
      return;
    }

    setIsLoadingProducts(true);
    (async () => {
      try {
        const placeholders = selectedOrderIds.map(() => "?").join(", ");
        const sql = `
          SELECT
            ci.productId as productId,
            COALESCE(p.name, '') as productName,
            p.productCode as productCode,
            SUM(COALESCE(ci.quantity, 0)) as confirmedQty,
            AVG(COALESCE(ci.unitPrice, 0)) as unitPrice
          FROM cart_item ci
          JOIN orders o ON o.cartId = ci.cartId
          LEFT JOIN product p ON p.id = ci.productId
          WHERE o.outletId = ? AND o.id IN (${placeholders})
          GROUP BY ci.productId, p.name, p.productCode
          ORDER BY productName ASC
        `;
        const rows = await api.dbQuery(sql, [
          selectedOutlet.id,
          ...selectedOrderIds,
        ]);

        const groupsBase: ProductGroup[] = (rows || []).map((r: any) => {
          const confirmed = Number(r.confirmedQty || 0);
          return {
            productId: String(r.productId),
            productName: String(r.productName || "Product"),
            productCode: r.productCode != null ? String(r.productCode) : null,
            confirmedQty: confirmed,
            quantityForProduction: String(confirmed || 0),
            finalQuantity: String(confirmed || 0),
            recipe: null,
            ingredients: [],
            isOpen: true,
          };
        });

        const enriched: ProductGroup[] = [];
        for (const g of groupsBase) {
          const recipeRows = await api.dbQuery(
            `
              SELECT
                id as recipeId,
                COALESCE(totalPortions, 0) as totalPortions,
                COALESCE(totalMixCost, 0) as totalMixCost
              FROM recipes
              WHERE outletId = ? AND isDeleted = 0
                AND (productReference = ? OR productReference = ? OR productName = ?)
              ORDER BY COALESCE(updatedAt, createdAt) DESC
              LIMIT 1
            `,
            [
              selectedOutlet.id,
              g.productId,
              g.productCode || g.productId,
              g.productName,
            ],
          );
          const recipe = recipeRows?.[0]
            ? {
                recipeId: recipeRows[0].recipeId
                  ? String(recipeRows[0].recipeId)
                  : null,
                totalPortions: Number(recipeRows[0].totalPortions || 0),
                totalMixCost: Number(recipeRows[0].totalMixCost || 0),
              }
            : null;

          let ingredients: RecipeIngredientRow[] = [];
          if (recipe?.recipeId) {
            const ingRows = await api.dbQuery(
              `
                SELECT
                  itemId,
                  itemName,
                  unitOfMeasure,
                  COALESCE(quantity, 0) as quantity,
                  COALESCE(proposedFoodCost, 0) as proposedFoodCost
                FROM recipe_ingredients
                WHERE recipeId = ? AND isDeleted = 0
                ORDER BY COALESCE(updatedAt, createdAt) ASC
              `,
              [recipe.recipeId],
            );
            ingredients = (ingRows || []).map((ir: any) => ({
              itemId: ir.itemId ? String(ir.itemId) : null,
              itemName: String(ir.itemName || ""),
              unitOfMeasure: String(ir.unitOfMeasure || ""),
              quantity: Number(ir.quantity || 0),
              proposedFoodCost: Number(ir.proposedFoodCost || 0),
            }));
          }

          enriched.push({ ...g, recipe, ingredients });
        }

        setProductGroups(enriched);
      } catch (err) {
        console.error("Failed to load order products:", err);
        setProductGroups([]);
      } finally {
        setIsLoadingProducts(false);
      }
    })();
  }, [isOpen, selectedOutlet?.id, selectedOrderIds]);

  const ordersById = useMemo(() => {
    const m = new Map<string, Order>();
    (orders || []).forEach((o) => {
      m.set(o.id, o);
    });
    return m;
  }, [orders]);

  const selectedOrders = useMemo(() => {
    return selectedOrderIds
      .map((id) => ordersById.get(id))
      .filter(Boolean) as Order[];
  }, [ordersById, selectedOrderIds]);

  const subTotal = useMemo(() => {
    return selectedOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
  }, [selectedOrders]);

  const updateGroup = (productId: string, patch: Partial<ProductGroup>) => {
    setProductGroups((prev) =>
      prev.map((g) => (g.productId === productId ? { ...g, ...patch } : g)),
    );
  };

  const scaledIngredients = (g: ProductGroup) => {
    if (!g.recipe || !g.recipe.recipeId || g.ingredients.length === 0)
      return [];
    const q = parseFloat(g.quantityForProduction) || 0;
    const base = g.recipe.totalPortions > 0 ? g.recipe.totalPortions : 1;
    const ratio = base > 0 ? q / base : 1;
    return g.ingredients.map((it) => ({
      ...it,
      quantity: it.quantity * ratio,
      proposedFoodCost: it.proposedFoodCost * ratio,
    }));
  };

  const recipeCost = (g: ProductGroup) => {
    const scaled = scaledIngredients(g);
    if (scaled.length === 0) return 0;
    return scaled.reduce(
      (acc, it) => acc + (Number(it.proposedFoodCost) || 0),
      0,
    );
  };

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    if (!q) return orders || [];
    return (orders || []).filter((o) => {
      const id = String(o.id || "").toLowerCase();
      const name = String(o.customerName || "").toLowerCase();
      return id.includes(q) || name.includes(q);
    });
  }, [orderSearch, orders]);

  const canSaveDraft =
    selectedOrderIds.length > 0 && !isSavingDraft && !isSubmitting;
  const canSubmit =
    selectedOrderIds.length > 0 &&
    !!productionDate &&
    productionTime.trim() !== "" &&
    !isSavingDraft &&
    !isSubmitting;

  const removeOrder = (orderId: string) => {
    setSelectedOrderIds((prev) => prev.filter((id) => id !== orderId));
    setDraftOrderIds((prev) => prev.filter((id) => id !== orderId));
  };

  const persistSchedule = async (args: {
    v1Status: "Draft" | "Submitted" | "Scheduled for Production";
    v2Status:
      | ProductionV2Status.ORDER_SELECTED
      | ProductionV2Status.INVENTORY_PENDING
      | ProductionV2Status.IN_PREPARATION;
    workflowPath: ProductionV2WorkflowPath | null;
    updateOrdersStatus: boolean;
  }) => {
    const api = (window as any).electronAPI;
    if (!api?.dbQuery || !selectedOutlet?.id) return;

    const now = new Date().toISOString();
    const productionId = crypto.randomUUID();
    const scheduleId = productionId;

    const productionDateIso = productionDate
      ? new Date(
          Date.UTC(
            productionDate.getFullYear(),
            productionDate.getMonth(),
            productionDate.getDate(),
            0,
            0,
            0,
            0,
          ),
        ).toISOString()
      : null;

    const safeV2Metadata = JSON.stringify({
      scheduleId,
      additionalInformation: additionalInfo.trim() || null,
      productionManager: productionManager || authUser?.name || "",
      orderIds: selectedOrderIds,
      v1Status: args.v1Status,
    });

    await api.dbQuery(
      `
        INSERT INTO productions (
          id,
          status,
          previousStatus,
          productionDate,
          additionalInformation,
          productionTime,
          initiator,
          cancelReason,
          batchId,
          scheduleId,
          createdAt,
          updatedAt,
          metadata,
          outletId,
          recordId,
          version,
          productionDueDate,
          productionManager
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        productionId,
        args.v1Status,
        null,
        productionDateIso,
        additionalInfo.trim() || null,
        productionTime.trim() || null,
        authUser?.name || "",
        null,
        batchId,
        scheduleId,
        now,
        now,
        null,
        selectedOutlet.id,
        null,
        1,
        productionDateIso,
        productionManager || authUser?.name || "",
      ],
    );

    await api.dbQuery(
      `
        INSERT INTO productions_v2 (
          id,
          status,
          previousStatus,
          workflowPath,
          recipeValidationStatus,
          recipeValidationStrategy,
          initiator,
          inventoryCheckedBy,
          inventoryApprovedBy,
          productionStartedBy,
          qcApprovedBy,
          inventoryCheckedAt,
          inventoryApprovedAt,
          preparationStartedAt,
          qcStartedAt,
          readyAt,
          cancelReason,
          metadata,
          createdAt,
          updatedAt,
          outletId,
          batchId,
          productionDate,
          productionTime,
          productionDueDate,
          recordId,
          version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        productionId,
        args.v2Status,
        null,
        args.workflowPath,
        null,
        null,
        authUser?.name || "",
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        safeV2Metadata,
        now,
        now,
        selectedOutlet.id,
        batchId,
        productionDateIso,
        productionTime.trim() || null,
        productionDateIso,
        null,
        1,
      ],
    );

    const productionItemsRecords: any[] = [];
    for (const orderId of selectedOrderIds) {
      const rec = {
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
        outletId: selectedOutlet.id,
        productionId,
        orderId,
        recordId: null,
        version: 1,
      };
      productionItemsRecords.push(rec);
      await api.dbQuery(
        `
          INSERT INTO production_items (
            id,
            createdAt,
            updatedAt,
            outletId,
            productionId,
            orderId,
            recordId,
            version
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          rec.id,
          rec.createdAt,
          rec.updatedAt,
          rec.outletId,
          rec.productionId,
          rec.orderId,
          rec.recordId,
          rec.version,
        ],
      );
    }

    const productionV2ItemsRecords: any[] = [];
    for (const g of productGroups || []) {
      const requestedQuantity = Number(g.quantityForProduction || 0);
      const finalQuantity = Number(g.finalQuantity || 0);
      const recipeId = g.recipe?.recipeId ? String(g.recipe.recipeId) : null;
      const totalPortions = Number(g.recipe?.totalPortions || 0);
      const batchSize = totalPortions > 0 ? String(totalPortions) : null;
      const batchesRequired =
        totalPortions > 0
          ? Math.max(
              1,
              Math.ceil(Math.max(0, requestedQuantity) / totalPortions),
            )
          : 1;

      const rec = {
        id: crypto.randomUUID(),
        requestedQuantity: Number.isFinite(requestedQuantity)
          ? requestedQuantity
          : 0,
        removedQuantity: 0,
        finalQuantity: Number.isFinite(finalQuantity) ? finalQuantity : 0,
        status: null,
        notes: null,
        createdAt: now,
        updatedAt: now,
        productionId,
        productId: String(g.productId),
        recipeId,
        batchSize,
        batchesRequired,
        recordId: null,
        version: 1,
      };

      productionV2ItemsRecords.push(rec);
      await api.dbQuery(
        `
          INSERT INTO production_v2_items (
            id,
            requestedQuantity,
            removedQuantity,
            finalQuantity,
            status,
            notes,
            createdAt,
            updatedAt,
            productionId,
            productId,
            recipeId,
            batchSize,
            batchesRequired,
            recordId,
            version
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          rec.id,
          rec.requestedQuantity,
          rec.removedQuantity,
          rec.finalQuantity,
          rec.status,
          rec.notes,
          rec.createdAt,
          rec.updatedAt,
          rec.productionId,
          rec.productId,
          rec.recipeId,
          rec.batchSize,
          rec.batchesRequired,
          rec.recordId,
          rec.version,
        ],
      );
    }

    if (args.updateOrdersStatus && selectedOrderIds.length > 0) {
      const placeholders = selectedOrderIds.map(() => "?").join(", ");
      await api.dbQuery(
        `
          UPDATE orders
          SET status = ?, updatedAt = ?
          WHERE outletId = ? AND id IN (${placeholders})
        `,
        [
          OrderStatus.SCHEDULED_FOR_PRODUCTION,
          now,
          selectedOutlet.id,
          ...selectedOrderIds,
        ],
      );
    }

    if (api.queueAdd) {
      const productionRow = await api.dbQuery(
        "SELECT * FROM productions WHERE id = ?",
        [productionId],
      );
      if (productionRow?.[0]) {
        await api.queueAdd({
          table: "productions",
          action: "CREATE",
          data: productionRow[0],
          id: productionId,
        });
      }
      const productionV2Row = await api.dbQuery(
        "SELECT * FROM productions_v2 WHERE id = ?",
        [productionId],
      );
      if (productionV2Row?.[0]) {
        await api.queueAdd({
          table: "productions_v2",
          action: "CREATE",
          data: productionV2Row[0],
          id: productionId,
        });
      }

      for (const row of productionItemsRecords) {
        await api.queueAdd({
          table: "production_items",
          action: "CREATE",
          data: row,
          id: row.id,
        });
      }

      for (const row of productionV2ItemsRecords) {
        await api.queueAdd({
          table: "production_v2_items",
          action: "CREATE",
          data: row,
          id: row.id,
        });
      }

      if (args.updateOrdersStatus && selectedOrderIds.length > 0) {
        const placeholders = selectedOrderIds.map(() => "?").join(", ");
        const updatedOrders = await api.dbQuery(
          `SELECT * FROM orders WHERE outletId = ? AND id IN (${placeholders})`,
          [selectedOutlet.id, ...selectedOrderIds],
        );
        for (const o of updatedOrders || []) {
          await api.queueAdd({
            table: "orders",
            action: "UPDATE",
            data: o,
            id: o.id,
          });
        }
      }
    }
  };

  const handleSaveDraft = async () => {
    if (!canSaveDraft) return;
    try {
      setIsSavingDraft(true);
      await persistSchedule({
        v1Status: "Draft",
        v2Status: ProductionV2Status.ORDER_SELECTED,
        workflowPath: null,
        updateOrdersStatus: false,
      });
      showToast("success", "Success", "Production schedule saved as draft");
      onCreated?.();
      onClose();
    } catch (err) {
      console.error("Failed to save production draft:", err);
      showToast("error", "Error", "Failed to save draft");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (isLoadingProducts) {
      showToast("error", "Error", "Please wait for order items to load");
      return;
    }
    const invalidQuantityNames = (productGroups || [])
      .filter((g) => {
        const requested = Number(g.quantityForProduction || 0);
        const finalQty = Number(g.finalQuantity || 0);
        return (
          !Number.isFinite(requested) ||
          requested <= 0 ||
          !Number.isFinite(finalQty) ||
          finalQty <= 0
        );
      })
      .map((g) => g.productName)
      .filter(Boolean);
    if (invalidQuantityNames.length > 0) {
      const unique = Array.from(new Set(invalidQuantityNames));
      const preview = unique.slice(0, 3).join(", ");
      const suffix = unique.length > 3 ? ` (+${unique.length - 3} more)` : "";
      showToast(
        "error",
        "Error",
        `Invalid production quantities for some items${preview ? `: ${preview}${suffix}` : ""}`,
      );
      return;
    }
    const productsMissingRecipe = (productGroups || [])
      .filter((g) => !g.recipe?.recipeId)
      .map((g) => g.productName)
      .filter(Boolean);
    if (productsMissingRecipe.length > 0) {
      const uniqueNames = Array.from(new Set(productsMissingRecipe));
      const preview = uniqueNames.slice(0, 3).join(", ");
      const suffix =
        uniqueNames.length > 3 ? ` (+${uniqueNames.length - 3} more)` : "";
      showToast(
        "error",
        "Error",
        `Recipe is missing for some production items${preview ? `: ${preview}${suffix}` : ""}`,
      );
      return;
    }
    const hasInventoryItems = (productGroups || []).some(
      (g) => (g.ingredients || []).length > 0,
    );
    if (!hasInventoryItems) {
      try {
        setIsSubmitting(true);
        await persistSchedule({
          v1Status: "Scheduled for Production",
          v2Status: ProductionV2Status.IN_PREPARATION,
          workflowPath: ProductionV2WorkflowPath.SKIP_INVENTORY,
          updateOrdersStatus: true,
        });
        showToast("success", "Success", "Production schedule created");
        onCreated?.();
        onClose();
      } catch (err) {
        console.error("Failed to submit production schedule:", err);
        showToast("error", "Error", "Failed to submit schedule");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    setIsSubmitDecisionOpen(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-150 bg-black/40 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-[840px] h-full bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-[24px] font-bold text-[#1C1B20]">
              Create New Production Schedule
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
          >
            <X className="size-6 text-[#737373]" />
          </button>
        </div>

        <div className="flex-1 px-6 py-5 overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            <h3 className="text-[16px] font-semibold text-[#1C1B20]">
              Order Details
            </h3>
            <div className="h-px w-full bg-gray-200" />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1C1B20]">
                Batch ID
              </label>
              <input
                type="text"
                value={batchId}
                readOnly
                className="w-full h-12 px-4 rounded-[8px] border border-gray-200 bg-[#F3F4F6] text-sm text-[#1C1B20] outline-none"
              />
              <div className="flex items-center gap-2 text-[12px] text-[#15BA5C]">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#15BA5C] text-[10px]">
                  i
                </span>
                <span>This ID is unique to this Production Schedule.</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1C1B20]">
                Production Manager
              </label>
              <input
                type="text"
                value={productionManager}
                readOnly
                className="w-full h-12 px-4 rounded-[8px] border border-gray-200 bg-[#F3F4F6] text-sm text-[#1C1B20] outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1C1B20]">
                Production Date<span className="text-red-500">*</span>
              </label>
              <DatePicker
                date={productionDate}
                onDateChange={setProductionDate}
                className="w-full h-12 rounded-[8px] justify-between flex-row-reverse"
                popoverClassName="z-[200]"
                placeholder="Select Date"
                disabledDates={disablePastDates}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1C1B20]">
                Production Time<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={productionTime}
                  onChange={(e) => setProductionTime(e.target.value)}
                  className="w-full h-12 px-4 pr-12 rounded-[8px] border border-gray-200 bg-white text-sm text-[#1C1B20] outline-none focus:border-[#15BA5C] transition-all"
                />
                <div className="pointer-events-none absolute right-0 top-0 h-12 w-12 flex items-center justify-center bg-[#E5E7EB] rounded-r-[8px]">
                  <Clock className="h-5 w-5 text-[#737373]" />
                </div>
              </div>
            </div>
          </div>

          <div className="my-8 border-t border-dashed border-gray-300" />

          <div className="flex items-center justify-between">
            <h3 className="text-[18px] font-semibold text-[#1C1B20]">
              Select Order
            </h3>
            <button
              type="button"
              className="h-11 px-5 bg-white border border-gray-200 rounded-[10px] text-[14px] font-medium text-[#4B5563] hover:bg-gray-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              Filters
              <SlidersHorizontal className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          <div className="mt-4 relative">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  onFocus={() => setIsOrderMenuOpen(true)}
                  placeholder="Search orders"
                  className="w-full h-12 pl-11 pr-4 rounded-[8px] border border-gray-200 bg-white outline-none focus:border-[#15BA5C] transition-all"
                />
              </div>
            </div>

            {isOrderMenuOpen ? (
              <div className="absolute left-0 mt-2 w-[420px] bg-[#0F0F12] border border-[#15BA5C] rounded-[12px] shadow-2xl overflow-hidden z-50">
                <div className="p-3 border-b border-white/10">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
                    <input
                      type="text"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      placeholder="Search order"
                      className="w-full h-10 pl-10 pr-8 rounded-[10px] bg-transparent border border-white/15 text-white outline-none focus:border-[#15BA5C]"
                    />
                    <button
                      type="button"
                      onClick={() => setOrderSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div className="max-h-[260px] overflow-y-auto custom-scrollbar">
                  {filteredOrders.slice(0, 20).map((o) => {
                    const checked =
                      draftOrderIds.includes(o.id) ||
                      selectedOrderIds.includes(o.id);
                    return (
                      <label
                        key={o.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="accent-[#15BA5C]"
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked;
                            setDraftOrderIds((prev) => {
                              const base = new Set(prev);
                              if (next) base.add(o.id);
                              else base.delete(o.id);
                              return Array.from(base);
                            });
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-white font-medium">
                              {o.reference}
                            </span>
                            <span className="text-white/70 text-sm truncate">
                              {o.customerName || ""}
                            </span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="p-3">
                  <button
                    type="button"
                    onClick={() => {
                      const merged = new Set([
                        ...selectedOrderIds,
                        ...draftOrderIds,
                      ]);
                      setSelectedOrderIds(Array.from(merged));
                      setDraftOrderIds([]);
                      setIsOrderMenuOpen(false);
                    }}
                    className="w-full h-11 rounded-[10px] bg-[#15BA5C] text-white font-medium hover:bg-[#119E4D] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="text-lg leading-none">+</span>
                    Add Order
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {selectedOrderIds.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-3">
              {selectedOrderIds.map((id) => (
                <div
                  key={id}
                  className="inline-flex items-center gap-3 border border-[#15BA5C] rounded-[10px] px-4 py-2 text-[#15BA5C] bg-white"
                >
                  <span className="font-medium">
                    {ordersById.get(id)?.externalReference ||
                      ordersById.get(id)?.reference ||
                      id}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeOrder(id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          {selectedOrderIds.length > 0 ? (
            <div className="mt-5 rounded-[10px] border border-gray-200 bg-[#FAFAFC] px-5 py-4 flex items-center justify-between">
              <span className="text-[#1C1B20] font-medium">
                Order Sum total
              </span>
              <span className="text-[#1C1B20] font-semibold">
                {formatMoney(subTotal)}
              </span>
            </div>
          ) : null}

          <div className="my-8 border-t border-dashed border-gray-300" />

          {selectedOrderIds.length > 0 ? (
            <div className="space-y-4">
              {isLoadingProducts ? (
                <div className="rounded-[10px] border border-gray-200 bg-white p-6 text-sm text-gray-500">
                  Loading order items...
                </div>
              ) : productGroups.length === 0 ? (
                <div className="rounded-[10px] border border-gray-200 bg-white p-6 text-sm text-gray-500">
                  No items found for the selected order(s).
                </div>
              ) : (
                productGroups.map((g) => {
                  const scaled = scaledIngredients(g);
                  const total = recipeCost(g);
                  return (
                    <div
                      key={g.productId}
                      className="border-t border-dashed border-gray-300 pt-6"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          updateGroup(g.productId, { isOpen: !g.isOpen })
                        }
                        className="w-full flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-[#E8F7EF] flex items-center justify-center">
                            <Package className="h-4 w-4 text-[#15BA5C]" />
                          </div>
                          <h4 className="text-[20px] font-bold text-[#1C1B20]">
                            {g.productName}
                          </h4>
                        </div>
                        {g.isOpen ? (
                          <ChevronUp className="h-5 w-5 text-[#111827]" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-[#111827]" />
                        )}
                      </button>

                      <div className="mt-5 grid grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm text-[#6B7280]">
                            Confirmed order Quantity
                          </label>
                          <input
                            type="text"
                            value={String(g.confirmedQty)}
                            readOnly
                            className="w-full h-12 px-4 rounded-[10px] border border-gray-200 bg-[#F3F4F6] text-sm text-[#111827] outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm text-[#6B7280]">
                            Quantity for Production
                          </label>
                          <input
                            type="text"
                            value={g.quantityForProduction}
                            onChange={(e) =>
                              updateGroup(g.productId, {
                                quantityForProduction: sanitizeNumber(
                                  e.target.value,
                                ),
                              })
                            }
                            className="w-full h-12 px-4 rounded-[10px] border border-gray-200 bg-white text-sm text-[#111827] outline-none focus:border-[#15BA5C] transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm text-[#6B7280]">
                            Final Quantity
                          </label>
                          <input
                            type="text"
                            value={g.finalQuantity}
                            onChange={(e) =>
                              updateGroup(g.productId, {
                                finalQuantity: sanitizeNumber(e.target.value),
                              })
                            }
                            className="w-full h-12 px-4 rounded-[10px] border border-gray-200 bg-white text-sm text-[#111827] outline-none focus:border-[#15BA5C] transition-all"
                          />
                        </div>
                      </div>

                      {g.isOpen ? (
                        <div className="mt-6 rounded-[12px] border border-gray-200 overflow-hidden bg-white">
                          <div className="grid grid-cols-3 bg-[#F9FAFB] px-6 py-4 text-sm text-[#6B7280]">
                            <div>Item</div>
                            <div className="text-center">Quantity</div>
                            <div className="text-right">Total Cost</div>
                          </div>
                          <div className="divide-y divide-gray-100">
                            {scaled.length > 0 ? (
                              <>
                                {scaled.map((it, idx) => (
                                  <div
                                    key={`${g.productId}-${idx}`}
                                    className="grid grid-cols-3 px-6 py-4 text-sm text-[#111827]"
                                  >
                                    <div className="font-medium">
                                      {it.itemName}
                                    </div>
                                    <div className="text-center">
                                      {Number(it.quantity || 0).toLocaleString(
                                        undefined,
                                        {
                                          maximumFractionDigits: 2,
                                        },
                                      )}{" "}
                                      {it.unitOfMeasure}
                                    </div>
                                    <div className="text-right">
                                      {formatMoney(
                                        Number(it.proposedFoodCost || 0),
                                      )}
                                    </div>
                                  </div>
                                ))}
                                <div className="grid grid-cols-3 px-6 py-4 text-sm font-bold text-[#111827]">
                                  <div className="uppercase">
                                    Total Recipe Cost
                                  </div>
                                  <div />
                                  <div className="text-right">
                                    {formatMoney(total)}
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="px-6 py-6 text-sm text-gray-500">
                                No recipe items found for this product.
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          ) : null}

          <div className="space-y-2">
            <h3 className="text-[16px] font-semibold text-[#1C1B20]">
              Additional Information{" "}
              <span className="italic text-sm font-normal">(optional)</span>
            </h3>
            <textarea
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Leave additional notes"
              className="w-full min-h-[120px] p-4 rounded-[10px] border border-gray-200 outline-none focus:border-[#15BA5C] transition-all"
            />
          </div>
        </div>

        <div className="px-6 py-5 border-t border-gray-100 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            className="h-12 px-10 rounded-[12px] border border-[#15BA5C] text-[#15BA5C] font-semibold hover:bg-green-50 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!canSaveDraft}
            onClick={handleSaveDraft}
            className={`h-12 px-10 rounded-[12px] font-semibold transition-colors ${
              canSaveDraft
                ? "bg-[#E5E7EB] text-[#1C1B20] hover:bg-gray-200"
                : "bg-[#E5E7EB] text-gray-400 cursor-not-allowed"
            }`}
          >
            {isSavingDraft ? "Saving..." : "Save Draft"}
          </button>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className={`h-12 px-10 rounded-[12px] font-semibold transition-colors ${
              canSubmit
                ? "bg-[#15BA5C] text-white hover:bg-[#119E4D]"
                : "bg-[#15BA5C]/40 text-white cursor-not-allowed"
            }`}
          >
            {isSubmitting ? "Submitting..." : "Submit Schedule"}
          </button>
        </div>
      </div>

      {isSubmitDecisionOpen ? (
        <div className="fixed inset-0 z-[250] bg-black/40 backdrop-blur-sm flex items-center justify-center px-6">
          <div className="relative w-full max-w-[580px] rounded-[18px] bg-white shadow-2xl px-10 py-12">
            <button
              type="button"
              onClick={() => setIsSubmitDecisionOpen(false)}
              disabled={isSubmitting}
              className="absolute top-6 right-6 h-11 w-11 rounded-full bg-white  flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Close"
            >
              <X className="h-6 w-6 text-[#EF4444]" />
            </button>

            <div className="flex flex-col items-center">
              <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-7 w-7 text-[#EF4444]" />
                </div>
              </div>

              <div className="mt-8 text-center">
                <div className="text-[25px] font-bold text-[#111827]">
                  Submit to Inventory Manager
                </div>
                <div className="mt-3 text-[15px] text-gray-500 max-w-[620px]">
                  This Order has Inventory Items, would you like to submit to
                  the inventory manager
                </div>
              </div>

              <div className="mt-10 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={async () => {
                    try {
                      setIsSubmitting(true);
                      await persistSchedule({
                        v1Status: "Submitted",
                        v2Status: ProductionV2Status.INVENTORY_PENDING,
                        workflowPath: ProductionV2WorkflowPath.INVENTORY_FLOW,
                        updateOrdersStatus: true,
                      });
                      showToast(
                        "success",
                        "Success",
                        "Production schedule submitted to inventory manager",
                      );
                      setIsSubmitDecisionOpen(false);
                      onCreated?.();
                      onClose();
                    } catch (err) {
                      console.error(
                        "Failed to submit production schedule:",
                        err,
                      );
                      showToast("error", "Error", "Failed to submit schedule");
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className="h-14 w-full rounded-[12px] bg-[#15BA5C] text-white font-semibold text-[16px] hover:bg-[#119E4D] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Yes, Submit
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={async () => {
                    const api = (window as any).electronAPI;
                    if (!api?.dbQuery || !selectedOutlet?.id) return;

                    const requiredByKey = new Map<
                      string,
                      {
                        itemId: string | null;
                        itemName: string;
                        unitOfMeasure: string;
                        requiredQty: number;
                      }
                    >();

                    for (const g of productGroups || []) {
                      const scaled = scaledIngredients(g);
                      for (const it of scaled) {
                        const requiredQty = Number(it.quantity || 0);
                        if (!Number.isFinite(requiredQty) || requiredQty <= 0)
                          continue;
                        const itemId = it.itemId ? String(it.itemId) : null;
                        const itemName = String(it.itemName || "").trim();
                        const key = itemId
                          ? `id:${itemId}`
                          : `name:${itemName}`;
                        if (!key || key === "name:") continue;
                        const prev = requiredByKey.get(key);
                        requiredByKey.set(key, {
                          itemId,
                          itemName,
                          unitOfMeasure: String(it.unitOfMeasure || ""),
                          requiredQty:
                            (prev?.requiredQty || 0) + (requiredQty || 0),
                        });
                      }
                    }

                    const requiredList = Array.from(requiredByKey.values());
                    if (requiredList.length === 0) {
                      try {
                        setIsSubmitting(true);
                        await persistSchedule({
                          v1Status: "Scheduled for Production",
                          v2Status: ProductionV2Status.IN_PREPARATION,
                          workflowPath: ProductionV2WorkflowPath.SKIP_INVENTORY,
                          updateOrdersStatus: true,
                        });
                        showToast(
                          "success",
                          "Success",
                          "Production schedule created",
                        );
                        setIsSubmitDecisionOpen(false);
                        onCreated?.();
                        onClose();
                      } catch (err) {
                        console.error(
                          "Failed to submit production schedule:",
                          err,
                        );
                        showToast(
                          "error",
                          "Error",
                          "Failed to submit schedule",
                        );
                      } finally {
                        setIsSubmitting(false);
                      }
                      return;
                    }

                    const itemIds = requiredList
                      .map((r) => r.itemId)
                      .filter(Boolean) as string[];
                    const itemNames = requiredList
                      .filter((r) => !r.itemId && r.itemName)
                      .map((r) => r.itemName);

                    const stockByItemId = new Map<string, number>();
                    const stockByItemName = new Map<string, number>();

                    try {
                      if (itemIds.length > 0) {
                        const placeholders = itemIds.map(() => "?").join(", ");
                        const rows = await api.dbQuery(
                          `
                            SELECT
                              ii.id as itemId,
                              COALESCE(ii.currentStockLevel, 0) as currentStockLevel,
                              COALESCE(im.name, '') as itemName
                            FROM inventory_item ii
                            JOIN inventory i ON ii.inventoryId = i.id
                            JOIN item_master im ON ii.itemMasterId = im.id
                            WHERE i.outletId = ? AND ii.isDeleted = 0
                              AND ii.id IN (${placeholders})
                          `,
                          [selectedOutlet.id, ...itemIds],
                        );
                        (rows || []).forEach((r: any) => {
                          const id = r?.itemId ? String(r.itemId) : "";
                          if (id)
                            stockByItemId.set(
                              id,
                              Number(r.currentStockLevel || 0),
                            );
                          const name = String(r.itemName || "").trim();
                          if (name)
                            stockByItemName.set(
                              name,
                              Number(r.currentStockLevel || 0),
                            );
                        });
                      }

                      if (itemNames.length > 0) {
                        const placeholders = itemNames
                          .map(() => "?")
                          .join(", ");
                        const rows = await api.dbQuery(
                          `
                            SELECT
                              COALESCE(ii.currentStockLevel, 0) as currentStockLevel,
                              COALESCE(im.name, '') as itemName
                            FROM inventory_item ii
                            JOIN inventory i ON ii.inventoryId = i.id
                            JOIN item_master im ON ii.itemMasterId = im.id
                            WHERE i.outletId = ? AND ii.isDeleted = 0
                              AND im.name IN (${placeholders})
                          `,
                          [selectedOutlet.id, ...itemNames],
                        );
                        (rows || []).forEach((r: any) => {
                          const name = String(r.itemName || "").trim();
                          if (name)
                            stockByItemName.set(
                              name,
                              Number(r.currentStockLevel || 0),
                            );
                        });
                      }
                    } catch (err) {
                      console.error("Failed to validate inventory:", err);
                      showToast(
                        "error",
                        "Error",
                        "Failed to validate inventory items",
                      );
                      return;
                    }

                    const insufficient: string[] = [];
                    const missing: string[] = [];

                    for (const req of requiredList) {
                      const requiredQty = Number(req.requiredQty || 0);
                      const availableQty = req.itemId
                        ? Number(stockByItemId.get(req.itemId) || 0)
                        : Number(stockByItemName.get(req.itemName) || 0);

                      if (
                        (req.itemId && !stockByItemId.has(req.itemId)) ||
                        (!req.itemId && !stockByItemName.has(req.itemName))
                      ) {
                        missing.push(req.itemName || "Item");
                        continue;
                      }

                      if (availableQty < requiredQty) {
                        insufficient.push(req.itemName || "Item");
                      }
                    }

                    if (missing.length > 0) {
                      const unique = Array.from(new Set(missing));
                      const preview = unique.slice(0, 3).join(", ");
                      const suffix =
                        unique.length > 3
                          ? ` (+${unique.length - 3} more)`
                          : "";
                      showToast(
                        "error",
                        "Error",
                        `Inventory item not found for some recipe items${preview ? `: ${preview}${suffix}` : ""}`,
                      );
                      return;
                    }

                    if (insufficient.length > 0) {
                      const unique = Array.from(new Set(insufficient));
                      const preview = unique.slice(0, 3).join(", ");
                      const suffix =
                        unique.length > 3
                          ? ` (+${unique.length - 3} more)`
                          : "";
                      showToast(
                        "error",
                        "Error",
                        `Insufficient inventory for some recipe items${preview ? `: ${preview}${suffix}` : ""}`,
                      );
                      return;
                    }

                    try {
                      setIsSubmitting(true);
                      await persistSchedule({
                        v1Status: "Scheduled for Production",
                        v2Status: ProductionV2Status.IN_PREPARATION,
                        workflowPath: ProductionV2WorkflowPath.SKIP_INVENTORY,
                        updateOrdersStatus: true,
                      });
                      showToast(
                        "success",
                        "Success",
                        "Production schedule created",
                      );
                      setIsSubmitDecisionOpen(false);
                      onCreated?.();
                      onClose();
                    } catch (err) {
                      console.error(
                        "Failed to submit production schedule:",
                        err,
                      );
                      showToast("error", "Error", "Failed to submit schedule");
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className="h-14 w-full rounded-[12px] bg-[#E5E7EB] text-[#111827] font-semibold text-[16px] hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  No, schedule for production
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CreateProductionSchedule;
