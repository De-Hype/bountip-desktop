"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2, X, Info } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Dropdown } from "@/shared/AppDropdowns/CreateDropdown";
import { useBusinessStore } from "@/stores/useBusinessStore";
import useToastStore from "@/stores/toastStore";
import AddSupplierModal from "../InventoryList/AddSupplierModal";
import { getCurrencySymbol } from "@/utils/getCurrencySymbol";

type InvoiceLine = {
  inventoryItemId: string;
  lotNo: string;
  itemName: string;
  unitOfMeasure: string;
  qtyPurchased: string;
  amountPurchased: string;
  expiryDate?: Date;
};

type LineItemOption = {
  inventoryItemId: string;
  itemName: string;
  itemCode: string | null;
  unitOfPurchase: string | null;
};

type ChargeLine = {
  id: string;
  name: string;
  amount: string;
};

interface CreateAddReceiveProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

const generateLotNo = () =>
  "ITM" + Math.random().toString(36).substring(2, 10).toUpperCase();

const sanitizeNumber = (value: string) => value.replace(/[^0-9.]/g, "");

const CreateAddReceive = ({ onClose, onSuccess }: CreateAddReceiveProps) => {
  const { selectedOutlet } = useBusinessStore();
  const { showToast } = useToastStore();
  const currencySymbol = selectedOutlet?.currency
    ? getCurrencySymbol(selectedOutlet.currency)
    : "₦";
  const formatMoney = (amount: number) => {
    const value = Number.isFinite(amount) ? amount : 0;
    const formatted = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
    return `${currencySymbol}${formatted}`;
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [supplierOptions, setSupplierOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  const [allItems, setAllItems] = useState<LineItemOption[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<InvoiceLine[]>([]);

  const [charges, setCharges] = useState<ChargeLine[]>([]);
  const [taxes, setTaxes] = useState<ChargeLine[]>([]);

  useEffect(() => {
    const api = (window as any).electronAPI;
    if (!api?.dbQuery || !selectedOutlet?.id) return;

    (async () => {
      try {
        const supplierSql =
          "SELECT id, name FROM suppliers WHERE outletId = ? AND deletedAt IS NULL ORDER BY name ASC";
        const supplierRes = await api.dbQuery(supplierSql, [selectedOutlet.id]);
        setSupplierOptions(
          (supplierRes || []).map((s: any) => ({ value: s.id, label: s.name })),
        );
      } catch (err) {
        console.error("Failed to fetch suppliers:", err);
      }
    })();
  }, [selectedOutlet?.id]);

  useEffect(() => {
    const api = (window as any).electronAPI;
    if (!api?.dbQuery || !selectedOutlet?.id) return;

    (async () => {
      try {
        const sql = `
          SELECT
            ii.id as inventoryItemId,
            im.name as itemName,
            im.itemCode as itemCode,
            im.unitOfPurchase as unitOfPurchase
          FROM inventory_item ii
          JOIN inventory i ON ii.inventoryId = i.id
          JOIN item_master im ON ii.itemMasterId = im.id
          WHERE i.outletId = ? AND ii.isDeleted = 0
          ORDER BY im.name ASC
        `;
        const res = await api.dbQuery(sql, [selectedOutlet.id]);
        setAllItems(res || []);
      } catch (err) {
        console.error("Failed to fetch inventory items:", err);
      }
    })();
  }, [selectedOutlet?.id]);

  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return [];
    return allItems
      .filter((it) => {
        const name = (it.itemName || "").toLowerCase();
        const code = (it.itemCode || "").toLowerCase();
        return name.includes(q) || code.includes(q);
      })
      .slice(0, 8);
  }, [allItems, searchTerm]);

  const addItem = (it: LineItemOption) => {
    setSelectedItems((prev) => {
      if (prev.some((p) => p.inventoryItemId === it.inventoryItemId))
        return prev;
      return [
        ...prev,
        {
          inventoryItemId: it.inventoryItemId,
          lotNo: it.itemCode || generateLotNo(),
          itemName: it.itemName,
          unitOfMeasure: it.unitOfPurchase || "-",
          qtyPurchased: "1",
          amountPurchased: "0.00",
          expiryDate: undefined,
        },
      ];
    });
    setSearchTerm("");
  };

  const updateLine = (inventoryItemId: string, patch: Partial<InvoiceLine>) => {
    setSelectedItems((prev) =>
      prev.map((l) =>
        l.inventoryItemId === inventoryItemId ? { ...l, ...patch } : l,
      ),
    );
  };

  const removeLine = (inventoryItemId: string) => {
    setSelectedItems((prev) =>
      prev.filter((l) => l.inventoryItemId !== inventoryItemId),
    );
  };

  const addCharge = () => {
    setCharges((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", amount: "0" },
    ]);
  };

  const addTax = () => {
    setTaxes((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", amount: "0" },
    ]);
  };

  const updateCharge = (
    kind: "charge" | "tax",
    id: string,
    patch: Partial<ChargeLine>,
  ) => {
    const setFn = kind === "charge" ? setCharges : setTaxes;
    setFn((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const removeCharge = (kind: "charge" | "tax", id: string) => {
    const setFn = kind === "charge" ? setCharges : setTaxes;
    setFn((prev) => prev.filter((c) => c.id !== id));
  };

  const subTotal = useMemo(() => {
    return selectedItems.reduce(
      (sum, l) => sum + (parseFloat(l.amountPurchased) || 0),
      0,
    );
  }, [selectedItems]);

  const totalCharges = useMemo(() => {
    return charges.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
  }, [charges]);

  const totalTaxes = useMemo(() => {
    const base = subTotal + totalCharges;
    return taxes.reduce((sum, t) => {
      const rate = parseFloat(t.amount) || 0;
      return sum + base * (rate / 100);
    }, 0);
  }, [taxes, subTotal, totalCharges]);

  const total = useMemo(
    () => subTotal + totalCharges + totalTaxes,
    [subTotal, totalCharges, totalTaxes],
  );

  const isValid =
    invoiceNumber.trim() !== "" &&
    supplierId !== "" &&
    selectedItems.length > 0;

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
        null,
        supplierData.notes,
        supplierData.taxNumber,
        now,
        now,
        null,
        selectedOutlet.id,
        null,
        1,
      ]);

      showToast("success", "Success", "Supplier added successfully");

      const supplierSql =
        "SELECT id, name FROM suppliers WHERE outletId = ? AND deletedAt IS NULL ORDER BY name ASC";
      const supplierRes = await api.dbQuery(supplierSql, [selectedOutlet.id]);
      const options = (supplierRes || []).map((s: any) => ({
        value: s.id,
        label: s.name,
      }));
      setSupplierOptions(options);

      setSupplierId(id);
      setIsSupplierModalOpen(false);
    } catch (err) {
      console.error("Failed to save supplier:", err);
      showToast("error", "Error", "Failed to save supplier");
    }
  };

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      showToast("success", "Submitted", "Invoice submitted successfully");
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error("Failed to submit invoice:", err);
      showToast("error", "Error", "Failed to submit invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white">
        <h2 className="text-[20px] font-bold text-[#1C1B20]">
          Add / Receive Inventory
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors cursor-pointer"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="flex-1 px-8 py-8 space-y-10 overflow-y-auto custom-scrollbar bg-white">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#1C1B20]">
              Invoice Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="Enter invoice Number"
              className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#15BA5C] transition-all text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#1C1B20]">
              Supplier <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <Dropdown
                mode="select"
                placeholder="Click to select Supplier"
                options={supplierOptions}
                selectedValue={supplierId}
                onChange={(val) => setSupplierId(val)}
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

        <div className="space-y-3">
          <label className="text-sm font-semibold text-[#1C1B20]">
            Add Items to the Invoice <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search and add item"
              className="w-full h-12 px-4 border-2 border-[#15BA5C] rounded-xl outline-none text-sm pr-12"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            {filteredItems.length > 0 ? (
              <div className="absolute top-[52px] left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-150">
                {filteredItems.map((it) => (
                  <button
                    key={it.inventoryItemId}
                    type="button"
                    onClick={() => addItem(it)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-[#1C1B20]">
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
        </div>

        <div className="space-y-4">
          <h3 className="text-[16px] font-bold text-[#1C1B20]">
            Selected Items
          </h3>
          <div className="overflow-x-auto border border-gray-100 rounded-xl custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[980px]">
              <thead className="bg-[#F9FAFB]">
                <tr>
                  {[
                    "LOT NO.",
                    "ITEM NAME",
                    "QTY PURCHASED",
                    "UNIT OF MEASURE",
                    "AMOUNT PURCHASED",
                    "COST PER UNIT OF PURCHASE",
                    "EXPIRATION DATE",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-4 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {selectedItems.length > 0 ? (
                  selectedItems.map((l) => {
                    const qty = parseFloat(l.qtyPurchased) || 0;
                    const amt = parseFloat(l.amountPurchased) || 0;
                    const cpu = qty > 0 ? amt / qty : 0;
                    return (
                      <tr key={l.inventoryItemId} className="text-sm">
                        <td className="px-4 py-4 font-medium text-[#1C1B20]">
                          {l.lotNo}
                        </td>
                        <td className="px-4 py-4 font-bold text-[#1C1B20]">
                          {l.itemName}
                        </td>
                        <td className="px-4 py-4">
                          <input
                            type="text"
                            value={l.qtyPurchased}
                            onChange={(e) =>
                              updateLine(l.inventoryItemId, {
                                qtyPurchased: sanitizeNumber(e.target.value),
                              })
                            }
                            className="w-20 h-10 px-3 border border-gray-200 rounded-lg outline-none focus:border-[#15BA5C] transition-all text-sm"
                          />
                        </td>
                        <td className="px-4 py-4 text-gray-600">
                          {l.unitOfMeasure}
                        </td>
                        <td className="px-4 py-4">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                              {currencySymbol}
                            </span>
                            <input
                              type="text"
                              value={l.amountPurchased}
                              onChange={(e) =>
                                updateLine(l.inventoryItemId, {
                                  amountPurchased: sanitizeNumber(
                                    e.target.value,
                                  ),
                                })
                              }
                              className="w-28 h-10 pl-7 pr-3 border border-gray-200 rounded-lg outline-none focus:border-[#15BA5C] transition-all text-sm"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-600 font-medium">
                          {formatMoney(cpu)}
                        </td>
                        <td className="px-4 py-4">
                          <DatePicker
                            date={l.expiryDate}
                            onDateChange={(date) =>
                              updateLine(l.inventoryItemId, {
                                expiryDate: date,
                              })
                            }
                            className="w-[170px] h-10 border-[#E5E7EB] rounded-lg justify-between flex-row-reverse"
                            popoverClassName="z-200"
                            placeholder="DD/MM/YYYY"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => removeLine(l.inventoryItemId)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="size-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-sm text-gray-500"
                    >
                      No items selected
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[16px] font-bold text-[#1C1B20]">
            Additional Charges
          </h3>
          <div className="border border-gray-100 rounded-xl bg-[#F9FAFB]">
            <div className="p-6">
              <button
                type="button"
                onClick={addCharge}
                className="h-11 px-5 border border-[#15BA5C] text-[#15BA5C] rounded-[10px] text-[14px] font-medium hover:bg-green-50 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="size-4" />
                Add Charge
              </button>

              {charges.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {charges.map((c) => (
                    <div
                      key={c.id}
                      className="grid grid-cols-[1fr_1fr_80px_24px] gap-3 items-center"
                    >
                      <input
                        type="text"
                        value={c.name}
                        onChange={(e) =>
                          updateCharge("charge", c.id, { name: e.target.value })
                        }
                        placeholder="Charge name"
                        className="h-11 px-4 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#15BA5C] transition-all text-sm"
                      />
                      <input
                        type="text"
                        value={c.amount}
                        onChange={(e) =>
                          updateCharge("charge", c.id, {
                            amount: sanitizeNumber(e.target.value),
                          })
                        }
                        className="h-11 px-4 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#15BA5C] transition-all text-sm"
                      />
                      <div className="text-sm font-semibold text-gray-700">
                        {formatMoney(parseFloat(c.amount) || 0)}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCharge("charge", c.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <span className="text-sm font-semibold text-[#1C1B20]">
                Total Charges
              </span>
              <div className="bg-[#E5E7EB] px-6 py-2 rounded-lg font-bold text-[#1C1B20]">
                {formatMoney(totalCharges)}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[16px] font-bold text-[#1C1B20]">Taxes</h3>
          <div className="border border-gray-100 rounded-xl bg-[#F9FAFB]">
            <div className="p-6">
              <button
                type="button"
                onClick={addTax}
                className="h-11 px-5 border border-[#15BA5C] text-[#15BA5C] rounded-[10px] text-[14px] font-medium hover:bg-green-50 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="size-4" />
                Add Taxes
              </button>

              {taxes.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {taxes.map((t) => (
                    <div
                      key={t.id}
                      className="grid grid-cols-[1fr_1fr_80px_24px] gap-3 items-center"
                    >
                      <input
                        type="text"
                        value={t.name}
                        onChange={(e) =>
                          updateCharge("tax", t.id, { name: e.target.value })
                        }
                        placeholder="Tax name"
                        className="h-11 px-4 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#15BA5C] transition-all text-sm"
                      />
                      <input
                        type="text"
                        value={t.amount}
                        onChange={(e) =>
                          updateCharge("tax", t.id, {
                            amount: sanitizeNumber(e.target.value),
                          })
                        }
                        className="h-11 px-4 pr-10 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#15BA5C] transition-all text-sm"
                      />
                      <div className="pointer-events-none -ml-10 text-sm font-semibold text-gray-500">
                        %
                      </div>
                      <div className="text-sm font-semibold text-gray-700">
                        {formatMoney(
                          (subTotal + totalCharges) *
                            ((parseFloat(t.amount) || 0) / 100),
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCharge("tax", t.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <span className="text-sm font-semibold text-[#1C1B20]">
                Total Taxes
              </span>
              <div className="bg-[#E5E7EB] px-6 py-2 rounded-lg font-bold text-[#1C1B20]">
                {formatMoney(totalTaxes)}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[16px] font-bold text-[#1C1B20]">
            Amount Summary
          </h3>
          <div className="border border-gray-100 rounded-xl bg-white">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <span className="text-sm text-[#6B7280]">Sub-total</span>
              <div className="bg-[#E5E7EB] px-6 py-2 rounded-lg font-bold text-[#1C1B20]">
                {formatMoney(subTotal)}
              </div>
            </div>
            <div className="flex items-center justify-between px-6 py-5">
              <span className="text-[16px] font-bold text-[#1C1B20]">
                Total
              </span>
              <div className="bg-[#E5E7EB] px-6 py-2 rounded-lg font-bold text-[#1C1B20]">
                {formatMoney(total)}
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={!isValid || isSubmitting}
          onClick={handleSubmit}
          className={`w-full h-14 rounded-xl font-bold text-[15px] transition-colors ${
            isValid && !isSubmitting
              ? "bg-[#15BA5C] text-white hover:bg-[#119E4D] cursor-pointer"
              : "bg-[#D1D5DB] text-white cursor-not-allowed"
          }`}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </div>

      <AddSupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        onSave={handleSaveSupplier}
      />
    </div>
  );
};

export default CreateAddReceive;
