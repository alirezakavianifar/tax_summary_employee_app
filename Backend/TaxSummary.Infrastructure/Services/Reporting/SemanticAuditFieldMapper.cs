using System;
using System.Collections.Generic;
using System.Linq;
using TaxSummary.Application.DTOs.Reporting;

namespace TaxSummary.Infrastructure.Services.Reporting;

/// <summary>
/// نگاشت خودکار و هوشمند ستون‌های گزارش اکسل بارگذاری‌شده به فیلدهای معنایی ارزیابی عملکرد حسابرسان
/// </summary>
public class SemanticAuditFieldMapper
{
    public string? AuditorNameField { get; set; }
    public string? AuditorNationalIdField { get; set; }
    public string? DeclaredTaxField { get; set; }
    public string? AssessedTaxField { get; set; }
    public string? FinalTaxField { get; set; }
    public string? AssignmentDateField { get; set; }
    public string? NoticeDateField { get; set; }
    public string? RiskLevelField { get; set; }
    public string? OfficeNameField { get; set; }
    public string? AuditStatusField { get; set; }
    public string? DeclarationIdField { get; set; }

    public bool HasAuditorData => !string.IsNullOrWhiteSpace(AuditorNameField);

    public static SemanticAuditFieldMapper FromColumns(IEnumerable<CustomDatasetColumnDto> columns)
    {
        var mapper = new SemanticAuditFieldMapper();
        var colList = columns.ToList();

        foreach (var col in colList)
        {
            var raw = col.OriginalHeader ?? col.PersianLabel ?? string.Empty;
            var header = Normalize(raw);
            var field = col.FieldName;

            // 1. Auditor Name
            if (mapper.AuditorNameField == null &&
                (header.Contains("نام حسابرس") || 
                 (header.Contains("حسابرس") && (header.Contains("نام") || header.Contains("کارشناس"))) ||
                 header == "حسابرس" || header.Contains("نام ممیز")))
            {
                // Ensure it's not "طول نام حسابرس" or "کد ملی حسابرس"
                if (!header.Contains("طول") && !header.Contains("کد"))
                {
                    mapper.AuditorNameField = field;
                }
            }

            // 2. Auditor National ID
            if (mapper.AuditorNationalIdField == null &&
                (header.Contains("کد ملی حسابرس") || header.Contains("کدملی حسابرس") || (header.Contains("کد") && header.Contains("حسابرس"))))
            {
                mapper.AuditorNationalIdField = field;
            }

            // 3. Declared Tax
            if (mapper.DeclaredTaxField == null &&
                (header.Contains("ابرازی") || header.Contains("مالیات ابرازی")))
            {
                mapper.DeclaredTaxField = field;
            }

            // 4. Assessed Tax
            if (mapper.AssessedTaxField == null &&
                (header.Contains("تشخیصی") || header.Contains("مالیات تشخیصی") || header.Contains("برگ تشخیص") && header.Contains("مبلغ")))
            {
                mapper.AssessedTaxField = field;
            }

            // 5. Final Tax
            if (mapper.FinalTaxField == null &&
                (header.Contains("قطعی") && (header.Contains("مالیات") || header.Contains("مبلغ")) && !header.Contains("نسخه") && !header.Contains("شماره") && !header.Contains("تاریخ")))
            {
                mapper.FinalTaxField = field;
            }

            // 6. Assignment Date
            if (mapper.AssignmentDateField == null &&
                (header.Contains("تاریخ تخصیص به حسابرس") || header.Contains("تاریخ تخصیص") || (header.Contains("تخصیص") && header.Contains("تاریخ"))))
            {
                mapper.AssignmentDateField = field;
            }

            // 7. Notice Served/Issue Date
            if (mapper.NoticeDateField == null &&
                (header.Contains("تاریخ ابلاغ برگ تشخیص") || header.Contains("تاریخ صدور برگ تشخیص") || (header.Contains("برگ تشخیص") && header.Contains("تاریخ"))))
            {
                mapper.NoticeDateField = field;
            }

            // 8. Risk Level
            if (mapper.RiskLevelField == null &&
                (header.Contains("ریسک") || header.Contains("ریسک اظهارنامه") || header.Contains("سطح ریسک")))
            {
                mapper.RiskLevelField = field;
            }

            // 9. Office Name
            if (mapper.OfficeNameField == null &&
                (header.Contains("نام اداره سنیم") || header.Contains("نام اداره") || header.Contains("اداره امور مالیاتی") || header.Contains("اداره کل")))
            {
                if (!header.Contains("کد"))
                {
                    mapper.OfficeNameField = field;
                }
            }

            // 10. Audit Status
            if (mapper.AuditStatusField == null &&
                (header.Contains("وضعیت فعلی") || header.Contains("نوع حسابرسی") || header == "وضعیت"))
            {
                mapper.AuditStatusField = field;
            }

            // 11. Declaration / Case Tracking ID
            if (mapper.DeclarationIdField == null &&
                (header.Contains("شناسه اظهارنامه") || header.Contains("کد رهگیری") || header.Contains("کلاسه پرونده")))
            {
                mapper.DeclarationIdField = field;
            }
        }

        // Secondary fallbacks if exact terms were slightly different
        if (mapper.AuditorNameField == null)
        {
            var fallback = colList.FirstOrDefault(c =>
            {
                var h = Normalize(c.OriginalHeader ?? c.PersianLabel);
                return h.Contains("حسابرس") && !h.Contains("کد") && !h.Contains("طول");
            });
            if (fallback != null) mapper.AuditorNameField = fallback.FieldName;
        }

        return mapper;
    }

    private static string Normalize(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;
        return input
            .Replace('ي', 'ی')
            .Replace('ك', 'ک')
            .Replace('\u200c', ' ')
            .Trim()
            .ToLowerInvariant();
    }
}
