using System.Text.RegularExpressions;
using TaxSummary.Domain.Enums;

namespace TaxSummary.Domain.Entities;

public class ReportDefinition
{
    public Guid Id { get; private set; }

    /// <summary>
    /// شناسه یکتای سیستمی گزارش (مانند: REP_PAYROLL_BUDGET_UTIL)
    /// </summary>
    public string Code { get; private set; } = string.Empty;

    /// <summary>
    /// عنوان فارسی رسمی گزارش
    /// </summary>
    public string Title { get; private set; } = string.Empty;

    /// <summary>
    /// شرح کاربردی و مخاطبان گزارش
    /// </summary>
    public string Description { get; private set; } = string.Empty;

    /// <summary>
    /// خاستگاه داده‌های گزارش (منابع انسانی، حقوق و دستمزد، استرداد مالیات، یا فرابخشی)
    /// </summary>
    public ReportDomainSource DomainSource { get; private set; }

    /// <summary>
    /// دسته‌بندی موضوعی گزارش (شاخص‌های مدیریتی، عملیاتی، مالی، انطباق و بازرسی)
    /// </summary>
    public ReportCategory Category { get; private set; }

    /// <summary>
    /// ساختار نمایشی گزارش (جدول جزئیات، ماتریس تجمیعی/پایوت، کارت شاخص)
    /// </summary>
    public ReportType Type { get; private set; }

    /// <summary>
    /// پیکربندی ستون‌ها، فیلترها و فرمول‌های محاسباتی در قالب JSON
    /// </summary>
    public string ConfigurationJson { get; private set; } = "{}";

    /// <summary>
    /// آیا گزارش از الگوهای استاندارد و غیرقابل حذف سامانه است؟
    /// </summary>
    public bool IsSystemReport { get; private set; }

    /// <summary>
    /// وضعیت فعال/غیرفعال بودن گزارش در پرتال
    /// </summary>
    public bool IsActive { get; private set; }

    /// <summary>
    /// حداقل نقش لازم برای دسترسی به گزارش (مثلاً: Admin, Manager, Auditor)
    /// </summary>
    public string? RequiredRole { get; private set; }

    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }
    public Guid? CreatedByUserId { get; private set; }
    public User? CreatedByUser { get; private set; }

    private ReportDefinition() { } // EF Core Constructor

    public static ReportDefinition Create(
        string code,
        string title,
        string description,
        ReportDomainSource source,
        ReportCategory category,
        ReportType type,
        string configurationJson,
        bool isSystemReport = false,
        string? requiredRole = null,
        Guid? createdByUserId = null)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new ArgumentException("کد سیستمی گزارش نمی‌تواند خالی باشد.", nameof(code));

        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("عنوان گزارش نمی‌تواند خالی باشد.", nameof(title));

        if (string.IsNullOrWhiteSpace(configurationJson))
            throw new ArgumentException("پیکربندی ستون‌های گزارش الزامی است.", nameof(configurationJson));

        var cleanCode = code.Trim().ToUpperInvariant();
        if (!Regex.IsMatch(cleanCode, @"^[A-Z0-9_]{3,64}$"))
            throw new ArgumentException("کد گزارش باید صرفاً شامل حروف لاتین، ارقام و خط زیر باشد (۳ تا ۶۴ کاراکتر).", nameof(code));

        return new ReportDefinition
        {
            Id = Guid.NewGuid(),
            Code = cleanCode,
            Title = title.Trim(),
            Description = description?.Trim() ?? string.Empty,
            DomainSource = source,
            Category = category,
            Type = type,
            ConfigurationJson = configurationJson.Trim(),
            IsSystemReport = isSystemReport,
            IsActive = true,
            RequiredRole = string.IsNullOrWhiteSpace(requiredRole) ? null : requiredRole.Trim(),
            CreatedAt = DateTime.UtcNow,
            CreatedByUserId = createdByUserId
        };
    }

    public void Update(string title, string description, string configurationJson, string? requiredRole)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("عنوان گزارش نمی‌تواند خالی باشد.", nameof(title));

        if (string.IsNullOrWhiteSpace(configurationJson))
            throw new ArgumentException("پیکربندی ستون‌های گزارش الزامی است.", nameof(configurationJson));

        Title = title.Trim();
        Description = description?.Trim() ?? string.Empty;
        ConfigurationJson = configurationJson.Trim();
        RequiredRole = string.IsNullOrWhiteSpace(requiredRole) ? null : requiredRole.Trim();
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetActive(bool isActive, bool byAdmin = false)
    {
        // Guard: Prevent non-admin deactivating mission-critical system reports
        if (!isActive && IsSystemReport && !byAdmin)
            throw new InvalidOperationException("امکان غیرفعال‌سازی گزارش‌های پایه سیستمی وجود ندارد.");

        IsActive = isActive;
        UpdatedAt = DateTime.UtcNow;
    }
}
