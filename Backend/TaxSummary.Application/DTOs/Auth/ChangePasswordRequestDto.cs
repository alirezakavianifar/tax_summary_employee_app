namespace TaxSummary.Application.DTOs.Auth;

/// <summary>
/// Request DTO for password change
/// </summary>
public class ChangePasswordRequestDto
{
    /// <summary>
    /// Current password
    /// </summary>
    public string CurrentPassword { get; set; } = string.Empty;

    /// <summary>
    /// New password (must meet complexity requirements)
    /// </summary>
    public string NewPassword { get; set; } = string.Empty;
}
