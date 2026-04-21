import { Wallet } from "lucide-react";
import React, { useMemo } from "react";
import useBusinessStore from "@/stores/useBusinessStore";
import { formatPrice } from "@/utils/formatPrice";

type AnyRow = Record<string, any>;

type ServiceChargeCardProps = {
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

const getServiceCharge = (row: AnyRow) => {
  const candidates = [
    row.serviceCharge,
    row.service_charge,
    row.totalServiceCharge,
    row.total_service_charge,
  ];

  for (const c of candidates) {
    const v = toNumber(c);
    if (v !== 0) return v;
  }

  return 0;
};

const ServiceChargeCard = ({ orders }: ServiceChargeCardProps) => {
  const { selectedOutlet } = useBusinessStore();

  const totals = useMemo(() => {
    const serviceCharge = orders.reduce(
      (sum, row) => sum + getServiceCharge(row),
      0,
    );

    const paidOrders = orders.filter(isPaidOrder);
    const revenueOrders = paidOrders.length > 0 ? paidOrders : orders;

    const sales = revenueOrders.reduce((sum, row) => sum + getOrderTotal(row), 0);

    return { serviceCharge, sales };
  }, [orders]);

  const amountLabel = useMemo(() => {
    return formatPrice({
      amount: totals.serviceCharge || 0,
      currencyCode: selectedOutlet?.currency || "NGN",
    });
  }, [selectedOutlet?.currency, totals.serviceCharge]);

  const percentLabel = useMemo(() => {
    const pct =
      totals.sales > 0
        ? Math.round((totals.serviceCharge / totals.sales) * 1000) / 10
        : 0;
    return `${pct}%`;
  }, [totals.sales, totals.serviceCharge]);

  return (
    <section className="bg-[#FFFFFF] p-6 rounded-[14px]">
      <div className="flex flex-col gap-[12px] mb-2.5">
        <h3 className="text-[#1C1B20] text-[20px] font-bold">
          Total Service Charge
        </h3>
        <p className="text-[#737373] text-[14px] font-normal">
          This section details the service charges collected from customers
          during the selected period.
        </p>
      </div>
      <div className="flex items-center gap-6">
        <div className="p-4 bg-yellow-50 rounded-xl">
          <Wallet className="w-6 h-6 text-yellow-500" />
        </div>

        <div className="flex items-center gap-6">
          <p className="text-3xl font-semibold text-gray-900">{amountLabel}</p>
          <div className="h-10 w-px bg-gray-200" />
          <p className="text-2xl font-medium text-gray-900">{percentLabel}</p>
        </div>
      </div>
    </section>
  );
};

export default ServiceChargeCard;
