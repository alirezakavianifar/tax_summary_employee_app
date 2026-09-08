'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
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
} from 'lucide-react'
import { taxRefundApi } from '@/lib/api/taxRefund'
import {
  TaxSourceType,
  TaxSourceLabels,
  FinalizationMethod,
  FinalizationMethodLabels,
  CreateTaxRefundCaseInput,
} from '@/types/taxRefund'
import LiveCalculationCard from '@/components/refunds/LiveCalculationCard'
import ReceiptsTableEditor, { ReceiptItem } from '@/components/refunds/ReceiptsTableEditor'
import InquiriesEditor, { LetterItem } from '@/components/refunds/InquiriesEditor'
import TableBAllocationEditor, { AllocationItem } from '@/components/refunds/TableBAllocationEditor'

const WIZARD_STEPS = [
  { id: 1, title: 'مشخصات عمومی و مودی', icon: Building },
  { id: 2, title: 'قبوض پرداختی (جدول الف)', icon: Receipt },
  { id: 3, title: 'استعلامات عدم بدهی', icon: Mail },
  { id: 4, title: 'قطعی‌سازی پرونده', icon: FileCheck },
  { id: 5, title: 'تخصیص قبوض (جدول ب)', icon: Layers },
  { id: 6, title: 'بازبینی و ثبت نهایی', icon: CheckCircle2 },
]

export default function NewTaxRefundCasePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [stepError, setStepError] = useState<string | null>(null)

  // Step 1: General & Taxpayer Info
  const [taxpayerName, setTaxpayerName] = useState('شرکت نمونه')
  const [economicCode, setEconomicCode] = useState('1234567890')
  const [nationalId, setNationalId] = useState('10100000000')
  const [taxUnitCode, setTaxUnitCode] = useState('160300')
  const [province, setProvince] = useState('خوزستان')
  const [city, setCity] = useState('اهواز')
  const [address, setAddress] = useState('اهواز کیانپارس خ 17')
  const [bankName, setBankName] = useState('ملی')
  const [shebaNumber, setShebaNumber] = useState('IR160120000000001234567890')
  const [taxYear, setTaxYear] = useState<number>(1402)
  const [period, setPeriod] = useState<number>(1)
  const [taxSource, setTaxSource] = useState<TaxSourceType>(TaxSourceType.CorporateIncome)
  const [refundReason, setRefundReason] = useState('اشتباه واریزی و اضافه پرداختی عملکرد')
  const [docketNumber, setDocketNumber] = useState('87')
  const [adminHeadName, setAdminHeadName] = useState('غلامرضا اسلامی')
  const [groupHeadName, setGroupHeadName] = useState('مسعود بصیر')
  const [seniorAuditorName, setSeniorAuditorName] = useState('مهدی دلفی')

  // Step 2: Table A Receipts
  const [receipts, setReceipts] = useState<ReceiptItem[]>([
    {
      rowIndex: 1,
      receiptNumber: '987654321',
      issueDateJalali: '1403/05/01',
      paymentDateJalali: '1403/05/01',
      amountRials: 300_000_000,
      bankBranch: 'اهواز',
      city: 'اهواز',
      revenueLedgerRow: 'ردیف 1',
    },
    {
      rowIndex: 2,
      receiptNumber: '654321987',
      issueDateJalali: '1403/05/02',
      paymentDateJalali: '1403/05/02',
      amountRials: 15_000_000,
      bankBranch: 'اهواز',
      city: 'اهواز',
      revenueLedgerRow: 'ردیف 2',
    },
  ])

  // Step 3: Inquiries & Letters
  const [petitionNumber, setPetitionNumber] = useState('526314')
  const [petitionDate, setPetitionDate] = useState('1405/01/25')
  const [letters, setLetters] = useState<LetterItem[]>([
    {
      letterType: 2, // CollectionAndEnforcementInquiry
      letterNumber: '1235465',
      letterDateJalali: '1405/02/01',
      debtAmount: 0,
      description: 'استعلام وصول و اجرا',
    },
    {
      letterType: 3, // WithholdingTaxInquiry
      letterNumber: '6532487',
      letterDateJalali: '1405/02/01',
      debtAmount: 0,
      description: 'استعلام مالیات تکلیفی و حقوق',
    },
  ])

  // Step 4: Assessment & Finalization
  const [hasReturnFiled, setHasReturnFiled] = useState(true)
  const [returnNumber, setReturnNumber] = useState('654321987')
  const [returnDateJalali, setReturnDateJalali] = useState('1403/04/31')
  const [finalizationMethod, setFinalizationMethod] = useState<FinalizationMethod>(FinalizationMethod.AliRas)
  const [finalNoticeNumber, setFinalNoticeNumber] = useState('326541789')
  const [finalNoticeDateJalali, setFinalNoticeDateJalali] = useState('1403/10/20')
  const [assessedIncomeStr, setAssessedIncomeStr] = useState('1,000,000,000')
  const [exemptionsStr, setExemptionsStr] = useState('0')
  const [assessedTaxStr, setAssessedTaxStr] = useState('250,000,000')
  const [nonWaivablePenaltiesStr, setNonWaivablePenaltiesStr] = useState('0')
  const [timelyPaymentBonusStr, setTimelyPaymentBonusStr] = useState('0')

  // Step 5: Table B Allocations
  const [allocations, setAllocations] = useState<AllocationItem[]>([])

  // Step 6: Additional Items & Delay
  const [stampDutyStr, setStampDutyStr] = useState('0')
  const [otherStr, setOtherStr] = useState('0')
  const [penaltiesStr, setPenaltiesStr] = useState('0')
  const [delayMonths, setDelayMonths] = useState<number>(0)

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

  // Validation before advancing to next step
  const validateStep = (step: number): boolean => {
    setStepError(null)

    if (step === 1) {
      if (!taxpayerName.trim()) {
        setStepError('عنوان و نام مودی الزامی است')
        return false
      }
      if (!economicCode.trim() || economicCode.trim().length < 10) {
        setStepError('شماره اقتصادی باید حداقل ۱۰ رقم باشد')
        return false
      }
      if (!shebaNumber.trim() || !shebaNumber.trim().toUpperCase().startsWith('IR')) {
        setStepError('شماره شبا باید با IR آغاز شود')
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
      // If moving from step 4 to step 5, auto-generate default allocation if empty
      if (currentStep === 4 && allocations.length === 0 && receipts.length > 0 && principalRefund > 0) {
        const first = receipts[0]
        setAllocations([
          {
            taxRefundReceiptId: first.id,
            receiptNumber: first.receiptNumber,
            totalReceiptAmount: first.amountRials,
            refundableAmount: Math.min(principalRefund, first.amountRials),
            bankBranch: first.bankBranch,
            city: first.city,
            revenueLedgerRow: first.revenueLedgerRow,
          },
        ])
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

  const handleFinalSubmit = async () => {
    try {
      setSubmitting(true)
      setStepError(null)

      // 1. Compile all letters and taxpayer petition
      const allLetters: any[] = []
      if (petitionNumber.trim()) {
        allLetters.push({
          letterType: 1, // InboundTaxpayerRequest
          letterNumber: petitionNumber.trim(),
          letterDateJalali: petitionDate.trim() || '1405/01/25',
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

      // 2. Prepare comprehensive case payload for atomic creation
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
        taxYear,
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

      const createdCase = await taxRefundApi.createCase(caseInput)

      // Redirect to case details
      router.push(`/refunds/${createdCase.id}`)
    } catch (err: any) {
      setStepError(err.message || 'خطا در ثبت نهایی پرونده استرداد')
      setSubmitting(false)
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fa-IR').format(Math.round(num))
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link href="/refunds" className="hover:text-purple-700">کارپوشه استرداد</Link>
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="text-gray-900 font-bold">ثبت پرونده استرداد جدید</span>
        </div>

        {/* Wizard Steps Progress Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {WIZARD_STEPS.map((step) => {
              const StepIcon = step.icon
              const isCurrent = currentStep === step.id
              const isCompleted = currentStep > step.id

              return (
                <div
                  key={step.id}
                  onClick={() => {
                    if (isCompleted) setCurrentStep(step.id)
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all ${
                    isCurrent
                      ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-sm ring-1 ring-purple-500'
                      : isCompleted
                      ? 'bg-emerald-50/50 border-emerald-300 text-emerald-900 cursor-pointer hover:bg-emerald-50'
                      : 'bg-gray-50/50 border-gray-200 text-gray-400'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 ${
                    isCurrent
                      ? 'bg-purple-700 text-white'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                  </div>
                  <span className="text-[11px] font-bold leading-tight line-clamp-1">{step.title}</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">مرحله {step.id}</span>
                </div>
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

        {/* Main Content Layout: Form Steps (Right) + Live Calculation Sticky (Left) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Form Step Workspace (2 Columns on Desktop) */}
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
                      placeholder="مثال: شرکت پتروشیمی نمونه"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">شماره اقتصادی (۱۰ الی ۱۲ رقم) *</label>
                    <input
                      type="text"
                      value={economicCode}
                      onChange={(e) => setEconomicCode(e.target.value)}
                      placeholder="۱۲۳۴۵۶۷۸۹۰"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">شناسه ملی / کد ملی</label>
                    <input
                      type="text"
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      placeholder="۱۰۱۰۰۰۰۰۰۰۰"
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
                    <label className="block text-gray-700 font-bold mb-1">سال استرداد *</label>
                    <input
                      type="number"
                      value={taxYear}
                      onChange={(e) => setTaxYear(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">منبع مالیاتی *</label>
                    <select
                      value={taxSource}
                      onChange={(e) => setTaxSource(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                    >
                      {Object.entries(TaxSourceLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">استان</label>
                    <input
                      type="text"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">شهرستان</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">بانک مودی *</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="ملی، ملت، صادرات..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">شماره شبا حساب مودی (IR...) *</label>
                    <input
                      type="text"
                      value={shebaNumber}
                      onChange={(e) => setShebaNumber(e.target.value.toUpperCase())}
                      placeholder="IR160120000000001234567890"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono uppercase"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-gray-700 font-bold mb-1">نشانی قانونی مودی</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-gray-700 font-bold mb-1">علت درخواست استرداد</label>
                    <input
                      type="text"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                    />
                  </div>
                </div>

                {/* Presiding Officers */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="text-xs font-bold text-gray-700 mb-3">مقامات مسئول پرونده:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-gray-500 mb-1">رئیس امور مالیاتی</label>
                      <input
                        type="text"
                        value={adminHeadName}
                        onChange={(e) => setAdminHeadName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">رئیس گروه مالیاتی</label>
                      <input
                        type="text"
                        value={groupHeadName}
                        onChange={(e) => setGroupHeadName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">کارشناس ارشد مالیاتی</label>
                      <input
                        type="text"
                        value={seniorAuditorName}
                        onChange={(e) => setSeniorAuditorName(e.target.value)}
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
                  <h3 className="text-base font-bold text-gray-900">مرحله ۴: فرآیند قطعی‌سازی و مبالغ تشخیصی</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    ورود اطلاعات اظهارنامه، برگ قطعی و مبالغ مالیات و جرایم تشخیصی
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">مودی اظهارنامه تسلیم نموده است؟</label>
                    <select
                      value={hasReturnFiled ? 'true' : 'false'}
                      onChange={(e) => setHasReturnFiled(e.target.value === 'true')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                    >
                      <option value="true">بله</option>
                      <option value="false">خیر</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">نحوه قطعی شدن پرونده *</label>
                    <select
                      value={finalizationMethod}
                      onChange={(e) => setFinalizationMethod(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                    >
                      {Object.entries(FinalizationMethodLabels).map(([k, lbl]) => (
                        <option key={k} value={k}>{lbl}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">شماره اظهارنامه</label>
                    <input
                      type="text"
                      value={returnNumber}
                      onChange={(e) => setReturnNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">تاریخ تسلیم اظهارنامه</label>
                    <input
                      type="text"
                      value={returnDateJalali}
                      onChange={(e) => setReturnDateJalali(e.target.value)}
                      placeholder="۱۴۰۳/۰۴/۳۱"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">شماره برگ قطعی</label>
                    <input
                      type="text"
                      value={finalNoticeNumber}
                      onChange={(e) => setFinalNoticeNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">تاریخ ابلاغ برگ قطعی</label>
                    <input
                      type="text"
                      value={finalNoticeDateJalali}
                      onChange={(e) => setFinalNoticeDateJalali(e.target.value)}
                      placeholder="۱۴۰۳/۱۰/۲۰"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono text-center"
                    />
                  </div>

                  <div className="sm:col-span-2 border-t border-gray-200 pt-3">
                    <h4 className="text-xs font-bold text-gray-800 mb-3">مبالغ درآمد و مالیات قطعی (به ریال):</h4>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">درآمد تشخیصی قبل از کسر مالیات (C)</label>
                    <input
                      type="text"
                      value={assessedIncomeStr}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9]/g, '')
                        setAssessedIncomeStr(v ? Number(v).toLocaleString() : '')
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">جمع معافیت‌ها و بخشودگی‌ها (D)</label>
                    <input
                      type="text"
                      value={exemptionsStr}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9]/g, '')
                        setExemptionsStr(v ? Number(v).toLocaleString() : '0')
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">مالیات تشخیصی قطعی (F) *</label>
                    <input
                      type="text"
                      value={assessedTaxStr}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9]/g, '')
                        setAssessedTaxStr(v ? Number(v).toLocaleString() : '')
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl font-black text-purple-900"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">جرایم غیرقابل بخشش (G)</label>
                    <input
                      type="text"
                      value={nonWaivablePenaltiesStr}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9]/g, '')
                        setNonWaivablePenaltiesStr(v ? Number(v).toLocaleString() : '0')
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">جایزه خوش‌حسابی (I)</label>
                    <input
                      type="text"
                      value={timelyPaymentBonusStr}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9]/g, '')
                        setTimelyPaymentBonusStr(v ? Number(v).toLocaleString() : '0')
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl font-bold"
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

            {/* STEP 6: Summary & Delay Compensation */}
            {currentStep === 6 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
                <div className="border-b border-gray-200 pb-3">
                  <h3 className="text-base font-bold text-gray-900">مرحله ۶: بازبینی نهایی و سایر اقلام استردادی</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    محاسبه خسارت تاخیر ماده ۲۴۳ و تایید نهایی صدور پرونده استرداد
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">
                      تاخیر در پرداخت بیش از مهلت قانونی ماده ۲۴۲ (تعداد ماه):
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={60}
                      value={delayMonths}
                      onChange={(e) => setDelayMonths(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl font-bold text-purple-900"
                    />
                    <span className="text-[11px] text-gray-500 block mt-1">
                      طبق تبصره ماده ۲۴۳، نرخ خسارت تاخیر معادل ۱.۵٪ در هر ماه می‌باشد.
                    </span>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">استرداد حق تمبر (ریال)</label>
                    <input
                      type="text"
                      value={stampDutyStr}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9]/g, '')
                        setStampDutyStr(v ? Number(v).toLocaleString() : '0')
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">استرداد جرایم پرداختی (ریال)</label>
                    <input
                      type="text"
                      value={penaltiesStr}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9]/g, '')
                        setPenaltiesStr(v ? Number(v).toLocaleString() : '0')
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">سایر مبالغ قابل استرداد (ریال)</label>
                    <input
                      type="text"
                      value={otherStr}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9]/g, '')
                        setOtherStr(v ? Number(v).toLocaleString() : '0')
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                    />
                  </div>
                </div>

                {/* Final Confirmation Banner */}
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl">
                  <div className="text-xs font-bold text-purple-900 mb-2">خلاصه گزارش استرداد:</div>
                  <ul className="text-xs text-purple-800 space-y-1.5 list-disc list-inside">
                    <li>مودی: <span className="font-bold">{taxpayerName}</span> (کد اقتصادی: {economicCode})</li>
                    <li>جمع قبوض پرداختی مودی: <span className="font-bold">{formatNumber(totalPaid)} ریال</span> ({receipts.length} فقره)</li>
                    <li>مالیات و جرایم تشخیصی قطعی: <span className="font-bold">{formatNumber(totalAssessed)} ریال</span></li>
                    <li>مازاد پرداختی ناخالص: <span className="font-bold text-emerald-700">{formatNumber(grossSurplus)} ریال</span></li>
                    <li>بدهی‌های کشف شده از استعلامات: <span className="font-bold text-rose-700">{formatNumber(totalDiscoveredDebts)} ریال</span></li>
                    <li>خالص اصل قابل استرداد: <span className="font-black text-purple-950">{formatNumber(principalRefund)} ریال</span></li>
                  </ul>
                </div>
              </div>
            )}

            {/* Navigation Action Buttons */}
            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                  مرحله قبلی
                </button>
              ) : (
                <div />
              )}

              {currentStep < 6 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md"
                >
                  مرحله بعدی
                  <ChevronLeft className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                  className="px-7 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-lg hover:scale-105"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      در حال ثبت نهایی پرونده...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      تایید نهایی و صدور پرونده استرداد
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Sticky Live Calculation Sidebar (Desktop) */}
          <div className="lg:sticky lg:top-24 space-y-4">
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
  )
}
