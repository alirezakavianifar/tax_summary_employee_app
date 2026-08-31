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
        <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-primary-950 to-indigo-950 text-white p-6 sm:p-10 lg:p-12 shadow-2xl overflow-hidden border border-white/10">
          {/* Background Decorative Glow */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content (RTL right-aligned text) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Organization Branding Pill */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-primary-200 border border-white/15 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-white p-0.5 flex items-center justify-center shadow">
                  <img
                    src="/images/Intamedia_Logo.png"
                    alt="نشان رسمی اداره کل امور مالیاتی استان خوزستان"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-emerald-300 font-bold">اداره کل امور مالیاتی استان خوزستان</span>
                <span className="text-white/40">|</span>
                <span className="text-gray-200">درگاه خدمات سازمانی و منابع انسانی</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
                سامانه جامع امور اداری، ارزیابی و محاسبات حقوقی
              </h1>

              <p className="text-xs sm:text-sm lg:text-base text-gray-300 leading-relaxed max-w-2xl font-normal">
                پرتال یکپارچه مدیریت فرآیندهای ارزیابی شایستگی و انتصابات مدیریتی، ارزیابی داوطلبین و محاسبه دقیق دوره‌های اضافه کار و رفاهیات ادارات و واحدهای تابعه اداره کل امور مالیاتی استان خوزستان.
              </p>

              {/* Action buttons & Login Status */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                {isAuthenticated ? (
                  <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-2.5">
                    <div className="w-9 h-9 rounded-full bg-primary-500/30 border border-primary-400/40 flex items-center justify-center font-bold text-sm text-primary-200">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-xs text-gray-300 block">کاربر فعال:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{user?.username}</span>
                        <span className="text-[11px] bg-primary-500/20 text-primary-300 px-2 py-0.5 rounded-md font-medium border border-primary-500/30">
                          نقش: {user?.role}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-primary-500/25"
                    >
                      <LogIn className="w-4 h-4" />
                      ورود به حساب کاربری
                    </Link>
                    <span className="text-xs text-gray-400">جهت دسترسی به فرم‌ها و پنل‌های مدیریتی</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Visual Image Showcase (Hero Image) */}
            <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
              <div className="relative group w-full max-w-md">
                {/* Ambient glow behind image */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-indigo-500 rounded-3xl blur-xl opacity-40 group-hover:opacity-70 transition duration-500" />
                
                {/* Main Illustration Container */}
                <div className="relative rounded-2xl overflow-hidden border border-white/20 bg-slate-900/80 shadow-2xl">
                  <img
                    src="/images/tax_hero_illustration.jpg"
                    alt="نمای هوشمند سامانه امور مالیاتی کشور"
                    className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Glassmorphism Floating Overlays */}
                  <div className="absolute bottom-3 right-3 left-3 bg-slate-950/75 backdrop-blur-md rounded-xl p-3 border border-white/15 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-semibold text-gray-200 text-[11px]">سامانه یکپارچه هوشمند مالیاتی</span>
                    </div>
                    <span className="text-[10px] text-amber-300 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                      نسخه پرتال ۲.۰
                    </span>
                  </div>
                </div>
              </div>
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

        {/* Organizational Tax Administration Identity Section */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 border border-gray-800 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-emerald-500/40 shadow-lg flex-shrink-0 bg-white p-2 flex items-center justify-center">
              <img
                src="/images/Intamedia_Logo.png"
                alt="لوگوی رسمی اداره کل امور مالیاتی استان خوزستان"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                اداره کل امور مالیاتی استان خوزستان
                <span className="text-[10px] font-normal text-emerald-300 bg-emerald-400/15 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                  سازمان امور مالیاتی کشور
                </span>
              </h4>
              <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
                سامانه هوشمند پایش ارزیابی انتصابات و محاسبات رفاهی و اضافه کار — طراحی شده منطبق با آخرین بخشنامه‌ها و ضوابط اداری اداره کل امور مالیاتی استان خوزستان.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0 w-full md:w-auto justify-end">
            <a
              href="https://www.intamedia.ir"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-gray-200 border border-white/10 transition-colors"
            >
              پرتال اطلاع‌رسانی سازمان
            </a>
            <a
              href="https://my.tax.gov.ir"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-primary-600 hover:bg-primary-500 text-white transition-colors shadow"
            >
              درگاه ملی خدمات مالیاتی
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 py-4">
          <p>سامانه یکپارچه مدیریت منابع انسانی و امور اداری — تمامی حقوق متعلق به اداره کل امور مالیاتی استان خوزستان می‌باشد.</p>
        </div>
      </div>
    </main>
  )
}
