import React, { useState, useMemo } from "react";
import {
  Search,
  SlidersHorizontal,
  CloudUpload,
  ChevronUp as ChevronUpIcon,
  ChevronDown as ChevronDownIcon,
  Plus,
} from "lucide-react";
import useCustomerStore, { Customer } from "@/stores/useCustomerStore";
import CustomerFilters from "./CustomerFilters";
import { Pagination } from "@/shared/Pagination/pagination";
import CustomerManagementAssets from "@/assets/images/customer-management";
import NotFound from "./NotFound";

// Placeholder for missing asset
const EmptyCustomer = CustomerManagementAssets.UserStar;

interface Column {
  title: string;
  key: keyof Customer;
  sortable?: boolean;
  render?: (customer: Customer) => React.ReactNode;
}

const CustomerList = () => {
  const {
    customers,
    searchQuery,
    setSearchQuery,
    filters,
    pagination,
    setPage,
    setItemsPerPage,
    sortConfig,
    setSort,
  } = useCustomerStore();

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isCustomerCreationOpen, setIsCustomerCreationOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

  // Derived state for filtering and sorting
  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.phoneNumber.includes(query),
      );
    }

    // Filters
    if (filters.status !== "All") {
      result = result.filter((c) => c.status === filters.status);
    }
    if (filters.type !== "All") {
      result = result.filter((c) => c.type === filters.type);
    }
    if (filters.paymentTerm !== "All") {
      result = result.filter((c) => c.paymentTermId === filters.paymentTerm);
    }
    if (filters.date) {
      const filterDate = new Date(filters.date).toDateString();
      result = result.filter((c) => {
        const createdAt = new Date(c.createdAt).toDateString();
        return createdAt === filterDate;
      });
    }

    // Sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue === undefined || bValue === undefined) return 0;

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [customers, searchQuery, filters, sortConfig]);

  // Pagination logic
  const totalPages = Math.ceil(
    filteredCustomers.length / pagination.itemsPerPage,
  );
  const paginatedCustomers = filteredCustomers.slice(
    (pagination.currentPage - 1) * pagination.itemsPerPage,
    pagination.currentPage * pagination.itemsPerPage,
  );

  const columns: Column[] = [
    { title: "Name", key: "name", sortable: true },
    { title: "Email", key: "email", sortable: true },
    { title: "Phone", key: "phoneNumber", sortable: true },
    { title: "Type", key: "type", sortable: true },
    {
      title: "Status",
      key: "status",
      sortable: true,
      render: (customer) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            customer.status === "Active"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {customer.status}
        </span>
      ),
    },
    {
      title: "Balance",
      key: "balance",
      sortable: true,
      render: (customer) => <span>{customer.balance.toFixed(2)}</span>,
    },
    { title: "Created At", key: "createdAt", sortable: true },
  ];

  const handleSort = (key: keyof Customer) => {
    setSort(key);
  };

  return (
    <div className="bg-white px-6 py-9 rounded-md">
      <div className="space-y-2">
        <h3 className="text-gray-900 font-medium text-2xl">Your Customers</h3>
        <p className="text-base text-[#737373]">
          Create, organize, and manage all customers
        </p>
      </div>

      {/* Controls */}
      <div className="mt-10 flex items-center justify-between py-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center border h-10 border-[#15BA5C] bg-white rounded-md transition min-w-[300px]">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="outline-none w-full pl-4 bg-transparent placeholder-[#A6A6A6] text-sm"
            />
            <div className="bg-[#15BA5C] h-10 px-2.5 flex items-center justify-center rounded-r-md">
              <Search className="w-4 h-4 text-white" />
            </div>
          </div>
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className={`flex items-center gap-2.5 px-4 py-2 h-10 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer
                 bg-white text-[#15BA5C] border border-[#15BA5C] active:scale-95
                `}
          >
            <span>Filters</span>
            <SlidersHorizontal className="size-4.5" />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsBulkUploadOpen(true)}
            className="flex items-center gap-2.5 px-4 py-2 h-10 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer bg-white text-[#15BA5C] border border-[#15BA5C] active:scale-95"
          >
            <span>Bulk Upload</span>
            <CloudUpload className="size-4.5" />
          </button>
          <button
            onClick={() => setIsCustomerCreationOpen(true)}
            className="flex items-center gap-2.5 px-4 py-2 h-10 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer bg-[#15BA5C] text-white hover:bg-[#15BA5C] active:scale-95"
          >
            <span>Create Customer</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-8">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              {columns.map(({ title, sortable, key }) => (
                <th
                  key={key}
                  onClick={sortable ? () => handleSort(key) : undefined}
                  className={`px-4 py-3 text-left text-sm font-medium text-gray-600 whitespace-nowrap ${
                    sortable ? "cursor-pointer select-none" : ""
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {title}
                    {sortable && (
                      <span className="flex flex-col">
                        <ChevronUpIcon
                          className={`w-3 h-3 ${
                            sortConfig.key === key &&
                            sortConfig.direction === "asc"
                              ? "text-gray-900"
                              : "text-gray-400"
                          }`}
                        />
                        <ChevronDownIcon
                          className={`w-3 h-3 ${
                            sortConfig.key === key &&
                            sortConfig.direction === "desc"
                              ? "text-gray-900"
                              : "text-gray-400"
                          }`}
                        />
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-gray-500"
                >
                  <NotFound onAction={() => setIsCustomerCreationOpen(true)} />
                </td>
              </tr>
            ) : (
              paginatedCustomers.map((customer, i) => (
                <tr
                  key={customer.id || i}
                  className="border-b border-b-gray-200 last:border-b-0"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="py-4 text-gray-700 px-4">
                      {col.render
                        ? col.render(customer)
                        : (customer[col.key] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredCustomers.length > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
          itemsPerPage={pagination.itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}

      {/* Filter Modal */}
      <CustomerFilters
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
      />
    </div>
  );
};

export default CustomerList;
