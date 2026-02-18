import { StoreFrontCustomizationStep } from "@/types/settings/customization";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";



interface CustomizationSidebarProps {
  activeStep: StoreFrontCustomizationStep;
  onStepChange?: (step: StoreFrontCustomizationStep) => void;
  disabled?: boolean;
  steps: { id: StoreFrontCustomizationStep; label: string }[];
}



const CustomizationSidebar = ({
  activeStep,
  onStepChange,
  disabled = false,
  steps
}: CustomizationSidebarProps) => {
  const navigate = useNavigate();

  const handleStepClick = (stepId: StoreFrontCustomizationStep) => {
    if (disabled) return;
    if (onStepChange) {
      onStepChange(stepId);
    }
  };

  return (
    <aside className="flex   flex-col gap-6 py-4">
      <button
        type="button"
        onClick={() => navigate("/dashboard/settings")}
        className="flex items-center gap-2 text-sm text-[#111827] cursor-pointer hover:text-[#15BA5C] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Settings</span>
      </button>

      <nav className="flex flex-col gap-2">
        {steps.map((step) => {
          const isActive = step.id === activeStep;

          return (
            <button
              key={step.id}
              type="button"
              disabled={disabled}
              onClick={() => handleStepClick(step.id)}
              className={`flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm ${
                isActive
                  ? "border border-[#15BA5C] bg-[#15BA5C1A]"
                  : "border border-transparent"
              } ${
                disabled
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer hover:bg-gray-50"
              }`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isActive ? "bg-[#15BA5C]" : "bg-[#D1D5DB]"
                }`}
              />
              <span className="text-[#111827]">{step.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export type {  CustomizationSidebarProps };

export default CustomizationSidebar;
