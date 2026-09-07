using System.Text.RegularExpressions;
using TaxSummary.Domain.Common;

namespace TaxSummary.Domain.ValueObjects;

/// <summary>
/// Value Object representing an Iranian Economic Code (شماره اقتصادی مودی مالیاتی).
/// Typically 10 to 12 digits.
/// </summary>
public class EconomicCode : ValueObject
{
    private static readonly Regex EconomicCodeRegex = new(@"^\d{10,14}$", RegexOptions.Compiled);

    public string Value { get; private set; }

    private EconomicCode(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("شماره اقتصادی نمی‌تواند خالی باشد", nameof(value));

        var normalized = NormalizeDigits(value.Trim().Replace("-", "").Replace(" ", ""));

        if (!EconomicCodeRegex.IsMatch(normalized))
            throw new ArgumentException($"شماره اقتصادی نامعتبر است ({normalized}). شماره اقتصادی باید عددی بین ۱۰ تا ۱۴ رقم باشد", nameof(value));

        Value = normalized;
    }

    public static EconomicCode Create(string value) => new(value);

    /// <summary>
    /// Converts Persian and Arabic unicode digits to standard ASCII digits.
    /// </summary>
    public static string NormalizeDigits(string input)
    {
        if (string.IsNullOrEmpty(input))
            return string.Empty;

        return input
            .Replace('۰', '0').Replace('۱', '1').Replace('۲', '2').Replace('۳', '3').Replace('۴', '4')
            .Replace('۵', '5').Replace('۶', '6').Replace('۷', '7').Replace('۸', '8').Replace('۹', '9')
            .Replace('٠', '0').Replace('١', '1').Replace('٢', '2').Replace('٣', '3').Replace('٤', '4')
            .Replace('٥', '5').Replace('٦', '6').Replace('٧', '7').Replace('٨', '8').Replace('٩', '9');
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }

    public override string ToString() => Value;

    public static implicit operator string(EconomicCode economicCode) => economicCode.Value;
}
