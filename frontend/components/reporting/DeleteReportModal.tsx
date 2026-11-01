'use client'

import React, { useState } from 'react'
import {
  AlertTriangle,
  Trash2,
  Archive,
  X,
  Loader2,
  Database,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react'
import { ReportDefinition } from '@/types/reporting'
import { reportingApi } from '@/lib/api/reporting'

interface DeleteReportModalProps {
  isOpen: boolean
  report: ReportDefinition | null
  onClose: () => void
  onDeleted: (reportCode: string) => void
  onStatusChanged?: (reportCode: string, newStatus: boolean) => void
}

export function DeleteReportModal({
  isOpen,
  report,
  onClose,
  onDeleted,
  onStatusChanged,
}: DeleteReportModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!isOpen || !report) return null

  const isCustomDataset =
    report.domainSource === 6 ||
    report.code.toUpperCase().startsWith('REP_CUSTOM_')

  const handleDelete = async () => {
    setIsProcessing(true)
    setErrorMessage(null)
    try {
      await reportingApi.deleteReport(report.code)
      onDeleted(report.code)
      onClose()
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.error ||
          err.message ||
          'خطا در حذف گزارش و پایگاه داده مربوطه'
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const handleToggleArchive = async () => {
    setIsProcessing(true)
    setErrorMessage(null)
    try {
      const res = await reportingApi.toggleReportStatus(report.code, !report.isActive)
      if (onStatusChanged) {
        onStatusChanged(report.code, res.isActive)
      }
      onClose()
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.error ||
          err.message ||
          'خطا در تغییر وضعیت بایگانی گزارش'
      )
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 animate-in zoom-in-95 duration-200"
        dir="rtl"
      >
        {/* Header */}
        <div className={`flex items-center justify-between border-b px-6 py-4 ${
          isCustomDataset
            ? 'bg-red-50/80 border-red-100 text-red-900'
            : 'bg-amber-50/80 border-amber-100 text-amber-900'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-xs ${
              isCustomDataset ? 'bg-red-600' : 'bg-amber-600'
            }`}>
              {isCustomDataset ? (
                <Trash2 className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold">
                {isCustomDataset ? 'حذف دائمی گزارش و پایگاه داده' : 'مدیریت و بایگانی گزارش سیستمی'}
              </h3>
              <p className="text-xs opacity-80">
                {isCustomDataset
                  ? 'پاک‌سازی کامل جدول SQLite و الگو'
                  : 'تغییر وضعیت نمایش در کاتالوگ پرتال'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/80 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Report Metadata Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700" dir="ltr">
                {report.code}
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                isCustomDataset
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {isCustomDataset ? 'داده‌های بارگذاری شده از اکسل' : 'گزارش مصوب پایه سیستمی'}
              </span>
            </div>

            <h4 className="text-sm font-bold text-slate-800">
              {report.title}
            </h4>
            {report.description && (
              <p className="text-xs text-slate-500 leading-relaxed">
                {report.description}
              </p>
            )}

            {isCustomDataset && (
              <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center gap-4 text-[11px] text-slate-600">
                <span className="flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  جدول اختصاصی: <code className="font-mono font-bold" dir="ltr">{`custom_dataset_${report.code.toLowerCase()}`}</code>
                </span>
              </div>
            )}
          </div>

          {/* Warning / Informational Details */}
          {isCustomDataset ? (
            <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 text-xs text-red-800 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block">هشدار مهم و غیرقابل بازگشت:</span>
                  <p className="text-red-700 leading-relaxed">
                    با تایید این عملیات، جدول اختصاصی این گزارش در پایگاه داده SQLite به صورت کامل
                    <strong> DROP (حذف فیزیکی)</strong> شده و کلیه رکوردهای وارد شده از اکسل برای همیشه پاک خواهند شد.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-xs text-amber-900 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block">اطلاعیه گزارش‌های سیستمی:</span>
                  <p className="text-amber-800 leading-relaxed">
                    این گزارش از الگوهای پایه سازمانی سامانه است و منطق محاسباتی آن در هسته سیستم کامپایل شده است. 
                    شما می‌توانید آن را <strong>{report.isActive ? 'بایگانی / غیرفعال' : 'فعال‌سازی مجدد'}</strong> نمایید 
                    تا در کاتالوگ گزارش‌های عمومی کاربران عادی نمایش داده نشود.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            انصراف
          </button>

          {isCustomDataset ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isProcessing}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>در حال پاک‌سازی پایگاه داده...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span>بله، حذف قطعی گزارش و داده‌ها</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleToggleArchive}
              disabled={isProcessing}
              className={`flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-sm transition-colors disabled:opacity-50 ${
                report.isActive
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>در حال تغییر وضعیت...</span>
                </>
              ) : report.isActive ? (
                <>
                  <Archive className="h-4 w-4" />
                  <span>بایگانی گزارش (عدم نمایش عمومی)</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>فعال‌سازی مجدد گزارش</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
