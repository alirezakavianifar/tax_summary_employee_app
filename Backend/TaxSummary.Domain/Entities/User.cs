namespace TaxSummary.Domain.Entities;

/// <summary>
/// User entity for authentication and authorization
/// </summary>
public class User
{
    /// <summary>
    /// Unique identifier
    /// </summary>
    public Guid Id { get; private set; }

    /// <summary>
    /// Username for login (unique)
    /// </summary>
    public string Username { get; private set; }

    /// <summary>
    /// Email address (unique)
    /// </summary>
    public string Email { get; private set; }

    /// <summary>
    /// Hashed password (BCrypt)
    /// </summary>
    public string PasswordHash { get; private set; }

    /// <summary>
    /// User role (Admin, Manager, Employee)
    /// </summary>
    public string Role { get; private set; }

    /// <summary>
    /// Whether the account is active
    /// </summary>
    public bool IsActive { get; private set; }

    /// <summary>
    /// Number of consecutive failed login attempts
    /// </summary>
    public int FailedLoginAttempts { get; private set; }

    /// <summary>
    /// When the account lockout ends (null if not locked)
    /// </summary>
    public DateTime? LockoutEnd { get; private set; }

    /// <summary>
    /// When the user was created
    /// </summary>
    public DateTime CreatedAt { get; private set; }

    /// <summary>
    /// When the user was last updated
    /// </summary>
    public DateTime UpdatedAt { get; private set; }

    /// <summary>
    /// Optional reference to associated employee
    /// </summary>
    public Guid? EmployeeId { get; private set; }

    /// <summary>
    /// Navigation property to associated employee
    /// </summary>
    public Employee? Employee { get; private set; }

    /// <summary>
    /// Navigation property to refresh tokens
    /// </summary>
    public ICollection<RefreshToken> RefreshTokens { get; private set; } = new List<RefreshToken>();

    // Private constructor for EF Core
    private User() { }

    /// <summary>
    /// Factory method to create a new user
    /// </summary>
    public static User Create(
        string username,
        string email,
        string passwordHash,
        string role,
        Guid? employeeId = null)
    {
        if (string.IsNullOrWhiteSpace(username))
            throw new ArgumentException("نام کاربری نمی‌تواند خالی باشد", nameof(username));

        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("ایمیل نمی‌تواند خالی باشد", nameof(email));

        if (string.IsNullOrWhiteSpace(passwordHash))
            throw new ArgumentException("رمز عبور نمی‌تواند خالی باشد", nameof(passwordHash));

        if (string.IsNullOrWhiteSpace(role))
            throw new ArgumentException("نقش کاربر نمی‌تواند خالی باشد", nameof(role));

        var validRoles = new[] { "Admin", "Manager", "Employee" };
        if (!validRoles.Contains(role))
            throw new ArgumentException($"نقش باید یکی از موارد زیر باشد: {string.Join(", ", validRoles)}", nameof(role));

        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = username.Trim(),
            Email = email.Trim().ToLowerInvariant(),
            PasswordHash = passwordHash,
            Role = role,
            IsActive = true,
            FailedLoginAttempts = 0,
            LockoutEnd = null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            EmployeeId = employeeId
        };

        return user;
    }

    /// <summary>
    /// Update password hash
    /// </summary>
    public void UpdatePassword(string newPasswordHash)
    {
        if (string.IsNullOrWhiteSpace(newPasswordHash))
            throw new ArgumentException("رمز عبور نمی‌تواند خالی باشد", nameof(newPasswordHash));

        PasswordHash = newPasswordHash;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Increment failed login attempts and lock account if threshold exceeded
    /// </summary>
    public void IncrementFailedLoginAttempts()
    {
        FailedLoginAttempts++;
        UpdatedAt = DateTime.UtcNow;

        // Lock account for 15 minutes after 5 failed attempts
        if (FailedLoginAttempts >= 5)
        {
            LockoutEnd = DateTime.UtcNow.AddMinutes(15);
        }
    }

    /// <summary>
    /// Reset failed login attempts (called on successful login)
    /// </summary>
    public void ResetFailedLoginAttempts()
    {
        FailedLoginAttempts = 0;
        LockoutEnd = null;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Check if account is currently locked
    /// </summary>
    public bool IsLockedOut()
    {
        return LockoutEnd.HasValue && LockoutEnd.Value > DateTime.UtcNow;
    }

    /// <summary>
    /// Manually lock the account
    /// </summary>
    public void LockAccount(TimeSpan duration)
    {
        LockoutEnd = DateTime.UtcNow.Add(duration);
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Manually unlock the account
    /// </summary>
    public void UnlockAccount()
    {
        LockoutEnd = null;
        FailedLoginAttempts = 0;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Deactivate the account
    /// </summary>
    public void Deactivate()
    {
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Activate the account
    /// </summary>
    public void Activate()
    {
        IsActive = true;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Update user role
    /// </summary>
    public void UpdateRole(string newRole)
    {
        var validRoles = new[] { "Admin", "Manager", "Employee" };
        if (!validRoles.Contains(newRole))
            throw new ArgumentException($"نقش باید یکی از موارد زیر باشد: {string.Join(", ", validRoles)}", nameof(newRole));

        Role = newRole;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Associate user with an employee
    /// </summary>
    public void AssociateWithEmployee(Guid employeeId)
    {
        EmployeeId = employeeId;
        UpdatedAt = DateTime.UtcNow;
    }
}
