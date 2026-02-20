import { Image, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import SettingsAssets from "@/assets/images/settings";

const brandColors = [
  "#000000",
  "#2563EB",
  "#15BA5C",
  "#F97316",
  "#8B5CF6",
  "#F9A8D4",
  "#F97373",
];

const CustomizeTab = () => {
  const [selectedColor, setSelectedColor] = useState<string>("#15BA5C");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleCoverClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleLogoClick = () => {
    if (logoInputRef.current) {
      logoInputRef.current.click();
    }
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
  };

  return (
    <section className="flex flex-col gap-8">
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-[#000000]">Customization</h2>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#E5F9EE]">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[#15BA5C]">
              <img
                src={logoPreview || SettingsAssets.CustomizeTab}
                alt="Storefront logo"
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleLogoClick}
              className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] bg-[#15BA5C] px-4 py-2 text-sm font-medium text-white hover:bg-[#13A652] transition-colors"
            >
              <span>Upload Logo</span>
            </button>
            <button
              type="button"
              onClick={() => setLogoPreview(null)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] border border-[#F97373] bg-white px-4 py-2 text-sm font-medium text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
            >
              <span>Delete</span>
            </button>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-[#111827]">
            Select your business’s brand colour
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {brandColors.map((color) => {
              const isActive = selectedColor === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                    isActive ? "border-[#15BA5C]" : "border-transparent"
                  }`}
                  aria-label="Select brand colour"
                  title="Select brand colour"
                >
                  <span
                    className="h-7 w-7 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                </button>
              );
            })}

            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280] hover:bg-white cursor-pointer"
            >
              <span className="text-lg leading-none">+</span>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div
          className="flex cursor-pointer flex-col items-center justify-center rounded-[16px] border border-dashed border-[#D1D5DB] bg-[#FCFCFC] px-6 py-10 text-center"
          onClick={handleCoverClick}
        >
          <Image className="mb-4 h-10 w-10 text-[#4B5563]" />
          <p className="text-base font-medium text-[#111827]">
            Upload cover image
          </p>
          <p className="mt-1 text-xs text-[#6B7280]">
            Recommended size : up to 10MB
          </p>
          <p className="mt-2 text-xs text-[#6B7280]">
            Drag and drop image or{" "}
            <button
              type="button"
              onClick={handleCoverClick}
              className="text-[#15BA5C] underline underline-offset-2"
            >
              click here
            </button>{" "}
            to upload
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
          />
        </div>
      </div>

      <button
        type="button"
        className="mt-2 w-full cursor-pointer rounded-[12px] bg-[#15BA5C] py-3 text-center text-sm font-medium text-white transition-colors hover:bg-[#13A652]"
      >
        Save and Continue
      </button>
    </section>
  );
};

export default CustomizeTab;
