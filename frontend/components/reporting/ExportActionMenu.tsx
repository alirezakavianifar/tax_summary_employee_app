'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Download, FileSpreadsheet, FileText, ChevronDown, Loader2 } from 'lucide-react'

interface ExportActionMenuProps {
  onExportExcel: () => Promise<void>
  onPrint?: () => void
  disabled?: boolean
  label?: string
}

export function ExportActionMenu({
  onExportExcel,
  onPrint,
  disabled = false,
  label = 'دریافت خروجی',
}: ExportActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleExcelClick = async () => {
    try {
      setIsLoading(true)
      setIsOpen(false)
      await onExportExcel()
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrintClick = () => {
    setIsOpen(false)
    if (onPrint) {
      onPrint()
    } else {
      window.print()
    }
  }

  return (
    <div className="relative inline-block text-right" ref={menuRef}>
      <button
        type="button"
        disabled={disabled || isLoading}
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-xs hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span>{label}</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-80" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-52 rounded-2xl bg-white shadow-xl ring-1 ring-black/5 divide-y divide-slate-100 z-50 text-xs overflow-hidden border border-slate-200">
          <div className="p-1">
            <button
              type="button"
              onClick={handleExcelClick}
              className="group flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors text-right cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-right">
                <span className="font-bold">خروجی اکسل (XLSX)</span>
                <span className="text-[10px] text-slate-400">راست‌به‌چپ با فرمول‌های جمع کل</span>
              </div>
            </button>
          </div>

          <div className="p-1">
            <button
              type="button"
              onClick={handlePrintClick}
              className="group flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors text-right cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-right">
                <span className="font-bold">چاپ و پیش‌نمایش</span>
                <span className="text-[10px] text-slate-400">چاپ استاندارد A4 افقی/عمودی</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
