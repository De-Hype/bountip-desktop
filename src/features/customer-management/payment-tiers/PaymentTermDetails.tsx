import React from "react";
import { CreditCard, Truck, Calendar, Edit3, Plus } from "lucide-react";
import { PaymentTerm } from "./PaymentTermsList";

interface PaymentTermDetailsProps {
  term: PaymentTerm | null;
  onEdit?: (term: PaymentTerm) => void;
  onAdd?: () => void;
}

const PaymentTermDetails: React.FC<PaymentTermDetailsProps> = ({
  term,
  onEdit,
  onAdd,
}) => {
  if (!term) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-gray-50/30">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
            <CreditCard size={32} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Select a Payment Term
            </h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              Choose a payment term from the list to view its configuration and
              installment schedules.
            </p>
          </div>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 bg-[#15BA5C] cursor-pointer text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#119E4D] transition-colors shadow-sm"
          >
            <Plus size={18} /> Add Payment Term
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white p-8 overflow-y-auto">
      <div className="flex items-start justify-between mb-10">
        <div className="space-y-3">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            {term.name}
          </h2>
          <span className="inline-block px-4 py-1.5 bg-[#15BA5C1A] text-[#15BA5C] rounded-full text-sm font-medium">
            {term.paymentType}
          </span>
        </div>
        <button
          onClick={onAdd}
          className="bg-[#15BA5C] cursor-pointer text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#119E4D] transition-all active:scale-95 shadow-sm"
        >
          Add Payment Term
        </button>
      </div>

      <div className="space-y-10 max-w-4xl">
        {/* Payment Options Section */}
        <div className="space-y-5">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
            Payment Options
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${
                term.instantPayment
                  ? "border-[#15BA5C] bg-white shadow-sm"
                  : "border-gray-200 bg-gray-50 opacity-50"
              }`}
            >
              <div
                className={`p-2.5 rounded-lg ${term.instantPayment ? "bg-[#15BA5C1A] text-[#15BA5C]" : "bg-gray-200 text-gray-400"}`}
              >
                <CreditCard size={20} />
              </div>
              <span
                className={`font-semibold ${term.instantPayment ? "text-gray-900" : "text-gray-400"}`}
              >
                Instant payment
              </span>
            </div>

            <div
              className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${
                term.paymentOnDelivery
                  ? "border-[#15BA5C] bg-white shadow-sm"
                  : "border-gray-200 bg-gray-50 opacity-50"
              }`}
            >
              <div
                className={`p-2.5 rounded-lg ${term.paymentOnDelivery ? "bg-[#15BA5C1A] text-[#15BA5C]" : "bg-gray-200 text-gray-400"}`}
              >
                <Truck size={20} />
              </div>
              <span
                className={`font-semibold ${term.paymentOnDelivery ? "text-gray-900" : "text-gray-400"}`}
              >
                Pay on delivery
              </span>
            </div>

            <div
              className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${
                term.paymentInInstallment
                  ? "border-[#15BA5C] bg-[#15BA5C0D] shadow-sm"
                  : "border-gray-200 bg-gray-50 opacity-50"
              }`}
            >
              <div
                className={`p-2.5 rounded-lg ${term.paymentInInstallment ? "bg-[#15BA5C] text-white" : "bg-gray-200 text-gray-400"}`}
              >
                <Calendar size={20} />
              </div>
              <span
                className={`font-semibold ${term.paymentInInstallment ? "text-gray-900" : "text-gray-400"}`}
              >
                Pay in installments
              </span>
            </div>
          </div>
        </div>

        {/* Installment Schedules Section */}
        {term.paymentInInstallment && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                Installment Schedules...
              </h3>
              <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-md text-xs font-bold shadow-sm border border-gray-200">
                {term.paymentInInstallment.noOfSplit} Splits
              </span>
            </div>

            <div className="space-y-4">
              {term.paymentInInstallment.options.map((option, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 rounded-full bg-[#15BA5C] text-white flex items-center justify-center font-bold text-base shadow-lg shadow-green-100">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">
                        {idx === 0
                          ? "1st"
                          : idx === 1
                            ? "2nd"
                            : idx === 2
                              ? "3rd"
                              : `${idx + 1}th`}{" "}
                        Installment
                      </p>
                      <p className="text-sm text-gray-400 font-medium">
                        {option.paymentDuration === "at_checkout"
                          ? "Paid at checkout"
                          : `Paid at ${option.noOfDays} days after delivery`}
                      </p>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-[#15BA5C] tracking-tight">
                    {option.splitPercent}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-6">
          <button
            onClick={() => onEdit?.(term)}
            className="w-full cursor-pointer bg-[#15BA5C] text-white py-2 rounded-2xl font-bold text-base hover:bg-[#119E4D] transition-all active:scale-[0.99] shadow-xl shadow-green-100 hover:shadow-green-200"
          >
            Edit Payment Term
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentTermDetails;
