using Microsoft.Extensions.Logging;
using TaxSummary.Application.DTOs.MenuSettings;
using TaxSummary.Domain.Common;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Interfaces;

namespace TaxSummary.Application.Services;

/// <summary>
/// Service implementation for managing dynamic menu visibility and accessibility.
/// </summary>
public class MenuSettingsService : IMenuSettingsService
{
    private readonly IMenuSettingsRepository _repository;
    private readonly ILogger<MenuSettingsService> _logger;

    public MenuSettingsService(
        IMenuSettingsRepository repository,
        ILogger<MenuSettingsService> logger)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<List<MenuSettingDto>> GetAllSettingsAsync(CancellationToken cancellationToken = default)
    {
        var settings = await _repository.GetAllAsync(cancellationToken);
        return MapAndBuildHierarchy(settings);
    }

    public async Task<List<MenuSettingDto>> GetVisibleSettingsForRoleAsync(string? role, CancellationToken cancellationToken = default)
    {
        var settings = await _repository.GetVisibleAsync(role, cancellationToken);
        return MapAndBuildHierarchy(settings);
    }

    public async Task<List<MenuSettingDto>> UpdateSettingsAsync(
        UpdateMenuSettingsRequestDto request,
        Guid? currentUserId,
        CancellationToken cancellationToken = default)
    {
        if (request?.Settings == null || !request.Settings.Any())
        {
            return await GetAllSettingsAsync(cancellationToken);
        }

        var allSettings = await _repository.GetAllAsync(cancellationToken);
        var settingsDict = allSettings.ToDictionary(s => s.MenuKey.ToLowerInvariant());
        var modified = new List<MenuSetting>();

        foreach (var updateItem in request.Settings)
        {
            var key = updateItem.MenuKey.Trim().ToLowerInvariant();
            if (settingsDict.TryGetValue(key, out var existingSetting))
            {
                existingSetting.UpdateVisibility(
                    updateItem.IsVisible,
                    updateItem.AdminOnly,
                    updateItem.DisplayOrder,
                    currentUserId,
                    updateItem.AllowedRoles);
                modified.Add(existingSetting);
            }
            else
            {
                _logger.LogWarning("Menu setting key '{Key}' not found for update.", updateItem.MenuKey);
            }
        }

        if (modified.Any())
        {
            await _repository.UpdateRangeAsync(modified, cancellationToken);
            _logger.LogInformation("Updated {Count} menu settings by user {UserId}.", modified.Count, currentUserId);
        }

        return await GetAllSettingsAsync(cancellationToken);
    }

    public async Task ResetToDefaultsAsync(Guid? currentUserId, CancellationToken cancellationToken = default)
    {
        var defaults = DefaultMenuSettings.GetDefaults();
        await _repository.ResetToDefaultsAsync(defaults, cancellationToken);
        _logger.LogInformation("Reset all menu settings to default configurations by user {UserId}.", currentUserId);
    }

    private static List<MenuSettingDto> MapAndBuildHierarchy(List<MenuSetting> entities)
    {
        var dtos = entities.Select(e => new MenuSettingDto
        {
            Id = e.Id,
            MenuKey = e.MenuKey,
            ParentKey = e.ParentKey,
            Title = e.Title,
            Route = e.Route,
            IconName = e.IconName,
            IsVisible = e.IsVisible,
            AdminOnly = e.AdminOnly,
            AllowedRoles = e.AllowedRoles
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .ToList(),
            DisplayOrder = e.DisplayOrder,
            Description = e.Description,
            Children = new List<MenuSettingDto>()
        }).ToList();

        var lookup = dtos.ToDictionary(d => d.MenuKey.ToLowerInvariant());

        // Attach children to parents
        foreach (var dto in dtos)
        {
            if (!string.IsNullOrEmpty(dto.ParentKey) && lookup.TryGetValue(dto.ParentKey.ToLowerInvariant(), out var parentDto))
            {
                parentDto.Children.Add(dto);
            }
        }

        return dtos;
    }
}
