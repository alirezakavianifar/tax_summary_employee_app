'use client'

import React from 'react'
import type { PrintableDocument } from '@/types/taxRefund'
import { getTodayJalaliString, toPersianDigits } from '@/lib/jalali'
import { PrintContainer, PrintHeader, SignatureBox } from './PrintContainer'
import { TaxRefundLetterType } from '@/types/taxRefund'

interface InquiryCircularPrintProps {
  data: PrintableDocument
}

export function InquiryCircularPrint({ data }: InquiryCircularPrintProps) {
  const fallbackDate = React.useMemo(() => getTodayJalaliString(), [])
  const departments = [
    { id: 1, name: 'امور مالیاتی ارث' },
    { id: 2, name: 'امور مالیاتی مشاغل' },
    { id: 3, name: 'امور مالیاتی شرکت‌ها و اشخاص حقوقی' },
    { id: 4, name: 'امور مالیاتی ارزش افزوده' },
    { id: 5, name: 'امور مالیاتی حقوق' },
  ]

  // Helper to find inquiry letter for this department type
  const getDebtInfo = (deptName: string) => {
    const letters = data.letters || []
    const letter = letters.find((l) => {
      if (deptName.includes('ارث') && Number(l.letterType) === Number(TaxRefundLetterType.EstateInquiry)) return true
      if (deptName.includes('مشاغل') && Number(l.letterType) === Number(TaxRefundLetterType.BusinessInquiry)) return true
      if (deptName.includes('ارزش افزوده') && Number(l.letterType) === Number(TaxRefundLetterType.VatInquiry)) return true
      return false
    })
    if (!letter || letter.debtAmount === 0) {
      return 'فاقد بدهی قطعی تا این تاریخ (گواهی اتوماسیون ضمیمه است)'
    }
    return `دارای مبلغ ${(letter.debtAmount || 0).toLocaleString('fa-IR')} ریال بدهی قطعی سنوات ${toPersianDigits(letter.debtYear || data.taxYear)}`
  }

  return (
    <PrintContainer>
      <PrintHeader
        formTitle="استعلام وضعیت بدهی از حوزه‌های مختلف مالیاتی"
        subtitle="جهت احراز بدهی‌های احتمالی و تهاتر با مبلغ استردادی"
        docNumber={data.caseTrackingNumber}
        docDate={data.justificationReportDate || fallbackDate}
        docketNumber={data.docketNumber}
        province={data.province}
        city={data.city}
        taxUnitCode={data.taxUnitCode}
      />

      <div className="my-4 text-xs leading-6 text-justify font-nazanin">
        <div className="font-bold text-sm mb-2 font-titr">
          به: کلیه واحدهای تابعه اداره امور مالیاتی شهرستان {data.city || 'اهواز'}
        </div>

        <p className="indent-6 mb-4">
          با سلام؛ احتراماً، نظر به اینکه مودی <span className="font-bold">{data.taxpayerName}</span> به شماره اقتصادی{' '}
          <span className="font-bold">{toPersianDigits(data.economicCode)}</span>
          {data.nationalId && <span> و شناسه ملی {toPersianDigits(data.nationalId)}</span>} به نشانی {data.address || 'نشانی قانونی ثبت شده'} در
          واحد مالیاتی <span className="font-bold">{toPersianDigits(data.taxUnitCode)}</span> درخواست استرداد اضافه پرداختی
          مالیات بر <span className="font-bold">{data.taxSourceName}</span> سال عملکرد{' '}
          <span className="font-bold">{toPersianDigits(data.taxYear)}</span> را نموده است، خواهشمند است دستور فرمایید ضمن
          بررسی دقیق سوابق نامبرده در سیستم اتوماسیون و پرونده‌های فیزیکی آن حوزه مالیاتی، مراتب وجود بدهی قطعی و یا
          عدم بدهکاری مشارالیه را جهت اعمال در محاسبات استرداد در ذیل همین برگ کتباً اعلام و اعاده فرمایید.
        </p>

        {/* 5 Inquiry Department Clearance Boxes */}
        <div className="space-y-3">
          {departments.map((d) => (
            <div key={d.id} className="border border-black p-2.5 bg-gray-50/20 text-xs">
              <div className="flex justify-between items-center font-bold mb-1.5 border-b border-gray-300 pb-1">
                <span>
                  {toPersianDigits(d.id)}- {d.name}
                </span>
                <span className="text-[11px] font-normal text-gray-600">پاسخ استعلام:</span>
              </div>
              <div className="min-h-[42px] flex items-center justify-between text-xs px-2">
                <div>
                  <span className="font-semibold text-gray-800">وضعیت سوابق: </span>
                  <span className="text-gray-900">{getDebtInfo(d.name)}</span>
                </div>
                <div className="text-[11px] text-gray-500">امضاء و مهر مسئول واحد / تاریخ</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex justify-between items-end">
        <div className="text-[11px] text-gray-500">
          * کلیه استعلام‌ها باید ممهور به مهر برجسته یا رسمی واحد مربوطه و با امضای کارشناس ارشد باشد.
        </div>
        <div className="w-64">
          <SignatureBox
            title={`کارشناس ارشد مالیاتی واحد ${data.taxUnitCode}`}
            name={data.seniorAuditorName}
            date={data.justificationReportDate || fallbackDate}
          />
        </div>
      </div>
    </PrintContainer>
  )
}
