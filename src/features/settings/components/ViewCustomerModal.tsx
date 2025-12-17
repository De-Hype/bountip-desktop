// import React from "react";
// import { Modal } from "../ui/Modal";
// import customerIcon from "@/assets/icons/settings/PaymentMethodIcon.svg"; // Add your icon path

// interface Customer {
//   id: string | number;
//   name: string;
//   phoneNumber: string;
//   email: string;
//   address: string;
//   tier: number;
// }

// interface ViewCustomerModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   customer: Customer | null;
//   onEdit: (customer: Customer) => void;
//   onRemove: (customerId: string | number) => void;
// }

// export const ViewCustomerModal: React.FC<ViewCustomerModalProps> = ({
//   isOpen,
//   onClose,
//   customer,
//   onEdit,
//   onRemove,
// }) => {
//   if (!customer) return null;

//   const handleEdit = () => {
//     onEdit(customer);
//     onClose();
//   };

//   const handleRemove = () => {
//     if (window.confirm(`Are you sure you want to remove ${customer.name}?`)) {
//       onRemove(customer.id);
//       onClose();
//     }
//   };

//   return (
//     <Modal
//       image={customerIcon}
//       isOpen={isOpen}
//       onClose={onClose}
//       title="Edit Customer"
//       subtitle=""
//       size="lg"
//     >
//       <div className="space-y-6">
//         {/* Customer Name */}
//         <div>
//           <label className="block text-base font-normal text-gray-900 mb-2">
//             Customer Name
//           </label>
//           <div className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
//             {customer.name}
//           </div>
//         </div>

//         {/* Customer Number */}
//         <div>
//           <label className="block text-base font-normal text-gray-900 mb-2">
//             Customer Number
//           </label>
//           <div className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg">
//             <span className="inline-flex items-center gap-2 px-3 py-1 bg-gray-200 rounded-full text-gray-900">
//               {customer.phoneNumber}
//               <button className="text-gray-500 hover:text-gray-700">
//                 <svg
//                   className="w-4 h-4"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M6 18L18 6M6 6l12 12"
//                   />
//                 </svg>
//               </button>
//             </span>
//           </div>
//         </div>

//         {/* Home Address */}
//         <div>
//           <label className="block text-base font-normal text-gray-900 mb-2">
//             Home Address
//           </label>
//           <div className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
//             {customer.address}
//           </div>
//         </div>

//         {/* Email Address */}
//         <div>
//           <label className="block text-base font-normal text-gray-900 mb-2">
//             Email Address
//           </label>
//           <div className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
//             {customer.email}
//           </div>
//         </div>

//         {/* Special Preferences/Requests */}
//         <div>
//           <label className="block text-base font-normal text-gray-900 mb-2">
//             Special Preferences/Requests
//           </label>
//           <div className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
//             Loves fast delivery
//           </div>
//         </div>

//         {/* Tier */}
//         <div>
//           <label className="block text-base font-normal text-gray-900 mb-2">
//             Tier
//           </label>
//           <div className="relative">
//             <div className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 appearance-none flex items-center justify-between">
//               <span>{customer.tier}</span>
//               <svg
//                 className="w-5 h-5 text-gray-400"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M19 9l-7 7-7-7"
//                 />
//               </svg>
//             </div>
//           </div>
//         </div>

//         {/* Action Buttons */}
//         <div className="flex gap-4 pt-4">
//           <button
//             onClick={handleRemove}
//             className="flex-1 px-6 py-3 bg-[#E53E3E] text-white rounded-lg hover:bg-[#C53030] transition-colors font-medium"
//           >
//             Remove Customer
//           </button>
//           <button
//             onClick={handleEdit}
//             className="flex-1 px-6 py-3 bg-[#15BA5C] text-white rounded-lg hover:bg-[#13A652] transition-colors font-medium"
//           >
//             Update Customer
//           </button>
//         </div>
//       </div>
//     </Modal>
//   );
// };
