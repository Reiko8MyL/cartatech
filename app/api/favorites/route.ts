import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// GET - Obtener mazos favoritos del usuario
export async function GET(request: NextRequest) {
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
  } catch (error) {
    console.error("Error al obtener favoritos:", error);
    return NextResponse.json(
      { error: "Error al obtener favoritos" },
      { status: 500 }
    );
  }
}

// POST - Agregar mazo a favoritos
export async function POST(request: NextRequest) {
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

    return NextResponse.json({ success: true, favorite });
  } catch (error) {
    console.error("Error al agregar favorito:", error);
    return NextResponse.json(
      { error: "Error al agregar favorito" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar mazo de favoritos
export async function DELETE(request: NextRequest) {
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar favorito:", error);
    return NextResponse.json(
      { error: "Error al eliminar favorito" },
      { status: 500 }
    );
  }
}


