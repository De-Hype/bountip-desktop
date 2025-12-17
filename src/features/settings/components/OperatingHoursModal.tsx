// import React, { useEffect, useState } from "react";
// import { Modal } from "../ui/Modal";
// import { Check, Loader2 } from "lucide-react";
// import SettingFiles from "@/assets/icons/settings";
// import { Switch } from "../ui/Switch";
// import { toast } from "sonner";
// import { TimeDropdownSplit } from "./TimeDropdownSplit";

// import { useBusinessAndStore } from "@/stores/useBusinessAndStore";
// import { useAppSelector } from "@/hooks/redux-hooks";
// import { useUpdateOperatingHoursMutation } from "@/redux/outlets";

// interface OperatingHoursModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSuccess: (heading: string, description: string) => void;
//   onError: (heading: string, description: string) => void;
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

// // Helper function for day comparison
// const compareDayHours = (
//   current: DayHours[],
//   server: Record<string, any>[]
// ): boolean => {
//   const currentFormatted = current
//     .map(({ day, enabled, openTime, closeTime }) => ({
//       day: day.toLowerCase(),
//       enabled,
//       openTime,
//       closeTime,
//     }))
//     .sort((a, b) => a.day.localeCompare(b.day));

//   const serverFormatted = server
//     .map((day) => ({
//       day: day.day.toLowerCase(),
//       enabled: day.enabled,
//       openTime: day.openTime,
//       closeTime: day.closeTime,
//     }))
//     .sort((a, b) => a.day.localeCompare(b.day));

//   return JSON.stringify(currentFormatted) !== JSON.stringify(serverFormatted);
// };

// // Default operating hours when no data is available
// const getDefaultOperatingHours = (): DayHours[] => {
//   return DAYS_OF_WEEK.map((day) => ({
//     day: day.charAt(0).toUpperCase() + day.slice(1),
//     enabled: false,
//     openTime: "09:00",
//     closeTime: "17:00",
//   }));
// };

// export const OperatingHoursModal: React.FC<OperatingHoursModalProps> = ({
//   isOpen,
//   onClose,
//   onSuccess,
//   onError,
// }) => {
//   const outlet = useAppSelector((state) => state.business.outlet);
//   const [operatingHours, setOperatingHours] = useState<DayHours[]>(
//     getDefaultOperatingHours()
//   );
//   const [selectAll, setSelectAll] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);
//   const [unsaved, setUnsaved] = useState(false);

//   const [updateOperatingHours] = useUpdateOperatingHoursMutation();

//   // Initialize operating hours from store data
//   useEffect(() => {
//     if (!isOpen) return;

//     // Always start with default hours
//     let hoursToSet = getDefaultOperatingHours();

//     // If we have outlet data, use it to populate the hours
//     if (outlet?.operatingHours) {
//       const rawHours = outlet.operatingHours;

//       hoursToSet = DAYS_OF_WEEK.map((day) => ({
//         day: day.charAt(0).toUpperCase() + day.slice(1),
//         enabled: rawHours[day as keyof typeof rawHours]?.isActive ?? false,
//         openTime: rawHours[day as keyof typeof rawHours]?.open ?? "09:00",
//         closeTime: rawHours[day as keyof typeof rawHours]?.close ?? "17:00",
//       }));
//     }

//     setOperatingHours(hoursToSet);
//     setSelectAll(false);
//     setUnsaved(false);
//   }, [isOpen, outlet]);

//   // Track unsaved changes
//   useEffect(() => {
//     if (!isOpen) {
//       setUnsaved(false);
//       return;
//     }

//     const rawHours = outlet?.operatingHours;

//     // If no server data exists, consider everything as changed from default
//     if (!rawHours) {
//       const hasNonDefaultValues = operatingHours.some(
//         (day) =>
//           day.enabled !== false ||
//           day.openTime !== "09:00" ||
//           day.closeTime !== "17:00"
//       );
//       setUnsaved(hasNonDefaultValues);
//       return;
//     }

//     // Convert server hours to comparable format
//     const serverHours = DAYS_OF_WEEK.map((day) => ({
//       day: day.charAt(0).toUpperCase() + day.slice(1),
//       enabled: rawHours[day as keyof typeof rawHours]?.isActive ?? false,
//       openTime: rawHours[day as keyof typeof rawHours]?.open ?? "09:00",
//       closeTime: rawHours[day as keyof typeof rawHours]?.close ?? "17:00",
//     }));

//     // Deep comparison
//     const changed = compareDayHours(operatingHours, serverHours);
//     setUnsaved(changed);
//   }, [operatingHours, isOpen, outlet]);

//   // Handle modal close
//   useEffect(() => {
//     if (!isOpen) {
//       // Reset to default hours when closing
//       setOperatingHours(getDefaultOperatingHours());
//       setSelectAll(false);
//       setIsSaving(false);
//       setUnsaved(false);
//     }
//   }, [isOpen]);

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

//   const handleSubmit = async () => {
//     if (!outlet) {
//       const errorMessage = "Store information is missing.";
//       onError("Missing Store ID", errorMessage);
//       toast.error(errorMessage);
//       return;
//     }

//     setIsSaving(true);

//     try {
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

//       // Validate all required days are present
//       const isComplete = DAYS_OF_WEEK.every((day) => operatingHoursDto[day]);

//       if (!isComplete) {
//         toast.error("Please complete all operating hours data");
//         setIsSaving(false);
//         return;
//       }

//       // Call the mutation with outletId
//       const result = await updateOperatingHours({
//         outletId: outlet.id,
//         data: operatingHoursDto,
//       }).unwrap();

//       // Update local state with server response if available
//       if (result?.data?.operatingHours || result?.operatingHours) {
//         const serverHours =
//           result?.data?.operatingHours || result?.operatingHours;

//         const updatedHours = DAYS_OF_WEEK.map((day) => ({
//           day: day.charAt(0).toUpperCase() + day.slice(1),
//           enabled:
//             serverHours[day as keyof typeof serverHours]?.isActive ?? false,
//           openTime:
//             serverHours[day as keyof typeof serverHours]?.open ?? "09:00",
//           closeTime:
//             serverHours[day as keyof typeof serverHours]?.close ?? "17:00",
//         }));

//         setOperatingHours(updatedHours);
//       }

//       toast.success("Operating Hours updated successfully");
//       onSuccess(
//         "Save successful",
//         "Your Operating hours have been saved successfully"
//       );
//       setUnsaved(false);
//       setSelectAll(false);

//       // Close after brief delay to show success
//       setTimeout(() => onClose(), 500);
//     } catch (error: any) {
//       const errorMessage =
//         error?.data?.message ||
//         error?.message ||
//         "An error occurred while updating operating hours";

//       toast.error(errorMessage);
//       onError("Save failed", errorMessage);
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const LoadingSpinner = () => <Loader2 className="h-4 w-4 animate-spin" />;

//   return (
//     <Modal
//       size="lg"
//       image={SettingFiles.OperatingHours}
//       isOpen={isOpen}
//       onClose={onClose}
//       title="Operating Hours"
//       subtitle="Setup your Operating hours for this location"
//     >
//       <div className="space-y-4 overflow-y-auto">
//         <div className="border border-gray-200 rounded-lg">
//           <div className="p-4 border-b border-gray-100">
//             <h3 className="font-semibold text-gray-900">
//               {outlet?.name || "Unnamed Outlet"}
//             </h3>
//             <p className="text-sm text-gray-600">
//               {outlet?.address || "No address provided"}
//             </p>
//           </div>

//           <div className="px-4 pb-4 flex flex-col gap-10">
//             {operatingHours.map((dayHours, dayIndex) => (
//               <div
//                 key={`${dayHours.day}-${dayIndex}`}
//                 className="flex items-center justify-between gap-4 relative mt-2.5"
//               >
//                 <div className="w-32">
//                   <Switch
//                     checked={dayHours.enabled}
//                     onChange={() => handleDayToggle(dayIndex)}
//                     label={dayHours.day}
//                     // disabled={isSaving}
//                   />
//                 </div>

//                 <div className="flex items-center gap-2 flex-1 relative">
//                   <div className="flex flex-1/2 items-center justify-between gap-2 border border-[#E6E6E6] px-2 rounded-xl">
//                     <span className="text-sm text-gray-600">From</span>
//                     <TimeDropdownSplit
//                       value={dayHours.openTime}
//                       onChange={(value) =>
//                         handleTimeChange(dayIndex, "openTime", value)
//                       }
//                       disabled={!dayHours.enabled || isSaving}
//                     />
//                   </div>

//                   <div className="flex flex-1/2 items-center justify-between gap-2 border border-[#E6E6E6] px-2 rounded-xl">
//                     <span className="text-sm text-gray-600">To</span>
//                     <TimeDropdownSplit
//                       value={dayHours.closeTime}
//                       onChange={(value) =>
//                         handleTimeChange(dayIndex, "closeTime", value)
//                       }
//                       disabled={!dayHours.enabled || isSaving}
//                     />
//                   </div>

//                   {dayIndex === 0 && (
//                     <div className="flex items-center gap-2.5 absolute -bottom-6 left-0">
//                       <input
//                         type="checkbox"
//                         className="accent-green-600"
//                         checked={selectAll}
//                         onChange={(e) => handleSelectAll(e.target.checked)}
//                         disabled={isSaving}
//                       />
//                       <p
//                         className={`text-[#1C1B20] text-sm ${
//                           isSaving ? "opacity-50" : ""
//                         }`}
//                       >
//                         Apply to all
//                       </p>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         <div className="flex justify-end">
//           <button
//             onClick={handleSubmit}
//             disabled={isSaving || !unsaved}
//             className="flex items-center justify-center gap-2 bg-[#15BA5C] w-full text-white py-3 rounded-[10px] font-medium text-base mt-5 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#129b4f] transition"
//             type="button"
//           >
//             {isSaving ? <LoadingSpinner /> : <Check className="text-[14px]" />}
//             <span>{isSaving ? "Saving..." : "Save Operating Hours"}</span>
//           </button>
//         </div>
//       </div>
//     </Modal>
//   );
// };
