import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { DeckCard } from "@/lib/deck-builder/types";
import { log } from "@/lib/logging/logger";

// GET - Obtener historial de versiones de un mazo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: "No tienes permiso para ver este historial" },
        { status: 403 }
      );
    }

    // Obtener versiones del mazo
    const versions = await prisma.deckVersion.findMany({
      where: { deckId: id },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      versions: versions.map((version: any) => ({
        id: version.id,
        deckId: version.deckId,
        name: version.name,
        description: version.description,
        cards: version.cards as DeckCard[],
        format: version.format,
        tags: version.tags,
        createdAt: version.createdAt.getTime(),
      })),
    });
    
    const duration = Date.now() - startTime;
    log.api('GET', `/api/decks/${id}/versions`, 200, duration);
    
    return NextResponse.json({
      versions: versions.map((version: any) => ({
        id: version.id,
        deckId: version.deckId,
        name: version.name,
        description: version.description,
        cards: version.cards as DeckCard[],
        format: version.format,
        tags: version.tags,
        createdAt: version.createdAt.getTime(),
      })),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.prisma('getDeckVersions', error, { duration });
    return NextResponse.json(
      { error: "Error al obtener versiones" },
      { status: 500 }
    );
  }
}


