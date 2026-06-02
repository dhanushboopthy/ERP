using Microsoft.EntityFrameworkCore;
using SudhanTextileERP.API.Data;
using SudhanTextileERP.API.Entities;

namespace SudhanTextileERP.API.Services;

public interface IApprovalWorkflowService
{
    Task<bool> PrepareAsync(string entityType, int entityId, string preparedBy);
    Task<bool> CheckAsync(string entityType, int entityId, string checkedBy);
    Task<bool> ApproveAsync(string entityType, int entityId, string approvedBy);
    Task<bool> AuthorizeAsync(string entityType, int entityId, string authorizedBy);
}

public class ApprovalWorkflowService : IApprovalWorkflowService
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditLogService _auditLogService;

    public ApprovalWorkflowService(ApplicationDbContext context, IAuditLogService auditLogService)
    {
        _context = context;
        _auditLogService = auditLogService;
    }

    public async Task<bool> PrepareAsync(string entityType, int entityId, string preparedBy)
    {
        return await UpdateStatusAsync(entityType, entityId, "Prepared", preparedBy, 
            (entity, user, date) => {
                SetPreparedFields(entity, user, date);
                SetStatus(entity, "Prepared");
            });
    }

    public async Task<bool> CheckAsync(string entityType, int entityId, string checkedBy)
    {
        return await UpdateStatusAsync(entityType, entityId, "Checked", checkedBy,
            (entity, user, date) => {
                var currentStatus = GetStatus(entity);
                if (currentStatus != "Prepared")
                    throw new InvalidOperationException($"Cannot check from status '{currentStatus}'. Must be 'Prepared'.");
                
                SetCheckedFields(entity, user, date);
                SetStatus(entity, "Checked");
            });
    }

    public async Task<bool> ApproveAsync(string entityType, int entityId, string approvedBy)
    {
        return await UpdateStatusAsync(entityType, entityId, "Approved", approvedBy,
            (entity, user, date) => {
                var currentStatus = GetStatus(entity);
                if (currentStatus != "Checked")
                    throw new InvalidOperationException($"Cannot approve from status '{currentStatus}'. Must be 'Checked'.");
                
                SetApprovedFields(entity, user, date);
                SetStatus(entity, "Approved");
            });
    }

    public async Task<bool> AuthorizeAsync(string entityType, int entityId, string authorizedBy)
    {
        return await UpdateStatusAsync(entityType, entityId, "Authorized", authorizedBy,
            (entity, user, date) => {
                var currentStatus = GetStatus(entity);
                if (currentStatus != "Approved")
                    throw new InvalidOperationException($"Cannot authorize from status '{currentStatus}'. Must be 'Approved'.");
                
                SetAuthorizedFields(entity, user, date);
                SetStatus(entity, "Authorized");
                SetLocked(entity, true);
            });
    }

    private async Task<bool> UpdateStatusAsync(string entityType, int entityId, string newStatus, string user, Action<object, string, DateTime> updateAction)
    {
        object? entity = entityType switch
        {
            "SizingJobCard" => await _context.SizingJobCards.FindAsync(entityId),
            "WarpingJobCard" => await _context.WarpingJobCards.FindAsync(entityId),
            _ => throw new ArgumentException($"Unsupported entity type: {entityType}")
        };

        if (entity == null)
            return false;

        var oldStatus = GetStatus(entity);
        
        updateAction(entity, user, DateTime.UtcNow);

        if (entity is BaseEntity baseEntity)
        {
            baseEntity.ModifiedBy = user;
            baseEntity.ModifiedDate = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(entityType, entityId, "APPROVE", 
            new { Status = oldStatus }, 
            new { Status = newStatus, ApprovedBy = user }, 
            user);

        return true;
    }

    private static string GetStatus(object entity)
    {
        return entity switch
        {
            SizingJobCard sjc => sjc.Status,
            WarpingJobCard wjc => wjc.Status,
            _ => throw new ArgumentException("Unsupported entity type")
        };
    }

    private static void SetStatus(object entity, string status)
    {
        switch (entity)
        {
            case SizingJobCard sjc:
                sjc.Status = status;
                break;
            case WarpingJobCard wjc:
                wjc.Status = status;
                break;
            default:
                throw new ArgumentException("Unsupported entity type");
        }
    }

    private static void SetPreparedFields(object entity, string user, DateTime date)
    {
        if (entity is SizingJobCard sjc)
        {
            sjc.PreparedBy = user;
            sjc.PreparedDate = date;
        }
    }

    private static void SetCheckedFields(object entity, string user, DateTime date)
    {
        if (entity is SizingJobCard sjc)
        {
            sjc.CheckedBy = user;
            sjc.CheckedDate = date;
        }
    }

    private static void SetApprovedFields(object entity, string user, DateTime date)
    {
        if (entity is SizingJobCard sjc)
        {
            sjc.ApprovedBy = user;
            sjc.ApprovedDate = date;
        }
    }

    private static void SetAuthorizedFields(object entity, string user, DateTime date)
    {
        if (entity is SizingJobCard sjc)
        {
            sjc.AuthorizedBy = user;
            sjc.AuthorizedDate = date;
        }
    }

    private static void SetLocked(object entity, bool locked)
    {
        switch (entity)
        {
            case SizingJobCard sjc:
                sjc.IsLocked = locked;
                break;
            case WarpingJobCard wjc:
                wjc.IsLocked = locked;
                break;
        }
    }
}
