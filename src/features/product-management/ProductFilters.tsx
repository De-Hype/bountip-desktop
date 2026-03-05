import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import useBusinessStore from "@/stores/useBusinessStore";
import { getCurrencySymbol } from "@/utils/getCurrencySymbol";

interface ProductFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  minPrice: number;
  maxPrice: number;
  categories: string[];
}

export interface FilterState {
  priceRange: [number, number];
  category: string;
  availability: string;
}

const ProductFilters = ({
  isOpen,
  onClose,
  onApply,
  minPrice,
  maxPrice,
  categories,
}: ProductFiltersProps) => {
  const { selectedOutlet } = useBusinessStore();
  const [priceRange, setPriceRange] = useState<[number, number]>([
    minPrice,
    maxPrice,
  ]);
  const [category, setCategory] = useState("All Categories");
  const [availability, setAvailability] = useState("All");

  useEffect(() => {
    setPriceRange([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);

  if (!isOpen) return null;

  const currencySymbol = selectedOutlet?.currency
    ? getCurrencySymbol(selectedOutlet.currency)
    : "";

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: selectedOutlet?.currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(value)
      .replace(/[A-Z]{3}/, currencySymbol);
  };

  const handleApply = () => {
    onApply({
      priceRange,
      category,
      availability,
    });
    onClose();
  };

  const handleResetPrice = () => setPriceRange([minPrice, maxPrice]);
  const handleResetCategory = () => setCategory("All Categories");
  const handleResetAvailability = () => setAvailability("All");

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20">
      <div className="h-full w-[400px] bg-white p-6 shadow-xl animate-in slide-in-from-right duration-300">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1C1B20]">Filters</h2>
          <button
            onClick={onClose}
            className="rounded-full cursor-pointer p-2 hover:bg-gray-100"
            title="Close"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-col gap-8">
          {/* Price Filter */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#1C1B20]">Price</span>
              <button
                onClick={handleResetPrice}
                className="text-sm font-medium text-[#15BA5C]"
              >
                Reset
              </button>
            </div>
            <div className="px-2">
              <Slider
                range
                min={minPrice}
                max={maxPrice}
                value={priceRange}
                onChange={(value) => setPriceRange(value as [number, number])}
                trackStyle={[{ backgroundColor: "#15BA5C", height: 6 }]}
                handleStyle={[
                  {
                    borderColor: "#15BA5C",
                    backgroundColor: "#15BA5C",
                    opacity: 1,
                    height: 16,
                    width: 16,
                    marginTop: -5,
                  },
                  {
                    borderColor: "#15BA5C",
                    backgroundColor: "#15BA5C",
                    opacity: 1,
                    height: 16,
                    width: 16,
                    marginTop: -5,
                  },
                ]}
                railStyle={{ backgroundColor: "#E5E7EB", height: 6 }}
              />
            </div>
            <div className="flex items-center justify-between text-sm font-medium text-[#4B5563]">
              <span>{formatCurrency(priceRange[0])}</span>
              <span>{formatCurrency(priceRange[1])}</span>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#1C1B20]">Category</span>
              <button
                onClick={handleResetCategory}
                className="text-sm font-medium text-[#15BA5C]"
              >
                Reset
              </button>
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full appearance-none rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#1C1B20] outline-none focus:border-[#15BA5C] focus:ring-1 focus:ring-[#15BA5C]"
            >
              <option value="All Categories">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#1C1B20]">Availability</span>
              <button
                onClick={handleResetAvailability}
                className="text-sm font-medium text-[#15BA5C]"
              >
                Reset
              </button>
            </div>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="w-full appearance-none rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#1C1B20] outline-none focus:border-[#15BA5C] focus:ring-1 focus:ring-[#15BA5C]"
            >
              <option value="All">All</option>
              <option value="Available">Available</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </div>
        </div>

        <div className="mt-auto pt-8">
          <button
            onClick={handleApply}
            className="w-full cursor-pointer rounded-lg bg-[#15BA5C] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#119E4D]"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;
