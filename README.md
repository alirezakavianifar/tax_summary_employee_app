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
   - Dynamic custom Excel dataset ingestion into isolated SQLite schemas (`cd_...`) with column customization via Tweak Studio.
   - Dynamic Report Menu Assignment: One-click report pinning from catalog cards and report views directly into the primary reports navigation tree.
   - Persian (Jalali) creation date stamping and sorting across catalog cards, report execution views, and official A4 landscape letterheads.
   - Time-To-Live (TTL) visibility periods and automated archiving for ad-hoc reports, with countdown badges and administrative lifecycle renewal.
   - High-level executive KPI dashboards, monthly trend charts, and Excel report generators.

5. **Tax Assessment Employee Performance Evaluation System (SRS v1.0 & Auditor Metrics) (`/admin/auditor-metrics`)**:
   - **7 Tax Case Categories**: Corporate Income Tax (300 Major Cases / Configurable Major Cases), Other Corporate, VAT (300 Legal Cases), Other Legal VAT, Business Income (Individuals), Individual VAT, and Property Tax.
   - **8 Performance Indicators (FR-01 to FR-08)**: Issued Tax Assessments, Finalized Tax Assessments, Taxpayer Acceptance (تمکین), Article 238 Agreements, Assessment Growth ($>700\%$ legal / $>500\%$ individual), Finalized Tax Adjustment Penalty ($>15\%$), Assessment Issuance Speed (from Step 2), and Finalization Speed (from Step 2).
   - **Dynamic Modifiable Rules**: Interactive $8 \times 7$ scoring weight matrix editor, configurable growth/adjustment thresholds, category-specific allowed processing days (30/45/60 days), daily delay deduction rate ($0.25$ points/day), and one-click reset to official SRS v1.0 defaults.
   - **Configurable Important Cases & Excel Ingestion Modal**:
     - Flexible naming & dynamic category labels (e.g. "۱۰۰ پرونده مهم", "۳۰۰ پرونده کلیدی", "پرونده‌های کلیدی شرکت‌های بزرگ", etc.) without hardcoded limits.
     - Multi-tier Sanim tagging (`300Parvande`, `100Parvande`, custom tags) with dynamic propagation across matrix headers, auditor scorecards, and official A4 printouts.
     - Interactive upload & pre-import inspection dialog (`ImportantCasesUploadModal.tsx`) with automatic column detection (TIN, tracking, type), row counters, matching Sanim case counters, and sample record validation table.
     - Flexible matching modes: selective tagging by `type` column or blanket marking ("all rows are important"), with append vs. replace-all options.
   - **Provincial Leaderboard & 360 Scorecards**: Real-time evaluation of all 230+ provincial auditors with dynamic model switcher (`SRS بخشنامه مصوب` vs `شاخص‌های ترکیبی سنیم`), performance tiers (A/B/C/D), positive vs penalty decomposition, and detailed $8 \times 7$ printable A4 scorecard modal.
   - **Dual-Sheet Formula-Driven Verification Excel Export & Raw Ingestion**:
     - Generates an authentic two-sheet RTL Excel verification workbook directly from /admin/auditor-metrics and report evaluation tabs.
     - **Sheet 1 (داده‌های خام رسیدگی)**: All raw audit case records, classified into the 7 tax categories, with turnaround days and indicator verification flags (FR-01 to FR-08).
     - **Sheet 2 (رتبه‌بندی و محاسبات فرمولی)**: Complete employee performance ranking table powered by native **Excel formulas** (COUNTIFS, SUM, RANK, IF) dynamically linked to Sheet 1 and an embedded  \times 7$ scoring parameter matrix. Any adjustment to raw data or weights dynamically recalculates rankings natively inside Microsoft Excel.
     - **Direct Raw Excel Ingestion Modal (AuditorVerificationUploadModal.tsx)**: Drag-and-drop raw Sanim audit Excel files for immediate automated processing and instant verification workbook download.
   - **Dynamic Evaluation Model Visibility & Default Control**: Full administrative control in `/admin/auditor-metrics` to show, hide, or set the default active evaluation model (SRS $8 \times 7$ vs Sanim Combined $100$-point scale) across user reports with automatic guardrails preventing simultaneous deactivation.

6. **Administration & Dynamic Menu Management (`/admin`)**:
   - Granular Role-Based Access Control (Admin, Manager, Employee, OfficeHead, Expert, Auditor).
   - Database-backed dynamic menu visibility management and collapsible RTL sidebar navigation.
   - **Collapsed Sidebar Menu Interaction Control (`/admin/menu-settings`)**: Administrators can configure whether submenus in the collapsed mini-sidebar (icon rail) expand upon **Click** or automatically upon mouse **Hover** (with debounced pointer traversal and full touch/keyboard accessibility).
   - **Excel Report Creation, Editing & Deletion RBAC Controls**: Administrators can configure role-based access for custom reports in `/admin/menu-settings`:
     - Creation (`action_reporting_create_custom_dataset`): Restricts new dataset generation from Excel to designated organizational roles.
     - Editing / Tweaking (`action_reporting_edit_custom_dataset`): Restricts column customization, Persian header changes, aggregations, quick filters, and TTL extensions.
     - Deletion (`action_reporting_delete_custom_dataset`): Restricts physical deletion of custom reports and dropping of underlying SQLite tables.
   - **Report-Level Multi-Role Access Control**: Full multi-role permission management for standard and custom reports. Reports without explicit restrictions inherit general catalog access, while sensitive reports can be restricted to specific organizational roles (DirectorGeneral, Manager, Expert, Auditor, etc.) directly in the Excel Upload Wizard and the Report Tweak Studio.
   - **Report Domain Category Management (`/admin/report-categories`)**: Complete administrative control to create, edit, sort, and toggle active status of report categories. Enforces strict zero-orphan report policy where every report must belong to a valid category, and blocks category deletion if reports are attached.
   - Dynamic organizational branding, custom logo upload, system-wide title management, and dynamic portal footer customization with official identity badge (`[🛡️ سامانه رسمی]`), copyright text, version badge, and interactive links list (`/admin/branding`).
   - Dynamic Portal Operational Cards & Home Page Management (`/admin/menu-settings`): Administrators can customize module titles, descriptions, color themes (8 distinct corporate palettes), group badge tags, icons, and display ordering directly for both built-in and custom modules.
   - Dynamic Report Assignment & Submenu Configuration: Administrators can add custom menu items under the Reports module and link them directly to standard reports or uploaded Excel datasets (`REP_...`) with searchable report catalog selection and automatic route generation.
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
- **Agent Skills:** Comprehensive agent runbooks and domain guidelines stored in `.agents/skills/`:
  - `tax-clean-architecture`: Layer-by-layer C# development standards and Clean Architecture discipline.
  - `tax-frontend-architecture`: Next.js 14 App Router, ProtectedRoute, component hierarchy, and API client rules.
  - `tax-persian-rtl-print`: Jalali calendar algorithms, Persian formatting, and exact physical A4 print styling.
  - `tax-reporting-analytics`: Dynamic SQLite datasets (`cd_` tables), executive dashboards, and A4 reporting.
  - `tax-service-ops`: Dual-service management, port monitoring (5000/3000), and health verification via `scripts/manage-app.ps1`.
  - `tax-refund-workflow`: Articles 242/243 mechanization, 8-stage state machine, 1.5%/month statutory delay interest engine, and justification reports.
  - `tax-payroll-engine`: Collaborative payroll cycles, 120-hour labor limit validations, office budget caps, and EPPlus 7 RTL live formula Excel generation.
  - `tax-auditor-metrics`: SRS v1.0 circular rules, 8x7 scoring weight matrix, FR-01 to FR-08 indicators, Sanim data sync, and provincial scorecards.
  - `tax-security-rbac`: Dual-token JWT & HttpOnly cookie rotation, 6-role permission matrix, dynamic database-backed menu navigation, and audit trails.
  - `tax-deployment-packaging`: Offline server hosting, minimal update packaging (`build_deployment.ps1 -UpdateOnly`), and production database/asset safety.
  - `tax-browser-verification`: End-to-end browser automation, DevTools bridge setup, and live UI verification protocol using the Antigravity browser subagent and Chrome DevTools Protocol.
