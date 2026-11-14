# Tax Summary Employee Management Platform
## سامانه یکپارچه امور سازمانی و مالیاتی اداره کل امور مالیاتی

A modern, full-stack enterprise web application for managing employee performance evaluations, collaborative payroll computations, mechanized tax refunds under Articles 242/243, and executive business intelligence scorecards. Built with **Clean Architecture** on **ASP.NET Core 8** and **Next.js 14 App Router**.

---

## 🚀 Core Platform Modules

```
┌──────────────────────────────────────────────────────────────────────────┐
│              Tax Summary Enterprise Application Suite                    │
├─────────────────┬──────────────────┬──────────────────┬──────────────────┤
│ 1. Performance  │ 2. Collaborative │ 3. Tax Refund    │ 4. Executive     │
│    Evaluation   │    Payroll       │    Mechanization │    Reporting     │
│    (`/reports`) │    (`/payroll`)  │    (`/refunds`)  │    (`/reporting`)│
└─────────────────┴──────────────────┴──────────────────┴──────────────────┘
```

1. **Employee Performance & Evaluation (`/reports`)**:
   - Comprehensive employee administrative profiles, dossier management, and photo upload.
   - Capability metrics: tax issue detection, tax evasion discovery, and corporate audit performance.
   - Exact physical A4 print-ready evaluation forms matching Iranian tax administration templates.

2. **Collaborative Payroll & Overtime Processing (`/payroll`)**:
   - Automated overtime, welfare, and bonus processing directly from uploaded Excel workbooks.
   - Multi-department budget caps enforcement (including statutory 120-hour labor limits).
   - Formatted RTL multi-sheet Excel export with embedded formulas via EPPlus 7.

3. **Mechanized Tax Refund System (`/refunds`)**:
   - End-to-end processing of taxpayer excess payment refunds under **Articles 242 & 243 of the Direct Taxes Act (ق.م.م)**.
   - 8-stage workflow approval state machine, debt inquiry tracking, and treasury debt deduction.
   - Automated 1.5%/month statutory delay interest compensation engine.
   - Automated generation of official justification reports (گزارش توجیهی), payment orders, and PDF archives.

4. **Executive Reporting & Business Intelligence (`/reporting`)**:
   - 360-degree performance evaluation and auditor scorecards across historical tax dispute resolution decrees.
   - Dynamic 5-step report builder with pivot grouping, parametric filters, and aggregation.
   - High-level executive KPI dashboards, monthly trend charts, and Excel report generators.

5. **Administration & Dynamic Menu Management (`/admin`)**:
   - Granular Role-Based Access Control (Admin, Manager, Employee, OfficeHead, Expert, Auditor).
   - Database-backed dynamic menu visibility management and collapsible RTL sidebar navigation.
   - Dynamic organizational branding, custom logo upload, system-wide title management, and dynamic portal footer customization with copyright text, version badge, and interactive links list (`/admin/branding`).
   - Dynamic Portal Operational Cards & Home Page Management (`/admin/menu-settings`): Administrators can customize module titles, descriptions, color themes (8 distinct corporate palettes), group badge tags, icons, and display ordering directly for both built-in and custom modules.
   - System audit trail and security logging.

---

## 🛠 Technology Stack

### Backend
- **Framework:** ASP.NET Core 8 Web API
- **Architecture:** Clean Architecture (`Domain` $\rightarrow$ `Application` $\rightarrow$ `Infrastructure` $\rightarrow$ `Api`)
- **Database / ORM:** SQLite (`taxsummary.db`) with Entity Framework Core 8
- **Validation & Mapping:** FluentValidation (with Persian error messages) & AutoMapper
- **Security:** JWT Bearer (HS256) with HttpOnly refresh cookies, BCrypt password hashing, IP rate limiting
- **Excel & Document Engine:** EPPlus 7, MiniExcel, and PDF Document storage

### Frontend
- **Framework:** Next.js 14 (App Router, React 18, TypeScript)
- **Styling & Typography:** Tailwind CSS, RTL layout (`dir="rtl"`), Vazirmatn & Persian B-Fonts
- **Print Engine:** Physical A4 layout engine with CSS `@media print`, repeated table headers, and page break isolation
- **State & Routing:** ProtectedRoute RBAC guard, AuthContext, MenuSettingsContext, BrandingContext

---

## ⚡ Quick Start & Management

The application features a centralized management script for development and operations:

```powershell
# Start both Backend and Frontend services
.\scripts\manage-app.ps1 start

# Check HTTP health and listening ports (5000 / 3000)
.\scripts\manage-app.ps1 health

# View current process status and PIDs
.\scripts\manage-app.ps1 status

# Stop all background services
.\scripts\manage-app.ps1 stop
```

- **Frontend Application:** `http://localhost:3000`
- **Backend Web API:** `http://localhost:5000`
- **Swagger Documentation:** `http://localhost:5000` or `http://localhost:5000/swagger`

---

## 📦 Production Builds & Deployment

The system is designed for fully offline enterprise deployment on Windows Server:

```powershell
# Generate minimal zipped update package (~4 MB) for production
powershell -ExecutionPolicy Bypass -File .\build_deployment.ps1 -UpdateOnly
```

The output `deployment_update.zip` contains modified binaries and the Next.js standalone build while protecting production SQLite data and uploaded photos from being overwritten.

---

## 📚 Documentation & Customizations

- **Master System Documentation:** Consult [`DOCUMENTATION.md`](./DOCUMENTATION.md) for the complete reference on data models, REST endpoints, and architectural layers.
- **Security Guide:** Consult [`security.md`](./security.md) for threat modeling, password reset flows, and audit protocols.
- **Offline Deployment:** Consult [`deployment/install_guide.md`](./deployment/install_guide.md) for server installation steps.
- **Agent Skills:** Agent runbooks are stored in `.agents/skills/`:
  - `tax-clean-architecture`: Layer-by-layer C# development standards.
  - `tax-frontend-architecture`: Next.js 14 App Router, ProtectedRoute, and API client rules.
  - `tax-persian-rtl-print`: Jalali calendar algorithms and physical A4 print styling.
