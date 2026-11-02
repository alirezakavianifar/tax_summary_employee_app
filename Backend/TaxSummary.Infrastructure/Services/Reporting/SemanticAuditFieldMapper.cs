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
    public bool IsDecreeReport { get; set; }

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

            // 1. Auditor / Decree Supervisor Name
            if (mapper.AuditorNameField == null &&
                (header.Contains("نام حسابرس") || 
                 (header.Contains("حسابرس") && (header.Contains("نام") || header.Contains("کارشناس"))) ||
                 header == "حسابرس" || header.Contains("نام ممیز") ||
                 header.Contains("نام سرپرست مجری قرار") ||
                 header.Contains("سرپرست مجری قرار") ||
                 header.Contains("مجری قرار") ||
                 header.Contains("کارشناس اجرای قرار") ||
                 header.Contains("کارشناس قرار") ||
                 header.Contains("نام سرپرست") ||
                 header.Contains("سرپرست مجری")))
            {
                // Ensure it's not "طول نام..." or "کد ملی..."
                if (!header.Contains("طول") && !header.Contains("کد"))
                {
                    mapper.AuditorNameField = field;
                }
            }

            // 2. Auditor / Supervisor National ID
            if (mapper.AuditorNationalIdField == null &&
                (header.Contains("کد ملی حسابرس") || header.Contains("کدملی حسابرس") || 
                 header.Contains("کدملی سرپرست مجری") || header.Contains("کد ملی سرپرست مجری") ||
                 header.Contains("کدملی مجری") ||
                 (header.Contains("کد") && header.Contains("حسابرس"))))
            {
                mapper.AuditorNationalIdField = field;
            }

            // 3. Declared Tax / Taxable Income Base
            if (mapper.DeclaredTaxField == null &&
                (header.Contains("ابرازی") || header.Contains("مالیات ابرازی") ||
                 header.Contains("درامد") && header.Contains("ماخذ") ||
                 header.Contains("ماخذ مشمول مالیات") ||
                 header.Contains("ماخذ")))
            {
                mapper.DeclaredTaxField = field;
            }

            // 4. Assessed Tax / Principal Tax Amount
            if (mapper.AssessedTaxField == null &&
                (header.Contains("تشخیصی") || header.Contains("مالیات تشخیصی") || 
                 (header.Contains("برگ تشخیص") && header.Contains("مبلغ")) ||
                 header.Contains("مجموع مبلغ اصل مالیات") ||
                 header.Contains("مجموع اصل مالیات") ||
                 (header.Contains("اصل مالیات") && !header.Contains("جریمه"))))
            {
                mapper.AssessedTaxField = field;
            }

            // 5. Final Tax / Duties / Penalties
            if (mapper.FinalTaxField == null &&
                ((header.Contains("قطعی") && (header.Contains("مالیات") || header.Contains("مبلغ")) && !header.Contains("نسخه") && !header.Contains("شماره") && !header.Contains("تاریخ")) ||
                 header.Contains("مجموع مبلغ عوارض") ||
                 header.Contains("مجموع مبلغ سایر")))
            {
                mapper.FinalTaxField = field;
            }

            // 6. Assignment Date (Audit assignment or Decree allocation)
            if (mapper.AssignmentDateField == null &&
                (header.Contains("تاریخ تخصیص به حسابرس") || header.Contains("تاریخ تخصیص قرار") ||
                 header.Contains("تاریخ تخصیص") || (header.Contains("تخصیص") && header.Contains("تاریخ"))))
            {
                mapper.AssignmentDateField = field;
            }

            // 7. Notice Served / Decree Report Submission Date
            if (mapper.NoticeDateField == null &&
                (header.Contains("تاریخ ابلاغ برگ تشخیص") || header.Contains("تاریخ صدور برگ تشخیص") || 
                 (header.Contains("برگ تشخیص") && header.Contains("تاریخ")) ||
                 header.Contains("تاریخ ثبت گزارش قرار") || header.Contains("ثبت گزارش قرار") ||
                 (header.Contains("گزارش قرار") && header.Contains("تاریخ"))))
            {
                mapper.NoticeDateField = field;
            }

            // 8. Risk Level / Stage Complexity
            if (mapper.RiskLevelField == null &&
                (header.Contains("ریسک") || header.Contains("ریسک اظهارنامه") || header.Contains("سطح ریسک") ||
                 header.Contains("عنوان مرحله اعتراض") || header.Contains("مرحله اعتراض")))
            {
                mapper.RiskLevelField = field;
            }

            // 9. Office Name
            if (mapper.OfficeNameField == null &&
                (header.Contains("نام اداره امور سنیم") || header.Contains("نام اداره سنیم") || 
                 header.Contains("نام اداره") || header.Contains("اداره امور مالیاتی") || 
                 header.Contains("اداره کل") || header.Contains("ساختمان دادرسی")))
            {
                if (!header.Contains("کد"))
                {
                    mapper.OfficeNameField = field;
                }
            }

            // 10. Audit Status / Request Stage
            if (mapper.AuditStatusField == null &&
                (header.Contains("عنوان مرحله درخواست") || header.Contains("مرحله درخواست") ||
                 header.Contains("وضعیت فعلی") || header.Contains("نوع حسابرسی") || header == "وضعیت"))
            {
                mapper.AuditStatusField = field;
            }

            // 11. Declaration / Case Tracking ID
            if (mapper.DeclarationIdField == null &&
                (header.Contains("شناسه یکتای دادرسی") || header.Contains("کلید جدول اعتراضات") ||
                 header.Contains("شناسه اظهارنامه") || header.Contains("کد رهگیری") || header.Contains("کلاسه پرونده")))
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
                return (h.Contains("حسابرس") || h.Contains("مجری قرار") || h.Contains("سرپرست مجری")) && !h.Contains("کد") && !h.Contains("طول");
            });
            if (fallback != null) mapper.AuditorNameField = fallback.FieldName;
        }

        // Detect if this dataset is decree / dispute resolution
        mapper.IsDecreeReport = colList.Any(c =>
        {
            var h = Normalize(c.OriginalHeader ?? c.PersianLabel);
            return h.Contains("قرار") || h.Contains("دادرسی") || h.Contains("اعتراض");
        });

        return mapper;
    }

    private static string Normalize(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;
        return input
            .Replace('ي', 'ی')
            .Replace('ك', 'ک')
            .Replace('أ', 'ا')
            .Replace('إ', 'ا')
            .Replace('آ', 'ا')
            .Replace('\u200c', ' ')
            .Trim()
            .ToLowerInvariant();
    }
}
