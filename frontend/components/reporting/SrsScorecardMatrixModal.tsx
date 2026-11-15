'use client'

import React from 'react'
import {
  SrsEmployeeScorecard,
  getSrsCategoriesMeta,
  SRS_INDICATORS_META,
} from '@/types/srsAuditorMetrics'
import { toPersianDigits } from '@/lib/jalali'
import { AuditorAvatar } from './AuditorAvatar'
import {
  X,
  Printer,
  Award,
  TrendingUp,
  AlertTriangle,
  Clock,
  Building2,
  Sparkles,
  Layers,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react'

interface SrsScorecardMatrixModalProps {
  scorecard: SrsEmployeeScorecard | null
  onClose: () => void
}

export function SrsScorecardMatrixModal({ scorecard, onClose }: SrsScorecardMatrixModalProps) {
  if (!scorecard) return null

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'A':
        return {
          label: 'رتبه الف - عملکرد ممتاز',
          bg: 'bg-amber-500/10 text-amber-600 border-amber-400/30 ring-1 ring-amber-400/20',
          indicator: 'bg-amber-500',
        }
      case 'B':
        return {
          label: 'رتبه ب - مطلوب و استاندارد',
          bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-400/30 ring-1 ring-emerald-400/20',
          indicator: 'bg-emerald-500',
        }
      case 'C':
        return {
          label: 'رتبه ج - عملکرد متوسط',
          bg: 'bg-sky-500/10 text-sky-600 border-sky-400/30 ring-1 ring-sky-400/20',
          indicator: 'bg-sky-500',
        }
      case 'D':
      default:
        return {
          label: 'رتبه د - نیازمند بهبود',
          bg: 'bg-rose-500/10 text-rose-600 border-rose-400/30 ring-1 ring-rose-400/20',
          indicator: 'bg-rose-500',
        }
    }
  }

  const tierMeta = getTierBadge(scorecard.performanceTier)
  const categoriesMeta = getSrsCategoriesMeta(scorecard.majorCasesLabel)

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" dir="rtl">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity print:hidden"
        onClick={onClose}
      />

      <div className="min-h-screen px-4 text-center flex items-center justify-center p-2 sm:p-4">
        <div className="inline-block w-full max-w-6xl bg-white rounded-3xl text-right overflow-hidden shadow-2xl transform transition-all border border-slate-200 my-8 print:border-none print:shadow-none print:my-0">
          
          {/* Top Bar / Header */}
          <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                <Award className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">کارنامه جامع ارزیابی عملکرد رسیدگی مالیاتی</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  دستورالعمل مصوب ارزیابی عملکرد (SRS v1.0) - ماتریس امتیازات تفصیلی
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                title="چاپ کارنامه در قطع رسمی A4"
              >
                <Printer className="w-4 h-4 text-slate-400" />
                چاپ کارنامه (A4)
              </button>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Official Header */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <AuditorAvatar
                  auditorName={scorecard.auditorName}
                  nationalId={scorecard.auditorNationalId}
                  photoUrl={scorecard.photoUrl}
                  rank={scorecard.provincialRank}
                  tier={scorecard.performanceTier}
                  size="xl"
                  showLightbox={true}
                  className="ring-4 ring-white shadow-md"
                />

                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <h2 className="text-xl font-bold text-slate-900">{scorecard.auditorName}</h2>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${tierMeta.bg}`}>
                      <span className={`w-2 h-2 rounded-full ${tierMeta.indicator}`} />
                      {tierMeta.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{scorecard.officeName || 'اداره کل امور مالیاتی خوزستان'}</span>
                    </div>
                    {scorecard.auditorNationalId && (
                      <div className="text-slate-400">
                        کد ملی: <span className="font-mono text-slate-700 font-medium">{scorecard.auditorNationalId}</span>
                      </div>
                    )}
                    <div>
                      کل پرونده‌های مورد ارزیابی:{' '}
                      <span className="font-bold text-slate-900">{toPersianDigits(scorecard.totalCases)} فقره</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Score Badges */}
              <div className="flex items-center gap-3">
                <div className="px-4 py-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-center min-w-[110px]">
                  <div className="text-[11px] font-medium text-indigo-600 mb-0.5">رتبه استانی</div>
                  <div className="text-xl font-black text-indigo-950">
                    #{toPersianDigits(scorecard.provincialRank)}
                  </div>
                </div>

                <div className="px-5 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center min-w-[120px]">
                  <div className="text-[11px] font-medium text-emerald-700 mb-0.5">امتیاز کل عملکرد</div>
                  <div className="text-2xl font-black text-emerald-800">
                    {toPersianDigits(scorecard.totalScore.toFixed(1))}
                  </div>
                </div>

                <div className="text-xs space-y-1 text-slate-500 pr-2 border-r border-slate-200">
                  <div className="text-emerald-600 font-semibold">
                    + امتیاز مثبت: {toPersianDigits(scorecard.totalPositivePoints.toFixed(1))}
                  </div>
                  <div className="text-rose-600 font-semibold">
                    - کسورات و جریمه: {toPersianDigits(scorecard.totalNegativeDeductions.toFixed(1))}
                  </div>
                </div>
              </div>
            </div>

            {/* 8x7 Detailed Scorecard Matrix Breakdown Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="px-6 py-3.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold text-slate-800">
                    ماتریس ریزمحاسبات امتیازات به تفکیک شاخص و دسته‌بندی موضوعی پرونده‌ها
                  </h4>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  فرمول محاسبه: [تعداد پرونده واجد شرایط] × [ضریب موضوعی] = [امتیاز مکتسبه]
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                      <th className="py-3 px-4 min-w-[210px] text-right sticky right-0 bg-slate-50 z-10 border-l border-slate-200">
                        شاخص ارزیابی عملکرد
                      </th>
                      {categoriesMeta.map((cat) => (
                        <th key={cat.key} className="py-3 px-2 text-center min-w-[110px] border-l border-slate-200 last:border-l-0">
                          <div className="font-bold text-slate-900 text-xs">{cat.shortTitle}</div>
                          <div className="text-[10px] text-slate-500 font-normal">
                            {toPersianDigits(scorecard.categorySummaries[cat.key] || 0)} پرونده
                          </div>
                        </th>
                      ))}
                      <th className="py-3 px-4 text-center min-w-[100px] bg-slate-100 text-slate-900 font-bold">
                        جمع امتیاز
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {scorecard.indicators.map((ind) => {
                      const isNegative = ind.isNegative

                      return (
                        <tr key={ind.indicatorCode} className="hover:bg-slate-50/60 transition-colors">
                          {/* Indicator Name */}
                          <td className="py-3 px-4 font-medium text-slate-900 sticky right-0 bg-white z-10 border-l border-slate-200">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  isNegative
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                }`}
                              >
                                {ind.indicatorOrder <= 8 ? `FR-0${ind.indicatorOrder}` : 'FR'}
                              </span>
                              <div className="font-bold text-xs text-slate-800">{ind.indicatorTitle}</div>
                            </div>
                          </td>

                          {/* 7 Category Cells */}
                          {categoriesMeta.map((cat) => {
                            const detail = ind.categoryDetails[cat.key] || {
                              caseCount: 0,
                              weight: 0,
                              points: 0,
                            }

                            const hasCases = detail.caseCount > 0
                            const isSpeed = ind.indicatorCode.includes('Speed')

                            return (
                              <td
                                key={cat.key}
                                className={`py-2 px-2 text-center border-l border-slate-100 last:border-l-0 ${
                                  hasCases ? 'bg-slate-50/40' : ''
                                }`}
                              >
                                {hasCases ? (
                                  <div className="space-y-0.5">
                                    <div className="text-[11px] font-bold text-slate-800">
                                      {toPersianDigits(detail.caseCount)} فقره
                                    </div>

                                    {isSpeed ? (
                                      <div className="text-[10px] text-slate-500">
                                        میانگین: {toPersianDigits(detail.avgActualDays?.toFixed(0) || 0)} روز
                                        {detail.delayDays && detail.delayDays > 0 ? (
                                          <div className="text-[9px] text-rose-600 font-semibold">
                                            (تاخیر: {toPersianDigits(detail.delayDays.toFixed(0))} روز)
                                          </div>
                                        ) : null}
                                      </div>
                                    ) : (
                                      <div className="text-[10px] text-slate-400">
                                        ضریب: {toPersianDigits(detail.weight)}
                                      </div>
                                    )}

                                    <div
                                      className={`text-xs font-black ${
                                        detail.points < 0 || isNegative
                                          ? 'text-rose-600'
                                          : detail.points > 0
                                          ? 'text-emerald-700'
                                          : 'text-slate-400'
                                      }`}
                                    >
                                      {detail.points > 0 ? '+' : ''}
                                      {toPersianDigits(detail.points.toFixed(1))}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-300 text-xs">-</span>
                                )}
                              </td>
                            )
                          })}

                          {/* Row Total */}
                          <td className="py-2.5 px-3 text-center bg-slate-50/70 border-r border-slate-200">
                            <span
                              className={`text-xs font-black px-2 py-1 rounded-md ${
                                ind.totalPoints < 0 || isNegative
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : ind.totalPoints > 0
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'text-slate-400'
                              }`}
                            >
                              {ind.totalPoints > 0 ? '+' : ''}
                              {toPersianDigits(ind.totalPoints.toFixed(1))}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>

                  {/* Summary Footer Row */}
                  <tfoot>
                    <tr className="bg-slate-100 text-slate-900 font-bold border-t-2 border-slate-300">
                      <td className="py-3 px-4 sticky right-0 bg-slate-100 z-10 border-l border-slate-200 text-right">
                        جمع کل امتیازات عملکرد حسابرس
                      </td>
                      {categoriesMeta.map((cat) => {
                        const colTotal = scorecard.indicators.reduce((sum, ind) => {
                          const d = ind.categoryDetails[cat.key]
                          return sum + (d?.points || 0)
                        }, 0)

                        return (
                          <td key={cat.key} className="py-3 px-2 text-center border-l border-slate-200 last:border-l-0">
                            <div className="text-xs font-black text-slate-800">
                              {toPersianDigits(colTotal.toFixed(1))}
                            </div>
                          </td>
                        )
                      })}
                      <td className="py-3 px-3 text-center bg-indigo-50 border-r border-indigo-200">
                        <div className="text-sm font-black text-indigo-900">
                          {toPersianDigits(scorecard.totalScore.toFixed(1))}
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Signature & Verification Footnotes */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
              <div className="space-y-1">
                <div>تاریخ تولید گزارش: سامانه یکپارچه رسیدگی و ارزیابی مالیاتی استان خوزستان</div>
                <div className="text-[11px] text-slate-400">
                  این کارنامه مبتنی بر مستندات عملکردی و داده‌های سامانه سنیم صادر شده و برای ارزیابی سالانه و رتبه‌بندی معتبر است.
                </div>
              </div>

              <div className="flex items-center gap-8 text-center text-xs font-bold text-slate-700">
                <div>
                  <div className="text-slate-400 font-normal mb-6">رئیس گروه حسابرسی مالیاتی</div>
                  <div>امضاء و تایید</div>
                </div>
                <div>
                  <div className="text-slate-400 font-normal mb-6">معاونت درآمدهای مالیاتی</div>
                  <div>ملاحظه و تایید نهایی</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
