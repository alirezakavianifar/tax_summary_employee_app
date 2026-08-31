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
    // If submitted or approved, only Admin can edit or officer must wait for rejection
    if (dept.status === 'Approved') return true
    if (dept.status === 'Submitted' && user?.role !== 'Admin') return true
    return false
  }, [dept, user])

  // Real-time calculation helpers
  const handleRateChange = (
    itemId: string,
    field: 'adjustedOvertimeRate' | 'adjustedWelfareRate' | 'officerNotes' | 'isExcluded',
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
    return items.reduce((sum, i) => sum + (i.calculatedOvertimeAmount || 0), 0)
  }, [items])

  const totalWelfareLive = useMemo(() => {
    return items.reduce((sum, i) => sum + (i.calculatedWelfareAmount || 0), 0)
  }, [items])

  const handleSaveDraft = async () => {
    const payloadItems: UpdateEmployeeItemAdjustmentDto[] = items.map((i) => ({
      id: i.id,
      adjustedOvertimeRate: i.adjustedOvertimeRate,
      adjustedWelfareRate: i.adjustedWelfareRate,
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
    if (
      !confirm(
        'آیا از ارسال نهایی اطلاعات به مدیریت اطمینان دارید؟ پس از ارسال، کاربرگ شما قفل خواهد شد.'
      )
    )
      return

    const payloadItems: UpdateEmployeeItemAdjustmentDto[] = items.map((i) => ({
      id: i.id,
      adjustedOvertimeRate: i.adjustedOvertimeRate,
      adjustedWelfareRate: i.adjustedWelfareRate,
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
      alert('کاربرگ اداره با موفقیت ارسال شد و در انتظار تایید مدیریت قرار گرفت.')
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

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items
    const term = searchTerm.trim().toLowerCase()
    return items.filter(
      (i) =>
        i.personnelNumber.toLowerCase().includes(term) ||
        i.employeeName.toLowerCase().includes(term)
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
                <strong>علت عدم تایید:</strong> {dept.rejectionReason}
              </p>
              <p className="text-xs mt-1 text-red-600">
                لطفاً پس از اعمال اصلاحات، مجدداً دکمه «ارسال نهایی به مدیریت» را بزنید.
              </p>
            </div>
          </div>
        )}

        {dept.status === 'Approved' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span className="text-sm font-medium">
              کاربرگ این اداره توسط مدیریت تایید نهایی شده است.
            </span>
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
                تکمیل و بازبینی ساعت/نرخ اضافه کار و درصد رفاهی کارکنان اداره
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <span className="text-xs text-gray-500 block mb-1">تعداد کارکنان اداره</span>
              <span className="text-xl font-bold text-gray-900">{formatNumber(dept.employeeCount)} نفر</span>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <span className="text-xs text-gray-500 block mb-1">سرانه اضافه کار مصوب</span>
              <span className="text-lg font-bold text-gray-900">
                {dept.baseOvertimeCap ? `${formatNumber(dept.baseOvertimeCap)} ریال` : '—'}
              </span>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <span className="text-xs text-gray-500 block mb-1">مجموع اضافه کار محاسبه شده</span>
              <span className="text-lg font-bold text-primary-700">
                {formatNumber(totalOvertimeLive)} ریال
              </span>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <span className="text-xs text-gray-500 block mb-1">مجموع رفاهی محاسبه شده</span>
              <span className="text-lg font-bold text-emerald-700">
                {formatNumber(totalWelfareLive)} ریال
              </span>
            </div>
          </div>
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
                  <th className="px-3 py-3">نام و نام خانوادگی</th>
                  {!isBonus && (
                    <>
                      <th className="px-2 py-3 text-center">نرخ پایه</th>
                      <th className="px-2 py-3 text-center bg-primary-100/60 font-black">
                        نرخ اضافه کار نهایی
                      </th>
                      <th className="px-2 py-3 text-center">رفاهی پایه</th>
                      <th className="px-2 py-3 text-center bg-primary-100/60 font-black">
                        درصد رفاهی نهایی
                      </th>
                      <th className="px-3 py-3 text-left">مبلغ اضافه کار (ریال)</th>
                      <th className="px-3 py-3 text-left">مبلغ رفاهی (ریال)</th>
                    </>
                  )}
                  {isBonus && <th className="px-3 py-3 text-left">سرانه پاداش (ریال)</th>}
                  <th className="px-2 py-3 text-center">محروم</th>
                  <th className="px-3 py-3">توضیحات و دلایل اصلاح</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredItems.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`${item.isExcluded ? 'bg-gray-100 text-gray-400' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-primary-50/30 transition-colors`}
                  >
                    <td className="px-3 py-2 font-mono font-medium text-gray-900">
                      {item.personnelNumber}
                    </td>

                    <td className="px-3 py-2 font-medium text-gray-900">{item.employeeName}</td>

                    {!isBonus && (
                      <>
                        <td className="px-2 py-2 text-center text-gray-500">
                          {formatNumber(item.initialOvertimeRate)}
                        </td>

                        <td className="px-2 py-2 text-center bg-primary-50/40">
                          {isReadOnly ? (
                            <span className="font-bold text-primary-800">
                              {formatNumber(item.adjustedOvertimeRate)}
                            </span>
                          ) : (
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="10"
                              disabled={item.isExcluded}
                              value={item.adjustedOvertimeRate ?? ''}
                              onChange={(e) =>
                                handleRateChange(
                                  item.id,
                                  'adjustedOvertimeRate',
                                  e.target.value === '' ? null : parseFloat(e.target.value)
                                )
                              }
                              className="w-16 px-2 py-1 text-center font-bold text-xs bg-white border border-primary-300 rounded focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            />
                          )}
                        </td>

                        <td className="px-2 py-2 text-center text-gray-500">
                          {formatNumber(item.initialWelfareRate)}%
                        </td>

                        <td className="px-2 py-2 text-center bg-primary-50/40">
                          {isReadOnly ? (
                            <span className="font-bold text-primary-800">
                              {formatNumber(item.adjustedWelfareRate)}%
                            </span>
                          ) : (
                            <input
                              type="number"
                              step="1"
                              min="0"
                              max="200"
                              disabled={item.isExcluded}
                              value={item.adjustedWelfareRate ?? ''}
                              onChange={(e) =>
                                handleRateChange(
                                  item.id,
                                  'adjustedWelfareRate',
                                  e.target.value === '' ? null : parseFloat(e.target.value)
                                )
                              }
                              className="w-16 px-2 py-1 text-center font-bold text-xs bg-white border border-primary-300 rounded focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            />
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
                      <td className="px-3 py-2 text-left font-semibold text-gray-900">
                        {formatNumber(item.baseBonusAmount)}
                      </td>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Actions Toolbar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="w-full sm:w-1/2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              یادداشت و توضیحات رییس اداره به مدیریت
            </label>
            <input
              type="text"
              disabled={isReadOnly}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value)
                setIsDirty(true)
              }}
              placeholder="توضیحات کلی در خصوص اضافه کار این ماه..."
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
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

                <button
                  onClick={handleSubmitFinal}
                  disabled={submitting}
                  className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  ارسال نهایی به مدیریت
                </button>
              </>
            )}

            {isReadOnly && (
              <span className="text-xs text-gray-500 italic">
                کاربرگ در حالت فقط خواندنی قرار دارد ({statusInfo.label}).
              </span>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
