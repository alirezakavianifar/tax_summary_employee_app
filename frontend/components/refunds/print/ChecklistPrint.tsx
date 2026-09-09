'use client'

import React from 'react'
import type { PrintableDocument } from '@/types/taxRefund'
import { PrintContainer, PrintHeader, SignatureBox } from './PrintContainer'

interface ChecklistPrintProps {
  data: PrintableDocument
}

export function ChecklistPrint({ data }: ChecklistPrintProps) {
  const checklistItems = [
    {
      category: 'نامه استرداد',
      rowSpan: 2,
      id: '1',
      desc: 'ثبت شماره دبیرخانه و تاریخ مندرج در برگ استرداد در نامه مدیر کل (نامه استرداد)',
    },
    {
      category: 'نامه استرداد',
      rowSpan: 0,
      id: '2',
      desc: 'ثبت مبلغ بدهی مالیاتی (تکلیفی موضوع ماده ۱۰۴ ق.م.م، حقوق، مالیات و عوارض ارزش افزوده مودی در نامه مدیر کل و درج شماره حساب مربوطه)',
    },
    {
      category: 'برگ استرداد',
      rowSpan: 6,
      id: '3',
      desc: 'درج منبع مالیاتی در فرم استرداد مالیاتی (با توجه به منابع مندرج در قبوض مالیاتی)',
    },
    {
      category: 'برگ استرداد',
      rowSpan: 0,
      id: '4',
      desc: 'تعیین جمع مالیات پرداختی مودی در برگ استرداد مالیاتی (با توجه به فرم تسهیم و سهم هر شهرستان)',
    },
    {
      category: 'برگ استرداد',
      rowSpan: 0,
      id: '5',
      desc: 'درج قبوض مالیات پرداختی مودی که ریز آن در جدول (الف) می‌باشد، ثبت شماره و تاریخ گزارش استرداد و درج مبلغ به حروف در برگ استرداد',
    },
    {
      category: 'برگ استرداد',
      rowSpan: 0,
      id: '6',
      desc: 'عدم استفاده از لاک غلط‌گیر و مخدوش بودن سند استرداد',
    },
    {
      category: 'برگ استرداد',
      rowSpan: 0,
      id: '7',
      desc: 'درج جمع قبوض مالیات پرداختی مودی در برگ استرداد مالیاتی جدول (ب)',
    },
    {
      category: 'برگ استرداد',
      rowSpan: 0,
      id: '8',
      desc: 'مشخص کردن قبوض مالیاتی که جهت استرداد باطل می‌گردد در جدول (الف)',
    },
    {
      category: 'گزارش استرداد',
      rowSpan: 3,
      id: '9',
      desc: 'تعیین وضعیت بدهی مودی مالیاتی در قسمت وصول و اجرا؛ مهر و امضای کارشناس ارشد و الصاق گواهی اتوماسیون بدهی',
    },
    {
      category: 'گزارش استرداد',
      rowSpan: 0,
      id: '10',
      desc: 'درج سال عملکرد تحت رسیدگی در کلیه قسمت‌های فرم گزارش استرداد',
    },
    {
      category: 'گزارش استرداد',
      rowSpan: 0,
      id: '11',
      desc: 'تفکیک بدهی مالیات و عوارض ارزش افزوده (مشخص بودن میزان کسر هر آیتم از مبلغ استردادی در صورت داشتن بدهی مودی)',
    },
    {
      category: 'ضمائم و مدارک',
      rowSpan: 2,
      id: '12',
      desc: 'ضمیمه بودن اصل قبوض مالیات پرداختی در حد مورد نیاز جهت استرداد (در صورت مفقودی: تعهدنامه مسئولین و اقرارنامه ثبتی مودی)',
    },
    {
      category: 'ضمائم و مدارک',
      rowSpan: 0,
      id: '13',
      desc: 'نامه درخواست استرداد، تاییدیه شماره شبا بانکی به نام مودی (با مهر و امضای مجاز) و معرفی نماینده قانونی مودی',
    },
  ]

  return (
    <PrintContainer>
      <PrintHeader
        formTitle="چک لیست کنترل اسناد استردادی"
        subtitle={`مودی: ${data.taxpayerName} | سال عملکرد: ${data.taxYear}`}
        docNumber={data.caseTrackingNumber}
        docDate={data.refundVoucherDate}
        docketNumber={data.docketNumber}
        province={data.province}
        city={data.city}
        taxUnitCode={data.taxUnitCode}
      />

      <div className="text-xs text-gray-800 mb-2 font-bold font-nazanin">
        این چک‌لیست قبل از ارسال پرونده به اداره حسابداری و ذیحسابی توسط مسئولین ذیربط کنترل و تکمیل می‌گردد:
      </div>

      <table className="w-full text-xs border-collapse border border-black mb-4 font-nazanin">
        <thead>
          <tr className="bg-gray-100 text-black font-titr font-bold text-center text-xs">
            <th className="border border-black py-1.5 px-2 w-24">مرحله / بخش</th>
            <th className="border border-black py-1.5 px-1 w-10">ردیف</th>
            <th className="border border-black py-1.5 px-3 text-right">شرح اقدام کنترلی</th>
            <th className="border border-black py-1.5 px-1 w-14">رعایت</th>
            <th className="border border-black py-1.5 px-1 w-16">عدم رعایت</th>
          </tr>
        </thead>
        <tbody>
          {checklistItems.map((item, idx) => (
            <tr key={idx} className="hover:bg-gray-50/50">
              {item.rowSpan > 0 && (
                <td
                  rowSpan={item.rowSpan}
                  className="border border-black py-1 px-2 font-titr font-bold text-center bg-gray-50/30 align-middle text-[11px]"
                >
                  {item.category}
                </td>
              )}
              <td className="border border-black py-1 px-1 text-center font-bold text-sm">{item.id}</td>
              <td className="border border-black py-1 px-2 text-right leading-5 text-[11.5px]">{item.desc}</td>
              <td className="border border-black py-1 px-1 text-center font-bold text-base">✓</td>
              <td className="border border-black py-1 px-1 text-center text-gray-300">-</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="grid grid-cols-2 gap-6 mt-6">
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
