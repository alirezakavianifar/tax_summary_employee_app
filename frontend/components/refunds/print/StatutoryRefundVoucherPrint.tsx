'use client'

import React from 'react'
import type { PrintableDocument } from '@/types/taxRefund'
import { PrintContainer, PrintHeader, SignatureBox } from './PrintContainer'

interface StatutoryRefundVoucherPrintProps {
  data: PrintableDocument
}

export function StatutoryRefundVoucherPrint({ data }: StatutoryRefundVoucherPrintProps) {
  const formatRials = (val?: number) => (val ?? 0).toLocaleString('fa-IR')

  // Allocations (Table B) items, or fallback to receipts if allocations empty
  const tableBItems =
    data.allocations.length > 0
      ? data.allocations
      : data.receipts.map((r) => ({
          id: r.id,
          receiptNumber: r.receiptNumber,
          totalReceiptAmount: r.amountRials,
          refundableAmount: r.amountRials,
          bankBranch: r.bankBranch,
          city: r.city,
          revenueLedgerRow: r.revenueLedgerRow,
        }))

  return (
    <PrintContainer>
      <PrintHeader
        formTitle="برگ استرداد مالیات اضافه دریافتی"
        subtitle="موضوع ماده ۲۴۲ اصلاحی قانون مالیات‌های مستقیم مصوب ۱۳۸۰/۱۱/۲۷"
        docNumber={data.refundVoucherNumber || data.caseTrackingNumber}
        docDate={data.refundVoucherDate}
        docketNumber={data.docketNumber}
        province={data.province}
        city={data.city}
        taxUnitCode={data.taxUnitCode}
      />

      {/* Taxpayer & Scope Box */}
      <div className="border border-black text-xs p-3 mb-3 bg-gray-50/20 grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <span className="font-bold text-gray-700">نام و عنوان مودی: </span>
          <span className="font-bold text-black">{data.taxpayerName}</span>
        </div>
        <div>
          <span className="font-bold text-gray-700">شماره اقتصادی: </span>
          <span className="font-mono font-bold">{data.economicCode}</span>
        </div>
        <div className="col-span-2">
          <span className="font-bold text-gray-700">نشانی قانونی: </span>
          <span>{data.address || 'اهواز، نشانی قانونی پرونده'}</span>
        </div>
        <div>
          <span className="font-bold text-gray-700">شناسه ملی: </span>
          <span className="font-mono">{data.nationalId || '-'}</span>
        </div>
        <div>
          <span className="font-bold text-gray-700">منبع مالیاتی: </span>
          <span>{data.taxSourceName}</span>
        </div>
        <div>
          <span className="font-bold text-gray-700">عملکرد سال: </span>
          <span className="font-mono font-bold">{data.taxYear}</span>
        </div>
        <div>
          <span className="font-bold text-gray-700">دوره مالیاتی: </span>
          <span className="font-mono font-bold">{data.period || 1}</span>
        </div>
      </div>

      {/* Narrative Payment Summary */}
      <div className="text-xs leading-6 mb-3">
        مبلغ <span className="font-mono font-bold">{data.totalPaidAmountFormatted} ریال</span> به موجب تعداد کل قبوض:{' '}
        <span className="font-mono font-bold">{data.calculation.totalReceiptsCount || data.receipts.length} فقره</span>{' '}
        رسید مالیاتی (به شرح جدول الف) پرداخت گردیده است که به موجب گزارش رسیدگی شماره{' '}
        <span className="font-mono font-bold">{data.justificationReportNumber || '..........'}</span> مورخ{' '}
        <span className="font-mono font-bold">{data.justificationReportDate || '..........'}</span> اداره امور مالیاتی،
        مبالغ اضافه پرداختی به شرح زیر و به علت اشتباه واریزی و فزونی بر مالیات قطعی، قابل استرداد تشخیص گردیده است:
      </div>

      {/* Statutory Refund Breakdown Table (Fixing Excel #REF! Bug) */}
      <div className="border border-black mb-3">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-black font-bold">
              <th className="py-1 px-3 text-right">ردیف</th>
              <th className="py-1 px-3 text-right">شرح مبالغ قابل استرداد</th>
              <th className="py-1 px-3 text-left w-44">مبلغ به ریال</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="py-1 px-3 text-center w-12 font-mono">۱</td>
              <td className="py-1 px-3 font-semibold">اصل مالیات قابل استرداد (خالص پس از کسر بدهی‌ها)</td>
              <td className="py-1 px-3 font-mono font-bold text-left">{formatRials(data.calculation.principalTaxRefund)}</td>
            </tr>
            <tr className="bg-gray-50/40">
              <td className="py-1 px-3 text-center w-12 font-mono">۲</td>
              <td className="py-1 px-3">حق تمبر</td>
              <td className="py-1 px-3 font-mono text-left">{formatRials(data.calculation.stampDutyRefund)}</td>
            </tr>
            <tr>
              <td className="py-1 px-3 text-center w-12 font-mono">۳</td>
              <td className="py-1 px-3">سایر مبالغ</td>
              <td className="py-1 px-3 font-mono text-left">{formatRials(data.calculation.otherRefund)}</td>
            </tr>
            <tr className="bg-gray-50/40">
              <td className="py-1 px-3 text-center w-12 font-mono">۴</td>
              <td className="py-1 px-3">جرایم موضوعه</td>
              <td className="py-1 px-3 font-mono text-left">{formatRials(data.calculation.penaltiesRefund)}</td>
            </tr>
            <tr>
              <td className="py-1 px-3 text-center w-12 font-mono">۵</td>
              <td className="py-1 px-3">خسارت تاخیر در استرداد (موضوع تبصره ماده ۲۴۳ ق.م.م - ۱.۵٪ ماهانه)</td>
              <td className="py-1 px-3 font-mono text-left">{formatRials(data.calculation.delayDamages)}</td>
            </tr>
            <tr className="bg-gray-100 border-t-2 border-black font-black text-sm">
              <td colSpan={2} className="py-1.5 px-3 text-right">
                جمع کل مبالغ قابل استرداد (به حروف: {data.grandTotalRefundableInWords})
              </td>
              <td className="py-1.5 px-3 font-mono text-left text-black">
                {data.grandTotalRefundableFormatted} ریال
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Statutory Mandate Directive */}
      <div className="border border-black p-2.5 bg-gray-50/30 text-xs leading-6 mb-3">
        <div className="font-bold mb-1">در اجرای مفاد ماده ۲۴۲ قانون مالیات‌های مستقیم به شرح ذیل مقرر می‌گردد:</div>
        <p className="text-justify">
          اشتباه واریزی و مازاد پرداختی قابل استرداد به تایید مسئولین ذیربط رسیده است؛ علیهذا خواهشمند است در اجرای ماده
          ۲۴۲ اصلاحی قانون مالیات‌های مستقیم مصوب ۱۳۸۰/۱۱/۲۷، مبلغ{' '}
          <span className="font-bold font-mono">{data.grandTotalRefundableFormatted} ریال</span> اضافه دریافتی و خسارت
          تاخیر متعلقه را <span className="font-bold underline">از محل وصولی جاری ظرف یک ماه</span> برگشت داده و به
          ذینفع پرداخت و نسخه‌ای از سند پرداخت را جهت ضبط در پرونده مالیاتی ارسال فرمایید.
        </p>
      </div>

      {/* Table B (جدول ب - قبوض و مبالغ مشمول استرداد و ابطال) */}
      <div className="border border-black mb-4">
        <div className="bg-gray-100 border-b border-black font-bold text-xs py-1 px-2 text-center">
          جدول (ب): رسیدهای بانکی پرداخت مالیات که برای اصلاح یا ابطال به ضمیمه ایفاد می‌گردد
        </div>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-300 text-[11px] font-bold text-center">
              <th className="py-1 px-1 border-l border-gray-300 w-10">ردیف</th>
              <th className="py-1 px-2 border-l border-gray-300">شماره قبض</th>
              <th className="py-1 px-2 border-l border-gray-300">نام شعبه</th>
              <th className="py-1 px-2 border-l border-gray-300">شهرستان</th>
              <th className="py-1 px-2 border-l border-gray-300">مبلغ مندرج در قبض (ریال)</th>
              <th className="py-1 px-2 border-l border-gray-300">ردیف دفتر درآمد</th>
              <th className="py-1 px-2">مبلغ قابل استرداد (ریال)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tableBItems.slice(0, 4).map((item, idx) => (
              <tr key={idx} className="text-center font-mono">
                <td className="py-1 px-1 border-l border-gray-300">{idx + 1}</td>
                <td className="py-1 px-2 border-l border-gray-300 font-bold">{item.receiptNumber}</td>
                <td className="py-1 px-2 border-l border-gray-300 font-sans text-xs">
                  {item.bankBranch || 'ملی'}
                </td>
                <td className="py-1 px-2 border-l border-gray-300 font-sans text-xs">
                  {item.city || data.city || 'اهواز'}
                </td>
                <td className="py-1 px-2 border-l border-gray-300">{formatRials(item.totalReceiptAmount)}</td>
                <td className="py-1 px-2 border-l border-gray-300">{item.revenueLedgerRow || '-'}</td>
                <td className="py-1 px-2 font-bold text-indigo-900">{formatRials(item.refundableAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Signature Boxes */}
      <div className="grid grid-cols-2 gap-6 mt-4">
        <SignatureBox
          title={`رئیس گروه مالیاتی واحد ${data.taxUnitCode}`}
          name={data.groupHeadName}
          date={data.justificationReportDate}
        />
        <SignatureBox
          title={`رئیس امور مالیاتی شهرستان ${data.city || 'اهواز'}`}
          name={data.administrationHeadName}
          date={data.refundVoucherDate}
        />
      </div>
    </PrintContainer>
  )
}
