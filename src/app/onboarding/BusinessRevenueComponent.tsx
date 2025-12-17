import { Upload, CheckCircle, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import Range from "rc-slider"; // Import the Range component
import "rc-slider/assets/index.css"; // Import default styles (we'll override with Tailwind)
import { getCurrencySymbol } from "@/utils/getCurrencySymbol";
import { useUploadImageMutation } from "@/redux/app";

interface BusinessRevenueComponentProps {
  onRevenueRangeChange?: (range: string) => void;
  onFileUpload?: (file: File) => void;
  onImageUpload?: (url: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedCurrency?: any;
}

const MIN_REVENUE = 0;
const MAX_REVENUE = 1000000;
const STEP_REVENUE = 1000;

const BusinessRevenueComponent: React.FC<BusinessRevenueComponentProps> = ({
  onRevenueRangeChange,
  onFileUpload,
  onImageUpload,
  selectedCurrency,
}) => {
  const [revenueRange, setRevenueRange] = useState<[number, number]>([
    MIN_REVENUE,
    MAX_REVENUE,
  ]);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [uploadError, setUploadError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [triggerUploadImage] = useUploadImageMutation();

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

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError("");

    try {
      if (!navigator.onLine) {
        setUploadError("You are offline. Connect to the internet to upload.");
        setUploadedFile(null);
        return;
      }

      const formData = new FormData();
      formData.append("image", file);

      const response = await triggerUploadImage(formData).unwrap();

      const url = response?.data?.url;
      if (url) {
        setUploadedImageUrl(url);
        onImageUpload?.(url);
      } else {
        throw new Error("No URL returned from upload service");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadError("Failed to upload image. Please try again.");
      setUploadedImageUrl("");
      setUploadedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    setUploadError("");
    setUploadedImageUrl("");
    setUploadedFile(null);

    const allowedTypes = ["image/jpeg", "image/png", "image/svg+xml"];

    if (!allowedTypes.includes(file.type)) {
      setUploadError("Please select a valid file type (JPG, PNG, SVG)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must be less than 5MB");
      return;
    }

    setUploadedFile(file);
    onFileUpload?.(file);

    await handleImageUpload(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    if (!isUploading) {
      setUploadError("");
      fileInputRef.current?.click();
    }
  };

  const dismissError = () => {
    setUploadError("");
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

      {/* File Upload Section - Remains unchanged */}
    </div>
  );
};

export default BusinessRevenueComponent;
