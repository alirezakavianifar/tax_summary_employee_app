using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Domain.Common;

namespace TaxSummary.Application.Services.Reporting;

/// <summary>
/// Service interface for managing report categories and domain sources
/// مدیریت حوزه‌ها و دسته‌بندی‌های موضوعی گزارش‌ها
/// </summary>
public interface IReportCategoryService
{
    Task<Result<IEnumerable<ReportCategoryDto>>> GetActiveCategoriesAsync(CancellationToken ct = default);
    Task<Result<IEnumerable<ReportCategoryDto>>> GetAllForManagementAsync(CancellationToken ct = default);
    Task<Result<ReportCategoryDto>> GetByIdAsync(int id, CancellationToken ct = default);
    Task<Result<ReportCategoryDto>> CreateAsync(CreateReportCategoryDto dto, CancellationToken ct = default);
    Task<Result<ReportCategoryDto>> UpdateAsync(int id, UpdateReportCategoryDto dto, CancellationToken ct = default);
    Task<Result> DeleteAsync(int id, CancellationToken ct = default);
    Task<Result<ReportCategoryDto>> ToggleStatusAsync(int id, CancellationToken ct = default);
    Task<bool> IsActiveCategoryAsync(int id, CancellationToken ct = default);
}
