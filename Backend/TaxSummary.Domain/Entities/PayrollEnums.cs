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
    public const string Approved = "Approved";
    public const string Rejected = "Rejected";
}
