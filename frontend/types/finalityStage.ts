export interface FinalityStageItem {
  id: number
  code: string
  title: string
  description?: string | null
  isActive: boolean
  displayOrder: number
  isSystem: boolean
}

export interface CreateFinalityStageRequest {
  code?: string
  title: string
  description?: string
  displayOrder?: number
}

export interface UpdateFinalityStageRequest {
  title: string
  description?: string | null
  isActive: boolean
  displayOrder: number
}

export interface FinalityStageOrderItem {
  id: number
  displayOrder: number
}
