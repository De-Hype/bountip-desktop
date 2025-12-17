import { BadgeCheck, X } from "lucide-react";
import { useEffect, useState } from "react";

type ToastType = "success" | "error" | "warning";

type ToastProps = {
  heading?: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
  type?: ToastType;
};

const Toast = ({
  heading = "Notification",
  description = "Action completed",
  isOpen,
  onClose,
  duration = 5000,
  type = "success",
}: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTimeout(() => setIsAnimating(true), 10);

      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, duration]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  if (!isVisible) return null;

  // Configuration based on type
  const config = {
    success: {
      bgColor: "bg-[#F9FFFD]",
      borderColor: "border-[#15BA5C]",
      textColor: "text-[#15BA5C]",
      icon: <BadgeCheck className="text-[#15BA5C] mt-0.5 w-5 h-5 shrink-0" />,
    },
    error: {
      bgColor: "bg-[#FFF9F9]",
      borderColor: "border-red-500",
      textColor: "text-red-600",
      icon: (
        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center mt-0.5 shrink-0">
          <span className="text-white text-xs font-bold">!</span>
        </div>
      ),
    },
    warning: {
      bgColor: "bg-[#FFFBF5]",
      borderColor: "border-orange-500",
      textColor: "text-orange-600",
      icon: (
        <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center mt-0.5 flex-shrink-0">
          <span className="text-white text-xs font-bold">!</span>
        </div>
      ),
    },
  };

  const currentConfig = config[type];

  return (
    <div className="fixed top-7 right-4 z-50 pointer-events-none">
      <div
        className={`
          ${currentConfig.bgColor} border-l-[5px] ${
          currentConfig.borderColor
        } rounded-md shadow-md px-4 py-3 min-w-[340px] max-w-md
          pointer-events-auto flex items-start justify-between transition-all transform duration-300 ease-out
          ${
            isAnimating
              ? "translate-x-0 opacity-100 scale-100"
              : "translate-x-full opacity-0 scale-95"
          }
        `}
      >
        <div className="flex items-start gap-3 flex-1">
          {currentConfig.icon}
          <div>
            <h3
              className={`text-sm font-semibold ${currentConfig.textColor} mb-1`}
            >
              {heading}
            </h3>
            <p className="text-sm text-gray-600 leading-snug">{description}</p>
          </div>
        </div>
        <button
          title="Close button"
          onClick={handleClose}
          className="text-gray-500 hover:text-gray-700 transition-colors ml-2"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
