namespace SudhanTextileERP.API.Entities;

/// <summary>
/// Represents a granular permission for a specific module and action
/// </summary>
public class Permission : BaseEntity
{
    /// <summary>
    /// Unique permission code (e.g., YARN_RECEIPT.VIEW, YARN_RECEIPT.CREATE)
    /// </summary>
    public string PermissionCode { get; set; } = string.Empty;
    
    /// <summary>
    /// Display name for the permission
    /// </summary>
    public string PermissionName { get; set; } = string.Empty;
    
    /// <summary>
    /// Foreign key to Module
    /// </summary>
    public int ModuleId { get; set; }
    
    /// <summary>
    /// Module key for quick lookup (denormalized)
    /// </summary>
    public string ModuleKey { get; set; } = string.Empty;
    
    /// <summary>
    /// Action type: VIEW, CREATE, EDIT, DELETE, APPROVE, PRINT, EXPORT
    /// </summary>
    public string Action { get; set; } = string.Empty;
    
    /// <summary>
    /// Description of what this permission allows
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// Display order
    /// </summary>
    public int SortOrder { get; set; }
    
    /// <summary>
    /// Whether this permission is active
    /// </summary>
    public new bool IsActive { get; set; } = true;
    
    // Navigation
    public virtual Module Module { get; set; } = null!;
    public virtual ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}

/// <summary>
/// Junction table for Role-Permission many-to-many relationship
/// </summary>
public class RolePermission
{
    public int Id { get; set; }
    public int RoleId { get; set; }
    public int PermissionId { get; set; }
    public bool IsGranted { get; set; } = true;
    public DateTime GrantedAt { get; set; } = DateTime.UtcNow;
    public int GrantedBy { get; set; }

    // Navigation
    public virtual Role Role { get; set; } = null!;
    public virtual Permission Permission { get; set; } = null!;
}

