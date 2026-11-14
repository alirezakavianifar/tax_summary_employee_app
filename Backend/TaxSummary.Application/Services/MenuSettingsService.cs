using System.Text.RegularExpressions;
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
    private static readonly Regex MenuKeyPattern = new("^[a-z0-9_-]{2,100}$", RegexOptions.Compiled);
    private static readonly HashSet<string> DefaultMenuKeys = DefaultMenuSettings
        .GetDefaults()
        .Select(d => d.MenuKey)
        .ToHashSet(StringComparer.OrdinalIgnoreCase);

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
                var incomingRoles = SanitizeAllowedRoles(updateItem.AllowedRoles);

                existingSetting.UpdateVisibility(
                    updateItem.IsVisible,
                    updateItem.AdminOnly,
                    updateItem.DisplayOrder,
                    currentUserId,
                    incomingRoles);
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

    public async Task<List<MenuSettingDto>> CreateSettingAsync(
        CreateMenuSettingRequestDto request,
        Guid? currentUserId,
        CancellationToken cancellationToken = default)
    {
        if (request == null)
            throw new ArgumentException("اطلاعات گزینه منو ارسال نشده است.");

        var title = ValidateTitle(request.Title);
        var route = ValidateAndNormalizeRoute(request.Route);
        var normalizedKey = string.IsNullOrWhiteSpace(request.MenuKey)
            ? $"custom_{Guid.NewGuid().ToString("N")[..10]}"
            : request.MenuKey.Trim().ToLowerInvariant();

        if (!MenuKeyPattern.IsMatch(normalizedKey))
            throw new ArgumentException("شناسه یکتای منو باید شامل حروف کوچک انگلیسی، اعداد، خط تیره یا زیرخط باشد.");

        if (DefaultMenuKeys.Contains(normalizedKey))
            throw new InvalidOperationException("امکان استفاده از شناسه رزرو شده پیش‌فرض سیستم وجود ندارد.");

        var duplicate = await _repository.GetByKeyAsync(normalizedKey, cancellationToken);
        if (duplicate != null)
            throw new InvalidOperationException($"گزینه‌ای با شناسه '{normalizedKey}' قبلاً ثبت شده است.");

        var allSettings = await _repository.GetAllAsync(cancellationToken);
        var parentKey = ValidateParentKey(request.ParentKey, normalizedKey, selfHasChildren: false, allSettings);

        var nextOrder = request.DisplayOrder ?? (
            allSettings
                .Where(s => string.Equals(s.ParentKey ?? string.Empty, parentKey ?? string.Empty, StringComparison.OrdinalIgnoreCase))
                .Select(s => s.DisplayOrder)
                .DefaultIfEmpty(0)
                .Max() + 1
        );

        var roles = SanitizeAllowedRoles(request.AllowedRoles);
        var allowedRolesCsv = roles.Count > 0
            ? string.Join(",", roles)
            : (request.AdminOnly ? "Admin" : null);

        var entity = MenuSetting.Create(
            menuKey: normalizedKey,
            title: title,
            route: route,
            parentKey: parentKey,
            iconName: request.IconName,
            isVisible: request.IsVisible,
            adminOnly: request.AdminOnly,
            displayOrder: nextOrder,
            description: request.Description,
            updatedByUserId: currentUserId,
            allowedRoles: allowedRolesCsv,
            colorTheme: request.ColorTheme,
            badgeText: request.BadgeText);

        await _repository.AddAsync(entity, cancellationToken);
        _logger.LogInformation("Created custom menu setting '{MenuKey}' by user {UserId}.", normalizedKey, currentUserId);

        return await GetAllSettingsAsync(cancellationToken);
    }

    public async Task<List<MenuSettingDto>> UpdateSettingMetadataAsync(
        string menuKey,
        UpdateMenuSettingMetadataDto request,
        Guid? currentUserId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(menuKey))
            throw new ArgumentException("شناسه منو نامعتبر است.");

        if (request == null)
            throw new ArgumentException("اطلاعات ویرایش منو ارسال نشده است.");

        var existing = await _repository.GetByKeyAsync(menuKey, cancellationToken)
            ?? throw new KeyNotFoundException("گزینه منوی مورد نظر یافت نشد.");

        var isBuiltIn = DefaultMenuKeys.Contains(existing.MenuKey);
        var title = ValidateTitle(request.Title);
        var route = isBuiltIn ? existing.Route : ValidateAndNormalizeRoute(request.Route);
        
        if (!isBuiltIn)
        {
            var allSettings = await _repository.GetAllAsync(cancellationToken);
            var hasChildren = allSettings.Any(s => string.Equals(s.ParentKey, existing.MenuKey, StringComparison.OrdinalIgnoreCase));
            var parentKey = ValidateParentKey(request.ParentKey, existing.MenuKey, hasChildren, allSettings);
            existing.UpdateParentKey(parentKey, currentUserId);
        }

        existing.UpdateMetadata(title, route, request.Description, currentUserId, request.IconName, request.ColorTheme, request.BadgeText);

        var roles = SanitizeAllowedRoles(request.AllowedRoles);
        existing.UpdateVisibility(
            request.IsVisible,
            request.AdminOnly,
            request.DisplayOrder,
            currentUserId,
            roles.Count > 0 ? roles : null);

        await _repository.UpdateAsync(existing, cancellationToken);
        _logger.LogInformation("Updated custom menu setting '{MenuKey}' by user {UserId}.", existing.MenuKey, currentUserId);

        return await GetAllSettingsAsync(cancellationToken);
    }

    public async Task<List<MenuSettingDto>> DeleteSettingAsync(
        string menuKey,
        Guid? currentUserId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(menuKey))
            throw new ArgumentException("شناسه منو نامعتبر است.");

        var existing = await _repository.GetByKeyAsync(menuKey, cancellationToken)
            ?? throw new KeyNotFoundException("گزینه منوی مورد نظر یافت نشد.");

        if (DefaultMenuKeys.Contains(existing.MenuKey))
            throw new InvalidOperationException("گزینه‌های پیش‌فرض سیستم قابل حذف نیستند؛ می‌توانید آن‌ها را مخفی کنید.");

        var allSettings = await _repository.GetAllAsync(cancellationToken);
        var toDelete = allSettings
            .Where(s =>
                string.Equals(s.MenuKey, existing.MenuKey, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(s.ParentKey, existing.MenuKey, StringComparison.OrdinalIgnoreCase))
            .ToList();

        await _repository.DeleteRangeAsync(toDelete, cancellationToken);
        _logger.LogInformation("Deleted custom menu setting '{MenuKey}' ({Count} rows) by user {UserId}.",
            existing.MenuKey, toDelete.Count, currentUserId);

        return await GetAllSettingsAsync(cancellationToken);
    }

    public async Task ResetToDefaultsAsync(Guid? currentUserId, CancellationToken cancellationToken = default)
    {
        var defaults = DefaultMenuSettings.GetDefaults();
        await _repository.ResetToDefaultsAsync(defaults, cancellationToken);
        _logger.LogInformation("Reset built-in menu settings to default configurations by user {UserId}.", currentUserId);
    }

    private static List<string> SanitizeAllowedRoles(IEnumerable<string>? roles)
    {
        var list = roles?.ToList() ?? new List<string>();
        if (!list.Any(r => string.Equals(r, "OfficeHead", StringComparison.OrdinalIgnoreCase)))
        {
            list.RemoveAll(r => string.Equals(r, "Manager", StringComparison.OrdinalIgnoreCase));
        }
        if (!list.Any(r => string.Equals(r, "Expert", StringComparison.OrdinalIgnoreCase)))
        {
            list.RemoveAll(r => string.Equals(r, "Employee", StringComparison.OrdinalIgnoreCase));
        }
        return list;
    }

    private static string ValidateTitle(string? title)
    {
        var trimmed = title?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(trimmed))
            throw new ArgumentException("عنوان منو الزامی است.");
        if (trimmed.Length > 150)
            throw new ArgumentException("عنوان منو نباید بیشتر از ۱۵۰ کاراکتر باشد.");
        return trimmed;
    }

    private static string ValidateAndNormalizeRoute(string? route)
    {
        var trimmed = route?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(trimmed))
            throw new ArgumentException("مسیر یا لینک مقصد منو الزامی است.");

        if (trimmed.Length > 250)
            throw new ArgumentException("مسیر یا لینک مقصد نباید بیشتر از ۲۵۰ کاراکتر باشد.");

        bool isInternalRoute = trimmed.StartsWith("/", StringComparison.Ordinal) && !trimmed.StartsWith("//", StringComparison.Ordinal);
        bool isHttpUrl = Uri.TryCreate(trimmed, UriKind.Absolute, out var uri) &&
                         (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);

        if (!isInternalRoute && !isHttpUrl)
            throw new ArgumentException("مسیر باید با '/' شروع شود (مسیر داخلی) یا یک آدرس معتبر http/https باشد.");

        return trimmed;
    }

    private static string? ValidateParentKey(
        string? rawParentKey,
        string selfKey,
        bool selfHasChildren,
        List<MenuSetting> allSettings)
    {
        if (string.IsNullOrWhiteSpace(rawParentKey))
            return null;

        var normalizedParent = rawParentKey.Trim().ToLowerInvariant();
        if (string.Equals(normalizedParent, selfKey, StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("یک گزینه نمی‌تواند زیرمجموعه خودش باشد.");

        if (selfHasChildren)
            throw new InvalidOperationException("یک ماژول دارای زیرمنو نمی‌تواند به زیرمنوی ماژول دیگر تبدیل شود.");

        var parent = allSettings.FirstOrDefault(s =>
            string.Equals(s.MenuKey, normalizedParent, StringComparison.OrdinalIgnoreCase));

        if (parent == null)
            throw new ArgumentException("ماژول والد انتخاب‌شده یافت نشد.");

        if (!string.IsNullOrWhiteSpace(parent.ParentKey))
            throw new ArgumentException("حداکثر دو سطح منو پشتیبانی می‌شود؛ ماژول والد باید سطح اول باشد.");

        return parent.MenuKey;
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
            ColorTheme = e.ColorTheme,
            BadgeText = e.BadgeText,
            IsVisible = e.IsVisible,
            AdminOnly = e.AdminOnly,
            AllowedRoles = e.AllowedRoles
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .ToList(),
            DisplayOrder = e.DisplayOrder,
            Description = e.Description,
            IsCustom = !DefaultMenuKeys.Contains(e.MenuKey),
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
