"use client";

import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useBusinessStore } from "@/stores/useBusinessStore";
import useToastStore from "@/stores/toastStore";
import ReportDropdown, {
  type ReportDropdownOption,
} from "@/features/report-analysis/ReportDropdown";
import CalendarModal from "@/features/report-analysis/CalendarModal";
import type { DateRange } from "react-day-picker";
import ReportsAnalysisAssets from "@/assets/images/reports-analysis";
import { formatPrice } from "@/utils/formatPrice";
import ReportsStatsCards from "@/features/report-analysis/ReportsStatsCards";
import SalesPerformance from "@/features/report-analysis/sales";
import * as XLSX from "xlsx";
import ReportTraceability from "@/features/report-analysis/traceability";
import DebtorsTab from "@/features/report-analysis/debtors";

type AnyRow = Record<string, any>;

const formatRangeLabel = (range: DateRange | undefined) => {
  if (!range?.from) return "Select date range";
  const fromLabel = format(range.from, "MMM d, yyyy");
  const toLabel = range.to ? format(range.to, "MMM d, yyyy") : fromLabel;
  return `${fromLabel} - ${toLabel} | 12:00 AM - 11:59 PM`;
};

const normalizeText = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

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

  if (merged.includes("verified")) return true;
  if (merged.includes("paid")) return true;
  if (merged.includes("completed")) return true;
  if (merged.includes("success")) return true;

  const explicitIsPaid = row.isPaid ?? row.is_paid;
  if (typeof explicitIsPaid === "boolean") return explicitIsPaid;
  if (explicitIsPaid === 1) return true;
  if (explicitIsPaid === 0) return false;

  return false;
};

const isUnpaidOrder = (row: AnyRow) => {
  const paymentStatus = normalizeText(
    row.paymentStatus ?? row.payment_status ?? row.payment_state,
  );
  const status = normalizeText(
    row.status ?? row.orderStatus ?? row.order_status,
  );
  const merged = `${paymentStatus} ${status}`.trim();

  if (merged.includes("draft")) return false;
  if (merged.includes("cancel")) return false;
  if (merged.includes("refunded")) return false;

  if (merged.includes("unpaid")) return true;
  if (merged.includes("not paid")) return true;
  if (merged.includes("pending")) return true;

  return !isPaidOrder(row);
};

const ReportAnalysisPage = () => {
  const { outlets, selectedOutlet } = useBusinessStore();
  const { showToast } = useToastStore();

  const reportOptions = useMemo<ReportDropdownOption[]>(
    () => [
      { label: "Sales Performances", value: "all_sales" },
      { label: "Traceability", value: "traceability" },
      { label: "Debtors", value: "debtors" },
      { label: "Inventory", value: "inventory" },
      { label: "Production", value: "production" },
    ],
    [],
  );

  const locationOptions = useMemo<ReportDropdownOption[]>(() => {
    return [
      { label: "All Locations", value: "all" },
      ...(outlets || [])
        .filter((o) => {
          if (String(o.id || "").trim() === "") return false;
          if ((o as any)?.isDeleted === 1) return false;
          if (Boolean((o as any)?.isDeleted)) return false;
          if (String((o as any)?.deletedAt || "").trim() !== "") return false;
          return true;
        })
        .map((o) => ({
          label: String(o.name || "").trim() || "Unnamed Location",
          value: String(o.id),
        })),
    ];
  }, [outlets]);

  const [reportType, setReportType] =
    useState<ReportDropdownOption["value"]>("all_sales");
  const [location, setLocation] = useState<string>("all");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isExporting, setIsExporting] = useState(false);

  const [data, setData] = useState<{
    totalSales: number;
    totalOrders: number;
    totalUnpaidOrders: number;
    totalPaidOrders: number;
  }>({
    totalSales: 0,
    totalOrders: 0,
    totalUnpaidOrders: 0,
    totalPaidOrders: 0,
  });

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const api = (window as any)?.electronAPI;
      if (!api?.dbQuery) {
        if (!cancelled) {
          setData({
            totalSales: 0,
            totalOrders: 0,
            totalUnpaidOrders: 0,
            totalPaidOrders: 0,
          });
        }
        return;
      }

      let rows: AnyRow[] = [];

      try {
        if (location !== "all" && String(location).trim() !== "") {
          rows = (await api.dbQuery("SELECT * FROM orders WHERE outletId = ?", [
            location,
          ])) as AnyRow[];
        } else {
          rows = (await api.dbQuery("SELECT * FROM orders", [])) as AnyRow[];
        }
      } catch {
        try {
          rows = (await api.dbQuery("SELECT * FROM orders", [])) as AnyRow[];
        } catch {
          rows = [];
        }
      }

      const safeRows = Array.isArray(rows) ? rows : [];

      const filtered = safeRows.filter((row) => {
        const rowDate = getRowDate(row);
        return isWithinRange(rowDate, dateRange);
      });

      const nonDraft = filtered.filter(
        (row) => !normalizeText(row?.status).includes("draft"),
      );

      const paidOrders = nonDraft.filter(isPaidOrder);
      const unpaidOrders = nonDraft.filter(isUnpaidOrder);

      const paidSales = paidOrders.reduce(
        (sum, row) => sum + getOrderTotal(row),
        0,
      );
      const fallbackSales = nonDraft.reduce(
        (sum, row) => sum + getOrderTotal(row),
        0,
      );

      const next = {
        totalSales: paidSales > 0 ? paidSales : fallbackSales,
        totalOrders: nonDraft.length,
        totalUnpaidOrders: unpaidOrders.length,
        totalPaidOrders: paidOrders.length,
      };

      if (!cancelled) setData(next);
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [
    location,
    dateRange?.from ? dateRange.from.getTime() : 0,
    dateRange?.to ? dateRange.to.getTime() : 0,
  ]);

  const reportsStats = useMemo(
    () => [
      {
        label: "Total Sales",
        value: formatPrice({
          amount: data?.totalSales || 0,
          currencyCode: selectedOutlet?.currency || "USD",
        }),
        bgColor: "#15BA5C0D",
        iconColor: "#15BA5C1A",
        image: ReportsAnalysisAssets.MoneyIcon,
      },
      {
        label: "Total Orders",
        value: data?.totalOrders ? `${data.totalOrders}` : "0",
        bgColor: "#9747FF0D",
        iconColor: "#9747FF1A",
        image: ReportsAnalysisAssets.MoneyIconPurple,
      },
      {
        label: "Total Unpaid Orders",
        value: data?.totalUnpaidOrders ? `${data.totalUnpaidOrders}` : "0",
        bgColor: "#E336290D",
        iconColor: "#E336291A",
        image: ReportsAnalysisAssets.MoneyIconRed,
      },
      {
        label: "Total Paid Orders",
        value: data?.totalPaidOrders ? `${data.totalPaidOrders}` : "0",
        bgColor: "#15BA5C0D",
        iconColor: "#15BA5C1A",
        image: ReportsAnalysisAssets.MoneyIcon,
      },
    ],
    [data, selectedOutlet?.currency],
  );

  const handleExport = async () => {
    if (isExporting) return;

    const api = (window as any)?.electronAPI;
    if (!api?.dbQuery) {
      showToast("error", "Export failed", "Database API not available");
      return;
    }

    setIsExporting(true);
    try {
      const outletId = location !== "all" ? String(location) : undefined;

      let rows: AnyRow[] = [];
      try {
        if (outletId && outletId.trim() !== "") {
          rows = (await api.dbQuery(
            `
              SELECT
                o.*,
                c.name as customerName,
                pt.name as paymentTermName
              FROM orders o
              LEFT JOIN customers c ON c.id = o.customerId
              LEFT JOIN payment_terms pt ON pt.id = c.paymentTermId
              WHERE o.outletId = ?
            `,
            [outletId],
          )) as AnyRow[];
        } else {
          rows = (await api.dbQuery(
            `
              SELECT
                o.*,
                c.name as customerName,
                pt.name as paymentTermName
              FROM orders o
              LEFT JOIN customers c ON c.id = o.customerId
              LEFT JOIN payment_terms pt ON pt.id = c.paymentTermId
            `,
            [],
          )) as AnyRow[];
        }
      } catch {
        try {
          if (outletId && outletId.trim() !== "") {
            rows = (await api.dbQuery(
              "SELECT * FROM orders WHERE outletId = ?",
              [outletId],
            )) as AnyRow[];
          } else {
            rows = (await api.dbQuery("SELECT * FROM orders", [])) as AnyRow[];
          }
        } catch {
          rows = [];
        }
      }

      const safeRows = Array.isArray(rows) ? rows : [];
      const filtered = safeRows
        .filter((row) => isWithinRange(getRowDate(row), dateRange))
        .filter((row) => !normalizeText(row?.status).includes("draft"));

      if (filtered.length === 0) {
        showToast("warning", "No data", "No orders found for this filter");
        return;
      }

      const exportData = filtered.map((o) => ({
        "Order ID": String(o.id ?? ""),
        Customer: String(o.customerName ?? ""),
        "Payment Term": String(o.paymentTermName ?? ""),
        Status: String(o.status ?? ""),
        "Payment Status": String(o.paymentStatus ?? ""),
        "Payment Method": String(o.paymentMethod ?? ""),
        Channel: String(o.orderChannel ?? o.order_channel ?? o.orderMode ?? ""),
        Amount: toNumber(o.amount),
        Tax: toNumber(o.tax),
        "Service Charge": toNumber(o.serviceCharge),
        Discount: toNumber(o.discount),
        Total: toNumber(o.total),
        "Created At": String(o.createdAt ?? ""),
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

      let bookType: "xls" | "xlsx" = "xls";
      let excelBuffer: any;
      try {
        excelBuffer = XLSX.write(workbook, { bookType: "xls", type: "array" });
      } catch {
        bookType = "xlsx";
        excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      }

      const blob = new Blob([excelBuffer], {
        type:
          bookType === "xls"
            ? "application/vnd.ms-excel"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const outletName =
        location !== "all"
          ? String(
              outlets?.find((o) => String(o.id) === String(location))?.name ||
                "outlet",
            )
          : "all_locations";
      const safeOutletName = outletName
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

      link.download = `report_orders_${safeOutletName}_${start}_${end}.${bookType}`;
      link.click();
      window.URL.revokeObjectURL(url);

      showToast(
        "success",
        "Export complete",
        `Exported ${filtered.length} orders`,
      );
    } catch {
      showToast("error", "Export failed", "Could not export orders");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <main className="py-4 sm:py-6">
      <section className="bg-white p-4 sm:p-6 flex flex-col gap-[15px]">
        <div className="flex flex-col md:flex-row gap-4">
          <ReportDropdown
            value={reportType}
            onChange={setReportType}
            options={reportOptions}
            placeholder="Sales Performance"
            className="w-full md:w-[320px]"
          />

          <ReportDropdown
            value={location}
            onChange={setLocation}
            options={locationOptions}
            placeholder="All Locations"
            className="w-full md:w-[320px]"
          />

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

        {reportType === "all_sales" && (
          <ReportsStatsCards reportsStats={reportsStats} />
        )}
      </section>
      <section className="">
        {reportType === "all_sales" ? (
          <SalesPerformance
            outletId={location !== "all" ? location : undefined}
            dateRange={dateRange}
          />
        ) : reportType === "traceability" ? (
          <ReportTraceability
            outletId={location !== "all" ? location : undefined}
            dateRange={dateRange}
          />
        ) : reportType === "debtors" ? (
          <DebtorsTab
            outletId={location !== "all" ? location : undefined}
            dateRange={dateRange}
          />
        ) : reportType === "inventory" ? (
          <></>
        ) : reportType === "production" ? (
          <></>
        ) : (
          <></>
        )}
      </section>

      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        value={dateRange}
        onConfirm={(next) => setDateRange(next)}
      />
    </main>
  );
};

export default ReportAnalysisPage;
