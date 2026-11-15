export type SrsTaxCategoryKey =
  | 'Corporate300'
  | 'CorporateOther'
  | 'Vat300'
  | 'VatLegalOther'
  | 'BusinessIncome'
  | 'VatIndividual'
  | 'PropertyTax'

export type SrsIndicatorKey =
  | 'AssessmentsIssued'
  | 'FinalizedAssessments'
  | 'TaxpayerAcceptance'
  | 'Article238Agreements'
  | 'AssessmentGrowth'
  | 'TaxAdjustment'
  | 'IssuanceSpeed'
  | 'FinalizationSpeed'

export interface SrsCategoryMeta {
  key: SrsTaxCategoryKey
  titleFa: string
  shortTitle: string
  isLegal: boolean
  badgeColor: string
}

export const SRS_CATEGORIES_META: SrsCategoryMeta[] = [
  {
    key: 'Corporate300',
    titleFa: 'اشخاص حقوقی - ۳۰۰ پرونده مهم',
    shortTitle: 'حقوقی ۳۰۰',
    isLegal: true,
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    key: 'CorporateOther',
    titleFa: 'سایر اشخاص حقوقی',
    shortTitle: 'سایر حقوقی',
    isLegal: true,
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    key: 'Vat300',
    titleFa: 'ارزش افزوده ۳۰۰ پرونده حقوقی',
    shortTitle: 'ارزش افزوده ۳۰۰',
    isLegal: true,
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    key: 'VatLegalOther',
    titleFa: 'سایر ارزش افزوده حقوقی',
    shortTitle: 'سایر ار.افزوده حقوقی',
    isLegal: true,
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  },
  {
    key: 'BusinessIncome',
    titleFa: 'مالیات بر درآمد مشاغل (اشخاص حقیقی)',
    shortTitle: 'مشاغل (حقیقی)',
    isLegal: false,
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    key: 'VatIndividual',
    titleFa: 'ارزش افزوده انفرادی (اشخاص حقیقی)',
    shortTitle: 'ارزش افزوده انفرادی',
    isLegal: false,
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  {
    key: 'PropertyTax',
    titleFa: 'مالیات بر مستغلات و املاک',
    shortTitle: 'مستغلات / املاک',
    isLegal: false,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
]

export interface SrsIndicatorMeta {
  key: SrsIndicatorKey
  frCode: string
  titleFa: string
  descriptionFa: string
  isNegative: boolean
  unit: string
  order: number
}

export const SRS_INDICATORS_META: SrsIndicatorMeta[] = [
  {
    key: 'AssessmentsIssued',
    frCode: 'FR-01',
    titleFa: 'تعداد برگ تشخیص صادره',
    descriptionFa: 'امتیازدهی به ازای هر فقره برگ تشخیص صادره در هر دسته‌بندی موضوعی پرونده',
    isNegative: false,
    unit: 'فقره',
    order: 1,
  },
  {
    key: 'FinalizedAssessments',
    frCode: 'FR-02',
    titleFa: 'تعداد پرونده‌های قطعی شده',
    descriptionFa: 'امتیازدهی به ازای هر فقره پرونده که به قطعیت نهایی رسیده است',
    isNegative: false,
    unit: 'فقره',
    order: 2,
  },
  {
    key: 'TaxpayerAcceptance',
    frCode: 'FR-03',
    titleFa: 'تمکین و قبولی مودی',
    descriptionFa: 'پاداش پرونده‌های قطعی‌شده ناشی از تمکین مودی بدون اعتراض و اطاله دادرسی',
    isNegative: false,
    unit: 'فقره',
    order: 3,
  },
  {
    key: 'Article238Agreements',
    frCode: 'FR-04',
    titleFa: 'توافقات موضوع ماده ۲۳۸ ق.م.م',
    descriptionFa: 'پاداش پرونده‌های مختومه‌شده در مرحله توافق با رئیس امور مالیاتی (ماده ۲۳۸)',
    isNegative: false,
    unit: 'فقره',
    order: 4,
  },
  {
    key: 'AssessmentGrowth',
    frCode: 'FR-05',
    titleFa: 'رشد تشخیص نسبت به ابراز',
    descriptionFa: 'امتیاز ویژه پرونده‌های مختومه‌شده با رشد مالیات تشخیصی بیش از ۷۰۰٪ (حقوقی) و ۵۰۰٪ (حقیقی)',
    isNegative: false,
    unit: 'فقره',
    order: 5,
  },
  {
    key: 'TaxAdjustment',
    frCode: 'FR-06',
    titleFa: 'تعدیل مالیات قطعی نسبت به تشخیصی (کسورات)',
    descriptionFa: 'اعمال نمره منفی در صورت تعدیل و کاهش مالیات قطعی نسبت به تشخیصی بیش از ۱۵ درصد',
    isNegative: true,
    unit: 'فقره',
    order: 6,
  },
  {
    key: 'IssuanceSpeed',
    frCode: 'FR-07',
    titleFa: 'سرعت صدور برگ تشخیص از مرحله ۲',
    descriptionFa: 'سنجش روزهای سپری‌شده از ارجاع مرحله ۲؛ به ازای هر روز تاخیر ۰.۲۵ نمره کسر می‌گردد',
    isNegative: false,
    unit: 'روز/امتیاز',
    order: 7,
  },
  {
    key: 'FinalizationSpeed',
    frCode: 'FR-08',
    titleFa: 'سرعت قطعیت پرونده از مرحله ۲',
    descriptionFa: 'سنجش روزهای سپری‌شده از ارجاع مرحله ۲ تا ابلاغ برگ قطعی؛ با جریمه ۰.۲۵ نمره در روز تاخیر',
    isNegative: false,
    unit: 'روز/امتیاز',
    order: 8,
  },
]

export interface SrsAllowedDaysLimit {
  issuanceAllowedDays: number
  finalizationAllowedDays: number
}

export interface SrsRuleSetConfig {
  id: string
  code: string
  title: string
  description: string
  growthThresholdLegalEntity: number
  growthThresholdIndividual: number
  adjustmentThreshold: number
  dailyDelayPenalty: number
  top300TaxpayersCount: number
  majorCasesLabel?: string
  majorCasesTag?: string
  allowNegativeSpeedScore: boolean
  isActive: boolean
  weightsMatrix: Record<string, Record<string, number>>
  allowedDays: Record<string, SrsAllowedDaysLimit>
}

export interface SaveSrsRuleConfigRequest {
  title: string
  description: string
  growthThresholdLegalEntity: number
  growthThresholdIndividual: number
  adjustmentThreshold: number
  dailyDelayPenalty: number
  top300TaxpayersCount: number
  majorCasesLabel?: string
  majorCasesTag?: string
  allowNegativeSpeedScore: boolean
  isActive: boolean
  weightsMatrix: Record<string, Record<string, number>>
  allowedDays: Record<string, SrsAllowedDaysLimit>
}

export interface SrsIndicatorCategoryDetail {
  caseCount: number
  weight: number
  points: number
  avgActualDays?: number
  allowedDays?: number
  delayDays?: number
  deductionPoints?: number
}

export interface SrsIndicatorScore {
  indicatorCode: string
  indicatorTitle: string
  indicatorOrder: number
  isNegative: boolean
  totalPoints: number
  categoryDetails: Record<string, SrsIndicatorCategoryDetail>
}

export interface SrsEmployeeScorecard {
  auditorName: string
  auditorNationalId?: string
  photoUrl?: string
  officeName: string
  totalCases: number
  totalScore: number
  totalPositivePoints: number
  totalNegativeDeductions: number
  provincialRank: number
  performanceTier: 'A' | 'B' | 'C' | 'D'
  tierTitleFa: string
  majorCasesLabel?: string
  categorySummaries: Record<string, number>
  indicators: SrsIndicatorScore[]
}

export function getSrsCategoriesMeta(majorCasesLabel?: string): SrsCategoryMeta[] {
  const label = majorCasesLabel?.trim() || '۳۰۰ پرونده مهم'
  return [
    {
      key: 'Corporate300',
      titleFa: `اشخاص حقوقی - ${label}`,
      shortTitle: label,
      isLegal: true,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      key: 'CorporateOther',
      titleFa: 'سایر اشخاص حقوقی',
      shortTitle: 'سایر حقوقی',
      isLegal: true,
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      key: 'Vat300',
      titleFa: `ارزش افزوده ${label}`,
      shortTitle: `ارزش افزوده ${label}`,
      isLegal: true,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      key: 'VatLegalOther',
      titleFa: 'سایر ارزش افزوده حقوقی',
      shortTitle: 'سایر ار.افزوده حقوقی',
      isLegal: true,
      badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    },
    {
      key: 'BusinessIncome',
      titleFa: 'مالیات بر درآمد مشاغل (اشخاص حقیقی)',
      shortTitle: 'مشاغل (حقیقی)',
      isLegal: false,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      key: 'VatIndividual',
      titleFa: 'ارزش افزوده انفرادی (اشخاص حقیقی)',
      shortTitle: 'ارزش افزوده انفرادی',
      isLegal: false,
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    },
    {
      key: 'PropertyTax',
      titleFa: 'مالیات بر مستغلات و املاک',
      shortTitle: 'مستغلات / املاک',
      isLegal: false,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
  ]
}

export interface SampleImportantCaseRow {
  rowIndex: number
  taxpayerTin?: string
  taxpayerName?: string
  trackingCode?: string
  typeValue?: string
  existsInDatabase: boolean
}

export interface ImportantCasesInspectionResult {
  fileName: string
  totalRows: number
  columns: string[]
  detectedTinColumn?: string
  detectedTrackingColumn?: string
  detectedTypeColumn?: string
  distinctTinCount: number
  matchingDatabaseCasesCount: number
  taggedRowsCount: number
  sampleRows: SampleImportantCaseRow[]
}

export interface ImportantCasesUploadResult {
  success: boolean
  message: string
  totalExcelRows: number
  taggedTinCount: number
  updatedDatabaseCasesCount: number
  majorCasesLabel: string
  majorCasesTag: string
}

