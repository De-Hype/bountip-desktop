import StatsTable from "./StatsTable";
import { useMemo } from "react";
import useBusinessStore from "@/stores/useBusinessStore";
import { formatPrice } from "@/utils/formatPrice";

type AnyRow = Record<string, any>;

type TotalTaxesCardProps = {
  orders: AnyRow[];
};

const toNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const getOrderTaxTotal = (row: AnyRow) => {
  const candidates = [
    row.taxAmount,
    row.tax_amount,
    row.totalTax,
    row.total_tax,
    row.tax,
    row.vatAmount,
    row.vat_amount,
    row.vat,
  ];

  let total = 0;
  for (const c of candidates) total += toNumber(c);
  return total;
};

export default function TotalTaxesCard({ orders }: TotalTaxesCardProps) {
  const { selectedOutlet } = useBusinessStore();

  const totalTaxAmount = useMemo(() => {
    return orders.reduce((sum, row) => sum + getOrderTaxTotal(row), 0);
  }, [orders]);

  const taxData = useMemo(
    () => [
      {
        type: "VAT",
        amount: formatPrice({
          amount: totalTaxAmount || 0,
          currencyCode: selectedOutlet?.currency || "NGN",
        }),
        percent: "-",
      },
    ],
    [selectedOutlet?.currency, totalTaxAmount],
  );

  return (
    <section className="bg-[#FFFFFF] p-6 rounded-[14px]">
      <div className="flex flex-col gap-[12px] mb-2.5">
        <h3 className="text-[#1C1B20] text-[20px] font-bold">
          Total Taxes -{" "}
          {formatPrice({
            amount: totalTaxAmount || 0,
            currencyCode: selectedOutlet?.currency || "NGN",
          })}
        </h3>
        <p className="text-[#737373] text-[14px] font-normal">
          This section provides a breakdown of various taxes applicable to your
          business's operations over the selected period.
        </p>
      </div>
      <StatsTable
        columns={[
          { label: "Tax Type", key: "type" },
          { label: "Amount", key: "amount" },
          { label: "Percentage", key: "percent" },
        ]}
        data={taxData}
      />
    </section>
  );
}
