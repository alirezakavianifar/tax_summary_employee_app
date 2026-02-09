using FluentValidation;
using TaxSummary.Application.DTOs.Auth;

namespace TaxSummary.Application.Validators.Auth;

/// <summary>
/// Validator for login requests
/// </summary>
public class LoginRequestValidator : AbstractValidator<LoginRequestDto>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty()
            .WithMessage("نام کاربری الزامی است")
            .MaximumLength(100)
            .WithMessage("نام کاربری نباید بیشتر از 100 کاراکتر باشد");

        RuleFor(x => x.Password)
            .NotEmpty()
            .WithMessage("رمز عبور الزامی است");
    }
}
