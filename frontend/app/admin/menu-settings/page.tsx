'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useMenuSettings } from '@/contexts/MenuSettingsContext'
import { menuSettingsApi } from '@/lib/api/menuSettings'
import type { MenuSettingItem, UpdateMenuSettingItem } from '@/types/menuSettings'
import {
  Sliders,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  RotateCcw,
  Save,
  Search,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Shield,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
  Sparkles,
  Users,
  Calculator,
  Scale,
  Home,
  ShieldCheck,
  FileText,
  Building2,
  History,
  PlusCircle,
} from 'lucide-react'

// Helper icon resolver
const ICON_MAP: Record<string, React.ElementType> = {
  Home,
  Users,
  FileText,
  PlusCircle,
  Search,
  Calculator,
  FileSpreadsheet: Layers,
  Building2,
  History,
  Scale,
  ShieldCheck,
  Menu: Sliders,
}

export default function MenuSettingsAdminPage() {
  const { refreshSettings } = useMenuSettings()
  const [items, setItems] = useState<MenuSettingItem[]>([])
  const [originalItems, setOriginalItems] = useState<MenuSettingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsedParents, setCollapsedParents] = useState<Record<string, boolean>>({})
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // Load all settings for admin
  const loadData = async () => {
    try {
      setLoading(true)
      setStatusMessage(null)
      const data = await menuSettingsApi.getAllSettingsForAdmin()
      setItems(data)
      setOriginalItems(JSON.parse(JSON.stringify(data)))
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.response?.data?.error || 'خطا در بارگذاری تنظیمات منو از سرور',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Check if any changes are made
  const hasChanges = useMemo(() => {
    if (items.length !== originalItems.length) return false
    const origMap = new Map(originalItems.map((i) => [i.menuKey, i]))
    for (const item of items) {
      const orig = origMap.get(item.menuKey)
      if (!orig) return true
      if (item.isVisible !== orig.isVisible || item.adminOnly !== orig.adminOnly) {
        return true
      }
    }
    return false
  }, [items, originalItems])

  // Count changed items
  const changedCount = useMemo(() => {
    const origMap = new Map(originalItems.map((i) => [i.menuKey, i]))
    let count = 0
    for (const item of items) {
      const orig = origMap.get(item.menuKey)
      if (orig && (item.isVisible !== orig.isVisible || item.adminOnly !== orig.adminOnly)) {
        count++
      }
    }
    return count
  }, [items, originalItems])

  // Toggle Visibility
  const toggleVisibility = (menuKey: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.menuKey === menuKey) {
          return { ...item, isVisible: !item.isVisible }
        }
        return item
      })
    )
  }

  // Toggle Admin Only
  const toggleAdminOnly = (menuKey: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.menuKey === menuKey) {
          return { ...item, adminOnly: !item.adminOnly }
        }
        return item
      })
    )
  }

  // Toggle collapse for module card
  const toggleCollapse = (menuKey: string) => {
    setCollapsedParents((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }))
  }

  // Save all modified settings
  const handleSave = async () => {
    try {
      setSaving(true)
      setStatusMessage(null)

      const updatePayload: UpdateMenuSettingItem[] = items.map((i) => ({
        menuKey: i.menuKey,
        isVisible: i.isVisible,
        adminOnly: i.adminOnly,
        displayOrder: i.displayOrder,
      }))

      const updated = await menuSettingsApi.updateMenuSettings({ settings: updatePayload })
      setItems(updated)
      setOriginalItems(JSON.parse(JSON.stringify(updated)))
      await refreshSettings()

      setStatusMessage({
        type: 'success',
        text: 'تنظیمات نمایش منوها با موفقیت ذخیره شد و تغییرات اعمال گردید.',
      })

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setStatusMessage(null)
      }, 5000)
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.response?.data?.error || 'خطا در ذخیره‌سازی تغییرات',
      })
    } finally {
      setSaving(false)
    }
  }

  // Reset to system defaults
  const handleReset = async () => {
    try {
      setResetting(true)
      setStatusMessage(null)
      setShowResetConfirm(false)

      const defaults = await menuSettingsApi.resetMenuSettings()
      setItems(defaults)
      setOriginalItems(JSON.parse(JSON.stringify(defaults)))
      await refreshSettings()

      setStatusMessage({
        type: 'success',
        text: 'تمامی گزینه‌های منو به تنظیمات پیش‌فرض کارخانه بازنشانی شدند.',
      })
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.response?.data?.error || 'خطا در بازنشانی تنظیمات',
      })
    } finally {
      setResetting(false)
    }
  }

  // Separate top-level modules vs child actions
  const rootModules = useMemo(() => {
    return items.filter((item) => !item.parentKey)
  }, [items])

  const childrenByParent = useMemo(() => {
    const map: Record<string, MenuSettingItem[]> = {}
    for (const item of items) {
      if (item.parentKey) {
        if (!map[item.parentKey]) {
          map[item.parentKey] = []
        }
        map[item.parentKey].push(item)
      }
    }
    return map
  }, [items])

  // Stats calculation
  const stats = useMemo(() => {
    const total = items.length
    const visible = items.filter((i) => i.isVisible).length
    const hidden = items.filter((i) => !i.isVisible).length
    const adminOnly = items.filter((i) => i.adminOnly).length
    return { total, visible, hidden, adminOnly }
  }, [items])

  // Filter root modules based on search query
  const filteredRootModules = useMemo(() => {
    if (!searchQuery.trim()) return rootModules

    const q = searchQuery.trim().toLowerCase()
    return rootModules.filter((module) => {
      const matchModule =
        module.title.toLowerCase().includes(q) ||
        module.route.toLowerCase().includes(q) ||
        module.menuKey.toLowerCase().includes(q)

      const children = childrenByParent[module.menuKey] || []
      const matchChild = children.some(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.route.toLowerCase().includes(q) ||
          c.menuKey.toLowerCase().includes(q)
      )

      return matchModule || matchChild
    })
  }, [rootModules, childrenByParent, searchQuery])

  return (
    <ProtectedRoute requiredRoles={['Admin']}>
      <div className="min-h-screen bg-gray-50/50 pb-24 pt-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header & Breadcrumb */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <Link href="/" className="hover:text-primary-600 transition-colors">
                  صفحه اصلی
                </Link>
                <span>/</span>
                <span className="text-gray-400">مدیریت سیستم</span>
                <span>/</span>
                <span className="text-primary-700 font-bold">مدیریت منوها و دسترسی‌ها</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 text-purple-700 rounded-xl border border-purple-100 shadow-xs">
                  <Sliders className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-gray-900">
                    پیکربندی و مدیریت نمایش منوها
                  </h1>
                  <p className="text-xs text-gray-500 mt-0.5">
                    کنترل پویای دسترسی پرسنل و کاربران به سامانه‌ها، ماژول‌ها و گزینه‌های فرعی
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 self-end md:self-center">
              <button
                onClick={() => setShowResetConfirm(true)}
                disabled={resetting || saving}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-xs disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4 text-gray-500" />
                بازنشانی به پیش‌فرض
              </button>

              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md ${
                  hasChanges
                    ? 'bg-primary-600 hover:bg-primary-700 shadow-primary-500/20 ring-2 ring-primary-500/20'
                    : 'bg-gray-400 cursor-not-allowed opacity-60'
                }`}
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>ذخیره تغییرات</span>
                {changedCount > 0 && (
                  <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
                    {changedCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Status Message Notification */}
          {statusMessage && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium animate-in fade-in duration-200 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
              <button
                onClick={() => setStatusMessage(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Key Statistics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3.5">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-gray-500 block">کل گزینه‌ها</span>
                <span className="text-xl font-black text-gray-900">{stats.total}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3.5">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-gray-500 block">فعال و در دسترس</span>
                <span className="text-xl font-black text-emerald-600">{stats.visible}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3.5">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-gray-500 block">محدود به مدیران</span>
                <span className="text-xl font-black text-purple-600">{stats.adminOnly}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3.5">
              <div className="p-3 bg-gray-100 text-gray-500 rounded-xl">
                <EyeOff className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-gray-500 block">پنهان و غیرفعال</span>
                <span className="text-xl font-black text-gray-600">{stats.hidden}</span>
              </div>
            </div>
          </div>

          {/* Search and Guidance Banner */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در عنوان، مسیر یا شناسه منو..."
                className="w-full pr-9 pl-4 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>

            <div className="flex items-center gap-4 text-[11px] text-gray-500 w-full sm:w-auto justify-end">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                نمایش برای همه کاربران مجاز
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                نمایش صرفاً برای مدیر سیستم
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
                مخفی‌سازی کامل
              </span>
            </div>
          </div>

          {/* Modules List Accordion */}
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-gray-200">
              <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-gray-500 mt-4 font-bold">در حال بارگذاری تنظیمات...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRootModules.map((module) => {
                const isCollapsed = collapsedParents[module.menuKey]
                const children = childrenByParent[module.menuKey] || []
                const ModuleIcon = ICON_MAP[module.iconName || ''] || Layers
                const isParentHidden = !module.isVisible

                return (
                  <div
                    key={module.id}
                    className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                      isParentHidden
                        ? 'border-gray-200 bg-gray-50/50 opacity-90'
                        : module.adminOnly
                        ? 'border-purple-200/80 shadow-xs'
                        : 'border-gray-200 shadow-xs'
                    }`}
                  >
                    {/* Top Level Module Header Card */}
                    <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100">
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div
                          className={`p-3 rounded-xl flex-shrink-0 ${
                            isParentHidden
                              ? 'bg-gray-200 text-gray-500'
                              : module.adminOnly
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-primary-50 text-primary-600'
                          }`}
                        >
                          <ModuleIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm sm:text-base font-black text-gray-900">
                              {module.title}
                            </span>
                            <code className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded font-mono">
                              {module.menuKey}
                            </code>
                            {module.adminOnly && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                                <Shield className="w-3 h-3" />
                                فقط مدیران
                              </span>
                            )}
                            {isParentHidden && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-300 px-2 py-0.5 rounded-full">
                                <EyeOff className="w-3 h-3" />
                                مخفی شده
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {module.description || 'سامانه اصلی پرتال'}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                            <span>مسیر اصلی:</span>
                            <span className="font-mono text-gray-600">{module.route}</span>
                            {children.length > 0 && (
                              <>
                                <span>•</span>
                                <span>{children.length} زیرمنو</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Controls for Top-Level Module */}
                      <div className="flex items-center gap-4 self-end md:self-center">
                        {/* Admin Only Toggle */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleAdminOnly(module.menuKey)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                              module.adminOnly
                                ? 'bg-purple-100 text-purple-800 border-purple-300 shadow-xs'
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                            }`}
                            title="تغییر محدودیت دسترسی به مدیران"
                          >
                            {module.adminOnly ? (
                              <>
                                <Lock className="w-3.5 h-3.5 text-purple-600" />
                                فقط مدیر
                              </>
                            ) : (
                              <>
                                <Unlock className="w-3.5 h-3.5 text-gray-400" />
                                دسترسی عمومی
                              </>
                            )}
                          </button>
                        </div>

                        {/* Visibility Switch */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleVisibility(module.menuKey)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              module.isVisible ? 'bg-emerald-600' : 'bg-gray-300'
                            }`}
                            title={module.isVisible ? 'کلیک جهت پنهان‌سازی' : 'کلیک جهت فعال‌سازی'}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                module.isVisible ? 'translate-x-0' : '-translate-x-5'
                              }`}
                            />
                          </button>
                          <span className="text-xs font-bold w-12 text-right">
                            {module.isVisible ? (
                              <span className="text-emerald-700">فعال</span>
                            ) : (
                              <span className="text-gray-400">مخفی</span>
                            )}
                          </span>
                        </div>

                        {/* Collapse/Expand Submenu button */}
                        {children.length > 0 && (
                          <button
                            onClick={() => toggleCollapse(module.menuKey)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors mr-2"
                            title={isCollapsed ? 'مشاهده زیرمنوها' : 'بستن زیرمنوها'}
                          >
                            {isCollapsed ? (
                              <ChevronDown className="w-5 h-5" />
                            ) : (
                              <ChevronUp className="w-5 h-5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Submenu Actions Grid */}
                    {children.length > 0 && !isCollapsed && (
                      <div className="p-4 sm:p-5 bg-gray-50/40 space-y-3">
                        {isParentHidden && (
                          <div className="p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                            <span>
                              توجه: به دلیل غیرفعال بودن این ماژول، تمامی زیرمنوهای آن نیز در نوار
                              ناوبری و صفحه اصلی به صورت خودکار مخفی خواهند بود.
                            </span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {children.map((child) => {
                            const ChildIcon = ICON_MAP[child.iconName || ''] || FileText
                            const isChildInactive = !child.isVisible || isParentHidden

                            return (
                              <div
                                key={child.id}
                                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                                  isChildInactive
                                    ? 'bg-gray-100/70 border-gray-200 text-gray-500'
                                    : child.adminOnly
                                    ? 'bg-white border-purple-200 shadow-xs'
                                    : 'bg-white border-gray-200 shadow-xs'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className={`p-2 rounded-lg flex-shrink-0 ${
                                      isChildInactive
                                        ? 'bg-gray-200 text-gray-400'
                                        : child.adminOnly
                                        ? 'bg-purple-50 text-purple-600'
                                        : 'bg-primary-50 text-primary-600'
                                    }`}
                                  >
                                    <ChildIcon className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-gray-900 truncate block">
                                        {child.title}
                                      </span>
                                      {child.adminOnly && (
                                        <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded">
                                          مدیر
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-mono block truncate">
                                      {child.route}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2.5 flex-shrink-0">
                                  {/* Submenu Admin-Only button */}
                                  <button
                                    type="button"
                                    onClick={() => toggleAdminOnly(child.menuKey)}
                                    className={`p-1.5 rounded-lg border transition-colors ${
                                      child.adminOnly
                                        ? 'bg-purple-100 text-purple-700 border-purple-300'
                                        : 'bg-gray-50 text-gray-400 border-gray-200 hover:text-gray-600'
                                    }`}
                                    title={
                                      child.adminOnly
                                        ? 'فقط برای مدیران فعال است'
                                        : 'تغییر به فقط مدیران'
                                    }
                                  >
                                    {child.adminOnly ? (
                                      <Lock className="w-3.5 h-3.5" />
                                    ) : (
                                      <Unlock className="w-3.5 h-3.5" />
                                    )}
                                  </button>

                                  {/* Submenu Visibility Switch */}
                                  <button
                                    type="button"
                                    onClick={() => toggleVisibility(child.menuKey)}
                                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                      child.isVisible ? 'bg-emerald-600' : 'bg-gray-300'
                                    }`}
                                    title={child.isVisible ? 'پنهان‌سازی' : 'فعال‌سازی'}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        child.isVisible ? 'translate-x-0' : '-translate-x-4'
                                      }`}
                                    />
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Floating Unsaved Changes Bottom Banner */}
          {hasChanges && (
            <div className="fixed bottom-6 inset-x-4 max-w-2xl mx-auto bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-white/10 flex items-center justify-between z-40 animate-in slide-in-from-bottom-5 duration-200">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <div>
                  <span className="text-xs font-bold block">
                    تغییرات ذخیره‌نشده ({changedCount} مورد)
                  </span>
                  <span className="text-[11px] text-gray-300">
                    جهت اعمال تغییرات در نوار ناوبری و صفحه اصلی، دکمه ذخیره را بفشارید.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setItems(JSON.parse(JSON.stringify(originalItems)))}
                  className="px-3 py-1.5 text-xs text-gray-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  لغو تغییرات
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-1.5 bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
                >
                  {saving ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  ذخیره
                </button>
              </div>
            </div>
          )}

          {/* Confirmation Modal for Reset Defaults */}
          {showResetConfirm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-gray-200 shadow-2xl space-y-4">
                <div className="flex items-center gap-3 text-amber-600">
                  <div className="p-2.5 bg-amber-50 rounded-xl">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">بازنشانی به تنظیمات پیش‌فرض</h3>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">
                  آیا از بازنشانی تمامی وضعیت‌های نمایش و دسترسی‌های منو به حالت پیش‌فرض اولیه اطمینان
                  دارید؟ تمامی تغییرات اختصاصی اعمال شده لغو خواهند شد.
                </p>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    انصراف
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={resetting}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow flex items-center gap-1.5"
                  >
                    {resetting ? 'در حال بازنشانی...' : 'بله، بازنشانی شود'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
