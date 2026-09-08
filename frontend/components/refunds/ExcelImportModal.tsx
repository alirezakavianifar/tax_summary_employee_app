'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, FileSpreadsheet, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { taxRefundApi } from '@/lib/api/taxRefund'

interface ExcelImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (caseId: string) => void
}

export default function ExcelImportModal({ isOpen, onClose, onSuccess }: ExcelImportModalProps) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const selected = e.target.files?.[0]
    if (!selected) return

    const ext = selected.name.substring(selected.name.lastIndexOf('.')).toLowerCase()
    if (!['.xlsm', '.xlsx'].includes(ext)) {
      setError('صرفاً فایل‌های با پسوند .xlsm یا .xlsx مجاز هستند')
      return
    }

    setFile(selected)
  }

  const handleUpload = async () => {
    if (!file) {
      setError('لطفاً یک فایل اکسل انتخاب کنید')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const importedCase = await taxRefundApi.importExcel(file)
      if (onSuccess) {
        onSuccess(importedCase.id)
      } else {
        router.push(`/refunds/${importedCase.id}`)
      }
      onClose()
    } catch (err: any) {
      setError(err.message || 'خطا در بارگذاری و تحلیل فایل اکسل')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-800 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
              <FileSpreadsheet className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">بارگذاری و تبدیل فایل اکسل استرداد</h3>
              <p className="text-xs text-purple-200">همگام با الگوی اکسل دلفی (tax_refund_delfi)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-600 leading-relaxed">
            فایل تکمیل‌شده اکسل استرداد (با پسوند <span className="font-mono font-bold text-purple-700">.xlsm</span> یا <span className="font-mono font-bold text-purple-700">.xlsx</span>) را بارگذاری کنید. سیستم به صورت خودکار اطلاعات مودی، کلیه قبوض جدول الف، استعلامات و محاسبات را استخراج و در پرونده جدید ثبت می‌کند.
          </p>

          {/* Drag & Drop / File Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              file
                ? 'border-emerald-400 bg-emerald-50/30'
                : 'border-purple-300 hover:border-purple-500 bg-purple-50/20 hover:bg-purple-50/40'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsm,.xlsx"
              className="hidden"
            />

            {file ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                <span className="text-xs font-bold text-gray-900 font-mono">{file.name}</span>
                <span className="text-[11px] text-gray-500">
                  حجم فایل: {(file.size / 1024).toFixed(1)} کیلوبایت
                </span>
                <span className="text-[11px] text-purple-600 font-semibold underline mt-1">
                  برای تغییر فایل کلیک کنید
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-500">
                <div className="p-3 bg-purple-100 text-purple-700 rounded-full mb-1">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-gray-800">
                  برای انتخاب فایل کلیک کنید یا فایل را اینجا رها نمایید
                </span>
                <span className="text-[11px] text-gray-400">فرمت‌های مجاز: .xlsm و .xlsx</span>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 transition-colors"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || loading}
            className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:bg-gray-300 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-md disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                در حال پردازش اکسل...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                بارگذاری و ثبت پرونده
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
