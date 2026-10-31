# 05. Frontend UI/UX Specification: Reporting & BI System

## 1. Directory Structure (`frontend/app/reporting/`)

The reporting application is implemented inside Next.js 14 App Router under `frontend/app/reporting/`, using Vanilla Tailwind CSS, Lucide icons, and the shared API client infrastructure.

```
frontend/
├── app/
│   └── reporting/
│       ├── layout.tsx             ← Sub-navigation tabs, breadcrumbs, role check
│       ├── page.tsx               ← Executive Dashboard (Hero KPIs, Budget Gauges, Trends)
│       ├── standard/
│       │   ├── page.tsx           ← Standard Reports Catalog (Card grid with category filter)
│       │   └── [code]/
│       │       └── page.tsx       ← Standard Report Viewer (filter panel, dynamic grid, exports)
│       ├── builder/
│       │   └── page.tsx           ← Interactive 5-Step Dynamic Report & Pivot Builder
│       └── saved/
│           └── page.tsx           ← User Presets & Shared Templates Manager
├── components/
│   └── reporting/
│       ├── KpiCard.tsx            ← Animated metric card with gradient icon and variance pill
│       ├── TrendChart.tsx         ← Lightweight SVG-based monthly trend curve (zero external deps)
│       ├── DepartmentBarChart.tsx ← Budget vs Actual consumption horizontal bar chart
│       ├── ReportFilterBar.tsx    ← Collapsible multi-parameter filter form with Shamsi dates
│       ├── DynamicDataTable.tsx   ← Paginated RTL table with sorting, sticky header & summary row
│       └── ExportActionMenu.tsx   ← Dropdown menu for Excel (.xlsx), PDF, and CSV download
├── lib/
│   ├── api/
│   │   └── reporting.ts           ← Complete Axios API client methods with blob downloads
│   └── modules/
│       └── portalRegistry.ts      ← ExecutiveReportingModule registration
└── types/
    └── reporting.ts               ← Full TypeScript interfaces and enums
```

---

## 2. Portal Module Registration (`portalRegistry.ts`)

In `frontend/lib/modules/portalRegistry.ts`, the 4th module is registered:

```typescript
import {
  BarChart3,
  TrendingUp,
  Sliders,
  BookmarkCheck,
  FileSpreadsheet,
} from 'lucide-react'
import { BasePortalModule, PortalAction } from '@/types/portal'

/**
 * Module 4: Executive Business Intelligence & Unified Reporting Portal
 */
export class ExecutiveReportingModule extends BasePortalModule {
  public readonly id = 'executive-reporting'
  public readonly title = 'سامانه جامع آمار، گزارش‌گیری و هوش تجاری سازمانی'
  public readonly navTitle = 'گزارش‌ها و آمار'
  public readonly subtitle = 'داشبورد مدیریتی، پایش تطبیقی شاخص‌ها و تحلیل هوشمند داده‌ها'
  public readonly description =
    'پایش یکپارچه شاخص‌های عملکرد پرسنل، انحراف بودجه حقوق و اضافه کار، و جریان پرونده‌های استرداد مالیاتی با امکان طراحی گزارش‌های پویا و خروجی اکسل چندبرگی.'
  public readonly badgeText = 'هوش تجاری و نظارت'
  public readonly icon = BarChart3
  public readonly gradient = 'from-amber-600 to-orange-700'
  public readonly accentColor = 'text-amber-600'
  public readonly borderHoverColor = 'hover:border-amber-400'
  public readonly iconBgColor = 'bg-amber-50 text-amber-600'

  public readonly actions: PortalAction[] = [
    {
      id: 'executive-dashboard',
      title: 'داشبورد شاخص‌های کلیدی (KPI)',
      href: '/reporting',
      description: 'نمای تحلیلی وضعیت کلان سازمان و ادارات تابعه',
      icon: TrendingUp,
      variant: 'primary',
    },
    {
      id: 'standard-reports',
      title: 'کاتالوگ گزارش‌های استاندارد',
      href: '/reporting/standard',
      description: 'فهرست ۱۰ گزارش مدیریتی و نظارتی آماده چاپ',
      icon: FileSpreadsheet,
      variant: 'secondary',
    },
    {
      id: 'report-builder',
      title: 'گزارش‌ساز پویا و پیشرفته',
      href: '/reporting/builder',
      description: 'انتخاب فیلدها، فیلترهای سفارشی و تجمیع داده‌ها',
      icon: Sliders,
      variant: 'outline',
      minRole: 'Manager',
    },
    {
      id: 'saved-reports',
      title: 'گزارش‌های ذخیره‌شده و الگوها',
      href: '/reporting/saved',
      description: 'مشاهده و اجرای سریع فیلترهای از پیش ذخیره‌شده',
      icon: BookmarkCheck,
      variant: 'outline',
    },
  ]

  public readonly highlights = [
    'تجمیع هوشمند داده‌های ارزیابی، حقوق و اضافه کار و استرداد مالیاتی',
    'داشبورد تحلیلی با شاخص‌های کلیدی عملکرد و هشدارهای انحراف بودجه',
    'طراحی آسان گزارش‌های اختصاصی با فیلترهای چندبعدی و گروه‌بندی',
    'خروجی فایل اکسل چندبرگی استاندارد با فرمول و فرم‌های چاپی A4',
  ]
}
```

Registered into `PORTAL_MODULES`:
```typescript
export const PORTAL_MODULES: BasePortalModule[] = [
  new EmployeeEvaluationModule(),
  new CollaborativePayrollModule(),
  new TaxRefundPortalModule(),
  new ExecutiveReportingModule(), // Module 4
]
```

---

## 3. TypeScript Definitions (`frontend/types/reporting.ts`)

```typescript
export type ReportDomainSource = 1 | 2 | 3 | 4 // 1: HR, 2: Payroll, 3: Refunds, 4: CrossSystem
export type ReportCategory = 1 | 2 | 3 | 4     // 1: KPI, 2: Operational, 3: Financial, 4: Audit
export type ReportType = 1 | 2 | 3             // 1: Tabular, 2: Pivot, 3: SummaryKpi

export interface ExecutiveDashboard {
  kpiMetrics: ExecutiveKpiMetrics
  monthlyTrends: MonthlyTrendPoint[]
  topDepartmentBudgets: TopDepartmentBudget[]
  taxSourceRefundDistribution: TaxSourceDistribution[]
  recentAuditActivities: RecentAuditActivity[]
}

export interface ExecutiveKpiMetrics {
  totalEmployeesActive: number
  totalEvaluationsRecorded: number
  totalEvasionIdentifiedAmount: number
  currentMonthApprovedBudget: number
  currentMonthActualSpent: number
  budgetUtilizationPercentage: number
  totalOvertimeHoursRecorded: number
  laborCapViolationsCount: number
  activeRefundCasesCount: number
  totalRefundClaimedAmount: number
  totalRefundApprovedAmount: number
  totalDelayInterestPaid: number
  averageProcessingDays: number
}

export interface MonthlyTrendPoint {
  monthNameShamsi: string
  overtimeAmount: number
  welfareAmount: number
  refundAmount: number
}

export interface TopDepartmentBudget {
  departmentName: string
  allocatedBudget: number
  consumedAmount: number
  variance: number
  hasViolation: boolean
  employeeCount: number
  averageOvertimePerCapita: number
}

export interface TaxSourceDistribution {
  taxSourceCode: string
  taxSourcePersianTitle: string
  caseCount: number
  totalApprovedRefundAmount: number
  totalDelayInterestAmount: number
}

export interface RecentAuditActivity {
  action: string
  username: string
  description: string
  timestamp: string
  shamsiTimestamp: string
}

export interface ReportDefinition {
  id: string
  code: string
  title: string
  description: string
  domainSource: ReportDomainSource
  category: ReportCategory
  type: ReportType
  isSystemReport: boolean
  requiredRole?: string | null
  columns: ReportColumnMetadata[]
}

export interface ReportColumnMetadata {
  fieldName: string
  persianLabel: string
  dataType: 'string' | 'number' | 'currency' | 'date' | 'badge'
  isVisible: boolean
  isSortable: boolean
  hasAggregateSum: boolean
  alignment: 'right' | 'center' | 'left'
}

export interface ReportFilterParameters {
  shamsiDateFrom?: string
  shamsiDateTo?: string
  officeId?: string
  department?: string
  payrollCycleId?: string
  caseStatus?: string
  taxSourceCode?: string
  searchTerm?: string
  pageNumber: number
  pageSize: number
  sortBy?: string
  sortDescending?: boolean
}

export interface ReportExecutionResult {
  reportCode: string
  reportTitle: string
  executedAt: string
  columns: ReportColumnMetadata[]
  rows: Record<string, any>[]
  summaryAggregates: Record<string, any>
  totalRowCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

export interface DynamicReportQueryRequest {
  domainSource: ReportDomainSource
  selectedFields: string[]
  filters: DynamicFilterCondition[]
  groupByField?: string | null
  sortField?: string | null
  sortDescending?: boolean
  pageNumber: number
  pageSize: number
}

export interface DynamicFilterCondition {
  fieldName: string
  operator: 'equals' | 'notequals' | 'greaterthan' | 'lessthan' | 'contains'
  value: string
  secondValue?: string
}

export interface DynamicReportResult {
  columns: ReportColumnMetadata[]
  rows: Record<string, any>[]
  globalAggregates: Record<string, any>
  totalRows: number
}

export interface QueryableField {
  key: string
  persianLabel: string
  category: string
  dataType: string
  canFilter: boolean
  canGroup: boolean
  canAggregate: boolean
}

export interface DynamicQueryMetadata {
  source: ReportDomainSource
  sourcePersianName: string
  availableFields: QueryableField[]
}

export interface SavedReportPreset {
  id: string
  reportDefinitionId: string
  reportCode: string
  presetName: string
  filterCriteriaJson: string
  visibleColumnsJson?: string | null
  isSharedWithOffice: boolean
  createdAt: string
}
```

---

## 4. Frontend API Client (`frontend/lib/api/reporting.ts`)

```typescript
import { apiClient } from './client'
import {
  ExecutiveDashboard,
  ExecutiveKpiMetrics,
  MonthlyTrendPoint,
  TopDepartmentBudget,
  ReportDefinition,
  ReportFilterParameters,
  ReportExecutionResult,
  DynamicReportQueryRequest,
  DynamicReportResult,
  DynamicQueryMetadata,
  SavedReportPreset,
} from '@/types/reporting'

const BASE_URL = '/reporting'

export const reportingApi = {
  // 1. Executive Analytics
  async getDashboard(params?: { fiscalYear?: number; payrollCycleId?: string; officeId?: string }): Promise<ExecutiveDashboard> {
    const res = await apiClient.get<ExecutiveDashboard>(`${BASE_URL}/executive/dashboard`, { params })
    return res.data
  },

  async getKpis(fiscalYear?: number): Promise<ExecutiveKpiMetrics> {
    const res = await apiClient.get<ExecutiveKpiMetrics>(`${BASE_URL}/executive/kpis`, { params: { fiscalYear } })
    return res.data
  },

  async getMonthlyTrends(fiscalYear?: number): Promise<MonthlyTrendPoint[]> {
    const res = await apiClient.get<MonthlyTrendPoint[]>(`${BASE_URL}/executive/trends`, { params: { fiscalYear } })
    return res.data
  },

  async getDepartmentBudgets(payrollCycleId?: string): Promise<TopDepartmentBudget[]> {
    const res = await apiClient.get<TopDepartmentBudget[]>(`${BASE_URL}/executive/departments`, { params: { payrollCycleId } })
    return res.data
  },

  // 2. Standard Reports
  async getCatalog(source?: number): Promise<ReportDefinition[]> {
    const res = await apiClient.get<ReportDefinition[]>(`${BASE_URL}/standard/catalog`, { params: { source } })
    return res.data
  },

  async executeStandardReport(code: string, params: ReportFilterParameters): Promise<ReportExecutionResult> {
    const res = await apiClient.post<ReportExecutionResult>(`${BASE_URL}/standard/${code}/execute`, params)
    return res.data
  },

  async exportStandardReportExcel(code: string, params: ReportFilterParameters, fileName?: string): Promise<void> {
    const res = await apiClient.post(`${BASE_URL}/standard/${code}/export/excel`, params, {
      responseType: 'blob',
    })
    downloadBlob(res.data, fileName || `${code}_Report.xlsx`)
  },

  // 3. Dynamic Query Builder
  async getQueryMetadata(source: number): Promise<DynamicQueryMetadata> {
    const res = await apiClient.get<DynamicQueryMetadata>(`${BASE_URL}/builder/metadata/${source}`)
    return res.data
  },

  async executeDynamicQuery(request: DynamicReportQueryRequest): Promise<DynamicReportResult> {
    const res = await apiClient.post<DynamicReportResult>(`${BASE_URL}/builder/query`, request)
    return res.data
  },

  async exportDynamicQueryExcel(request: DynamicReportQueryRequest, fileName?: string): Promise<void> {
    const res = await apiClient.post(`${BASE_URL}/builder/export/excel`, request, {
      responseType: 'blob',
    })
    downloadBlob(res.data, fileName || 'Dynamic_Query_Report.xlsx')
  },

  // 4. Saved Presets
  async getSavedPresets(reportDefinitionId?: string): Promise<SavedReportPreset[]> {
    const res = await apiClient.get<SavedReportPreset[]>(`${BASE_URL}/saved`, { params: { reportDefinitionId } })
    return res.data
  },

  async savePreset(data: { reportDefinitionId: string; presetName: string; filterCriteriaJson: string; isSharedWithOffice?: boolean }): Promise<SavedReportPreset> {
    const res = await apiClient.post<SavedReportPreset>(`${BASE_URL}/saved`, data)
    return res.data
  },

  async deletePreset(id: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/saved/${id}`)
  },
}

function downloadBlob(data: BlobPart, filename: string) {
  const url = window.URL.createObjectURL(new Blob([data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.parentNode?.removeChild(link)
  window.URL.revokeObjectURL(url)
}
```

---

## 5. UI Layout & Navigation Architecture (`layout.tsx`)

`frontend/app/reporting/layout.tsx` renders a unified secondary navigation header with active tab styling and role gating:

```tsx
'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TrendingUp, FileSpreadsheet, Sliders, BookmarkCheck, BarChart3 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function ReportingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()

  const tabs = [
    { title: 'داشبورد مدیریتی (KPI)', href: '/reporting', icon: TrendingUp },
    { title: 'کاتالوگ گزارش‌های استاندارد', href: '/reporting/standard', icon: FileSpreadsheet },
    { title: 'گزارش‌ساز پویا', href: '/reporting/builder', icon: Sliders, minRole: 'Manager' },
    { title: 'الگوهای ذخیره‌شده', href: '/reporting/saved', icon: BookmarkCheck },
  ]

  const accessibleTabs = tabs.filter(t => !t.minRole || user?.role === 'Admin' || user?.role === t.minRole)

  return (
    <div className="min-h-screen bg-slate-50/50" dir="rtl">
      {/* Module Navigation Header */}
      <div className="bg-white border-b border-gray-200/80 shadow-xs sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="font-bold text-gray-900 text-sm sm:text-base">سامانه آمار و هوش تجاری</span>
            </div>

            <nav className="flex items-center gap-1 sm:gap-2">
              {accessibleTabs.map(tab => {
                const isActive = pathname === tab.href || (tab.href !== '/reporting' && pathname.startsWith(tab.href))
                const Icon = tab.icon
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-amber-50 text-amber-700 border border-amber-200/60 font-bold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.title}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Page Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}
```

---

## 6. Visual Component Specifications

### 6.1 `KpiCard.tsx`
Renders an animated glassmorphic counter card with icon, title, subtitle, and variance pill:
- **Props**: `title`, `value`, `unit`, `icon: LucideIcon`, `trendPercentage?`, `isPositiveTrend?`, `accentColor`.
- **Aesthetic**: White background, `rounded-2xl`, subtle border `border-gray-200/70`, shadow-sm, hover float transition.

### 6.2 `DepartmentBarChart.tsx`
Renders budget allocation vs consumed spending per department:
- Shows budget utilization meter bar.
- Color states:
  - **Green** (`bg-emerald-500`): `< 90%` consumption.
  - **Amber** (`bg-amber-500`): `90% - 100%` consumption.
  - **Red** (`bg-rose-500`): `> 100%` (Violation badge displaying excess amount).

### 6.3 `TrendChart.tsx`
Lightweight SVG monthly trend curve rendered in-browser without external library bloat:
- Line points with smooth quadratic bezier curves.
- Tooltip on hover displaying month name and formatted Rial amount.

### 6.4 `DynamicDataTable.tsx`
High-density responsive data table:
- Sticky header row with sorting arrows.
- Cell rendering based on metadata (`currency` uses Persian commas `toLocaleString('fa-IR')`, `badge` renders color pill).
- Bottom sticky summary row (`جمع کل` and bold sums).
- Pagination footer with page numbers and page size selector.
