// // "use client";
// // import React, { useState } from "react";
// // import { Modal } from "../ui/Modal";
// // // import Image from "next/image";
// // import { StaticImageData } from "next/image";
// // import { Plus } from "lucide-react"; // Icon for adding customer

// // interface AddCustomerModalProps {
// //   isOpen: boolean;
// //   onClose: () => void;
// //   onAddCustomer: (customer: {
// //     id: number;
// //     name: string;
// //     phoneNumber: string;
// //     email: string;
// //     address: string;
// //     tier: number;
// //   }) => void;
// // }

// // export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
// //   isOpen,
// //   onClose,
// //   onAddCustomer,
// // }) => {
// //   const [newCustomer, setNewCustomer] = useState({
// //     id: Date.now(), // Temporary unique ID
// //     name: "",
// //     phoneNumber: "",
// //     email: "",
// //     address: "",
// //     tier: 1,
// //   });

// //   const handleSubmit = (e: React.FormEvent) => {
// //     e.preventDefault();
// //     onAddCustomer(newCustomer);
// //     onClose();
// //     setNewCustomer({ id: Date.now(), name: "", phoneNumber: "", email: "", address: "", tier: 1 });
// //   };

// //   return (
// //     <Modal
// //       image={Plus as unknown as StaticImageData} // Using Plus icon as placeholder
// //       isOpen={isOpen}
// //       onClose={onClose}
// //       title="Add New Customer"
// //       subtitle="Fill in the details to add a new customer"
// //       size="md"
// //     >
// //       <form onSubmit={handleSubmit} className="space-y-4">
// //         <div>
// //           <label className="block text-sm text-gray-600">Name</label>
// //           <input
// //             type="text"
// //             value={newCustomer.name}
// //             onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
// //             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C]"
// //             required
// //           />
// //         </div>
// //         <div>
// //           <label className="block text-sm text-gray-600">Phone Number</label>
// //           <input
// //             type="tel"
// //             value={newCustomer.phoneNumber}
// //             onChange={(e) => setNewCustomer({ ...newCustomer, phoneNumber: e.target.value })}
// //             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C]"
// //             required
// //           />
// //         </div>
// //         <div>
// //           <label className="block text-sm text-gray-600">Email</label>
// //           <input
// //             type="email"
// //             value={newCustomer.email}
// //             onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
// //             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C]"
// //             required
// //           />
// //         </div>
// //         <div>
// //           <label className="block text-sm text-gray-600">Address</label>
// //           <input
// //             type="text"
// //             value={newCustomer.address}
// //             onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
// //             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C]"
// //             required
// //           />
// //         </div>
// //         <div>
// //           <label className="block text-sm text-gray-600">Tier</label>
// //           <select
// //             value={newCustomer.tier}
// //             onChange={(e) => setNewCustomer({ ...newCustomer, tier: parseInt(e.target.value) })}
// //             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C]"
// //           >
// //             <option value={1}>Tier 1</option>
// //             <option value={2}>Tier 2</option>
// //             <option value={3}>Tier 3</option>
// //           </select>
// //         </div>
// //         <div className="flex gap-2">
// //           <button
// //             type="submit"
// //             className="w-full px-4 py-2 bg-[#15BA5C] text-white rounded-lg hover:bg-[#13A652] transition-colors"
// //           >
// //             Add Customer
// //           </button>
// //           <button
// //             type="button"
// //             onClick={onClose}
// //             className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
// //           >
// //             Cancel
// //           </button>
// //         </div>
// //       </form>
// //     </Modal>
// //   );
// // };



// import React, { useState, useEffect } from "react";
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

// interface CreateCustomerModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSubmit: (customer: Omit<Customer, "id">) => void;
//   editingCustomer?: Customer | null;
// }

// export const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({
//   isOpen,
//   onClose,
//   onSubmit,
//   editingCustomer,
// }) => {
//   const [formData, setFormData] = useState({
//     name: "",
//     phoneNumber: "",
//     email: "",
//     address: "",
//     specialPreferences: "",
//     tier: "",
//   });

//   useEffect(() => {
//     if (editingCustomer) {
//       setFormData({
//         name: editingCustomer.name,
//         phoneNumber: editingCustomer.phoneNumber,
//         email: editingCustomer.email,
//         address: editingCustomer.address,
//         specialPreferences: "Loves fast delivery", // You may want to add this to your Customer interface
//         tier: editingCustomer.tier.toString(),
//       });
//     } else {
//       setFormData({
//         name: "",
//         phoneNumber: "",
//         email: "",
//         address: "",
//         specialPreferences: "",
//         tier: "",
//       });
//     }
//   }, [editingCustomer, isOpen]);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = () => {
//     if (!formData.name || !formData.phoneNumber || !formData.email || !formData.address || !formData.tier) {
//       alert("Please fill in all required fields");
//       return;
//     }

//     onSubmit({
//       name: formData.name,
//       phoneNumber: formData.phoneNumber,
//       email: formData.email,
//       address: formData.address,
//       tier: parseInt(formData.tier),
//     });

//     // Reset form
//     setFormData({
//       name: "",
//       phoneNumber: "",
//       email: "",
//       address: "",
//       specialPreferences: "",
//       tier: "",
//     });
//   };

//   const handleCancel = () => {
//     setFormData({
//       name: "",
//       phoneNumber: "",
//       email: "",
//       address: "",
//       specialPreferences: "",
//       tier: "",
//     });
//     onClose();
//   };

//   return (
//     <Modal
//       image={customerIcon}
//       isOpen={isOpen}
//       onClose={onClose}
//       title="Create Customer"
//       subtitle="A simple and efficient way to create new customer profiles. By filling out the form below, you can seamlessly capture essential details, ensuring a personalized and memorable dining experience for your customers."
//       size="lg"
//     >
//       <div className="space-y-6">
//         {/* Customer Name */}
//         <div>
//           <label className="block text-base font-normal text-gray-900 mb-2">
//             Customer Name
//           </label>
//           <input
//             type="text"
//             name="name"
//             value={formData.name}
//             onChange={handleChange}
//             placeholder="Enter customer name"
//             className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C] focus:border-transparent"
//           />
//         </div>

//         {/* Customer Number */}
//         <div>
//           <label className="block text-base font-normal text-gray-900 mb-2">
//             Customer Number
//           </label>
//           <div className="relative">
//             <input
//               type="tel"
//               name="phoneNumber"
//               value={formData.phoneNumber}
//               onChange={handleChange}
//               placeholder="Enter phone number"
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C] focus:border-transparent"
//             />
//             {formData.phoneNumber && (
//               <button
//                 onClick={() => setFormData(prev => ({ ...prev, phoneNumber: "" }))}
//                 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
//               >
//                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                 </svg>
//               </button>
//             )}
//           </div>
//         </div>

//         {/* Address */}
//         <div>
//           <label className="block text-base font-normal text-gray-900 mb-2">
//             Address
//           </label>
//           <input
//             type="text"
//             name="address"
//             value={formData.address}
//             onChange={handleChange}
//             placeholder="Enter customer address"
//             className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C] focus:border-transparent"
//           />
//         </div>

//         {/* Email Address */}
//         <div>
//           <label className="block text-base font-normal text-gray-900 mb-2">
//             Email Address
//           </label>
//           <input
//             type="email"
//             name="email"
//             value={formData.email}
//             onChange={handleChange}
//             placeholder="Enter email address"
//             className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C] focus:border-transparent"
//           />
//         </div>

//         {/* Special Preferences/Requests */}
//         <div>
//           <label className="block text-base font-normal text-gray-900 mb-2">
//             Special Preferences/Requests
//           </label>
//           <input
//             type="text"
//             name="specialPreferences"
//             value={formData.specialPreferences}
//             onChange={handleChange}
//             placeholder="Enter special preferences"
//             className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C] focus:border-transparent"
//           />
//         </div>

//         {/* Select Tier */}
//         <div>
//           <label className="block text-base font-normal text-gray-900 mb-2">
//             Select Tier
//           </label>
//           <div className="relative">
//             <select
//               name="tier"
//               value={formData.tier}
//               onChange={handleChange}
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C] focus:border-transparent appearance-none bg-white"
//             >
//               <option value="">Select tier</option>
//               <option value="1">Tier 1</option>
//               <option value="2">Tier 2</option>
//               <option value="3">Tier 3</option>
//             </select>
//             <svg 
//               className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" 
//               fill="none" 
//               stroke="currentColor" 
//               viewBox="0 0 24 24"
//             >
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//             </svg>
//           </div>
//         </div>

//         {/* Action Buttons */}
//         <div className="flex gap-4 pt-4">
//           <button
//             onClick={handleSubmit}
//             className="flex-1 px-6 py-3 bg-[#15BA5C] text-white rounded-lg hover:bg-[#13A652] transition-colors font-medium"
//           >
//             Create Customer
//           </button>
//           <button
//             onClick={handleCancel}
//             className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
//           >
//             Cancel
//           </button>
//         </div>
//       </div>
//     </Modal>
//   );
// };