namespace TaxSummary.Domain.Entities;

/// <summary>
/// Domain entity representing an immutable audit log entry for administrative and data state changes
/// ثبت رویدادها و تغییرات امنیتی و مدیریتی سامانه
/// </summary>
public class AuditLog
{
    public Guid Id { get; private set; }

    /// <summary>
    /// Identifier of the user who performed the operation, or null if system/unauthenticated
    /// </summary>
    public Guid? UserId { get; private set; }

    /// <summary>
    /// Username or display name of the actor
    /// </summary>
    public string? Username { get; private set; }

    /// <summary>
    /// Action type: Created, Modified, Deleted
    /// </summary>
    public string Action { get; private set; } = string.Empty;

    /// <summary>
    /// Name of the entity being audited (e.g. "User", "Employee", "TaxRefundCase", "MenuSetting")
    /// </summary>
    public string EntityName { get; private set; } = string.Empty;

    /// <summary>
    /// Primary key identifier of the entity
    /// </summary>
    public string EntityId { get; private set; } = string.Empty;

    /// <summary>
    /// JSON serialized dictionary of original values before modification or deletion
    /// </summary>
    public string? OldValues { get; private set; }

    /// <summary>
    /// JSON serialized dictionary of new values after creation or modification
    /// </summary>
    public string? NewValues { get; private set; }

    /// <summary>
    /// Comma-separated list of modified property names
    /// </summary>
    public string? AffectedColumns { get; private set; }

    /// <summary>
    /// Client IP address from which the request originated
    /// </summary>
    public string? IpAddress { get; private set; }

    /// <summary>
    /// Client browser User-Agent
    /// </summary>
    public string? UserAgent { get; private set; }

    /// <summary>
    /// UTC timestamp of the audit entry
    /// </summary>
    public DateTime Timestamp { get; private set; }

    // EF Core constructor
    private AuditLog() { }

    public static AuditLog Create(
        Guid? userId,
        string? username,
        string action,
        string entityName,
        string entityId,
        string? oldValues = null,
        string? newValues = null,
        string? affectedColumns = null,
        string? ipAddress = null,
        string? userAgent = null)
    {
        if (string.IsNullOrWhiteSpace(action))
            throw new ArgumentException("نوع عملیات (Action) الزامی است", nameof(action));

        if (string.IsNullOrWhiteSpace(entityName))
            throw new ArgumentException("نام موجودیت (EntityName) الزامی است", nameof(entityName));

        if (string.IsNullOrWhiteSpace(entityId))
            throw new ArgumentException("شناسه موجودیت (EntityId) الزامی است", nameof(entityId));

        return new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Username = username?.Trim(),
            Action = action.Trim(),
            EntityName = entityName.Trim(),
            EntityId = entityId.Trim(),
            OldValues = oldValues,
            NewValues = newValues,
            AffectedColumns = affectedColumns,
            IpAddress = ipAddress?.Trim(),
            UserAgent = userAgent?.Trim(),
            Timestamp = DateTime.UtcNow
        };
    }
}
