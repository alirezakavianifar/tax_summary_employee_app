using TaxSummary.Application.DTOs.Office;

namespace TaxSummary.Application.Services;

public interface IOfficeService
{
    Task<IEnumerable<OfficeDto>> GetAllOfficesAsync(CancellationToken cancellationToken = default);
    Task<OfficeDto?> GetOfficeByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<OfficeDto> CreateOfficeAsync(CreateOfficeRequestDto dto, CancellationToken cancellationToken = default);
    Task<OfficeDto?> UpdateOfficeAsync(Guid id, UpdateOfficeRequestDto dto, CancellationToken cancellationToken = default);
}
