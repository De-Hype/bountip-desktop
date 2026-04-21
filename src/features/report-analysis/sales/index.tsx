import { useEffect, useMemo, useState } from "react";
import SalesByChannel from "./SalesByChannel";
import SalesByPaymentTermCard from "./SalesByPaymentTermCard";
import TotalTaxesCard from "./TotalTaxesCard";
import ServiceChargeCard from "./ServiceChargeCard";
import type { DateRange } from "react-day-picker";

type AnyRow = Record<string, any>;

type SalesPerformanceProps = {
  outletId?: string;
  dateRange?: DateRange;
};

type PaymentTermRow = { id: string; name: string };

const normalizeText = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

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

const SalesPerformance = ({ outletId, dateRange }: SalesPerformanceProps) => {
  const [orders, setOrders] = useState<AnyRow[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTermRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const api = (window as any)?.electronAPI;
      if (!api?.dbQuery) {
        if (!cancelled) setOrders([]);
        return;
      }

      let rows: AnyRow[] = [];

      try {
        if (outletId && String(outletId).trim() !== "") {
          rows = (await api.dbQuery(
            `
              SELECT
                o.*,
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
                pt.name as paymentTermName
              FROM orders o
              LEFT JOIN customers c ON c.id = o.customerId
              LEFT JOIN payment_terms pt ON pt.id = c.paymentTermId
            `,
            [],
          )) as AnyRow[];
        }
      } catch {
        rows = [];
      }

      let terms: PaymentTermRow[] = [];
      try {
        if (outletId && String(outletId).trim() !== "") {
          terms = (await api.dbQuery(
            `
              SELECT id, name
              FROM payment_terms
              WHERE outletId = ? AND deletedAt IS NULL
            `,
            [outletId],
          )) as PaymentTermRow[];
        } else {
          terms = (await api.dbQuery(
            `
              SELECT id, name
              FROM payment_terms
              WHERE deletedAt IS NULL
            `,
            [],
          )) as PaymentTermRow[];
        }
      } catch {
        terms = [];
      }

      const safeRows = Array.isArray(rows) ? rows : [];
      const filtered = safeRows
        .filter((row) => isWithinRange(getRowDate(row), dateRange))
        .filter((row) => !normalizeText(row?.status).includes("draft"));

      if (!cancelled) {
        setOrders(filtered);
        setPaymentTerms(Array.isArray(terms) ? terms : []);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [
    outletId,
    dateRange?.from ? dateRange.from.getTime() : 0,
    dateRange?.to ? dateRange.to.getTime() : 0,
  ]);

  const stableOrders = useMemo(() => orders, [orders]);
  const stablePaymentTerms = useMemo(() => paymentTerms, [paymentTerms]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mx-8 mt-5">
      <SalesByChannel orders={stableOrders} />
      <SalesByPaymentTermCard
        orders={stableOrders}
        paymentTerms={stablePaymentTerms}
      />
      <TotalTaxesCard orders={stableOrders} />
      <ServiceChargeCard orders={stableOrders} />
    </div>
  );
};

export default SalesPerformance;
