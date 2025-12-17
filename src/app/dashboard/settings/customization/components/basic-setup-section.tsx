// // import SuccessToast from "@/components/Modals/Success/SuccessModal";
// // import ErrorModal from "@/components/Modals/Errors/ErrorModal";
// // import React, { useState } from "react";
// // import { BiCopy } from "react-icons/bi";
// // import ErrorToast from "@/components/Modals/Errors/ErrorModal";

// // interface BasicSetupSectionProps {
// //   storeData: any;
// //   onContinue: () => void;
// // }

// // export default function BasicSetupSection({
// //   storeData,
// //   onContinue,
// // }: BasicSetupSectionProps) {
// //   // Mock outlet data for demonstration
// //   // Get existing outlet data from Redux store

// //   const [successToast, setSuccessToast] = useState({
// //     isOpen: false,
// //     heading: "",
// //     description: "",
// //   });
// //   const [errorToast, setErrorToast] = useState({
// //     isOpen: false,
// //     heading: "",
// //     description: "",
// //   });
// //   // If still loading or no data yet, show loader or return null

// //   const outlet = {
// //     id: "demo-outlet",
// //     whatsappChannel: false,
// //     emailChannel: false,
// //     whatsappNumber: "",
// //     emailAddress: "Dexstore283@gmail.com",
// //     websiteUrl: "https://bountip.renjjstaurant/Bob...",
// //   };

// //   // Form state
// //   const [formData, setFormData] = useState({
// //     whatsappChannel: outlet.whatsappChannel || false,
// //     emailChannel: outlet.emailChannel || false,
// //     websiteChannel: true,
// //     whatsappNumber: outlet.whatsappNumber || "",
// //   });

// //   const [isEditing, setIsEditing] = useState({
// //     whatsapp: false,
// //     email: false,
// //     website: false,
// //   });

// //   // Validation state
// //   const [errors, setErrors] = useState({
// //     whatsappNumber: "",
// //   });

// //   const [isLoading, setIsLoading] = useState(false);

// //   // Handle channel activation
// //   const handleActivateChannel = (channel: "whatsapp" | "email" | "website") => {
// //     if (channel === "whatsapp") {
// //       setIsEditing({ ...isEditing, whatsapp: true });
// //       setFormData({ ...formData, whatsappChannel: true });
// //     } else if (channel === "email") {
// //       setFormData({ ...formData, emailChannel: true });
// //     } else if (channel === "website") {
// //       setFormData({ ...formData, websiteChannel: true });
// //     }
// //   };

// //   // Handle input changes
// //   const handleInputChange = (field: string, value: string) => {
// //     setFormData((prev) => ({
// //       ...prev,
// //       [field]: value,
// //     }));

// //     if (errors[field as keyof typeof errors]) {
// //       setErrors((prev) => ({
// //         ...prev,
// //         [field]: "",
// //       }));
// //     }
// //   };

// //   // Validation
// //   const validateWhatsAppNumber = () => {
// //     if (formData.whatsappChannel && !formData.whatsappNumber.trim()) {
// //       setErrors({ whatsappNumber: "WhatsApp number is required" });
// //       return false;
// //     }
// //     if (formData.whatsappChannel && formData.whatsappNumber.trim()) {
// //       const whatsappRegex = /^[\+]?[1-9][\d]{0,15}$/;
// //       if (!whatsappRegex.test(formData.whatsappNumber.replace(/\s/g, ""))) {
// //         setErrors({ whatsappNumber: "Please enter a valid WhatsApp number" });
// //         return false;
// //       }
// //     }
// //     return true;
// //   };

// //   const handleCopyOnDomain = async () => {
// //     try {
// //       await navigator.clipboard.writeText(storeData.data.customSubDomain);
// //       setSuccessToast({
// //         isOpen: true,
// //         heading: "Copied!",
// //         description: "Website link has been copied to your clipboard!",
// //       });
// //     } catch (error) {
// //       console.error("Failed to copy domain:", error);
// //       setErrorToast({
// //         isOpen: true,
// //         heading: "Copy Failed",
// //         description: "Unable to copy website link. Please try again.",
// //       });
// //     }
// //   };

// //   return (
// //     <div className=" p-6">
// //       <div className="mb-8">
// //         <h2 className="text-3xl font-bold text-gray-900 mb-2">Basic Setup</h2>
// //         <p className="text-gray-600 text-lg">
// //           Activate the channels you want to receive online orders from
// //         </p>
// //       </div>

// //       <div className="space-y-4">
// //         {/* WhatsApp Channel */}
// //         <div className="border bg-white border-gray-200 rounded-xl p-6 ">
// //           <div className="flex items-center justify-between">
// //             <div className="flex items-center gap-4">
// //               <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
// //                 <svg
// //                   className="w-6 h-6 text-green-600"
// //                   fill="currentColor"
// //                   viewBox="0 0 24 24"
// //                 >
// //                   <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
// //                 </svg>
// //               </div>
// //               <h3 className="text-xl font-semibold text-gray-900">
// //                 WhatsApp Channel
// //               </h3>
// //             </div>
// //             {!formData.whatsappChannel && (
// //               <button
// //                 onClick={() => handleActivateChannel("whatsapp")}
// //                 className="px-6 py-2.5 bg-[#15BA5C] text-white rounded-lg hover:bg-[#13A652] transition-colors font-medium"
// //               >
// //                 Activate WhatsApp Store Front
// //               </button>
// //             )}
// //           </div>

// //           {formData.whatsappChannel && (
// //             <div className=" w-full mt-6 ">
// //               <label className="block text-sm font-medium text-gray-700 mb-2">
// //                 Whatsapp Number
// //               </label>
// //               <input
// //                 type="tel"
// //                 value={formData.whatsappNumber}
// //                 onChange={(e) =>
// //                   handleInputChange("whatsappNumber", e.target.value)
// //                 }
// //                 placeholder="Enter your business whatsapp no"
// //                 className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C] ${
// //                   errors.whatsappNumber ? "border-red-500" : "border-gray-300"
// //                 }`}
// //               />
// //               {errors.whatsappNumber && (
// //                 <p className="text-sm text-red-500 mt-2">
// //                   {errors.whatsappNumber}
// //                 </p>
// //               )}
// //               <p className="text-sm text-gray-500 mt-2">
// //                 Customers will be able to contact you via this WhatsApp Number
// //               </p>
// //             </div>
// //           )}
// //         </div>

// //         {/* Email Channel */}
// //         <div className="border border-gray-200 rounded-xl p-6 bg-white">
// //           <div className="flex items-center justify-between">
// //             <div className="flex items-center gap-4">
// //               <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
// //                 <svg
// //                   className="w-6 h-6 text-green-600"
// //                   fill="none"
// //                   stroke="currentColor"
// //                   viewBox="0 0 24 24"
// //                 >
// //                   <path
// //                     strokeLinecap="round"
// //                     strokeLinejoin="round"
// //                     strokeWidth={2}
// //                     d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
// //                   />
// //                 </svg>
// //               </div>
// //               <h3 className="text-xl font-semibold text-gray-900">Email</h3>
// //             </div>
// //             {!formData.emailChannel && (
// //               <button
// //                 onClick={() => handleActivateChannel("email")}
// //                 className="px-6 py-2.5 bg-[#15BA5C] text-white rounded-lg hover:bg-[#13A652] transition-colors font-medium"
// //               >
// //                 Activate Email Store Front
// //               </button>
// //             )}
// //           </div>

// //           {formData.emailChannel && (
// //             <div className="mt-6 ml-16">
// //               <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
// //                 <span className="text-gray-700">{outlet.emailAddress}</span>
// //                 <button className="text-purple-600 hover:text-purple-700">
// //                   <svg
// //                     className="w-5 h-5"
// //                     fill="none"
// //                     stroke="currentColor"
// //                     viewBox="0 0 24 24"
// //                   >
// //                     <path
// //                       strokeLinecap="round"
// //                       strokeLinejoin="round"
// //                       strokeWidth={2}
// //                       d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
// //                     />
// //                   </svg>
// //                 </button>
// //               </div>
// //             </div>
// //           )}
// //         </div>

// //         {/* Website Channel */}
// //         <div className="border border-gray-200 rounded-xl p-6 bg-white">
// //           <div className="flex items-center justify-between">
// //             <div className="flex items-center gap-4">
// //               <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
// //                 <svg
// //                   className="w-6 h-6 text-green-600"
// //                   fill="none"
// //                   stroke="currentColor"
// //                   viewBox="0 0 24 24"
// //                 >
// //                   <path
// //                     strokeLinecap="round"
// //                     strokeLinejoin="round"
// //                     strokeWidth={2}
// //                     d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
// //                   />
// //                 </svg>
// //               </div>
// //               <h3 className="text-xl font-semibold text-gray-900">Website</h3>
// //             </div>
// //             {!storeData?.data?.customSubDomain ? (
// //               <button
// //                 onClick={() => handleActivateChannel("website")}
// //                 className="px-6 py-2.5 bg-[#15BA5C] text-white rounded-lg hover:bg-[#13A652] transition-colors font-medium"
// //               >
// //                 Activate Web Store Front
// //               </button>
// //             ) : (
// //               <span className="px-4 py-2 bg-green-50 text-green-700 rounded-lg font-medium text-sm">
// //                 Active
// //               </span>
// //             )}
// //           </div>

// //           {formData.websiteChannel && (
// //             <div className="mt-6 ml-16">
// //               <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
// //                 <span className="text-gray-700">
// //                   {storeData.data.customSubDomain}
// //                 </span>
// //                 <button
// //                   onClick={handleCopyOnDomain}
// //                   className="cursor-pointer  hover:text-purple-700"
// //                 >
// //                   <BiCopy />
// //                 </button>
// //               </div>
// //             </div>
// //           )}
// //         </div>

// //         {/* <button
// //           className="bg-[#15BA5C] w-full p-[7.73px] rounded-[7.73px] text-[#FFFFFF]"
// //           type="button"
// //           disabled={false}
// //         >
// //           Save and Continue
// //         </button> */}
// //       </div>
// //       <SuccessToast
// //         isOpen={successToast.isOpen}
// //         heading={successToast.heading}
// //         description={successToast.description}
// //         onClose={() => setSuccessToast((prev) => ({ ...prev, isOpen: false }))}
// //         duration={5000}
// //       />
// //       <ErrorToast
// //         isOpen={errorToast.isOpen}
// //         heading={errorToast.heading}
// //         description={errorToast.description}
// //         onClose={() => setErrorToast((prev) => ({ ...prev, isOpen: false }))}
// //         duration={5000}
// //       />
// //     </div>
// //   );
// // }

// import SuccessToast from "@/components/Modals/Success/SuccessModal";
// import ErrorToast from "@/components/Modals/Errors/ErrorModal";
// import React, { useState, useEffect } from "react";
// import { BiCopy } from "react-icons/bi";
// import { useAppSelector } from "@/hooks/redux-hooks";
// import {
//   useLazyGetStoreDetailsQuery,
//   useUpdateStoreChannelMutation,
// } from "@/redux/store/store-setting";

// interface BasicSetupSectionProps {
//   storeData: any;
//   onContinue: () => void;
// }

// export default function BasicSetupSection({
//   storeData,
//   onContinue,
// }: BasicSetupSectionProps) {
//   const outlet = useAppSelector((state) => state.business.outlet);
//   const [updateStoreChannel] = useUpdateStoreChannelMutation();
//   const [getStoreDetails, { data, isLoading }] = useLazyGetStoreDetailsQuery();

//   const [loadingStates, setLoadingStates] = useState({
//     whatsapp: false,
//     email: false,
//     website: false,
//   });

//   const [successToast, setSuccessToast] = useState({
//     isOpen: false,
//     heading: "",
//     description: "",
//   });
//   const [errorToast, setErrorToast] = useState({
//     isOpen: false,
//     heading: "",
//     description: "",
//   });

//   // Form state - Initialize from storeData
//   const [formData, setFormData] = useState({
//     whatsappChannel: false,
//     emailChannel: false,
//     websiteChannel: false,
//     whatsappNumber: "",
//   });

//   // Update form data when storeData loads
//   useEffect(() => {
//     if (storeData?.data) {
//       setFormData({
//         whatsappChannel: storeData.data.waChannel || false,
//         emailChannel: storeData.data.emailChannel || false,
//         websiteChannel: storeData.data.webChannel || false,
//         whatsappNumber: storeData.data.waPhoneNumber || "",
//       });
//     }
//   }, [storeData]);

//   const [isEditing, setIsEditing] = useState({
//     whatsapp: false,
//     email: false,
//     website: false,
//   });

//   // Validation state
//   const [errors, setErrors] = useState({
//     whatsappNumber: "",
//   });

//   // Handle channel activation
//   const handleActivateChannel = async (
//     channel: "whatsapp" | "email" | "website"
//   ) => {
//     if (channel === "whatsapp") {
//       setIsEditing({ ...isEditing, whatsapp: true });
//       setFormData({ ...formData, whatsappChannel: true });
//     } else if (channel === "email") {
//       // Activate email channel via API
//       setLoadingStates({ ...loadingStates, email: true });
//       try {
//         await updateStoreChannel({
//           outletId: outlet?.id || "",
//           payload: {
//             whatsappChannel: formData.whatsappChannel,
//             whatsappNumber: formData.whatsappNumber,
//             emailChannel: true,
//             webChannel: storeData?.data?.customSubDomain ? false : true,
//           },
//         }).unwrap();

//         setFormData({ ...formData, emailChannel: true });
//         setSuccessToast({
//           isOpen: true,
//           heading: "Success!",
//           description: "Email channel has been activated successfully!",
//         });

//         getStoreDetails(outlet.id);
//       } catch (error: any) {
//         setErrorToast({
//           isOpen: true,
//           heading: "Activation Failed",
//           description:
//             error?.data?.message ||
//             "Failed to activate email channel. Please try again.",
//         });
//       } finally {
//         setLoadingStates({ ...loadingStates, email: false });
//       }
//     } else if (channel === "website") {
//       // Website channel is already active if customSubDomain exists
//       setFormData({ ...formData, websiteChannel: true });
//     }
//   };

//   // Handle input changes
//   const handleInputChange = (field: string, value: string) => {
//     setFormData((prev) => ({
//       ...prev,
//       [field]: value,
//     }));

//     if (errors[field as keyof typeof errors]) {
//       setErrors((prev) => ({
//         ...prev,
//         [field]: "",
//       }));
//     }
//   };

//   // Validation
//   const validateWhatsAppNumber = () => {
//     if (formData.whatsappChannel && !formData.whatsappNumber.trim()) {
//       setErrors({ whatsappNumber: "WhatsApp number is required" });
//       return false;
//     }
//     if (formData.whatsappChannel && formData.whatsappNumber.trim()) {
//       const whatsappRegex = /^[\+]?[1-9][\d]{0,15}$/;
//       if (!whatsappRegex.test(formData.whatsappNumber.replace(/\s/g, ""))) {
//         setErrors({ whatsappNumber: "Please enter a valid WhatsApp number" });
//         return false;
//       }
//     }
//     return true;
//   };

//   // Handle WhatsApp activation/save
//   const handleSaveWhatsApp = async () => {
//     if (!validateWhatsAppNumber()) {
//       return;
//     }
//     setLoadingStates({ ...loadingStates, whatsapp: true });
//     try {
//       await updateStoreChannel({
//         outletId: outlet?.id || "",
//         payload: {
//           whatsappChannel: true,
//           whatsappNumber: formData.whatsappNumber,
//           emailChannel:
//             formData.emailChannel && storeData?.data?.emailAlias ? true : false,
//           webChannel: storeData?.data?.customSubDomain ? true : false,
//         },
//       }).unwrap();

//       setIsEditing({ ...isEditing, whatsapp: false });
//       setSuccessToast({
//         isOpen: true,
//         heading: "Success!",
//         description: "WhatsApp channel has been activated successfully!",
//       });
//     } catch (error: any) {
//       setErrorToast({
//         isOpen: true,
//         heading: "Activation Failed",
//         description:
//           error?.data?.message ||
//           "Failed to activate WhatsApp channel. Please try again.",
//       });
//     } finally {
//       setLoadingStates({ ...loadingStates, whatsapp: false });
//     }
//   };

//   const handleCopyOnDomain = async () => {
//     try {
//       await navigator.clipboard.writeText(
//         storeData?.data?.customSubDomain || ""
//       );
//       setSuccessToast({
//         isOpen: true,
//         heading: "Copied!",
//         description: "Website link has been copied to your clipboard!",
//       });
//     } catch (error) {
//       console.error("Failed to copy domain:", error);
//       setErrorToast({
//         isOpen: true,
//         heading: "Copy Failed",
//         description: "Unable to copy website link. Please try again.",
//       });
//     }
//   };

//   const handleCopyEmail = async () => {
//     try {
//       await navigator.clipboard.writeText(storeData?.data?.emailAlias || "");
//       setSuccessToast({
//         isOpen: true,
//         heading: "Copied!",
//         description: "Email address has been copied to your clipboard!",
//       });
//     } catch (error) {
//       console.error("Failed to copy email:", error);
//       setErrorToast({
//         isOpen: true,
//         heading: "Copy Failed",
//         description: "Unable to copy email address. Please try again.",
//       });
//     }
//   };

//   return (
//     <div className="p-6">
//       <div className="mb-8">
//         <h2 className="text-3xl font-bold text-gray-900 mb-2">Basic Setup</h2>
//         <p className="text-gray-600 text-lg">
//           Activate the channels you want to receive online orders from
//         </p>
//       </div>

//       <div className="space-y-4">
//         {/* WhatsApp Channel */}
//         <div className="border bg-white border-gray-200 rounded-xl p-6">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-4">
//               <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
//                 <svg
//                   className="w-6 h-6 text-green-600"
//                   fill="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
//                 </svg>
//               </div>
//               <h3 className="text-xl font-semibold text-gray-900">
//                 WhatsApp Channel
//               </h3>
//             </div>
//             {!formData.whatsappChannel ? (
//               <button
//                 onClick={() => handleActivateChannel("whatsapp")}
//                 disabled={loadingStates.whatsapp}
//                 className="px-6 py-2.5 bg-[#15BA5C] text-white rounded-lg hover:bg-[#13A652] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {loadingStates.whatsapp
//                   ? "Activating..."
//                   : "Activate WhatsApp Store Front"}
//               </button>
//             ) : (
//               <span className="px-4 py-2 bg-green-50 text-green-700 rounded-lg font-medium text-sm">
//                 Active
//               </span>
//             )}
//           </div>

//           {formData.whatsappChannel && (
//             <div className="w-full mt-6">
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 WhatsApp Number
//               </label>
//               <div className="flex gap-3">
//                 <input
//                   type="tel"
//                   value={formData.whatsappNumber}
//                   onChange={(e) =>
//                     handleInputChange("whatsappNumber", e.target.value)
//                   }
//                   placeholder="Enter your business WhatsApp no (e.g., +1234567890)"
//                   className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C] ${
//                     errors.whatsappNumber ? "border-red-500" : "border-gray-300"
//                   }`}
//                   disabled={loadingStates.whatsapp || !isEditing.whatsapp}
//                 />
//                 {isEditing.whatsapp && (
//                   <button
//                     onClick={handleSaveWhatsApp}
//                     disabled={loadingStates.whatsapp}
//                     className="px-6 py-3 bg-[#15BA5C] text-white rounded-lg hover:bg-[#13A652] transition-colors font-medium disabled:opacity-50"
//                   >
//                     {loadingStates.whatsapp ? "Saving..." : "Save"}
//                   </button>
//                 )}
//               </div>
//               {errors.whatsappNumber && (
//                 <p className="text-sm text-red-500 mt-2">
//                   {errors.whatsappNumber}
//                 </p>
//               )}
//               <p className="text-sm text-gray-500 mt-2">
//                 Customers will be able to contact you via this WhatsApp Number
//               </p>
//             </div>
//           )}
//         </div>

//         {/* Email Channel */}
//         <div className="border border-gray-200 rounded-xl p-6 bg-white">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-4">
//               <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
//                 <svg
//                   className="w-6 h-6 text-green-600"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
//                   />
//                 </svg>
//               </div>
//               <h3 className="text-xl font-semibold text-gray-900">Email</h3>
//             </div>
//             {!formData.emailChannel ? (
//               <button
//                 onClick={() => handleActivateChannel("email")}
//                 disabled={loadingStates.email}
//                 className="px-6 py-2.5 bg-[#15BA5C] text-white rounded-lg hover:bg-[#13A652] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {loadingStates.email
//                   ? "Activating..."
//                   : "Activate Email Store Front"}
//               </button>
//             ) : (
//               <span className="px-4 py-2 bg-green-50 text-green-700 rounded-lg font-medium text-sm">
//                 Active
//               </span>
//             )}
//           </div>

//           {formData.emailChannel && storeData?.data?.emailAlias && (
//             <div className="mt-6">
//               <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
//                 <span className="text-gray-700">
//                   {storeData.data.emailAlias}
//                 </span>
//                 <button
//                   onClick={handleCopyEmail}
//                   className="text-[#15BA5C] hover:text-[#13A652] transition-colors"
//                 >
//                   <BiCopy className="w-5 h-5" />
//                 </button>
//               </div>
//               <p className="text-sm text-gray-500 mt-2">
//                 Customers can send orders to this email address
//               </p>
//             </div>
//           )}
//         </div>

//         {/* Website Channel */}
//         <div className="border border-gray-200 rounded-xl p-6 bg-white">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-4">
//               <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
//                 <svg
//                   className="w-6 h-6 text-green-600"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
//                   />
//                 </svg>
//               </div>
//               <h3 className="text-xl font-semibold text-gray-900">Website</h3>
//             </div>
//             {storeData?.data?.customSubDomain ? (
//               <span className="px-4 py-2 bg-green-50 text-green-700 rounded-lg font-medium text-sm">
//                 Active
//               </span>
//             ) : (
//               <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium text-sm">
//                 Inactive
//               </span>
//             )}
//           </div>

//           {storeData?.data?.customSubDomain && (
//             <div className="mt-6">
//               <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
//                 <span className="text-gray-700 truncate">
//                   {storeData.data.customSubDomain}
//                 </span>
//                 <button
//                   onClick={handleCopyOnDomain}
//                   className="cursor-pointer text-[#15BA5C] hover:text-[#13A652] transition-colors ml-2"
//                 >
//                   <BiCopy className="w-5 h-5" />
//                 </button>
//               </div>
//               <p className="text-sm text-gray-500 mt-2">
//                 Share this link with your customers to access your online store
//               </p>
//             </div>
//           )}
//         </div>
//       </div>

//       <SuccessToast
//         isOpen={successToast.isOpen}
//         heading={successToast.heading}
//         description={successToast.description}
//         onClose={() => setSuccessToast((prev) => ({ ...prev, isOpen: false }))}
//         duration={5000}
//       />
//       <ErrorToast
//         isOpen={errorToast.isOpen}
//         heading={errorToast.heading}
//         description={errorToast.description}
//         onClose={() => setErrorToast((prev) => ({ ...prev, isOpen: false }))}
//         duration={5000}
//       />
//     </div>
//   );
// }
