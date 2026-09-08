using FluentValidation;
using TaxSummary.Application.DTOs.TaxRefund;

namespace TaxSummary.Application.Validators.TaxRefund;

public class CreateRefundableReceiptAllocationValidator : AbstractValidator<CreateRefundableReceiptAllocationDto>
{
    public CreateRefundableReceiptAllocationValidator()
    {
        RuleFor(x => x.TaxRefundReceiptId)
            .NotEmpty().When(x => string.IsNullOrWhiteSpace(x.ReceiptNumber))
            .WithMessage("شناسه یا شماره قبض مرجع الزامی است");

        RuleFor(x => x.ReceiptNumber)
            .NotEmpty().WithMessage("شماره قبض الزامی است");

        RuleFor(x => x.TotalReceiptAmount)
            .GreaterThan(0).WithMessage("مبلغ مندرج در قبض باید بزرگتر از صفر باشد");

        RuleFor(x => x.RefundableAmount)
            .GreaterThan(0).WithMessage("مبلغ قابل استرداد باید بزرگتر از صفر باشد")
            .LessThanOrEqualTo(x => x.TotalReceiptAmount).WithMessage("مبلغ قابل استرداد نمی‌تواند بیشتر از کل مبلغ مندرج در قبض باشد");
    }
}

public class CreateTaxRefundLetterValidator : AbstractValidator<CreateTaxRefundLetterDto>
{
    public CreateTaxRefundLetterValidator()
    {
        RuleFor(x => x.LetterNumber)
            .NotEmpty().WithMessage("شماره نامه الزامی است")
            .MaximumLength(50).WithMessage("شماره نامه نمی‌تواند بیش از ۵۰ کاراکتر باشد");

        RuleFor(x => x.LetterDateJalali)
            .NotEmpty().WithMessage("تاریخ نامه الزامی است");

        RuleFor(x => x.DebtAmount)
            .GreaterThanOrEqualTo(0).WithMessage("مبلغ بدهی نمی‌تواند منفی باشد");
    }
}

public class TaxAssessmentInfoValidator : AbstractValidator<UpdateTaxAssessmentInfoDto>
{
    public TaxAssessmentInfoValidator()
    {
        RuleFor(x => x.AssessedIncome)
            .GreaterThanOrEqualTo(0).WithMessage("درآمد تشخیصی نمی‌تواند منفی باشد");

        RuleFor(x => x.Exemptions)
            .GreaterThanOrEqualTo(0).WithMessage("معافیت‌ها نمی‌تواند منفی باشد");

        RuleFor(x => x.AssessedTax)
            .GreaterThanOrEqualTo(0).WithMessage("مالیات تشخیصی نمی‌تواند منفی باشد");

        RuleFor(x => x.NonWaivablePenalties)
            .GreaterThanOrEqualTo(0).WithMessage("جرایم غیرقابل بخشش نمی‌تواند منفی باشد");

        RuleFor(x => x.TimelyPaymentBonus)
            .GreaterThanOrEqualTo(0).WithMessage("جایزه خوش‌حسابی نمی‌تواند منفی باشد");
    }
}

public class CalculateRefundRequestValidator : AbstractValidator<CalculateRefundRequestDto>
{
    public CalculateRefundRequestValidator()
    {
        RuleFor(x => x.AssessedIncome)
            .GreaterThanOrEqualTo(0).WithMessage("درآمد تشخیصی نمی‌تواند منفی باشد");

        RuleFor(x => x.AssessedTax)
            .GreaterThanOrEqualTo(0).WithMessage("مالیات تشخیصی نمی‌تواند منفی باشد");

        RuleFor(x => x.DelayMonths)
            .GreaterThanOrEqualTo(0).WithMessage("تعداد ماه تاخیر نمی‌تواند منفی باشد");
    }
}
