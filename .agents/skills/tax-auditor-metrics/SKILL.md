---
name: tax-auditor-metrics
description: >-
  Domain rules, mathematical models, and scoring algorithms for the Tax Assessment Employee Performance Evaluation System (SRS v1.0 & Sanim Auditor Metrics). Use this skill whenever updating the 8x7 scoring weight matrix, performance indicators (FR-01 to FR-08), delay deductions, Important Cases ingestion, Sanim imports, or provincial scorecards.
---

# Tax Auditor Performance & SRS v1.0 Evaluation Skill

This skill governs the mathematical evaluation models, scoring matrices, Sanim dataset synchronizations, and provincial scorecards for the **Tax Assessment Employee Performance Evaluation System** (`/admin/auditor-metrics`) across the ASP.NET Core 8 Web API backend and Next.js 14 App Router frontend.

---

## 1. Statutory Architecture & System Scope

The evaluation system implements the official Iranian National Tax Administration (INTA) circular:
**دستورالعمل مصوب ارزیابی عملکرد کارکنان رسیدگی مالیاتی (SRS v1.0)**.

```
Sanim Audit Datasets (سوابق رسیدگی سامانه سنیم) + Important Cases Upload
  ↓
AuditorEvaluationRuleSet (پیکربندی مصوب: ماتریس اوزان ۸×۷ & آستانه‌های کنترلی)
  ↓
8 Performance Indicators (FR-01 to FR-08) Computed across 7 Tax Categories
  ↓
Positive Points Aggregate - Penalty Deductions (تعدیلات کاهشی و تاخیرات)
  ↓
Provincial Auditor Scorecard & Performance Tiers (A / B / C / D)
  ↓
Exact A4 Landscape Official Printable Evaluation Sheet
```

---

## 2. The 7 Tax Categories & 8 Performance Indicators

### 7 Tax Case Categories (دسته‌بندی‌های هفت‌گانه منابع):
1. **Corporate Income (Major Cases / ۳۰۰ پرونده مهم حقوقی)**: Configurable important corporate taxpayers.
2. **Other Corporate (سایر اشخاص حقوقی)**: General legal entities.
3. **VAT Major Cases (ارزش افزوده پرونده‌های مهم)**: High-turnover VAT taxpayers.
4. **Other Legal VAT (سایر اشخاص حقوقی ارزش افزوده)**: General corporate VAT.
5. **Business Income / Individuals (عملکرد مشاغل / اشخاص حقیقی)**: Individual trades and self-employed.
6. **Individual VAT (ارزش افزوده اشخاص حقیقی)**: Sole proprietorship VAT.
7. **Property Tax (املاک و مستغلات)**: Rental, capital transfer, and construction tax.

### 8 Performance Indicators (شاخص‌های هشت‌گانه عملکرد):
- **FR-01: Issued Tax Assessments (تعداد برگ تشخیص صادره)**: Volume of completed audits.
- **FR-02: Finalized Tax Assessments (تعداد برگ قطعی صادره)**: Volume of cases brought to final resolution.
- **FR-03: Taxpayer Acceptance (تمکین مودی)**: Percentage of assessments accepted by taxpayers without protest.
- **FR-04: Article 238 Agreements (توافق ماده ۲۳۸ ق.م.م)**: Disputes resolved administratively at the office head stage.
- **FR-05: Assessment Growth (رشد تشخیصی نسبت به ابرازی)**: Diagnostic growth exceeding legal thresholds (>700% corporate / >500% individual).
- **FR-06: Finalized Tax Adjustment Penalty (جریمه تعدیل کاهشی مالیات قطعی)**: Negative deduction applied when finalized tax is reduced by $>15\%$ compared to assessment.
- **FR-07: Assessment Issuance Speed (سرعت صدور برگ تشخیص)**: Processing days from assignment (Step 2) vs allowed timeline (30/45/60 days).
- **FR-08: Finalization Speed (سرعت قطعیت پرونده)**: Processing days to achieve final decree.

---

## 3. Mathematical Model & Deduction Formulas

The scoring engine operates via `AuditorEvaluationRuleSet`:

```csharp
// Growth Indicator (FR-05) Gating:
bool isCorporateGrowthQualified = legalGrowthPercentage > ruleSet.GrowthThresholdLegalEntity; // > 700%
bool isIndividualGrowthQualified = individualGrowthPercentage > ruleSet.GrowthThresholdIndividual; // > 500%

// Finalized Adjustment Penalty (FR-06):
// If reduction from assessed tax to finalized tax exceeds AdjustmentThreshold (15%):
if (reductionPercentage > ruleSet.AdjustmentThreshold)
{
    penaltyPoints = (reductionPercentage - ruleSet.AdjustmentThreshold) * ruleSet.AdjustmentPenaltyRate;
}

// Processing Speed Delay Penalty (FR-07 & FR-08):
// Daily penalty rate: 0.25 points per day beyond allowed processing days
if (actualProcessingDays > allowedDays)
{
    int delayDays = actualProcessingDays - allowedDays;
    delayPenalty = delayDays * ruleSet.DailyDelayPenalty; // 0.25 pts/day
}

// Net Score Calculation:
finalScore = Math.Max(ruleSet.AllowNegativeSpeedScore ? decimal.MinValue : 0m, 
                      grossPositiveScore - totalPenalties);
```

### Performance Tiers (سطوح عملکردی):
- **Tier A (عالی)**: نمره بالای ۸۵ (Auditors in top quartile).
- **Tier B (خوب)**: نمره بین ۷۰ تا ۸۴.۹.
- **Tier C (متوسط)**: نمره بین ۵۰ تا ۶۹.۹.
- **Tier D (نیازمند بهبود / ضعیف)**: نمره زیر ۵۰.

---

## 4. Sanim Dataset Ingestion & Important Cases Modal

### Sanim Sync Script: `scripts/import_sanim_data.py`
- Parses operational exports from Sanim containing case tracking numbers, taxpayer national IDs, tax sources, assessed amounts, finalized amounts, issuance dates, and resolution methods.
- Maps records to `SanimAuditAssessment` in SQLite.

### Important Cases Ingestion Modal (`ImportantCasesUploadModal.tsx`)
- Ingests Excel workbooks containing key provincial taxpayer files (e.g. "۱۰۰ پرونده مهم", "۳۰۰ پرونده کلیدی").
- Detects TIN, tracking number, and taxpayer name columns automatically.
- Tags matching Sanim records with `MajorCasesTag` (e.g. `300Parvande`, `100Parvande`), propagating priority weights into the 8x7 matrix.
- Provides Append vs. Replace-All modes.

---

## 5. Verification & Official A4 Scorecards

1. **Provincial Leaderboard (`/admin/auditor-metrics`)**:
   - Dynamic model switcher: `SRS بخشنامه مصوب` vs `شاخص‌های ترکیبی سنیم`.
   - Real-time search by auditor national ID, personnel code, or service unit.
2. **Official Printable A4 Scorecard**:
   - Renders complete $8 \times 7$ cell breakdown with positive weights, actual metrics, computed points, and negative deduction badges.
   - Exact physical margins matching INTA ministerial format.
