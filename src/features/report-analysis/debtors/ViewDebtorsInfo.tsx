import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { Pagination } from "@/shared/Pagination/pagination";
import { useBusinessStore } from "@/stores/useBusinessStore";
import { formatPrice } from "@/utils/formatPrice";

type AnyRow = Record<string, any>;

type ViewDebtorsInfoProps = {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
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
    row.total,
    row.amount,
    row.totalAmount,
    row.grandTotal,
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

const getOrderCreatedAt = (row: AnyRow) => {
  const candidates = [
    row.createdAt,
    row.created_at,
    row.createdOn,
    row.created_on,
  ];
  for (const c of candidates) {
    if (!c) continue;
    const d = new Date(c);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
};

const formatDateTime = (d: Date | null) => {
  if (!d) return "-";
  const date = d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${date}\n${time}`;
};

const getChannelLabel = (row: AnyRow) => {
  const v = String(
    row.orderChannel ?? row.channel ?? row.order_channel ?? "",
  ).trim();
  if (!v) return "-";
  return v;
};

const Pill = ({
  label,
  tone,
}: {
  label: string;
  tone: "green" | "purple" | "blue" | "orange" | "red" | "gray";
}) => {
  const cls =
    tone === "green"
      ? "bg-[#E9FBF0] text-[#15BA5C]"
      : tone === "purple"
        ? "bg-[#F3E8FF] text-[#7C3AED]"
        : tone === "blue"
          ? "bg-[#E0F2FE] text-[#0284C7]"
          : tone === "orange"
            ? "bg-[#FFF7ED] text-[#F97316]"
            : tone === "red"
              ? "bg-[#FEE2E2] text-[#EF4444]"
              : "bg-[#F3F4F6] text-[#6B7280]";
  return (
    <span
      className={`inline-flex items-center rounded-[10px] px-3 py-1 text-[12px] font-medium ${cls}`}
    >
      {label}
    </span>
  );
};

const channelTone = (channel: string) => {
  const c = normalizeText(channel);
  if (c.includes("whatsapp")) return "green" as const;
  if (c.includes("pre")) return "purple" as const;
  if (c.includes("email")) return "blue" as const;
  if (c.includes("website")) return "orange" as const;
  return "gray" as const;
};

const paymentTone = (row: AnyRow) => {
  const paymentStatus = normalizeText(
    row.paymentStatus ?? row.payment_status ?? row.payment_state,
  );
  if (paymentStatus.includes("partial")) return "orange" as const;
  if (paymentStatus.includes("unpaid") || paymentStatus.includes("pending"))
    return "red" as const;
  if (paymentStatus.includes("verified") || paymentStatus.includes("paid"))
    return "green" as const;
  return "gray" as const;
};

const ViewDebtorsInfo = ({
  isOpen,
  onClose,
  customerName,
  orders,
}: ViewDebtorsInfoProps) => {
  const { selectedOutlet } = useBusinessStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const totalPages = useMemo(() => {
    const totalItems = Array.isArray(orders) ? orders.length : 0;
    return Math.max(1, Math.ceil(totalItems / Math.max(1, itemsPerPage)));
  }, [orders, itemsPerPage]);

  const visibleOrders = useMemo(() => {
    const safe = Array.isArray(orders) ? orders : [];
    const start = (Math.max(1, currentPage) - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return safe.slice(start, end);
  }, [orders, currentPage, itemsPerPage]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-170 bg-black/40 backdrop-blur-sm flex justify-end">
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />
      <div className="relative z-10 w-[70%] h-full bg-white shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
        <div className="px-6 pt-6 pb-4 flex items-start justify-between border-b border-[#E5E7EB]">
          <div>
            <div className="text-[22px] font-bold text-[#111827]">
              {customerName || "Customer"}
            </div>
            <div className="mt-2 text-[14px] text-[#6B7280]">
              All Orders with Passed due Payments
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
            aria-label="Close"
            title="Close"
          >
            <X className="h-5 w-5 text-gray-700" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="w-full">
            <table className="w-full">
              <thead className="bg-[#F9FAFB]">
                <tr className="text-left text-[12px] font-medium text-[#6B7280]">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Order Value</th>
                  <th className="px-6 py-4">Channel</th>
                  <th className="px-6 py-4">Order Create Date</th>
                  <th className="px-6 py-4">Order Status</th>
                  <th className="px-6 py-4">Payment Status</th>
                  <th className="px-6 py-4">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-10 text-center text-[14px] text-[#6B7280]"
                    >
                      No orders found
                    </td>
                  </tr>
                ) : (
                  visibleOrders.map((row, idx) => {
                    const id = String(
                      row?.reference ?? row?.id ?? `ORD-${idx + 1}`,
                    );
                    const channel = getChannelLabel(row);
                    const createdAt = getOrderCreatedAt(row);
                    const orderStatus = String(row?.status ?? "-");
                    const paymentStatus = String(
                      row?.paymentStatus ?? row?.payment_status ?? "-",
                    );
                    const dueDate = createdAt;

                    return (
                      <tr
                        key={`${id}-${idx}`}
                        className="border-t border-[#F3F4F6]"
                      >
                        <td className="px-6 py-4 text-[14px] font-medium text-[#15BA5C]">
                          {id}
                        </td>
                        <td className="px-6 py-4 text-[14px] text-[#111827]">
                          {formatPrice({
                            amount: getOrderTotal(row) || 0,
                            currencyCode: selectedOutlet?.currency || "USD",
                          })}
                        </td>
                        <td className="px-6 py-4 text-[14px] text-[#111827]">
                          {channel === "-" ? (
                            "-"
                          ) : (
                            <Pill label={channel} tone={channelTone(channel)} />
                          )}
                        </td>
                        <td className="px-6 py-4 text-[14px] text-[#111827] whitespace-pre-line">
                          {formatDateTime(createdAt)}
                        </td>
                        <td className="px-6 py-4 text-[14px] text-[#111827]">
                          <Pill label={orderStatus || "-"} tone="gray" />
                        </td>
                        <td className="px-6 py-4 text-[14px] text-[#111827]">
                          <Pill
                            label={paymentStatus || "-"}
                            tone={paymentTone(row)}
                          />
                        </td>
                        <td className="px-6 py-4 text-[14px] text-[#111827] whitespace-pre-line">
                          {formatDateTime(dueDate)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination
          currentPage={Math.min(currentPage, totalPages)}
          totalPages={totalPages}
          onPageChange={(p) =>
            setCurrentPage(Math.max(1, Math.min(totalPages, p)))
          }
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(next) => {
            setItemsPerPage(next);
            setCurrentPage(1);
          }}
          totalItems={Array.isArray(orders) ? orders.length : 0}
        />
      </div>
    </div>
  );
};

export default ViewDebtorsInfo;
