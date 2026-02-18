import { useState } from "react";
import { User, X } from "lucide-react";

type AssignPinModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const AssignPinModal = ({ isOpen, onClose }: AssignPinModalProps) => {
  const [isPinAssigned, setIsPinAssigned] = useState(false);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-2000000 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-xl bg-white rounded-[20px] shadow-xl">
        <div className="flex items-center justify-end px-6 pt-4">
          <button
            type="button"
            onClick={() => {
              setIsPinAssigned(false);
              onClose();
            }}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-8 pb-6 pt-2">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-[#15BA5C]">
              <User className="w-10 h-10 text-white" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-[20px] font-semibold text-[#111827]">
                Assign PIN to Staff Member
              </h2>
              <p className="text-sm text-[#6B7280] max-w-md">
                Easily generate and assign a secure PIN for staff access.
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">
                Select Staff
              </label>
              <div className="relative">
                <select
                  className="w-full appearance-none rounded-[10px] bg-[#FAFAFC] border border-[#D1D1D1] px-4 py-2.5 pr-10 text-sm text-[#111827] placeholder-[#A6A6A6] outline-none focus:border-[#15BA5C] focus:ring-1 focus:ring-[#15BA5C]"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Search and Select Staff
                  </option>
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#9CA3AF] text-xs">
                  ▼
                </span>
              </div>
            </div>

            {isPinAssigned && (
              <div className="mt-4 rounded-[10px] border border-[#D1D1D1] bg-[#FAFAFC] px-4 py-4 space-y-2">
                <h4 className="text-[1.125rem] font-semibold text-[#15BA5C]">
                  User PIN Assigned Successfully
                </h4>
                <p className="text-[15px] text-[#898989]">
                  The PIN has been successfully assigned. You can find the
                  assigned PIN below.
                </p>
                <div className="mt-2 space-y-1 text-sm">
                  <p className="text-[#111827]">
                    <span className="text-[#A6A6A6]">Employee: </span>
                    <span className="font-normal">Peter Norman</span>
                  </p>
                  <p className="text-[#111827]">
                    <span className="text-[#A6A6A6]">Generated Pin: </span>
                    <span className="font-semibold">3722</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col md:flex-row gap-4">
            <button
              type="button"
              onClick={() => {
                setIsPinAssigned(false);
                onClose();
              }}
              className="w-full cursor-pointer items-center justify-center rounded-[10px] px-6 py-2.5 text-sm font-medium text-[#111827] bg-[#E5E7EB] hover:bg-[#D1D5DB]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setIsPinAssigned(true)}
              className="w-full cursor-pointer items-center justify-center rounded-[10px] px-8 py-2.5 text-sm font-medium text-white bg-[#15BA5C] hover:bg-green-600"
            >
              Confirm and Assign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignPinModal;

