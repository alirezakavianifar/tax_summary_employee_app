'use client'

import React from 'react'
import type { PrintableDocument } from '@/types/taxRefund'
import { TaxRefundLetterType } from '@/types/taxRefund'
import { getTodayJalaliString, toPersianDigits } from '@/lib/jalali'
import { PrintContainer, PrintHeader, SignatureBox } from './PrintContainer'

interface JustificationReportPart2PrintProps {
  data: PrintableDocument
}

export function JustificationReportPart2Print({ data }: JustificationReportPart2PrintProps) {
  const fallbackDate = React.useMemo(() => getTodayJalaliString(), [])
  const formatRials = (val?: number) => (val ?? 0).toLocaleString('fa-IR')
  const docNumber = data.justificationReport?.reportNumber || data.justificationReportNumber || data.caseTrackingNumber
  const docDate = data.justificationReport?.reportDateJalali || data.justificationReportDate || data.refundVoucherDate || fallbackDate

  const letters = data.letters || []
  const collectionLetter = letters.find(
    (l) => Number(l.letterType) === Number(TaxRefundLetterType.CollectionAndEnforcementInquiry)
  ) || (data.letters || []).find((l) => {
    if (Number(l.letterType) === Number(TaxRefundLetterType.CollectionAndEnforcementInquiry)) return true
    if (String(l.letterType) === TaxRefundLetterType[TaxRefundLetterType.CollectionAndEnforcementInquiry] || String(l.letterType) === String(TaxRefundLetterType.CollectionAndEnforcementInquiry)) return true
    if (l.letterTypeName && l.letterTypeName.includes('وصول')) return true
    if (l.description && l.description.includes('وصول')) return true
    return false
  })

  const payrollLetter = letters.find(
    (l) => Number(l.letterType) === Number(TaxRefundLetterType.WithholdingTaxInquiry)
  ) || (data.letters || []).find((l) => {
    if (Number(l.letterType) === Number(TaxRefundLetterType.WithholdingTaxInquiry)) return true
    if (String(l.letterType) === TaxRefundLetterType[TaxRefundLetterType.WithholdingTaxInquiry] || String(l.letterType) === String(TaxRefundLetterType.WithholdingTaxInquiry)) return true
    if (l.letterTypeName && l.letterTypeName.includes('حقوق')) return true
    if (l.description && l.description.includes('حقوق')) return true
    return false
  })

  const vatLetter = letters.find(
    (l) => Number(l.letterType) === Number(TaxRefundLetterType.VatInquiry)
  ) || (data.letters || []).find((l) => {
    if (Number(l.letterType) === Number(TaxRefundLetterType.VatInquiry)) return true
    if (String(l.letterType) === TaxRefundLetterType[TaxRefundLetterType.VatInquiry] || String(l.letterType) === String(TaxRefundLetterType.VatInquiry)) return true
    if (l.letterTypeName && l.letterTypeName.includes('ارزش افزوده')) return true
    if (l.description && l.description.includes('ارزش افزوده')) return true
    return false
  })

  return (
    <PrintContainer>
      <PrintHeader
        formTitle="گزارش توجیهی استرداد اضافه پرداختی مالیات (بخش دوم)"
        subtitle="موضوع مواد ۲۴۲ و ۲۴۳ قانون مالیات‌های مستقیم"
        docNumber={docNumber}
        docDate={docDate}
        docketNumber={data.docketNumber}
        province={data.province}
        city={data.city}
        taxUnitCode={data.taxUnitCode}
      />

      <div className="text-xs leading-6 space-y-3 mb-4 font-nazanin">
        <p className="font-semibold text-gray-900">
          با توجه به گزارش بخش اول، اضافه پرداختی مودی در عملکرد سال مورد گزارش بعد از بررسی استعلامات و کسر موارد زیر
          به وی قابل استرداد خواهد بود:
        </p>

        {/* Inquiries Items */}
        {data.justificationReport?.inquiriesAndDebtClearanceSummary ? (
          <div className="border border-black p-3 bg-gray-50/20 text-xs leading-6">
            <p className="whitespace-pre-line text-justify">{data.justificationReport.inquiriesAndDebtClearanceSummary}</p>
          </div>
        ) : (
          <div className="border border-black p-3 bg-gray-50/20 space-y-2">
            <div className="flex items-start gap-1">
              <span className="font-bold">الف-</span>
              <p>
                با توجه به استعلام شماره{' '}
                <span className="font-bold">
                  {toPersianDigits(collectionLetter?.letterNumber || data.caseTrackingNumber)}
                </span>{' '}
                مورخ{' '}
                <span className="font-bold">
                  {toPersianDigits(collectionLetter?.letterDateJalali || docDate)}
                </span>{' '}
                از اداره وصول و اجرا،{' '}
                {(collectionLetter?.debtAmount || 0) > 0 ? (
                  <>
                    مودی مبلغ{' '}
                    <span className="font-bold">{formatRials(collectionLetter?.debtAmount)}</span>{' '}
                    ریال بابت مالیات و جرایم قطعی سنوات گذشته بدهی دارد که از مازاد پرداختی کسر می‌گردد.
                  </>
                ) : (
                  <span>مودی فاقد هرگونه بدهی قطعی سنوات گذشته در این واحد می‌باشد.</span>
                )}
              </p>
            </div>

            <div className="flex items-start gap-1">
              <span className="font-bold">ب-</span>
              <p>
                با توجه به استعلام شماره{' '}
                <span className="font-bold">
                  {toPersianDigits(payrollLetter?.letterNumber || data.caseTrackingNumber)}
                </span>{' '}
                مورخ{' '}
                <span className="font-bold">
                  {toPersianDigits(payrollLetter?.letterDateJalali || docDate)}
                </span>{' '}
                از واحد مالیات بر درآمد حقوق و تکلیفی،{' '}
                {(payrollLetter?.debtAmount || 0) > 0 ? (
                  <>
                    مودی مبلغ{' '}
                    <span className="font-bold">{formatRials(payrollLetter?.debtAmount)}</span>{' '}
                    ریال بابت مالیات تکلیفی و جرایم بدهی دارد که از مازاد پرداختی کسر می‌گردد.
                  </>
                ) : (
                  <span>مودی فاقد هرگونه بدهی قطعی مالیات تکلیفی و حقوق می‌باشد.</span>
                )}
              </p>
            </div>

            <div className="flex items-start gap-1">
              <span className="font-bold">ج-</span>
              <p>
                با توجه به استعلام شماره{' '}
                <span className="font-bold">
                  {toPersianDigits(vatLetter?.letterNumber || data.caseTrackingNumber)}
                </span>{' '}
                مورخ{' '}
                <span className="font-bold">
                  {toPersianDigits(vatLetter?.letterDateJalali || docDate)}
                </span>{' '}
                از واحد مالیات بر ارزش افزوده،{' '}
                {(vatLetter?.debtAmount || 0) > 0 ? (
                  <>
                    مودی مبلغ{' '}
                    <span className="font-bold">{formatRials(vatLetter?.debtAmount)}</span>{' '}
                    ریال بابت عوارض و ارزش افزوده سنوات گذشته بدهی دارد که از مازاد پرداختی کسر می‌گردد.
                  </>
                ) : (
                  <span>مودی فاقد هرگونه بدهی قطعی عوارض و ارزش افزوده سنوات گذشته می‌باشد.</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Net Confirmation / Auditor Conclusion */}
        {data.justificationReport?.auditorConclusion ? (
          <div className="border-2 border-indigo-900 p-2.5 bg-indigo-50/20 text-xs font-semibold leading-6">
            <p className="whitespace-pre-line text-justify">{data.justificationReport.auditorConclusion}</p>
          </div>
        ) : (
          <div className="border-2 border-indigo-900 p-2.5 bg-indigo-50/20 text-xs font-semibold leading-6">
            پرداخت مانده اضافه پرداختی قابل استرداد به مودی پس از کسر بدهی‌های موضوع بندهای الف، ب و ج فوق به مبلغ{' '}
            <span className="font-bold text-sm text-indigo-950">
              {formatRials(data.calculation.principalTaxRefund)} ریال
            </span>{' '}
            (به حروف: {data.grandTotalRefundableInWords}) مورد تایید این واحد مالیاتی است. مراتب جهت استحضار و اظهار نظر
            رئیس محترم گروه مالیاتی اعلام می‌گردد.
          </div>
        )}
      </div>

      {/* Tier 1 Signature */}
      <div className="flex justify-end mb-4">
        <div className="w-56">
          <SignatureBox
            title="کارشناس ارشد مالیاتی"
            name={data.seniorAuditorName}
            date={data.justificationReport?.auditorSignatureDate || data.justificationReport?.reportDateJalali || data.justificationReportDate}
          />
        </div>
      </div>

      {/* Tier 2: Group Head Opinion */}
      <div className="border border-black p-3 mb-4 bg-gray-50/20 text-xs font-nazanin">
        <div className="font-bold text-xs border-b border-black pb-1 mb-2 font-titr">
          نظر رئیس گروه مالیاتی شهرستان {data.city || 'اهواز'}:
        </div>
        <p className="leading-6 mb-3 text-justify">
          {data.justificationReport?.groupHeadOpinionText ? (
            <span className="whitespace-pre-line">{data.justificationReport.groupHeadOpinionText}</span>
          ) : (
            <>
              رئیس محترم امور مالیاتی شهرستان {data.city || 'اهواز'}؛
              <br />
              مضمون گزارش استرداد مالیات مربوط به عملکرد سال {toPersianDigits(data.taxYear)} مودی {data.taxpayerName} تهیه شده توسط کارشناس
              ارشد واحد مالیاتی {toPersianDigits(data.taxUnitCode)} با تعیین و تایید مبلغ{' '}
              <span className="font-bold">{formatRials(data.calculation.grossSurplus)} ریال</span> اضافه پرداختی
              قبل از کسر بدهی‌ها و مبلغ{' '}
              <span className="font-bold text-indigo-900">
                {formatRials(data.calculation.principalTaxRefund)} ریال
              </span>{' '}
              مانده قابل استرداد پس از کسر بدهی‌های احتمالی، مورد تایید اینجانب است. جهت صدور دستور مقتضی مبنی بر تهیه برگ
              استرداد به حضور ایفاد می‌گردد.
            </>
          )}
        </p>
        <div className="flex justify-end">
          <div className="w-56">
            <SignatureBox
              title="رئیس گروه مالیاتی"
              name={data.groupHeadName}
              date={data.justificationReport?.reportDateJalali || data.justificationReportDate || fallbackDate}
            />
          </div>
        </div>
      </div>

      {/* Tier 3: Tax Administration Head Approval */}
      <div className="border border-black p-3 bg-gray-50/20 text-xs">
        <div className="font-bold text-xs border-b border-black pb-1 mb-2">
          نظر رئیس امور مالیاتی شهرستان {data.city || 'اهواز'}:
        </div>
        <p className="leading-6 mb-3 text-justify">
          {data.justificationReport?.administrationHeadApprovalText ? (
            <span className="whitespace-pre-line">{data.justificationReport.administrationHeadApprovalText}</span>
          ) : (
            <>
              رئیس محترم گروه مالیاتی؛
              <br />
              گزارش استرداد مالیات اضافه دریافتی مربوط به عملکرد سال {data.taxYear} مودی {data.taxpayerName} با تعیین مبلغ{' '}
              <span className="font-bold font-mono">{formatRials(data.calculation.principalTaxRefund)} ریال</span> مانده
              اضافه دریافتی قطعی که می‌بایست وفق ماده ۲۴۲ قانون مالیات‌های مستقیم به مودی مسترد گردد، ملاحظه شد و مورد تایید
              است. دستور فرمایید برگ استرداد مالیاتی بر اساس موازین و مقررات تهیه و اقدام گردد.
            </>
          )}
        </p>
        <div className="flex justify-end">
          <div className="w-56">
            <SignatureBox
              title="رئیس امور مالیاتی"
              name={data.administrationHeadName}
              date={data.refundVoucherDate || fallbackDate}
            />
          </div>
        </div>
      </div>
    </PrintContainer>
  )
}
