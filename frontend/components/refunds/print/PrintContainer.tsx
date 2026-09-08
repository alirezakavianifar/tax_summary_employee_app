'use client'

import React from 'react'

interface PrintHeaderProps {
  formTitle: string
  subtitle?: string
  docNumber?: string
  docDate?: string
  docketNumber?: string
  trackingNumber?: string
  province?: string
  city?: string
  taxUnitCode?: string
}

export function PrintHeader({
  formTitle,
  subtitle,
  docNumber,
  docDate,
  docketNumber,
  trackingNumber,
  province = 'خوزستان',
  city = 'اهواز',
  taxUnitCode,
}: PrintHeaderProps) {
  return (
    <div className="border-b-2 border-black pb-3 mb-4">
      <div className="flex justify-between items-start">
        {/* Right: Administrative Hierarchy */}
        <div className="text-right text-xs leading-5 font-semibold text-gray-900 w-1/3">
          <p className="font-bold text-sm">جمهوری اسلامی ایران</p>
          <p>وزارت امور اقتصادی و دارایی</p>
          <p>سازمان امور مالیاتی کشور</p>
          <p>
            اداره کل امور مالیاتی استان {province} {city && `- اداره ${city}`}
          </p>
          {taxUnitCode && <p>واحد مالیاتی: {taxUnitCode}</p>}
        </div>

        {/* Center: Title & Emblem placeholder */}
        <div className="text-center w-1/3 flex flex-col items-center">
          <div className="w-10 h-10 border border-gray-800 rounded-full flex items-center justify-center text-[10px] font-bold mb-1">
            آرم سازمان
          </div>
          <h1 className="text-base font-black text-black tracking-tight">{formTitle}</h1>
          {subtitle && <p className="text-xs font-semibold text-gray-800 mt-0.5">{subtitle}</p>}
        </div>

        {/* Left: Metadata */}
        <div className="text-left text-xs leading-5 text-gray-900 w-1/3 font-mono">
          {docNumber && (
            <div className="flex justify-end gap-1">
              <span className="font-sans">شماره:</span>
              <span className="font-bold">{docNumber}</span>
            </div>
          )}
          {docDate && (
            <div className="flex justify-end gap-1">
              <span className="font-sans">تاریخ:</span>
              <span className="font-bold">{docDate}</span>
            </div>
          )}
          {trackingNumber && (
            <div className="flex justify-end gap-1">
              <span className="font-sans">کد پیگیری:</span>
              <span>{trackingNumber}</span>
            </div>
          )}
          {docketNumber && (
            <div className="flex justify-end gap-1">
              <span className="font-sans">شماره پرونده:</span>
              <span>{docketNumber}</span>
            </div>
          )}
          <div className="flex justify-end gap-1">
            <span className="font-sans">پیوست:</span>
            <span>دارد</span>
          </div>
        </div>
      </div>
    </div>
  )
}

interface SignatureBoxProps {
  title: string
  name?: string
  role?: string
  date?: string
}

export function SignatureBox({ title, name, role, date }: SignatureBoxProps) {
  return (
    <div className="border border-black p-2.5 text-center flex flex-col justify-between min-h-[95px] bg-white">
      <div className="font-bold text-xs text-gray-900">{title}</div>
      <div className="text-xs text-gray-800 font-semibold my-2">
        {name || '................................'}
      </div>
      <div className="text-[11px] text-gray-600 flex justify-between px-2">
        <span>مهر و امضاء</span>
        {date && <span>تاریخ: {date}</span>}
      </div>
    </div>
  )
}

interface PrintContainerProps {
  children: React.ReactNode
  className?: string
  isPageBreak?: boolean
}

export function PrintContainer({ children, className = '', isPageBreak = false }: PrintContainerProps) {
  return (
    <div
      className={`a4-page bg-white text-black p-8 mx-auto my-4 shadow-md print:shadow-none print:m-0 print:p-0 print:w-full print:max-w-none ${
        isPageBreak ? 'page-break' : ''
      } ${className}`}
      style={{
        width: '210mm',
        minHeight: '297mm',
        boxSizing: 'border-box',
        direction: 'rtl',
      }}
    >
      {children}
    </div>
  )
}
