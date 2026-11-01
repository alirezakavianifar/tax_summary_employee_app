'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
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
} from 'lucide-react'
import { ReportTweakDrawer } from '@/components/reporting/ReportTweakDrawer'
import { DeleteReportModal } from '@/components/reporting/DeleteReportModal'

export default function StandardReportDetailPage() {
  const router = useRouter()
  const params = useParams()
  const code = (params?.code as string) || ''

  const [reportDef, setReportDef] = useState<ReportDefinition | null>(null)
  const [executionResult, setExecutionResult] = useState<ReportExecutionResult | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [isTweakOpen, setIsTweakOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const [filters, setFilters] = useState<ReportFilterParameters>({
    pageNumber: 1,
    pageSize: 15,
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
  }, [code, filters.pageNumber, filters.pageSize, filters.sortBy, filters.sortDescending])

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

      {/* Filter Parameters Bar */}
      <ReportFilterBar
        filters={filters}
        onChange={(newFilters) => setFilters(newFilters)}
        onApply={execute}
        onReset={() => setFilters({ pageNumber: 1, pageSize: 15 })}
        onSavePreset={handleSavePreset}
        isLoading={isLoading}
      />

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
