namespace TaxSummary.Application.DTOs.Branding;

public class FooterLinkDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public bool IsExternal { get; set; }
    public bool IsVisible { get; set; } = true;
    public int Order { get; set; }
}

public class SystemSettingsDto
{
    public Guid Id { get; set; }
    public string SettingKey { get; set; } = string.Empty;
    public string OrganizationName { get; set; } = string.Empty;
    public string SystemTitle { get; set; } = string.Empty;
    public string LogoPath { get; set; } = string.Empty;
    public string ReportingModuleTitle { get; set; } = string.Empty;
    public string ReportingModuleSubtitle { get; set; } = string.Empty;
    public string FooterCopyrightText { get; set; } = string.Empty;
    public string FooterVersionText { get; set; } = string.Empty;
    public string FooterBadgeText { get; set; } = string.Empty;
    public string FooterLinksJson { get; set; } = string.Empty;
    public List<FooterLinkDto> FooterLinks { get; set; } = new();
    public DateTime UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}

public class UpdateSystemSettingsDto
{
    public string OrganizationName { get; set; } = string.Empty;
    public string SystemTitle { get; set; } = string.Empty;
    public string? LogoPath { get; set; }
    public string ReportingModuleTitle { get; set; } = string.Empty;
    public string ReportingModuleSubtitle { get; set; } = string.Empty;
    public string? FooterCopyrightText { get; set; }
    public string? FooterVersionText { get; set; }
    public string? FooterBadgeText { get; set; }
    public string? FooterLinksJson { get; set; }
}

