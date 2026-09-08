import { apiClient } from './client'
import { User, RegisterRequest, UserRole } from '@/types/auth'

export interface UpdateUserRequest {
    username?: string
    email?: string
    role: UserRole
    isActive: boolean
    employeeId?: string
}

export const usersApi = {
    getUsers: async () => {
        const response = await apiClient.get<User[]>('/users')
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
    }
}
