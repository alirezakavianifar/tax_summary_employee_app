'use client'

import React from 'react'
import type { PrintableDocument } from '@/types/taxRefund'
import { PrintContainer, PrintHeader, SignatureBox } from './PrintContainer'

interface JustificationReportPart1PrintProps {
  data: PrintableDocument
}

export function JustificationReportPart1Print({ data }: JustificationReportPart1PrintProps) {
  const formatRials = (val?: number) => (val ?? 0).toLocaleString('fa-IR')

  return (
    <PrintContainer>
      <PrintHeader
        formTitle="گزارش استرداد اضافه مالیات (بخش اول)"
        subtitle={`مودی: ${data.taxpayerName} | عملکرد سال: ${data.taxYear}`}
        docNumber={data.justificationReportNumber || data.caseTrackingNumber}
        docDate={data.justificationReportDate || data.refundVoucherDate}
        docketNumber={data.docketNumber}
        province={data.province}
        city={data.city}
        taxUnitCode={data.taxUnitCode}
      />

      {/* Taxpayer Information Grid */}
      <div className="border border-black text-xs p-3 mb-4 bg-gray-50/30 grid grid-cols-2 gap-2">
        <div>
          <span className="font-bold text-gray-700">عنوان مودی: </span>
          <span className="font-bold text-black">{data.taxpayerName}</span>
        </div>
        <div>
          <span className="font-bold text-gray-700">شماره اقتصادی: </span>
          <span className="font-mono font-bold">{data.economicCode}</span>
        </div>
        <div>
          <span className="font-bold text-gray-700">عملکرد منتهی به سال: </span>
          <span className="font-mono font-bold">{data.taxYear}</span>
        </div>
        <div>
          <span className="font-bold text-gray-700">منبع مالیاتی: </span>
          <span>{data.taxSourceName}</span>
        </div>
        <div className="col-span-2">
          <span className="font-bold text-gray-700">نشانی قانونی شخص حقوقی / حقیقی: </span>
          <span>{data.address || 'اهواز، نشانی قانونی پرونده'}</span>
        </div>
      </div>

      {/* Audit Examination Narrative Steps */}
      <div className="text-xs leading-7 space-y-2 mb-4">
        <div className="flex items-start gap-1">
          <span className="font-bold">۱-</span>
          <p>
            مودی به موجب نامه وارده به شماره{' '}
            <span className="font-bold font-mono">{data.taxpayerRequestNumber || '..........'}</span> مورخ{' '}
            <span className="font-bold font-mono">{data.taxpayerRequestDate || '..........'}</span> که در دبیرخانه اداره
            امور مالیاتی به ثبت رسیده است، تقاضای استرداد اضافه پرداختی مالیات خود را مطرح نموده است.
          </p>
        </div>

        <div className="flex items-start gap-1">
          <span className="font-bold">۲-</span>
          <p>
            {data.assessment.hasReturnFiled ? (
              <>
                مودی اظهارنامه مالیاتی عملکرد مربوطه را تحت شماره{' '}
                <span className="font-bold font-mono">{data.assessment.returnNumber || '..........'}</span> مورخ{' '}
                <span className="font-bold font-mono">{data.assessment.returnDateJalali || '..........'}</span> در موعد
                قانونی تسلیم نموده است.
              </>
            ) : (
              <>مودی نسبت به تسلیم اظهارنامه در موعد مقرر اقدام ننموده است.</>
            )}
          </p>
        </div>

        <div className="flex items-start gap-1">
          <span className="font-bold">۳-</span>
          <p>
            پس از رسیدگی‌های انجام شده توسط این واحد مالیاتی و به موجب{' '}
            <span className="font-bold">«{data.assessment.finalizationMethod || 'رسیدگی به دفاتر قانونی'}»</span> مالیات
            عملکرد به شرح جدول زیر قطعی گردیده است.
          </p>
        </div>

        <div className="flex items-start gap-1">
          <span className="font-bold">۴-</span>
          <p>
            شماره برگ قطعی مالیاتی ابلاغ شده به مودی{' '}
            <span className="font-bold font-mono">{data.assessment.finalNoticeNumber || '..........'}</span> مورخ{' '}
            <span className="font-bold font-mono">{data.assessment.finalNoticeDateJalali || '..........'}</span> می‌باشد.
          </p>
        </div>
      </div>

      {/* Statutory Calculation Statement Table */}
      <div className="border border-black mb-6">
        <div className="bg-gray-100 border-b border-black font-bold text-xs py-1.5 px-3 text-center">
          صورت محاسبات مالیات قطعی و اضافه دریافتی (مبالغ به ریال)
        </div>
        <table className="w-full text-xs border-collapse">
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="py-1.5 px-3 text-right">درآمد تشخیصی قطعی قبل از کسر مالیات:</td>
              <td className="py-1.5 px-3 font-mono font-bold text-left w-48">
                {formatRials(data.calculation.assessedIncome)}
              </td>
            </tr>
            <tr className="bg-gray-50/40">
              <td className="py-1.5 px-3 text-right text-red-700">کسر می‌گردد: معافیت‌ها و بخشودگی‌های قانونی:</td>
              <td className="py-1.5 px-3 font-mono font-bold text-left text-red-700">
                ({formatRials(data.calculation.exemptions)})
              </td>
            </tr>
            <tr className="bg-gray-100/60 font-bold">
              <td className="py-1.5 px-3 text-right">مانده درآمد مشمول مالیات قطعی:</td>
              <td className="py-1.5 px-3 font-mono text-left">{formatRials(data.calculation.taxableBase)}</td>
            </tr>
            <tr>
              <td className="py-1.5 px-3 text-right">مالیات تشخیصی قطعی:</td>
              <td className="py-1.5 px-3 font-mono font-bold text-left">
                {formatRials(data.calculation.assessedTax)}
              </td>
            </tr>
            <tr className="bg-gray-50/40">
              <td className="py-1.5 px-3 text-right text-gray-700">اضافه می‌گردد: جرایم غیرقابل بخشش:</td>
              <td className="py-1.5 px-3 font-mono font-bold text-left">
                {formatRials(data.calculation.nonWaivablePenalties)}
              </td>
            </tr>
            <tr className="bg-gray-100/60 font-bold">
              <td className="py-1.5 px-3 text-right">جمع کل مالیات و جرایم متعلقه:</td>
              <td className="py-1.5 px-3 font-mono text-left">{formatRials(data.calculation.totalAssessedTax)}</td>
            </tr>
            <tr className="bg-gray-50/40">
              <td className="py-1.5 px-3 text-right text-green-700">کسر می‌گردد: جایزه خوش‌حسابی ماده ۱۹۰:</td>
              <td className="py-1.5 px-3 font-mono font-bold text-left text-green-700">
                ({formatRials(data.calculation.timelyPaymentBonus)})
              </td>
            </tr>
            <tr className="bg-indigo-50/30">
              <td className="py-1.5 px-3 text-right font-semibold text-indigo-900">
                کسر می‌گردد: کل مبالغ واریزی مودی به شرح جدول الف:
              </td>
              <td className="py-1.5 px-3 font-mono font-bold text-left text-indigo-900">
                ({formatRials(data.calculation.totalPaidAmount)})
              </td>
            </tr>
            <tr className="bg-amber-100/70 border-t-2 border-black font-black text-sm">
              <td className="py-2 px-3 text-right text-amber-950">
                مازاد پرداختی مودی (مبلغ بستانکاری اولیه):
              </td>
              <td className="py-2 px-3 font-mono text-left text-amber-950">
                {formatRials(data.calculation.grossSurplus)} ریال
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-8">
        <div className="w-64">
          <SignatureBox
            title={`کارشناس ارشد مالیاتی واحد ${data.taxUnitCode}`}
            name={data.seniorAuditorName}
            date={data.justificationReportDate}
          />
        </div>
      </div>
    </PrintContainer>
  )
}
