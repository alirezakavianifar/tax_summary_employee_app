'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TrendingUp, FileSpreadsheet, Sliders, BookmarkCheck, BarChart3 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useBranding } from '@/contexts/BrandingContext'
import { useMenuSettings } from '@/contexts/MenuSettingsContext'
import { resolveMenuIcon } from '@/lib/icons/menuIcons'

interface NavTab {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const DEFAULT_TABS: NavTab[] = [
  { title: 'داشبورد مدیریتی (KPI)', href: '/reporting', icon: TrendingUp },
  { title: 'گزارش‌های استاندارد', href: '/reporting/standard', icon: FileSpreadsheet },
  { title: 'گزارش‌ساز پویا', href: '/reporting/builder', icon: Sliders },
  { title: 'الگوهای ذخیره‌شده', href: '/reporting/saved', icon: BookmarkCheck },
]

export default function ReportingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { branding } = useBranding()
  const { settings, isActionVisible } = useMenuSettings()

  const reportingModule = useMemo(() => {
    return settings.find((s) => s.menuKey === 'module_reporting')
  }, [settings])

  const moduleTitle = reportingModule?.title || branding.reportingModuleTitle || 'سامانه آمار و هوش تجاری'
  const moduleSubtitle = branding.reportingModuleSubtitle || branding.organizationName || 'اداره کل امور مالیاتی استان خوزستان'
  const ModuleIcon = reportingModule ? resolveMenuIcon(reportingModule.iconName, BarChart3) : BarChart3

  const accessibleTabs = useMemo(() => {
    if (!reportingModule?.children?.length) {
      return DEFAULT_TABS.filter((t) => {
        if (t.href === '/reporting/builder') {
          return user?.role === 'Admin' || user?.role === 'DirectorGeneral' || user?.role === 'Manager'
        }
        return true
      })
    }

    return reportingModule.children
      .filter((child) => child.isVisible && isActionVisible(child.route, 'module_reporting'))
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((child) => ({
        title: child.title,
        href: child.route,
        icon: resolveMenuIcon(child.iconName, FileSpreadsheet),
      }))
  }, [reportingModule, isActionVisible, user])

  return (
    <div className="min-h-screen bg-slate-50/60 print:min-h-0 print:bg-white" dir="rtl">
      {/* Module Sub-Navigation Bar */}
      <div className="bg-white border-b border-slate-200/80 shadow-xs sticky top-16 z-30 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20 shadow-xs">
                <ModuleIcon className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                  {moduleTitle}
                </span>
                <span className="text-[10px] text-slate-400">{moduleSubtitle}</span>
              </div>
            </div>

            <nav className="flex items-center gap-1 sm:gap-2">
              {accessibleTabs.map((tab) => {
                const isActive =
                  pathname === tab.href ||
                  (tab.href !== '/reporting' && pathname.startsWith(tab.href))
                const Icon = tab.icon

                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-amber-500 text-white shadow-xs shadow-amber-500/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.title}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 print:max-w-none print:p-0 print:m-0">
        {children}
      </main>
    </div>
  )
}
