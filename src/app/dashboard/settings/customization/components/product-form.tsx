// import React, { useState } from "react";
// import { Product } from "./types";

// interface ProductFormProps {
//   product?: Product | null;
//   onSave: (data: Omit<Product, "id">) => void;
//   onCancel: () => void;
// }

// export default function ProductForm({
//   product,
//   onSave,
//   onCancel,
// }: ProductFormProps) {
//   const [formData, setFormData] = useState({
//     name: product?.name || "",
//     price: product?.price || 0,
//     description: product?.description || "",
//     category: product?.category || "",
//     stock: product?.stock || 0,
//     isAvailable: product?.isAvailable || true,
//   });

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     onSave(formData);
//   };

//   return (
//     <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
//       <div className="bg-white rounded-lg p-6 w-full max-w-md">
//         <h3 className="text-lg font-semibold mb-4">
//           {product ? "Edit Product" : "Add New Product"}
//         </h3>
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Product Name
//             </label>
//             <input
//               type="text"
//               required
//               value={formData.name}
//               onChange={(e) =>
//                 setFormData({ ...formData, name: e.target.value })
//               }
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C]"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Price
//             </label>
//             <input
//               type="number"
//               required
//               step="0.01"
//               value={formData.price}
//               onChange={(e) =>
//                 setFormData({
//                   ...formData,
//                   price: parseFloat(e.target.value),
//                 })
//               }
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C]"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Description
//             </label>
//             <textarea
//               value={formData.description}
//               onChange={(e) =>
//                 setFormData({ ...formData, description: e.target.value })
//               }
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C]"
//               rows={3}
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Category
//             </label>
//             <input
//               type="text"
//               value={formData.category}
//               onChange={(e) =>
//                 setFormData({ ...formData, category: e.target.value })
//               }
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C]"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Stock
//             </label>
//             <input
//               type="number"
//               value={formData.stock}
//               onChange={(e) =>
//                 setFormData({ ...formData, stock: parseInt(e.target.value) })
//               }
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C]"
//             />
//           </div>
//           <div className="flex items-center gap-2">
//             <label className="flex items-center gap-2 cursor-pointer">
//               <input
//                 type="checkbox"
//                 checked={formData.isAvailable}
//                 onChange={(e) =>
//                   setFormData({ ...formData, isAvailable: e.target.checked })
//                 }
//                 className="peer sr-only"
//               />
//               <div className="w-4 h-4 border-2 border-gray-300 rounded flex items-center justify-center peer-checked:bg-[#15BA5C] peer-checked:border-[#15BA5C]">
//                 <svg
//                   className="w-3 h-3 text-white hidden peer-checked:block"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth="3"
//                     d="M5 13l4 4L19 7"
//                   />
//                 </svg>
//               </div>
//               <span className="text-sm font-medium text-gray-700">
//                 Available for sale
//               </span>
//             </label>
//           </div>
//           <div className="flex gap-3 justify-end">
//             <button
//               type="button"
//               onClick={onCancel}
//               className="px-4 py-2 text-gray-600 hover:text-gray-800"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="px-4 py-2 bg-[#15BA5C] text-white rounded-lg hover:bg-[#13A652]"
//             >
//               Save Product
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }
