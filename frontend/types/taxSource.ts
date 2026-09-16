export interface TaxSourceItem {
  id: number
  code: string
  title: string
  description?: string | null
  isActive: boolean
  displayOrder: number
  isSystem: boolean
}

export interface CreateTaxSourceRequest {
  code?: string
  title: string
  description?: string
  displayOrder?: number
}

export interface UpdateTaxSourceRequest {
  title: string
  description?: string | null
  isActive: boolean
  displayOrder: number
}

export interface TaxSourceOrderItem {
  id: number
  displayOrder: number
}
