import React, { useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

export interface PaymentTerm {
  id: string;
  name: string;
  paymentType: string;
  instantPayment: boolean;
  paymentOnDelivery: boolean;
  paymentInInstallment: {
    name: string;
    noOfSplit: number;
    options: Array<{
      noOfDays: number;
      splitPercent: number;
      paymentDuration: string;
    }>;
  } | null;
  outletId: string;
  recordId: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface PaymentTermsListProps {
  terms: PaymentTerm[];
  selectedTermId: string | null;
  onSelect: (term: PaymentTerm) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading: boolean;
}

const ITEMS_PER_PAGE = 5;

const PaymentTermsList: React.FC<PaymentTermsListProps> = ({
  terms,
  selectedTermId,
  onSelect,
  searchQuery,
  onSearchChange,
  isLoading,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(terms.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTerms = terms.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="w-[400px] border-r border-gray-100 flex flex-col h-full bg-white">
      <div className="p-6 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">All Payment Terms</h2>
          <p className="text-xs text-gray-500 mt-1">
            Manage all your payment terms for your customers.
          </p>
        </div>

        <div className="relative group">
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:border-[#15BA5C] transition-colors">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="flex-1 px-3 py-2 text-sm outline-none placeholder-gray-400"
            />
            <div className="bg-[#15BA5C] p-2 flex items-center justify-center cursor-pointer hover:bg-[#119E4D] transition-colors">
              <Search className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-4 border border-gray-100 rounded-xl animate-pulse space-y-2"
            >
              <div className="h-4 w-3/4 bg-gray-100 rounded"></div>
              <div className="flex gap-2">
                <div className="h-5 w-12 bg-gray-50 rounded-full"></div>
                <div className="h-5 w-16 bg-gray-50 rounded-full"></div>
              </div>
            </div>
          ))
        ) : terms.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-gray-400">No payment terms found</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedTerms.map((term) => {
                const isSelected = selectedTermId === term.id;
                return (
                  <div
                    key={term.id}
                    onClick={() => onSelect(term)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                      isSelected
                        ? "border-[#15BA5C] bg-[#15BA5C05]"
                        : "border-gray-100 hover:border-gray-200 bg-white"
                    }`}
                  >
                    <h3
                      className={`font-semibold text-sm ${
                        isSelected ? "text-[#15BA5C]" : "text-gray-900"
                      }`}
                    >
                      {term.name}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span
                        className={`px-3 py-0.5 rounded-full text-[10px] font-medium ${
                          isSelected
                            ? "bg-[#15BA5C] text-white"
                            : "bg-gray-50 text-gray-500"
                        }`}
                      >
                        {term.paymentType}
                      </span>
                      {term.paymentInInstallment && (
                        <span
                          className={`px-3 py-0.5 rounded-full text-[10px] font-medium ${
                            isSelected
                              ? "bg-[#15BA5C] text-white"
                              : "bg-gray-50 text-gray-500"
                          }`}
                        >
                          {term.paymentInInstallment.noOfSplit} Splits
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-50">
                <p className="text-xs text-gray-500">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-md border border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft size={16} className="text-gray-600" />
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-md border border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight size={16} className="text-gray-600" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentTermsList;
