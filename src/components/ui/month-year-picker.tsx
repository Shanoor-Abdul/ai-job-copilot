"use client"

import * as React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 50 }, (_, i) => (currentYear - i).toString())

interface MonthYearPickerProps {
  value: string | null
  onChange: (value: string) => void
  label?: string
  error?: boolean
}

export function MonthYearPicker({ value, onChange, label, error }: MonthYearPickerProps) {
  // Parse incoming value like "January 2023" or "01/2023"
  // For simplicity, we just expect "Month Year" format
  const [month, year] = (value || "").split(" ")
  const safeMonth = MONTHS.includes(month) ? month : ""
  const safeYear = YEARS.includes(year) ? year : ""

  const handleMonthChange = (newMonth: string) => {
    if (newMonth === "Present") {
      onChange("Present")
    } else {
      onChange(`${newMonth} ${safeYear || currentYear}`)
    }
  }

  const handleYearChange = (newYear: string) => {
    if (value === "Present") {
      onChange(`January ${newYear}`)
    } else {
      onChange(`${safeMonth || "January"} ${newYear}`)
    }
  }

  const isPresent = value === "Present"

  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <Select value={isPresent ? "Present" : safeMonth} onValueChange={handleMonthChange}>
          <SelectTrigger className={error ? "border-red-500" : ""}>
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Present">Present</SelectItem>
            {MONTHS.map(m => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {!isPresent && (
        <div className="flex-1">
          <Select value={safeYear} onValueChange={handleYearChange}>
            <SelectTrigger className={error ? "border-red-500" : ""}>
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map(y => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
