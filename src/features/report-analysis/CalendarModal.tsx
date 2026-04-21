import { X } from "lucide-react";
import { format, subDays } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { ReportCalendar } from "./ReportCalendar";

const formatHeaderDate = (d: Date) => format(d, "MMM d, yyyy");

const CalendarModal = ({
  isOpen,
  onClose,
  value,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  value: DateRange | undefined;
  onConfirm: (value: DateRange | undefined) => void;
}) => {
  const [temp, setTemp] = useState<DateRange | undefined>(value);
  const isConfirmEnabled = Boolean(temp?.from && temp?.to);

  useEffect(() => {
    if (!isOpen) return;
    setTemp(value);
  }, [isOpen, value]);

  const quickRanges = useMemo(() => {
    const today = new Date();
    const yesterday = subDays(today, 1);
    return [
      { label: "Today", range: { from: today, to: today } as DateRange },
      {
        label: "Yesterday",
        range: { from: yesterday, to: yesterday } as DateRange,
      },
      {
        label: "Last 7 Days",
        range: { from: subDays(today, 6), to: today } as DateRange,
      },
      {
        label: "Last 30 Days",
        range: { from: subDays(today, 29), to: today } as DateRange,
      },
    ];
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-200 bg-black/20 flex items-center justify-center p-4">
      <div className="w-full max-w-[1020px] bg-white rounded-[14px] overflow-hidden shadow-2xl">
        <div className="px-6 py-5 border-b border-[#E5E7EB] flex items-start justify-between">
          <div>
            <h2 className="text-[18px] font-semibold text-[#111827]">
              Select Date & Time
            </h2>
            <p className="text-[13px] text-[#6B7280] mt-1">
              Please select a date and time range you want to see for your
              report
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-[#E5E7EB] text-[#6B7280] flex items-center justify-center cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr]">
          <div className="border-r border-[#E5E7EB] px-10 py-10">
            <div className="space-y-10">
              {quickRanges.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => setTemp(q.range)}
                  className={`w-full text-left text-[18px] font-medium cursor-pointer ${
                    q.label === "Today" ? "text-[#15BA5C]" : "text-[#111827]"
                  }`}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-8 py-8">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div
                className={`h-12 rounded-[10px] border px-4 flex items-center justify-center ${
                  temp?.from
                    ? "border-[#15BA5C] text-[#15BA5C]"
                    : "border-[#E5E7EB] text-[#6B7280]"
                }`}
              >
                <span className="text-[14px] font-medium">
                  {temp?.from ? formatHeaderDate(temp.from) : "Start date"}
                </span>
              </div>
              <div className="h-12 rounded-[10px] border border-[#E5E7EB] px-4 flex items-center justify-center text-[#6B7280]">
                <span className="text-[14px] font-medium">
                  {temp?.to ? formatHeaderDate(temp.to) : "End date"}
                </span>
              </div>
            </div>

            <div className="border  border-[#E5E7EB] rounded-[12px] overflow-hidden">
              <ReportCalendar
                mode="range"
                selected={temp}
                onSelect={(r) => setTemp(r as DateRange)}
                numberOfMonths={1}
                captionLayout="dropdown"
                fromYear={2020}
                toYear={2035}
                className="w-full"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (!isConfirmEnabled) return;
                onConfirm(temp);
                onClose();
              }}
              disabled={!isConfirmEnabled}
              className={`mt-8 w-full h-12 rounded-[10px] text-[14px] font-semibold transition-colors cursor-pointer ${
                isConfirmEnabled
                  ? "bg-[#15BA5C] text-white hover:bg-[#119E4D]"
                  : "bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed"
              }`}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarModal;
