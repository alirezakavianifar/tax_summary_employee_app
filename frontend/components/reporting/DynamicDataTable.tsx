'use client'

import React, { useState } from 'react'
import { ReportColumnMetadata } from '@/types/reporting'
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronRight, ChevronLeft, Award } from 'lucide-react'
import { toPersianDigits } from '@/lib/jalali'
import { AuditorScorecardDrawer } from './AuditorScorecardDrawer'

interface DynamicDataTableProps {
  columns: ReportColumnMetadata[]
  rows: Record<string, any>[]
  summaryAggregates?: Record<string, any>
  totalRowCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
  sortBy?: string
  sortDescending?: boolean
  onSortChange?: (field: string) => void
  onPageChange?: (newPage: number) => void
  onPageSizeChange?: (newSize: number) => void
  isLoading?: boolean
  emptyMessage?: string
}

export function DynamicDataTable({
  columns,
  rows,
  summaryAggregates,
  totalRowCount,
  pageNumber,
  pageSize,
  totalPages,
  sortBy,
  sortDescending = false,
  onSortChange,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  emptyMessage = 'هیچ رکوردی منطبق با فیلترهای مشخص‌شده یافت نشد',
}: DynamicDataTableProps) {
  const [selectedAuditor, setSelectedAuditor] = useState<string | null>(null)
  const visibleColumns = columns.filter((c) => c.isVisible !== false)

  const isNonGroupedDigitsField = (col: ReportColumnMetadata, val?: any) => {
    const dt = col.dataType?.toLowerCase()
    if (dt === 'year' || dt === 'id' || dt === 'code') return true
    const fn = col.fieldName?.toLowerCase() || ''
    const lbl = col.persianLabel || ''
    if (
      fn === 'id' ||
      fn.endsWith('id') ||
      fn.includes('code') ||
      fn.includes('tin') ||
      fn.includes('year') ||
      fn.includes('fiscal') ||
      fn.includes('period') ||
      fn.includes('tracking') ||
      fn.includes('personnel') ||
      lbl.includes('شناسه') ||
      lbl.includes('سال') ||
      lbl.includes('کد') ||
      lbl.includes('تین') ||
      lbl.includes('دوره')
    ) {
      return true
    }
    if (typeof val === 'number' && Number.isInteger(val) && ((val >= 1300 && val <= 1450) || (val >= 1900 && val <= 2050))) {
      return true
    }
    if (typeof val === 'string' && /^(13\d{2}|14\d{2}|19\d{2}|20\d{2})$/.test(val.trim())) {
      return true
    }
    return false
  }

  const formatPlainDigits = (val: any) => {
    const cleanStr = String(val).replace(/[,،٬\s]/g, '')
    return toPersianDigits(cleanStr)
  }

  const isAuditorField = (col: ReportColumnMetadata) => {
    const fn = col.fieldName?.toLowerCase() || ''
    const lbl = col.persianLabel || ''
    return (
      fn === 'auditorname' ||
      fn === 'seniorauditorname' ||
      fn.includes('auditor') ||
      lbl.includes('نام حسابرس') ||
      lbl.includes('حسابرس مسئول') ||
      lbl.includes('حسابرس مسوول')
    )
  }

  const formatCellValue = (val: any, col: ReportColumnMetadata) => {
    if (val === null || val === undefined || val === '') {
      return <span className="text-slate-300">-</span>
    }

    switch (col.dataType?.toLowerCase()) {
      case 'year':
      case 'id':
      case 'code':
        return (
          <span className="font-mono font-semibold text-slate-700" dir="ltr">
            {formatPlainDigits(val)}
          </span>
        )

      case 'currency':
        return (
          <span className="font-mono font-bold text-slate-800" dir="ltr">
            {typeof val === 'number' ? val.toLocaleString('fa-IR') : Number(val).toLocaleString('fa-IR')}
          </span>
        )

      case 'number':
        if (isNonGroupedDigitsField(col, val)) {
          return (
            <span className="font-mono font-semibold text-slate-700" dir="ltr">
              {formatPlainDigits(val)}
            </span>
          )
        }
        return (
          <span className="font-mono font-semibold text-slate-700" dir="ltr">
            {typeof val === 'number' ? val.toLocaleString('fa-IR') : Number(val).toLocaleString('fa-IR')}
          </span>
        )

      case 'badge':
        return (
          <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 text-amber-800 border border-amber-200">
            {String(val)}
          </span>
        )

      case 'date':
        return <span className="font-mono text-slate-600 text-[11px]">{String(val)}</span>

      default:
        if (isNonGroupedDigitsField(col, val)) {
          return (
            <span className="font-mono font-semibold text-slate-700" dir="ltr">
              {formatPlainDigits(val)}
            </span>
          )
        }
        if (isAuditorField(col) && typeof val === 'string' && val.trim().length > 1) {
          return (
            <button
              type="button"
              onClick={() => setSelectedAuditor(val.trim())}
              className="inline-flex items-center gap-1.5 text-amber-700 hover:text-amber-900 font-bold hover:underline cursor-pointer group py-0.5 px-1.5 rounded-lg hover:bg-amber-100/60 transition-colors"
              title="مشاهده کارنامه ۳۶۰ درجه و شاخص‌های عملکرد حسابرس"
            >
              <Award className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
              <span>{String(val)}</span>
            </button>
          )
        }
        return <span className="text-slate-700">{String(val)}</span>
    }
  }

  const getAlignmentClass = (alignment?: string) => {
    switch (alignment?.toLowerCase()) {
      case 'left':
        return 'text-left'
      case 'center':
        return 'text-center'
      default:
        return 'text-right'
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
      {/* Table Container */}
      <div className="relative overflow-x-auto min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-20">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-white px-4 py-2 rounded-xl shadow-md border border-slate-100">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              در حال فراخوانی داده‌ها...
            </div>
          </div>
        )}

        <table className="w-full text-xs text-right border-collapse print-table">
          <thead>
            <tr className="bg-slate-900 text-white select-none">
              <th className="py-3 px-3.5 text-center font-bold text-[11px] text-slate-400 w-12 border-b border-slate-800">
                #
              </th>
              {visibleColumns.map((col) => {
                const isCurrentSort = sortBy?.toLowerCase() === col.fieldName.toLowerCase()
                return (
                  <th
                    key={col.fieldName}
                    onClick={() => col.isSortable !== false && onSortChange && onSortChange(col.fieldName)}
                    className={`py-3 px-4 font-bold text-[11px] border-b border-slate-800 ${getAlignmentClass(
                      col.alignment
                    )} ${
                      col.isSortable !== false && onSortChange
                        ? 'cursor-pointer hover:bg-slate-800/80 transition-colors'
                        : ''
                    }`}
                  >
                    <div className={`inline-flex items-center gap-1.5 ${getAlignmentClass(col.alignment)}`}>
                      <span>{col.persianLabel}</span>
                      {col.isSortable !== false && onSortChange && (
                        <span className="text-slate-400 no-print">
                          {isCurrentSort ? (
                            sortDescending ? (
                              <ArrowDown className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              <ArrowUp className="w-3.5 h-3.5 text-amber-400" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="py-12 text-center text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, rIdx) => {
                const rowNumber = (pageNumber - 1) * pageSize + rIdx + 1
                return (
                  <tr
                    key={rIdx}
                    className="hover:bg-amber-50/40 transition-colors odd:bg-white even:bg-slate-50/50"
                  >
                    <td className="py-2.5 px-3.5 text-center font-mono text-[11px] text-slate-400">
                      {rowNumber}
                    </td>
                    {visibleColumns.map((col) => (
                      <td
                        key={col.fieldName}
                        className={`py-2.5 px-4 text-xs ${getAlignmentClass(col.alignment)}`}
                      >
                        {formatCellValue(row[col.fieldName], col)}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>

          {/* Sticky Total Summary Aggregate Row */}
          {rows.length > 0 && summaryAggregates && Object.keys(summaryAggregates).length > 0 && (
            <tfoot>
              <tr className="bg-slate-100/90 font-bold border-t-2 border-double border-slate-300 text-slate-900">
                <td className="py-3 px-3.5 text-center text-amber-700">∑</td>
                {visibleColumns.map((col, idx) => {
                  const aggregateVal = summaryAggregates[col.fieldName]
                  return (
                    <td
                      key={col.fieldName}
                      className={`py-3 px-4 text-xs ${getAlignmentClass(col.alignment)}`}
                    >
                      {idx === 0 && !aggregateVal ? (
                        <span className="text-slate-800 font-extrabold">جمع کل</span>
                      ) : aggregateVal !== undefined ? (
                        formatCellValue(aggregateVal, col)
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination & Row Count Footer */}
      <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-3.5 bg-slate-50/80 border-t border-slate-200/80 text-xs text-slate-600 no-print">
        <div className="flex items-center gap-2">
          <span>نمایش ردیف‌های</span>
          <span className="font-mono font-bold text-slate-800">
            {totalRowCount > 0 ? (pageNumber - 1) * pageSize + 1 : 0}
          </span>
          <span>تا</span>
          <span className="font-mono font-bold text-slate-800">
            {Math.min(pageNumber * pageSize, totalRowCount)}
          </span>
          <span>از مجموع</span>
          <span className="font-mono font-bold text-amber-700">{totalRowCount.toLocaleString('fa-IR')}</span>
          <span>رکورد</span>
        </div>

        <div className="flex items-center gap-4">
          {onPageSizeChange && (
            <div className="flex items-center gap-1.5">
              <span>تعداد در صفحه:</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value={15}>۱۵</option>
                <option value={30}>۳۰</option>
                <option value={50}>۵۰</option>
                <option value={100}>۱۰۰</option>
              </select>
            </div>
          )}

          {onPageChange && totalPages > 1 && (
            <div className="flex items-center gap-1" dir="ltr">
              <button
                type="button"
                disabled={pageNumber <= 1}
                onClick={() => onPageChange(pageNumber - 1)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="صفحه قبل"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-2 font-mono font-bold text-slate-700">
                {pageNumber} / {totalPages}
              </span>

              <button
                type="button"
                disabled={pageNumber >= totalPages}
                onClick={() => onPageChange(pageNumber + 1)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="صفحه بعد"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Auditor 360 Scorecard Drawer */}
      {selectedAuditor && (
        <AuditorScorecardDrawer
          auditorName={selectedAuditor}
          onClose={() => setSelectedAuditor(null)}
        />
      )}
    </div>
  )
}
