using FluentValidation;
using TaxSummary.Application.DTOs.Reporting;

namespace TaxSummary.Application.Validators.Reporting;

public class ReportFilterParametersValidator : AbstractValidator<ReportFilterParametersDto>
{
    public ReportFilterParametersValidator()
    {
        RuleFor(x => x.PageNumber)
            .GreaterThan(0).WithMessage("شماره صفحه باید بزرگتر از صفر باشد.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 200).WithMessage("تعداد سطر در هر صفحه باید بین ۱ تا ۲۰۰ باشد.");

        When(x => !string.IsNullOrWhiteSpace(x.ShamsiDateFrom), () =>
        {
            RuleFor(x => x.ShamsiDateFrom)
                .Matches(@"^\d{4}/\d{2}/\d{2}$")
                .WithMessage("فرمت تاریخ شروع نامعتبر است. الگوی مجاز: ۱۴۰۴/۰۷/۰۱");
        });

        When(x => !string.IsNullOrWhiteSpace(x.ShamsiDateTo), () =>
        {
            RuleFor(x => x.ShamsiDateTo)
                .Matches(@"^\d{4}/\d{2}/\d{2}$")
                .WithMessage("فرمت تاریخ پایان نامعتبر است. الگوی مجاز: ۱۴۰۴/۰۷/۳۰");
        });
    }
}
