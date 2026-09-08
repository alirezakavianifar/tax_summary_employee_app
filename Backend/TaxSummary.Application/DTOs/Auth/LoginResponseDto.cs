namespace TaxSummary.Application.DTOs.Auth;

/// <summary>
/// Response DTO for successful login
/// </summary>
public class LoginResponseDto
{
    /// <summary>
    /// JWT access token
    /// </summary>
    public string AccessToken { get; set; } = string.Empty;

    /// <summary>
    /// Token type (always "Bearer")
    /// </summary>
    public string TokenType { get; set; } = "Bearer";

    /// <summary>
    /// Token expiration time in seconds
    /// </summary>
    public int ExpiresIn { get; set; }

    /// <summary>
    /// Authenticated user information
    /// </summary>
    public UserDto User { get; set; } = null!;

    /// <summary>
    /// Raw refresh token for HttpOnly cookie delivery (excluded from JSON body)
    /// </summary>
    [System.Text.Json.Serialization.JsonIgnore]
    public string? RefreshToken { get; set; }
}
