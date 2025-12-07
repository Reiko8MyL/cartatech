import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hasAdminAccess } from "@/lib/auth/authorization";
import { checkRateLimit } from "@/lib/rate-limit/rate-limit";
import { log } from "@/lib/logging/logger";

/**
 * PUT - Actualizar rol de usuario
 * Solo accesible para administradores
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  // Rate limiting para admin
  const rateLimit = checkRateLimit(request);
  if (rateLimit?.limit) {
    log.warn("Rate limit exceeded for admin user update", {
      identifier: request.headers.get('x-forwarded-for') || 'unknown',
    });
    return NextResponse.json(
      { 
        error: "Demasiadas solicitudes. Por favor, intenta de nuevo más tarde.",
        retryAfter: rateLimit.retryAfter,
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetAt.toString(),
          'Retry-After': (rateLimit.retryAfter || 60).toString(),
        },
      }
    );
  }

  const startTime = Date.now();
  try {
    const { userId: targetUserId } = await params;
    const body = await request.json();
    const { adminUserId, newRole } = body;

    if (!adminUserId || !newRole) {
      return NextResponse.json(
        { error: "adminUserId y newRole son requeridos" },
        { status: 400 }
      );
    }

    if (!["USER", "MODERATOR", "ADMIN"].includes(newRole)) {
      return NextResponse.json(
        { error: "newRole debe ser USER, MODERATOR o ADMIN" },
        { status: 400 }
      );
    }

    // Verificar que el admin es realmente admin
    const admin = await prisma.user.findUnique({
      where: { id: adminUserId },
      select: { id: true, role: true },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Administrador no encontrado" },
        { status: 404 }
      );
    }

    if (!hasAdminAccess(admin.role)) {
      return NextResponse.json(
        {
          error:
            "No tienes permiso para realizar esta acción. Se requiere rol de administrador.",
        },
        { status: 403 }
      );
    }

    // Verificar que el usuario objetivo existe
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, username: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // No permitir que un admin se quite su propio rol de admin
    if (targetUserId === adminUserId && newRole !== "ADMIN") {
      return NextResponse.json(
        { error: "No puedes quitarte tu propio rol de administrador" },
        { status: 400 }
      );
    }

    // Actualizar rol
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        ...updatedUser,
        createdAt: updatedUser.createdAt.getTime(),
      },
      message: `Rol de ${updatedUser.username} actualizado a ${newRole}`,
    });
    
    const duration = Date.now() - startTime;
    log.api('PUT', `/api/admin/users/${targetUserId}`, 200, duration);
    
    return NextResponse.json({
      success: true,
      user: {
        ...updatedUser,
        createdAt: updatedUser.createdAt.getTime(),
      },
      message: `Rol de ${updatedUser.username} actualizado a ${newRole}`,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.prisma('updateUserRole', error, { duration });

    return NextResponse.json(
      {
        error: "Error al actualizar rol de usuario",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

