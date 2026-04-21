import { useMemo } from "react";
import PieChartBlock from "./PieChartBlock";
import Legend from "./Legend";
import StatsTable from "./StatsTable";
import { formatPrice } from "@/utils/formatPrice";
import useBusinessStore from "@/stores/useBusinessStore";

type AnyRow = Record<string, any>;

type SalesByChannelProps = {
  orders: AnyRow[];
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
  const status = normalizeText(row.status ?? row.orderStatus ?? row.order_status);
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

const normalizeChannelKey = (raw: unknown) => {
  const s = normalizeText(raw);
  if (s.includes("pre")) return "Preorder";
  if (s.includes("whats")) return "WhatsApp";
  if (s.includes("email")) return "Email";
  if (s.includes("online") || s.includes("storefront") || s.includes("web"))
    return "Online";
  if (
    s.includes("in-store") ||
    s.includes("instore") ||
    s.includes("pos") ||
    s.includes("store")
  )
    return "In-Store";
  return "In-Store";
};

const SalesByChannel = ({ orders }: SalesByChannelProps) => {
  const { selectedOutlet } = useBusinessStore();

  const stats = useMemo(() => {
    const orderCountByChannel: Record<string, number> = {};
    const revenueByChannel: Record<string, number> = {};

    const paidOrders = orders.filter(isPaidOrder);
    const revenueOrders = paidOrders.length > 0 ? paidOrders : orders;

    for (const row of orders) {
      const channel = normalizeChannelKey(
        row.channel ??
          row.orderChannel ??
          row.order_channel ??
          row.source ??
          row.platform,
      );
      orderCountByChannel[channel] = (orderCountByChannel[channel] ?? 0) + 1;
    }

    for (const row of revenueOrders) {
      const channel = normalizeChannelKey(
        row.channel ??
          row.orderChannel ??
          row.order_channel ??
          row.source ??
          row.platform,
      );
      revenueByChannel[channel] =
        (revenueByChannel[channel] ?? 0) + getOrderTotal(row);
    }

    return { orderCountByChannel, revenueByChannel };
  }, [orders]);

  const pieData = useMemo(
    () => [
      {
        name: "Pre Order",
        value: stats.orderCountByChannel.Preorder || 0,
        color: "#4B4B4B",
      },
      {
        name: "Storefront",
        value: stats.orderCountByChannel.Online || 0,
        color: "#7DA7FF",
      },
      {
        name: "WhatsApp",
        value: stats.orderCountByChannel.WhatsApp || 0,
        color: "#1DB954",
      },
      {
        name: "In-store POS",
        value: stats.orderCountByChannel["In-Store"] || 0,
        color: "#FFA94D",
      },
      {
        name: "Email",
        value: stats.orderCountByChannel.Email || 0,
        color: "#C9B000",
      },
    ],
    [stats.orderCountByChannel],
  );

  const tableData = useMemo(
    () => [
      {
        channel: "In-Store POS",
        orders: stats.orderCountByChannel["In-Store"] || 0,
        revenue: formatPrice({
          amount: stats.revenueByChannel["In-Store"] || 0,
          currencyCode: selectedOutlet?.currency || "USD",
        }),
      },
      {
        channel: "Pre Order",
        orders: stats.orderCountByChannel.Preorder || 0,
        revenue: formatPrice({
          amount: stats.revenueByChannel.Preorder || 0,
          currencyCode: selectedOutlet?.currency || "USD",
        }),
      },
      {
        channel: "WhatsApp",
        orders: stats.orderCountByChannel.WhatsApp || 0,
        revenue: formatPrice({
          amount: stats.revenueByChannel.WhatsApp || 0,
          currencyCode: selectedOutlet?.currency || "USD",
        }),
      },
      {
        channel: "Storefront",
        orders: stats.orderCountByChannel.Online || 0,
        revenue: formatPrice({
          amount: stats.revenueByChannel.Online || 0,
          currencyCode: selectedOutlet?.currency || "USD",
        }),
      },
      {
        channel: "Email",
        orders: stats.orderCountByChannel.Email || 0,
        revenue: formatPrice({
          amount: stats.revenueByChannel.Email || 0,
          currencyCode: selectedOutlet?.currency || "USD",
        }),
      },
    ],
    [selectedOutlet?.currency, stats.orderCountByChannel, stats.revenueByChannel],
  );
  return (
    <section className="bg-[#FFFFFF] p-6 rounded-[14px]">
      <div className="flex flex-col gap-[12px] mb-2.5">
        <h3 className="text-[#1C1B20] text-[20px] font-bold">
          Sales by Channel
        </h3>
        <p className="text-[#737373] text-[14px] font-normal">
          Here are the Reported sales for each channel where you received orders
        </p>
      </div>
      <div className="space-y-6">
        <PieChartBlock data={pieData} />
        <Legend items={pieData} />

        <StatsTable
          columns={[
            { label: "Channel", key: "channel" },
            { label: "Total Orders", key: "orders" },
            { label: "Total Revenue", key: "revenue" },
          ]}
          data={tableData}
        />
      </div>
    </section>
  );
};

export default SalesByChannel;
