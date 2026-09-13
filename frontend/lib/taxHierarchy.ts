export interface TaxHierarchyInfo {
  taxUnitCode: string
  groupCode: string
  officeCode: string
  officeName: string
  groupName: string
  unitName: string
  isValid: boolean
}

// Known human-readable names for Khuzestan tax offices
export const KNOWN_OFFICES: Record<string, string> = {
  '160100': 'اداره امور مالیاتی ۱ اهواز',
  '160200': 'اداره امور مالیاتی ۲ اهواز',
  '160300': 'اداره امور مالیاتی ۳ اهواز',
  '160400': 'اداره امور مالیاتی دزفول',
  '160500': 'اداره امور مالیاتی آبادان',
  '160600': 'اداره امور مالیاتی ماهشهر',
  '160700': 'اداره امور مالیاتی مسجدسلیمان',
}

/**
 * Decomposes an Iranian 6-digit tax unit code into its 3 organizational tiers:
 * Level 1: Office (اداره امور مالیاتی) -> e.g., 160200
 * Level 2: Audit Group (گروه رسیدگی مالیاتی) -> e.g., 160210
 * Level 3: Tax Unit (واحد مالیاتی) -> e.g., 160211
 */
export function decomposeTaxUnitCode(code?: string | null): TaxHierarchyInfo {
  if (!code) {
    return {
      taxUnitCode: '',
      groupCode: '',
      officeCode: '',
      officeName: '',
      groupName: '',
      unitName: '',
      isValid: false,
    }
  }

  // Normalize Persian/Arabic digits to ASCII standard
  const normalized = code
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
    .replace(/[^0-9]/g, '')
    .trim()

  if (normalized.length === 6) {
    const officePrefix = normalized.substring(0, 4)
    const groupDigit = normalized[4]
    const unitDigit = normalized[5]

    const officeCode = `${officePrefix}00`
    const groupCode = `${officePrefix}${groupDigit}0`
    const taxUnitCode = normalized

    const officeName = KNOWN_OFFICES[officeCode] || `اداره امور مالیاتی ${officePrefix}`
    const groupName = `گروه رسیدگی ${groupDigit}`
    const unitName = `واحد مالیاتی ${unitDigit}`

    return {
      taxUnitCode,
      groupCode,
      officeCode,
      officeName,
      groupName,
      unitName,
      isValid: true,
    }
  }

  return {
    taxUnitCode: normalized,
    groupCode: normalized,
    officeCode: normalized,
    officeName: `اداره امور مالیاتی ${normalized}`,
    groupName: '',
    unitName: '',
    isValid: false,
  }
}

/**
 * Checks whether a user's assigned offices/codes cover the target tax unit hierarchy.
 */
export function isUserAuthorizedForUnit(
  userRole?: string,
  userOffices?: { code: string; name?: string }[],
  taxUnitCode?: string,
  serviceUnit?: string
): boolean {
  if (!userRole) return false
  if (userRole.toLowerCase() === 'admin') return true
  if (!taxUnitCode) return false

  const hierarchy = decomposeTaxUnitCode(taxUnitCode)
  const codes: string[] = []

  if (userOffices && userOffices.length > 0) {
    userOffices.forEach((o) => {
      if (o.code) codes.push(o.code.trim())
    })
  }

  if (serviceUnit && serviceUnit.trim()) {
    codes.push(serviceUnit.trim())
  }

  if (codes.length === 0) return false

  return codes.some((code) => {
    if (!code) return false

    // Exact match on unit, group, or office
    if (code === hierarchy.taxUnitCode || code === hierarchy.groupCode || code === hierarchy.officeCode) {
      return true
    }

    // Office level code (e.g. 160200 or 1602) covers any 1602xx
    if (code.length === 6 && code.endsWith('00')) {
      return hierarchy.taxUnitCode.startsWith(code.substring(0, 4))
    }
    if (code.length === 4) {
      return hierarchy.taxUnitCode.startsWith(code)
    }

    // Group level code (e.g. 160210) covers 160211 - 160219
    if (code.length === 6 && code.endsWith('0') && !code.endsWith('00')) {
      return hierarchy.taxUnitCode.startsWith(code.substring(0, 5))
    }

    return false
  })
}

/**
 * Checks whether a user has permission to verify/approve a specific stage in the refund workflow
 * according to their role and organizational tier.
 */
export function canUserVerifyStage(
  userRole?: string,
  userOffices?: { code: string; name?: string }[],
  serviceUnit?: string,
  targetStatus?: number | string,
  taxUnitCode?: string
): boolean {
  if (!userRole) return false
  const role = userRole.toLowerCase()
  if (role === 'admin') return true

  // Must have hierarchy access to the tax unit code
  if (!isUserAuthorizedForUnit(userRole, userOffices, taxUnitCode, serviceUnit)) {
    return false
  }

  const statusNum = typeof targetStatus === 'number' ? targetStatus : parseInt(targetStatus as string, 10)

  // Status mapping:
  // 1 = Audited (Auditor / Expert, GroupHead, OfficeHead, Admin)
  // 2 = GroupHeadApproved (GroupHead, OfficeHead, Admin)
  // 3 = AdministrationHeadApproved (OfficeHead, Admin)
  switch (statusNum) {
    case 1:
      return role === 'expert' || role === 'grouphead' || role === 'officehead' || role === 'manager'
    case 2:
      return role === 'grouphead' || role === 'officehead'
    case 3:
      return role === 'officehead'
    default:
      return true
  }
}

