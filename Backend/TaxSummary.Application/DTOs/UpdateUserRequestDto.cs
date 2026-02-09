using System.ComponentModel.DataAnnotations;

namespace TaxSummary.Application.DTOs;

public class UpdateUserRequestDto
{
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public Guid? EmployeeId { get; set; }
    public bool IsActive { get; set; }
}
