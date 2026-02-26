/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
//@ts-nocheck
"use client";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import BusinessRevenueComponent from "./BusinessRevenueComponent";
import { Country, ICountry } from "country-state-city";
import C from "currency-codes";
import ImageHandler from "@/shared/Image/ImageHandler";
import { CustomSelect } from "./SelectInput";
import { useBusinessStore } from "@/stores/useBusinessStore";
import {
  useGetPrimaryBusinessQuery,
  useOnboardBusinessMutation,
} from "@/redux/auth";
import useToastStore from "@/stores/toastStore";
import { useNetworkStore } from "@/stores/useNetworkStore";

type ElectronAPI = {
  cacheGet: (key: string) => Promise<any>;
  cachePut: (key: string, value: any) => Promise<void>;
  saveOutletOnboarding: (payload: {
    outletId: string;
    data: {
      country: string;
      address: string;
      businessType: string;
      currency: string;
      revenueRange: string;
      logoUrl: string;
      isOfflineImage?: number;
      localLogoPath?: string;
    };
  }) => Promise<void>;
  importAsset: (filePath: string) => Promise<string>;
  savePinHash: (pin: string) => Promise<void>;
  verifyPinHash: (pin: string) => Promise<boolean>;
  factoryReset: () => void;
};

const getElectronAPI = (): ElectronAPI | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { electronAPI?: ElectronAPI };
  return w.electronAPI ?? null;
};

const countries = Country.getAllCountries();
const currencies = C.codes()
  .map((code) => C.code(code))
  .filter(Boolean);

export const businessTypes = [
  { value: "bakery", label: "Bakery" },
  { value: "restaurant", label: "Restaurant" },
  { value: "bar", label: "Bar" },
  { value: "cafe", label: "Cafe" },
  { value: "grocery_store", label: "Grocery Store" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "clothing_store", label: "Clothing Store" },
  { value: "salon", label: "Salon / Barber Shop" },
  { value: "gym", label: "Gym / Fitness Center" },
  { value: "electronics_store", label: "Electronics Store" },
  { value: "bookstore", label: "Bookstore" },
  { value: "laundry_service", label: "Laundry / Dry Cleaning" },
  { value: "other", label: "Other" },
];

interface BusinessInfoProps {
  onNext: () => void;
}

const BusinessInfo = ({ onNext }: BusinessInfoProps) => {
  const [businessType, setBusinessType] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<ICountry | null>(null);
  const [businessAddress, setBusinessAddress] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedCurrency, setSelectedCurrency] = useState<any>(null);

  const [isBusinessTypeOpen, setIsBusinessTypeOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  // const [newBusinessType, setNewBusinessType] = useState("");
  // const [isAddingNew, setIsAddingNew] = useState(false);
  const [revenueRange, setRevenueRange] = useState("50000-100000");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currencySearchTerm, setCurrencySearchTerm] = useState("");

  const [logoUrl, setLogoUrl] = useState("");
  const [searchParams] = useSearchParams();
  const { outlets, updateOutletLocal } = useBusinessStore();
  const { isOnline } = useNetworkStore();
  const outletIdParam = searchParams.get("outletId") || "";
  const outlet = outlets.find((o) => o.id === outletIdParam) as unknown as
    | {
        isOnboarded?: boolean;
      }
    | undefined;

  const { data: businessData, isLoading: isBusinessLoading } =
    useGetPrimaryBusinessQuery();
  const [onboardBusiness] = useOnboardBusinessMutation();
  const { showToast } = useToastStore();
  console.log(businessType, selectedCountry, selectedCurrency);

  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredCurrencies = currencies.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (currency: any) =>
      currency.currency
        .toLowerCase()
        .includes(currencySearchTerm.toLowerCase()) ||
      currency.code.toLowerCase().includes(currencySearchTerm.toLowerCase()),
  );

  const handleBusinessTypeSelect = (type: { value: string; label: string }) => {
    setBusinessType(type);
    setIsBusinessTypeOpen(false);
  };

  const handleCountrySelect = (country: ICountry) => {
    setSelectedCountry(country);
    setIsLocationOpen(false);
  };

  const handleCurrencySelect = (currency: any) => {
    setSelectedCurrency(currency);
    setIsCurrencyOpen(false);
  };

  const handleImageUpload = (file: File) => {
    setLogoFile(file);
    console.log("[BusinessInfo] 🖼️ Image file selected:", file.name);
  };

  const handleRevenueRangeChange = (range: string) => {
    setRevenueRange(range);
    console.log("[BusinessInfo] 💰 Revenue range changed:", range);
  };

  const handleBusinessOnboardingSubmission = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("[BusinessInfo] 📝 Starting business onboarding submission...");
    console.log("[BusinessInfo] Form data:", {
      businessType,
      country: selectedCountry?.name,
      address: businessAddress,
      currency: selectedCurrency?.code,
      revenueRange,
      hasLogo: !!logoFile,
      businessId: businessData?.data?.id,
    });

    // Validation
    if (!businessType || !selectedCountry || !selectedCurrency) {
      console.warn("[BusinessInfo] ⚠️ Missing required fields");
      showToast(
        "error",
        "Missing Fields",
        "Please select business type, location, and currency.",
      );
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        businessId: businessData?.data?.id,
        country: selectedCountry.name,
        address: businessAddress || selectedCountry.name,
        businessType: businessType.value,
        currency: selectedCurrency.code,
        revenueRange,
        logoUrl: logoUrl || "",
        logoHash: logoUrl ? "updated" : undefined,
        ...(outlet && !outlet.isOnboarded && outletIdParam
          ? { outletId: outletIdParam }
          : {}),
      };

      const api = getElectronAPI();
      const needsOutletOnboarding =
        outlet && !outlet.isOnboarded && outletIdParam;

      // Offline Handling
      if (!isOnline) {
        // If we have an outlet to onboard, we must do so locally
        if (needsOutletOnboarding && outletIdParam && api) {
          const isOfflineImage = logoUrl.startsWith("file://") ? 1 : 0;
          const localLogoPath = logoUrl.startsWith("file://") ? logoUrl : null;

          await api.saveOutletOnboarding({
            outletId: outletIdParam,
            data: {
              country: payload.country,
              address: payload.address,
              businessType: payload.businessType,
              currency: payload.currency,
              revenueRange: payload.revenueRange,
              logoUrl: payload.logoUrl,
              isOfflineImage,
              localLogoPath: localLogoPath || undefined,
            },
          });
          updateOutletLocal(outletIdParam, {
            country: payload.country,
            address: payload.address,
            businessType: payload.businessType,
            currency: payload.currency,
            revenueRange: payload.revenueRange,
            logoUrl: payload.logoUrl,
            isOnboarded: true,
            isOfflineImage,
            localLogoPath: localLogoPath || undefined,
          });
          showToast(
            "success",
            "Setup complete (Offline)",
            "Business details saved locally.",
          );
          onNext();
          return;
        } else if (needsOutletOnboarding && !outletIdParam) {
          showToast(
            "error",
            "Offline",
            "Cannot save business details offline without an outlet.",
          );
          setIsSubmitting(false);
          return;
        } else {
          // If there is NO outlet to onboard (just business details update?), allow it or handle differently.
          // Assuming if we are here, we might just be updating business info locally if supported.
          // For now, let's treat it as success if we aren't required to onboard an outlet.
          showToast(
            "success",
            "Setup complete (Offline)",
            "Business details saved locally.",
          );
          onNext();
          return;
        }
      }

      if (needsOutletOnboarding && outletIdParam && api) {
        // await api.saveOutletOnboarding({
        //   outletId: outletIdParam,
        //   data: {
        //     country: payload.country,
        //     address: payload.address,
        //     businessType: payload.businessType,
        //     currency: payload.currency,
        //     revenueRange: payload.revenueRange,
        //     logoUrl: payload.logoUrl,
        //   },
        // });
        updateOutletLocal(outletIdParam, {
          country: payload.country,
          address: payload.address,
          businessType: payload.businessType,
          currency: payload.currency,
          revenueRange: payload.revenueRange,
          logoUrl: payload.logoUrl,
          isOnboarded: true,
        });
      }

      if (!isOnline && needsOutletOnboarding && outletIdParam) {
        // When you are ready to sync outlet onboarding to the server,
        // enqueue the server operation here (e.g. via queueAdd or a dedicated IPC).

        showToast(
          "success",
          "Setup complete",
          "Business details saved locally.",
        );
        onNext();
        return;
      }

      const res = await onboardBusiness(payload).unwrap();
      if (res?.status) {
        showToast("success", "Setup complete", "Business details saved.");
        onNext();
      } else {
        throw new Error(res?.message || "Failed to onboard business");
      }
    } catch (error) {
      console.error("[BusinessInfo] ❌ Business onboarding error:", error);
      console.error("[BusinessInfo] Error details:", {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        message: (error as any)?.message,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: (error as any)?.data,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: (error as any)?.status,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (
      confirm(
        "Are you sure you want to reset the application? This will clear all data and cannot be undone.",
      )
    ) {
      localStorage.clear();
      sessionStorage.clear();
      const api = getElectronAPI();
      api?.factoryReset();
    }
  };

  // Show loading state
  if (isBusinessLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-[#15BA5C]" />
        <p className="mt-4 text-gray-600">Loading business data...</p>
      </div>
    );
  }

  return (
    <>
      <h3 className="text-[#1E1E1E] text-[26px] font-bold mt-6 mb-4 text-center">
        Tell us About your <span className="text-[#15BA5C]">Business</span>
      </h3>
      <form onSubmit={handleBusinessOnboardingSubmission}>
        <div className="space-y-6">
          {/* Business Type Dropdown */}

          <CustomSelect
            options={businessTypes}
            onChange={function (option: any): void {
              console.log(option);
              handleBusinessTypeSelect(option);
            }}
            placeholder="Select your business type"
            label="What type of Business are you?"
            value={businessType}
          />

          <CustomSelect
            options={filteredCountries}
            onChange={function (option: any): void {
              console.log(option);
              handleCountrySelect(option);
            }}
            placeholder="Select your country"
            label="Where is your Business located?"
            value={selectedCountry}
            getOptionLabel={(option: { name: any }) => option.name} // custom label
            getOptionValue={(option: { name: any }) => option.name}
          />
          {/* Business Address */}
          <div className="space-y-2">
            <h3 className="font-medium text-[18px] text-gray-700">
              What is your Business address?
            </h3>
            <input
              type="text"
              name="businessAddress"
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              placeholder="Enter your Business address"
              className="w-full text-[#1E1E1E] text-[15px] px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#15BA5C]"
            />
          </div>
          <CustomSelect
            options={filteredCurrencies}
            onChange={function (option: any): void {
              console.log(option);
              handleCurrencySelect(option);
            }}
            placeholder="Select your currency"
            label="What is your preferred currency?"
            value={selectedCurrency}
            getOptionLabel={(option: { currency: any; code: any }) =>
              `${option.currency} (${option.code})`
            } // custom label
            getOptionValue={(option: { code: any }) => option.code}
          />

          {/* Revenue + Logo Upload */}
          <div className="w-full">
            <BusinessRevenueComponent
              onRevenueRangeChange={handleRevenueRangeChange}
              onFileUpload={handleImageUpload}
              onImageUpload={() => {}}
              selectedCurrency={selectedCurrency}
            />

            <ImageHandler
              label="Business Logo"
              value={logoUrl}
              onChange={(imageData) => setLogoUrl(imageData.url)}
              previewSize="lg"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              !businessType ||
              !selectedCountry ||
              !selectedCurrency ||
              isSubmitting
            }
            className="w-full mt-8 px-6 py-3 bg-[#15BA5C] text-white font-medium rounded-lg hover:bg-[#13A652] focus:outline-none focus:ring-2 focus:ring-[#15BA5C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Continue"
            )}
          </button>

          <div className="flex justify-center pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-red-500 hover:text-red-600 hover:underline transition-colors"
            >
              Factory Reset (Clear all data)
            </button>
          </div>
        </div>
      </form>
    </>
  );
};

export default BusinessInfo;
