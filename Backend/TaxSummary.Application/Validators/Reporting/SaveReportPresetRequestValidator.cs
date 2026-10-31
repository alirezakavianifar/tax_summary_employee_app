using System.Text.Json;
using FluentValidation;
using TaxSummary.Application.DTOs.Reporting;

namespace TaxSummary.Application.Validators.Reporting;

public class SaveReportPresetRequestValidator : AbstractValidator<SaveReportPresetRequestDto>
{
    public SaveReportPresetRequestValidator()
    {
        RuleFor(x => x.ReportDefinitionId)
            .NotEmpty().WithMessage("شناسه گزارش پایه الزامی است.");

        RuleFor(x => x.PresetName)
            .NotEmpty().WithMessage("عنوان الگوی ذخیره‌شده نمی‌تواند خالی باشد.")
            .MaximumLength(128).WithMessage("عنوان الگو حداکثر می‌تواند ۱۲۸ کاراکتر باشد.");

        RuleFor(x => x.FilterCriteriaJson)
            .NotEmpty().WithMessage("پارامترهای فیلتر الزامی است.")
            .Must(IsValidJson).WithMessage("ساختار پارامترهای فیلتر معتبر نمی‌باشد.");
    }

    private static bool IsValidJson(string json)
    {
        if (string.IsNullOrWhiteSpace(json)) return false;
        try
        {
            JsonDocument.Parse(json);
            return true;
        }
        catch
        {
            return false;
        }
    }
}
