'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Database,
  Tag,
  Layers,
  ArrowRight,
  Info,
  Check,
  Building2,
  ListFilter,
  Sparkles,
} from 'lucide-react'
import { auditorMetricsApi } from '@/lib/api/auditorMetrics'
import {
  ImportantCasesInspectionResult,
  ImportantCasesUploadResult,
} from '@/types/srsAuditorMetrics'
import { toPersianDigits } from '@/lib/jalali'

interface ImportantCasesUploadModalProps {
  isOpen: boolean
  onClose: () => void
  currentLabel?: string
  currentTag?: string
  onSuccess?: (result: ImportantCasesUploadResult) => void
}

export function ImportantCasesUploadModal({
  isOpen,
  onClose,
  currentLabel = '۳۰۰ پرونده مهم',
  currentTag = '300Parvande, 100Parvande',
  onSuccess,
}: ImportantCasesUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [customLabel, setCustomLabel] = useState<string>(currentLabel)
  const [customTag, setCustomTag] = useState<string>(currentTag)
  const [allRowsAreImportant, setAllRowsAreImportant] = useState<boolean>(false)
  const [replaceExisting, setReplaceExisting] = useState<boolean>(false)
  const [selectedTinCol, setSelectedTinCol] = useState<string>('')

  const [isInspecting, setIsInspecting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inspectionResult, setInspectionResult] = useState<ImportantCasesInspectionResult | null>(null)
  const [uploadResult, setUploadResult] = useState<ImportantCasesUploadResult | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setCustomLabel(currentLabel || '۳۰۰ پرونده مهم')
      setCustomTag(currentTag || '300Parvande, 100Parvande')
      setFile(null)
      setError(null)
      setInspectionResult(null)
      setUploadResult(null)
      setAllRowsAreImportant(false)
      setReplaceExisting(false)
      setSelectedTinCol('')
    }
  }, [isOpen, currentLabel, currentTag])

  if (!isOpen) return null

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    await processFile(selectedFile)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const droppedFile = e.dataTransfer.files?.[0]
    if (!droppedFile) return
    await processFile(droppedFile)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const processFile = async (selectedFile: File) => {
    const isExcel =
      selectedFile.name.endsWith('.xlsx') ||
      selectedFile.name.endsWith('.xls') ||
      selectedFile.type.includes('spreadsheet') ||
      selectedFile.type.includes('excel')

    if (!isExcel) {
      setError('فرمت فایل پشتیبانی نمی‌شود. لطفاً یک فایل اکسل (.xlsx یا .xls) انتخاب نمایید.')
      return
    }

    setFile(selectedFile)
    setError(null)
    setIsInspecting(true)
    setInspectionResult(null)
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const result = await auditorMetricsApi.inspectImportantCases(formData)
      setInspectionResult(result)
      if (result.detectedTinColumn) {
        setSelectedTinCol(result.detectedTinColumn)
      }
      // If no type column detected or 0 tagged rows found, default allRowsAreImportant to true
      if (!result.detectedTypeColumn || result.taggedRowsCount === 0) {
        setAllRowsAreImportant(true)
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'خطا در بررسی فایل اکسل.')
    } finally {
      setIsInspecting(false)
    }
  }

  const handleUploadSubmit = async () => {
    if (!file) {
      setError('لطفاً ابتدا یک فایل اکسل انتخاب نمایید.')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('customLabel', customLabel.trim() || '۳۰۰ پرونده مهم')
      formData.append('customTag', customTag.trim() || '300Parvande')
      if (selectedTinCol) formData.append('tinColumn', selectedTinCol)
      formData.append('allRowsAreImportant', allRowsAreImportant ? 'true' : 'false')
      formData.append('replaceExisting', replaceExisting ? 'true' : 'false')

      const result = await auditorMetricsApi.uploadImportantCases(formData)
      setUploadResult(result)
      if (onSuccess) {
        onSuccess(result)
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'خطا در بارگذاری و پردازش پرونده‌های مهم.')
    } finally {
      setIsUploading(false)
    }
  }

  const labelPresets = [
    { label: '۱۰۰ پرونده مهم', tag: '100Parvande' },
    { label: '۳۰۰ پرونده مهم', tag: '300Parvande, 100Parvande' },
    { label: '۵۰ پرونده کلیدی', tag: '50Parvande' },
    { label: 'پرونده‌های مهم اشخاص حقوقی', tag: 'MajorCorporate' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto" dir="rtl">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50/70 via-indigo-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                بارگذاری و مدیریت پرونده‌های مهم سنیم
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                تعریف تعداد، برچسب‌ها و همگام‌سازی مودیان شاخص جهت ارزیابی در دسته‌بندی‌های حقوقی و ارزش افزوده
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-600" />
              <div>
                <p className="font-semibold">خطا در پردازش اطلاعات</p>
                <p className="mt-0.5 text-xs text-red-600/90">{error}</p>
              </div>
            </div>
          )}

          {uploadResult ? (
            /* Upload Success View */
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                همگام‌سازی پرونده‌های مهم با موفقیت انجام شد
              </h3>
              <p className="text-sm text-gray-600 max-w-lg mx-auto">
                {uploadResult.message}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto pt-4">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-xs text-gray-500 block">سطرهای اکسل</span>
                  <span className="text-lg font-bold text-gray-800 font-mono">
                    {toPersianDigits(uploadResult.totalExcelRows)}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-xs text-gray-500 block">مودیان برچسب‌خورده</span>
                  <span className="text-lg font-bold text-purple-700 font-mono">
                    {toPersianDigits(uploadResult.taggedTinCount)}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-xs text-gray-500 block">پرونده‌های سنیم به‌روز</span>
                  <span className="text-lg font-bold text-emerald-600 font-mono">
                    {toPersianDigits(uploadResult.updatedDatabaseCasesCount)}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-xs text-gray-500 block">عنوان جدید دسته‌بندی</span>
                  <span className="text-sm font-bold text-indigo-700 truncate block mt-1" title={uploadResult.majorCasesLabel}>
                    {uploadResult.majorCasesLabel}
                  </span>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm shadow-md transition-all"
                >
                  بستن و مشاهده کارنامه‌ها
                </button>
              </div>
            </div>
          ) : (
            /* Upload & Config Form */
            <div className="space-y-6">
              
              {/* Config Options Panel */}
              <div className="p-5 rounded-xl bg-purple-50/40 border border-purple-100 space-y-4">
                <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
                  <Tag className="w-4 h-4 text-purple-600" />
                  <span>تنظیمات نام‌گذاری و دسته‌بندی</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      عنوان دسته‌بندی نمایشی در کارنامه‌ها و گزارش‌ها:
                    </label>
                    <input
                      type="text"
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      placeholder="مثال: ۳۰۰ پرونده مهم، ۱۰۰ پرونده اول..."
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-[11px] text-gray-400 self-center">پیش‌نهادها:</span>
                      {labelPresets.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setCustomLabel(p.label)
                            setCustomTag(p.tag)
                          }}
                          className="px-2 py-0.5 text-[11px] rounded bg-white hover:bg-purple-100 border border-purple-200 text-purple-700 transition-colors"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      شناسه یا برچسب تگ در سنیم (تگ‌های معتبر):
                    </label>
                    <input
                      type="text"
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      placeholder="300Parvande, 100Parvande"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-mono text-left"
                      dir="ltr"
                    />
                    <span className="text-[11px] text-gray-400 block mt-1">
                      چندین برچسب را با کاما جدا کنید (مثال: 300Parvande, 100Parvande)
                    </span>
                  </div>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-purple-100">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={allRowsAreImportant}
                      onChange={(e) => setAllRowsAreImportant(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-gray-300"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-gray-800 block">
                        همه سطرهای فایل به عنوان پرونده مهم تلقی شوند
                      </span>
                      <span className="text-gray-500 text-[11px]">
                        (در صورت غیرفعال بودن، فقط سطرهایی که در ستون type علامت خورده‌اند لحاظ می‌شوند)
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={replaceExisting}
                      onChange={(e) => setReplaceExisting(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-gray-300"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-gray-800 block">
                        جایگزینی کامل برچسب‌ها
                      </span>
                      <span className="text-gray-500 text-[11px]">
                        (برچسب پرونده‌های قبلی سنیم پاک شده و فقط رکوردهای این فایل باقی می‌مانند)
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx, .xls"
                  className="hidden"
                />

                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    file
                      ? 'border-purple-300 bg-purple-50/20'
                      : 'border-gray-200 hover:border-purple-400 bg-gray-50/50 hover:bg-purple-50/10'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl">
                      {isInspecting ? (
                        <Loader2 className="w-8 h-8 animate-spin" />
                      ) : (
                        <UploadCloud className="w-8 h-8" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">
                        {file ? file.name : 'انتخاب یا رها کردن فایل اکسل پرونده‌های مهم'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        فرمت‌های مجاز: .xlsx و .xls (حداکثر ۲۰ مگابایت)
                      </p>
                    </div>
                    {file && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        <Check className="w-3.5 h-3.5" />
                        فایل با موفقیت بارگذاری شد ({(file.size / 1024).toFixed(1)} کیلوبایت)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Inspection Preview Section */}
              {inspectionResult && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span>پیش‌نمایش و اعتبارسنجی فایل اکسل</span>
                    </div>
                    <span className="text-xs text-gray-500 font-mono">
                      {inspectionResult.fileName}
                    </span>
                  </div>

                  {/* Quick Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <span className="text-xs text-gray-500 block">تعداد کل سطرها</span>
                      <span className="text-lg font-bold text-gray-800 font-mono">
                        {toPersianDigits(inspectionResult.totalRows)}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100">
                      <span className="text-xs text-purple-700 block">مودیان یکتا (TIN)</span>
                      <span className="text-lg font-bold text-purple-900 font-mono">
                        {toPersianDigits(inspectionResult.distinctTinCount)}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                      <span className="text-xs text-blue-700 block">سطرهای دارای برچسب type</span>
                      <span className="text-lg font-bold text-blue-900 font-mono">
                        {toPersianDigits(inspectionResult.taggedRowsCount)}
                      </span>
                    </div>

                    <div className={`p-3 rounded-xl border ${
                      inspectionResult.matchingDatabaseCasesCount > 0
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                        : 'bg-amber-50/60 border-amber-200 text-amber-800'
                    }`}>
                      <span className="text-xs block opacity-80">تطابق با سنیم در پایگاه داده</span>
                      <span className="text-lg font-bold font-mono">
                        {toPersianDigits(inspectionResult.matchingDatabaseCasesCount)} پرونده
                      </span>
                    </div>
                  </div>

                  {/* Column Mapping Selector */}
                  <div className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700">ستون کد اقتصادی (TIN):</span>
                      <select
                        value={selectedTinCol}
                        onChange={(e) => setSelectedTinCol(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs focus:ring-2 focus:ring-purple-500"
                      >
                        {inspectionResult.columns.map((col, idx) => (
                          <option key={idx} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>

                    {inspectionResult.detectedTypeColumn && (
                      <div className="text-gray-600 flex items-center gap-1.5">
                        <span className="font-semibold">ستون نوع (Type):</span>
                        <span className="px-2 py-0.5 rounded bg-gray-200 font-mono text-[11px]">
                          {inspectionResult.detectedTypeColumn}
                        </span>
                      </div>
                    )}

                    {inspectionResult.detectedTrackingColumn && (
                      <div className="text-gray-600 flex items-center gap-1.5">
                        <span className="font-semibold">ستون رهگیری:</span>
                        <span className="px-2 py-0.5 rounded bg-gray-200 font-mono text-[11px]">
                          {inspectionResult.detectedTrackingColumn}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Sample Rows Table */}
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 text-xs font-bold text-gray-700 flex justify-between items-center">
                      <span>نمونه رکوردهای شناسایی‌شده (۱۰ سطر اول)</span>
                      <span className="text-gray-400 font-normal">جهت اطمینان از صحت ستون‌ها</span>
                    </div>
                    <div className="overflow-x-auto max-h-48 overflow-y-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-gray-100/70 text-gray-600 sticky top-0">
                          <tr>
                            <th className="p-2.5 font-semibold text-center w-12">#</th>
                            <th className="p-2.5 font-semibold">شناسه / تین مودی</th>
                            <th className="p-2.5 font-semibold">نام مودی</th>
                            <th className="p-2.5 font-semibold">کد رهگیری</th>
                            <th className="p-2.5 font-semibold">مقدار نوع (Type)</th>
                            <th className="p-2.5 font-semibold text-center">وضعیت در سنیم</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {inspectionResult.sampleRows.map((sample) => (
                            <tr key={sample.rowIndex} className="hover:bg-purple-50/20">
                              <td className="p-2 text-center text-gray-400 font-mono">
                                {toPersianDigits(sample.rowIndex)}
                              </td>
                              <td className="p-2 font-mono font-medium text-gray-800" dir="ltr">
                                {sample.taxpayerTin || '—'}
                              </td>
                              <td className="p-2 text-gray-700 font-medium truncate max-w-[200px]" title={sample.taxpayerName || ''}>
                                {sample.taxpayerName || '—'}
                              </td>
                              <td className="p-2 font-mono text-gray-500" dir="ltr">
                                {sample.trackingCode || '—'}
                              </td>
                              <td className="p-2">
                                {sample.typeValue ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-50 text-purple-700 border border-purple-200">
                                    {sample.typeValue}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="p-2 text-center">
                                {sample.existsInDatabase ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    موجود در سنیم
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                                    ناموجود
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {!uploadResult && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
            >
              انصراف
            </button>

            <button
              type="button"
              onClick={handleUploadSubmit}
              disabled={!file || isInspecting || isUploading}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm text-white shadow-md transition-all ${
                !file || isInspecting || isUploading
                  ? 'bg-purple-300 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20 active:scale-95'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال پردازش و برچسب‌گذاری سنیم...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>تأیید و به‌روزرسانی پرونده‌های مهم</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

