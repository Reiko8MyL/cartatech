import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/rate-limit/rate-limit";
import { log } from "@/lib/logging/logger";

// GET - Obtener votos
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const race = searchParams.get("race");

    // Si se proporciona userId y race, obtener el voto específico del usuario
    if (userId && race) {
      const vote = await prisma.vote.findUnique({
        where: {
          userId_race: {
            userId,
            race,
          },
        },
      });

      const duration = Date.now() - startTime;
      log.api('GET', '/api/votes', 200, duration);

      return NextResponse.json({
        cardId: vote?.cardId || null,
      });
    }

    // Si solo se proporciona race, obtener todos los votos de esa raza
    if (race) {
      const votes = await prisma.vote.findMany({
        where: {
          race,
        },
        select: {
          race: true,
          cardId: true,
          userId: true,
          createdAt: true,
        },
      });

      const duration = Date.now() - startTime;
      log.api('GET', '/api/votes', 200, duration);

      return NextResponse.json({
        votes: votes.map((v: any) => ({
          race: v.race,
          cardId: v.cardId,
          userId: v.userId,
          timestamp: v.createdAt.getTime(),
        })),
      });
    }

    // Si no se proporciona ningún parámetro, obtener todos los votos
    const allVotes = await prisma.vote.findMany({
      select: {
        race: true,
        cardId: true,
        userId: true,
        createdAt: true,
      },
    });

    const duration = Date.now() - startTime;
    log.api('GET', '/api/votes', 200, duration);

    return NextResponse.json({
      votes: allVotes.map((v: any) => ({
        race: v.race,
        cardId: v.cardId,
        userId: v.userId,
        timestamp: v.createdAt.getTime(),
      })),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.prisma('getVotes', error, { duration });
    
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al obtener votos";
    const errorDetails = process.env.NODE_ENV === "development" ? errorMessage : undefined;
    
    return NextResponse.json(
      { 
        error: "Error al obtener votos",
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

// POST - Guardar o actualizar un voto
export async function POST(request: NextRequest) {
  // Rate limiting para escritura
  const rateLimit = checkRateLimit(request);
  if (rateLimit?.limit) {
    log.warn("Rate limit exceeded for vote", {
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
    const { userId, race, cardId } = body as { userId: string; race: string; cardId: string };

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      );
    }

    if (!race) {
      return NextResponse.json(
        { error: "race es requerido" },
        { status: 400 }
      );
    }

    if (!cardId) {
      return NextResponse.json(
        { error: "cardId es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Usar upsert para crear o actualizar el voto
    await prisma.vote.upsert({
      where: {
        userId_race: {
          userId,
          race,
        },
      },
      create: {
        userId,
        race,
        cardId,
      },
      update: {
        cardId,
      },
    });

    const duration = Date.now() - startTime;
    log.api('POST', '/api/votes', 200, duration);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.prisma('saveVote', error, { duration });
    
    // Asegurar que siempre devolvemos un JSON válido
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al guardar voto";
    const errorDetails = process.env.NODE_ENV === "development" ? errorMessage : undefined;
    
    return NextResponse.json(
      { 
        error: "Error al guardar voto",
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

