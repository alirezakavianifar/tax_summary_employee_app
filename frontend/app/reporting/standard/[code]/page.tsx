'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { reportingApi } from '@/lib/api/reporting'
import {
  ReportDefinition,
  ReportExecutionResult,
  ReportFilterParameters,
} from '@/types/reporting'
import { ReportFilterBar } from '@/components/reporting/ReportFilterBar'
import { DynamicDataTable } from '@/components/reporting/DynamicDataTable'
import { ExportActionMenu } from '@/components/reporting/ExportActionMenu'
import {
  ArrowRight,
  FileSpreadsheet,
  RefreshCw,
  AlertCircle,
  Check,
  SlidersHorizontal,
  Trash2,
  Award,
  UserCheck,
  X,
  TrendingUp,
  Building2,
} from 'lucide-react'
import { ReportTweakDrawer } from '@/components/reporting/ReportTweakDrawer'
import { DeleteReportModal } from '@/components/reporting/DeleteReportModal'
import { ReportAuditorPerformanceTab } from '@/components/reporting/ReportAuditorPerformanceTab'
import { ReportExecutiveKpiTab } from '@/components/reporting/ReportExecutiveKpiTab'
import { AuditorAvatar } from '@/components/reporting/AuditorAvatar'
import { toPersianDigits } from '@/lib/jalali'

export default function StandardReportDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const code = (params?.code as string) || ''

  const initialView = searchParams.get('view') as 'table' | 'performance' | 'kpi' | null
  const initialAuditor = searchParams.get('auditor')

  const [reportDef, setReportDef] = useState<ReportDefinition | null>(null)
  const [executionResult, setExecutionResult] = useState<ReportExecutionResult | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [isTweakOpen, setIsTweakOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [activeView, setActiveView] = useState<'table' | 'performance' | 'kpi'>(initialView || 'table')

  const reportActorType = React.useMemo(() => {
    const cUpper = code.toUpperCase()
    if (cUpper === 'REP_2') return 'decree' as const
    if (cUpper === 'REP_1405') return 'auditor' as const

    const title = (reportDef?.title || executionResult?.reportTitle || '').toLowerCase()
    if (title.includes('حسابرسی') || title.includes('حسابرس')) return 'auditor' as const
    if (title.includes('قرار')) return 'decree' as const

    if (!executionResult?.columns) return null

    // Check primary auditor columns
    const hasAuditor = executionResult.columns.some((c) => {
      const h = (c.persianLabel || c.fieldName || '').toLowerCase()
      return (h.includes('نام حسابرس') || h === 'حسابرس') && !h.includes('طول') && !h.includes('کد')
    })
    if (hasAuditor) return 'auditor' as const

    const hasDecree = executionResult.columns.some((c) => {
      const h = (c.persianLabel || c.fieldName || '').toLowerCase()
      return (
        (h.includes('مجری قرار') || h.includes('کارشناس اجرای قرار') || h.includes('سرپرست مجری')) &&
        !h.includes('سامانه دادرسی') &&
        !h.includes('طول') &&
        !h.includes('کد')
      )
    })
    if (hasDecree) return 'decree' as const

    return null
  }, [code, reportDef?.title, executionResult?.reportTitle, executionResult?.columns])

  const hasAuditorData = reportActorType !== null

  const [filters, setFilters] = useState<ReportFilterParameters>({
    pageNumber: 1,
    pageSize: 15,
    auditorName: initialAuditor || undefined,
  })

  const loadMeta = async () => {
    try {
      const catalog = await reportingApi.getCatalog(undefined, true)
      const def = catalog.find((c) => c.code.toLowerCase() === code.toLowerCase())
      if (def) {
        setReportDef(def)
      }
    } catch (err) {
      console.error('Failed to load definition:', err)
    }
  }

  // Load report metadata
  useEffect(() => {
    if (code) {
      loadMeta()
    }
  }, [code])

  // Execute report
  const execute = async () => {
    if (!code) return
    try {
      setIsLoading(true)
      setError(null)
      const res = await reportingApi.executeStandardReport(code, filters)
      setExecutionResult(res)
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'خطا در بارگذاری گزارش')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    execute()
  }, [
    code,
    filters.pageNumber,
    filters.pageSize,
    filters.sortBy,
    filters.sortDescending,
    filters.auditorName,
    filters.department,
    filters.searchTerm,
    filters.caseStatus,
    filters.fiscalYear,
    filters.taxSourceCode,
  ])

  const handleViewAuditorCases = (auditorName: string) => {
    setActiveView('table')
    setFilters((prev) => ({
      ...prev,
      auditorName,
      pageNumber: 1,
    }))
  }

  const handleClearAuditorFilter = () => {
    setFilters((prev) => ({
      ...prev,
      auditorName: undefined,
      pageNumber: 1,
    }))
  }

  const handleClearDepartmentFilter = () => {
    setFilters((prev) => ({
      ...prev,
      department: undefined,
      pageNumber: 1,
    }))
  }

  const handleApplyFilters = (newFilters: ReportFilterParameters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      pageNumber: 1,
    }))
  }

  const handleSortChange = (field: string) => {
    setFilters((prev) => {
      const isSame = prev.sortBy === field
      return {
        ...prev,
        sortBy: field,
        sortDescending: isSame ? !prev.sortDescending : false,
      }
    })
  }

  const handleExportExcel = async () => {
    try {
      await reportingApi.exportStandardReportExcel(
        code,
        filters,
        `${reportDef?.title || code}_خروجی.xlsx`
      )
    } catch (err: any) {
      let message = 'خطا در صدور فایل اکسل'
      if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
        message = 'مدت زمان صدور فایل به دلیل حجم بالای داده‌ها بیش از حد مجاز شد. لطفاً فیلتر محدودتری اعمال فرمایید یا مجدداً تلاش کنید.'
      } else if (err?.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text()
          const json = JSON.parse(text)
          if (json?.error) message = json.error
        } catch {
          // ignore parsing error
        }
      } else if (err?.response?.data?.error) {
        message = err.response.data.error
      }
      alert(message)
    }
  }

  const handleSavePreset = async () => {
    if (!reportDef) return
    const name = window.prompt('نام الگوی فیلتر ذخیره‌شده را وارد فرمایید:')
    if (!name || !name.trim()) return

    try {
      await reportingApi.savePreset({
        reportDefinitionId: reportDef.id,
        presetName: name.trim(),
        filterCriteriaJson: JSON.stringify(filters),
        isSharedWithOffice: false,
      })
      setSaveSuccess(`الگوی «${name.trim()}» با موفقیت ذخیره شد.`)
      setTimeout(() => setSaveSuccess(null), 4000)
    } catch (err: any) {
      alert(err?.response?.data?.error || 'خطا در ذخیره الگو')
    }
  }

  const isCustom = reportDef?.domainSource === 6 || code.toUpperCase().startsWith('REP_CUSTOM_')

  return (
    <div className="space-y-3.5 print-landscape">
      {/* Explicit A4 Landscape Orientation for Multi-Column Standard Reports */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape !important;
            margin: 6mm 8mm !important;
          }
        }
      `}</style>

      {/* Official Print Letterhead (Print Only) */}
      <div className="print-only mb-6 border-b-2 border-slate-900 pb-4">
        <div className="flex items-center justify-between">
          <div className="text-right">
            <h2 className="text-sm font-black text-slate-900">جمهوری اسلامی ایران</h2>
            <h3 className="text-xs font-bold text-slate-800">سازمان امور مالیاتی کشور</h3>
            <h4 className="text-[11px] font-semibold text-slate-600">اداره کل امور مالیاتی استان خوزستان</h4>
          </div>
          <div className="text-center">
            <h1 className="text-base font-black text-slate-900">
              {reportDef?.title || executionResult?.reportTitle || 'گزارش آماری و عملکرد'}
            </h1>
            <div className="text-[11px] font-mono text-slate-500 mt-0.5">کد گزارش: {reportDef?.code || code}</div>
          </div>
          <div className="text-left text-[11px] text-slate-600 space-y-0.5">
            <div>تاریخ چاپ: {toPersianDigits(new Date().toLocaleDateString('fa-IR'))}</div>
            <div>زمان چاپ: {toPersianDigits(new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }))}</div>
            {filters.department && <div>اداره: {filters.department}</div>}
            {filters.auditorName && <div>مامور مالیاتی: {filters.auditorName}</div>}
          </div>
        </div>
      </div>

      {/* Unified Command Header Card */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 no-print">
        <div className="min-w-0">
          {/* Breadcrumb + Code Badge + Type Label */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Link
              href="/reporting/standard"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-amber-700 transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>کاتالوگ گزارش‌ها</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
              {reportDef?.code || code}
            </span>
            <span className="text-[11px] text-slate-400">گزارش استاندارد مصوب</span>
          </div>

          {/* Title & Description */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <h1 className="text-base sm:text-lg font-black text-slate-800 truncate">
              {reportDef?.title || executionResult?.reportTitle || 'گزارش آماری'}
            </h1>
            {reportDef?.description && (
              <span
                className="text-xs text-slate-500 hidden lg:inline truncate max-w-xl"
                title={reportDef.description}
              >
                — {reportDef.description}
              </span>
            )}
          </div>
        </div>

        {/* Unified Actions Bar (Export, Tweak, Delete, Refresh) */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <ExportActionMenu onExportExcel={handleExportExcel} disabled={isLoading || !executionResult} />

          {/* Custom Report Actions: Tweak & Delete */}
          {isCustom && (
            <>
              <button
                type="button"
                onClick={() => setIsTweakOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white border border-purple-200 transition-all cursor-pointer shadow-2xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">سفارشی‌سازی (Tweak)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 transition-all cursor-pointer shadow-2xs"
                title="حذف دائمی این گزارش و داده‌های جدول آن"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">حذف گزارش</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={execute}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-600' : ''}`} />
            <span>تازه‌سازی</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium no-print">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2 no-print">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* View Switcher Tabs (when report has auditor, decree, or standard KPI data) */}
      {(hasAuditorData || code.toUpperCase() === 'REP_2' || code.toUpperCase() === 'REP_1405') && (
        <div className="flex items-center gap-2 border-b border-slate-200/90 pb-2 flex-wrap no-print">
          <button
            type="button"
            onClick={() => setActiveView('table')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeView === 'table'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>
              {reportActorType === 'decree'
                ? 'جدول ریز داده‌های قرارها'
                : 'جدول ریز داده‌های پرونده‌های حسابرسی'}
            </span>
          </button>

          {hasAuditorData && (
            <button
              type="button"
              onClick={() => setActiveView('performance')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeView === 'performance'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>
                {reportActorType === 'decree'
                  ? 'ارزیابی عملکرد و کارنامه مجریان قرار'
                  : 'ارزیابی عملکرد و کارنامه حسابرسان'}
              </span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-200/70 text-amber-950">
                هوشمند
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveView('kpi')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeView === 'kpi'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <span>داشبورد شاخص‌های کلیدی عملکرد (KPI)</span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-indigo-200/70 text-indigo-950">
              مدیریتی
            </span>
          </button>
        </div>
      )}

      {/* Tab 1: Standard Table View */}
      {activeView === 'table' && (
        <>
          {/* Filter Parameters Bar */}
          <div className="no-print">
            <ReportFilterBar
              filters={filters}
              onChange={(newFilters) => setFilters(newFilters)}
              onApply={execute}
              onReset={() => setFilters({ pageNumber: 1, pageSize: 15 })}
              onSavePreset={handleSavePreset}
              isLoading={isLoading}
            />
          </div>

          {/* Active Supervisor / Auditor Filter Notification Banner */}
          {filters.auditorName && (
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50 border border-amber-300/80 rounded-2xl p-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 no-print">
              <div className="flex items-center gap-3">
                <AuditorAvatar
                  auditorName={filters.auditorName}
                  size="md"
                  showLightbox={true}
                  className="shrink-0"
                />
                <div>
                  <div className="text-[11px] font-bold text-amber-800">
                    {reportActorType === 'decree' ? 'فیلتر فعال قرارهای مجری' : 'فیلتر فعال پرونده‌های حسابرس'}
                  </div>
                  <div className="text-sm font-extrabold text-slate-900">
                    {reportActorType === 'decree' ? 'نمایش قرارهای ارجاعی به ' : 'نمایش پرونده‌های رسیدگی‌شده توسط '}
                    <span className="text-amber-900 font-black underline decoration-amber-400">«{filters.auditorName}»</span>
                    {executionResult && (
                      <span className="text-xs font-normal text-slate-600 mr-2">
                        ({toPersianDigits(executionResult.totalRowCount.toLocaleString('fa-IR'))} {reportActorType === 'decree' ? 'فقره قرار' : 'پرونده'})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveView('performance')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-all cursor-pointer shadow-xs"
                >
                  <Award className="w-4 h-4 text-amber-200" />
                  <span>{reportActorType === 'decree' ? 'بازگشت به رتبه‌بندی مجریان قرار' : 'بازگشت به رتبه‌بندی حسابرسان'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearAuditorFilter}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-all cursor-pointer shadow-2xs"
                  title={reportActorType === 'decree' ? 'حذف فیلتر مجری و نمایش تمامی قرارهای استان' : 'حذف فیلتر حسابرس و نمایش تمامی پرونده‌های استان'}
                >
                  <X className="w-4 h-4 text-slate-400" />
                  <span>{reportActorType === 'decree' ? 'نمایش همه قرارها' : 'نمایش همه پرونده‌ها'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Active Office / Department Filter Notification Banner */}
          {filters.department && (
            <div className="bg-gradient-to-r from-indigo-500/10 via-indigo-50 to-blue-50 border border-indigo-300/80 rounded-2xl p-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 no-print">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-200 shadow-2xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-indigo-800">
                    {reportActorType === 'decree' ? 'فیلتر فعال قرارهای اداره امور مالیاتی' : 'فیلتر فعال پرونده‌های اداره امور مالیاتی'}
                  </div>
                  <div className="text-sm font-extrabold text-slate-900">
                    {reportActorType === 'decree' ? 'نمایش قرارهای رسیدگی مربوط به ' : 'نمایش پرونده‌های رسیدگی‌شده '}
                    <span className="text-indigo-950 font-black underline decoration-indigo-400">«{filters.department}»</span>
                    {executionResult && (
                      <span className="text-xs font-normal text-slate-600 mr-2">
                        ({toPersianDigits(executionResult.totalRowCount.toLocaleString('fa-IR'))} {reportActorType === 'decree' ? 'فقره قرار' : 'پرونده'})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveView('kpi')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer shadow-xs"
                >
                  <TrendingUp className="w-4 h-4 text-indigo-200" />
                  <span>بازگشت به داشبورد شاخص‌های کلیدی (KPI)</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearDepartmentFilter}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-all cursor-pointer shadow-2xs"
                  title={reportActorType === 'decree' ? 'حذف فیلتر اداره و نمایش تمامی قرارهای استان' : 'حذف فیلتر اداره و نمایش تمامی پرونده‌های استان'}
                >
                  <X className="w-4 h-4 text-slate-400" />
                  <span>{reportActorType === 'decree' ? 'نمایش همه قرارها' : 'نمایش همه پرونده‌ها'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Dynamic Data Table with Sticky Aggregate Footer */}
          <DynamicDataTable
            columns={executionResult?.columns || []}
            rows={executionResult?.rows || []}
            summaryAggregates={executionResult?.summaryAggregates}
            totalRowCount={executionResult?.totalRowCount || 0}
            pageNumber={filters.pageNumber}
            pageSize={filters.pageSize}
            totalPages={executionResult?.totalPages || 1}
            sortBy={filters.sortBy}
            sortDescending={filters.sortDescending}
            onSortChange={handleSortChange}
            onPageChange={(newPage) => setFilters((prev) => ({ ...prev, pageNumber: newPage }))}
            onPageSizeChange={(newSize) => setFilters((prev) => ({ ...prev, pageSize: newSize, pageNumber: 1 }))}
            isLoading={isLoading}
          />

          {/* Official Print Signatures Block (Print Only) */}
          <div className="print-only mt-10 pt-4 border-t border-slate-400">
            <div className="grid grid-cols-3 gap-6 text-center text-xs font-bold text-slate-800">
              <div className="space-y-10">
                <div>تهیه‌کننده گزارش:</div>
                <div className="text-slate-400 font-normal">امضا و تاریخ</div>
              </div>
              <div className="space-y-10">
                <div>تاییدکننده (رئیس امور / گروه):</div>
                <div className="text-slate-400 font-normal">امضا و تاریخ</div>
              </div>
              <div className="space-y-10">
                <div>رئیس اداره امور مالیاتی / مدیرکل:</div>
                <div className="text-slate-400 font-normal">امضا و تاریخ</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tab 2: Auditor / Decree Performance & Scorecards View */}
      {activeView === 'performance' && (
        <ReportAuditorPerformanceTab 
          reportCode={code} 
          reportActorType={reportActorType || undefined}
          onViewAuditorCases={handleViewAuditorCases}
        />
      )}

      {/* Tab 3: Executive KPI Dashboard View */}
      {activeView === 'kpi' && (
        <ReportExecutiveKpiTab
          reportCode={code}
          reportTitle={reportDef?.title || executionResult?.reportTitle}
          reportActorType={reportActorType || undefined}
          onViewOfficeCases={(officeName) => {
            setActiveView('table')
            setFilters((prev) => ({ ...prev, department: officeName, pageNumber: 1 }))
          }}
        />
      )}

      {/* Tweak Studio Drawer */}
      <ReportTweakDrawer
        isOpen={isTweakOpen}
        reportCode={code}
        onClose={() => setIsTweakOpen(false)}
        onSaved={() => {
          execute()
          loadMeta()
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteReportModal
        isOpen={isDeleteModalOpen}
        report={reportDef}
        onClose={() => setIsDeleteModalOpen(false)}
        onDeleted={() => {
          router.push('/reporting/standard')
        }}
      />
    </div>
  )
}
