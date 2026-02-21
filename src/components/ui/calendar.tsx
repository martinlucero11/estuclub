"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center absolute right-1",
        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-input rounded-md flex items-center justify-center",
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        month_grid: "w-full border-collapse space-y-1", // Soporte v9
        head_row: "grid grid-cols-7 w-full",
        weekdays: "grid grid-cols-7 w-full", // Soporte v9
        head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem] text-center",
        row: "grid grid-cols-7 w-full mt-2",
        week: "grid grid-cols-7 w-full mt-2", // Soporte v9
        cell: "text-center text-sm p-0 relative focus-within:relative focus-within:z-20 flex items-center justify-center h-9 w-full",
        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md flex items-center justify-center mx-auto",
        day_button: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md flex items-center justify-center mx-auto", // Soporte v9
        day_range_end: "day-range-end",
        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
