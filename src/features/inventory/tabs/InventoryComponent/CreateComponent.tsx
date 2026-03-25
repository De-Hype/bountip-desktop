import { useEffect, useMemo, useState } from "react";
import { X, Copy, Search, Trash2 } from "lucide-react";
import ImageHandler from "@/shared/Image/ImageHandler";
import useBusinessStore from "@/stores/useBusinessStore";
import { getCurrencySymbol } from "@/utils/getCurrencySymbol";
import useToastStore from "@/stores/toastStore";
import { useAuthStore } from "@/stores/authStore";

interface CreateComponentProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

type InventoryPick = {
  inventoryItemId: string;
  itemName: string;
  itemCode: string | null;
  costPrice: number;
};

type SelectedComponentItem = {
  inventoryItemId: string;
  itemName: string;
  quantity: string;
  costPrice: number;
  wastePercent: string;
  critical: boolean;
  required: boolean;
};

const generateComponentCode = () =>
  "CO" + Math.random().toString(36).substring(2, 10).toUpperCase();

const sanitizeNumber = (value: string) => value.replace(/[^0-9.]/g, "");

const normalizeSteps = (raw: string) => {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^\d+\.\s*/, "").replace(/^[\-\*]\s*/, ""));

  return lines.map((l, idx) => `${idx + 1}. ${l}`).join("\n");
};

const CreateComponent = ({ onClose, onSuccess }: CreateComponentProps) => {
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inventoryId, setInventoryId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [inventoryOptions, setInventoryOptions] = useState<InventoryPick[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    id: generateComponentCode(),
    description: "",
    steps: "",
    imageUrl: "",
  });

  const [selectedItems, setSelectedItems] = useState<SelectedComponentItem[]>(
    [],
  );

  useEffect(() => {
    const api = (window as any).electronAPI;
    if (!api?.dbQuery || !selectedOutlet?.id) return;

    (async () => {
      try {
        const invRows = await api.dbQuery(
          "SELECT id FROM inventory WHERE outletId = ? ORDER BY createdAt ASC LIMIT 1",
          [selectedOutlet.id],
        );
        setInventoryId(invRows?.[0]?.id || null);

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
  }, [selectedOutlet?.id]);

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

  const totalCost = useMemo(() => {
    const sum = selectedItems.reduce((acc, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const waste = parseFloat(item.wastePercent) || 0;
      const multiplier = 1 + waste / 100;
      return acc + qty * (item.costPrice || 0) * multiplier;
    }, 0);
    return sum;
  }, [selectedItems]);

  const canSubmit =
    !isSubmitting &&
    formData.name.trim() !== "" &&
    selectedItems.length > 0 &&
    !!inventoryId &&
    selectedItems.every((i) => (parseFloat(i.quantity) || 0) > 0);

  const handleToggle = (
    inventoryItemId: string,
    field: "critical" | "required",
  ) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.inventoryItemId === inventoryItemId
          ? { ...item, [field]: !item[field] }
          : item,
      ),
    );
  };

  const removeItem = (inventoryItemId: string) => {
    setSelectedItems((prev) =>
      prev.filter((item) => item.inventoryItemId !== inventoryItemId),
    );
  };

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

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const api = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const componentId = crypto.randomUUID();
      const howToCreate = normalizeSteps(formData.steps);

      await api.dbQuery(
        `
          INSERT INTO components (
            id, name, reference, description, howToCreate, image,
            componentSize, componentWeight, minimumStockLevel, unitOfMeasure,
            status, createdAt, updatedAt, createdBy, updatedBy, deletedAt,
            inventoryId, recordId, version
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          componentId,
          formData.name.trim(),
          formData.id,
          formData.description.trim() || null,
          howToCreate || null,
          formData.imageUrl || null,
          "Small",
          null,
          0,
          null,
          "prepared",
          now,
          now,
          authUser?.name || "",
          null,
          null,
          inventoryId,
          null,
          1,
        ],
      );

      for (const item of selectedItems) {
        const qty = parseFloat(item.quantity) || 0;
        const waste = parseFloat(item.wastePercent) || 0;
        const adjustWaste = waste / 100;
        const total = qty * (item.costPrice || 0) * (1 + adjustWaste);

        await api.dbQuery(
          `
            INSERT INTO component_items (
              id, quantity, adjustWaste, isCritical, isRequired, costPrice, totalCost,
              createdAt, updatedAt, deletedAt, componentId, componentItemLotId, itemId,
              recordId, version
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

      if (api.queueAdd) {
        const componentRow = await api.dbQuery(
          "SELECT * FROM components WHERE id = ?",
          [componentId],
        );
        if (componentRow?.[0]) {
          await api.queueAdd({
            table: "components",
            action: "CREATE",
            data: componentRow[0],
            id: componentId,
          });
        }

        const componentItemsRows = await api.dbQuery(
          "SELECT * FROM component_items WHERE componentId = ?",
          [componentId],
        );
        for (const row of componentItemsRows || []) {
          await api.queueAdd({
            table: "component_items",
            action: "CREATE",
            data: row,
            id: row.id,
          });
        }
      }

      showToast("success", "Success", "Component created successfully");
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error("Failed to create component:", err);
      showToast("error", "Error", "Failed to create component");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      {/* Modal Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
        <h2 className="text-xl font-bold text-gray-900">Create a Component</h2>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors cursor-pointer"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar bg-white">
        {/* Top Fields */}
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
              Component ID<span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.id}
                readOnly
                className="w-full h-11 px-4 bg-[#F1F3F5] border border-gray-200 rounded-lg outline-none text-sm text-gray-600"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(formData.id);
                  showToast("success", "Copied", "Component code copied");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <Copy className="size-4 text-gray-400 cursor-pointer hover:text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
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

        {/* Steps */}
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
              setFormData((p) => ({ ...p, steps: normalizeSteps(p.steps) }))
            }
            className="w-full h-24 p-4 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#15BA5C] transition-all text-sm resize-none"
          />
        </div>

        {/* Search Items */}
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

        {/* Selected Items Table */}
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
                          handleToggle(item.inventoryItemId, "critical")
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
                          handleToggle(item.inventoryItemId, "required")
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
                          (1 + (parseFloat(item.wastePercent) || 0) / 100),
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
                          Search for items above to add them to this component
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Total Cost */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F9FAFB] rounded-lg border border-gray-100">
          <span className="font-semibold text-gray-900">Total Cost</span>
          <div className="bg-[#E9ECEF] px-8 py-2 rounded-lg font-bold text-gray-900">
            {formatMoney(totalCost)}
          </div>
        </div>

        {/* Upload Section */}
        <div className="space-y-3">
          <ImageHandler
            value={formData.imageUrl}
            onChange={({ url }) => setFormData({ ...formData, imageUrl: url })}
            label="Upload Media"
            className="w-full"
          />
        </div>

        {/* Submit Button */}
        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className={`w-full h-12 font-bold rounded-lg transition-all active:scale-[0.99] ${
            canSubmit
              ? "bg-[#15BA5C] text-white hover:bg-[#119E4D] cursor-pointer"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          Create Component
        </button>
      </div>
    </div>
  );
};

export default CreateComponent;
