using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace SudhanTextileERP.API.Authorization;

/// <summary>
/// Attribute to specify required permission for an action
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = true)]
public class RequirePermissionAttribute : AuthorizeAttribute
{
    public string Permission { get; }
    
    public RequirePermissionAttribute(string permission) : base()
    {
        Permission = permission;
        Policy = $"Permission:{permission}";
    }
}

/// <summary>
/// Requirement for permission-based authorization
/// </summary>
public class PermissionRequirement : IAuthorizationRequirement
{
    public string Permission { get; }
    
    public PermissionRequirement(string permission)
    {
        Permission = permission;
    }
}

/// <summary>
/// Handler for permission-based authorization
/// </summary>
public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        // Check if user has the "All" permission (Admin)
        if (context.User.HasClaim(c => c.Type == "permissions" && c.Value == "All"))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }
        
        // Check if user has the specific permission
        if (context.User.HasClaim(c => c.Type == "permissions" && c.Value == requirement.Permission))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }
        
        // Check if user has module-level permission that includes this action
        var permissionParts = requirement.Permission.Split('.');
        if (permissionParts.Length == 2)
        {
            var modulePermission = $"{permissionParts[0]}.*";
            if (context.User.HasClaim(c => c.Type == "permissions" && c.Value == modulePermission))
            {
                context.Succeed(requirement);
                return Task.CompletedTask;
            }
        }
        
        return Task.CompletedTask;
    }
}

/// <summary>
/// Policy provider that dynamically creates permission-based policies
/// </summary>
public class PermissionPolicyProvider : IAuthorizationPolicyProvider
{
    private const string PERMISSION_PREFIX = "Permission:";
    private readonly DefaultAuthorizationPolicyProvider _fallbackPolicyProvider;
    
    public PermissionPolicyProvider(IOptions<AuthorizationOptions> options)
    {
        _fallbackPolicyProvider = new DefaultAuthorizationPolicyProvider(options);
    }
    
    public Task<AuthorizationPolicy> GetDefaultPolicyAsync() =>
        _fallbackPolicyProvider.GetDefaultPolicyAsync();
    
    public Task<AuthorizationPolicy?> GetFallbackPolicyAsync() =>
        _fallbackPolicyProvider.GetFallbackPolicyAsync();
    
    public Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        if (policyName.StartsWith(PERMISSION_PREFIX, StringComparison.OrdinalIgnoreCase))
        {
            var permission = policyName[PERMISSION_PREFIX.Length..];
            var policy = new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .AddRequirements(new PermissionRequirement(permission))
                .Build();
            return Task.FromResult<AuthorizationPolicy?>(policy);
        }
        
        return _fallbackPolicyProvider.GetPolicyAsync(policyName);
    }
}
