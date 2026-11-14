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
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Building2,
  AlertCircle,
  HelpCircle,
  BarChart3,
  CheckCircle2,
  FileSpreadsheet,
  Scale,
  Users,
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
  reportActorType?: 'auditor' | 'decree'
  onViewAuditorCases?: (auditorName: string) => void
}

export function ReportAuditorPerformanceTab({
  reportCode,
  reportActorType,
  onViewAuditorCases,
}: ReportAuditorPerformanceTabProps) {
  const isDecree = reportActorType === 'decree' || (reportCode ? reportCode.toUpperCase().includes('REP_2') : false)
  const [scorecards, setScorecards] = useState<AuditorScorecard[]>([])
  const [metrics, setMetrics] = useState<AuditorPerformanceMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOffice, setSelectedOffice] = useState('all')
  const [selectedAuditorForDrawer, setSelectedAuditorForDrawer] = useState<string | null>(null)
  const [isInsightsExpanded, setIsInsightsExpanded] = useState<boolean>(false)

  // Restore user's insights panel preference from storage
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('reporting_auditor_insights_expanded')
      if (saved !== null) {
        setIsInsightsExpanded(saved === 'true')
      }
    } catch {
      // Ignore storage access errors
    }
  }, [])

  const toggleInsights = () => {
    setIsInsightsExpanded((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem('reporting_auditor_insights_expanded', String(next))
      } catch {
        // Ignore storage access errors
      }
      return next
    })
  }

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(15) // 0 indicates 'All'
  const [sortColumn, setSortColumn] = useState<string>('rank')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [jumpPageInput, setJumpPageInput] = useState<string>('')

  // Reset to first page when filtering or page size changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedOffice, pageSize])

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
      console.error('Failed to load performance data for report:', err)
      setError(
        err?.response?.data?.error ||
          err.message ||
          (isDecree
            ? 'خطا در محاسبه شاخص‌های ارزیابی عملکرد مجریان قرار'
            : 'خطا در محاسبه شاخص‌های ارزیابی عملکرد حسابرسان')
      )
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

  // Sorted scorecards
  const sortedScorecards = useMemo(() => {
    return [...filteredScorecards].sort((a, b) => {
      let valA: any = a.provincialRank
      let valB: any = b.provincialRank

      if (sortColumn === 'name') {
        valA = a.auditorName || ''
        valB = b.auditorName || ''
        return sortDirection === 'asc'
          ? valA.localeCompare(valB, 'fa')
          : valB.localeCompare(valA, 'fa')
      } else if (sortColumn === 'cases') {
        valA = a.totalAssignedCases || 0
        valB = b.totalAssignedCases || 0
      } else if (sortColumn === 'assessed') {
        valA = a.totalAssessedAmount || 0
        valB = b.totalAssessedAmount || 0
      } else if (sortColumn === 'final') {
        valA = a.totalFinalAmount || 0
        valB = b.totalFinalAmount || 0
      } else if (sortColumn === 'score') {
        valA = a.compositeScore || 0
        valB = b.compositeScore || 0
      } else {
        // default rank
        valA = a.provincialRank || 0
        valB = b.provincialRank || 0
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA
      }
      return sortDirection === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1)
    })
  }, [filteredScorecards, sortColumn, sortDirection])

  // Pagination calculations
  const totalRowCount = sortedScorecards.length
  const effectivePageSize = pageSize > 0 ? pageSize : totalRowCount || 1
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(totalRowCount / pageSize)) : 1
  const safePage = Math.min(Math.max(1, currentPage), totalPages)

  const paginatedScorecards = useMemo(() => {
    if (pageSize <= 0) return sortedScorecards
    const start = (safePage - 1) * pageSize
    return sortedScorecards.slice(start, start + pageSize)
  }, [sortedScorecards, safePage, pageSize])

  const startRow = totalRowCount > 0 ? (safePage - 1) * effectivePageSize + 1 : 0
  const endRow = Math.min(safePage * effectivePageSize, totalRowCount)

  const getPageNumbers = () => {
    const delta = 2
    const range: (number | 'ellipsis')[] = []
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= safePage - delta && i <= safePage + delta)) {
        range.push(i)
      } else if (range[range.length - 1] !== 'ellipsis') {
        range.push('ellipsis')
      }
    }
    return range
  }

  const handleJumpPage = (e: React.FormEvent) => {
    e.preventDefault()
    const pageNum = parseInt(
      jumpPageInput.replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1728)),
      10
    )
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum)
      setJumpPageInput('')
    }
  }

  const handleSort = (column: 'rank' | 'name' | 'cases' | 'assessed' | 'final' | 'score') => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(column)
      setSortDirection(column === 'rank' || column === 'name' ? 'asc' : 'desc')
    }
    setCurrentPage(1)
  }

  const renderSortIcon = (column: 'rank' | 'name' | 'cases' | 'assessed' | 'final' | 'score') => {
    if (sortColumn !== column) {
      return (
        <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover/th:text-slate-500 transition-colors inline-block" />
      )
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-amber-600 inline-block" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-amber-600 inline-block" />
    )
  }

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

  const getDecreeMetricOverrides = (code: string) => {
    switch (code) {
      case 'METRIC_DEFENSIBILITY':
      case 'AUD_NOTICE_STABILITY':
        return {
          title: 'نرخ تایید و استحکام گزارش‌های قرار',
          categoryTitle: 'کیفیت گزارش قرار',
        }
      case 'METRIC_FINALITY_RATE':
      case 'AUD_FINALITY_RATE':
        return {
          title: 'درصد قرارهای تکمیل و ثبت گزارش شده',
          categoryTitle: 'نرخ تکمیل قرار',
        }
      case 'METRIC_TAX_GAP_DISCOVERY':
      case 'AUD_GAP_DISCOVERY':
        return {
          title: 'مجموع اصل مالیات مورد دادرسی',
          categoryTitle: 'ارزش مالیاتی قرارها',
        }
      case 'METRIC_SPEED_NOTICE':
      case 'AUD_SPEED_NOTICE':
        return {
          title: 'میانگین روزهای اجرای قرار (تخصیص تا ثبت)',
          categoryTitle: 'سرعت اجرای قرار',
        }
      case 'METRIC_THROUGHPUT':
      case 'AUD_THROUGHPUT':
        return {
          title: 'حجم قرارهای رسیدگی‌شده توسط مجری',
          categoryTitle: 'بازدهی و ظرفیت',
        }
      case 'METRIC_RISK_COMPLEXITY':
      case 'AUD_HIGH_RISK_SHARE':
        return {
          title: 'سهم قرارهای مراحل تجدیدنظر و هم‌عرض',
          categoryTitle: 'پیچیدگی مرحله اعتراض',
        }
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-xs space-y-4">
        <RefreshCw className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-700">
          {isDecree
            ? 'در حال پردازش هوشمند ریزداده‌ها و محاسبه کارنامه عملکرد مجریان قرار...'
            : 'در حال پردازش هوشمند ریزداده‌ها و محاسبه کارنامه عملکرد حسابرسان...'}
        </p>
        <p className="text-xs text-slate-400">
          {isDecree
            ? 'نگاشت خودکار ۱۰,۳۰۰+ فقره قرار دادرسی و تطبیق با ۵ شاخص تخصصی اجرای قرار'
            : 'نگاشت خودکار ۲۹,۰۰۰+ پرونده و تطبیق با ۵ شاخص ارزیابی مصوب سازمانی'}
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
    <div className="space-y-4">
      {/* Collapsible Executive Insights Tray */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden transition-all">
        {/* Toggle Ribbon Header */}
        <div className="p-3 sm:px-4 sm:py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-gradient-to-r from-amber-500/5 via-slate-50/60 to-white">
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={toggleInsights}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs ${
                isInsightsExpanded
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300/70'
              }`}
              title={isInsightsExpanded ? 'بستن پنل شاخص‌ها و سکوی افتخار' : 'نمایش کامل شاخص‌ها و سکوی افتخار'}
            >
              <Award className={`w-3.5 h-3.5 ${isInsightsExpanded ? 'text-amber-200' : 'text-amber-600'}`} />
              <span>
                {isDecree
                  ? 'داشبورد شاخص‌های کلیدی و سکوی افتخار مجریان (KPI)'
                  : 'داشبورد شاخص‌های کلیدی و سکوی افتخار حسابرسان (KPI)'}
              </span>
              {isInsightsExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 mr-0.5" />
              )}
            </button>

            {/* Micro-metrics pills (always visible in ribbon) */}
            <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-bold">
              <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/60 font-mono">
                {isDecree
                  ? `${toPersianDigits(scorecards.length)} مجری`
                  : `${toPersianDigits(scorecards.length)} حسابرس`}
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/60 font-mono">
                {isDecree
                  ? `${toPersianDigits(stats.totalAssigned.toLocaleString())} فقره قرار`
                  : `${toPersianDigits(stats.totalAssigned.toLocaleString())} پرونده`}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/70 font-mono">
                <span>رتبه A:</span>
                <span>{toPersianDigits(stats.tierA)} نفر</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200/70 font-mono">
                <span>رتبه B:</span>
                <span>{toPersianDigits(stats.tierB)} نفر</span>
              </span>
              {stats.totalAssessed > 0 && (
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/70 font-mono">
                  <span>تثبیت:</span>
                  <span>{toPersianDigits(((stats.totalFinal / stats.totalAssessed) * 100).toFixed(1))}٪</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
              title="محاسبه مجدد شاخص‌های ارزیابی ۳۶۰ درجه"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
              <span className="hidden sm:inline">محاسبه مجدد</span>
            </button>
          </div>
        </div>

        {/* Collapsible Content: 6 KPI Cards + Tiers + Podium (+ Decree if applicable) */}
        {isInsightsExpanded && (
          <div className="p-4 sm:p-5 border-t border-slate-200/80 space-y-5 bg-slate-50/40 animate-in fade-in slide-in-from-top-1 duration-200">
            {/* Active KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {metrics.map((metric) => {
          // Average / aggregate value of this metric across all auditors/supervisors
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

          const decreeOverride = isDecree ? getDecreeMetricOverrides(metric.metricCode) : null
          const displayTitle = decreeOverride?.title || metric.title
          const displayCategory = decreeOverride?.categoryTitle || metric.categoryTitle

          return (
            <div
              key={metric.id}
              className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500">
                  {displayCategory}
                </span>
                <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                  {getMetricIcon(metric.metricCode)}
                </div>
              </div>

              <div className="text-xs font-extrabold text-slate-800 line-clamp-1 mb-2">
                {displayTitle}
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
            <div className="text-xs font-bold text-emerald-900">
              {isDecree ? 'مجریان ممتاز' : 'حسابرسان ممتاز'}
            </div>
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
            <div className="text-xs font-bold text-rose-900">
              {isDecree ? 'نیازمند تسریع و پیگیری' : 'نیازمند بهبود'}
            </div>
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
                <h4 className="text-sm font-black text-amber-200">
                  {isDecree
                    ? 'پیشتازان برتر اجرای قرار و دادرسی مالیاتی استان خوزستان'
                    : 'پیشتازان برتر رسیدگی و ارزیابی استان خوزستان'}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {isDecree
                    ? 'مجریان و سرپرستان حائز بالاترین امتیاز تراز شده در اجرای قرارهای دادرسی سنیم'
                    : 'حسابرسان حائز بالاترین امتیاز تراز شده در سامانه یکپارچه سنیم'}
                </p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20 font-bold">
              {isDecree ? 'سکوی افتخار مجریان قرار' : 'سکوی افتخار حسابرسی'}
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
                      <span>
                        {toPersianDigits(top.totalAssignedCases)} {isDecree ? 'قرار' : 'پرونده'}
                      </span>
                      <span>•</span>
                      <span className="text-emerald-400">
                        {toPersianDigits(top.completedCases)} {isDecree ? 'ثبت گزارش' : 'مختومه'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Dispute Resolution Board Composition Widget (Only for Decrees) */}
      {isDecree && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">
                  ترکیب اعضای هیات‌های حل اختلاف مالیاتی صادرکننده قرار
                </h4>
                <p className="text-[11px] text-slate-500">
                  توزیع قرارهای صادره در مراجع دادرسی مالیاتی استان خوزستان بر اساس بندهای سه‌گانه ماده ۲۴۴ قانون مالیات‌های مستقیم
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-mono">
              ماده ۲۴۴ ق.م.م
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-indigo-100/30 border border-indigo-200/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-indigo-950">بند ۱ - قضات دادگستری</div>
                  <div className="text-[11px] text-indigo-700">نمایندگان محترم قوه قضائیه</div>
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="text-base font-black text-indigo-900">{toPersianDigits(35)}</div>
                <div className="text-[10px] text-indigo-600">قاضی صادرکننده</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-teal-50/70 to-teal-100/30 border border-teal-200/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-teal-950">بند ۲ - سازمان امور مالیاتی</div>
                  <div className="text-[11px] text-teal-700">نمایندگان امور مالیاتی استان</div>
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="text-base font-black text-teal-900">{toPersianDigits(76)}</div>
                <div className="text-[10px] text-teal-600">نماینده اداری</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/70 to-amber-100/30 border border-amber-200/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-amber-950">بند ۳ - اتاق‌ها و مجامع</div>
                  <div className="text-[11px] text-amber-700">اتاق بازرگانی، اصناف و جامعه حسابداران</div>
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="text-base font-black text-amber-900">{toPersianDigits(110)}</div>
                <div className="text-[10px] text-amber-600">نماینده اصناف و تشکل‌ها</div>
              </div>
            </div>
          </div>
        </div>
      )}
          </div>
        )}
      </div>

      {/* Leaderboard Section Header & Filters */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-600" />
              <span>
                {isDecree
                  ? 'جدول رتبه‌بندی عملکرد مجریان قرار دادرسی این مجموعه داده'
                  : 'جدول رتبه‌بندی عملکرد حسابرسان این مجموعه داده'}
              </span>
              <span className="text-xs font-bold text-slate-400">
                ({toPersianDigits(filteredScorecards.length)} {isDecree ? 'مجری قرار' : 'حسابرس'})
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isDecree
                ? 'ترتیب رتبه‌ها بر اساس امتیاز وزنی کل از ۱۰۰ محاسبه شده است. جهت مشاهده جزئیات قرارها روی نام مجری کلیک فرمایید.'
                : 'ترتیب رتبه‌ها بر اساس امتیاز وزنی کل از ۱۰۰ محاسبه شده است. جهت مشاهده جزئیات پرونده‌ها روی نام حسابرس کلیک فرمایید.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder={isDecree ? 'جستجوی نام یا کدملی مجری قرار...' : 'جستجوی نام یا کدملی حسابرس...'}
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
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold select-none">
              <tr>
                <th
                  onClick={() => handleSort('rank')}
                  className="py-3 px-3 w-16 text-center cursor-pointer hover:bg-slate-100 transition-colors group/th"
                  title="مرتب‌سازی بر اساس رتبه"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>رتبه</span>
                    {renderSortIcon('rank')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors group/th"
                  title="مرتب‌سازی بر اساس نام"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{isDecree ? 'نام و مشخصات مجری / سرپرست قرار' : 'نام و مشخصات حسابرس'}</span>
                    {renderSortIcon('name')}
                  </div>
                </th>
                <th className="py-3 px-4">اداره امور مالیاتی</th>
                <th
                  onClick={() => handleSort('cases')}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors group/th"
                  title="مرتب‌سازی بر اساس تعداد"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{isDecree ? 'تعداد قرار' : 'تعداد پرونده'}</span>
                    {renderSortIcon('cases')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('assessed')}
                  className="py-3 px-4 text-left cursor-pointer hover:bg-slate-100 transition-colors group/th"
                  title="مرتب‌سازی بر اساس مبالغ تشخیصی / مأخذ"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>{isDecree ? 'درآمد (مأخذ) مشمول' : 'مجموع مالیات تشخیصی'}</span>
                    {renderSortIcon('assessed')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('final')}
                  className="py-3 px-4 text-left cursor-pointer hover:bg-slate-100 transition-colors group/th"
                  title="مرتب‌سازی بر اساس مبالغ قطعی / اصل مالیات"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>{isDecree ? 'مجموع اصل مالیات' : 'مجموع مالیات قطعی'}</span>
                    {renderSortIcon('final')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('score')}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors group/th"
                  title="مرتب‌سازی بر اساس امتیاز کل"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>امتیاز کل (۱۰۰)</span>
                    {renderSortIcon('score')}
                  </div>
                </th>
                <th className="py-3 px-3 text-center">طبقه عملکردی</th>
                <th className="py-3 px-3 text-center">اقدام</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedScorecards.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    {isDecree
                      ? 'مجری قرار منطبق با فیلترهای انتخابی یافت نشد.'
                      : 'حسابرس منطبق با فیلترهای انتخابی یافت نشد.'}
                  </td>
                </tr>
              ) : (
                paginatedScorecards.map((row) => {
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
                            title={`مشاهده ${toPersianDigits(row.totalAssignedCases)} ${isDecree ? 'قرار' : 'پرونده'} در جدول داده‌ها`}
                          >
                            <span className="font-extrabold text-slate-800 group-hover/pill:text-amber-900 font-mono text-sm underline decoration-amber-400 decoration-2 underline-offset-2">
                              {toPersianDigits(row.totalAssignedCases)}
                            </span>
                            <div className="text-[10px] text-slate-500 group-hover/pill:text-amber-800">
                              {toPersianDigits(row.completedCases)} {isDecree ? 'ثبت گزارش' : 'مختومه'}
                            </div>
                            {row.finalityRate !== undefined && (
                              <div className="text-[10px] font-bold text-teal-700 font-mono">
                                ٪{toPersianDigits(row.finalityRate.toFixed(1))} {isDecree ? 'تایید شده' : 'قطعی'}
                              </div>
                            )}
                          </button>
                        ) : (
                          <>
                            <span className="font-bold text-slate-800 font-mono">
                              {toPersianDigits(row.totalAssignedCases)}
                            </span>
                            <div className="text-[10px] text-slate-400">
                              {toPersianDigits(row.completedCases)} {isDecree ? 'ثبت گزارش' : 'مختومه'}
                            </div>
                            {row.finalityRate !== undefined && (
                              <div className="text-[10px] font-bold text-teal-700 font-mono">
                                ٪{toPersianDigits(row.finalityRate.toFixed(1))} {isDecree ? 'تایید شده' : 'قطعی'}
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
                              title={`مشاهده ریز ${isDecree ? 'قرارهای' : 'پرونده‌های'} ${row.auditorName} در جدول داده‌ها`}
                            >
                              <FileSpreadsheet className="w-3 h-3" />
                              <span>{isDecree ? 'قرارها' : 'پرونده‌ها'}</span>
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

        {/* Pagination Controls */}
        <div className="pt-2 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-600 border-t border-slate-100">
          {/* Left: Range Summary & Page Size Selector */}
          <div className="flex items-center gap-4 flex-wrap w-full md:w-auto justify-between md:justify-start">
            <span className="text-slate-500 font-medium">
              نمایش ردیف‌های <span className="font-bold text-slate-800 font-mono">{toPersianDigits(startRow)}</span> تا{' '}
              <span className="font-bold text-slate-800 font-mono">{toPersianDigits(endRow)}</span> از مجموع{' '}
              <span className="font-extrabold text-amber-700 font-mono">{toPersianDigits(totalRowCount)}</span>{' '}
              {isDecree ? 'مجری قرار' : 'حسابرس'}
            </span>

            <div className="flex items-center gap-1.5 text-slate-500">
              <span>تعداد در صفحه:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="py-1 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
              >
                <option value={10}>۱۰</option>
                <option value={15}>۱۵</option>
                <option value={25}>۲۵</option>
                <option value={50}>۵۰</option>
                <option value={100}>۱۰۰</option>
                <option value={0}>همه ({toPersianDigits(totalRowCount)})</option>
              </select>
            </div>
          </div>

          {/* Right: Page Navigation Buttons & Quick Jump */}
          {pageSize > 0 && totalPages > 1 && (
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {/* Pagination Button Group */}
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                {/* First Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={safePage === 1}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-amber-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="صفحه اول"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>

                {/* Previous Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-amber-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="صفحه قبل"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Numbered Page Buttons with Ellipsis */}
                <div className="flex items-center gap-1 px-1">
                  {getPageNumbers().map((item, idx) => {
                    if (item === 'ellipsis') {
                      return (
                        <span key={`ellipsis-${idx}`} className="px-1.5 text-slate-400 select-none">
                          …
                        </span>
                      )
                    }
                    const isCurrent = item === safePage
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setCurrentPage(item)}
                        className={`w-7 h-7 text-xs font-bold rounded-lg font-mono transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'text-slate-700 hover:bg-white hover:text-amber-700'
                        }`}
                      >
                        {toPersianDigits(item)}
                      </button>
                    )
                  })}
                </div>

                {/* Next Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-amber-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="صفحه بعد"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Last Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safePage === totalPages}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-amber-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="صفحه آخر"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Jump to Page Form */}
              <form onSubmit={handleJumpPage} className="flex items-center gap-1.5 mr-2">
                <span className="text-[11px] text-slate-500">برو به:</span>
                <input
                  type="text"
                  value={jumpPageInput}
                  onChange={(e) => setJumpPageInput(e.target.value)}
                  placeholder={toPersianDigits(safePage)}
                  className="w-12 py-1 px-1 text-center font-mono font-bold text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
                <button
                  type="submit"
                  disabled={!jumpPageInput.trim()}
                  className="px-2 py-1 text-xs font-bold rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-600 hover:text-white border border-amber-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  تأیید
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* 360 Degree Profile Drawer */}
      <AuditorScorecardDrawer
        auditorName={selectedAuditorForDrawer}
        reportCode={reportCode}
        reportActorType={reportActorType}
        onClose={() => setSelectedAuditorForDrawer(null)}
        onViewCases={(name) => {
          setSelectedAuditorForDrawer(null)
          onViewAuditorCases?.(name)
        }}
      />
    </div>
  )
}
