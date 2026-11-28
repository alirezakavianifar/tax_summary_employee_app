'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useMenuSettings } from '@/contexts/MenuSettingsContext'
import MenuItemFormModal from '@/components/admin/MenuItemFormModal'
import DeleteMenuItemModal from '@/components/admin/DeleteMenuItemModal'
import type {
  MenuSettingItem,
  CreateMenuSettingPayload,
  UpdateMenuSettingMetadataPayload,
} from '@/types/menuSettings'
import TopBar from './TopBar'
import SidebarNav from './SidebarNav'

const SIDEBAR_STORAGE_KEY = 'portal_sidebar_collapsed'

/**
 * Global application shell pairing a slim sticky TopBar with a collapsible
 * RTL desktop sidebar and a mobile slide-over navigation drawer.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const {
    settings,
    mutating,
    isEditMode,
    setIsEditMode,
    createSetting,
    updateSettingMetadata,
    deleteSetting,
  } = useMenuSettings()
  const pathname = usePathname()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)

  // Shared inline menu editor modal state (hosted once for both desktop & mobile sidebars)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuSettingItem | null>(null)
  const [initialParentKey, setInitialParentKey] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MenuSettingItem | null>(null)

  const isAdmin = user?.role === 'Admin'
  const showSidebar = isAuthenticated && pathname !== '/login'
  const isAdminEditExpanded = isAdmin && isEditMode

  const rootModules = useMemo(
    () => settings.filter((item) => !item.parentKey),
    [settings]
  )

  const editingHasChildren = useMemo(() => {
    if (!editingItem) return false
    return settings.some(
      (s) => s.parentKey?.toLowerCase() === editingItem.menuKey.toLowerCase()
    )
  }, [editingItem, settings])

  const deleteChildCount = useMemo(() => {
    if (!deleteTarget) return 0
    return settings.filter(
      (s) => s.parentKey?.toLowerCase() === deleteTarget.menuKey.toLowerCase()
    ).length
  }, [deleteTarget, settings])

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

  const handleEnterEditMode = useCallback(() => {
    setIsSidebarCollapsed(false)
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, 'false')
    } catch {
      // Ignore storage errors
    }
    setIsEditMode(true)
  }, [setIsEditMode])

  const handleOpenCreateModal = useCallback((parentKey: string | null) => {
    setEditingItem(null)
    setInitialParentKey(parentKey)
    setIsFormModalOpen(true)
  }, [])

  const handleOpenEditModal = useCallback((item: MenuSettingItem) => {
    setEditingItem(item)
    setInitialParentKey(item.parentKey)
    setIsFormModalOpen(true)
  }, [])

  const handleOpenDeleteModal = useCallback((item: MenuSettingItem) => {
    setDeleteTarget(item)
  }, [])

  const handleSubmitCreate = useCallback(
    async (payload: CreateMenuSettingPayload) => {
      await createSetting(payload)
    },
    [createSetting]
  )

  const handleSubmitUpdate = useCallback(
    async (menuKey: string, payload: UpdateMenuSettingMetadataPayload) => {
      await updateSettingMetadata(menuKey, payload)
    },
    [updateSettingMetadata]
  )

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return
    try {
      await deleteSetting(deleteTarget.menuKey)
    } finally {
      setDeleteTarget(null)
    }
  }, [deleteTarget, deleteSetting])

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
              isSidebarCollapsed
                ? 'w-[72px]'
                : isAdminEditExpanded
                ? 'w-80'
                : 'w-64'
            }`}
          >
            <SidebarNav
              collapsed={isSidebarCollapsed}
              onToggleCollapse={toggleSidebarCollapse}
              onEnterEditMode={handleEnterEditMode}
              onOpenCreateModal={handleOpenCreateModal}
              onOpenEditModal={handleOpenEditModal}
              onOpenDeleteModal={handleOpenDeleteModal}
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
          <aside
            className={`fixed inset-y-0 right-0 max-w-[85vw] bg-white shadow-2xl border-l border-gray-200 flex flex-col z-10 animate-in slide-in-from-right duration-200 ${
              isAdminEditExpanded ? 'w-80' : 'w-72'
            }`}
          >
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
              <SidebarNav
                onNavigate={() => setIsMobileDrawerOpen(false)}
                onOpenCreateModal={handleOpenCreateModal}
                onOpenEditModal={handleOpenEditModal}
                onOpenDeleteModal={handleOpenDeleteModal}
              />
            </div>
          </aside>
        </div>
      )}

      {isAdmin && (
        <>
          <MenuItemFormModal
            isOpen={isFormModalOpen}
            editingItem={editingItem}
            initialParentKey={initialParentKey}
            rootModules={rootModules}
            hasChildren={editingHasChildren}
            submitting={mutating}
            onClose={() => {
              setIsFormModalOpen(false)
              setEditingItem(null)
              setInitialParentKey(null)
            }}
            onSubmitCreate={handleSubmitCreate}
            onSubmitUpdate={handleSubmitUpdate}
          />

          <DeleteMenuItemModal
            target={deleteTarget}
            childCount={deleteChildCount}
            submitting={mutating}
            onCancel={() => setDeleteTarget(null)}
            onConfirm={handleConfirmDelete}
          />
        </>
      )}
    </div>
  )
}

