using System.Numerics;
using System.Text.RegularExpressions;
using TaxSummary.Domain.Common;

namespace TaxSummary.Domain.ValueObjects;

/// <summary>
/// Value Object representing an Iranian Sheba (IBAN) bank account number.
/// Format: IR + 24 digits with ISO 7064 MOD-97 checksum validation.
/// شماره شبا بانکی
/// </summary>
public class ShebaNumber : ValueObject
{
    private static readonly Regex ShebaRegex = new(@"^[a-zA-Z]{2}\d{24}$", RegexOptions.Compiled);

    public string Value { get; private set; }

    private ShebaNumber(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("شماره شبا نمی‌تواند خالی باشد", nameof(value));

        var normalized = value.Trim().Replace(" ", "").Replace("-", "").ToUpperInvariant();

        if (!normalized.StartsWith("IR"))
            throw new ArgumentException("شماره شبا باید با پیشوند IR آغاز شود", nameof(value));

        if (normalized.Length != 26)
            throw new ArgumentException($"طول شماره شبا نامعتبر است ({normalized.Length} کاراکتر به جای ۲۶ کاراکتر)", nameof(value));

        if (!ShebaRegex.IsMatch(normalized))
            throw new ArgumentException("فرمت شماره شبا نامعتبر است و باید شامل IR و ۲۴ رقم باشد", nameof(value));

        if (!ValidateIso7064Mod97(normalized))
            throw new ArgumentException("کد کنترلی شماره شبا نامعتبر است (خطای اعتبارسنجی الگوریتم بین‌المللی شبا)", nameof(value));

        Value = normalized;
    }

    /// <summary>
    /// Creates a verified ShebaNumber with standard ISO 7064 MOD-97 validation.
    /// </summary>
    public static ShebaNumber Create(string value) => new(value);

    /// <summary>
    /// Factory for testing or legacy cases that bypasses strict ISO 7064 checksum.
    /// </summary>
    public static ShebaNumber CreateWithoutChecksum(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("شماره شبا نمی‌تواند خالی باشد", nameof(value));

        var normalized = value.Trim().Replace(" ", "").Replace("-", "").ToUpperInvariant();
        if (!normalized.StartsWith("IR"))
            throw new ArgumentException("شماره شبا باید با پیشوند IR آغاز شود", nameof(value));

        return new ShebaNumber(normalized, bypassChecksum: true);
    }

    private ShebaNumber(string normalized, bool bypassChecksum)
    {
        if (bypassChecksum)
        {
            Value = normalized;
            return;
        }
        Value = normalized;
    }

    /// <summary>
    /// Validates an IBAN using ISO 7064 MOD-97-10.
    /// </summary>
    public static bool ValidateIso7064Mod97(string iban)
    {
        if (string.IsNullOrWhiteSpace(iban) || iban.Length != 26)
            return false;

        var rearranged = iban[4..] + iban[..4];
        var sb = new System.Text.StringBuilder();

        foreach (var ch in rearranged)
        {
            if (char.IsDigit(ch))
            {
                sb.Append(ch);
            }
            else if (char.IsLetter(ch))
            {
                var num = char.ToUpperInvariant(ch) - 'A' + 10;
                sb.Append(num);
            }
            else
            {
                return false;
            }
        }

        if (BigInteger.TryParse(sb.ToString(), out var bigInt))
        {
            return (bigInt % 97) == 1;
        }

        return false;
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }

    public override string ToString() => Value;

    public static implicit operator string(ShebaNumber sheba) => sheba.Value;
}
