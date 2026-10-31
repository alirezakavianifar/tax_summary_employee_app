using FluentValidation;
using TaxSummary.Application.DTOs.Reporting;

namespace TaxSummary.Application.Validators.Reporting;

public class DynamicReportQueryRequestValidator : AbstractValidator<DynamicReportQueryRequestDto>
{
    public DynamicReportQueryRequestValidator()
    {
        RuleFor(x => x.DomainSource)
            .IsInEnum().WithMessage("منبع داده انتخاب‌شده نامعتبر است.");

        RuleFor(x => x.SelectedFields)
            .NotEmpty().WithMessage("حداقل یک ستون برای نمایش در گزارش باید انتخاب گردد.")
            .Must(fields => fields.Count <= 30).WithMessage("حداکثر ۳۰ ستون به صورت همزمان قابل انتخاب است.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 500).WithMessage("تعداد سطر در گزارش پویا حداکثر ۵۰۰ سطر می‌باشد.");

        RuleForEach(x => x.Filters).ChildRules(filter =>
        {
            filter.RuleFor(f => f.FieldName).NotEmpty().WithMessage("فیلد مورد نظر جهت فیلتر الزامی است.");
            filter.RuleFor(f => f.Operator).NotEmpty().WithMessage("عملگر مقایسه‌ای الزامی است.");
        });
    }
}
