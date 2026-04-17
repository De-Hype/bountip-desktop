import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FilePlus2,
  Pencil,
  X,
  Check,
  Loader2,
  Trash2,
  Plus,
} from "lucide-react";
import { Dropdown, type DropdownOption } from "@/features/settings/ui/Dropdown";
import useBusinessStore from "@/stores/useBusinessStore";
import useToastStore from "@/stores/toastStore";
import { getCurrencySymbol } from "@/utils/getCurrencySymbol";
import { SYNC_ACTIONS } from "../../../electron/types/action.types";
import ImageHandler from "@/shared/Image/ImageHandler";
import DeleteConfirmModal from "./DeleteConfirmModal";
import EmptyStateAssests from "@/assets/images/empty-state";
import CreateModifier from "./CreateModifier";
import EditModifier from "./EditModifier";

type ProductUpdatePayload = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  preparationArea: string | null;
  price: number | null;
  priceTierId: string[] | null;
  allergens: string[];
  allergenList: { allergies: string[] };
  weight: number | null;
  weightScale: string | null;
  packagingMethod: string[];
  leadTime: number | null;
  availableAtStorefront: 0 | 1;
  createdAtStorefront: 0 | 1;
  isDeleted: 0 | 1;
  isActive: 0 | 1;
  productAvailableStock: number | null;
  productCode: string | null;
  logoUrl: string | null;
  logoHash: string | null;
  outletId: string;
};

type ElectronAPI = {
  createProduct: (payload: any) => Promise<{ id: string }>;
  getSystemDefaults: (key: string, outletId?: string) => Promise<any[]>;
  addSystemDefault: (key: string, data: any, outletId: string) => Promise<any>;
  deleteSystemDefault: (id: string, itemValue?: string) => Promise<void>;
  queueAdd: (op: any) => Promise<void>;
  dbQuery: (sql: string, params: any[]) => Promise<any[]>;
};

const getElectronAPI = (): ElectronAPI | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { electronAPI?: ElectronAPI };
  return w.electronAPI ?? null;
};

type ProductCategory = {
  id: number | string;
  name: string;
};

type PriceTier = {
  id: number | string;
  name: string;
  value: string;
  active: boolean;
  pricingRules?: {
    markupPercentage?: number;
    discountPercentage?: number;
    fixedMarkup?: number;
    fixedDiscount?: number;
  };
};

type PreparationAreaOption = {
  id: number | string;
  name: string;
};

type Allergen = {
  id: number | string;
  name: string;
  selected: boolean;
};

type WeightUnit = {
  id: number | string;
  name: string;
};

type PackagingMethod = {
  id: number | string;
  name: string;
};

type ModifierRow = {
  id: string;
  name: string | null;
  modifierType: string | null;
  modifierMode: string | null;
};

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  preparationArea?: string;
  allergenList?: string | string[];
  isActive: number;
  availableAtStorefront: number;
  logoUrl: string | null;
  weight?: number;
  weightScale?: string;
  packagingMethod?: string | string[];
  leadTime?: number;
  priceTierId?: string | string[];
}

type EditProductProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  product: Product | null;
};

type AddEntityModalProps = {
  isOpen: boolean;
  title?: string;
  fieldLabel?: string;
  fieldPlaceholder?: string;
  submitLabel?: string;
  onClose: () => void;
  onSubmit: (value: string) => void;
};

type ToggleSwitchProps = {
  checked: boolean;
  onToggle: () => void;
};

const ToggleSwitch = ({ checked, onToggle }: ToggleSwitchProps) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={checked ? "Turn off" : "Turn on"}
      title={checked ? "Turn off" : "Turn on"}
      className={`relative inline-flex h-4 w-10 items-center rounded-full transition-colors duration-200 ${
        checked ? "bg-[#15BA5C]" : "bg-[#D1D5DB]"
      }`}
    >
      <span
        className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
};

type ModifierEditOptionRow = {
  id: string;
  name: string;
  amount: string;
  maximumQuantity: string;
};

type EditModifierModalProps = {
  isOpen: boolean;
  modifierId: string | null;
  outletId: string;
  onClose: () => void;
  onSaved: () => void;
};

const sanitizeNumber = (value: string) => value.replace(/[^0-9.]/g, "");

const formatModifierModeLabel = (mode: string | null) => {
  if (!mode) return "";
  if (mode === "SINGLE_CHOICE") return "Single Choice";
  if (mode === "MULTI_CHOICE") return "Multi Choice";
  return mode;
};

const EditModifierModal = ({
  isOpen,
  modifierId,
  outletId,
  onClose,
  onSaved,
}: EditModifierModalProps) => {
  const { showToast } = useToastStore();
  const [isLoading, setIsLoading] = useState(false);
  const [modifierType, setModifierType] = useState<string>("VARIANCE");
  const [modifierMode, setModifierMode] = useState<string>("SINGLE_CHOICE");
  const [groupName, setGroupName] = useState("");
  const [showInPos, setShowInPos] = useState(true);
  const [limitTotalSelection, setLimitTotalSelection] = useState(true);
  const [maximumQuantity, setMaximumQuantity] = useState("");
  const [limitQuantityPerOption, setLimitQuantityPerOption] = useState(false);
  const [options, setOptions] = useState<ModifierEditOptionRow[]>([]);
  const initialSnapshot = useRef<string>("");

  useEffect(() => {
    if (!isOpen) return;
    if (!modifierId) return;
    if (!outletId) return;
    const api = getElectronAPI();
    if (!api?.dbQuery) return;

    setIsLoading(true);
    (async () => {
      try {
        const modifierRows = await api.dbQuery(
          `
            SELECT
              id,
              modifierType,
              modifierMode,
              showInPos,
              name,
              limitTotalSelection,
              maximumQuantity
            FROM modifier
            WHERE id = ? AND outletId = ? AND (deletedAt IS NULL OR deletedAt = '')
            LIMIT 1
          `,
          [modifierId, outletId],
        );
        const modifier = modifierRows?.[0];
        if (!modifier) {
          onClose();
          return;
        }

        const optionRows = await api.dbQuery(
          `
            SELECT id, name, amount, maximumQuantity, limitQuantity
            FROM modifier_option
            WHERE modifierId = ? AND (deletedAt IS NULL OR deletedAt = '')
            ORDER BY COALESCE(updatedAt, createdAt) ASC
          `,
          [modifierId],
        );

        const nextMode = String(modifier.modifierMode || "SINGLE_CHOICE");
        const nextMaxQty =
          modifier.maximumQuantity != null
            ? String(modifier.maximumQuantity)
            : "";
        const nextOptions: ModifierEditOptionRow[] = (optionRows || []).map(
          (r: any) => ({
            id: String(r.id || crypto.randomUUID()),
            name: r.name != null ? String(r.name) : "",
            amount:
              r.amount != null && Number.isFinite(Number(r.amount))
                ? String(r.amount)
                : "",
            maximumQuantity:
              r.maximumQuantity != null &&
              Number.isFinite(Number(r.maximumQuantity))
                ? String(r.maximumQuantity)
                : "",
          }),
        );

        const nextLimitQtyPerOption = (optionRows || []).some(
          (r: any) => Number(r?.limitQuantity || 0) === 1,
        );

        setModifierType(String(modifier.modifierType || "VARIANCE"));
        setModifierMode(nextMode);
        setGroupName(modifier.name != null ? String(modifier.name) : "");
        setShowInPos(Number(modifier.showInPos || 0) === 1);
        setLimitTotalSelection(Number(modifier.limitTotalSelection || 0) === 1);
        setMaximumQuantity(nextMaxQty);
        setLimitQuantityPerOption(nextLimitQtyPerOption);
        setOptions(
          nextOptions.length > 0
            ? nextOptions
            : [
                {
                  id: crypto.randomUUID(),
                  name: "",
                  amount: "",
                  maximumQuantity: "",
                },
              ],
        );

        initialSnapshot.current = JSON.stringify({
          modifierType: String(modifier.modifierType || "VARIANCE"),
          modifierMode: nextMode,
          groupName: modifier.name != null ? String(modifier.name) : "",
          showInPos: Number(modifier.showInPos || 0) === 1,
          limitTotalSelection: Number(modifier.limitTotalSelection || 0) === 1,
          maximumQuantity: nextMaxQty,
          limitQuantityPerOption: nextLimitQtyPerOption,
          options:
            nextOptions.length > 0
              ? nextOptions
              : [{ id: "seed", name: "", amount: "", maximumQuantity: "" }],
        });
      } catch (e) {
        console.error("Failed to load modifier:", e);
        showToast("error", "Failed to load", "Unable to load modifier details");
        onClose();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isOpen, modifierId, onClose, outletId, showToast]);

  const isDirty = useMemo(() => {
    if (!isOpen) return false;
    if (!modifierId) return false;
    return (
      JSON.stringify({
        modifierType,
        modifierMode,
        groupName,
        showInPos,
        limitTotalSelection,
        maximumQuantity,
        limitQuantityPerOption,
        options,
      }) !== initialSnapshot.current
    );
  }, [
    groupName,
    isOpen,
    limitQuantityPerOption,
    limitTotalSelection,
    maximumQuantity,
    modifierId,
    modifierMode,
    modifierType,
    options,
    showInPos,
  ]);

  const canSave = useMemo(() => {
    if (!isDirty) return false;
    if (groupName.trim() === "") return false;
    const hasOption = options.some((o) => o.name.trim() !== "");
    if (!hasOption) return false;
    if (modifierMode !== "MULTI_CHOICE") return true;
    const groupMax = parseFloat(maximumQuantity);
    if (!Number.isFinite(groupMax) || groupMax <= 0) return true;
    if (!limitQuantityPerOption) return true;
    const sum = options.reduce((acc, o) => {
      const optMax = parseFloat(o.maximumQuantity);
      return acc + (Number.isFinite(optMax) ? optMax : 0);
    }, 0);
    if (sum > groupMax) return false;
    return options.every((o) => {
      const optMax = parseFloat(o.maximumQuantity);
      if (!Number.isFinite(optMax)) return true;
      return optMax <= groupMax;
    });
  }, [
    groupName,
    isDirty,
    limitQuantityPerOption,
    maximumQuantity,
    modifierMode,
    options,
  ]);

  const addOption = () => {
    setOptions((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", amount: "", maximumQuantity: "" },
    ]);
  };

  const removeOption = (optionId: string) => {
    setOptions((prev) => {
      const next = prev.filter((o) => o.id !== optionId);
      return next.length > 0
        ? next
        : [
            {
              id: crypto.randomUUID(),
              name: "",
              amount: "",
              maximumQuantity: "",
            },
          ];
    });
  };

  const clearAllOptions = () => {
    setOptions([
      { id: crypto.randomUUID(), name: "", amount: "", maximumQuantity: "" },
    ]);
  };

  const updateOption = (
    optionId: string,
    patch: Partial<ModifierEditOptionRow>,
  ) => {
    setOptions((prev) => {
      const groupMax = parseFloat(maximumQuantity);
      const nextPatch = { ...patch };
      if (nextPatch.maximumQuantity != null) {
        const raw = String(nextPatch.maximumQuantity).trim();
        if (raw === "") {
          nextPatch.maximumQuantity = "";
        } else {
          const parsed = parseFloat(raw);
          nextPatch.maximumQuantity = Number.isFinite(parsed)
            ? String(Math.max(0, parsed))
            : "";
        }
      }

      if (
        modifierMode === "MULTI_CHOICE" &&
        limitQuantityPerOption &&
        Number.isFinite(groupMax) &&
        groupMax > 0 &&
        nextPatch.maximumQuantity != null &&
        nextPatch.maximumQuantity !== ""
      ) {
        const desired = parseFloat(String(nextPatch.maximumQuantity));
        const othersSum = prev.reduce((acc, o) => {
          if (o.id === optionId) return acc;
          const optMax = parseFloat(o.maximumQuantity);
          return acc + (Number.isFinite(optMax) ? optMax : 0);
        }, 0);
        const remaining = Math.max(0, groupMax - othersSum);
        const capped = Math.min(
          Number.isFinite(desired) ? desired : 0,
          remaining,
        );
        nextPatch.maximumQuantity = String(capped);
      } else if (
        modifierMode === "MULTI_CHOICE" &&
        Number.isFinite(groupMax) &&
        groupMax > 0 &&
        nextPatch.maximumQuantity != null &&
        nextPatch.maximumQuantity !== ""
      ) {
        const desired = parseFloat(String(nextPatch.maximumQuantity));
        if (Number.isFinite(desired) && desired > groupMax) {
          nextPatch.maximumQuantity = String(groupMax);
        }
      }

      return prev.map((o) => (o.id === optionId ? { ...o, ...nextPatch } : o));
    });
  };

  const updateMaximumQuantity = (nextValue: string) => {
    const next = sanitizeNumber(nextValue);
    setMaximumQuantity(next);
    const groupMax = parseFloat(next);
    if (!Number.isFinite(groupMax) || groupMax <= 0) return;
    if (modifierMode !== "MULTI_CHOICE") return;

    setOptions((prev) => {
      const cappedOptions = prev.map((o) => {
        const raw = String(o.maximumQuantity ?? "").trim();
        if (raw === "") return o;
        const optMax = parseFloat(raw);
        if (!Number.isFinite(optMax)) return o;
        if (optMax <= groupMax) return o;
        return { ...o, maximumQuantity: String(groupMax) };
      });

      if (!limitQuantityPerOption) return cappedOptions;

      let remaining = groupMax;
      return cappedOptions.map((o) => {
        const raw = String(o.maximumQuantity ?? "").trim();
        if (raw === "" || !Number.isFinite(parseFloat(raw))) return o;
        const optMax = Math.max(0, parseFloat(raw));
        const nextMax = Math.min(optMax, remaining);
        remaining = Math.max(0, remaining - nextMax);
        return { ...o, maximumQuantity: String(nextMax) };
      });
    });
  };

  const handleSave = async () => {
    if (!modifierId) return;
    if (!canSave) return;
    const api = getElectronAPI();
    if (!api?.dbQuery) {
      showToast("error", "Unavailable", "Database API not available");
      return;
    }
    const now = new Date().toISOString();
    try {
      const trimmedName = groupName.trim();
      const groupMaxQty = Number.isFinite(parseFloat(maximumQuantity))
        ? parseFloat(maximumQuantity)
        : 0;

      await api.dbQuery(
        `
          UPDATE modifier
          SET
            name = ?,
            showInPos = ?,
            limitTotalSelection = ?,
            maximumQuantity = ?,
            updatedAt = ?
          WHERE id = ? AND outletId = ?
        `,
        [
          trimmedName,
          showInPos ? 1 : 0,
          modifierMode === "MULTI_CHOICE" ? (limitTotalSelection ? 1 : 0) : 1,
          modifierMode === "MULTI_CHOICE" ? groupMaxQty : 1,
          now,
          modifierId,
          outletId,
        ],
      );

      await api.dbQuery(
        `
          UPDATE modifier_option
          SET deletedAt = ?, updatedAt = ?
          WHERE modifierId = ? AND (deletedAt IS NULL OR deletedAt = '')
        `,
        [now, now, modifierId],
      );

      const liveOptions = options
        .map((o) => ({
          name: o.name.trim(),
          amount: parseFloat(o.amount) || 0,
          maximumQuantity: parseFloat(o.maximumQuantity) || 0,
        }))
        .filter((o) => o.name !== "");

      let remaining = groupMaxQty;
      for (const opt of liveOptions) {
        const cappedOptionMax =
          modifierMode === "MULTI_CHOICE" &&
          limitQuantityPerOption &&
          groupMaxQty > 0
            ? Math.min(opt.maximumQuantity, Math.max(0, remaining))
            : 0;
        if (
          modifierMode === "MULTI_CHOICE" &&
          limitQuantityPerOption &&
          groupMaxQty > 0
        ) {
          remaining = Math.max(0, remaining - cappedOptionMax);
        }
        await api.dbQuery(
          `
            INSERT INTO modifier_option (
              id,
              name,
              amount,
              maximumQuantity,
              limitQuantity,
              modifierId,
              reference,
              recordId,
              version,
              createdAt,
              updatedAt,
              deletedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            crypto.randomUUID(),
            opt.name,
            opt.amount,
            modifierMode === "MULTI_CHOICE" && limitQuantityPerOption
              ? cappedOptionMax
              : 0,
            modifierMode === "MULTI_CHOICE" && limitQuantityPerOption ? 1 : 0,
            modifierId,
            null,
            null,
            0,
            now,
            now,
            null,
          ],
        );
      }

      showToast("success", "Modifier updated", "Changes saved successfully");
      onSaved();
      onClose();
    } catch (e) {
      console.error("Failed to update modifier:", e);
      showToast("error", "Update failed", "Failed to update modifier");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-[920px] rounded-[22px] bg-white shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between px-8 py-7">
          <div>
            <h2 className="text-[22px] font-bold text-[#111827]">
              Edit Modifier
            </h2>
            <div className="mt-1 text-sm text-[#6B7280]">
              {(modifierType || "TYPE") +
                " • " +
                formatModifierModeLabel(modifierMode)}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FEE2E2] text-[#EF4444] cursor-pointer"
            aria-label="Close edit modifier modal"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="h-px w-full bg-[#E5E7EB]" />

        <div className="max-h-[70vh] overflow-y-auto px-8 py-7">
          {isLoading ? (
            <div className="min-h-[280px] flex items-center justify-center text-sm text-gray-500">
              Loading...
            </div>
          ) : (
            <div className="space-y-8">
              <div>
                <div className="text-[16px] font-bold text-[#111827]">
                  Group Name
                </div>
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter a Name for the group"
                  className="mt-3 h-14 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-5 text-[16px] outline-none"
                />
              </div>

              {modifierMode === "MULTI_CHOICE" && (
                <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-8 items-start">
                  <div>
                    <div className="text-[16px] font-bold text-[#111827]">
                      Maximum Quantity
                    </div>
                    <input
                      value={maximumQuantity}
                      onChange={(e) => updateMaximumQuantity(e.target.value)}
                      placeholder="Enter Maximum Qty"
                      className="mt-3 h-14 w-full max-w-[420px] rounded-[14px] border border-[#E5E7EB] bg-white px-5 text-[16px] outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 md:pt-9">
                    <div className="text-[14px] font-medium text-[#111827] leading-snug">
                      Limit total selections from this
                      <br />
                      group
                    </div>
                    <ToggleSwitch
                      checked={limitTotalSelection}
                      onToggle={() => setLimitTotalSelection((v) => !v)}
                    />
                  </div>
                </div>
              )}

              {modifierMode === "MULTI_CHOICE" && (
                <div className="flex items-center justify-between">
                  <div className="text-[14px] font-medium text-[#111827]">
                    Limit quantity per individual
                    <br />
                    option
                  </div>
                  <ToggleSwitch
                    checked={limitQuantityPerOption}
                    onToggle={() => {
                      setLimitQuantityPerOption((v) => !v);
                      if (limitQuantityPerOption) {
                        setOptions((prev) =>
                          prev.map((o) => ({ ...o, maximumQuantity: "" })),
                        );
                      }
                    }}
                  />
                  <span />
                </div>
              )}

              <div className="rounded-[16px] border border-[#E5E7EB] bg-white overflow-hidden">
                <div className="px-6 py-6">
                  <div
                    className={`grid grid-cols-1 gap-6 ${
                      modifierMode === "MULTI_CHOICE"
                        ? "md:grid-cols-3"
                        : "md:grid-cols-2"
                    }`}
                  >
                    <div className="text-[16px] font-bold text-[#111827]">
                      Option Name
                    </div>
                    <div className="text-[16px] font-bold text-[#111827]">
                      Amount
                    </div>
                    {modifierMode === "MULTI_CHOICE" && (
                      <div className="text-[16px] font-bold text-[#111827]">
                        Maximum Quantity
                      </div>
                    )}
                  </div>

                  <div className="mt-4 space-y-6">
                    {options.map((o) => (
                      <div
                        key={o.id}
                        className={`grid grid-cols-1 gap-6 ${
                          modifierMode === "MULTI_CHOICE"
                            ? "md:grid-cols-3"
                            : "md:grid-cols-2"
                        } items-end`}
                      >
                        <input
                          value={o.name}
                          onChange={(e) =>
                            updateOption(o.id, { name: e.target.value })
                          }
                          placeholder="Enter Name"
                          className="h-14 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-5 text-[16px] outline-none"
                        />
                        <div className="flex items-end gap-4">
                          <input
                            value={o.amount}
                            onChange={(e) =>
                              updateOption(o.id, {
                                amount: sanitizeNumber(e.target.value),
                              })
                            }
                            placeholder="0"
                            className="h-14 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-5 text-[16px] outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(o.id)}
                            className="h-12 w-12 rounded-[14px] bg-[#FEE2E2] text-[#EF4444] inline-flex items-center justify-center cursor-pointer"
                            aria-label="Remove option"
                            title="Remove"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                        {modifierMode === "MULTI_CHOICE" && (
                          <input
                            value={o.maximumQuantity}
                            onChange={(e) =>
                              updateOption(o.id, {
                                maximumQuantity: sanitizeNumber(e.target.value),
                              })
                            }
                            placeholder="0"
                            disabled={!limitQuantityPerOption}
                            className={`h-14 w-full rounded-[14px] border border-[#E5E7EB] px-5 text-[16px] outline-none ${
                              limitQuantityPerOption
                                ? "bg-white"
                                : "bg-[#F3F4F6] text-gray-500"
                            }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={addOption}
                      className="text-[#15BA5C] font-semibold inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="h-5 w-5" />
                      Add another option
                    </button>

                    <button
                      type="button"
                      onClick={clearAllOptions}
                      className="text-[#EF4444] font-semibold inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Trash2 className="h-5 w-5" />
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="h-px w-full bg-[#E5E7EB]" />

                <div className="px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-[14px] font-medium text-[#111827]">
                      Show modifier when selling item
                      <br />
                      in point of sales
                    </div>
                    <ToggleSwitch
                      checked={showInPos}
                      onToggle={() => setShowInPos((v) => !v)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {isDirty && (
          <div className="px-8 py-6 border-t border-[#E5E7EB] bg-white">
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className="h-12 w-full rounded-[14px] bg-[#15BA5C] text-white font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#119E4D] transition-colors"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

type DeleteModifierConfirmModalProps = {
  isOpen: boolean;
  modifierName: string;
  onClose: () => void;
  onConfirm: () => void;
};

const DeleteModifierConfirmModal = ({
  isOpen,
  modifierName,
  onClose,
  onConfirm,
}: DeleteModifierConfirmModalProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-[24px] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#FEE2E2]">
            <Trash2 className="h-8 w-8 text-[#EF4444]" />
          </div>

          <h2 className="text-[22px] font-bold text-[#1C1B20]">
            Delete Modifier
          </h2>

          <p className="mt-4 text-[16px] text-[#6B7280] leading-relaxed">
            Are you sure you want to delete "{modifierName}"? This action cannot
            be undone.
          </p>

          <div className="mt-10 flex w-full gap-4">
            <button
              type="button"
              onClick={onClose}
              className="h-14 flex-1 cursor-pointer rounded-full border border-[#D1D5DB] text-[16px] font-bold text-[#4B5563] hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="h-14 flex-1 cursor-pointer rounded-full bg-[#E33629] text-[16px] font-bold text-white hover:bg-[#C52B1F] transition-colors"
            >
              Delete Modifier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AddEntityModal = ({
  isOpen,
  title = "Add item",
  fieldLabel = "Name",
  fieldPlaceholder = "Enter name",
  submitLabel = "Add",
  onClose,
  onSubmit,
}: AddEntityModalProps) => {
  const [value, setValue] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  };

  return (
    <div className="fixed inset-0 z-110 flex items-center justify-center bg-black/40 p-4 sm:p-6 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-[24px] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F4F6] text-[#111827] cursor-pointer hover:bg-[#E5E7EB] transition-colors"
          aria-label="Close add item modal"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-6 sm:px-8 pt-8 pb-6">
          <h2 className="text-lg font-semibold text-[#1C1B20]">{title}</h2>

          <div className="mt-6 space-y-2">
            <p className="text-sm font-medium text-[#111827]">{fieldLabel}</p>
            <input
              type="text"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={fieldPlaceholder}
              className="w-full rounded-[12px] border border-[#E5E7EB] bg-[#FAFAFC] px-4 py-3 text-sm text-[#111827] placeholder-[#A6A6A6] outline-none focus:border-[#15BA5C] focus:ring-1 focus:ring-[#15BA5C] transition-all"
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-[12px] bg-[#15BA5C] px-4 text-sm font-medium text-white cursor-pointer hover:bg-[#13A652] active:scale-[0.98] transition-all"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const EditProduct = ({
  isOpen,
  onClose,
  onSuccess,
  product,
}: EditProductProps) => {
  const { showToast } = useToastStore();
  const [activeTab, setActiveTab] = useState<"basic" | "modifiers">("basic");
  const { selectedOutletId, selectedOutlet } = useBusinessStore();

  const [productName, setProductName] = useState("");
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    number | string | undefined
  >(undefined);
  const [defaultPrice, setDefaultPrice] = useState("");
  const [priceTierEnabled, setPriceTierEnabled] = useState(false);
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([]);
  const [description, setDescription] = useState("");
  const [preparationAreas, setPreparationAreas] = useState<
    PreparationAreaOption[]
  >([]);
  const [selectedPreparationAreaId, setSelectedPreparationAreaId] = useState<
    number | string | undefined
  >(undefined);
  const [leadTimeDays, setLeadTimeDays] = useState("");
  const [leadTimeHours, setLeadTimeHours] = useState("");
  const [leadTimeMinutes, setLeadTimeMinutes] = useState("");
  const [allergensEnabled, setAllergensEnabled] = useState(false);
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [weight, setWeight] = useState("");
  const [weightUnits, setWeightUnits] = useState<WeightUnit[]>([]);
  const [selectedWeightUnitId, setSelectedWeightUnitId] = useState<
    number | string | undefined
  >(undefined);
  const [packagingMethods, setPackagingMethods] = useState<PackagingMethod[]>(
    [],
  );
  const [selectedPackagingMethods, setSelectedPackagingMethods] = useState<
    Record<string, boolean>
  >({});
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const [isModifiersLoading, setIsModifiersLoading] = useState(false);
  const [productModifiers, setProductModifiers] = useState<ModifierRow[]>([]);
  const [isCreateModifierOpen, setIsCreateModifierOpen] = useState(false);
  const [isEditModifierOpen, setIsEditModifierOpen] = useState(false);
  const [editingModifierId, setEditingModifierId] = useState<string | null>(
    null,
  );
  const [isDeleteModifierConfirmOpen, setIsDeleteModifierConfirmOpen] =
    useState(false);
  const [deletingModifierId, setDeletingModifierId] = useState<string | null>(
    null,
  );
  const [isDeletingModifier, setIsDeletingModifier] = useState(false);

  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isAddAllergenModalOpen, setIsAddAllergenModalOpen] = useState(false);
  const [isAddWeightUnitModalOpen, setIsAddWeightUnitModalOpen] =
    useState(false);
  const [isAddPreparationAreaModalOpen, setIsAddPreparationAreaModalOpen] =
    useState(false);

  const currencySymbol = selectedOutlet?.currency
    ? getCurrencySymbol(selectedOutlet.currency)
    : "";

  // Fetch initial data
  const fetchSystemDefaults = async (
    key: string,
    setter: (data: any[]) => void,
  ) => {
    const api = getElectronAPI();
    if (api && selectedOutletId) {
      try {
        const result = await api.getSystemDefaults(key, selectedOutletId);
        const dbItems: any[] = [];

        for (const row of result) {
          try {
            const data = JSON.parse(row.data);
            if (Array.isArray(data)) {
              data.forEach((item: any, index: number) => {
                dbItems.push({
                  id: item.id || `${row.id}-${index}`,
                  name: item.name || item,
                  selected: item.selected ?? false,
                });
              });
            } else if (data?.name || typeof data === "string") {
              dbItems.push({
                id: row.id,
                name: data.name || data,
                selected: data.selected ?? false,
              });
            }
          } catch (e) {
            console.error(`Failed to parse ${key} row data`, row, e);
          }
        }
        setter(dbItems);
      } catch (error) {
        console.error(`Failed to fetch ${key} from DB`, error);
      }
    }
  };

  useEffect(() => {
    const resetState = () => {
      setProductName("");
      setDescription("");
      setLogoUrl(null);
      setDefaultPrice("");
      setWeight("");
      setLeadTimeDays("");
      setLeadTimeHours("");
      setLeadTimeMinutes("");
      setSelectedCategoryId(undefined);
      setSelectedPreparationAreaId(undefined);
      setSelectedWeightUnitId(undefined);
      setAllergens([]);
      setAllergensEnabled(false);
      setPackagingMethods([]);
      setSelectedPackagingMethods({});
      setPriceTiers([]);
      setPriceTierEnabled(false);
      setIsModifiersLoading(false);
      setProductModifiers([]);
      setIsCreateModifierOpen(false);
      setIsEditModifierOpen(false);
      setEditingModifierId(null);
      setIsDeleteModifierConfirmOpen(false);
      setDeletingModifierId(null);
      setIsDeletingModifier(false);
    };

    if (!isOpen) {
      resetState();
      return;
    }

    if (product) {
      // Initialize simple fields
      setProductName(product.name);
      setDefaultPrice(product.price.toString());
      setDescription(product.description || "");
      setLogoUrl(product.logoUrl);
      setWeight(product.weight?.toString() || "");

      if (product.leadTime) {
        const leadTimeSeconds = Number(product.leadTime) || 0;
        const days = Math.floor(leadTimeSeconds / (24 * 60 * 60));
        const hours = Math.floor(
          (leadTimeSeconds % (24 * 60 * 60)) / (60 * 60),
        );
        const minutes = Math.floor((leadTimeSeconds % (60 * 60)) / 60);
        setLeadTimeDays(days > 0 ? days.toString() : "");
        setLeadTimeHours(hours > 0 ? hours.toString() : "");
        setLeadTimeMinutes(minutes > 0 ? minutes.toString() : "");
      }

      const api = getElectronAPI();
      if (api && selectedOutletId) {
        // Fetch and set complex fields
        fetchSystemDefaults("category", (items) => {
          setCategories(items);
          const cat = items.find((c) => c.name === product.category);
          if (cat) setSelectedCategoryId(cat.id);
        });

        fetchSystemDefaults("preparation-area", (items) => {
          setPreparationAreas(items);
          const area = items.find((a) => a.name === product.preparationArea);
          if (area) setSelectedPreparationAreaId(area.id);
        });

        fetchSystemDefaults("weight-scale", (items) => {
          setWeightUnits(items);
          const unit = items.find((u) => u.name === product.weightScale);
          if (unit) setSelectedWeightUnitId(unit.id);
        });

        fetchSystemDefaults("allergens", (items) => {
          const productAllergens = product.allergenList
            ? Array.isArray(product.allergenList)
              ? product.allergenList
              : JSON.parse(product.allergenList as string)
            : [];
          const allItems = items.map((i) => ({
            ...i,
            selected: productAllergens.includes(i.name),
          }));
          setAllergens(allItems);
          if (productAllergens.length > 0) {
            setAllergensEnabled(true);
          }
        });

        fetchSystemDefaults("packaging-method", (items) => {
          setPackagingMethods(items);
          const productMethods = product.packagingMethod
            ? Array.isArray(product.packagingMethod)
              ? product.packagingMethod
              : JSON.parse(product.packagingMethod as string)
            : [];
          const methodMap: Record<string, boolean> = {};
          items.forEach((item) => {
            if (productMethods.includes(item.name)) {
              methodMap[String(item.id)] = true;
            }
          });
          setSelectedPackagingMethods(methodMap);
        });
      }

      // Price Tiers
      if (selectedOutlet?.priceTier) {
        try {
          const parsedTiers =
            typeof selectedOutlet.priceTier === "string"
              ? JSON.parse(selectedOutlet.priceTier)
              : selectedOutlet.priceTier;
          const productTiers = product.priceTierId
            ? Array.isArray(product.priceTierId)
              ? product.priceTierId
              : JSON.parse(product.priceTierId as string)
            : [];

          if (productTiers.length > 0) {
            setPriceTierEnabled(true);
          }

          const tiers = (Array.isArray(parsedTiers) ? parsedTiers : []).map(
            (t: any) => ({
              id: t.id,
              name: t.name,
              value: "",
              active:
                productTiers.includes(String(t.id)) ||
                productTiers.includes(t.name),
              pricingRules: t.pricingRules,
            }),
          );
          setPriceTiers(tiers);
        } catch (e) {
          console.error("Failed to parse price tiers", e);
          setPriceTiers([]);
        }
      }
    }
  }, [isOpen, product, selectedOutletId, selectedOutlet?.priceTier]);

  const refreshModifiers = useCallback(() => {
    if (!isOpen) return;
    if (activeTab !== "modifiers") return;
    if (!product?.id) return;
    if (!selectedOutletId) return;

    const api = getElectronAPI();
    if (!api?.dbQuery) return;

    setIsModifiersLoading(true);
    api
      .dbQuery(
        `
          SELECT id, name, modifierType, modifierMode
          FROM modifier
          WHERE productId = ? AND outletId = ? AND (deletedAt IS NULL OR deletedAt = '')
          ORDER BY COALESCE(updatedAt, createdAt) DESC
        `,
        [product.id, selectedOutletId],
      )
      .then((rows) => {
        setProductModifiers(
          (rows || []).map((r: any) => ({
            id: String(r.id || ""),
            name: r.name != null ? String(r.name) : null,
            modifierType:
              r.modifierType != null ? String(r.modifierType) : null,
            modifierMode:
              r.modifierMode != null ? String(r.modifierMode) : null,
          })),
        );
      })
      .catch((e) => {
        console.error("Failed to load product modifiers:", e);
        setProductModifiers([]);
      })
      .finally(() => setIsModifiersLoading(false));
  }, [activeTab, isOpen, product?.id, selectedOutletId]);

  useEffect(() => {
    refreshModifiers();
  }, [refreshModifiers]);

  const modifierToDelete = useMemo(
    () => productModifiers.find((m) => m.id === deletingModifierId) || null,
    [deletingModifierId, productModifiers],
  );

  const handleDeleteModifier = async () => {
    if (!deletingModifierId) return;
    if (!selectedOutletId) return;
    const api = getElectronAPI();
    if (!api?.dbQuery) return;

    setIsDeleteModifierConfirmOpen(false);
    setIsDeletingModifier(true);
    const now = new Date().toISOString();
    try {
      const modifierRows = await api.dbQuery(
        `
          SELECT *
          FROM modifier
          WHERE id = ? AND outletId = ?
          LIMIT 1
        `,
        [deletingModifierId, selectedOutletId],
      );
      const modifierRecord = modifierRows?.[0] || null;

      const optionRows = await api.dbQuery(
        `
          SELECT *
          FROM modifier_option
          WHERE modifierId = ? AND (deletedAt IS NULL OR deletedAt = '')
        `,
        [deletingModifierId],
      );

      await api.dbQuery(
        `
          UPDATE modifier
          SET deletedAt = ?, updatedAt = ?
          WHERE id = ? AND outletId = ?
        `,
        [now, now, deletingModifierId, selectedOutletId],
      );
      await api.dbQuery(
        `
          UPDATE modifier_option
          SET deletedAt = ?, updatedAt = ?
          WHERE modifierId = ? AND (deletedAt IS NULL OR deletedAt = '')
        `,
        [now, now, deletingModifierId],
      );
      if (api?.queueAdd) {
        if (modifierRecord) {
          await api.queueAdd({
            table: "modifier",
            action: SYNC_ACTIONS.DELETE,
            id: deletingModifierId,
            data: { ...modifierRecord, deletedAt: now, updatedAt: now },
          });
        }
        for (const opt of optionRows || []) {
          await api.queueAdd({
            table: "modifier_option",
            action: SYNC_ACTIONS.DELETE,
            id: opt.id,
            data: { ...opt, deletedAt: now, updatedAt: now },
          });
        }
      }
      showToast("success", "Modifier deleted", "The modifier has been removed");
      setDeletingModifierId(null);
      refreshModifiers();
    } catch (e) {
      console.error("Failed to delete modifier:", e);
      showToast("error", "Delete failed", "Failed to delete modifier");
    } finally {
      setIsDeletingModifier(false);
    }
  };

  const calculateTierPrice = (rules?: PriceTier["pricingRules"]) => {
    const price = parseFloat(defaultPrice);
    if (isNaN(price)) return "0.00";

    let finalPrice = price;
    if (rules) {
      if (rules.markupPercentage)
        finalPrice += price * (Number(rules.markupPercentage) / 100);
      if (rules.fixedMarkup) finalPrice += Number(rules.fixedMarkup);
      if (rules.discountPercentage)
        finalPrice -= price * (Number(rules.discountPercentage) / 100);
      if (rules.fixedDiscount) finalPrice -= Number(rules.fixedDiscount);
    }
    return finalPrice.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const renderPricingRuleBadges = (rules?: PriceTier["pricingRules"]) => {
    if (!rules) return null;
    const badges = [];
    if (rules.markupPercentage)
      badges.push(
        <span
          key="markup-pct"
          className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700"
        >
          +{rules.markupPercentage}% Markup
        </span>,
      );
    if (rules.fixedMarkup)
      badges.push(
        <span
          key="markup-fixed"
          className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700"
        >
          +{currencySymbol}
          {Number(rules.fixedMarkup).toLocaleString("en-US")} Markup
        </span>,
      );
    if (rules.discountPercentage)
      badges.push(
        <span
          key="discount-pct"
          className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700"
        >
          -{rules.discountPercentage}% Discount
        </span>,
      );
    if (rules.fixedDiscount)
      badges.push(
        <span
          key="discount-fixed"
          className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700"
        >
          -{currencySymbol}
          {Number(rules.fixedDiscount).toLocaleString("en-US")} Discount
        </span>,
      );
    return <div className="flex flex-wrap gap-1">{badges}</div>;
  };

  const handleUpdateProduct = async () => {
    const api = getElectronAPI();
    if (!api || !selectedOutletId || !product) return;

    try {
      const dup =
        (await ((window as any).electronAPI?.dbQuery?.(
          "SELECT id FROM product WHERE outletId = ? AND isDeleted = 0 AND LOWER(name) = LOWER(?) AND id != ? LIMIT 1",
          [selectedOutletId, productName.trim(), product.id],
        ) as Promise<any[]>)) || [];
      if (dup.length > 0) {
        showToast(
          "error",
          "Duplicate product",
          "Another product with this name already exists in this outlet.",
        );
        return;
      }
    } catch (e) {
      console.error("Duplicate check failed:", e);
    }

    setIsUpdating(true);
    const selectedCategory = categories.find(
      (c) => c.id === selectedCategoryId,
    );
    const selectedPreparationArea = preparationAreas.find(
      (a) => a.id === selectedPreparationAreaId,
    );
    const selectedPriceTierIds = priceTiers
      .filter((tier) => tier.active)
      .map((tier) => String(tier.id));
    const activePackagingMethods = packagingMethods
      .filter((m) => selectedPackagingMethods[String(m.id)])
      .map((m) => m.name);
    const activeAllergens = allergens
      .filter((a) => a.selected)
      .map((a) => a.name);
    const leadTimeTotalSeconds =
      ((Number(leadTimeDays) || 0) * 24 * 60 +
        (Number(leadTimeHours) || 0) * 60 +
        (Number(leadTimeMinutes) || 0)) *
      60;
    const selectedWeightUnit = weightUnits.find(
      (u) => u.id === selectedWeightUnitId,
    );

    const payload: ProductUpdatePayload = {
      id: product.id,
      name: productName,
      description,
      category: selectedCategory?.name ?? null,
      preparationArea: selectedPreparationArea?.name ?? null,
      price: defaultPrice ? Number(defaultPrice) : null,
      priceTierId: priceTierEnabled ? selectedPriceTierIds : [],
      allergens: activeAllergens,
      allergenList: { allergies: activeAllergens },
      weight: weight ? Number(weight) : null,
      weightScale: selectedWeightUnit?.name ?? null,
      packagingMethod: activePackagingMethods,
      leadTime: leadTimeTotalSeconds || null,
      availableAtStorefront: product.availableAtStorefront as 0 | 1,
      createdAtStorefront: 1 as 1,
      isDeleted: 0 as 0,
      isActive: product.isActive as 0 | 1,
      productAvailableStock: null,
      productCode: null,
      logoUrl: logoUrl,
      logoHash: null,
      outletId: selectedOutletId,
    };

    try {
      await api.createProduct(payload); // Using createProduct for upsert
      showToast(
        "success",
        "Product Updated",
        `${productName} has been updated successfully.`,
      );
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("products:changed"));
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to update product:", error);
      showToast(
        "error",
        "Update Failed",
        "Failed to update product. Please try again.",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteProduct = async () => {
    const api = getElectronAPI();
    if (!api || !selectedOutletId || !product) return;

    setIsDeleteConfirmOpen(false);
    setIsDeleting(true);

    const selectedCategory = categories.find(
      (c) => c.id === selectedCategoryId,
    );
    const selectedPreparationArea = preparationAreas.find(
      (a) => a.id === selectedPreparationAreaId,
    );
    const selectedPriceTierIds = priceTiers
      .filter((tier) => tier.active)
      .map((tier) => String(tier.id));
    const activePackagingMethods = packagingMethods
      .filter((m) => selectedPackagingMethods[String(m.id)])
      .map((m) => m.name);
    const activeAllergens = allergens
      .filter((a) => a.selected)
      .map((a) => a.name);
    const leadTimeTotalSeconds =
      ((Number(leadTimeDays) || 0) * 24 * 60 +
        (Number(leadTimeHours) || 0) * 60 +
        (Number(leadTimeMinutes) || 0)) *
      60;
    const selectedWeightUnit = weightUnits.find(
      (u) => u.id === selectedWeightUnitId,
    );

    const payload: ProductUpdatePayload = {
      id: product.id,
      name: productName,
      description,
      category: selectedCategory?.name ?? null,
      preparationArea: selectedPreparationArea?.name ?? null,
      price: defaultPrice ? Number(defaultPrice) : null,
      priceTierId: priceTierEnabled ? selectedPriceTierIds : [],
      allergens: activeAllergens,
      allergenList: { allergies: activeAllergens },
      weight: weight ? Number(weight) : null,
      weightScale: selectedWeightUnit?.name ?? null,
      packagingMethod: activePackagingMethods,
      leadTime: leadTimeTotalSeconds || null,
      availableAtStorefront: product.availableAtStorefront as 0 | 1,
      createdAtStorefront: 1 as 1,
      isDeleted: 1 as 1, // SET TO DELETED
      isActive: 0 as 0, // DEACTIVATE
      productAvailableStock: null,
      productCode: null,
      logoUrl: logoUrl,
      logoHash: null,
      outletId: selectedOutletId,
    };

    try {
      await api.createProduct(payload); // Using createProduct for upsert
      showToast(
        "success",
        "Product Deleted",
        `${productName} has been deleted successfully.`,
      );
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("products:changed"));
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to delete product:", error);
      showToast(
        "error",
        "Delete Failed",
        "Failed to delete product. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  const handleEntityAdded = async (
    key: string,
    name: string,
    setter: React.Dispatch<React.SetStateAction<any[]>>,
    modalSetter?: (open: boolean) => void,
    extraFields: Record<string, any> = {},
  ) => {
    const api = getElectronAPI();
    if (api && selectedOutletId) {
      try {
        const result = await api.addSystemDefault(
          key,
          [{ name, ...extraFields }],
          selectedOutletId,
        );
        const newItem = { id: result.id, name, ...extraFields };
        await api.queueAdd({
          tableName: "system_default",
          action: SYNC_ACTIONS.CREATE,
          id: result.id,
          data: {
            id: result.id,
            key,
            data: [{ name, ...extraFields }],
            outletId: selectedOutletId,
          },
        });
        setter((prev) => [...prev, newItem]);
        modalSetter?.(false);
        return newItem;
      } catch (error) {
        console.error(`Failed to add ${key} to DB`, error);
      }
    }
  };

  const handleEntityDeleted = async (
    id: string | number,
    setter: React.Dispatch<React.SetStateAction<any[]>>,
  ) => {
    const api = getElectronAPI();
    if (api) {
      try {
        await api.deleteSystemDefault(String(id));
        setter((prev) => prev.filter((item) => item.id !== id));
      } catch (error) {
        console.error("Failed to delete item", error);
      }
    }
  };

  const handleCategoryDelete = (option: DropdownOption) => {
    handleEntityDeleted(option.value, setCategories);
    if (selectedCategoryId === option.value) setSelectedCategoryId(undefined);
  };

  const handleCategoryAdded = async (name: string) => {
    const newItem = await handleEntityAdded(
      "category",
      name,
      setCategories,
      setIsAddCategoryModalOpen,
    );
    if (newItem) setSelectedCategoryId(newItem.id);
  };

  const handleAllergenToggle = (id: number | string) => {
    setAllergens((prev) =>
      prev.map((a) => (a.id === id ? { ...a, selected: !a.selected } : a)),
    );
  };

  const handleAllergenDelete = (id: number | string) =>
    handleEntityDeleted(id, setAllergens);

  const handleAllergenAdded = (name: string) => {
    handleEntityAdded(
      "allergen",
      name,
      setAllergens,
      setIsAddAllergenModalOpen,
      { selected: true },
    );
  };

  const handleWeightUnitDelete = (option: DropdownOption) => {
    handleEntityDeleted(option.value, setWeightUnits);
    if (selectedWeightUnitId === option.value)
      setSelectedWeightUnitId(undefined);
  };

  const handleWeightUnitAdded = async (name: string) => {
    const newItem = await handleEntityAdded(
      "weightUnit",
      name,
      setWeightUnits,
      setIsAddWeightUnitModalOpen,
    );
    if (newItem) setSelectedWeightUnitId(newItem.id);
  };

  const handlePreparationAreaDelete = (option: DropdownOption) => {
    handleEntityDeleted(option.value, setPreparationAreas);
    if (selectedPreparationAreaId === option.value)
      setSelectedPreparationAreaId(undefined);
  };

  const handlePreparationAreaAdded = async (name: string) => {
    const newItem = await handleEntityAdded(
      "preparationArea",
      name,
      setPreparationAreas,
      setIsAddPreparationAreaModalOpen,
    );
    if (newItem) setSelectedPreparationAreaId(newItem.id);
  };

  const handlePackagingMethodDelete = (option: DropdownOption) => {
    handleEntityDeleted(option.value, setPackagingMethods);
    setSelectedPackagingMethods((prev) => {
      const next = { ...prev };
      delete next[option.value];
      return next;
    });
  };

  const handlePackagingMethodAdded = (name: string) =>
    handleEntityAdded("packagingMethod", name, setPackagingMethods);

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40">
      <div className="relative flex h-full w-full max-w-[840px] flex-col rounded-l-[20px] bg-white shadow-2xl">
        <div className="flex items-center justify-between px-8 py-6">
          <h2 className="text-[24px] font-bold text-[#000000]">Edit Product</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FEE2E2] text-[#EF4444] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b border-[#E5E7EB] px-8 pt-4">
            <div className="flex gap-6 text-sm font-medium">
              <button
                type="button"
                onClick={() => setActiveTab("basic")}
                className={`pb-3 ${activeTab === "basic" ? "border-b-2 border-[#15BA5C] text-[#111827]" : "text-[#6B7280]"}`}
              >
                Basic Information
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("modifiers")}
                className={`pb-3 ${activeTab === "modifiers" ? "border-b-2 border-[#15BA5C] text-[#111827]" : "text-[#6B7280]"}`}
              >
                Modifiers
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-8 pb-8 pt-6">
            {activeTab === "basic" ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[15px] font-medium text-[#1C1B20]">
                    Product Name <span className="text-[#EF4444]">*</span>
                  </p>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Enter Product Name"
                    className="w-full rounded-[12px] border border-[#E5E7EB] bg-[#FAFAFC] px-4 py-3 text-sm text-[#111827] outline-none focus:border-[#15BA5C] focus:ring-1 focus:ring-[#15BA5C]"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-[15px] font-medium text-[#1C1B20]">
                    Product Category <span className="text-[#EF4444]">*</span>
                  </p>
                  <Dropdown
                    name="productCategory"
                    options={categories.map((c) => ({
                      value: String(c.id),
                      label: c.name,
                    }))}
                    selectedValue={
                      selectedCategoryId
                        ? String(selectedCategoryId)
                        : undefined
                    }
                    onChange={setSelectedCategoryId}
                    placeholder="Click to select category"
                    className="w-full"
                    allowAddNew
                    onAddNewClick={() => setIsAddCategoryModalOpen(true)}
                    addNewLabel="+"
                    onDeleteOption={handleCategoryDelete}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-[15px] font-medium text-[#1C1B20]">
                    Set Default Selling Price{" "}
                    <span className="text-[#EF4444]">*</span>
                  </p>
                  <div className="flex items-center rounded-[12px] border border-[#E5E7EB] bg-[#FAFAFC] px-4 py-3 text-sm text-[#111827]">
                    <input
                      type="text"
                      value={defaultPrice}
                      onChange={(e) => setDefaultPrice(e.target.value)}
                      placeholder="Enter Selling Price"
                      className="flex-1 bg-transparent outline-none"
                    />
                    <span className="text-xs font-semibold text-[#15BA5C]">
                      {currencySymbol}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[15px] font-medium text-[#1C1B20]">
                        Price Tier
                      </p>
                      <p className="text-xs text-[#6B7280]">
                        Activate price tiers for your selling price
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={priceTierEnabled}
                      onToggle={() => setPriceTierEnabled(!priceTierEnabled)}
                    />
                  </div>
                  {priceTierEnabled && (
                    <div className="space-y-3">
                      {priceTiers.map((tier) => (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() =>
                            setPriceTiers((prev) =>
                              prev.map((t) =>
                                t.id === tier.id
                                  ? { ...t, active: !t.active }
                                  : t,
                              ),
                            )
                          }
                          className={`flex w-full items-center justify-between rounded-[12px] border px-4 py-3 text-left text-sm ${tier.active ? "border-[#15BA5C] bg-white" : "border-[#E5E7EB] bg-white"}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6]">
                              <svg
                                width="32"
                                height="32"
                                viewBox="0 0 32 32"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M16.4997 5.15625L16.177 5.445L4.41349 17.3384L3.70605 18.0479L4.41452 18.7904L14.2114 28.5873L14.9539 29.2958L15.6655 28.5873L27.5558 16.8238L27.8435 16.5V5.15625H16.4997ZM17.3701 7.21875H25.781V15.6296L14.9529 26.3938L6.60593 18.0469L17.3701 7.21875ZM22.6872 9.28125C22.4137 9.28125 22.1514 9.3899 21.958 9.5833C21.7646 9.77669 21.656 10.039 21.656 10.3125C21.656 10.586 21.7646 10.8483 21.958 11.0417C22.1514 11.2351 22.4137 11.3438 22.6872 11.3438C22.9607 11.3438 23.223 11.2351 23.4164 11.0417C23.6098 10.8483 23.7185 10.586 23.7185 10.3125C23.7185 10.039 23.6098 9.77669 23.4164 9.5833C23.223 9.3899 22.9607 9.28125 22.6872 9.28125Z"
                                  fill="#15BA5C"
                                />
                              </svg>
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">
                                  {tier.name}
                                </span>
                                {renderPricingRuleBadges(tier.pricingRules)}
                              </div>
                              <span className="text-sm font-bold text-gray-900">
                                {currencySymbol}
                                {calculateTierPrice(tier.pricingRules)}
                              </span>
                            </div>
                          </div>
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-[4px] border ${tier.active ? "border-[#15BA5C] bg-[#15BA5C]" : "border-[#D1D5DB] bg-white"}`}
                          >
                            {tier.active && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-[15px] font-medium text-[#1C1B20]">
                    Product Description
                  </p>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter Description"
                    rows={4}
                    className="w-full resize-none rounded-[12px] border border-[#E5E7EB] bg-[#FAFAFC] px-4 py-3 text-sm outline-none focus:border-[#15BA5C] focus:ring-1 focus:ring-[#15BA5C]"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-[15px] font-medium text-[#1C1B20]">
                    Preparation Area <span className="text-[#EF4444]">*</span>
                  </p>
                  <Dropdown
                    name="preparationArea"
                    options={preparationAreas.map((a) => ({
                      value: String(a.id),
                      label: a.name,
                    }))}
                    selectedValue={
                      selectedPreparationAreaId
                        ? String(selectedPreparationAreaId)
                        : undefined
                    }
                    onChange={setSelectedPreparationAreaId}
                    placeholder="Select Area"
                    className="w-full"
                    allowAddNew
                    onAddNewClick={() => setIsAddPreparationAreaModalOpen(true)}
                    addNewLabel="+"
                    onDeleteOption={handlePreparationAreaDelete}
                  />
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[15px] font-medium text-[#1C1B20]">
                          Add Allergens
                        </p>
                        <p className="text-xs text-[#6B7280]">
                          Select or add all allergens associated with this
                          Product
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={allergensEnabled}
                        onToggle={() => setAllergensEnabled(!allergensEnabled)}
                      />
                    </div>

                    {allergensEnabled && (
                      <div className="flex flex-wrap gap-3">
                        {allergens.map((a) => (
                          <div
                            key={a.id}
                            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${a.selected ? "border-[#15BA5C] bg-[#ECFDF3] text-[#047857]" : "border-[#E5E7EB] bg-white"}`}
                          >
                            <button
                              type="button"
                              onClick={() => handleAllergenToggle(a.id)}
                            >
                              {a.name}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAllergenDelete(a.id)}
                              className="ml-1 text-[#9CA3AF] hover:text-[#EF4444]"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setIsAddAllergenModalOpen(true)}
                          className="flex items-center gap-2 rounded-full border border-[#15BA5C] px-4 py-2 text-sm text-[#15BA5C]"
                        >
                          <span className="text-base leading-none">+</span>
                          <span>Add</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-[15px] font-medium text-[#1C1B20]">
                      Lead Time <span className="text-[#EF4444]">*</span>
                    </p>
                    <div className="grid gap-3 md:grid-cols-3">
                      {["Days", "Hours", "Minutes"].map((label, i) => {
                        const value =
                          i === 0
                            ? leadTimeDays
                            : i === 1
                              ? leadTimeHours
                              : leadTimeMinutes;
                        const setter =
                          i === 0
                            ? setLeadTimeDays
                            : i === 1
                              ? setLeadTimeHours
                              : setLeadTimeMinutes;
                        return (
                          <div
                            key={label}
                            className="flex items-center rounded-[12px] bg-[#FAFAFC] px-3 py-3 text-sm"
                          >
                            <input
                              type="number"
                              value={value}
                              onChange={(e) => setter(e.target.value)}
                              placeholder={label}
                              className="flex-1 bg-transparent outline-none"
                            />
                            <Check className="h-4 w-4 text-[#9CA3AF]" />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-[15px] font-medium text-[#1C1B20]">
                        Weight
                      </p>
                      <input
                        type="text"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-[12px] border border-[#E5E7EB] bg-[#FAFAFC] px-4 py-3 text-sm outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[15px] font-medium text-[#1C1B20]">
                        Weight Unit of Measure
                      </p>
                      <Dropdown
                        name="weightUnit"
                        options={weightUnits.map((u) => ({
                          value: String(u.id),
                          label: u.name,
                        }))}
                        selectedValue={
                          selectedWeightUnitId
                            ? String(selectedWeightUnitId)
                            : undefined
                        }
                        onChange={setSelectedWeightUnitId}
                        placeholder="Select unit"
                        className="w-full"
                        allowAddNew
                        onAddNewClick={() => setIsAddWeightUnitModalOpen(true)}
                        addNewLabel="+"
                        onDeleteOption={handleWeightUnitDelete}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[15px] font-medium text-[#1C1B20]">
                      Packaging Method
                    </p>
                    <Dropdown
                      name="packagingMethod"
                      mode="checkbox"
                      options={packagingMethods.map((m) => ({
                        value: String(m.id),
                        label: m.name,
                      }))}
                      selectedValues={selectedPackagingMethods}
                      onMultiChange={setSelectedPackagingMethods}
                      placeholder="Select method"
                      className="w-full"
                      allowAddNew
                      onAddNew={handlePackagingMethodAdded}
                      onDeleteOption={handlePackagingMethodDelete}
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-[15px] font-medium text-[#1C1B20]">
                      Product Image
                    </p>
                    <ImageHandler
                      value={logoUrl}
                      onChange={({ url }) => setLogoUrl(url)}
                      label=""
                      className="w-full"
                      previewSize="lg"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    {productModifiers.length > 0 ? (
                      <>
                        <div className="text-[16px] font-semibold text-[#111827]">
                          {productModifiers.length}{" "}
                          {productModifiers.length === 1
                            ? "Modifier"
                            : "Modifiers"}{" "}
                          available, click the button to continue
                        </div>
                        <p className="mt-2 text-sm text-[#737373]">
                          Create different variations for products
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-[20px] font-bold text-[#111827]">
                          Modifiers
                        </h3>
                        <p className="mt-1 text-sm text-[#737373]">
                          Create different variations for products
                        </p>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCreateModifierOpen(true)}
                    className="h-11 px-6 rounded-[12px] bg-[#15BA5C] text-white font-semibold flex items-center gap-2 cursor-pointer hover:bg-[#119E4D] transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    Create a Modifier
                  </button>
                </div>

                {isModifiersLoading ? (
                  <div className="min-h-[52vh] flex items-center justify-center text-sm text-gray-500">
                    Loading...
                  </div>
                ) : productModifiers.length === 0 ? (
                  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
                    <img
                      className="h-[260px] sm:h-[320px] md:h-[360px] object-contain"
                      src={EmptyStateAssests.ProductManagementEmptyState}
                      alt="No Modifiers"
                    />
                    <div className="text-center">
                      <h4 className="text-[22px] font-bold text-[#111827]">
                        No Modifiers
                      </h4>
                      <p className="mt-3 text-[16.5px] text-[#9CA3AF] max-w-[520px] leading-snug">
                        You have no modifiers created, click on the create
                        modifier to get
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {productModifiers.map((m, idx) => (
                      <div key={m.id} className="space-y-3">
                        <div className="text-[14px] font-semibold text-[#111827]">
                          Modifier {idx + 1}
                        </div>
                        <div className="rounded-[18px] border border-[#E5E7EB] bg-white px-6 py-4 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full border border-[#E5E7EB] flex items-center justify-center">
                              <FilePlus2 className="h-5 w-5 text-[#15BA5C]" />
                            </div>
                            <div className="text-[15px] font-semibold text-[#111827]">
                              {(m.name || "Modifier") +
                                " || " +
                                formatModifierModeLabel(m.modifierMode)}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingModifierId(m.id);
                                setIsEditModifierOpen(true);
                              }}
                              className="h-10 px-6 rounded-full bg-[#15BA5C] text-white font-semibold inline-flex items-center gap-2 cursor-pointer hover:bg-[#119E4D] transition-colors"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeletingModifierId(m.id);
                                setIsDeleteModifierConfirmOpen(true);
                              }}
                              disabled={isDeletingModifier}
                              className="h-10 px-6 rounded-full border border-[#EF4444] text-[#EF4444] font-semibold inline-flex items-center gap-2 cursor-pointer hover:bg-[#EF4444] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          {activeTab == "basic" && (
            <div className="flex items-center justify-end gap-3 px-8 py-4 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(true)}
                disabled={isDeleting || isUpdating}
                className={`rounded-[12px] w-full border px-6 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                  isDeleting || isUpdating
                    ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444] hover:text-white cursor-pointer"
                }`}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleUpdateProduct}
                disabled={isDeleting || isUpdating}
                className={`rounded-[12px] w-full px-10 py-3 text-sm font-bold text-white transition-colors flex items-center justify-center gap-2 ${
                  isDeleting || isUpdating
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#15BA5C] hover:bg-[#13A652] cursor-pointer"
                }`}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Update Product
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <CreateModifier
          isOpen={isCreateModifierOpen}
          onClose={() => setIsCreateModifierOpen(false)}
          productId={product?.id || ""}
          outletId={selectedOutletId || ""}
          onCreated={refreshModifiers}
        />

        <EditModifier
          isOpen={isEditModifierOpen}
          modifierId={editingModifierId}
          outletId={selectedOutletId || ""}
          productId={product?.id || ""}
          onClose={() => {
            setIsEditModifierOpen(false);
            setEditingModifierId(null);
          }}
          onSaved={refreshModifiers}
        />

        <DeleteModifierConfirmModal
          isOpen={isDeleteModifierConfirmOpen}
          modifierName={modifierToDelete?.name || "Modifier"}
          onClose={() => {
            setIsDeleteModifierConfirmOpen(false);
            setDeletingModifierId(null);
          }}
          onConfirm={handleDeleteModifier}
        />

        <AddEntityModal
          isOpen={isAddCategoryModalOpen}
          onClose={() => setIsAddCategoryModalOpen(false)}
          title="Add Product Category"
          fieldLabel="Category Name"
          fieldPlaceholder="Enter the name of the category"
          submitLabel="Add Category"
          onSubmit={handleCategoryAdded}
        />
        <AddEntityModal
          isOpen={isAddAllergenModalOpen}
          onClose={() => setIsAddAllergenModalOpen(false)}
          title="Add Allergen"
          fieldLabel="Allergen Name"
          fieldPlaceholder="Enter the name of the allergen"
          submitLabel="Add Allergen"
          onSubmit={handleAllergenAdded}
        />
        <AddEntityModal
          isOpen={isAddWeightUnitModalOpen}
          onClose={() => setIsAddWeightUnitModalOpen(false)}
          title="Add Weight Unit"
          fieldLabel="Unit Name"
          fieldPlaceholder="Enter unit name"
          submitLabel="Add Unit"
          onSubmit={handleWeightUnitAdded}
        />
        <AddEntityModal
          isOpen={isAddPreparationAreaModalOpen}
          onClose={() => setIsAddPreparationAreaModalOpen(false)}
          title="Add Preparation Area"
          fieldLabel="Area Name"
          fieldPlaceholder="Enter the name of the preparation area"
          submitLabel="Add Area"
          onSubmit={handlePreparationAreaAdded}
        />

        <DeleteConfirmModal
          isOpen={isDeleteConfirmOpen}
          onClose={() => setIsDeleteConfirmOpen(false)}
          onConfirm={handleDeleteProduct}
          productName={productName}
        />
      </div>
    </div>
  );
};

export default EditProduct;
