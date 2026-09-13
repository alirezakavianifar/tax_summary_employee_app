'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Scale,
  ChevronLeft,
  Building,
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  CheckCircle2,
  Clock,
  UserCheck,
  AlertCircle,
  Loader2,
  Layers,
  Receipt,
  Mail,
  ArrowRight,
  ShieldCheck,
  FileText,
  Edit3,
  RotateCcw,
} from 'lucide-react'
import { taxRefundApi } from '@/lib/api/taxRefund'
import {
  TaxRefundCase,
  TaxRefundDocument,
  RefundCaseStatus,
  RefundCaseStatusLabels,
  TaxRefundLetterTypeLabels,
  FinalizationMethodLabels,
  FinalityStageLabels,
} from '@/types/taxRefund'
import { DocumentsSection } from '@/components/refunds/DocumentsSection'
import { PdfViewerModal } from '@/components/refunds/PdfViewerModal'
import { JustificationReportSummaryCard } from '@/components/refunds/JustificationReportSummaryCard'
import { JustificationReportEditorModal } from '@/components/refunds/JustificationReportEditorModal'
import { WorkflowReturnModal } from '@/components/refunds/WorkflowReturnModal'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { decomposeTaxUnitCode, canUserVerifyStage } from '@/lib/taxHierarchy'

const PRINT_FORMS = [
  { id: 'cheklist', title: 'چک‌لیست کنترل اسناد استردادی' },
  { id: 'form1', title: 'فرم ۱: نامه به ذیحسابی جهت استرداد وجه' },
  { id: 'form2', title: 'فرم ۲: استعلام از حوزه‌های مختلف' },
  { id: 'form3', title: 'فرم ۳: گزارش استرداد اضافه مالیات (بخش اول)' },
  { id: 'form4', title: 'فرم ۴: ادامه گزارش استرداد و تاییدات ۳ امضا' },
  { id: 'form5', title: 'فرم ۵: برگ استرداد ماده ۲۴۲ قانون مالیات‌ها' },
  { id: 'form6', title: 'فرم ۶: فرم تعهد اداره امور مالیاتی (کارشناس ارشد)' },
  { id: 'form7', title: 'فرم ۷: جدول (الف) برگ استرداد موضوع ماده ۲۴۲' },
]

export default function TaxRefundDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const caseId = params.id as string

  const [refundCase, setRefundCase] = useState<TaxRefundCase | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transitionNotes, setTransitionNotes] = useState('')
  const [transitioning, setTransitioning] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [directViewingDoc, setDirectViewingDoc] = useState<TaxRefundDocument | null>(null)
  const [isReportEditorOpen, setIsReportEditorOpen] = useState(false)
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)

  const fetchCase = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await taxRefundApi.getCaseById(caseId)
      setRefundCase(data)
    } catch (err: any) {
      setError(err.message || 'خطا در دریافت اطلاعات پرونده')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (caseId) {
      fetchCase()
    }
  }, [caseId])

  const handleTransition = async (targetStatus: RefundCaseStatus) => {
    try {
      setTransitioning(true)
      await taxRefundApi.transitionStatus(caseId, {
        newStatus: targetStatus,
        notes: transitionNotes.trim() || undefined,
      })
      setTransitionNotes('')
      await fetchCase()
    } catch (err: any) {
      alert(err.message || 'خطا در تغییر وضعیت پرونده')
    } finally {
      setTransitioning(false)
    }
  }

  const handleReturnCase = async (targetStatus: RefundCaseStatus, reason: string) => {
    try {
      setTransitioning(true)
      await taxRefundApi.transitionStatus(caseId, {
        newStatus: targetStatus,
        notes: reason,
      })
      await fetchCase()
    } catch (err: any) {
      alert(err.message || 'خطا در عودت پرونده')
      throw err
    } finally {
      setTransitioning(false)
    }
  }

  const handleDownloadExcel = async () => {
    try {
      setDownloading(true)
      const blob = await taxRefundApi.exportExcel(caseId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tax_refund_${refundCase?.caseTrackingNumber || caseId}.xlsx`
      a.click()
    } catch (err: any) {
      alert(err.message || 'خطا در دانلود فایل اکسل')
    } finally {
      setDownloading(false)
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fa-IR').format(Math.round(num || 0))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6" dir="rtl">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-purple-700 mx-auto" />
          <p className="text-xs font-bold text-gray-700">در حال بارگذاری اطلاعات پرونده استرداد...</p>
        </div>
      </div>
    )
  }

  if (error || !refundCase) {
    return (
      <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
        <div className="max-w-xl mx-auto bg-white rounded-2xl p-8 text-center border border-red-200 shadow-sm space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-gray-900">پرونده مورد نظر یافت نشد</h2>
          <p className="text-xs text-gray-500">{error}</p>
          <Link
            href="/refunds"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-700 text-white rounded-xl text-xs font-bold"
          >
            بازگشت به کارپوشه استرداد
          </Link>
        </div>
      </div>
    )
  }

  const statusInfo = RefundCaseStatusLabels[refundCase.status] || {
    text: refundCase.statusDescription,
    color: 'bg-gray-100 text-gray-700 border-gray-300',
  }

  return (
    <ProtectedRoute requiredModule="module_tax_refund">
      <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Link href="/refunds" className="hover:text-purple-700">کارپوشه استرداد</Link>
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-bold font-mono">{refundCase.caseTrackingNumber}</span>
          </div>

          <div className="flex items-center gap-2">
            {refundCase.status !== RefundCaseStatus.AdministrationHeadApproved &&
              refundCase.status !== RefundCaseStatus.TreasuryDisbursed && (
                <Link
                  href={`/refunds/${refundCase.id}/edit`}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  ویرایش پرونده (۶ مرحله)
                </Link>
              )}
            {refundCase.status === RefundCaseStatus.AdministrationHeadApproved && (
              <button
                onClick={() => setIsReturnModalOpen(true)}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                عودت پرونده جهت ویرایش
              </button>
            )}
            <Link
              href={`/refunds/${refundCase.id}/print`}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              چاپ اسناد رسمی (A4)
            </Link>
            <button
              onClick={handleDownloadExcel}
              disabled={downloading}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              دانلود اکسل ۹ برگه‌ای (.xlsx)
            </button>
          </div>
        </div>

        {/* Case Header Card */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900">
                  {refundCase.taxpayerName}
                </h1>
                <span className={`text-xs px-3 py-1 rounded-full font-bold border ${statusInfo.color}`}>
                  {statusInfo.text}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 font-medium">
                <span>شماره پیگیری: <strong className="font-mono text-purple-900">{refundCase.caseTrackingNumber}</strong></span>
                <span>کد اقتصادی: <strong className="font-mono text-gray-800">{refundCase.economicCode}</strong></span>
                <span>سال مالیاتی: <strong className="font-mono text-gray-800">{refundCase.taxYear}</strong></span>
                <span>منبع: <strong className="text-gray-800">{refundCase.taxSourceDescription}</strong></span>
                <span>واحد مالیاتی: <strong className="font-mono text-gray-800">{refundCase.taxUnitCode} ({refundCase.city})</strong></span>
                <span>مرحله قطعیت: <strong className="text-purple-900 font-bold bg-purple-100/70 px-2 py-0.5 rounded-lg">{FinalityStageLabels[refundCase.assessmentInfo?.finalityStage] || refundCase.assessmentInfo?.finalityStageName || 'تمکین'}</strong></span>
                <span>نحوه رسیدگی: <strong className="text-gray-800">{FinalizationMethodLabels[refundCase.assessmentInfo?.finalizationMethod] || refundCase.assessmentInfo?.finalizationMethodName || 'علی‌الراس'}</strong></span>
              </div>

              {/* 3-Tier Hierarchy Organizational Indicator Card */}
              {(() => {
                const h = decomposeTaxUnitCode(refundCase.taxUnitCode)
                return (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold py-2 px-3 bg-purple-50/70 rounded-xl border border-purple-200/70">
                    <div className="flex items-center gap-1.5 text-purple-900 font-bold">
                      <Building className="w-3.5 h-3.5 text-purple-600" />
                      <span>تشکیلات سازمانی رسیدگی:</span>
                    </div>
                    <span className="bg-white px-2 py-1 rounded-lg border border-purple-200 text-purple-950 shadow-2xs">
                      سطح ۱ (اداره کل/امور): <strong>{refundCase.officeName || h.officeName}</strong> <span className="font-mono text-[11px] text-purple-700 bg-purple-50 px-1 rounded">({refundCase.officeCode || h.officeCode})</span>
                    </span>
                    <span className="text-gray-400">←</span>
                    <span className="bg-white px-2 py-1 rounded-lg border border-indigo-200 text-indigo-950 shadow-2xs">
                      سطح ۲ (رئیس گروه): <strong>{refundCase.groupHeadName ? `${refundCase.groupHeadName} (${h.groupName})` : h.groupName}</strong> <span className="font-mono text-[11px] text-indigo-700 bg-indigo-50 px-1 rounded">({refundCase.groupCode || h.groupCode})</span>
                    </span>
                    <span className="text-gray-400">←</span>
                    <span className="bg-white px-2 py-1 rounded-lg border border-blue-200 text-blue-950 shadow-2xs">
                      سطح ۳ (کارشناس ارشد): <strong>{refundCase.seniorAuditorName ? `${refundCase.seniorAuditorName} (${h.unitName})` : h.unitName}</strong> <span className="font-mono text-[11px] text-blue-700 bg-blue-50 px-1 rounded">({refundCase.taxUnitCode})</span>
                    </span>
                  </div>
                )
              })()}
            </div>

            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 text-left md:text-right">
              <div className="text-[11px] text-purple-700 font-bold mb-0.5">مبلغ کل قابل استرداد:</div>
              <div className="text-2xl font-black text-purple-950">
                {formatNumber(refundCase.breakdown.principalTaxRefund + refundCase.breakdown.delayDamages)} <span className="text-xs font-bold text-purple-700">ریال</span>
              </div>
              <div className="text-[11px] text-gray-500 mt-1">
                شماره شبا: <span className="font-mono font-bold text-gray-800">{refundCase.shebaNumber}</span> ({refundCase.bankName})
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 bg-gray-50 rounded-xl">
              <span className="text-gray-500 block mb-1">جمع پرداختی قبوض:</span>
              <span className="font-black text-gray-900 text-sm">
                {formatNumber(refundCase.receipts.reduce((s, r) => s + r.amountRials, 0))} ریال
              </span>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-xl">
              <span className="text-gray-500 block mb-1">مالیات تشخیصی قطعی:</span>
              <span className="font-black text-gray-900 text-sm">
                {formatNumber(refundCase.assessmentInfo.assessedTax)} ریال
              </span>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-xl">
              <span className="text-gray-500 block mb-1">خالص اصل استرداد:</span>
              <span className="font-black text-purple-900 text-sm">
                {formatNumber(refundCase.breakdown.principalTaxRefund)} ریال
              </span>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-xl">
              <span className="text-gray-500 block mb-1">خسارت تاخیر ماده ۲۴۳:</span>
              <span className="font-black text-amber-900 text-sm">
                {formatNumber(refundCase.breakdown.delayDamages)} ریال
              </span>
            </div>
          </div>
        </div>

        {/* Print Forms Bar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <h3 className="font-bold text-xs sm:text-sm text-gray-900 flex items-center gap-2">
              <Printer className="w-4 h-4 text-purple-700" />
              فرم‌های چاپی استاندارد (فرم‌های ۸گانه قانونی)
            </h3>
            <span className="text-[11px] text-gray-500">منطبق بر الگوی رسمی سازمان امور مالیاتی</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <Link
              href={`/refunds/${caseId}/print?tab=batch`}
              className="p-3 text-right bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-200 rounded-xl text-xs font-black text-indigo-950 transition-colors flex items-center justify-between group col-span-1 sm:col-span-2 lg:col-span-4"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                <span>چاپ بسته کامل مدارک استرداد (شامل کلیه فرم‌های ۸گانه قانونی بصورت مرتب‌شده A4)</span>
              </div>
              <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-[11px] font-bold group-hover:bg-indigo-700 flex items-center gap-1">
                <Printer className="w-3.5 h-3.5" />
                مشاهده و چاپ یکجا
              </span>
            </Link>

            {PRINT_FORMS.map((form) => (
              <Link
                key={form.id}
                href={`/refunds/${caseId}/print?tab=${form.id}`}
                className="p-3 text-right bg-gray-50 hover:bg-purple-50 hover:border-purple-300 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 transition-colors flex items-center justify-between group"
              >
                <span className="line-clamp-1">{form.title}</span>
                <Printer className="w-4 h-4 text-gray-400 group-hover:text-purple-700 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Supporting Documents (PDF) Repository */}
        <DocumentsSection refundCase={refundCase} onRefresh={fetchCase} />

        {/* Schedules Tables (Table A & Table B) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Table A */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-xs text-gray-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-purple-700" />
                <span>جدول (الف): قبوض پرداختی مودی ({refundCase.receipts.length} فقره)</span>
              </div>
              <span className="text-[11px] text-gray-500">
                جمع: {formatNumber(refundCase.receipts.reduce((s, r) => s + r.amountRials, 0))} ریال
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-gray-100/50 text-gray-600 font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-2.5">ردیف</th>
                    <th className="p-2.5">شماره قبض</th>
                    <th className="p-2.5 text-center">تاریخ صدور</th>
                    <th className="p-2.5">مبلغ (ریال)</th>
                    <th className="p-2.5 text-center">پیوست</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {refundCase.receipts.map((r) => {
                    const linkedDoc = refundCase.documents?.find((d) => d.relatedReceiptId === r.id)
                    return (
                      <tr key={r.id}>
                        <td className="p-2.5 font-bold text-gray-500">{r.rowIndex}</td>
                        <td className="p-2.5 font-mono font-bold text-gray-900">{r.receiptNumber}</td>
                        <td className="p-2.5 text-center font-mono text-gray-600">{r.issueDateJalali}</td>
                        <td className="p-2.5 font-bold text-purple-900">{formatNumber(r.amountRials)}</td>
                        <td className="p-2.5 text-center">
                          {linkedDoc ? (
                            <button
                              onClick={() => setDirectViewingDoc(linkedDoc)}
                              className="px-2 py-0.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 transition-colors"
                              title={`مشاهده فایل: ${linkedDoc.title}`}
                            >
                              <FileText className="w-3 h-3" />
                              <span>PDF</span>
                            </button>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table B */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-xs text-gray-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-700" />
              جدول (ب): قبوض تخصیص یافته جهت استرداد ({refundCase.allocations.length} فقره)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-gray-100/50 text-gray-600 font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-2.5">شماره قبض</th>
                    <th className="p-2.5">کل مبلغ قبض</th>
                    <th className="p-2.5">مبلغ استردادی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {refundCase.allocations.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-gray-400">
                        تخصیصی ثبت نشده است.
                      </td>
                    </tr>
                  ) : (
                    refundCase.allocations.map((a) => (
                      <tr key={a.id}>
                        <td className="p-2.5 font-mono font-bold text-gray-900">{a.receiptNumber}</td>
                        <td className="p-2.5 text-gray-700">{formatNumber(a.totalReceiptAmount)}</td>
                        <td className="p-2.5 font-black text-indigo-700">{formatNumber(a.refundableAmount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Auditor Justification Report Section */}
        <JustificationReportSummaryCard
          refundCase={refundCase}
          onOpenEditor={() => setIsReportEditorOpen(true)}
        />

        {/* Workflow Status Transitions & Audit History Panel */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <ShieldCheck className="w-5 h-5 text-purple-700" />
            گردش‌کار تاییدات سازمانی (سازمان امور مالیاتی)
          </h3>

          {/* Action Box */}
          <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-2xl space-y-3">
            <div className="text-xs font-bold text-purple-900">اقدام گردش کار برای وضعیت فعلی:</div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-3">
                <input
                  type="text"
                  value={transitionNotes}
                  onChange={(e) => setTransitionNotes(e.target.value)}
                  placeholder="یادداشت یا توضیحات اقدام..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white"
                />
              </div>

              <div>
                {refundCase.status === RefundCaseStatus.Draft && (() => {
                  const canAudit = canUserVerifyStage(user?.role, user?.assignedOffices, user?.employee?.serviceUnit, RefundCaseStatus.Audited, refundCase.taxUnitCode)
                  return (
                    <div className="space-y-2">
                      <button
                        onClick={() => handleTransition(RefundCaseStatus.Audited)}
                        disabled={transitioning || !canAudit}
                        className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                      >
                        تایید کارشناس ارشد (Audited)
                      </button>
                      {!canAudit && (
                        <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 text-center">
                          تایید این مرحله منحصراً در صلاحیت کارشناس ارشد مالیاتی منتسب به این واحد/اداره می‌باشد.
                        </p>
                      )}
                    </div>
                  )
                })()}

                {refundCase.status === RefundCaseStatus.Audited && (() => {
                  const canGroupHeadApprove = canUserVerifyStage(user?.role, user?.assignedOffices, user?.employee?.serviceUnit, RefundCaseStatus.GroupHeadApproved, refundCase.taxUnitCode)
                  return (
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => handleTransition(RefundCaseStatus.GroupHeadApproved)}
                          disabled={transitioning || !canGroupHeadApprove}
                          className="flex-1 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          تایید رئیس گروه مالیاتی
                        </button>
                        <button
                          onClick={() => setIsReturnModalOpen(true)}
                          disabled={transitioning}
                          className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          عودت به پیش‌نویس
                        </button>
                      </div>
                      {!canGroupHeadApprove && (
                        <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 text-center">
                          تایید این مرحله نیازمند دسترسی رئیس گروه مالیاتی (سطح ۲) حوزه انتسابی می‌باشد.
                        </p>
                      )}
                    </div>
                  )
                })()}

                {refundCase.status === RefundCaseStatus.GroupHeadApproved && (() => {
                  const canOfficeHeadApprove = canUserVerifyStage(user?.role, user?.assignedOffices, user?.employee?.serviceUnit, RefundCaseStatus.AdministrationHeadApproved, refundCase.taxUnitCode)
                  return (
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => handleTransition(RefundCaseStatus.AdministrationHeadApproved)}
                          disabled={transitioning || !canOfficeHeadApprove}
                          className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          صدور دستور استرداد (رئیس امور)
                        </button>
                        <button
                          onClick={() => setIsReturnModalOpen(true)}
                          disabled={transitioning}
                          className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          عودت جهت اصلاح
                        </button>
                      </div>
                      {!canOfficeHeadApprove && (
                        <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 text-center">
                          صدور دستور نهایی استرداد منحصراً بر عهده رئیس اداره/امور مالیاتی (سطح ۱) یا مدیر سامانه می‌باشد.
                        </p>
                      )}
                    </div>
                  )
                })()}

                {refundCase.status === RefundCaseStatus.AdministrationHeadApproved && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => handleTransition(RefundCaseStatus.TreasuryDisbursed)}
                      disabled={transitioning}
                      className="flex-1 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                    >
                      تایید پرداخت ذیحسابی
                    </button>
                    <button
                      onClick={() => setIsReturnModalOpen(true)}
                      disabled={transitioning}
                      className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      عودت جهت اصلاح
                    </button>
                  </div>
                )}

                {refundCase.status === RefundCaseStatus.TreasuryDisbursed && (
                  <span className="text-xs font-bold text-teal-800 py-2 block text-center">
                    پرونده با موفقیت پرداخت گردیده است.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Audit History Timeline */}
          {refundCase.approvals.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-gray-700">تاریخچه اقدامات ثبت شده:</h4>
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                {refundCase.approvals.map((act) => (
                  <div key={act.id} className="p-3 text-xs flex items-center justify-between bg-white">
                    <div>
                      <span className="font-bold text-gray-900">{act.actorName}</span>{' '}
                      <span className="text-gray-500">({act.actorRole}):</span>{' '}
                      <span className="text-gray-700">{act.notes || 'اقدام تایید انجام شد'}</span>
                    </div>
                    <span className="text-gray-400 font-mono text-[11px]">{act.actionDate}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Direct PDF Viewer Modal (when preview is clicked from Table A) */}
        <PdfViewerModal
          document={directViewingDoc}
          caseId={refundCase.id}
          isOpen={!!directViewingDoc}
          onClose={() => setDirectViewingDoc(null)}
        />

        {/* Auditor Justification Report Editor Modal */}
        <JustificationReportEditorModal
          caseId={refundCase.id}
          taxpayerName={refundCase.taxpayerName}
          taxYear={refundCase.taxYear}
          seniorAuditorName={refundCase.seniorAuditorName}
          taxUnitCode={refundCase.taxUnitCode}
          city={refundCase.city}
          isOpen={isReportEditorOpen}
          onClose={() => setIsReportEditorOpen(false)}
          onSaved={fetchCase}
        />

        {/* Workflow Return Modal */}
        <WorkflowReturnModal
          isOpen={isReturnModalOpen}
          caseTrackingNumber={refundCase.caseTrackingNumber}
          currentStatus={refundCase.status}
          onClose={() => setIsReturnModalOpen(false)}
          onConfirm={handleReturnCase}
        />
      </div>
    </div>
    </ProtectedRoute>
  )
}
