using TaxSummary.Domain.Common;

namespace TaxSummary.Domain.ValueObjects;

/// <summary>
/// Value object representing performance capability metrics (quantity and amount)
/// </summary>
public class CapabilityMetrics : ValueObject
{
    public int Quantity { get; private set; }  // تعداد
    public decimal Amount { get; private set; }  // مبلغ

    private CapabilityMetrics() { }

    /// <summary>
    /// Creates a new CapabilityMetrics instance
    /// </summary>
    public static CapabilityMetrics Create(int quantity, decimal amount)
    {
        if (quantity < 0)
            throw new ArgumentException("Quantity cannot be negative", nameof(quantity));
        
        if (amount < 0)
            throw new ArgumentException("Amount cannot be negative", nameof(amount));

        return new CapabilityMetrics
        {
            Quantity = quantity,
            Amount = amount
        };
    }

    /// <summary>
    /// Creates an empty metrics instance with zero values
    /// </summary>
    public static CapabilityMetrics Empty() => new() { Quantity = 0, Amount = 0 };

    /// <summary>
    /// Checks if this metrics instance has any value
    /// </summary>
    public bool HasValue() => Quantity > 0 || Amount > 0;

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Quantity;
        yield return Amount;
    }

    public override string ToString() => $"تعداد: {Quantity}, مبلغ: {Amount:N0} ریال";
}
