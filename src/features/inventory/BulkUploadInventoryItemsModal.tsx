"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

type ParsedInventoryItem = {
  row: number;
  itemName: string;
  itemCode: string;
  itemCategory: string;
  itemType: string;
  unitOfPurchase: string;
  unitOfConsumption: string;
  unitOfTransfer: string;
  displayedUnitOfMeasure: string;
  noOfTransferBasedOnPurchase: number;
  noOfConsumptionUnitBasedOnPurchase: number;
  minimumStockLevel: number;
  reOrderLevel: number;
  lotNumber: string;
  supplierBarcode: string;
  quantityPurchased: number;
  expiryDate: string;
  costPrice: number;
  suppliers: string;
  trackInventory: boolean;
  makeItemTraceable: boolean;
  isValid: boolean;
  isDuplicate: boolean;
  status: "ready" | "duplicate" | "error" | "success";
  errors: string[];
};

type BulkUploadResult = {
  success: number;
  duplicates: number;
  errors: number;
  total: number;
  successfulItems: ParsedInventoryItem[];
  duplicateItems: ParsedInventoryItem[];
  errorItems: ParsedInventoryItem[];
};

type BulkUploadInventoryItemsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
};

const INVENTORY_HEADERS = [
  "itemName",
  "itemCode",
  "itemCategory",
  "itemType",
  "unitOfPurchase",
  "unitOfTransfer",
  "unitOfConsumption",
  "displayedUnitOfMeasure",
  "noOfTransferBasedOnPurchase",
  "noOfConsumptionUnitBasedOnPurchase",
  "minimumStockLevel",
  "reOrderLevel",
  "lotNumber",
  "supplierBarcode",
  "quantityPurchased",
  "expiryDate",
  "costPrice",
  "suppliers",
  "trackInventory",
  "makeItemTraceable",
] as const;

const generateItemCode = () =>
  "ITM" + Math.random().toString(36).substring(2, 8).toUpperCase();

const toBool = (v: unknown, defaultValue: boolean) => {
  if (typeof v === "boolean") return v;
  const s = String(v ?? "")
    .trim()
    .toLowerCase();
  if (s === "") return defaultValue;
  if (["true", "1", "yes", "y"].includes(s)) return true;
  if (["false", "0", "no", "n"].includes(s)) return false;
  return defaultValue;
};

const toNumber = (v: unknown) => {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : NaN;
};

const normalizeCell = (v: unknown) => String(v ?? "").trim();

const buildParsedRow = (
  raw: Record<string, unknown>,
  rowIndex: number,
  existingItemCodes: Set<string>,
  existingItemNames: Set<string>,
  seenCodes: Set<string>,
  seenNames: Set<string>,
): ParsedInventoryItem => {
  const errors: string[] = [];

  const itemName = normalizeCell(raw.itemName);
  const itemCode = normalizeCell(raw.itemCode) || generateItemCode();
  const itemCategory = normalizeCell(raw.itemCategory);
  const itemType = normalizeCell(raw.itemType);
  const unitOfPurchase = normalizeCell(raw.unitOfPurchase);
  const unitOfTransfer = normalizeCell(raw.unitOfTransfer);
  const unitOfConsumption = normalizeCell(raw.unitOfConsumption);
  const displayedUnitOfMeasure = normalizeCell(raw.displayedUnitOfMeasure);

  const noOfTransferBasedOnPurchase = toNumber(raw.noOfTransferBasedOnPurchase);
  const noOfConsumptionUnitBasedOnPurchase = toNumber(
    raw.noOfConsumptionUnitBasedOnPurchase,
  );
  const minimumStockLevel = toNumber(raw.minimumStockLevel);
  const reOrderLevel = toNumber(raw.reOrderLevel);

  const lotNumber = normalizeCell(raw.lotNumber);
  const supplierBarcode = normalizeCell(raw.supplierBarcode);
  const quantityPurchased = toNumber(raw.quantityPurchased);
  const expiryDate = normalizeCell(raw.expiryDate);
  const costPrice = toNumber(raw.costPrice);
  const suppliers = normalizeCell(raw.suppliers);

  const trackInventory = toBool(raw.trackInventory, false);
  const makeItemTraceable = toBool(raw.makeItemTraceable, true);

  if (!itemName) errors.push("Item name is required");
  if (!itemCategory) errors.push("Item category is required");
  if (!itemType) errors.push("Item type is required");
  if (!unitOfPurchase) errors.push("Unit of purchase is required");
  if (!unitOfTransfer) errors.push("Unit of transfer is required");
  if (!unitOfConsumption) errors.push("Unit of consumption is required");
  if (!displayedUnitOfMeasure)
    errors.push("Displayed unit of measure is required");

  if (
    !Number.isFinite(noOfTransferBasedOnPurchase) ||
    noOfTransferBasedOnPurchase <= 0
  ) {
    errors.push("No of Transfer based on Purchase must be > 0");
  }
  if (
    !Number.isFinite(noOfConsumptionUnitBasedOnPurchase) ||
    noOfConsumptionUnitBasedOnPurchase <= 0
  ) {
    errors.push("No of Consumption based on Purchase must be > 0");
  }
  if (!Number.isFinite(minimumStockLevel) || minimumStockLevel < 0) {
    errors.push("Minimum stock level must be >= 0");
  }
  if (!Number.isFinite(reOrderLevel) || reOrderLevel < 0) {
    errors.push("Re-order level must be >= 0");
  }
  if (!lotNumber) errors.push("Lot number is required");
  if (!Number.isFinite(quantityPurchased) || quantityPurchased <= 0) {
    errors.push("Quantity purchased must be > 0");
  }
  if (!expiryDate) errors.push("Expiry date is required");
  if (!Number.isFinite(costPrice) || costPrice <= 0) {
    errors.push("Cost price must be > 0");
  }

  const normalizedCode = itemCode.trim().toLowerCase();
  const normalizedName = itemName.trim().toLowerCase();
  const isDuplicateCode =
    normalizedCode !== "" &&
    (existingItemCodes.has(normalizedCode) || seenCodes.has(normalizedCode));
  const isDuplicateName =
    normalizedName !== "" &&
    (existingItemNames.has(normalizedName) || seenNames.has(normalizedName));
  const isDuplicate = isDuplicateCode || isDuplicateName;

  const duplicateNotes: string[] = [];
  if (isDuplicateName) duplicateNotes.push("Duplicate item name");
  if (isDuplicateCode) duplicateNotes.push("Duplicate item code");

  const isValid = errors.length === 0;
  const status: ParsedInventoryItem["status"] = !isValid
    ? "error"
    : isDuplicate
      ? "duplicate"
      : "ready";

  return {
    row: rowIndex,
    itemName,
    itemCode,
    itemCategory,
    itemType,
    unitOfPurchase,
    unitOfTransfer,
    unitOfConsumption,
    displayedUnitOfMeasure,
    noOfTransferBasedOnPurchase: Number.isFinite(noOfTransferBasedOnPurchase)
      ? noOfTransferBasedOnPurchase
      : 0,
    noOfConsumptionUnitBasedOnPurchase: Number.isFinite(
      noOfConsumptionUnitBasedOnPurchase,
    )
      ? noOfConsumptionUnitBasedOnPurchase
      : 0,
    minimumStockLevel: Number.isFinite(minimumStockLevel)
      ? minimumStockLevel
      : 0,
    reOrderLevel: Number.isFinite(reOrderLevel) ? reOrderLevel : 0,
    lotNumber,
    supplierBarcode,
    quantityPurchased: Number.isFinite(quantityPurchased)
      ? quantityPurchased
      : 0,
    expiryDate,
    costPrice: Number.isFinite(costPrice) ? costPrice : 0,
    suppliers,
    trackInventory,
    makeItemTraceable,
    isValid,
    isDuplicate,
    status,
    errors: isValid ? duplicateNotes : errors,
  };
};

const BulkUploadInventoryItemsModal = ({
  isOpen,
  onClose,
  onUploadSuccess,
}: BulkUploadInventoryItemsModalProps) => {
  const outlet = useBusinessStore((s) => s.selectedOutlet);
  const { showToast } = useToastStore();

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedItems, setParsedItems] = useState<ParsedInventoryItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<
    "all" | "ok" | "duplicate" | "error"
  >("all");

  const [existingItemCodes, setExistingItemCodes] = useState<Set<string>>(
    new Set(),
  );
  const [existingItemNames, setExistingItemNames] = useState<Set<string>>(
    new Set(),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (!outlet?.id) return;
    const api = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    (async () => {
      try {
        const [codeRows, nameRows] = await Promise.all([
          api.dbQuery(
            `
              SELECT DISTINCT LOWER(TRIM(im.itemCode)) as code
              FROM inventory_item ii
              JOIN inventory i ON ii.inventoryId = i.id
              JOIN item_master im ON ii.itemMasterId = im.id
              WHERE i.outletId = ? AND ii.isDeleted = 0 AND im.itemCode IS NOT NULL AND im.itemCode != ''
            `,
            [outlet.id],
          ),
          api.dbQuery(
            `
              SELECT DISTINCT LOWER(TRIM(im.name)) as name
              FROM inventory_item ii
              JOIN inventory i ON ii.inventoryId = i.id
              JOIN item_master im ON ii.itemMasterId = im.id
              WHERE i.outletId = ? AND ii.isDeleted = 0 AND im.name IS NOT NULL AND im.name != ''
            `,
            [outlet.id],
          ),
        ]);

        setExistingItemCodes(
          new Set(
            (codeRows || [])
              .map((r: any) => String(r.code || "").trim())
              .filter(Boolean),
          ),
        );
        setExistingItemNames(
          new Set(
            (nameRows || [])
              .map((r: any) => String(r.name || "").trim())
              .filter(Boolean),
          ),
        );
      } catch (err) {
        console.error("Failed to load inventory item codes:", err);
      }
    })();
  }, [isOpen, outlet?.id]);

  const resetState = () => {
    setUploadedFile(null);
    setParsedItems([]);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadResult(null);
    setActiveTab("all");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    if (!isOpen) resetState();
  }, [isOpen]);

  const downloadTemplate = async () => {
    try {
      const data = [
        {
          itemName: "Flour",
          itemCode: "ITM0001",
          itemCategory: "Baking",
          itemType: "Ingredient",
          unitOfPurchase: "Bag",
          unitOfTransfer: "Kg",
          unitOfConsumption: "g",
          displayedUnitOfMeasure: "Kg",
          noOfTransferBasedOnPurchase: 25,
          noOfConsumptionUnitBasedOnPurchase: 25000,
          minimumStockLevel: 1,
          reOrderLevel: 2,
          lotNumber: "LOT-001",
          supplierBarcode: "SUP-0001",
          quantityPurchased: 1,
          expiryDate: "2026-12-31",
          costPrice: 2500,
          suppliers: "Supplier A",
          trackInventory: "TRUE",
          makeItemTraceable: "TRUE",
        },
        {
          itemName: "Sugar",
          itemCode: "ITM0002",
          itemCategory: "Baking",
          itemType: "Ingredient",
          unitOfPurchase: "Bag",
          unitOfTransfer: "Kg",
          unitOfConsumption: "g",
          displayedUnitOfMeasure: "Kg",
          noOfTransferBasedOnPurchase: 25,
          noOfConsumptionUnitBasedOnPurchase: 25000,
          minimumStockLevel: 1,
          reOrderLevel: 2,
          lotNumber: "LOT-002",
          supplierBarcode: "SUP-0002",
          quantityPurchased: 1,
          expiryDate: "2026-12-31",
          costPrice: 2100,
          suppliers: "Supplier A",
          trackInventory: "TRUE",
          makeItemTraceable: "TRUE",
        },
        {
          itemName: "Eggs",
          itemCode: "ITM0003",
          itemCategory: "Dairy & Eggs",
          itemType: "Ingredient",
          unitOfPurchase: "Tray",
          unitOfTransfer: "Each",
          unitOfConsumption: "Each",
          displayedUnitOfMeasure: "Each",
          noOfTransferBasedOnPurchase: 30,
          noOfConsumptionUnitBasedOnPurchase: 30,
          minimumStockLevel: 10,
          reOrderLevel: 20,
          lotNumber: "LOT-003",
          supplierBarcode: "SUP-0003",
          quantityPurchased: 1,
          expiryDate: "2026-06-30",
          costPrice: 1800,
          suppliers: "Supplier B",
          trackInventory: "TRUE",
          makeItemTraceable: "FALSE",
        },
        {
          itemName: "Butter",
          itemCode: "ITM0004",
          itemCategory: "Dairy & Eggs",
          itemType: "Ingredient",
          unitOfPurchase: "Pack",
          unitOfTransfer: "Kg",
          unitOfConsumption: "g",
          displayedUnitOfMeasure: "Kg",
          noOfTransferBasedOnPurchase: 1,
          noOfConsumptionUnitBasedOnPurchase: 1000,
          minimumStockLevel: 1,
          reOrderLevel: 2,
          lotNumber: "LOT-004",
          supplierBarcode: "SUP-0004",
          quantityPurchased: 1,
          expiryDate: "2026-09-30",
          costPrice: 3200,
          suppliers: "Supplier B",
          trackInventory: "TRUE",
          makeItemTraceable: "TRUE",
        },
        {
          itemName: "Vanilla Extract",
          itemCode: "ITM0005",
          itemCategory: "Baking",
          itemType: "Ingredient",
          unitOfPurchase: "Bottle",
          unitOfTransfer: "ml",
          unitOfConsumption: "ml",
          displayedUnitOfMeasure: "ml",
          noOfTransferBasedOnPurchase: 1000,
          noOfConsumptionUnitBasedOnPurchase: 1000,
          minimumStockLevel: 1,
          reOrderLevel: 2,
          lotNumber: "LOT-005",
          supplierBarcode: "SUP-0005",
          quantityPurchased: 1,
          expiryDate: "2027-01-31",
          costPrice: 1500,
          suppliers: "Supplier C",
          trackInventory: "TRUE",
          makeItemTraceable: "FALSE",
        },
      ];

      const ws = XLSX.utils.json_to_sheet(data, {
        header: [...INVENTORY_HEADERS],
      });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Inventory Items");
      XLSX.writeFile(wb, "inventory_items_upload.xlsx");
    } catch (err) {
      console.error("Failed to download inventory template:", err);
      showToast("error", "Error", "Failed to download inventory items");
    }
  };

  const parseRows = async (file: File): Promise<Record<string, unknown>[]> => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "csv") {
      const text = await file.text();
      const parsed = Papa.parse<Record<string, unknown>>(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
      });
      return (parsed.data || []).map((r) => r || {});
    }

    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
      defval: "",
    });
    return json || [];
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    setUploadResult(null);

    try {
      const rows = await parseRows(file);
      const normalized = rows.map((r) => {
        const out: Record<string, unknown> = {};
        for (const key of INVENTORY_HEADERS) {
          out[key] = (r as any)[key] ?? (r as any)[String(key)] ?? "";
        }
        return out;
      });

      const seenCodes = new Set<string>();
      const seenNames = new Set<string>();
      const parsed = normalized.map((r, idx) => {
        const row = buildParsedRow(
          r,
          idx + 1,
          existingItemCodes,
          existingItemNames,
          seenCodes,
          seenNames,
        );
        const name = row.itemName.trim().toLowerCase();
        const code = row.itemCode.trim().toLowerCase();
        if (name) seenNames.add(name);
        if (code) seenCodes.add(code);
        return row;
      });
      setParsedItems(parsed);
      setActiveTab("all");
    } catch (err) {
      console.error("Failed to parse file:", err);
      showToast("error", "Error", "Failed to parse file");
      setParsedItems([]);
    }
  };

  const startUpload = async () => {
    if (!outlet?.id) return;
    const api = (window as any).electronAPI;
    if (!api?.createInventoryItem) return;

    const ready = parsedItems.filter((p) => p.isValid && !p.isDuplicate);
    if (ready.length === 0) {
      showToast("error", "No valid rows", "There are no valid rows to upload");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const successfulItems: ParsedInventoryItem[] = [];
    const duplicateItems: ParsedInventoryItem[] = parsedItems.filter(
      (p) => p.isDuplicate,
    );
    const errorItems: ParsedInventoryItem[] = parsedItems.filter(
      (p) => !p.isValid,
    );

    for (let i = 0; i < ready.length; i++) {
      const row = ready[i];
      try {
        await api.createInventoryItem({
          itemName: row.itemName,
          itemCode: row.itemCode,
          itemCategory: row.itemCategory,
          itemType: row.itemType,
          suppliers: row.suppliers || "",
          unitOfPurchase: row.unitOfPurchase,
          unitOfTransfer: row.unitOfTransfer,
          unitOfConsumption: row.unitOfConsumption,
          noOfTransferBasedOnPurchase: String(row.noOfTransferBasedOnPurchase),
          noOfConsumptionUnitBasedOnPurchase: String(
            row.noOfConsumptionUnitBasedOnPurchase,
          ),
          displayedUnitOfMeasure: row.displayedUnitOfMeasure,
          minimumStockLevel: String(row.minimumStockLevel),
          reOrderLevel: String(row.reOrderLevel),
          lotNumber: row.lotNumber,
          supplierBarcode: row.supplierBarcode || "",
          quantityPurchased: String(row.quantityPurchased),
          expiryDate: row.expiryDate,
          costPrice: String(row.costPrice),
          trackInventory: row.trackInventory,
          makeItemTraceable: row.makeItemTraceable,
          outletId: outlet.id,
        });

        successfulItems.push({ ...row, status: "success" });
      } catch (err) {
        errorItems.push({
          ...row,
          status: "error",
          isValid: false,
          errors: [...row.errors, "Upload failed"],
        });
      } finally {
        const pct = Math.round(((i + 1) / ready.length) * 100);
        setUploadProgress(pct);
      }
    }

    if (successfulItems.length > 0) {
      setExistingItemNames((prev) => {
        const next = new Set(prev);
        for (const s of successfulItems) {
          const key = s.itemName.trim().toLowerCase();
          if (key) next.add(key);
        }
        return next;
      });
      setExistingItemCodes((prev) => {
        const next = new Set(prev);
        for (const s of successfulItems) {
          const key = s.itemCode.trim().toLowerCase();
          if (key) next.add(key);
        }
        return next;
      });
    }

    const result: BulkUploadResult = {
      success: successfulItems.length,
      duplicates: duplicateItems.length,
      errors: errorItems.length,
      total: parsedItems.length,
      successfulItems,
      duplicateItems,
      errorItems,
    };
    setUploadResult(result);
    setIsUploading(false);
    showToast("success", "Success", "Bulk upload completed");
    onUploadSuccess?.();
  };

  const validCount = useMemo(
    () => parsedItems.filter((p) => p.isValid && !p.isDuplicate).length,
    [parsedItems],
  );
  const duplicateCount = useMemo(
    () => parsedItems.filter((p) => p.isDuplicate).length,
    [parsedItems],
  );
  const errorCount = useMemo(
    () => parsedItems.filter((p) => !p.isValid).length,
    [parsedItems],
  );

  const filteredData = useMemo(() => {
    const base = uploadResult
      ? [
          ...uploadResult.successfulItems,
          ...uploadResult.duplicateItems,
          ...uploadResult.errorItems,
        ]
      : parsedItems;
    if (activeTab === "all") return base;
    if (activeTab === "ok")
      return base.filter((p) =>
        uploadResult ? p.status === "success" : p.isValid && !p.isDuplicate,
      );
    if (activeTab === "duplicate")
      return base.filter((p) => p.isDuplicate || p.status === "duplicate");
    return base.filter((p) => !p.isValid || p.status === "error");
  }, [activeTab, parsedItems, uploadResult]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <>
          <div className="h-2 bg-green-500 rounded-t-lg "></div>
          <div className="p-4"></div>
        </>

        <div className="text-white p-4 pt-0 rounded-t-lg flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-black">
              Bulk Upload Data
            </h2>
            <p className="text-green-600">Upload your data through CSV file.</p>
          </div>
          <button
            type="button"
            onClick={() => onClose()}
            className="text-black hover:bg-gray-100 rounded-full p-1 cursor-pointer"
            title="Close"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-white  p-6 mb-6 ">
            <div className="flex items-start mb-6">
              <div className="shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center mr-4">
                <CheckCircle size={16} />
              </div>
              <div className="grow">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-green-500 font-medium text-sm">Step 1</p>
                    <h3 className="font-semibold text-lg">
                      Download our Inventory Items Template
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Download your current inventory items list and use it as
                      the upload template.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
                  >
                    <Download size={16} />
                    Download Template
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
                  Fill the template with your Inventory Items
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Open the downloaded file, add/update your inventory items,
                  then save the file.
                </p>
                {/* <div className="mt-3 flex items-start gap-2 text-sm text-gray-600">
                  <AlertCircle className="h-4 w-4 text-gray-400 mt-0.5" />
                  <span>
                    Inventory items cannot be uploaded if the Item Name already
                    exists.
                  </span>
                </div> */}
              </div>
            </div>

            <div className="flex items-start">
              <div
                className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                  uploadedFile || uploadResult
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-[#6B7280]"
                }`}
              >
                {uploadedFile || uploadResult ? (
                  <CheckCircle size={16} />
                ) : (
                  <span className="text-sm font-semibold">3</span>
                )}
              </div>
              <div className="grow">
                <p className="text-green-500 font-medium text-sm">Step 3</p>
                <h3 className="font-semibold text-lg mb-4">
                  Upload the completed template file
                </h3>

                {!uploadedFile && !isUploading && (
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex justify-center items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <FileText className="text-green-500" size={24} />
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Upload className="text-green-500" size={24} />
                      </div>
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          uploadedFile || uploadResult
                            ? "bg-green-100"
                            : "bg-gray-100"
                        }`}
                      >
                        <CheckCircle
                          className={`${
                            uploadedFile || uploadResult
                              ? "text-green-500"
                              : "text-gray-300"
                          }`}
                          size={24}
                        />
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

                {isUploading && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="text-green-500" size={20} />
                        <span className="font-medium">
                          {uploadedFile?.name || "inventory_items_upload.xlsx"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{uploadProgress}%</span>
                        <button
                          type="button"
                          onClick={resetState}
                          className="text-red-500 hover:bg-red-50 px-2 py-1 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">
                      Uploading data from file
                    </p>
                  </div>
                )}

                {uploadedFile && !isUploading && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="text-green-500" size={20} />
                        <span className="font-medium">{uploadedFile.name}</span>
                        <span className="text-green-600 text-sm">
                          {uploadResult
                            ? "Upload Complete"
                            : "File Parsed Successfully"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={resetState}
                        className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 flex items-center gap-1"
                      >
                        <RefreshCw size={14} />
                        Reupload
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {(parsedItems.length > 0 || uploadResult) && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">
                  {uploadResult ? "Upload Results" : "Review Parsed Data"}
                </h3>
                {parsedItems.length > 0 && !uploadResult && (
                  <button
                    type="button"
                    onClick={startUpload}
                    disabled={isUploading || validCount === 0}
                    className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        Upload {validCount} Valid Items
                      </>
                    )}
                  </button>
                )}
              </div>

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
                      : "Valid items ready"}
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
                    {uploadResult ? "Duplicate entries" : "Duplicates detected"}
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
                    {uploadResult ? "Failed uploads" : "Errors found"}
                  </p>
                </div>
              </div>

              <div className="flex border-b border-gray-200 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`px-4 py-2 border-b-2 font-medium ${
                    activeTab === "all"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-800"
                  }`}
                >
                  All ({uploadResult ? uploadResult.total : parsedItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("ok")}
                  className={`px-4 py-2 border-b-2 font-medium ${
                    activeTab === "ok"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-800"
                  }`}
                >
                  {uploadResult ? "Success" : "Valid"} (
                  {uploadResult ? uploadResult.success : validCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("duplicate")}
                  className={`px-4 py-2 border-b-2 font-medium ${
                    activeTab === "duplicate"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Duplicate (
                  {uploadResult ? uploadResult.duplicates : duplicateCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("error")}
                  className={`px-4 py-2 border-b-2 font-medium ${
                    activeTab === "error"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Error ({uploadResult ? uploadResult.errors : errorCount})
                </button>
              </div>

              <div className="rounded-md border mb-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Item Code</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Qty Purchased</TableHead>
                      <TableHead>Cost Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Errors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item, idx) => (
                      <TableRow key={`${item.row}-${idx}`}>
                        <TableCell>{item.row}</TableCell>
                        <TableCell>{item.itemName}</TableCell>
                        <TableCell>{item.itemCode}</TableCell>
                        <TableCell>{item.itemCategory}</TableCell>
                        <TableCell>{item.itemType}</TableCell>
                        <TableCell>{item.quantityPurchased}</TableCell>
                        <TableCell>{item.costPrice}</TableCell>
                        <TableCell>
                          {item.status === "success" ? (
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              Success
                            </span>
                          ) : item.isDuplicate ? (
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                              Duplicate
                            </span>
                          ) : !item.isValid ? (
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                              Error
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              Ready
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[260px]">
                          <span className="text-xs text-red-600">
                            {(item.errors || []).join(", ")}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkUploadInventoryItemsModal;
