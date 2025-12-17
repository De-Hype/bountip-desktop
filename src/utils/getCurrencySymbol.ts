import countryCurrencyMap from "country-currency-map";

export const getCurrencySymbolByCountry = (country: string): string => {
  try {
    const abbr = countryCurrencyMap.getCurrencyAbbreviation(country); // e.g., NGN
    return getCurrencySymbol(abbr, `en-${abbr.slice(0, 2)}`); // crude locale guess
  } catch {
    return "";
  }
};

export const getCurrencySymbol = (
  currencyCode: string,
  locale = "en-NG"
): string => {
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      currencyDisplay: "symbol",
    }).formatToParts(1);

    const symbolPart = parts.find((part) => part.type === "currency");
    return symbolPart?.value || currencyCode;
  } catch {
    return currencyCode;
  }
};
