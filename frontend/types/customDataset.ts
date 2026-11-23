export type CustomDatasetDataType = 'string' | 'currency' | 'number' | 'id' | 'year' | 'badge' | 'date'

export interface CustomDatasetColumn {
  fieldName: string
  originalHeader: string
  persianLabel: string
  dataType: CustomDatasetDataType
  isVisible: boolean
  isSortable: boolean
  hasAggregateSum: boolean
  aggregate?: 'Sum' | 'Average' | 'Count' | null
  alignment: 'right' | 'center' | 'left'
  displayOrder: number
  sampleValues: string[]
}

export interface ExcelInspectionResult {
  fileName: string
  fileSizeBytes: number
  sheetNames: string[]
  selectedSheet: string
  totalEstimatedRows: number
  suggestedReportCode: string
  suggestedReportTitle: string
  columns: CustomDatasetColumn[]
  sampleRows: Record<string, any>[]
}

export interface CreateCustomDatasetRequest {
  reportCode: string
  title: string
  description?: string
  domainSource: number
  sheetName?: string
  headerRowIndex?: number
  columns: CustomDatasetColumn[]
  quickFilterColumns: string[]
  defaultSortField?: string
  defaultSortDescending: boolean
  requiredRole?: string
  validityDays?: number | null
  expiresAt?: string | null
}

export interface TweakCustomReportRequest {
  title: string
  description?: string
  domainSource?: number
  requiredRole?: string
  validityDays?: number | null
  expiresAt?: string | null
  defaultSortField?: string
  defaultSortDescending: boolean
  quickFilterColumns: string[]
  columns: CustomDatasetColumn[]
}

export interface CustomDatasetConfig {
  datasetTableName: string
  originalFileName: string
  uploadedSheetName: string
  totalRowCount: number
  domainSource?: number
  expiresAt?: string | null
  isExpired?: boolean
  defaultSortField?: string
  defaultSortDescending: boolean
  quickFilterColumns: string[]
  columns: CustomDatasetColumn[]
}
