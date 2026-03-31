"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Trash2,
  ChevronRight as ChevronRightIcon,
  Eye,
  EyeOff,
  X,
  PackageSearch,
} from "lucide-react";
import { useBusinessStore } from "@/stores/useBusinessStore";
import useCustomerStore, { Customer } from "@/stores/useCustomerStore";
import NotFound from "./NotFound";
import CustomerSelectionModal from "@/shared/Modals/CustomerSelectionModal";
import { getCurrencySymbol } from "@/utils/getCurrencySymbol";
import POSAssests from "@/assets/images/pos";
import ProductAssets from "@/assets/images/products";
import useToastStore from "@/stores/toastStore";
import ProcessPaymentModal from "@/features/pos/PreOrder/ProcessPaymentModal";
import {
  OrderChannel,
  OrderMode,
  OrderStatus,
  OrderType,
} from "../../../../electron/types/order.types";

type ModifierGroup = {
  id: string;
  name: string;
  modifierType: string;
  modifierMode: string;
  limitTotalSelection: boolean;
  maximumQuantity: number;
  options: Array<{
    id: string;
    name: string;
    amount: number;
    maximumQuantity: number;
    limitQuantity: boolean;
  }>;
};

const InStoreOrder = () => {
  const [showImages, setShowImages] = useState(true);
  const [categories, setCategories] = useState<string[]>(["All Items"]);
  const [selectedCategory, setSelectedCategory] = useState("All Items");
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [isModifierModalOpen, setIsModifierModalOpen] = useState(false);
  const [modifierProduct, setModifierProduct] = useState<any | null>(null);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [modifierSelection, setModifierSelection] = useState<
    Record<string, Record<string, number>>
  >({});

  const { selectedOutlet } = useBusinessStore();
  const { showToast } = useToastStore();

  useEffect(() => {
    setSelectedCustomer(null);
    setCart([]);
  }, [selectedOutlet?.id]);
  const currencySymbol = selectedOutlet?.currency
    ? getCurrencySymbol(selectedOutlet.currency)
    : "£";

  // Fetch categories from system_default
  const fetchCategories = useCallback(async () => {
    try {
      const api = (window as any).electronAPI;
      if (!api?.dbQuery) return;

      const result = await api.dbQuery(
        "SELECT data FROM system_default WHERE key = 'category' AND outletId = ?",
        [selectedOutlet?.id],
      );

      if (result && result[0]) {
        try {
          const parsedData = JSON.parse(result[0].data);
          const categoryList = Array.isArray(parsedData)
            ? ["All Items", ...parsedData.map((c: any) => c.name || c)]
            : ["All Items"];
          setCategories(categoryList);
        } catch (e) {
          console.error("Failed to parse category data:", e);
        }
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  }, [selectedOutlet?.id]);

  // Fetch products for the grid
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const api = (window as any).electronAPI;
      if (!api?.dbQuery) return;

      let sql =
        "SELECT * FROM product WHERE outletId = ? AND isActive = 1 AND isDeleted = 0";
      const params: any[] = [selectedOutlet?.id];

      if (searchTerm) {
        sql += " AND (name LIKE ? OR category LIKE ?)";
        params.push(`%${searchTerm}%`, `%${searchTerm}%`);
      }

      if (selectedCategory !== "All Items") {
        sql += " AND category = ?";
        params.push(selectedCategory);
      }

      sql += " ORDER BY LOWER(name) ASC";
      const result = await api.dbQuery(sql, params);
      setProducts(result || []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedOutlet?.id, searchTerm, selectedCategory]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const checkoutTaxes = React.useMemo(() => {
    const raw: any = (selectedOutlet as any)?.taxSettings;
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
  }, [(selectedOutlet as any)?.taxSettings]);

  const checkoutServiceCharge = React.useMemo(() => {
    const raw: any = (selectedOutlet as any)?.serviceCharges;
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
  }, [(selectedOutlet as any)?.serviceCharges]);

  const openModifierModal = useCallback(
    async (product: any, existingCartLineId?: string) => {
      const api = (window as any).electronAPI;
      if (!api?.dbQuery) {
        setCart((prev) => {
          const existing = existingCartLineId
            ? prev.find((item) => item.cartLineId === existingCartLineId)
            : prev.find(
                (item) => item.productId === product.id && !item.modifiersKey,
              );
          if (existing) {
            return prev.map((item) =>
              item.cartLineId === existing.cartLineId
                ? { ...item, quantity: item.quantity + 1 }
                : item,
            );
          }
          return [
            ...prev,
            {
              cartLineId: crypto.randomUUID(),
              productId: product.id,
              name: product.name,
              basePrice: Number(product.price || 0) || 0,
              unitPrice: Number(product.price || 0) || 0,
              quantity: 1,
              modifiers: [],
              modifiersKey: "",
            },
          ];
        });
        return;
      }

      const modRows = await api.dbQuery(
        `
          SELECT id, name, modifierType, modifierMode, limitTotalSelection, maximumQuantity
          FROM modifier
          WHERE productId = ?
            AND outletId = ?
            AND showInPos = 1
            AND (deletedAt IS NULL OR deletedAt = '')
          ORDER BY COALESCE(updatedAt, createdAt) ASC
        `,
        [product.id, selectedOutlet?.id],
      );
      if (!modRows || modRows.length === 0) {
        setCart((prev) => {
          const existing = existingCartLineId
            ? prev.find((item) => item.cartLineId === existingCartLineId)
            : prev.find(
                (item) => item.productId === product.id && !item.modifiersKey,
              );
          if (existing) {
            return prev.map((item) =>
              item.cartLineId === existing.cartLineId
                ? { ...item, quantity: item.quantity + 1 }
                : item,
            );
          }
          return [
            ...prev,
            {
              cartLineId: crypto.randomUUID(),
              productId: product.id,
              name: product.name,
              basePrice: Number(product.price || 0) || 0,
              unitPrice: Number(product.price || 0) || 0,
              quantity: 1,
              modifiers: [],
              modifiersKey: "",
            },
          ];
        });
        return;
      }

      const groups: ModifierGroup[] = [];
      for (const m of modRows) {
        const optionRows = await api.dbQuery(
          `
            SELECT id, name, amount, maximumQuantity, limitQuantity
            FROM modifier_option
            WHERE modifierId = ?
              AND (deletedAt IS NULL OR deletedAt = '')
            ORDER BY COALESCE(updatedAt, createdAt) ASC
          `,
          [m.id],
        );
        groups.push({
          id: String(m.id),
          name: String(m.name || "Modifier"),
          modifierType: String(m.modifierType || "ADD_ON"),
          modifierMode: String(m.modifierMode || "SINGLE_CHOICE"),
          limitTotalSelection: Number(m.limitTotalSelection || 0) === 1,
          maximumQuantity: Number(m.maximumQuantity || 0) || 0,
          options: (optionRows || []).map((o: any) => ({
            id: String(o.id),
            name: String(o.name || "Option"),
            amount: Number(o.amount || 0) || 0,
            maximumQuantity: Number(o.maximumQuantity || 0) || 0,
            limitQuantity: Number(o.limitQuantity || 0) === 1,
          })),
        });
      }

      const initial: Record<string, Record<string, number>> = {};
      for (const g of groups) initial[g.id] = {};

      setModifierProduct(product);
      setModifierGroups(groups);
      setModifierSelection(initial);
      setIsModifierModalOpen(true);
    },
    [selectedOutlet?.id],
  );

  const addToCartWithModifiers = useCallback(() => {
    if (!modifierProduct) return;
    const basePrice = Number(modifierProduct.price || 0) || 0;

    const selectedOptions: Array<{
      modifierId: string;
      modifierName: string;
      optionId: string;
      optionName: string;
      amount: number;
      quantity: number;
    }> = [];

    for (const g of modifierGroups) {
      const sel = modifierSelection[g.id] || {};
      for (const opt of g.options) {
        const q = Number(sel[opt.id] || 0) || 0;
        if (q <= 0) continue;
        selectedOptions.push({
          modifierId: g.id,
          modifierName: g.name,
          optionId: opt.id,
          optionName: opt.name,
          amount: opt.amount,
          quantity: q,
        });
      }
    }

    const modifiersAmount = selectedOptions.reduce(
      (acc, s) => acc + s.amount * s.quantity,
      0,
    );
    const unitPrice = basePrice + modifiersAmount;
    const modifiersKey = JSON.stringify(
      selectedOptions
        .map((s) => ({
          modifierId: s.modifierId,
          optionId: s.optionId,
          quantity: s.quantity,
        }))
        .sort((a, b) =>
          `${a.modifierId}:${a.optionId}`.localeCompare(
            `${b.modifierId}:${b.optionId}`,
          ),
        ),
    );

    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.productId === modifierProduct.id &&
          String(item.modifiersKey || "") === modifiersKey,
      );
      if (existing) {
        return prev.map((it) =>
          it.cartLineId === existing.cartLineId
            ? { ...it, quantity: it.quantity + 1 }
            : it,
        );
      }
      return [
        ...prev,
        {
          cartLineId: crypto.randomUUID(),
          productId: modifierProduct.id,
          name: modifierProduct.name,
          basePrice,
          unitPrice,
          quantity: 1,
          modifiers: selectedOptions,
          modifiersKey,
        },
      ];
    });

    setIsModifierModalOpen(false);
    setModifierProduct(null);
    setModifierGroups([]);
    setModifierSelection({});
  }, [modifierGroups, modifierProduct, modifierSelection]);

  const addToCart = (product: any) => {
    openModifierModal(product);
  };

  const subtotal = cart.reduce((sum, item) => {
    const unit = Number(item.unitPrice ?? item.price ?? 0) || 0;
    return sum + unit * (Number(item.quantity || 0) || 0);
  }, 0);

  const tax = React.useMemo(() => {
    const rateTotal = checkoutTaxes.reduce(
      (acc: number, t: { name: string; rate: number }) => acc + t.rate,
      0,
    );
    return (subtotal * rateTotal) / 100;
  }, [checkoutTaxes, subtotal]);

  const serviceCharge = React.useMemo(() => {
    if (!checkoutServiceCharge) return 0;
    return (subtotal * checkoutServiceCharge.rate) / 100;
  }, [checkoutServiceCharge, subtotal]);

  const total = subtotal + tax + serviceCharge;

  const handlePayNow = useCallback(async () => {
    if (!selectedOutlet?.id) {
      showToast("error", "No outlet selected", "Select an outlet first");
      return;
    }
    if (!selectedCustomer?.id) {
      showToast("error", "Select customer", "Select a customer to continue");
      return;
    }
    if (!cart.length) return;

    const api: any = (window as any).electronAPI;
    if (!api?.dbQuery) {
      showToast("error", "Offline DB not available", "dbQuery not found");
      return;
    }

    try {
      const now = new Date().toISOString();
      const orderId = crypto.randomUUID();
      const cartId = crypto.randomUUID();
      const orderReference = `EZOR${Math.floor(100000 + Math.random() * 900000)}`;
      const cartReference = `CRT-${Date.now()}`;
      const timeline = JSON.stringify([
        { action: "created", timestamp: now, description: "Order created" },
      ]);

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
          selectedOutlet.id,
          cart.length,
          cart.reduce((acc, it) => acc + (Number(it.quantity || 0) || 0), 0),
          subtotal,
          selectedCustomer.id,
          null,
          0,
        ],
      );

      const cartItemIds: string[] = [];
      for (const line of cart) {
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
            line.productId,
            Number(line.quantity || 0) || 0,
            Number(line.unitPrice ?? line.price ?? 0) || 0,
            cartId,
            0,
            0,
            null,
            0,
          ],
        );

        if (Array.isArray(line.modifiers) && line.modifiers.length > 0) {
          for (const m of line.modifiers) {
            await api.dbQuery(
              `
                INSERT INTO cart_item_modifier (
                  id, unitAmount, modifierOptionId, modifierOptionName, quantity, cartItemId, modifierId, priceTierDiscount, priceTierMarkup
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              `,
              [
                crypto.randomUUID(),
                Number(m.amount || 0) || 0,
                String(m.optionId || ""),
                String(m.optionName || ""),
                Number(m.quantity || 1) || 1,
                cartItemId,
                String(m.modifierId || ""),
                0,
                0,
              ],
            );
          }
        }
      }

      await api.dbQuery(
        `
          INSERT INTO orders (
            id, status, deliveryMethod, amount, tax, serviceCharge, cashCollected, changeGiven,
            total, deliveryFee, specialInstructions, recipientName, occasion, initiator,
            recipientPhone, scheduledAt, address, reference, externalReference,
            orderMode, orderChannel, orderType, confirmedBy, confirmedAt, cancelledBy,
            cancelledAt, cancellationReason, createdAt, updatedAt, timeline,
            customerId, outletId, cartId, paymentReference, paymentMethod, paymentStatus,
            discount, markup, deletedAt, recordId, version
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          orderId,
          OrderStatus.PENDING,
          "Pickup",
          subtotal,
          tax,
          serviceCharge,
          0,
          0,
          total,
          0,
          "",
          selectedCustomer.name || "",
          "",
          "",
          null,
          null,
          null,
          orderReference,
          null,
          OrderMode.IN_STORE,
          OrderChannel.POS,
          OrderType.REGULAR,
          null,
          null,
          null,
          null,
          null,
          now,
          now,
          timeline,
          selectedCustomer.id,
          selectedOutlet.id,
          cartId,
          null,
          null,
          "Pending",
          0,
          0,
          null,
          null,
          0,
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
            table: "orders",
            action: "CREATE",
            data: orderRow,
            id: orderId,
          });
        }
      }

      setCreatedOrderId(orderId);
      setIsPaymentOpen(true);
    } catch (e) {
      console.error("Failed to create in-store order:", e);
      showToast("error", "Pay now failed", "Could not start payment");
    }
  }, [
    cart,
    selectedCustomer,
    selectedOutlet?.id,
    serviceCharge,
    showToast,
    subtotal,
    tax,
    total,
  ]);

  const removeFromCart = (cartLineId: string) => {
    setCart((prev) => prev.filter((item) => item.cartLineId !== cartLineId));
  };

  const updateQuantity = (cartLineId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.cartLineId === cartLineId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const requiredModifiersSatisfied = React.useMemo(() => {
    for (const g of modifierGroups) {
      const isRequired =
        String(g.modifierType || "").toUpperCase() === "VARIANCE";
      if (!isRequired) continue;
      const sel = modifierSelection[g.id] || {};
      const totalQty = Object.values(sel).reduce(
        (acc, n) => acc + (Number(n || 0) || 0),
        0,
      );
      if (totalQty <= 0) return false;
    }
    return true;
  }, [modifierGroups, modifierSelection]);

  const setModifierOptionQty = useCallback(
    (group: ModifierGroup, optionId: string, nextQty: number) => {
      const qty = Math.max(0, Math.floor(nextQty));
      setModifierSelection((prev) => {
        const currentGroup = prev[group.id] || {};
        const nextGroup: Record<string, number> = { ...currentGroup };

        if (group.modifierMode === "SINGLE_CHOICE") {
          if (qty <= 0) {
            nextGroup[optionId] = 0;
          } else {
            for (const k of Object.keys(nextGroup)) nextGroup[k] = 0;
            nextGroup[optionId] = 1;
          }
          return { ...prev, [group.id]: nextGroup };
        }

        const option = group.options.find((o) => o.id === optionId);
        const optMax =
          option && option.limitQuantity && option.maximumQuantity > 0
            ? option.maximumQuantity
            : Infinity;
        const cappedQty = Math.min(qty, optMax);

        nextGroup[optionId] = cappedQty;

        if (group.limitTotalSelection && group.maximumQuantity > 0) {
          const totalQty = Object.values(nextGroup).reduce(
            (acc, n) => acc + (Number(n || 0) || 0),
            0,
          );
          if (totalQty > group.maximumQuantity) {
            nextGroup[optionId] = Math.max(
              0,
              cappedQty - (totalQty - group.maximumQuantity),
            );
          }
        }

        return { ...prev, [group.id]: nextGroup };
      });
    },
    [],
  );

  return (
    <div className="bg-[#F9FAFB] h-full -my-8 py-8 relative overflow-hidden">
      {/* Container for absolute positioning on mobile, flex on desktop */}
      <div className="relative h-full lg:flex lg:flex-row lg:gap-6 lg:overflow-hidden pb-8">
        {/* Section 1: Order Details Sidebar (Top on mobile) */}
        <div
          className={`absolute lg:relative top-0 left-0 right-0 z-20 overflow-hidden
            ${cart.length === 0 ? "h-[calc(100vh-250px)]" : "h-[450px]"} 
            lg:h-fit lg:w-[400px] lg:order-2 lg:shrink-0`}
        >
          <div className="bg-white border border-[#E5E7EB] rounded-[16px] flex flex-col shadow-lg overflow-hidden h-full mx-1 lg:mx-0">
            <div className="p-4 border-b border-[#F3F4F6] flex-shrink-0 flex items-center justify-between bg-white sticky top-0 z-10">
              <h2 className="text-[18px] font-bold text-[#1C1B20]">
                Order Details
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-[#EF4444] text-white text-[11px] rounded-full">
                  {cart.length}
                </span>
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-0 overscroll-contain">
              {cart.length > 0 ? (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.cartLineId}
                      className="flex flex-col border-b border-[#F3F4F6] pb-3 last:border-0"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex-1 min-w-0 mr-2">
                          <h4 className="text-[14px] font-bold text-[#1C1B20] truncate">
                            {item.name}
                          </h4>
                          {Array.isArray(item.modifiers) &&
                            item.modifiers.length > 0 && (
                              <div className="mt-1 text-[12px] text-[#6B7280]">
                                {item.modifiers
                                  .map((m: any) => {
                                    const qty = Number(m.quantity || 0) || 0;
                                    const label = String(m.optionName || "");
                                    return qty > 1 ? `${label} x${qty}` : label;
                                  })
                                  .join(", ")}
                              </div>
                            )}
                          <p className="text-[13px] font-medium text-[#15BA5C]">
                            {currencySymbol}
                            {Number(
                              item.unitPrice ?? item.price ?? 0,
                            ).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 border border-[#E5E7EB] rounded-[6px] p-0.5 bg-[#F9FAFB]">
                          <button
                            onClick={() => updateQuantity(item.cartLineId, -1)}
                            className="w-5 h-5 cursor-pointer flex items-center justify-center text-[#6B7280] hover:text-[#1C1B20] hover:bg-gray-100 rounded"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[13px] font-bold w-4 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              openModifierModal(
                                {
                                  id: item.productId,
                                  name: item.name,
                                  price: item.basePrice ?? item.price,
                                },
                                item.cartLineId,
                              )
                            }
                            className="w-5 h-5 flex items-center justify-center text-[#15BA5C] hover:text-[#13A652] hover:bg-green-50 rounded"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-6">
                  <div className="w-24 h-24 mb-6 bg-[#F0FDF4] rounded-full flex items-center justify-center relative flex-shrink-0">
                    <div className="absolute inset-0 bg-green-100/30 animate-pulse rounded-full" />
                    <img
                      src={POSAssests.CartOrderDetails}
                      alt="Empty Cart"
                      className="w-16 h-16 relative z-10"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                  <h3 className="text-[18px] font-bold text-[#1C1B20] mb-2">
                    Cart is Empty
                  </h3>
                  <p className="text-[14px] text-[#6B7280]">
                    Add items from the menu to start your order
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-[#F9FAFB] border-t border-[#E5E7EB] flex-shrink-0 mt-auto">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="flex items-center gap-2 text-[#6B7280] text-[13px] hover:text-[#1C1B20]"
                >
                  <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center">
                    <Plus className="w-2.5 h-2.5" />
                  </div>
                  {selectedCustomer ? (
                    <span className="font-bold text-[#15BA5C]">
                      {selectedCustomer.name}
                    </span>
                  ) : (
                    "SELECT CUSTOMER"
                  )}
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCart([])}
                  className="flex items-center gap-1 text-[#EF4444] text-[13px] hover:text-[#DC2626] font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              </div>

              <div className="space-y-1.5 mb-4">
                <div className="flex justify-between text-[#6B7280] text-[14px]">
                  <span>Sub-total</span>
                  <span>
                    {currencySymbol}
                    {subtotal.toLocaleString()}
                  </span>
                </div>
                {checkoutTaxes.map((t: { name: string; rate: number }) => (
                  <div
                    key={t.name}
                    className="flex justify-between text-[#6B7280] text-[14px]"
                  >
                    <span>
                      {t.name} ({t.rate}%)
                    </span>
                    <span>
                      {currencySymbol}
                      {((subtotal * t.rate) / 100).toLocaleString()}
                    </span>
                  </div>
                ))}
                {checkoutServiceCharge && (
                  <div className="flex justify-between text-[#6B7280] text-[14px]">
                    <span>
                      {checkoutServiceCharge.name} ({checkoutServiceCharge.rate}
                      %)
                    </span>
                    <span>
                      {currencySymbol}
                      {serviceCharge.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-[#1C1B20] text-[16px] font-bold pt-1.5 border-t border-gray-200">
                  <span>Total</span>
                  <span>
                    {currencySymbol}
                    {total.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                disabled={cart.length === 0 || !selectedCustomer}
                onClick={handlePayNow}
                className="w-full py-3 bg-[#15BA5C] text-white rounded-[10px] font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-[#13A652] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-green-200 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                Pay Now
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Product Grid Area (Bottom on mobile) */}
        <div
          className={`absolute lg:relative left-0 right-0 bottom-0 z-10 overflow-hidden
            ${cart.length === 0 ? "top-[calc(100vh-234px)]" : "top-[466px]"} 
            lg:top-0 lg:flex-1 lg:flex lg:flex-col lg:min-h-0 lg:min-w-0`}
        >
          <div className="h-full flex flex-col min-h-0 px-1">
            {/* Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar flex-shrink-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-[8px] whitespace-nowrap text-[13px] font-medium transition-colors ${
                    selectedCategory === cat
                      ? "bg-[#D1FAE5] text-[#065F46] border border-[#10B981]"
                      : "bg-white text-[#6B7280] border border-[#E5E7EB] hover:bg-gray-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search and Toggle */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4 flex-shrink-0">
              <div className="flex items-center border border-[#E5E7EB] rounded-[8px] overflow-hidden bg-white shadow-sm w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 w-full sm:w-[240px] outline-none text-[14px] text-[#1C1B20] placeholder-[#9CA3AF]"
                />
                <button className="bg-[#15BA5C] p-2 text-white">
                  <Search className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setShowImages(!showImages)}
                className="flex items-center gap-2 px-4 py-2 border border-[#E5E7EB] rounded-[8px] bg-white text-[#6B7280] hover:bg-gray-50 transition-colors text-[13px] font-medium shadow-sm w-full sm:w-auto justify-center"
              >
                {showImages ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                {showImages ? "Hide Images" : "Show Images"}
              </button>
            </div>

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-8 lg:pb-0 overscroll-contain">
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-[12px] border border-[#E5E7EB] p-2 flex flex-col animate-pulse"
                    >
                      {showImages && (
                        <div className="aspect-[5/4] bg-gray-100 rounded-[8px] mb-2" />
                      )}
                      <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
                      <div className="h-8 bg-gray-100 rounded w-full mt-auto" />
                    </div>
                  ))}
                </div>
              ) : products.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-[12px] border border-[#E5E7EB] p-2 flex flex-col shadow-sm hover:border-[#15BA5C] transition-all hover:shadow-md cursor-pointer group active:scale-95"
                      onClick={() => addToCart(product)}
                    >
                      {showImages && (
                        <div className="aspect-[5/4] bg-[#F3F4F6] rounded-[8px] mb-2 flex items-center justify-center overflow-hidden">
                          <img
                            src={product.logoUrl || ProductAssets.Broken}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <h3 className="text-[13px] font-bold text-[#1C1B20] mb-0.5 truncate">
                        {product.name}
                      </h3>
                      <p className="text-[12px] font-bold text-[#15BA5C] mb-2">
                        {currencySymbol}
                        {product.price?.toLocaleString()}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        className="w-full py-1.5 bg-[#15BA5C] cursor-pointer text-white rounded-[6px] text-[12px] font-bold hover:bg-[#13A652] transition-colors mt-auto shadow-sm active:bg-[#0E8A44]"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
                  <div className="w-20 h-20 mb-4 bg-gray-50 rounded-full flex items-center justify-center">
                    <PackageSearch className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-[16px] font-bold text-[#1C1B20] mb-1">
                    No Products Found
                  </h3>
                  <p className="text-[14px] text-[#6B7280] max-w-[280px]">
                    {searchTerm || selectedCategory !== "All Items"
                      ? "Try adjusting your search or category filters to find what you're looking for."
                      : "There are no products available for this outlet at the moment."}
                  </p>
                  {(searchTerm || selectedCategory !== "All Items") && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedCategory("All Items");
                      }}
                      className="mt-4 text-[#15BA5C] text-[14px] font-bold hover:underline"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Selection Modal */}
      <CustomerSelectionModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSelect={(customer) => {
          setSelectedCustomer(customer);
          setIsCustomerModalOpen(false);
        }}
      />

      <ProcessPaymentModal
        isOpen={isPaymentOpen}
        orderId={createdOrderId}
        onClose={() => {
          setIsPaymentOpen(false);
          setCreatedOrderId(null);
        }}
        onUpdated={() => {
          setCart([]);
          setSelectedCustomer(null);
        }}
      />

      {isModifierModalOpen && modifierProduct && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-xl relative w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-5 border-b border-[#F3F4F6] flex items-start justify-between gap-3">
              <div className="text-[22px] font-bold text-[#111827]">
                Modifiers for:{" "}
                <span className="text-[#15BA5C]">{modifierProduct.name}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModifierModalOpen(false);
                  setModifierProduct(null);
                  setModifierGroups([]);
                  setModifierSelection({});
                }}
                className="w-10 h-10 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300"
                aria-label="Close"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              <div className="px-6 py-6 space-y-8">
                {modifierGroups.map((g) => {
                  const modeLabel =
                    g.modifierMode === "MULTI_CHOICE"
                      ? "Multi Choice"
                      : "Single Choice";
                  const isRequired =
                    String(g.modifierType || "").toUpperCase() === "VARIANCE";
                  return (
                    <div key={g.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[18px] font-bold text-[#111827]">
                            {g.name} ({modeLabel})
                          </div>
                          {g.modifierMode === "MULTI_CHOICE" && (
                            <div className="text-[14px] text-[#6B7280]">
                              (Max: {g.maximumQuantity || 0})
                            </div>
                          )}
                        </div>
                        {isRequired && (
                          <div className="px-4 py-2 rounded-full bg-[#FEE2E2] text-[#EF4444] text-[14px] font-semibold">
                            Required
                          </div>
                        )}
                      </div>

                      <div className="mt-5 space-y-4">
                        {g.options.map((o) => {
                          const qty =
                            Number(modifierSelection[g.id]?.[o.id] || 0) || 0;
                          return (
                            <div
                              key={o.id}
                              className="flex items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4 last:border-0 last:pb-0"
                            >
                              <div className="text-[16px] font-semibold text-[#111827]">
                                {o.name}{" "}
                                <span className="text-[#15BA5C]">
                                  + {currencySymbol}
                                  {Number(o.amount || 0).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setModifierOptionQty(g, o.id, qty - 1)
                                  }
                                  className="h-10 w-10 rounded-[10px] border border-[#E5E7EB] bg-white text-[#111827] font-bold hover:bg-[#F9FAFB]"
                                >
                                  <Minus className="h-5 w-5 mx-auto" />
                                </button>
                                <div className="w-8 text-center text-[18px] font-bold text-[#111827]">
                                  {qty}
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setModifierOptionQty(g, o.id, qty + 1)
                                  }
                                  className="h-10 w-10 rounded-[10px] bg-[#15BA5C] text-white font-bold hover:bg-[#13A652]"
                                >
                                  <Plus className="h-5 w-5 mx-auto" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-6 h-[6px] w-full rounded-full bg-[#F3F4F6]" />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-[#E5E7EB] bg-white">
              <button
                type="button"
                disabled={!requiredModifiersSatisfied}
                onClick={addToCartWithModifiers}
                className="w-full py-3 rounded-lg font-semibold text-base transition-colors bg-[#15BA5C] text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InStoreOrder;
