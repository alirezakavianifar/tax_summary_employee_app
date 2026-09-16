using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TaxSummary.Application.DTOs.TaxFinalityStage;
using TaxSummary.Application.Services;
using TaxSummary.Domain.Common;
using TaxSummary.Domain.Entities;
using TaxSummary.Infrastructure.Data;

namespace TaxSummary.Infrastructure.Services;

/// <summary>
/// Service implementation for managing configurable tax finality stages
/// </summary>
public class FinalityStageService : IFinalityStageService
{
    private readonly TaxSummaryDbContext _context;
    private readonly ILogger<FinalityStageService> _logger;

    public FinalityStageService(TaxSummaryDbContext context, ILogger<FinalityStageService> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<Result<IEnumerable<FinalityStageDto>>> GetActiveAsync(CancellationToken ct = default)
    {
        try
        {
            var stages = await _context.FinalityStages
                .AsNoTracking()
                .Where(t => t.IsActive)
                .OrderBy(t => t.DisplayOrder)
                .ThenBy(t => t.Id)
                .Select(t => new FinalityStageDto
                {
                    Id = t.Id,
                    Code = t.Code,
                    Title = t.Title,
                    Description = t.Description,
                    IsActive = t.IsActive,
                    DisplayOrder = t.DisplayOrder,
                    IsSystem = t.IsSystem
                })
                .ToListAsync(ct);

            return Result.Success<IEnumerable<FinalityStageDto>>(stages);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve active finality stages");
            return Result.Failure<IEnumerable<FinalityStageDto>>("خطا در بارگذاری فهرست مراحل قطعیت");
        }
    }

    public async Task<Result<IEnumerable<FinalityStageDto>>> GetAllForManagementAsync(CancellationToken ct = default)
    {
        try
        {
            var stages = await _context.FinalityStages
                .AsNoTracking()
                .OrderBy(t => t.DisplayOrder)
                .ThenBy(t => t.Id)
                .Select(t => new FinalityStageDto
                {
                    Id = t.Id,
                    Code = t.Code,
                    Title = t.Title,
                    Description = t.Description,
                    IsActive = t.IsActive,
                    DisplayOrder = t.DisplayOrder,
                    IsSystem = t.IsSystem
                })
                .ToListAsync(ct);

            return Result.Success<IEnumerable<FinalityStageDto>>(stages);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve all finality stages for management");
            return Result.Failure<IEnumerable<FinalityStageDto>>("خطا در بارگذاری فهرست کامل مراحل قطعیت");
        }
    }

    public async Task<Result<FinalityStageDto>> GetByIdAsync(int id, CancellationToken ct = default)
    {
        try
        {
            var t = await _context.FinalityStages.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
            if (t == null)
                return Result.Failure<FinalityStageDto>("مرحله قطعیت یافت نشد");

            return Result.Success(new FinalityStageDto
            {
                Id = t.Id,
                Code = t.Code,
                Title = t.Title,
                Description = t.Description,
                IsActive = t.IsActive,
                DisplayOrder = t.DisplayOrder,
                IsSystem = t.IsSystem
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve finality stage with id {Id}", id);
            return Result.Failure<FinalityStageDto>($"خطا در دریافت مرحله قطعیت: {ex.Message}");
        }
    }

    public async Task<Result<FinalityStageDto>> CreateAsync(CreateFinalityStageDto dto, CancellationToken ct = default)
    {
        try
        {
            if (dto == null)
                return Result.Failure<FinalityStageDto>("اطلاعات درخواست الزامی است");

            if (string.IsNullOrWhiteSpace(dto.Title))
                return Result.Failure<FinalityStageDto>("عنوان مرحله قطعیت نمی‌تواند خالی باشد");

            var code = !string.IsNullOrWhiteSpace(dto.Code)
                ? dto.Code.Trim()
                : $"CustomStage_{DateTime.UtcNow.Ticks}";

            var exists = await _context.FinalityStages.AnyAsync(x => x.Code.ToLower() == code.ToLower(), ct);
            if (exists)
                return Result.Failure<FinalityStageDto>("کد شناسه این مرحله قطعیت تکراری است");

            var maxId = await _context.FinalityStages.AnyAsync(ct)
                ? await _context.FinalityStages.MaxAsync(x => x.Id, ct)
                : 0;

            var newId = Math.Max(maxId + 1, 10);

            var entity = TaxFinalityStage.Create(
                newId,
                code,
                dto.Title.Trim(),
                dto.Description?.Trim(),
                isActive: true,
                displayOrder: dto.DisplayOrder > 0 ? dto.DisplayOrder : newId,
                isSystem: false);

            _context.FinalityStages.Add(entity);
            await _context.SaveChangesAsync(ct);

            return Result.Success(new FinalityStageDto
            {
                Id = entity.Id,
                Code = entity.Code,
                Title = entity.Title,
                Description = entity.Description,
                IsActive = entity.IsActive,
                DisplayOrder = entity.DisplayOrder,
                IsSystem = entity.IsSystem
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create finality stage");
            return Result.Failure<FinalityStageDto>($"خطا در ایجاد مرحله قطعیت: {ex.Message}");
        }
    }

    public async Task<Result<FinalityStageDto>> UpdateAsync(int id, UpdateFinalityStageDto dto, CancellationToken ct = default)
    {
        try
        {
            var entity = await _context.FinalityStages.FirstOrDefaultAsync(x => x.Id == id, ct);
            if (entity == null)
                return Result.Failure<FinalityStageDto>("مرحله قطعیت یافت نشد");

            entity.Update(dto.Title, dto.Description, dto.IsActive, dto.DisplayOrder);
            await _context.SaveChangesAsync(ct);

            return Result.Success(new FinalityStageDto
            {
                Id = entity.Id,
                Code = entity.Code,
                Title = entity.Title,
                Description = entity.Description,
                IsActive = entity.IsActive,
                DisplayOrder = entity.DisplayOrder,
                IsSystem = entity.IsSystem
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update finality stage with id {Id}", id);
            return Result.Failure<FinalityStageDto>($"خطا در بروزرسانی مرحله قطعیت: {ex.Message}");
        }
    }

    public async Task<Result> DeleteAsync(int id, CancellationToken ct = default)
    {
        try
        {
            var entity = await _context.FinalityStages.FirstOrDefaultAsync(x => x.Id == id, ct);
            if (entity == null)
                return Result.Failure("مرحله قطعیت یافت نشد");

            if (entity.IsSystem)
                return Result.Failure("امکان حذف مراحل قطعیت پیش‌فرض و سیستمی وجود ندارد. می‌توانید آن را غیرفعال نمایید.");

            // Check if used in any tax refund cases
            var inUse = await _context.TaxRefundCases.AnyAsync(c => (int)c.AssessmentInfo.FinalityStage == id, ct);
            if (inUse)
                return Result.Failure("این مرحله قطعیت در پرونده‌های استرداد ثبت‌شده مورد استفاده قرار گرفته و قابل حذف نیست. می‌توانید وضعیت آن را غیرفعال نمایید.");

            _context.FinalityStages.Remove(entity);
            await _context.SaveChangesAsync(ct);

            return Result.Success();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete finality stage with id {Id}", id);
            return Result.Failure($"خطا در حذف مرحله قطعیت: {ex.Message}");
        }
    }

    public async Task<Result> ReorderAsync(IEnumerable<FinalityStageOrderDto> items, CancellationToken ct = default)
    {
        try
        {
            if (items == null)
                return Result.Failure("اطلاعات ترتیب ارسال نشده است");

            var orderList = items.ToList();
            if (orderList.Count == 0)
                return Result.Success();

            var ids = orderList.Select(x => x.Id).ToList();
            var entities = await _context.FinalityStages.Where(x => ids.Contains(x.Id)).ToListAsync(ct);
            var orderMap = orderList.ToDictionary(x => x.Id, x => x.DisplayOrder);

            foreach (var entity in entities)
            {
                if (orderMap.TryGetValue(entity.Id, out var newOrder))
                {
                    entity.Update(entity.Title, entity.Description, entity.IsActive, newOrder);
                }
            }

            await _context.SaveChangesAsync(ct);
            return Result.Success();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to reorder finality stages");
            return Result.Failure($"خطا در بروزرسانی ترتیب مراحل قطعیت: {ex.Message}");
        }
    }
}
