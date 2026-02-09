using FluentValidation;
using TaxSummary.Application.DTOs.Auth;
using System.Text.RegularExpressions;

namespace TaxSummary.Application.Validators.Auth;

/// <summary>
/// Validator for password change requests
/// </summary>
public class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequestDto>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(x => x.CurrentPassword)
            .NotEmpty()
            .WithMessage("رمز عبور فعلی الزامی است");

        RuleFor(x => x.NewPassword)
            .NotEmpty()
            .WithMessage("رمز عبور جدید الزامی است")
            .MinimumLength(8)
            .WithMessage("رمز عبور جدید باید حداقل 8 کاراکتر باشد")
            .Must(HaveComplexity)
            .WithMessage("رمز عبور جدید باید شامل حداقل یک حرف بزرگ، یک حرف کوچک، یک عدد و یک کاراکتر خاص باشد");

        RuleFor(x => x)
            .Must(x => x.CurrentPassword != x.NewPassword)
            .WithMessage("رمز عبور جدید نباید با رمز عبور فعلی یکسان باشد")
            .When(x => !string.IsNullOrEmpty(x.CurrentPassword) && !string.IsNullOrEmpty(x.NewPassword));
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
}
