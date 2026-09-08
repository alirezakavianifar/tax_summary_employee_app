using FluentValidation;
using TaxSummary.Application.DTOs.TaxRefund;
using TaxSummary.Domain.ValueObjects;

namespace TaxSummary.Application.Validators.TaxRefund;

public class CreateTaxRefundCaseValidator : AbstractValidator<CreateTaxRefundCaseDto>
{
    public CreateTaxRefundCaseValidator()
    {
        RuleFor(x => x.TaxpayerName)
            .NotEmpty().WithMessage("عنوان مودی الزامی است")
            .MaximumLength(200).WithMessage("عنوان مودی نمی‌تواند بیش از ۲۰۰ کاراکتر باشد");

        RuleFor(x => x.EconomicCode)
            .NotEmpty().WithMessage("شماره اقتصادی الزامی است")
            .Must(BeValidEconomicCode).WithMessage("شماره اقتصادی نامعتبر است (باید بین ۱۰ تا ۱۴ رقم باشد)");

        RuleFor(x => x.ShebaNumber)
            .NotEmpty().WithMessage("شماره شبا الزامی است")
            .Must(BeValidSheba).WithMessage("شماره شبا نامعتبر است (باید شامل IR و ۲۴ رقم باشد)");

        RuleFor(x => x.BankName)
            .NotEmpty().WithMessage("نام بانک مودی الزامی است")
            .MaximumLength(100).WithMessage("نام بانک نمی‌تواند بیش از ۱۰۰ کاراکتر باشد");

        RuleFor(x => x.TaxUnitCode)
            .NotEmpty().WithMessage("کد واحد مالیاتی الزامی است")
            .MaximumLength(50).WithMessage("کد واحد مالیاتی نمی‌تواند بیش از ۵۰ کاراکتر باشد");

        RuleFor(x => x.Province)
            .NotEmpty().WithMessage("استان الزامی است")
            .MaximumLength(100).WithMessage("نام استان نمی‌تواند بیش از ۱۰۰ کاراکتر باشد");

        RuleFor(x => x.City)
            .NotEmpty().WithMessage("شهرستان الزامی است")
            .MaximumLength(100).WithMessage("نام شهرستان نمی‌تواند بیش از ۱۰۰ کاراکتر باشد");

        RuleFor(x => x.TaxYear)
            .InclusiveBetween(1300, 1500).WithMessage("سال استرداد باید بین ۱۳۰۰ تا ۱۵۰۰ باشد");

        RuleFor(x => x.Period)
            .InclusiveBetween(1, 4).WithMessage("دوره مالیاتی باید بین ۱ تا ۴ باشد");

        RuleFor(x => x.RefundReason)
            .NotEmpty().WithMessage("علت استرداد الزامی است")
            .MaximumLength(500).WithMessage("علت استرداد نمی‌تواند بیش از ۵۰۰ کاراکتر باشد");

        RuleFor(x => x.AdministrationHeadName)
            .NotEmpty().WithMessage("نام رئیس امور مالیاتی الزامی است")
            .MaximumLength(150).WithMessage("نام رئیس امور نمی‌تواند بیش از ۱۵۰ کاراکتر باشد");

        RuleFor(x => x.GroupHeadName)
            .NotEmpty().WithMessage("نام رئیس گروه مالیاتی الزامی است")
            .MaximumLength(150).WithMessage("نام رئیس گروه نمی‌تواند بیش از ۱۵۰ کاراکتر باشد");

        RuleFor(x => x.SeniorAuditorName)
            .NotEmpty().WithMessage("نام کارشناس ارشد مالیاتی الزامی است")
            .MaximumLength(150).WithMessage("نام کارشناس ارشد نمی‌تواند بیش از ۱۵۰ کاراکتر باشد");
    }

    private bool BeValidEconomicCode(string economicCode)
    {
        if (string.IsNullOrWhiteSpace(economicCode)) return false;
        var normalized = EconomicCode.NormalizeDigits(economicCode.Trim());
        return normalized.Length >= 10 && normalized.Length <= 14 && normalized.All(char.IsDigit);
    }

    private bool BeValidSheba(string sheba)
    {
        if (string.IsNullOrWhiteSpace(sheba)) return false;
        var normalized = sheba.Trim().Replace(" ", "").Replace("-", "");
        return normalized.StartsWith("IR", StringComparison.OrdinalIgnoreCase) && normalized.Length >= 20;
    }
}

public class UpdateTaxRefundCaseValidator : AbstractValidator<UpdateTaxRefundCaseDto>
{
    public UpdateTaxRefundCaseValidator()
    {
        RuleFor(x => x.TaxpayerName)
            .NotEmpty().WithMessage("عنوان مودی الزامی است")
            .MaximumLength(200).WithMessage("عنوان مودی نمی‌تواند بیش از ۲۰۰ کاراکتر باشد");

        RuleFor(x => x.EconomicCode)
            .NotEmpty().WithMessage("شماره اقتصادی الزامی است");

        RuleFor(x => x.ShebaNumber)
            .NotEmpty().WithMessage("شماره شبا الزامی است");

        RuleFor(x => x.BankName)
            .NotEmpty().WithMessage("نام بانک مودی الزامی است");
    }
}
