'use client'

import React from 'react'
import type { PrintableDocument, TaxRefundLetter } from '@/types/taxRefund'
import { TaxRefundLetterTypeLabels } from '@/types/taxRefund'
import { getTodayJalaliString, toPersianDigits, formatCaseTrackingNumber } from '@/lib/jalali'
import { PrintContainer, PrintHeader } from './PrintContainer'

interface TreasuryLetterPrintProps {
  data: PrintableDocument
}

export function TreasuryLetterPrint({ data }: TreasuryLetterPrintProps) {
  const fallbackDate = React.useMemo(() => getTodayJalaliString(), [])
  const docNumber = formatCaseTrackingNumber(data.treasuryLetterNumber || data.caseTrackingNumber)
  const voucherNumber = formatCaseTrackingNumber(data.refundVoucherNumber || data.caseTrackingNumber)
  const docDate = data.treasuryLetterDate || data.refundVoucherDate || fallbackDate
  const voucherDate = data.refundVoucherDate || data.treasuryLetterDate || fallbackDate

  const totalDiscoveredDebts = data.calculation?.totalDiscoveredDebts ?? 0
  const grossSurplus =
    (data.calculation?.grossSurplus && data.calculation.grossSurplus > 0)
      ? data.calculation.grossSurplus
      : ((data.calculation?.principalTaxRefund ?? 0) + totalDiscoveredDebts)

  const formatRials = (val?: number) => toPersianDigits((val ?? 0).toLocaleString('en-US'))
  const debtLetters = (data.letters || []).filter((l) => (l.debtAmount || 0) > 0)

  const getLetterTitle = (l: TaxRefundLetter) => {
    if (l.letterTypeName) return l.letterTypeName
    if (l.letterType !== undefined && TaxRefundLetterTypeLabels[l.letterType]) {
      return TaxRefundLetterTypeLabels[l.letterType]
    }
    return l.description || 'استعلام'
  }

  return (
    <PrintContainer>
      <PrintHeader
        formTitle="نامه ذیحسابی جهت استرداد وجه"
        subtitle="ارسال پرونده استرداد جهت پرداخت به حساب مودی"
        docNumber={docNumber}
        docDate={docDate}
        docketNumber={data.docketNumber}
        province={data.province}
        city={data.city}
        taxUnitCode={data.taxUnitCode}
      />

      <div className="my-8 text-sm leading-8 text-justify font-nazanin">
        <div className="font-bold mb-6 text-base">
          به: ذیحساب و مدیرکل محترم امور مالی و ذیحسابی اداره کل امور مالیاتی استان {data.province || 'خوزستان'}
        </div>

        <div className="font-bold mb-4">موضوع: استرداد اضافه پرداختی مالیات مودی {data.taxpayerName}</div>

        <p className="indent-8 mb-6">
          با سلام و احترام؛
          <br />
          به پیوست یک فقره پرونده استرداد موضوع مواد ۲۴۲ و ۲۴۳ قانون مالیات‌های مستقیم به شماره برگ استرداد{' '}
          <span className="font-bold">{voucherNumber ? toPersianDigits(voucherNumber) : '..........'}</span> مورخ{' '}
          <span className="font-bold">{voucherDate ? toPersianDigits(voucherDate) : '..........'}</span> مربوط به{' '}
          <span className="font-bold">{data.taxpayerName}</span> به شماره اقتصادی{' '}
          <span className="font-bold">{toPersianDigits(data.economicCode)}</span>
          {data.nationalId && <span> و شناسه ملی {toPersianDigits(data.nationalId)}</span>}{' '}
          {totalDiscoveredDebts > 0 ? (
            <>
              مربوط به مالیات بر <span className="font-bold">{data.taxSourceName}</span> سال عملکرد{' '}
              <span className="font-bold">{toPersianDigits(data.taxYear)}</span> ارسال می‌گردد.
            </>
          ) : (
            <>
              به مبلغ{' '}
              <span className="font-bold text-base">{toPersianDigits(data.grandTotalRefundableFormatted)} ریال</span> (به حروف:{' '}
              <span className="font-bold">{data.grandTotalRefundableInWords}</span>) مربوط به مالیات بر{' '}
              <span className="font-bold">{data.taxSourceName}</span> سال عملکرد{' '}
              <span className="font-bold">{toPersianDigits(data.taxYear)}</span> ارسال می‌گردد.
            </>
          )}
        </p>

        {totalDiscoveredDebts > 0 && (
          <p className="indent-8 mb-6 text-justify">
            شایان ذکر است بر اساس رسیدگی‌های معموله و پاسخ استعلامات مأخوذه از واحدهای مالیاتی تابعه، کل مازاد پرداختی اولیه مودی مبلغ{' '}
            <span className="font-bold">{formatRials(grossSurplus)} ریال</span> بوده است که پس از کسر بدهی‌های قطعی کشف شده وی به نفع اداره امور مالیاتی به مبلغ{' '}
            <span className="font-bold text-rose-800">-{formatRials(totalDiscoveredDebts)} ریال</span> (کسر: بدهی‌های کشف شده استعلامات)،
            خالص مبلغ قابل استرداد معادل{' '}
            <span className="font-bold text-base">{toPersianDigits(data.grandTotalRefundableFormatted)} ریال</span> (به حروف:{' '}
            <span className="font-bold">{data.grandTotalRefundableInWords}</span>) تعیین گردیده است.
          </p>
        )}

        <p className="indent-8 mb-6">
          مقتضی است دستور فرمایید ضمن بررسی مدارک ضمیمه و وفق موازین و مقررات قانونی، نسبت به استرداد وجه فوق‌الذکر
          اقدام و مبلغ <span className="font-bold">{toPersianDigits(data.grandTotalRefundableFormatted)} ریال</span> طبق درخواست کتبی مودی
          به حساب بانکی وی به شماره شبا{' '}
          <span className="font-bold text-base tracking-wider inline-block font-sans" dir="ltr">{data.shebaNumber}</span> نزد بانک{' '}
          <span className="font-bold">{data.bankName}{data.bankBranch ? ` شعبه ${data.bankBranch}` : ''}</span> واریز و تصویر حواله پرداختی را جهت ضبط در پرونده مالیاتی به
          این اداره ارسال فرمایند.
        </p>

        <div className="border border-black p-4 bg-gray-50/50 rounded text-xs space-y-2 mb-8 font-nazanin">
          <div className="font-bold text-sm border-b border-black pb-1 font-titr flex justify-between items-center">
            <span>خلاصه مشخصات حساب بانکی و مبالغ استرداد:</span>
            {totalDiscoveredDebts > 0 && (
              <span className="text-[11px] font-normal text-gray-700">
                (پس از کسر بدهی‌های سنواتی مودی به اداره امور مالیاتی)
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <span className="font-semibold text-gray-700">نام صاحب حساب:</span> {data.taxpayerName}
            </div>
            <div>
              <span className="font-semibold text-gray-700">بانک عامل:</span> {data.bankName}{data.bankBranch ? ` (شعبه ${data.bankBranch})` : ''}
            </div>
            <div className="col-span-2">
              <span className="font-semibold text-gray-700">شماره شبا:</span>{' '}
              <span className="font-bold text-sm tracking-wider inline-block font-sans" dir="ltr">{data.shebaNumber}</span>
            </div>

            {totalDiscoveredDebts > 0 && (
              <>
                <div className="border-t border-dashed border-gray-300 pt-1.5">
                  <span className="font-semibold text-gray-700">مازاد پرداختی اولیه (ناخالص):</span>{' '}
                  <span className="font-bold">{formatRials(grossSurplus)} ریال</span>
                </div>
                <div className="border-t border-dashed border-gray-300 pt-1.5">
                  <span className="font-semibold text-rose-800">کسر: بدهی‌های کشف شده (استعلامات):</span>{' '}
                  <span className="font-bold text-rose-800">-{formatRials(totalDiscoveredDebts)} ریال</span>
                </div>

                {debtLetters.length > 0 && (
                  <div className="col-span-2 bg-gray-100/70 border border-gray-300 p-2 rounded text-[11px] text-gray-800 space-y-1 my-1">
                    <span className="font-bold block text-gray-900">ریز بدهی‌های کشف شده و کسر شده به نفع واحدهای مالیاتی:</span>
                    {debtLetters.map((l, idx) => (
                      <div key={idx} className="flex justify-between items-center pr-2 border-r-2 border-gray-400">
                        <span>
                          • {getLetterTitle(l)} {l.letterNumber ? `(شماره ${toPersianDigits(l.letterNumber)})` : ''}:
                        </span>
                        <span className="font-bold font-mono text-rose-800">{formatRials(l.debtAmount)} ریال</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            <div className={totalDiscoveredDebts > 0 ? "border-t border-black pt-1.5" : ""}>
              <span className="font-semibold text-gray-700">
                {totalDiscoveredDebts > 0 ? 'خالص مبلغ قابل پرداخت (واریزی به حساب مودی):' : 'مبلغ قابل پرداخت:'}
              </span>{' '}
              <span className="font-bold text-sm text-emerald-800">{toPersianDigits(data.grandTotalRefundableFormatted)} ریال</span>
            </div>
            <div className={totalDiscoveredDebts > 0 ? "border-t border-black pt-1.5" : ""}>
              <span className="font-semibold text-gray-700">مبلغ به حروف:</span>{' '}
              <span className="font-bold">{data.grandTotalRefundableInWords}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-16 pl-12">
        <div className="text-center">
          <div className="font-bold text-sm font-titr">
            مدیر کل امور مالیاتی استان {data.province || 'خوزستان'}
          </div>
          <div className="font-bold text-base mt-3">{data.directorGeneralName || 'علی خورشیدی'}</div>
          <div className="text-xs text-gray-600 mt-2">مهر و امضاء</div>
        </div>
      </div>

      <div className="mt-16 text-xs text-gray-600 border-t border-dotted border-gray-400 pt-3">
        <div className="font-bold mb-1">رونوشت:</div>
        <div>۱- اداره کل امور مالیاتی استان {data.province || 'خوزستان'} - جهت استحضار</div>
        <div>۲- پرونده مالیاتی مودی در واحد مالیاتی {toPersianDigits(data.taxUnitCode)} - جهت ضبط در سوابق</div>
      </div>
    </PrintContainer>
  )
}
