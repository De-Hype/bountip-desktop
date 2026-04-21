/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, type DayPickerProps } from "react-day-picker";
import "react-day-picker/dist/style.css";

import { cn } from "@/lib/utils";

export type ReportCalendarProps = DayPickerProps;

function ReportCalendar({
  className,
  classNames,
  showOutsideDays = true,
  weekStartsOn = 1,
  ...props
}: ReportCalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      weekStartsOn={weekStartsOn}
      className={cn("w-full p-4", className)}
      classNames={{
        months: "flex flex-col w-full",
        month: "w-full space-y-6",
        caption: "relative flex items-center justify-center pt-2",
        caption_label: "hidden",
        caption_dropdowns: "flex items-center justify-center gap-10",
        dropdown:
          "appearance-none bg-transparent text-[22px] font-semibold text-[#111827] pr-6 pl-2 py-1 focus:outline-none",
        dropdown_month: "min-w-[150px]",
        dropdown_year: "min-w-[120px]",
        dropdown_icon: "text-[#111827]",
        nav: "absolute inset-x-0 flex items-center justify-between px-2",
        nav_button: cn(
          "h-10 w-10 rounded-full border border-[#D1D5DB] bg-white flex items-center justify-center text-[#6B7280] hover:bg-[#F3F4F6] transition-colors",
        ),
        nav_button_previous: "",
        nav_button_next: "",
        table: "w-full border-collapse",
        head_row: "grid grid-cols-7 w-full",
        head_cell: "text-[#9CA3AF] font-medium text-[20px] text-center py-4",
        row: "grid grid-cols-6 w-full",
        cell: "p-0 text-center",
        day: cn(
          "h-14 w-14  rounded-full text-[22px] font-semibold text-[#111827] hover:bg-[#F3F4F6] transition-colors",
        ),
        day_selected:
          "bg-[#15BA5C] text-white hover:bg-[#119E4D] hover:text-white focus:bg-[#15BA5C] focus:text-white",
        day_today: "text-[#15BA5C]",
        day_outside: "text-[#D1D5DB] opacity-100",
        day_disabled: "text-[#D1D1D1] opacity-50 cursor-not-allowed",
        day_range_start:
          "bg-[#15BA5C] text-white hover:bg-[#119E4D] hover:text-white focus:bg-[#15BA5C] focus:text-white",
        day_range_end:
          "day-range-end bg-[#15BA5C] text-white hover:bg-[#119E4D] hover:text-white focus:bg-[#15BA5C] focus:text-white",
        day_range_middle:
          "aria-selected:bg-transparent aria-selected:text-[#111827]",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-5 w-5" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-5 w-5" />,
      }}
      {...props}
    />
  );
}
ReportCalendar.displayName = "ReportCalendar";

export { ReportCalendar };
