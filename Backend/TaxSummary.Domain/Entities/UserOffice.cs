namespace TaxSummary.Domain.Entities;

/// <summary>
/// Join entity representing the many-to-many relationship between User and Office
/// </summary>
public class UserOffice
{
    public Guid UserId { get; private set; }
    public User User { get; private set; } = null!;

    public Guid OfficeId { get; private set; }
    public Office Office { get; private set; } = null!;

    public DateTime AssignedAt { get; private set; }

    private UserOffice() { }

    public static UserOffice Create(Guid userId, Guid officeId, Office? office = null)
    {
        return new UserOffice
        {
            UserId = userId,
            OfficeId = officeId,
            Office = office!,
            AssignedAt = DateTime.UtcNow
        };
    }
}
