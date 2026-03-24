import { X, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import useToastStore from "@/stores/toastStore";

interface SystemDefaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newValue: string) => Promise<void>;
  title: string;
  inputLabel: string;
  placeholder: string;
  buttonText: string;
}

const SystemDefaultModal: React.FC<SystemDefaultModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  title,
  inputLabel,
  placeholder,
  buttonText,
}) => {
  const [value, setValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const { showToast } = useToastStore();

  useEffect(() => {
    if (!isOpen) {
      setValue("");
      setIsAdding(false); // Reset loading state on close
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAdd = async () => {
    if (value.trim() && !isAdding) {
      setIsAdding(true);
      try {
        await onAdd(value.trim());
        showToast("success", "Success", `${title} added successfully`);
        onClose(); // Close on success
      } catch (error) {
        console.error("Failed to add new value", error);
        showToast("error", "Error", `Failed to add ${title.toLowerCase()}`);
        // On error, modal remains open for user to see the value and retry.
      } finally {
        setIsAdding(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md m-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#1C1B20]">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="size-6 text-[#737373]" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#1C1B20]">
              {inputLabel} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full h-12 px-4 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#15BA5C] transition-all"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={isAdding || !value.trim()}
            className="w-full h-12 bg-[#15BA5C] text-white rounded-xl font-bold text-base hover:bg-[#13A652] transition-colors flex items-center justify-center disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isAdding ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              buttonText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemDefaultModal;
