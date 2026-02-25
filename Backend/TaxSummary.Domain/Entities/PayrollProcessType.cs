namespace TaxSummary.Domain.Entities;

/// <summary>
/// Constants for payroll process types
/// </summary>
public static class PayrollProcessType
{
    public const string OvertimeWelfareRated = "OvertimeWelfareRated";
    public const string OvertimeWelfareMonetary = "OvertimeWelfareMonetary";
    public const string HalfPercentBonus = "HalfPercentBonus";

    public static readonly IReadOnlyList<string> All = new[]
    {
        OvertimeWelfareRated,
        OvertimeWelfareMonetary,
        HalfPercentBonus
    };

    public static bool IsValid(string processType) => All.Contains(processType);
}
