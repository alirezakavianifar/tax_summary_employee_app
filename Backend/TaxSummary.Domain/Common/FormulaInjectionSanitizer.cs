namespace TaxSummary.Domain.Common;

/// <summary>
/// Sanitizer to protect against CSV/Excel Formula Injection (CWE-1236).
/// Neutralizes formulas starting with '=', '+', '-', '@', tab, or carriage return.
/// </summary>
public static class FormulaInjectionSanitizer
{
    private static readonly char[] FormulaPrefixes = { '=', '+', '-', '@', '\t', '\r' };

    /// <summary>
    /// Sanitizes string before writing to Excel spreadsheet cell.
    /// Prepends a single quote (') if the text starts with a dangerous character so spreadsheet
    /// applications treat it as literal text instead of executing it.
    /// </summary>
    public static string SanitizeForExport(string? input)
    {
        if (string.IsNullOrEmpty(input))
            return string.Empty;

        if (FormulaPrefixes.Contains(input[0]))
        {
            return "'" + input;
        }

        return input;
    }

    /// <summary>
    /// Sanitizes string read from user-uploaded Excel file.
    /// Strips leading dangerous formula prefixes so weaponized formulas are neutralized.
    /// </summary>
    public static string SanitizeForImport(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;

        var trimmed = input.Trim();

        // Strip leading formula prefixes like '=' or '@'
        while (trimmed.Length > 0 && (trimmed[0] == '=' || trimmed[0] == '@'))
        {
            trimmed = trimmed[1..].TrimStart();
        }

        return trimmed;
    }
}
