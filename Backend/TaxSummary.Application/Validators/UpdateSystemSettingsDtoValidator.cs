using FluentValidation;
using TaxSummary.Application.DTOs.Branding;

namespace TaxSummary.Application.Validators;

public class UpdateSystemSettingsDtoValidator : AbstractValidator<UpdateSystemSettingsDto>
{
    public UpdateSystemSettingsDtoValidator()
    {
        RuleFor(x => x.OrganizationName)
            .NotEmpty().WithMessage("وارد کردن نام سازمان الزامی است")
            .MaximumLength(250).WithMessage("نام سازمان نمی‌تواند بیش از ۲۵۰ کاراکتر باشد");

        RuleFor(x => x.SystemTitle)
            .NotEmpty().WithMessage("وارد کردن عنوان سامانه الزامی است")
            .MaximumLength(250).WithMessage("عنوان سامانه نمی‌تواند بیش از ۲۵۰ کاراکتر باشد");

        RuleFor(x => x.ReportingModuleTitle)
            .NotEmpty().WithMessage("وارد کردن عنوان ماژول گزارش‌ها و هوش تجاری الزامی است")
            .MaximumLength(250).WithMessage("عنوان ماژول نمی‌تواند بیش از ۲۵۰ کاراکتر باشد");

        RuleFor(x => x.ReportingModuleSubtitle)
            .NotEmpty().WithMessage("وارد کردن زیرعنوان ماژول الزامی است")
            .MaximumLength(250).WithMessage("زیرعنوان ماژول نمی‌تواند بیش از ۲۵۰ کاراکتر باشد");

        RuleFor(x => x.FooterCopyrightText)
            .MaximumLength(500).WithMessage("متن کپی‌رایت فوتر نمی‌تواند بیش از ۵۰۰ کاراکتر باشد");

        RuleFor(x => x.FooterVersionText)
            .MaximumLength(50).WithMessage("عنوان نسخه فوتر نمی‌تواند بیش از ۵۰ کاراکتر باشد");

        RuleFor(x => x.FooterLinksJson)
            .MaximumLength(4000).WithMessage("داده‌های پیوندهای فوتر بیش از حد مجاز است");
    }
}

