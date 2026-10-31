'use client'

import React, { useState } from 'react'
import { MonthlyTrendPoint } from '@/types/reporting'

interface TrendChartProps {
  data: MonthlyTrendPoint[]
  height?: number
}

export function TrendChart({ data, height = 280 }: TrendChartProps) {
  const [activeSeries, setActiveSeries] = useState<{ overtime: boolean; welfare: boolean; refund: boolean }>({
    overtime: true,
    welfare: true,
    refund: true,
  })
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        داده‌ای برای نمایش نمودار روند موجود نیست
      </div>
    )
  }

  // Find max value across active series
  const maxVal = Math.max(
    ...data.flatMap((d) => [
      activeSeries.overtime ? d.overtimeAmount : 0,
      activeSeries.welfare ? d.welfareAmount : 0,
      activeSeries.refund ? d.refundAmount : 0,
    ]),
    1000000 // avoid div by zero
  )

  const padding = { top: 20, right: 30, bottom: 40, left: 60 }
  const chartWidth = 700
  const chartHeight = height
  const plotWidth = chartWidth - padding.left - padding.right
  const plotHeight = chartHeight - padding.top - padding.bottom

  const xStep = data.length > 1 ? plotWidth / (data.length - 1) : plotWidth / 2

  const getPoints = (key: 'overtimeAmount' | 'welfareAmount' | 'refundAmount') => {
    return data.map((d, i) => {
      const x = padding.right + i * xStep
      const y = padding.top + plotHeight - (d[key] / maxVal) * plotHeight
      return { x, y, value: d[key] }
    })
  }

  const overtimePoints = getPoints('overtimeAmount')
  const welfarePoints = getPoints('welfareAmount')
  const refundPoints = getPoints('refundAmount')

  const toSvgPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return ''
    return points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '')
  }

  const toAreaPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return ''
    const line = toSvgPath(points)
    const last = points[points.length - 1]
    const first = points[0]
    return `${line} L ${last.x} ${padding.top + plotHeight} L ${first.x} ${padding.top + plotHeight} Z`
  }

  const formatMillions = (val: number) => {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)} همت`
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)} م`
    return val.toLocaleString('fa-IR')
  }

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Series Toggle Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
        <span className="font-semibold text-slate-600">روند مقایسه‌ای تخصیص اعتبارات و استرداد</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveSeries((s) => ({ ...s, overtime: !s.overtime }))}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
              activeSeries.overtime
                ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            اضافه کار
          </button>

          <button
            type="button"
            onClick={() => setActiveSeries((s) => ({ ...s, welfare: !s.welfare }))}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
              activeSeries.welfare
                ? 'bg-teal-50 border-teal-300 text-teal-800 font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
            رفاهی
          </button>

          <button
            type="button"
            onClick={() => setActiveSeries((s) => ({ ...s, refund: !s.refund }))}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
              activeSeries.refund
                ? 'bg-purple-50 border-purple-300 text-purple-800 font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
            استرداد ۲۴۲/۲۴۳
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto min-w-[500px]"
          style={{ maxHeight: height }}
        >
          <defs>
            <linearGradient id="overtimeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="welfareGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="refundGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9333ea" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#9333ea" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padding.top + plotHeight * (1 - ratio)
            return (
              <g key={idx}>
                <line
                  x1={padding.right}
                  y1={y}
                  x2={chartWidth - padding.left}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeDasharray="4 4"
                />
                <text
                  x={chartWidth - padding.left + 8}
                  y={y + 4}
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="sans-serif"
                  textAnchor="start"
                >
                  {formatMillions(maxVal * ratio)}
                </text>
              </g>
            )
          })}

          {/* Area Fills */}
          {activeSeries.refund && <path d={toAreaPath(refundPoints)} fill="url(#refundGrad)" />}
          {activeSeries.welfare && <path d={toAreaPath(welfarePoints)} fill="url(#welfareGrad)" />}
          {activeSeries.overtime && <path d={toAreaPath(overtimePoints)} fill="url(#overtimeGrad)" />}

          {/* Line Strokes */}
          {activeSeries.refund && (
            <path
              d={toSvgPath(refundPoints)}
              fill="none"
              stroke="#9333ea"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {activeSeries.welfare && (
            <path
              d={toSvgPath(welfarePoints)}
              fill="none"
              stroke="#14b8a6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {activeSeries.overtime && (
            <path
              d={toSvgPath(overtimePoints)}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* X Axis Labels & Interactive Hover Columns */}
          {data.map((d, i) => {
            const x = padding.right + i * xStep
            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + plotHeight}
                  stroke={hoveredIndex === i ? '#cbd5e1' : 'transparent'}
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
                <text
                  x={x}
                  y={padding.top + plotHeight + 20}
                  fill={hoveredIndex === i ? '#0f172a' : '#64748b'}
                  fontSize="11"
                  fontWeight={hoveredIndex === i ? 'bold' : 'normal'}
                  textAnchor="middle"
                >
                  {d.monthNameShamsi}
                </text>

                {/* Data Points */}
                {activeSeries.overtime && (
                  <circle
                    cx={x}
                    cy={overtimePoints[i].y}
                    r={hoveredIndex === i ? 5 : 3.5}
                    fill="#f59e0b"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                )}
                {activeSeries.welfare && (
                  <circle
                    cx={x}
                    cy={welfarePoints[i].y}
                    r={hoveredIndex === i ? 5 : 3.5}
                    fill="#14b8a6"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                )}
                {activeSeries.refund && (
                  <circle
                    cx={x}
                    cy={refundPoints[i].y}
                    r={hoveredIndex === i ? 5 : 3.5}
                    fill="#9333ea"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                )}
              </g>
            )
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div
            className="absolute top-2 bg-slate-900/90 text-white rounded-xl p-2.5 shadow-lg text-[11px] backdrop-blur-xs pointer-events-none border border-slate-700 min-w-[170px]"
            style={{
              right: Math.min(
                Math.max(10, ((chartWidth - (padding.right + hoveredIndex * xStep)) / chartWidth) * 100 - 10),
                80
              ) + '%',
            }}
          >
            <div className="font-bold text-amber-400 mb-1 border-b border-slate-700 pb-1">
              {data[hoveredIndex].monthNameShamsi}
            </div>
            {activeSeries.overtime && (
              <div className="flex justify-between gap-2 text-amber-200">
                <span>اضافه کار:</span>
                <span className="font-mono font-bold" dir="ltr">
                  {data[hoveredIndex].overtimeAmount.toLocaleString('fa-IR')} ریال
                </span>
              </div>
            )}
            {activeSeries.welfare && (
              <div className="flex justify-between gap-2 text-teal-200">
                <span>رفاهی:</span>
                <span className="font-mono font-bold" dir="ltr">
                  {data[hoveredIndex].welfareAmount.toLocaleString('fa-IR')} ریال
                </span>
              </div>
            )}
            {activeSeries.refund && (
              <div className="flex justify-between gap-2 text-purple-200">
                <span>استرداد:</span>
                <span className="font-mono font-bold" dir="ltr">
                  {data[hoveredIndex].refundAmount.toLocaleString('fa-IR')} ریال
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
