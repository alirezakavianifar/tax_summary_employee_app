'use client'

import React, { useState, useRef } from 'react'
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  FileText,
  Layers,
  Sparkles,
  HelpCircle,
} from 'lucide-react'
import { auditorMetricsApi } from '@/lib/api/auditorMetrics'
import { toPersianDigits } from '@/lib/jalali'

interface AuditorVerificationUploadModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuditorVerificationUploadModal({
  isOpen,
  onClose,
}: AuditorVerificationUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const validateAndSetFile = (selectedFile: File) => {
    setError(null)
    setSuccess(false)
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      setError('صرفاً فایل‌های با فرمت اکسل (.xlsx, .xls) پشتیبانی می‌شوند.')
      return
    }
    setFile(selectedFile)
  }

  const handleProcessAndDownload = async () => {
    if (!file) {
      setError('لطفاً ابتدا فایل اکسل خام سوابق سنیم را انتخاب کنید.')
      return
    }

    try {
      setIsProcessing(true)
      setError(null)
      await auditorMetricsApi.uploadAndExportVerification(file)
      setSuccess(true)
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err.message ||
          'خطا در پردازش فایل اکسل و تولید خروجی راستی‌آزمایی.'
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setError(null)
    setSuccess(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                بارگذاری فایل اکسل سنیم و دریافت خروجی راستی‌آزمایی
              </h3>
              <p className="text-[11px] text-slate-400">
                تولید خودکار فایل اکسل دوبرگه‌ای (داده‌های خام + رتبه‌بندی با فرمول‌های زنده)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Information Notice */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3 text-xs leading-relaxed text-indigo-900">
            <Layers className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">نحوه عملکرد خروجی راستی‌آزمایی:</span>
              <p className="text-indigo-800/80 mt-1">
                این عملیات سوابق رسیدگی فایل شما را استخراج، دسته‌بندی‌های ۷ گانه را اعمال و
                یک فایل اکسل با دو برگه ایجاد می‌کند: در برگه اول داده‌های تفصیلی و در برگه دوم
                رتبه‌بندی حسابرسان با <strong>فرمول‌های زنده اکسل (COUNTIFS, SUM, RANK, IF)</strong> محاسبه
                می‌شود تا بتوانید صحت محاسبات را در نرم‌افزار اکسل مستقیماً اعتبارسنجی کنید.
              </p>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-7 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
              file
                ? 'border-indigo-400 bg-indigo-50/30'
                : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".xlsx,.xls"
              className="hidden"
            />

            {file ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{file.name}</h4>
                  <span className="text-xs text-slate-400 font-mono mt-0.5 block">
                    {toPersianDigits((file.size / 1024).toFixed(1))} کیلوبایت
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleReset()
                  }}
                  className="text-xs text-rose-600 hover:underline cursor-pointer"
                >
                  انتخاب فایل دیگر
                </button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700">
                    فایل خروجی اکسل سوابق سنیم را اینجا رها کنید
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    یا برای انتخاب فایل اکسل (.xlsx, .xls) کلیک کنید
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Status Banners */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                فایل اکسل راستی‌آزمایی با موفقیت تولید و دانلود شد. می‌توانید آن را در مایکروسافت
                اکسل باز کرده و فرمول‌های رتبه‌بندی را بررسی کنید.
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            بستن
          </button>

          <button
            type="button"
            onClick={handleProcessAndDownload}
            disabled={!file || isProcessing}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>در حال پردازش و درج فرمول‌ها...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>بارگذاری و دریافت فایل با فرمول‌ها</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
