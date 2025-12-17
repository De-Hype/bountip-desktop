// import React, { useState, useEffect } from "react";
// import Image from "next/image";
// import { Upload, X, Loader2 } from "lucide-react";
// import { PREDEFINED_COLORS } from "./constants";
// import {
//   useGetStoreDetailsQuery,
//   useUpdateStoreLogoMutation,
// } from "@/redux/store/store-setting";
// import { useUploadImageMutation } from "@/redux/app";
// import { useAppSelector } from "@/hooks/redux-hooks";

// interface CustomizationSectionProps {
//   logo: string | null;
//   coverImage: string | null;
//   selectedColor: string;
//   customColor: string;
//   onLogoUpload: (logoUrl: string) => void;
//   onLogoDelete: () => void;
//   onCoverImageUpload: (coverUrl: string) => void;
//   onCoverImageDelete: () => void;
//   onColorSelect: (color: string) => void;
//   onCustomColorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
//   onContinue: () => void;
// }

// export default function CustomizationSection({
//   logo,
//   coverImage,
//   selectedColor,
//   customColor,
//   onLogoUpload,
//   onLogoDelete,
//   onCoverImageUpload,
//   onCoverImageDelete,
//   onColorSelect,
//   onCustomColorChange,
//   onContinue,
// }: CustomizationSectionProps) {
//   const [updateStoreLogo, { isLoading: isUpdating }] =
//     useUpdateStoreLogoMutation();
//   const [uploadImage, { isLoading: isUploading }] = useUploadImageMutation();
//   const [uploadProgress, setUploadProgress] = useState<{
//     logo: boolean;
//     cover: boolean;
//   }>({ logo: false, cover: false });

//   const [logoUrl, setLogoUrl] = useState<string | null>(null);
//   const [coverUrl, setCoverUrl] = useState<string | null>(null);

//   // Use the prop selectedColor instead of local state
//   const [localColor, setLocalColor] = useState<string>(
//     selectedColor || PREDEFINED_COLORS[0]
//   );

//   // Get existing outlet data from Redux store
//   const outlet = useAppSelector((state) => state.business.outlet);
//   const { data: storeData } = useGetStoreDetailsQuery(outlet?.id || "");

//   // Sync local color with prop
//   useEffect(() => {
//     if (selectedColor) {
//       setLocalColor(selectedColor);
//     }
//   }, [selectedColor]);

//   // Use existing outlet images as fallbacks
//   const currentLogo =
//     logoUrl || logo || storeData?.data?.logoUrl || outlet?.logoUrl || null;
//   const currentCoverImage =
//     coverUrl || coverImage || storeData?.data?.coverUrl || null;

//   // Use the selected color from props, fallback to store data, then predefined color
//   const currentColor =
//     selectedColor || storeData?.data?.colorTheme || PREDEFINED_COLORS[0];

//   const handleImageUpload = async (
//     file: File,
//     type: "logo" | "cover"
//   ): Promise<string> => {
//     try {
//       setUploadProgress((prev) => ({ ...prev, [type]: true }));

//       const formData = new FormData();
//       formData.append("image", file);

//       const response = await uploadImage(formData).unwrap();

//       if (response.data.url) {
//         return response.data.url;
//       } else {
//         throw new Error("No URL returned from upload");
//       }
//     } catch (error) {
//       console.error(`Error uploading ${type}:`, error);
//       throw error;
//     } finally {
//       setUploadProgress((prev) => ({ ...prev, [type]: false }));
//     }
//   };

//   const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     try {
//       const logoUrl = await handleImageUpload(file, "logo");
//       setLogoUrl(logoUrl);
//       onLogoUpload(logoUrl);
//     } catch (error) {
//       console.error("Failed to upload logo:", error);
//     }
//   };

//   const handleCoverImageUpload = async (
//     e: React.ChangeEvent<HTMLInputElement>
//   ) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     try {
//       const coverUrl = await handleImageUpload(file, "cover");
//       setCoverUrl(coverUrl);
//       onCoverImageUpload(coverUrl);
//     } catch (error) {
//       console.error("Failed to upload cover image:", error);
//     }
//   };

//   const handleColorSelect = (color: string) => {
//     setLocalColor(color);
//     onColorSelect(color);
//   };

//   const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const newColor = e.target.value;
//     setLocalColor(newColor);
//     onCustomColorChange(e);
//   };

//   const handleSaveAndContinue = async () => {
//     try {
//       // Prepare the data for the API call
//       const storeData = {
//         payload: {
//           logoUrl: currentLogo,
//           coverUrl: currentCoverImage,
//           colorTheme: currentColor, // Use currentColor which includes the selected color
//         },
//         outletId: outlet?.id,
//       };

//       // Update store customization
//       await updateStoreLogo(storeData).unwrap();

//       // Call the original continue handler
//       onContinue();
//     } catch (error) {
//       console.error("Failed to save customization:", error);
//       // Handle error (you might want to show a toast notification)
//     }
//   };

//   const isUploadingAny =
//     uploadProgress.logo || uploadProgress.cover || isUpdating;

//   return (
//     <div>
//       <h2 className="text-2xl font-bold text-gray-900 mb-8">Customization</h2>

//       {/* Logo Upload */}
//       <div className="mb-8">
//         <div className="flex items-center gap-4">
//           <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden relative">
//             {currentLogo ? (
//               <>
//                 <Image
//                   src={currentLogo}
//                   alt="Logo"
//                   width={80}
//                   height={80}
//                   className="w-full h-full object-cover"
//                 />
//                 {uploadProgress.logo && (
//                   <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
//                     <Loader2 className="w-6 h-6 text-white animate-spin" />
//                   </div>
//                 )}
//               </>
//             ) : (
//               <div className="text-gray-400">
//                 {uploadProgress.logo ? (
//                   <Loader2 className="w-6 h-6 animate-spin" />
//                 ) : (
//                   "Logo"
//                 )}
//               </div>
//             )}
//           </div>
//           <label className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
//             {uploadProgress.logo ? "Uploading..." : "Upload Logo"}
//             <input
//               type="file"
//               accept="image/*"
//               onChange={handleLogoUpload}
//               className="hidden"
//               disabled={uploadProgress.logo}
//             />
//           </label>
//           <button
//             onClick={() => {
//               setLogoUrl(null); // remove from local state
//               onLogoDelete(); // remove from parent state
//             }}
//             disabled={!currentLogo || uploadProgress.logo}
//             className="px-6 py-2.5 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             Delete
//           </button>
//         </div>
//         {outlet?.logoUrl && !logo && (
//           <p className="text-sm text-gray-500 mt-2">
//             Currently using existing outlet logo
//           </p>
//         )}
//       </div>

//       {/* Brand Color Selection */}
//       <div className="mb-8">
//         <h3 className="text-lg font-semibold text-gray-900 mb-4">
//           Select your business's brand colour
//         </h3>
//         <div className="flex items-center gap-4">
//           {PREDEFINED_COLORS.map((color) => (
//             <button
//               key={color}
//               onClick={() => handleColorSelect(color)}
//               disabled={isUploadingAny}
//               className={`w-8 h-8 rounded-full transition-transform ${
//                 currentColor === color
//                   ? "ring-4 ring-offset-2 ring-gray-300 scale-110"
//                   : ""
//               } disabled:opacity-50 disabled:cursor-not-allowed`}
//               style={{ backgroundColor: color }}
//             />
//           ))}
//           <div className="relative">
//             <input
//               type="color"
//               value={localColor}
//               onChange={handleCustomColorChange}
//               disabled={isUploadingAny}
//               className="w-8 h-8 rounded-full cursor-pointer border-2 border-gray-300 bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
//             />
//             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
//               <span className="text-gray-400 text-2xl">+</span>
//             </div>
//           </div>
//         </div>
//         {localColor && (
//           <p className="text-sm text-gray-500 mt-2">
//             Selected color:{" "}
//             <span style={{ color: localColor }}>{localColor}</span>
//           </p>
//         )}
//       </div>

//       {/* Cover Image Upload */}
//       <div className="mb-8">
//         <label className="block border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-[#15BA5C] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
//           {currentCoverImage ? (
//             <div className="relative">
//               <Image
//                 src={currentCoverImage}
//                 alt="Cover"
//                 width={300}
//                 height={400}
//                 className="w-full h-48 object-cover rounded-lg"
//               />
//               {uploadProgress.cover && (
//                 <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
//                   <Loader2 className="w-8 h-8 text-white animate-spin" />
//                 </div>
//               )}
//               <button
//                 onClick={(e) => {
//                   e.preventDefault();
//                   onCoverImageDelete();
//                 }}
//                 disabled={uploadProgress.cover}
//                 className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50"
//               >
//                 <X className="w-4 h-4" />
//               </button>
//             </div>
//           ) : (
//             <div>
//               {uploadProgress.cover ? (
//                 <Loader2 className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-spin" />
//               ) : (
//                 <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
//               )}
//               <p className="text-lg font-semibold text-gray-900 mb-2">
//                 {uploadProgress.cover ? "Uploading..." : "Upload cover image"}
//               </p>
//               <p className="text-sm text-gray-500 mb-1">
//                 Recommended size: up to 10MB
//               </p>
//               <p className="text-sm text-gray-500">
//                 Drag and drop image or{" "}
//                 <span className="text-[#15BA5C]">click here</span> to upload
//               </p>
//             </div>
//           )}
//           <input
//             type="file"
//             accept="image/*"
//             onChange={handleCoverImageUpload}
//             className="hidden"
//             disabled={uploadProgress.cover}
//           />
//         </label>
//       </div>

//       <button
//         onClick={handleSaveAndContinue}
//         disabled={isUploadingAny}
//         className="w-full py-3 bg-[#15BA5C] text-white rounded-lg hover:bg-[#13A652] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//       >
//         {isUpdating ? (
//           <>
//             <Loader2 className="w-4 h-4 animate-spin" />
//             Saving...
//           </>
//         ) : (
//           "Save and Continue"
//         )}
//       </button>
//     </div>
//   );
// }
