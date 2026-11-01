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
  sheetName?: string
  headerRowIndex?: number
  columns: CustomDatasetColumn[]
  quickFilterColumns: string[]
  defaultSortField?: string
  defaultSortDescending: boolean
  requiredRole?: string
}

export interface TweakCustomReportRequest {
  title: string
  description?: string
  requiredRole?: string
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
  defaultSortField?: string
  defaultSortDescending: boolean
  quickFilterColumns: string[]
  columns: CustomDatasetColumn[]
}
