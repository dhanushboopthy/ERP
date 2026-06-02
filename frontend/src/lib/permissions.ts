/**
 * Permission Utility - Central permission checking system
 * 
 * CRITICAL: This is the ONLY place where permission logic should exist.
 * All components must use these utilities.
 */

export type Permission = string;

/**
 * Check if user has a specific permission
 * @param userPermissions - Array of user's permissions from backend
 * @param requiredPermission - Permission to check (e.g., "sizing.yarn_receipt.view")
 * @returns true if user has the permission
 */
export function hasPermission(
  userPermissions: Permission[],
  requiredPermission: Permission
): boolean {
  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }

  // Direct match
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  // Wildcard match (e.g., "sizing.*" matches "sizing.yarn_receipt.view")
  return userPermissions.some(permission => {
    if (permission.endsWith('.*')) {
      const permissionPrefix = permission.slice(0, -2);
      return requiredPermission.startsWith(permissionPrefix + '.');
    }
    if (permission === '*') {
      return true; // Super admin
    }
    return false;
  });
}

/**
 * Check if user has ANY of the specified permissions
 * @param userPermissions - Array of user's permissions
 * @param requiredPermissions - Array of permissions to check
 * @returns true if user has at least one permission
 */
export function hasAnyPermission(
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): boolean {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true; // No permissions required
  }

  return requiredPermissions.some(perm => 
    hasPermission(userPermissions, perm)
  );
}

/**
 * Check if user has ALL of the specified permissions
 * @param userPermissions - Array of user's permissions
 * @param requiredPermissions - Array of permissions to check
 * @returns true if user has all permissions
 */
export function hasAllPermissions(
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): boolean {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  return requiredPermissions.every(perm => 
    hasPermission(userPermissions, perm)
  );
}

/**
 * Check if user has access to a module (any .view permission)
 * @param userPermissions - Array of user's permissions
 * @param moduleKey - Module key (e.g., "sizing", "masters.party")
 * @returns true if user has any .view permission in the module
 */
export function hasModuleAccess(
  userPermissions: Permission[],
  moduleKey: string
): boolean {
  return userPermissions.some(permission => {
    // Direct module wildcard (e.g., "sizing.*")
    if (permission === `${moduleKey}.*` || permission === '*') {
      return true;
    }
    // Any view permission in module (e.g., "sizing.yarn_receipt.view")
    if (permission.startsWith(`${moduleKey}.`) && permission.endsWith('.view')) {
      return true;
    }
    return false;
  });
}

/**
 * Get allowed actions for a specific resource
 * @param userPermissions - Array of user's permissions
 * @param resourceKey - Resource key (e.g., "sizing.yarn_receipt")
 * @returns Object with boolean flags for each action
 */
export function getResourcePermissions(
  userPermissions: Permission[],
  resourceKey: string
): {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
} {
  return {
    view: hasPermission(userPermissions, `${resourceKey}.view`),
    create: hasPermission(userPermissions, `${resourceKey}.create`),
    edit: hasPermission(userPermissions, `${resourceKey}.edit`),
    delete: hasPermission(userPermissions, `${resourceKey}.delete`),
    approve: hasPermission(userPermissions, `${resourceKey}.approve`),
  };
}

/**
 * Filter array of items based on permissions
 * @param items - Array of items with optional permissions property
 * @param userPermissions - Array of user's permissions
 * @returns Filtered array containing only accessible items
 */
export function filterByPermissions<T extends { permissions?: Permission[] }>(
  items: T[],
  userPermissions: Permission[]
): T[] {
  return items.filter(item => {
    if (!item.permissions || item.permissions.length === 0) {
      return true; // No permissions required
    }
    return hasAnyPermission(userPermissions, item.permissions);
  });
}

/**
 * Development-only permission logging
 */
export function logPermissionCheck(
  requiredPermission: Permission,
  userPermissions: Permission[],
  result: boolean
): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Permission Check]', {
      required: requiredPermission,
      userPermissions,
      granted: result,
    });
  }
}
