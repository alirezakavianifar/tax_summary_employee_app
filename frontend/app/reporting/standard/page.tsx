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
  Calendar,
  Clock,
  CheckCircle2,
  Plus,
  BookmarkCheck,
  X,
  Check,
  AlertTriangle,
  FolderKanban,
} from 'lucide-react'
import { reportCategoriesApi, ReportCategoryItem } from '@/lib/api/reportCategories'
import { ExcelReportUploadModal } from '@/components/reporting/ExcelReportUploadModal'
import { ReportTweakDrawer } from '@/components/reporting/ReportTweakDrawer'
import { DeleteReportModal } from '@/components/reporting/DeleteReportModal'
import { toPersianDigits, formatIsoToJalali } from '@/lib/jalali'
import { useAuth } from '@/contexts/AuthContext'
import { useMenuSettings } from '@/contexts/MenuSettingsContext'
import { menuSettingsApi } from '@/lib/api/menuSettings'

function isExpiringSoon(expiresAt?: string | null): boolean {
  if (!expiresAt) return false
  const diffMs = new Date(expiresAt).getTime() - Date.now()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays > 0 && diffDays <= 3
}

function formatRemainingTtl(expiresAt?: string | null): string {
  if (!expiresAt) return ''
  const diffMs = new Date(expiresAt).getTime() - Date.now()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return 'منقضی شده'
  if (diffDays === 1) return 'امروز پایان مهلت'
  return `${toPersianDigits(diffDays)} روز تا بایگانی`
}

export default function StandardReportsCatalogPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'Admin'

  const [reports, setReports] = useState<ReportDefinition[]>([])
  const [categories, setCategories] = useState<ReportCategoryItem[]>([])
  const [selectedSource, setSelectedSource] = useState<number | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest')
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Modals & Drawers
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [tweakReportCode, setTweakReportCode] = useState<string | null>(null)
  const [deleteTargetReport, setDeleteTargetReport] = useState<ReportDefinition | null>(null)

  // Menu Settings Integration for Report Assignment
  const { settings, refreshSettings, isActionVisible } = useMenuSettings()
  const canCreateReport = isActionVisible('action_reporting_create_custom_dataset', 'module_reporting')
  const canEditReport = isActionVisible('action_reporting_edit_custom_dataset', 'module_reporting')
  const canDeleteReport = isActionVisible('action_reporting_delete_custom_dataset', 'module_reporting')
  const [pinTargetReport, setPinTargetReport] = useState<ReportDefinition | null>(null)
  const [pinTitle, setPinTitle] = useState('')
  const [pinSubmitting, setPinSubmitting] = useState(false)
  const [pinFeedback, setPinFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const isReportInMenu = (code: string) => {
    const norm = code.toLowerCase()
    return settings.some(
      (s) =>
        (s.reportCode && s.reportCode.toLowerCase() === norm) ||
        (s.route && s.route.toLowerCase().replace(/\/+$/, '') === `/reporting/standard/${norm}`)
    )
  }

  const handleOpenPinModal = (r: ReportDefinition) => {
    setPinTargetReport(r)
    setPinTitle(r.title)
    setPinFeedback(null)
  }

  const handleConfirmPin = async () => {
    if (!pinTargetReport) return
    const trimmed = pinTitle.trim()
    if (!trimmed) return
    try {
      setPinSubmitting(true)
      await menuSettingsApi.createMenuSetting({
        parentKey: 'module_reporting',
        title: trimmed,
        route: `/reporting/standard/${pinTargetReport.code}`,
        reportCode: pinTargetReport.code,
        iconName: 'FileSpreadsheet',
        description: pinTargetReport.description || null,
        isVisible: true,
        adminOnly: false,
      })
      await refreshSettings()
      setPinFeedback({
        type: 'success',
        message: `گزارش «${trimmed}» با موفقیت به منوی گزارش‌ها افزوده شد.`,
      })
      setTimeout(() => {
        setPinTargetReport(null)
        setPinFeedback(null)
      }, 1500)
    } catch (err: any) {
      setPinFeedback({
        type: 'error',
        message: err?.response?.data?.error || 'خطا در افزودن گزارش به منو',
      })
    } finally {
      setPinSubmitting(false)
    }
  }

  const loadCatalog = async () => {
    try {
      setIsLoading(true)
      const isArchivedTab = selectedSource === -1
      const querySource = isArchivedTab ? undefined : selectedSource
      // Admins load all including inactive to allow archiving management
      const [data, cats] = await Promise.all([
        reportingApi.getCatalog(querySource, isAdmin),
        reportCategoriesApi.getActive().catch(() => [] as ReportCategoryItem[]),
      ])
      setReports(data)
      setCategories(cats || [])
    } catch (err) {
      console.error('Failed to load standard catalog:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCatalog()
  }, [selectedSource, isAdmin])

  useEffect(() => {
    if (typeof window !== 'undefined' && canCreateReport) {
      const params = new URLSearchParams(window.location.search)
      if (params.get('modal') === 'upload') {
        setIsUploadModalOpen(true)
      }
    }
  }, [canCreateReport])

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

  const sortedReports = [...filteredReports].sort((a, b) => {
    if (sortBy === 'newest') {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateB - dateA
    }
    if (sortBy === 'oldest') {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateA - dateB
    }
    return a.title.localeCompare(b.title, 'fa')
  })

  const categoriesMap = React.useMemo(() => {
    return Object.fromEntries(categories.map((c) => [c.id, c]))
  }, [categories])

  const sourceTabs = React.useMemo(() => {
    const tabs: { label: string; source: number | undefined }[] = [
      { label: 'تمام حوزه‌ها', source: undefined },
    ]

    const sortedCats = [...categories].sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id)
    sortedCats.forEach((cat) => {
      tabs.push({ label: cat.title, source: cat.id })
    })

    if (isAdmin) {
      tabs.push({
        label: `بایگانی / غیرفعال (${toPersianDigits(inactiveCount)})`,
        source: -1,
      })
    }

    return tabs
  }, [categories, isAdmin, inactiveCount])

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
          {canCreateReport && (
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:from-emerald-700 hover:to-teal-700 transition-all cursor-pointer"
            >
              <UploadCloud className="h-4 w-4" />
              <span>ایجاد گزارش جدید از اکسل</span>
            </button>
          )}

          {isAdmin && (
            <Link
              href="/admin/report-categories"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              title="مدیریت و ویرایش حوزه‌ها و دسته‌بندی‌های کاتالوگ گزارش‌ها"
            >
              <FolderKanban className="w-4 h-4 text-amber-600" />
              <span>مدیریت دسته‌بندی‌ها</span>
            </Link>
          )}

          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600 shadow-2xs">
            <span className="font-bold text-[11px] text-slate-500">مرتب‌سازی:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'title')}
              aria-label="مرتب‌سازی گزارش‌ها"
              className="bg-transparent font-bold text-slate-700 text-xs focus:outline-hidden cursor-pointer"
            >
              <option value="newest">جدیدترین (تاریخ ایجاد)</option>
              <option value="oldest">قدیمی‌ترین</option>
              <option value="title">عنوان (الفبا)</option>
            </select>
          </div>

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
      ) : sortedReports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
          گزارشی منطبق با جستجو یافت نشد
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedReports.map((report) => {
            const domainName = categoriesMap[report.domainSource]?.title || DOMAIN_SOURCE_NAMES_FA[report.domainSource] || 'سازمانی'
            const categoryName = CATEGORY_NAMES_FA[report.category] || 'تحلیلی'
            const isCustom = report.domainSource === 6 || report.code.startsWith('REP_CUSTOM_')
            const isInactive = !report.isActive

            return (
              <div
                key={report.code}
                className={`min-w-0 group relative rounded-2xl p-5 border shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between ${
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

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isInactive && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            report.isExpired
                              ? 'bg-rose-50 text-rose-700 border-rose-300'
                              : 'bg-slate-200 text-slate-700 border-slate-300'
                          }`}
                        >
                          {report.isExpired ? 'بایگانی (انقضای مهلت)' : 'بایگانی شده'}
                        </span>
                      )}

                      {!isInactive && report.expiresAt && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                            isExpiringSoon(report.expiresAt)
                              ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                          title={`مهلت اعتبار گزارش تا: ${formatIsoToJalali(report.expiresAt, true)}`}
                        >
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>{formatRemainingTtl(report.expiresAt)}</span>
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
                <div className="pt-3 border-t border-slate-100 flex flex-col gap-3 mt-auto">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-slate-400">
                    {report.createdAt && (
                      <span
                        className="flex items-center gap-1 text-slate-600 font-medium whitespace-nowrap"
                        title={`تاریخ ایجاد گزارش: ${formatIsoToJalali(report.createdAt, true)}`}
                      >
                        <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{formatIsoToJalali(report.createdAt, true)}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <Columns className="w-3.5 h-3.5 shrink-0" />
                      {toPersianDigits(report.columns?.length || 0)} ستون
                    </span>
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <Layers className="w-3.5 h-3.5 shrink-0" />
                      {categoryName}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Custom Report Actions: Direct Delete & Tweak */}
                    {isCustom ? (
                      <>
                        {canDeleteReport && (
                          <button
                            type="button"
                            onClick={() => setDeleteTargetReport(report)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-600 hover:text-white transition-all shadow-2xs whitespace-nowrap shrink-0"
                            title="حذف گزارش و پاک‌سازی جدول داده"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </button>
                        )}

                        {canEditReport && (
                          <button
                            type="button"
                            onClick={() => setTweakReportCode(report.code)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-600 hover:text-white transition-all shadow-2xs whitespace-nowrap shrink-0"
                            title="ویرایش و سفارشی‌سازی ستون‌ها"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span>ویرایش</span>
                          </button>
                        )}
                      </>
                    ) : (
                      /* Standard Report Administrative Action: Archive / Reactivate */
                      isAdmin && (
                        <button
                          type="button"
                          onClick={() => setDeleteTargetReport(report)}
                          className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-2xs whitespace-nowrap shrink-0 ${
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

                    {/* Admin Add to Menu action */}
                    {isAdmin && (
                      isReportInMenu(report.code) ? (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 shadow-2xs whitespace-nowrap shrink-0"
                          title="این گزارش در حال حاضر در منوی گزارش‌ها موجود است"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="hidden sm:inline">در منو</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenPinModal(report)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-600 hover:text-white transition-all shadow-2xs whitespace-nowrap shrink-0"
                          title="افزودن و تخصیص مستقیم این گزارش به منوی سامانه گزارش‌ها"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>افزودن به منو</span>
                        </button>
                      )
                    )}

                    <Link
                      href={`/reporting/standard/${report.code}`}
                      className="ms-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-xs whitespace-nowrap shrink-0"
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
        isOpen={isUploadModalOpen && canCreateReport}
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

      {/* Quick Add to Menu Dialog */}
      {pinTargetReport && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">افزودن گزارش به منوی ناوبری</h3>
                  <span className="text-[10px] text-gray-400 font-mono">{pinTargetReport.code}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPinTargetReport(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {pinFeedback && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  pinFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {pinFeedback.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{pinFeedback.message}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  عنوان نمایشی در منوی گزارش‌ها *
                </label>
                <input
                  type="text"
                  value={pinTitle}
                  onChange={(e) => setPinTitle(e.target.value)}
                  placeholder="عنوان گزارش در منو..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">سامانه والد:</span>
                  <span className="font-bold text-slate-800">هوش تجاری و نظارت (module_reporting)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">مسیر مقصد:</span>
                  <span className="font-mono text-slate-700" dir="ltr">/reporting/standard/{pinTargetReport.code}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setPinTargetReport(null)}
                className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={pinSubmitting || !pinTitle.trim()}
                onClick={handleConfirmPin}
                className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors shadow flex items-center gap-1.5 disabled:opacity-50"
              >
                {pinSubmitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>تایید و افزودن به منو</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
