import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hasModeratorAccess } from "@/lib/auth/authorization";
import { checkRateLimit } from "@/lib/rate-limit/rate-limit";
import { log } from "@/lib/logging/logger";

/**
 * GET - Obtener comentarios recientes para moderación
 * Solo accesible para moderadores y administradores
 */
export async function GET(request: NextRequest) {
  // Rate limiting para admin
  const rateLimit = checkRateLimit(request);
  if (rateLimit?.limit) {
    log.warn("Rate limit exceeded for admin comments", {
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
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el usuario es moderador o admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    if (!hasModeratorAccess(user.role)) {
      return NextResponse.json(
        {
          error:
            "No tienes permiso para realizar esta acción. Se requiere rol de moderador o administrador.",
        },
        { status: 403 }
      );
    }

    // Obtener comentarios recientes (incluyendo respuestas)
    // Ordenar por fecha más reciente
    let comments = [];
    try {
      comments = await prisma.comment.findMany({
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
          deck: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (dbError: any) {
      // Si la tabla no existe, retornar array vacío
      const tableNotFound =
        dbError?.code === "P2001" ||
        dbError?.code === "P2021" ||
        dbError?.code === "P2025" ||
        dbError?.message?.includes("does not exist") ||
        dbError?.message?.includes("not found") ||
        (dbError?.message?.includes("relation") &&
          dbError?.message?.includes("does not exist"));

      if (tableNotFound) {
        if (process.env.NODE_ENV === "development") {
          log.warn("Tabla de comentarios no existe", { error: dbError });
        }
        return NextResponse.json({ comments: [] });
      }
      throw dbError;
    }

    // Convertir fechas a timestamps
    const formattedComments = comments.map((comment: any) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.getTime(),
      updatedAt: comment.updatedAt.getTime(),
      user: comment.user,
      deck: comment.deck,
      parentId: comment.parentId,
    }));

    const duration = Date.now() - startTime;
    log.api('GET', '/api/admin/comments', 200, duration);

    return NextResponse.json({ comments: formattedComments });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.prisma('getAdminComments', error, { duration });

    return NextResponse.json(
      {
        error: "Error al obtener comentarios",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

