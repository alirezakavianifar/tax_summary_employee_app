using System.Text.Encodings.Web;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Interfaces;

namespace TaxSummary.Infrastructure.Data.Interceptors;

/// <summary>
/// EF Core SaveChangesInterceptor that automatically records state changes on monitored domain entities
/// به ثبت خودکار لاگ‌های تغییرات اطلاعات و رویدادهای سیستمی در پایگاه داده می‌پردازد
/// </summary>
public class AuditLogInterceptor : SaveChangesInterceptor
{
    private readonly ICurrentUserService _currentUserService;
    private static readonly HashSet<string> SensitivePropertyNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "PasswordHash",
        "TokenHash",
        "SecretKey",
        "SecurityStamp",
        "ConcurrencyStamp"
    };

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
        WriteIndented = false
    };

    public AuditLogInterceptor(ICurrentUserService currentUserService)
    {
        _currentUserService = currentUserService;
    }

    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData,
        InterceptionResult<int> result)
    {
        if (eventData.Context != null)
        {
            RecordAuditLogs(eventData.Context);
        }

        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context != null)
        {
            RecordAuditLogs(eventData.Context);
        }

        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private void RecordAuditLogs(DbContext context)
    {
        var entries = context.ChangeTracker.Entries()
            .Where(e => e.Entity is not AuditLog &&
                        (e.State == EntityState.Added ||
                         e.State == EntityState.Modified ||
                         e.State == EntityState.Deleted))
            .ToList();

        if (entries.Count == 0) return;

        var auditLogs = new List<AuditLog>();
        var currentUserId = _currentUserService.UserId;
        var currentUsername = _currentUserService.Username;
        var clientIp = _currentUserService.IpAddress;
        var userAgent = _currentUserService.UserAgent;

        foreach (var entry in entries)
        {
            var entityName = entry.Metadata.ClrType.Name;
            var primaryKey = entry.Properties.FirstOrDefault(p => p.Metadata.IsPrimaryKey());
            var entityId = primaryKey?.CurrentValue?.ToString() ?? Guid.NewGuid().ToString();

            string action;
            Dictionary<string, object?>? oldValues = null;
            Dictionary<string, object?>? newValues = null;
            List<string>? affectedColumns = null;

            switch (entry.State)
            {
                case EntityState.Added:
                    action = "Created";
                    newValues = new Dictionary<string, object?>();
                    affectedColumns = new List<string>();

                    foreach (var prop in entry.Properties)
                    {
                        var propName = prop.Metadata.Name;
                        affectedColumns.Add(propName);

                        if (SensitivePropertyNames.Contains(propName))
                        {
                            newValues[propName] = "[REDACTED]";
                        }
                        else
                        {
                            newValues[propName] = prop.CurrentValue;
                        }
                    }
                    break;

                case EntityState.Deleted:
                    action = "Deleted";
                    oldValues = new Dictionary<string, object?>();

                    foreach (var prop in entry.Properties)
                    {
                        var propName = prop.Metadata.Name;

                        if (SensitivePropertyNames.Contains(propName))
                        {
                            oldValues[propName] = "[REDACTED]";
                        }
                        else
                        {
                            oldValues[propName] = prop.OriginalValue;
                        }
                    }
                    break;

                case EntityState.Modified:
                    action = "Modified";
                    oldValues = new Dictionary<string, object?>();
                    newValues = new Dictionary<string, object?>();
                    affectedColumns = new List<string>();

                    foreach (var prop in entry.Properties)
                    {
                        var propName = prop.Metadata.Name;

                        // Only track modified properties for update operations
                        if (prop.IsModified)
                        {
                            affectedColumns.Add(propName);

                            if (SensitivePropertyNames.Contains(propName))
                            {
                                oldValues[propName] = "[REDACTED]";
                                newValues[propName] = "[REDACTED]";
                            }
                            else
                            {
                                oldValues[propName] = prop.OriginalValue;
                                newValues[propName] = prop.CurrentValue;
                            }
                        }
                    }

                    // If no properties were actually modified, skip creating an audit entry
                    if (affectedColumns.Count == 0)
                    {
                        continue;
                    }
                    break;

                default:
                    continue;
            }

            var oldValuesJson = oldValues != null && oldValues.Count > 0
                ? JsonSerializer.Serialize(oldValues, JsonOptions)
                : null;

            var newValuesJson = newValues != null && newValues.Count > 0
                ? JsonSerializer.Serialize(newValues, JsonOptions)
                : null;

            var affectedColsString = affectedColumns != null && affectedColumns.Count > 0
                ? string.Join(", ", affectedColumns)
                : null;

            var auditLog = AuditLog.Create(
                userId: currentUserId,
                username: currentUsername,
                action: action,
                entityName: entityName,
                entityId: entityId,
                oldValues: oldValuesJson,
                newValues: newValuesJson,
                affectedColumns: affectedColsString,
                ipAddress: clientIp,
                userAgent: userAgent);

            auditLogs.Add(auditLog);
        }

        if (auditLogs.Count > 0)
        {
            context.Set<AuditLog>().AddRange(auditLogs);
        }
    }
}
