export function formatPrice({
  amount,
  currencyCode = "USD",
}: {
  amount: number;
  currencyCode: string;
}) {
  const formatCurrency = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currencyCode,
  });

  return formatCurrency.format(amount);
}
