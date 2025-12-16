import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/rate-limit/rate-limit";
import { log } from "@/lib/logging/logger";

/**
 * GET /api/search/autocomplete
 * Búsqueda de autocompletado para cartas o mazos
 * Parámetros:
 * - query: texto de búsqueda (requerido, mínimo 2 caracteres)
 * - type: "carta" | "mazo" (requerido)
 * - limit: número máximo de resultados (opcional, default: 8)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    // Rate limiting para lectura
    const rateLimit = checkRateLimit(request);
    if (rateLimit?.limit) {
      log.warn("Rate limit exceeded", {
        identifier: request.headers.get('x-forwarded-for') || 'unknown',
        endpoint: '/api/search/autocomplete',
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

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query")?.trim() || "";
    const type = searchParams.get("type") as "carta" | "mazo" | null;
    const limit = parseInt(searchParams.get("limit") || "8", 10);

    // Validaciones
    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "La búsqueda debe tener al menos 2 caracteres" },
        { status: 400 }
      );
    }

    if (!type || (type !== "carta" && type !== "mazo")) {
      return NextResponse.json(
        { error: "El tipo debe ser 'carta' o 'mazo'" },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 20) {
      return NextResponse.json(
        { error: "El límite debe estar entre 1 y 20" },
        { status: 400 }
      );
    }

    if (type === "carta") {
      // Búsqueda de cartas por nombre
      const cards = await prisma.card.findMany({
        where: {
          baseCardId: null, // Solo cartas principales
          name: {
            contains: query,
            mode: "insensitive", // Búsqueda case-insensitive
          },
        },
        select: {
          id: true,
          name: true,
          type: true,
          edition: true,
          image: true,
        },
        orderBy: [
          { name: "asc" }, // Ordenar alfabéticamente
        ],
        take: limit,
      });

      const duration = Date.now() - startTime;
      log.api('GET', '/api/search/autocomplete', 200, duration, { type: 'carta', queryLength: query.length });

      return NextResponse.json({
        results: cards.map((card) => ({
          id: card.id,
          name: card.name,
          type: card.type,
          edition: card.edition,
          image: card.image,
        })),
        total: cards.length,
      });
    } else {
      // Búsqueda de mazos públicos por nombre o descripción
      const decks = await prisma.deck.findMany({
        where: {
          isPublic: true,
          OR: [
            {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: [
          { publishedAt: "desc" }, // Más recientes primero
        ],
        take: limit,
      });

      const duration = Date.now() - startTime;
      log.api('GET', '/api/search/autocomplete', 200, duration, { type: 'mazo', queryLength: query.length });

      return NextResponse.json({
        results: decks.map((deck) => ({
          id: deck.id,
          name: deck.name,
          description: deck.description,
          format: deck.format,
          author: {
            id: deck.user.id,
            username: deck.user.username,
          },
          viewCount: deck.viewCount,
        })),
        total: decks.length,
      });
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    log.error("Error en autocompletado", error, { duration });
    
    return NextResponse.json(
      {
        error: "Error al realizar la búsqueda",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

