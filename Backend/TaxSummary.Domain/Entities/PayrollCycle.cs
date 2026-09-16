namespace TaxSummary.Domain.Entities;

/// <summary>
/// Represents a collaborative monthly/periodic payroll processing cycle
/// </summary>
public class PayrollCycle
{
    public Guid Id { get; private set; }
    public string CycleCode { get; private set; } = string.Empty;
    public string Title { get; private set; } = string.Empty;
    public string ProcessType { get; private set; } = string.Empty;
    public int FiscalYear { get; private set; }
    public int FiscalMonth { get; private set; }
    public string Status { get; private set; } = PayrollCycleStatus.Draft;
    public DateTime? Deadline { get; private set; }
    public string? Notes { get; private set; }
    public Guid CreatedByUserId { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }
    public DateTime? FinalizedAt { get; private set; }
    public Guid? FinalizedByUserId { get; private set; }

    // Navigation properties
    public User? CreatedBy { get; private set; }
    public User? FinalizedBy { get; private set; }
    public ICollection<PayrollDepartmentEntry> DepartmentEntries { get; private set; } = new List<PayrollDepartmentEntry>();

    private PayrollCycle() { }

    public static PayrollCycle Create(
        string title,
        string processType,
        int fiscalYear,
        int fiscalMonth,
        Guid createdByUserId,
        DateTime? deadline = null,
        string? notes = null,
        string? cycleCode = null)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("عنوان دوره نمی‌تواند خالی باشد", nameof(title));
        if (string.IsNullOrWhiteSpace(processType))
            throw new ArgumentException("نوع فرآیند نمی‌تواند خالی باشد", nameof(processType));

        var now = DateTime.UtcNow;
        return new PayrollCycle
        {
            Id = Guid.NewGuid(),
            CycleCode = cycleCode?.Trim() ?? string.Empty,
            Title = title.Trim(),
            ProcessType = processType.Trim(),
            FiscalYear = fiscalYear,
            FiscalMonth = fiscalMonth,
            Status = PayrollCycleStatus.Draft,
            Deadline = deadline,
            Notes = notes?.Trim(),
            CreatedByUserId = createdByUserId,
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    public void SetCycleCode(string cycleCode)
    {
        CycleCode = cycleCode?.Trim() ?? string.Empty;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateStatus(string status)
    {
        Status = status;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SendToOffices()
    {
        if (Status != PayrollCycleStatus.Draft)
            throw new InvalidOperationException("تنها دوره‌هایی که در وضعیت پیش‌نویس هستند امکان ارسال به ادارات را دارند.");

        Status = PayrollCycleStatus.OpenForSubmission;
        UpdatedAt = DateTime.UtcNow;
    }

    public void FinalizeCycle(Guid finalizedByUserId)
    {
        Status = PayrollCycleStatus.Finalized;
        FinalizedByUserId = finalizedByUserId;
        FinalizedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void ReopenCycle()
    {
        Status = PayrollCycleStatus.OpenForSubmission;
        FinalizedAt = null;
        FinalizedByUserId = null;
        UpdatedAt = DateTime.UtcNow;
    }
}
