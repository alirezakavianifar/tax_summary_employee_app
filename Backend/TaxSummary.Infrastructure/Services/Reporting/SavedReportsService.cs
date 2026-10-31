using AutoMapper;
using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Application.Services.Reporting;
using TaxSummary.Domain.Common;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Interfaces;

namespace TaxSummary.Infrastructure.Services.Reporting;

/// <summary>
/// Service implementation for managing saved report filter presets and office-shared views
/// </summary>
public class SavedReportsService : ISavedReportsService
{
    private readonly IReportingRepository _reportingRepository;
    private readonly IMapper _mapper;

    public SavedReportsService(IReportingRepository reportingRepository, IMapper mapper)
    {
        _reportingRepository = reportingRepository;
        _mapper = mapper;
    }

    public async Task<Result<List<SavedReportPresetDto>>> GetUserPresetsAsync(
        Guid userId, 
        Guid? reportDefinitionId = null, 
        CancellationToken ct = default)
    {
        try
        {
            var presets = await _reportingRepository.GetUserSavedPresetsAsync(userId, reportDefinitionId, ct);
            var dtos = _mapper.Map<List<SavedReportPresetDto>>(presets);
            return Result.Success<List<SavedReportPresetDto>>(dtos);
        }
        catch (Exception ex)
        {
            return Result.Failure<List<SavedReportPresetDto>>($"خطا در بازیابی الگوهای ذخیره‌شده: {ex.Message}");
        }
    }

    public async Task<Result<SavedReportPresetDto>> SavePresetAsync(
        SaveReportPresetRequestDto request, 
        Guid userId, 
        CancellationToken ct = default)
    {
        try
        {
            var report = await _reportingRepository.GetReportDefinitionByIdAsync(request.ReportDefinitionId, ct);
            if (report == null)
            {
                return Result.Failure<SavedReportPresetDto>("گزارش مورد نظر یافت نشد.");
            }

            var preset = SavedReportPreset.Create(
                request.ReportDefinitionId,
                userId,
                request.PresetName,
                request.FilterCriteriaJson,
                request.VisibleColumnsJson,
                request.IsSharedWithOffice);

            await _reportingRepository.AddPresetAsync(preset, ct);

            var createdPreset = await _reportingRepository.GetPresetByIdAsync(preset.Id, ct);
            var dto = _mapper.Map<SavedReportPresetDto>(createdPreset ?? preset);

            return Result.Success<SavedReportPresetDto>(dto);
        }
        catch (Exception ex)
        {
            return Result.Failure<SavedReportPresetDto>($"خطا در ذخیره الگوی گزارش: {ex.Message}");
        }
    }

    public async Task<Result<bool>> UpdatePresetAsync(
        Guid id, 
        UpdateReportPresetRequestDto request, 
        Guid userId, 
        CancellationToken ct = default)
    {
        try
        {
            var preset = await _reportingRepository.GetPresetByIdAsync(id, ct);
            if (preset == null)
            {
                return Result.Failure<bool>("الگوی گزارش مورد نظر یافت نشد.");
            }

            if (preset.UserId != userId)
            {
                return Result.Failure<bool>("شما مجوز ویرایش این الگوی گزارش را ندارید.");
            }

            preset.Update(
                request.PresetName,
                request.FilterCriteriaJson,
                request.VisibleColumnsJson,
                request.IsSharedWithOffice);

            await _reportingRepository.UpdatePresetAsync(preset, ct);
            return Result.Success<bool>(true);
        }
        catch (Exception ex)
        {
            return Result.Failure<bool>($"خطا در ویرایش الگوی گزارش: {ex.Message}");
        }
    }

    public async Task<Result<bool>> DeletePresetAsync(
        Guid id, 
        Guid userId, 
        CancellationToken ct = default)
    {
        try
        {
            var preset = await _reportingRepository.GetPresetByIdAsync(id, ct);
            if (preset == null)
            {
                return Result.Failure<bool>("الگوی گزارش مورد نظر یافت نشد.");
            }

            if (preset.UserId != userId)
            {
                return Result.Failure<bool>("شما مجوز حذف این الگوی گزارش را ندارید.");
            }

            await _reportingRepository.DeletePresetAsync(id, ct);
            return Result.Success<bool>(true);
        }
        catch (Exception ex)
        {
            return Result.Failure<bool>($"خطا در حذف الگوی گزارش: {ex.Message}");
        }
    }
}
