import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hasAdminAccess } from "@/lib/auth/authorization";
import { checkRateLimit } from "@/lib/rate-limit/rate-limit";
import { log } from "@/lib/logging/logger";

/**
 * GET - Obtener lista de usuarios
 * Solo accesible para administradores
 */
export async function GET(request: NextRequest) {
  // Rate limiting para admin
  const rateLimit = checkRateLimit(request);
  if (rateLimit?.limit) {
    log.warn("Rate limit exceeded for admin users", {
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
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el usuario es admin
    const admin = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
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

    // Construir query de búsqueda
    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Obtener total de usuarios para paginación
    const total = await prisma.user.count({ where });

    // Obtener usuarios con paginación
    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            decks: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Formatear usuarios
    const formattedUsers = users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role || "USER",
      createdAt: user.createdAt.getTime(),
      stats: {
        decksCount: user._count.decks,
        commentsCount: user._count.comments,
      },
    }));

    const duration = Date.now() - startTime;
    log.api('GET', '/api/admin/users', 200, duration);

    return NextResponse.json({ 
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.prisma('getAdminUsers', error, { duration });

    return NextResponse.json(
      {
        error: "Error al obtener usuarios",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

