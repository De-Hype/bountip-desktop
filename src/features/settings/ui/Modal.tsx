import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import Image, { StaticImageData } from "next/image";
import getWidthClass from "@/utils/getWidthClass";

interface ModalProps {
  image?: StaticImageData;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full" | number; // Added size prop
}

export const Modal: React.FC<ModalProps> = ({
  image,
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = "sm", // Default size
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      const timeout = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timeout);
    }

    return () => {
      document.body.style.overflow = ""; // cleanup on unmount
    };
  }, [isOpen]);

  // Function to get width based on size prop
 

  if (!isOpen && !isVisible) return null;
  if (!image) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex justify-end z-50 transition-opacity duration-300 ease-in-out">
      <div
        className={`bg-white shadow-xl rounded-l-lg ${getWidthClass(size)} h-full overflow-hidden transform transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
        `}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex gap-4 items-center">
            <div className="p-2.5 rounded-full border border-[#15BA5C] bg-white">
              <Image
                src={image}
                alt="Modal Icon"
                className="object-contain h-[20px] w-[20px]"
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-500">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(100vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
};