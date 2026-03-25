"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Search, Trash2, X } from "lucide-react";
import { Dropdown } from "@/shared/AppDropdowns/CreateDropdown";
import SystemDefaultModal from "@/shared/SystemDefaultModal";
import useBusinessStore from "@/stores/useBusinessStore";
import useToastStore from "@/stores/toastStore";
import { useAuthStore } from "@/stores/authStore";
import { getCurrencySymbol } from "@/utils/getCurrencySymbol";
import { SystemDefaultType } from "../../../../../electron/types/system-default";

interface PrepareComponentProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

type ComponentPick = {
  id: string;
  name: string;
  reference: string | null;
  componentSize: string | null;
  componentWeight: string | null;
  unitOfMeasure: string | null;
  minimumStockLevel: number | null;
};

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

const sanitizeNumber = (value: string) => value.replace(/[^0-9.]/g, "");

const UNIT_OF_MEASUREMENT_OPTIONS = [
  "Unit of Purchase",
  "Unit of Consumption",
  "Unit of Transfer",
] as const;

const nextLotRef = (base: string, n: number) => {
  const suffix = String(n).padStart(2, "0");
  return `${base}${suffix}`;
};

const PrepareComponent = ({ onClose, onSuccess }: PrepareComponentProps) => {
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
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);

  const [components, setComponents] = useState<ComponentPick[]>([]);
  const [selectedComponent, setSelectedComponent] =
    useState<ComponentPick | null>(null);

  const [lotNumber, setLotNumber] = useState("");
  const [componentSize, setComponentSize] = useState("");
  const [unitOfMeasure, setUnitOfMeasure] = useState("");
  const [componentWeight, setComponentWeight] = useState("");
  const [componentQuantity, setComponentQuantity] = useState("");
  const [minimumStockLevel, setMinimumStockLevel] = useState("");

  const [sizes, setSizes] = useState<string[]>([]);
  const [weights, setWeights] = useState<string[]>([]);

  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [inventoryOptions, setInventoryOptions] = useState<InventoryPick[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedComponentItem[]>(
    [],
  );

  useEffect(() => {
    const api = (window as any).electronAPI;
    if (!api?.dbQuery || !selectedOutlet?.id) return;

    (async () => {
      try {
        const fetchWeightScales = async () => {
          if (!api?.getSystemDefaults) {
            setWeights([]);
            return;
          }
          const results = await api.getSystemDefaults(
            SystemDefaultType.WEIGHT_SCALE,
            selectedOutlet.id,
          );
          const all = (results || []).flatMap((row: any) => {
            try {
              const data = JSON.parse(row.data);
              return Array.isArray(data) ? data : [data];
            } catch {
              return [];
            }
          });
          setWeights(
            all
              .map((w: any) => (typeof w === "string" ? w : w?.name))
              .filter(Boolean),
          );
        };

        const compRows = await api.dbQuery(
          `
            SELECT
              c.id,
              c.name,
              c.reference,
              c.componentSize,
              c.componentWeight,
              c.unitOfMeasure,
              c.minimumStockLevel
            FROM components c
            JOIN inventory inv ON inv.id = c.inventoryId
            WHERE inv.outletId = ? AND c.deletedAt IS NULL
            ORDER BY c.updatedAt DESC
          `,
          [selectedOutlet.id],
        );
        setComponents(
          (compRows || []).map((r: any) => ({
            id: r.id,
            name: r.name || "",
            reference: r.reference ?? null,
            componentSize: r.componentSize ?? null,
            componentWeight: r.componentWeight ?? null,
            unitOfMeasure: r.unitOfMeasure ?? null,
            minimumStockLevel:
              r.minimumStockLevel != null ? Number(r.minimumStockLevel) : null,
          })),
        );

        const [sizeRows] = await Promise.all([
          api.dbQuery(
            `
              SELECT DISTINCT c.componentSize as v
              FROM components c
              JOIN inventory inv ON inv.id = c.inventoryId
              WHERE inv.outletId = ? AND c.deletedAt IS NULL
                AND c.componentSize IS NOT NULL AND c.componentSize != ''
              ORDER BY c.componentSize ASC
            `,
            [selectedOutlet.id],
          ),
        ]);
        setSizes((sizeRows || []).map((r: any) => String(r.v)));
        await fetchWeightScales();

        const invItems = await api.dbQuery(
          `
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
          `,
          [selectedOutlet.id],
        );
        setInventoryOptions(
          (invItems || []).map((r: any) => ({
            inventoryItemId: r.inventoryItemId,
            itemName: r.itemName,
            itemCode: r.itemCode,
            costPrice: parseFloat(r.costPrice || 0),
          })),
        );
      } catch (err) {
        console.error("Failed to load prepare component data:", err);
      }
    })();
  }, [selectedOutlet?.id]);

  const filteredItems = useMemo(() => {
    const q = itemSearchTerm.trim().toLowerCase();
    if (!q) return [];
    return inventoryOptions
      .filter((it) => {
        const name = (it.itemName || "").toLowerCase();
        const code = (it.itemCode || "").toLowerCase();
        return name.includes(q) || code.includes(q);
      })
      .slice(0, 8);
  }, [inventoryOptions, itemSearchTerm]);

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
    setItemSearchTerm("");
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

  const totalCost = useMemo(() => {
    return selectedItems.reduce((acc, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const waste = parseFloat(item.wastePercent) || 0;
      const multiplier = 1 + waste / 100;
      return acc + qty * (item.costPrice || 0) * multiplier;
    }, 0);
  }, [selectedItems]);

  const unitCost = useMemo(() => {
    const q = parseFloat(componentQuantity) || 0;
    if (q <= 0) return 0;
    return totalCost / q;
  }, [componentQuantity, totalCost]);

  const canSubmit =
    !isSubmitting &&
    !!selectedComponent?.id &&
    lotNumber.trim() !== "" &&
    componentSize.trim() !== "" &&
    unitOfMeasure.trim() !== "" &&
    (parseFloat(componentQuantity) || 0) > 0 &&
    (parseFloat(minimumStockLevel) || 0) >= 0 &&
    selectedItems.length > 0 &&
    selectedItems.every((i) => (parseFloat(i.quantity) || 0) > 0);

  const loadComponentRecipe = async (c: ComponentPick) => {
    const api = (window as any).electronAPI;
    if (!api?.dbQuery) return;
    try {
      const [countRows, recipeRows] = await Promise.all([
        api.dbQuery(
          "SELECT COUNT(*) as count FROM component_lots WHERE componentId = ? AND deletedAt IS NULL",
          [c.id],
        ),
        api.dbQuery(
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
          [c.id],
        ),
      ]);

      const n = Number(countRows?.[0]?.count || 0) + 1;
      const base = (c.reference || "CO").replace(/\s+/g, "");
      setLotNumber(nextLotRef(base, n));

      setComponentSize(c.componentSize || "");
      setComponentWeight(c.componentWeight || "");
      const nextUom =
        c.unitOfMeasure &&
        UNIT_OF_MEASUREMENT_OPTIONS.includes(c.unitOfMeasure as any)
          ? c.unitOfMeasure
          : "";
      setUnitOfMeasure(nextUom);
      setMinimumStockLevel(
        c.minimumStockLevel != null ? String(c.minimumStockLevel) : "",
      );

      setSelectedItems(
        (recipeRows || []).map((r: any) => ({
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
      console.error("Failed to load component recipe:", err);
      showToast("error", "Error", "Failed to load component recipe");
    }
  };

  const handlePickComponent = async (c: ComponentPick) => {
    setSelectedComponent(c);
    await loadComponentRecipe(c);
  };

  const handleAddWeightScale = async (newValue: string) => {
    try {
      const api = (window as any).electronAPI;
      if (
        !api?.addSystemDefault ||
        !api?.getSystemDefaults ||
        !selectedOutlet?.id
      )
        return;

      await api.addSystemDefault(
        SystemDefaultType.WEIGHT_SCALE,
        { name: newValue },
        selectedOutlet.id,
      );

      const results = await api.getSystemDefaults(
        SystemDefaultType.WEIGHT_SCALE,
        selectedOutlet.id,
      );
      const all = (results || []).flatMap((row: any) => {
        try {
          const data = JSON.parse(row.data);
          return Array.isArray(data) ? data : [data];
        } catch {
          return [];
        }
      });
      const next = all
        .map((w: any) => (typeof w === "string" ? w : w?.name))
        .filter(Boolean);
      setWeights(next);
      setComponentWeight(newValue);
      setIsWeightModalOpen(false);
    } catch (err) {
      console.error("Failed to add weight scale:", err);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (!selectedComponent?.id) return;
    const api = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();

      await api.dbQuery(
        `
          UPDATE components
          SET
            componentSize = ?,
            componentWeight = ?,
            unitOfMeasure = ?,
            minimumStockLevel = ?,
            updatedAt = ?,
            updatedBy = ?,
            version = COALESCE(version, 0) + 1
          WHERE id = ?
        `,
        [
          componentSize.trim() || null,
          componentWeight.trim() || null,
          unitOfMeasure.trim() || null,
          parseFloat(minimumStockLevel) || 0,
          now,
          authUser?.name || "",
          selectedComponent.id,
        ],
      );

      const lotId = crypto.randomUUID();
      const qty = parseFloat(componentQuantity) || 0;

      await api.dbQuery(
        `
          INSERT INTO component_lots (
            id,
            initialStockLevel,
            quantity,
            currentStockLevel,
            ref,
            unitCost,
            expiry,
            createdAt,
            updatedAt,
            deletedAt,
            preparedBy,
            updatedBy,
            componentId,
            recordId,
            version,
            totalCost
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          lotId,
          qty,
          qty,
          qty,
          lotNumber.trim(),
          unitCost,
          null,
          now,
          now,
          null,
          authUser?.name || "",
          null,
          selectedComponent.id,
          null,
          1,
          totalCost,
        ],
      );

      const logId = crypto.randomUUID();
      await api.dbQuery(
        `
          INSERT INTO component_lot_logs (
            id,
            changeType,
            previousLevel,
            currentLevel,
            actionTakenBy,
            changeAmount,
            createdAt,
            updatedAt,
            deletedAt,
            lotId,
            recordId,
            version
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          logId,
          "PREPARE",
          0,
          qty,
          authUser?.name || "",
          qty,
          now,
          now,
          null,
          lotId,
          null,
          1,
        ],
      );

      if (api.queueAdd) {
        const [componentRow, lotRow, logRow] = await Promise.all([
          api.dbQuery("SELECT * FROM components WHERE id = ?", [
            selectedComponent.id,
          ]),
          api.dbQuery("SELECT * FROM component_lots WHERE id = ?", [lotId]),
          api.dbQuery("SELECT * FROM component_lot_logs WHERE id = ?", [logId]),
        ]);
        if (componentRow?.[0]) {
          await api.queueAdd({
            table: "components",
            action: "UPDATE",
            data: componentRow[0],
            id: selectedComponent.id,
          });
        }
        if (lotRow?.[0]) {
          await api.queueAdd({
            table: "component_lots",
            action: "CREATE",
            data: lotRow[0],
            id: lotId,
          });
        }
        if (logRow?.[0]) {
          await api.queueAdd({
            table: "component_lot_logs",
            action: "CREATE",
            data: logRow[0],
            id: logId,
          });
        }
      }

      showToast("success", "Success", "Component prepared successfully");
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error("Failed to prepare component:", err);
      showToast("error", "Error", "Failed to prepare component");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
        <h2 className="text-xl font-bold text-gray-900">Prepare a Component</h2>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors cursor-pointer"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar bg-white">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Search for a component
            </label>
            <Dropdown
              options={(components || []).map((c) => ({
                value: c.id,
                label: `${c.name}${c.reference ? ` - ${c.reference}` : ""}`,
              }))}
              selectedValue={selectedComponent?.id || undefined}
              onChange={(val) => {
                const found = components.find((c) => c.id === val);
                if (!found) return;
                handlePickComponent(found);
              }}
              placeholder="Search for a component"
              searchPlaceholder="Search for a component"
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Component Lot Number<span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                className="w-full h-11 px-4 bg-[#F1F3F5] border border-gray-200 rounded-lg outline-none text-sm text-gray-700"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(lotNumber || "");
                  showToast("success", "Copied", "Lot number copied");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <Copy className="size-4 text-gray-400 cursor-pointer hover:text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Component Size<span className="text-red-500">*</span>
            </label>
            <Dropdown
              options={[
                ...sizes.map((v) => ({ value: v, label: v })),
                ...(componentSize && !sizes.includes(componentSize)
                  ? [{ value: componentSize, label: componentSize }]
                  : []),
              ]}
              selectedValue={componentSize || undefined}
              onChange={(val) => setComponentSize(val)}
              placeholder="Select Component Size"
              className="w-full"
              allowAddNew
              addNewLabel="+"
              onAddNew={(val) => {
                const v = val.trim();
                if (!v) return;
                setSizes((prev) => (prev.includes(v) ? prev : [...prev, v]));
                setComponentSize(v);
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Unit of Measurement<span className="text-red-500">*</span>
            </label>
            <Dropdown
              options={UNIT_OF_MEASUREMENT_OPTIONS.map((v) => ({
                value: v,
                label: v,
              }))}
              selectedValue={unitOfMeasure || undefined}
              onChange={(val) => setUnitOfMeasure(val)}
              placeholder="Select Unit of measurement"
              className="w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Component Quantity<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={componentQuantity}
              onChange={(e) =>
                setComponentQuantity(sanitizeNumber(e.target.value))
              }
              placeholder="enter component quantity"
              className="w-full h-11 px-4 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#15BA5C] transition-all text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Component Weight
            </label>
            <Dropdown
              options={[
                ...weights.map((v) => ({ value: v, label: v })),
                ...(componentWeight && !weights.includes(componentWeight)
                  ? [{ value: componentWeight, label: componentWeight }]
                  : []),
              ]}
              selectedValue={componentWeight || undefined}
              onChange={(val) => setComponentWeight(val)}
              placeholder="Select preferred Weight"
              className="w-full"
              allowAddNew
              addNewLabel="+"
              onAddNewClick={() => setIsWeightModalOpen(true)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            Minimum Stock Level<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={minimumStockLevel}
            onChange={(e) =>
              setMinimumStockLevel(sanitizeNumber(e.target.value))
            }
            placeholder="Enter Minimum stock level"
            className="w-full h-11 px-4 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#15BA5C] transition-all text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            Search Items to use
          </label>
          <div className="flex items-center">
            <input
              type="text"
              value={itemSearchTerm}
              onChange={(e) => setItemSearchTerm(e.target.value)}
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
                  Cost Per Unit of Purchase
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

        <div className="flex items-center justify-between px-6 py-4 bg-[#F9FAFB] rounded-lg border border-gray-100">
          <span className="font-semibold text-gray-900">Total Cost</span>
          <div className="bg-[#E9ECEF] px-8 py-2 rounded-lg font-bold text-gray-900">
            {formatMoney(totalCost)}
          </div>
        </div>

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
          {isSubmitting ? "Saving..." : "Save Component"}
        </button>
      </div>

      <SystemDefaultModal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        onAdd={handleAddWeightScale}
        title="Add Weight"
        inputLabel="Weight"
        placeholder="Enter weight (e.g., KG, G, LB)"
        buttonText="Add Weight"
      />
    </div>
  );
};

export default PrepareComponent;
