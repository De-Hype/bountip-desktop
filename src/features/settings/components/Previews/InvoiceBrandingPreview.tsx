// import React from "react";
// import Image from "next/image";
// import { getCurrencySymbolByCountry } from "@/utils/getCurrencySymbol";
// import { Outlet } from "@/types/outlet";

// interface InvoiceSettings {
//   showBakeryName: boolean;
//   fontSize: string;
//   paperSize: string;
//   showPaymentSuccess: boolean;
//   showBusinessLine: boolean;
//   customBusinessText: string;
//   showInvoiceNumber: boolean;
//   showInvoiceIssueDate: boolean;
//   showInvoiceDueDate: boolean;
//   showClientName: boolean;
//   showClientAddress: boolean;
//   showModifierBelowItems: boolean;
//   selectedColumns: {
//     orderName: boolean;
//     sku: boolean;
//     qty: boolean;
//     subTotal: boolean;
//     total: boolean;
//   };
//   showDiscountLine: boolean;
//   showTax: boolean;
//   showDeliveryFee: boolean;
//   showPaymentStatus: boolean;
//   showPaymentMethod: boolean;
//   showRemoveTaxOnOrderReceipt: boolean;
//   showRemoveTaxOnPaymentReceipt: boolean;
//   showActivateAccountDetails: boolean;
//   showActivateEmail: boolean;
//   showActivateAddress: boolean;
//   customMessage: string;
// }

// interface InvoiceBrandingPreviewProps {
//   formData: InvoiceSettings;
//   imageUrl: string | null;
//   store?: Outlet | null;
// }

// const InvoiceBrandingPreview: React.FC<InvoiceBrandingPreviewProps> = ({
//   store,
//   formData,
//   imageUrl,
// }) => {
//   console.log("Invoice Preview - Store:", store);
//   console.log("Invoice Preview - Form Data:", formData);

//   // Fallback currency sign if store or country is missing
//   const currencySign = store?.country
//     ? getCurrencySymbolByCountry(store.country) || "$"
//     : "$";

//   const defaultLogoUrl = "/default-logo.png";
//   const getFontFamily = (fontStyle: string): string => {
//     const fontMap: Record<string, string> = {
//       "Times New Roman": "'Times New Roman', Times, serif",
//       Arial: "Arial, sans-serif",
//       Helvetica: "Helvetica, Arial, sans-serif",
//       "Courier New": "'Courier New', 'Courier Prime', Courier, monospace",
//     };
//     return fontMap[fontStyle] || '"Product Sans", sans-serif';
//   };

//   return (
//     <section
//       className="border border-[#D1D1D1] bg-white w-[100%] py-3 rounded-[10px]"
//       style={{ fontFamily: getFontFamily(formData.fontSize) }}
//     >
//       <div className="text-center mb-6">
//         {formData.showBakeryName && imageUrl && (
//           <Image
//             width={100}
//             height={100}
//             src={imageUrl || store?.logoUrl || defaultLogoUrl}
//             alt="Business Logo"
//             className="h-16 w-16 mx-auto mb-4 object-contain"
//           />
//         )}
//       </div>
//       <section className="flex flex-col">
//         {formData.showBakeryName && (
//           <h2 className="text-xl font-medium text-center text-[#1C1B20]">
//             {store?.name || "Business Name"}
//           </h2>
//         )}

//         <h2 className="text-[15px] font-medium text-center text-[#A6A6A6]">
//           {store?.address || "123 Business St, City, Country"}
//         </h2>

//         <section className="flex flex-col gap-[14px] my-3 px-3 mx-2 py-2 rounded-[5px] border-dashed border border-[#D1D1D1]">
//           <div className="flex flex-col gap-[14px]">
//             {formData.showInvoiceNumber && (
//               <section className="flex items-center justify-between">
//                 <h3 className="text-[15px] font-normal text-[#A6A6A6]">
//                   Invoice Number
//                 </h3>
//                 <h3 className="text-[15px] font-medium text-[#1C1B20]">
//                   #INV38482
//                 </h3>
//               </section>
//             )}
//             {formData.showInvoiceIssueDate && (
//               <section className="flex items-center justify-between">
//                 <h3 className="text-[15px] font-normal text-[#A6A6A6]">
//                   Issue Date
//                 </h3>
//                 <h3 className="text-[15px] font-medium text-[#1C1B20]">
//                   20/10/2025
//                 </h3>
//               </section>
//             )}
//             {formData.showInvoiceDueDate && (
//               <section className="flex items-center justify-between">
//                 <h3 className="text-[15px] font-normal text-[#A6A6A6]">
//                   Due Date
//                 </h3>
//                 <h3 className="text-[15px] font-medium text-[#1C1B20]">
//                   20/10/2025
//                 </h3>
//               </section>
//             )}
//             {formData.showClientName && (
//               <section className="flex items-center justify-between">
//                 <h3 className="text-[15px] font-normal text-[#A6A6A6]">
//                   Client Name
//                 </h3>
//                 <h3 className="text-[15px] font-medium text-[#1C1B20]">
//                   Jacob Jones
//                 </h3>
//               </section>
//             )}
//             {formData.showClientAddress && (
//               <section className="flex items-center justify-between">
//                 <h3 className="text-[15px] font-normal text-[#A6A6A6]">
//                   Client Address
//                 </h3>
//                 <h3 className="text-[15px] truncate font-medium text-[#1C1B20]">
//                   2972 Westheimer Rd. Santa Ana, Illinois 85486
//                 </h3>
//               </section>
//             )}
//             {formData.showActivateEmail && (
//               <section className="flex items-center justify-between">
//                 <h3 className="text-[15px] font-normal text-[#A6A6A6]">
//                   Email
//                 </h3>
//                 <h3 className="text-[15px] font-medium text-[#1C1B20]">
//                   {store?.email || "info@example.com"}
//                 </h3>
//               </section>
//             )}
//             {formData.showActivateAddress && (
//               <section className="flex items-center justify-between">
//                 <h3 className="text-[15px] font-normal text-[#A6A6A6]">
//                   Address
//                 </h3>
//                 <h3 className="text-[15px] font-medium text-[#1C1B20]">
//                   {store?.address || "123 Business St, City, Country"}
//                 </h3>
//               </section>
//             )}
//             {formData.showActivateAccountDetails && (
//               <section className="flex items-center justify-between">
//                 <h3 className="text-[15px] font-normal text-[#A6A6A6]">
//                   Account Details
//                 </h3>
//                 <h3 className="text-[15px] font-medium text-[#1C1B20]">
//                   38492840 Access
//                 </h3>
//               </section>
//             )}
//           </div>
//           {formData.showModifierBelowItems && (
//             <table className="my-5">
//               <thead>
//                 <tr className="bg-[#FAFAFC] text-[#A6A6A6] rounded-[5px] text-[15px] font-normal">
//                   {formData.selectedColumns.orderName && (
//                     <th className="text-left py-2 pl-2">Order</th>
//                   )}
//                   {formData.selectedColumns.sku && (
//                     <th className="text-left py-2 pl-2">SKU</th>
//                   )}
//                   {formData.selectedColumns.qty && (
//                     <th className="text-left py-2 pl-2">Qty</th>
//                   )}
//                   {formData.selectedColumns.subTotal && (
//                     <th className="text-left py-2 pl-2">Sub Total</th>
//                   )}
//                   {formData.selectedColumns.total && (
//                     <th className="text-left py-2 pl-2">Total</th>
//                   )}
//                 </tr>
//               </thead>
//               <tbody>
//                 <tr>
//                   {formData.selectedColumns.orderName && (
//                     <td className="text-left py-2 pl-2">Muffins</td>
//                   )}
//                   {formData.selectedColumns.sku && (
//                     <td className="text-left py-2 pl-2">SKU2348</td>
//                   )}
//                   {formData.selectedColumns.qty && (
//                     <td className="text-left py-2 pl-2">1</td>
//                   )}
//                   {formData.selectedColumns.subTotal && (
//                     <td className="text-left py-2 pl-2">{currencySign}10</td>
//                   )}
//                   {formData.selectedColumns.total && (
//                     <td className="text-left py-2 pl-2">{currencySign}50</td>
//                   )}
//                 </tr>
//               </tbody>
//             </table>
//           )}
//           {formData.showPaymentMethod && (
//             <>
//               <div className="flex flex-col border-t border-[#D1D1D1] border-dashed gap-[14px]" />
//               <section className="flex items-center justify-between">
//                 <h3 className="text-[15px] font-normal text-[#A6A6A6]">
//                   Payment Method
//                 </h3>
//                 <h3 className="text-[15px] font-medium text-[#1C1B20]">Cash</h3>
//               </section>
//             </>
//           )}
//           <div className="flex flex-col border-t border-b border-[#D1D1D1] border-dashed gap-[14px]">
//             <div className="flex flex-col gap-[14px] my-3">
//               {formData.showDiscountLine && (
//                 <section className="flex items-center justify-between">
//                   <h3 className="text-[15px] font-normal text-[#A6A6A6]">
//                     Discount
//                   </h3>
//                   <h3 className="text-[15px] font-medium text-[#1C1B20]">
//                     20%
//                   </h3>
//                 </section>
//               )}
//               {formData.showTax && (
//                 <section className="flex items-center justify-between">
//                   <h3 className="text-[15px] font-normal text-[#A6A6A6]">
//                     Tax
//                   </h3>
//                   <h3 className="text-[15px] font-medium text-[#1C1B20]">
//                     20%
//                   </h3>
//                 </section>
//               )}
//               {formData.showDeliveryFee && (
//                 <section className="flex items-center justify-between">
//                   <h3 className="text-[15px] font-normal text-[#A6A6A6]">
//                     Delivery Fee
//                   </h3>
//                   <h3 className="text-[15px] font-medium text-[#1C1B20]">
//                     {currencySign}5
//                   </h3>
//                 </section>
//               )}
//               <section className="flex items-center justify-between">
//                 <h3 className="text-[15px] font-normal text-[#A6A6A6]">
//                   Sub total
//                 </h3>
//                 <h3 className="text-[15px] font-medium text-[#1C1B20]">
//                   {currencySign}50
//                 </h3>
//               </section>
//             </div>
//           </div>
//           {formData.showBusinessLine && (
//             <section className="flex items-center justify-between">
//               <h3 className="text-[15px] font-normal text-[#A6A6A6]">Total</h3>
//               <h3 className="text-[15px] font-medium text-[#1C1B20]">
//                 {currencySign}55
//               </h3>
//             </section>
//           )}
//         </section>
//       </section>
//       <div className="my-4">
//         {formData.showPaymentSuccess && formData.customBusinessText && (
//           <h3 className="text-[15px] font-semibold text-[#15BA5C] text-center">
//             {formData.customBusinessText}
//           </h3>
//         )}
//         {formData.customMessage && (
//           <h3 className="text-[15px] font-semibold text-[#15BA5C] text-center">
//             {formData.customMessage}
//           </h3>
//         )}
//       </div>
//     </section>
//   );
// };

// export default InvoiceBrandingPreview;
