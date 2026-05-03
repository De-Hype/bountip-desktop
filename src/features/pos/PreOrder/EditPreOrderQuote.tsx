"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Dropdown, type DropdownOption } from "@/features/settings/ui/Dropdown";
import { useBusinessStore } from "@/stores/useBusinessStore";
import { getCurrencySymbol } from "@/utils/getCurrencySymbol";
import { DatePicker } from "@/components/ui/date-picker";
import { TimeDropdownSplit } from "@/features/settings/ui/TimeDropdownSplit";
import PreOrderAssests from "@/assets/images/pos/pre-order";
import useToastStore from "@/stores/toastStore";

type EditPreOrderQuoteProps = {
  isOpen: boolean;
  quoteId: string | null;
  onClose: () => void;
  onUpdated?: () => void;
};

type Step = "details" | "additional";
type DeliveryMethod = "pickup" | "delivery";

type LineItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: string;
  basePrice: number;
  unitPrice: number;
  priceTierDiscount: number;
  priceTierMarkup: number;
};

const sanitizeNumber = (value: string) => value.replace(/[^0-9.]/g, "");

const formatAmount = (amount: number) =>
  new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);

const parseScheduledAt = (scheduledAt: string | null | undefined) => {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  if (!scheduledAt) return { date: startOfToday, time: "09:00" };
  const raw = String(scheduledAt).trim();
  if (!raw) return { date: startOfToday, time: "09:00" };

  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (m) {
    const yyyy = Number(m[1]);
    const mm = Number(m[2]);
    const dd = Number(m[3]);
    const hh = String(m[4]).padStart(2, "0");
    const min = String(m[5]).padStart(2, "0");
    return { date: new Date(yyyy, mm - 1, dd), time: `${hh}:${min}` };
  }

  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return {
      date: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
      time: `${hh}:${min}`,
    };
  }

  return { date: startOfToday, time: "09:00" };
};

const formatRelativeTime = (value: string | null | undefined) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return formatDistanceToNow(d, { addSuffix: true });
};

const EditPreOrderQuote = ({
  isOpen,
  quoteId,
  onClose,
  onUpdated,
}: EditPreOrderQuoteProps) => {
  const { selectedOutlet, selectedOutletId } = useBusinessStore();
  const { showToast } = useToastStore();
  const currencySymbol = selectedOutlet?.currency
    ? getCurrencySymbol(selectedOutlet.currency)
    : "₦";

  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [cartId, setCartId] = useState<string>("");
  const [activeStep, setActiveStep] = useState<Step>("details");

  const [customerId, setCustomerId] = useState("");
  const [occasion, setOccasion] = useState("");
  const [occasionOptions] = useState<DropdownOption[]>([
    { value: "Birthday", label: "Birthday" },
    { value: "Wedding", label: "Wedding" },
    { value: "Anniversary", label: "Anniversary" },
    { value: "Corporate", label: "Corporate" },
    { value: "Other", label: "Other" },
  ]);
  const [products, setProducts] = useState<any[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isCustomersLoading, setIsCustomersLoading] = useState(false);

  const [items, setItems] = useState<LineItem[]>([]);
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("pickup");
  const [useSameCustomerDetails, setUseSameCustomerDetails] = useState(true);
  const [recipientName, setRecipientName] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(
    undefined,
  );
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [specialInstructions, setSpecialInstructions] = useState("");

  const outletPriceTiers = useMemo(() => {
    const raw = selectedOutlet?.priceTier;
    if (!raw) return [];
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [selectedOutlet?.priceTier]);

  const selectedCustomer = useMemo(() => {
    return (
      (customers || []).find((c: any) => String(c.id) === customerId) || null
    );
  }, [customerId, customers]);

  const selectedPriceTier = useMemo(() => {
    const key = selectedCustomer?.pricingTier;
    if (!key) return null;
    const keyStr = String(key);
    return (
      outletPriceTiers.find((t: any) => String(t.id) === keyStr) ||
      outletPriceTiers.find((t: any) => String(t.name) === keyStr) ||
      null
    );
  }, [outletPriceTiers, selectedCustomer?.pricingTier]);

  const computeTierPrice = useMemo(() => {
    return (basePrice: number) => {
      const rules = selectedPriceTier?.pricingRules || {};
      const markupPct = Number(rules.markupPercentage || 0) || 0;
      const discountPct = Number(rules.discountPercentage || 0) || 0;
      const fixedMarkup = Number(rules.fixedMarkup || 0) || 0;
      const fixedDiscount = Number(rules.fixedDiscount || 0) || 0;

      let priceTierMarkup = 0;
      let priceTierDiscount = 0;
      let unitPrice = Number(basePrice || 0) || 0;

      if (markupPct > 0) {
        priceTierMarkup = (unitPrice * markupPct) / 100;
        unitPrice = unitPrice + priceTierMarkup;
      } else if (fixedMarkup > 0) {
        priceTierMarkup = fixedMarkup;
        unitPrice = unitPrice + fixedMarkup;
      } else if (discountPct > 0) {
        priceTierDiscount = (unitPrice * discountPct) / 100;
        unitPrice = unitPrice - priceTierDiscount;
      } else if (fixedDiscount > 0) {
        priceTierDiscount = fixedDiscount;
        unitPrice = unitPrice - fixedDiscount;
      }

      unitPrice = Math.max(0, unitPrice);

      return { unitPrice, priceTierDiscount, priceTierMarkup };
    };
  }, [selectedPriceTier]);

  const productOptions = useMemo<DropdownOption[]>(() => {
    return (products || []).map((p: any) => ({
      value: String(p.id),
      label: String(p.name || "Product"),
    }));
  }, [products]);

  const customerOptions = useMemo<DropdownOption[]>(() => {
    return (customers || []).map((c: any) => ({
      value: String(c.id),
      label: String(c.name || "Customer"),
    }));
  }, [customers]);

  const checkoutTaxes = useMemo(() => {
    const raw = selectedOutlet?.taxSettings;
    if (!raw) return [] as Array<{ name: string; rate: number }>;
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      const taxes = Array.isArray((parsed as any)?.taxes)
        ? (parsed as any).taxes
        : Array.isArray(parsed)
          ? parsed
          : [];
      return (taxes || [])
        .filter(
          (t: any) =>
            !t?.isDeleted &&
            (t?.applyAtOrderCheckout === true ||
              String(t?.applicationType || "").toLowerCase() === "checkout"),
        )
        .map((t: any) => ({
          name: String(t?.name || "Tax"),
          rate: Number(t?.rate || 0) || 0,
        }))
        .filter((t: any) => t.rate > 0);
    } catch {
      return [];
    }
  }, [selectedOutlet?.taxSettings]);

  const checkoutServiceCharge = useMemo(() => {
    const raw = selectedOutlet?.serviceCharges;
    if (!raw) return null as null | { name: string; rate: number };
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      const charges = Array.isArray((parsed as any)?.charges)
        ? (parsed as any).charges
        : Array.isArray(parsed)
          ? parsed
          : [];
      const c =
        (charges || []).find(
          (x: any) =>
            !x?.isDeleted && String(x?.applicationType || "") === "checkout",
        ) || null;
      if (!c) return null;
      const rate = Number(c?.rate || 0) || 0;
      if (rate <= 0) return null;
      return { name: String(c?.name || "Service Charge"), rate };
    } catch {
      return null;
    }
  }, [selectedOutlet?.serviceCharges]);

  const scheduledAt = useMemo(() => {
    if (!scheduledDate) return "";
    const yyyy = scheduledDate.getFullYear();
    const mm = String(scheduledDate.getMonth() + 1).padStart(2, "0");
    const dd = String(scheduledDate.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${scheduledTime}`;
  }, [scheduledDate, scheduledTime]);

  const subtotal = useMemo(() => {
    return items.reduce((acc, it) => {
      const qty = parseFloat(it.quantity);
      const q = Number.isFinite(qty) ? qty : 0;
      return acc + it.unitPrice * q;
    }, 0);
  }, [items]);

  const tax = useMemo(() => {
    const rateTotal = checkoutTaxes.reduce(
      (acc: number, t: { name: string; rate: number }) => acc + t.rate,
      0,
    );
    return (subtotal * rateTotal) / 100;
  }, [checkoutTaxes, subtotal]);

  const serviceCharge = useMemo(() => {
    if (!checkoutServiceCharge) return 0;
    return (subtotal * checkoutServiceCharge.rate) / 100;
  }, [checkoutServiceCharge, subtotal]);

  const total = useMemo(
    () => subtotal + tax + serviceCharge,
    [serviceCharge, subtotal, tax],
  );

  const requiredFilled = useMemo(() => {
    const hasCustomer = Boolean(customerId);
    const hasOccasion = Boolean(occasion.trim());
    const hasRecipient = Boolean(recipientName.trim());
    const hasSchedule = Boolean(scheduledAt);
    const hasItems = items.some(
      (it) => it.productId && Number(it.quantity || 0) > 0,
    );
    return (
      hasCustomer && hasOccasion && hasRecipient && hasSchedule && hasItems
    );
  }, [customerId, items, occasion, recipientName, scheduledAt]);

  const updateItem = (id: string, patch: Partial<LineItem>) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        productId: "",
        productName: "",
        quantity: "",
        basePrice: 0,
        unitPrice: 0,
        priceTierDiscount: 0,
        priceTierMarkup: 0,
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  useEffect(() => {
    if (!isOpen) return;
    setActiveStep("details");
  }, [isOpen, quoteId]);

  useEffect(() => {
    if (!isOpen) return;
    if (!selectedOutletId) return;
    const api: any = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    let cancelled = false;
    setIsProductsLoading(true);
    (async () => {
      try {
        const rows = await api.dbQuery(
          `
            SELECT id, name, price, productAvailableStock
            FROM product
            WHERE outletId = ?
              AND isActive = 1
              AND isDeleted = 0
              AND (productAvailableStock IS NULL OR productAvailableStock > 0)
            ORDER BY LOWER(name) ASC
          `,
          [selectedOutletId],
        );
        if (cancelled) return;
        setProducts(rows || []);
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setIsProductsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedOutletId]);

  useEffect(() => {
    if (!isOpen) return;
    if (!selectedOutletId) return;
    const api: any = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    let cancelled = false;
    setIsCustomersLoading(true);
    (async () => {
      try {
        const rows = await api.dbQuery(
          `
            SELECT id, name, pricingTier
            FROM customers
            WHERE outletId = ?
              AND status = 'active'
              AND (deletedAt IS NULL OR deletedAt = '')
            ORDER BY LOWER(name) ASC
          `,
          [selectedOutletId],
        );
        if (cancelled) return;
        setCustomers(rows || []);
      } catch {
        if (!cancelled) setCustomers([]);
      } finally {
        if (!cancelled) setIsCustomersLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedOutletId]);

  const loadQuote = useCallback(async () => {
    if (!isOpen) return;
    if (!selectedOutletId) return;
    if (!quoteId) return;

    const api: any = (window as any).electronAPI;
    if (!api?.dbQuery) return;

    setLoading(true);
    try {
      const orderRows = await api.dbQuery(
        `
          SELECT o.*, c.name as customerName, c.pricingTier as customerPricingTier
          FROM orders o
          LEFT JOIN customers c ON c.id = o.customerId
          WHERE o.id = ? AND o.outletId = ?
          LIMIT 1
        `,
        [quoteId, selectedOutletId],
      );
      const o = orderRows?.[0] || null;
      setOrder(o);
      setCartId(String(o?.cartId || ""));

      setCustomerId(String(o?.customerId || ""));
      setOccasion(String(o?.occasion || ""));
      const dm = String(o?.deliveryMethod || "").toLowerCase();
      setDeliveryMethod(dm.includes("deliver") ? "delivery" : "pickup");
      setRecipientName(String(o?.recipientName || ""));
      setSpecialInstructions(String(o?.specialInstructions || ""));

      const sched = parseScheduledAt(o?.scheduledAt);
      setScheduledDate(sched.date);
      setScheduledTime(sched.time);

      if (o?.cartId) {
        const itemRows = await api.dbQuery(
          `
            SELECT
              ci.id as id,
              ci.productId as productId,
              ci.quantity as quantity,
              ci.unitPrice as unitPrice,
              ci.priceTierDiscount as priceTierDiscount,
              ci.priceTierMarkup as priceTierMarkup,
              p.name as productName,
              p.price as basePrice
            FROM cart_item ci
            LEFT JOIN product p ON p.id = ci.productId
            WHERE ci.cartId = ?
          `,
          [o.cartId],
        );
        const mapped = (itemRows || []).map((r: any) => ({
          id: String(r.id),
          productId: String(r.productId || ""),
          productName: String(r.productName || ""),
          quantity: String(r.quantity ?? ""),
          basePrice: Number(r.basePrice ?? 0) || 0,
          unitPrice: Number(r.unitPrice ?? 0) || 0,
          priceTierDiscount: Number(r.priceTierDiscount ?? 0) || 0,
          priceTierMarkup: Number(r.priceTierMarkup ?? 0) || 0,
        }));
        setItems(mapped);
      } else {
        setItems([]);
      }
    } catch (e) {
      console.error("Failed to load quote:", e);
      setOrder(null);
      setCartId("");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isOpen, quoteId, selectedOutletId]);

  useEffect(() => {
    loadQuote();
  }, [loadQuote]);

  useEffect(() => {
    if (!isOpen) return;
    setItems((prev) =>
      prev.map((it) => {
        if (!it.productId) return it;
        const found = products.find((p: any) => String(p.id) === it.productId);
        const basePrice = Number(found?.price ?? it.basePrice ?? 0) || 0;
        const { unitPrice, priceTierDiscount, priceTierMarkup } =
          computeTierPrice(basePrice);
        return {
          ...it,
          basePrice,
          unitPrice,
          priceTierDiscount,
          priceTierMarkup,
        };
      }),
    );
  }, [computeTierPrice, customerId, isOpen, products]);

  const queueUpdates = useCallback(
    async (api: any) => {
      if (!api?.queueAdd) return;
      if (!cartId || !quoteId) return;

      const [cartRow] = await api.dbQuery(
        "SELECT * FROM cart WHERE id = ? LIMIT 1",
        [cartId],
      );
      if (cartRow) {
        await api.queueAdd({
          table: "cart",
          action: "UPDATE",
          data: cartRow,
          id: cartId,
        });
      }
      const itemRows = await api.dbQuery(
        "SELECT * FROM cart_item WHERE cartId = ?",
        [cartId],
      );
      for (const row of itemRows || []) {
        const id = String(row?.id || "");
        if (!id) continue;
        await api.queueAdd({
          table: "cart_item",
          action: "UPDATE",
          data: row,
          id,
        });
      }
      const [orderRow] = await api.dbQuery(
        "SELECT * FROM orders WHERE id = ? LIMIT 1",
        [quoteId],
      );
      if (orderRow) {
        await api.queueAdd({
          table: "order",
          action: "UPDATE",
          data: orderRow,
          id: quoteId,
        });
      }
    },
    [cartId, quoteId],
  );

  const saveQuote = useCallback(
    async (next: {
      orderType?: "Order" | "Quote";
      status?: string;
      paymentStatus?: string | null;
      confirmedAt?: string | null;
    }) => {
      if (!selectedOutletId) return false;
      if (!quoteId) return false;
      if (!cartId) return false;

      const api: any = (window as any).electronAPI;
      if (!api?.dbQuery) return false;

      const now = new Date().toISOString();
      const cleanedItems = items
        .map((it) => ({ ...it, quantity: sanitizeNumber(it.quantity) }))
        .filter((it) => it.productId && Number(it.quantity || 0) > 0);

      const subtotalAmount = cleanedItems.reduce((acc, it) => {
        const qty = Math.floor(Number(it.quantity || 0) || 0);
        return acc + (Number(it.unitPrice || 0) || 0) * qty;
      }, 0);

      const taxRateTotal = checkoutTaxes.reduce(
        (acc: number, t: { name: string; rate: number }) => acc + t.rate,
        0,
      );
      const taxAmount = (subtotalAmount * taxRateTotal) / 100;
      const serviceChargeAmount = checkoutServiceCharge
        ? (subtotalAmount * checkoutServiceCharge.rate) / 100
        : 0;
      const totalAmount = subtotalAmount + taxAmount + serviceChargeAmount;

      const discountAmount = cleanedItems.reduce((acc, it) => {
        const qty = Math.floor(Number(it.quantity || 0) || 0);
        return acc + (Number(it.priceTierDiscount || 0) || 0) * qty;
      }, 0);
      const markupAmount = cleanedItems.reduce((acc, it) => {
        const qty = Math.floor(Number(it.quantity || 0) || 0);
        return acc + (Number(it.priceTierMarkup || 0) || 0) * qty;
      }, 0);

      try {
        const timelineRows = await api.dbQuery(
          "SELECT timeline, orderType, paymentStatus, status FROM orders WHERE id = ? LIMIT 1",
          [quoteId],
        );
        const currentTimelineRaw = timelineRows?.[0]?.timeline;
        const currentOrderType = String(
          timelineRows?.[0]?.orderType || "Quote",
        );
        const currentPaymentStatus = String(
          timelineRows?.[0]?.paymentStatus ?? "",
        );
        const currentStatus = String(timelineRows?.[0]?.status ?? "");

        let timelineArr: any[] = [];
        if (Array.isArray(currentTimelineRaw)) {
          timelineArr = currentTimelineRaw;
        } else if (
          typeof currentTimelineRaw === "string" &&
          currentTimelineRaw.trim()
        ) {
          try {
            const parsed = JSON.parse(currentTimelineRaw);
            timelineArr = Array.isArray(parsed) ? parsed : [];
          } catch {
            timelineArr = [];
          }
        }

        if (next.orderType === "Order" && currentOrderType !== "Order") {
          timelineArr.push({
            action: "quote_converted",
            timestamp: now,
            description: "Quote converted to order",
          });
        }
        if (next.status && next.status !== currentStatus) {
          if (next.status === "Confirmed") {
            timelineArr.push({
              action: "confirmed",
              timestamp: now,
              description: "Order confirmed",
            });
          }
          if (next.status === "Cancelled") {
            timelineArr.push({
              action: "cancelled",
              timestamp: now,
              description: "Order cancelled",
            });
          }
        }
        if (
          next.paymentStatus === "Verified" &&
          currentPaymentStatus !== "Verified"
        ) {
          timelineArr.push({
            action: "payment_processed",
            timestamp: now,
            description: "Payment processed",
          });
        }
        const nextTimeline = JSON.stringify(timelineArr);

        const existingItemRows = await api.dbQuery(
          "SELECT id FROM cart_item WHERE cartId = ?",
          [cartId],
        );
        const existingIds = new Set<string>(
          (existingItemRows || []).map((r: any) => String(r.id)),
        );
        const nextIds = new Set<string>(
          cleanedItems.map((it) => String(it.id)),
        );

        for (const it of cleanedItems) {
          const id = String(it.id);
          const qty = Math.floor(Number(it.quantity || 0) || 0);
          if (existingIds.has(id)) {
            await api.dbQuery(
              `
                UPDATE cart_item
                SET productId = ?, quantity = ?, unitPrice = ?, priceTierDiscount = ?, priceTierMarkup = ?
                WHERE id = ? AND cartId = ?
              `,
              [
                it.productId,
                qty,
                Number(it.unitPrice || 0) || 0,
                Number(it.priceTierDiscount || 0) || 0,
                Number(it.priceTierMarkup || 0) || 0,
                id,
                cartId,
              ],
            );
          } else {
            await api.dbQuery(
              `
                INSERT INTO cart_item (
                  id, productId, quantity, unitPrice, cartId, priceTierDiscount, priceTierMarkup, recordId, version
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              `,
              [
                id,
                it.productId,
                qty,
                Number(it.unitPrice || 0) || 0,
                cartId,
                Number(it.priceTierDiscount || 0) || 0,
                Number(it.priceTierMarkup || 0) || 0,
                null,
                0,
              ],
            );
          }
        }

        for (const id of existingIds) {
          if (nextIds.has(id)) continue;
          await api.dbQuery(
            "DELETE FROM cart_item WHERE id = ? AND cartId = ?",
            [id, cartId],
          );
        }

        await api.dbQuery(
          `
            UPDATE cart
            SET
              updatedAt = ?,
              itemCount = ?,
              totalQuantity = ?,
              totalAmount = ?,
              customerId = ?
            WHERE id = ?
          `,
          [
            now,
            cleanedItems.length,
            cleanedItems.reduce(
              (acc, it) => acc + Math.floor(Number(it.quantity || 0) || 0),
              0,
            ),
            subtotalAmount,
            customerId || null,
            cartId,
          ],
        );

        await api.dbQuery(
          `
            UPDATE orders
            SET
              customerId = ?,
              occasion = ?,
              deliveryMethod = ?,
              recipientName = ?,
              scheduledAt = ?,
              specialInstructions = ?,
              amount = ?,
              tax = ?,
              serviceCharge = ?,
              total = ?,
              discount = ?,
              markup = ?,
              orderType = COALESCE(?, orderType),
              status = COALESCE(?, status),
              paymentStatus = COALESCE(?, paymentStatus),
              confirmedAt = COALESCE(?, confirmedAt),
              timeline = ?,
              updatedAt = ?
            WHERE id = ? AND outletId = ?
          `,
          [
            customerId || null,
            occasion || null,
            deliveryMethod,
            recipientName || null,
            scheduledAt || null,
            specialInstructions || null,
            subtotalAmount,
            taxAmount,
            serviceChargeAmount,
            totalAmount,
            discountAmount,
            markupAmount,
            next.orderType ?? null,
            next.status ?? null,
            next.paymentStatus ?? null,
            next.confirmedAt ?? null,
            nextTimeline,
            now,
            quoteId,
            selectedOutletId,
          ],
        );

        await queueUpdates(api);
        setOrder((prev: any) => ({
          ...(prev || {}),
          customerId,
          occasion,
          deliveryMethod,
          recipientName,
          scheduledAt,
          specialInstructions,
          amount: subtotalAmount,
          tax: taxAmount,
          serviceCharge: serviceChargeAmount,
          total: totalAmount,
          discount: discountAmount,
          markup: markupAmount,
          timeline: nextTimeline,
          orderType: next.orderType ?? prev?.orderType,
          status: next.status ?? prev?.status,
          paymentStatus: next.paymentStatus ?? prev?.paymentStatus,
          confirmedAt: next.confirmedAt ?? prev?.confirmedAt,
          updatedAt: now,
        }));
        onUpdated?.();
        return true;
      } catch (e) {
        console.error("Failed to save quote:", e);
        showToast("error", "Update failed", "Failed to update quote");
        return false;
      }
    },
    [
      cartId,
      checkoutServiceCharge,
      checkoutTaxes,
      customerId,
      deliveryMethod,
      items,
      occasion,
      onUpdated,
      quoteId,
      queueUpdates,
      recipientName,
      scheduledAt,
      selectedOutletId,
      showToast,
      specialInstructions,
    ],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex justify-end">
      <div className="relative w-full max-w-[980px] h-full bg-white shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
        <div className="px-8 pt-8 pb-4 flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <div className="text-[23px] font-bold text-[#111827]">Quote</div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold bg-[#F3F4F6] text-[#6B7280]">
                Created {formatRelativeTime(order?.createdAt)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Close"
            title="Close"
          >
            <X className="h-6 w-6 text-gray-700" />
          </button>
        </div>

        <div className="px-8">
          <div className="flex items-end gap-3 border-b border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => setActiveStep("details")}
              className={`relative pb-3 text-[16px] font-semibold ${
                activeStep === "details" ? "text-[#111827]" : "text-[#9CA3AF]"
              }`}
            >
              Customer &amp; Quote Details
              {activeStep === "details" && (
                <span className="absolute left-0 -bottom-[1px] h-[3px] w-full rounded-full bg-[#15BA5C]" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveStep("additional")}
              className={`relative pb-3 text-[16px] font-semibold ${
                activeStep === "additional"
                  ? "text-[#111827]"
                  : "text-[#9CA3AF]"
              }`}
            >
              Additional Information
              {activeStep === "additional" && (
                <span className="absolute left-0 -bottom-[1px] h-[3px] w-full rounded-full bg-[#15BA5C]" />
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          {loading ? (
            <div className="py-12 text-center text-sm text-[#6B7280]">
              Loading...
            </div>
          ) : (
            <div className="space-y-10">
              {activeStep === "details" && (
                <>
                  <div>
                    <div className="text-[20px] font-bold text-[#111827]">
                      Customer Information
                    </div>
                    <div className="mt-2 h-px w-full bg-[#E5E7EB]" />

                    <div className="mt-7">
                      <div className="text-[14px] font-semibold text-[#111827]">
                        Customer<span className="text-[#EF4444]">*</span>
                      </div>
                      <div className="mt-3 flex items-stretch w-full rounded-[10px] border border-[#E5E7EB] overflow-hidden bg-[#FAFAFA]">
                        <div className="flex-1 px-3 py-2">
                          <Dropdown
                            options={customerOptions}
                            selectedValue={customerId || undefined}
                            onChange={(v) => setCustomerId(v)}
                            placeholder="Select customer"
                            className="w-full"
                            loading={isCustomersLoading}
                            searchPlaceholder="Search customers..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-[#9CA3AF] pt-10">
                    <div className="text-[20px] font-bold text-[#111827]">
                      Quote Details
                    </div>
                    <div className="mt-2 h-px w-full bg-[#E5E7EB]" />

                    <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div>
                        <div className="text-[14px] font-semibold text-[#111827]">
                          Occassion<span className="text-[#EF4444]">*</span>
                        </div>
                        <div className="mt-3 flex items-stretch w-full rounded-[10px] border border-[#E5E7EB] overflow-hidden bg-[#FAFAFA]">
                          <Dropdown
                            options={occasionOptions}
                            selectedValue={occasion || undefined}
                            onChange={(v) => setOccasion(v)}
                            placeholder="Select Occassion"
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-12">
                      <div className="text-[18px] font-semibold text-[#111827]">
                        Add Products to your Quote
                      </div>

                      <div className="mt-4 space-y-4">
                        {items.map((it) => {
                          const qty = parseFloat(it.quantity);
                          const q = Number.isFinite(qty) ? qty : 0;
                          const totalPrice = it.unitPrice * q;
                          return (
                            <div
                              key={it.id}
                              className="rounded-[12px] border border-[#E5E7EB] bg-white px-5 py-5"
                            >
                              <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_0.7fr_0.8fr_0.8fr_64px] gap-4 items-center">
                                <div>
                                  <div className="text-[14px] font-semibold text-[#111827]">
                                    Select Product
                                  </div>
                                  <div className="flex items-stretch rounded-[10px] border-[#E5E7EB] overflow-hidden">
                                    <div className="flex-1 px-3 py-2 bg-white">
                                      <Dropdown
                                        options={productOptions}
                                        selectedValue={
                                          it.productId || undefined
                                        }
                                        onChange={(v) => {
                                          const found = products.find(
                                            (p: any) => String(p.id) === v,
                                          );
                                          const basePrice =
                                            Number(found?.price ?? 0) || 0;
                                          const {
                                            unitPrice,
                                            priceTierDiscount,
                                            priceTierMarkup,
                                          } = computeTierPrice(basePrice);
                                          updateItem(it.id, {
                                            productId: v,
                                            productName: String(
                                              found?.name || "",
                                            ),
                                            basePrice,
                                            unitPrice,
                                            priceTierDiscount,
                                            priceTierMarkup,
                                          });
                                        }}
                                        placeholder="Select Product"
                                        className="w-full"
                                        loading={isProductsLoading}
                                        searchPlaceholder="Search products..."
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <div className="text-[14px] font-semibold text-[#111827]">
                                    Quantity
                                  </div>
                                  <input
                                    value={it.quantity}
                                    onChange={(e) =>
                                      updateItem(it.id, {
                                        quantity: sanitizeNumber(
                                          e.target.value,
                                        ),
                                      })
                                    }
                                    className="mt-2 h-12 w-full rounded-[10px] border border-[#E5E7EB] px-4 text-[15px] outline-none"
                                    placeholder="0"
                                  />
                                </div>

                                <div>
                                  <div className="text-[14px] font-semibold text-[#111827]">
                                    Unit Price
                                  </div>
                                  <div className="mt-2 h-12 w-full rounded-[10px] bg-[#E5E7EB] px-4 flex items-center text-[15px] text-[#111827]">
                                    {currencySymbol}
                                    {formatAmount(it.unitPrice)}
                                  </div>
                                  {(it.priceTierDiscount > 0 ||
                                    it.priceTierMarkup > 0) && (
                                    <div className="mt-2 text-[12px] text-[#6B7280]">
                                      Base {currencySymbol}
                                      {formatAmount(it.basePrice)}
                                      {it.priceTierDiscount > 0
                                        ? ` • Discount -${currencySymbol}${formatAmount(
                                            it.priceTierDiscount,
                                          )}`
                                        : ` • Markup +${currencySymbol}${formatAmount(
                                            it.priceTierMarkup,
                                          )}`}
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <div className="text-[14px] font-semibold text-[#111827]">
                                    Total Price
                                  </div>
                                  <div className="mt-2 h-12 w-full rounded-[10px] bg-[#E5E7EB] px-4 flex items-center text-[15px] text-[#111827]">
                                    {currencySymbol}
                                    {formatAmount(totalPrice)}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => removeItem(it.id)}
                                  className="h-12 w-12 rounded-[10px] mt-5 bg-[#EF4444] text-white inline-flex items-center justify-center hover:bg-[#DC2626] transition-colors"
                                  aria-label="Remove item"
                                  title="Remove item"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={addItem}
                        className="mt-6 h-12 px-6 rounded-[12px] cursor-pointer bg-[#15BA5C] text-white font-semibold inline-flex items-center gap-3 hover:bg-[#13A652] transition-colors"
                      >
                        <Plus className="h-5 w-5" />
                        Add New Product
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeStep === "additional" && (
                <>
                  <div>
                    <div className="text-[20px] font-bold text-[#111827]">
                      Shipping Options
                    </div>
                    <div className="mt-2 text-[14px] text-[#6B7280]">
                      Will this order be collected or delivered?
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod("pickup")}
                        className={`rounded-[14px] border p-6 flex items-center justify-between ${
                          deliveryMethod === "pickup"
                            ? "border-[#15BA5C]"
                            : "border-[#E5E7EB]"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={PreOrderAssests.PickUp}
                            alt="Pick up"
                            className="h-12 w-12 object-contain"
                          />
                          <div className="text-[16px] font-semibold text-[#111827]">
                            Pick up
                          </div>
                        </div>
                        <div
                          className={`h-6 w-6 rounded-full border flex items-center justify-center ${
                            deliveryMethod === "pickup"
                              ? "border-[#15BA5C]"
                              : "border-[#D1D5DB]"
                          }`}
                        >
                          {deliveryMethod === "pickup" && (
                            <div className="h-3.5 w-3.5 rounded-full bg-[#15BA5C]" />
                          )}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryMethod("delivery")}
                        className={`rounded-[14px] border p-6 flex items-center justify-between ${
                          deliveryMethod === "delivery"
                            ? "border-[#15BA5C]"
                            : "border-[#E5E7EB]"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={PreOrderAssests.Delivery}
                            alt="Delivery"
                            className="h-12 w-12 object-contain"
                          />
                          <div className="text-[16px] font-semibold text-[#111827]">
                            Delivery
                          </div>
                        </div>
                        <div
                          className={`h-6 w-6 rounded-full border flex items-center justify-center ${
                            deliveryMethod === "delivery"
                              ? "border-[#15BA5C]"
                              : "border-[#D1D5DB]"
                          }`}
                        >
                          {deliveryMethod === "delivery" && (
                            <div className="h-3.5 w-3.5 rounded-full bg-[#15BA5C]" />
                          )}
                        </div>
                      </button>
                    </div>

                    <div className="mt-8 flex items-center justify-between">
                      <div className="text-[14px] text-[#6B7280]">
                        Use same customer details
                      </div>
                      <button
                        type="button"
                        onClick={() => setUseSameCustomerDetails((v) => !v)}
                        className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${
                          useSameCustomerDetails
                            ? "bg-[#15BA5C]"
                            : "bg-[#D1D5DB]"
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                            useSameCustomerDetails
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <div className="text-[14px] font-semibold text-[#111827]">
                          Recipient Name
                          <span className="text-[#EF4444]">*</span>
                        </div>
                        <input
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          placeholder="Enter recipient name"
                          className="mt-3 h-14 w-full rounded-[10px] border border-[#E5E7EB] bg-white px-5 text-[15px] outline-none"
                        />
                      </div>
                      <div>
                        <div className="text-[14px] font-semibold text-[#111827]">
                          Date and Time<span className="text-[#EF4444]">*</span>
                        </div>
                        <div className="mt-3">
                          <DatePicker
                            date={scheduledDate}
                            onDateChange={(d) => setScheduledDate(d)}
                            placeholder="Select Date"
                            className="h-14 rounded-[10px] border border-[#E5E7EB] hover:border-[#E5E7EB]"
                            popoverClassName="z-[220]"
                          />
                          {scheduledDate && (
                            <div className="mt-3 flex items-center justify-between gap-3">
                              <div className="text-[13px] text-[#6B7280]">
                                Select Time
                              </div>
                              <TimeDropdownSplit
                                value={scheduledTime}
                                onChange={(v) => setScheduledTime(v)}
                                minuteStep={1}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-[#9CA3AF] pt-10">
                    <div className="text-[18px] font-semibold text-[#111827]">
                      Additional Information{" "}
                      <span className="italic">(optional)</span>
                    </div>
                    <textarea
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder="Any special instructions or themes? Add them here to make the order unique"
                      className="mt-4 h-32 w-full rounded-[12px] border border-[#E5E7EB] bg-white px-5 py-4 text-[15px] outline-none resize-none"
                    />

                    <div className="mt-8 rounded-[12px] bg-[#F3F4F6] p-6">
                      <div className="flex items-center justify-between text-[14px] text-[#6B7280]">
                        <span>Sub-total</span>
                        <span>
                          {currencySymbol} {formatAmount(subtotal)}
                        </span>
                      </div>
                      {checkoutTaxes.map(
                        (t: { name: string; rate: number }) => (
                          <div
                            key={t.name}
                            className="mt-3 flex items-center justify-between text-[14px] text-[#6B7280]"
                          >
                            <span>
                              {t.name} ({t.rate}%)
                            </span>
                            <span>
                              {currencySymbol}{" "}
                              {formatAmount((subtotal * t.rate) / 100)}
                            </span>
                          </div>
                        ),
                      )}
                      {checkoutServiceCharge && (
                        <div className="mt-3 flex items-center justify-between text-[14px] text-[#6B7280]">
                          <span>
                            {checkoutServiceCharge.name} (
                            {checkoutServiceCharge.rate}%)
                          </span>
                          <span>
                            {currencySymbol} {formatAmount(serviceCharge)}
                          </span>
                        </div>
                      )}
                      <div className="mt-6 border-t border-[#D1D5DB] pt-6 flex items-center justify-between">
                        <div className="text-[18px] font-bold text-[#111827]">
                          Total Amount
                        </div>
                        <div className="text-[18px] font-bold text-[#111827]">
                          {currencySymbol} {formatAmount(total)}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="px-8 py-6 border-t border-[#E5E7EB] bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                const ok = await saveQuote({
                  orderType: "Order",
                  status: "Pending",
                });
                if (!ok) return;
                showToast("success", "Moved to Order", "Quote is now an order");
                onClose();
              }}
              className="h-14 w-full rounded-[12px] bg-[#F3F4F6] text-[#111827] font-bold text-[16px] hover:bg-[#E5E7EB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Move to Order
            </button>
            <button
              type="button"
              disabled={loading || !requiredFilled}
              onClick={async () => {
                const ok = await saveQuote({
                  orderType: "Order",
                  status: "Confirmed",
                  paymentStatus: "Verified",
                  confirmedAt: new Date().toISOString(),
                });
                if (!ok) return;
                showToast(
                  "success",
                  "Payment recorded",
                  "Order marked as paid",
                );
                onClose();
              }}
              className="h-14 w-full rounded-[12px] bg-[#15BA5C] text-white font-bold text-[16px] hover:bg-[#13A652] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                requiredFilled
                  ? "Proceed to payment"
                  : "Fill required fields to proceed"
              }
            >
              Proceed Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPreOrderQuote;
