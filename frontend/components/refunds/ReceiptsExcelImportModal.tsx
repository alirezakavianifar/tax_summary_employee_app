'use client'

import React, { useState, useRef } from 'react'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  Check,
  RefreshCw,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import { taxRefundApi } from '@/lib/api/taxRefund'
import type { ParsedReceiptRow, ReceiptExcelParseResult } from '@/types/taxRefund'
import { toPersianDigits } from '@/lib/jalali'
import type { ReceiptItem } from './ReceiptsTableEditor'

interface ReceiptsExcelImportModalProps {
  isOpen: boolean
  onClose: () => void
  currentReceipts: ReceiptItem[]
  onImport: (newReceipts: ReceiptItem[]) => void
}

export default function ReceiptsExcelImportModal({
  isOpen,
  onClose,
  currentReceipts,
  onImport,
}: ReceiptsExcelImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parseResult, setParseResult] = useState<ReceiptExcelParseResult | null>(null)
  const [selectedRowIndices, setSelectedRowIndices] = useState<Set<number>>(new Set())
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append')
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileChange = async (selectedFile: File) => {
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase()
    if (!['.xls', '.xlsx', '.xml'].includes(ext)) {
      setError('فرمت فایل نامعتبر است. لطفاً فایل با پسوند .xls یا .xlsx انتخاب نمایید.')
      return
    }

    setFile(selectedFile)
    setError(null)
    setLoading(true)

    try {
      const result = await taxRefundApi.parseReceiptsExcel(selectedFile)
      setParseResult(result)

      // By default, select all valid rows
      const validIndices = new Set(
        result.receipts.filter((r) => r.isValid).map((r) => r.rowIndex)
      )
      setSelectedRowIndices(validIndices)
    } catch (err: any) {
      console.error('Failed to parse receipts excel:', err)
      setError(err?.response?.data?.error || err.message || 'خطا در بارگذاری و پردازش فایل اکسل')
      setParseResult(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  const handleToggleRow = (rowIndex: number) => {
    const next = new Set(selectedRowIndices)
    if (next.has(rowIndex)) {
      next.delete(rowIndex)
    } else {
      next.add(rowIndex)
    }
    setSelectedRowIndices(next)
  }

  const handleToggleAll = () => {
    if (!parseResult) return
    const allValid = parseResult.receipts.filter((r) => r.isValid)
    if (selectedRowIndices.size === allValid.length) {
      setSelectedRowIndices(new Set())
    } else {
      setSelectedRowIndices(new Set(allValid.map((r) => r.rowIndex)))
    }
  }

  const handleConfirmImport = () => {
    if (!parseResult) return

    const selectedRows = parseResult.receipts.filter((r) =>
      selectedRowIndices.has(r.rowIndex)
    )

    if (selectedRows.length === 0) {
      setError('حداقل یک قبض را برای افزودن انتخاب نمایید.')
      return
    }

    const convertedItems: ReceiptItem[] = selectedRows.map((r, idx) => ({
      rowIndex: idx + 1,
      receiptNumber: r.receiptNumber,
      issueDateJalali: r.issueDateJalali,
      paymentDateJalali: r.paymentDateJalali || r.issueDateJalali,
      amountRials: r.amountRials,
      bankBranch: r.bankName || r.taxOffice || undefined,
      city: r.city || undefined,
      revenueLedgerRow: undefined,
    }))

    let finalReceipts: ReceiptItem[] = []

    if (importMode === 'replace') {
      finalReceipts = convertedItems.map((item, idx) => ({
        ...item,
        rowIndex: idx + 1,
      }))
    } else {
      // Append mode: avoid duplicate receipt numbers
      const existingMap = new Map(currentReceipts.map((r) => [r.receiptNumber, r]))
      const nonDuplicates = convertedItems.filter((item) => !existingMap.has(item.receiptNumber))

      finalReceipts = [...currentReceipts, ...nonDuplicates].map((item, idx) => ({
        ...item,
        rowIndex: idx + 1,
      }))
    }

    onImport(finalReceipts)
    handleReset()
    onClose()
  }

  const handleReset = () => {
    setFile(null)
    setParseResult(null)
    setError(null)
    setSelectedRowIndices(new Set())
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatNumber = (num: number) => {
    if (num == null || isNaN(num)) return '۰'
    return toPersianDigits(Math.round(num).toLocaleString('en-US'))
  }

  const selectedCount = selectedRowIndices.size
  const selectedAmountSum = parseResult
    ? parseResult.receipts
        .filter((r) => selectedRowIndices.has(r.rowIndex))
        .reduce((sum, r) => sum + (r.amountRials || 0), 0)
    : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-purple-800 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
              <FileSpreadsheet className="w-6 h-6 text-purple-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                بارگذاری و استخراج گروهی قبوض پرداختی از فایل اکسل
              </h2>
              <p className="text-xs text-purple-200 mt-0.5">
                پشتیبانی هوشمند از قالب‌های خروجی سامانه مالیاتی (لیست پرداخت‌های مودی و لیست قبوض)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* File Selector Dropzone */}
          {!parseResult && !loading && (
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragOver(true)
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
                isDragOver
                  ? 'border-purple-600 bg-purple-50 scale-[0.99]'
                  : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50/70'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xls,.xlsx,.xml"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0])
                  }
                }}
              />
              <div className="w-16 h-16 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-gray-800 text-base mb-1">
                فایل اکسل قبوض پرداختی را انتخاب کرده یا به اینجا بکشید
              </h3>
              <p className="text-xs text-gray-500 mb-4 max-w-md mx-auto leading-5">
                فایل‌های با پسوند <span className="font-mono font-bold text-purple-700">.xls</span>،{' '}
                <span className="font-mono font-bold text-purple-700">.xlsx</span> یا فایل‌های خروجی استاندارد سنیم/مالیات
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md hover:bg-purple-800 transition-colors">
                <FileSpreadsheet className="w-4 h-4" />
                <span>انتخاب فایل از رایانه</span>
              </div>

              {/* Supported formats guidance card */}
              <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-right max-w-2xl mx-auto">
                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-xs">
                  <span className="font-bold text-purple-900 block mb-1">
                    ✓ قالب ۱: لیست پرداخت‌های مودی
                  </span>
                  <span className="text-gray-600 leading-5 block text-[11px]">
                    شامل شماره قبض، تاریخ قبض، تاریخ وصول، جمع مبلغ مالیات، شهر و واحد مالیاتی
                  </span>
                </div>
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs">
                  <span className="font-bold text-indigo-900 block mb-1">
                    ✓ قالب ۲: لیست قبوض سامانه مالیاتی
                  </span>
                  <span className="text-gray-600 leading-5 block text-[11px]">
                    شامل شماره قبض، تاریخ ثبت، تاریخ تغییر وضعیت، نام مودی، اصل مالیات و توضیحات
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="p-12 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-bold text-gray-700">
                در حال پردازش، تجزیه ساختار و اعتبارسنجی اطلاعات قبوض...
              </p>
              <p className="text-xs text-gray-400">
                {file?.name}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold mb-1">خطا در بارگذاری فایل:</p>
                <p>{error}</p>
              </div>
              <button
                onClick={handleReset}
                className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-lg font-bold text-xs transition-colors"
              >
                انتخاب مجدد
              </button>
            </div>
          )}

          {/* Parsed Result Workspace */}
          {parseResult && !loading && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* File & Detection Badges Bar */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-gray-700">نام فایل:</span>
                  <span className="font-mono text-purple-900 font-semibold bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                    {file?.name}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 font-bold border border-purple-200">
                    {parseResult.detectedStyle}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-gray-200 text-gray-700 font-mono text-[11px]">
                    {parseResult.fileFormat}
                  </span>
                </div>
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-xl font-bold border border-gray-200 transition-colors flex items-center gap-1.5 text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>بارگذاری فایل دیگر</span>
                </button>
              </div>

              {/* Summary KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 text-center">
                  <span className="text-gray-500 block text-xs mb-1">کل قبوض شناسایی شده</span>
                  <span className="text-base sm:text-lg font-bold text-gray-900 font-mono">
                    {toPersianDigits(parseResult.totalRows)}
                  </span>
                </div>
                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                  <span className="text-emerald-700 block text-xs mb-1">قبوض معتبر</span>
                  <span className="text-base sm:text-lg font-bold text-emerald-900 font-mono">
                    {toPersianDigits(parseResult.validRows)}
                  </span>
                </div>
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-center">
                  <span className="text-amber-700 block text-xs mb-1">دارای خطا یا هشدار</span>
                  <span className="text-base sm:text-lg font-bold text-amber-900 font-mono">
                    {toPersianDigits(parseResult.errorRows)}
                  </span>
                </div>
                <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-200 text-center">
                  <span className="text-purple-700 block text-xs mb-1">مجموع مبالغ انتخابی (ریال)</span>
                  <span className="text-base sm:text-lg font-bold text-purple-900 font-mono">
                    {formatNumber(selectedAmountSum)}
                  </span>
                </div>
              </div>

              {/* Import Mode Selector & Bulk Select Bar */}
              <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-gray-800">نحوه افزودن به جدول (الف):</span>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700 hover:text-purple-900">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span>افزودن به قبوض قبلی (Append)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700 hover:text-purple-900">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span>جایگزینی کامل تمام قبوض (Replace)</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleAll}
                    className="px-3 py-1.5 bg-white hover:bg-gray-100 text-purple-800 rounded-xl border border-purple-200 font-bold transition-colors"
                  >
                    {selectedRowIndices.size === parseResult.receipts.filter((r) => r.isValid).length
                      ? 'لغو انتخاب همه'
                      : 'انتخاب همه قبوض معتبر'}
                  </button>
                </div>
              </div>

              {/* Receipts Preview Table */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="max-h-[380px] overflow-y-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-gray-100 text-gray-700 font-bold sticky top-0 z-10 border-b border-gray-200">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={
                              parseResult.receipts.filter((r) => r.isValid).length > 0 &&
                              selectedRowIndices.size ===
                                parseResult.receipts.filter((r) => r.isValid).length
                            }
                            onChange={handleToggleAll}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                        </th>
                        <th className="p-3 w-12 text-center">ردیف</th>
                        <th className="p-3">شماره قبض</th>
                        <th className="p-3 text-center">تاریخ صدور</th>
                        <th className="p-3 text-center">تاریخ وصول</th>
                        <th className="p-3">مبلغ قبض (ریال)</th>
                        <th className="p-3">بانک / شعبه</th>
                        <th className="p-3">شهر</th>
                        <th className="p-3">وضعیت / توضیحات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parseResult.receipts.map((row) => {
                        const isSelected = selectedRowIndices.has(row.rowIndex)
                        return (
                          <tr
                            key={row.rowIndex}
                            className={`transition-colors ${
                              !row.isValid
                                ? 'bg-rose-50/40 text-gray-500'
                                : isSelected
                                ? 'bg-purple-50/50 hover:bg-purple-50'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleRow(row.rowIndex)}
                                disabled={!row.isValid}
                                className="rounded text-purple-600 focus:ring-purple-500 disabled:opacity-30"
                              />
                            </td>
                            <td className="p-3 text-center font-mono text-gray-500 font-bold">
                              {toPersianDigits(row.rowIndex)}
                            </td>
                            <td className="p-3 font-mono font-bold text-gray-900">
                              {toPersianDigits(row.receiptNumber)}
                            </td>
                            <td className="p-3 text-center font-mono text-gray-700">
                              {toPersianDigits(row.issueDateJalali)}
                            </td>
                            <td className="p-3 text-center font-mono text-gray-700">
                              {toPersianDigits(row.paymentDateJalali || '-')}
                            </td>
                            <td className="p-3 font-mono font-bold text-purple-900">
                              {formatNumber(row.amountRials)}
                            </td>
                            <td className="p-3 text-gray-700">
                              {row.bankName || row.taxOffice || '-'}
                            </td>
                            <td className="p-3 text-gray-700">{row.city || '-'}</td>
                            <td className="p-3">
                              {row.warnings.length > 0 ? (
                                <div className="space-y-0.5">
                                  {row.warnings.map((w, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md font-medium"
                                    >
                                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                                      {w}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  معتبر
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-gray-600">
            {parseResult && (
              <span>
                تعداد قبوض انتخاب شده جهت افزودن:{' '}
                <strong className="text-purple-900 font-mono text-sm">
                  {toPersianDigits(selectedCount)}
                </strong>{' '}
                فقره | مجموع مبلغ:{' '}
                <strong className="text-purple-900 font-mono text-sm">
                  {formatNumber(selectedAmountSum)}
                </strong>{' '}
                ریال
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl font-bold text-xs transition-colors"
            >
              انصراف
            </button>
            {parseResult && (
              <button
                onClick={handleConfirmImport}
                disabled={selectedCount === 0}
                className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold text-xs shadow-md shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  تأیید و افزودن {toPersianDigits(selectedCount)} قبض به جدول (الف)
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
