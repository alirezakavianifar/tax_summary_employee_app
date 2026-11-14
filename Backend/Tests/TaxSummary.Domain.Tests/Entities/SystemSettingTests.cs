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
        setting.FooterCopyrightText.Should().Be("تمامی حقوق محفوظ است.");
        setting.FooterVersionText.Should().Be("v2.0");
        setting.FooterLinksJson.Should().NotBeNullOrWhiteSpace();
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
            footerCopyrightText: "حقوق نشر محفوظ برای استان تهران",
            footerVersionText: "v3.0",
            footerLinksJson: "[]",
            updatedBy: "admin"
        );

        // Assert
        setting.OrganizationName.Should().Be("اداره کل امور مالیاتی استان تهران");
        setting.SystemTitle.Should().Be("پرتال جامع خدمات مالیاتی");
        setting.LogoPath.Should().Be("/uploads/branding/tehran_logo.png");
        setting.ReportingModuleTitle.Should().Be("سامانه داشبورد و آمار");
        setting.ReportingModuleSubtitle.Should().Be("اداره کل استان تهران");
        setting.FooterCopyrightText.Should().Be("حقوق نشر محفوظ برای استان تهران");
        setting.FooterVersionText.Should().Be("v3.0");
        setting.FooterLinksJson.Should().Be("[]");
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
            footerCopyrightText: "متن دلخواه",
            footerVersionText: "v9.9",
            footerLinksJson: "[{\"id\":\"1\"}]",
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
        setting.FooterCopyrightText.Should().Be("تمامی حقوق محفوظ است.");
        setting.FooterVersionText.Should().Be("v2.0");
        setting.UpdatedBy.Should().Be("admin_reset");
    }
}

