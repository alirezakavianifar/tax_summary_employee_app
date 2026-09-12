import { apiClient } from './client'
import { OfficeDto } from './types'

export interface CreateOfficeRequest {
  code: string
  name: string
  description?: string
}

export interface UpdateOfficeRequest {
  name: string
  description?: string
  isActive: boolean
}

export const officesApi = {
  getAll: async () => {
    const response = await apiClient.get<OfficeDto[]>('/offices')
    return response.data
  },

  getById: async (id: string) => {
    const response = await apiClient.get<OfficeDto>(`/offices/${id}`)
    return response.data
  },

  create: async (data: CreateOfficeRequest) => {
    const response = await apiClient.post<OfficeDto>('/offices', data)
    return response.data
  },

  update: async (id: string, data: UpdateOfficeRequest) => {
    const response = await apiClient.put<OfficeDto>(`/offices/${id}`, data)
    return response.data
  }
}
