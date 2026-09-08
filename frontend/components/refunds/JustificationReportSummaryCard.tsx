'use client'

import React from 'react'
import Link from 'next/link'
import {
  Scale,
  Edit3,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  UserCheck,
  ChevronLeft,
  Sparkles,
} from 'lucide-react'
import { TaxRefundCase } from '@/types/taxRefund'

interface JustificationReportSummaryCardProps {
  refundCase: TaxRefundCase
  onOpenEditor: () => void
}

export function JustificationReportSummaryCard({
  refundCase,
  onOpenEditor,
}: JustificationReportSummaryCardProps) {
  const report = refundCase.justificationReport
  const isDrafted = !!report && !!report.reportNumber
  const isFinalized = !!report && report.isFinalized

  const formatRials = (val?: number) => (val ?? 0).toLocaleString('fa-IR')

  return (
    <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center border border-purple-200">
            <Scale className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-gray-900">
                گزارش توجیهی حسابرسی استرداد (موضوع ماده ۲۴۲ ق.م.م)
              </h3>
              {isFinalized ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  تنظیم و تایید شده
                </span>
              ) : isDrafted ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  پیش‌نویس کارشناس ارشد
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gray-100 text-gray-600 border border-gray-200">
                  تنظیم نشده
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              تنظیم شده توسط کارشناس ارشد واحد مالیاتی جهت احراز اصالت قبوض، بررسی استعلامات و صدور برگ استرداد
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenEditor}
            className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isDrafted ? 'ویرایش گزارش توجیهی' : 'تنظیم گزارش توجیهی'}</span>
          </button>

          <Link
            href={`/refunds/${refundCase.id}/print?tab=form3`}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-700" />
            <span>چاپ گزارش (فرم ۳ و ۴)</span>
          </Link>
        </div>
      </div>

      {/* Body Content */}
      {isDrafted ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Metadata Block */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2 text-xs">
            <div>
              <span className="text-gray-500 block mb-0.5">شماره ثبت گزارش:</span>
              <span className="font-mono font-bold text-gray-900">{report.reportNumber}</span>
            </div>
            <div>
              <span className="text-gray-500 block mb-0.5">تاریخ تنظیم:</span>
              <span className="font-mono font-bold text-gray-900">{report.reportDateJalali}</span>
            </div>
            <div>
              <span className="text-gray-500 block mb-0.5">کارشناس ارشد رسیدگی‌کننده:</span>
              <span className="font-bold text-purple-900">
                {report.auditorUserName || refundCase.seniorAuditorName}
              </span>
            </div>
            {report.recommendedRefundAmount > 0 && (
              <div>
                <span className="text-gray-500 block mb-0.5">مبلغ پیشنهادی استرداد:</span>
                <span className="font-mono font-black text-purple-950 text-sm">
                  {formatRials(report.recommendedRefundAmount)} ریال
                </span>
              </div>
            )}
          </div>

          {/* Report Findings & Conclusion Preview */}
          <div className="md:col-span-2 p-4 bg-purple-50/40 rounded-2xl border border-purple-100 text-xs leading-6 space-y-2">
            <div className="font-bold text-purple-950 flex items-center justify-between">
              <span>خلاصه رسیدگی و جمع‌بندی کارشناس ارشد:</span>
              <button
                onClick={onOpenEditor}
                className="text-purple-700 hover:text-purple-900 font-bold text-[11px] flex items-center gap-0.5"
              >
                <span>مشاهده متن کامل</span>
                <ChevronLeft className="w-3 h-3" />
              </button>
            </div>
            <p className="text-gray-700 line-clamp-3">
              {report.auditorConclusion || report.auditExaminationFindings || 'متن پیش‌نویس گزارش توجیهی تنظیم شده است.'}
            </p>
            {report.inquiriesAndDebtClearanceSummary && (
              <div className="pt-2 border-t border-purple-100/80 text-[11px] text-gray-600 line-clamp-1">
                <strong className="text-purple-900">وضعیت استعلامات:</strong>{' '}
                {report.inquiriesAndDebtClearanceSummary}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-5 bg-purple-50/30 border border-purple-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-right">
            <h4 className="font-bold text-xs sm:text-sm text-purple-950 flex items-center justify-center sm:justify-start gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              گزارش توجیهی پرونده هنوز تنظیم نشده است
            </h4>
            <p className="text-xs text-gray-600 max-w-xl leading-5">
              کارشناس ارشد مالیاتی می‌تواند با استفاده از ابزار هوشمند تولید پیش‌نویس، گزارش قانونی استرداد را بر اساس
              قبوض واریزی و پاسخ استعلامات آماده و جهت تایید رئیس گروه ثبت نماید.
            </p>
          </div>

          <button
            onClick={onOpenEditor}
            className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-all flex-shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>تنظیم هوشمند گزارش توجیهی</span>
          </button>
        </div>
      )}
    </div>
  )
}
