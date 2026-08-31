namespace TaxSummary.Domain.Entities;

/// <summary>
/// Represents a department partition/sheet within a payroll cycle
/// </summary>
public class PayrollDepartmentEntry
{
    public Guid Id { get; private set; }
    public Guid PayrollCycleId { get; private set; }
    public string DepartmentName { get; private set; } = string.Empty;
    public string Status { get; private set; } = PayrollDepartmentStatus.Pending;

    // Caps / base coefficients for this department
    public double? BaseOvertimeCap { get; private set; }
    public double? BaseWelfareCap { get; private set; }
    public double? BaseBonusCap { get; private set; }

    public Guid? SubmittedByUserId { get; private set; }
    public DateTime? SubmittedAt { get; private set; }

    public Guid? ApprovedByUserId { get; private set; }
    public DateTime? ApprovedAt { get; private set; }

    public string? RejectionReason { get; private set; }
    public string? Notes { get; private set; }

    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    // Navigation properties
    public PayrollCycle? PayrollCycle { get; private set; }
    public User? SubmittedBy { get; private set; }
    public User? ApprovedBy { get; private set; }
    public ICollection<PayrollEmployeeItem> Items { get; private set; } = new List<PayrollEmployeeItem>();

    private PayrollDepartmentEntry() { }

    public static PayrollDepartmentEntry Create(
        Guid payrollCycleId,
        string departmentName,
        double? baseOvertimeCap = null,
        double? baseWelfareCap = null,
        double? baseBonusCap = null)
    {
        if (string.IsNullOrWhiteSpace(departmentName))
            throw new ArgumentException("نام اداره نمی‌تواند خالی باشد", nameof(departmentName));

        var now = DateTime.UtcNow;
        return new PayrollDepartmentEntry
        {
            Id = Guid.NewGuid(),
            PayrollCycleId = payrollCycleId,
            DepartmentName = departmentName.Trim(),
            Status = PayrollDepartmentStatus.Pending,
            BaseOvertimeCap = baseOvertimeCap,
            BaseWelfareCap = baseWelfareCap,
            BaseBonusCap = baseBonusCap,
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    public void SaveDraft(string? notes = null)
    {
        if (Status != PayrollDepartmentStatus.Approved)
        {
            Status = PayrollDepartmentStatus.Draft;
        }
        Notes = notes?.Trim() ?? Notes;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Submit(Guid submittedByUserId, string? notes = null)
    {
        Status = PayrollDepartmentStatus.Submitted;
        SubmittedByUserId = submittedByUserId;
        SubmittedAt = DateTime.UtcNow;
        RejectionReason = null;
        if (!string.IsNullOrWhiteSpace(notes))
        {
            Notes = notes.Trim();
        }
        UpdatedAt = DateTime.UtcNow;
    }

    public void Approve(Guid approvedByUserId)
    {
        Status = PayrollDepartmentStatus.Approved;
        ApprovedByUserId = approvedByUserId;
        ApprovedAt = DateTime.UtcNow;
        RejectionReason = null;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Reject(string reason)
    {
        if (string.IsNullOrWhiteSpace(reason))
            throw new ArgumentException("دلیل عدم تایید الزامی است", nameof(reason));

        Status = PayrollDepartmentStatus.Rejected;
        RejectionReason = reason.Trim();
        ApprovedByUserId = null;
        ApprovedAt = null;
        UpdatedAt = DateTime.UtcNow;
    }
}
