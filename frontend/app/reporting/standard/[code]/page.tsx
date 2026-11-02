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
} from 'lucide-react'
import { ReportTweakDrawer } from '@/components/reporting/ReportTweakDrawer'
import { DeleteReportModal } from '@/components/reporting/DeleteReportModal'
import { ReportAuditorPerformanceTab } from '@/components/reporting/ReportAuditorPerformanceTab'
import { AuditorAvatar } from '@/components/reporting/AuditorAvatar'
import { toPersianDigits } from '@/lib/jalali'

export default function StandardReportDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const code = (params?.code as string) || ''

  const initialView = searchParams.get('view') as 'table' | 'performance' | null
  const initialAuditor = searchParams.get('auditor')

  const [reportDef, setReportDef] = useState<ReportDefinition | null>(null)
  const [executionResult, setExecutionResult] = useState<ReportExecutionResult | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [isTweakOpen, setIsTweakOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [activeView, setActiveView] = useState<'table' | 'performance'>(initialView || 'table')

  const reportActorType = React.useMemo(() => {
    if (!executionResult?.columns) return null
    const hasDecree = executionResult.columns.some((c) => {
      const h = (c.persianLabel || c.fieldName || '').toLowerCase()
      return (h.includes('مجری قرار') || h.includes('سرپرست مجری') || h.includes('کارشناس اجرای قرار') || h.includes('اجرای قرار')) && !h.includes('طول') && !h.includes('کد')
    })
    if (hasDecree) return 'decree' as const

    const hasAuditor = executionResult.columns.some((c) => {
      const h = (c.persianLabel || c.fieldName || '').toLowerCase()
      return h.includes('حسابرس') && !h.includes('طول') && !h.includes('کد')
    })
    if (hasAuditor) return 'auditor' as const

    return null
  }, [executionResult?.columns])

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
  }, [code, filters.pageNumber, filters.pageSize, filters.sortBy, filters.sortDescending, filters.auditorName])

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
      alert(err?.response?.data?.error || 'خطا در صدور فایل اکسل')
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
    <div className="space-y-5">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link
          href="/reporting/standard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-amber-700 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به کاتالوگ گزارش‌ها</span>
        </Link>

        <div className="flex items-center gap-2">
          <ExportActionMenu onExportExcel={handleExportExcel} disabled={isLoading || !executionResult} />
        </div>
      </div>

      {/* Report Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
              {reportDef?.code || code}
            </span>
            <span className="text-xs text-slate-400">گزارش استاندارد مصوب</span>
          </div>

          <h1 className="text-lg sm:text-xl font-extrabold text-slate-800">
            {reportDef?.title || executionResult?.reportTitle || 'گزارش آماری'}
          </h1>

          {reportDef?.description && (
            <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
              {reportDef.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Custom Report Actions: Tweak & Delete */}
          {isCustom && (
            <>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 transition-all cursor-pointer shadow-2xs"
                title="حذف دائمی این گزارش و داده‌های جدول آن"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف گزارش</span>
              </button>

              <button
                type="button"
                onClick={() => setIsTweakOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white border border-purple-200 transition-all cursor-pointer shadow-2xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>سفارشی‌سازی ستون‌ها و فیلترها (Tweak)</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={execute}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-600' : ''}`} />
            <span>تازه‌سازی</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* View Switcher Tabs (when report has auditor or decree data) */}
      {hasAuditorData && (
        <div className="flex items-center gap-2 border-b border-slate-200/90 pb-2">
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
            <span>{reportActorType === 'decree' ? 'جدول ریز داده‌های قرارها' : 'جدول ریز داده‌های پرونده‌ها'}</span>
          </button>

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
        </div>
      )}

      {/* Tab 1: Standard Table View */}
      {activeView === 'table' && (
        <>
          {/* Filter Parameters Bar */}
          <ReportFilterBar
            filters={filters}
            onChange={(newFilters) => setFilters(newFilters)}
            onApply={execute}
            onReset={() => setFilters({ pageNumber: 1, pageSize: 15 })}
            onSavePreset={handleSavePreset}
            isLoading={isLoading}
          />

          {/* Active Supervisor / Auditor Filter Notification Banner */}
          {filters.auditorName && (
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50 border border-amber-300/80 rounded-2xl p-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
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
