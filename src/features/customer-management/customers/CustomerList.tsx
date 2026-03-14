import React, { useState, useEffect } from "react";
import {
  Search,
  SlidersHorizontal,
  CloudUpload,
  ChevronUp as ChevronUpIcon,
  ChevronDown as ChevronDownIcon,
  Users,
  UserCheck,
  UserX,
  TrendingUp,
} from "lucide-react";
import useCustomerStore, { Customer } from "@/stores/useCustomerStore";
import CustomerFilters from "./CustomerFilters";
import CreateCustomer from "./CreateCustomer";
import BulkUploadCustomers from "./BulkUploadCustomers";
import { Pagination } from "@/shared/Pagination/pagination";
import NotFound from "./NotFound";
import { format } from "date-fns";

interface Column {
  title: string;
  key: keyof Customer;
  sortable?: boolean;
  render?: (customer: Customer) => React.ReactNode;
}

const CustomerList = () => {
  const {
    customers,
    isLoading,
    searchQuery,
    setSearchQuery,
    pagination,
    setPage,
    setItemsPerPage,
    sortConfig,
    setSort,
    fetchCustomers,
  } = useCustomerStore();

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isCustomerCreationOpen, setIsCustomerCreationOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const totalPages = Math.max(
    1,
    Math.ceil(customers.length / pagination.itemsPerPage),
  );
  const paginatedCustomers = customers.slice(
    (pagination.currentPage - 1) * pagination.itemsPerPage,
    pagination.currentPage * pagination.itemsPerPage,
  );

  const columns: Column[] = [
    {
      title: "Customer ID",
      key: "customerCode",
      sortable: true,
      render: (customer) => (
        <span className="text-[#15BA5C] font-medium">
          {customer.customerCode || customer.id.slice(0, 8).toUpperCase()}
        </span>
      ),
    },
    {
      title: "Customer Info",
      key: "name",
      sortable: true,
      render: (customer) => (
        <div className="flex flex-col">
          <span className="font-bold text-gray-900">{customer.name}</span>
          <span className="text-xs text-gray-500">{customer.email}</span>
          <span className="text-xs text-gray-500">{customer.phoneNumber}</span>
        </div>
      ),
    },
    {
      title: "Type",
      key: "type",
      sortable: true,
      render: (customer) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            customer.type === "Individual"
              ? "bg-green-50 text-green-600"
              : "bg-blue-50 text-blue-600"
          }`}
        >
          {customer.type}
        </span>
      ),
    },
    {
      title: "Status",
      key: "status",
      sortable: true,
      render: (customer) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            customer.status === "Active"
              ? "bg-green-50 text-green-600"
              : "bg-red-50 text-red-600"
          }`}
        >
          {customer.status}
        </span>
      ),
    },
    {
      title: "Payment Term",
      key: "paymentTermId",
      sortable: true,
      render: (customer) => {
        const term = customer.paymentTermId || "Default Term";
        return (
          <span className="text-sm text-gray-600" title={term}>
            {term.length > 15 ? `${term.substring(0, 15)}...` : term}
          </span>
        );
      },
    },
    {
      title: "Balance",
      key: "balance",
      sortable: true,
      render: () => <span className="text-sm text-gray-400">---</span>,
    },
    {
      title: "Created At",
      key: "createdAt",
      sortable: true,
      render: (customer) => (
        <span className="text-sm text-gray-600 whitespace-nowrap">
          {customer.createdAt
            ? format(new Date(customer.createdAt), "yyyy-MM-dd hh:mm a")
            : "---"}
        </span>
      ),
    },
  ];

  const handleSort = (key: keyof Customer) => {
    setSort(key);
  };

  const stats = [
    {
      title: "Total Customers",
      value: customers.length,
      icon: <Users className="w-6 h-6 text-blue-600" />,
      bg: "bg-blue-50",
    },
    {
      title: "Active Customers",
      value: customers.filter((c) => c.status === "Active").length,
      icon: <UserCheck className="w-6 h-6 text-green-600" />,
      bg: "bg-green-50",
    },
    {
      title: "Inactive Customers",
      value: customers.filter((c) => c.status === "Inactive").length,
      icon: <UserX className="w-6 h-6 text-red-600" />,
      bg: "bg-red-50",
    },
    {
      title: "Average Balance",
      value: "0.00",
      icon: <TrendingUp className="w-6 h-6 text-purple-600" />,
      bg: "bg-purple-50",
    },
  ];

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
            type="button"
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
            type="button"
            onClick={() => setIsBulkUploadOpen(true)}
            className="flex items-center gap-2.5 px-4 py-2 h-10 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer bg-white text-[#15BA5C] border border-[#15BA5C] active:scale-95"
          >
            <span>Bulk Upload</span>
            <CloudUpload className="size-4.5" />
          </button>
          <button
            type="button"
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
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr
                  key={`skeleton-${i}`}
                  className="border-b border-b-gray-100"
                >
                  <td className="py-4 px-4">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 w-40 bg-gray-100 rounded animate-pulse"></div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse"></div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse"></div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 w-24 bg-gray-100 rounded animate-pulse"></div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 w-12 bg-gray-100 rounded animate-pulse"></div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 w-32 bg-gray-100 rounded animate-pulse"></div>
                  </td>
                </tr>
              ))
            ) : customers.length === 0 ? (
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
      {customers.length > 0 && (
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

      {/* Create Customer Modal */}
      <CreateCustomer
        isOpen={isCustomerCreationOpen}
        onClose={() => setIsCustomerCreationOpen(false)}
      />

      {/* Bulk Upload Modal */}
      <BulkUploadCustomers
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onUploadSuccess={fetchCustomers}
      />
    </div>
  );
};

export default CustomerList;
