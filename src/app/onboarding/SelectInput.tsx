import React from "react";
import Select from "react-select";
import { cva, type VariantProps } from "class-variance-authority";

const selectVariants = cva(
  "flex h-[50px] items-center w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-input",
        focused: "border-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface CustomSelectProps extends VariantProps<typeof selectVariants> {
  options: any;
  onChange: (option: any) => void;
  value: { value: string; label: string } | null;
  placeholder: string;
  Icon?: React.ElementType;
  className?: string;
  label: string;
}

const CustomSelect = React.forwardRef<HTMLDivElement, CustomSelectProps>(
  (
    { options, onChange, value, placeholder, Icon, className, label, ...props },
    ref
  ) => {
    const customStyles = {
      control: (provided: any) => ({
        ...provided,
        borderRadius: "0.375rem",
        border: "none",
        boxShadow: "none",
        "&:hover": {
          border: "none",
        },
      }),

      option: (provided: any, state: any) => ({
        ...provided,
        backgroundColor: state.isSelected ? "#15BA5C" : "white",
        color: state.isSelected ? "#fff" : "#141414",
        "&:active": {
          backgroundColor: "#15BA5C",
          color: "white",
        },
      }),
    };

    return (
      <div ref={ref}>
        {label && (
          <label className="mb-1 block text-sm font-medium text-[#1f1f1f]">
            {label}
          </label>
        )}
        <div className={selectVariants({ className })}>
          <Select
            options={options}
            styles={customStyles}
            onChange={onChange}
            menuPlacement="bottom"
            value={value}
            placeholder={placeholder}
            components={{ IndicatorSeparator: null }}
            className="w-full"
            {...props}
          />
        </div>
      </div>
    );
  }
);

CustomSelect.displayName = "CustomSelect";

export { CustomSelect, selectVariants };
