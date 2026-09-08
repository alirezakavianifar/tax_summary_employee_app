'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Sparkles,
  Save,
  CheckCircle2,
  FileText,
  AlertCircle,
  Loader2,
  Calendar,
  UserCheck,
  Building,
  Scale,
  Eye,
  Edit3,
  ShieldCheck,
  Printer,
  ChevronRight,
} from 'lucide-react'
import { taxRefundApi } from '@/lib/api/taxRefund'
import { JustificationReport, UpdateJustificationReportInput } from '@/types/taxRefund'

interface JustificationReportEditorModalProps {
  caseId: string
  taxpayerName: string
  taxYear: number
  seniorAuditorName: string
  taxUnitCode: string
  city?: string
  isOpen: boolean
  onClose: () => void
  onSaved?: () => void
}

type TabType = 'narrative' | 'examination' | 'inquiries' | 'conclusion' | 'preview'

export function JustificationReportEditorModal({
  caseId,
  taxpayerName,
  taxYear,
  seniorAuditorName,
  taxUnitCode,
  city = 'اهواز',
  isOpen,
  onClose,
  onSaved,
}: JustificationReportEditorModalProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [autoDrafting, setAutoDrafting] = useState(false)
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('narrative')

  // Form Fields
  const [reportNumber, setReportNumber] = useState('')
  const [reportDateJalali, setReportDateJalali] = useState('')
  const [auditExaminationFindings, setAuditExaminationFindings] = useState('')
  const [legalGroundsAndReasoning, setLegalGroundsAndReasoning] = useState('')
  const [inquiriesAndDebtClearanceSummary, setInquiriesAndDebtClearanceSummary] = useState('')
  const [receiptsVerificationNotes, setReceiptsVerificationNotes] = useState('')
  const [auditorConclusion, setAuditorConclusion] = useState('')
  const [recommendedRefundAmount, setRecommendedRefundAmount] = useState<number>(0)
  const [groupHeadOpinionText, setGroupHeadOpinionText] = useState('')
  const [administrationHeadApprovalText, setAdministrationHeadApprovalText] = useState('')
  const [isFinalized, setIsFinalized] = useState(false)
  const [auditorSignatureDate, setAuditorSignatureDate] = useState('')

  const populateFromDto = (data: JustificationReport) => {
    setReportNumber(data.reportNumber || '')
    setReportDateJalali(data.reportDateJalali || '')
    setAuditExaminationFindings(data.auditExaminationFindings || '')
    setLegalGroundsAndReasoning(data.legalGroundsAndReasoning || '')
    setInquiriesAndDebtClearanceSummary(data.inquiriesAndDebtClearanceSummary || '')
    setReceiptsVerificationNotes(data.receiptsVerificationNotes || '')
    setAuditorConclusion(data.auditorConclusion || '')
    setRecommendedRefundAmount(data.recommendedRefundAmount || 0)
    setGroupHeadOpinionText(data.groupHeadOpinionText || '')
    setAdministrationHeadApprovalText(data.administrationHeadApprovalText || '')
    setIsFinalized(data.isFinalized || false)
    setAuditorSignatureDate(data.auditorSignatureDate || '')
  }

  const loadReport = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await taxRefundApi.getJustificationReport(caseId)
      populateFromDto(data)
    } catch (err: any) {
      setError(err.message || 'خطا در بارگذاری گزارش توجیهی')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && caseId) {
      loadReport()
    }
  }, [isOpen, caseId])

  const handleAutoDraft = async () => {
    try {
      setAutoDrafting(true)
      setError(null)
      const draft = await taxRefundApi.getDefaultJustificationReportDraft(caseId)
      populateFromDto(draft)
      setSuccessMsg('پیش‌نویس قانونی با اطلاعات پرونده با موفقیت تولید شد.')
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err: any) {
      setError(err.message || 'خطا در تولید خودکار پیش‌نویس')
    } finally {
      setAutoDrafting(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!reportNumber.trim()) {
      setError('لطفاً شماره رسمی گزارش توجیهی را وارد نمایید.')
      return
    }
    if (!reportDateJalali.trim()) {
      setError('لطفاً تاریخ گزارش را وارد نمایید.')
      return
    }

    try {
      setSaving(true)
      setError(null)
      const payload: UpdateJustificationReportInput = {
        reportNumber: reportNumber.trim(),
        reportDateJalali: reportDateJalali.trim(),
        auditExaminationFindings: auditExaminationFindings.trim(),
        legalGroundsAndReasoning: legalGroundsAndReasoning.trim(),
        inquiriesAndDebtClearanceSummary: inquiriesAndDebtClearanceSummary.trim(),
        receiptsVerificationNotes: receiptsVerificationNotes.trim(),
        auditorConclusion: auditorConclusion.trim(),
        recommendedRefundAmount: recommendedRefundAmount || 0,
        groupHeadOpinionText: groupHeadOpinionText.trim() || undefined,
        administrationHeadApprovalText: administrationHeadApprovalText.trim() || undefined,
      }

      const res = await taxRefundApi.saveJustificationReport(caseId, payload)
      populateFromDto(res)
      setSuccessMsg('پیش‌نویس گزارش توجیهی با موفقیت ذخیره گردید.')
      setTimeout(() => setSuccessMsg(null), 3500)
      onSaved?.()
    } catch (err: any) {
      setError(err.message || 'خطا در ذخیره‌سازی گزارش')
    } finally {
      setSaving(false)
    }
  }

  const handleFinalizeRequest = () => {
    if (!reportNumber.trim()) {
      setError('شماره گزارش برای ثبت نهایی الزامی است.')
      return
    }
    setError(null)
    setShowFinalizeConfirm(true)
  }

  const handleFinalizeConfirmed = async () => {
    setShowFinalizeConfirm(false)
    try {
      setFinalizing(true)
      setError(null)
      // Save any pending changes first
      await taxRefundApi.saveJustificationReport(caseId, {
        reportNumber: reportNumber.trim(),
        reportDateJalali: reportDateJalali.trim(),
        auditExaminationFindings: auditExaminationFindings.trim(),
        legalGroundsAndReasoning: legalGroundsAndReasoning.trim(),
        inquiriesAndDebtClearanceSummary: inquiriesAndDebtClearanceSummary.trim(),
        receiptsVerificationNotes: receiptsVerificationNotes.trim(),
        auditorConclusion: auditorConclusion.trim(),
        recommendedRefundAmount: recommendedRefundAmount || 0,
        groupHeadOpinionText: groupHeadOpinionText.trim() || undefined,
        administrationHeadApprovalText: administrationHeadApprovalText.trim() || undefined,
      })

      const res = await taxRefundApi.finalizeJustificationReport(caseId)
      populateFromDto(res)
      setSuccessMsg('گزارش توجیهی با موفقیت قطعی و تایید گردید و پرونده به رئیس گروه ارسال شد.')
      setTimeout(() => {
        setSuccessMsg(null)
        onSaved?.()
        onClose()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'خطا در تایید نهایی گزارش')
    } finally {
      setFinalizing(false)
    }
  }

  const formatRials = (val?: number) => (val ?? 0).toLocaleString('fa-IR')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Scale className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  تنظیم گزارش توجیهی استرداد مالیات (موضوع مواد ۲۴۲ و ۲۴۳ ق.م.م)
                </h2>
                {isFinalized ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    تایید و قطعی شده
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-200 border border-amber-400/30">
                    پیش‌نویس کارشناس ارشد
                  </span>
                )}
              </div>
              <p className="text-xs text-purple-200/80">
                مودی: <strong>{taxpayerName}</strong> | عملکرد: <strong>{taxYear}</strong> | واحد مالیاتی:{' '}
                <strong>{taxUnitCode} ({city})</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoDraft}
              disabled={autoDrafting || loading}
              className="px-3.5 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50"
              title="تولید خودکار پیش‌نویس با اطلاعات محاسبه شده و سوابق پرونده"
            >
              {autoDrafting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
              <span>تولید خودکار پیش‌نویس قانونی</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metadata Strip: Report Number & Date */}
        <div className="px-6 py-3.5 bg-gray-50 border-b border-gray-200 flex-shrink-0 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-gray-600 font-bold mb-1">شماره گزارش توجیهی:</label>
            <input
              type="text"
              value={reportNumber}
              onChange={(e) => setReportNumber(e.target.value)}
              placeholder="مثال: ۱۶۰۳۰۰/استرداد/۱۴۰۲"
              className="w-full px-3 py-1.5 border border-gray-300 rounded-xl bg-white font-mono text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-600 font-bold mb-1">تاریخ تنظیم گزارش:</label>
            <input
              type="text"
              value={reportDateJalali}
              onChange={(e) => setReportDateJalali(e.target.value)}
              placeholder="مثال: ۱۴۰۲/۰۸/۱۵"
              className="w-full px-3 py-1.5 border border-gray-300 rounded-xl bg-white font-mono text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-600 font-bold mb-1">کارشناس ارشد تنظیم‌کننده:</label>
            <div className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-800 font-bold">
              {seniorAuditorName || 'کارشناس ارشد مالیاتی'}
            </div>
          </div>

          <div>
            <label className="block text-gray-600 font-bold mb-1">مبلغ پیشنهادی استرداد (ریال):</label>
            <div className="px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-xl text-purple-950 font-black font-mono">
              {formatRials(recommendedRefundAmount)} ریال
            </div>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mx-6 mt-3 p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-6 border-b border-gray-200 flex items-center gap-2 bg-white flex-shrink-0 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('narrative')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'narrative'
                ? 'border-purple-700 text-purple-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            بند ۱ و ۲: سوابق و تقاضای مودی
          </button>

          <button
            onClick={() => setActiveTab('examination')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'examination'
                ? 'border-purple-700 text-purple-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            بند ۳: مبانی قانونی و قطعیت
          </button>

          <button
            onClick={() => setActiveTab('inquiries')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'inquiries'
                ? 'border-purple-700 text-purple-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            بند ۴: استعلامات و کسر بدهی‌ها
          </button>

          <button
            onClick={() => setActiveTab('conclusion')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'conclusion'
                ? 'border-purple-700 text-purple-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            بند ۵: جمع‌بندی و اصالت قبوض
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'preview'
                ? 'border-purple-700 text-purple-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            پیش‌نمایش گزارش کامل
          </button>
        </div>

        {/* Modal Body / Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-purple-700 mx-auto" />
              <p className="text-xs text-gray-500">در حال دریافت محتوای گزارش توجیهی...</p>
            </div>
          ) : (
            <>
              {/* Tab 1: Narrative & Taxpayer Petition */}
              {activeTab === 'narrative' && (
                <div className="space-y-4">
                  <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 text-xs text-purple-900 leading-6">
                    <strong className="block mb-1 font-bold">راهنمای بند ۱ و ۲:</strong>
                    در این قسمت شرح تقاضای کتبی مودی و نحوه تسلیم اظهارنامه مالیاتی عملکرد مربوطه قید می‌گردد. متن فوق
                    به‌عنوان مقدمه در «بخش اول گزارش توجیهی (فرم ۳)» درج می‌گردد.
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-2">
                      متن مشروح سوابق مودی، تقاضای استرداد و تسلیم اظهارنامه:
                    </label>
                    <textarea
                      rows={8}
                      value={auditExaminationFindings}
                      onChange={(e) => setAuditExaminationFindings(e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-2xl text-xs leading-6 text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 outline-none font-sans"
                      placeholder="متن بندهای ۱ و ۲ گزارش توجیهی..."
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Legal Grounds & Examination */}
              {activeTab === 'examination' && (
                <div className="space-y-4">
                  <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 text-xs text-indigo-900 leading-6">
                    <strong className="block mb-1 font-bold">راهنمای بند ۳:</strong>
                    استناد قانونی به ماده ۲۴۲ قانون مالیات‌های مستقیم، نحوه رسیدگی، مرحله قطعیت پرونده و شماره برگ قطعی
                    ابلاغ شده در این بخش تنظیم می‌شود.
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-2">
                      مبانی قانونی استرداد و استناد به مواد ۲۴۲ و ۲۴۳ ق.م.م:
                    </label>
                    <textarea
                      rows={6}
                      value={legalGroundsAndReasoning}
                      onChange={(e) => setLegalGroundsAndReasoning(e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-2xl text-xs leading-6 text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 outline-none font-sans"
                      placeholder="استناد به قوانین و مقررات استرداد..."
                    />
                  </div>
                </div>
              )}

              {/* Tab 3: Inquiries & Debt Clearance */}
              {activeTab === 'inquiries' && (
                <div className="space-y-4">
                  <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 text-xs text-emerald-900 leading-6">
                    <strong className="block mb-1 font-bold">راهنمای استعلامات عدم بدهی (بندهای الف، ب، ج):</strong>
                    شرح نتایج استعلامات واصله از واحدهای وصول و اجرا، مالیات حقوق و تکلیفی و مالیات بر ارزش افزوده در این
                    قسمت ثبت و در «بخش دوم گزارش (فرم ۴)» منعکس می‌گردد.
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-2">
                      شرح نتایج استعلامات بدهی‌های قطعی سنواتی مودی:
                    </label>
                    <textarea
                      rows={8}
                      value={inquiriesAndDebtClearanceSummary}
                      onChange={(e) => setInquiriesAndDebtClearanceSummary(e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-2xl text-xs leading-6 text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 outline-none font-sans"
                      placeholder="شرح بررسی استعلامات..."
                    />
                  </div>
                </div>
              )}

              {/* Tab 4: Receipts Verification & Conclusion */}
              {activeTab === 'conclusion' && (
                <div className="space-y-4">
                  <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-6">
                    <strong className="block mb-1 font-bold">راهنمای تایید اصالت و جمع‌بندی:</strong>
                    کارشناس ارشد در این قسمت صحت واریز قبوض جدول الف را تایید کرده و مبلغ نهایی قابل پرداخت به مودی را با
                    مسئولیت قانونی پیشنهاد می‌نماید.
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-2">
                      تایید اصالت قبوض پرداختی مودی (جدول الف) و عدم استرداد قبلی:
                    </label>
                    <textarea
                      rows={4}
                      value={receiptsVerificationNotes}
                      onChange={(e) => setReceiptsVerificationNotes(e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-2xl text-xs leading-6 text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 outline-none font-sans"
                      placeholder="تایید صحت قبوض پرداختی..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-2">
                      جمع‌بندی نهایی و اعلام مانده خالص قابل استرداد:
                    </label>
                    <textarea
                      rows={5}
                      value={auditorConclusion}
                      onChange={(e) => setAuditorConclusion(e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-2xl text-xs leading-6 text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 outline-none font-sans"
                      placeholder="جمع‌بندی کارشناس ارشد..."
                    />
                  </div>
                </div>
              )}

              {/* Tab 5: Complete Live Preview */}
              {activeTab === 'preview' && (
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-6 text-xs text-gray-900 leading-7 font-sans">
                  {/* Document Header Preview */}
                  <div className="border-b-2 border-black pb-4 text-center space-y-1.5">
                    <div className="font-bold text-gray-600">جمهوری اسلامی ایران - وزارت امور اقتصادی و دارایی</div>
                    <div className="font-black text-sm text-gray-900">سازمان امور مالیاتی کشور - اداره کل امور مالیاتی استان خوزستان</div>
                    <div className="font-black text-base text-purple-950 pt-1">
                      گزارش کارشناسی استرداد مالیات اضافه دریافتی (موضوع ماده ۲۴۲ ق.م.م)
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-gray-600 pt-2 font-mono">
                      <span>شماره گزارش: {reportNumber || '..........'}</span>
                      <span>تاریخ گزارش: {reportDateJalali || '..........'}</span>
                      <span>واحد مالیاتی: {taxUnitCode}</span>
                    </div>
                  </div>

                  {/* Section 1 */}
                  <div className="space-y-2">
                    <h4 className="font-black text-purple-950 border-r-4 border-purple-700 pr-2">
                      ۱. شرح سوابق پرونده و اظهارنامه مودی:
                    </h4>
                    <p className="whitespace-pre-line text-gray-800 bg-white p-3.5 rounded-xl border border-gray-200">
                      {auditExaminationFindings || 'هنوز متنی وارد نشده است.'}
                    </p>
                  </div>

                  {/* Section 2 */}
                  <div className="space-y-2">
                    <h4 className="font-black text-purple-950 border-r-4 border-purple-700 pr-2">
                      ۲. مبانی قانونی استرداد:
                    </h4>
                    <p className="whitespace-pre-line text-gray-800 bg-white p-3.5 rounded-xl border border-gray-200">
                      {legalGroundsAndReasoning || 'هنوز متنی وارد نشده است.'}
                    </p>
                  </div>

                  {/* Section 3 */}
                  <div className="space-y-2">
                    <h4 className="font-black text-purple-950 border-r-4 border-purple-700 pr-2">
                      ۳. نتایج استعلامات و کسر بدهی‌ها:
                    </h4>
                    <p className="whitespace-pre-line text-gray-800 bg-white p-3.5 rounded-xl border border-gray-200">
                      {inquiriesAndDebtClearanceSummary || 'هنوز متنی وارد نشده است.'}
                    </p>
                  </div>

                  {/* Section 4 */}
                  <div className="space-y-2">
                    <h4 className="font-black text-purple-950 border-r-4 border-purple-700 pr-2">
                      ۴. اصالت‌سنجی قبوض پرداختی و جمع‌بندی:
                    </h4>
                    <p className="whitespace-pre-line text-gray-800 bg-white p-3.5 rounded-xl border border-gray-200">
                      {receiptsVerificationNotes || ''}
                      {'\n\n'}
                      {auditorConclusion || 'هنوز متنی وارد نشده است.'}
                    </p>
                  </div>

                  {/* Signatures Preview */}
                  <div className="pt-4 grid grid-cols-3 gap-4 text-center border-t border-gray-300">
                    <div className="p-3 bg-white rounded-xl border border-gray-200">
                      <div className="font-bold text-gray-700 mb-1">کارشناس ارشد مالیاتی</div>
                      <div className="font-black text-gray-900">{seniorAuditorName}</div>
                      <div className="text-[10px] text-gray-400 font-mono mt-2">{reportDateJalali}</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-gray-200">
                      <div className="font-bold text-gray-700 mb-1">رئیس گروه مالیاتی</div>
                      <div className="text-gray-400 text-xs italic">در انتظار تایید</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-gray-200">
                      <div className="font-bold text-gray-700 mb-1">رئیس امور مالیاتی</div>
                      <div className="text-gray-400 text-xs italic">در انتظار صدور دستور</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col gap-3 flex-shrink-0">
          {/* In-app finalize confirmation strip */}
          {showFinalizeConfirm && (
            <div className="flex items-center justify-between gap-3 bg-purple-50 border border-purple-300 rounded-xl px-4 py-3 animate-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center gap-2 text-purple-900 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span>آیا از تایید و ثبت نهایی گزارش توجیهی اطمینان دارید؟ پرونده به رئیس گروه ارسال خواهد شد.</span>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => setShowFinalizeConfirm(false)}
                  className="px-3 py-1.5 text-xs border border-gray-300 text-gray-600 hover:bg-gray-100 rounded-lg font-bold transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={handleFinalizeConfirmed}
                  className="px-3 py-1.5 text-xs bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-bold flex items-center gap-1 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  بله، تایید می‌کنم
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-gray-500">
              {isFinalized ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  این گزارش نهایی شده است. با ویرایش و ذخیره، اطلاعات به‌روزرسانی خواهند شد.
                </span>
              ) : (
                <span>برای پیشبرد پرونده به مرحله تایید رئیس گروه، دکمه «تایید و ثبت نهایی» را بفشارید.</span>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl text-xs font-bold transition-colors"
              >
                بستن
              </button>

              <button
                onClick={handleSaveDraft}
                disabled={saving || finalizing}
                className="px-4 py-2 bg-white hover:bg-gray-50 border border-purple-300 text-purple-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>ذخیره پیش‌نویس</span>
              </button>

              <button
                onClick={handleFinalizeRequest}
                disabled={saving || finalizing || showFinalizeConfirm}
                className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors disabled:opacity-50"
              >
                {finalizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>تایید و ثبت نهایی گزارش (ارسال به رئیس گروه)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
