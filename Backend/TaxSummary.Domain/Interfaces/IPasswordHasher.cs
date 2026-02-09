namespace TaxSummary.Domain.Interfaces;

/// <summary>
/// Password hashing service interface
/// </summary>
public interface IPasswordHasher
{
    /// <summary>
    /// Hash a password using BCrypt
    /// </summary>
    string HashPassword(string password);

    /// <summary>
    /// Verify a password against a hash
    /// </summary>
    bool VerifyPassword(string password, string hash);
}
