'use client'

import React from 'react'
import type { PrintableDocument } from '@/types/taxRefund'
import { getTodayJalaliString, toPersianDigits } from '@/lib/jalali'
import { PrintContainer, PrintHeader, SignatureBox } from './PrintContainer'

interface TableAPrintProps {
  data: PrintableDocument
}

export function TableAPrint({ data }: TableAPrintProps) {
  const fallbackDate = React.useMemo(() => getTodayJalaliString(), [])
  const formatRials = (val?: number) => (val ?? 0).toLocaleString('fa-IR')

  // Support pagination or dynamic rows (instead of Excel's rigid 13 rows)
  const receipts = data.receipts || []
  const totalAmount = receipts.reduce((acc, r) => acc + (r.amountRials || 0), 0)

  const docNumber = data.refundVoucherNumber || data.caseTrackingNumber
  const docDate = data.refundVoucherDate || fallbackDate
  const reportDate = data.justificationReportDate || fallbackDate

  return (
    <PrintContainer>
      <PrintHeader
        formTitle="جدول (الف) قبوض پرداختی برگ استرداد"
        subtitle="موضوع ماده ۲۴۲ اصلاحی قانون مالیات‌های مستقیم"
        docNumber={docNumber}
        docDate={docDate}
        docketNumber={data.docketNumber}
        province={data.province}
        city={data.city}
        taxUnitCode={data.taxUnitCode}
      />

      <div className="border border-black text-xs p-2.5 mb-3 bg-gray-50/20 grid grid-cols-3 gap-2 font-nazanin">
        <div className="col-span-2">
          <span className="font-bold text-gray-700">نام مودی: </span>
          <span className="font-bold text-black">{data.taxpayerName}</span>
        </div>
        <div>
          <span className="font-bold text-gray-700">شماره اقتصادی: </span>
          <span className="font-bold">{toPersianDigits(data.economicCode)}</span>
        </div>
        <div>
          <span className="font-bold text-gray-700">عملکرد سال: </span>
          <span className="font-bold">{toPersianDigits(data.taxYear)}</span>
        </div>
        <div>
          <span className="font-bold text-gray-700">منبع مالیاتی: </span>
          <span>{data.taxSourceName}</span>
        </div>
        <div>
          <span className="font-bold text-gray-700">واحد مالیاتی: </span>
          <span className="font-bold">{toPersianDigits(data.taxUnitCode)}</span>
        </div>
      </div>

      <div className="border border-black mb-4">
        <table className="w-full text-xs border-collapse font-nazanin">
          <thead>
            <tr className="bg-gray-100 border-b border-black font-bold text-center font-titr">
              <th className="py-2 px-1 border-l border-black w-10">ردیف</th>
              <th className="py-2 px-2 border-l border-black">شماره قبض</th>
              <th className="py-2 px-2 border-l border-black">تاریخ صدور</th>
              <th className="py-2 px-2 border-l border-black">نام شعبه بانک</th>
              <th className="py-2 px-2 border-l border-black">شهرستان</th>
              <th className="py-2 px-3 border-l border-black text-left">مبلغ مندرج در رسید (ریال)</th>
              <th className="py-2 px-2">شماره ردیف دفتر درآمد</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {receipts.map((r, idx) => (
              <tr key={idx} className="text-center hover:bg-gray-50/50">
                <td className="py-1.5 px-1 border-l border-gray-300">{toPersianDigits(idx + 1)}</td>
                <td className="py-1.5 px-2 border-l border-gray-300 font-bold">{toPersianDigits(r.receiptNumber)}</td>
                <td className="py-1.5 px-2 border-l border-gray-300">{toPersianDigits(r.issueDateJalali)}</td>
                <td className="py-1.5 px-2 border-l border-gray-300 text-xs">
                  {r.bankBranch || 'ملی'}
                </td>
                <td className="py-1.5 px-2 border-l border-gray-300 text-xs">
                  {r.city || data.city || 'اهواز'}
                </td>
                <td className="py-1.5 px-3 border-l border-gray-300 text-left font-bold">
                  {formatRials(r.amountRials)}
                </td>
                <td className="py-1.5 px-2 text-xs">{toPersianDigits(r.revenueLedgerRow) || '-'}</td>
              </tr>
            ))}

            {/* Pad with empty rows to simulate standard formal register if few receipts */}
            {receipts.length < 6 &&
              Array.from({ length: 6 - receipts.length }).map((_, i) => (
                <tr key={`pad-${i}`} className="text-center text-gray-300">
                  <td className="py-1.5 px-1 border-l border-gray-300">{toPersianDigits(receipts.length + i + 1)}</td>
                  <td className="py-1.5 px-2 border-l border-gray-300">-</td>
                  <td className="py-1.5 px-2 border-l border-gray-300">-</td>
                  <td className="py-1.5 px-2 border-l border-gray-300">-</td>
                  <td className="py-1.5 px-2 border-l border-gray-300">-</td>
                  <td className="py-1.5 px-3 border-l border-gray-300 text-left">-</td>
                  <td className="py-1.5 px-2">-</td>
                </tr>
              ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 border-t-2 border-black font-bold text-xs font-titr">
              <td colSpan={2} className="py-2 px-2 text-right">
                تعداد کل قبوض: <span className="font-bold text-sm">{toPersianDigits(receipts.length)} فقره</span>
              </td>
              <td colSpan={3} className="py-2 px-2 text-left">
                جمع کل مبالغ پرداختی مودی:
              </td>
              <td className="py-2 px-3 text-left font-bold text-sm text-black border-l border-black">
                {formatRials(totalAmount)} ریال
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-6 mt-16">
        <SignatureBox
          title={`رئیس گروه مالیاتی شهرستان ${data.city || 'اهواز'}`}
          name={data.groupHeadName}
          date={reportDate}
        />
        <SignatureBox
          title={`رئیس امور مالیاتی شهرستان ${data.city || 'اهواز'}`}
          name={data.administrationHeadName}
          date={docDate}
        />
      </div>
    </PrintContainer>
  )
}
