using Microsoft.EntityFrameworkCore;
using TaxSummary.Application.DTOs.Office;
using TaxSummary.Application.Services;
using TaxSummary.Domain.Entities;
using TaxSummary.Infrastructure.Data;

namespace TaxSummary.Infrastructure.Services;

public class OfficeService : IOfficeService
{
    private readonly TaxSummaryDbContext _context;

    public OfficeService(TaxSummaryDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<IEnumerable<OfficeDto>> GetAllOfficesAsync(CancellationToken cancellationToken = default)
    {
        var offices = await _context.Offices
            .AsNoTracking()
            .Include(o => o.Employees)
            .OrderBy(o => o.Code)
            .ToListAsync(cancellationToken);

        return offices.Select(o => new OfficeDto
        {
            Id = o.Id,
            Code = o.Code,
            Name = o.Name,
            Description = o.Description,
            IsActive = o.IsActive,
            EmployeeCount = o.Employees.Count,
            CreatedAt = o.CreatedAt
        });
    }

    public async Task<OfficeDto?> GetOfficeByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var office = await _context.Offices
            .AsNoTracking()
            .Include(o => o.Employees)
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);

        if (office == null) return null;

        return new OfficeDto
        {
            Id = office.Id,
            Code = office.Code,
            Name = office.Name,
            Description = office.Description,
            IsActive = office.IsActive,
            EmployeeCount = office.Employees.Count,
            CreatedAt = office.CreatedAt
        };
    }

    public async Task<OfficeDto> CreateOfficeAsync(CreateOfficeRequestDto dto, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Code))
            throw new ArgumentException("کد اداره الزامی است", nameof(dto.Code));

        var normalizedCode = dto.Code.Trim();
        var exists = await _context.Offices.AnyAsync(o => o.Code.ToLower() == normalizedCode.ToLower(), cancellationToken);
        if (exists)
            throw new InvalidOperationException($"اداره با کد '{normalizedCode}' قبلاً ثبت شده است");

        var office = Office.Create(normalizedCode, dto.Name, dto.Description);
        await _context.Offices.AddAsync(office, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return new OfficeDto
        {
            Id = office.Id,
            Code = office.Code,
            Name = office.Name,
            Description = office.Description,
            IsActive = office.IsActive,
            EmployeeCount = 0,
            CreatedAt = office.CreatedAt
        };
    }

    public async Task<OfficeDto?> UpdateOfficeAsync(Guid id, UpdateOfficeRequestDto dto, CancellationToken cancellationToken = default)
    {
        var office = await _context.Offices
            .Include(o => o.Employees)
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);

        if (office == null) return null;

        office.Update(dto.Name, dto.Description, dto.IsActive);
        await _context.SaveChangesAsync(cancellationToken);

        return new OfficeDto
        {
            Id = office.Id,
            Code = office.Code,
            Name = office.Name,
            Description = office.Description,
            IsActive = office.IsActive,
            EmployeeCount = office.Employees.Count,
            CreatedAt = office.CreatedAt
        };
    }
}
