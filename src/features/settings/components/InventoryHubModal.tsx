// import SettingFiles from "@/assets/icons/settings";
// import { Modal } from "../ui/Modal";
// import { useEffect, useState } from "react";
// import { Input } from "../ui/Input";
// import settingsService from "@/services/settingsService";
// import { Loader2 } from "lucide-react";
// import { useSDK } from "@/components/SDKProvider";
// import { useBusinessData } from "@/stores/useBusinessData";

// interface InventoryForm {
//   name: string;
//   address: string;
// }

// export const InventoryHubModal: React.FC<{
//   isOpen: boolean;
//   onClose: () => void;
//   onSuccess: (heading: string, description: string) => void;
//   onError: (heading: string, description: string) => void;
// }> = ({ isOpen, onClose, onSuccess, onError }) => {
//   const [formData, setFormData] = useState<InventoryForm>({
//     name: "",
//     address: "",
//   });
//   const [loading, setLoading] = useState(false);
//   const sdk = useSDK();
//   const {
//     businessId,
//     isLoading: isLoadingBusiness,
//     error: businessError,
//   } = useBusinessData(isOpen);

//   useEffect(() => {
//     const fetchExistingHubData = async () => {
//       if (!isOpen || !businessId || isLoadingBusiness) return;

//       try {
//         // Fetch existing inventory hub data if any
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         const hubResponse: any = await settingsService.getInventoryHub(
//           businessId // Convert string to number if needed by the service
//         );
//         const hubList = hubResponse?.data?.hubs;
//         if (Array.isArray(hubList) && hubList.length > 0) {
//           const firstHub = hubList[0];
//           const { name, address } = firstHub;
//           setFormData({ name, address });
//         }
//       } catch (error) {
//         console.error("Error fetching inventory hubs:", error);
//         // Don't show error for fetching existing data, just log it
//       }
//     };

//     fetchExistingHubData();

//     // Reset form data on close
//     if (!isOpen) {
//       setFormData({ name: "", address: "" });
//       setLoading(false);
//     }
//   }, [isOpen, businessId, isLoadingBusiness]);

//   // Handle business data errors
//   useEffect(() => {
//     if (businessError && isOpen) {
//       onError("Failed to load business data", businessError);
//     }
//   }, [businessError, isOpen, onError]);

//   // Show loading spinner while fetching business data
//   if (isLoadingBusiness) {
//     return (
//       <Modal
//         image={SettingFiles.InventoryIcon}
//         isOpen={isOpen}
//         onClose={onClose}
//         title="Inventory Hub"
//         subtitle="Create a centralized Inventory Hub to manage your items"
//       >
//         <div className="flex justify-center items-center h-32">
//           <Loader2 className="h-6 w-6 animate-spin text-[#15BA5C]" />
//         </div>
//       </Modal>
//     );
//   }

//   // Early return if no business ID
//   if (!businessId) {
//     console.log("No businessId found, rendering null");
//     return null;
//   }

//   const handleCreateInventory = async () => {
//     if (!formData.name.trim() || !formData.address.trim()) {
//       onError(
//         "Please fill in both name and location",
//         "Please fill in both name and location"
//       );
//       return;
//     }

//     if (!businessId) {
//       onError("Business ID not found", "Business ID not found");
//       return;
//     }

//     setLoading(true);
//     try {
//       // Use SDK's inventoryService.createCentralHub
//       const result = await sdk.inventoryService.createCentralHub(
//         {
//           name: formData.name,
//           location: formData.address,
//         },
//         businessId
//       );

//       // Check if the SDK call was successful
//       if (result && result.status === true) {
//         onSuccess(
//           "Inventory Hub Created!",
//           "Your Inventory has been created successfully"
//         );

//         // Update form data with the response data if available
//         if (result.data) {
//           setFormData({
//             name: result.data.name || formData.name,
//             address:
//               result.data.location || result.data.address || formData.address,
//           });
//         }

//         onClose();
//       } else {
//         onError(
//           "Inventory Hub failed to create",
//           result?.message || "Inventory Hub failed to create"
//         );
//       } // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     } catch (error: any) {
//       console.error("Error creating inventory hub:", error);

//       // Handle different types of errors
//       const errorMessage =
//         error?.response?.data?.message ||
//         error?.message ||
//         "Something went wrong while creating Inventory Hub";

//       onError("Failed to create Inventory Hub", errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Modal
//       image={SettingFiles.InventoryIcon}
//       isOpen={isOpen}
//       onClose={onClose}
//       title="Inventory Hub"
//       subtitle="Create a centralized Inventory Hub to manage your items"
//     >
//       <div className="space-y-6">
//         <Input
//           className="outline-none"
//           label="Name your Inventory Hub"
//           value={formData.name}
//           onChange={(e) =>
//             setFormData((prev) => ({ ...prev, name: e.target.value }))
//           }
//           placeholder="Enter Your Inventory e.g. Main Warehouse"
//         />

//         <Input
//           className="outline-none"
//           label="Location"
//           value={formData.address}
//           onChange={(e) =>
//             setFormData((prev) => ({ ...prev, address: e.target.value }))
//           }
//           placeholder="Enter Location"
//         />

//         <button
//           type="button"
//           onClick={handleCreateInventory}
//           className="w-full bg-[#15BA5C] py-[9.8px] text-white rounded-[9.8px] hover:bg-[#13A652] transition-colors disabled:opacity-60"
//           disabled={loading}
//         >
//           {loading ? "Creating..." : "Create Inventory Hub"}
//         </button>
//       </div>
//     </Modal>
//   );
// };
