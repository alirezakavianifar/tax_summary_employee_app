import { apiClient } from './client'
import type {
  TaxSourceItem,
  CreateTaxSourceRequest,
  UpdateTaxSourceRequest,
  TaxSourceOrderItem,
} from '@/types/taxSource'

export const taxSourcesApi = {
  /**
   * Get active tax sources for dropdown lists in refund cases
   */
  async getActiveSources(): Promise<TaxSourceItem[]> {
    const response = await apiClient.get<TaxSourceItem[]>('/tax-sources')
    return response.data
  },

  /**
   * Get all tax sources (active and inactive) for admin management
   */
  async getAllForManagement(): Promise<TaxSourceItem[]> {
    const response = await apiClient.get<TaxSourceItem[]>('/tax-sources/management')
    return response.data
  },

  /**
   * Get a single tax source by ID
   */
  async getById(id: number): Promise<TaxSourceItem> {
    const response = await apiClient.get<TaxSourceItem>(`/tax-sources/${id}`)
    return response.data
  },

  /**
   * Create a new custom tax source (Admin only)
   */
  async create(payload: CreateTaxSourceRequest): Promise<TaxSourceItem> {
    const response = await apiClient.post<TaxSourceItem>('/tax-sources', payload)
    return response.data
  },

  /**
   * Update an existing tax source (Admin only)
   */
  async update(id: number, payload: UpdateTaxSourceRequest): Promise<TaxSourceItem> {
    const response = await apiClient.put<TaxSourceItem>(`/tax-sources/${id}`, payload)
    return response.data
  },

  /**
   * Toggle active/inactive status of a tax source
   */
  async toggleActive(source: TaxSourceItem): Promise<TaxSourceItem> {
    const response = await apiClient.put<TaxSourceItem>(`/tax-sources/${source.id}`, {
      title: source.title,
      description: source.description,
      isActive: !source.isActive,
      displayOrder: source.displayOrder,
    })
    return response.data
  },

  /**
   * Batch update display order of sources (Admin only)
   */
  async reorder(items: TaxSourceOrderItem[]): Promise<void> {
    await apiClient.put('/tax-sources/reorder', items)
  },

  /**
   * Delete a custom tax source (Admin only). Core system sources cannot be deleted.
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/tax-sources/${id}`)
  },
}
