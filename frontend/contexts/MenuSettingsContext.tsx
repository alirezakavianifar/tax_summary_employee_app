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
} from '@/types/menuSettings'

interface MenuSettingsContextType {
  settings: MenuSettingItem[]
  loading: boolean
  error: string | null
  refreshSettings: () => Promise<void>
  isModuleVisible: (moduleIdOrKey: string) => boolean
  isActionVisible: (actionHrefOrKey: string, parentModuleIdOrKey?: string) => boolean
  updateSettings: (payload: UpdateMenuSettingsPayload) => Promise<void>
  resetSettings: () => Promise<void>
}

const MODULE_KEY_MAP: Record<string, string> = {
  'employee-evaluation': 'module_evaluation',
  'collaborative-payroll': 'module_payroll',
  'tax-refund': 'module_tax_refund',
  'admin': 'module_admin',
  'nav_home': 'nav_home',
}

const ACTION_ROUTE_MAP: Record<string, string> = {
  '/reports': 'action_evaluation_list',
  '/reports/create': 'action_evaluation_create',
  '/reports/search': 'action_evaluation_search',
  '/payroll/cycles': 'action_payroll_cycles',
  '/payroll/my-department': 'action_payroll_department',
  '/payroll': 'action_payroll_quick',
  '/payroll/history': 'action_payroll_history',
  '/refunds': 'action_refund_list',
  '/refunds/new': 'action_refund_new',
  '/refunds/calculator': 'action_refund_calculator',
  '/admin/users': 'action_admin_users',
  '/admin/menu-settings': 'action_admin_menus',
}

const MenuSettingsContext = createContext<MenuSettingsContextType | undefined>(undefined)

export function MenuSettingsProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [settings, setSettings] = useState<MenuSettingItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = user?.role === 'Admin'

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      // If admin, fetch all settings so the admin dashboard can show disabled items with toggles
      const data = await menuSettingsApi.getMenuSettings(isAdmin)
      setSettings(data)
    } catch (err: any) {
      console.warn('Could not fetch dynamic menu settings, using defaults.', err)
      setError('خطا در دریافت تنظیمات منو')
    } finally {
      setLoading(false)
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
      }
    }
    return dict
  }, [settings])

  const isModuleVisible = useCallback(
    (moduleIdOrKey: string): boolean => {
      if (settings.length === 0) return true

      const normalizedKey = (MODULE_KEY_MAP[moduleIdOrKey] || moduleIdOrKey).toLowerCase()
      const item = settingsByKey[normalizedKey]
      if (!item) return true

      if (!item.isVisible) return false
      if (item.adminOnly && !isAdmin) return false

      return true
    },
    [settings.length, settingsByKey, isAdmin]
  )

  const isActionVisible = useCallback(
    (actionHrefOrKey: string, parentModuleIdOrKey?: string): boolean => {
      if (settings.length === 0) return true

      // First check if parent module is visible
      if (parentModuleIdOrKey) {
        const parentVisible = isModuleVisible(parentModuleIdOrKey)
        if (!parentVisible) return false
      }

      // Check action by key or route
      const actionKey = ACTION_ROUTE_MAP[actionHrefOrKey] || actionHrefOrKey
      let item = settingsByKey[actionKey.toLowerCase()]
      if (!item) {
        item = settingsByRoute[actionHrefOrKey.toLowerCase()]
      }

      if (!item) return true

      if (!item.isVisible) return false
      if (item.adminOnly && !isAdmin) return false

      // Also verify item.parentKey if present
      if (item.parentKey) {
        const parentItem = settingsByKey[item.parentKey.toLowerCase()]
        if (parentItem) {
          if (!parentItem.isVisible) return false
          if (parentItem.adminOnly && !isAdmin) return false
        }
      }

      return true
    },
    [settings.length, settingsByKey, settingsByRoute, isModuleVisible, isAdmin]
  )

  const updateSettings = useCallback(
    async (payload: UpdateMenuSettingsPayload) => {
      setLoading(true)
      try {
        const updated = await menuSettingsApi.updateMenuSettings(payload)
        setSettings(updated)
      } catch (err: any) {
        setError(err?.response?.data?.error || 'خطا در ذخیره‌سازی تنظیمات')
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const resetSettings = useCallback(async () => {
    setLoading(true)
    try {
      const reset = await menuSettingsApi.resetMenuSettings()
      setSettings(reset)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'خطا در بازنشانی تنظیمات')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <MenuSettingsContext.Provider
      value={{
        settings,
        loading,
        error,
        refreshSettings: fetchSettings,
        isModuleVisible,
        isActionVisible,
        updateSettings,
        resetSettings,
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
