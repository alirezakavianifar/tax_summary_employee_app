using Microsoft.AspNetCore.Http;
using TaxSummary.Application.DTOs.Branding;
using TaxSummary.Domain.Common;

namespace TaxSummary.Application.Services;

public interface ISystemSettingsService
{
    Task<Result<SystemSettingsDto>> GetBrandingSettingsAsync(CancellationToken cancellationToken = default);
    Task<Result<SystemSettingsDto>> UpdateBrandingSettingsAsync(UpdateSystemSettingsDto request, string? updatedBy, CancellationToken cancellationToken = default);
    Task<Result<SystemSettingsDto>> UpdateLogoAsync(IFormFile logoFile, string? updatedBy, CancellationToken cancellationToken = default);
    Task<Result<SystemSettingsDto>> ResetToDefaultsAsync(string? updatedBy, CancellationToken cancellationToken = default);
}

