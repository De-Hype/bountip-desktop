import { Pagination } from "@/shared/Pagination/pagination";
import TraceabilityEmptyState from "./TraceabilityEmptyState";
import {
  ProductCard,
  TraceabilityCatalogueProductResults,
  type BatchOption,
  type CatalogueProduct,
  type ProductionDetailRow,
  type ProductStatus,
  type TimelineItem,
  type TraceTab,
} from "./TraceabilityCatalogueProductResults";
import {
  Calendar,
  LayoutGrid,
  List,
  Package,
  Truck,
  Upload,
  User,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from "react";
import type { DateRange } from "react-day-picker";

type ProductionCardRow = {
  productionId: string;
  status: string | null;
  batchId: string | null;
  productionDate: string | null;
  productionDueDate: string | null;
  initiator: string | null;
  productionStartedBy: string | null;
  outletId: string | null;
  productId: string | null;
  productName: string | null;
  productCode: string | null;
  logoUrl: string | null;
  category: string | null;
  ingredientsCount: number | null;
  totalRequestedQuantity: number | null;
  totalFinalQuantity: number | null;
};

type ProductionV2TraceRow = {
  id: string;
  event: string | null;
  fromStatus: string | null;
  toStatus: string | null;
  actorId: string | null;
  metadata: string | null;
  createdAt: string | null;
  productionId: string | null;
};

type IngredientDeduction = {
  lotId: string;
  itemName: string;
  quantity: number;
  lotNumber: string | null;
  ingredientType: string | null;
};

type ItemLotRow = {
  id: string;
  lotNumber: string;
  supplierName: string | null;
  expiryDate: string | null;
  createdAt: string | null;
};

type CustomerSaleRow = {
  key: string;
  customerName: string;
  customerEmail: string;
  soldAt: string | null;
  quantitySold: number;
  processedBy: string;
  orderId: string | null;
};

type TraceabilitySearch = {
  searchType: "product_or_batch" | "customer" | "order" | string;
  searchQuery: string;
};

type TraceabilityCatalogueProductsProps = {
  outletId?: string;
  dateRange?: DateRange;
  search?: TraceabilitySearch | null;
};

const isUuidLike = (value: string | null | undefined) => {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
};

const getElectronAPI = () => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { electronAPI?: { dbQuery?: any } };
  return w.electronAPI ?? null;
};

const toDateRangeSql = (dateRange?: DateRange) => {
  const from = dateRange?.from ? new Date(dateRange.from) : null;
  const to = dateRange?.to ? new Date(dateRange.to) : null;
  if (!from || !to) return null;

  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);

  return { fromIso: from.toISOString(), toIso: to.toISOString() };
};

const formatShortDate = (value: string | null | undefined) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")} ${d.getFullYear()}`;
};

const formatTimeLabel = (value: string | null | undefined) => {
  if (!value) return "";
  const asString = String(value);
  if (!asString) return "";
  const m = asString.match(/^(\d{2}):(\d{2})/);
  if (!m) return "";
  const hh = Number(m[1]);
  const mm = String(m[2]);
  if (Number.isNaN(hh)) return "";
  const hour12 = ((hh + 11) % 12) + 1;
  const suffix = hh >= 12 ? "pm" : "am";
  return `${hour12}:${mm} ${suffix}`;
};

const formatDateTimeLabel = (dateIso?: string | null, time?: string | null) => {
  const dateLabel = formatShortDate(dateIso);
  const timeLabel = formatTimeLabel(time);
  if (dateLabel === "-" && !timeLabel) return "-";
  if (!timeLabel) return dateLabel;
  if (dateLabel === "-") return timeLabel;
  return `${dateLabel}; ${timeLabel}`;
};

const formatIsoDateTimeLabel = (value: string | null | undefined) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  const hh = d.getHours();
  const mm = String(d.getMinutes()).padStart(2, "0");
  const hour12 = ((hh + 11) % 12) + 1;
  const suffix = hh >= 12 ? "pm" : "am";
  return `${formatShortDate(value)}; ${hour12}:${mm} ${suffix}`;
};

const safeParseJsonObject = (value: string | null | undefined) => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object")
      return parsed as Record<string, any>;
    return null;
  } catch {
    return null;
  }
};

const formatQuantityLabel = (value: number) => {
  const n = Number(value || 0);
  if (Number.isNaN(n)) return "0";
  const abs = Math.abs(n);
  const maximumFractionDigits = abs >= 1 ? 2 : 3;
  return n.toLocaleString(undefined, { maximumFractionDigits });
};

const ingredientTypeLabel = (value: string | null | undefined) => {
  const v = String(value || "").toLowerCase();
  if (!v) return "Ingredient";
  if (v === "inventory_item") return "Raw Material";
  return v.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
};

const mapRowToCard = (row: ProductionCardRow): CatalogueProduct => {
  const statusRaw = String(row.status || "").toLowerCase();
  let status: ProductStatus = "scheduled_for_production";
  if (statusRaw === "ready") status = "ready";
  else if (statusRaw === "quality_control") status = "quality_control";
  else if (statusRaw === "in_preparation") status = "in_production";
  else if (statusRaw === "in_production") status = "in_production";

  const unitsCreated = Number(row.totalFinalQuantity || 0);
  const unitsRemaining = Math.max(
    0,
    Number(row.totalRequestedQuantity || 0) - unitsCreated,
  );

  return {
    id: row.productionId,
    productId: row.productId || null,
    name: row.productName || "Unknown Product",
    productCode: row.productCode || "-",
    batchCode: row.batchId || "-",
    category: row.category || "Product",
    logoUrl: row.logoUrl || null,
    producedOnValue: formatShortDate(row.productionDate),
    dueOnValue: formatShortDate(row.productionDueDate),
    createdByValue: row.initiator || row.productionStartedBy || "-",
    ingredientsCount: Number(row.ingredientsCount || 0),
    unitsCreated,
    unitsRemaining,
    status,
  };
};

const TraceabilityCatalogueProducts = ({
  outletId,
  dateRange,
  search,
}: TraceabilityCatalogueProductsProps): ReactElement => {
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [cards, setCards] = useState<CatalogueProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProductionId, setSelectedProductionId] = useState<
    string | null
  >(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedDetail, setSelectedDetail] =
    useState<ProductionDetailRow | null>(null);
  const [productionTraces, setProductionTraces] = useState<
    ProductionV2TraceRow[]
  >([]);
  const [isLoadingTraces, setIsLoadingTraces] = useState(false);
  const [traceActorNameById, setTraceActorNameById] = useState<
    Record<string, string>
  >({});
  const [isLoadingIngredients, setIsLoadingIngredients] = useState(false);
  const [ingredientDeductions, setIngredientDeductions] = useState<
    IngredientDeduction[]
  >([]);
  const [ingredientLotById, setIngredientLotById] = useState<
    Record<string, ItemLotRow>
  >({});
  const [ingredientItemsPerPage, setIngredientItemsPerPage] = useState(10);
  const [ingredientCurrentPage, setIngredientCurrentPage] = useState(1);
  const [customerSales, setCustomerSales] = useState<CustomerSaleRow[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [customersItemsPerPage, setCustomersItemsPerPage] = useState(10);
  const [customersCurrentPage, setCustomersCurrentPage] = useState(1);
  const [customersView, setCustomersView] = useState<"table" | "grid">("table");
  const [batchOptions, setBatchOptions] = useState<BatchOption[]>([]);
  const [activeTab, setActiveTab] = useState<TraceTab>("timeline");

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalCount / itemsPerPage));
  }, [itemsPerPage, totalCount]);

  const activeSearch = useMemo(() => {
    const rawQuery = String(search?.searchQuery || "").trim();
    if (!rawQuery) return null;
    const searchType = String(search?.searchType || "product_or_batch");
    const qLower = rawQuery.toLowerCase();
    return {
      searchType,
      rawQuery,
      qLower,
      like: `%${qLower}%`,
      isUuid: isUuidLike(rawQuery),
    };
  }, [search?.searchQuery, search?.searchType]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    outletId,
    dateRange?.from,
    dateRange?.to,
    selectedProductId,
    activeSearch?.searchType,
    activeSearch?.rawQuery,
  ]);

  const fetchRows = useCallback(async () => {
    const api = getElectronAPI();
    if (!api?.dbQuery) {
      setCards([]);
      setTotalCount(0);
      return;
    }

    setIsLoading(true);
    try {
      const where: string[] = [];
      const params: any[] = [];

      if (outletId) {
        where.push("p.outletId = ?");
        params.push(outletId);
      }

      const dr = toDateRangeSql(dateRange);
      if (dr) {
        where.push(
          "p.productionDate IS NOT NULL AND p.productionDate >= ? AND p.productionDate <= ?",
        );
        params.push(dr.fromIso, dr.toIso);
      }

      if (selectedProductId) {
        where.push(
          "EXISTS (SELECT 1 FROM production_v2_items pi2 WHERE pi2.productionId = p.id AND pi2.productId = ?)",
        );
        params.push(selectedProductId);
      }

      if (activeSearch) {
        const type = activeSearch.searchType;

        if (type === "customer") {
          where.push(`
            EXISTS (
              SELECT 1
              FROM production_v2_deliveries dS
              JOIN production_v2_lots lS ON lS.id = dS.lotId
              JOIN orders oS ON oS.id = dS.orderId
              LEFT JOIN cart ctS ON ctS.id = oS.cartId
              LEFT JOIN customers cS ON cS.id = COALESCE(oS.customerId, ctS.customerId)
              WHERE lS.productionId = p.id
                AND (
                  LOWER(COALESCE(cS.name, '')) LIKE ?
                  OR LOWER(COALESCE(cS.email, '')) LIKE ?
                  OR LOWER(COALESCE(oS.recipientName, '')) LIKE ?
                )
            )
          `);
          params.push(activeSearch.like, activeSearch.like, activeSearch.like);
        } else if (type === "order") {
          const orderOrParts: string[] = [
            "LOWER(COALESCE(oS.id, '')) LIKE ?",
            "LOWER(COALESCE(oS.reference, '')) LIKE ?",
            "LOWER(COALESCE(oS.externalReference, '')) LIKE ?",
            "LOWER(COALESCE(oS.paymentReference, '')) LIKE ?",
            "LOWER(COALESCE(oS.recipientName, '')) LIKE ?",
          ];

          if (activeSearch.isUuid) {
            orderOrParts.push("oS.id = ?");
          }

          where.push(`
            EXISTS (
              SELECT 1
              FROM production_v2_deliveries dS
              JOIN production_v2_lots lS ON lS.id = dS.lotId
              JOIN orders oS ON oS.id = dS.orderId
              WHERE lS.productionId = p.id
                AND (${orderOrParts.join(" OR ")})
            )
          `);
          params.push(
            activeSearch.like,
            activeSearch.like,
            activeSearch.like,
            activeSearch.like,
            activeSearch.like,
          );
          if (activeSearch.isUuid) params.push(activeSearch.rawQuery);
        } else {
          const productOrParts: string[] = [
            "LOWER(COALESCE(p.batchId, '')) LIKE ?",
            `
              EXISTS (
                SELECT 1
                FROM production_v2_items piS
                LEFT JOIN product prS ON prS.id = piS.productId
                WHERE piS.productionId = p.id
                  AND (
                    LOWER(COALESCE(prS.name, '')) LIKE ?
                    OR LOWER(COALESCE(prS.productCode, '')) LIKE ?
                  )
              )
            `,
            `
              EXISTS (
                SELECT 1
                FROM production_v2_lots lS
                WHERE lS.productionId = p.id
                  AND LOWER(COALESCE(lS.lotNumber, '')) LIKE ?
              )
            `,
          ];

          if (activeSearch.isUuid) {
            productOrParts.push("p.id = ?");
          }

          where.push(`(${productOrParts.join(" OR ")})`);
          params.push(
            activeSearch.like,
            activeSearch.like,
            activeSearch.like,
            activeSearch.like,
          );
          if (activeSearch.isUuid) params.push(activeSearch.rawQuery);
        }
      }

      const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

      const countRows = await api.dbQuery(
        `
          SELECT COUNT(*) as count
          FROM productions_v2 p
          ${whereClause}
        `,
        params,
      );
      const count = Number(countRows?.[0]?.count || 0);
      setTotalCount(count);

      const totalPagesLocal = Math.max(1, Math.ceil(count / itemsPerPage));
      const safePage = Math.min(Math.max(1, currentPage), totalPagesLocal);
      if (safePage !== currentPage) {
        setCurrentPage(safePage);
        return;
      }

      const offset = (safePage - 1) * itemsPerPage;
      const rows: ProductionCardRow[] =
        (await api.dbQuery(
          `
            SELECT
              p.id as productionId,
              p.status as status,
              p.batchId as batchId,
              p.productionDate as productionDate,
              p.productionDueDate as productionDueDate,
              p.initiator as initiator,
              p.productionStartedBy as productionStartedBy,
              p.outletId as outletId,
              pi.productId as productId,
              pr.name as productName,
              pr.productCode as productCode,
            pr.logoUrl as logoUrl,
              pr.category as category,
              COALESCE(pi.ingredientsCount, 0) as ingredientsCount,
              COALESCE(pi.totalRequestedQuantity, 0) as totalRequestedQuantity,
              COALESCE(pi.totalFinalQuantity, 0) as totalFinalQuantity
            FROM productions_v2 p
            LEFT JOIN (
              SELECT
                productionId,
                MIN(productId) as productId,
                COUNT(*) as ingredientsCount,
                SUM(COALESCE(requestedQuantity, 0)) as totalRequestedQuantity,
                SUM(COALESCE(finalQuantity, 0)) as totalFinalQuantity
              FROM production_v2_items
              GROUP BY productionId
            ) pi ON pi.productionId = p.id
            LEFT JOIN product pr ON pr.id = pi.productId
            ${whereClause}
            ORDER BY COALESCE(p.updatedAt, p.createdAt) DESC
            LIMIT ? OFFSET ?
          `,
          [...params, itemsPerPage, offset],
        )) || [];

      setCards(rows.map(mapRowToCard));
    } catch {
      setCards([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [
    activeSearch,
    currentPage,
    dateRange,
    itemsPerPage,
    outletId,
    selectedProductId,
  ]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const showEmptyState = !isLoading && totalCount === 0;
  const showDetail = Boolean(selectedProductionId);

  const searchTitle = useMemo(() => {
    if (!activeSearch) return "Showing All Products in your catalogue";
    const label =
      activeSearch.searchType === "customer"
        ? "Customer"
        : activeSearch.searchType === "order"
          ? "Order"
          : "Product or Batch";
    return `Showing results for ${label}: ${activeSearch.rawQuery}`;
  }, [activeSearch]);

  const closeDetail = () => {
    setSelectedProductionId(null);
    setSelectedProductId(null);
    setSelectedCategory("");
    setSelectedDetail(null);
    setProductionTraces([]);
    setIsLoadingTraces(false);
    setTraceActorNameById({});
    setIsLoadingIngredients(false);
    setIngredientDeductions([]);
    setIngredientLotById({});
    setIngredientItemsPerPage(10);
    setIngredientCurrentPage(1);
    setCustomerSales([]);
    setIsLoadingCustomers(false);
    setCustomersItemsPerPage(10);
    setCustomersCurrentPage(1);
    setCustomersView("table");
    setBatchOptions([]);
    setActiveTab("timeline");
  };

  const openDetail = (product: CatalogueProduct) => {
    setSelectedProductionId(product.id);
    setSelectedProductId(product.productId || null);
    setSelectedCategory(product.category);
    setActiveTab("timeline");
  };

  const fetchSelectedDetail = useCallback(async () => {
    const api = getElectronAPI();
    if (!api?.dbQuery || !selectedProductionId) {
      setSelectedDetail(null);
      return;
    }

    const where: string[] = ["p.id = ?"];
    const params: any[] = [selectedProductionId];
    if (outletId) {
      where.push("p.outletId = ?");
      params.push(outletId);
    }

    const rows: ProductionDetailRow[] =
      (await api.dbQuery(
        `
          SELECT
            p.id as productionId,
            p.batchId as batchId,
            p.status as status,
            p.productionDate as productionDate,
            p.productionTime as productionTime,
            p.createdAt as createdAt,
            p.preparationStartedAt as preparationStartedAt,
            p.qcStartedAt as qcStartedAt,
            p.readyAt as readyAt,
            p.initiator as initiator,
            p.productionStartedBy as productionStartedBy,
            pi.productId as productId,
            pr.name as productName,
            pr.productCode as productCode,
            pr.logoUrl as logoUrl,
            pr.category as category,
            agg.totalRequestedQuantity as totalRequestedQuantity,
            agg.totalFinalQuantity as totalFinalQuantity,
            CASE
              WHEN agg.totalRequestedQuantity IS NULL OR agg.totalFinalQuantity IS NULL THEN NULL
              WHEN agg.totalRequestedQuantity - agg.totalFinalQuantity < 0 THEN 0
              ELSE agg.totalRequestedQuantity - agg.totalFinalQuantity
            END as totalUnitsRemaining
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
          WHERE ${where.join(" AND ")}
          LIMIT 1
        `,
        params,
      )) || [];

    setSelectedDetail(rows?.[0] ?? null);
  }, [outletId, selectedProductionId]);

  useEffect(() => {
    fetchSelectedDetail().catch(() => {
      setSelectedDetail(null);
    });
  }, [fetchSelectedDetail]);

  const fetchProductionTraces = useCallback(async () => {
    const api = getElectronAPI();
    if (!api?.dbQuery || !selectedProductionId) {
      setProductionTraces([]);
      return;
    }

    setIsLoadingTraces(true);
    try {
      const rows: ProductionV2TraceRow[] =
        (await api.dbQuery(
          `
            SELECT
              id,
              event,
              fromStatus,
              toStatus,
              actorId,
              metadata,
              createdAt,
              productionId
            FROM production_v2_traces
            WHERE productionId = ?
            ORDER BY createdAt ASC
          `,
          [selectedProductionId],
        )) || [];

      setProductionTraces(rows);
    } catch {
      setProductionTraces([]);
    } finally {
      setIsLoadingTraces(false);
    }
  }, [selectedProductionId]);

  useEffect(() => {
    fetchProductionTraces().catch(() => {
      setProductionTraces([]);
    });
  }, [fetchProductionTraces]);

  useEffect(() => {
    const api = getElectronAPI();
    if (!api?.dbQuery || !selectedProductionId) {
      setTraceActorNameById({});
      return;
    }

    let cancelled = false;

    const run = async () => {
      const rawIds = [
        ...(productionTraces || []).map((t) =>
          t.actorId != null ? String(t.actorId) : "",
        ),
        ...(customerSales || []).map((s) =>
          s.processedBy ? s.processedBy : "",
        ),
      ]
        .filter(Boolean)
        .filter((id) => id !== "current-user")
        .filter((id) => isUuidLike(id));

      const uniqueIds = Array.from(new Set(rawIds));
      if (uniqueIds.length === 0) {
        setTraceActorNameById({});
        return;
      }

      try {
        const placeholders = uniqueIds.map(() => "?").join(", ");
        const rows: any[] =
          (await api.dbQuery(
            `
              SELECT id, fullName
              FROM users
              WHERE id IN (${placeholders})
            `,
            uniqueIds,
          )) || [];

        const mapping: Record<string, string> = {};
        for (const r of rows) {
          const id = r?.id != null ? String(r.id) : "";
          if (!id) continue;
          const fullName = r?.fullName != null ? String(r.fullName) : "";
          if (fullName) mapping[id] = fullName;
        }

        if (!cancelled) setTraceActorNameById(mapping);
      } catch {
        if (!cancelled) setTraceActorNameById({});
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [customerSales, productionTraces, selectedProductionId]);

  useEffect(() => {
    setIngredientCurrentPage(1);
  }, [selectedProductionId, ingredientItemsPerPage]);

  useEffect(() => {
    setCustomersCurrentPage(1);
  }, [selectedProductionId, customersItemsPerPage]);

  useEffect(() => {
    const api = getElectronAPI();
    if (!api?.dbQuery || !selectedProductionId) {
      setIngredientDeductions([]);
      setIngredientLotById({});
      setIsLoadingIngredients(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setIsLoadingIngredients(true);
      try {
        const items: IngredientDeduction[] = [];

        for (const t of productionTraces || []) {
          const event = String(t.event || "").toLowerCase();
          if (event !== "approval_log_approved") continue;

          const meta = safeParseJsonObject(t.metadata);
          const deductions = Array.isArray(meta?.deductions)
            ? meta?.deductions
            : [];

          for (const d of deductions) {
            const lotId = d?.lotId != null ? String(d.lotId) : "";
            const itemName = d?.itemName != null ? String(d.itemName) : "";
            const quantityValue =
              d?.quantity != null && !Number.isNaN(Number(d.quantity))
                ? Number(d.quantity)
                : 0;
            if (!lotId || !itemName) continue;

            items.push({
              lotId,
              itemName,
              quantity: quantityValue,
              lotNumber: d?.lotNumber != null ? String(d.lotNumber) : null,
              ingredientType:
                d?.ingredientType != null ? String(d.ingredientType) : null,
            });
          }
        }

        const byKey = new Map<string, IngredientDeduction>();
        for (const it of items) {
          const key = `${it.lotId}||${it.itemName}||${it.ingredientType || ""}`;
          const prev = byKey.get(key);
          if (!prev) byKey.set(key, { ...it });
          else
            byKey.set(key, {
              ...prev,
              quantity: Number(prev.quantity || 0) + Number(it.quantity || 0),
            });
        }

        const aggregated = Array.from(byKey.values()).sort((a, b) =>
          a.itemName.localeCompare(b.itemName),
        );

        if (!cancelled) setIngredientDeductions(aggregated);

        const lotIds = Array.from(
          new Set(aggregated.map((d) => d.lotId).filter(Boolean)),
        );
        if (lotIds.length === 0) {
          if (!cancelled) setIngredientLotById({});
          return;
        }

        const placeholders = lotIds.map(() => "?").join(", ");
        const lotRows: any[] =
          (await api.dbQuery(
            `
              SELECT
                id,
                lotNumber,
                supplierName,
                expiryDate,
                createdAt
              FROM item_lot
              WHERE id IN (${placeholders})
            `,
            lotIds,
          )) || [];

        const map: Record<string, ItemLotRow> = {};
        for (const r of lotRows) {
          const id = r?.id != null ? String(r.id) : "";
          if (!id) continue;
          map[id] = {
            id,
            lotNumber: r?.lotNumber != null ? String(r.lotNumber) : "-",
            supplierName:
              r?.supplierName != null ? String(r.supplierName) : null,
            expiryDate: r?.expiryDate != null ? String(r.expiryDate) : null,
            createdAt: r?.createdAt != null ? String(r.createdAt) : null,
          };
        }

        if (!cancelled) setIngredientLotById(map);
      } catch {
        if (!cancelled) {
          setIngredientDeductions([]);
          setIngredientLotById({});
        }
      } finally {
        if (!cancelled) setIsLoadingIngredients(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [productionTraces, selectedProductionId]);

  const fetchCustomerSales = useCallback(async () => {
    const api = getElectronAPI();
    if (!api?.dbQuery || !selectedProductionId) {
      setCustomerSales([]);
      return;
    }

    const productId = selectedDetail?.productId || selectedProductId || null;

    setIsLoadingCustomers(true);
    try {
      const runQuery = async (sql: string, params: any[]) => {
        const result = await api.dbQuery(sql, params);
        return (result || []) as any[];
      };

      const buildJoinSql = () => {
        const whereParts = ["l.productionId = ?"];
        const params: any[] = [selectedProductionId];

        if (productId) {
          whereParts.push("d.productId = ?");
          params.push(productId);
        }

        return {
          sql: `
          SELECT
            o.id as orderId,
            COALESCE(o.recipientName, c.name) as customerName,
            c.email as customerEmail,
            MAX(COALESCE(d.deliveredAt, d.createdAt, o.createdAt)) as soldAt,
            o.initiator as processedBy,
            SUM(COALESCE(CAST(d.quantityDelivered as REAL), 0)) as quantitySold
          FROM production_v2_deliveries d
          JOIN production_v2_lots l ON l.id = d.lotId
          JOIN orders o ON o.id = d.orderId
          LEFT JOIN cart ct ON ct.id = o.cartId
          LEFT JOIN customers c ON c.id = COALESCE(o.customerId, ct.customerId)
          WHERE ${whereParts.join(" AND ")}
          GROUP BY o.id, customerName, c.email, o.initiator
          HAVING quantitySold > 0
          ORDER BY soldAt DESC
        `,
          params,
        };
      };

      const q = buildJoinSql();
      const rows = await runQuery(q.sql, q.params);

      setCustomerSales(
        (rows || []).map((r) => {
          const orderId = r?.orderId != null ? String(r.orderId) : null;
          const customerName =
            r?.customerName != null ? String(r.customerName) : "";
          const customerEmail =
            r?.customerEmail != null ? String(r.customerEmail) : "";
          const soldAt = r?.soldAt != null ? String(r.soldAt) : null;
          const processedBy =
            r?.processedBy != null ? String(r.processedBy) : "";
          const quantitySold =
            r?.quantitySold != null && !Number.isNaN(Number(r.quantitySold))
              ? Number(r.quantitySold)
              : 0;

          return {
            key: orderId || `${soldAt || ""}-${customerName || ""}`,
            customerName: customerName || "-",
            customerEmail: customerEmail || "-",
            soldAt,
            quantitySold,
            processedBy: processedBy || "-",
            orderId,
          };
        }),
      );
    } catch {
      setCustomerSales([]);
    } finally {
      setIsLoadingCustomers(false);
    }
  }, [selectedDetail?.productId, selectedProductionId, selectedProductId]);

  useEffect(() => {
    if (activeTab !== "customers") return;
    fetchCustomerSales().catch(() => setCustomerSales([]));
  }, [activeTab, fetchCustomerSales]);

  const fetchBatchOptions = useCallback(async () => {
    const api = getElectronAPI();
    if (!api?.dbQuery || !selectedProductId) {
      setBatchOptions([]);
      return;
    }

    const where: string[] = [];
    const params: any[] = [];

    if (outletId) {
      where.push("p.outletId = ?");
      params.push(outletId);
    }

    const dr = toDateRangeSql(dateRange);
    if (dr) {
      where.push(
        "p.productionDate IS NOT NULL AND p.productionDate >= ? AND p.productionDate <= ?",
      );
      params.push(dr.fromIso, dr.toIso);
    }

    where.push(
      "EXISTS (SELECT 1 FROM production_v2_items pi2 WHERE pi2.productionId = p.id AND pi2.productId = ?)",
    );
    params.push(selectedProductId);

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const rows: { id: string; batchId: string | null }[] =
      (await api.dbQuery(
        `
          SELECT p.id as id, p.batchId as batchId
          FROM productions_v2 p
          ${whereClause}
          ORDER BY COALESCE(p.updatedAt, p.createdAt) DESC
          LIMIT 200
        `,
        params,
      )) || [];

    setBatchOptions(
      rows.map((r) => ({
        id: r.id,
        label: r.batchId ? String(r.batchId) : String(r.id),
      })),
    );
  }, [dateRange, outletId, selectedProductId]);

  useEffect(() => {
    fetchBatchOptions().catch(() => {
      setBatchOptions([]);
    });
  }, [fetchBatchOptions]);

  const timelineItems = useMemo((): TimelineItem[] => {
    const productName = selectedDetail?.productName || "Unknown Product";
    const unitsValue =
      selectedDetail?.totalFinalQuantity ??
      selectedDetail?.totalRequestedQuantity;
    const unitsPrefix =
      unitsValue != null
        ? `${Number(unitsValue).toLocaleString()} units of ${productName}`
        : productName;

    return (productionTraces || [])
      .map((t) => {
        const event = String(t.event || "").toLowerCase();
        const toStatus = String(t.toStatus || "").toLowerCase();
        const initiatedByValue =
          selectedDetail?.initiator ||
          selectedDetail?.productionStartedBy ||
          "-";
        const rawActorId = t.actorId != null ? String(t.actorId) : "";
        const actor = (() => {
          if (!rawActorId) return initiatedByValue;
          if (rawActorId === "current-user") return initiatedByValue;
          if (isUuidLike(rawActorId))
            return traceActorNameById[rawActorId] || rawActorId;
          return rawActorId;
        })();
        const timeLabel = formatIsoDateTimeLabel(t.createdAt);

        if (event === "status_change" && toStatus === "order_selected") {
          return {
            title: "Scheduled for Production",
            subtitle: `${unitsPrefix} initiated by ${actor}`,
            timeLabel,
          };
        }

        if (
          event === "approval_log_approved" ||
          toStatus === "inventory_approved"
        ) {
          return {
            title: "Inventory Approved",
            subtitle: `${unitsPrefix} inventory approved by ${actor}`,
            timeLabel,
          };
        }

        if (event === "preparation_started" || toStatus === "in_preparation") {
          return {
            title: "Production Started",
            subtitle: `${unitsPrefix} initiated by ${actor}`,
            timeLabel,
          };
        }

        if (event === "qc_approval" || toStatus === "quality_control") {
          return {
            title: "Moved to Quality Control",
            subtitle: `${unitsPrefix} moved to QC by ${actor}`,
            timeLabel,
          };
        }

        if (event === "ready" || toStatus === "ready") {
          return {
            title: "Marked as Ready",
            subtitle: `${unitsPrefix} marked as ready by ${actor}`,
            timeLabel,
          };
        }

        return null;
      })
      .filter(Boolean) as TimelineItem[];
  }, [productionTraces, selectedDetail, traceActorNameById]);

  const ingredientTotalPages = useMemo(() => {
    return Math.max(
      1,
      Math.ceil(ingredientDeductions.length / ingredientItemsPerPage),
    );
  }, [ingredientDeductions.length, ingredientItemsPerPage]);

  useEffect(() => {
    if (ingredientCurrentPage > ingredientTotalPages) {
      setIngredientCurrentPage(ingredientTotalPages);
    }
  }, [ingredientCurrentPage, ingredientTotalPages]);

  const ingredientsNode = useMemo(() => {
    if (isLoadingTraces || isLoadingIngredients) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`sk-${i}`}
                className="animate-pulse rounded-[16px] border border-[#E5E7EB] bg-white shadow-sm"
              >
                <div className="p-5">
                  <div className="h-6 w-2/3 rounded bg-[#F3F4F6]" />
                  <div className="mt-2 h-4 w-1/3 rounded bg-[#F3F4F6]" />
                  <div className="mt-5 space-y-3">
                    <div className="h-4 w-3/4 rounded bg-[#F3F4F6]" />
                    <div className="h-4 w-2/3 rounded bg-[#F3F4F6]" />
                    <div className="h-4 w-2/3 rounded bg-[#F3F4F6]" />
                  </div>
                </div>
                <div className="border-t border-[#F3F4F6] px-5 py-4">
                  <div className="h-4 w-1/2 rounded bg-[#F3F4F6]" />
                </div>
              </div>
            ))}
          </div>
          <div className="animate-pulse rounded-[12px] border border-[#E5E7EB] bg-white p-4">
            <div className="h-5 w-1/3 rounded bg-[#F3F4F6]" />
          </div>
        </div>
      );
    }

    if (ingredientDeductions.length === 0) {
      return (
        <div className="text-[13px] text-[#6B7280]">No ingredients found</div>
      );
    }

    const start = (ingredientCurrentPage - 1) * ingredientItemsPerPage;
    const pageItems = ingredientDeductions.slice(
      start,
      start + ingredientItemsPerPage,
    );

    return (
      <div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {pageItems.map((it) => {
            const lot = ingredientLotById[it.lotId];
            const lotNumber = lot?.lotNumber || it.lotNumber || "-";
            const supplierName = lot?.supplierName || "-";
            const receivedLabel = lot?.createdAt
              ? formatIsoDateTimeLabel(lot.createdAt)
              : "-";
            const expiryIso = lot?.expiryDate || null;
            const expiryLabel = expiryIso
              ? formatIsoDateTimeLabel(expiryIso)
              : "-";
            const isExpired =
              expiryIso != null && !Number.isNaN(new Date(expiryIso).getTime())
                ? new Date(expiryIso).getTime() < Date.now()
                : false;
            const typeLabel = ingredientTypeLabel(it.ingredientType);

            return (
              <div
                key={`${it.lotId}-${it.itemName}-${it.ingredientType || ""}`}
                className="rounded-[16px] border border-[#E5E7EB] bg-white shadow-sm"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="truncate text-[20px] font-semibold text-[#111827]">
                        {it.itemName}
                      </div>
                      <div className="mt-1 text-[14px] text-[#6B7280]">
                        {lotNumber !== "-" ? `LOT-${lotNumber}` : "-"}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <span className="inline-flex items-center rounded-full bg-[#FFF7ED] px-3 py-1 text-[12px] font-medium text-[#F97316]">
                        {typeLabel}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 text-[14px]">
                    <div className="flex items-center gap-3 text-[#6B7280]">
                      <Truck className="h-4 w-4 text-[#9CA3AF]" />
                      <span className="truncate">{supplierName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[#6B7280]">
                      <Calendar className="h-4 w-4 text-[#9CA3AF]" />
                      <span className="truncate">
                        Received on {receivedLabel}
                      </span>
                    </div>
                    <div
                      className={[
                        "flex items-center gap-3",
                        isExpired ? "text-[#EF4444]" : "text-[#F97316]",
                      ].join(" ")}
                    >
                      <Calendar
                        className={[
                          "h-4 w-4",
                          isExpired ? "text-[#EF4444]" : "text-[#F97316]",
                        ].join(" ")}
                      />
                      <span className="truncate">
                        {isExpired ? "Expired" : "Expires"} on {expiryLabel}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t border-[#F3F4F6] px-5 py-4 text-[14px] text-[#6B7280]">
                  <Package className="h-4 w-4 text-[#9CA3AF]" />
                  <span className="truncate">
                    Quantity Used:{" "}
                    <span className="font-medium text-[#111827]">
                      {formatQuantityLabel(it.quantity)}
                    </span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <Pagination
          currentPage={ingredientCurrentPage}
          totalPages={ingredientTotalPages}
          onPageChange={setIngredientCurrentPage}
          itemsPerPage={ingredientItemsPerPage}
          onItemsPerPageChange={(nextItemsPerPage: number) => {
            setIngredientItemsPerPage(nextItemsPerPage);
            setIngredientCurrentPage(1);
          }}
          totalItems={ingredientDeductions.length}
          className="mt-6 rounded-[12px] border border-[#E5E7EB] bg-white"
        />
      </div>
    );
  }, [
    ingredientCurrentPage,
    ingredientDeductions,
    ingredientItemsPerPage,
    ingredientLotById,
    ingredientTotalPages,
    isLoadingIngredients,
    isLoadingTraces,
  ]);

  const customersTotalPages = useMemo(() => {
    return Math.max(1, Math.ceil(customerSales.length / customersItemsPerPage));
  }, [customerSales.length, customersItemsPerPage]);

  useEffect(() => {
    if (customersCurrentPage > customersTotalPages) {
      setCustomersCurrentPage(customersTotalPages);
    }
  }, [customersCurrentPage, customersTotalPages]);

  const customersNode = useMemo(() => {
    if (isLoadingTraces || isLoadingCustomers) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div className="h-6 w-40 rounded bg-[#F3F4F6] animate-pulse" />
            <div className="flex items-center gap-2">
              <div className="h-10 w-[110px] rounded-[10px] bg-[#F3F4F6] animate-pulse" />
              <div className="h-10 w-[96px] rounded-[10px] bg-[#F3F4F6] animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`csk-${i}`}
                className="animate-pulse rounded-[16px] border border-[#E5E7EB] bg-white shadow-sm"
              >
                <div className="p-5">
                  <div className="h-6 w-2/3 rounded bg-[#F3F4F6]" />
                  <div className="mt-5 space-y-3">
                    <div className="h-4 w-3/4 rounded bg-[#F3F4F6]" />
                    <div className="h-4 w-2/3 rounded bg-[#F3F4F6]" />
                    <div className="h-4 w-2/3 rounded bg-[#F3F4F6]" />
                  </div>
                  <div className="mt-6 h-10 w-full rounded-full bg-[#F3F4F6]" />
                </div>
              </div>
            ))}
          </div>
          <div className="animate-pulse rounded-[12px] border border-[#E5E7EB] bg-white p-4">
            <div className="h-5 w-1/3 rounded bg-[#F3F4F6]" />
          </div>
        </div>
      );
    }

    if (customerSales.length === 0) {
      return (
        <div className="text-[13px] text-[#6B7280]">No customers found</div>
      );
    }

    const initiatedByValue =
      selectedDetail?.initiator || selectedDetail?.productionStartedBy || "-";

    const start = (customersCurrentPage - 1) * customersItemsPerPage;
    const pageItems = customerSales.slice(start, start + customersItemsPerPage);

    const resolveActorLabel = (raw: string) => {
      const rawId = String(raw || "");
      if (!rawId) return initiatedByValue;
      if (rawId === "current-user") return initiatedByValue;
      if (isUuidLike(rawId)) return traceActorNameById[rawId] || rawId;
      return rawId;
    };

    return (
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[16px] font-semibold text-[#111827]">
            All customers
          </div>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <button
              type="button"
              className="h-[40px] rounded-[10px] bg-[#15BA5C] px-4 text-[14px] font-semibold text-white hover:bg-[#119E4D] transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <Upload className="h-4 w-4 text-white" />
              Export
            </button>
            <div className="rounded-[10px] border border-[#E5E7EB] bg-white p-1 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCustomersView("table")}
                className={[
                  "h-9 w-10 rounded-[8px] flex items-center justify-center transition-colors cursor-pointer",
                  customersView === "table"
                    ? "bg-[#F3F4F6] text-[#111827]"
                    : "text-[#6B7280] hover:bg-[#F9FAFB]",
                ].join(" ")}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setCustomersView("grid")}
                className={[
                  "h-9 w-10 rounded-[8px] flex items-center justify-center transition-colors cursor-pointer",
                  customersView === "grid"
                    ? "bg-[#F3F4F6] text-[#111827]"
                    : "text-[#6B7280] hover:bg-[#F9FAFB]",
                ].join(" ")}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {customersView === "table" ? (
          <div className="mt-4 overflow-x-auto rounded-[14px] border border-[#E5E7EB] bg-white">
            <table className="min-w-[860px] w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-[#F9FAFB]">
                  {[
                    "Customer Name",
                    "Email",
                    "Time Stamp",
                    "Quantity Sold",
                    "Processed by",
                    "Action",
                  ].map((label) => (
                    <th
                      key={label}
                      className="px-5 py-4 text-left text-[12px] font-semibold text-[#6B7280] border-b border-[#F3F4F6]"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((row) => (
                  <tr key={row.key} className="bg-white">
                    <td className="px-5 py-4 text-[14px] font-semibold text-[#111827] border-b border-[#F3F4F6]">
                      {row.customerName}
                    </td>
                    <td className="px-5 py-4 text-[14px] text-[#111827] border-b border-[#F3F4F6]">
                      {row.customerEmail}
                    </td>
                    <td className="px-5 py-4 text-[14px] text-[#111827] border-b border-[#F3F4F6]">
                      {formatIsoDateTimeLabel(row.soldAt)}
                    </td>
                    <td className="px-5 py-4 text-[14px] font-semibold text-[#111827] border-b border-[#F3F4F6]">
                      {`${formatQuantityLabel(row.quantitySold)} units`}
                    </td>
                    <td className="px-5 py-4 text-[14px] font-semibold text-[#111827] border-b border-[#F3F4F6]">
                      {resolveActorLabel(row.processedBy)}
                    </td>
                    <td className="px-5 py-4 border-b border-[#F3F4F6]">
                      <button
                        type="button"
                        className="h-9 rounded-full border border-[#15BA5C] px-4 text-[13px] font-semibold text-[#15BA5C] hover:bg-[#15BA5C]/5 transition-colors cursor-pointer"
                      >
                        View Order
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {pageItems.map((row) => (
              <div
                key={row.key}
                className="rounded-[16px] border border-[#E5E7EB] bg-white shadow-sm overflow-hidden"
              >
                <div className="p-5">
                  <div className="text-[18px] font-semibold text-[#111827] truncate">
                    {row.customerName}
                  </div>
                  <div className="mt-4 space-y-3 text-[14px] text-[#6B7280]">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-[#9CA3AF]" />
                      <span className="truncate">
                        Sold on {formatIsoDateTimeLabel(row.soldAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Package className="h-4 w-4 text-[#9CA3AF]" />
                      <span className="truncate">
                        Quantity sold: {formatQuantityLabel(row.quantitySold)}{" "}
                        units
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-[#9CA3AF]" />
                      <span className="truncate">
                        Processed by: {resolveActorLabel(row.processedBy)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="px-5 pb-5">
                  <button
                    type="button"
                    className="w-full h-10 rounded-full border border-[#15BA5C] text-[14px] font-semibold text-[#15BA5C] hover:bg-[#15BA5C]/5 transition-colors cursor-pointer"
                  >
                    View Order
                  </button>
                </div>
                <div className="h-2 bg-[#15BA5C]" />
              </div>
            ))}
          </div>
        )}

        <Pagination
          currentPage={customersCurrentPage}
          totalPages={customersTotalPages}
          onPageChange={setCustomersCurrentPage}
          itemsPerPage={customersItemsPerPage}
          onItemsPerPageChange={(nextItemsPerPage: number) => {
            setCustomersItemsPerPage(nextItemsPerPage);
            setCustomersCurrentPage(1);
          }}
          totalItems={customerSales.length}
          className="mt-6 rounded-[12px] border border-[#E5E7EB] bg-white"
        />
      </div>
    );
  }, [
    customerSales,
    customersCurrentPage,
    customersItemsPerPage,
    customersTotalPages,
    customersView,
    isLoadingCustomers,
    isLoadingTraces,
    selectedDetail?.initiator,
    selectedDetail?.productionStartedBy,
    traceActorNameById,
  ]);

  return (
    <div className="w-full">
      {showDetail ? (
        <TraceabilityCatalogueProductResults
          title={`Showing results for ${
            selectedCategory ||
            selectedDetail?.category ||
            selectedDetail?.productName ||
            "Product"
          }`}
          onBack={closeDetail}
          selectedProductionId={selectedProductionId}
          batchOptions={batchOptions}
          onSelectProductionId={setSelectedProductionId}
          showEmptyState={showEmptyState}
          cards={cards}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={totalCount}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          creationDateTime={formatDateTimeLabel(
            selectedDetail?.productionDate || null,
            selectedDetail?.productionTime || null,
          )}
          initiatedBy={
            selectedDetail?.initiator ||
            selectedDetail?.productionStartedBy ||
            "-"
          }
          totalUnitsCreated={
            selectedDetail?.totalFinalQuantity != null
              ? `${Number(selectedDetail.totalFinalQuantity).toLocaleString()} Units`
              : "-"
          }
          totalUnitsRemaining={
            selectedDetail?.totalUnitsRemaining != null
              ? `${Number(selectedDetail.totalUnitsRemaining).toLocaleString()} Units`
              : "-"
          }
          activeTab={activeTab}
          onTabChange={setActiveTab}
          timeline={timelineItems}
          ingredients={ingredientsNode}
          customers={customersNode}
        />
      ) : showEmptyState ? (
        <TraceabilityEmptyState />
      ) : (
        <>
          <h2 className="my-6 text-[18px] font-semibold text-[#111827] sm:text-[20px]">
            {searchTitle}
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => openDetail(product)}
              />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(nextItemsPerPage: number) => {
              setItemsPerPage(nextItemsPerPage);
              setCurrentPage(1);
            }}
            totalItems={totalCount}
            className="mt-6 rounded-[12px] border border-[#E5E7EB] bg-white"
          />
        </>
      )}
    </div>
  );
};

export default TraceabilityCatalogueProducts;
