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
  createdAt: string
  updatedAt?: string
}

export interface AdministrativeStatusDto {
  id: string
  employeeId: string
  missionDays: number
  incentiveHours: number
  delayAndAbsenceHours: number
  hourlyLeaveHours: number
  createdAt: string
  updatedAt?: string
}

export interface PerformanceCapabilityDto {
  id: string
  employeeId: string
  systemRole: string
  detectionOfTaxIssues: boolean
  detectionOfTaxEvasion: boolean
  companyIdentification: boolean
  valueAddedRecognition: boolean
  referredOrExecuted: boolean
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
  missionDays: number
  incentiveHours: number
  delayAndAbsenceHours: number
  hourlyLeaveHours: number
  capabilities: CreatePerformanceCapabilityDto[]
}

export interface CreatePerformanceCapabilityDto {
  systemRole: string
  detectionOfTaxIssues: boolean
  detectionOfTaxEvasion: boolean
  companyIdentification: boolean
  valueAddedRecognition: boolean
  referredOrExecuted: boolean
}

export interface UpdateEmployeeReportDto {
  firstName: string
  lastName: string
  education: string
  serviceUnit: string
  currentPosition: string
  appointmentPosition: string
  previousExperienceYears: number
  missionDays: number
  incentiveHours: number
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
