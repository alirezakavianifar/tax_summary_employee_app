---
name: tax-frontend-architecture
description: >-
  Architectural patterns, component hierarchy, API client standards, and routing guidelines for the Next.js 14 App Router frontend in the Tax Summary Employee App. Use this skill whenever creating or editing React components, pages under frontend/app, API clients in frontend/lib/api, contexts, or role-based protected routes.
---

# Frontend Architecture & Next.js 14 App Router Skill

This skill defines the architectural standards, directory hierarchy, component patterns, API client protocols, and security/navigation rules for the **Next.js 14 App Router** frontend.

---

## 1. Directory Structure & Layering

The frontend lives under `frontend/` and follows strict modular boundaries:

```text
frontend/
├── app/                  # Next.js 14 App Router pages, layouts, and route handlers
│   ├── layout.tsx        # Root layout (Vazirmatn fonts, AuthProvider, MenuSettingsProvider, AppShell)
│   ├── page.tsx          # Home / landing page
│   ├── admin/            # Administrative pages (users, roles, menu-settings, audit-logs)
│   ├── payroll/          # Payroll cycles, department submissions, and calculation history
│   ├── refunds/          # Tax refund cases, calculator, editor, and print layouts
│   └── reporting/        # Executive KPIs, 360-degree scorecards, builder, and standard reports
├── components/           # Reusable UI and domain-scoped components
│   ├── layout/           # AppShell, TopBar, SidebarNav, usePortalNavigation
│   ├── admin/            # Admin-specific modals (MenuItemFormModal, PersonnelImportModal)
│   ├── payroll/          # Payroll-specific modals and widgets (SendToOfficesModal)
│   ├── portal/           # Landing page cards (ModuleCard)
│   ├── refunds/          # Refund editors, table allocations, and modals
│   ├── reporting/        # Scorecards, charts, filter bars, tweak drawers
│   ├── CustomSelect.tsx  # Searchable Persian dropdown select
│   ├── PhotoUpload.tsx   # Employee photo upload with cropping / preview
│   ├── ProtectedRoute.tsx# RBAC and menu visibility route guard
│   └── ShamsiDatePicker.tsx # Reusable Persian Jalali date picker
├── contexts/             # Global React Contexts
│   ├── AuthContext.tsx   # Session state, login/logout, user profile
│   └── MenuSettingsContext.tsx # Dynamic database-backed menu visibility and permissions
├── lib/                  # Utilities, API clients, and constants
│   ├── api/              # Modular API client methods using shared apiClient
│   │   ├── client.ts     # Axios instance (JWT interceptors, 401 refresh, 60s timeout)
│   │   ├── auth.ts       # Auth endpoints (login, refresh, logout)
│   │   └── <feature>.ts  # Domain API functions (e.g. taxRefund.ts, reporting.ts)
│   ├── constants/        # Fixed role presets and system constants
│   ├── icons/            # Lucide icon mapping and resolvers
│   └── jalali.ts         # Single source of truth for Shamsi dates and Persian formatting
└── types/                # TypeScript contracts matching backend DTOs and view models
```

---

## 2. Next.js 14 App Router Guidelines

### Client Component Boundaries (`'use client'`)
- Any page or component using React hooks (`useState`, `useEffect`, `useContext`, `useMemo`), browser APIs (`window`, `localStorage`), or client interactions (event handlers, modals) **must** start with `'use client'` on line 1.
- Place `'use client'` at the component level whenever possible to keep parent layouts as lightweight server components.

### Mandatory `<Suspense>` for `useSearchParams()`
> [!IMPORTANT]
> In Next.js 14 App Router, any component calling `useSearchParams()` **must** be wrapped in a `<Suspense>` boundary. Failing to do so causes Next.js to de-optimize the entire page and bail out of static/prerender optimizations during `next build`.
> 
> ```tsx
> 'use client'
> import { Suspense } from 'react'
> import { useSearchParams } from 'next/navigation'
> 
> function FeatureContent() {
>   const searchParams = useSearchParams()
>   const tab = searchParams?.get('tab') || 'default'
>   return <div>{/* Page Content */}</div>
> }
> 
> export default function FeaturePage() {
>   return (
>     <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری...</div>}>
>       <FeatureContent />
>     </Suspense>
>   )
> }
> ```

---

## 3. API Communication Protocol (`@/lib/api`)

### Centralized `apiClient` Rule
> [!WARNING]
> **Never** use raw `fetch()` or construct ad-hoc `axios.create()` instances for backend calls.
> Always import and use `apiClient` from `@/lib/api/client`.

`apiClient` automatically provides:
1. **JWT Bearer Injection**: Automatically attaches `Authorization: Bearer <token>` from in-memory token manager.
2. **Silent 401 Token Refresh**: When an access token expires, an interceptor automatically attempts token rotation via the HttpOnly refresh cookie, retries the original request seamlessly, or redirects to `/login` if expired.
3. **60-Second Timeout**: Configured to accommodate complex SQLite aggregations without premature client termination.

### Standard API Service Function Pattern
Create modular functions in `frontend/lib/api/<feature>.ts`:
```typescript
import { apiClient } from './client'
import type { FeatureDto, CreateFeaturePayload } from '@/types/feature'

export const featureApi = {
  async getAll(): Promise<FeatureDto[]> {
    const response = await apiClient.get<FeatureDto[]>('/feature')
    return response.data
  },

  async getById(id: number): Promise<FeatureDto> {
    const response = await apiClient.get<FeatureDto>(`/feature/${id}`)
    return response.data
  },

  async create(payload: CreateFeaturePayload): Promise<FeatureDto> {
    const response = await apiClient.post<FeatureDto>('/feature', payload)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/feature/${id}`)
  },
}
```

### Error Extraction from Backend `Result.Failure`
The backend returns errors in the shape `{ error: string }`. Always extract and display this message:
```typescript
try {
  await featureApi.create(payload)
  // Show success toast or navigate
} catch (err: any) {
  const errorMessage = err.response?.data?.error || 'خطایی در پردازش درخواست رخ داد.'
  setError(errorMessage)
} finally {
  setSubmitting(false)
}
```

---

## 4. Access Control & Dynamic Menus (`ProtectedRoute`)

All administrative and business feature pages must be wrapped in `<ProtectedRoute>`:

```tsx
'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { UserRole } from '@/types/auth'

export default function RefundsPage() {
  return (
    <ProtectedRoute
      requiredRoles={[UserRole.Admin, UserRole.Manager, UserRole.Employee]}
      requiredModule="module_tax_refund"
      requiredAction="action_refund_list"
    >
      <div className="p-6">
        {/* Protected View */}
      </div>
    </ProtectedRoute>
  )
}
```

### Dynamic Menu Synchronization
The application features a database-backed dynamic menu system managed via `MenuSettingsContext.tsx`. When introducing a new module or action route:
1. Check `MODULE_KEY_MAP` in `frontend/contexts/MenuSettingsContext.tsx` to ensure the module key exists.
2. Add the route to `ACTION_ROUTE_MAP` in `frontend/contexts/MenuSettingsContext.tsx`.
3. If new default settings are needed, register them in `Backend/TaxSummary.Domain/Common/DefaultMenuSettings.cs` to ensure backend DB seeds stay in sync.

---

## 5. Form Handling & Component Best Practices

### Form Submission Discipline
- Always implement a submission lock state:
  ```tsx
  const [submitting, setSubmitting] = useState(false)
  ```
- Disable submit buttons and display a spinner while `submitting === true` to prevent duplicate concurrent writes.
- Convert input numbers and tracking codes using `toEnglishDigits()` before dispatching payloads to the backend.

### Shared UI Components
Prefer existing reusable components over hand-rolled inputs:
- `<ShamsiDatePicker />`: For all Persian date inputs.
- `<CustomSelect />`: For searchable dropdowns with keyboard navigation.
- `<PhotoUpload />`: For employee photo selection, preview, and cropping.
- `<ShebaInput />`: For Iranian IBAN (Sheba) number entry with standard `IR` prefix masking.

---

## 6. Build & Standalone Deployment Verification

The project is configured for offline standalone deployment (`output: 'standalone'` in `next.config.js`).

When modifying frontend components or dependencies:
1. Ensure no external web-font CDNs or unbundled remote stylesheets are referenced.
2. Test that TypeScript types and App Router pages compile cleanly:
   ```powershell
   cd frontend
   npm run build
   ```
3. Verify that new routes render properly inside `<AppShell>` with RTL alignment (`dir="rtl"`).

