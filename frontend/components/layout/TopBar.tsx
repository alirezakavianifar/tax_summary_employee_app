'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  LogOut,
  LogIn,
  ChevronDown,
  Menu,
  X,
  KeyRound,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useBranding } from '@/contexts/BrandingContext'
import { useMenuSettings } from '@/contexts/MenuSettingsContext'
import {
  getRolePersianName,
  getUserDisplayName,
  getUserFullName,
  getUserAvatarLetter,
} from '@/types/auth'

interface TopBarProps {
  showSidebar: boolean
  isSidebarCollapsed: boolean
  onToggleSidebarCollapse: () => void
  isMobileDrawerOpen: boolean
  onToggleMobileDrawer: () => void
}

/**
 * Slim global utility header containing sidebar/drawer toggles, organization
 * branding, and the authenticated user profile menu.
 */
export default function TopBar({
  showSidebar,
  isSidebarCollapsed,
  onToggleSidebarCollapse,
  isMobileDrawerOpen,
  onToggleMobileDrawer,
}: TopBarProps) {
  const { user, isAuthenticated, logout } = useAuth()
  const { branding, resolvedLogoUrl } = useBranding()
  const { isModuleVisible } = useMenuSettings()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  const displayName = getUserDisplayName(user)
  const fullName = getUserFullName(user)
  const rolePersian = getRolePersianName(user?.role)
  const avatarLetter = getUserAvatarLetter(user)

  useEffect(() => {
    setIsUserMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isUserMenuOpen) return

    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isUserMenuOpen])

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 no-print print:hidden">
      <div className="w-full px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Right side (RTL Start): Sidebar toggles + Brand */}
        <div className="flex items-center gap-3 min-w-0">
          {showSidebar && (
            <>
              <button
                type="button"
                onClick={onToggleMobileDrawer}
                className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden transition-colors"
                aria-label={isMobileDrawerOpen ? 'بستن منو' : 'باز کردن منو'}
                aria-expanded={isMobileDrawerOpen}
              >
                {isMobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={onToggleSidebarCollapse}
                title={isSidebarCollapsed ? 'باز کردن منوی کناری' : 'جمع کردن منوی کناری'}
                aria-label={isSidebarCollapsed ? 'باز کردن منوی کناری' : 'جمع کردن منوی کناری'}
                className="hidden lg:inline-flex items-center justify-center p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                {isSidebarCollapsed ? (
                  <PanelRightOpen className="w-5 h-5" />
                ) : (
                  <PanelRightClose className="w-5 h-5" />
                )}
              </button>
            </>
          )}

          <Link href="/" className="flex items-center gap-2.5 group min-w-0">
            <div className="w-10 h-10 rounded-xl overflow-hidden p-1 border border-gray-200 shadow-sm group-hover:scale-105 transition-transform flex items-center justify-center bg-white flex-shrink-0">
              <img
                src={resolvedLogoUrl}
                alt={branding.organizationName}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-base font-black text-gray-900 leading-tight truncate">
                {branding.organizationName}
              </span>
              <span className="hidden sm:block text-[10px] text-primary-600 font-bold truncate">
                {branding.systemTitle}
              </span>
            </div>
          </Link>

          {!showSidebar && pathname !== '/login' && isModuleVisible('nav_home') && (
            <Link
              href="/"
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors mr-3 ${
                pathname === '/'
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Home className="w-4 h-4" />
              خانه
            </Link>
          )}
        </div>

        {/* Left side (RTL End): User Profile / Login Button */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isAuthenticated ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                aria-expanded={isUserMenuOpen}
                className="flex items-center gap-2 p-1.5 sm:pr-2.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors shadow-xs"
              >
                <div className="hidden sm:flex flex-col text-left items-end">
                  <span className="text-xs font-bold text-gray-800 leading-tight max-w-[150px] truncate">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">{rolePersian}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs flex-shrink-0">
                  {avatarLetter}
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
                    isUserMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isUserMenuOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2.5 border-b border-gray-100 text-right">
                    <span className="text-xs font-bold text-gray-800 block leading-snug">
                      {fullName || user?.username}
                    </span>
                    {fullName && user?.username && (
                      <span className="text-[11px] text-gray-400 font-mono block mt-0.5" dir="ltr">
                        {user.username}
                      </span>
                    )}
                    <span className="text-[11px] text-primary-600 font-medium block mt-1">
                      نقش سازمانی: {rolePersian}
                    </span>
                  </div>

                  <Link
                    href="/change-password"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 font-medium transition-colors border-b border-gray-100"
                  >
                    <KeyRound className="w-4 h-4 text-gray-500" />
                    تغییر رمز عبور
                  </Link>

                  <button
                    type="button"
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
        </div>
      </div>
    </header>
  )
}

