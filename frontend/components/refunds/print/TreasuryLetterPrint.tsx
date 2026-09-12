'use client'

import React from 'react'
import type { PrintableDocument } from '@/types/taxRefund'
import { getTodayJalaliString, toPersianDigits } from '@/lib/jalali'
import { PrintContainer, PrintHeader } from './PrintContainer'

interface TreasuryLetterPrintProps {
  data: PrintableDocument
}

export function TreasuryLetterPrint({ data }: TreasuryLetterPrintProps) {
  const fallbackDate = React.useMemo(() => getTodayJalaliString(), [])
  const docNumber = data.treasuryLetterNumber || data.caseTrackingNumber
  const voucherNumber = data.refundVoucherNumber || data.caseTrackingNumber
  const docDate = data.treasuryLetterDate || data.refundVoucherDate || fallbackDate
  const voucherDate = data.refundVoucherDate || data.treasuryLetterDate || fallbackDate

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
          {data.nationalId && <span> و شناسه ملی {toPersianDigits(data.nationalId)}</span>} به مبلغ{' '}
          <span className="font-bold text-base">{toPersianDigits(data.grandTotalRefundableFormatted)} ریال</span> (به حروف:{' '}
          <span className="font-bold">{data.grandTotalRefundableInWords}</span>) مربوط به مالیات بر{' '}
          <span className="font-bold">{data.taxSourceName}</span> سال عملکرد{' '}
          <span className="font-bold">{toPersianDigits(data.taxYear)}</span> ارسال می‌گردد.
        </p>

        <p className="indent-8 mb-6">
          مقتضی است دستور فرمایید ضمن بررسی مدارک ضمیمه و وفق موازین و مقررات قانونی، نسبت به استرداد وجه فوق‌الذکر
          اقدام و مبلغ <span className="font-bold">{toPersianDigits(data.grandTotalRefundableFormatted)} ریال</span> طبق درخواست کتبی مودی
          به حساب بانکی وی به شماره شبا{' '}
          <span className="font-bold text-base tracking-wider inline-block font-sans" dir="ltr">{data.shebaNumber}</span> نزد بانک{' '}
          <span className="font-bold">{data.bankName}</span> واریز و تصویر حواله پرداختی را جهت ضبط در پرونده مالیاتی به
          این اداره ارسال فرمایند.
        </p>

        <div className="border border-black p-4 bg-gray-50/50 rounded text-xs space-y-2 mb-8">
          <div className="font-bold text-sm border-b pb-1 font-titr">خلاصه مشخصات حساب بانکی ذینفع جهت استرداد:</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-semibold text-gray-700">نام صاحب حساب:</span> {data.taxpayerName}
            </div>
            <div>
              <span className="font-semibold text-gray-700">بانک عامل:</span> {data.bankName}
            </div>
            <div className="col-span-2">
              <span className="font-semibold text-gray-700">شماره شبا:</span>{' '}
              <span className="font-bold text-sm tracking-wider inline-block font-sans" dir="ltr">{data.shebaNumber}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">مبلغ قابل پرداخت:</span>{' '}
              <span className="font-bold">{toPersianDigits(data.grandTotalRefundableFormatted)} ریال</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">مبلغ به حروف:</span>{' '}
              <span className="font-bold">{data.grandTotalRefundableInWords}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-16 pl-12">
        <div className="text-center">
          <div className="font-bold text-sm font-titr">
            رئیس امور مالیاتی شهرستان {data.city || 'اهواز'}
          </div>
          <div className="font-bold text-base mt-3">{data.administrationHeadName}</div>
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
