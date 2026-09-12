using TaxSummary.Application.DTOs;

namespace TaxSummary.Application.DTOs.Auth;

/// <summary>
/// User data transfer object
/// </summary>
public class UserDto
{
    /// <summary>
    /// User unique identifier
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Username
    /// </summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// Email address (optional)
    /// </summary>
    public string? Email { get; set; }

    /// <summary>
    /// User role
    /// </summary>
    public string Role { get; set; } = string.Empty;

    /// <summary>
    /// Whether the user account is active
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// Optional employee ID if associated with an employee
    /// </summary>
    public Guid? EmployeeId { get; set; }

    /// <summary>
    /// Associated employee information (if any)
    /// </summary>
    public EmployeeDto? Employee { get; set; }

    /// <summary>
    /// Offices assigned to this user
    /// </summary>
    public List<TaxSummary.Application.DTOs.Office.OfficeSummaryDto> AssignedOffices { get; set; } = new();

    /// <summary>
    /// Account lockout expiration (null if not locked)
    /// </summary>
    public DateTime? LockoutEnd { get; set; }

    /// <summary>
    /// Consecutive failed login attempts
    /// </summary>
    public int FailedLoginAttempts { get; set; }

    /// <summary>
    /// Whether the user is required to change password on next login
    /// </summary>
    public bool MustChangePassword { get; set; }

    /// <summary>
    /// Account creation date
    /// </summary>
    public DateTime CreatedAt { get; set; }
}
