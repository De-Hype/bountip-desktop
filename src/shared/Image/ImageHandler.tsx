import React, { useRef, useState } from "react";
import { Upload, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useUploadImageMutation } from "@/redux/app";

interface ImageUploaderProps {
  value?: string | null;
  onChange?: (imageData: { url: string }) => void;
  onError?: (error: string) => void;
  acceptedFormats?: string[];
  label?: string;
  disabled?: boolean;
  className?: string;
  showFileName?: boolean;
  previewSize?: "sm" | "md" | "lg";
}

const ImageHandler: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  onError,
  acceptedFormats = ["image/jpeg", "image/png", "image/jpg", "image/svg+xml"],
  label = "Upload Image",
  disabled = false,
  className = "",
  showFileName = false,
  previewSize = "md",
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadImage] = useUploadImageMutation();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!acceptedFormats.includes(file.type)) {
      onError?.(`Invalid file type. Accepted: ${acceptedFormats.join(", ")}`);
      return;
    }

    try {
      setUploading(true);
      setFileName(file.name);

      if (!navigator.onLine) {
        onError?.("You are offline. Connect to upload the image.");
        return;
      }

      const formData = new FormData();
      formData.append("image", file);
      const res = await uploadImage(formData).unwrap();
      const imageUrl = res?.data?.url ?? null;

      if (!imageUrl) throw new Error("No image URL returned from server");

      setPreview(imageUrl);
      onChange?.({ url: imageUrl });
    } catch (err) {
      console.error(err);
      onError?.(
        err instanceof Error ? err.message : "Image upload failed, try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    onChange?.({ url: "" });
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) fileInputRef.current.click();
  };

  const sizeMap = {
    sm: { w: 96, h: 96, cls: "w-24 h-24" },
    md: { w: 128, h: 128, cls: "w-32 h-32" },
    lg: { w: 192, h: 192, cls: "w-48 h-48" },
  } as const;

  return (
    <div className={className}>
      {label && <label className="block font-medium mb-1.5">{label}</label>}

      <div
        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
          disabled
            ? "border-gray-200 bg-gray-50 cursor-not-allowed"
            : "border-gray-300 hover:border-gray-400 cursor-pointer"
        }`}
      >
        {preview ? (
          <div className="text-center">
            <div className="relative inline-block">
              <Image
                src={preview}
                alt="Preview"
                width={sizeMap[previewSize].w}
                height={sizeMap[previewSize].h}
                unoptimized
                className={`${sizeMap[previewSize].cls} object-cover rounded-lg shadow-md`}
              />
              {!disabled && (
                <button
                  title="Remove image"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {showFileName && fileName && (
              <p className="text-xs text-gray-500 mt-2 truncate max-w-[200px] mx-auto">
                {fileName}
              </p>
            )}
          </div>
        ) : (
          <div
            onClick={handleClick}
            className="flex flex-col items-center cursor-pointer"
          >
            {uploading ? (
              <Loader2 className="h-12 w-12 text-gray-400 animate-spin" />
            ) : (
              <Upload className="h-12 w-12 text-gray-400" />
            )}
            <p className="mt-2 text-sm text-gray-600">
              {uploading ? "Uploading..." : "Click to upload"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {acceptedFormats
                .map((f) => f.split("/")[1].toUpperCase())
                .join(", ")}
            </p>
          </div>
        )}

        <input
          title="Upload image"
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(",")}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || uploading}
        />
      </div>
    </div>
  );
};

export default ImageHandler;
