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
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useMenuSettings } from '@/contexts/MenuSettingsContext'
import { getAuthorizedPortalModules } from '@/lib/modules/portalRegistry'
import { resolveMenuIcon } from '@/lib/icons/menuIcons'

export interface NavActionItem {
  id: string
  title: string
  description?: string
  href: string
  icon: LucideIcon
  isExternal?: boolean
  displayOrder?: number
}

export interface NavSection {
  id: string
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
  displayOrder: number
}

interface AdminActionDef extends NavActionItem {
  checkVisibility: boolean
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
    title: 'فهرست و مدیریت کاربران',
    description: 'تعیین نقش‌ها و ادارات سازمانی',
    href: '/admin/users',
    icon: Users,
    checkVisibility: true,
  },
  {
    id: 'admin-users-create',
    title: 'تعریف کاربر جدید',
    description: 'افزودن دسترسی کاربری جدید',
    href: '/admin/users/create',
    icon: UserPlus,
    checkVisibility: true,
  },
  {
    id: 'admin-roles',
    title: 'مدیریت نقش‌ها و اختیارات',
    description: 'تعریف نقش‌های سازمانی و اختیارات سفارشی',
    href: '/admin/roles',
    icon: Shield,
    checkVisibility: true,
  },
  {
    id: 'admin-menu-settings',
    title: 'مدیریت منوها و دسترسی‌ها',
    description: 'پیکربندی نمایش و مخفی‌سازی گزینه‌های منو',
    href: '/admin/menu-settings',
    icon: Sliders,
    checkVisibility: true,
  },
  {
    id: 'admin-audit-logs',
    title: 'لاگ‌ها و رویدادهای امنیتی',
    description: 'پایش تاریخچه تغییرات و رویدادهای سامانه',
    href: '/admin/audit-logs',
    icon: History,
    checkVisibility: true,
  },
  {
    id: 'admin-auditor-metrics',
    title: 'شاخص‌های عملکرد حسابرسان',
    description: 'پیکربندی فرمول‌ها، اوزان و شبیه‌سازی زنده',
    href: '/admin/auditor-metrics',
    icon: Award,
    checkVisibility: false,
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

/**
 * Builds the authorized, visibility-filtered navigation sections (combining
 * built-in portal modules, admin actions, and admin-created custom menus)
 * along with active route state for the sidebar and mobile drawer.
 */
export function usePortalNavigation() {
  const { user, isAuthenticated } = useAuth()
  const { settings, isModuleVisible, isActionVisible, loading: menuLoading } = useMenuSettings()
  const pathname = usePathname()

  const showHome = isModuleVisible('nav_home')

  const sections = useMemo<NavSection[]>(() => {
    if (!isAuthenticated) return []

    const settingsByKey = new Map(
      settings.map((s) => [s.menuKey.toLowerCase(), s])
    )

    const customChildrenByParent = new Map<string, NavActionItem[]>()
    for (const item of settings) {
      if (!item.isCustom || !item.parentKey) continue
      const parentKey = item.parentKey.toLowerCase()
      if (!isActionVisible(item.menuKey, item.parentKey)) continue

      const list = customChildrenByParent.get(parentKey) ?? []
      list.push({
        id: item.menuKey,
        title: item.title,
        description: item.description || undefined,
        href: item.route,
        icon: resolveMenuIcon(item.iconName, Link2),
        isExternal: isExternalHref(item.route),
        displayOrder: item.displayOrder,
      })
      customChildrenByParent.set(parentKey, list)
    }

    const mergeWithCustomChildren = (
      builtInActions: NavActionItem[],
      settingKey: string
    ): NavActionItem[] => {
      const customChildren = (customChildrenByParent.get(settingKey) ?? [])
        .filter((custom) => !builtInActions.some((b) => b.href === custom.href))
        .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999))
      return [...builtInActions, ...customChildren]
    }

    const modules = getAuthorizedPortalModules(user?.role)
    const builtSections: NavSection[] = []

    modules.forEach((mod, index) => {
      if (!isModuleVisible(mod.id)) return

      const settingKey = (REGISTRY_TO_SETTING_KEY[mod.id] || mod.id).toLowerCase()
      const builtInActions: NavActionItem[] = mod
        .getAuthorizedActions(user?.role)
        .filter((a) => isActionVisible(a.href, mod.id))
        .map((a) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          href: a.href,
          icon: a.icon,
          isExternal: isExternalHref(a.href),
        }))

      const mergedActions = mergeWithCustomChildren(builtInActions, settingKey)
      if (mergedActions.length === 0) return

      builtSections.push({
        id: mod.id,
        navTitle: mod.navTitle,
        title: mod.title,
        badgeText: mod.badgeText,
        icon: mod.icon,
        accentColor: mod.accentColor,
        iconBgColor: mod.iconBgColor,
        actions: mergedActions,
        displayOrder: settingsByKey.get(settingKey)?.displayOrder ?? index + 2,
      })
    })

    if (user?.role === 'Admin' && isModuleVisible('module_admin')) {
      const builtInAdmin: NavActionItem[] = ADMIN_ACTIONS
        .filter((item) => !item.checkVisibility || isActionVisible(item.href, 'admin'))
        .map(({ checkVisibility: _cv, ...action }) => ({
          ...action,
          isExternal: isExternalHref(action.href),
        }))

      const mergedAdmin = mergeWithCustomChildren(builtInAdmin, 'module_admin')
      if (mergedAdmin.length > 0) {
        builtSections.push({
          id: 'admin',
          navTitle: 'مدیریت سیستم',
          title: 'پنل راهبری و مدیریت سیستم',
          badgeText: 'راهبری سامانه',
          icon: ShieldCheck,
          accentColor: 'text-purple-600',
          iconBgColor: 'bg-purple-50 text-purple-600',
          actions: mergedAdmin,
          isAdmin: true,
          displayOrder: settingsByKey.get('module_admin')?.displayOrder ?? 100,
        })
      }
    }

    // Append custom top-level modules or standalone custom links created by Admin
    for (const item of settings) {
      const key = item.menuKey.toLowerCase()
      if (!item.isCustom || item.parentKey || BUILT_IN_ROOT_KEYS.has(key)) continue
      if (!isModuleVisible(item.menuKey)) continue

      const childActions = (customChildrenByParent.get(key) ?? [])
        .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999))

      const hasChildren = childActions.length > 0
      builtSections.push({
        id: item.menuKey,
        navTitle: item.title,
        title: item.title,
        badgeText: 'منوی سفارشی',
        icon: resolveMenuIcon(item.iconName, hasChildren ? Folder : Link2),
        accentColor: 'text-indigo-600',
        iconBgColor: 'bg-indigo-50 text-indigo-600',
        actions: childActions,
        directHref: hasChildren ? undefined : item.route,
        isExternal: hasChildren ? false : isExternalHref(item.route),
        isCustom: true,
        displayOrder: item.displayOrder,
      })
    }

    return builtSections.sort((a, b) => a.displayOrder - b.displayOrder)
  }, [isAuthenticated, user?.role, settings, isModuleVisible, isActionVisible])

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
    sections,
    menuLoading,
    isActionActive,
    isSectionActive,
    activeSectionIds,
  }
}
