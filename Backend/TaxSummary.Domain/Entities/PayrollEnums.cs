namespace TaxSummary.Domain.Entities;

public static class PayrollCycleStatus
{
    public const string Draft = "Draft";
    public const string OpenForSubmission = "OpenForSubmission";
    public const string UnderReview = "UnderReview";
    public const string Finalized = "Finalized";
    public const string Archived = "Archived";
}

public static class PayrollDepartmentStatus
{
    public const string Pending = "Pending";
    public const string Draft = "Draft";
    public const string Submitted = "Submitted";
    public const string DeputyApproved = "DeputyApproved";
    public const string Approved = "Approved";
    public const string Rejected = "Rejected";
}

public static class PositionTier
{
    public const string GroupHead = "GroupHead";
    public const string SeniorExpert = "SeniorExpert";
    public const string OtherStaff = "OtherStaff";

    public static string GetDisplayName(string? tier) => tier switch
    {
        GroupHead => "رئیس / سرپرست گروه",
        SeniorExpert => "کارشناس ارشد",
        _ => "سایر کارکنان"
    };
}

public static class PayrollBusinessRules
{
    public const double MaxWelfarePercentage = 100.0;
    public const double MaxOvertimeHoursStandard = 175.0;
    public const double MaxOvertimeHoursLabor = 120.0;
}

