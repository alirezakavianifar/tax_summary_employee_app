'use client'

import React from 'react'
import Link from 'next/link'
import { BasePortalModule } from '@/types/portal'
import { ChevronLeft, ArrowUpRight, Link2 } from 'lucide-react'
import { useMenuSettings } from '@/contexts/MenuSettingsContext'
import { toPersianDigits } from '@/lib/jalali'
import { getCardTheme } from '@/lib/constants/cardThemes'
import { resolveMenuIcon } from '@/lib/icons/menuIcons'
import type { MenuSettingItem } from '@/types/menuSettings'

interface ModuleCardProps {
  module: BasePortalModule
  userRole?: string
}

export default function ModuleCard({ module, userRole }: ModuleCardProps) {
  const { isActionVisible, getModuleSetting } = useMenuSettings()
  const moduleSetting = getModuleSetting(module.id)

  const theme = getCardTheme(moduleSetting?.colorTheme, module.id)

  const title = moduleSetting?.title || module.title
  const subtitle = moduleSetting?.description || module.subtitle
  const badgeText = moduleSetting?.badgeText || module.badgeText
  const description = moduleSetting?.description || module.description
  const CardIcon = moduleSetting?.iconName
    ? resolveMenuIcon(moduleSetting.iconName, module.icon)
    : module.icon

  // Build authorized and customized actions
  const baseActions = module.getAuthorizedActions(userRole)

  // Map of child settings for overrides
  const childSettingsByRoute: Record<string, MenuSettingItem> = {}
  const childSettingsByKey: Record<string, MenuSettingItem> = {}
  if (moduleSetting?.children) {
    for (const child of moduleSetting.children) {
      if (child.route) {
        childSettingsByRoute[child.route.toLowerCase().replace(/\/+$/, '')] = child
      }
      childSettingsByKey[child.menuKey.toLowerCase()] = child
    }
  }

  // Enrich base actions with admin customizations (custom titles, icons, display order)
  const enrichedActions = baseActions
    .filter((a) => isActionVisible(a.href, module.id))
    .map((action) => {
      const trimmedHref = action.href.toLowerCase().replace(/\/+$/, '')
      const match = childSettingsByRoute[trimmedHref] || childSettingsByKey[action.id.toLowerCase()]
      return {
        id: action.id,
        title: match?.title || action.title,
        href: action.href,
        description: match?.description || action.description,
        icon: match?.iconName ? resolveMenuIcon(match.iconName, action.icon) : action.icon,
        variant: action.variant,
        displayOrder: match?.displayOrder ?? 99,
      }
    })

  // Also include any custom children added by admin under this module that aren't in baseActions
  if (moduleSetting?.children) {
    for (const child of moduleSetting.children) {
      if (!child.isVisible) continue
      const alreadyPresent = enrichedActions.some(
        (ea) =>
          ea.id.toLowerCase() === child.menuKey.toLowerCase() ||
          ea.href.toLowerCase().replace(/\/+$/, '') === child.route.toLowerCase().replace(/\/+$/, '')
      )
      if (!alreadyPresent && isActionVisible(child.route, module.id)) {
        enrichedActions.push({
          id: child.menuKey,
          title: child.title,
          href: child.route,
          description: child.description || undefined,
          icon: resolveMenuIcon(child.iconName, Link2),
          variant: 'secondary',
          displayOrder: child.displayOrder ?? 99,
        })
      }
    }
  }

  // Sort actions by display order
  enrichedActions.sort((a, b) => a.displayOrder - b.displayOrder)

  const primaryAction = enrichedActions[0]
  const secondaryActions = enrichedActions.slice(1)

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200/90 ${theme.hoverBorder} hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group shadow-sm`}
    >
      {/* Top Banner / Header */}
      <div>
        <div className={`p-5 sm:p-6 ${theme.header} relative`}>
          <div className="flex justify-between items-center">
            <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-xl inline-flex items-center justify-center shadow-inner">
              <CardIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            {badgeText && (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-white/95">
                {badgeText}
              </span>
            )}
          </div>

          <h2 className="text-lg sm:text-xl font-black mt-3.5 leading-snug tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-white/85 mt-1 leading-relaxed font-normal">
              {subtitle}
            </p>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5">
          <p className="text-xs text-gray-600 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Action Buttons Section */}
      <div className="p-4 sm:p-5 bg-gray-50/70 border-t border-gray-100 space-y-3">
        {/* Primary Gateway CTA */}
        {primaryAction ? (
          <Link
            href={primaryAction.href}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-between transition-all duration-200 shadow-sm hover:shadow-md ${theme.primaryBtn}`}
          >
            <span className="flex items-center gap-2">
              <primaryAction.icon className="w-4 h-4" />
              <span>{primaryAction.title}</span>
            </span>
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </Link>
        ) : (
          <div className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-gray-400 bg-gray-100 text-center">
            هیچ بخش فعالی در دسترس شما نیست
          </div>
        )}

        {/* Secondary Actions Quick Chips */}
        {secondaryActions.length > 0 && (
          <div className="pt-2 border-t border-gray-200/60">
            <div className="flex items-center justify-between text-[11px] font-medium text-gray-400 mb-2 px-0.5">
              <span>سایر امکانات و دسترسی‌ها:</span>
              <span className="text-[10px] text-gray-400">
                {toPersianDigits(secondaryActions.length)} بخش
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {secondaryActions.map((action) => {
                const ActionIcon = action.icon
                return (
                  <Link
                    key={action.id}
                    href={action.href}
                    className={`py-1.5 px-2.5 rounded-lg text-[11px] font-medium text-gray-700 bg-white border border-gray-200/80 flex items-center justify-between transition-all duration-150 ${theme.chipHover}`}
                    title={action.description}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <ActionIcon className={`w-3.5 h-3.5 flex-shrink-0 ${theme.accentText}`} />
                      <span className="truncate">{action.title}</span>
                    </span>
                    <ArrowUpRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
