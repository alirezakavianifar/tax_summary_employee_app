namespace TaxSummary.Application.DTOs.Auth;

/// <summary>
/// Request DTO for user registration (admin only)
/// </summary>
public class RegisterRequestDto
{
    /// <summary>
    /// Unique username (3-50 characters, alphanumeric)
    /// </summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// Email address
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Password (minimum 8 characters with complexity requirements)
    /// </summary>
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// User role (Admin, Manager, Employee)
    /// </summary>
    public string Role { get; set; } = string.Empty;

    /// <summary>
    /// Optional employee ID to associate user with employee record
    /// </summary>
    public Guid? EmployeeId { get; set; }
}
