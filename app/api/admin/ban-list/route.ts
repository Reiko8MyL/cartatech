import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hasAdminAccess } from "@/lib/auth/authorization";
import { getBaseCardId } from "@/lib/deck-builder/utils";
import { updateCardBanList } from "@/lib/deck-builder/cards-db";
import { checkRateLimit } from "@/lib/rate-limit/rate-limit";
import { log } from "@/lib/logging/logger";

/**
 * GET - Obtener todas las cartas con su ban list actual
 * Solo accesible para administradores
 */
export async function GET(request: NextRequest) {
  // Rate limiting para admin
  const rateLimit = checkRateLimit(request);
  if (rateLimit?.limit) {
    log.warn("Rate limit exceeded for admin ban-list", {
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
    const format = searchParams.get("format") as "RE" | "RL" | "LI" | null;

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el usuario es admin
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

    if (!hasAdminAccess(user.role)) {
      return NextResponse.json(
        {
          error:
            "No tienes permiso para realizar esta acción. Se requiere rol de administrador.",
        },
        { status: 403 }
      );
    }

    // Obtener todas las cartas principales desde BD (baseCardId es null)
    const allCards = await prisma.card.findMany({
      where: { 
        baseCardId: null, // Solo cartas principales
      },
      orderBy: { id: "asc" },
    });
    
    // Obtener cartas alternativas (baseCardId no es null)
    const altCards = await prisma.card.findMany({
      where: { 
        baseCardId: { not: null }, // Solo cartas alternativas
      },
      orderBy: { id: "asc" },
    });

    // Agrupar cartas por ID base para mostrar solo las principales
    // pero incluir información de cuántas alternativas tienen
    const cardsMap = new Map<string, any>();
    const altCardsByBase = new Map<string, any[]>();

    // Procesar cartas alternativas
    for (const altCard of altCards) {
      const baseId = getBaseCardId(altCard.id);
      if (!altCardsByBase.has(baseId)) {
        altCardsByBase.set(baseId, []);
      }
      altCardsByBase.get(baseId)!.push(altCard);
    }

    // Procesar cartas principales
    for (const card of allCards) {
      const baseId = getBaseCardId(card.id);
      if (!cardsMap.has(baseId)) {
        cardsMap.set(baseId, {
          id: baseId,
          name: card.name,
          type: card.type,
          edition: card.edition,
          image: card.image,
          isUnique: card.isUnique,
          banListRE: card.banListRE,
          banListRL: card.banListRL,
          banListLI: card.banListLI,
          alternativeArtsCount: altCardsByBase.get(baseId)?.length || 0,
        });
      }
    }

    const cards = Array.from(cardsMap.values());

    // Si se especifica un formato, ordenar por ban list de ese formato
    if (format) {
      cards.sort((a, b) => {
        const aValue = format === "RE" ? a.banListRE : format === "RL" ? a.banListRL : a.banListLI;
        const bValue = format === "RE" ? b.banListRE : format === "RL" ? b.banListRL : b.banListLI;
        return aValue - bValue;
      });
    }

    const duration = Date.now() - startTime;
    log.api('GET', '/api/admin/ban-list', 200, duration);

    return NextResponse.json({ cards });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.prisma('getBanList', error, { duration });

    return NextResponse.json(
      {
        error: "Error al obtener ban list",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Actualizar ban list de una carta
 * Solo accesible para administradores
 */
export async function PUT(request: NextRequest) {
  // Rate limiting para admin
  const rateLimit = checkRateLimit(request);
  if (rateLimit?.limit) {
    log.warn("Rate limit exceeded for admin ban-list update", {
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
    const { userId, cardId, format, value } = body;

    if (!userId || !cardId || !format || value === undefined) {
      return NextResponse.json(
        { error: "userId, cardId, format y value son requeridos" },
        { status: 400 }
      );
    }

    if (!["RE", "RL", "LI"].includes(format)) {
      return NextResponse.json(
        { error: "format debe ser RE, RL o LI" },
        { status: 400 }
      );
    }

    if (![0, 1, 2, 3].includes(value)) {
      return NextResponse.json(
        { error: "value debe ser 0, 1, 2 o 3" },
        { status: 400 }
      );
    }

    // Verificar que el usuario es admin
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

    if (!hasAdminAccess(user.role)) {
      return NextResponse.json(
        {
          error:
            "No tienes permiso para realizar esta acción. Se requiere rol de administrador.",
        },
        { status: 403 }
      );
    }

    // Obtener ID base de la carta
    const baseId = getBaseCardId(cardId);

    // Verificar que la carta existe
    const cardExists = await prisma.card.findUnique({
      where: { id: baseId },
      select: { id: true },
    });

    if (!cardExists) {
      return NextResponse.json(
        {
          error: `No se encontró la carta ${baseId}`,
        },
        { status: 404 }
      );
    }

    // Actualizar ban list usando la función helper
    try {
      const result = await updateCardBanList(baseId, format, value);
      
      const duration = Date.now() - startTime;
      log.api('PUT', '/api/admin/ban-list', 200, duration);
      
      return NextResponse.json({
        success: true,
        message: `Ban list actualizada para ${baseId} y todas sus versiones alternativas`,
        updated: result.updated,
      });
    } catch (dbError) {
      const duration = Date.now() - startTime;
      log.prisma('updateBanList', dbError, { duration });
      return NextResponse.json(
        {
          error: "Error al actualizar ban list en la base de datos",
          ...(process.env.NODE_ENV === "development" && {
            details:
              dbError instanceof Error ? dbError.message : String(dbError),
          }),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    log.prisma('updateBanList', error, { duration });

    return NextResponse.json(
      {
        error: "Error al actualizar ban list",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

