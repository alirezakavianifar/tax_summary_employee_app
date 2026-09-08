import { apiClient } from './client'

export interface AuditLogItem {
  id: string
  userId: string | null
  username: string | null
  action: 'Created' | 'Modified' | 'Deleted' | string
  entityName: string
  entityId: string
  oldValues: string | null
  newValues: string | null
  affectedColumns: string | null
  ipAddress: string | null
  userAgent: string | null
  timestamp: string
}

export interface AuditLogsResponse {
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  items: AuditLogItem[]
}

export interface AuditLogQueryParams {
  entityName?: string
  entityId?: string
  action?: string
  username?: string
  fromDate?: string
  toDate?: string
  page?: number
  pageSize?: number
}

export const auditLogsApi = {
  getLogs: async (params?: AuditLogQueryParams): Promise<AuditLogsResponse> => {
    const response = await apiClient.get<AuditLogsResponse>('/audit-logs', { params })
    return response.data
  },

  getLogById: async (id: string): Promise<AuditLogItem> => {
    const response = await apiClient.get<AuditLogItem>(`/audit-logs/${id}`)
    return response.data
  },
}
