'use client'

import React from 'react'
import Link from 'next/link'
import { BasePortalModule } from '@/types/portal'
import { CheckCircle2, ChevronLeft, ArrowUpRight } from 'lucide-react'

interface ModuleCardProps {
  module: BasePortalModule
  userRole?: string
}

export default function ModuleCard({ module, userRole }: ModuleCardProps) {
  const actions = module.getAuthorizedActions(userRole)
  const Icon = module.icon

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200 ${module.borderHoverColor} hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group`}
    >
      {/* Top Banner / Header */}
      <div>
        <div className={`p-6 bg-gradient-to-r ${module.gradient} text-white relative`}>
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
          <p className="text-xs text-white/80 mt-1.5 leading-relaxed font-medium">
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
                <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${module.accentColor}`} />
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
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-between transition-all duration-200 shadow-sm bg-gradient-to-r ${module.gradient} hover:opacity-95 text-white`}
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
                <ActionIcon className={`w-3.5 h-3.5 ${module.accentColor}`} />
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
