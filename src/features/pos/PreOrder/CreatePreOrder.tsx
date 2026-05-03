"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Dropdown, type DropdownOption } from "@/features/settings/ui/Dropdown";
import { useBusinessStore } from "@/stores/useBusinessStore";
import { getCurrencySymbol } from "@/utils/getCurrencySymbol";
import { DatePicker } from "@/components/ui/date-picker";
import { TimeDropdownSplit } from "@/features/settings/ui/TimeDropdownSplit";
import { PhoneInput } from "@/features/settings/ui/PhoneInput";
import PreOrderAssests from "@/assets/images/pos/pre-order";
import useToastStore from "@/stores/toastStore";
import ProcessPaymentModal from "./ProcessPaymentModal";
import {
  getPhoneCountries,
  type PhoneCountry,
} from "@/utils/getPhoneCountries";

type CreatePreOrderProps = {
  isOpen: boolean;
  onClose: () => void;
  defaultOrderType?: "order" | "quote";
  onCreated?: () => void;
};

type Step = "details" | "additional";
type OrderType = "order" | "quote";
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

const CreatePreOrder = ({
  isOpen,
  onClose,
  defaultOrderType = "order",
  onCreated,
}: CreatePreOrderProps) => {
  const { selectedOutlet, selectedOutletId } = useBusinessStore();
  const { showToast } = useToastStore();
  const currencySymbol = selectedOutlet?.currency
    ? getCurrencySymbol(selectedOutlet.currency)
    : "₦";

  const [activeStep, setActiveStep] = useState<Step>("details");
  const [orderType, setOrderType] = useState<OrderType>(defaultOrderType);
  const [isSaving, setIsSaving] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState("");
  const [occasion, setOccasion] = useState("");
  const [occasionOptions, setOccasionOptions] = useState<DropdownOption[]>([
    { value: "Birthday", label: "Birthday" },
    { value: "Wedding", label: "Wedding" },
    { value: "Anniversary", label: "Anniversary" },
    { value: "Corporate", label: "Corporate" },
    { value: "Other", label: "Other" },
  ]);
  const [isAddOccasionOpen, setIsAddOccasionOpen] = useState(false);
  const [newOccasionName, setNewOccasionName] = useState("");

  const [products, setProducts] = useState<any[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isCustomersLoading, setIsCustomersLoading] = useState(false);

  const [items, setItems] = useState<LineItem[]>([
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

  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("pickup");
  const [useSameCustomerDetails, setUseSameCustomerDetails] = useState(true);
  const [recipientName, setRecipientName] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryPhoneNumber, setDeliveryPhoneNumber] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("0");
  const phoneCountries = useMemo(() => getPhoneCountries(), []);
  const defaultDeliveryPhoneCountry = useMemo(() => {
    if (phoneCountries.length === 0) return null;
    return (
      phoneCountries.find((country) => country.isoCode === "NG") ||
      phoneCountries[0] ||
      null
    );
  }, [phoneCountries]);
  const [deliveryPhoneCountry, setDeliveryPhoneCountry] =
    useState<PhoneCountry | null>(null);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(
    undefined,
  );
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [specialInstructions, setSpecialInstructions] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    setActiveStep("details");
    setOrderType(defaultOrderType);
    setCustomerId("");
    setOccasion("");
    setNewOccasionName("");
    setIsAddOccasionOpen(false);
    setItems([
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
    setDeliveryMethod("pickup");
    setUseSameCustomerDetails(true);
    setRecipientName("");
    setDeliveryAddress("");
    setDeliveryPhoneNumber("");
    setDeliveryFee("0");
    setDeliveryPhoneCountry(null);
    setScheduledDate(startOfToday);
    setScheduledTime("09:00");
    setSpecialInstructions("");
  }, [defaultOrderType, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (deliveryPhoneCountry) return;
    if (!defaultDeliveryPhoneCountry) return;
    setDeliveryPhoneCountry(defaultDeliveryPhoneCountry);
  }, [defaultDeliveryPhoneCountry, deliveryPhoneCountry, isOpen]);

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
            SELECT id, name, pricingTier, phoneNumber
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

  useEffect(() => {
    if (!isOpen) return;
    if (!useSameCustomerDetails) return;
    if (!selectedCustomer) return;
    const name = String(selectedCustomer?.name || "").trim();
    if (name) setRecipientName(name);
    const phone = String(selectedCustomer?.phoneNumber || "").trim();
    if (!phone) return;

    const normalizedPhone = phone.replace(/\s+/g, "");
    if (normalizedPhone.startsWith("+") && phoneCountries.length > 0) {
      const sortedCountries = [...phoneCountries].sort(
        (a, b) => b.dialCode.length - a.dialCode.length,
      );
      const matched = sortedCountries.find((c) =>
        normalizedPhone.startsWith(c.dialCode),
      );
      if (matched) {
        setDeliveryPhoneCountry(matched);
        setDeliveryPhoneNumber(
          normalizedPhone.slice(matched.dialCode.length).trim(),
        );
        return;
      }
    }

    if (!deliveryPhoneCountry && defaultDeliveryPhoneCountry) {
      setDeliveryPhoneCountry(defaultDeliveryPhoneCountry);
    }
    setDeliveryPhoneNumber(
      normalizedPhone.startsWith("+") ? normalizedPhone : phone,
    );
  }, [
    defaultDeliveryPhoneCountry,
    deliveryPhoneCountry,
    isOpen,
    phoneCountries,
    selectedCustomer,
    useSameCustomerDetails,
  ]);

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

  const subtotal = useMemo(() => {
    return items.reduce((acc, it) => {
      const qty = parseFloat(it.quantity);
      const q = Number.isFinite(qty) ? qty : 0;
      return acc + it.unitPrice * q;
    }, 0);
  }, [items]);

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

  const scheduledAt = useMemo(() => {
    if (!scheduledDate) return "";
    const yyyy = scheduledDate.getFullYear();
    const mm = String(scheduledDate.getMonth() + 1).padStart(2, "0");
    const dd = String(scheduledDate.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${scheduledTime}`;
  }, [scheduledDate, scheduledTime]);

  const deliveryRecipientPhone = useMemo(() => {
    if (deliveryMethod !== "delivery") return "";
    const raw = deliveryPhoneNumber.trim();
    if (!raw) return "";
    if (raw.startsWith("+")) return raw;
    const dial = deliveryPhoneCountry?.dialCode || "";
    return `${dial}${raw}`;
  }, [deliveryMethod, deliveryPhoneCountry, deliveryPhoneNumber]);

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

  const updateItem = (id: string, patch: Partial<LineItem>) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        return { ...it, ...patch };
      }),
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
    setItems((prev) => {
      const next = prev.filter((it) => it.id !== id);
      return next.length > 0
        ? next
        : [
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
          ];
    });
  };

  const primaryButtonLabel = useMemo(() => {
    if (orderType === "quote") return "Send Quote";
    return activeStep === "details"
      ? "Save and Continue"
      : "Proceed to Payment";
  }, [activeStep, orderType]);

  const generateReference = () => {
    const n = Math.floor(100000 + Math.random() * 900000);
    return `AnOR${n}`;
  };

  const handleCreateQuote = async () => {
    if (!selectedOutletId) {
      showToast("error", "No outlet selected", "Select an outlet first");
      return;
    }
    const api: any = (window as any).electronAPI;
    if (!api?.dbQuery) {
      showToast("error", "Offline DB not available", "dbQuery not found");
      return;
    }

    const cleanedItems = items
      .map((it) => ({
        ...it,
        quantity: sanitizeNumber(it.quantity),
      }))
      .filter((it) => it.productId && Number(it.quantity || 0) > 0);

    if (!occasion.trim()) {
      showToast("error", "Missing occasion", "Select an occasion");
      return;
    }
    if (cleanedItems.length === 0) {
      showToast("error", "No products", "Add at least one product");
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const orderId = crypto.randomUUID();
      const cartId = crypto.randomUUID();
      const orderReference = generateReference();
      const cartReference = `CRT-${Date.now()}`;
      const timeline = JSON.stringify([
        {
          action: "created",
          timestamp: now,
          description: "Quote created",
        },
      ]);

      const subtotalAmount = cleanedItems.reduce((acc, it) => {
        const qty = Math.floor(Number(it.quantity || 0) || 0);
        return acc + (Number(it.unitPrice || 0) || 0) * qty;
      }, 0);
      const discountAmount = cleanedItems.reduce((acc, it) => {
        const qty = Math.floor(Number(it.quantity || 0) || 0);
        return acc + (Number(it.priceTierDiscount || 0) || 0) * qty;
      }, 0);
      const markupAmount = cleanedItems.reduce((acc, it) => {
        const qty = Math.floor(Number(it.quantity || 0) || 0);
        return acc + (Number(it.priceTierMarkup || 0) || 0) * qty;
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

      await api.dbQuery(
        `
          INSERT INTO cart (
            id, reference, status, createdAt, updatedAt, outletId,
            itemCount, totalQuantity, totalAmount, customerId, recordId, version
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          cartId,
          cartReference,
          "open",
          now,
          now,
          selectedOutletId,
          cleanedItems.length,
          cleanedItems.reduce(
            (acc, it) => acc + Math.floor(Number(it.quantity || 0) || 0),
            0,
          ),
          subtotalAmount,
          customerId || null,
          null,
          0,
        ],
      );

      const cartItemIds: string[] = [];
      for (const it of cleanedItems) {
        const qty = Math.floor(Number(it.quantity || 0) || 0);
        const cartItemId = crypto.randomUUID();
        cartItemIds.push(cartItemId);
        await api.dbQuery(
          `
            INSERT INTO cart_item (
              id, productId, quantity, unitPrice, cartId, priceTierDiscount, priceTierMarkup, recordId, version
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            cartItemId,
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

      await api.dbQuery(
        `
          INSERT INTO orders (
            id, status, deliveryMethod, amount, tax, serviceCharge, total,
            specialInstructions, recipientName, occasion, scheduledAt,
            reference, orderMode, orderChannel, orderType,
            createdAt, updatedAt, customerId, outletId, cartId,
            paymentStatus, discount, markup, deletedAt, version, timeline
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          orderId,
          "Pending",
          deliveryMethod,
          subtotalAmount,
          taxAmount,
          serviceChargeAmount,
          totalAmount,
          specialInstructions || null,
          recipientName || null,
          occasion || null,
          scheduledAt || null,
          orderReference,
          "Preorder",
          "Preorder",
          "Quote",
          now,
          now,
          customerId || null,
          selectedOutletId,
          cartId,
          null,
          discountAmount,
          markupAmount,
          null,
          0,
          timeline,
        ],
      );

      if (api?.queueAdd) {
        const cartRows = await api.dbQuery(
          "SELECT * FROM cart WHERE id = ? LIMIT 1",
          [cartId],
        );
        const cartRow = cartRows?.[0] ?? null;
        if (cartRow) {
          await api.queueAdd({
            table: "cart",
            action: "CREATE",
            data: cartRow,
            id: cartId,
          });
        }

        if (cartItemIds.length > 0) {
          const placeholders = cartItemIds.map(() => "?").join(", ");
          const itemRows = await api.dbQuery(
            `SELECT * FROM cart_item WHERE id IN (${placeholders})`,
            cartItemIds,
          );
          for (const row of itemRows || []) {
            const id = String(row?.id || "");
            if (!id) continue;
            await api.queueAdd({
              table: "cart_item",
              action: "CREATE",
              data: row,
              id,
            });
          }
        }

        const orderRows = await api.dbQuery(
          "SELECT * FROM orders WHERE id = ? LIMIT 1",
          [orderId],
        );
        const orderRow = orderRows?.[0] ?? null;
        if (orderRow) {
          await api.queueAdd({
            table: "order",
            action: "CREATE",
            data: orderRow,
            id: orderId,
          });
        }
      }

      showToast(
        "success",
        "Quote created",
        "You have succesfully created a quote",
      );
      onCreated?.();
      onClose();
    } catch (e) {
      console.error("Failed to create quote:", e);
      showToast("error", "Create failed", "Failed to save quote");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateOrderAndProceedToPayment = async () => {
    if (!selectedOutletId) {
      showToast("error", "No outlet selected", "Select an outlet first");
      return;
    }
    const api: any = (window as any).electronAPI;
    if (!api?.dbQuery) {
      showToast("error", "Offline DB not available", "dbQuery not found");
      return;
    }

    const cleanedItems = items
      .map((it) => ({
        ...it,
        quantity: sanitizeNumber(it.quantity),
      }))
      .filter((it) => it.productId && Number(it.quantity || 0) > 0);

    if (!customerId) {
      showToast("error", "Missing customer", "Select a customer");
      return;
    }
    if (!occasion.trim()) {
      showToast("error", "Missing occasion", "Select an occasion");
      return;
    }
    if (!recipientName.trim()) {
      showToast("error", "Missing recipient name", "Enter recipient name");
      return;
    }
    if (!scheduledAt) {
      showToast("error", "Missing date/time", "Select scheduled date and time");
      return;
    }
    if (deliveryMethod === "delivery") {
      if (!deliveryAddress.trim()) {
        showToast("error", "Missing address", "Enter delivery address");
        return;
      }
      if (!deliveryRecipientPhone.trim()) {
        showToast(
          "error",
          "Missing phone number",
          "Enter delivery phone number",
        );
        return;
      }
    }
    if (cleanedItems.length === 0) {
      showToast("error", "No products", "Add at least one product");
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const orderId = crypto.randomUUID();
      const cartId = crypto.randomUUID();
      const orderReference = generateReference();
      const cartReference = `CRT-${Date.now()}`;
      const timeline = JSON.stringify([
        {
          action: "created",
          timestamp: now,
          description: "Order created",
        },
      ]);

      const subtotalAmount = cleanedItems.reduce((acc, it) => {
        const qty = Math.floor(Number(it.quantity || 0) || 0);
        return acc + (Number(it.unitPrice || 0) || 0) * qty;
      }, 0);
      const discountAmount = cleanedItems.reduce((acc, it) => {
        const qty = Math.floor(Number(it.quantity || 0) || 0);
        return acc + (Number(it.priceTierDiscount || 0) || 0) * qty;
      }, 0);
      const markupAmount = cleanedItems.reduce((acc, it) => {
        const qty = Math.floor(Number(it.quantity || 0) || 0);
        return acc + (Number(it.priceTierMarkup || 0) || 0) * qty;
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

      await api.dbQuery(
        `
          INSERT INTO cart (
            id, reference, status, createdAt, updatedAt, outletId,
            itemCount, totalQuantity, totalAmount, customerId, recordId, version
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          cartId,
          cartReference,
          "open",
          now,
          now,
          selectedOutletId,
          cleanedItems.length,
          cleanedItems.reduce(
            (acc, it) => acc + Math.floor(Number(it.quantity || 0) || 0),
            0,
          ),
          subtotalAmount,
          customerId || null,
          null,
          0,
        ],
      );

      const cartItemIds: string[] = [];
      for (const it of cleanedItems) {
        const qty = Math.floor(Number(it.quantity || 0) || 0);
        const cartItemId = crypto.randomUUID();
        cartItemIds.push(cartItemId);
        await api.dbQuery(
          `
            INSERT INTO cart_item (
              id, productId, quantity, unitPrice, cartId, priceTierDiscount, priceTierMarkup, recordId, version
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            cartItemId,
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

      await api.dbQuery(
        `
          INSERT INTO orders (
            id, status, deliveryMethod, amount, tax, serviceCharge, total,
            deliveryFee, specialInstructions, recipientName, occasion, recipientPhone, scheduledAt, address,
            reference, orderMode, orderChannel, orderType,
            createdAt, updatedAt, customerId, outletId, cartId,
            paymentStatus, discount, markup, deletedAt, version, timeline
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          orderId,
          "Pending",
          deliveryMethod === "pickup" ? "Pickup" : "Delivery",
          subtotalAmount,
          taxAmount,
          serviceChargeAmount,
          totalAmount,
          Number(sanitizeNumber(deliveryFee || "0") || 0) || 0,
          specialInstructions || null,
          recipientName || null,
          occasion || null,
          deliveryRecipientPhone || null,
          scheduledAt || null,
          deliveryAddress || null,
          orderReference,
          "Preorder",
          "Preorder",
          "Order",
          now,
          now,
          customerId || null,
          selectedOutletId,
          cartId,
          "Pending",
          discountAmount,
          markupAmount,
          null,
          0,
          timeline,
        ],
      );

      if (api?.queueAdd) {
        const cartRows = await api.dbQuery(
          "SELECT * FROM cart WHERE id = ? LIMIT 1",
          [cartId],
        );
        const cartRow = cartRows?.[0] ?? null;
        if (cartRow) {
          await api.queueAdd({
            table: "cart",
            action: "CREATE",
            data: cartRow,
            id: cartId,
          });
        }

        if (cartItemIds.length > 0) {
          const placeholders = cartItemIds.map(() => "?").join(", ");
          const itemRows = await api.dbQuery(
            `SELECT * FROM cart_item WHERE id IN (${placeholders})`,
            cartItemIds,
          );
          for (const row of itemRows || []) {
            const id = String(row?.id || "");
            if (!id) continue;
            await api.queueAdd({
              table: "cart_item",
              action: "CREATE",
              data: row,
              id,
            });
          }
        }

        const orderRows = await api.dbQuery(
          "SELECT * FROM orders WHERE id = ? LIMIT 1",
          [orderId],
        );
        const orderRow = orderRows?.[0] ?? null;
        if (orderRow) {
          await api.queueAdd({
            table: "order",
            action: "CREATE",
            data: orderRow,
            id: orderId,
          });
        }
      }

      onCreated?.();
      setCreatedOrderId(orderId);
      setIsPaymentOpen(true);
    } catch (e) {
      console.error("Failed to create order:", e);
      showToast("error", "Create failed", "Failed to save order");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedOutletId) {
      showToast("error", "No outlet selected", "Select an outlet first");
      return;
    }
    const api: any = (window as any).electronAPI;
    if (!api?.dbQuery) {
      showToast("error", "Offline DB not available", "dbQuery not found");
      return;
    }

    const cleanedItems = items
      .map((it) => ({
        ...it,
        quantity: sanitizeNumber(it.quantity),
      }))
      .filter((it) => it.productId && Number(it.quantity || 0) > 0);

    if (cleanedItems.length === 0) {
      showToast("error", "No products", "Add at least one product");
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const orderId = crypto.randomUUID();
      const cartId = crypto.randomUUID();
      const orderReference = generateReference();
      const cartReference = `CRT-${Date.now()}`;
      const timeline = JSON.stringify([
        {
          action: "draft_saved",
          timestamp: now,
          description: "Order saved as draft",
        },
      ]);

      const subtotalAmount = cleanedItems.reduce((acc, it) => {
        const qty = Math.floor(Number(it.quantity || 0) || 0);
        return acc + (Number(it.unitPrice || 0) || 0) * qty;
      }, 0);
      const discountAmount = cleanedItems.reduce((acc, it) => {
        const qty = Math.floor(Number(it.quantity || 0) || 0);
        return acc + (Number(it.priceTierDiscount || 0) || 0) * qty;
      }, 0);
      const markupAmount = cleanedItems.reduce((acc, it) => {
        const qty = Math.floor(Number(it.quantity || 0) || 0);
        return acc + (Number(it.priceTierMarkup || 0) || 0) * qty;
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

      await api.dbQuery(
        `
          INSERT INTO cart (
            id, reference, status, createdAt, updatedAt, outletId,
            itemCount, totalQuantity, totalAmount, customerId, recordId, version
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          cartId,
          cartReference,
          "open",
          now,
          now,
          selectedOutletId,
          cleanedItems.length,
          cleanedItems.reduce(
            (acc, it) => acc + Math.floor(Number(it.quantity || 0) || 0),
            0,
          ),
          subtotalAmount,
          customerId || null,
          null,
          0,
        ],
      );

      const cartItemIds: string[] = [];
      for (const it of cleanedItems) {
        const qty = Math.floor(Number(it.quantity || 0) || 0);
        const cartItemId = crypto.randomUUID();
        cartItemIds.push(cartItemId);
        await api.dbQuery(
          `
            INSERT INTO cart_item (
              id, productId, quantity, unitPrice, cartId, priceTierDiscount, priceTierMarkup, recordId, version
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            cartItemId,
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

      await api.dbQuery(
        `
          INSERT INTO orders (
            id, status, deliveryMethod, amount, tax, serviceCharge, total,
            deliveryFee, specialInstructions, recipientName, occasion, recipientPhone, scheduledAt, address,
            reference, orderMode, orderChannel, orderType,
            createdAt, updatedAt, customerId, outletId, cartId,
            paymentStatus, discount, markup, deletedAt, version, timeline
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          orderId,
          "Draft",
          deliveryMethod === "pickup" ? "Pickup" : "Delivery",
          subtotalAmount,
          taxAmount,
          serviceChargeAmount,
          totalAmount,
          Number(sanitizeNumber(deliveryFee || "0") || 0) || 0,
          specialInstructions || null,
          recipientName || null,
          occasion || null,
          deliveryRecipientPhone || null,
          scheduledAt || null,
          deliveryAddress || null,
          orderReference,
          "Preorder",
          "Preorder",
          "Order",
          now,
          now,
          customerId || null,
          selectedOutletId,
          cartId,
          null,
          discountAmount,
          markupAmount,
          null,
          0,
          timeline,
        ],
      );

      if (api?.queueAdd) {
        const cartRows = await api.dbQuery(
          "SELECT * FROM cart WHERE id = ? LIMIT 1",
          [cartId],
        );
        const cartRow = cartRows?.[0] ?? null;
        if (cartRow) {
          await api.queueAdd({
            table: "cart",
            action: "CREATE",
            data: cartRow,
            id: cartId,
          });
        }

        if (cartItemIds.length > 0) {
          const placeholders = cartItemIds.map(() => "?").join(", ");
          const itemRows = await api.dbQuery(
            `SELECT * FROM cart_item WHERE id IN (${placeholders})`,
            cartItemIds,
          );
          for (const row of itemRows || []) {
            const id = String(row?.id || "");
            if (!id) continue;
            await api.queueAdd({
              table: "cart_item",
              action: "CREATE",
              data: row,
              id,
            });
          }
        }

        const orderRows = await api.dbQuery(
          "SELECT * FROM orders WHERE id = ? LIMIT 1",
          [orderId],
        );
        const orderRow = orderRows?.[0] ?? null;
        if (orderRow) {
          await api.queueAdd({
            table: "order",
            action: "CREATE",
            data: orderRow,
            id: orderId,
          });
        }
      }

      showToast("success", "Draft saved", "Order saved as draft");
      onCreated?.();
      onClose();
    } catch (e) {
      console.error("Failed to save draft:", e);
      showToast("error", "Save failed", "Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[160] bg-black/40 backdrop-blur-sm flex justify-end">
        <div className="relative w-full max-w-[980px] h-full bg-white shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
          <div className="px-8 pt-8 pb-4 flex items-start justify-between">
            <div className="text-[23px] font-bold text-[#111827]">
              Create New Order
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
                Customer &amp; Order Details
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
            {activeStep === "details" ? (
              <div className="space-y-10">
                <div>
                  <div className="text-[20px] font-bold text-[#111827]">
                    Customer Information
                  </div>
                  <div className="mt-2 h-px w-full bg-[#E5E7EB]" />

                  <div className="mt-7">
                    <div className="text-[14px] font-semibold text-[#111827]">
                      Customer<span className="text-[#EF4444]">*</span>
                    </div>
                    <div className="mt-3 flex  w-full  overflow-hidden ">
                      <div className="flex-1  py-2">
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
                    <div className="mt-3 flex items-center gap-2 text-[13px] text-[#6B7280]">
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full border border-[#15BA5C] text-[#15BA5C] text-[12px] font-bold">
                        i
                      </span>
                      Select existing customer or create a new one
                    </div>
                  </div>
                </div>

                <div className="border-t border-dashed border-[#9CA3AF] pt-10">
                  <div className="text-[20px] font-bold text-[#111827]">
                    Order Details
                  </div>
                  <div className="mt-2 h-px w-full bg-[#E5E7EB]" />

                  <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                      <div className="text-[14px] font-semibold text-[#111827]">
                        Order Type<span className="text-[#EF4444]">*</span>
                      </div>
                      <div className="mt-4 space-y-4">
                        <button
                          type="button"
                          onClick={() => setOrderType("order")}
                          className={`  flex items-center justify-between ${
                            orderType === "order"
                              ? "border-[#15BA5C]"
                              : "border-[#E5E7EB]"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                                orderType === "order"
                                  ? "border-[#15BA5C]"
                                  : "border-[#D1D5DB]"
                              }`}
                            >
                              {orderType === "order" && (
                                <div className="h-2 w-2 rounded-full bg-[#15BA5C]" />
                              )}
                            </div>
                            <div className="text-[15px] font-semibold text-[#111827]">
                              Order
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setOrderType("quote")}
                          className={`  flex items-center justify-between ${
                            orderType === "quote"
                              ? "border-[#15BA5C]"
                              : "border-[#E5E7EB]"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                                orderType === "quote"
                                  ? "border-[#15BA5C]"
                                  : "border-[#D1D5DB]"
                              }`}
                            >
                              {orderType === "quote" && (
                                <div className="h-2 w-2 rounded-full bg-[#15BA5C]" />
                              )}
                            </div>{" "}
                            <div className="text-[15px] font-semibold text-[#111827]">
                              Quote
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

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
                      <div className="mt-3 flex items-center gap-2 text-[13px] text-[#6B7280]">
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full border border-[#15BA5C] text-[#15BA5C] text-[12px] font-bold">
                          i
                        </span>
                        Select the event type or create for your customer
                      </div>
                    </div>
                  </div>

                  <div className="mt-12">
                    <div className="text-[18px] font-semibold text-[#111827]">
                      Add Products to your Order
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
                                <div className="flex items-stretch rounded-[10px]  border-[#E5E7EB] overflow-hidden">
                                  <div className="flex-1 px-3 py-2 bg-white">
                                    <Dropdown
                                      options={productOptions}
                                      selectedValue={it.productId || undefined}
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
                                      quantity: sanitizeNumber(e.target.value),
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
              </div>
            ) : (
              <div className="space-y-10">
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
                        useSameCustomerDetails ? "bg-[#15BA5C]" : "bg-[#D1D5DB]"
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
                    {deliveryMethod === "delivery" && (
                      <div>
                        <div className="text-[14px] font-semibold text-[#111827]">
                          Delivery Address
                          <span className="text-[#EF4444]">*</span>
                        </div>
                        <input
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          disabled={useSameCustomerDetails}
                          placeholder="Enter delivery address"
                          className={`mt-3 h-14 w-full rounded-[10px] border border-[#E5E7EB] bg-white px-5 text-[15px] outline-none ${
                            useSameCustomerDetails
                              ? "opacity-60 cursor-not-allowed"
                              : ""
                          }`}
                        />
                        <div className="mt-3 flex items-center gap-2 text-[13px] text-[#6B7280]">
                          <span className="inline-flex items-center justify-center h-5 w-5 rounded-full border border-[#15BA5C] text-[#15BA5C] text-[12px] font-bold">
                            i
                          </span>
                          Please include city/state/country for API
                        </div>
                      </div>
                    )}

                    {deliveryMethod === "delivery" && (
                      <div>
                        <div className="text-[14px] font-semibold text-[#111827]">
                          Delivery Phone Number
                          <span className="text-[#EF4444]">*</span>
                        </div>
                        <PhoneInput
                          value={deliveryPhoneNumber}
                          onChange={(value) => setDeliveryPhoneNumber(value)}
                          selectedCountry={deliveryPhoneCountry || undefined}
                          onCountryChange={(country) =>
                            setDeliveryPhoneCountry(country)
                          }
                          disabled={useSameCustomerDetails}
                          placeholder="Enter delivery phone number"
                          className="mt-3 h-14 w-full"
                        />
                      </div>
                    )}

                    <div>
                      <div className="text-[14px] font-semibold text-[#111827]">
                        Recipient Name<span className="text-[#EF4444]">*</span>
                      </div>
                      <input
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        disabled={useSameCustomerDetails}
                        placeholder="Enter recipient name"
                        className={`mt-3 h-14 w-full rounded-[10px] border border-[#E5E7EB] bg-white px-5 text-[15px] outline-none ${
                          useSameCustomerDetails
                            ? "opacity-60 cursor-not-allowed"
                            : ""
                        }`}
                      />
                    </div>

                    {deliveryMethod === "delivery" && (
                      <div>
                        <div className="text-[14px] font-semibold text-[#111827]">
                          Delivery Fee
                        </div>
                        <input
                          value={deliveryFee}
                          onChange={(e) =>
                            setDeliveryFee(sanitizeNumber(e.target.value))
                          }
                          placeholder="0"
                          className="mt-3 h-14 w-full rounded-[10px] border border-[#E5E7EB] bg-white px-5 text-[15px] outline-none"
                        />
                      </div>
                    )}

                    <div
                      className={
                        deliveryMethod === "delivery" ? "md:col-span-2" : ""
                      }
                    >
                      <div className="text-[14px] font-semibold text-[#111827]">
                        {deliveryMethod === "delivery"
                          ? "Delivery Date and Time"
                          : "Date and Time"}
                        <span className="text-[#EF4444]">*</span>
                      </div>
                      <div className="mt-3">
                        <DatePicker
                          disabledDates={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return date < today;
                          }}
                          date={scheduledDate}
                          onDateChange={(d) => setScheduledDate(d)}
                          placeholder={
                            deliveryMethod === "delivery"
                              ? "Select delivery date"
                              : "Select Date"
                          }
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
                    {checkoutTaxes.map((t: { name: string; rate: number }) => (
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
                    ))}
                    {checkoutServiceCharge && (
                      <div className="mt-3 flex items-center justify-between text-[14px] text-[#6B7280]">
                        <span>
                          {checkoutServiceCharge.name} (
                          {checkoutServiceCharge.rate}
                          %)
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
              </div>
            )}
          </div>

          <div className="px-8 py-6 border-t border-[#E5E7EB] bg-white">
            {orderType === "quote" ? (
              <button
                type="button"
                disabled={isSaving}
                onClick={handleCreateQuote}
                className="h-14 w-full cursor-pointer rounded-[12px] bg-[#15BA5C] text-white font-bold text-[18px] hover:bg-[#13A652] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {primaryButtonLabel}
              </button>
            ) : (
              <div className="flex gap-6">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveDraft}
                  className="h-14 flex-1 cursor-pointer rounded-[12px] bg-[#E5E7EB] text-[#111827] font-bold text-[18px] hover:bg-[#D1D5DB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (activeStep === "details") {
                      setActiveStep("additional");
                      return;
                    }
                    handleCreateOrderAndProceedToPayment();
                  }}
                  disabled={isSaving}
                  className="h-14 flex-1 cursor-pointer rounded-[12px] bg-[#15BA5C] text-white font-bold text-[18px] hover:bg-[#13A652] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {primaryButtonLabel}
                </button>
              </div>
            )}
          </div>
        </div>

        {isAddOccasionOpen && (
          <div className="fixed inset-0 z-[170] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-md rounded-[20px] bg-white p-7 shadow-2xl">
              <button
                type="button"
                onClick={() => setIsAddOccasionOpen(false)}
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                aria-label="Close"
                title="Close"
              >
                <X className="h-5 w-5 text-gray-700" />
              </button>
              <div className="text-[18px] font-bold text-[#111827]">
                Add Occasion
              </div>
              <input
                value={newOccasionName}
                onChange={(e) => setNewOccasionName(e.target.value)}
                placeholder="Enter occasion name"
                className="mt-5 h-12 w-full rounded-[12px] border border-[#E5E7EB] px-4 text-[15px] outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  const name = newOccasionName.trim();
                  if (!name) return;
                  setOccasionOptions((prev) => {
                    const exists = prev.some(
                      (o) => o.label.toLowerCase() === name.toLowerCase(),
                    );
                    if (exists) return prev;
                    return [...prev, { value: name, label: name }];
                  });
                  setOccasion(name);
                  setNewOccasionName("");
                  setIsAddOccasionOpen(false);
                }}
                className="mt-5 h-12 w-full rounded-[12px] bg-[#15BA5C] text-white font-bold hover:bg-[#13A652] transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
      <ProcessPaymentModal
        isOpen={isPaymentOpen}
        orderId={createdOrderId}
        onClose={() => {
          setIsPaymentOpen(false);
          setCreatedOrderId(null);
          onClose();
        }}
        onUpdated={() => {
          onCreated?.();
        }}
      />
    </>
  );
};

export default CreatePreOrder;
