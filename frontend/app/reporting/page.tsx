'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { reportingApi } from '@/lib/api/reporting'
import { ExecutiveDashboard, ReportExecutiveKpi } from '@/types/reporting'
import { CombinedExecutiveKpiView } from '@/components/reporting/CombinedExecutiveKpiView'
import { ReportExecutiveKpiTab } from '@/components/reporting/ReportExecutiveKpiTab'
import { TrendChart } from '@/components/reporting/TrendChart'
import { DepartmentBarChart } from '@/components/reporting/DepartmentBarChart'
import {
  TrendingUp,
  FileSpreadsheet,
  Scale,
  Building2,
  Calendar,
  RefreshCw,
  AlertOctagon,
  Layers,
  Activity,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  ExternalLink,
  BarChart3,
  CheckCircle2,
} from 'lucide-react'
import { toPersianDigits } from '@/lib/jalali'

export default function ReportingDashboardPage() {
  const [dashboard, setDashboard] = useState<ExecutiveDashboard | null>(null)
  const [combinedKpi, setCombinedKpi] = useState<ReportExecutiveKpi | null>(null)
  const [viewMode, setViewMode] = useState<'combined' | 'audit' | 'decree' | 'offices'>('combined')
  const [fiscalYear, setFiscalYear] = useState<number>(1405)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [showLegacyMetrics, setShowLegacyMetrics] = useState<boolean>(false)

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [dashData, kpiData] = await Promise.allSettled([
        reportingApi.getDashboard({ fiscalYear }),
        reportingApi.getCombinedKpi(),
      ])

      if (kpiData.status === 'fulfilled') {
        setCombinedKpi(kpiData.value)
      }

      if (dashData.status === 'fulfilled') {
        setDashboard(dashData.value)
        if (kpiData.status !== 'fulfilled' && dashData.value.combinedKpi) {
          setCombinedKpi(dashData.value.combinedKpi)
        }
      }

      if (kpiData.status === 'rejected' && dashData.status === 'rejected') {
        setError('خطا در بارگذاری اطلاعات شاخص‌های کلیدی عملکرد مدیریتی')
      }
    } catch (err: any) {
      console.error('Failed to load combined executive dashboard:', err)
      setError(err?.response?.data?.error || 'خطا در بارگذاری اطلاعات داشبورد مدیریتی')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [fiscalYear])

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Navigation & Sub-View Switcher Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* View Mode Segmented Controls */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setViewMode('combined')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'combined'
                ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-700" />
            <span>نمای تجمیعی و تلفیقی کلان</span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-600/20 text-slate-900 font-mono">
              ۳۹.۶k
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('audit')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'audit'
                ? 'bg-indigo-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
            <span>حسابرسی سنیم ۱۴۰۵</span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-indigo-200/60 text-indigo-950 font-mono">
              ۲۹.۳k
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('decree')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'decree'
                ? 'bg-amber-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Scale className="w-4 h-4 text-amber-300" />
            <span>قرارهای دادرسی ۲</span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-200/60 text-amber-950 font-mono">
              ۱۰.۳k
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('offices')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'offices'
                ? 'bg-slate-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>مقایسه ۴۳ اداره استان</span>
          </button>
        </div>

        {/* Year Filter & Quick Actions */}
        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="font-semibold text-slate-700">سال مالی:</span>
            <select
              value={fiscalYear}
              onChange={(e) => setFiscalYear(Number(e.target.value))}
              className="bg-transparent font-bold text-amber-700 focus:outline-none cursor-pointer"
            >
              <option value={1405}>۱۴۰۵</option>
              <option value={1404}>۱۴۰۴</option>
              <option value={1403}>۱۴۰۳</option>
            </select>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
            title="به‌روزرسانی داده‌ها"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-600' : ''}`} />
          </button>

          <Link
            href="/reporting/standard"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <span>گزارش‌های استاندارد</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="px-3 py-1 text-xs font-bold bg-white text-rose-800 rounded-lg border border-rose-300 hover:bg-rose-100 transition-colors cursor-pointer"
          >
            تلاش مجدد
          </button>
        </div>
      )}

      {/* Main View Display */}
      {viewMode === 'combined' && (
        <>
          {isLoading && !combinedKpi ? (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-16 text-center shadow-xs">
              <Activity className="w-8 h-8 text-amber-600 animate-spin mx-auto mb-3" />
              <div className="text-sm font-extrabold text-slate-800">
                در حال پردازش و تلفیق شاخص‌های کلیدی عملکرد پرونده‌های حسابرسی و قرارهای دادرسی...
              </div>
              <div className="text-xs text-slate-400 mt-1">
                محاسبه بلادرنگ از میان ۳۹,۶۶۹ رکورد عملیاتی استان خوزستان
              </div>
            </div>
          ) : combinedKpi ? (
            <CombinedExecutiveKpiView
              kpiData={combinedKpi}
              onSwitchView={setViewMode}
              onRefresh={loadData}
              isLoading={isLoading}
            />
          ) : (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
              داده‌ای برای نمایش یافت نشد.
            </div>
          )}
        </>
      )}

      {/* View 2: Audit 1405 Detailed KPI */}
      {viewMode === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-indigo-900">
                  نمای تفصیلی شاخص‌های کلیدی حسابرسی سنیم
                </div>
                <div className="text-[11px] text-indigo-700">
                  منبع داده: ریز دیتای پرونده های حسابرسی شده در سال ۱۴۰۵ (تعداد رکورد: ۲۹,۳۱۱)
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setViewMode('combined')}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-white text-indigo-900 border border-indigo-300 hover:bg-indigo-100 transition-all cursor-pointer shadow-2xs"
            >
              بازگشت به نمای تلفیقی
            </button>
          </div>

          <ReportExecutiveKpiTab
            reportCode="REP_1405"
            reportTitle="گزارش ریز دیتای پرونده های حسابرسی شده در سال ۱۴۰۵"
            reportActorType="auditor"
          />
        </div>
      )}

      {/* View 3: Dispute Decrees Detailed KPI */}
      {viewMode === 'decree' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-amber-950">
                  نمای تفصیلی شاخص‌های کلیدی قرارهای دادرسی
                </div>
                <div className="text-[11px] text-amber-800">
                  منبع داده: گزارش قرار_۲ (تعداد رکورد: ۱۰,۳۵۸)
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setViewMode('combined')}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-white text-amber-950 border border-amber-300 hover:bg-amber-100 transition-all cursor-pointer shadow-2xs"
            >
              بازگشت به نمای تلفیقی
            </button>
          </div>

          <ReportExecutiveKpiTab
            reportCode="REP_2"
            reportTitle="گزارش قرار_۲"
            reportActorType="decree"
          />
        </div>
      )}

      {/* View 4: Cross-Department Benchmark Dedicated Table */}
      {viewMode === 'offices' && combinedKpi && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-100 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">
                  ماتریس عملکرد مقایسه‌ای ۴۳ اداره امور مالیاتی استان خوزستان
                </div>
                <div className="text-[11px] text-slate-500">
                  تحلیل بار مالی، حجم پرونده‌ها و نرخ اتمام کارشناسی قرارها به تفکیک ادارات
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setViewMode('combined')}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-white text-slate-800 border border-slate-300 hover:bg-slate-200 transition-all cursor-pointer shadow-2xs"
            >
              بازگشت به نمای تلفیقی
            </button>
          </div>

          <CombinedExecutiveKpiView
            kpiData={combinedKpi}
            onSwitchView={setViewMode}
            onRefresh={loadData}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Expandable Secondary Analytics Section (Payroll, Budget & Refunds) */}
      <div className="border-t border-slate-200/80 pt-4">
        <button
          type="button"
          onClick={() => setShowLegacyMetrics(!showLegacyMetrics)}
          className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs font-extrabold flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span>سایر آمارهای عمومی استان (روندهای ماهانه، بودجه رفاهی و استرداد مالیات)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>{showLegacyMetrics ? 'بستن' : 'مشاهده تحلیل‌ها'}</span>
            {showLegacyMetrics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showLegacyMetrics && dashboard && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4 animate-in fade-in duration-300">
            {/* Left (8 cols): Trend Curve */}
            <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-sm text-slate-800">
                    روند ماهانه تخصیص اعتبارات و استرداد مالیات
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">سال مالی {fiscalYear}</span>
              </div>

              <TrendChart data={dashboard.monthlyTrends || []} height={300} />
            </div>

            {/* Right (4 cols): Department Budget Meter */}
            <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-sm text-slate-800">
                    مصرف بودجه و انحراف ادارات
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">ادارات پرمصرف</span>
              </div>

              <DepartmentBarChart departments={dashboard.topDepartmentBudgets || []} maxItems={6} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
