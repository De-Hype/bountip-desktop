"use client";

export default function CustomerManagementPage() {
  return <div>Customer Settings</div>;
}

// "use client";
// import React, { useState, useEffect, useCallback } from "react";
// import {
//   Search,
//   Filter,
//   Upload,
//   Plus,
//   Loader2,
//   ChevronUp,
//   ChevronDown,
// } from "lucide-react";
// import { ViewCustomerModal } from "@/components/Modals/Settings/components/ViewCustomerModal";
// import CreateCustomerModal from "@/app/features/customers/CreateCustomerModal";
// import {
//   useAddCustomerMutation,
//   useGetAllCustomersQuery,
// } from "@/redux/customer";
// import { useAppSelector } from "@/hooks/redux-hooks";

// interface Customer {
//   id: string | number;
//   name: string;
//   phoneNumber: string;
//   email: string;
//   address: string;
//   tier: number;
// }

// type SortField = "name" | "phoneNumber" | "email" | "address" | "tier";
// type SortDirection = "asc" | "desc";

// export default function CustomerManagementPage() {
//   const outlet = useAppSelector((state) => state.business.outlet);
//   const [page, setPage] = useState(1);
//   const [limit] = useState(40);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [addCustomer, { isLoading: isAddingCustomer }] =
//     useAddCustomerMutation();
//   const {
//     data: customersData,
//     isLoading,
//     refetch,
//     error,
//   } = useGetAllCustomersQuery(
//     {
//       outletId: outlet?.id || "",
//       pagination: { search: searchQuery, limit, page },
//     },
//     { skip: !outlet?.id }
//   );
//   const [customers, setCustomers] = useState<Customer[]>([]);
//   const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);

//   const [searchTerm, setSearchTerm] = useState("");
//   const [sortField, setSortField] = useState<SortField>("name");
//   const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
//   const [selectedTierFilter, setSelectedTierFilter] = useState<number | null>(
//     null
//   );
//   const [isFilterOpen, setIsFilterOpen] = useState(false);

//   // Modal states
//   const [isViewModalOpen, setIsViewModalOpen] = useState(false);
//   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
//   const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
//     null
//   );
//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

//   useEffect(() => {
//     if (customersData && customersData.data) {
//       setCustomers(customersData.data);
//     }
//   }, [customersData]);

//   useEffect(() => {
//     if (!customers) return;
//     let filtered = [...customers];

//     if (searchTerm) {
//       filtered = filtered.filter(
//         (customer) =>
//           customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           customer.phoneNumber.includes(searchTerm) ||
//           customer.address.toLowerCase().includes(searchTerm.toLowerCase())
//       );
//     }

//     if (selectedTierFilter !== null) {
//       filtered = filtered.filter(
//         (customer) => customer.tier === selectedTierFilter
//       );
//     }

//     filtered.sort((a, b) => {
//       const aValue = a[sortField];
//       const bValue = b[sortField];

//       if (typeof aValue === "string" && typeof bValue === "string") {
//         return sortDirection === "asc"
//           ? aValue.localeCompare(bValue)
//           : bValue.localeCompare(aValue);
//       }

//       if (typeof aValue === "number" && typeof bValue === "number") {
//         return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
//       }

//       return 0;
//     });

//     setFilteredCustomers(filtered);
//   }, [customers, searchTerm, selectedTierFilter, sortField, sortDirection]);

//   const handleSort = (field: SortField) => {
//     if (sortField === field) {
//       setSortDirection(sortDirection === "asc" ? "desc" : "asc");
//     } else {
//       setSortField(field);
//       setSortDirection("asc");
//     }
//   };

//   const SortIcon = ({ field }: { field: SortField }) => {
//     if (sortField !== field) return null;
//     return sortDirection === "asc" ? (
//       <ChevronUp className="h-4 w-4 inline ml-1" />
//     ) : (
//       <ChevronDown className="h-4 w-4 inline ml-1" />
//     );
//   };

//   const handleViewCustomer = (customerId: string | number) => {
//     const customer = customers.find((c) => c.id === customerId);
//     if (customer) {
//       setSelectedCustomer(customer);
//       setIsViewModalOpen(true);
//     }
//   };

//   const handleEditCustomer = (customer: Customer) => {
//     setEditingCustomer(customer);
//     setIsCreateModalOpen(true);
//   };

//   const handleRemoveCustomer = (customerId: string | number) => {
//     setCustomers((prev) => prev.filter((c) => c.id !== customerId));
//   };

//   const handleAddNewCustomer = () => {
//     setEditingCustomer(null);
//     setIsCreateModalOpen(true);
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="px-5 py-3">
//         <div className="mb-8">
//           <h1 className="text-2xl font-bold text-gray-900 mb-2">Customers</h1>
//           <p className="text-[#737373]">Manage your customer tiers with ease</p>
//         </div>

//         <div className="bg-white rounded-lg shadow-sm">
//           <div className="p-6 border-b border-gray-200">
//             <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//               <h2 className="text-xl font-semibold text-gray-900">
//                 All Customers
//               </h2>

//               <div className="flex flex-col sm:flex-row gap-3">
//                 <div className="relative flex-1 sm:min-w-[300px]">
//                   <input
//                     type="text"
//                     placeholder="Search"
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BA5C]"
//                   />
//                   <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[#15BA5C] text-white rounded-md hover:bg-[#13A652]">
//                     <Search className="h-4 w-4" />
//                   </button>
//                 </div>

//                 <div className="relative">
//                   <button
//                     onClick={() => setIsFilterOpen(!isFilterOpen)}
//                     className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
//                   >
//                     <Filter className="h-4 w-4" />
//                     <span>Filters</span>
//                   </button>

//                   {isFilterOpen && (
//                     <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
//                       <div className="p-3">
//                         <p className="text-sm font-medium text-gray-700 mb-2">
//                           Filter by Tier
//                         </p>
//                         <div className="space-y-2">
//                           <label className="flex items-center">
//                             <input
//                               type="radio"
//                               name="tierFilter"
//                               checked={selectedTierFilter === null}
//                               onChange={() => setSelectedTierFilter(null)}
//                               className="mr-2"
//                             />
//                             <span className="text-sm">All Tiers</span>
//                           </label>
//                           {[1, 2, 3].map((tier) => (
//                             <label key={tier} className="flex items-center">
//                               <input
//                                 type="radio"
//                                 name="tierFilter"
//                                 checked={selectedTierFilter === tier}
//                                 onChange={() => setSelectedTierFilter(tier)}
//                                 className="mr-2"
//                               />
//                               <span className="text-sm">Tier {tier}</span>
//                             </label>
//                           ))}
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </div>

//                 <button className="flex items-center gap-2 px-4 py-2.5 border border-[#15BA5C] text-[#15BA5C] rounded-lg hover:bg-green-50">
//                   <Upload className="h-4 w-4" />
//                   <span>Bulk Upload</span>
//                 </button>

//                 <button
//                   onClick={handleAddNewCustomer}
//                   className="flex items-center gap-2 px-4 py-2.5 bg-[#15BA5C] text-white rounded-lg hover:bg-[#13A652]"
//                 >
//                   <Plus className="h-4 w-4" />
//                   <span>Add a New Customer</span>
//                 </button>
//               </div>
//             </div>
//           </div>

//           <div className="overflow-x-auto">
//             {isLoading ? (
//               <div className="flex items-center justify-center py-12">
//                 <Loader2 className="w-8 h-8 animate-spin text-[#15BA5C]" />
//                 <span className="ml-3 text-gray-600">Loading customers...</span>
//               </div>
//             ) : filteredCustomers?.length === 0 ? (
//               <div className="text-center py-12">
//                 <p className="text-gray-500">No customers found</p>
//               </div>
//             ) : (
//               <table className="w-full">
//                 <thead className="bg-gray-50 border-y border-gray-200">
//                   <tr>
//                     <th
//                       className="px-6 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
//                       onClick={() => handleSort("name")}
//                     >
//                       Customer Name <SortIcon field="name" />
//                     </th>
//                     <th
//                       className="px-6 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
//                       onClick={() => handleSort("phoneNumber")}
//                     >
//                       Phone Number <SortIcon field="phoneNumber" />
//                     </th>
//                     <th
//                       className="px-6 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
//                       onClick={() => handleSort("email")}
//                     >
//                       Email <SortIcon field="email" />
//                     </th>
//                     <th
//                       className="px-6 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
//                       onClick={() => handleSort("address")}
//                     >
//                       Address <SortIcon field="address" />
//                     </th>
//                     <th
//                       className="px-6 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
//                       onClick={() => handleSort("tier")}
//                     >
//                       Tier <SortIcon field="tier" />
//                     </th>
//                     <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
//                       Action
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {filteredCustomers?.map((customer) => (
//                     <tr key={customer.id} className="hover:bg-gray-50">
//                       <td className="px-6 py-4 text-sm text-gray-900">
//                         {customer.name}
//                       </td>
//                       <td className="px-6 py-4 text-sm text-gray-900">
//                         {customer.phoneNumber}
//                       </td>
//                       <td className="px-6 py-4 text-sm text-gray-900">
//                         {customer.email || "- - -"}
//                       </td>
//                       <td className="px-6 py-4 text-sm text-gray-900">
//                         {customer.address || "- - -"}
//                       </td>
//                       <td className="px-6 py-4 text-sm text-gray-900">
//                         {customer.tier || "- - -"}
//                       </td>
//                       <td className="px-6 py-4">
//                         <button
//                           onClick={() => handleViewCustomer(customer.id)}
//                           className="px-4 py-2 bg-[#15BA5C] text-white text-sm rounded-lg hover:bg-[#13A652] transition-colors"
//                         >
//                           View
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Modals */}
//       <ViewCustomerModal
//         isOpen={isViewModalOpen}
//         onClose={() => setIsViewModalOpen(false)}
//         customer={selectedCustomer}
//         onEdit={handleEditCustomer}
//         onRemove={handleRemoveCustomer}
//       />

//       <CreateCustomerModal
//         isOpen={isCreateModalOpen}
//         onClose={() => {
//           setIsCreateModalOpen(false);
//           setEditingCustomer(null);
//         }}
//         onCustomerCreated={() => refetch()} // refresh list after new customer
//       />
//     </div>
//   );
// }
