'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Plus,
  Save,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Users,
  Palette,
  Info,
  FileSpreadsheet,
  Link2,
  Folder,
  Search,
  Check,
  RotateCcw,
} from 'lucide-react'
import type {
  MenuSettingItem,
  CreateMenuSettingPayload,
  UpdateMenuSettingMetadataPayload,
} from '@/types/menuSettings'
import { MENU_ICON_OPTIONS } from '@/lib/icons/menuIcons'
import { PORTAL_COLOR_THEMES } from '@/lib/constants/cardThemes'
import { reportingApi } from '@/lib/api/reporting'
import { ReportDefinition, DOMAIN_SOURCE_NAMES_FA } from '@/types/reporting'
import {
  ALL_GENERAL_ROLES,
  ORGANIZATIONAL_ROLES,
  getPresetRoles,
  toggleRoleSelection,
  sanitizeRolesSelection,
  type RolePreset,
} from '@/lib/constants/menuRoles'

interface MenuItemFormModalProps {
  isOpen: boolean
  editingItem: MenuSettingItem | null
  initialParentKey?: string | null
  initialReportCode?: string | null
  rootModules: MenuSettingItem[]
  hasChildren?: boolean
  submitting: boolean
  onClose: () => void
  onSubmitCreate: (payload: CreateMenuSettingPayload) => Promise<void>
  onSubmitUpdate: (menuKey: string, payload: UpdateMenuSettingMetadataPayload) => Promise<void>
}

export default function MenuItemFormModal({
  isOpen,
  editingItem,
  initialParentKey = null,
  initialReportCode = null,
  rootModules,
  hasChildren = false,
  submitting,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
}: MenuItemFormModalProps) {
  const isEditing = Boolean(editingItem)
  const isBuiltIn = Boolean(editingItem && !editingItem.isCustom)

  const [itemType, setItemType] = useState<'root' | 'child'>('root')
  const [parentKey, setParentKey] = useState<string>('')
  const [linkTargetType, setLinkTargetType] = useState<'custom' | 'report' | 'folder'>('custom')
  const [reportCode, setReportCode] = useState<string>('')
  const [availableReports, setAvailableReports] = useState<ReportDefinition[]>([])
  const [loadingReports, setLoadingReports] = useState(false)
  const [reportSearch, setReportSearch] = useState('')
  const [title, setTitle] = useState('')
  const [route, setRoute] = useState('/')
  const [menuKey, setMenuKey] = useState('')
  const [description, setDescription] = useState('')
  const [iconName, setIconName] = useState('Link2')
  const [colorTheme, setColorTheme] = useState<string>('blue')
  const [badgeText, setBadgeText] = useState<string>('')
  const [displayOrder, setDisplayOrder] = useState<number>(10)
  const [isVisible, setIsVisible] = useState(true)
  const [allowedRoles, setAllowedRoles] = useState<string[]>([...ALL_GENERAL_ROLES])
  const [formError, setFormError] = useState<string | null>(null)

  const availableParents = rootModules.filter(
    (m) => m.menuKey !== editingItem?.menuKey && m.menuKey !== 'nav_home'
  )

  useEffect(() => {
    if (!isOpen) return
    let isMounted = true
    setLoadingReports(true)
    reportingApi
      .getCatalog(undefined, true)
      .then((data) => {
        if (isMounted) setAvailableReports(data)
      })
      .catch((err) => console.error('Failed to load reports for menu assignment:', err))
      .finally(() => {
        if (isMounted) setLoadingReports(false)
      })
    return () => {
      isMounted = false
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    setFormError(null)
    setReportSearch('')
    if (editingItem) {
      const isChild = Boolean(editingItem.parentKey)
      setItemType(isChild ? 'child' : 'root')
      setParentKey(editingItem.parentKey || availableParents[0]?.menuKey || '')
      setTitle(editingItem.title)
      setRoute(editingItem.route)
      setMenuKey(editingItem.menuKey)
      setDescription(editingItem.description || '')
      setIconName(editingItem.iconName || (isChild ? 'Link2' : 'Folder'))
      setColorTheme(editingItem.colorTheme || 'blue')
      setBadgeText(editingItem.badgeText || '')
      setDisplayOrder(editingItem.displayOrder)
      setIsVisible(editingItem.isVisible)
      const existingRepCode = editingItem.reportCode || ''
      setReportCode(existingRepCode)
      if (existingRepCode) {
        setLinkTargetType('report')
      } else if (!isChild && editingItem.route === '/' && hasChildren) {
        setLinkTargetType('folder')
      } else {
        setLinkTargetType('custom')
      }
      setAllowedRoles(
        sanitizeRolesSelection(
          editingItem.allowedRoles?.length
            ? editingItem.allowedRoles
            : editingItem.adminOnly
            ? ['Admin']
            : ALL_GENERAL_ROLES
        )
      )
    } else {
      const isChild = Boolean(initialParentKey || initialReportCode)
      setItemType(isChild ? 'child' : 'root')
      const targetParent =
        initialParentKey ||
        (initialReportCode ? 'module_reporting' : availableParents[0]?.menuKey || '')
      setParentKey(targetParent)
      setTitle('')
      setRoute('')
      setMenuKey('')
      setDescription('')
      setIconName(isChild ? (initialReportCode ? 'FileSpreadsheet' : 'Link2') : 'LayoutGrid')
      setColorTheme('blue')
      setBadgeText('')
      setDisplayOrder(rootModules.length + 1)
      setIsVisible(true)
      setAllowedRoles([...ALL_GENERAL_ROLES])
      const repCode = initialReportCode || ''
      setReportCode(repCode)
      setLinkTargetType(repCode || initialParentKey === 'module_reporting' ? 'report' : 'custom')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingItem, initialParentKey, initialReportCode])

  const filteredReports = useMemo(() => {
    if (!reportSearch.trim()) return availableReports
    const q = reportSearch.trim().toLowerCase()
    return availableReports.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q))
    )
  }, [availableReports, reportSearch])

  const handleItemTypeChange = (nextType: 'root' | 'child') => {
    setItemType(nextType)
    setFormError(null)
    if (nextType === 'root') {
      if (linkTargetType === 'report' && !reportCode) {
        setLinkTargetType('custom')
      }
    } else {
      if (linkTargetType === 'folder') {
        setLinkTargetType('custom')
        if (route === '/') setRoute('')
      }
      if (!parentKey && availableParents[0]?.menuKey) {
        setParentKey(availableParents[0].menuKey)
      }
    }
  }

  const handleSelectReport = (r: ReportDefinition) => {
    setReportCode(r.code)
    setRoute(`/reporting/standard/${r.code}`)
    setTitle(r.title)
    if (r.description) setDescription(r.description)
    setIconName('FileSpreadsheet')
  }

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, submitting, onClose])

  if (!isOpen) return null

  const applyPreset = (preset: RolePreset) => {
    setAllowedRoles(getPresetRoles(preset))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const trimmedTitle = title.trim()
    const trimmedRoute = route.trim()
    const trimmedKey = menuKey.trim().toLowerCase()

    if (!trimmedTitle) {
      setFormError('عنوان نمایشی منو الزامی است.')
      return
    }

    const isFolderTarget = !isBuiltIn && itemType === 'root' && linkTargetType === 'folder'
    const isReportTarget = !isBuiltIn && linkTargetType === 'report'
    const effectiveRoute = isFolderTarget ? '/' : trimmedRoute

    if (!isBuiltIn) {
      if (isReportTarget && !reportCode) {
        setFormError('لطفاً گزارش مورد نظر را از فهرست گزارش‌ها انتخاب نمایید یا نوع پیوند را تغییر دهید.')
        return
      }

      const isInternal = effectiveRoute.startsWith('/') && !effectiveRoute.startsWith('//')
      const isExternal = /^https?:\/\/.+/i.test(effectiveRoute)
      if (!isInternal && !isExternal) {
        setFormError("مسیر باید با '/' شروع شود (مسیر داخلی) یا یک آدرس معتبر http/https باشد.")
        return
      }

      if (!isEditing && trimmedKey && !/^[a-z0-9_-]{2,100}$/.test(trimmedKey)) {
        setFormError('شناسه یکتا باید فقط شامل حروف کوچک انگلیسی، اعداد، خط تیره یا زیرخط باشد (حداقل ۲ کاراکتر).')
        return
      }

      if (itemType === 'child' && !parentKey) {
        setFormError('انتخاب سامانه والد برای زیرمنو الزامی است.')
        return
      }
    }

    const sanitizedRoles = sanitizeRolesSelection(allowedRoles)
    const adminOnly = !sanitizedRoles.some((r) => r.toLowerCase() !== 'admin')

    try {
      if (isEditing && editingItem) {
        await onSubmitUpdate(editingItem.menuKey, {
          parentKey: isBuiltIn ? editingItem.parentKey : itemType === 'child' ? parentKey : null,
          title: trimmedTitle,
          route: isBuiltIn ? editingItem.route : effectiveRoute,
          iconName,
          colorTheme: itemType === 'root' ? colorTheme : null,
          badgeText: itemType === 'root' ? (badgeText.trim() || null) : null,
          reportCode: isReportTarget ? reportCode : null,
          description: description.trim() || null,
          isVisible,
          adminOnly,
          allowedRoles: sanitizedRoles,
          displayOrder: Number.isFinite(displayOrder) ? displayOrder : 1,
        })
      } else {
        await onSubmitCreate({
          menuKey: trimmedKey || undefined,
          parentKey: itemType === 'child' ? parentKey : null,
          title: trimmedTitle,
          route: effectiveRoute,
          iconName,
          colorTheme: itemType === 'root' ? colorTheme : null,
          badgeText: itemType === 'root' ? (badgeText.trim() || null) : null,
          reportCode: isReportTarget ? reportCode : null,
          description: description.trim() || null,
          isVisible,
          adminOnly,
          allowedRoles: sanitizedRoles,
          displayOrder: Number.isFinite(displayOrder) ? displayOrder : undefined,
        })
      }
      onClose()
    } catch (err: any) {
      setFormError(
        err?.response?.data?.error || err?.message || 'خطا در ثبت اطلاعات گزینه منو'
      )
    }
  }

  const modalMarkup = (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center p-4 z-[60]"
      role="dialog"
      aria-modal="true"
      aria-label={
        isBuiltIn
          ? 'ویرایش مشخصات ماژول و کارت پورتال'
          : isEditing
          ? 'ویرایش گزینه سفارشی منو'
          : 'افزودن گزینه جدید به منو'
      }
    >
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              {isEditing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-gray-900">
                {isBuiltIn
                  ? 'ویرایش مشخصات ماژول و کارت پورتال'
                  : isEditing
                  ? 'ویرایش گزینه سفارشی منو'
                  : 'افزودن گزینه جدید به منو'}
              </h2>
              <p className="text-[11px] text-gray-500">
                {isBuiltIn
                  ? 'شخصی‌سازی عنوان، توضیحات، رنگ تم، برچسب کارت، آیکون و سطح دسترسی'
                  : 'تعریف لینک داخلی سامانه یا پیوند خارجی با کنترل سطح دسترسی نقش‌ها'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {isBuiltIn && (
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">ماژول پیش‌فرض سیستم: </span>
                مسیر و ساختار هسته این ماژول ثابت است، اما می‌توانید عنوان، توضیحات، رنگ تم کارت، برچسب گروه، آیکون و اولویت نمایش آن را تغییر دهید.
              </div>
            </div>
          )}

          {/* Level selector */}
          {!isBuiltIn && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-800">جایگاه در ساختار منو</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleItemTypeChange('root')}
                  className={`p-3 rounded-xl border text-right transition-all ${
                    itemType === 'root'
                      ? 'border-indigo-500 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/15'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <span className="text-xs font-bold block">گزینه اصلی (سطح اول)</span>
                  <span className="text-[11px] text-gray-500 block mt-0.5">
                    کارت مستقل در صفحه اصلی یا سرگروه ماژول جدید
                  </span>
                </button>

                <button
                  type="button"
                  disabled={hasChildren || availableParents.length === 0}
                  onClick={() => handleItemTypeChange('child')}
                  className={`p-3 rounded-xl border text-right transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    itemType === 'child'
                      ? 'border-indigo-500 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/15'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <span className="text-xs font-bold block">زیرمنو (داخل یک سامانه)</span>
                  <span className="text-[11px] text-gray-500 block mt-0.5">
                    {hasChildren
                      ? 'این ماژول دارای زیرمنو است و نمی‌تواند زیرمنو شود'
                      : 'افزودن به زیرمجموعه یکی از سامانه‌های موجود'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {itemType === 'child' && !isBuiltIn && (
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                سامانه / ماژول والد *
              </label>
              <select
                value={parentKey}
                onChange={(e) => setParentKey(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {availableParents.map((parent) => (
                  <option key={parent.menuKey} value={parent.menuKey}>
                    {parent.title} ({parent.menuKey})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Link Target Type Selector (Report Assignment vs Custom Route vs Root Folder) */}
          {!isBuiltIn && (
            <div className="space-y-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
              <label className="block text-xs font-bold text-gray-800">
                {itemType === 'root' ? 'نوع پیوند و عملکرد گزینه اصلی' : 'نوع پیوند و مقصد زیرمنو'}
              </label>
              <div
                className={`grid grid-cols-1 gap-2 ${
                  itemType === 'root' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setLinkTargetType('report')}
                  className={`p-2.5 rounded-xl border text-right transition-all flex items-center gap-2.5 ${
                    linkTargetType === 'report'
                      ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/15 font-bold'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 flex-shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs block">تخصیص گزارش سازمانی</span>
                    <span className="text-[10px] text-gray-500 block font-normal">
                      انتخاب از کاتالوگ گزارش‌ها یا اکسل
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLinkTargetType('custom')
                    setReportCode('')
                    if (route === '/' && !isEditing) setRoute('')
                  }}
                  className={`p-2.5 rounded-xl border text-right transition-all flex items-center gap-2.5 ${
                    linkTargetType === 'custom'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/15 font-bold'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700 flex-shrink-0">
                    <Link2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs block">مسیر دلخواه یا خارجی</span>
                    <span className="text-[10px] text-gray-500 block font-normal">
                      ورود دستی آدرس صفحه داخلی یا URL
                    </span>
                  </div>
                </button>

                {itemType === 'root' && (
                  <button
                    type="button"
                    onClick={() => {
                      setLinkTargetType('folder')
                      setReportCode('')
                      setRoute('/')
                      if (!isEditing && (iconName === 'Link2' || iconName === 'LayoutGrid')) {
                        setIconName('Folder')
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-right transition-all flex items-center gap-2.5 ${
                      linkTargetType === 'folder'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/15 font-bold'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 flex-shrink-0">
                      <Folder className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs block">سرگروه / پوشه منو</span>
                      <span className="text-[10px] text-gray-500 block font-normal">
                        گروه مستقل جهت افزودن زیرمنوها
                      </span>
                    </div>
                  </button>
                )}
              </div>

              {linkTargetType === 'report' && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
                      انتخاب گزارش برای تخصیص به منو *
                    </label>
                    {reportCode && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-mono font-bold">
                        گزارش انتخابی: {reportCode}
                      </span>
                    )}
                  </div>

                  {/* Search box for reports */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={reportSearch}
                      onChange={(e) => setReportSearch(e.target.value)}
                      placeholder="جستجو در نام گزارش، کد یا حوزه موضوعی..."
                      className="w-full pr-8 pl-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  {/* Scrollable Report List */}
                  <div className="max-h-48 overflow-y-auto space-y-1.5 p-1 border border-gray-200 rounded-xl bg-white">
                    {loadingReports ? (
                      <div className="py-6 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        در حال بارگذاری فهرست گزارش‌ها...
                      </div>
                    ) : filteredReports.length === 0 ? (
                      <div className="py-6 text-center text-xs text-gray-400">
                        گزارشی مطابق جستجو یافت نشد.
                      </div>
                    ) : (
                      filteredReports.map((rep) => {
                        const isSelected = reportCode.toUpperCase() === rep.code.toUpperCase()
                        return (
                          <button
                            key={rep.code}
                            type="button"
                            onClick={() => handleSelectReport(rep)}
                            className={`w-full text-right p-2 rounded-lg border transition-all flex items-center justify-between text-xs ${
                              isSelected
                                ? 'bg-amber-50/80 border-amber-500 ring-1 ring-amber-500/20 text-amber-950 font-bold'
                                : 'bg-slate-50/50 hover:bg-slate-100/70 border-gray-100 text-gray-700'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold truncate">{rep.title}</span>
                                <span className="font-mono text-[10px] bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded flex-shrink-0">
                                  {rep.code}
                                </span>
                              </div>
                              <div className="text-[10px] text-gray-400 mt-0.5 truncate flex items-center gap-2">
                                <span>{DOMAIN_SOURCE_NAMES_FA[rep.domainSource] || 'عمومی'}</span>
                                {rep.description && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate">{rep.description}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0 mr-2" />
                            )}
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Title & Route */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                عنوان نمایشی در منو و کارت *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثلاً: کارنامه تحلیلی رسیدگی سنیم"
                maxLength={150}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                مسیر صفحه یا لینک مقصد{' '}
                {isBuiltIn
                  ? '(ثابت سیستمی)'
                  : linkTargetType === 'report'
                  ? '(خودکار بر اساس گزارش)'
                  : itemType === 'root' && linkTargetType === 'folder'
                  ? '(سرگروه پوشه - پیش‌فرض /)'
                  : '*'}
              </label>
              <input
                type="text"
                dir="ltr"
                disabled={
                  isBuiltIn ||
                  linkTargetType === 'report' ||
                  (itemType === 'root' && linkTargetType === 'folder')
                }
                value={itemType === 'root' && linkTargetType === 'folder' ? '/' : route}
                onChange={(e) => setRoute(e.target.value)}
                placeholder="/about یا https://intamedia.ir"
                maxLength={250}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-gray-300 disabled:bg-gray-100 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-left"
              />
            </div>
          </div>

          {/* Root Card Extras: Color Theme & Badge Text */}
          {itemType === 'root' && (
            <div className="space-y-4 pt-1 border-t border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1.5">
                    برچسب بالای کارت (نشانگر گروه موضوعی)
                  </label>
                  <input
                    type="text"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    placeholder="مثلاً: سرمایه انسانی و ارزیابی، امور مالی و اضافه کار"
                    maxLength={100}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    نشان کوچکی که در گوشه بالای کارت در پورتال اصلی نمایش داده می‌شود.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1.5">
                    رنگ تم کارت عملیاتی
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-1 border border-gray-200 rounded-xl bg-gray-50/50">
                    {PORTAL_COLOR_THEMES.map((opt) => {
                      const selected = (colorTheme || 'blue').toLowerCase() === opt.key.toLowerCase()
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setColorTheme(opt.key)}
                          className={`p-2 rounded-lg border text-right transition-all flex items-center justify-between text-xs ${
                            selected
                              ? 'border-indigo-600 bg-white shadow-xs ring-1 ring-indigo-500/30'
                              : 'border-transparent hover:border-gray-300 bg-white/70'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span
                              className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr ${opt.swatchGradient} shadow-xs flex-shrink-0`}
                            />
                            <span className="text-[11px] font-semibold text-gray-800 truncate">
                              {opt.label}
                            </span>
                          </div>
                          {selected && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Description, MenuKey, DisplayOrder */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-6">
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                توضیح کوتاه (متن داخل کارت پورتال)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="توضیح عملکرد ماژول در بدنه کارت پورتال و راهنما"
                maxLength={500}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                شناسه یکتا {isEditing ? '' : '(اختیاری)'}
              </label>
              <input
                type="text"
                dir="ltr"
                disabled={isEditing}
                value={menuKey}
                onChange={(e) => setMenuKey(e.target.value)}
                placeholder="تولید خودکار (custom_...)"
                maxLength={100}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-gray-300 disabled:bg-gray-100 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-left"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                ترتیب نمایش
              </label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-center font-bold"
              />
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1.5">
              آیکون نمایشی کارت و منو
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-200 max-h-36 overflow-y-auto">
              {MENU_ICON_OPTIONS.map((opt) => {
                const IconComp = opt.icon
                const selected = iconName.toLowerCase() === opt.name.toLowerCase()
                return (
                  <button
                    key={opt.name}
                    type="button"
                    title={opt.label}
                    onClick={() => setIconName(opt.name)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                      selected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Visibility & Roles */}
          <div className="space-y-3 pt-1 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800">وضعیت نمایش و نقش‌های مجاز</span>
              <button
                type="button"
                onClick={() => setIsVisible((v) => !v)}
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                  isVisible
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-gray-100 text-gray-500 border-gray-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isVisible ? 'bg-emerald-500' : 'bg-gray-400'
                  }`}
                />
                {isVisible ? 'فعال و قابل نمایش' : 'مخفی (غیرفعال)'}
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-gray-500 ml-1">انتخاب سریع:</span>
              {(
                [
                  ['all', 'همه نقش‌ها'],
                  ['managers', 'مدیران'],
                  ['experts', 'کارشناسان'],
                  ['admin', 'فقط مدیر ارشد'],
                ] as [RolePreset, string][]
              ).map(([preset, label]) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="text-[11px] px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 bg-gray-50 p-2 rounded-xl border border-gray-200 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                <Shield className="w-3 h-3 text-purple-600" />
                مدیر ارشد
              </span>
              {ORGANIZATIONAL_ROLES.map((roleDef) => {
                const active = allowedRoles.some(
                  (r) => r.toLowerCase() === roleDef.key.toLowerCase()
                )
                return (
                  <button
                    key={roleDef.key}
                    type="button"
                    onClick={() => setAllowedRoles((prev) => toggleRoleSelection(prev, roleDef.key))}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                      active
                        ? roleDef.activeClass
                        : 'bg-white text-gray-400 border-gray-200 line-through opacity-75 hover:opacity-100'
                    }`}
                  >
                    <Users className="w-3 h-3" />
                    {roleDef.label}
                    {active && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isEditing ? (
                <Save className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{isEditing ? 'ذخیره تغییرات گزینه' : 'ایجاد گزینه منو'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return modalMarkup
  return createPortal(modalMarkup, document.body)
}
