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
  footerBadgeText: string
  footerLinksJson: string
  footerLinks?: FooterLinkDto[]
  collapsedMenuExpandMode?: 'click' | 'hover'
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
  footerBadgeText?: string
  footerLinksJson?: string
  collapsedMenuExpandMode?: 'click' | 'hover'
}

export interface UpdateMenuExpandModePayload {
  mode: 'click' | 'hover'
}

