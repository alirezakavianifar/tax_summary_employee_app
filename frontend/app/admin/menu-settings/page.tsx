'use client'

import React, { useState, useEffect, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import MenuItemFormModal from '@/components/admin/MenuItemFormModal'
import { useMenuSettings } from '@/contexts/MenuSettingsContext'
import { menuSettingsApi } from '@/lib/api/menuSettings'
import { resolveMenuIcon } from '@/lib/icons/menuIcons'
import {
  ORGANIZATIONAL_ROLES,
  getRoleLabel,
  getPresetRoles,
  toggleRoleSelection,
  type RolePreset,
} from '@/lib/constants/menuRoles'
import type {
  MenuSettingItem,
  UpdateMenuSettingItem,
  CreateMenuSettingPayload,
  UpdateMenuSettingMetadataPayload,
} from '@/types/menuSettings'
import {
  Sliders,
  Eye,
  EyeOff,
  RotateCcw,
  Save,
  Search,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Shield,
  ChevronDown,
  ChevronUp,
  Users,
  FileText,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react'

function sanitizeMenuItemRoles(data: MenuSettingItem[]): MenuSettingItem[] {
  return data.map((item) => {
    let roles = item.allowedRoles ? [...item.allowedRoles] : []
    if (!roles.some((r) => r.toLowerCase() === 'officehead')) {
      roles = roles.filter((r) => r.toLowerCase() !== 'manager')
    }
    if (!roles.some((r) => r.toLowerCase() === 'expert')) {
      roles = roles.filter((r) => r.toLowerCase() !== 'employee')
    }
    return { ...item, allowedRoles: roles }
  })
}

function MenuSettingsAdminContent() {
  const searchParams = useSearchParams()
  const highlightKey = searchParams?.get('highlight') || null
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
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuSettingItem | null>(null)
  const [initialParentKey, setInitialParentKey] = useState<string | null>(null)
  const [mutatingCustom, setMutatingCustom] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MenuSettingItem | null>(null)

  const syncWithServerList = (data: MenuSettingItem[]) => {
    const sanitized = sanitizeMenuItemRoles(data)
    setItems(sanitized)
    setOriginalItems(JSON.parse(JSON.stringify(sanitized)))
  }

  // Load all settings for admin
  const loadData = async () => {
    try {
      setLoading(true)
      setStatusMessage(null)
      const data = await menuSettingsApi.getAllSettingsForAdmin()
      syncWithServerList(data)
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

  // Auto-expand parent module and scroll to highlighted item if requested
  useEffect(() => {
    if (highlightKey && items.length > 0) {
      const target = items.find(
        (i) => i.menuKey.toLowerCase() === highlightKey.toLowerCase()
      )
      if (target?.parentKey) {
        setCollapsedParents((prev) => ({
          ...prev,
          [target.parentKey!]: false,
        }))
      }
      const timer = setTimeout(() => {
        const el = document.getElementById(`menu-item-${highlightKey.toLowerCase()}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 350)
      return () => clearTimeout(timer)
    }
  }, [highlightKey, items])

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
      const itemRoles = (item.allowedRoles || []).slice().sort().join(',')
      const origRoles = (orig.allowedRoles || []).slice().sort().join(',')
      if (itemRoles !== origRoles) {
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
      if (!orig) continue
      const itemRoles = (item.allowedRoles || []).slice().sort().join(',')
      const origRoles = (orig.allowedRoles || []).slice().sort().join(',')
      if (item.isVisible !== orig.isVisible || item.adminOnly !== orig.adminOnly || itemRoles !== origRoles) {
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

  // Toggle Admin Only (backward compatibility helper)
  const toggleAdminOnly = (menuKey: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.menuKey === menuKey) {
          const newAdminOnly = !item.adminOnly
          const newRoles = newAdminOnly ? ['Admin'] : ['Admin', 'Manager', 'Employee']
          return { ...item, adminOnly: newAdminOnly, allowedRoles: newRoles }
        }
        return item
      })
    )
  }

  // Toggle specific role for a menu item
  const toggleRole = (menuKey: string, role: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.menuKey === menuKey) {
          const currentRoles = item.allowedRoles && item.allowedRoles.length > 0
            ? [...item.allowedRoles]
            : (item.adminOnly ? ['Admin'] : ['Admin', 'OfficeHead', 'GroupHead', 'Expert', 'ITSpecialist', 'Manager', 'Employee'])

          const newRoles = toggleRoleSelection(currentRoles, role)
          const isActuallyAdminOnly = !newRoles.some((r) => r.toLowerCase() !== 'admin')

          return {
            ...item,
            allowedRoles: newRoles,
            adminOnly: isActuallyAdminOnly,
          }
        }
        return item
      })
    )
  }

  // Set roles by quick preset
  const setRolesPreset = (menuKey: string, preset: RolePreset) => {
    const newRoles = getPresetRoles(preset)

    setItems((prev) =>
      prev.map((item) => {
        if (item.menuKey === menuKey) {
          return {
            ...item,
            allowedRoles: newRoles,
            adminOnly: preset === 'admin',
          }
        }
        return item
      })
    )
  }

  // Apply parent module roles to all its child actions
  const applyRolesToChildren = (parentKey: string) => {
    const parent = items.find((i) => i.menuKey === parentKey)
    if (!parent) return

    const parentRoles = parent.allowedRoles || (parent.adminOnly ? ['Admin'] : ['Admin', 'Manager', 'Employee'])

    setItems((prev) =>
      prev.map((item) => {
        if (item.parentKey === parentKey) {
          return {
            ...item,
            allowedRoles: [...parentRoles],
            adminOnly: parent.adminOnly,
          }
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

      const updatePayload: UpdateMenuSettingItem[] = items.map((i) => {
        let roles = i.allowedRoles ? [...i.allowedRoles] : (i.adminOnly ? ['Admin'] : ['Admin', 'Manager', 'Employee'])
        if (!roles.some((r) => r.toLowerCase() === 'officehead')) {
          roles = roles.filter((r) => r.toLowerCase() !== 'manager')
        }
        if (!roles.some((r) => r.toLowerCase() === 'expert')) {
          roles = roles.filter((r) => r.toLowerCase() !== 'employee')
        }
        return {
          menuKey: i.menuKey,
          isVisible: i.isVisible,
          adminOnly: i.adminOnly,
          allowedRoles: roles,
          displayOrder: i.displayOrder,
        }
      })

      const updated = await menuSettingsApi.updateMenuSettings({ settings: updatePayload })
      setItems(updated)
      setOriginalItems(JSON.parse(JSON.stringify(updated)))
      await refreshSettings()

      setStatusMessage({
        type: 'success',
        text: 'تنظیمات نمایش و دسترسی نقش‌ها با موفقیت ذخیره شد و تغییرات بلافاصله اعمال گردید.',
      })

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
      syncWithServerList(defaults)
      await refreshSettings()

      setStatusMessage({
        type: 'success',
        text: 'گزینه‌های پیش‌فرض منو بازنشانی شدند (گزینه‌های سفارشی حفظ گردیدند).',
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

  const openCreateModal = (parentKey: string | null = null) => {
    setEditingItem(null)
    setInitialParentKey(parentKey)
    setIsFormModalOpen(true)
  }

  const openEditModal = (item: MenuSettingItem) => {
    setEditingItem(item)
    setInitialParentKey(item.parentKey)
    setIsFormModalOpen(true)
  }

  const handleCreateCustomItem = async (payload: CreateMenuSettingPayload) => {
    setMutatingCustom(true)
    try {
      const updated = await menuSettingsApi.createMenuSetting(payload)
      syncWithServerList(updated)
      await refreshSettings()
      setStatusMessage({
        type: 'success',
        text: `گزینه منوی «${payload.title}» با موفقیت ایجاد و در نوار ناوبری فعال شد.`,
      })
    } finally {
      setMutatingCustom(false)
    }
  }

  const handleUpdateCustomItem = async (
    menuKey: string,
    payload: UpdateMenuSettingMetadataPayload
  ) => {
    setMutatingCustom(true)
    try {
      const updated = await menuSettingsApi.updateMenuSettingMetadata(menuKey, payload)
      syncWithServerList(updated)
      await refreshSettings()
      setStatusMessage({
        type: 'success',
        text: `مشخصات گزینه «${payload.title}» با موفقیت به‌روزرسانی شد.`,
      })
    } finally {
      setMutatingCustom(false)
    }
  }

  const handleDeleteCustomItem = async () => {
    if (!deleteTarget) return
    try {
      setMutatingCustom(true)
      const targetTitle = deleteTarget.title
      const updated = await menuSettingsApi.deleteMenuSetting(deleteTarget.menuKey)
      setDeleteTarget(null)
      syncWithServerList(updated)
      await refreshSettings()
      setStatusMessage({
        type: 'success',
        text: `گزینه سفارشی «${targetTitle}» با موفقیت حذف شد.`,
      })
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.response?.data?.error || 'خطا در حذف گزینه منو',
      })
      setDeleteTarget(null)
    } finally {
      setMutatingCustom(false)
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
            <div className="flex flex-wrap items-center gap-3 self-end md:self-center">
              <button
                type="button"
                onClick={() => openCreateModal(null)}
                disabled={saving || resetting || mutatingCustom}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                افزودن گزینه منو
              </button>

              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                disabled={resetting || saving || mutatingCustom}
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

            <div className="flex items-center gap-4 text-[11px] text-gray-500 w-full sm:w-auto justify-end flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                مدیر ارشد
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                رئیس اداره
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                رئیس گروه
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                کارشناس
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                کارشناس فناوری
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
                const ModuleIcon = resolveMenuIcon(module.iconName, Layers)
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
                            {module.isCustom && (
                              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                                سفارشی
                              </span>
                            )}
                            {module.badgeText && (
                              <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                                {module.badgeText}
                              </span>
                            )}
                            {module.colorTheme && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 rounded-full">
                                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                {module.colorTheme}
                              </span>
                            )}
                            {module.adminOnly ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                                <Shield className="w-3 h-3" />
                                فقط مدیر ارشد
                              </span>
                            ) : (
                              <div className="flex items-center gap-1 flex-wrap">
                                {(module.allowedRoles && module.allowedRoles.length > 0 ? module.allowedRoles : ['Admin', 'OfficeHead', 'GroupHead', 'Expert', 'ITSpecialist'])
                                  .filter((r) => !['manager', 'employee'].includes(r.toLowerCase()))
                                  .map((r) => (
                                    <span
                                      key={r}
                                      className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-purple-50 text-purple-700 border-purple-200"
                                    >
                                      {getRoleLabel(r)}
                                    </span>
                                  ))}
                              </div>
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
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 self-stretch md:self-center justify-between md:justify-end">
                        {/* Role Selector Group */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                          <div className="flex items-center gap-1.5 bg-gray-50/90 p-1 rounded-xl border border-gray-200 flex-wrap">
                            {/* Admin Pill */}
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 cursor-default"
                              title="مدیر ارشد سیستم همواره به تمامی بخش‌ها دسترسی دارد"
                            >
                              <Shield className="w-3 h-3 text-purple-600" />
                              مدیر ارشد
                            </span>

                            {/* Organizational Roles Pills */}
                            {ORGANIZATIONAL_ROLES.map((roleDef) => {
                              const roles = module.allowedRoles && module.allowedRoles.length > 0
                                ? module.allowedRoles
                                : (module.adminOnly ? ['Admin'] : ['Admin', 'OfficeHead', 'GroupHead', 'Expert', 'ITSpecialist', 'Manager', 'Employee'])
                              const isActive = roles.some((r) => r.toLowerCase() === roleDef.key.toLowerCase())

                              return (
                                <button
                                  key={roleDef.key}
                                  type="button"
                                  onClick={() => toggleRole(module.menuKey, roleDef.key)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                    isActive
                                      ? roleDef.activeClass
                                      : 'bg-white text-gray-400 border-gray-200 line-through opacity-70 hover:opacity-100 hover:text-gray-600'
                                  }`}
                                  title={isActive ? `کلیک جهت لغو دسترسی ${roleDef.label}` : `کلیک جهت اعطای دسترسی به ${roleDef.label}`}
                                >
                                  <Users className="w-3 h-3" />
                                  {roleDef.label}
                                  {isActive && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />}
                                </button>
                              )
                            })}
                          </div>

                          {/* Quick Presets */}
                          <div className="flex items-center gap-1 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setRolesPreset(module.menuKey, 'all')}
                              className="text-[10px] px-1.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium transition-colors"
                              title="دسترسی به همه نقش‌ها"
                            >
                              همه
                            </button>
                            <button
                              type="button"
                              onClick={() => setRolesPreset(module.menuKey, 'managers')}
                              className="text-[10px] px-1.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium transition-colors"
                              title="دسترسی مدیران (رئیس اداره و رئیس گروه)"
                            >
                              مدیران
                            </button>
                            <button
                              type="button"
                              onClick={() => setRolesPreset(module.menuKey, 'experts')}
                              className="text-[10px] px-1.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium transition-colors"
                              title="دسترسی کارشناسان"
                            >
                              کارشناسان
                            </button>
                            <button
                              type="button"
                              onClick={() => setRolesPreset(module.menuKey, 'admin')}
                              className="text-[10px] px-1.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium transition-colors"
                              title="انحصاری فقط مدیر ارشد"
                            >
                              فقط مدیر
                            </button>
                            {children.length > 0 && (
                              <button
                                type="button"
                                onClick={() => applyRolesToChildren(module.menuKey)}
                                className="text-[10px] px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold border border-purple-200 transition-colors mr-1"
                                title="اعمال همین نقش‌های مجاز به کلیه زیرمنوهای این سامانه"
                              >
                                اعمال به زیرمنوها
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          {module.menuKey !== 'nav_home' && (
                            <button
                              type="button"
                              onClick={() => openCreateModal(module.menuKey)}
                              disabled={mutatingCustom}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors disabled:opacity-50"
                              title="افزودن زیرمنوی سفارشی به این بخش"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              افزودن زیرمنو
                            </button>
                          )}

                          <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-0.5 bg-gray-50/70">
                            <button
                              type="button"
                              onClick={() => openEditModal(module)}
                              disabled={mutatingCustom}
                              className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors disabled:opacity-50"
                              title={module.isCustom ? "ویرایش ماژول سفارشی" : "ویرایش عنوان، رنگ تم و کارت ماژول"}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            {module.isCustom && (
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(module)}
                                disabled={mutatingCustom}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-50"
                                title="حذف ماژول سفارشی"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
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
                            <span className="text-xs font-bold w-10 text-right">
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
                              type="button"
                              onClick={() => toggleCollapse(module.menuKey)}
                              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors mr-1"
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
                            const ChildIcon = resolveMenuIcon(child.iconName, FileText)
                            const isChildInactive = !child.isVisible || isParentHidden
                            const isHighlighted = Boolean(
                              highlightKey && child.menuKey.toLowerCase() === highlightKey.toLowerCase()
                            )

                            return (
                              <div
                                key={child.id}
                                id={`menu-item-${child.menuKey.toLowerCase()}`}
                                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                                  isHighlighted
                                    ? 'ring-2 ring-primary-500 bg-primary-50/30 border-primary-400 shadow-md'
                                    : isChildInactive
                                    ? 'bg-gray-100/70 border-gray-200 text-gray-500'
                                    : child.adminOnly
                                    ? 'bg-white border-purple-200 shadow-xs'
                                    : 'bg-white border-gray-200 shadow-xs'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className={`p-2 rounded-lg flex-shrink-0 ${
                                      isHighlighted
                                        ? 'bg-primary-600 text-white shadow-xs'
                                        : isChildInactive
                                        ? 'bg-gray-200 text-gray-400'
                                        : child.adminOnly
                                        ? 'bg-purple-50 text-purple-600'
                                        : 'bg-primary-50 text-primary-600'
                                    }`}
                                  >
                                    <ChildIcon className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-xs font-bold text-gray-900 truncate block">
                                        {child.title}
                                      </span>
                                      {child.isCustom && (
                                        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded-full">
                                          سفارشی
                                        </span>
                                      )}
                                      {isHighlighted && (
                                        <span className="text-[9px] font-black text-white bg-primary-600 px-2 py-0.5 rounded-full shadow-xs animate-pulse">
                                          تنظیم انتخابی
                                        </span>
                                      )}
                                      {child.adminOnly ? (
                                        <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                                          فقط مدیر
                                        </span>
                                      ) : (
                                        <div className="flex items-center gap-1 flex-wrap">
                                          {(child.allowedRoles || [])
                                            .filter((r) => !['manager', 'employee'].includes(r.toLowerCase()))
                                            .map((r) => (
                                              <span
                                                key={r}
                                                className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-gray-100 text-gray-700 border border-gray-200"
                                              >
                                                {getRoleLabel(r)}
                                              </span>
                                            ))}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] text-gray-400 font-mono block truncate">
                                        {child.route}
                                      </span>
                                      {child.description && (
                                        <>
                                          <span className="text-gray-300 text-[10px]">•</span>
                                          <span className="text-[10px] text-gray-500 truncate block" title={child.description}>
                                            {child.description}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {/* Child Role Selector Pills */}
                                  <div className="flex items-center gap-1 bg-gray-50 p-0.5 rounded-lg border border-gray-200 flex-wrap">
                                    {ORGANIZATIONAL_ROLES.map((roleDef) => {
                                      const roles = child.allowedRoles && child.allowedRoles.length > 0
                                        ? child.allowedRoles
                                        : (child.adminOnly ? ['Admin'] : ['Admin', 'OfficeHead', 'GroupHead', 'Expert', 'ITSpecialist', 'Manager', 'Employee'])
                                      const isActive = roles.some((r) => r.toLowerCase() === roleDef.key.toLowerCase())

                                      return (
                                        <button
                                          key={roleDef.key}
                                          type="button"
                                          onClick={() => toggleRole(child.menuKey, roleDef.key)}
                                          className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${
                                            isActive
                                              ? roleDef.activeClass
                                              : 'bg-white text-gray-400 border-gray-200 line-through'
                                          }`}
                                          title={isActive ? `لغو دسترسی ${roleDef.label}` : `اعطای دسترسی به ${roleDef.label}`}
                                        >
                                          {roleDef.shortLabel}
                                        </button>
                                      )
                                    })}
                                  </div>

                                  <div className="flex items-center gap-0.5 border border-gray-200 rounded-lg p-0.5 bg-gray-50/70">
                                    <button
                                      type="button"
                                      onClick={() => openEditModal(child)}
                                      disabled={mutatingCustom}
                                      className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors disabled:opacity-50"
                                      title={child.isCustom ? "ویرایش زیرمنوی سفارشی" : "ویرایش عنوان، آیکون و اولویت زیرمنو"}
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    {child.isCustom && (
                                      <button
                                        type="button"
                                        onClick={() => setDeleteTarget(child)}
                                        disabled={mutatingCustom}
                                        className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-50"
                                        title="حذف زیرمنوی سفارشی"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>

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
                  آیا از بازنشانی تمامی وضعیت‌های نمایش و دسترسی‌های منوهای پیش‌فرض سیستم به حالت اولیه اطمینان دارید؟
                  گزینه‌های سفارشی ایجاد شده توسط مدیر حذف نخواهند شد و حفظ می‌شوند.
                </p>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
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

          {/* Create / Edit Custom Menu Item Modal */}
          <MenuItemFormModal
            isOpen={isFormModalOpen}
            editingItem={editingItem}
            initialParentKey={initialParentKey}
            rootModules={rootModules}
            hasChildren={Boolean(editingItem && (childrenByParent[editingItem.menuKey]?.length || 0) > 0)}
            submitting={mutatingCustom}
            onClose={() => {
              setIsFormModalOpen(false)
              setEditingItem(null)
            }}
            onSubmitCreate={handleCreateCustomItem}
            onSubmitUpdate={handleUpdateCustomItem}
          />

          {/* Delete Custom Menu Item Confirmation Modal */}
          {deleteTarget !== null && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-gray-200 shadow-2xl space-y-4">
                <div className="flex items-center gap-3 text-rose-600">
                  <div className="p-2.5 bg-rose-50 rounded-xl">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">حذف گزینه منوی سفارشی</h3>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">
                  آیا از حذف گزینه منوی <span className="font-bold text-gray-900">«{deleteTarget.title}»</span> اطمینان دارید؟ این عملیات قابل بازگشت نیست.
                </p>

                {(childrenByParent[deleteTarget.menuKey]?.length || 0) > 0 && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs leading-relaxed">
                    هشدار: این بخش دارای {childrenByParent[deleteTarget.menuKey].length} زیرمنو است. با حذف این گزینه، تمامی زیرمنوهای سفارشی آن نیز به صورت خودکار حذف خواهند شد.
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(null)}
                    disabled={mutatingCustom}
                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomItem()}
                    disabled={mutatingCustom}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {mutatingCustom ? 'در حال حذف...' : 'بله، حذف شود'}
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

export default function MenuSettingsAdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MenuSettingsAdminContent />
    </Suspense>
  )
}
