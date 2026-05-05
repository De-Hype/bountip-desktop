"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useBusinessStore } from "@/stores/useBusinessStore";
import { getCurrencySymbol } from "@/utils/getCurrencySymbol";
import useToastStore from "@/stores/toastStore";
import SuccessImage from "@/assets/icons/Success.svg";
import { OrderStatus } from "../../../../electron/types/order.types";

type ProcessPaymentModalProps = {
  isOpen: boolean;
  orderId: string | null;
  onClose: () => void;
  onUpdated?: () => void;
};

type PaymentMethod = "Cash" | "Bank Transfer" | "Card" | "Others";

const formatAmount = (amount: number) =>
  new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);

type InvoiceSettingsDto = {
  customizedLogoUrl?: string;
  fontStyle?: string;
  showBakeryName?: boolean;
  paperSize?: "A4" | "80mm";
  showPaymentSuccessText?: boolean;
  customizedPaymentSuccessText?: string;
  showInvoiceNumber?: boolean;
  showInvoiceIssueDate?: boolean;
  showInvoiceDueDate?: boolean;
  showInvoiceClientName?: boolean;
  showInvoiceClientAddress?: boolean;
  selectedColumns?: {
    orderName?: boolean;
    sku?: boolean;
    qty?: boolean;
    subTotal?: boolean;
    total?: boolean;
  };
  showDiscountLine?: boolean;
  showTax?: boolean;
  showShippingFee?: boolean;
  showPaymentStatus?: boolean;
  showPaymentMethod?: boolean;
  showAccountDetails?: boolean;
  showEmail?: boolean;
  showAddress?: boolean;
  customThankYouMessage?: string;
  showLogo?: boolean;
};

const parseMaybeJson = (raw: unknown) => {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  if (typeof raw === "string" && raw.trim()) {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return null;
};

const getInvoiceSettings = (raw: unknown): InvoiceSettingsDto => {
  const parsed = parseMaybeJson(raw) as any;
  const selectedColumns = parsed?.selectedColumns || {};
  return {
    customizedLogoUrl: parsed?.customizedLogoUrl,
    fontStyle: parsed?.fontStyle || "Helvetica",
    showBakeryName: Boolean(parsed?.showBakeryName ?? true),
    paperSize: parsed?.paperSize === "80mm" ? "80mm" : "A4",
    showPaymentSuccessText: Boolean(parsed?.showPaymentSuccessText ?? false),
    customizedPaymentSuccessText: parsed?.customizedPaymentSuccessText,
    showInvoiceNumber: Boolean(parsed?.showInvoiceNumber ?? true),
    showInvoiceIssueDate: Boolean(parsed?.showInvoiceIssueDate ?? true),
    showInvoiceDueDate: Boolean(parsed?.showInvoiceDueDate ?? false),
    showInvoiceClientName: Boolean(parsed?.showInvoiceClientName ?? true),
    showInvoiceClientAddress: Boolean(
      parsed?.showInvoiceClientAddress ?? false,
    ),
    selectedColumns: {
      orderName: selectedColumns?.orderName !== false,
      sku: Boolean(selectedColumns?.sku),
      qty: selectedColumns?.qty !== false,
      subTotal: Boolean(selectedColumns?.subTotal),
      total: selectedColumns?.total !== false,
    },
    showDiscountLine: Boolean(parsed?.showDiscountLine ?? false),
    showTax: Boolean(parsed?.showTax ?? true),
    showShippingFee: Boolean(parsed?.showShippingFee ?? false),
    showPaymentStatus: Boolean(parsed?.showPaymentStatus ?? false),
    showPaymentMethod: Boolean(parsed?.showPaymentMethod ?? true),
    showAccountDetails: Boolean(parsed?.showAccountDetails ?? false),
    showEmail: Boolean(parsed?.showEmail ?? false),
    showAddress: Boolean(parsed?.showAddress ?? false),
    customThankYouMessage: parsed?.customThankYouMessage,
    showLogo: Boolean(parsed?.showLogo ?? true),
  };
};

const escapeHtml = (value: unknown) => {
  const s = String(value ?? "");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const parseTimeline = (raw: unknown) => {
  if (Array.isArray(raw)) return raw as any[];
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const getActivePaymentMethods = (raw: unknown): PaymentMethod[] => {
  if (!raw) return ["Cash", "Bank Transfer", "Card"];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    const methods = Array.isArray((parsed as any)?.methods)
      ? (parsed as any).methods
      : Array.isArray(parsed)
        ? parsed
        : [];
    const enabled = (methods || [])
      .filter((m: any) => m?.isActive)
      .map((m: any) => String(m?.name || "").trim())
      .filter(Boolean) as string[];
    const normalized: PaymentMethod[] = [];
    for (const name of enabled) {
      const n = name.toLowerCase();
      if (n === "cash") normalized.push("Cash");
      else if (n === "bank transfer") normalized.push("Bank Transfer");
      else if (n === "card") normalized.push("Card");
      else normalized.push("Others");
    }
    return normalized.length > 0
      ? normalized
      : ["Cash", "Bank Transfer", "Card"];
  } catch {
    return ["Cash", "Bank Transfer", "Card"];
  }
};

const ProcessPaymentModal = ({
  isOpen,
  orderId,
  onClose,
  onUpdated,
}: ProcessPaymentModalProps) => {
  const { selectedOutlet, selectedOutletId } = useBusinessStore();
  const { showToast } = useToastStore();
  const currencySymbol = selectedOutlet?.currency
    ? getCurrencySymbol(selectedOutlet.currency)
    : "₦";

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState<string>("Unknown Customer");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("Cash");
  const [cashGiven, setCashGiven] = useState("");
  const [showPaymentAcceptedModal, setShowPaymentAcceptedModal] =
    useState(false);

  const paymentMethods = useMemo(() => {
    return getActivePaymentMethods(selectedOutlet?.paymentMethods);
  }, [selectedOutlet?.paymentMethods]);

  const invoiceSettings = useMemo(() => {
    return getInvoiceSettings(selectedOutlet?.invoiceSettings);
  }, [selectedOutlet?.invoiceSettings]);

  const thankYouMessage = useMemo(() => {
    return (
      invoiceSettings.customThankYouMessage || "Thank you for shopping with us!"
    );
  }, [invoiceSettings.customThankYouMessage]);

  const successText = useMemo(() => {
    if (!invoiceSettings.showPaymentSuccessText) return "";
    return String(invoiceSettings.customizedPaymentSuccessText || "").trim();
  }, [
    invoiceSettings.customizedPaymentSuccessText,
    invoiceSettings.showPaymentSuccessText,
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (paymentMethods.length > 0) setSelectedMethod(paymentMethods[0]);
  }, [isOpen, paymentMethods]);

  useEffect(() => {
    if (!isOpen) return;
    setShowPaymentAcceptedModal(false);
  }, [isOpen, orderId]);

  const load = useCallback(async () => {
    if (!isOpen) return;
    if (!selectedOutletId) return;
    if (!orderId) return;
    const api: any = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    setLoading(true);
    try {
      const orderRows = await api.dbQuery(
        `
          SELECT o.*, c.name as customerName
          FROM orders o
          LEFT JOIN customers c ON c.id = o.customerId
          WHERE o.id = ? AND o.outletId = ?
          LIMIT 1
        `,
        [orderId, selectedOutletId],
      );
      const o = orderRows?.[0] ?? null;
      setOrder(o);
      setCustomerName(String(o?.customerName || "Unknown Customer"));

      if (o?.cartId) {
        const itemRows = await api.dbQuery(
          `
            SELECT
              ci.id as id,
              ci.quantity as quantity,
              ci.unitPrice as unitPrice,
              p.name as productName,
              p.productCode as sku
            FROM cart_item ci
            LEFT JOIN product p ON p.id = ci.productId
            WHERE ci.cartId = ?
          `,
          [o.cartId],
        );
        setItems(itemRows || []);
      } else {
        setItems([]);
      }
    } catch (e) {
      console.error("Failed to load payment info:", e);
      setOrder(null);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isOpen, orderId, selectedOutletId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!isOpen) return;
    setCashGiven("");
  }, [isOpen, orderId]);

  const balanceDue = useMemo(() => {
    const total = Number(order?.total ?? order?.amount ?? 0) || 0;
    return Math.max(0, total);
  }, [order?.amount, order?.total]);

  const numericCashGiven = useMemo(() => {
    const v = Number(String(cashGiven).replace(/[^0-9.]/g, "")) || 0;
    return v;
  }, [cashGiven]);

  const change = useMemo(() => {
    if (selectedMethod !== "Cash") return 0;
    return Math.max(0, numericCashGiven - balanceDue);
  }, [balanceDue, numericCashGiven, selectedMethod]);

  const canProcess =
    !saving &&
    !loading &&
    Boolean(orderId) &&
    Boolean(selectedOutletId) &&
    (selectedMethod !== "Cash" || numericCashGiven >= balanceDue);

  const queueOrderUpdate = useCallback(async (api: any, id: string) => {
    if (!api?.queueAdd) return;
    const rows = await api.dbQuery(
      "SELECT * FROM orders WHERE id = ? LIMIT 1",
      [id],
    );
    const row = rows?.[0] ?? null;
    if (!row) return;
    const parsedTimeline = parseMaybeJson(row?.timeline);
    const normalizedRow = {
      ...row,
      timeline: parsedTimeline ?? row?.timeline,
      cashCollected: row?.cashCollected ?? 0,
      changeGiven: row?.changeGiven ?? 0,
    };
    await api.queueAdd({
      table: "orders",
      action: "UPDATE",
      data: normalizedRow,
      id,
    });
  }, []);

  const updateTimelineAndSave = useCallback(
    async (patch: {
      paymentStatus?: string | null;
      paymentMethod?: string | null;
      paymentReference?: string | null;
      cashCollected?: number;
      changeGiven?: number;
      status?: string;
      confirmedAt?: string | null;
    }) => {
      if (!selectedOutletId || !orderId) return false;
      const api: any = (window as any).electronAPI;
      if (!api?.dbQuery) return false;
      const now = new Date().toISOString();

      try {
        const timelineRows = await api.dbQuery(
          "SELECT timeline FROM orders WHERE id = ? LIMIT 1",
          [orderId],
        );
        const timelineArr = parseTimeline(timelineRows?.[0]?.timeline);
        if (patch.paymentStatus === "Verified") {
          timelineArr.push({
            action: "payment_processed",
            timestamp: now,
            description: "Payment processed",
          });
        } else if (patch.status === "Confirmed") {
          timelineArr.push({
            action: "confirmed",
            timestamp: now,
            description: "Order confirmed",
          });
        }
        const nextTimeline = JSON.stringify(timelineArr);

        await api.dbQuery(
          `
            UPDATE orders
            SET
              paymentStatus = COALESCE(?, paymentStatus),
              paymentMethod = COALESCE(?, paymentMethod),
              paymentReference = COALESCE(?, paymentReference),
              cashCollected = COALESCE(?, cashCollected),
              changeGiven = COALESCE(?, changeGiven),
              status = COALESCE(?, status),
              confirmedAt = COALESCE(?, confirmedAt),
              timeline = ?,
              updatedAt = ?
            WHERE id = ? AND outletId = ?
          `,
          [
            patch.paymentStatus ?? null,
            patch.paymentMethod ?? null,
            patch.paymentReference ?? null,
            patch.cashCollected ?? null,
            patch.changeGiven ?? null,
            patch.status ?? null,
            patch.confirmedAt ?? null,
            nextTimeline,
            now,
            orderId,
            selectedOutletId,
          ],
        );

        await queueOrderUpdate(api, orderId);
        return true;
      } catch (e) {
        console.error("Failed to update payment:", e);
        return false;
      }
    },
    [orderId, queueOrderUpdate, selectedOutletId],
  );

  const handleConfirmWithoutPayment = async () => {
    if (!orderId) return;
    setSaving(true);
    try {
      const ok = await updateTimelineAndSave({
        status: OrderStatus.TO_BE_PRODUCED,
        paymentStatus: "Pending",
        confirmedAt: new Date().toISOString(),
      });
      if (!ok) {
        showToast("error", "Confirm failed", "Could not confirm order");
        return;
      }
      showToast("success", "Order confirmed", "Confirmed without payment");
      onUpdated?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!orderId) return;
    setSaving(true);
    try {
      const paymentReference = crypto.randomUUID();
      const cashCollected =
        selectedMethod === "Cash" ? numericCashGiven : balanceDue;
      const ok = await updateTimelineAndSave({
        status: OrderStatus.TO_BE_PRODUCED,
        paymentStatus: "Verified",
        paymentMethod: selectedMethod,
        paymentReference,
        cashCollected,
        changeGiven: change,
        confirmedAt: new Date().toISOString(),
      });
      if (!ok) {
        showToast("error", "Payment failed", "Could not process payment");
        return;
      }
      setShowPaymentAcceptedModal(true);
    } finally {
      setSaving(false);
    }
  };

  const buildInvoiceHtml = useCallback(
    (mode: "invoice" | "receipt") => {
      const paperSize = invoiceSettings.paperSize === "80mm" ? "80mm" : "A4";
      const pageCss =
        paperSize === "80mm"
          ? "@page { size: 80mm auto; margin: 6mm; }"
          : "@page { size: A4; margin: 12mm; }";

      const font = escapeHtml(invoiceSettings.fontStyle || "Helvetica");
      const logoUrl =
        invoiceSettings.customizedLogoUrl ||
        (invoiceSettings.showLogo ? selectedOutlet?.logoUrl : "") ||
        "";
      const showName = invoiceSettings.showBakeryName !== false;
      const showAddress = Boolean(invoiceSettings.showAddress);
      const showEmail = Boolean(invoiceSettings.showEmail);
      const showAccount = Boolean(invoiceSettings.showAccountDetails);

      const bankDetails = parseMaybeJson(
        (selectedOutlet as any)?.bankDetails,
      ) as any;

      const subtotalAmount = Number(order?.amount ?? 0) || 0;
      const taxAmount = Number(order?.tax ?? 0) || 0;
      const serviceChargeAmount = Number(order?.serviceCharge ?? 0) || 0;
      const deliveryFeeAmount = Number(order?.deliveryFee ?? 0) || 0;
      const discountAmount = Number(order?.discount ?? 0) || 0;
      const markupAmount = Number(order?.markup ?? 0) || 0;
      const totalAmount = Number(order?.total ?? 0) || 0;

      const paymentStatus = String(order?.paymentStatus ?? "").toLowerCase();
      const paymentStatusLabel =
        paymentStatus === "verified" || paymentStatus === "paid"
          ? "Paid"
          : "Unpaid";

      const cols = invoiceSettings.selectedColumns || {};
      const showSku = Boolean(cols.sku);
      const showQty = cols.qty !== false;
      const showTotal = cols.total !== false;
      const showItemSubtotal = Boolean(cols.subTotal);

      const rowsHtml = (items || [])
        .map((it: any) => {
          const name = escapeHtml(it?.productName || "Item");
          const sku = escapeHtml(it?.sku || "");
          const qty = Number(it?.quantity ?? 0) || 0;
          const unit = Number(it?.unitPrice ?? 0) || 0;
          const lineSubtotal = unit * qty;
          const lineTotal = lineSubtotal;
          return `
            <tr>
              <td class="col-name">${name}</td>
              ${showSku ? `<td class="col-sku">${sku}</td>` : ""}
              ${showQty ? `<td class="col-qty">${qty}</td>` : ""}
              ${
                showItemSubtotal
                  ? `<td class="col-money">${currencySymbol}${formatAmount(lineSubtotal)}</td>`
                  : ""
              }
              ${
                showTotal
                  ? `<td class="col-money">${currencySymbol}${formatAmount(lineTotal)}</td>`
                  : ""
              }
            </tr>
          `;
        })
        .join("");

      const successHtml =
        invoiceSettings.showPaymentSuccessText && successText
          ? `<div class="success">${escapeHtml(successText)}</div>`
          : "";
      const thankYouHtml = thankYouMessage
        ? `<div class="thank">${escapeHtml(thankYouMessage)}</div>`
        : "";

      const details: string[] = [];
      if (invoiceSettings.showInvoiceNumber !== false) {
        details.push(
          `<div class="row"><span>Invoice Number</span><span class="val">${escapeHtml(
            order?.reference || "-",
          )}</span></div>`,
        );
      }
      if (invoiceSettings.showInvoiceIssueDate !== false) {
        details.push(
          `<div class="row"><span>Invoice Issue Date</span><span class="val">${escapeHtml(
            String(order?.createdAt || ""),
          )}</span></div>`,
        );
      }
      if (invoiceSettings.showInvoiceClientName !== false) {
        details.push(
          `<div class="row"><span>Client Name</span><span class="val">${escapeHtml(
            customerName,
          )}</span></div>`,
        );
      }

      const totals: string[] = [];
      totals.push(
        `<div class="row"><span>Sub-Total</span><span class="val">${currencySymbol}${formatAmount(
          subtotalAmount,
        )}</span></div>`,
      );
      if (invoiceSettings.showTax !== false) {
        totals.push(
          `<div class="row"><span>Tax</span><span class="val">${currencySymbol}${formatAmount(
            taxAmount,
          )}</span></div>`,
        );
      }
      totals.push(
        `<div class="row"><span>Service Charge</span><span class="val">${currencySymbol}${formatAmount(
          serviceChargeAmount,
        )}</span></div>`,
      );
      if (invoiceSettings.showShippingFee) {
        totals.push(
          `<div class="row"><span>Delivery Fee</span><span class="val">${currencySymbol}${formatAmount(
            deliveryFeeAmount,
          )}</span></div>`,
        );
      }
      if (invoiceSettings.showDiscountLine) {
        totals.push(
          `<div class="row"><span>Discount</span><span class="val">${currencySymbol}${formatAmount(
            discountAmount,
          )}</span></div>`,
        );
      }
      totals.push(
        `<div class="row"><span>Markup</span><span class="val">${currencySymbol}${formatAmount(
          markupAmount,
        )}</span></div>`,
      );
      if (invoiceSettings.showPaymentMethod) {
        totals.push(
          `<div class="row"><span>Payment Method</span><span class="val">${escapeHtml(
            selectedMethod,
          )}</span></div>`,
        );
      }
      if (invoiceSettings.showPaymentStatus) {
        totals.push(
          `<div class="row"><span>Payment Status</span><span class="val">${escapeHtml(
            paymentStatusLabel,
          )}</span></div>`,
        );
      }
      totals.push(
        `<div class="row total"><span>Total Amount</span><span class="val">${currencySymbol}${formatAmount(
          totalAmount,
        )}</span></div>`,
      );

      const businessMeta: string[] = [];
      if (showAddress && selectedOutlet?.address) {
        businessMeta.push(`<div>${escapeHtml(selectedOutlet.address)}</div>`);
      }
      if (showEmail && selectedOutlet?.email) {
        businessMeta.push(`<div>${escapeHtml(selectedOutlet.email)}</div>`);
      }

      const accountDetails =
        showAccount && bankDetails
          ? `
            <div class="account">
              <div class="row"><span>Bank</span><span class="val">${escapeHtml(
                bankDetails.bankName || "",
              )}</span></div>
              <div class="row"><span>Account Name</span><span class="val">${escapeHtml(
                bankDetails.accountName || "",
              )}</span></div>
              <div class="row"><span>Account Number</span><span class="val">${escapeHtml(
                bankDetails.accountNumber || "",
              )}</span></div>
            </div>
          `
          : "";

      const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(mode === "invoice" ? "Invoice" : "Receipt")}</title>
    <style>
      ${pageCss}
      * { box-sizing: border-box; }
      body { font-family: ${font}, Arial, sans-serif; color: #111827; margin: 0; }
      .wrap { width: 100%; }
      .header { text-align: center; margin-bottom: 16px; }
      .logo { width: 72px; height: 72px; object-fit: contain; margin: 0 auto 8px; display: block; }
      .name { font-size: 18px; font-weight: 700; margin: 0; }
      .meta { font-size: 12px; color: #6B7280; margin-top: 6px; }
      .box { border: 1px dashed #D1D5DB; border-radius: 12px; padding: 14px; }
      .row { display: flex; justify-content: space-between; gap: 10px; font-size: 12px; color: #6B7280; padding: 4px 0; }
      .row .val { color: #111827; font-weight: 600; text-align: right; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th { text-align: left; font-size: 11px; color: #9CA3AF; padding: 8px 0; border-bottom: 1px dashed #D1D5DB; }
      td { font-size: 12px; padding: 8px 0; border-bottom: 1px dashed #F3F4F6; vertical-align: top; }
      .col-money { text-align: right; white-space: nowrap; }
      .col-qty { text-align: center; width: 52px; }
      .col-sku { width: 120px; }
      .total { font-size: 14px; font-weight: 800; color: #111827; border-top: 1px dashed #D1D5DB; margin-top: 8px; padding-top: 10px; }
      .success, .thank { margin-top: 14px; text-align: center; font-weight: 700; color: #15BA5C; }
      .account { margin-top: 12px; padding-top: 10px; border-top: 1px dashed #D1D5DB; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="header">
        ${
          logoUrl
            ? `<img class="logo" src="${escapeHtml(logoUrl)}" alt="Logo" />`
            : ""
        }
        ${showName ? `<div class="name">${escapeHtml(selectedOutlet?.name || "Store")}</div>` : ""}
        ${businessMeta.length ? `<div class="meta">${businessMeta.join("")}</div>` : ""}
      </div>
      <div class="box">
        ${details.join("")}
        <table>
          <thead>
            <tr>
              <th>Order</th>
              ${showSku ? `<th>SKU</th>` : ""}
              ${showQty ? `<th style="text-align:center;">Qty</th>` : ""}
              ${showItemSubtotal ? `<th style="text-align:right;">Sub-total</th>` : ""}
              ${showTotal ? `<th style="text-align:right;">Total</th>` : ""}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <div style="margin-top: 10px;">
          ${totals.join("")}
          ${accountDetails}
        </div>
      </div>
      ${successHtml}
      ${thankYouHtml}
    </div>
  </body>
</html>`;

      return html;
    },
    [
      customerName,
      currencySymbol,
      invoiceSettings,
      items,
      order?.address,
      order?.amount,
      order?.createdAt,
      order?.deliveryFee,
      order?.discount,
      order?.markup,
      order?.paymentStatus,
      order?.reference,
      order?.serviceCharge,
      order?.tax,
      order?.total,
      selectedMethod,
      selectedOutlet?.address,
      (selectedOutlet as any)?.bankDetails,
      selectedOutlet?.email,
      selectedOutlet?.logoUrl,
      selectedOutlet?.name,
      successText,
      thankYouMessage,
    ],
  );

  const handlePrintInvoice = async () => {
    const api: any = (window as any).electronAPI;
    try {
      const html = buildInvoiceHtml("invoice");
      if (api?.printHtml) {
        const res = await api.printHtml({
          html,
          options: { silent: false, printBackground: true },
        });
        if (res?.success) {
          showToast("success", "Print started", "Invoice sent to printer");
          return;
        }
        showToast("error", "Print failed", String(res?.error || ""));
        return;
      }

      const w = window.open("", "_blank", "noopener,noreferrer");
      if (!w) {
        showToast("error", "Print failed", "Pop-up blocked");
        return;
      }
      w.document.open();
      w.document.write(html);
      w.document.close();
      w.focus();
      w.print();
      w.close();
    } catch (e) {
      showToast("error", "Print failed", String((e as any)?.message || e));
    }
  };

  const keypadPress = (v: string) => {
    if (v === "#") return;
    if (v === ".") {
      if (cashGiven.includes(".")) return;
      setCashGiven((p) => (p ? `${p}.` : "0."));
      return;
    }
    setCashGiven((p) => `${p}${v}`);
  };

  const quickAmounts = [5, 10, 20, 50, 100];

  const content = (
    <div
      className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center py-8 px-6"
      onMouseDown={() => {
        if (showPaymentAcceptedModal) return;
        onClose();
      }}
    >
      <div
        className="w-full max-w-[1200px] max-h-[calc(100vh-64px)] bg-white rounded-[18px] shadow-2xl overflow-hidden flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="px-8 py-6 flex items-center justify-between border-b border-[#E5E7EB]">
          <div className="text-[24px] font-bold text-[#111827]">Payment</div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] transition-colors"
            aria-label="Close"
            title="Close"
          >
            <X className="h-5 w-5 text-[#111827]" />
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-8 border-r border-[#E5E7EB]">
              <div className="text-[14px] font-semibold text-[#111827]">
                Select a Payment Method
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {paymentMethods.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMethod(m)}
                    className={`h-11 px-5 rounded-[10px] border text-[15px] font-semibold transition-colors ${
                      selectedMethod === m
                        ? "bg-[#15BA5C] border-[#15BA5C] text-white"
                        : "bg-white border-[#15BA5C] text-[#15BA5C] hover:bg-[#15BA5C]/5"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div className="mt-5 inline-flex items-center px-5 py-3 rounded-[10px] bg-[#F3F4F6] text-[15px] text-[#6B7280] font-semibold">
                Balance Due: {currencySymbol}
                {formatAmount(balanceDue)}
              </div>

              {selectedMethod === "Cash" && (
                <>
                  <div className="mt-6 text-[14px] text-[#111827] font-semibold">
                    How much cash were you given by the customer
                  </div>
                  <div className="mt-4 rounded-[12px] border border-[#E5E7EB] h-[92px] flex items-center justify-center text-[36px] text-[#9CA3AF] font-semibold">
                    {currencySymbol}
                    <input
                      value={cashGiven}
                      onChange={(e) =>
                        setCashGiven(e.target.value.replace(/[^0-9.]/g, ""))
                      }
                      inputMode="decimal"
                      placeholder="0.00"
                      className="ml-2 w-[240px] bg-transparent text-[#111827] text-[28px] font-bold outline-none text-center"
                    />
                  </div>

                  <div className="mt-4 inline-flex items-center px-5 py-3 rounded-[10px] bg-[#F3F4F6] text-[15px] text-[#6B7280] font-semibold">
                    Customer&apos;s Change: {currencySymbol}
                    {formatAmount(change)}
                  </div>

                  <div className="mt-5 grid grid-cols-5 gap-3">
                    {quickAmounts.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() =>
                          setCashGiven((p) => String((Number(p || 0) || 0) + a))
                        }
                        className="h-11 rounded-[10px] bg-[#E9FBF0] text-[#15BA5C] font-semibold"
                      >
                        {currencySymbol}
                        {formatAmount(a)}
                      </button>
                    ))}
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    {[
                      "1",
                      "2",
                      "3",
                      "4",
                      "5",
                      "6",
                      "7",
                      "8",
                      "9",
                      ".",
                      "0",
                      "#",
                    ].map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => keypadPress(k)}
                        className="h-16 rounded-[12px] border border-[#E5E7EB] text-[18px] font-semibold text-[#111827] hover:bg-[#F9FAFB] transition-colors"
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="mt-8">
                <button
                  type="button"
                  disabled={!canProcess}
                  onClick={handleProcessPayment}
                  className="h-14 cursor-pointer w-full rounded-[12px] bg-[#15BA5C] text-white font-bold text-[16px] hover:bg-[#13A652] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Process Payment
                </button>
                <button
                  type="button"
                  disabled={saving || loading}
                  onClick={handleConfirmWithoutPayment}
                  className="mt-4 h-14 cursor-pointer w-full rounded-[12px] border-2 border-[#15BA5C] bg-white text-[#15BA5C] font-bold text-[16px] hover:bg-[#15BA5C]/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Order without Payment
                </button>
              </div>
            </div>

            <div className="p-8 bg-white">
              <div className="text-[14px] font-semibold text-[#111827]">
                Live Preview
              </div>
              <div className="mt-4 border border-[#E5E7EB] rounded-[14px] p-6">
                <div className="text-center">
                  <div className="text-[22px] font-bold text-[#111827]">
                    {selectedOutlet?.name || "Store"}
                  </div>
                  <div className="text-[14px] text-[#6B7280] mt-1">
                    {selectedOutlet?.city || selectedOutlet?.address || ""}
                  </div>
                </div>

                <div className="mt-6 border border-dashed border-[#D1D5DB] rounded-[12px] p-5">
                  <div className="grid grid-cols-2 gap-3 text-[13px] text-[#6B7280]">
                    <div>Customer Name</div>
                    <div className="text-right text-[#111827] font-semibold">
                      {customerName}
                    </div>
                    <div>Order No</div>
                    <div className="text-right text-[#111827] font-semibold">
                      {String(order?.reference || "-")}
                    </div>
                    <div>Order Type</div>
                    <div className="text-right text-[#111827] font-semibold">
                      {String(order?.orderType || "Order")}
                    </div>
                    <div>Server</div>
                    <div className="text-right text-[#111827] font-semibold">
                      {String(order?.initiator || "-")}
                    </div>
                  </div>

                  <div className="mt-6 border-t border-dashed border-[#D1D5DB] pt-4">
                    <div className="grid grid-cols-4 text-[12px] text-[#9CA3AF] font-semibold">
                      <div className="col-span-2">Order</div>
                      <div className="text-center">Qty</div>
                      <div className="text-right">Total</div>
                    </div>
                    <div className="mt-3 space-y-2">
                      {items.map((it: any) => {
                        const q = Number(it?.quantity ?? 0) || 0;
                        const unit = Number(it?.unitPrice ?? 0) || 0;
                        return (
                          <div
                            key={String(it?.id)}
                            className="grid grid-cols-4 text-[13px] text-[#111827]"
                          >
                            <div className="col-span-2 truncate">
                              {String(it?.productName || "Item")}
                            </div>
                            <div className="text-center">{q}</div>
                            <div className="text-right">
                              {currencySymbol}
                              {formatAmount(unit * q)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-6 border-t border-dashed border-[#D1D5DB] pt-4 space-y-2 text-[13px]">
                    <div className="flex items-center justify-between text-[#6B7280]">
                      <span>Payment Method</span>
                      <span className="text-[#111827] font-semibold">
                        {selectedMethod}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[#6B7280]">
                      <span>Sub-Total</span>
                      <span className="text-[#111827] font-semibold">
                        {currencySymbol}
                        {formatAmount(Number(order?.amount ?? 0) || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[#6B7280]">
                      <span>Tax</span>
                      <span className="text-[#111827] font-semibold">
                        {currencySymbol}
                        {formatAmount(Number(order?.tax ?? 0) || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[#6B7280]">
                      <span>Service Charge</span>
                      <span className="text-[#111827] font-semibold">
                        {currencySymbol}
                        {formatAmount(Number(order?.serviceCharge ?? 0) || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[#6B7280]">
                      <span>Discount</span>
                      <span className="text-[#111827] font-semibold">
                        {currencySymbol}
                        {formatAmount(Number(order?.discount ?? 0) || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[#6B7280]">
                      <span>Markup</span>
                      <span className="text-[#111827] font-semibold">
                        {currencySymbol}
                        {formatAmount(Number(order?.markup ?? 0) || 0)}
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-dashed border-[#D1D5DB] flex items-center justify-between text-[16px] font-bold text-[#111827]">
                      <span>Total Amount</span>
                      <span>
                        {currencySymbol}
                        {formatAmount(balanceDue)}
                      </span>
                    </div>
                  </div>
                </div>
                {(successText || thankYouMessage) && (
                  <div className="mt-6 text-center">
                    {successText && (
                      <div className="text-[#15BA5C] font-semibold">
                        {successText}
                      </div>
                    )}
                    {thankYouMessage && (
                      <div className="text-[#15BA5C] font-semibold">
                        {thankYouMessage}
                      </div>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handlePrintInvoice}
                  className="mt-4 h-12 cursor-pointer w-full rounded-[12px] border-2 border-[#15BA5C] text-[#15BA5C] font-semibold hover:bg-[#15BA5C]/5 transition-colors"
                >
                  Print Invoice
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <div className="text-sm font-semibold text-[#111827]">
              Loading...
            </div>
          </div>
        )}
      </div>

      {showPaymentAcceptedModal && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[10010] p-4"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-xl relative w-full max-w-md max-h-[500px] overflow-hidden shadow-2xl">
            <img src={SuccessImage} alt="success image" className="w-full" />
            <div className="p-4 flex gap-1 text-center items-center justify-center flex-col">
              <p className="font-semibold text-2xl">Payment Successful</p>
              <p className="text-[#737373] mb-3">
                Awesome! Your order has been submitted and is being processed.
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowPaymentAcceptedModal(false);
                  onUpdated?.();
                  onClose();
                }}
                className="w-full cursor-pointer py-3 rounded-lg font-semibold text-base transition-colors bg-[#15BA5C] text-white hover:bg-emerald-600"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (!isOpen || !mounted) return null;
  return createPortal(content, document.body);
};

export default ProcessPaymentModal;
