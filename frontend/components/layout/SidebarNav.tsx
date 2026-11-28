'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Home,
  ChevronDown,
  Search,
  X,
  PanelRightClose,
  PanelRightOpen,
  ExternalLink,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  Check,
  AlertTriangle,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useBranding } from '@/contexts/BrandingContext'
import { useMenuSettings } from '@/contexts/MenuSettingsContext'
import { resolveMenuIcon } from '@/lib/icons/menuIcons'
import type { MenuSettingItem } from '@/types/menuSettings'
import {
  usePortalNavigation,
  type NavSection,
  type NavActionItem,
} from './usePortalNavigation'

interface SidebarNavProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
  onNavigate?: () => void
  onEnterEditMode?: () => void
  onOpenCreateModal?: (parentKey: string | null) => void
  onOpenEditModal?: (item: MenuSettingItem) => void
  onOpenDeleteModal?: (item: MenuSettingItem) => void
}

interface FlyoutPosition {
  sectionId: string
  top: number
  right: number
}

interface AdaptiveLinkProps {
  href: string
  isExternal?: boolean
  onClick?: () => void
  title?: string
  ariaLabel?: string
  className: string
  children: React.ReactNode
}

function AdaptiveLink({
  href,
  isExternal = false,
  onClick,
  title,
  ariaLabel,
  className,
  children,
}: AdaptiveLinkProps) {
  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        title={title}
        aria-label={ariaLabel}
        className={className}
      >
        {children}
      </a>
    )
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </Link>
  )
}

interface InlineItemActionsProps {
  isCustom?: boolean
  isVisible?: boolean
  canAddChild?: boolean
  canMoveUp?: boolean
  canMoveDown?: boolean
  canToggleVisibility?: boolean
  disabled?: boolean
  onMoveUp?: () => void
  onMoveDown?: () => void
  onAddChild?: () => void
  onEdit?: () => void
  onToggleVisibility?: () => void
  onDelete?: () => void
}

function InlineItemActions({
  isCustom = false,
  isVisible = true,
  canAddChild = false,
  canMoveUp = false,
  canMoveDown = false,
  canToggleVisibility = true,
  disabled = false,
  onMoveUp,
  onMoveDown,
  onAddChild,
  onEdit,
  onToggleVisibility,
  onDelete,
}: InlineItemActionsProps) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {onMoveUp && (
        <button
          type="button"
          onClick={onMoveUp}
          disabled={disabled || !canMoveUp}
          title="انتقال به بالا"
          aria-label="انتقال به بالا"
          className="p-1 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-200/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowUp className="w-3 h-3" />
        </button>
      )}
      {onMoveDown && (
        <button
          type="button"
          onClick={onMoveDown}
          disabled={disabled || !canMoveDown}
          title="انتقال به پایین"
          aria-label="انتقال به پایین"
          className="p-1 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-200/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowDown className="w-3 h-3" />
        </button>
      )}
      {canAddChild && onAddChild && (
        <button
          type="button"
          onClick={onAddChild}
          disabled={disabled}
          title="افزودن زیرمنو"
          aria-label="افزودن زیرمنو"
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 disabled:opacity-40 transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>زیرمنو</span>
        </button>
      )}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          disabled={disabled}
          title="ویرایش مشخصات"
          aria-label="ویرایش مشخصات"
          className="p-1 rounded-md text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 disabled:opacity-40 transition-colors"
        >
          <Pencil className="w-3 h-3" />
        </button>
      )}
      {canToggleVisibility && onToggleVisibility && (
        <button
          type="button"
          onClick={onToggleVisibility}
          disabled={disabled}
          title={isVisible ? 'مخفی‌سازی از منو' : 'نمایش مجدد در منو'}
          aria-label={isVisible ? 'مخفی‌سازی از منو' : 'نمایش مجدد در منو'}
          className={`p-1 rounded-md disabled:opacity-40 transition-colors ${
            isVisible
              ? 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
              : 'text-amber-600 hover:text-amber-800 hover:bg-amber-50'
          }`}
        >
          {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
        </button>
      )}
      {isCustom && onDelete && (
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          title="حذف گزینه سفارشی"
          aria-label="حذف گزینه سفارشی"
          className="p-1 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-40 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

interface SidebarActionLinkProps {
  action: NavActionItem
  isActive: boolean
  isAdmin?: boolean
  showDescription?: boolean
  showInlineEditor?: boolean
  canMoveUp?: boolean
  canMoveDown?: boolean
  mutating?: boolean
  onClick?: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  onEdit?: (item: MenuSettingItem) => void
  onToggleVisibility?: (menuKey: string) => void
  onDelete?: (item: MenuSettingItem) => void
}

function SidebarActionLink({
  action,
  isActive,
  isAdmin = false,
  showDescription = false,
  showInlineEditor = false,
  canMoveUp = false,
  canMoveDown = false,
  mutating = false,
  onClick,
  onMoveUp,
  onMoveDown,
  onEdit,
  onToggleVisibility,
  onDelete,
}: SidebarActionLinkProps) {
  const ActionIcon = action.icon
  const isHidden = action.isVisible === false
  const activeClass = isAdmin
    ? 'bg-purple-50 text-purple-800 font-bold'
    : 'bg-primary-50 text-primary-700 font-bold'
  const iconActiveClass = isAdmin
    ? 'bg-purple-100 text-purple-700'
    : 'bg-primary-100 text-primary-700'

  const linkNode = (
    <AdaptiveLink
      href={action.href}
      isExternal={action.isExternal}
      onClick={onClick}
      title={action.description || action.title}
      className={`flex items-start gap-2.5 p-2 rounded-xl text-right transition-colors ${
        isHidden
          ? 'text-gray-400 bg-gray-50/80 hover:bg-gray-100/80'
          : isActive
          ? activeClass
          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <div
        className={`p-1.5 rounded-lg flex-shrink-0 ${
          isHidden
            ? 'bg-gray-200/80 text-gray-400'
            : isActive
            ? iconActiveClass
            : isAdmin
            ? 'bg-purple-50/70 text-purple-500'
            : 'bg-gray-100 text-gray-500'
        }`}
      >
        <ActionIcon className="w-3.5 h-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-xs leading-snug flex items-center gap-1.5">
          <span className={`truncate ${isHidden ? 'line-through' : ''}`}>
            {action.title}
          </span>
          {isHidden && (
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-gray-200 text-gray-600 flex-shrink-0">
              مخفی
            </span>
          )}
          {action.isCustom && !isHidden && showInlineEditor && (
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/70 flex-shrink-0">
              سفارشی
            </span>
          )}
          {action.isExternal && (
            <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
          )}
        </span>
        {showDescription && action.description && (
          <span className="text-[11px] text-gray-400 font-normal line-clamp-1 mt-0.5 block">
            {action.description}
          </span>
        )}
      </div>
    </AdaptiveLink>
  )

  if (!showInlineEditor || !action.menuSetting) {
    return linkNode
  }

  const settingItem = action.menuSetting

  return (
    <div
      className={`rounded-xl border transition-colors ${
        isHidden
          ? 'border-dashed border-gray-300 bg-gray-50/70'
          : 'border-gray-200/80 bg-white/80'
      }`}
    >
      {linkNode}
      <div className="px-2 pb-1.5 pt-0.5 flex items-center justify-end border-t border-gray-100/80">
        <InlineItemActions
          isCustom={Boolean(action.isCustom)}
          isVisible={action.isVisible !== false}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          disabled={mutating}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onEdit={() => onEdit?.(settingItem)}
          onToggleVisibility={() => onToggleVisibility?.(settingItem.menuKey)}
          onDelete={() => onDelete?.(settingItem)}
        />
      </div>
    </div>
  )
}

/**
 * Unified RTL navigation tree rendered inside the desktop sidebar (expanded or
 * collapsed icon rail with floating flyouts) and the mobile drawer.
 */
export default function SidebarNav({
  collapsed = false,
  onToggleCollapse,
  onNavigate,
  onEnterEditMode,
  onOpenCreateModal,
  onOpenEditModal,
  onOpenDeleteModal,
}: SidebarNavProps) {
  const { user } = useAuth()
  const { collapsedMenuExpandMode } = useBranding()
  const {
    mutating,
    isEditMode,
    setIsEditMode,
    toggleItemVisibility,
    reorderSiblings,
  } = useMenuSettings()

  const isAdmin = user?.role === 'Admin'
  const showInlineEditor = isAdmin && isEditMode && !collapsed

  const {
    pathname,
    showHome,
    homeSetting,
    sections,
    menuLoading,
    isActionActive,
    isSectionActive,
    activeSectionIds,
  } = usePortalNavigation({ includeHiddenForAdmin: isAdmin && isEditMode })

  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [flyout, setFlyout] = useState<FlyoutPosition | null>(null)
  const [inlineError, setInlineError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const flyoutRef = useRef<HTMLDivElement>(null)
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handleToggleVisibility = async (menuKey: string) => {
    setInlineError(null)
    try {
      await toggleItemVisibility(menuKey)
    } catch (err: any) {
      setInlineError(err?.response?.data?.error || err?.message || 'خطا در تغییر وضعیت نمایش منو')
    }
  }

  const handleReorderKeys = async (
    keys: string[],
    fromIndex: number,
    toIndex: number,
    startOrder: number = 1
  ) => {
    if (toIndex < 0 || toIndex >= keys.length) return
    const nextKeys = [...keys]
    const [moved] = nextKeys.splice(fromIndex, 1)
    nextKeys.splice(toIndex, 0, moved)
    setInlineError(null)
    try {
      await reorderSiblings(nextKeys, startOrder)
    } catch (err: any) {
      setInlineError(err?.response?.data?.error || err?.message || 'خطا در تغییر ترتیب منو')
    }
  }

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => clearCloseTimer()
  }, [clearCloseTimer])

  // Automatically expand the active module section(s) on navigation
  useEffect(() => {
    if (activeSectionIds.length === 0) return
    setExpandedIds((prev) => {
      const next = { ...prev }
      for (const id of activeSectionIds) {
        next[id] = true
      }
      return next
    })
  }, [activeSectionIds])

  // Close collapsed flyout when route changes or sidebar expands
  useEffect(() => {
    setFlyout(null)
  }, [pathname, collapsed])

  // Close flyout on outside click, Escape, or viewport resize
  useEffect(() => {
    if (!flyout) return

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        flyoutRef.current?.contains(target) ||
        containerRef.current?.contains(target)
      ) {
        return
      }
      setFlyout(null)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFlyout(null)
    }

    const handleResize = () => setFlyout(null)

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleResize)

    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleResize)
    }
  }, [flyout])

  const normalizedQuery = searchQuery.trim().toLowerCase()

  const filteredSections = useMemo<NavSection[]>(() => {
    if (!normalizedQuery) return sections

    return sections
      .map((section) => {
        const sectionMatches =
          section.navTitle.toLowerCase().includes(normalizedQuery) ||
          section.title.toLowerCase().includes(normalizedQuery)

        if (sectionMatches) return section

        const matchingActions = section.actions.filter(
          (action) =>
            action.title.toLowerCase().includes(normalizedQuery) ||
            (action.description?.toLowerCase().includes(normalizedQuery) ?? false)
        )

        if (matchingActions.length === 0) return null
        return { ...section, actions: matchingActions }
      })
      .filter((s): s is NavSection => s !== null)
  }, [sections, normalizedQuery])

  const showHomeInSearch =
    showHome && (!normalizedQuery || 'خانه صفحه اصلی پرتال'.includes(normalizedQuery))

  const toggleSection = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const openFlyoutForElement = useCallback((sectionId: string, element: HTMLElement) => {
    clearCloseTimer()
    const rect = element.getBoundingClientRect()
    const maxTop = Math.max(72, window.innerHeight - 360)
    setFlyout({
      sectionId,
      top: Math.min(rect.top, maxTop),
      right: Math.max(80, window.innerWidth - rect.left + 8),
    })
  }, [clearCloseTimer])

  const handleOpenFlyout = (
    sectionId: string,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    clearCloseTimer()
    if (flyout?.sectionId === sectionId) {
      setFlyout(null)
      return
    }
    openFlyoutForElement(sectionId, event.currentTarget)
  }

  const handleMouseEnterSection = (
    sectionId: string,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (collapsedMenuExpandMode !== 'hover') return
    openFlyoutForElement(sectionId, event.currentTarget)
  }

  const handleMouseLeaveSection = () => {
    if (collapsedMenuExpandMode !== 'hover') return
    clearCloseTimer()
    closeTimerRef.current = setTimeout(() => {
      setFlyout(null)
    }, 150)
  }

  const handleFlyoutMouseEnter = () => {
    if (collapsedMenuExpandMode !== 'hover') return
    clearCloseTimer()
  }

  const handleFlyoutMouseLeave = () => {
    if (collapsedMenuExpandMode !== 'hover') return
    clearCloseTimer()
    closeTimerRef.current = setTimeout(() => {
      setFlyout(null)
    }, 150)
  }

  const activeFlyoutSection = useMemo(
    () => (flyout ? sections.find((s) => s.id === flyout.sectionId) ?? null : null),
    [flyout, sections]
  )

  if (collapsed) {
    return (
      <div ref={containerRef} className="flex flex-col h-full py-3 items-center">
        <div
          onScroll={() => {
            clearCloseTimer()
            setFlyout(null)
          }}
          className="flex-1 w-full overflow-y-auto flex flex-col items-center gap-2 px-2"
        >
          {showHome && (
            <Link
              href="/"
              title="خانه"
              onClick={onNavigate}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                pathname === '/'
                  ? 'bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-200'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Home className="w-5 h-5" />
            </Link>
          )}

          {showHome && sections.length > 0 && (
            <div className="w-8 border-t border-gray-100 my-0.5" />
          )}

          {sections.map((section) => {
            const Icon = section.icon
            const active = isSectionActive(section)

            if (section.directHref) {
              return (
                <AdaptiveLink
                  key={section.id}
                  href={section.directHref}
                  isExternal={section.isExternal}
                  title={section.navTitle}
                  ariaLabel={section.navTitle}
                  onClick={() => {
                    clearCloseTimer()
                    setFlyout(null)
                    onNavigate?.()
                  }}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                    active
                      ? `${section.iconBgColor} ring-1 ring-inset ring-current/25 shadow-2xs`
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </AdaptiveLink>
              )
            }

            const isFlyoutOpen = flyout?.sectionId === section.id

            return (
              <button
                key={section.id}
                type="button"
                title={section.navTitle}
                aria-label={section.navTitle}
                aria-expanded={isFlyoutOpen}
                onClick={(e) => handleOpenFlyout(section.id, e)}
                onMouseEnter={(e) => handleMouseEnterSection(section.id, e)}
                onMouseLeave={handleMouseLeaveSection}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                  active
                    ? `${section.iconBgColor} ring-1 ring-inset ring-current/25 shadow-2xs`
                    : isFlyoutOpen
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
              </button>
            )
          })}
        </div>

        {(isAdmin || onToggleCollapse) && (
          <div className="pt-2 border-t border-gray-100 w-full flex flex-col items-center gap-1.5 px-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => onEnterEditMode?.()}
                title="ویرایش مستقیم منو"
                aria-label="ویرایش مستقیم منو"
                className={`w-11 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  isEditMode
                    ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300'
                    : 'text-gray-500 hover:text-indigo-700 hover:bg-indigo-50'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            )}
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                title="باز کردن منو"
                aria-label="باز کردن منو"
                className="w-11 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <PanelRightOpen className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Floating Flyout Popover for Collapsed Icon Rail */}
        {flyout && activeFlyoutSection && (
          <div
            ref={flyoutRef}
            onMouseEnter={handleFlyoutMouseEnter}
            onMouseLeave={handleFlyoutMouseLeave}
            style={{
              top: `${flyout.top}px`,
              right: `${flyout.right}px`,
              maxHeight: `calc(100vh - ${flyout.top}px - 16px)`,
            }}
            className="fixed z-50 w-72 bg-white rounded-2xl shadow-xl border border-gray-200/80 flex flex-col overflow-hidden animate-in fade-in duration-150"
          >
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between gap-2 bg-gray-50/70">
              <span className="text-xs font-bold text-gray-900 truncate">
                {activeFlyoutSection.title}
              </span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {isAdmin && activeFlyoutSection.menuKey !== 'nav_home' && (
                  <button
                    type="button"
                    onClick={() => {
                      clearCloseTimer()
                      setFlyout(null)
                      onOpenCreateModal?.(activeFlyoutSection.menuKey)
                    }}
                    title="افزودن زیرمنو به این بخش"
                    aria-label="افزودن زیرمنو به این بخش"
                    className="p-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
                <span className="text-[10px] font-medium text-gray-500 bg-white border border-gray-200/80 px-2 py-0.5 rounded">
                  {activeFlyoutSection.badgeText}
                </span>
              </div>
            </div>

            <div className="p-1.5 space-y-1 overflow-y-auto">
              {activeFlyoutSection.actions.map((action) => (
                <SidebarActionLink
                  key={action.id}
                  action={action}
                  isActive={isActionActive(action.href)}
                  isAdmin={activeFlyoutSection.isAdmin}
                  showDescription
                  onClick={() => {
                    clearCloseTimer()
                    setFlyout(null)
                    onNavigate?.()
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex flex-col h-full">
      {/* Quick Search Box */}
      {(sections.length > 0 || isAdmin) && (
        <div className="px-3 pt-3 pb-2 border-b border-gray-100 space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی سریع در منو..."
              aria-label="جستجوی سریع در منو"
              className="w-full pr-8 pl-7 py-1.5 text-xs bg-gray-50 border border-gray-200/80 rounded-xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-primary-400 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="پاک کردن جستجو"
                className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {showInlineEditor && (
            <div className="p-2 rounded-xl bg-indigo-50/80 border border-indigo-200/90 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold text-indigo-900 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                  حالت ویرایش مستقیم منو
                  {mutating && (
                    <span className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin inline-block" />
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setInlineError(null)
                    setIsEditMode(false)
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                >
                  <Check className="w-3 h-3" />
                  اتمام
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={mutating}
                  onClick={() => onOpenCreateModal?.(null)}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3 h-3" />
                  افزودن منوی اصلی
                </button>
                <Link
                  href="/admin/menu-settings"
                  onClick={onNavigate}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-100 transition-colors"
                  title="پیکربندی کامل نقش‌ها و بازنشانی"
                >
                  تنظیمات کامل
                </Link>
              </div>
            </div>
          )}

          {inlineError && (
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 min-w-0">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{inlineError}</span>
              </span>
              <button
                type="button"
                onClick={() => setInlineError(null)}
                className="text-rose-500 hover:text-rose-700 p-0.5 flex-shrink-0"
                aria-label="بستن خطا"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Scrollable Vertical Navigation */}
      <nav
        aria-label="منوی اصلی سامانه"
        className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1.5"
      >
        {showHomeInSearch && (() => {
          const HomeIcon = homeSetting?.iconName
            ? resolveMenuIcon(homeSetting.iconName, Home)
            : Home
          const homeTitle = homeSetting?.title || 'خانه'
          const isHomeHidden = homeSetting?.isVisible === false

          const homeLink = (
            <Link
              href="/"
              onClick={onNavigate}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                isHomeHidden
                  ? 'text-gray-400 bg-gray-50/70 hover:bg-gray-100'
                  : pathname === '/'
                  ? 'bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-200/80'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg ${
                  isHomeHidden
                    ? 'bg-gray-200 text-gray-400'
                    : pathname === '/'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                <HomeIcon className="w-4 h-4" />
              </div>
              <span className={`truncate ${isHomeHidden ? 'line-through' : ''}`}>
                {homeTitle}
              </span>
              {isHomeHidden && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-gray-200 text-gray-600">
                  مخفی
                </span>
              )}
            </Link>
          )

          if (!showInlineEditor || !homeSetting) return homeLink

          return (
            <div
              className={`rounded-xl border ${
                isHomeHidden
                  ? 'border-dashed border-gray-300 bg-gray-50/70'
                  : 'border-gray-200/80 bg-white'
              }`}
            >
              {homeLink}
              <div className="px-2 pb-1.5 pt-0.5 flex items-center justify-end border-t border-gray-100/80">
                <InlineItemActions
                  isCustom={false}
                  isVisible={homeSetting.isVisible}
                  disabled={mutating}
                  onEdit={() => onOpenEditModal?.(homeSetting)}
                  onToggleVisibility={() => handleToggleVisibility(homeSetting.menuKey)}
                />
              </div>
            </div>
          )
        })()}

        {menuLoading && sections.length === 0 && (
          <div className="space-y-2 pt-2 px-1">
            {[1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                className="h-10 rounded-xl bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        )}

        {filteredSections.map((section) => {
          const Icon = section.icon
          const active = isSectionActive(section)
          const isSectionHidden = !section.isVisible
          const canReorderSections = !normalizedQuery && Boolean(section.menuSetting)
          const rootSectionKeys = filteredSections
            .map((s) => s.menuKey)
            .filter(Boolean)
          const keyIdx = rootSectionKeys.indexOf(section.menuKey)
          const rootStartOrder = (homeSetting?.displayOrder ?? 1) + 1

          if (section.directHref && !showInlineEditor) {
            return (
              <AdaptiveLink
                key={section.id}
                href={section.directHref}
                isExternal={section.isExternal}
                onClick={onNavigate}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? `${section.iconBgColor} ring-1 ring-inset ring-current/20`
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`p-1.5 rounded-lg flex-shrink-0 ${
                      active ? 'bg-white/80 shadow-2xs' : section.iconBgColor
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="truncate">{section.navTitle}</span>
                </span>
                {section.isExternal && (
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                )}
              </AdaptiveLink>
            )
          }

          const isExpanded = normalizedQuery
            ? true
            : Boolean(expandedIds[section.id])

          const distinctActionKeys = Array.from(
            new Set(section.actions.map((a) => a.menuKey).filter((k): k is string => Boolean(k)))
          )
          const canReorderActions = !normalizedQuery

          return (
            <div
              key={section.id}
              className={`space-y-1 ${
                showInlineEditor
                  ? `p-1.5 rounded-xl border transition-colors ${
                      isSectionHidden
                        ? 'border-dashed border-gray-300 bg-gray-50/70'
                        : 'border-indigo-100/90 bg-indigo-50/15'
                    }`
                  : ''
              }`}
            >
              {section.directHref && showInlineEditor ? (
                <AdaptiveLink
                  href={section.directHref}
                  isExternal={section.isExternal}
                  onClick={onNavigate}
                  className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isSectionHidden
                      ? 'text-gray-400'
                      : active
                      ? `${section.iconBgColor} ring-1 ring-inset ring-current/20`
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      className={`p-1.5 rounded-lg flex-shrink-0 ${
                        isSectionHidden
                          ? 'bg-gray-200 text-gray-400'
                          : active
                          ? 'bg-white/80 shadow-2xs'
                          : section.iconBgColor
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className={`truncate ${isSectionHidden ? 'line-through' : ''}`}>
                      {section.navTitle}
                    </span>
                    {isSectionHidden && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-gray-200 text-gray-600 flex-shrink-0">
                        مخفی
                      </span>
                    )}
                  </span>
                  {section.isExternal && (
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  )}
                </AdaptiveLink>
              ) : (
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={isExpanded}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isSectionHidden
                      ? 'text-gray-400 hover:bg-gray-100/80'
                      : active
                      ? `${section.iconBgColor} ring-1 ring-inset ring-current/20`
                      : isExpanded
                      ? 'bg-gray-100/80 text-gray-900'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`p-1.5 rounded-lg flex-shrink-0 ${
                        isSectionHidden
                          ? 'bg-gray-200 text-gray-400'
                          : active
                          ? 'bg-white/80 shadow-2xs'
                          : section.iconBgColor
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className={`truncate ${isSectionHidden ? 'line-through' : ''}`}>
                      {section.navTitle}
                    </span>
                    {isSectionHidden && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-gray-200 text-gray-600 flex-shrink-0">
                        مخفی
                      </span>
                    )}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              )}

              {showInlineEditor && section.menuSetting && (
                <div className="px-1.5 pb-1 pt-0.5 flex items-center justify-between gap-1 border-b border-gray-100/90">
                  <span className="text-[10px] font-medium text-gray-400">
                    {section.isCustom ? 'سفارشی' : 'سیستمی'}
                  </span>
                  <InlineItemActions
                    isCustom={Boolean(section.isCustom)}
                    isVisible={section.isVisible}
                    canAddChild={section.menuKey !== 'nav_home'}
                    canMoveUp={canReorderSections && keyIdx > 0}
                    canMoveDown={canReorderSections && keyIdx >= 0 && keyIdx < rootSectionKeys.length - 1}
                    disabled={mutating}
                    onMoveUp={() =>
                      handleReorderKeys(rootSectionKeys, keyIdx, keyIdx - 1, rootStartOrder)
                    }
                    onMoveDown={() =>
                      handleReorderKeys(rootSectionKeys, keyIdx, keyIdx + 1, rootStartOrder)
                    }
                    onAddChild={() => {
                      setExpandedIds((prev) => ({ ...prev, [section.id]: true }))
                      onOpenCreateModal?.(section.menuKey)
                    }}
                    onEdit={() => onOpenEditModal?.(section.menuSetting!)}
                    onToggleVisibility={() => handleToggleVisibility(section.menuSetting!.menuKey)}
                    onDelete={() => onOpenDeleteModal?.(section.menuSetting!)}
                  />
                </div>
              )}

              {isExpanded && (!section.directHref || showInlineEditor) && (
                <div
                  className={`mr-4 pr-2.5 border-r-2 space-y-1 py-0.5 ${
                    section.isAdmin ? 'border-purple-100' : 'border-gray-100'
                  }`}
                >
                  {section.actions.map((action) => {
                    const actionKeyIdx = action.menuKey
                      ? distinctActionKeys.indexOf(action.menuKey)
                      : -1
                    return (
                      <SidebarActionLink
                        key={action.id}
                        action={action}
                        isActive={isActionActive(action.href)}
                        isAdmin={section.isAdmin}
                        showInlineEditor={showInlineEditor}
                        canMoveUp={canReorderActions && actionKeyIdx > 0}
                        canMoveDown={
                          canReorderActions &&
                          actionKeyIdx >= 0 &&
                          actionKeyIdx < distinctActionKeys.length - 1
                        }
                        mutating={mutating}
                        onClick={onNavigate}
                        onMoveUp={
                          actionKeyIdx > 0
                            ? () =>
                                handleReorderKeys(
                                  distinctActionKeys,
                                  actionKeyIdx,
                                  actionKeyIdx - 1
                                )
                            : undefined
                        }
                        onMoveDown={
                          actionKeyIdx >= 0 && actionKeyIdx < distinctActionKeys.length - 1
                            ? () =>
                                handleReorderKeys(
                                  distinctActionKeys,
                                  actionKeyIdx,
                                  actionKeyIdx + 1
                                )
                            : undefined
                        }
                        onEdit={(item) => onOpenEditModal?.(item)}
                        onToggleVisibility={handleToggleVisibility}
                        onDelete={(item) => onOpenDeleteModal?.(item)}
                      />
                    )
                  })}

                  {showInlineEditor && !normalizedQuery && section.menuKey !== 'nav_home' && (
                    <button
                      type="button"
                      disabled={mutating}
                      onClick={() => onOpenCreateModal?.(section.menuKey)}
                      className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-dashed border-indigo-300 text-[11px] font-bold text-indigo-700 bg-indigo-50/40 hover:bg-indigo-50 transition-colors disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>افزودن زیرمنو</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {showInlineEditor && !normalizedQuery && (
          <button
            type="button"
            disabled={mutating}
            onClick={() => onOpenCreateModal?.(null)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 mt-2 rounded-xl border border-dashed border-indigo-300 text-xs font-bold text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100/70 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن منو یا ماژول جدید</span>
          </button>
        )}

        {normalizedQuery && !showHomeInSearch && filteredSections.length === 0 && (
          <div className="px-3 py-6 text-center text-xs text-gray-400">
            موردی با عبارت «{searchQuery}» یافت نشد.
          </div>
        )}
      </nav>

      {/* Desktop Collapse & Admin Edit Mode Footer */}
      {(isAdmin || onToggleCollapse) && (
        <div className="p-2.5 border-t border-gray-100 space-y-1.5">
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setInlineError(null)
                setIsEditMode((prev) => !prev)
              }}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                isEditMode
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
                  : 'bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/80'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>{isEditMode ? 'پایان ویرایش منو' : 'ویرایش منو'}</span>
            </button>
          )}

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <PanelRightClose className="w-4 h-4" />
              <span>جمع کردن منو</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

