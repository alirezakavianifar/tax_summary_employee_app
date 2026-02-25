import { apiClient } from './client'

export interface PayrollDetailRowDto {
  personnelNumber: string
  employeeName: string
  department: string
  overtimeRate?: number | null
  welfareRate?: number | null
  baseOvertimeAmount?: number | null
  baseWelfareAmount?: number | null
  baseBonusAmount?: number | null
  calculatedOvertimeAmount?: number | null
  calculatedWelfareAmount?: number | null
  calculatedBonusAmount?: number | null
}

export interface PayrollGroupedRowDto {
  department: string
  employeeCount: number
  baseOvertimePerPerson?: number | null
  baseOvertimeSum?: number | null
  baseWelfarePerPerson?: number | null
  baseWelfareSum?: number | null
  totalOvertimeAmount?: number | null
  totalWelfareAmount?: number | null
  bonusPerPerson?: number | null
  totalBonusSum?: number | null
}

export interface PayrollProcessResultDto {
  processType: string
  detailRows: PayrollDetailRowDto[]
  groupedRows: PayrollGroupedRowDto[]
}

export interface SavePayrollRunRequestDto {
  processType: string
  runLabel: string
  result: PayrollProcessResultDto
}

export interface PayrollRunSummaryDto {
  id: string
  processType: string
  runLabel: string
  rowCount: number
  createdAt: string
}

export const PROCESS_TYPE_LABELS: Record<string, string> = {
  OvertimeWelfareRated: 'ادغام و محاسبه اضافه کار و رفاهی',
  OvertimeWelfareMonetary: 'اضافه کار و رفاهی مبلغی',
  HalfPercentBonus: 'پردازش نیم درصد و تجمیع پاداش',
}

const PAYROLL_BASE = '/payroll'

export const payrollApi = {
  /**
   * Process payroll files. Returns the computed result.
   */
  processPayroll: async (formData: FormData): Promise<PayrollProcessResultDto> => {
    const response = await apiClient.post<PayrollProcessResultDto>(
      `${PAYROLL_BASE}/process`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data
  },

  /**
   * Export a payroll result to Excel. Returns a Blob for file download.
   */
  exportPayroll: async (result: PayrollProcessResultDto): Promise<Blob> => {
    const response = await apiClient.post(`${PAYROLL_BASE}/export`, result, {
      responseType: 'blob',
    })
    return response.data as Blob
  },

  /**
   * Save a payroll run to the database.
   */
  saveRun: async (dto: SavePayrollRunRequestDto): Promise<PayrollRunSummaryDto> => {
    const response = await apiClient.post<PayrollRunSummaryDto>(`${PAYROLL_BASE}/runs`, dto)
    return response.data
  },

  /**
   * List all saved payroll runs.
   */
  getRuns: async (): Promise<PayrollRunSummaryDto[]> => {
    const response = await apiClient.get<PayrollRunSummaryDto[]>(`${PAYROLL_BASE}/runs`)
    return response.data
  },

  /**
   * Get the full result for a saved run (for re-download).
   */
  getRunById: async (id: string): Promise<PayrollProcessResultDto> => {
    const response = await apiClient.get<PayrollProcessResultDto>(`${PAYROLL_BASE}/runs/${id}`)
    return response.data
  },

  /**
   * Delete a saved payroll run.
   */
  deleteRun: async (id: string): Promise<void> => {
    await apiClient.delete(`${PAYROLL_BASE}/runs/${id}`)
  },
}
