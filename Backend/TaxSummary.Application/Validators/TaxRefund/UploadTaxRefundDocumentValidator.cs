using FluentValidation;
using TaxSummary.Application.DTOs.TaxRefund;

namespace TaxSummary.Application.Validators.TaxRefund;

/// <summary>
/// FluentValidation validator for UploadTaxRefundDocumentDto
/// </summary>
public class UploadTaxRefundDocumentValidator : AbstractValidator<UploadTaxRefundDocumentDto>
{
    public UploadTaxRefundDocumentValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("عنوان سند الزامی است")
            .MaximumLength(200).WithMessage("عنوان سند نمی‌تواند بیش از ۲۰۰ نویسه باشد");

        RuleFor(x => x.DocumentType)
            .IsInEnum().WithMessage("نوع سند پیوست نامعتبر است");

        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("توضیحات نمی‌تواند بیش از ۱۰۰۰ نویسه باشد")
            .When(x => !string.IsNullOrEmpty(x.Description));
    }
}
