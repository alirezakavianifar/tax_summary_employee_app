'use client'

import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  TrendingUp,
  FileSpreadsheet,
  Sliders,
  BookmarkCheck,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useBranding } from '@/contexts/BrandingContext'
import { useMenuSettings } from '@/contexts/MenuSettingsContext'
import { resolveMenuIcon } from '@/lib/icons/menuIcons'
import {
  isExternalHref,
  isMostSpecificRouteMatch,
} from '@/components/layout/usePortalNavigation'

interface NavTab {
  key: string
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  isExternal?: boolean
}

const DEFAULT_REPORTING_SUBTITLE = 'سامانه آمار و هوش تجاری'

/**
 * Capability/permission entries under `module_reporting` that guard in-page
 * buttons (export, upload modal, edit drawer, delete modal) rather than unique
 * navigation views. They remain in MenuSettings & SidebarNav but are excluded
 * from the horizontal sub-navigation strip.
 */
const EXCLUDED_SUBNAV_ACTION_KEYS = new Set([
  'action_reporting_export',
  'action_reporting_create_custom_dataset',
  'action_reporting_edit_custom_dataset',
  'action_reporting_delete_custom_dataset',
])

const DEFAULT_TABS: NavTab[] = [
  { key: 'action_reporting_view_dashboard', title: 'داشبورد مدیریتی (KPI)', href: '/reporting', icon: TrendingUp },
  { key: 'action_reporting_standard_reports', title: 'گزارش‌های استاندارد', href: '/reporting/standard', icon: FileSpreadsheet },
  { key: 'action_reporting_builder', title: 'گزارش‌ساز پویا', href: '/reporting/builder', icon: Sliders },
  { key: 'action_reporting_saved', title: 'الگوهای ذخیره‌شده', href: '/reporting/saved', icon: BookmarkCheck },
]

export default function ReportingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { branding, showReportingSubNav, setShowReportingSubNav } = useBranding()
  const { settings, isActionVisible } = useMenuSettings()
  const navRef = useRef<HTMLElement | null>(null)
  const [scrollState, setScrollState] = useState({ canPrev: false, canNext: false })
  const [togglingSubNav, setTogglingSubNav] = useState(false)
  const [toggleError, setToggleError] = useState<string | null>(null)
  const isAdmin = user?.role === 'Admin'

  const reportingModule = useMemo(() => {
    return settings.find((s) => s.menuKey === 'module_reporting')
  }, [settings])

  // Prefer explicit branding override when changed from default; otherwise follow module_reporting title
  const moduleTitle =
    (branding.reportingModuleTitle &&
    branding.reportingModuleTitle.trim() !== DEFAULT_REPORTING_SUBTITLE
      ? branding.reportingModuleTitle
      : null) ||
    reportingModule?.title ||
    branding.reportingModuleTitle ||
    DEFAULT_REPORTING_SUBTITLE
  const moduleSubtitle =
    branding.reportingModuleSubtitle || branding.organizationName || 'اداره کل امور مالیاتی استان خوزستان'
  const ModuleIcon = reportingModule ? resolveMenuIcon(reportingModule.iconName, BarChart3) : BarChart3

  const accessibleTabs = useMemo<NavTab[]>(() => {
    if (!reportingModule?.children?.length) {
      return DEFAULT_TABS.filter((t) => {
        if (t.href === '/reporting/builder') {
          return user?.role === 'Admin' || user?.role === 'DirectorGeneral' || user?.role === 'Manager'
        }
        return true
      })
    }

    const seenRoutes = new Set<string>()
    const tabs: NavTab[] = []

    const sortedChildren = [...reportingModule.children]
      .filter((child) => {
        const keyLower = child.menuKey.toLowerCase()
        if (EXCLUDED_SUBNAV_ACTION_KEYS.has(keyLower)) return false
        return child.isVisible && isActionVisible(child.menuKey || child.route, 'module_reporting')
      })
      .sort((a, b) => a.displayOrder - b.displayOrder)

    for (const child of sortedChildren) {
      const normalizedRoute = child.route.trim().replace(/\/+$/, '').toLowerCase() || '/'
      if (seenRoutes.has(normalizedRoute)) continue
      seenRoutes.add(normalizedRoute)

      tabs.push({
        key: child.menuKey,
        title: child.title,
        href: child.route,
        icon: resolveMenuIcon(child.iconName, FileSpreadsheet),
        isExternal: isExternalHref(child.route),
      })
    }

    return tabs
  }, [reportingModule, isActionVisible, user])

  const allTabHrefs = useMemo(() => accessibleTabs.map((t) => t.href), [accessibleTabs])

  const updateScrollButtons = useCallback(() => {
    const el = navRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    if (maxScroll <= 2) {
      setScrollState({ canPrev: false, canNext: false })
      return
    }
    // In RTL, scrollLeft can be 0..-maxScroll (Chrome/Firefox) or 0..maxScroll; use abs magnitude
    const absScroll = Math.abs(el.scrollLeft)
    setScrollState({
      canPrev: absScroll > 4,
      canNext: absScroll < maxScroll - 4,
    })
  }, [])

  useEffect(() => {
    if (!showReportingSubNav) return
    updateScrollButtons()
    window.addEventListener('resize', updateScrollButtons)
    return () => window.removeEventListener('resize', updateScrollButtons)
  }, [showReportingSubNav, accessibleTabs, updateScrollButtons])

  const scrollTabs = (direction: 'start' | 'end') => {
    const el = navRef.current
    if (!el) return
    // In RTL, scrolling toward start (right) is positive and toward end (left) is negative
    const delta = direction === 'start' ? 180 : -180
    el.scrollBy({ left: delta, behavior: 'smooth' })
  }

  const handleToggleSubNav = async (visible: boolean) => {
    if (togglingSubNav) return
    setToggleError(null)
    try {
      setTogglingSubNav(true)
      await setShowReportingSubNav(visible)
    } catch (err: any) {
      setToggleError(err?.message || 'خطا در تغییر وضعیت نمایش نوار ناوبری گزارش‌ها')
    } finally {
      setTogglingSubNav(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/60 print:min-h-0 print:bg-white" dir="rtl">
      {/* Module Sub-Navigation Bar (Admin-toggleable via SystemSettings) */}
      {showReportingSubNav && (
        <div className="bg-white border-b border-slate-200/80 shadow-xs sticky top-16 z-30 no-print">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:min-h-14 sm:py-2">
              <div className="flex items-center gap-2.5 shrink-0 min-w-0 sm:max-w-[260px] lg:max-w-xs">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20 shadow-xs shrink-0">
                  <ModuleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-extrabold text-slate-900 text-xs sm:text-sm leading-tight truncate">
                    {moduleTitle}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">{moduleSubtitle}</span>
                </div>
              </div>

              <div className="flex-1 min-w-0 flex items-center justify-start sm:justify-end gap-1">
                {scrollState.canPrev && (
                  <button
                    type="button"
                    onClick={() => scrollTabs('start')}
                    aria-label="اسکرول به راست در تب‌های گزارش"
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-2xs shrink-0 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <nav
                  ref={navRef}
                  onScroll={updateScrollButtons}
                  aria-label="ناوبری بخش گزارش‌ها و هوش تجاری"
                  className="min-w-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5"
                >
                  {accessibleTabs.map((tab) => {
                    const isActive = isMostSpecificRouteMatch(pathname, tab.href, allTabHrefs)
                    const Icon = tab.icon
                    const pillClasses = `inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                      isActive
                        ? 'bg-amber-500 text-white shadow-xs shadow-amber-500/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`

                    if (tab.isExternal) {
                      return (
                        <a
                          key={tab.key}
                          href={tab.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={pillClasses}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{tab.title}</span>
                          <ExternalLink className="w-3 h-3 opacity-70 shrink-0" />
                        </a>
                      )
                    }

                    return (
                      <Link key={tab.key} href={tab.href} className={pillClasses}>
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{tab.title}</span>
                      </Link>
                    )
                  })}
                </nav>

                {scrollState.canNext && (
                  <button
                    type="button"
                    onClick={() => scrollTabs('end')}
                    aria-label="اسکرول به چپ در تب‌های گزارش"
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-2xs shrink-0 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                )}

                {isAdmin && (
                  <>
                    <span className="h-5 w-px bg-slate-200 mx-1 hidden sm:block shrink-0" aria-hidden="true" />
                    <button
                      type="button"
                      disabled={togglingSubNav}
                      onClick={() => handleToggleSubNav(false)}
                      title="مخفی‌سازی نوار بالای گزارش‌ها (قابل بازگردانی از همین صفحه یا منوی مدیریت)"
                      aria-label="مخفی‌سازی نوار بالای گزارش‌ها"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-amber-50 hover:text-amber-800 border border-slate-200/80 hover:border-amber-200 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">مخفی‌سازی نوار</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtle Admin Restore Chip when Sub-Nav is Hidden */}
      {!showReportingSubNav && isAdmin && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 -mb-2 no-print print:hidden">
          <div className="flex items-center justify-end">
            <button
              type="button"
              disabled={togglingSubNav}
              onClick={() => handleToggleSubNav(true)}
              title="نمایش مجدد نوار ناوبری افقی بالای ماژول گزارش‌ها"
              aria-label="نمایش مجدد نوار ناوبری افقی بالای ماژول گزارش‌ها"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold text-slate-600 bg-white hover:bg-amber-50 hover:text-amber-800 border border-slate-200 hover:border-amber-300 shadow-2xs transition-colors disabled:opacity-50"
            >
              <Eye className="w-3.5 h-3.5 text-amber-600" />
              <span>نوار بالای گزارش‌ها مخفی است</span>
              <span className="text-amber-700 underline decoration-amber-400/70 underline-offset-2">
                نمایش مجدد
              </span>
            </button>
          </div>
        </div>
      )}

      {isAdmin && toggleError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 no-print print:hidden">
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{toggleError}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 print:max-w-none print:p-0 print:m-0">
        {children}
      </main>
    </div>
  )
}
