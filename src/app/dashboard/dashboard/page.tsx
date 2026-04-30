import CalendarModal from "@/features/report-analysis/CalendarModal";
import { Calendar, Search, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DateRange } from "react-day-picker";
import {
  format,
  differenceInDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  addDays,
  isSameDay,
  setHours,
  getHours,
} from "date-fns";
import EmptyStateAssests from "@/assets/images/empty-state";
import { useBusinessStore } from "@/stores/useBusinessStore";
import { useAuthStore } from "@/stores/authStore";
import { formatPrice } from "@/utils/formatPrice";
import { getCurrencySymbol } from "@/utils/getCurrencySymbol";
import * as XLSX from "xlsx";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Pagination } from "@/shared/Pagination/pagination";
import ProductAssets from "@/assets/images/products";

const formatRangeLabel = (range: DateRange | undefined) => {
  if (!range?.from) return "Select date range";
  const fromLabel = format(range.from, "MMM d, yyyy");
  const toLabel = range.to ? format(range.to, "MMM d, yyyy") : fromLabel;
  return `${fromLabel} - ${toLabel} | 12:00 AM - 11:59 PM`;
};

type AnyRow = Record<string, any>;

const normalizeText = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const normalizeImageUrl = (value: unknown) => {
  const raw = String(value ?? "")
    .replace(/`/g, "")
    .trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower === "null" || lower === "undefined") return null;
  return raw;
};

const toNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const getOrderTotal = (row: AnyRow) => {
  const candidates = [
    row.totalAmount,
    row.grandTotal,
    row.total,
    row.amount,
    row.totalPrice,
    row.total_price,
    row.subTotal,
    row.sub_total,
  ];

  for (const c of candidates) {
    const v = toNumber(c);
    if (v !== 0) return v;
  }

  return 0;
};

const getRowDate = (row: AnyRow) => {
  const candidates = [
    row.createdAt,
    row.created_at,
    row.createdOn,
    row.created_on,
    row.date,
  ];

  for (const c of candidates) {
    if (!c) continue;
    const d = new Date(c);
    if (!Number.isNaN(d.getTime())) return d;
  }

  return null;
};

const isWithinRange = (d: Date | null, range: DateRange | undefined) => {
  if (!range?.from) return true;
  if (!d) return true;

  const start = new Date(range.from);
  start.setHours(0, 0, 0, 0);

  const end = new Date(range.to ?? range.from);
  end.setHours(23, 59, 59, 999);

  return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
};

const isPaidOrder = (row: AnyRow) => {
  const paymentStatus = normalizeText(
    row.paymentStatus ?? row.payment_status ?? row.payment_state,
  );
  const status = normalizeText(
    row.status ?? row.orderStatus ?? row.order_status,
  );
  const merged = `${paymentStatus} ${status}`.trim();

  if (merged.includes("unpaid")) return false;
  if (merged.includes("not paid")) return false;
  if (merged.includes("pending")) return false;
  if (merged.includes("draft")) return false;
  if (merged.includes("cancel")) return false;
  if (merged.includes("refunded")) return false;

  if (merged.includes("paid")) return true;
  if (merged.includes("completed")) return true;
  if (merged.includes("success")) return true;

  const explicitIsPaid = row.isPaid ?? row.is_paid;
  if (typeof explicitIsPaid === "boolean") return explicitIsPaid;
  if (explicitIsPaid === 1) return true;
  if (explicitIsPaid === 0) return false;

  return false;
};

const getProductionProgressPercent = (status: unknown) => {
  const s = normalizeText(status);
  if (!s) return 0;
  if (s.includes("cancel")) return 0;
  if (s === "ready") return 100;
  if (s === "quality_control") return 90;
  if (s === "in_preparation") return 70;
  if (s === "inventory_approved") return 45;
  if (s === "inventory_pending") return 30;
  if (s === "order_selected") return 15;
  return 25;
};

const productionStatusPill = (status: unknown) => {
  const s = normalizeText(status);
  if (!s) return { label: "-", cls: "bg-gray-100 text-gray-600" };
  if (s.includes("cancel"))
    return { label: "Cancelled", cls: "bg-[#FEE2E2] text-[#EF4444]" };
  if (s === "inventory_pending")
    return { label: "Inventory Pending", cls: "bg-[#FFF7ED] text-[#F97316]" };
  if (s === "inventory_approved")
    return { label: "Inventory Approved", cls: "bg-[#ECFDF5] text-[#16A34A]" };
  if (s === "order_selected")
    return { label: "Scheduled", cls: "bg-[#EFF6FF] text-[#2563EB]" };
  if (s === "ready")
    return { label: "Ready", cls: "bg-[#ECFDF5] text-[#16A34A]" };
  if (s === "quality_control")
    return { label: "Quality Control", cls: "bg-[#F5F3FF] text-[#8B5CF6]" };
  if (s === "in_preparation")
    return { label: "In Progress", cls: "bg-[#FFF7ED] text-[#F97316]" };
  if (s.includes("scheduled"))
    return { label: "Scheduled", cls: "bg-[#FEF3C7] text-[#B45309]" };
  return { label: String(status || "-"), cls: "bg-gray-100 text-gray-600" };
};

const MainDashboardPage = () => {
  const selectedOutlet = useBusinessStore((s) => s.selectedOutlet);
  const authUser = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isExporting, setIsExporting] = useState(false);
  const [isProductionQueueOpen, setIsProductionQueueOpen] = useState(false);
  const [productionQueueSearch, setProductionQueueSearch] = useState("");
  const [isProductionQueueFiltersOpen, setIsProductionQueueFiltersOpen] =
    useState(false);
  const [productionQueueStatusFilter, setProductionQueueStatusFilter] =
    useState<
      | "all"
      | "order_selected"
      | "inventory_pending"
      | "inventory_approved"
      | "in_preparation"
    >("all");
  const [isBestSellingOpen, setIsBestSellingOpen] = useState(false);
  const [bestSellingSearch, setBestSellingSearch] = useState("");
  const [isBestSellingFiltersOpen, setIsBestSellingFiltersOpen] =
    useState(false);
  const [bestSellingSort, setBestSellingSort] = useState<"orders" | "revenue">(
    "orders",
  );
  const [bestSellingPage, setBestSellingPage] = useState(1);
  const [bestSellingItemsPerPage, setBestSellingItemsPerPage] = useState(15);
  const [isSalesByProductOpen, setIsSalesByProductOpen] = useState(false);
  const [salesByProductSearch, setSalesByProductSearch] = useState("");
  const [isSalesByProductFiltersOpen, setIsSalesByProductFiltersOpen] =
    useState(false);
  const [salesByProductSort, setSalesByProductSort] = useState<
    "sold" | "revenue"
  >("sold");
  const [salesByProductPage, setSalesByProductPage] = useState(1);
  const [salesByProductItemsPerPage, setSalesByProductItemsPerPage] =
    useState(15);
  const [orders, setOrders] = useState<AnyRow[]>([]);
  const [productions, setProductions] = useState<AnyRow[]>([]);
  const [inventory, setInventory] = useState<AnyRow[]>([]);
  const [productSales, setProductSales] = useState<AnyRow[]>([]);
  const [productionQueueMetaById, setProductionQueueMetaById] = useState<
    Record<
      string,
      {
        productCode: string | null;
        totalRequestedQuantity: number;
        totalFinalQuantity: number;
      }
    >
  >({});
  const [stockCounts, setStockCounts] = useState({
    lowStock: 0,
    outOfStock: 0,
    inStock: 0,
    expiringSoon: 0,
    total: 0,
  });

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const api = (window as any)?.electronAPI;
      if (!api?.dbQuery || !selectedOutlet?.id) {
        if (!cancelled) {
          setOrders([]);
          setProductions([]);
          setInventory([]);
          setProductSales([]);
          setProductionQueueMetaById({});
          setStockCounts({
            lowStock: 0,
            outOfStock: 0,
            inStock: 0,
            expiringSoon: 0,
            total: 0,
          });
        }
        return;
      }

      try {
        // Fetch Stock Counts (Using InventoryPage SQL Logic)
        try {
          const now = new Date();
          const startOfTodayIso = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          ).toISOString();
          const expiringUntilIso = new Date(
            now.getTime() + 7 * 24 * 60 * 60 * 1000,
          ).toISOString();

          const sql = `
            WITH lot_min AS (
              SELECT itemId, MIN(expiryDate) AS minExpiry
              FROM item_lot
              WHERE expiryDate IS NOT NULL AND expiryDate != ''
              GROUP BY itemId
            ),
            base AS (
              SELECT
                ii.id AS inventoryItemId,
                COALESCE(ii.currentStockLevel, 0) AS currentStockLevel,
                COALESCE(ii.minimumStockLevel, 0) AS minimumStockLevel,
                lot_min.minExpiry AS minExpiry
              FROM inventory_item ii
              JOIN inventory i ON ii.inventoryId = i.id
              LEFT JOIN lot_min ON lot_min.itemId = ii.id
              WHERE CAST(i.outletId AS TEXT) = CAST(? AS TEXT) AND ii.isDeleted = 0
            )
            SELECT
              COUNT(*) AS totalItems,
              SUM(CASE WHEN currentStockLevel = 0 THEN 1 ELSE 0 END) AS outOfStockItems,
              SUM(CASE WHEN currentStockLevel > 0 AND currentStockLevel <= minimumStockLevel THEN 1 ELSE 0 END) AS lowStockItems,
              SUM(CASE WHEN minExpiry IS NOT NULL AND minExpiry >= ? AND minExpiry <= ? THEN 1 ELSE 0 END) AS expiringItems
            FROM base
          `;

          const rows = (await api.dbQuery(sql, [
            selectedOutlet.id,
            startOfTodayIso,
            expiringUntilIso,
          ])) as AnyRow[];

          const row = rows?.[0] || {};
          const totalItems = Number(row.totalItems || 0);
          const outOfStock = Number(row.outOfStockItems || 0);
          const lowStock = Number(row.lowStockItems || 0);
          const expiringSoon = Number(row.expiringItems || 0);
          const inStock = totalItems - outOfStock - lowStock;

          if (!cancelled) {
            setStockCounts({
              lowStock,
              outOfStock,
              inStock,
              expiringSoon,
              total: totalItems,
            });
          }
        } catch (err) {
          console.error("Stock counts fetch error:", err);
        }

        // Fetch Orders
        let ordersRows: AnyRow[] = [];
        try {
          ordersRows = (await api.dbQuery(
            "SELECT * FROM orders WHERE CAST(outletId AS TEXT) = CAST(? AS TEXT)",
            [selectedOutlet.id],
          )) as AnyRow[];
        } catch {
          ordersRows = (await api.dbQuery(
            "SELECT * FROM orders",
            [],
          )) as AnyRow[];
          ordersRows = ordersRows.filter(
            (r) => String(r?.outletId || "") === String(selectedOutlet.id),
          );
        }

        // Fetch Productions
        let prodRows: AnyRow[] = [];
        try {
          prodRows = (await api.dbQuery(
            "SELECT * FROM productions_v2 WHERE CAST(outletId AS TEXT) = CAST(? AS TEXT)",
            [selectedOutlet.id],
          )) as AnyRow[];
        } catch {
          prodRows = [];
        }

        let nextProductionQueueMetaById: Record<
          string,
          {
            productCode: string | null;
            totalRequestedQuantity: number;
            totalFinalQuantity: number;
          }
        > = {};
        try {
          const queueIds = (prodRows || [])
            .filter((p) =>
              [
                "order_selected",
                "inventory_pending",
                "inventory_approved",
                "in_preparation",
              ].includes(normalizeText(p.status)),
            )
            .slice(0, 500)
            .map((p) => String(p.id || ""))
            .filter(Boolean);

          if (queueIds.length > 0) {
            const placeholders = queueIds.map(() => "?").join(", ");
            const rows = (await api.dbQuery(
              `
                SELECT
                  p.id as productionId,
                  pr.productCode as productCode,
                  agg.totalRequestedQuantity as totalRequestedQuantity,
                  agg.totalFinalQuantity as totalFinalQuantity
                FROM productions_v2 p
                LEFT JOIN (
                  SELECT
                    productionId,
                    MIN(productId) as productId
                  FROM production_v2_items
                  GROUP BY productionId
                ) pi ON pi.productionId = p.id
                LEFT JOIN product pr ON pr.id = pi.productId
                LEFT JOIN (
                  SELECT
                    productionId,
                    SUM(requestedQuantity) as totalRequestedQuantity,
                    SUM(finalQuantity) as totalFinalQuantity
                  FROM production_v2_items
                  GROUP BY productionId
                ) agg ON agg.productionId = p.id
                WHERE p.id IN (${placeholders})
              `,
              queueIds,
            )) as AnyRow[];

            for (const r of rows || []) {
              const id = String(r.productionId || "");
              if (!id) continue;
              nextProductionQueueMetaById[id] = {
                productCode:
                  r.productCode != null ? String(r.productCode) : null,
                totalRequestedQuantity: toNumber(r.totalRequestedQuantity),
                totalFinalQuantity: toNumber(r.totalFinalQuantity),
              };
            }
          }
        } catch {
          nextProductionQueueMetaById = {};
        }

        // Fetch Inventory for Stock Valuation
        let invRows: AnyRow[] = [];
        try {
          invRows = (await api.dbQuery(
            `SELECT 
              ii.*, 
              ii.costPrice as masterCostPrice,
              (SELECT MIN(expiryDate) FROM item_lot WHERE itemId = ii.id AND currentStockLevel > 0) as nearestExpiry
             FROM inventory_item ii 
             JOIN inventory i ON ii.inventoryId = i.id
             WHERE CAST(i.outletId AS TEXT) = CAST(? AS TEXT) AND ii.isDeleted = 0`,
            [selectedOutlet.id],
          )) as AnyRow[];
        } catch (err) {
          console.error("Inventory fetch error:", err);
          invRows = [];
        }

        // Fetch Product Sales Data
        let salesRows: AnyRow[] = [];
        try {
          salesRows = (await api.dbQuery(
            `SELECT 
              p.id as productId,
              p.name as productName,
              p.logoUrl as productImage,
              o.id as orderId,
              SUM(ci.quantity) as totalSold,
              SUM(ci.unitPrice * ci.quantity) as totalRevenue,
              o.createdAt as orderDate
             FROM orders o
             JOIN cart_item ci ON o.cartId = ci.cartId
             JOIN product p ON ci.productId = p.id
             WHERE CAST(o.outletId AS TEXT) = CAST(? AS TEXT)
             GROUP BY p.id, o.id`,
            [selectedOutlet.id],
          )) as AnyRow[];
        } catch (err) {
          console.error("Sales data fetch error:", err);
          salesRows = [];
        }

        if (!cancelled) {
          setOrders(Array.isArray(ordersRows) ? ordersRows : []);
          setProductions(Array.isArray(prodRows) ? prodRows : []);
          setInventory(Array.isArray(invRows) ? invRows : []);
          setProductSales(Array.isArray(salesRows) ? salesRows : []);
          setProductionQueueMetaById(nextProductionQueueMetaById);
        }
      } catch (err) {
        console.error("Dashboard data fetch error:", err);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [selectedOutlet?.id]);

  const filteredOrders = useMemo(() => {
    const base = (orders || [])
      .filter((row) => isWithinRange(getRowDate(row), dateRange))
      .filter((row) => !normalizeText(row?.status).includes("draft"));
    return base;
  }, [
    dateRange?.from ? dateRange.from.getTime() : 0,
    dateRange?.to ? dateRange.to.getTime() : 0,
    orders,
  ]);

  const filteredProductions = useMemo(() => {
    return (productions || []).filter((row) =>
      isWithinRange(getRowDate(row), dateRange),
    );
  }, [
    dateRange?.from ? dateRange.from.getTime() : 0,
    dateRange?.to ? dateRange.to.getTime() : 0,
    productions,
  ]);

  const productionQueueRowsBase = useMemo(() => {
    const rows = (filteredProductions || []).filter((p) =>
      [
        "order_selected",
        "inventory_pending",
        "inventory_approved",
        "in_preparation",
      ].includes(normalizeText(p.status)),
    );

    return rows.sort((a, b) => {
      const aDue = a.productionDueDate || a.productionDate || a.createdAt;
      const bDue = b.productionDueDate || b.productionDate || b.createdAt;
      const ad = aDue ? new Date(aDue).getTime() : 0;
      const bd = bDue ? new Date(bDue).getTime() : 0;
      return bd - ad;
    });
  }, [filteredProductions]);

  const productionQueueRows = useMemo(() => {
    const term = normalizeText(productionQueueSearch);
    const statusFilter = productionQueueStatusFilter;

    return (productionQueueRowsBase || []).filter((p) => {
      const st = normalizeText(p.status);
      if (statusFilter !== "all" && st !== statusFilter) return false;

      if (!term) return true;
      const meta = productionQueueMetaById[String(p.id || "")];
      const haystack = normalizeText(
        [
          p.batchId,
          p.id,
          meta?.productCode,
          meta?.totalRequestedQuantity,
          meta?.totalFinalQuantity,
          p.status,
        ]
          .filter(Boolean)
          .join(" "),
      );
      return haystack.includes(term);
    });
  }, [
    productionQueueRowsBase,
    productionQueueMetaById,
    productionQueueSearch,
    productionQueueStatusFilter,
  ]);

  const previousDateRange = useMemo((): DateRange | undefined => {
    if (!dateRange?.from) return undefined;

    const currentFrom = new Date(dateRange.from);
    const currentTo = dateRange.to
      ? new Date(dateRange.to)
      : new Date(dateRange.from);

    // Set to start/end of day for precise duration
    const start = new Date(
      currentFrom.getFullYear(),
      currentFrom.getMonth(),
      currentFrom.getDate(),
      0,
      0,
      0,
      0,
    );
    const end = new Date(
      currentTo.getFullYear(),
      currentTo.getMonth(),
      currentTo.getDate(),
      23,
      59,
      59,
      999,
    );

    const durationMs = end.getTime() - start.getTime();

    const prevTo = new Date(start.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - durationMs);
    prevFrom.setHours(0, 0, 0, 0);

    return { from: prevFrom, to: prevTo };
  }, [dateRange]);

  const getStatsForRange = useCallback(
    (range: DateRange | undefined) => {
      const filteredOrdersLocal = (orders || [])
        .filter((row) => isWithinRange(getRowDate(row), range))
        .filter((row) => !normalizeText(row?.status).includes("draft"));

      const paidOrders = filteredOrdersLocal.filter(isPaidOrder);

      const filteredProductionsLocal = (productions || []).filter((row) =>
        isWithinRange(getRowDate(row), range),
      );

      // 1. Total Sales Revenue
      const totalSalesRevenue = paidOrders.reduce(
        (sum, row) => sum + getOrderTotal(row),
        0,
      );

      // 2. Net Sales (Tax Excl)
      const netSales = paidOrders.reduce((sum, row) => {
        const subTotal = toNumber(row.subTotal || row.sub_total);
        return sum + (subTotal > 0 ? subTotal : getOrderTotal(row));
      }, 0);

      // 3. Production Output
      const productionOutput = filteredProductionsLocal.filter(
        (p) => p.status === "ready" || p.status === "quality_control",
      ).length;

      // 4. Stock Valuation
      const stockValuation = inventory.reduce((sum, item) => {
        const price = toNumber(item.costPrice || item.masterCostPrice);
        const qty = toNumber(item.currentStockLevel);
        return sum + price * qty;
      }, 0);

      // 5. Total Orders
      const totalOrders = filteredOrdersLocal.length;

      // 6. Total Orders in Production
      const activeProductionStatuses = [
        "order_selected",
        "inventory_pending",
        "inventory_approved",
        "in_preparation",
      ];
      const totalOrdersInProduction = filteredProductionsLocal.filter((p) =>
        activeProductionStatuses.includes(normalizeText(p.status)),
      ).length;

      // 7. Production Batches in Queue
      const batchesInQueue = filteredProductionsLocal.filter((p) =>
        [
          "order_selected",
          "inventory_pending",
          "inventory_approved",
          "in_preparation",
        ].includes(normalizeText(p.status)),
      ).length;

      // 8. Orders not yet Produced
      const producedOrderIds = new Set(
        productions.map((p) => p.orderId).filter(Boolean),
      );
      const ordersNotYetProduced = filteredOrdersLocal.filter(
        (o) => !producedOrderIds.has(o.id),
      ).length;

      return {
        totalSalesRevenue,
        netSales,
        productionOutput,
        stockValuation,
        totalOrders,
        totalOrdersInProduction,
        batchesInQueue,
        ordersNotYetProduced,
      };
    },
    [orders, productions, inventory],
  );

  const stats = useMemo(
    () => getStatsForRange(dateRange),
    [getStatsForRange, dateRange],
  );

  const prevStats = useMemo(
    () => getStatsForRange(previousDateRange),
    [getStatsForRange, previousDateRange],
  );

  const periodLabel = useMemo(() => {
    if (!dateRange?.from) return "last month";
    const start = new Date(dateRange.from);
    const end = dateRange.to
      ? new Date(dateRange.to)
      : new Date(dateRange.from);
    const diffDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays <= 1) return "yesterday";
    if (diffDays <= 7) return "last week";
    if (diffDays <= 31) return "last month";
    return "previous period";
  }, [dateRange]);

  const getChangeLabel = (
    current: number,
    previous: number,
    isPrice = false,
  ) => {
    const diff = current - previous;
    const prefix = diff >= 0 ? "+" : "";

    if (previous === 0) {
      if (current === 0) return `0% vs ${periodLabel}`;
      // If previous was 0, a percentage is infinite.
      // Instead of hardcoding 100%, we show the absolute change.
      if (isPrice) {
        return `${prefix}${formatPrice({
          amount: Math.abs(diff),
          currencyCode: selectedOutlet?.currency || "USD",
        })} vs ${periodLabel}`;
      }
      return `${prefix}${Math.abs(diff).toLocaleString()} vs ${periodLabel}`;
    }

    const percent = ((diff / previous) * 100).toFixed(1);
    return `${prefix}${percent}% vs ${periodLabel}`;
  };

  const netSalesChartData = useMemo(() => {
    const paidOrders = filteredOrders.filter(isPaidOrder);
    const revenueOrders = paidOrders.length > 0 ? paidOrders : filteredOrders;

    const prevOrders = (orders || [])
      .filter((row) => isWithinRange(getRowDate(row), previousDateRange))
      .filter((row) => !normalizeText(row?.status).includes("draft"));
    const prevPaidOrders = prevOrders.filter(isPaidOrder);
    const revenuePrevOrders =
      prevPaidOrders.length > 0 ? prevPaidOrders : prevOrders;

    const start = dateRange?.from ? new Date(dateRange.from) : null;
    const end = dateRange?.to
      ? new Date(dateRange.to)
      : dateRange?.from
        ? new Date(dateRange.from)
        : null;

    const pStart = previousDateRange?.from
      ? new Date(previousDateRange.from)
      : null;
    const pEnd = previousDateRange?.to ? new Date(previousDateRange.to) : null;

    if (!start || !end) {
      // Fallback for no date range - show last 30 days
      const last30Days: any[] = [];
      const now = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = addDays(now, -i);
        const key = format(d, "yyyy-MM-dd");
        const value = revenueOrders
          .filter((o) => {
            const od = getRowDate(o);
            return od && isSameDay(od, d);
          })
          .reduce((sum, o) => sum + getOrderTotal(o), 0);

        last30Days.push({
          dateKey: key,
          label: format(d, "MMM d"),
          value,
        });
      }
      return last30Days;
    }

    const diffDays = differenceInDays(end, start);
    const points: any[] = [];

    if (diffDays < 1) {
      // Hourly grouping for a single day
      const hours = Array.from({ length: 24 }, (_, i) => i);

      hours.forEach((h) => {
        const d = setHours(new Date(start), h);
        const key = format(d, "yyyy-MM-dd HH");

        const value = revenueOrders
          .filter((o) => {
            const od = getRowDate(o);
            return od && isSameDay(od, d) && getHours(od) === h;
          })
          .reduce((sum, o) => sum + getOrderTotal(o), 0);

        const pd = pStart ? setHours(new Date(pStart), h) : null;
        const prevValue = pd
          ? revenuePrevOrders
              .filter((o) => {
                const od = getRowDate(o);
                return od && isSameDay(od, pd) && getHours(od) === h;
              })
              .reduce((sum, o) => sum + getOrderTotal(o), 0)
          : 0;

        points.push({
          dateKey: key,
          label: format(d, "h aa"),
          value,
          prevValue,
        });
      });
    } else if (diffDays <= 31) {
      // Daily grouping
      const days = eachDayOfInterval({ start, end });
      const pDays =
        pStart && pEnd ? eachDayOfInterval({ start: pStart, end: pEnd }) : [];

      days.forEach((d, idx) => {
        const key = format(d, "yyyy-MM-dd");
        const value = revenueOrders
          .filter((o) => {
            const od = getRowDate(o);
            return od && isSameDay(od, d);
          })
          .reduce((sum, o) => sum + getOrderTotal(o), 0);

        const pd = pDays[idx];
        const prevValue = pd
          ? revenuePrevOrders
              .filter((o) => {
                const od = getRowDate(o);
                return od && isSameDay(od, pd);
              })
              .reduce((sum, o) => sum + getOrderTotal(o), 0)
          : 0;

        points.push({
          dateKey: key,
          label: format(d, "MMM d"),
          value,
          prevValue,
        });
      });
    } else if (diffDays <= 90) {
      // Weekly grouping
      const weeks = eachWeekOfInterval({ start, end });
      const pWeeks =
        pStart && pEnd ? eachWeekOfInterval({ start: pStart, end: pEnd }) : [];

      weeks.forEach((w, idx) => {
        const wStart = startOfWeek(w);
        const wEnd = endOfWeek(w);
        const key = format(wStart, "yyyy-MM-dd");
        const value = revenueOrders
          .filter((o) => {
            const od = getRowDate(o);
            return od && od >= wStart && od <= wEnd;
          })
          .reduce((sum, o) => sum + getOrderTotal(o), 0);

        const pw = pWeeks[idx];
        let prevValue = 0;
        if (pw) {
          const pwStart = startOfWeek(pw);
          const pwEnd = endOfWeek(pw);
          prevValue = revenuePrevOrders
            .filter((o) => {
              const od = getRowDate(o);
              return od && od >= pwStart && od <= pwEnd;
            })
            .reduce((sum, o) => sum + getOrderTotal(o), 0);
        }

        points.push({
          dateKey: key,
          label: `Week of ${format(wStart, "MMM d")}`,
          value,
          prevValue,
        });
      });
    } else if (diffDays <= 365 * 2) {
      // Monthly grouping
      const months = eachMonthOfInterval({ start, end });
      const pMonths =
        pStart && pEnd ? eachMonthOfInterval({ start: pStart, end: pEnd }) : [];

      months.forEach((m, idx) => {
        const mStart = startOfMonth(m);
        const mEnd = endOfMonth(m);
        const key = format(mStart, "yyyy-MM");
        const value = revenueOrders
          .filter((o) => {
            const od = getRowDate(o);
            return od && od >= mStart && od <= mEnd;
          })
          .reduce((sum, o) => sum + getOrderTotal(o), 0);

        const pm = pMonths[idx];
        let prevValue = 0;
        if (pm) {
          const pmStart = startOfMonth(pm);
          const pmEnd = endOfMonth(pm);
          prevValue = revenuePrevOrders
            .filter((o) => {
              const od = getRowDate(o);
              return od && od >= pmStart && od <= pmEnd;
            })
            .reduce((sum, o) => sum + getOrderTotal(o), 0);
        }

        points.push({
          dateKey: key,
          label: format(mStart, "MMM yyyy"),
          value,
          prevValue,
        });
      });
    } else {
      // Yearly grouping
      const startYear = start.getFullYear();
      const endYear = end.getFullYear();
      const pStartYear = pStart?.getFullYear();

      for (let y = startYear; y <= endYear; y++) {
        const value = revenueOrders
          .filter((o) => {
            const od = getRowDate(o);
            return od && od.getFullYear() === y;
          })
          .reduce((sum, o) => sum + getOrderTotal(o), 0);

        let prevValue = 0;
        if (pStartYear !== undefined) {
          const py = pStartYear + (y - startYear);
          prevValue = revenuePrevOrders
            .filter((o) => {
              const od = getRowDate(o);
              return od && od.getFullYear() === py;
            })
            .reduce((sum, o) => sum + getOrderTotal(o), 0);
        }

        points.push({
          dateKey: String(y),
          label: String(y),
          value,
          prevValue,
        });
      }
    }

    return points;
  }, [dateRange, previousDateRange, orders, filteredOrders]);

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const rows = netSalesChartData.map((r) => ({
        Date: r.dateKey,
        "Net Sales": r.value,
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Net Sales");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const outletName = String(selectedOutlet?.name || "outlet")
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "_");

      const start = dateRange?.from
        ? dateRange.from.toISOString().slice(0, 10)
        : "all";
      const end = dateRange?.to
        ? dateRange.to.toISOString().slice(0, 10)
        : dateRange?.from
          ? dateRange.from.toISOString().slice(0, 10)
          : "all";

      link.download = `dashboard_net_sales_${outletName}_${start}_${end}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
    } finally {
      setIsExporting(false);
    }
  };

  const inventoryStats = stockCounts;

  const lowStockItems = inventoryStats.lowStock;
  const expiringSoon = inventoryStats.expiringSoon;
  const outOfStock = inventoryStats.outOfStock;
  const totalInStock = inventoryStats.inStock;
  const totalInventory = inventoryStats.total;

  const filteredProductSales = useMemo(() => {
    const base = (productSales || []).filter((row) => {
      const d = row.orderDate ? new Date(row.orderDate) : null;
      return isWithinRange(d, dateRange);
    });

    const grouped = new Map<
      string,
      {
        name: string;
        image: string | null;
        totalSold: number;
        totalRevenue: number;
        orderIds: Set<string>;
      }
    >();
    for (const row of base) {
      const key = String(row.productId || row.productName || "");
      if (!key) continue;
      const existing = grouped.get(key) || {
        name: String(row.productName || "-"),
        image: normalizeImageUrl(row.productImage),
        totalSold: 0,
        totalRevenue: 0,
        orderIds: new Set<string>(),
      };
      if (row.orderId != null) existing.orderIds.add(String(row.orderId));
      existing.totalSold = existing.totalSold + toNumber(row.totalSold);
      existing.totalRevenue =
        existing.totalRevenue + toNumber(row.totalRevenue);
      if (!existing.image) {
        existing.image = normalizeImageUrl(row.productImage);
      }
      grouped.set(key, existing);
    }

    return Array.from(grouped.entries())
      .map(([, data]) => ({
        name: data.name,
        image: data.image,
        totalSold: data.totalSold,
        totalRevenue: data.totalRevenue,
        ordersCount: data.orderIds.size,
      }))
      .sort((a, b) => b.totalSold - a.totalSold);
  }, [dateRange, productSales]);

  const bestSellingRows = useMemo(() => {
    const term = normalizeText(bestSellingSearch);
    const rows = (filteredProductSales || []).filter((r) => {
      if (!term) return true;
      return normalizeText(r.name).includes(term);
    });

    const sortKey = bestSellingSort;
    return rows.sort((a, b) => {
      if (sortKey === "revenue") return b.totalRevenue - a.totalRevenue;
      return (b.ordersCount || 0) - (a.ordersCount || 0);
    });
  }, [bestSellingSearch, bestSellingSort, filteredProductSales]);

  const bestSellingTotalPages = useMemo(() => {
    const total = Math.ceil(
      (bestSellingRows.length || 0) / bestSellingItemsPerPage,
    );
    return Math.max(1, total || 1);
  }, [bestSellingItemsPerPage, bestSellingRows.length]);

  const bestSellingCurrentPage = useMemo(() => {
    if (bestSellingTotalPages <= 1) return 1;
    return Math.min(Math.max(1, bestSellingPage), bestSellingTotalPages);
  }, [bestSellingPage, bestSellingTotalPages]);

  const bestSellingPageOffset = useMemo(() => {
    return (bestSellingCurrentPage - 1) * bestSellingItemsPerPage;
  }, [bestSellingCurrentPage, bestSellingItemsPerPage]);

  const bestSellingPaginatedRows = useMemo(() => {
    const start = bestSellingPageOffset;
    const end = start + bestSellingItemsPerPage;
    return bestSellingRows.slice(start, end);
  }, [bestSellingItemsPerPage, bestSellingPageOffset, bestSellingRows]);

  useEffect(() => {
    if (!isBestSellingOpen) return;
    setBestSellingPage(1);
  }, [isBestSellingOpen]);

  useEffect(() => {
    if (!isBestSellingOpen) return;
    setBestSellingPage(1);
  }, [bestSellingSearch, bestSellingSort, isBestSellingOpen]);

  useEffect(() => {
    if (!isBestSellingOpen) return;
    if (bestSellingPage !== bestSellingCurrentPage) {
      setBestSellingPage(bestSellingCurrentPage);
    }
  }, [bestSellingCurrentPage, bestSellingPage, isBestSellingOpen]);

  const salesByProductRows = useMemo(() => {
    const term = normalizeText(salesByProductSearch);
    const rows = (filteredProductSales || []).filter((r) => {
      if (!term) return true;
      return normalizeText(r.name).includes(term);
    });

    const sortKey = salesByProductSort;
    return rows.sort((a, b) => {
      if (sortKey === "revenue") return b.totalRevenue - a.totalRevenue;
      return b.totalSold - a.totalSold;
    });
  }, [filteredProductSales, salesByProductSearch, salesByProductSort]);

  const salesByProductTotalPages = useMemo(() => {
    const total = Math.ceil(
      (salesByProductRows.length || 0) / salesByProductItemsPerPage,
    );
    return Math.max(1, total || 1);
  }, [salesByProductItemsPerPage, salesByProductRows.length]);

  const salesByProductCurrentPage = useMemo(() => {
    if (salesByProductTotalPages <= 1) return 1;
    return Math.min(Math.max(1, salesByProductPage), salesByProductTotalPages);
  }, [salesByProductPage, salesByProductTotalPages]);

  const salesByProductPageOffset = useMemo(() => {
    return (salesByProductCurrentPage - 1) * salesByProductItemsPerPage;
  }, [salesByProductCurrentPage, salesByProductItemsPerPage]);

  const salesByProductPaginatedRows = useMemo(() => {
    const start = salesByProductPageOffset;
    const end = start + salesByProductItemsPerPage;
    return salesByProductRows.slice(start, end);
  }, [
    salesByProductItemsPerPage,
    salesByProductPageOffset,
    salesByProductRows,
  ]);

  useEffect(() => {
    if (!isSalesByProductOpen) return;
    setSalesByProductPage(1);
  }, [isSalesByProductOpen]);

  useEffect(() => {
    if (!isSalesByProductOpen) return;
    setSalesByProductPage(1);
  }, [salesByProductSearch, salesByProductSort, isSalesByProductOpen]);

  useEffect(() => {
    if (!isSalesByProductOpen) return;
    if (salesByProductPage !== salesByProductCurrentPage) {
      setSalesByProductPage(salesByProductCurrentPage);
    }
  }, [isSalesByProductOpen, salesByProductCurrentPage, salesByProductPage]);

  const stockChartData =
    lowStockItems + expiringSoon + outOfStock + totalInStock > 0
      ? [
          { name: "Total in Stock", value: totalInStock, color: "#15BA5C" },
          { name: "Low Stock Items", value: lowStockItems, color: "#FBBF24" },
          { name: "Expiring Soon", value: expiringSoon, color: "#F97316" },
          { name: "Out of Stock", value: outOfStock, color: "#EF4444" },
        ].filter((d) => Number(d.value) > 0)
      : [{ name: "Total Inventory", value: 1, color: "#15BA5C" }];
  return (
    <section className="">
      <div className="bg-white px-7 py-3.5 flex items-center justify-between">
        <div className="">
          <h3 className="font-bold text-[24px] text-[#1C1B20]">
            <span className="">Welcome </span>
            <span className="">
              {(authUser?.name || authUser?.email || "there") + " 👋🏽"}
            </span>
          </h3>
          <p className="text-[#737373] text-[14px]">
            {" "}
            Have an in-depth look at all the metrics/performance within your
            dashboard
          </p>
        </div>
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => setIsCalendarOpen(true)}
            className="w-full md:flex-1 h-[48px] rounded-[10px] border border-[#E5E7EB] bg-white overflow-hidden flex items-stretch cursor-pointer"
          >
            <div className="flex-1 px-4 flex items-center justify-between">
              <span className="text-[14px] font-medium text-[#111827] truncate">
                {formatRangeLabel(dateRange)}
              </span>
            </div>
            <div className="w-[48px] bg-[#15BA5C] flex items-center justify-center">
              <Calendar className="size-5 text-white" />
            </div>
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex cursor-pointer h-11 items-center gap-2 rounded-[10px] bg-[#15BA5C] px-4 py-2 text-sm font-medium text-white hover:bg-[#13A652] transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_3753_3209)">
                <path
                  d="M12.7575 1.50006C13.3905 1.49556 14.0235 1.75506 14.5065 2.27406L17.4315 5.34906C17.751 5.69106 17.751 6.24906 17.4315 6.59106C17.3584 6.67183 17.2691 6.73639 17.1695 6.78057C17.07 6.82476 16.9622 6.84758 16.8533 6.84758C16.7443 6.84758 16.6365 6.82476 16.537 6.78057C16.4374 6.73639 16.3481 6.67183 16.275 6.59106L13.5 3.67656V15.6661C13.5 16.1266 13.164 16.5001 12.75 16.5001C12.336 16.5001 12 16.1266 12 15.6661V3.72606L9.27 6.59106C9.19689 6.67159 9.10774 6.73594 9.00829 6.77997C8.90883 6.82401 8.80127 6.84675 8.6925 6.84675C8.58373 6.84675 8.47617 6.82401 8.37671 6.77997C8.27726 6.73594 8.18811 6.67159 8.115 6.59106C7.96058 6.4208 7.87505 6.19916 7.87505 5.96931C7.87505 5.73945 7.96058 5.51782 8.115 5.34756L11.04 2.27256C11.2574 2.03418 11.5213 1.8427 11.8153 1.70987C12.1093 1.57704 12.4274 1.50564 12.75 1.50006H12.7575ZM6.27 10.5001C5.5605 10.5001 4.95 10.9411 4.812 11.5546L3.0285 19.4296C3.01156 19.5146 3.00203 19.6009 3 19.6876C3 20.4121 3.666 21.0001 4.485 21.0001H21.015C21.113 21.0001 21.21 20.9916 21.306 20.9746C22.1115 20.8321 22.6335 20.1406 22.473 19.4296L20.688 11.5546C20.55 10.9411 19.9395 10.5001 19.233 10.5001H6.27ZM9 9.00006V10.5001H16.5V9.00006H19.2375C20.6565 9.00006 21.8775 9.90906 22.1565 11.1706L23.9415 19.2706C24.264 20.7331 23.2185 22.1551 21.6075 22.4476C21.4147 22.4841 21.2187 22.5017 21.0225 22.5001H4.4775C2.832 22.5001 1.5 21.2911 1.5 19.8001C1.5 19.6211 1.5195 19.4446 1.5585 19.2706L3.3435 11.1706C3.621 9.90906 4.8435 9.00006 6.261 9.00006H9Z"
                  fill="white"
                />
              </g>
              <defs>
                <clipPath id="clip0_3753_3209">
                  <rect width="24" height="24" fill="white" />
                </clipPath>
              </defs>
            </svg>

            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="w-full rounded-[16px]  px-3">
        <div className="bg-white my-5 py-4 px-2 rounded-[10px]">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Total Sales Revenue",
                value: formatPrice({
                  amount: stats.totalSalesRevenue,
                  currencyCode: selectedOutlet?.currency || "USD",
                }),
                change: getChangeLabel(
                  stats.totalSalesRevenue,
                  prevStats.totalSalesRevenue,
                  true,
                ),
              },
              {
                label: "Net Sales (Tax Excl)",
                value: formatPrice({
                  amount: stats.netSales,
                  currencyCode: selectedOutlet?.currency || "USD",
                }),
                change: getChangeLabel(
                  stats.netSales,
                  prevStats.netSales,
                  true,
                ),
              },
              {
                label: "Production Output",
                value: stats.productionOutput.toString(),
                change: getChangeLabel(
                  stats.productionOutput,
                  prevStats.productionOutput,
                ),
              },
              {
                label: "Stock Valuation",
                value: formatPrice({
                  amount: stats.stockValuation,
                  currencyCode: selectedOutlet?.currency || "USD",
                }),
                change: getChangeLabel(
                  stats.stockValuation,
                  prevStats.stockValuation,
                  true,
                ),
              },
              {
                label: "Total Orders",
                value: stats.totalOrders.toString(),
                change: getChangeLabel(
                  stats.totalOrders,
                  prevStats.totalOrders,
                ),
              },
              {
                label: "Total Orders in Production",
                value: stats.totalOrdersInProduction.toString(),
                change: getChangeLabel(
                  stats.totalOrdersInProduction,
                  prevStats.totalOrdersInProduction,
                ),
              },
              {
                label: "Production Batches in Queue",
                value: stats.batchesInQueue.toString(),
                change: getChangeLabel(
                  stats.batchesInQueue,
                  prevStats.batchesInQueue,
                ),
              },
              {
                label: "Orders not yet Produced",
                value: stats.ordersNotYetProduced.toString(),
                change: getChangeLabel(
                  stats.ordersNotYetProduced,
                  prevStats.ordersNotYetProduced,
                ),
              },
            ].map((card) => (
              <div
                key={card.label}
                className="relative overflow-hidden rounded-[12px] border border-[#E6F4EC] bg-[#F3FBF7] px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[20px] font-semibold text-[#111827] leading-none">
                      {card.value}
                    </div>
                    <div className="mt-2 text-[13px] font-medium text-[#111827] truncate">
                      {card.label}
                    </div>
                  </div>

                  <div className="relative shrink-0">
                    <div className="size-10 rounded-[10px] bg-[#DDF7E9] flex items-center justify-center">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-[#15BA5C]"
                      >
                        <path
                          d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M19 8v6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M22 11h-6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="pointer-events-none absolute -right-1 -bottom-1 size-10 rounded-[10px] border border-[#E6F4EC] opacity-70" />
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 text-[12px] text-[#16A34A]">
                  <span>{card.change}</span>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#15BA5C]" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full rounded-[16px]  px-3">
        <div className="bg-white my-5 py-4 px-2 rounded-[10px]">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[18px] font-bold">Net Sales Over Time</h3>
                <p className="text-[14px]">
                  Track your key sales over selected periods
                </p>
              </div>
              <div className="text-right">
                <div className="text-[20px] font-bold text-[#111827]">
                  {formatPrice({
                    amount: stats.netSales,
                    currencyCode: selectedOutlet?.currency || "USD",
                  })}
                </div>
                <div
                  className={`text-[13px] font-medium ${
                    stats.netSales >= prevStats.netSales
                      ? "text-[#16A34A]"
                      : "text-[#EF4444]"
                  }`}
                >
                  {getChangeLabel(stats.netSales, prevStats.netSales, true)}
                </div>
              </div>
            </div>
          </div>
          <div className="">
            <div className="mt-6">
              {netSalesChartData.length > 0 ? (
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={netSalesChartData}
                      margin={{ top: 20, right: 18, left: 12, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="netSalesFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#15BA5C"
                            stopOpacity={0.15}
                          />
                          <stop
                            offset="100%"
                            stopColor="#15BA5C"
                            stopOpacity={0.01}
                          />
                        </linearGradient>
                        <linearGradient
                          id="prevSalesFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#9CA3AF"
                            stopOpacity={0.1}
                          />
                          <stop
                            offset="100%"
                            stopColor="#9CA3AF"
                            stopOpacity={0.01}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="5 5"
                        vertical={true}
                        stroke="#E5E7EB"
                      />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#6B7280", fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#6B7280", fontSize: 12 }}
                        tickFormatter={(v) => {
                          const val = Number(v);
                          const symbol = getCurrencySymbol(
                            selectedOutlet?.currency || "USD",
                          );
                          if (val >= 1000)
                            return `${symbol}${(val / 1000).toFixed(0)}k`;
                          return `${symbol}${val}`;
                        }}
                        width={60}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                        formatter={(v, name) => [
                          formatPrice({
                            amount: Number(v) || 0,
                            currencyCode: selectedOutlet?.currency || "USD",
                          }),
                          name === "value"
                            ? "Current Period"
                            : "Previous Period",
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="prevValue"
                        stroke="#9CA3AF"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        fill="url(#prevSalesFill)"
                        dot={false}
                        isAnimationActive={true}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#15BA5C"
                        strokeWidth={3}
                        fill="url(#netSalesFill)"
                        dot={{
                          r: 4,
                          fill: "#15BA5C",
                          stroke: "#fff",
                          strokeWidth: 2,
                        }}
                        activeDot={{
                          r: 6,
                          fill: "#15BA5C",
                          stroke: "#fff",
                          strokeWidth: 2,
                        }}
                        isAnimationActive={true}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 flex-col py-10">
                  <div className="w-[180px] h-[190px] flex items-center justify-center ">
                    <img
                      src={EmptyStateAssests.OnlineOrdersEmptyState}
                      alt="No data"
                    />
                  </div>
                  <h4 className="font-bold text-[17px]">No data available</h4>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 px-3 gap-5 mb-10">
        <div className="flex-1 bg-white py-4 px-2 rounded-[10px]">
          <div className="flex items-center justify-between">
            <h3 className="text-[18px] font-bold">Production Queue</h3>
            <p className="text-[14px] bg-[#15BA5C1A] text-[#15BA5C]">
              {productionQueueRowsBase.length} Items
            </p>
          </div>

          <div className="w-full h-full">
            {productionQueueRowsBase.length > 0 ? (
              <div className="mt-4 flex flex-col gap-4">
                {filteredProductions
                  .filter((p) =>
                    [
                      "order_selected",
                      "inventory_pending",
                      "inventory_approved",
                      "in_preparation",
                    ].includes(normalizeText(p.status)),
                  )
                  .slice(0, 3)
                  .map((p) => {
                    const meta = productionQueueMetaById[String(p.id || "")];
                    const productCode = meta?.productCode || "—";
                    const units =
                      meta?.totalRequestedQuantity > 0
                        ? meta.totalRequestedQuantity
                        : meta?.totalFinalQuantity || 0;
                    const due = p.productionDueDate || p.productionDate || null;
                    const dueLabel = due
                      ? `Due: ${format(new Date(due), "dd/MM/yyyy")}`
                      : "";
                    const pill = productionStatusPill(p.status);
                    const progress = getProductionProgressPercent(p.status);

                    return (
                      <div
                        key={p.id}
                        className="rounded-[12px] border border-[#E5E7EB] bg-white px-5 py-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-[18px] font-semibold text-[#111827] truncate">
                              Component Batch #
                              {p.batchId || String(p.id).slice(0, 6)}
                            </div>
                            <div className="mt-1 text-[14px] text-[#6B7280]">
                              {productCode}
                            </div>
                          </div>
                          <span
                            className={`shrink-0 px-4 py-2 rounded-full text-[14px] font-medium ${pill.cls}`}
                          >
                            {pill.label}
                          </span>
                        </div>

                        <div className="mt-4 flex items-center justify-between text-[14px] text-[#6B7280]">
                          <span>{Number(units).toLocaleString()} units</span>
                          <span>{dueLabel}</span>
                        </div>

                        <div className="mt-3 h-3 w-full rounded-full bg-[#E5E7EB] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#15BA5C]"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}

                <button
                  type="button"
                  onClick={() => {
                    setIsProductionQueueOpen(true);
                    setIsProductionQueueFiltersOpen(false);
                  }}
                  className="mt-2 h-[52px] w-full rounded-[10px] bg-[#15BA5C] text-white text-[16px] font-semibold hover:bg-[#119E4D] transition-colors cursor-pointer"
                >
                  See all
                </button>
              </div>
            ) : (
              <div className="flex  h-full items-center justify-center flex-col mb-8">
                <div className="w-[180px] h-[190px]  flex items-center justify-center ">
                  <img
                    src={EmptyStateAssests.OnlineOrdersEmptyState}
                    alt="Online Orders Empty State"
                  />
                </div>
                <h4 className="font-bold text-[17px]">
                  No Batches in Queue for the selected period
                </h4>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 bg-white py-4 px-6 rounded-[10px]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-[18px] font-bold">Stock Overview</h3>
              <p className="mt-1 text-[14px] text-[#6B7280]">
                Monitor real-time stock levels.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center">
            <div className="relative size-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockChartData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={85}
                    outerRadius={118}
                    startAngle={90}
                    endAngle={-270}
                    stroke="transparent"
                    isAnimationActive={false}
                  >
                    {stockChartData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={entry.color}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>

                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x="50%"
                      dy="-0.2em"
                      fill="#111827"
                      fontSize="48"
                      fontWeight="700"
                    >
                      {totalInventory}
                    </tspan>
                    <tspan
                      x="50%"
                      dy="1.6em"
                      fill="#111827"
                      fontSize="16"
                      fontWeight="500"
                    >
                      Total Inventory
                    </tspan>
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-x-10 gap-y-8">
            <div className="flex flex-col gap-2 items-center">
              <div className="flex items-center gap-3">
                <span className="size-3 rounded-full bg-[#FBBF24]" />
                <span className="text-[15px] font-medium text-[#111827]">
                  Low Stock Items
                </span>
              </div>
              <div className="pl-6 text-[22px] font-semibold text-[#111827]">
                {lowStockItems}
              </div>
            </div>

            <div className="flex flex-col gap-2 items-center text-right">
              <div className="flex items-center gap-3">
                <span className="size-3 rounded-full bg-[#F97316]" />
                <span className="text-[15px] font-medium text-[#111827]">
                  Expiring Soon
                </span>
              </div>
              <div className="pr-0 text-[22px] font-semibold text-[#111827]">
                {expiringSoon}
              </div>
            </div>

            <div className="flex flex-col gap-2 items-center">
              <div className="flex items-center gap-3">
                <span className="size-3 rounded-full bg-[#EF4444]" />
                <span className="text-[15px] font-medium text-[#111827]">
                  Out of Stock
                </span>
              </div>
              <div className="pl-6 text-[22px] font-semibold text-[#111827]">
                {outOfStock}
              </div>
            </div>

            <div className="flex flex-col gap-2 items-center text-right">
              <div className="flex items-center gap-3">
                <span className="size-3 rounded-full bg-[#15BA5C]" />
                <span className="text-[15px] font-medium text-[#111827]">
                  Total in Stock
                </span>
              </div>
              <div className="pr-0 text-[22px] font-semibold text-[#111827]">
                {totalInStock}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white py-4 px-2 rounded-[10px]">
          <div className="px-6 pt-2">
            <h3 className="text-[18px] font-bold">Best Selling Items</h3>
            <p className="mt-1 text-[14px] text-[#6B7280]">
              Your top-selling items over time, showcasing customer favorites
            </p>
          </div>

          {filteredProductSales.length > 0 ? (
            <div className="mt-8 px-6 pb-6">
              <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                {bestSellingRows.slice(0, 8).map((item) => (
                  <div key={item.name} className="flex items-center gap-4">
                    <img
                      src={item.image || ProductAssets.Broken}
                      alt={item.name}
                      className="h-[64px] w-[64px] rounded-[10px] object-cover"
                    />

                    <div className="min-w-0">
                      <div className="text-[18px] font-semibold text-[#111827] truncate">
                        {item.name}
                      </div>
                      <div className="mt-1 text-[14px] text-[#6B7280]">
                        Sales Volume: {item.ordersCount || 0} Orders
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsBestSellingOpen(true);
                  setIsBestSellingFiltersOpen(false);
                }}
                className="mt-8 h-[56px] w-full rounded-[10px] bg-[#15BA5C] text-white text-[16px] font-semibold hover:bg-[#119E4D] transition-colors cursor-pointer"
              >
                See all
              </button>
            </div>
          ) : (
            <div className="mt-10 flex flex-col items-center justify-center text-center pb-10">
              <div className="w-[180px] h-[190px]  flex items-center justify-center ">
                <img
                  src={EmptyStateAssests.OnlineOrdersEmptyState}
                  alt="Online Orders Empty State"
                />
              </div>

              <h4 className="mt-3 text-[17px] font-bold text-[#111827] leading-tight">
                No top-selling items available for the
                <br />
                selected period.
              </h4>
            </div>
          )}
        </div>
        <div className="flex-1 bg-white py-4 px-2 rounded-[10px]">
          <div className="px-4 pt-2">
            <h3 className="text-[18px] font-bold"> Sales by Product</h3>
            <p className="mt-1 text-[14px] text-[#6B7280]">
              See table of items sold over time to identify peak sales and
              optimize inventory
            </p>
          </div>

          <div className="mt-6 px-4">
            <div className="w-full overflow-hidden rounded-[10px] border border-[#E5E7EB]">
              <div className="grid grid-cols-3 bg-[#F9FAFB]">
                <div className="px-4 py-4 text-center text-[14px] font-medium text-[#9CA3AF]">
                  Product Sold
                </div>
                <div className="px-4 py-4 text-center text-[14px] font-medium text-[#9CA3AF] border-l border-[#E5E7EB]">
                  Number Sold
                </div>
                <div className="px-4 py-4 text-center text-[14px] font-medium text-[#9CA3AF] border-l border-[#E5E7EB]">
                  Sales Amount
                </div>
              </div>
              {filteredProductSales.length > 0 ? (
                <div className="divide-y divide-[#E5E7EB]">
                  {filteredProductSales.slice(0, 5).map((item) => (
                    <div key={item.name} className="grid grid-cols-3">
                      <div className="px-4 py-3 text-[14px] text-[#111827] text-center truncate">
                        {item.name}
                      </div>
                      <div className="px-4 py-3 text-[14px] text-[#111827] text-center border-l border-[#E5E7EB]">
                        {item.totalSold}
                      </div>
                      <div className="px-4 py-3 text-[14px] text-[#111827] text-center border-l border-[#E5E7EB]">
                        {formatPrice({
                          amount: item.totalRevenue,
                          currencyCode: selectedOutlet?.currency || "USD",
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {filteredProductSales.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setIsSalesByProductOpen(true);
                  setIsSalesByProductFiltersOpen(false);
                }}
                className="mt-6 h-[56px] w-full rounded-[10px] bg-[#15BA5C] text-white text-[16px] font-semibold hover:bg-[#119E4D] transition-colors cursor-pointer"
              >
                See all
              </button>
            )}
          </div>

          {filteredProductSales.length === 0 && (
            <div className="mt-12 flex flex-col items-center justify-center text-center pb-10">
              <div className="w-[180px] h-[190px]  flex items-center justify-center ">
                <img
                  src={EmptyStateAssests.OnlineOrdersEmptyState}
                  alt="Online Orders Empty State"
                />
              </div>

              <h4 className="mt-3 text-[17px] font-bold text-[#111827] leading-tight">
                No Sales by product for the selected
                <br />
                period
              </h4>
            </div>
          )}
        </div>
      </div>

      {isProductionQueueOpen && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-[980px] h-[86vh] bg-white rounded-[14px] shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-[#E5E7EB] flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <h3 className="text-[20px] font-bold text-[#111827]">
                  Production Queue
                </h3>
                <span className="px-4 py-2 rounded-full bg-[#ECFDF5] text-[#16A34A] text-[14px] font-semibold">
                  {productionQueueRowsBase.length} items
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsProductionQueueOpen(false);
                  setIsProductionQueueFiltersOpen(false);
                }}
                className="h-10 w-10 rounded-full bg-[#F3F4F6] text-[#6B7280] flex items-center justify-center hover:bg-[#E5E7EB] transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="px-6 py-4 flex items-center gap-4">
              <div className="flex-1 flex items-center h-[48px] rounded-[10px] border border-[#E5E7EB] overflow-hidden bg-white">
                <input
                  value={productionQueueSearch}
                  onChange={(e) => setProductionQueueSearch(e.target.value)}
                  placeholder="Search"
                  className="flex-1 h-full px-4 outline-none text-[14px] text-[#111827] placeholder:text-[#9CA3AF]"
                />
                <div className="h-full w-[52px] bg-[#15BA5C] flex items-center justify-center">
                  <Search className="size-5 text-white" />
                </div>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setIsProductionQueueFiltersOpen((prev) => !prev)
                  }
                  className="h-[48px] px-5 rounded-[10px] border border-[#E5E7EB] bg-white flex items-center gap-2 text-[14px] font-medium text-[#111827] hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                >
                  Filters
                  <SlidersHorizontal className="size-4 text-[#6B7280]" />
                </button>

                {isProductionQueueFiltersOpen && (
                  <div className="absolute right-0 mt-2 w-[240px] rounded-[12px] border border-[#E5E7EB] bg-white shadow-lg p-2 z-[210]">
                    {(
                      [
                        { key: "all", label: "All" },
                        { key: "order_selected", label: "Scheduled" },
                        {
                          key: "inventory_pending",
                          label: "Inventory Pending",
                        },
                        {
                          key: "inventory_approved",
                          label: "Inventory Approved",
                        },
                        { key: "in_preparation", label: "In Progress" },
                      ] as Array<{
                        key: typeof productionQueueStatusFilter;
                        label: string;
                      }>
                    ).map((opt) => {
                      const active = productionQueueStatusFilter === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            setProductionQueueStatusFilter(opt.key);
                            setIsProductionQueueFiltersOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-[10px] text-[14px] transition-colors cursor-pointer ${
                            active
                              ? "bg-[#15BA5C1A] text-[#15BA5C]"
                              : "text-[#111827] hover:bg-[#F3F4F6]"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <div className="flex flex-col gap-4">
                {productionQueueRows.map((p) => {
                  const meta = productionQueueMetaById[String(p.id || "")];
                  const productCode = meta?.productCode || "—";
                  const units =
                    meta?.totalRequestedQuantity > 0
                      ? meta.totalRequestedQuantity
                      : meta?.totalFinalQuantity || 0;
                  const due = p.productionDueDate || p.productionDate || null;
                  const dueLabel = due
                    ? `Due: ${format(new Date(due), "dd/MM/yyyy")}`
                    : "";
                  const pill = productionStatusPill(p.status);
                  const progress = getProductionProgressPercent(p.status);

                  return (
                    <div
                      key={p.id}
                      className="rounded-[12px] border border-[#E5E7EB] bg-white px-5 py-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-[18px] font-semibold text-[#111827] truncate">
                            Component Batch #
                            {p.batchId || String(p.id).slice(0, 6)}
                          </div>
                          <div className="mt-1 text-[14px] text-[#6B7280]">
                            {productCode}
                          </div>
                        </div>
                        <span
                          className={`shrink-0 px-4 py-2 rounded-full text-[14px] font-medium ${pill.cls}`}
                        >
                          {pill.label}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-[14px] text-[#6B7280]">
                        <span>{Number(units).toLocaleString()} units</span>
                        <span>{dueLabel}</span>
                      </div>

                      <div className="mt-3 h-3 w-full rounded-full bg-[#E5E7EB] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#15BA5C]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {productionQueueRows.length === 0 && (
                  <div className="flex items-center justify-center flex-col py-10">
                    <div className="w-[180px] h-[190px] flex items-center justify-center ">
                      <img
                        src={EmptyStateAssests.OnlineOrdersEmptyState}
                        alt="No data"
                      />
                    </div>
                    <h4 className="font-bold text-[17px] text-[#111827]">
                      No Batches in Queue for the selected period
                    </h4>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isBestSellingOpen && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-[980px] h-[86vh] bg-white rounded-[14px] shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-[#E5E7EB] flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[22px] font-bold text-[#111827]">
                  Best Selling Items
                </h3>
                <p className="mt-1 text-[14px] text-[#6B7280]">
                  Your top-selling items over time, showcasing customer
                  favorites
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsBestSellingOpen(false);
                  setIsBestSellingFiltersOpen(false);
                }}
                className="h-10 w-10 rounded-full bg-[#F3F4F6] text-[#6B7280] flex items-center justify-center hover:bg-[#E5E7EB] transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="px-6 py-4 flex items-center gap-4">
              <div className="flex-1 flex items-center h-[48px] rounded-[10px] border border-[#E5E7EB] overflow-hidden bg-white">
                <input
                  value={bestSellingSearch}
                  onChange={(e) => setBestSellingSearch(e.target.value)}
                  placeholder="Search"
                  className="flex-1 h-full px-4 outline-none text-[14px] text-[#111827] placeholder:text-[#9CA3AF]"
                />
                <div className="h-full w-[52px] bg-[#15BA5C] flex items-center justify-center">
                  <Search className="size-5 text-white" />
                </div>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsBestSellingFiltersOpen((p) => !p)}
                  className="h-[48px] px-5 rounded-[10px] border border-[#E5E7EB] bg-white flex items-center gap-2 text-[14px] font-medium text-[#111827] hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                >
                  Filters
                  <SlidersHorizontal className="size-4 text-[#6B7280]" />
                </button>

                {isBestSellingFiltersOpen && (
                  <div className="absolute right-0 mt-2 w-[240px] rounded-[12px] border border-[#E5E7EB] bg-white shadow-lg p-2 z-[210]">
                    {(
                      [
                        { key: "orders", label: "Sort by Orders" },
                        { key: "revenue", label: "Sort by Revenue" },
                      ] as Array<{ key: typeof bestSellingSort; label: string }>
                    ).map((opt) => {
                      const active = bestSellingSort === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            setBestSellingSort(opt.key);
                            setIsBestSellingFiltersOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-[10px] text-[14px] transition-colors cursor-pointer ${
                            active
                              ? "bg-[#15BA5C1A] text-[#15BA5C]"
                              : "text-[#111827] hover:bg-[#F3F4F6]"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {bestSellingRows.length > 0 ? (
                <div className="grid grid-cols-2 gap-x-12 gap-y-6 mt-10">
                  {bestSellingPaginatedRows.map((item, idx) => (
                    <div
                      key={`${item.name}-${bestSellingPageOffset + idx}`}
                      className="flex items-center gap-4"
                    >
                      <div className="relative shrink-0">
                        <span className="absolute -left-3 -top-2 size-7 rounded-full bg-[#15BA5C] text-white text-[12px] font-semibold flex items-center justify-center">
                          {bestSellingPageOffset + idx + 1}
                        </span>

                        <img
                          src={item.image || ProductAssets.Broken}
                          alt={item.name}
                          className="h-[56px] w-[56px] rounded-[10px] object-cover"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="text-[18px] font-semibold text-[#111827] truncate">
                          {item.name}
                        </div>
                        <div className="mt-1 text-[14px] text-[#6B7280]">
                          Sales Volume: {item.ordersCount || 0} Orders
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center flex-col py-10">
                  <div className="w-[180px] h-[190px] flex items-center justify-center ">
                    <img
                      src={EmptyStateAssests.OnlineOrdersEmptyState}
                      alt="No data"
                    />
                  </div>
                  <h4 className="font-bold text-[17px] text-[#111827]">
                    No top-selling items available for the selected period
                  </h4>
                </div>
              )}
            </div>

            {bestSellingRows.length > 0 && (
              <Pagination
                currentPage={bestSellingCurrentPage}
                totalPages={bestSellingTotalPages}
                onPageChange={setBestSellingPage}
                itemsPerPage={bestSellingItemsPerPage}
                onItemsPerPageChange={(items) => {
                  setBestSellingItemsPerPage(items);
                  setBestSellingPage(1);
                }}
                totalItems={bestSellingRows.length}
              />
            )}
          </div>
        </div>
      )}

      {isSalesByProductOpen && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-[980px] h-[86vh] bg-white rounded-[14px] shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-[#E5E7EB] flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[22px] font-bold text-[#111827]">
                  Sales by Product
                </h3>
                <p className="mt-1 text-[14px] text-[#6B7280]">
                  See table of items sold over time to identify peak sales and
                  optimize inventory
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSalesByProductOpen(false);
                  setIsSalesByProductFiltersOpen(false);
                }}
                className="h-10 w-10 rounded-full bg-[#F3F4F6] text-[#6B7280] flex items-center justify-center hover:bg-[#E5E7EB] transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="px-6 py-4 flex items-center gap-4">
              <div className="flex-1 flex items-center h-[48px] rounded-[10px] border border-[#E5E7EB] overflow-hidden bg-white">
                <input
                  value={salesByProductSearch}
                  onChange={(e) => setSalesByProductSearch(e.target.value)}
                  placeholder="Search"
                  className="flex-1 h-full px-4 outline-none text-[14px] text-[#111827] placeholder:text-[#9CA3AF]"
                />
                <div className="h-full w-[52px] bg-[#15BA5C] flex items-center justify-center">
                  <Search className="size-5 text-white" />
                </div>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSalesByProductFiltersOpen((p) => !p)}
                  className="h-[48px] px-5 rounded-[10px] border border-[#E5E7EB] bg-white flex items-center gap-2 text-[14px] font-medium text-[#111827] hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                >
                  Filters
                  <SlidersHorizontal className="size-4 text-[#6B7280]" />
                </button>

                {isSalesByProductFiltersOpen && (
                  <div className="absolute right-0 mt-2 w-[240px] rounded-[12px] border border-[#E5E7EB] bg-white shadow-lg p-2 z-[210]">
                    {(
                      [
                        { key: "sold", label: "Sort by Number Sold" },
                        { key: "revenue", label: "Sort by Sales Amount" },
                      ] as Array<{
                        key: typeof salesByProductSort;
                        label: string;
                      }>
                    ).map((opt) => {
                      const active = salesByProductSort === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            setSalesByProductSort(opt.key);
                            setIsSalesByProductFiltersOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-[10px] text-[14px] transition-colors cursor-pointer ${
                            active
                              ? "bg-[#15BA5C1A] text-[#15BA5C]"
                              : "text-[#111827] hover:bg-[#F3F4F6]"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {salesByProductRows.length > 0 ? (
                <div className="mt-6 w-full overflow-hidden rounded-[10px] border border-[#E5E7EB]">
                  <div className="grid grid-cols-3 bg-[#F9FAFB]">
                    <div className="px-4 py-4 text-center text-[14px] font-medium text-[#9CA3AF]">
                      Product Sold
                    </div>
                    <div className="px-4 py-4 text-center text-[14px] font-medium text-[#9CA3AF] border-l border-[#E5E7EB]">
                      Number Sold
                    </div>
                    <div className="px-4 py-4 text-center text-[14px] font-medium text-[#9CA3AF] border-l border-[#E5E7EB]">
                      Sales Amount
                    </div>
                  </div>
                  <div className="divide-y divide-[#E5E7EB]">
                    {salesByProductPaginatedRows.map((item, idx) => (
                      <div
                        key={`${item.name}-${salesByProductPageOffset + idx}`}
                        className="grid grid-cols-3"
                      >
                        <div className="px-4 py-4 text-[14px] text-[#111827] text-center truncate font-medium">
                          {item.name}
                        </div>
                        <div className="px-4 py-4 text-[14px] text-[#111827] text-center border-l border-[#E5E7EB]">
                          {item.totalSold}
                        </div>
                        <div className="px-4 py-4 text-[14px] text-[#111827] text-center border-l border-[#E5E7EB]">
                          {formatPrice({
                            amount: item.totalRevenue,
                            currencyCode: selectedOutlet?.currency || "USD",
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center flex-col py-10">
                  <div className="w-[180px] h-[190px] flex items-center justify-center ">
                    <img
                      src={EmptyStateAssests.OnlineOrdersEmptyState}
                      alt="No data"
                    />
                  </div>
                  <h4 className="font-bold text-[17px] text-[#111827]">
                    No Sales by product for the selected period
                  </h4>
                </div>
              )}
            </div>

            {salesByProductRows.length > 0 && (
              <Pagination
                currentPage={salesByProductCurrentPage}
                totalPages={salesByProductTotalPages}
                onPageChange={setSalesByProductPage}
                itemsPerPage={salesByProductItemsPerPage}
                onItemsPerPageChange={(items) => {
                  setSalesByProductItemsPerPage(items);
                  setSalesByProductPage(1);
                }}
                totalItems={salesByProductRows.length}
              />
            )}
          </div>
        </div>
      )}

      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        value={dateRange}
        onConfirm={(next) => setDateRange(next)}
      />
    </section>
  );
};

export default MainDashboardPage;
