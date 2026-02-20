"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, Search, Plus, Trash2 } from "lucide-react";
import AddModal from "./AddModal";

export interface DropdownOption {
  value: string;
  label: string;
  id?: string;
  meta?: unknown;
}

interface BaseDropdownProps {
  name?: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  addNewLabel?: string;
  modalTitle?: string;
  modalPlaceholder?: string;
  modalButtonText?: string;
  modalInputLabel?: string;
  modalValidation?: (value: string) => string | null;
  loading?: boolean; // 👈 NEW
  onDeleteOption?: (
    option: DropdownOption,
    name?: string,
  ) => Promise<void> | void;
  canDeleteOption?: (option: DropdownOption) => boolean;
  onAddNewClick?: (name?: string) => void;
  searchPlaceholder?: string;
}

interface SingleSelectProps extends BaseDropdownProps {
  mode?: "select";
  options: DropdownOption[];
  selectedValue?: string;
  onChange: (value: string, name?: string) => void;
  selectedValues?: never;
  onMultiChange?: never;
  allowAddNew?: never;
  onAddNew?: never;
}

interface MultiSelectProps extends BaseDropdownProps {
  mode: "checkbox";
  options: DropdownOption[];
  selectedValues: Record<string, boolean>;
  onMultiChange: (values: Record<string, boolean>, name?: string) => void;
  selectedValue?: never;
  onChange?: never;
  allowAddNew?: never;
  onAddNew?: never;
}

interface SelectWithAddProps extends BaseDropdownProps {
  mode?: "select";
  options: DropdownOption[];
  selectedValue?: string;
  onChange?: (value: string, name?: string) => void;
  allowAddNew?: true;
  onAddNew?: (newValue: string, name?: string) => void;
  selectedValues?: never;
  onMultiChange?: never;
}

interface MultiSelectWithAddProps extends BaseDropdownProps {
  mode: "checkbox";
  options: DropdownOption[];
  selectedValues: Record<string, boolean>;
  onMultiChange: (values: Record<string, boolean>, name?: string) => void;
  allowAddNew: true;
  onAddNew: (newValue: string, name?: string) => void;
  selectedValue?: never;
  onChange?: never;
}

type DropdownProps =
  | SingleSelectProps
  | MultiSelectProps
  | SelectWithAddProps
  | MultiSelectWithAddProps;

export const Dropdown: React.FC<DropdownProps> = ({
  name,
  mode = "select",
  options,
  placeholder = "Select an option",
  label,
  required = false,
  className = "",
  allowAddNew = false,
  addNewLabel = "Add New",
  // modalTitle,
  modalPlaceholder,
  modalButtonText,
  modalInputLabel,
  modalValidation,
  loading,
  onDeleteOption,
  canDeleteOption,
  onAddNewClick,
  searchPlaceholder = "Search...",
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingOptions, setDeletingOptions] = useState<
    Record<string, boolean>
  >({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const selectedValue = mode === "select" ? props.selectedValue : undefined;
  const onChange = mode === "select" ? props.onChange : undefined;
  const onAddNew = allowAddNew ? props.onAddNew : undefined;

  const selectedValues = mode === "checkbox" ? props.selectedValues : undefined;
  const onMultiChange = mode === "checkbox" ? props.onMultiChange : undefined;

  const selectedOption =
    mode === "select"
      ? options.find((option) => option.value === selectedValue)
      : undefined;

  const updateMenuPosition = () => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    updateMenuPosition();
    if (isOpen) {
      window.addEventListener("scroll", updateMenuPosition, true);
      window.addEventListener("resize", updateMenuPosition);
    }
    return () => {
      window.removeEventListener("scroll", updateMenuPosition, true);
      window.removeEventListener("resize", updateMenuPosition);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleSingleSelect = (value: string) => {
    if (mode === "select" && onChange) {
      onChange(value, name);
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  const handleMultiSelect = (value: string) => {
    if (mode === "checkbox" && selectedValues && onMultiChange) {
      const newValues = {
        ...selectedValues,
        [value]: !selectedValues[value],
      };
      onMultiChange(newValues, name);
    }
  };

  const handleAddNewItem = (newValue: string) => {
    if (onAddNew) {
      onAddNew(newValue, name);
      if (mode === "select" && onChange) {
        onChange(newValue, name);
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
          (key) => selectedValues?.[key],
        );
        const selectedOpt = options.find((opt) => opt.value === selectedKey);
        return selectedOpt?.label || placeholder;
      }
      return `${selectedCount} items selected`;
    }
  };

  const filteredOptions = options.filter((option) =>
    option?.label?.toLowerCase()?.includes(searchTerm?.toLowerCase()),
  );

  // const defaultModalTitle = modalTitle || `Add New ${label || "Item"}`;
  const defaultModalPlaceholder =
    modalPlaceholder || `Enter ${label?.toLowerCase() || "item"} name`;
  const defaultModalButtonText = modalButtonText || addNewLabel;
  const defaultModalInputLabel = modalInputLabel || label;

  return (
    <>
      {/* Modal backdrop overlay */}
      {showAddModal && !onAddNewClick && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[998]"
          onClick={() => setShowAddModal(false)}
        />
      )}

      <div className={`relative ${className}`} ref={dropdownRef}>
        {label && (
          <label className="block font-medium mb-1.5">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}

        <div className="flex items-center gap-2">
          {/* Dropdown Button */}
          <div className="relative w-full border border-[#E6E6E6] rounded-lg bg-[#FAFAFC] flex items-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(!isOpen);
                setShowAddModal(false);
              }}
              className="flex-1 pl-2 pr-10 py-3 text-left cursor-pointer focus:outline-none rounded-lg"
            >
              <span className="block truncate text-gray-900 flex items-center gap-2">
                {loading ? (
                  <svg
                    className="animate-spin h-5 w-5 text-emerald-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                ) : (
                  getDisplayText()
                )}
              </span>
            </button>

            {/* Icons container */}
            <div className="absolute inset-y-0 right-0 flex items-center gap-2">
              {allowAddNew && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    if (onAddNewClick) {
                      onAddNewClick(name);
                      return;
                    }
                    setShowAddModal(true);
                  }}
                  className="p-3.5 bg-[#E6E6E6] hover:bg-gray-300 rounded transition-colors"
                  aria-label={addNewLabel || "Add new option"}
                  title={addNewLabel || "Add new option"}
                >
                  <Plus className="w-5 h-5 text-gray-600" />
                </button>
              )}
              {/* <ChevronDown
              className={`h-5 w-5 text-gray-400 transition-transform duration-200 pointer-events-none ${
                isOpen ? "rotate-180" : ""
              }`}
            /> */}
            </div>
          </div>
        </div>

        {/* Dropdown Menu */}
        {isOpen &&
          menuPosition &&
          createPortal(
            <div
              ref={menuRef}
              className="dropdown-portal absolute z-[9999] bg-black shadow-lg rounded-lg border border-gray-200 py-2 max-h-60 overflow-auto"
              style={{
                top: menuPosition.top,
                left: menuPosition.left,
                width: menuPosition.width,
              }}
            >
              <div className="px-3 py-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white pointer-events-none" />
                  <input
                    type="text"
                    className="pl-9 pr-3 py-2 w-full rounded-lg border border-gray-200 bg-black text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  No options found
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto">
                  {filteredOptions.map((option) => {
                    const isSelected =
                      mode === "select"
                        ? selectedValue === option.value
                        : selectedValues?.[option.value] || false;
                    const optionKey = option.id || option.value;
                    const isDeleting = deletingOptions[optionKey];
                    const showDeleteIcon =
                      typeof onDeleteOption === "function" &&
                      (typeof canDeleteOption === "function"
                        ? canDeleteOption(option)
                        : true);

                    return (
                      <div
                        key={option.value}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          if (mode === "select") {
                            handleSingleSelect(option.value);
                          } else {
                            handleMultiSelect(option.value);
                          }
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            if (mode === "select") {
                              handleSingleSelect(option.value);
                            } else {
                              handleMultiSelect(option.value);
                            }
                          }
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-white hover:text-black transition-colors flex items-center gap-2 ${
                          isSelected && mode === "select"
                            ? "text-black bg-emerald-50"
                            : "text-white"
                        }`}
                      >
                        {mode === "checkbox" && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="mr-3 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          />
                        )}

                        <span className="block truncate flex-1">
                          {option.label}
                        </span>

                        {showDeleteIcon && (
                          <span
                            onClick={async (event) => {
                              event.stopPropagation();
                              event.preventDefault();
                              if (!onDeleteOption || isDeleting) {
                                return;
                              }
                              setDeletingOptions((prev) => ({
                                ...prev,
                                [optionKey]: true,
                              }));
                              try {
                                await onDeleteOption(option, name);
                              } finally {
                                setDeletingOptions((prev) => {
                                  const updated = { ...prev };
                                  delete updated[optionKey];
                                  return updated;
                                });
                              }
                            }}
                            className="ml-2 flex items-center justify-center rounded-full p-1 hover:bg-red-500/20 focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            {isDeleting ? (
                              <svg
                                className="animate-spin h-4 w-4 text-red-400"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                ></path>
                              </svg>
                            ) : (
                              <Trash2 className="h-4 w-4 text-red-400" />
                            )}
                          </span>
                        )}

                        {mode === "select" && isSelected && (
                          <Check className="h-4 w-4 text-emerald-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>,
            document.body,
          )}

        {/* Add Modal */}
        {allowAddNew && showAddModal && !onAddNewClick && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-lg shadow-2xl p-6 z-[999] w-full max-w-md">
            <AddModal
              isOpen={showAddModal}
              onClose={() => setShowAddModal(false)}
              onAdd={handleAddNewItem}
              title=""
              placeholder={defaultModalPlaceholder}
              buttonText={defaultModalButtonText}
              inputLabel={defaultModalInputLabel}
              validation={modalValidation}
            />
          </div>
        )}
      </div>
    </>
  );
};
