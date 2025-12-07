import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/rate-limit/rate-limit";
import { log } from "@/lib/logging/logger";

// GET - Obtener la colección de un usuario
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

    // Buscar la colección del usuario
    let collection = await prisma.userCollection.findUnique({
      where: { userId },
      select: { cardIds: true },
    });

    // Si no existe, intentar crear una colección vacía
    if (!collection) {
      try {
        // Verificar que el usuario existe primero
        const userExists = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true },
        });

        if (!userExists) {
          // Si el usuario no existe, retornar array vacío (fallback)
          return NextResponse.json({
            cardIds: [],
          });
        }

        // Crear la colección
        collection = await prisma.userCollection.create({
          data: {
            userId,
            cardIds: [],
          },
          select: { cardIds: true },
        });
      } catch (createError) {
        if (process.env.NODE_ENV === "development") {
          log.warn("Error al crear colección", { error: createError });
        }
        
        // Si es un error de foreign key constraint, el usuario no existe
        if (createError && typeof createError === "object" && "code" in createError) {
          const prismaError = createError as any;
          if (prismaError.code === "P2003") {
            // Foreign key constraint failed - usuario no existe
            return NextResponse.json({
              cardIds: [],
            });
          }
        }
        
        // Si falla la creación por otro motivo, retornar array vacío
        return NextResponse.json({
          cardIds: [],
        });
      }
    }

    const duration = Date.now() - startTime;
    log.api('GET', '/api/collection', 200, duration);

    return NextResponse.json({
      cardIds: collection.cardIds || [],
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.prisma('getCollection', error, { duration });
    
    return NextResponse.json(
      { error: "Error al obtener colección" },
      { status: 500 }
    );
  }
}

// POST - Agregar o quitar una carta de la colección (toggle)
export async function POST(request: NextRequest) {
  // Rate limiting para escritura
  const rateLimit = checkRateLimit(request);
  if (rateLimit?.limit) {
    log.warn("Rate limit exceeded for collection toggle", {
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
    const { userId, cardId } = body;

    if (!userId || !cardId) {
      return NextResponse.json(
        { error: "userId y cardId son requeridos" },
        { status: 400 }
      );
    }

    // Buscar la colección del usuario
    let collection = await prisma.userCollection.findUnique({
      where: { userId },
    });

    // Si no existe, crear una nueva
    if (!collection) {
      collection = await prisma.userCollection.create({
        data: {
          userId,
          cardIds: [],
        },
      });
    }

    // Toggle: agregar si no existe, quitar si existe
    const currentCardIds = collection.cardIds || [];
    const isInCollection = currentCardIds.includes(cardId);
    
    const updatedCardIds = isInCollection
      ? currentCardIds.filter((id: string) => id !== cardId)
      : [...currentCardIds, cardId];

    // Actualizar la colección
    const updatedCollection = await prisma.userCollection.update({
      where: { userId },
      data: {
        cardIds: updatedCardIds,
      },
      select: { cardIds: true },
    });

    const duration = Date.now() - startTime;
    log.api('POST', '/api/collection', 200, duration);

    return NextResponse.json({
      cardIds: updatedCollection.cardIds,
      isInCollection: !isInCollection,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.prisma('toggleCollection', error, { duration });
    
    return NextResponse.json(
      { error: "Error al actualizar colección" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar toda la colección (reemplazar completamente)
export async function PUT(request: NextRequest) {
  // Rate limiting para escritura
  const rateLimit = checkRateLimit(request);
  if (rateLimit?.limit) {
    log.warn("Rate limit exceeded for collection update", {
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
    const { userId, cardIds } = body;

    if (!userId || !Array.isArray(cardIds)) {
      return NextResponse.json(
        { error: "userId y cardIds (array) son requeridos" },
        { status: 400 }
      );
    }

    // Upsert: actualizar si existe, crear si no existe
    const collection = await prisma.userCollection.upsert({
      where: { userId },
      update: {
        cardIds: cardIds,
      },
      create: {
        userId,
        cardIds: cardIds,
      },
      select: { cardIds: true },
    });

    const duration = Date.now() - startTime;
    log.api('PUT', '/api/collection', 200, duration);

    return NextResponse.json({
      cardIds: collection.cardIds,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.prisma('updateCollection', error, { duration });
    
    return NextResponse.json(
      { error: "Error al actualizar colección completa" },
      { status: 500 }
    );
  }
}

