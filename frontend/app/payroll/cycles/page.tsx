'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useMenuSettings } from '@/contexts/MenuSettingsContext'
import {
  payrollCyclesApi,
  CYCLE_STATUS_LABELS,
  type PayrollCycleSummaryDto,
} from '@/lib/api/payrollCycles'
import { PROCESS_TYPE_LABELS } from '@/lib/api/payroll'
import ShamsiDatePicker from '@/components/ShamsiDatePicker'
import { PERSIAN_MONTH_NAMES, getTodayJalali } from '@/lib/jalali'
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
  Sparkles,
  Shield,
  Lock,
  Search,
  Filter,
  X,
  Copy,
  Check,
  Hash,
  RefreshCw,
  BarChart3,
  Layers,
  ArrowUpDown,
} from 'lucide-react'

function formatNumber(v: number | null | undefined): string {
  if (v == null) return '—'
  return v.toLocaleString('fa-IR')
}

function getDefaultCycleTitle(processType: string, year: number, month: number): string {
  const monthName = PERSIAN_MONTH_NAMES[month - 1] || `ماه ${month}`
  const monthWithSuffix = `${monthName}‌ماه`

  if (processType === 'HalfPercentBonus') {
    return `پردازش نیم‌درصد و پاداش ${monthWithSuffix} ${year}`
  }
  if (processType === 'OvertimeWelfareMonetary') {
    return `محاسبه اضافه کار و رفاهی مبلغی ${monthWithSuffix} ${year}`
  }
  return `محاسبه اضافه کار و رفاهی ${monthWithSuffix} ${year}`
}

export default function PayrollCyclesPage() {
  const { user } = useAuth()
  const { isActionVisible, isModuleVisible, settings } = useMenuSettings()
  const router = useRouter()
  const [cycles, setCycles] = useState<PayrollCycleSummaryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Search, Filter & Sort states
  const [searchQuery, setSearchQuery] = useState('')
  const [filterYear, setFilterYear] = useState<string>('ALL')
  const [filterMonth, setFilterMonth] = useState<string>('ALL')
  const [filterProcessType, setFilterProcessType] = useState<string>('ALL')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<'createdAt' | 'fiscalPeriod' | 'title' | 'cycleCode'>('createdAt')
  const [sortDescending, setSortDescending] = useState(true)

  // Copy CycleCode feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const copyCycleCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // Current Shamsi date for auto-filling
  const currentJalali = useMemo(() => getTodayJalali(), [])

  // Form states for new cycle modal
  const [processType, setProcessType] = useState('OvertimeWelfareRated')
  const [fiscalYear, setFiscalYear] = useState<number>(currentJalali.jy)
  const [fiscalMonth, setFiscalMonth] = useState<number>(currentJalali.jm)
  const [title, setTitle] = useState<string>(() =>
    getDefaultCycleTitle('OvertimeWelfareRated', currentJalali.jy, currentJalali.jm)
  )
  const [isTitleManual, setIsTitleManual] = useState(false)
  const [deadline, setDeadline] = useState('')
  const [notes, setNotes] = useState('')

  // Live Modal Cycle Code Preview & Duplicate check
  const samePeriodExistingCycles = useMemo(() => {
    return cycles.filter(
      (c) => c.fiscalYear === fiscalYear && c.fiscalMonth === fiscalMonth && c.processType === processType
    )
  }, [cycles, fiscalYear, fiscalMonth, processType])

  const modalPreviewCode = useMemo(() => {
    const prefix =
      processType === 'OvertimeWelfareRated'
        ? 'OWR'
        : processType === 'OvertimeWelfareMonetary'
        ? 'OWM'
        : processType === 'HalfPercentBonus'
        ? 'HPB'
        : 'GEN'
    const nextSeq = samePeriodExistingCycles.length + 1
    return `PAY-${fiscalYear}${String(fiscalMonth).padStart(2, '0')}-${prefix}-${String(nextSeq).padStart(2, '0')}`
  }, [processType, fiscalYear, fiscalMonth, samePeriodExistingCycles.length])

  // KPI Summary Statistics across all loaded cycles
  const stats = useMemo(() => {
    const totalCycles = cycles.length
    const openCycles = cycles.filter((c) => c.status === 'OpenForSubmission').length
    const underReviewCycles = cycles.filter((c) => c.status === 'UnderReview').length
    const finalizedCycles = cycles.filter((c) => c.status === 'Finalized').length
    const totalDepts = cycles.reduce((sum, c) => sum + (c.totalDepartments || 0), 0)
    const submittedDepts = cycles.reduce((sum, c) => sum + (c.submittedDepartments || 0), 0)
    const overallSubmissionRate = totalDepts > 0 ? Math.round((submittedDepts / totalDepts) * 100) : 0
    const totalEmployees = cycles.reduce((sum, c) => sum + (c.totalEmployees || 0), 0)
    const totalOvertime = cycles.reduce((sum, c) => sum + (c.totalOvertimeAmount || 0), 0)
    const totalBonus = cycles.reduce((sum, c) => sum + (c.totalBonusAmount || 0), 0)

    return {
      totalCycles,
      openCycles,
      underReviewCycles,
      finalizedCycles,
      totalDepts,
      submittedDepts,
      overallSubmissionRate,
      totalEmployees,
      totalOvertime,
      totalBonus,
    }
  }, [cycles])

  // Distinct available fiscal years
  const availableYears = useMemo(() => {
    const years = new Set<number>()
    years.add(currentJalali.jy)
    cycles.forEach((c) => {
      if (c.fiscalYear) years.add(c.fiscalYear)
    })
    return Array.from(years).sort((a, b) => b - a)
  }, [cycles, currentJalali.jy])

  // Filtered & Sorted Cycles list
  const filteredCycles = useMemo(() => {
    return cycles
      .filter((c) => {
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase()
          const matchTitle = c.title?.toLowerCase().includes(q)
          const matchCode = c.cycleCode?.toLowerCase().includes(q)
          const matchCreatedBy = c.createdByUsername?.toLowerCase().includes(q)
          if (!matchTitle && !matchCode && !matchCreatedBy) return false
        }
        if (filterYear !== 'ALL' && c.fiscalYear !== Number(filterYear)) {
          return false
        }
        if (filterMonth !== 'ALL' && c.fiscalMonth !== Number(filterMonth)) {
          return false
        }
        if (filterProcessType !== 'ALL' && c.processType !== filterProcessType) {
          return false
        }
        if (filterStatus !== 'ALL' && c.status !== filterStatus) {
          return false
        }
        return true
      })
      .sort((a, b) => {
        let comparison = 0
        if (sortBy === 'fiscalPeriod') {
          comparison = a.fiscalYear !== b.fiscalYear ? a.fiscalYear - b.fiscalYear : a.fiscalMonth - b.fiscalMonth
        } else if (sortBy === 'title') {
          comparison = (a.title || '').localeCompare(b.title || '')
        } else if (sortBy === 'cycleCode') {
          comparison = (a.cycleCode || '').localeCompare(b.cycleCode || '')
        } else {
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        }
        return sortDescending ? -comparison : comparison
      })
  }, [cycles, searchQuery, filterYear, filterMonth, filterProcessType, filterStatus, sortBy, sortDescending])

  const isFilterActive =
    searchQuery.trim() !== '' ||
    filterYear !== 'ALL' ||
    filterMonth !== 'ALL' ||
    filterProcessType !== 'ALL' ||
    filterStatus !== 'ALL' ||
    sortBy !== 'createdAt' ||
    !sortDescending

  const resetFilters = () => {
    setSearchQuery('')
    setFilterYear('ALL')
    setFilterMonth('ALL')
    setFilterProcessType('ALL')
    setFilterStatus('ALL')
    setSortBy('createdAt')
    setSortDescending(true)
  }

  const handleProcessTypeChange = (newType: string) => {
    setProcessType(newType)
    if (!isTitleManual) {
      setTitle(getDefaultCycleTitle(newType, fiscalYear, fiscalMonth))
    }
  }

  const handleFiscalYearChange = (newYear: number) => {
    setFiscalYear(newYear)
    if (!isTitleManual) {
      setTitle(getDefaultCycleTitle(processType, newYear, fiscalMonth))
    }
  }

  const handleFiscalMonthChange = (newMonth: number) => {
    setFiscalMonth(newMonth)
    if (!isTitleManual) {
      setTitle(getDefaultCycleTitle(processType, fiscalYear, newMonth))
    }
  }

  const handleAutoFillTitle = () => {
    setIsTitleManual(false)
    setTitle(getDefaultCycleTitle(processType, fiscalYear, fiscalMonth))
  }

  const openNewCycleModal = () => {
    if (!title.trim() || !isTitleManual) {
      const t = getTodayJalali()
      setFiscalYear(t.jy)
      setFiscalMonth(t.jm)
      setTitle(getDefaultCycleTitle(processType, t.jy, t.jm))
      setIsTitleManual(false)
    }
    setIsModalOpen(true)
  }

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
      // Reset fields with current Shamsi defaults
      const t = getTodayJalali()
      setFiscalYear(t.jy)
      setFiscalMonth(t.jm)
      setProcessType('OvertimeWelfareRated')
      setTitle(getDefaultCycleTitle('OvertimeWelfareRated', t.jy, t.jm))
      setIsTitleManual(false)
      setDeadline('')
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

  const cycleCreateSetting = useMemo(() => {
    return settings.find((s) => s.menuKey.toLowerCase() === 'action_payroll_create_cycle')
  }, [settings])

  const isCreationSuspended = cycleCreateSetting?.isVisible === false

  const canCreateCycle =
    !isCreationSuspended &&
    (isAdmin ||
      isActionVisible('action_payroll_create_cycle', 'module_payroll') ||
      isActionVisible('/payroll/cycles/create', 'module_payroll'))

  const canDeleteCycle =
    isAdmin ||
    isActionVisible('action_payroll_delete_cycle', 'module_payroll') ||
    isActionVisible('/payroll/cycles/delete', 'module_payroll')

  return (
    <ProtectedRoute requiredModule="module_payroll">
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

          <div className="flex items-center gap-3 flex-wrap">
            {isAdmin && (
              <Link
                href="/admin/menu-settings?highlight=action_payroll_create_cycle"
                className="inline-flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3 py-2 rounded-lg font-medium shadow-xs transition-colors text-xs"
                title="پیکربندی دسترسی نقش‌ها به تعریف دوره جدید"
              >
                <Shield className="w-4 h-4 text-purple-600" />
                <span>پیکربندی دسترسی</span>
              </Link>
            )}

            <Link
              href="/payroll/my-department"
              className="inline-flex items-center gap-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors text-sm"
            >
              <Building2 className="w-4 h-4 text-primary-600" />
              ورود به کارپوشه اداره من
            </Link>

            {canCreateCycle && (
              <button
                onClick={openNewCycleModal}
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                تعریف دوره جدید
              </button>
            )}
          </div>
        </div>

        {/* Administrative Period Creation Suspension Notice */}
        {isCreationSuspended && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-center justify-between text-xs font-medium shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                امکان تعریف دوره جدید در حال حاضر توسط مدیر ارشد غیرفعال (مسدود) شده است.
                {isAdmin && ' (شما به عنوان مدیر ارشد می‌توانید از دکمه پیکربندی دسترسی، وضعیت را مجدداً فعال نمایید)'}
              </span>
            </div>
            {isAdmin && (
              <Link
                href="/admin/menu-settings?highlight=action_payroll_create_cycle"
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shrink-0 mr-3"
              >
                مدیریت و رفع مسدودی
              </Link>
            )}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* KPI Summary Statistics Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Card 1: Total Cycles */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">کل دوره‌های پردازش</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalCycles)}</span>
                <span className="text-xs text-gray-400">دوره</span>
              </div>
            </div>
            <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Open Cycles */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">در حال دریافت و فعال</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-blue-600">{formatNumber(stats.openCycles)}</span>
                <span className="text-xs text-blue-500">دوره جاری</span>
              </div>
            </div>
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Overall Department Submission Rate */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">پیشرفت تجمیعی ادارات</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-emerald-600">
                  {formatNumber(stats.overallSubmissionRate)}٪
                </span>
                <span className="text-xs text-gray-400">
                  ({formatNumber(stats.submittedDepts)} از {formatNumber(stats.totalDepts)})
                </span>
              </div>
            </div>
            <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: Total Employees Covered */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">مجموع کارکنان تحت پوشش</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-purple-600">{formatNumber(stats.totalEmployees)}</span>
                <span className="text-xs text-gray-400">نفر</span>
              </div>
            </div>
            <div className="w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs mb-6">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو بر اساس عنوان دوره، شناسه یکتا (PAY-...)، کاربر ثبت‌کننده..."
                className="w-full pr-9 pl-8 py-2 text-xs md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                  title="پاک کردن متن جستجو"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filters Group */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {/* Year Filter */}
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="border border-gray-300 rounded-lg px-2.5 py-2 text-xs text-gray-700 bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none cursor-pointer"
                title="فیلتر سال مالی"
              >
                <option value="ALL">همه سال‌ها</option>
                {availableYears.map((y) => (
                  <option key={y} value={y.toString()}>
                    سال {y}
                  </option>
                ))}
              </select>

              {/* Month Filter */}
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="border border-gray-300 rounded-lg px-2.5 py-2 text-xs text-gray-700 bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none cursor-pointer"
                title="فیلتر ماه مالی"
              >
                <option value="ALL">همه ماه‌ها</option>
                {PERSIAN_MONTH_NAMES.map((name, i) => (
                  <option key={i + 1} value={(i + 1).toString()}>
                    {name} ({i + 1})
                  </option>
                ))}
              </select>

              {/* Process Type Filter */}
              <select
                value={filterProcessType}
                onChange={(e) => setFilterProcessType(e.target.value)}
                className="border border-gray-300 rounded-lg px-2.5 py-2 text-xs text-gray-700 bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none cursor-pointer"
                title="نوع فرآیند"
              >
                <option value="ALL">همه انواع فرآیند</option>
                <option value="OvertimeWelfareRated">اضافه کار و رفاهی (نرخی)</option>
                <option value="OvertimeWelfareMonetary">اضافه کار و رفاهی مبلغی</option>
                <option value="HalfPercentBonus">پاداش نیم درصد</option>
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-2.5 py-2 text-xs text-gray-700 bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none cursor-pointer"
                title="وضعیت دوره"
              >
                <option value="ALL">همه وضعیت‌ها</option>
                <option value="OpenForSubmission">در حال دریافت اطلاعات</option>
                <option value="UnderReview">در حال بررسی</option>
                <option value="Finalized">نهایی شده</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-2.5 py-2 text-xs text-gray-700 bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none cursor-pointer"
                title="مرتب‌سازی بر اساس"
              >
                <option value="createdAt">تاریخ ثبت</option>
                <option value="fiscalPeriod">دوره مالی (سال/ماه)</option>
                <option value="title">عنوان دوره</option>
                <option value="cycleCode">شناسه یکتا (Cycle Code)</option>
              </select>

              {/* Sort Order Button */}
              <button
                type="button"
                onClick={() => setSortDescending(!sortDescending)}
                className={`p-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600 transition-colors ${
                  !sortDescending ? 'bg-primary-50 text-primary-600 border-primary-300' : ''
                }`}
                title={sortDescending ? 'نزولی (جدیدترین به قدیمی‌ترین)' : 'صعودی (قدیمی‌ترین به جدیدترین)'}
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={loadCycles}
                disabled={loading}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-50"
                title="بروزرسانی داده‌ها"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {/* Reset Filters */}
              {isFilterActive && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-2.5 py-2 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1"
                  title="پاک کردن تمامی فیلترها و بازنشانی"
                >
                  <X className="w-3.5 h-3.5" />
                  پاکسازی فیلترها
                </button>
              )}
            </div>
          </div>

          {/* Results Counter Bar */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
            <span>
              نمایش <strong className="text-gray-800 font-semibold">{formatNumber(filteredCycles.length)}</strong> دوره از مجموع{' '}
              <strong className="text-gray-800 font-semibold">{formatNumber(cycles.length)}</strong> دوره ثبت شده
            </span>
            {isFilterActive && (
              <span className="text-primary-600 font-medium">فیلترهای جستجو فعال هستند</span>
            )}
          </div>
        </div>

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
            {canCreateCycle && (
              <button
                onClick={openNewCycleModal}
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                تعریف دوره جدید
              </button>
            )}
          </div>
        ) : filteredCycles.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">هیچ دوره‌ای با فیلترهای انتخابی یافت نشد</h3>
            <p className="text-sm text-gray-500 mb-6">
              می‌توانید عبارت جستجو یا فیلترهای اعمال‌شده را تغییر دهید تا نتایج نمایش داده شوند.
            </p>
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              <X className="w-4 h-4" />
              پاکسازی فیلترها و مشاهده همه
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCycles.map((cycle) => {
              const statusInfo = CYCLE_STATUS_LABELS[cycle.status] || {
                label: cycle.status,
                color: 'bg-gray-100 text-gray-700 border-gray-200',
              }
              const percentSubmitted =
                cycle.totalDepartments > 0
                  ? Math.round((cycle.submittedDepartments / cycle.totalDepartments) * 100)
                  : 0

              const displayCode = cycle.cycleCode || 'PAY-LEGACY'
              const isCopied = copiedCode === displayCode

              return (
                <div
                  key={cycle.id}
                  onClick={() => router.push(`/payroll/cycles/${cycle.id}`)}
                  className="bg-white rounded-xl border border-gray-200 hover:border-primary-400 hover:shadow-md transition-all cursor-pointer p-5 flex flex-col justify-between group"
                >
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        {/* Process Type & Cycle Code Badges */}
                        <div className="flex items-center gap-1.5 flex-wrap mb-2">
                          <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                            {PROCESS_TYPE_LABELS[cycle.processType] || cycle.processType}
                          </span>

                          {/* Monospace CycleCode Badge with copy button */}
                          <div
                            onClick={(e) => copyCycleCode(displayCode, e)}
                            title="کلیک جهت کپی شناسه یکتای دوره"
                            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-100 px-2 py-0.5 rounded font-mono text-[11px] font-semibold tracking-wider transition-colors border border-slate-700 cursor-pointer select-none"
                          >
                            <Hash className="w-3 h-3 text-amber-400" />
                            <span>{displayCode}</span>
                            {isCopied ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400 group-hover:text-slate-200" />
                            )}
                          </div>
                        </div>

                        <h3 className="text-base font-bold text-gray-900 mt-1 hover:text-primary-600 transition-colors line-clamp-2">
                          {cycle.title}
                        </h3>
                      </div>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 ${statusInfo.color}`}
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
                        {cycle.createdByUsername && (
                          <span className="text-gray-400">({cycle.createdByUsername})</span>
                        )}
                      </div>
                      {cycle.deadline && (
                        <div className="flex items-center gap-1.5 text-amber-600 font-medium">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>مهلت ارسال: {new Date(cycle.deadline).toLocaleDateString('fa-IR')}</span>
                        </div>
                      )}
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

                    {canDeleteCycle && (
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      عنوان دوره محاسبه <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoFillTitle}
                      className="text-xs text-primary-600 hover:text-primary-800 flex items-center gap-1 font-medium transition-colors"
                      title="تولید خودکار عنوان بر اساس ماه و نوع فرآیند"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      تکمیل خودکار عنوان
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value)
                      setIsTitleManual(true)
                    }}
                    placeholder={`مثال: ${getDefaultCycleTitle(processType, fiscalYear, fiscalMonth)}`}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">نوع فرآیند</label>
                    <select
                      value={processType}
                      onChange={(e) => handleProcessTypeChange(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none cursor-pointer"
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
                      onChange={(e) => handleFiscalYearChange(parseInt(e.target.value) || currentJalali.jy)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ماه</label>
                    <select
                      value={fiscalMonth}
                      onChange={(e) => handleFiscalMonthChange(parseInt(e.target.value) || 1)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none cursor-pointer"
                    >
                      {PERSIAN_MONTH_NAMES.map((name, i) => (
                        <option key={i + 1} value={i + 1}>
                          ماه {i + 1} ({name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">مهلت ارسال ادارات (اختیاری)</label>
                  <ShamsiDatePicker
                    value={deadline}
                    onChange={(val) => setDeadline(val)}
                    placeholder="مثال: ۱۴۰۵/۰۶/۱۵"
                  />
                </div>

                {/* Unique CycleCode Live Preview & Duplicate Detection */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-primary-600" />
                      <span className="text-xs font-semibold text-slate-700">شناسه یکتای سیستمی دوره (Cycle Code):</span>
                    </div>
                    <span className="font-mono text-xs font-bold px-2.5 py-1 bg-slate-900 text-amber-400 rounded-md border border-slate-700 tracking-wider shadow-xs self-start sm:self-auto">
                      {modalPreviewCode}
                    </span>
                  </div>

                  {samePeriodExistingCycles.length > 0 ? (
                    <div className="text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-3 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <span className="font-bold">ثبت دوره تکمیلی/مجدد برای این ماه:</span> قبلاً برای این ماه و نوع فرآیند،{' '}
                        <strong>{samePeriodExistingCycles.length} دوره</strong> در سیستم ثبت شده است (
                        <span className="font-mono font-semibold">
                          {samePeriodExistingCycles.map((c) => c.cycleCode || c.title).join(', ')}
                        </span>
                        ). دوره جدید به صورت خودکار با پیشوند نسخه{' '}
                        <strong className="font-mono text-amber-800">{modalPreviewCode}</strong> (نسخه شماره{' '}
                        {samePeriodExistingCycles.length + 1}) ثبت و متمایز می‌گردد.
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      این شناسه به صورت هوشمند و یکتا جهت رهگیری کاربرگ‌ها، جستجوی تفکیکی و بایگانی سیستمی اختصاص می‌یابد.
                    </p>
                  )}
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
