'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Building,
  Receipt,
  Mail,
  FileCheck,
  Layers,
  Check,
  Loader2,
  AlertCircle,
  Save,
  Scale,
  ArrowRight,
  RotateCcw,
} from 'lucide-react'
import { taxRefundApi } from '@/lib/api/taxRefund'
import {
  TaxRefundCase,
  TaxSourceType,
  TaxSourceLabels,
  FinalizationMethod,
  FinalizationMethodLabels,
  FinalityStage,
  FinalityStageLabels,
  CreateTaxRefundCaseInput,
  RefundCaseStatus,
} from '@/types/taxRefund'
import LiveCalculationCard from '@/components/refunds/LiveCalculationCard'
import ReceiptsTableEditor, { ReceiptItem } from '@/components/refunds/ReceiptsTableEditor'
import InquiriesEditor, { LetterItem } from '@/components/refunds/InquiriesEditor'
import TableBAllocationEditor, { AllocationItem } from '@/components/refunds/TableBAllocationEditor'
import { WorkflowReturnModal } from '@/components/refunds/WorkflowReturnModal'
import ProtectedRoute from '@/components/ProtectedRoute'

const WIZARD_STEPS = [
  { id: 1, title: 'مشخصات عمومی و مودی', icon: Building },
  { id: 2, title: 'قبوض پرداختی (جدول الف)', icon: Receipt },
  { id: 3, title: 'استعلامات عدم بدهی', icon: Mail },
  { id: 4, title: 'قطعی‌سازی پرونده', icon: FileCheck },
  { id: 5, title: 'تخصیص قبوض (جدول ب)', icon: Layers },
  { id: 6, title: 'بازبینی و ثبت نهایی', icon: CheckCircle2 },
]

export default function EditTaxRefundCasePage() {
  const params = useParams()
  const router = useRouter()
  const caseId = params.id as string

  const [loading, setLoading] = useState(true)
  const [initialError, setInitialError] = useState<string | null>(null)
  const [refundCase, setRefundCase] = useState<TaxRefundCase | null>(null)

  const [currentStep, setCurrentStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [stepError, setStepError] = useState<string | null>(null)
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)

  // Step 1: General & Taxpayer Info
  const [taxpayerName, setTaxpayerName] = useState('')
  const [economicCode, setEconomicCode] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [taxUnitCode, setTaxUnitCode] = useState('')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [bankName, setBankName] = useState('')
  const [shebaNumber, setShebaNumber] = useState('')
  const [taxYear, setTaxYear] = useState<number | ''>(1402)
  const [period, setPeriod] = useState<number>(1)
  const [taxSource, setTaxSource] = useState<TaxSourceType>(TaxSourceType.CorporateIncome)
  const [refundReason, setRefundReason] = useState('')
  const [docketNumber, setDocketNumber] = useState('')
  const [adminHeadName, setAdminHeadName] = useState('')
  const [groupHeadName, setGroupHeadName] = useState('')
  const [seniorAuditorName, setSeniorAuditorName] = useState('')

  // Step 2: Table A Receipts
  const [receipts, setReceipts] = useState<ReceiptItem[]>([])

  // Step 3: Inquiries & Letters
  const [petitionNumber, setPetitionNumber] = useState('')
  const [petitionDate, setPetitionDate] = useState('')
  const [letters, setLetters] = useState<LetterItem[]>([])

  // Step 4: Assessment & Finalization
  const [hasReturnFiled, setHasReturnFiled] = useState(true)
  const [returnNumber, setReturnNumber] = useState('')
  const [returnDateJalali, setReturnDateJalali] = useState('')
  const [finalizationMethod, setFinalizationMethod] = useState<FinalizationMethod>(FinalizationMethod.AliRas)
  const [finalityStage, setFinalityStage] = useState<FinalityStage>(FinalityStage.Tamkin)
  const [finalNoticeNumber, setFinalNoticeNumber] = useState('')
  const [finalNoticeDateJalali, setFinalNoticeDateJalali] = useState('')
  const [assessedIncomeStr, setAssessedIncomeStr] = useState('')
  const [exemptionsStr, setExemptionsStr] = useState('')
  const [assessedTaxStr, setAssessedTaxStr] = useState('')
  const [nonWaivablePenaltiesStr, setNonWaivablePenaltiesStr] = useState('')
  const [timelyPaymentBonusStr, setTimelyPaymentBonusStr] = useState('')

  // Step 5: Table B Allocations
  const [allocations, setAllocations] = useState<AllocationItem[]>([])

  // Step 6: Additional Items & Delay
  const [stampDutyStr, setStampDutyStr] = useState('')
  const [otherStr, setOtherStr] = useState('')
  const [penaltiesStr, setPenaltiesStr] = useState('')
  const [delayMonths, setDelayMonths] = useState<number>(0)

  const loadCase = async () => {
    try {
      setLoading(true)
      setInitialError(null)
      const data = await taxRefundApi.getCaseById(caseId)
      setRefundCase(data)

      // Populate Step 1
      setTaxpayerName(data.taxpayerName || '')
        setEconomicCode(data.economicCode || '')
        setNationalId(data.nationalId || '')
        setTaxUnitCode(data.taxUnitCode || '')
        setProvince(data.province || 'خوزستان')
        setCity(data.city || 'اهواز')
        setAddress(data.address || '')
        setBankName(data.bankName || '')
        setShebaNumber(data.shebaNumber || '')
        setTaxYear(data.taxYear || 1402)
        setPeriod(data.period || 1)
        setTaxSource(data.taxSource || TaxSourceType.CorporateIncome)
        setRefundReason(data.refundReason || '')
        setDocketNumber(data.docketNumber || '')
        setAdminHeadName(data.administrationHeadName || '')
        setGroupHeadName(data.groupHeadName || '')
        setSeniorAuditorName(data.seniorAuditorName || '')

        // Populate Step 2: Receipts
        if (data.receipts && data.receipts.length > 0) {
          setReceipts(
            data.receipts.map((r) => ({
              id: r.id,
              rowIndex: r.rowIndex,
              receiptNumber: r.receiptNumber,
              issueDateJalali: r.issueDateJalali,
              paymentDateJalali: r.paymentDateJalali,
              amountRials: r.amountRials,
              bankBranch: r.bankBranch || '',
              city: r.city || '',
              revenueLedgerRow: r.revenueLedgerRow || '',
            }))
          )
        }

        // Populate Step 3: Letters & Inquiries
        if (data.letters && data.letters.length > 0) {
          const petition = data.letters.find((l) => l.letterType === 1)
          if (petition) {
            setPetitionNumber(petition.letterNumber || '')
            setPetitionDate(petition.letterDateJalali || '')
          }

          const otherLetters = data.letters
            .filter((l) => l.letterType !== 1)
            .map((l) => ({
              id: l.id,
              letterType: l.letterType,
              letterNumber: l.letterNumber,
              letterDateJalali: l.letterDateJalali,
              debtAmount: l.debtAmount || 0,
              debtYear: l.debtYear || '',
              description: l.description || '',
            }))
          setLetters(otherLetters)
        }

        // Populate Step 4: Assessment
        if (data.assessmentInfo) {
          setHasReturnFiled(data.assessmentInfo.hasReturnFiled ?? true)
          setReturnNumber(data.assessmentInfo.returnNumber || '')
          setReturnDateJalali(data.assessmentInfo.returnDateJalali || '')
          setFinalizationMethod(data.assessmentInfo.finalizationMethod || FinalizationMethod.AliRas)
          setFinalityStage(data.assessmentInfo.finalityStage || FinalityStage.Tamkin)
          setFinalNoticeNumber(data.assessmentInfo.finalNoticeNumber || '')
          setFinalNoticeDateJalali(data.assessmentInfo.finalNoticeDateJalali || '')
          setAssessedIncomeStr(data.assessmentInfo.assessedIncome ? data.assessmentInfo.assessedIncome.toLocaleString('en-US') : '')
          setExemptionsStr(data.assessmentInfo.exemptions ? data.assessmentInfo.exemptions.toLocaleString('en-US') : '')
          setAssessedTaxStr(data.assessmentInfo.assessedTax ? data.assessmentInfo.assessedTax.toLocaleString('en-US') : '')
          setNonWaivablePenaltiesStr(data.assessmentInfo.nonWaivablePenalties ? data.assessmentInfo.nonWaivablePenalties.toLocaleString('en-US') : '')
          setTimelyPaymentBonusStr(data.assessmentInfo.timelyPaymentBonus ? data.assessmentInfo.timelyPaymentBonus.toLocaleString('en-US') : '')
        }

        // Populate Step 5: Allocations
        if (data.allocations && data.allocations.length > 0) {
          setAllocations(
            data.allocations.map((a) => ({
              id: a.id,
              taxRefundReceiptId: a.taxRefundReceiptId,
              receiptNumber: a.receiptNumber,
              totalReceiptAmount: a.totalReceiptAmount,
              refundableAmount: a.refundableAmount,
              bankBranch: a.bankBranch,
              city: a.city,
              revenueLedgerRow: a.revenueLedgerRow,
            }))
          )
        }

        // Populate Step 6: Breakdown
        if (data.breakdown) {
          setStampDutyStr(data.breakdown.stampDutyRefund ? data.breakdown.stampDutyRefund.toLocaleString('en-US') : '')
          setOtherStr(data.breakdown.otherRefund ? data.breakdown.otherRefund.toLocaleString('en-US') : '')
          setPenaltiesStr(data.breakdown.penaltiesRefund ? data.breakdown.penaltiesRefund.toLocaleString('en-US') : '')
          if (data.breakdown.delayDamages && data.breakdown.principalTaxRefund > 0) {
            const months = Math.round(data.breakdown.delayDamages / (data.breakdown.principalTaxRefund * 0.015))
            setDelayMonths(months)
          }
        }
      } catch (err: any) {
        setInitialError(err.message || 'خطا در بارگذاری پرونده استرداد')
      } finally {
        setLoading(false)
      }
    }

  useEffect(() => {
    if (caseId) {
      loadCase()
    }
  }, [caseId])

  const handleReturnCase = async (targetStatus: RefundCaseStatus, reason: string) => {
    try {
      await taxRefundApi.transitionStatus(caseId, {
        newStatus: targetStatus,
        notes: reason,
      })
      await loadCase()
    } catch (err: any) {
      alert(err.message || 'خطا در عودت پرونده')
      throw err
    }
  }

  // Derived numerical values for calculation
  const totalPaid = receipts.reduce((sum, r) => sum + (r.amountRials || 0), 0)
  const assessedIncome = parseFloat(assessedIncomeStr.replace(/,/g, '')) || 0
  const exemptions = parseFloat(exemptionsStr.replace(/,/g, '')) || 0
  const assessedTax = parseFloat(assessedTaxStr.replace(/,/g, '')) || 0
  const nonWaivablePenalties = parseFloat(nonWaivablePenaltiesStr.replace(/,/g, '')) || 0
  const timelyPaymentBonus = parseFloat(timelyPaymentBonusStr.replace(/,/g, '')) || 0
  const totalDiscoveredDebts = letters.reduce((sum, l) => sum + (l.debtAmount || 0), 0)
  const stampDuty = parseFloat(stampDutyStr.replace(/,/g, '')) || 0
  const other = parseFloat(otherStr.replace(/,/g, '')) || 0
  const penalties = parseFloat(penaltiesStr.replace(/,/g, '')) || 0

  const totalAssessed = assessedTax + nonWaivablePenalties
  const surplusPaid = totalAssessed - timelyPaymentBonus - totalPaid
  const grossSurplus = surplusPaid < 0 ? Math.abs(surplusPaid) : 0
  const principalRefund = Math.max(0, grossSurplus - totalDiscoveredDebts)

  // Validation
  const validateStep = (step: number): boolean => {
    setStepError(null)

    if (step === 1) {
      if (!taxpayerName.trim()) {
        setStepError('عنوان و نام مودی الزامی است')
        return false
      }
      if (!economicCode.trim() || economicCode.trim().length < 10) {
        setStepError('شماره اقتصادی باید بین ۱۰ تا ۱۴ رقم باشد')
        return false
      }
      if (!taxYear || Number(taxYear) < 1300 || Number(taxYear) > 1500) {
        setStepError('سال استرداد باید بین ۱۳۰۰ تا ۱۵۰۰ باشد')
        return false
      }
      if (!taxUnitCode.trim()) {
        setStepError('کد واحد مالیاتی الزامی است')
        return false
      }
      if (!province.trim()) {
        setStepError('استان الزامی است')
        return false
      }
      if (!city.trim()) {
        setStepError('شهرستان الزامی است')
        return false
      }
      if (!bankName.trim()) {
        setStepError('نام بانک مودی الزامی است')
        return false
      }
      if (!shebaNumber.trim() || !shebaNumber.trim().toUpperCase().startsWith('IR') || shebaNumber.trim().length < 20) {
        setStepError('شماره شبا باید با IR آغاز شده و حداقل ۲۰ کاراکتر باشد')
        return false
      }
      if (!refundReason.trim()) {
        setStepError('علت درخواست استرداد الزامی است')
        return false
      }
    }

    if (step === 2) {
      if (receipts.length === 0) {
        setStepError('حداقل ثبت یک قبض پرداختی در جدول الف الزامی است')
        return false
      }
    }

    if (step === 3) {
      if (!petitionNumber.trim()) {
        setStepError('شماره ثبت وارده درخواست مودی در دبیرخانه الزامی است')
        return false
      }
      if (!petitionDate.trim()) {
        setStepError('تاریخ ثبت وارده درخواست مودی در دبیرخانه الزامی است')
        return false
      }
    }

    if (step === 4) {
      if (assessedTax <= 0 && assessedIncome <= 0) {
        setStepError('مبلغ مالیات یا درآمد تشخیصی قطعی الزامی است')
        return false
      }
    }

    return true
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 4 && allocations.length === 0 && receipts.length > 0 && principalRefund > 0) {
        let remaining = principalRefund
        const autoAlloc: AllocationItem[] = []
        for (const r of receipts) {
          if (remaining <= 0) break
          const toRefund = Math.min(remaining, r.amountRials)
          if (toRefund > 0) {
            autoAlloc.push({
              taxRefundReceiptId: r.id,
              receiptNumber: r.receiptNumber,
              totalReceiptAmount: r.amountRials,
              refundableAmount: toRefund,
              bankBranch: r.bankBranch,
              city: r.city,
              revenueLedgerRow: r.revenueLedgerRow,
            })
            remaining -= toRefund
          }
        }
        setAllocations(autoAlloc)
      }
      setCurrentStep((prev) => Math.min(prev + 1, 6))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrev = () => {
    setStepError(null)
    setCurrentStep((prev) => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSaveAll = async () => {
    // Validate all core steps
    if (!validateStep(1)) {
      setCurrentStep(1)
      return
    }
    if (!validateStep(2)) {
      setCurrentStep(2)
      return
    }
    if (!validateStep(3)) {
      setCurrentStep(3)
      return
    }
    if (!validateStep(4)) {
      setCurrentStep(4)
      return
    }

    try {
      setSubmitting(true)
      setStepError(null)

      // 1. Compile all letters
      const allLetters: any[] = []
      if (petitionNumber.trim()) {
        allLetters.push({
          letterType: 1, // InboundTaxpayerRequest
          letterNumber: petitionNumber.trim(),
          letterDateJalali: petitionDate.trim(),
          description: 'درخواست استرداد مودی ثبت شده در دبیرخانه',
        })
      }

      for (const l of letters) {
        allLetters.push({
          letterType: l.letterType,
          letterNumber: l.letterNumber,
          letterDateJalali: l.letterDateJalali,
          debtAmount: l.debtAmount,
          debtYear: l.debtYear,
          description: l.description,
        })
      }

      // 2. Prepare full update payload
      const caseInput: CreateTaxRefundCaseInput = {
        taxpayerName: taxpayerName.trim(),
        economicCode: economicCode.trim(),
        nationalId: nationalId.trim() || undefined,
        taxUnitCode: taxUnitCode.trim(),
        province: province.trim(),
        city: city.trim(),
        address: address.trim(),
        bankName: bankName.trim(),
        shebaNumber: shebaNumber.trim().toUpperCase(),
        taxYear: Number(taxYear),
        period,
        taxSource,
        refundReason: refundReason.trim(),
        docketNumber: docketNumber.trim(),
        administrationHeadName: adminHeadName.trim(),
        groupHeadName: groupHeadName.trim(),
        seniorAuditorName: seniorAuditorName.trim(),
        receipts: receipts.map((r) => ({
          rowIndex: r.rowIndex,
          receiptNumber: r.receiptNumber,
          issueDateJalali: r.issueDateJalali,
          paymentDateJalali: r.paymentDateJalali,
          amountRials: r.amountRials,
          bankBranch: r.bankBranch,
          city: r.city,
          revenueLedgerRow: r.revenueLedgerRow,
        })),
        letters: allLetters,
        assessmentInfo: {
          hasReturnFiled,
          returnNumber: returnNumber.trim() || undefined,
          returnDateJalali: returnDateJalali.trim() || undefined,
          finalizationMethod,
          finalityStage,
          finalNoticeNumber: finalNoticeNumber.trim() || undefined,
          finalNoticeDateJalali: finalNoticeDateJalali.trim() || undefined,
          assessedIncome,
          exemptions,
          assessedTax,
          nonWaivablePenalties,
          timelyPaymentBonus,
        },
        breakdown: {
          principalTaxRefund: principalRefund,
          stampDutyRefund: stampDuty,
          otherRefund: other,
          penaltiesRefund: penalties,
          delayDamages: Math.round(principalRefund * 0.015 * Math.max(0, delayMonths)),
        },
        allocations: allocations.map((a) => ({
          receiptNumber: a.receiptNumber,
          totalReceiptAmount: a.totalReceiptAmount,
          refundableAmount: a.refundableAmount,
          bankBranch: a.bankBranch,
          city: a.city,
          revenueLedgerRow: a.revenueLedgerRow,
        })),
      }

      await taxRefundApi.updateFullCase(caseId, caseInput)

      router.push(`/refunds/${caseId}`)
    } catch (err: any) {
      setStepError(err.message || 'خطا در ذخیره تغییرات پرونده استرداد')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-purple-700 mx-auto" />
          <p className="text-sm font-bold text-gray-700">در حال بارگذاری اطلاعات پرونده استرداد...</p>
        </div>
      </div>
    )
  }

  if (initialError || !refundCase) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50" dir="rtl">
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm max-w-md w-full text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-base font-bold text-gray-900">خطا در دریافت پرونده</h2>
          <p className="text-xs text-gray-600">{initialError || 'پرونده مورد نظر یافت نشد'}</p>
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

  const isLocked =
    refundCase.status === RefundCaseStatus.AdministrationHeadApproved ||
    refundCase.status === RefundCaseStatus.TreasuryDisbursed

  if (isLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50" dir="rtl">
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm max-w-lg w-full text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-base font-bold text-gray-900">
            {refundCase.status === RefundCaseStatus.AdministrationHeadApproved
              ? 'پرونده نیازمند عودت جهت ویرایش است'
              : 'پرونده مختومه و پرداخت گردیده است'}
          </h2>
          <p className="text-xs text-gray-600 leading-6">
            {refundCase.status === RefundCaseStatus.AdministrationHeadApproved ? (
              <>
                این پرونده با شماره پیگیری <strong className="font-mono text-purple-900">{refundCase.caseTrackingNumber}</strong> در مرحله «تایید نهایی رئیس امور» قرار دارد. برای بازگشایی قفل و ویرایش اطلاعات، پرونده باید توسط رئیس اداره یا مدیر عودت داده شود.
              </>
            ) : (
              <>
                این پرونده توسط ذیحسابی پرداخت گردیده و طبق قوانین مالیاتی امکان تغییر اطلاعات آن وجود ندارد.
              </>
            )}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href={`/refunds/${caseId}`}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
            >
              مشاهده پرونده
            </Link>

            {refundCase.status === RefundCaseStatus.AdministrationHeadApproved && (
              <button
                type="button"
                onClick={() => setIsReturnModalOpen(true)}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                عودت پرونده و بازگشایی ویرایشگر
              </button>
            )}
          </div>

          <WorkflowReturnModal
            isOpen={isReturnModalOpen}
            caseTrackingNumber={refundCase.caseTrackingNumber}
            currentStatus={refundCase.status}
            onClose={() => setIsReturnModalOpen(false)}
            onConfirm={handleReturnCase}
          />
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredModule="module_tax_refund">
      <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8" dir="rtl">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Link href="/refunds" className="hover:text-purple-700">کارپوشه استرداد</Link>
                <ChevronLeft className="w-3.5 h-3.5" />
                <Link href={`/refunds/${caseId}`} className="hover:text-purple-700 font-mono font-bold">
                  {refundCase.caseTrackingNumber}
                </Link>
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="text-purple-900 font-bold">ویرایش جامع ۶ مرحله‌ای</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-3">
                <span>ویرایش پرونده استرداد مالیات</span>
                <span className="text-xs px-2.5 py-1 bg-purple-100 border border-purple-300 text-purple-800 rounded-lg font-mono font-bold">
                  {refundCase.caseTrackingNumber}
                </span>
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/refunds/${caseId}`}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                انصراف و بازگشت
              </Link>
              <button
                onClick={handleSaveAll}
                disabled={submitting}
                className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>در حال ذخیره تغییرات...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>ذخیره تغییرات پرونده</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 6-Step Wizard Navigation Bar (All Steps Clickable in Edit Mode!) */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {WIZARD_STEPS.map((step) => {
                const StepIcon = step.icon
                const isCurrent = currentStep === step.id

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      setCurrentStep(step.id)
                      setStepError(null)
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-sm ring-2 ring-purple-500/20 font-bold'
                        : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 ${
                        isCurrent
                          ? 'bg-purple-700 text-white'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      <StepIcon className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold leading-tight line-clamp-1">{step.title}</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">مرحله {step.id}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Step Error Banner */}
          {stepError && (
            <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
              <span>{stepError}</span>
            </div>
          )}

          {/* Main Content Layout: Form Workspace (Right) + Live Calculation Sticky (Left) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Form Step Workspace */}
            <div className="lg:col-span-2 space-y-6">
              {/* STEP 1: General Info & Taxpayer Identity */}
              {currentStep === 1 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
                  <div className="border-b border-gray-200 pb-3">
                    <h3 className="text-base font-bold text-gray-900">مرحله ۱: مشخصات عمومی و هویت مودی</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      مشخصات ثبتی، حساب بانکی مودی جهت استرداد و حوزه مالیاتی رسیدگی‌کننده
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-gray-700 font-bold mb-1">نام و عنوان مودی *</label>
                      <input
                        type="text"
                        value={taxpayerName}
                        onChange={(e) => setTaxpayerName(e.target.value)}
                        placeholder="مثال: شرکت پتروشیمی کارون"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1">شماره اقتصادی (۱۰ الی ۱۲ رقم) *</label>
                      <input
                        type="text"
                        value={economicCode}
                        onChange={(e) => setEconomicCode(e.target.value)}
                        placeholder="مثال: ۴۱۱۳۹۵۷۶۸۵۳۱"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1">شناسه ملی / کد ملی</label>
                      <input
                        type="text"
                        value={nationalId}
                        onChange={(e) => setNationalId(e.target.value)}
                        placeholder="مثال: ۱۰۱۰۲۳۴۵۶۷۸"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1">شماره پرونده مالیاتی</label>
                      <input
                        type="text"
                        value={docketNumber}
                        onChange={(e) => setDocketNumber(e.target.value)}
                        placeholder="مثال: ۸۷"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1">سال مالیاتی استرداد *</label>
                      <input
                        type="number"
                        value={taxYear}
                        onChange={(e) => setTaxYear(e.target.value === '' ? '' : Number(e.target.value))}
                        min={1300}
                        max={1500}
                        placeholder="مثال: ۱۴۰۲"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1">منبع مالیات *</label>
                      <select
                        value={taxSource}
                        onChange={(e) => setTaxSource(Number(e.target.value) as TaxSourceType)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                      >
                        {Object.entries(TaxSourceLabels).map(([val, label]) => (
                          <option key={val} value={val}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1">کد واحد مالیاتی *</label>
                      <input
                        type="text"
                        value={taxUnitCode}
                        onChange={(e) => setTaxUnitCode(e.target.value)}
                        placeholder="مثال: ۱۶۰۳۰۰"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1">استان *</label>
                      <input
                        type="text"
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        placeholder="مثال: خوزستان"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1">شهرستان *</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="مثال: اهواز"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1">بانک مودی *</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="مثال: ملی، ملت، صادرات..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1">شماره شبا حساب مودی (IR...) *</label>
                      <input
                        type="text"
                        value={shebaNumber}
                        onChange={(e) => setShebaNumber(e.target.value.toUpperCase())}
                        placeholder="IR..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono uppercase"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-gray-700 font-bold mb-1">نشانی قانونی مودی</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="مثال: اهواز، کیانپارس..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-gray-700 font-bold mb-1">علت درخواست استرداد *</label>
                      <input
                        type="text"
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                        placeholder="مثال: اشتباه واریزی و اضافه پرداختی عملکرد"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Presiding Officers */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="text-xs font-bold text-gray-700 mb-3">مقامات مسئول پرونده:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-gray-500 mb-1">رئیس امور مالیاتی *</label>
                        <input
                          type="text"
                          value={adminHeadName}
                          onChange={(e) => setAdminHeadName(e.target.value)}
                          placeholder="نام و نام خانوادگی"
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 mb-1">رئیس گروه مالیاتی *</label>
                        <input
                          type="text"
                          value={groupHeadName}
                          onChange={(e) => setGroupHeadName(e.target.value)}
                          placeholder="نام و نام خانوادگی"
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 mb-1">کارشناس ارشد مالیاتی *</label>
                        <input
                          type="text"
                          value={seniorAuditorName}
                          onChange={(e) => setSeniorAuditorName(e.target.value)}
                          placeholder="نام و نام خانوادگی"
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Table A Receipts */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <ReceiptsTableEditor
                    receipts={receipts}
                    onChange={setReceipts}
                  />
                </div>
              )}

              {/* STEP 3: Inquiries & Letters */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <InquiriesEditor
                    petitionNumber={petitionNumber}
                    petitionDate={petitionDate}
                    onPetitionChange={(num, dt) => {
                      setPetitionNumber(num)
                      setPetitionDate(dt)
                    }}
                    letters={letters}
                    onLettersChange={setLetters}
                  />
                </div>
              )}

              {/* STEP 4: Assessment & Finalization */}
              {currentStep === 4 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
                  <div className="border-b border-gray-200 pb-3">
                    <h3 className="text-base font-bold text-gray-900">مرحله ۴: مشخصات قطعی‌سازی پرونده</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      مبالغ تشخیصی قطعی، جرایم غیرقابل بخشش، پاداش خوش‌حسابی و نحوه قطعیت مالیات
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-gray-700 font-bold mb-1">نحوه رسیدگی و قطعی‌سازی</label>
                      <select
                        value={finalizationMethod}
                        onChange={(e) => setFinalizationMethod(Number(e.target.value) as FinalizationMethod)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                      >
                        {Object.entries(FinalizationMethodLabels).map(([val, label]) => (
                          <option key={val} value={val}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1">مرحله قطعیت مالیات</label>
                      <select
                        value={finalityStage}
                        onChange={(e) => setFinalityStage(Number(e.target.value) as FinalityStage)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                      >
                        {Object.entries(FinalityStageLabels).map(([val, label]) => (
                          <option key={val} value={val}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1">شماره برگ قطعی / توافق</label>
                      <input
                        type="text"
                        value={finalNoticeNumber}
                        onChange={(e) => setFinalNoticeNumber(e.target.value)}
                        placeholder="مثال: ۲۴۸۶۰"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1">تاریخ برگ قطعی (شمسی)</label>
                      <input
                        type="text"
                        value={finalNoticeDateJalali}
                        onChange={(e) => setFinalNoticeDateJalali(e.target.value)}
                        placeholder="مثال: ۱۴۰۳/۰۴/۱۵"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1">درآمد تشخیصی قطعی (ریال)</label>
                      <input
                        type="text"
                        value={assessedIncomeStr}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/,/g, '')
                          setAssessedIncomeStr(raw ? Number(raw).toLocaleString('en-US') : '')
                        }}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1">معافیت‌های قانونی (ریال)</label>
                      <input
                        type="text"
                        value={exemptionsStr}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/,/g, '')
                          setExemptionsStr(raw ? Number(raw).toLocaleString('en-US') : '')
                        }}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1">مالیات تشخیصی قطعی (ریال) *</label>
                      <input
                        type="text"
                        value={assessedTaxStr}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/,/g, '')
                          setAssessedTaxStr(raw ? Number(raw).toLocaleString('en-US') : '')
                        }}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono font-bold text-purple-900"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1">جرایم غیرقابل بخشش (ریال)</label>
                      <input
                        type="text"
                        value={nonWaivablePenaltiesStr}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/,/g, '')
                          setNonWaivablePenaltiesStr(raw ? Number(raw).toLocaleString('en-US') : '')
                        }}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1">پاداش خوش‌حسابی موضوع ماده ۱۹۰ (ریال)</label>
                      <input
                        type="text"
                        value={timelyPaymentBonusStr}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/,/g, '')
                          setTimelyPaymentBonusStr(raw ? Number(raw).toLocaleString('en-US') : '')
                        }}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono text-emerald-700"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: Table B Allocations */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <TableBAllocationEditor
                    receipts={receipts}
                    allocations={allocations}
                    onChange={setAllocations}
                    principalRefundTarget={principalRefund}
                  />
                </div>
              )}

              {/* STEP 6: Review & Final Confirmation */}
              {currentStep === 6 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
                  <div className="border-b border-gray-200 pb-3">
                    <h3 className="text-base font-bold text-gray-900">مرحله ۶: بازبینی نهایی و ذخیره پرونده</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      بررسی صحت اقلام محاسبه‌شده و اعمال تاخیر موضوع ماده ۲۴۳
                    </p>
                  </div>

                  {/* Summary Breakdown Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-purple-50/50 rounded-2xl border border-purple-100 text-xs">
                    <div>
                      <span className="text-gray-500 block mb-1">جمع پرداختی قبوض:</span>
                      <span className="font-bold text-gray-900">{totalPaid.toLocaleString()} ریال</span>
                    </div>

                    <div>
                      <span className="text-gray-500 block mb-1">مالیات قطعی:</span>
                      <span className="font-bold text-gray-900">{assessedTax.toLocaleString()} ریال</span>
                    </div>

                    <div>
                      <span className="text-gray-500 block mb-1">بدهی‌های مکشوفه:</span>
                      <span className="font-bold text-rose-700">{totalDiscoveredDebts.toLocaleString()} ریال</span>
                    </div>

                    <div>
                      <span className="text-purple-700 font-bold block mb-1">خالص اصل استرداد:</span>
                      <span className="font-black text-purple-950 text-sm">{principalRefund.toLocaleString()} ریال</span>
                    </div>
                  </div>

                  {/* Delay Months Adjustment */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                    <div>
                      <label className="block text-gray-700 font-bold mb-1">تعداد ماه تاخیر موضوع ماده ۲۴۳</label>
                      <input
                        type="number"
                        value={delayMonths}
                        onChange={(e) => setDelayMonths(Math.max(0, Number(e.target.value)))}
                        min={0}
                        max={60}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono"
                      />
                      <span className="text-[11px] text-gray-500 mt-1 block">
                        خسارت تاخیر: {(Math.round(principalRefund * 0.015 * delayMonths)).toLocaleString()} ریال (۱.۵٪ در ماه)
                      </span>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1">استرداد حق تمبر (ریال)</label>
                      <input
                        type="text"
                        value={stampDutyStr}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/,/g, '')
                          setStampDutyStr(raw ? Number(raw).toLocaleString('en-US') : '')
                        }}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono"
                      />
                    </div>
                  </div>

                  {/* Big Save Button */}
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={handleSaveAll}
                      disabled={submitting}
                      className="px-8 py-3.5 bg-purple-700 hover:bg-purple-800 text-white rounded-2xl text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-purple-700/20 transition-all disabled:opacity-60"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>در حال ذخیره تغییرات پرونده...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          <span>ذخیره نهایی تغییرات پرونده</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Navigation Actions Bar */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentStep === 1}
                  className="px-4 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>مرحله قبل</span>
                </button>

                {currentStep < 6 && (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <span>مرحله بعد</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Left Sticky Calculation Engine Summary Card */}
            <div className="lg:col-span-1 sticky top-6">
              <LiveCalculationCard
                totalPaidAmount={totalPaid}
                assessedTax={assessedTax}
                nonWaivablePenalties={nonWaivablePenalties}
                timelyPaymentBonus={timelyPaymentBonus}
                totalDiscoveredDebts={totalDiscoveredDebts}
                stampDuty={stampDuty}
                other={other}
                penalties={penalties}
                delayMonths={delayMonths}
              />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
