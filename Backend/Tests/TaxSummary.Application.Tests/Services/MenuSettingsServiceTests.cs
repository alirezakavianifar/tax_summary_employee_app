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
                    AllowedRoles = new List<string> { "Admin", "Manager" }
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
                s.AllowedRoles == "Admin,Manager")),
            It.IsAny<CancellationToken>()), Times.Once);

        var updatedPayroll = result.FirstOrDefault(s => s.MenuKey == "module_payroll");
        Assert.NotNull(updatedPayroll);
        Assert.True(updatedPayroll.IsVisible);
        Assert.Contains("Manager", updatedPayroll.AllowedRoles);
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
}
