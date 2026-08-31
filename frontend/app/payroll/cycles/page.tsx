'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import {
  payrollCyclesApi,
  CYCLE_STATUS_LABELS,
  type PayrollCycleSummaryDto,
} from '@/lib/api/payrollCycles'
import { PROCESS_TYPE_LABELS } from '@/lib/api/payroll'
import {
  Plus,
  Calendar,
  Building2,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ArrowLeft,
  Loader2,
  Trash2,
  ChevronRight,
  Upload,
} from 'lucide-react'

function formatNumber(v: number | null | undefined): string {
  if (v == null) return '—'
  return v.toLocaleString('fa-IR')
}

export default function PayrollCyclesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [cycles, setCycles] = useState<PayrollCycleSummaryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states for new cycle modal
  const [title, setTitle] = useState('')
  const [processType, setProcessType] = useState('OvertimeWelfareRated')
  const [fiscalYear, setFiscalYear] = useState(1405)
  const [fiscalMonth, setFiscalMonth] = useState(4)
  const [deadline, setDeadline] = useState('')
  const [notes, setNotes] = useState('')

  const ezafeRef = useRef<HTMLInputElement>(null)
  const refahiRef = useRef<HTMLInputElement>(null)
  const coefRef = useRef<HTMLInputElement>(null)
  const deptRef = useRef<HTMLInputElement>(null)
  const nimRef = useRef<HTMLInputElement>(null)

  const [ezafeName, setEzafeName] = useState<string | null>(null)
  const [refahiName, setRefahiName] = useState<string | null>(null)
  const [coefName, setCoefName] = useState<string | null>(null)
  const [deptName, setDeptName] = useState<string | null>(null)
  const [nimName, setNimName] = useState<string | null>(null)

  const loadCycles = async () => {
    setLoading(true)
    try {
      const data = await payrollCyclesApi.getCycles()
      setCycles(data)
    } catch (err: any) {
      setError(err.message || 'خطا در بارگذاری دوره‌های محاسبه')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCycles()
  }, [])

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      alert('لطفاً عنوان دوره را وارد کنید')
      return
    }

    const formData = new FormData()
    formData.append('title', title.trim())
    formData.append('processType', processType)
    formData.append('fiscalYear', fiscalYear.toString())
    formData.append('fiscalMonth', fiscalMonth.toString())
    if (deadline) formData.append('deadline', deadline)
    if (notes.trim()) formData.append('notes', notes.trim())

    if (processType === 'HalfPercentBonus') {
      if (!nimRef.current?.files?.[0] || !coefRef.current?.files?.[0] || !deptRef.current?.files?.[0]) {
        alert('لطفاً فایل‌های نیم‌درصد، ضرایب مدیر و نفر-اداره را انتخاب کنید')
        return
      }
      formData.append('nim', nimRef.current.files[0])
      formData.append('coefficients', coefRef.current.files[0])
      formData.append('deptMapping', deptRef.current.files[0])
    } else {
      if (
        !ezafeRef.current?.files?.[0] ||
        !refahiRef.current?.files?.[0] ||
        !coefRef.current?.files?.[0] ||
        !deptRef.current?.files?.[0]
      ) {
        alert('لطفاً هر ۴ فایل اکسل پایه (اضافه کار، رفاهی، ضرایب مدیر، نفر-اداره) را انتخاب کنید')
        return
      }
      formData.append('ezafe', ezafeRef.current.files[0])
      formData.append('refahi', refahiRef.current.files[0])
      formData.append('coefficients', coefRef.current.files[0])
      formData.append('deptMapping', deptRef.current.files[0])
    }

    setCreating(true)
    setError(null)
    try {
      const created = await payrollCyclesApi.createCycle(formData)
      setIsModalOpen(false)
      // Reset fields
      setTitle('')
      setNotes('')
      setEzafeName(null)
      setRefahiName(null)
      setCoefName(null)
      setDeptName(null)
      setNimName(null)
      router.push(`/payroll/cycles/${created.id}`)
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'خطا در ایجاد دوره محاسبه')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('آیا از حذف این دوره محاسبه و کلیه اطلاعات ادارات مربوطه اطمینان دارید؟')) return

    try {
      await payrollCyclesApi.deleteCycle(id)
      setCycles((prev) => prev.filter((c) => c.id !== id))
    } catch (err: any) {
      alert(err?.response?.data?.error || 'خطا در حذف دوره')
    }
  }

  const isAdmin = user?.role === 'Admin'

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-7 h-7 text-primary-600" />
              مدیریت مشارکتی دوره‌های محاسبه حقوق و اضافه کار
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              تعریف دوره‌های ماهانه، ارسال برخط اطلاعات به ادارات و تجمیع نهایی کاربرگ‌ها
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/payroll/my-department"
              className="inline-flex items-center gap-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors text-sm"
            >
              <Building2 className="w-4 h-4 text-primary-600" />
              ورود به کارپوشه اداره من
            </Link>

            {isAdmin && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                تعریف دوره جدید
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Cycles List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : cycles.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">هنوز هیچ دوره‌ای تعریف نشده است</h3>
            <p className="text-sm text-gray-500 mb-6">
              برای شروع، اولین دوره محاسبه را با بارگذاری فایل‌های پایه ایجاد کنید.
            </p>
            {isAdmin && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                تعریف دوره جدید
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cycles.map((cycle) => {
              const statusInfo = CYCLE_STATUS_LABELS[cycle.status] || {
                label: cycle.status,
                color: 'bg-gray-100 text-gray-700 border-gray-200',
              }
              const percentSubmitted =
                cycle.totalDepartments > 0
                  ? Math.round((cycle.submittedDepartments / cycle.totalDepartments) * 100)
                  : 0

              return (
                <div
                  key={cycle.id}
                  onClick={() => router.push(`/payroll/cycles/${cycle.id}`)}
                  className="bg-white rounded-xl border border-gray-200 hover:border-primary-400 hover:shadow-md transition-all cursor-pointer p-5 flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <div>
                        <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                          {PROCESS_TYPE_LABELS[cycle.processType] || cycle.processType}
                        </span>
                        <h3 className="text-base font-bold text-gray-900 mt-2 hover:text-primary-600 transition-colors">
                          {cycle.title}
                        </h3>
                      </div>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Meta info */}
                    <div className="text-xs text-gray-500 space-y-1 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>دوره مالی: {formatNumber(cycle.fiscalMonth)} / {formatNumber(cycle.fiscalYear)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>تاریخ ثبت: {new Date(cycle.createdAt).toLocaleDateString('fa-IR')}</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 mb-4">
                      <div className="flex justify-between text-xs font-medium text-gray-700 mb-1.5">
                        <span>پیشرفت ارسال ادارات</span>
                        <span className="text-primary-600 font-bold">
                          {formatNumber(cycle.submittedDepartments)} از {formatNumber(cycle.totalDepartments)} اداره ({formatNumber(percentSubmitted)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentSubmitted}%` }}
                        />
                      </div>
                    </div>

                    {/* Summary stats */}
                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-gray-100 pt-3 text-gray-600">
                      <div>
                        <span className="text-gray-400 block">تعداد کل کارکنان:</span>
                        <span className="font-semibold text-gray-800">{formatNumber(cycle.totalEmployees)} نفر</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">مبلغ اضافه کار:</span>
                        <span className="font-semibold text-gray-800">{formatNumber(cycle.totalOvertimeAmount)} ریال</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-4 text-xs">
                    <span className="text-primary-600 font-medium flex items-center gap-1">
                      ورود به داشبورد و بازبینی <ChevronRight className="w-3.5 h-3.5" />
                    </span>

                    {isAdmin && (
                      <button
                        onClick={(e) => handleDelete(cycle.id, e)}
                        className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                        title="حذف دوره"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Create Cycle Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl my-8">
              <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-5">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary-600" />
                  تعریف دوره جدید محاسبه و تفکیک خودکار ادارات
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateCycle} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    عنوان دوره محاسبه <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: محاسبه اضافه کار و رفاهی تیرماه ۱۴۰۵"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">نوع فرآیند</label>
                    <select
                      value={processType}
                      onChange={(e) => setProcessType(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    >
                      <option value="OvertimeWelfareRated">ادغام و محاسبه اضافه کار و رفاهی</option>
                      <option value="OvertimeWelfareMonetary">اضافه کار و رفاهی مبلغی</option>
                      <option value="HalfPercentBonus">پردازش نیم درصد و تجمیع پاداش</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">سال مالی</label>
                    <input
                      type="number"
                      value={fiscalYear}
                      onChange={(e) => setFiscalYear(parseInt(e.target.value) || 1405)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ماه</label>
                    <select
                      value={fiscalMonth}
                      onChange={(e) => setFiscalMonth(parseInt(e.target.value) || 1)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>
                          ماه {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">مهلت ارسال ادارات (اختیاری)</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>

                {/* File Uploaders */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    بارگذاری فایل‌های اکسل اولیه جهت تفکیک خودکار
                  </h4>
                  <p className="text-xs text-gray-500 mb-3">
                    سیستم پس از بارگذاری، سطرها را تفکیک کرده و به عنوان کارپوشه اختصاصی در اختیار رییس هر اداره قرار می‌دهد.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {processType === 'HalfPercentBonus' ? (
                      <>
                        <div
                          onClick={() => nimRef.current?.click()}
                          className="border border-dashed border-gray-300 hover:border-primary-500 hover:bg-primary-50/50 p-3 rounded-lg cursor-pointer transition-colors"
                        >
                          <span className="block text-xs font-medium text-gray-700">فایل نیم‌درصد (nim) *</span>
                          <span className="text-xs text-gray-400 truncate block mt-1">
                            {nimName ?? 'انتخاب فایل Excel'}
                          </span>
                          <input
                            ref={nimRef}
                            type="file"
                            accept=".xlsx,.xls"
                            className="hidden"
                            onChange={(e) => setNimName(e.target.files?.[0]?.name ?? null)}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div
                          onClick={() => ezafeRef.current?.click()}
                          className="border border-dashed border-gray-300 hover:border-primary-500 hover:bg-primary-50/50 p-3 rounded-lg cursor-pointer transition-colors"
                        >
                          <span className="block text-xs font-medium text-gray-700">فایل اضافه کار (ezafe) *</span>
                          <span className="text-xs text-gray-400 truncate block mt-1">
                            {ezafeName ?? 'انتخاب فایل Excel'}
                          </span>
                          <input
                            ref={ezafeRef}
                            type="file"
                            accept=".xlsx,.xls"
                            className="hidden"
                            onChange={(e) => setEzafeName(e.target.files?.[0]?.name ?? null)}
                          />
                        </div>

                        <div
                          onClick={() => refahiRef.current?.click()}
                          className="border border-dashed border-gray-300 hover:border-primary-500 hover:bg-primary-50/50 p-3 rounded-lg cursor-pointer transition-colors"
                        >
                          <span className="block text-xs font-medium text-gray-700">فایل رفاهی (refahi) *</span>
                          <span className="text-xs text-gray-400 truncate block mt-1">
                            {refahiName ?? 'انتخاب فایل Excel'}
                          </span>
                          <input
                            ref={refahiRef}
                            type="file"
                            accept=".xlsx,.xls"
                            className="hidden"
                            onChange={(e) => setRefahiName(e.target.files?.[0]?.name ?? null)}
                          />
                        </div>
                      </>
                    )}

                    <div
                      onClick={() => coefRef.current?.click()}
                      className="border border-dashed border-gray-300 hover:border-primary-500 hover:bg-primary-50/50 p-3 rounded-lg cursor-pointer transition-colors"
                    >
                      <span className="block text-xs font-medium text-gray-700">فایل ضرایب مدیر (coefficients) *</span>
                      <span className="text-xs text-gray-400 truncate block mt-1">
                        {coefName ?? 'انتخاب فایل Excel'}
                      </span>
                      <input
                        ref={coefRef}
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={(e) => setCoefName(e.target.files?.[0]?.name ?? null)}
                      />
                    </div>

                    <div
                      onClick={() => deptRef.current?.click()}
                      className="border border-dashed border-gray-300 hover:border-primary-500 hover:bg-primary-50/50 p-3 rounded-lg cursor-pointer transition-colors"
                    >
                      <span className="block text-xs font-medium text-gray-700">فایل نفر-اداره (deptMapping) *</span>
                      <span className="text-xs text-gray-400 truncate block mt-1">
                        {deptName ?? 'انتخاب فایل Excel'}
                      </span>
                      <input
                        ref={deptRef}
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={(e) => setDeptName(e.target.files?.[0]?.name ?? null)}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">یادداشت / توضیحات مدیر (اختیاری)</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="توضیحات یا دستورالعمل مربوط به این دوره برای روسای ادارات..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        در حال تفکیک و ایجاد دوره...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        ایجاد دوره و ارسال به ادارات
                      </>
                    )}
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
