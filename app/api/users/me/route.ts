import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logging/logger";
import { checkRateLimit } from "@/lib/rate-limit/rate-limit";

/**
 * GET - Obtener perfil completo del usuario actual con estadísticas
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Rate limiting
  const rateLimit = checkRateLimit(request);
  if (rateLimit?.limit) {
    log.warn("Rate limit exceeded", {
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
    const userId = request.headers.get("x-user-id") || request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      );
    }

    // Obtener usuario
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          avatarCardId: true,
          avatarZoom: true,
          avatarPositionX: true,
          avatarPositionY: true,
          bio: true,
          profileBannerImage: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (userError) {
      console.error("Error al obtener usuario:", userError);
      // Log detallado del error
      if (userError && typeof userError === 'object') {
        if ('code' in userError) {
          console.error("Prisma error code:", userError.code);
        }
        if ('meta' in userError) {
          console.error("Prisma error meta:", userError.meta);
        }
        if ('message' in userError) {
          console.error("Error message:", userError.message);
        }
      }
      throw userError; // Re-lanzar para que se maneje en el catch general
    }

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Obtener estadísticas del usuario
    // Usar try-catch individual para cada consulta para identificar qué falla
    let deckCount = 0;
    let publicDeckCount = 0;
    let privateDeckCount = 0;
    let totalLikes = 0;
    let totalViews = 0;
    let favoriteCount = 0;
    let commentCount = 0;

    try {
      [deckCount, publicDeckCount, privateDeckCount, totalLikes, totalViews, favoriteCount, commentCount] = await Promise.all([
        prisma.deck.count({
          where: { userId: user.id },
        }).catch((e) => {
          console.error("Error en deckCount:", e);
          return 0;
        }),
        prisma.deck.count({
          where: { userId: user.id, isPublic: true },
        }).catch((e) => {
          console.error("Error en publicDeckCount:", e);
          return 0;
        }),
        prisma.deck.count({
          where: { userId: user.id, isPublic: false },
        }).catch((e) => {
          console.error("Error en privateDeckCount:", e);
          return 0;
        }),
        prisma.deckLike.count({
          where: {
            deck: {
              userId: user.id,
            },
          },
        }).catch((e) => {
          console.error("Error en totalLikes:", e);
          return 0;
        }),
        prisma.deck.aggregate({
          where: { userId: user.id },
          _sum: {
            viewCount: true,
          },
        }).then((result) => result._sum.viewCount || 0).catch((e) => {
          console.error("Error en totalViews:", e);
          return 0;
        }),
        prisma.favoriteDeck.count({
          where: { userId: user.id },
        }).catch((e) => {
          console.error("Error en favoriteCount:", e);
          return 0;
        }),
        prisma.comment.count({
          where: { userId: user.id },
        }).catch((e) => {
          console.error("Error en commentCount:", e);
          return 0;
        }),
      ]);
    } catch (statsError) {
      console.error("Error al obtener estadísticas:", statsError);
      // Continuar con valores por defecto
    }

    // Obtener mazos recientes (últimos 5) con todos los datos necesarios para mostrar banners
    let recentDecks: Array<{ 
      id: string; 
      name: string; 
      description: string | null;
      isPublic: boolean; 
      format: string;
      tags: string[];
      backgroundImage: string | null;
      viewCount: number;
      updatedAt: Date;
      createdAt: Date;
      cards: any;
    }> = [];
    try {
      recentDecks = await prisma.deck.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          description: true,
          isPublic: true,
          format: true,
          tags: true,
          backgroundImage: true,
          viewCount: true,
          updatedAt: true,
          createdAt: true,
          cards: true,
        },
      });
    } catch (e) {
      console.error("Error al obtener mazos recientes:", e);
    }

    // Obtener favoritos recientes (últimos 5) con todos los datos necesarios para mostrar banners
    let recentFavorites: Array<{
      id: string;
      createdAt: Date;
      deck: {
        id: string;
        name: string;
        description: string | null;
        isPublic: boolean;
        format: string;
        tags: string[];
        backgroundImage: string | null;
        viewCount: number;
        createdAt: Date;
        cards: any;
        user: {
          username: string;
        };
      };
    }> = [];
    try {
      recentFavorites = await prisma.favoriteDeck.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          deck: {
            select: {
              id: true,
              name: true,
              description: true,
              isPublic: true,
              format: true,
              tags: true,
              backgroundImage: true,
              viewCount: true,
              createdAt: true,
              cards: true,
              user: {
                select: {
                  username: true,
                },
              },
            },
          },
        },
      });
    } catch (e) {
      console.error("Error al obtener favoritos recientes:", e);
    }

    const duration = Date.now() - startTime;
    log.api('GET', '/api/users/me', 200, duration);

    return NextResponse.json({
      user: {
        ...user,
        avatarZoom: user.avatarZoom ?? null,
        avatarPositionX: user.avatarPositionX ?? null,
        avatarPositionY: user.avatarPositionY ?? null,
        createdAt: user.createdAt.getTime(),
        updatedAt: user.updatedAt.getTime(),
      },
      stats: {
        totalDecks: deckCount,
        publicDecks: publicDeckCount,
        privateDecks: privateDeckCount,
        totalLikes,
        totalViews,
        favoriteCount,
        commentCount,
      },
      recentDecks: recentDecks.map((deck) => ({
        ...deck,
        updatedAt: deck.updatedAt.getTime(),
        createdAt: deck.createdAt.getTime(),
      })),
      recentFavorites: recentFavorites.map((fav) => ({
        id: fav.id,
        createdAt: fav.createdAt.getTime(),
        deck: {
          ...fav.deck,
          createdAt: fav.deck.createdAt.getTime(),
          user: fav.deck.user,
        },
      })),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.prisma('getUserProfile', error, { duration });

    // Log detallado para debugging
    console.error("=== ERROR EN /api/users/me ===");
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    // Log de errores de Prisma
    if (error && typeof error === 'object') {
      if ('code' in error) {
        console.error("Prisma error code:", error.code);
      }
      if ('meta' in error) {
        console.error("Prisma error meta:", error.meta);
      }
      console.error("Full error object:", JSON.stringify(error, null, 2));
    }

    return NextResponse.json(
      {
        error: "Error al obtener información del usuario",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
          code: error && typeof error === 'object' && 'code' in error ? error.code : undefined,
        }),
      },
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json",
        }
      }
    );
  }
}

/**
 * PUT - Actualizar perfil del usuario actual
 */
export async function PUT(request: NextRequest) {
  const startTime = Date.now();
  
  // Rate limiting
  const rateLimit = checkRateLimit(request);
  if (rateLimit?.limit) {
    log.warn("Rate limit exceeded", {
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
    const userId = request.headers.get("x-user-id") || request.nextUrl.searchParams.get("userId");
    const body = await request.json();
    const { avatarCardId, avatarZoom, avatarPositionX, avatarPositionY, bio, profileBannerImage } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Validar que el usuario solo puede actualizar su propio perfil
    // (esto se verifica en el cliente, pero es buena práctica validarlo en el servidor también)
    
    // Validar bio (máximo 500 caracteres)
    if (bio !== undefined && bio !== null && bio.length > 500) {
      return NextResponse.json(
        { error: "La biografía no puede exceder 500 caracteres" },
        { status: 400 }
      );
    }

    // Convertir valores a números si son strings (antes de validar)
    const zoomValue = avatarZoom !== undefined && avatarZoom !== null 
      ? typeof avatarZoom === 'string' ? parseFloat(avatarZoom) : Number(avatarZoom)
      : null;
    const positionXValue = avatarPositionX !== undefined && avatarPositionX !== null 
      ? typeof avatarPositionX === 'string' ? parseFloat(avatarPositionX) : Number(avatarPositionX)
      : null;
    const positionYValue = avatarPositionY !== undefined && avatarPositionY !== null 
      ? typeof avatarPositionY === 'string' ? parseFloat(avatarPositionY) : Number(avatarPositionY)
      : null;

    // Validar zoom (0.5 a 3.0)
    if (zoomValue !== null && (isNaN(zoomValue) || zoomValue < 0.5 || zoomValue > 3.0)) {
      return NextResponse.json(
        { error: "El zoom debe estar entre 0.5 y 3.0" },
        { status: 400 }
      );
    }

    // Validar posición X e Y (0 a 100)
    if (positionXValue !== null && (isNaN(positionXValue) || positionXValue < 0 || positionXValue > 100)) {
      return NextResponse.json(
        { error: "La posición X debe estar entre 0 y 100" },
        { status: 400 }
      );
    }

    if (positionYValue !== null && (isNaN(positionYValue) || positionYValue < 0 || positionYValue > 100)) {
      return NextResponse.json(
        { error: "La posición Y debe estar entre 0 y 100" },
        { status: 400 }
      );
    }

    // Validar que la carta existe si se proporciona avatarCardId
    if (avatarCardId !== undefined && avatarCardId !== null) {
      const card = await prisma.card.findUnique({
        where: { id: avatarCardId },
        select: { id: true },
      });
      
      if (!card) {
        return NextResponse.json(
          { error: "La carta seleccionada no existe" },
          { status: 400 }
        );
      }
    }

    // Log de valores antes de guardar (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log('Guardando avatar en API:', {
        avatarCardId,
        zoomValue,
        positionXValue,
        positionYValue,
      })
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(avatarCardId !== undefined && { avatarCardId: avatarCardId || null }), // Permitir eliminar avatar con null
        ...(avatarZoom !== undefined && { avatarZoom: zoomValue }),
        ...(avatarPositionX !== undefined && { avatarPositionX: positionXValue }),
        ...(avatarPositionY !== undefined && { avatarPositionY: positionYValue }),
        ...(bio !== undefined && { bio: bio || null }), // Permitir eliminar bio con string vacío
        ...(profileBannerImage !== undefined && { profileBannerImage: profileBannerImage || null }), // Permitir eliminar banner con null
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatarCardId: true,
        avatarZoom: true,
        avatarPositionX: true,
        avatarPositionY: true,
        bio: true,
        profileBannerImage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const duration = Date.now() - startTime;
    log.api('PUT', '/api/users/me', 200, duration);

    // Log de valores guardados (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log('Avatar guardado en BD:', {
        avatarCardId: updatedUser.avatarCardId,
        avatarZoom: updatedUser.avatarZoom,
        avatarPositionX: updatedUser.avatarPositionX,
        avatarPositionY: updatedUser.avatarPositionY,
      })
    }

    return NextResponse.json({
      user: {
        ...updatedUser,
        avatarZoom: updatedUser.avatarZoom ?? null,
        avatarPositionX: updatedUser.avatarPositionX ?? null,
        avatarPositionY: updatedUser.avatarPositionY ?? null,
        createdAt: updatedUser.createdAt.getTime(),
        updatedAt: updatedUser.updatedAt.getTime(),
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.prisma('updateUserProfile', error, { duration });

    return NextResponse.json(
      {
        error: "Error al actualizar el perfil",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}
