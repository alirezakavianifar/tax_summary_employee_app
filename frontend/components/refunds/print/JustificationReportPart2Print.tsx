'use client'

import React from 'react'
import type { PrintableDocument } from '@/types/taxRefund'
import { PrintContainer, PrintHeader, SignatureBox } from './PrintContainer'

interface JustificationReportPart2PrintProps {
  data: PrintableDocument
}

export function JustificationReportPart2Print({ data }: JustificationReportPart2PrintProps) {
  const formatRials = (val?: number) => (val ?? 0).toLocaleString('fa-IR')

  return (
    <PrintContainer>
      <PrintHeader
        formTitle="گزارش استرداد اضافه مالیات (بخش دوم و تاییدات)"
        subtitle={`مودی: ${data.taxpayerName} | سال عملکرد: ${data.taxYear}`}
        docNumber={data.justificationReportNumber || data.caseTrackingNumber}
        docDate={data.justificationReportDate || data.refundVoucherDate}
        docketNumber={data.docketNumber}
        province={data.province}
        city={data.city}
        taxUnitCode={data.taxUnitCode}
      />

      <div className="text-xs leading-6 space-y-3 mb-4">
        <p className="font-semibold text-gray-900">
          با توجه به گزارش بخش اول، اضافه پرداختی مودی در عملکرد سال مورد گزارش بعد از بررسی استعلامات و کسر موارد زیر
          به وی قابل استرداد خواهد بود:
        </p>

        {/* Inquiries Items */}
        <div className="border border-black p-3 bg-gray-50/20 space-y-2">
          <div className="flex items-start gap-1">
            <span className="font-bold">الف-</span>
            <p>
              با توجه به استعلام شماره{' '}
              <span className="font-mono font-bold">
                {data.letters.find((l) => l.description?.includes('وصول'))?.letterNumber || '۱۲۳۵۴۶۵'}
              </span>{' '}
              مورخ{' '}
              <span className="font-mono font-bold">
                {data.letters.find((l) => l.description?.includes('وصول'))?.letterDateJalali || data.justificationReportDate}
              </span>{' '}
              از اداره وصول و اجرا، مودی مبلغ{' '}
              <span className="font-mono font-bold">
                {formatRials(data.letters.find((l) => l.description?.includes('وصول'))?.debtAmount || 0)}
              </span>{' '}
              ریال بابت مالیات و جرایم قطعی سنوات گذشته دارد.
            </p>
          </div>

          <div className="flex items-start gap-1">
            <span className="font-bold">ب-</span>
            <p>
              با توجه به استعلام شماره{' '}
              <span className="font-mono font-bold">
                {data.letters.find((l) => l.description?.includes('حقوق'))?.letterNumber || '۶۵۳۲۴۸۷'}
              </span>{' '}
              مورخ{' '}
              <span className="font-mono font-bold">
                {data.letters.find((l) => l.description?.includes('حقوق'))?.letterDateJalali || data.justificationReportDate}
              </span>{' '}
              از واحد مالیات بر درآمد حقوق و تکلیفی، مودی مبلغ{' '}
              <span className="font-mono font-bold">
                {formatRials(data.letters.find((l) => l.description?.includes('حقوق'))?.debtAmount || 0)}
              </span>{' '}
              ریال بابت مالیات تکلیفی و جرایم دارد.
            </p>
          </div>

          <div className="flex items-start gap-1">
            <span className="font-bold">ج-</span>
            <p>
              با توجه به استعلام شماره{' '}
              <span className="font-mono font-bold">
                {data.letters.find((l) => l.description?.includes('ارزش افزوده'))?.letterNumber || '۷۴۵۲۱۹۰'}
              </span>{' '}
              مورخ{' '}
              <span className="font-mono font-bold">
                {data.letters.find((l) => l.description?.includes('ارزش افزوده'))?.letterDateJalali || data.justificationReportDate}
              </span>{' '}
              از واحد مالیات بر ارزش افزوده، مودی مبلغ{' '}
              <span className="font-mono font-bold">
                {formatRials(data.letters.find((l) => l.description?.includes('ارزش افزوده'))?.debtAmount || 0)}
              </span>{' '}
              ریال بابت عوارض و ارزش افزوده سنوات گذشته دارد.
            </p>
          </div>
        </div>

        {/* Net Confirmation */}
        <div className="border-2 border-indigo-900 p-2.5 bg-indigo-50/20 text-xs font-semibold leading-6">
          پرداخت مانده اضافه پرداختی قابل استرداد به مودی پس از کسر بدهی‌های موضوع بندهای الف، ب و ج فوق به مبلغ{' '}
          <span className="font-black text-sm text-indigo-950 font-mono">
            {formatRials(data.calculation.principalTaxRefund)} ریال
          </span>{' '}
          (به حروف: {data.grandTotalRefundableInWords}) مورد تایید این واحد مالیاتی است. مراتب جهت استحضار و اظهار نظر
          رئیس محترم گروه مالیاتی اعلام می‌گردد.
        </div>
      </div>

      {/* Tier 1 Signature */}
      <div className="flex justify-end mb-4">
        <div className="w-56">
          <SignatureBox
            title="کارشناس ارشد مالیاتی"
            name={data.seniorAuditorName}
            date={data.justificationReportDate}
          />
        </div>
      </div>

      {/* Tier 2: Group Head Opinion */}
      <div className="border border-black p-3 mb-4 bg-gray-50/20 text-xs">
        <div className="font-bold text-xs border-b border-black pb-1 mb-2">
          نظر رئیس گروه مالیاتی شهرستان {data.city || 'اهواز'}:
        </div>
        <p className="leading-6 mb-3">
          رئیس محترم امور مالیاتی شهرستان {data.city || 'اهواز'}؛
          <br />
          مضمون گزارش استرداد مالیات مربوط به عملکرد سال {data.taxYear} مودی {data.taxpayerName} تهیه شده توسط کارشناس
          ارشد واحد مالیاتی {data.taxUnitCode} با تعیین و تایید مبلغ{' '}
          <span className="font-bold font-mono">{formatRials(data.calculation.grossSurplus)} ریال</span> اضافه پرداختی
          قبل از کسر بدهی‌ها و مبلغ{' '}
          <span className="font-black font-mono text-indigo-900">
            {formatRials(data.calculation.principalTaxRefund)} ریال
          </span>{' '}
          مانده قابل استرداد پس از کسر بدهی‌های احتمالی، مورد تایید اینجانب است. جهت صدور دستور مقتضی مبنی بر تهیه برگ
          استرداد به حضور ایفاد می‌گردد.
        </p>
        <div className="flex justify-end">
          <div className="w-56">
            <SignatureBox
              title="رئیس گروه مالیاتی"
              name={data.groupHeadName}
              date={data.justificationReportDate}
            />
          </div>
        </div>
      </div>

      {/* Tier 3: Tax Administration Head Approval */}
      <div className="border border-black p-3 bg-gray-50/20 text-xs">
        <div className="font-bold text-xs border-b border-black pb-1 mb-2">
          نظر رئیس امور مالیاتی شهرستان {data.city || 'اهواز'}:
        </div>
        <p className="leading-6 mb-3">
          رئیس محترم گروه مالیاتی؛
          <br />
          گزارش استرداد مالیات اضافه دریافتی مربوط به عملکرد سال {data.taxYear} مودی {data.taxpayerName} با تعیین مبلغ{' '}
          <span className="font-bold font-mono">{formatRials(data.calculation.principalTaxRefund)} ریال</span> مانده
          اضافه دریافتی قطعی که می‌بایست وفق ماده ۲۴۲ قانون مالیات‌های مستقیم به مودی مسترد گردد، ملاحظه شد و مورد تایید
          است. دستور فرمایید برگ استرداد مالیاتی بر اساس موازین و مقررات تهیه و اقدام گردد.
        </p>
        <div className="flex justify-end">
          <div className="w-56">
            <SignatureBox
              title="رئیس امور مالیاتی"
              name={data.administrationHeadName}
              date={data.refundVoucherDate}
            />
          </div>
        </div>
      </div>
    </PrintContainer>
  )
}
