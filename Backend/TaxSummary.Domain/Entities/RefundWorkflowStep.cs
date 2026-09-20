using TaxSummary.Domain.Common;

namespace TaxSummary.Domain.Entities;

/// <summary>
/// Represents a configurable stage in the tax refund approval workflow hierarchy.
/// پیکربندی مراحل تایید در گردش کار پرونده‌های استرداد مالیاتی
/// </summary>
public class RefundWorkflowStep
{
    public Guid Id { get; private set; }

    /// <summary>
    /// The workflow stage status represented by this step
    /// وضعیت پرونده در این مرحله
    /// </summary>
    public RefundCaseStatus Stage { get; private set; }

    /// <summary>
    /// Human-readable title of this step (Persian)
    /// عنوان نمایشی مرحله
    /// </summary>
    public string Title { get; private set; } = string.Empty;

    /// <summary>
    /// Descriptive explanation of stage responsibilities
    /// شرح و مسئولیت‌های این مرحله
    /// </summary>
    public string Description { get; private set; } = string.Empty;

    /// <summary>
    /// Sequential order in the workflow pipeline (e.g. 10, 20, 30, 40, 50)
    /// ترتیب اولویت در گردش کار
    /// </summary>
    public int StepOrder { get; private set; }

    /// <summary>
    /// Whether this approval stage is currently active in the workflow.
    /// If false, cases will skip this stage entirely.
    /// آیا این مرحله در گردش کار فعال است یا بای‌پس (رد) می‌شود
    /// </summary>
    public bool IsEnabled { get; private set; }

    /// <summary>
    /// Whether this step is mandatory by statutory rules and cannot be disabled by administrators.
    /// آیا مرحله الزامی و غیرقابل غیرفعال‌سازی است (مانند مرحله کارشناسی ارشد و ذیحسابی)
    /// </summary>
    public bool IsMandatory { get; private set; }

    /// <summary>
    /// Comma-separated list of allowed system roles permitted to approve this step.
    /// فهرست نقش‌های سازمانی مجاز به تایید این مرحله (جدا شده با کاما)
    /// </summary>
    public string AllowedRoles { get; private set; } = string.Empty;

    /// <summary>
    /// Id of administrator who last updated this step configuration
    /// شناسه کاربری آخرین ویرایش‌کننده
    /// </summary>
    public Guid? UpdatedByUserId { get; private set; }

    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    // Required by EF Core
    private RefundWorkflowStep() { }

    public static RefundWorkflowStep Create(
        RefundCaseStatus stage,
        string title,
        string description,
        int stepOrder,
        bool isEnabled,
        bool isMandatory,
        string allowedRoles,
        Guid? createdByUserId = null)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Title cannot be empty", nameof(title));

        if (string.IsNullOrWhiteSpace(allowedRoles))
            throw new ArgumentException("AllowedRoles cannot be empty", nameof(allowedRoles));

        var step = new RefundWorkflowStep
        {
            Id = Guid.NewGuid(),
            Stage = stage,
            Title = title.Trim(),
            Description = description?.Trim() ?? string.Empty,
            StepOrder = stepOrder,
            IsEnabled = isMandatory || isEnabled,
            IsMandatory = isMandatory,
            AllowedRoles = allowedRoles.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            UpdatedByUserId = createdByUserId
        };

        return step;
    }

    public void Update(
        string title,
        string description,
        bool isEnabled,
        string allowedRoles,
        Guid? updatedByUserId = null)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Title cannot be empty", nameof(title));

        if (string.IsNullOrWhiteSpace(allowedRoles))
            throw new ArgumentException("AllowedRoles cannot be empty", nameof(allowedRoles));

        Title = title.Trim();
        Description = description?.Trim() ?? string.Empty;
        // If step is mandatory, it must always remain enabled
        IsEnabled = IsMandatory || isEnabled;
        AllowedRoles = allowedRoles.Trim();
        UpdatedAt = DateTime.UtcNow;
        UpdatedByUserId = updatedByUserId;
    }

    public void SetEnabled(bool isEnabled, Guid? updatedByUserId = null)
    {
        if (IsMandatory && !isEnabled)
            throw new InvalidOperationException($"مرحله '{Title}' الزامی است و امکان غیرفعال‌سازی آن وجود ندارد.");

        IsEnabled = isEnabled;
        UpdatedAt = DateTime.UtcNow;
        UpdatedByUserId = updatedByUserId;
    }

    public bool IsRoleAllowed(string role)
    {
        if (string.IsNullOrWhiteSpace(role))
            return false;

        if (role.Equals("Admin", StringComparison.OrdinalIgnoreCase))
            return true;

        var roles = AllowedRoles.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        return roles.Any(r => r.Equals(role, StringComparison.OrdinalIgnoreCase));
    }
}
