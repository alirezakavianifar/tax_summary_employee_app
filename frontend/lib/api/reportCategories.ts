import { apiClient } from './client'

export interface ReportCategoryItem {
  id: number
  code: string
  title: string
  description?: string
  isActive: boolean
  displayOrder: number
  isSystem: boolean
  reportCount: number
  createdAt: string
  updatedAt?: string
}

export interface CreateReportCategoryDto {
  code: string
  title: string
  description?: string
  displayOrder: number
}

export interface UpdateReportCategoryDto {
  title: string
  description?: string
  displayOrder: number
  isActive: boolean
}

const BASE_URL = '/reporting/categories'

export const reportCategoriesApi = {
  /**
   * Get all active report categories (for catalog tabs and upload modal dropdown)
   */
  async getActive(): Promise<ReportCategoryItem[]> {
    const res = await apiClient.get<ReportCategoryItem[]>(BASE_URL)
    return res.data
  },

  /**
   * Get all report categories including inactive ones with report counts (Admin only)
   */
  async getAllForManagement(): Promise<ReportCategoryItem[]> {
    const res = await apiClient.get<ReportCategoryItem[]>(`${BASE_URL}/management`)
    return res.data
  },

  /**
   * Get category by ID
   */
  async getById(id: number): Promise<ReportCategoryItem> {
    const res = await apiClient.get<ReportCategoryItem>(`${BASE_URL}/${id}`)
    return res.data
  },

  /**
   * Create a new custom report category (Admin only)
   */
  async create(dto: CreateReportCategoryDto): Promise<ReportCategoryItem> {
    const res = await apiClient.post<ReportCategoryItem>(BASE_URL, dto)
    return res.data
  },

  /**
   * Update category details (title, description, displayOrder, isActive) (Admin only)
   */
  async update(id: number, dto: UpdateReportCategoryDto): Promise<ReportCategoryItem> {
    const res = await apiClient.put<ReportCategoryItem>(`${BASE_URL}/${id}`, dto)
    return res.data
  },

  /**
   * Toggle active/inactive status (Admin only)
   */
  async toggleStatus(id: number): Promise<ReportCategoryItem> {
    const res = await apiClient.patch<ReportCategoryItem>(`${BASE_URL}/${id}/toggle-status`)
    return res.data
  },

  /**
   * Delete custom report category (Admin only; blocked if system or has reports)
   */
  async delete(id: number): Promise<{ message: string }> {
    const res = await apiClient.delete<{ message: string }>(`${BASE_URL}/${id}`)
    return res.data
  },
}
