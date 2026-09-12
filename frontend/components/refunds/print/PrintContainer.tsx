'use client'

import React from 'react'
import { toPersianDigits } from '@/lib/jalali'

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
  logoSrc?: string
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
  logoSrc = '/images/Intamedia_Logo.png',
}: PrintHeaderProps) {
  return (
    <div className="border-b-2 border-black pb-3 mb-4 font-nazanin">
      <div className="flex justify-between items-start">
        {/* Right: Administrative Hierarchy */}
        <div className="text-right text-xs leading-5 text-gray-900 w-1/3">
          <p className="font-titr text-sm font-bold text-black">جمهوری اسلامی ایران</p>
          <p className="font-titr text-xs font-bold text-gray-900">وزارت امور اقتصادی و دارایی</p>
          <p className="font-titr text-xs font-bold text-gray-900">سازمان امور مالیاتی کشور</p>
          <p className="font-nazanin text-xs font-semibold mt-0.5">
            اداره کل امور مالیاتی استان {province} {city && `- اداره ${city}`}
          </p>
          {taxUnitCode && <p className="font-nazanin text-xs">واحد مالیاتی: {toPersianDigits(taxUnitCode)}</p>}
        </div>

        {/* Center: Title & Official Emblem */}
        <div className="text-center w-1/3 flex flex-col items-center">
          {logoSrc && (
            <div className="w-12 h-12 mb-1 flex items-center justify-center">
              <img
                src={logoSrc}
                alt="آرم سازمان امور مالیاتی کشور"
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <h1 className="text-base font-titr font-bold text-black tracking-tight">{formTitle}</h1>
          {subtitle && <p className="text-xs font-nazanin font-semibold text-gray-800 mt-0.5">{subtitle}</p>}
        </div>

        {/* Left: Metadata */}
        <div className="text-left text-xs leading-5 text-gray-900 w-1/3 font-nazanin">
          {docNumber && (
            <div className="flex justify-end gap-1">
              <span className="font-bold">شماره:</span>
              <span className="font-bold">{toPersianDigits(docNumber)}</span>
            </div>
          )}
          {docDate && (
            <div className="flex justify-end gap-1">
              <span className="font-bold">تاریخ:</span>
              <span className="font-bold">{toPersianDigits(docDate)}</span>
            </div>
          )}
          {trackingNumber && (
            <div className="flex justify-end gap-1">
              <span className="font-bold">کد پیگیری:</span>
              <span>{toPersianDigits(trackingNumber)}</span>
            </div>
          )}
          {docketNumber && (
            <div className="flex justify-end gap-1">
              <span className="font-bold">شماره پرونده:</span>
              <span>{toPersianDigits(docketNumber)}</span>
            </div>
          )}
          <div className="flex justify-end gap-1">
            <span className="font-bold">پیوست:</span>
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
    <div className="border border-black p-2.5 text-center flex flex-col justify-between min-h-[95px] bg-white font-nazanin">
      <div className="font-titr text-xs text-gray-900 font-bold">{title}</div>
      <div className="text-xs text-gray-800 font-semibold my-2">
        {name || '................................'}
      </div>
      <div className="text-[11px] text-gray-600 flex justify-between px-2">
        <span>مهر و امضاء</span>
        {date && <span>تاریخ: {toPersianDigits(date)}</span>}
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
      className={`a4-page bg-white text-black font-nazanin p-8 mx-auto my-4 shadow-md print:shadow-none print:m-0 print:p-0 print:w-full print:max-w-none ${
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
