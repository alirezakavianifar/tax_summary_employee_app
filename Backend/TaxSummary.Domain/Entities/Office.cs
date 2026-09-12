namespace TaxSummary.Domain.Entities;

/// <summary>
/// Represents an organizational tax office or service department
/// </summary>
public class Office
{
    public Guid Id { get; private set; }

    /// <summary>
    /// Unique code identifying the office (e.g. "1601", "1602")
    /// </summary>
    public string Code { get; private set; } = string.Empty;

    /// <summary>
    /// Display name of the office (e.g. "اداره امور مالیاتی ۱۶۰۱")
    /// </summary>
    public string Name { get; private set; } = string.Empty;

    /// <summary>
    /// Optional description or notes
    /// </summary>
    public string? Description { get; private set; }

    /// <summary>
    /// Whether this office is currently active
    /// </summary>
    public bool IsActive { get; private set; }

    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    // Navigation Properties
    public ICollection<UserOffice> UserOffices { get; private set; } = new List<UserOffice>();
    public ICollection<Employee> Employees { get; private set; } = new List<Employee>();

    private Office() { }

    public static Office Create(string code, string name, string? description = null)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new ArgumentException("کد اداره نمی‌تواند خالی باشد", nameof(code));

        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("نام اداره نمی‌تواند خالی باشد", nameof(name));

        var now = DateTime.UtcNow;
        return new Office
        {
            Id = Guid.NewGuid(),
            Code = code.Trim(),
            Name = name.Trim(),
            Description = description?.Trim(),
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    public void Update(string name, string? description, bool isActive)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("نام اداره نمی‌تواند خالی باشد", nameof(name));

        Name = name.Trim();
        Description = description?.Trim();
        IsActive = isActive;
        UpdatedAt = DateTime.UtcNow;
    }
}
