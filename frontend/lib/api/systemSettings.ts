import { apiClient } from './client'
import type { SystemSettingsDto, UpdateSystemSettingsPayload } from '@/types/systemSettings'

export const systemSettingsApi = {
  /**
   * Retrieves current organization branding and system title configuration.
   * Anonymous access allowed.
   */
  async getBrandingSettings(): Promise<SystemSettingsDto> {
    const response = await apiClient.get<SystemSettingsDto>('/system-settings/branding')
    return response.data
  },

  /**
   * Updates organizational name, system title, and reporting module titles.
   * Requires Admin role.
   */
  async updateBrandingSettings(payload: UpdateSystemSettingsPayload): Promise<SystemSettingsDto> {
    const response = await apiClient.put<SystemSettingsDto>('/system-settings/branding', payload)
    return response.data
  },

  /**
   * Uploads a new logo image file.
   * Requires Admin role.
   */
  async uploadLogo(file: File): Promise<SystemSettingsDto> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.post<SystemSettingsDto>('/system-settings/branding/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  /**
   * Resets branding back to system defaults.
   * Requires Admin role.
   */
  async resetBrandingSettings(): Promise<SystemSettingsDto> {
    const response = await apiClient.post<SystemSettingsDto>('/system-settings/branding/reset')
    return response.data
  },
}

