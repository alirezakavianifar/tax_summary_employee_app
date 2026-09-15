import { apiClient } from './client'

export interface RoleDto {
    id: string
    name: string
    title: string
    description?: string | null
    isSystemRole: boolean
    isActive: boolean
    displayOrder: number
    userCount: number
    createdAt: string
    updatedAt?: string | null
}

export interface CreateRoleRequest {
    name: string
    title: string
    description?: string | null
    displayOrder?: number
}

export interface UpdateRoleRequest {
    title: string
    description?: string | null
    isActive: boolean
    displayOrder: number
}

export const rolesApi = {
    /**
     * Get active roles for dropdown selection
     */
    getActiveRoles: async () => {
        const response = await apiClient.get<RoleDto[]>('/roles')
        return response.data
    },

    /**
     * Get all roles with user counts for admin management
     */
    getManagementRoles: async () => {
        const response = await apiClient.get<RoleDto[]>('/roles/management')
        return response.data
    },

    /**
     * Get a specific role by ID
     */
    getRoleById: async (id: string) => {
        const response = await apiClient.get<RoleDto>(`/roles/${id}`)
        return response.data
    },

    /**
     * Create a new role (Admin only)
     */
    createRole: async (data: CreateRoleRequest) => {
        const response = await apiClient.post<RoleDto>('/roles', data)
        return response.data
    },

    /**
     * Update an existing role (Admin only)
     */
    updateRole: async (id: string, data: UpdateRoleRequest) => {
        const response = await apiClient.put<RoleDto>(`/roles/${id}`, data)
        return response.data
    },

    /**
     * Delete a custom role (Admin only)
     */
    deleteRole: async (id: string) => {
        await apiClient.delete(`/roles/${id}`)
    }
}
