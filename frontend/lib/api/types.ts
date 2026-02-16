export interface EmployeeDto {
  id: string
  personnelNumber: string
  firstName: string
  lastName: string
  education: string
  serviceUnit: string
  currentPosition: string
  appointmentPosition: string
  previousExperienceYears: number
  nationalId?: string
  photoUrl?: string
  statusDescription?: string
  createdAt: string
  updatedAt?: string
}

export interface AdministrativeStatusDto {
  id: string
  employeeId: string
  missionDays: number
  sickLeaveDays: number
  paidLeaveDays: number
  overtimeHours: number
  delayAndAbsenceHours: number
  hourlyLeaveHours: number
  createdAt: string
  updatedAt?: string
}

export interface PerformanceCapabilityDto {
  id: string
  employeeId: string
  systemRole: string
  // Boolean flags (kept for backward compatibility)
  detectionOfTaxIssues: boolean
  detectionOfTaxEvasion: boolean
  companyIdentification: boolean
  valueAddedRecognition: boolean
  referredOrExecuted: boolean
  // NEW: Numerical tracking - تعداد (Quantity) and مبلغ (Amount)
  detectionOfTaxIssues_Quantity: number
  detectionOfTaxIssues_Amount: number
  detectionOfTaxEvasion_Quantity: number
  detectionOfTaxEvasion_Amount: number
  companyIdentification_Quantity: number
  companyIdentification_Amount: number
  valueAddedRecognition_Quantity: number
  valueAddedRecognition_Amount: number
  referredOrExecuted_Quantity: number
  referredOrExecuted_Amount: number
  createdAt: string
  updatedAt?: string
}

export interface EmployeeReportDto {
  employee: EmployeeDto
  adminStatus?: AdministrativeStatusDto
  capabilities: PerformanceCapabilityDto[]
}

export interface CreateEmployeeReportDto {
  personnelNumber: string
  firstName: string
  lastName: string
  education: string
  serviceUnit: string
  currentPosition: string
  appointmentPosition: string
  previousExperienceYears: number
  nationalId?: string
  photoUrl?: string
  statusDescription?: string
  missionDays: number
  sickLeaveDays: number
  paidLeaveDays: number
  overtimeHours: number
  delayAndAbsenceHours: number
  hourlyLeaveHours: number
  capabilities: CreatePerformanceCapabilityDto[]
}

export interface CreatePerformanceCapabilityDto {
  systemRole: string
  // Boolean flags (kept for backward compatibility)
  detectionOfTaxIssues: boolean
  detectionOfTaxEvasion: boolean
  companyIdentification: boolean
  valueAddedRecognition: boolean
  referredOrExecuted: boolean
  // NEW: Numerical tracking - تعداد (Quantity) and مبلغ (Amount)
  detectionOfTaxIssues_Quantity: number
  detectionOfTaxIssues_Amount: number
  detectionOfTaxEvasion_Quantity: number
  detectionOfTaxEvasion_Amount: number
  companyIdentification_Quantity: number
  companyIdentification_Amount: number
  valueAddedRecognition_Quantity: number
  valueAddedRecognition_Amount: number
  referredOrExecuted_Quantity: number
  referredOrExecuted_Amount: number
}

export interface UpdateEmployeeReportDto {
  firstName: string
  lastName: string
  education: string
  serviceUnit: string
  currentPosition: string
  appointmentPosition: string
  previousExperienceYears: number
  nationalId?: string
  photoUrl?: string
  statusDescription?: string
  missionDays: number
  sickLeaveDays: number
  paidLeaveDays: number
  overtimeHours: number
  delayAndAbsenceHours: number
  hourlyLeaveHours: number
  capabilities: CreatePerformanceCapabilityDto[]
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    pageNumber: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
}
