// /* eslint-disable @typescript-eslint/no-explicit-any */
// // /* eslint-disable @typescript-eslint/no-explicit-any */
// // "use client";

// // import React from "react";
// // import { Camera } from "lucide-react";
// // import Image from "next/image";
// // import { useSelectedOutlet } from "@/hooks/useSelectedOutlet";

// // interface LabelPreviewProps {
// //   formData: any;
// //   imageUrl?: string | null; // Updated to match LabellingSettingsModal
// //   type?: "receipt" | "label" | "invoice";
// // }

// // const LabelPreview: React.FC<LabelPreviewProps> = ({
// //   formData,
// //   imageUrl = null, // Default to null instead of empty string
// //   type = "receipt",
// // }) => {
// //   // Helper function to safely get nested properties
// //   const getNestedValue = (
// //     obj: any,
// //     path: string,
// //     defaultValue: any = false
// //   ) => {
// //     return (
// //       path.split(".").reduce((current, key) => current?.[key], obj) ??
// //       defaultValue
// //     );
// //   };

// //   // Helper function to check if any property exists (for fallback compatibility)
// //   const hasAnyProperty = (properties: string[]) => {
// //     return properties.some(
// //       (prop) => getNestedValue(formData, prop) !== undefined
// //     );
// //   };
// //   const outlet = useSelectedOutlet();

// //   // Determine business name display
// //   const getBusinessNameDisplay = () => {
// //     if (
// //       formData.showBakeyName ||
// //       formData.showBakeryName ||
// //       formData.showRestaurantName
// //     ) {
// //       return true;
// //     }
// //     return false;
// //   };

// //   // Determine payment success text display
// //   const getPaymentSuccessDisplay = () => {
// //     const showPaymentSuccess =
// //       formData.showPaymentSuccess || formData.showPaymentSucessText;
// //     const customText =
// //       formData.customBusinessText || formData.customizeSuccessText;
// //     return showPaymentSuccess && customText;
// //   };

// //   // Get custom message
// //   const getCustomMessage = () => {
// //     return formData.customMessage || "Thank you for Shopping with us!";
// //   };

// //   // Render receipt/invoice view
// //   const renderReceiptInvoice = () => (
// //     <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm max-w-md">
// //       {/* Logo/Image Section */}
// //       <div className="text-center mb-6">
// //         {imageUrl || outlet?.outlet?.logoUrl ? (
// //           <Image
// //             width={100}
// //             height={100}
// //             src={imageUrl || outlet?.outlet?.logoUrl || ""}
// //             alt="Business Logo"
// //             className="h-16 w-16 mx-auto mb-4 object-contain"
// //           />
// //         ) : (
// //           <div className="h-16 w-16 mx-auto mb-4 bg-green-500 rounded flex items-center justify-center">
// //             <Camera className="w-8 h-8 text-white" /> {/* Fallback placeholder */}
// //           </div>
// //         )}

// //         {getBusinessNameDisplay() && (
// //           <h2 className="text-xl font-bold text-gray-900 mb-1">
// //             Business Name
// //           </h2>
// //         )}

// //         {(formData.showActivateAddress || type === "invoice") && (
// //           <p className="text-sm text-gray-500">
// //             8502 Preston Rd. Inglewood, Maine 98380
// //           </p>
// //         )}

// //         {formData.showActivateEmail && (
// //           <p className="text-sm text-gray-500">business@example.com</p>
// //         )}

// //         {formData.showCompanyPhoneNo && (
// //           <p className="text-sm text-gray-500">+1 (555) 123-4567</p>
// //         )}
// //       </div>

// //       {/* Invoice/Receipt Details */}
// //       <div className="space-y-3 mb-6">
// //         {(formData.showInvoiceNumber || type === "receipt") && (
// //           <div className="flex justify-between">
// //             <span className="text-sm text-gray-500">
// //               {type === "invoice" ? "Invoice Number" : "Receipt Number"}
// //             </span>
// //             <span className="text-sm font-medium text-gray-900">#INV38482</span>
// //           </div>
// //         )}

// //         {(formData.showInvoiceIssueDate ||
// //           formData.showOrderDateTime ||
// //           type === "receipt") && (
// //           <div className="flex justify-between">
// //             <span className="text-sm text-gray-500">
// //               {type === "invoice" ? "Issue Date" : "Date & Time"}
// //             </span>
// //             <span className="text-sm font-medium text-gray-900">
// //               {type === "invoice" ? "20/10/2025" : "2025-10-25; 09:10:45 AM"}
// //             </span>
// //           </div>
// //         )}

// //         {formData.showInvoiceDueDate && (
// //           <div className="flex justify-between">
// //             <span className="text-sm text-gray-500">Due Date</span>
// //             <span className="text-sm font-medium text-gray-900">
// //               25/10/2025
// //             </span>
// //           </div>
// //         )}

// //         {(formData.showClientName || type === "invoice") && (
// //           <div className="flex justify-between">
// //             <span className="text-sm text-gray-500">Client Name</span>
// //             <span className="text-sm font-medium text-gray-900">
// //               Jacob Jones
// //             </span>
// //           </div>
// //         )}

// //         {(formData.showClientAddress || type === "invoice") && (
// //           <div className="flex justify-between">
// //             <span className="text-sm text-gray-500">Client Address</span>
// //             <span className="text-sm font-medium text-gray-900 text-right">
// //               2972 Westheimer Rd. Santa Ana, Illinois 85486
// //             </span>
// //           </div>
// //         )}

// //         {formData.showCashierName && (
// //           <div className="flex justify-between">
// //             <span className="text-sm text-gray-500">Cashier</span>
// //             <span className="text-sm font-medium text-gray-900">John Doe</span>
// //           </div>
// //         )}
// //       </div>

// //       {/* Payment Success Text */}
// //       {getPaymentSuccessDisplay() && (
// //         <div className="text-center mb-4">
// //           <p className="text-sm text-green-600 font-medium">
// //             {formData.customBusinessText || formData.customizeSuccessText}
// //           </p>
// //         </div>
// //       )}

// //       {/* Order Table Header */}
// //       <div className="border-t border-gray-200 pt-4 mb-4">
// //         <div className="grid grid-cols-5 gap-2 text-xs text-gray-500 font-medium mb-3">
// //           {(getNestedValue(formData, "selectedColumns.orderName") ||
// //             formData.showOrderName) && <span>Order</span>}
// //           {getNestedValue(formData, "selectedColumns.sku") && <span>SKU</span>}
// //           {getNestedValue(formData, "selectedColumns.qty") && <span>Qty</span>}
// //           {getNestedValue(formData, "selectedColumns.subTotal") && (
// //             <span>Sub-total</span>
// //           )}
// //           {getNestedValue(formData, "selectedColumns.total") && (
// //             <span>Total</span>
// //           )}
// //           {!hasAnyProperty([
// //             "selectedColumns.orderName",
// //             "selectedColumns.sku",
// //             "selectedColumns.qty",
// //             "selectedColumns.subTotal",
// //             "selectedColumns.total",
// //           ]) && (
// //             <>
// //               <span>Order</span>
// //               <span>SKU</span>
// //               <span>Qty</span>
// //               <span>Sub-total</span>
// //               <span>Total</span>
// //             </>
// //           )}
// //         </div>

// //         {/* Order Item */}
// //         <div className="grid grid-cols-5 gap-2 text-sm text-gray-900 mb-4">
// //           <span>Muffins</span>
// //           <span>SKU2348</span>
// //           <span>1</span>
// //           <span>$10</span>
// //           <span>$50</span>
// //         </div>

// //         {/* Show modifiers below items if enabled */}
// //         {(formData.showModifiersBelowItems ||
// //           formData.showModifierBelowItems) && (
// //           <div className="text-xs text-gray-500 mb-4 ml-4">
// //             • Extra sugar • No nuts
// //           </div>
// //         )}
// //       </div>

// //       {/* Payment Details */}
// //       <div className="space-y-3 mb-6">
// //         {formData.showPaymentMethod && (
// //           <div className="flex justify-between">
// //             <span className="text-sm text-gray-500">Payment Method</span>
// //             <span className="text-sm font-medium text-gray-900">Transfer</span>
// //           </div>
// //         )}

// //         {formData.showDiscountLine && (
// //           <div className="flex justify-between">
// //             <span className="text-sm text-gray-500">Discount</span>
// //             <span className="text-sm font-medium text-gray-900">20%</span>
// //           </div>
// //         )}

// //         {formData.showTax && (
// //           <div className="flex justify-between">
// //             <span className="text-sm text-gray-500">Tax</span>
// //             <span className="text-sm font-medium text-gray-900">20%</span>
// //           </div>
// //         )}

// //         {formData.showDeliveryFee && (
// //           <div className="flex justify-between">
// //             <span className="text-sm text-gray-500">Delivery Fee</span>
// //             <span className="text-sm font-medium text-gray-900">$5</span>
// //           </div>
// //         )}

// //         <div className="flex justify-between">
// //           <span className="text-sm text-gray-500">Sub total</span>
// //           <span className="text-sm font-medium text-gray-900">$50</span>
// //         </div>

// //         {formData.showPaymentStatus && (
// //           <div className="flex justify-between">
// //             <span className="text-sm text-gray-500">Payment Status</span>
// //             <span className="text-sm font-medium text-green-600">Paid</span>
// //           </div>
// //         )}
// //       </div>

// //       {/* Total */}
// //       <div className="border-t border-gray-200 pt-4 mb-6">
// //         <div className="flex justify-between">
// //           <span className="text-lg font-medium text-gray-900">Total</span>
// //           <span className="text-lg font-bold text-gray-900">$55</span>
// //         </div>
// //       </div>

// //       {/* Bank Details */}
// //       {formData.showCompanyBankDetails && (
// //         <div className="border-t border-gray-200 pt-4 mb-6">
// //           <h4 className="text-sm font-medium text-gray-900 mb-2">
// //             Bank Details
// //           </h4>
// //           <div className="text-xs text-gray-500">
// //             <p>Account: 1234567890</p>
// //             <p>Bank: Example Bank</p>
// //             <p>Swift: EXAMPLEXXX</p>
// //           </div>
// //         </div>
// //       )}

// //       {/* Barcode */}
// //       {(formData.showCompanyBarCode || formData.showBarcode) && (
// //         <div className="text-center mb-4">
// //           <div className="bg-gray-900 h-12 w-32 mx-auto flex items-center justify-center">
// //             <span className="text-white text-xs">||||| |||| |||||</span>
// //           </div>
// //           <p className="text-xs text-gray-500 mt-1">1234567890123</p>
// //         </div>
// //       )}

// //       {/* Thank You Message */}
// //       <div className="text-center">
// //         <p className="text-green-600 font-medium text-sm tracking-wide">
// //           {getCustomMessage()}
// //         </p>
// //       </div>
// //     </div>
// //   );

// //   // Render label view
// //   const renderLabel = () => (
// //     <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm max-w-md">
// //       {/* Logo/Image Section */}
// //       <div className="text-center mb-6">
// //         {imageUrl || outlet?.outlet?.logoUrl ? (
// //           <Image
// //             width={100}
// //             height={100}
// //             src={imageUrl || outlet?.outlet?.logoUrl || ""}
// //             alt="Business Logo"
// //             className="h-16 w-16 mx-auto mb-4 object-contain"
// //           />
// //         ) : (
// //           <div className="h-16 w-16 mx-auto mb-4 bg-green-500 rounded flex items-center justify-center">
// //             <Camera className="w-8 h-8 text-white" /> {/* Fallback placeholder */}
// //           </div>
// //         )}

// //         {getBusinessNameDisplay() && (
// //           <h2 className="text-xl font-bold text-gray-900 mb-1">
// //             Business Name
// //           </h2>
// //         )}
// //       </div>

// //       {/* Label Items */}
// //       <div className="space-y-3 mb-6">
// //         {formData.labelItems?.map((item: any, index: number) =>
// //           item.enabled ? (
// //             <div
// //               key={index}
// //               className="flex justify-between border-b border-gray-100 pb-2"
// //             >
// //               <span className="text-sm text-gray-500">{item.name}</span>
// //               <span className="text-sm font-medium text-gray-900">
// //                 {item.name === "Price"
// //                   ? "$12.99"
// //                   : item.name === "Best Before"
// //                   ? "2025-12-31"
// //                   : item.name === "Product Weight"
// //                   ? "500g"
// //                   : item.name === "ManufacturedDate"
// //                   ? "2025-07-15"
// //                   : "Sample Value"}
// //               </span>
// //             </div>
// //           ) : null
// //         )}
// //       </div>

// //       {/* Custom Business Text */}
// //       {getPaymentSuccessDisplay() && (
// //         <div className="text-center mb-4">
// //           <p className="text-sm text-green-600 font-medium">
// //             {formData.customBusinessText}
// //           </p>
// //         </div>
// //       )}

// //       {/* Barcode */}
// //       {formData.showBarcode && (
// //         <div className="text-center mb-4">
// //           <div className="bg-gray-900 h-12 w-32 mx-auto flex items-center justify-center">
// //             <span className="text-white text-xs">||||| |||| |||||</span>
// //           </div>
// //           <p className="text-xs text-gray-500 mt-1">1234567890123</p>
// //         </div>
// //       )}

// //       {/* Custom Message */}
// //       {formData.customMessage && (
// //         <div className="text-center">
// //           <p className="text-green-600 font-medium text-sm tracking-wide">
// //             {formData.customMessage}
// //           </p>
// //         </div>
// //       )}
// //     </div>
// //   );

// //   return (
// //     <div className="ml-8 sticky top-4">
// //       <div className="flex items-center gap-2 mb-4">
// //         <Camera className="w-5 h-5 text-green-600" />
// //         <h3 className="font-medium text-gray-900">Live Preview</h3>
// //       </div>

// //       {type === "label" ? renderLabel() : renderReceiptInvoice()}
// //     </div>
// //   );
// // };

// // export default LabelPreview;

// import React from "react";
// import { Camera } from "lucide-react";
// import Image from "next/image";
// import { useAppSelector } from "@/hooks/redux-hooks";

// interface LabelPreviewProps {
//   formData: any;
//   imageUrl?: string | null;
//   type?: "receipt" | "label" | "invoice";
// }

// const LabelPreview: React.FC<LabelPreviewProps> = ({
//   formData,
//   imageUrl = null,
//   type = "receipt",
// }) => {
//   const outlet = useAppSelector((state) => state.business.outlet);

//   // Helper function to safely get nested properties
//   const getNestedValue = (
//     obj: any,
//     path: string,
//     defaultValue: any = false
//   ) => {
//     return (
//       path.split(".").reduce((current, key) => current?.[key], obj) ??
//       defaultValue
//     );
//   };

//   // Helper function to check if any property exists (for fallback compatibility)
//   const hasAnyProperty = (properties: string[]) => {
//     return properties.some(
//       (prop) => getNestedValue(formData, prop) !== undefined
//     );
//   };

//   // Determine business name display
//   const getBusinessNameDisplay = () => {
//     if (
//       formData.showBakeryName ||
//       formData.showBakeyName ||
//       formData.showRestaurantName
//     ) {
//       return true;
//     }
//     return false;
//   };

//   const getFontFamily = (fontStyle?: string): string => {
//     if (!fontStyle) {
//       return '"Product Sans", sans-serif';
//     }
//     const fontMap: Record<string, string> = {
//       "Times New Roman": "'Times New Roman', Times, serif",
//       Arial: "Arial, sans-serif",
//       Helvetica: "Helvetica, Arial, sans-serif",
//       "Courier New": "'Courier New', 'Courier Prime', Courier, monospace",
//       Courier: "'Courier New', 'Courier Prime', Courier, monospace",
//     };
//     return fontMap[fontStyle] || '"Product Sans", sans-serif';
//   };

//   // Determine payment success text display
//   const getPaymentSuccessDisplay = () => {
//     const showPaymentSuccess =
//       formData.showPaymentSuccess || formData.showPaymentSuccessText;
//     const customText =
//       formData.customBusinessText || formData.customizeSuccessText;
//     return showPaymentSuccess && customText;
//   };

//   // Get custom message
//   const getCustomMessage = () => {
//     return formData.customMessage || "Thank you for Shopping with us!";
//   };

//   // Render receipt/invoice view
//   const renderReceiptInvoice = () => (
//     <div
//       className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm max-w-md"
//       style={{
//         fontFamily: getFontFamily(formData?.fontSize || formData?.fontStyle),
//       }}
//     >
//       {/* Logo/Image Section */}
//       <div className="text-center mb-6">
//         {imageUrl || outlet?.logoUrl ? (
//           <Image
//             width={100}
//             height={100}
//             src={imageUrl || outlet?.logoUrl || ""}
//             alt="Business Logo"
//             className="h-16 w-16 mx-auto mb-4 object-contain"
//           />
//         ) : (
//           <div className="h-16 w-16 mx-auto mb-4 bg-green-500 rounded flex items-center justify-center">
//             <Camera className="w-8 h-8 text-white" />{" "}
//             {/* Fallback placeholder */}
//           </div>
//         )}

//         {getBusinessNameDisplay() && (
//           <h2 className="text-xl font-bold text-gray-900 mb-1">
//             Business Name
//           </h2>
//         )}

//         {(formData.showActivateAddress || type === "invoice") && (
//           <p className="text-sm text-gray-500">
//             8502 Preston Rd. Inglewood, Maine 98380
//           </p>
//         )}

//         {formData.showActivateEmail && (
//           <p className="text-sm text-gray-500">business@example.com</p>
//         )}

//         {formData.showCompanyPhoneNo && (
//           <p className="text-sm text-gray-500">+1 (555) 123-4567</p>
//         )}
//       </div>

//       {/* Invoice/Receipt Details */}
//       <div className="space-y-3 mb-6">
//         {(formData.showInvoiceNumber || type === "receipt") && (
//           <div className="flex justify-between">
//             <span className="text-sm text-gray-500">
//               {type === "invoice" ? "Invoice Number" : "Receipt Number"}
//             </span>
//             <span className="text-sm font-medium text-gray-900">#INV38482</span>
//           </div>
//         )}

//         {(formData.showInvoiceIssueDate ||
//           formData.showOrderDateTime ||
//           type === "receipt") && (
//           <div className="flex justify-between">
//             <span className="text-sm text-gray-500">
//               {type === "invoice" ? "Issue Date" : "Date & Time"}
//             </span>
//             <span className="text-sm font-medium text-gray-900">
//               {type === "invoice" ? "20/10/2025" : "2025-10-25; 09:10:45 AM"}
//             </span>
//           </div>
//         )}

//         {formData.showInvoiceDueDate && (
//           <div className="flex justify-between">
//             <span className="text-sm text-gray-500">Due Date</span>
//             <span className="text-sm font-medium text-gray-900">
//               25/10/2025
//             </span>
//           </div>
//         )}

//         {(formData.showClientName || type === "invoice") && (
//           <div className="flex justify-between">
//             <span className="text-sm text-gray-500">Client Name</span>
//             <span className="text-sm font-medium text-gray-900">
//               Jacob Jones
//             </span>
//           </div>
//         )}

//         {(formData.showClientAddress || type === "invoice") && (
//           <div className="flex justify-between">
//             <span className="text-sm text-gray-500">Client Address</span>
//             <span className="text-sm font-medium text-gray-900 text-right">
//               2972 Westheimer Rd. Santa Ana, Illinois 85486
//             </span>
//           </div>
//         )}

//         {formData.showCashierName && (
//           <div className="flex justify-between">
//             <span className="text-sm text-gray-500">Cashier</span>
//             <span className="text-sm font-medium text-gray-900">John Doe</span>
//           </div>
//         )}
//       </div>

//       {/* Payment Success Text */}
//       {getPaymentSuccessDisplay() && (
//         <div className="text-center mb-4">
//           <p className="text-sm text-green-600 font-medium">
//             {formData.customBusinessText || formData.customizeSuccessText}
//           </p>
//         </div>
//       )}

//       {/* Order Table Header */}
//       <div className="border-t border-gray-200 pt-4 mb-4">
//         <div className="grid grid-cols-5 gap-2 text-xs text-gray-500 font-medium mb-3">
//           {(getNestedValue(formData, "selectedColumns.orderName") ||
//             formData.showOrderName) && <span>Order</span>}
//           {getNestedValue(formData, "selectedColumns.sku") && <span>SKU</span>}
//           {getNestedValue(formData, "selectedColumns.qty") && <span>Qty</span>}
//           {getNestedValue(formData, "selectedColumns.subTotal") && (
//             <span>Sub-total</span>
//           )}
//           {getNestedValue(formData, "selectedColumns.total") && (
//             <span>Total</span>
//           )}
//           {!hasAnyProperty([
//             "selectedColumns.orderName",
//             "selectedColumns.sku",
//             "selectedColumns.qty",
//             "selectedColumns.subTotal",
//             "selectedColumns.total",
//           ]) && (
//             <>
//               <span>Order</span>
//               <span>SKU</span>
//               <span>Qty</span>
//               <span>Sub-total</span>
//               <span>Total</span>
//             </>
//           )}
//         </div>

//         {/* Order Item */}
//         <div className="grid grid-cols-5 gap-2 text-sm text-gray-900 mb-4">
//           <span>Muffins</span>
//           <span>SKU2348</span>
//           <span>1</span>
//           <span>$10</span>
//           <span>$50</span>
//         </div>

//         {/* Show modifiers below items if enabled */}
//         {(formData.showModifiersBelowItems ||
//           formData.showModifierBelowItems) && (
//           <div className="text-xs text-gray-500 mb-4 ml-4">
//             • Extra sugar • No nuts
//           </div>
//         )}
//       </div>

//       {/* Payment Details */}
//       <div className="space-y-3 mb-6">
//         {formData.showPaymentMethod && (
//           <div className="flex justify-between">
//             <span className="text-sm text-gray-500">Payment Method</span>
//             <span className="text-sm font-medium text-gray-900">Transfer</span>
//           </div>
//         )}

//         {formData.showDiscountLine && (
//           <div className="flex justify-between">
//             <span className="text-sm text-gray-500">Discount</span>
//             <span className="text-sm font-medium text-gray-900">20%</span>
//           </div>
//         )}

//         {formData.showTax && (
//           <div className="flex justify-between">
//             <span className="text-sm text-gray-500">Tax</span>
//             <span className="text-sm font-medium text-gray-900">20%</span>
//           </div>
//         )}

//         {formData.showDeliveryFee && (
//           <div className="flex justify-between">
//             <span className="text-sm text-gray-500">Delivery Fee</span>
//             <span className="text-sm font-medium text-gray-900">$5</span>
//           </div>
//         )}

//         <div className="flex justify-between">
//           <span className="text-sm text-gray-500">Sub total</span>
//           <span className="text-sm font-medium text-gray-900">$50</span>
//         </div>

//         {formData.showPaymentStatus && (
//           <div className="flex justify-between">
//             <span className="text-sm text-gray-500">Payment Status</span>
//             <span className="text-sm font-medium text-green-600">Paid</span>
//           </div>
//         )}
//       </div>

//       {/* Total */}
//       <div className="border-t border-gray-200 pt-4 mb-6">
//         <div className="flex justify-between">
//           <span className="text-lg font-medium text-gray-900">Total</span>
//           <span className="text-lg font-bold text-gray-900">$55</span>
//         </div>
//       </div>

//       {/* Bank Details */}
//       {formData.showCompanyBankDetails && (
//         <div className="border-t border-gray-200 pt-4 mb-6">
//           <h4 className="text-sm font-medium text-gray-900 mb-2">
//             Bank Details
//           </h4>
//           <div className="text-xs text-gray-500">
//             <p>Account: 1234567890</p>
//             <p>Bank: Example Bank</p>
//             <p>Swift: EXAMPLEXXX</p>
//           </div>
//         </div>
//       )}

//       {/* Barcode */}
//       {(formData.showCompanyBarCode || formData.showBarcode) && (
//         <div className="text-center mb-4">
//           <div className="bg-gray-900 h-12 w-32 mx-auto flex items-center justify-center">
//             <span className="text-white text-xs">||||| |||| |||||</span>
//           </div>
//           <p className="text-xs text-gray-500 mt-1">1234567890123</p>
//         </div>
//       )}

//       {/* Thank You Message */}
//       <div className="text-center">
//         <p className="text-green-600 font-medium text-sm tracking-wide">
//           {getCustomMessage()}
//         </p>
//       </div>
//     </div>
//   );

//   // Render label view
//   const renderLabel = () => (
//     <div
//       className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm max-w-md"
//       style={{
//         fontFamily: getFontFamily(formData?.fontSize || formData?.fontStyle),
//       }}
//     >
//       {/* Logo/Image Section */}
//       <div className="text-center mb-6">
//         {imageUrl || outlet?.logoUrl ? (
//           <Image
//             width={100}
//             height={100}
//             src={imageUrl || outlet?.logoUrl || ""}
//             alt="Business Logo"
//             className="h-16 w-16 mx-auto mb-4 object-contain"
//           />
//         ) : (
//           <div className="h-16 w-16 mx-auto mb-4 bg-green-500 rounded flex items-center justify-center">
//             <Camera className="w-8 h-8 text-white" />{" "}
//             {/* Fallback placeholder */}
//           </div>
//         )}

//         {getBusinessNameDisplay() && (
//           <h2 className="text-xl font-bold text-gray-900 mb-1">
//             Business Name
//           </h2>
//         )}
//       </div>

//       {/* Label Items */}
//       <div className="space-y-3 mb-6">
//         {formData.labelItems?.map((item: any, index: number) =>
//           item.enabled ? (
//             <div
//               key={index}
//               className="flex justify-between border-b border-gray-100 pb-2"
//             >
//               <span className="text-sm text-gray-500">{item.name}</span>
//               <span className="text-sm font-medium text-gray-900">
//                 {item.name === "Price"
//                   ? "$12.99"
//                   : item.name === "Best Before"
//                   ? "2025-12-31"
//                   : item.name === "Product Weight"
//                   ? "500g"
//                   : item.name === "ManufacturedDate"
//                   ? "2025-07-15"
//                   : "Sample Value"}
//               </span>
//             </div>
//           ) : null
//         )}
//       </div>

//       {/* Custom Business Text */}
//       {getPaymentSuccessDisplay() && (
//         <div className="text-center mb-4">
//           <p className="text-sm text-green-600 font-medium">
//             {formData.customBusinessText || formData.customizeSuccessText}
//           </p>
//         </div>
//       )}

//       {/* Barcode */}
//       {formData.showBarcode && (
//         <div className="text-center mb-4">
//           <div className="bg-gray-900 h-12 w-32 mx-auto flex items-center justify-center">
//             <span className="text-white text-xs">||||| |||| |||||</span>
//           </div>
//           <p className="text-xs text-gray-500 mt-1">1234567890123</p>
//         </div>
//       )}

//       {/* Custom Message */}
//       {formData.customMessage && (
//         <div className="text-center">
//           <p className="text-green-600 font-medium text-sm tracking-wide">
//             {formData.customMessage}
//           </p>
//         </div>
//       )}
//     </div>
//   );

//   return (
//     <div className="ml-8 sticky top-4">
//       <div className="flex items-center gap-2 mb-4">
//         <Camera className="w-5 h-5 text-green-600" />
//         <h3 className="font-medium text-gray-900">Live Preview</h3>
//       </div>

//       {type === "label" ? renderLabel() : renderReceiptInvoice()}
//     </div>
//   );
// };

// export default LabelPreview;
