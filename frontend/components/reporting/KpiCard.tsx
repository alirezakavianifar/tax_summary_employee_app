'use client'

import React from 'react'
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconGradient?: string
  trendValue?: number
  trendLabel?: string
  trendInverted?: boolean // if higher is bad (like violations or expenses)
  badgeText?: string
  badgeColor?: string
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconGradient = 'from-amber-500 to-orange-600',
  trendValue,
  trendLabel,
  trendInverted = false,
  badgeText,
  badgeColor = 'bg-amber-50 text-amber-700 border-amber-200',
}: KpiCardProps) {
  const isPositive = trendValue !== undefined && trendValue > 0
  const isNegative = trendValue !== undefined && trendValue < 0
  const isNeutral = trendValue !== undefined && trendValue === 0

  let trendColor = 'text-gray-500 bg-gray-50'
  if (isPositive) {
    trendColor = trendInverted ? 'text-rose-600 bg-rose-50' : 'text-emerald-600 bg-emerald-50'
  } else if (isNegative) {
    trendColor = trendInverted ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
  }

  return (
    <div className="relative group bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between overflow-hidden">
      {/* Decorative gradient corner glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/5 to-transparent rounded-bl-full pointer-events-none" />

      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">{title}</span>
            {badgeText && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                {badgeText}
              </span>
            )}
          </div>

          <div
            className={`w-11 h-11 rounded-xl bg-gradient-to-br ${iconGradient} text-white flex items-center justify-center shadow-xs shadow-amber-500/20 group-hover:scale-105 transition-transform duration-200 flex-shrink-0`}
          >
            <Icon className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight font-mono">
            {typeof value === 'number' ? value.toLocaleString('fa-IR') : value}
          </span>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs mt-3">
        {subtitle && <span className="text-slate-400 truncate max-w-[70%]">{subtitle}</span>}

        {trendValue !== undefined && (
          <div className={`flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md ${trendColor} text-[11px]`}>
            {isPositive && <TrendingUp className="w-3.5 h-3.5" />}
            {isNegative && <TrendingDown className="w-3.5 h-3.5" />}
            {isNeutral && <Minus className="w-3.5 h-3.5" />}
            <span dir="ltr">{Math.abs(trendValue)}%</span>
            {trendLabel && <span className="text-gray-400 font-normal mr-0.5">{trendLabel}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
