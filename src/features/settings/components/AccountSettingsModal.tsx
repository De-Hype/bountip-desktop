// import React, { useEffect, useState } from "react";
// import { Modal } from "../ui/Modal";
// import SettingFiles from "@/assets/icons/settings";
// import { Dropdown } from "../ui/Dropdown";
// import { Check, Loader2, Plus, Trash2 } from "lucide-react";
// import { useProductManagementStore } from "@/stores/useProductManagementStore";
// import { skipToken } from "@reduxjs/toolkit/query";
// import { useGetProductsQuery } from "@/redux/products";

// import { TaxApplicationType, TaxScopeType } from "@/types/settingTypes";
// import { CreateTaxDto, UpdateTaxDto } from "@/redux/store/storesTypes";
// import {
//   useCreateServiceChargeMutation,
//   useCreateTaxMutation,
//   useDeleteServiceChargeMutation,
//   useDeleteTaxMutation,
//   useUpdateServiceChargeMutation,
//   useUpdateTaxMutation,
// } from "@/redux/outlets";
// import { useAppSelector } from "@/hooks/redux-hooks";
// import { Outlet } from "@/types/outlet";

// interface DropdownOption {
//   value: string;
//   label: string;
// }

// interface TaxItem {
//   id: string;
//   name: string;
//   rate: string;
//   includeInMenuPrices: boolean;
//   applyAtOrderCheckout: boolean;
//   productSetup: "all" | "categories" | "certain";
//   selectedCategories: Record<string, boolean>;
//   selectedProducts: Record<string, boolean>;
// }

// const parseRateValue = (rate: string | number): number => {
//   if (typeof rate === "number") return rate;
//   const parsed = parseFloat(rate);
//   return Number.isFinite(parsed) ? parsed : NaN;
// };

// export const AccountSettingsModal: React.FC<{
//   isOpen: boolean;
//   onClose: () => void;
//   onSuccess: (heading: string, description: string) => void;
//   onError: (heading: string, description: string) => void;
// }> = ({ isOpen, onClose, onSuccess, onError }) => {
//   const outlet = useAppSelector((state) => state.business.outlet);
//   const [activeTab, setActiveTab] = useState<"taxes" | "service">("taxes");
//   const { categories } = useProductManagementStore();
//   const [taxes, setTaxes] = useState<TaxItem[]>([]);
//   const [categoriesList, setCategoriesList] = useState<DropdownOption[]>([]);
//   const [productOptions, setProductOptions] = useState<DropdownOption[]>([]);
//   const [isLoadingTaxes, setIsLoadingTaxes] = useState(false);
//   const [taxErrors, setTaxErrors] = useState<
//     Record<string, { name: boolean; rate: boolean }>
//   >({});
//   const [serverTaxIds, setServerTaxIds] = useState<Set<string>>(new Set());

//   const [createTax, { isLoading: createTaxLoading }] = useCreateTaxMutation();
//   const [updateTax, { isLoading: updateTaxLoading }] = useUpdateTaxMutation();
//   const [deleteTax, { isLoading: deleteTaxLoading }] = useDeleteTaxMutation();

//   const shouldFetchProducts = Boolean(isOpen && outlet?.id);
//   const productsQueryArgs = shouldFetchProducts
//     ? {
//         outletId: outlet!.id,
//         params: { limit: 500, page: 1 },
//       }
//     : skipToken;
//   const { data: productsResponse } = useGetProductsQuery(productsQueryArgs);

//   // Transform outlet tax data to component format
//   const transformOutletTaxData = (taxData: any[]): TaxItem[] => {
//     if (!taxData || !Array.isArray(taxData)) return [];

//     // Track which IDs came from the server
//     const serverIds = new Set(
//       taxData
//         .map((tax) => tax.id?.toString() || tax._id?.toString())
//         .filter(Boolean)
//     );
//     setServerTaxIds(serverIds);

//     return taxData.map((tax, index) => ({
//       id:
//         tax.id?.toString() ||
//         tax._id?.toString() ||
//         Date.now().toString() + index,
//       name: tax.name || "",
//       rate: tax.rate === 0 ? "0" : tax.rate ? String(tax.rate) : "",
//       includeInMenuPrices: tax.applicationType === TaxApplicationType.INCLUDED,
//       applyAtOrderCheckout: tax.applicationType === TaxApplicationType.CHECKOUT,
//       productSetup:
//         tax.scope === TaxScopeType.ALL
//           ? "all"
//           : tax.scope === TaxScopeType.CATEGORY
//           ? "categories"
//           : "certain",
//       selectedCategories: tax.categoryIdList
//         ? tax.categoryIdList.reduce(
//             (acc: Record<string, boolean>, catId: string) => {
//               acc[catId] = true;
//               return acc;
//             },
//             {}
//           )
//         : tax.selectedCategories || {},
//       selectedProducts: tax.productIdList
//         ? tax.productIdList.reduce(
//             (acc: Record<string, boolean>, productId: string) => {
//               acc[productId] = true;
//               return acc;
//             },
//             {}
//           )
//         : tax.selectedProducts || {},
//     }));
//   };

//   // Load existing tax data when modal opens
//   useEffect(() => {
//     if (!isOpen || !outlet) return;

//     setIsLoadingTaxes(true);
//     try {
//       const currentTaxSettings = outlet.taxSettings;
//       if (currentTaxSettings?.taxes) {
//         const transformedTaxes = transformOutletTaxData(
//           currentTaxSettings.taxes
//         );
//         setTaxes(transformedTaxes);
//       } else {
//         setTaxes([]);
//       }
//     } catch (error) {
//       console.error("Error fetching tax data:", error);
//       onError("Failed to load taxes", "Failed to fetch tax data");
//       setTaxes([]);
//     } finally {
//       setIsLoadingTaxes(false);
//     }
//   }, [isOpen, outlet, onError]);

//   // Fetch categories when component mounts

//   // Update categoriesList when categories change
//   useEffect(() => {
//     if (categories && categories.length > 0) {
//       const mappedCategories = categories.map((item) => ({
//         value: item.toLowerCase().replace(/\s+/g, "-"),
//         label: item,
//       }));
//       setCategoriesList(mappedCategories);
//     }
//   }, [categories]);

//   useEffect(() => {
//     if (productsResponse && productsResponse.data?.data) {
//       const mappedProducts = productsResponse.data.data.map((product) => ({
//         value: product.id,
//         label: product.name || "Unnamed product",
//       }));
//       setProductOptions(mappedProducts);
//     } else if (!shouldFetchProducts) {
//       setProductOptions([]);
//     }
//   }, [productsResponse, shouldFetchProducts]);

//   const addNewTax = () => {
//     const newTax: TaxItem = {
//       id: Date.now().toString(),
//       name: "",
//       rate: "",
//       includeInMenuPrices: true,
//       applyAtOrderCheckout: false,
//       productSetup: "all",
//       selectedCategories: {},
//       selectedProducts: {},
//     };
//     setTaxes([...taxes, newTax]);
//   };

//   const updateTaxLocal = (id: string, updates: Partial<TaxItem>) => {
//     setTaxes(
//       taxes.map((tax) => (tax.id === id ? { ...tax, ...updates } : tax))
//     );
//   };

//   const addNewCategory = async () => {
//     // console.warn("addNewCategory not implemented without SDK");
//   };

//   // const saveTax = async () => {
//   //   if (!storeId) {
//   //     onError("Failed to save tax", "Store ID not available");
//   //     return;
//   //   }
//   //   const errors: Record<string, { name: boolean; rate: boolean }> = {};
//   //   taxes.forEach((tax) => {
//   //     errors[tax.id] = {
//   //       name: !tax.name.trim(),
//   //       rate: tax.rate <= 0 || isNaN(tax.rate),
//   //     };
//   //   });
//   //   setTaxErrors(errors);

//   //   const hasErrors = Object.values(errors).some((err) => err.name || err.rate);
//   //   if (hasErrors) {
//   //     onError("Invalid tax data", "Please provide valid tax names and rates for all taxes");
//   //     return;
//   //   }

//   //   try {
//   //     const results = [];

//   //     for (const item of taxes) {
//   //       const appType: 'checkout' | 'included' | 'excluded' = item.applyAtOrderCheckout
//   //         ? "checkout"
//   //         : item.includeInMenuPrices
//   //           ? "included"
//   //           : "excluded";

//   //       const scope: 'all' | 'category' | 'product' =
//   //         item.productSetup === "categories" && Object.keys(item.selectedCategories).length > 0
//   //           ? TaxScopeType.CATEGORY
//   //           : item.productSetup === "certain"
//   //             ? TaxScopeType.PRODUCT
//   //             : TaxScopeType.ALL;

//   //       // Ensure name is never undefined - validated earlier in saveTax
//   //       const taxData: UpdateTaxDto = {
//   //         name: item.name.trim() || `Tax ${item.id}`,
//   //         rate: item.rate,
//   //         applicationType: appType,
//   //         scope,
//   //       };

//   //       let response;
//   //       if (serverTaxIds.has(item.id)) {
//   //         response = await updateTax({ storeCode: storeId, taxId: item.id, data: taxData }).unwrap();
//   //       } else {
//   //         response = await createTax({ storeCode: storeId, data: taxData }).unwrap();
//   //       }
//   //       results.push(response);
//   //     }

//   //     if (results.every((res) => res?.status)) {
//   //       onSuccess("Save Successful!", "Your Tax has been saved successfully");
//   //     } else {
//   //       onError("Failed to save taxes", "One or more taxes failed to save");
//   //     }
//   //   } catch (error) {
//   //     console.error("Error saving taxes:", error);
//   //     onError("Failed to save taxes", "Failed to save taxes");
//   //   }
//   // };

//   const saveTax = async () => {
//     if (!outlet) {
//       onError("Failed to save tax", "Outlet not available");
//       return;
//     }
//     const errors: Record<string, { name: boolean; rate: boolean }> = {};
//     taxes.forEach((tax) => {
//       const numericRate = parseRateValue(tax.rate);
//       errors[tax.id] = {
//         name: !tax.name.trim(),
//         rate: numericRate <= 0 || isNaN(numericRate),
//       };
//     });
//     setTaxErrors(errors);

//     const hasErrors = Object.values(errors).some((err) => err.name || err.rate);
//     if (hasErrors) {
//       onError(
//         "Invalid tax data",
//         "Please provide valid tax names and rates for all taxes"
//       );
//       return;
//     }

//     try {
//       const results = [];

//       for (const item of taxes) {
//         const numericRate = parseRateValue(item.rate);
//         const appType: "checkout" | "included" | "excluded" =
//           item.applyAtOrderCheckout
//             ? "checkout"
//             : item.includeInMenuPrices
//             ? "included"
//             : "excluded";
//         const selectedCategoryIds = Object.entries(item.selectedCategories)
//           .filter(([, isSelected]) => isSelected)
//           .map(([id]) => id);
//         const selectedProductIds = Object.entries(item.selectedProducts || {})
//           .filter(([, isSelected]) => isSelected)
//           .map(([id]) => id);
//         const hasCategorySelection = selectedCategoryIds.length > 0;
//         const hasProductSelection = selectedProductIds.length > 0;
//         const scope: "all" | "category" | "product" =
//           item.productSetup === "categories" && hasCategorySelection
//             ? TaxScopeType.CATEGORY
//             : item.productSetup === "certain" && hasProductSelection
//             ? TaxScopeType.PRODUCT
//             : TaxScopeType.ALL;

//         let response;
//         if (serverTaxIds.has(item.id)) {
//           // For update, use UpdateTaxDto
//           const updateData: UpdateTaxDto = {
//             name: item.name.trim(),
//             rate: numericRate,
//             applicationType: appType,
//             scope,
//             categoryIdList:
//               scope === TaxScopeType.CATEGORY ? selectedCategoryIds : undefined,
//             productIdList:
//               scope === TaxScopeType.PRODUCT ? selectedProductIds : undefined,
//           };
//           response = await updateTax({
//             outletId: outlet.id,
//             taxId: item.id,
//             data: updateData,
//           }).unwrap();
//         } else {
//           // For create, use CreateTaxDto with all required fields
//           const createData: CreateTaxDto = {
//             name: item.name.trim(),
//             rate: numericRate,
//             applicationType: appType,
//             scope,
//             categoryIdList:
//               scope === TaxScopeType.CATEGORY ? selectedCategoryIds : undefined,
//             productIdList:
//               scope === TaxScopeType.PRODUCT ? selectedProductIds : undefined,
//           };
//           response = await createTax({
//             outletId: outlet.id,
//             data: createData,
//           }).unwrap();
//         }
//         results.push(response);
//       }

//       if (results.every((res) => res?.status)) {
//         onSuccess("Save Successful!", "Your Tax has been saved successfully");
//       } else {
//         onError("Failed to save taxes", "One or more taxes failed to save");
//       }
//     } catch (error) {
//       console.error("Error saving taxes:", error);
//       onError("Failed to save taxes", "Failed to save taxes");
//     }
//   };

//   const deleteTaxLocal = async (id: string) => {
//     if (!outlet) {
//       onError("Failed to delete tax", "Outlet not available");
//       return;
//     }

//     try {
//       await deleteTax({ outletId: outlet.id, taxId: id }).unwrap();
//       setTaxes((prev) => prev.filter((tax) => tax.id !== id));
//       setServerTaxIds((prev) => {
//         const newSet = new Set(prev);
//         newSet.delete(id);
//         return newSet;
//       });
//       onSuccess("Tax Deleted", "Tax has been deleted successfully");
//     } catch (error) {
//       console.error("Error deleting tax:", error);
//       onError("Failed to delete tax", "Failed to delete tax");
//     }
//   };

//   const getErrorMessage = (error: any): string => {
//     if (!error) return "Unknown error";
//     if (
//       "status" in error &&
//       error.data &&
//       typeof error.data === "object" &&
//       "message" in error.data
//     ) {
//       return (error.data as { message: string }).message;
//     }
//     return "An error occurred";
//   };

//   return (
//     <Modal
//       image={SettingFiles.AccountSettings}
//       isOpen={isOpen}
//       onClose={onClose}
//       title="Account Settings"
//       subtitle="Manage your Business tax and service Charge"
//     >
//       {!isLoadingTaxes && (
//         <div className="space-y-6">
//           <div className="flex border-b border-[#E6E6E6]">
//             <button
//               className={`px-4 py-2 font-medium text-sm ${
//                 activeTab === "taxes"
//                   ? "text-green-600 border-b-2 border-green-600"
//                   : "text-gray-500"
//               }`}
//               onClick={() => setActiveTab("taxes")}
//             >
//               Taxes
//             </button>
//             <button
//               className={`px-4 py-2 font-medium text-sm ${
//                 activeTab === "service"
//                   ? "text-green-600 border-b-2 border-green-600"
//                   : "text-gray-500"
//               }`}
//               onClick={() => setActiveTab("service")}
//             >
//               Service Charge
//             </button>
//           </div>
//           {activeTab === "taxes" && (
//             <div className="space-y-6">
//               {taxes.map((tax, index) => (
//                 <TaxItemComponent
//                   key={tax.id}
//                   tax={tax}
//                   index={index}
//                   categories={categoriesList}
//                   products={productOptions}
//                   onUpdate={updateTaxLocal}
//                   onAddCategory={addNewCategory}
//                   onDelete={deleteTaxLocal}
//                   taxErrors={taxErrors[tax.id] || { name: false, rate: false }}
//                 />
//               ))}
//               <button
//                 onClick={addNewTax}
//                 className="w-full cursor-pointer mb-4 px-4 py-3 border border-[#15BA5C] text-[#15BA5C] rounded-lg hover:bg-green-50 transition-colors flex items-center justify-center bg-white"
//               >
//                 <Plus className="h-4 w-4 mr-2" />
//                 Add a new Tax
//               </button>
//               <button
//                 onClick={saveTax}
//                 className="w-full cursor-pointer px-6 py-3 bg-[#15BA5C] text-white font-medium rounded-lg hover:bg-[#13A652] transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
//                 disabled={
//                   taxes.length === 0 || createTaxLoading || updateTaxLoading
//                 }
//               >
//                 {createTaxLoading || updateTaxLoading ? (
//                   <>
//                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                     Saving Tax...
//                   </>
//                 ) : (
//                   <>
//                     <Check className="h-4 w-4 mr-2" />
//                     Save Tax
//                   </>
//                 )}
//               </button>
//             </div>
//           )}
//           {activeTab === "service" && (
//             <ServiceCharge
//               onSuccess={onSuccess}
//               onError={onError}
//               storeId={outlet}
//             />
//           )}
//         </div>
//       )}
//     </Modal>
//   );
// };

// interface TaxItemComponentProps {
//   tax: TaxItem;
//   index: number;
//   categories: DropdownOption[];
//   products: DropdownOption[];
//   onUpdate: (id: string, updates: Partial<TaxItem>) => void;
//   onAddCategory: (categoryName: string) => void;
//   onDelete: (id: string) => void;
//   taxErrors?: { name: boolean; rate: boolean };
// }

// const TaxItemComponent: React.FC<TaxItemComponentProps> = ({
//   tax,
//   index,
//   categories,
//   products,
//   onUpdate,
//   onAddCategory,
//   onDelete,
//   taxErrors,
// }) => {
//   const getTaxTitle = () => {
//     return `Tax ${index + 1}`;
//   };

//   const getNamePlaceholder = () => {
//     return `Tax ${index + 1}`;
//   };

//   return (
//     <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-white">
//       <h3 className="text-lg font-semibold mb-4 text-gray-800">
//         {getTaxTitle()}
//       </h3>
//       <div className="flex items-center gap-4 mb-6">
//         <div className="flex-1">
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Tax Name
//           </label>
//           <input
//             type="text"
//             value={tax.name}
//             onChange={(e) => onUpdate(tax.id, { name: e.target.value })}
//             placeholder={getNamePlaceholder()}
//             className={`outline-none text-[12px] border-2 w-full px-3.5 py-2.5 bg-[#FAFAFC] rounded-[10px] ${
//               taxErrors?.name ? "border-red-500" : "border-[#D1D1D1]"
//             }`}
//           />
//           {taxErrors?.name && (
//             <p className="text-red-500 text-xs mt-1">Tax name is required</p>
//           )}
//         </div>
//         <div className="flex-1">
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Tax Rate (%)
//           </label>
//           <input
//             type="number"
//             value={tax.rate}
//             onChange={(e) => onUpdate(tax.id, { rate: e.target.value })}
//             step="any"
//             placeholder="0"
//             className={`outline-none text-[12px] border-2 w-full px-3.5 py-2.5 bg-[#FAFAFC] rounded-[10px] ${
//               taxErrors?.rate ? "border-red-500" : "border-[#D1D1D1]"
//             }`}
//           />
//           {taxErrors?.rate && (
//             <p className="text-red-500 text-xs mt-1">Valid rate is required</p>
//           )}
//         </div>
//         <div className="">
//           <label className="block h-[20px] text-sm font-medium text-gray-700 mb-2"></label>
//           <button
//             type="button"
//             className="border border-[#E33629] h-[40px] w-[45px] rounded-[10px] flex items-center justify-center cursor-pointer hover:bg-red-50 transition"
//             onClick={() => onDelete(tax.id)}
//             title="Delete Tax"
//           >
//             <Trash2 className="w-4 h-4 text-red-500" />
//           </button>
//         </div>
//       </div>
//       <div className="space-y-3">
//         <div className="flex items-center">
//           <div className="relative">
//             <input
//               type="radio"
//               id={`includeInMenuPrices-${tax.id}`}
//               name={`applicationType-${tax.id}`}
//               checked={tax.includeInMenuPrices}
//               onChange={(e) =>
//                 onUpdate(tax.id, {
//                   includeInMenuPrices: e.target.checked,
//                   applyAtOrderCheckout: !e.target.checked,
//                 })
//               }
//               className="sr-only"
//             />
//             <label
//               htmlFor={`includeInMenuPrices-${tax.id}`}
//               className="flex items-center cursor-pointer"
//             >
//               <div
//                 className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
//                   tax.includeInMenuPrices
//                     ? "border-[#15BA5C] bg-[#15BA5C]"
//                     : "border-gray-300"
//                 }`}
//               >
//                 {tax.includeInMenuPrices && (
//                   <div className="w-2 h-2 rounded-full bg-white"></div>
//                 )}
//               </div>
//               <span className="text-sm text-gray-700">
//                 Include Tax in Menu Prices
//               </span>
//             </label>
//           </div>
//         </div>
//         <div className="flex items-center">
//           <div className="relative">
//             <input
//               type="radio"
//               id={`applyAtOrderCheckout-${tax.id}`}
//               name={`applicationType-${tax.id}`}
//               checked={tax.applyAtOrderCheckout}
//               onChange={(e) =>
//                 onUpdate(tax.id, {
//                   applyAtOrderCheckout: e.target.checked,
//                   includeInMenuPrices: !e.target.checked,
//                 })
//               }
//               className="sr-only"
//             />
//             <label
//               htmlFor={`applyAtOrderCheckout-${tax.id}`}
//               className="flex items-center cursor-pointer"
//             >
//               <div
//                 className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
//                   tax.applyAtOrderCheckout
//                     ? "border-[#15BA5C] bg-[#15BA5C]"
//                     : "border-gray-300"
//                 }`}
//               >
//                 {tax.applyAtOrderCheckout && (
//                   <div className="w-2 h-2 rounded-full bg-white"></div>
//                 )}
//               </div>
//               <span className="text-sm text-gray-700">
//                 Apply Tax at order checkout
//               </span>
//             </label>
//           </div>
//         </div>
//       </div>
//       <div className="space-y-4 mt-4">
//         <h4 className="font-medium text-gray-700">Product Setup</h4>
//         <div className="space-y-3">
//           <div className="flex items-center">
//             <div className="relative">
//               <input
//                 type="radio"
//                 id={`productSetup-all-${tax.id}`}
//                 name={`productSetup-${tax.id}`}
//                 checked={tax.productSetup === "all"}
//                 onChange={() => onUpdate(tax.id, { productSetup: "all" })}
//                 className="sr-only"
//               />
//               <label
//                 htmlFor={`productSetup-all-${tax.id}`}
//                 className="flex items-center cursor-pointer"
//               >
//                 <div
//                   className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
//                     tax.productSetup === "all"
//                       ? "border-[#15BA5C] bg-[#15BA5C]"
//                       : "border-gray-300"
//                   }`}
//                 >
//                   {tax.productSetup === "all" && (
//                     <div className="w-2 h-2 rounded-full bg-white"></div>
//                   )}
//                 </div>
//                 <span className="text-sm text-gray-700">
//                   Apply to all products
//                 </span>
//               </label>
//             </div>
//           </div>
//           <div className="flex items-center">
//             <div className="relative">
//               <input
//                 type="radio"
//                 id={`productSetup-categories-${tax.id}`}
//                 name={`productSetup-${tax.id}`}
//                 checked={tax.productSetup === "categories"}
//                 onChange={() =>
//                   onUpdate(tax.id, { productSetup: "categories" })
//                 }
//                 className="sr-only"
//               />
//               <label
//                 htmlFor={`productSetup-categories-${tax.id}`}
//                 className="flex items-center cursor-pointer"
//               >
//                 <div
//                   className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
//                     tax.productSetup === "categories"
//                       ? "border-[#15BA5C] bg-[#15BA5C]"
//                       : "border-gray-300"
//                   }`}
//                 >
//                   {tax.productSetup === "categories" && (
//                     <div className="w-2 h-2 rounded-full bg-white"></div>
//                   )}
//                 </div>
//                 <span className="text-sm text-gray-700">
//                   Apply to all Categories
//                 </span>
//               </label>
//             </div>
//           </div>
//           <div className="flex items-center">
//             <div className="relative">
//               <input
//                 type="radio"
//                 id={`productSetup-certain-${tax.id}`}
//                 name={`productSetup-${tax.id}`}
//                 checked={tax.productSetup === "certain"}
//                 onChange={() => onUpdate(tax.id, { productSetup: "certain" })}
//                 className="sr-only"
//               />
//               <label
//                 htmlFor={`productSetup-certain-${tax.id}`}
//                 className="flex items-center cursor-pointer"
//               >
//                 <div
//                   className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
//                     tax.productSetup === "certain"
//                       ? "border-[#15BA5C] bg-[#15BA5C]"
//                       : "border-gray-300"
//                   }`}
//                 >
//                   {tax.productSetup === "certain" && (
//                     <div className="w-2 h-2 rounded-full bg-white"></div>
//                   )}
//                 </div>
//                 <span className="text-sm text-gray-700">
//                   Apply to certain products
//                 </span>
//               </label>
//             </div>
//           </div>
//         </div>
//         {tax.productSetup === "categories" && (
//           <div className="mt-4">
//             <Dropdown
//               mode="checkbox"
//               options={categories}
//               selectedValues={tax.selectedCategories}
//               onMultiChange={(values) =>
//                 onUpdate(tax.id, { selectedCategories: values })
//               }
//               placeholder="Select All that apply"
//               label="Categories"
//               allowAddNew={true}
//               onAddNew={onAddCategory}
//               addNewLabel="Add Category"
//               className="w-full"
//             />
//           </div>
//         )}
//         {tax.productSetup === "certain" && (
//           <div className="mt-4">
//             <Dropdown
//               mode="checkbox"
//               options={products}
//               selectedValues={tax.selectedProducts}
//               onMultiChange={(values) =>
//                 onUpdate(tax.id, { selectedProducts: values })
//               }
//               placeholder="Select products"
//               label="Products"
//               className="w-full"
//             />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// interface ServiceChargeProps {
//   onSuccess: (heading: string, description: string) => void;
//   onError: (heading: string, description: string) => void;
//   storeId: Outlet | null;
// }

// const ServiceCharge: React.FC<ServiceChargeProps> = ({
//   onSuccess,
//   onError,
//   storeId,
// }) => {
//   const outlet = useAppSelector((state) => state.business.outlet);
//   const [serviceName, setServiceName] = useState("");
//   const [serviceRate, setServiceRate] = useState("");
//   const [selectedOption, setSelectedOption] = useState<
//     "included" | "checkout" | "excluded"
//   >("included");
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [serviceChargeId, setServiceChargeId] = useState<string | null>(null);
//   const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);

//   const [createServiceChargeMutation] = useCreateServiceChargeMutation();
//   const [updateServiceChargeMutation] = useUpdateServiceChargeMutation();
//   const [deleteServiceChargeMutation] = useDeleteServiceChargeMutation();

//   // Load existing service charge data
//   useEffect(() => {
//     if (!storeId || !isInitialLoad || !outlet) return;

//     try {
//       const charges = outlet.serviceCharges?.charges;
//       if (charges && charges.length > 0) {
//         const firstCharge = charges[0];
//         if (firstCharge?.id) setServiceChargeId(firstCharge.id);
//         if (firstCharge?.name) setServiceName(firstCharge.name);
//         if (firstCharge?.rate !== undefined)
//           setServiceRate(String(firstCharge.rate));
//         if (firstCharge?.applicationType) {
//           setSelectedOption(
//             firstCharge.applicationType as "included" | "checkout" | "excluded"
//           );
//         }
//       }
//     } catch (error) {
//       console.error("Error fetching service charge:", error);
//       onError(
//         "Failed to load service charge",
//         "Failed to fetch service charge data"
//       );
//     } finally {
//       setIsInitialLoad(false);
//     }
//   }, [storeId, outlet, onError, isInitialLoad]);

//   const handleSubmit = async (e?: React.FormEvent) => {
//     if (e) e.preventDefault();
//     if (!storeId) {
//       onError("Failed to save service charge", "Store ID not available");
//       return;
//     }

//     if (!serviceName.trim()) {
//       onError("Invalid input", "Service charge name is required");
//       return;
//     }

//     const rate = parseFloat(serviceRate);
//     if (isNaN(rate) || rate < 0) {
//       onError("Invalid input", "Please provide a valid service charge rate");
//       return;
//     }

//     setIsLoading(true);
//     try {
//       const chargeData = {
//         name: serviceName.trim(),
//         rate,
//         applicationType: selectedOption,
//       };

//       let response;
//       if (serviceChargeId) {
//         response = await updateServiceChargeMutation({
//           outletId: outlet?.id || "",
//           chargeId: serviceChargeId,
//           data: {
//             name: chargeData.name,
//             rate: chargeData.rate,
//           },
//         }).unwrap();
//       } else {
//         response = await createServiceChargeMutation({
//           outletId: outlet?.id || "",
//           data: chargeData,
//         }).unwrap();
//         if (response?.status && response.data?.id) {
//           setServiceChargeId(response.data.id);
//         }
//       }

//       if (response?.status) {
//         onSuccess(
//           serviceChargeId ? "Service Charge Updated" : "Service Charge Created",
//           `Service Charge has been ${
//             serviceChargeId ? "updated" : "created"
//           } successfully`
//         );
//       } else {
//         onError(
//           "Failed to save service charge",
//           response?.message || "Failed to save service charge"
//         );
//       }
//     } catch (error) {
//       console.error("Error saving service charge:", error);
//       onError("Failed to save service charge", "Failed to save service charge");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleDelete = async () => {
//     if (!storeId || !serviceChargeId) {
//       onError(
//         "Failed to delete service charge",
//         "Service charge ID or store ID not available"
//       );
//       return;
//     }

//     try {
//       const response = await deleteServiceChargeMutation({
//         outletId: outlet?.id || "",
//         chargeId: serviceChargeId,
//       }).unwrap();
//       if (response?.status) {
//         onSuccess(
//           "Service Charge Deleted",
//           "Service Charge has been deleted successfully"
//         );
//         setServiceName("");
//         setServiceRate("");
//         setServiceChargeId(null);
//         setSelectedOption("included");
//       } else {
//         onError(
//           "Failed to delete service charge",
//           response?.message || "Failed to delete service charge"
//         );
//       }
//     } catch (error) {
//       console.error("Error deleting service charge:", error);
//       onError(
//         "Failed to delete service charge",
//         "Failed to delete service charge"
//       );
//     }
//   };

//   return (
//     <div className="bg-white p-3 rounded-lg">
//       <div className="border border-[#E6E6E6] rounded-[10px] mb-7 relative px-5 py-9">
//         <h2 className="text-lg font-semibold bg-white text-gray-900 mb-6 absolute z-50 -top-3.5">
//           Service Charge
//         </h2>
//         <form onSubmit={handleSubmit} className="space-y-6">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label
//                 htmlFor="serviceName"
//                 className="block text-sm font-medium text-gray-700 mb-2"
//               >
//                 Service Charge Name
//               </label>
//               <input
//                 type="text"
//                 id="serviceName"
//                 value={serviceName}
//                 onChange={(e) => setServiceName(e.target.value)}
//                 placeholder="Enter name of Service Charge"
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
//                 required
//                 disabled={isLoading}
//               />
//             </div>
//             <div>
//               <label
//                 htmlFor="serviceRate"
//                 className="block text-sm font-medium text-gray-700 mb-2"
//               >
//                 Service Charge Rate (%)
//               </label>
//               <input
//                 type="number"
//                 id="serviceRate"
//                 value={serviceRate}
//                 onChange={(e) => setServiceRate(e.target.value)}
//                 placeholder="0.00"
//                 step="0.01"
//                 min="0"
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
//                 required
//                 disabled={isLoading}
//               />
//             </div>
//           </div>
//           <div className="space-y-3">
//             <div className="flex items-center">
//               <div className="relative">
//                 <input
//                   type="radio"
//                   id="includeMenu"
//                   name="serviceChargeOption"
//                   value="included"
//                   checked={selectedOption === "included"}
//                   onChange={(e) =>
//                     setSelectedOption(
//                       e.target.value as "included" | "checkout" | "excluded"
//                     )
//                   }
//                   className="sr-only"
//                   disabled={isLoading}
//                 />
//                 <label
//                   htmlFor="includeMenu"
//                   className="flex items-center cursor-pointer"
//                 >
//                   <div
//                     className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
//                       selectedOption === "included"
//                         ? "border-green-500 bg-green-500"
//                         : "border-gray-300"
//                     }`}
//                   >
//                     {selectedOption === "included" && (
//                       <div className="w-2 h-2 rounded-full bg-white"></div>
//                     )}
//                   </div>
//                   <span className="text-sm text-gray-900">
//                     Include Service Charge in Menu Prices
//                   </span>
//                 </label>
//               </div>
//             </div>
//             <div className="flex items-center">
//               <div className="relative">
//                 <input
//                   type="radio"
//                   id="applyCheckout"
//                   name="serviceChargeOption"
//                   value="checkout"
//                   checked={selectedOption === "checkout"}
//                   onChange={(e) =>
//                     setSelectedOption(
//                       e.target.value as "included" | "checkout" | "excluded"
//                     )
//                   }
//                   className="sr-only"
//                   disabled={isLoading}
//                 />
//                 <label
//                   htmlFor="applyCheckout"
//                   className="flex items-center cursor-pointer"
//                 >
//                   <div
//                     className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
//                       selectedOption === "checkout"
//                         ? "border-green-500 bg-green-500"
//                         : "border-gray-300"
//                     }`}
//                   >
//                     {selectedOption === "checkout" && (
//                       <div className="w-2 h-2 rounded-full bg-white"></div>
//                     )}
//                   </div>
//                   <span className="text-sm text-gray-900">
//                     Apply Service Charge at Order checkout
//                   </span>
//                 </label>
//               </div>
//             </div>
//             <div className="flex items-center">
//               <div className="relative">
//                 <input
//                   type="radio"
//                   id="applyTax"
//                   name="serviceChargeOption"
//                   value="excluded"
//                   checked={selectedOption === "excluded"}
//                   onChange={(e) =>
//                     setSelectedOption(
//                       e.target.value as "included" | "checkout" | "excluded"
//                     )
//                   }
//                   className="sr-only"
//                   disabled={isLoading}
//                 />
//                 <label
//                   htmlFor="applyTax"
//                   className="flex items-center cursor-pointer"
//                 >
//                   <div
//                     className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
//                       selectedOption === "excluded"
//                         ? "border-green-500 bg-green-500"
//                         : "border-gray-300"
//                     }`}
//                   >
//                     {selectedOption === "excluded" && (
//                       <div className="w-2 h-2 rounded-full bg-white"></div>
//                     )}
//                   </div>
//                   <span className="text-sm text-gray-900">
//                     Apply Tax at order checkout (optional)
//                   </span>
//                 </label>
//               </div>
//             </div>
//           </div>
//         </form>
//       </div>
//       <div className="flex gap-4">
//         <button
//           onClick={handleSubmit}
//           type="button"
//           className="w-full bg-[#15BA5C] cursor-pointer hover:bg-green-600 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
//           disabled={isLoading || !serviceName.trim() || !serviceRate.trim()}
//         >
//           {isLoading ? (
//             <span className="flex items-center justify-center gap-2">
//               <Loader2 className="w-4 h-4 animate-spin" /> Saving...
//             </span>
//           ) : serviceChargeId ? (
//             "Update Service Charge"
//           ) : (
//             "Create Service Charge"
//           )}
//         </button>
//         {serviceChargeId && (
//           <button
//             onClick={handleDelete}
//             type="button"
//             className="w-full border border-[#E33629] text-[#E33629] font-medium py-3 px-4 rounded-md hover:bg-red-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
//             disabled={isLoading}
//           >
//             Delete Service Charge
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };
