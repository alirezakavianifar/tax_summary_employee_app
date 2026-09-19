'use client'

import React, { useState } from 'react'
import { Mail, Plus, Trash2, ShieldAlert, CheckCircle, AlertCircle } from 'lucide-react'
import { TaxRefundLetterType, TaxRefundLetterTypeLabels } from '@/types/taxRefund'
import {
  toEnglishDigits,
  sanitizeNumericInput,
  formatJalaliDateMask,
  normalizeJalaliDateString,
  getTodayJalaliString,
} from '@/lib/jalali'

export interface LetterItem {
  id?: string
  letterType: TaxRefundLetterType
  letterNumber: string
  letterDateJalali: string
  description?: string
  debtAmount: number
  debtYear?: string
}

interface InquiriesEditorProps {
  petitionNumber: string
  petitionDate: string
  onPetitionChange: (number: string, date: string) => void
  letters: LetterItem[]
  onLettersChange: (letters: LetterItem[]) => void
  disabled?: boolean
}

export default function InquiriesEditor({
  petitionNumber,
  petitionDate,
  onPetitionChange,
  letters,
  onLettersChange,
  disabled = false,
}: InquiriesEditorProps) {
  const [newType, setNewType] = useState<TaxRefundLetterType>(TaxRefundLetterType.CollectionAndEnforcementInquiry)
  const [newNumber, setNewNumber] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newDebt, setNewDebt] = useState<string>('0')
  const [newYear, setNewYear] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [letterError, setLetterError] = useState<string | null>(null)

  const handleAddLetter = () => {
    setLetterError(null)
    if (!newNumber.trim()) {
      setLetterError('شماره استعلام / نامه الزامی است')
      return
    }

    let normDate = newDate.trim()
    if (normDate) {
      const parsed = normalizeJalaliDateString(normDate)
      if (!parsed) {
        setLetterError('فرمت تاریخ استعلام نامعتبر است. نمونه صحیح: ۱۴۰۳/۰۵/۰۱')
        return
      }
      normDate = parsed
    }

    const parsedDebt = parseFloat(toEnglishDigits(newDebt).replace(/,/g, '')) || 0

    const newLetter: LetterItem = {
      letterType: newType,
      letterNumber: newNumber.trim(),
      letterDateJalali: normDate,
      description: newDesc.trim() || undefined,
      debtAmount: parsedDebt,
      debtYear: newYear.trim() || undefined,
    }

    onLettersChange([...letters, newLetter])
    setNewNumber('')
    setNewDate('')
    setNewDebt('0')
    setNewDesc('')
  }

  const handleRemoveLetter = (index: number) => {
    onLettersChange(letters.filter((_, i) => i !== index))
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fa-IR').format(Math.round(num))
  }

  const totalDebts = letters.reduce((sum, l) => sum + (l.debtAmount || 0), 0)

  return (
    <div className="space-y-4">
      {/* 1. Taxpayer Inbound Petition Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900">
              درخواست کتبی استرداد مودی (وارده دبیرخانه)
            </h4>
            <p className="text-[11px] text-gray-500">شماره و تاریخ ثبت درخواست کتبی مودی به همراه مدارک مثبته</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-gray-600 font-medium mb-1">شماره ثبت وارده دبیرخانه *</label>
            <input
              type="text"
              value={petitionNumber}
              disabled={disabled}
              onChange={(e) => onPetitionChange(e.target.value, petitionDate)}
              placeholder="مثال: ۵۲۶۳۱۴"
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] text-gray-600 font-medium">تاریخ ثبت وارده *</label>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onPetitionChange(petitionNumber, getTodayJalaliString())}
                  className="text-[10px] text-purple-600 hover:text-purple-800 hover:underline cursor-pointer"
                  title="درج تاریخ امروز"
                >
                  امروز
                </button>
              )}
            </div>
            <input
              type="text"
              inputMode="numeric"
              dir="ltr"
              value={petitionDate}
              disabled={disabled}
              onChange={(e) => {
                const masked = formatJalaliDateMask(e.target.value)
                onPetitionChange(petitionNumber, masked)
              }}
              onBlur={() => {
                if (petitionDate.trim()) {
                  const norm = normalizeJalaliDateString(petitionDate)
                  if (norm) onPetitionChange(petitionNumber, norm)
                }
              }}
              placeholder="مثال: ۱۴۰۵/۰۱/۲۵"
              maxLength={10}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-mono text-center focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* 2. Inquiries & Discovered Debts Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="bg-gray-50 border-b border-gray-200 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                استعلامات عدم بدهی از سایر ادارات مالیاتی (موضوع فرم ۲)
              </h4>
              <p className="text-[11px] text-gray-500">
                استعلام از وصول و اجرا، مالیات حقوق و تکلیفی، ارث و ارزش افزوده جهت کسر بدهی از استرداد
              </p>
            </div>
          </div>

          <div className="text-xs font-bold bg-amber-50 text-amber-900 px-3 py-1.5 rounded-xl border border-amber-200">
            مجموع بدهی‌های مکشوفه: {formatNumber(totalDebts)} ریال
          </div>
        </div>

        {/* Add Inquiry Form */}
        {!disabled && (
          <div className="p-4 bg-amber-50/30 border-b border-gray-200">
            <div className="text-xs font-bold text-gray-700 mb-2.5 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-amber-600" />
              ثبت نتیجه استعلام یا بدهی جدید:
            </div>

            {letterError && (
              <div className="mb-3 p-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                <span className="font-medium">{letterError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
              {/* Type */}
              <div className="md:col-span-2">
                <label className="block text-[11px] text-gray-600 font-medium mb-1">مرجع / نوع استعلام</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(Number(e.target.value) as TaxRefundLetterType)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-500"
                >
                  <option value={TaxRefundLetterType.CollectionAndEnforcementInquiry}>
                    {TaxRefundLetterTypeLabels[TaxRefundLetterType.CollectionAndEnforcementInquiry]}
                  </option>
                  <option value={TaxRefundLetterType.WithholdingTaxInquiry}>
                    {TaxRefundLetterTypeLabels[TaxRefundLetterType.WithholdingTaxInquiry]}
                  </option>
                  <option value={TaxRefundLetterType.EstateInquiry}>
                    {TaxRefundLetterTypeLabels[TaxRefundLetterType.EstateInquiry]}
                  </option>
                  <option value={TaxRefundLetterType.BusinessInquiry}>
                    {TaxRefundLetterTypeLabels[TaxRefundLetterType.BusinessInquiry]}
                  </option>
                  <option value={TaxRefundLetterType.VatInquiry}>
                    {TaxRefundLetterTypeLabels[TaxRefundLetterType.VatInquiry]}
                  </option>
                  <option value={TaxRefundLetterType.TreasuryLetter}>
                    {TaxRefundLetterTypeLabels[TaxRefundLetterType.TreasuryLetter]}
                  </option>
                </select>
              </div>

              {/* Number */}
              <div>
                <label className="block text-[11px] text-gray-600 font-medium mb-1">شماره نامه</label>
                <input
                  type="text"
                  value={newNumber}
                  onChange={(e) => {
                    setNewNumber(e.target.value)
                    if (letterError) setLetterError(null)
                  }}
                  placeholder="مثال: ۱۲۳۵۴۶۵"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-mono"
                />
              </div>

              {/* Date */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] text-gray-600 font-medium">تاریخ نامه</label>
                  <button
                    type="button"
                    onClick={() => setNewDate(getTodayJalaliString())}
                    className="text-[10px] text-amber-700 hover:text-amber-900 hover:underline cursor-pointer"
                    title="درج تاریخ امروز"
                  >
                    امروز
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  value={newDate}
                  onChange={(e) => {
                    const masked = formatJalaliDateMask(e.target.value)
                    setNewDate(masked)
                    if (letterError) setLetterError(null)
                  }}
                  onBlur={() => {
                    if (newDate.trim()) {
                      const norm = normalizeJalaliDateString(newDate)
                      if (norm) setNewDate(norm)
                    }
                  }}
                  placeholder="۱۴۰۵/۰۲/۰۱"
                  maxLength={10}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-mono text-center"
                />
              </div>

              {/* Debt */}
              <div>
                <label className="block text-[11px] text-gray-600 font-medium mb-1">مبلغ بدهی (ریال)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  value={newDebt}
                  onChange={(e) => {
                    const val = sanitizeNumericInput(e.target.value, 18)
                    setNewDebt(val ? Number(val).toLocaleString() : '0')
                    if (letterError) setLetterError(null)
                  }}
                  placeholder="۰"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-bold text-left"
                />
              </div>

              {/* Button */}
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAddLetter}
                  className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  ثبت استعلام
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Letters Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-gray-100/75 text-gray-700 font-bold border-b border-gray-200">
              <tr>
                <th className="py-2.5 px-3">نوع نامه / واحد مرجع</th>
                <th className="py-2.5 px-3">شماره نامه</th>
                <th className="py-2.5 px-3 text-center">تاریخ</th>
                <th className="py-2.5 px-3">مبلغ بدهی قطعی (ریال)</th>
                <th className="py-2.5 px-3">وضعیت</th>
                {!disabled && <th className="py-2.5 px-3 w-16 text-center">عملیات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {letters.length === 0 ? (
                <tr>
                  <td colSpan={disabled ? 5 : 6} className="py-6 text-center text-gray-400">
                    استعلامی ثبت نشده است. به طور پیش‌فرض، عدم وجود بدهی منظور می‌گردد.
                  </td>
                </tr>
              ) : (
                letters.map((l, index) => (
                  <tr key={index} className="hover:bg-amber-50/20 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-gray-900">
                      {TaxRefundLetterTypeLabels[l.letterType] || 'نامه اداری'}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-gray-800">{l.letterNumber}</td>
                    <td className="py-2.5 px-3 text-center text-gray-600 font-mono">{l.letterDateJalali}</td>
                    <td className="py-2.5 px-3 font-bold text-gray-900">
                      {l.debtAmount > 0 ? (
                        <span className="text-rose-600">{formatNumber(l.debtAmount)} ریال</span>
                      ) : (
                        <span className="text-emerald-600">فاقد بدهی (۰)</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {l.debtAmount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          بدهکار
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle className="w-3 h-3" />
                          تسویه شده
                        </span>
                      )}
                    </td>
                    {!disabled && (
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLetter(index)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
