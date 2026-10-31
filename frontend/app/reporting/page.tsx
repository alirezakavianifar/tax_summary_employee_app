'use client'

import React, { useEffect, useState } from 'react'
import { reportingApi } from '@/lib/api/reporting'
import { ExecutiveDashboard } from '@/types/reporting'
import { KpiCard } from '@/components/reporting/KpiCard'
import { TrendChart } from '@/components/reporting/TrendChart'
import { DepartmentBarChart } from '@/components/reporting/DepartmentBarChart'
import {
  Users,
  Award,
  Wallet,
  AlertOctagon,
  Scale,
  CheckCircle2,
  Clock,
  Coins,
  RefreshCw,
  TrendingUp,
  FileSpreadsheet,
  Building2,
  Calendar,
} from 'lucide-react'

export default function ReportingDashboardPage() {
  const [dashboard, setDashboard] = useState<ExecutiveDashboard | null>(null)
  const [fiscalYear, setFiscalYear] = useState<number>(1404)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await reportingApi.getDashboard({ fiscalYear })
      setDashboard(data)
    } catch (err: any) {
      console.error('Failed to load dashboard:', err)
      setError(err?.response?.data?.error || 'خطا در بارگذاری اطلاعات داشبورد مدیریتی')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [fiscalYear])

  const kpis = dashboard?.kpiMetrics

  return (
    <div className="space-y-6">
      {/* Top Header & Year Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-amber-600" />
            داشبورد شاخص‌های کلیدی عملکرد (Executive BI)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            پایش یکپارچه و هوشمند وضعیت نیروی انسانی، مصرف اعتبارات رفاهی و اضافه کار، و پرونده‌های استرداد مالیات
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="font-semibold text-slate-700">سال مالی:</span>
            <select
              value={fiscalYear}
              onChange={(e) => setFiscalYear(Number(e.target.value))}
              className="bg-transparent font-bold text-amber-700 focus:outline-none cursor-pointer"
            >
              <option value={1404}>۱۴۰۴</option>
              <option value={1403}>۱۴۰۳</option>
              <option value={1402}>۱۴۰۲</option>
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
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2">
          <AlertOctagon className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="پرسنل فعال استان"
          value={kpis?.totalEmployeesActive ?? 0}
          subtitle="کلیه ادارات امور مالیاتی خوزستان"
          icon={Users}
          iconGradient="from-blue-600 to-indigo-600"
          badgeText="نیروی انسانی"
          badgeColor="bg-blue-50 text-blue-700 border-blue-200"
        />

        <KpiCard
          title="فرم‌های ارزیابی ثبت‌شده"
          value={kpis?.totalEvaluationsRecorded ?? 0}
          subtitle="شایستگی، انتصاب و ارتقاء"
          icon={Award}
          iconGradient="from-indigo-600 to-purple-600"
          badgeText="شایسته‌گزینی"
          badgeColor="bg-indigo-50 text-indigo-700 border-indigo-200"
        />

        <KpiCard
          title="مصرف اعتبار ماه جاری"
          value={
            kpis?.currentMonthActualSpent
              ? `${(kpis.currentMonthActualSpent / 10_000_000_000).toFixed(2)} همت`
              : '۰ ریال'
          }
          subtitle={`بودجه مصوب: ${
            kpis?.currentMonthApprovedBudget
              ? (kpis.currentMonthApprovedBudget / 10_000_000_000).toFixed(2)
              : 0
          } همت`}
          icon={Wallet}
          iconGradient="from-emerald-600 to-teal-600"
          trendValue={kpis ? Math.round(kpis.budgetUtilizationPercentage) : 0}
          trendLabel="ضریب جذب"
          badgeText={`${kpis ? kpis.budgetUtilizationPercentage.toFixed(1) : 0}% مصرف`}
          badgeColor="bg-emerald-50 text-emerald-700 border-emerald-200"
        />

        <KpiCard
          title="تخطی سقف ۱۲۰ ساعت"
          value={kpis?.laborCapViolationsCount ?? 0}
          subtitle="مشمول ماده ۵۹ قانون کار"
          icon={AlertOctagon}
          iconGradient="from-rose-500 to-red-600"
          trendInverted
          badgeText="کنترل انطباق"
          badgeColor="bg-rose-50 text-rose-700 border-rose-200"
        />

        <KpiCard
          title="پرونده‌های فعال استرداد"
          value={kpis?.activeRefundCasesCount ?? 0}
          subtitle="مواد ۲۴۲ و ۲۴۳ قانون مالیات‌ها"
          icon={Scale}
          iconGradient="from-amber-500 to-orange-600"
          badgeText="در جریان"
          badgeColor="bg-amber-50 text-amber-700 border-amber-200"
        />

        <KpiCard
          title="استرداد تایید و واریزشده"
          value={
            kpis?.totalRefundApprovedAmount
              ? `${(kpis.totalRefundApprovedAmount / 1_000_000_000).toFixed(1)} میلیارد`
              : '۰ ریال'
          }
          subtitle={`مطالبه مودیان: ${
            kpis?.totalRefundClaimedAmount
              ? (kpis.totalRefundClaimedAmount / 1_000_000_000).toFixed(1)
              : 0
          } میلیارد`}
          icon={CheckCircle2}
          iconGradient="from-teal-600 to-cyan-600"
          badgeText="مختومه مالی"
          badgeColor="bg-teal-50 text-teal-700 border-teal-200"
        />

        <KpiCard
          title="خسارت دیرکرد ماده ۲۴۳"
          value={
            kpis?.totalDelayInterestPaid
              ? `${(kpis.totalDelayInterestPaid / 1_000_000).toFixed(0)} م ریال`
              : '۰ ریال'
          }
          subtitle="خسارت ۱.۵ درصد ماهانه تاخیر"
          icon={Coins}
          iconGradient="from-red-500 to-rose-600"
          trendInverted
          badgeText="بار مالی دیرکرد"
          badgeColor="bg-rose-50 text-rose-700 border-rose-200"
        />

        <KpiCard
          title="میانگین زمان رسیدگی"
          value={`${kpis?.averageProcessingDays ? kpis.averageProcessingDays.toFixed(1) : 0} روز`}
          subtitle="از ثبت درخواست تا واریز خزانه"
          icon={Clock}
          iconGradient="from-slate-600 to-slate-800"
          badgeText="سرعت پاسخگویی"
          badgeColor="bg-slate-100 text-slate-700 border-slate-300"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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

          <TrendChart data={dashboard?.monthlyTrends || []} height={300} />
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

          <DepartmentBarChart departments={dashboard?.topDepartmentBudgets || []} maxItems={6} />
        </div>
      </div>

      {/* Bottom Grid: Tax Sources Breakdown & Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tax Sources Breakdown */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-sm text-slate-800">
                توزیع پرونده‌های استرداد بر اساس منبع مالیاتی
              </span>
            </div>
            <span className="text-[11px] text-slate-400">تفکیک منابع</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="py-2.5 px-3 font-bold">منبع مالیاتی</th>
                  <th className="py-2.5 px-3 font-bold text-center">تعداد پرونده</th>
                  <th className="py-2.5 px-3 font-bold text-left">مبلغ استرداد (ریال)</th>
                  <th className="py-2.5 px-3 font-bold text-left">خسارت تاخیر (ریال)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(dashboard?.taxSourceRefundDistribution || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                      اطلاعاتی ثبت نشده است
                    </td>
                  </tr>
                ) : (
                  (dashboard?.taxSourceRefundDistribution || []).map((source, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {source.taxSourcePersianTitle || source.taxSourceCode}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-center font-bold text-amber-700">
                        {source.caseCount.toLocaleString('fa-IR')}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-left font-bold text-slate-700" dir="ltr">
                        {source.totalApprovedRefundAmount.toLocaleString('fa-IR')}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-left text-rose-600" dir="ltr">
                        {source.totalDelayInterestAmount.toLocaleString('fa-IR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Audit Activities */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-sm text-slate-800">
                آخرین رویدادها و گزارش‌های اجرایی
              </span>
            </div>
            <span className="text-[11px] text-slate-400">لاگ ممیزی</span>
          </div>

          <div className="space-y-3">
            {(dashboard?.recentAuditActivities || []).length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                رویدادی در سامانه ثبت نشده است
              </div>
            ) : (
              (dashboard?.recentAuditActivities || []).slice(0, 5).map((act, i) => (
                <div key={i} className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 flex items-start justify-between gap-3 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-slate-800">{act.action}</span>
                    <span className="text-[11px] text-slate-500">{act.description}</span>
                    <span className="text-[10px] text-slate-400">توسط: {act.username}</span>
                  </div>
                  <span className="text-[10px] text-amber-700 font-mono flex-shrink-0 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {act.shamsiTimestamp}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
