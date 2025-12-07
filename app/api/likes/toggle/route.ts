import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/rate-limit/rate-limit";
import { log } from "@/lib/logging/logger";

// POST - Alternar like
export async function POST(request: NextRequest) {
  // Rate limiting para escritura
  const rateLimit = checkRateLimit(request);
  if (rateLimit?.limit) {
    log.warn("Rate limit exceeded for like toggle", {
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
    const { userId, deckId } = body as { userId: string; deckId: string };

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      );
    }

    if (!deckId) {
      return NextResponse.json(
        { error: "deckId es requerido" },
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

    // Verificar si el usuario ya dio like
    const existingLike = await prisma.deckLike.findUnique({
      where: {
        userId_deckId: {
          userId,
          deckId,
        },
      },
    });

    if (existingLike) {
      // Eliminar like
      await prisma.deckLike.delete({
        where: {
          userId_deckId: {
            userId,
            deckId,
          },
        },
      });

      const duration = Date.now() - startTime;
      log.api('POST', '/api/likes/toggle', 200, duration);

      return NextResponse.json({
        isLiked: false,
      });
    } else {
      // Crear like
      await prisma.deckLike.create({
        data: {
          userId,
          deckId,
        },
      });

      const duration = Date.now() - startTime;
      log.api('POST', '/api/likes/toggle', 200, duration);

      return NextResponse.json({
        isLiked: true,
      });
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    log.prisma('toggleLike', error, { duration });
    
    // Asegurar que siempre devolvemos un JSON válido
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al alternar like";
    const errorDetails = process.env.NODE_ENV === "development" ? errorMessage : undefined;
    
    return NextResponse.json(
      { 
        error: "Error al alternar like",
        ...(errorDetails && { details: errorDetails })
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








