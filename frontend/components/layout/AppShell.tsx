'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import TopBar from './TopBar'
import SidebarNav from './SidebarNav'

const SIDEBAR_STORAGE_KEY = 'portal_sidebar_collapsed'

/**
 * Global application shell pairing a slim sticky TopBar with a collapsible
 * RTL desktop sidebar and a mobile slide-over navigation drawer.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const pathname = usePathname()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)

  const showSidebar = isAuthenticated && pathname !== '/login'

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SIDEBAR_STORAGE_KEY)
      if (saved === 'true') {
        setIsSidebarCollapsed(true)
      }
    } catch {
      // Ignore storage access errors in restricted environments
    }
  }, [])

  useEffect(() => {
    setIsMobileDrawerOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isMobileDrawerOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileDrawerOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isMobileDrawerOpen])

  const toggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next))
      } catch {
        // Ignore storage errors
      }
      return next
    })
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 print:block print:min-h-0 print:bg-white">
      <TopBar
        showSidebar={showSidebar}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebarCollapse={toggleSidebarCollapse}
        isMobileDrawerOpen={isMobileDrawerOpen}
        onToggleMobileDrawer={() => setIsMobileDrawerOpen((prev) => !prev)}
      />

      <div className="flex-1 flex min-w-0 print:block">
        {showSidebar && (
          <aside
            aria-label="ناوبری کناری سامانه"
            className={`hidden lg:flex flex-col flex-shrink-0 bg-white border-l border-gray-200/90 sticky top-16 h-[calc(100vh-4rem)] z-30 transition-[width] duration-200 ease-in-out no-print print:hidden ${
              isSidebarCollapsed ? 'w-[72px]' : 'w-64'
            }`}
          >
            <SidebarNav
              collapsed={isSidebarCollapsed}
              onToggleCollapse={toggleSidebarCollapse}
            />
          </aside>
        )}

        <main className="flex-1 min-w-0 print:block">{children}</main>
      </div>

      {/* Mobile Slide-Over Navigation Drawer */}
      {showSidebar && isMobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden no-print print:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="منوی سامانه"
        >
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <aside className="fixed inset-y-0 right-0 w-72 max-w-[85vw] bg-white shadow-2xl border-l border-gray-200 flex flex-col z-10 animate-in slide-in-from-right duration-200">
            <div className="h-16 px-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <span className="text-sm font-black text-gray-900">منوی سامانه</span>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                aria-label="بستن منو"
                className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <SidebarNav onNavigate={() => setIsMobileDrawerOpen(false)} />
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

