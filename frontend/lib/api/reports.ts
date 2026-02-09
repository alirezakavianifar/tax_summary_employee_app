import { apiClient } from './client'
import type {
  EmployeeReportDto,
  CreateEmployeeReportDto,
  UpdateEmployeeReportDto,
  EmployeeDto,
  PaginatedResponse,
} from './types'

const REPORTS_BASE = '/employeereports'

export const reportsApi = {
  // Get report by ID
  getReport: async (employeeId: string): Promise<EmployeeReportDto> => {
    const response = await apiClient.get<EmployeeReportDto>(`${REPORTS_BASE}/${employeeId}`)
    return response.data
  },

  // Get report by personnel number
  getReportByPersonnelNumber: async (personnelNumber: string): Promise<EmployeeReportDto> => {
    const response = await apiClient.get<EmployeeReportDto>(
      `${REPORTS_BASE}/by-personnel-number/${personnelNumber}`
    )
    return response.data
  },

  // Create new report
  createReport: async (data: CreateEmployeeReportDto): Promise<string> => {
    const response = await apiClient.post<{ id: string }>(`${REPORTS_BASE}`, data)
    return response.data.id
  },

  // Update report
  updateReport: async (employeeId: string, data: UpdateEmployeeReportDto): Promise<void> => {
    await apiClient.put(`${REPORTS_BASE}/${employeeId}`, data)
  },

  // Delete report
  deleteReport: async (employeeId: string): Promise<void> => {
    await apiClient.delete(`${REPORTS_BASE}/${employeeId}`)
  },

  // Get all employees
  getAllEmployees: async (): Promise<EmployeeDto[]> => {
    const response = await apiClient.get<EmployeeDto[]>(`${REPORTS_BASE}/employees`, {
      params: { _t: new Date().getTime() }
    })
    return response.data
  },

  // Get paginated employees
  getEmployeesPaged: async (
    pageNumber: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<EmployeeDto>> => {
    const response = await apiClient.get<PaginatedResponse<EmployeeDto>>(
      `${REPORTS_BASE}/employees/paged`,
      {
        params: { pageNumber, pageSize, _t: new Date().getTime() },
      }
    )
    return response.data
  },

  // Search employees
  searchEmployees: async (searchTerm: string): Promise<EmployeeDto[]> => {
    const response = await apiClient.get<EmployeeDto[]>(`${REPORTS_BASE}/employees/search`, {
      params: { searchTerm },
    })
    return response.data
  },

  // Get employees by service unit
  getEmployeesByServiceUnit: async (serviceUnit: string): Promise<EmployeeDto[]> => {
    const response = await apiClient.get<EmployeeDto[]>(
      `${REPORTS_BASE}/employees/by-service-unit`,
      {
        params: { serviceUnit },
      }
    )
    return response.data
  },

  // Upload employee photo
  uploadPhoto: async (employeeId: string, photoFile: File): Promise<string> => {
    const formData = new FormData()
    formData.append('photo', photoFile)

    const response = await apiClient.post<{ photoUrl: string }>(
      `${REPORTS_BASE}/${employeeId}/photo`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data.photoUrl
  },

  // Seed from Excel
  seedFromExcel: async (file: File): Promise<{ message: string, count: number }> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.post<{ message: string, count: number }>('/seed/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
}
