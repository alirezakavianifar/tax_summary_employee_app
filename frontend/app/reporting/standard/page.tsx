'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { reportingApi } from '@/lib/api/reporting'
import { ReportDefinition, DOMAIN_SOURCE_NAMES_FA, CATEGORY_NAMES_FA } from '@/types/reporting'
import {
  FileSpreadsheet,
  Search,
  ArrowLeft,
  Columns,
  Layers,
  UploadCloud,
  SlidersHorizontal,
  Trash2,
  Archive,
  RotateCcw,
} from 'lucide-react'
import { ExcelReportUploadModal } from '@/components/reporting/ExcelReportUploadModal'
import { ReportTweakDrawer } from '@/components/reporting/ReportTweakDrawer'
import { DeleteReportModal } from '@/components/reporting/DeleteReportModal'
import { toPersianDigits } from '@/lib/jalali'
import { useAuth } from '@/contexts/AuthContext'

export default function StandardReportsCatalogPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'Admin'

  const [reports, setReports] = useState<ReportDefinition[]>([])
  const [selectedSource, setSelectedSource] = useState<number | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Modals & Drawers
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [tweakReportCode, setTweakReportCode] = useState<string | null>(null)
  const [deleteTargetReport, setDeleteTargetReport] = useState<ReportDefinition | null>(null)

  const loadCatalog = async () => {
    try {
      setIsLoading(true)
      const isArchivedTab = selectedSource === -1
      const querySource = isArchivedTab ? undefined : selectedSource
      // Admins load all including inactive to allow archiving management
      const data = await reportingApi.getCatalog(querySource, isAdmin)
      setReports(data)
    } catch (err) {
      console.error('Failed to load standard catalog:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCatalog()
  }, [selectedSource, isAdmin])

  const inactiveCount = reports.filter((r) => !r.isActive).length

  const filteredReports = reports.filter((r) => {
    // Tab filter
    if (selectedSource === -1) {
      if (r.isActive) return false
    } else {
      if (!r.isActive) return false
      if (selectedSource !== undefined && r.domainSource !== selectedSource) return false
    }

    // Search term filter
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      r.title.toLowerCase().includes(term) ||
      r.code.toLowerCase().includes(term) ||
      r.description?.toLowerCase().includes(term)
    )
  })

  const sourceTabs = [
    { label: 'تمام حوزه‌ها', source: undefined },
    { label: 'داده‌های بارگذاری شده از اکسل', source: 6 },
    { label: 'رسیدگی سنیم (اکسل)', source: 5 },
    { label: 'حقوق و اضافه کار', source: 2 },
    { label: 'استرداد مالیات (۲۴۲/۲۴۳)', source: 3 },
    { label: 'منابع انسانی و ارزیابی', source: 1 },
    { label: 'تلفیقی و فرابخشی', source: 4 },
    ...(isAdmin
      ? [
          {
            label: `بایگانی / غیرفعال (${toPersianDigits(inactiveCount)})`,
            source: -1,
          },
        ]
      : []),
  ]

  return (
    <div className="space-y-6" dir="rtl">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-amber-600" />
            کاتالوگ گزارش‌های مصوب و پایگاه‌های داده
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            مجموعه گزارش‌های استاندارد سازمانی و مجموعه داده‌های بارگذاری شده از اکسل با امکان فیلتر، سفارشی‌سازی و مدیریت چرخه عمر
          </p>
        </div>

        {/* Action Button & Search */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:from-emerald-700 hover:to-teal-700 transition-all cursor-pointer"
          >
            <UploadCloud className="h-4 w-4" />
            <span>ایجاد گزارش جدید از اکسل</span>
          </button>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجوی عنوان، کد یا شرح..."
              className="w-full text-xs pr-9 pl-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {sourceTabs.map((tab, idx) => {
          const isSelected = selectedSource === tab.source
          const isArchivedPill = tab.source === -1
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedSource(tab.source)}
              className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? isArchivedPill
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-amber-600 text-white shadow-xs shadow-amber-600/30'
                  : isArchivedPill
                  ? 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Report Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-xs font-bold text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping mr-2" />
          در حال بارگذاری کاتالوگ گزارش‌ها...
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
          گزارشی منطبق با جستجو یافت نشد
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReports.map((report) => {
            const domainName = DOMAIN_SOURCE_NAMES_FA[report.domainSource] || 'سازمانی'
            const categoryName = CATEGORY_NAMES_FA[report.category] || 'تحلیلی'
            const isCustom = report.domainSource === 6 || report.code.startsWith('REP_CUSTOM_')
            const isInactive = !report.isActive

            return (
              <div
                key={report.code}
                className={`group relative rounded-2xl p-5 border shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between ${
                  isInactive
                    ? 'border-slate-300 bg-slate-50/70 opacity-80'
                    : isCustom
                    ? 'border-emerald-200 bg-gradient-to-b from-white to-emerald-50/20 hover:border-emerald-400'
                    : 'border-slate-200/90 bg-white hover:border-amber-300'
                }`}
              >
                <div>
                  {/* Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200" dir="ltr">
                      {report.code}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isInactive && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300">
                          بایگانی شده
                        </span>
                      )}

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isCustom
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {domainName}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-extrabold text-sm text-slate-800 mb-2 leading-snug group-hover:text-amber-700 transition-colors">
                    {report.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed">
                    {report.description}
                  </p>
                </div>

                {/* Footer details & Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto gap-2">
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Columns className="w-3.5 h-3.5" />
                      {toPersianDigits(report.columns?.length || 0)} ستون
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      {categoryName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Custom Report Actions: Direct Delete & Tweak */}
                    {isCustom ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setDeleteTargetReport(report)}
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-600 hover:text-white transition-all shadow-2xs"
                          title="حذف گزارش و پاک‌سازی جدول داده"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTweakReportCode(report.code)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-600 hover:text-white transition-all shadow-2xs"
                          title="ویرایش و سفارشی‌سازی ستون‌ها"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>ویرایش</span>
                        </button>
                      </>
                    ) : (
                      /* Standard Report Administrative Action: Archive / Reactivate */
                      isAdmin && (
                        <button
                          type="button"
                          onClick={() => setDeleteTargetReport(report)}
                          className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-2xs ${
                            report.isActive
                              ? 'text-slate-600 bg-slate-100 hover:bg-amber-100 hover:text-amber-800'
                              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white'
                          }`}
                          title={report.isActive ? 'بایگانی گزارش' : 'فعال‌سازی مجدد گزارش'}
                        >
                          {report.isActive ? (
                            <Archive className="w-3.5 h-3.5" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5" />
                          )}
                          <span>{report.isActive ? 'بایگانی' : 'فعال‌سازی'}</span>
                        </button>
                      )
                    )}

                    <Link
                      href={`/reporting/standard/${report.code}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-xs"
                    >
                      <span>اجرا</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Upload Wizard Modal */}
      <ExcelReportUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onReportCreated={() => {
          loadCatalog()
        }}
        onOpenTweakStudio={(code) => {
          setTweakReportCode(code)
        }}
      />

      {/* Tweak Studio Drawer */}
      <ReportTweakDrawer
        isOpen={!!tweakReportCode}
        reportCode={tweakReportCode}
        onClose={() => setTweakReportCode(null)}
        onSaved={() => {
          loadCatalog()
        }}
      />

      {/* Delete / Archive Report Confirmation Modal */}
      <DeleteReportModal
        isOpen={!!deleteTargetReport}
        report={deleteTargetReport}
        onClose={() => setDeleteTargetReport(null)}
        onDeleted={(code) => {
          setReports((prev) => prev.filter((r) => r.code !== code))
          loadCatalog()
        }}
        onStatusChanged={(code, newStatus) => {
          setReports((prev) =>
            prev.map((r) => (r.code === code ? { ...r, isActive: newStatus } : r))
          )
          loadCatalog()
        }}
      />
    </div>
  )
}
