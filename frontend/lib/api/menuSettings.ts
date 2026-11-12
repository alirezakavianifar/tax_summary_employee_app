import { apiClient } from './client'
import type {
  MenuSettingItem,
  UpdateMenuSettingsPayload,
  CreateMenuSettingPayload,
  UpdateMenuSettingMetadataPayload,
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
   * Creates a new custom menu option or module.
   */
  async createMenuSetting(payload: CreateMenuSettingPayload): Promise<MenuSettingItem[]> {
    const response = await apiClient.post<MenuSettingItem[]>('/menu-settings', payload)
    return response.data
  },

  /**
   * Updates metadata and access settings for a custom menu option.
   */
  async updateMenuSettingMetadata(
    menuKey: string,
    payload: UpdateMenuSettingMetadataPayload
  ): Promise<MenuSettingItem[]> {
    const response = await apiClient.put<MenuSettingItem[]>(
      `/menu-settings/${encodeURIComponent(menuKey)}`,
      payload
    )
    return response.data
  },

  /**
   * Deletes a custom menu option (and any custom children).
   */
  async deleteMenuSetting(menuKey: string): Promise<MenuSettingItem[]> {
    const response = await apiClient.delete<MenuSettingItem[]>(
      `/menu-settings/${encodeURIComponent(menuKey)}`
    )
    return response.data
  },

  /**
   * Resets built-in menu settings back to system defaults while preserving custom items.
   */
  async resetMenuSettings(): Promise<MenuSettingItem[]> {
    const response = await apiClient.post<MenuSettingItem[]>('/menu-settings/reset')
    return response.data
  },
}
