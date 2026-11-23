using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Application.Services.Reporting;
using TaxSummary.Domain.Common;
using TaxSummary.Domain.Entities.Reporting;
using TaxSummary.Infrastructure.Data;

namespace TaxSummary.Infrastructure.Services.Reporting;

public class ReportCategoryService : IReportCategoryService
{
    private readonly TaxSummaryDbContext _context;
    private readonly ILogger<ReportCategoryService> _logger;

    public ReportCategoryService(TaxSummaryDbContext context, ILogger<ReportCategoryService> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<Result<IEnumerable<ReportCategoryDto>>> GetActiveCategoriesAsync(CancellationToken ct = default)
    {
        try
        {
            var categories = await _context.ReportCategories
                .AsNoTracking()
                .Where(c => c.IsActive)
                .OrderBy(c => c.DisplayOrder)
                .ThenBy(c => c.Id)
                .Select(c => new ReportCategoryDto
                {
                    Id = c.Id,
                    Code = c.Code,
                    Title = c.Title,
                    Description = c.Description,
                    IsActive = c.IsActive,
                    DisplayOrder = c.DisplayOrder,
                    IsSystem = c.IsSystem,
                    ReportCount = 0,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                })
                .ToListAsync(ct);

            return Result.Success<IEnumerable<ReportCategoryDto>>(categories);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get active report categories");
            return Result.Failure<IEnumerable<ReportCategoryDto>>("خطا در بارگذاری دسته‌بندی‌های فعال گزارش‌ها.");
        }
    }

    public async Task<Result<IEnumerable<ReportCategoryDto>>> GetAllForManagementAsync(CancellationToken ct = default)
    {
        try
        {
            var categories = await _context.ReportCategories
                .AsNoTracking()
                .OrderBy(c => c.DisplayOrder)
                .ThenBy(c => c.Id)
                .ToListAsync(ct);

            var reportCounts = await _context.ReportDefinitions
                .AsNoTracking()
                .GroupBy(r => (int)r.DomainSource)
                .Select(g => new { DomainSource = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.DomainSource, x => x.Count, ct);

            var dtos = categories.Select(c => new ReportCategoryDto
            {
                Id = c.Id,
                Code = c.Code,
                Title = c.Title,
                Description = c.Description,
                IsActive = c.IsActive,
                DisplayOrder = c.DisplayOrder,
                IsSystem = c.IsSystem,
                ReportCount = reportCounts.TryGetValue(c.Id, out var count) ? count : 0,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            }).ToList();

            return Result.Success<IEnumerable<ReportCategoryDto>>(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get report categories for management");
            return Result.Failure<IEnumerable<ReportCategoryDto>>("خطا در بارگذاری فهرست دسته‌بندی‌ها جهت مدیریت.");
        }
    }

    public async Task<Result<ReportCategoryDto>> GetByIdAsync(int id, CancellationToken ct = default)
    {
        try
        {
            var c = await _context.ReportCategories
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id, ct);

            if (c == null)
                return Result.Failure<ReportCategoryDto>("دسته‌بندی گزارش یافت نشد.");

            var count = await _context.ReportDefinitions
                .AsNoTracking()
                .CountAsync(r => (int)r.DomainSource == id, ct);

            return Result.Success(new ReportCategoryDto
            {
                Id = c.Id,
                Code = c.Code,
                Title = c.Title,
                Description = c.Description,
                IsActive = c.IsActive,
                DisplayOrder = c.DisplayOrder,
                IsSystem = c.IsSystem,
                ReportCount = count,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get report category by id {Id}", id);
            return Result.Failure<ReportCategoryDto>("خطا در دریافت مشخصات دسته‌بندی گزارش.");
        }
    }

    public async Task<Result<ReportCategoryDto>> CreateAsync(CreateReportCategoryDto dto, CancellationToken ct = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(dto.Code))
                return Result.Failure<ReportCategoryDto>("کد انگلیسی دسته‌بندی الزامی است.");

            if (string.IsNullOrWhiteSpace(dto.Title))
                return Result.Failure<ReportCategoryDto>("عنوان فارسی دسته‌بندی الزامی است.");

            var cleanCode = dto.Code.Trim().ToUpperInvariant();
            if (!Regex.IsMatch(cleanCode, @"^[A-Z0-9_]{2,50}$"))
                return Result.Failure<ReportCategoryDto>("کد دسته‌بندی باید فقط شامل حروف لاتین، ارقام و خط زیر باشد (۲ تا ۵۰ کاراکتر).");

            var cleanTitle = dto.Title.Trim();

            var existsCode = await _context.ReportCategories.AnyAsync(c => c.Code == cleanCode, ct);
            if (existsCode)
                return Result.Failure<ReportCategoryDto>($"دسته‌بندی با کد '{cleanCode}' قبلاً ثبت شده است.");

            var existsTitle = await _context.ReportCategories.AnyAsync(c => c.Title == cleanTitle, ct);
            if (existsTitle)
                return Result.Failure<ReportCategoryDto>($"دسته‌بندی با عنوان '{cleanTitle}' قبلاً ثبت شده است.");

            var maxId = await _context.ReportCategories.MaxAsync(c => (int?)c.Id, ct) ?? 6;
            var newId = Math.Max(maxId + 1, 7);

            var category = ReportDomainCategory.Create(
                id: newId,
                code: cleanCode,
                title: cleanTitle,
                description: dto.Description,
                isActive: true,
                displayOrder: dto.DisplayOrder > 0 ? dto.DisplayOrder : (newId * 10),
                isSystem: false);

            await _context.ReportCategories.AddAsync(category, ct);
            await _context.SaveChangesAsync(ct);

            _logger.LogInformation("Created new report category {Title} with ID {Id}", cleanTitle, newId);

            return Result.Success(new ReportCategoryDto
            {
                Id = category.Id,
                Code = category.Code,
                Title = category.Title,
                Description = category.Description,
                IsActive = category.IsActive,
                DisplayOrder = category.DisplayOrder,
                IsSystem = category.IsSystem,
                ReportCount = 0,
                CreatedAt = category.CreatedAt,
                UpdatedAt = category.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create report category");
            return Result.Failure<ReportCategoryDto>("خطا در ایجاد دسته‌بندی جدید گزارش: " + ex.Message);
        }
    }

    public async Task<Result<ReportCategoryDto>> UpdateAsync(int id, UpdateReportCategoryDto dto, CancellationToken ct = default)
    {
        try
        {
            var category = await _context.ReportCategories.FirstOrDefaultAsync(c => c.Id == id, ct);
            if (category == null)
                return Result.Failure<ReportCategoryDto>("دسته‌بندی مورد نظر یافت نشد.");

            if (string.IsNullOrWhiteSpace(dto.Title))
                return Result.Failure<ReportCategoryDto>("عنوان دسته‌بندی نمی‌تواند خالی باشد.");

            var cleanTitle = dto.Title.Trim();
            var duplicateTitle = await _context.ReportCategories
                .AnyAsync(c => c.Title == cleanTitle && c.Id != id, ct);

            if (duplicateTitle)
                return Result.Failure<ReportCategoryDto>($"عنوان '{cleanTitle}' قبلاً برای دسته‌بندی دیگری استفاده شده است.");

            category.UpdateDetails(cleanTitle, dto.Description, dto.DisplayOrder, dto.IsActive);
            await _context.SaveChangesAsync(ct);

            _logger.LogInformation("Updated report category {Id} ({Title})", id, cleanTitle);

            var count = await _context.ReportDefinitions
                .AsNoTracking()
                .CountAsync(r => (int)r.DomainSource == id, ct);

            return Result.Success(new ReportCategoryDto
            {
                Id = category.Id,
                Code = category.Code,
                Title = category.Title,
                Description = category.Description,
                IsActive = category.IsActive,
                DisplayOrder = category.DisplayOrder,
                IsSystem = category.IsSystem,
                ReportCount = count,
                CreatedAt = category.CreatedAt,
                UpdatedAt = category.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update report category {Id}", id);
            return Result.Failure<ReportCategoryDto>("خطا در ویرایش دسته‌بندی گزارش: " + ex.Message);
        }
    }

    public async Task<Result> DeleteAsync(int id, CancellationToken ct = default)
    {
        try
        {
            var category = await _context.ReportCategories.FirstOrDefaultAsync(c => c.Id == id, ct);
            if (category == null)
                return Result.Failure("دسته‌بندی مورد نظر یافت نشد.");

            if (category.IsSystem)
                return Result.Failure("دسته‌بندی‌های پایه سیستمی غیرقابل حذف هستند.");

            var reportCount = await _context.ReportDefinitions
                .CountAsync(r => (int)r.DomainSource == id, ct);

            if (reportCount > 0)
                return Result.Failure($"امکان حذف این دسته‌بندی وجود ندارد زیرا {reportCount} گزارش به آن اختصاص دارند. هیچ گزارشی نباید بدون دسته‌بندی بماند. لطفاً ابتدا دسته‌بندی گزارش‌ها را تغییر دهید.");

            _context.ReportCategories.Remove(category);
            await _context.SaveChangesAsync(ct);

            _logger.LogInformation("Deleted report category {Id} ({Title})", id, category.Title);
            return Result.Success();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete report category {Id}", id);
            return Result.Failure("خطا در حذف دسته‌بندی گزارش: " + ex.Message);
        }
    }

    public async Task<Result<ReportCategoryDto>> ToggleStatusAsync(int id, CancellationToken ct = default)
    {
        try
        {
            var category = await _context.ReportCategories.FirstOrDefaultAsync(c => c.Id == id, ct);
            if (category == null)
                return Result.Failure<ReportCategoryDto>("دسته‌بندی مورد نظر یافت نشد.");

            category.ToggleStatus();
            await _context.SaveChangesAsync(ct);

            _logger.LogInformation("Toggled active status for category {Id} to {IsActive}", id, category.IsActive);

            var count = await _context.ReportDefinitions
                .AsNoTracking()
                .CountAsync(r => (int)r.DomainSource == id, ct);

            return Result.Success(new ReportCategoryDto
            {
                Id = category.Id,
                Code = category.Code,
                Title = category.Title,
                Description = category.Description,
                IsActive = category.IsActive,
                DisplayOrder = category.DisplayOrder,
                IsSystem = category.IsSystem,
                ReportCount = count,
                CreatedAt = category.CreatedAt,
                UpdatedAt = category.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to toggle status for report category {Id}", id);
            return Result.Failure<ReportCategoryDto>("خطا در تغییر وضعیت دسته‌بندی: " + ex.Message);
        }
    }

    public async Task<bool> IsActiveCategoryAsync(int id, CancellationToken ct = default)
    {
        return await _context.ReportCategories
            .AsNoTracking()
            .AnyAsync(c => c.Id == id && c.IsActive, ct);
    }
}
