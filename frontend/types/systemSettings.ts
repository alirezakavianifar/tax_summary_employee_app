export interface FooterLinkDto {
  id: string
  title: string
  url: string
  isExternal: boolean
  isVisible: boolean
  order: number
}

export interface SystemSettingsDto {
  id: string
  settingKey: string
  organizationName: string
  systemTitle: string
  logoPath: string
  reportingModuleTitle: string
  reportingModuleSubtitle: string
  footerCopyrightText: string
  footerVersionText: string
  footerLinksJson: string
  footerLinks?: FooterLinkDto[]
  updatedAt: string
  updatedBy: string | null
}

export interface UpdateSystemSettingsPayload {
  organizationName: string
  systemTitle: string
  logoPath?: string
  reportingModuleTitle: string
  reportingModuleSubtitle: string
  footerCopyrightText?: string
  footerVersionText?: string
  footerLinksJson?: string
}

