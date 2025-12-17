"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onDateRangeChange?: (range: {
    start: Date | undefined;
    end: Date | undefined;
  }) => void;
  className?: string;
  disabled?: boolean;
}

export function DateRangePicker({
  startDate,
  endDate,
  onDateRangeChange,
  className,
  disabled = false,
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(
    startDate && endDate
      ? { from: startDate, to: endDate }
      : startDate
      ? { from: startDate, to: undefined }
      : undefined
  );
  const [tempDate, setTempDate] = React.useState<DateRange | undefined>(date);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (startDate || endDate) {
      const newDate = {
        from: startDate,
        to: endDate,
      };
      setDate(newDate);
      setTempDate(newDate);
    }
  }, [startDate, endDate]);

  // Get today's date at midnight for comparison
  const today = React.useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  // Disable dates based on selection state
  const disabledDates = React.useCallback(
    (day: Date) => {
      const dayToCheck = new Date(day);
      dayToCheck.setHours(0, 0, 0, 0);

      // Always disable future dates (after today) - end date cannot exceed today
      if (dayToCheck > today) {
        return true;
      }

      // If we have a start date but no end date (selecting end date)
      if (tempDate?.from && !tempDate?.to) {
        const fromDate = new Date(tempDate.from);
        fromDate.setHours(0, 0, 0, 0);
        // Disable dates that are before the start date
        return dayToCheck < fromDate;
      }

      return false;
    },
    [tempDate?.from, tempDate?.to, today]
  );

  const handleDateSelect = (range: DateRange | undefined) => {
    setTempDate(range);
  };

  const handleCancel = () => {
    setTempDate(date);
    setIsOpen(false);
  };

  const handleSelect = () => {
    setDate(tempDate);
    if (onDateRangeChange) {
      onDateRangeChange({
        start: tempDate?.from,
        end: tempDate?.to,
      });
    }
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 border border-[#E8E8E8] bg-white py-3 px-4 rounded-[8px] hover:border-[#0654D0] hover:shadow-sm transition-all duration-200",
            disabled &&
              "opacity-50 cursor-not-allowed hover:border-[#E8E8E8] hover:shadow-none",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon size={16} className="text-[#484848]" />
          <aside className="text-[#484848] flex items-center gap-2">
            {date?.from ? (
              <span className="text-[1rem] leading-[140%]">
                {format(date.from, "LLL dd, y")}
              </span>
            ) : (
              <span className="text-[1rem] leading-[140%]">Start Date</span>
            )}
            {date?.from && (
              <>
                <span className="bg-[#D1D1D1] w-[1px] h-[22px]"></span>
                {date?.to ? (
                  <span className="text-[1rem] leading-[140%]">
                    {format(date.to, "LLL dd, y")}
                  </span>
                ) : (
                  <span className="text-[1rem] leading-[140%]">End Date</span>
                )}
              </>
            )}
          </aside>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto min-w-[320px] p-0 shadow-lg border border-[#E8E8E8] rounded-[12px] overflow-hidden bg-white"
        align="end"
      >
        <>
          {/* <style
            dangerouslySetInnerHTML={{
              __html: `
            .rdp-table {
              display: block !important;
            }
            .rdp-head_row,
            .rdp-row {
              display: flex !important;
              flex-direction: row !important;
              width: 100% !important;
            }
          `,
            }}
          /> */}
          <div className="w-full">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={tempDate?.from || date?.from || new Date()}
              selected={tempDate}
              onSelect={handleDateSelect}
              numberOfMonths={1}
              disabled={disabledDates}
              classNames={{
                months: "flex flex-col ",
                table: "w-full",
                head_row: "flex flex-row mb-2 w-full",
                row: "flex flex-row w-full mt-1",
              }}
            />
          </div>
        </>
        <div className="flex items-center justify-between gap-[24px] px-4 py-3 ">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-[#1A1A1A] bg-[#F5F5F5] rounded-[32px] hover:bg-[#E8E8E8] transition-colors text-[1rem] font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSelect}
            className="px-4 py-2 w-full text-white bg-[#0654D0] border border-[#2B5CAB] rounded-[32px] hover:bg-[#0544A8] transition-colors text-[1rem] font-semibold cursor-pointer"
          >
            Select
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
