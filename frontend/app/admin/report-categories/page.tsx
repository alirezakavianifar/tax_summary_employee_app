'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { reportCategoriesApi, ReportCategoryItem } from '@/lib/api/reportCategories'
import {
  FolderKanban,
  Plus,
  Search,
  Edit2,
  Trash2,
  Lock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Layers,
  FileSpreadsheet,
  Info,
  SlidersHorizontal,
  ArrowLeft,
  Check,
  X,
  FileText,
  RotateCcw,
} from 'lucide-react'

export default function ReportCategoriesManagementPage() {
  const [categories, setCategories] = useState<ReportCategoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'inactive' | 'system' | 'custom'>('all')

  // Toggle Loading
  const [togglingId, setTogglingId] = useState<number | null>(null)

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createCode, setCreateCode] = useState('')
  const [createTitle, setCreateTitle] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createDisplayOrder, setCreateDisplayOrder] = useState<number>(10)
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Edit Modal State
  const [editingCategory, setEditingCategory] = useState<ReportCategoryItem | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editIsActive, setEditIsActive] = useState(true)
  const [editDisplayOrder, setEditDisplayOrder] = useState<number>(10)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Delete Modal State
  const [deletingCategory, setDeletingCategory] = useState<ReportCategoryItem | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const loadCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await reportCategoriesApi.getAllForManagement()
      setCategories(data || [])
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'خطا در بارگذاری فهرست دسته‌بندی‌های گزارش‌ها')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // Filter categories
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      if (filterTab === 'active' && !c.isActive) return false
      if (filterTab === 'inactive' && c.isActive) return false
      if (filterTab === 'system' && !c.isSystem) return false
      if (filterTab === 'custom' && c.isSystem) return false

      if (!searchTerm.trim()) return true
      const q = searchTerm.trim().toLowerCase()
      return (
        c.title.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
      )
    })
  }, [categories, searchTerm, filterTab])

  // Stats
  const stats = useMemo(() => {
    const total = categories.length
    const active = categories.filter((c) => c.isActive).length
    const inactive = categories.filter((c) => !c.isActive).length
    const system = categories.filter((c) => c.isSystem).length
    const custom = categories.filter((c) => !c.isSystem).length
    const totalReports = categories.reduce((sum, c) => sum + (c.reportCount || 0), 0)
    return { total, active, inactive, system, custom, totalReports }
  }, [categories])

  // Handle Toggle Active
  const handleToggleActive = async (category: ReportCategoryItem) => {
    try {
      setTogglingId(category.id)
      setError(null)
      const updated = await reportCategoriesApi.toggleStatus(category.id)
      setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      setSuccessMessage(
        updated.isActive
          ? `دسته‌بندی «${updated.title}» با موفقیت فعال شد و در زبانه گزارش‌ها نمایش می‌یابد.`
          : `دسته‌بندی «${updated.title}» غیرفعال شد و از زبانه‌های کاتالوگ مخفی گردید.`
      )
    } catch (err: any) {
      setError(err?.response?.data?.error || 'خطا در تغییر وضعیت دسته‌بندی گزارش')
    } finally {
      setTogglingId(null)
    }
  }

  // Handle Create Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)

    if (!createCode.trim()) {
      setCreateError('کد انگلیسی دسته‌بندی الزامی است.')
      return
    }

    if (!createTitle.trim()) {
      setCreateError('عنوان فارسی دسته‌بندی الزامی است.')
      return
    }

    try {
      setCreateSubmitting(true)
      const newCategory = await reportCategoriesApi.create({
        code: createCode.trim().toUpperCase(),
        title: createTitle.trim(),
        description: createDescription.trim() || undefined,
        displayOrder: Number(createDisplayOrder) || 10,
      })

      setCategories((prev) => [...prev, newCategory].sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id))
      setShowCreateModal(false)
      setCreateCode('')
      setCreateTitle('')
      setCreateDescription('')
      setCreateDisplayOrder(10)
      setSuccessMessage(`دسته‌بندی جدید «${newCategory.title}» با موفقیت افزوده شد.`)
    } catch (err: any) {
      setCreateError(err?.response?.data?.error || 'خطا در ایجاد دسته‌بندی جدید')
    } finally {
      setCreateSubmitting(false)
    }
  }

  // Handle Open Edit Modal
  const handleOpenEdit = (category: ReportCategoryItem) => {
    setEditingCategory(category)
    setEditTitle(category.title)
    setEditDescription(category.description || '')
    setEditDisplayOrder(category.displayOrder)
    setEditIsActive(category.isActive)
    setEditError(null)
  }

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return
    setEditError(null)

    if (!editTitle.trim()) {
      setEditError('عنوان دسته‌بندی الزامی است.')
      return
    }

    try {
      setEditSubmitting(true)
      const updated = await reportCategoriesApi.update(editingCategory.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        displayOrder: Number(editDisplayOrder) || 0,
        isActive: editIsActive,
      })

      setCategories((prev) =>
        prev
          .map((c) => (c.id === updated.id ? updated : c))
          .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id)
      )
      setEditingCategory(null)
      setSuccessMessage(`مشخصات دسته‌بندی «${updated.title}» با موفقیت ویرایش شد.`)
    } catch (err: any) {
      setEditError(err?.response?.data?.error || 'خطا در ذخیره تغییرات دسته‌بندی')
    } finally {
      setEditSubmitting(false)
    }
  }

  // Handle Delete Submit
  const handleDeleteSubmit = async () => {
    if (!deletingCategory) return
    setDeleteError(null)

    try {
      setDeleteSubmitting(true)
      await reportCategoriesApi.delete(deletingCategory.id)
      setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id))
      setSuccessMessage(`دسته‌بندی «${deletingCategory.title}» با موفقیت حذف گردید.`)
      setDeletingCategory(null)
    } catch (err: any) {
      setDeleteError(err?.response?.data?.error || 'خطا در حذف دسته‌بندی')
    } finally {
      setDeleteSubmitting(false)
    }
  }

  return (
    <ProtectedRoute requiredRoles={['Admin']}>
      <div className="space-y-6" dir="rtl">
        {/* Page Header */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/reporting/standard"
                className="text-xs font-bold text-slate-500 hover:text-amber-600 flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                <span>بازگشت به کاتالوگ گزارش‌ها</span>
              </Link>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <FolderKanban className="w-6 h-6 text-amber-600" />
              مدیریت حوزه‌ها و دسته‌بندی‌های موضوعی گزارش‌ها
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              تعریف، ویرایش عناوین فارسی، ترتیب نمایش و فعال/غیرفعال‌سازی دسته‌بندی‌های کاتالوگ گزارش‌های سازمانی
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setCreateCode('')
                setCreateTitle('')
                setCreateDescription('')
                setCreateDisplayOrder((categories.length + 1) * 10)
                setCreateError(null)
                setShowCreateModal(true)
              }}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:from-amber-700 hover:to-amber-800 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>افزودن دسته‌بندی جدید</span>
            </button>

            <button
              type="button"
              onClick={loadCategories}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>تازه‌سازی</span>
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 flex items-center gap-2 shadow-2xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-bold text-slate-500">کل دسته‌بندی‌ها</div>
            <div className="text-lg font-black text-slate-800 mt-1">{stats.total}</div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/20 shadow-2xs">
            <div className="text-[11px] font-bold text-emerald-700">فعال در کاتالوگ</div>
            <div className="text-lg font-black text-emerald-700 mt-1">{stats.active}</div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-bold text-slate-500">غیرفعال / مخفی</div>
            <div className="text-lg font-black text-slate-600 mt-1">{stats.inactive}</div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-blue-200/80 bg-blue-50/20 shadow-2xs">
            <div className="text-[11px] font-bold text-blue-700">پایه سیستمی</div>
            <div className="text-lg font-black text-blue-700 mt-1">{stats.system}</div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-purple-200/80 bg-purple-50/20 shadow-2xs">
            <div className="text-[11px] font-bold text-purple-700">سفارشی مدیر</div>
            <div className="text-lg font-black text-purple-700 mt-1">{stats.custom}</div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/20 shadow-2xs">
            <div className="text-[11px] font-bold text-amber-800">کل گزارش‌های ثبت‌شده</div>
            <div className="text-lg font-black text-amber-800 mt-1">{stats.totalReports}</div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterTab === 'all' ? 'bg-amber-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              همه ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('active')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterTab === 'active' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              فعال ({stats.active})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('inactive')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterTab === 'inactive' ? 'bg-slate-700 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              غیرفعال ({stats.inactive})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('system')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterTab === 'system' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              پایه سیستمی ({stats.system})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('custom')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterTab === 'custom' ? 'bg-purple-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              سفارشی ({stats.custom})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو در عنوان، کد یا شرح..."
              className="w-full text-xs pr-8 pl-3 py-1.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
          </div>
        </div>

        {/* Categories Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-xs font-bold text-slate-500 gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
              <span>در حال بارگذاری دسته‌بندی‌ها...</span>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              هیچ دسته‌بندی منطبق با فیلتر یافت نشد.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">شناسه</th>
                    <th className="py-3 px-4">کد سیستمی</th>
                    <th className="py-3 px-4">عنوان دسته‌بندی</th>
                    <th className="py-3 px-4">شرح کاربردی</th>
                    <th className="py-3 px-4 text-center">ترتیب</th>
                    <th className="py-3 px-4 text-center">تعداد گزارش‌ها</th>
                    <th className="py-3 px-4 text-center">نوع</th>
                    <th className="py-3 px-4 text-center">وضعیت نمایش</th>
                    <th className="py-3 px-4 text-center w-28">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredCategories.map((category) => {
                    const isToggling = togglingId === category.id
                    const hasReports = category.reportCount > 0

                    return (
                      <tr key={category.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-500">
                          {category.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200" dir="ltr">
                            {category.code}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {category.title}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate" title={category.description || ''}>
                          {category.description || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-600">
                          {category.displayOrder}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Link
                            href={`/reporting/standard?source=${category.id}`}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                              hasReports
                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                            title="مشاهده گزارش‌های این دسته‌بندی در کاتالوگ"
                          >
                            <FileSpreadsheet className="w-3 h-3" />
                            <span>{category.reportCount} گزارش</span>
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {category.isSystem ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                              <Lock className="w-2.5 h-2.5" />
                              <span>سیستمی</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                              سفارشی
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(category)}
                            disabled={isToggling}
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                              category.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            {isToggling ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : category.isActive ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <XCircle className="w-3 h-3 text-slate-400" />
                            )}
                            <span>{category.isActive ? 'فعال' : 'غیرفعال'}</span>
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(category)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                              title="ویرایش دسته‌بندی"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setDeletingCategory(category)
                                setDeleteError(null)
                              }}
                              disabled={category.isSystem || hasReports}
                              className={`p-1.5 rounded-lg transition-colors ${
                                category.isSystem || hasReports
                                  ? 'text-slate-300 cursor-not-allowed'
                                  : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                              }`}
                              title={
                                category.isSystem
                                  ? 'دسته‌بندی‌های پایه سیستمی قابل حذف نیستند'
                                  : hasReports
                                  ? `امکان حذف وجود ندارد؛ ${category.reportCount} گزارش به این دسته‌بندی اختصاص دارد`
                                  : 'حذف دسته‌بندی'
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

        {/* Modal: Create Category */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4 text-amber-600" />
                  تعریف دسته‌بندی موضوعی جدید
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
                {createError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold">
                    {createError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    کد سیستمی انگلیسی <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={createCode}
                    onChange={(e) => setCreateCode(e.target.value.toUpperCase())}
                    placeholder="مثال: SPECIAL_AUDIT"
                    dir="ltr"
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    حروف بزرگ لاتین و خط زیر (بدون فاصله یا کاراکترهای ویژه)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    عنوان فارسی دسته‌بندی <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    placeholder="مثال: رسیدگی‌های ویژه و مشترک"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">شرح کاربردی (اختیاری)</label>
                  <textarea
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    placeholder="توضیح کوتاه درباره هدف و گزارش‌های تحت این دسته‌بندی..."
                    rows={3}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ترتیب نمایش در زبانه‌ها</label>
                  <input
                    type="number"
                    value={createDisplayOrder}
                    onChange={(e) => setCreateDisplayOrder(Number(e.target.value))}
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={createSubmitting}
                    className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors"
                  >
                    {createSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>ثبت دسته‌بندی</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Category */}
        {editingCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-amber-600" />
                  ویرایش دسته‌بندی ({editingCategory.code})
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
                {editError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold">
                    {editError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    عنوان فارسی دسته‌بندی <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">شرح کاربردی</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ترتیب نمایش</label>
                    <input
                      type="number"
                      value={editDisplayOrder}
                      onChange={(e) => setEditDisplayOrder(Number(e.target.value))}
                      className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={editIsActive}
                        onChange={(e) => setEditIsActive(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-xs font-bold text-slate-700">فعال در کاتالوگ</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingCategory(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors"
                  >
                    {editSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>ذخیره تغییرات</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Delete Confirmation */}
        {deletingCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
              <div className="p-5 border-b border-rose-100 bg-rose-50/50 flex items-center justify-between">
                <h3 className="font-bold text-rose-800 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  حذف دسته‌بندی گزارش
                </h3>
                <button
                  type="button"
                  onClick={() => setDeletingCategory(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {deleteError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold">
                    {deleteError}
                  </div>
                )}

                <p className="text-xs text-slate-700 leading-relaxed">
                  آیا از حذف قطعی دسته‌بندی «<strong className="text-slate-900">{deletingCategory.title}</strong>» با کد سیستمی{' '}
                  <span className="font-mono text-slate-800 font-bold" dir="ltr">{deletingCategory.code}</span> اطمینان دارید؟
                </p>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] leading-relaxed">
                  <strong>توجه:</strong> بر اساس سیاست جامع یکپارچگی داده‌ها، هیچ گزارشی نباید بدون دسته‌بندی بماند. فقط دسته‌بندی‌های بدون گزارش متصل و غیرسیستمی امکان حذف دارند.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setDeletingCategory(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteSubmit}
                    disabled={deleteSubmitting}
                    className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
                  >
                    {deleteSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>حذف قطعی</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
