// // import React, { useState } from "react";
// // import { X, Copy, Check } from "lucide-react";
// // import { Modal } from "@/app/features/components/AppModal";

// // interface CreateProductProps {
// //   isOpen: boolean;
// //   onClose: () => void;
// // }

// // export default function ShareStoreLink({
// //   isOpen,
// //   onClose,
// // }: CreateProductProps) {
// //   const [copied, setCopied] = useState(false);
// //   const storeLink = "https://bountip.restaurant/Bob...";

// //   const handleCopyLink = () => {
// //     navigator.clipboard.writeText(storeLink);
// //     setCopied(true);
// //     setTimeout(() => setCopied(false), 2000);
// //   };

// //   return (
// // <Modal
// //   subtitle=""
// //   isOpen={isOpen}
// //   onClose={onClose}
// //   size="sm"
// //   title="hare Store Link"
// // >
// //       <div className="">
// //         <div className="w-full">
// //           {/* Header */}
// //           {/* <div className="relative bg-white px-6 py-5 border-b border-gray-100">
// //             <h1 className="text-2xl font-bold text-gray-900 text-center">
// //               Share Store Link
// //             </h1>
// //             <button className="absolute right-4 top-4 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
// //               <X className="w-5 h-5 text-white" />
// //             </button>
// //           </div> */}

// //           {/* Content */}
// //           <div className="p-6">
// //             {/* Green Card */}
// //             <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 shadow-lg">
// //               {/* Icon and Text */}
// //               <div className="flex items-start gap-4 mb-5">
// //                 <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
// //                   <span className="text-2xl">🍪</span>
// //                 </div>
// //                 <div className="flex-1">
// //                   <h2 className="text-white text-xl font-bold mb-1">
// //                     Hey, check out my new Business!
// //                   </h2>
// //                   <p className="text-emerald-50 text-sm">
// //                     Tap to copy link and share
// //                   </p>
// //                 </div>
// //               </div>

// //               {/* Link Box */}
// //               <button
// //                 onClick={handleCopyLink}
// //                 className="w-full bg-white rounded-xl px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors group"
// //               >
// //                 <span className="text-gray-700 text-sm font-medium truncate pr-3">
// //                   {storeLink}
// //                 </span>
// //                 {copied ? (
// //                   <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
// //                 ) : (
// //                   <Copy className="w-5 h-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
// //                 )}
// //               </button>
// //             </div>

// //             {/* Share Options */}
// //             <div className="mt-8 flex items-center justify-center gap-12">
// //               {/* WhatsApp */}
// //               <button className="flex flex-col items-center gap-3 hover:opacity-80 transition-opacity">
// //                 <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
// //                   <svg
// //                     className="w-9 h-9 text-white"
// //                     viewBox="0 0 24 24"
// //                     fill="currentColor"
// //                   >
// //                     <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
// //                   </svg>
// //                 </div>
// //                 <span className="text-gray-900 text-sm font-medium">
// //                   WhatsApp
// //                 </span>
// //               </button>

// //               {/* Email */}
// //               <button className="flex flex-col items-center gap-3 hover:opacity-80 transition-opacity">
// //                 <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
// //                   <svg
// //                     className="w-9 h-9 text-white"
// //                     viewBox="0 0 24 24"
// //                     fill="currentColor"
// //                   >
// //                     <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
// //                   </svg>
// //                 </div>
// //                 <span className="text-gray-900 text-sm font-medium">Email</span>
// //               </button>

// //               {/* Web */}
// //               <button className="flex flex-col items-center gap-3 hover:opacity-80 transition-opacity">
// //                 <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
// //                   <svg
// //                     className="w-9 h-9 text-white"
// //                     viewBox="0 0 24 24"
// //                     fill="none"
// //                     stroke="currentColor"
// //                     strokeWidth="2"
// //                   >
// //                     <circle cx="12" cy="12" r="10" />
// //                     <line x1="2" y1="12" x2="22" y2="12" />
// //                     <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
// //                   </svg>
// //                 </div>
// //                 <span className="text-gray-900 text-sm font-medium">Web</span>
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       </div>
// //     </Modal>
// //   );
// // }

// import React, { useState } from "react";
// import { X, Copy, Check } from "lucide-react";
// import { Modal } from "@/app/features/components/AppModal";

// interface CreateProductProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// export default function ShareStoreLink({
//   isOpen,
//   onClose,
// }: CreateProductProps) {
//   const [copied, setCopied] = useState(false);
//   const storeLink = "https://bountip.restaurant/Bob...";
//   const shareMessage = "Hey, check out my new Business!";

//   const handleCopyLink = () => {
//     navigator.clipboard.writeText(storeLink);
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   const handleWhatsAppShare = () => {
//     const text = encodeURIComponent(`${shareMessage}\n${storeLink}`);
//     const url = `https://wa.me/?text=${text}`;
//     window.open(url, "_blank");
//   };

//   const handleEmailShare = () => {
//     const subject = encodeURIComponent("Check out my new Business!");
//     const body = encodeURIComponent(`${shareMessage}\n\n${storeLink}`);
//     const url = `mailto:?subject=${subject}&body=${body}`;
//     window.location.href = url;
//   };

//   const handleWebShare = async () => {
//     // Check if Web Share API is available (works on mobile devices)
//     if (navigator.share) {
//       try {
//         await navigator.share({
//           title: "Check out my new Business!",
//           text: shareMessage,
//           url: storeLink,
//         });
//       } catch (error) {
//         // User cancelled or error occurred
//         console.log("Share cancelled or failed:", error);
//       }
//     } else {
//       // Fallback: copy to clipboard
//       handleCopyLink();
//       alert("Link copied! Web Share API is not supported on this device.");
//     }
//   };

//   if (!isOpen) return null;

//   const customHeader = (
//     <div className="relative bg-white px-6 py-5 border-b border-gray-100 rounded-t-2xl">
//       <h1 className="text-2xl font-bold text-gray-900 text-center">
//         Share Store Link
//       </h1>
//       <button
//         onClick={onClose}
//         className="absolute right-4 top-4 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
//       >
//         <X className="w-5 h-5 text-white" />
//       </button>
//     </div>
//   );

//   return (
//     <Modal
//       subtitle=""
//       customHeader={customHeader}
//       isOpen={isOpen}
//       onClose={onClose}
//       size="sm"
//     >
//       <div className="">
//         <div className="bg-white">
//           {/* Content */}
//           <div className="p-6">
//             {/* Green Card */}
//             <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 shadow-lg">
//               {/* Icon and Text */}
//               <div className="flex items-start gap-4 mb-5">
//                 <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
//                   <span className="text-2xl">🍪</span>
//                 </div>
//                 <div className="flex-1">
//                   <h2 className="text-white text-xl font-bold mb-1">
//                     Hey, check out my new Business!
//                   </h2>
//                   <p className="text-emerald-50 text-sm">
//                     Tap to copy link and share
//                   </p>
//                 </div>
//               </div>

//               {/* Link Box */}
//               <button
//                 onClick={handleCopyLink}
//                 className="w-full bg-white rounded-xl px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors group"
//               >
//                 <span className="text-gray-700 text-sm font-medium truncate pr-3">
//                   {storeLink}
//                 </span>
//                 {copied ? (
//                   <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
//                 ) : (
//                   <Copy className="w-5 h-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
//                 )}
//               </button>
//             </div>

//             {/* Share Options */}
//             <div className="mt-8 flex items-center justify-center gap-12">
//               {/* WhatsApp */}
//               <button
//                 onClick={handleWhatsAppShare}
//                 className="flex flex-col items-center gap-3 hover:opacity-80 transition-opacity"
//               >
//                 <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
//                   <svg
//                     className="w-9 h-9 text-white"
//                     viewBox="0 0 24 24"
//                     fill="currentColor"
//                   >
//                     <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
//                   </svg>
//                 </div>
//                 <span className="text-gray-900 text-sm font-medium">
//                   WhatsApp
//                 </span>
//               </button>

//               {/* Email */}
//               <button
//                 onClick={handleEmailShare}
//                 className="flex flex-col items-center gap-3 hover:opacity-80 transition-opacity"
//               >
//                 <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
//                   <svg
//                     className="w-9 h-9 text-white"
//                     viewBox="0 0 24 24"
//                     fill="currentColor"
//                   >
//                     <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
//                   </svg>
//                 </div>
//                 <span className="text-gray-900 text-sm font-medium">Email</span>
//               </button>

//               {/* Web */}
//               <button
//                 onClick={handleWebShare}
//                 className="flex flex-col items-center gap-3 hover:opacity-80 transition-opacity"
//               >
//                 <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
//                   <svg
//                     className="w-9 h-9 text-white"
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="2"
//                   >
//                     <circle cx="12" cy="12" r="10" />
//                     <line x1="2" y1="12" x2="22" y2="12" />
//                     <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
//                   </svg>
//                 </div>
//                 <span className="text-gray-900 text-sm font-medium">Web</span>
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </Modal>
//   );
// }
