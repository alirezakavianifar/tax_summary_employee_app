---
name: tax-refund-workflow
description: >-
  Operational and architectural guide for the Mechanized Tax Refund System under Articles 242 and 243 of the Direct Taxes Act (ق.م.م). Use this skill whenever creating, modifying, or debugging refund cases, state machine transitions, statutory delay interest calculations (1.5%/month), debt inquiries, or official justification reports (گزارش توجیهی).
---

# Tax Refund Workflow & Article 242/243 Mechanization Skill

This skill governs the end-to-end processing of taxpayer excess tax payments (استرداد مالیات اضافه دریافتی) pursuant to **Articles 242 and 243 of the Direct Taxes Act (قانون مالیات‌های مستقیم)** across the ASP.NET Core 8 Web API backend and Next.js 14 App Router frontend.

---

## 1. Domain Overview & Statutory Framework

```
Taxpayer Overpayment Incurred (Receipts / قبوض پرداختی)
  ↓
1. Case Registration (ثبت پرونده استرداد & تخصیص شماره رهگیری)
  ↓
2. Tax Assessment & Audit (فرآیند رسیدگی و قطعی‌سازی مالیات عملکرد/ارزش افزوده)
  ↓
3. Debt Inquiry & Inter-Departmental Clearance (استعلام بدهی‌های قطعی مودی - سامانه سنیم)
  ↓
4. Statutory Calculation Engine (محاسبه مازاد پرداختی و خسارت تاخیر ۱.۵٪ ماهانه م. ۲۴۳)
  ↓
5. Multi-Stage Workflow Approval (چرخه تاییدات سلسله‌مراتبی: کارشناس → رئیس امور → خزانه)
  ↓
6. Justification Report & Payment Order (صدور گزارش توجیهی چاپی A4 و حواله پرداخت بانکی)
```

### Statutory Basis:
- **Article 242 (ماده ۲۴۲ ق.م.م)**: اداره امور مالیاتی موظف است در صورتی که پس از رسیدگی، مالیات قطعی کمتر از مبالغ پرداختی مودی باشد، مازاد دریافتی را مسترد نماید.
- **Article 243 (ماده ۲۴۳ ق.م.م)**: در صورتی که درخواست استرداد از طرف اداره امور مالیاتی رد شود یا ظرف ۳ ماه مسترد نگردد، مودی مستحق دریافت خسارت تاخیر معادل **۱.۵ درصد در ماه (۱.۵%/month)** از تاریخ درخواست یا پرداخت وجه خواهد بود.

---

## 2. 8-Stage State Machine & Transition Rules

The lifecycle of `TaxRefundCase` is strictly managed via `RefundWorkflowStep` and `TaxRefundApprovalAction`:

| Step | State Key | Persian Title | Permitted Actions | Transition Trigger |
| :---: | :--- | :--- | :--- | :--- |
| **1** | `Draft` | پیش‌نویس | ویرایش اطلاعات، الصاق قبوض | ثبت و ارسال به کارشناس |
| **2** | `UnderReview` | در حال بررسی کارشناسی | بررسی مدارک، ثبت برگ تشخیص | تایید اولیه کارشناس |
| **3** | `DebtInquiry` | استعلام بدهی سایر منابع | استعلام از سنیم/اجرا، ثبت بدهی | ثبت کلیه پاسخ‌های استعلام |
| **4** | `Calculated` | محاسبه مازاد و خسارت | محاسبه توسط موتور محاسباتی | تایید ارقام محاسبه‌شده |
| **5** | `JustificationReport`| گزارش توجیهی | تولید گزارش ماده ۲۴۲/۲۴۳ | ارسال به رئیس اداره/امور |
| **6** | `OfficeHeadApproved`| تایید رئیس امور مالیاتی | امضای الکترونیک / ثبت نظر | تایید و ارجاع به امور مالی |
| **7** | `TreasuryApproved` | تایید امور مالی و خزانه | تخصیص اعتبار و کسر تهاتر | صدور حواله پرداخت |
| **8** | `PaymentIssued` | پرداخت و مختومه | ثبت شماره شبا و پیگیری بانک | اتمام چرخه استرداد |

### Transition Invariants
1. **Receipts Required**: A case cannot transition past `UnderReview` without at least one valid payment receipt (`TaxRefundReceipt`) allocated.
2. **Debt Deduction Strictness**: Any liabilities recorded in `TaxRefundLetter` (`TotalDiscoveredDebts`) are deducted from `GrossSurplus` before determining `PrincipalTaxRefund`.
3. **No Retroactive Deletions**: Once a case reaches `OfficeHeadApproved` (Step 6) or higher, the case and its linked receipts/assessments become **immutable** and cannot be deleted or unlinked.

---

## 3. Mathematical & Statutory Calculation Engine (`RefundCalculationEngine.cs`)

All statutory calculations must execute through `RefundCalculationEngine`:

```csharp
// 1. Table A: Paid Receipts Aggregation (جمع کل پرداختی‌های مودی)
TotalPaidAmount = Receipts.Sum(r => r.AmountRials);

// 2. Assessment Balance (مانده پس از قطعی‌سازی)
TaxableBase = Math.Max(0, Assessment.AssessedIncome - Assessment.Exemptions);
TotalAssessedTax = Assessment.AssessedTax + Assessment.NonWaivablePenalties;

// SurplusPaid is negative when overpayment exists:
SurplusPaid = TotalAssessedTax - Assessment.TimelyPaymentBonus - TotalPaidAmount;

// 3. Gross Surplus & Discovered Liabilities
GrossSurplus = SurplusPaid < 0 ? Math.Abs(SurplusPaid) : 0;
PrincipalTaxRefund = Math.Max(0, GrossSurplus - TotalDiscoveredDebts);

// 4. Article 243 Delay Compensation (خسارت تاخیر ۱.۵ درصد ماهانه)
// Statutory interest rate: 1.5% (0.015) per month
if (DelayMonths > 0 && PrincipalTaxRefund > 0)
{
    DelayDamages = Math.Round(PrincipalTaxRefund * 0.015m * DelayMonths, 0);
}

// 5. Grand Total Refundable (جمع کل قابل پرداخت)
GrandTotalRefundable = PrincipalTaxRefund + StampDutyRefund + OtherRefund + PenaltiesRefund + DelayDamages;
```

---

## 4. Key Endpoints & Frontend API Protocols

### Backend Controller: `TaxRefundsController.cs`
- `GET /api/taxrefunds`: Paginated list of refund cases with filter parameters (Status, TrackingNumber, NationalId, OfficeId).
- `GET /api/taxrefunds/{id}`: Detailed refund case including Receipts, Letters, Assessment, and WorkflowSteps.
- `POST /api/taxrefunds`: Creates a new refund case in `Draft` status.
- `POST /api/taxrefunds/{id}/calculate`: Invokes `RefundCalculationEngine` and updates `RefundBreakdown`.
- `POST /api/taxrefunds/{id}/transitions`: Moves the case along the 8-stage state machine with validation.
- `GET /api/taxrefunds/{id}/print-justification`: Returns print model for the official justification report (گزارش توجیهی A4).

### Frontend Client: `frontend/lib/api/taxRefund.ts`
- Consume through `taxRefundApi`:
  ```typescript
  import { taxRefundApi } from '@/lib/api/taxRefund'
  
  // Transition state
  await taxRefundApi.executeTransition(caseId, {
    action: 'Approve',
    targetStep: 5,
    comment: 'محاسبات ماده ۲۴۲ بازبینی و تایید شد.'
  })
  ```

---

## 5. Official Documents & A4 Print Requirements

1. **گزارش توجیهی استرداد مالیات اضافه دریافتی (Justification Report)**:
   - Must render strictly in portrait A4 format using CSS `@media print`.
   - Table A: Summary of paid bank receipts (تاریخ، شماره قبض، مبلغ ریال).
   - Table B: Assessed tax liability vs paid amounts.
   - Table C: Clearance of inter-departmental debts (استعلام بدهی م. ۲۴۲).
   - Signatures block: کارشناس مسئول، رئیس گروه مالیاتی، رئیس اداره امور مالیاتی.
2. **برگ پرداخت و حواله بانکی (Payment Order)**:
   - Must format 26-digit Iranian IBAN (`IR...`) with 4-digit separated blocks.
   - Numbers in Persian words (حروف) and Persian digits (ارقام).
