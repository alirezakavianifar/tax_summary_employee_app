import { apiClient } from './client'
import {
  AuditorPerformanceMetric,
  SaveAuditorMetricRequest,
  AuditorScorecard,
  Auditor360Profile,
  AuditorMetricsSimulationResult,
  AuditDataSource,
} from '@/types/auditorMetrics'
import {
  SrsRuleSetConfig,
  SaveSrsRuleConfigRequest,
  SrsEmployeeScorecard,
  ImportantCasesInspectionResult,
  ImportantCasesUploadResult,
} from '@/types/srsAuditorMetrics'

const BASE_URL = '/reporting/auditors'

export const auditorMetricsApi = {
  /**
   * دریافت منابع داده ارزیابی حسابرسی (پایگاه داده اصلی و گزارش‌های اکسل بارگذاری‌شده)
   */
  async getDataSources(): Promise<AuditDataSource[]> {
    const res = await apiClient.get<AuditDataSource[]>(`${BASE_URL}/sources`)
    return res.data
  },

  /**
   * دریافت تمامی شاخص‌های ارزیابی عملکرد حسابرسان
   */
  async getMetrics(includeInactive: boolean = true): Promise<AuditorPerformanceMetric[]> {
    const res = await apiClient.get<AuditorPerformanceMetric[]>(`${BASE_URL}/metrics`, {
      params: { includeInactive },
    })
    return res.data
  },

  /**
   * ایجاد یا ویرایش تعریف یک شاخص ارزیابی توسط مدیر
   */
  async saveMetric(request: SaveAuditorMetricRequest): Promise<AuditorPerformanceMetric> {
    const res = await apiClient.post<AuditorPerformanceMetric>(`${BASE_URL}/metrics`, request)
    return res.data
  },

  /**
   * فعال/غیرفعال کردن یک شاخص
   */
  async toggleMetric(id: string, isActive: boolean): Promise<{ success: boolean; isActive: boolean }> {
    const res = await apiClient.patch<{ success: boolean; isActive: boolean }>(
      `${BASE_URL}/metrics/${id}/toggle`,
      { isActive }
    )
    return res.data
  },

  /**
   * حذف یک شاخص سفارشی تعریف‌شده
   */
  async deleteMetric(id: string): Promise<{ success: boolean }> {
    const res = await apiClient.delete<{ success: boolean }>(`${BASE_URL}/metrics/${id}`)
    return res.data
  },

  /**
   * شبیه‌سازی زنده اثر تغییر فرمول یا وزن بر پرونده‌های پایگاه داده یا گزارش اکسل
   */
  async simulateMetric(
    request: SaveAuditorMetricRequest,
    fiscalYear?: number,
    reportCode?: string
  ): Promise<AuditorMetricsSimulationResult> {
    const res = await apiClient.post<AuditorMetricsSimulationResult>(
      `${BASE_URL}/metrics/simulate`,
      request,
      { params: { fiscalYear, reportCode } }
    )
    return res.data
  },

  /**
   * دریافت ارزیابی و رتبه‌بندی عملکرد تمامی حسابرسان
   */
  async evaluateAuditors(params?: {
    fiscalYear?: number
    officeName?: string
    reportCode?: string
  }): Promise<AuditorScorecard[]> {
    const res = await apiClient.get<AuditorScorecard[]>(`${BASE_URL}/evaluation`, { params })
    return res.data
  },

  /**
   * دریافت کارنامه جامع و پرونده ۳۶۰ درجه عملکرد یک حسابرس مشخص
   */
  async getAuditorProfile(
    auditorName: string,
    fiscalYear?: number,
    reportCode?: string
  ): Promise<Auditor360Profile> {
    const res = await apiClient.get<Auditor360Profile>(
      `${BASE_URL}/profile/${encodeURIComponent(auditorName)}`,
      { params: { fiscalYear, reportCode } }
    )
    return res.data
  },

  /**
   * دریافت پیکربندی فعال و ماتریس اوزان دستورالعمل ارزیابی عملکرد (SRS)
   */
  async getSrsRules(): Promise<SrsRuleSetConfig> {
    const res = await apiClient.get<SrsRuleSetConfig>(`${BASE_URL}/srs/rules`)
    return res.data
  },

  /**
   * ذخیره و به‌روزرسانی قواعد و ماتریس اوزان دستورالعمل ارزیابی عملکرد
   */
  async saveSrsRules(request: SaveSrsRuleConfigRequest): Promise<SrsRuleSetConfig> {
    const res = await apiClient.put<SrsRuleSetConfig>(`${BASE_URL}/srs/rules`, request)
    return res.data
  },

  /**
   * بازنشانی قواعد و ماتریس اوزان به مقادیر پیش‌فرض بخشنامه (SRS v1.0)
   */
  async resetSrsRules(): Promise<SrsRuleSetConfig> {
    const res = await apiClient.post<SrsRuleSetConfig>(`${BASE_URL}/srs/rules/reset`)
    return res.data
  },

  /**
   * ارزیابی و رتبه‌بندی استانی حسابرسان بر اساس قواعد امتیازی دستورالعمل ارزیابی عملکرد (SRS)
   */
  async evaluateAuditorsSrs(params?: {
    fiscalYear?: number
    officeName?: string
    reportCode?: string
  }): Promise<SrsEmployeeScorecard[]> {
    const res = await apiClient.get<SrsEmployeeScorecard[]>(`${BASE_URL}/srs/evaluation`, { params })
    return res.data
  },

  /**
   * دریافت کارنامه تفصیلی و ریزامتیازات ماتریسی ۸ در ۷ یک حسابرس بر اساس دستورالعمل ارزیابی عملکرد
   */
  async getAuditorSrsScorecard(
    auditorName: string,
    fiscalYear?: number,
    reportCode?: string
  ): Promise<SrsEmployeeScorecard> {
    const res = await apiClient.get<SrsEmployeeScorecard>(
      `${BASE_URL}/srs/scorecard/${encodeURIComponent(auditorName)}`,
      { params: { fiscalYear, reportCode } }
    )
    return res.data
  },

  /**
   * همگام‌سازی پرونده‌های ۳۰۰ پرونده مهم و ۱۰۰ پرونده از فایل اکسل سنیم در پایگاه داده
   */
  async sync300Cases(): Promise<{ message: string; updatedCount: number }> {
    const res = await apiClient.post<{ message: string; updatedCount: number }>(
      `${BASE_URL}/srs/sync-300-cases`
    )
    return res.data
  },

  /**
   * پیش‌نمایش و بررسی ساختار و رکوردهای فایل اکسل پرونده‌های مهم
   */
  async inspectImportantCases(formData: FormData): Promise<ImportantCasesInspectionResult> {
    const res = await apiClient.post<ImportantCasesInspectionResult>(
      `${BASE_URL}/srs/inspect-important-cases`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return res.data
  },

  /**
   * بارگذاری، برچسب‌گذاری و همگام‌سازی پرونده‌های مهم با عناوین و تگ‌های دلخواه
   */
  async uploadImportantCases(formData: FormData): Promise<ImportantCasesUploadResult> {
    const res = await apiClient.post<ImportantCasesUploadResult>(
      `${BASE_URL}/srs/upload-important-cases`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return res.data
  },

  /**
   * دریافت و دانلود مستقیم فایل اکسل دوبرگه‌ای راستی‌آزمایی رتبه‌بندی عملکرد (داده‌های خام + فرمول‌های رتبه‌بندی)
   */
  async exportSrsVerificationExcel(params?: {
    fiscalYear?: number
    officeName?: string
    reportCode?: string
  }): Promise<void> {
    const res = await apiClient.get(`${BASE_URL}/srs/export-verification-excel`, {
      params,
      responseType: 'blob',
      timeout: 180000, // 3 minutes timeout for large verification workbooks
    })
    const fileName = `Auditor_SRS_Verification_${Date.now()}.xlsx`
    downloadBlob(res.data, fileName)
  },

  /**
   * بارگذاری مستقیم فایل اکسل خام سنیم و دریافت بلافاصله خروجی راستی‌آزمایی دوبرگه‌ای
   */
  async uploadAndExportVerification(file: File): Promise<void> {
    const formData = new FormData()
    formData.append('file', file)
    const res = await apiClient.post(`${BASE_URL}/srs/upload-and-export-verification`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      responseType: 'blob',
      timeout: 180000, // 3 minutes timeout for processing & generating verification workbook
    })
    const safeName = file.name.replace(/\.[^/.]+$/, '')
    const fileName = `Sanim_Verification_${safeName}_${Date.now()}.xlsx`
    downloadBlob(res.data, fileName)
  },
}

function downloadBlob(data: BlobPart, filename: string) {
  const url = window.URL.createObjectURL(
    new Blob([data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
  )
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
