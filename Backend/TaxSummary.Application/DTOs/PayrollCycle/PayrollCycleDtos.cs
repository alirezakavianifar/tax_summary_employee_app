namespace TaxSummary.Application.DTOs.PayrollCycle;

public class PayrollCycleSummaryDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ProcessType { get; set; } = string.Empty;
    public int FiscalYear { get; set; }
    public int FiscalMonth { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? Deadline { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedByUsername { get; set; } = string.Empty;
    public int TotalDepartments { get; set; }
    public int SubmittedDepartments { get; set; }
    public int ApprovedDepartments { get; set; }
    public int TotalEmployees { get; set; }
    public double TotalOvertimeAmount { get; set; }
    public double TotalWelfareAmount { get; set; }
    public double TotalBonusAmount { get; set; }
}

public class PayrollCycleDetailDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ProcessType { get; set; } = string.Empty;
    public int FiscalYear { get; set; }
    public int FiscalMonth { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? Deadline { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedByUsername { get; set; } = string.Empty;
    public DateTime? FinalizedAt { get; set; }
    public string? FinalizedByUsername { get; set; }
    public List<PayrollDepartmentEntrySummaryDto> DepartmentEntries { get; set; } = new();
}

public class PayrollDepartmentEntrySummaryDto
{
    public Guid Id { get; set; }
    public Guid PayrollCycleId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public double? BaseOvertimeCap { get; set; }
    public double? BaseWelfareCap { get; set; }
    public double? BaseBonusCap { get; set; }
    public int EmployeeCount { get; set; }
    public double TotalOvertimeAmount { get; set; }
    public double TotalWelfareAmount { get; set; }
    public double TotalBonusAmount { get; set; }
    public string? SubmittedByUsername { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public string? ApprovedByUsername { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }
    public string? Notes { get; set; }
}

public class PayrollDepartmentEntryDto
{
    public Guid Id { get; set; }
    public Guid PayrollCycleId { get; set; }
    public string CycleTitle { get; set; } = string.Empty;
    public string ProcessType { get; set; } = string.Empty;
    public string CycleStatus { get; set; } = string.Empty;
    public DateTime? CycleDeadline { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public double? BaseOvertimeCap { get; set; }
    public double? BaseWelfareCap { get; set; }
    public double? BaseBonusCap { get; set; }
    public string? SubmittedByUsername { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public string? ApprovedByUsername { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }
    public string? Notes { get; set; }
    public int EmployeeCount { get; set; }
    public double TotalOvertimeAmount { get; set; }
    public double TotalWelfareAmount { get; set; }
    public double TotalBonusAmount { get; set; }
    public List<PayrollEmployeeItemDto> Items { get; set; } = new();
}

public class PayrollEmployeeItemDto
{
    public Guid Id { get; set; }
    public Guid DepartmentEntryId { get; set; }
    public string PersonnelNumber { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public double? InitialOvertimeRate { get; set; }
    public double? AdjustedOvertimeRate { get; set; }
    public double? InitialWelfareRate { get; set; }
    public double? AdjustedWelfareRate { get; set; }
    public double? BaseOvertimeAmount { get; set; }
    public double? BaseWelfareAmount { get; set; }
    public double? BaseBonusAmount { get; set; }
    public long? CalculatedOvertimeAmount { get; set; }
    public long? CalculatedWelfareAmount { get; set; }
    public string? OfficerNotes { get; set; }
    public bool IsExcluded { get; set; }
}

public class SaveDepartmentDraftDto
{
    public string? Notes { get; set; }
    public List<UpdateEmployeeItemAdjustmentDto> Items { get; set; } = new();
}

public class UpdateEmployeeItemAdjustmentDto
{
    public Guid Id { get; set; }
    public double? AdjustedOvertimeRate { get; set; }
    public double? AdjustedWelfareRate { get; set; }
    public string? OfficerNotes { get; set; }
    public bool IsExcluded { get; set; }
}

public class SubmitDepartmentDto
{
    public string? Notes { get; set; }
    public List<UpdateEmployeeItemAdjustmentDto>? Items { get; set; }
}

public class ReviewDepartmentDto
{
    public bool Approve { get; set; }
    public string? RejectionReason { get; set; }
}
