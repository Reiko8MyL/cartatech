import { NextRequest, NextResponse } from "next/server";
import { getCardFromDB, getAlternativeArtCardsFromDB } from "@/lib/deck-builder/cards-db";
import { getBaseCardId } from "@/lib/deck-builder/utils";
import { log } from "@/lib/logging/logger";

/**
 * GET /api/cards/[cardId]
 * Obtiene una carta específica por ID desde la base de datos
 * Incluye automáticamente todas sus cartas alternativas si existen
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const startTime = Date.now();
  let cardId: string | undefined;
  
  try {
    const paramsData = await params;
    cardId = paramsData.cardId;

    if (!cardId) {
      return NextResponse.json(
        { error: "cardId es requerido" },
        { status: 400 }
      );
    }

    // Obtener la carta principal
    const card = await getCardFromDB(cardId);

    if (!card) {
      return NextResponse.json(
        { error: "Carta no encontrada" },
        { status: 404 }
      );
    }

    // Obtener cartas alternativas si es una carta principal
    const baseId = getBaseCardId(cardId);
    let alternativeCards: any[] = [];
    
    if (cardId === baseId) {
      // Es una carta principal, buscar alternativas
      const allAltCards = await getAlternativeArtCardsFromDB();
      alternativeCards = allAltCards.filter((altCard) => {
        const altBaseId = getBaseCardId(altCard.id);
        return altBaseId === baseId;
      });
    }

    return NextResponse.json({
      card,
      ...(alternativeCards.length > 0 && { alternativeCards }),
    });
    
    const duration = Date.now() - startTime;
    log.api('GET', `/api/cards/${cardId}`, 200, duration);
    
    return NextResponse.json({
      card,
      ...(alternativeCards.length > 0 && { alternativeCards }),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.error(`Error al obtener carta ${cardId || "desconocida"}`, error, { duration });
    
    return NextResponse.json(
      {
        error: "Error al obtener carta",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

