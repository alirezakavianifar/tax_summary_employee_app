using System.Security.Claims;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Domain.Interfaces;

/// <summary>
/// JWT token service interface
/// </summary>
public interface IJwtTokenService
{
    /// <summary>
    /// Generate an access token for a user
    /// </summary>
    string GenerateAccessToken(User user);

    /// <summary>
    /// Generate a refresh token
    /// </summary>
    string GenerateRefreshToken();

    /// <summary>
    /// Validate a token and return the principal
    /// </summary>
    ClaimsPrincipal? ValidateToken(string token);

    /// <summary>
    /// Get user ID from token
    /// </summary>
    Guid? GetUserIdFromToken(string token);
}
