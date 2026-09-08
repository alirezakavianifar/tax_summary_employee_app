using System.ComponentModel.DataAnnotations;

namespace TaxSummary.Application.DTOs.Auth;

/// <summary>
/// DTO for admin password reset request
/// </summary>
public class ResetPasswordRequestDto
{
    [Required(ErrorMessage = "رمز عبور جدید الزامی است")]
    [MinLength(6, ErrorMessage = "رمز عبور باید حداقل ۶ کاراکتر باشد")]
    public string NewPassword { get; set; } = string.Empty;
}
