// "use client";
// import React, { useState, useEffect, useCallback } from "react";
// import {  Plus, X, Loader2 } from "lucide-react";
// import { Modal } from "../ui/Modal";
// import { Input } from "../ui/Input";
// import SettingFiles from "@/assets/icons/settings";
// import { useSDK } from "@/components/SDKProvider";

// interface PaymentTier {
//   id: string | number;
//   name: string;
//   paymentType: "instant" | "delivery";
//   pricingTier: "retail" | "wholesale";
//   description?: string;
// }

// interface PaymentTierModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSuccess: (heading: string, description: string) => void;
//   onError: (heading: string, description: string) => void;
// }

// export const PaymentTierModal: React.FC<PaymentTierModalProps> = ({
//   isOpen,
//   onClose,
//   onSuccess,
//   onError,
// }) => {
//   const sdk = useSDK();
  
//   const [tiers] = useState<PaymentTier[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);
  
//   // New tier form state
//   const [newTier, setNewTier] = useState({
//     name: "",
//     paymentType: "instant" as "instant" | "delivery",
//     pricingTier: "retail" as "retail" | "wholesale",
//     description: "",
//   });

//   // Load existing tiers
//   const loadTiers = useCallback(async () => {
//     if (!isOpen) return;
    
//     setIsLoading(true);
//     try {
//       // Replace with your actual SDK call to fetch payment tiers
//       // const response = await sdk.paymentTierService.getPaymentTiers();
//       // if (response.status && response.data) {
//       //   setTiers(response.data);
//       // }
//     } catch (error) {
//       console.error("Failed to load payment tiers:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [isOpen, sdk]);

//   useEffect(() => {
//     if (isOpen) {
//       loadTiers();
//     }
//   }, [isOpen, loadTiers]);

//   const handleAddTier = async () => {
//     if (!newTier.name.trim()) {
//       onError("Validation Error", "Please enter a tier name");
//       return;
//     }

//     setIsSaving(true);
//     try {
//       // Replace with your actual SDK call to create a payment tier
//       // const response = await sdk.paymentTierService.createPaymentTier({
//       //   name: newTier.name,
//       //   paymentType: newTier.paymentType,
//       //   pricingTier: newTier.pricingTier,
//       //   description: newTier.description,
//       // });

//       // if (response.status) {
//       //   setTiers([...tiers, response.data]);
//       //   setNewTier({
//       //     name: "",
//       //     paymentType: "instant",
//       //     pricingTier: "retail",
//       //     description: "",
//       //   });
//       //   onSuccess("Tier Added", "Payment tier has been added successfully");
//       // }
//     } catch (error) {
//       console.error("Failed to add tier:", error);
//       onError("Failed to Add Tier", "Unable to add payment tier. Please try again.");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   const handleDeleteTier = async (tierId: string | number) => {
//     try {
//       // // Replace with your actual SDK call to delete a payment tier
//       // await sdk.paymentTierService.deletePaymentTier(tierId);
//       // setTiers(tiers.filter(tier => tier.id !== tierId));
//       onSuccess("Tier Deleted", "Payment tier has been removed successfully");
//     } catch (error) {
//       console.error("Failed to delete tier:", error);
//       onError("Failed to Delete Tier", "Unable to delete payment tier. Please try again.");
//     }
//   };

//   const handleSave = async () => {
//     setIsSaving(true);
//     try {
//       // Any final save operations if needed
//       onSuccess("Settings Saved", "Payment tier settings have been updated successfully");
//       onClose();
//     } catch (error) {
//       console.error("Failed to save:", error);
//       onError("Save Failed", "Failed to save payment tier settings. Please try again.");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   if (isLoading) {
//     return (
//       <Modal
//         size="md"
//         subtitle="Loading payment tiers..."
//         image={SettingFiles.PaymentIcon}
//         isOpen={isOpen}
//         onClose={onClose}
//         title="Payment Tiers"
//       >
//         <div className="flex items-center justify-center py-12">
//           <Loader2 className="w-8 h-8 animate-spin text-[#15BA5C]" />
//           <span className="ml-3 text-gray-600">Loading...</span>
//         </div>
//       </Modal>
//     );
//   }

//   return (
//     <Modal
//       size="md"
//       subtitle="Add, create and remove payment tiers"
//       image={SettingFiles.PaymentIcon}
//       isOpen={isOpen}
//       onClose={onClose}
//       title="Payment Tiers"
//     >
//       <div className="space-y-6">
//         {/* Default Tier Section */}
//         <div className="p-4 border border-gray-200 rounded-lg">
//           <div className="flex items-center justify-between">
//             <div>
//               <h3 className="font-semibold text-gray-900">Default Tier</h3>
//               <p className="text-sm text-gray-500">Standard payment tier for all customers</p>
//             </div>
//             <button
//               type="button"
//               className="px-4 py-2 text-sm text-[#15BA5C] border border-[#15BA5C] rounded-lg hover:bg-green-50 transition-colors"
//             >
//               View Details
//             </button>
//           </div>
//         </div>

//         {/* Existing Tiers */}
//         {tiers.length > 0 && (
//           <div className="space-y-3">
//             <h3 className="font-semibold text-gray-900">Custom Tiers</h3>
//             {tiers.map((tier) => (
//               <div
//                 key={tier.id}
//                 className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
//               >
//                 <div className="flex items-start justify-between">
//                   <div className="flex-1">
//                     <h4 className="font-medium text-gray-900">{tier.name}</h4>
//                     <p className="text-sm text-gray-500 mt-1">
//                       {tier.paymentType === "instant" ? "Instant Payment" : "Payment on Delivery"} • 
//                       {tier.pricingTier === "retail" ? " Retail" : " Wholesale"}
//                     </p>
//                     {tier.description && (
//                       <p className="text-sm text-gray-600 mt-2">{tier.description}</p>
//                     )}
//                   </div>
//                   <button
//                     type="button"
//                     onClick={() => handleDeleteTier(tier.id)}
//                     className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
//                   >
//                     <X className="h-4 w-4" />
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}

//         {/* Create New Tier Section */}
//         <div className="space-y-4">
//           <h3 className="font-semibold text-gray-900">Create New Tier</h3>
          
//           <Input
//             label="Tier Name"
//             value={newTier.name}
//             onChange={(e) => setNewTier({ ...newTier, name: e.target.value })}
//             placeholder="Enter Tier Name"
//             className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C]"
//           />

//           {/* Payment Type Selection */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-3">
//               Select Payment Type
//             </label>
//             <div className="space-y-2">
//               <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
//                 <input
//                   type="radio"
//                   name="paymentType"
//                   checked={newTier.paymentType === "instant"}
//                   onChange={() => setNewTier({ ...newTier, paymentType: "instant" })}
//                   className="w-4 h-4 text-[#15BA5C] focus:ring-[#15BA5C]"
//                 />
//                 <span className="ml-3 text-gray-900">Instant Payment</span>
//               </label>
//               <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
//                 <input
//                   type="radio"
//                   name="paymentType"
//                   checked={newTier.paymentType === "delivery"}
//                   onChange={() => setNewTier({ ...newTier, paymentType: "delivery" })}
//                   className="w-4 h-4 text-[#15BA5C] focus:ring-[#15BA5C]"
//                 />
//                 <span className="ml-3 text-gray-900">Payment on Delivery</span>
//               </label>
//             </div>
//           </div>

//           {/* Pricing Tier Selection */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-3">
//               Apply to Pricing Tier
//             </label>
//             <div className="space-y-2">
//               <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
//                 <input
//                   type="radio"
//                   name="pricingTier"
//                   checked={newTier.pricingTier === "retail"}
//                   onChange={() => setNewTier({ ...newTier, pricingTier: "retail" })}
//                   className="w-4 h-4 text-[#15BA5C] focus:ring-[#15BA5C]"
//                 />
//                 <span className="ml-3 text-gray-900">Retail</span>
//               </label>
//               <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
//                 <input
//                   type="radio"
//                   name="pricingTier"
//                   checked={newTier.pricingTier === "wholesale"}
//                   onChange={() => setNewTier({ ...newTier, pricingTier: "wholesale" })}
//                   className="w-4 h-4 text-[#15BA5C] focus:ring-[#15BA5C]"
//                 />
//                 <span className="ml-3 text-gray-900">Wholesale</span>
//               </label>
//             </div>
//           </div>

//           {/* Description */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Description <span className="text-[#15BA5C]">(optional)</span>
//             </label>
//             <textarea
//               value={newTier.description}
//               onChange={(e) => setNewTier({ ...newTier, description: e.target.value })}
//               placeholder="Enter description"
//               rows={4}
//               className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C] resize-none"
//             />
//           </div>

//           <button
//             type="button"
//             onClick={handleAddTier}
//             disabled={isSaving || !newTier.name.trim()}
//             className="w-full py-2.5 text-[#15BA5C] border border-[#15BA5C] rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//           >
//             {isSaving ? (
//               <>
//                 <Loader2 className="w-4 h-4 animate-spin" />
//                 Adding...
//               </>
//             ) : (
//               <>
//                 <Plus className="w-4 h-4" />
//                 Add a new Tier
//               </>
//             )}
//           </button>
//         </div>

//         {/* Save Button */}
//         <button
//           onClick={handleSave}
//           disabled={isSaving}
//           className="w-full py-2.5 bg-[#15BA5C] text-white font-medium rounded-lg hover:bg-[#13A652] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//         >
//           {isSaving ? (
//             <>
//               <Loader2 className="w-4 h-4 animate-spin" />
//               Saving...
//             </>
//           ) : (
//             "Save"
//           )}
//         </button>
//       </div>
//     </Modal>
//   );
// };