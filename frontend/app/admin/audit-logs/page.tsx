'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { auditLogsApi, AuditLogItem, AuditLogsResponse } from '@/lib/api/auditLogs'
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Eye,
  PlusCircle,
  Edit3,
  Trash2,
  Calendar,
  User as UserIcon,
  Globe,
  Layers,
  ChevronLeft,
  ChevronRight,
  X,
  FileCode,
  ShieldAlert,
  ArrowRightLeft,
  CheckCircle2,
  Lock,
} from 'lucide-react'

// Entity Name translation to Persian
const ENTITY_TRANSLATIONS: Record<string, { label: string; color: string }> = {
  User: { label: 'کاربر سیستم', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  Employee: { label: 'شناسنامه پرسنلی', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  EmployeeReport: { label: 'فرم ارزیابی', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  TaxRefundCase: { label: 'پرونده استرداد', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  TaxRefundPayment: { label: 'قبض استرداد', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  PayrollCycle: { label: 'دوره حقوق و اضافه کار', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  MenuSetting: { label: 'تنظیمات منو', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
}

function getEntityDisplay(entityName: string) {
  return ENTITY_TRANSLATIONS[entityName] || {
    label: entityName,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
  }
}

// Action badge config
function getActionBadge(action: string) {
  switch (action?.toLowerCase()) {
    case 'created':
      return {
        label: 'ایجاد جدید',
        icon: PlusCircle,
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      }
    case 'modified':
      return {
        label: 'ویرایش و تغییر',
        icon: Edit3,
        className: 'bg-amber-50 text-amber-700 border-amber-200',
      }
    case 'deleted':
      return {
        label: 'حذف',
        icon: Trash2,
        className: 'bg-rose-50 text-rose-700 border-rose-200',
      }
    default:
      return {
        label: action || 'نامشخص',
        icon: History,
        className: 'bg-gray-50 text-gray-700 border-gray-200',
      }
  }
}

// Persian date formatter
function formatPersianDateTime(isoString: string): string {
  try {
    const d = new Date(isoString)
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(d)
  } catch {
    return isoString
  }
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [selectedEntity, setSelectedEntity] = useState<string>('')
  const [selectedAction, setSelectedAction] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [activeSearch, setActiveSearch] = useState<string>('')

  // Detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null)
  const [showJsonRaw, setShowJsonRaw] = useState(false)

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data: AuditLogsResponse = await auditLogsApi.getLogs({
        page,
        pageSize,
        entityName: selectedEntity || undefined,
        action: selectedAction || undefined,
        username: activeSearch || undefined,
      })
      setLogs(data.items || [])
      setTotalCount(data.totalCount || 0)
      setTotalPages(data.totalPages || 1)
    } catch (err: any) {
      console.error('Failed to load audit logs:', err)
      setError(err?.message || 'خطا در دریافت لاگ‌های امنیتی از سرور')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, selectedEntity, selectedAction, activeSearch])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setActiveSearch(searchQuery.trim())
  }

  const handleResetFilters = () => {
    setSelectedEntity('')
    setSelectedAction('')
    setSearchQuery('')
    setActiveSearch('')
    setPage(1)
  }

  // Parse JSON values for diff modal
  const parsedOldValues = useMemo(() => {
    if (!selectedLog?.oldValues) return null
    try {
      return JSON.parse(selectedLog.oldValues)
    } catch {
      return null
    }
  }, [selectedLog])

  const parsedNewValues = useMemo(() => {
    if (!selectedLog?.newValues) return null
    try {
      return JSON.parse(selectedLog.newValues)
    } catch {
      return null
    }
  }, [selectedLog])

  // Combine keys for diff table
  const diffKeys = useMemo(() => {
    const keys = new Set<string>()
    if (parsedOldValues && typeof parsedOldValues === 'object') {
      Object.keys(parsedOldValues).forEach((k) => keys.add(k))
    }
    if (parsedNewValues && typeof parsedNewValues === 'object') {
      Object.keys(parsedNewValues).forEach((k) => keys.add(k))
    }
    return Array.from(keys).sort()
  }, [parsedOldValues, parsedNewValues])

  return (
    <ProtectedRoute allowedRoles={['Admin']}>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Banner */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-black text-gray-900">
                    لاگ‌ها و رویدادهای امنیتی سامانه
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                    مخصوص راهبران
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  پایش جامع و بلادرنگ کلیه رویدادهای ایجاد، ویرایش و حذف اطلاعات حساس همراه با آدرس IP و شناسه کاربر
                </p>
              </div>
            </div>

            <div className="relative z-10 flex items-center gap-3">
              <button
                onClick={fetchLogs}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
                <span>بروزرسانی داده‌ها</span>
              </button>
            </div>
          </div>

          {/* Statistics summary bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <History className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-gray-400 font-medium block">کل رویدادهای ثبت‌شده</span>
                <span className="text-lg font-black text-gray-900">{totalCount.toLocaleString('fa-IR')}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-gray-400 font-medium block">رویدادهای ایجاد</span>
                <span className="text-lg font-black text-emerald-700">
                  {logs.filter((l) => l.action === 'Created').length.toLocaleString('fa-IR')} در صفحه
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-gray-400 font-medium block">رویدادهای ویرایش</span>
                <span className="text-lg font-black text-amber-700">
                  {logs.filter((l) => l.action === 'Modified').length.toLocaleString('fa-IR')} در صفحه
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-gray-400 font-medium block">رویدادهای حذف</span>
                <span className="text-lg font-black text-rose-700">
                  {logs.filter((l) => l.action === 'Deleted').length.toLocaleString('fa-IR')} در صفحه
                </span>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              {/* Search User */}
              <div className="sm:col-span-4">
                <label className="text-xs font-bold text-gray-700 block mb-1.5">
                  جستجوی نام کاربری
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="مثال: admin یا kamrava..."
                    className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-gray-800 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Entity Selector */}
              <div className="sm:col-span-3">
                <label className="text-xs font-bold text-gray-700 block mb-1.5">موجودیت (بخش)</label>
                <select
                  value={selectedEntity}
                  onChange={(e) => {
                    setSelectedEntity(e.target.value)
                    setPage(1)
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-gray-800 bg-white"
                >
                  <option value="">همه موجودیت‌ها</option>
                  <option value="User">کاربران (User)</option>
                  <option value="Employee">شناسنامه پرسنلی (Employee)</option>
                  <option value="EmployeeReport">فرم ارزیابی (EmployeeReport)</option>
                  <option value="TaxRefundCase">پرونده استرداد (TaxRefundCase)</option>
                  <option value="TaxRefundPayment">قبض پرداختی (TaxRefundPayment)</option>
                  <option value="PayrollCycle">دوره حقوق (PayrollCycle)</option>
                  <option value="MenuSetting">تنظیمات منو (MenuSetting)</option>
                </select>
              </div>

              {/* Action Selector */}
              <div className="sm:col-span-3">
                <label className="text-xs font-bold text-gray-700 block mb-1.5">نوع عملیات</label>
                <select
                  value={selectedAction}
                  onChange={(e) => {
                    setSelectedAction(e.target.value)
                    setPage(1)
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-gray-800 bg-white"
                >
                  <option value="">همه عملیات‌ها</option>
                  <option value="Created">ایجاد (Created)</option>
                  <option value="Modified">ویرایش (Modified)</option>
                  <option value="Deleted">حذف (Deleted)</option>
                </select>
              </div>

              {/* Actions */}
              <div className="sm:col-span-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  اعمال فیلتر
                </button>
                {(selectedEntity || selectedAction || activeSearch) && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                    title="پاک‌سازی فیلترها"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Error display */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-bold">
              <ShieldAlert className="w-5 h-5 text-rose-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Logs Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-bold">
                    <th className="py-3.5 px-4">زمان رخداد</th>
                    <th className="py-3.5 px-4">کاربر اقدام‌کننده</th>
                    <th className="py-3.5 px-4">عملیات</th>
                    <th className="py-3.5 px-4">موجودیت هدف</th>
                    <th className="py-3.5 px-4">آدرس IP و کلاینت</th>
                    <th className="py-3.5 px-4 text-center">جزئیات و تغییرات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading && logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-gray-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-600 mb-2" />
                        در حال دریافت لاگ‌های امنیتی...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-gray-400">
                        هیچ رویدادی با مشخصات فیلتر شده یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => {
                      const actionBadge = getActionBadge(log.action)
                      const ActionIcon = actionBadge.icon
                      const entityMeta = getEntityDisplay(log.entityName)

                      return (
                        <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                          {/* Timestamp */}
                          <td className="py-3 px-4 font-mono text-gray-700 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              <span className="font-semibold">{formatPersianDateTime(log.timestamp)}</span>
                            </div>
                          </td>

                          {/* User */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-[11px]">
                                {log.username?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <div>
                                <span className="font-bold text-gray-900 block leading-tight">
                                  {log.username || 'سیستم / ناشناس'}
                                </span>
                                {log.userId && (
                                  <span className="text-[10px] text-gray-400 font-mono">
                                    {log.userId.slice(0, 8)}...
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Action */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${actionBadge.className}`}
                            >
                              <ActionIcon className="w-3 h-3" />
                              {actionBadge.label}
                            </span>
                          </td>

                          {/* Entity */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-bold w-max ${entityMeta.color}`}
                              >
                                {entityMeta.label}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono">
                                شناسه: {log.entityId?.slice(0, 8)}...
                              </span>
                            </div>
                          </td>

                          {/* IP Address & User Agent */}
                          <td className="py-3 px-4 whitespace-nowrap font-mono text-gray-500">
                            <div className="flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5 text-gray-400" />
                              <span>{log.ipAddress || 'نامشخص'}</span>
                            </div>
                          </td>

                          {/* View Detail Action */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSelectedLog(log)
                                setShowJsonRaw(false)
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>جزئیات تغییرات</span>
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span>نمایش صفحه</span>
                <span className="font-bold text-gray-900">{page.toLocaleString('fa-IR')}</span>
                <span>از</span>
                <span className="font-bold text-gray-900">{totalPages.toLocaleString('fa-IR')}</span>
                <span className="text-gray-400">({totalCount.toLocaleString('fa-IR')} رویداد)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors font-bold"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>صفحه قبل</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                          page === pageNum
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum.toLocaleString('fa-IR')}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors font-bold"
                >
                  <span>صفحه بعد</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Log Detail & Diff Modal */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-right">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-gray-900">
                      جزئیات رویداد امنیتی #{selectedLog.id.slice(0, 8)}
                    </h2>
                    <span className="text-xs text-gray-500 font-mono">
                      {formatPersianDateTime(selectedLog.timestamp)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-2 rounded-xl text-gray-400 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                {/* Meta details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div>
                    <span className="text-gray-400 block font-medium">کاربر اقدام‌کننده:</span>
                    <span className="font-bold text-gray-900">{selectedLog.username || 'سیستم'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">نوع عملیات:</span>
                    <span className="font-bold text-gray-900">{selectedLog.action}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">موجودیت:</span>
                    <span className="font-bold text-gray-900">{selectedLog.entityName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">آدرس IP:</span>
                    <span className="font-mono text-gray-900">{selectedLog.ipAddress || '—'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400 block font-medium">شناسه رکورد (Entity ID):</span>
                    <span className="font-mono text-gray-800 text-[11px] break-all">
                      {selectedLog.entityId}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400 block font-medium">کلاینت / مرورگر:</span>
                    <span className="font-mono text-gray-600 text-[10px] truncate block" title={selectedLog.userAgent || ''}>
                      {selectedLog.userAgent || '—'}
                    </span>
                  </div>
                </div>

                {/* Diff Viewer vs Raw JSON */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <ArrowRightLeft className="w-4 h-4 text-purple-600" />
                      <span>مقایسه مقادیر قبل و بعد از تغییر</span>
                    </h3>

                    <button
                      onClick={() => setShowJsonRaw(!showJsonRaw)}
                      className="text-[11px] font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>{showJsonRaw ? 'نمایش جدول مقایسه' : 'نمایش کد خام JSON'}</span>
                    </button>
                  </div>

                  {showJsonRaw ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px]">
                      <div className="bg-gray-900 text-rose-300 p-3 rounded-2xl overflow-x-auto">
                        <span className="text-[10px] text-gray-400 block mb-1">Old Values:</span>
                        <pre>{selectedLog.oldValues || 'null'}</pre>
                      </div>
                      <div className="bg-gray-900 text-emerald-300 p-3 rounded-2xl overflow-x-auto">
                        <span className="text-[10px] text-gray-400 block mb-1">New Values:</span>
                        <pre>{selectedLog.newValues || 'null'}</pre>
                      </div>
                    </div>
                  ) : diffKeys.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-xs border border-dashed border-gray-200 rounded-2xl">
                      تغییرات فیلد خاصی ثبت نشده است.
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
                            <th className="py-2.5 px-3">نام فیلد / ویژگی</th>
                            <th className="py-2.5 px-3">مقدار قبلی (Old Value)</th>
                            <th className="py-2.5 px-3">مقدار جدید (New Value)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                          {diffKeys.map((key) => {
                            const oldVal = parsedOldValues?.[key]
                            const newVal = parsedNewValues?.[key]
                            const isChanged = JSON.stringify(oldVal) !== JSON.stringify(newVal)
                            const isRedacted =
                              String(oldVal) === '[REDACTED]' || String(newVal) === '[REDACTED]'

                            return (
                              <tr
                                key={key}
                                className={isChanged ? 'bg-purple-50/30' : 'hover:bg-gray-50'}
                              >
                                <td className="py-2 px-3 font-sans font-bold text-gray-800">
                                  <div className="flex items-center gap-1.5">
                                    {isRedacted && (
                                      <Lock className="w-3 h-3 text-amber-500" title="فیلد محرمانه پنهان‌سازی شده" />
                                    )}
                                    <span>{key}</span>
                                  </div>
                                </td>
                                <td className="py-2 px-3 text-rose-700 bg-rose-50/40">
                                  {oldVal !== undefined ? (
                                    isRedacted ? (
                                      <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                                        [محرمانه / REDACTED]
                                      </span>
                                    ) : typeof oldVal === 'object' ? (
                                      JSON.stringify(oldVal)
                                    ) : (
                                      String(oldVal)
                                    )
                                  ) : (
                                    <span className="text-gray-400 italic">تعریف نشده</span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-emerald-700 bg-emerald-50/40 font-bold">
                                  {newVal !== undefined ? (
                                    isRedacted ? (
                                      <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                                        [محرمانه / REDACTED]
                                      </span>
                                    ) : typeof newVal === 'object' ? (
                                      JSON.stringify(newVal)
                                    ) : (
                                      String(newVal)
                                    )
                                  ) : (
                                    <span className="text-gray-400 italic">تعریف نشده</span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
