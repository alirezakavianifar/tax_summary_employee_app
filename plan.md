
---

## 1. High-Level Architecture

### Stack (confirmed)

* **Frontend:** Next.js (App Router recommended)
* **Backend:** ASP.NET Core Web API
* **Database:** SQL Server
* **Auth:** JWT (or Windows Auth if internal-only)
* **Printing:** Browser print → PDF (exact layout)

### Overall Flow

```
User (Browser)
   ↓
Next.js (RTL Persian UI + Print Layout)
   ↓ REST / JSON
ASP.NET Core API
   ↓
SQL Server
```

---

## 2. Data Modeling (SQL Server)

Your form is  **highly structured** , so avoid a “blob JSON” approach.

### Core Tables

#### 2.1 Employee

```sql
Employees (
    Id UNIQUEIDENTIFIER PK,
    PersonnelNumber NVARCHAR(50),
    FirstName NVARCHAR(100),
    LastName NVARCHAR(100),
    Education NVARCHAR(200),
    ServiceUnit NVARCHAR(200),
    CurrentPosition NVARCHAR(200),
    AppointmentPosition NVARCHAR(200),
    PreviousExperienceYears INT,
    CreatedAt DATETIME2
)
```

#### 2.2 AdministrativeStatus

(for the middle section: leave, mission, overtime, etc.)

```sql
AdministrativeStatuses (
    Id UNIQUEIDENTIFIER PK,
    EmployeeId FK,
    MissionDays INT,
    IncentiveHours INT,
    DelayAndAbsenceHours INT,
    HourlyLeaveHours INT
)
```

#### 2.3 PerformanceCapabilities

(bottom section – multiple rows)

```sql
PerformanceCapabilities (
    Id UNIQUEIDENTIFIER PK,
    EmployeeId FK,
    SystemRole NVARCHAR(200),
    DetectionOfTaxIssues BIT,
    DetectionOfTaxEvasion BIT,
    CompanyIdentification BIT,
    ValueAddedRecognition BIT,
    ReferredOrExecuted BIT
)
```

> 💡 Why normalized?

* Easy reporting
* Easy versioning later
* Easy to add “year” or “period” columns later

---

## 3. Backend – ASP.NET Core

### 3.1 Project Structure

```
/Api
 ├── Controllers
 │    └── EmployeeReportsController.cs
 ├── Application
 │    ├── DTOs
 │    ├── Services
 ├── Domain
 │    ├── Entities
 ├── Infrastructure
 │    ├── DbContext
 │    ├── Repositories
```

### 3.2 Key Endpoints

```http
GET    /api/reports/{employeeId}
POST   /api/reports
PUT    /api/reports/{employeeId}
GET    /api/employees
```

### 3.3 DTO Example

```csharp
public class EmployeeReportDto
{
    public EmployeeDto Employee { get; set; }
    public AdministrativeStatusDto AdminStatus { get; set; }
    public List<PerformanceCapabilityDto> Capabilities { get; set; }
}
```

### 3.4 Important Backend Considerations

* **UTF-8 + NVARCHAR everywhere**
* Explicit Persian calendar support if needed
* Return  **print-ready structured data** , not HTML

---

## 4. Frontend – Next.js (Persian + RTL)

### 4.1 Project Setup

```bash
npx create-next-app@latest
```

Enable:

* App Router
* TypeScript

### 4.2 RTL + Persian Setup

* `dir="rtl"` at root layout
* Persian font (VERY important for print fidelity):
  * **IRANSansX**
  * **Vazirmatn**
  * **B Nazanin** (if allowed)

```tsx
<html lang="fa" dir="rtl">
```

### 4.3 Pages

```
/reports
   /[employeeId]
       view
       print
/admin
   employees
   reports
```

---

## 5. Exact Print Layout (MOST IMPORTANT PART)

This is where most projects fail — here’s how you avoid that.

### 5.1 Strategy

* **Do NOT rely on dynamic layout**
* Use **fixed dimensions**
* Mimic the paper exactly using CSS

### 5.2 Print Page Rules

* Dedicated route: `/reports/[id]/print`
* No buttons, no margins
* CSS `@media print` only

### 5.3 Page Size

```css
@page {
  size: A4;
  margin: 0;
}
```

### 5.4 Layout Technique

Use  **CSS Grid** , not flex.

```css
.report {
  width: 210mm;
  height: 297mm;
  padding: 10mm;
  box-sizing: border-box;
  font-family: 'Vazirmatn';
}
```

### 5.5 Table Borders (Exact Like Image)

```css
table {
  width: 100%;
  border-collapse: collapse;
}

td, th {
  border: 1px solid #000;
  padding: 6px;
  font-size: 12px;
}
```

### 5.6 Section Headers (Gray Bars)

```css
.section-title {
  background: #d9d9d9;
  font-weight: bold;
  padding: 6px;
}
```

> 🔑 **Do not use Tailwind for print layout**
> Plain CSS = predictable printing

---

## 6. Data Binding (Frontend)

### Pattern

* Fetch JSON from API
* Render into **static table structure**
* Empty cells stay empty (like paper form)

Example:

```tsx
<td>{employee.firstName || ''}</td>
```

No auto-resizing
No conditional hiding
Everything fixed

---

## 7. Printing Workflow

### User Flow

1. Admin opens report
2. Clicks **Print**
3. Browser opens `/print`
4. `window.print()` auto-triggered

```ts
useEffect(() => {
  window.print();
}, []);
```

### Browser Recommendation

* **Chrome / Edge**
* Disable headers & footers
* Scale = 100%

---

## 8. Security & Access Control

* Role-based access:
  * Viewer
  * Editor
  * Admin
* Backend validates employee access
* Frontend hides edit controls in print mode

---

## 9. Versioning & Future-Proofing

Highly recommended:

* Add `Year` or `Period` column
* Keep historical reports immutable
* Allow reprint of old versions

---

## 10. Testing Checklist (Critical)

✔ Persian text alignment
✔ Line breaks don’t shift borders
✔ Print matches scanned paper
✔ Different names lengths tested
✔ Empty fields don’t collapse rows

---

## 11. Optional Enhancements (Later)

* PDF generation server-side
* Bulk report generation
* Excel export
* Digital signature box
* QR code for verification

---

## Final Advice (from experience)

If **printing exactly like the image** is non-negotiable:

* Design the **print page first**
* Lock CSS early
* Treat it like designing a government form, not a website



Got it — I’ll describe the  **exact structural layout of the form** , section by section,  **independent of data** , so you can directly translate this into HTML/CSS or a report template.
This is based on the image you shared and how Iranian administrative forms are typically designed.

---

# Overall Page Structure

* **Paper size:** A4 (Portrait)
* **Single page**
* **All content inside one main bordered container**
* **RTL**
* **Grid / table-based**
* **No dynamic row heights**

---

# 1. Header Section (Top of Page)

### 1.1 Title Row (Full Width)

* One horizontal row
* Centered text
* Gray background
* Bold

**Text:**

```
فرم وضعیت داوطلبین ارتقاء و انتصاب به سطوح مدیریتی
```

---

### 1.2 Top Metadata Row

Split into  **two columns** :

| Left (large)                      | Right (small) |
| --------------------------------- | ------------- |
| Empty area for notes / signatures | QR Code       |

* Right column contains:
  * QR code
  * Small label text under or near it (e.g. کد رهگیری / شماره)

---

### 1.3 Photo Box

* On the **left side**
* A rectangular bordered box
* Text inside:
  **«عکس»**
* Fixed size (passport-style)

---

# 2. Personal & Employment Information Section

This section is a  **multi-row table** , 3 columns per row.

### Row Structure (repeated)

| Column 1 | Column 2 | Column 3 |
| -------- | -------- | -------- |

#### Row 1

* نام
* نام خانوادگی
* شماره پرسنلی

#### Row 2

* مدرک و رشته تحصیلی
* واحد محل خدمت
* سوابق خدمتی

#### Row 3

* پست سازمانی فعلی
* پست سازمانی موضوع انتصاب
* تجربه در سمت قبلی (سال)

All cells:

* Equal height
* Borders visible
* Labels inside cells (top-aligned)
* Data written under labels

---

# 3. Administrative Discipline Status

( **وضعیت نظم و انضباط اداری** )

### Section Header

* Full width
* Gray background
* Bold
* Text aligned right

---

### Two-Row, Three-Column Table

#### Row 1

| Column 1         | Column 2         | Column 3       |
| ---------------- | ---------------- | -------------- |
| استحقاقی | استعلاجی | ماموریت |

#### Row 2

| Column 1                       | Column 2                        | Column 3                       |
| ------------------------------ | ------------------------------- | ------------------------------ |
| مرخصی ساعتی مجاز | جمع تاخیر و تعجیل | اضافه کاری واقعی |

* These are numeric / duration fields
* Fixed row height
* No wrapping

---

# 4. Performance Capabilities (Main Evaluation Section)

### Section Header

* Full width
* Gray background
* Bold

**Text:**

```
توانمندی های عملکردی در سال جاری
```

---

### 4.1 Column Headers Row

Three columns:

| Left     | Middle                           | Right                             |
| -------- | -------------------------------- | --------------------------------- |
| وصول | تشخیص شرکت/مالیات | نقش در سامانه سنیم |

---

### 4.2 Capability Rows (Fixed Count)

Each row is a  **capability criterion** , not dynamic.

Examples of rows (right-aligned text):

1. تشخیص مشاغل مالیاتی
2. تشخیص مشاغل معوق مالیاتی
3. تشخیص ارزش افزوده / مالیات
4. تشخیص معوق ارزش افزوده / مالیات
5. تشخیص متفرقه مالیات
6. قرار ارجاع شده / قرار اجرا شده

Each cell:

* Empty or filled with ✔ / عدد / توضیح کوتاه
* Borders on all sides
* Same height across all rows

---

# 5. Visual & Formatting Rules (Important)

* **All borders are visible**
* **No rounded corners**
* **No shadows**
* **No icons**
* Gray color used only for:
  * Section headers
* Font size hierarchy:
  * Title: largest
  * Section headers: medium
  * Cell labels & data: small

---

# 6. Hierarchy Summary (Tree View)

```
Page
 ├── Header Title
 ├── Metadata Row (QR + empty)
 ├── Photo Box
 ├── Personal Info Table
 ├── Administrative Status Section
 │    ├── Header
 │    └── 2-row table
 └── Performance Capabilities Section
      ├── Header
      ├── Column headers
      └── Fixed capability rows
```

---

## What this gives you

* You can now:
  * Create **HTML tables with fixed rows**
  * Map **SQL columns 1:1**
  * Achieve **pixel-perfect print**
