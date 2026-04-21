import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type ReportDropdownOption = { label: string; value: string };

const ReportDropdown = ({
  value,
  onChange,
  options,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: ReportDropdownOption[];
  placeholder: string;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedLabel =
    options.find((o) => o.value === value)?.label || placeholder;

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (!isOpen) return;
      if (!rootRef.current) return;
      if (rootRef.current.contains(e.target as Node)) return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [isOpen]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full h-[48px] rounded-[10px] border border-[#E5E7EB] bg-white overflow-hidden flex items-stretch"
      >
        <div className="flex-1 px-4 flex items-center justify-between">
          <span className="text-[14px] font-medium text-[#111827] truncate">
            {selectedLabel}
          </span>
        </div>
        <div className="w-[48px] bg-[#15BA5C] flex items-center justify-center">
          <ChevronDown
            className={`size-5 text-white transition-transform duration-200 ease-out ${isOpen ? "rotate-180" : "rotate-0"}`}
          />{" "}
        </div>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-3 w-[350px] max-w-[calc(100vw-24px)] bg-[#111114] rounded-[18px] shadow-2xl overflow-hidden z-200">
          <div className="px-3 pt-7 pb-3 flex items-center justify-between">
            {/* <h3 className="text-[16px] font-medium text-white">
              {selectedLabel}
            </h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="h-10 w-10 rounded-[12px] border border-[#15BA5C] flex items-center justify-center cursor-pointer"
            >
              <Check className="size-3.5 text-[#15BA5C]" />
            </button> */}
          </div>

          <div className="px-3 pb-5  space-y-7">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between cursor-pointer"
                >
                  <span className="text-[16px] text-white/80 font-normal">
                    {opt.label}
                  </span>
                  <span
                    className={`h-7 w-7 rounded-[12px] border flex items-center justify-center ${
                      isSelected
                        ? "border-[#15BA5C] bg-[#15BA5C]/15"
                        : "border-white/40"
                    }`}
                  >
                    {isSelected ? (
                      <Check className="size-3.5 text-[#15BA5C]" />
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportDropdown;
