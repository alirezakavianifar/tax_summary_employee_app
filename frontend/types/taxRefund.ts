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

export enum FinalityStage {
  Tamkin = 1,
  TaxOfficeAgreement = 2,
  PrimaryBoardRuling = 3,
  AppellateBoardRuling = 4,
  Article251 = 5,
  Article216 = 6,
}

export const FinalityStageLabels: Record<FinalityStage, string> = {
  [FinalityStage.Tamkin]: 'تمکین',
  [FinalityStage.TaxOfficeAgreement]: 'توافق در اداره امور مالیاتی',
  [FinalityStage.PrimaryBoardRuling]: 'رای هیات بدوی',
  [FinalityStage.AppellateBoardRuling]: 'رای هیات تجدید نظر',
  [FinalityStage.Article251]: '251',
  [FinalityStage.Article216]: '216',
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
  finalizationMethodName?: string
  finalityStage: FinalityStage
  finalityStageName?: string
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
  letterTypeName?: string
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

export interface JustificationReport {
  reportNumber: string
  reportDateJalali: string
  auditExaminationFindings: string
  legalGroundsAndReasoning: string
  inquiriesAndDebtClearanceSummary: string
  receiptsVerificationNotes: string
  auditorConclusion: string
  recommendedRefundAmount: number
  auditorSignatureDate?: string
  auditorUserId?: string
  auditorUserName?: string
  isFinalized: boolean
  finalizedAt?: string
  groupHeadOpinionText?: string
  administrationHeadApprovalText?: string
}

export interface UpdateJustificationReportInput {
  reportNumber: string
  reportDateJalali: string
  auditExaminationFindings: string
  legalGroundsAndReasoning: string
  inquiriesAndDebtClearanceSummary: string
  receiptsVerificationNotes: string
  auditorConclusion: string
  recommendedRefundAmount: number
  groupHeadOpinionText?: string
  administrationHeadApprovalText?: string
}

export interface FinalizeJustificationReportInput {
  signatureDateJalali?: string
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
  justificationReport?: JustificationReport
  receipts: TaxRefundReceipt[]
  allocations: RefundableReceiptAllocation[]
  letters: TaxRefundLetter[]
  approvals: TaxRefundApprovalAction[]
  documents: TaxRefundDocument[]
  calculation?: RefundCalculationResult
  createdByUserId: string
  createdAt: string
  updatedAt: string
}

export enum TaxRefundDocumentType {
  TaxpayerPetition = 1,
  ReceiptProof = 2,
  AssessmentNotice = 3,
  InquiryResponse = 4,
  JustificationReport = 5,
  OfficeCommitment = 6,
  DisbursementReceipt = 7,
  IdentityProof = 8,
  Other = 9,
}

export const TaxRefundDocumentTypeLabels: Record<TaxRefundDocumentType, { label: string; color: string }> = {
  [TaxRefundDocumentType.TaxpayerPetition]: { label: 'درخواست استرداد مودی', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  [TaxRefundDocumentType.ReceiptProof]: { label: 'تصویر فیش/قبض پرداختی', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  [TaxRefundDocumentType.AssessmentNotice]: { label: 'برگ تشخیص/برگ قطعی', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  [TaxRefundDocumentType.InquiryResponse]: { label: 'پاسخ استعلام عدم بدهی', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  [TaxRefundDocumentType.JustificationReport]: { label: 'گزارش توجیهی حسابرسی', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  [TaxRefundDocumentType.OfficeCommitment]: { label: 'تعهدنامه کارشناس ارشد', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  [TaxRefundDocumentType.DisbursementReceipt]: { label: 'رسید پرداخت ذیحسابی', color: 'bg-teal-100 text-teal-800 border-teal-200' },
  [TaxRefundDocumentType.IdentityProof]: { label: 'مدارک هویتی و ثبتی', color: 'bg-slate-100 text-slate-800 border-slate-200' },
  [TaxRefundDocumentType.Other]: { label: 'سایر مدارک و ضمائم', color: 'bg-gray-100 text-gray-800 border-gray-200' },
}

export interface TaxRefundDocument {
  id: string
  taxRefundCaseId: string
  documentType: TaxRefundDocumentType
  documentTypeDescription: string
  title: string
  originalFileName: string
  fileSize: number
  fileSizeFormatted: string
  contentType: string
  uploadDateJalali: string
  uploadedByUserId: string
  uploadedByUserName: string
  description?: string
  relatedReceiptId?: string
  relatedLetterId?: string
  createdAt: string
  viewUrl: string
  downloadUrl: string
}

export interface UploadTaxRefundDocumentInput {
  title: string
  documentType: TaxRefundDocumentType
  description?: string
  relatedReceiptId?: string
  relatedLetterId?: string
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
  bankName?: string
  shebaNumber?: string
  taxYear?: number
  taxSource?: TaxSourceType
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
  justificationReport?: JustificationReport
}
