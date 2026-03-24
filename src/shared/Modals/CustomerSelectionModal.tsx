import React, { useState, useEffect } from "react";
import { X, Search } from "lucide-react";
import useCustomerStore, { Customer } from "@/stores/useCustomerStore";
import { useBusinessStore } from "@/stores/useBusinessStore";
import CreateCustomer from "@/features/customer-management/customers/CreateCustomer";
import { Pagination } from "@/shared/Pagination/pagination";

interface CustomerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (customer: Customer) => void;
}

const CustomerSelectionModal: React.FC<CustomerSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [customerSearch, setCustomerSearch] = useState("");
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false);

  const {
    customers,
    fetchCustomers,
    isLoading: isCustomersLoading,
    setSearchQuery: setCustomerSearchQuery,
    pagination,
    setPage,
    setItemsPerPage,
    setSort,
  } = useCustomerStore();

  const { selectedOutlet } = useBusinessStore();

  useEffect(() => {
    if (isOpen) {
      setCustomerSearch(""); // Clear local search input
      setCustomerSearchQuery(""); // Reset store search query
      setPage(1); // Reset to first page
      setSort("name", "asc"); // Force alphabetical sorting A-Z
      fetchCustomers(selectedOutlet?.id);
    }
  }, [
    isOpen,
    setCustomerSearchQuery,
    setPage,
    setSort,
    fetchCustomers,
    selectedOutlet?.id,
  ]);

  const handleCustomerSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setCustomerSearch(query);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setCustomerSearchQuery(customerSearch);
      fetchCustomers(selectedOutlet?.id);
    }, 500); // 500ms debounce delay

    return () => clearTimeout(timer);
  }, [
    customerSearch,
    setCustomerSearchQuery,
    fetchCustomers,
    selectedOutlet?.id,
  ]);

  if (!isOpen) return null;

  const totalPages = Math.ceil(customers.length / pagination.itemsPerPage) || 1;
  const paginatedCustomers = customers.slice(
    (pagination.currentPage - 1) * pagination.itemsPerPage,
    pagination.currentPage * pagination.itemsPerPage,
  );

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-end">
        <div
          className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
          onClick={onClose}
        />
        <div className="relative w-full max-w-[700px] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-[20px] font-bold text-[#1C1B20]">
                Customers
              </h2>
              <p className="text-[14px] text-[#6B7280]">
                Select a customer for this order
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-6 h-6 text-[#6B7280]" />
            </button>
          </div>

          <div className="p-6 space-y-6 flex-1 flex flex-col min-h-0">
            <div className="flex items-center border border-[#E5E7EB] rounded-[8px] overflow-hidden bg-white shadow-sm flex-shrink-0">
              <div className="flex-1 flex items-center px-4">
                <Search className="w-5 h-5 text-[#9CA3AF]" />
                <input
                  type="text"
                  placeholder="Search by name, phone, email, or ID"
                  value={customerSearch}
                  onChange={handleCustomerSearch}
                  className="px-3 py-3 flex-1 outline-none text-[15px] text-[#1C1B20] placeholder-[#9CA3AF]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar w-full rounded-[12px] flex flex-col">
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left table-auto">
                  <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 text-[13px] font-bold text-[#6B7280]">
                        Customer Name
                      </th>
                      <th className="px-6 py-4 text-[13px] font-bold text-[#6B7280]">
                        Phone
                      </th>
                      <th className="px-6 py-4 text-[13px] font-bold text-[#6B7280]">
                        Email
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {isCustomersLoading ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center">
                          <div className="flex items-center justify-center gap-2 text-[#15BA5C]">
                            <div className="w-5 h-5 border-2 border-[#15BA5C] border-t-transparent rounded-full animate-spin" />
                            <span className="text-[14px] font-medium">
                              Loading customers...
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : customers.length > 0 ? (
                      paginatedCustomers.map((customer) => (
                        <tr
                          key={customer.id}
                          onClick={() => onSelect(customer)}
                          className="hover:bg-[#F9FAFB] cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4 text-[14px] font-bold text-[#15BA5C] whitespace-nowrap">
                            {customer.name}
                          </td>
                          <td className="px-6 py-4 text-[14px] text-[#6B7280] whitespace-nowrap">
                            {customer.phoneNumber || "No phone"}
                          </td>
                          <td className="px-6 py-4 text-[14px] text-[#6B7280]">
                            {customer.email || "No email"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-6 py-12 text-center text-[#6B7280] text-[14px]"
                        >
                          No customers found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {customers.length > 0 && (
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  itemsPerPage={pagination.itemsPerPage}
                  onItemsPerPageChange={setItemsPerPage}
                  className="bg-white sticky bottom-0 border-t border-[#E5E7EB]"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Customer Modal */}
      <CreateCustomer
        isOpen={isCreateCustomerOpen}
        onClose={() => setIsCreateCustomerOpen(false)}
      />
    </>
  );
};

export default CustomerSelectionModal;
