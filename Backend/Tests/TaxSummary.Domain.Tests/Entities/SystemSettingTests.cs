using FluentAssertions;
using TaxSummary.Domain.Entities;
using Xunit;

namespace TaxSummary.Domain.Tests.Entities;

public class SystemSettingTests
{
    [Fact]
    public void CreateDefault_ShouldInitializeWithDefaultValues()
    {
        // Act
        var setting = SystemSetting.CreateDefault();

        // Assert
        setting.Should().NotBeNull();
        setting.SettingKey.Should().Be(SystemSetting.DefaultSettingKey);
        setting.OrganizationName.Should().Be("اداره کل امور مالیاتی استان خوزستان");
        setting.SystemTitle.Should().Be("سامانه یکپارچه امور سازمانی و مالیاتی");
        setting.LogoPath.Should().Be("/images/Intamedia_Logo.png");
        setting.ReportingModuleTitle.Should().Be("سامانه آمار و هوش تجاری");
        setting.ReportingModuleSubtitle.Should().Be("اداره کل امور مالیاتی استان خوزستان");
    }

    [Fact]
    public void UpdateBranding_ShouldUpdatePropertiesCorrectly()
    {
        // Arrange
        var setting = SystemSetting.CreateDefault();

        // Act
        setting.UpdateBranding(
            organizationName: "اداره کل امور مالیاتی استان تهران",
            systemTitle: "پرتال جامع خدمات مالیاتی",
            logoPath: "/uploads/branding/tehran_logo.png",
            reportingModuleTitle: "سامانه داشبورد و آمار",
            reportingModuleSubtitle: "اداره کل استان تهران",
            updatedBy: "admin"
        );

        // Assert
        setting.OrganizationName.Should().Be("اداره کل امور مالیاتی استان تهران");
        setting.SystemTitle.Should().Be("پرتال جامع خدمات مالیاتی");
        setting.LogoPath.Should().Be("/uploads/branding/tehran_logo.png");
        setting.ReportingModuleTitle.Should().Be("سامانه داشبورد و آمار");
        setting.ReportingModuleSubtitle.Should().Be("اداره کل استان تهران");
        setting.UpdatedBy.Should().Be("admin");
    }

    [Fact]
    public void ResetToDefaults_ShouldRestoreDefaultValues()
    {
        // Arrange
        var setting = SystemSetting.CreateDefault();
        setting.UpdateBranding(
            organizationName: "سازمان دیگر",
            systemTitle: "سامانه آزمایشی",
            logoPath: "/uploads/custom.png",
            reportingModuleTitle: "گزارشات",
            reportingModuleSubtitle: "زیرعنوان",
            updatedBy: "user1"
        );

        // Act
        setting.ResetToDefaults("admin_reset");

        // Assert
        setting.OrganizationName.Should().Be("اداره کل امور مالیاتی استان خوزستان");
        setting.SystemTitle.Should().Be("سامانه یکپارچه امور سازمانی و مالیاتی");
        setting.LogoPath.Should().Be("/images/Intamedia_Logo.png");
        setting.ReportingModuleTitle.Should().Be("سامانه آمار و هوش تجاری");
        setting.ReportingModuleSubtitle.Should().Be("اداره کل امور مالیاتی استان خوزستان");
        setting.UpdatedBy.Should().Be("admin_reset");
    }
}

