'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import {
  Home,
  ChevronDown,
  Search,
  X,
  PanelRightClose,
  PanelRightOpen,
  ExternalLink,
} from 'lucide-react'
import {
  usePortalNavigation,
  type NavSection,
  type NavActionItem,
} from './usePortalNavigation'

interface SidebarNavProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
  onNavigate?: () => void
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

interface SidebarActionLinkProps {
  action: NavActionItem
  isActive: boolean
  isAdmin?: boolean
  showDescription?: boolean
  onClick?: () => void
}

function SidebarActionLink({
  action,
  isActive,
  isAdmin = false,
  showDescription = false,
  onClick,
}: SidebarActionLinkProps) {
  const ActionIcon = action.icon
  const activeClass = isAdmin
    ? 'bg-purple-50 text-purple-800 font-bold'
    : 'bg-primary-50 text-primary-700 font-bold'
  const iconActiveClass = isAdmin
    ? 'bg-purple-100 text-purple-700'
    : 'bg-primary-100 text-primary-700'

  return (
    <AdaptiveLink
      href={action.href}
      isExternal={action.isExternal}
      onClick={onClick}
      title={action.description || action.title}
      className={`flex items-start gap-2.5 p-2 rounded-xl text-right transition-colors ${
        isActive ? activeClass : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <div
        className={`p-1.5 rounded-lg flex-shrink-0 ${
          isActive
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
          <span className="truncate">{action.title}</span>
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
}

/**
 * Unified RTL navigation tree rendered inside the desktop sidebar (expanded or
 * collapsed icon rail with floating flyouts) and the mobile drawer.
 */
export default function SidebarNav({
  collapsed = false,
  onToggleCollapse,
  onNavigate,
}: SidebarNavProps) {
  const {
    pathname,
    showHome,
    sections,
    menuLoading,
    isActionActive,
    isSectionActive,
    activeSectionIds,
  } = usePortalNavigation()

  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [flyout, setFlyout] = useState<FlyoutPosition | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const flyoutRef = useRef<HTMLDivElement>(null)

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

  const handleOpenFlyout = (
    sectionId: string,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (flyout?.sectionId === sectionId) {
      setFlyout(null)
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const maxTop = Math.max(72, window.innerHeight - 360)
    setFlyout({
      sectionId,
      top: Math.min(rect.top, maxTop),
      right: Math.max(80, window.innerWidth - rect.left + 8),
    })
  }

  const activeFlyoutSection = useMemo(
    () => (flyout ? sections.find((s) => s.id === flyout.sectionId) ?? null : null),
    [flyout, sections]
  )

  if (collapsed) {
    return (
      <div ref={containerRef} className="flex flex-col h-full py-3 items-center">
        <div
          onScroll={() => setFlyout(null)}
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

        {onToggleCollapse && (
          <div className="pt-2 border-t border-gray-100 w-full flex justify-center px-2">
            <button
              type="button"
              onClick={onToggleCollapse}
              title="باز کردن منو"
              aria-label="باز کردن منو"
              className="w-11 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <PanelRightOpen className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Floating Flyout Popover for Collapsed Icon Rail */}
        {flyout && activeFlyoutSection && (
          <div
            ref={flyoutRef}
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
              <span className="text-[10px] font-medium text-gray-500 bg-white border border-gray-200/80 px-2 py-0.5 rounded flex-shrink-0">
                {activeFlyoutSection.badgeText}
              </span>
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
      {sections.length > 0 && (
        <div className="px-3 pt-3 pb-2 border-b border-gray-100">
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
        </div>
      )}

      {/* Scrollable Vertical Navigation */}
      <nav
        aria-label="منوی اصلی سامانه"
        className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1.5"
      >
        {showHomeInSearch && (
          <Link
            href="/"
            onClick={onNavigate}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
              pathname === '/'
                ? 'bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-200/80'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div
              className={`p-1.5 rounded-lg ${
                pathname === '/'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              <Home className="w-4 h-4" />
            </div>
            <span>خانه</span>
          </Link>
        )}

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

          if (section.directHref) {
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

          return (
            <div key={section.id} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                aria-expanded={isExpanded}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? `${section.iconBgColor} ring-1 ring-inset ring-current/20`
                    : isExpanded
                    ? 'bg-gray-100/80 text-gray-900'
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
                <ChevronDown
                  className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isExpanded && (
                <div
                  className={`mr-4 pr-2.5 border-r-2 space-y-0.5 py-0.5 ${
                    section.isAdmin ? 'border-purple-100' : 'border-gray-100'
                  }`}
                >
                  {section.actions.map((action) => (
                    <SidebarActionLink
                      key={action.id}
                      action={action}
                      isActive={isActionActive(action.href)}
                      isAdmin={section.isAdmin}
                      onClick={onNavigate}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {normalizedQuery && !showHomeInSearch && filteredSections.length === 0 && (
          <div className="px-3 py-6 text-center text-xs text-gray-400">
            موردی با عبارت «{searchQuery}» یافت نشد.
          </div>
        )}
      </nav>

      {/* Desktop Collapse Footer */}
      {onToggleCollapse && (
        <div className="p-2.5 border-t border-gray-100">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <PanelRightClose className="w-4 h-4" />
            <span>جمع کردن منو</span>
          </button>
        </div>
      )}
    </div>
  )
}

