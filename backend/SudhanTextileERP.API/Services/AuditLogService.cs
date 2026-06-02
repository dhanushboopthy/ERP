using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using SudhanTextileERP.API.Data;
using SudhanTextileERP.API.DTOs;
using SudhanTextileERP.API.Entities;

namespace SudhanTextileERP.API.Services;

public interface IAuditLogService
{
    Task LogAsync(string tableName, int recordId, string action, object? oldValues, object? newValues, string changedBy);
    Task LogOverrideAsync(string tableName, int recordId, string reason, object? oldValues, object? newValues, string changedBy);
    Task<PagedResult<AuditLogDto>> GetAuditLogsAsync(AuditLogFilterRequest filter);
    Task<AuditLogDto?> GetAuditLogByIdAsync(long id);
    Task<byte[]> ExportAuditLogsAsync(AuditLogFilterRequest filter);
    Task<List<string>> GetDistinctModulesAsync();
    Task<List<string>> GetDistinctUsersAsync();
}

public class AuditLogService : IAuditLogService
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    private static readonly Dictionary<string, string> TableToModuleMap = new()
    {
        { "User", "User Management" },
        { "Role", "Role Management" },
        { "RolePermission", "Permissions" },
        { "ApprovalMatrix", "Approval Matrix" },
        { "FinancialYear", "Financial Year" },
        { "DocumentNumberSeries", "Document Numbers" },
        { "SystemConfiguration", "System Config" },
        { "SecurityPolicy", "Security Policies" },
        { "BackupConfiguration", "Backup" },
        { "NotificationSetting", "Notifications" },
        { "UserSession", "User Sessions" },
        { "YarnReceipt", "Yarn Receipt" },
        { "YarnStock", "Yarn Stock" },
        { "WarpingJobCard", "Warping" },
        { "SizingJobCard", "Sizing" },
        { "TaxInvoice", "Invoicing" },
        { "Party", "Party Master" },
        { "YarnCount", "Yarn Count" },
        { "Beam", "Beam Master" },
        { "Vehicle", "Vehicle Master" },
        { "Backup", "Backup" },
        { "Notification", "Notifications" }
    };

    public AuditLogService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task LogAsync(string tableName, int recordId, string action, object? oldValues, object? newValues, string changedBy)
    {
        var httpContext = _httpContextAccessor.HttpContext;
        var ipAddress = httpContext?.Connection?.RemoteIpAddress?.ToString();
        var userAgent = httpContext?.Request?.Headers["User-Agent"].ToString();

        var serializerOptions = new JsonSerializerOptions
        {
            ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles,
            WriteIndented = false
        };

        var auditLog = new AuditLog
        {
            TableName = tableName,
            RecordId = recordId,
            Action = action,
            OldValues = oldValues != null ? (oldValues is string s ? s : JsonSerializer.Serialize(oldValues, serializerOptions)) : null,
            NewValues = newValues != null ? JsonSerializer.Serialize(newValues, serializerOptions) : null,
            ChangedBy = changedBy,
            ChangedAt = DateTime.UtcNow,
            IpAddress = ipAddress,
            UserAgent = userAgent?.Length > 500 ? userAgent[..500] : userAgent
        };

        _context.AuditLogs.Add(auditLog);
        await _context.SaveChangesAsync();
    }

    public async Task LogOverrideAsync(string tableName, int recordId, string reason, object? oldValues, object? newValues, string changedBy)
    {
        var httpContext = _httpContextAccessor.HttpContext;
        var ipAddress = httpContext?.Connection?.RemoteIpAddress?.ToString();
        var userAgent = httpContext?.Request?.Headers["User-Agent"].ToString();

        var auditLog = new AuditLog
        {
            TableName = tableName,
            RecordId = recordId,
            Action = "OVERRIDE",
            OldValues = oldValues != null ? JsonSerializer.Serialize(new { Data = oldValues, Reason = reason }) : null,
            NewValues = newValues != null ? JsonSerializer.Serialize(newValues) : null,
            ChangedBy = changedBy,
            ChangedAt = DateTime.UtcNow,
            IpAddress = ipAddress,
            UserAgent = userAgent?.Length > 500 ? userAgent[..500] : userAgent
        };

        _context.AuditLogs.Add(auditLog);
        await _context.SaveChangesAsync();
    }

    public async Task<PagedResult<AuditLogDto>> GetAuditLogsAsync(AuditLogFilterRequest filter)
    {
        var query = _context.AuditLogs.AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.TableName))
            query = query.Where(a => a.TableName == filter.TableName);

        if (!string.IsNullOrWhiteSpace(filter.Action))
            query = query.Where(a => a.Action == filter.Action);

        if (!string.IsNullOrWhiteSpace(filter.ChangedBy))
            query = query.Where(a => a.ChangedBy.Contains(filter.ChangedBy));

        if (filter.FromDate.HasValue)
            query = query.Where(a => a.ChangedAt >= filter.FromDate.Value);

        if (filter.ToDate.HasValue)
            query = query.Where(a => a.ChangedAt <= filter.ToDate.Value.AddDays(1));

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(a => a.ChangedAt)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(a => new AuditLogDto
            {
                Id = a.Id,
                TableName = a.TableName,
                ModuleName = GetModuleName(a.TableName),
                RecordId = a.RecordId,
                Action = a.Action,
                OldValues = a.OldValues,
                NewValues = a.NewValues,
                ChangedBy = a.ChangedBy,
                ChangedAt = a.ChangedAt,
                IpAddress = a.IpAddress,
                UserAgent = a.UserAgent
            })
            .ToListAsync();

        return new PagedResult<AuditLogDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = filter.PageNumber,
            PageSize = filter.PageSize
        };
    }

    public async Task<AuditLogDto?> GetAuditLogByIdAsync(long id)
    {
        return await _context.AuditLogs
            .Where(a => a.Id == id)
            .Select(a => new AuditLogDto
            {
                Id = a.Id,
                TableName = a.TableName,
                ModuleName = GetModuleName(a.TableName),
                RecordId = a.RecordId,
                Action = a.Action,
                OldValues = a.OldValues,
                NewValues = a.NewValues,
                ChangedBy = a.ChangedBy,
                ChangedAt = a.ChangedAt,
                IpAddress = a.IpAddress,
                UserAgent = a.UserAgent
            })
            .FirstOrDefaultAsync();
    }

    public async Task<byte[]> ExportAuditLogsAsync(AuditLogFilterRequest filter)
    {
        // Remove pagination for export
        filter.PageSize = 10000;
        filter.PageNumber = 1;

        var result = await GetAuditLogsAsync(filter);
        var sb = new StringBuilder();

        // CSV Header
        sb.AppendLine("ID,Module,Table,Record ID,Action,Changed By,Changed At,IP Address");

        foreach (var log in result.Items)
        {
            sb.AppendLine($"{log.Id},{EscapeCsv(log.ModuleName)},{EscapeCsv(log.TableName)},{log.RecordId},{log.Action},{EscapeCsv(log.ChangedBy)},{log.ChangedAt:yyyy-MM-dd HH:mm:ss},{log.IpAddress}");
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public async Task<List<string>> GetDistinctModulesAsync()
    {
        var tables = await _context.AuditLogs
            .Select(a => a.TableName)
            .Distinct()
            .ToListAsync();

        return tables.Select(t => GetModuleName(t)).Distinct().OrderBy(m => m).ToList();
    }

    public async Task<List<string>> GetDistinctUsersAsync()
    {
        return await _context.AuditLogs
            .Select(a => a.ChangedBy)
            .Distinct()
            .OrderBy(u => u)
            .ToListAsync();
    }

    private static string GetModuleName(string tableName)
    {
        return TableToModuleMap.TryGetValue(tableName, out var module) ? module : tableName;
    }

    private static string EscapeCsv(string? value)
    {
        if (string.IsNullOrEmpty(value)) return "";
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
            return $"\"{value.Replace("\"", "\"\"")}\"";
        return value;
    }
}
