namespace TaxSummary.Domain.Entities;

/// <summary>
/// Refresh token entity for token rotation and revocation
/// </summary>
public class RefreshToken
{
    /// <summary>
    /// Unique identifier
    /// </summary>
    public Guid Id { get; private set; }

    /// <summary>
    /// User who owns this token
    /// </summary>
    public Guid UserId { get; private set; }

    /// <summary>
    /// Hashed token value
    /// </summary>
    public string TokenHash { get; private set; }

    /// <summary>
    /// When the token expires
    /// </summary>
    public DateTime ExpiresAt { get; private set; }

    /// <summary>
    /// When the token was created
    /// </summary>
    public DateTime CreatedAt { get; private set; }

    /// <summary>
    /// When the token was revoked (null if still active)
    /// </summary>
    public DateTime? RevokedAt { get; private set; }

    /// <summary>
    /// Token that replaced this one (for rotation tracking)
    /// </summary>
    public string? ReplacedByToken { get; private set; }

    /// <summary>
    /// IP address of the client that created this token
    /// </summary>
    public string? IpAddress { get; private set; }

    /// <summary>
    /// User agent of the client that created this token
    /// </summary>
    public string? UserAgent { get; private set; }

    /// <summary>
    /// Navigation property to user
    /// </summary>
    public User User { get; private set; } = null!;

    // Private constructor for EF Core
    private RefreshToken() { }

    /// <summary>
    /// Factory method to create a new refresh token
    /// </summary>
    public static RefreshToken Create(
        Guid userId,
        string tokenHash,
        DateTime expiresAt,
        string? ipAddress = null,
        string? userAgent = null)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("شناسه کاربر نمی‌تواند خالی باشد", nameof(userId));

        if (string.IsNullOrWhiteSpace(tokenHash))
            throw new ArgumentException("توکن نمی‌تواند خالی باشد", nameof(tokenHash));

        if (expiresAt <= DateTime.UtcNow)
            throw new ArgumentException("زمان انقضا باید در آینده باشد", nameof(expiresAt));

        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TokenHash = tokenHash,
            ExpiresAt = expiresAt,
            CreatedAt = DateTime.UtcNow,
            RevokedAt = null,
            ReplacedByToken = null,
            IpAddress = ipAddress,
            UserAgent = userAgent
        };

        return refreshToken;
    }

    /// <summary>
    /// Check if token is expired
    /// </summary>
    public bool IsExpired()
    {
        return DateTime.UtcNow >= ExpiresAt;
    }

    /// <summary>
    /// Check if token is active (not expired and not revoked)
    /// </summary>
    public bool IsActive()
    {
        return !IsExpired() && RevokedAt == null;
    }

    /// <summary>
    /// Revoke the token
    /// </summary>
    public void Revoke(string? replacedByToken = null)
    {
        if (RevokedAt.HasValue)
            throw new InvalidOperationException("توکن قبلاً باطل شده است");

        RevokedAt = DateTime.UtcNow;
        ReplacedByToken = replacedByToken;
    }
}
