import { Image, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import SettingsAssets from "@/assets/images/settings";
import storeFrontService from "@/services/storefrontService";
import useToastStore from "@/stores/toastStore";
import { useNetworkStore } from "@/stores/useNetworkStore";

const brandColors = [
  "#000000",
  "#1E90FF",
  "#15BA5C",
  "#FF8C00",
  "#8B00FF",
  "#FF69B4",
  "#FF6347",
];

type CustomizeTabProps = {
  outletId?: string | null;
  initialLogoUrl?: string | null;
  initialCoverUrl?: string | null;
  initialColor?: string | null;
  onSaved?: () => void | Promise<void>;
};

const CustomizeTab = ({
  outletId,
  initialLogoUrl = null,
  initialCoverUrl = null,
  initialColor = null,
  onSaved,
}: CustomizeTabProps) => {
  const [selectedColor, setSelectedColor] = useState<string>(
    initialColor || "#15BA5C",
  );
  const [logoPreview, setLogoPreview] = useState<string | null>(initialLogoUrl);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    initialCoverUrl,
  );
  const [logoPublicId, setLogoPublicId] = useState<string | null>(null);
  const [coverPublicId, setCoverPublicId] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [baselineLogoUrl, setBaselineLogoUrl] = useState<string | null>(
    initialLogoUrl,
  );
  const [baselineCoverUrl, setBaselineCoverUrl] = useState<string | null>(
    initialCoverUrl,
  );
  const [baselineColor, setBaselineColor] = useState<string>(
    (initialColor || "#15BA5C").toUpperCase(),
  );
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const colorInputRef = useRef<HTMLInputElement | null>(null);
  const { showToast } = useToastStore();
  const { isOnline } = useNetworkStore();

  const isDirty = useMemo(() => {
    const normalize = (v: string | null) => {
      const s = String(v || "").trim();
      return s.length > 0 ? s : null;
    };
    const currentLogo = normalize(logoPreview);
    const currentCover = normalize(coverPreview);
    const baseLogo = normalize(baselineLogoUrl);
    const baseCover = normalize(baselineCoverUrl);
    const currentColor = String(selectedColor || "").toUpperCase();
    const baseColor = String(baselineColor || "").toUpperCase();
    return (
      currentLogo !== baseLogo ||
      currentCover !== baseCover ||
      currentColor !== baseColor
    );
  }, [
    baselineColor,
    baselineCoverUrl,
    baselineLogoUrl,
    coverPreview,
    logoPreview,
    selectedColor,
  ]);

  const canSave = useMemo(() => {
    return (
      Boolean(outletId) &&
      isDirty &&
      !isSaving &&
      !isUploadingLogo &&
      !isUploadingCover
    );
  }, [outletId, isDirty, isSaving, isUploadingLogo, isUploadingCover]);

  const colorOptions = useMemo(() => {
    const merged = [...brandColors, ...customColors].map((c) =>
      String(c || "").toUpperCase(),
    );
    return Array.from(new Set(merged)).filter(Boolean);
  }, [customColors]);

  function extractCloudinaryPublicId(url: string | null) {
    if (!url) return null;
    const withoutQuery = url.split("?")[0];
    const m = withoutQuery.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^/.]+)?$/);
    if (!m?.[1]) return null;
    return m[1];
  }

  useEffect(() => {
    const c = (initialColor || "#15BA5C").toUpperCase();
    setSelectedColor(c);
    setBaselineColor(c);
  }, [initialColor]);

  useEffect(() => {
    setLogoPreview(initialLogoUrl);
    setLogoPublicId(extractCloudinaryPublicId(initialLogoUrl));
    setBaselineLogoUrl(initialLogoUrl);
  }, [initialLogoUrl]);

  useEffect(() => {
    setCoverPreview(initialCoverUrl);
    setCoverPublicId(extractCloudinaryPublicId(initialCoverUrl));
    setBaselineCoverUrl(initialCoverUrl);
  }, [initialCoverUrl]);

  const uploadToCloud = async (file: File) => {
    const api = (window as any).electronAPI;
    if (!api?.uploadImage) throw new Error("Image upload not available");

    const buffer = new Uint8Array(await file.arrayBuffer());
    const res = await api.uploadImage({
      buffer,
      name: file.name,
      type: file.type || "image/jpeg",
      token: "",
    });

    const data = res?.data?.data;
    const url = String(data?.url || "");
    const publicId = data?.public_id ? String(data.public_id) : null;
    if (!url) throw new Error("Upload failed");
    return { url, publicId };
  };

  const deleteFromCloud = async (publicId: string) => {
    const api = (window as any).electronAPI;
    if (!api?.deleteImage) return;
    await api.deleteImage({ publicId });
  };

  const handleCoverClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleCustomColorClick = () => {
    if (colorInputRef.current) colorInputRef.current.click();
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = String(e.target.value || "").toUpperCase();
    if (!next) return;
    setSelectedColor(next);
    if (!brandColors.includes(next)) {
      setCustomColors((prev) => (prev.includes(next) ? prev : [...prev, next]));
    }
  };

  const handleLogoClick = () => {
    if (logoInputRef.current) {
      logoInputRef.current.click();
    }
  };

  const handleLogoChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!isOnline) {
      showToast(
        "error",
        "You’re offline",
        "Connect to the internet to upload a logo.",
      );
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
    setIsUploadingLogo(true);
    try {
      const uploaded = await uploadToCloud(file);
      setLogoPreview(uploaded.url);
      setLogoPublicId(uploaded.publicId);
      showToast("success", "Logo uploaded", "Your logo is ready to save.");
    } catch {
      showToast(
        "error",
        "Upload failed",
        "We couldn’t upload your logo. Please try again.",
      );
      setLogoPreview(initialLogoUrl);
    } finally {
      setIsUploadingLogo(false);
      URL.revokeObjectURL(previewUrl);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const handleCoverChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!isOnline) {
      showToast(
        "error",
        "You’re offline",
        "Connect to the internet to upload a cover image.",
      );
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setCoverPreview(previewUrl);
    setIsUploadingCover(true);
    try {
      const uploaded = await uploadToCloud(file);
      setCoverPreview(uploaded.url);
      setCoverPublicId(uploaded.publicId);
      showToast(
        "success",
        "Cover uploaded",
        "Your cover image is ready to save.",
      );
    } catch {
      showToast(
        "error",
        "Upload failed",
        "We couldn’t upload your cover image. Please try again.",
      );
      setCoverPreview(initialCoverUrl);
    } finally {
      setIsUploadingCover(false);
      URL.revokeObjectURL(previewUrl);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!outletId) return;
    if (!isOnline) {
      showToast(
        "error",
        "You’re offline",
        "Connect to the internet to save storefront changes.",
      );
      return;
    }
    if (!isDirty) return;
    if (isSaving || isUploadingLogo || isUploadingCover) return;

    setIsSaving(true);
    try {
      await storeFrontService.updateStorefrontLogo(outletId, {
        logoUrl: logoPreview || null,
        coverUrl: coverPreview || null,
        color: selectedColor,
      });
      setBaselineLogoUrl(logoPreview || null);
      setBaselineCoverUrl(coverPreview || null);
      setBaselineColor(String(selectedColor || "").toUpperCase());
      if (onSaved) await onSaved();
      showToast(
        "success",
        "Saved",
        "Your storefront customization was updated.",
      );
    } catch {
      showToast(
        "error",
        "Save failed",
        "We couldn’t save your storefront changes. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!outletId) return;
    const prevPublicId = logoPublicId || extractCloudinaryPublicId(logoPreview);
    if (!isOnline) {
      showToast(
        "error",
        "You’re offline",
        "Connect to the internet to delete the logo.",
      );
      return;
    }

    setIsSaving(true);
    try {
      await storeFrontService.updateStorefrontLogo(outletId, {
        logoUrl: null,
        coverUrl: coverPreview || null,
        color: selectedColor,
      });
      setLogoPreview(null);
      setLogoPublicId(null);
      setBaselineLogoUrl(null);
      if (onSaved) await onSaved();
      if (prevPublicId) {
        await deleteFromCloud(prevPublicId);
      }
      showToast("success", "Logo removed", "Your storefront logo was cleared.");
    } catch {
      showToast(
        "error",
        "Delete failed",
        "We couldn’t delete the logo. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCover = async () => {
    if (!outletId) return;
    const prevPublicId =
      coverPublicId || extractCloudinaryPublicId(coverPreview);
    if (!isOnline) {
      showToast(
        "error",
        "You’re offline",
        "Connect to the internet to delete the cover image.",
      );
      return;
    }

    setIsSaving(true);
    try {
      await storeFrontService.updateStorefrontLogo(outletId, {
        logoUrl: logoPreview || null,
        coverUrl: null,
        color: selectedColor,
      });
      setCoverPreview(null);
      setCoverPublicId(null);
      setBaselineCoverUrl(null);
      if (onSaved) await onSaved();
      if (prevPublicId) {
        await deleteFromCloud(prevPublicId);
      }
      showToast("success", "Cover removed", "Your cover image was cleared.");
    } catch {
      showToast(
        "error",
        "Delete failed",
        "We couldn’t delete the cover image. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
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
              <Upload className="h-4 w-4" />
              <span>Upload Logo</span>
            </button>
            <button
              type="button"
              onClick={handleDeleteLogo}
              disabled={!logoPreview || isSaving}
              className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] border border-[#F97373] bg-white px-4 py-2 text-sm font-medium text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
            >
              <Trash2 className="h-4 w-4" />
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
            {colorOptions.map((color) => {
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
              onClick={handleCustomColorClick}
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E7EB] hover:bg-white cursor-pointer"
              aria-label="Pick custom colour"
              title="Pick custom colour"
            >
              <span
                className="h-7 w-7 rounded-full"
                style={{ backgroundColor: selectedColor }}
              />
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[14px] leading-none text-[#6B7280] shadow-sm border border-[#E5E7EB]">
                +
              </span>
            </button>
            <input
              ref={colorInputRef}
              type="color"
              value={selectedColor}
              onChange={handleCustomColorChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {coverPreview ? (
          <div className="rounded-[16px] border border-[#E5E7EB] bg-white overflow-hidden">
            <div className="relative h-[220px] w-full">
              <img
                src={coverPreview}
                alt="Cover"
                className="h-full w-full object-cover"
              />
              <div className="absolute right-4 top-4 flex gap-2">
                <button
                  type="button"
                  onClick={handleCoverClick}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] bg-white/90 px-3 py-2 text-sm font-medium text-[#111827] hover:bg-white transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Replace
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCover}
                  disabled={isSaving}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] bg-white/90 px-3 py-2 text-sm font-medium text-[#EF4444] hover:bg-white transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverChange}
            />
          </div>
        ) : (
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
              onChange={handleCoverChange}
            />
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={!canSave}
        className="mt-2 w-full cursor-pointer rounded-[12px] bg-[#15BA5C] py-3 text-center text-sm font-medium text-white transition-colors hover:bg-[#13A652] disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isSaving ? "Saving..." : "Save and Continue"}
      </button>
    </section>
  );
};

export default CustomizeTab;
