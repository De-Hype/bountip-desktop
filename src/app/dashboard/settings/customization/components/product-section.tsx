// import React, { useState, useEffect } from "react";
// import Image from "next/image";
// import { Plus, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

// import { useRouter } from "next/navigation";
// import {
//   useGetProductsQuery,
//   useMakeProductAvailableMutation,
// } from "@/redux/products";
// import { useAppSelector } from "@/hooks/redux-hooks";
// import { Product } from "@/redux/products/types";
// import { getCurrencySymbolByCountry } from "@/utils/getCurrencySymbol";

// interface ProductsSectionProps {
//   onAddProduct: () => void;
//   onEditProduct: (product: Product) => void;
//   onDeleteProduct: (productId: string) => void;
//   onBack: () => void;
//   onComplete: () => void;
// }

// const availabilityStatus = (isAvailable: boolean | null) => {
//   if (isAvailable === true)
//     return (
//       <p className="bg-[#15BA5C0D] border border-[#15BA5C80] px-[10px] rounded-[100px]">
//         <span className="text-[#15BA5C] text-[.875rem] font-medium">
//           Available
//         </span>
//       </p>
//     );
//   if (isAvailable === false)
//     return (
//       <p className="bg-[#FF3B30_0D] border border-[#FF3B3080] px-[10px] rounded-[100px]">
//         <span className="text-[#FF3B30] text-[.875rem] font-medium">
//           Unavailable
//         </span>
//       </p>
//     );
// };

// export default function ProductsSection({
//   onAddProduct,
//   onEditProduct,
//   onDeleteProduct,
//   onBack,
//   onComplete,
// }: ProductsSectionProps) {
//   const [makeProductAvailable, { isLoading: makingAvailable }] =
//     useMakeProductAvailableMutation();

//   const outlet = useAppSelector((state) => state.business.outlet);
//   const [limit] = useState(10);
//   const [page, setPage] = useState(1);
//   const [makeAllAvailable, setMakeAllAvailable] = useState(true);
//   const [makeAllUnavailable, setMakeAllUnavailable] = useState(false);
//   const [loadingProductId, setLoadingProductId] = useState<string | null>(null);

//   const router = useRouter();

//   const {
//     data: productData,
//     refetch: refetchProducts,
//     isLoading,
//   } = useGetProductsQuery({
//     outletId: outlet?.id || "",
//     params: {
//       limit,
//       page,
//     },
//   });

//   // Refetch products when page changes
//   useEffect(() => {
//     refetchProducts();
//   }, [page, refetchProducts]);

//   const handleToggleAvailability = async (product: Product) => {
//     try {
//       setLoadingProductId(product.id);

//       await makeProductAvailable({
//         productId: product.id,
//         outletId: outlet.id,
//         availableAtStorefront: !product.availableAtStorefront,
//       }).unwrap();

//       refetchProducts();
//     } catch (error) {
//       console.error("Failed to toggle product availability:", error);
//     } finally {
//       setLoadingProductId(null);
//     }
//   };

//   // const handleToggleAvailability = async (product: Product) => {
//   //   try {
//   //     if (product.availableAtStorefront) {
//   //       await makeProductAvailable({
//   //         productId: product.id,
//   //         outletId: outlet.id,
//   //         availableAtStorefront: false,
//   //       }).unwrap();
//   //     } else {
//   //       await makeProductAvailable({
//   //         productId: product.id,
//   //         outletId: outlet.id,
//   //         availableAtStorefront: true,
//   //       }).unwrap();
//   //     }
//   //     // Refetch products to get updated data
//   //     refetchProducts();
//   //   } catch (error) {
//   //     console.error("Failed to toggle product availability:", error);
//   //     // You might want to add toast notification here
//   //   }
//   // };

//   const handleMakeAllAvailable = () => {
//     setMakeAllAvailable(true);
//     setMakeAllUnavailable(false);
//     onToggle("available");
//   };

//   const handleMakeAllUnavailable = () => {
//     setMakeAllAvailable(false);
//     setMakeAllUnavailable(true);
//     onToggle("unavailable");
//   };

//   const onToggle = (status) => {
//     console.log("API call with status:", status);
//     // Make your API call here
//     // fetch('/api/endpoint', { method: 'POST', body: JSON.stringify({ status }) })
//   };

//   const handlePageChange = (newPage: number) => {
//     setPage(newPage);
//   };

//   const totalProducts = productData?.data?.meta?.total || 0;
//   const totalPages = Math.ceil(totalProducts / limit);
//   const currentPage = productData?.data?.meta?.page || 1;

//   const products = productData?.data?.data || [];

//   const totalAvailableCount = products.filter(
//     (p: Product) => p.availableAtStorefront === true
//   ).length;

//   const totalUnavailableCount = products.filter(
//     (p: Product) => p.availableAtStorefront === false
//   ).length;

//   return (
//     <div>
//       <div className="flex justify-between items-center mb-8 ">
//         <div className=" w-full">
//           <h2 className="text-2xl font-bold text-gray-900">
//             Product Management
//           </h2>
//           <div className="mt-[5px] flex items-center justify-between w-full ">
//             <p className="text-[#737373] text-[.875rem]">
//               Manage your products in one place
//             </p>
//             <div className="flex items-center gap-[20px]">
//               <button
//                 onClick={handleMakeAllAvailable}
//                 className="flex items-center gap-1.5"
//               >
//                 <div
//                   className={`w-4 h-4 rounded flex items-center justify-center ${
//                     makeAllAvailable
//                       ? "bg-green-500"
//                       : "bg-white border-2 border-gray-300"
//                   }`}
//                 >
//                   {makeAllAvailable && (
//                     <svg
//                       className="w-3 h-3 text-white"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth={3}
//                         d="M5 13l4 4L19 7"
//                       />
//                     </svg>
//                   )}
//                 </div>
//                 <span className="text-[1rem] font-normal">
//                   Make all available
//                 </span>
//               </button>

//               <button
//                 onClick={handleMakeAllUnavailable}
//                 className="flex items-center gap-1.5"
//               >
//                 <div
//                   className={`w-4 h-4 rounded flex items-center justify-center ${
//                     makeAllUnavailable
//                       ? "bg-green-500"
//                       : "bg-white border-2 border-gray-300"
//                   }`}
//                 >
//                   {makeAllUnavailable && (
//                     <svg
//                       className="w-3 h-3 text-white"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth={3}
//                         d="M5 13l4 4L19 7"
//                       />
//                     </svg>
//                   )}
//                 </div>
//                 <span className="text-[1rem] font-normal">
//                   Make all unavailable
//                 </span>
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       <section className="">
//         <div className="flex gap-6">
//           <div className="bg-white rounded-lg shadow-sm px-6 py-3 border-l-4 border-[#34D05E] flex-1">
//             <div className="text-gray-500 text-sm mb-2">Total Available</div>
//             <div className="text-4xl font-bold text-gray-900">
//               {totalAvailableCount}
//             </div>
//           </div>

//           <div className="bg-white rounded-lg shadow-sm px-6 py-3 border-l-4 border-[#34D05E] flex-1">
//             <div className="text-gray-500 text-sm mb-2">Total Unavailable</div>
//             <div className="text-4xl font-bold text-gray-900">
//               {totalUnavailableCount}
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Products List */}
//       <div className="space-y-4 flex flex-col gap-4 mt-[30px]">
//         {isLoading ? (
//           <div className="text-center py-8">
//             <p className="text-gray-500">Loading products...</p>
//           </div>
//         ) : (
//           productData?.data?.data?.map((product) => (
//             <div
//               key={product.id}
//               className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
//             >
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-4">
//                   <div className="w-[71px] h-[71px] bg-gray-100 rounded-lg flex items-center justify-center relative">
//                     {product.logoUrl ? (
//                       <Image
//                         src={product.logoUrl}
//                         alt={product.name}
//                         fill
//                         className="rounded-lg object-cover"
//                       />
//                     ) : (
//                       <div className="text-gray-400 text-xs text-center">
//                         No Image
//                       </div>
//                     )}
//                   </div>
//                   <div className="flex flex-col gap-[8px]">
//                     <h3 className="font-semibold text-gray-900">
//                       {product.name}
//                     </h3>
//                     <p className="flex items-center gap-1 text-sm text-gray-500">
//                       {availabilityStatus(product.availableAtStorefront)} •
//                       {product.category} •{" "}
//                       {getCurrencySymbolByCountry(outlet?.country as string)}
//                       {Number(product.price).toLocaleString("en-US", {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-3">
//                   <button
//                     onClick={() => handleToggleAvailability(product)}
//                     disabled={loadingProductId === product.id}
//                     className={`w-[180px] px-3 py-1 rounded text-[1rem] ${
//                       product.availableAtStorefront
//                         ? "bg-[#E33629] text-[#FFFFFF] border border-[#E33629] hover:bg-[#fff] hover:text-[#E33629]"
//                         : "bg-[#15BA5C] text-[#FFFFFF] border border-[#15BA5C] hover:bg-[#fff] hover:text-[#15BA5C]"
//                     } disabled:opacity-50 disabled:cursor-not-allowed rounded-[12px] cursor-pointer`}
//                   >
//                     {loadingProductId === product.id
//                       ? "Updating..."
//                       : product.availableAtStorefront
//                       ? "Make Unavailable"
//                       : "Make Available"}
//                   </button>
//                 </div>
//               </div>
//               {product.description && (
//                 <p className="text-sm text-gray-600 mt-2">
//                   {product.description}
//                 </p>
//               )}
//             </div>
//           ))
//         )}
//       </div>

//       {!isLoading && productData?.data?.meta?.total === 0 && (
//         <div className="text-center py-12">
//           <p className="text-gray-500 mb-4">No products added yet.</p>
//         </div>
//       )}

//       {/* Pagination */}
//       {totalPages > 1 && (
//         <div className="flex justify-center items-center gap-4 mt-8">
//           <button
//             onClick={() => handlePageChange(currentPage - 1)}
//             disabled={currentPage <= 1}
//             className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
//           >
//             <ChevronLeft className="w-5 h-5" />
//           </button>

//           <div className="flex items-center gap-2">
//             <span className="text-sm text-gray-700">
//               Page {currentPage} of {totalPages}
//             </span>
//             <span className="text-sm text-gray-500">
//               ({totalProducts} total products)
//             </span>
//           </div>

//           <button
//             onClick={() => handlePageChange(currentPage + 1)}
//             disabled={currentPage >= totalPages}
//             className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
//           >
//             <ChevronRight className="w-5 h-5" />
//           </button>
//         </div>
//       )}

//       <div className="flex gap-4 mt-8"></div>
//     </div>
//   );
// }
