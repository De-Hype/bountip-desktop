// import React, { useEffect, useState } from "react";
// import { Modal } from "../ui/Modal";
// import { Switch } from "../ui/Switch";
// import { Dropdown } from "../ui/Dropdown";
// // import { Input } from "../ui/Input";
// import { Loader2 } from "lucide-react";
// import SettingFiles from "@/assets/icons/settings";
// import ReceiptBrandingPreview from "./Previews/ReceiptBrandingPreview";
// import { toast } from "sonner";
// import { useAppSelector } from "@/hooks/redux-hooks";
// import { useUpdateReceiptSettingsMutation } from "@/redux/outlets";

// const fontOptions = [
//   { value: "Times New Roman", label: "Times New Roman" },
//   { value: "Arial", label: "Arial" },
//   { value: "Helvetica", label: "Helvetica" },
//   { value: "Courier", label: "Courier New" },
// ];

// const paperSizeOptions = [
//   { value: "80mm", label: "80mm" },
//   { value: "A4", label: "A4" },
//   { value: "A2", label: "A2" },
//   { value: "A3", label: "A3" },
//   { value: "A1", label: "A1" },
// ];

// const columnOptions = [
//   { value: "orderName", label: "Order Name" },
//   { value: "sku", label: "SKU" },
//   { value: "qty", label: "Quantity" },
//   { value: "subTotal", label: "Subtotal" },
//   { value: "total", label: "Total" },
// ];

// interface ReceiptSettings {
//   showReceiptBranding: boolean; // Fixed typo: was showRecieptBranding
//   showRestaurantName: boolean;
//   fontStyle: string;
//   paperSize: string;
//   showPaymentSuccessText: boolean; // Fixed typo: was showPaymentSucessText
//   customizeSuccessText: string;
//   showTotalPaidAtTop: boolean;
//   showOrderCustomizationName: boolean;
//   showOrderName: boolean;
//   showOrderDateTime: boolean;
//   showCashierName: boolean;
//   showCompanyPhoneNo: boolean;
//   showCompanyEmail: boolean;
//   showCompanyBankDetails: boolean;
//   showCompanyBarCode: boolean;
//   showModifiersBelowItems: boolean;
//   selectedColumns: {
//     orderName: boolean;
//     sku: boolean;
//     qty: boolean;
//     subTotal: boolean;
//     total: boolean;
//   };
//   showDiscountLine: boolean;
//   showTax: boolean;
//   showPaymentMethod: boolean;
//   customMessage: string;
// }

// interface ReceiptSettingsDto {
//   fontStyle: "Times New Roman" | "Arial" | "Helvetica" | "Courier";
//   paperSize: "80mm" | "A4" | "A2" | "A3" | "A1" | undefined;
//   showBakeryName: boolean;
//   showPaymentSuccessText: boolean;
//   customSuccessText: string;
//   showTotalPaidAtTop: boolean;
//   showCustomerName: boolean;
//   showOrderName: boolean;
//   showOrderTime: boolean;
//   showCompanyCashierName: boolean;
//   showCompanyPhoneNumber: boolean;
//   showCompanyEmail: boolean;
//   showCompanyBankDetails: boolean;
//   showCompanyBarcode: boolean;
//   showModifiedBelowItems: boolean;
//   showDiscounts: boolean;
//   showTaxDetails: boolean;
//   showPaymentMethod: boolean;
//   customThankYouMessage: string;
//   selectedColumns: {
//     orderName: boolean;
//     sku: boolean;
//     qty: boolean;
//     subTotal: boolean;
//     total: boolean;
//   };
// }

// interface ReceiptSettingsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSuccess: (heading: string, description: string) => void;
//   onError: (heading: string, description: string) => void;
// }

// const defaultFormData: ReceiptSettings = {
//   showReceiptBranding: true,
//   showRestaurantName: true,
//   fontStyle: "Arial",
//   paperSize: "80mm",
//   showPaymentSuccessText: false,
//   customizeSuccessText: "",
//   showTotalPaidAtTop: false,
//   showOrderCustomizationName: false,
//   showOrderName: true,
//   showOrderDateTime: true,
//   showCashierName: false,
//   showCompanyPhoneNo: false,
//   showCompanyEmail: false,
//   showCompanyBankDetails: false,
//   showCompanyBarCode: false,
//   showModifiersBelowItems: false,
//   selectedColumns: {
//     orderName: true,
//     sku: false,
//     qty: true,
//     subTotal: true,
//     total: true,
//   },
//   showDiscountLine: false,
//   showTax: false,
//   showPaymentMethod: true,
//   customMessage: "Thank you for your business!",
// };

// export const ReceiptSettingsModal: React.FC<ReceiptSettingsModalProps> = ({
//   isOpen,
//   onClose,
//   onSuccess,
//   onError,
// }) => {
//   const outlet = useAppSelector((state) => state.business.outlet);
//   const [formData, setFormData] = useState<ReceiptSettings>(defaultFormData);
//   const [isSaving, setIsSaving] = useState(false);
//   const [imageUrl, setImageUrl] = useState<string | null>(null);
//   const [isClient, setIsClient] = useState(false);

//   // RTK Query hooks

//   const [updateReceiptSettings] = useUpdateReceiptSettingsMutation();

//   // Ensure client-side rendering
//   useEffect(() => {
//     setIsClient(true);
//   }, []);

//   // Initialize form data from API
//   useEffect(() => {
//     if (!isOpen || !outlet) {
//       setFormData(defaultFormData);
//       setImageUrl(null);
//       return;
//     }

//     const settings = outlet.receiptSettings;
//     setFormData({
//       showReceiptBranding:
//         settings?.showLogo ?? defaultFormData.showReceiptBranding,
//       showRestaurantName:
//         settings?.showBakeryName ?? defaultFormData.showRestaurantName,
//       fontStyle: settings?.fontStyle ?? defaultFormData.fontStyle,
//       paperSize: settings?.paperSize ?? defaultFormData.paperSize,
//       showPaymentSuccessText:
//         settings?.showPaymentSuccessText ??
//         defaultFormData.showPaymentSuccessText,
//       customizeSuccessText:
//         settings?.customSuccessText ?? defaultFormData.customizeSuccessText,
//       showTotalPaidAtTop:
//         settings?.showTotalPaidAtTop ?? defaultFormData.showTotalPaidAtTop,
//       showOrderCustomizationName:
//         settings?.showCustomerName ??
//         defaultFormData.showOrderCustomizationName,
//       showOrderName: settings?.showOrderName ?? defaultFormData.showOrderName,
//       showOrderDateTime:
//         settings?.showOrderTime ?? defaultFormData.showOrderDateTime,
//       showCashierName:
//         settings?.showCompanyCashierName ?? defaultFormData.showCashierName,
//       showCompanyPhoneNo:
//         settings?.showCompanyPhoneNumber ?? defaultFormData.showCompanyPhoneNo,
//       showCompanyEmail:
//         settings?.showCompanyEmail ?? defaultFormData.showCompanyEmail,
//       showCompanyBankDetails:
//         settings?.showCompanyBankDetails ??
//         defaultFormData.showCompanyBankDetails,
//       showCompanyBarCode:
//         settings?.showCompanyBarcode ?? defaultFormData.showCompanyBarCode,
//       showModifiersBelowItems:
//         settings?.showModifiedBelowItems ??
//         defaultFormData.showModifiersBelowItems,
//       selectedColumns: {
//         orderName:
//           settings?.selectedColumns?.orderName ??
//           defaultFormData.selectedColumns.orderName,
//         sku:
//           settings?.selectedColumns?.sku ?? defaultFormData.selectedColumns.sku,
//         qty:
//           settings?.selectedColumns?.qty ?? defaultFormData.selectedColumns.qty,
//         subTotal:
//           settings?.selectedColumns?.subTotal ??
//           defaultFormData.selectedColumns.subTotal,
//         total:
//           settings?.selectedColumns?.total ??
//           defaultFormData.selectedColumns.total,
//       },
//       showDiscountLine:
//         settings?.showDiscounts ?? defaultFormData.showDiscountLine,
//       showTax: settings?.showTaxDetails ?? defaultFormData.showTax,
//       showPaymentMethod:
//         settings?.showPaymentMethod ?? defaultFormData.showPaymentMethod,
//       customMessage:
//         settings?.customThankYouMessage ?? defaultFormData.customMessage,
//     });
//     setImageUrl(outlet.logoUrl ?? null);
//   }, [isOpen, outlet]);

//   // Reset state when modal closes
//   useEffect(() => {
//     if (!isOpen) {
//       setFormData(defaultFormData);
//       setIsSaving(false);
//       setImageUrl(null);
//     }
//   }, [isOpen]);

//   // Map formData to SDK-compatible ReceiptSettingsDto
//   const mapFormDataToDto = (): ReceiptSettingsDto => {
//     const getFontStyle = (
//       fontStyle: string
//     ): "Times New Roman" | "Arial" | "Helvetica" | "Courier New" => {
//       const validFonts = [
//         "Times New Roman",
//         "Arial",
//         "Helvetica",
//         "Courier",
//       ] as const;
//       return validFonts.includes(fontStyle as any)
//         ? (fontStyle as any)
//         : "Arial";
//     };

//     const getPaperSize = (
//       paperSize: string
//     ): "80mm" | "A4" | "A2" | "A3" | "A1" | undefined => {
//       const validSizes = ["80mm", "A4", "A2", "A3", "A1"] as const;
//       return validSizes.includes(paperSize as any)
//         ? (paperSize as any)
//         : "80mm";
//     };

//     return {
//       fontStyle: getFontStyle(formData.fontStyle),
//       paperSize: getPaperSize(formData.paperSize),
//       showBakeryName: formData.showRestaurantName,
//       showPaymentSuccessText: formData.showPaymentSuccessText,
//       customSuccessText: formData.customizeSuccessText,
//       showTotalPaidAtTop: formData.showTotalPaidAtTop,
//       showCustomerName: formData.showOrderCustomizationName,
//       showOrderName: formData.showOrderName,
//       showOrderTime: formData.showOrderDateTime,
//       showCompanyCashierName: formData.showCashierName,
//       showCompanyPhoneNumber: formData.showCompanyPhoneNo,
//       showCompanyEmail: formData.showCompanyEmail,
//       showCompanyBankDetails: formData.showCompanyBankDetails,
//       showCompanyBarcode: formData.showCompanyBarCode,
//       showModifiedBelowItems: formData.showModifiersBelowItems,
//       showDiscounts: formData.showDiscountLine,
//       showTaxDetails: formData.showTax,
//       showPaymentMethod: formData.showPaymentMethod,
//       customThankYouMessage: formData.customMessage,
//       selectedColumns: formData.selectedColumns,
//     };
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!outlet?.id) {
//       onError("Missing Outlet ID", "Outlet information is missing.");
//       return;
//     }

//     setIsSaving(true);
//     try {
//       const receiptSettings = mapFormDataToDto();
//       await updateReceiptSettings({
//         outletId: outlet?.id,
//         data: receiptSettings,
//       }).unwrap();
//       toast.success("Successfully updated receipt settings");
//       onSuccess("Save Successful!", "Receipt settings updated successfully.");
//       onClose();
//     } catch (error: any) {
//       onError(
//         "Failed to save settings",
//         error?.data?.message || "Failed to update receipt settings."
//       );
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   if (!isClient) {
//     return null;
//   }

//   return (
//     <Modal
//       size="xl"
//       subtitle="Customize your receipt layout and information"
//       image={SettingFiles.ReceiptIcon}
//       isOpen={isOpen}
//       onClose={onClose}
//       title="Receipt Customization"
//     >
//       <section className="flex gap-5">
//         <div className="space-y-6 flex-1/2">
//           <form onSubmit={handleSubmit} className="space-y-6">
//             <div>
//               <div className="flex items-center justify-between">
//                 <h4 className="font-medium mb-4 text-[#1C1B20]">
//                   Receipt Branding
//                 </h4>
//                 <Switch
//                   checked={formData.showReceiptBranding}
//                   onChange={(checked) =>
//                     setFormData((prev) => ({
//                       ...prev,
//                       showReceiptBranding: checked,
//                     }))
//                   }
//                   // disabled={isSaving}
//                 />
//               </div>
//               <div className="space-y-4">
//                 <div className="flex items-center justify-between">
//                   <label className="text-sm font-medium text-[#737373]">
//                     Show restaurant name
//                   </label>
//                   <Switch
//                     checked={formData.showRestaurantName}
//                     onChange={(checked) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         showRestaurantName: checked,
//                       }))
//                     }
//                     // disabled={isSaving}
//                   />
//                 </div>
//                 <div className="space-y-4">
//                   <div className="flex justify-between items-center">
//                     <label className="flex-1/2 block text-sm font-medium text-[#737373] whitespace-nowrap">
//                       Font Style
//                     </label>
//                     <div className="w-full ml-4">
//                       <Dropdown
//                         className="bg-[#FAFAFC]"
//                         label="Fonts"
//                         options={fontOptions}
//                         selectedValue={formData.fontStyle}
//                         placeholder="Select a font"
//                         onChange={(value) =>
//                           setFormData((prev) => ({
//                             ...prev,
//                             fontStyle: value,
//                           }))
//                         }
//                         // disabled={isSaving}
//                       />
//                     </div>
//                   </div>
//                   <div className="flex justify-between items-center">
//                     <label className="flex-1/2 block text-sm font-medium text-[#737373] whitespace-nowrap">
//                       Paper Size
//                     </label>
//                     <div className="w-full ml-4">
//                       <Dropdown
//                         className="bg-[#FAFAFC]"
//                         label="Paper size"
//                         options={paperSizeOptions}
//                         selectedValue={formData.paperSize}
//                         placeholder="Select Paper size"
//                         onChange={(value) =>
//                           setFormData((prev) => ({
//                             ...prev,
//                             paperSize: value,
//                           }))
//                         }
//                         // disabled={isSaving}
//                       />
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="border border-dashed border-[#D1D1D1] rounded-[10px] px-3.5 py-2.5">
//               <h4 className="font-medium mb-4 text-[#1C1B20]">Header</h4>
//               <div className="space-y-4">
//                 <div className="flex items-center justify-between">
//                   <label className="text-sm font-medium text-[#737373]">
//                     Show payment success text
//                   </label>
//                   <Switch
//                     checked={formData.showPaymentSuccessText}
//                     onChange={(checked) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         showPaymentSuccessText: checked,
//                       }))
//                     }
//                     // disabled={isSaving}
//                   />
//                 </div>
//                 <div className="flex flex-col mt-1.5 gap-1.5">
//                   <label className="text-[#737373] text-sm font-medium">
//                     Customize success text
//                   </label>
//                   <input
//                     type="text"
//                     className="outline-none text-[12px] border-2 border-[#D1D1D1] w-full px-3.5 py-2.5 bg-[#FAFAFC] rounded-[10px]"
//                     placeholder="Enter Success text, e.g Payment successful!"
//                     value={formData.customizeSuccessText}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         customizeSuccessText: e.target.value,
//                       }))
//                     }
//                     disabled={isSaving}
//                   />
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <label className="text-sm font-medium text-[#737373]">
//                     Show total paid at top
//                   </label>
//                   <Switch
//                     checked={formData.showTotalPaidAtTop}
//                     onChange={(checked) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         showTotalPaidAtTop: checked,
//                       }))
//                     }
//                     // disabled={isSaving}
//                   />
//                 </div>
//               </div>
//             </div>

//             <div className="border border-dashed border-[#D1D1D1] rounded-[10px] px-3.5 py-2.5">
//               <h4 className="font-medium mb-4 text-[#1C1B20]">
//                 Order Information
//               </h4>
//               <div className="space-y-3">
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-[#737373]">Order Name</span>
//                   <Switch
//                     checked={formData.showOrderName}
//                     onChange={(checked) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         showOrderName: checked,
//                       }))
//                     }
//                     // disabled={isSaving}
//                   />
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-[#737373]">Date & Time</span>
//                   <Switch
//                     checked={formData.showOrderDateTime}
//                     onChange={(checked) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         showOrderDateTime: checked,
//                       }))
//                     }
//                     // disabled={isSaving}
//                   />
//                 </div>
//               </div>
//             </div>

//             <div className="border border-dashed border-[#D1D1D1] rounded-[10px] px-3.5 py-2.5">
//               <h4 className="font-medium mb-4 text-[#1C1B20]">
//                 Company Information
//               </h4>
//               <div className="space-y-3">
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-[#737373]">Cashier Name</span>
//                   <Switch
//                     checked={formData.showCashierName}
//                     onChange={(checked) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         showCashierName: checked,
//                       }))
//                     }
//                     // disabled={isSaving}
//                   />
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-[#737373]">Phone Number</span>
//                   <Switch
//                     checked={formData.showCompanyPhoneNo}
//                     onChange={(checked) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         showCompanyPhoneNo: checked,
//                       }))
//                     }
//                     // disabled={isSaving}
//                   />
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-[#737373]">Email</span>
//                   <Switch
//                     checked={formData.showCompanyEmail}
//                     onChange={(checked) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         showCompanyEmail: checked,
//                       }))
//                     }
//                     // disabled={isSaving}
//                   />
//                 </div>
//               </div>
//             </div>

//             <div className="border border-dashed border-[#D1D1D1] rounded-[10px] px-3.5 py-2.5">
//               <h4 className="font-medium mb-4 text-[#1C1B20]">
//                 Display Columns
//               </h4>
//               <div className="flex items-center justify-between">
//                 <label className="flex-1/2 text-sm font-medium text-[#737373]">
//                   Select Columns
//                 </label>
//                 <div className="flex-1/2 ml-4">
//                   <Dropdown
//                     mode="checkbox"
//                     label="Select columns to display"
//                     options={columnOptions}
//                     selectedValues={formData.selectedColumns}
//                     onMultiChange={(values) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         selectedColumns: {
//                           orderName: values.orderName || false,
//                           sku: values.sku || false,
//                           qty: values.qty || false,
//                           subTotal: values.subTotal || false,
//                           total: values.total || false,
//                         },
//                       }))
//                     }
//                     placeholder="Select columns to display"
//                     // disabled={isSaving}
//                   />
//                 </div>
//               </div>
//             </div>

//             <div className="border border-dashed border-[#D1D1D1] rounded-[10px] px-3.5 py-2.5">
//               <h4 className="font-medium mb-4 text-[#1C1B20]">
//                 Payment Breakdown
//               </h4>
//               <div className="space-y-3">
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-[#737373]">
//                     Show discount line
//                   </span>
//                   <Switch
//                     checked={formData.showDiscountLine}
//                     onChange={(checked) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         showDiscountLine: checked,
//                       }))
//                     }
//                     // disabled={isSaving}
//                   />
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-[#737373]">Show Tax/VAT</span>
//                   <Switch
//                     checked={formData.showTax}
//                     onChange={(checked) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         showTax: checked,
//                       }))
//                     }
//                     // disabled={isSaving}
//                   />
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-[#737373]">
//                     Show Payment Method
//                   </span>
//                   <Switch
//                     checked={formData.showPaymentMethod}
//                     onChange={(checked) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         showPaymentMethod: checked,
//                       }))
//                     }
//                     // disabled={isSaving}
//                   />
//                 </div>
//               </div>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-[#737373] mb-2">
//                 Custom &quot;Thank you&quot; Message
//               </label>
//               <textarea
//                 className="w-full px-3 py-2 border border-[#D1D1D1] rounded-[10px] resize-none"
//                 rows={3}
//                 value={formData.customMessage}
//                 onChange={(e) =>
//                   setFormData((prev) => ({
//                     ...prev,
//                     customMessage: e.target.value,
//                   }))
//                 }
//                 placeholder="Enter your custom message"
//                 disabled={isSaving}
//               />
//             </div>

//             <button
//               type="submit"
//               disabled={isSaving}
//               className={`bg-[#15BA5C] w-full text-white px-4 py-2 rounded-[10px] transition-colors duration-200 ${
//                 isSaving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
//               }`}
//             >
//               {isSaving ? (
//                 <span className="flex items-center justify-center gap-2">
//                   <Loader2 className="h-4 w-4 animate-spin" />
//                   Saving...
//                 </span>
//               ) : (
//                 "Save Settings"
//               )}
//             </button>
//           </form>
//         </div>
//         <div className="flex-1/2">
//           <h3 className="font-medium text-[#1C1B20] mb-4">Preview</h3>
//           <ReceiptBrandingPreview
//             store={outlet}
//             formData={formData}
//             imageUrl={imageUrl}
//           />
//         </div>
//       </section>
//     </Modal>
//   );
// };
