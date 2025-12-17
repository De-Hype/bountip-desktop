"use client";
import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Eye, EyeOff } from "lucide-react";

type PinInputProps = {
  onSubmitPin?: () => void;
  onPinChange?: (pin: string) => void;
  showToggleVisibility?: boolean;
};

const PinInput = ({
  onSubmitPin,
  onPinChange,
  showToggleVisibility = false,
}: PinInputProps) => {
  const [localPin, setLocalPin] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const setPin = useAuthStore((s) => s.setPin);

  const handleClick = (value: string) => {
    if (localPin.length < 4) {
      const updated = [...localPin, value];
      const pinStr = updated.join("");
      setLocalPin(updated);
      setPin(pinStr);
      onPinChange?.(pinStr);

      if (updated.length === 4) {
        onSubmitPin?.();
      }
    }
  };

  const handleDelete = () => {
    const updated = localPin.slice(0, -1);
    const pinStr = updated.join("");
    setLocalPin(updated);
    setPin(pinStr);
    onPinChange?.(pinStr);
  };

  return (
    <div className="mt-10">
      <div className="flex justify-center space-x-2 mb-6 items-center relative">
        {isVisible ? (
          <div className="">
            <h3 className="text-center mb-4 text-gray-700 text-lg ">
              {localPin.join("") || "••••"}
            </h3>
          </div>
        ) : (
          [0, 1, 2, 3].map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i < localPin.length ? "bg-gray-800" : "bg-gray-300"
              }`}
            />
          ))
        )}

        {showToggleVisibility && (
          <button
            type="button"
            onClick={() => setIsVisible(!isVisible)}
            className={`ml-4 text-gray-600 hover:text-gray-800 absolute right-0 top-0 ${
              isVisible ? "" : "bottom-1.5"
            } `}
          >
            {isVisible ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mx-auto">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"].map(
          (btn, idx) => (
            <button
              key={idx}
              type="button"
              className="bg-gray-100 hover:bg-gray-200 text-lg p-4 rounded-lg shadow"
              onClick={() =>
                btn === "del" ? handleDelete() : handleClick(btn)
              }
            >
              {btn === "del" ? "⌫" : btn}
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default PinInput;
