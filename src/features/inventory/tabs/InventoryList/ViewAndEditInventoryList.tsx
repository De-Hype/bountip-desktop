"use client";

import { useEffect, useMemo, useState } from "react";
import {
  X,
  Copy,
  Plus,
  Info,
  Trash2,
  Loader2,
  Clock,
  Calendar,
  AlertTriangle,
  Search,
} from "lucide-react";
import { Dropdown } from "@/shared/AppDropdowns/CreateDropdown";
import { useBusinessStore } from "@/stores/useBusinessStore";
import { useAuthStore } from "@/stores/authStore";
import {
  format,
  formatDistanceToNowStrict,
  isToday,
  isYesterday,
} from "date-fns";
import { SystemDefaultType } from "../../../../../electron/types/system-default";
import SystemDefaultModal from "@/shared/SystemDefaultModal";
import AddSupplierModal from "../Procurement/tabs/suppliers/AddSupplierModal";
import useToastStore from "@/stores/toastStore";
import { Pagination } from "@/shared/Pagination/pagination";
import { getCurrencySymbol } from "@/utils/getCurrencySymbol";

type TabKey = "basic" | "stock" | "cost" | "traceability";
type LotRow = {
  id: string;
  lotNumber: string;
  quantityPurchased: number;
  costPrice: number;
  supplierAddress: string | null;
  supplierName: string | null;
  initialStockLevel: number;
  currentStockLevel: number;
  createdAt: string | null;
  updatedAt: string | null;
};

interface ViewAndEditInventoryListProps {
  isOpen: boolean;
  inventoryItemId: string | null;
  onClose: () => void;
  onUpdated?: () => void;
  onDeleted?: () => void;
}

const ViewAndEditInventoryList = ({
  isOpen,
  inventoryItemId,
  onClose,
  onUpdated,
  onDeleted,
}: ViewAndEditInventoryListProps) => {
  const { selectedOutlet } = useBusinessStore();
  const authUser = useAuthStore((s) => s.user);
  const { showToast } = useToastStore();
  const currencySymbol = selectedOutlet?.currency
    ? getCurrencySymbol(selectedOutlet.currency)
    : "";
  const formatAmount = (value: number) =>
    new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0);
  const [activeTab, setActiveTab] = useState<TabKey>("basic");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdateConfirmOpen, setIsUpdateConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [lotRows, setLotRows] = useState<LotRow[]>([]);
  const [lotSearch, setLotSearch] = useState("");
  const [lotPage, setLotPage] = useState(1);
  const [lotItemsPerPage, setLotItemsPerPage] = useState(10);
  const [unitCostMode, setUnitCostMode] = useState<"purchase" | "displayed">(
    "purchase",
  );

  const [categories, setCategories] = useState<
    { value: string; label: string }[]
  >([]);
  const [units, setUnits] = useState<{ value: string; label: string }[]>([]);
  const [suppliers, setSuppliers] = useState<
    { value: string; label: string }[]
  >([]);
  const [supplierLookup, setSupplierLookup] = useState<{
    byId: Record<string, { name: string; address: string | null }>;
    byName: Record<
      string,
      { id: string; name: string; address: string | null }
    >;
  }>({ byId: {}, byName: {} });

  const [isDefaultModalOpen, setIsDefaultModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    inputLabel: "",
    placeholder: "",
    buttonText: "",
    key: "" as SystemDefaultType | "",
  });

  const [meta, setMeta] = useState<{
    createdAt?: string;
    updatedAt?: string;
    updatedBy?: string | null;
    itemMasterId?: string;
    outletId?: string;
  }>({});

  const [formData, setFormData] = useState({
    itemName: "",
    itemCode: "",
    itemCategory: "",
    itemType: "",
    suppliers: [] as string[],
    unitOfPurchase: "",
    unitOfTransfer: "",
    unitOfConsumption: "",
    noOfTransferBasedOnPurchase: "0",
    noOfConsumptionUnitBasedOnPurchase: "0",
    displayedUnitOfMeasure: "",
    currentStockLevel: "0",
    minimumStockLevel: "0",
    reOrderLevel: "0",
    costPrice: "0.00",
    quantityPurchased: "0",
    trackInventory: false,
    makeItemTraceable: false,
  });
  const [baselineFormKey, setBaselineFormKey] = useState("");

  const normalizeNumberString = (value: string) => {
    const n = Number(value);
    return Number.isFinite(n) ? String(n) : "";
  };

  const buildFormKey = (data: typeof formData) =>
    JSON.stringify({
      itemName: String(data.itemName || "").trim(),
      itemCode: String(data.itemCode || "").trim(),
      itemCategory: String(data.itemCategory || "").trim(),
      itemType: String(data.itemType || "").trim(),
      suppliers: [...(data.suppliers || [])].map(String).sort(),
      unitOfPurchase: String(data.unitOfPurchase || "").trim(),
      unitOfTransfer: String(data.unitOfTransfer || "").trim(),
      unitOfConsumption: String(data.unitOfConsumption || "").trim(),
      noOfTransferBasedOnPurchase: normalizeNumberString(
        data.noOfTransferBasedOnPurchase,
      ),
      noOfConsumptionUnitBasedOnPurchase: normalizeNumberString(
        data.noOfConsumptionUnitBasedOnPurchase,
      ),
      displayedUnitOfMeasure: String(data.displayedUnitOfMeasure || "").trim(),
      currentStockLevel: normalizeNumberString(data.currentStockLevel),
      minimumStockLevel: normalizeNumberString(data.minimumStockLevel),
      reOrderLevel: normalizeNumberString(data.reOrderLevel),
      costPrice: normalizeNumberString(data.costPrice),
      quantityPurchased: normalizeNumberString(data.quantityPurchased),
      trackInventory: Boolean(data.trackInventory),
      makeItemTraceable: Boolean(data.makeItemTraceable),
    });

  const isDirty = useMemo(() => {
    if (!baselineFormKey) return false;
    return buildFormKey(formData) !== baselineFormKey;
  }, [baselineFormKey, formData]);

  const openDefaultModal = (
    key: SystemDefaultType,
    title: string,
    inputLabel: string,
    placeholder: string,
    buttonText: string,
  ) => {
    setModalConfig({ title, inputLabel, placeholder, buttonText, key });
    setIsDefaultModalOpen(true);
  };

  const handleNumericInputChange = (
    field: string,
    value: string,
    isFloat = false,
  ) => {
    let sanitizedValue = isFloat
      ? value.replace(/[^0-9.]/g, "")
      : value.replace(/[^0-9]/g, "");

    if (isFloat && (sanitizedValue.match(/\./g) || []).length > 1) {
      const parts = sanitizedValue.split(".");
      sanitizedValue = parts[0] + "." + parts.slice(1).join("");
    }

    setFormData((prev) => ({ ...prev, [field]: sanitizedValue }));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const fetchSuppliers = async () => {
    try {
      const api = (window as any).electronAPI;
      if (!api?.dbQuery || !selectedOutlet?.id) return;
      const supplierSql =
        "SELECT id, name, address FROM suppliers WHERE outletId = ? AND deletedAt IS NULL ORDER BY name ASC";
      const supplierRes = await api.dbQuery(supplierSql, [selectedOutlet.id]);
      const options = (supplierRes || []).map((s: any) => ({
        value: String(s.id),
        label: String(s.name || ""),
      }));
      setSuppliers(options);

      const byId: Record<string, { name: string; address: string | null }> = {};
      const byName: Record<
        string,
        { id: string; name: string; address: string | null }
      > = {};
      (supplierRes || []).forEach((s: any) => {
        const id = String(s.id || "").trim();
        const name = String(s.name || "").trim();
        const address =
          s.address != null && String(s.address).trim() !== ""
            ? String(s.address)
            : null;
        if (!id || !name) return;
        byId[id] = { name, address };
        byName[name.toLowerCase()] = { id, name, address };
      });
      setSupplierLookup({ byId, byName });
    } catch (err) {
      console.error("Failed to fetch suppliers:", err);
    }
  };

  const resolveSupplierName = (supplierNameOrId: string | null) => {
    const raw = String(supplierNameOrId || "").trim();
    if (!raw) return "---";
    const tokens = raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const resolved = tokens.map((t) => {
      const byId = supplierLookup.byId[t];
      if (byId) return byId.name;
      const byName = supplierLookup.byName[t.toLowerCase()];
      if (byName) return byName.name;
      return t;
    });
    return resolved.join(", ");
  };

  const resolveSupplierAddress = (lot: LotRow) => {
    const rawAddress = String(lot.supplierAddress || "").trim();
    if (rawAddress) return rawAddress;
    const rawSupplier = String(lot.supplierName || "").trim();
    if (!rawSupplier) return "---";
    const tokens = rawSupplier
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const addresses = tokens
      .map((t) => {
        const byId = supplierLookup.byId[t];
        if (byId?.address) return byId.address;
        const byName = supplierLookup.byName[t.toLowerCase()];
        if (byName?.address) return byName.address;
        return null;
      })
      .filter(Boolean) as string[];
    const unique = Array.from(new Set(addresses.map((a) => a.trim()))).filter(
      Boolean,
    );
    if (unique.length === 0) return "---";
    return unique.join(", ");
  };

  const fetchCategories = async () => {
    try {
      const api = (window as any).electronAPI;
      if (!api?.getSystemDefaults || !selectedOutlet?.id) return;

      const results = await api.getSystemDefaults(
        SystemDefaultType.ITEM_CATEGORY,
        selectedOutlet.id,
      );

      const allCategories = results.flatMap((row: any) => {
        try {
          const data =
            typeof row.data === "string" ? JSON.parse(row.data) : row.data;
          return Array.isArray(data) ? data : [data];
        } catch {
          return [];
        }
      });

      setCategories(
        allCategories.map((c: any) => ({
          value: c.name || c,
          label: c.name || c,
          id: results[0]?.id,
        })),
      );
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const fetchUnits = async () => {
    try {
      const api = (window as any).electronAPI;
      if (!api?.getSystemDefaults || !selectedOutlet?.id) return;

      const results = await api.getSystemDefaults(
        SystemDefaultType.INVENTORY_UNIT,
        selectedOutlet.id,
      );

      const allUnits = results.flatMap((row: any) => {
        try {
          const data =
            typeof row.data === "string" ? JSON.parse(row.data) : row.data;
          return Array.isArray(data) ? data : [data];
        } catch {
          return [];
        }
      });

      setUnits(
        allUnits.map((u: any) => ({
          value: u.name || u,
          label: u.name || u,
          id: results[0]?.id,
        })),
      );
    } catch (err) {
      console.error("Failed to fetch units:", err);
    }
  };

  const handleDeleteDefault = async (option: any) => {
    try {
      const api = (window as any).electronAPI;
      if (!api?.deleteSystemDefault || !option.id) return;

      await api.deleteSystemDefault(option.id, option.value);
      showToast("success", "Success", "Item removed successfully");

      // Refetch lists
      await fetchCategories();
      await fetchUnits();
    } catch (err) {
      console.error("Failed to delete system default:", err);
      showToast("error", "Error", "Failed to remove item");
    }
  };

  const handleAddNewDefault = async (newValue: string) => {
    try {
      const api = (window as any).electronAPI;
      if (!api?.addSystemDefault || !selectedOutlet?.id || !modalConfig.key)
        return;

      const typesWithKey = [
        SystemDefaultType.ITEM_CATEGORY,
        SystemDefaultType.INVENTORY_UNIT,
      ];

      const payload = typesWithKey.includes(modalConfig.key)
        ? { key: modalConfig.key, name: newValue }
        : { name: newValue };

      await api.addSystemDefault(modalConfig.key, payload, selectedOutlet.id);

      if (modalConfig.key === SystemDefaultType.INVENTORY_UNIT) {
        await fetchUnits();
      } else if (modalConfig.key === SystemDefaultType.ITEM_CATEGORY) {
        await fetchCategories();
      }

      setIsDefaultModalOpen(false);
    } catch (err) {
      console.error("Failed to add new system default:", err);
    }
  };

  const handleSaveSupplier = async (supplierData: any) => {
    try {
      const api = (window as any).electronAPI;
      if (!api?.dbQuery || !selectedOutlet?.id) return;

      const sql = `
        INSERT INTO suppliers (
          id, isActive, name, representativeName, phoneNumbers, emailAddress, address,
          supplierCode, notes, taxNumber, createdAt, updatedAt, deletedAt, outletId, recordId, version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await api.dbQuery(sql, [
        id,
        1,
        supplierData.supplierName,
        JSON.stringify(
          supplierData.representatives.filter((r: string) => r.trim() !== ""),
        ),
        JSON.stringify(
          supplierData.phoneNumbers
            .filter((p: any) => p.number.trim() !== "")
            .map((p: any) => `${p.country.dialCode}${p.number}`),
        ),
        JSON.stringify(
          supplierData.emails.filter((e: string) => e.trim() !== ""),
        ),
        supplierData.address,
        supplierData.notes,
        null,
        supplierData.taxNumber,
        now,
        now,
        null,
        selectedOutlet.id,
        null,
        1,
      ]);

      showToast("success", "Success", "Supplier added successfully");
      await fetchSuppliers();
      setIsSupplierModalOpen(false);
    } catch (err) {
      console.error("Failed to save supplier:", err);
      showToast("error", "Error", "Failed to save supplier");
    }
  };

  const isFormValid =
    formData.itemName.trim() !== "" &&
    formData.itemCategory !== "" &&
    formData.itemType !== "" &&
    formData.unitOfPurchase !== "" &&
    formData.unitOfTransfer !== "" &&
    formData.unitOfConsumption !== "" &&
    parseFloat(formData.noOfTransferBasedOnPurchase) > 0 &&
    parseFloat(formData.noOfConsumptionUnitBasedOnPurchase) > 0 &&
    formData.displayedUnitOfMeasure !== "" &&
    formData.currentStockLevel.trim() !== "" &&
    parseFloat(formData.currentStockLevel) >= 0 &&
    parseFloat(formData.minimumStockLevel) >= 0 &&
    parseFloat(formData.reOrderLevel) >= 0;

  const costPerUnitOfPurchase = useMemo(() => {
    const costPrice = parseFloat(formData.costPrice) || 0;
    const qtyPurchased = parseFloat(formData.quantityPurchased) || 0;
    if (qtyPurchased <= 0) return "0.00";
    return (costPrice / qtyPurchased).toFixed(2);
  }, [formData.costPrice, formData.quantityPurchased]);

  const costPerUnitOfTransfer = useMemo(() => {
    const transferFactor =
      parseFloat(formData.noOfTransferBasedOnPurchase) || 0;
    if (transferFactor <= 0) return "0.00";
    return (parseFloat(costPerUnitOfPurchase) / transferFactor).toFixed(2);
  }, [costPerUnitOfPurchase, formData.noOfTransferBasedOnPurchase]);

  const costPerUnitOfConsumption = useMemo(() => {
    const consumptionFactor =
      parseFloat(formData.noOfConsumptionUnitBasedOnPurchase) || 0;
    if (consumptionFactor <= 0) return "0.00";
    return (parseFloat(costPerUnitOfPurchase) / consumptionFactor).toFixed(2);
  }, [costPerUnitOfPurchase, formData.noOfConsumptionUnitBasedOnPurchase]);

  const weightedAverageCostPerPurchaseUnit = useMemo(() => {
    if (lotRows.length === 0) return parseFloat(costPerUnitOfPurchase) || 0;
    const totals = lotRows.reduce(
      (acc, r) => {
        acc.totalCost += Number(r.costPrice || 0) || 0;
        acc.totalQty += Number(r.quantityPurchased || 0) || 0;
        return acc;
      },
      { totalCost: 0, totalQty: 0 },
    );
    if (totals.totalQty <= 0) return 0;
    return totals.totalCost / totals.totalQty;
  }, [costPerUnitOfPurchase, lotRows]);

  const displayedUnitFactor = useMemo(() => {
    const purchase = formData.unitOfPurchase;
    const displayed = formData.displayedUnitOfMeasure;
    if (!purchase || !displayed) return 1;
    if (displayed === purchase) return 1;
    if (displayed === formData.unitOfTransfer) {
      return parseFloat(formData.noOfTransferBasedOnPurchase) || 1;
    }
    if (displayed === formData.unitOfConsumption) {
      return parseFloat(formData.noOfConsumptionUnitBasedOnPurchase) || 1;
    }
    return 1;
  }, [
    formData.displayedUnitOfMeasure,
    formData.noOfConsumptionUnitBasedOnPurchase,
    formData.noOfTransferBasedOnPurchase,
    formData.unitOfConsumption,
    formData.unitOfPurchase,
    formData.unitOfTransfer,
  ]);

  const weightedAverageCostDisplay = useMemo(() => {
    if (unitCostMode === "purchase") return weightedAverageCostPerPurchaseUnit;
    return (
      weightedAverageCostPerPurchaseUnit / Math.max(1, displayedUnitFactor)
    );
  }, [displayedUnitFactor, unitCostMode, weightedAverageCostPerPurchaseUnit]);

  const weightedAverageCostUnitLabel = useMemo(() => {
    if (unitCostMode === "purchase") return formData.unitOfPurchase || "";
    return formData.displayedUnitOfMeasure || "";
  }, [formData.displayedUnitOfMeasure, formData.unitOfPurchase, unitCostMode]);

  const totalStockValue = useMemo(() => {
    const current = parseFloat(formData.currentStockLevel) || 0;
    return current * (weightedAverageCostDisplay || 0);
  }, [formData.currentStockLevel, weightedAverageCostDisplay]);

  const filteredLots = useMemo(() => {
    const q = lotSearch.trim().toLowerCase();
    if (!q) return lotRows;
    return lotRows.filter((r) => {
      const lotNumber = String(r.lotNumber || "").toLowerCase();
      const supplier = String(r.supplierName || "").toLowerCase();
      const address = String(r.supplierAddress || "").toLowerCase();
      return (
        lotNumber.includes(q) || supplier.includes(q) || address.includes(q)
      );
    });
  }, [lotRows, lotSearch]);

  const lotTotalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredLots.length / lotItemsPerPage));
  }, [filteredLots.length, lotItemsPerPage]);

  const paginatedLots = useMemo(() => {
    const start = (lotPage - 1) * lotItemsPerPage;
    return filteredLots.slice(start, start + lotItemsPerPage);
  }, [filteredLots, lotItemsPerPage, lotPage]);

  const loadItem = async () => {
    if (!inventoryItemId || !selectedOutlet?.id) return;
    const api = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    setIsLoading(true);
    try {
      const rowSql = `
        SELECT
          ii.*,
          im.id as itemMasterId,
          im.name as itemName,
          im.category as itemCategory,
          im.itemType as itemType,
          im.itemCode as itemCode,
          im.unitOfPurchase as unitOfPurchase,
          im.unitOfTransfer as unitOfTransfer,
          im.unitOfConsumption as unitOfConsumption,
          im.displayedUnitOfMeasure as displayedUnitOfMeasure,
          im.transferPerPurchase as transferPerPurchase,
          im.consumptionPerTransfer as consumptionPerTransfer,
          im.isTraceable as isTraceable,
          im.isTrackable as isTrackable
        FROM inventory_item ii
        JOIN inventory i ON ii.inventoryId = i.id
        JOIN item_master im ON ii.itemMasterId = im.id
        WHERE ii.id = ? AND i.outletId = ?
        LIMIT 1
      `;
      const rows = await api.dbQuery(rowSql, [
        inventoryItemId,
        selectedOutlet.id,
      ]);
      const row = rows?.[0];
      if (!row) return;

      const [latestLot, allLots] = await Promise.all([
        api.dbQuery(
          "SELECT supplierName, quantityPurchased FROM item_lot WHERE itemId = ? ORDER BY createdAt DESC LIMIT 1",
          [inventoryItemId],
        ),
        api.dbQuery(
          `
            SELECT
              id,
              lotNumber,
              quantityPurchased,
              costPrice,
              supplierAddress,
              supplierName,
              initialStockLevel,
              currentStockLevel,
              createdAt,
              updatedAt
            FROM item_lot
            WHERE itemId = ?
            ORDER BY COALESCE(updatedAt, createdAt) DESC
          `,
          [inventoryItemId],
        ),
      ]);

      setLotRows(
        (allLots || []).map((r: any) => ({
          id: String(r.id || ""),
          lotNumber: String(r.lotNumber || ""),
          quantityPurchased: Number(r.quantityPurchased || 0),
          costPrice: Number(r.costPrice || 0),
          supplierAddress:
            r.supplierAddress != null ? String(r.supplierAddress) : null,
          supplierName: r.supplierName != null ? String(r.supplierName) : null,
          initialStockLevel: Number(r.initialStockLevel || 0),
          currentStockLevel: Number(r.currentStockLevel || 0),
          createdAt: r.createdAt != null ? String(r.createdAt) : null,
          updatedAt: r.updatedAt != null ? String(r.updatedAt) : null,
        })),
      );

      const supplierRaw = latestLot?.[0]?.supplierName || "";
      const lotQty = latestLot?.[0]?.quantityPurchased;
      const supplierTokens = String(supplierRaw)
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);

      const supplierIds = supplierTokens
        .map((token: string) => {
          const byId = suppliers.find((s) => s.value === token);
          if (byId) return byId.value;
          const byName = suppliers.find(
            (s) => s.label.toLowerCase() === token.toLowerCase(),
          );
          return byName?.value;
        })
        .filter(Boolean) as string[];

      const transferPerPurchase = Number(row.transferPerPurchase || 0);
      const consumptionPerTransfer = Number(row.consumptionPerTransfer || 0);
      const consumptionPerPurchase =
        transferPerPurchase * consumptionPerTransfer;

      setMeta({
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        updatedBy: row.modifiedBy || row.addedBy || null,
        itemMasterId: row.itemMasterId,
        outletId: selectedOutlet.id,
      });

      setFormData({
        itemName: row.itemName || "",
        itemCode: row.itemCode || "",
        itemCategory: row.itemCategory || "",
        itemType: row.itemType || "",
        suppliers: supplierIds,
        unitOfPurchase: row.unitOfPurchase || "",
        unitOfTransfer: row.unitOfTransfer || "",
        unitOfConsumption: row.unitOfConsumption || "",
        noOfTransferBasedOnPurchase: String(transferPerPurchase || 0),
        noOfConsumptionUnitBasedOnPurchase: String(consumptionPerPurchase || 0),
        displayedUnitOfMeasure: row.displayedUnitOfMeasure || "",
        currentStockLevel: String(row.currentStockLevel ?? 0),
        minimumStockLevel: String(row.minimumStockLevel ?? 0),
        reOrderLevel: String(row.reOrderLevel ?? 0),
        costPrice: String(row.costPrice ?? "0.00"),
        quantityPurchased: String(lotQty ?? 0),
        trackInventory: Boolean(row.isTrackable),
        makeItemTraceable: Boolean(row.isTraceable),
      });
      setBaselineFormKey(
        buildFormKey({
          itemName: row.itemName || "",
          itemCode: row.itemCode || "",
          itemCategory: row.itemCategory || "",
          itemType: row.itemType || "",
          suppliers: supplierIds,
          unitOfPurchase: row.unitOfPurchase || "",
          unitOfTransfer: row.unitOfTransfer || "",
          unitOfConsumption: row.unitOfConsumption || "",
          noOfTransferBasedOnPurchase: String(transferPerPurchase || 0),
          noOfConsumptionUnitBasedOnPurchase: String(
            consumptionPerPurchase || 0,
          ),
          displayedUnitOfMeasure: row.displayedUnitOfMeasure || "",
          currentStockLevel: String(row.currentStockLevel ?? 0),
          minimumStockLevel: String(row.minimumStockLevel ?? 0),
          reOrderLevel: String(row.reOrderLevel ?? 0),
          costPrice: String(row.costPrice ?? "0.00"),
          quantityPurchased: String(lotQty ?? 0),
          trackInventory: Boolean(row.isTrackable),
          makeItemTraceable: Boolean(row.isTraceable),
        }),
      );
    } catch (err) {
      console.error("Failed to load inventory item:", err);
      showToast("error", "Error", "Failed to load inventory item");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab("basic");
    (async () => {
      await Promise.all([fetchCategories(), fetchUnits(), fetchSuppliers()]);
    })();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!inventoryItemId) return;
    setBaselineFormKey("");
    loadItem();
  }, [isOpen, inventoryItemId, suppliers.length]);

  useEffect(() => {
    setLotPage(1);
  }, [lotItemsPerPage, lotSearch]);

  useEffect(() => {
    setLotPage((p) => Math.min(p, lotTotalPages));
  }, [lotTotalPages]);

  const handleUpdate = async () => {
    if (!inventoryItemId || !meta.itemMasterId) return;
    if (!isFormValid || !isDirty || isSaving) return;
    const api = (window as any).electronAPI;
    if (!api?.dbQuery || !api?.queueAdd) return;

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const transferPerPurchase =
        parseFloat(formData.noOfTransferBasedOnPurchase) || 0;
      const consumptionPerPurchase =
        parseFloat(formData.noOfConsumptionUnitBasedOnPurchase) || 0;
      const consumptionPerTransfer =
        transferPerPurchase > 0
          ? consumptionPerPurchase / transferPerPurchase
          : 0;

      const updateItemMasterSql = `
        UPDATE item_master
        SET
          name = ?,
          category = ?,
          itemType = ?,
          unitOfPurchase = ?,
          unitOfTransfer = ?,
          unitOfConsumption = ?,
          displayedUnitOfMeasure = ?,
          transferPerPurchase = ?,
          consumptionPerTransfer = ?,
          isTraceable = ?,
          isTrackable = ?,
          version = COALESCE(version, 0) + 1,
          updatedAt = ?
        WHERE id = ?
      `;
      await api.dbQuery(updateItemMasterSql, [
        formData.itemName,
        formData.itemCategory,
        formData.itemType,
        formData.unitOfPurchase,
        formData.unitOfTransfer,
        formData.unitOfConsumption,
        formData.displayedUnitOfMeasure,
        transferPerPurchase,
        consumptionPerTransfer,
        formData.makeItemTraceable ? 1 : 0,
        formData.trackInventory ? 1 : 0,
        now,
        meta.itemMasterId,
      ]);

      const updateInventoryItemSql = `
        UPDATE inventory_item
        SET
          currentStockLevel = ?,
          minimumStockLevel = ?,
          reOrderLevel = ?,
          costPrice = ?,
          version = COALESCE(version, 0) + 1,
          updatedAt = ?
        WHERE id = ?
      `;
      await api.dbQuery(updateInventoryItemSql, [
        parseFloat(formData.currentStockLevel) || 0,
        parseFloat(formData.minimumStockLevel) || 0,
        parseFloat(formData.reOrderLevel) || 0,
        parseFloat(formData.costPrice) || 0,
        now,
        inventoryItemId,
      ]);

      const supplierNames = formData.suppliers
        .map((id) => suppliers.find((s) => s.value === id)?.label || id)
        .join(", ");
      if (supplierNames) {
        await api.dbQuery(
          `
            UPDATE item_lot
            SET supplierName = ?, updatedAt = ?
            WHERE id = (
              SELECT id FROM item_lot WHERE itemId = ? ORDER BY createdAt DESC LIMIT 1
            )
          `,
          [supplierNames, now, inventoryItemId],
        );

        const updatedLot = await api.dbQuery(
          `
            SELECT * FROM item_lot
            WHERE id = (
              SELECT id FROM item_lot WHERE itemId = ? ORDER BY createdAt DESC LIMIT 1
            )
          `,
          [inventoryItemId],
        );
        if (updatedLot?.[0]) {
          await api.queueAdd({
            table: "item_lot",
            action: "UPDATE",
            data: updatedLot[0],
            id: updatedLot[0].id,
          });
        }
      }

      const updatedItemMaster = await api.dbQuery(
        "SELECT * FROM item_master WHERE id = ?",
        [meta.itemMasterId],
      );
      if (updatedItemMaster?.[0]) {
        await api.queueAdd({
          table: "item_master",
          action: "UPDATE",
          data: updatedItemMaster[0],
          id: meta.itemMasterId,
        });
      }

      const updatedInventoryItem = await api.dbQuery(
        "SELECT * FROM inventory_item WHERE id = ?",
        [inventoryItemId],
      );
      if (updatedInventoryItem?.[0]) {
        await api.queueAdd({
          table: "inventory_item",
          action: "UPDATE",
          data: updatedInventoryItem[0],
          id: inventoryItemId,
        });
      }

      showToast("success", "Success", "Inventory item updated successfully");
      setBaselineFormKey(buildFormKey(formData));
      onUpdated?.();
      onClose();
    } catch (err) {
      console.error("Failed to update inventory item:", err);
      showToast("error", "Error", "Failed to update inventory item");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!inventoryItemId) return;
    const api = (window as any).electronAPI;
    if (!api?.dbQuery || !api?.queueAdd) return;
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      const now = new Date().toISOString();
      await api.dbQuery(
        `
          UPDATE inventory_item
          SET isDeleted = 1,
              version = COALESCE(version, 0) + 1,
              updatedAt = ?
          WHERE id = ?
        `,
        [now, inventoryItemId],
      );

      const record = await api.dbQuery(
        "SELECT * FROM inventory_item WHERE id = ?",
        [inventoryItemId],
      );
      if (record?.[0]) {
        await api.queueAdd({
          table: "inventory_item",
          action: "DELETE",
          data: record[0],
          id: inventoryItemId,
        });
      }

      showToast("success", "Success", "Inventory item deleted successfully");
      onDeleted?.();
      onClose();
    } catch (err) {
      console.error("Failed to delete inventory item:", err);
      showToast("error", "Error", "Failed to delete inventory item");
    } finally {
      setIsDeleting(false);
    }
  };

  const createdAtText = meta.createdAt
    ? format(new Date(meta.createdAt), "MMMM do, yyyy")
    : "";
  const updatedAtText = useMemo(() => {
    if (!meta.updatedAt) return "";
    const d = new Date(meta.updatedAt);
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return formatDistanceToNowStrict(d);
  }, [meta.updatedAt]);
  const updatedByDisplayName = useMemo(() => {
    if (!meta.updatedBy) return "";
    const authId = authUser?.id != null ? String(authUser.id) : null;
    if (authId && meta.updatedBy === authId)
      return authUser?.name ?? meta.updatedBy;
    return meta.updatedBy;
  }, [authUser?.id, authUser?.name, meta.updatedBy]);

  const itemTypes = [
    { value: "Raw Material", label: "Raw Material" },
    { value: "Intermediate", label: "Intermediate" },
    { value: "Store Items", label: "Store Items" },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-150 bg-black/40 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-[1100px] h-full bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
        <div className="px-8 py-6 ">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <h2 className="text-[22px] font-bold text-[#1C1B20] truncate">
                {formData.itemName || "View Item"}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-[#6B7280]">
                {updatedAtText ? (
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-[#15BA5C]" />
                    <span>
                      Last Updated {updatedAtText}
                      {meta.updatedBy ? ` by ${updatedByDisplayName}` : ""}
                    </span>
                  </div>
                ) : null}
                {createdAtText ? (
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-[#15BA5C]" />
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

          <div className="mt-6 flex gap-8 border-b border-gray-100">
            {[
              { key: "basic", label: "Basic Information" },
              { key: "stock", label: "Stock level" },
              { key: "cost", label: "Cost" },
              // { key: "traceability", label: "Traceability" },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key as TabKey)}
                className={`py-4 text-[15px] font-medium transition-all relative ${
                  activeTab === t.key ? "text-[#1C1B20]" : "text-[#9CA3AF]"
                }`}
              >
                {t.label}
                {activeTab === t.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#15BA5C] rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : activeTab === "basic" ? (
            <div className="space-y-10">
              <div className="space-y-6">
                <h3 className="text-[18px] font-bold text-[#1C1B20]">
                  Item / Supplier Details
                </h3>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#1C1B20]">
                      Item Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.itemName}
                      onChange={(e) =>
                        handleInputChange("itemName", e.target.value)
                      }
                      className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#15BA5C] transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#1C1B20]">
                      Item Code
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={formData.itemCode}
                        className="w-full h-12 px-4 bg-[#F3F4F6] border border-transparent rounded-xl text-[#1C1B20] font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            formData.itemCode || "",
                          );
                          showToast("success", "Copied", "Item code copied");
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#1C1B20]"
                      >
                        <Copy className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#1C1B20]">
                      Item Category <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openDefaultModal(
                            SystemDefaultType.ITEM_CATEGORY,
                            "Add Item Category",
                            "Category Name",
                            "Enter category name (e.g., Drinks, Food)",
                            "Add Category",
                          )
                        }
                        className="h-12 w-12 cursor-pointer flex items-center justify-center bg-[#F3F4F6] rounded-xl text-[#737373] hover:bg-gray-200 transition-colors"
                      >
                        <Plus className="size-5" />
                      </button>
                      <Dropdown
                        mode="select"
                        placeholder="Select a category"
                        options={categories}
                        selectedValue={formData.itemCategory}
                        onChange={(val) =>
                          handleInputChange("itemCategory", val)
                        }
                        onDeleteOption={handleDeleteDefault}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] text-[#15BA5C]">
                      <Info className="size-3.5" />
                      <span>Click the field to select, or add a category</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#1C1B20]">
                      Item Type <span className="text-red-500">*</span>
                    </label>
                    <Dropdown
                      mode="select"
                      placeholder="Select item type"
                      options={itemTypes}
                      selectedValue={formData.itemType}
                      onChange={(val) => handleInputChange("itemType", val)}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1C1B20]">
                    Supplier <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <Dropdown
                      mode="checkbox"
                      placeholder="Click to select Suppliers"
                      options={suppliers}
                      selectedValues={formData.suppliers.reduce(
                        (acc: Record<string, boolean>, cur: string) => ({
                          ...acc,
                          [cur]: true,
                        }),
                        {},
                      )}
                      onMultiChange={(newValues) => {
                        const selected = Object.keys(newValues).filter(
                          (key) => newValues[key],
                        );
                        handleInputChange("suppliers", selected);
                      }}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setIsSupplierModalOpen(true)}
                      className="h-12 w-12 cursor-pointer flex items-center justify-center bg-[#D1D5DB] rounded-xl text-white hover:bg-gray-400 transition-colors"
                    >
                      <Plus className="size-5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-[#15BA5C]">
                    <Info className="size-3.5" />
                    <span>Click the field to select, or add a Supplier</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-4">
                <h3 className="text-[18px] font-bold text-[#1C1B20]">
                  Unit of Measurement (Purchase, Transfer and Consumption)
                </h3>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#1C1B20]">
                      Unit of Purchase <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openDefaultModal(
                            SystemDefaultType.INVENTORY_UNIT,
                            "Add Unit of Purchase",
                            "Unit Name",
                            "Enter unit name (e.g., KG, PCS)",
                            "Add Unit",
                          )
                        }
                        className="h-12 w-12 cursor-pointer flex items-center justify-center bg-[#F3F4F6] rounded-xl text-[#737373] hover:bg-gray-200 transition-colors"
                      >
                        <Plus className="size-5" />
                      </button>
                      <Dropdown
                        mode="select"
                        placeholder="Click to select unit of Purchase"
                        options={units.filter(
                          (u) =>
                            u.value !== formData.unitOfTransfer &&
                            u.value !== formData.unitOfConsumption,
                        )}
                        selectedValue={formData.unitOfPurchase}
                        onChange={(val) =>
                          handleInputChange("unitOfPurchase", val)
                        }
                        onDeleteOption={handleDeleteDefault}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] text-[#15BA5C]">
                      <Info className="size-3.5" />
                      <span>
                        Click the field to select, or add a unit of Purchase
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#1C1B20]">
                      Unit of Transfer <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openDefaultModal(
                            SystemDefaultType.INVENTORY_UNIT,
                            "Add Unit of Transfer",
                            "Unit Name",
                            "Enter unit name (e.g., KG, PCS)",
                            "Add Unit",
                          )
                        }
                        className="h-12 w-12 cursor-pointer flex items-center justify-center bg-[#F3F4F6] rounded-xl text-[#737373] hover:bg-gray-200 transition-colors"
                      >
                        <Plus className="size-5" />
                      </button>
                      <Dropdown
                        mode="select"
                        placeholder="Click to select unit of Transfer"
                        options={units.filter(
                          (u) =>
                            u.value !== formData.unitOfPurchase &&
                            u.value !== formData.unitOfConsumption,
                        )}
                        selectedValue={formData.unitOfTransfer}
                        onChange={(val) =>
                          handleInputChange("unitOfTransfer", val)
                        }
                        onDeleteOption={handleDeleteDefault}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] text-[#15BA5C]">
                      <Info className="size-3.5" />
                      <span>
                        Click the field to select, click plus to add a unit of
                        Transfer
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#1C1B20]">
                      Unit of consumption{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openDefaultModal(
                            SystemDefaultType.INVENTORY_UNIT,
                            "Add Unit of Consumption",
                            "Unit Name",
                            "Enter unit name (e.g., KG, PCS)",
                            "Add Unit",
                          )
                        }
                        className="h-12 w-12 cursor-pointer flex items-center justify-center bg-[#F3F4F6] rounded-xl text-[#737373] hover:bg-gray-200 transition-colors"
                      >
                        <Plus className="size-5" />
                      </button>
                      <Dropdown
                        mode="select"
                        placeholder="Click to select unit of consumption"
                        options={units.filter(
                          (u) =>
                            u.value !== formData.unitOfPurchase &&
                            u.value !== formData.unitOfTransfer,
                        )}
                        selectedValue={formData.unitOfConsumption}
                        onChange={(val) =>
                          handleInputChange("unitOfConsumption", val)
                        }
                        onDeleteOption={handleDeleteDefault}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] text-[#15BA5C]">
                      <Info className="size-3.5" />
                      <span>
                        Click the field to select, click plus to add a unit of
                        consumption
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#1C1B20]">
                      No of Transfer based on Purchase{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.noOfTransferBasedOnPurchase}
                        onChange={(e) =>
                          handleNumericInputChange(
                            "noOfTransferBasedOnPurchase",
                            e.target.value,
                          )
                        }
                        className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#15BA5C] transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#15BA5C] font-medium text-sm">
                        Units
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] text-[#15BA5C]">
                      <Info className="size-3.5" />
                      <span>
                        {formData.noOfTransferBasedOnPurchase || 0}{" "}
                        {formData.unitOfTransfer || "Unit"} = 1{" "}
                        {formData.unitOfPurchase || "Unit of Purchase"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#1C1B20]">
                      No of Consumption Unit based on Purchase{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.noOfConsumptionUnitBasedOnPurchase}
                        onChange={(e) =>
                          handleNumericInputChange(
                            "noOfConsumptionUnitBasedOnPurchase",
                            e.target.value,
                          )
                        }
                        className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#15BA5C] transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#15BA5C] font-medium text-sm">
                        Units
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] text-[#15BA5C]">
                      <Info className="size-3.5" />
                      <span>
                        {formData.noOfConsumptionUnitBasedOnPurchase || 0}{" "}
                        {formData.unitOfConsumption || "Unit"} = 1{" "}
                        {formData.unitOfPurchase || "Unit of Purchase"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-4">
                <h3 className="text-[18px] font-bold text-[#1C1B20]">
                  Displayed unit of Measure
                </h3>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1C1B20]">
                    Displayed Unit of Measure{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <Dropdown
                    mode="select"
                    placeholder="Select your preferred unit of measurement"
                    options={[
                      {
                        label: "Unit of Purchase",
                        value: formData.unitOfPurchase,
                      },
                      {
                        label: "Unit of Transfer",
                        value: formData.unitOfTransfer,
                      },
                      {
                        label: "Unit of consumption",
                        value: formData.unitOfConsumption,
                      },
                    ].filter((opt) => opt.value)}
                    selectedValue={formData.displayedUnitOfMeasure}
                    onChange={(val) =>
                      handleInputChange("displayedUnitOfMeasure", val)
                    }
                    className="w-full"
                  />
                  <div className="flex items-center gap-1.5 text-[12px] text-[#15BA5C]">
                    <Info className="size-3.5" />
                    <span>
                      1 {formData.displayedUnitOfMeasure || "Unit"} = 1{" "}
                      {formData.unitOfPurchase || "Unit"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <h3 className="text-[18px] font-bold text-[#1C1B20]">
                  Tracking and Traceability
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-[15px] text-[#1C1B20]">
                    Activate Both
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !(
                        formData.trackInventory && formData.makeItemTraceable
                      );
                      handleInputChange("trackInventory", next);
                      handleInputChange("makeItemTraceable", next);
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      formData.trackInventory && formData.makeItemTraceable
                        ? "bg-[#15BA5C]"
                        : "bg-gray-200"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                        formData.trackInventory && formData.makeItemTraceable
                          ? "right-1"
                          : "left-1"
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[15px] text-[#1C1B20]">
                    Track Inventory for this Item
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleInputChange(
                        "trackInventory",
                        !formData.trackInventory,
                      )
                    }
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      formData.trackInventory ? "bg-[#15BA5C]" : "bg-gray-200"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                        formData.trackInventory ? "right-1" : "left-1"
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[15px] text-[#1C1B20]">
                    Make this Item Traceable
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleInputChange(
                        "makeItemTraceable",
                        !formData.makeItemTraceable,
                      )
                    }
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      formData.makeItemTraceable
                        ? "bg-[#15BA5C]"
                        : "bg-gray-200"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                        formData.makeItemTraceable ? "right-1" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === "stock" ? (
            <div className="space-y-10">
              <div className="space-y-6">
                <h3 className="text-[18px] font-bold text-[#1C1B20]">
                  Stock and Re-order Level
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#1C1B20]">
                      Minimum Stock Level{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.minimumStockLevel}
                      onChange={(e) =>
                        handleNumericInputChange(
                          "minimumStockLevel",
                          e.target.value,
                        )
                      }
                      className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#15BA5C] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#1C1B20]">
                      Re-Order Level <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.reOrderLevel}
                      onChange={(e) =>
                        handleNumericInputChange("reOrderLevel", e.target.value)
                      }
                      className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#15BA5C] transition-all"
                    />
                  </div>
                </div>
                <div className="w-full gap-6">
                  <div className="w-full space-y-2">
                    <label className="text-sm font-semibold text-[#1C1B20]">
                      Current Stock Level{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.currentStockLevel}
                      onChange={(e) =>
                        handleNumericInputChange(
                          "currentStockLevel",
                          e.target.value,
                          true,
                        )
                      }
                      className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#15BA5C] transition-all"
                    />
                  </div>
                  <div className="mt-10 space-y-8">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-[18px] font-bold text-[#1C1B20]">
                          Stock Value and Weighted Average Cost
                        </h3>
                        <button
                          type="button"
                          onClick={() =>
                            setUnitCostMode((prev) =>
                              prev === "purchase" ? "displayed" : "purchase",
                            )
                          }
                          className="h-11 px-5 rounded-[10px] bg-[#15BA5C] text-white flex items-center gap-2 font-medium cursor-pointer hover:bg-[#119E4D] transition-colors"
                        >
                          Switch Unit Cost
                        </button>
                      </div>

                      <div className="mt-4 rounded-[12px] border border-[#E5E7EB] overflow-hidden">
                        <div className="grid grid-cols-2">
                          <div className="px-5 py-4 text-[13px] font-medium text-[#1C1B20] bg-[#FAFAFA] border-b border-[#E5E7EB]">
                            Weighted Average Cost
                          </div>
                          <div className="px-5 py-4 text-[13px] font-semibold text-[#1C1B20] bg-white border-b border-[#E5E7EB] text-center">
                            {currencySymbol}
                            {formatAmount(weightedAverageCostDisplay)}{" "}
                            {weightedAverageCostUnitLabel}
                          </div>

                          <div className="px-5 py-4 text-[13px] font-medium text-[#1C1B20] bg-[#FAFAFA]">
                            Total Stock Value
                          </div>
                          <div className="px-5 py-4 bg-white flex items-center justify-center">
                            <span className="inline-flex items-center justify-center rounded-[8px] bg-[#15BA5C] px-4 py-2 text-white text-[13px] font-semibold">
                              {currencySymbol}
                              {formatAmount(totalStockValue)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="text-[18px] font-bold text-[#1C1B20]">
                          Lot Details
                        </h3>
                        <div className="flex w-full max-w-[320px] items-stretch rounded-[10px] border border-[#E5E7EB] overflow-hidden h-11 bg-white">
                          <div className="flex items-center px-3 text-[#9CA3AF]">
                            <Search className="h-4 w-4" />
                          </div>
                          <input
                            type="text"
                            value={lotSearch}
                            onChange={(e) => setLotSearch(e.target.value)}
                            placeholder="Search"
                            className="flex-1 px-2 text-sm outline-none placeholder-[#A6A6A6]"
                          />
                          <button
                            type="button"
                            title="Search lots"
                            className="flex h-11 w-11 items-center justify-center bg-[#15BA5C] text-white"
                          >
                            <Search className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="rounded-[12px] border border-[#E5E7EB] overflow-hidden bg-white">
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[980px]">
                            <thead className="bg-white">
                              <tr className="text-left text-[12px] text-gray-500">
                                <th className="px-5 py-4 font-medium">
                                  Lot Number
                                </th>
                                <th className="px-5 py-4 font-medium">
                                  Lot Quantity
                                </th>
                                <th className="px-5 py-4 font-medium">
                                  Unit Cost
                                </th>
                                <th className="px-5 py-4 font-medium">
                                  Warehouse Location
                                </th>
                                <th className="px-5 py-4 font-medium">
                                  Supplier
                                </th>
                                <th className="px-5 py-4 font-medium">
                                  Initial Stock Level
                                </th>
                                <th className="px-5 py-4 font-medium">
                                  Remaining Stock
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {paginatedLots.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={7}
                                    className="px-6 py-10 text-sm text-gray-500 text-center"
                                  >
                                    No lots found
                                  </td>
                                </tr>
                              ) : (
                                paginatedLots.map((lot) => {
                                  const unitCost =
                                    lot.quantityPurchased > 0
                                      ? lot.costPrice / lot.quantityPurchased
                                      : 0;
                                  return (
                                    <tr key={lot.id}>
                                      <td className="px-5 py-4 text-[13px] font-bold text-[#15BA5C] whitespace-nowrap">
                                        {lot.lotNumber || "—"}
                                      </td>
                                      <td className="px-5 py-4 text-[13px] text-[#1C1B20] whitespace-nowrap">
                                        {lot.quantityPurchased.toFixed(4)}
                                      </td>
                                      <td className="px-5 py-4 text-[13px] text-[#1C1B20] whitespace-nowrap">
                                        {unitCost.toFixed(4)}
                                      </td>
                                      <td className="px-5 py-4 text-[13px] text-[#1C1B20]">
                                        {resolveSupplierAddress(lot)}
                                      </td>
                                      <td className="px-5 py-4 text-[13px] text-[#1C1B20]">
                                        {resolveSupplierName(lot.supplierName)}
                                      </td>
                                      <td className="px-5 py-4 text-[13px] text-[#1C1B20] whitespace-nowrap">
                                        {lot.initialStockLevel.toFixed(4)}
                                      </td>
                                      <td className="px-5 py-4 text-[13px] text-[#1C1B20] whitespace-nowrap">
                                        {lot.currentStockLevel.toFixed(4)}
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>

                        {filteredLots.length > 0 && (
                          <Pagination
                            currentPage={lotPage}
                            totalPages={lotTotalPages}
                            onPageChange={setLotPage}
                            itemsPerPage={lotItemsPerPage}
                            onItemsPerPageChange={setLotItemsPerPage}
                            totalItems={filteredLots.length}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === "cost" ? (
            <div className="space-y-10">
              <div className="space-y-6">
                <h3 className="text-[18px] font-bold text-[#1C1B20]">
                  Cost Details
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#1C1B20]">
                      Cost Price <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.costPrice}
                      onChange={(e) =>
                        handleNumericInputChange(
                          "costPrice",
                          e.target.value,
                          true,
                        )
                      }
                      className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#15BA5C] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#1C1B20]">
                      Cost Price/Quantity Purchased{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={costPerUnitOfPurchase}
                      className="w-full h-12 px-4 bg-[#F3F4F6] border border-transparent rounded-xl text-[#1C1B20] font-medium"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#1C1B20]">
                      Cost Per unit of Transfer{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={costPerUnitOfTransfer}
                      className="w-full h-12 px-4 bg-[#F3F4F6] border border-transparent rounded-xl text-[#1C1B20] font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#1C1B20]">
                      Cost Per unit of Consumption{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={costPerUnitOfConsumption}
                      className="w-full h-12 px-4 bg-[#F3F4F6] border border-transparent rounded-xl text-[#1C1B20] font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              <div className="space-y-6">
                <h3 className="text-[18px] font-bold text-[#1C1B20]">
                  Tracking and Traceability
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-[15px] text-[#1C1B20]">
                    Activate Both
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !(
                        formData.trackInventory && formData.makeItemTraceable
                      );
                      handleInputChange("trackInventory", next);
                      handleInputChange("makeItemTraceable", next);
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      formData.trackInventory && formData.makeItemTraceable
                        ? "bg-[#15BA5C]"
                        : "bg-gray-200"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                        formData.trackInventory && formData.makeItemTraceable
                          ? "right-1"
                          : "left-1"
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[15px] text-[#1C1B20]">
                    Track Inventory for this Item
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleInputChange(
                        "trackInventory",
                        !formData.trackInventory,
                      )
                    }
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      formData.trackInventory ? "bg-[#15BA5C]" : "bg-gray-200"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                        formData.trackInventory ? "right-1" : "left-1"
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[15px] text-[#1C1B20]">
                    Make this Item Traceable
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleInputChange(
                        "makeItemTraceable",
                        !formData.makeItemTraceable,
                      )
                    }
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      formData.makeItemTraceable
                        ? "bg-[#15BA5C]"
                        : "bg-gray-200"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                        formData.makeItemTraceable ? "right-1" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-gray-100 grid grid-cols-2 gap-4">
          <button
            type="button"
            disabled={!isFormValid || !isDirty || isSaving || isDeleting}
            onClick={() => setIsUpdateConfirmOpen(true)}
            className={`w-full h-14 rounded-xl font-bold text-[16px] transition-colors flex items-center justify-center gap-2 ${
              isFormValid && isDirty && !isSaving && !isDeleting
                ? "bg-[#15BA5C] text-white hover:bg-[#13A652] cursor-pointer"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isSaving ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              "Update Item"
            )}
          </button>
          <button
            type="button"
            disabled={isSaving || isDeleting}
            onClick={() => setIsDeleteConfirmOpen(true)}
            className={`w-full h-14 rounded-xl font-bold text-[16px] transition-colors flex items-center justify-center gap-2 border ${
              isSaving || isDeleting
                ? "bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed"
                : "bg-white text-red-500 border-red-200 hover:bg-red-50 cursor-pointer"
            }`}
          >
            {isDeleting ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              <>
                <Trash2 className="size-5" />
                Delete Item
              </>
            )}
          </button>
        </div>

        <SystemDefaultModal
          isOpen={isDefaultModalOpen}
          onClose={() => setIsDefaultModalOpen(false)}
          onAdd={handleAddNewDefault}
          title={modalConfig.title}
          inputLabel={modalConfig.inputLabel}
          placeholder={modalConfig.placeholder}
          buttonText={modalConfig.buttonText}
        />

        <AddSupplierModal
          isOpen={isSupplierModalOpen}
          onClose={() => setIsSupplierModalOpen(false)}
          onSave={handleSaveSupplier}
        />

        {isUpdateConfirmOpen ? (
          <div className="fixed inset-0 z-300 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-[520px] rounded-[20px] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F7EF]">
                  <AlertTriangle className="h-8 w-8 text-[#15BA5C]" />
                </div>

                <h2 className="text-[22px] font-bold text-[#1C1B20]">
                  Update Inventory
                </h2>

                <p className="mt-3 text-[15px] text-[#6B7280] leading-relaxed">
                  You are about to update an Inventory,
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
                  Delete Inventory
                </h2>

                <p className="mt-3 text-[15px] text-[#6B7280] leading-relaxed">
                  You are about to delete an Inventory,
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

export default ViewAndEditInventoryList;
