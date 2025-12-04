import { NextRequest, NextResponse } from "next/server";
import { getAllCardsFromDB, getAlternativeArtCardsFromDB } from "@/lib/deck-builder/cards-db";

/**
 * GET /api/cards
 * Obtiene todas las cartas principales desde la base de datos
 * Soporta parámetros opcionales:
 * - includeAlternatives: incluir cartas alternativas (default: false)
 * - format: filtrar por formato de ban list (RE, RL, LI)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeAlternatives = searchParams.get("includeAlternatives") === "true";
    const format = searchParams.get("format") as "RE" | "RL" | "LI" | null;

    // Obtener cartas principales
    const mainCards = await getAllCardsFromDB();

    // Si se solicitan alternativas, obtenerlas también
    let altCards: any[] = [];
    if (includeAlternatives) {
      altCards = await getAlternativeArtCardsFromDB();
    }

    // Filtrar por formato si se especifica
    let filteredCards = mainCards;
    if (format) {
      const banListField = format === "RE" ? "banListRE" : format === "RL" ? "banListRL" : "banListLI";
      filteredCards = mainCards.filter((card: any) => {
        const banValue = card[banListField];
        return banValue !== undefined && banValue !== null;
      });
    }

    return NextResponse.json({
      cards: filteredCards,
      ...(includeAlternatives && { alternativeCards: altCards }),
      total: filteredCards.length,
      ...(includeAlternatives && { totalAlternatives: altCards.length }),
    });
  } catch (error) {
    console.error("Error al obtener cartas:", error);
    
    return NextResponse.json(
      {
        error: "Error al obtener cartas",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

