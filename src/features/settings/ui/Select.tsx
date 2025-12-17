import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  dropdownClassName?: string;
  optionClassName?: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

const Select: React.FC<SelectProps> = ({
  options,
  value,
  defaultValue,
  placeholder = "Select an option",
  disabled = false,
  className = "",
  dropdownClassName = "",
  optionClassName = "",
  onChange,
  onFocus,
  onBlur,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || defaultValue || "");
  const selectRef = useRef<HTMLDivElement>(null);

  // Update selectedValue when value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onBlur?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onBlur]);

  const handleToggle = () => {
    if (disabled) return;
    
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    
    if (newIsOpen) {
      onFocus?.();
    } else {
      onBlur?.();
    }
  };

  const handleOptionClick = (optionValue: string) => {
    if (disabled) return;
    
    setSelectedValue(optionValue);
    setIsOpen(false);
    onChange?.(optionValue);
    onBlur?.();
  };

  const selectedOption = options.find(option => option.value === selectedValue);

  return (
    <div ref={selectRef} className={`relative inline-block w-full ${className}`}>
      {/* Select Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm
          focus:outline-none focus:ring-2 ring-white
          ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
          flex items-center justify-between
        `}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={`
          absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg
          max-h-60 overflow-auto
          ${dropdownClassName}
        `}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleOptionClick(option.value)}
              disabled={option.disabled}
              className={`
                w-full px-3 py-2 text-left text-sm
                ${option.disabled 
                  ? 'text-gray-400 cursor-not-allowed bg-gray-50' 
                  : 'text-gray-900 hover:bg-gray-100 cursor-pointer'
                }
                ${selectedValue === option.value ? 'bg-blue-50 text-blue-900' : ''}
                first:rounded-t-md last:rounded-b-md
                ${optionClassName}
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Select;