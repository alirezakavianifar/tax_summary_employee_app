'use client'

import React, { useState } from 'react'
import { Plus, Trash2, Receipt, AlertCircle, Calendar } from 'lucide-react'
import {
  toEnglishDigits,
  sanitizeNumericInput,
  formatJalaliDateMask,
  isValidJalaliDate,
  normalizeJalaliDateString,
  compareJalaliDates,
  getTodayJalaliString,
} from '@/lib/jalali'

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

    const cleanReceiptNo = sanitizeNumericInput(newReceiptNumber, 25)
    if (!cleanReceiptNo) {
      setInputError('شماره قبض الزامی است و باید فقط شامل عدد باشد.')
      return
    }

    if (cleanReceiptNo.length < 4) {
      setInputError('شماره قبض باید حداقل ۴ رقم باشد.')
      return
    }

    if (receipts.some((r) => r.receiptNumber === cleanReceiptNo)) {
      setInputError(`قبض با شماره ${cleanReceiptNo} قبلاً در جدول ثبت شده است.`)
      return
    }

    if (!newIssueDate.trim()) {
      setInputError('تاریخ صدور قبض الزامی است.')
      return
    }

    const normIssueDate = normalizeJalaliDateString(newIssueDate)
    if (!normIssueDate) {
      setInputError('تاریخ صدور قبض نامعتبر است. نمونه صحیح تاریخ شمسی: ۱۴۰۳/۰۵/۰۱')
      return
    }

    let normPaymentDate = normIssueDate
    if (newPaymentDate.trim()) {
      const parsedPayment = normalizeJalaliDateString(newPaymentDate)
      if (!parsedPayment) {
        setInputError('تاریخ وصول بانک نامعتبر است. نمونه صحیح تاریخ شمسی: ۱۴۰۳/۰۵/۰۱')
        return
      }

      if (compareJalaliDates(parsedPayment, normIssueDate) < 0) {
        setInputError('تاریخ وصول بانک نمی‌تواند قبل از تاریخ صدور قبض باشد.')
        return
      }

      normPaymentDate = parsedPayment
    }

    const cleanAmount = toEnglishDigits(newAmount).replace(/,/g, '')
    const parsedAmount = parseFloat(cleanAmount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setInputError('مبلغ قبض باید عددی مثبت و بزرگتر از صفر باشد.')
      return
    }

    const nextIndex = receipts.length > 0 ? Math.max(...receipts.map((r) => r.rowIndex)) + 1 : 1

    const newReceipt: ReceiptItem = {
      rowIndex: nextIndex,
      receiptNumber: cleanReceiptNo,
      issueDateJalali: normIssueDate,
      paymentDateJalali: normPaymentDate,
      amountRials: parsedAmount,
      bankBranch: newBankBranch.trim() || undefined,
      city: newCity.trim() || undefined,
      revenueLedgerRow: newLedgerRow.trim() || `ردیف ${nextIndex}`,
    }

    onChange([...receipts, newReceipt])

    // Reset inputs
    setNewReceiptNumber('')
    setNewIssueDate('')
    setNewPaymentDate('')
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

  // Keyboard navigation & key restriction helpers
  const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === 'Backspace' ||
      e.key === 'Tab' ||
      e.key === 'Delete' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'Home' ||
      e.key === 'End' ||
      e.ctrlKey ||
      e.metaKey
    ) {
      return
    }
    // Only allow digits 0-9 and Persian/Arabic digits
    if (!/^[0-9۰-۹٠-٩]$/.test(e.key)) {
      e.preventDefault()
    }
  }

  const handleDateKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === 'Backspace' ||
      e.key === 'Tab' ||
      e.key === 'Delete' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'Home' ||
      e.key === 'End' ||
      e.ctrlKey ||
      e.metaKey
    ) {
      return
    }
    // Only allow digits and slash
    if (!/^[0-9۰-۹٠-٩/]$/.test(e.key)) {
      e.preventDefault()
    }
  }

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
            <div className="mb-3 p-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span className="font-medium">{inputError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {/* Receipt Number */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] text-gray-600 font-medium">
                  شماره قبض * <span className="text-[10px] text-gray-400 font-normal">(فقط عدد)</span>
                </label>
              </div>
              <input
                type="text"
                inputMode="numeric"
                dir="ltr"
                value={newReceiptNumber}
                onKeyDown={handleNumericKeyDown}
                onChange={(e) => {
                  const sanitized = sanitizeNumericInput(e.target.value, 25)
                  setNewReceiptNumber(sanitized)
                  if (inputError) setInputError(null)
                }}
                placeholder="مثال: ۹۸۷۶۵۴۳۲۱"
                maxLength={25}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-left"
              />
            </div>

            {/* Issue Date */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] text-gray-600 font-medium">تاریخ صدور *</label>
                <button
                  type="button"
                  onClick={() => setNewIssueDate(getTodayJalaliString())}
                  className="text-[10px] text-purple-600 hover:text-purple-800 hover:underline cursor-pointer"
                  title="درج تاریخ امروز"
                >
                  امروز
                </button>
              </div>
              <input
                type="text"
                inputMode="numeric"
                dir="ltr"
                value={newIssueDate}
                onKeyDown={handleDateKeyDown}
                onChange={(e) => {
                  const masked = formatJalaliDateMask(e.target.value)
                  setNewIssueDate(masked)
                  if (inputError) setInputError(null)
                }}
                onBlur={() => {
                  if (newIssueDate.trim()) {
                    const norm = normalizeJalaliDateString(newIssueDate)
                    if (norm) setNewIssueDate(norm)
                  }
                }}
                placeholder="۱۴۰۳/۰۵/۰۱"
                maxLength={10}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-center"
              />
            </div>

            {/* Payment Date */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] text-gray-600 font-medium">تاریخ وصول بانک</label>
                {newIssueDate && (
                  <button
                    type="button"
                    onClick={() => setNewPaymentDate(newIssueDate)}
                    className="text-[10px] text-purple-600 hover:text-purple-800 hover:underline cursor-pointer"
                    title="یکسان‌سازی با تاریخ صدور"
                  >
                    همان صدور
                  </button>
                )}
              </div>
              <input
                type="text"
                inputMode="numeric"
                dir="ltr"
                value={newPaymentDate}
                onKeyDown={handleDateKeyDown}
                onChange={(e) => {
                  const masked = formatJalaliDateMask(e.target.value)
                  setNewPaymentDate(masked)
                  if (inputError) setInputError(null)
                }}
                onBlur={() => {
                  if (newPaymentDate.trim()) {
                    const norm = normalizeJalaliDateString(newPaymentDate)
                    if (norm) setNewPaymentDate(norm)
                  }
                }}
                placeholder="۱۴۰۳/۰۵/۰۱"
                maxLength={10}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-center"
              />
            </div>

            {/* Amount */}
            <div className="lg:col-span-2">
              <label className="block text-[11px] text-gray-600 font-medium mb-1">مبلغ به ریال *</label>
              <input
                type="text"
                inputMode="numeric"
                dir="ltr"
                value={newAmount}
                onKeyDown={handleNumericKeyDown}
                onChange={(e) => {
                  const val = sanitizeNumericInput(e.target.value, 18)
                  setNewAmount(val ? Number(val).toLocaleString() : '')
                  if (inputError) setInputError(null)
                }}
                placeholder="مثال: ۳۰۰,۰۰۰,۰۰۰"
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-bold text-gray-900 text-left"
              />
            </div>

            {/* Add Button */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleAddReceipt}
                className="w-full px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
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
