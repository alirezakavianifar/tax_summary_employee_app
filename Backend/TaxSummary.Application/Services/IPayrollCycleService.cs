using TaxSummary.Application.DTOs.PayrollCycle;

namespace TaxSummary.Application.Services;

public interface IPayrollCycleService
{
    Task<PayrollCycleSummaryDto> CreateCycleAsync(
        string title,
        string processType,
        int fiscalYear,
        int fiscalMonth,
        Guid userId,
        DateTime? deadline,
        string? notes,
        Stream? ezafe,
        Stream? refahi,
        Stream? coefficients,
        Stream? deptMapping,
        Stream? nim,
        CancellationToken cancellationToken = default);

    Task<IEnumerable<PayrollCycleSummaryDto>> GetCyclesAsync(CancellationToken cancellationToken = default);

    Task<PayrollCycleDetailDto?> GetCycleByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<PayrollDepartmentEntryDto?> GetDepartmentEntryByIdAsync(
        Guid departmentEntryId,
        Guid currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default);

    Task<IEnumerable<PayrollDepartmentEntrySummaryDto>> GetDepartmentEntriesForOfficerAsync(
        Guid currentUserId,
        CancellationToken cancellationToken = default);

    Task<PayrollDepartmentEntryDto> SaveDepartmentDraftAsync(
        Guid departmentEntryId,
        SaveDepartmentDraftDto dto,
        Guid currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default);

    Task<PayrollDepartmentEntryDto> SubmitDepartmentAsync(
        Guid departmentEntryId,
        SubmitDepartmentDto dto,
        Guid currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default);

    Task<PayrollDepartmentEntryDto> ReviewDepartmentAsync(
        Guid departmentEntryId,
        ReviewDepartmentDto dto,
        Guid adminUserId,
        CancellationToken cancellationToken = default);

    Task<PayrollCycleDetailDto> FinalizeCycleAsync(
        Guid cycleId,
        Guid adminUserId,
        CancellationToken cancellationToken = default);

    Task DeleteCycleAsync(
        Guid cycleId,
        Guid adminUserId,
        CancellationToken cancellationToken = default);

    Task<byte[]> ExportDepartmentExcelAsync(
        Guid departmentEntryId,
        CancellationToken cancellationToken = default);

    Task<PayrollDepartmentEntryDto> ImportDepartmentExcelAsync(
        Guid departmentEntryId,
        Stream excelStream,
        Guid currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default);

    Task<byte[]> ExportMasterExcelAsync(
        Guid cycleId,
        CancellationToken cancellationToken = default);
}
