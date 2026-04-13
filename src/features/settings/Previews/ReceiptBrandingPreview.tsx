import React from "react";
import { getCurrencySymbolByCountry } from "@/utils/getCurrencySymbol";

interface ReceiptSettings {
  showReceiptBranding: boolean;
  showRestaurantName: boolean;
  fontStyle: string;
  paperSize: string;
  showPaymentSuccessText: boolean;
  customizeSuccessText: string;
  showTotalPaidAtTop: boolean;
  showOrderCustomizationName: boolean;
  showOrderName: boolean;
  showOrderDateTime: boolean;
  showCashierName: boolean;
  showCompanyPhoneNo: boolean;
  showCompanyEmail: boolean;
  showCompanyBankDetails: boolean;
  showCompanyBarCode: boolean;
  showModifiersBelowItems: boolean;
  selectedColumns: {
    orderName: boolean;
    sku: boolean;
    qty: boolean;
    subTotal: boolean;
    total: boolean;
  };
  showDiscountLine: boolean;
  showTax: boolean;
  showPaymentMethod: boolean;
  customMessage: string;
}

interface ReceiptBrandingPreviewProps {
  formData: ReceiptSettings;
  imageUrl: string | null;
  store?: {
    country?: string | null;
    logoUrl?: string | null;
    name?: string | null;
    address?: string | null;
    phoneNumber?: string | null;
    email?: string | null;
  } | null;
}

const ReceiptBrandingPreview: React.FC<ReceiptBrandingPreviewProps> = ({
  store,
  formData,
  imageUrl,
}) => {
  console.log("Store:", store);
  console.log("Form Data:", formData);

  const formatDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    let hours = date.getHours();
    const amPm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const formattedHours = String(hours).padStart(2, "0");

    return `${year}-${month}-${day}; ${formattedHours}:${minutes}:${seconds} ${amPm}`;
  };

  const [currentDateTime, setCurrentDateTime] = React.useState(() =>
    formatDateTime(new Date()),
  );

  React.useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentDateTime(formatDateTime(new Date()));
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Fallback currency sign if store or country is missing
  const currencySign = store?.country
    ? getCurrencySymbolByCountry(store.country) || "$"
    : "$";

  // Fallback logo URL
  const defaultLogoUrl = "/default-logo.png";

  // Get the font family for the preview
  const getFontFamily = (fontStyle: string): string => {
    const fontMap: Record<string, string> = {
      "Times New Roman": "'Times New Roman', Times, serif",
      Arial: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
      Helvetica: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      Courier: "'Courier New', Courier, monospace",
    };
    // Fallback to Product Sans if no valid font is selected
    return fontMap[fontStyle] || '"Product Sans", sans-serif';
  };

  return (
    <section
      className="border border-[#D1D1D1] bg-white w-full py-3 rounded-[10px]"
      style={{ fontFamily: getFontFamily(formData.fontStyle) }}
    >
      <div className="text-center mb-6">
        {formData.showReceiptBranding && (
          <img
            width={100}
            height={100}
            src={imageUrl || store?.logoUrl || defaultLogoUrl}
            alt="Business Logo"
            className="h-16 w-16 mx-auto mb-4 object-contain"
          />
        )}
      </div>
      <section className="flex flex-col">
        {formData.showRestaurantName && (
          <h2 className="text-xl font-medium text-center text-[#1C1B20]">
            {store?.name || "Business Name"}
          </h2>
        )}

        <h2 className="text-[15px] font-medium text-center text-[#A6A6A6]">
          {store?.address || "123 Business St, City, Country"}
        </h2>

        <section className="flex flex-col gap-[14px] my-3 px-3 mx-2 py-2 rounded-[5px] border-dashed border border-[#D1D1D1]">
          <div className="flex flex-col gap-[14px]">
            {formData.showOrderCustomizationName && (
              <section className="flex items-center justify-between">
                <h3 className="text-[15px] font-normal text-[#A6A6A6]">
                  Customer Name
                </h3>
                <h3 className="text-[15px] font-medium text-[#1C1B20]">
                  {store?.name || "Sarah Doe"}
                </h3>
              </section>
            )}
            {formData.showOrderName && (
              <section className="flex items-center justify-between">
                <h3 className="text-[15px] font-normal text-[#A6A6A6]">
                  Order No:
                </h3>
                <h3 className="text-[15px] font-medium text-[#1C1B20]">
                  #SKU1837582
                </h3>
              </section>
            )}
            {formData.showOrderDateTime && (
              <section className="flex items-center justify-between">
                <h3 className="text-[15px] font-normal text-[#A6A6A6]">
                  Date & Time
                </h3>
                <h3 className="text-[15px] font-medium text-[#1C1B20]">
                  {currentDateTime}
                </h3>
              </section>
            )}
            {formData.showCashierName && (
              <section className="flex items-center justify-between">
                <h3 className="text-[15px] font-normal text-[#A6A6A6]">
                  Cashier Name
                </h3>
                <h3 className="text-[15px] font-medium text-[#1C1B20]">
                  {store?.name || "John Doe"}
                </h3>
              </section>
            )}
            {formData.showCompanyPhoneNo && (
              <section className="flex items-center justify-between">
                <h3 className="text-[15px] font-normal text-[#A6A6A6]">
                  Phone Number
                </h3>
                <h3 className="text-[15px] font-medium text-[#1C1B20]">
                  {store?.phoneNumber || "09076534579"}
                </h3>
              </section>
            )}
            {formData.showCompanyEmail && (
              <section className="flex items-center justify-between">
                <h3 className="text-[15px] font-normal text-[#A6A6A6]">
                  Email
                </h3>
                <h3 className="text-[15px] font-medium text-[#1C1B20]">
                  {store?.email || "info@example.com"}
                </h3>
              </section>
            )}
            {formData.showCompanyBankDetails && (
              <section className="flex items-center justify-between">
                <h3 className="text-[15px] font-normal text-[#A6A6A6]">
                  Bank Details
                </h3>
                <h3 className="text-[15px] font-medium text-[#1C1B20]">
                  38492840 Access
                </h3>
              </section>
            )}
          </div>
          {formData.showModifiersBelowItems && (
            <table className="my-5">
              <thead>
                <tr className="bg-[#FAFAFC] text-[#A6A6A6] rounded-[5px] text-[15px] font-normal">
                  {formData.selectedColumns.orderName && (
                    <th className="text-left py-2 pl-2">Order</th>
                  )}
                  {formData.selectedColumns.sku && (
                    <th className="text-left py-2 pl-2">SKU</th>
                  )}
                  {formData.selectedColumns.qty && (
                    <th className="text-left py-2 pl-2">Qty</th>
                  )}
                  {formData.selectedColumns.subTotal && (
                    <th className="text-left py-2 pl-2">Sub Total</th>
                  )}
                  {formData.selectedColumns.total && (
                    <th className="text-left py-2 pl-2">Total</th>
                  )}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {formData.selectedColumns.orderName && (
                    <td className="text-left py-2 pl-2">Muffins</td>
                  )}
                  {formData.selectedColumns.sku && (
                    <td className="text-left py-2 pl-2">SKU2348</td>
                  )}
                  {formData.selectedColumns.qty && (
                    <td className="text-left py-2 pl-2">1</td>
                  )}
                  {formData.selectedColumns.subTotal && (
                    <td className="text-left py-2 pl-2">{currencySign}10</td>
                  )}
                  {formData.selectedColumns.total && (
                    <td className="text-left py-2 pl-2">{currencySign}50</td>
                  )}
                </tr>
              </tbody>
            </table>
          )}
          {formData.showPaymentMethod && (
            <>
              <div className="flex flex-col border-t border-[#D1D1D1] border-dashed gap-[14px]" />
              <section className="flex items-center justify-between">
                <h3 className="text-[15px] font-normal text-[#A6A6A6]">
                  Payment Method
                </h3>
                <h3 className="text-[15px] font-medium text-[#1C1B20]">Cash</h3>
              </section>
            </>
          )}
          <div className="flex flex-col border-t border-b border-[#D1D1D1] border-dashed gap-[14px]">
            <div className="flex flex-col gap-[14px] my-3">
              {formData.showDiscountLine && (
                <section className="flex items-center justify-between">
                  <h3 className="text-[15px] font-normal text-[#A6A6A6]">
                    Discount
                  </h3>
                  <h3 className="text-[15px] font-medium text-[#1C1B20]">
                    20%
                  </h3>
                </section>
              )}
              {formData.showTax && (
                <section className="flex items-center justify-between">
                  <h3 className="text-[15px] font-normal text-[#A6A6A6]">
                    Tax
                  </h3>
                  <h3 className="text-[15px] font-medium text-[#1C1B20]">
                    20%
                  </h3>
                </section>
              )}
              <section className="flex items-center justify-between">
                <h3 className="text-[15px] font-normal text-[#A6A6A6]">
                  Sub total
                </h3>
                <h3 className="text-[15px] font-medium text-[#1C1B20]">
                  {currencySign}50
                </h3>
              </section>
            </div>
          </div>
          {formData.showTotalPaidAtTop && (
            <section className="flex items-center justify-between">
              <h3 className="text-[15px] font-normal text-[#A6A6A6]">Total</h3>
              <h3 className="text-[15px] font-medium text-[#1C1B20]">
                {currencySign}55
              </h3>
            </section>
          )}
        </section>
      </section>
      <div className="my-4">
        {formData.showPaymentSuccessText && formData.customizeSuccessText && (
          <h3 className="text-[15px] font-semibold text-[#15BA5C] text-center">
            {formData.customizeSuccessText}
          </h3>
        )}
        {formData.customMessage && (
          <h3 className="text-[15px] font-semibold text-[#15BA5C] text-center">
            {formData.customMessage}
          </h3>
        )}
      </div>
    </section>
  );
};

export default ReceiptBrandingPreview;
