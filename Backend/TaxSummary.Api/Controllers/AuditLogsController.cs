using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using TaxSummary.Infrastructure.Data;

namespace TaxSummary.Api.Controllers;

/// <summary>
/// RESTful API Controller for administrative audit logs
/// گزارش‌گیری و رصد تاریخچه رویدادها و تغییرات امنیتی و مدیریتی سامانه
/// </summary>
[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/audit-logs")]
[Produces("application/json")]
[EnableRateLimiting("GeneralPolicy")]
public class AuditLogsController : ControllerBase
{
    private readonly TaxSummaryDbContext _context;
    private readonly ILogger<AuditLogsController> _logger;

    public AuditLogsController(
        TaxSummaryDbContext context,
        ILogger<AuditLogsController> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Retrieve paginated and filtered audit logs
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] string? entityName = null,
        [FromQuery] string? entityId = null,
        [FromQuery] string? action = null,
        [FromQuery] string? username = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 20;

        var query = _context.AuditLogs.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(entityName))
        {
            var trimmed = entityName.Trim();
            query = query.Where(a => a.EntityName == trimmed);
        }

        if (!string.IsNullOrWhiteSpace(entityId))
        {
            var trimmed = entityId.Trim();
            query = query.Where(a => a.EntityId == trimmed);
        }

        if (!string.IsNullOrWhiteSpace(action))
        {
            var trimmed = action.Trim();
            query = query.Where(a => a.Action == trimmed);
        }

        if (!string.IsNullOrWhiteSpace(username))
        {
            var trimmed = username.Trim();
            query = query.Where(a => a.Username != null && a.Username.Contains(trimmed));
        }

        if (fromDate.HasValue)
        {
            query = query.Where(a => a.Timestamp >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(a => a.Timestamp <= toDate.Value);
        }

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(a => a.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return Ok(new
        {
            totalCount,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
            items
        });
    }

    /// <summary>
    /// Retrieve specific audit log entry by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetAuditLogById(Guid id, CancellationToken ct = default)
    {
        var log = await _context.AuditLogs.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id, ct);
        if (log == null)
        {
            return NotFound(new { error = "گزارش رویداد مورد نظر یافت نشد" });
        }

        return Ok(log);
    }
}
