"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2, X } from "lucide-react";
import useToastStore from "@/stores/toastStore";
import { SYNC_ACTIONS } from "../../../electron/types/action.types";

type EditModifierProps = {
  isOpen: boolean;
  onClose: () => void;
  modifierId: string | null;
  outletId: string;
  productId: string;
  onSaved?: () => void;
};

type ModifierType = "VARIANCE" | "ADD_ON";
type ModifierMode = "SINGLE_CHOICE" | "MULTI_CHOICE";

type VariantOptionRow = {
  id: string;
  name: string;
  amount: string;
};

type VariantGroup = {
  id: string;
  groupName: string;
  showInPos: boolean;
  options: VariantOptionRow[];
};

type MultiChoiceOptionRow = {
  id: string;
  name: string;
  amount: string;
  maximumQuantity: string;
};

type MultiChoiceGroup = {
  id: string;
  groupName: string;
  limitTotalSelection: boolean;
  maximumQuantity: string;
  limitQuantityPerOption: boolean;
  showInPos: boolean;
  options: MultiChoiceOptionRow[];
};

const sanitizeNumber = (value: string) => value.replace(/[^0-9.]/g, "");

const ToggleSwitch = ({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) => {
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

const EditModifier = ({
  isOpen,
  onClose,
  modifierId,
  outletId,
  productId,
  onSaved,
}: EditModifierProps) => {
  const { showToast } = useToastStore();
  const [isLoading, setIsLoading] = useState(false);

  const [modifierType, setModifierType] = useState<ModifierType>("VARIANCE");
  const [modifierMode, setModifierMode] =
    useState<ModifierMode>("SINGLE_CHOICE");

  const [isSingleChoiceOpen, setIsSingleChoiceOpen] = useState(false);
  const [isMultiChoiceOpen, setIsMultiChoiceOpen] = useState(false);

  const [variantGroups, setVariantGroups] = useState<VariantGroup[]>([]);
  const [multiChoiceGroups, setMultiChoiceGroups] = useState<
    MultiChoiceGroup[]
  >([]);

  const initialSnapshot = useRef<string>("");

  const helperText = useMemo(() => {
    if (modifierType === "VARIANCE") {
      return (
        <>
          <span className="font-semibold text-[#111827]">Variants:</span> offer
          you a choice between different versions of the same item. For example,
          a coffee shop might offer small, medium, and large sizes of coffee as
          variants.
        </>
      );
    }
    return (
      <>
        <span className="font-semibold text-[#111827]">Add-ons: </span>
        allows you to enhance your order by adding extra ingredients or
        toppings. For example, a burger restaurant might offer add-ons such as
        cheese, bacon, or avocado.
      </>
    );
  }, [modifierType]);

  useEffect(() => {
    if (!isOpen) return;
    setIsSingleChoiceOpen(false);
    setIsMultiChoiceOpen(false);

    const baseGroup: VariantGroup = {
      id: crypto.randomUUID(),
      groupName: "",
      showInPos: true,
      options: [
        { id: crypto.randomUUID(), name: "", amount: "" },
        { id: crypto.randomUUID(), name: "", amount: "" },
      ],
    };
    const baseMultiGroup: MultiChoiceGroup = {
      id: crypto.randomUUID(),
      groupName: "",
      limitTotalSelection: true,
      maximumQuantity: "",
      limitQuantityPerOption: false,
      showInPos: true,
      options: [
        { id: crypto.randomUUID(), name: "", amount: "", maximumQuantity: "" },
      ],
    };
    setVariantGroups([baseGroup]);
    setMultiChoiceGroups([baseMultiGroup]);
    initialSnapshot.current = "";
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!modifierId) return;
    if (!outletId) return;
    const api: any = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    setIsLoading(true);
    (async () => {
      try {
        const rows = await api.dbQuery(
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
        const mod = rows?.[0];
        if (!mod) {
          showToast("error", "Not found", "Modifier not found");
          onClose();
          return;
        }

        const optRows = await api.dbQuery(
          `
            SELECT id, name, amount, maximumQuantity, limitQuantity
            FROM modifier_option
            WHERE modifierId = ? AND (deletedAt IS NULL OR deletedAt = '')
            ORDER BY COALESCE(updatedAt, createdAt) ASC
          `,
          [modifierId],
        );

        const nextType: ModifierType =
          String(mod.modifierType || "VARIANCE") === "ADD_ON"
            ? "ADD_ON"
            : "VARIANCE";
        const nextMode: ModifierMode =
          String(mod.modifierMode || "SINGLE_CHOICE") === "MULTI_CHOICE"
            ? "MULTI_CHOICE"
            : "SINGLE_CHOICE";

        setModifierType(nextType);
        setModifierMode(nextMode);
        setIsSingleChoiceOpen(nextMode === "SINGLE_CHOICE");
        setIsMultiChoiceOpen(nextMode === "MULTI_CHOICE");

        const name = mod.name != null ? String(mod.name) : "";
        const showInPos = Number(mod.showInPos || 0) === 1;
        const limitTotalSelection = Number(mod.limitTotalSelection || 0) === 1;
        const maximumQuantity =
          mod.maximumQuantity != null ? String(mod.maximumQuantity) : "";
        const limitQuantityPerOption = (optRows || []).some(
          (r: any) => Number(r?.limitQuantity || 0) === 1,
        );

        if (nextMode === "SINGLE_CHOICE") {
          const options: VariantOptionRow[] = (optRows || []).map((r: any) => ({
            id: crypto.randomUUID(),
            name: r.name != null ? String(r.name) : "",
            amount:
              r.amount != null && Number.isFinite(Number(r.amount))
                ? String(r.amount)
                : "",
          }));
          const g: VariantGroup = {
            id: crypto.randomUUID(),
            groupName: name,
            showInPos,
            options:
              options.length > 0
                ? options
                : [
                    { id: crypto.randomUUID(), name: "", amount: "" },
                    { id: crypto.randomUUID(), name: "", amount: "" },
                  ],
          };
          setVariantGroups([g]);
          initialSnapshot.current = JSON.stringify({
            modifierType: nextType,
            modifierMode: nextMode,
            variantGroups: [g],
            multiChoiceGroups: [],
          });
        } else {
          const options: MultiChoiceOptionRow[] = (optRows || []).map(
            (r: any) => ({
              id: crypto.randomUUID(),
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
          const g: MultiChoiceGroup = {
            id: crypto.randomUUID(),
            groupName: name,
            limitTotalSelection,
            maximumQuantity,
            limitQuantityPerOption,
            showInPos,
            options:
              options.length > 0
                ? options
                : [
                    {
                      id: crypto.randomUUID(),
                      name: "",
                      amount: "",
                      maximumQuantity: "",
                    },
                  ],
          };
          setMultiChoiceGroups([g]);
          initialSnapshot.current = JSON.stringify({
            modifierType: nextType,
            modifierMode: nextMode,
            variantGroups: [],
            multiChoiceGroups: [g],
          });
        }
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
    if (!initialSnapshot.current) return false;
    return (
      JSON.stringify({
        modifierType,
        modifierMode,
        variantGroups,
        multiChoiceGroups,
      }) !== initialSnapshot.current
    );
  }, [
    isOpen,
    modifierId,
    modifierMode,
    modifierType,
    multiChoiceGroups,
    variantGroups,
  ]);

  const canSave = useMemo(() => {
    if (!isDirty) return false;
    if (modifierMode === "SINGLE_CHOICE") {
      return variantGroups.some((g) => {
        const hasName = g.groupName.trim() !== "";
        const hasOption = g.options.some((o) => o.name.trim() !== "");
        return hasName && hasOption;
      });
    }
    return multiChoiceGroups.some((g) => {
      const hasName = g.groupName.trim() !== "";
      const hasOption = g.options.some((o) => o.name.trim() !== "");
      if (!hasName || !hasOption) return false;
      const groupMax = parseFloat(g.maximumQuantity);
      if (!Number.isFinite(groupMax) || groupMax <= 0) return true;
      if (!g.limitQuantityPerOption) return true;
      const sum = g.options.reduce((acc, o) => {
        const optMax = parseFloat(o.maximumQuantity);
        return acc + (Number.isFinite(optMax) ? optMax : 0);
      }, 0);
      if (sum > groupMax) return false;
      return g.options.every((o) => {
        const optMax = parseFloat(o.maximumQuantity);
        if (!Number.isFinite(optMax)) return true;
        return optMax <= groupMax;
      });
    });
  }, [isDirty, modifierMode, multiChoiceGroups, variantGroups]);

  const addVariantOption = (groupId: string) => {
    setVariantGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          options: [
            ...g.options,
            { id: crypto.randomUUID(), name: "", amount: "" },
          ],
        };
      }),
    );
  };

  const updateVariantGroup = (
    groupId: string,
    patch: Partial<VariantGroup>,
  ) => {
    setVariantGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, ...patch } : g)),
    );
  };

  const updateVariantOption = (
    groupId: string,
    optionId: string,
    patch: Partial<VariantOptionRow>,
  ) => {
    setVariantGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          options: g.options.map((o) =>
            o.id === optionId ? { ...o, ...patch } : o,
          ),
        };
      }),
    );
  };

  const removeVariantOption = (groupId: string, optionId: string) => {
    setVariantGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const next = g.options.filter((o) => o.id !== optionId);
        return {
          ...g,
          options:
            next.length > 0
              ? next
              : [{ id: crypto.randomUUID(), name: "", amount: "" }],
        };
      }),
    );
  };

  const clearVariantOptions = (groupId: string) => {
    setVariantGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          options: [
            { id: crypto.randomUUID(), name: "", amount: "" },
            { id: crypto.randomUUID(), name: "", amount: "" },
          ],
        };
      }),
    );
  };

  const updateMultiChoiceGroup = (
    groupId: string,
    patch: Partial<MultiChoiceGroup>,
  ) => {
    setMultiChoiceGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const next = { ...g, ...patch };
        const groupMax = parseFloat(next.maximumQuantity);
        if (!Number.isFinite(groupMax) || groupMax <= 0) return next;

        const cappedOptions = next.options.map((o) => {
          const raw = String(o.maximumQuantity ?? "").trim();
          if (raw === "") return o;
          const optMax = parseFloat(raw);
          if (!Number.isFinite(optMax)) return o;
          if (optMax <= groupMax) return o;
          return { ...o, maximumQuantity: String(groupMax) };
        });

        if (!next.limitQuantityPerOption) {
          return { ...next, options: cappedOptions };
        }

        let remaining = groupMax;
        const sumCapped = cappedOptions.map((o) => {
          const raw = String(o.maximumQuantity ?? "").trim();
          if (raw === "" || !Number.isFinite(parseFloat(raw))) return o;
          const optMax = Math.max(0, parseFloat(raw));
          const nextMax = Math.min(optMax, remaining);
          remaining = Math.max(0, remaining - nextMax);
          return { ...o, maximumQuantity: String(nextMax) };
        });

        return { ...next, options: sumCapped };
      }),
    );
  };

  const addMultiChoiceOption = (groupId: string) => {
    setMultiChoiceGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          options: [
            ...g.options,
            {
              id: crypto.randomUUID(),
              name: "",
              amount: "",
              maximumQuantity: "",
            },
          ],
        };
      }),
    );
  };

  const updateMultiChoiceOption = (
    groupId: string,
    optionId: string,
    patch: Partial<MultiChoiceOptionRow>,
  ) => {
    setMultiChoiceGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const groupMax = parseFloat(g.maximumQuantity);
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
          g.limitQuantityPerOption &&
          Number.isFinite(groupMax) &&
          groupMax > 0 &&
          nextPatch.maximumQuantity != null &&
          nextPatch.maximumQuantity !== ""
        ) {
          const desired = parseFloat(String(nextPatch.maximumQuantity));
          const othersSum = g.options.reduce((acc, o) => {
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

        return {
          ...g,
          options: g.options.map((o) =>
            o.id === optionId ? { ...o, ...nextPatch } : o,
          ),
        };
      }),
    );
  };

  const clearMultiChoiceOptions = (groupId: string) => {
    setMultiChoiceGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          options: [
            {
              id: crypto.randomUUID(),
              name: "",
              amount: "",
              maximumQuantity: "",
            },
          ],
        };
      }),
    );
  };

  const createConvertedSingleFromMulti = (
    g: MultiChoiceGroup,
  ): VariantGroup => {
    const options = g.options.map((o) => ({
      id: crypto.randomUUID(),
      name: o.name,
      amount: o.amount,
    }));
    return {
      id: crypto.randomUUID(),
      groupName: g.groupName,
      showInPos: g.showInPos,
      options:
        options.length > 0
          ? options
          : [
              { id: crypto.randomUUID(), name: "", amount: "" },
              { id: crypto.randomUUID(), name: "", amount: "" },
            ],
    };
  };

  const createConvertedMultiFromSingle = (
    g: VariantGroup,
  ): MultiChoiceGroup => {
    const options = g.options.map((o) => ({
      id: crypto.randomUUID(),
      name: o.name,
      amount: o.amount,
      maximumQuantity: "",
    }));
    return {
      id: crypto.randomUUID(),
      groupName: g.groupName,
      limitTotalSelection: true,
      maximumQuantity: "",
      limitQuantityPerOption: false,
      showInPos: g.showInPos,
      options:
        options.length > 0
          ? options
          : [
              {
                id: crypto.randomUUID(),
                name: "",
                amount: "",
                maximumQuantity: "",
              },
            ],
    };
  };

  const switchMode = (nextMode: ModifierMode) => {
    setModifierMode(nextMode);
    if (nextMode === "SINGLE_CHOICE") {
      const current = multiChoiceGroups[0];
      if (current) {
        setVariantGroups([createConvertedSingleFromMulti(current)]);
      }
      setIsSingleChoiceOpen(true);
      setIsMultiChoiceOpen(false);
      return;
    }
    const current = variantGroups[0];
    if (current) {
      setMultiChoiceGroups([createConvertedMultiFromSingle(current)]);
    }
    setIsSingleChoiceOpen(false);
    setIsMultiChoiceOpen(true);
  };

  const saveChanges = async () => {
    if (!modifierId) return;
    const api: any = (window as any).electronAPI;
    if (!api?.dbQuery) {
      showToast("error", "Unavailable", "Database API not available");
      return;
    }

    const now = new Date().toISOString();

    try {
      const existingOptionRows = await api.dbQuery(
        `
          SELECT *
          FROM modifier_option
          WHERE modifierId = ? AND (deletedAt IS NULL OR deletedAt = '')
        `,
        [modifierId],
      );

      if (modifierMode === "SINGLE_CHOICE") {
        const group = variantGroups[0];
        if (!group) return;

        const name = group.groupName.trim();
        const options = group.options
          .map((o) => ({
            name: o.name.trim(),
            amount: parseFloat(o.amount) || 0,
          }))
          .filter((o) => o.name !== "");
        if (!name || options.length === 0) return;

        await api.dbQuery(
          `
            UPDATE modifier
            SET
              modifierType = ?,
              modifierMode = ?,
              showInPos = ?,
              name = ?,
              limitTotalSelection = ?,
              maximumQuantity = ?,
              updatedAt = ?,
              version = COALESCE(version, 0) + 1
            WHERE id = ? AND outletId = ? AND productId = ?
          `,
          [
            modifierType,
            "SINGLE_CHOICE",
            group.showInPos ? 1 : 0,
            name,
            1,
            1,
            now,
            modifierId,
            outletId,
            productId,
          ],
        );
        if (api?.queueAdd) {
          const rows = await api.dbQuery(
            "SELECT * FROM modifier WHERE id = ?",
            [modifierId],
          );
          if (rows?.[0]) {
            await api.queueAdd({
              tableName: "modifier",
              action: SYNC_ACTIONS.UPDATE,
              id: modifierId,
              data: rows[0],
            });
          }
        }

        await api.dbQuery(
          `
            UPDATE modifier_option
            SET deletedAt = ?, updatedAt = ?, version = COALESCE(version, 0) + 1
            WHERE modifierId = ? AND (deletedAt IS NULL OR deletedAt = '')
          `,
          [now, now, modifierId],
        );
        if (api?.queueAdd) {
          for (const opt of existingOptionRows || []) {
            const rows = await api.dbQuery(
              "SELECT * FROM modifier_option WHERE id = ?",
              [opt.id],
            );
            if (!rows?.[0]) continue;
            await api.queueAdd({
              tableName: "modifier_option",
              action: SYNC_ACTIONS.DELETE,
              id: opt.id,
              data: rows[0],
            });
          }
        }

        for (const opt of options) {
          const optionId = crypto.randomUUID();
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
              optionId,
              opt.name,
              opt.amount,
              0,
              0,
              modifierId,
              null,
              null,
              0,
              now,
              now,
              null,
            ],
          );
          if (api?.queueAdd) {
            const rows = await api.dbQuery(
              "SELECT * FROM modifier_option WHERE id = ?",
              [optionId],
            );
            if (!rows?.[0]) continue;
            await api.queueAdd({
              tableName: "modifier_option",
              action: SYNC_ACTIONS.CREATE,
              id: optionId,
              data: rows[0],
            });
          }
        }
      } else {
        const group = multiChoiceGroups[0];
        if (!group) return;

        const name = group.groupName.trim();
        const groupMaxQty = Number.isFinite(parseFloat(group.maximumQuantity))
          ? parseFloat(group.maximumQuantity)
          : 0;
        const options = group.options
          .map((o) => ({
            name: o.name.trim(),
            amount: parseFloat(o.amount) || 0,
            maximumQuantity: parseFloat(o.maximumQuantity) || 0,
          }))
          .filter((o) => o.name !== "");

        if (!name || options.length === 0) return;

        await api.dbQuery(
          `
            UPDATE modifier
            SET
              modifierType = ?,
              modifierMode = ?,
              showInPos = ?,
              name = ?,
              limitTotalSelection = ?,
              maximumQuantity = ?,
              updatedAt = ?,
              version = COALESCE(version, 0) + 1
            WHERE id = ? AND outletId = ? AND productId = ?
          `,
          [
            modifierType,
            "MULTI_CHOICE",
            group.showInPos ? 1 : 0,
            name,
            group.limitTotalSelection ? 1 : 0,
            groupMaxQty,
            now,
            modifierId,
            outletId,
            productId,
          ],
        );
        if (api?.queueAdd) {
          const rows = await api.dbQuery(
            "SELECT * FROM modifier WHERE id = ?",
            [modifierId],
          );
          if (rows?.[0]) {
            await api.queueAdd({
              tableName: "modifier",
              action: SYNC_ACTIONS.UPDATE,
              id: modifierId,
              data: rows[0],
            });
          }
        }

        await api.dbQuery(
          `
            UPDATE modifier_option
            SET deletedAt = ?, updatedAt = ?, version = COALESCE(version, 0) + 1
            WHERE modifierId = ? AND (deletedAt IS NULL OR deletedAt = '')
          `,
          [now, now, modifierId],
        );
        if (api?.queueAdd) {
          for (const opt of existingOptionRows || []) {
            const rows = await api.dbQuery(
              "SELECT * FROM modifier_option WHERE id = ?",
              [opt.id],
            );
            if (!rows?.[0]) continue;
            await api.queueAdd({
              tableName: "modifier_option",
              action: SYNC_ACTIONS.DELETE,
              id: opt.id,
              data: rows[0],
            });
          }
        }

        let remaining = groupMaxQty;
        for (const opt of options) {
          const optionId = crypto.randomUUID();
          const cappedOptionMax =
            group.limitQuantityPerOption && groupMaxQty > 0
              ? Math.min(opt.maximumQuantity, Math.max(0, remaining))
              : 0;
          if (group.limitQuantityPerOption && groupMaxQty > 0) {
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
              optionId,
              opt.name,
              opt.amount,
              group.limitQuantityPerOption ? cappedOptionMax : 0,
              group.limitQuantityPerOption ? 1 : 0,
              modifierId,
              null,
              null,
              0,
              now,
              now,
              null,
            ],
          );
          if (api?.queueAdd) {
            const rows = await api.dbQuery(
              "SELECT * FROM modifier_option WHERE id = ?",
              [optionId],
            );
            if (!rows?.[0]) continue;
            await api.queueAdd({
              tableName: "modifier_option",
              action: SYNC_ACTIONS.CREATE,
              id: optionId,
              data: rows[0],
            });
          }
        }
      }
      showToast("success", "Modifier updated", "Changes saved successfully");
      onSaved?.();
      onClose();
    } catch (e) {
      console.error("Failed to update modifier:", e);
      showToast("error", "Update failed", "Failed to update modifier");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40">
      <div className="absolute inset-y-0 right-0 w-full max-w-[980px] bg-white shadow-2xl flex h-full flex-col">
        <div className="flex items-start justify-between px-10 py-8">
          <div>
            <h2 className="text-[25px] font-bold text-[#111827]">
              Edit Modifier
            </h2>
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

        <div className="flex-1 overflow-y-auto px-10 py-8 pb-28">
          {isLoading ? (
            <div className="min-h-[52vh] flex items-center justify-center text-sm text-gray-500">
              Loading...
            </div>
          ) : (
            <>
              <h3 className="text-[18px] font-bold text-[#111827]">
                Modifier Type <span className="text-[#EF4444]">*</span>
              </h3>

              <div className="mt-6 space-y-5">
                <button
                  type="button"
                  onClick={() => setModifierType("VARIANCE")}
                  className="flex items-center gap-4 cursor-pointer"
                >
                  <span
                    className={`relative flex h-7 w-7 items-center justify-center rounded-full border ${
                      modifierType === "VARIANCE"
                        ? "border-[#15BA5C]"
                        : "border-[#9CA3AF]"
                    }`}
                  >
                    {modifierType === "VARIANCE" && (
                      <span className="h-4 w-4 rounded-full bg-[#15BA5C]" />
                    )}
                  </span>
                  <span className="text-[16px] text-[#111827]">Variance</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModifierType("ADD_ON")}
                  className="flex items-center gap-4 cursor-pointer"
                >
                  <span
                    className={`relative flex h-7 w-7 items-center justify-center rounded-full border ${
                      modifierType === "ADD_ON"
                        ? "border-[#15BA5C]"
                        : "border-[#9CA3AF]"
                    }`}
                  >
                    {modifierType === "ADD_ON" && (
                      <span className="h-4 w-4 rounded-full bg-[#15BA5C]" />
                    )}
                  </span>
                  <span className="text-[16px] text-[#111827]">Add-ons</span>
                </button>
              </div>

              <p className="mt-8 text-[16px] leading-relaxed text-[#9CA3AF]">
                {helperText}
              </p>

              <div className="mt-10">
                <h3 className="text-[18px] font-bold text-[#111827]">
                  Modifier Mode <span className="text-[#EF4444]">*</span>
                </h3>
                <div className="mt-6 space-y-5">
                  <button
                    type="button"
                    onClick={() => switchMode("SINGLE_CHOICE")}
                    className="flex items-center gap-4 cursor-pointer"
                  >
                    <span
                      className={`relative flex h-7 w-7 items-center justify-center rounded-full border ${
                        modifierMode === "SINGLE_CHOICE"
                          ? "border-[#15BA5C]"
                          : "border-[#9CA3AF]"
                      }`}
                    >
                      {modifierMode === "SINGLE_CHOICE" && (
                        <span className="h-4 w-4 rounded-full bg-[#15BA5C]" />
                      )}
                    </span>
                    <span className="text-[16px] text-[#111827]">
                      Single Choice
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => switchMode("MULTI_CHOICE")}
                    className="flex items-center gap-4 cursor-pointer"
                  >
                    <span
                      className={`relative flex h-7 w-7 items-center justify-center rounded-full border ${
                        modifierMode === "MULTI_CHOICE"
                          ? "border-[#15BA5C]"
                          : "border-[#9CA3AF]"
                      }`}
                    >
                      {modifierMode === "MULTI_CHOICE" && (
                        <span className="h-4 w-4 rounded-full bg-[#15BA5C]" />
                      )}
                    </span>
                    <span className="text-[16px] text-[#111827]">
                      Multi Choice
                    </span>
                  </button>
                </div>
              </div>

              <div className="mt-12 space-y-8">
                <button
                  type="button"
                  onClick={() => setIsSingleChoiceOpen((v) => !v)}
                  className="w-full rounded-[16px] bg-[#F9FAFB] px-8 py-6 flex items-center justify-between cursor-pointer"
                >
                  <div className="text-[16px] font-semibold text-[#111827]">
                    {modifierType === "VARIANCE" ? "Variants" : "Add-ons"} -{" "}
                    <span className="text-[#15BA5C]">Single Choice</span>
                  </div>
                  {isSingleChoiceOpen ? (
                    <ChevronDown className="h-5 w-5 text-[#111827]" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-[#111827]" />
                  )}
                </button>

                {isSingleChoiceOpen &&
                  modifierMode === "SINGLE_CHOICE" &&
                  variantGroups.map((g) => (
                    <div
                      key={g.id}
                      className="rounded-[16px] border border-[#E5E7EB] bg-white overflow-hidden"
                    >
                      <div className="px-8 py-8">
                        <div className="text-[18px] font-bold text-[#111827]">
                          Group Name
                        </div>
                        <input
                          value={g.groupName}
                          onChange={(e) =>
                            updateVariantGroup(g.id, {
                              groupName: e.target.value,
                            })
                          }
                          placeholder="Enter a Name for the group, E.g Sizes"
                          className="mt-4 h-14 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-5 text-[16px] outline-none"
                        />

                        <div className="mt-10 space-y-8">
                          {g.options.map((o) => (
                            <div
                              key={o.id}
                              className="grid grid-cols-1 md:grid-cols-[1fr_1fr_44px] gap-6 items-end"
                            >
                              <div>
                                <div className="text-[18px] font-bold text-[#111827]">
                                  Option Name
                                </div>
                                <input
                                  value={o.name}
                                  onChange={(e) =>
                                    updateVariantOption(g.id, o.id, {
                                      name: e.target.value,
                                    })
                                  }
                                  placeholder={
                                    modifierType === "ADD_ON"
                                      ? "Enter Menu Name"
                                      : "Enter Name"
                                  }
                                  className="mt-4 h-14 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-5 text-[16px] outline-none"
                                />
                              </div>

                              <div>
                                <div className="text-[18px] font-bold text-[#111827]">
                                  Amount
                                </div>
                                <input
                                  value={o.amount}
                                  onChange={(e) =>
                                    updateVariantOption(g.id, o.id, {
                                      amount: sanitizeNumber(e.target.value),
                                    })
                                  }
                                  placeholder="0"
                                  className="mt-4 h-14 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-5 text-[16px] outline-none"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => removeVariantOption(g.id, o.id)}
                                className="h-12 w-12 rounded-[14px] bg-[#FEE2E2] text-[#EF4444] inline-flex items-center justify-center cursor-pointer"
                                aria-label="Remove option"
                                title="Remove"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="mt-8 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => addVariantOption(g.id)}
                            className="text-[#15BA5C] font-semibold inline-flex items-center gap-2 cursor-pointer"
                          >
                            <Plus className="h-5 w-5" />
                            Add another option
                          </button>

                          <button
                            type="button"
                            onClick={() => clearVariantOptions(g.id)}
                            className="text-[#EF4444] font-semibold inline-flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 className="h-5 w-5" />
                            Clear All
                          </button>
                        </div>
                      </div>

                      <div className="h-px w-full bg-[#E5E7EB]" />

                      <div className="px-8 py-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-[14px] font-medium text-[#111827]">
                            Show modifier when selling item
                            <br />
                            in point of sales
                          </div>
                          <ToggleSwitch
                            checked={g.showInPos}
                            onToggle={() =>
                              updateVariantGroup(g.id, {
                                showInPos: !g.showInPos,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                <button
                  type="button"
                  onClick={() => setIsMultiChoiceOpen((v) => !v)}
                  className="w-full rounded-[16px] bg-[#F9FAFB] px-8 py-6 flex items-center justify-between cursor-pointer"
                >
                  <div className="text-[16px] font-semibold text-[#111827]">
                    {modifierType === "VARIANCE" ? "Variants" : "Add-ons"} -{" "}
                    <span className="text-[#15BA5C]">Multi Choice</span>
                  </div>
                  {isMultiChoiceOpen ? (
                    <ChevronDown className="h-5 w-5 text-[#111827]" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-[#111827]" />
                  )}
                </button>

                {isMultiChoiceOpen &&
                  modifierMode === "MULTI_CHOICE" &&
                  multiChoiceGroups.map((g) => (
                    <div
                      key={g.id}
                      className="rounded-[16px] border border-[#E5E7EB] bg-white overflow-hidden"
                    >
                      <div className="px-8 py-8">
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-8 items-start">
                          <div>
                            <div className="text-[18px] font-bold text-[#111827]">
                              Group Name
                            </div>
                            <input
                              value={g.groupName}
                              onChange={(e) =>
                                updateMultiChoiceGroup(g.id, {
                                  groupName: e.target.value,
                                })
                              }
                              placeholder="Enter a Name for the group, E.g Sizes"
                              className="mt-4 h-14 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-5 text-[16px] outline-none"
                            />
                          </div>

                          <div className="flex items-center justify-between gap-4 md:pt-9">
                            <div className="text-[14px] font-medium text-[#111827] leading-snug">
                              Limit total selections from this
                              <br />
                              group
                            </div>
                            <ToggleSwitch
                              checked={g.limitTotalSelection}
                              onToggle={() =>
                                updateMultiChoiceGroup(g.id, {
                                  limitTotalSelection: !g.limitTotalSelection,
                                })
                              }
                            />
                          </div>
                        </div>

                        <div className="mt-8">
                          <div className="text-[18px] font-bold text-[#111827]">
                            Maximum Quantity
                          </div>
                          <input
                            value={g.maximumQuantity}
                            onChange={(e) =>
                              updateMultiChoiceGroup(g.id, {
                                maximumQuantity: sanitizeNumber(e.target.value),
                              })
                            }
                            placeholder="Enter Maximum Qty"
                            className="mt-4 h-14 w-full max-w-[420px] rounded-[14px] border border-[#E5E7EB] bg-white px-5 text-[16px] outline-none"
                          />
                        </div>
                      </div>

                      <div className="h-px w-full bg-[#E5E7EB]" />

                      <div className="px-8 py-6 flex items-center justify-between">
                        <div className="text-[14px] font-medium text-[#111827]">
                          Limit quantity per individual
                          <br />
                          option
                        </div>
                        <ToggleSwitch
                          checked={g.limitQuantityPerOption}
                          onToggle={() =>
                            updateMultiChoiceGroup(g.id, {
                              limitQuantityPerOption: !g.limitQuantityPerOption,
                            })
                          }
                        />
                        <span />
                      </div>

                      <div className="px-8 pb-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="text-[18px] font-bold text-[#111827]">
                            Option Name
                          </div>
                          <div className="text-[18px] font-bold text-[#111827]">
                            Amount
                          </div>
                          <div className="text-[18px] font-bold text-[#111827]">
                            Maximum Quantity
                          </div>
                        </div>

                        <div className="mt-4 space-y-6">
                          {g.options.map((o) => (
                            <div
                              key={o.id}
                              className="grid grid-cols-1 md:grid-cols-3 gap-6"
                            >
                              <input
                                value={o.name}
                                onChange={(e) =>
                                  updateMultiChoiceOption(g.id, o.id, {
                                    name: e.target.value,
                                  })
                                }
                                placeholder={
                                  modifierType === "ADD_ON"
                                    ? "Enter Menu Name"
                                    : "Enter Name"
                                }
                                className="h-14 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-5 text-[16px] outline-none"
                              />
                              <input
                                value={o.amount}
                                onChange={(e) =>
                                  updateMultiChoiceOption(g.id, o.id, {
                                    amount: sanitizeNumber(e.target.value),
                                  })
                                }
                                placeholder="0"
                                className="h-14 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-5 text-[16px] outline-none"
                              />
                              <input
                                value={o.maximumQuantity}
                                onChange={(e) =>
                                  updateMultiChoiceOption(g.id, o.id, {
                                    maximumQuantity: sanitizeNumber(
                                      e.target.value,
                                    ),
                                  })
                                }
                                placeholder="0"
                                disabled={!g.limitQuantityPerOption}
                                className={`h-14 w-full rounded-[14px] border border-[#E5E7EB] px-5 text-[16px] outline-none ${
                                  g.limitQuantityPerOption
                                    ? "bg-white"
                                    : "bg-[#F3F4F6] text-gray-500"
                                }`}
                              />
                            </div>
                          ))}
                        </div>

                        <div className="mt-8 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => addMultiChoiceOption(g.id)}
                            className="text-[#15BA5C] font-semibold inline-flex items-center gap-2 cursor-pointer"
                          >
                            <Plus className="h-5 w-5" />
                            Add another option
                          </button>

                          <button
                            type="button"
                            onClick={() => clearMultiChoiceOptions(g.id)}
                            className="text-[#EF4444] font-semibold inline-flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 className="h-5 w-5" />
                            Clear All
                          </button>
                        </div>
                      </div>

                      <div className="h-px w-full bg-[#E5E7EB]" />

                      <div className="px-8 py-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-[14px] font-medium text-[#111827]">
                            Show modifier when selling item
                            <br />
                            in point of sales
                          </div>
                          <ToggleSwitch
                            checked={g.showInPos}
                            onToggle={() =>
                              updateMultiChoiceGroup(g.id, {
                                showInPos: !g.showInPos,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>

        {isDirty && (
          <div className="px-10 py-6 border-t border-[#E5E7EB] bg-white">
            <button
              type="button"
              onClick={saveChanges}
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

export default EditModifier;
