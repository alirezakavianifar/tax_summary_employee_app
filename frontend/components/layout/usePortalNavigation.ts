'use client'

import { useMemo, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import {
  Users,
  UserPlus,
  Shield,
  Sliders,
  History,
  Award,
  ShieldCheck,
  Folder,
  Link2,
  Palette,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  useMenuSettings,
  ACTION_ROUTE_MAP,
  MODULE_KEY_MAP,
} from '@/contexts/MenuSettingsContext'
import { getAuthorizedPortalModules } from '@/lib/modules/portalRegistry'
import { resolveMenuIcon } from '@/lib/icons/menuIcons'
import type { MenuSettingItem } from '@/types/menuSettings'

export interface NavActionItem {
  id: string
  menuKey?: string
  title: string
  description?: string
  href: string
  icon: LucideIcon
  isExternal?: boolean
  displayOrder?: number
  isVisible?: boolean
  isCustom?: boolean
  menuSetting?: MenuSettingItem
}

export interface NavSection {
  id: string
  menuKey: string
  navTitle: string
  title: string
  badgeText: string
  icon: LucideIcon
  accentColor: string
  iconBgColor: string
  actions: NavActionItem[]
  directHref?: string
  isExternal?: boolean
  isAdmin?: boolean
  isCustom?: boolean
  isVisible: boolean
  displayOrder: number
  menuSetting?: MenuSettingItem
}

interface AdminActionDef extends NavActionItem {
  checkVisibility: boolean
  settingKey: string
}

const REGISTRY_TO_SETTING_KEY: Record<string, string> = {
  'employee-evaluation': 'module_evaluation',
  'collaborative-payroll': 'module_payroll',
  'tax-refund': 'module_tax_refund',
  'executive-reporting': 'module_reporting',
  admin: 'module_admin',
}

const BUILT_IN_ROOT_KEYS = new Set([
  'nav_home',
  'module_evaluation',
  'module_payroll',
  'module_tax_refund',
  'module_reporting',
  'module_admin',
])

const ADMIN_ACTIONS: AdminActionDef[] = [
  {
    id: 'admin-users',
    settingKey: 'action_admin_users',
    title: 'فهرست و مدیریت کاربران',
    description: 'تعیین نقش‌ها و ادارات سازمانی',
    href: '/admin/users',
    icon: Users,
    checkVisibility: true,
  },
  {
    id: 'admin-users-create',
    settingKey: 'action_admin_users',
    title: 'تعریف کاربر جدید',
    description: 'افزودن دسترسی کاربری جدید',
    href: '/admin/users/create',
    icon: UserPlus,
    checkVisibility: true,
  },
  {
    id: 'admin-roles',
    settingKey: 'action_admin_roles',
    title: 'مدیریت نقش‌ها و اختیارات',
    description: 'تعریف نقش‌های سازمانی و اختیارات سفارشی',
    href: '/admin/roles',
    icon: Shield,
    checkVisibility: true,
  },
  {
    id: 'admin-menu-settings',
    settingKey: 'action_admin_menus',
    title: 'مدیریت منوها و دسترسی‌ها',
    description: 'پیکربندی نمایش و مخفی‌سازی گزینه‌های منو',
    href: '/admin/menu-settings',
    icon: Sliders,
    checkVisibility: true,
  },
  {
    id: 'admin-audit-logs',
    settingKey: 'action_admin_audit_logs',
    title: 'لاگ‌ها و رویدادهای امنیتی',
    description: 'پایش تاریخچه تغییرات و رویدادهای سامانه',
    href: '/admin/audit-logs',
    icon: History,
    checkVisibility: true,
  },
  {
    id: 'admin-auditor-metrics',
    settingKey: 'action_admin_auditor_metrics',
    title: 'شاخص‌های عملکرد حسابرسان',
    description: 'پیکربندی فرمول‌ها، اوزان و شبیه‌سازی زنده',
    href: '/admin/auditor-metrics',
    icon: Award,
    checkVisibility: false,
  },
  {
    id: 'admin-branding',
    settingKey: 'action_admin_branding',
    title: 'هویت بصری و برندینگ سازمان',
    description: 'شخصی‌سازی لوگو، نام اداره کل و عناوین سامانه',
    href: '/admin/branding',
    icon: Palette,
    checkVisibility: true,
  },
]

export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href.trim())
}

/**
 * Checks whether `href` is the most specific matching route for `pathname`
 * among a set of sibling links, avoiding double-highlighting parent prefixes
 * (e.g. `/payroll` vs `/payroll/cycles`).
 */
export function isMostSpecificRouteMatch(
  pathname: string,
  href: string,
  siblingHrefs: string[]
): boolean {
  if (!href || isExternalHref(href)) return false
  if (pathname === href) return true
  if (href === '/') return false

  const normalizedHref = href.replace(/\/+$/, '')
  if (!pathname.startsWith(`${normalizedHref}/`)) return false

  const hasLongerMatch = siblingHrefs.some((other) => {
    if (other === href || isExternalHref(other)) return false
    const normalizedOther = other.replace(/\/+$/, '')
    if (normalizedOther.length <= normalizedHref.length) return false
    return pathname === normalizedOther || pathname.startsWith(`${normalizedOther}/`)
  })

  return !hasLongerMatch
}

export interface UsePortalNavigationOptions {
  includeHiddenForAdmin?: boolean
}

/**
 * Builds the authorized, visibility-filtered navigation sections (combining
 * built-in portal modules, admin actions, and admin-created custom menus)
 * along with active route state for the sidebar and mobile drawer.
 */
export function usePortalNavigation(options?: UsePortalNavigationOptions) {
  const { user, isAuthenticated } = useAuth()
  const { settings, isModuleVisible, isActionVisible, loading: menuLoading } = useMenuSettings()
  const pathname = usePathname()

  const isAdmin = user?.role === 'Admin'
  const includeHidden = Boolean(isAdmin && options?.includeHiddenForAdmin)

  const homeSetting = useMemo(
    () => settings.find((s) => s.menuKey.toLowerCase() === 'nav_home'),
    [settings]
  )

  const showHome = isModuleVisible('nav_home') || (includeHidden && Boolean(homeSetting))

  const sections = useMemo<NavSection[]>(() => {
    if (!isAuthenticated) return []

    const settingsByKey = new Map(
      settings.map((s) => [s.menuKey.toLowerCase(), s])
    )
    const settingsByRoute = new Map<string, MenuSettingItem>()
    for (const item of settings) {
      if (item.route) {
        const lower = item.route.toLowerCase()
        const trimmed = lower.replace(/\/+$/, '') || '/'
        if (!settingsByRoute.has(lower)) settingsByRoute.set(lower, item)
        if (!settingsByRoute.has(trimmed)) settingsByRoute.set(trimmed, item)
      }
    }

    const resolveActionSetting = (
      href: string,
      explicitKey?: string
    ): MenuSettingItem | undefined => {
      if (explicitKey) {
        const direct = settingsByKey.get(explicitKey.toLowerCase())
        if (direct) return direct
      }
      const trimmed = href.trim().replace(/\/+$/, '') || '/'
      const mappedKey = (
        ACTION_ROUTE_MAP[trimmed] ||
        ACTION_ROUTE_MAP[href] ||
        ''
      ).toLowerCase()
      if (mappedKey && settingsByKey.has(mappedKey)) {
        return settingsByKey.get(mappedKey)
      }
      return (
        settingsByRoute.get(trimmed.toLowerCase()) ||
        settingsByRoute.get(href.toLowerCase())
      )
    }

    const customChildrenByParent = new Map<string, NavActionItem[]>()
    for (const item of settings) {
      if (!item.isCustom || !item.parentKey) continue
      const parentKey = item.parentKey.toLowerCase()
      if (!includeHidden && !isActionVisible(item.menuKey, item.parentKey)) continue

      const list = customChildrenByParent.get(parentKey) ?? []
      list.push({
        id: item.menuKey,
        menuKey: item.menuKey,
        title: item.title,
        description: item.description || undefined,
        href: item.route,
        icon: resolveMenuIcon(item.iconName, Link2),
        isExternal: isExternalHref(item.route),
        displayOrder: item.displayOrder,
        isVisible: item.isVisible,
        isCustom: true,
        menuSetting: item,
      })
      customChildrenByParent.set(parentKey, list)
    }

    const mergeWithCustomChildren = (
      builtInActions: NavActionItem[],
      settingKey: string
    ): NavActionItem[] => {
      const customChildren = (customChildrenByParent.get(settingKey) ?? []).filter(
        (custom) => !builtInActions.some((b) => b.href === custom.href)
      )
      return [...builtInActions, ...customChildren].sort(
        (a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999)
      )
    }

    const modules = getAuthorizedPortalModules(user?.role)
    const builtSections: NavSection[] = []

    modules.forEach((mod, index) => {
      const settingKey = (
        REGISTRY_TO_SETTING_KEY[mod.id] ||
        MODULE_KEY_MAP[mod.id] ||
        mod.id
      ).toLowerCase()
      const moduleSetting = settingsByKey.get(settingKey)
      const moduleVisible = isModuleVisible(mod.id)

      if (!moduleVisible && !(includeHidden && moduleSetting)) return

      const builtInActions: NavActionItem[] = mod
        .getAuthorizedActions(user?.role)
        .filter((a) => includeHidden || isActionVisible(a.href, mod.id))
        .map((a, actionIndex) => {
          const actionSetting = resolveActionSetting(a.href)
          return {
            id: a.id,
            menuKey: actionSetting?.menuKey,
            title: actionSetting?.title || a.title,
            description: actionSetting?.description ?? a.description,
            href: a.href,
            icon: actionSetting?.iconName
              ? resolveMenuIcon(actionSetting.iconName, a.icon)
              : a.icon,
            isExternal: isExternalHref(a.href),
            displayOrder: actionSetting?.displayOrder ?? actionIndex + 1,
            isVisible: actionSetting?.isVisible ?? true,
            isCustom: actionSetting?.isCustom ?? false,
            menuSetting: actionSetting,
          }
        })

      const mergedActions = mergeWithCustomChildren(builtInActions, settingKey)
      if (mergedActions.length === 0 && !includeHidden) return

      builtSections.push({
        id: mod.id,
        menuKey: settingKey,
        navTitle: moduleSetting?.title || mod.navTitle,
        title: moduleSetting?.title || mod.title,
        badgeText: moduleSetting?.badgeText || mod.badgeText,
        icon: moduleSetting?.iconName
          ? resolveMenuIcon(moduleSetting.iconName, mod.icon)
          : mod.icon,
        accentColor: mod.accentColor,
        iconBgColor: mod.iconBgColor,
        actions: mergedActions,
        isCustom: moduleSetting?.isCustom ?? false,
        isVisible: moduleSetting?.isVisible ?? true,
        displayOrder: moduleSetting?.displayOrder ?? index + 2,
        menuSetting: moduleSetting,
      })
    })

    const adminSetting = settingsByKey.get('module_admin')
    if (
      user?.role === 'Admin' &&
      (isModuleVisible('module_admin') || (includeHidden && Boolean(adminSetting)))
    ) {
      const builtInAdmin: NavActionItem[] = ADMIN_ACTIONS
        .filter(
          (item) =>
            includeHidden ||
            !item.checkVisibility ||
            isActionVisible(item.href, 'admin')
        )
        .map(({ checkVisibility: _cv, settingKey: actionSettingKey, ...action }, actionIndex) => {
          const actionSetting = resolveActionSetting(action.href, actionSettingKey)
          return {
            ...action,
            menuKey: actionSetting?.menuKey,
            title: actionSetting?.title || action.title,
            description: actionSetting?.description ?? action.description,
            icon: actionSetting?.iconName
              ? resolveMenuIcon(actionSetting.iconName, action.icon)
              : action.icon,
            isExternal: isExternalHref(action.href),
            displayOrder: actionSetting?.displayOrder ?? actionIndex + 1,
            isVisible: actionSetting?.isVisible ?? true,
            isCustom: actionSetting?.isCustom ?? false,
            menuSetting: actionSetting,
          }
        })

      const mergedAdmin = mergeWithCustomChildren(builtInAdmin, 'module_admin')
      if (mergedAdmin.length > 0 || includeHidden) {
        builtSections.push({
          id: 'admin',
          menuKey: 'module_admin',
          navTitle: adminSetting?.title || 'مدیریت سیستم',
          title: adminSetting?.title || 'پنل راهبری و مدیریت سیستم',
          badgeText: adminSetting?.badgeText || 'راهبری سامانه',
          icon: adminSetting?.iconName
            ? resolveMenuIcon(adminSetting.iconName, ShieldCheck)
            : ShieldCheck,
          accentColor: 'text-purple-600',
          iconBgColor: 'bg-purple-50 text-purple-600',
          actions: mergedAdmin,
          isAdmin: true,
          isCustom: adminSetting?.isCustom ?? false,
          isVisible: adminSetting?.isVisible ?? true,
          displayOrder: adminSetting?.displayOrder ?? 100,
          menuSetting: adminSetting,
        })
      }
    }

    // Append custom top-level modules or standalone custom links created by Admin
    for (const item of settings) {
      const key = item.menuKey.toLowerCase()
      if (!item.isCustom || item.parentKey || BUILT_IN_ROOT_KEYS.has(key)) continue
      if (!includeHidden && !isModuleVisible(item.menuKey)) continue

      const childActions = (customChildrenByParent.get(key) ?? []).sort(
        (a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999)
      )

      const hasChildren = childActions.length > 0
      builtSections.push({
        id: item.menuKey,
        menuKey: item.menuKey,
        navTitle: item.title,
        title: item.title,
        badgeText: item.badgeText || 'منوی سفارشی',
        icon: resolveMenuIcon(item.iconName, hasChildren ? Folder : Link2),
        accentColor: 'text-indigo-600',
        iconBgColor: 'bg-indigo-50 text-indigo-600',
        actions: childActions,
        directHref: hasChildren ? undefined : item.route,
        isExternal: hasChildren ? false : isExternalHref(item.route),
        isCustom: true,
        isVisible: item.isVisible,
        displayOrder: item.displayOrder,
        menuSetting: item,
      })
    }

    return builtSections.sort((a, b) => a.displayOrder - b.displayOrder)
  }, [
    isAuthenticated,
    user?.role,
    settings,
    includeHidden,
    isModuleVisible,
    isActionVisible,
  ])

  const allHrefs = useMemo(
    () =>
      sections.flatMap((s) =>
        s.directHref ? [s.directHref] : s.actions.map((a) => a.href)
      ),
    [sections]
  )

  const isActionActive = useCallback(
    (href: string) => isMostSpecificRouteMatch(pathname, href, allHrefs),
    [pathname, allHrefs]
  )

  const isSectionActive = useCallback(
    (section: NavSection) => {
      if (section.directHref) {
        return isActionActive(section.directHref)
      }
      if (section.isAdmin && pathname.startsWith('/admin')) {
        return section.actions.some((a) => isActionActive(a.href)) || pathname === '/admin'
      }
      return section.actions.some((a) => isActionActive(a.href))
    },
    [pathname, isActionActive]
  )

  const activeSectionIds = useMemo(
    () => sections.filter((s) => !s.directHref && isSectionActive(s)).map((s) => s.id),
    [sections, isSectionActive]
  )

  return {
    pathname,
    showHome,
    homeSetting,
    sections,
    menuLoading,
    isActionActive,
    isSectionActive,
    activeSectionIds,
  }
}
