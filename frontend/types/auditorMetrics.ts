export type AuditorMetricCategory = 1 | 2 | 3 | 4 // 1=Quality, 2=Financial, 3=Speed, 4=Productivity

export type AuditorMetricFormulaType = 1 | 2 | 3 | 4 | 5 | 6 // 1=Ratio, 2=Difference, 3=Average, 4=Count, 5=Percentage, 6=Custom

export interface AuditorPerformanceMetric {
  id: string
  metricCode: string
  title: string
  description: string
  category: AuditorMetricCategory
  categoryTitle: string
  formulaType: AuditorMetricFormulaType
  primaryField: string
  secondaryField?: string
  multiplier: number
  weightPercentage: number
  higherIsBetter: boolean
  targetValue: number
  warningThreshold: number
  criticalThreshold: number
  unit: string
  displayOrder: number
  isActive: boolean
  tierThresholdsJson: string
}

export interface SaveAuditorMetricRequest {
  id?: string
  metricCode: string
  title: string
  description: string
  category: AuditorMetricCategory
  formulaType: AuditorMetricFormulaType
  primaryField: string
  secondaryField?: string
  multiplier: number
  weightPercentage: number
  higherIsBetter: boolean
  targetValue: number
  warningThreshold: number
  criticalThreshold: number
  unit: string
  displayOrder: number
  isActive: boolean
  tierThresholdsJson?: string
}

export interface MetricValueResult {
  metricCode: string
  title: string
  rawValue: number
  formattedValue: string
  unit: string
  normalizedScore: number
  weightPercentage: number
  weightedScore: number
  statusBand: 'Target' | 'Warning' | 'Critical'
}

export interface AuditorScorecard {
  auditorName: string
  auditorNationalId?: string
  officeName: string
  totalAssignedCases: number
  completedCases: number
  totalDeclaredAmount: number
  totalAssessedAmount: number
  totalFinalAmount: number
  compositeScore: number
  performanceTier: 'A' | 'B' | 'C' | 'D'
  tierTitleFa: string
  provincialRank: number
  metricValues: MetricValueResult[]
}

export interface AuditorOfficeBreakdown {
  officeName: string
  caseCount: number
  totalAssessed: number
  totalFinal: number
}

export interface Auditor360Profile {
  scorecard: AuditorScorecard
  highRiskCasesCount: number
  mediumRiskCasesCount: number
  lowRiskCasesCount: number
  averageDaysAssignmentToNotice: number
  averageDaysNoticeToFinal: number
  netTaxGapAddition: number
  defensibilityRate: number
  officeBreakdowns: AuditorOfficeBreakdown[]
}

export interface AuditorMetricsSimulationResult {
  metricCode: string
  provincialAverage: number
  minValue: number
  maxValue: number
  totalAuditorsEvaluated: number
  topPerformers: AuditorScorecard[]
  bottomPerformers: AuditorScorecard[]
}
