'use client'

import React from 'react'
import Link from 'next/link'
import { BasePortalModule } from '@/types/portal'
import { CheckCircle2, ChevronLeft, ArrowUpRight } from 'lucide-react'

interface ModuleCardProps {
  module: BasePortalModule
  userRole?: string
}

const THEME_MAP: Record<string, { header: string; primaryBtn: string; hoverBorder: string; accentText: string }> = {
  'employee-evaluation': {
    header: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white',
    primaryBtn: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20',
    hoverBorder: 'hover:border-blue-400',
    accentText: 'text-blue-600',
  },
  'collaborative-payroll': {
    header: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 text-white',
    primaryBtn: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20',
    hoverBorder: 'hover:border-emerald-400',
    accentText: 'text-emerald-600',
  },
}

export default function ModuleCard({ module, userRole }: ModuleCardProps) {
  const actions = module.getAuthorizedActions(userRole)
  const Icon = module.icon
  const theme = THEME_MAP[module.id] || {
    header: 'bg-gradient-to-r from-slate-800 to-slate-900 text-white',
    primaryBtn: 'bg-primary-600 hover:bg-primary-500 text-white',
    hoverBorder: 'hover:border-primary-400',
    accentText: 'text-primary-600',
  }

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200 ${theme.hoverBorder} hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group`}
    >
      {/* Top Banner / Header */}
      <div>
        <div className={`p-6 ${theme.header} relative`}>
          <div className="flex justify-between items-start">
            <div className="p-3 bg-white/15 backdrop-blur-md rounded-xl inline-flex items-center justify-center shadow-inner">
              <Icon className="w-8 h-8 text-white" />
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white/95">
              {module.badgeText}
            </span>
          </div>

          <h2 className="text-xl font-black mt-4 leading-snug tracking-tight">
            {module.title}
          </h2>
          <p className="text-xs text-white/85 mt-1.5 leading-relaxed font-medium">
            {module.subtitle}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <p className="text-xs text-gray-600 leading-relaxed">
            {module.description}
          </p>

          {/* Highlights */}
          <div className="space-y-2 border-t border-gray-100 pt-4">
            <h4 className="text-xs font-bold text-gray-800 mb-2">امکانات و قابلیت‌های کلیدی:</h4>
            {module.highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${theme.accentText}`} />
                <span>{h}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons Section */}
      <div className="p-6 bg-gray-50/70 border-t border-gray-100 space-y-2.5">
        {actions.map((action, idx) => {
          const ActionIcon = action.icon
          if (idx === 0) {
            return (
              <Link
                key={action.id}
                href={action.href}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-between transition-all duration-200 shadow-md ${theme.primaryBtn}`}
              >
                <span className="flex items-center gap-2">
                  <ActionIcon className="w-4 h-4" />
                  {action.title}
                </span>
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </Link>
            )
          }

          return (
            <Link
              key={action.id}
              href={action.href}
              className="w-full py-2 px-3.5 rounded-xl text-xs font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2">
                <ActionIcon className={`w-3.5 h-3.5 ${theme.accentText}`} />
                {action.title}
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
