import { useState } from "react";
import Range from "rc-slider"; // Import the Range component
import "rc-slider/assets/index.css"; // Import default styles (we'll override with Tailwind)
import { getCurrencySymbol } from "@/utils/getCurrencySymbol";

interface BusinessRevenueComponentProps {
  onRevenueRangeChange?: (range: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedCurrency?: any;
}

const MIN_REVENUE = 0;
const MAX_REVENUE = 1000000;
const STEP_REVENUE = 1000;

const BusinessRevenueComponent: React.FC<BusinessRevenueComponentProps> = ({
  onRevenueRangeChange,
  selectedCurrency,
}) => {
  const [revenueRange, setRevenueRange] = useState<[number, number]>([
    MIN_REVENUE,
    MAX_REVENUE,
  ]);

  const formatCurrency = (value: number): string => {
    const currencyCode = selectedCurrency?.code || "USD";
    const symbol = getCurrencySymbol(currencyCode);

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(value)
      .replace(/[A-Z]{3}/, symbol);
  };

  const handleRevenueRangeChange = (values: number | number[]) => {
    // rc-slider returns number[] for Range, number for Slider.
    // We expect number[] here for the Range component.
    if (Array.isArray(values)) {
      setRevenueRange([values[0], values[1]]);
      const rangeString = `${values[0]}-${values[1]}`;
      onRevenueRangeChange?.(rangeString);
    }
  };

  return (
    <div className="w-full bg-white">
      {/* Revenue Range Section */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Business Revenue Range
        </h3>

        <div className="flex justify-between items-center mb-4 text-emerald-600 font-semibold text-lg">
          <span>{formatCurrency(revenueRange[0])}</span>
          <span>{formatCurrency(revenueRange[1])}</span>
        </div>

        <div className="relative h-10 flex items-center px-2">
          <Range
            range={true} // Explicitly enable range mode for two handles
            min={MIN_REVENUE}
            max={MAX_REVENUE}
            step={STEP_REVENUE}
            value={revenueRange}
            onChange={handleRevenueRangeChange}
            trackStyle={[{ backgroundColor: "#10b981", height: "8px" }]} // Style the track (between handles)
            handleStyle={[
              {
                backgroundColor: "#10b981",
                borderColor: "#ffffff",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                width: "20px",
                height: "20px",
                marginTop: "-6px",
              },
              {
                backgroundColor: "#10b981",
                borderColor: "#ffffff",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                width: "20px",
                height: "20px",
                marginTop: "-6px",
              },
            ]} // Style both handles
            railStyle={{ backgroundColor: "#e5e7eb", height: "8px" }} // Style the rail (total track)
            className="w-full" // Apply basic width. rc-slider handles actual sizing.
          />
        </div>

        <div className="flex justify-between text-sm text-gray-500 mt-1">
          <span>{formatCurrency(MIN_REVENUE)}</span>
          <span>{formatCurrency(MAX_REVENUE)}</span>
        </div>
      </div>
    </div>
  );
};

export default BusinessRevenueComponent;
