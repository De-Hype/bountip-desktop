import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, MoreVertical } from "lucide-react";
import { Pagination } from "@/shared/Pagination/pagination";
import AllOrderFilter, { OrderFilterState } from "./AllOrderFilter";
import useOrderStore from "@/stores/useOrderStore";
import { useBusinessStore } from "@/stores/useBusinessStore";
import { format } from "date-fns";
import { getCurrencySymbol } from "@/utils/getCurrencySymbol";
import CreateProductionSchedule from "./CreateProductionSchedule";

const AllOrdersList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreateScheduleOpen, setIsCreateScheduleOpen] = useState(false);

  const { orders, fetchOrders } = useOrderStore();
  const { selectedOutlet } = useBusinessStore();

  useEffect(() => {
    fetchOrders(selectedOutlet?.id);
  }, [fetchOrders, selectedOutlet?.id]);

  const handleApplyFilters = (filters: OrderFilterState) => {
    console.log("Applied filters:", filters);
    // Logic to filter the list would go here
  };

  const currencySymbol = selectedOutlet?.currency
    ? getCurrencySymbol(selectedOutlet.currency)
    : "₦";

  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${new Intl.NumberFormat().format(amount)}`;
  };

  const filteredOrders = orders.filter((order) => {
    const searchMatch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    return searchMatch;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const getChannelBadgeClass = (channel: string) => {
    switch (channel) {
      case "Preorder":
        return "bg-[#F3E8FF] text-[#9333EA]";
      case "Online":
        return "bg-[#F3F4F6] text-[#4B5563]";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "To be Produced":
        return "bg-[#F0F9FF] text-[#0284C7]";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getPaymentBadgeClass = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-[#FEF2F2] text-[#EF4444]";
      case "Unpaid":
        return "bg-[#FFFBEB] text-[#F59E0B]";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-white">
      {/* Orders Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-bold text-[#1C1B20]">All Orders</h2>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search Bar */}
          <div className="flex items-center flex-1 sm:flex-none">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search"
              className="w-full sm:w-[240px] h-11 px-4 bg-white border border-gray-200 rounded-l-[10px] outline-none focus:border-[#15BA5C] transition-all text-sm placeholder:text-gray-400"
            />
            <button
              type="button"
              className="h-11 px-4 bg-[#15BA5C] text-white rounded-r-[10px] hover:bg-[#119E4D] transition-colors cursor-pointer flex items-center justify-center"
            >
              <Search className="size-5" />
            </button>
          </div>

          {/* Filters Button */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className="h-11 px-5 bg-white border border-gray-200 rounded-[10px] text-[14px] font-medium text-[#4B5563] hover:bg-gray-50 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <SlidersHorizontal className="size-4 text-gray-400" />
            Filters
          </button>

          {/* View Production Schedule Button */}
          <button
            type="button"
            className="h-11 px-5 bg-white border border-[#15BA5C] text-[#15BA5C] rounded-[10px] text-[14px] font-medium hover:bg-green-50 transition-all cursor-pointer"
          >
            View Production Schedule
          </button>

          {/* Create Production Schedule Button */}
          <button
            type="button"
            onClick={() => setIsCreateScheduleOpen(true)}
            className="h-11 px-5 bg-[#15BA5C] text-white rounded-[10px] text-[14px] font-medium hover:bg-[#119E4D] transition-all cursor-pointer"
          >
            Create Production Schedule
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto  rounded-[12px] mb-6">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead className="bg-[#F9FAFB]">
            <tr>
              <th className="px-4 py-4 text-[13px] font-medium text-gray-500">
                Order ID
              </th>
              <th className="px-4 py-4 text-[13px] font-medium text-gray-500">
                Customer Name
              </th>
              <th className="px-4 py-4 text-[13px] font-medium text-gray-500">
                Order Value
              </th>
              <th className="px-4 py-4 text-[13px] font-medium text-gray-500">
                Channel
              </th>
              <th className="px-4 py-4 text-[13px] font-medium text-gray-500">
                Order Creation Date
              </th>
              <th className="px-4 py-4 text-[13px] font-medium text-gray-500">
                Order Status
              </th>
              <th className="px-4 py-4 text-[13px] font-medium text-gray-500">
                Payment Status
              </th>
              <th className="px-4 py-4 text-[13px] font-medium text-gray-500">
                Due Date
              </th>
              <th className="px-4 py-4 text-[13px] font-medium text-gray-500">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedOrders.map((order, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-5 text-sm font-medium text-[#15BA5C]">
                  {order.id}
                </td>
                <td className="px-4 py-5 text-sm text-[#1C1B20] font-medium">
                  {order.customerName || "Walk-in Customer"}
                </td>
                <td className="px-4 py-5 text-sm text-[#1C1B20] font-bold">
                  {formatCurrency(order.total)}
                </td>
                <td className="px-4 py-5">
                  <span
                    className={`px-3 py-1 rounded-full text-[12px] font-medium ${getChannelBadgeClass(order.orderChannel)}`}
                  >
                    {order.orderChannel}
                  </span>
                </td>
                <td className="px-4 py-5 text-sm text-gray-600">
                  {format(new Date(order.createdAt), "eee do MMM, yyyy")}
                </td>
                <td className="px-4 py-5">
                  <span
                    className={`px-3 py-1 rounded-full text-[12px] font-medium ${getStatusBadgeClass(order.status)}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-5">
                  <span
                    className={`px-3 py-1 rounded-full text-[12px] font-medium ${getPaymentBadgeClass(order.paymentStatus)}`}
                  >
                    {order.paymentStatus}
                  </span>
                </td>
                <td className="px-4 py-5 text-sm text-gray-600">
                  {order.scheduledAt
                    ? format(new Date(order.scheduledAt), "eee do MMM, yyyy")
                    : "N/A"}
                </td>
                <td className="px-4 py-5">
                  <button
                    type="button"
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <MoreVertical className="size-4 text-gray-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
        totalItems={filteredOrders.length}
      />

      <AllOrderFilter
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleApplyFilters}
      />

      <CreateProductionSchedule
        isOpen={isCreateScheduleOpen}
        onClose={() => setIsCreateScheduleOpen(false)}
        orders={orders}
        onCreated={() => {
          setIsCreateScheduleOpen(false);
        }}
      />
    </div>
  );
};

export default AllOrdersList;
