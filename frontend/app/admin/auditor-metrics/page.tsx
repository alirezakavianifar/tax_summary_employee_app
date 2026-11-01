'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { auditorMetricsApi } from '@/lib/api/auditorMetrics'
import {
  AuditorPerformanceMetric,
  SaveAuditorMetricRequest,
  AuditorScorecard,
  AuditorMetricsSimulationResult,
  AuditorMetricCategory,
  AuditorMetricFormulaType,
  AuditDataSource,
} from '@/types/auditorMetrics'
import { AuditorScorecardDrawer } from '@/components/reporting/AuditorScorecardDrawer'
import { toPersianDigits } from '@/lib/jalali'
import {
  Award,
  Plus,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Edit2,
  Trash2,
  Play,
  TrendingUp,
  ShieldCheck,
  Clock,
  Briefcase,
  Layers,
  Sparkles,
  BarChart3,
  Search,
  Filter,
  Check,
  X,
  HelpCircle,
  Percent,
  Database,
} from 'lucide-react'

export default function AuditorMetricsManagementPage() {
  const [metrics, setMetrics] = useState<AuditorPerformanceMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'metrics' | 'leaderboard' | 'simulation'>('metrics')

  // Data Sources State (Built-in Sanim DB vs Uploaded Excel Reports)
  const [dataSources, setDataSources] = useState<AuditDataSource[]>([])
  const [selectedSourceId, setSelectedSourceId] = useState<string>('SYSTEM')

  // Scorecards / Leaderboard State
  const [scorecards, setScorecards] = useState<AuditorScorecard[]>([])
  const [loadingScorecards, setLoadingScorecards] = useState(false)
  const [selectedAuditorForDrawer, setSelectedAuditorForDrawer] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOfficeFilter, setSelectedOfficeFilter] = useState('all')

  // Edit / Create Modal State
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | undefined>(undefined)
  const [formData, setFormData] = useState<SaveAuditorMetricRequest>({
    metricCode: '',
    title: '',
    description: '',
    category: 1,
    formulaType: 1,
    primaryField: 'finalTax',
    secondaryField: 'assessedTax',
    multiplier: 100,
    weightPercentage: 20,
    higherIsBetter: true,
    targetValue: 85,
    warningThreshold: 70,
    criticalThreshold: 50,
    unit: '٪',
    displayOrder: 1,
    isActive: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Simulation State
  const [simulationResult, setSimulationResult] = useState<AuditorMetricsSimulationResult | null>(null)
  const [simulating, setSimulating] = useState(false)

  // Load data sources (system DB vs uploaded excel reports)
  const loadDataSources = async () => {
    try {
      const sources = await auditorMetricsApi.getDataSources()
      setDataSources(sources || [])
    } catch (err) {
      console.error('Failed to load audit data sources:', err)
    }
  }

  // Load metrics on mount
  const loadMetrics = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await auditorMetricsApi.getMetrics(true)
      setMetrics(data || [])
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'خطا در بارگذاری شاخص‌های ارزیابی')
    } finally {
      setLoading(false)
    }
  }

  // Load leaderboard / scorecards for selected data source
  const loadScorecards = async (sourceId: string = selectedSourceId) => {
    try {
      setLoadingScorecards(true)
      const data = await auditorMetricsApi.evaluateAuditors({
        reportCode: sourceId === 'SYSTEM' ? undefined : sourceId,
      })
      setScorecards(data || [])
    } catch (err: any) {
      console.error('Failed to load auditor scorecards:', err)
    } finally {
      setLoadingScorecards(false)
    }
  }

  useEffect(() => {
    loadMetrics()
    loadDataSources()
  }, [])

  useEffect(() => {
    if (activeTab === 'leaderboard' && scorecards.length === 0) {
      loadScorecards(selectedSourceId)
    }
  }, [activeTab, selectedSourceId])

  // Computed total weights
  const totalWeight = useMemo(() => {
    return metrics
      .filter((m) => m.isActive)
      .reduce((sum, m) => sum + (m.weightPercentage || 0), 0)
  }, [metrics])

  // Category helpers
  const getCategoryMeta = (cat: AuditorMetricCategory) => {
    switch (cat) {
      case 1:
        return { label: 'کیفیت و تمکین', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
      case 2:
        return { label: 'مالی و اختلاف مالیات', color: 'bg-amber-50 text-amber-700 border-amber-200' }
      case 3:
        return { label: 'سرعت و زمان‌بندی', color: 'bg-sky-50 text-sky-700 border-sky-200' }
      case 4:
        return { label: 'بهره‌وری و حجم کار', color: 'bg-purple-50 text-purple-700 border-purple-200' }
      default:
        return { label: 'عمومی', color: 'bg-slate-50 text-slate-700 border-slate-200' }
    }
  }

  const getFormulaTypeLabel = (type: AuditorMetricFormulaType) => {
    switch (type) {
      case 1:
        return 'نسبت (A / B)'
      case 2:
        return 'تفاضل (A - B)'
      case 3:
        return 'میانگین مقادیر'
      case 4:
        return 'شمارش تعداد'
      case 5:
        return 'درصد تحقق'
      case 6:
        return 'فرمول سفارشی'
      default:
        return 'نامشخص'
    }
  }

  // Toggle metric active status
  const handleToggle = async (metric: AuditorPerformanceMetric) => {
    try {
      const updated = !metric.isActive
      await auditorMetricsApi.toggleMetric(metric.id, updated)
      setMetrics((prev) =>
        prev.map((m) => (m.id === metric.id ? { ...m, isActive: updated } : m))
      )
      setSuccessMessage(`وضعیت شاخص «${metric.title}» تغییر یافت`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'خطا در تغییر وضعیت شاخص')
    }
  }

  // Open modal for Create
  const handleOpenCreate = () => {
    setIsEditing(false)
    setEditingId(undefined)
    setFormData({
      metricCode: `METRIC_${Date.now().toString().slice(-4)}`,
      title: '',
      description: '',
      category: 1,
      formulaType: 1,
      primaryField: 'finalTax',
      secondaryField: 'assessedTax',
      multiplier: 100,
      weightPercentage: 20,
      higherIsBetter: true,
      targetValue: 85,
      warningThreshold: 70,
      criticalThreshold: 50,
      unit: '٪',
      displayOrder: (metrics.length + 1) * 10,
      isActive: true,
    })
    setModalError(null)
    setShowModal(true)
  }

  // Open modal for Edit
  const handleOpenEdit = (m: AuditorPerformanceMetric) => {
    setIsEditing(true)
    setEditingId(m.id)
    setFormData({
      id: m.id,
      metricCode: m.metricCode,
      title: m.title,
      description: m.description,
      category: m.category,
      formulaType: m.formulaType,
      primaryField: m.primaryField,
      secondaryField: m.secondaryField,
      multiplier: m.multiplier,
      weightPercentage: m.weightPercentage,
      higherIsBetter: m.higherIsBetter,
      targetValue: m.targetValue,
      warningThreshold: m.warningThreshold,
      criticalThreshold: m.criticalThreshold,
      unit: m.unit,
      displayOrder: m.displayOrder,
      isActive: m.isActive,
    })
    setModalError(null)
    setShowModal(true)
  }

  // Save metric (Create / Edit)
  const handleSubmitMetric = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      setModalError('عنوان شاخص الزامی است')
      return
    }

    try {
      setIsSubmitting(true)
      setModalError(null)
      const saved = await auditorMetricsApi.saveMetric(formData)
      await loadMetrics()
      setShowModal(false)
      setSuccessMessage(isEditing ? 'شاخص با موفقیت ویرایش شد' : 'شاخص جدید با موفقیت ایجاد شد')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setModalError(err?.response?.data?.error || err.message || 'خطا در ذخیره‌سازی شاخص')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete custom metric
  const handleDeleteMetric = async (id: string, title: string) => {
    if (!window.confirm(`آیا از حذف شاخص «${title}» اطمینان دارید؟`)) return

    try {
      await auditorMetricsApi.deleteMetric(id)
      setMetrics((prev) => prev.filter((m) => m.id !== id))
      setSuccessMessage(`شاخص «${title}» حذف شد`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'خطا در حذف شاخص')
    }
  }

  // Run live simulation on modal or tab
  const handleSimulateInModal = async () => {
    try {
      setSimulating(true)
      const res = await auditorMetricsApi.simulateMetric(
        formData,
        undefined,
        selectedSourceId === 'SYSTEM' ? undefined : selectedSourceId
      )
      setSimulationResult(res)
    } catch (err: any) {
      setModalError(err?.response?.data?.error || err.message || 'خطا در اجرای شبیه‌سازی')
    } finally {
      setSimulating(false)
    }
  }

  // Auto-rebalance active weights to 100%
  const handleAutoRebalance = async () => {
    const activeMetrics = metrics.filter((m) => m.isActive)
    if (activeMetrics.length === 0) return

    const currentSum = activeMetrics.reduce((sum, m) => sum + m.weightPercentage, 0)
    if (currentSum === 0) return

    try {
      setLoading(true)
      let allocatedTotal = 0
      for (let i = 0; i < activeMetrics.length; i++) {
        const m = activeMetrics[i]
        let newWeight = Math.round((m.weightPercentage / currentSum) * 100)
        if (i === activeMetrics.length - 1) {
          newWeight = 100 - allocatedTotal
        } else {
          allocatedTotal += newWeight
        }

        await auditorMetricsApi.saveMetric({
          id: m.id,
          metricCode: m.metricCode,
          title: m.title,
          description: m.description,
          category: m.category,
          formulaType: m.formulaType,
          primaryField: m.primaryField,
          secondaryField: m.secondaryField,
          multiplier: m.multiplier,
          weightPercentage: newWeight,
          higherIsBetter: m.higherIsBetter,
          targetValue: m.targetValue,
          warningThreshold: m.warningThreshold,
          criticalThreshold: m.criticalThreshold,
          unit: m.unit,
          displayOrder: m.displayOrder,
          isActive: m.isActive,
        })
      }
      await loadMetrics()
      setSuccessMessage('اوزان شاخص‌های فعال به صورت متوازن بر روی ۱۰۰٪ تنظیم شد')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setError(err.message || 'خطا در تراز خودکار اوزان')
    } finally {
      setLoading(false)
    }
  }

  // Filtered scorecards for leaderboard tab
  const filteredScorecards = useMemo(() => {
    return scorecards.filter((sc) => {
      const matchSearch =
        !searchTerm ||
        sc.auditorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sc.officeName && sc.officeName.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchOffice =
        selectedOfficeFilter === 'all' || sc.officeName === selectedOfficeFilter
      return matchSearch && matchOffice
    })
  }, [scorecards, searchTerm, selectedOfficeFilter])

  // Unique offices for filter
  const distinctOffices = useMemo(() => {
    const set = new Set<string>()
    scorecards.forEach((sc) => {
      if (sc.officeName) set.add(sc.officeName)
    })
    return Array.from(set)
  }, [scorecards])

  return (
    <ProtectedRoute requiredRoles={['Admin', 'DirectorGeneral', 'Manager']}>
      <div className="min-h-screen bg-slate-50/60 pb-16" dir="rtl">
        {/* Page Header */}
        <div className="bg-white border-b border-slate-200/80 sticky top-0 z-10 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                    <Award className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h1 className="text-lg font-black text-slate-900 tracking-tight">
                      مدیریت و پیکربندی شاخص‌های ارزیابی عملکرد حسابرسان
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      تعریف فرمول‌ها، تنظیم آستانه‌های مطلوب و هشدار، اوزان نمره‌دهی و کارنامه ۳۶۰ درجه سنیم
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleAutoRebalance}
                  disabled={loading || totalWeight === 100}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                  title="تعدیل متناسب اوزان به مجموع ۱۰۰٪"
                >
                  <Percent className="w-3.5 h-3.5 text-amber-600" />
                  <span>تراز خودکار اوزان</span>
                </button>

                <button
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-md shadow-amber-600/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>تعریف شاخص جدید</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 mt-5 border-t border-slate-100 pt-3">
              <button
                onClick={() => setActiveTab('metrics')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'metrics'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>تعاریف و اوزان شاخص‌ها</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-mono">
                  {toPersianDigits(metrics.length)}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'leaderboard'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>رتبه‌بندی استانی و کارنامه‌ها</span>
                {scorecards.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-mono">
                    {toPersianDigits(scorecards.length)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          {successMessage && (
            <div className="p-3.5 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Weight Health Indicator Alert */}
          {totalWeight !== 100 && (
            <div className="p-3.5 mb-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  توجه: مجموع اوزان شاخص‌های فعال برابر با{' '}
                  <strong className="font-mono font-black">{toPersianDigits(totalWeight)}٪</strong> است. برای محاسبه
                  دقیق کارنامه، مجموع باید دقیقا ۱۰۰٪ باشد.
                </span>
              </div>
              <button
                onClick={handleAutoRebalance}
                className="px-2.5 py-1 rounded-lg bg-amber-600 text-white text-[11px] font-bold hover:bg-amber-700 transition-colors shrink-0 cursor-pointer"
              >
                تراز خودکار
              </button>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          {/* TAB 1: METRIC DEFINITIONS */}
          {activeTab === 'metrics' && (
            <div className="space-y-4">
              {loading ? (
                <div className="py-24 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
                  <span className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                  <span>در حال دریافت شاخص‌های عملکرد...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {metrics.map((m) => {
                    const cat = getCategoryMeta(m.category)
                    return (
                      <div
                        key={m.id}
                        className={`bg-white rounded-2xl border transition-all p-5 shadow-2xs relative flex flex-col justify-between ${
                          m.isActive
                            ? 'border-slate-200/90 hover:border-amber-400/50 hover:shadow-md'
                            : 'border-slate-200 opacity-60 bg-slate-50/50'
                        }`}
                      >
                        <div>
                          {/* Top Row: Category & Status Switch */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${cat.color}`}>
                              {cat.label}
                            </span>

                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-bold ${
                                  m.isActive ? 'text-emerald-600' : 'text-slate-400'
                                }`}
                              >
                                {m.isActive ? 'فعال' : 'غیرفعال'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggle(m)}
                                className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${
                                  m.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                                }`}
                              >
                                <span
                                  className={`block w-3 h-3 rounded-full bg-white shadow-xs transition-transform absolute top-0.5 ${
                                    m.isActive ? 'right-4' : 'right-0.5'
                                  }`}
                                />
                              </button>
                            </div>
                          </div>

                          {/* Title & Description */}
                          <h3 className="text-sm font-bold text-slate-800 line-clamp-1">{m.title}</h3>
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                            {m.description || 'بدون توضیحات تکمیلی'}
                          </p>

                          {/* Formula & Primary Field Details */}
                          <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">الگوی محاسبه:</span>
                              <span className="font-semibold text-slate-700 font-mono">
                                {getFormulaTypeLabel(m.formulaType)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">فیلد اصلی:</span>
                              <span className="font-mono text-slate-600 text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                {m.primaryField}
                              </span>
                            </div>
                            {m.secondaryField && (
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-400">فیلد مقایسه‌ای:</span>
                                <span className="font-mono text-slate-600 text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                  {m.secondaryField}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Target & Threshold Bands */}
                          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                            <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
                              <span className="text-[10px] text-emerald-600 block">هدف مطلوب</span>
                              <span className="text-xs font-mono font-bold text-emerald-800">
                                {toPersianDigits(m.targetValue)} {m.unit}
                              </span>
                            </div>
                            <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-100">
                              <span className="text-[10px] text-amber-600 block">آستانه هشدار</span>
                              <span className="text-xs font-mono font-bold text-amber-800">
                                {toPersianDigits(m.warningThreshold)} {m.unit}
                              </span>
                            </div>
                            <div className="p-2 rounded-xl bg-rose-50/70 border border-rose-100">
                              <span className="text-[10px] text-rose-600 block">بحرانی</span>
                              <span className="text-xs font-mono font-bold text-rose-800">
                                {toPersianDigits(m.criticalThreshold)} {m.unit}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Bar: Weight & Action Controls */}
                        <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-400">وزن در نمره کل:</span>
                            <span className="text-sm font-black font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                              ٪{toPersianDigits(m.weightPercentage)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(m)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="ویرایش شاخص"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMetric(m.id, m.title)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="حذف شاخص"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LEADERBOARD & EVALUATION */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-4">
              {/* Filter & Search Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="جستجوی نام حسابرس یا نام اداره..."
                    className="w-full pl-3 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                  {/* Data Source Selector */}
                  {dataSources.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-amber-50/80 border border-amber-200 rounded-xl px-2.5 py-1 text-xs">
                      <Database className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span className="text-[11px] font-bold text-amber-900 hidden md:inline">منبع داده:</span>
                      <select
                        value={selectedSourceId}
                        onChange={(e) => {
                          const val = e.target.value
                          setSelectedSourceId(val)
                          loadScorecards(val)
                        }}
                        className="text-xs bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer py-1"
                      >
                        {dataSources.map((ds) => (
                          <option key={ds.sourceId} value={ds.sourceId}>
                            {ds.isSystemDefault ? '🏛️ ' : '📊 '}
                            {ds.title} ({toPersianDigits(ds.totalRecords?.toLocaleString() || ds.totalCases?.toLocaleString() || 0)} پرونده)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <select
                    value={selectedOfficeFilter}
                    onChange={(e) => setSelectedOfficeFilter(e.target.value)}
                    className="w-full sm:w-auto text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="all">همه ادارات مالیاتی استان ({toPersianDigits(distinctOffices.length)})</option>
                    {distinctOffices.map((off) => (
                      <option key={off} value={off}>
                        {off}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => loadScorecards(selectedSourceId)}
                    disabled={loadingScorecards}
                    className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                    title="به‌روزرسانی رتبه‌بندی"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingScorecards ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Leaderboard Table */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white select-none">
                        <th className="py-3 px-3 text-center w-12 font-bold text-[11px] text-slate-400 border-b border-slate-800">
                          رتبه
                        </th>
                        <th className="py-3 px-4 font-bold text-[11px] border-b border-slate-800">نام حسابرس مالیاتی</th>
                        <th className="py-3 px-4 font-bold text-[11px] border-b border-slate-800">اداره امور مالیاتی</th>
                        <th className="py-3 px-3 font-bold text-[11px] text-center border-b border-slate-800">
                          پرونده‌ها
                        </th>
                        <th className="py-3 px-4 font-bold text-[11px] text-left border-b border-slate-800">
                          مالیات تشخیص (ریال)
                        </th>
                        <th className="py-3 px-4 font-bold text-[11px] text-left border-b border-slate-800">
                          مالیات قطعی (ریال)
                        </th>
                        <th className="py-3 px-3 font-bold text-[11px] text-center border-b border-slate-800">
                          رده عملکرد
                        </th>
                        <th className="py-3 px-4 font-bold text-[11px] text-center border-b border-slate-800">
                          نمره تراز شده
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loadingScorecards ? (
                        <tr>
                          <td colSpan={8} className="py-16 text-center text-slate-400">
                            در حال محاسبه رتبه‌بندی ۲۳۰ حسابرس بر اساس آخرین اوزان فعال...
                          </td>
                        </tr>
                      ) : filteredScorecards.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400">
                            هیچ حسابرسی مطابق با فیلترها یافت نشد
                          </td>
                        </tr>
                      ) : (
                        filteredScorecards.map((sc) => {
                          const isTop = sc.provincialRank <= 3
                          return (
                            <tr
                              key={sc.auditorName}
                              className="hover:bg-amber-50/40 transition-colors odd:bg-white even:bg-slate-50/50"
                            >
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-xs">
                                {isTop ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-slate-900 font-black shadow-xs">
                                    {toPersianDigits(sc.provincialRank)}
                                  </span>
                                ) : (
                                  <span className="text-slate-500">#{toPersianDigits(sc.provincialRank)}</span>
                                )}
                              </td>

                              <td className="py-2.5 px-4 font-bold text-slate-800">
                                <button
                                  type="button"
                                  onClick={() => setSelectedAuditorForDrawer(sc.auditorName)}
                                  className="text-amber-700 hover:text-amber-900 hover:underline cursor-pointer flex items-center gap-1.5"
                                  title="مشاهده کارنامه ۳۶۰ درجه و جزئیات ارزیابی"
                                >
                                  <Award className="w-3.5 h-3.5 text-amber-500" />
                                  <span>{sc.auditorName}</span>
                                </button>
                              </td>

                              <td className="py-2.5 px-4 text-slate-600 text-[11px]">{sc.officeName || 'اداره کل'}</td>

                              <td className="py-2.5 px-3 text-center font-mono text-slate-700">
                                {toPersianDigits(sc.completedCases)} / {toPersianDigits(sc.totalAssignedCases)}
                              </td>

                              <td className="py-2.5 px-4 text-left font-mono font-semibold text-slate-700" dir="ltr">
                                {toPersianDigits(sc.totalAssessedAmount.toLocaleString('fa-IR'))}
                              </td>

                              <td className="py-2.5 px-4 text-left font-mono font-semibold text-slate-700" dir="ltr">
                                {toPersianDigits(sc.totalFinalAmount.toLocaleString('fa-IR'))}
                              </td>

                              <td className="py-2.5 px-3 text-center">
                                <span
                                  className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-lg border ${
                                    sc.performanceTier === 'A'
                                      ? 'bg-amber-50 text-amber-700 border-amber-300'
                                      : sc.performanceTier === 'B'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                      : sc.performanceTier === 'C'
                                      ? 'bg-sky-50 text-sky-700 border-sky-300'
                                      : 'bg-rose-50 text-rose-700 border-rose-300'
                                  }`}
                                >
                                  {sc.tierTitleFa}
                                </span>
                              </td>

                              <td className="py-2.5 px-4 text-center">
                                <span className="font-mono font-black text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                                  {toPersianDigits(sc.compositeScore.toFixed(1))}
                                </span>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Create / Edit Metric Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {isEditing ? 'ویرایش شاخص ارزیابی عملکرد' : 'تعریف شاخص جدید ارزیابی عملکرد'}
                    </h3>
                    <span className="text-[10px] text-slate-400">
                      پیکربندی فیلدها، وزن و بازه‌های مطلوب / هشدار / بحرانی
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitMetric} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                {modalError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Code */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">کد سیستمی شاخص</label>
                    <input
                      type="text"
                      value={formData.metricCode}
                      onChange={(e) => setFormData({ ...formData, metricCode: e.target.value })}
                      disabled={isEditing}
                      required
                      className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 disabled:opacity-60"
                      dir="ltr"
                    />
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">عنوان شاخص</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="مانند: نرخ تمکین و دفاع‌پذیری در قطعی"
                      required
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">توضیحات و مفهوم مدیریتی</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="مفهوم، نحوه محاسبه و هدف نظارتی این شاخص..."
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">دسته‌بندی شاخص</label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: Number(e.target.value) as AuditorMetricCategory })
                      }
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2"
                    >
                      <option value={1}>کیفیت و تمکین</option>
                      <option value={2}>مالی و اختلاف مالیات</option>
                      <option value={3}>سرعت و زمان‌بندی</option>
                      <option value={4}>بهره‌وری و حجم کار</option>
                    </select>
                  </div>

                  {/* Formula Type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">نوع فرمول</label>
                    <select
                      value={formData.formulaType}
                      onChange={(e) =>
                        setFormData({ ...formData, formulaType: Number(e.target.value) as AuditorMetricFormulaType })
                      }
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2"
                    >
                      <option value={1}>نسبت (A / B)</option>
                      <option value={2}>تفاضل (A - B)</option>
                      <option value={3}>میانگین مقادیر</option>
                      <option value={4}>شمارش تعداد</option>
                      <option value={5}>درصد تحقق</option>
                    </select>
                  </div>

                  {/* Weight */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">وزن در نمره کل (٪)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.weightPercentage}
                      onChange={(e) => setFormData({ ...formData, weightPercentage: Number(e.target.value) })}
                      required
                      className="w-full text-xs font-mono bg-white border border-slate-200 rounded-xl px-3 py-2"
                    />
                  </div>
                </div>

                {/* Primary & Secondary Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">فیلد پایه محاسباتی (Field A)</label>
                    <select
                      value={formData.primaryField}
                      onChange={(e) => setFormData({ ...formData, primaryField: e.target.value })}
                      className="w-full text-xs font-mono bg-white border border-slate-200 rounded-xl px-3 py-2"
                    >
                      <option value="finalTax">finalTax (مالیات قطعی)</option>
                      <option value="assessedTax">assessedTax (مالیات تشخیص)</option>
                      <option value="declaredTax">declaredTax (مالیات ابرازی)</option>
                      <option value="daysAssignmentToNotice">daysAssignmentToNotice (فاصله تخصیص تا برگ تشخیص)</option>
                      <option value="daysNoticeToFinal">daysNoticeToFinal (فاصله تشخیص تا قطعی)</option>
                      <option value="auditStatus">auditStatus (وضعیت قطعی / مختومه بودن پرونده)</option>
                      <option value="isCompleted">isCompleted (وضعیت پرونده مختومه)</option>
                      <option value="riskLevel">riskLevel (سطح ریسک پرونده)</option>
                    </select>
                    {formData.formulaType === 5 && (formData.primaryField === 'auditStatus' || formData.primaryField === 'isCompleted') && (
                      <p className="text-[11px] text-teal-700 mt-1.5 bg-teal-50 p-2 rounded-lg border border-teal-200">
                        💡 درصد پرونده‌های با وضعیت قطعی (ابلاغ یا صادر شده) را از کل پرونده‌های حسابرس می‌سنجد.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">فیلد مقایسه‌ای (Field B اختیاری)</label>
                    <select
                      value={formData.secondaryField || ''}
                      onChange={(e) => setFormData({ ...formData, secondaryField: e.target.value || undefined })}
                      className="w-full text-xs font-mono bg-white border border-slate-200 rounded-xl px-3 py-2"
                    >
                      <option value="">بدون فیلد ثانویه</option>
                      <option value="assessedTax">assessedTax (مالیات تشخیص)</option>
                      <option value="declaredTax">declaredTax (مالیات ابرازی)</option>
                      <option value="finalTax">finalTax (مالیات قطعی)</option>
                      <option value="totalCases">totalCases (کل پرونده‌ها)</option>
                    </select>
                  </div>
                </div>

                {/* Targets & Threshold Bands */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">واحد اندازه‌گیری</label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-700 mb-1">مقدار هدف مطلوب</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.targetValue}
                      onChange={(e) => setFormData({ ...formData, targetValue: Number(e.target.value) })}
                      className="w-full text-xs font-mono bg-emerald-50/50 border border-emerald-200 rounded-xl px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-amber-700 mb-1">آستانه هشدار</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.warningThreshold}
                      onChange={(e) => setFormData({ ...formData, warningThreshold: Number(e.target.value) })}
                      className="w-full text-xs font-mono bg-amber-50/50 border border-amber-200 rounded-xl px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-rose-700 mb-1">آستانه بحرانی</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.criticalThreshold}
                      onChange={(e) => setFormData({ ...formData, criticalThreshold: Number(e.target.value) })}
                      className="w-full text-xs font-mono bg-rose-50/50 border border-rose-200 rounded-xl px-3 py-2"
                    />
                  </div>
                </div>

                {/* Polarity Switch */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">جهت مطلوبیت شاخص:</span>
                    <span className="text-[11px] text-slate-500">
                      {formData.higherIsBetter
                        ? 'مقادیر بالاتر نشان‌دهنده عملکرد بهتر حسابرس است (مانند تمکین یا درآمد)'
                        : 'مقادیر پایین‌تر نشان‌دهنده عملکرد بهتر حسابرس است (مانند تعداد روزهای معطلی)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, higherIsBetter: !formData.higherIsBetter })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      formData.higherIsBetter
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-sky-100 text-sky-800 border border-sky-300'
                    }`}
                  >
                    {formData.higherIsBetter ? 'بالاتر بهتر است' : 'پایین‌تر بهتر است'}
                  </button>
                </div>

                {/* Live Simulation Button inside Modal */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSimulateInModal}
                    disabled={simulating}
                    className="w-full py-2 px-4 rounded-xl text-xs font-bold border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className={`w-3.5 h-3.5 text-amber-600 ${simulating ? 'animate-spin' : ''}`} />
                    <span>آزمایش و شبیه‌سازی زنده روی پایگاه داده سنیم</span>
                  </button>

                  {simulationResult && (
                    <div className="mt-3 p-3.5 rounded-xl bg-slate-900 text-white text-xs space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between text-amber-400 font-bold">
                        <span>نتیجه شبیه‌سازی استانی:</span>
                        <span>{toPersianDigits(simulationResult.totalAuditorsEvaluated)} حسابرس ارزیابی شدند</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1 border-t border-slate-800">
                        <div>
                          <span className="text-slate-400 block">میانگین استانی:</span>
                          <span className="font-mono font-bold text-slate-200">
                            {toPersianDigits(simulationResult.provincialAverage.toFixed(2))} {formData.unit}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">کمترین مقدار:</span>
                          <span className="font-mono font-bold text-rose-400">
                            {toPersianDigits(simulationResult.minValue.toFixed(2))}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">بیشترین مقدار:</span>
                          <span className="font-mono font-bold text-emerald-400">
                            {toPersianDigits(simulationResult.maxValue.toFixed(2))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-md shadow-amber-600/20 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'در حال ثبت...' : isEditing ? 'ذخیره تغییرات' : 'ایجاد شاخص'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Auditor 360 Scorecard Drawer */}
        {selectedAuditorForDrawer && (
          <AuditorScorecardDrawer
            auditorName={selectedAuditorForDrawer}
            reportCode={selectedSourceId === 'SYSTEM' ? undefined : selectedSourceId}
            onClose={() => setSelectedAuditorForDrawer(null)}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}
