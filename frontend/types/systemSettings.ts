export interface SystemSettingsDto {
  id: string
  settingKey: string
  organizationName: string
  systemTitle: string
  logoPath: string
  reportingModuleTitle: string
  reportingModuleSubtitle: string
  updatedAt: string
  updatedBy: string | null
}

export interface UpdateSystemSettingsPayload {
  organizationName: string
  systemTitle: string
  logoPath?: string
  reportingModuleTitle: string
  reportingModuleSubtitle: string
}

