"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Mail, Printer, Copy, PenLine, X, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { useBusinessStore } from "@/stores/useBusinessStore";
import useToastStore from "@/stores/toastStore";

type DeliveryItemRow = {
  itemNo: string;
  description: string;
  quantityLabel: string;
};

type ViewDeliveryNoteProps = {
  isOpen: boolean;
  onClose: () => void;
  productionId: string | null;
};

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return format(d, "yyyy-MM-dd");
};

const ViewDeliveryNote = ({
  isOpen,
  onClose,
  productionId,
}: ViewDeliveryNoteProps) => {
  const selectedOutlet = useBusinessStore((s) => s.selectedOutlet);
  const { showToast } = useToastStore();

  const [isLoading, setIsLoading] = useState(false);
  const [deliverTo, setDeliverTo] = useState("");
  const [fromAddress, setFromAddress] = useState("");
  const [orderReference, setOrderReference] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [deliveryNo, setDeliveryNo] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [signature, setSignature] = useState("");
  const [signatureDate, setSignatureDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DeliveryItemRow[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const loadDeliveryNote = useCallback(async () => {
    if (!isOpen) return;
    if (!selectedOutlet?.id || !productionId) return;
    const api: any = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    setIsLoading(true);
    try {
      const [productionRow] = await api.dbQuery(
        "SELECT * FROM productions WHERE id = ? AND outletId = ? LIMIT 1",
        [productionId, selectedOutlet.id],
      );

      const piRows = await api.dbQuery(
        "SELECT orderId FROM production_items WHERE productionId = ?",
        [productionId],
      );
      const orderIds = (piRows || [])
        .map((r: any) => r?.orderId)
        .filter(Boolean) as string[];

      let firstOrder: any = null;
      let cartIds: string[] = [];
      if (orderIds.length > 0) {
        const placeholders = orderIds.map(() => "?").join(", ");
        const orders = await api.dbQuery(
          `
            SELECT o.*, c.name as customerName
            FROM orders o
            LEFT JOIN customers c ON c.id = o.customerId
            WHERE o.id IN (${placeholders})
          `,
          orderIds,
        );
        firstOrder = (orders || [])[0] ?? null;
        cartIds = Array.from(
          new Set(
            (orders || [])
              .map((o: any) => o?.cartId || o?.cart_id)
              .filter(Boolean),
          ),
        );
      }

      const defaultFrom =
        selectedOutlet.address ||
        [selectedOutlet.city, selectedOutlet.state, selectedOutlet.country]
          .filter(Boolean)
          .join(", ");
      setFromAddress(String(defaultFrom || ""));

      const batch = productionRow?.batchId || "";
      const sched = productionRow?.scheduleId || "";
      setDeliveryNo(String(batch || sched || productionId));

      const due = productionRow?.productionDueDate || productionRow?.updatedAt;
      setDeliveryDate(formatDate(due) || formatDate(new Date().toISOString()));

      setDeliverTo(String(firstOrder?.address || ""));
      setOrderReference(
        String(firstOrder?.reference || firstOrder?.externalReference || ""),
      );
      setOrderDate(formatDate(firstOrder?.createdAt || ""));
      setDeliveryMethod(String(firstOrder?.deliveryMethod || ""));

      if (cartIds.length === 0) {
        setItems([]);
        return;
      }

      const cartPlaceholders = cartIds.map(() => "?").join(", ");
      const itemRows = await api.dbQuery(
        `
          SELECT
            ci.productId as productId,
            ci.quantity as quantity,
            p.name as productName,
            p.productCode as productCode,
            p.weight as weight,
            p.weightScale as weightScale
          FROM cart_item ci
          LEFT JOIN product p ON p.id = ci.productId
          WHERE ci.cartId IN (${cartPlaceholders})
        `,
        cartIds,
      );

      const byKey = new Map<
        string,
        {
          productCode: string | null;
          productName: string | null;
          qty: number;
          weight: number | null;
          weightScale: string | null;
        }
      >();

      for (const r of itemRows || []) {
        const productId = String(r?.productId || "");
        const productName = r?.productName != null ? String(r.productName) : "";
        const productCode = r?.productCode != null ? String(r.productCode) : "";
        const key = productCode || productName || productId;
        if (!key) continue;

        const prev = byKey.get(key);
        const qty = Number(r?.quantity || 0);
        const weight = r?.weight != null ? Number(r.weight) : null;
        const weightScale =
          r?.weightScale != null ? String(r.weightScale) : null;

        if (prev) {
          byKey.set(key, {
            ...prev,
            qty: prev.qty + qty,
          });
        } else {
          byKey.set(key, {
            productCode: productCode || null,
            productName: productName || null,
            qty,
            weight: Number.isFinite(weight as any) ? weight : null,
            weightScale: weightScale || null,
          });
        }
      }

      const list = Array.from(byKey.values()).map((v, idx) => {
        const itemNo =
          v.productCode || `ITM${String(idx + 1).padStart(3, "0")}`;
        const description = v.productName || "Item";
        const qty = v.qty;

        const qtyLabel =
          v.weight != null && v.weightScale
            ? `${Number(qty * v.weight)} ${v.weightScale}`
            : String(qty);

        return { itemNo, description, quantityLabel: qtyLabel };
      });

      setItems(list);
    } catch (e) {
      console.error("Failed to load delivery note:", e);
      showToast("error", "Error", "Could not load delivery note");
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, productionId, selectedOutlet?.id, selectedOutlet, showToast]);

  useEffect(() => {
    if (!isOpen) {
      setIsLoading(false);
      setDeliverTo("");
      setFromAddress("");
      setOrderReference("");
      setOrderDate("");
      setDeliveryMethod("");
      setDeliveryNo("");
      setDeliveryDate("");
      setSignature("");
      setSignatureDate("");
      setNotes("");
      setItems([]);
      return;
    }
    loadDeliveryNote();
  }, [isOpen, loadDeliveryNote]);

  const emailBody = useMemo(() => {
    const lines: string[] = [];
    lines.push("Delivery Note");
    lines.push("");
    lines.push(`Deliver to: ${deliverTo || "-"}`);
    lines.push(`From: ${fromAddress || "-"}`);
    lines.push("");
    lines.push(`Order Reference: ${orderReference || "-"}`);
    lines.push(`Order Date: ${orderDate || "-"}`);
    lines.push(`Delivery Method: ${deliveryMethod || "-"}`);
    lines.push(`Delivery No: ${deliveryNo || "-"}`);
    lines.push(`Delivery Date: ${deliveryDate || "-"}`);
    lines.push("");
    lines.push("Items:");
    items.forEach((it) => {
      lines.push(`- ${it.itemNo}: ${it.description} (${it.quantityLabel})`);
    });
    if (notes.trim()) {
      lines.push("");
      lines.push(`Notes: ${notes.trim()}`);
    }
    return lines.join("\n");
  }, [
    deliverTo,
    fromAddress,
    orderReference,
    orderDate,
    deliveryMethod,
    deliveryNo,
    deliveryDate,
    items,
    notes,
  ]);

  const onPrint = useCallback(() => {
    try {
      window.print();
    } catch {
      showToast("error", "Error", "Printing is not available");
    }
  }, [showToast]);

  const onEmail = useCallback(() => {
    void (async () => {
      const subject = encodeURIComponent(`Delivery Note - ${deliveryNo || ""}`);
      const body = encodeURIComponent(emailBody);
      const url = `mailto:?subject=${subject}&body=${body}`;
      try {
        const api: any = (window as any).electronAPI;
        if (api?.openExternal) {
          const ok = await api.openExternal(url);
          if (!ok) {
            showToast("error", "Error", "Could not open email app");
          }
          return;
        }
        window.open(url, "_blank", "noopener,noreferrer");
      } catch {
        showToast("error", "Error", "Email is not available");
      }
    })();
  }, [deliveryNo, emailBody, showToast]);

  const copyRow = useCallback(
    async (row: DeliveryItemRow) => {
      try {
        await navigator.clipboard.writeText(
          `${row.itemNo} - ${row.description} - ${row.quantityLabel}`,
        );
        showToast("success", "Copied", "Item copied to clipboard");
      } catch {
        showToast("error", "Error", "Could not copy item");
      }
    },
    [showToast],
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-1000 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[1040px] max-h-[calc(100vh-2rem)] bg-white rounded-[18px] shadow-2xl overflow-y-auto">
        <div className="relative px-6 sm:px-8 py-10">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-6 top-6 size-12 rounded-full bg-[#EF4444] flex items-center justify-center cursor-pointer"
            aria-label="Close"
          >
            <X className="size-6 text-white" />
          </button>

          <h1 className="text-center text-[34px] font-semibold text-[#111827]">
            Delivery Note
          </h1>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-3">
              <p className="text-[18px] font-semibold text-[#111827]">
                Deliver to
              </p>
              <textarea
                value={deliverTo}
                onChange={(e) => setDeliverTo(e.target.value)}
                placeholder="Enter address"
                className="w-full h-[170px] p-5 rounded-[16px] border border-gray-200 outline-none resize-none text-[16px]"
              />
            </div>

            <div className="space-y-3">
              <p className="text-[18px] font-semibold text-[#111827]">From</p>
              <textarea
                value={fromAddress}
                onChange={(e) => setFromAddress(e.target.value)}
                placeholder="Enter address"
                className="w-full h-[170px] p-5 rounded-[16px] border border-gray-200 outline-none resize-none text-[16px]"
              />
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="rounded-[18px] border border-gray-100 p-6">
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-6">
                  <span className="text-[16px] font-semibold text-[#111827]">
                    Order Reference
                  </span>
                  <input
                    value={orderReference}
                    onChange={(e) => setOrderReference(e.target.value)}
                    placeholder="Enter reference"
                    className="w-[260px] h-12 px-4 rounded-[12px] border border-gray-200 outline-none text-[14px]"
                  />
                </div>

                <div className="flex items-center justify-between gap-6">
                  <span className="text-[16px] font-semibold text-[#111827]">
                    Order Date
                  </span>
                  <input
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    placeholder="Enter date"
                    className="w-[260px] h-12 px-4 rounded-[12px] border border-gray-200 outline-none text-[14px]"
                  />
                </div>

                <div className="flex items-center justify-between gap-6">
                  <span className="text-[16px] font-semibold text-[#111827]">
                    Delivery Method
                  </span>
                  <input
                    value={deliveryMethod}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                    placeholder="Enter date"
                    className="w-[260px] h-12 px-4 rounded-[12px] border border-gray-200 outline-none text-[14px]"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[18px] border border-gray-100 p-6">
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-6">
                  <span className="text-[16px] font-semibold text-[#111827]">
                    Delivery No
                  </span>
                  <input
                    value={deliveryNo}
                    onChange={(e) => setDeliveryNo(e.target.value)}
                    placeholder="Enter Delivery No"
                    className="w-[260px] h-12 px-4 rounded-[12px] border border-gray-200 outline-none text-[14px]"
                  />
                </div>

                <div className="flex items-center justify-between gap-6">
                  <span className="text-[16px] font-semibold text-[#111827]">
                    Delivery Date
                  </span>
                  <input
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    placeholder="Enter date"
                    className="w-[260px] h-12 px-4 rounded-[12px] border border-gray-200 outline-none text-[14px]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 bg-white rounded-[16px] border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[840px]">
                <thead className="bg-[#F9FAFB]">
                  <tr>
                    <th className="px-6 py-4 text-left text-[14px] font-medium text-gray-500">
                      Item No
                    </th>
                    <th className="px-6 py-4 text-left text-[14px] font-medium text-gray-500">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-[14px] font-medium text-gray-500">
                      Quantity
                    </th>
                    <th className="px-6 py-4 text-left text-[14px] font-medium text-gray-500">
                      Complete
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {Array.from({ length: 4 }).map((__, j) => (
                          <td key={j} className="px-6 py-6">
                            <div className="h-4 bg-gray-100 rounded w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center">
                        <p className="text-[14px] text-gray-500">
                          No items found
                        </p>
                      </td>
                    </tr>
                  ) : (
                    items.map((it) => (
                      <tr key={it.itemNo}>
                        <td className="px-6 py-6 text-[16px] font-medium text-[#111827]">
                          {it.itemNo}
                        </td>
                        <td className="px-6 py-6 text-[16px] text-[#111827]">
                          {it.description}
                        </td>
                        <td className="px-6 py-6 text-[16px] text-[#111827]">
                          {it.quantityLabel}
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center justify-between gap-4">
                            <span className="h-11 px-6 inline-flex items-center rounded-[12px] bg-[#DCFCE7] text-[#16A34A] text-[14px] font-medium">
                              Packaged
                            </span>
                            <button
                              type="button"
                              onClick={() => copyRow(it)}
                              className="size-11 rounded-[12px] border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-50"
                              aria-label="Copy"
                            >
                              <Copy className="size-5 text-[#15BA5C]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex items-center gap-5">
              <span className="text-[18px] font-semibold text-[#111827]">
                Signature
              </span>
              <div className="relative flex-1">
                <input
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Sign"
                  className="w-full h-14 pl-5 pr-12 rounded-[14px] border border-gray-200 outline-none text-[15px]"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#15BA5C]">
                  <Paperclip className="size-5" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <span className="text-[18px] font-semibold text-[#111827]">
                Date
              </span>
              <input
                value={signatureDate}
                onChange={(e) => setSignatureDate(e.target.value)}
                placeholder="Select Date"
                className="flex-1 h-14 px-5 rounded-[14px] border border-gray-200 outline-none text-[15px]"
              />
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center gap-5">
              <span className="text-[18px] font-semibold text-[#111827] w-[110px]">
                Notes
              </span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any Additional Information"
                className="flex-1 h-[110px] p-5 rounded-[16px] border border-gray-200 outline-none resize-none text-[15px]"
              />
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <button
              type="button"
              onClick={onPrint}
              className="w-full h-16 rounded-[14px] bg-[#15BA5C] text-white font-semibold text-[18px] flex items-center justify-center gap-3 cursor-pointer hover:bg-[#119E4D] transition-colors"
            >
              <Printer className="size-6 text-white" />
              Print Delivery Note
            </button>

            <button
              type="button"
              onClick={onEmail}
              className="w-full h-16 rounded-[14px] border border-[#15BA5C] text-[#15BA5C] font-semibold text-[18px] flex items-center justify-center gap-3 cursor-pointer hover:bg-green-50 transition-colors"
            >
              <Mail className="size-6 text-[#15BA5C]" />
              Send as an Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewDeliveryNote;
