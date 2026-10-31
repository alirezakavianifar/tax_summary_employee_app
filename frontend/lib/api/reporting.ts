import { apiClient } from './client'
import {
  ExecutiveDashboard,
  ExecutiveKpiMetrics,
  MonthlyTrendPoint,
  TopDepartmentBudget,
  ReportDefinition,
  ReportFilterParameters,
  ReportExecutionResult,
  DynamicReportQueryRequest,
  DynamicReportResult,
  DynamicQueryMetadata,
  SavedReportPreset,
} from '@/types/reporting'

const BASE_URL = '/reporting'

export const reportingApi = {
  // 1. Executive Analytics
  async getDashboard(params?: { fiscalYear?: number; payrollCycleId?: string; officeId?: string }): Promise<ExecutiveDashboard> {
    const res = await apiClient.get<ExecutiveDashboard>(`${BASE_URL}/executive/dashboard`, { params })
    return res.data
  },

  async getKpis(fiscalYear?: number): Promise<ExecutiveKpiMetrics> {
    const res = await apiClient.get<ExecutiveKpiMetrics>(`${BASE_URL}/executive/kpis`, { params: { fiscalYear } })
    return res.data
  },

  async getMonthlyTrends(fiscalYear?: number): Promise<MonthlyTrendPoint[]> {
    const res = await apiClient.get<MonthlyTrendPoint[]>(`${BASE_URL}/executive/trends`, { params: { fiscalYear } })
    return res.data
  },

  async getDepartmentBudgets(payrollCycleId?: string): Promise<TopDepartmentBudget[]> {
    const res = await apiClient.get<TopDepartmentBudget[]>(`${BASE_URL}/executive/departments`, { params: { payrollCycleId } })
    return res.data
  },

  // 2. Standard Reports
  async getCatalog(source?: number): Promise<ReportDefinition[]> {
    const res = await apiClient.get<ReportDefinition[]>(`${BASE_URL}/standard/catalog`, { params: { source } })
    return res.data
  },

  async executeStandardReport(code: string, params: ReportFilterParameters): Promise<ReportExecutionResult> {
    const res = await apiClient.post<ReportExecutionResult>(`${BASE_URL}/standard/${code}/execute`, params)
    return res.data
  },

  async exportStandardReportExcel(code: string, params: ReportFilterParameters, fileName?: string): Promise<void> {
    const res = await apiClient.post(`${BASE_URL}/standard/${code}/export/excel`, params, {
      responseType: 'blob',
    })
    downloadBlob(res.data, fileName || `${code}_Report.xlsx`)
  },

  // 3. Dynamic Query Builder
  async getQueryMetadata(source: number): Promise<DynamicQueryMetadata> {
    const res = await apiClient.get<DynamicQueryMetadata>(`${BASE_URL}/builder/metadata/${source}`)
    return res.data
  },

  async executeDynamicQuery(request: DynamicReportQueryRequest): Promise<DynamicReportResult> {
    const res = await apiClient.post<DynamicReportResult>(`${BASE_URL}/builder/query`, request)
    return res.data
  },

  async exportDynamicQueryExcel(request: DynamicReportQueryRequest, fileName?: string): Promise<void> {
    const res = await apiClient.post(`${BASE_URL}/builder/export/excel`, request, {
      responseType: 'blob',
    })
    downloadBlob(res.data, fileName || 'Dynamic_Query_Report.xlsx')
  },

  // 4. Saved Presets
  async getSavedPresets(reportDefinitionId?: string): Promise<SavedReportPreset[]> {
    const res = await apiClient.get<SavedReportPreset[]>(`${BASE_URL}/saved`, { params: { reportDefinitionId } })
    return res.data
  },

  async savePreset(data: {
    reportDefinitionId: string
    presetName: string
    filterCriteriaJson: string
    visibleColumnsJson?: string | null
    isSharedWithOffice?: boolean
    officeId?: string | null
  }): Promise<SavedReportPreset> {
    const res = await apiClient.post<SavedReportPreset>(`${BASE_URL}/saved`, data)
    return res.data
  },

  async updatePreset(
    id: string,
    data: {
      presetName: string
      filterCriteriaJson: string
      visibleColumnsJson?: string | null
      isSharedWithOffice?: boolean
      officeId?: string | null
    }
  ): Promise<void> {
    await apiClient.put(`${BASE_URL}/saved/${id}`, data)
  },

  async deletePreset(id: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/saved/${id}`)
  },
}

function downloadBlob(data: BlobPart, filename: string) {
  if (typeof window === 'undefined') return
  const url = window.URL.createObjectURL(new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.parentNode?.removeChild(link)
  window.URL.revokeObjectURL(url)
}
