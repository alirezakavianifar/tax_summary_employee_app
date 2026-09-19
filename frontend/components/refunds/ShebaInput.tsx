'use client'

import React from 'react'
import { toEnglishDigits, handleNumericKeyDown, handleNumericBeforeInput } from '@/lib/jalali'

interface ShebaInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: boolean | string
  className?: string
  inputClassName?: string
  id?: string
  name?: string
  placeholder?: string
  showCounter?: boolean
}

/**
 * Extracts clean digits (up to 24) from any Sheba input.
 * Strips 'IR' / 'ir' prefix, converts Persian/Arabic numbers, and strips non-digit characters.
 */
export function extractShebaDigits(val: string | null | undefined): string {
  if (!val) return ''
  const english = toEnglishDigits(val)
  // Strip leading IR or ir (case insensitive) with any leading/trailing whitespace
  const withoutPrefix = english.replace(/^\s*ir\s*/i, '')
  // Keep only digits and limit to 24
  return withoutPrefix.replace(/\D/g, '').slice(0, 24)
}

/**
 * Modern Sheba (IBAN) input component with a permanent fixed "IR" prefix.
 * Complies with Iranian banking standards (IR + 24 digits).
 */
export default function ShebaInput({
  value,
  onChange,
  disabled = false,
  error = false,
  className = '',
  inputClassName = '',
  id,
  name,
  placeholder = '۲۴ رقم شماره شبا...',
  showCounter = true,
}: ShebaInputProps) {
  const digits = extractShebaDigits(value)

  const handleDigitsChange = (newDigits: string) => {
    const cleaned = extractShebaDigits(newDigits)
    onChange(cleaned ? `IR${cleaned}` : '')
    return cleaned
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = handleDigitsChange(e.target.value)
    e.currentTarget.value = cleaned
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    const cleaned = handleDigitsChange(pastedText)
    e.currentTarget.value = cleaned
  }

  const handleClear = () => {
    if (disabled) return
    onChange('')
  }

  return (
    <div className={`relative ${className}`} dir="ltr" style={{ direction: 'ltr' }}>
      <div
        className={`relative flex flex-row items-center rounded-xl border bg-white overflow-hidden transition-all shadow-sm ${
          error
            ? 'border-red-400 ring-2 ring-red-500/20'
            : 'border-gray-300 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20'
        } ${disabled ? 'opacity-60 bg-gray-50 cursor-not-allowed' : ''}`}
        dir="ltr"
        style={{ direction: 'ltr' }}
      >
        {/* Fixed "IR" Prefix Badge on the LEFT */}
        <div
          className="flex items-center justify-center px-3.5 py-2.5 bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-300 select-none shrink-0"
          title="پیشوند ثابت شماره شبا ایران (IR)"
          style={{ direction: 'ltr' }}
        >
          <span className="font-mono font-black text-sm tracking-widest text-gray-800">
            IR
          </span>
        </div>

        {/* 24-digit Input Field */}
        <input
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          dir="ltr"
          disabled={disabled}
          maxLength={24}
          value={digits}
          onKeyDown={handleNumericKeyDown}
          onBeforeInput={handleNumericBeforeInput}
          onChange={handleChange}
          onPaste={handlePaste}
          placeholder={placeholder}
          style={{ direction: 'ltr', textAlign: 'left' }}
          className={`w-full px-3 py-2 text-left font-mono text-sm tracking-wider text-gray-900 placeholder:text-gray-300 focus:outline-none bg-transparent disabled:cursor-not-allowed ${inputClassName}`}
        />

        {/* Clear Button */}
        {digits.length > 0 && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 mx-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors shrink-0"
            title="پاک کردن"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {/* Digit Counter Badge on the RIGHT */}
        {showCounter && (
          <div className="flex items-center pr-3 pl-1 select-none whitespace-nowrap shrink-0" style={{ direction: 'ltr' }}>
            <span
              className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded transition-colors ${
                digits.length === 24
                  ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                  : digits.length > 0
                  ? 'text-amber-700 bg-amber-50 border border-amber-200'
                  : 'text-gray-400 bg-gray-50 border border-gray-200'
              }`}
            >
              {digits.length}/24
            </span>
          </div>
        )}
      </div>

      {typeof error === 'string' && (
        <p className="mt-1 text-xs text-red-600 font-medium" style={{ direction: 'rtl' }}>{error}</p>
      )}
    </div>
  )
}
