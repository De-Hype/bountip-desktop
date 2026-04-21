import { useMemo, useState } from "react";
import Legend from "./Legend";
import PieChartBlock from "./PieChartBlock";
import StatsTable from "./StatsTable";
import useBusinessStore from "@/stores/useBusinessStore";
import { formatPrice } from "@/utils/formatPrice";
import { ArrowRight } from "lucide-react";

type AnyRow = Record<string, any>;

type SalesByPaymentTermCardProps = {
  orders: AnyRow[];
  paymentTerms: { id: string; name: string }[];
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

const normalizePaymentTermName = (raw: unknown) => {
  const name = String(raw ?? "").trim();
  if (name) return name;
  return "Default Term";
};

export default function SalesByPaymentTermCard({
  orders,
  paymentTerms,
}: SalesByPaymentTermCardProps) {
  const { selectedOutlet } = useBusinessStore();
  const [showAllTerms, setShowAllTerms] = useState(false);
  const stats = useMemo(() => {
    const orderCountByTerm: Record<string, number> = {};
    const revenueByTerm: Record<string, number> = {};

    const paidOrders = orders.filter(isPaidOrder);
    const revenueOrders = paidOrders.length > 0 ? paidOrders : orders;

    const baseTerms = (Array.isArray(paymentTerms) ? paymentTerms : [])
      .map((t) => String(t?.name ?? "").trim())
      .filter((n) => n !== "");

    for (const name of baseTerms) {
      orderCountByTerm[name] = 0;
      revenueByTerm[name] = 0;
    }

    for (const row of orders) {
      const term = normalizePaymentTermName(
        row.paymentTermName ??
          row.paymentTerm ??
          row.payment_term ??
          row.customerPaymentTerm ??
          row.customer_payment_term,
      );
      orderCountByTerm[term] = (orderCountByTerm[term] ?? 0) + 1;
    }

    for (const row of revenueOrders) {
      const term = normalizePaymentTermName(
        row.paymentTermName ??
          row.paymentTerm ??
          row.payment_term ??
          row.customerPaymentTerm ??
          row.customer_payment_term,
      );
      revenueByTerm[term] = (revenueByTerm[term] ?? 0) + getOrderTotal(row);
    }

    return { orderCountByTerm, revenueByTerm };
  }, [orders, paymentTerms]);

  const termRows = useMemo(() => {
    const keys = Object.keys(stats.orderCountByTerm || {});
    const mapped = keys.map((name) => ({
      name,
      orders: stats.orderCountByTerm[name] || 0,
      revenue: stats.revenueByTerm[name] || 0,
    }));

    mapped.sort((a, b) => {
      if (b.orders !== a.orders) return b.orders - a.orders;
      return b.revenue - a.revenue;
    });

    return mapped;
  }, [stats.orderCountByTerm, stats.revenueByTerm]);

  const data = useMemo(() => {
    const palette = ["#1DB954", "#FFA94D", "#4B4B4B", "#7DA7FF", "#C9B000"];
    const top = termRows.slice(0, 5);
    const rest = termRows.slice(5);
    const others = rest.reduce((sum, r) => sum + (r.orders || 0), 0);

    const base = top.map((r, idx) => ({
      name: r.name,
      value: r.orders || 0,
      color: palette[idx % palette.length],
    }));

    if (others > 0) {
      base.push({ name: "Others", value: others, color: "#9CA3AF" });
    }

    return base;
  }, [termRows]);

  const tableData = useMemo(
    () =>
      termRows.map((row) => ({
        term: row.name,
        orders: row.orders,
        revenue: formatPrice({
          amount: row.revenue,
          currencyCode: selectedOutlet?.currency || "NGN",
        }),
      })),
    [selectedOutlet?.currency, termRows],
  );

  const visibleTableData = useMemo(() => {
    if (showAllTerms) return tableData;
    return tableData.slice(0, 5);
  }, [showAllTerms, tableData]);

  const canViewMore = tableData.length > 5 && !showAllTerms;

  return (
    <section className="bg-[#FFFFFF] p-6 rounded-[14px]">
      <div className="flex flex-col gap-[12px] mb-2.5">
        <h3 className="text-[#1C1B20] text-[20px] font-bold">
          Sales by Payment Term
        </h3>
        <p className="text-[#737373] text-[14px] font-normal">
          Here are the Reported sales by Payment Terms{" "}
        </p>
      </div>
      <div className="space-y-6">
        <PieChartBlock data={data} />
        <Legend items={data} />

        <StatsTable
          columns={[
            { label: "Payment Term", key: "term" },
            { label: "Total Orders", key: "orders" },
            { label: "Total Revenue", key: "revenue" },
          ]}
          data={visibleTableData}
        />
        {canViewMore ? (
          <button
            type="button"
            onClick={() => setShowAllTerms(true)}
            className="flex items-center justify-center gap-2.5 w-full text-center text-[14px] font-medium border-[#15BA5C] border rounded-[10px] p-[10px] text-[#1C1B20] hover:bg-[#F7F8FA] hover:text-[#15BA5C] cursor-pointer"
          >
            View More
            <ArrowRight size={16} className="mr-[5px]" />
          </button>
        ) : null}
      </div>
    </section>
  );
}
