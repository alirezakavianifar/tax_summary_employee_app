'use client'

import React from 'react'
import Link from 'next/link'
import { BasePortalModule } from '@/types/portal'
import { ChevronLeft, ArrowUpRight } from 'lucide-react'
import { useMenuSettings } from '@/contexts/MenuSettingsContext'
import { toPersianDigits } from '@/lib/jalali'

interface ModuleCardProps {
  module: BasePortalModule
  userRole?: string
}

interface ThemeConfig {
  header: string
  primaryBtn: string
  hoverBorder: string
  accentText: string
  chipHover: string
}

const THEME_MAP: Record<string, ThemeConfig> = {
  'employee-evaluation': {
    header: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white',
    primaryBtn: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20',
    hoverBorder: 'hover:border-blue-400',
    accentText: 'text-blue-600',
    chipHover: 'hover:bg-blue-50/80 hover:text-blue-700 hover:border-blue-300',
  },
  'collaborative-payroll': {
    header: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 text-white',
    primaryBtn: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20',
    hoverBorder: 'hover:border-emerald-400',
    accentText: 'text-emerald-600',
    chipHover: 'hover:bg-emerald-50/80 hover:text-emerald-700 hover:border-emerald-300',
  },
  'tax-refund': {
    header: 'bg-gradient-to-r from-purple-600 via-violet-600 to-purple-800 text-white',
    primaryBtn: 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white shadow-purple-500/20',
    hoverBorder: 'hover:border-purple-400',
    accentText: 'text-purple-600',
    chipHover: 'hover:bg-purple-50/80 hover:text-purple-700 hover:border-purple-300',
  },
  'executive-reporting': {
    header: 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white',
    primaryBtn: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-500/20',
    hoverBorder: 'hover:border-amber-400',
    accentText: 'text-amber-600',
    chipHover: 'hover:bg-amber-50/80 hover:text-amber-700 hover:border-amber-300',
  },
}

export default function ModuleCard({ module, userRole }: ModuleCardProps) {
  const { isActionVisible } = useMenuSettings()
  const actions = module
    .getAuthorizedActions(userRole)
    .filter((a) => isActionVisible(a.href, module.id))
  const Icon = module.icon
  const theme = THEME_MAP[module.id] || {
    header: 'bg-gradient-to-r from-slate-800 to-slate-900 text-white',
    primaryBtn: 'bg-primary-600 hover:bg-primary-500 text-white shadow-primary-500/20',
    hoverBorder: 'hover:border-primary-400',
    accentText: 'text-primary-600',
    chipHover: 'hover:bg-gray-100 hover:text-gray-900 hover:border-gray-300',
  }

  const primaryAction = actions[0]
  const secondaryActions = actions.slice(1)

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200/90 ${theme.hoverBorder} hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group shadow-sm`}
    >
      {/* Top Banner / Header */}
      <div>
        <div className={`p-5 sm:p-6 ${theme.header} relative`}>
          <div className="flex justify-between items-center">
            <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-xl inline-flex items-center justify-center shadow-inner">
              <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-white/95">
              {module.badgeText}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-black mt-3.5 leading-snug tracking-tight">
            {module.title}
          </h2>
          <p className="text-xs text-white/85 mt-1 leading-relaxed font-normal">
            {module.subtitle}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5">
          <p className="text-xs text-gray-600 leading-relaxed">
            {module.description}
          </p>
        </div>
      </div>

      {/* Action Buttons Section */}
      <div className="p-4 sm:p-5 bg-gray-50/70 border-t border-gray-100 space-y-3">
        {/* Primary Gateway CTA */}
        {primaryAction && (
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

