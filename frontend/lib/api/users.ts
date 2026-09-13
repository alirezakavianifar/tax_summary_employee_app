import { apiClient } from './client'
import { User, RegisterRequest, UserRole } from '@/types/auth'

export interface UpdateUserRequest {
    username?: string
    email?: string
    role: UserRole
    isActive: boolean
    employeeId?: string
    officeIds?: string[]
}

export interface PersonnelImportItem {
    personnelNumber: string
    firstName: string
    lastName: string
    fullName: string
    nationalId: string
    employmentType: string
    employmentStatus: string
    position: string
    assignedRole: string
    roleLabelFa: string
    officeCode: string
    officeName: string
    isExistingEmployee: boolean
    isExistingUser: boolean
}

export interface PersonnelImportPreview {
    totalBaseRecords: number
    totalOfficeRecords: number
    matchedRecords: number
    unmatchedRecords: number
    newOfficesCount: number
    existingOfficesCount: number
    newEmployeesCount: number
    updatedEmployeesCount: number
    newUsersCount: number
    updatedUsersCount: number
    roleBreakdown: Record<string, number>
    samplePreview: PersonnelImportItem[]
    warnings: string[]
    errors: string[]
}

export interface PersonnelImportResult {
    success: boolean
    message: string
    totalProcessed: number
    officesCreated: number
    employeesCreated: number
    employeesUpdated: number
    usersCreated: number
    usersUpdated: number
    userOfficesLinked: number
    roleBreakdown: Record<string, number>
    processedAt: string
    warnings: string[]
}

export interface PagedUsersResponse {
    items: User[]
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
    hasPreviousPage: boolean
    hasNextPage: boolean
}

export const usersApi = {
    getUsersPaged: async (params?: {
        search?: string
        role?: string
        officeId?: string
        page?: number
        pageSize?: number
    }) => {
        const response = await apiClient.get<PagedUsersResponse>('/users', { params })
        return response.data
    },

    getUsers: async () => {
        const response = await apiClient.get<User[]>('/users?all=true')
        return response.data
    },

    getUser: async (id: string) => {
        const response = await apiClient.get<User>(`/users/${id}`)
        return response.data
    },

    createUser: async (data: RegisterRequest) => {
        const response = await apiClient.post<User>('/users', data)
        return response.data
    },

    updateUser: async (id: string, data: UpdateUserRequest) => {
        const response = await apiClient.put(`/users/${id}`, data)
        return response.data
    },

    deleteUser: async (id: string) => {
        await apiClient.delete(`/users/${id}`)
    },

    resetPassword: async (id: string, newPassword: string) => {
        const response = await apiClient.post<{ message: string }>(`/users/${id}/reset-password`, { newPassword })
        return response.data
    },

    unlockUser: async (id: string) => {
        const response = await apiClient.post<{ message: string }>(`/users/${id}/unlock`)
        return response.data
    },

    previewPersonnelImport: async (baseFile: File, officeFile: File) => {
        const formData = new FormData()
        formData.append('baseFile', baseFile)
        formData.append('officeFile', officeFile)

        const response = await apiClient.post<PersonnelImportPreview>(
            '/users/import-personnel/preview',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        )
        return response.data
    },

    executePersonnelImport: async (baseFile: File, officeFile: File, defaultPassword?: string) => {
        const formData = new FormData()
        formData.append('baseFile', baseFile)
        formData.append('officeFile', officeFile)
        if (defaultPassword) {
            formData.append('defaultPassword', defaultPassword)
        }

        const response = await apiClient.post<PersonnelImportResult>(
            '/users/import-personnel/execute',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        )
        return response.data
    }
}

