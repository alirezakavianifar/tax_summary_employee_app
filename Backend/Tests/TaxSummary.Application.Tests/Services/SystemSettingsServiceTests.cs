using AutoMapper;
using FluentAssertions;
using FluentValidation;
using Microsoft.Extensions.Logging;
using Moq;
using TaxSummary.Application.DTOs.Branding;
using TaxSummary.Application.Mapping;
using TaxSummary.Application.Services;
using TaxSummary.Application.Validators;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Interfaces;
using Xunit;

namespace TaxSummary.Application.Tests.Services;

public class SystemSettingsServiceTests
{
    private readonly Mock<ISystemSettingsRepository> _mockRepo;
    private readonly Mock<IFileStorageService> _mockFileStorage;
    private readonly IMapper _mapper;
    private readonly IValidator<UpdateSystemSettingsDto> _validator;
    private readonly Mock<ILogger<SystemSettingsService>> _mockLogger;
    private readonly SystemSettingsService _service;

    public SystemSettingsServiceTests()
    {
        _mockRepo = new Mock<ISystemSettingsRepository>();
        _mockFileStorage = new Mock<IFileStorageService>();

        var config = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<MappingProfile>();
        });
        _mapper = config.CreateMapper();
        _validator = new UpdateSystemSettingsDtoValidator();
        _mockLogger = new Mock<ILogger<SystemSettingsService>>();

        _service = new SystemSettingsService(
            _mockRepo.Object,
            _mockFileStorage.Object,
            _mapper,
            _validator,
            _mockLogger.Object
        );
    }

    [Fact]
    public async Task GetBrandingSettingsAsync_ShouldReturnDefaultBranding()
    {
        // Arrange
        var setting = SystemSetting.CreateDefault();
        _mockRepo.Setup(r => r.GetOrCreateDefaultAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(setting);

        // Act
        var result = await _service.GetBrandingSettingsAsync();

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.OrganizationName.Should().Be("اداره کل امور مالیاتی استان خوزستان");
        result.Value.SystemTitle.Should().Be("سامانه یکپارچه امور سازمانی و مالیاتی");
    }

    [Fact]
    public async Task UpdateBrandingSettingsAsync_WithValidData_ShouldUpdateAndReturnSuccess()
    {
        // Arrange
        var setting = SystemSetting.CreateDefault();
        _mockRepo.Setup(r => r.GetOrCreateDefaultAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(setting);

        var request = new UpdateSystemSettingsDto
        {
            OrganizationName = "اداره کل امور مالیاتی استان اصفهان",
            SystemTitle = "سامانه هوشمند مالیاتی",
            ReportingModuleTitle = "سامانه گزارشات",
            ReportingModuleSubtitle = "اداره کل اصفهان",
            FooterCopyrightText = "تمامی حقوق استان اصفهان محفوظ است",
            FooterVersionText = "v2.5",
            FooterLinksJson = "[{\"id\":\"link-1\",\"title\":\"تست\",\"url\":\"/test\",\"isExternal\":false,\"isVisible\":true,\"order\":1}]"
        };

        // Act
        var result = await _service.UpdateBrandingSettingsAsync(request, "admin");

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.OrganizationName.Should().Be("اداره کل امور مالیاتی استان اصفهان");
        result.Value.FooterCopyrightText.Should().Be("تمامی حقوق استان اصفهان محفوظ است");
        result.Value.FooterVersionText.Should().Be("v2.5");
        result.Value.FooterLinks.Should().HaveCount(1);
        result.Value.FooterLinks[0].Title.Should().Be("تست");
        _mockRepo.Verify(r => r.UpdateAsync(It.IsAny<SystemSetting>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateBrandingSettingsAsync_WithEmptyOrgName_ShouldReturnValidationError()
    {
        // Arrange
        var request = new UpdateSystemSettingsDto
        {
            OrganizationName = "",
            SystemTitle = "سامانه",
            ReportingModuleTitle = "گزارشات",
            ReportingModuleSubtitle = "زیرعنوان"
        };

        // Act
        var result = await _service.UpdateBrandingSettingsAsync(request, "admin");

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("وارد کردن نام سازمان الزامی است");
    }

    [Fact]
    public async Task ResetToDefaultsAsync_ShouldRestoreDefaultValues()
    {
        // Arrange
        var setting = SystemSetting.CreateDefault();
        setting.UpdateBranding("نام تغییر یافته", "عنوان تغییر یافته", null, "گزارشات", "زیرعنوان", "متن کپی‌رایت", "v9.0", "[]", "test");
        _mockRepo.Setup(r => r.GetOrCreateDefaultAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(setting);

        // Act
        var result = await _service.ResetToDefaultsAsync("admin");

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.OrganizationName.Should().Be("اداره کل امور مالیاتی استان خوزستان");
        result.Value.FooterCopyrightText.Should().Be("تمامی حقوق محفوظ است.");
        result.Value.FooterVersionText.Should().Be("v2.0");
        _mockRepo.Verify(r => r.UpdateAsync(It.IsAny<SystemSetting>(), It.IsAny<CancellationToken>()), Times.Once);
    }
}

