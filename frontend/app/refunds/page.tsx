'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Scale,
  PlusCircle,
  Search,
  Filter,
  FileSpreadsheet,
  Download,
  Printer,
  ChevronLeft,
  Calendar,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
  Trash2,
  TrendingDown,
  Building,
  CheckCircle2,
  Pencil,
} from 'lucide-react'
import { taxRefundApi } from '@/lib/api/taxRefund'
import {
  TaxRefundCaseSummary,
  TaxSourceType,
  TaxSourceLabels,
  RefundCaseStatus,
  RefundCaseStatusLabels,
} from '@/types/taxRefund'
import ExcelImportModal from '@/components/refunds/ExcelImportModal'
import { QuickEditCaseModal } from '@/components/refunds/QuickEditCaseModal'
import ProtectedRoute from '@/components/ProtectedRoute'
import { KNOWN_OFFICES, decomposeTaxUnitCode } from '@/lib/taxHierarchy'

export default function RefundsDashboardPage() {
  const [cases, setCases] = useState<TaxRefundCaseSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [editingCase, setEditingCase] = useState<TaxRefundCaseSummary | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined)
  const [selectedSource, setSelectedSource] = useState<TaxSourceType | undefined>(undefined)
  const [selectedStatus, setSelectedStatus] = useState<RefundCaseStatus | undefined>(undefined)
  const [selectedOfficeCode, setSelectedOfficeCode] = useState<string | undefined>(undefined)

  const fetchCases = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await taxRefundApi.getCases({
        searchTerm: searchTerm.trim() || undefined,
        taxYear: selectedYear,
        taxSource: selectedSource,
        status: selectedStatus,
        officeCode: selectedOfficeCode,
      })
      setCases(data)
    } catch (err: any) {
      setError(err.message || 'خطا در دریافت پرونده‌های استرداد')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCases()
  }, [selectedYear, selectedSource, selectedStatus, selectedOfficeCode])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchCases()
  }

  const [deletingCase, setDeletingCase] = useState<{ id: string; name: string; trackingNumber: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleConfirmDelete = async () => {
    if (!deletingCase) return

    try {
      setIsDeleting(true)
      setError(null)
      await taxRefundApi.deleteCase(deletingCase.id)
      setCases((prev) => prev.filter((c) => c.id !== deletingCase.id))
      setSuccessMessage(`پرونده استرداد «${deletingCase.name}» (${deletingCase.trackingNumber}) با موفقیت حذف گردید.`)
      setDeletingCase(null)
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err: any) {
      setError(err.message || 'خطا در حذف پرونده')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatNumber = (num?: number | null) => {
    if (num === undefined || num === null || isNaN(num)) return '۰'
    return new Intl.NumberFormat('fa-IR').format(Math.round(num))
  }

  // Summary statistics
  const totalCasesCount = cases.length
  const totalRefundAmount = cases.reduce((sum, c) => sum + (c.principalTaxRefund || c.grandTotalRefundable || 0), 0)
  const pendingCount = cases.filter((c) => c.status !== RefundCaseStatus.TreasuryDisbursed && c.status !== RefundCaseStatus.Rejected).length
  const disbursedCount = cases.filter((c) => c.status === RefundCaseStatus.TreasuryDisbursed).length

  return (
    <ProtectedRoute requiredModule="module_tax_refund">
      <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-purple-200 text-xs font-bold mb-3 border border-white/10">
                <Scale className="w-3.5 h-3.5" />
                سازمان امور مالیاتی کشور - استان خوزستان
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                سامانه جامع استرداد مالیات اضافه دریافتی
              </h1>
              <p className="text-sm text-purple-100 mt-2 max-w-2xl leading-relaxed">
                مدیریت هوشمند پرونده‌های استرداد موضوع مواد ۲۴۲ و ۲۴۳ قانون مالیات‌های مستقیم، استعلامات عدم بدهی، تخصیص قبوض پرداختی و صدور فرم‌های ۸گانه استاندارد
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 backdrop-blur-md border border-white/20 transition-all hover:scale-105"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                بارگذاری فایل اکسل (.xlsm)
              </button>

              <Link
                href="/refunds/calculator"
                className="px-4 py-2.5 bg-purple-700/80 hover:bg-purple-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-purple-400/30 transition-all hover:scale-105"
              >
                <Scale className="w-4 h-4 text-purple-200" />
                شبیه‌ساز و محاسبه‌گر برخط
              </Link>

              <Link
                href="/refunds/new"
                className="px-5 py-2.5 bg-white text-purple-900 hover:bg-purple-50 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg transition-all hover:scale-105"
              >
                <PlusCircle className="w-4 h-4 text-purple-700" />
                ثبت پرونده استرداد جدید
              </Link>
            </div>
          </div>
        </div>

        {/* Metric Cards Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-xs text-gray-500 font-bold mb-1">کل پرونده‌های ثبت شده</div>
            <div className="text-2xl font-black text-gray-900">
              {new Intl.NumberFormat('fa-IR').format(totalCasesCount)} <span className="text-xs font-normal text-gray-500">پرونده</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-xs text-purple-600 font-bold mb-1">مجموع مبالغ قابل استرداد</div>
            <div className="text-2xl font-black text-purple-900">
              {formatNumber(totalRefundAmount)} <span className="text-xs font-normal text-purple-700">ریال</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-xs text-amber-600 font-bold mb-1">در جریان رسیدگی و تاییدات</div>
            <div className="text-2xl font-black text-amber-800">
              {new Intl.NumberFormat('fa-IR').format(pendingCount)} <span className="text-xs font-normal text-gray-500">پرونده</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-xs text-emerald-600 font-bold mb-1">استرداد و پرداخت نهایی شده</div>
            <div className="text-2xl font-black text-emerald-800">
              {new Intl.NumberFormat('fa-IR').format(disbursedCount)} <span className="text-xs font-normal text-gray-500">پرونده</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search Term */}
            <div className="lg:col-span-2 relative">
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجو بر اساس نام مودی، کد اقتصادی، شماره پیگیری..."
                className="w-full pr-9 pl-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Office Filter (اداره امور مالیاتی) */}
            <div>
              <select
                value={selectedOfficeCode || ''}
                onChange={(e) => setSelectedOfficeCode(e.target.value ? e.target.value : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="">همه ادارات کل/امور</option>
                {Object.entries(KNOWN_OFFICES).map(([code, name]) => (
                  <option key={code} value={code}>
                    {code} - {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tax Year Filter */}
            <div>
              <select
                value={selectedYear || ''}
                onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="">همه سال‌های مالیاتی</option>
                <option value="1403">سال ۱۴۰۳</option>
                <option value="1402">سال ۱۴۰۲</option>
                <option value="1401">سال ۱۴۰۱</option>
                <option value="1400">سال ۱۴۰۰</option>
                <option value="1399">سال ۱۳۹۹</option>
              </select>
            </div>

            {/* Tax Source Filter */}
            <div>
              <select
                value={selectedSource || ''}
                onChange={(e) => setSelectedSource(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="">همه منابع مالیاتی</option>
                <option value={TaxSourceType.CorporateIncome}>عملکرد اشخاص حقوقی</option>
                <option value={TaxSourceType.PersonalBusiness}>عملکرد مشاغل</option>
                <option value={TaxSourceType.SalaryPayroll}>مالیات حقوق</option>
                <option value={TaxSourceType.ValueAddedTax}>ارزش افزوده</option>
                <option value={TaxSourceType.PropertyRental}>درآمد املاک</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus !== undefined ? selectedStatus : ''}
                onChange={(e) => setSelectedStatus(e.target.value !== '' ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="">همه وضعیت‌ها</option>
                <option value={RefundCaseStatus.Draft}>پیش‌نویس</option>
                <option value={RefundCaseStatus.Audited}>رسیدگی شده</option>
                <option value={RefundCaseStatus.GroupHeadApproved}>تایید رئیس گروه</option>
                <option value={RefundCaseStatus.AdministrationHeadApproved}>تایید نهایی رئیس امور</option>
                <option value={RefundCaseStatus.TreasuryDisbursed}>پرداخت شده در ذیحسابی</option>
              </select>
            </div>
          </form>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-4 text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs px-2 py-1 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              بستن
            </button>
          </div>
        )}

        {/* Cases Data Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-purple-700" />
              فهرست پرونده‌های استرداد
            </h3>
            <button
              onClick={fetchCases}
              disabled={loading}
              className="p-1.5 text-gray-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
              title="بارگذاری مجدد"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-700' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <span className="text-xs font-bold">در حال بارگذاری پرونده‌ها...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600 flex flex-col items-center gap-2">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <span className="text-xs font-bold">{error}</span>
            </div>
          ) : cases.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Scale className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-bold text-gray-700">هیچ پرونده استردادی یافت نشد</p>
              <p className="text-xs text-gray-500 mt-1">
                می‌توانید پرونده جدید ثبت کنید یا فایل اکسل تکمیل‌شده را بارگذاری نمایید.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">شماره پیگیری</th>
                    <th className="py-3 px-4">نام مودی</th>
                    <th className="py-3 px-4">کد اقتصادی</th>
                    <th className="py-3 px-4">حوزه مالیاتی</th>
                    <th className="py-3 px-4">سال مالیاتی</th>
                    <th className="py-3 px-4">منبع مالیات</th>
                    <th className="py-3 px-4 text-center">تعداد قبوض</th>
                    <th className="py-3 px-4">مبلغ قابل استرداد (ریال)</th>
                    <th className="py-3 px-4">وضعیت</th>
                    <th className="py-3 px-4 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cases.map((c) => {
                    const statusBadge = RefundCaseStatusLabels[c.status] || {
                      text: c.statusName || c.statusDescription || 'نامشخص',
                      color: 'bg-gray-100 text-gray-700 border-gray-300',
                    }

                    const sourceLabel = c.taxSourceName || c.taxSourceDescription || (c.taxSource ? TaxSourceLabels[c.taxSource] : '') || '-'
                    const refundAmount = c.principalTaxRefund ?? c.grandTotalRefundable ?? 0
                    const count = c.receiptsCount ?? 0
                    const hierarchy = decomposeTaxUnitCode(c.taxUnitCode)

                    return (
                      <tr key={c.id} className="hover:bg-purple-50/20 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-purple-900">
                          <Link href={`/refunds/${c.id}`} className="hover:underline">
                            {c.caseTrackingNumber}
                          </Link>
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-900">{c.taxpayerName}</td>
                        <td className="py-3 px-4 font-mono text-gray-700">{c.economicCode}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-gray-900 text-[11px] line-clamp-1">{c.officeName || hierarchy.officeName}</span>
                            <span className="font-mono text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded w-fit">
                              {c.officeCode || hierarchy.officeCode} {hierarchy.taxUnitCode ? `• واحد ${hierarchy.taxUnitCode}` : ''}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-700">{c.taxYear}</td>
                        <td className="py-3 px-4 text-gray-700">{sourceLabel}</td>
                        <td className="py-3 px-4 text-center font-bold text-gray-800">
                          {new Intl.NumberFormat('fa-IR').format(count)}
                        </td>
                        <td className="py-3 px-4 font-black text-purple-900">
                          {formatNumber(refundAmount)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusBadge.color}`}>
                            {statusBadge.text}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <Link
                              href={`/refunds/${c.id}`}
                              className="p-1.5 text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                              title="مشاهده جزئیات و تاییدات"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>

                            <button
                              onClick={() => setEditingCase(c)}
                              className="p-1.5 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="ویرایش مشخصات پرونده"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            <button
                              onClick={async () => {
                                try {
                                  const blob = await taxRefundApi.exportExcel(c.id)
                                  const url = window.URL.createObjectURL(blob)
                                  const a = document.createElement('a')
                                  a.href = url
                                  a.download = `tax_refund_${c.caseTrackingNumber}.xlsx`
                                  a.click()
                                } catch (e: any) {
                                  alert(e.message || 'خطا در دانلود فایل اکسل')
                                }
                              }}
                              className="p-1.5 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="دانلود اکسل ۹ برگه‌ای"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            {(c.status === RefundCaseStatus.Draft || c.status === RefundCaseStatus.Rejected) && (
                              <button
                                onClick={() =>
                                  setDeletingCase({
                                    id: c.id,
                                    name: c.taxpayerName,
                                    trackingNumber: c.caseTrackingNumber,
                                  })
                                }
                                disabled={isDeleting && deletingCase?.id === c.id}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="حذف پرونده"
                              >
                                {isDeleting && deletingCase?.id === c.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </div>
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

      {/* Delete Confirmation Modal */}
      {deletingCase && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          dir="rtl"
        >
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-gray-100 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-black text-gray-900">
                حذف پرونده استرداد
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                آیا از حذف پرونده استرداد متعلق به{' '}
                <strong className="text-purple-950 font-bold">«{deletingCase.name}»</strong>{' '}
                با شماره پیگیری{' '}
                <strong className="text-purple-900 font-bold font-mono">
                  {deletingCase.trackingNumber}
                </strong>{' '}
                اطمینان دارید؟
              </p>

              <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-2xl text-[11px] text-rose-900 text-right mt-2 leading-relaxed">
                ⚠️ <strong>توجه مهم:</strong> با حذف این پرونده، تمامی قبوض پرداختی، استعلامات و اسناد پیوست مرتبط با آن به صورت کامل از پایگاه داده حذف خواهند شد و این عملیات قابل بازگشت نیست.
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>در حال حذف پرونده...</span>
                  </>
                ) : (
                  <span>حذف قطعی پرونده</span>
                )}
              </button>

              <button
                onClick={() => setDeletingCase(null)}
                disabled={isDeleting}
                className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          setIsImportModalOpen(false)
          fetchCases()
        }}
      />

      {/* Quick Edit Case Modal */}
      {editingCase && (
        <QuickEditCaseModal
          caseItem={editingCase}
          isOpen={!!editingCase}
          onClose={() => setEditingCase(null)}
          onSaved={() => {
            setEditingCase(null)
            fetchCases()
          }}
        />
      )}
    </div>
    </ProtectedRoute>
  )
}
