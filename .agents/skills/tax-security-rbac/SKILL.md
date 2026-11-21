---
name: tax-security-rbac
description: >-
  Security architecture, authentication, role-based access control (RBAC), and dynamic navigation protocols. Use this skill whenever managing JWT tokens, refresh cookie rotation, user roles (Admin, Manager, Employee, OfficeHead, Expert, Auditor), dynamic menu settings (MenuSetting), branding configurations, or audit logs.
---

# Security Architecture, RBAC & Dynamic Menus Skill

This skill governs user authentication, token rotation, role-based authorization, database-driven menu navigation, and system auditing across the ASP.NET Core 8 Web API backend and Next.js 14 App Router frontend.

---

## 1. Authentication Architecture & Token Lifecycle

The application employs a dual-token JWT + HttpOnly refresh cookie security model:

```
Client (Next.js)                 Backend (ASP.NET Core 8 Web API)
  │                                    │
  ├─ POST /api/auth/login ────────────>│ Validates BCrypt hash
  │<─ Access Token (JSON) ─────────────┤ Sets HttpOnly Cookie 'refreshToken'
  │   (15-minute lifetime)             │ (7-day lifetime, IP/UserAgent bound)
  │                                    │
  ├─ Authenticated API Calls ─────────>│ Validates Bearer Header + IP Rate Limit
  │                                    │
  ├─ 401 Unauthorized (Token Expired) ─┤
  ├─ POST /api/auth/refresh-token ────>│ Validates & Rotates Refresh Token
  │<─ New Access Token ────────────────┤ Sets New HttpOnly Refresh Cookie
```

### Security Tokens Protocol
- **Access Token**: Short-lived JWT (HS256) stored strictly in memory (`tokenManager.ts`). Contains claims: `nameid` (Guid), `unique_name` (Username), `role`, `officeId`, `fullName`.
- **Refresh Token**: Cryptographically secure random token stored in SQLite (`RefreshToken` entity), transmitted exclusively via `HttpOnly`, `SameSite=Strict`, `Secure` cookie.
- **Token Rotation**: Every refresh request revokes the old refresh token and issues a new pair, preventing replay attacks.

---

## 2. Role-Based Access Control (RBAC) Matrix

The system recognizes six distinct hierarchical roles defined in `UserRole` (`frontend/types/auth.ts` & `Backend/TaxSummary.Domain/Entities/Role.cs`):

| Role Key | Persian Display | Scope & Permitted Operations |
| :--- | :--- | :--- |
| **`Admin`** | مدیر ارشد سیستم | Full system access: User management, system settings, branding, rule sets, menu settings, audit logs. |
| **`Manager`** | مدیر کل / معاون | Provincial overview: Approval of finalized payroll cycles, refund stage 6 approval, executive reporting. |
| **`OfficeHead`** | رئیس امور مالیاتی | Office-scoped: Article 238 agreements, office payroll submission, office employee performance reviews. |
| **`Expert`** | کارشناس مسئول | Operational handling: Refund stage 2/3 reviews, justification report preparation, dataset tweaking. |
| **`Auditor`** | کارشناس رسیدگی / ممیز | Field audit operations: Viewing personal scorecards, assigned dossiers, and submitting assessment details. |
| **`Employee`** | کارمند عادی | Basic self-service: Viewing personal profile, attendance, and overtime history. |

---

## 3. Dynamic Database-Backed Menu Navigation (`MenuSetting`)

Navigation links in the sidebar and portal cards are dynamically controlled via the database (`MenuSetting` entity) and synced through `MenuSettingsContext.tsx`:

### Menu Control Invariants:
1. **Dynamic Visibility**: Admins can enable/disable menu items or change display orders in `/admin/menu-settings`.
2. **Action-Level Permissions**: Sub-actions within pages (e.g. `CanEdit`, `CanDelete`, `CanExport`) are validated via `isActionVisible(actionKey, moduleKey)`.
3. **Route Protection Guard**: Every protected page must wrap its content in `<ProtectedRoute>`:
   ```tsx
   <ProtectedRoute requiredRoles={[UserRole.Admin, UserRole.Manager]} requiredModule="payroll">
     <PayrollCycleView />
   </ProtectedRoute>
   ```

---

## 4. Rate Limiting & API Security Guidelines

- **Rate Limiting Policies (`Program.cs`)**:
  - `AuthPolicy`: 10 requests per minute per IP to prevent brute-force attacks on `/api/auth/login`.
  - `GeneralPolicy`: Sliding window of 100 requests per minute per IP across business endpoints.
- **Controller Decoration**:
  ```csharp
  [ApiController]
  [Route("api/[controller]")]
  [EnableRateLimiting("GeneralPolicy")]
  [Authorize] // Enforce authentication by default
  public class SensitiveOperationsController : ControllerBase { ... }
  ```
- **Auditing**: All mutations (`POST`, `PUT`, `DELETE`) are automatically intercepted and recorded in `AuditLog` via EF Core interceptors (`AuditLogInterceptor.cs`), capturing User ID, IP, Entity Name, Action, and Before/After JSON states.

---

## 5. Organizational Branding & System Settings (`/admin/branding`)

The system enables white-label organizational customization:
- Custom logo upload stored via `IFileStorageService`.
- System title, organization name, and copyright notice stored in `SystemSetting`.
- Portal footer settings: Official identity badge (`[🛡️ سامانه رسمی]`), version tag, and external organizational links.
