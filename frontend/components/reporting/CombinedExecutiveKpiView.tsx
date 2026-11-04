'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  Scale,
  Coins,
  Wallet,
  AlertOctagon,
  Users,
  CheckCircle2,
  Award,
  Building2,
  FileSpreadsheet,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  PieChart,
  BarChart3,
  Filter,
  RefreshCw,
  Layers,
  Activity,
  Briefcase,
  AlertCircle,
  ChevronLeft,
  ArrowLeft,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { ReportExecutiveKpi, ExecutiveKpiCard, KpiOfficeWorkload } from '@/types/reporting'
import { toPersianDigits } from '@/lib/jalali'

interface CombinedExecutiveKpiViewProps {
  kpiData: ReportExecutiveKpi
  onSwitchView?: (view: 'combined' | 'audit' | 'decree' | 'offices') => void
  onRefresh?: () => void
  isLoading?: boolean
}

export function CombinedExecutiveKpiView({
  kpiData,
  onSwitchView,
  onRefresh,
  isLoading = false,
}: CombinedExecutiveKpiViewProps) {
  const [officeSearchTerm, setOfficeSearchTerm] = useState('')
  const [officeSortBy, setOfficeSortBy] = useState<'totalCases' | 'totalAmount' | 'decreeCount' | 'auditCount' | 'completionRate'>('totalCases')
  const [sortDescending, setSortDescending] = useState(true)

  const formatRials = (amount?: number) => {
    if (amount === undefined || amount === null) return '۰ ریال'
    const abs = Math.abs(amount)
    if (abs >= 1_000_000_000_000) {
      return `${toPersianDigits((amount / 1_000_000_000_000).toFixed(1))} همت`
    }
    if (abs >= 1_000_000_000) {
      return `${toPersianDigits((amount / 1_000_000_000).toFixed(1))} میلیارد`
    }
    if (abs >= 1_000_000) {
      return `${toPersianDigits((amount / 1_000_000).toFixed(0))} م ریال`
    }
    return `${toPersianDigits(amount.toLocaleString('fa-IR'))} ریال`
  }

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Scale':
        return <Scale className="w-5 h-5" />
      case 'Coins':
        return <Coins className="w-5 h-5" />
      case 'Wallet':
        return <Wallet className="w-5 h-5" />
      case 'AlertOctagon':
        return <AlertOctagon className="w-5 h-5" />
      case 'Users':
        return <Users className="w-5 h-5" />
      case 'CheckCircle2':
        return <CheckCircle2 className="w-5 h-5" />
      case 'Award':
        return <Award className="w-5 h-5" />
      case 'Building2':
        return <Building2 className="w-5 h-5" />
      case 'FileSpreadsheet':
        return <FileSpreadsheet className="w-5 h-5" />
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5" />
      case 'Clock':
        return <Clock className="w-5 h-5" />
      default:
        return <TrendingUp className="w-5 h-5" />
    }
  }

  // Filter and sort offices
  const filteredOffices = (kpiData.officeWorkload || [])
    .filter((off) => {
      if (!officeSearchTerm.trim()) return true
      return off.officeName.toLowerCase().includes(officeSearchTerm.trim().toLowerCase())
    })
    .sort((a, b) => {
      let valA = 0
      let valB = 0
      switch (officeSortBy) {
        case 'totalCases':
          valA = a.caseCount
          valB = b.caseCount
          break
        case 'totalAmount':
          valA = a.totalAssessedAmount
          valB = b.totalAssessedAmount
          break
        case 'decreeCount':
          valA = a.decreeCaseCount || 0
          valB = b.decreeCaseCount || 0
          break
        case 'auditCount':
          valA = a.auditCaseCount || 0
          valB = b.auditCaseCount || 0
          break
        case 'completionRate':
          valA = a.completionRate
          valB = b.completionRate
          break
      }
      return sortDescending ? valB - valA : valA - valB
    })

  const auditKpi = kpiData.auditKpi
  const decreeKpi = kpiData.decreeKpi

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white p-6 sm:p-7 rounded-3xl shadow-md border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-0.5 rounded-full text-[11px] font-black bg-amber-500 text-slate-950 font-mono tracking-wider shadow-xs">
              EXECUTIVE BI
            </span>
            <span className="text-xs text-amber-200/90 font-medium">
              سامانه جامع آمار و هوش تجاری اداره کل امور مالیاتی استان خوزستان
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 tracking-tight">
            <TrendingUp className="w-6 h-6 text-amber-400 shrink-0" />
            <span>داشبورد شاخص‌های کلیدی عملکرد مدیریتی (Executive BI)</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed max-w-3xl">
            پایش یکپارچه و تلفیقی فرآیند رسیدگی پرونده‌های مالیاتی سنیم و قرارهای دادرسی هیأت‌های حل اختلاف با تحلیل کلان شکاف مالیاتی، بار مناقشه و عملکرد ۴۳ اداره استان
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-end md:self-auto relative z-10">
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl px-4 py-2.5 text-right shadow-xs">
            <div className="text-[10px] text-slate-400 font-semibold">مجموع رکوردهای تحت پایش</div>
            <div className="text-lg font-black text-amber-400 font-mono">
              {toPersianDigits(kpiData.totalRowCount.toLocaleString('fa-IR'))}{' '}
              <span className="text-xs text-slate-300 font-sans">پرونده و قرار</span>
            </div>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all cursor-pointer shadow-xs active:scale-95"
              title="به‌روزرسانی داده‌ها"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* 8 Hero Executive KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.kpiCards.map((card) => (
          <div
            key={card.key}
            className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.iconGradient} text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform`}
              >
                {renderIcon(card.iconName)}
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${card.badgeColor}`}
              >
                {toPersianDigits(card.badgeText)}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 block">{card.title}</span>
              <div className="text-xl font-black text-slate-900 tracking-tight font-mono">
                {toPersianDigits(card.value)}
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">{toPersianDigits(card.subtitle)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Dual Pipeline Visual Flow (مقایسه جریان دو بال عملیاتی استان) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pillar 1: Sanim Tax Audit */}
        <div className="bg-gradient-to-br from-white via-indigo-50/20 to-blue-50/30 rounded-3xl p-6 border border-indigo-200/80 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    بال اول: فرآیند رسیدگی و حسابرسی سنیم ۱۴۰۵
                  </h3>
                  <span className="text-[11px] text-indigo-700 font-medium">
                    پایش خوداظهاری مودیان، تشخیص مالیاتی و نرخ قطعی سنیم
                  </span>
                </div>
              </div>
              <span className="text-xs font-black font-mono px-2.5 py-1 rounded-xl bg-indigo-100 text-indigo-900 border border-indigo-200">
                {toPersianDigits(auditKpi ? auditKpi.totalRowCount.toLocaleString('fa-IR') : '۲۹,۳۱۱')} پرونده
              </span>
            </div>

            {/* Audit Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 text-right">
              <div className="bg-white p-3.5 rounded-2xl border border-indigo-100 shadow-2xs">
                <div className="text-[10px] text-slate-400 font-bold">مالیات ابرازی مودیان</div>
                <div className="text-base font-black text-slate-800 font-mono mt-1">
                  {formatRials(kpiData.financialSummary.declaredTaxAmount)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">خوداظهاری اولیه اظهارنامه‌ها</div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-indigo-100 shadow-2xs">
                <div className="text-[10px] text-slate-400 font-bold">مالیات تشخیصی اداره</div>
                <div className="text-base font-black text-emerald-700 font-mono mt-1">
                  {formatRials(kpiData.financialSummary.assessedTaxAmount)}
                </div>
                <div className="text-[10px] text-emerald-600 mt-0.5">صادره توسط ۲۵۳ حسابرس</div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-2xs">
                <div className="text-[10px] text-amber-900 font-bold">شکاف مالیاتی (Tax Gap)</div>
                <div className="text-base font-black text-amber-900 font-mono mt-1">
                  +{formatRials(kpiData.financialSummary.taxGapAmount)}
                </div>
                <div className="text-[10px] text-amber-800 mt-0.5 font-bold">
                  +{toPersianDigits(kpiData.financialSummary.assessmentGapPercentage.toFixed(1))}% رشد نسبت به ابرازی
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-indigo-100 shadow-2xs">
                <div className="text-[10px] text-slate-400 font-bold">مالیات قطعی سنیم</div>
                <div className="text-base font-black text-indigo-700 font-mono mt-1">
                  {formatRials(kpiData.financialSummary.finalTaxAmount)}
                </div>
                <div className="text-[10px] text-indigo-600 mt-0.5">۲۰,۷۸۸ پرونده مختومه (۷۰.۹%)</div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-indigo-100/80 flex items-center justify-between">
            <span className="text-xs text-slate-500">منبع داده: xlsx.۱۴۰۵ (REP_1405)</span>
            {onSwitchView ? (
              <button
                type="button"
                onClick={() => onSwitchView('audit')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer shadow-xs"
              >
                <span>ورود به داشبورد تحلیلی حسابرسی</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Link
                href="/reporting/standard/REP_1405?view=kpi"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer shadow-xs"
              >
                <span>ورود به داشبورد تحلیلی حسابرسی</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Pillar 2: Dispute Decrees */}
        <div className="bg-gradient-to-br from-white via-amber-50/20 to-orange-50/30 rounded-3xl p-6 border border-amber-200/80 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    بال دوم: فرآیند دادرسی و قرارهای هیأت‌ها (قرار ۲)
                  </h3>
                  <span className="text-[11px] text-amber-800 font-medium">
                    پایش قرارهای شعب دادرسی، توزیع مأخذ و عوارض و جرائم ۱۶۹
                  </span>
                </div>
              </div>
              <span className="text-xs font-black font-mono px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-200">
                {toPersianDigits(decreeKpi ? decreeKpi.totalRowCount.toLocaleString('fa-IR') : '۱۰,۳۵۸')} فقره قرار
              </span>
            </div>

            {/* Decree Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 text-right">
              <div className="bg-white p-3.5 rounded-2xl border border-amber-100 shadow-2xs">
                <div className="text-[10px] text-slate-400 font-bold">مجموع مأخذ (درآمد) مشمول</div>
                <div className="text-base font-black text-blue-700 font-mono mt-1">
                  {formatRials(kpiData.financialSummary.disputedBaseAmount)}
                </div>
                <div className="text-[10px] text-blue-600 mt-0.5">مأخذ مورد اختلاف در قرارها</div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-amber-100 shadow-2xs">
                <div className="text-[10px] text-slate-400 font-bold">اصل مالیات مورد مناقشه</div>
                <div className="text-base font-black text-emerald-700 font-mono mt-1">
                  {formatRials(kpiData.financialSummary.principalTaxAmount)}
                </div>
                <div className="text-[10px] text-emerald-600 mt-0.5">اصل مالیات مورد اعتراض</div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-rose-200 bg-rose-50/40 shadow-2xs">
                <div className="text-[10px] text-rose-900 font-bold">مجموع عوارض و جرائم ۱۶۹</div>
                <div className="text-base font-black text-rose-800 font-mono mt-1">
                  {formatRials(kpiData.financialSummary.penaltiesAmount)}
                </div>
                <div className="text-[10px] text-rose-700 mt-0.5 font-bold">جرائم ماده ۱۶۹ و عوارض دادرسی</div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-amber-100 shadow-2xs">
                <div className="text-[10px] text-slate-400 font-bold">نرخ اجرای قرارها</div>
                <div className="text-base font-black text-teal-700 font-mono mt-1">
                  %{toPersianDigits('99.7')}
                </div>
                <div className="text-[10px] text-teal-600 mt-0.5">۱۰,۳۲۴ فقره ثبت گزارش کارشناسی</div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-amber-100/80 flex items-center justify-between">
            <span className="text-xs text-slate-500">منبع داده: xlsx.قرار_2 (REP_2)</span>
            {onSwitchView ? (
              <button
                type="button"
                onClick={() => onSwitchView('decree')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-all cursor-pointer shadow-xs"
              >
                <span>ورود به داشبورد تحلیلی قرارها</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Link
                href="/reporting/standard/REP_2?view=kpi"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-all cursor-pointer shadow-xs"
              >
                <span>ورود به داشبورد تحلیلی قرارها</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Cross-Department Comprehensive Benchmark Matrix (ماتریس تحلیلی ۴۳ اداره استان) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900">
                ماتریس جامع مقایسه و رتبه‌بندی عملکرد ۴۳ اداره امور مالیاتی استان
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                تلفیق حجم پرونده‌های حسابرسی سنیم و قرارهای دادرسی، کل بار مالیاتی و نرخ اتمام کارشناسی هر اداره
              </p>
            </div>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="جستجوی اداره مالیاتی..."
                value={officeSearchTerm}
                onChange={(e) => setOfficeSearchTerm(e.target.value)}
                className="pr-9 pl-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all w-48 sm:w-56"
              />
            </div>

            <select
              value={officeSortBy}
              onChange={(e) => setOfficeSortBy(e.target.value as any)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
            >
              <option value="totalCases">مرتب‌سازی: کل پرونده‌ها</option>
              <option value="totalAmount">مرتب‌سازی: بار مالی</option>
              <option value="auditCount">مرتب‌سازی: پرونده‌های سنیم</option>
              <option value="decreeCount">مرتب‌سازی: قرارهای دادرسی</option>
              <option value="completionRate">مرتب‌سازی: نرخ اتمام</option>
            </select>

            <button
              type="button"
              onClick={() => setSortDescending(!sortDescending)}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title={sortDescending ? 'نزولی به صعودی' : 'صعودی به نزولی'}
            >
              {sortDescending ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-extrabold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="py-3 px-3 w-12 text-center">ردیف</th>
                <th className="py-3 px-4">نام اداره امور مالیاتی</th>
                <th className="py-3 px-3 text-center">پرونده سنیم</th>
                <th className="py-3 px-3 text-center">مالیات تشخیصی</th>
                <th className="py-3 px-3 text-center">قرارهای دادرسی</th>
                <th className="py-3 px-3 text-center">اصل مالیات مناقشه</th>
                <th className="py-3 px-3 text-center font-black text-slate-900 bg-slate-100/50">کل پرونده‌ها</th>
                <th className="py-3 px-3 text-center font-black text-slate-900 bg-slate-100/50">کل بار مالی</th>
                <th className="py-3 px-4 text-center">نرخ اجرای قرارها</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOffices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    اداره‌ای با این نام یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredOffices.map((off, idx) => (
                  <tr
                    key={off.officeName}
                    className="hover:bg-amber-50/30 transition-colors group"
                  >
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-[11px]">
                      {toPersianDigits(idx + 1)}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500/80 group-hover:scale-125 transition-transform shrink-0" />
                      <span>{off.officeName}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-indigo-900 font-semibold">
                      {toPersianDigits((off.auditCaseCount || 0).toLocaleString('fa-IR'))}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600 text-[11px]">
                      {formatRials(off.auditAssessedAmount)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-amber-900 font-semibold">
                      {toPersianDigits((off.decreeCaseCount || 0).toLocaleString('fa-IR'))}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600 text-[11px]">
                      {formatRials(off.decreeDisputedAmount)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-black text-slate-950 bg-slate-50/50">
                      {toPersianDigits(off.caseCount.toLocaleString('fa-IR'))}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-black text-amber-800 bg-slate-50/50 text-[11px]">
                      {formatRials(off.totalAssessedAmount)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-teal-500"
                            style={{ width: `${Math.min(100, off.decreeCompletionRate || off.completionRate)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-bold text-teal-700">
                          %{toPersianDigits((off.decreeCompletionRate || off.completionRate).toFixed(1))}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Sources Breakdown Across Both Wings */}
      {kpiData.taxSourceDistribution && kpiData.taxSourceDistribution.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                توزیع کلان منابع مالیاتی استان (اشخاص حقوقی، مشاغل، ارزش افزوده، مستغلات و...)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                سهم هر منبع مالیاتی از حجم کل پرونده‌های تحت رسیدگی و قرارهای دادرسی
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {kpiData.taxSourceDistribution.map((src, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-amber-50/40 transition-colors flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-800">{src.sourceTitle}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {formatRials(src.totalAmount)}
                  </div>
                </div>
                <div className="text-left font-mono">
                  <div className="text-sm font-black text-amber-900">
                    {toPersianDigits(src.caseCount.toLocaleString('fa-IR'))}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    %{toPersianDigits(src.percentage.toFixed(1))} سهم
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
