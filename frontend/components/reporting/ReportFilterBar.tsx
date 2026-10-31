'use client'

import React, { useState } from 'react'
import { Filter, Search, RotateCcw, BookmarkPlus, ChevronDown, ChevronUp } from 'lucide-react'
import { ReportFilterParameters } from '@/types/reporting'

interface ReportFilterBarProps {
  filters: ReportFilterParameters
  onChange: (newFilters: ReportFilterParameters) => void
  onApply: () => void
  onReset: () => void
  onSavePreset?: () => void
  departmentsList?: string[]
  isLoading?: boolean
}

export function ReportFilterBar({
  filters,
  onChange,
  onApply,
  onReset,
  onSavePreset,
  departmentsList = [],
  isLoading = false,
}: ReportFilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const handleChange = (field: keyof ReportFilterParameters, value: any) => {
    onChange({
      ...filters,
      [field]: value,
      pageNumber: 1, // reset page on filter change
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onApply()
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-5">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50/70 border-b border-slate-200/80">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-xs sm:text-sm">
          <Filter className="w-4 h-4 text-amber-600" />
          <span>فیلترهای پارامتریک گزارش</span>
          {(filters.searchTerm || filters.shamsiDateFrom || filters.shamsiDateTo || filters.department) && (
            <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
              فیلترهای فعال
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onSavePreset && (
            <button
              type="button"
              onClick={onSavePreset}
              className="inline-flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 font-semibold transition-colors cursor-pointer"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>ذخیره الگو</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            title={isExpanded ? 'بستن پنل فیلتر' : 'باز کردن پنل فیلتر'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Filter inputs */}
      {isExpanded && (
        <form onSubmit={handleSubmit} className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search Term */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                جستجوی متن / کدملی / نام
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.searchTerm || ''}
                  onChange={(e) => handleChange('searchTerm', e.target.value)}
                  placeholder="جستجو در تمام ستون‌ها..."
                  className="w-full text-xs pr-8 pl-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                اداره / واحد سازمانی
              </label>
              {departmentsList.length > 0 ? (
                <select
                  value={filters.department || ''}
                  onChange={(e) => handleChange('department', e.target.value || undefined)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white"
                >
                  <option value="">تمام ادارات استان خوزستان</option>
                  {departmentsList.map((dept, i) => (
                    <option key={i} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={filters.department || ''}
                  onChange={(e) => handleChange('department', e.target.value || undefined)}
                  placeholder="مثال: امور مالیاتی اهواز"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white"
                />
              )}
            </div>

            {/* Shamsi Date From */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                از تاریخ شمسی (۱۴۰۴/۰۱/۰۱)
              </label>
              <input
                type="text"
                value={filters.shamsiDateFrom || ''}
                onChange={(e) => handleChange('shamsiDateFrom', e.target.value || undefined)}
                placeholder="۱۴۰۴/۰۱/۰۱"
                dir="ltr"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white font-mono text-center"
              />
            </div>

            {/* Shamsi Date To */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                تا تاریخ شمسی (۱۴۰۴/۱۲/۲۹)
              </label>
              <input
                type="text"
                value={filters.shamsiDateTo || ''}
                onChange={(e) => handleChange('shamsiDateTo', e.target.value || undefined)}
                placeholder="۱۴۰۴/۱۲/۲۹"
                dir="ltr"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white font-mono text-center"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>پاکسازی فیلترها</span>
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{isLoading ? 'در حال دریافت...' : 'اعمال فیلترها'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
