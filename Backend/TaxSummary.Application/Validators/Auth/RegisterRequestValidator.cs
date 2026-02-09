using FluentValidation;
using TaxSummary.Application.DTOs.Auth;
using System.Text.RegularExpressions;

namespace TaxSummary.Application.Validators.Auth;

/// <summary>
/// Validator for user registration requests
/// </summary>
public class RegisterRequestValidator : AbstractValidator<RegisterRequestDto>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty()
            .WithMessage("نام کاربری الزامی است")
            .Length(3, 50)
            .WithMessage("نام کاربری باید بین 3 تا 50 کاراکتر باشد")
            .Matches(@"^[a-zA-Z0-9._-]+$")
            .WithMessage("نام کاربری فقط می‌تواند شامل حروف انگلیسی، اعداد، نقطه، خط تیره و زیرخط باشد");

        RuleFor(x => x.Email)
            .NotEmpty()
            .WithMessage("ایمیل الزامی است")
            .EmailAddress()
            .WithMessage("فرمت ایمیل معتبر نیست")
            .MaximumLength(100)
            .WithMessage("ایمیل نباید بیشتر از 100 کاراکتر باشد");

        RuleFor(x => x.Password)
            .NotEmpty()
            .WithMessage("رمز عبور الزامی است")
            .MinimumLength(8)
            .WithMessage("رمز عبور باید حداقل 8 کاراکتر باشد")
            .Must(HaveComplexity)
            .WithMessage("رمز عبور باید شامل حداقل یک حرف بزرگ، یک حرف کوچک، یک عدد و یک کاراکتر خاص باشد");

        RuleFor(x => x.Role)
            .NotEmpty()
            .WithMessage("نقش کاربری الزامی است")
            .Must(BeValidRole)
            .WithMessage("نقش کاربری باید یکی از مقادیر Admin، Manager یا Employee باشد");
    }

    private bool HaveComplexity(string password)
    {
        if (string.IsNullOrWhiteSpace(password))
            return false;

        var hasUpperCase = Regex.IsMatch(password, @"[A-Z]");
        var hasLowerCase = Regex.IsMatch(password, @"[a-z]");
        var hasDigit = Regex.IsMatch(password, @"\d");
        var hasSpecialChar = Regex.IsMatch(password, @"[^a-zA-Z0-9]");

        return hasUpperCase && hasLowerCase && hasDigit && hasSpecialChar;
    }

    private bool BeValidRole(string role)
    {
        return role == "Admin" || role == "Manager" || role == "Employee";
    }
}
