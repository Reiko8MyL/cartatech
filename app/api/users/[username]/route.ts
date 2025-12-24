import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { log } from "@/lib/logging/logger"

// GET - Obtener información del usuario por username
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const startTime = Date.now();
  try {
    const { username } = await params

    if (!username) {
      return NextResponse.json(
        { error: "username es requerido" },
        { status: 400 }
      )
    }

    // Obtener usuario con estadísticas
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        avatarCardId: true,
        avatarZoom: true,
        avatarPositionX: true,
        avatarPositionY: true,
        bio: true,
        profileBannerImage: true,
        country: true,
        region: true,
        city: true,
        favoriteRaces: true,
        favoriteFormat: true,
        team: true,
        preferredStore: true,
        showLocation: true,
        showFavoriteRaces: true,
        showFavoriteFormat: true,
        showTeam: true,
        showPreferredStore: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    // Obtener estadísticas del usuario (optimizado: ejecutar en paralelo)
    const [deckCount, publicDeckCount, totalLikes, totalViews] = await Promise.all([
      prisma.deck.count({
        where: { userId: user.id },
      }),
      prisma.deck.count({
        where: { userId: user.id, isPublic: true },
      }),
      prisma.deckLike.count({
        where: {
          deck: {
            userId: user.id,
          },
        },
      }),
      prisma.deck.aggregate({
        where: { userId: user.id },
        _sum: {
          viewCount: true,
        },
      }),
    ])

    // Obtener contadores de seguimiento (con manejo de error si la tabla no existe)
    let followerCount = 0;
    let followingCount = 0;
    try {
      [followerCount, followingCount] = await Promise.all([
        prisma.follow.count({
          where: { followingId: user.id },
        }),
        prisma.follow.count({
          where: { followerId: user.id },
        }),
      ]);
    } catch (followError) {
      // Si la tabla no existe o hay un error, usar valores por defecto
      log.warn("Error al obtener contadores de seguimiento", {
        error: followError instanceof Error ? followError.message : String(followError),
      });
    }

    // Obtener mazos públicos del usuario
    const publicDecks = await prisma.deck.findMany({
      where: {
        userId: user.id,
        isPublic: true,
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: 20,
      select: {
        id: true,
        name: true,
        description: true,
        format: true,
        tags: true,
        publishedAt: true,
        viewCount: true,
        createdAt: true,
        cards: true,
      },
    })

    const duration = Date.now() - startTime;
    log.api('GET', `/api/users/${username}`, 200, duration);
    
    // Parsear favoriteRaces si es un string JSON
    let favoriteRacesParsed = user.favoriteRaces;
    if (typeof user.favoriteRaces === 'string') {
      try {
        favoriteRacesParsed = JSON.parse(user.favoriteRaces);
      } catch (e) {
        favoriteRacesParsed = null;
      }
    }

    // Cache HTTP: Los perfiles de usuario cambian ocasionalmente, cachear por 5 minutos
    return NextResponse.json(
      {
      user: {
        ...user,
        favoriteRaces: favoriteRacesParsed,
        createdAt: user.createdAt.getTime(),
      },
      stats: {
        totalDecks: deckCount,
        publicDecks: publicDeckCount,
        totalLikes,
        totalViews: totalViews._sum.viewCount || 0,
        followerCount,
        followingCount,
      },
      publicDecks: publicDecks.map((deck: any) => ({
        ...deck,
        createdAt: deck.createdAt.getTime(),
        publishedAt: deck.publishedAt?.getTime(),
      })),
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // 5 min cache, 10 min stale
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime;
    log.prisma('getUserProfile', error, { duration });

    return NextResponse.json(
      {
        error: "Error al obtener información del usuario",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    )
  }
}

