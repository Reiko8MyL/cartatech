import { prisma } from "@/lib/db/prisma";
import type { Card } from "./types";

// Cache para evitar múltiples consultas
let cardsCache: Card[] | null = null;
let altCardsCache: Card[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Limpia el cache de cartas (útil después de actualizaciones)
 */
export function clearCardsCache() {
  cardsCache = null;
  altCardsCache = null;
  cacheTimestamp = 0;
}

/**
 * Obtiene todas las cartas desde la base de datos
 * Mantiene compatibilidad con getAllCards()
 */
export async function getAllCardsFromDB(): Promise<Card[]> {
  // Usar cache si está disponible y no ha expirado
  const now = Date.now();
  if (cardsCache && (now - cacheTimestamp) < CACHE_TTL) {
    return cardsCache;
  }

  try {
    const cards = await prisma.card.findMany({
      where: {
        baseCardId: null, // Solo cartas principales
      },
      orderBy: [
        { edition: "asc" },
        { id: "asc" },
      ],
    });

    const mappedCards = cards.map((card) => ({
      id: card.id,
      name: card.name,
      type: card.type,
      cost: card.cost,
      power: card.power,
      race: card.race,
      isCosmetic: card.isCosmetic,
      isRework: card.isRework,
      isUnique: card.isUnique,
      edition: card.edition,
      banListRE: card.banListRE,
      banListRL: card.banListRL,
      banListLI: card.banListLI,
      isOroIni: card.isOroIni,
      image: card.image,
      description: card.description,
    }));

    // Actualizar cache
    cardsCache = mappedCards;
    cacheTimestamp = now;

    return mappedCards;
  } catch (error) {
    console.error("Error al obtener cartas desde la base de datos:", error);
    // Si hay cache anterior, usarlo
    if (cardsCache) {
      return cardsCache;
    }
    // Fallback: retornar array vacío en caso de error
    return [];
  }
}

/**
 * Obtiene todas las cartas alternativas desde la base de datos
 * Mantiene compatibilidad con getAlternativeArtCards()
 */
export async function getAlternativeArtCardsFromDB(): Promise<Card[]> {
  // Usar cache si está disponible y no ha expirado
  const now = Date.now();
  if (altCardsCache && (now - cacheTimestamp) < CACHE_TTL) {
    return altCardsCache;
  }

  try {
    const cards = await prisma.card.findMany({
      where: {
        isCosmetic: true,
        baseCardId: { not: null }, // Solo cartas alternativas
      },
      orderBy: [
        { edition: "asc" },
        { id: "asc" },
      ],
    });

    const mappedCards = cards.map((card) => ({
      id: card.id,
      name: card.name,
      type: card.type,
      cost: card.cost,
      power: card.power,
      race: card.race,
      isCosmetic: card.isCosmetic,
      isRework: card.isRework,
      isUnique: card.isUnique,
      edition: card.edition,
      banListRE: card.banListRE,
      banListRL: card.banListRL,
      banListLI: card.banListLI,
      isOroIni: card.isOroIni,
      image: card.image,
      description: card.description,
    }));

    // Actualizar cache
    altCardsCache = mappedCards;
    cacheTimestamp = now;

    return mappedCards;
  } catch (error) {
    console.error("Error al obtener cartas alternativas desde la base de datos:", error);
    // Si hay cache anterior, usarlo
    if (altCardsCache) {
      return altCardsCache;
    }
    return [];
  }
}

/**
 * Obtiene una carta específica por ID desde la base de datos
 */
export async function getCardFromDB(cardId: string): Promise<Card | null> {
  try {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!card) return null;

    return {
      id: card.id,
      name: card.name,
      type: card.type,
      cost: card.cost,
      power: card.power,
      race: card.race,
      isCosmetic: card.isCosmetic,
      isRework: card.isRework,
      isUnique: card.isUnique,
      edition: card.edition,
      banListRE: card.banListRE,
      banListRL: card.banListRL,
      banListLI: card.banListLI,
      isOroIni: card.isOroIni,
      image: card.image,
      description: card.description,
    };
  } catch (error) {
    console.error(`Error al obtener carta ${cardId} desde la base de datos:`, error);
    return null;
  }
}

/**
 * Actualiza el ban list de una carta y todas sus alternativas
 */
export async function updateCardBanList(
  baseCardId: string,
  format: "RE" | "RL" | "LI",
  value: number
): Promise<{ updated: number }> {
  try {
    // Actualizar la carta principal
    const updateField = format === "RE" ? "banListRE" : format === "RL" ? "banListRL" : "banListLI";
    
    // Actualizar carta principal
    await prisma.card.update({
      where: { id: baseCardId },
      data: {
        [updateField]: value,
      },
    });

    // Actualizar todas las cartas alternativas que tengan este baseCardId
    const result = await prisma.card.updateMany({
      where: {
        baseCardId: baseCardId,
      },
      data: {
        [updateField]: value,
      },
    });

    // Limpiar cache para forzar recarga
    clearCardsCache();

    return {
      updated: 1 + result.count, // 1 principal + alternativas
    };
  } catch (error) {
    console.error(`Error al actualizar ban list de ${baseCardId}:`, error);
    throw error;
  }
}
