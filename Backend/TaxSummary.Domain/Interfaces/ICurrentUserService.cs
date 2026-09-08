namespace TaxSummary.Domain.Interfaces;

/// <summary>
/// Service interface for retrieving current authenticated user and request context
/// </summary>
public interface ICurrentUserService
{
    /// <summary>
    /// Current authenticated user identifier, or null if unauthenticated / background worker
    /// </summary>
    Guid? UserId { get; }

    /// <summary>
    /// Current username or identity name
    /// </summary>
    string? Username { get; }

    /// <summary>
    /// Client IP address of the current HTTP request
    /// </summary>
    string? IpAddress { get; }

    /// <summary>
    /// Client browser User-Agent of the current HTTP request
    /// </summary>
    string? UserAgent { get; }

    /// <summary>
    /// Whether the current request is authenticated
    /// </summary>
    bool IsAuthenticated { get; }
}
