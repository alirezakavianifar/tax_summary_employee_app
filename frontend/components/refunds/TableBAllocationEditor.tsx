'use client'

import React, { useState } from 'react'
import { Sparkles, CheckCircle, AlertTriangle, Layers } from 'lucide-react'
import type { ReceiptItem } from './ReceiptsTableEditor'

export interface AllocationItem {
  id?: string
  taxRefundReceiptId?: string
  receiptNumber: string
  totalReceiptAmount: number
  refundableAmount: number
  bankBranch?: string
  city?: string
  revenueLedgerRow?: string
}

interface TableBAllocationEditorProps {
  receipts: ReceiptItem[]
  allocations: AllocationItem[]
  onChange: (allocations: AllocationItem[]) => void
  principalRefundTarget: number
  disabled?: boolean
}

export default function TableBAllocationEditor({
  receipts,
  allocations,
  onChange,
  principalRefundTarget,
  disabled = false,
}: TableBAllocationEditorProps) {
  const [selectedReceiptNo, setSelectedReceiptNo] = useState<string>(receipts[0]?.receiptNumber || '')
  const [allocAmount, setAllocAmount] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fa-IR').format(Math.round(num))
  }

  const totalAllocated = allocations.reduce((sum, a) => sum + (a.refundableAmount || 0), 0)
  const remainingToAllocate = Math.max(0, principalRefundTarget - totalAllocated)

  // Auto Allocate logic: Allocate target refund sequentially across available receipts
  const handleAutoAllocate = () => {
    let remaining = principalRefundTarget
    const newAllocations: AllocationItem[] = []

    for (const r of receipts) {
      if (remaining <= 0) break
      const toRefund = Math.min(remaining, r.amountRials)
      if (toRefund > 0) {
        newAllocations.push({
          taxRefundReceiptId: r.id,
          receiptNumber: r.receiptNumber,
          totalReceiptAmount: r.amountRials,
          refundableAmount: toRefund,
          bankBranch: r.bankBranch,
          city: r.city,
          revenueLedgerRow: r.revenueLedgerRow,
        })
        remaining -= toRefund
      }
    }

    onChange(newAllocations)
  }

  const handleManualAdd = () => {
    setError(null)
    if (!selectedReceiptNo) {
      setError('قبض مورد نظر را انتخاب نمایید')
      return
    }

    const receipt = receipts.find((r) => r.receiptNumber === selectedReceiptNo)
    if (!receipt) return

    const parsedAmount = parseFloat(allocAmount.replace(/,/g, ''))
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('مبلغ تخصیص باید بزرگتر از صفر باشد')
      return
    }

    if (parsedAmount > receipt.amountRials) {
      setError(`مبلغ تخصیص نمی‌تواند از کل مبلغ قبض (${formatNumber(receipt.amountRials)} ریال) بیشتر باشد`)
      return
    }

    // Replace or add allocation for this receipt
    const filtered = allocations.filter((a) => a.receiptNumber !== selectedReceiptNo)
    const newAllocation: AllocationItem = {
      taxRefundReceiptId: receipt.id,
      receiptNumber: receipt.receiptNumber,
      totalReceiptAmount: receipt.amountRials,
      refundableAmount: parsedAmount,
      bankBranch: receipt.bankBranch,
      city: receipt.city,
      revenueLedgerRow: receipt.revenueLedgerRow,
    }

    onChange([...filtered, newAllocation])
    setAllocAmount('')
  }

  const handleRemove = (receiptNo: string) => {
    onChange(allocations.filter((a) => a.receiptNumber !== receiptNo))
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm space-y-4 p-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm sm:text-base">
              جدول (ب): تخصیص قبوض قابل استرداد (موضوع ماده ۲۴۲)
            </h4>
            <p className="text-xs text-gray-500">
              تعیین دقیق قبوض پرداختی مودی که اضافه پرداختی از محل آن‌ها مسترد و لاوصول می‌گردد
            </p>
          </div>
        </div>

        {!disabled && receipts.length > 0 && (
          <button
            type="button"
            onClick={handleAutoAllocate}
            className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            تخصیص خودکار سیستمی
          </button>
        )}
      </div>

      {/* Target and Allocated Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
          <div className="text-[11px] text-purple-700 font-bold mb-0.5">هدف قابل استرداد (خالص اصل):</div>
          <div className="text-lg font-black text-purple-950">{formatNumber(principalRefundTarget)} ریال</div>
        </div>

        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
          <div className="text-[11px] text-emerald-700 font-bold mb-0.5">مجموع تخصیص یافته به قبوض:</div>
          <div className="text-lg font-black text-emerald-950">{formatNumber(totalAllocated)} ریال</div>
        </div>

        <div className={`p-3 rounded-xl border ${
          remainingToAllocate === 0
            ? 'bg-blue-50 border-blue-100 text-blue-900'
            : 'bg-amber-50 border-amber-100 text-amber-900'
        }`}>
          <div className="text-[11px] font-bold mb-0.5">مانده نیاز به تخصیص:</div>
          <div className="text-lg font-black">{formatNumber(remainingToAllocate)} ریال</div>
        </div>
      </div>

      {/* Manual Allocation Bar */}
      {!disabled && receipts.length > 0 && (
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
          <div className="font-bold text-gray-700 mb-2">افزودن / ویرایش دستی تخصیص قبض:</div>

          {error && (
            <div className="mb-2 p-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] text-gray-600 mb-1">انتخاب قبض از جدول (الف):</label>
              <select
                value={selectedReceiptNo}
                onChange={(e) => {
                  setSelectedReceiptNo(e.target.value)
                  const r = receipts.find((x) => x.receiptNumber === e.target.value)
                  if (r) {
                    setAllocAmount(formatNumber(Math.min(remainingToAllocate || r.amountRials, r.amountRials)))
                  }
                }}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
              >
                {receipts.map((r) => (
                  <option key={r.receiptNumber} value={r.receiptNumber}>
                    قبض {r.receiptNumber} (مبلغ: {formatNumber(r.amountRials)} ریال)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-gray-600 mb-1">مبلغ تخصیص برای استرداد (ریال):</label>
              <input
                type="text"
                value={allocAmount}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '')
                  setAllocAmount(val ? Number(val).toLocaleString() : '')
                }}
                placeholder="مبلغ استردادی..."
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-bold"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleManualAdd}
                className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                ثبت تخصیص
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Allocation List Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-xl">
        <table className="w-full text-right text-xs">
          <thead className="bg-gray-100/75 text-gray-700 font-bold border-b border-gray-200">
            <tr>
              <th className="py-2.5 px-3">شماره قبض</th>
              <th className="py-2.5 px-3">کل مبلغ قبض (ریال)</th>
              <th className="py-2.5 px-3">مبلغ تخصیص یافته جهت استرداد (ریال)</th>
              <th className="py-2.5 px-3">مانده قبض نزد سازمان</th>
              {!disabled && <th className="py-2.5 px-3 w-16 text-center">عملیات</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {allocations.length === 0 ? (
              <tr>
                <td colSpan={disabled ? 4 : 5} className="py-6 text-center text-gray-400">
                  هنوز قبضی برای استرداد تخصیص داده نشده است. می‌توانید دکمه «تخصیص خودکار سیستمی» را فشار دهید.
                </td>
              </tr>
            ) : (
              allocations.map((a, i) => {
                const rem = Math.max(0, a.totalReceiptAmount - a.refundableAmount)
                return (
                  <tr key={i} className="hover:bg-indigo-50/20 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-gray-900">{a.receiptNumber}</td>
                    <td className="py-2.5 px-3 text-gray-700">{formatNumber(a.totalReceiptAmount)} ریال</td>
                    <td className="py-2.5 px-3 font-black text-indigo-700">
                      {formatNumber(a.refundableAmount)} ریال
                    </td>
                    <td className="py-2.5 px-3 text-gray-600">
                      {rem > 0 ? `${formatNumber(rem)} ریال` : 'کلاً مسترد می‌شود (۰)'}
                    </td>
                    {!disabled && (
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemove(a.receiptNumber)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                        >
                          حذف
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
