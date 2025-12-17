// "use client";

// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import Image from "next/image";
// import { Check, Loader2, Trash2 } from "lucide-react";
// import { parsePhoneNumberFromString } from "libphonenumber-js";

// import { Modal } from "../ui/Modal";
// import { Input } from "../ui/Input";
// import SettingFiles from "@/assets/icons/settings";
// import { BusinessLocation } from "@/types/settingTypes";
// import { useAppDispatch, useAppSelector } from "@/hooks/redux-hooks";
// import {
//   useAddNewOutletMutation,
//   useDeleteOutletMutation,
//   useLazyLoadAllOutletsQuery,
// } from "@/redux/business";
// import { useUpdateOutletMutation } from "@/redux/outlets";
// import { setOutlets, setPrimaryOutlet } from "@/redux/business/businessSlice";
// import { Outlet as OutletType } from "@/types/outlet";
// import { getPhoneCountries, PhoneCountry } from "@/utils/getPhoneCountries";

// interface LocationSettingsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSuccess: (heading: string, description: string) => void;
//   onError: (heading: string, description: string) => void;
// }

// type LocationForm = Pick<
//   BusinessLocation,
//   "name" | "address" | "phoneNumber" | "isDefault"
// >;

// type NewLocationForm = {
//   id: string;
//   name: string;
//   address: string;
//   phoneNumber: string;
// };

// const generateNewLocationId = () =>
//   `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// const createEmptyNewLocation = (): NewLocationForm => ({
//   id: generateNewLocationId(),
//   name: "",
//   address: "",
//   phoneNumber: "",
// });

// const getErrorMessage = (error: unknown, fallback: string) => {
//   if (typeof error === "string") return error;
//   if (typeof error === "object" && error !== null) {
//     const err = error as { data?: { message?: string }; message?: string };
//     return err.data?.message || err.message || fallback;
//   }
//   return fallback;
// };

// export const LocationSettingsModal: React.FC<LocationSettingsModalProps> = ({
//   isOpen,
//   onClose,
//   onSuccess,
//   onError,
// }) => {
//   const dispatch = useAppDispatch();
//   const primaryBusiness = useAppSelector(
//     (state) => state.business.primaryBusiness
//   );
//   const outlets = useAppSelector((state) => state.business.outlets);
//   const currentOutlet = useAppSelector((state) => state.business.outlet);

//   const [addNewOutlet, { isLoading: isCreatingOutlet }] =
//     useAddNewOutletMutation();
//   const [updateOutlet] = useUpdateOutletMutation();
//   const [deleteOutlet] = useDeleteOutletMutation();
//   const [loadOutlets] = useLazyLoadAllOutletsQuery();

//   const [phoneCountries, setPhoneCountries] = useState<PhoneCountry[]>([]);
//   const [selectedPhoneCountries, setSelectedPhoneCountries] = useState<
//     Record<string, PhoneCountry | null>
//   >({});
//   const [openPhonePickerFor, setOpenPhonePickerFor] = useState<string | null>(
//     null
//   );
//   const [phoneCountrySearchTerm, setPhoneCountrySearchTerm] = useState("");

//   const [locationForms, setLocationForms] = useState<
//     Record<string, LocationForm>
//   >({});
//   const [newLocations, setNewLocations] = useState<NewLocationForm[]>([
//     createEmptyNewLocation(),
//   ]);
//   const [editingLocations, setEditingLocations] = useState<
//     Record<string, boolean>
//   >({});
//   const [savingLocationId, setSavingLocationId] = useState<string | null>(null);
//   const [deletingLocationId, setDeletingLocationId] = useState<string | null>(
//     null
//   );

//   const parsedLocations = useMemo<BusinessLocation[]>(() => {
//     return outlets.map((outlet) => ({
//       id: outlet.id,
//       name: outlet.name || "",
//       address: outlet.address || "",
//       phoneNumber: outlet.phoneNumber || "",
//       isDefault: Boolean(outlet.isMainLocation),
//     }));
//   }, [outlets]);

//   const defaultLocation = parsedLocations.find((loc) => loc.isDefault);
//   const otherLocations = parsedLocations.filter((loc) => !loc.isDefault);

//   const defaultPhoneCountry = useMemo(() => {
//     if (phoneCountries.length === 0) return null;
//     if (currentOutlet?.country) {
//       const match = phoneCountries.find(
//         (country) =>
//           country.name.toLowerCase() === currentOutlet.country?.toLowerCase()
//       );
//       if (match) return match;
//     }
//     return (
//       phoneCountries.find((country) => country.isoCode === "NG") ||
//       phoneCountries[0] ||
//       null
//     );
//   }, [currentOutlet?.country, phoneCountries]);

//   const getFallbackPhoneCountry = useCallback(
//     () => defaultPhoneCountry || phoneCountries[0] || null,
//     [defaultPhoneCountry, phoneCountries]
//   );

//   const parsePhoneValue = useCallback(
//     (phoneNumber?: string) => {
//       if (!phoneNumber) {
//         return {
//           nationalNumber: "",
//           country: getFallbackPhoneCountry(),
//         };
//       }

//       const parsed = parsePhoneNumberFromString(phoneNumber);
//       if (parsed?.countryCallingCode) {
//         const matched = phoneCountries.find(
//           (country) =>
//             country.dialCode.replace("+", "") === parsed.countryCallingCode
//         );
//         return {
//           nationalNumber: parsed.nationalNumber?.toString() || phoneNumber,
//           country: matched || getFallbackPhoneCountry(),
//         };
//       }

//       return {
//         nationalNumber: phoneNumber,
//         country: getFallbackPhoneCountry(),
//       };
//     },
//     [getFallbackPhoneCountry, phoneCountries]
//   );

//   const filteredPhoneCountries = useMemo(() => {
//     if (!phoneCountrySearchTerm.trim()) return phoneCountries;
//     const term = phoneCountrySearchTerm.toLowerCase();
//     return phoneCountries.filter(
//       (country) =>
//         country.name.toLowerCase().includes(term) ||
//         country.dialCode.replace("+", "").includes(phoneCountrySearchTerm)
//     );
//   }, [phoneCountries, phoneCountrySearchTerm]);

//   const togglePhoneCountryDropdown = (key: string) => {
//     setOpenPhonePickerFor((prev) => (prev === key ? null : key));
//     setPhoneCountrySearchTerm("");
//   };

//   const handlePhoneCountrySelect = (
//     key: string,
//     phoneCountry: PhoneCountry
//   ) => {
//     setSelectedPhoneCountries((prev) => ({
//       ...prev,
//       [key]: phoneCountry,
//     }));
//     setOpenPhonePickerFor(null);
//     setPhoneCountrySearchTerm("");
//   };

//   const renderPhoneCountrySelector = (key: string) => {
//     const selectedCountry =
//       selectedPhoneCountries[key] || getFallbackPhoneCountry();

//     return (
//       <div className="relative">
//         <button
//           type="button"
//           onClick={(e) => {
//             e.preventDefault();
//             togglePhoneCountryDropdown(key);
//           }}
//           className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-l-lg shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#15BA5C] transition-colors"
//         >
//           {selectedCountry && (
//             <>
//               <CachedImg
//                 src={selectedCountry.flag}
//                 alt={`${selectedCountry.name} flag`}
//                 className="w-6 h-4 mr-2 rounded-sm border border-gray-200 object-cover"
//                 width={24}
//                 height={18}
//               />
//               <span className="text-gray-900 mr-2 font-medium">
//                 {selectedCountry.dialCode}
//               </span>
//             </>
//           )}
//           <svg
//             className="h-4 w-4 text-gray-400"
//             viewBox="0 0 20 20"
//             fill="none"
//             xmlns="http://www.w3.org/2000/svg"
//           >
//             <path
//               d="M5 8l5 5 5-5"
//               stroke="currentColor"
//               strokeWidth="1.5"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//             />
//           </svg>
//         </button>

//         {openPhonePickerFor === key && (
//           <div className="absolute z-20 left-0 mt-1 w-80 bg-white border border-gray-300 rounded-lg shadow-lg">
//             <div className="px-3 py-2 border-b border-gray-200">
//               <input
//                 type="text"
//                 value={phoneCountrySearchTerm}
//                 onChange={(e) => setPhoneCountrySearchTerm(e.target.value)}
//                 placeholder="Search country or code..."
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#15BA5C] text-sm"
//                 autoFocus
//               />
//             </div>

//             <div className="py-1 max-h-60 overflow-y-auto">
//               {filteredPhoneCountries.length > 0 ? (
//                 filteredPhoneCountries.map((phoneCountry) => (
//                   <button
//                     key={phoneCountry.isoCode}
//                     type="button"
//                     onClick={(e) => {
//                       e.preventDefault();
//                       handlePhoneCountrySelect(key, phoneCountry);
//                     }}
//                     className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between group"
//                   >
//                     <div className="flex items-center">
//                       <CachedImg
//                         src={phoneCountry.flag}
//                         alt={`${phoneCountry.name} flag`}
//                         className="w-6 h-4 mr-3 rounded-sm border border-gray-200 object-cover"
//                         width={24}
//                         height={18}
//                       />
//                       <div>
//                         <div className="text-gray-900 font-medium">
//                           {phoneCountry.name}
//                         </div>
//                         <div className="text-sm text-gray-500">
//                           {phoneCountry.dialCode}
//                         </div>
//                       </div>
//                     </div>
//                     {selectedCountry?.isoCode === phoneCountry.isoCode && (
//                       <Check className="h-4 w-4 text-[#15BA5C]" />
//                     )}
//                   </button>
//                 ))
//               ) : (
//                 <div className="px-4 py-3 text-sm text-gray-500">
//                   No countries found.
//                 </div>
//               )}
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   };
//   const CachedImg: React.FC<{
//     src: string;
//     alt: string;
//     width: number;
//     height: number;
//     className?: string;
//   }> = ({ src, alt, width, height, className }) => {
//     const [resolved, setResolved] = useState<string>(src);
//     useEffect(() => {
//       let active = true;
//       (async () => {
//         try {
//           const w = window as unknown as {
//             electronAPI?: { cacheGet: (key: string) => Promise<any> };
//           };
//           const api = w.electronAPI;
//           if (!api) return;
//           const cached = await api.cacheGet(`image:${src}`);
//           if (active && cached && cached.data) setResolved(String(cached.data));
//         } catch {}
//       })();
//       return () => {
//         active = false;
//       };
//     }, [src]);
//     return (
//       <Image
//         src={resolved}
//         alt={alt}
//         width={width}
//         height={height}
//         className={className}
//       />
//     );
//   };
//   useEffect(() => {
//     setPhoneCountries(getPhoneCountries());
//   }, []);

//   useEffect(() => {
//     if (phoneCountries.length === 0) return;

//     setSelectedPhoneCountries((prev) => {
//       const updated = { ...prev };
//       newLocations.forEach((location) => {
//         const key = `new-${location.id}`;
//         if (!updated[key]) {
//           updated[key] = getFallbackPhoneCountry();
//         }
//       });
//       return updated;
//     });
//   }, [newLocations, getFallbackPhoneCountry, phoneCountries]);

//   const refreshLocations = useCallback(async () => {
//     try {
//       const response = await loadOutlets().unwrap();
//       if (response?.data) {
//         const updatedOutlets = response.data as OutletType[];
//         dispatch(setOutlets(updatedOutlets));

//         const activeOutletId = currentOutlet?.id;
//         if (activeOutletId) {
//           const stillExists = updatedOutlets.some(
//             (outlet) => outlet.id === activeOutletId
//           );
//           if (!stillExists) {
//             dispatch(setPrimaryOutlet(updatedOutlets[0] ?? null));
//           }
//         } else if (updatedOutlets.length > 0) {
//           dispatch(setPrimaryOutlet(updatedOutlets[0]));
//         } else {
//           dispatch(setPrimaryOutlet(null));
//         }
//       }
//     } catch (error) {
//       console.error("Failed to refresh outlets", error);
//     }
//   }, [currentOutlet?.id, dispatch, loadOutlets]);

//   useEffect(() => {
//     if (!isOpen || phoneCountries.length === 0) return;

//     const initialForms: Record<string, LocationForm> = {};
//     const phoneSelections: Record<string, PhoneCountry | null> = {};

//     parsedLocations.forEach((loc) => {
//       const { nationalNumber, country } = parsePhoneValue(loc.phoneNumber);
//       initialForms[loc.id] = {
//         name: loc.name,
//         address: loc.address,
//         phoneNumber: nationalNumber,
//         isDefault: loc.isDefault,
//       };
//       phoneSelections[loc.id] = country;
//     });

//     setLocationForms(initialForms);
//     setEditingLocations({});
//     setSelectedPhoneCountries((prev) => {
//       const preservedExistingEntries = Object.fromEntries(
//         Object.entries(prev).filter(([key]) => !key.startsWith("new-"))
//       );
//       return { ...preservedExistingEntries, ...phoneSelections };
//     });
//     setNewLocations([createEmptyNewLocation()]);
//   }, [isOpen, parsedLocations, parsePhoneValue, phoneCountries]);

//   const isLocationComplete = (location?: Partial<NewLocationForm>) =>
//     Boolean(
//       location?.name?.trim() &&
//         location?.address?.trim() &&
//         location?.phoneNumber?.trim()
//     );

//   const isLastNewLocationComplete = () =>
//     newLocations.length === 0 ||
//     isLocationComplete(newLocations[newLocations.length - 1]);

//   const canSaveNewLocations =
//     newLocations.length > 0 && newLocations.every(isLocationComplete);

//   const addNewLocationField = () => {
//     if (!isLastNewLocationComplete()) {
//       onError(
//         "Incomplete Location",
//         "Please fill in the current location before adding another."
//       );
//       return;
//     }

//     setNewLocations((prev) => [...prev, createEmptyNewLocation()]);
//   };

//   const updateNewLocation = (
//     index: number,
//     field: keyof NewLocationForm,
//     value: string
//   ) => {
//     setNewLocations((prev) =>
//       prev.map((loc, i) => (i === index ? { ...loc, [field]: value } : loc))
//     );
//   };

//   const removeNewLocation = (index: number) => {
//     setNewLocations((prev) => {
//       const locationToRemove = prev[index];
//       const remaining = prev.filter((_, i) => i !== index);
//       const next =
//         remaining.length > 0 ? remaining : [createEmptyNewLocation()];

//       setSelectedPhoneCountries((prevSelected) => {
//         if (!locationToRemove) return prevSelected;
//         const updated = { ...prevSelected };
//         delete updated[`new-${locationToRemove.id}`];
//         return updated;
//       });

//       return next;
//     });
//   };

//   const handleExistingLocationChange = (
//     id: string,
//     field: keyof NewLocationForm,
//     value: string
//   ) => {
//     setLocationForms((prev) => ({
//       ...prev,
//       [id]: { ...prev[id], [field]: value },
//     }));
//   };

//   const toggleEditLocation = (id: string) => {
//     setOpenPhonePickerFor(null);
//     setPhoneCountrySearchTerm("");
//     setEditingLocations((prev) => ({
//       ...prev,
//       [id]: !prev[id],
//     }));
//   };

//   const resetLocationForm = (id: string) => {
//     const original = parsedLocations.find((loc) => loc.id === id);
//     if (!original) return;

//     const { nationalNumber, country } = parsePhoneValue(original.phoneNumber);

//     setLocationForms((prev) => ({
//       ...prev,
//       [id]: {
//         name: original.name,
//         address: original.address,
//         phoneNumber: nationalNumber,
//         isDefault: original.isDefault,
//       },
//     }));
//     setSelectedPhoneCountries((prev) => ({
//       ...prev,
//       [id]: country,
//     }));
//     setEditingLocations((prev) => ({ ...prev, [id]: false }));
//   };

//   const handleSaveExistingLocation = async (locationId: string) => {
//     const form = locationForms[locationId];
//     const trimmedForm = {
//       name: form?.name?.trim() ?? "",
//       address: form?.address?.trim() ?? "",
//       phoneNumber: form?.phoneNumber?.trim() ?? "",
//     };

//     if (!trimmedForm.name || !trimmedForm.address || !trimmedForm.phoneNumber) {
//       onError(
//         "Missing Information",
//         "Please complete all fields before saving the location."
//       );
//       return;
//     }

//     const original = parsedLocations.find((loc) => loc.id === locationId);
//     if (
//       original &&
//       original.name === trimmedForm.name &&
//       original.address === trimmedForm.address &&
//       original.phoneNumber === trimmedForm.phoneNumber
//     ) {
//       onError("No Changes Detected", "Update the details before saving.");
//       return;
//     }

//     setSavingLocationId(locationId);
//     try {
//       const selectedCountry = selectedPhoneCountries[locationId];
//       const phoneWithDialCode = selectedCountry?.dialCode
//         ? `${selectedCountry.dialCode}${trimmedForm.phoneNumber}`
//         : trimmedForm.phoneNumber;

//       await updateOutlet({
//         outletId: locationId,
//         payload: {
//           name: trimmedForm.name,
//           address: trimmedForm.address,
//           phoneNumber: phoneWithDialCode,
//         },
//       }).unwrap();

//       await refreshLocations();
//       setEditingLocations((prev) => ({ ...prev, [locationId]: false }));
//       onSuccess("Location Updated", "Business location updated successfully.");
//     } catch (error) {
//       onError(
//         "Update Failed",
//         getErrorMessage(error, "Failed to update business location.")
//       );
//     } finally {
//       setSavingLocationId(null);
//     }
//   };

//   const handleDeleteExistingLocation = async (location: BusinessLocation) => {
//     if (location.isDefault) {
//       onError(
//         "Cannot Delete Default Location",
//         "Please set another default location before deleting this one."
//       );
//       return;
//     }

//     setDeletingLocationId(location.id);
//     try {
//       await deleteOutlet({ outletId: location.id }).unwrap();
//       await refreshLocations();
//       onSuccess("Location Deleted", "The business location has been removed.");
//     } catch (error) {
//       onError(
//         "Deletion Failed",
//         getErrorMessage(error, "Unable to delete business location.")
//       );
//     } finally {
//       setDeletingLocationId(null);
//     }
//   };

//   const handleSaveNewLocations = async () => {
//     if (newLocations.length === 0) {
//       onError(
//         "No Locations to Save",
//         "Add at least one new location before saving."
//       );
//       return;
//     }

//     if (!primaryBusiness?.id) {
//       onError(
//         "Business Not Found",
//         "We could not find the active business. Please reload and try again."
//       );
//       return;
//     }

//     if (!canSaveNewLocations) {
//       onError(
//         "Incomplete Locations",
//         "Ensure every new location has a name, address and phone number."
//       );
//       return;
//     }

//     try {
//       for (const location of newLocations) {
//         const key = `new-${location.id}`;
//         const selectedCountry = selectedPhoneCountries[key];
//         const phoneWithDialCode = selectedCountry?.dialCode
//           ? `${selectedCountry.dialCode}${location.phoneNumber.trim()}`
//           : location.phoneNumber.trim();

//         await addNewOutlet({
//           businessId: primaryBusiness.id,
//           name: location.name.trim(),
//           address: location.address.trim(),
//           phoneNumber: phoneWithDialCode,
//         }).unwrap();
//       }

//       await refreshLocations();
//       setNewLocations([createEmptyNewLocation()]);
//       onSuccess(
//         "Locations Added",
//         "New business locations have been added successfully."
//       );
//     } catch (error) {
//       onError(
//         "Add Locations Failed",
//         getErrorMessage(error, "Failed to add new business locations.")
//       );
//     }
//   };

//   const renderLocationCard = (location: BusinessLocation) => {
//     const isEditing = editingLocations[location.id];
//     const form = locationForms[location.id];
//     const isSaving = savingLocationId === location.id;
//     const isDeleting = deletingLocationId === location.id;

//     if (isEditing) {
//       return (
//         <div
//           key={location.id}
//           className="border border-gray-200 rounded-lg p-4 bg-gray-50"
//         >
//           <div className="grid grid-cols-12 gap-4">
//             <div className="col-span-12 lg:col-span-3">
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Name
//               </label>
//               <Input
//                 value={form?.name || ""}
//                 onChange={(e) =>
//                   handleExistingLocationChange(
//                     location.id,
//                     "name",
//                     e.target.value
//                   )
//                 }
//                 placeholder="Enter Name e.g Main Branch"
//               />
//             </div>
//             <div className="col-span-12 lg:col-span-4">
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Address
//               </label>
//               <Input
//                 value={form?.address || ""}
//                 onChange={(e) =>
//                   handleExistingLocationChange(
//                     location.id,
//                     "address",
//                     e.target.value
//                   )
//                 }
//                 placeholder="Enter Address"
//               />
//             </div>
//             <div className="col-span-12 lg:col-span-4">
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Phone Number
//               </label>
//               <div className="flex">
//                 {renderPhoneCountrySelector(location.id)}
//                 <input
//                   type="tel"
//                   value={form?.phoneNumber || ""}
//                   onChange={(e) =>
//                     handleExistingLocationChange(
//                       location.id,
//                       "phoneNumber",
//                       e.target.value
//                     )
//                   }
//                   placeholder="Enter phone number"
//                   className="flex-1 px-4 py-2 bg-white border border-l-0 border-gray-300 rounded-r-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#15BA5C] transition-colors"
//                 />
//               </div>
//             </div>
//             <div className="col-span-12 lg:col-span-1 flex flex-col gap-2 justify-center items-stretch">
//               <button
//                 type="button"
//                 onClick={() => handleSaveExistingLocation(location.id)}
//                 disabled={isSaving}
//                 className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white bg-[#15BA5C] hover:bg-[#0f8f47] disabled:opacity-60"
//               >
//                 {isSaving ? (
//                   <>
//                     <Loader2 className="h-4 w-4 animate-spin" />
//                     <span>Saving</span>
//                   </>
//                 ) : (
//                   <>
//                     <Check className="h-4 w-4" />
//                     <span>Save</span>
//                   </>
//                 )}
//               </button>
//               <button
//                 type="button"
//                 onClick={() => resetLocationForm(location.id)}
//                 className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         </div>
//       );
//     }

//     return (
//       <div
//         key={location.id}
//         className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
//       >
//         <div>
//           <span className="font-medium block">{location.name}</span>
//           <p className="text-sm text-gray-600 mt-1">{location.address}</p>
//           <p className="text-sm text-gray-600">{location.phoneNumber}</p>
//         </div>
//         <div className="flex items-center gap-3">
//           <button
//             type="button"
//             onClick={() => toggleEditLocation(location.id)}
//             className="bg-[#15BA5C] flex items-center rounded-[20px] px-3 py-2"
//           >
//             <Image
//               src={SettingFiles.EditIcon}
//               alt="Edit"
//               className="h-[14px] w-[14px] mr-1"
//             />
//             <span className="text-white text-sm">Edit</span>
//           </button>
//           <button
//             type="button"
//             onClick={() => handleDeleteExistingLocation(location)}
//             disabled={location.isDefault || isDeleting}
//             className="w-[40px] h-[40px] flex items-center justify-center border rounded-lg text-[#E33629] border-[#E33629] hover:bg-[#E33629] hover:text-white disabled:opacity-50 disabled:hover:bg-transparent"
//             title={
//               location.isDefault ? "Default location cannot be deleted" : ""
//             }
//           >
//             {isDeleting ? (
//               <Loader2 className="h-4 w-4 animate-spin" />
//             ) : (
//               <Trash2 className="h-4 w-4" />
//             )}
//           </button>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <Modal
//       size="md"
//       subtitle="Add, edit or delete multiple business locations"
//       image={SettingFiles.LocationIcon}
//       isOpen={isOpen}
//       onClose={onClose}
//       title="Location"
//     >
//       <div className="space-y-6">
//         {/* <div className="p-3 bg-green-50 border border-green-200 rounded-md">
//           <p className="text-sm text-green-900">
//             Manage all your outlets from here. Enable editing to update details,
//             use the delete icon to remove an outlet, or add completely new
//             locations below.
//           </p>
//         </div> */}

//         <div>
//           <h3 className="font-medium text-gray-900 mb-4">
//             Default Business Location
//           </h3>
//           {defaultLocation ? (
//             renderLocationCard(defaultLocation)
//           ) : (
//             <p className="text-gray-600">No default location set</p>
//           )}
//         </div>

//         <div>
//           <h3 className="font-medium text-gray-900 mb-4">
//             Other Business Locations
//           </h3>
//           <div className="space-y-4">
//             {otherLocations.length > 0 ? (
//               otherLocations.map((location) => renderLocationCard(location))
//             ) : (
//               <p className="text-gray-600">No other locations available</p>
//             )}
//           </div>
//         </div>

//         <div>
//           <h3 className="font-medium text-gray-900 mb-4">Add New Locations</h3>
//           {newLocations.map((location, index) => (
//             <div
//               key={location.id}
//               className="grid grid-cols-12 gap-4 items-end mb-4 border border-dashed border-gray-300 rounded-lg p-4"
//             >
//               <div className="col-span-12 lg:col-span-3">
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Name
//                 </label>
//                 <Input
//                   value={location.name}
//                   onChange={(e) =>
//                     updateNewLocation(index, "name", e.target.value)
//                   }
//                   placeholder="Enter Name e.g Abuja Branch"
//                 />
//               </div>
//               <div className="col-span-12 lg:col-span-4">
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Address
//                 </label>
//                 <Input
//                   value={location.address}
//                   onChange={(e) =>
//                     updateNewLocation(index, "address", e.target.value)
//                   }
//                   placeholder="Enter Address"
//                 />
//               </div>
//               <div className="col-span-12 lg:col-span-4">
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Phone Number
//                 </label>
//                 <div className="flex">
//                   {renderPhoneCountrySelector(`new-${location.id}`)}
//                   <input
//                     type="tel"
//                     value={location.phoneNumber}
//                     onChange={(e) =>
//                       updateNewLocation(index, "phoneNumber", e.target.value)
//                     }
//                     placeholder="Enter phone number"
//                     className="flex-1 px-4 py-2 bg-white border border-l-0 border-gray-300 rounded-r-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#15BA5C] transition-colors"
//                   />
//                 </div>
//               </div>
//               <div className="col-span-12 lg:col-span-1 flex justify-end">
//                 <button
//                   type="button"
//                   onClick={() => removeNewLocation(index)}
//                   className="w-[40px] h-[40px] flex items-center justify-center text-[#E33629] border border-[#E33629] rounded-lg hover:bg-[#E33629] hover:text-white"
//                 >
//                   <Trash2 className="h-4 w-4" />
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>

//         <button
//           onClick={addNewLocationField}
//           className="border border-gray-300 w-full text-gray-700 py-3 rounded-[10px] font-medium text-base mt-2 hover:bg-gray-50 disabled:opacity-50"
//           type="button"
//           disabled={!isLastNewLocationComplete()}
//         >
//           + Add a New Location
//         </button>

//         <div className="flex justify-end">
//           <button
//             onClick={handleSaveNewLocations}
//             className="flex items-center justify-center gap-2 bg-[#15BA5C] w-full text-white py-3 rounded-[10px] font-medium text-base mt-5 disabled:opacity-60"
//             type="button"
//             disabled={!canSaveNewLocations || isCreatingOutlet}
//           >
//             {isCreatingOutlet ? (
//               <>
//                 <Loader2 className="h-4 w-4 animate-spin" />
//                 <span>Saving Locations</span>
//               </>
//             ) : (
//               <>
//                 <Check className="h-4 w-4" />
//                 <span>Save Locations</span>
//               </>
//             )}
//           </button>
//         </div>
//       </div>
//     </Modal>
//   );
// };
