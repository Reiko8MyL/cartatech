import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { SavedDeck, DeckCard } from "@/lib/deck-builder/types";

// GET - Obtener mazos del usuario o mazos públicos
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const publicOnly = searchParams.get("publicOnly") === "true";

    if (publicOnly) {
      // Obtener solo mazos públicos
      const decks = await prisma.deck.findMany({
        where: {
          isPublic: true,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: {
          publishedAt: "desc",
        },
      });

      const formattedDecks = decks.map((deck: any) => ({
        id: deck.id,
        name: deck.name,
        description: deck.description,
        cards: deck.cards as DeckCard[],
        format: deck.format,
        createdAt: deck.createdAt.getTime(),
        userId: deck.userId,
        author: deck.user.username,
        isPublic: deck.isPublic,
        publishedAt: deck.publishedAt?.getTime(),
        techCardId: deck.techCardId,
        viewCount: deck.viewCount,
        tags: deck.tags,
      }));

      return NextResponse.json({
        decks: formattedDecks,
      });
    }

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      );
    }

    // Obtener mazos del usuario
    const decks = await prisma.deck.findMany({
      where: {
        userId,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const formattedUserDecks = decks.map((deck: any) => ({
      id: deck.id,
      name: deck.name,
      description: deck.description,
      cards: deck.cards as DeckCard[],
      format: deck.format,
      createdAt: deck.createdAt.getTime(),
      userId: deck.userId,
      isPublic: deck.isPublic,
      publishedAt: deck.publishedAt?.getTime(),
      techCardId: deck.techCardId,
      viewCount: deck.viewCount,
      tags: deck.tags,
    }));

    return NextResponse.json({
      decks: formattedUserDecks,
    });
  } catch (error) {
    console.error("Error al obtener mazos:", error);
    return NextResponse.json(
      { error: "Error al obtener mazos" },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo mazo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, deck } = body as { userId: string; deck: SavedDeck };

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
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

    // Crear mazo
    const newDeck = await prisma.deck.create({
      data: {
        name: deck.name,
        description: deck.description,
        cards: deck.cards,
        format: deck.format || "RE",
        userId,
        isPublic: deck.isPublic || false,
        publishedAt: deck.publishedAt ? new Date(deck.publishedAt) : null,
        techCardId: deck.techCardId,
        tags: deck.tags || [],
      },
    });

    // Crear versión inicial del mazo
    await prisma.deckVersion.create({
      data: {
        deckId: newDeck.id,
        userId,
        name: deck.name,
        description: deck.description,
        cards: deck.cards,
        format: deck.format || "RE",
        tags: deck.tags || [],
      },
    });

    return NextResponse.json({
      deck: {
        id: newDeck.id,
        name: newDeck.name,
        description: newDeck.description,
        cards: newDeck.cards as DeckCard[],
        format: newDeck.format,
        createdAt: newDeck.createdAt.getTime(),
        userId: newDeck.userId,
        isPublic: newDeck.isPublic,
        publishedAt: newDeck.publishedAt?.getTime(),
        techCardId: newDeck.techCardId,
        viewCount: newDeck.viewCount,
        tags: newDeck.tags,
      },
    });
  } catch (error) {
    console.error("Error al crear mazo:", error);
    
    // Log detallado del error para debugging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    // Verificar si es un error de Prisma
    if (error && typeof error === 'object' && 'code' in error) {
      console.error("Prisma error code:", error.code);
    }
    
    // Asegurar que siempre devolvemos un JSON válido
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al crear mazo";
    const errorDetails = process.env.NODE_ENV === "development" ? errorMessage : undefined;
    
    return NextResponse.json(
      { 
        error: "Error al crear mazo",
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
