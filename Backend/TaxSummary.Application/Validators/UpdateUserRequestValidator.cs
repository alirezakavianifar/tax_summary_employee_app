using FluentValidation;
using TaxSummary.Application.DTOs;

namespace TaxSummary.Application.Validators;

public class UpdateUserRequestValidator : AbstractValidator<UpdateUserRequestDto>
{
    public UpdateUserRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("ایمیل الزامی است")
            .EmailAddress().WithMessage("فرمت ایمیل نامعتبر است");

        RuleFor(x => x.Role)
            .NotEmpty().WithMessage("نقش کاربری الزامی است")
            .Must(role => new[] { "Admin", "Manager", "Employee" }.Contains(role))
            .WithMessage("نقش کاربری نامعتبر است");
    }
}
