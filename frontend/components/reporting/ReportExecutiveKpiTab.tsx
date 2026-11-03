'use client'

import React, { useEffect, useState } from 'react'
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
} from 'lucide-react'
import { reportingApi } from '@/lib/api/reporting'
import { ReportExecutiveKpi, ExecutiveKpiCard } from '@/types/reporting'
import { toPersianDigits } from '@/lib/jalali'

interface ReportExecutiveKpiTabProps {
  reportCode: string
  reportTitle?: string
  reportActorType?: 'decree' | 'auditor' | 'generic'
  onViewOfficeCases?: (officeName: string) => void
}

export function ReportExecutiveKpiTab({
  reportCode,
  reportTitle,
  reportActorType,
  onViewOfficeCases,
}: ReportExecutiveKpiTabProps) {
  const [kpiData, setKpiData] = useState<ReportExecutiveKpi | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const loadKpiData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await reportingApi.getReportKpi(reportCode)
      setKpiData(data)
    } catch (err: any) {
      console.error('Failed to load report KPI data:', err)
      setError(err?.response?.data?.error || err?.message || 'خطا در بارگذاری شاخص‌های کلیدی عملکرد')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (reportCode) {
      loadKpiData()
    }
  }, [reportCode])

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

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Activity className="w-6 h-6 animate-spin" />
        </div>
        <div className="text-sm font-extrabold text-slate-800">
          در حال محاسبه هوشمند شاخص‌های کلان عملکرد و هوش تجاری گزارش...
        </div>
        <div className="text-xs text-slate-400 mt-1">
          پردازش داده‌ها از میان هزاران رکورد پایگاه داده مالیاتی
        </div>
      </div>
    )
  }

  if (error || !kpiData) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
          <div>
            <div className="text-sm font-bold">خطا در بارگذاری داشبورد مدیریتی</div>
            <div className="text-xs text-rose-600 mt-0.5">{error || 'اطلاعاتی یافت نشد.'}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={loadKpiData}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-white text-rose-700 hover:bg-rose-100 border border-rose-300 transition-colors cursor-pointer shadow-2xs"
        >
          تلاش مجدد
        </button>
      </div>
    )
  }

  const isDecree = kpiData.reportActorType === 'decree'
  const isAuditor = kpiData.reportActorType === 'auditor'

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white p-6 rounded-3xl shadow-sm border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 font-mono uppercase tracking-wider">
              {kpiData.reportCode}
            </span>
            <span className="text-xs text-slate-300 font-medium">
              داشبورد تخصصی شاخص‌های کلیدی عملکرد (Executive BI)
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <span>{kpiData.reportTitle || reportTitle}</span>
          </h2>
          <p className="text-xs text-slate-300/90 leading-relaxed max-w-2xl">
            {isDecree
              ? 'پایش یکپارچه و هوشمند فرآیند دادرسی، توزیع مأخذ و اصل مالیات مورد مناقشه، ترکیب اعضای هیات‌های ماده ۲۴۴ و عملکرد شعب استان'
              : isAuditor
              ? 'پایش یکپارچه و تحلیلی پرونده‌های حسابرسی سنیم، تحلیل شکاف مالیاتی تشخیصی نسبت به اظهارنامه مودیان و نرخ قطعی‌سازی شعب استان'
              : 'داشبورد جامع شاخص‌های آماری، مالی و عملیاتی مجموعه داده‌های استخراج‌شده'}
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl px-4 py-2 text-right">
            <div className="text-[10px] text-slate-400">مجموع رکوردهای تحت پایش</div>
            <div className="text-base font-black text-amber-400 font-mono">
              {toPersianDigits(kpiData.totalRowCount.toLocaleString('fa-IR'))}{' '}
              <span className="text-xs text-slate-300 font-sans">
                {isDecree ? 'فقره قرار' : isAuditor ? 'پرونده حسابرسی' : 'رکورد'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={loadKpiData}
            disabled={isLoading}
            className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all cursor-pointer"
            title="به‌روزرسانی داده‌ها"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 8 Executive KPI Cards Grid */}
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

      {/* Financial Matrix & Assessment Gap Section */}
      <div className="bg-gradient-to-br from-white via-amber-50/20 to-orange-50/30 p-6 rounded-3xl border border-amber-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                {isDecree
                  ? 'ماتریس تحلیل ابعاد مالی و بار مناقشه قرارهای دادرسی استان'
                  : 'ماتریس کلان تشخیص مالیاتی و تحلیل شکاف مالیاتی (Tax Gap)'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isDecree
                  ? 'تفکیک مأخذ درآمد مشمول، اصل مالیات مورد مناقشه و جرائم و عوارض متعلق'
                  : 'مقایسه مالیات خوداظهاری مودیان در مقابل مالیات تشخیصی ممیزان و مالیات قطعی'}
              </p>
            </div>
          </div>

          {isAuditor && kpiData.financialSummary.assessmentGapPercentage > 0 && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>
                رشد مالیات در مرحله رسیدگی:{' '}
                <span className="font-mono font-black text-emerald-700">
                  +{toPersianDigits(kpiData.financialSummary.assessmentGapPercentage.toFixed(1))}%
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Financial Flow Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isDecree ? (
            <>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="text-[11px] font-bold text-slate-400">مجموع مأخذ (درآمد) مشمول</div>
                <div className="text-lg font-black text-slate-800 font-mono mt-1">
                  {formatRials(kpiData.financialSummary.disputedBaseAmount)}
                </div>
                <div className="text-[10px] text-blue-600 font-bold mt-1">مبنای محاسبه مالیات در قرارها</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="text-[11px] font-bold text-slate-400">مجموع اصل مالیات مورد مناقشه</div>
                <div className="text-lg font-black text-emerald-700 font-mono mt-1">
                  {formatRials(kpiData.financialSummary.principalTaxAmount)}
                </div>
                <div className="text-[10px] text-emerald-600 font-bold mt-1">اصل مالیات تشخیصی مورد اعتراض</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="text-[11px] font-bold text-slate-400">مجموع عوارض و جرائم متعلق</div>
                <div className="text-lg font-black text-rose-700 font-mono mt-1">
                  {formatRials(kpiData.financialSummary.penaltiesAmount)}
                </div>
                <div className="text-[10px] text-rose-600 font-bold mt-1">جرائم ماده ۱۶۹ و عوارض ارزش افزوده</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-amber-300 bg-amber-50/50 shadow-2xs">
                <div className="text-[11px] font-bold text-amber-900">کل بار مالی موضوع دادرسی</div>
                <div className="text-lg font-black text-amber-900 font-mono mt-1">
                  {formatRials(
                    (kpiData.financialSummary.principalTaxAmount || 0) +
                      (kpiData.financialSummary.penaltiesAmount || 0)
                  )}
                </div>
                <div className="text-[10px] text-amber-700 font-bold mt-1">مجموع اصل و متفرقات در دادرسی</div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="text-[11px] font-bold text-slate-400">مالیات ابرازی مودیان (خوداظهاری)</div>
                <div className="text-lg font-black text-slate-800 font-mono mt-1">
                  {formatRials(kpiData.financialSummary.declaredTaxAmount)}
                </div>
                <div className="text-[10px] text-slate-500 font-bold mt-1">مجموع مالیات اظهارشده در بدو امر</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-2xs">
                <div className="text-[11px] font-bold text-emerald-800">مالیات تشخیصی اداره کل</div>
                <div className="text-lg font-black text-emerald-900 font-mono mt-1">
                  {formatRials(kpiData.financialSummary.assessedTaxAmount)}
                </div>
                <div className="text-[10px] text-emerald-700 font-bold mt-1">برگ تشخیص صادره پس از ممیزی</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-amber-300 bg-amber-50/50 shadow-2xs">
                <div className="text-[11px] font-bold text-amber-900">شکاف مالیاتی (تفاوت تشخیصی)</div>
                <div className="text-lg font-black text-amber-900 font-mono mt-1">
                  {formatRials(kpiData.financialSummary.taxGapAmount)}
                </div>
                <div className="text-[10px] text-amber-700 font-bold mt-1">درآمد مالیاتی مابه التفاوت کشف‌شده</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-teal-200 bg-teal-50/40 shadow-2xs">
                <div className="text-[11px] font-bold text-teal-800">مالیات قطعی‌شده سنیم</div>
                <div className="text-lg font-black text-teal-900 font-mono mt-1">
                  {formatRials(kpiData.financialSummary.finalTaxAmount)}
                </div>
                <div className="text-[10px] text-teal-700 font-bold mt-1">مبلغ تثبیت‌شده و لازم‌الوصول</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Analytics Mid-Row: Stages Funnel & Tax Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Stage Funnel / Composition */}
        <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-700 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">
                {isDecree
                  ? 'قیف توزیع مراحل دادرسی و حل اختلاف استان'
                  : 'قیف فرآیند پیشرفت پرونده‌های حسابرسی سنیم'}
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">تحلیل چرخه عمر</span>
          </div>

          {/* Stages Funnel List */}
          <div className="space-y-3">
            {kpiData.stageDistribution.map((stage, idx) => (
              <div key={stage.stageCode || idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>{stage.stageTitle}</span>
                  </span>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="font-bold text-slate-700">
                      {toPersianDigits(stage.caseCount.toLocaleString('fa-IR'))}{' '}
                      <span className="text-[10px] text-slate-400 font-sans">
                        {isDecree ? 'قرار' : 'پرونده'}
                      </span>
                    </span>
                    <span className="text-[11px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                      ٪{toPersianDigits(stage.percentage.toFixed(1))}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-l from-amber-500 to-amber-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(5, stage.percentage))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Methodology / Board Composition Cards */}
          {kpiData.methodologyDistribution.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="text-[11px] font-extrabold text-slate-600 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  {isDecree
                    ? 'ترکیب نمایندگان هیات‌های حل اختلاف ماده ۲۴۴'
                    : 'روش‌شناسی حسابرسی سنیم (سیستمی vs دستی)'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {kpiData.methodologyDistribution.map((m, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between"
                  >
                    <span className="text-[11px] font-bold text-slate-700 leading-tight">
                      {m.title}
                    </span>
                    <div className="flex items-baseline justify-between mt-2 font-mono">
                      <span className="text-sm font-black text-slate-900">
                        {toPersianDigits(m.caseCount.toLocaleString('fa-IR'))}
                      </span>
                      {m.percentage > 0 && (
                        <span className="text-[10px] font-bold text-amber-700">
                          ٪{toPersianDigits(m.percentage.toFixed(1))}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Tax Source Breakdown */}
        <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-700 flex items-center justify-center">
                <PieChart className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">توزیع پرونده‌ها بر اساس منبع مالیاتی</h3>
            </div>
            <span className="text-[11px] text-slate-400">تفکیک منابع</span>
          </div>

          <div className="space-y-3">
            {kpiData.taxSourceDistribution.map((src, i) => (
              <div key={i} className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-800">{src.sourceTitle}</span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-slate-700">
                      {toPersianDigits(src.caseCount.toLocaleString('fa-IR'))}{' '}
                      <span className="text-[10px] text-slate-400 font-sans">فقره</span>
                    </span>
                    <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                      ٪{toPersianDigits(src.percentage.toFixed(1))}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-l from-purple-500 to-indigo-600 h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(3, src.percentage))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-0.5">
                  <span>مجموع مالیات تشخیصی:</span>
                  <span className="font-bold text-slate-800">{formatRials(src.totalAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Office Workload Meter Table */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                توزیع بارکاری و حجم مالی به تفکیک ادارات امور مالیاتی استان
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                رتبه‌بندی شعب بر اساس فراوانی پرونده‌ها، نرخ مختومه و ارزش مالیاتی پرونده‌ها
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-400 font-mono">
            ({toPersianDigits(kpiData.officeWorkload.length)} اداره کل و شعبه فعال)
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th className="py-3 px-4">نام اداره امور مالیاتی</th>
                <th className="py-3 px-3 text-center">{isDecree ? 'تعداد کل قرارها' : 'تعداد کل پرونده‌ها'}</th>
                <th className="py-3 px-4 text-center">نرخ پیشرفت و مختومه</th>
                <th className="py-3 px-4 text-left">{isDecree ? 'درآمد (مأخذ) مشمول' : 'مالیات تشخیصی'}</th>
                <th className="py-3 px-4 text-left">{isDecree ? 'اصل مالیات مورد مناقشه' : 'مالیات قطعی'}</th>
                {onViewOfficeCases && <th className="py-3 px-3 text-center">اقدام</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {kpiData.officeWorkload.map((off, index) => (
                <tr key={off.officeName} className="hover:bg-amber-50/30 transition-colors">
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                    {toPersianDigits(index + 1)}
                  </td>
                  <td className="py-3 px-4 font-extrabold text-slate-800">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{off.officeName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-extrabold text-slate-900">
                    {toPersianDigits(off.caseCount.toLocaleString('fa-IR'))}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-teal-600 h-2 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(5, off.completionRate))}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] font-black text-teal-700">
                        ٪{toPersianDigits(off.completionRate.toFixed(1))}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-left font-mono font-bold text-slate-800">
                    {formatRials(off.totalAssessedAmount)}
                  </td>
                  <td className="py-3 px-4 text-left font-mono font-bold text-emerald-700">
                    {formatRials(off.totalFinalAmount)}
                  </td>
                  {onViewOfficeCases && (
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => onViewOfficeCases(off.officeName)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-600 hover:text-white border border-amber-200 transition-all cursor-pointer shadow-2xs"
                        title={reportActorType === 'decree' ? `مشاهده ریز داده‌های قرارهای ${off.officeName}` : `مشاهده ریز داده‌های پرونده‌های ${off.officeName}`}
                      >
                        <span>{reportActorType === 'decree' ? 'قرارها' : 'پرونده‌ها'}</span>
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top 10 High Exposure Taxpayers Table */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                ۱۰ مودی عمده و پرونده‌های با بالاترین اهمیت مالیاتی (High Exposure)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                بزرگ‌ترین پرونده‌های رسیدگی یا دادرسی استان جهت نظارت ویژه و پایش مدیریت ارشد
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
            تمرکز ریسک درآمدی
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th className="py-3 px-4">نام مودی / شرکت</th>
                <th className="py-3 px-3 text-center">کد ملی / شناسه ملی</th>
                <th className="py-3 px-3">منبع مالیاتی</th>
                <th className="py-3 px-3">اداره امور مالیاتی</th>
                <th className="py-3 px-4 text-left">{isDecree ? 'درآمد (مأخذ) مشمول' : 'مالیات تشخیصی'}</th>
                <th className="py-3 px-4 text-left">{isDecree ? 'اصل مالیات' : 'مالیات قطعی'}</th>
                <th className="py-3 px-3 text-center">وضعیت پرونده</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {kpiData.topTaxpayers.map((tp, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                    {toPersianDigits(idx + 1)}
                  </td>
                  <td className="py-3 px-4 font-extrabold text-slate-900">
                    <span>{tp.taxpayerName}</span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-600">
                    {toPersianDigits(tp.nationalId) || '-'}
                  </td>
                  <td className="py-3 px-3 text-slate-700 font-medium">{tp.taxSource}</td>
                  <td className="py-3 px-3 text-slate-600 text-[11px]">{tp.officeName || '-'}</td>
                  <td className="py-3 px-4 text-left font-mono font-black text-rose-700">
                    {formatRials(tp.assessedAmount)}
                  </td>
                  <td className="py-3 px-4 text-left font-mono font-black text-emerald-700">
                    {formatRials(tp.finalAmount)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 truncate max-w-[130px]">
                      {tp.currentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
