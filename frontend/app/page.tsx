'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { getUserDisplayName } from '@/types/auth'
import { getAuthorizedPortalModules } from '@/lib/modules/portalRegistry'
import ModuleCard from '@/components/portal/ModuleCard'
import {
  Calendar,
  Layers,
  LogIn,
  ExternalLink,
  HelpCircle,
  Activity,
  CheckCircle2,
} from 'lucide-react'
import { useMenuSettings } from '@/contexts/MenuSettingsContext'
import {
  getTodayJalali,
  getJalaliWeekday,
  PERSIAN_WEEK_DAYS,
  PERSIAN_MONTH_NAMES,
  toPersianDigits,
} from '@/lib/jalali'

export default function HomePage() {
  const { user, isAuthenticated } = useAuth()
  const { isModuleVisible } = useMenuSettings()
  const [todayString, setTodayString] = useState<string>('')

  useEffect(() => {
    try {
      const { jy, jm, jd } = getTodayJalali()
      const weekday = getJalaliWeekday(jy, jm, jd)
      const dayName = PERSIAN_WEEK_DAYS[weekday]?.name || ''
      const monthName = PERSIAN_MONTH_NAMES[jm - 1] || ''
      setTodayString(`${dayName}، ${toPersianDigits(jd)} ${monthName} ${toPersianDigits(jy)}`)
    } catch {
      // Fallback in case of date error
    }
  }, [])

  const modules = getAuthorizedPortalModules(user?.role)
  const visibleModules = modules.filter((m) => isModuleVisible(m.id))

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100/60 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Compact Executive Hero Banner */}
        <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-primary-950 to-indigo-950 text-white p-5 sm:p-7 shadow-xl overflow-hidden border border-white/10">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  سامانه‌های یکپارچه برخط
                </span>

                {todayString && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                    <Calendar className="w-3 h-3 text-primary-300" />
                    <span>{todayString}</span>
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
                سامانه یکپارچه امور سازمانی و مالیاتی
              </h1>

              <p className="text-xs sm:text-sm text-gray-300 max-w-2xl font-normal leading-relaxed">
                {isAuthenticated ? (
                  <span>
                    خوش آمدید، <strong className="text-white font-semibold">{getUserDisplayName(user)}</strong>. کلیه کارپوشه‌ها و ابزارهای سازمانی در دسترس شما قرار دارد.
                  </span>
                ) : (
                  <span>
                    درگاه خدمات الکترونیک، ارزیابی انتصابات، محاسبات مشارکتی حقوق و استرداد مالیات اداره کل امور مالیاتی استان خوزستان
                  </span>
                )}
              </p>
            </div>

            {/* Quick Hero Meta / Auth Button */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-start md:justify-end flex-shrink-0">
              {isAuthenticated ? (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-3.5 py-2 text-xs">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span className="text-gray-200">وضعیت دسترسی:</span>
                  <span className="text-emerald-300 font-bold">فعال و متصل</span>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-md hover:shadow-primary-500/25"
                >
                  <LogIn className="w-4 h-4" />
                  ورود به حساب کاربری
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Modules Section Header */}
        <div className="flex items-center justify-between border-b border-gray-200/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-primary-100 text-primary-700 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-gray-900">
                سامانه‌ها و کارپوشه‌های عملیاتی
              </h2>
              <p className="text-xs text-gray-500">
                جهت دسترسی به خدمات و بخش‌های هر ماژول، گزینه مورد نظر را انتخاب نمایید.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full border border-gray-200/80">
            {toPersianDigits(visibleModules.length)} سامانه فعال
          </span>
        </div>

        {/* Extensible Modules Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {visibleModules.map((module) => (
            <ModuleCard key={module.id} module={module} userRole={user?.role} />
          ))}
        </div>

        {/* Streamlined Government Identity & Utility Footer */}
        <footer className="mt-12 pt-6 border-t border-gray-200/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-white p-0.5 border border-gray-200 shadow-xs flex items-center justify-center flex-shrink-0">
              <img
                src="/images/Intamedia_Logo.png"
                alt="لوگوی اداره کل امور مالیاتی استان خوزستان"
                className="w-full h-full object-contain"
              />
            </div>
            <p>
              اداره کل امور مالیاتی استان خوزستان — تمامی حقوق محفوظ است.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/about"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-gray-500" />
              راهنمای سامانه
            </Link>

            <a
              href="https://www.intamedia.ir"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              پرتال سازمان امور مالیاتی
              <ExternalLink className="w-3 h-3 text-gray-400" />
            </a>

            <a
              href="https://my.tax.gov.ir"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200/60 transition-colors font-medium"
            >
              درگاه ملی خدمات مالیاتی
              <ExternalLink className="w-3 h-3 text-primary-500" />
            </a>

            <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-1 rounded border border-gray-200 font-mono">
              v2.0
            </span>
          </div>
        </footer>
      </div>
    </main>
  )
}
