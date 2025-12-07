import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hasModeratorAccess } from "@/lib/auth/authorization";
import { checkRateLimit } from "@/lib/rate-limit/rate-limit";
import { log } from "@/lib/logging/logger";

/**
 * GET - Obtener estadísticas para el dashboard de administración
 * Solo accesible para moderadores y administradores
 */
export async function GET(request: NextRequest) {
  // Rate limiting para admin
  const rateLimit = checkRateLimit(request);
  if (rateLimit?.limit) {
    log.warn("Rate limit exceeded for admin stats", {
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
    const timeRange = searchParams.get("timeRange") || "7"; // 7, 30, 90, all

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

    // Calcular fecha de inicio según el rango de tiempo
    let startDate: Date | null = null;
    const now = Date.now();
    switch (timeRange) {
      case "7":
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30":
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90":
        startDate = new Date(now - 90 * 24 * 60 * 60 * 1000);
        break;
      case "all":
      default:
        startDate = null; // Todos los registros
        break;
    }

    // Obtener estadísticas
    const [
      totalUsers,
      totalDecks,
      totalPublicDecks,
      totalComments,
      recentComments,
      recentUsers,
      recentDecks,
    ] = await Promise.all([
      // Total de usuarios
      prisma.user.count().catch(() => 0),
      // Total de mazos
      prisma.deck.count().catch(() => 0),
      // Total de mazos públicos
      prisma.deck.count({ where: { isPublic: true } }).catch(() => 0),
      // Total de comentarios
      prisma.comment.count().catch(() => 0),
      // Comentarios de las últimas 24 horas
      prisma.comment
        .count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        })
        .catch(() => 0),
      // Usuarios recientes (últimos 5)
      prisma.user
        .findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            createdAt: true,
          },
        })
        .catch(() => []),
      // Mazos recientes (últimos 5) con información de cartas
      prisma.deck
        .findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        })
        .catch(() => []),
    ]);

    // Calcular crecimiento según el rango de tiempo seleccionado
    const usersInRange = startDate
      ? await prisma.user
          .count({
            where: {
              createdAt: {
                gte: startDate,
              },
            },
          })
          .catch(() => 0)
      : totalUsers;

    const decksInRange = startDate
      ? await prisma.deck
          .count({
            where: {
              createdAt: {
                gte: startDate,
              },
            },
          })
          .catch(() => 0)
      : totalDecks;

    const commentsInRange = startDate
      ? await prisma.comment
          .count({
            where: {
              createdAt: {
                gte: startDate,
              },
            },
          })
          .catch(() => 0)
      : totalComments;

    // Obtener información de cartas para los mazos recientes
    const formattedRecentDecks = await Promise.all(
      recentDecks.map(async (d: any) => {
        let cardImage: string | null = null;
        let cardName: string | null = null;

        // Intentar obtener la imagen de la carta tech primero
        if (d.techCardId) {
          try {
            const techCard = await prisma.card.findUnique({
              where: { id: d.techCardId },
              select: { image: true, name: true },
            });
            if (techCard) {
              cardImage = techCard.image;
              cardName = techCard.name;
            }
          } catch (error) {
            // Ignorar errores al obtener la carta tech
          }
        }

        // Si no hay carta tech, obtener la primera carta del mazo
        if (!cardImage && d.cards) {
          try {
            const cards = d.cards as Array<{ cardId: string; quantity: number }>;
            if (cards.length > 0) {
              const firstCardId = cards[0].cardId;
              const firstCard = await prisma.card.findUnique({
                where: { id: firstCardId },
                select: { image: true, name: true },
              });
              if (firstCard) {
                cardImage = firstCard.image;
                cardName = firstCard.name;
              }
            }
          } catch (error) {
            // Ignorar errores al obtener la primera carta
          }
        }

        return {
          id: d.id,
          name: d.name,
          isPublic: d.isPublic,
          viewCount: d.viewCount,
          createdAt: d.createdAt.getTime(),
          user: d.user,
          cardImage,
          cardName,
        };
      })
    );

    // Formatear datos
    const formattedRecentUsers = recentUsers.map((u: any) => ({
      ...u,
      createdAt: u.createdAt.getTime(),
    }));

    return NextResponse.json({
      stats: {
        totalUsers,
        totalDecks,
        totalPublicDecks,
        totalComments,
        recentComments,
        usersInRange,
        decksInRange,
        commentsInRange,
        timeRange,
      },
      recentUsers: formattedRecentUsers,
      recentDecks: formattedRecentDecks,
    });
    
    const duration = Date.now() - startTime;
    log.api('GET', '/api/admin/stats', 200, duration);
    
    return NextResponse.json({
      stats: {
        totalUsers,
        totalDecks,
        totalPublicDecks,
        totalComments,
        recentComments,
        usersInRange,
        decksInRange,
        commentsInRange,
        timeRange,
      },
      recentUsers: formattedRecentUsers,
      recentDecks: formattedRecentDecks,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.prisma('getAdminStats', error, { duration });

    return NextResponse.json(
      {
        error: "Error al obtener estadísticas",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

