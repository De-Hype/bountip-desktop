"use client";

import { Listbox, Transition } from "@headlessui/react";
import { Fragment, useMemo } from "react";
import { ChevronDown } from "lucide-react";

type TimeDropdownSplitProps = {
  value: string; // e.g. "09:30"
  onChange: (val: string) => void;
  disabled?: boolean;
  minuteStep?: number; // optional: 1, 5, 15
};

export const TimeDropdownSplit: React.FC<TimeDropdownSplitProps> = ({
  value,
  onChange,
  disabled = false,
  minuteStep = 1,
}) => {
  const [hour, minute] = value.split(":").map(Number);

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutes = useMemo(
    () => Array.from({ length: 60 / minuteStep }, (_, i) => i * minuteStep),
    [minuteStep],
  );

  const handleHourChange = (newHour: number) => {
    const newVal = `${newHour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
    onChange(newVal);
  };

  const handleMinuteChange = (newMinute: number) => {
    const newVal = `${hour.toString().padStart(2, "0")}:${newMinute
      .toString()
      .padStart(2, "0")}`;
    onChange(newVal);
  };

  const Dropdown = ({
    options,
    selected,
    onChange,
  }: {
    options: number[];
    selected: number;
    onChange: (val: number) => void;
    label: string;
  }) => (
    <div className="relative w-[80px] text-sm">
      <Listbox value={selected} onChange={onChange} disabled={disabled}>
        <Listbox.Button
          className={`flex items-center justify-between w-full bg-white border border-gray-300 rounded-md px-3 py-2 ${
            disabled ? "bg-gray-100 text-gray-400" : "hover:border-gray-400"
          }`}
        >
          <span>{selected.toString().padStart(2, "0")}</span>
          <ChevronDown className="h-4 w-4" />
        </Listbox.Button>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-sm">
            {options.map((opt) => (
              <Listbox.Option
                key={opt}
                value={opt}
                className={({ active }) =>
                  `cursor-pointer select-none px-4 py-2 ${
                    active ? "bg-green-100 text-green-900" : "text-gray-900"
                  }`
                }
              >
                {opt.toString().padStart(2, "0")}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </Listbox>
    </div>
  );

  return (
    <div className="flex items-center gap-2">
      <Dropdown
        options={hours}
        selected={hour}
        onChange={handleHourChange}
        label="Hours"
      />
      <span className="text-gray-500">:</span>
      <Dropdown
        options={minutes}
        selected={minute}
        onChange={handleMinuteChange}
        label="Minutes"
      />
    </div>
  );
};
