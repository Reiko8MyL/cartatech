import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { SavedDeck, DeckCard } from "@/lib/deck-builder/types";
import { checkRateLimit } from "@/lib/rate-limit/rate-limit";
import { log } from "@/lib/logging/logger";

// GET - Obtener un mazo específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  try {
    const { id } = await params;

    const deck = await prisma.deck.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!deck) {
      return NextResponse.json(
        { error: "Mazo no encontrado" },
        { status: 404 }
      );
    }

    // Incrementar contador de vistas si es público
    if (deck.isPublic) {
      await prisma.deck.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
    }

    const duration = Date.now() - startTime;
    log.api('GET', `/api/decks/${id}`, 200, duration);

    return NextResponse.json({
      deck: {
        id: deck.id,
        name: deck.name,
        description: deck.description,
        cards: deck.cards as unknown as DeckCard[],
        format: deck.format,
        createdAt: deck.createdAt.getTime(),
        userId: deck.userId,
        author: deck.user.username,
        isPublic: deck.isPublic,
        publishedAt: deck.publishedAt?.getTime(),
        techCardId: deck.techCardId,
        backgroundImage: deck.backgroundImage,
        viewCount: deck.viewCount,
        tags: deck.tags,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.prisma('getDeck', error, { duration });
    return NextResponse.json(
      { error: "Error al obtener mazo" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un mazo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting para escritura
  const rateLimit = checkRateLimit(request);
  if (rateLimit?.limit) {
    log.warn("Rate limit exceeded for deck update", {
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
    const { id } = await params;
    const body = await request.json();
    const { userId, deck } = body as { userId: string; deck: SavedDeck };

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el mazo existe y pertenece al usuario
    const existingDeck = await prisma.deck.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!existingDeck) {
      return NextResponse.json(
        { error: "Mazo no encontrado" },
        { status: 404 }
      );
    }

    if (existingDeck.userId !== userId) {
      return NextResponse.json(
        { error: "No tienes permiso para editar este mazo" },
        { status: 403 }
      );
    }

    // Actualizar mazo
    // Si techCardId es undefined, establecerlo a null explícitamente para eliminar la carta tech
    const techCardIdValue = deck.techCardId !== undefined ? deck.techCardId : null;
    // Si backgroundImage es undefined, establecerlo a null explícitamente para eliminar la imagen personalizada
    const backgroundImageValue = deck.backgroundImage !== undefined ? deck.backgroundImage : null;
    
    const updatedDeck = await prisma.deck.update({
      where: { id },
      data: {
        name: deck.name,
        description: deck.description,
        cards: deck.cards as any,
        format: deck.format || "RE",
        isPublic: deck.isPublic || false,
        publishedAt: deck.publishedAt ? new Date(deck.publishedAt) : null,
        techCardId: techCardIdValue,
        backgroundImage: backgroundImageValue,
        tags: deck.tags || [],
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Crear nueva versión del mazo
    await prisma.deckVersion.create({
      data: {
        deckId: id,
        userId,
        name: deck.name,
        description: deck.description,
        cards: deck.cards as any,
        format: deck.format || "RE",
        tags: deck.tags || [],
      },
    });

    const duration = Date.now() - startTime;
    log.api('PUT', `/api/decks/${id}`, 200, duration);

    return NextResponse.json({
      deck: {
        id: updatedDeck.id,
        name: updatedDeck.name,
        description: updatedDeck.description,
        cards: updatedDeck.cards as unknown as DeckCard[],
        format: updatedDeck.format,
        createdAt: updatedDeck.createdAt.getTime(),
        userId: updatedDeck.userId,
        author: updatedDeck.user.username,
        isPublic: updatedDeck.isPublic,
        publishedAt: updatedDeck.publishedAt?.getTime(),
        techCardId: updatedDeck.techCardId,
        backgroundImage: updatedDeck.backgroundImage,
        viewCount: updatedDeck.viewCount,
        tags: updatedDeck.tags,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.prisma('updateDeck', error, { duration });
    
    // Asegurar que siempre devolvemos un JSON válido
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al actualizar mazo";
    const errorDetails = process.env.NODE_ENV === "development" ? errorMessage : undefined;
    
    return NextResponse.json(
      { 
        error: "Error al actualizar mazo",
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

// DELETE - Eliminar un mazo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting para escritura
  const rateLimit = checkRateLimit(request);
  if (rateLimit?.limit) {
    log.warn("Rate limit exceeded for deck deletion", {
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
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el mazo existe y pertenece al usuario
    const deck = await prisma.deck.findUnique({
      where: { id },
    });

    if (!deck) {
      return NextResponse.json(
        { error: "Mazo no encontrado" },
        { status: 404 }
      );
    }

    if (deck.userId !== userId) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar este mazo" },
        { status: 403 }
      );
    }

    // Eliminar mazo (las versiones y favoritos se eliminan en cascada)
    await prisma.deck.delete({
      where: { id },
    });

    const duration = Date.now() - startTime;
    log.api('DELETE', `/api/decks/${id}`, 200, duration);

    return NextResponse.json({ success: true });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.prisma('deleteDeck', error, { duration });
    return NextResponse.json(
      { error: "Error al eliminar mazo" },
      { status: 500 }
    );
  }
}

