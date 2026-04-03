import { Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Switch } from "../../ui/Switch";
import { TimeDropdownSplit } from "../../ui/TimeDropdownSplit";
import { useBusinessStore } from "@/stores/useBusinessStore";
import useToastStore from "@/stores/toastStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import storeFrontService from "@/services/storefrontService";
import { BankDetails, OperatingHours } from "@/types/storefront";
import { getBanksByCountry } from "@/utils/banks";
import { Dropdown } from "@/shared/AppDropdowns/CreateDropdown";

interface DayHours {
  day: string;
  enabled: boolean;
  openTime: string;
  closeTime: string;
}

const DAYS_OF_WEEK = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const getDefaultOperatingHours = (): DayHours[] => {
  return DAYS_OF_WEEK.map((day) => ({
    day: day.charAt(0).toUpperCase() + day.slice(1),
    enabled: false,
    openTime: "09:00",
    closeTime: "17:00",
  }));
};

type BusinessOperationsProps = {
  outletId?: string | null;
  country?: string | null;
  storeCode?: string | null;
  initialOperatingHours?: OperatingHours | null;
  initialLeadTime?: number | null;
  initialBankDetails?: BankDetails | null;
  initialBusinessOperation?: {
    delivery: boolean;
    pickup: boolean;
    both: boolean;
  } | null;
  onSaved?: () => void | Promise<void>;
};

const BusinessOperations = ({
  outletId,
  country,
  storeCode,
  initialOperatingHours,
  initialLeadTime,
  initialBankDetails,
  initialBusinessOperation,
  onSaved,
}: BusinessOperationsProps) => {
  const { selectedOutlet: outlet } = useBusinessStore();
  const { showToast } = useToastStore();
  const { isOnline } = useNetworkStore();
  const [operatingHours, setOperatingHours] = useState<DayHours[]>(
    getDefaultOperatingHours(),
  );
  const [isEditingLocation, setIsEditingLocation] = useState(true);
  const [applyToAll, setApplyToAll] = useState(false);
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);
  const [pickupEnabled, setPickupEnabled] = useState(false);
  const [bankName, setBankName] = useState("");
  const [bankNameMode, setBankNameMode] = useState<"select" | "other">(
    "select",
  );
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [iban, setIban] = useState("");
  const [swiftCode, setSwiftCode] = useState("");
  const [sortCode, setSortCode] = useState("");
  const [showAdditionalBankDetails, setShowAdditionalBankDetails] =
    useState(false);

  const [leadDays, setLeadDays] = useState("0");
  const [leadHours, setLeadHours] = useState("0");
  const [leadMinutes, setLeadMinutes] = useState("0");

  const [isSaving, setIsSaving] = useState(false);

  const effectiveOutletId = outletId ?? outlet?.id ?? null;
  const effectiveCountry = country ?? (outlet as any)?.country ?? null;
  const effectiveStoreCode = storeCode ?? "";

  const bankOptions = useMemo(() => {
    const banks = getBanksByCountry(String(effectiveCountry || "")).slice();
    banks.sort((a, b) => a.localeCompare(b));
    return banks;
  }, [effectiveCountry]);
  const bankDropdownOptions = useMemo(
    () => [
      ...bankOptions.map((b) => ({ value: b, label: b })),
      { value: "__OTHER__", label: "Other" },
    ],
    [bankOptions],
  );

  const leadTimeTotalSeconds = useMemo(() => {
    const d = Number(leadDays) || 0;
    const h = Number(leadHours) || 0;
    const m = Number(leadMinutes) || 0;
    return Math.max(0, d * 24 * 60 * 60 + h * 60 * 60 + m * 60);
  }, [leadDays, leadHours, leadMinutes]);

  const baselineKey = useMemo(() => {
    const normalize = (v: any) => String(v ?? "").trim();
    const hoursKey = JSON.stringify(
      operatingHours.map((d) => ({
        day: d.day.toLowerCase(),
        enabled: Boolean(d.enabled),
        open: d.openTime,
        close: d.closeTime,
      })),
    );
    return JSON.stringify({
      deliveryEnabled,
      pickupEnabled,
      bankName: normalize(bankName),
      accountNumber: normalize(accountNumber),
      accountName: normalize(accountName),
      iban: normalize(iban),
      swiftCode: normalize(swiftCode),
      sortCode: normalize(sortCode),
      leadTime: leadTimeTotalSeconds,
      operatingHours: hoursKey,
    });
  }, [
    accountName,
    accountNumber,
    bankName,
    deliveryEnabled,
    iban,
    leadTimeTotalSeconds,
    operatingHours,
    pickupEnabled,
    sortCode,
    swiftCode,
  ]);
  const [savedBaselineKey, setSavedBaselineKey] = useState("");

  const isDirty = useMemo(() => {
    if (!savedBaselineKey) return false;
    return baselineKey !== savedBaselineKey;
  }, [baselineKey, savedBaselineKey]);

  const canSave = useMemo(() => {
    return Boolean(effectiveOutletId) && isDirty && !isSaving;
  }, [effectiveOutletId, isDirty, isSaving]);

  useEffect(() => {
    setSavedBaselineKey("");
    let hoursToSet = getDefaultOperatingHours();

    const rawHours = initialOperatingHours ?? outlet?.operatingHours ?? null;
    if (rawHours) {
      const h = rawHours;

      hoursToSet = DAYS_OF_WEEK.map((day) => ({
        day: day.charAt(0).toUpperCase() + day.slice(1),
        enabled: h[day as keyof typeof h]?.isActive ?? false,
        openTime: h[day as keyof typeof h]?.open ?? "09:00",
        closeTime: h[day as keyof typeof h]?.close ?? "17:00",
      }));
    }

    setOperatingHours(hoursToSet);
  }, [initialOperatingHours, outlet]);

  useEffect(() => {
    setSavedBaselineKey("");
    const op = initialBusinessOperation ?? null;
    const delivery = Boolean((op as any)?.delivery);
    const pickup = Boolean((op as any)?.pickup);
    const both = Boolean((op as any)?.both);
    if (both) {
      setDeliveryEnabled(true);
      setPickupEnabled(true);
      return;
    }
    setDeliveryEnabled(delivery);
    setPickupEnabled(pickup);
  }, [initialBusinessOperation]);

  useEffect(() => {
    setSavedBaselineKey("");
    const bd = initialBankDetails ?? null;
    const nextBankName = String(bd?.bankName || "").trim();
    setBankName(nextBankName);
    setAccountName(String(bd?.accountName || "").trim());
    setAccountNumber(String(bd?.accountNumber || "").trim());
    setIban(String(bd?.iban || "").trim());
    setSwiftCode(String(bd?.swiftCode || "").trim());
    setSortCode(String(bd?.sortCode || "").trim());

    const hasOptional =
      String(bd?.iban || "").trim().length > 0 ||
      String(bd?.swiftCode || "").trim().length > 0 ||
      String(bd?.sortCode || "").trim().length > 0;
    setShowAdditionalBankDetails(hasOptional);

    const inList = nextBankName
      ? bankOptions.some((b) => b.toLowerCase() === nextBankName.toLowerCase())
      : true;
    setBankNameMode(inList ? "select" : "other");
  }, [bankOptions, initialBankDetails]);

  useEffect(() => {
    setSavedBaselineKey("");
    const totalSeconds = Number(initialLeadTime ?? 0) || 0;
    const d = Math.floor(totalSeconds / (24 * 60 * 60));
    const h = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const m = Math.floor((totalSeconds % (60 * 60)) / 60);
    setLeadDays(String(d));
    setLeadHours(String(h));
    setLeadMinutes(String(m));
  }, [initialLeadTime]);

  useEffect(() => {
    if (savedBaselineKey) return;
    setSavedBaselineKey(baselineKey);
  }, [baselineKey, savedBaselineKey]);

  const handleDayToggle = (dayIndex: number) => {
    if (isSaving) return;
    setOperatingHours((prev) => {
      const nextEnabled = !prev[dayIndex]?.enabled;
      if (!applyToAll) {
        return prev.map((d, i) =>
          i === dayIndex ? { ...d, enabled: nextEnabled } : d,
        );
      }
      return prev.map((d) => ({ ...d, enabled: nextEnabled }));
    });
  };

  const handleTimeChange = (
    dayIndex: number,
    field: "openTime" | "closeTime",
    value: string,
  ) => {
    if (isSaving) return;
    setOperatingHours((prev) => {
      if (!applyToAll) {
        return prev.map((d, i) =>
          i === dayIndex ? { ...d, [field]: value } : d,
        );
      }
      return prev.map((d) => ({ ...d, [field]: value }));
    });
  };

  const handleSave = async () => {
    if (!effectiveOutletId) return;
    if (!isOnline) {
      showToast(
        "error",
        "You’re offline",
        "Connect to the internet to save business operations.",
      );
      return;
    }
    if (!isDirty || isSaving) return;

    setIsSaving(true);
    try {
      const normalizedBankName =
        bankNameMode === "other" ? bankName.trim() : bankName.trim();

      const opHours: OperatingHours = DAYS_OF_WEEK.reduce((acc, day) => {
        const found =
          operatingHours.find(
            (d) => d.day.toLowerCase() === day.toLowerCase(),
          ) || null;
        (acc as any)[day] = {
          open: found?.openTime || "09:00",
          close: found?.closeTime || "17:00",
          isActive: Boolean(found?.enabled),
        };
        return acc;
      }, {} as OperatingHours);

      await storeFrontService.updateStoreOperations(effectiveOutletId, {
        storeCode: effectiveStoreCode,
        delivery: deliveryEnabled,
        pickup: pickupEnabled,
        bankName: normalizedBankName,
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        iban: iban.trim() || undefined,
        swiftCode: swiftCode.trim() || undefined,
        sortCode: sortCode.trim() || undefined,
        operatingHours: opHours,
        leadTime: leadTimeTotalSeconds,
      });

      setSavedBaselineKey(baselineKey);

      if (onSaved) {
        await new Promise((resolve) => setTimeout(resolve, 2500));
        await onSaved();
      }

      showToast("success", "Saved", "Business operations updated.");
    } catch {
      showToast(
        "error",
        "Save failed",
        "We couldn’t save business operations. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="flex flex-col gap-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-[24px] font-bold text-[#000000]">
            Set your business operations
          </h2>
        </div>

        <div className="space-y-4">
          <p className="text-[18px] font-bold text-[#000000]">
            How I Process Orders
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={deliveryEnabled}
                onChange={(e) => setDeliveryEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-[#D1D5DB] text-[#15BA5C] focus:ring-[#15BA5C]"
              />
              <span className="text-[#111827]">Delivery</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={pickupEnabled}
                onChange={(e) => setPickupEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-[#D1D5DB] text-[#15BA5C] focus:ring-[#15BA5C]"
              />
              <span className="text-[#111827]">Pickup</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={deliveryEnabled && pickupEnabled}
                onChange={(e) => {
                  const next = e.target.checked;
                  setDeliveryEnabled(next);
                  setPickupEnabled(next);
                }}
                className="h-4 w-4 rounded border-[#D1D5DB] text-[#15BA5C] focus:ring-[#15BA5C]"
              />
              <span className="text-[#111827]">Both</span>
            </label>
          </div>

          <p className="text-xs text-[#6B7280]">
            Select one option based on how you want your business to run.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[18px] font-bold text-[#000000]">
              Location and Opening Hours
            </p>
          </div>

          <div className="rounded-[16px] border border-[#E5E7EB] bg-[#FCFCFC] px-5 py-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1 text-sm">
                <p className="font-medium text-[#111827]">
                  {outlet?.name || "Lagos, Nigeria"}
                </p>
                <p className="text-[#6B7280]">
                  {outlet?.address || "8502 Preston Rd. Inglewood, Maine 98380"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingLocation((prev) => !prev)}
                className={`flex cursor-pointer h-8 w-8 items-center justify-center rounded-full ${isEditingLocation ? "border border-[#15BA5C]" : ""} text-[#15BA5C] hover:bg-[#F0FDF4]`}
                aria-label={
                  isEditingLocation ? "Exit edit mode" : "Edit location"
                }
                title={isEditingLocation ? "Exit edit mode" : "Edit location"}
              >
                {isEditingLocation ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      stroke="#15BA5C"
                      strokeWidth="2"
                    />
                    <path
                      d="M8 12.5L10.5 15L16 9.5"
                      stroke="#15BA5C"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg
                    width="25"
                    height="25"
                    viewBox="0 0 37 37"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M26.834 28.75V30.6667C26.834 31.6833 26.4301 32.6584 25.7112 33.3772C24.9923 34.0961 24.0173 34.5 23.0007 34.5H5.75065C4.73399 34.5 3.75897 34.0961 3.04008 33.3772C2.32119 32.6584 1.91732 31.6833 1.91732 30.6667V13.4167C1.91732 12.4 2.32119 11.425 3.04008 10.7061C3.75897 9.9872 4.73399 9.58333 5.75065 9.58333H7.66732"
                      stroke="#15BA5C"
                      strokeWidth="3.83333"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M30.6665 11.4993L24.9165 5.74935M27.6285 3.09477C28.3834 2.33989 29.4072 1.91581 30.4748 1.91581C31.5423 1.91581 32.5662 2.33989 33.321 3.09477C34.0759 3.84964 34.5 4.87347 34.5 5.94102C34.5 7.00857 34.0759 8.03239 33.321 8.78726L17.2498 24.916L11.4998 24.916V19.166L27.6285 3.09477Z"
                      stroke="#15BA5C"
                      strokeWidth="3.83333"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </div>

            <div className="px-4 pb-4 flex flex-col gap-10">
              {operatingHours.map((dayHours, dayIndex) => (
                <div
                  key={`${dayHours.day}-${dayIndex}`}
                  className="flex items-center justify-between gap-4 relative mt-2.5"
                >
                  <div className="w-32">
                    <Switch
                      checked={dayHours.enabled}
                      onChange={() => handleDayToggle(dayIndex)}
                      label={dayHours.day}
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-1 relative">
                    <div className="flex flex-1/2 items-center justify-between gap-2 border border-[#E6E6E6] px-2 rounded-xl">
                      <span className="text-sm text-gray-600">From</span>
                      <TimeDropdownSplit
                        value={dayHours.openTime}
                        onChange={(value) =>
                          handleTimeChange(dayIndex, "openTime", value)
                        }
                        disabled={!dayHours.enabled || isSaving}
                      />
                    </div>

                    <div className="flex flex-1/2 items-center justify-between gap-2 border border-[#E6E6E6] px-2 rounded-xl">
                      <span className="text-sm text-gray-600">To</span>
                      <TimeDropdownSplit
                        value={dayHours.closeTime}
                        onChange={(value) =>
                          handleTimeChange(dayIndex, "closeTime", value)
                        }
                        disabled={!dayHours.enabled || isSaving}
                      />
                    </div>

                    {dayIndex === 0 && (
                      <div className="flex items-center gap-2.5 absolute -bottom-6 left-0">
                        <input
                          type="checkbox"
                          className="accent-green-600"
                          checked={applyToAll}
                          onChange={(e) => {
                            const next = e.target.checked;
                            setApplyToAll(next);
                            if (next) {
                              setOperatingHours((prev) =>
                                prev.map((d) => ({
                                  ...d,
                                  openTime: dayHours.openTime,
                                  closeTime: dayHours.closeTime,
                                })),
                              );
                            }
                          }}
                          disabled={isSaving}
                        />
                        <p
                          className={`text-[#1C1B20] text-sm ${isSaving ? "opacity-50" : ""}`}
                        >
                          Apply to all
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-[#111827]">
            Lead Time <span className="text-[#EF4444]">*</span>
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-xs text-[#6B7280]">Days</p>
              <div className="flex items-center rounded-[12px] bg-[#F9FAFB] px-3 py-3 text-sm text-[#111827]">
                <input
                  type="number"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#9CA3AF]"
                  placeholder="Days"
                  value={leadDays}
                  onChange={(e) => setLeadDays(e.target.value)}
                />
                <Clock className="h-4 w-4 text-[#9CA3AF]" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-[#6B7280]">Hours</p>
              <div className="flex items-center rounded-[12px] bg-[#F9FAFB] px-3 py-3 text-sm text-[#111827]">
                <input
                  type="number"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#9CA3AF]"
                  placeholder="Hours"
                  value={leadHours}
                  onChange={(e) => setLeadHours(e.target.value)}
                />
                <Clock className="h-4 w-4 text-[#9CA3AF]" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-[#6B7280]">Minutes</p>
              <div className="flex items-center rounded-[12px] bg-[#F9FAFB] px-3 py-3 text-sm text-[#111827]">
                <input
                  type="number"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#9CA3AF]"
                  placeholder="Minutes"
                  value={leadMinutes}
                  onChange={(e) => setLeadMinutes(e.target.value)}
                />
                <Clock className="h-4 w-4 text-[#9CA3AF]" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[18px] font-bold text-[#000000]">Bank Details</p>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-[#6B7280]">Bank Name</p>
                {bankNameMode === "select" ? (
                  <Dropdown
                    options={bankDropdownOptions}
                    selectedValue={bankName || undefined}
                    onChange={(value) => {
                      if (value === "__OTHER__") {
                        setBankNameMode("other");
                        setBankName("");
                        return;
                      }
                      setBankName(value);
                    }}
                    placeholder="Select Bank"
                    searchPlaceholder="Search banks..."
                    className="w-full"
                  />
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Enter bank name"
                      className="w-full rounded-[12px] bg-[#F9FAFB] px-3 py-3 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF]"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setBankNameMode("select")}
                      className="text-xs font-medium text-[#15BA5C]"
                    >
                      Select from list
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs text-[#6B7280]">Account Number</p>
                <input
                  type="text"
                  placeholder="Enter Account number"
                  className="w-full rounded-[12px] bg-[#F9FAFB] px-3 py-3 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF]"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1 md:w-1/2">
              <p className="text-xs text-[#6B7280]">Account Name</p>
              <input
                type="text"
                placeholder="Account name"
                className="w-full rounded-[12px] bg-[#F9FAFB] px-3 py-3 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF]"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={() => setShowAdditionalBankDetails((p) => !p)}
              className="flex items-center gap-2 text-sm font-medium text-[#15BA5C]"
            >
              <span>{showAdditionalBankDetails ? "▼" : "▶"}</span>
              <span>Additional Bank Details (Optional)</span>
            </button>

            {showAdditionalBankDetails && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs text-[#6B7280]">IBAN (Optional)</p>
                  <input
                    type="text"
                    placeholder="Enter IBAN"
                    className="w-full rounded-[12px] bg-[#F9FAFB] px-3 py-3 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF]"
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#6B7280]">
                    SWIFT Code (Optional)
                  </p>
                  <input
                    type="text"
                    placeholder="Enter SWIFT code"
                    className="w-full rounded-[12px] bg-[#F9FAFB] px-3 py-3 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF]"
                    value={swiftCode}
                    onChange={(e) => setSwiftCode(e.target.value)}
                  />
                </div>
                <div className="space-y-1 md:col-span-1">
                  <p className="text-xs text-[#6B7280]">Sort Code (Optional)</p>
                  <input
                    type="text"
                    placeholder="Enter sort code"
                    className="w-full rounded-[12px] bg-[#F9FAFB] px-3 py-3 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF]"
                    value={sortCode}
                    onChange={(e) => setSortCode(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
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

export default BusinessOperations;
