using Microsoft.EntityFrameworkCore;
using SudhanTextileERP.API.Data;
using SudhanTextileERP.API.DTOs;
using SudhanTextileERP.API.Entities;
using BackupConfigurationEntity = SudhanTextileERP.API.Entities.BackupConfiguration;
using System.Text.Json;
using BCrypt.Net;

namespace SudhanTextileERP.API.Services;

public class SettingsService
{
    private readonly ApplicationDbContext _context;
    private readonly AuditLogService _auditLogService;
    private readonly IBackupService _backupService;

    public SettingsService(ApplicationDbContext context, AuditLogService auditLogService, IBackupService backupService)
    {
        _context = context;
        _auditLogService = auditLogService;
        _backupService = backupService;
    }

    // ============================================
    // USER MANAGEMENT
    // ============================================

    public async Task<PagedResult<UserListDto>> GetUsersAsync(PaginationParams paging)
    {
        var query = _context.Users
            .Include(u => u.Role)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(paging.Search))
        {
            var search = paging.Search.ToLower();
            query = query.Where(u =>
                u.Username.ToLower().Contains(search) ||
                u.FullName.ToLower().Contains(search) ||
                u.Email.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync();

        var users = await query
            .OrderBy(u => u.FullName)
            .Skip((paging.PageNumber - 1) * paging.PageSize)
            .Take(paging.PageSize)
            .Select(u => new UserListDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                FullName = u.FullName,
                Mobile = u.Mobile,
                Department = u.Department,
                RoleId = u.RoleId,
                RoleName = u.Role.RoleName,
                IsActive = u.IsActive,
                IsLocked = u.IsLocked,
                LastLoginDate = u.LastLoginDate,
                LastLoginIp = u.LastLoginIp,
                CreatedAt = u.CreatedDate
            })
            .ToListAsync();

        return new PagedResult<UserListDto>
        {
            Items = users,
            TotalCount = totalCount,
            PageNumber = paging.PageNumber,
            PageSize = paging.PageSize
        };
    }

    public async Task<UserListDto?> GetUserByIdAsync(int id)
    {
        return await _context.Users
            .Include(u => u.Role)
            .Where(u => u.Id == id)
            .Select(u => new UserListDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                FullName = u.FullName,
                Mobile = u.Mobile,
                Department = u.Department,
                RoleId = u.RoleId,
                RoleName = u.Role.RoleName,
                IsActive = u.IsActive,
                IsLocked = u.IsLocked,
                LastLoginDate = u.LastLoginDate,
                LastLoginIp = u.LastLoginIp,
                CreatedAt = u.CreatedDate
            })
            .FirstOrDefaultAsync();
    }

    public async Task<ApiResponse<UserListDto>> CreateUserAsync(CreateUserRequest request, string createdBy)
    {
        // Check for duplicate username
        if (await _context.Users.AnyAsync(u => u.Username == request.Username))
            return ApiResponse<UserListDto>.Fail("Username already exists");

        // Check for duplicate email
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            return ApiResponse<UserListDto>.Fail("Email already exists");

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = request.FullName,
            Mobile = request.Mobile,
            Department = request.Department,
            DefaultLocation = request.DefaultLocation,
            RoleId = request.RoleId,
            MustChangePassword = true,
            IsActive = true,
            CreatedBy = createdBy
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("User", user.Id, "CREATE", null, user, createdBy);

        var dto = await GetUserByIdAsync(user.Id);
        return ApiResponse<UserListDto>.Ok(dto!, "User created successfully");
    }

    public async Task<ApiResponse<UserListDto>> UpdateUserAsync(UpdateUserRequest request, string updatedBy)
    {
        var user = await _context.Users.FindAsync(request.Id);
        if (user == null)
            return ApiResponse<UserListDto>.Fail("User not found");

        var oldValues = JsonSerializer.Serialize(user);

        // Check email uniqueness
        if (await _context.Users.AnyAsync(u => u.Email == request.Email && u.Id != request.Id))
            return ApiResponse<UserListDto>.Fail("Email already in use");

        user.Email = request.Email;
        user.FullName = request.FullName;
        user.Mobile = request.Mobile;
        user.Department = request.Department;
        user.DefaultLocation = request.DefaultLocation;
        user.RoleId = request.RoleId;
        user.IsActive = request.IsActive;
        user.ModifiedBy = updatedBy;
        user.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("User", user.Id, "UPDATE", oldValues, user, updatedBy);

        var dto = await GetUserByIdAsync(user.Id);
        return ApiResponse<UserListDto>.Ok(dto!, "User updated successfully");
    }

    public async Task<ApiResponse<bool>> LockUserAsync(LockUserRequest request, string lockedBy)
    {
        var user = await _context.Users.FindAsync(request.UserId);
        if (user == null)
            return ApiResponse<bool>.Fail("User not found");

        // Prevent locking admin users
        var role = await _context.Roles.FindAsync(user.RoleId);
        if (role?.IsSystemRole == true && role.RoleName == "Admin")
            return ApiResponse<bool>.Fail("Cannot lock admin users");

        user.IsLocked = true;
        user.LockedAt = DateTime.UtcNow;
        user.LockReason = request.Reason;
        user.ModifiedBy = lockedBy;

        // Terminate all active sessions
        var sessions = await _context.UserSessions
            .Where(s => s.UserId == request.UserId && s.IsActive)
            .ToListAsync();
        foreach (var session in sessions)
        {
            session.IsActive = false;
            session.LogoutTime = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("User", user.Id, "LOCK", null, new { Reason = request.Reason }, lockedBy);

        return ApiResponse<bool>.Ok(true, "User locked successfully");
    }

    public async Task<ApiResponse<bool>> UnlockUserAsync(int userId, string unlockedBy)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return ApiResponse<bool>.Fail("User not found");

        user.IsLocked = false;
        user.LockedAt = null;
        user.LockReason = null;
        user.FailedLoginAttempts = 0;
        user.ModifiedBy = unlockedBy;

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("User", user.Id, "UNLOCK", null, null, unlockedBy);

        return ApiResponse<bool>.Ok(true, "User unlocked successfully");
    }

    public async Task<ApiResponse<bool>> ResetPasswordAsync(ResetPasswordRequest request, string resetBy)
    {
        var user = await _context.Users.FindAsync(request.UserId);
        if (user == null)
            return ApiResponse<bool>.Fail("User not found");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.MustChangePassword = request.ForceChangeOnLogin;
        user.PasswordChangedAt = DateTime.UtcNow;
        user.ModifiedBy = resetBy;

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("User", user.Id, "PASSWORD_RESET", null, 
            new { ForceChange = request.ForceChangeOnLogin }, resetBy);

        return ApiResponse<bool>.Ok(true, "Password reset successfully");
    }

    public async Task<ApiResponse<bool>> DeactivateUserAsync(int userId, string deactivatedBy)
    {
        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == userId);
            
        if (user == null)
            return ApiResponse<bool>.Fail("User not found");

        // Check for transaction history (cannot delete users with transactions)
        var hasTransactions = await _context.AuditLogs
            .AnyAsync(a => a.ChangedBy == user.Username);

        if (hasTransactions)
        {
            // Soft delete - just deactivate
            user.IsActive = false;
            user.ModifiedBy = deactivatedBy;
            await _context.SaveChangesAsync();

            await _auditLogService.LogAsync("User", user.Id, "DEACTIVATE", null, null, deactivatedBy);
            return ApiResponse<bool>.Ok(true, "User deactivated (has transaction history)");
        }

        // Prevent deleting system admin
        if (user.Role?.IsSystemRole == true && user.Role.RoleName == "Admin")
            return ApiResponse<bool>.Fail("Cannot delete admin users");

        user.IsActive = false;
        user.ModifiedBy = deactivatedBy;
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("User", user.Id, "DEACTIVATE", null, null, deactivatedBy);

        return ApiResponse<bool>.Ok(true, "User deactivated successfully");
    }

    public async Task<ApiResponse<bool>> ActivateUserAsync(int userId, string activatedBy)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            
        if (user == null)
            return ApiResponse<bool>.Fail("User not found");

        user.IsActive = true;
        user.ModifiedBy = activatedBy;
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("User", user.Id, "ACTIVATE", null, null, activatedBy);

        return ApiResponse<bool>.Ok(true, "User activated successfully");
    }

    // ============================================
    // ROLE & PERMISSION MANAGEMENT
    // ============================================

    public async Task<List<RoleDto>> GetRolesAsync()
    {
        return await _context.Roles
            .Include(r => r.Users)
            .Include(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
            .Where(r => r.IsActive)
            .OrderBy(r => r.SortOrder)
            .ThenBy(r => r.RoleName)
            .Select(r => new RoleDto
            {
                Id = r.Id,
                RoleName = r.RoleName,
                RoleDescription = r.RoleDescription,
                IsSystemRole = r.IsSystemRole,
                UserCount = r.Users.Count(u => u.IsActive),
                IsActive = r.IsActive,
                Permissions = r.RolePermissions
                    .Where(rp => rp.IsGranted)
                    .Select(rp => new PermissionDto
                    {
                        Id = rp.Permission.Id,
                        PermissionCode = rp.Permission.PermissionCode,
                        PermissionName = rp.Permission.PermissionName,
                        Module = rp.Permission.ModuleKey,
                        ModuleKey = rp.Permission.ModuleKey,
                        Category = rp.Permission.Action,
                        Action = rp.Permission.Action,
                        IsGranted = true
                    })
                    .ToList()
            })
            .ToListAsync();
    }

    public async Task<RoleDto?> GetRoleByIdAsync(int id)
    {
        return await _context.Roles
            .Include(r => r.Users)
            .Include(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
            .Where(r => r.Id == id)
            .Select(r => new RoleDto
            {
                Id = r.Id,
                RoleName = r.RoleName,
                RoleDescription = r.RoleDescription,
                IsSystemRole = r.IsSystemRole,
                UserCount = r.Users.Count(u => u.IsActive),
                IsActive = r.IsActive,
                Permissions = r.RolePermissions
                    .Where(rp => rp.IsGranted)
                    .Select(rp => new PermissionDto
                    {
                        Id = rp.Permission.Id,
                        PermissionCode = rp.Permission.PermissionCode,
                        PermissionName = rp.Permission.PermissionName,
                        Module = rp.Permission.ModuleKey,
                        ModuleKey = rp.Permission.ModuleKey,
                        Category = rp.Permission.Action,
                        Action = rp.Permission.Action,
                        IsGranted = true
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync();
    }

    public async Task<ApiResponse<RoleDto>> CreateRoleAsync(CreateRoleRequest request, string createdBy)
    {
        if (await _context.Roles.AnyAsync(r => r.RoleName == request.RoleName))
            return ApiResponse<RoleDto>.Fail("Role name already exists");

        var role = new Role
        {
            RoleName = request.RoleName,
            RoleDescription = request.RoleDescription,
            IsSystemRole = false,
            IsActive = true,
            CreatedBy = createdBy
        };

        _context.Roles.Add(role);
        await _context.SaveChangesAsync();

        // Add permissions
        if (request.PermissionIds.Any())
        {
            foreach (var permId in request.PermissionIds)
            {
                _context.RolePermissions.Add(new RolePermission
                {
                    RoleId = role.Id,
                    PermissionId = permId,
                    IsGranted = true,
                    GrantedBy = 0 // System
                });
            }
            await _context.SaveChangesAsync();
        }

        await _auditLogService.LogAsync("Role", role.Id, "CREATE", null, role, createdBy);

        var dto = await GetRoleByIdAsync(role.Id);
        return ApiResponse<RoleDto>.Ok(dto!, "Role created successfully");
    }

    public async Task<ApiResponse<RoleDto>> UpdateRoleAsync(UpdateRoleRequest request, string updatedBy)
    {
        var role = await _context.Roles
            .Include(r => r.RolePermissions)
            .FirstOrDefaultAsync(r => r.Id == request.Id);
            
        if (role == null)
            return ApiResponse<RoleDto>.Fail("Role not found");

        if (role.IsSystemRole)
            return ApiResponse<RoleDto>.Fail("Cannot modify system roles");

        var oldValues = JsonSerializer.Serialize(role);

        role.RoleName = request.RoleName;
        role.RoleDescription = request.RoleDescription;
        role.ModifiedBy = updatedBy;
        role.ModifiedDate = DateTime.UtcNow;

        // Update permissions
        _context.RolePermissions.RemoveRange(role.RolePermissions);
        foreach (var permId in request.PermissionIds)
        {
            _context.RolePermissions.Add(new RolePermission
            {
                RoleId = role.Id,
                PermissionId = permId,
                IsGranted = true,
                GrantedBy = 0
            });
        }

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("Role", role.Id, "UPDATE", oldValues, role, updatedBy);

        var dto = await GetRoleByIdAsync(role.Id);
        return ApiResponse<RoleDto>.Ok(dto!, "Role updated successfully");
    }

    public async Task<ApiResponse<bool>> DeleteRoleAsync(int id, string deletedBy)
    {
        var role = await _context.Roles
            .Include(r => r.Users)
            .FirstOrDefaultAsync(r => r.Id == id);
            
        if (role == null)
            return ApiResponse<bool>.Fail("Role not found");

        if (role.IsSystemRole)
            return ApiResponse<bool>.Fail("Cannot delete system roles");

        if (role.Users.Any(u => u.IsActive))
            return ApiResponse<bool>.Fail("Cannot delete role with active users");

        role.IsActive = false;
        role.ModifiedBy = deletedBy;
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("Role", role.Id, "DELETE", null, null, deletedBy);

        return ApiResponse<bool>.Ok(true, "Role deleted successfully");
    }

    public async Task<List<PermissionModuleDto>> GetPermissionsGroupedByModuleAsync()
    {
        var modules = await _context.Modules
            .Where(m => m.IsActive)
            .Include(m => m.Permissions.Where(p => p.IsActive))
            .OrderBy(m => m.ParentModule)
            .ThenBy(m => m.SortOrder)
            .ToListAsync();

        return modules.Select(m => new PermissionModuleDto
        {
            Module = m.ParentModule ?? "",
            ModuleKey = m.ModuleKey,
            ModuleName = m.ModuleName,
            RoutePath = m.RoutePath ?? "",
            Icon = m.Icon ?? "",
            SortOrder = m.SortOrder,
            Permissions = m.Permissions
                .OrderBy(p => p.SortOrder)
                .Select(p => new PermissionDto
                {
                    Id = p.Id,
                    PermissionCode = p.PermissionCode,
                    PermissionName = p.PermissionName,
                    Module = m.ModuleKey,
                    Category = p.Action ?? "",
                    Description = p.Description,
                    IsGranted = false
                }).ToList()
        }).ToList();
    }

    public async Task<List<ModuleDto>> GetModulesAsync()
    {
        return await _context.Modules
            .Where(m => m.IsActive)
            .OrderBy(m => m.ParentModule)
            .ThenBy(m => m.SortOrder)
            .Select(m => new ModuleDto
            {
                Id = m.Id,
                ModuleKey = m.ModuleKey,
                ModuleName = m.ModuleName,
                ParentModule = m.ParentModule ?? "",
                RoutePath = m.RoutePath,
                Icon = m.Icon,
                SortOrder = m.SortOrder,
                IsActive = m.IsActive
            })
            .ToListAsync();
    }

    public async Task<List<PermissionModuleDto>> GetRolePermissionsAsync(int roleId)
    {
        var modules = await _context.Modules
            .Where(m => m.IsActive)
            .Include(m => m.Permissions.Where(p => p.IsActive))
            .OrderBy(m => m.ParentModule)
            .ThenBy(m => m.SortOrder)
            .ToListAsync();

        var grantedPermissions = await _context.RolePermissions
            .Where(rp => rp.RoleId == roleId && rp.IsGranted)
            .Select(rp => rp.PermissionId)
            .ToListAsync();

        return modules.Select(m => new PermissionModuleDto
        {
            Module = m.ParentModule ?? "",
            ModuleKey = m.ModuleKey,
            ModuleName = m.ModuleName,
            RoutePath = m.RoutePath ?? "",
            Icon = m.Icon ?? "",
            SortOrder = m.SortOrder,
            Permissions = m.Permissions
                .OrderBy(p => p.SortOrder)
                .Select(p => new PermissionDto
                {
                    Id = p.Id,
                    PermissionCode = p.PermissionCode,
                    PermissionName = p.PermissionName,
                    Module = m.ModuleKey,
                    Category = p.Action ?? "",
                    Description = p.Description,
                    IsGranted = grantedPermissions.Contains(p.Id)
                }).ToList()
        }).ToList();
    }

    public async Task<ApiResponse<bool>> UpdateRolePermissionsAsync(int roleId, List<int> permissionIds, string updatedBy)
    {
        var role = await _context.Roles
            .Include(r => r.RolePermissions)
            .FirstOrDefaultAsync(r => r.Id == roleId);
            
        if (role == null)
            return ApiResponse<bool>.Fail("Role not found");

        var oldPermissions = role.RolePermissions.Select(rp => rp.PermissionId).ToList();

        _context.RolePermissions.RemoveRange(role.RolePermissions);

        foreach (var permId in permissionIds)
        {
            _context.RolePermissions.Add(new RolePermission
            {
                RoleId = roleId,
                PermissionId = permId,
                IsGranted = true,
                GrantedBy = 0
            });
        }

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("RolePermission", roleId, "UPDATE",
            JsonSerializer.Serialize(new { OldPermissions = oldPermissions }),
            new { NewPermissions = permissionIds },
            updatedBy);

        return ApiResponse<bool>.Ok(true, "Permissions updated successfully");
    }

    // ============================================
    // APPROVAL MATRIX
    // ============================================

    public async Task<List<ApprovalMatrixDto>> GetApprovalMatrixAsync()
    {
        return await _context.ApprovalMatrix
            .Include(am => am.RequiredRole)
            .Where(am => am.IsActive)
            .OrderBy(am => am.DocumentType)
            .ThenBy(am => am.ApprovalLevel)
            .Select(am => new ApprovalMatrixDto
            {
                Id = am.Id,
                DocumentType = am.DocumentType,
                DocumentDisplayName = GetDocumentDisplayName(am.DocumentType),
                ApprovalLevel = am.ApprovalLevel,
                LevelName = am.LevelName,
                RequiredRoleId = am.RequiredRoleId,
                RequiredRoleName = am.RequiredRole.RoleName,
                IsRequired = am.IsRequired,
                AutoApprovalThreshold = am.AutoApprovalThreshold
            })
            .ToListAsync();
    }

    public async Task<List<ApprovalMatrixDto>> GetApprovalMatrixForDocumentAsync(string documentType)
    {
        return await _context.ApprovalMatrix
            .Include(am => am.RequiredRole)
            .Where(am => am.DocumentType == documentType && am.IsActive)
            .OrderBy(am => am.ApprovalLevel)
            .Select(am => new ApprovalMatrixDto
            {
                Id = am.Id,
                DocumentType = am.DocumentType,
                DocumentDisplayName = GetDocumentDisplayName(am.DocumentType),
                ApprovalLevel = am.ApprovalLevel,
                LevelName = am.LevelName,
                RequiredRoleId = am.RequiredRoleId,
                RequiredRoleName = am.RequiredRole.RoleName,
                IsRequired = am.IsRequired,
                AutoApprovalThreshold = am.AutoApprovalThreshold
            })
            .ToListAsync();
    }

    public async Task<ApiResponse<bool>> SaveApprovalMatrixAsync(SaveApprovalMatrixRequest request, string savedBy)
    {
        // Remove existing entries for this document type
        var existing = await _context.ApprovalMatrix
            .Where(am => am.DocumentType == request.DocumentType)
            .ToListAsync();
        _context.ApprovalMatrix.RemoveRange(existing);

        // Add new entries
        foreach (var level in request.Levels)
        {
            _context.ApprovalMatrix.Add(new ApprovalMatrix
            {
                DocumentType = request.DocumentType,
                ApprovalLevel = level.ApprovalLevel,
                LevelName = level.LevelName,
                RequiredRoleId = level.RequiredRoleId,
                IsRequired = level.IsRequired,
                AutoApprovalThreshold = level.AutoApprovalThreshold,
                SortOrder = level.ApprovalLevel,
                IsActive = true,
                CreatedBy = savedBy
            });
        }

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("ApprovalMatrix", 0, "UPDATE",
            JsonSerializer.Serialize(existing.Select(e => e.Id)),
            request,
            savedBy);

        return ApiResponse<bool>.Ok(true, "Approval matrix saved successfully");
    }

    public async Task<PagedResult<ApprovalHistoryDto>> GetApprovalHistoryAsync(
        string? documentType, int? documentId, PaginationParams paging)
    {
        var query = _context.ApprovalHistories
            .Include(ah => ah.ApprovedByUser)
            .AsQueryable();

        if (!string.IsNullOrEmpty(documentType))
            query = query.Where(ah => ah.DocumentType == documentType);

        if (documentId.HasValue)
            query = query.Where(ah => ah.DocumentId == documentId.Value);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(ah => ah.ApprovalDate)
            .Skip((paging.PageNumber - 1) * paging.PageSize)
            .Take(paging.PageSize)
            .Select(ah => new ApprovalHistoryDto
            {
                Id = ah.Id,
                DocumentType = ah.DocumentType,
                DocumentId = ah.DocumentId,
                DocumentNumber = "",
                ApprovalLevel = ah.ApprovalLevel,
                LevelName = ah.LevelName,
                Action = ah.Action,
                ApprovedByName = ah.ApprovedByUser.FullName,
                ApprovalDate = ah.ApprovalDate,
                Comments = ah.Comments
            })
            .ToListAsync();

        return new PagedResult<ApprovalHistoryDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = paging.PageNumber,
            PageSize = paging.PageSize
        };
    }

    // ============================================
    // FINANCIAL YEAR
    // ============================================

    public async Task<List<FinancialYearDto>> GetFinancialYearsAsync()
    {
        return await _context.FinancialYears
            .Where(fy => fy.IsActive)
            .OrderByDescending(fy => fy.StartDate)
            .Select(fy => new FinancialYearDto
            {
                Id = fy.Id,
                YearCode = fy.YearCode,
                YearName = fy.YearName,
                StartDate = fy.StartDate,
                EndDate = fy.EndDate,
                IsCurrent = fy.IsCurrent,
                IsClosed = fy.IsClosed,
                ClosedAt = fy.ClosedAt,
                IsActive = fy.IsActive,
                DocumentCount = _context.YarnReceipts.Count(yr => yr.FinancialYearId == fy.Id) +
                               _context.SizingJobCards.Count(s => s.FinancialYearId == fy.Id) +
                               _context.TaxInvoices.Count(ti => ti.FinancialYearId == fy.Id)
            })
            .ToListAsync();
    }

    public async Task<FinancialYearDto?> GetFinancialYearByIdAsync(int id)
    {
        return await _context.FinancialYears
            .Where(fy => fy.Id == id)
            .Select(fy => new FinancialYearDto
            {
                Id = fy.Id,
                YearCode = fy.YearCode,
                YearName = fy.YearName,
                StartDate = fy.StartDate,
                EndDate = fy.EndDate,
                IsCurrent = fy.IsCurrent,
                IsClosed = fy.IsClosed,
                ClosedAt = fy.ClosedAt,
                IsActive = fy.IsActive,
                DocumentCount = _context.YarnReceipts.Count(yr => yr.FinancialYearId == fy.Id) +
                               _context.SizingJobCards.Count(s => s.FinancialYearId == fy.Id) +
                               _context.TaxInvoices.Count(ti => ti.FinancialYearId == fy.Id)
            })
            .FirstOrDefaultAsync();
    }

    public async Task<ApiResponse<FinancialYearDto>> CreateFinancialYearAsync(CreateFinancialYearRequest request, string createdBy)
    {
        if (await _context.FinancialYears.AnyAsync(fy => fy.YearCode == request.YearCode))
            return ApiResponse<FinancialYearDto>.Fail("Year code already exists");

        var fy = new FinancialYear
        {
            YearCode = request.YearCode,
            YearName = request.YearName,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            IsCurrent = false,
            IsClosed = false,
            IsActive = true,
            CreatedBy = createdBy
        };

        _context.FinancialYears.Add(fy);
        await _context.SaveChangesAsync();

        // Create document number series for this FY
        await CreateDocumentNumberSeriesForFYAsync(fy.Id, createdBy);

        await _auditLogService.LogAsync("FinancialYear", fy.Id, "CREATE", null, fy, createdBy);

        var dto = await GetFinancialYearByIdAsync(fy.Id);
        return ApiResponse<FinancialYearDto>.Ok(dto!, "Financial year created successfully");
    }

    public async Task<ApiResponse<bool>> SetCurrentFinancialYearAsync(int yearId, string updatedBy)
    {
        var fy = await _context.FinancialYears.FindAsync(yearId);
        if (fy == null)
            return ApiResponse<bool>.Fail("Financial year not found");

        if (fy.IsClosed)
            return ApiResponse<bool>.Fail("Cannot set closed year as current");

        // Unset current from all other years
        var allYears = await _context.FinancialYears.Where(f => f.IsCurrent).ToListAsync();
        foreach (var year in allYears)
        {
            year.IsCurrent = false;
        }

        fy.IsCurrent = true;
        fy.ModifiedBy = updatedBy;

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("FinancialYear", fy.Id, "SET_CURRENT", null, null, updatedBy);

        return ApiResponse<bool>.Ok(true, "Current financial year updated");
    }

    public async Task<ApiResponse<bool>> CloseFinancialYearAsync(CloseFinancialYearRequest request, string closedBy)
    {
        var fy = await _context.FinancialYears.FindAsync(request.YearId);
        if (fy == null)
            return ApiResponse<bool>.Fail("Financial year not found");

        if (fy.IsClosed)
            return ApiResponse<bool>.Fail("Financial year is already closed");

        // Check for pending documents
        var pending = await GetPendingDocumentsForYearAsync(request.YearId);
        if (pending.TotalPending > 0 && !request.ConfirmPendingDocuments)
            return ApiResponse<bool>.Fail($"There are {pending.TotalPending} pending documents. Please confirm to proceed.");

        fy.IsClosed = true;
        fy.ClosedAt = DateTime.UtcNow;
        fy.ClosedByUserId = 0; // Would get from auth context
        fy.ClosureRemarks = request.Remarks;
        fy.IsCurrent = false;
        fy.ModifiedBy = closedBy;

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("FinancialYear", fy.Id, "CLOSE", null, 
            new { Remarks = request.Remarks }, closedBy);

        return ApiResponse<bool>.Ok(true, "Financial year closed successfully");
    }

    public async Task<dynamic> GetPendingDocumentsForYearAsync(int yearId)
    {
        var pendingReceipts = await _context.YarnReceipts
            .CountAsync(yr => yr.FinancialYearId == yearId && !yr.IsLocked);
        var pendingJobCards = await _context.SizingJobCards
            .CountAsync(s => s.FinancialYearId == yearId && s.Status != "Authorized");
        var pendingInvoices = await _context.TaxInvoices
            .CountAsync(ti => ti.FinancialYearId == yearId && ti.Status != "Finalized");

        return new
        {
            PendingReceipts = pendingReceipts,
            PendingJobCards = pendingJobCards,
            PendingInvoices = pendingInvoices,
            TotalPending = pendingReceipts + pendingJobCards + pendingInvoices
        };
    }

    private async Task CreateDocumentNumberSeriesForFYAsync(int fyId, string createdBy)
    {
        var documentTypes = new[]
        {
            ("YarnReceipt", "Yarn Receipt", "YR"),
            ("WarpingJobCard", "Warping Job Card", "WJC"),
            ("SizingJobCard", "Sizing Job Card", "SJC"),
            ("YarnReturn", "Yarn Return", "YRT"),
            ("YarnDelivery", "Yarn Delivery", "YD"),
            ("TaxInvoice", "Tax Invoice", "INV")
        };

        foreach (var (docType, displayName, prefix) in documentTypes)
        {
            if (!await _context.DocumentNumberSeries.AnyAsync(d => d.DocumentType == docType && d.FinancialYearId == fyId))
            {
                _context.DocumentNumberSeries.Add(new DocumentNumberSeries
                {
                    DocumentType = docType,
                    DisplayName = displayName,
                    FinancialYearId = fyId,
                    Prefix = prefix,
                    CurrentNumber = 0,
                    PadLength = 6,
                    ResetOnFYChange = true,
                    AllowManualOverride = false,
                    LockAfterPrint = false,
                    LockAfterApproval = true,
                    IsActive = true,
                    CreatedBy = createdBy
                });
            }
        }

        await _context.SaveChangesAsync();
    }

    // ============================================
    // DOCUMENT NUMBER SETTINGS
    // ============================================

    public async Task<List<DocumentNumberSettingDto>> GetDocumentNumberSettingsAsync(int? financialYearId)
    {
        var query = _context.DocumentNumberSeries
            .Include(d => d.FinancialYear)
            .Where(d => d.IsActive)
            .AsQueryable();

        if (financialYearId.HasValue)
            query = query.Where(d => d.FinancialYearId == financialYearId.Value);
        else
        {
            // Get current FY
            var currentFy = await _context.FinancialYears.FirstOrDefaultAsync(f => f.IsCurrent);
            if (currentFy != null)
                query = query.Where(d => d.FinancialYearId == currentFy.Id);
        }

        return await query
            .OrderBy(d => d.DocumentType)
            .Select(d => new DocumentNumberSettingDto
            {
                Id = d.Id,
                DocumentType = d.DocumentType,
                DisplayName = d.DisplayName,
                FinancialYearId = d.FinancialYearId,
                FinancialYearName = d.FinancialYear.YearName,
                Prefix = d.Prefix,
                Suffix = d.Suffix,
                CurrentNumber = d.CurrentNumber,
                PadLength = d.PadLength,
                ResetOnFYChange = d.ResetOnFYChange,
                AllowManualOverride = d.AllowManualOverride,
                LockAfterPrint = d.LockAfterPrint,
                LockAfterApproval = d.LockAfterApproval,
                SampleNumber = d.Prefix + (d.CurrentNumber + 1).ToString().PadLeft(d.PadLength, '0') + (d.Suffix ?? "")
            })
            .ToListAsync();
    }

    public async Task<ApiResponse<DocumentNumberSettingDto>> UpdateDocumentNumberSettingAsync(
        UpdateDocumentNumberSettingRequest request, string updatedBy)
    {
        var setting = await _context.DocumentNumberSeries.FindAsync(request.Id);
        if (setting == null)
            return ApiResponse<DocumentNumberSettingDto>.Fail("Setting not found");

        var oldValues = JsonSerializer.Serialize(setting);

        setting.Prefix = request.Prefix;
        setting.Suffix = request.Suffix;
        setting.PadLength = request.PadLength;
        setting.ResetOnFYChange = request.ResetOnFYChange;
        setting.AllowManualOverride = request.AllowManualOverride;
        setting.LockAfterPrint = request.LockAfterPrint;
        setting.LockAfterApproval = request.LockAfterApproval;
        setting.ModifiedBy = updatedBy;
        setting.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("DocumentNumberSeries", setting.Id, "UPDATE", oldValues, setting, updatedBy);

        var dto = await _context.DocumentNumberSeries
            .Include(d => d.FinancialYear)
            .Where(d => d.Id == request.Id)
            .Select(d => new DocumentNumberSettingDto
            {
                Id = d.Id,
                DocumentType = d.DocumentType,
                DisplayName = d.DisplayName,
                FinancialYearId = d.FinancialYearId,
                FinancialYearName = d.FinancialYear.YearName,
                Prefix = d.Prefix,
                Suffix = d.Suffix,
                CurrentNumber = d.CurrentNumber,
                PadLength = d.PadLength,
                ResetOnFYChange = d.ResetOnFYChange,
                AllowManualOverride = d.AllowManualOverride,
                LockAfterPrint = d.LockAfterPrint,
                LockAfterApproval = d.LockAfterApproval,
                SampleNumber = d.Prefix + (d.CurrentNumber + 1).ToString().PadLeft(d.PadLength, '0') + (d.Suffix ?? "")
            })
            .FirstAsync();

        return ApiResponse<DocumentNumberSettingDto>.Ok(dto, "Setting updated successfully");
    }

    // ============================================
    // SYSTEM CONFIGURATION
    // ============================================

    public async Task<List<SystemConfigCategoryDto>> GetSystemConfigsGroupedAsync()
    {
        var configs = await _context.SystemConfigurations
            .Where(c => c.IsActive)
            .OrderBy(c => c.Category)
            .ThenBy(c => c.SortOrder)
            .ToListAsync();

        return configs
            .GroupBy(c => c.Category)
            .Select(g => new SystemConfigCategoryDto
            {
                Category = g.Key,
                DisplayName = GetCategoryDisplayName(g.Key),
                Configs = g.Select(c => new SystemConfigDto
                {
                    Id = c.Id,
                    ConfigKey = c.ConfigKey,
                    ConfigValue = c.ConfigValue,
                    ConfigType = c.ConfigType,
                    Category = c.Category,
                    DisplayName = c.DisplayName,
                    Description = c.Description,
                    DefaultValue = c.DefaultValue,
                    IsEditable = c.IsEditable
                }).ToList()
            })
            .ToList();
    }

    public async Task<SystemConfigDto?> GetSystemConfigByKeyAsync(string key)
    {
        return await _context.SystemConfigurations
            .Where(c => c.ConfigKey == key)
            .Select(c => new SystemConfigDto
            {
                Id = c.Id,
                ConfigKey = c.ConfigKey,
                ConfigValue = c.ConfigValue,
                ConfigType = c.ConfigType,
                Category = c.Category,
                DisplayName = c.DisplayName,
                Description = c.Description,
                DefaultValue = c.DefaultValue,
                IsEditable = c.IsEditable
            })
            .FirstOrDefaultAsync();
    }

    public async Task<ApiResponse<SystemConfigDto>> UpdateSystemConfigAsync(UpdateSystemConfigRequest request, string updatedBy)
    {
        var config = await _context.SystemConfigurations.FindAsync(request.Id);
        if (config == null)
            return ApiResponse<SystemConfigDto>.Fail("Configuration not found");

        if (!config.IsEditable)
            return ApiResponse<SystemConfigDto>.Fail("This configuration cannot be modified");

        var oldValue = config.ConfigValue;
        config.ConfigValue = request.ConfigValue;
        config.ModifiedBy = updatedBy;
        config.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("SystemConfiguration", config.Id, "UPDATE",
            JsonSerializer.Serialize(new { OldValue = oldValue }),
            new { NewValue = request.ConfigValue },
            updatedBy);

        return ApiResponse<SystemConfigDto>.Ok(await GetSystemConfigByKeyAsync(config.ConfigKey), "Configuration updated");
    }

    public async Task<ApiResponse<bool>> UpdateSystemConfigsBulkAsync(List<UpdateSystemConfigRequest> requests, string updatedBy)
    {
        foreach (var request in requests)
        {
            var config = await _context.SystemConfigurations.FindAsync(request.Id);
            if (config != null && config.IsEditable)
            {
                var oldValue = config.ConfigValue;
                config.ConfigValue = request.ConfigValue;
                config.ModifiedBy = updatedBy;
                config.ModifiedDate = DateTime.UtcNow;

                await _auditLogService.LogAsync("SystemConfiguration", config.Id, "UPDATE",
                    JsonSerializer.Serialize(new { OldValue = oldValue }),
                    new { NewValue = request.ConfigValue },
                    updatedBy);
            }
        }

        await _context.SaveChangesAsync();
        return ApiResponse<bool>.Ok(true, "Configurations updated successfully");
    }

    // ============================================
    // SECURITY POLICIES
    // ============================================

    public async Task<List<SecurityPolicyDto>> GetSecurityPoliciesAsync()
    {
        return await _context.SecurityPolicies
            .Where(p => p.IsActive)
            .OrderBy(p => p.PolicyType)
            .Select(p => new SecurityPolicyDto
            {
                Id = p.Id,
                PolicyKey = p.PolicyKey,
                PolicyValue = p.PolicyValue,
                PolicyType = p.PolicyType,
                DisplayName = p.DisplayName,
                Description = p.Description
            })
            .ToListAsync();
    }

    public async Task<ApiResponse<SecurityPolicyDto>> UpdateSecurityPolicyAsync(UpdateSecurityPolicyRequest request, string updatedBy)
    {
        var policy = await _context.SecurityPolicies.FindAsync(request.Id);
        if (policy == null)
            return ApiResponse<SecurityPolicyDto>.Fail("Policy not found");

        var oldValue = policy.PolicyValue;
        policy.PolicyValue = request.PolicyValue;
        policy.ModifiedBy = updatedBy;
        policy.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("SecurityPolicy", policy.Id, "UPDATE",
            JsonSerializer.Serialize(new { OldValue = oldValue }),
            new { NewValue = request.PolicyValue },
            updatedBy);

        return ApiResponse<SecurityPolicyDto>.Ok(new SecurityPolicyDto
        {
            Id = policy.Id,
            PolicyKey = policy.PolicyKey,
            PolicyValue = policy.PolicyValue,
            PolicyType = policy.PolicyType,
            DisplayName = policy.DisplayName,
            Description = policy.Description
        }, "Policy updated successfully");
    }

    // ============================================
    // BACKUP CONFIGURATION
    // ============================================

    public async Task<List<BackupConfigDto>> GetBackupConfigsAsync()
    {
        await EnsureDefaultBackupConfigsAsync();

        return await _context.BackupConfigurations
            .Where(b => b.IsActive)
            .Select(b => new BackupConfigDto
            {
                Id = b.Id,
                BackupType = b.BackupType,
                Frequency = b.Frequency,
                RetentionDays = b.RetentionDays,
                BackupPath = b.BackupPath,
                IsEnabled = b.IsEnabled,
                LastBackupTime = b.LastBackupTime,
                LastBackupStatus = b.LastBackupStatus,
                LastBackupSize = b.LastBackupSize,
                NextScheduledBackup = b.NextScheduledBackup
            })
            .ToListAsync();
    }

    private async Task EnsureDefaultBackupConfigsAsync()
    {
        var hasConfigs = await _context.BackupConfigurations.AnyAsync();
        if (hasConfigs)
        {
            return;
        }

        var now = DateTime.UtcNow;
        var defaults = new List<BackupConfigurationEntity>
        {
            new BackupConfigurationEntity
            {
                BackupType = "Full",
                Frequency = "Daily",
                RetentionDays = 30,
                BackupPath = "Backups",
                IsEnabled = true,
                LastBackupStatus = "Never",
                NextScheduledBackup = CalculateNextBackupTime("Daily"),
                CreatedBy = "System",
                CreatedDate = now
            },
            new BackupConfigurationEntity
            {
                BackupType = "Differential",
                Frequency = "Weekly",
                RetentionDays = 60,
                BackupPath = "Backups",
                IsEnabled = false,
                LastBackupStatus = "Never",
                NextScheduledBackup = CalculateNextBackupTime("Weekly"),
                CreatedBy = "System",
                CreatedDate = now
            }
        };

        await _context.BackupConfigurations.AddRangeAsync(defaults);
        await _context.SaveChangesAsync();
    }

    public async Task<ApiResponse<BackupConfigDto>> UpdateBackupConfigAsync(UpdateBackupConfigRequest request, string updatedBy)
    {
        var config = await _context.BackupConfigurations.FindAsync(request.Id);
        if (config == null)
            return ApiResponse<BackupConfigDto>.Fail("Backup configuration not found");

        config.BackupType = request.BackupType;
        config.Frequency = request.Frequency;
        config.RetentionDays = request.RetentionDays;
        config.BackupPath = request.BackupPath;
        config.IsEnabled = request.IsEnabled;
        config.ModifiedBy = updatedBy;
        config.ModifiedDate = DateTime.UtcNow;

        // Calculate next scheduled backup
        config.NextScheduledBackup = CalculateNextBackupTime(request.Frequency);

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("BackupConfiguration", config.Id, "UPDATE", null, config, updatedBy);

        return ApiResponse<BackupConfigDto>.Ok(new BackupConfigDto
        {
            Id = config.Id,
            BackupType = config.BackupType,
            Frequency = config.Frequency,
            RetentionDays = config.RetentionDays,
            BackupPath = config.BackupPath,
            IsEnabled = config.IsEnabled,
            LastBackupTime = config.LastBackupTime,
            LastBackupStatus = config.LastBackupStatus,
            LastBackupSize = config.LastBackupSize,
            NextScheduledBackup = config.NextScheduledBackup
        }, "Backup configuration updated");
    }

    public async Task<ApiResponse<bool>> TriggerManualBackupAsync(string triggeredBy)
    {
        var configs = await _context.BackupConfigurations
            .Where(b => b.IsActive)
            .ToListAsync();

        if (configs.Count == 0)
        {
            return ApiResponse<bool>.Fail("No backup configuration found");
        }

        var activeConfigs = configs.Where(b => b.IsEnabled).ToList();
        var primaryConfig = activeConfigs.FirstOrDefault() ?? configs.First();

        var result = await _backupService.CreateBackupAsync(primaryConfig.BackupType, triggeredBy);

        foreach (var config in configs)
        {
            config.LastBackupTime = result.Timestamp;
            config.LastBackupStatus = result.Success ? "Success" : "Failed";
            config.LastBackupSize = result.Success ? FormatFileSize(result.FileSizeBytes) : null;
            config.NextScheduledBackup = CalculateNextBackupTime(config.Frequency);
            config.ModifiedBy = triggeredBy;
            config.ModifiedDate = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("Backup", 0, "MANUAL_TRIGGER", null, new
        {
            result.Success,
            result.BackupFilePath,
            result.FileSizeBytes,
            result.ErrorMessage
        }, triggeredBy);

        if (!result.Success)
        {
            return ApiResponse<bool>.Fail(result.ErrorMessage ?? "Backup failed");
        }

        return ApiResponse<bool>.Ok(true, "Backup completed successfully");
    }

    private static string FormatFileSize(long bytes)
    {
        if (bytes <= 0) return "0 B";
        string[] sizes = { "B", "KB", "MB", "GB", "TB" };
        var order = (int)Math.Floor(Math.Log(bytes, 1024));
        order = Math.Min(order, sizes.Length - 1);
        var value = bytes / Math.Pow(1024, order);
        return $"{value:0.##} {sizes[order]}";
    }

    // ============================================
    // NOTIFICATION SETTINGS
    // ============================================

    public async Task<List<NotificationSettingDto>> GetNotificationSettingsAsync()
    {
        await EnsureDefaultNotificationSettingsAsync();

        return await _context.NotificationSettings
            .Where(n => n.IsActive)
            .OrderBy(n => n.EventType)
            .Select(n => new NotificationSettingDto
            {
                Id = n.Id,
                NotificationType = n.NotificationType,
                EventType = n.EventType,
                DisplayName = n.DisplayName,
                IsEnabled = n.IsEnabled,
                ThresholdValue = n.ThresholdValue,
                RecipientRoleIds = string.IsNullOrEmpty(n.RecipientRoles) 
                    ? new List<int>() 
                    : JsonSerializer.Deserialize<List<int>>(n.RecipientRoles) ?? new List<int>()
            })
            .ToListAsync();
    }

    private async Task EnsureDefaultNotificationSettingsAsync()
    {
        var hasSettings = await _context.NotificationSettings.AnyAsync();
        if (hasSettings)
        {
            return;
        }

        var roleIds = await _context.Roles
            .AsNoTracking()
            .Where(r => r.RoleName == "SuperAdmin" || r.RoleName == "Admin" || r.RoleName == "Manager")
            .Select(r => r.Id)
            .ToListAsync();

        var recipientRoles = JsonSerializer.Serialize(roleIds);

        var defaults = new List<NotificationSetting>
        {
            new NotificationSetting
            {
                NotificationType = "InApp",
                EventType = "LowStock",
                DisplayName = "Low Stock Alert",
                IsEnabled = true,
                ThresholdValue = 500,
                RecipientRoles = recipientRoles,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new NotificationSetting
            {
                NotificationType = "InApp",
                EventType = "OverdueInvoice",
                DisplayName = "Overdue Invoice Alert",
                IsEnabled = true,
                ThresholdValue = 7,
                RecipientRoles = recipientRoles,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new NotificationSetting
            {
                NotificationType = "InApp",
                EventType = "PendingApproval",
                DisplayName = "Pending Approval Alert",
                IsEnabled = true,
                ThresholdValue = 2,
                RecipientRoles = recipientRoles,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new NotificationSetting
            {
                NotificationType = "InApp",
                EventType = "BackupFailure",
                DisplayName = "Backup Failure Alert",
                IsEnabled = true,
                ThresholdValue = null,
                RecipientRoles = recipientRoles,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new NotificationSetting
            {
                NotificationType = "InApp",
                EventType = "LoginAlert",
                DisplayName = "Login Alert",
                IsEnabled = false,
                ThresholdValue = null,
                RecipientRoles = recipientRoles,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            }
        };

        await _context.NotificationSettings.AddRangeAsync(defaults);
        await _context.SaveChangesAsync();
    }

    public async Task<ApiResponse<NotificationSettingDto>> UpdateNotificationSettingAsync(
        UpdateNotificationSettingRequest request, string updatedBy)
    {
        var setting = await _context.NotificationSettings.FindAsync(request.Id);
        if (setting == null)
            return ApiResponse<NotificationSettingDto>.Fail("Notification setting not found");

        setting.IsEnabled = request.IsEnabled;
        setting.ThresholdValue = request.ThresholdValue;
        setting.RecipientRoles = JsonSerializer.Serialize(request.RecipientRoleIds);
        setting.ModifiedBy = updatedBy;
        setting.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("NotificationSetting", setting.Id, "UPDATE", null, setting, updatedBy);

        return ApiResponse<NotificationSettingDto>.Ok(new NotificationSettingDto
        {
            Id = setting.Id,
            NotificationType = setting.NotificationType,
            EventType = setting.EventType,
            DisplayName = setting.DisplayName,
            IsEnabled = setting.IsEnabled,
            ThresholdValue = setting.ThresholdValue,
            RecipientRoleIds = request.RecipientRoleIds
        }, "Notification setting updated");
    }

    public async Task<ApiResponse<bool>> SendTestNotificationAsync(int settingId, string triggeredBy)
    {
        var setting = await _context.NotificationSettings.FindAsync(settingId);
        if (setting == null)
            return ApiResponse<bool>.Fail("Notification setting not found");

        // This would integrate with actual notification service
        await _auditLogService.LogAsync("Notification", settingId, "TEST_SEND", null, null, triggeredBy);
        return ApiResponse<bool>.Ok(true, "Test notification sent");
    }

    // ============================================
    // USER SESSIONS
    // ============================================

    public async Task<PagedResult<UserSessionDto>> GetUserSessionsAsync(int? userId, PaginationParams paging)
    {
        var query = _context.UserSessions
            .Include(s => s.User)
            .AsQueryable();

        if (userId.HasValue)
            query = query.Where(s => s.UserId == userId.Value);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(s => s.LoginTime)
            .Skip((paging.PageNumber - 1) * paging.PageSize)
            .Take(paging.PageSize)
            .Select(s => new UserSessionDto
            {
                Id = s.Id,
                UserId = s.UserId,
                Username = s.User.Username,
                IpAddress = s.IpAddress,
                DeviceInfo = s.DeviceInfo,
                LoginTime = s.LoginTime,
                LogoutTime = s.LogoutTime,
                IsActive = s.IsActive
            })
            .ToListAsync();

        return new PagedResult<UserSessionDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = paging.PageNumber,
            PageSize = paging.PageSize
        };
    }

    public async Task<ApiResponse<bool>> TerminateSessionAsync(int sessionId, string terminatedBy)
    {
        var session = await _context.UserSessions.FindAsync(sessionId);
        if (session == null)
            return ApiResponse<bool>.Fail("Session not found");

        session.IsActive = false;
        session.LogoutTime = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("UserSession", sessionId, "TERMINATE", null, null, terminatedBy);

        return ApiResponse<bool>.Ok(true, "Session terminated");
    }

    public async Task<ApiResponse<bool>> TerminateAllUserSessionsAsync(int userId, string terminatedBy)
    {
        var sessions = await _context.UserSessions
            .Where(s => s.UserId == userId && s.IsActive)
            .ToListAsync();

        foreach (var session in sessions)
        {
            session.IsActive = false;
            session.LogoutTime = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("UserSession", userId, "TERMINATE_ALL", null, 
            new { SessionCount = sessions.Count }, terminatedBy);

        return ApiResponse<bool>.Ok(true, $"{sessions.Count} sessions terminated");
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    private static string GetDocumentDisplayName(string documentType) => documentType switch
    {
        "YarnReceipt" => "Yarn Receipt",
        "WarpingJobCard" => "Warping Job Card",
        "SizingJobCard" => "Sizing Job Card",
        "YarnReturn" => "Yarn Return",
        "YarnDelivery" => "Yarn Delivery",
        "TaxInvoice" => "Tax Invoice",
        _ => documentType
    };

    private static string GetCategoryDisplayName(string category) => category switch
    {
        "General" => "General Settings",
        "Stock" => "Stock Management",
        "Invoice" => "Invoice & Billing",
        "Security" => "Security Settings",
        "Notification" => "Notifications",
        _ => category
    };

    private static DateTime CalculateNextBackupTime(string frequency) => frequency switch
    {
        "Daily" => DateTime.Today.AddDays(1).AddHours(2), // 2 AM next day
        "Weekly" => DateTime.Today.AddDays(7 - (int)DateTime.Today.DayOfWeek).AddHours(2),
        "Monthly" => new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1).AddMonths(1).AddHours(2),
        _ => DateTime.Today.AddDays(1).AddHours(2)
    };
}
