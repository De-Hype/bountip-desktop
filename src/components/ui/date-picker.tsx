"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Select Date",
  className,
  disabled = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 border border-[#E8E8E8] bg-white py-3 px-4 rounded-[8px] hover:border-[#0654D0] hover:shadow-sm transition-all duration-200 w-full text-left",
            disabled && "opacity-50 cursor-not-allowed hover:border-[#E8E8E8] hover:shadow-none",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon size={16} className="text-[#484848]" />
          <span className={cn("text-[1rem] leading-[140%] flex-1", !date && "text-[#737373]")}>
            {date ? format(date, "LLL dd, y") : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 shadow-lg border border-[#E8E8E8] rounded-[12px] overflow-hidden bg-white"
        align="start"
      >
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            onDateChange?.(d);
            setIsOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
