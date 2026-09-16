import { apiClient } from './client'
import type {
  FinalityStageItem,
  CreateFinalityStageRequest,
  UpdateFinalityStageRequest,
  FinalityStageOrderItem,
} from '@/types/finalityStage'

export const finalityStagesApi = {
  /**
   * Get active finality stages for dropdown lists in refund cases
   */
  async getActiveStages(): Promise<FinalityStageItem[]> {
    const response = await apiClient.get<FinalityStageItem[]>('/finality-stages')
    return response.data
  },

  /**
   * Get all finality stages (active and inactive) for admin management
   */
  async getAllForManagement(): Promise<FinalityStageItem[]> {
    const response = await apiClient.get<FinalityStageItem[]>('/finality-stages/management')
    return response.data
  },

  /**
   * Get a single finality stage by ID
   */
  async getById(id: number): Promise<FinalityStageItem> {
    const response = await apiClient.get<FinalityStageItem>(`/finality-stages/${id}`)
    return response.data
  },

  /**
   * Create a new custom finality stage (Admin only)
   */
  async create(payload: CreateFinalityStageRequest): Promise<FinalityStageItem> {
    const response = await apiClient.post<FinalityStageItem>('/finality-stages', payload)
    return response.data
  },

  /**
   * Update an existing finality stage (Admin only)
   */
  async update(id: number, payload: UpdateFinalityStageRequest): Promise<FinalityStageItem> {
    const response = await apiClient.put<FinalityStageItem>(`/finality-stages/${id}`, payload)
    return response.data
  },

  /**
   * Toggle active/inactive status of a finality stage
   */
  async toggleActive(stage: FinalityStageItem): Promise<FinalityStageItem> {
    const response = await apiClient.put<FinalityStageItem>(`/finality-stages/${stage.id}`, {
      title: stage.title,
      description: stage.description,
      isActive: !stage.isActive,
      displayOrder: stage.displayOrder,
    })
    return response.data
  },

  /**
   * Batch update display order of finality stages (Admin only)
   */
  async reorder(items: FinalityStageOrderItem[]): Promise<void> {
    await apiClient.put('/finality-stages/reorder', items)
  },

  /**
   * Delete a custom finality stage (Admin only). Core system stages cannot be deleted.
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/finality-stages/${id}`)
  },
}
