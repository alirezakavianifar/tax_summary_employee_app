'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  SlidersHorizontal,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Trash2,
  RefreshCw,
  PlusCircle,
  FileSpreadsheet,
  Filter,
  Check,
} from 'lucide-react'
import { customDatasetApi } from '@/lib/api/customDataset'
import {
  CustomDatasetConfig,
  CustomDatasetColumn,
  CustomDatasetDataType,
  TweakCustomReportRequest,
} from '@/types/customDataset'
import { toPersianDigits } from '@/lib/jalali'

interface ReportTweakDrawerProps {
  isOpen: boolean
  reportCode: string | null
  onClose: () => void
  onSaved?: () => void
}

export function ReportTweakDrawer({
  isOpen,
  reportCode,
  onClose,
  onSaved,
}: ReportTweakDrawerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Report config
  const [config, setConfig] = useState<CustomDatasetConfig | null>(null)
  const [reportTitle, setReportTitle] = useState('')
  const [columns, setColumns] = useState<CustomDatasetColumn[]>([])
  const [quickFilters, setQuickFilters] = useState<string[]>([])
  const [defaultSortField, setDefaultSortField] = useState<string>('')
  const [defaultSortDescending, setDefaultSortDescending] = useState(true)

  // Column search filter
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'columns' | 'filters' | 'maintenance'>('columns')

  useEffect(() => {
    if (isOpen && reportCode) {
      loadConfig(reportCode)
    } else {
      setConfig(null)
      setColumns([])
      setErrorMessage(null)
      setSuccessMessage(null)
    }
  }, [isOpen, reportCode])

  const loadConfig = async (code: string) => {
    setIsLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      const data = await customDatasetApi.getConfig(code)
      setConfig(data)
      setColumns(data.columns)
      setQuickFilters(data.quickFilterColumns || [])
      setDefaultSortField(data.defaultSortField || '')
      setDefaultSortDescending(data.defaultSortDescending ?? true)
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || err.message || 'خطا در بارگذاری تنظیمات گزارش')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !reportCode) return null

  const handleToggleVisibility = (fieldName: string) => {
    setColumns((prev) =>
      prev.map((c) => (c.fieldName === fieldName ? { ...c, isVisible: !c.isVisible } : c))
    )
  }

  const handleSelectAllVisibility = (visible: boolean) => {
    setColumns((prev) => prev.map((c) => ({ ...c, isVisible: visible })))
  }

  const handleSelectKeyColumns = () => {
    setColumns((prev) =>
      prev.map((c, i) => ({
        ...c,
        isVisible:
          i < 15 ||
          c.dataType === 'currency' ||
          c.dataType === 'year' ||
          c.originalHeader.includes('اداره') ||
          c.originalHeader.includes('نام مودی'),
      }))
    )
  }

  const handleLabelChange = (fieldName: string, newLabel: string) => {
    setColumns((prev) =>
      prev.map((c) => (c.fieldName === fieldName ? { ...c, persianLabel: newLabel } : c))
    )
  }

  const handleTypeChange = (fieldName: string, newType: CustomDatasetDataType) => {
    setColumns((prev) =>
      prev.map((c) => {
        if (c.fieldName !== fieldName) return c
        const isCurr = newType === 'currency'
        return {
          ...c,
          dataType: newType,
          hasAggregateSum: isCurr || (newType === 'number' && c.hasAggregateSum),
          aggregate: isCurr ? 'Sum' : c.aggregate,
          alignment: isCurr ? 'left' : newType === 'id' || newType === 'year' || newType === 'date' ? 'center' : 'right',
        }
      })
    )
  }

  const handleAggregateChange = (fieldName: string, agg: 'Sum' | 'Average' | 'Count' | null) => {
    setColumns((prev) =>
      prev.map((c) => {
        if (c.fieldName !== fieldName) return c
        return {
          ...c,
          aggregate: agg,
          hasAggregateSum: agg === 'Sum',
        }
      })
    )
  }

  const handleMoveColumn = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= columns.length) return

    const updated = [...columns]
    const temp = updated[index]
    updated[index] = updated[targetIndex]
    updated[targetIndex] = temp

    // Reassign displayOrder
    updated.forEach((col, idx) => {
      col.displayOrder = idx + 1
    })

    setColumns(updated)
  }

  const handleToggleQuickFilter = (fieldName: string) => {
    setQuickFilters((prev) =>
      prev.includes(fieldName) ? prev.filter((f) => f !== fieldName) : [...prev, fieldName]
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    const payload: TweakCustomReportRequest = {
      title: reportTitle.trim() || reportCode,
      defaultSortField,
      defaultSortDescending,
      quickFilterColumns: quickFilters,
      columns,
    }

    try {
      await customDatasetApi.tweakReport(reportCode, payload)
      setSuccessMessage('تنظیمات گزارش با موفقیت ذخیره و اعمال شد.')
      if (onSaved) onSaved()
      setTimeout(() => {
        onClose()
      }, 1200)
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || err.message || 'خطا در ذخیره تنظیمات گزارش')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteReport = async () => {
    if (!window.confirm(`آیا از حذف کامل گزارش '${reportCode}' و جدول داده‌های آن اطمینان دارید؟ این عملیات غیرقابل بازگشت است.`)) {
      return
    }

    try {
      await customDatasetApi.deleteReport(reportCode)
      if (onSaved) onSaved()
      onClose()
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || err.message || 'خطا در حذف گزارش')
    }
  }

  const filteredColumns = columns.filter(
    (c) =>
      c.persianLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.originalHeader.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const visibleCount = columns.filter((c) => c.isVisible).length

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl ring-1 ring-slate-200 animate-in slide-in-from-left duration-300"
        dir="rtl"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-xs">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">
                  کنسول سفارشی‌سازی گزارش (Tweak Studio)
                </h3>
                <span className="rounded-md bg-purple-50 px-2 py-0.5 font-mono text-xs font-semibold text-purple-700" dir="ltr">
                  {reportCode}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                مدیریت ستون‌ها، عناوین فارسی، فرمت‌بندی مبالغ، فیلترهای سریع و سطرهای تجمیع
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 text-sm">
          <button
            onClick={() => setActiveTab('columns')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 font-bold transition-colors ${
              activeTab === 'columns'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>ستون‌ها و قالب‌بندی</span>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700">
              {toPersianDigits(visibleCount)} از {toPersianDigits(columns.length)}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('filters')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 font-bold transition-colors ${
              activeTab === 'filters'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>فیلترهای سریع و مرتب‌سازی</span>
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 font-bold transition-colors ${
              activeTab === 'maintenance'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <RefreshCw className="h-4 w-4" />
            <span>نگهداری داده‌ها ({toPersianDigits(config?.totalRowCount || 0)} رکورد)</span>
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex h-64 flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <span className="text-sm text-slate-500">در حال دریافت تنظیمات ستون‌ها...</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 ring-1 ring-emerald-200">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: Columns Management */}
          {!isLoading && activeTab === 'columns' && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجوی ستون بر اساس نام فارسی یا اکسل..."
                    className="w-full rounded-xl border border-slate-300 py-2 pr-9 pl-4 text-xs text-slate-700 placeholder-slate-400 focus:border-purple-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAllVisibility(true)}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    <Eye className="h-3.5 w-3.5 text-emerald-600" />
                    <span>نمایش همه</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAllVisibility(false)}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                    <span>عدم نمایش همه</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectKeyColumns}
                    className="flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100"
                  >
                    <span>ستون‌های اصلی و منتخب</span>
                  </button>
                </div>
              </div>

              {/* Column Rows Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
                <table className="w-full text-right text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-600">
                    <tr>
                      <th className="w-12 px-3 py-2.5 text-center">ترتیب</th>
                      <th className="w-14 px-3 py-2.5 text-center">نمایش</th>
                      <th className="px-3 py-2.5">عنوان ستون در گزارش</th>
                      <th className="px-3 py-2.5">عنوان اصلی در اکسل</th>
                      <th className="w-36 px-3 py-2.5">نوع قالب‌بندی</th>
                      <th className="w-32 px-3 py-2.5">محاسبه تجمیع</th>
                      <th className="w-20 px-3 py-2.5 text-center">جابجایی</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredColumns.map((col, idx) => {
                      const actualIdx = columns.findIndex((c) => c.fieldName === col.fieldName)
                      return (
                        <tr
                          key={col.fieldName}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            !col.isVisible ? 'bg-slate-50/50 opacity-60' : ''
                          }`}
                        >
                          {/* Order Index */}
                          <td className="px-3 py-2 text-center font-mono text-[11px] text-slate-400">
                            {toPersianDigits(actualIdx + 1)}
                          </td>

                          {/* Visibility Checkbox */}
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={col.isVisible}
                              onChange={() => handleToggleVisibility(col.fieldName)}
                              className="h-4 w-4 rounded-md border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                            />
                          </td>

                          {/* Persian Label Editable */}
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={col.persianLabel}
                              onChange={(e) => handleLabelChange(col.fieldName, e.target.value)}
                              className="w-full rounded-lg border border-transparent px-2 py-1 text-xs font-semibold text-slate-800 hover:border-slate-300 focus:border-purple-500 focus:bg-white focus:outline-hidden"
                            />
                          </td>

                          {/* Original Header */}
                          <td className="px-3 py-2 text-slate-500 text-[11px] truncate max-w-[140px]" title={col.originalHeader}>
                            {col.originalHeader}
                          </td>

                          {/* Data Type Selector */}
                          <td className="px-3 py-2">
                            <select
                              value={col.dataType}
                              onChange={(e) =>
                                handleTypeChange(col.fieldName, e.target.value as CustomDatasetDataType)
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-2xs focus:border-purple-500 focus:outline-hidden"
                            >
                              <option value="currency">مبلغ ریالی</option>
                              <option value="year">سال (بدون کاما)</option>
                              <option value="id">شناسه / کد</option>
                              <option value="number">عددی</option>
                              <option value="badge">برچسب وضعیت</option>
                              <option value="date">تاریخ شمسی</option>
                              <option value="string">متن</option>
                            </select>
                          </td>

                          {/* Aggregate Selector */}
                          <td className="px-3 py-2">
                            <select
                              value={col.aggregate || 'None'}
                              onChange={(e) =>
                                handleAggregateChange(
                                  col.fieldName,
                                  e.target.value === 'None'
                                    ? null
                                    : (e.target.value as 'Sum' | 'Average' | 'Count')
                                )
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-2xs focus:border-purple-500 focus:outline-hidden"
                            >
                              <option value="None">بدون جمع</option>
                              <option value="Sum">جمع کل (Sum)</option>
                              <option value="Average">میانگین (Avg)</option>
                              <option value="Count">شمارش (Count)</option>
                            </select>
                          </td>

                          {/* Move Column Up/Down */}
                          <td className="px-3 py-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                disabled={actualIdx === 0}
                                onClick={() => handleMoveColumn(actualIdx, 'up')}
                                className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 disabled:opacity-20"
                                title="انتقال به بالا"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={actualIdx === columns.length - 1}
                                onClick={() => handleMoveColumn(actualIdx, 'down')}
                                className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 disabled:opacity-20"
                                title="انتقال به پایین"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Filters & Default Sort */}
          {!isLoading && activeTab === 'filters' && (
            <div className="space-y-6">
              {/* Default Sort */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <h4 className="mb-3 text-sm font-bold text-slate-800">
                  مرتب‌سازی پیش‌فرض جدول
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      مرتب‌سازی بر اساس ستون:
                    </label>
                    <select
                      value={defaultSortField}
                      onChange={(e) => setDefaultSortField(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 focus:border-purple-500 focus:outline-hidden"
                    >
                      {columns.map((c) => (
                        <option key={c.fieldName} value={c.fieldName}>
                          {c.persianLabel} ({c.fieldName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">ترتیب:</label>
                    <select
                      value={defaultSortDescending ? 'desc' : 'asc'}
                      onChange={(e) => setDefaultSortDescending(e.target.value === 'desc')}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 focus:border-purple-500 focus:outline-hidden"
                    >
                      <option value="desc">نزولی (بیشترین به کمترین)</option>
                      <option value="asc">صعودی (کمترین به بیشترین)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Quick Filters */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800">
                    انتخاب فیلترهای سریع بالا (Quick Filter Dropdowns)
                  </h4>
                  <span className="text-xs text-slate-400">
                    ستون‌های منتخب در کادر بالای جدول جهت فیلتر و جستجوی سریع ظاهر خواهند شد
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {columns.map((col) => {
                    const isSelected = quickFilters.includes(col.fieldName)
                    return (
                      <button
                        key={col.fieldName}
                        type="button"
                        onClick={() => handleToggleQuickFilter(col.fieldName)}
                        className={`flex items-center justify-between rounded-xl border p-2.5 text-xs text-right transition-colors ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50/70 font-bold text-purple-900 shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className="truncate">{col.persianLabel}</span>
                        {isSelected && <Check className="h-4 w-4 text-purple-600 shrink-0 mr-1" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Maintenance & Lifecycle */}
          {!isLoading && activeTab === 'maintenance' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <h4 className="mb-2 text-sm font-bold text-slate-800">اطلاعات جدول داده پایگاه داده</h4>
                <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-3">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <span className="text-slate-400 block mb-1">نام جدول در SQLite:</span>
                    <span className="font-mono font-bold text-slate-800" dir="ltr">
                      {config?.datasetTableName}
                    </span>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <span className="text-slate-400 block mb-1">تعداد کل رکوردها:</span>
                    <span className="font-bold text-emerald-700 text-sm">
                      {toPersianDigits(config?.totalRowCount || 0)} رکورد
                    </span>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <span className="text-slate-400 block mb-1">فایل اولیه بارگذاری:</span>
                    <span className="font-bold text-slate-700 truncate block">
                      {config?.originalFileName || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="rounded-xl border border-red-200 bg-red-50/30 p-5">
                <h4 className="mb-1 text-sm font-bold text-red-800">عملیات حساس و حذف گزارش</h4>
                <p className="mb-4 text-xs text-red-600">
                  حذف این گزارش سبب پاک شدن کلیه رکوردهای جدول مربوطه و حذف گزارش از فهرست گزارش‌های استاندارد می‌گردد.
                </p>
                <button
                  type="button"
                  onClick={handleDeleteReport}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors shadow-xs"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>حذف دائمی این گزارش و داده‌های آن</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            انصراف
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>در حال اعمال تغییرات...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>ذخیره تغییرات و بازسازی گزارش</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
