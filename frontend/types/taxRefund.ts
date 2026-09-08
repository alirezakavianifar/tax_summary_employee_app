export enum TaxSourceType {
  CorporateIncome = 1,
  PersonalBusiness = 2,
  SalaryPayroll = 3,
  ValueAddedTax = 4,
  PropertyRental = 5,
  PropertyTransfer = 6,
  Vehicles = 7,
}

export const TaxSourceLabels: Record<TaxSourceType, string> = {
  [TaxSourceType.CorporateIncome]: 'عملکرد اشخاص حقوقی (شرکت‌ها)',
  [TaxSourceType.PersonalBusiness]: 'عملکرد مشاغل و اشخاص حقیقی',
  [TaxSourceType.SalaryPayroll]: 'مالیات بر حقوق',
  [TaxSourceType.ValueAddedTax]: 'مالیات بر ارزش افزوده',
  [TaxSourceType.PropertyRental]: 'درآمد اجاره املاک',
  [TaxSourceType.PropertyTransfer]: 'نقل و انتقال املاک',
  [TaxSourceType.Vehicles]: 'مالیات بر خودرو',
}

export enum FinalizationMethod {
  ReturnAccepted = 1,
  AuditBooks = 2,
  AliRas = 3,
  TaxExemption = 4,
  LossAccepted = 5,
}

export const FinalizationMethodLabels: Record<FinalizationMethod, string> = {
  [FinalizationMethod.ReturnAccepted]: 'تایید اظهارنامه تسلیمی',
  [FinalizationMethod.AuditBooks]: 'رسیدگی به دفاتر و اسناد',
  [FinalizationMethod.AliRas]: 'علی‌الراس',
  [FinalizationMethod.TaxExemption]: 'معافیت قانونی',
  [FinalizationMethod.LossAccepted]: 'قبول زیان',
}

export enum RefundCaseStatus {
  Draft = 0,
  InquiriesPending = 1,
  Audited = 2,
  GroupHeadApproved = 3,
  AdministrationHeadApproved = 4,
  TreasuryDisbursed = 5,
  Rejected = 6,
}

export const RefundCaseStatusLabels: Record<RefundCaseStatus, { text: string; color: string }> = {
  [RefundCaseStatus.Draft]: { text: 'پیش‌نویس اولیه', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  [RefundCaseStatus.InquiriesPending]: { text: 'در انتظار استعلامات', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  [RefundCaseStatus.Audited]: { text: 'رسیدگی و تنظیم گزارش توجیهی', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  [RefundCaseStatus.GroupHeadApproved]: { text: 'تایید رئیس گروه مالیاتی', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  [RefundCaseStatus.AdministrationHeadApproved]: { text: 'تایید نهایی رئیس امور (دستور استرداد)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  [RefundCaseStatus.TreasuryDisbursed]: { text: 'استرداد شده توسط ذیحسابی', color: 'bg-teal-100 text-teal-800 border-teal-300' },
  [RefundCaseStatus.Rejected]: { text: 'رد شده', color: 'bg-red-100 text-red-800 border-red-300' },
}

export enum TaxRefundLetterType {
  InboundTaxpayerRequest = 1,
  CollectionAndEnforcementInquiry = 2,
  WithholdingTaxInquiry = 3,
  EstateInquiry = 4,
  BusinessInquiry = 5,
  VatInquiry = 6,
  JustificationReport = 7,
  OfficeCommitment = 8,
  RefundVoucher = 9,
  TreasuryLetter = 10,
}

export const TaxRefundLetterTypeLabels: Record<TaxRefundLetterType, string> = {
  [TaxRefundLetterType.InboundTaxpayerRequest]: 'درخواست کتبی استرداد مودی',
  [TaxRefundLetterType.CollectionAndEnforcementInquiry]: 'استعلام وصول و اجرا',
  [TaxRefundLetterType.WithholdingTaxInquiry]: 'استعلام مالیات تکلیفی و حقوق',
  [TaxRefundLetterType.EstateInquiry]: 'استعلام مالیات بر ارث',
  [TaxRefundLetterType.BusinessInquiry]: 'استعلام مالیات مشاغل',
  [TaxRefundLetterType.VatInquiry]: 'استعلام مالیات بر ارزش افزوده',
  [TaxRefundLetterType.JustificationReport]: 'گزارش توجیه استرداد اداره',
  [TaxRefundLetterType.OfficeCommitment]: 'فرم تعهد کارشناس ارشد',
  [TaxRefundLetterType.RefundVoucher]: 'برگ استرداد ماده ۲۴۲',
  [TaxRefundLetterType.TreasuryLetter]: 'نامه پرداخت ذیحسابی',
}

export interface TaxAssessmentInfo {
  hasReturnFiled: boolean
  returnNumber?: string
  returnDateJalali?: string
  finalizationMethod: FinalizationMethod
  finalNoticeNumber?: string
  finalNoticeDateJalali?: string
  assessedIncome: number
  exemptions: number
  assessedTax: number
  nonWaivablePenalties: number
  timelyPaymentBonus: number
}

export interface RefundBreakdown {
  principalTaxRefund: number
  stampDutyRefund: number
  otherRefund: number
  penaltiesRefund: number
  delayDamages: number
}

export interface TaxRefundReceipt {
  id: string
  taxRefundCaseId: string
  rowIndex: number
  receiptNumber: string
  issueDateJalali: string
  paymentDateJalali: string
  amountRials: number
  bankBranch?: string
  city?: string
  revenueLedgerRow?: string
}

export interface RefundableReceiptAllocation {
  id: string
  taxRefundCaseId: string
  taxRefundReceiptId: string
  receiptNumber: string
  totalReceiptAmount: number
  refundableAmount: number
  bankBranch?: string
  city?: string
  revenueLedgerRow?: string
}

export interface TaxRefundLetter {
  id: string
  taxRefundCaseId: string
  letterType: TaxRefundLetterType
  letterNumber: string
  letterDateJalali: string
  description?: string
  debtAmount: number
  debtYear?: string
}

export interface TaxRefundApprovalAction {
  id: string
  taxRefundCaseId: string
  fromStatus: RefundCaseStatus
  toStatus: RefundCaseStatus
  actorUserId: string
  actorName: string
  actorRole: string
  notes?: string
  actionDate: string
}

export interface RefundCalculationResult {
  totalReceiptsCount: number
  totalPaidAmount: number
  assessedIncome: number
  exemptions: number
  taxableBase: number
  assessedTax: number
  nonWaivablePenalties: number
  totalAssessedTax: number
  timelyPaymentBonus: number
  surplusPaid: number
  totalDiscoveredDebts: number
  grossSurplus: number
  principalTaxRefund: number
  stampDutyRefund: number
  otherRefund: number
  penaltiesRefund: number
  delayMonths: number
  delayDamages: number
  grandTotalRefundable: number
}

export interface TaxRefundCase {
  id: string
  caseTrackingNumber: string
  docketNumber: string
  taxpayerName: string
  economicCode: string
  nationalId?: string
  taxUnitCode: string
  province: string
  city: string
  address: string
  bankName: string
  shebaNumber: string
  taxYear: number
  period: number
  taxSource: TaxSourceType
  taxSourceDescription: string
  refundReason: string
  administrationHeadName: string
  groupHeadName: string
  seniorAuditorName: string
  status: RefundCaseStatus
  statusDescription: string
  assessmentInfo: TaxAssessmentInfo
  breakdown: RefundBreakdown
  receipts: TaxRefundReceipt[]
  allocations: RefundableReceiptAllocation[]
  letters: TaxRefundLetter[]
  approvals: TaxRefundApprovalAction[]
  calculation?: RefundCalculationResult
  createdByUserId: string
  createdAt: string
  updatedAt: string
}

export interface TaxRefundCaseSummary {
  id: string
  caseTrackingNumber: string
  docketNumber: string
  taxpayerName: string
  economicCode: string
  taxYear: number
  taxSource: TaxSourceType
  taxSourceName?: string
  taxSourceDescription?: string
  status: RefundCaseStatus
  statusName?: string
  statusDescription?: string
  city: string
  receiptsCount: number
  totalPaidAmount: number
  principalTaxRefund: number
  grandTotalRefundable?: number
  createdAt: string
  updatedAt?: string
}

export interface CreateTaxRefundCaseInput {
  docketNumber?: string
  taxpayerName: string
  economicCode: string
  nationalId?: string
  taxUnitCode: string
  province: string
  city: string
  address?: string
  bankName: string
  shebaNumber: string
  taxYear: number
  period: number
  taxSource: TaxSourceType
  refundReason?: string
  administrationHeadName?: string
  groupHeadName?: string
  seniorAuditorName?: string
  receipts?: Partial<TaxRefundReceipt>[]
  letters?: Partial<TaxRefundLetter>[]
  allocations?: Partial<RefundableReceiptAllocation>[]
  assessmentInfo?: Partial<TaxAssessmentInfo>
  breakdown?: Partial<RefundBreakdown>
}

export interface UpdateTaxRefundCaseInput {
  docketNumber?: string
  taxpayerName: string
  economicCode: string
  nationalId?: string
  taxUnitCode: string
  province: string
  city: string
  address?: string
  bankName: string
  shebaNumber: string
  refundReason?: string
  administrationHeadName?: string
  groupHeadName?: string
  seniorAuditorName?: string
}

export interface CalculateRefundRequest {
  assessedIncome?: number
  exemptions?: number
  assessedTax: number
  nonWaivablePenalties?: number
  timelyPaymentBonus?: number
  totalPaidAmount: number
  receiptAmounts?: number[]
  totalDiscoveredDebts?: number
  debtAmounts?: number[]
  stampDuty?: number
  other?: number
  penalties?: number
  delayMonths?: number
}

export interface TransitionStatusInput {
  newStatus: RefundCaseStatus
  notes?: string
}

export interface TaxRefundFilter {
  taxYear?: number
  taxSource?: TaxSourceType
  status?: RefundCaseStatus
  searchTerm?: string
  pageNumber?: number
  pageSize?: number
}

export interface PrintableDocument {
  caseId: string
  formType: string
  formTitle: string
  caseTrackingNumber: string
  docketNumber: string
  taxpayerName: string
  economicCode: string
  nationalId?: string
  taxUnitCode: string
  province: string
  city: string
  address: string
  bankName: string
  shebaNumber: string
  taxYear: number
  period: number
  taxSourceName: string
  refundReason?: string
  administrationHeadName: string
  groupHeadName: string
  seniorAuditorName: string
  totalPaidAmountFormatted: string
  grandTotalRefundableFormatted: string
  grandTotalRefundableInWords: string
  principalTaxRefundFormatted: string
  refundVoucherNumber?: string
  refundVoucherDate?: string
  justificationReportNumber?: string
  justificationReportDate?: string
  officeCommitmentNumber?: string
  officeCommitmentDate?: string
  treasuryLetterNumber?: string
  treasuryLetterDate?: string
  taxpayerRequestNumber?: string
  taxpayerRequestDate?: string
  assessment: TaxAssessmentInfo
  calculation: RefundCalculationResult
  receipts: TaxRefundReceipt[]
  allocations: RefundableReceiptAllocation[]
  letters: TaxRefundLetter[]
}
