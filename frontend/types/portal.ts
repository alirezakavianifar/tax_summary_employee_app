import { LucideIcon } from 'lucide-react'

export interface PortalAction {
  id: string
  title: string
  href: string
  description?: string
  icon: LucideIcon
  variant: 'primary' | 'secondary' | 'outline'
  minRole?: 'Admin' | 'Manager' | 'Employee'
}

export interface PortalFeatureHighlight {
  title: string
  icon?: LucideIcon
}

export interface PortalModuleConfig {
  id: string
  title: string
  navTitle?: string
  subtitle: string
  description: string
  badgeText: string
  icon: LucideIcon
  gradient: string
  accentColor: string
  borderHoverColor: string
  iconBgColor: string
  actions: PortalAction[]
  highlights: string[]
  minRole?: 'Admin' | 'Manager' | 'Employee'
}

/**
 * Base abstract class for portal system modules.
 * Any new distinct functional module in the application extends this class,
 * providing its metadata, actions, and security requirements.
 */
export abstract class BasePortalModule {
  public abstract readonly id: string
  public abstract readonly title: string
  public abstract readonly navTitle: string
  public abstract readonly subtitle: string
  public abstract readonly description: string
  public abstract readonly badgeText: string
  public abstract readonly icon: LucideIcon
  public abstract readonly gradient: string
  public abstract readonly accentColor: string
  public abstract readonly borderHoverColor: string
  public abstract readonly iconBgColor: string
  public abstract readonly actions: PortalAction[]
  public abstract readonly highlights: string[]
  public readonly minRole?: 'Admin' | 'Manager' | 'Employee'

  constructor(minRole?: 'Admin' | 'Manager' | 'Employee') {
    this.minRole = minRole
  }

  /**
   * Check if a given user role has access to this module
   */
  public hasAccess(userRole?: string): boolean {
    if (!this.minRole) return true
    if (!userRole) return false
    if (userRole === 'Admin') return true
    if (userRole === 'Manager' && (this.minRole === 'Manager' || this.minRole === 'Employee')) return true
    if (userRole === 'Employee' && this.minRole === 'Employee') return true
    return false
  }

  /**
   * Filter actions accessible to the current user role
   */
  public getAuthorizedActions(userRole?: string): PortalAction[] {
    return this.actions.filter((action) => {
      if (!action.minRole) return true
      if (!userRole) return false
      if (userRole === 'Admin') return true
      if (userRole === 'Manager' && (action.minRole === 'Manager' || action.minRole === 'Employee')) return true
      if (userRole === 'Employee' && action.minRole === 'Employee') return true
      return false
    })
  }

  /**
   * Serializes the module configuration for UI presentation
   */
  public toConfig(): PortalModuleConfig {
    return {
      id: this.id,
      title: this.title,
      navTitle: this.navTitle,
      subtitle: this.subtitle,
      description: this.description,
      badgeText: this.badgeText,
      icon: this.icon,
      gradient: this.gradient,
      accentColor: this.accentColor,
      borderHoverColor: this.borderHoverColor,
      iconBgColor: this.iconBgColor,
      actions: this.actions,
      highlights: this.highlights,
      minRole: this.minRole,
    }
  }
}
