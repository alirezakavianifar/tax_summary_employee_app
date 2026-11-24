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
  Clock,
  Shield,
} from 'lucide-react'
import { customDatasetApi } from '@/lib/api/customDataset'
import { reportCategoriesApi, ReportCategoryItem } from '@/lib/api/reportCategories'
import { ORGANIZATIONAL_ROLES, toggleRoleSelection } from '@/lib/constants/menuRoles'
import {
  CustomDatasetConfig,
  CustomDatasetColumn,
  CustomDatasetDataType,
  TweakCustomReportRequest,
} from '@/types/customDataset'
import { toPersianDigits, formatIsoToJalali } from '@/lib/jalali'
import { useMenuSettings } from '@/contexts/MenuSettingsContext'

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
  const { isActionVisible } = useMenuSettings()
  const canDeleteReport = isActionVisible('action_reporting_delete_custom_dataset', 'module_reporting')
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
  const [validityExtensionDays, setValidityExtensionDays] = useState<number | null | 'remove'>(null)
  const [categories, setCategories] = useState<ReportCategoryItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

  // Column search filter
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'columns' | 'filters' | 'roles' | 'maintenance'>('columns')
  const [isRoleRestricted, setIsRoleRestricted] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])

  useEffect(() => {
    if (isOpen && reportCode) {
      loadConfig(reportCode)
      setValidityExtensionDays(null)
    } else {
      setConfig(null)
      setColumns([])
      setValidityExtensionDays(null)
      setErrorMessage(null)
      setSuccessMessage(null)
    }
  }, [isOpen, reportCode])

  const loadConfig = async (code: string) => {
    setIsLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      const [data, cats] = await Promise.all([
        customDatasetApi.getConfig(code),
        reportCategoriesApi.getActive().catch(() => [] as ReportCategoryItem[]),
      ])
      setConfig(data)
      setCategories(cats || [])
      setSelectedCategory(data.domainSource || 6)
      setColumns(data.columns)
      setQuickFilters(data.quickFilterColumns || [])
      setDefaultSortField(data.defaultSortField || '')
      setDefaultSortDescending(data.defaultSortDescending ?? true)
      if (data.requiredRole && data.requiredRole.trim()) {
        setIsRoleRestricted(true)
        setSelectedRoles(data.requiredRole.split(',').map((r: string) => r.trim()).filter(Boolean))
      } else {
        setIsRoleRestricted(false)
        setSelectedRoles(['Admin', 'DirectorGeneral', 'Manager', 'Expert'])
      }
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
      domainSource: selectedCategory || undefined,
      defaultSortField,
      defaultSortDescending,
      quickFilterColumns: quickFilters,
      columns,
      requiredRole: isRoleRestricted && selectedRoles.length > 0 ? selectedRoles.join(',') : '',
      validityDays: validityExtensionDays === 'remove' ? -1 : (validityExtensionDays ?? undefined),
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
            onClick={() => setActiveTab('roles')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 font-bold transition-colors ${
              activeTab === 'roles'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>سطوح دسترسی و نقش‌ها</span>
            {isRoleRestricted && (
              <span className="rounded-full bg-amber-100 text-amber-800 px-1.5 py-0.2 text-[10px] font-bold">
                محدود ({toPersianDigits(selectedRoles.length)})
              </span>
            )}
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

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    حوزه و دسته‌بندی موضوعی گزارش:
                  </label>
                  <select
                    value={selectedCategory ?? ''}
                    onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
                    className="w-full sm:w-1/2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-purple-500 focus:outline-hidden"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    تغییر دسته‌بندی باعث انتقال گزارش به زبانه مربوطه در کاتالوگ خواهد شد.
                  </span>
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

              {/* TTL and Expiration Lifecycle */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <h4 className="text-sm font-bold text-slate-800">
                    دوره اعتبار و مهلت نمایش گزارش (Time-To-Live - TTL)
                  </h4>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  تعیین بازه زمانی مجاز برای نمایش گزارش به کاربران عادی و بایگانی خودکار پس از پایان مهلت
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <span className="text-slate-400 block mb-1">وضعیت فعلی اعتبار:</span>
                    <span className="font-bold text-slate-800">
                      {config?.expiresAt ? (
                        config.isExpired ? (
                          <span className="text-rose-600 font-extrabold">منقضی و بایگانی شده</span>
                        ) : (
                          <span className="text-emerald-700 font-extrabold">
                            فعال تا {formatIsoToJalali(config.expiresAt, true)}
                          </span>
                        )
                      ) : (
                        <span className="text-slate-600 font-bold">دائمی / بدون انقضا</span>
                      )}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      تمدید یا تغییر مهلت اعتبار:
                    </label>
                    <select
                      value={validityExtensionDays === 'remove' ? 'remove' : validityExtensionDays ?? ''}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === 'remove') setValidityExtensionDays('remove')
                        else if (val) setValidityExtensionDays(Number(val))
                        else setValidityExtensionDays(null)
                      }}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 focus:border-purple-500 focus:outline-hidden"
                    >
                      <option value="">بدون تغییر در مهلت فعلی</option>
                      <option value="7">تمدید ۷ روزه از اکنون</option>
                      <option value="30">تمدید ۳۰ روزه (۱ ماه) از اکنون</option>
                      <option value="90">تمدید ۹۰ روزه (۳ ماه) از اکنون</option>
                      <option value="180">تمدید ۱۸۰ روزه (۶ ماه) از اکنون</option>
                      <option value="365">تمدید ۳۶۵ روزه (۱ سال) از اکنون</option>
                      <option value="remove">حذف انقضا (تبدیل به گزارش دائمی)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              {canDeleteReport && (
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
              )}
            </div>
          )}

          {/* TAB 4: Role Permissions Management */}
          {!isLoading && activeTab === 'roles' && (
            <div className="space-y-6 max-w-2xl">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-amber-600" />
                    <span>پیکربندی نقش‌ها و کاربران مجاز برای مشاهده و اجرای این گزارش</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    می‌توانید مشخص کنید چه نقش‌های سازمانی امکان مشاهده کارت این گزارش در کاتالوگ و اجرای کوئری‌های آن را دارند.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row items-stretch gap-3">
                    <label className={`text-xs text-slate-700 font-bold flex items-start gap-2.5 cursor-pointer p-3.5 rounded-xl border transition-all flex-1 ${
                      !isRoleRestricted ? 'border-purple-500 bg-purple-50/30 ring-1 ring-purple-500/20' : 'border-slate-200 hover:bg-slate-50'
                    }`}>
                      <input
                        type="radio"
                        name="drawerRoleRestriction"
                        checked={!isRoleRestricted}
                        onChange={() => setIsRoleRestricted(false)}
                        className="text-purple-600 focus:ring-purple-500 mt-0.5"
                      />
                      <div>
                        <span className="block font-bold text-slate-800">عمومی (همه کاربران مجاز کاتالوگ)</span>
                        <span className="block text-[11px] text-slate-500 font-normal mt-0.5">تمام کاربرانی که به صفحه کاتالوگ گزارش‌ها دسترسی دارند این گزارش را مشاهده و اجرا خواهند کرد.</span>
                      </div>
                    </label>

                    <label className={`text-xs text-slate-700 font-bold flex items-start gap-2.5 cursor-pointer p-3.5 rounded-xl border transition-all flex-1 ${
                      isRoleRestricted ? 'border-purple-500 bg-purple-50/30 ring-1 ring-purple-500/20' : 'border-slate-200 hover:bg-slate-50'
                    }`}>
                      <input
                        type="radio"
                        name="drawerRoleRestriction"
                        checked={isRoleRestricted}
                        onChange={() => setIsRoleRestricted(true)}
                        className="text-purple-600 focus:ring-purple-500 mt-0.5"
                      />
                      <div>
                        <span className="block font-bold text-slate-800">محدود به نقش‌های منتخب</span>
                        <span className="block text-[11px] text-slate-500 font-normal mt-0.5">صرفاً نقش‌های علامت‌گذاری شده زیر مجاز به مشاهده کارت گزارش و استخراج داده‌ها خواهند بود.</span>
                      </div>
                    </label>
                  </div>

                  {isRoleRestricted && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-200">
                      <span className="text-xs font-bold text-slate-700 block">
                        نقش‌های مجاز را انتخاب نمایید:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {ORGANIZATIONAL_ROLES.map((r) => {
                          const isSelected = selectedRoles.includes(r.key)
                          return (
                            <button
                              key={r.key}
                              type="button"
                              onClick={() => setSelectedRoles((prev) => toggleRoleSelection(prev, r.key))}
                              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold border transition-all ${
                                isSelected
                                  ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <span>{r.label}</span>
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </button>
                          )
                        })}
                      </div>
                      <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200/80">
                        توجه: مدیر ارشد سامانه (Admin) همواره دسترسی نامحدود دارد. نقش «کارشناس» دسترسی‌های سطح «کارمند» را نیز در بر می‌گیرد.
                      </p>
                    </div>
                  )}
                </div>
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
