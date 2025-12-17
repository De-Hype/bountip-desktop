// // import React, { useState, useEffect } from "react";
// // import { BusinessOperation, BankAccount } from "./types";
// // import {
// //   useGetStoreDetailsQuery,
// //   useUpdateStoreOperationsMutation,
// // } from "@/redux/store/store-setting";
// // import { useAppSelector } from "@/hooks/redux-hooks";

// // interface BusinessOperationsSectionProps {
// //   businessOperation: BusinessOperation;
// //   bankAccount: BankAccount | null;
// //   onBusinessOperationChange: (operation: BusinessOperation) => void;
// //   onBankAccountChange: (account: BankAccount | null) => void;
// //   onBack: () => void;
// //   onContinue: () => void;
// // }

// // interface BusinessOperationData {
// //   delivery: boolean;
// //   pickup: boolean;
// // }

// // export default function BusinessOperationsSection({
// //   bankAccount,
// //   onBusinessOperationChange,
// //   onBankAccountChange,
// //   onBack,
// //   onContinue,
// // }: BusinessOperationsSectionProps) {
// //   const outlet = useAppSelector((state) => state.business.outlet);
// //   const { data: storeData } = useGetStoreDetailsQuery(outlet?.id || "");
// //   const [updateStoreOperations, { isLoading }] =
// //     useUpdateStoreOperationsMutation();

// //   // Internal state for business operation as boolean flags
// //   const [internalBusinessOperation, setInternalBusinessOperation] =
// //     useState<BusinessOperationData>({
// //       delivery: false,
// //       pickup: false,
// //     });

// //   // Internal state for bank account
// //   const [internalBankAccount, setInternalBankAccount] = useState<BankAccount>({
// //     bankName: "",
// //     accountNumber: "",
// //     accountName: "",
// //     iban: "",
// //     swiftCode: "",
// //     sortCode: "",
// //   });

// //   // Initialize internal state when props change
// //   useEffect(() => {
// //     if (storeData?.data) {
// //       const operationData: BusinessOperationData = {
// //         delivery: storeData.data.businessOperation.delivery || false,
// //         pickup: storeData.data.businessOperation.pickup || false,
// //       };
// //       setInternalBusinessOperation(operationData);
// //     }
// //   }, [storeData]);

// //   useEffect(() => {
// //     if (bankAccount) {
// //       setInternalBankAccount(bankAccount);
// //     } else if (storeData?.data?.bankDetails) {
// //       setInternalBankAccount({
// //         bankName: storeData.data.bankDetails.bankName || "",
// //         accountNumber: storeData.data.bankDetails.accountNumber || "",
// //         accountName: storeData.data.bankDetails.accountName || "",
// //         iban: storeData.data.bankDetails.iban || "",
// //         swiftCode: storeData.data.bankDetails.swiftCode || "",
// //         sortCode: storeData.data.bankDetails.sortCode || "",
// //       });
// //     }
// //   }, [bankAccount, storeData]);

// //   // Handle business operation changes
// //   const handleDeliveryChange = (checked: boolean) => {
// //     const newOperationData = {
// //       ...internalBusinessOperation,
// //       delivery: checked,
// //     };

// //     setInternalBusinessOperation(newOperationData);
// //   };

// //   const handlePickupChange = (checked: boolean) => {
// //     const newOperationData = {
// //       ...internalBusinessOperation,
// //       pickup: checked,
// //     };

// //     setInternalBusinessOperation(newOperationData);
// //   };

// //   const handleBothChange = (checked: boolean) => {
// //     const newOperationData = {
// //       delivery: checked,
// //       pickup: checked,
// //     };

// //     setInternalBusinessOperation(newOperationData);
// //   };

// //   // Handle bank account changes
// //   const handleBankAccountChange = (field: keyof BankAccount, value: string) => {
// //     const updatedAccount = {
// //       ...internalBankAccount,
// //       [field]: value,
// //     };

// //     setInternalBankAccount(updatedAccount);
// //     onBankAccountChange(updatedAccount);
// //   };

// //   const handleSaveAndContinue = async () => {
// //     try {
// //       // Prepare data for API call - use the boolean flags directly
// //       const updateData = {
// //         delivery: internalBusinessOperation.delivery,
// //         pickup: internalBusinessOperation.pickup,
// //         bankName: internalBankAccount.bankName || undefined,
// //         accountName: internalBankAccount.accountName || undefined,
// //         accountNumber: internalBankAccount.accountNumber || undefined,
// //         iban: internalBankAccount.iban || undefined,
// //         swiftCode: internalBankAccount.swiftCode || undefined,
// //         sortCode: internalBankAccount.sortCode || undefined,
// //       };

// //       // Remove undefined values
// //       const filteredData = Object.fromEntries(
// //         Object.entries(updateData).filter(([_, value]) => value !== undefined)
// //       );

// //       // Update store operations
// //       if (outlet?.id) {
// //         await updateStoreOperations({
// //           outletId: outlet.id,
// //           payload: updateData,
// //         }).unwrap();
// //       }

// //       // Call the original continue handler
// //       onContinue();
// //     } catch (error) {
// //       console.error("Failed to save business operations:", error);
// //       // Handle error (show toast notification)
// //     }
// //   };

// //   // Helper to check if "both" is selected
// //   const isBothSelected =
// //     internalBusinessOperation.delivery && internalBusinessOperation.pickup;

// //   return (
// //     <div>
// //       <h2 className="text-2xl font-bold text-gray-900 mb-8">
// //         Set your business operations
// //       </h2>

// //       {/* Business Operation Type */}
// //       <div className="mb-8">
// //         <div className="flex items-center gap-6 mb-4">
// //           <label className="flex items-center gap-2 cursor-pointer">
// //             <input
// //               type="checkbox"
// //               checked={internalBusinessOperation.delivery}
// //               onChange={(e) => handleDeliveryChange(e.target.checked)}
// //               className="w-5 h-5 text-[#15BA5C] rounded focus:ring-[#15BA5C]"
// //             />
// //             <span className="text-gray-900 font-medium">Delivery</span>
// //           </label>

// //           <label className="flex items-center gap-2 cursor-pointer">
// //             <input
// //               type="checkbox"
// //               checked={internalBusinessOperation.pickup}
// //               onChange={(e) => handlePickupChange(e.target.checked)}
// //               className="w-5 h-5 text-[#15BA5C] rounded focus:ring-[#15BA5C]"
// //             />
// //             <span className="text-gray-900 font-medium">Pickup</span>
// //           </label>

// //           <label className="flex items-center gap-2 cursor-pointer">
// //             <input
// //               type="checkbox"
// //               checked={isBothSelected}
// //               onChange={(e) => handleBothChange(e.target.checked)}
// //               className="w-5 h-5 text-[#15BA5C] rounded focus:ring-[#15BA5C]"
// //             />
// //             <span className="text-gray-900 font-medium">Both</span>
// //           </label>
// //         </div>
// //         <p className="text-sm text-gray-500">
// //           You can select one or both. Depends on how you want your business to
// //           run
// //         </p>
// //       </div>

// //       {/* Bank Details */}
// //       <div className="mb-8">
// //         <h3 className="text-lg font-semibold text-gray-900 mb-6">
// //           Bank Details
// //         </h3>

// //         <div className="p-6 border border-gray-200 rounded-lg">
// //           <div className="grid grid-cols-2 gap-4 mb-4">
// //             <div>
// //               <label className="block text-sm font-medium text-gray-900 mb-2">
// //                 Bank Name
// //               </label>
// //               <input
// //                 type="text"
// //                 value={internalBankAccount.bankName}
// //                 onChange={(e) =>
// //                   handleBankAccountChange("bankName", e.target.value)
// //                 }
// //                 placeholder="Enter bank name"
// //                 className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C]"
// //               />
// //             </div>

// //             <div>
// //               <label className="block text-sm font-medium text-gray-900 mb-2">
// //                 Account Number
// //               </label>
// //               <input
// //                 type="text"
// //                 value={internalBankAccount.accountNumber}
// //                 onChange={(e) =>
// //                   handleBankAccountChange("accountNumber", e.target.value)
// //                 }
// //                 placeholder="Enter account number"
// //                 className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C]"
// //               />
// //             </div>
// //             <div className="mb-4">
// //               <label className="block text-sm font-medium text-gray-900 mb-2">
// //                 Account Name
// //               </label>
// //               <input
// //                 type="text"
// //                 value={internalBankAccount.accountName}
// //                 onChange={(e) =>
// //                   handleBankAccountChange("accountName", e.target.value)
// //                 }
// //                 placeholder="Enter account name"
// //                 className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C]"
// //               />
// //             </div>
// //           </div>

// //           {/* <div className="grid grid-cols-3 gap-4 mb-4">
// //             <div>
// //               <label className="block text-sm font-medium text-gray-900 mb-2">
// //                 IBAN
// //               </label>
// //               <input
// //                 type="text"
// //                 value={internalBankAccount.iban}
// //                 onChange={(e) =>
// //                   handleBankAccountChange("iban", e.target.value)
// //                 }
// //                 placeholder="Enter IBAN"
// //                 className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C]"
// //               />
// //             </div>

// //             <div>
// //               <label className="block text-sm font-medium text-gray-900 mb-2">
// //                 SWIFT Code
// //               </label>
// //               <input
// //                 type="text"
// //                 value={internalBankAccount.swiftCode}
// //                 onChange={(e) =>
// //                   handleBankAccountChange("swiftCode", e.target.value)
// //                 }
// //                 placeholder="Enter SWIFT code"
// //                 className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C]"
// //               />
// //             </div>

// //             <div>
// //               <label className="block text-sm font-medium text-gray-900 mb-2">
// //                 Sort Code
// //               </label>
// //               <input
// //                 type="text"
// //                 value={internalBankAccount.sortCode}
// //                 onChange={(e) =>
// //                   handleBankAccountChange("sortCode", e.target.value)
// //                 }
// //                 placeholder="Enter sort code"
// //                 className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C]"
// //               />
// //             </div>
// //           </div> */}
// //         </div>
// //       </div>

// //       <div className="flex gap-4">
// //         <button
// //           onClick={onBack}
// //           className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
// //         >
// //           Back
// //         </button>
// //         <button
// //           onClick={handleSaveAndContinue}
// //           disabled={isLoading}
// //           className="flex-1 py-3 bg-[#15BA5C] text-white rounded-lg hover:bg-[#13A652] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
// //         >
// //           {isLoading ? "Saving..." : "Save and Continue"}
// //         </button>
// //       </div>
// //     </div>
// //   );
// // }

// "use client";
// import React, { useState, useEffect } from "react";
// import { BusinessOperation, BankAccount } from "./types";
// import {
//   useGetStoreDetailsQuery,
//   useUpdateStoreOperationsMutation,
// } from "@/redux/store/store-setting";
// import { useAppSelector } from "@/hooks/redux-hooks";
// import { getBanksByCountry, getCountryName } from "./banks";
// import { TimeDropdownSplit } from "@/components/Modals/Settings/components/TimeDropdownSplit";
// import { Switch } from "@/components/Modals/Settings/ui/Switch";
// import {
//   DurationPicker,
//   DurationValue,
// } from "@/app/features/components/date-time/DurationPicker";

// interface BusinessOperationsSectionProps {
//   businessOperation: BusinessOperation;
//   bankAccount: BankAccount | null;
//   onBusinessOperationChange: (operation: BusinessOperation) => void;
//   onBankAccountChange: (account: BankAccount | null) => void;
//   onBack: () => void;
//   onContinue: () => void;
// }

// interface BusinessOperationData {
//   delivery: boolean;
//   pickup: boolean;
// }

// interface DayHours {
//   day: string;
//   enabled: boolean;
//   openTime: string;
//   closeTime: string;
// }

// const DAYS_OF_WEEK = [
//   "sunday",
//   "monday",
//   "tuesday",
//   "wednesday",
//   "thursday",
//   "friday",
//   "saturday",
// ];

// const getDefaultOperatingHours = (): DayHours[] => {
//   return DAYS_OF_WEEK.map((day) => ({
//     day: day.charAt(0).toUpperCase() + day.slice(1),
//     enabled: false,
//     openTime: "09:00",
//     closeTime: "17:00",
//   }));
// };

// // Lead time helpers
// const secondsToDuration = (seconds: number): DurationValue => {
//   const safeSeconds = Math.max(0, Number(seconds) || 0);
//   const day = Math.floor(safeSeconds / 86400);
//   const remAfterDays = safeSeconds % 86400;
//   const hours = Math.floor(remAfterDays / 3600);
//   const minutes = Math.floor((remAfterDays % 3600) / 60);
//   return { day, hours, minutes };
// };

// const durationToSeconds = (value: DurationValue): number => {
//   const d = Math.max(0, Number(value.day) || 0);
//   const h = Math.max(0, Number(value.hours) || 0);
//   const m = Math.max(0, Number(value.minutes) || 0);
//   return d * 86400 + h * 3600 + m * 60;
// };

// export default function BusinessOperationsSection({
//   bankAccount,
//   onBusinessOperationChange,
//   onBankAccountChange,
//   onBack,
//   onContinue,
// }: BusinessOperationsSectionProps) {
//   const outlet = useAppSelector((state) => state.business.outlet);
//   const { data: storeData, refetch } = useGetStoreDetailsQuery(
//     outlet?.id || "",
//     {
//       refetchOnMountOrArgChange: true,
//     }
//   );
//   const [updateStoreOperations, { isLoading }] =
//     useUpdateStoreOperationsMutation();
//   // Internal state for business operation as boolean flags
//   const [internalBusinessOperation, setInternalBusinessOperation] =
//     useState<BusinessOperationData>({
//       delivery: false,
//       pickup: false,
//     });

//   console.log("BusinessOperationsSection mounted");

//   console.log("Outlet:", outlet);
//   console.log("Outlet c:", outlet.country);
//   console.log("storeData:", storeData);

//   // Internal state for bank account
//   const [internalBankAccount, setInternalBankAccount] = useState<BankAccount>({
//     bankName: "",
//     accountNumber: "",
//     accountName: "",
//     iban: "",
//     swiftCode: "",
//     sortCode: "",
//   });

//   // Bank selection states
//   const [userCountry, setUserCountry] = useState<string>(outlet.country);
//   const [countryName, setCountryName] = useState<string>(outlet.country);
//   const [availableBanks, setAvailableBanks] = useState<string[]>([]);
//   const [customBankName, setCustomBankName] = useState<string>("");
//   const [showCustomBank, setShowCustomBank] = useState<boolean>(false);
//   const [operatingHours, setOperatingHours] = useState<DayHours[]>(
//     getDefaultOperatingHours()
//   );
//   const [selectAll, setSelectAll] = useState(false);
//   const [deliveryTime, setDeliveryTime] = useState<DurationValue>({
//     day: 0,
//     hours: 0,
//     minutes: 0,
//   });
//   const [isSaving, setIsSaving] = useState(false);

//   // Initialize business operation state from backend
//   useEffect(() => {
//     if (storeData?.data) {
//       const operationData: BusinessOperationData = {
//         delivery: storeData.data.businessOperation?.delivery || false,
//         pickup: storeData.data.businessOperation?.pickup || false,
//       };
//       setInternalBusinessOperation(operationData);
//       onBusinessOperationChange(operationData);

//       const country = outlet?.country || "";

//       setUserCountry(country);
//       setCountryName(getCountryName(country));
//     }
//   }, [storeData, outlet]);

//   // Initialize operating hours from backend data
//   useEffect(() => {
//     // Always start with default hours
//     let hoursToSet = getDefaultOperatingHours();

//     const rawHours = storeData?.data?.operatingHours || outlet?.operatingHours;
//     if (rawHours) {
//       hoursToSet = DAYS_OF_WEEK.map((day) => ({
//         day: day.charAt(0).toUpperCase() + day.slice(1),
//         enabled: rawHours[day as keyof typeof rawHours]?.isActive ?? false,
//         openTime: rawHours[day as keyof typeof rawHours]?.open ?? "09:00",
//         closeTime: rawHours[day as keyof typeof rawHours]?.close ?? "17:00",
//       }));
//     }

//     setOperatingHours(hoursToSet);
//     setSelectAll(false);
//   }, [storeData, outlet]);

//   // Initialize lead time (seconds -> {day,hours,minutes})
//   useEffect(() => {
//     const data = storeData?.data as unknown as
//       | { leadTime?: number }
//       | undefined;
//     if (typeof data?.leadTime === "number") {
//       setDeliveryTime(secondsToDuration(data.leadTime));
//     }
//   }, [storeData]);

//   // useEffect(() => {
//   //   // Always start with default hours
//   //   let hoursToSet = getDefaultOperatingHours();

//   //   // If we have outlet data, use it to populate the hours
//   //   if (outlet?.operatingHours) {
//   //     const rawHours = outlet.operatingHours;

//   //     hoursToSet = DAYS_OF_WEEK.map((day) => ({
//   //       day: day.charAt(0).toUpperCase() + day.slice(1),
//   //       enabled: rawHours[day as keyof typeof rawHours]?.isActive ?? false,
//   //       openTime: rawHours[day as keyof typeof rawHours]?.open ?? "09:00",
//   //       closeTime: rawHours[day as keyof typeof rawHours]?.close ?? "17:00",
//   //     }));
//   //   }

//   //   setOperatingHours(hoursToSet);
//   //   setSelectAll(false);
//   // }, [outlet]);

//   // Initialize bank account state from backend
//   useEffect(() => {
//     if (bankAccount) {
//       setInternalBankAccount(bankAccount);

//       // Check if the bank name exists in our list
//       const banks = getBanksByCountry(userCountry);
//       const bankExists = banks.includes(bankAccount.bankName);

//       if (!bankExists && bankAccount.bankName) {
//         setShowCustomBank(true);
//         setCustomBankName(bankAccount.bankName);
//       }
//     } else if (storeData?.data?.bankDetails) {
//       const bankDetails = storeData.data.bankDetails;
//       setInternalBankAccount({
//         bankName: bankDetails.bankName || "",
//         accountNumber: bankDetails.accountNumber || "",
//         accountName: bankDetails.accountName || "",
//         iban: bankDetails.iban || "",
//         swiftCode: bankDetails.swiftCode || "",
//         sortCode: bankDetails.sortCode || "",
//       });

//       // Check if the bank name exists in our list
//       const banks = getBanksByCountry(userCountry);
//       const bankExists = banks.includes(bankDetails.bankName || "");

//       if (!bankExists && bankDetails.bankName) {
//         setShowCustomBank(true);
//         setCustomBankName(bankDetails.bankName);
//       }
//     }
//   }, [bankAccount, storeData, userCountry]);

//   // Update available banks when country is loaded
//   useEffect(() => {
//     if (userCountry) {
//       const banks = getBanksByCountry(userCountry);
//       setAvailableBanks(banks);
//     }
//   }, [userCountry]);

//   // Handle business operation changes
//   const handleDeliveryChange = (checked: boolean) => {
//     const newOperationData = {
//       ...internalBusinessOperation,
//       delivery: checked,
//     };
//     setInternalBusinessOperation(newOperationData);
//     onBusinessOperationChange(newOperationData);
//   };

//   const handlePickupChange = (checked: boolean) => {
//     const newOperationData = {
//       ...internalBusinessOperation,
//       pickup: checked,
//     };
//     setInternalBusinessOperation(newOperationData);
//     onBusinessOperationChange(newOperationData);
//   };

//   const handleBothChange = (checked: boolean) => {
//     const newOperationData = {
//       delivery: checked,
//       pickup: checked,
//     };
//     setInternalBusinessOperation(newOperationData);
//     onBusinessOperationChange(newOperationData);
//   };

//   // Handle bank account changes
//   const handleBankAccountChange = (field: keyof BankAccount, value: string) => {
//     const updatedAccount = {
//       ...internalBankAccount,
//       [field]: value,
//     };
//     setInternalBankAccount(updatedAccount);
//     onBankAccountChange(updatedAccount);
//   };

//   // Handle bank selection
//   const handleBankSelect = (bankName: string) => {
//     if (bankName === "other") {
//       setShowCustomBank(true);
//       handleBankAccountChange("bankName", customBankName);
//     } else {
//       setShowCustomBank(false);
//       setCustomBankName("");
//       handleBankAccountChange("bankName", bankName);
//     }
//   };

//   // Handle custom bank name
//   const handleCustomBankChange = (value: string) => {
//     setCustomBankName(value);
//     handleBankAccountChange("bankName", value);
//   };

//   const handleSaveAndContinue = async () => {
//     try {
//       setIsSaving(true);
//       // Prepare data for API call
//       // Build the operating hours DTO
//       const operatingHoursDto = operatingHours.reduce(
//         (acc, { day, enabled, openTime, closeTime }) => ({
//           ...acc,
//           [day.toLowerCase()]: {
//             open: openTime,
//             close: closeTime,
//             isActive: enabled,
//           },
//         }),
//         {} as Record<string, { open: string; close: string; isActive: boolean }>
//       );

//       // Convert lead time to seconds
//       const leadTimeSeconds = durationToSeconds(deliveryTime);

//       const updateData = {
//         storeCode: storeData.data.storeCode,
//         delivery: internalBusinessOperation.delivery,
//         pickup: internalBusinessOperation.pickup,
//         bankName: internalBankAccount.bankName || undefined,
//         accountName: internalBankAccount.accountName || undefined,
//         accountNumber: internalBankAccount.accountNumber || undefined,
//         iban: internalBankAccount.iban || undefined,
//         swiftCode: internalBankAccount.swiftCode || undefined,
//         sortCode: internalBankAccount.sortCode || undefined,
//         operatingHours: operatingHoursDto,
//         leadTime: leadTimeSeconds,
//       };

//       // Update store operations
//       if (outlet?.id) {
//         await updateStoreOperations({
//           outletId: outlet.id,
//           payload: updateData,
//         }).unwrap();
//         // Ensure latest data is fetched for future visits
//         await refetch();
//       }

//       onContinue();
//     } catch (error) {
//       console.error("Failed to save business operations:", error);
//       // You can add toast notification here
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const handleSelectAll = (isChecked: boolean) => {
//     if (isSaving) return;

//     setSelectAll(isChecked);

//     setOperatingHours((prev) => {
//       const sunday = prev[0];
//       return prev.map((day, index) =>
//         index === 0
//           ? { ...day, enabled: isChecked }
//           : {
//               ...day,
//               enabled: isChecked,
//               openTime: sunday.openTime,
//               closeTime: sunday.closeTime,
//             }
//       );
//     });
//   };

//   const handleDayToggle = (dayIndex: number) => {
//     if (isSaving) return;

//     setOperatingHours((prev) =>
//       prev.map((day, index) =>
//         index === dayIndex ? { ...day, enabled: !day.enabled } : day
//       )
//     );
//   };

//   const handleTimeChange = (
//     dayIndex: number,
//     field: "openTime" | "closeTime",
//     value: string
//   ) => {
//     if (isSaving) return;

//     setOperatingHours((prev) =>
//       prev.map((day, index) =>
//         index === dayIndex ? { ...day, [field]: value } : day
//       )
//     );
//   };
//   // Helper to check if "both" is selected
//   const isBothSelected =
//     internalBusinessOperation.delivery && internalBusinessOperation.pickup;

//   return (
//     <div>
//       <h2 className="text-2xl font-bold text-gray-900 mb-8">
//         Set your business operations
//       </h2>

//       {/* Business Operation Type */}
//       <div className="mb-8">
//         <div className="flex items-center gap-6 mb-4">
//           <label className="flex items-center gap-2 cursor-pointer">
//             <input
//               type="checkbox"
//               checked={internalBusinessOperation.delivery}
//               onChange={(e) => handleDeliveryChange(e.target.checked)}
//               className="w-5 h-5 rounded cursor-pointer"
//               style={{ accentColor: "#15BA5C" }}
//             />
//             <span className="text-gray-900 font-medium">Delivery</span>
//           </label>

//           <label className="flex items-center gap-2 cursor-pointer">
//             <input
//               type="checkbox"
//               checked={internalBusinessOperation.pickup}
//               onChange={(e) => handlePickupChange(e.target.checked)}
//               className="w-5 h-5 rounded cursor-pointer"
//               style={{ accentColor: "#15BA5C" }}
//             />
//             <span className="text-gray-900 font-medium">Pickup</span>
//           </label>

//           <label className="flex items-center gap-2 cursor-pointer">
//             <input
//               type="checkbox"
//               checked={isBothSelected}
//               onChange={(e) => handleBothChange(e.target.checked)}
//               className="w-5 h-5 rounded cursor-pointer"
//               style={{ accentColor: "#15BA5C" }}
//             />
//             <span className="text-gray-900 font-medium">Both</span>
//           </label>
//         </div>
//         <p className="text-sm text-gray-500">
//           You can select one or both. Depends on how you want your business to
//           run
//         </p>
//       </div>

//       <div className="mb-8 flex flex-col gap-[16px]">
//         <h3 className="text-[#1C1B20] text-[20px] font-bold">
//           Operating Hours
//         </h3>
//         <div className="space-y-4 overflow-y-auto">
//           <div className="border border-gray-200 rounded-lg">
//             <div className="p-4 border-b border-gray-100">
//               <h3 className="font-semibold text-gray-900">
//                 {outlet?.name || "Unnamed Outlet"}
//               </h3>
//               <p className="text-sm text-gray-600">
//                 {outlet?.address || "No address provided"}
//               </p>
//             </div>

//             <div className="px-4 pb-4 flex flex-col gap-10">
//               {operatingHours.map((dayHours, dayIndex) => (
//                 <div
//                   key={`${dayHours.day}-${dayIndex}`}
//                   className="flex items-center justify-between gap-4 relative mt-2.5"
//                 >
//                   <div className="w-32">
//                     <Switch
//                       checked={dayHours.enabled}
//                       onChange={() => handleDayToggle(dayIndex)}
//                       label={dayHours.day}
//                       // disabled={isSaving}
//                     />
//                   </div>

//                   <div className="flex items-center gap-2 flex-1 relative">
//                     <div className="flex flex-1/2 items-center justify-between gap-2 border border-[#E6E6E6] px-2 rounded-xl">
//                       <span className="text-sm text-gray-600">From</span>
//                       <TimeDropdownSplit
//                         value={dayHours.openTime}
//                         onChange={(value) =>
//                           handleTimeChange(dayIndex, "openTime", value)
//                         }
//                         disabled={!dayHours.enabled}
//                       />
//                     </div>

//                     <div className="flex flex-1/2 items-center justify-between gap-2 border border-[#E6E6E6] px-2 rounded-xl">
//                       <span className="text-sm text-gray-600">To</span>
//                       <TimeDropdownSplit
//                         value={dayHours.closeTime}
//                         onChange={(value) =>
//                           handleTimeChange(dayIndex, "closeTime", value)
//                         }
//                         disabled={!dayHours.enabled}
//                       />
//                     </div>

//                     {dayIndex === 0 && (
//                       <div className="flex items-center gap-2.5 absolute -bottom-6 left-0">
//                         <input
//                           type="checkbox"
//                           className="accent-green-600"
//                           checked={selectAll}
//                           onChange={(e) => handleSelectAll(e.target.checked)}
//                           // disabled={isSaving}
//                         />
//                         <p
//                           className={`text-[#1C1B20] text-sm ${
//                             //</div> isSaving ? "opacity-50"
//                             //:
//                             ""
//                           }`}
//                         >
//                           Apply to all
//                         </p>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="mb-8">
//         <DurationPicker
//           label="Lead Time"
//           value={deliveryTime}
//           onChange={setDeliveryTime}
//           minuteStep={5}
//         />
//       </div>

//       {/* Bank Details */}
//       <div className="mb-8">
//         <h3 className="text-lg font-semibold text-gray-900 mb-6">
//           Bank Details
//         </h3>

//         <div className="p-6 border border-gray-200 rounded-lg">
//           {/* Display Country (Read-only) */}
//           <div className="mb-4">
//             <label className="block text-sm font-medium text-gray-900 mb-2">
//               Country
//             </label>
//             <div className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
//               {countryName || "Loading..."}
//             </div>
//             <p className="text-xs text-gray-500 mt-1">
//               Based on your business location
//             </p>
//           </div>

//           {/* Bank Selection */}
//           <div className="mb-4">
//             <label
//               htmlFor="bankName"
//               className="block text-sm font-medium text-gray-900 mb-2"
//             >
//               Bank Name
//             </label>
//             <select
//               id="bankName"
//               title="Bank Name"
//               value={showCustomBank ? "other" : internalBankAccount.bankName}
//               onChange={(e) => handleBankSelect(e.target.value)}
//               className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C]"
//               disabled={!userCountry || availableBanks.length === 0}
//             >
//               <option value="">Select your bank</option>
//               {availableBanks.map((bank) => (
//                 <option key={bank} value={bank}>
//                   {bank}
//                 </option>
//               ))}
//               <option value="other">Other (Enter manually)</option>
//             </select>
//             {availableBanks.length === 0 && userCountry && (
//               <p className="text-xs text-amber-600 mt-1">
//                 No banks available for {countryName}. Please select
//                 &quot;Other&quot; to enter manually.
//               </p>
//             )}
//           </div>

//           {/* Custom Bank Name Input */}
//           {showCustomBank && (
//             <div className="mb-4">
//               <label className="block text-sm font-medium text-gray-900 mb-2">
//                 Enter Bank Name
//               </label>
//               <input
//                 type="text"
//                 value={customBankName}
//                 onChange={(e) => handleCustomBankChange(e.target.value)}
//                 placeholder="Enter your bank name"
//                 className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C]"
//               />
//             </div>
//           )}

//           <div className="grid grid-cols-2 gap-4 mb-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-900 mb-2">
//                 Account Number
//               </label>
//               <input
//                 type="text"
//                 value={internalBankAccount.accountNumber}
//                 onChange={(e) =>
//                   handleBankAccountChange("accountNumber", e.target.value)
//                 }
//                 placeholder="Enter account number"
//                 className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C]"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-900 mb-2">
//                 Account Name
//               </label>
//               <input
//                 type="text"
//                 value={internalBankAccount.accountName}
//                 onChange={(e) =>
//                   handleBankAccountChange("accountName", e.target.value)
//                 }
//                 placeholder="Enter account name"
//                 className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C]"
//               />
//             </div>
//           </div>

//           {/* Optional Fields */}
//           <details className="mb-4">
//             <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-[#15BA5C] transition-colors">
//               Additional Bank Details (Optional)
//             </summary>
//             <div className="grid grid-cols-2 gap-4 mt-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-900 mb-2">
//                   IBAN (Optional)
//                 </label>
//                 <input
//                   type="text"
//                   value={internalBankAccount.iban}
//                   onChange={(e) =>
//                     handleBankAccountChange("iban", e.target.value)
//                   }
//                   placeholder="Enter IBAN"
//                   className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C]"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-900 mb-2">
//                   SWIFT Code (Optional)
//                 </label>
//                 <input
//                   type="text"
//                   value={internalBankAccount.swiftCode}
//                   onChange={(e) =>
//                     handleBankAccountChange("swiftCode", e.target.value)
//                   }
//                   placeholder="Enter SWIFT code"
//                   className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C]"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-900 mb-2">
//                   Sort Code (Optional)
//                 </label>
//                 <input
//                   type="text"
//                   value={internalBankAccount.sortCode}
//                   onChange={(e) =>
//                     handleBankAccountChange("sortCode", e.target.value)
//                   }
//                   placeholder="Enter sort code"
//                   className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C]"
//                 />
//               </div>
//             </div>
//           </details>
//         </div>
//       </div>

//       <div className="flex gap-4">
//         <button
//           onClick={onBack}
//           className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
//         >
//           Back
//         </button>
//         <button
//           onClick={handleSaveAndContinue}
//           disabled={isLoading}
//           className="flex-1 py-3 bg-[#15BA5C] text-white rounded-lg hover:bg-[#13A652] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
//         >
//           {isLoading ? "Saving..." : "Save and Continue"}
//         </button>
//       </div>
//     </div>
//   );
// }
