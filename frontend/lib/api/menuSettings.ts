import { apiClient } from './client'
import type {
  MenuSettingItem,
  UpdateMenuSettingsPayload,
} from '@/types/menuSettings'

export const menuSettingsApi = {
  /**
   * Retrieves visible menu items for current user or visitor.
   * If all=true and user is Admin, returns all items.
   */
  async getMenuSettings(all: boolean = false): Promise<MenuSettingItem[]> {
    const response = await apiClient.get<MenuSettingItem[]>('/menu-settings', {
      params: all ? { all: true } : undefined,
    })
    return response.data
  },

  /**
   * Retrieves all menu settings including hidden items for administrators.
   */
  async getAllSettingsForAdmin(): Promise<MenuSettingItem[]> {
    const response = await apiClient.get<MenuSettingItem[]>('/menu-settings/admin')
    return response.data
  },

  /**
   * Updates visibility and role restrictions of menu items.
   */
  async updateMenuSettings(payload: UpdateMenuSettingsPayload): Promise<MenuSettingItem[]> {
    const response = await apiClient.put<MenuSettingItem[]>('/menu-settings', payload)
    return response.data
  },

  /**
   * Resets all menu settings back to system defaults.
   */
  async resetMenuSettings(): Promise<MenuSettingItem[]> {
    const response = await apiClient.post<MenuSettingItem[]>('/menu-settings/reset')
    return response.data
  },
}
