'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { finalityStagesApi } from '@/lib/api/finalityStages'
import type { FinalityStageItem } from '@/types/finalityStage'
import {
  FileCheck,
  Coins,
  Plus,
  Search,
  Edit2,
  Trash2,
  Lock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Info,
  Layers,
  Sparkles,
  Check,
  X,
  SlidersHorizontal,
} from 'lucide-react'

export default function FinalityStagesManagementPage() {
  const [stages, setStages] = useState<FinalityStageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'inactive' | 'system' | 'custom'>('all')

  // Toggle Loading
  const [togglingId, setTogglingId] = useState<number | null>(null)

  // Reorder Loading
  const [reordering, setReordering] = useState(false)

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createCode, setCreateCode] = useState('')
  const [createTitle, setCreateTitle] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createDisplayOrder, setCreateDisplayOrder] = useState<number>(10)
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Edit Modal State
  const [editingStage, setEditingStage] = useState<FinalityStageItem | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editIsActive, setEditIsActive] = useState(true)
  const [editDisplayOrder, setEditDisplayOrder] = useState<number>(10)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Delete Modal State
  const [deletingStage, setDeletingStage] = useState<FinalityStageItem | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const loadStages = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await finalityStagesApi.getAllForManagement()
      setStages(data || [])
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'خطا در بارگذاری فهرست مراحل قطعیت')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStages()
  }, [])

  // Auto-hide success toast after 4 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // Filter stages
  const filteredStages = useMemo(() => {
    return stages.filter((s) => {
      // Tab filter
      if (filterTab === 'active' && !s.isActive) return false
      if (filterTab === 'inactive' && s.isActive) return false
      if (filterTab === 'system' && !s.isSystem) return false
      if (filterTab === 'custom' && s.isSystem) return false

      // Search filter
      if (!searchTerm.trim()) return true
      const q = searchTerm.trim().toLowerCase()
      return (
        s.title.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
      )
    })
  }, [stages, searchTerm, filterTab])

  // Stats
  const stats = useMemo(() => {
    const total = stages.length
    const active = stages.filter((s) => s.isActive).length
    const inactive = stages.filter((s) => !s.isActive).length
    const system = stages.filter((s) => s.isSystem).length
    const custom = stages.filter((s) => !s.isSystem).length
    return { total, active, inactive, system, custom }
  }, [stages])

  // Handle Quick Active Toggle
  const handleToggleActive = async (stage: FinalityStageItem) => {
    try {
      setTogglingId(stage.id)
      setError(null)
      const updated = await finalityStagesApi.toggleActive(stage)
      setStages((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
      setSuccessMessage(
        updated.isActive
          ? `مرحله قطعیت «${updated.title}» با موفقیت فعال شد و در فرم‌ها نمایش می‌یابد.`
          : `مرحله قطعیت «${updated.title}» غیرفعال شد و از فرم‌های جدید مخفی گردید.`
      )
    } catch (err: any) {
      setError(err?.response?.data?.error || 'خطا در تغییر وضعیت مرحله قطعیت')
    } finally {
      setTogglingId(null)
    }
  }

  // Handle Move Up / Move Down Reordering
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= filteredStages.length) return

    const currentItem = filteredStages[index]
    const targetItem = filteredStages[targetIndex]

    // Swap orders
    const newCurrentOrder = targetItem.displayOrder
    const newTargetOrder = currentItem.displayOrder

    const reorderedPayload = [
      { id: currentItem.id, displayOrder: newCurrentOrder },
      { id: targetItem.id, displayOrder: newTargetOrder },
    ]

    try {
      setReordering(true)
      // Optimistic update
      setStages((prev) =>
        prev
          .map((s) => {
            if (s.id === currentItem.id) return { ...s, displayOrder: newCurrentOrder }
            if (s.id === targetItem.id) return { ...s, displayOrder: newTargetOrder }
            return s
          })
          .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id)
      )

      await finalityStagesApi.reorder(reorderedPayload)
      setSuccessMessage('ترتیب نمایش مراحل قطعیت با موفقیت بروزرسانی شد.')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'خطا در تغییر ترتیب مراحل قطعیت')
      loadStages()
    } finally {
      setReordering(false)
    }
  }

  // Handle Create Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)

    if (!createTitle.trim()) {
      setCreateError('عنوان مرحله قطعیت الزامی است.')
      return
    }

    try {
      setCreateSubmitting(true)
      const newStage = await finalityStagesApi.create({
        code: createCode.trim() || undefined,
        title: createTitle.trim(),
        description: createDescription.trim() || undefined,
        displayOrder: Number(createDisplayOrder) || 10,
      })

      setStages((prev) => [...prev, newStage].sort((a, b) => a.displayOrder - b.displayOrder))
      setShowCreateModal(false)
      setCreateCode('')
      setCreateTitle('')
      setCreateDescription('')
      setCreateDisplayOrder(10)
      setSuccessMessage(`مرحله قطعیت جدید «${newStage.title}» با موفقیت تعریف گردید.`)
    } catch (err: any) {
      setCreateError(err?.response?.data?.error || 'خطا در ایجاد مرحله قطعیت جدید.')
    } finally {
      setCreateSubmitting(false)
    }
  }

  // Open Edit Modal
  const openEditModal = (stage: FinalityStageItem) => {
    setEditingStage(stage)
    setEditTitle(stage.title)
    setEditDescription(stage.description || '')
    setEditIsActive(stage.isActive)
    setEditDisplayOrder(stage.displayOrder)
    setEditError(null)
  }

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStage) return
    setEditError(null)

    if (!editTitle.trim()) {
      setEditError('عنوان مرحله قطعیت الزامی است.')
      return
    }

    try {
      setEditSubmitting(true)
      const updated = await finalityStagesApi.update(editingStage.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        isActive: editIsActive,
        displayOrder: Number(editDisplayOrder) || editingStage.displayOrder,
      })

      setStages((prev) =>
        prev
          .map((s) => (s.id === updated.id ? updated : s))
          .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id)
      )
      setEditingStage(null)
      setSuccessMessage(`مرحله قطعیت «${updated.title}» با موفقیت ویرایش گردید.`)
    } catch (err: any) {
      setEditError(err?.response?.data?.error || 'خطا در ذخیره تغییرات مرحله قطعیت.')
    } finally {
      setEditSubmitting(false)
    }
  }

  // Handle Delete Submit
  const handleDeleteSubmit = async () => {
    if (!deletingStage) return
    setDeleteError(null)

    try {
      setDeleteSubmitting(true)
      await finalityStagesApi.delete(deletingStage.id)
      setStages((prev) => prev.filter((s) => s.id !== deletingStage.id))
      setSuccessMessage(`مرحله قطعیت «${deletingStage.title}» با موفقیت حذف شد.`)
      setDeletingStage(null)
    } catch (err: any) {
      setDeleteError(
        err?.response?.data?.error ||
          'امکان حذف این مرحله وجود ندارد. احتمالاً در پرونده‌های موجود استفاده شده است.'
      )
    } finally {
      setDeleteSubmitting(false)
    }
  }

  return (
    <ProtectedRoute requiredRoles={['Admin']}>
      <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8" dir="rtl">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Breadcrumb & Navigation */}
          <nav className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <Link href="/" className="hover:text-purple-600 transition-colors">
              سامانه جامع
            </Link>
            <span>/</span>
            <Link href="/admin/users" className="hover:text-purple-600 transition-colors">
              مدیریت سیستم
            </Link>
            <span>/</span>
            <span className="text-gray-800 font-bold">مدیریت مراحل قطعیت</span>
          </nav>

          {/* Settings Section Switcher Tabs */}
          <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
            <Link
              href="/admin/tax-sources"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-purple-700 hover:bg-purple-50 transition-colors"
            >
              <Coins className="w-4 h-4 text-gray-500" />
              <span>مدیریت منابع مالیاتی</span>
            </Link>
            <Link
              href="/admin/finality-stages"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-purple-100 text-purple-900 border border-purple-200 shadow-xs"
            >
              <FileCheck className="w-4 h-4 text-purple-700" />
              <span>مدیریت مراحل قطعیت پرونده</span>
            </Link>
          </div>

          {/* Header Banner */}
          <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-900/10 relative overflow-hidden">
            <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute right-1/3 -top-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-indigo-200 border border-white/10">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>پیکربندی مراحل قطعیت پرونده‌های استرداد (گام ۴ قطعی‌سازی)</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  مدیریت مراحل قطعیت پرونده‌های مالیاتی
                </h1>
                <p className="text-xs sm:text-sm text-indigo-200/90 max-w-2xl leading-relaxed">
                  سفارشی‌سازی عناوین مراحل قطعیت (تمکین، توافق ماده ۲۳۸، هیات‌های حل اختلاف ۲۴۴ و ۲۴۷، شورای عالی ۲۵۱ و مکرر).
                  امکان فعال/غیرفعال‌سازی، تغییر ترتیب نمایش در منوی کشویی و افزودن مراجع جدید.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={loadStages}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/15 backdrop-blur-md hover:shadow-lg disabled:opacity-50"
                  title="بازخوانی فهرست"
                >
                  <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>بازخوانی</span>
                </button>
                <button
                  onClick={() => {
                    setCreateCode('')
                    setCreateTitle('')
                    setCreateDescription('')
                    setCreateDisplayOrder(stages.length > 0 ? Math.max(...stages.map((s) => s.displayOrder)) + 1 : 1)
                    setCreateError(null)
                    setShowCreateModal(true)
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-950 hover:bg-indigo-50 rounded-xl text-xs font-black transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4 text-indigo-700 stroke-[3]" />
                  <span>افزودن مرحله قطعیت جدید</span>
                </button>
              </div>
            </div>
          </div>

          {/* Success Toast */}
          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs sm:text-sm animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-1 bg-emerald-100 rounded-full text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="font-semibold">{successMessage}</span>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-emerald-500 hover:text-emerald-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-800 text-xs sm:text-sm animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-1 bg-rose-100 rounded-full text-rose-600">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <span className="font-semibold">{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-rose-500 hover:text-rose-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">کل مراحل قطعیت</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <Layers className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">مراحل فعال در فرم‌ها</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-black text-emerald-700">{stats.active}</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    قابل انتخاب
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">مراحل غیرفعال (مخفی)</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-black text-amber-700">{stats.inactive}</span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                    مخفی‌شده
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <XCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">مراحل پیش‌فرض قانون</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-black text-indigo-700">{stats.system}</span>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                    سیستمی
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <Lock className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Filter & Search Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجو در عنوان، کد یا ماده قانونی..."
                className="w-full pr-10 pl-4 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-xl w-full md:w-auto overflow-x-auto text-xs">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  filterTab === 'all'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                همه ({stats.total})
              </button>
              <button
                onClick={() => setFilterTab('active')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  filterTab === 'active'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                فعال ({stats.active})
              </button>
              <button
                onClick={() => setFilterTab('inactive')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  filterTab === 'inactive'
                    ? 'bg-white text-amber-800 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                غیرفعال ({stats.inactive})
              </button>
              <button
                onClick={() => setFilterTab('system')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  filterTab === 'system'
                    ? 'bg-white text-indigo-800 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                سیستمی ({stats.system})
              </button>
              <button
                onClick={() => setFilterTab('custom')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  filterTab === 'custom'
                    ? 'bg-white text-purple-800 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                سفارشی ({stats.custom})
              </button>
            </div>
          </div>

          {/* Finality Stages List */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <span className="text-xs font-semibold">در حال دریافت و بارگذاری مراحل قطعیت...</span>
              </div>
            ) : filteredStages.length === 0 ? (
              <div className="py-16 text-center text-gray-500 space-y-3">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                  <Search className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-gray-700">هیچ مرحله قطعیتی یافت نشد</p>
                <p className="text-xs text-gray-400">
                  {searchTerm ? 'عبارت جستجو را تغییر دهید' : 'هنوز مرحله قطعیتی ثبت نشده است'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredStages.map((stage, index) => {
                  const isToggling = togglingId === stage.id
                  return (
                    <div
                      key={stage.id}
                      className={`p-4 sm:p-5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        stage.isActive ? 'hover:bg-indigo-50/20' : 'bg-gray-50/40 opacity-75'
                      }`}
                    >
                      {/* Left side (in RTL, Right): Order + Icon + Info */}
                      <div className="flex items-start gap-3.5">
                        {/* Reorder Buttons & Numeric Badge */}
                        <div className="flex flex-col items-center justify-center gap-1 flex-shrink-0 pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleMove(index, 'up')}
                            disabled={index === 0 || reordering}
                            className="p-1 text-gray-400 hover:text-indigo-700 hover:bg-indigo-100 rounded-md transition-colors disabled:opacity-20 disabled:hover:bg-transparent"
                            title="انتقال به بالا (اولویت بیشتر)"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <span
                            className="text-[11px] font-mono font-bold w-6 h-6 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center border border-gray-200"
                            title={`ترتیب نمایش: ${stage.displayOrder}`}
                          >
                            {stage.displayOrder}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleMove(index, 'down')}
                            disabled={index === filteredStages.length - 1 || reordering}
                            className="p-1 text-gray-400 hover:text-indigo-700 hover:bg-indigo-100 rounded-md transition-colors disabled:opacity-20 disabled:hover:bg-transparent"
                            title="انتقال به پایین (اولویت کمتر)"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Title & Metadata */}
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm sm:text-base font-bold text-gray-900">
                              {stage.title}
                            </h3>

                            {/* System or Custom Badge */}
                            {stage.isSystem ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                                <Lock className="w-2.5 h-2.5" />
                                سیستمی قانونی
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                                <Sparkles className="w-2.5 h-2.5" />
                                مرجع سفارشی
                              </span>
                            )}

                            {/* Code Badge */}
                            <span className="text-[11px] font-mono font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                              {stage.code}
                            </span>
                          </div>

                          {/* Description or statutory notes */}
                          {stage.description ? (
                            <p className="text-xs text-gray-500 leading-relaxed max-w-3xl">
                              {stage.description}
                            </p>
                          ) : (
                            <p className="text-[11px] text-gray-400 italic">بدون مستند قانونی</p>
                          )}
                        </div>
                      </div>

                      {/* Right side (in RTL, Left): Status Toggle + Edit & Delete Actions */}
                      <div className="flex items-center gap-4 self-end md:self-center">
                        {/* Active / Inactive Toggle Switch */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(stage)}
                            disabled={isToggling}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                              stage.isActive ? 'bg-emerald-600' : 'bg-gray-300'
                            } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={stage.isActive ? 'کلیک جهت غیرفعال‌سازی' : 'کلیک جهت فعال‌سازی'}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                stage.isActive ? '-translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span
                            className={`text-xs font-bold ${
                              stage.isActive ? 'text-emerald-700' : 'text-gray-400'
                            }`}
                          >
                            {stage.isActive ? 'فعال' : 'غیرفعال'}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 border-r border-gray-200 pr-3">
                          <button
                            onClick={() => openEditModal(stage)}
                            className="p-2 text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-colors"
                            title="ویرایش مشخصات"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {stage.isSystem ? (
                            <div
                              className="p-2 text-gray-300 cursor-not-allowed"
                              title="مراحل قانونی سیستمی غیرقابل حذف هستند (می‌توانید آنها را غیرفعال کنید)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setDeletingStage(stage)
                                setDeleteError(null)
                              }}
                              className="p-2 text-gray-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
                              title="حذف مرحله سفارشی"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Statutory Information Box */}
          <div className="bg-indigo-50/70 border border-indigo-200/70 rounded-2xl p-5 flex items-start gap-3.5 text-xs text-indigo-950 leading-relaxed">
            <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold">نکات راهنمای مراحل قطعیت پرونده:</h4>
              <ul className="list-disc list-inside space-y-1 text-indigo-900/90 text-[11px]">
                <li>
                  مراحل قطعیت در گام چهارم فرآیند استرداد مالیات (قطعی‌سازی و رسیدگی) و همچنین در گزارشات توجیهی و برگه‌های چاپی منعکس می‌شوند.
                </li>
                <li>
                  مراحل سیستمی پیش‌فرض مطابق با مواد ۲۳۸، ۲۳۹، ۲۴۴، ۲۴۷، ۲۵۱، ۲۵۱ مکرر، ۲۵۷ و ۲۱۶ قانون مالیات‌های مستقیم تنظیم شده‌اند.
                </li>
                <li>
                  در صورت غیرفعال‌سازی یک مرحله، پرونده‌های پیشین ثبت‌شده با آن مرحله بدون تغییر باقی مانده اما آن گزینه از فرم‌های ثبت پرونده جدید حذف خواهد شد.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* =================== CREATE MODAL =================== */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-black text-gray-900">تعریف مرحله قطعیت جدید</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {createError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">
                    عنوان مرحله قطعیت *
                  </label>
                  <input
                    type="text"
                    required
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    placeholder="مثال: رای شعبه دیوان عدالت اداری یا کمیسیون ۲۱۶"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">
                    شناسه انگلیسی / کد سیستمی (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={createCode}
                    onChange={(e) => setCreateCode(e.target.value)}
                    placeholder="مثال: CourtRuling (در صورت خالی ماندن خودکار تولید می‌شود)"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl font-mono text-left focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">
                    مستند یا بند قانونی مرتبط
                  </label>
                  <textarea
                    rows={3}
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    placeholder="توضیحات قانونی در خصوص نحوه احراز این مرحله قطعیت..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">ترتیب نمایش در لیست</label>
                  <input
                    type="number"
                    value={createDisplayOrder}
                    onChange={(e) => setCreateDisplayOrder(Number(e.target.value))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl font-mono text-left focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    dir="ltr"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition-colors"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={createSubmitting}
                    className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-black transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                  >
                    {createSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>ایجاد و ثبت مرحله</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =================== EDIT MODAL =================== */}
        {editingStage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                    <Edit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900">ویرایش مرحله قطعیت</h3>
                    <span className="text-[11px] font-mono text-gray-400">کد: {editingStage.code}</span>
                  </div>
                </div>
                <button
                  onClick={() => setEditingStage(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">
                    عنوان مرحله قطعیت *
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">
                    مستند یا بند قانونی مرتبط
                  </label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="مستند قانونی..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">ترتیب نمایش</label>
                    <input
                      type="number"
                      value={editDisplayOrder}
                      onChange={(e) => setEditDisplayOrder(Number(e.target.value))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl font-mono text-left focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">وضعیت فعال بودن</label>
                    <button
                      type="button"
                      onClick={() => setEditIsActive(!editIsActive)}
                      className={`w-full py-2.5 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-colors ${
                        editIsActive
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-gray-100 text-gray-600 border-gray-300'
                      }`}
                    >
                      {editIsActive ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>فعال (نمایش در فرم‌ها)</span>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 text-gray-400" />
                          <span>غیرفعال (مخفی)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {editingStage.isSystem && (
                  <p className="text-[11px] text-indigo-700 bg-indigo-50 p-2.5 rounded-xl border border-indigo-100 leading-relaxed">
                    این یک مرحله قطعیت قانونی سیستمی است. ویرایش عنوان و توضیحات آن مجاز بوده و در تمام فرم‌ها و گزارشات اعمال خواهد شد.
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setEditingStage(null)}
                    className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition-colors"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-black transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                  >
                    {editSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>ذخیره تغییرات</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =================== DELETE MODAL =================== */}
        {deletingStage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-2.5 bg-rose-100 rounded-2xl">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">تایید حذف مرحله قطعیت</h3>
                  <span className="text-xs text-gray-500">{deletingStage.title}</span>
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                آیا از حذف کامل مرحله قطعیت «<strong>{deletingStage.title}</strong>» اطمینان دارید؟
                در صورتی که این مرحله در پرونده‌های استرداد ثبت‌شده استفاده شده باشد، امکان حذف مسدود بوده و توصیه می‌شود آن را غیرفعال نمایید.
              </p>

              {deleteError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setDeletingStage(null)}
                  className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl text-xs font-bold transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSubmit}
                  disabled={deleteSubmitting}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {deleteSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>حذف قطعی مرحله</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
