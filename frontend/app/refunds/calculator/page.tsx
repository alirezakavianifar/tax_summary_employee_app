'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Calculator,
  ChevronLeft,
  Scale,
  RotateCcw,
  Sparkles,
  TrendingDown,
  Info,
  Layers,
} from 'lucide-react'
import LiveCalculationCard from '@/components/refunds/LiveCalculationCard'

export default function CalculatorPage() {
  const [totalPaidStr, setTotalPaidStr] = useState('315,000,000')
  const [assessedIncomeStr, setAssessedIncomeStr] = useState('1,000,000,000')
  const [exemptionsStr, setExemptionsStr] = useState('0')
  const [assessedTaxStr, setAssessedTaxStr] = useState('250,000,000')
  const [penaltiesTaxStr, setPenaltiesTaxStr] = useState('0')
  const [timelyBonusStr, setTimelyBonusStr] = useState('0')
  const [debtsStr, setDebtsStr] = useState('0')
  const [stampDutyStr, setStampDutyStr] = useState('0')
  const [otherStr, setOtherStr] = useState('0')
  const [penaltiesRefundStr, setPenaltiesRefundStr] = useState('0')
  const [delayMonths, setDelayMonths] = useState<number>(0)

  const parseNum = (str: string) => parseFloat(str.replace(/,/g, '')) || 0

  const totalPaid = parseNum(totalPaidStr)
  const assessedIncome = parseNum(assessedIncomeStr)
  const exemptions = parseNum(exemptionsStr)
  const assessedTax = parseNum(assessedTaxStr)
  const nonWaivablePenalties = parseNum(penaltiesTaxStr)
  const timelyPaymentBonus = parseNum(timelyBonusStr)
  const totalDiscoveredDebts = parseNum(debtsStr)
  const stampDuty = parseNum(stampDutyStr)
  const other = parseNum(otherStr)
  const penalties = parseNum(penaltiesRefundStr)

  const handleReset = () => {
    setTotalPaidStr('315,000,000')
    setAssessedIncomeStr('1,000,000,000')
    setExemptionsStr('0')
    setAssessedTaxStr('250,000,000')
    setPenaltiesTaxStr('0')
    setTimelyBonusStr('0')
    setDebtsStr('0')
    setStampDutyStr('0')
    setOtherStr('0')
    setPenaltiesRefundStr('0')
    setDelayMonths(0)
  }

  const handleBenchmarkSample = () => {
    setTotalPaidStr('315,000,000')
    setAssessedIncomeStr('1,000,000,000')
    setExemptionsStr('0')
    setAssessedTaxStr('250,000,000')
    setPenaltiesTaxStr('0')
    setTimelyBonusStr('0')
    setDebtsStr('0')
    setDelayMonths(0)
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link href="/refunds" className="hover:text-purple-700">کارپوشه استرداد</Link>
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="text-gray-900 font-bold">شبیه‌ساز و محاسبه‌گر برخط</span>
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-800 to-indigo-900 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
              <Scale className="w-6 h-6 text-purple-200" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black">شبیه‌ساز و محاسبه‌گر استرداد مالیات</h1>
              <p className="text-xs text-purple-200 mt-0.5">
                محاسبه آنی اضافه پرداختی ماده ۲۴۲ و خسارت تاخیر ۱.۵٪ ماهانه ماده ۲۴۳ قانون مالیات‌های مستقیم
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBenchmarkSample}
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              الگوی نمونه (دلفی)
            </button>
            <button
              onClick={handleReset}
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              بازنشانی
            </button>
          </div>
        </div>

        {/* Two-Column Simulator Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Inputs Section (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Input Card 1: Receipts & Payments */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                <Layers className="w-4 h-4 text-purple-600" />
                ۱. پرداختی‌های مودی و قبوض مالیاتی
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-gray-700 font-bold mb-1">
                    مجموع مبالغ پرداخت شده طبق قبوض جدول (الف) به ریال:
                  </label>
                  <input
                    type="text"
                    value={totalPaidStr}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, '')
                      setTotalPaidStr(v ? Number(v).toLocaleString() : '')
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-bold text-gray-900 text-sm focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-[11px] text-gray-400 block mt-1">
                    مجموع کلیه قبوض مالیاتی معتبر واریز شده برای سال مورد نظر
                  </span>
                </div>
              </div>
            </div>

            {/* Input Card 2: Assessment Details */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                <Calculator className="w-4 h-4 text-indigo-600" />
                ۲. مبالغ قطعی شده در برگ تشخیص / قطعی
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">درآمد تشخیصی قبل از کسر مالیات</label>
                  <input
                    type="text"
                    value={assessedIncomeStr}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, '')
                      setAssessedIncomeStr(v ? Number(v).toLocaleString() : '')
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">جمع معافیت‌ها و بخشودگی‌ها</label>
                  <input
                    type="text"
                    value={exemptionsStr}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, '')
                      setExemptionsStr(v ? Number(v).toLocaleString() : '0')
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">مالیات تشخیصی قطعی (F) *</label>
                  <input
                    type="text"
                    value={assessedTaxStr}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, '')
                      setAssessedTaxStr(v ? Number(v).toLocaleString() : '')
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-black text-purple-900"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">جرایم غیرقابل بخشش (G)</label>
                  <input
                    type="text"
                    value={penaltiesTaxStr}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, '')
                      setPenaltiesTaxStr(v ? Number(v).toLocaleString() : '0')
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">جایزه خوش‌حسابی (I)</label>
                  <input
                    type="text"
                    value={timelyBonusStr}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, '')
                      setTimelyBonusStr(v ? Number(v).toLocaleString() : '0')
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">بدهی‌های کشف شده در استعلامات</label>
                  <input
                    type="text"
                    value={debtsStr}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, '')
                      setDebtsStr(v ? Number(v).toLocaleString() : '0')
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-rose-700 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Input Card 3: Article 243 Delay Damages */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                <Info className="w-4 h-4 text-amber-600" />
                ۳. محاسبه خسارت تاخیر در استرداد (ماده ۲۴۳ ق.م.م)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">
                    مدت تاخیر بیش از موعد قانونی (تعداد ماه):
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={delayMonths}
                    onChange={(e) => setDelayMonths(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-bold"
                  />
                  <span className="text-[11px] text-gray-400 block mt-1">
                    نرخ جریمه تاخیر: ۱.۵٪ اصل مبلغ استرداد به ازای هر ماه
                  </span>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">استرداد حق تمبر و سایر</label>
                  <input
                    type="text"
                    value={stampDutyStr}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, '')
                      setStampDutyStr(v ? Number(v).toLocaleString() : '0')
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Calculation Result Card */}
          <div className="lg:sticky lg:top-24">
            <LiveCalculationCard
              totalPaidAmount={totalPaid}
              assessedTax={assessedTax}
              nonWaivablePenalties={nonWaivablePenalties}
              timelyPaymentBonus={timelyPaymentBonus}
              totalDiscoveredDebts={totalDiscoveredDebts}
              stampDuty={stampDuty}
              other={other}
              penalties={penalties}
              delayMonths={delayMonths}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
