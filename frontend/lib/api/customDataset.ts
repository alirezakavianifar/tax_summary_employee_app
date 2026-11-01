import { apiClient } from './client'
import {
  ExcelInspectionResult,
  CreateCustomDatasetRequest,
  TweakCustomReportRequest,
  CustomDatasetConfig,
} from '@/types/customDataset'
import { ReportDefinition } from '@/types/reporting'

const BASE_URL = '/reporting/custom-datasets'

export const customDatasetApi = {
  /**
   * Previews and infers schema from an uploaded Excel file
   */
  async inspectExcel(file: File, sheetName?: string): Promise<ExcelInspectionResult> {
    const formData = new FormData()
    formData.append('file', file)

    const params: Record<string, string> = {}
    if (sheetName) params.sheetName = sheetName

    const res = await apiClient.post<ExcelInspectionResult>(`${BASE_URL}/inspect`, formData, {
      params,
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  /**
   * Ingests Excel dataset into SQLite and registers ReportDefinition
   */
  async createCustomDataset(file: File, request: CreateCustomDatasetRequest): Promise<ReportDefinition> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('requestJson', JSON.stringify(request))

    const res = await apiClient.post<ReportDefinition>(`${BASE_URL}/create`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  /**
   * Gets current configuration metadata for tweaking
   */
  async getConfig(reportCode: string): Promise<CustomDatasetConfig> {
    const res = await apiClient.get<CustomDatasetConfig>(`${BASE_URL}/${reportCode}/config`)
    return res.data
  },

  /**
   * Tweaks column labels, visibility, ordering, data types, aggregates, and quick filters
   */
  async tweakReport(reportCode: string, request: TweakCustomReportRequest): Promise<ReportDefinition> {
    const res = await apiClient.put<ReportDefinition>(`${BASE_URL}/${reportCode}/tweak`, request)
    return res.data
  },

  /**
   * Appends additional rows from Excel to existing dataset
   */
  async appendRows(
    reportCode: string,
    file: File,
    sheetName?: string
  ): Promise<{ message: string; appendedCount: number }> {
    const formData = new FormData()
    formData.append('file', file)

    const params: Record<string, string> = {}
    if (sheetName) params.sheetName = sheetName

    const res = await apiClient.post<{ message: string; appendedCount: number }>(
      `${BASE_URL}/${reportCode}/append`,
      formData,
      {
        params,
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    )
    return res.data
  },

  /**
   * Overwrites/replaces all dataset rows with new Excel file
   */
  async replaceRows(
    reportCode: string,
    file: File,
    sheetName?: string
  ): Promise<{ message: string; newCount: number }> {
    const formData = new FormData()
    formData.append('file', file)

    const params: Record<string, string> = {}
    if (sheetName) params.sheetName = sheetName

    const res = await apiClient.post<{ message: string; newCount: number }>(
      `${BASE_URL}/${reportCode}/replace`,
      formData,
      {
        params,
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    )
    return res.data
  },

  /**
   * Drops dataset table and deletes report definition
   */
  async deleteReport(reportCode: string): Promise<{ message: string }> {
    const res = await apiClient.delete<{ message: string }>(`${BASE_URL}/${reportCode}`)
    return res.data
  },
}
