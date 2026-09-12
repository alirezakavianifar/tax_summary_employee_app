'use client'

import React from 'react'
import type { PrintableDocument } from '@/types/taxRefund'
import { getTodayJalaliString, toPersianDigits } from '@/lib/jalali'
import { PrintContainer, PrintHeader, SignatureBox } from './PrintContainer'

interface AuditorCommitmentPrintProps {
  data: PrintableDocument
}

export function AuditorCommitmentPrint({ data }: AuditorCommitmentPrintProps) {
  const fallbackDate = React.useMemo(() => getTodayJalaliString(), [])
  const docNumber = data.officeCommitmentNumber || data.caseTrackingNumber
  const docDate = data.officeCommitmentDate || data.refundVoucherDate || fallbackDate
  const voucherNumber = data.refundVoucherNumber || data.caseTrackingNumber

  return (
    <PrintContainer>
      <PrintHeader
        formTitle="فرم تعهد کارشناس و اداره امور مالیاتی"
        subtitle="تعهد قانونی عدم استرداد قبلی قبوض مالیاتی"
        docNumber={docNumber}
        docDate={docDate}
        docketNumber={data.docketNumber}
        province={data.province}
        city={data.city}
        taxUnitCode={data.taxUnitCode}
      />

      <div className="my-10 text-sm leading-9 text-justify px-4 font-nazanin">
        <p className="indent-10 mb-8 border border-black p-6 bg-gray-50/20 rounded">
          اینجانب <span className="font-bold text-base">{data.seniorAuditorName}</span> کارشناس ارشد مالیاتی اداره امور
          مالیاتی <span className="font-bold">{toPersianDigits(data.taxUnitCode)}</span> شهرستان{' '}
          <span className="font-bold">{data.city || 'اهواز'}</span>، بدینوسیله به عنوان مسئول رسیدگی به پرونده استرداد
          مالیاتی متعهد می‌گردم که قبوض مالیاتی به شرح جدول الف (ضمیمه) مربوط به عملکرد سال{' '}
          <span className="font-bold">{toPersianDigits(data.taxYear)}</span> مودی{' '}
          <span className="font-bold">{data.taxpayerName}</span> به شماره اقتصادی{' '}
          <span className="font-bold">{toPersianDigits(data.economicCode)}</span> قبلاً در هیچ پرونده دیگری لحاظ یا مسترد نشده
          است و صحت و اصالت کلیه قبوض و عدم استفاده مکرر از آن‌ها را بررسی و تایید نموده‌ام؛ و چنانچه قبوض مذکور در
          سال‌های یاد شده از سوی اینجانب مورد سوء استفاده یا قصور اداری قرار گیرد و از این جهت هرگونه ضرر و زیانی متوجه
          دولت و بیت‌المال گردد، شخصاً مسئول بوده و متعهد به جبران کلیه خسارات وارده بر اساس قوانین و مقررات موضوعه
          می‌باشم.
        </p>

        <div className="text-xs text-gray-700 mb-8 space-y-1">
          <div>
            * این تعهدنامه به عنوان ضمیمه لاینفک برگ استرداد شماره{' '}
            <span className="font-bold">{voucherNumber ? toPersianDigits(voucherNumber) : '..........'}</span> در پرونده مالیاتی
            ضبط می‌گردد.
          </div>
          <div>
            * هرگونه دخل و تصرف یا ارائه گزارش خلاف واقع مشمول مقررات قانون رسیدگی به تخلفات اداری و قانون مجازات
            اسلامی خواهد بود.
          </div>
        </div>
      </div>

      {/* 3-Tier Signatures */}
      <div className="grid grid-cols-3 gap-4 mt-16 font-nazanin">
        <SignatureBox
          title={`کارشناس ارشد مالیاتی واحد ${toPersianDigits(data.taxUnitCode)}`}
          name={data.seniorAuditorName}
          date={data.justificationReportDate}
        />
        <SignatureBox
          title={`رئیس گروه مالیاتی شهرستان ${data.city || 'اهواز'}`}
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
