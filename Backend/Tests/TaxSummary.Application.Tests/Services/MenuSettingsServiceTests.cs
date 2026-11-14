using Microsoft.Extensions.Logging;
using Moq;
using TaxSummary.Application.DTOs.MenuSettings;
using TaxSummary.Application.Services;
using TaxSummary.Domain.Common;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Interfaces;
using Xunit;

namespace TaxSummary.Application.Tests.Services;

public class MenuSettingsServiceTests
{
    private readonly Mock<IMenuSettingsRepository> _mockRepo;
    private readonly Mock<ILogger<MenuSettingsService>> _mockLogger;
    private readonly MenuSettingsService _service;

    public MenuSettingsServiceTests()
    {
        _mockRepo = new Mock<IMenuSettingsRepository>();
        _mockLogger = new Mock<ILogger<MenuSettingsService>>();
        _service = new MenuSettingsService(_mockRepo.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task GetAllSettingsAsync_ReturnsAllItems_WithHierarchyPopulated()
    {
        // Arrange
        var sampleSettings = DefaultMenuSettings.GetDefaults();
        _mockRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sampleSettings);

        // Act
        var result = await _service.GetAllSettingsAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Equal(sampleSettings.Count, result.Count);

        // Check that parent item module_tax_refund has children attached
        var taxRefundParent = result.FirstOrDefault(x => x.MenuKey == "module_tax_refund");
        Assert.NotNull(taxRefundParent);
        Assert.NotEmpty(taxRefundParent.Children);
        Assert.Contains(taxRefundParent.Children, c => c.MenuKey == "action_refund_list");
    }

    [Fact]
    public async Task GetVisibleSettingsForRoleAsync_WhenUserIsAdmin_CallsRepoWithAdminRole()
    {
        // Arrange
        var sampleSettings = DefaultMenuSettings.GetDefaults();
        _mockRepo.Setup(r => r.GetVisibleAsync("Admin", It.IsAny<CancellationToken>()))
            .ReturnsAsync(sampleSettings);

        // Act
        var result = await _service.GetVisibleSettingsForRoleAsync("Admin");

        // Assert
        _mockRepo.Verify(r => r.GetVisibleAsync("Admin", It.IsAny<CancellationToken>()), Times.Once);
        Assert.NotNull(result);
        Assert.Contains(result, s => s.AllowedRoles.Contains("Admin"));
    }

    [Fact]
    public async Task GetVisibleSettingsForRoleAsync_WhenUserIsManager_CallsRepoWithManagerRole()
    {
        // Arrange
        var managerSettings = DefaultMenuSettings.GetDefaults()
            .Where(s => s.IsRoleAllowed("Manager"))
            .ToList();
        _mockRepo.Setup(r => r.GetVisibleAsync("Manager", It.IsAny<CancellationToken>()))
            .ReturnsAsync(managerSettings);

        // Act
        var result = await _service.GetVisibleSettingsForRoleAsync("Manager");

        // Assert
        _mockRepo.Verify(r => r.GetVisibleAsync("Manager", It.IsAny<CancellationToken>()), Times.Once);
        Assert.NotNull(result);
        Assert.DoesNotContain(result, s => s.MenuKey == "module_admin");
    }

    [Fact]
    public async Task GetVisibleSettingsForRoleAsync_WhenUserIsEmployee_CallsRepoWithEmployeeRole()
    {
        // Arrange
        var regularSettings = DefaultMenuSettings.GetDefaults().Where(s => !s.AdminOnly).ToList();
        _mockRepo.Setup(r => r.GetVisibleAsync("Employee", It.IsAny<CancellationToken>()))
            .ReturnsAsync(regularSettings);

        // Act
        var result = await _service.GetVisibleSettingsForRoleAsync("Employee");

        // Assert
        _mockRepo.Verify(r => r.GetVisibleAsync("Employee", It.IsAny<CancellationToken>()), Times.Once);
        Assert.NotNull(result);
        Assert.DoesNotContain(result, s => s.AdminOnly);
    }

    [Fact]
    public async Task UpdateSettingsAsync_UpdatesMatchingSettings_IncludingAllowedRoles()
    {
        // Arrange
        var settings = DefaultMenuSettings.GetDefaults();
        _mockRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(settings);

        var request = new UpdateMenuSettingsRequestDto
        {
            Settings = new List<UpdateMenuSettingItemDto>
            {
                new()
                {
                    MenuKey = "module_payroll",
                    IsVisible = true,
                    AdminOnly = false,
                    AllowedRoles = new List<string> { "Admin", "OfficeHead" }
                }
            }
        };

        var currentUserId = Guid.NewGuid();

        // Act
        var result = await _service.UpdateSettingsAsync(request, currentUserId);

        // Assert
        _mockRepo.Verify(r => r.UpdateRangeAsync(
            It.Is<IEnumerable<MenuSetting>>(list => list.Any(s =>
                s.MenuKey == "module_payroll" &&
                s.AllowedRoles == "Admin,OfficeHead")),
            It.IsAny<CancellationToken>()), Times.Once);

        var updatedPayroll = result.FirstOrDefault(s => s.MenuKey == "module_payroll");
        Assert.NotNull(updatedPayroll);
        Assert.True(updatedPayroll.IsVisible);
        Assert.Contains("OfficeHead", updatedPayroll.AllowedRoles);
        Assert.DoesNotContain("Employee", updatedPayroll.AllowedRoles);
    }

    [Fact]
    public async Task ResetToDefaultsAsync_CallsRepoResetWithDefaults()
    {
        // Arrange
        var currentUserId = Guid.NewGuid();

        // Act
        await _service.ResetToDefaultsAsync(currentUserId);

        // Assert
        _mockRepo.Verify(r => r.ResetToDefaultsAsync(
            It.Is<IEnumerable<MenuSetting>>(defaults => defaults.Count() >= 15),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateSettingAsync_ValidCustomItem_AddsAndMarksIsCustom()
    {
        // Arrange
        var existing = DefaultMenuSettings.GetDefaults();
        MenuSetting? addedEntity = null;

        _mockRepo.Setup(r => r.GetByKeyAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((MenuSetting?)null);
        _mockRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => addedEntity == null ? existing : existing.Concat(new[] { addedEntity }).ToList());
        _mockRepo.Setup(r => r.AddAsync(It.IsAny<MenuSetting>(), It.IsAny<CancellationToken>()))
            .Callback<MenuSetting, CancellationToken>((m, _) => addedEntity = m)
            .Returns(Task.CompletedTask);

        var request = new CreateMenuSettingRequestDto
        {
            MenuKey = "custom_portal_guide",
            Title = "راهنمای سامانه",
            Route = "https://intamedia.ir",
            IconName = "Globe",
            IsVisible = true,
            AllowedRoles = new List<string> { "Admin", "OfficeHead" }
        };

        // Act
        var result = await _service.CreateSettingAsync(request, Guid.NewGuid());

        // Assert
        _mockRepo.Verify(r => r.AddAsync(It.IsAny<MenuSetting>(), It.IsAny<CancellationToken>()), Times.Once);
        var created = result.FirstOrDefault(s => s.MenuKey == "custom_portal_guide");
        Assert.NotNull(created);
        Assert.True(created.IsCustom);
        Assert.Equal("https://intamedia.ir", created.Route);
        Assert.Equal("Globe", created.IconName);
        Assert.False(result.First(s => s.MenuKey == "module_tax_refund").IsCustom);
    }

    [Theory]
    [InlineData("javascript:alert(1)")]
    [InlineData("//evil.example.com")]
    [InlineData("relative/path")]
    public async Task CreateSettingAsync_InvalidOrUnsafeRoute_ThrowsArgumentException(string unsafeRoute)
    {
        // Arrange
        _mockRepo.Setup(r => r.GetByKeyAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((MenuSetting?)null);

        var request = new CreateMenuSettingRequestDto
        {
            Title = "لینک نامعتبر",
            Route = unsafeRoute
        };

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateSettingAsync(request, Guid.NewGuid()));
    }

    [Fact]
    public async Task CreateSettingAsync_ReservedDefaultKey_ThrowsInvalidOperationException()
    {
        var request = new CreateMenuSettingRequestDto
        {
            MenuKey = "module_tax_refund",
            Title = "تکراری",
            Route = "/about"
        };

        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateSettingAsync(request, Guid.NewGuid()));
    }

    [Fact]
    public async Task CreateSettingAsync_NonRootParentKey_ThrowsArgumentException()
    {
        var existing = DefaultMenuSettings.GetDefaults();
        _mockRepo.Setup(r => r.GetByKeyAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((MenuSetting?)null);
        _mockRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(existing);

        var request = new CreateMenuSettingRequestDto
        {
            Title = "زیرمنوی نامعتبر",
            Route = "/about",
            ParentKey = "action_refund_list"
        };

        await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateSettingAsync(request, Guid.NewGuid()));
    }

    [Fact]
    public async Task UpdateSettingMetadataAsync_BuiltInItem_UpdatesMetadataWhileKeepingRouteImmutable()
    {
        var builtIn = MenuSetting.Create("module_payroll", "حقوق و اضافه کار", "/payroll/cycles", colorTheme: "emerald", badgeText: "امور مالی");
        _mockRepo.Setup(r => r.GetByKeyAsync("module_payroll", It.IsAny<CancellationToken>()))
            .ReturnsAsync(builtIn);
        _mockRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<MenuSetting> { builtIn });

        var request = new UpdateMenuSettingMetadataDto
        {
            Title = "سامانه حقوق پیشرفته",
            Route = "/attempted-route-change", // Should be ignored for built-in items
            Description = "توضیحات سفارشی ماژول",
            ColorTheme = "indigo",
            BadgeText = "بخش مالی سازمانی",
            IsVisible = true,
            DisplayOrder = 1
        };

        var result = await _service.UpdateSettingMetadataAsync("module_payroll", request, Guid.NewGuid());

        Assert.NotNull(result);
        Assert.Equal("سامانه حقوق پیشرفته", builtIn.Title);
        Assert.Equal("/payroll/cycles", builtIn.Route); // Route remains unchanged
        Assert.Equal("indigo", builtIn.ColorTheme);
        Assert.Equal("بخش مالی سازمانی", builtIn.BadgeText);
        Assert.Equal("توضیحات سفارشی ماژول", builtIn.Description);

        _mockRepo.Verify(r => r.UpdateAsync(builtIn, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteSettingAsync_CustomParent_CascadesDeleteToChildren()
    {
        var customParent = MenuSetting.Create("custom_links", "لینک‌های مفید", "/about");
        var customChild = MenuSetting.Create("custom_sublink", "درباره ما", "/about", parentKey: "custom_links");
        var all = DefaultMenuSettings.GetDefaults().Concat(new[] { customParent, customChild }).ToList();

        _mockRepo.Setup(r => r.GetByKeyAsync("custom_links", It.IsAny<CancellationToken>()))
            .ReturnsAsync(customParent);
        _mockRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(all);

        await _service.DeleteSettingAsync("custom_links", Guid.NewGuid());

        _mockRepo.Verify(r => r.DeleteRangeAsync(
            It.Is<IEnumerable<MenuSetting>>(items =>
                items.Any(i => i.MenuKey == "custom_links") &&
                items.Any(i => i.MenuKey == "custom_sublink")),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteSettingAsync_BuiltInItem_ThrowsInvalidOperationException()
    {
        var builtIn = MenuSetting.Create("module_tax_refund", "استرداد مالیات", "/refunds");
        _mockRepo.Setup(r => r.GetByKeyAsync("module_tax_refund", It.IsAny<CancellationToken>()))
            .ReturnsAsync(builtIn);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.DeleteSettingAsync("module_tax_refund", Guid.NewGuid()));
    }
}
