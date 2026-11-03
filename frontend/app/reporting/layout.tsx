'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TrendingUp, FileSpreadsheet, Sliders, BookmarkCheck, BarChart3, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function ReportingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()

  const tabs = [
    { title: 'داشبورد مدیریتی (KPI)', href: '/reporting', icon: TrendingUp },
    { title: 'گزارش‌های استاندارد', href: '/reporting/standard', icon: FileSpreadsheet },
    { title: 'گزارش‌ساز پویا', href: '/reporting/builder', icon: Sliders, minRole: 'Manager' },
    { title: 'الگوهای ذخیره‌شده', href: '/reporting/saved', icon: BookmarkCheck },
  ]

  const accessibleTabs = tabs.filter((t) => {
    if (!t.minRole) return true
    if (!user) return false
    return user.role === 'Admin' || user.role === 'DirectorGeneral' || user.role === t.minRole
  })

  return (
    <div className="min-h-screen bg-slate-50/60 print:min-h-0 print:bg-white" dir="rtl">
      {/* Module Sub-Navigation Bar */}
      <div className="bg-white border-b border-slate-200/80 shadow-xs sticky top-16 z-30 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20 shadow-xs">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                  سامانه آمار و هوش تجاری
                </span>
                <span className="text-[10px] text-slate-400">اداره کل امور مالیاتی استان خوزستان</span>
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
