'use client'

import React from 'react'
import { Calculator, AlertCircle, CheckCircle2, TrendingDown, Scale } from 'lucide-react'

interface LiveCalculationCardProps {
  totalPaidAmount: number
  assessedTax: number
  nonWaivablePenalties?: number
  timelyPaymentBonus?: number
  totalDiscoveredDebts: number
  stampDuty?: number
  other?: number
  penalties?: number
  delayMonths?: number
  className?: string
}

export default function LiveCalculationCard({
  totalPaidAmount = 0,
  assessedTax = 0,
  nonWaivablePenalties = 0,
  timelyPaymentBonus = 0,
  totalDiscoveredDebts = 0,
  stampDuty = 0,
  other = 0,
  penalties = 0,
  delayMonths = 0,
  className = '',
}: LiveCalculationCardProps) {
  // Statutory calculations (Articles 242 and 243)
  const totalAssessed = assessedTax + nonWaivablePenalties
  const surplusPaid = totalAssessed - timelyPaymentBonus - totalPaidAmount
  const isOverpaid = surplusPaid < 0
  const grossSurplus = isOverpaid ? Math.abs(surplusPaid) : 0
  const principalRefund = Math.max(0, grossSurplus - totalDiscoveredDebts)
  const delayDamages = Math.round(principalRefund * 0.015 * Math.max(0, delayMonths))
  const grandTotal = principalRefund + stampDuty + other + penalties + delayDamages

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fa-IR').format(Math.round(num))
  }

  const toToman = (num: number) => {
    return new Intl.NumberFormat('fa-IR').format(Math.round(num / 10))
  }

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden ${className}`}>
      {/* Card Header */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
              <Calculator className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">محاسبه زنده استرداد</h3>
              <p className="text-xs text-purple-200">موضوع مواد ۲۴۲ و ۲۴۳ ق.م.م</p>
            </div>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
            isOverpaid
              ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
              : 'bg-amber-500/20 text-amber-200 border-amber-400/30'
          }`}>
            {isOverpaid ? 'دارای اضافه پرداختی' : 'فاقد مازاد پرداخت'}
          </span>
        </div>
      </div>

      {/* Main Metric Spotlight */}
      <div className="p-5 border-b border-gray-100 bg-purple-50/40">
        <div className="text-xs font-semibold text-purple-900 mb-1">جمع کل قابل استرداد (خالص):</div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-purple-900 tracking-tight">
            {formatNumber(grandTotal)}
          </span>
          <span className="text-sm font-bold text-purple-700">ریال</span>
        </div>
        <div className="text-xs text-gray-500 mt-1 font-medium">
          معادل: <span className="font-bold text-gray-800">{toToman(grandTotal)}</span> تومان
        </div>
      </div>

      {/* Itemized Calculation Breakdown */}
      <div className="p-4 space-y-3 text-xs">
        {/* Total Paid Receipts */}
        <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
          <span className="text-gray-600">جمع پرداختی قبوض (جدول الف):</span>
          <span className="font-bold text-gray-900">{formatNumber(totalPaidAmount)} ریال</span>
        </div>

        {/* Assessed Tax */}
        <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
          <span className="text-gray-600">مالیات و جرایم تشخیصی قطعی:</span>
          <span className="font-bold text-gray-900">{formatNumber(totalAssessed)} ریال</span>
        </div>

        {/* Overpayment Difference */}
        <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
          <span className="text-gray-600 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-purple-600" />
            مازاد پرداختی ناخالص (J):
          </span>
          <span className={`font-black ${isOverpaid ? 'text-emerald-600' : 'text-gray-500'}`}>
            {isOverpaid ? `-${formatNumber(grossSurplus)}` : '۰'} ریال
          </span>
        </div>

        {/* Deducted Discovered Debts */}
        <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
          <span className="text-gray-600">کسر: بدهی‌های کشف شده (استعلامات):</span>
          <span className={`font-bold ${totalDiscoveredDebts > 0 ? 'text-rose-600' : 'text-gray-400'}`}>
            {totalDiscoveredDebts > 0 ? `-${formatNumber(totalDiscoveredDebts)}` : '۰'} ریال
          </span>
        </div>

        {/* Principal Refund */}
        <div className="flex justify-between items-center py-1.5 border-b border-gray-100 bg-gray-50 px-2 rounded-lg">
          <span className="font-bold text-gray-800">اصل مالیات قابل استرداد:</span>
          <span className="font-black text-purple-700">{formatNumber(principalRefund)} ریال</span>
        </div>

        {/* Delay Damages */}
        {delayMonths > 0 && (
          <div className="flex justify-between items-center py-1.5 border-b border-gray-100 text-amber-800 bg-amber-50 px-2 rounded-lg">
            <span>خسارت تاخیر ماده ۲۴۳ ({delayMonths} ماه - ۱.۵٪ ماهانه):</span>
            <span className="font-bold">{formatNumber(delayDamages)} ریال</span>
          </div>
        )}

        {/* Legal Notes */}
        <div className="pt-2">
          <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-blue-900 leading-relaxed flex gap-2">
            <Scale className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">ماده ۲۴۲ ق.م.م:</span> اداره امور مالیاتی مکلف است اضافه مالیات دریافتی را ظرف حداکثر یک ماه از تاریخ تعیین به مودی مسترد نماید.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
