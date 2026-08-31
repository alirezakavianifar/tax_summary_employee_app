import { apiClient } from './client'

export interface PayrollCycleSummaryDto {
  id: string
  title: string
  processType: string
  fiscalYear: number
  fiscalMonth: number
  status: string
  deadline?: string | null
  createdAt: string
  createdByUsername: string
  totalDepartments: number
  submittedDepartments: number
  approvedDepartments: number
  totalEmployees: number
  totalOvertimeAmount: number
  totalWelfareAmount: number
  totalBonusAmount: number
}

export interface PayrollDepartmentEntrySummaryDto {
  id: string
  payrollCycleId: string
  departmentName: string
  status: string
  baseOvertimeCap?: number | null
  baseWelfareCap?: number | null
  baseBonusCap?: number | null
  employeeCount: number
  totalOvertimeAmount: number
  totalWelfareAmount: number
  totalBonusAmount: number
  submittedByUsername?: string | null
  submittedAt?: string | null
  approvedByUsername?: string | null
  approvedAt?: string | null
  rejectionReason?: string | null
  notes?: string | null
}

export interface PayrollCycleDetailDto {
  id: string
  title: string
  processType: string
  fiscalYear: number
  fiscalMonth: number
  status: string
  deadline?: string | null
  notes?: string | null
  createdAt: string
  createdByUsername: string
  finalizedAt?: string | null
  finalizedByUsername?: string | null
  departmentEntries: PayrollDepartmentEntrySummaryDto[]
}

export interface PayrollEmployeeItemDto {
  id: string
  departmentEntryId: string
  personnelNumber: string
  employeeName: string
  initialOvertimeRate?: number | null
  adjustedOvertimeRate?: number | null
  initialWelfareRate?: number | null
  adjustedWelfareRate?: number | null
  baseOvertimeAmount?: number | null
  baseWelfareAmount?: number | null
  baseBonusAmount?: number | null
  calculatedOvertimeAmount?: number | null
  calculatedWelfareAmount?: number | null
  officerNotes?: string | null
  isExcluded: boolean
}

export interface PayrollDepartmentEntryDto {
  id: string
  payrollCycleId: string
  cycleTitle: string
  processType: string
  cycleStatus: string
  cycleDeadline?: string | null
  departmentName: string
  status: string
  baseOvertimeCap?: number | null
  baseWelfareCap?: number | null
  baseBonusCap?: number | null
  submittedByUsername?: string | null
  submittedAt?: string | null
  approvedByUsername?: string | null
  approvedAt?: string | null
  rejectionReason?: string | null
  notes?: string | null
  employeeCount: number
  totalOvertimeAmount: number
  totalWelfareAmount: number
  totalBonusAmount: number
  items: PayrollEmployeeItemDto[]
}

export interface UpdateEmployeeItemAdjustmentDto {
  id: string
  adjustedOvertimeRate?: number | null
  adjustedWelfareRate?: number | null
  officerNotes?: string | null
  isExcluded: boolean
}

export interface SaveDepartmentDraftDto {
  notes?: string | null
  items: UpdateEmployeeItemAdjustmentDto[]
}

export interface SubmitDepartmentDto {
  notes?: string | null
  items?: UpdateEmployeeItemAdjustmentDto[]
}

export interface ReviewDepartmentDto {
  approve: boolean
  rejectionReason?: string | null
}

export const CYCLE_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  OpenForSubmission: { label: 'در حال دریافت اطلاعات ادارات', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  UnderReview: { label: 'در حال بررسی نهایی', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  Finalized: { label: 'نهایی و قفل شده', color: 'bg-green-100 text-green-800 border-green-200' },
  Draft: { label: 'پیش‌نویس', color: 'bg-gray-100 text-gray-800 border-gray-200' },
}

export const DEPT_STATUS_LABELS: Record<string, { label: string; color: string; dot: string }> = {
  Pending: { label: 'در انتظار تکمیل', color: 'bg-gray-100 text-gray-700 border-gray-200', dot: 'bg-gray-400' },
  Draft: { label: 'پیش‌نویس موقت', color: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-400' },
  Submitted: { label: 'ارسال شده جهت بررسی', color: 'bg-blue-100 text-blue-800 border-blue-200', dot: 'bg-blue-500' },
  Approved: { label: 'تایید شده', color: 'bg-green-100 text-green-800 border-green-200', dot: 'bg-green-500' },
  Rejected: { label: 'نیازمند اصلاح', color: 'bg-red-100 text-red-800 border-red-200', dot: 'bg-red-500' },
}

const CYCLES_BASE = '/payroll/cycles'

export const payrollCyclesApi = {
  createCycle: async (formData: FormData): Promise<PayrollCycleSummaryDto> => {
    const response = await apiClient.post<PayrollCycleSummaryDto>(CYCLES_BASE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  getCycles: async (): Promise<PayrollCycleSummaryDto[]> => {
    const response = await apiClient.get<PayrollCycleSummaryDto[]>(CYCLES_BASE)
    return response.data
  },

  getCycleById: async (id: string): Promise<PayrollCycleDetailDto> => {
    const response = await apiClient.get<PayrollCycleDetailDto>(`${CYCLES_BASE}/${id}`)
    return response.data
  },

  getDepartmentEntryById: async (departmentEntryId: string): Promise<PayrollDepartmentEntryDto> => {
    const response = await apiClient.get<PayrollDepartmentEntryDto>(`${CYCLES_BASE}/departments/${departmentEntryId}`)
    return response.data
  },

  getMyDepartmentEntries: async (): Promise<PayrollDepartmentEntrySummaryDto[]> => {
    const response = await apiClient.get<PayrollDepartmentEntrySummaryDto[]>(`${CYCLES_BASE}/my-departments`)
    return response.data
  },

  saveDraft: async (departmentEntryId: string, dto: SaveDepartmentDraftDto): Promise<PayrollDepartmentEntryDto> => {
    const response = await apiClient.put<PayrollDepartmentEntryDto>(`${CYCLES_BASE}/departments/${departmentEntryId}/draft`, dto)
    return response.data
  },

  submitDepartment: async (departmentEntryId: string, dto: SubmitDepartmentDto): Promise<PayrollDepartmentEntryDto> => {
    const response = await apiClient.post<PayrollDepartmentEntryDto>(`${CYCLES_BASE}/departments/${departmentEntryId}/submit`, dto)
    return response.data
  },

  reviewDepartment: async (departmentEntryId: string, dto: ReviewDepartmentDto): Promise<PayrollDepartmentEntryDto> => {
    const response = await apiClient.post<PayrollDepartmentEntryDto>(`${CYCLES_BASE}/departments/${departmentEntryId}/review`, dto)
    return response.data
  },

  finalizeCycle: async (id: string): Promise<PayrollCycleDetailDto> => {
    const response = await apiClient.post<PayrollCycleDetailDto>(`${CYCLES_BASE}/${id}/finalize`)
    return response.data
  },

  deleteCycle: async (id: string): Promise<void> => {
    await apiClient.delete(`${CYCLES_BASE}/${id}`)
  },

  exportDepartmentExcel: async (departmentEntryId: string): Promise<Blob> => {
    const response = await apiClient.get(`${CYCLES_BASE}/departments/${departmentEntryId}/export`, {
      responseType: 'blob',
    })
    return response.data as Blob
  },

  importDepartmentExcel: async (departmentEntryId: string, file: File): Promise<PayrollDepartmentEntryDto> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post<PayrollDepartmentEntryDto>(
      `${CYCLES_BASE}/departments/${departmentEntryId}/import`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data
  },

  exportMasterExcel: async (cycleId: string): Promise<Blob> => {
    const response = await apiClient.get(`${CYCLES_BASE}/${cycleId}/export-master`, {
      responseType: 'blob',
    })
    return response.data as Blob
  },
}
