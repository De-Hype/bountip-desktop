"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2, X } from "lucide-react";
import useToastStore from "@/stores/toastStore";
import { SYNC_ACTIONS } from "../../../electron/types/action.types";

type CreateModifierProps = {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  outletId: string;
  onCreated?: () => void;
};

type ModifierType = "VARIANCE" | "ADD_ON";

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

const CreateModifier = ({
  isOpen,
  onClose,
  productId,
  outletId,
  onCreated,
}: CreateModifierProps) => {
  const [modifierType, setModifierType] = useState<ModifierType>("VARIANCE");
  const { showToast } = useToastStore();

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
    initialSnapshot.current = JSON.stringify({
      modifierType,
      variantGroups: [baseGroup],
      multiChoiceGroups: [baseMultiGroup],
    });
  }, [isOpen, modifierType]);

  const isDirty = useMemo(() => {
    if (!isOpen) return false;
    return (
      JSON.stringify({ modifierType, variantGroups, multiChoiceGroups }) !==
      initialSnapshot.current
    );
  }, [isOpen, modifierType, multiChoiceGroups, variantGroups]);

  const canCreate = useMemo(() => {
    if (!isDirty) return false;
    const canCreateSingle = variantGroups.some((g) => {
      const hasName = g.groupName.trim() !== "";
      const hasOption = g.options.some((o) => o.name.trim() !== "");
      return hasName && hasOption;
    });
    const canCreateMulti = multiChoiceGroups.some((g) => {
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
    return canCreateSingle || canCreateMulti;
  }, [isDirty, modifierType, multiChoiceGroups, variantGroups]);

  const addVariantGroup = () => {
    setVariantGroups((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        groupName: "",
        showInPos: true,
        options: [
          { id: crypto.randomUUID(), name: "", amount: "" },
          { id: crypto.randomUUID(), name: "", amount: "" },
        ],
      },
    ]);
  };

  const updateVariantGroup = (
    groupId: string,
    patch: Partial<VariantGroup>,
  ) => {
    setVariantGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, ...patch } : g)),
    );
  };

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

  const addMultiChoiceGroup = () => {
    setMultiChoiceGroups((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        groupName: "",
        limitTotalSelection: true,
        maximumQuantity: "",
        limitQuantityPerOption: false,
        showInPos: true,
        options: [
          {
            id: crypto.randomUUID(),
            name: "",
            amount: "",
            maximumQuantity: "",
          },
        ],
      },
    ]);
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

  const createModifier = async () => {
    const type = modifierType;
    const api: any = (window as any).electronAPI;
    if (!api?.dbQuery) {
      showToast("error", "Unavailable", "Database API not available");
      return;
    }

    const now = new Date().toISOString();

    try {
      for (const group of variantGroups) {
        const name = group.groupName.trim();
        const options = group.options
          .map((o) => ({
            name: o.name.trim(),
            amount: parseFloat(o.amount) || 0,
          }))
          .filter((o) => o.name !== "");

        if (!name || options.length === 0) continue;

        const modifierId = crypto.randomUUID();

        await api.dbQuery(
          `
            INSERT INTO modifier (
              id,
              modifierType,
              modifierMode,
              showInPos,
              name,
              limitTotalSelection,
              maximumQuantity,
              productId,
              outletId,
              reference,
              recordId,
              version,
              createdAt,
              updatedAt,
              deletedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            modifierId,
            type,
            "SINGLE_CHOICE",
            group.showInPos ? 1 : 0,
            name,
            1,
            1,
            productId,
            outletId,
            null,
            null,
            0,
            now,
            now,
            null,
          ],
        );
        if (api?.queueAdd) {
          await api.queueAdd({
            table: "modifier",
            action: SYNC_ACTIONS.CREATE,
            id: modifierId,
            data: {
              id: modifierId,
              modifierType: type,
              modifierMode: "SINGLE_CHOICE",
              showInPos: group.showInPos ? 1 : 0,
              name,
              limitTotalSelection: 1,
              maximumQuantity: 1,
              productId,
              outletId,
              reference: null,
              recordId: null,
              version: 0,
              createdAt: now,
              updatedAt: now,
              deletedAt: null,
            },
          });
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
            await api.queueAdd({
              table: "modifier_option",
              action: SYNC_ACTIONS.CREATE,
              id: optionId,
              data: {
                id: optionId,
                name: opt.name,
                amount: opt.amount,
                maximumQuantity: 0,
                limitQuantity: 0,
                modifierId,
                reference: null,
                recordId: null,
                version: 0,
                createdAt: now,
                updatedAt: now,
                deletedAt: null,
              },
            });
          }
        }
      }

      for (const group of multiChoiceGroups) {
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

        if (!name || options.length === 0) continue;

        const modifierId = crypto.randomUUID();

        await api.dbQuery(
          `
            INSERT INTO modifier (
              id,
              modifierType,
              modifierMode,
              showInPos,
              name,
              limitTotalSelection,
              maximumQuantity,
              productId,
              outletId,
              reference,
              recordId,
              version,
              createdAt,
              updatedAt,
              deletedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            modifierId,
            type,
            "MULTI_CHOICE",
            group.showInPos ? 1 : 0,
            name,
            group.limitTotalSelection ? 1 : 0,
            groupMaxQty,
            productId,
            outletId,
            null,
            null,
            0,
            now,
            now,
            null,
          ],
        );
        if (api?.queueAdd) {
          await api.queueAdd({
            table: "modifier",
            action: SYNC_ACTIONS.CREATE,
            id: modifierId,
            data: {
              id: modifierId,
              modifierType: type,
              modifierMode: "MULTI_CHOICE",
              showInPos: group.showInPos ? 1 : 0,
              name,
              limitTotalSelection: group.limitTotalSelection ? 1 : 0,
              maximumQuantity: groupMaxQty,
              productId,
              outletId,
              reference: null,
              recordId: null,
              version: 0,
              createdAt: now,
              updatedAt: now,
              deletedAt: null,
            },
          });
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
            await api.queueAdd({
              table: "modifier_option",
              action: SYNC_ACTIONS.CREATE,
              id: optionId,
              data: {
                id: optionId,
                name: opt.name,
                amount: opt.amount,
                maximumQuantity: group.limitQuantityPerOption
                  ? cappedOptionMax
                  : 0,
                limitQuantity: group.limitQuantityPerOption ? 1 : 0,
                modifierId,
                reference: null,
                recordId: null,
                version: 0,
                createdAt: now,
                updatedAt: now,
                deletedAt: null,
              },
            });
          }
        }
      }

      showToast(
        "success",
        "Modifier created",
        "Your modifier has been created",
      );
      onCreated?.();
      onClose();
    } catch (e) {
      console.error("Failed to create modifier:", e);
      showToast("error", "Creation failed", "Failed to create modifier");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40">
      <div className="absolute inset-y-0 right-0 w-full max-w-[980px] bg-white shadow-2xl flex h-full flex-col">
        <div className="flex items-start justify-between px-10 py-8">
          <div>
            <h2 className="text-[22px] font-bold text-[#111827]">
              Create a new Modifier
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FEE2E2] text-[#EF4444] cursor-pointer"
            aria-label="Close create modifier modal"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="h-px w-full bg-[#E5E7EB]" />

        <div className="flex-1 overflow-y-auto px-10 py-8 pb-28">
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

          {modifierType === "VARIANCE" && (
            <div className="mt-12 space-y-8">
              <button
                type="button"
                onClick={() => setIsSingleChoiceOpen((v) => !v)}
                className="w-full rounded-[16px] bg-[#F9FAFB] px-8 py-6 flex items-center justify-between cursor-pointer"
              >
                <div className="text-[16px] font-semibold text-[#111827]">
                  Variants -{" "}
                  <span className="text-[#15BA5C]">Single Choice</span>
                </div>
                {isSingleChoiceOpen ? (
                  <ChevronDown className="h-5 w-5 text-[#111827]" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-[#111827]" />
                )}
              </button>

              {isSingleChoiceOpen &&
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
                                placeholder="Enter Name"
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

                      <button
                        type="button"
                        onClick={addVariantGroup}
                        className="h-12 px-8 rounded-[14px] border border-[#15BA5C] text-[#15BA5C] bg-white font-semibold flex items-center gap-2 cursor-pointer hover:bg-[#E9FBF0] transition-colors"
                      >
                        <Plus className="h-5 w-5" />
                        Add Group
                      </button>
                    </div>
                  </div>
                ))}

              <button
                type="button"
                onClick={() => setIsMultiChoiceOpen((v) => !v)}
                className="w-full rounded-[16px] bg-[#F9FAFB] px-8 py-6 flex items-center justify-between cursor-pointer"
              >
                <div className="text-[16px] font-semibold text-[#111827]">
                  Variants -{" "}
                  <span className="text-[#15BA5C]">Multi Choice</span>
                </div>
                {isMultiChoiceOpen ? (
                  <ChevronDown className="h-5 w-5 text-[#111827]" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-[#111827]" />
                )}
              </button>

              {isMultiChoiceOpen &&
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
                              placeholder="Enter Name"
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

                      <button
                        type="button"
                        onClick={addMultiChoiceGroup}
                        className="h-12 px-8 rounded-[14px] border border-[#15BA5C] text-[#15BA5C] bg-white font-semibold flex items-center gap-2 cursor-pointer hover:bg-[#E9FBF0] transition-colors"
                      >
                        <Plus className="h-5 w-5" />
                        Add Group
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {modifierType === "ADD_ON" && (
            <div className="mt-12 space-y-8">
              <button
                type="button"
                onClick={() => setIsSingleChoiceOpen((v) => !v)}
                className="w-full rounded-[16px] bg-[#F9FAFB] px-8 py-6 flex items-center justify-between cursor-pointer"
              >
                <div className="text-[16px] font-semibold text-[#111827]">
                  Add-ons -{" "}
                  <span className="text-[#15BA5C]">Single Choice</span>
                </div>
                {isSingleChoiceOpen ? (
                  <ChevronDown className="h-5 w-5 text-[#111827]" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-[#111827]" />
                )}
              </button>

              {isSingleChoiceOpen &&
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
                        placeholder="Enter a Name for the group, E.g Toppings"
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
                                Select Menu Name
                              </div>
                              <input
                                value={o.name}
                                onChange={(e) =>
                                  updateVariantOption(g.id, o.id, {
                                    name: e.target.value,
                                  })
                                }
                                placeholder="Enter Menu Name"
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

                      <button
                        type="button"
                        onClick={addVariantGroup}
                        className="h-12 px-8 rounded-[14px] border border-[#15BA5C] text-[#15BA5C] bg-white font-semibold flex items-center gap-2 cursor-pointer hover:bg-[#E9FBF0] transition-colors"
                      >
                        <Plus className="h-5 w-5" />
                        Add Group
                      </button>
                    </div>
                  </div>
                ))}

              <button
                type="button"
                onClick={() => setIsMultiChoiceOpen((v) => !v)}
                className="w-full rounded-[16px] bg-[#F9FAFB] px-8 py-6 flex items-center justify-between cursor-pointer"
              >
                <div className="text-[16px] font-semibold text-[#111827]">
                  Add-ons - <span className="text-[#15BA5C]">Multi Choice</span>
                </div>
                {isMultiChoiceOpen ? (
                  <ChevronDown className="h-5 w-5 text-[#111827]" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-[#111827]" />
                )}
              </button>

              {isMultiChoiceOpen &&
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
                            placeholder="Enter a Name for the group, E.g Extras"
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
                          Select Menu Name
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
                              placeholder="Enter Menu Name"
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

                      <button
                        type="button"
                        onClick={addMultiChoiceGroup}
                        className="h-12 px-8 rounded-[14px] border border-[#15BA5C] text-[#15BA5C] bg-white font-semibold flex items-center gap-2 cursor-pointer hover:bg-[#E9FBF0] transition-colors"
                      >
                        <Plus className="h-5 w-5" />
                        Add Group
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {isDirty && (
          <div className="px-10 py-6 border-t border-[#E5E7EB] bg-white">
            <button
              type="button"
              onClick={createModifier}
              disabled={!canCreate}
              className="h-12 w-full rounded-[14px] bg-[#15BA5C] text-white font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#119E4D] transition-colors"
            >
              Create Modifier
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateModifier;
