import React, { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { getPhoneCountries, PhoneCountry } from "@/utils/getPhoneCountries";
import { CachedImg } from "@/shared/CachedImg";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  selectedCountry?: PhoneCountry;
  onCountryChange?: (country: PhoneCountry) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const PhoneInput = ({
  value,
  onChange,
  selectedCountry: propSelectedCountry,
  onCountryChange,
  placeholder = "Enter phone number",
  className = "",
  disabled = false,
}: PhoneInputProps) => {
  const phoneCountries = useMemo(() => getPhoneCountries(), []);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const selectedCountry = propSelectedCountry || phoneCountries[0];

  const filteredCountries = useMemo(() => {
    if (!searchTerm) return phoneCountries;
    const lowerSearch = searchTerm.toLowerCase();
    return phoneCountries.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerSearch) ||
        c.dialCode.includes(lowerSearch) ||
        c.isoCode.toLowerCase().includes(lowerSearch),
    );
  }, [phoneCountries, searchTerm]);

  const handleCountrySelect = (country: PhoneCountry) => {
    if (onCountryChange) {
      onCountryChange(country);
    }
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className={`flex relative ${className}`}>
      {/* Country Selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            if (disabled) return;
            setIsOpen(!isOpen);
          }}
          disabled={disabled}
          className={`flex items-center h-full px-3 py-3 bg-white border border-gray-200 border-r-0 rounded-l-xl transition-colors focus:outline-none ${
            disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50"
          }`}
        >
          {selectedCountry && (
            <>
              <CachedImg
                src={selectedCountry.flag}
                alt={selectedCountry.name + " flag"}
                className="w-6 h-4 mr-2 rounded-sm border border-gray-100 object-cover"
                width={24}
                height={18}
              />
              <span className="text-gray-900 mr-1 text-sm font-medium">
                {selectedCountry.dialCode}
              </span>
            </>
          )}
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>

        {isOpen && !disabled && (
          <div className="absolute z-50 left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search country..."
                className="w-full px-3 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#15BA5C]"
                autoFocus
              />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filteredCountries.map((country) => (
                <button
                  key={country.isoCode}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className="w-full flex items-center px-4 py-2 hover:bg-gray-50 transition-colors text-left"
                >
                  <CachedImg
                    src={country.flag}
                    alt={country.name + " flag"}
                    className="w-5 h-3 mr-3 rounded-sm object-cover"
                    width={20}
                    height={12}
                  />
                  <span className="flex-1 text-sm text-gray-700 truncate">
                    {country.name}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">
                    {country.dialCode}
                  </span>
                </button>
              ))}
              {filteredCountries.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-400">
                  No countries found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Phone Input */}
      <input
        type="text"
        value={value}
        onChange={(e) => {
          const val = e.target.value;
          // Only allow numbers, spaces, and common phone symbols
          if (/^[\d\s+\-()]*$/.test(val)) {
            onChange(val);
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        className={`flex-1 px-4 py-3 border border-gray-200 rounded-r-xl outline-none transition-all text-sm ${
          disabled
            ? "opacity-60 cursor-not-allowed"
            : "focus:ring-1 focus:ring-[#15BA5C] focus:border-transparent"
        }`}
      />
    </div>
  );
};
