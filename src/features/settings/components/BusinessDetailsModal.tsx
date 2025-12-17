/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
"use client";
import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  Country,
  State,
  City,
  ICountry,
  IState,
  ICity,
} from "country-state-city";
import { Upload } from "lucide-react";
import countryCurrencyMap from "country-currency-map";
import { Check, ChevronDown, Plus, X, Loader2 } from "lucide-react";
import { CiEdit } from "react-icons/ci";
import { parsePhoneNumberFromString } from "libphonenumber-js";

import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import SettingFiles from "@/assets/icons/settings";

import { getPhoneCountries, PhoneCountry } from "@/utils/getPhoneCountries";
import { useUpdateOutletMutation } from "@/redux/outlets";
import { useUploadImageMutation } from "@/redux/app";
import useToastStore from "@/stores/toastStore";
import useBusinessStore from "@/stores/useBusinessStore";
import { useAuthStore } from "@/stores/authStore";

interface BusinessDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const businessTypesConstants = [
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

const defaultBusinessTypes = ["Bakery", "Restaurant", "Bar"];
const countries = Country.getAllCountries();

const isEqualDetails = (
  a: {
    name: string;
    email: string;
    phone: string;
    country: string;
    state: string;
    city: string;
    address: string;
    businessType: string;
    postalCode: string;
  },
  b: {
    name: string;
    email: string;
    phone: string;
    country: string;
    state: string;
    city: string;
    address: string;
    businessType: string;
    postalCode: string;
  }
) =>
  a.name === b.name &&
  a.email === b.email &&
  a.phone === b.phone &&
  a.country === b.country &&
  a.state === b.state &&
  a.city === b.city &&
  a.address === b.address &&
  a.businessType === b.businessType &&
  a.postalCode === b.postalCode;

const BusinessDetailsModal_isDirty = (
  details: any,
  baselineDetails: any,
  businessType: string,
  baselineBusinessType: string,
  uploadedImageUrl: string,
  baselineLogoUrl: string,
  selectedPhoneCountry: PhoneCountry | null,
  baselineDialCode: string,
  isImageDeleted: boolean
) => {
  const detailsChanged = !isEqualDetails(details, baselineDetails);
  const businessTypeChanged = businessType !== baselineBusinessType;
  const logoChanged = (uploadedImageUrl || "") !== (baselineLogoUrl || "");
  const dialChanged =
    (selectedPhoneCountry?.dialCode || "") !== (baselineDialCode || "");
  return (
    detailsChanged ||
    businessTypeChanged ||
    logoChanged ||
    dialChanged ||
    isImageDeleted
  );
};

export const BusinessDetailsModal: React.FC<BusinessDetailsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [details, setDetails] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    state: "",
    city: "",
    address: "",
    businessType: "",
    postalCode: "",
  });
  const { showToast } = useToastStore();
  const { fetchBusinessData, primaryBusiness, outlets, selectedOutlet } =
    useBusinessStore();
  const { user: userData } = useAuthStore();

  console.log(userData?.email, "This is the user");
  console.log("Selected Outlet:", selectedOutlet);
  const [newBusinessType, setNewBusinessType] = useState("");
  const [businessTypes, setBusinessTypes] = useState(defaultBusinessTypes);
  const [businessType, setBusinessType] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isBusinessTypeOpen, setIsBusinessTypeOpen] = useState(false);
  const [phoneError, setPhoneError] = useState<string>("");
  const [logoSyncScheduled, setLogoSyncScheduled] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const [baselineDetails, setBaselineDetails] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    state: "",
    city: "",
    address: "",
    businessType: "",
    postalCode: "",
  });
  const [baselineBusinessType, setBaselineBusinessType] = useState("");
  const [baselineLogoUrl, setBaselineLogoUrl] = useState("");
  const [baselineDialCode, setBaselineDialCode] = useState("");
  const [loading, setLoading] = useState(false);

  // Use RTK Query hooks

  const [updateOutlet] = useUpdateOutletMutation();
  const [uploadImage, { isLoading }] = useUploadImageMutation();

  type ElectronAPI = {
    getNetworkStatus: () => Promise<{ online: boolean }>;
    cachePut: (key: string, value: any) => Promise<void>;
    cacheGet: (key: string) => Promise<any>;
    broadcast: (message: any) => void;
    queueAdd: (op: {
      method: string;
      path: string;
      data?: any;
      useAuth?: boolean;
    }) => Promise<void>;
  };
  const getElectronAPI = (): ElectronAPI | null => {
    if (typeof window === "undefined") return null;
    const w = window as unknown as { electronAPI?: ElectronAPI };
    return w.electronAPI ?? null;
  };

  useEffect(() => {
    let timer: number | undefined;
    const run = async () => {
      try {
        if (
          !selectedOutlet ||
          !uploadedImageUrl ||
          !uploadedImageUrl.startsWith("outlet-logo:") ||
          isUploading
        ) {
          return;
        }
        const api = getElectronAPI();
        const online = await api
          ?.getNetworkStatus()
          .then((r) => r.online)
          .catch(() => true);
        if (!online) return;
        const cached = await api?.cacheGet(`image:${uploadedImageUrl}`);
        if (cached && cached.data) {
          const base64 = String(cached.data);
          const blob = (() => {
            const parts = base64.split(",");
            const byteString = atob(parts[1]);
            const mimeString = parts[0].match(/:(.*?);/)?.[1] || "image/png";
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            return new Blob([ab], { type: mimeString });
          })();
          const fd = new FormData();
          fd.append("image", new File([blob], "logo.png", { type: blob.type }));
          const result = await uploadImage(fd).unwrap();
          await updateOutlet({
            outletId: selectedOutlet.id,
            payload: { logoUrl: result.data.url },
          }).unwrap();
          setUploadedImageUrl(result.data.url);
          setIsImageDeleted(false);
          setLogoSyncScheduled(false);
        }
      } catch {}
    };
    if (
      logoSyncScheduled ||
      (uploadedImageUrl && uploadedImageUrl.startsWith("outlet-logo:"))
    ) {
      timer = window.setInterval(run, 2000);
    }
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [
    logoSyncScheduled,
    uploadedImageUrl,
    selectedOutlet,
    isUploading,
    uploadImage,
    updateOutlet,
  ]);
  // Country dropdown states
  const [selectedCountry, setSelectedCountry] = useState<ICountry | null>(null);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState("");

  // State dropdown states
  const [selectedState, setSelectedState] = useState<IState | null>(null);
  const [isStateOpen, setIsStateOpen] = useState(false);
  const [stateSearchTerm, setStateSearchTerm] = useState("");
  const [availableStates, setAvailableStates] = useState<IState[]>([]);

  // City dropdown states
  const [, setAvailableCities] = useState<ICity[]>([]);

  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImageDeleted, setIsImageDeleted] = useState(false);
  const currentUploadPromiseRef = useRef<Promise<string> | null>(null);

  const [phoneCountries, setPhoneCountries] = useState<PhoneCountry[]>([]);
  const [selectedPhoneCountry, setSelectedPhoneCountry] =
    useState<PhoneCountry | null>(null);
  const [isPhoneCountryOpen, setIsPhoneCountryOpen] = useState(false);
  const [phoneCountrySearchTerm, setPhoneCountrySearchTerm] = useState("");
  useEffect(() => {
    if (!isOpen) return;
    if (primaryBusiness) {
      setDetails((prev) => ({
        ...prev,
        name: primaryBusiness.name || prev.name,
        country: primaryBusiness.country || prev.country,
        address: primaryBusiness.address || prev.address,
        businessType: primaryBusiness.businessType || prev.businessType,
        email:
          (primaryBusiness.owner && primaryBusiness.owner.email) || prev.email,
      }));
    }
  }, [isOpen, primaryBusiness]);
  console.log(selectedOutlet);
  // Initialize details from store data
  useEffect(() => {
    if (!isOpen || !selectedOutlet) return;

    // const fullNumber = outlet.phoneNumber;
    // const phoneNumber = parsePhoneNumberFromString(String(fullNumber));

    // // Set phone country based on parsed phone number
    // let initialPhoneCountry = null;
    // const phoneCountriesData = getPhoneCountries();
    // if (phoneNumber && phoneNumber.countryCallingCode) {
    //   initialPhoneCountry = phoneCountriesData.find(
    //     (pc) => pc.dialCode.replace("+", "") === phoneNumber.countryCallingCode
    //   );
    // }

    // // Populate form with data
    // setDetails({
    //   name: outlet.name || "",
    //   address: outlet.address || "",
    //   businessType: outlet.businessType || "",
    //   city: outlet.city || "",
    //   email: outlet.email || "",
    //   country: outlet.country || "",
    //   phone: outlet.phoneNumber || "",
    //   postalCode: outlet.postalCode || "",
    //   state: outlet.state || "",
    // });

    const fullNumber = selectedOutlet.phoneNumber;
    const phoneNumber = parsePhoneNumberFromString(String(fullNumber));

    // Set phone country based on parsed phone number
    let initialPhoneCountry = null;
    const phoneCountriesData = getPhoneCountries();
    let phoneWithoutCode = selectedOutlet.phoneNumber || "";

    if (phoneNumber && phoneNumber.countryCallingCode) {
      initialPhoneCountry = phoneCountriesData.find(
        (pc) => pc.dialCode.replace("+", "") === phoneNumber.countryCallingCode
      );
      // Extract national number (without country code)
      phoneWithoutCode = phoneNumber.nationalNumber;
    }

    const initialDetails = {
      name: selectedOutlet.name || "",
      address: selectedOutlet.address || "",
      businessType: selectedOutlet.businessType || "",
      city: selectedOutlet.city || "",
      email: (primaryBusiness?.owner?.email as string) || "",
      country: selectedOutlet.country || "",
      phone: phoneWithoutCode,
      postalCode: (selectedOutlet as any).postalCode || "",
      state: selectedOutlet.state || "",
    };
    setDetails(initialDetails);
    setBaselineDetails(initialDetails);
    setBaselineBusinessType(selectedOutlet.businessType || "");
    setBaselineLogoUrl((selectedOutlet?.logoUrl as string) || "");
    setBaselineDialCode(
      initialPhoneCountry ? initialPhoneCountry.dialCode : ""
    );

    // Set country and state selections
    if (selectedOutlet.country) {
      const country = countries.find((c) => c.name === selectedOutlet.country);
      if (country) {
        setSelectedCountry(country);

        const states = State.getStatesOfCountry(country.isoCode);
        setAvailableStates(states);

        if (selectedOutlet.state) {
          const state = states.find((s) => s.name === selectedOutlet.state);
          if (state) {
            setSelectedState(state);

            const cities = City.getCitiesOfState(
              country.isoCode,
              state.isoCode
            );
            setAvailableCities(cities);
          }
        }
      }
    }

    if (selectedOutlet.businessType) {
      setBusinessType(selectedOutlet.businessType);
    }

    // Set phone country
    if (initialPhoneCountry) {
      setSelectedPhoneCountry(initialPhoneCountry);
    } else if (selectedOutlet.country) {
      const outletCountryPhone = phoneCountriesData.find(
        (pc) =>
          pc.isoCode ===
          countries.find((c) => c.name === selectedOutlet.country)?.isoCode
      );
      if (outletCountryPhone) {
        setSelectedPhoneCountry(outletCountryPhone);
      } else {
        const nigeria = phoneCountriesData.find((pc) => pc.isoCode === "NG");
        if (nigeria) {
          setSelectedPhoneCountry(nigeria);
        }
      }
    } else {
      const nigeria = phoneCountriesData.find((pc) => pc.isoCode === "NG");
      if (nigeria) {
        setSelectedPhoneCountry(nigeria);
      }
    }

    // Set logo URL if available
    if (selectedOutlet.logoUrl && !uploadedImageUrl) {
      setUploadedImageUrl(selectedOutlet.logoUrl);
    }
  }, [isOpen, selectedOutlet, uploadedImageUrl]);

  // Update available states when country changes
  useEffect(() => {
    if (selectedCountry) {
      const states = State.getStatesOfCountry(selectedCountry.isoCode);
      setAvailableStates(states);

      // Only clear state if user manually changed country
      if (details.country !== selectedCountry.name) {
        setSelectedState(null);
        setAvailableCities([]);
        handleChange("state", "");
        handleChange("city", "");
      }
    } else {
      setAvailableStates([]);
      setSelectedState(null);
      setAvailableCities([]);
    }
  }, [selectedCountry]);

  // Update available cities when state changes
  useEffect(() => {
    if (selectedState && selectedCountry) {
      const cities = City.getCitiesOfState(
        selectedCountry.isoCode,
        selectedState.isoCode
      );
      setAvailableCities(cities);
      handleChange("city", "");
    } else {
      setAvailableCities([]);
    }
  }, [selectedState, selectedCountry]);

  useEffect(() => {
    if (details?.logoUrl) {
      setUploadedImageUrl(details.logoUrl);
    }
  }, [details]);

  useEffect(() => {
    const phoneCountriesData = getPhoneCountries();
    setPhoneCountries(phoneCountriesData);

    if (!details.phone) {
      if (selectedCountry) {
        const matchingPhoneCountry = phoneCountriesData.find(
          (pc) => pc.isoCode === selectedCountry.isoCode
        );
        if (matchingPhoneCountry) {
          setSelectedPhoneCountry(matchingPhoneCountry);
          return;
        }
      }
      const nigeria = phoneCountriesData.find((pc) => pc.isoCode === "NG");
      if (nigeria) {
        setSelectedPhoneCountry(nigeria);
      }
    }
  }, [selectedCountry, details.phone]);

  const isDirty = useMemo(
    () =>
      BusinessDetailsModal_isDirty(
        details,
        baselineDetails,
        businessType,
        baselineBusinessType,
        uploadedImageUrl,
        baselineLogoUrl,
        selectedPhoneCountry,
        baselineDialCode,
        isImageDeleted
      ),
    [
      details,
      baselineDetails,
      businessType,
      baselineBusinessType,
      uploadedImageUrl,
      baselineLogoUrl,
      selectedPhoneCountry,
      baselineDialCode,
      isImageDeleted,
    ]
  );

  useEffect(() => {
    if (details.state && selectedCountry && availableStates.length > 0) {
      const matchingState = availableStates.find(
        (s) => s.name === details.state
      );
      if (matchingState && selectedState?.name !== matchingState.name) {
        setSelectedState(matchingState);
      }
    }
  }, [details.state, availableStates, selectedCountry]);

  // Filter functions
  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(countrySearchTerm.toLowerCase())
  );

  const filteredStates = availableStates.filter((state) =>
    state.name.toLowerCase().includes(stateSearchTerm.toLowerCase())
  );

  const filteredPhoneCountries = phoneCountries.filter(
    (country) =>
      country.name
        .toLowerCase()
        .includes(phoneCountrySearchTerm.toLowerCase()) ||
      country.dialCode.includes(phoneCountrySearchTerm)
  );

  // Helper functions
  const getDisabledStyles = (value: string) => {
    return !value.trim()
      ? "border-[#A6A6A6] text-gray-400"
      : "border-gray-300 hover:border-gray-400";
  };

  const getCurrencyByCountryName = (countryName: string): string => {
    if (!countryName || typeof countryName !== "string")
      return "Currency not found";
    const trimmedName = countryName.trim();
    const currency = countryCurrencyMap.getCurrencyAbbreviation(trimmedName);
    return currency || "Currency not found";
  };

  const validatePhoneNumber = (phone: string, countryCode: string): boolean => {
    if (!phone || !countryCode) return false;
    try {
      const phoneNumber = parsePhoneNumberFromString(
        phone,
        countryCode as import("libphonenumber-js").CountryCode
      );
      return phoneNumber ? phoneNumber.isValid() : false;
    } catch {
      return false;
    }
  };

  // Form submission

  // const handleSubmit = async (e: React.FormEvent) => {
  //   setLoading(true);
  //   e.preventDefault();

  //   if (!selectedOutlet) {
  //     onError("Missing Outlet ID", "Outlet information is missing.");
  //     setLoading(false);
  //     return;
  //   }

  //   try {
  //     const { country } = details;
  //     let logoUrlToSend: string | undefined;
  //     const existingLogoUrl = selectedOutlet?.logoUrl;

  //     // CRITICAL: Wait for any pending upload to complete first
  //     if (currentUploadPromiseRef.current) {
  //       console.log("Waiting for image upload to complete...");
  //       try {
  //         const finalUrl = await currentUploadPromiseRef.current;
  //         console.log("Image upload completed:", finalUrl);
  //         setUploadedImageUrl(finalUrl);
  //         logoUrlToSend = finalUrl;
  //       } catch (error) {
  //         console.error("Image upload failed:", error);
  //         onError("Upload Failed", "Failed to upload logo. Please try again.");
  //         setLoading(false);
  //         return;
  //       }
  //     }

  //     // Determine logo URL to send
  //     if (isImageDeleted) {
  //       logoUrlToSend = "";
  //       console.log("Logo marked for deletion");
  //     } else if (uploadedImageUrl && uploadedImageUrl !== existingLogoUrl) {
  //       logoUrlToSend = uploadedImageUrl;
  //       console.log("Using uploaded logo URL:", logoUrlToSend);
  //     } else if (existingLogoUrl && !uploadedImageUrl) {
  //       logoUrlToSend = existingLogoUrl;
  //       console.log("Keeping existing logo URL");
  //     }

  //     // Handle offline synthetic logo upload
  //     const api = getElectronAPI();
  //     const online = await api
  //       ?.getNetworkStatus()
  //       .then((r) => r.online)
  //       .catch(() => true);

  //     if (
  //       online &&
  //       typeof logoUrlToSend === "string" &&
  //       logoUrlToSend.startsWith("outlet-logo:") &&
  //       selectedOutlet
  //     ) {
  //       console.log("Converting offline logo to online URL...");
  //       const cached = await api?.cacheGet(`image:${logoUrlToSend}`);
  //       if (cached && cached.data) {
  //         const base64 = String(cached.data);
  //         const blob = (() => {
  //           const parts = base64.split(",");
  //           const byteString = atob(parts[1]);
  //           const mimeString = parts[0].match(/:(.*?);/)?.[1] || "image/png";
  //           const ab = new ArrayBuffer(byteString.length);
  //           const ia = new Uint8Array(ab);
  //           for (let i = 0; i < byteString.length; i++) {
  //             ia[i] = byteString.charCodeAt(i);
  //           }
  //           return new Blob([ab], { type: mimeString });
  //         })();
  //         const fd = new FormData();
  //         fd.append("image", new File([blob], "logo.png", { type: blob.type }));

  //         console.log("Uploading offline logo to server...");
  //         const result = await uploadImage(fd).unwrap();
  //         logoUrlToSend = result.data.url;
  //         console.log("Offline logo uploaded successfully:", logoUrlToSend);
  //         setUploadedImageUrl(result.data.url);
  //         setIsImageDeleted(false);
  //       }
  //     }

  //     // Prepare update data
  //     const updateData = {
  //       name: details.name,
  //       address: details.address,
  //       phoneNumber: selectedPhoneCountry?.dialCode
  //         ? `${selectedPhoneCountry.dialCode}${details.phone}`
  //         : details.phone,
  //       city: details.city,
  //       state: details.state,
  //       country: details.country,
  //       postalCode: details.postalCode,
  //       businessType: businessType,
  //       currency: getCurrencyByCountryName(country),
  //       revenueRange: "10-500",
  //       email: details.email,
  //       ...(logoUrlToSend !== undefined && { logoUrl: logoUrlToSend }),
  //     };

  //     console.log("Updating outlet with data:", updateData);

  //     // Perform outlet update (offline or online)
  //     if (!online && api) {
  //       const ts = Date.now();
  //       console.log("Saving outlet update offline...");
  //       try {
  //         await api.cachePut(`outlet:${selectedOutlet.id}`, {
  //           data: {
  //             ...(selectedOutlet as any),
  //             ...updateData,
  //             lastUpdatedAt: ts,
  //           },
  //           ts,
  //         });

  //         api.broadcast({
  //           kind: "outlet-update",
  //           outletId: selectedOutlet.id,
  //           data: { ...(selectedOutlet as any), ...updateData },
  //           ts,
  //         });

  //         const payloadForServer = {
  //           ...updateData,
  //           lastUpdatedAt: ts,
  //         } as any;

  //         // If logo is still synthetic, remove it and schedule sync
  //         if (
  //           typeof payloadForServer.logoUrl === "string" &&
  //           payloadForServer.logoUrl.startsWith("outlet-logo:")
  //         ) {
  //           delete payloadForServer.logoUrl;
  //           setLogoSyncScheduled(true);
  //           console.log("Logo sync scheduled for later");
  //         }

  //         await api.queueAdd({
  //           method: "PATCH",
  //           path: `/outlet/${selectedOutlet.id}`,
  //           data: payloadForServer,
  //           useAuth: true,
  //         });

  //         console.log("Offline update successful");
  //         showToast(
  //           "success",
  //           "Saved Offline",
  //           "Changes will sync automatically when online"
  //         );
  //       } catch (err) {
  //         console.error("Offline save failed:", err);
  //         showToast(
  //           "error",
  //           "Update Failed",
  //           "Could not cache offline changes"
  //         );
  //         setLoading(false);
  //         return;
  //       }
  //     } else {
  //       console.log("Updating outlet online...");
  //       await updateOutlet({
  //         outletId: selectedOutlet.id,
  //         payload: updateData,
  //       }).unwrap();
  //       console.log("Online update successful");
  //       showToast(
  //         "success",
  //         "Update Successful!",
  //         "Your Details have been updated successfully"
  //       );
  //     }

  //     // Reset form state
  //     setDetails({
  //       name: "",
  //       email: "",
  //       phone: "",
  //       country: "",
  //       state: "",
  //       city: "",
  //       address: "",
  //       postalCode: "",
  //       businessType: "",
  //     });
  //     setBusinessType("");
  //     setIsImageDeleted(false);
  //     setUploadedImageUrl("");
  //     setSelectedCountry(null);
  //     setSelectedState(null);
  //     setSelectedPhoneCountry(null);

  //     await fetchBusinessData();
  //     onClose();
  //   } catch (error: any) {
  //     console.error("Update failed:", error);
  //     const errorMessage =
  //       error?.data?.message ||
  //       error?.message ||
  //       "Failed to update business details";
  //     showToast("error", "Update Failed", errorMessage);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!selectedOutlet) {
      showToast("error", "Missing Outlet ID", "Outlet information is missing.");
      setLoading(false);
      return;
    }

    // 🚫 Do nothing if nothing changed
    if (!isDirty) {
      console.log("[SUBMIT] No changes detected. Skipping update.");
      setLoading(false);
      return;
    }

    try {
      /**
       * =====================================================
       * STEP 1: WAIT FOR IMAGE UPLOAD (IF ANY)
       * =====================================================
       */
      if (currentUploadPromiseRef.current) {
        console.log("[SUBMIT] Waiting for image upload...");
        try {
          const finalUrl = await currentUploadPromiseRef.current;
          console.log("[SUBMIT] Image upload finished:", finalUrl);
          setUploadedImageUrl(finalUrl);
        } catch {
          showToast(
            "error",
            "Upload Failed",
            "Logo upload failed. Please retry."
          );
          setLoading(false);
          return;
        }
      }

      /**
       * =====================================================
       * STEP 2: DETERMINE LOGO PAYLOAD
       * =====================================================
       */
      const existingLogoUrl = selectedOutlet.logoUrl;
      let logoUrlToSend: string | undefined;

      if (isImageDeleted) {
        logoUrlToSend = "";
        console.log("[LOGO] Marked for deletion");
      } else if (uploadedImageUrl && uploadedImageUrl !== existingLogoUrl) {
        logoUrlToSend = uploadedImageUrl;
        console.log("[LOGO] New logo detected:", logoUrlToSend);
      }

      /**
       * =====================================================
       * STEP 3: PREPARE UPDATE PAYLOAD
       * =====================================================
       */
      const api = getElectronAPI();
      const online = await api
        ?.getNetworkStatus()
        .then((r) => r.online)
        .catch(() => true);

      const updateData = {
        name: details.name,
        address: details.address,
        phoneNumber: selectedPhoneCountry?.dialCode
          ? `${selectedPhoneCountry.dialCode}${details.phone}`
          : details.phone,
        city: details.city,
        state: details.state,
        country: details.country,
        postalCode: details.postalCode,
        businessType,
        currency: getCurrencyByCountryName(details.country),
        revenueRange: "10-500",
        email: details.email,
        ...(logoUrlToSend !== undefined && { logoUrl: logoUrlToSend }),
      };

      /**
       * =====================================================
       * STEP 4: OFFLINE vs ONLINE UPDATE
       * =====================================================
       */
      if (!online && api) {
        console.log("[OFFLINE] Saving outlet update locally");

        const ts = Date.now();

        await api.cachePut(`outlet:${selectedOutlet.id}`, {
          data: {
            ...(selectedOutlet as any),
            ...updateData,
            lastUpdatedAt: ts,
          },
          ts,
        });

        api.broadcast({
          kind: "outlet-update",
          outletId: selectedOutlet.id,
          data: { ...(selectedOutlet as any), ...updateData },
          ts,
        });

        const payloadForServer = { ...updateData, lastUpdatedAt: ts } as any;

        // 🕒 Schedule logo sync ONLY if needed
        if (
          typeof payloadForServer.logoUrl === "string" &&
          payloadForServer.logoUrl.startsWith("outlet-logo:")
        ) {
          delete payloadForServer.logoUrl;
          setLogoSyncScheduled(true);
          console.log("[OFFLINE] Logo sync scheduled");
        }

        await api.queueAdd({
          method: "PATCH",
          path: `/outlet/${selectedOutlet.id}`,
          data: payloadForServer,
          useAuth: true,
        });

        showToast(
          "success",
          "Saved Offline",
          "Changes will sync automatically when online"
        );
      } else {
        console.log("[ONLINE] Updating outlet");
        await updateOutlet({
          outletId: selectedOutlet.id,
          payload: updateData,
        }).unwrap();

        showToast(
          "success",
          "Update Successful!",
          "Your Details have been updated successfully"
        );
      }

      await fetchBusinessData();
      onClose();
    } catch (error: any) {
      console.error("[SUBMIT] Update failed:", error);
      showToast(
        "error",
        "Update Failed",
        error?.data?.message || error?.message || "Failed to update business"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof BusinessDetailsType, value: string) => {
    setDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleBusinessTypeSelect = (type: string) => {
    setBusinessType(type);
    setIsBusinessTypeOpen(false);
  };

  const handleCountrySelect = (country: ICountry) => {
    setSelectedCountry(country);
    setIsCountryOpen(false);
    setCountrySearchTerm("");
    handleChange("country", country.name);
  };

  const handleStateSelect = (state: IState) => {
    setSelectedState(state);
    setIsStateOpen(false);
    setStateSearchTerm("");
    handleChange("state", state.name);
  };

  const handleAddBusinessType = () => {
    if (
      newBusinessType.trim() &&
      !businessTypes.includes(newBusinessType.trim())
    ) {
      const updatedTypes = [...businessTypes, newBusinessType.trim()];
      setBusinessTypes(updatedTypes);
      setBusinessType(newBusinessType.trim());
      setNewBusinessType("");
      setIsAddingNew(false);
      setIsBusinessTypeOpen(false);
    }
  };

  const handlePhoneCountrySelect = (phoneCountry: PhoneCountry) => {
    setSelectedPhoneCountry(phoneCountry);
    setIsPhoneCountryOpen(false);
    setPhoneCountrySearchTerm("");
    setPhoneError("");
    handleChange("phone", "");
  };

  // API call function to upload logo
  const uploadLogo = async (file: File): Promise<string> => {
    const api = getElectronAPI();
    const online = await api
      ?.getNetworkStatus()
      .then((r) => r.online)
      .catch(() => true);

    if (!selectedOutlet) throw new Error("Missing outlet context");

    // Offline: cache base64 and broadcast to peers; return synthetic cache key
    if (!online && api) {
      const toBase64 = () =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      const base64 = await toBase64();
      const syntheticUrl = `outlet-logo:${selectedOutlet.id}:${Date.now()}`;
      const key = `image:${syntheticUrl}`;
      try {
        await api.cachePut(key, { data: base64, ts: Date.now() });
        api.broadcast({
          kind: "image-cache",
          url: syntheticUrl,
          data: base64,
        });
      } catch {}
      return syntheticUrl;
    }

    // Online: upload to server and return URL
    const formData = new FormData();
    formData.append("image", file);
    const result = await uploadImage(formData).unwrap();
    return result.data.url;
  };

  // Event handlers
  const handleFileInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await processFileUpload(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      await processFileUpload(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteImage = () => {
    setUploadedImageUrl("");
    setIsImageDeleted(true);
  };

  // Main upload processing function
  // const processFileUpload = async (file: File) => {
  //   // Validate file type
  //   const validTypes = [
  //     "image/jpeg",
  //     "image/jpg",
  //     "image/png",
  //     "image/svg+xml",
  //   ];
  //   if (!validTypes.includes(file.type)) {
  //     alert("Please select a valid image file (JPEG, PNG, SVG)");
  //     return;
  //   }

  //   // Validate file size (5MB)
  //   if (file.size > 5 * 1024 * 1024) {
  //     alert("File size must be less than 5MB");
  //     return;
  //   }

  //   try {
  //     const imageUrl = await uploadLogo(file);
  //     setUploadedImageUrl(imageUrl);
  //     setIsImageDeleted(false);
  //   } catch (error) {
  //     alert("Failed to upload logo. Please try again.");
  //   } finally {
  //     // Reset file input
  //     if (fileInputRef.current) {
  //       fileInputRef.current.value = "";
  //     }
  //   }
  // };

  // In your main upload function
  // const processFileUpload = async (file: File) => {
  //   const validTypes = [
  //     "image/jpeg",
  //     "image/jpg",
  //     "image/png",
  //     "image/svg+xml",
  //   ];
  //   if (!validTypes.includes(file.type)) {
  //     onError("Failed", "Please select a valid image file (JPEG, PNG, SVG)");
  //     return;
  //   }

  //   if (file.size > 5 * 1024 * 1024) {
  //     onError("Failed", "File size must be less than 5MB");
  //     return;
  //   }

  //   try {
  //     setIsUploading(true);
  //     const promise = uploadLogo(file);
  //     currentUploadPromiseRef.current = promise;
  //     const imageUrl = await promise;
  //     setUploadedImageUrl(imageUrl);
  //     setIsImageDeleted(false);
  //   } catch (error) {
  //     onError("Failed", "Failed to upload logo. Please try again.");
  //   } finally {
  //     setIsUploading(false);
  //     currentUploadPromiseRef.current = null;
  //     if (fileInputRef.current) {
  //       fileInputRef.current.value = "";
  //     }
  //   }
  // };
  const processFileUpload = async (file: File) => {
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/svg+xml",
    ];
    if (!validTypes.includes(file.type)) {
      showToast(
        "error",
        "Failed",
        "Please select a valid image file (JPEG, PNG, SVG)"
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("error", "Failed", "File size must be less than 5MB");
      return;
    }

    try {
      setIsUploading(true);

      // 🔐 single authority for upload state
      const uploadPromise = uploadLogo(file);
      currentUploadPromiseRef.current = uploadPromise;

      const imageUrl = await uploadPromise;

      console.log("[IMAGE] Upload completed:", imageUrl);

      // ✅ UI updates immediately (offline OR online)
      setUploadedImageUrl(imageUrl);
      setIsImageDeleted(false);
    } catch (error) {
      showToast("error", "Failed", "Failed to upload logo. Please try again.");
    } finally {
      setIsUploading(false);
      currentUploadPromiseRef.current = null;

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Modal
      size={"md"}
      subtitle="Update and Manage Business Information"
      image={SettingFiles.BusinessIcon}
      isOpen={isOpen}
      onClose={onClose}
      title="Business Details"
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              disabled
              label="Name"
              value={details.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Enter business name"
              className={`w-full px-4 py-3 text-left bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#15BA5C] transition-colors ${getDisabledStyles(
                details.name
              )}`}
            />
          </div>

          <Input
            label="Email"
            type="email"
            disabled
            value={userData?.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="Enter Email Address"
            className={`w-full px-4 py-3 text-left bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#15BA5C] transition-colors ${getDisabledStyles(
              details.email as string
            )}`}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <div className="flex">
              {/* Country Code Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsPhoneCountryOpen(!isPhoneCountryOpen);
                  }}
                  className="flex items-center px-3 py-3 bg-white border border-gray-300 rounded-l-lg shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#15BA5C] transition-colors"
                >
                  {selectedPhoneCountry && (
                    <>
                      <CachedImg
                        src={selectedPhoneCountry.flag}
                        alt={selectedPhoneCountry.name + " flag"}
                        className="w-6 h-4 mr-2 rounded-sm border border-gray-200 object-cover"
                        width={24}
                        height={18}
                      />
                      <span className="text-gray-900 mr-2 font-medium">
                        {selectedPhoneCountry.dialCode}
                      </span>
                    </>
                  )}
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                {isPhoneCountryOpen && (
                  <div className="absolute z-20 left-0 mt-1 w-80 bg-white border border-gray-300 rounded-lg shadow-lg">
                    <div className="px-3 py-2 border-b border-gray-200">
                      <input
                        type="text"
                        value={phoneCountrySearchTerm}
                        onChange={(e) =>
                          setPhoneCountrySearchTerm(e.target.value)
                        }
                        placeholder="Search country or code..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#15BA5C] text-sm"
                        autoFocus
                      />
                    </div>

                    <div className="py-1 max-h-60 overflow-y-auto">
                      {filteredPhoneCountries.length > 0 ? (
                        filteredPhoneCountries.map((phoneCountry) => (
                          <button
                            key={phoneCountry.isoCode}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePhoneCountrySelect(phoneCountry);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between group"
                          >
                            <div className="flex items-center">
                              <CachedImg
                                src={phoneCountry.flag}
                                alt={phoneCountry.name + " flag"}
                                className="w-6 h-4 mr-3 rounded-sm border border-gray-200 object-cover"
                                width={24}
                                height={18}
                              />
                              <div>
                                <div className="text-gray-900 font-medium">
                                  {phoneCountry.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {phoneCountry.dialCode}
                                </div>
                              </div>
                            </div>
                            {selectedPhoneCountry?.isoCode ===
                              phoneCountry.isoCode && (
                              <Check className="h-4 w-4 text-[#15BA5C]" />
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          No countries found.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Phone Number Input */}
              <input
                type="tel"
                value={details.phone}
                onChange={(e) => {
                  const value = e.target.value;
                  handleChange("phone", value);
                  setPhoneError("");
                }}
                placeholder="Enter phone number"
                className={`flex-1 px-4 py-3 bg-white border border-l-0 border-gray-300 rounded-r-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#15BA5C] transition-colors ${
                  phoneError ? "border-red-300" : "hover:border-gray-400"
                }`}
              />
            </div>

            {phoneError && (
              <p className="mt-1 text-sm text-red-600">{phoneError}</p>
            )}
          </div>

          {/* Country Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <div className="relative">
              <button
                disabled
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setIsCountryOpen(!isCountryOpen);
                }}
                className={`w-full px-4 py-3 text-left bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#15BA5C] transition-colors ${getDisabledStyles(
                  details.country
                )}`}
              >
                <span
                  className={
                    selectedCountry ? "text-gray-900" : "text-gray-500"
                  }
                >
                  {selectedCountry ? (
                    <span className="flex items-center">
                      <CachedImg
                        src={`https://flagcdn.com/24x18/${selectedCountry.isoCode.toLowerCase()}.png`}
                        alt={selectedCountry.name + " flag"}
                        className="w-6 h-4 mr-2 rounded-sm border border-gray-200 object-cover"
                        width={20}
                        height={20}
                      />
                      {selectedCountry.name}
                    </span>
                  ) : (
                    "Select your country"
                  )}
                </span>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </button>

              {isCountryOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                  <div className="px-3 py-2 border-b border-gray-200">
                    <input
                      type="text"
                      value={countrySearchTerm}
                      onChange={(e) => setCountrySearchTerm(e.target.value)}
                      placeholder="Search country..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#15BA5C] text-sm"
                      autoFocus
                    />
                  </div>

                  <div className="py-1 max-h-60 overflow-y-auto">
                    {filteredCountries.length > 0 ? (
                      filteredCountries.map((country) => (
                        <button
                          key={country.isoCode}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handleCountrySelect(country);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between group"
                        >
                          <span className="flex items-center text-gray-900">
                            <CachedImg
                              src={`https://flagcdn.com/24x18/${country.isoCode.toLowerCase()}.png`}
                              alt={country.name + " flag"}
                              className="w-6 h-4 mr-2 rounded-sm border border-gray-200 object-cover"
                              width={20}
                              height={20}
                            />
                            {country.name}
                          </span>
                          {selectedCountry?.isoCode === country.isoCode && (
                            <Check className="h-4 w-4 text-[#15BA5C]" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        No countries found.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* State Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (selectedCountry) setIsStateOpen(!isStateOpen);
                }}
                disabled={!selectedCountry}
                className={`w-full px-4 py-3 text-left bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#15BA5C] transition-colors ${
                  !selectedCountry
                    ? "border-[#A6A6A6] text-gray-400 cursor-not-allowed"
                    : getDisabledStyles(details.state)
                }`}
              >
                <span
                  className={
                    selectedState || details.state
                      ? "text-gray-900"
                      : "text-gray-500"
                  }
                >
                  {details.state || selectedState?.name || "Select your state"}
                </span>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </button>

              {isStateOpen && selectedCountry && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                  <div className="px-3 py-2 border-b border-gray-200">
                    <input
                      type="text"
                      value={stateSearchTerm}
                      onChange={(e) => setStateSearchTerm(e.target.value)}
                      placeholder="Search state..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#15BA5C] text-sm"
                      autoFocus
                    />
                  </div>

                  <div className="py-1 max-h-60 overflow-y-auto">
                    {filteredStates.length > 0 ? (
                      filteredStates.map((state) => (
                        <button
                          key={state.isoCode}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handleStateSelect(state);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between group"
                        >
                          <span className="text-gray-900">{state.name}</span>
                          {selectedState?.isoCode === state.isoCode && (
                            <Check className="h-4 w-4 text-[#15BA5C]" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        No states found.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Input
            disabled
            label="Street Address"
            value={details.address}
            onChange={(e) => handleChange("address", e.target.value)}
            placeholder="Enter street address"
            className={`w-full px-4 py-3 text-left bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#15BA5C] transition-colors ${getDisabledStyles(
              details.address
            )}`}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Type
            </label>
            <div className="relative">
              <button
                disabled
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setIsBusinessTypeOpen(!isBusinessTypeOpen);
                }}
                className={`w-full px-4 py-3 text-left bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#15BA5C] transition-colors ${getDisabledStyles(
                  businessType
                )}`}
              >
                <span
                  className={businessType ? "text-gray-900" : "text-gray-500"}
                >
                  {businessTypesConstants.find(
                    (val) => val.value == details?.businessType
                  )?.label || details.businessType}
                </span>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </button>

              {isBusinessTypeOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                  <div className="py-1">
                    {businessTypes.map((type, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleBusinessTypeSelect(type);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between group"
                      >
                        <span className="text-gray-900">{type}</span>
                        {businessType === type && (
                          <Check className="h-4 w-4 text-[#15BA5C]" />
                        )}
                      </button>
                    ))}

                    {!isAddingNew ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsAddingNew(true);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center text-[#15BA5C] font-medium"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Business
                      </button>
                    ) : (
                      <div className="px-4 py-2 border-t border-gray-100">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={newBusinessType}
                            onChange={(e) => setNewBusinessType(e.target.value)}
                            placeholder="Enter business type"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#15BA5C]"
                            autoFocus
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddBusinessType();
                              }
                            }}
                          />
                          <button
                            title="Check"
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              handleAddBusinessType();
                            }}
                            className="p-2 bg-[#15BA5C] text-white rounded-md hover:bg-[#13A652] transition-colors"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            title="Close"
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setIsAddingNew(false);
                              setNewBusinessType("");
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Input
            label="Postal Code"
            value={details.postalCode}
            onChange={(e) => handleChange("postalCode", e.target.value)}
            placeholder="Enter postal code"
            className={`w-full px-4 py-3 text-left bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#15BA5C] transition-colors ${getDisabledStyles(
              details.postalCode
            )}`}
          />
        </div>

        {/* Logo Upload Section */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Logo (Optional)
          </label>

          {/* Show existing logo if available and not deleted */}
          {(uploadedImageUrl || selectedOutlet?.logoUrl) && !isImageDeleted ? (
            <div className="w-full mb-4">
              <section className="relative h-[250px] w-full border border-gray-200 rounded-lg overflow-hidden">
                <CachedImg
                  src={uploadedImageUrl || (selectedOutlet?.logoUrl as string)}
                  alt="Business logo"
                  className="object-contain"
                  fill
                  sizes="100vw"
                />

                <button
                  type="button"
                  onClick={handleDeleteImage}
                  className="absolute px-2.5 py-2.5 flex items-center justify-center rounded-full top-2.5 right-2.5 z-50 bg-[#15BA5C] text-white font-bold transition-colors hover:bg-[#13A652]"
                  title="Remove logo"
                >
                  <CiEdit className="h-5 w-5" />
                </button>
              </section>
            </div>
          ) : (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragOver
                  ? "border-[#15BA5C] bg-green-50"
                  : "border-gray-300 hover:border-[#15BA5C] hover:bg-gray-50"
              } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleUploadClick}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.svg"
                onChange={handleFileInputChange}
                className="hidden"
                disabled={isUploading}
              />

              <div className="flex flex-col items-center">
                {isUploading ? (
                  <>
                    <Loader2 className="w-12 h-12 text-[#15BA5C] mb-4 animate-spin" />
                    <p className="text-[#15BA5C] font-medium mb-1">
                      Uploading...
                    </p>
                    <p className="text-sm text-gray-600">
                      Please wait while we upload your logo
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 font-medium mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-gray-500">
                      SVG, PNG, JPG (max. 5MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col mt-6">
          <button
            disabled={loading || !isDirty}
            className={`w-full py-2.5 font-medium rounded-[10px] transition-colors flex items-center justify-center gap-2
        ${
          loading || !isDirty
            ? "bg-[#A1A1A1] cursor-not-allowed"
            : "bg-[#15BA5C] hover:bg-[#13A652] text-white"
        }`}
            type="submit"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Saving..." : "Save Details"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
const CachedImg: React.FC<{
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  sizes?: string;
}> = ({ src, alt, width, height, className, fill, sizes }) => {
  const [resolved, setResolved] = useState<string>(src);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const w = window as unknown as {
          electronAPI?: { cacheGet: (key: string) => Promise<any> };
        };
        const api = w.electronAPI;
        if (!api) return;
        const cached = await api.cacheGet(`image:${src}`);
        if (active && cached && cached.data) setResolved(String(cached.data));
      } catch {}
    })();
    return () => {
      active = false;
    };
  }, [src]);
  return (
    <img
      src={resolved}
      alt={alt}
      width={width}
      height={height}
      className={className}
      {...(fill ? { fill: true } : {})}
      {...(sizes ? { sizes } : {})}
    />
  );
};
