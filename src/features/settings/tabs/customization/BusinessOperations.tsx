import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { Switch } from "../../ui/Switch";
import { TimeDropdownSplit } from "../../ui/TimeDropdownSplit";
import { useBusinessStore } from "@/stores/useBusinessStore";

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

type BankAccount = {
  id: number;
  bank: string;
  accountNumber: string;
  accountName: string;
};

const bankOptions = [
  { value: "", label: "Select Bank" },
  { value: "access", label: "Access Bank" },
  { value: "first", label: "First Bank" },
  { value: "gt", label: "GTBank" },
];

const BusinessOperations = () => {
  const { selectedOutlet: outlet } = useBusinessStore();
  const [operatingHours, setOperatingHours] = useState<DayHours[]>(
    getDefaultOperatingHours(),
  );
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([
    { id: 1, bank: "", accountNumber: "", accountName: "" },
  ]);

  useEffect(() => {
    let hoursToSet = getDefaultOperatingHours();

    if (outlet?.operatingHours) {
      const rawHours = outlet.operatingHours;

      hoursToSet = DAYS_OF_WEEK.map((day) => ({
        day: day.charAt(0).toUpperCase() + day.slice(1),
        enabled: rawHours[day as keyof typeof rawHours]?.isActive ?? false,
        openTime: rawHours[day as keyof typeof rawHours]?.open ?? "09:00",
        closeTime: rawHours[day as keyof typeof rawHours]?.close ?? "17:00",
      }));
    }

    setOperatingHours(hoursToSet);
  }, [outlet]);

  const handleDayToggle = (dayIndex: number) => {
    if (!isEditingLocation) return;

    setOperatingHours((prev) =>
      prev.map((day, index) =>
        index === dayIndex ? { ...day, enabled: !day.enabled } : day,
      ),
    );
  };

  const handleTimeChange = (
    dayIndex: number,
    field: "openTime" | "closeTime",
    value: string,
  ) => {
    if (!isEditingLocation) return;

    setOperatingHours((prev) =>
      prev.map((day, index) =>
        index === dayIndex ? { ...day, [field]: value } : day,
      ),
    );
  };

  const handleBankAccountChange = (
    id: number,
    field: keyof Omit<BankAccount, "id">,
    value: string,
  ) => {
    setBankAccounts((prev) =>
      prev.map((account) =>
        account.id === id ? { ...account, [field]: value } : account,
      ),
    );
  };

  const handleAddBankAccount = () => {
    setBankAccounts((prev) => [
      ...prev,
      {
        id: Date.now(),
        bank: "",
        accountNumber: "",
        accountName: "",
      },
    ]);
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
                defaultChecked
                className="h-4 w-4 rounded border-[#D1D5DB] text-[#15BA5C] focus:ring-[#15BA5C]"
              />
              <span className="text-[#111827]">Delivery</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-[#D1D5DB] text-[#15BA5C] focus:ring-[#15BA5C]"
              />
              <span className="text-[#111827]">Pickup</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-[#D1D5DB] text-[#15BA5C] focus:ring-[#15BA5C]"
              />
              <span className="text-[#111827]">Both</span>
            </label>
          </div>

          <p className="text-xs text-[#6B7280]">
            You can select one or both. Depends on how you want your business to
            run
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

            <div className="mt-6 space-y-3">
              {operatingHours.map((dayHours, index) => (
                <div
                  key={`${dayHours.day}-${index}`}
                  className="flex items-center gap-4 rounded-[10px] bg-white px-4 py-3 text-sm text-[#111827]"
                >
                  <div className="w-28">
                    <Switch
                      checked={dayHours.enabled}
                      onChange={() => handleDayToggle(index)}
                      label={dayHours.day}
                    />
                  </div>
                  <div className="flex flex-1 items-center gap-3">
                    <div className="flex flex-1 items-center justify-between rounded-[10px] bg-[#F9FAFB] px-3 py-2 text-xs text-[#9CA3AF]">
                      <span className="text-xs text-[#9CA3AF]">From</span>
                      <TimeDropdownSplit
                        value={dayHours.openTime}
                        onChange={(value) =>
                          handleTimeChange(index, "openTime", value)
                        }
                        disabled={!dayHours.enabled || !isEditingLocation}
                      />
                    </div>
                    <div className="flex flex-1 items-center justify-between rounded-[10px] bg-[#F9FAFB] px-3 py-2 text-xs text-[#9CA3AF]">
                      <span className="text-xs text-[#9CA3AF]">To</span>
                      <TimeDropdownSplit
                        value={dayHours.closeTime}
                        onChange={(value) =>
                          handleTimeChange(index, "closeTime", value)
                        }
                        disabled={!dayHours.enabled || !isEditingLocation}
                      />
                    </div>
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
                />
                <Clock className="h-4 w-4 text-[#9CA3AF]" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[18px] font-bold text-[#000000]">Bank Details</p>

          {bankAccounts.map((account) => (
            <div key={account.id} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs text-[#6B7280]">Bank</p>
                  <div className="relative">
                    <select
                      className="w-full appearance-none rounded-[10px] bg-[#FAFAFC] border border-[#D1D1D1] px-3 py-2.5 pr-10 text-sm text-[#111827] placeholder-[#A6A6A6] outline-none focus:border-[#15BA5C] focus:ring-1 focus:ring-[#15BA5C]"
                      value={account.bank}
                      onChange={(e) =>
                        handleBankAccountChange(
                          account.id,
                          "bank",
                          e.target.value,
                        )
                      }
                    >
                      {bankOptions.map((option) => (
                        <option
                          key={option.value || "placeholder"}
                          value={option.value}
                          disabled={option.value === ""}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#9CA3AF] text-xs">
                      ▼
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#6B7280]">Account Number</p>
                  <input
                    type="text"
                    placeholder="Enter Account number"
                    className="w-full rounded-[12px] bg-[#F9FAFB] px-3 py-3 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF]"
                    value={account.accountNumber}
                    onChange={(e) =>
                      handleBankAccountChange(
                        account.id,
                        "accountNumber",
                        e.target.value,
                      )
                    }
                  />
                </div>
              </div>

              <div className="space-y-1 md:w-1/2">
                <p className="text-xs text-[#6B7280]">Account Name</p>
                <input
                  type="text"
                  placeholder="account name"
                  className="w-full rounded-[12px] bg-[#F9FAFB] px-3 py-3 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF]"
                  value={account.accountName}
                  onChange={(e) =>
                    handleBankAccountChange(
                      account.id,
                      "accountName",
                      e.target.value,
                    )
                  }
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddBankAccount}
            className="text-sm font-medium text-[#15BA5C]"
          >
            + Add new bank account
          </button>
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

export default BusinessOperations;
