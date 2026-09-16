'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useMenuSettings } from '@/contexts/MenuSettingsContext'
import {
  payrollCyclesApi,
  CYCLE_STATUS_LABELS,
  DEPT_STATUS_LABELS,
  type PayrollCycleDetailDto,
  type PayrollDepartmentEntrySummaryDto,
} from '@/lib/api/payrollCycles'
import { PROCESS_TYPE_LABELS } from '@/lib/api/payroll'
import SendToOfficesModal from '@/components/payroll/SendToOfficesModal'
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
  ShieldCheck,
  Send,
  Sliders,
  SlidersHorizontal,
  Edit3,
  Percent,
  Sparkles,
  Check,
} from 'lucide-react'

function formatNumber(v: number | null | undefined): string {
  if (v == null) return '—'
  return v.toLocaleString('fa-IR')
}

export default function CycleDetailPage() {
  const { user } = useAuth()
  const { isActionVisible, isModuleVisible } = useMenuSettings()
  const params = useParams()
  const router = useRouter()
  const cycleId = params.id as string

  const [cycle, setCycle] = useState<PayrollCycleDetailDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [sendingToOffices, setSendingToOffices] = useState(false)
  const [isSendConfirmOpen, setIsSendConfirmOpen] = useState(false)
  const [successBanner, setSuccessBanner] = useState<string | null>(null)

  // Adjust Total Amounts Modal state
  const [isAdjustTotalsOpen, setIsAdjustTotalsOpen] = useState(false)
  const [adjustActiveTab, setAdjustActiveTab] = useState<'overtime' | 'welfare' | 'both'>('both')
  const [targetOtInput, setTargetOtInput] = useState('')
  const [targetWfInput, setTargetWfInput] = useState('')
  const [otPercentInput, setOtPercentInput] = useState('')
  const [wfPercentInput, setWfPercentInput] = useState('')
  const [submittingAdjustTotals, setSubmittingAdjustTotals] = useState(false)

  // Tweak Department Values Modal state
  const [editingDept, setEditingDept] = useState<PayrollDepartmentEntrySummaryDto | null>(null)
  const [deptBaseCapInput, setDeptBaseCapInput] = useState('')
  const [deptOtInput, setDeptOtInput] = useState('')
  const [deptWfInput, setDeptWfInput] = useState('')
  const [submittingDeptTweak, setSubmittingDeptTweak] = useState(false)

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

  const handleQuickApprove = async (deptId: string, stage: 'Deputy' | 'Manager' = 'Manager') => {
    const confirmMsg =
      stage === 'Deputy'
        ? 'آیا از تایید این کاربرگ در مرحله معاونت اداره و ارجاع به دفتر مدیریت اطمینان دارید؟'
        : 'آیا از تایید نهایی این کاربرگ توسط دفتر مدیریت اطمینان دارید؟'
    if (!confirm(confirmMsg)) return

    try {
      await payrollCyclesApi.reviewDepartment(deptId, { approve: true, reviewStage: stage })
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
  const isCreator = Boolean(cycle?.createdByUsername && user?.username && cycle.createdByUsername === user.username)
  const canManageCycles =
    isAdmin ||
    isCreator ||
    isActionVisible('action_payroll_create_cycle', 'module_payroll') ||
    isActionVisible('/payroll/cycles/create', 'module_payroll')
  const isDraft = cycle?.status === 'Draft'
  const canTweak = canManageCycles && (isDraft || isAdmin)

  const canReview =
    user?.role === 'Admin' ||
    user?.role === 'Manager' ||
    user?.role === 'OfficeHead' ||
    user?.role === 'GroupHead' ||
    user?.role === 'Expert'

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

  // If the cycle is Draft and the user cannot manage cycles / is not the creator, hide the cycle details
  if (isDraft && !canManageCycles) {
    return (
      <ProtectedRoute>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">دوره محاسبه در مرحله پیش‌نویس است</h2>
          <p className="text-sm text-gray-500 mb-4">
            این دوره در مرحله پیش‌نویس است و هنوز توسط ایجادکننده یا مدیر ارشد به ادارات ارسال نشده است.
          </p>
          <Link href="/payroll/cycles" className="text-primary-600 hover:underline text-sm font-medium">
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

  const isBonus = cycle.processType === 'HalfPercentBonus'
  const totalDepts = cycle.departmentEntries.length
  const submittedDepts = cycle.departmentEntries.filter(
    (d) => d.status === 'Submitted' || d.status === 'DeputyApproved' || d.status === 'Approved'
  ).length
  const deputyApprovedDepts = cycle.departmentEntries.filter((d) => d.status === 'DeputyApproved').length
  const approvedDepts = cycle.departmentEntries.filter((d) => d.status === 'Approved').length
  const totalEmployees = cycle.departmentEntries.reduce((sum, d) => sum + d.employeeCount, 0)
  const totalOvertime = cycle.departmentEntries.reduce((sum, d) => sum + d.totalOvertimeAmount, 0)
  const totalWelfare = cycle.departmentEntries.reduce((sum, d) => sum + d.totalWelfareAmount, 0)
  const totalBonus = cycle.departmentEntries.reduce((sum, d) => sum + (d.totalBonusAmount || 0), 0)

  const handleConfirmSendToOffices = async () => {
    if (!cycle) return

    setSendingToOffices(true)
    try {
      const updated = await payrollCyclesApi.sendToOffices(cycleId)
      setCycle(updated)
      setIsSendConfirmOpen(false)
      setSuccessBanner(
        'دوره محاسبه با موفقیت به کلیه ادارات ارسال گردید و وضعیت آن به «در حال دریافت اطلاعات ادارات» تغییر یافت.'
      )
    } catch (err: any) {
      alert(err?.response?.data?.error || err.message || 'خطا در ارسال دوره به ادارات')
    } finally {
      setSendingToOffices(false)
    }
  }

  const openAdjustTotalsModal = (tab: 'overtime' | 'welfare' | 'both' = 'both') => {
    setAdjustActiveTab(tab)
    setTargetOtInput(totalOvertime > 0 ? totalOvertime.toString() : '')
    setTargetWfInput(totalWelfare > 0 ? totalWelfare.toString() : '')
    setOtPercentInput('')
    setWfPercentInput('')
    setIsAdjustTotalsOpen(true)
  }

  const handleAdjustTotalsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingAdjustTotals(true)
    try {
      const rawOt = targetOtInput.replace(/,/g, '').trim()
      const rawWf = targetWfInput.replace(/,/g, '').trim()
      const parsedOt = rawOt ? parseInt(rawOt, 10) : null
      const parsedWf = rawWf ? parseInt(rawWf, 10) : null
      const parsedOtPct = otPercentInput.trim() ? parseFloat(otPercentInput) : null
      const parsedWfPct = wfPercentInput.trim() ? parseFloat(wfPercentInput) : null

      const updated = await payrollCyclesApi.adjustCycleTotals(cycleId, {
        targetTotalOvertimeAmount: (adjustActiveTab === 'overtime' || adjustActiveTab === 'both') ? parsedOt : null,
        targetTotalWelfareAmount: (adjustActiveTab === 'welfare' || adjustActiveTab === 'both') ? parsedWf : null,
        overtimeAdjustmentPercentage: (adjustActiveTab === 'overtime' || adjustActiveTab === 'both') ? parsedOtPct : null,
        welfareAdjustmentPercentage: (adjustActiveTab === 'welfare' || adjustActiveTab === 'both') ? parsedWfPct : null,
      })
      setCycle(updated)
      setIsAdjustTotalsOpen(false)
      alert('مبالغ کل دوره با موفقیت تعدیل و در کلیه ادارات بازتوزیع گردید.')
    } catch (err: any) {
      alert(err?.response?.data?.error || err.message || 'خطا در تعدیل مبالغ کل دوره')
    } finally {
      setSubmittingAdjustTotals(false)
    }
  }

  const openDeptEditModal = (dept: PayrollDepartmentEntrySummaryDto) => {
    setEditingDept(dept)
    setDeptBaseCapInput(dept.baseOvertimeCap ? dept.baseOvertimeCap.toString() : '')
    setDeptOtInput(dept.totalOvertimeAmount ? dept.totalOvertimeAmount.toString() : '')
    setDeptWfInput(dept.totalWelfareAmount ? dept.totalWelfareAmount.toString() : '')
  }

  const handleDeptTweakSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDept) return

    setSubmittingDeptTweak(true)
    try {
      const rawBase = deptBaseCapInput.replace(/,/g, '').trim()
      const rawOt = deptOtInput.replace(/,/g, '').trim()
      const rawWf = deptWfInput.replace(/,/g, '').trim()

      const baseCap = rawBase ? parseFloat(rawBase) : null
      const otAmount = rawOt ? parseInt(rawOt, 10) : null
      const wfAmount = rawWf ? parseInt(rawWf, 10) : null

      await payrollCyclesApi.tweakDepartmentValues(editingDept.id, {
        baseOvertimeCap: baseCap,
        baseWelfareCap: baseCap,
        totalOvertimeAmount: otAmount,
        totalWelfareAmount: wfAmount,
      })
      await loadCycle()
      setEditingDept(null)
      alert('مقادیر اداره با موفقیت ذخیره شد.')
    } catch (err: any) {
      alert(err?.response?.data?.error || err.message || 'خطا در ویرایش مقادیر اداره')
    } finally {
      setSubmittingDeptTweak(false)
    }
  }


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

        {/* Success Banner Notification */}
        {successBanner && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-4 mb-6 shadow-sm flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-950">ارسال با موفقیت انجام شد</h4>
                <p className="text-xs text-emerald-800 mt-0.5">{successBanner}</p>
              </div>
            </div>
            <button
              onClick={() => setSuccessBanner(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              متوجه شدم
            </button>
          </div>
        )}

        {/* Pre-Distribution Draft Alert Banner */}
        {isDraft && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 mb-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 border border-amber-200/60 shadow-2xs">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-amber-900">
                    وضعیت پیش‌نویس (آماده‌سازی و تنظیم اولیه مقادیر قبل از ارسال به ادارات)
                  </h2>
                  <span className="text-[11px] font-semibold bg-amber-200/80 text-amber-800 px-2 py-0.5 rounded-md">
                    عدم دسترسی ادارات
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed max-w-3xl">
                  این دوره در مرحله پیش‌نویس است و هنوز در دسترس ادارات قرار نگرفته است. شما به عنوان ایجادکننده دوره می‌توانید مبالغ کل اضافه کار و رفاهی را از کارت‌های خلاصه، یا مقادیر هر اداره را در جدول زیر تنظیم نمایید. پس از نهایی‌سازی ارقام، بر روی «ارسال به ادارات» کلیک کنید.
                </p>
              </div>
            </div>

            {canManageCycles && (
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <button
                  onClick={() => openAdjustTotalsModal('both')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-amber-800 bg-white hover:bg-amber-100/60 border border-amber-300 shadow-2xs transition-colors"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-700" />
                  تعدیل مبالغ کل دوره
                </button>
                <button
                  onClick={() => setIsSendConfirmOpen(true)}
                  disabled={sendingToOffices}
                  className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl font-bold shadow-sm transition-all text-xs whitespace-nowrap disabled:opacity-50"
                >
                  {sendingToOffices ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  ارسال به ادارات
                </button>
              </div>
            )}
          </div>
        )}

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
              {isDraft && canManageCycles && (
                <button
                  onClick={() => setIsSendConfirmOpen(true)}
                  disabled={sendingToOffices}
                  className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-bold shadow-sm transition-all text-sm disabled:opacity-50"
                >
                  {sendingToOffices ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  ارسال به ادارات
                </button>
              )}

              {canTweak && (
                <button
                  onClick={() => openAdjustTotalsModal('both')}
                  className="inline-flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-4 py-2.5 rounded-lg font-medium shadow-2xs transition-colors text-sm"
                >
                  <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                  تعدیل مبالغ کل
                </button>
              )}

              <button
                onClick={handleExportMasterExcel}
                disabled={exporting}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm transition-colors text-sm disabled:opacity-50"
              >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                دانلود اکسل تجمیعی کلیه ادارات
              </button>

              {canManageCycles && !isDraft && cycle.status !== 'Finalized' && (
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
                {formatNumber(approvedDepts)} تایید نهایی / {formatNumber(deputyApprovedDepts)} تایید معاونت
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

            {isBonus ? (
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 col-span-2">
                <span className="text-xs text-purple-700 block mb-1 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-purple-600" />
                  مجموع مبلغ پاداش نیم درصد کلیه ادارات
                </span>
                <span className="text-xl font-bold text-purple-900">{formatNumber(totalBonus)} ریال</span>
                <span className="text-xs text-purple-600 block mt-1">محاسبه شده بر اساس سقف‌های مصوب سمت‌ها</span>
              </div>
            ) : (
              <>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 relative group hover:border-primary-200 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-primary-600" />
                      مجموع مبلغ اضافه کار
                    </span>
                    {canTweak && (
                      <button
                        onClick={() => openAdjustTotalsModal('overtime')}
                        className="text-[11px] font-semibold text-primary-700 hover:text-primary-900 bg-primary-50 hover:bg-primary-100 border border-primary-200 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                        title="ویرایش و تعدیل مبلغ کل اضافه کار"
                      >
                        <Edit3 className="w-3 h-3" />
                        تعدیل
                      </button>
                    )}
                  </div>
                  <span className="text-lg font-bold text-gray-900">{formatNumber(totalOvertime)} ریال</span>
                  <span className="text-xs text-gray-400 block mt-1">محاسبه شده طبق ضرایب</span>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 relative group hover:border-primary-200 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-primary-600" />
                      مجموع مبلغ رفاهی
                    </span>
                    {canTweak && (
                      <button
                        onClick={() => openAdjustTotalsModal('welfare')}
                        className="text-[11px] font-semibold text-primary-700 hover:text-primary-900 bg-primary-50 hover:bg-primary-100 border border-primary-200 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                        title="ویرایش و تعدیل مبلغ کل رفاهی"
                      >
                        <Edit3 className="w-3 h-3" />
                        تعدیل
                      </button>
                    )}
                  </div>
                  <span className="text-lg font-bold text-gray-900">{formatNumber(totalWelfare)} ریال</span>
                  <span className="text-xs text-gray-400 block mt-1">محاسبه شده طبق درصدها</span>
                </div>
              </>
            )}
          </div>
        </div>


        {/* Department Submissions Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary-600" />
                  کاربرگ‌ها و وضعیت ارسال ادارات
                </h2>
              </div>
              <p className="text-xs text-gray-500">
                برای بازبینی ریز اقلام یا تایید نهایی، بر روی نام هر اداره یا دکمه بازبینی کلیک کنید.
              </p>
            </div>

            {/* Office Scope Indicator */}
            <div className="flex items-center gap-2">
              {user?.role === 'Admin' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  دسترسی مدیر ارشد (مشاهده تمامی ادارات استان)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  نمایش ادارات منتسب به شما ({formatNumber(cycle.departmentEntries.length)} اداره مجاز)
                </span>
              )}
            </div>
          </div>

          {cycle.departmentEntries.length === 0 ? (
            <div className="p-12 text-center bg-gray-50/50">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-amber-200">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-gray-800 mb-1.5">
                هیچ کاربرگی برای ادارات منتسب به شما در این دوره یافت نشد
              </h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto mb-5 leading-relaxed">
                {user?.role === 'Admin'
                  ? 'هنوز هیچ کاربرگ اداره‌ای در این دوره ثبت یا بارگذاری نشده است.'
                  : 'حساب کاربری شما به هیچ‌کدام از ادارات تعریف شده در این دوره تخصیص داده نشده است یا هنوز کاربرگی برای اداره شما ایجاد نشده است. جهت بررسی دسترسی، با مدیر ارشد سامانه تماس حاصل فرمایید.'}
              </p>
              <Link
                href="/payroll/cycles"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-800 hover:underline"
              >
                <ArrowRight className="w-4 h-4" />
                بازگشت به فهرست دوره‌های محاسبه
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse text-right">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs font-semibold">
                  <th className="px-6 py-3.5">نام اداره / کاربرگ</th>
                  <th className="px-4 py-3.5">وضعیت</th>
                  <th className="px-4 py-3.5">تعداد نفرات</th>
                  {isBonus ? (
                    <>
                      <th className="px-4 py-3.5">سقف بودجه اداره (ریال)</th>
                      <th className="px-4 py-3.5">جمع پاداش تخصیصی (ریال)</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3.5">سرانه پایه</th>
                      <th className="px-4 py-3.5">جمع اضافه کار (ریال)</th>
                      <th className="px-4 py-3.5">جمع رفاهی (ریال)</th>
                    </>
                  )}
                  <th className="px-4 py-3.5">ارسال و تاییدات</th>
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

                      {isBonus ? (
                        <>
                          <td className="px-4 py-4 text-gray-600">
                            {dept.baseBonusCap ? formatNumber(dept.baseBonusCap) : '—'}
                          </td>
                          <td className="px-4 py-4 font-semibold text-purple-900">
                            {formatNumber(dept.totalBonusAmount)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-4 text-gray-600">
                            {dept.baseOvertimeCap ? formatNumber(dept.baseOvertimeCap) : '—'}
                          </td>
                          <td className="px-4 py-4 font-semibold text-gray-900">
                            {formatNumber(dept.totalOvertimeAmount)}
                          </td>
                          <td className="px-4 py-4 font-semibold text-gray-900">
                            {formatNumber(dept.totalWelfareAmount)}
                          </td>
                        </>
                      )}

                      <td className="px-4 py-4 text-xs text-gray-500">
                        {dept.submittedByUsername ? (
                          <div className="space-y-1">
                            <div>
                              <span className="text-gray-400">ارسال: </span>
                              <span className="font-medium text-gray-700">{dept.submittedByUsername}</span>
                              {dept.submittedAt && (
                                <span className="text-[10px] text-gray-400 block">
                                  {new Date(dept.submittedAt).toLocaleDateString('fa-IR')}
                                </span>
                              )}
                            </div>
                            {dept.deputyApprovedByUsername && (
                              <div className="text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded text-[11px] border border-purple-100">
                                <span>معاونت: {dept.deputyApprovedByUsername}</span>
                              </div>
                            )}
                            {dept.approvedByUsername && (
                              <div className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px] border border-emerald-100">
                                <span>مدیریت: {dept.approvedByUsername}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">ارسال نشده</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <Link
                            href={`/payroll/department/${dept.id}`}
                            className="inline-flex items-center gap-1 text-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-2.5 py-1.5 rounded font-medium shadow-sm transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            بازبینی
                          </Link>

                          {canTweak && (
                            <button
                              onClick={() => openDeptEditModal(dept)}
                              className="inline-flex items-center gap-1 text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-1.5 rounded font-medium shadow-2xs transition-colors"
                              title="ویرایش سرانه پایه، اضافه کار و رفاهی این اداره"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-700" />
                              ویرایش مقادیر
                            </button>
                          )}

                          {canReview && dept.status === 'Submitted' && (
                            <>
                              <button
                                onClick={() => handleQuickApprove(dept.id, 'Deputy')}
                                className="inline-flex items-center gap-1 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-2.5 py-1.5 rounded font-medium transition-colors"
                                title="تایید در مرحله معاونت اداره و ارجاع به دفتر مدیریت"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                تایید معاونت
                              </button>

                              <button
                                onClick={() => {
                                  setRejectingDept(dept)
                                  setRejectionReason('')
                                }}
                                className="inline-flex items-center gap-1 text-xs bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2.5 py-1.5 rounded font-medium transition-colors"
                                title="عدم تایید و عودت به رییس اداره"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                عودت
                              </button>
                            </>
                          )}

                          {canReview && dept.status === 'DeputyApproved' && (
                            <>
                              <button
                                onClick={() => handleQuickApprove(dept.id, 'Manager')}
                                className="inline-flex items-center gap-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded font-medium transition-colors"
                                title="تایید نهایی دفتر مدیریت"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                تایید مدیریت
                              </button>

                              <button
                                onClick={() => {
                                  setRejectingDept(dept)
                                  setRejectionReason('')
                                }}
                                className="inline-flex items-center gap-1 text-xs bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2.5 py-1.5 rounded font-medium transition-colors"
                                title="عدم تایید و عودت به اداره"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                عودت
                              </button>
                            </>
                          )}

                          {canReview && dept.status === 'Approved' && (
                            <button
                              onClick={() => {
                                setRejectingDept(dept)
                                setRejectionReason('')
                              }}
                              className="inline-flex items-center gap-1 text-xs bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-700 border border-gray-200 hover:border-red-200 px-2 py-1.5 rounded text-[11px] transition-colors"
                              title="عودت پرونده جهت اصلاح مجدد"
                            >
                              <XCircle className="w-3 h-3" />
                              عودت
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
        {/* Adjust Total Amounts Modal */}
        {isAdjustTotalsOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl overflow-hidden">
              <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-100">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      تعدیل مبالغ کل دوره محاسبه
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      تنظیم ارقام اضافه کار و رفاهی و بازتوزیع تناسبی در کلیه ادارات
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAdjustTotalsOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 text-base font-bold transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Tab Selector */}
              <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl mb-5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setAdjustActiveTab('both')}
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    adjustActiveTab === 'both' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  اضافه کار و رفاهی
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustActiveTab('overtime')}
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    adjustActiveTab === 'overtime' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  فقط اضافه کار
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustActiveTab('welfare')}
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    adjustActiveTab === 'welfare' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  فقط رفاهی
                </button>
              </div>

              <form onSubmit={handleAdjustTotalsSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Overtime Card Input */}
                  {(adjustActiveTab === 'overtime' || adjustActiveTab === 'both') && (
                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-primary-600" />
                          مجموع مبلغ اضافه کار
                        </label>
                        <span className="text-[11px] text-gray-500 font-medium">
                          فعلی: {formatNumber(totalOvertime)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-gray-600 block mb-1">مبلغ جدید مورد نظر (ریال):</span>
                        <input
                          type="text"
                          dir="ltr"
                          value={targetOtInput}
                          onChange={(e) => {
                            setTargetOtInput(e.target.value)
                            setOtPercentInput('')
                          }}
                          placeholder="مثلاً 55,000,000,000"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-left font-mono focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white"
                        />
                      </div>

                      <div>
                        <span className="text-[11px] text-gray-600 block mb-1">یا تغییر درصدی (+/-):</span>
                        <div className="relative">
                          <input
                            type="number"
                            dir="ltr"
                            step="0.01"
                            value={otPercentInput}
                            onChange={(e) => {
                              setOtPercentInput(e.target.value)
                              const pct = parseFloat(e.target.value)
                              if (!isNaN(pct)) {
                                const newTotal = Math.round(totalOvertime * (1 + pct / 100))
                                setTargetOtInput(newTotal.toString())
                              }
                            }}
                            placeholder="مثلاً -4.5 یا 5"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm text-left font-mono focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white"
                          />
                          <span className="absolute right-2.5 top-2.5 text-xs text-gray-400 font-bold">٪</span>
                        </div>
                      </div>

                      {targetOtInput && !isNaN(parseInt(targetOtInput.replace(/,/g, ''), 10)) && (
                        <div className="text-[11px] pt-1 text-gray-600 border-t border-gray-200/80 flex items-center justify-between">
                          <span>اختلاف با مقدار فعلی:</span>
                          <span
                            dir="ltr"
                            className={`font-semibold ${
                              parseInt(targetOtInput.replace(/,/g, ''), 10) - totalOvertime >= 0
                                ? 'text-emerald-600'
                                : 'text-red-600'
                            }`}
                          >
                            {(parseInt(targetOtInput.replace(/,/g, ''), 10) - totalOvertime).toLocaleString('fa-IR')}{' '}
                            ریال
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Welfare Card Input */}
                  {(adjustActiveTab === 'welfare' || adjustActiveTab === 'both') && (
                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-primary-600" />
                          مجموع مبلغ رفاهی
                        </label>
                        <span className="text-[11px] text-gray-500 font-medium">
                          فعلی: {formatNumber(totalWelfare)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-gray-600 block mb-1">مبلغ جدید مورد نظر (ریال):</span>
                        <input
                          type="text"
                          dir="ltr"
                          value={targetWfInput}
                          onChange={(e) => {
                            setTargetWfInput(e.target.value)
                            setWfPercentInput('')
                          }}
                          placeholder="مثلاً 70,000,000,000"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-left font-mono focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white"
                        />
                      </div>

                      <div>
                        <span className="text-[11px] text-gray-600 block mb-1">یا تغییر درصدی (+/-):</span>
                        <div className="relative">
                          <input
                            type="number"
                            dir="ltr"
                            step="0.01"
                            value={wfPercentInput}
                            onChange={(e) => {
                              setWfPercentInput(e.target.value)
                              const pct = parseFloat(e.target.value)
                              if (!isNaN(pct)) {
                                const newTotal = Math.round(totalWelfare * (1 + pct / 100))
                                setTargetWfInput(newTotal.toString())
                              }
                            }}
                            placeholder="مثلاً -2.5 یا 3"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm text-left font-mono focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white"
                          />
                          <span className="absolute right-2.5 top-2.5 text-xs text-gray-400 font-bold">٪</span>
                        </div>
                      </div>

                      {targetWfInput && !isNaN(parseInt(targetWfInput.replace(/,/g, ''), 10)) && (
                        <div className="text-[11px] pt-1 text-gray-600 border-t border-gray-200/80 flex items-center justify-between">
                          <span>اختلاف با مقدار فعلی:</span>
                          <span
                            dir="ltr"
                            className={`font-semibold ${
                              parseInt(targetWfInput.replace(/,/g, ''), 10) - totalWelfare >= 0
                                ? 'text-emerald-600'
                                : 'text-red-600'
                            }`}
                          >
                            {(parseInt(targetWfInput.replace(/,/g, ''), 10) - totalWelfare).toLocaleString('fa-IR')}{' '}
                            ریال
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-100 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-900 leading-relaxed">
                    با ذخیره این فرم، ضریب تناسب محاسبه شده و به طور خودکار بر روی کلیه ادارات استان و نفرات اعمال خواهد شد، به طوری که مجموع کل جدید دقیقاً برابر ارقام تنظیمی شما خواهد بود.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsAdjustTotalsOpen(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAdjustTotals}
                    className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {submittingAdjustTotals ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    اعمال و بازتوزیع مبالغ
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tweak Department Values Modal */}
        {editingDept && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
              <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      ویرایش مقادیر اداره: {editingDept.departmentName}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      تعداد پرسنل: {formatNumber(editingDept.employeeCount)} نفر
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingDept(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 text-base font-bold transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleDeptTweakSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    سرانه پایه اداره (ضریب سرانه):
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={deptBaseCapInput}
                    onChange={(e) => setDeptBaseCapInput(e.target.value)}
                    placeholder="مثلاً 1,653"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-left font-mono focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    جمع مبلغ اضافه کار اداره (ریال):
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={deptOtInput}
                    onChange={(e) => setDeptOtInput(e.target.value)}
                    placeholder="مثلاً 806,499,135"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-left font-mono focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                  {deptOtInput && !isNaN(parseInt(deptOtInput.replace(/,/g, ''), 10)) && (
                    <span className="text-[11px] text-gray-400 block mt-1">
                      معادل: {parseInt(deptOtInput.replace(/,/g, ''), 10).toLocaleString('fa-IR')} ریال
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    جمع مبلغ رفاهی اداره (ریال):
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={deptWfInput}
                    onChange={(e) => setDeptWfInput(e.target.value)}
                    placeholder="مثلاً 1,011,555,140"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-left font-mono focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                  {deptWfInput && !isNaN(parseInt(deptWfInput.replace(/,/g, ''), 10)) && (
                    <span className="text-[11px] text-gray-400 block mt-1">
                      معادل: {parseInt(deptWfInput.replace(/,/g, ''), 10).toLocaleString('fa-IR')} ریال
                    </span>
                  )}
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-xs text-amber-800 leading-relaxed">
                    با ویرایش ارقام این اداره، مبالغ پرسنل به تناسب تنظیم شده و مجموع کل استان نیز به روزرسانی خواهد شد.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setEditingDept(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={submittingDeptTweak}
                    className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {submittingDeptTweak ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    ذخیره تغییرات اداره
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Send to Offices Confirmation Modal */}
        <SendToOfficesModal
          isOpen={isSendConfirmOpen}
          onClose={() => setIsSendConfirmOpen(false)}
          onConfirm={handleConfirmSendToOffices}
          isSubmitting={sendingToOffices}
          cycleTitle={cycle.title}
          cycleCode={cycle.cycleCode}
          totalDepts={totalDepts}
          totalEmployees={totalEmployees}
          totalOvertime={totalOvertime}
          totalWelfare={totalWelfare}
          totalBonus={totalBonus}
          processType={cycle.processType}
        />
      </div>
    </ProtectedRoute>
  )
}
