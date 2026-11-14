namespace TaxSummary.Domain.Entities;

/// <summary>
/// Represents system-wide branding and organizational configurations.
/// </summary>
public class SystemSetting
{
    public const string DefaultSettingKey = "Branding";
    public const string DefaultOrganizationName = "اداره کل امور مالیاتی استان خوزستان";
    public const string DefaultSystemTitle = "سامانه یکپارچه امور سازمانی و مالیاتی";
    public const string DefaultLogoPath = "/images/Intamedia_Logo.png";
    public const string DefaultReportingModuleTitle = "سامانه آمار و هوش تجاری";
    public const string DefaultReportingModuleSubtitle = "اداره کل امور مالیاتی استان خوزستان";
    public const string DefaultFooterCopyrightText = "تمامی حقوق محفوظ است.";
    public const string DefaultFooterVersionText = "v2.0";
    public const string DefaultFooterLinksJson = "[{\"id\":\"link-about\",\"title\":\"راهنمای سامانه\",\"url\":\"/about\",\"isExternal\":false,\"isVisible\":true,\"order\":1},{\"id\":\"link-intamedia\",\"title\":\"پرتال سازمان امور مالیاتی\",\"url\":\"https://www.intamedia.ir\",\"isExternal\":true,\"isVisible\":true,\"order\":2},{\"id\":\"link-mytax\",\"title\":\"درگاه ملی خدمات مالیاتی\",\"url\":\"https://my.tax.gov.ir\",\"isExternal\":true,\"isVisible\":true,\"order\":3}]";

    public Guid Id { get; private set; }
    public string SettingKey { get; private set; } = DefaultSettingKey;
    public string OrganizationName { get; private set; } = DefaultOrganizationName;
    public string SystemTitle { get; private set; } = DefaultSystemTitle;
    public string LogoPath { get; private set; } = DefaultLogoPath;
    public string ReportingModuleTitle { get; private set; } = DefaultReportingModuleTitle;
    public string ReportingModuleSubtitle { get; private set; } = DefaultReportingModuleSubtitle;
    public string FooterCopyrightText { get; private set; } = DefaultFooterCopyrightText;
    public string FooterVersionText { get; private set; } = DefaultFooterVersionText;
    public string FooterLinksJson { get; private set; } = DefaultFooterLinksJson;
    public DateTime UpdatedAt { get; private set; } = DateTime.UtcNow;
    public string? UpdatedBy { get; private set; }

    private SystemSetting() { }

    public static SystemSetting CreateDefault()
    {
        return new SystemSetting
        {
            Id = Guid.NewGuid(),
            SettingKey = DefaultSettingKey,
            OrganizationName = DefaultOrganizationName,
            SystemTitle = DefaultSystemTitle,
            LogoPath = DefaultLogoPath,
            ReportingModuleTitle = DefaultReportingModuleTitle,
            ReportingModuleSubtitle = DefaultReportingModuleSubtitle,
            FooterCopyrightText = DefaultFooterCopyrightText,
            FooterVersionText = DefaultFooterVersionText,
            FooterLinksJson = DefaultFooterLinksJson,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public void UpdateBranding(
        string organizationName,
        string systemTitle,
        string? logoPath,
        string reportingModuleTitle,
        string reportingModuleSubtitle,
        string? footerCopyrightText,
        string? footerVersionText,
        string? footerLinksJson,
        string? updatedBy)
    {
        OrganizationName = string.IsNullOrWhiteSpace(organizationName) ? DefaultOrganizationName : organizationName.Trim();
        SystemTitle = string.IsNullOrWhiteSpace(systemTitle) ? DefaultSystemTitle : systemTitle.Trim();
        if (!string.IsNullOrWhiteSpace(logoPath))
        {
            LogoPath = logoPath.Trim();
        }
        ReportingModuleTitle = string.IsNullOrWhiteSpace(reportingModuleTitle) ? DefaultReportingModuleTitle : reportingModuleTitle.Trim();
        ReportingModuleSubtitle = string.IsNullOrWhiteSpace(reportingModuleSubtitle) ? DefaultReportingModuleSubtitle : reportingModuleSubtitle.Trim();
        FooterCopyrightText = footerCopyrightText != null ? footerCopyrightText.Trim() : DefaultFooterCopyrightText;
        FooterVersionText = footerVersionText != null ? footerVersionText.Trim() : string.Empty;
        if (!string.IsNullOrWhiteSpace(footerLinksJson))
        {
            FooterLinksJson = footerLinksJson.Trim();
        }
        UpdatedAt = DateTime.UtcNow;
        UpdatedBy = updatedBy;
    }

    public void UpdateLogo(string logoPath, string? updatedBy)
    {
        if (!string.IsNullOrWhiteSpace(logoPath))
        {
            LogoPath = logoPath.Trim();
            UpdatedAt = DateTime.UtcNow;
            UpdatedBy = updatedBy;
        }
    }

    public void ResetToDefaults(string? updatedBy)
    {
        OrganizationName = DefaultOrganizationName;
        SystemTitle = DefaultSystemTitle;
        LogoPath = DefaultLogoPath;
        ReportingModuleTitle = DefaultReportingModuleTitle;
        ReportingModuleSubtitle = DefaultReportingModuleSubtitle;
        FooterCopyrightText = DefaultFooterCopyrightText;
        FooterVersionText = DefaultFooterVersionText;
        FooterLinksJson = DefaultFooterLinksJson;
        UpdatedAt = DateTime.UtcNow;
        UpdatedBy = updatedBy;
    }
}

