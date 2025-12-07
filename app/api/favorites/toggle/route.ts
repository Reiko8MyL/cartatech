import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/rate-limit/rate-limit";
import { log } from "@/lib/logging/logger";

// POST - Alternar estado de favorito
export async function POST(request: NextRequest) {
  // Rate limiting para escritura
  const rateLimit = checkRateLimit(request);
  if (rateLimit?.limit) {
    log.warn("Rate limit exceeded for favorite toggle", {
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
  let userId: string | undefined;
  let deckId: string | undefined;
  try {
    const body = await request.json();
    userId = body.userId;
    deckId = body.deckId;

    if (!userId || !deckId) {
      return NextResponse.json(
        { error: "userId y deckId son requeridos" },
        { status: 400 }
      );
    }

    // Verificar que el mazo existe en la base de datos
    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
    });

    if (!deck) {
      return NextResponse.json(
        { error: "El mazo no existe" },
        { status: 404 }
      );
    }

    // Verificar si ya es favorito
    const existing = await prisma.favoriteDeck.findUnique({
      where: {
        userId_deckId: {
          userId,
          deckId,
        },
      },
    });

    if (existing) {
      // Eliminar de favoritos
      await prisma.favoriteDeck.delete({
        where: {
          userId_deckId: {
            userId,
            deckId,
          },
        },
      });
      
      const duration = Date.now() - startTime;
      log.api('POST', '/api/favorites/toggle', 200, duration);
      
      return NextResponse.json({ isFavorite: false });
    } else {
      // Agregar a favoritos
      await prisma.favoriteDeck.create({
        data: {
          userId,
          deckId,
        },
      });
      
      const duration = Date.now() - startTime;
      log.api('POST', '/api/favorites/toggle', 200, duration);
      
      return NextResponse.json({ isFavorite: true });
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Verificar si es un error de Prisma
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any;
      // Error de foreign key constraint (el mazo o usuario no existe)
      if (prismaError.code === 'P2003') {
        log.warn("Favorite toggle: deck or user not found", { userId, deckId, duration });
        return NextResponse.json(
          { error: "El mazo o usuario no existe" },
          { status: 404 }
        );
      }
      // Error de unique constraint (ya existe)
      if (prismaError.code === 'P2002') {
        log.warn("Favorite toggle: duplicate entry", { userId, deckId, duration });
        return NextResponse.json(
          { error: "El favorito ya existe" },
          { status: 409 }
        );
      }
    }
    
    log.prisma('toggleFavorite', error, { userId, deckId, duration });
    
    return NextResponse.json(
      { 
        error: "Error al alternar favorito",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}

