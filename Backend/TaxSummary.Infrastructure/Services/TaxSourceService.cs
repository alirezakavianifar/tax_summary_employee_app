using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TaxSummary.Application.DTOs.TaxSource;
using TaxSummary.Application.Services;
using TaxSummary.Domain.Common;
using TaxSummary.Domain.Entities;
using TaxSummary.Infrastructure.Data;

namespace TaxSummary.Infrastructure.Services;

/// <summary>
/// Service implementation for managing configurable tax sources
/// </summary>
public class TaxSourceService : ITaxSourceService
{
    private readonly TaxSummaryDbContext _context;
    private readonly ILogger<TaxSourceService> _logger;

    public TaxSourceService(TaxSummaryDbContext context, ILogger<TaxSourceService> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<Result<IEnumerable<TaxSourceDto>>> GetActiveAsync(CancellationToken ct = default)
    {
        try
        {
            var sources = await _context.TaxSources
                .AsNoTracking()
                .Where(t => t.IsActive)
                .OrderBy(t => t.DisplayOrder)
                .ThenBy(t => t.Id)
                .Select(t => new TaxSourceDto
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

            return Result.Success<IEnumerable<TaxSourceDto>>(sources);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve active tax sources");
            return Result.Failure<IEnumerable<TaxSourceDto>>("خطا در بارگذاری فهرست منابع مالیاتی");
        }
    }

    public async Task<Result<IEnumerable<TaxSourceDto>>> GetAllForManagementAsync(CancellationToken ct = default)
    {
        try
        {
            var sources = await _context.TaxSources
                .AsNoTracking()
                .OrderBy(t => t.DisplayOrder)
                .ThenBy(t => t.Id)
                .Select(t => new TaxSourceDto
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

            return Result.Success<IEnumerable<TaxSourceDto>>(sources);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve all tax sources for management");
            return Result.Failure<IEnumerable<TaxSourceDto>>("خطا در بارگذاری فهرست کامل منابع مالیاتی");
        }
    }

    public async Task<Result<TaxSourceDto>> GetByIdAsync(int id, CancellationToken ct = default)
    {
        try
        {
            var t = await _context.TaxSources.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
            if (t == null)
                return Result.Failure<TaxSourceDto>("منبع مالیاتی یافت نشد");

            return Result.Success(new TaxSourceDto
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
            _logger.LogError(ex, "Failed to retrieve tax source with id {Id}", id);
            return Result.Failure<TaxSourceDto>($"خطا در دریافت منبع مالیاتی: {ex.Message}");
        }
    }

    public async Task<Result<TaxSourceDto>> CreateAsync(CreateTaxSourceDto dto, CancellationToken ct = default)
    {
        try
        {
            if (dto == null)
                return Result.Failure<TaxSourceDto>("اطلاعات درخواست الزامی است");

            if (string.IsNullOrWhiteSpace(dto.Title))
                return Result.Failure<TaxSourceDto>("عنوان منبع مالیاتی نمی‌تواند خالی باشد");

            var code = !string.IsNullOrWhiteSpace(dto.Code) 
                ? dto.Code.Trim() 
                : $"Custom_{DateTime.UtcNow.Ticks}";

            var exists = await _context.TaxSources.AnyAsync(x => x.Code.ToLower() == code.ToLower(), ct);
            if (exists)
                return Result.Failure<TaxSourceDto>("کد شناسه این منبع مالیاتی تکراری است");

            var maxId = await _context.TaxSources.AnyAsync(ct)
                ? await _context.TaxSources.MaxAsync(x => x.Id, ct)
                : 0;

            var newId = Math.Max(maxId + 1, 8);

            var entity = TaxSource.Create(
                newId,
                code,
                dto.Title.Trim(),
                dto.Description?.Trim(),
                isActive: true,
                displayOrder: dto.DisplayOrder > 0 ? dto.DisplayOrder : newId,
                isSystem: false);

            _context.TaxSources.Add(entity);
            await _context.SaveChangesAsync(ct);

            return Result.Success(new TaxSourceDto
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
            _logger.LogError(ex, "Failed to create tax source");
            return Result.Failure<TaxSourceDto>($"خطا در ایجاد منبع مالیاتی: {ex.Message}");
        }
    }

    public async Task<Result<TaxSourceDto>> UpdateAsync(int id, UpdateTaxSourceDto dto, CancellationToken ct = default)
    {
        try
        {
            var entity = await _context.TaxSources.FirstOrDefaultAsync(x => x.Id == id, ct);
            if (entity == null)
                return Result.Failure<TaxSourceDto>("منبع مالیاتی یافت نشد");

            entity.Update(dto.Title, dto.Description, dto.IsActive, dto.DisplayOrder);
            await _context.SaveChangesAsync(ct);

            return Result.Success(new TaxSourceDto
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
            _logger.LogError(ex, "Failed to update tax source with id {Id}", id);
            return Result.Failure<TaxSourceDto>($"خطا در بروزرسانی منبع مالیاتی: {ex.Message}");
        }
    }

    public async Task<Result> DeleteAsync(int id, CancellationToken ct = default)
    {
        try
        {
            var entity = await _context.TaxSources.FirstOrDefaultAsync(x => x.Id == id, ct);
            if (entity == null)
                return Result.Failure("منبع مالیاتی یافت نشد");

            if (entity.IsSystem)
                return Result.Failure("امکان حذف منابع مالیاتی پیش‌فرض و سیستمی وجود ندارد. می‌توانید آن را غیرفعال نمایید.");

            // Check if any tax refund cases use this source
            var inUse = await _context.TaxRefundCases.AnyAsync(c => (int)c.TaxSource == id, ct);
            if (inUse)
                return Result.Failure("این منبع مالیاتی در پرونده‌های استرداد ثبت‌شده مورد استفاده قرار گرفته و قابل حذف نیست. می‌توانید وضعیت آن را غیرفعال نمایید.");

            _context.TaxSources.Remove(entity);
            await _context.SaveChangesAsync(ct);

            return Result.Success();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete tax source with id {Id}", id);
            return Result.Failure($"خطا در حذف منبع مالیاتی: {ex.Message}");
        }
    }

    public async Task<Result> ReorderAsync(IEnumerable<TaxSourceOrderDto> items, CancellationToken ct = default)
    {
        try
        {
            if (items == null)
                return Result.Failure("اطلاعات ترتیب ارسال نشده است");

            var orderList = items.ToList();
            if (orderList.Count == 0)
                return Result.Success();

            var ids = orderList.Select(x => x.Id).ToList();
            var entities = await _context.TaxSources.Where(x => ids.Contains(x.Id)).ToListAsync(ct);
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
            _logger.LogError(ex, "Failed to reorder tax sources");
            return Result.Failure($"خطا در بروزرسانی ترتیب منابع مالیاتی: {ex.Message}");
        }
    }
}

