'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { reportingApi } from '@/lib/api/reporting'
import { ReportDefinition, DOMAIN_SOURCE_NAMES_FA, CATEGORY_NAMES_FA } from '@/types/reporting'
import {
  FileSpreadsheet,
  Search,
  ArrowLeft,
  Columns,
  Layers,
  Sparkles,
  Filter,
} from 'lucide-react'

export default function StandardReportsCatalogPage() {
  const [reports, setReports] = useState<ReportDefinition[]>([])
  const [selectedSource, setSelectedSource] = useState<number | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    async function loadCatalog() {
      try {
        setIsLoading(true)
        const data = await reportingApi.getCatalog(selectedSource)
        setReports(data)
      } catch (err) {
        console.error('Failed to load standard catalog:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadCatalog()
  }, [selectedSource])

  const filteredReports = reports.filter((r) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      r.title.toLowerCase().includes(term) ||
      r.code.toLowerCase().includes(term) ||
      r.description?.toLowerCase().includes(term)
    )
  })

  const sourceTabs = [
    { label: 'تمام حوزه‌ها (۱۰ گزارش)', source: undefined },
    { label: 'حقوق و اضافه کار', source: 2 },
    { label: 'استرداد مالیات (۲۴۲/۲۴۳)', source: 3 },
    { label: 'منابع انسانی و ارزیابی', source: 1 },
    { label: 'تلفیقی و فرابخشی', source: 4 },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-amber-600" />
            کاتالوگ گزارش‌های استاندارد مصوب
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            مجموعه ۱۰ گزارش مدیریتی و نظارتی با ستون‌بندی و فرمول‌های محاسباتی استاندارد
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی عنوان، کد یا شرح..."
            className="w-full text-xs pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {sourceTabs.map((tab, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setSelectedSource(tab.source)}
            className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedSource === tab.source
                ? 'bg-amber-600 text-white shadow-xs shadow-amber-600/30'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-xs font-bold text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping mr-2" />
          در حال بارگذاری کاتالوگ گزارش‌ها...
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
          گزارشی منطبق با جستجو یافت نشد
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReports.map((report) => {
            const domainName = DOMAIN_SOURCE_NAMES_FA[report.domainSource] || 'سازمانی'
            const categoryName = CATEGORY_NAMES_FA[report.category] || 'تحلیلی'

            return (
              <div
                key={report.code}
                className="group relative bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-amber-300 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {report.code}
                    </span>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      {domainName}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-extrabold text-sm text-slate-800 mb-2 leading-snug group-hover:text-amber-700 transition-colors">
                    {report.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed">
                    {report.description}
                  </p>
                </div>

                {/* Footer details & Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Columns className="w-3.5 h-3.5" />
                      {report.columns?.length || 0} ستون
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      {categoryName}
                    </span>
                  </div>

                  <Link
                    href={`/reporting/standard/${report.code}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-xs"
                  >
                    <span>اجرا و نمایش</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
