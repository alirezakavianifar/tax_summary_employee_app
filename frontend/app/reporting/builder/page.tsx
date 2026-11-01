'use client'

import React, { useState, useEffect } from 'react'
import { reportingApi } from '@/lib/api/reporting'
import {
  ReportDomainSource,
  DynamicQueryMetadata,
  DynamicFilterCondition,
  DynamicReportQueryRequest,
  DynamicReportResult,
  QueryableField,
} from '@/types/reporting'
import { DynamicDataTable } from '@/components/reporting/DynamicDataTable'
import { ExportActionMenu } from '@/components/reporting/ExportActionMenu'
import {
  Sliders,
  Play,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  Layers,
  Database,
  Filter,
  ArrowUpDown,
  FileSpreadsheet,
} from 'lucide-react'

export default function ReportBuilderPage() {
  const [domainSource, setDomainSource] = useState<ReportDomainSource>(2) // default Payroll
  const [schemaMeta, setSchemaMeta] = useState<DynamicQueryMetadata | null>(null)
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [filters, setFilters] = useState<DynamicFilterCondition[]>([])
  const [sortField, setSortField] = useState<string>('')
  const [sortDescending, setSortDescending] = useState<boolean>(false)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(15)

  const [queryResult, setQueryResult] = useState<DynamicReportResult | null>(null)
  const [isLoadingMeta, setIsLoadingMeta] = useState<boolean>(true)
  const [isExecuting, setIsExecuting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // 1. Fetch schema metadata when source changes
  useEffect(() => {
    async function loadSchema() {
      try {
        setIsLoadingMeta(true)
        setError(null)
        const meta = await reportingApi.getQueryMetadata(domainSource)
        setSchemaMeta(meta)

        // Default select first 5-6 fields
        if (meta.availableFields && meta.availableFields.length > 0) {
          const defaults = meta.availableFields.slice(0, 5).map((f) => f.key)
          setSelectedFields(defaults)
        } else {
          setSelectedFields([])
        }
        setFilters([])
        setSortField('')
      } catch (err: any) {
        console.error('Failed to load query metadata:', err)
        setError(err?.response?.data?.error || 'خطا در بارگذاری متادیتای ستون‌ها')
      } finally {
        setIsLoadingMeta(false)
      }
    }
    loadSchema()
  }, [domainSource])

  // Toggle field selection
  const toggleField = (key: string) => {
    setSelectedFields((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  // Select all fields in group
  const selectAllInGroup = (fields: QueryableField[]) => {
    const keys = fields.map((f) => f.key)
    const allSelected = keys.every((k) => selectedFields.includes(k))
    if (allSelected) {
      setSelectedFields((prev) => prev.filter((k) => !keys.includes(k)))
    } else {
      setSelectedFields((prev) => Array.from(new Set([...prev, ...keys])))
    }
  }

  // Add filter condition
  const addFilter = () => {
    if (!schemaMeta?.availableFields.length) return
    const firstField = schemaMeta.availableFields.find((f) => f.canFilter) || schemaMeta.availableFields[0]
    setFilters((prev) => [
      ...prev,
      { fieldName: firstField.key, operator: 'contains', value: '' },
    ])
  }

  const removeFilter = (index: number) => {
    setFilters((prev) => prev.filter((_, i) => i !== index))
  }

  const updateFilter = (index: number, key: keyof DynamicFilterCondition, val: any) => {
    setFilters((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [key]: val }
      return copy
    })
  }

  // Execute Dynamic Query
  const executeQuery = async () => {
    if (selectedFields.length === 0) {
      setError('حداقل یک ستون جهت استخراج اطلاعات انتخاب فرمایید.')
      return
    }

    try {
      setIsExecuting(true)
      setError(null)

      const request: DynamicReportQueryRequest = {
        domainSource,
        selectedFields,
        filters: filters.filter((f) => f.value && f.value.trim() !== ''),
        sortField: sortField || undefined,
        sortDescending,
        pageNumber,
        pageSize,
      }

      const res = await reportingApi.executeDynamicQuery(request)
      setQueryResult(res)
    } catch (err: any) {
      console.error('Dynamic query error:', err)
      setError(err?.response?.data?.error || 'خطا در پردازش و استخراج کوئری')
    } finally {
      setIsExecuting(false)
    }
  }

  const handleExportExcel = async () => {
    const request: DynamicReportQueryRequest = {
      domainSource,
      selectedFields,
      filters: filters.filter((f) => f.value && f.value.trim() !== ''),
      sortField: sortField || undefined,
      sortDescending,
      pageNumber: 1,
      pageSize: 5000,
    }
    await reportingApi.exportDynamicQueryExcel(request)
  }

  // Group fields by category
  const groupedFields: Record<string, QueryableField[]> = {}
  schemaMeta?.availableFields.forEach((f) => {
    const cat = f.category || 'عمومی'
    if (!groupedFields[cat]) groupedFields[cat] = []
    groupedFields[cat].push(f)
  })

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-amber-600" />
            گزارش‌ساز پویای سازمانی (Ad-Hoc Query Builder)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            طراحی آزاد و چندبعدی گزارش‌ها با انتخاب فیلدها، فیلترهای سفارشی و خروجی مستقیم اکسل
          </p>
        </div>

        {queryResult && (
          <ExportActionMenu onExportExcel={handleExportExcel} disabled={isExecuting} />
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Step 1: Select Domain Source */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        <span className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-600" />
          مرحله ۱: انتخاب پایگاه داده و حوزه موضوعی گزارش
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              id: 2,
              title: 'حقوق، اضافه کار و رفاهی',
              desc: 'ساعات کارگری، نرخ‌های اضافه کار، رفاهی و بودجه',
            },
            {
              id: 3,
              title: 'استرداد مالیات مواد ۲۴۲ و ۲۴۳',
              desc: 'قبوض، مودیان، خسارت تاخیر و مراحل قطعیت',
            },
            {
              id: 1,
              title: 'منابع انسانی و ارزیابی',
              desc: 'پرسنل، توانمندی‌ها، کشف فرار مالیاتی و مرخصی',
            },
            {
              id: 5,
              title: 'رسیدگی و حسابرسی سنیم (اکسل)',
              desc: '۱۶ هزار پرونده ارزش افزوده، ممیزان و مواعد تشخیص/قطعی',
            },
          ].map((src) => (
            <button
              key={src.id}
              type="button"
              onClick={() => setDomainSource(src.id as ReportDomainSource)}
              className={`p-4 rounded-xl border text-right transition-all cursor-pointer ${
                domainSource === src.id
                  ? 'border-amber-500 bg-amber-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="font-extrabold text-xs text-slate-800 mb-1">{src.title}</div>
              <div className="text-[11px] text-slate-500">{src.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Select Columns */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600" />
            مرحله ۲: انتخاب ستون‌های مورد نیاز ({selectedFields.length} ستون انتخاب‌شده)
          </span>

          <span className="text-[11px] text-slate-400">
            روی فیلدهای دلخواه کلیک کنید
          </span>
        </div>

        {isLoadingMeta ? (
          <div className="py-6 text-center text-xs text-slate-400">در حال بارگذاری متادیتا...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(groupedFields).map(([category, fields]) => (
              <div
                key={category}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-xs font-bold text-slate-700">{category}</span>
                  <button
                    type="button"
                    onClick={() => selectAllInGroup(fields)}
                    className="text-[10px] text-amber-700 hover:underline cursor-pointer"
                  >
                    انتخاب همه
                  </button>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {fields.map((f) => {
                    const isChecked = selectedFields.includes(f.key)
                    return (
                      <label
                        key={f.key}
                        onClick={() => toggleField(f.key)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer select-none transition-colors ${
                          isChecked
                            ? 'bg-amber-100/70 text-amber-900 font-bold'
                            : 'hover:bg-white text-slate-600'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-300" />
                        )}
                        <span>{f.persianLabel}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 3: Filters & Conditions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-600" />
            مرحله ۳: شروط و فیلترهای استخراج (اختیاری)
          </span>

          <button
            type="button"
            onClick={addFilter}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>افزودن شرط</span>
          </button>
        </div>

        {filters.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            شرطی تعریف نشده است. تمام رکوردها استخراج خواهند شد.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filters.map((f, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex-wrap sm:flex-nowrap"
              >
                {/* Field */}
                <select
                  value={f.fieldName}
                  onChange={(e) => updateFilter(idx, 'fieldName', e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 w-full sm:w-56"
                >
                  {schemaMeta?.availableFields
                    .filter((fl) => fl.canFilter)
                    .map((fl) => (
                      <option key={fl.key} value={fl.key}>
                        {fl.persianLabel}
                      </option>
                    ))}
                </select>

                {/* Operator */}
                <select
                  value={f.operator}
                  onChange={(e) => updateFilter(idx, 'operator', e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 w-full sm:w-36"
                >
                  <option value="contains">شامل عبارت</option>
                  <option value="equals">برابر با</option>
                  <option value="notequals">مخالف با</option>
                  <option value="greaterthan">بزرگتر از</option>
                  <option value="lessthan">کوچکتر از</option>
                </select>

                {/* Value */}
                <input
                  type="text"
                  value={f.value}
                  onChange={(e) => updateFilter(idx, 'value', e.target.value)}
                  placeholder="مقدار شرط..."
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 flex-1"
                />

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeFilter(idx)}
                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="حذف شرط"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 4: Sorting & Execution Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ArrowUpDown className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-700">مرتب‌سازی:</span>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
          >
            <option value="">پیش‌فرض سیستم</option>
            {schemaMeta?.availableFields
              .filter((f) => selectedFields.includes(f.key))
              .map((f) => (
                <option key={f.key} value={f.key}>
                  {f.persianLabel}
                </option>
              ))}
          </select>

          {sortField && (
            <button
              type="button"
              onClick={() => setSortDescending((prev) => !prev)}
              className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-slate-50"
            >
              {sortDescending ? 'نزولی ↓' : 'صعودی ↑'}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={executeQuery}
          disabled={isExecuting || selectedFields.length === 0}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-black text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{isExecuting ? 'در حال اجرای کوئری...' : 'اجرای کوئری و استخراج گزارش'}</span>
        </button>
      </div>

      {/* Query Results */}
      {queryResult && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-amber-600" />
              نتایج کوئری پویا ({queryResult.totalRows.toLocaleString('fa-IR')} رکورد)
            </h2>
          </div>

          <DynamicDataTable
            columns={queryResult.columns}
            rows={queryResult.rows}
            summaryAggregates={queryResult.globalAggregates}
            totalRowCount={queryResult.totalRows}
            pageNumber={pageNumber}
            pageSize={pageSize}
            totalPages={Math.ceil(queryResult.totalRows / pageSize) || 1}
            onPageChange={(p) => {
              setPageNumber(p)
              executeQuery()
            }}
            onPageSizeChange={(s) => {
              setPageSize(s)
              setPageNumber(1)
              executeQuery()
            }}
            isLoading={isExecuting}
          />
        </div>
      )}
    </div>
  )
}
