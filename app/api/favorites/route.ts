import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/rate-limit/rate-limit";
import { log } from "@/lib/logging/logger";

// GET - Obtener mazos favoritos del usuario
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      );
    }

    const favorites = await prisma.favoriteDeck.findMany({
      where: { userId },
      include: {
        deck: {
          include: {
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
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      favoriteDeckIds: favorites.map((f: any) => f.deckId),
      decks: favorites.map((favorite: any) => ({
        id: favorite.deck.id,
        name: favorite.deck.name,
        description: favorite.deck.description,
        cards: favorite.deck.cards,
        format: favorite.deck.format,
        createdAt: favorite.deck.createdAt.getTime(),
        userId: favorite.deck.userId,
        author: favorite.deck.user.username,
        isPublic: favorite.deck.isPublic,
        publishedAt: favorite.deck.publishedAt?.getTime(),
        techCardId: favorite.deck.techCardId,
        viewCount: favorite.deck.viewCount,
        tags: favorite.deck.tags,
      })),
    });
    
    const duration = Date.now() - startTime;
    log.api('GET', '/api/favorites', 200, duration);
    
    return NextResponse.json({
      favoriteDeckIds: favorites.map((f: any) => f.deckId),
      decks: favorites.map((favorite: any) => ({
        id: favorite.deck.id,
        name: favorite.deck.name,
        description: favorite.deck.description,
        cards: favorite.deck.cards,
        format: favorite.deck.format,
        createdAt: favorite.deck.createdAt.getTime(),
        userId: favorite.deck.userId,
        author: favorite.deck.user.username,
        isPublic: favorite.deck.isPublic,
        publishedAt: favorite.deck.publishedAt?.getTime(),
        techCardId: favorite.deck.techCardId,
        viewCount: favorite.deck.viewCount,
        tags: favorite.deck.tags,
      })),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.prisma('getFavorites', error, { duration });
    return NextResponse.json(
      { error: "Error al obtener favoritos" },
      { status: 500 }
    );
  }
}

// POST - Agregar mazo a favoritos
export async function POST(request: NextRequest) {
  // Rate limiting para escritura
  const rateLimit = checkRateLimit(request);
  if (rateLimit?.limit) {
    log.warn("Rate limit exceeded for favorite creation", {
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
    const body = await request.json();
    const { userId, deckId } = body;

    if (!userId || !deckId) {
      return NextResponse.json(
        { error: "userId y deckId son requeridos" },
        { status: 400 }
      );
    }

    // Verificar que el mazo existe
    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
    });

    if (!deck) {
      return NextResponse.json(
        { error: "Mazo no encontrado" },
        { status: 404 }
      );
    }

    // Crear o verificar favorito
    const favorite = await prisma.favoriteDeck.upsert({
      where: {
        userId_deckId: {
          userId,
          deckId,
        },
      },
      create: {
        userId,
        deckId,
      },
      update: {},
    });

    const duration = Date.now() - startTime;
    log.api('POST', '/api/favorites', 200, duration);

    return NextResponse.json({ success: true, favorite });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.prisma('createFavorite', error, { duration });
    return NextResponse.json(
      { error: "Error al agregar favorito" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar mazo de favoritos
export async function DELETE(request: NextRequest) {
  // Rate limiting para escritura
  const rateLimit = checkRateLimit(request);
  if (rateLimit?.limit) {
    log.warn("Rate limit exceeded for favorite deletion", {
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
    const deckId = searchParams.get("deckId");

    if (!userId || !deckId) {
      return NextResponse.json(
        { error: "userId y deckId son requeridos" },
        { status: 400 }
      );
    }

    await prisma.favoriteDeck.delete({
      where: {
        userId_deckId: {
          userId,
          deckId,
        },
      },
    });

    const duration = Date.now() - startTime;
    log.api('DELETE', '/api/favorites', 200, duration);

    return NextResponse.json({ success: true });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.prisma('deleteFavorite', error, { duration });
    return NextResponse.json(
      { error: "Error al eliminar favorito" },
      { status: 500 }
    );
  }
}


