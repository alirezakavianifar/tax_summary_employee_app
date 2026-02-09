import { apiClient } from './client'
import { User, RegisterRequest } from '@/types/auth'

export interface UpdateUserRequest {
    email: string
    role: 'Admin' | 'Manager' | 'Employee'
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
    }
}
