"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  Clock,
  Loader2,
  Search,
  X,
  Trash2,
} from "lucide-react";
import { format, formatDistanceToNowStrict } from "date-fns";
import useBusinessStore from "@/stores/useBusinessStore";
import { useAuthStore } from "@/stores/authStore";
import useToastStore from "@/stores/toastStore";
import NotFound from "@/features/inventory/NotFound";

type SupplierRow = {
  id: string;
  isActive?: number;
  name: string | null;
  representativeName: string | null;
  phoneNumbers: string | null;
  emailAddress: string | null;
  address: string | null;
  taxNumber: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  outletId?: string | null;
  version?: number | null;
};

type SupplierItemRow = {
  itemId: string;
  itemName: string | null;
  category: string | null;
};

type InventoryPick = {
  inventoryItemId: string;
  itemName: string;
  category: string | null;
};

type ViewAndEditSupplierProps = {
  isOpen: boolean;
  supplierId: string | null;
  initialMode?: "view" | "edit";
  onClose: () => void;
  onUpdated?: () => void;
};

const safeJsonArray = (raw: unknown): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(String(raw));
    if (Array.isArray(parsed))
      return parsed.map((x) => String(x)).filter(Boolean);
    if (typeof parsed === "string") return [parsed].filter(Boolean);
    return [];
  } catch {
    const s = String(raw).trim();
    return s ? [s] : [];
  }
};

const PillRow = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="flex items-center justify-between py-5 px-6 border-t border-gray-100">
      <div className="bg-[#F3F4F6] rounded-full px-5 py-2 text-[14px] font-medium text-[#111827]">
        {label}
      </div>
      <div className="text-[15px] font-medium text-[#111827] text-right max-w-[55%]">
        {value}
      </div>
    </div>
  );
};

const ChipInput = ({
  label,
  required,
  values,
  onChange,
  placeholder,
  helper,
  inputType = "text",
}: {
  label: string;
  required?: boolean;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  helper?: string;
  inputType?: "text" | "email" | "tel";
}) => {
  const [draft, setDraft] = useState("");

  const addChip = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const exists = values.some(
      (v) => v.trim().toLowerCase() === trimmed.toLowerCase(),
    );
    if (exists) return;
    onChange([...values, trimmed]);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-[#1C1B20]">
        {label}
        {required ? <span className="text-red-500">*</span> : null}
      </label>
      <div className="min-h-12 px-3 py-2 border border-[#E5E7EB] rounded-xl bg-white flex flex-wrap items-center gap-2 focus-within:border-[#15BA5C] transition-all">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-2 bg-[#F3F4F6] text-[#111827] px-3 py-1.5 rounded-full text-[13px] font-medium"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="h-5 w-5 rounded-full bg-[#111827]/10 text-[#111827] flex items-center justify-center hover:bg-[#111827]/15"
              aria-label="Remove"
            >
              ×
            </button>
          </span>
        ))}

        <input
          type={inputType}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addChip(draft);
              setDraft("");
            }
          }}
          placeholder={values.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[160px] h-9 outline-none text-sm placeholder:text-gray-400"
        />
      </div>
      {helper ? (
        <div className="flex items-center gap-2 text-[12px] text-[#15BA5C]">
          <span className="inline-flex items-center justify-center h-5 w-5 rounded-full border border-[#15BA5C] text-[12px] font-bold">
            i
          </span>
          <span>{helper}</span>
        </div>
      ) : null}
    </div>
  );
};

const ViewAndEditSupplier = ({
  isOpen,
  supplierId,
  initialMode = "view",
  onClose,
  onUpdated,
}: ViewAndEditSupplierProps) => {
  const { selectedOutlet } = useBusinessStore();
  const authUser = useAuthStore((s) => s.user);
  const { showToast } = useToastStore();

  const [isLoading, setIsLoading] = useState(false);
  const [supplier, setSupplier] = useState<SupplierRow | null>(null);
  const [itemsToSupply, setItemsToSupply] = useState<SupplierItemRow[]>([]);
  const [linkedItems, setLinkedItems] = useState<InventoryPick[]>([]);
  const [inventoryOptions, setInventoryOptions] = useState<InventoryPick[]>([]);
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const itemsDropdownRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<"view" | "edit">("view");
  const [activeTab, setActiveTab] = useState<"basic" | "items">("basic");

  const [supplierName, setSupplierName] = useState("");
  const [representatives, setRepresentatives] = useState<string[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([]);
  const [emails, setEmails] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [notes, setNotes] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdateConfirmOpen, setIsUpdateConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSupplier(null);
      setItemsToSupply([]);
      setLinkedItems([]);
      setInventoryOptions([]);
      setItemSearchTerm("");
      setIsLoadingItems(false);
      setMode("view");
      setActiveTab("basic");
      setIsSaving(false);
      setIsDeleting(false);
      setIsUpdateConfirmOpen(false);
      setIsDeleteConfirmOpen(false);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);
    setActiveTab("basic");
  }, [initialMode, isOpen, supplierId]);

  useEffect(() => {
    if (!isOpen || !supplierId || !selectedOutlet?.id) return;
    const api = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    setIsLoading(true);
    setIsLoadingItems(true);
    (async () => {
      try {
        const rows = await api.dbQuery(
          `
            SELECT *
            FROM suppliers
            WHERE id = ? AND outletId = ? AND deletedAt IS NULL
            LIMIT 1
          `,
          [supplierId, selectedOutlet.id],
        );
        const s = rows?.[0] as SupplierRow | undefined;
        if (!s) return;
        setSupplier(s);

        setSupplierName(String(s.name || ""));
        setRepresentatives(safeJsonArray(s.representativeName));
        setPhoneNumbers(safeJsonArray(s.phoneNumbers));
        setEmails(safeJsonArray(s.emailAddress));
        setAddress(String(s.address || ""));
        setTaxNumber(String(s.taxNumber || ""));
        setNotes(String(s.notes || ""));

        const [itemsRows, invRows] = await Promise.all([
          api.dbQuery(
            `
              SELECT
                si.itemId as itemId,
                COALESCE(imInv.name, imDirect.name) as itemName,
                COALESCE(imInv.category, imDirect.category) as category
              FROM supplier_items si
              LEFT JOIN inventory_item ii ON ii.id = si.itemId
              LEFT JOIN item_master imInv ON imInv.id = ii.itemMasterId
              LEFT JOIN item_master imDirect ON imDirect.id = si.itemId
              WHERE si.supplierId = ? AND si.deletedAt IS NULL
              ORDER BY COALESCE(imInv.name, imDirect.name) ASC
            `,
            [supplierId],
          ),
          api.dbQuery(
            `
              SELECT
                ii.id as inventoryItemId,
                im.name as itemName,
                im.category as category
              FROM inventory_item ii
              JOIN inventory i ON ii.inventoryId = i.id
              JOIN item_master im ON ii.itemMasterId = im.id
              WHERE i.outletId = ? AND ii.isDeleted = 0
              ORDER BY im.name ASC
            `,
            [selectedOutlet.id],
          ),
        ]);

        setItemsToSupply(
          (itemsRows || []).map((r: any) => ({
            itemId: String(r.itemId || ""),
            itemName: r.itemName != null ? String(r.itemName) : null,
            category: r.category != null ? String(r.category) : null,
          })),
        );

        setLinkedItems(
          (itemsRows || [])
            .map((r: any) => ({
              inventoryItemId: String(r.itemId || ""),
              itemName: String(r.itemName || ""),
              category: r.category != null ? String(r.category) : null,
            }))
            .filter((x: any) => x.inventoryItemId && x.itemName),
        );

        setInventoryOptions(
          (invRows || []).map((r: any) => ({
            inventoryItemId: String(r.inventoryItemId || ""),
            itemName: String(r.itemName || ""),
            category: r.category != null ? String(r.category) : null,
          })),
        );
      } catch (err) {
        console.error("Failed to load supplier:", err);
      } finally {
        setIsLoading(false);
        setIsLoadingItems(false);
      }
    })();
  }, [isOpen, supplierId, selectedOutlet?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        itemsDropdownRef.current &&
        !itemsDropdownRef.current.contains(event.target as Node)
      ) {
        setItemSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredItems = useMemo(() => {
    const q = itemSearchTerm.trim().toLowerCase();
    if (!q) return [];
    return inventoryOptions
      .filter((it) => (it.itemName || "").toLowerCase().includes(q))
      .filter(
        (it) =>
          !linkedItems.some((s) => s.inventoryItemId === it.inventoryItemId),
      )
      .slice(0, 8);
  }, [inventoryOptions, itemSearchTerm, linkedItems]);

  const addSupplyItem = (it: InventoryPick) => {
    setLinkedItems((prev) => {
      if (prev.some((x) => x.inventoryItemId === it.inventoryItemId))
        return prev;
      return [...prev, it];
    });
    setItemSearchTerm("");
  };

  const removeSupplyItem = (inventoryItemId: string) => {
    setLinkedItems((prev) =>
      prev.filter((x) => x.inventoryItemId !== inventoryItemId),
    );
  };

  const createdLabel = useMemo(() => {
    const createdAt = supplier?.createdAt ? new Date(supplier.createdAt) : null;
    if (!createdAt || Number.isNaN(createdAt.getTime())) return "-";
    return format(createdAt, "MMMM do, yyyy");
  }, [supplier?.createdAt]);

  const lastUpdatedLabel = useMemo(() => {
    const updatedAt = supplier?.updatedAt
      ? new Date(supplier.updatedAt)
      : supplier?.createdAt
        ? new Date(supplier.createdAt)
        : null;
    if (!updatedAt || Number.isNaN(updatedAt.getTime())) return "-";
    return `${formatDistanceToNowStrict(updatedAt, { addSuffix: true })} by ${
      authUser?.name || "—"
    }`;
  }, [authUser?.name, supplier?.createdAt, supplier?.updatedAt]);

  const isFormValid =
    supplierName.trim() !== "" &&
    representatives.length > 0 &&
    phoneNumbers.length > 0 &&
    emails.length > 0 &&
    address.trim() !== "" &&
    taxNumber.trim() !== "";

  const handleUpdate = async () => {
    if (!supplierId || !selectedOutlet?.id) return;
    if (!isFormValid || isSaving) return;
    const api = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      await api.dbQuery(
        `
          UPDATE suppliers
          SET
            name = ?,
            representativeName = ?,
            phoneNumbers = ?,
            emailAddress = ?,
            address = ?,
            notes = ?,
            taxNumber = ?,
            updatedAt = ?,
            version = COALESCE(version, 0) + 1
          WHERE id = ? AND outletId = ? AND deletedAt IS NULL
        `,
        [
          supplierName.trim(),
          JSON.stringify(representatives),
          JSON.stringify(phoneNumbers),
          JSON.stringify(emails),
          address.trim(),
          notes,
          taxNumber.trim(),
          now,
          supplierId,
          selectedOutlet.id,
        ],
      );

      const existingLinks = await api.dbQuery(
        `
          SELECT id, itemId, deletedAt
          FROM supplier_items
          WHERE supplierId = ?
        `,
        [supplierId],
      );
      const activeLinks = (existingLinks || []).filter(
        (r: any) => !r.deletedAt,
      );
      const existingByItemId = new Map<string, any>();
      for (const r of activeLinks) {
        const itemId = String(r.itemId || "");
        if (itemId) existingByItemId.set(itemId, r);
      }

      const nextItemIds = new Set(
        linkedItems.map((x) => String(x.inventoryItemId)).filter(Boolean),
      );
      const createdIds: string[] = [];
      const deletedIds: string[] = [];

      for (const itemId of nextItemIds) {
        const existing = existingByItemId.get(itemId);
        if (existing) continue;
        const id = crypto.randomUUID();
        await api.dbQuery(
          `
            INSERT INTO supplier_items (
              id, totalSupplied, createdAt, updatedAt, deletedAt, supplierId, itemId, recordId, version
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [id, 0, now, now, null, supplierId, itemId, null, 1],
        );
        createdIds.push(id);
      }

      for (const r of activeLinks) {
        const itemId = String(r.itemId || "");
        if (!itemId) continue;
        if (nextItemIds.has(itemId)) continue;
        await api.dbQuery(
          `
            UPDATE supplier_items
            SET deletedAt = ?, updatedAt = ?, version = COALESCE(version, 0) + 1
            WHERE id = ?
          `,
          [now, now, r.id],
        );
        deletedIds.push(String(r.id));
      }

      if (api.queueAdd) {
        const supplierRow = await api.dbQuery(
          "SELECT * FROM suppliers WHERE id = ?",
          [supplierId],
        );
        if (supplierRow?.[0]) {
          await api.queueAdd({
            table: "suppliers",
            action: "UPDATE",
            data: supplierRow[0],
            id: supplierId,
          });
        }

        for (const id of createdIds) {
          const rows = await api.dbQuery(
            "SELECT * FROM supplier_items WHERE id = ?",
            [id],
          );
          if (rows?.[0]) {
            await api.queueAdd({
              table: "supplier_items",
              action: "CREATE",
              data: rows[0],
              id,
            });
          }
        }

        for (const id of deletedIds) {
          const rows = await api.dbQuery(
            "SELECT * FROM supplier_items WHERE id = ?",
            [id],
          );
          if (rows?.[0]) {
            await api.queueAdd({
              table: "supplier_items",
              action: "DELETE",
              data: rows[0],
              id,
            });
          }
        }
      }

      showToast("success", "Success", "Supplier updated successfully");
      onUpdated?.();
      onClose();
    } catch (err) {
      console.error("Failed to update supplier:", err);
      showToast("error", "Error", "Failed to update supplier");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!supplierId || !selectedOutlet?.id) return;
    if (isDeleting) return;
    const api = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    setIsDeleting(true);
    try {
      const now = new Date().toISOString();
      await api.dbQuery(
        `
          UPDATE suppliers
          SET deletedAt = ?, updatedAt = ?, version = COALESCE(version, 0) + 1
          WHERE id = ? AND outletId = ? AND deletedAt IS NULL
        `,
        [now, now, supplierId, selectedOutlet.id],
      );

      if (api.queueAdd) {
        const row = await api.dbQuery("SELECT * FROM suppliers WHERE id = ?", [
          supplierId,
        ]);
        if (row?.[0]) {
          await api.queueAdd({
            table: "suppliers",
            action: "UPDATE",
            data: row[0],
            id: supplierId,
          });
        }
      }

      showToast("success", "Success", "Supplier deleted");
      onUpdated?.();
      onClose();
    } catch (err) {
      console.error("Failed to delete supplier:", err);
      showToast("error", "Error", "Failed to delete supplier");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[220] bg-black/40 backdrop-blur-sm flex justify-end">
      <div className="bg-white shadow-2xl w-full max-w-[1100px] h-full flex flex-col animate-in slide-in-from-right duration-300">
        <div className="px-10 pt-10 pb-4 flex items-start justify-between">
          <div className="space-y-3">
            <h1 className="text-[34px] font-bold text-[#111827] leading-none">
              {supplier?.name || "Supplier"}
            </h1>
            <div className="flex items-center gap-8 text-[#6B7280] text-[14px]">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-[#15BA5C]" />
                <span>
                  Last Updated{" "}
                  <span className="font-semibold">{lastUpdatedLabel}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-[#15BA5C]" />
                <span>
                  Created on{" "}
                  <span className="font-semibold">{createdLabel}</span>
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 cursor-pointer hover:bg-red-50 rounded-full transition-colors group"
            aria-label="Close"
          >
            <X className="size-6 text-white bg-red-500 rounded-full p-1 group-hover:bg-red-600" />
          </button>
        </div>

        <div className="px-10">
          <div className="h-px bg-gray-100" />
        </div>

        {mode === "edit" ? (
          <div className="px-10 pt-6">
            <div className="flex items-center gap-10 border-b border-gray-100">
              <button
                type="button"
                onClick={() => setActiveTab("basic")}
                className={`py-4 text-[15px] font-medium transition-all relative ${
                  activeTab === "basic" ? "text-[#1C1B20]" : "text-[#9CA3AF]"
                }`}
              >
                Basic Information
                {activeTab === "basic" && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#15BA5C] rounded-t-full" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("items")}
                className={`py-4 text-[15px] font-medium transition-all relative ${
                  activeTab === "items" ? "text-[#1C1B20]" : "text-[#9CA3AF]"
                }`}
              >
                Items to Supply
                {activeTab === "items" && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#15BA5C] rounded-t-full" />
                )}
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex-1 px-10 py-8 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-6 animate-spin text-[#15BA5C]" />
            </div>
          ) : !supplier ? (
            <NotFound
              title="Supplier not found"
              description="This supplier may have been deleted."
            />
          ) : mode === "view" ? (
            <div className="space-y-10">
              <div className="space-y-4">
                <h2 className="text-[22px] font-bold text-[#111827]">
                  Basic Information
                </h2>
                <div className="border border-gray-200 rounded-[14px] overflow-hidden bg-white">
                  <PillRow label="Supplier Name" value={supplierName || "-"} />
                  <PillRow
                    label="Representative Name(s)"
                    value={
                      safeJsonArray(supplier.representativeName).join(", ") ||
                      "-"
                    }
                  />
                  <PillRow
                    label="Phone Number(s)"
                    value={
                      safeJsonArray(supplier.phoneNumbers).join(", ") || "-"
                    }
                  />
                  <PillRow
                    label="Email Address(es)"
                    value={
                      safeJsonArray(supplier.emailAddress).join(", ") || "-"
                    }
                  />
                  <PillRow label="Address" value={address || "-"} />
                  <PillRow label="Tax Number" value={taxNumber || "-"} />
                  <PillRow label="Notes" value={notes || "-"} />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-[22px] font-bold text-[#111827]">
                  Items to Supply
                </h2>
                <div className="border border-gray-200 rounded-[14px] overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-[#F9FAFB]">
                        <tr>
                          <th className="px-6 py-4 text-[13px] font-semibold text-[#6B7280]">
                            Items
                          </th>
                          <th className="px-6 py-4 text-[13px] font-semibold text-[#6B7280]">
                            Category
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {itemsToSupply.length === 0 ? (
                          <tr>
                            <td colSpan={2} className="px-6 py-10">
                              <div className="text-sm text-[#6B7280] text-center">
                                No items to supply
                              </div>
                            </td>
                          </tr>
                        ) : (
                          itemsToSupply.map((it, idx) => (
                            <tr key={`${it.itemName}-${idx}`}>
                              <td className="px-6 py-5 text-[15px] text-[#111827]">
                                {it.itemName || "-"}
                              </td>
                              <td className="px-6 py-5 text-[15px] text-[#111827]">
                                {it.category || "-"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === "basic" ? (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-x-10 gap-y-8">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1C1B20]">
                    Supplier Name<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#15BA5C] transition-all"
                  />
                </div>

                <ChipInput
                  label="Representative Name (s)"
                  required
                  values={representatives}
                  onChange={setRepresentatives}
                  placeholder="Type a name and press Enter"
                  helper="If there are more than 1, click ‘Enter’ after each"
                />

                <ChipInput
                  label="Phone Number (s)"
                  required
                  values={phoneNumbers}
                  onChange={setPhoneNumbers}
                  placeholder="Type a phone and press Enter"
                  helper="If there are more than 1, click ‘Enter’ after each"
                  inputType="tel"
                />

                <ChipInput
                  label="Email Address (s)"
                  required
                  values={emails}
                  onChange={setEmails}
                  placeholder="Type an email and press Enter"
                  helper="If there are more than 1, click ‘Enter’ after each"
                  inputType="email"
                />

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1C1B20]">
                    Address<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Address"
                    className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#15BA5C] transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1C1B20]">
                    Tax Number<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    placeholder="Enter Tax Number"
                    className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#15BA5C] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#1C1B20]">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Leave a note"
                  className="w-full h-28 p-4 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#15BA5C] transition-all resize-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-[18px] font-bold text-[#1C1B20]">
                  Link Items to your Supplier
                </h3>
                <div className="relative" ref={itemsDropdownRef}>
                  <input
                    type="text"
                    value={itemSearchTerm}
                    onChange={(e) => setItemSearchTerm(e.target.value)}
                    placeholder="Search for an Item"
                    className="w-full h-12 px-4 pr-12 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#15BA5C] transition-all placeholder:text-gray-400"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="size-5" />
                  </div>

                  {itemSearchTerm.trim() && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-[210]">
                      {isLoadingItems ? (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          Loading...
                        </div>
                      ) : filteredItems.length > 0 ? (
                        filteredItems.map((it) => (
                          <button
                            key={it.inventoryItemId}
                            type="button"
                            onClick={() => addSupplyItem(it)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                          >
                            <span className="text-sm font-medium text-gray-900">
                              {it.itemName}
                            </span>
                            <span className="text-xs text-gray-400">
                              {it.category || ""}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          No matching items
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#F9FAFB]">
                      <tr>
                        <th className="px-6 py-4 text-[13px] font-semibold text-[#6B7280]">
                          Item
                        </th>
                        <th className="px-6 py-4 text-[13px] font-semibold text-[#6B7280]">
                          Category
                        </th>
                        <th className="px-6 py-4 text-[13px] font-semibold text-[#6B7280] text-center">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {linkedItems.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-10">
                            <div className="text-sm text-[#6B7280] text-center">
                              No items linked yet
                            </div>
                          </td>
                        </tr>
                      ) : (
                        linkedItems.map((it) => (
                          <tr key={it.inventoryItemId}>
                            <td className="px-6 py-5 text-[15px] text-[#111827]">
                              {it.itemName}
                            </td>
                            <td className="px-6 py-5 text-[15px] text-[#111827]">
                              {it.category || "-"}
                            </td>
                            <td className="px-6 py-5 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  removeSupplyItem(it.inventoryItemId)
                                }
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center justify-center"
                              >
                                <Trash2 className="size-5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-10 pb-10">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => {
                if (mode === "view") {
                  setMode("edit");
                  setActiveTab("basic");
                  return;
                }
                setIsUpdateConfirmOpen(true);
              }}
              disabled={
                isSaving || isDeleting || (mode === "edit" && !isFormValid)
              }
              className={`h-14 flex-1 rounded-[12px] font-bold text-[16px] transition-colors flex items-center justify-center ${
                mode === "view"
                  ? "bg-[#15BA5C] text-white hover:bg-[#13A652] cursor-pointer"
                  : !isFormValid || isSaving || isDeleting
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-[#15BA5C] text-white hover:bg-[#13A652] cursor-pointer"
              }`}
            >
              {mode === "view" ? (
                "Update Supplier"
              ) : isSaving ? (
                <Loader2 className="size-6 animate-spin" />
              ) : (
                "Update Supplier"
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsDeleteConfirmOpen(true)}
              disabled={isSaving || isDeleting}
              className={`h-14 flex-1 rounded-[12px] font-bold text-[16px] transition-colors flex items-center justify-center gap-2 border ${
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
                  Delete Supplier
                </>
              )}
            </button>
          </div>
        </div>

        {isUpdateConfirmOpen ? (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-[520px] rounded-[20px] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#DCFCE7]">
                  <span className="text-[#15BA5C] text-[28px] font-black">
                    ✓
                  </span>
                </div>

                <h2 className="text-[22px] font-bold text-[#1C1B20]">
                  Update Supplier
                </h2>

                <p className="mt-3 text-[15px] text-[#6B7280] leading-relaxed">
                  You are about to update a Supplier,
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
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-[520px] rounded-[20px] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#FEE2E2]">
                  <AlertTriangle className="h-8 w-8 text-[#EF4444]" />
                </div>

                <h2 className="text-[22px] font-bold text-[#1C1B20]">
                  Delete Supplier
                </h2>

                <p className="mt-3 text-[15px] text-[#6B7280] leading-relaxed">
                  You are about to delete a Supplier,
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

export default ViewAndEditSupplier;
