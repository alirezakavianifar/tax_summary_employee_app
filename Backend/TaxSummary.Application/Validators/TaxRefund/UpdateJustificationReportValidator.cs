using FluentValidation;
using TaxSummary.Application.DTOs.TaxRefund;

namespace TaxSummary.Application.Validators.TaxRefund;

public class UpdateJustificationReportValidator : AbstractValidator<UpdateJustificationReportDto>
{
    public UpdateJustificationReportValidator()
    {
        RuleFor(x => x.ReportNumber)
            .NotEmpty().WithMessage("شماره گزارش توجیهی الزامی است")
            .MaximumLength(50).WithMessage("شماره گزارش توجیهی نمی‌تواند بیش از ۵۰ کاراکتر باشد");

        RuleFor(x => x.ReportDateJalali)
            .NotEmpty().WithMessage("تاریخ تنظیم گزارش توجیهی الزامی است");

        RuleFor(x => x.RecommendedRefundAmount)
            .GreaterThanOrEqualTo(0).WithMessage("مبلغ پیشنهادی استرداد نمی‌تواند منفی باشد");
    }
}
