"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  Clock,
  Copy,
  Loader2,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  format,
  formatDistanceToNowStrict,
  isToday,
  isYesterday,
} from "date-fns";
import ImageHandler from "@/shared/Image/ImageHandler";
import useBusinessStore from "@/stores/useBusinessStore";
import { useAuthStore } from "@/stores/authStore";
import useToastStore from "@/stores/toastStore";
import { getCurrencySymbol } from "@/utils/getCurrencySymbol";

type InventoryPick = {
  inventoryItemId: string;
  itemName: string;
  itemCode: string | null;
  costPrice: number;
};

type SelectedComponentItem = {
  componentItemId?: string;
  inventoryItemId: string;
  itemName: string;
  quantity: string;
  costPrice: number;
  wastePercent: string;
  critical: boolean;
  required: boolean;
};

interface ViewAndEditComponentProps {
  isOpen: boolean;
  componentId: string | null;
  onClose: () => void;
  onUpdated?: () => void;
}

const sanitizeNumber = (value: string) => value.replace(/[^0-9.]/g, "");

const normalizeSteps = (raw: string) => {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^\d+\.\s*/, "").replace(/^[\-\*]\s*/, ""));

  return lines.map((l, idx) => `${idx + 1}. ${l}`).join("\n");
};

const ViewAndEditComponent = ({
  isOpen,
  componentId,
  onClose,
  onUpdated,
}: ViewAndEditComponentProps) => {
  const { selectedOutlet } = useBusinessStore();
  const authUser = useAuthStore((s) => s.user);
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

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdateConfirmOpen, setIsUpdateConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [inventoryOptions, setInventoryOptions] = useState<InventoryPick[]>([]);

  const [meta, setMeta] = useState<{
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string | null;
    updatedBy?: string | null;
  }>({});

  const [formData, setFormData] = useState({
    name: "",
    reference: "",
    description: "",
    steps: "",
    imageUrl: "",
  });

  const [selectedItems, setSelectedItems] = useState<SelectedComponentItem[]>(
    [],
  );

  const updatedAtText = useMemo(() => {
    if (!meta.updatedAt) return "";
    const d = new Date(meta.updatedAt);
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return formatDistanceToNowStrict(d);
  }, [meta.updatedAt]);

  const createdAtText = meta.createdAt
    ? format(new Date(meta.createdAt), "MMMM do, yyyy")
    : "";

  const totalCost = useMemo(() => {
    return selectedItems.reduce((acc, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const waste = parseFloat(item.wastePercent) || 0;
      const multiplier = 1 + waste / 100;
      return acc + qty * (item.costPrice || 0) * multiplier;
    }, 0);
  }, [selectedItems]);

  const canSave =
    !isSaving &&
    formData.name.trim() !== "" &&
    selectedItems.length > 0 &&
    selectedItems.every((i) => (parseFloat(i.quantity) || 0) > 0);

  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return [];
    return inventoryOptions
      .filter((it) => {
        const name = (it.itemName || "").toLowerCase();
        const code = (it.itemCode || "").toLowerCase();
        return name.includes(q) || code.includes(q);
      })
      .slice(0, 8);
  }, [inventoryOptions, searchTerm]);

  const addItem = (it: InventoryPick) => {
    setSelectedItems((prev) => {
      if (prev.some((p) => p.inventoryItemId === it.inventoryItemId))
        return prev;
      return [
        ...prev,
        {
          inventoryItemId: it.inventoryItemId,
          itemName: it.itemName,
          quantity: "1",
          costPrice: it.costPrice,
          wastePercent: "0",
          critical: false,
          required: false,
        },
      ];
    });
    setSearchTerm("");
  };

  const updateSelectedItem = (
    inventoryItemId: string,
    patch: Partial<SelectedComponentItem>,
  ) => {
    setSelectedItems((prev) =>
      prev.map((it) =>
        it.inventoryItemId === inventoryItemId ? { ...it, ...patch } : it,
      ),
    );
  };

  const removeItem = (inventoryItemId: string) => {
    setSelectedItems((prev) =>
      prev.filter((it) => it.inventoryItemId !== inventoryItemId),
    );
  };

  useEffect(() => {
    if (!isOpen) return;
    const api = (window as any).electronAPI;
    if (!api?.dbQuery || !selectedOutlet?.id) return;

    (async () => {
      try {
        const sql = `
          SELECT
            ii.id as inventoryItemId,
            im.name as itemName,
            im.itemCode as itemCode,
            COALESCE(ii.costPrice, 0) as costPrice
          FROM inventory_item ii
          JOIN inventory i ON ii.inventoryId = i.id
          JOIN item_master im ON ii.itemMasterId = im.id
          WHERE i.outletId = ? AND ii.isDeleted = 0
          ORDER BY im.name ASC
        `;
        const rows = await api.dbQuery(sql, [selectedOutlet.id]);
        setInventoryOptions(
          (rows || []).map((r: any) => ({
            inventoryItemId: r.inventoryItemId,
            itemName: r.itemName,
            itemCode: r.itemCode,
            costPrice: parseFloat(r.costPrice || 0),
          })),
        );
      } catch (err) {
        console.error("Failed to load inventory items:", err);
      }
    })();
  }, [isOpen, selectedOutlet?.id]);

  useEffect(() => {
    if (!isOpen || !componentId) return;
    const api = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    setIsLoading(true);
    (async () => {
      try {
        const compRows = await api.dbQuery(
          "SELECT * FROM components WHERE id = ? AND deletedAt IS NULL LIMIT 1",
          [componentId],
        );
        const c = compRows?.[0];
        if (!c) return;

        const itemsRows = await api.dbQuery(
          `
            SELECT
              ci.*,
              im.name as itemName,
              COALESCE(ii.costPrice, 0) as costPrice
            FROM component_items ci
            LEFT JOIN inventory_item ii ON ii.id = ci.itemId
            LEFT JOIN item_master im ON im.id = ii.itemMasterId
            WHERE ci.componentId = ? AND ci.deletedAt IS NULL
            ORDER BY ci.createdAt ASC
          `,
          [componentId],
        );

        setMeta({
          createdAt: c.createdAt,
          updatedAt: c.updatedAt || c.createdAt,
          createdBy: c.createdBy ?? null,
          updatedBy: c.updatedBy ?? null,
        });

        setFormData({
          name: c.name || "",
          reference: c.reference || "",
          description: c.description || "",
          steps: c.howToCreate || "",
          imageUrl: c.image || "",
        });

        setSelectedItems(
          (itemsRows || []).map((r: any) => ({
            componentItemId: r.id,
            inventoryItemId: r.itemId,
            itemName: r.itemName || "Item",
            quantity: String(parseFloat(r.quantity || 0) || 0),
            costPrice: parseFloat(r.costPrice || 0),
            wastePercent: String((parseFloat(r.adjustWaste || 0) || 0) * 100),
            critical: Boolean(r.isCritical),
            required: Boolean(r.isRequired),
          })),
        );
      } catch (err) {
        console.error("Failed to load component:", err);
        showToast("error", "Error", "Failed to load component");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isOpen, componentId]);

  const handleUpdate = async () => {
    if (!componentId) return;
    if (!canSave) return;
    const api = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const howToCreate = normalizeSteps(formData.steps);

      await api.dbQuery(
        `
          UPDATE components
          SET
            name = ?,
            reference = ?,
            description = ?,
            howToCreate = ?,
            image = ?,
            updatedAt = ?,
            updatedBy = ?,
            version = COALESCE(version, 0) + 1
          WHERE id = ?
        `,
        [
          formData.name.trim(),
          formData.reference.trim(),
          formData.description.trim() || null,
          howToCreate || null,
          formData.imageUrl || null,
          now,
          authUser?.name || meta.updatedBy || "",
          componentId,
        ],
      );

      const existingRows = await api.dbQuery(
        "SELECT id, itemId FROM component_items WHERE componentId = ? AND deletedAt IS NULL",
        [componentId],
      );
      const existingByItemId = new Map<string, string>();
      (existingRows || []).forEach((r: any) => {
        if (r.itemId) existingByItemId.set(r.itemId, r.id);
      });

      const nextItemIds = new Set(selectedItems.map((s) => s.inventoryItemId));

      for (const r of existingRows || []) {
        if (!r.itemId) continue;
        if (nextItemIds.has(r.itemId)) continue;
        await api.dbQuery(
          `
            UPDATE component_items
            SET deletedAt = ?, updatedAt = ?, version = COALESCE(version, 0) + 1
            WHERE id = ?
          `,
          [now, now, r.id],
        );
      }

      for (const item of selectedItems) {
        const qty = parseFloat(item.quantity) || 0;
        const waste = parseFloat(item.wastePercent) || 0;
        const adjustWaste = waste / 100;
        const total = qty * (item.costPrice || 0) * (1 + adjustWaste);

        const existingId = existingByItemId.get(item.inventoryItemId);
        if (existingId) {
          await api.dbQuery(
            `
              UPDATE component_items
              SET
                quantity = ?,
                adjustWaste = ?,
                isCritical = ?,
                isRequired = ?,
                costPrice = ?,
                totalCost = ?,
                updatedAt = ?,
                version = COALESCE(version, 0) + 1
              WHERE id = ?
            `,
            [
              qty,
              adjustWaste,
              item.critical ? 1 : 0,
              item.required ? 1 : 0,
              item.costPrice || 0,
              total,
              now,
              existingId,
            ],
          );
        } else {
          await api.dbQuery(
            `
              INSERT INTO component_items (
                id, quantity, adjustWaste, isCritical, isRequired, costPrice, totalCost,
                createdAt, updatedAt, deletedAt, componentId, componentItemLotId, itemId, recordId, version
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
              crypto.randomUUID(),
              qty,
              adjustWaste,
              item.critical ? 1 : 0,
              item.required ? 1 : 0,
              item.costPrice || 0,
              total,
              now,
              now,
              null,
              componentId,
              null,
              item.inventoryItemId,
              null,
              1,
            ],
          );
        }
      }

      if (api.queueAdd) {
        const componentRow = await api.dbQuery(
          "SELECT * FROM components WHERE id = ?",
          [componentId],
        );
        if (componentRow?.[0]) {
          await api.queueAdd({
            table: "components",
            action: "UPDATE",
            data: componentRow[0],
            id: componentId,
          });
        }

        const compItems = await api.dbQuery(
          "SELECT * FROM component_items WHERE componentId = ?",
          [componentId],
        );
        for (const row of compItems || []) {
          await api.queueAdd({
            table: "component_items",
            action: row.deletedAt ? "DELETE" : "UPDATE",
            data: row,
            id: row.id,
          });
        }
      }

      showToast("success", "Success", "Component updated successfully");
      onUpdated?.();
      onClose();
    } catch (err) {
      console.error("Failed to update component:", err);
      showToast("error", "Error", "Failed to update component");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!componentId) return;
    const api = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    setIsDeleting(true);
    try {
      const now = new Date().toISOString();

      await api.dbQuery(
        `
          UPDATE components
          SET deletedAt = ?, updatedAt = ?, updatedBy = ?, version = COALESCE(version, 0) + 1
          WHERE id = ?
        `,
        [now, now, authUser?.name || meta.updatedBy || "", componentId],
      );

      await api.dbQuery(
        `
          UPDATE component_items
          SET deletedAt = ?, updatedAt = ?, version = COALESCE(version, 0) + 1
          WHERE componentId = ? AND deletedAt IS NULL
        `,
        [now, now, componentId],
      );

      if (api.queueAdd) {
        const componentRow = await api.dbQuery(
          "SELECT * FROM components WHERE id = ?",
          [componentId],
        );
        if (componentRow?.[0]) {
          await api.queueAdd({
            table: "components",
            action: "DELETE",
            data: componentRow[0],
            id: componentId,
          });
        }

        const compItems = await api.dbQuery(
          "SELECT * FROM component_items WHERE componentId = ?",
          [componentId],
        );
        for (const row of compItems || []) {
          await api.queueAdd({
            table: "component_items",
            action: "DELETE",
            data: row,
            id: row.id,
          });
        }
      }

      showToast("success", "Success", "Component deleted successfully");
      onUpdated?.();
      onClose();
    } catch (err) {
      console.error("Failed to delete component:", err);
      showToast("error", "Error", "Failed to delete component");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-150 bg-black/40 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-[840px] h-full bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
        <div className="px-8 py-6 border-b border-gray-100">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <h2 className="text-[24px] leading-tight font-bold text-[#1C1B20] truncate">
                {formData.name || "Component"}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px] text-[#6B7280]">
                {updatedAtText ? (
                  <div className="flex items-center gap-2">
                    <Clock className="size-5 text-[#15BA5C]" />
                    <span>
                      Last Updated {updatedAtText}
                      {meta.updatedBy || meta.createdBy
                        ? ` by ${meta.updatedBy || meta.createdBy}`
                        : ""}
                    </span>
                  </div>
                ) : null}
                {createdAtText ? (
                  <div className="flex items-center gap-2">
                    <Calendar className="size-5 text-[#15BA5C]" />
                    <span>Created on {createdAtText}</span>
                  </div>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
            >
              <X className="size-6 text-[#737373]" />
            </button>
          </div>
        </div>

        <div className="flex-1 p-8 space-y-8 overflow-y-auto custom-scrollbar bg-white">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Component Name<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="Enter Component name"
                    className="w-full h-11 px-4 bg-[#F9FAFB] border border-gray-200 rounded-lg outline-none focus:border-[#15BA5C] transition-all text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Component Code<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.reference}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          reference: e.target.value,
                        }))
                      }
                      className="w-full h-11 px-4 bg-[#F1F3F5] border border-gray-200 rounded-lg outline-none text-sm text-gray-700"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(formData.reference || "");
                        showToast("success", "Copied", "Component code copied");
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <Copy className="size-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Component Description
                </label>
                <textarea
                  placeholder="Enter description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, description: e.target.value }))
                  }
                  className="w-full h-24 p-4 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#15BA5C] transition-all text-sm resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Steps to Create this component
                </label>
                <textarea
                  placeholder={"1. Wash your pot\n2. Stir and fry your plate"}
                  value={formData.steps}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, steps: e.target.value }))
                  }
                  onBlur={() =>
                    setFormData((p) => ({
                      ...p,
                      steps: normalizeSteps(p.steps),
                    }))
                  }
                  className="w-full h-24 p-4 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#15BA5C] transition-all text-sm resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Search Items to use
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search for an Item"
                    className="flex-1 h-11 px-4 bg-white border border-gray-200 rounded-l-lg outline-none focus:border-[#15BA5C] transition-all text-sm"
                  />
                  <button
                    type="button"
                    className="h-11 px-4 bg-[#15BA5C] text-white rounded-r-lg hover:bg-[#119E4D] transition-colors"
                  >
                    <Search className="size-5" />
                  </button>
                </div>
                {filteredItems.length > 0 ? (
                  <div className="border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                    {filteredItems.map((it) => (
                      <button
                        key={it.inventoryItemId}
                        type="button"
                        onClick={() => addItem(it)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                      >
                        <span className="text-sm font-medium text-gray-900">
                          {it.itemName}
                        </span>
                        <span className="text-xs text-gray-400">
                          {it.itemCode || ""}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="overflow-x-auto border border-gray-100 rounded-lg custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead className="bg-[#F9FAFB]">
                    <tr>
                      <th className="px-3 py-3 text-[10px] font-bold text-gray-500 uppercase whitespace-nowrap">
                        Item
                      </th>
                      <th className="px-3 py-3 text-[10px] font-bold text-gray-500 uppercase whitespace-nowrap">
                        Quantity
                      </th>
                      <th className="px-3 py-3 text-[10px] font-bold text-gray-500 uppercase text-center whitespace-nowrap">
                        Cost Per Unit Item
                      </th>
                      <th className="px-3 py-3 text-[10px] font-bold text-gray-500 uppercase text-center whitespace-nowrap">
                        Adjust waste (%)
                      </th>
                      <th className="px-3 py-3 text-[10px] font-bold text-gray-500 uppercase text-center whitespace-nowrap">
                        Critical
                      </th>
                      <th className="px-3 py-3 text-[10px] font-bold text-gray-500 uppercase text-center whitespace-nowrap">
                        Required
                      </th>
                      <th className="px-3 py-3 text-[10px] font-bold text-gray-500 uppercase text-center whitespace-nowrap">
                        total cost per item
                      </th>
                      <th className="px-3 py-3 text-[10px] font-bold text-gray-500 uppercase text-center whitespace-nowrap">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {selectedItems.length > 0 ? (
                      selectedItems.map((item) => (
                        <tr
                          key={item.inventoryItemId}
                          className="text-sm text-gray-700"
                        >
                          <td className="px-3 py-3 font-medium whitespace-nowrap">
                            {item.itemName}
                          </td>
                          <td className="px-3 py-3">
                            <input
                              type="text"
                              value={item.quantity}
                              onChange={(e) =>
                                updateSelectedItem(item.inventoryItemId, {
                                  quantity: sanitizeNumber(e.target.value),
                                })
                              }
                              className="w-16 h-8 px-2 border border-gray-200 rounded-lg outline-none text-center text-xs"
                            />
                          </td>
                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            {formatMoney(item.costPrice || 0)}
                          </td>
                          <td className="px-3 py-3">
                            <input
                              type="text"
                              value={item.wastePercent}
                              onChange={(e) =>
                                updateSelectedItem(item.inventoryItemId, {
                                  wastePercent: sanitizeNumber(e.target.value),
                                })
                              }
                              className="w-16 h-8 px-2 mx-auto block border border-gray-200 rounded-lg outline-none text-center text-xs"
                            />
                          </td>
                          <td className="px-3 py-3">
                            <div
                              onClick={() =>
                                updateSelectedItem(item.inventoryItemId, {
                                  critical: !item.critical,
                                })
                              }
                              className={`w-8 h-4 mx-auto rounded-full relative cursor-pointer transition-colors ${item.critical ? "bg-[#15BA5C]" : "bg-gray-200"}`}
                            >
                              <div
                                className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${item.critical ? "right-0.5" : "left-0.5"}`}
                              />
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div
                              onClick={() =>
                                updateSelectedItem(item.inventoryItemId, {
                                  required: !item.required,
                                })
                              }
                              className={`w-8 h-4 mx-auto rounded-full relative cursor-pointer transition-colors ${item.required ? "bg-[#15BA5C]" : "bg-gray-200"}`}
                            >
                              <div
                                className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${item.required ? "right-0.5" : "left-0.5"}`}
                              />
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center font-medium whitespace-nowrap">
                            {formatMoney(
                              (parseFloat(item.quantity) || 0) *
                                (item.costPrice || 0) *
                                (1 +
                                  (parseFloat(item.wastePercent) || 0) / 100),
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <button
                              type="button"
                              onClick={() => removeItem(item.inventoryItemId)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors mx-auto block"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-4 py-12">
                          <div className="flex flex-col items-center justify-center text-center space-y-2">
                            <div className="p-3 bg-gray-50 rounded-full">
                              <Search className="size-6 text-gray-300" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                No items added
                              </p>
                              <p className="text-xs text-gray-500">
                                Search for items above to add them to this
                                component
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between px-6 py-4 bg-[#F9FAFB] rounded-lg border border-gray-100">
                <span className="font-semibold text-gray-900">Total Cost</span>
                <div className="bg-[#E9ECEF] px-8 py-2 rounded-lg font-bold text-gray-900">
                  {formatMoney(totalCost)}
                </div>
              </div>

              <div className="space-y-3">
                <ImageHandler
                  value={formData.imageUrl}
                  onChange={({ url }) =>
                    setFormData({ ...formData, imageUrl: url })
                  }
                  label="Upload Media"
                  className="w-full"
                />
              </div>

              <div className="flex w-full gap-4">
                <button
                  type="button"
                  disabled={!canSave || isSaving || isDeleting}
                  onClick={() => setIsUpdateConfirmOpen(true)}
                  className={`w-full h-12 font-bold rounded-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 ${
                    canSave && !isSaving && !isDeleting
                      ? "bg-[#15BA5C] text-white hover:bg-[#119E4D] cursor-pointer"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {isSaving ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    "Update Component"
                  )}
                </button>

                <button
                  type="button"
                  disabled={isSaving || isDeleting}
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className={`w-full h-12 font-bold rounded-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 border ${
                    isSaving || isDeleting
                      ? "bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed"
                      : "bg-white text-red-500 border-red-200 hover:bg-red-50 cursor-pointer"
                  }`}
                >
                  {isDeleting ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="size-5" />
                      Delete Component
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {isUpdateConfirmOpen ? (
          <div className="fixed inset-0 z-300 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-[520px] rounded-[20px] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F7EF]">
                  <AlertTriangle className="h-8 w-8 text-[#15BA5C]" />
                </div>

                <h2 className="text-[22px] font-bold text-[#1C1B20]">
                  Update Component
                </h2>

                <p className="mt-3 text-[15px] text-[#6B7280] leading-relaxed">
                  You are about to update a Component,
                  <br />
                  Do you wish to continue?
                </p>

                <div className="mt-8 flex w-full gap-4">
                  <button
                    type="button"
                    onClick={() => setIsUpdateConfirmOpen(false)}
                    className="h-12 flex-1 cursor-pointer rounded-full border border-red-500 text-[15px] font-bold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsUpdateConfirmOpen(false);
                      await handleUpdate();
                    }}
                    className="h-12 flex-1 cursor-pointer rounded-full bg-[#15BA5C] text-[15px] font-bold text-white hover:bg-[#13A652] transition-colors"
                  >
                    Yes, Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {isDeleteConfirmOpen ? (
          <div className="fixed inset-0 z-300 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-[520px] rounded-[20px] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#FEE2E2]">
                  <AlertTriangle className="h-8 w-8 text-[#EF4444]" />
                </div>

                <h2 className="text-[22px] font-bold text-[#1C1B20]">
                  Delete Component
                </h2>

                <p className="mt-3 text-[15px] text-[#6B7280] leading-relaxed">
                  You are about to delete a Component,
                  <br />
                  Do you wish to continue?
                </p>

                <div className="mt-8 flex w-full gap-4">
                  <button
                    type="button"
                    onClick={() => setIsDeleteConfirmOpen(false)}
                    className="h-12 flex-1 cursor-pointer rounded-full border border-red-500 text-[15px] font-bold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsDeleteConfirmOpen(false);
                      await handleDelete();
                    }}
                    className="h-12 flex-1 cursor-pointer rounded-full bg-[#E33629] text-[15px] font-bold text-white hover:bg-[#C52B1F] transition-colors"
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ViewAndEditComponent;
