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
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    // Obtener estadísticas del usuario
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
    
    return NextResponse.json({
      user: {
        ...user,
        createdAt: user.createdAt.getTime(),
      },
      stats: {
        totalDecks: deckCount,
        publicDecks: publicDeckCount,
        totalLikes,
        totalViews: totalViews._sum.viewCount || 0,
      },
      publicDecks: publicDecks.map((deck: any) => ({
        ...deck,
        createdAt: deck.createdAt.getTime(),
        publishedAt: deck.publishedAt?.getTime(),
        updatedAt: deck.updatedAt.getTime(),
      })),
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

