using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace TaxSummary.Api.Controllers.Reporting;

/// <summary>
/// Common base controller for Reporting & Business Intelligence endpoints
/// Provides unified identity, office-scoping, and client metadata resolution.
/// </summary>
public abstract class ReportingControllerBase : ControllerBase
{
    protected Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst("sub")?.Value
                    ?? User.FindFirst("id")?.Value;

        return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
    }

    protected string GetCurrentUsername()
    {
        return User.FindFirst("username")?.Value
               ?? User.FindFirst(ClaimTypes.Name)?.Value
               ?? User.Identity?.Name
               ?? "unknown";
    }

    protected string? GetCurrentUserRole()
    {
        return User.FindFirst(ClaimTypes.Role)?.Value;
    }

    protected List<Guid>? GetUserAssignedOfficeIds()
    {
        var role = GetCurrentUserRole();

        // Executive province-wide roles bypass office scoping
        if (string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(role, "Auditor", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(role, "DirectorGeneral", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var officeClaims = User.FindAll("office_id").Select(c => c.Value).ToList();
        var ids = new List<Guid>();
        foreach (var claim in officeClaims)
        {
            if (Guid.TryParse(claim, out var id) && !ids.Contains(id))
            {
                ids.Add(id);
            }
        }

        return ids;
    }

    protected string? GetClientIpAddress()
    {
        return HttpContext.Connection.RemoteIpAddress?.ToString();
    }
}
