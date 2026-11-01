'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Award,
  TrendingUp,
  ShieldCheck,
  Clock,
  Briefcase,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  ChevronLeft,
  Building2,
  AlertCircle,
  HelpCircle,
  BarChart3,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react'
import { auditorMetricsApi } from '@/lib/api/auditorMetrics'
import {
  AuditorPerformanceMetric,
  AuditorScorecard,
} from '@/types/auditorMetrics'
import { AuditorScorecardDrawer } from '@/components/reporting/AuditorScorecardDrawer'
import { AuditorAvatar } from '@/components/reporting/AuditorAvatar'
import { toPersianDigits } from '@/lib/jalali'

interface ReportAuditorPerformanceTabProps {
  reportCode: string
  onViewAuditorCases?: (auditorName: string) => void
}

export function ReportAuditorPerformanceTab({
  reportCode,
  onViewAuditorCases,
}: ReportAuditorPerformanceTabProps) {
  const [scorecards, setScorecards] = useState<AuditorScorecard[]>([])
  const [metrics, setMetrics] = useState<AuditorPerformanceMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOffice, setSelectedOffice] = useState('all')
  const [selectedAuditorForDrawer, setSelectedAuditorForDrawer] = useState<string | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [cardsData, metricsData] = await Promise.all([
        auditorMetricsApi.evaluateAuditors({ reportCode }),
        auditorMetricsApi.getMetrics(false),
      ])
      setScorecards(cardsData || [])
      setMetrics(metricsData || [])
    } catch (err: any) {
      console.error('Failed to load auditor performance data for report:', err)
      setError(err?.response?.data?.error || err.message || 'خطا در محاسبه شاخص‌های ارزیابی عملکرد حسابرسان')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (reportCode) {
      loadData()
    }
  }, [reportCode])

  // Extract distinct offices
  const officeOptions = useMemo(() => {
    const set = new Set<string>()
    scorecards.forEach((s) => {
      if (s.officeName && s.officeName.trim()) set.add(s.officeName.trim())
    })
    return Array.from(set).sort()
  }, [scorecards])

  // Filtered scorecards
  const filteredScorecards = useMemo(() => {
    return scorecards.filter((s) => {
      const matchSearch =
        !searchTerm.trim() ||
        s.auditorName.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (s.auditorNationalId && s.auditorNationalId.includes(searchTerm.trim()))

      const matchOffice =
        selectedOffice === 'all' || s.officeName?.trim() === selectedOffice

      return matchSearch && matchOffice
    })
  }, [scorecards, searchTerm, selectedOffice])

  // Aggregated Statistics for Top KPI Cards
  const stats = useMemo(() => {
    if (scorecards.length === 0) {
      return {
        totalAuditors: 0,
        totalAssigned: 0,
        totalCompleted: 0,
        totalDeclared: 0,
        totalAssessed: 0,
        totalFinal: 0,
        avgScore: 0,
        tierA: 0,
        tierB: 0,
        tierC: 0,
        tierD: 0,
      }
    }

    const totalAuditors = scorecards.length
    const totalAssigned = scorecards.reduce((sum, s) => sum + s.totalAssignedCases, 0)
    const totalCompleted = scorecards.reduce((sum, s) => sum + s.completedCases, 0)
    const totalDeclared = scorecards.reduce((sum, s) => sum + s.totalDeclaredAmount, 0)
    const totalAssessed = scorecards.reduce((sum, s) => sum + s.totalAssessedAmount, 0)
    const totalFinal = scorecards.reduce((sum, s) => sum + s.totalFinalAmount, 0)
    const avgScore = scorecards.reduce((sum, s) => sum + s.compositeScore, 0) / totalAuditors

    const tierA = scorecards.filter((s) => s.performanceTier === 'A').length
    const tierB = scorecards.filter((s) => s.performanceTier === 'B').length
    const tierC = scorecards.filter((s) => s.performanceTier === 'C').length
    const tierD = scorecards.filter((s) => s.performanceTier === 'D').length

    return {
      totalAuditors,
      totalAssigned,
      totalCompleted,
      totalDeclared,
      totalAssessed,
      totalFinal,
      avgScore: Math.round(avgScore * 10) / 10,
      tierA,
      tierB,
      tierC,
      tierD,
    }
  }, [scorecards])

  const formatRials = (amount: number) => {
    if (Math.abs(amount) >= 1_000_000_000_000) {
      return `${toPersianDigits((amount / 1_000_000_000_000).toFixed(2))} همت`
    }
    if (Math.abs(amount) >= 1_000_000_000) {
      return `${toPersianDigits((amount / 1_000_000_000).toFixed(1))} میلیارد`
    }
    if (Math.abs(amount) >= 1_000_000) {
      return `${toPersianDigits((amount / 1_000_000).toFixed(0))} میلیون`
    }
    return `${toPersianDigits(amount.toLocaleString())} ریال`
  }

  const getMetricIcon = (code: string) => {
    switch (code) {
      case 'AUD_SPEED_NOTICE':
      case 'METRIC_SPEED_NOTICE':
        return <Clock className="w-5 h-5 text-sky-600" />
      case 'AUD_GAP_DISCOVERY':
      case 'METRIC_TAX_GAP_DISCOVERY':
        return <TrendingUp className="w-5 h-5 text-emerald-600" />
      case 'AUD_NOTICE_STABILITY':
      case 'METRIC_DEFENSIBILITY':
        return <ShieldCheck className="w-5 h-5 text-indigo-600" />
      case 'AUD_FINALITY_RATE':
      case 'METRIC_FINALITY_RATE':
        return <CheckCircle2 className="w-5 h-5 text-teal-600" />
      case 'AUD_HIGH_RISK_SHARE':
      case 'METRIC_RISK_COMPLEXITY':
        return <Sparkles className="w-5 h-5 text-amber-600" />
      case 'AUD_THROUGHPUT':
      case 'METRIC_THROUGHPUT':
      default:
        return <Briefcase className="w-5 h-5 text-purple-600" />
    }
  }

  const getTierBadge = (tier: 'A' | 'B' | 'C' | 'D', titleFa: string) => {
    switch (tier) {
      case 'A':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            رتبه A • {titleFa}
          </span>
        )
      case 'B':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            رتبه B • {titleFa}
          </span>
        )
      case 'C':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            رتبه C • {titleFa}
          </span>
        )
      case 'D':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            رتبه D • {titleFa}
          </span>
        )
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-slate-900 font-black text-xs shadow-xs border border-amber-500">
          🥇 ۱
        </span>
      )
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-900 font-black text-xs shadow-xs border border-slate-400">
          🥈 ۲
        </span>
      )
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-white font-black text-xs shadow-xs border border-amber-800">
          🥉 ۳
        </span>
      )
    }
    return (
      <span className="font-mono text-xs font-bold text-slate-500">
        {toPersianDigits(rank)}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-xs space-y-4">
        <RefreshCw className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-700">
          در حال پردازش هوشمند ریزداده‌ها و محاسبه کارنامه عملکرد حسابرسان...
        </p>
        <p className="text-xs text-slate-400">
          نگاشت خودکار ۲۹,۰۰۰+ پرونده و تطبیق با ۵ شاخص ارزیابی مصوب سازمانی
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
        <p className="text-sm font-bold text-rose-800">{error}</p>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-white text-rose-700 border border-rose-300 hover:bg-rose-100 transition-all cursor-pointer shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>تلاش مجدد</span>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-linear-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-600 text-white shadow-xs">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              ارزیابی عملکرد و کارنامه ۳۶۰ درجه حسابرسان (بر اساس فایل بارگذاری‌شده)
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              محاسبه زنده شاخص‌ها از روی {toPersianDigits(scorecards.reduce((s, c) => s + c.totalAssignedCases, 0).toLocaleString())} پرونده حسابرسی شده برای {toPersianDigits(scorecards.length)} حسابرس مستقل
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>محاسبه مجدد شاخص‌ها</span>
          </button>
        </div>
      </div>

      {/* Active KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {metrics.map((metric) => {
          // Average / aggregate value of this metric across all auditors
          let avgVal = 0
          if (scorecards.length > 0) {
            if (metric.metricCode === 'METRIC_DEFENSIBILITY' || metric.metricCode === 'AUD_NOTICE_STABILITY') {
              const totalFinal = scorecards.reduce((sum, s) => sum + s.totalFinalAmount, 0)
              const totalAssessed = scorecards.reduce((sum, s) => sum + s.totalAssessedAmount, 0)
              avgVal = totalAssessed > 0 ? (totalFinal / totalAssessed) * 100 : 0
            } else if (metric.metricCode === 'METRIC_FINALITY_RATE' || metric.metricCode === 'AUD_FINALITY_RATE') {
              const totalFinalized = scorecards.reduce((sum, s) => sum + (s.finalizedCasesCount || 0), 0)
              const totalCases = scorecards.reduce((sum, s) => sum + s.totalAssignedCases, 0)
              avgVal = totalCases > 0 ? (totalFinalized / totalCases) * 100 : 0
            } else {
              const vals = scorecards
                .map((s) => s.metricValues.find((m) => m.metricCode === metric.metricCode)?.rawValue)
                .filter((v): v is number => typeof v === 'number')

              if (vals.length > 0) {
                avgVal = vals.reduce((a, b) => a + b, 0) / vals.length
              }
            }
          }

          return (
            <div
              key={metric.id}
              className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500">
                  {metric.categoryTitle}
                </span>
                <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                  {getMetricIcon(metric.metricCode)}
                </div>
              </div>

              <div className="text-xs font-extrabold text-slate-800 line-clamp-1 mb-2">
                {metric.title}
              </div>

              <div className="flex items-baseline justify-between mb-1">
                <span className="text-lg font-black text-slate-900 font-mono">
                  {metric.unit === 'ریال'
                    ? formatRials(avgVal)
                    : `${toPersianDigits(avgVal.toFixed(1))} ${metric.unit}`}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  میانگین استانی
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-100 mt-2">
                <span>وزن: {toPersianDigits(metric.weightPercentage)}٪</span>
                <span>هدف: {toPersianDigits(metric.targetValue)} {metric.unit}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary Scorecard Tier Distribution */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-sm">
            A
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-900">حسابرسان ممتاز</div>
            <div className="text-lg font-black text-emerald-700 font-mono">
              {toPersianDigits(stats.tierA)} <span className="text-xs font-normal">نفر</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/60 border border-blue-100">
          <div className="w-9 h-9 rounded-xl bg-blue-500 text-white flex items-center justify-center font-black text-sm">
            B
          </div>
          <div>
            <div className="text-xs font-bold text-blue-900">عملکرد مطلوب</div>
            <div className="text-lg font-black text-blue-700 font-mono">
              {toPersianDigits(stats.tierB)} <span className="text-xs font-normal">نفر</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/60 border border-amber-100">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-sm">
            C
          </div>
          <div>
            <div className="text-xs font-bold text-amber-900">عملکرد متوسط</div>
            <div className="text-lg font-black text-amber-700 font-mono">
              {toPersianDigits(stats.tierC)} <span className="text-xs font-normal">نفر</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-50/60 border border-rose-100">
          <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center font-black text-sm">
            D
          </div>
          <div>
            <div className="text-xs font-bold text-rose-900">نیازمند بهبود</div>
            <div className="text-lg font-black text-rose-700 font-mono">
              {toPersianDigits(stats.tierD)} <span className="text-xs font-normal">نفر</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Provincial Champions Podium Spotlight */}
      {scorecards.length >= 3 && !searchTerm && selectedOffice === 'all' && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950/40 p-5 rounded-3xl border border-slate-700/60 shadow-xl text-white relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 relative z-10 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-amber-200">پیشتازان برتر رسیدگی و ارزیابی استان خوزستان</h4>
                <p className="text-[11px] text-slate-400">حسابرسان حائز بالاترین امتیاز تراز شده در سامانه یکپارچه سنیم</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20 font-bold">
              سکوی افتخار حسابرسی
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
            {scorecards.slice(0, 3).map((top, idx) => {
              const rank = idx + 1
              const rankColor =
                rank === 1
                  ? 'border-amber-400/40 bg-gradient-to-b from-amber-500/10 to-transparent'
                  : rank === 2
                  ? 'border-slate-400/40 bg-gradient-to-b from-slate-400/10 to-transparent'
                  : 'border-amber-700/40 bg-gradient-to-b from-amber-700/10 to-transparent'

              return (
                <div
                  key={top.auditorName}
                  onClick={() => setSelectedAuditorForDrawer(top.auditorName)}
                  className={`p-3.5 rounded-2xl border ${rankColor} backdrop-blur-xs flex items-center gap-3.5 hover:bg-white/5 transition-all cursor-pointer group`}
                >
                  <AuditorAvatar
                    auditorName={top.auditorName}
                    nationalId={top.auditorNationalId}
                    photoUrl={top.photoUrl}
                    size="lg"
                    rank={rank}
                    tier={top.performanceTier}
                    showLightbox={true}
                    className="group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-extrabold text-sm text-white group-hover:text-amber-300 transition-colors truncate">
                        {top.auditorName}
                      </span>
                      <span className="font-mono font-black text-xs text-amber-400">
                        {toPersianDigits(top.compositeScore.toFixed(1))}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 truncate mt-0.5">
                      {top.officeName}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 font-mono">
                      <span>{toPersianDigits(top.totalAssignedCases)} پرونده</span>
                      <span>•</span>
                      <span className="text-emerald-400">{toPersianDigits(top.completedCases)} مختومه</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Leaderboard Section Header & Filters */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-600" />
              <span>جدول رتبه‌بندی عملکرد حسابرسان این مجموعه داده</span>
              <span className="text-xs font-bold text-slate-400">
                ({toPersianDigits(filteredScorecards.length)} حسابرس)
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ترتیب رتبه‌ها بر اساس امتیاز وزنی کل از ۱۰۰ محاسبه شده است. جهت مشاهده جزئیات پرونده‌ها روی نام حسابرس کلیک فرمایید.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="جستجوی نام یا کدملی حسابرس..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-3 pr-9 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 w-56"
              />
            </div>

            {/* Office Filter */}
            {officeOptions.length > 0 && (
              <select
                value={selectedOffice}
                onChange={(e) => setSelectedOffice(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              >
                <option value="all">همه ادارات ({toPersianDigits(officeOptions.length)} اداره)</option>
                {officeOptions.map((off) => (
                  <option key={off} value={off}>
                    {off}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold">
              <tr>
                <th className="py-3 px-3 w-14 text-center">رتبه</th>
                <th className="py-3 px-4">نام و مشخصات حسابرس</th>
                <th className="py-3 px-4">اداره امور مالیاتی</th>
                <th className="py-3 px-3 text-center">تعداد پرونده</th>
                <th className="py-3 px-4 text-left">مجموع مالیات تشخیصی</th>
                <th className="py-3 px-4 text-left">مجموع مالیات قطعی</th>
                <th className="py-3 px-3 text-center">امتیاز کل (۱۰۰)</th>
                <th className="py-3 px-3 text-center">طبقه عملکردی</th>
                <th className="py-3 px-3 text-center">اقدام</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredScorecards.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    حسابرس منطبق با فیلترهای انتخابی یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredScorecards.map((row) => {
                  return (
                    <tr
                      key={row.auditorName}
                      className="hover:bg-amber-50/40 transition-colors group"
                    >
                      <td className="py-3 px-3 text-center">
                        {getRankBadge(row.provincialRank)}
                      </td>

                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => setSelectedAuditorForDrawer(row.auditorName)}
                          className="flex items-center gap-3 text-right group-hover:text-amber-800 transition-colors cursor-pointer"
                        >
                          <AuditorAvatar
                            auditorName={row.auditorName}
                            nationalId={row.auditorNationalId}
                            photoUrl={row.photoUrl}
                            size="md"
                            rank={row.provincialRank}
                            tier={row.performanceTier}
                            showLightbox={false}
                          />
                          <div>
                            <div className="font-extrabold text-slate-800 flex items-center gap-1.5">
                              <span>{row.auditorName}</span>
                            </div>
                            {row.auditorNationalId && (
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                کد ملی: {toPersianDigits(row.auditorNationalId)}
                              </div>
                            )}
                          </div>
                        </button>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]">
                            {row.officeName || 'نامشخص'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {onViewAuditorCases ? (
                          <button
                            type="button"
                            onClick={() => onViewAuditorCases(row.auditorName)}
                            className="inline-flex flex-col items-center justify-center p-1 rounded-xl hover:bg-amber-100/70 transition-all cursor-pointer group/pill"
                            title={`مشاهده ${toPersianDigits(row.totalAssignedCases)} پرونده در جدول داده‌ها`}
                          >
                            <span className="font-extrabold text-slate-800 group-hover/pill:text-amber-900 font-mono text-sm underline decoration-amber-400 decoration-2 underline-offset-2">
                              {toPersianDigits(row.totalAssignedCases)}
                            </span>
                            <div className="text-[10px] text-slate-500 group-hover/pill:text-amber-800">
                              {toPersianDigits(row.completedCases)} مختومه
                            </div>
                            {row.finalityRate !== undefined && (
                              <div className="text-[10px] font-bold text-teal-700 font-mono">
                                ٪{toPersianDigits(row.finalityRate.toFixed(1))} قطعی
                              </div>
                            )}
                          </button>
                        ) : (
                          <>
                            <span className="font-bold text-slate-800 font-mono">
                              {toPersianDigits(row.totalAssignedCases)}
                            </span>
                            <div className="text-[10px] text-slate-400">
                              {toPersianDigits(row.completedCases)} مختومه
                            </div>
                            {row.finalityRate !== undefined && (
                              <div className="text-[10px] font-bold text-teal-700 font-mono">
                                ٪{toPersianDigits(row.finalityRate.toFixed(1))} قطعی
                              </div>
                            )}
                          </>
                        )}
                      </td>

                      <td className="py-3 px-4 text-left font-mono font-bold text-slate-800">
                        {formatRials(row.totalAssessedAmount)}
                      </td>

                      <td className="py-3 px-4 text-left font-mono font-bold text-slate-800">
                        {formatRials(row.totalFinalAmount)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-xl bg-slate-900 text-white font-mono font-black text-xs shadow-2xs">
                          {toPersianDigits(row.compositeScore.toFixed(1))}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {getTierBadge(row.performanceTier, row.tierTitleFa)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {onViewAuditorCases && (
                            <button
                              type="button"
                              onClick={() => onViewAuditorCases(row.auditorName)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-50 text-sky-800 hover:bg-sky-600 hover:text-white border border-sky-200 transition-all cursor-pointer shadow-2xs"
                              title={`مشاهده ریز پرونده‌های ${row.auditorName} در جدول داده‌ها`}
                            >
                              <FileSpreadsheet className="w-3 h-3" />
                              <span>پرونده‌ها</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedAuditorForDrawer(row.auditorName)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-600 hover:text-white border border-amber-200 transition-all cursor-pointer shadow-2xs"
                          >
                            <span>کارنامه</span>
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 360 Degree Profile Drawer */}
      <AuditorScorecardDrawer
        auditorName={selectedAuditorForDrawer}
        reportCode={reportCode}
        onClose={() => setSelectedAuditorForDrawer(null)}
        onViewCases={(name) => {
          setSelectedAuditorForDrawer(null)
          onViewAuditorCases?.(name)
        }}
      />
    </div>
  )
}
