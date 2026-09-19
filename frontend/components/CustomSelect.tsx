'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
  description?: string
}

export interface CustomSelectProps {
  value: string | number
  onChange: (value: any) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
  buttonClassName?: string
  dropdownClassName?: string
  id?: string
  name?: string
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'انتخاب کنید...',
  disabled = false,
  className = '',
  buttonClassName = '',
  dropdownClassName = '',
  id,
  name,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selectedOption = options.find((o) => String(o.value) === String(value))

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return

      if (e.key === 'Escape') {
        setIsOpen(false)
        return
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
          return
        }
        const currentIndex = options.findIndex((o) => String(o.value) === String(value))
        const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0
        if (!options[nextIndex].disabled) {
          onChange(options[nextIndex].value)
        }
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
          return
        }
        const currentIndex = options.findIndex((o) => String(o.value) === String(value))
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1
        if (!options[prevIndex].disabled) {
          onChange(options[prevIndex].value)
        }
      }
    },
    [disabled, isOpen, options, value, onChange]
  )

  const handleSelect = (option: SelectOption) => {
    if (option.disabled || disabled) return
    onChange(option.value)
    setIsOpen(false)
  }

  return (
    <div
      ref={containerRef}
      className={`relative inline-block w-full text-right ${className}`}
      dir="rtl"
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input for standard form serialization if name is provided */}
      {name && <input type="hidden" name={name} value={value ?? ''} />}

      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full px-3 py-2 border rounded-xl text-right flex items-center justify-between text-xs sm:text-sm font-medium transition-all outline-none ${
          disabled
            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            : isOpen
            ? 'bg-white border-purple-500 ring-2 ring-purple-500/20 shadow-sm cursor-pointer'
            : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 cursor-pointer'
        } ${buttonClassName}`}
      >
        <span className={`truncate block ${selectedOption ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 mr-2 ${
            isOpen ? 'rotate-180 text-purple-600' : ''
          }`}
        />
      </button>

      {/* Dropdown Options Popup */}
      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          className={`absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto py-1.5 focus:outline-none ${dropdownClassName}`}
        >
          {options.map((option) => {
            const isSelected = String(option.value) === String(value)
            return (
              <li
                key={String(option.value)}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option)}
                className={`px-3 py-2 text-xs sm:text-sm transition-colors flex items-center justify-between ${
                  option.disabled
                    ? 'text-gray-300 cursor-not-allowed bg-gray-50/50'
                    : isSelected
                    ? 'bg-purple-50 text-purple-700 font-bold cursor-pointer'
                    : 'text-gray-700 hover:bg-purple-50/60 hover:text-purple-900 cursor-pointer'
                }`}
              >
                <div className="flex flex-col">
                  <span>{option.label}</span>
                  {option.description && (
                    <span className="text-[10px] text-gray-400 font-normal mt-0.5">{option.description}</span>
                  )}
                </div>
                {isSelected && <Check className="w-4 h-4 text-purple-600 flex-shrink-0 mr-2" />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
