// import React, { useState } from "react";
// import { SECTIONS } from "./constants";
// import ShareStoreLink from "./StoreFrontLink";
// import { Share2 } from "lucide-react";
// import { BsArrowLeftShort } from "react-icons/bs";
// import { useRouter } from "next/navigation";
// import { useAppSelector } from "@/hooks/redux-hooks";

// interface SidebarProps {
//   activeSection: string;
//   onSectionClick: (sectionId: string, step: number) => void;
//   isStorefrontActive?: boolean;
// }

// export default function Sidebar({
//   activeSection,
//   onSectionClick,
//   isStorefrontActive,
// }: SidebarProps) {
//   const outlet = useAppSelector((state) => state.business.outlet);
//   const isStorefrontActivated =
//     typeof isStorefrontActive === "boolean"
//       ? isStorefrontActive
//       : Boolean(outlet?.storeCode);
//   const [isShareModalOpen, setIsShareModalOpen] = useState(false);
//   const router = useRouter();

//   return (
//     <div className="w-64 shrink-0">
//       <div className="bg-white flex flex-col rounded-2xl h-full shadow-sm border border-gray-100 p-4">
//         <div className="mb-6">
//           <button
//             className="flex items-center gap-[11px] hover:bg-gray-100 px-2  cursor-pointer"
//             type="button"
//             onClick={() => router.push("/dashboard/settings")}
//           >
//             <BsArrowLeftShort />
//             <span className="text-base">Back to Settings</span>
//           </button>
//         </div>
//         <div className="flex flex-col">
//           {/* {SECTIONS.map((section) => {
//             const isActive = activeSection === section.id;

//             return (
//               <button
//                 key={section.id}
//                 onClick={() => onSectionClick(section.id, section.step)}
//                 className={`group  cursor-pointer flex items-center w-full gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
//                   isActive
//                     ? "bg-[#15BA5C1A] border border-[#15BA5C]"
//                     : "bg-gray-50 hover:bg-gray-100 border border-transparent"
//                 }`}
//               >
//                 <div
//                   className={`w-3 h-3 rounded-full transition-all ${
//                     isActive ? "bg-[#15BA5C]" : "bg-[#C7C7C7]"
//                   }`}
//                 />
//                 <span className={`font-normal text-base text-[#1E1E1E]`}>
//                   {section.name}
//                 </span>
//               </button>
//             );
//           })} */}
//           {SECTIONS.map((section) => {
//             const isActive = activeSection === section.id;
//             const isDisabled = !isStorefrontActivated;

//             return (
//               <button
//                 key={section.id}
//                 onClick={() =>
//                   !isDisabled && onSectionClick(section.id, section.step)
//                 }
//                 disabled={isDisabled}
//                 className={`group flex items-center w-full gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left
//         ${
//           isActive
//             ? "bg-[#15BA5C1A] border border-[#15BA5C]"
//             : "bg-gray-50 border border-transparent"
//         }
//         ${
//           isDisabled
//             ? "opacity-50 cursor-not-allowed"
//             : "hover:bg-gray-100 cursor-pointer"
//         }
//       `}
//               >
//                 <div
//                   className={`w-3 h-3 rounded-full transition-all ${
//                     isActive ? "bg-[#15BA5C]" : "bg-[#C7C7C7]"
//                   }`}
//                 />
//                 <span
//                   className={`font-normal text-base ${
//                     isDisabled ? "text-gray-400" : "text-[#1E1E1E]"
//                   }`}
//                 >
//                   {section.name}
//                 </span>
//               </button>
//             );
//           })}
//         </div>

//         <div className="mt-auto">
//           <button
//             onClick={() => setIsShareModalOpen(true)}
//             disabled={!isStorefrontActivated}
//             className={`cursor-pointer mt-6 w-full py-3 rounded-lg font-medium transition-colors duration-200 ${
//               isStorefrontActivated
//                 ? "border border-[#15BA5C] text-[#15BA5C] hover:bg-[#13a14f] hover:text-white"
//                 : "bg-gray-300 text-gray-500 cursor-not-allowed"
//             }`}
//           >
//             <div className="flex items-center justify-center gap-2">
//               <Share2 />
//               <span>Share Storefront</span>
//             </div>
//           </button>
//         </div>
//       </div>

//       <ShareStoreLink
//         isOpen={isShareModalOpen}
//         onClose={() => setIsShareModalOpen(false)}
//       />
//     </div>
//   );
// }
