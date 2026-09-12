'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import {
  payrollCyclesApi,
  DEPT_STATUS_LABELS,
  type PayrollDepartmentEntryDto,
  type PayrollEmployeeItemDto,
  type UpdateEmployeeItemAdjustmentDto,
} from '@/lib/api/payrollCycles'
import {
  Building2,
  Calendar,
  Save,
  Send,
  Download,
  Upload,
  ArrowRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Check,
  FileSpreadsheet,
} from 'lucide-react'

function formatNumber(v: number | null | undefined): string {
  if (v == null) return '—'
  return v.toLocaleString('fa-IR')
}

export default function DepartmentWorkspacePage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const deptId = params.id as string

  const [dept, setDept] = useState<PayrollDepartmentEntryDto | null>(null)
  const [items, setItems] = useState<PayrollEmployeeItemDto[]>([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [reviewing, setReviewing] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await payrollCyclesApi.getDepartmentEntryById(deptId)
      setDept(data)
      setItems(data.items)
      setNotes(data.notes || '')
      setIsDirty(false)
    } catch (err: any) {
      alert(err?.response?.data?.error || err.message || 'خطا در بارگذاری اطلاعات اداره')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (deptId) {
      loadData()
    }
  }, [deptId])

  const isReadOnly = useMemo(() => {
    if (!dept) return true
    if (dept.cycleStatus === 'Finalized') return true
    if (dept.status === 'Approved') return true
    // If submitted or deputy-approved, officer cannot edit unless rejected or user is Admin
    if ((dept.status === 'Submitted' || dept.status === 'DeputyApproved') && user?.role !== 'Admin') return true
    return false
  }, [dept, user])

  // Real-time calculation helpers
  const handleRateChange = (
    itemId: string,
    field: 'adjustedOvertimeRate' | 'adjustedWelfareRate' | 'adjustedBonusAmount' | 'officerNotes' | 'isExcluded',
    val: any
  ) => {
    setIsDirty(true)
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item

        const updated = { ...item, [field]: val }

        if (updated.isExcluded) {
          updated.calculatedOvertimeAmount = 0
          updated.calculatedWelfareAmount = 0
        } else if (dept?.processType === 'OvertimeWelfareRated') {
          if (updated.baseOvertimeAmount != null && updated.adjustedOvertimeRate != null) {
            updated.calculatedOvertimeAmount = Math.ceil(
              updated.baseOvertimeAmount * updated.adjustedOvertimeRate
            )
          }
          if (updated.baseWelfareAmount != null && updated.adjustedWelfareRate != null) {
            updated.calculatedWelfareAmount = Math.ceil(
              (updated.baseWelfareAmount * updated.adjustedWelfareRate) / 100
            )
          }
        }
        return updated
      })
    )
  }

  // Live aggregated totals
  const totalOvertimeLive = useMemo(() => {
    return items.filter((i) => !i.isExcluded).reduce((sum, i) => sum + (i.calculatedOvertimeAmount || 0), 0)
  }, [items])

  const totalWelfareLive = useMemo(() => {
    return items.filter((i) => !i.isExcluded).reduce((sum, i) => sum + (i.calculatedWelfareAmount || 0), 0)
  }, [items])

  const totalBonusLive = useMemo(() => {
    return items.filter((i) => !i.isExcluded).reduce((sum, i) => sum + (i.adjustedBonusAmount ?? i.baseBonusAmount ?? 0), 0)
  }, [items])

  // Budget violations check
  const isOvertimeOverBudget = useMemo(() => {
    if (!dept || dept.processType === 'HalfPercentBonus') return false
    return dept.baseOvertimeCap ? totalOvertimeLive > dept.baseOvertimeCap : false
  }, [dept, totalOvertimeLive])

  const isWelfareOverBudget = useMemo(() => {
    if (!dept || dept.processType === 'HalfPercentBonus') return false
    return dept.baseWelfareCap ? totalWelfareLive > dept.baseWelfareCap : false
  }, [dept, totalWelfareLive])

  const isBonusOverBudget = useMemo(() => {
    if (!dept || dept.processType !== 'HalfPercentBonus') return false
    return dept.baseBonusCap ? totalBonusLive > dept.baseBonusCap : false
  }, [dept, totalBonusLive])

  // Individual item rule validation
  const individualValidationErrors = useMemo(() => {
    const errs: string[] = []
    for (const item of items) {
      if (item.isExcluded) continue
      if (item.adjustedWelfareRate != null && (item.adjustedWelfareRate < 0 || item.adjustedWelfareRate > 100)) {
        errs.push(`درصد رفاهی برای «${item.employeeName}» (${item.adjustedWelfareRate}٪) فراتر از سقف مجاز ۱۰۰٪ است.`)
      }
      const maxOt = item.maxOvertimeLimit ?? (item.isLaborPosition ? 120 : 175)
      if (item.adjustedOvertimeRate != null && (item.adjustedOvertimeRate < 0 || item.adjustedOvertimeRate > maxOt)) {
        const posLabel = item.isLaborPosition ? 'مشاغل کارگری' : 'سایر کارکنان'
        errs.push(`ساعت اضافه کار «${item.employeeName}» (${item.adjustedOvertimeRate} ساعت) فراتر از سقف ${posLabel} (${maxOt} ساعت) است.`)
      }
      if (item.adjustedBonusAmount != null && item.maxBonusLimit != null && item.adjustedBonusAmount > item.maxBonusLimit) {
        errs.push(`مبلغ پاداش «${item.employeeName}» (${item.positionTierDisplayName || 'پرسنل'}) فراتر از سقف مجاز سمت (${item.maxBonusLimit.toLocaleString('fa-IR')} ریال) است.`)
      }
    }
    return errs
  }, [items])

  const hasBudgetViolation = isOvertimeOverBudget || isWelfareOverBudget || isBonusOverBudget
  const canSubmit = !hasBudgetViolation && individualValidationErrors.length === 0

  const handleSaveDraft = async () => {
    const payloadItems: UpdateEmployeeItemAdjustmentDto[] = items.map((i) => ({
      id: i.id,
      adjustedOvertimeRate: i.adjustedOvertimeRate,
      adjustedWelfareRate: i.adjustedWelfareRate,
      adjustedBonusAmount: i.adjustedBonusAmount ?? i.baseBonusAmount,
      officerNotes: i.officerNotes,
      isExcluded: i.isExcluded,
    }))

    setSaving(true)
    try {
      const updated = await payrollCyclesApi.saveDraft(deptId, {
        notes,
        items: payloadItems,
      })
      setDept(updated)
      setItems(updated.items)
      setIsDirty(false)
      setSuccessMsg('پیش‌نویس با موفقیت ذخیره گردید.')
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err: any) {
      alert(err?.response?.data?.error || err.message || 'خطا در ذخیره پیش‌نویس')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitFinal = async () => {
    if (!canSubmit) {
      alert('امکان ارسال نهایی وجود ندارد. لطفاً ابتدا مبالغ مازاد بر سقف بودجه اداره یا سقف‌های فردی را اصلاح فرمایید.')
      return
    }

    if (
      !confirm(
        'آیا از ارسال نهایی اطلاعات کاربرگ به معاونت اداره اطمینان دارید؟ پس از ارسال، کاربرگ شما جهت بررسی معاونت قفل خواهد شد.'
      )
    )
      return

    const payloadItems: UpdateEmployeeItemAdjustmentDto[] = items.map((i) => ({
      id: i.id,
      adjustedOvertimeRate: i.adjustedOvertimeRate,
      adjustedWelfareRate: i.adjustedWelfareRate,
      adjustedBonusAmount: i.adjustedBonusAmount ?? i.baseBonusAmount,
      officerNotes: i.officerNotes,
      isExcluded: i.isExcluded,
    }))

    setSubmitting(true)
    try {
      const updated = await payrollCyclesApi.submitDepartment(deptId, {
        notes,
        items: payloadItems,
      })
      setDept(updated)
      setItems(updated.items)
      setIsDirty(false)
      alert('کاربرگ اداره با موفقیت ارسال شد و در انتظار بررسی و تایید معاونت اداره قرار گرفت.')
    } catch (err: any) {
      alert(err?.response?.data?.error || err.message || 'خطا در ارسال نهایی')
    } finally {
      setSubmitting(false)
    }
  }

  const handleExportDeptExcel = async () => {
    try {
      const blob = await payrollCyclesApi.exportDepartmentExcel(deptId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `کاربرگ_${dept?.departmentName || 'اداره'}_${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      alert('خطا در دریافت اکسل اداره: ' + (err.message || ''))
    }
  }

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const updated = await payrollCyclesApi.importDepartmentExcel(deptId, file)
      setDept(updated)
      setItems(updated.items)
      setIsDirty(false)
      alert('اطلاعات فایل اکسل با موفقیت بارگذاری و اعمال شد.')
    } catch (err: any) {
      alert(err?.response?.data?.error || err.message || 'خطا در بارگذاری فایل اکسل')
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const canReview =
    user?.role === 'Admin' ||
    user?.role === 'Manager' ||
    user?.role === 'OfficeHead' ||
    user?.role === 'GroupHead' ||
    user?.role === 'Expert'

  const handleReview = async (approve: boolean, stage: 'Deputy' | 'Manager' = 'Deputy') => {
    if (approve) {
      const confirmMsg =
        stage === 'Deputy'
          ? 'آیا از تایید این کاربرگ در مرحله معاونت اداره و ارجاع به دفتر مدیریت اطمینان دارید؟'
          : 'آیا از تایید نهایی این کاربرگ توسط دفتر مدیریت اطمینان دارید؟'
      if (!confirm(confirmMsg)) return
    }

    setReviewing(true)
    try {
      const updated = await payrollCyclesApi.reviewDepartment(deptId, {
        approve,
        reviewStage: stage,
        rejectionReason: !approve ? rejectionReason.trim() : undefined,
      })
      setDept(updated)
      setItems(updated.items)
      setRejectModalOpen(false)
      setRejectionReason('')
      setSuccessMsg(
        approve
          ? stage === 'Deputy'
            ? 'کاربرگ با موفقیت توسط معاونت تایید شد و به دفتر مدیریت ارسال گردید.'
            : 'کاربرگ با موفقیت توسط دفتر مدیریت تایید نهایی گردید.'
          : 'کاربرگ جهت اصلاح به رییس اداره عودت داده شد.'
      )
      setTimeout(() => setSuccessMsg(null), 5000)
    } catch (err: any) {
      alert(err?.response?.data?.error || err.message || 'خطا در ثبت بررسی')
    } finally {
      setReviewing(false)
    }
  }

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items
    const term = searchTerm.trim().toLowerCase()
    return items.filter(
      (i) =>
        i.personnelNumber.toLowerCase().includes(term) ||
        i.employeeName.toLowerCase().includes(term) ||
        (i.positionTitle && i.positionTitle.toLowerCase().includes(term))
    )
  }, [items, searchTerm])

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      </ProtectedRoute>
    )
  }

  if (!dept) return null

  const statusInfo = DEPT_STATUS_LABELS[dept.status] || {
    label: dept.status,
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    dot: 'bg-gray-400',
  }

  const isBonus = dept.processType === 'HalfPercentBonus'

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/payroll/cycles" className="hover:text-primary-600 flex items-center gap-1">
            <ArrowRight className="w-4 h-4" />
            دوره‌های محاسبه
          </Link>
          <span>/</span>
          <Link href={`/payroll/cycles/${dept.payrollCycleId}`} className="hover:text-primary-600">
            {dept.cycleTitle}
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{dept.departmentName}</span>
        </div>

        {/* Status Alerts */}
        {dept.status === 'Rejected' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-start gap-3">
            <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">کاربرگ نیازمند اصلاح و بازنگری است</h4>
              <p className="text-xs mt-1 text-red-700">
                <strong>علت عودت:</strong> {dept.rejectionReason}
              </p>
              <p className="text-xs mt-1 text-red-600">
                لطفاً پس از اعمال اصلاحات لازم، مجدداً دکمه «ارسال نهایی به معاونت اداره» را بزنید.
              </p>
            </div>
          </div>
        )}

        {dept.status === 'Submitted' && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-sm">کاربرگ در انتظار بررسی و تایید معاونت اداره می‌باشد</h4>
              <p className="text-xs mt-0.5 text-blue-700">
                اطلاعات توسط رییس اداره نهایی شده و جهت تایید اولیه به معاونت مربوطه ارسال گردیده است.
              </p>
            </div>
          </div>
        )}

        {dept.status === 'DeputyApproved' && (
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 text-purple-800 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-sm">کاربرگ توسط معاونت اداره تایید شده و در انتظار تایید نهایی دفتر مدیریت است</h4>
              <p className="text-xs mt-0.5 text-purple-700">
                تایید شده توسط {dept.deputyApprovedByUsername || 'معاونت اداره'}
                {dept.deputyApprovedAt && ` در تاریخ ${new Date(dept.deputyApprovedAt).toLocaleDateString('fa-IR')}`}
              </p>
            </div>
          </div>
        )}

        {dept.status === 'Approved' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span className="text-sm font-medium">
              کاربرگ این اداره توسط دفتر مدیریت تایید نهایی گردیده و قفل شده است.
            </span>
          </div>
        )}

        {/* Budget & Rule Violations Warning Banner */}
        {(!isReadOnly && (hasBudgetViolation || individualValidationErrors.length > 0)) && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl">
            <div className="flex items-center gap-2 font-bold text-sm mb-2 text-red-800">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              هشدار: عدم رعایت سقف‌های مصوب بودجه اداره یا سقف‌های فردی
            </div>
            <ul className="list-disc list-inside text-xs space-y-1 text-amber-900">
              {isOvertimeOverBudget && (
                <li>
                  <strong>تخطی از سقف اضافه کار اداره:</strong> مجموع اضافه کار محاسبه شده ({formatNumber(totalOvertimeLive)} ریال) از سقف مصوب اداره ({formatNumber(dept.baseOvertimeCap)} ریال) بیشتر است.
                </li>
              )}
              {isWelfareOverBudget && (
                <li>
                  <strong>تخطی از سقف رفاهی اداره:</strong> مجموع رفاهی محاسبه شده ({formatNumber(totalWelfareLive)} ریال) از سقف مصوب اداره ({formatNumber(dept.baseWelfareCap)} ریال) بیشتر است.
                </li>
              )}
              {isBonusOverBudget && (
                <li>
                  <strong>تخطی از سقف پاداش نیم درصد اداره:</strong> مجموع پاداش تخصیص داده شده ({formatNumber(totalBonusLive)} ریال) از سقف مصوب بودجه اداره ({formatNumber(dept.baseBonusCap)} ریال) بیشتر است.
                </li>
              )}
              {individualValidationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
            <p className="text-[11px] text-red-700 mt-2 font-medium">
              * تا زمان رفع موارد فوق، امکان «ارسال نهایی به معاونت اداره» غیرفعال خواهد بود.
            </p>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-sm">
            <Check className="w-5 h-5 text-emerald-600" />
            {successMsg}
          </div>
        )}

        {/* Header card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded">
                  {dept.cycleTitle}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border ${statusInfo.color}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                  {statusInfo.label}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-7 h-7 text-primary-600" />
                کاربرگ اختصاصی {dept.departmentName}
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                تکمیل و بازبینی ساعت/نرخ اضافه کار، درصد رفاهی و پاداش نیم درصد کارکنان اداره
              </p>
            </div>

            {/* Offline Excel export / import buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportDeptExcel}
                className="inline-flex items-center gap-1.5 text-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3.5 py-2 rounded-lg font-medium shadow-sm transition-colors"
                title="دانلود کاربرگ اکسل برای تکمیل آفلاین"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                دانلود اکسل اداره
              </button>

              {!isReadOnly && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleImportExcel}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importing}
                    className="inline-flex items-center gap-1.5 text-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3.5 py-2 rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50"
                    title="بارگذاری اکسل تکمیل شده"
                  >
                    {importing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 text-blue-600" />
                    )}
                    بارگذاری اکسل تکمیل شده
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Department Budget Caps & Live Totals */}
          {isBonus ? (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-6">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <span className="text-xs text-gray-500 block mb-1">تعداد کارکنان اداره</span>
                <span className="text-xl font-bold text-gray-900">{formatNumber(dept.employeeCount)} نفر</span>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <span className="text-xs text-gray-500 block mb-1">سقف بودجه پاداش اداره</span>
                <span className="text-lg font-bold text-gray-900">
                  {dept.baseBonusCap ? `${formatNumber(dept.baseBonusCap)} ریال` : '—'}
                </span>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <span className="text-xs text-gray-500 block mb-1">سقف‌های مصوب سمت‌ها</span>
                <div className="text-[11px] space-y-0.5 text-gray-700">
                  <div>رئیس گروه: <strong className="text-gray-900">{formatNumber(dept.groupHeadBonusCap)}</strong> ریال</div>
                  <div>کارشناس ارشد: <strong className="text-gray-900">{formatNumber(dept.seniorExpertBonusCap)}</strong> ریال</div>
                  <div>سایر کارکنان: <strong className="text-gray-900">{formatNumber(dept.otherStaffBonusCap)}</strong> ریال</div>
                </div>
              </div>

              <div className={`rounded-xl p-4 border ${isBonusOverBudget ? 'bg-red-50 border-red-200' : 'bg-purple-50 border-purple-200'}`}>
                <span className="text-xs text-gray-500 block mb-1">مجموع پاداش تخصیص‌یافته</span>
                <span className={`text-lg font-bold ${isBonusOverBudget ? 'text-red-700' : 'text-purple-700'}`}>
                  {formatNumber(totalBonusLive)} ریال
                </span>
                {isBonusOverBudget && (
                  <span className="block text-[10px] text-red-600 font-bold mt-1">تخطی از سقف بودجه اداره</span>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <span className="text-xs text-gray-500 block mb-1">تعداد کارکنان اداره</span>
                <span className="text-xl font-bold text-gray-900">{formatNumber(dept.employeeCount)} نفر</span>
              </div>

              <div className={`rounded-xl p-4 border ${isOvertimeOverBudget ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex justify-between items-start">
                  <span className="text-xs text-gray-500 block mb-1">سقف اضافه کار مصوب</span>
                  {dept.baseOvertimeCap && (
                    <span className="text-[10px] text-gray-400">سقف: {formatNumber(dept.baseOvertimeCap)}</span>
                  )}
                </div>
                <span className={`text-lg font-bold ${isOvertimeOverBudget ? 'text-red-700' : 'text-primary-700'}`}>
                  {formatNumber(totalOvertimeLive)} ریال
                </span>
                {isOvertimeOverBudget && (
                  <span className="block text-[10px] text-red-600 font-bold mt-1">مازاد بر سقف بودجه اداره</span>
                )}
              </div>

              <div className={`rounded-xl p-4 border ${isWelfareOverBudget ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex justify-between items-start">
                  <span className="text-xs text-gray-500 block mb-1">سقف رفاهی مصوب</span>
                  {dept.baseWelfareCap && (
                    <span className="text-[10px] text-gray-400">سقف: {formatNumber(dept.baseWelfareCap)}</span>
                  )}
                </div>
                <span className={`text-lg font-bold ${isWelfareOverBudget ? 'text-red-700' : 'text-emerald-700'}`}>
                  {formatNumber(totalWelfareLive)} ریال
                </span>
                {isWelfareOverBudget && (
                  <span className="block text-[10px] text-red-600 font-bold mt-1">مازاد بر سقف بودجه اداره</span>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col justify-center">
                <span className="text-xs text-gray-500 block mb-1">وضعیت رعایت سقف‌ها</span>
                {canSubmit ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    کلیه سقف‌ها رعایت شده است
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700">
                    <XCircle className="w-4 h-4 text-red-600" />
                    نیازمند اصلاح مقادیر مازاد
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Interactive Live Editable Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-50/50">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
              <input
                type="text"
                placeholder="جستجو با شماره پرسنلی یا نام..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-9 pl-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <span className="text-xs text-gray-500">
              تعداد ردیف‌ها: {formatNumber(filteredItems.length)} از {formatNumber(items.length)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse text-right">
              <thead>
                <tr className="bg-primary-50/80 border-b border-gray-200 text-gray-700 font-bold">
                  <th className="px-3 py-3">شماره کارمند</th>
                  <th className="px-3 py-3">نام و رده شغلی</th>
                  {!isBonus && (
                    <>
                      <th className="px-2 py-3 text-center">ساعت/نرخ پایه</th>
                      <th className="px-2 py-3 text-center bg-primary-100/60 font-black">
                        ساعت اضافه کار نهایی
                      </th>
                      <th className="px-2 py-3 text-center">رفاهی پایه</th>
                      <th className="px-2 py-3 text-center bg-primary-100/60 font-black">
                        درصد رفاهی نهایی (سقف ۱۰۰٪)
                      </th>
                      <th className="px-3 py-3 text-left">مبلغ اضافه کار (ریال)</th>
                      <th className="px-3 py-3 text-left">مبلغ رفاهی (ریال)</th>
                    </>
                  )}
                  {isBonus && (
                    <>
                      <th className="px-3 py-3 text-center">سمت و سقف مجاز</th>
                      <th className="px-3 py-3 text-left bg-purple-50 font-black">مبلغ پاداش نیم درصد (ریال)</th>
                    </>
                  )}
                  <th className="px-2 py-3 text-center">محروم</th>
                  <th className="px-3 py-3">توضیحات و دلایل اصلاح</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredItems.map((item, idx) => {
                  const maxOt = item.maxOvertimeLimit ?? (item.isLaborPosition ? 120 : 175)
                  const isOtExceeded = (item.adjustedOvertimeRate || 0) > maxOt
                  const isWelfareExceeded = (item.adjustedWelfareRate || 0) > 100
                  const isBonusExceeded = isBonus && item.maxBonusLimit != null && ((item.adjustedBonusAmount ?? item.baseBonusAmount ?? 0) > item.maxBonusLimit)

                  return (
                    <tr
                      key={item.id}
                      className={`${item.isExcluded ? 'bg-gray-100 text-gray-400' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-primary-50/30 transition-colors`}
                    >
                      <td className="px-3 py-2 font-mono font-medium text-gray-900">
                        {item.personnelNumber}
                      </td>

                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-900">{item.employeeName}</div>
                        {isBonus && (
                          <div className="mt-0.5 text-[11px] text-purple-700 font-semibold flex items-center gap-1">
                            <span className="text-gray-400 font-normal">پست:</span>
                            <span className="bg-purple-50 text-purple-800 px-1.5 py-0.5 rounded border border-purple-200 text-[10px]">
                              {item.positionTitle || 'حسابرس'}
                            </span>
                          </div>
                        )}
                        {!isBonus && (
                          <div className="mt-0.5">
                            {item.isLaborPosition ? (
                              <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800">
                                مشاغل کارگری (سقف ۱۲۰ ساعت)
                              </span>
                            ) : (
                              <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-100 text-slate-600">
                                سایر کارکنان (سقف ۱۷۵ ساعت)
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {!isBonus && (
                        <>
                          <td className="px-2 py-2 text-center text-gray-500">
                            {formatNumber(item.initialOvertimeRate)}
                          </td>

                          <td className="px-2 py-2 text-center bg-primary-50/40">
                            {isReadOnly ? (
                              <span className={`font-bold ${isOtExceeded ? 'text-red-600' : 'text-primary-800'}`}>
                                {formatNumber(item.adjustedOvertimeRate)}
                              </span>
                            ) : (
                              <div className="flex flex-col items-center">
                                <input
                                  type="number"
                                  step="1"
                                  min="0"
                                  max={maxOt}
                                  disabled={item.isExcluded}
                                  value={item.adjustedOvertimeRate ?? ''}
                                  onChange={(e) =>
                                    handleRateChange(
                                      item.id,
                                      'adjustedOvertimeRate',
                                      e.target.value === '' ? null : parseFloat(e.target.value)
                                    )
                                  }
                                  className={`w-20 px-2 py-1 text-center font-bold text-xs bg-white border rounded focus:ring-2 focus:outline-none ${
                                    isOtExceeded
                                      ? 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-300'
                                      : 'border-primary-300 focus:ring-primary-500'
                                  }`}
                                />
                                {isOtExceeded && (
                                  <span className="text-[10px] text-red-600 font-bold mt-0.5">
                                    حداکثر {maxOt}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="px-2 py-2 text-center text-gray-500">
                            {formatNumber(item.initialWelfareRate)}%
                          </td>

                          <td className="px-2 py-2 text-center bg-primary-50/40">
                            {isReadOnly ? (
                              <span className={`font-bold ${isWelfareExceeded ? 'text-red-600' : 'text-primary-800'}`}>
                                {formatNumber(item.adjustedWelfareRate)}%
                              </span>
                            ) : (
                              <div className="flex flex-col items-center">
                                <input
                                  type="number"
                                  step="1"
                                  min="0"
                                  max="100"
                                  disabled={item.isExcluded}
                                  value={item.adjustedWelfareRate ?? ''}
                                  onChange={(e) =>
                                    handleRateChange(
                                      item.id,
                                      'adjustedWelfareRate',
                                      e.target.value === '' ? null : parseFloat(e.target.value)
                                    )
                                  }
                                  className={`w-16 px-2 py-1 text-center font-bold text-xs bg-white border rounded focus:ring-2 focus:outline-none ${
                                    isWelfareExceeded
                                      ? 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-300'
                                      : 'border-primary-300 focus:ring-primary-500'
                                  }`}
                                />
                                {isWelfareExceeded && (
                                  <span className="text-[10px] text-red-600 font-bold mt-0.5">
                                    حداکثر ۱۰۰٪
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="px-3 py-2 text-left font-semibold text-gray-900">
                            {formatNumber(item.calculatedOvertimeAmount)}
                          </td>

                          <td className="px-3 py-2 text-left font-semibold text-gray-900">
                            {formatNumber(item.calculatedWelfareAmount)}
                          </td>
                        </>
                      )}

                      {isBonus && (
                        <>
                          <td className="px-3 py-2 text-center">
                            <div className="font-bold text-xs text-gray-900">
                              {item.positionTitle || 'حسابرس'}
                            </div>
                            <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded bg-purple-100 text-purple-800 mt-0.5">
                              {item.positionTierDisplayName || 'سایر کارکنان'}
                            </span>
                            {item.maxBonusLimit && (
                              <div className="text-[10px] text-gray-500 mt-0.5">
                                سقف: {formatNumber(item.maxBonusLimit)} ریال
                              </div>
                            )}
                          </td>

                          <td className="px-3 py-2 text-left bg-purple-50/40">
                            {isReadOnly ? (
                              <span className={`font-bold ${isBonusExceeded ? 'text-red-600' : 'text-gray-900'}`}>
                                {formatNumber(item.adjustedBonusAmount ?? item.baseBonusAmount)}
                              </span>
                            ) : (
                              <div className="flex flex-col">
                                <input
                                  type="number"
                                  step="100000"
                                  min="0"
                                  max={item.maxBonusLimit ?? undefined}
                                  disabled={item.isExcluded}
                                  value={item.adjustedBonusAmount ?? item.baseBonusAmount ?? ''}
                                  onChange={(e) =>
                                    handleRateChange(
                                      item.id,
                                      'adjustedBonusAmount',
                                      e.target.value === '' ? null : parseFloat(e.target.value)
                                    )
                                  }
                                  className={`w-32 px-2 py-1 text-left font-bold text-xs bg-white border rounded focus:ring-2 focus:outline-none ${
                                    isBonusExceeded
                                      ? 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-300'
                                      : 'border-purple-300 focus:ring-purple-500'
                                  }`}
                                />
                                {isBonusExceeded && (
                                  <span className="text-[10px] text-red-600 font-bold mt-0.5">
                                    بیش از سقف سمت ({formatNumber(item.maxBonusLimit)})
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        </>
                      )}

                      <td className="px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          disabled={isReadOnly}
                          checked={item.isExcluded}
                          onChange={(e) => handleRateChange(item.id, 'isExcluded', e.target.checked)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>

                      <td className="px-3 py-2">
                        {isReadOnly ? (
                          <span className="text-gray-600">{item.officerNotes || '—'}</span>
                        ) : (
                          <input
                            type="text"
                            placeholder="توضیح دلایل تغییر نرخ..."
                            value={item.officerNotes ?? ''}
                            onChange={(e) => handleRateChange(item.id, 'officerNotes', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-primary-500 focus:outline-none"
                          />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Actions Toolbar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="w-full sm:w-1/2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              یادداشت و توضیحات رییس اداره به معاونت
            </label>
            <input
              type="text"
              disabled={isReadOnly}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value)
                setIsDirty(true)
              }}
              placeholder="توضیحات کلی در خصوص مبالغ این ماه..."
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full sm:w-auto justify-end">
            {!isReadOnly && (
              <>
                <button
                  onClick={handleSaveDraft}
                  disabled={saving || !isDirty}
                  className="px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-40"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-amber-600" />}
                  ذخیره موقت پیش‌نویس
                </button>

                <div className="flex flex-col items-end">
                  <button
                    onClick={handleSubmitFinal}
                    disabled={submitting || !canSubmit}
                    className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!canSubmit ? 'به دلیل تخطی از سقف‌های بودجه یا سقف‌های فردی غیرفعال است' : 'ارسال نهایی به معاونت'}
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    ارسال نهایی به معاونت اداره
                  </button>
                  {!canSubmit && (
                    <span className="text-[10px] text-red-600 font-bold mt-1">
                      سقف‌های بودجه یا فردی رعایت نشده است
                    </span>
                  )}
                </div>
              </>
            )}

            {canReview && dept.status === 'Submitted' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleReview(true, 'Deputy')}
                  disabled={reviewing}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                  title="تایید در مرحله معاونت اداره و ارجاع به دفتر مدیریت"
                >
                  {reviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  تایید معاونت اداره و ارجاع به مدیریت
                </button>
                <button
                  onClick={() => setRejectModalOpen(true)}
                  disabled={reviewing}
                  className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                  title="عدم تایید و عودت جهت اصلاح به رییس اداره"
                >
                  <XCircle className="w-4 h-4" />
                  عدم تایید و عودت جهت اصلاح
                </button>
              </div>
            )}

            {canReview && dept.status === 'DeputyApproved' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleReview(true, 'Manager')}
                  disabled={reviewing}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                  title="تایید نهایی دفتر مدیریت"
                >
                  {reviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  تایید نهایی دفتر مدیریت
                </button>
                <button
                  onClick={() => setRejectModalOpen(true)}
                  disabled={reviewing}
                  className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                  title="عدم تایید و عودت جهت اصلاح"
                >
                  <XCircle className="w-4 h-4" />
                  عدم تایید و عودت جهت اصلاح
                </button>
              </div>
            )}

            {canReview && dept.status === 'Approved' && (
              <button
                onClick={() => setRejectModalOpen(true)}
                disabled={reviewing}
                className="px-4 py-2.5 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-700 border border-gray-300 hover:border-red-200 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                title="عودت پرونده جهت اصلاح مجدد"
              >
                <XCircle className="w-4 h-4" />
                عودت پرونده جهت اصلاح مجدد
              </button>
            )}

            {isReadOnly && !canReview && (
              <span className="text-xs text-gray-500 italic">
                کاربرگ در حالت فقط خواندنی قرار دارد ({statusInfo.label}).
              </span>
            )}
          </div>
        </div>

        {/* Rejection Modal */}
        {rejectModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  عدم تایید و عودت جهت اصلاح: {dept.departmentName}
                </h3>
                <button
                  onClick={() => setRejectModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!rejectionReason.trim()) {
                    alert('لطفاً دلیل عدم تایید را وارد نمایید.')
                    return
                  }
                  handleReview(false)
                }}
                className="space-y-4"
              >
                <p className="text-xs text-gray-500 leading-relaxed">
                  با ثبت عودت، کاربرگ به وضعیت «نیازمند اصلاح» تغییر یافته و رییس اداره می‌تواند پس از اعمال اصلاحات لازم، مجدداً آن را ارسال نماید.
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
                    placeholder="مثال: سقف ساعت اضافه کار پرسنل واحد ... رعایت نشده است؛ لطفاً اصلاح گردد."
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setRejectModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={reviewing}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {reviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    ثبت عودت به اداره
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
