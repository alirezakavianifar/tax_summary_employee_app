'use client'

import React, { useEffect } from 'react'
import {
  Send,
  Building2,
  Users,
  Clock,
  Sparkles,
  AlertTriangle,
  X,
  ShieldCheck,
  Coins,
  Loader2,
  CheckCircle2,
  Layers,
} from 'lucide-react'

interface SendToOfficesModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  isSubmitting: boolean
  cycleTitle: string
  cycleCode?: string
  totalDepts: number
  totalEmployees: number
  totalOvertime: number
  totalWelfare: number
  totalBonus?: number
  processType?: string
}

function formatNumber(v: number | null | undefined): string {
  if (v == null) return '—'
  return v.toLocaleString('fa-IR')
}

export default function SendToOfficesModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  cycleTitle,
  cycleCode,
  totalDepts,
  totalEmployees,
  totalOvertime,
  totalWelfare,
  totalBonus = 0,
  processType,
}: SendToOfficesModalProps) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen) return null

  const totalBudget = totalOvertime + totalWelfare + (totalBonus || 0)
  const isBonusProcess = processType === 'HalfPercentBonus'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={() => {
          if (!isSubmitting) onClose()
        }}
      />

      {/* Modal Dialog Card */}
      <div
        dir="rtl"
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 my-8"
      >
        {/* Top Decorative Gradient Accent Bar */}
        <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 w-full" />

        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
              <Send className="w-6 h-6 -translate-x-0.5 translate-y-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  ارسال دوره محاسبه به ادارات
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  تغییر از پیش‌نویس
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                {cycleTitle} {cycleCode ? `(${cycleCode})` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
            title="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 space-y-5 max-h-[calc(85vh-160px)] overflow-y-auto">
          {/* Main Question Alert Prompt */}
          <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-100 text-slate-800 text-sm leading-relaxed flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-blue-950 mb-1">
                آیا از ارسال این دوره محاسبه به کلیه{' '}
                <span className="text-blue-700 font-extrabold underline underline-offset-4">
                  {formatNumber(totalDepts)} اداره
                </span>{' '}
                اطمینان دارید؟
              </h4>
              <p className="text-xs text-blue-800/90 leading-normal">
                با ارسال دوره، کاربرگ اختصاصی هر واحد فعال شده و مسئولین مربوطه دسترسی لازم جهت تکمیل اطلاعات و پیشنهاد ساعات را به دست خواهند آورد.
              </p>
            </div>
          </div>

          {/* Key Summary Metrics Cards (Grid) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
              <span>خلاصه وضعیت مقادیر و سهمیه‌های تنظیمی</span>
              <span>تعداد کل واحدها: {formatNumber(totalDepts)} اداره</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Overtime Card */}
              <div className="bg-slate-50 hover:bg-blue-50/40 p-3.5 rounded-2xl border border-slate-200/80 transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    مجموع اضافه کار
                  </span>
                  <span className="text-[10px] text-blue-600 font-bold bg-blue-100/70 px-1.5 py-0.5 rounded">
                    کل دوره
                  </span>
                </div>
                <div className="text-left mt-1">
                  <span className="text-base font-extrabold text-slate-900 font-mono tracking-tight">
                    {formatNumber(totalOvertime)}
                  </span>
                  <span className="text-[11px] text-slate-500 mr-1 font-normal">ریال</span>
                </div>
              </div>

              {/* Welfare Card */}
              <div className="bg-slate-50 hover:bg-indigo-50/40 p-3.5 rounded-2xl border border-slate-200/80 transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    مجموع رفاهی
                  </span>
                  <span className="text-[10px] text-indigo-600 font-bold bg-indigo-100/70 px-1.5 py-0.5 rounded">
                    کل دوره
                  </span>
                </div>
                <div className="text-left mt-1">
                  <span className="text-base font-extrabold text-slate-900 font-mono tracking-tight">
                    {formatNumber(totalWelfare)}
                  </span>
                  <span className="text-[11px] text-slate-500 mr-1 font-normal">ریال</span>
                </div>
              </div>

              {/* Personnel Count Card */}
              <div className="bg-slate-50 hover:bg-emerald-50/40 p-3.5 rounded-2xl border border-slate-200/80 transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    تعداد کل پرسنل
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100/70 px-1.5 py-0.5 rounded">
                    مشمولین
                  </span>
                </div>
                <div className="text-left mt-1">
                  <span className="text-base font-extrabold text-slate-900 font-mono tracking-tight">
                    {formatNumber(totalEmployees)}
                  </span>
                  <span className="text-[11px] text-slate-500 mr-1 font-normal">نفر</span>
                </div>
              </div>

              {/* Total Departments Card */}
              <div className="bg-slate-50 hover:bg-purple-50/40 p-3.5 rounded-2xl border border-slate-200/80 transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-600" />
                    تعداد ادارات تابعه
                  </span>
                  <span className="text-[10px] text-purple-600 font-bold bg-purple-100/70 px-1.5 py-0.5 rounded">
                    واحدهای استان
                  </span>
                </div>
                <div className="text-left mt-1">
                  <span className="text-base font-extrabold text-slate-900 font-mono tracking-tight">
                    {formatNumber(totalDepts)}
                  </span>
                  <span className="text-[11px] text-slate-500 mr-1 font-normal">واحد</span>
                </div>
              </div>
            </div>

            {/* Total Allocated Budget Strip */}
            <div className="p-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-sm flex items-center justify-between px-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
                <Coins className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>جمع کل اعتبارات تخصیصی دوره:</span>
              </div>
              <div className="text-left font-mono">
                <span className="text-base font-black text-amber-400">
                  {formatNumber(totalBudget)}
                </span>
                <span className="text-[11px] text-slate-300 mr-1">ریال</span>
              </div>
            </div>
          </div>

          {/* Workflow & Status Change Information Note */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>نتیجه تایید و نکات مرحله بعد:</span>
            </div>
            <ul className="text-xs text-amber-800/95 space-y-1.5 pr-2 list-disc list-inside leading-relaxed">
              <li>
                وضعیت دوره از <span className="font-semibold text-amber-950">«پیش‌نویس»</span> به{' '}
                <span className="font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                  «در حال دریافت اطلاعات ادارات»
                </span>{' '}
                تغییر می‌یابد.
              </li>
              <li>
                رؤسای ادارات امکان بازبینی سهمیه‌ها و ثبت مقادیر پیشنهادی کارکنان خود را خواهند داشت.
              </li>
              <li>
                هر اداره صرفاً اطلاعات کارکنان زیرمجموعه همان اداره را مشاهده خواهد نمود.
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 text-xs font-bold transition-all disabled:opacity-50"
          >
            انصراف و بازبینی مجدد
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                در حال ارسال به ادارات...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 -translate-x-0.5" />
                تایید نهایی و ارسال به ادارات
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
