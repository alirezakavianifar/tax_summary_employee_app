'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  X,
  RotateCcw,
  Check,
} from 'lucide-react'
import {
  PERSIAN_MONTH_NAMES,
  PERSIAN_WEEK_DAYS,
  getDaysInJalaliMonth,
  getJalaliWeekday,
  getTodayJalali,
  isoStringToJalali,
  jalaliToIsoString,
  formatJalaliDateString,
  parseJalaliInput,
  toEnglishDigits,
  toPersianDigits,
} from '@/lib/jalali'

export interface ShamsiDatePickerProps {
  value?: string | null // Gregorian ISO date "YYYY-MM-DD" or empty
  onChange: (isoDate: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  id?: string
  name?: string
  persianDigitsDisplay?: boolean
}

export default function ShamsiDatePicker({
  value,
  onChange,
  placeholder = 'مثال: ۱۴۰۵/۰۶/۱۵',
  className = '',
  disabled = false,
  id,
  name,
  persianDigitsDisplay = false,
}: ShamsiDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Current selected Jalali date from incoming `value` (ISO string)
  const selectedJalali = useMemo(() => {
    return isoStringToJalali(value)
  }, [value])

  // View state for the calendar navigator (active year and month)
  const today = useMemo(() => getTodayJalali(), [])
  const [viewYear, setViewYear] = useState<number>(selectedJalali?.jy ?? today.jy)
  const [viewMonth, setViewMonth] = useState<number>(selectedJalali?.jm ?? today.jm)

  // Input text state for manual typing
  const [inputText, setInputText] = useState<string>('')

  // Sync internal input text when `value` changes externally
  useEffect(() => {
    if (selectedJalali) {
      const formatted = formatJalaliDateString(
        selectedJalali.jy,
        selectedJalali.jm,
        selectedJalali.jd,
        persianDigitsDisplay
      )
      setInputText(formatted)
      setViewYear(selectedJalali.jy)
      setViewMonth(selectedJalali.jm)
    } else {
      setInputText('')
    }
  }, [selectedJalali, persianDigitsDisplay])

  // Close calendar on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // Navigation handlers
  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1)
      setViewMonth(12)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1)
      setViewMonth(1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const handleSelectDay = (day: number) => {
    const iso = jalaliToIsoString(viewYear, viewMonth, day)
    onChange(iso)
    setIsOpen(false)
  }

  const handleSelectToday = () => {
    const t = getTodayJalali()
    setViewYear(t.jy)
    setViewMonth(t.jm)
    const iso = jalaliToIsoString(t.jy, t.jm, t.jd)
    onChange(iso)
    setIsOpen(false)
  }

  const handleClear = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    onChange('')
    setInputText('')
    setIsOpen(false)
  }

  // Handle manual typing in the input box
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value
    setInputText(rawVal)

    const parsed = parseJalaliInput(rawVal)
    if (parsed) {
      const iso = jalaliToIsoString(parsed.jy, parsed.jm, parsed.jd)
      onChange(iso)
      setViewYear(parsed.jy)
      setViewMonth(parsed.jm)
    } else if (rawVal.trim() === '') {
      onChange('')
    }
  }

  const handleInputBlur = () => {
    // If input is invalid on blur, reset text to selectedJalali or empty
    if (!inputText.trim()) {
      onChange('')
      setInputText('')
      return
    }
    const parsed = parseJalaliInput(inputText)
    if (parsed) {
      const formatted = formatJalaliDateString(
        parsed.jy,
        parsed.jm,
        parsed.jd,
        persianDigitsDisplay
      )
      setInputText(formatted)
      const iso = jalaliToIsoString(parsed.jy, parsed.jm, parsed.jd)
      onChange(iso)
    } else if (selectedJalali) {
      setInputText(
        formatJalaliDateString(
          selectedJalali.jy,
          selectedJalali.jm,
          selectedJalali.jd,
          persianDigitsDisplay
        )
      )
    } else {
      setInputText('')
      onChange('')
    }
  }

  // Calendar calculations
  const totalDays = useMemo(() => {
    return getDaysInJalaliMonth(viewYear, viewMonth)
  }, [viewYear, viewMonth])

  const startWeekday = useMemo(() => {
    return getJalaliWeekday(viewYear, viewMonth, 1) // 0 (Sat) to 6 (Fri)
  }, [viewYear, viewMonth])

  // Year options list for selector (from today.jy - 10 to today.jy + 10)
  const yearOptions = useMemo(() => {
    const current = today.jy
    const years: number[] = []
    for (let y = current - 5; y <= current + 10; y++) {
      years.push(y)
    }
    return years
  }, [today.jy])

  return (
    <div ref={containerRef} className="relative w-full text-right" dir="rtl">
      {/* Input container */}
      <div className="relative flex items-center">
        <input
          id={id}
          name={name}
          type="text"
          disabled={disabled}
          placeholder={placeholder}
          value={inputText}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onClick={() => !disabled && setIsOpen(true)}
          className={`w-full border border-gray-300 rounded-lg pr-10 pl-10 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed ${className}`}
        />

        {/* Left icon: Calendar trigger */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-600 transition-colors focus:outline-none"
          title="باز کردن تقویم شمسی"
        >
          <CalendarIcon className="w-4 h-4" />
        </button>

        {/* Right action: Clear button */}
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 p-0.5 rounded transition-colors focus:outline-none"
            title="پاک کردن تاریخ"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Calendar Dropdown Popup */}
      {isOpen && (
        <div className="absolute z-50 mt-1 right-0 w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-3 select-none animate-in fade-in zoom-in-95 duration-150">
          {/* Header: Month & Year Selectors & Navigation */}
          <div className="flex items-center justify-between gap-1 pb-3 mb-2 border-b border-gray-100">
            {/* Prev month button (In RTL, right arrow moves to next, left arrow moves to prev) */}
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              title="ماه قبل"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Selectors for Month and Year */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                className="bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-xs text-gray-800 font-medium focus:ring-1 focus:ring-primary-500 focus:outline-none cursor-pointer"
              >
                {PERSIAN_MONTH_NAMES.map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                className="bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-xs text-gray-800 font-medium focus:ring-1 focus:ring-primary-500 focus:outline-none cursor-pointer"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {toPersianDigits(y)}
                  </option>
                ))}
              </select>
            </div>

            {/* Next month button */}
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              title="ماه بعد"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {PERSIAN_WEEK_DAYS.map((wd, i) => (
              <span
                key={i}
                className={`text-[11px] font-semibold py-1 ${
                  i === 6 ? 'text-rose-500' : 'text-gray-500'
                }`}
                title={wd.name}
              >
                {wd.short}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty padding slots before first day */}
            {Array.from({ length: startWeekday }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8" />
            ))}

            {/* Days 1..totalDays */}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1
              const isSelected =
                selectedJalali &&
                selectedJalali.jy === viewYear &&
                selectedJalali.jm === viewMonth &&
                selectedJalali.jd === day

              const isToday =
                today.jy === viewYear &&
                today.jm === viewMonth &&
                today.jd === day

              const dayWeekday = (startWeekday + i) % 7
              const isFriday = dayWeekday === 6

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 w-8 mx-auto rounded-lg text-xs font-medium flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-primary-600 text-white font-bold shadow-sm ring-2 ring-primary-300'
                      : isToday
                      ? 'border border-primary-500 text-primary-700 font-bold bg-primary-50/50 hover:bg-primary-100'
                      : isFriday
                      ? 'text-rose-600 hover:bg-rose-50'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {toPersianDigits(day)}
                </button>
              )
            })}
          </div>

          {/* Footer Quick Actions */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-2.5 mt-3 text-xs">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-primary-600 hover:text-primary-800 font-medium px-2 py-1 rounded hover:bg-primary-50 transition-colors"
            >
              امروز ({toPersianDigits(today.jd)} {PERSIAN_MONTH_NAMES[today.jm - 1]})
            </button>

            <div className="flex items-center gap-1">
              {value && (
                <button
                  type="button"
                  onClick={() => handleClear()}
                  className="text-rose-600 hover:text-rose-800 px-2 py-1 rounded hover:bg-rose-50 transition-colors"
                >
                  پاک کردن
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
