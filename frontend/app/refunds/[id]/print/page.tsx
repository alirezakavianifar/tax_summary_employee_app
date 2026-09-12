'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { taxRefundApi } from '@/lib/api/taxRefund'
import type { PrintableDocument } from '@/types/taxRefund'
import { ChecklistPrint } from '@/components/refunds/print/ChecklistPrint'
import { TreasuryLetterPrint } from '@/components/refunds/print/TreasuryLetterPrint'
import { InquiryCircularPrint } from '@/components/refunds/print/InquiryCircularPrint'
import { JustificationReportPart1Print } from '@/components/refunds/print/JustificationReportPart1Print'
import { JustificationReportPart2Print } from '@/components/refunds/print/JustificationReportPart2Print'
import { StatutoryRefundVoucherPrint } from '@/components/refunds/print/StatutoryRefundVoucherPrint'
import { AuditorCommitmentPrint } from '@/components/refunds/print/AuditorCommitmentPrint'
import { TableAPrint } from '@/components/refunds/print/TableAPrint'
import { BatchRefundPackagePrint } from '@/components/refunds/print/BatchRefundPackagePrint'

type FormTab =
  | 'batch'
  | 'cheklist'
  | 'form1'
  | 'form2'
  | 'form3'
  | 'form4'
  | 'form5'
  | 'form6'
  | 'form7'

const FORMS_META: { key: FormTab; title: string; badge?: string }[] = [
  { key: 'batch', title: 'بسته کامل (۸ برگ)', badge: 'پیش‌فرض' },
  { key: 'cheklist', title: 'چک‌لیست اسناد' },
  { key: 'form1', title: 'نامه ذیحسابی (فرم ۱)' },
  { key: 'form2', title: 'استعلام حوزه‌ها (فرم ۲)' },
  { key: 'form3', title: 'گزارش توجیهی ۱ (فرم ۳)' },
  { key: 'form4', title: 'گزارش توجیهی ۲ (فرم ۴)' },
  { key: 'form5', title: 'برگ استرداد م. ۲۴۲ (فرم ۵)' },
  { key: 'form6', title: 'فرم تعهد (فرم ۶)' },
  { key: 'form7', title: 'جدول الف قبوض (فرم ۷)' },
]

export default function TaxRefundPrintPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = params?.id as string

  const initialTab = (searchParams.get('tab') as FormTab) || 'batch'
  const [activeTab, setActiveTab] = useState<FormTab>(initialTab)
  const [doc, setDoc] = useState<PrintableDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    loadDocument()
  }, [id])

  const loadDocument = async () => {
    try {
      setLoading(true)
      setError(null)
      // form5 view-model contains all data across the case aggregate
      const data = await taxRefundApi.getPrintableDocument(id, 'form5')
      setDoc(data)
    } catch (err: any) {
      console.error('Failed to load printable document:', err)
      setError(err?.response?.data?.error || err.message || 'خطا در دریافت اطلاعات چاپی پرونده استرداد')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold">در حال آماده‌سازی و قالب‌بندی اسناد استرداد...</p>
        </div>
      </div>
    )
  }

  if (error || !doc) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
            !
          </div>
          <h2 className="text-lg font-bold text-red-800 mb-2">خطا در بارگذاری مدارک</h2>
          <p className="text-gray-600 text-sm mb-6">{error || 'پرونده مورد نظر یافت نشد.'}</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={loadDocument}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 text-sm"
            >
              تلاش مجدد
            </button>
            <Link
              href={`/refunds/${id}`}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 text-sm"
            >
              بازگشت به پرونده
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-200 print:bg-white text-black font-vazirmatn">
      {/* Top Action Bar (Screen Only - Hidden in Print) */}
      <div className="no-print sticky top-0 z-30 bg-gray-900 text-white shadow-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/refunds/${id}`}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-semibold text-gray-300 transition-colors"
            >
              ← بازگشت به پرونده
            </Link>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                <span>پیش‌نمایش چاپ مدارک استرداد مالیات</span>
                <span className="font-mono text-xs px-2 py-0.5 bg-indigo-900/80 border border-indigo-500 rounded text-indigo-200">
                  {doc.caseTrackingNumber}
                </span>
              </h1>
              <p className="text-xs text-gray-400">
                مودی: {doc.taxpayerName} | مبلغ قابل استرداد: {doc.grandTotalRefundableFormatted} ریال
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow transition-all hover:shadow-indigo-500/25"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              <span>{activeTab === 'batch' ? 'چاپ بسته کامل (۸ برگ)' : 'چاپ این برگ'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation for All 8 Sheets + Full Package */}
        <div className="max-w-7xl mx-auto px-4 pb-2 pt-1 flex items-center gap-1 overflow-x-auto border-t border-gray-800 scrollbar-thin">
          {FORMS_META.map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-indigo-600 text-white font-bold shadow'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span>{tab.title}</span>
                {tab.badge && (
                  <span className="text-[10px] px-1 py-0.2 bg-indigo-900 text-indigo-200 rounded border border-indigo-400">
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Print Container Wrapper */}
      <main className="py-6 print:py-0 px-2 print:px-0">
        {activeTab === 'batch' && <BatchRefundPackagePrint data={doc} />}
        {activeTab === 'cheklist' && <ChecklistPrint data={doc} />}
        {activeTab === 'form1' && <TreasuryLetterPrint data={doc} />}
        {activeTab === 'form2' && <InquiryCircularPrint data={doc} />}
        {activeTab === 'form3' && <JustificationReportPart1Print data={doc} />}
        {activeTab === 'form4' && <JustificationReportPart2Print data={doc} />}
        {activeTab === 'form5' && <StatutoryRefundVoucherPrint data={doc} />}
        {activeTab === 'form6' && <AuditorCommitmentPrint data={doc} />}
        {activeTab === 'form7' && <TableAPrint data={doc} />}
      </main>
    </div>
  )
}
