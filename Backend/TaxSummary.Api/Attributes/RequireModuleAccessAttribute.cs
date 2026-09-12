using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using TaxSummary.Domain.Interfaces;

namespace TaxSummary.Api.Attributes;

/// <summary>
/// Attribute that restricts controller or action access based on dynamic module visibility and role permissions configured in MenuSettings.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true, Inherited = true)]
public class RequireModuleAccessAttribute : TypeFilterAttribute
{
    public RequireModuleAccessAttribute(string moduleKey)
        : base(typeof(RequireModuleAccessFilter))
    {
        Arguments = new object[] { moduleKey };
    }
}

public class RequireModuleAccessFilter : IAsyncActionFilter
{
    private readonly string _moduleKey;
    private readonly IMenuSettingsRepository _repository;
    private readonly ILogger<RequireModuleAccessFilter> _logger;

    public RequireModuleAccessFilter(
        string moduleKey,
        IMenuSettingsRepository repository,
        ILogger<RequireModuleAccessFilter> logger)
    {
        _moduleKey = moduleKey ?? throw new ArgumentNullException(nameof(moduleKey));
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        // If action allows anonymous access (e.g. sandbox calculator), bypass module permission check
        if (context.ActionDescriptor.EndpointMetadata.OfType<AllowAnonymousAttribute>().Any())
        {
            await next();
            return;
        }

        var user = context.HttpContext.User;
        if (user == null || user.Identity == null || !user.Identity.IsAuthenticated)
        {
            context.Result = new UnauthorizedObjectResult(new { error = "کاربر احراز هویت نشده است" });
            return;
        }

        var role = user.FindFirst(ClaimTypes.Role)?.Value;

        // System Administrator always has full access
        if (string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            await next();
            return;
        }

        var setting = await _repository.GetByKeyAsync(_moduleKey, context.HttpContext.RequestAborted);
        if (setting == null)
        {
            // If module setting record is not defined, permit access
            await next();
            return;
        }

        var isAllowed = setting.IsVisible && setting.IsRoleAllowed(role);

        // If this is an action and not permitted by its own setting, check if parent module allows it
        if (!isAllowed && !string.IsNullOrWhiteSpace(setting.ParentKey))
        {
            var parentSetting = await _repository.GetByKeyAsync(setting.ParentKey, context.HttpContext.RequestAborted);
            if (parentSetting != null && parentSetting.IsVisible && parentSetting.IsRoleAllowed(role))
            {
                isAllowed = true;
            }
        }

        if (!isAllowed)
        {
            _logger.LogWarning("Access to module '{ModuleKey}' forbidden for role '{Role}' on user '{UserId}'.",
                _moduleKey, role, user.FindFirst(ClaimTypes.NameIdentifier)?.Value);

            context.Result = new ObjectResult(new
            {
                error = $"دسترسی به سامانه '{setting.Title}' برای نقش کاربری شما ({role}) مجاز نمی‌باشد.",
                moduleKey = _moduleKey,
                allowedRoles = setting.AllowedRoles
            })
            {
                StatusCode = StatusCodes.Status403Forbidden
            };
            return;
        }

        await next();
    }
}
