'use client'

import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { getAuthorizedPortalModules } from '@/lib/modules/portalRegistry'
import ModuleCard from '@/components/portal/ModuleCard'
import {
  Sparkles,
  Users,
  ShieldCheck,
  HelpCircle,
  LogIn,
  Layers,
} from 'lucide-react'

export default function HomePage() {
  const { user, isAuthenticated } = useAuth()
  const modules = getAuthorizedPortalModules(user?.role)

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Hero Welcome Section */}
        <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-primary-950 to-indigo-950 text-white p-8 sm:p-12 shadow-xl overflow-hidden">
          {/* Background Decorative Glow */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-primary-200 mb-4 border border-white/10">
                <Sparkles className="w-3.5 h-3.5 text-primary-400" />
                درگاه یکپارچه خدمات سازمانی و منابع انسانی
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                سامانه جامع امور اداری، ارزیابی و محاسبات حقوقی
              </h1>

              <p className="text-sm sm:text-base text-gray-300 mt-4 leading-relaxed max-w-2xl font-normal">
                پرتال یکپارچه مدیریت فرآیندهای ارزیابی شایستگی کارکنان، تصمیم‌گیری در انتصابات مدیریتی و
                محاسبه مشارکتی دوره‌های اضافه کار و رفاهی ادارات تابعه.
              </p>
            </div>

            {/* User status / Login status badge */}
            <div className="flex-shrink-0 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 text-right w-full sm:w-auto">
              {isAuthenticated ? (
                <div>
                  <span className="text-xs text-gray-300 block">کاربر وارد شده:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-8 h-8 rounded-full bg-primary-500/30 border border-primary-400/40 flex items-center justify-center font-bold text-sm text-primary-200">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-white block">{user?.username}</span>
                      <span className="text-xs text-primary-300 font-medium">نقش: {user?.role}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-xs text-gray-300 block">جهت دسترسی به پنل‌ها:</span>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-sm"
                  >
                    <LogIn className="w-4 h-4" />
                    ورود به حساب کاربری
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modules Section Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
              <Layers className="w-6 h-6 text-primary-600" />
              ماژول‌ها و سامانه‌های فعال پرتال
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              جهت ورود به هر بخش، بر روی سامانه مورد نظر کلیک نمایید.
            </p>
          </div>
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {modules.length} سامانه اصلی
          </span>
        </div>

        {/* Extensible Modules Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {modules.map((module) => (
            <ModuleCard key={module.id} module={module} userRole={user?.role} />
          ))}
        </div>

        {/* Quick Utilities & Shortcuts Bar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary-600" />
            دسترسی‌های سریع و راهنمای سامانه
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {user?.role === 'Admin' && (
              <Link
                href="/admin/users"
                className="p-4 rounded-xl bg-gray-50 hover:bg-primary-50/50 border border-gray-200 hover:border-primary-300 transition-all flex items-center gap-3 group"
              >
                <div className="p-2.5 bg-white rounded-lg border border-gray-200 group-hover:border-primary-200 shadow-xs">
                  <ShieldCheck className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-900 block group-hover:text-primary-700">
                    مدیریت کاربران و دسترسی‌ها
                  </span>
                  <span className="text-[11px] text-gray-500">تعریف حساب‌ها و سطوح سازمانی</span>
                </div>
              </Link>
            )}

            <Link
              href="/reports/search"
              className="p-4 rounded-xl bg-gray-50 hover:bg-primary-50/50 border border-gray-200 hover:border-primary-300 transition-all flex items-center gap-3 group"
            >
              <div className="p-2.5 bg-white rounded-lg border border-gray-200 group-hover:border-primary-200 shadow-xs">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-900 block group-hover:text-primary-700">
                  بانک سوابق و جستجوی پرسنل
                </span>
                <span className="text-[11px] text-gray-500">فیلتر و مشاهده پرونده کارکنان</span>
              </div>
            </Link>

            <Link
              href="/about"
              className="p-4 rounded-xl bg-gray-50 hover:bg-primary-50/50 border border-gray-200 hover:border-primary-300 transition-all flex items-center gap-3 group"
            >
              <div className="p-2.5 bg-white rounded-lg border border-gray-200 group-hover:border-primary-200 shadow-xs">
                <HelpCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-900 block group-hover:text-primary-700">
                  راهنمای سامانه و دستورالعمل‌ها
                </span>
                <span className="text-[11px] text-gray-500">مستندات و فرآیندهای سازمانی</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 py-4">
          <p>سامانه یکپارچه مدیریت منابع انسانی و امور مالیاتی — نسخه ۲.۰.۰</p>
        </div>
      </div>
    </main>
  )
}
