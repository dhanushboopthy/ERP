namespace SudhanTextileERP.API.Entities;

public class Role : BaseEntity
{
    public string RoleName { get; set; } = string.Empty;
    public string? RoleDescription { get; set; }
    public string Permissions { get; set; } = "[]";
    public bool IsSystemRole { get; set; } // Cannot be deleted if true (Admin, etc.)
    public int SortOrder { get; set; }

    // Navigation
    public virtual ICollection<User> Users { get; set; } = new List<User>();
    public virtual ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
    public virtual ICollection<ApprovalMatrix> ApprovalMatrixEntries { get; set; } = new List<ApprovalMatrix>();
}
