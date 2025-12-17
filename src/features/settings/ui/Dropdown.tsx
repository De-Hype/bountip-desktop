import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search, Plus, X } from "lucide-react";

interface DropdownOption {
  value: string;
  label: string;
}

interface SingleSelectProps {
  mode?: "select";
  options: DropdownOption[];
  selectedValue?: string;
  onChange: (value: string) => void;
  selectedValues?: never;
  onMultiChange?: never;
  allowAddNew?: never;
  onAddNew?: never;
}

interface MultiSelectProps {
  mode: "checkbox";
  options: DropdownOption[];
  selectedValues: Record<string, boolean>;
  onMultiChange: (values: Record<string, boolean>) => void;
  selectedValue?: never;
  onChange?: never;
  allowAddNew?: never;
  onAddNew?: never;
}

interface SelectWithAddProps {
  mode?: "select";
  options: DropdownOption[];
  selectedValue?: string;
  onChange: (value: string) => void;
  allowAddNew: true;
  onAddNew: (newValue: string) => void;
  selectedValues?: never;
  onMultiChange?: never;
}

interface MultiSelectWithAddProps {
  mode: "checkbox";
  options: DropdownOption[];
  selectedValues: Record<string, boolean>;
  onMultiChange: (values: Record<string, boolean>) => void;
  allowAddNew: true;
  onAddNew: (newValue: string) => void;
  selectedValue?: never;
  onChange?: never;
}

type DropdownProps = (SingleSelectProps | MultiSelectProps | SelectWithAddProps | MultiSelectWithAddProps) & {
  placeholder?: string;
  label?: string;
  className?: string;
  addNewLabel?: string;
};

export const Dropdown: React.FC<DropdownProps> = ({
  mode = "select",
  options,
  placeholder = "Select an option",
  label,
  className = "",
  allowAddNew = false,
  addNewLabel = "Add New",
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemValue, setNewItemValue] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle single select props
  const selectedValue = mode === "select" ? props.selectedValue : undefined;
  const onChange = mode === "select" ? props.onChange : undefined;
  const onAddNew = allowAddNew ? props.onAddNew : undefined;
  
  // Handle multi select props
  const selectedValues = mode === "checkbox" ? props.selectedValues : undefined;
  const onMultiChange = mode === "checkbox" ? props.onMultiChange : undefined;

  const selectedOption = mode === "select" 
    ? options.find(option => option.value === selectedValue)
    : undefined;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
        setIsAddingNew(false);
        setNewItemValue("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSingleSelect = (value: string) => {
    if (mode === "select" && onChange) {
      onChange(value);
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  const handleMultiSelect = (value: string) => {
    if (mode === "checkbox" && selectedValues && onMultiChange) {
      const newValues = {
        ...selectedValues,
        [value]: !selectedValues[value]
      };
      onMultiChange(newValues);
    }
  };

  const handleAddNew = () => {
    if (newItemValue.trim() && onAddNew) {
      onAddNew(newItemValue.trim());
      setNewItemValue("");
      setIsAddingNew(false);
      if (mode === "select") {
        setIsOpen(false);
      }
      setSearchTerm("");
    }
  };

  const getDisplayText = () => {
    if (mode === "select") {
      return selectedOption ? selectedOption.label : placeholder;
    } else {
      const selectedCount = selectedValues 
        ? Object.values(selectedValues).filter(Boolean).length 
        : 0;
      if (selectedCount === 0) return placeholder;
      if (selectedCount === 1) {
        const selectedKey = Object.keys(selectedValues || {}).find(
          key => selectedValues?.[key]
        );
        const selectedOpt = options.find(opt => opt.value === selectedKey);
        return selectedOpt?.label || placeholder;
      }
      return `${selectedCount} items selected`;
    }
  };

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full border-2 border-[#E6E6E6] rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer sm:text-sm transition-colors"
      >
        <span className="block truncate text-gray-900">
          {getDisplayText()}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>

      {isOpen && (
        <div className="absolute border border-[#E6E6E6] mb-6 z-10 mt-1 w-full bg-[#FAFAFC] shadow-lg rounded-md py-1 text-base focus:outline-none sm:text-sm">
          {label && (
            <p className="px-3 py-2.5 text-[#1C1B20] font-medium">{label}</p>
          )}
          
          <div className="relative px-3 py-2">
            <Search className="absolute left-4 top-4 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              className="pl-9 pr-2 py-1.5 w-full rounded text-sm bg-white outline-none border border-[#E6E6E6]"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filteredOptions.length === 0 && !allowAddNew ? (
            <div className="px-3 py-2 text-sm text-gray-500">No options found</div>
          ) : (
            <>
              {filteredOptions.map((option) => {
                const isSelected = mode === "select" 
                  ? selectedValue === option.value
                  : selectedValues?.[option.value] || false;

                return (
                  <div
                    key={option.value}
                    onClick={() => {
                      if (mode === "select") {
                        handleSingleSelect(option.value);
                      } else {
                        handleMultiSelect(option.value);
                      }
                    }}
                    className={`w-full text-left relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors flex items-center ${
                      isSelected && mode === "select"
                        ? "text-[#15BA5C]"
                        : "text-gray-900"
                    }`}
                  >
                    {mode === "checkbox" && (
                      <div className="mr-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="w-4 h-4 text-[#15BA5C] border-2 border-[#E6E6E6] rounded focus:ring-[#15BA5C] focus:ring-2"
                          style={{
                            accentColor: isSelected ? '#15BA5C' : undefined
                          }}
                        />
                      </div>
                    )}
                    
                    <span className="block truncate flex-1">{option.label}</span>
                    
                    {mode === "select" && isSelected && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                );
              })}

              {allowAddNew && (
                <>
                  {!isAddingNew ? (
                    <button
                      type="button"
                      onClick={() => setIsAddingNew(true)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center text-[#15BA5C] font-medium"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {addNewLabel}
                    </button>
                  ) : (
                    <div className="px-3 py-2 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={newItemValue}
                          onChange={(e) => setNewItemValue(e.target.value)}
                          placeholder="Enter name"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#15BA5C]"
                          autoFocus
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddNew();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddNew}
                          className="p-2 bg-[#15BA5C] text-white rounded-md hover:bg-[#13A652] transition-colors"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingNew(false);
                            setNewItemValue("");
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};