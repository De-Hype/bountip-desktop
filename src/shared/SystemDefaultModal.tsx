import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface SystemDefaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newValue: string) => void;
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

  useEffect(() => {
    if (!isOpen) {
      setValue("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAdd = () => {
    if (value.trim()) {
      onAdd(value.trim());
      setValue("");
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
            className="w-full h-12 bg-[#15BA5C] text-white rounded-xl font-bold text-base hover:bg-[#13A652] transition-colors"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemDefaultModal;
