using TaxSummary.Domain.Common;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Domain.Interfaces;

/// <summary>
/// Repository interface for user operations
/// </summary>
public interface IUserRepository
{
    /// <summary>
    /// Get user by ID
    /// </summary>
    Task<Result<User>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get user by username
    /// </summary>
    Task<Result<User>> GetByUsernameAsync(string username, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get user by email
    /// </summary>
    Task<Result<User>> GetByEmailAsync(string email, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get all users
    /// </summary>
    Task<Result<IEnumerable<User>>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Create a new user
    /// </summary>
    Task<Result<Guid>> CreateAsync(User user, CancellationToken cancellationToken = default);

    /// <summary>
    /// Update an existing user
    /// </summary>
    Task<Result> UpdateAsync(User user, CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete a user
    /// </summary>
    Task<Result> DeleteAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get refresh token by token hash
    /// </summary>
    Task<Result<RefreshToken>> GetRefreshTokenAsync(string tokenHash, CancellationToken cancellationToken = default);

    /// <summary>
    /// Save a new refresh token
    /// </summary>
    Task<Result> SaveRefreshTokenAsync(RefreshToken token, CancellationToken cancellationToken = default);

    /// <summary>
    /// Revoke a refresh token
    /// </summary>
    Task<Result> RevokeRefreshTokenAsync(string tokenHash, string? replacedByToken = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Revoke all refresh tokens for a user
    /// </summary>
    Task<Result> RevokeAllUserTokensAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if username already exists
    /// </summary>
    Task<bool> UsernameExistsAsync(string username, CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if email already exists
    /// </summary>
    Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default);
}
