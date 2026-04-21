"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  LayoutGrid,
  Loader2,
  Plus,
  Search,
  Send,
  SlidersHorizontal,
} from "lucide-react";
import NotFound from "../../NotFound";
import useBusinessStore from "@/stores/useBusinessStore";
import useToastStore from "@/stores/toastStore";
import AddSupplierModal from "./tabs/suppliers/AddSupplierModal";
import ViewAndEditSupplier from "./tabs/suppliers/ViewAndEditSupplier";
import SuppliersTable from "./tabs/suppliers/SuppliersTable";
import SupplierListFilter, {
  SupplierFilterState,
} from "./tabs/suppliers/SupplierListFilter";

type ProcurementTabKey = "suppliers" | "purchase_orders" | "re_order";

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

const ProcurementList = () => {
  const { selectedOutlet } = useBusinessStore();
  const { showToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<ProcurementTabKey>("suppliers");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [supplierFilters, setSupplierFilters] = useState<SupplierFilterState>({
    supplierName: "All",
    representatives: "All",
    phoneNumber: "All",
    emailAddress: "All",
  });
  const [filterOptions, setFilterOptions] = useState<{
    suppliers: { value: string; label: string }[];
    reps: { value: string; label: string }[];
    phones: { value: string; label: string }[];
    emails: { value: string; label: string }[];
  }>({
    suppliers: [],
    reps: [],
    phones: [],
    emails: [],
  });

  const [isMoreActionsOpen, setIsMoreActionsOpen] = useState(false);
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isViewSupplierOpen, setIsViewSupplierOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(
    null,
  );
  const [supplierModalMode, setSupplierModalMode] = useState<"view" | "edit">(
    "view",
  );
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const moreActionsRef = useRef<HTMLDivElement>(null);
  const addDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        moreActionsRef.current &&
        !moreActionsRef.current.contains(event.target as Node)
      ) {
        setIsMoreActionsOpen(false);
      }
      if (
        addDropdownRef.current &&
        !addDropdownRef.current.contains(event.target as Node)
      ) {
        setIsAddDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeTab !== "suppliers") setIsFilterOpen(false);
  }, [activeTab]);

  useEffect(() => {
    if (!isFilterOpen) return;
    if (!selectedOutlet?.id) return;
    const api = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    (async () => {
      try {
        const rows = await api.dbQuery(
          `
            SELECT name, representativeName, phoneNumbers, emailAddress
            FROM suppliers
            WHERE outletId = ? AND deletedAt IS NULL
            ORDER BY name ASC
          `,
          [selectedOutlet.id],
        );

        const supplierSet = new Set<string>();
        const repSet = new Set<string>();
        const phoneSet = new Set<string>();
        const emailSet = new Set<string>();

        for (const r of rows || []) {
          const name = String(r.name || "").trim();
          if (name) supplierSet.add(name);

          for (const rep of safeJsonArray(r.representativeName))
            repSet.add(rep);
          for (const p of safeJsonArray(r.phoneNumbers)) phoneSet.add(p);
          for (const e of safeJsonArray(r.emailAddress)) emailSet.add(e);
        }

        const toOptions = (set: Set<string>) =>
          Array.from(set)
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b))
            .map((v) => ({ value: v, label: v }));

        setFilterOptions({
          suppliers: toOptions(supplierSet),
          reps: toOptions(repSet),
          phones: toOptions(phoneSet),
          emails: toOptions(emailSet),
        });
      } catch (err) {
        console.error("Failed to load supplier filter options:", err);
      }
    })();
  }, [isFilterOpen, selectedOutlet?.id]);

  const handleSaveSupplier = useCallback(
    async (supplierData: any) => {
      try {
        if (!selectedOutlet?.id) return;
        const api = (window as any).electronAPI;
        if (!api?.dbQuery) return;

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
            (supplierData.representatives || [])
              .map((r: any) => r.name)
              .filter((name: string) => String(name).trim() !== ""),
          ),
          JSON.stringify(
            (supplierData.phoneNumbers || [])
              .filter((p: any) => String(p?.number || "").trim() !== "")
              .map((p: any) => `${p.country.dialCode}${p.number}`),
          ),
          JSON.stringify(
            (supplierData.emails || [])
              .map((e: any) => e.email)
              .filter((email: string) => String(email).trim() !== ""),
          ),
          supplierData.address,
          id,
          supplierData.notes,
          supplierData.taxNumber,
          now,
          now,
          null,
          selectedOutlet.id,
          null,
          1,
        ]);

        // Link items to supply if any
        if (
          supplierData.itemsToSupply &&
          Array.isArray(supplierData.itemsToSupply)
        ) {
          for (const item of supplierData.itemsToSupply) {
            const siId = crypto.randomUUID();
            await api.dbQuery(
              `
                INSERT INTO supplier_items (
                  id, totalSupplied, createdAt, updatedAt, deletedAt, supplierId, itemId, recordId, version
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              `,
              [siId, 0, now, now, null, id, item.inventoryItemId, null, 1],
            );

            if (api.queueAdd) {
              const siRow = await api.dbQuery(
                "SELECT * FROM supplier_items WHERE id = ?",
                [siId],
              );
              if (siRow?.[0]) {
                await api.queueAdd({
                  table: "supplier_items",
                  action: "CREATE",
                  data: siRow[0],
                  id: siId,
                });
              }
            }
          }
        }

        if (api.queueAdd) {
          const supplierRow = await api.dbQuery(
            "SELECT * FROM suppliers WHERE id = ?",
            [id],
          );
          if (supplierRow?.[0]) {
            await api.queueAdd({
              table: "suppliers",
              action: "CREATE",
              data: supplierRow[0],
              id,
            });
          }
        }

        showToast("success", "Success", "Supplier added successfully");
        setRefreshNonce((n) => n + 1);
      } catch (err) {
        console.error("Failed to save supplier:", err);
        showToast("error", "Error", "Failed to save supplier");
      }
    },
    [selectedOutlet?.id, showToast],
  );

  const handleDeleteSupplier = useCallback(async () => {
    if (!deleteTarget?.id || !selectedOutlet?.id) return;
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
        [now, now, deleteTarget.id, selectedOutlet.id],
      );

      if (api.queueAdd) {
        const row = await api.dbQuery("SELECT * FROM suppliers WHERE id = ?", [
          deleteTarget.id,
        ]);
        if (row?.[0]) {
          await api.queueAdd({
            table: "suppliers",
            action: "UPDATE",
            data: row[0],
            id: deleteTarget.id,
          });
        }
      }

      showToast("success", "Success", "Supplier deleted");
      setIsDeleteConfirmOpen(false);
      setDeleteTarget(null);
      setRefreshNonce((n) => n + 1);
    } catch (err) {
      console.error("Failed to delete supplier:", err);
      showToast("error", "Error", "Failed to delete supplier");
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget?.id, selectedOutlet?.id, showToast]);

  return (
    <div className="w-full space-y-6">
      <div className="bg-[#F3F4F6] rounded-[12px] p-1">
        <div className="grid grid-cols-3 gap-1 w-full">
          <button
            type="button"
            onClick={() => setActiveTab("suppliers")}
            className={`h-10 w-full rounded-[10px] text-[14px] font-medium transition-all flex items-center justify-center ${
              activeTab === "suppliers"
                ? "bg-white text-[#1C1B20] shadow-sm"
                : "text-[#6B7280] hover:text-[#1C1B20]"
            }`}
          >
            Suppliers
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("purchase_orders")}
            className={`h-10 w-full rounded-[10px] text-[14px] font-medium transition-all flex items-center justify-center ${
              activeTab === "purchase_orders"
                ? "bg-white text-[#1C1B20] shadow-sm"
                : "text-[#6B7280] hover:text-[#1C1B20]"
            }`}
          >
            Purchase Orders
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("re_order")}
            className={`h-10 w-full rounded-[10px] text-[14px] font-medium transition-all flex items-center justify-center ${
              activeTab === "re_order"
                ? "bg-white text-[#1C1B20] shadow-sm"
                : "text-[#6B7280] hover:text-[#1C1B20]"
            }`}
          >
            Re-Order
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search"
              className="w-[380px] h-11 px-4 bg-white border border-gray-200 rounded-l-[10px] outline-none focus:border-[#15BA5C] transition-all text-sm placeholder:text-gray-400"
              disabled={activeTab !== "suppliers"}
            />
            <button
              type="button"
              className="h-11 px-4 bg-[#15BA5C] text-white rounded-r-[10px] hover:bg-[#119E4D] transition-colors cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={activeTab !== "suppliers"}
            >
              <Search className="size-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            disabled={activeTab !== "suppliers"}
            className="h-11 px-5 bg-white border border-gray-200 rounded-[10px] text-[14px] font-medium text-[#4B5563] hover:bg-gray-50 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Filters
            <SlidersHorizontal className="size-4 text-gray-400" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative" ref={moreActionsRef}>
            <button
              type="button"
              onClick={() => setIsMoreActionsOpen((v) => !v)}
              className="h-11 px-5 bg-white border border-gray-200 rounded-[10px] text-[14px] font-medium text-[#4B5563] hover:bg-gray-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              More Actions
              <LayoutGrid className="size-4 text-gray-400" />
            </button>

            {isMoreActionsOpen && (
              <div className="absolute top-full right-0 mt-2 w-[200px] bg-[#1C1B20] rounded-[10px] shadow-lg z-100 overflow-hidden py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreActionsOpen(false);
                    showToast(
                      "warning",
                      "Coming soon",
                      "Activity Log is not available yet",
                    );
                  }}
                  className="w-full px-4 py-2.5 text-left text-[14px] text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Activity Log
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreActionsOpen(false);
                    showToast(
                      "warning",
                      "Coming soon",
                      "Approval Log is not available yet",
                    );
                  }}
                  className="w-full px-4 py-2.5 text-left text-[14px] text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Approval Log
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreActionsOpen(false);
                    showToast(
                      "warning",
                      "Coming soon",
                      "Pending Quotes is not available yet",
                    );
                  }}
                  className="w-full px-4 py-2.5 text-left text-[14px] text-white hover:bg-white/10 transition-colors flex items-center justify-between cursor-pointer"
                >
                  Pending Quotes
                  <Send className="size-4 text-white -rotate-45" />
                </button>
              </div>
            )}
          </div>

          <div className="relative" ref={addDropdownRef}>
            <button
              type="button"
              onClick={() => setIsAddDropdownOpen((v) => !v)}
              className="h-11 px-5 bg-[#15BA5C] text-white rounded-[10px] text-[14px] font-medium hover:bg-[#119E4D] transition-all flex items-center gap-2 cursor-pointer"
              disabled={activeTab !== "suppliers"}
            >
              Add New Supplier
              <Plus className="size-4" />
            </button>

            {isAddDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-[220px] bg-[#1C1B20] rounded-[10px] shadow-lg z-100 overflow-hidden py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddDropdownOpen(false);
                    setIsAddSupplierOpen(true);
                  }}
                  className="w-full px-4 py-2.5 text-left text-[14px] text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Add Supplier
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddDropdownOpen(false);
                    showToast(
                      "warning",
                      "Coming soon",
                      "Bulk upload supplier is not available yet",
                    );
                  }}
                  className="w-full px-4 py-2.5 text-left text-[14px] text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Bulk Upload Supplier
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeTab === "suppliers" ? (
        <SuppliersTable
          searchTerm={searchTerm}
          filters={supplierFilters}
          refreshNonce={refreshNonce}
          onAddSupplier={() => setIsAddSupplierOpen(true)}
          onViewSupplier={(id) => {
            setSelectedSupplierId(id);
            setSupplierModalMode("view");
            setIsViewSupplierOpen(true);
          }}
          onEditSupplier={(id) => {
            setSelectedSupplierId(id);
            setSupplierModalMode("edit");
            setIsViewSupplierOpen(true);
          }}
          onDeleteSupplier={(s) => {
            setDeleteTarget(s);
            setIsDeleteConfirmOpen(true);
          }}
        />
      ) : (
        <div className="rounded-[12px] overflow-hidden bg-white">
          <div className="px-6 py-4">
            <NotFound
              title="Coming soon"
              description="This section is not available yet."
            />
          </div>
        </div>
      )}

      <AddSupplierModal
        isOpen={isAddSupplierOpen}
        onClose={() => setIsAddSupplierOpen(false)}
        onSave={handleSaveSupplier}
      />

      <ViewAndEditSupplier
        isOpen={isViewSupplierOpen}
        supplierId={selectedSupplierId}
        initialMode={supplierModalMode}
        onClose={() => {
          setIsViewSupplierOpen(false);
          setSelectedSupplierId(null);
        }}
        onUpdated={() => {
          setRefreshNonce((n) => n + 1);
        }}
      />

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
                You are about to delete{" "}
                <span className="font-semibold text-[#111827]">
                  {deleteTarget?.name || "this Supplier"}
                </span>
                ,<br />
                Do you wish to continue?
              </p>

              <div className="mt-8 flex w-full gap-4">
                <button
                  type="button"
                  onClick={() => {
                    if (isDeleting) return;
                    setIsDeleteConfirmOpen(false);
                    setDeleteTarget(null);
                  }}
                  className="h-12 flex-1 cursor-pointer rounded-full border border-red-500 text-[15px] font-bold text-red-500 hover:bg-red-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSupplier}
                  disabled={isDeleting}
                  className={`h-12 flex-1 rounded-full text-[15px] font-bold text-white transition-colors ${
                    isDeleting
                      ? "bg-gray-200 cursor-not-allowed"
                      : "bg-[#E33629] hover:bg-[#C52B1F] cursor-pointer"
                  }`}
                >
                  {isDeleting ? (
                    <Loader2 className="size-5 animate-spin mx-auto" />
                  ) : (
                    "Yes, Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "suppliers" && (
        <SupplierListFilter
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          initialFilters={supplierFilters}
          supplierOptions={filterOptions.suppliers}
          representativeOptions={filterOptions.reps}
          phoneOptions={filterOptions.phones}
          emailOptions={filterOptions.emails}
          onReset={() =>
            setSupplierFilters({
              supplierName: "All",
              representatives: "All",
              phoneNumber: "All",
              emailAddress: "All",
            })
          }
          onApply={(f) => setSupplierFilters(f)}
        />
      )}
    </div>
  );
};

export default ProcurementList;
