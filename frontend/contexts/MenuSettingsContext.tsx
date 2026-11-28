'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react'
import { useAuth } from './AuthContext'
import { menuSettingsApi } from '@/lib/api/menuSettings'
import type {
  MenuSettingItem,
  UpdateMenuSettingsPayload,
  CreateMenuSettingPayload,
  UpdateMenuSettingMetadataPayload,
} from '@/types/menuSettings'

interface MenuSettingsContextType {
  settings: MenuSettingItem[]
  loading: boolean
  mutating: boolean
  error: string | null
  isEditMode: boolean
  setIsEditMode: React.Dispatch<React.SetStateAction<boolean>>
  refreshSettings: (options?: { silent?: boolean }) => Promise<void>
  isModuleVisible: (moduleIdOrKey: string) => boolean
  isActionVisible: (actionHrefOrKey: string, parentModuleIdOrKey?: string) => boolean
  getModuleSetting: (moduleIdOrKey: string) => MenuSettingItem | undefined
  updateSettings: (payload: UpdateMenuSettingsPayload) => Promise<MenuSettingItem[]>
  resetSettings: () => Promise<MenuSettingItem[]>
  createSetting: (payload: CreateMenuSettingPayload) => Promise<MenuSettingItem[]>
  updateSettingMetadata: (
    menuKey: string,
    payload: UpdateMenuSettingMetadataPayload
  ) => Promise<MenuSettingItem[]>
  deleteSetting: (menuKey: string) => Promise<MenuSettingItem[]>
  toggleItemVisibility: (menuKey: string) => Promise<MenuSettingItem[]>
  reorderSiblings: (
    orderedMenuKeys: string[],
    startOrder?: number
  ) => Promise<MenuSettingItem[]>
}

export const MODULE_KEY_MAP: Record<string, string> = {
  'employee-evaluation': 'module_evaluation',
  'collaborative-payroll': 'module_payroll',
  'tax-refund': 'module_tax_refund',
  'executive-reporting': 'module_reporting',
  'reporting': 'module_reporting',
  'admin': 'module_admin',
  'nav_home': 'nav_home',
}

export const ACTION_ROUTE_MAP: Record<string, string> = {
  '/reports': 'action_evaluation_list',
  '/reports/create': 'action_evaluation_create',
  '/reports/search': 'action_evaluation_search',
  '/payroll/cycles': 'action_payroll_cycles',
  '/payroll/cycles/create': 'action_payroll_create_cycle',
  'action_payroll_create_cycle': 'action_payroll_create_cycle',
  '/payroll/cycles/delete': 'action_payroll_delete_cycle',
  'action_payroll_delete_cycle': 'action_payroll_delete_cycle',
  '/payroll/my-department': 'action_payroll_department',
  '/payroll': 'action_payroll_quick',
  '/payroll/history': 'action_payroll_history',
  '/refunds': 'action_refund_list',
  '/refunds/new': 'action_refund_new',
  '/refunds/calculator': 'action_refund_calculator',
  '/reporting': 'action_reporting_view_dashboard',
  '/reporting/standard': 'action_reporting_standard_reports',
  '/reporting/builder': 'action_reporting_builder',
  '/reporting/saved': 'action_reporting_saved',
  '/reporting/standard?modal=upload': 'action_reporting_create_custom_dataset',
  'action_reporting_create_custom_dataset': 'action_reporting_create_custom_dataset',
  'action_reporting_view_dashboard': 'action_reporting_view_dashboard',
  'action_reporting_standard_reports': 'action_reporting_standard_reports',
  'action_reporting_builder': 'action_reporting_builder',
  'action_reporting_saved': 'action_reporting_saved',
  'action_reporting_export': 'action_reporting_export',
  '/admin/users': 'action_admin_users',
  '/admin/roles': 'action_admin_roles',
  '/admin/menu-settings': 'action_admin_menus',
  '/admin/tax-sources': 'action_admin_tax_sources',
  'action_admin_tax_sources': 'action_admin_tax_sources',
  '/admin/finality-stages': 'action_admin_finality_stages',
  'action_admin_finality_stages': 'action_admin_finality_stages',
  '/admin/report-categories': 'action_admin_report_categories',
  'action_admin_report_categories': 'action_admin_report_categories',
  '/admin/auditor-metrics': 'action_reporting_auditor_metrics',
  'action_reporting_auditor_metrics': 'action_reporting_auditor_metrics',
  'action_admin_auditor_metrics': 'action_admin_auditor_metrics',
  '/admin/branding': 'action_admin_branding',
  'action_admin_branding': 'action_admin_branding',
}

const MenuSettingsContext = createContext<MenuSettingsContextType | undefined>(undefined)

export function MenuSettingsProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [settings, setSettings] = useState<MenuSettingItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [mutating, setMutating] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState<boolean>(false)

  const isAdmin = user?.role === 'Admin'

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      setIsEditMode(false)
    }
  }, [isAuthenticated, isAdmin])

  const fetchSettings = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false
    try {
      if (!silent) {
        setLoading(true)
      }
      setError(null)
      // If admin, fetch all settings so the admin dashboard can show disabled items with toggles
      const data = await menuSettingsApi.getMenuSettings(isAdmin)
      setSettings(data)
    } catch (err: any) {
      console.warn('Could not fetch dynamic menu settings, using defaults.', err)
      setError('خطا در دریافت تنظیمات منو')
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [isAdmin])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings, isAuthenticated, user?.role])

  // Dictionary lookup by MenuKey
  const settingsByKey = useMemo(() => {
    const dict: Record<string, MenuSettingItem> = {}
    for (const item of settings) {
      dict[item.menuKey.toLowerCase()] = item
    }
    return dict
  }, [settings])

  // Dictionary lookup by Route
  const settingsByRoute = useMemo(() => {
    const dict: Record<string, MenuSettingItem> = {}
    for (const item of settings) {
      if (item.route) {
        dict[item.route.toLowerCase()] = item
        const trimmed = item.route.replace(/\/+$/, '').toLowerCase()
        if (trimmed) dict[trimmed] = item
      }
    }
    return dict
  }, [settings])

  const isRolePermitted = useCallback((item: MenuSettingItem): boolean => {
    if (isAdmin) return true
    if (!item.isVisible) return false
    if (item.adminOnly) return false
    if (item.allowedRoles && item.allowedRoles.length > 0) {
      if (!user?.role) return false
      const userRole = user.role.toLowerCase()
      return item.allowedRoles.some((r) => {
        const rLower = r.toLowerCase()
        return (
          rLower === userRole ||
          (userRole === 'expert' && rLower === 'employee') ||
          (userRole === 'officehead' && rLower === 'manager')
        )
      })
    }
    return true
  }, [isAdmin, user?.role])

  const isModuleVisible = useCallback(
    (moduleIdOrKey: string): boolean => {
      // While initial settings are loading, do not show modules to prevent unauthorized flashing
      if (loading) return false

      const normalizedKey = (MODULE_KEY_MAP[moduleIdOrKey] || moduleIdOrKey).toLowerCase()

      // Home link is always visible
      if (normalizedKey === 'nav_home') {
        const homeItem = settingsByKey['nav_home']
        return homeItem ? homeItem.isVisible : true
      }

      // If user is not authenticated, show landing showcase modules (admin is always blocked)
      if (!isAuthenticated) {
        if (normalizedKey === 'module_admin' || normalizedKey === 'admin') return false
        return true
      }

      // If settings array is empty after loading, user has no permitted modules
      if (settings.length === 0) return false

      const item = settingsByKey[normalizedKey]
      // If item was not returned by backend (or does not exist), user has no permission
      if (!item) return false

      if (!item.isVisible) return false
      return isRolePermitted(item)
    },
    [loading, isAuthenticated, settings.length, settingsByKey, isRolePermitted]
  )

  const isActionVisible = useCallback(
    (actionHrefOrKey: string, parentModuleIdOrKey?: string): boolean => {
      if (loading) return false
      if (!isAuthenticated) return false
      if (settings.length === 0) return false

      // First check if parent module is visible
      if (parentModuleIdOrKey) {
        const parentVisible = isModuleVisible(parentModuleIdOrKey)
        if (!parentVisible) return false
      }

      // Check action by key or route
      const trimmedRoute = actionHrefOrKey.trim().replace(/\/+$/, '') || '/'
      const actionKey = ACTION_ROUTE_MAP[trimmedRoute] || ACTION_ROUTE_MAP[actionHrefOrKey] || actionHrefOrKey
      let item = settingsByKey[actionKey.toLowerCase()]
      if (!item) {
        item = settingsByRoute[trimmedRoute.toLowerCase()] || settingsByRoute[actionHrefOrKey.toLowerCase()]
      }

      // If action was not returned by backend, user has no permission
      if (!item) return false

      if (!item.isVisible) return false
      if (!isRolePermitted(item)) return false

      // Also verify item.parentKey if present
      if (item.parentKey) {
        const parentVisible = isModuleVisible(item.parentKey)
        if (!parentVisible) return false
      }

      return true
    },
    [loading, isAuthenticated, settings.length, settingsByKey, settingsByRoute, isModuleVisible, isRolePermitted]
  )

  const getModuleSetting = useCallback(
    (moduleIdOrKey: string): MenuSettingItem | undefined => {
      const normalizedKey = (MODULE_KEY_MAP[moduleIdOrKey] || moduleIdOrKey).toLowerCase()
      return settingsByKey[normalizedKey]
    },
    [settingsByKey]
  )

  const runMutation = useCallback(
    async (
      operation: () => Promise<MenuSettingItem[]>,
      fallbackError: string
    ): Promise<MenuSettingItem[]> => {
      setMutating(true)
      setError(null)
      try {
        const updated = await operation()
        setSettings(updated)
        return updated
      } catch (err: any) {
        setError(err?.response?.data?.error || fallbackError)
        throw err
      } finally {
        setMutating(false)
      }
    },
    []
  )

  const updateSettings = useCallback(
    (payload: UpdateMenuSettingsPayload) =>
      runMutation(
        () => menuSettingsApi.updateMenuSettings(payload),
        'خطا در ذخیره‌سازی تنظیمات'
      ),
    [runMutation]
  )

  const resetSettings = useCallback(
    () =>
      runMutation(
        () => menuSettingsApi.resetMenuSettings(),
        'خطا در بازنشانی تنظیمات'
      ),
    [runMutation]
  )

  const createSetting = useCallback(
    (payload: CreateMenuSettingPayload) =>
      runMutation(
        () => menuSettingsApi.createMenuSetting(payload),
        'خطا در ایجاد گزینه منو'
      ),
    [runMutation]
  )

  const updateSettingMetadata = useCallback(
    (menuKey: string, payload: UpdateMenuSettingMetadataPayload) =>
      runMutation(
        () => menuSettingsApi.updateMenuSettingMetadata(menuKey, payload),
        'خطا در ویرایش گزینه منو'
      ),
    [runMutation]
  )

  const deleteSetting = useCallback(
    (menuKey: string) =>
      runMutation(
        () => menuSettingsApi.deleteMenuSetting(menuKey),
        'خطا در حذف گزینه منو'
      ),
    [runMutation]
  )

  const toggleItemVisibility = useCallback(
    async (menuKey: string): Promise<MenuSettingItem[]> => {
      const target = settingsByKey[menuKey.toLowerCase()]
      if (!target) {
        throw new Error('گزینه منوی مورد نظر یافت نشد.')
      }

      return updateSettings({
        settings: [
          {
            menuKey: target.menuKey,
            isVisible: !target.isVisible,
            adminOnly: target.adminOnly,
            // Omit allowedRoles for non-adminOnly items so custom role lists are preserved verbatim
            allowedRoles: target.adminOnly ? ['Admin'] : undefined,
            displayOrder: target.displayOrder,
          },
        ],
      })
    },
    [settingsByKey, updateSettings]
  )

  const reorderSiblings = useCallback(
    async (
      orderedMenuKeys: string[],
      startOrder: number = 1
    ): Promise<MenuSettingItem[]> => {
      const itemsToUpdate = orderedMenuKeys
        .map((key, index) => {
          const item = settingsByKey[key.toLowerCase()]
          if (!item) return null
          return {
            menuKey: item.menuKey,
            isVisible: item.isVisible,
            adminOnly: item.adminOnly,
            allowedRoles: item.adminOnly ? ['Admin'] : undefined,
            displayOrder: startOrder + index,
          }
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)

      if (itemsToUpdate.length === 0) return settings
      return updateSettings({ settings: itemsToUpdate })
    },
    [settingsByKey, settings, updateSettings]
  )

  return (
    <MenuSettingsContext.Provider
      value={{
        settings,
        loading,
        mutating,
        error,
        isEditMode: isAdmin ? isEditMode : false,
        setIsEditMode,
        refreshSettings: fetchSettings,
        isModuleVisible,
        isActionVisible,
        getModuleSetting,
        updateSettings,
        resetSettings,
        createSetting,
        updateSettingMetadata,
        deleteSetting,
        toggleItemVisibility,
        reorderSiblings,
      }}
    >
      {children}
    </MenuSettingsContext.Provider>
  )
}

export function useMenuSettings() {
  const context = useContext(MenuSettingsContext)
  if (!context) {
    throw new Error('useMenuSettings must be used within a MenuSettingsProvider')
  }
  return context
}
