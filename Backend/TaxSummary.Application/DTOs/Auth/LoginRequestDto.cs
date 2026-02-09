namespace TaxSummary.Application.DTOs.Auth;

/// <summary>
/// Request DTO for user login
/// </summary>
public class LoginRequestDto
{
    /// <summary>
    /// Username or email
    /// </summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// User password
    /// </summary>
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// Remember me option for extended session
    /// </summary>
    public bool RememberMe { get; set; } = false;
}
