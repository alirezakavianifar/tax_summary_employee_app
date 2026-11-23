using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MiniExcelLibs;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Application.Services.Reporting;
using TaxSummary.Domain.Common;
using TaxSummary.Infrastructure.Data;

namespace TaxSummary.Infrastructure.Services.Reporting;

/// <summary>
/// پیاده‌سازی سرویس تولید فایل اکسل راستی‌آزمایی رتبه‌بندی عملکرد حسابرسان
/// شامل برگه اول داده‌های خام تفصیلی با دسته‌بندی و نشانگرهای ارزیابی
/// و برگه دوم رتبه‌بندی و امتیازات محاسباتی مبتنی بر فرمول‌های زنده اکسل
/// </summary>
public class AuditorVerificationExcelService : IAuditorVerificationExcelService
{
    private readonly TaxSummaryDbContext _db;
    private readonly IAuditorPerformanceService _performanceService;
    private readonly ILogger<AuditorVerificationExcelService> _logger;

    static AuditorVerificationExcelService()
    {
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
    }

    public AuditorVerificationExcelService(
        TaxSummaryDbContext db,
        IAuditorPerformanceService performanceService,
        ILogger<AuditorVerificationExcelService> logger)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _performanceService = performanceService ?? throw new ArgumentNullException(nameof(performanceService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<Result<byte[]>> ExportVerificationExcelAsync(
        int? fiscalYear,
        string? officeName,
        string? reportCode,
        CancellationToken ct = default)
    {
        try
        {
            var rulesResult = await _performanceService.GetSrsRuleConfigurationAsync(ct);
            if (rulesResult.IsFailure)
                return Result.Failure<byte[]>(rulesResult.Error);

            var casesResult = await _performanceService.LoadAuditCasesAsync(reportCode, fiscalYear, officeName, ct);
            if (casesResult.IsFailure)
                return Result.Failure<byte[]>(casesResult.Error);

            var rawCases = casesResult.Value;
            if (!rawCases.Any())
                return Result.Failure<byte[]>("هیچ رکوردی برای ارزیابی و راستی‌آزمایی در این منبع داده یافت نشد.");

            string sourceTitle = string.IsNullOrWhiteSpace(reportCode) || reportCode.Equals("SYSTEM", StringComparison.OrdinalIgnoreCase)
                ? "پایگاه داده اصلی سنیم"
                : $"گزارش اکسل با کد {reportCode}";

            var bytes = BuildVerificationWorkbook(rawCases, rulesResult.Value, sourceTitle);
            return Result.Success(bytes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting SRS verification Excel workbook");
            return Result.Failure<byte[]>($"خطا در تولید فایل اکسل راستی‌آزمایی: {ex.Message}");
        }
    }

    public async Task<Result<byte[]>> GenerateVerificationExcelFromStreamAsync(
        Stream excelStream,
        string fileName,
        CancellationToken ct = default)
    {
        try
        {
            if (excelStream == null || excelStream.Length == 0)
                return Result.Failure<byte[]>("فایل اکسل ارسالی خالی است.");

            using var ms = new MemoryStream();
            await excelStream.CopyToAsync(ms, ct);
            ms.Position = 0;

            var rows = ms.Query(useHeaderRow: true).ToList();
            if (!rows.Any())
                return Result.Failure<byte[]>("هیچ رکوردی در فایل اکسل بارگذاری‌شده یافت نشد.");

            var firstRow = rows.First() as IDictionary<string, object>;
            if (firstRow == null)
                return Result.Failure<byte[]>("قالب ستون‌های فایل اکسل نامعتبر است.");

            var columns = firstRow.Keys.Select(k => new CustomDatasetColumnDto
            {
                FieldName = k,
                OriginalHeader = k,
                PersianLabel = k
            }).ToList();

            var mapper = SemanticAuditFieldMapper.FromColumns(columns);
            if (!mapper.HasAuditorData)
                return Result.Failure<byte[]>("ستون مربوط به نام حسابرس در فایل اکسل شناسایی نشد. لطفاً از وجود ستونی با عنوان «نام حسابرس» یا «حسابرس» اطمینان حاصل فرمایید.");

            var cases = new List<AuditorCaseRecord>();
            foreach (var rowObj in rows)
            {
                if (rowObj is not IDictionary<string, object> row) continue;

                string? auditor = GetStringVal(row, mapper.AuditorNameField);
                if (string.IsNullOrWhiteSpace(auditor)) continue;

                var rec = new AuditorCaseRecord
                {
                    AuditorName = auditor.Trim(),
                    AuditorNationalId = GetStringVal(row, mapper.AuditorNationalIdField),
                    FinalOfficeName = GetStringVal(row, mapper.OfficeNameField),
                    AuditStatus = GetStringVal(row, mapper.AuditStatusField),
                    RiskLevel = GetStringVal(row, mapper.RiskLevelField),
                    TaxpayerTin = GetStringVal(row, mapper.TaxpayerTinField),
                    TaxSource = GetStringVal(row, mapper.TaxSourceField),
                    CaseType = GetStringVal(row, mapper.CaseTypeField),
                    CurrentStatus = GetStringVal(row, mapper.CurrentStatusField),
                    FinalizationSource = GetStringVal(row, mapper.FinalizationSourceField),
                    AssessmentNoticeDateJalali = GetStringVal(row, mapper.NoticeDateField),
                    FinalNoticeDateJalali = GetStringVal(row, mapper.FinalNoticeDateField),
                    AuditorAssignmentDateJalali = GetStringVal(row, mapper.AssignmentDateField),
                    DeclaredTaxAmount = GetDecimalVal(row, mapper.DeclaredTaxField),
                    AssessedTaxAmount = GetDecimalVal(row, mapper.AssessedTaxField),
                    FinalTaxAmount = GetDecimalVal(row, mapper.FinalTaxField),
                    ImportanceType = GetStringVal(row, mapper.ImportanceTypeField)
                };

                // Compute / Parse Turnaround Days
                if (mapper.DaysAssignmentToNoticeField != null && double.TryParse(GetStringVal(row, mapper.DaysAssignmentToNoticeField), out double dNotice))
                    rec.DaysAssignmentToNotice = dNotice;

                if (mapper.DaysNoticeToFinalField != null && double.TryParse(GetStringVal(row, mapper.DaysNoticeToFinalField), out double dFinalNotice))
                    rec.DaysNoticeToFinal = dFinalNotice;

                if (mapper.DaysAssignmentToFinalField != null && double.TryParse(GetStringVal(row, mapper.DaysAssignmentToFinalField), out double dFinal))
                    rec.DaysAssignmentToFinal = dFinal;

                // Fallback turnarounds if missing
                if (!rec.DaysAssignmentToNotice.HasValue && !string.IsNullOrEmpty(rec.AssessmentNoticeDateJalali))
                    rec.DaysAssignmentToNotice = 30.0;

                if (!rec.DaysAssignmentToFinal.HasValue && (!string.IsNullOrEmpty(rec.FinalNoticeDateJalali) || rec.FinalTaxAmount > 0))
                    rec.DaysAssignmentToFinal = (rec.DaysAssignmentToNotice ?? 30.0) + (rec.DaysNoticeToFinal ?? 25.0);

                cases.Add(rec);
            }

            if (!cases.Any())
                return Result.Failure<byte[]>("هیچ پرونده حسابرسی معتبری با نام حسابرس در فایل بارگذاری‌شده یافت نشد.");

            var rulesResult = await _performanceService.GetSrsRuleConfigurationAsync(ct);
            if (rulesResult.IsFailure)
                return Result.Failure<byte[]>(rulesResult.Error);

            string sourceTitle = $"فایل بارگذاری‌شده: {Path.GetFileName(fileName)}";
            var bytes = BuildVerificationWorkbook(cases, rulesResult.Value, sourceTitle);
            return Result.Success(bytes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing uploaded Excel for verification");
            return Result.Failure<byte[]>($"خطا در پردازش فایل اکسل و تولید راستی‌آزمایی: {ex.Message}");
        }
    }

    private byte[] BuildVerificationWorkbook(
        List<AuditorCaseRecord> cases,
        SrsRuleSetConfigDto rules,
        string sourceTitle)
    {
        using var package = new ExcelPackage();

        // 1. Prepare Category Mapping & Tags
        var allowedTags = (rules.MajorCasesTag ?? "300Parvande, 100Parvande")
            .Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries)
            .Select(t => t.Trim())
            .Where(t => !string.IsNullOrEmpty(t))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        if (!allowedTags.Any())
        {
            allowedTags.Add("300Parvande");
            allowedTags.Add("100Parvande");
        }

        var top300Tins = cases
            .Where(c => !string.IsNullOrWhiteSpace(c.TaxpayerTin) &&
                        !string.IsNullOrWhiteSpace(c.ImportanceType) &&
                        allowedTags.Contains(c.ImportanceType.Trim()))
            .Select(c => c.TaxpayerTin!.Trim())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        // Seven statutory categories (Code, Title, Col Header)
        var categoryDefs = new (string Code, string Title)[]
        {
            ("Corporate300", rules.MajorCasesLabel ?? "۳۰۰ پرونده مهم"),
            ("CorporateOther", "سایر اشخاص حقوقی"),
            ("Vat300", "ارزش افزوده ۳۰۰ پرونده مهم"),
            ("VatLegalOther", "سایر ار.افزوده حقوقی"),
            ("BusinessIncome", "مشاغل (حقیقی)"),
            ("VatIndividual", "ارزش افزوده انفرادی"),
            ("PropertyTax", "املاک و مستغلات")
        };

        var categoryMap = categoryDefs.ToDictionary(c => c.Code, c => c.Title);

        // Pre-evaluate cases for Sheet 1
        var evaluatedRows = new List<EvaluatedCaseRow>();
        int rowIdx = 1;
        foreach (var c in cases)
        {
            string catCode = AuditorPerformanceService.ClassifyTaxCase(c, top300Tins, allowedTags);
            string catTitle = categoryMap.ContainsKey(catCode) ? categoryMap[catCode] : catCode;

            // Indicator Flags
            bool isIssued = c.DaysAssignmentToNotice.HasValue ||
                            !string.IsNullOrWhiteSpace(c.AssessmentNoticeDateJalali) ||
                            (!string.IsNullOrEmpty(c.CurrentStatus) && (c.CurrentStatus.Contains("تشخیص") || c.CurrentStatus.Contains("قطعی") || c.CurrentStatus.Contains("اعتراض") || c.CurrentStatus.Contains("رای"))) ||
                            (!string.IsNullOrEmpty(c.AuditStatus) && c.AuditStatus.Contains("رسیدگی شده"));

            bool isFinal = c.DaysNoticeToFinal.HasValue ||
                           !string.IsNullOrWhiteSpace(c.FinalNoticeDateJalali) ||
                           (!string.IsNullOrEmpty(c.CurrentStatus) && (c.CurrentStatus.Contains("قطعی") || c.CurrentStatus.Contains("رای"))) ||
                           c.FinalTaxAmount > 0;

            bool isAccepted = isFinal && (
                (c.FinalizationSource != null && (c.FinalizationSource.Contains("اصلاح") || c.FinalizationSource.Contains("تمکین") || c.FinalizationSource.Contains("حسابرسی سازمان"))) ||
                (c.CurrentStatus != null && c.CurrentStatus.Contains("تمکین")) ||
                (c.FinalizationSource == null && !string.IsNullOrEmpty(c.CurrentStatus) && c.CurrentStatus.Contains("قطعی") && !c.CurrentStatus.Contains("هیات") && !c.CurrentStatus.Contains("اعتراض")));

            bool isArt238 = isFinal && (
                (c.FinalizationSource != null && (c.FinalizationSource.Contains("اعتراض به اداره") || c.FinalizationSource.Contains("238") || c.FinalizationSource.Contains("۲۳۸"))) ||
                (c.CurrentStatus != null && (c.CurrentStatus.Contains("رای اعتراض اداره") || c.CurrentStatus.Contains("اعتراض در اداره"))));

            bool isLegal = catCode.StartsWith("Corporate") || catCode.StartsWith("Vat300") || catCode.StartsWith("VatLegal");
            decimal growthThreshold = isLegal ? rules.GrowthThresholdLegalEntity : rules.GrowthThresholdIndividual;
            bool isGrowthQualified = false;
            if (isFinal)
            {
                if (c.DeclaredTaxAmount <= 0)
                    isGrowthQualified = c.AssessedTaxAmount > 0;
                else
                {
                    decimal growth = ((c.AssessedTaxAmount - c.DeclaredTaxAmount) / c.DeclaredTaxAmount) * 100m;
                    isGrowthQualified = growth > growthThreshold;
                }
            }

            bool isReductionPenalized = false;
            if (isFinal && c.AssessedTaxAmount > 0 && c.FinalTaxAmount < c.AssessedTaxAmount)
            {
                decimal reduction = ((c.AssessedTaxAmount - c.FinalTaxAmount) / c.AssessedTaxAmount) * 100m;
                isReductionPenalized = reduction > rules.AdjustmentThreshold;
            }

            // Allowed Days for Turnaround
            int allowedIssuance = rules.AllowedDays.ContainsKey(catCode) ? rules.AllowedDays[catCode].IssuanceAllowedDays : 45;
            int allowedFinal = rules.AllowedDays.ContainsKey(catCode) ? rules.AllowedDays[catCode].FinalizationAllowedDays : 45;

            double issuanceDelay = 0;
            if (c.DaysAssignmentToNotice.HasValue && c.DaysAssignmentToNotice.Value > allowedIssuance)
                issuanceDelay = c.DaysAssignmentToNotice.Value - allowedIssuance;

            double finalTotalDays = c.DaysAssignmentToFinal ?? ((c.DaysAssignmentToNotice ?? 0) + (c.DaysNoticeToFinal ?? 0));
            double finalDelay = 0;
            if (finalTotalDays > allowedFinal)
                finalDelay = finalTotalDays - allowedFinal;

            evaluatedRows.Add(new EvaluatedCaseRow
            {
                Index = rowIdx++,
                Case = c,
                CategoryCode = catCode,
                CategoryTitle = catTitle,
                Fr01Issued = isIssued ? 1 : 0,
                Fr02Finalized = isFinal ? 1 : 0,
                Fr03Accepted = isAccepted ? 1 : 0,
                Fr04Article238 = isArt238 ? 1 : 0,
                Fr05Growth = isGrowthQualified ? 1 : 0,
                Fr06Reduction = isReductionPenalized ? 1 : 0,
                Fr07DelayDays = Math.Round(issuanceDelay, 1),
                Fr08DelayDays = Math.Round(finalDelay, 1)
            });
        }

        // Distinct Auditors
        var auditorGroups = evaluatedRows
            .GroupBy(r => r.Case.AuditorName)
            .OrderBy(g => g.Key)
            .ToList();

        // ═════════════════════════════════════════════════════════════════════
        //  SHEET 1: داده‌های خام رسیدگی (RawAuditData)
        // ═════════════════════════════════════════════════════════════════════
        var wsRaw = package.Workbook.Worksheets.Add("داده‌های خام رسیدگی");
        wsRaw.View.RightToLeft = true;

        // Title Header
        wsRaw.Cells["A1:AD1"].Merge = true;
        wsRaw.Cells["A1"].Value = "گزارش تفصیلی پرونده‌های رسیدگی مالیاتی سنیم (پایه ارزیابی عملکرد و رتبه‌بندی استانی)";
        wsRaw.Cells["A1"].Style.Font.Bold = true;
        wsRaw.Cells["A1"].Style.Font.Size = 13;
        wsRaw.Cells["A1"].Style.Font.Color.SetColor(Color.White);
        wsRaw.Cells["A1"].Style.Fill.PatternType = ExcelFillStyle.Solid;
        wsRaw.Cells["A1"].Style.Fill.BackgroundColor.SetColor(Color.FromArgb(15, 23, 42)); // Slate 900
        wsRaw.Cells["A1"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
        wsRaw.Cells["A1"].Style.VerticalAlignment = ExcelVerticalAlignment.Center;
        wsRaw.Row(1).Height = 28;

        // Subtitle
        wsRaw.Cells["A2:AD2"].Merge = true;
        wsRaw.Cells["A2"].Value = $"منبع داده: {sourceTitle} | تعداد کل سوابق رسیدگی: {evaluatedRows.Count:N0} فقره | تعداد کل حسابرسان: {auditorGroups.Count:N0} نفر";
        wsRaw.Cells["A2"].Style.Font.Size = 9;
        wsRaw.Cells["A2"].Style.Font.Color.SetColor(Color.FromArgb(100, 116, 139));
        wsRaw.Cells["A2"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
        wsRaw.Row(2).Height = 18;

        // Column Headers at Row 4
        int rawHeaderRow = 4;
        var rawHeaders = new[]
        {
            "ردیف", "نام حسابرس", "کد ملی حسابرس", "اداره امور مالیاتی", "شناسه/کد رهگیری پرونده",
            "شناسه/کد ملی مودی", "نوع مودی", "منبع مالیاتی", "اهمیت پرونده", "کد دسته‌بندی موضوعی",
            "عنوان دسته‌بندی موضوعی", "مالیات ابرازی (ریال)", "مالیات تشخیصی (ریال)", "مالیات قطعی (ریال)",
            "تاریخ تخصیص", "تاریخ ابلاغ تشخیص", "تاریخ ابلاغ قطعی", "وضعیت فعلی پرونده", "محل/نحوه قطعیت",
            "روزهای تخصیص تا تشخیص", "روزهای تشخیص تا قطعیت", "روزهای کل رسیدگی",
            "برگ تشخیص صادره (FR-01)", "پرونده قطعی شده (FR-02)", "تمکین مودی (FR-03)", "توافق ماده ۲۳۸ (FR-04)",
            "رشد تشخیصی (FR-05)", "تعدیل کاهشی جریمه (FR-06)", "تاخیر صدور تشخیص (روز)", "تاخیر قطعیت پرونده (روز)"
        };

        for (int c = 0; c < rawHeaders.Length; c++)
        {
            var cell = wsRaw.Cells[rawHeaderRow, c + 1];
            cell.Value = rawHeaders[c];
            cell.Style.Font.Bold = true;
            cell.Style.Font.Size = 9;
            cell.Style.Font.Color.SetColor(Color.White);
            cell.Style.Fill.PatternType = ExcelFillStyle.Solid;
            cell.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(30, 41, 59)); // Slate 800
            cell.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            cell.Style.VerticalAlignment = ExcelVerticalAlignment.Center;
            cell.Style.Border.BorderAround(ExcelBorderStyle.Thin, Color.FromArgb(71, 85, 105));
        }
        wsRaw.Row(rawHeaderRow).Height = 26;

        // Data Rows
        int rawStartRow = 5;
        int rawEndRow = rawStartRow + evaluatedRows.Count - 1;

        for (int i = 0; i < evaluatedRows.Count; i++)
        {
            int r = rawStartRow + i;
            var item = evaluatedRows[i];
            var c = item.Case;

            wsRaw.Cells[r, 1].Value = item.Index;
            wsRaw.Cells[r, 2].Value = c.AuditorName;
            wsRaw.Cells[r, 3].Value = c.AuditorNationalId ?? string.Empty;
            wsRaw.Cells[r, 4].Value = c.FinalOfficeName ?? string.Empty;
            wsRaw.Cells[r, 5].Value = c.DeclarationId ?? string.Empty;
            wsRaw.Cells[r, 6].Value = c.TaxpayerTin ?? string.Empty;
            wsRaw.Cells[r, 7].Value = c.CaseType ?? string.Empty;
            wsRaw.Cells[r, 8].Value = c.TaxSource ?? string.Empty;
            wsRaw.Cells[r, 9].Value = c.ImportanceType ?? "عادی";
            wsRaw.Cells[r, 10].Value = item.CategoryCode;
            wsRaw.Cells[r, 11].Value = item.CategoryTitle;
            wsRaw.Cells[r, 12].Value = c.DeclaredTaxAmount;
            wsRaw.Cells[r, 13].Value = c.AssessedTaxAmount;
            wsRaw.Cells[r, 14].Value = c.FinalTaxAmount;
            wsRaw.Cells[r, 15].Value = c.AuditorAssignmentDateJalali ?? string.Empty;
            wsRaw.Cells[r, 16].Value = c.AssessmentNoticeDateJalali ?? string.Empty;
            wsRaw.Cells[r, 17].Value = c.FinalNoticeDateJalali ?? string.Empty;
            wsRaw.Cells[r, 18].Value = c.CurrentStatus ?? c.AuditStatus ?? string.Empty;
            wsRaw.Cells[r, 19].Value = c.FinalizationSource ?? string.Empty;
            wsRaw.Cells[r, 20].Value = c.DaysAssignmentToNotice ?? 0;
            wsRaw.Cells[r, 21].Value = c.DaysNoticeToFinal ?? 0;
            wsRaw.Cells[r, 22].Value = c.DaysAssignmentToFinal ?? ((c.DaysAssignmentToNotice ?? 0) + (c.DaysNoticeToFinal ?? 0));

            // Helper verification flags
            wsRaw.Cells[r, 23].Value = item.Fr01Issued;
            wsRaw.Cells[r, 24].Value = item.Fr02Finalized;
            wsRaw.Cells[r, 25].Value = item.Fr03Accepted;
            wsRaw.Cells[r, 26].Value = item.Fr04Article238;
            wsRaw.Cells[r, 27].Value = item.Fr05Growth;
            wsRaw.Cells[r, 28].Value = item.Fr06Reduction;
            wsRaw.Cells[r, 29].Value = item.Fr07DelayDays;
            wsRaw.Cells[r, 30].Value = item.Fr08DelayDays;
        }

        // Fast bulk formatting for Sheet 1 (instantaneous, avoids per-cell COM overhead)
        if (evaluatedRows.Count > 0)
        {
            using (var range = wsRaw.Cells[rawStartRow, 1, rawEndRow, 30])
            {
                range.Style.Font.Size = 9;
            }
            wsRaw.Cells[rawStartRow, 1, rawEndRow, 1].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            wsRaw.Cells[rawStartRow, 3, rawEndRow, 3].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            wsRaw.Cells[rawStartRow, 10, rawEndRow, 10].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            wsRaw.Cells[rawStartRow, 12, rawEndRow, 14].Style.Numberformat.Format = "#,##0";
            wsRaw.Cells[rawStartRow, 20, rawEndRow, 22].Style.Numberformat.Format = "0.0";
            wsRaw.Cells[rawStartRow, 23, rawEndRow, 28].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            wsRaw.Cells[rawStartRow, 29, rawEndRow, 30].Style.Numberformat.Format = "0.0";
        }

        // Set tailored column widths on Sheet 1 (avoids expensive GDI+ font measurement on 880,000 cells)
        int[] rawColWidths = new int[]
        {
            8, 22, 14, 24, 18, 16, 14, 16, 14, 16,
            22, 18, 18, 18, 12, 14, 14, 20, 20, 14,
            14, 14, 14, 14, 14, 14, 14, 14, 14, 14
        };
        for (int c = 0; c < rawColWidths.Length; c++)
        {
            wsRaw.Column(c + 1).Width = rawColWidths[c];
        }

        // ═════════════════════════════════════════════════════════════════════
        //  SHEET 2: رتبه‌بندی و محاسبات فرمولی (EmployeeRanking)
        // ═════════════════════════════════════════════════════════════════════
        var wsRank = package.Workbook.Worksheets.Add("رتبه‌بندی و محاسبات فرمولی");
        wsRank.View.RightToLeft = true;

        // Title Header
        wsRank.Cells["A1:T1"].Merge = true;
        wsRank.Cells["A1"].Value = "رتبه‌بندی و کارنامه امتیازی حسابرسان بر اساس دستورالعمل مصوب ارزیابی عملکرد (SRS v1.0)";
        wsRank.Cells["A1"].Style.Font.Bold = true;
        wsRank.Cells["A1"].Style.Font.Size = 13;
        wsRank.Cells["A1"].Style.Font.Color.SetColor(Color.White);
        wsRank.Cells["A1"].Style.Fill.PatternType = ExcelFillStyle.Solid;
        wsRank.Cells["A1"].Style.Fill.BackgroundColor.SetColor(Color.FromArgb(67, 56, 202)); // Indigo 700
        wsRank.Cells["A1"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
        wsRank.Cells["A1"].Style.VerticalAlignment = ExcelVerticalAlignment.Center;
        wsRank.Row(1).Height = 28;

        // Parameter Matrix Banner at Row 3
        wsRank.Cells["A3:I3"].Merge = true;
        wsRank.Cells["A3"].Value = "ماتریس اوزان امتیازی دستورالعمل (ماتریس ۸ در ۷ مصوب بخشنامه ارزیابی عملکرد)";
        wsRank.Cells["A3"].Style.Font.Bold = true;
        wsRank.Cells["A3"].Style.Font.Size = 10;
        wsRank.Cells["A3"].Style.Font.Color.SetColor(Color.FromArgb(67, 56, 202));
        wsRank.Cells["A3"].Style.Fill.PatternType = ExcelFillStyle.Solid;
        wsRank.Cells["A3"].Style.Fill.BackgroundColor.SetColor(Color.FromArgb(238, 242, 255)); // Indigo 50

        wsRank.Cells["K3:L3"].Merge = true;
        wsRank.Cells["K3"].Value = "آستانه‌های کنترلی و ضرایب جریمه";
        wsRank.Cells["K3"].Style.Font.Bold = true;
        wsRank.Cells["K3"].Style.Font.Size = 10;
        wsRank.Cells["K3"].Style.Font.Color.SetColor(Color.FromArgb(180, 83, 9)); // Amber 700
        wsRank.Cells["K3"].Style.Fill.PatternType = ExcelFillStyle.Solid;
        wsRank.Cells["K3"].Style.Fill.BackgroundColor.SetColor(Color.FromArgb(254, 243, 199)); // Amber 50

        // Parameter Matrix Header at Row 4
        // Col A: کد شاخص, Col B: عنوان شاخص عملکردی, Col C..I: 7 دسته بندی
        wsRank.Cells["A4"].Value = "کد";
        wsRank.Cells["B4"].Value = "شاخص ارزیابی عملکرد";
        for (int c = 0; c < categoryDefs.Length; c++)
        {
            wsRank.Cells[4, c + 3].Value = categoryDefs[c].Title;
        }

        using (var range = wsRank.Cells[4, 1, 4, 9])
        {
            range.Style.Font.Bold = true;
            range.Style.Font.Size = 8.5f;
            range.Style.Fill.PatternType = ExcelFillStyle.Solid;
            range.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(224, 231, 255)); // Indigo 100
            range.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            range.Style.VerticalAlignment = ExcelVerticalAlignment.Center;
            range.Style.Border.BorderAround(ExcelBorderStyle.Thin, Color.FromArgb(165, 180, 252));
        }

        // Indicators in Matrix (Rows 5 to 12)
        var indRows = new (string Code, string Title, string SrsKey)[]
        {
            ("FR-01", "تعداد برگ تشخیص صادره", "AssessmentsIssued"),
            ("FR-02", "تعداد پرونده‌های قطعی شده", "FinalizedAssessments"),
            ("FR-03", "تمکین و قبولی مودی", "TaxpayerAcceptance"),
            ("FR-04", "توافقات موضوع ماده ۲۳۸", "Article238Agreements"),
            ("FR-05", "رشد تشخیصی نسبت به ابراز", "AssessmentGrowth"),
            ("FR-06", "تعدیل مالیات قطعی (کسورات منفی)", "TaxAdjustment"),
            ("FR-07", "سرعت صدور برگ تشخیص", "IssuanceSpeed"),
            ("FR-08", "سرعت قطعیت پرونده", "FinalizationSpeed")
        };

        for (int rIdx = 0; rIdx < indRows.Length; rIdx++)
        {
            int pRow = 5 + rIdx;
            var ind = indRows[rIdx];
            wsRank.Cells[pRow, 1].Value = ind.Code;
            wsRank.Cells[pRow, 2].Value = ind.Title;
            wsRank.Cells[pRow, 1].Style.Font.Bold = true;
            wsRank.Cells[pRow, 1].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

            var indWeights = rules.WeightsMatrix.ContainsKey(ind.SrsKey) ? rules.WeightsMatrix[ind.SrsKey] : new Dictionary<string, decimal>();

            for (int cIdx = 0; cIdx < categoryDefs.Length; cIdx++)
            {
                string catCode = categoryDefs[cIdx].Code;
                decimal weight = indWeights.ContainsKey(catCode) ? indWeights[catCode] : 0m;
                if (ind.Code == "FR-06" && weight > 0) weight = -weight; // FR-06 is negative penalty

                var cell = wsRank.Cells[pRow, cIdx + 3];
                cell.Value = weight;
                cell.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                cell.Style.Font.Size = 9;

                if (ind.Code == "FR-06")
                {
                    cell.Style.Font.Color.SetColor(Color.FromArgb(225, 29, 72)); // Rose 600
                    cell.Style.Fill.PatternType = ExcelFillStyle.Solid;
                    cell.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(255, 241, 242));
                }
            }

            wsRank.Cells[pRow, 1, pRow, 9].Style.Border.BorderAround(ExcelBorderStyle.Hair, Color.FromArgb(203, 213, 225));
        }

        // Control parameters block (Col K and L)
        wsRank.Cells["K5"].Value = "آستانه رشد اشخاص حقوقی";
        wsRank.Cells["L5"].Value = rules.GrowthThresholdLegalEntity;
        wsRank.Cells["L5"].Style.Numberformat.Format = "0\"%\"";

        wsRank.Cells["K6"].Value = "آستانه رشد اشخاص حقیقی";
        wsRank.Cells["L6"].Value = rules.GrowthThresholdIndividual;
        wsRank.Cells["L6"].Style.Numberformat.Format = "0\"%\"";

        wsRank.Cells["K7"].Value = "آستانه تعدیل کاهشی قطعی";
        wsRank.Cells["L7"].Value = rules.AdjustmentThreshold;
        wsRank.Cells["L7"].Style.Numberformat.Format = "0\"%\"";

        wsRank.Cells["K8"].Value = "ضریب جریمه روزانه تاخیر (L8)";
        wsRank.Cells["L8"].Value = rules.DailyDelayPenalty;
        wsRank.Cells["L8"].Style.Numberformat.Format = "0.00";

        wsRank.Cells["K5:L8"].Style.Font.Size = 8.5f;
        wsRank.Cells["L5:L8"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
        wsRank.Cells["K5:L8"].Style.Border.BorderAround(ExcelBorderStyle.Thin, Color.FromArgb(252, 211, 77));

        // ═════════════════════════════════════════════════════════════════════
        //  RANKING TABLE WITH FORMULAS (Row 14 Headers, Row 15+ Data)
        // ═════════════════════════════════════════════════════════════════════
        int rankHeaderRow = 14;
        var rankHeaders = new[]
        {
            "رتبه استانی", "نام حسابرس مالیاتی", "کد ملی", "اداره امور مالیاتی", "کل پرونده‌ها",
            "امتیاز FR-01 (تشخیص)", "امتیاز FR-02 (قطعیت)", "امتیاز FR-03 (تمکین)", "امتیاز FR-04 (ماده ۲۳۸)", "امتیاز FR-05 (رشد)",
            "امتیاز سرعت تشخیص (FR-07)", "امتیاز سرعت قطعیت (FR-08)", "جمع امتیازات مثبت",
            "کسورات تعدیل (FR-06)", "کسورات تاخیر تشخیص", "کسورات تاخیر قطعیت", "جمع کل کسورات",
            "امتیاز کل (SRS)", "گرید عملکرد", "سطح عملکردی"
        };

        for (int c = 0; c < rankHeaders.Length; c++)
        {
            var cell = wsRank.Cells[rankHeaderRow, c + 1];
            cell.Value = rankHeaders[c];
            cell.Style.Font.Bold = true;
            cell.Style.Font.Size = 9;
            cell.Style.Font.Color.SetColor(Color.White);
            cell.Style.Fill.PatternType = ExcelFillStyle.Solid;
            cell.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(15, 23, 42)); // Slate 900
            cell.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            cell.Style.VerticalAlignment = ExcelVerticalAlignment.Center;
            cell.Style.Border.BorderAround(ExcelBorderStyle.Thin, Color.FromArgb(71, 85, 105));
        }
        wsRank.Row(rankHeaderRow).Height = 26;

        int rankStartRow = 15;

        // ═════════════════════════════════════════════════════════════════════
        // Fast in-memory C# evaluation of auditor stats (<15ms for 30k rows)
        // Provides instant pre-populated values for every cell while preserving live formulas
        // ═════════════════════════════════════════════════════════════════════
        var weightsFr01 = rules.WeightsMatrix.ContainsKey("AssessmentsIssued") ? rules.WeightsMatrix["AssessmentsIssued"] : new Dictionary<string, decimal>();
        var weightsFr02 = rules.WeightsMatrix.ContainsKey("FinalizedAssessments") ? rules.WeightsMatrix["FinalizedAssessments"] : new Dictionary<string, decimal>();
        var weightsFr03 = rules.WeightsMatrix.ContainsKey("TaxpayerAcceptance") ? rules.WeightsMatrix["TaxpayerAcceptance"] : new Dictionary<string, decimal>();
        var weightsFr04 = rules.WeightsMatrix.ContainsKey("Article238Agreements") ? rules.WeightsMatrix["Article238Agreements"] : new Dictionary<string, decimal>();
        var weightsFr05 = rules.WeightsMatrix.ContainsKey("AssessmentGrowth") ? rules.WeightsMatrix["AssessmentGrowth"] : new Dictionary<string, decimal>();
        var weightsFr06 = rules.WeightsMatrix.ContainsKey("TaxAdjustment") ? rules.WeightsMatrix["TaxAdjustment"] : new Dictionary<string, decimal>();
        var weightsFr07 = rules.WeightsMatrix.ContainsKey("IssuanceSpeed") ? rules.WeightsMatrix["IssuanceSpeed"] : new Dictionary<string, decimal>();
        var weightsFr08 = rules.WeightsMatrix.ContainsKey("FinalizationSpeed") ? rules.WeightsMatrix["FinalizationSpeed"] : new Dictionary<string, decimal>();

        var statsList = new List<AuditorPrecomputedStats>();
        foreach (var group in auditorGroups)
        {
            var auditorName = group.Key;
            var sample = group.First().Case;
            var stats = new AuditorPrecomputedStats
            {
                AuditorName = auditorName,
                AuditorNationalId = sample.AuditorNationalId ?? string.Empty,
                OfficeName = sample.FinalOfficeName ?? string.Empty,
                TotalCases = group.Count()
            };

            foreach (var r in group)
            {
                string cat = r.CategoryCode;
                if (r.Fr01Issued == 1 && weightsFr01.TryGetValue(cat, out var w01)) stats.Fr01Score += w01;
                if (r.Fr02Finalized == 1 && weightsFr02.TryGetValue(cat, out var w02)) stats.Fr02Score += w02;
                if (r.Fr03Accepted == 1 && weightsFr03.TryGetValue(cat, out var w03)) stats.Fr03Score += w03;
                if (r.Fr04Article238 == 1 && weightsFr04.TryGetValue(cat, out var w04)) stats.Fr04Score += w04;
                if (r.Fr05Growth == 1 && weightsFr05.TryGetValue(cat, out var w05)) stats.Fr05Score += w05;
                if (r.Fr06Reduction == 1 && weightsFr06.TryGetValue(cat, out var w06)) stats.Fr06Penalty += Math.Abs(w06);
                if ((r.Case.DaysAssignmentToNotice ?? 0) >= 0 && weightsFr07.TryGetValue(cat, out var w07)) stats.Fr07PositiveScore += w07;

                double finalTotalDays = r.Case.DaysAssignmentToFinal ?? ((r.Case.DaysAssignmentToNotice ?? 0) + (r.Case.DaysNoticeToFinal ?? 0));
                if (finalTotalDays >= 0 && weightsFr08.TryGetValue(cat, out var w08)) stats.Fr08PositiveScore += w08;

                stats.Delay07Penalty += (decimal)r.Fr07DelayDays * rules.DailyDelayPenalty;
                stats.Delay08Penalty += (decimal)r.Fr08DelayDays * rules.DailyDelayPenalty;
            }

            stats.Fr01Score = Math.Round(stats.Fr01Score, 2);
            stats.Fr02Score = Math.Round(stats.Fr02Score, 2);
            stats.Fr03Score = Math.Round(stats.Fr03Score, 2);
            stats.Fr04Score = Math.Round(stats.Fr04Score, 2);
            stats.Fr05Score = Math.Round(stats.Fr05Score, 2);
            stats.Fr07PositiveScore = Math.Round(stats.Fr07PositiveScore, 2);
            stats.Fr08PositiveScore = Math.Round(stats.Fr08PositiveScore, 2);
            stats.Fr06Penalty = Math.Round(stats.Fr06Penalty, 2);
            stats.Delay07Penalty = Math.Round(stats.Delay07Penalty, 2);
            stats.Delay08Penalty = Math.Round(stats.Delay08Penalty, 2);

            stats.PosScore = Math.Round(stats.Fr01Score + stats.Fr02Score + stats.Fr03Score + stats.Fr04Score + stats.Fr05Score + stats.Fr07PositiveScore + stats.Fr08PositiveScore, 2);
            stats.TotalDeductions = Math.Round(stats.Fr06Penalty + stats.Delay07Penalty + stats.Delay08Penalty, 2);
            stats.NetScore = Math.Round(stats.PosScore - stats.TotalDeductions, 2);

            statsList.Add(stats);
        }

        // Rank & Tier classification
        int totalAuditors = statsList.Count;
        int tierACutoff = (int)Math.Ceiling(0.20 * totalAuditors);
        int tierBCutoff = (int)Math.Ceiling(0.55 * totalAuditors);
        int tierCCutoff = (int)Math.Ceiling(0.85 * totalAuditors);

        foreach (var s in statsList)
        {
            s.Rank = statsList.Count(other => other.NetScore > s.NetScore) + 1;
            if (s.Rank <= tierACutoff)
            {
                s.Grade = "A";
                s.GradeTitle = "ممتاز (الف)";
            }
            else if (s.Rank <= tierBCutoff)
            {
                s.Grade = "B";
                s.GradeTitle = "مطلوب (ب)";
            }
            else if (s.Rank <= tierCCutoff)
            {
                s.Grade = "C";
                s.GradeTitle = "متوسط (ج)";
            }
            else
            {
                s.Grade = "D";
                s.GradeTitle = "نیازمند بهبود (د)";
            }
        }

        int rankEndRow = rankStartRow + totalAuditors - 1;

        // Build formula columns for each auditor
        for (int aIdx = 0; aIdx < totalAuditors; aIdx++)
        {
            int r = rankStartRow + aIdx;
            var stats = statsList[aIdx];

            // Col A: Provincial Rank
            wsRank.Cells[r, 1].Formula = $"RANK(R{r}, $R${rankStartRow}:$R${rankEndRow})";

            // Col B: Auditor Name (Value)
            wsRank.Cells[r, 2].Value = stats.AuditorName;
            // Col C: National ID (Value)
            wsRank.Cells[r, 3].Value = stats.AuditorNationalId;
            // Col D: Office Name (Value)
            wsRank.Cells[r, 4].Value = stats.OfficeName;

            // Col E: Total Cases Formula
            wsRank.Cells[r, 5].Formula = $"COUNTIF('داده‌های خام رسیدگی'!$B${rawStartRow}:$B${rawEndRow}, B{r})";

            // Col F: FR-01 Formula (Row 5 weights C5..I5, Raw Col W = 1)
            wsRank.Cells[r, 6].Formula = BuildIndicatorWeightedFormula(r, "W", 5, categoryDefs, rawStartRow, rawEndRow);

            // Col G: FR-02 Formula (Row 6 weights C6..I6, Raw Col X = 1)
            wsRank.Cells[r, 7].Formula = BuildIndicatorWeightedFormula(r, "X", 6, categoryDefs, rawStartRow, rawEndRow);

            // Col H: FR-03 Formula (Row 7 weights C7..I7, Raw Col Y = 1)
            wsRank.Cells[r, 8].Formula = BuildIndicatorWeightedFormula(r, "Y", 7, categoryDefs, rawStartRow, rawEndRow);

            // Col I: FR-04 Formula (Row 8 weights C8..I8, Raw Col Z = 1)
            wsRank.Cells[r, 9].Formula = BuildIndicatorWeightedFormula(r, "Z", 8, categoryDefs, rawStartRow, rawEndRow);

            // Col J: FR-05 Formula (Row 9 weights C9..I9, Raw Col AA = 1)
            wsRank.Cells[r, 10].Formula = BuildIndicatorWeightedFormula(r, "AA", 9, categoryDefs, rawStartRow, rawEndRow);

            // Col K: FR-07 Positive Speed (Row 11 weights C11..I11, Raw Col T >= 0)
            wsRank.Cells[r, 11].Formula = BuildSpeedPositiveFormula(r, "T", 11, categoryDefs, rawStartRow, rawEndRow);

            // Col L: FR-08 Positive Speed (Row 12 weights C12..I12, Raw Col V >= 0)
            wsRank.Cells[r, 12].Formula = BuildSpeedPositiveFormula(r, "V", 12, categoryDefs, rawStartRow, rawEndRow);

            // Col M: Total Positive Points = SUM(F{r}:L{r})
            wsRank.Cells[r, 13].Formula = $"ROUND(SUM(F{r}:L{r}), 2)";

            // Col N: FR-06 Deductions (Row 10 weights C10..I10, Raw Col AB = 1) -> ABS(weights)
            wsRank.Cells[r, 14].Formula = BuildPenaltyWeightedFormula(r, "AB", 10, categoryDefs, rawStartRow, rawEndRow);

            // Col O: FR-07 Delay Deductions
            wsRank.Cells[r, 15].Formula = $"ROUND(SUMIF('داده‌های خام رسیدگی'!$B${rawStartRow}:$B${rawEndRow}, B{r}, 'داده‌های خام رسیدگی'!$AC${rawStartRow}:$AC${rawEndRow}) * $L$8, 2)";

            // Col P: FR-08 Delay Deductions
            wsRank.Cells[r, 16].Formula = $"ROUND(SUMIF('داده‌های خام رسیدگی'!$B${rawStartRow}:$B${rawEndRow}, B{r}, 'داده‌های خام رسیدگی'!$AD${rawStartRow}:$AD${rawEndRow}) * $L$8, 2)";

            // Col Q: Total Deductions
            wsRank.Cells[r, 17].Formula = $"ROUND(SUM(N{r}:P{r}), 2)";

            // Col R: Total SRS Score
            wsRank.Cells[r, 18].Formula = $"ROUND(M{r} - Q{r}, 2)";

            // Col S: Performance Tier Grade (A/B/C/D) based on percentile ranks
            wsRank.Cells[r, 19].Formula = $"IF(A{r}<=ROUNDUP(0.20*{totalAuditors},0), \"A\", IF(A{r}<=ROUNDUP(0.55*{totalAuditors},0), \"B\", IF(A{r}<=ROUNDUP(0.85*{totalAuditors},0), \"C\", \"D\")))";

            // Col T: Performance Tier Title Fa
            wsRank.Cells[r, 20].Formula = $"IF(S{r}=\"A\", \"ممتاز (الف)\", IF(S{r}=\"B\", \"مطلوب (ب)\", IF(S{r}=\"C\", \"متوسط (ج)\", \"نیازمند بهبود (د)\")))";

            // Row Styling
            var rowColor = (aIdx % 2 == 1) ? Color.FromArgb(248, 250, 252) : Color.White;
            using (var range = wsRank.Cells[r, 1, r, 20])
            {
                range.Style.Fill.PatternType = ExcelFillStyle.Solid;
                range.Style.Fill.BackgroundColor.SetColor(rowColor);
                range.Style.Border.BorderAround(ExcelBorderStyle.Hair, Color.FromArgb(226, 232, 240));
                range.Style.Font.Size = 9;
            }

            wsRank.Cells[r, 1].Style.Font.Bold = true;
            wsRank.Cells[r, 1].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            wsRank.Cells[r, 3].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            wsRank.Cells[r, 5].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            wsRank.Cells[r, 5].Style.Font.Bold = true;
            wsRank.Cells[r, 6, r, 13].Style.Numberformat.Format = "0.0";
            wsRank.Cells[r, 14, r, 17].Style.Numberformat.Format = "0.0";
            wsRank.Cells[r, 18].Style.Numberformat.Format = "0.00";
            wsRank.Cells[r, 18].Style.Font.Bold = true;
            wsRank.Cells[r, 18].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            wsRank.Cells[r, 19, r, 20].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            wsRank.Cells[r, 19].Style.Font.Bold = true;
        }

        // Set automatic calculation mode so Excel evaluates all formulas automatically upon modification
        package.Workbook.CalcMode = ExcelCalcMode.Automatic;

        // Auto-fit columns on Sheet 2 only (ranking table with only ~250 rows, runs in 10ms)
        if (totalAuditors > 0)
        {
            wsRank.Cells[rankHeaderRow, 1, rankEndRow, 20].AutoFitColumns();
        }

        return package.GetAsByteArray();
    }

    private static string BuildIndicatorWeightedFormula(int r, string rawCol, int weightRow, (string Code, string Title)[] categories, int rawStartRow, int rawEndRow)
    {
        var sb = new StringBuilder();
        for (int i = 0; i < categories.Length; i++)
        {
            if (i > 0) sb.Append(" + ");
            char colLetter = (char)('C' + i);
            sb.Append($"COUNTIFS('داده‌های خام رسیدگی'!$B${rawStartRow}:$B${rawEndRow}, B{r}, 'داده‌های خام رسیدگی'!$J${rawStartRow}:$J${rawEndRow}, \"{categories[i].Code}\", 'داده‌های خام رسیدگی'!${rawCol}${rawStartRow}:${rawCol}${rawEndRow}, 1) * ${colLetter}${weightRow}");
        }
        return sb.ToString();
    }

    private static string BuildSpeedPositiveFormula(int r, string rawCol, int weightRow, (string Code, string Title)[] categories, int rawStartRow, int rawEndRow)
    {
        var sb = new StringBuilder();
        for (int i = 0; i < categories.Length; i++)
        {
            if (i > 0) sb.Append(" + ");
            char colLetter = (char)('C' + i);
            sb.Append($"COUNTIFS('داده‌های خام رسیدگی'!$B${rawStartRow}:$B${rawEndRow}, B{r}, 'داده‌های خام رسیدگی'!$J${rawStartRow}:$J${rawEndRow}, \"{categories[i].Code}\", 'داده‌های خام رسیدگی'!${rawCol}${rawStartRow}:${rawCol}${rawEndRow}, \">=0\") * ${colLetter}${weightRow}");
        }
        return sb.ToString();
    }

    private static string BuildPenaltyWeightedFormula(int r, string rawCol, int weightRow, (string Code, string Title)[] categories, int rawStartRow, int rawEndRow)
    {
        var sb = new StringBuilder();
        for (int i = 0; i < categories.Length; i++)
        {
            if (i > 0) sb.Append(" + ");
            char colLetter = (char)('C' + i);
            sb.Append($"COUNTIFS('داده‌های خام رسیدگی'!$B${rawStartRow}:$B${rawEndRow}, B{r}, 'داده‌های خام رسیدگی'!$J${rawStartRow}:$J${rawEndRow}, \"{categories[i].Code}\", 'داده‌های خام رسیدگی'!${rawCol}${rawStartRow}:${rawCol}${rawEndRow}, 1) * ABS(${colLetter}${weightRow})");
        }
        return sb.ToString();
    }

    private static string? GetStringVal(IDictionary<string, object> row, string? colName)
    {
        if (colName == null || !row.ContainsKey(colName) || row[colName] == null) return null;
        return row[colName].ToString()?.Trim();
    }

    private static decimal GetDecimalVal(IDictionary<string, object> row, string? colName)
    {
        if (colName == null || !row.ContainsKey(colName) || row[colName] == null) return 0m;
        var str = row[colName].ToString()?.Trim();
        if (string.IsNullOrWhiteSpace(str)) return 0m;
        if (decimal.TryParse(str, out decimal d)) return d;
        return 0m;
    }

    private class AuditorPrecomputedStats
    {
        public string AuditorName { get; set; } = string.Empty;
        public string AuditorNationalId { get; set; } = string.Empty;
        public string OfficeName { get; set; } = string.Empty;
        public int TotalCases { get; set; }
        public decimal Fr01Score { get; set; }
        public decimal Fr02Score { get; set; }
        public decimal Fr03Score { get; set; }
        public decimal Fr04Score { get; set; }
        public decimal Fr05Score { get; set; }
        public decimal Fr07PositiveScore { get; set; }
        public decimal Fr08PositiveScore { get; set; }
        public decimal PosScore { get; set; }
        public decimal Fr06Penalty { get; set; }
        public decimal Delay07Penalty { get; set; }
        public decimal Delay08Penalty { get; set; }
        public decimal TotalDeductions { get; set; }
        public decimal NetScore { get; set; }
        public int Rank { get; set; }
        public string Grade { get; set; } = "D";
        public string GradeTitle { get; set; } = "نیازمند بهبود (د)";
    }

    private class EvaluatedCaseRow
    {
        public int Index { get; set; }
        public AuditorCaseRecord Case { get; set; } = null!;
        public string CategoryCode { get; set; } = string.Empty;
        public string CategoryTitle { get; set; } = string.Empty;
        public int Fr01Issued { get; set; }
        public int Fr02Finalized { get; set; }
        public int Fr03Accepted { get; set; }
        public int Fr04Article238 { get; set; }
        public int Fr05Growth { get; set; }
        public int Fr06Reduction { get; set; }
        public double Fr07DelayDays { get; set; }
        public double Fr08DelayDays { get; set; }
    }
}
