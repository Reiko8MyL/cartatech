/**
 * Utilidades de autorización para verificar roles de usuario
 */

export type UserRole = "USER" | "MODERATOR" | "ADMIN";

/**
 * Verifica si un usuario es administrador
 */
export function isAdmin(role: string | null | undefined): boolean {
  return role === "ADMIN";
}

/**
 * Verifica si un usuario es moderador o administrador
 */
export function isModerator(role: string | null | undefined): boolean {
  return role === "MODERATOR" || role === "ADMIN";
}

/**
 * Verifica si un usuario tiene acceso de administrador
 * (alias de isAdmin para claridad)
 */
export function hasAdminAccess(role: string | null | undefined): boolean {
  return isAdmin(role);
}

/**
 * Verifica si un usuario tiene acceso de moderador o administrador
 * (alias de isModerator para claridad)
 */
export function hasModeratorAccess(role: string | null | undefined): boolean {
  return isModerator(role);
}

/**
 * Verifica si un usuario tiene un rol específico o superior
 */
export function hasRoleOrHigher(
  userRole: string | null | undefined,
  requiredRole: UserRole
): boolean {
  if (!userRole) return false;

  const roleHierarchy: Record<UserRole, number> = {
    USER: 1,
    MODERATOR: 2,
    ADMIN: 3,
  };

  const userLevel = roleHierarchy[userRole as UserRole] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  return userLevel >= requiredLevel;
}

