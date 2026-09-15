using TaxSummary.Application.DTOs.Roles;
using TaxSummary.Domain.Common;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Interfaces;

namespace TaxSummary.Application.Services;

public class RoleService : IRoleService
{
    private readonly IRoleRepository _roleRepository;

    public RoleService(IRoleRepository roleRepository)
    {
        _roleRepository = roleRepository ?? throw new ArgumentNullException(nameof(roleRepository));
    }

    public async Task<Result<IEnumerable<RoleDto>>> GetActiveRolesAsync(CancellationToken cancellationToken = default)
    {
        var rolesResult = await _roleRepository.GetAllAsync(includeInactive: false, cancellationToken);
        if (rolesResult.IsFailure)
            return Result.Failure<IEnumerable<RoleDto>>(rolesResult.Error);

        var dtos = rolesResult.Value.Select(r => new RoleDto
        {
            Id = r.Id,
            Name = r.Name,
            Title = r.Title,
            Description = r.Description,
            IsSystemRole = r.IsSystemRole,
            IsActive = r.IsActive,
            DisplayOrder = r.DisplayOrder,
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt
        });

        return Result.Success(dtos);
    }

    public async Task<Result<IEnumerable<RoleDto>>> GetAllRolesForManagementAsync(CancellationToken cancellationToken = default)
    {
        var rolesResult = await _roleRepository.GetAllAsync(includeInactive: true, cancellationToken);
        if (rolesResult.IsFailure)
            return Result.Failure<IEnumerable<RoleDto>>(rolesResult.Error);

        var dtoList = new List<RoleDto>();
        foreach (var r in rolesResult.Value)
        {
            var count = await _roleRepository.GetUserCountByRoleNameAsync(r.Name, cancellationToken);
            dtoList.Add(new RoleDto
            {
                Id = r.Id,
                Name = r.Name,
                Title = r.Title,
                Description = r.Description,
                IsSystemRole = r.IsSystemRole,
                IsActive = r.IsActive,
                DisplayOrder = r.DisplayOrder,
                UserCount = count,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt
            });
        }

        return Result.Success<IEnumerable<RoleDto>>(dtoList);
    }

    public async Task<Result<RoleDto>> GetRoleByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var roleResult = await _roleRepository.GetByIdAsync(id, cancellationToken);
        if (roleResult.IsFailure)
            return Result.Failure<RoleDto>(roleResult.Error);

        var role = roleResult.Value;
        var count = await _roleRepository.GetUserCountByRoleNameAsync(role.Name, cancellationToken);

        return Result.Success(new RoleDto
        {
            Id = role.Id,
            Name = role.Name,
            Title = role.Title,
            Description = role.Description,
            IsSystemRole = role.IsSystemRole,
            IsActive = role.IsActive,
            DisplayOrder = role.DisplayOrder,
            UserCount = count,
            CreatedAt = role.CreatedAt,
            UpdatedAt = role.UpdatedAt
        });
    }

    public async Task<Result<RoleDto>> CreateRoleAsync(CreateRoleRequestDto request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return Result.Failure<RoleDto>("کد انگلیسی نقش نمی‌تواند خالی باشد");

        if (string.IsNullOrWhiteSpace(request.Title))
            return Result.Failure<RoleDto>("عنوان فارسی نقش نمی‌تواند خالی باشد");

        var normalizedName = request.Name.Trim();
        if (await _roleRepository.ExistsByNameAsync(normalizedName, cancellationToken))
            return Result.Failure<RoleDto>($"نقش با کد '{normalizedName}' قبلاً تعریف شده است");

        var role = Role.Create(
            normalizedName,
            request.Title.Trim(),
            request.Description?.Trim(),
            isSystemRole: false,
            isActive: true,
            displayOrder: request.DisplayOrder);

        var addResult = await _roleRepository.AddAsync(role, cancellationToken);
        if (addResult.IsFailure)
            return Result.Failure<RoleDto>(addResult.Error);

        return Result.Success(new RoleDto
        {
            Id = role.Id,
            Name = role.Name,
            Title = role.Title,
            Description = role.Description,
            IsSystemRole = role.IsSystemRole,
            IsActive = role.IsActive,
            DisplayOrder = role.DisplayOrder,
            UserCount = 0,
            CreatedAt = role.CreatedAt,
            UpdatedAt = role.UpdatedAt
        });
    }

    public async Task<Result<RoleDto>> UpdateRoleAsync(Guid id, UpdateRoleRequestDto request, CancellationToken cancellationToken = default)
    {
        var roleResult = await _roleRepository.GetByIdAsync(id, cancellationToken);
        if (roleResult.IsFailure)
            return Result.Failure<RoleDto>(roleResult.Error);

        var role = roleResult.Value;

        if (string.IsNullOrWhiteSpace(request.Title))
            return Result.Failure<RoleDto>("عنوان فارسی نقش نمی‌تواند خالی باشد");

        role.Update(request.Title.Trim(), request.Description?.Trim(), request.IsActive, request.DisplayOrder);

        var updateResult = await _roleRepository.UpdateAsync(role, cancellationToken);
        if (updateResult.IsFailure)
            return Result.Failure<RoleDto>(updateResult.Error);

        var count = await _roleRepository.GetUserCountByRoleNameAsync(role.Name, cancellationToken);

        return Result.Success(new RoleDto
        {
            Id = role.Id,
            Name = role.Name,
            Title = role.Title,
            Description = role.Description,
            IsSystemRole = role.IsSystemRole,
            IsActive = role.IsActive,
            DisplayOrder = role.DisplayOrder,
            UserCount = count,
            CreatedAt = role.CreatedAt,
            UpdatedAt = role.UpdatedAt
        });
    }

    public async Task<Result> DeleteRoleAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var roleResult = await _roleRepository.GetByIdAsync(id, cancellationToken);
        if (roleResult.IsFailure)
            return Result.Failure(roleResult.Error);

        var role = roleResult.Value;

        if (role.IsSystemRole)
            return Result.Failure("امکان حذف نقش‌های سیستمی اصلی سامانه وجود ندارد");

        var userCount = await _roleRepository.GetUserCountByRoleNameAsync(role.Name, cancellationToken);
        if (userCount > 0)
            return Result.Failure($"این نقش در حال حاضر به {userCount} کاربر اختصاص داده شده است. ابتدا نقش این کاربران را تغییر دهید");

        return await _roleRepository.DeleteAsync(role, cancellationToken);
    }
}
