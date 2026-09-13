using System.Text.RegularExpressions;
using TaxSummary.Domain.Common;

namespace TaxSummary.Domain.ValueObjects;

/// <summary>
/// Represents the 3-tier organizational tax hierarchy in the Iranian Tax System:
/// Level 1: Office (اداره امور مالیاتی) - e.g. 160200 (Presided by رئیس امور)
/// Level 2: Audit Group (گروه رسیدگی مالیاتی) - e.g. 160210 (Presided by رئیس گروه)
/// Level 3: Tax Unit (واحد مالیاتی) - e.g. 160211 (Presided by کارشناس ارشد مالیاتی)
/// </summary>
public class TaxHierarchy : ValueObject
{
    private static readonly Regex SixDigitRegex = new(@"^\d{6}$", RegexOptions.Compiled);

    public string TaxUnitCode { get; private set; } = string.Empty;
    public string GroupCode { get; private set; } = string.Empty;
    public string OfficeCode { get; private set; } = string.Empty;

    public int? GroupIndex { get; private set; }
    public int? UnitIndex { get; private set; }

    /// <summary>
    /// Indicates whether the tax unit code decomposed into a standard 6-digit hierarchy
    /// </summary>
    public bool IsValid => !string.IsNullOrWhiteSpace(TaxUnitCode) && SixDigitRegex.IsMatch(TaxUnitCode);

    private TaxHierarchy() { }

    private TaxHierarchy(string taxUnitCode, string groupCode, string officeCode, int? groupIndex = null, int? unitIndex = null)
    {
        TaxUnitCode = taxUnitCode;
        GroupCode = groupCode;
        OfficeCode = officeCode;
        GroupIndex = groupIndex;
        UnitIndex = unitIndex;
    }

    /// <summary>
    /// Decomposes any tax unit code into its hierarchical Office (Level 1), Group (Level 2), and Unit (Level 3)
    /// </summary>
    public static TaxHierarchy FromTaxUnitCode(string? code) => Decompose(code);

    public static TaxHierarchy Decompose(string? code)
    {
        if (string.IsNullOrWhiteSpace(code))
            return new TaxHierarchy(string.Empty, string.Empty, string.Empty);

        var normalized = NormalizeDigits(code.Trim().Replace("-", "").Replace(" ", ""));

        if (SixDigitRegex.IsMatch(normalized))
        {
            var officePrefix = normalized.Substring(0, 4);
            var groupDigit = normalized[4];
            var unitDigit = normalized[5];

            var officeCode = $"{officePrefix}00";
            var groupCode = $"{officePrefix}{groupDigit}0";
            var unitCode = normalized;

            int.TryParse(groupDigit.ToString(), out var gIndex);
            int.TryParse(unitDigit.ToString(), out var uIndex);

            return new TaxHierarchy(unitCode, groupCode, officeCode, gIndex, uIndex);
        }

        if (normalized.Length == 5 && int.TryParse(normalized, out _))
        {
            var officePrefix = normalized.Substring(0, 4);
            var groupDigit = normalized[4];
            var officeCode = $"{officePrefix}00";
            var groupCode = $"{normalized}0";
            var unitCode = $"{normalized}0";

            int.TryParse(groupDigit.ToString(), out var gIndex);

            return new TaxHierarchy(unitCode, groupCode, officeCode, gIndex, 0);
        }

        if (normalized.Length == 4 && int.TryParse(normalized, out _))
        {
            var officeCode = $"{normalized}00";
            var groupCode = $"{normalized}00";
            var unitCode = $"{normalized}00";

            return new TaxHierarchy(unitCode, groupCode, officeCode, 0, 0);
        }

        // Fallback for non-standard or custom codes
        return new TaxHierarchy(normalized, normalized, normalized);
    }

    /// <summary>
    /// Checks whether an assigned user code (e.g. 160200 for Office, 160210 for Group, 160211 for Unit) covers this hierarchy.
    /// </summary>
    public bool IsCoveredBy(string? assignedCode)
    {
        if (string.IsNullOrWhiteSpace(assignedCode)) return false;

        var clean = NormalizeDigits(assignedCode.Trim().Replace("-", "").Replace(" ", ""));

        if (clean.Equals(TaxUnitCode, StringComparison.OrdinalIgnoreCase) ||
            clean.Equals(GroupCode, StringComparison.OrdinalIgnoreCase) ||
            clean.Equals(OfficeCode, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        // Office level match (e.g., assigned 160200 or 1602 covers any 1602xx)
        if (clean.Length == 6 && clean.EndsWith("00"))
        {
            var officePrefix = clean.Substring(0, 4);
            return TaxUnitCode.StartsWith(officePrefix, StringComparison.OrdinalIgnoreCase);
        }

        if (clean.Length == 4)
        {
            return TaxUnitCode.StartsWith(clean, StringComparison.OrdinalIgnoreCase);
        }

        // Group level match (e.g., assigned 160210 covers 160211 - 160219)
        if (clean.Length == 6 && clean.EndsWith("0") && !clean.EndsWith("00"))
        {
            var groupPrefix = clean.Substring(0, 5);
            return TaxUnitCode.StartsWith(groupPrefix, StringComparison.OrdinalIgnoreCase);
        }

        return false;
    }

    /// <summary>
    /// Converts Persian and Arabic unicode digits to ASCII standard digits
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
        yield return TaxUnitCode;
        yield return GroupCode;
        yield return OfficeCode;
    }
}
