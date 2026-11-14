using System.Text.Json;
using AutoMapper;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using TaxSummary.Application.DTOs.Branding;
using TaxSummary.Domain.Common;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Interfaces;

namespace TaxSummary.Application.Services;

public class SystemSettingsService : ISystemSettingsService
{
    private readonly ISystemSettingsRepository _repository;
    private readonly IFileStorageService _fileStorageService;
    private readonly IMapper _mapper;
    private readonly IValidator<UpdateSystemSettingsDto> _validator;
    private readonly ILogger<SystemSettingsService> _logger;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public SystemSettingsService(
        ISystemSettingsRepository repository,
        IFileStorageService fileStorageService,
        IMapper mapper,
        IValidator<UpdateSystemSettingsDto> validator,
        ILogger<SystemSettingsService> logger)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _fileStorageService = fileStorageService ?? throw new ArgumentNullException(nameof(fileStorageService));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        _validator = validator ?? throw new ArgumentNullException(nameof(validator));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<Result<SystemSettingsDto>> GetBrandingSettingsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var setting = await _repository.GetOrCreateDefaultAsync(cancellationToken);
            var dto = MapToDto(setting);
            return Result.Success(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطا در دریافت تنظیمات هویت و برندینگ سامانه");
            return Result.Failure<SystemSettingsDto>("خطا در بارگذاری تنظیمات برندینگ سامانه");
        }
    }

    public async Task<Result<SystemSettingsDto>> UpdateBrandingSettingsAsync(
        UpdateSystemSettingsDto request,
        string? updatedBy,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var validationResult = await _validator.ValidateAsync(request, cancellationToken);
            if (!validationResult.IsValid)
            {
                var errors = string.Join(" | ", validationResult.Errors.Select(e => e.ErrorMessage));
                return Result.Failure<SystemSettingsDto>(errors);
            }

            var setting = await _repository.GetOrCreateDefaultAsync(cancellationToken);
            setting.UpdateBranding(
                request.OrganizationName,
                request.SystemTitle,
                request.LogoPath,
                request.ReportingModuleTitle,
                request.ReportingModuleSubtitle,
                request.FooterCopyrightText,
                request.FooterVersionText,
                request.FooterBadgeText,
                request.FooterLinksJson,
                updatedBy);

            await _repository.UpdateAsync(setting, cancellationToken);
            _logger.LogInformation("System branding updated by {UpdatedBy}: Org={OrgName}, Title={Title}",
                updatedBy ?? "Unknown", setting.OrganizationName, setting.SystemTitle);

            var dto = MapToDto(setting);
            return Result.Success(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطا در بروزرسانی تنظیمات برندینگ سامانه");
            return Result.Failure<SystemSettingsDto>("خطا در ذخیره‌سازی تغییرات برندینگ سامانه");
        }
    }

    public async Task<Result<SystemSettingsDto>> UpdateLogoAsync(
        IFormFile logoFile,
        string? updatedBy,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (logoFile == null || logoFile.Length == 0)
                return Result.Failure<SystemSettingsDto>("فایل تصویر لوگو ارسال نشده است");

            var logoUrl = await _fileStorageService.SaveBrandingLogoAsync(logoFile);

            var setting = await _repository.GetOrCreateDefaultAsync(cancellationToken);
            setting.UpdateLogo(logoUrl, updatedBy);

            await _repository.UpdateAsync(setting, cancellationToken);
            _logger.LogInformation("System logo updated by {UpdatedBy}: {LogoUrl}", updatedBy ?? "Unknown", logoUrl);

            var dto = MapToDto(setting);
            return Result.Success(dto);
        }
        catch (ArgumentException aex)
        {
            return Result.Failure<SystemSettingsDto>(aex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطا در بارگذاری فایل لوگوی سامانه");
            return Result.Failure<SystemSettingsDto>("خطا در بارگذاری و ذخیره فایل تصویر لوگو");
        }
    }

    public async Task<Result<SystemSettingsDto>> ResetToDefaultsAsync(
        string? updatedBy,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var setting = await _repository.GetOrCreateDefaultAsync(cancellationToken);
            setting.ResetToDefaults(updatedBy);

            await _repository.UpdateAsync(setting, cancellationToken);
            _logger.LogInformation("System branding reset to defaults by {UpdatedBy}", updatedBy ?? "Unknown");

            var dto = MapToDto(setting);
            return Result.Success(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطا در بازنشانی تنظیمات برندینگ به پیش‌فرض");
            return Result.Failure<SystemSettingsDto>("خطا در بازنشانی تنظیمات برندینگ");
        }
    }

    private SystemSettingsDto MapToDto(SystemSetting setting)
    {
        var dto = _mapper.Map<SystemSettingsDto>(setting);
        if (!string.IsNullOrWhiteSpace(setting.FooterLinksJson))
        {
            try
            {
                var links = JsonSerializer.Deserialize<List<FooterLinkDto>>(setting.FooterLinksJson, JsonOptions);
                if (links != null)
                {
                    dto.FooterLinks = links.OrderBy(l => l.Order).ToList();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to deserialize FooterLinksJson for SystemSetting {Id}", setting.Id);
            }
        }
        return dto;
    }
}
