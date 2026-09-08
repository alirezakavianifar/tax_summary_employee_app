using FluentValidation;
using TaxSummary.Application.DTOs.TaxRefund;

namespace TaxSummary.Application.Validators.TaxRefund;

public class CreateTaxRefundReceiptValidator : AbstractValidator<CreateTaxRefundReceiptDto>
{
    public CreateTaxRefundReceiptValidator()
    {
        RuleFor(x => x.ReceiptNumber)
            .NotEmpty().WithMessage("شماره قبض پرداخت الزامی است")
            .MaximumLength(50).WithMessage("شماره قبض پرداخت نمی‌تواند بیش از ۵۰ کاراکتر باشد");

        RuleFor(x => x.AmountRials)
            .GreaterThan(0).WithMessage("مبلغ قبض پرداختی باید بزرگتر از صفر ریال باشد");

        RuleFor(x => x.IssueDateJalali)
            .NotEmpty().WithMessage("تاریخ صدور قبض الزامی است");

        RuleFor(x => x.PaymentDateJalali)
            .NotEmpty().WithMessage("تاریخ پرداخت قبض الزامی است");
    }
}
