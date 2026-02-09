using TaxSummary.Domain.Common;

namespace TaxSummary.Domain.ValueObjects;

/// <summary>
/// Value Object representing a Personnel Number with validation
/// </summary>
public class PersonnelNumber : ValueObject
{
    public string Value { get; private set; }

    private PersonnelNumber(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("Personnel number cannot be empty", nameof(value));

        if (value.Length > 50)
            throw new ArgumentException("Personnel number cannot exceed 50 characters", nameof(value));

        Value = value.Trim();
    }

    public static PersonnelNumber Create(string value) => new(value);

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }

    public override string ToString() => Value;

    public static implicit operator string(PersonnelNumber personnelNumber) => personnelNumber.Value;
}
