import { Fragment, useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Search, SlidersHorizontal } from "lucide-react";
import { Pagination } from "@/shared/Pagination/pagination";
import ReportsStatsCards from "@/features/report-analysis/ReportsStatsCards";
import ReportsAnalysisAssets from "@/assets/images/reports-analysis";
import { formatPrice } from "@/utils/formatPrice";
import { useBusinessStore } from "@/stores/useBusinessStore";
import InventoryReportFilter, {
  type InventoryReportFilters,
} from "@/features/report-analysis/inventory/InventoryReportFilter";
import ViewInventoryReport from "@/features/report-analysis/inventory/ViewInventoryReport";

type InventoryTabsTypeProps = {
  outletId?: string;
  dateRange?: DateRange;
};

type InventoryReportRow = {
  key: string;
  inventoryItemId: string;
  itemName: string;
  unitOfMeasure: string;
  openingQty: number;
  openingAmount: number;
  usedQty: number;
  usedAmount: number;
  receivedQty: number;
  receivedAmount: number;
  expiredQty: number;
  expiredAmount: number;
  transferredQty: number;
  transferredAmount: number;
  closingQty: number;
  closingAmount: number;
};

type AnyRow = Record<string, any>;

const normalizeText = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const toNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const getRangeBounds = (range: DateRange | undefined) => {
  if (!range?.from) return null;
  const start = new Date(range.from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(range.to ?? range.from);
  end.setHours(23, 59, 59, 999);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
};

const resolveDisplayedUnit = (item: AnyRow) => {
  const keyRaw = String(item?.displayedUnitOfMeasure ?? "").trim();
  const key = keyRaw.toLowerCase().replace(/\s+/g, "");

  const unitOfPurchase = String(item?.unitOfPurchase ?? "").trim();
  const unitOfTransfer = String(item?.unitOfTransfer ?? "").trim();
  const unitOfConsumption = String(item?.unitOfConsumption ?? "").trim();

  if (key === "unitofpurchase") return unitOfPurchase || "-";
  if (key === "unitoftransfer") return unitOfTransfer || "-";
  if (key === "unitofconsumption") return unitOfConsumption || "-";

  return keyRaw || unitOfPurchase || unitOfTransfer || unitOfConsumption || "-";
};

const InventoryTab = ({ outletId, dateRange }: InventoryTabsTypeProps) => {
  const { selectedOutlet } = useBusinessStore();
  const effectiveOutletId = outletId ?? selectedOutlet?.id;
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<InventoryReportRow[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<InventoryReportFilters>({
    movement: "all",
    activityOnly: false,
    sortBy: "name_asc",
  });
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    inventoryItemId: string;
    itemName: string;
  } | null>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    itemsPerPage,
    filters.activityOnly,
    filters.movement,
    filters.sortBy,
    outletId,
    dateRange?.from ? dateRange.from.getTime() : 0,
    dateRange?.to ? dateRange.to.getTime() : 0,
  ]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const api = (window as any)?.electronAPI;
      if (!api?.dbQuery) {
        if (!cancelled) setRows([]);
        return;
      }

      const bounds = getRangeBounds(dateRange);
      setLoading(true);
      try {
        const itemWhere = effectiveOutletId
          ? "WHERE i.outletId = ? AND ii.isDeleted = 0"
          : "WHERE ii.isDeleted = 0";
        const itemParams = effectiveOutletId ? [effectiveOutletId] : [];

        const items = (await api.dbQuery(
          `
            SELECT
              ii.id as inventoryItemId,
              COALESCE(im.name, '') as itemName,
              COALESCE(im.displayedUnitOfMeasure, '') as displayedUnitOfMeasure,
              COALESCE(im.unitOfPurchase, '') as unitOfPurchase,
              COALESCE(im.unitOfTransfer, '') as unitOfTransfer,
              COALESCE(im.unitOfConsumption, '') as unitOfConsumption,
              COALESCE(ii.currentStockLevel, 0) as currentStockLevel,
              COALESCE(ii.costPrice, 0) as costPrice
            FROM inventory_item ii
            JOIN inventory i ON ii.inventoryId = i.id
            JOIN item_master im ON ii.itemMasterId = im.id
            ${itemWhere}
            ORDER BY itemName ASC
          `,
          itemParams,
        )) as AnyRow[];

        const invoiceWhere = effectiveOutletId
          ? "WHERE inv.outletId = ? AND inv.deletedAt IS NULL AND li.deletedAt IS NULL"
          : "WHERE inv.deletedAt IS NULL AND li.deletedAt IS NULL";
        const invoiceParamsBase = effectiveOutletId ? [effectiveOutletId] : [];

        const receivedAgg = bounds
          ? ((await api.dbQuery(
              `
                SELECT
                  li.inventoryItemId as inventoryItemId,
                  SUM(COALESCE(li.quantity, 0)) as receivedQty,
                  SUM(COALESCE(li.lineTotal, 0)) as receivedAmount
                FROM invoice_items li
                JOIN invoices inv ON inv.id = li.invoiceId
                ${invoiceWhere}
                  AND inv.createdAt >= ?
                  AND inv.createdAt <= ?
                GROUP BY li.inventoryItemId
              `,
              [...invoiceParamsBase, bounds.startIso, bounds.endIso],
            )) as AnyRow[])
          : ((await api.dbQuery(
              `
                SELECT
                  li.inventoryItemId as inventoryItemId,
                  SUM(COALESCE(li.quantity, 0)) as receivedQty,
                  SUM(COALESCE(li.lineTotal, 0)) as receivedAmount
                FROM invoice_items li
                JOIN invoices inv ON inv.id = li.invoiceId
                ${invoiceWhere}
                GROUP BY li.inventoryItemId
              `,
              invoiceParamsBase,
            )) as AnyRow[]);

        const receivedById = new Map<string, { qty: number; amount: number }>();
        (receivedAgg || []).forEach((r) => {
          const id = String(r?.inventoryItemId ?? "").trim();
          if (!id) return;
          receivedById.set(id, {
            qty: toNumber(r?.receivedQty),
            amount: toNumber(r?.receivedAmount),
          });
        });

        const mapped: InventoryReportRow[] = (items || []).map((it) => {
          const inventoryItemId = String(it?.inventoryItemId ?? "").trim();
          const itemName = String(it?.itemName ?? "Item");
          const unitOfMeasure = resolveDisplayedUnit(it);
          const closingQty = toNumber(it?.currentStockLevel);
          const unitCost = toNumber(it?.costPrice);

          const received = receivedById.get(inventoryItemId) || {
            qty: 0,
            amount: 0,
          };

          const usedQty = 0;
          const usedAmount = 0;
          const expiredQty = 0;
          const expiredAmount = 0;
          const transferredQty = 0;
          const transferredAmount = 0;

          const openingQty = Math.max(
            0,
            closingQty - received.qty + usedQty + expiredQty + transferredQty,
          );
          const openingAmount = openingQty * unitCost;
          const closingAmount = closingQty * unitCost;

          return {
            key: inventoryItemId || crypto.randomUUID(),
            inventoryItemId,
            itemName,
            unitOfMeasure,
            openingQty,
            openingAmount,
            usedQty,
            usedAmount,
            receivedQty: received.qty,
            receivedAmount: received.amount,
            expiredQty,
            expiredAmount,
            transferredQty,
            transferredAmount,
            closingQty,
            closingAmount,
          };
        });

        if (!cancelled) setRows(mapped);
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [dateRange, effectiveOutletId]);

  const filteredRows = useMemo(() => {
    let list = rows;

    const q = normalizeText(search);
    if (q) {
      list = list.filter((r) => normalizeText(r.itemName).includes(q));
    }

    if (filters.activityOnly) {
      list = list.filter(
        (r) =>
          (r.receivedQty || 0) > 0 ||
          (r.usedQty || 0) > 0 ||
          (r.expiredQty || 0) > 0 ||
          (r.transferredQty || 0) > 0,
      );
    }

    if (filters.movement !== "all") {
      const key =
        filters.movement === "received"
          ? "receivedQty"
          : filters.movement === "used"
            ? "usedQty"
            : filters.movement === "expired"
              ? "expiredQty"
              : "transferredQty";

      list = list.filter((r) => (r[key] || 0) > 0);
    }

    const sorted = [...list];
    switch (filters.sortBy) {
      case "name_desc":
        sorted.sort((a, b) => b.itemName.localeCompare(a.itemName));
        break;
      case "closing_qty_desc":
        sorted.sort((a, b) => (b.closingQty || 0) - (a.closingQty || 0));
        break;
      case "received_qty_desc":
        sorted.sort((a, b) => (b.receivedQty || 0) - (a.receivedQty || 0));
        break;
      case "name_asc":
      default:
        sorted.sort((a, b) => a.itemName.localeCompare(b.itemName));
        break;
    }

    return sorted;
  }, [filters.activityOnly, filters.movement, filters.sortBy, rows, search]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredRows.length / itemsPerPage));
  }, [filteredRows.length, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const visibleRows = useMemo(() => {
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    const start = (safePage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredRows.slice(start, end);
  }, [currentPage, filteredRows, itemsPerPage, totalPages]);

  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, r) => {
        acc.openingQty += r.openingQty;
        acc.openingAmount += r.openingAmount;
        acc.usedQty += r.usedQty;
        acc.usedAmount += r.usedAmount;
        acc.receivedQty += r.receivedQty;
        acc.receivedAmount += r.receivedAmount;
        acc.expiredQty += r.expiredQty;
        acc.expiredAmount += r.expiredAmount;
        acc.transferredQty += r.transferredQty;
        acc.transferredAmount += r.transferredAmount;
        acc.closingQty += r.closingQty;
        acc.closingAmount += r.closingAmount;
        return acc;
      },
      {
        openingQty: 0,
        openingAmount: 0,
        usedQty: 0,
        usedAmount: 0,
        receivedQty: 0,
        receivedAmount: 0,
        expiredQty: 0,
        expiredAmount: 0,
        transferredQty: 0,
        transferredAmount: 0,
        closingQty: 0,
        closingAmount: 0,
      },
    );
  }, [filteredRows]);

  const currencyCode = selectedOutlet?.currency || "USD";

  const reportsStats = useMemo(
    () => [
      {
        label: "Opening Balance",
        value: `${formatPrice({
          amount: totals.openingAmount || 0,
          currencyCode,
        })} | ${Math.round(totals.openingQty)}`,
        bgColor: "#E9FBF0",
        iconColor: "#15BA5C1A",
        image: ReportsAnalysisAssets.MoneyIcon,
      },
      {
        label: "Volume Used",
        value: `${formatPrice({
          amount: totals.usedAmount || 0,
          currencyCode,
        })} | ${Math.round(totals.usedQty)}`,
        bgColor: "#FEE2E20D",
        iconColor: "#EF44441A",
        image: ReportsAnalysisAssets.MoneyIconRed,
      },
      {
        label: "Volume Received",
        value: `${formatPrice({
          amount: totals.receivedAmount || 0,
          currencyCode,
        })} | ${Math.round(totals.receivedQty)}`,
        bgColor: "#E0EAFF0D",
        iconColor: "#1D4ED81A",
        image: ReportsAnalysisAssets.MoneyIcon,
      },
      {
        label: "Volume Wasted / Expired",
        value: `${formatPrice({
          amount: totals.expiredAmount || 0,
          currencyCode,
        })} | ${Math.round(totals.expiredQty)}`,
        bgColor: "#FEF3C70D",
        iconColor: "#B453091A",
        image: ReportsAnalysisAssets.MoneyIconRed,
      },
      {
        label: "Volume Transferred",
        value: `${formatPrice({
          amount: totals.transferredAmount || 0,
          currencyCode,
        })} | ${Math.round(totals.transferredQty)}`,
        bgColor: "#9747FF0D",
        iconColor: "#9747FF1A",
        image: ReportsAnalysisAssets.MoneyIconPurple,
      },
      {
        label: "Closing Balance",
        value: `${formatPrice({
          amount: totals.closingAmount || 0,
          currencyCode,
        })} | ${Math.round(totals.closingQty)}`,
        bgColor: "#E9FBF0",
        iconColor: "#15BA5C1A",
        image: ReportsAnalysisAssets.MoneyIcon,
      },
    ],
    [currencyCode, totals],
  );

  const StatsSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={`stats-sk-${i}`}
          className="p-6 px-3 rounded-xl bg-white border border-[#E5E7EB] animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded bg-gray-200" />
            <div className="h-6 w-40 rounded bg-gray-200" />
          </div>
          <div className="mt-4 h-4 w-32 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );

  const TableSkeleton = () => (
    <>
      {Array.from({ length: itemsPerPage }).map((_, i) => (
        <tr key={`sk-${i}`} className="animate-pulse">
          {Array.from({ length: 13 }).map((__, j) => (
            <td
              key={`sk-${i}-${j}`}
              className="px-6 py-4 border border-[#EEF2F7]"
            >
              <div className="h-4 w-full rounded bg-gray-200" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );

  const formatQty = (qty: number, unit: string) => {
    const n = Number.isFinite(qty) ? qty : 0;
    const rounded = Math.abs(n) >= 1000 ? Math.round(n) : Number(n.toFixed(2));
    return `${rounded}${unit ? ` ${unit}` : ""}`;
  };

  return (
    <section className="">
      <div className="space-y-6 p-4 sm:p-6">
        {loading ? (
          <StatsSkeleton />
        ) : (
          <ReportsStatsCards reportsStats={reportsStats} columns={3} />
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[18px] font-bold text-[#111827]">
            All Inventory
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center w-full sm:w-[320px] rounded-[10px] border border-[#E5E7EB] bg-white overflow-hidden">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="flex-1 h-10 px-3 text-[14px] text-[#111827] outline-none"
              />
              <button
                type="button"
                className="h-10 w-11 bg-[#15BA5C] flex items-center justify-center cursor-pointer"
              >
                <Search className="h-4 w-4 text-white" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-[10px] border border-[#E5E7EB] bg-white text-[14px] font-medium text-[#111827] hover:bg-[#F9FAFB] cursor-pointer"
            >
              <SlidersHorizontal className="h-4 w-4 text-[#6B7280]" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        <div className="rounded-[14px] border border-[#E5E7EB] bg-white overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1180px] border border-[#EEF2F7] border-collapse">
              <thead className="bg-[#F9FAFB]">
                <tr className="text-left text-[12px] font-medium text-[#6B7280]">
                  <th className="px-6 py-4 border border-[#EEF2F7]" rowSpan={2}>
                    Items
                  </th>
                  <th className="px-6 py-4 border border-[#EEF2F7]" colSpan={2}>
                    Opening Balance
                  </th>
                  <th className="px-6 py-4 border border-[#EEF2F7]" colSpan={2}>
                    Volume Used
                  </th>
                  <th className="px-6 py-4 border border-[#EEF2F7]" colSpan={2}>
                    Volume Received
                  </th>
                  <th className="px-6 py-4 border border-[#EEF2F7]" colSpan={2}>
                    Volume Expired
                  </th>
                  <th className="px-6 py-4 border border-[#EEF2F7]" colSpan={2}>
                    Volume Transferred
                  </th>
                  <th className="px-6 py-4 border border-[#EEF2F7]" colSpan={2}>
                    Closing Balance
                  </th>
                </tr>
                <tr className="text-left text-[12px] font-medium text-[#9CA3AF]">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Fragment key={`h-sub-${i}`}>
                      <th className="px-6 py-3 border border-[#EEF2F7]">Qty</th>
                      <th className="px-6 py-3 border border-[#EEF2F7]">
                        Amount
                      </th>
                    </Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton />
                ) : visibleRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={13}
                      className="px-6 py-12 text-center text-[14px] text-[#6B7280] border border-[#EEF2F7]"
                    >
                      No inventory records found.
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((r) => (
                    <tr key={r.key}>
                      <td className="px-6 py-4 text-[14px] font-medium text-[#15BA5C] border border-[#EEF2F7]">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedItem({
                              inventoryItemId: r.inventoryItemId,
                              itemName: r.itemName,
                            });
                            setIsViewOpen(true);
                          }}
                          className="cursor-pointer hover:underline"
                        >
                          {r.itemName}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#111827] border border-[#EEF2F7]">
                        {formatQty(r.openingQty, r.unitOfMeasure)}
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#111827] border border-[#EEF2F7]">
                        {formatPrice({
                          amount: r.openingAmount || 0,
                          currencyCode,
                        })}
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#111827] border border-[#EEF2F7]">
                        {formatQty(r.usedQty, r.unitOfMeasure)}
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#111827] border border-[#EEF2F7]">
                        {formatPrice({
                          amount: r.usedAmount || 0,
                          currencyCode,
                        })}
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#111827] border border-[#EEF2F7]">
                        {formatQty(r.receivedQty, r.unitOfMeasure)}
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#111827] border border-[#EEF2F7]">
                        {formatPrice({
                          amount: r.receivedAmount || 0,
                          currencyCode,
                        })}
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#111827] border border-[#EEF2F7]">
                        {formatQty(r.expiredQty, r.unitOfMeasure)}
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#111827] border border-[#EEF2F7]">
                        {formatPrice({
                          amount: r.expiredAmount || 0,
                          currencyCode,
                        })}
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#111827] border border-[#EEF2F7]">
                        {formatQty(r.transferredQty, r.unitOfMeasure)}
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#111827] border border-[#EEF2F7]">
                        {formatPrice({
                          amount: r.transferredAmount || 0,
                          currencyCode,
                        })}
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#111827] border border-[#EEF2F7]">
                        {formatQty(r.closingQty, r.unitOfMeasure)}
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#111827] border border-[#EEF2F7]">
                        {formatPrice({
                          amount: r.closingAmount || 0,
                          currencyCode,
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={Math.min(currentPage, totalPages)}
            totalPages={totalPages}
            onPageChange={(p) =>
              setCurrentPage(Math.max(1, Math.min(totalPages, p)))
            }
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(next) => setItemsPerPage(next)}
            totalItems={filteredRows.length}
          />
        </div>
      </div>

      <InventoryReportFilter
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        value={filters}
        onChange={setFilters}
      />

      <ViewInventoryReport
        isOpen={isViewOpen}
        onClose={() => {
          setIsViewOpen(false);
          setSelectedItem(null);
        }}
        inventoryItemId={selectedItem?.inventoryItemId ?? null}
        itemName={selectedItem?.itemName ?? ""}
      />
    </section>
  );
};

export default InventoryTab;
