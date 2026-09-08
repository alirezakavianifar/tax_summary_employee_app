'use client'

import React, { useState } from 'react'
import { Plus, Trash2, Receipt, AlertCircle, Calendar } from 'lucide-react'

export interface ReceiptItem {
  id?: string
  rowIndex: number
  receiptNumber: string
  issueDateJalali: string
  paymentDateJalali: string
  amountRials: number
  bankBranch?: string
  city?: string
  revenueLedgerRow?: string
}

interface ReceiptsTableEditorProps {
  receipts: ReceiptItem[]
  onChange: (receipts: ReceiptItem[]) => void
  disabled?: boolean
}

export default function ReceiptsTableEditor({
  receipts,
  onChange,
  disabled = false,
}: ReceiptsTableEditorProps) {
  const [newReceiptNumber, setNewReceiptNumber] = useState('')
  const [newIssueDate, setNewIssueDate] = useState('')
  const [newPaymentDate, setNewPaymentDate] = useState('')
  const [newAmount, setNewAmount] = useState<string>('')
  const [newBankBranch, setNewBankBranch] = useState('')
  const [newCity, setNewCity] = useState('')
  const [newLedgerRow, setNewLedgerRow] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)

  const handleAddReceipt = () => {
    setInputError(null)

    if (!newReceiptNumber.trim()) {
      setInputError('شماره قبض الزامی است')
      return
    }

    if (!newIssueDate.trim()) {
      setInputError('تاریخ صدور قبض الزامی است')
      return
    }

    const parsedAmount = parseFloat(newAmount.replace(/,/g, ''))
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setInputError('مبلغ قبض باید عددی مثبت باشد')
      return
    }

    const nextIndex = receipts.length > 0 ? Math.max(...receipts.map((r) => r.rowIndex)) + 1 : 1

    const newReceipt: ReceiptItem = {
      rowIndex: nextIndex,
      receiptNumber: newReceiptNumber.trim(),
      issueDateJalali: newIssueDate.trim(),
      paymentDateJalali: newPaymentDate.trim() || newIssueDate.trim(),
      amountRials: parsedAmount,
      bankBranch: newBankBranch.trim() || undefined,
      city: newCity.trim() || undefined,
      revenueLedgerRow: newLedgerRow.trim() || `ردیف ${nextIndex}`,
    }

    onChange([...receipts, newReceipt])

    // Reset inputs
    setNewReceiptNumber('')
    setNewAmount('')
    setNewLedgerRow('')
  }

  const handleRemoveReceipt = (index: number) => {
    const updated = receipts.filter((_, i) => i !== index)
    // Re-index remaining rows 1..N
    const reindexed = updated.map((r, i) => ({ ...r, rowIndex: i + 1 }))
    onChange(reindexed)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fa-IR').format(Math.round(num))
  }

  const totalAmount = receipts.reduce((sum, r) => sum + (r.amountRials || 0), 0)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm sm:text-base">
              جدول (الف): مشخصات و مبالغ قبوض پرداختی مودی
            </h3>
            <p className="text-xs text-gray-500">
              ثبت تمامی قبوض مالیاتی پرداخت شده مربوط به عملکرد یا دوره مورد استرداد
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold bg-purple-50 text-purple-800 px-3 py-1.5 rounded-xl border border-purple-200">
            تعداد قبوض: {new Intl.NumberFormat('fa-IR').format(receipts.length)}
          </span>
          <span className="text-xs font-bold bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200">
            جمع کل: {formatNumber(totalAmount)} ریال
          </span>
        </div>
      </div>

      {/* Add New Receipt Entry Form */}
      {!disabled && (
        <div className="p-4 bg-purple-50/30 border-b border-gray-200">
          <div className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-purple-600" />
            افزودن قبض جدید:
          </div>

          {inputError && (
            <div className="mb-3 p-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {inputError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {/* Receipt Number */}
            <div className="lg:col-span-2">
              <label className="block text-[11px] text-gray-600 font-medium mb-1">شماره قبض *</label>
              <input
                type="text"
                value={newReceiptNumber}
                onChange={(e) => setNewReceiptNumber(e.target.value)}
                placeholder="مثال: ۹۸۷۶۵۴۳۲۱"
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono"
              />
            </div>

            {/* Issue Date */}
            <div>
              <label className="block text-[11px] text-gray-600 font-medium mb-1">تاریخ صدور</label>
              <input
                type="text"
                value={newIssueDate}
                onChange={(e) => setNewIssueDate(e.target.value)}
                placeholder="۱۴۰۳/۰۵/۰۱"
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-center"
              />
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-[11px] text-gray-600 font-medium mb-1">تاریخ وصول بانک</label>
              <input
                type="text"
                value={newPaymentDate}
                onChange={(e) => setNewPaymentDate(e.target.value)}
                placeholder="۱۴۰۳/۰۵/۰۱"
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-center"
              />
            </div>

            {/* Amount */}
            <div className="lg:col-span-2">
              <label className="block text-[11px] text-gray-600 font-medium mb-1">مبلغ به ریال *</label>
              <input
                type="text"
                value={newAmount}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '')
                  setNewAmount(val ? Number(val).toLocaleString() : '')
                }}
                placeholder="مثال: ۳۰۰,۰۰۰,۰۰۰"
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-bold text-gray-900"
              />
            </div>

            {/* Add Button */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleAddReceipt}
                className="w-full px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                ثبت قبض
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipts List Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead className="bg-gray-100/75 text-gray-700 font-bold border-b border-gray-200">
            <tr>
              <th className="py-2.5 px-3 w-12 text-center">ردیف</th>
              <th className="py-2.5 px-3">شماره قبض</th>
              <th className="py-2.5 px-3 text-center">تاریخ صدور</th>
              <th className="py-2.5 px-3 text-center">تاریخ وصول</th>
              <th className="py-2.5 px-3">مبلغ پرداختی (ریال)</th>
              <th className="py-2.5 px-3">شعبه و شهر</th>
              {!disabled && <th className="py-2.5 px-3 w-16 text-center">عملیات</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {receipts.length === 0 ? (
              <tr>
                <td colSpan={disabled ? 6 : 7} className="py-8 text-center text-gray-400">
                  هیچ قبضی ثبت نشده است. لطفاً از فرم بالا برای ثبت قبوض استفاده نمایید.
                </td>
              </tr>
            ) : (
              receipts.map((r, index) => (
                <tr key={index} className="hover:bg-purple-50/20 transition-colors">
                  <td className="py-2.5 px-3 text-center font-bold text-gray-500">{r.rowIndex}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-gray-900">{r.receiptNumber}</td>
                  <td className="py-2.5 px-3 text-center text-gray-700 font-mono">{r.issueDateJalali}</td>
                  <td className="py-2.5 px-3 text-center text-gray-700 font-mono">{r.paymentDateJalali}</td>
                  <td className="py-2.5 px-3 font-bold text-purple-900">{formatNumber(r.amountRials)} ریال</td>
                  <td className="py-2.5 px-3 text-gray-600">{r.bankBranch || r.city || '-'}</td>
                  {!disabled && (
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveReceipt(index)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="حذف قبض"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
          {receipts.length > 0 && (
            <tfoot className="bg-gray-50 font-black border-t-2 border-gray-200">
              <tr>
                <td colSpan={4} className="py-3 px-3 text-gray-800 text-left">
                  جمع کل پرداختی (موضوع ردیف B جدول محاسبه):
                </td>
                <td className="py-3 px-3 text-purple-900 text-sm">
                  {formatNumber(totalAmount)} ریال
                </td>
                <td colSpan={disabled ? 1 : 2}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
