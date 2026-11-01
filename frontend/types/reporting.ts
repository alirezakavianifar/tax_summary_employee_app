export type ReportDomainSource = 1 | 2 | 3 | 4 | 5 | 6 // 1: HR, 2: Payroll, 3: Refunds, 4: CrossSystem, 5: TaxAudit, 6: CustomExcel
export type ReportCategory = 1 | 2 | 3 | 4     // 1: KPI, 2: Operational, 3: Financial, 4: Audit
export type ReportType = 1 | 2 | 3             // 1: Tabular, 2: Pivot, 3: SummaryKpi

export const DOMAIN_SOURCE_NAMES_FA: Record<number, string> = {
  1: 'ارزیابی و منابع انسانی',
  2: 'حقوق، اضافه کار و رفاهی',
  3: 'استرداد مالیات مواد ۲۴۲ و ۲۴۳',
  4: 'تلفیقی و فرابخشی',
  5: 'رسیدگی و حسابرسی مالیاتی سنیم',
  6: 'داده‌های بارگذاری شده از اکسل',
}

export const CATEGORY_NAMES_FA: Record<number, string> = {
  1: 'شاخص‌های کلیدی (KPI)',
  2: 'عملیاتی و کارتابل‌ها',
  3: 'مالی و بودجه',
  4: 'نظارت، تطبیق و ممیزی',
}

export interface ExecutiveDashboard {
  kpiMetrics: ExecutiveKpiMetrics
  monthlyTrends: MonthlyTrendPoint[]
  topDepartmentBudgets: TopDepartmentBudget[]
  taxSourceRefundDistribution: TaxSourceDistribution[]
  recentAuditActivities: RecentAuditActivity[]
}

export interface ExecutiveKpiMetrics {
  totalEmployeesActive: number
  totalEvaluationsRecorded: number
  totalEvasionIdentifiedAmount: number
  currentMonthApprovedBudget: number
  currentMonthActualSpent: number
  budgetUtilizationPercentage: number
  totalOvertimeHoursRecorded: number
  laborCapViolationsCount: number
  activeRefundCasesCount: number
  totalRefundClaimedAmount: number
  totalRefundApprovedAmount: number
  totalDelayInterestPaid: number
  averageProcessingDays: number
}

export interface MonthlyTrendPoint {
  monthNameShamsi: string
  overtimeAmount: number
  welfareAmount: number
  refundAmount: number
}

export interface TopDepartmentBudget {
  departmentName: string
  allocatedBudget: number
  consumedAmount: number
  variance: number
  hasViolation: boolean
  employeeCount: number
  averageOvertimePerCapita: number
}

export interface TaxSourceDistribution {
  taxSourceCode: string
  taxSourcePersianTitle: string
  caseCount: number
  totalApprovedRefundAmount: number
  totalDelayInterestAmount: number
}

export interface RecentAuditActivity {
  action: string
  username: string
  description: string
  timestamp: string
  shamsiTimestamp: string
}

export interface ReportDefinition {
  id: string
  code: string
  title: string
  description: string
  domainSource: ReportDomainSource
  category: ReportCategory
  type: ReportType
  isSystemReport: boolean
  isActive: boolean
  requiredRole?: string | null
  columns: ReportColumnMetadata[]
}

export interface ReportColumnMetadata {
  fieldName: string
  persianLabel: string
  dataType: 'string' | 'number' | 'currency' | 'date' | 'badge' | 'year' | 'id' | 'code'
  isVisible: boolean
  isSortable: boolean
  hasAggregateSum: boolean
  alignment: 'right' | 'center' | 'left'
}

export interface ReportFilterParameters {
  shamsiDateFrom?: string
  shamsiDateTo?: string
  officeId?: string
  department?: string
  payrollCycleId?: string
  caseStatus?: string
  taxSourceCode?: string
  fiscalYear?: number
  searchTerm?: string
  auditorName?: string
  pageNumber: number
  pageSize: number
  sortBy?: string
  sortDescending?: boolean
}

export interface ReportExecutionResult {
  reportCode: string
  reportTitle: string
  executedAt: string
  columns: ReportColumnMetadata[]
  rows: Record<string, any>[]
  summaryAggregates: Record<string, any>
  totalRowCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

export interface DynamicReportQueryRequest {
  domainSource: ReportDomainSource
  selectedFields: string[]
  filters: DynamicFilterCondition[]
  groupByField?: string | null
  sortField?: string | null
  sortDescending?: boolean
  pageNumber: number
  pageSize: number
}

export interface DynamicFilterCondition {
  fieldName: string
  operator: 'equals' | 'notequals' | 'greaterthan' | 'lessthan' | 'contains'
  value: string
  secondValue?: string
}

export interface DynamicReportResult {
  columns: ReportColumnMetadata[]
  rows: Record<string, any>[]
  globalAggregates: Record<string, any>
  totalRows: number
}

export interface QueryableField {
  key: string
  persianLabel: string
  category: string
  dataType: string
  canFilter: boolean
  canGroup: boolean
  canAggregate: boolean
}

export interface DynamicQueryMetadata {
  source: ReportDomainSource
  sourcePersianName: string
  availableFields: QueryableField[]
}

export interface SavedReportPreset {
  id: string
  reportDefinitionId: string
  reportCode: string
  presetName: string
  filterCriteriaJson: string
  visibleColumnsJson?: string | null
  isSharedWithOffice: boolean
  officeId?: string | null
  createdAt: string
}
