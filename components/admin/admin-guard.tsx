"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { hasModeratorAccess, hasAdminAccess, type UserRole } from "@/lib/auth/authorization";

interface AdminGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  fallback?: React.ReactNode;
}

/**
 * Componente para proteger contenido de administración
 * Solo muestra el contenido si el usuario tiene el rol requerido
 * 
 * @param requiredRole - Rol mínimo requerido (default: "MODERATOR")
 * @param fallback - Componente a mostrar si no tiene permisos (default: null)
 */
export function AdminGuard({
  children,
  requiredRole = "MODERATOR",
  fallback = null,
}: AdminGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push("/inicio-sesion");
      return;
    }

    const hasAccess =
      requiredRole === "ADMIN"
        ? hasAdminAccess(user.role)
        : hasModeratorAccess(user.role);

    if (!hasAccess) {
      router.push("/");
    }
  }, [user, isLoading, requiredRole, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const hasAccess =
    requiredRole === "ADMIN"
      ? hasAdminAccess(user.role)
      : hasModeratorAccess(user.role);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

