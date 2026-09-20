export interface RefundWorkflowStepItem {
  id: string
  stage: number
  stageValue: number
  title: string
  description: string
  stepOrder: number
  isEnabled: boolean
  isMandatory: boolean
  allowedRoles: string
  allowedRolesList: string[]
  createdAt: string
  updatedAt: string
}

export interface UpdateRefundWorkflowStepPayload {
  stage: number
  title: string
  description?: string
  stepOrder: number
  isEnabled: boolean
  allowedRoles: string
}

export interface UpdateWorkflowStepsRequest {
  steps: UpdateRefundWorkflowStepPayload[]
}
