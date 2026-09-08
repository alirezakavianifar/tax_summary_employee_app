using FluentValidation;
using TaxSummary.Application.DTOs;

namespace TaxSummary.Application.Validators;

public class UpdateUserRequestValidator : AbstractValidator<UpdateUserRequestDto>
{
    private static readonly string[] ValidRoles = new[]
    {
        "Admin", "OfficeHead", "GroupHead", "Expert", "ITSpecialist", "Manager", "Employee"
    };

    public UpdateUserRequestValidator()
    {
        RuleFor(x => x.Username)
            .Length(3, 50).WithMessage("نام کاربری باید بین ۳ تا ۵۰ کاراکتر باشد")
            .Matches(@"^[a-zA-Z0-9._-]+$").WithMessage("نام کاربری فقط می‌تواند شامل حروف، اعداد یا خط تیره باشد")
            .When(x => !string.IsNullOrWhiteSpace(x.Username));

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("فرمت ایمیل نامعتبر است")
            .When(x => !string.IsNullOrWhiteSpace(x.Email));

        RuleFor(x => x.Role)
            .NotEmpty().WithMessage("نقش کاربری الزامی است")
            .Must(role => ValidRoles.Contains(role, StringComparer.OrdinalIgnoreCase))
            .WithMessage("نقش کاربری نامعتبر است");
    }
}
