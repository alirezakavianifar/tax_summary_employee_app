export interface MenuRoleDef {
  key: string
  label: string
  shortLabel: string
  colorClass: string
  activeClass: string
}

export const ALL_GENERAL_ROLES = [
  'Admin',
  'OfficeHead',
  'GroupHead',
  'Expert',
  'ITSpecialist',
  'Manager',
  'Employee',
]

export const ORGANIZATIONAL_ROLES: MenuRoleDef[] = [
  {
    key: 'DirectorGeneral',
    label: 'مدیر کل امور مالیاتی',
    shortLabel: 'مدیر کل',
    colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    activeClass: 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-xs hover:bg-indigo-100',
  },
  {
    key: 'Treasury',
    label: 'ذیحساب',
    shortLabel: 'ذیحساب',
    colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    activeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs hover:bg-emerald-100',
  },
  {
    key: 'OfficeHead',
    label: 'رئیس اداره',
    shortLabel: 'رئیس اداره',
    colorClass: 'bg-purple-50 text-purple-700 border-purple-200',
    activeClass: 'bg-purple-50 text-purple-700 border-purple-300 shadow-xs hover:bg-purple-100',
  },
  {
    key: 'GroupHead',
    label: 'رئیس گروه',
    shortLabel: 'رئیس گروه',
    colorClass: 'bg-amber-50 text-amber-700 border-amber-200',
    activeClass: 'bg-amber-50 text-amber-700 border-amber-300 shadow-xs hover:bg-amber-100',
  },
  {
    key: 'Expert',
    label: 'کارشناس',
    shortLabel: 'کارشناس',
    colorClass: 'bg-blue-50 text-blue-700 border-blue-200',
    activeClass: 'bg-blue-50 text-blue-700 border-blue-300 shadow-xs hover:bg-blue-100',
  },
  {
    key: 'ITSpecialist',
    label: 'کارشناس فناوری',
    shortLabel: 'فناوری',
    colorClass: 'bg-teal-50 text-teal-700 border-teal-200',
    activeClass: 'bg-teal-50 text-teal-700 border-teal-300 shadow-xs hover:bg-teal-100',
  },
]

export type RolePreset = 'all' | 'managers' | 'experts' | 'admin'

export function getPresetRoles(preset: RolePreset): string[] {
  if (preset === 'all') return [...ALL_GENERAL_ROLES]
  if (preset === 'managers') return ['Admin', 'OfficeHead', 'GroupHead', 'Manager']
  if (preset === 'experts') return ['Admin', 'Expert', 'Employee']
  return ['Admin']
}

export function sanitizeRolesSelection(roles: string[]): string[] {
  let next = [...roles]
  if (!next.some((r) => r.toLowerCase() === 'officehead')) {
    next = next.filter((r) => r.toLowerCase() !== 'manager')
  }
  if (!next.some((r) => r.toLowerCase() === 'expert')) {
    next = next.filter((r) => r.toLowerCase() !== 'employee')
  }
  if (!next.some((r) => r.toLowerCase() === 'admin')) {
    next.unshift('Admin')
  }
  return next
}

export function toggleRoleSelection(currentRoles: string[], roleKey: string): string[] {
  const exists = currentRoles.some((r) => r.toLowerCase() === roleKey.toLowerCase())
  const next = exists
    ? currentRoles.filter((r) => r.toLowerCase() !== roleKey.toLowerCase())
    : [...currentRoles, roleKey]
  return sanitizeRolesSelection(next)
}

export function getRoleLabel(role: string): string {
  switch (role.toLowerCase()) {
    case 'admin':
      return 'مدیر ارشد'
    case 'directorgeneral':
      return 'مدیر کل امور مالیاتی'
    case 'treasury':
      return 'ذیحساب'
    case 'officehead':
      return 'رئیس اداره'
    case 'grouphead':
      return 'رئیس گروه'
    case 'expert':
      return 'کارشناس'
    case 'itspecialist':
      return 'کارشناس فناوری'
    case 'manager':
      return 'معاونت / مدیر'
    case 'employee':
      return 'کارمند'
    default:
      return role
  }
}

