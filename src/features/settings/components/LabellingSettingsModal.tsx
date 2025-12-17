// import React, { useEffect, useState } from "react";
// import { Modal } from "../ui/Modal";
// import { Switch } from "../ui/Switch";
// import { Dropdown } from "../ui/Dropdown";
// // import { Input } from "../ui/Input";
// import { Button } from "../ui/Button";
// import SettingFiles from "@/assets/icons/settings";
// import LabelPreview from "./LabelPreview";
// import { Loader2 } from "lucide-react";
// import { useUpdateLabelSettingsMutation } from "@/redux/outlets";
// import { useAppSelector } from "@/hooks/redux-hooks";
// import ImageHandler from "@/app/features/components/ImageHandler";

// const fontOptions = [
//   { value: "Times New Roman", label: "Times New Roman" },
//   { value: "Arial", label: "Arial" },
//   { value: "Helvetica", label: "Helvetica" },
//   { value: "Courier New", label: "Courier New" },
// ];

// const paperSizeOptions = [
//   { value: "A4", label: "A4" },
//   { value: "80mm", label: "80mm" },
// ];

// interface LabelSettingsDto {
//   paperSize: "A4" | "80mm" | undefined;
//   fontStyle:
//     | "Times New Roman"
//     | "Arial"
//     | "Helvetica"
//     | "Courier New"
//     | undefined;
//   showBakeryName: boolean;
//   showPaymentSuccessText: boolean;
//   showProductBarCode: boolean;
//   customHeader: string;
//   customSuccessText: string;
//   showTotalPaidAtTop: boolean;
//   customThankYouMessage: string;
//   customizedLogoUrl: string;
//   showLabelName: boolean;
//   showLabelType: boolean;
//   showProductName: boolean;
//   showExpiryDate: boolean;
//   showWeight: boolean;
//   showBatchNumber: boolean;
//   showManufacturingDate: boolean;
//   showIngredientsSummary: boolean;
//   showAllergenInfo: boolean;
//   showPrice: boolean;
// }

// interface LabelItem {
//   name: string;
//   enabled: boolean;
//   key: keyof LabelSettingsDto;
// }

// interface FormData {
//   showBakeryName: boolean;
//   showPaymentSuccess: boolean;
//   fontSize: "Times New Roman" | "Arial" | "Helvetica" | "Courier New";
//   paperSize: "A4" | "80mm";
//   showBarcode: boolean;
//   header: string;
//   customBusinessText: string;
//   showBusinessLine: boolean;
//   labelItems: LabelItem[];
//   customMessage: string;
// }

// interface LabellingSettingsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSuccess: (heading: string, description: string) => void;
//   onError: (heading: string, description: string) => void;
// }

// const defaultFormData: FormData = {
//   showBakeryName: false,
//   showPaymentSuccess: false,
//   fontSize: "Helvetica",
//   paperSize: "A4",
//   showBarcode: true,
//   header: "",
//   customBusinessText: "",
//   showBusinessLine: true,
//   labelItems: [
//     { name: "Label Name", enabled: true, key: "showLabelName" },
//     { name: "Label Type", enabled: true, key: "showLabelType" },
//     { name: "Product Name", enabled: true, key: "showProductName" },
//     { name: "Best Before", enabled: true, key: "showExpiryDate" },
//     { name: "Product Weight", enabled: true, key: "showWeight" },
//     { name: "Best Number", enabled: true, key: "showBatchNumber" },
//     { name: "ManufacturedDate", enabled: true, key: "showManufacturingDate" },
//     { name: "Barcode", enabled: true, key: "showProductBarCode" },
//     { name: "Business Summary", enabled: true, key: "showIngredientsSummary" },
//     { name: "Allergen", enabled: true, key: "showAllergenInfo" },
//     { name: "Price", enabled: true, key: "showPrice" },
//   ],
//   customMessage: "",
// };

// export const LabellingSettingsModal: React.FC<LabellingSettingsModalProps> = ({
//   isOpen,
//   onClose,
//   onSuccess,
//   onError,
// }) => {
//   const outlet = useAppSelector((state) => state.business.outlet);
//   const [formData, setFormData] = useState<FormData>(defaultFormData);
//   const [isSaving, setIsSaving] = useState(false);
//   const [imageUrl, setImageUrl] = useState<string | null>(null);
//   const [logoError, setLogoError] = useState<string | null>(null);

//   const [updateLabelSettings] = useUpdateLabelSettingsMutation();

//   // Initialize form data from API
//   useEffect(() => {
//     if (!isOpen || !outlet?.labelSettings) {
//       setFormData(defaultFormData);
//       setImageUrl(null);
//       return;
//     }

//     const settings = outlet.labelSettings;
//     setFormData({
//       showBakeryName: settings.showBakeryName ?? defaultFormData.showBakeryName,
//       showPaymentSuccess:
//         settings.showPaymentSuccessText ?? defaultFormData.showPaymentSuccess,
//       fontSize:
//         (settings.fontStyle as
//           | "Times New Roman"
//           | "Arial"
//           | "Helvetica"
//           | "Courier New") ?? defaultFormData.fontSize,
//       paperSize:
//         (settings.paperSize as "A4" | "80mm") ?? defaultFormData.paperSize,
//       showBarcode: settings.showProductBarCode ?? defaultFormData.showBarcode,
//       header: settings.customHeader ?? defaultFormData.header,
//       customBusinessText:
//         settings.customSuccessText ?? defaultFormData.customBusinessText,
//       showBusinessLine:
//         settings.showTotalPaidAtTop ?? defaultFormData.showBusinessLine,
//       customMessage:
//         settings.customThankYouMessage ?? defaultFormData.customMessage,
//       labelItems: [
//         {
//           name: "Label Name",
//           enabled: settings.showLabelName ?? true,
//           key: "showLabelName",
//         },
//         {
//           name: "Label Type",
//           enabled: settings.showLabelType ?? true,
//           key: "showLabelType",
//         },
//         {
//           name: "Product Name",
//           enabled: settings.showProductName ?? true,
//           key: "showProductName",
//         },
//         {
//           name: "Best Before",
//           enabled: settings.showExpiryDate ?? true,
//           key: "showExpiryDate",
//         },
//         {
//           name: "Product Weight",
//           enabled: settings.showWeight ?? true,
//           key: "showWeight",
//         },
//         {
//           name: "Best Number",
//           enabled: settings.showBatchNumber ?? true,
//           key: "showBatchNumber",
//         },
//         {
//           name: "ManufacturedDate",
//           enabled: settings.showManufacturingDate ?? true,
//           key: "showManufacturingDate",
//         },
//         {
//           name: "Barcode",
//           enabled: settings.showProductBarCode ?? true,
//           key: "showProductBarCode",
//         },
//         {
//           name: "Business Summary",
//           enabled: settings.showIngredientsSummary ?? true,
//           key: "showIngredientsSummary",
//         },
//         {
//           name: "Allergen",
//           enabled: settings.showAllergenInfo ?? true,
//           key: "showAllergenInfo",
//         },
//         {
//           name: "Price",
//           enabled: settings.showPrice ?? true,
//           key: "showPrice",
//         },
//       ],
//     });
//     setImageUrl(settings.customizedLogoUrl ?? outlet?.logoUrl ?? null);
//     setLogoError(null);
//   }, [isOpen, outlet]);

//   // Reset state when modal closes
//   useEffect(() => {
//     if (!isOpen) {
//       setFormData(defaultFormData);
//       setIsSaving(false);
//       setImageUrl(null);
//       setLogoError(null);
//     }
//   }, [isOpen]);

//   const toggleLabelItem = (index: number) => {
//     setFormData((prev) => ({
//       ...prev,
//       labelItems: prev.labelItems.map((item, i) =>
//         i === index ? { ...item, enabled: !item.enabled } : item
//       ),
//     }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!outlet) {
//       onError("Missing Store ID", "Store information is missing.");
//       return;
//     }

//     setIsSaving(true);
//     try {
//       const labelSettingsDto: LabelSettingsDto = {
//         paperSize: formData.paperSize,
//         fontStyle: formData.fontSize,
//         showBakeryName: formData.showBakeryName,
//         showPaymentSuccessText: formData.showPaymentSuccess,
//         showProductBarCode: formData.showBarcode,
//         customHeader: formData.header,
//         customSuccessText: formData.customBusinessText,
//         showTotalPaidAtTop: formData.showBusinessLine,
//         customThankYouMessage: formData.customMessage,
//         customizedLogoUrl: imageUrl ?? "",
//         showLabelName:
//           formData.labelItems.find((item) => item.key === "showLabelName")
//             ?.enabled ?? true,
//         showLabelType:
//           formData.labelItems.find((item) => item.key === "showLabelType")
//             ?.enabled ?? true,
//         showProductName:
//           formData.labelItems.find((item) => item.key === "showProductName")
//             ?.enabled ?? true,
//         showExpiryDate:
//           formData.labelItems.find((item) => item.key === "showExpiryDate")
//             ?.enabled ?? true,
//         showWeight:
//           formData.labelItems.find((item) => item.key === "showWeight")
//             ?.enabled ?? true,
//         showBatchNumber:
//           formData.labelItems.find((item) => item.key === "showBatchNumber")
//             ?.enabled ?? true,
//         showManufacturingDate:
//           formData.labelItems.find(
//             (item) => item.key === "showManufacturingDate"
//           )?.enabled ?? true,
//         showIngredientsSummary:
//           formData.labelItems.find(
//             (item) => item.key === "showIngredientsSummary"
//           )?.enabled ?? true,
//         showAllergenInfo:
//           formData.labelItems.find((item) => item.key === "showAllergenInfo")
//             ?.enabled ?? true,
//         showPrice:
//           formData.labelItems.find((item) => item.key === "showPrice")
//             ?.enabled ?? true,
//       };

//       await updateLabelSettings({
//         outletId: outlet.id,
//         data: labelSettingsDto,
//       }).unwrap();
//       onSuccess("Save Successful!", "Your Label has been saved successfully");
//       onClose();
//     } catch (error) {
//       const apiError =
//         typeof error === "object" && error !== null
//           ? (error as { data?: { message?: string } })
//           : null;
//       onError(
//         "Failed",
//         apiError?.data?.message ||
//           "An error occurred while updating label settings"
//       );
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <Modal
//       size="xl"
//       subtitle="Customize your product labels"
//       image={SettingFiles.LabelingSettings}
//       isOpen={isOpen}
//       onClose={onClose}
//       title="Labelling"
//     >
//       <section className="flex gap-5">
//         <div className="space-y-6 flex-1/2">
//           <form onSubmit={handleSubmit} className="space-y-6">
//             <div>
//               <div className="flex items-center justify-between">
//                 <h4 className="font-medium mb-4 text-[#1C1B20]">
//                   Label Branding
//                 </h4>
//                 <Switch
//                   checked={formData.showBakeryName}
//                   onChange={(checked) =>
//                     setFormData((prev) => ({
//                       ...prev,
//                       showBakeryName: checked,
//                     }))
//                   }
//                   // disabled={isSaving}
//                 />
//               </div>
//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-[#737373] mb-2">
//                     Label Logo
//                   </label>
//                   <ImageHandler
//                     key={imageUrl || "label-logo-empty"}
//                     value={imageUrl}
//                     label=""
//                     disabled={isSaving}
//                     className="bg-[#FAFAFC]"
//                     previewSize="md"
//                     onChange={({ url }) => {
//                       setImageUrl(url || null);
//                       setLogoError(null);
//                     }}
//                     onError={(error) =>
//                       setLogoError(
//                         error ||
//                           "We couldn't upload that logo. Please try again."
//                       )
//                     }
//                   />
//                   {logoError && (
//                     <p className="text-xs text-red-500 mt-1">{logoError}</p>
//                   )}
//                 </div>
//                 <div className="flex justify-between items-center">
//                   <label className="flex-1 block text-sm font-medium text-[#737373] whitespace-nowrap">
//                     Font Style
//                   </label>
//                   <div className="w-full ml-4">
//                     <Dropdown
//                       className="bg-[#FAFAFC]"
//                       label="Fonts"
//                       options={fontOptions}
//                       selectedValue={formData.fontSize}
//                       placeholder="Select a font"
//                       onChange={(value) =>
//                         setFormData((prev) => ({
//                           ...prev,
//                           fontSize: value as
//                             | "Times New Roman"
//                             | "Arial"
//                             | "Helvetica"
//                             | "Courier New",
//                         }))
//                       }
//                       // disabled={isSaving}
//                     />
//                   </div>
//                 </div>
//                 <div className="flex justify-between items-center">
//                   <label className="flex-1 block text-sm font-medium text-[#737373] whitespace-nowrap">
//                     Paper Size
//                   </label>
//                   <div className="w-full ml-4">
//                     <Dropdown
//                       className="bg-[#FAFAFC]"
//                       label="Paper size"
//                       options={paperSizeOptions}
//                       selectedValue={formData.paperSize}
//                       placeholder="Select Paper size"
//                       onChange={(value) =>
//                         setFormData((prev) => ({
//                           ...prev,
//                           paperSize: value as "A4" | "80mm",
//                         }))
//                       }
//                       // disabled={isSaving}
//                     />
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="border border-dashed border-[#D1D1D1] rounded-[10px] px-3.5 py-2.5">
//               <h4 className="font-medium mb-4 text-[#1C1B20]">Header</h4>
//               <div className="space-y-4">
//                 <div className="flex items-center justify-between">
//                   <label className="text-sm font-medium text-[#737373]">
//                     Show payment Success text
//                   </label>
//                   <Switch
//                     checked={formData.showPaymentSuccess}
//                     onChange={(checked) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         showPaymentSuccess: checked,
//                       }))
//                     }
//                     // disabled={isSaving}
//                   />
//                 </div>

//                 <div className="flex flex-col mt-1.5 gap-1.5">
//                   <label className="text-[#737373] text-sm font-medium">
//                     Customize Success text
//                   </label>
//                   <input
//                     type="text"
//                     value={formData.customBusinessText}
//                     className="outline-none text-[12px] border-2 border-[#D1D1D1] w-full px-3.5 py-2.5 bg-[#FAFAFC] rounded-[10px]"
//                     placeholder="Enter Success text, e.g Payment successful!"
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         customBusinessText: e.target.value,
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
//                     checked={formData.showBusinessLine}
//                     onChange={(checked) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         showBusinessLine: checked,
//                       }))
//                     }
//                     // disabled={isSaving}
//                   />
//                 </div>
//               </div>
//             </div>

//             <div className="border border-dashed border-[#D1D1D1] rounded-[10px] px-3.5 py-2.5">
//               <h4 className="font-medium mb-4 text-[#1C1B20]">
//                 Label Information
//               </h4>
//               <div className="space-y-3">
//                 {formData.labelItems.map((item, index) => (
//                   <div
//                     key={index}
//                     className="flex items-center justify-between"
//                   >
//                     <span className="text-sm text-[#737373]">{item.name}</span>
//                     <Switch
//                       checked={item.enabled}
//                       onChange={() => toggleLabelItem(index)}
//                       // disabled={isSaving}
//                     />
//                   </div>
//                 ))}
//               </div>
//             </div>

//             <div className="border border-dashed border-[#D1D1D1] rounded-[10px] px-3.5 py-4">
//               <label className="block text-sm font-medium text-[#1C1B20] mb-2">
//                 Custom &quot;Thank you&quot; Message
//               </label>
//               <textarea
//                 className="w-full px-3 py-2 border border-[#D1D1D1] rounded-[10px] resize-none outline-none"
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

//             <Button type="submit" className="w-full" disabled={isSaving}>
//               {isSaving ? (
//                 <span className="flex items-center justify-center gap-2">
//                   <Loader2 className="h-4 w-4 animate-spin" />
//                   Saving...
//                 </span>
//               ) : (
//                 "Save Settings"
//               )}
//             </Button>
//           </form>
//         </div>
//         <div className="flex-1/2">
//           <h3 className="font-medium text-[#1C1B20] mb-4">Preview</h3>
//           <LabelPreview formData={formData} imageUrl={imageUrl} />
//         </div>
//       </section>
//     </Modal>
//   );
// };
