// /* eslint-disable @typescript-eslint/no-explicit-any */
// import React, { useState, useEffect, useRef } from "react";
// import { Modal } from "../ui/Modal";
// import SettingFiles from "@/assets/icons/settings";
// import Image from "next/image";
// import { Input } from "../ui/Input";
// import { Loader2 } from "lucide-react";

// import { useBusinessStore } from "@/stores/useBusinessStore";
// import {
//   useCreatePriceTierMutation,
//   useDeletePriceTierMutation,
//   useUpdatePriceTierMutation,
// } from "@/redux/outlets";
// import useToastStore from "@/stores/toastStore";

// type ElectronAPI = {
//   getNetworkStatus: () => Promise<{ online: boolean }>;
//   queueAdd: (op: {
//     method: string;
//     path: string;
//     data?: any;
//     useAuth?: boolean;
//   }) => Promise<void>;
// };
// const getElectronAPI = (): ElectronAPI | null => {
//   if (typeof window === "undefined") return null;
//   const w = window as unknown as { electronAPI?: ElectronAPI };
//   return w.electronAPI ?? null;
// };

// interface PriceTier {
//   id: string | number;
//   name: string;
//   description: string;
//   pricingRules: {
//     markupPercentage?: number;
//     discountPercentage?: number;
//     fixedMarkup?: number;
//     fixedDiscount?: number;
//   };
//   isActive: boolean;
//   isEditing?: boolean;
//   isNew?: boolean;
// }

// interface PriceTierFormRef {
//   addPendingTier: () => PriceTier | null;
//   getPendingTier: () => PriceTier | null;
//   resetForm: () => void;
//   hasFormData: () => boolean;
// }

// interface PriceTierFormProps {
//   onAdd: (tier: Omit<PriceTier, "id" | "isActive">) => void;
// }

// interface PriceSettingsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// let tempIdCounter = -1;

// export const PriceSettingsModal: React.FC<PriceSettingsModalProps> = ({
//   isOpen,
//   onClose,
// }) => {
//   const { showToast } = useToastStore();
//   const outlet = useBusinessStore((s) => s.selectedOutlet);
//   const fetchBusinessData = useBusinessStore((s) => s.fetchBusinessData);
//   const [tiers, setTiers] = useState<PriceTier[]>([]);
//   const [isSaving, setIsSaving] = useState(false);
//   const [isDeleting, setIsDeleting] = useState<{
//     [key: string | number]: boolean;
//   }>({});
//   const [, setIsEditing] = useState<{ [key: string | number]: boolean }>({});
//   const [isUpdating, setIsUpdating] = useState<{
//     [key: string | number]: boolean;
//   }>({});
//   const priceTierFormRef = useRef<PriceTierFormRef>(null);

//   const [createPriceTier] = useCreatePriceTierMutation();
//   const [updatePriceTier] = useUpdatePriceTierMutation();
//   const [deletePriceTier] = useDeletePriceTierMutation();

//   useEffect(() => {
//     if (!isOpen || !outlet) return;

//     if (outlet.priceTier && Array.isArray(outlet.priceTier)) {
//       setTiers(
//         outlet.priceTier.map((tier: any) => ({ ...tier, isEditing: false }))
//       );
//     } else {
//       setTiers([]);
//     }
//   }, [isOpen, outlet]);

//   useEffect(() => {
//     if (!isOpen) {
//       setTiers([]);
//       setIsSaving(false);
//       setIsDeleting({});
//       setIsEditing({});
//       setIsUpdating({});
//       priceTierFormRef.current?.resetForm();
//     }
//   }, [isOpen]);

//   const addTier = (tier: Omit<PriceTier, "id" | "isActive">) => {
//     const newTier: PriceTier = {
//       ...tier,
//       id: tempIdCounter--,
//       isActive: true,
//       isNew: true,
//     };
//     setTiers((prev) => [...prev, newTier]);
//   };

//   const deleteTier = async (id: string | number) => {
//     if (!outlet) {
//       showToast("error", "Missing Outlet", "Outlet information is missing.");
//       return;
//     }
//     console.log(tiers, "This is the tiers");
//     console.log(id, "This is the supposed id");

//     const tierToDelete = tiers.find((t) => t.id === id);
//     setIsDeleting((prev) => ({ ...prev, [id]: true }));

//     try {
//       const api = getElectronAPI();
//       const online = await api
//         ?.getNetworkStatus()
//         .then((r) => r.online)
//         .catch(() => navigator.onLine);
//       if (online === false) {
//         await api?.queueAdd({
//           method: "DELETE",
//           path: `/outlet/${outlet.id}/price-tier/${String(id)}`,
//           useAuth: true,
//         });
//         setTiers((prev) => prev.filter((t) => t.id !== id));
//         showToast(
//           "success",
//           "Saved Offline",
//           "Deletion queued and will sync automatically"
//         );
//         return;
//       }
//       if (tierToDelete?.isNew) {
//         setTiers((prev) => prev.filter((t) => t.id !== id));
//         return;
//       }

//       await deletePriceTier({
//         outletId: outlet.id,
//         tierId: String(id),
//       }).unwrap();
//       try {
//         await fetchBusinessData();
//         const latest = useBusinessStore.getState().selectedOutlet;
//         setTiers(
//           latest?.priceTier && Array.isArray(latest.priceTier)
//             ? latest.priceTier.map((tier: any) => ({
//                 ...tier,
//                 isEditing: false,
//               }))
//             : []
//         );
//       } catch {}
//       showToast(
//         "success",
//         "Delete Successful!",
//         "Price tier deleted successfully"
//       );
//       onClose();
//     } catch (error: any) {
//       console.error("Failed to delete tier:", error);
//       showToast(
//         "error",
//         "Delete Failed",
//         error.message ||
//           "Failed to delete price tier. Please confirm it is not a default tier"
//       );
//     } finally {
//       setIsDeleting((prev) => ({ ...prev, [id]: false }));
//     }
//   };

//   const toggleEdit = (id: string | number) => {
//     setTiers((prev) =>
//       prev.map((tier) =>
//         tier.id === id ? { ...tier, isEditing: !tier.isEditing } : tier
//       )
//     );
//     setIsEditing((prev) => ({ ...prev, [id]: !prev[id] }));
//   };

//   const updateTier = async (
//     id: string | number,
//     updatedTier: Partial<PriceTier>
//   ) => {
//     if (!outlet) {
//       showToast("error", "Missing Outlet", "Outlet information is missing.");
//       return;
//     }
//     console.log(id, "This is the id");
//     if (!id || id === "new-tier") {
//       showToast(
//         "error",
//         "Fail",
//         "You can not update a default a price tier. Please create a new price tier."
//       );
//       return;
//     }
//     console.log("updatedTier", updatedTier.id);
//     const tier = tiers.find((t) => t.id === id);
//     if (!tier) return;

//     setIsUpdating((prev) => ({ ...prev, [id]: true }));

//     try {
//       if (tier.isNew) {
//         setTiers((prev) =>
//           prev.map((t) =>
//             t.id === id ? { ...t, ...updatedTier, isEditing: false } : t
//           )
//         );
//         setIsEditing((prev) => ({ ...prev, [id]: false }));
//       } else {
//         const api = getElectronAPI();
//         const online = await api
//           ?.getNetworkStatus()
//           .then((r) => r.online)
//           .catch(() => navigator.onLine);
//         if (online === false) {
//           await api?.queueAdd({
//             method: "PATCH",
//             path: `/outlet/${outlet.id}/price-tier/${String(id)}`,
//             data: {
//               name: updatedTier.name,
//               description: updatedTier.description,
//               pricingRules: updatedTier.pricingRules,
//             },
//             useAuth: true,
//           });
//           setTiers((prev) =>
//             prev.map((t) =>
//               t.id === id ? { ...t, ...updatedTier, isEditing: false } : t
//             )
//           );
//           setIsEditing((prev) => ({ ...prev, [id]: false }));
//           showToast(
//             "success",
//             "Saved Offline",
//             "Update queued and will sync automatically"
//           );
//           onClose();
//           return;
//         }
//         await updatePriceTier({
//           outletId: outlet.id,
//           tierId: String(id),
//           data: {
//             name: updatedTier.name,
//             description: updatedTier.description,
//             pricingRules: updatedTier.pricingRules,
//           },
//         }).unwrap();
//         try {
//           await fetchBusinessData();
//           const latest = useBusinessStore.getState().selectedOutlet;
//           setTiers(
//             latest?.priceTier && Array.isArray(latest.priceTier)
//               ? latest.priceTier.map((tier: any) => ({
//                   ...tier,
//                   isEditing: false,
//                 }))
//               : []
//           );
//         } catch {}
//         setIsEditing((prev) => ({ ...prev, [id]: false }));
//         showToast(
//           "success",
//           "Update Successful!",
//           "Price tier updated successfully"
//         );
//         onClose();
//       }
//     } catch (error: any) {
//       console.error("Failed to update tier:", error);
//       showToast(
//         "error",
//         "Update Failed",
//         error.message || "Failed to update price tier"
//       );
//     } finally {
//       setIsUpdating((prev) => ({ ...prev, [id]: false }));
//     }
//   };

//   const handleSaveAll = async () => {
//     if (!outlet) {
//       showToast("error", "Missing Store ID", "Store information is missing.");
//       return;
//     }

//     setIsSaving(true);
//     try {
//       const formRef = priceTierFormRef.current;
//       const hasFormData = formRef?.hasFormData();
//       const tiersToSave: PriceTier[] = [];

//       if (hasFormData) {
//         const pendingTier = formRef?.getPendingTier();
//         if (!pendingTier) {
//           setIsSaving(false);
//           return;
//         }
//         tiersToSave.push(pendingTier);
//         setTiers((prev) => [...prev, pendingTier]);
//       }

//       const newTiers = tiers.filter((tier) => tier.isNew);
//       tiersToSave.push(...newTiers);

//       for (const tier of tiersToSave) {
//         const rules = tier.pricingRules;
//         const hasMarkup =
//           typeof rules?.markupPercentage === "number" &&
//           rules.markupPercentage > 0;
//         const hasDiscount =
//           typeof rules?.discountPercentage === "number" &&
//           rules.discountPercentage > 0;
//         if (!hasMarkup && !hasDiscount) {
//           showToast(
//             "error",
//             `Price tier "${tier.name}" must have either a markup or discount rule.`,
//             `Price tier "${tier.name}" is missing a valid pricing rule.`
//           );
//           setIsSaving(false);
//           return;
//         }
//       }

//       if (tiersToSave.length === 0) {
//         showToast(
//           "error",
//           "No new price tiers to save.",
//           "No new price tiers to save."
//         );
//         setIsSaving(false);
//         return;
//       }

//       const savedTierIds = new Set<PriceTier["id"]>();
//       const api = getElectronAPI();
//       const online = await api
//         ?.getNetworkStatus()
//         .then((r) => r.online)
//         .catch(() => navigator.onLine);

//       if (online === false) {
//         for (const tier of tiersToSave) {
//           await api?.queueAdd({
//             method: "POST",
//             path: `/outlet/${outlet.id}/price-tier`,
//             data: {
//               name: tier.name,
//               description: tier.description,
//               pricingRules: tier.pricingRules,
//               isActive: tier.isActive,
//             },
//             useAuth: true,
//           });
//           savedTierIds.add(tier.id);
//         }
//       } else {
//         for (const tier of tiersToSave) {
//           try {
//             await createPriceTier({
//               outletId: outlet.id,
//               data: {
//                 name: tier.name,
//                 description: tier.description,
//                 pricingRules: tier.pricingRules,
//                 isActive: tier.isActive,
//               },
//             }).unwrap();
//             savedTierIds.add(tier.id);
//           } catch (error: any) {
//             console.error(`Failed to save tier "${tier.name}":`, error);
//             showToast(
//               "error",
//               `Failed to save tier "${tier.name}".`,
//               error?.message || "Unknown error"
//             );
//           }
//         }
//       }

//       if (savedTierIds.size > 0) {
//         const allSaved = savedTierIds.size === tiersToSave.length;
//         showToast(
//           "success",
//           allSaved ? "Save Successful!" : "Partial Save Successful",
//           allSaved
//             ? "All price tiers saved successfully!"
//             : `${savedTierIds.size} of ${tiersToSave.length} price tiers saved successfully.`
//         );
//         try {
//           await fetchBusinessData();
//           const latest = useBusinessStore.getState().selectedOutlet;
//           setTiers(
//             latest?.priceTier && Array.isArray(latest.priceTier)
//               ? latest.priceTier.map((tier: any) => ({
//                   ...tier,
//                   isEditing: false,
//                 }))
//               : []
//           );
//         } catch {
//           setTiers((prev) =>
//             prev.map((tier) =>
//               savedTierIds.has(tier.id) ? { ...tier, isNew: false } : tier
//             )
//           );
//         }
//         formRef?.resetForm();
//         onClose();
//       }
//     } catch (error: any) {
//       console.error("Failed to save tiers:", error);
//       showToast(
//         "error",
//         "Save Failed",
//         error.message || "An error occurred while saving price tiers"
//       );
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const getDisplayValue = (tier: PriceTier) => {
//     const markup = tier.pricingRules.markupPercentage || 0;
//     const discount = tier.pricingRules.discountPercentage || 0;
//     return { markup, discount };
//   };

//   if (!outlet) {
//     return (
//       <Modal
//         size="md"
//         subtitle="Add, create and remove price tiers"
//         image={SettingFiles.PriceTier}
//         isOpen={isOpen}
//         onClose={onClose}
//         title="Price Settings"
//       >
//         <div className="flex justify-center items-center h-32">
//           <Loader2 className="h-6 w-6 animate-spin text-[#15BA5C]" />
//         </div>
//       </Modal>
//     );
//   }

//   return (
//     <Modal
//       size="md"
//       subtitle="Add, create and remove price tiers"
//       image={SettingFiles.PriceTier}
//       isOpen={isOpen}
//       onClose={onClose}
//       title="Price Settings"
//     >
//       <div className="space-y-6">
//         {tiers.length > 0 &&
//           tiers.map((tier) => {
//             const { markup, discount } = getDisplayValue(tier);
//             const isCurrentlyDeleting = isDeleting[tier.id];
//             const isCurrentlyUpdating = isUpdating[tier.id] || false;

//             return (
//               <div
//                 key={tier.id}
//                 className="rounded-lg p-4 border border-gray-200"
//               >
//                 {tier.isEditing ? (
//                   <EditableTierForm
//                     tier={tier}
//                     onSave={async (updatedTier) => {
//                       await updateTier(tier.id, {
//                         ...updatedTier,
//                         isEditing: false,
//                       });
//                     }}
//                     onCancel={() => toggleEdit(tier.id)}
//                     isLoading={isCurrentlyUpdating}
//                   />
//                 ) : (
//                   <>
//                     <div className="flex items-center justify-between mb-2">
//                       <span className="font-medium">{tier.name}</span>
//                       <div className="flex items-center gap-2">
//                         <button
//                           onClick={() => toggleEdit(tier.id)}
//                           type="button"
//                           disabled={isCurrentlyDeleting || isCurrentlyUpdating}
//                           className={`bg-[#15BA5C] flex items-center rounded-[20px] px-2.5 py-1.5 transition-colors ${
//                             isCurrentlyDeleting || isCurrentlyUpdating
//                               ? "opacity-50 cursor-not-allowed"
//                               : "hover:bg-[#13a552]"
//                           }`}
//                         >
//                           <Image
//                             src={SettingFiles.EditIcon}
//                             alt="Edit"
//                             className="h-[14px] w-[14px] mr-1"
//                           />
//                           <span className="text-white">Edit</span>
//                         </button>
//                         <button
//                           onClick={() => deleteTier(tier.id)}
//                           type="button"
//                           disabled={isCurrentlyDeleting || isCurrentlyUpdating}
//                           className={`border border-[#E33629] flex items-center rounded-[20px] px-2.5 py-1.5 transition-colors ${
//                             isCurrentlyDeleting || isCurrentlyUpdating
//                               ? "opacity-50 cursor-not-allowed"
//                               : "hover:bg-red-50"
//                           }`}
//                         >
//                           <Image
//                             src={SettingFiles.TrashIcon}
//                             alt="Delete"
//                             className="h-[14px] w-[14px] mr-1"
//                           />
//                           <span className="text-[#E33629]">
//                             {isCurrentlyDeleting ? "Deleting..." : "Delete"}
//                           </span>
//                         </button>
//                       </div>
//                     </div>
//                     {tier.description && (
//                       <div className="text-sm text-gray-600 mb-2">
//                         {tier.description}
//                       </div>
//                     )}
//                     <div className="text-sm text-gray-600 space-y-2">
//                       {markup > 0 && (
//                         <div className="border border-[#E6E6E6] px-3.5 py-2.5 rounded-[12px]">
//                           Markup: {markup}%
//                         </div>
//                       )}
//                       {discount > 0 && (
//                         <div className="border border-[#E6E6E6] px-3.5 py-2.5 rounded-[12px]">
//                           Discount: {discount}%
//                         </div>
//                       )}
//                     </div>
//                   </>
//                 )}
//               </div>
//             );
//           })}

//         <div>
//           <h4 className="font-medium mb-4">Add New Price Tier</h4>
//           <PriceTierForm ref={priceTierFormRef} onAdd={addTier} />
//         </div>

//         <div className="flex flex-col gap-3">
//           <button
//             onClick={handleSaveAll}
//             disabled={isSaving}
//             className={`w-full text-white py-3 rounded-[10px] font-medium text-base transition-colors ${
//               isSaving
//                 ? "bg-gray-400 cursor-not-allowed"
//                 : "bg-[#15BA5C] hover:bg-[#13a552]"
//             }`}
//             type="button"
//           >
//             {isSaving ? "Saving..." : "Save Price Tiers"}
//           </button>
//         </div>
//       </div>
//     </Modal>
//   );
// };

// interface EditableTierFormProps {
//   tier: PriceTier;
//   onSave: (tier: Partial<PriceTier>) => Promise<void>;
//   onCancel: () => void;
//   isLoading?: boolean;
// }

// const EditableTierForm: React.FC<EditableTierFormProps> = ({
//   tier,
//   onSave,
//   onCancel,
//   isLoading = false,
// }) => {
//   const { showToast } = useToastStore();
//   const [editedTier, setEditedTier] = useState({
//     name: tier.name,
//     description: tier.description || "",
//     markupPercent: tier.pricingRules.markupPercentage || 0,
//     discountPercent: tier.pricingRules.discountPercentage || 0,
//   });

//   const [markupEnabled, setMarkupEnabled] = useState(
//     (tier.pricingRules.markupPercentage || 0) > 0
//   );
//   const [discountEnabled, setDiscountEnabled] = useState(
//     (tier.pricingRules.discountPercentage || 0) > 0
//   );

//   const handleMarkupToggle = (enabled: boolean) => {
//     setMarkupEnabled(enabled);
//     if (enabled) {
//       setDiscountEnabled(false);
//       setEditedTier((prev) => ({ ...prev, discountPercent: 0 }));
//     } else {
//       setEditedTier((prev) => ({ ...prev, markupPercent: 0 }));
//     }
//   };

//   const handleDiscountToggle = (enabled: boolean) => {
//     setDiscountEnabled(enabled);
//     if (enabled) {
//       setMarkupEnabled(false);
//       setEditedTier((prev) => ({ ...prev, markupPercent: 0 }));
//     } else {
//       setEditedTier((prev) => ({ ...prev, discountPercent: 0 }));
//     }
//   };

//   const handleSave = async () => {
//     if (!editedTier.name || editedTier.name.trim() === "") {
//       showToast(
//         "error",
//         "Please enter a price tier name.",
//         "Please enter a price tier name."
//       );
//       return;
//     }

//     await onSave({
//       name: editedTier.name.trim(),
//       description: editedTier.description.trim(),
//       pricingRules: {
//         markupPercentage: markupEnabled ? editedTier.markupPercent : undefined,
//         discountPercentage: discountEnabled
//           ? editedTier.discountPercent
//           : undefined,
//       },
//     });
//   };

//   return (
//     <div className="space-y-4">
//       <div>
//         <label className="block text-sm font-medium mb-1">
//           Price Tier Name
//         </label>
//         <input
//           type="text"
//           className="w-full px-4 py-3 bg-white border border-[#D1D1D1] outline-none rounded-lg"
//           value={editedTier.name}
//           onChange={(e) =>
//             setEditedTier({ ...editedTier, name: e.target.value })
//           }
//           placeholder="Enter the name of the Price Tier"
//           disabled={isLoading}
//         />
//       </div>
//       <div>
//         <label className="text-sm flex items-center gap-1.5 font-medium mb-1">
//           <span>Description</span>
//           <span className="text-[#15BA5C]">(optional)</span>
//         </label>
//         <textarea
//           className="w-full px-4 py-3 bg-white border border-gray-300 outline-none rounded-lg resize-none text-sm"
//           value={editedTier.description}
//           onChange={(e) =>
//             setEditedTier({ ...editedTier, description: e.target.value })
//           }
//           placeholder="Enter description"
//           rows={3}
//           disabled={isLoading}
//         />
//       </div>
//       <div className="flex flex-col gap-3">
//         <div className="flex items-center gap-3">
//           <input
//             type="checkbox"
//             id={`markup-checkbox-${tier.id}`}
//             checked={markupEnabled}
//             onChange={(e) => handleMarkupToggle(e.target.checked)}
//             className="appearance-none w-3 h-3 border-2 border-[#15BA5C] rounded-full checked:bg-[#15BA5C] checked:border-[#15BA5C] focus:outline-none focus:ring-2 focus:ring-[#15BA5C] cursor-pointer"
//             disabled={isLoading}
//           />
//           <label
//             htmlFor={`markup-checkbox-${tier.id}`}
//             className="text-sm font-medium"
//           >
//             Markup %
//           </label>
//         </div>
//         {markupEnabled && (
//           <Input
//             className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg outline-none"
//             type="text"
//             min={0}
//             max={100}
//             value={editedTier.markupPercent || ""}
//             onChange={(e) =>
//               setEditedTier({
//                 ...editedTier,
//                 markupPercent: parseFloat(e.target.value) || 0,
//               })
//             }
//             placeholder="Enter markup percentage"
//             disabled={isLoading}
//           />
//         )}
//       </div>
//       <div className="flex flex-col gap-3">
//         <div className="flex items-center gap-3">
//           <input
//             type="checkbox"
//             id={`discount-checkbox-${tier.id}`}
//             checked={discountEnabled}
//             onChange={(e) => handleDiscountToggle(e.target.checked)}
//             className="appearance-none w-3 h-3 border-2 border-[#15BA5C] rounded-full checked:bg-[#15BA5C] checked:border-[#15BA5C] focus:outline-none focus:ring-2 focus:ring-[#15BA5C] cursor-pointer"
//             disabled={isLoading}
//           />
//           <label
//             htmlFor={`discount-checkbox-${tier.id}`}
//             className="text-sm font-medium"
//           >
//             Discount %
//           </label>
//         </div>
//         {discountEnabled && (
//           <Input
//             type="text"
//             min={0}
//             max={100}
//             className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg outline-none"
//             value={editedTier.discountPercent || ""}
//             onChange={(e) =>
//               setEditedTier({
//                 ...editedTier,
//                 discountPercent: parseFloat(e.target.value) || 0,
//               })
//             }
//             placeholder="Enter discount percentage"
//             disabled={isLoading}
//           />
//         )}
//       </div>
//       <div className="flex gap-2 pt-2">
//         <button
//           onClick={handleSave}
//           disabled={isLoading}
//           className={`flex-1 text-white py-2.5 rounded-[10px] font-medium text-base transition-colors ${
//             isLoading
//               ? "bg-gray-400 cursor-not-allowed"
//               : "bg-[#15BA5C] hover:bg-[#13a552]"
//           }`}
//           type="button"
//         >
//           {isLoading ? "Saving..." : "Save Changes"}
//         </button>
//         <button
//           onClick={onCancel}
//           disabled={isLoading}
//           className={`flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-[10px] font-medium text-base transition-colors ${
//             isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
//           }`}
//           type="button"
//         >
//           Cancel
//         </button>
//       </div>
//     </div>
//   );
// };

// export const PriceTierForm = React.forwardRef<
//   PriceTierFormRef,
//   PriceTierFormProps
// >(({ onAdd }, ref) => {
//   const { showToast } = useToastStore();
//   const [tier, setTier] = useState({
//     name: "",
//     description: "",
//     markupPercent: 0,
//     discountPercent: 0,
//   });
//   const [markupEnabled, setMarkupEnabled] = useState(false);
//   const [discountEnabled, setDiscountEnabled] = useState(false);

//   const handleMarkupToggle = (enabled: boolean) => {
//     setMarkupEnabled(enabled);
//     if (enabled) {
//       setDiscountEnabled(false);
//       setTier((prev) => ({ ...prev, discountPercent: 0 }));
//     }
//   };

//   const handleDiscountToggle = (enabled: boolean) => {
//     setDiscountEnabled(enabled);
//     if (enabled) {
//       setMarkupEnabled(false);
//       setTier((prev) => ({ ...prev, markupPercent: 0 }));
//     }
//   };

//   const resetForm = () => {
//     setTier({
//       name: "",
//       description: "",
//       markupPercent: 0,
//       discountPercent: 0,
//     });
//     setMarkupEnabled(false);
//     setDiscountEnabled(false);
//   };

//   const hasFormData = () => {
//     return tier.name.trim() !== "" || tier.description.trim() !== "";
//   };

//   const createTierObject = (): PriceTier => {
//     return {
//       id: tempIdCounter--,
//       name: tier.name.trim(),
//       description: tier.description.trim(),
//       pricingRules: {
//         markupPercentage: markupEnabled ? tier.markupPercent : undefined,
//         discountPercentage: discountEnabled ? tier.discountPercent : undefined,
//       },
//       isActive: true,
//       isNew: true,
//     };
//   };

//   const addTierInternal = () => {
//     if (!tier.name || tier.name.trim() === "") {
//       return false;
//     }
//     const newTier = {
//       name: tier.name.trim(),
//       description: tier.description.trim(),
//       pricingRules: {
//         markupPercentage: markupEnabled ? tier.markupPercent : undefined,
//         discountPercentage: discountEnabled ? tier.discountPercent : undefined,
//       },
//     };
//     onAdd(newTier);
//     resetForm();
//     return true;
//   };

//   React.useImperativeHandle(ref, () => ({
//     getPendingTier: () => {
//       const hasRule = markupEnabled || discountEnabled;
//       if (tier.name.trim() !== "" && hasRule) {
//         return createTierObject();
//       }
//       return null;
//     },
//     addPendingTier: () => {
//       const hasRule = markupEnabled || discountEnabled;
//       if (tier.name.trim() !== "" && hasRule) {
//         const newTier = createTierObject();
//         onAdd({
//           name: newTier.name,
//           description: newTier.description,
//           pricingRules: newTier.pricingRules,
//         });
//         resetForm();
//         return newTier;
//       }
//       showToast(
//         "error",
//         "Price tier must have either a markup or discount rule.",
//         "Price tier must have either a markup or discount rule."
//       );
//       return null;
//     },
//     resetForm,
//     hasFormData,
//   }));

//   const handleAdd = () => {
//     if (!tier.name || tier.name.trim() === "") {
//       showToast(
//         "error",
//         "Please enter a price tier name.",
//         "Please enter a price tier name."
//       );
//       return;
//     }
//     const hasRule = markupEnabled || discountEnabled;
//     if (!hasRule) {
//       showToast(
//         "error",
//         "Please select a pricing rule (markup or discount).",
//         "Please select a pricing rule (markup or discount)."
//       );
//       return;
//     }
//     addTierInternal();
//   };

//   return (
//     <div className="space-y-4">
//       <div>
//         <label className="block text-sm font-medium mb-1">
//           Price Tier Name
//         </label>
//         <input
//           type="text"
//           className="w-full px-4 py-3 bg-white border outline-none border-[#D1D1D1] rounded-lg"
//           value={tier.name}
//           onChange={(e) => setTier({ ...tier, name: e.target.value })}
//           placeholder="Enter the name of the Price Tier"
//         />
//       </div>
//       <div>
//         <label className="text-sm flex items-center gap-1.5 font-medium mb-1">
//           <span>Description</span>
//           <span className="text-[#15BA5C]">(optional)</span>
//         </label>
//         <textarea
//           className="w-full px-4 py-3 bg-white border border-[#D1D1D1] outline-none rounded-lg resize-none text-sm"
//           value={tier.description}
//           onChange={(e) => setTier({ ...tier, description: e.target.value })}
//           placeholder="Enter description"
//           rows={3}
//         />
//       </div>
//       <div className="flex flex-col gap-3">
//         <div className="flex items-center gap-3">
//           <input
//             type="checkbox"
//             id="new-markup-checkbox"
//             checked={markupEnabled}
//             onChange={(e) => handleMarkupToggle(e.target.checked)}
//             className="appearance-none w-3 h-3 border-2 border-[#15BA5C] rounded-full checked:bg-[#15BA5C] checked:border-[#15BA5C] focus:outline-none focus:ring-2 focus:ring-[#15BA5C] cursor-pointer"
//           />
//           <label htmlFor="new-markup-checkbox" className="text-sm font-medium">
//             Markup %
//           </label>
//         </div>
//         {markupEnabled && (
//           <Input
//             className="w-full px-4 py-3 bg-white border border-[#D1D1D1] rounded-lg outline-none"
//             type="text"
//             min={0}
//             max={100}
//             value={tier.markupPercent || ""}
//             onChange={(e) =>
//               setTier({
//                 ...tier,
//                 markupPercent: parseFloat(e.target.value) || 0,
//               })
//             }
//             placeholder="Enter markup percentage"
//           />
//         )}
//       </div>
//       <div className="flex flex-col gap-3">
//         <div className="flex items-center gap-3">
//           <input
//             type="checkbox"
//             id="new-discount-checkbox"
//             checked={discountEnabled}
//             onChange={(e) => handleDiscountToggle(e.target.checked)}
//             className="appearance-none w-3 h-3 border-2 border-[#15BA5C] rounded-full checked:bg-[#15BA5C] checked:border-[#15BA5C] focus:outline-none focus:ring-2 focus:ring-[#15BA5C] cursor-pointer"
//           />
//           <label
//             htmlFor="new-discount-checkbox"
//             className="text-sm font-medium"
//           >
//             Discount %
//           </label>
//         </div>
//         {discountEnabled && (
//           <Input
//             type="text"
//             min={0}
//             max={100}
//             className="w-full px-4 py-3 bg-white border border-[#D1D1D1] rounded-lg outline-none"
//             value={tier.discountPercent || ""}
//             onChange={(e) =>
//               setTier({
//                 ...tier,
//                 discountPercent: parseFloat(e.target.value) || 0,
//               })
//             }
//             placeholder="Enter discount percentage"
//           />
//         )}
//       </div>
//       <button
//         onClick={handleAdd}
//         className="border border-[#15BA5C] w-full text-[#15BA5C] py-2.5 rounded-[10px] font-medium text-base mt-4 hover:bg-green-50 transition-colors"
//         type="button"
//       >
//         + Add a new Price Tier
//       </button>
//     </div>
//   );
// });

// PriceTierForm.displayName = "PriceTierForm";
