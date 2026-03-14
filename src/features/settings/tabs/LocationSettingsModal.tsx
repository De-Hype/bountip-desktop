"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Loader2, Trash2, ChevronDown } from "lucide-react";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import SettingFiles from "@/assets/icons/settings";
import { getPhoneCountries, PhoneCountry } from "@/utils/getPhoneCountries";
import useToastStore from "@/stores/toastStore";
import {
  useLocationStore,
  BusinessLocation,
  generateNewLocationId,
} from "@/stores/locationStore";
import { useBusinessStore } from "@/stores/useBusinessStore";

interface LocationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type LocationForm = Pick<
  BusinessLocation,
  "name" | "address" | "phoneNumber" | "isDefault"
>;

type NewLocationForm = {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
};

const createEmptyNewLocation = (): NewLocationForm => ({
  id: generateNewLocationId(),
  name: "",
  address: "",
  phoneNumber: "",
});

export const LocationSettingsModal: React.FC<LocationSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { showToast } = useToastStore();
  const {
    locations,
    addLocation,
    updateLocation,
    deleteLocation,
    setLocations,
  } = useLocationStore();
  const {
    addOutletLocal,
    removeOutletLocal,
    updateOutletLocal,
    fetchBusinessData,
  } = useBusinessStore();

  const [phoneCountries, setPhoneCountries] = useState<PhoneCountry[]>([]);
  const [selectedPhoneCountries, setSelectedPhoneCountries] = useState<
    Record<string, PhoneCountry | null>
  >({});
  const [openPhonePickerFor, setOpenPhonePickerFor] = useState<string | null>(
    null,
  );
  const [phoneCountrySearchTerm, setPhoneCountrySearchTerm] = useState("");

  const [locationForms, setLocationForms] = useState<
    Record<string, LocationForm>
  >({});
  const [newLocations, setNewLocations] = useState<NewLocationForm[]>([
    createEmptyNewLocation(),
  ]);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(
    null,
  );
  const [savingLocationId, setSavingLocationId] = useState<string | null>(null);
  const [deletingLocationId, setDeletingLocationId] = useState<string | null>(
    null,
  );
  const [isSavingNewLocations, setIsSavingNewLocations] = useState(false);

  const parsedLocations = useMemo<BusinessLocation[]>(
    () => locations,
    [locations],
  );

  const defaultLocation = parsedLocations.find((loc) => loc.isDefault);
  const otherLocations = parsedLocations.filter((loc) => !loc.isDefault);

  const defaultPhoneCountry = useMemo(() => {
    if (phoneCountries.length === 0) return null;
    return (
      phoneCountries.find((country) => country.isoCode === "NG") ||
      phoneCountries[0] ||
      null
    );
  }, [phoneCountries]);

  const getFallbackPhoneCountry = useCallback(
    () => defaultPhoneCountry || phoneCountries[0] || null,
    [defaultPhoneCountry, phoneCountries],
  );

  const parsePhoneValue = useCallback(
    (phoneNumber?: string) => {
      if (!phoneNumber) {
        return {
          nationalNumber: "",
          country: getFallbackPhoneCountry(),
        };
      }

      const parsed = parsePhoneNumberFromString(phoneNumber);
      if (parsed?.countryCallingCode) {
        const matched = phoneCountries.find(
          (country) =>
            country.dialCode.replace("+", "") === parsed.countryCallingCode,
        );
        return {
          nationalNumber: parsed.nationalNumber?.toString() || phoneNumber,
          country: matched || getFallbackPhoneCountry(),
        };
      }

      return {
        nationalNumber: phoneNumber,
        country: getFallbackPhoneCountry(),
      };
    },
    [getFallbackPhoneCountry, phoneCountries],
  );

  const filteredPhoneCountries = useMemo(() => {
    if (!phoneCountrySearchTerm.trim()) return phoneCountries;
    const term = phoneCountrySearchTerm.toLowerCase();
    return phoneCountries.filter(
      (country) =>
        country.name.toLowerCase().includes(term) ||
        country.dialCode.replace("+", "").includes(phoneCountrySearchTerm),
    );
  }, [phoneCountries, phoneCountrySearchTerm]);

  const togglePhoneCountryDropdown = (key: string) => {
    setOpenPhonePickerFor((prev) => (prev === key ? null : key));
    setPhoneCountrySearchTerm("");
  };

  const sanitizePhone = useCallback(
    (value: string) => value.replace(/[A-Za-z]/g, ""),
    [],
  );
  const handlePhoneKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (k.length === 1 && /[A-Za-z]/.test(k)) {
        e.preventDefault();
      }
    },
    [],
  );

  const handlePhoneCountrySelect = (
    key: string,
    phoneCountry: PhoneCountry,
  ) => {
    setSelectedPhoneCountries((prev) => ({
      ...prev,
      [key]: phoneCountry,
    }));
    setOpenPhonePickerFor(null);
    setPhoneCountrySearchTerm("");
  };

  const renderPhoneCountrySelector = (key: string) => {
    const selectedCountry =
      selectedPhoneCountries[key] || getFallbackPhoneCountry();

    return (
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            togglePhoneCountryDropdown(key);
          }}
          className="flex items-center justify-between min-w-[100px] h-full px-2.5 py-2 bg-white border border-gray-300 rounded-l-lg shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#15BA5C] transition-colors"
        >
          {selectedCountry && (
            <div className="flex items-center">
              <img
                src={selectedCountry.flag}
                alt={`${selectedCountry.name} flag`}
                className="w-5 h-3.5 mr-1.5 rounded-sm border border-gray-200 object-cover shrink-0"
              />
              <span className="text-gray-900 text-sm font-semibold whitespace-nowrap">
                {selectedCountry.dialCode}
              </span>
            </div>
          )}
          <ChevronDown className="h-4 w-4 text-gray-400 shrink-0 ml-1" />
        </button>

        {openPhonePickerFor === key && (
          <div className="absolute z-20 left-0 mt-1 w-80 bg-white border border-gray-300 rounded-lg shadow-lg">
            <div className="px-3 py-2 border-b border-gray-200">
              <input
                type="text"
                value={phoneCountrySearchTerm}
                onChange={(e) => setPhoneCountrySearchTerm(e.target.value)}
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
                      handlePhoneCountrySelect(key, phoneCountry);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between group"
                  >
                    <div className="flex items-center">
                      <img
                        src={phoneCountry.flag}
                        alt={`${phoneCountry.name} flag`}
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
                    {selectedCountry?.isoCode === phoneCountry.isoCode && (
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
    );
  };
  useEffect(() => {
    setPhoneCountries(getPhoneCountries());
  }, []);

  useEffect(() => {
    if (phoneCountries.length === 0) return;

    setSelectedPhoneCountries((prev) => {
      const updated = { ...prev };
      newLocations.forEach((location) => {
        const key = `new-${location.id}`;
        if (!updated[key]) {
          updated[key] = getFallbackPhoneCountry();
        }
      });
      return updated;
    });
  }, [newLocations, getFallbackPhoneCountry, phoneCountries]);

  useEffect(() => {
    if (isOpen) {
      // Fetch outlets from DB
      if (window.electronAPI) {
        window.electronAPI.getOutlets().then((outlets: any[]) => {
          const mapped = outlets
            .filter((o) => !o.isDeleted)
            .map((o) => ({
              id: o.id,
              name: o.name,
              address: o.address,
              phoneNumber: o.phoneNumber,
              isDefault: !!o.isMainLocation,
            }));
          setLocations(mapped);
        });
      }
    }
  }, [isOpen, setLocations]);

  useEffect(() => {
    if (!isOpen || phoneCountries.length === 0) return;

    const initialForms: Record<string, LocationForm> = {};
    const phoneSelections: Record<string, PhoneCountry | null> = {};

    parsedLocations.forEach((loc) => {
      const { nationalNumber, country } = parsePhoneValue(loc.phoneNumber);
      initialForms[loc.id] = {
        name: loc.name,
        address: loc.address,
        phoneNumber: nationalNumber,
        isDefault: loc.isDefault,
      };
      phoneSelections[loc.id] = country;
    });

    setLocationForms(initialForms);
    setEditingLocationId(null);
    setSelectedPhoneCountries((prev) => {
      const preservedExistingEntries = Object.fromEntries(
        Object.entries(prev).filter(([key]) => !key.startsWith("new-")),
      );
      return { ...preservedExistingEntries, ...phoneSelections };
    });
    setNewLocations([createEmptyNewLocation()]);
  }, [isOpen, parsedLocations, parsePhoneValue, phoneCountries]);

  const isLocationComplete = (location?: Partial<NewLocationForm>) =>
    Boolean(
      location?.name?.trim() &&
      location?.address?.trim() &&
      location?.phoneNumber?.trim(),
    );

  const isLastNewLocationComplete = () =>
    newLocations.length === 0 ||
    isLocationComplete(newLocations[newLocations.length - 1]);

  const canSaveNewLocations =
    newLocations.length > 0 && newLocations.every(isLocationComplete);

  const addNewLocationField = () => {
    if (!isLastNewLocationComplete()) {
      showToast(
        "error",
        "Incomplete Location",
        "Please fill in the current location before adding another.",
      );
      return;
    }

    setNewLocations((prev) => [...prev, createEmptyNewLocation()]);
  };

  const updateNewLocation = (
    index: number,
    field: keyof NewLocationForm,
    value: string,
  ) => {
    setNewLocations((prev) =>
      prev.map((loc, i) => (i === index ? { ...loc, [field]: value } : loc)),
    );
  };

  const removeNewLocation = (index: number) => {
    setNewLocations((prev) => {
      const locationToRemove = prev[index];
      const remaining = prev.filter((_, i) => i !== index);

      setSelectedPhoneCountries((prevSelected) => {
        if (!locationToRemove) return prevSelected;
        const updated = { ...prevSelected };
        delete updated[`new-${locationToRemove.id}`];
        return updated;
      });

      return remaining;
    });
  };

  const handleExistingLocationChange = (
    id: string,
    field: keyof NewLocationForm,
    value: string,
  ) => {
    setLocationForms((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const toggleEditLocation = (id: string) => {
    setOpenPhonePickerFor(null);
    setPhoneCountrySearchTerm("");
    setEditingLocationId(id);
  };

  const resetLocationForm = (id: string) => {
    const original = parsedLocations.find((loc) => loc.id === id);
    if (!original) return;

    const { nationalNumber, country } = parsePhoneValue(original.phoneNumber);

    setLocationForms((prev) => ({
      ...prev,
      [id]: {
        name: original.name,
        address: original.address,
        phoneNumber: nationalNumber,
        isDefault: original.isDefault,
      },
    }));
    setSelectedPhoneCountries((prev) => ({
      ...prev,
      [id]: country,
    }));
    setEditingLocationId(null);
  };

  const handleSaveExistingLocation = async (locationId: string) => {
    const form = locationForms[locationId];
    const trimmedForm = {
      name: form?.name?.trim() ?? "",
      address: form?.address?.trim() ?? "",
      phoneNumber: form?.phoneNumber?.trim() ?? "",
    };

    if (!trimmedForm.name || !trimmedForm.address || !trimmedForm.phoneNumber) {
      showToast(
        "error",
        "Missing Information",
        "Please complete all fields before saving the location.",
      );
      return;
    }

    const original = parsedLocations.find((loc) => loc.id === locationId);
    if (
      original &&
      original.name === trimmedForm.name &&
      original.address === trimmedForm.address &&
      original.phoneNumber === trimmedForm.phoneNumber
    ) {
      showToast(
        "error",
        "No Changes Detected",
        "Update the details before saving.",
      );
      return;
    }

    setSavingLocationId(locationId);

    const selectedCountry = selectedPhoneCountries[locationId];
    const phoneWithDialCode = selectedCountry?.dialCode
      ? `${selectedCountry.dialCode}${trimmedForm.phoneNumber}`
      : trimmedForm.phoneNumber;

    try {
      if (window.electronAPI) {
        await window.electronAPI.updateOutlet({
          outletId: locationId,
          location: {
            name: trimmedForm.name,
            address: trimmedForm.address,
            phoneNumber: phoneWithDialCode,
          },
        });
      }

      updateLocation(locationId, {
        name: trimmedForm.name,
        address: trimmedForm.address,
        phoneNumber: phoneWithDialCode,
      });

      updateOutletLocal(locationId, {
        name: trimmedForm.name,
        address: trimmedForm.address,
        phoneNumber: phoneWithDialCode,
      });

      setEditingLocationId(null);
      showToast(
        "success",
        "Location Updated",
        "Business location updated successfully.",
      );

      // Trigger a business data refresh to ensure UI is in sync
      await fetchBusinessData();
    } catch (error) {
      console.error(error);
      showToast("error", "Error", "Failed to update location.");
    } finally {
      setSavingLocationId(null);
    }
  };

  const handleDeleteExistingLocation = async (location: BusinessLocation) => {
    if (location.isDefault) {
      showToast(
        "error",
        "Cannot Delete Default Location",
        "Please set another default location before deleting this one.",
      );
      return;
    }

    setDeletingLocationId(location.id);

    try {
      if (window.electronAPI) {
        await window.electronAPI.deleteOutlet({ outletId: location.id });
      }

      deleteLocation(location.id);
      removeOutletLocal(location.id);

      setLocationForms((prev) => {
        const updated = { ...prev };
        delete updated[location.id];
        return updated;
      });

      if (editingLocationId === location.id) {
        setEditingLocationId(null);
      }

      setSelectedPhoneCountries((prev) => {
        const updated = { ...prev };
        delete updated[location.id];
        return updated;
      });

      showToast(
        "success",
        "Location Deleted",
        "The business location has been removed.",
      );
      // Trigger a business data refresh to ensure UI is in sync
      await fetchBusinessData();
    } catch (error) {
      console.error(error);
      showToast("error", "Error", "Failed to delete location.");
    } finally {
      setDeletingLocationId(null);
    }
  };

  const handleSaveNewLocations = async () => {
    if (newLocations.length === 0) {
      showToast(
        "error",
        "No Locations to Save",
        "Add at least one new location before saving.",
      );
      return;
    }

    if (!canSaveNewLocations) {
      showToast(
        "error",
        "Incomplete Locations",
        "Ensure every new location has a name, address and phone number.",
      );
      return;
    }

    setIsSavingNewLocations(true);

    try {
      if (!window.electronAPI) {
        // Fallback for dev/browser without electron
        const hasExistingLocations = parsedLocations.length > 0;
        newLocations.forEach((location, index) => {
          const key = `new-${location.id}`;
          const selectedCountry = selectedPhoneCountries[key];
          const phoneWithDialCode = selectedCountry?.dialCode
            ? `${selectedCountry.dialCode}${location.phoneNumber.trim()}`
            : location.phoneNumber.trim();

          addLocation({
            id: location.id,
            name: location.name.trim(),
            address: location.address.trim(),
            phoneNumber: phoneWithDialCode,
            isDefault: hasExistingLocations ? false : index === 0,
          });
        });
        setNewLocations([createEmptyNewLocation()]);
        showToast(
          "success",
          "Locations Added",
          "New business locations have been added successfully.",
        );
        setIsSavingNewLocations(false);
        return;
      }

      // Fetch business ID
      const businesses = await window.electronAPI.dbQuery(
        "SELECT id FROM business LIMIT 1",
      );
      const businessId = businesses[0]?.id;

      if (!businessId) {
        showToast("error", "Error", "No business found.");
        setIsSavingNewLocations(false);
        return;
      }

      const hasExistingLocations = parsedLocations.length > 0;

      for (let i = 0; i < newLocations.length; i++) {
        const location = newLocations[i];
        const key = `new-${location.id}`;
        const selectedCountry = selectedPhoneCountries[key];
        const phoneWithDialCode = selectedCountry?.dialCode
          ? `${selectedCountry.dialCode}${location.phoneNumber.trim()}`
          : location.phoneNumber.trim();

        const isDefault = hasExistingLocations ? false : i === 0;

        const res = await window.electronAPI.createOutlet({
          businessId,
          location: {
            name: location.name.trim(),
            address: location.address.trim(),
            phoneNumber: phoneWithDialCode,
            isMainLocation: isDefault,
          },
        });

        if (res && res.success) {
          addLocation({
            id: res.outlet.id,
            name: res.outlet.name,
            address: res.outlet.address,
            phoneNumber: res.outlet.phoneNumber,
            isDefault: res.outlet.isMainLocation === 1,
          });

          addOutletLocal({
            id: res.outlet.id,
            name: res.outlet.name,
            address: res.outlet.address,
            phoneNumber: res.outlet.phoneNumber,
            isMainLocation: res.outlet.isMainLocation === 1,
            businessId: businessId,
            isOnboarded: 0,
            isActive: 1,
            isDeleted: 0,
            createdAt: res.outlet.createdAt,
            updatedAt: res.outlet.updatedAt,
          });
        }
      }

      setNewLocations([createEmptyNewLocation()]);
      showToast(
        "success",
        "Locations Added",
        "New business locations have been added successfully.",
      );
      // Trigger a business data refresh to ensure UI is in sync
      await fetchBusinessData();
    } catch (error) {
      console.error(error);
      showToast("error", "Error", "Failed to save locations.");
    } finally {
      setIsSavingNewLocations(false);
    }
  };

  const renderLocationCard = (location: BusinessLocation) => {
    const isEditing = editingLocationId === location.id;
    const form = locationForms[location.id];
    const isSaving = savingLocationId === location.id;
    const isDeleting = deletingLocationId === location.id;

    if (isEditing) {
      return (
        <div
          key={location.id}
          className="border border-gray-200 rounded-lg p-4 bg-gray-50"
        >
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <Input
                value={form?.name || ""}
                onChange={(e) =>
                  handleExistingLocationChange(
                    location.id,
                    "name",
                    e.target.value,
                  )
                }
                placeholder="Enter Name e.g Main Branch"
              />
            </div>
            <div className="col-span-12 lg:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <Input
                value={form?.address || ""}
                onChange={(e) =>
                  handleExistingLocationChange(
                    location.id,
                    "address",
                    e.target.value,
                  )
                }
                placeholder="Enter Address"
              />
            </div>
            <div className="col-span-12 lg:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="flex">
                {renderPhoneCountrySelector(location.id)}
                <input
                  type="tel"
                  value={form?.phoneNumber || ""}
                  onChange={(e) =>
                    handleExistingLocationChange(
                      location.id,
                      "phoneNumber",
                      sanitizePhone(e.target.value),
                    )
                  }
                  onKeyDown={handlePhoneKeyDown}
                  placeholder="Enter phone number"
                  className="flex-1 min-w-0 px-4 py-2 bg-white border border-l-0 border-gray-300 rounded-r-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#15BA5C] transition-colors"
                />
              </div>
            </div>
            <div className="col-span-12 flex flex-row gap-3 justify-end mt-4 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => resetLocationForm(location.id)}
                className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveExistingLocation(location.id)}
                disabled={isSaving}
                className="min-w-[140px] flex items-center justify-center gap-2 px-8 py-2.5 rounded-lg text-white bg-[#15BA5C] hover:bg-[#12a04f] disabled:opacity-60 font-semibold transition-all duration-200 shadow-md active:scale-95"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={location.id}
        className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <span className="font-medium block">{location.name}</span>
          <p className="text-sm text-gray-600 mt-1">{location.address}</p>
          <p className="text-sm text-gray-600">{location.phoneNumber}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => toggleEditLocation(location.id)}
            className="bg-[#15BA5C] flex items-center rounded-[20px] px-3 py-2"
          >
            <img
              src={SettingFiles.EditIcon}
              alt="Edit"
              className="h-[14px] w-[14px] mr-1"
            />
            <span className="text-white text-sm">Edit</span>
          </button>
          <button
            type="button"
            onClick={() => handleDeleteExistingLocation(location)}
            disabled={location.isDefault || isDeleting}
            className="w-[40px] h-[40px] flex items-center justify-center border rounded-lg text-[#E33629] border-[#E33629] hover:bg-[#E33629] hover:text-white disabled:opacity-50 disabled:hover:bg-transparent"
            title={
              location.isDefault ? "Default location cannot be deleted" : ""
            }
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <Modal
      size="md"
      subtitle="Add, edit or delete multiple business locations"
      image={SettingFiles.LocationIcon}
      isOpen={isOpen}
      onClose={onClose}
      title="Location"
    >
      <div className="space-y-6">
        {/* <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-900">
            Manage all your outlets from here. Enable editing to update details,
            use the delete icon to remove an outlet, or add completely new
            locations below.
          </p>
        </div> */}

        <div>
          <h3 className="font-medium text-gray-900 mb-4">
            Default Business Location
          </h3>
          {defaultLocation ? (
            renderLocationCard(defaultLocation)
          ) : (
            <p className="text-gray-600">No default location set</p>
          )}
        </div>

        <div>
          <h3 className="font-medium text-gray-900 mb-4">
            Other Business Locations
          </h3>
          <div className="space-y-4">
            {otherLocations.length > 0 ? (
              otherLocations.map((location) => renderLocationCard(location))
            ) : (
              <p className="text-gray-600">No other locations available</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-medium text-gray-900 mb-4">Add New Locations</h3>
          {newLocations.map((location, index) => (
            <div
              key={location.id}
              className="grid grid-cols-12 gap-4 items-end mb-4 border border-dashed border-gray-300 rounded-lg p-4"
            >
              <div className="col-span-12 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <Input
                  value={location.name}
                  onChange={(e) =>
                    updateNewLocation(index, "name", e.target.value)
                  }
                  placeholder="Enter Name e.g Abuja Branch"
                />
              </div>
              <div className="col-span-12 lg:col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <Input
                  value={location.address}
                  onChange={(e) =>
                    updateNewLocation(index, "address", e.target.value)
                  }
                  placeholder="Enter Address"
                />
              </div>
              <div className="col-span-12 lg:col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="flex">
                  {renderPhoneCountrySelector(`new-${location.id}`)}
                  <input
                    type="tel"
                    value={location.phoneNumber}
                    onChange={(e) =>
                      updateNewLocation(
                        index,
                        "phoneNumber",
                        sanitizePhone(e.target.value),
                      )
                    }
                    onKeyDown={handlePhoneKeyDown}
                    placeholder="Enter phone number"
                    className="flex-1 min-w-0 px-4 py-2 bg-white border border-l-0 border-gray-300 rounded-r-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#15BA5C] transition-colors"
                  />
                </div>
              </div>
              <div className="col-span-12 lg:col-span-1 flex justify-end pb-1">
                <button
                  type="button"
                  onClick={() => removeNewLocation(index)}
                  className="w-[42px] h-[42px] flex items-center justify-center text-[#E33629] border border-gray-200 rounded-lg hover:border-[#E33629] hover:bg-red-50 transition-all duration-200 shadow-sm"
                  title="Remove location"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addNewLocationField}
          className="border border-gray-300 w-full text-gray-700 py-3 rounded-[10px] font-medium text-base mt-2 hover:bg-gray-50 disabled:opacity-50"
          type="button"
          disabled={!isLastNewLocationComplete()}
        >
          + Add a New Location
        </button>

        <div className="flex justify-end pt-4">
          <button
            onClick={handleSaveNewLocations}
            className="flex items-center justify-center gap-2 bg-[#15BA5C] hover:bg-[#12a04f] w-full text-white py-3.5 rounded-[12px] font-bold text-lg mt-4 disabled:opacity-60 transition-all duration-200 shadow-lg active:scale-[0.98]"
            type="button"
            disabled={!canSaveNewLocations || isSavingNewLocations}
          >
            {isSavingNewLocations ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Saving New Locations...</span>
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                <span>Save All New Locations</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
