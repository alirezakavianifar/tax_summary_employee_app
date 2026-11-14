---
name: tax-persian-rtl-print
description: >-
  Standards and utilities for Persian/Farsi RTL UI, Shamsi (Jalali) date handling, number/currency formatting, and exact physical A4 print layouts in the Tax Summary Employee App. Use this skill whenever editing date pickers, Iranian tax forms, currency displays, or printable reports and tables.
---

# Persian RTL, Jalali Dates & A4 Print Layout Skill

This skill enforces standards for Persian (Farsi) typography, right-to-left (RTL) styling, Shamsi/Jalali calendar math, and exact physical A4 print formatting across the application.

---

## 1. Jalali Date Management

### The Single Source of Truth: `frontend/lib/jalali.ts`
> [!IMPORTANT]
> **Never install or import external date libraries** (such as `moment-jalaali`, `dayjs`, or `jalaali-js`). All date algorithms, leap year calculations, and formatting must use `frontend/lib/jalali.ts`.

### Core Conversion & Formatting Functions
- **Gregorian to Jalali**:
  ```typescript
  import { gregorianToJalali, isoStringToJalali, formatIsoToJalali } from '@/lib/jalali'

  // Output: [1403, 8, 23]
  const [jy, jm, jd] = gregorianToJalali(2024, 11, 13)

  // Direct ISO string formatting: "1403/08/23"
  const jalaliDateStr = isoStringToJalali("2024-11-13T05:41:35Z")

  // Friendly display: "1403/08/23 09:11"
  const friendlyDateTime = formatIsoToJalali("2024-11-13T05:41:35Z", true)
  ```

- **Jalali to Gregorian (for API submissions)**:
  ```typescript
  import { jalaliToGregorian, jalaliToIsoString } from '@/lib/jalali'

  // Convert user input (1403, 8, 23) to ISO UTC string for backend storage
  const isoUtcString = jalaliToIsoString(1403, 8, 23)
  ```

- **Validation & Comparison**:
  ```typescript
  import { isValidJalaliDate, compareJalaliDates, isJalaliLeapYear } from '@/lib/jalali'

  if (!isValidJalaliDate("1403/08/23")) {
    // Show Persian validation error
  }
  ```

- **Shamsi Date Picker Component**:
  For all user-interactive date selection, use:
  ```tsx
  import ShamsiDatePicker from '@/components/ShamsiDatePicker'

  <ShamsiDatePicker
    label="تاریخ صدور برگ تشخیص"
    value={formState.assessmentDate}
    onChange={(val) => setFormState(prev => ({ ...prev, assessmentDate: val }))}
    required
  />
  ```

---

## 2. Digits, Currency & Persian Number Handling

### Digit Normalization
- **Backend-Bound Inputs**: Before sending user-entered IDs, national codes, or tracking numbers to the API, normalize Persian/Arabic digits to ASCII:
  ```typescript
  import { toEnglishDigits } from '@/lib/jalali'
  const cleanNationalCode = toEnglishDigits(userInput)
  ```
- **UI Display**: For official reports and read-only displays, convert English digits to Persian glyphs:
  ```typescript
  import { toPersianDigits } from '@/lib/jalali'
  <span>{toPersianDigits(amount)} ریال</span>
  ```

### Administrative Tracking Numbers
- Strip internal prefixes (e.g. `REF-`, `TRC-`) so Iranian tax administrators only see the clean reference:
  ```typescript
  import { formatCaseTrackingNumber } from '@/lib/jalali'
  // Returns "1402-8877" or "۱۴۰۲-۸۸۷۷"
  const displayNo = formatCaseTrackingNumber(taxRefundCase.trackingNumber, true)
  ```

### Monetary Amounts (Rials)
- Always display tax amounts with comma separators and the Persian unit:
  ```typescript
  export function formatRial(amount: number | bigint | null | undefined): string {
    if (amount == null) return '۰ ریال'
    return toPersianDigits(amount.toLocaleString('en-US')) + ' ریال'
  }
  ```

---

## 3. Exact Physical A4 Print Layouts (`@media print`)

Official tax documents (Tax Assessment Reports, Dispute Resolution Decrees, Refund Justification Reports) must print perfectly on physical A4 paper.

### Print CSS Architecture & Classes
- **`.no-print` / `print:hidden`**: Apply to navigation bars, top bars, action buttons, filter drawers, and pagination controls.
- **`.print-only` / `print:block`**: Elements that are invisible on screen but appear on paper (e.g., official letterheads, seal spaces, signature blocks, page numbers).
- **`.print-table`**: Table typography optimized for continuous print pagination:
  - Repeated headers on every page: `thead { display: table-header-group; }`
  - Repeated footers: `tfoot { display: table-footer-group; }`
  - Row break protection: `tr { break-inside: avoid; page-break-inside: avoid; }`
- **Color Preservation**: Ensure borders and shaded table headers remain visible in print dialogs:
  ```css
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
  ```

### Page Orientation Rules
Define page geometry in layout-specific print components:
```tsx
// Portrait Form Layout
<style jsx global>{`
  @media print {
    @page {
      size: A4 portrait;
      margin: 12mm 15mm 15mm 15mm;
    }
  }
`}</style>

// Landscape Performance Grid / Report Layout
<style jsx global>{`
  @media print {
    @page {
      size: A4 landscape;
      margin: 10mm 10mm 10mm 10mm;
    }
  }
`}</style>
```

---

## 4. Quality Checklist for Persian RTL & Print Views

Before submitting changes to any Persian view or printable form:
1. [ ] Container has `dir="rtl"` and uses the Vazirmatn font family.
2. [ ] All date formatting uses `frontend/lib/jalali.ts` (zero third-party date packages).
3. [ ] Numbers sent to backend queries are converted with `toEnglishDigits()`.
4. [ ] In print preview, topbars, sidebars, and action buttons are cleanly hidden (`no-print`).
5. [ ] Tables do not break awkwardly across mid-row (`break-inside: avoid`).
6. [ ] Signature blocks and approvals remain anchored together at the bottom of the form.

