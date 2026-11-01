'use client'

import React, { useState, useRef } from 'react'
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Table,
  Filter,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Layers,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Search,
  ListOrdered,
  Sparkles,
} from 'lucide-react'
import { customDatasetApi } from '@/lib/api/customDataset'
import {
  ExcelInspectionResult,
  CustomDatasetColumn,
  CustomDatasetDataType,
  CreateCustomDatasetRequest,
} from '@/types/customDataset'
import { ReportDefinition } from '@/types/reporting'
import { toPersianDigits } from '@/lib/jalali'

interface ExcelReportUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onReportCreated?: (report: ReportDefinition) => void
  onOpenTweakStudio?: (reportCode: string) => void
}

export function ExcelReportUploadModal({
  isOpen,
  onClose,
  onReportCreated,
  onOpenTweakStudio,
}: ExcelReportUploadModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [step2SubTab, setStep2SubTab] = useState<'general' | 'columns'>('general')
  const [columnSearchQuery, setColumnSearchQuery] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isInspecting, setIsInspecting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Inspection results
  const [inspection, setInspection] = useState<ExcelInspectionResult | null>(null)
  const [selectedSheet, setSelectedSheet] = useState<string>('')
  const [reportTitle, setReportTitle] = useState('')
  const [reportCode, setReportCode] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [columns, setColumns] = useState<CustomDatasetColumn[]>([])
  const [quickFilterColumns, setQuickFilterColumns] = useState<string[]>([])
  const [defaultSortField, setDefaultSortField] = useState<string>('')

  // Success state
  const [createdReport, setCreatedReport] = useState<ReportDefinition | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleToggleColumnVisibility = (fieldName: string) => {
    setColumns((prev) =>
      prev.map((c) => (c.fieldName === fieldName ? { ...c, isVisible: !c.isVisible } : c))
    )
  }

  const handleColumnLabelChange = (fieldName: string, newLabel: string) => {
    setColumns((prev) =>
      prev.map((c) => (c.fieldName === fieldName ? { ...c, persianLabel: newLabel } : c))
    )
  }

  const handleColumnTypeChange = (fieldName: string, newType: CustomDatasetDataType) => {
    setColumns((prev) =>
      prev.map((c) => {
        if (c.fieldName !== fieldName) return c
        const isCurr = newType === 'currency'
        return {
          ...c,
          dataType: newType,
          hasAggregateSum: isCurr,
          aggregate: isCurr ? 'Sum' : null,
          alignment:
            isCurr
              ? 'left'
              : newType === 'id' || newType === 'year' || newType === 'date'
              ? 'center'
              : 'right',
        }
      })
    )
  }

  const handleSelectAllVisibility = (visible: boolean) => {
    setColumns((prev) => prev.map((c) => ({ ...c, isVisible: visible })))
  }

  if (!isOpen) return null

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0])
    }
  }

  const handleFileSelected = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      setErrorMessage('صرفاً فایل‌های با فرمت اکسل (.xlsx, .xls) پشتیبانی می‌شوند.')
      return
    }

    setFile(selectedFile)
    setErrorMessage(null)
    setIsInspecting(true)

    try {
      const data = await customDatasetApi.inspectExcel(selectedFile)
      setInspection(data)
      setSelectedSheet(data.selectedSheet)
      setReportTitle(data.suggestedReportTitle)
      setReportCode(data.suggestedReportCode)
      setColumns(data.columns)

      // Auto-suggest quick filters: look for office, source, year, or status
      const suggestedFilters = data.columns
        .filter(
          (c) =>
            c.originalHeader.includes('اداره') ||
            c.originalHeader.includes('منبع') ||
            c.originalHeader.includes('وضعیت') ||
            c.dataType === 'year'
        )
        .slice(0, 4)
        .map((c) => c.fieldName)

      setQuickFilterColumns(suggestedFilters)

      // Default sort on primary currency or first visible column
      const primarySort =
        data.columns.find((c) => c.dataType === 'currency')?.fieldName ||
        data.columns[0]?.fieldName ||
        ''
      setDefaultSortField(primarySort)

      setStep(2)
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || err.message || 'خطا در بررسی ساختار فایل اکسل')
    } finally {
      setIsInspecting(false)
    }
  }

  const handleSheetChange = async (sheetName: string) => {
    if (!file || sheetName === selectedSheet) return
    setIsInspecting(true)
    setSelectedSheet(sheetName)
    try {
      const data = await customDatasetApi.inspectExcel(file, sheetName)
      setInspection(data)
      setColumns(data.columns)
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || err.message || 'خطا در بارگذاری برگه کاری')
    } finally {
      setIsInspecting(false)
    }
  }

  const handleToggleQuickFilter = (fieldName: string) => {
    setQuickFilterColumns((prev) =>
      prev.includes(fieldName) ? prev.filter((f) => f !== fieldName) : [...prev, fieldName]
    )
  }

  const handleCreateReport = async () => {
    if (!file) return
    if (!reportTitle.trim()) {
      setErrorMessage('عنوان گزارش نمی‌تواند خالی باشد.')
      return
    }
    if (!reportCode.trim()) {
      setErrorMessage('کد یکتای گزارش نمی‌تواند خالی باشد.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    const requestPayload: CreateCustomDatasetRequest = {
      reportCode: reportCode.trim().toUpperCase(),
      title: reportTitle.trim(),
      description: reportDescription.trim() || undefined,
      sheetName: selectedSheet,
      columns,
      quickFilterColumns,
      defaultSortField,
      defaultSortDescending: true,
      requiredRole: 'Admin,DirectorGeneral,Manager',
    }

    try {
      const newReport = await customDatasetApi.createCustomDataset(file, requestPayload)
      setCreatedReport(newReport)
      if (onReportCreated) onReportCreated(newReport)
      setStep(3)
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || err.message || 'خطا در ساخت گزارش و ثبت داده‌ها')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'currency':
        return <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">مبلغ ریالی</span>
      case 'year':
        return <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">سال عملکرد</span>
      case 'id':
        return <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">شناسه / کد</span>
      case 'date':
        return <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">تاریخ</span>
      case 'badge':
        return <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">وضعیت</span>
      case 'number':
        return <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">عددی</span>
      default:
        return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">متن</span>
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-sm">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                ایجاد گزارش هوشمند از فایل اکسل
              </h2>
              <p className="text-xs text-slate-500">
                بارگذاری آنی مجموعه داده، شناسایی خودکار ساختار ستون‌ها و تولید گزارش تعاملی
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

        {/* Step Indicator */}
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-3">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className={`flex items-center gap-2 ${step === 1 ? 'font-bold text-emerald-600' : 'text-slate-500'}`}>
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${step === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                ۱
              </span>
              <span>انتخاب و تحلیل فایل</span>
            </div>
            <span className="text-slate-300">———</span>
            <div className={`flex items-center gap-2 ${step === 2 ? 'font-bold text-emerald-600' : 'text-slate-500'}`}>
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${step === 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                ۲
              </span>
              <span>تنظیمات و پیش‌نمایش</span>
            </div>
            <span className="text-slate-300">———</span>
            <div className={`flex items-center gap-2 ${step === 3 ? 'font-bold text-emerald-600' : 'text-slate-500'}`}>
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${step === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                ۳
              </span>
              <span>تکمیل و راه‌اندازی</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {errorMessage && (
            <div className="mb-4 flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Upload Dropzone */}
          {step === 1 && (
            <div className="flex flex-col items-center justify-center py-8">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileInputChange}
              />
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className="group flex w-full max-w-xl cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-10 text-center transition-all hover:border-emerald-500 hover:bg-emerald-50/30"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-slate-200 group-hover:scale-110 transition-transform">
                  {isInspecting ? (
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                  ) : (
                    <UploadCloud className="h-8 w-8 text-emerald-600" />
                  )}
                </div>
                <h3 className="mb-1 text-base font-bold text-slate-800">
                  فایل اکسل مورد نظر را به اینجا بکشید یا کلیک کنید
                </h3>
                <p className="mb-4 text-xs text-slate-500">
                  پشتیبانی از فایل‌های اکسل تا حجم ۵۰ مگابایت (شامل فایل‌های چندبرگی با ده‌ها هزار رکورد)
                </p>
                <button
                  type="button"
                  disabled={isInspecting}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {isInspecting ? 'در حال تحلیل ساختار اکسل...' : 'انتخاب فایل از رایانه'}
                </button>
              </div>

              <div className="mt-8 grid max-w-xl grid-cols-3 gap-4 text-center">
                <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs">
                  <Sparkles className="mx-auto mb-1 h-5 w-5 text-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-700">شناسایی خودکار نوع ستون</h4>
                  <p className="text-[11px] text-slate-400">تشخیص مبالغ، سال‌ها و کدهای رهگیری</p>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs">
                  <Layers className="mx-auto mb-1 h-5 w-5 text-sky-600" />
                  <h4 className="text-xs font-bold text-slate-700">پشتیبانی چندبرگی</h4>
                  <p className="text-[11px] text-slate-400">انتخاب شیت مورد نظر از اکسل</p>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs">
                  <SlidersHorizontal className="mx-auto mb-1 h-5 w-5 text-purple-600" />
                  <h4 className="text-xs font-bold text-slate-700">امکان سفارشی‌سازی کامل</h4>
                  <p className="text-[11px] text-slate-400">تغییر عناوین و جمع کل ستون‌ها</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Configure & Preview */}
          {step === 2 && inspection && (
            <div className="space-y-6">
              {/* File Info Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{inspection.fileName}</h4>
                    <p className="text-xs text-slate-500">
                      حجم فایل: {formatFileSize(inspection.fileSizeBytes)} | تعداد ستون‌ها:{' '}
                      {toPersianDigits(columns.length)} ستون
                    </p>
                  </div>
                </div>

                {/* Sheet Selector */}
                {inspection.sheetNames.length > 1 && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-600">برگه کاری (Sheet):</label>
                    <select
                      value={selectedSheet}
                      onChange={(e) => handleSheetChange(e.target.value)}
                      disabled={isInspecting}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs focus:border-emerald-500 focus:outline-hidden"
                    >
                      {inspection.sheetNames.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Sub-Tabs: General Settings vs Column Reordering */}
              <div className="flex items-center gap-2 border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setStep2SubTab('general')}
                  className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-colors ${
                    step2SubTab === 'general'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>مشخصات و فیلترهای گزارش</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep2SubTab('columns')}
                  className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-colors ${
                    step2SubTab === 'columns'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ListOrdered className="h-4 w-4" />
                  <span>ترتیب و تنظیم ستون‌ها (جابجایی با ↑ و ↓)</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800">
                    {toPersianDigits(columns.filter((c) => c.isVisible).length)} از {toPersianDigits(columns.length)}
                  </span>
                </button>
              </div>

              {/* SubTab 1: General Settings, Quick Filters, and Preview */}
              {step2SubTab === 'general' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Title and Code Form */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-700">
                        عنوان گزارش در سامانه <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={reportTitle}
                        onChange={(e) => setReportTitle(e.target.value)}
                        placeholder="مانند: گزارش رسیدگی پرونده‌های مالیاتی سال ۱۴۰۵"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-700">
                        کد سیستمی گزارش (انگلیسی) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={reportCode}
                        onChange={(e) => setReportCode(e.target.value.toUpperCase())}
                        placeholder="مانند: REP_CUSTOM_AUDIT_1405"
                        dir="ltr"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 font-mono text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-bold text-slate-700">شرح کاربردی گزارش (اختیاری)</label>
                      <input
                        type="text"
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        placeholder="توضیح مختصر درباره محتوا و مخاطبان گزارش..."
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Quick Filters Picker */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-emerald-600" />
                        <h4 className="text-xs font-bold text-slate-700">
                          ستون‌های فیلتر سریع در بالای گزارش (Quick Filters)
                        </h4>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        ستون‌هایی که می‌خواهید به عنوان فیلتر جستجو نمایش داده شوند را تیک بزنید
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {columns.slice(0, 20).map((col) => {
                        const isSelected = quickFilterColumns.includes(col.fieldName)
                        return (
                          <button
                            key={col.fieldName}
                            type="button"
                            onClick={() => handleToggleQuickFilter(col.fieldName)}
                            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition-colors ${
                              isSelected
                                ? 'bg-emerald-600 font-semibold text-white shadow-xs'
                                : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <span>{col.persianLabel}</span>
                            {isSelected && <CheckCircle2 className="h-3 w-3" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Sample Data Table Preview */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Table className="h-4 w-4 text-slate-600" />
                        <h4 className="text-xs font-bold text-slate-700">
                          پیش‌نمایش ۱۰ رکورد اول و قالب‌بندی ستون‌ها
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep2SubTab('columns')}
                        className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                      >
                        <ListOrdered className="h-3.5 w-3.5" />
                        <span>تغییر ترتیب و چینش ستون‌ها ({toPersianDigits(columns.length)} ستون)</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                      <table className="w-full text-right text-xs">
                        <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                          <tr>
                            <th className="px-3 py-2.5 font-bold">#</th>
                            {columns.slice(0, 10).map((col) => (
                              <th key={col.fieldName} className="px-3 py-2.5 font-bold whitespace-nowrap">
                                <div>{col.persianLabel}</div>
                                <div className="mt-0.5">{getTypeBadge(col.dataType)}</div>
                              </th>
                            ))}
                            {columns.length > 10 && (
                              <th className="px-3 py-2.5 text-center text-slate-400">
                                +{toPersianDigits(columns.length - 10)} ستون دیگر...
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {inspection.sampleRows.slice(0, 5).map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="px-3 py-2 text-slate-400">{toPersianDigits(idx + 1)}</td>
                              {columns.slice(0, 10).map((col) => (
                                <td key={col.fieldName} className="px-3 py-2 whitespace-nowrap font-mono text-[11px]">
                                  {row[col.fieldName] !== null && row[col.fieldName] !== undefined
                                    ? String(row[col.fieldName])
                                    : '-'}
                                </td>
                              ))}
                              {columns.length > 10 && (
                                <td className="px-3 py-2 text-center text-slate-400">...</td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SubTab 2: Column Reordering & Visibility Management */}
              {step2SubTab === 'columns' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="relative flex-1 min-w-[240px]">
                      <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={columnSearchQuery}
                        onChange={(e) => setColumnSearchQuery(e.target.value)}
                        placeholder="جستجوی ستون بر اساس نام فارسی یا عنوان اکسل..."
                        className="w-full rounded-xl border border-slate-300 py-2 pr-9 pl-4 text-xs text-slate-700 placeholder-slate-400 focus:border-emerald-500 focus:outline-hidden"
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
                    </div>
                  </div>

                  {/* Reordering Table */}
                  <div className="max-h-[380px] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xs">
                    <table className="w-full text-right text-xs">
                      <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 text-slate-600 backdrop-blur-xs">
                        <tr>
                          <th className="w-12 px-3 py-2.5 text-center">ترتیب</th>
                          <th className="w-14 px-3 py-2.5 text-center">نمایش</th>
                          <th className="px-3 py-2.5">عنوان ستون در گزارش</th>
                          <th className="px-3 py-2.5">عنوان اصلی در اکسل</th>
                          <th className="w-36 px-3 py-2.5">نوع قالب‌بندی</th>
                          <th className="w-24 px-3 py-2.5 text-center">جابجایی</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {columns
                          .filter((c) => {
                            if (!columnSearchQuery.trim()) return true
                            const q = columnSearchQuery.toLowerCase()
                            return (
                              c.persianLabel.toLowerCase().includes(q) ||
                              c.originalHeader.toLowerCase().includes(q)
                            )
                          })
                          .map((col) => {
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
                                    onChange={() => handleToggleColumnVisibility(col.fieldName)}
                                    className="h-4 w-4 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                  />
                                </td>

                                {/* Persian Label Editable */}
                                <td className="px-3 py-2">
                                  <input
                                    type="text"
                                    value={col.persianLabel}
                                    onChange={(e) => handleColumnLabelChange(col.fieldName, e.target.value)}
                                    className="w-full rounded-lg border border-transparent px-2 py-1 text-xs font-semibold text-slate-800 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                                  />
                                </td>

                                {/* Original Header */}
                                <td
                                  className="px-3 py-2 text-slate-500 text-[11px] truncate max-w-[140px]"
                                  title={col.originalHeader}
                                >
                                  {col.originalHeader}
                                </td>

                                {/* Data Type Selector */}
                                <td className="px-3 py-2">
                                  <select
                                    value={col.dataType}
                                    onChange={(e) =>
                                      handleColumnTypeChange(
                                        col.fieldName,
                                        e.target.value as CustomDatasetDataType
                                      )
                                    }
                                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-2xs focus:border-emerald-500 focus:outline-hidden"
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

                                {/* Move Column Up/Down */}
                                <td className="px-3 py-2 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      disabled={actualIdx === 0}
                                      onClick={() => handleMoveColumn(actualIdx, 'up')}
                                      className="rounded p-1 text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-20 cursor-pointer"
                                      title="انتقال به بالا (Move Up)"
                                    >
                                      <ArrowUp className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={actualIdx === columns.length - 1}
                                      onClick={() => handleMoveColumn(actualIdx, 'down')}
                                      className="rounded p-1 text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-20 cursor-pointer"
                                      title="انتقال به پایین (Move Down)"
                                    >
                                      <ArrowDown className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    با کلیک روی دکمه‌های <span className="font-bold text-slate-600">↑</span> و{' '}
                    <span className="font-bold text-slate-600">↓</span> در هر ردیف، ترتیب نمایش ستون‌ها را در گزارش و پیش‌نمایش جابجا کنید.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Ingestion Success */}
          {step === 3 && createdReport && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 shadow-md">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-800">
                گزارش با موفقیت ایجاد شد!
              </h3>
              <p className="mb-6 max-w-md text-sm text-slate-500">
                مجموعه داده شما با موفقیت در پایگاه داده ذخیره شد و گزارش{' '}
                <span className="font-bold text-slate-700">«{createdReport.title}»</span> آماده بهره‌برداری
                و مشاهده است.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    if (onOpenTweakStudio) onOpenTweakStudio(createdReport.code)
                  }}
                  className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
                >
                  <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
                  <span>سفارشی‌سازی ستون‌ها و فیلترها (Tweak Studio)</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  <span>مشاهده گزارش در کاتالوگ استاندارد</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
              <span>بازگشت</span>
            </button>
          )}

          {step === 1 && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              انصراف
            </button>
          )}

          {step === 2 && (
            <button
              type="button"
              onClick={handleCreateReport}
              disabled={isSubmitting || !reportTitle.trim() || !reportCode.trim()}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>در حال ذخیره و ساخت جدول گزارش...</span>
                </>
              ) : (
                <>
                  <span>ایجاد و ثبت گزارش</span>
                  <ArrowLeft className="h-4 w-4" />
                </>
              )}
            </button>
          )}

          {step === 3 && (
            <div className="w-full text-left">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-slate-800 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-900 transition-colors"
              >
                بستن
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
