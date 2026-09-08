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
            .EmailAddress()
            .WithMessage("فرمت ایمیل معتبر نیست")
            .MaximumLength(100)
            .WithMessage("ایمیل نباید بیشتر از 100 کاراکتر باشد")
            .When(x => !string.IsNullOrWhiteSpace(x.Email));

        RuleFor(x => x.Password)
            .MinimumLength(6)
            .WithMessage("رمز عبور باید حداقل 6 کاراکتر باشد")
            .When(x => !string.IsNullOrWhiteSpace(x.Password));

        RuleFor(x => x.Role)
            .NotEmpty()
            .WithMessage("نقش کاربری الزامی است")
            .Must(BeValidRole)
            .WithMessage("نقش کاربری نامعتبر است. نقش‌های معتبر: Admin، OfficeHead، GroupHead، Expert، ITSpecialist");
    }

    private static readonly HashSet<string> ValidRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        "Admin", "OfficeHead", "GroupHead", "Expert", "ITSpecialist", "Manager", "Employee"
    };

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
        return ValidRoles.Contains(role);
    }
}
