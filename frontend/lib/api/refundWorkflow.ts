import { apiClient } from './client'
import type {
  RefundWorkflowStepItem,
  UpdateWorkflowStepsRequest,
} from '@/types/refundWorkflow'

export const refundWorkflowApi = {
  /**
   * Get all workflow steps (including bypassed/disabled ones)
   */
  async getAllSteps(): Promise<RefundWorkflowStepItem[]> {
    const response = await apiClient.get<RefundWorkflowStepItem[]>('/refunds/workflow-settings')
    return response.data
  },

  /**
   * Get only enabled workflow steps in pipeline order
   */
  async getActiveSteps(): Promise<RefundWorkflowStepItem[]> {
    const response = await apiClient.get<RefundWorkflowStepItem[]>('/refunds/workflow-settings/active')
    return response.data
  },

  /**
   * Get next enabled stage from current status
   */
  async getNextStage(currentStatus: number): Promise<{ currentStatus: number; nextStage: number | null; nextStageValue: number | null }> {
    const response = await apiClient.get<{ currentStatus: number; nextStage: number | null; nextStageValue: number | null }>(
      `/refunds/workflow-settings/next-stage/${currentStatus}`
    )
    return response.data
  },

  /**
   * Update workflow configuration (Admin only)
   */
  async updateWorkflowSteps(payload: UpdateWorkflowStepsRequest): Promise<RefundWorkflowStepItem[]> {
    const response = await apiClient.put<RefundWorkflowStepItem[]>('/refunds/workflow-settings', payload)
    return response.data
  },

  /**
   * Reset workflow configuration to statutory defaults (Admin only)
   */
  async resetToDefaults(): Promise<RefundWorkflowStepItem[]> {
    const response = await apiClient.post<RefundWorkflowStepItem[]>('/refunds/workflow-settings/reset')
    return response.data
  },
}
