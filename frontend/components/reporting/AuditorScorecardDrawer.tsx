'use client'

import React, { useEffect, useState } from 'react'
import {
  X,
  Award,
  TrendingUp,
  Clock,
  ShieldCheck,
  Briefcase,
  AlertTriangle,
  Building2,
  ChevronLeft,
  Sparkles,
  BarChart3,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react'
import { auditorMetricsApi } from '@/lib/api/auditorMetrics'
import { Auditor360Profile } from '@/types/auditorMetrics'
import { AuditorAvatar } from './AuditorAvatar'
import { toPersianDigits } from '@/lib/jalali'

interface AuditorScorecardDrawerProps {
  auditorName: string | null
  fiscalYear?: number
  reportCode?: string
  reportActorType?: 'auditor' | 'decree'
  onClose: () => void
  onViewCases?: (auditorName: string) => void
}

export function AuditorScorecardDrawer({
  auditorName,
  fiscalYear,
  reportCode,
  reportActorType,
  onClose,
  onViewCases,
}: AuditorScorecardDrawerProps) {
  const [profile, setProfile] = useState<Auditor360Profile | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const isDecree = reportActorType === 'decree' || (reportCode ? reportCode.toUpperCase().includes('REP_2') : false)

  useEffect(() => {
    if (!auditorName) return

    let isMounted = true
    setIsLoading(true)
    setError(null)

    auditorMetricsApi
      .getAuditorProfile(auditorName, fiscalYear, reportCode)
      .then((data) => {
        if (isMounted) {
          setProfile(data)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to load auditor 360 profile:', err)
          setError(err.message || (isDecree ? 'خطا در بارگذاری کارنامه ۳۶۰ درجه مجری قرار' : 'خطا در بارگذاری پرونده ۳۶۰ درجه حسابرس'))
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [auditorName, fiscalYear, reportCode, isDecree])

  if (!auditorName) return null

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'A':
        return {
          label: 'رتبه الف - عملکرد ممتاز',
          bg: 'bg-amber-500/10 text-amber-600 border-amber-400/30 ring-1 ring-amber-400/20',
          indicator: 'bg-amber-500',
          icon: <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />,
        }
      case 'B':
        return {
          label: 'رتبه ب - عملکرد استاندارد مطلوب',
          bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-400/30 ring-1 ring-emerald-400/20',
          indicator: 'bg-emerald-500',
          icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
        }
      case 'C':
        return {
          label: 'رتبه ج - عملکرد متوسط',
          bg: 'bg-sky-500/10 text-sky-600 border-sky-400/30 ring-1 ring-sky-400/20',
          indicator: 'bg-sky-500',
          icon: <BarChart3 className="w-4 h-4 text-sky-500" />,
        }
      case 'D':
      default:
        return {
          label: 'رتبه د - نیازمند بهبود و بازآموزی',
          bg: 'bg-rose-500/10 text-rose-600 border-rose-400/30 ring-1 ring-rose-400/20',
          indicator: 'bg-rose-500',
          icon: <AlertTriangle className="w-4 h-4 text-rose-500" />,
        }
    }
  }

  const getStatusBadge = (status: 'Target' | 'Warning' | 'Critical') => {
    switch (status) {
      case 'Target':
        return {
          text: 'هدف محقق شده',
          cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        }
      case 'Warning':
        return {
          text: 'در محدوده هشدار',
          cls: 'bg-amber-50 text-amber-700 border-amber-200',
        }
      case 'Critical':
        return {
          text: 'بحرانی و پرریسک',
          cls: 'bg-rose-50 text-rose-700 border-rose-200',
        }
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" dir="rtl">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 left-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col border-r border-slate-200 transform transition ease-in-out duration-300">
          
          {/* Top Navigation Bar */}
          <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg">
                <Award className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  {isDecree ? 'کارنامه جامع ۳۶۰ درجه مجری قرار دادرسی' : 'کارنامه جامع ۳۶۰ درجه عملکرد حسابرس'}
                  {fiscalYear && (
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 font-mono border border-slate-700">
                      سال {toPersianDigits(fiscalYear)}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isDecree
                    ? 'ارزیابی دینامیک کیفیت، بازدهی و سرعت اجرای قرار بر اساس سامانه سنیم'
                    : 'ارزیابی دینامیک کیفیت، بازدهی و سرعت رسیدگی بر اساس سنیم'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="بستن پنجره"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading && (
              <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-500">
                <span className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                <span className="text-xs font-semibold">
                  {isDecree
                    ? 'در حال استخراج کارنامه عملکرد مجری قرار و مقایسه استانی...'
                    : 'در حال استخراج کارنامه عملکرد و مقایسه استانی...'}
                </span>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!isLoading && profile && (
              <>
                {/* Auditor Identification & Scorecard Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
                  <div className="absolute -left-12 -top-12 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex items-start justify-between relative z-10 gap-3">
                    <div className="flex items-center gap-3.5">
                      <AuditorAvatar
                        auditorName={profile.scorecard.auditorName}
                        nationalId={profile.scorecard.auditorNationalId}
                        photoUrl={profile.scorecard.photoUrl}
                        size="xl"
                        rank={profile.scorecard.provincialRank}
                        tier={profile.scorecard.performanceTier}
                        showLightbox={true}
                        className="hover:scale-105 transition-transform"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-amber-400 font-semibold">
                            {isDecree ? 'سرپرست / مجری قرار:' : 'حسابرس مالیاتی:'}
                          </span>
                          <h3 className="text-lg font-black text-white">{profile.scorecard.auditorName}</h3>
                        </div>
                        {profile.scorecard.auditorNationalId && (
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            کد ملی: {toPersianDigits(profile.scorecard.auditorNationalId)}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-slate-300 mt-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{profile.scorecard.officeName || 'اداره کل امور مالیاتی استان خوزستان'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Performance Tier Badge */}
                    {(() => {
                      const tier = getTierBadge(profile.scorecard.performanceTier)
                      return (
                        <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${tier.bg}`}>
                          {tier.icon}
                          <span>{tier.label}</span>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Score & Provincial Rank Bar */}
                  <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-700/60 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                        <span className="text-xl font-black text-amber-400 font-mono">
                          {toPersianDigits(profile.scorecard.compositeScore.toFixed(1))}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">امتیاز کل شاخص‌ها</span>
                        <span className="text-xs font-semibold text-slate-200">از ۱۰۰ نمره تراز شده</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
                        <span className="text-lg font-black text-sky-400 font-mono">
                          #{toPersianDigits(profile.scorecard.provincialRank)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">رتبه در سطح استان</span>
                        <span className="text-xs font-semibold text-slate-200">
                          {isDecree ? 'در بین کل مجریان فعال قرار' : 'در بین کل حسابرسان فعال'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Direct Drill-Down to Auditor Cases Button */}
                  {onViewCases && (
                    <div className="mt-4 pt-3 border-t border-slate-700/60 relative z-10">
                      <button
                        type="button"
                        onClick={() => onViewCases(profile.scorecard.auditorName)}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/40 text-amber-200 hover:text-white hover:bg-amber-500/25 transition-all cursor-pointer group shadow-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                            <FileSpreadsheet className="w-4 h-4" />
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-extrabold text-white">
                              {isDecree
                                ? 'مشاهده ریز قرارهای این مجری در جدول داده‌ها'
                                : 'مشاهده ریز پرونده‌های این حسابرس در جدول داده‌ها'}
                            </div>
                            <div className="text-[10px] text-slate-300">
                              {isDecree
                                ? `فیلتر خودکار ${toPersianDigits(profile.scorecard.totalAssignedCases.toLocaleString('fa-IR'))} فقره قرار با امکان جستجو و خروجی اکسل`
                                : `فیلتر خودکار ${toPersianDigits(profile.scorecard.totalAssignedCases.toLocaleString('fa-IR'))} پرونده با امکان جستجو و خروجی اکسل`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-400 group-hover:translate-x-[-3px] transition-transform shrink-0 mr-2">
                          <span>{isDecree ? 'مشاهده قرارها' : 'مشاهده پرونده‌ها'}</span>
                          <ChevronLeft className="w-4 h-4" />
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* KPI Metric Highlights Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                    <span className="text-[11px] text-slate-500 block mb-1 flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-slate-400" />
                      {isDecree ? 'قرارهای ثبت گزارش' : 'پرونده‌های مختومه'}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-black text-slate-800 font-mono">
                        {toPersianDigits(profile.scorecard.completedCases.toLocaleString('fa-IR'))}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        / {toPersianDigits(profile.scorecard.totalAssignedCases.toLocaleString('fa-IR'))}
                      </span>
                    </div>
                  </div>

                  <div className="bg-teal-50/60 border border-teal-200/80 p-3 rounded-xl">
                    <span className="text-[11px] text-teal-800 font-bold block mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-teal-600" />
                      {isDecree ? 'درصد تایید گزارش' : 'درصد قطعی شده'}
                    </span>
                    <span className="text-base font-black text-teal-700 font-mono">
                      ٪{toPersianDigits((profile.caseFinalityRate ?? profile.scorecard.finalityRate ?? 0).toFixed(1))}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                    <span className="text-[11px] text-slate-500 block mb-1 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      {isDecree ? 'نرخ تایید گزارش' : 'دفاع‌پذیری (ریالی)'}
                    </span>
                    <span className="text-sm font-black text-emerald-700 font-mono">
                      ٪{toPersianDigits(profile.defensibilityRate.toFixed(1))}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                    <span className="text-[11px] text-slate-500 block mb-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-amber-500" />
                      {isDecree ? 'مجموع اصل مالیات' : 'اختلاف تشخیص'}
                    </span>
                    <span className="text-xs font-black text-slate-800 font-mono block truncate" title={profile.netTaxGapAddition.toLocaleString('fa-IR')}>
                      {toPersianDigits((profile.netTaxGapAddition / 1_000_000_000).toFixed(1))} م.م.
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                    <span className="text-[11px] text-slate-500 block mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-sky-500" />
                      {isDecree ? 'میانگین اجرای قرار' : 'متوسط زمان صدور'}
                    </span>
                    <span className="text-sm font-black text-slate-800 font-mono">
                      {toPersianDigits(profile.averageDaysAssignmentToNotice.toFixed(0))} روز
                    </span>
                  </div>
                </div>

                {/* Risk Distribution / Stages Breakdown */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                  <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-600" />
                    {isDecree ? 'توزیع مراحل دادرسی و پیچیدگی قرارهای ارجاعی' : 'توزیع ریسک پرونده‌های واگذار شده به حسابرس'}
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200/70 text-rose-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold">{isDecree ? 'مرحله تجدیدنظر و هم‌عرض' : 'ریسک بالا'}</span>
                        <span className="font-mono font-bold text-sm">
                          {toPersianDigits(profile.highRiskCasesCount.toLocaleString('fa-IR'))}
                        </span>
                      </div>
                      <span className="text-[10px] text-rose-600 mt-0.5 block">
                        {isDecree ? 'رسیدگی در مراحل عالی دادرسی' : 'نیازمند حسابرسی موشکافانه'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 text-amber-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold">{isDecree ? 'مرحله بدوی' : 'ریسک متوسط'}</span>
                        <span className="font-mono font-bold text-sm">
                          {toPersianDigits(profile.mediumRiskCasesCount.toLocaleString('fa-IR'))}
                        </span>
                      </div>
                      <span className="text-[10px] text-amber-600 mt-0.5 block">
                        {isDecree ? 'رسیدگی اولیه در هیات‌های بدوی' : 'رسیدگی ادواری استاندارد'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/70 text-emerald-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold">{isDecree ? 'گزارش‌های تایید شده' : 'ریسک پایین'}</span>
                        <span className="font-mono font-bold text-sm">
                          {toPersianDigits(profile.lowRiskCasesCount.toLocaleString('fa-IR'))}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-600 mt-0.5 block">
                        {isDecree ? 'تکمیل فرآیند و تایید نهایی قرار' : 'رسیدگی سریع / تمکین بالا'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dynamic Metrics Detailed Scorecard Breakdown */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-slate-700" />
                      ارزیابی تفکیکی شاخص‌های مصوب سیستم
                    </h4>
                    <span className="text-[11px] text-slate-500 font-medium">
                      مجموع اوزان: ۱۰۰٪
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {profile.scorecard.metricValues.map((mv) => {
                      const status = getStatusBadge(mv.statusBand)
                      return (
                        <div key={mv.metricCode} className="p-4 hover:bg-slate-50/70 transition-colors">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <span className="text-xs font-bold text-slate-800 block">
                                {mv.title}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                                کد شاخص: {mv.metricCode}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${status.cls}`}
                              >
                                {status.text}
                              </span>
                              <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                                {toPersianDigits(mv.formattedValue)} {mv.unit}
                              </span>
                            </div>
                          </div>

                          {/* Progress Bar & Weight */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                              <span>نمره تراز شده: {toPersianDigits(mv.normalizedScore.toFixed(1))} از ۱۰۰</span>
                              <span>
                                وزن: ٪{toPersianDigits(mv.weightPercentage)} (سهم نمره: {toPersianDigits(mv.weightedScore.toFixed(1))})
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  mv.statusBand === 'Target'
                                    ? 'bg-emerald-500'
                                    : mv.statusBand === 'Warning'
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(0, mv.normalizedScore))}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Office Breakdown Table if Available */}
                {profile.officeBreakdowns && profile.officeBreakdowns.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                    <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-600" />
                      توزیع پرونده‌ها در ادارات امور مالیاتی
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-right border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <th className="py-2 px-3 font-semibold text-[11px]">نام اداره مالیاتی</th>
                            <th className="py-2 px-3 font-semibold text-[11px] text-center">تعداد پرونده</th>
                            <th className="py-2 px-3 font-semibold text-[11px] text-left">مجموع مالیات تشخیص (ریال)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {profile.officeBreakdowns.map((ob, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-2 px-3 text-slate-700">{ob.officeName || 'اداره کل'}</td>
                              <td className="py-2 px-3 text-center font-mono font-semibold text-slate-800">
                                {toPersianDigits(ob.caseCount.toLocaleString('fa-IR'))}
                              </td>
                              <td className="py-2 px-3 text-left font-mono font-semibold text-slate-800" dir="ltr">
                                {toPersianDigits(ob.totalAssessed.toLocaleString('fa-IR'))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              سامانه هوشمند ارزیابی عملکرد و نظارت حسابرسی سنیم
            </span>
            <div className="flex items-center gap-2">
              {onViewCases && profile && (
                <button
                  type="button"
                  onClick={() => onViewCases(profile.scorecard.auditorName)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>{isDecree ? 'مشاهده ریز قرارها در جدول' : 'مشاهده ریز پرونده‌ها در جدول'}</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
