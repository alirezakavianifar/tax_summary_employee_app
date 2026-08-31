'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getAuthorizedPortalModules } from '@/lib/modules/portalRegistry'
import {
  Home,
  LogOut,
  LogIn,
  ChevronDown,
  ShieldCheck,
  UserPlus,
  Users,
  Building2,
  Menu,
  X,
  Sparkles,
} from 'lucide-react'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mobileExpandedModule, setMobileExpandedModule] = useState<string | null>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  const modules = getAuthorizedPortalModules(user?.role)

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Close menus on route change
  useEffect(() => {
    setOpenDropdown(null)
    setIsUserMenuOpen(false)
    setIsMobileMenuOpen(false)
  }, [pathname])

  const toggleDropdown = (id: string) => {
    setOpenDropdown(openDropdown === id ? null : id)
  }

  const isModuleActive = (moduleId: string) => {
    const mod = modules.find((m) => m.id === moduleId)
    if (!mod) return false
    return mod.actions.some((a) => pathname === a.href || (a.href !== '/' && pathname.startsWith(a.href)))
  }

  const isAdminActive = () => pathname.startsWith('/admin')

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50 no-print" ref={navRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Right side (RTL Start): Logo and Modular Navigation */}
          <div className="flex items-center gap-6">
            {/* Logo / Brand */}
            <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black text-gray-900 leading-tight">
                  سامانه مدیریت یکپارچه
                </span>
                <span className="text-[10px] text-primary-600 font-bold">امور اداری و مالیاتی</span>
              </div>
            </Link>

            {/* Desktop Modular Navigation */}
            <div className="hidden lg:flex items-center space-x-1 space-x-reverse">
              {/* Home */}
              <Link
                href="/"
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                  pathname === '/'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Home className="w-4 h-4" />
                خانه
              </Link>

              {/* Dynamic Extensible Modules Dropdowns */}
              {isAuthenticated &&
                modules.map((mod) => {
                  const Icon = mod.icon
                  const active = isModuleActive(mod.id)
                  const isOpen = openDropdown === mod.id
                  const actions = mod.getAuthorizedActions(user?.role)

                  return (
                    <div key={mod.id} className="relative">
                      <button
                        onClick={() => toggleDropdown(mod.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                          active
                            ? `${mod.iconBgColor} ${mod.accentColor} ring-1 ring-inset ring-current/20`
                            : isOpen
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span>{mod.navTitle}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {/* Dropdown Menu */}
                      {isOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                          {/* Dropdown Header */}
                          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-900">{mod.title}</span>
                            <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                              {mod.badgeText}
                            </span>
                          </div>

                          {/* Action Items */}
                          <div className="p-1.5 space-y-1">
                            {actions.map((action) => {
                              const ActionIcon = action.icon
                              const isActionActive =
                                pathname === action.href ||
                                (action.href !== '/' && pathname.startsWith(action.href))

                              return (
                                <Link
                                  key={action.id}
                                  href={action.href}
                                  onClick={() => setOpenDropdown(null)}
                                  className={`flex items-start gap-3 p-2.5 rounded-xl text-right transition-colors ${
                                    isActionActive
                                      ? 'bg-primary-50 text-primary-800 font-bold'
                                      : 'hover:bg-gray-50 text-gray-700'
                                  }`}
                                >
                                  <div
                                    className={`p-2 rounded-lg flex-shrink-0 mt-0.5 ${
                                      isActionActive
                                        ? 'bg-primary-100 text-primary-700'
                                        : 'bg-gray-100 text-gray-500'
                                    }`}
                                  >
                                    <ActionIcon className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <span className="text-xs font-bold block">{action.title}</span>
                                    {action.description && (
                                      <span className="text-[11px] text-gray-400 font-normal line-clamp-1">
                                        {action.description}
                                      </span>
                                    )}
                                  </div>
                                </Link>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

              {/* Admin Management Dropdown */}
              {isAuthenticated && user?.role === 'Admin' && (
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown('admin')}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      isAdminActive()
                        ? 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200'
                        : openDropdown === 'admin'
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>مدیریت سیستم</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        openDropdown === 'admin' ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {openDropdown === 'admin' && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <span className="text-xs font-bold text-gray-900">پنل راهبری و مدیریت سیستم</span>
                      </div>
                      <div className="p-1.5 space-y-1">
                        <Link
                          href="/admin/users"
                          onClick={() => setOpenDropdown(null)}
                          className={`flex items-start gap-3 p-2.5 rounded-xl text-right transition-colors ${
                            pathname === '/admin/users'
                              ? 'bg-purple-50 text-purple-800 font-bold'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg flex-shrink-0 mt-0.5">
                            <Users className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold block">فهرست و مدیریت کاربران</span>
                            <span className="text-[11px] text-gray-400 font-normal">
                              تعیین نقش‌ها و ادارات سازمانی
                            </span>
                          </div>
                        </Link>

                        <Link
                          href="/admin/users/create"
                          onClick={() => setOpenDropdown(null)}
                          className={`flex items-start gap-3 p-2.5 rounded-xl text-right transition-colors ${
                            pathname === '/admin/users/create'
                              ? 'bg-purple-50 text-purple-800 font-bold'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg flex-shrink-0 mt-0.5">
                            <UserPlus className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold block">تعریف کاربر جدید</span>
                            <span className="text-[11px] text-gray-400 font-normal">
                              افزودن دسترسی کاربری جدید
                            </span>
                          </div>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Left side (RTL End): User Profile / Login Button & Mobile toggle */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 pr-2.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col text-left items-end">
                    <span className="text-xs font-bold text-gray-800 leading-tight">
                      {user?.username}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">{user?.role}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute left-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50">
                    <div className="px-4 py-2.5 border-b border-gray-100">
                      <span className="text-xs font-bold text-gray-800 block">{user?.username}</span>
                      <span className="text-[11px] text-primary-600 font-medium">نقش سازمانی: {user?.role}</span>
                    </div>

                    <button
                      onClick={() => {
                        logout()
                        setIsUserMenuOpen(false)
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 font-bold transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      خروج از حساب کاربری
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                ورود به سامانه
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ${
              pathname === '/' ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
            }`}
          >
            <Home className="w-4 h-4" />
            صفحه اصلی پرتال
          </Link>

          {isAuthenticated && (
            <div className="space-y-2">
              {modules.map((mod) => {
                const Icon = mod.icon
                const isExpanded = mobileExpandedModule === mod.id
                const actions = mod.getAuthorizedActions(user?.role)

                return (
                  <div key={mod.id} className="border border-gray-100 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setMobileExpandedModule(isExpanded ? null : mod.id)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 text-xs font-bold text-gray-900"
                    >
                      <span className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${mod.accentColor}`} />
                        {mod.title}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="p-2 space-y-1 bg-white">
                        {actions.map((action) => {
                          const ActionIcon = action.icon
                          return (
                            <Link
                              key={action.id}
                              href={action.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="flex items-center gap-2.5 p-2 rounded-lg text-xs text-gray-700 hover:bg-gray-50"
                            >
                              <ActionIcon className="w-4 h-4 text-gray-400" />
                              <span>{action.title}</span>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}

              {user?.role === 'Admin' && (
                <div className="border border-purple-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() =>
                      setMobileExpandedModule(mobileExpandedModule === 'admin' ? null : 'admin')
                    }
                    className="w-full flex items-center justify-between p-3 bg-purple-50/50 text-xs font-bold text-purple-900"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      مدیریت سیستم
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        mobileExpandedModule === 'admin' ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {mobileExpandedModule === 'admin' && (
                    <div className="p-2 space-y-1 bg-white">
                      <Link
                        href="/admin/users"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2.5 p-2 rounded-lg text-xs text-gray-700 hover:bg-gray-50"
                      >
                        <Users className="w-4 h-4 text-purple-500" />
                        <span>فهرست و مدیریت کاربران</span>
                      </Link>
                      <Link
                        href="/admin/users/create"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2.5 p-2 rounded-lg text-xs text-gray-700 hover:bg-gray-50"
                      >
                        <UserPlus className="w-4 h-4 text-purple-500" />
                        <span>تعریف کاربر جدید</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
