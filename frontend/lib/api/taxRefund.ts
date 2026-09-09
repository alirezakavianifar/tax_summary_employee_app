import { apiClient } from './client'
import type {
  TaxRefundCase,
  TaxRefundCaseSummary,
  TaxRefundReceipt,
  RefundableReceiptAllocation,
  TaxRefundLetter,
  TaxAssessmentInfo,
  RefundBreakdown,
  RefundCalculationResult,
  CreateTaxRefundCaseInput,
  UpdateTaxRefundCaseInput,
  CalculateRefundRequest,
  TransitionStatusInput,
  TaxRefundFilter,
  PrintableDocument,
  TaxRefundDocument,
  UploadTaxRefundDocumentInput,
  JustificationReport,
  UpdateJustificationReportInput,
  FinalizeJustificationReportInput,
} from '@/types/taxRefund'

export const taxRefundApi = {
  /**
   * Interactive real-time sandbox calculation without database persistence
   */
  async calculateSandbox(request: CalculateRefundRequest): Promise<RefundCalculationResult> {
    const response = await apiClient.post<RefundCalculationResult>('/tax-refunds/calculate', request)
    return response.data
  },

  /**
   * Get filtered or paginated list of tax refund cases
   */
  async getCases(filter?: TaxRefundFilter): Promise<TaxRefundCaseSummary[]> {
    const response = await apiClient.get<TaxRefundCaseSummary[]>('/tax-refunds', { params: filter })
    return response.data
  },

  /**
   * Get full tax refund case by ID
   */
  async getCaseById(id: string): Promise<TaxRefundCase> {
    const response = await apiClient.get<TaxRefundCase>(`/tax-refunds/${id}`)
    return response.data
  },

  /**
   * Get tax refund case by unique tracking number
   */
  async getCaseByTracking(trackingNumber: string): Promise<TaxRefundCase> {
    const response = await apiClient.get<TaxRefundCase>(`/tax-refunds/tracking/${encodeURIComponent(trackingNumber)}`)
    return response.data
  },

  /**
   * Create a new draft refund case
   */
  async createCase(data: CreateTaxRefundCaseInput): Promise<TaxRefundCase> {
    const response = await apiClient.post<TaxRefundCase>('/tax-refunds', data)
    return response.data
  },

  /**
   * Update taxpayer and general case info
   */
  async updateCase(id: string, data: UpdateTaxRefundCaseInput): Promise<void> {
    await apiClient.put(`/tax-refunds/${id}`, data)
  },

  /**
   * Full atomic update of a tax refund case across all 6 steps
   */
  async updateFullCase(id: string, data: CreateTaxRefundCaseInput): Promise<void> {
    await apiClient.put(`/tax-refunds/${id}/full`, data)
  },

  /**
   * Delete refund case
   */
  async deleteCase(id: string): Promise<void> {
    await apiClient.delete(`/tax-refunds/${id}`)
  },

  /**
   * Update tax assessment info
   */
  async updateAssessment(id: string, data: Partial<TaxAssessmentInfo>): Promise<void> {
    await apiClient.put(`/tax-refunds/${id}/assessment`, data)
  },

  /**
   * Update refund breakdown figures
   */
  async updateBreakdown(id: string, data: Partial<RefundBreakdown>): Promise<void> {
    await apiClient.put(`/tax-refunds/${id}/breakdown`, data)
  },

  /**
   * Add a receipt to Table A
   */
  async addReceipt(id: string, receipt: Partial<TaxRefundReceipt>): Promise<TaxRefundReceipt> {
    const response = await apiClient.post<TaxRefundReceipt>(`/tax-refunds/${id}/receipts`, receipt)
    return response.data
  },

  /**
   * Remove a receipt from Table A
   */
  async removeReceipt(id: string, receiptId: string): Promise<void> {
    await apiClient.delete(`/tax-refunds/${id}/receipts/${receiptId}`)
  },

  /**
   * Add an allocation to Table B
   */
  async addAllocation(id: string, alloc: Partial<RefundableReceiptAllocation>): Promise<RefundableReceiptAllocation> {
    const response = await apiClient.post<RefundableReceiptAllocation>(`/tax-refunds/${id}/allocations`, alloc)
    return response.data
  },

  /**
   * Remove an allocation from Table B
   */
  async removeAllocation(id: string, allocationId: string): Promise<void> {
    await apiClient.delete(`/tax-refunds/${id}/allocations/${allocationId}`)
  },

  /**
   * Add an inquiry letter or administrative correspondence
   */
  async addLetter(id: string, letter: Partial<TaxRefundLetter>): Promise<TaxRefundLetter> {
    const response = await apiClient.post<TaxRefundLetter>(`/tax-refunds/${id}/letters`, letter)
    return response.data
  },

  /**
   * Remove an inquiry letter
   */
  async removeLetter(id: string, letterId: string): Promise<void> {
    await apiClient.delete(`/tax-refunds/${id}/letters/${letterId}`)
  },

  /**
   * Submit workflow approval action / status transition
   */
  async transitionStatus(id: string, input: TransitionStatusInput): Promise<void> {
    await apiClient.post(`/tax-refunds/${id}/approvals`, input)
  },

  /**
   * Get pre-formatted view-model for any of the 8 forms
   */
  async getPrintableDocument(id: string, formType: string): Promise<PrintableDocument> {
    const response = await apiClient.get<PrintableDocument>(`/tax-refunds/${id}/print/${formType}`)
    return response.data
  },

  /**
   * Upload and import Excel workbook (.xlsm or .xlsx)
   */
  async importExcel(file: File): Promise<TaxRefundCase> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.post<TaxRefundCase>('/tax-refunds/import-excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  /**
   * Download authentic 9-sheet formula-wired Excel file
   */
  async exportExcel(id: string): Promise<Blob> {
    const response = await apiClient.get(`/tax-refunds/${id}/export-excel`, {
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Upload and attach a supporting PDF document to a refund case
   */
  async uploadDocument(
    caseId: string,
    file: File,
    meta: UploadTaxRefundDocumentInput
  ): Promise<TaxRefundDocument> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', meta.title)
    formData.append('documentType', meta.documentType.toString())
    if (meta.description) formData.append('description', meta.description)
    if (meta.relatedReceiptId) formData.append('relatedReceiptId', meta.relatedReceiptId)
    if (meta.relatedLetterId) formData.append('relatedLetterId', meta.relatedLetterId)

    const response = await apiClient.post<TaxRefundDocument>(
      `/tax-refunds/${caseId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },

  /**
   * Get all attached documents for a refund case
   */
  async getDocuments(caseId: string): Promise<TaxRefundDocument[]> {
    const response = await apiClient.get<TaxRefundDocument[]>(`/tax-refunds/${caseId}/documents`)
    return response.data
  },

  /**
   * Get direct view URL for inline streaming of a PDF document with optional auth token
   */
  getDocumentViewUrl(caseId: string, documentId: string, token?: string | null): string {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
    const query = token ? `?token=${encodeURIComponent(token)}` : ''
    return `${base}/tax-refunds/${caseId}/documents/${documentId}/view${query}`
  },

  /**
   * Fetch PDF document as a binary Blob using authenticated client
   */
  async getDocumentBlob(caseId: string, documentId: string): Promise<Blob> {
    const response = await apiClient.get(
      `/tax-refunds/${caseId}/documents/${documentId}/view`,
      { responseType: 'blob' }
    )
    return new Blob([response.data], { type: 'application/pdf' })
  },

  /**
   * Download PDF document file directly
   */
  async downloadDocument(caseId: string, documentId: string, fileName: string): Promise<void> {
    const response = await apiClient.get(`/tax-refunds/${caseId}/documents/${documentId}/download`, {
      responseType: 'blob',
    })
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const a = document.createElement('a')
    a.href = url
    a.download = fileName || 'document.pdf'
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  },

  /**
   * Delete an attached document
   */
  async deleteDocument(caseId: string, documentId: string): Promise<void> {
    await apiClient.delete(`/tax-refunds/${caseId}/documents/${documentId}`)
  },

  /**
   * Get official Justification Report (گزارش توجیهی)
   */
  async getJustificationReport(caseId: string): Promise<JustificationReport> {
    const response = await apiClient.get<JustificationReport>(`/tax-refunds/${caseId}/justification-report`)
    return response.data
  },

  /**
   * Auto-generate standard legal template draft for Justification Report
   */
  async getDefaultJustificationReportDraft(caseId: string): Promise<JustificationReport> {
    const response = await apiClient.get<JustificationReport>(`/tax-refunds/${caseId}/justification-report/default-draft`)
    return response.data
  },

  /**
   * Save or update Justification Report draft
   */
  async saveJustificationReport(caseId: string, input: UpdateJustificationReportInput): Promise<JustificationReport> {
    const response = await apiClient.put<JustificationReport>(`/tax-refunds/${caseId}/justification-report`, input)
    return response.data
  },

  /**
   * Finalize Justification Report and advance case status to Audited
   */
  async finalizeJustificationReport(caseId: string, input?: FinalizeJustificationReportInput): Promise<JustificationReport> {
    const response = await apiClient.post<JustificationReport>(`/tax-refunds/${caseId}/justification-report/finalize`, input || {})
    return response.data
  },
}
