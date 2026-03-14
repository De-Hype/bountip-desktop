import { Modal } from "@/features/settings/ui/Modal";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { FaCalendarAlt, FaRegClock } from "react-icons/fa";
import useBusinessStore from "@/stores/useBusinessStore";
import { PaymentTerm } from "./PaymentTermsList";

interface EditPaymentTermProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  paymentTerm: PaymentTerm | null;
  mode: "view" | "edit";
}

const paymentOptions = [
  "Instant payment",
  "Pay on delivery",
  "Pay in installments",
];

const breakdownOptions = ["Instant", "At Checkout", "Days after delivery"];

const EditPaymentTerm = ({
  isOpen,
  onClose,
  onSuccess,
  paymentTerm,
  mode,
}: EditPaymentTermProps) => {
  const [userAction, setUserAction] = useState<"view" | "edit">(mode);
  const [splitCountInput, setSplitCountInput] = useState<number | "">("");
  const [openDropDown, setOpenDropDown] = useState<boolean>(false);
  const selectedOutlet = useBusinessStore((state) => state.selectedOutlet);

  const [formData, setFormData] = useState({
    name: "",
    paymentOptions: [] as string[],
    splits: {
      count: 0,
      breakdown: [] as {
        percentage: number | "";
        duration: string;
        days?: number | "";
      }[],
    },
  });

  useEffect(() => {
    setUserAction(mode);
  }, [mode]);

  useEffect(() => {
    if (paymentTerm && isOpen) {
      const options: string[] = [];
      if (paymentTerm.instantPayment) options.push("Instant payment");
      if (paymentTerm.paymentOnDelivery) options.push("Pay on delivery");
      if (paymentTerm.paymentInInstallment) options.push("Pay in installments");

      setFormData({
        name: paymentTerm.name,
        paymentOptions: options,
        splits: {
          count: paymentTerm.paymentInInstallment?.noOfSplit || 0,
          breakdown:
            paymentTerm.paymentInInstallment?.options.map((opt) => ({
              percentage: opt.splitPercent,
              duration:
                opt.paymentDuration === "at_checkout"
                  ? "At Checkout"
                  : "Days after delivery",
              days: opt.noOfDays,
            })) || [],
        },
      });
      setSplitCountInput(paymentTerm.paymentInInstallment?.noOfSplit || "");
    }
  }, [paymentTerm, isOpen]);

  useEffect(() => {
    setFormData((prev) => {
      const count = prev.splits.count;
      const breakdown = [...prev.splits.breakdown];

      if (breakdown.length < count) {
        while (breakdown.length < count) {
          breakdown.push({ percentage: "", duration: "", days: undefined });
        }
      } else if (breakdown.length > count) {
        breakdown.length = count;
      }

      return {
        ...prev,
        splits: { ...prev.splits, breakdown },
      };
    });
  }, [formData.splits.count]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name || formData.paymentOptions.length === 0) {
      alert("Please fill all required fields");
      return;
    }

    if (!selectedOutlet || !paymentTerm) return;

    const instantPayment = formData.paymentOptions.includes("Instant payment");
    const paymentOnDelivery =
      formData.paymentOptions.includes("Pay on delivery");
    const hasInstallments = formData.paymentOptions.includes(
      "Pay in installments",
    );

    let paymentInInstallment = null;
    if (hasInstallments) {
      paymentInInstallment = {
        name: "Installment Plan",
        noOfSplit: formData.splits.count,
        options: formData.splits.breakdown.map((item) => {
          let duration = "at_checkout";
          if (item.duration === "Days after delivery") {
            duration = "days_after_delivery";
          }
          return {
            splitPercent: Number(item.percentage) || 0,
            paymentDuration: duration,
            noOfDays: Number(item.days) || 0,
          };
        }),
      };
    }

    const payload = {
      id: paymentTerm.id,
      name: formData.name,
      paymentType: "custom",
      outletId: selectedOutlet.id,
      instantPayment,
      paymentOnDelivery,
      paymentInInstallment,
    };

    try {
      const api = (window as any).electronAPI;
      if (api) {
        await api.savePaymentTerm(payload);
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Failed to save payment term:", error);
      alert("Failed to save payment term");
    }
  };

  const handleDelete = async () => {
    if (
      !paymentTerm ||
      !window.confirm("Are you sure you want to delete this payment term?")
    )
      return;
    try {
      const api = (window as any).electronAPI;
      if (api) {
        await api.deletePaymentTerm(paymentTerm.id);
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Failed to delete payment term:", error);
    }
  };

  const renderHeader = () => {
    if (userAction === "edit") {
      return (
        <h2 className="text-lg font-semibold text-gray-900">
          Edit Payment Term
        </h2>
      );
    }
    return (
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900">{paymentTerm?.name}</h2>
        {paymentTerm && (
          <div className="flex items-center gap-4">
            <div className="flex gap-2 items-center text-gray-500">
              <FaRegClock size={14} className="text-[#15BA5C]" />
              <span className="text-xs">
                Last Updated{" "}
                {new Date(paymentTerm.updatedAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex gap-2 items-center text-gray-500">
              <FaCalendarAlt size={14} className="text-[#15BA5C]" />
              <span className="text-xs">
                Created on{" "}
                {new Date(paymentTerm.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={renderHeader()}
      subtitle={
        userAction === "edit" ? "Update your payment term configuration" : null
      }
      size="sm"
    >
      <div className="space-y-6 w-full px-1">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Payment Term Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={userAction === "view"}
            placeholder="Enter payment term name"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#15BA5C] focus:border-transparent disabled:bg-gray-50 transition-all"
          />
        </div>

        <div className="relative space-y-3 overflow-visible">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Payment Option(s)
          </label>

          <button
            type="button"
            disabled={userAction === "view"}
            onClick={() => setOpenDropDown((prev) => !prev)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-[#15BA5C1A] focus:border-[#15BA5C] transition cursor-pointer bg-white"
          >
            <div
              className={`flex flex-wrap gap-2 ${
                formData.paymentOptions.length
                  ? "text-gray-900"
                  : "text-gray-400"
              }`}
            >
              {formData.paymentOptions.length > 0 ? (
                formData.paymentOptions.map((option, index) => (
                  <span
                    key={index}
                    className="bg-[#15BA5C1A] text-[#15BA5C] text-xs px-3 py-1 rounded-full font-medium"
                  >
                    {option}
                  </span>
                ))
              ) : (
                <span className="text-sm">Select options</span>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${openDropDown ? "rotate-180" : ""}`}
            />
          </button>

          {openDropDown && userAction !== "view" && (
            <div className="absolute top-full left-0 right-0 z-[100] mt-2 bg-white border border-gray-100 rounded-xl shadow-xl p-2 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
              {paymentOptions.map((s) => {
                const isSelected = formData.paymentOptions.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => {
                        const options = prev.paymentOptions.includes(s)
                          ? prev.paymentOptions.filter((v) => v !== s)
                          : [...prev.paymentOptions, s];
                        return { ...prev, paymentOptions: options };
                      })
                    }
                    className="w-full flex justify-between items-center px-4 py-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {s}
                    </span>
                    <div
                      className={`w-5 h-5 border rounded-md flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-[#15BA5C] border-[#15BA5C] text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {formData.paymentOptions.includes("Pay in installments") && (
          <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-5">
            <p className="font-bold text-gray-900">
              Configure Installment Percentage
            </p>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Number of Splits
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  value={splitCountInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSplitCountInput(val === "" ? "" : Number(val));
                  }}
                  disabled={userAction === "view"}
                  placeholder="e.g. 2"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#15BA5C] disabled:bg-gray-100"
                />
                {userAction !== "view" && (
                  <button
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        splits: {
                          ...prev.splits,
                          count: Number(splitCountInput) || 0,
                        },
                      }))
                    }
                    className="bg-[#15BA5C] text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-[#119E4D] transition-all active:scale-95 shadow-lg shadow-green-100"
                  >
                    Apply
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {Array.from({ length: formData.splits.count }).map((_, index) => {
                const breakdown = formData.splits.breakdown[index] || {
                  percentage: "",
                  duration: "",
                  days: "",
                };

                return (
                  <div
                    key={index}
                    className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4"
                  >
                    <p className="text-xs font-bold text-[#15BA5C] uppercase">
                      Split #{index + 1}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                          Percentage (%)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={breakdown.percentage}
                          onChange={(e) => {
                            const updated = [...formData.splits.breakdown];
                            const val = e.target.value;
                            updated[index] = {
                              ...updated[index],
                              percentage: val === "" ? "" : Number(val),
                            };
                            setFormData((prev) => ({
                              ...prev,
                              splits: { ...prev.splits, breakdown: updated },
                            }));
                          }}
                          disabled={userAction === "view"}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#15BA5C1A] focus:border-[#15BA5C] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                          Duration
                        </label>
                        <select
                          value={breakdown.duration}
                          onChange={(e) => {
                            const updated = [...formData.splits.breakdown];
                            updated[index] = {
                              ...updated[index],
                              duration: e.target.value,
                              days:
                                e.target.value === "Days after delivery"
                                  ? breakdown.days || 1
                                  : 0,
                            };
                            setFormData((prev) => ({
                              ...prev,
                              splits: { ...prev.splits, breakdown: updated },
                            }));
                          }}
                          disabled={userAction === "view"}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white outline-none"
                        >
                          <option value="">Select option</option>
                          {breakdownOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {breakdown.duration === "Days after delivery" && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                          Number of Days
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={breakdown.days}
                          onChange={(e) => {
                            const updated = [...formData.splits.breakdown];
                            const val = e.target.value;
                            updated[index] = {
                              ...updated[index],
                              days: val === "" ? "" : Number(val),
                            };
                            setFormData((prev) => ({
                              ...prev,
                              splits: { ...prev.splits, breakdown: updated },
                            }));
                          }}
                          disabled={userAction === "view"}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
              {formData.splits.count > 0 && (
                <p className="text-[10px] text-gray-400 font-bold uppercase text-center">
                  NB: Split percentage MUST make up to 100%
                </p>
              )}
            </div>
          </div>
        )}

        <div className="bg-[#15BA5C0D] border border-[#15BA5C33] rounded-2xl p-5 space-y-3">
          <p className="text-[#15BA5C] font-bold text-xs uppercase tracking-widest">
            Guidelines
          </p>
          <ul className="space-y-2">
            {[
              "Instant payment: Pay immediately at checkout.",
              "Payment on Delivery: Pay when the order arrives.",
              "Installments: Spread payments over time.",
            ].map((item, index) => (
              <li
                key={index}
                className="text-[#307B32] text-sm flex items-start gap-2 font-medium"
              >
                <span className="w-1 h-1 rounded-full bg-[#15BA5C] mt-2 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-4 pt-4 pb-2">
          {userAction === "view" ? (
            <>
              <button
                onClick={handleDelete}
                className="flex-1 py-3.5 px-4 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-all active:scale-95"
              >
                Delete Term
              </button>
              <button
                onClick={() => setUserAction("edit")}
                className="flex-1 py-3.5 px-4 bg-[#15BA5C] text-white rounded-xl font-bold text-sm hover:bg-[#119E4D] transition-all active:scale-95 shadow-lg shadow-green-100"
              >
                Edit Configuration
              </button>
            </>
          ) : (
            <button
              onClick={handleSubmit}
              className="w-full py-4 bg-[#15BA5C] text-white rounded-xl font-bold text-base hover:bg-[#119E4D] transition-all active:scale-95 shadow-xl shadow-green-100"
            >
              Update Changes
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default EditPaymentTerm;
