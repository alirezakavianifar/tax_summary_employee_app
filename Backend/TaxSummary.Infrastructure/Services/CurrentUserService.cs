using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using TaxSummary.Domain.Interfaces;

namespace TaxSummary.Infrastructure.Services;

/// <summary>
/// Service providing access to the current authenticated user identity and HTTP request context
/// </summary>
public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? UserId
    {
        get
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null) return null;

            var claim = user.FindFirst(ClaimTypes.NameIdentifier) 
                        ?? user.FindFirst("sub") 
                        ?? user.FindFirst("id");

            if (claim != null && Guid.TryParse(claim.Value, out var guid))
            {
                return guid;
            }

            return null;
        }
    }

    public string? Username
    {
        get
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null) return null;

            return user.FindFirst(ClaimTypes.Name)?.Value
                   ?? user.FindFirst("username")?.Value
                   ?? user.Identity?.Name;
        }
    }

    public string? IpAddress
    {
        get
        {
            var context = _httpContextAccessor.HttpContext;
            if (context == null) return null;

            // Check X-Forwarded-For header if behind a reverse proxy
            if (context.Request.Headers.TryGetValue("X-Forwarded-For", out var forwardedFor) && !string.IsNullOrEmpty(forwardedFor))
            {
                var ip = forwardedFor.ToString().Split(',')[0].Trim();
                if (!string.IsNullOrEmpty(ip)) return ip;
            }

            return context.Connection.RemoteIpAddress?.ToString();
        }
    }

    public string? UserAgent
    {
        get
        {
            var context = _httpContextAccessor.HttpContext;
            if (context == null) return null;

            return context.Request.Headers["User-Agent"].ToString();
        }
    }

    public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;
}
