using System.ComponentModel.DataAnnotations;

namespace TaxSummary.Application.DTOs;

public class UpdateUserRequestDto
{
    public string? Username { get; set; }
    public string? Email { get; set; }
    public string Role { get; set; } = string.Empty;
    public Guid? EmployeeId { get; set; }
    public bool IsActive { get; set; }
    public List<Guid>? OfficeIds { get; set; }
}
