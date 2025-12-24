import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/rate-limit/rate-limit";
import { log } from "@/lib/logging/logger";

// GET - Obtener feed de actividad de usuarios seguidos
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Rate limiting para lectura
  const rateLimit = checkRateLimit(request);
  if (rateLimit?.limit) {
    log.warn("Rate limit exceeded for feed", {
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

  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50); // Máximo 50 por página

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Obtener IDs de usuarios seguidos
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map(f => f.followingId);

    // Si no sigue a nadie, retornar feed vacío
    if (followingIds.length === 0) {
      const duration = Date.now() - startTime;
      log.api('GET', '/api/feed', 200, duration);
      return NextResponse.json({
        activities: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    // Obtener actividades de los últimos 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 1. Mazos publicados recientemente por usuarios seguidos
    const recentDecks = await prisma.deck.findMany({
      where: {
        userId: { in: followingIds },
        isPublic: true,
        publishedAt: {
          gte: sevenDaysAgo,
          not: null,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarCardId: true,
            avatarZoom: true,
            avatarPositionX: true,
            avatarPositionY: true,
          },
        },
        _count: {
          select: {
            likes: true,
            favorites: true,
            comments: true,
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: limit * 2, // Tomar más para tener variedad
    });

    // 2. Likes recientes en mazos (de usuarios seguidos o en mazos de usuarios seguidos)
    const recentLikes = await prisma.deckLike.findMany({
      where: {
        OR: [
          { userId: { in: followingIds } }, // Likes de usuarios seguidos
          { deck: { userId: { in: followingIds } } }, // Likes en mazos de usuarios seguidos
        ],
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarCardId: true,
            avatarZoom: true,
            avatarPositionX: true,
            avatarPositionY: true,
          },
        },
        deck: {
          select: {
            id: true,
            name: true,
            format: true,
            userId: true,
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit * 2,
    });

    // 3. Comentarios recientes (de usuarios seguidos o en mazos de usuarios seguidos)
    const recentComments = await prisma.comment.findMany({
      where: {
        OR: [
          { userId: { in: followingIds } }, // Comentarios de usuarios seguidos
          { deck: { userId: { in: followingIds } } }, // Comentarios en mazos de usuarios seguidos
        ],
        parentId: null, // Solo comentarios principales, no respuestas
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarCardId: true,
            avatarZoom: true,
            avatarPositionX: true,
            avatarPositionY: true,
          },
        },
        deck: {
          select: {
            id: true,
            name: true,
            format: true,
            userId: true,
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit * 2,
    });

    // Combinar y ordenar todas las actividades por fecha
    interface Activity {
      type: 'deck_published' | 'deck_liked' | 'deck_commented';
      timestamp: Date;
      data: any;
    }

    const activities: Activity[] = [
      ...recentDecks.map(deck => ({
        type: 'deck_published' as const,
        timestamp: deck.publishedAt!,
        data: {
          deck: {
            id: deck.id,
            name: deck.name,
            description: deck.description,
            format: deck.format,
            publishedAt: deck.publishedAt?.getTime(),
            viewCount: deck.viewCount,
            likes: deck._count.likes,
            favorites: deck._count.favorites,
            comments: deck._count.comments,
            backgroundImage: deck.backgroundImage,
            techCardId: deck.techCardId,
          },
          user: {
            id: deck.user.id,
            username: deck.user.username,
            avatarCardId: deck.user.avatarCardId,
            avatarZoom: deck.user.avatarZoom,
            avatarPositionX: deck.user.avatarPositionX,
            avatarPositionY: deck.user.avatarPositionY,
          },
        },
      })),
      ...recentLikes.map(like => ({
        type: 'deck_liked' as const,
        timestamp: like.createdAt,
        data: {
          like: {
            id: like.id,
            createdAt: like.createdAt.getTime(),
          },
          user: {
            id: like.user.id,
            username: like.user.username,
            avatarCardId: like.user.avatarCardId,
            avatarZoom: like.user.avatarZoom,
            avatarPositionX: like.user.avatarPositionX,
            avatarPositionY: like.user.avatarPositionY,
          },
          deck: {
            id: like.deck.id,
            name: like.deck.name,
            format: like.deck.format,
            userId: like.deck.userId,
            author: {
              id: like.deck.user.id,
              username: like.deck.user.username,
            },
          },
        },
      })),
      ...recentComments.map(comment => ({
        type: 'deck_commented' as const,
        timestamp: comment.createdAt,
        data: {
          comment: {
            id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt.getTime(),
            repliesCount: comment._count.replies,
          },
          user: {
            id: comment.user.id,
            username: comment.user.username,
            avatarCardId: comment.user.avatarCardId,
            avatarZoom: comment.user.avatarZoom,
            avatarPositionX: comment.user.avatarPositionX,
            avatarPositionY: comment.user.avatarPositionY,
          },
          deck: {
            id: comment.deck.id,
            name: comment.deck.name,
            format: comment.deck.format,
            userId: comment.deck.userId,
            author: {
              id: comment.deck.user.id,
              username: comment.deck.user.username,
            },
          },
        },
      })),
    ];

    // Ordenar por fecha (más reciente primero)
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Aplicar paginación
    const total = activities.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedActivities = activities.slice(startIndex, endIndex);

    const duration = Date.now() - startTime;
    log.api('GET', '/api/feed', 200, duration);

    return NextResponse.json({
      activities: paginatedActivities,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.error("Error al obtener feed de actividad", error, { duration });
    
    return NextResponse.json(
      { 
        error: "Error al obtener feed de actividad",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

