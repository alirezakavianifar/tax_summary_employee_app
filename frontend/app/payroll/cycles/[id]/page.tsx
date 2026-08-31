'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import {
  payrollCyclesApi,
  CYCLE_STATUS_LABELS,
  DEPT_STATUS_LABELS,
  type PayrollCycleDetailDto,
  type PayrollDepartmentEntrySummaryDto,
} from '@/lib/api/payrollCycles'
import { PROCESS_TYPE_LABELS } from '@/lib/api/payroll'
import {
  Calendar,
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Lock,
  ArrowRight,
  Loader2,
  ExternalLink,
  DollarSign,
  FileSpreadsheet,
} from 'lucide-react'

function formatNumber(v: number | null | undefined): string {
  if (v == null) return '—'
  return v.toLocaleString('fa-IR')
}

export default function CycleDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const cycleId = params.id as string

  const [cycle, setCycle] = useState<PayrollCycleDetailDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [finalizing, setFinalizing] = useState(false)

  // Rejection modal state
  const [rejectingDept, setRejectingDept] = useState<PayrollDepartmentEntrySummaryDto | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  const loadCycle = async () => {
    setLoading(true)
    try {
      const data = await payrollCyclesApi.getCycleById(cycleId)
      setCycle(data)
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'خطا در دریافت اطلاعات دوره محاسبه')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (cycleId) {
      loadCycle()
    }
  }, [cycleId])

  const handleExportMasterExcel = async () => {
    setExporting(true)
    try {
      const blob = await payrollCyclesApi.exportMasterExcel(cycleId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payroll_master_${cycle?.title || 'cycle'}_${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      alert('خطا در دریافت فایل اکسل تجمیعی: ' + (err.message || ''))
    } finally {
      setExporting(false)
    }
  }

  const handleFinalizeCycle = async () => {
    if (!confirm('آیا از نهایی‌سازی و قفل این دوره محاسبه اطمینان دارید؟ پس از نهایی‌سازی امکان ویرایش توسط ادارات وجود نخواهد داشت.')) return

    setFinalizing(true)
    try {
      const updated = await payrollCyclesApi.finalizeCycle(cycleId)
      setCycle(updated)
      alert('دوره محاسبه با موفقیت نهایی و قفل گردید.')
    } catch (err: any) {
      alert(err?.response?.data?.error || 'خطا در نهایی‌سازی دوره')
    } finally {
      setFinalizing(false)
    }
  }

  const handleQuickApprove = async (deptId: string) => {
    if (!confirm('آیا از تایید اطلاعات ارسالی این اداره اطمینان دارید؟')) return

    try {
      await payrollCyclesApi.reviewDepartment(deptId, { approve: true })
      await loadCycle()
    } catch (err: any) {
      alert(err?.response?.data?.error || 'خطا در تایید اداره')
    }
  }

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectingDept) return
    if (!rejectionReason.trim()) {
      alert('لطفاً دلیل عدم تایید را وارد کنید')
      return
    }

    setSubmittingReview(true)
    try {
      await payrollCyclesApi.reviewDepartment(rejectingDept.id, {
        approve: false,
        rejectionReason: rejectionReason.trim(),
      })
      setRejectingDept(null)
      setRejectionReason('')
      await loadCycle()
    } catch (err: any) {
      alert(err?.response?.data?.error || 'خطا در ثبت عدم تایید')
    } finally {
      setSubmittingReview(false)
    }
  }

  const isAdmin = user?.role === 'Admin'

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      </ProtectedRoute>
    )
  }

  if (!cycle) {
    return (
      <ProtectedRoute>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">دوره محاسبه یافت نشد</h2>
          <Link href="/payroll/cycles" className="text-primary-600 hover:underline text-sm">
            بازگشت به فهرست دوره‌ها
          </Link>
        </div>
      </ProtectedRoute>
    )
  }

  const statusInfo = CYCLE_STATUS_LABELS[cycle.status] || {
    label: cycle.status,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
  }

  const totalDepts = cycle.departmentEntries.length
  const submittedDepts = cycle.departmentEntries.filter(
    (d) => d.status === 'Submitted' || d.status === 'Approved'
  ).length
  const approvedDepts = cycle.departmentEntries.filter((d) => d.status === 'Approved').length
  const totalEmployees = cycle.departmentEntries.reduce((sum, d) => sum + d.employeeCount, 0)
  const totalOvertime = cycle.departmentEntries.reduce((sum, d) => sum + d.totalOvertimeAmount, 0)
  const totalWelfare = cycle.departmentEntries.reduce((sum, d) => sum + d.totalWelfareAmount, 0)

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb / Top bar */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/payroll/cycles" className="hover:text-primary-600 flex items-center gap-1">
            <ArrowRight className="w-4 h-4" />
            فهرست دوره‌های محاسبه
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{cycle.title}</span>
        </div>

        {/* Main Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded">
                  {PROCESS_TYPE_LABELS[cycle.processType] || cycle.processType}
                </span>
                <span className={`text-xs font-medium px-3 py-1 rounded-full border ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{cycle.title}</h1>
              <p className="text-sm text-gray-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>دوره مالی: {formatNumber(cycle.fiscalMonth)} / {formatNumber(cycle.fiscalYear)}</span>
                <span>|</span>
                <span>ایجادکننده: {cycle.createdByUsername}</span>
                <span>|</span>
                <span>تاریخ ایجاد: {new Date(cycle.createdAt).toLocaleDateString('fa-IR')}</span>
                {cycle.deadline && (
                  <>
                    <span>|</span>
                    <span className="text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs">
                      مهلت ارسال ادارات: {new Date(cycle.deadline).toLocaleDateString('fa-IR')}
                    </span>
                  </>
                )}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleExportMasterExcel}
                disabled={exporting}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm transition-colors text-sm disabled:opacity-50"
              >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                دانلود اکسل تجمیعی کلیه ادارات
              </button>

              {isAdmin && cycle.status !== 'Finalized' && (
                <button
                  onClick={handleFinalizeCycle}
                  disabled={finalizing}
                  className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm transition-colors text-sm disabled:opacity-50"
                >
                  {finalizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  نهایی‌سازی و قفل دوره
                </button>
              )}
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <span className="text-xs text-gray-500 block mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-primary-600" />
                تعداد ادارات
              </span>
              <span className="text-xl font-bold text-gray-900">{formatNumber(totalDepts)} اداره</span>
              <span className="text-xs text-emerald-600 block mt-1 font-medium">
                {formatNumber(approvedDepts)} تایید شده / {formatNumber(submittedDepts)} ارسال شده
              </span>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <span className="text-xs text-gray-500 block mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-primary-600" />
                تعداد کل کارکنان
              </span>
              <span className="text-xl font-bold text-gray-900">{formatNumber(totalEmployees)} نفر</span>
              <span className="text-xs text-gray-400 block mt-1">در کلیه واحدهای سازمانی</span>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <span className="text-xs text-gray-500 block mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-primary-600" />
                مجموع مبلغ اضافه کار
              </span>
              <span className="text-lg font-bold text-gray-900">{formatNumber(totalOvertime)} ریال</span>
              <span className="text-xs text-gray-400 block mt-1">محاسبه شده طبق ضرایب</span>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <span className="text-xs text-gray-500 block mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-primary-600" />
                مجموع مبلغ رفاهی
              </span>
              <span className="text-lg font-bold text-gray-900">{formatNumber(totalWelfare)} ریال</span>
              <span className="text-xs text-gray-400 block mt-1">محاسبه شده طبق درصدها</span>
            </div>
          </div>
        </div>

        {/* Department Submissions Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary-600" />
                کاربرگ‌ها و وضعیت ارسال ادارات
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                برای بازبینی ریز اقلام یا تایید نهایی، بر روی نام هر اداره یا دکمه بازبینی کلیک کنید.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse text-right">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs font-semibold">
                  <th className="px-6 py-3.5">نام اداره / کاربرگ</th>
                  <th className="px-4 py-3.5">وضعیت</th>
                  <th className="px-4 py-3.5">تعداد نفرات</th>
                  <th className="px-4 py-3.5">سرانه پایه</th>
                  <th className="px-4 py-3.5">جمع اضافه کار (ریال)</th>
                  <th className="px-4 py-3.5">جمع رفاهی (ریال)</th>
                  <th className="px-4 py-3.5">ارسال‌کننده / زمان</th>
                  <th className="px-6 py-3.5 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cycle.departmentEntries.map((dept) => {
                  const deptStatus = DEPT_STATUS_LABELS[dept.status] || {
                    label: dept.status,
                    color: 'bg-gray-100 text-gray-700 border-gray-200',
                    dot: 'bg-gray-400',
                  }

                  return (
                    <tr key={dept.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        <Link
                          href={`/payroll/department/${dept.id}`}
                          className="text-primary-600 hover:text-primary-800 font-semibold flex items-center gap-1.5"
                        >
                          <Building2 className="w-4 h-4 text-gray-400" />
                          {dept.departmentName}
                        </Link>
                        {dept.rejectionReason && (
                          <span className="block text-xs text-red-600 mt-1">
                            علت عدم تایید: {dept.rejectionReason}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${deptStatus.color}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${deptStatus.dot}`} />
                          {deptStatus.label}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-gray-600 font-medium">
                        {formatNumber(dept.employeeCount)} نفر
                      </td>

                      <td className="px-4 py-4 text-gray-600">
                        {dept.baseOvertimeCap ? formatNumber(dept.baseOvertimeCap) : '—'}
                      </td>

                      <td className="px-4 py-4 font-semibold text-gray-900">
                        {formatNumber(dept.totalOvertimeAmount)}
                      </td>

                      <td className="px-4 py-4 font-semibold text-gray-900">
                        {formatNumber(dept.totalWelfareAmount)}
                      </td>

                      <td className="px-4 py-4 text-xs text-gray-500">
                        {dept.submittedByUsername ? (
                          <>
                            <span className="font-medium text-gray-700 block">{dept.submittedByUsername}</span>
                            <span>{dept.submittedAt ? new Date(dept.submittedAt).toLocaleDateString('fa-IR') : ''}</span>
                          </>
                        ) : (
                          <span className="text-gray-400">ارسال نشده</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/payroll/department/${dept.id}`}
                            className="inline-flex items-center gap-1 text-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-2.5 py-1.5 rounded font-medium shadow-sm transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            بازبینی
                          </Link>

                          {isAdmin && dept.status === 'Submitted' && (
                            <>
                              <button
                                onClick={() => handleQuickApprove(dept.id)}
                                className="inline-flex items-center gap-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded font-medium transition-colors"
                                title="تایید کاربرگ این اداره"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                تایید
                              </button>

                              <button
                                onClick={() => {
                                  setRejectingDept(dept)
                                  setRejectionReason('')
                                }}
                                className="inline-flex items-center gap-1 text-xs bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2.5 py-1.5 rounded font-medium transition-colors"
                                title="عدم تایید و بازگشت به رییس اداره"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                بازگشت
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rejection Modal */}
        {rejectingDept && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  عدم تایید و ارجاع جهت اصلاح: {rejectingDept.departmentName}
                </h3>
                <button
                  onClick={() => setRejectingDept(null)}
                  className="text-gray-400 hover:text-gray-600 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRejectSubmit} className="space-y-4">
                <p className="text-xs text-gray-500 leading-relaxed">
                  با ثبت عدم تایید، وضعیت کاربرگ این اداره به «نیازمند اصلاح» تغییر یافته و رییس اداره می‌تواند پس از اعمال تغییرات، مجدداً آن را ارسال نماید.
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    دلایل و توضیحات عدم تایید <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="مثال: مجموع ساعت اضافه کار بیشتر از سقف مصوب است؛ لطفا نرخ آقای ... اصلاح گردد."
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setRejectingDept(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {submittingReview ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    ثبت و ارجاع به اداره
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
