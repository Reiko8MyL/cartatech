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
      // Atributos booleanos para filtros avanzados
      errante: card.errante ?? false,
      soloAtacNoBloq: card.soloAtacNoBloq ?? false,
      soloBloqNoAtac: card.soloBloqNoAtac ?? false,
      bloquarVarios: card.bloquarVarios ?? false,
      pacej: card.pacej ?? false,
      imblo: card.imblo ?? false,
      bloqImblo: card.bloqImblo ?? false,
      noArmas: card.noArmas ?? false,
      mas1arma: card.mas1arma ?? false,
      indestructible: card.indestructible ?? false,
      indestrerrable: card.indestrerrable ?? false,
      exhumar: card.exhumar ?? false,
      controlCementerio: card.controlCementerio ?? false,
      lookDeck: card.lookDeck ?? false,
      desafio: card.desafio ?? false,
      sBuff: card.sBuff ?? false,
      sNerf: card.sNerf ?? false,
      noJugar: card.noJugar ?? false,
      quitaHab: card.quitaHab ?? false,
      copiaHabil: card.copiaHabil ?? false,
      anulación: card.anulación ?? false,
      nPSA: card.nPSA ?? false,
      cancelación: card.cancelación ?? false,
      prevencion: card.prevencion ?? false,
      redDaño: card.redDaño ?? false,
      ramp: card.ramp ?? false,
      destierroDirec: card.destierroDirec ?? false,
      dañoDirec: card.dañoDirec ?? false,
      buscador: card.buscador ?? false,
      invocador: card.invocador ?? false,
      transformador: card.transformador ?? false,
      limitador: card.limitador ?? false,
      taunt: card.taunt ?? false,
      movimiento: card.movimiento ?? false,
      evitAtacar: card.evitAtacar ?? false,
      evitBloq: card.evitBloq ?? false,
      inmuni: card.inmuni ?? false,
      baraje: card.baraje ?? false,
      Robo: card.Robo ?? false,
      descartaMano: card.descartaMano ?? false,
      ordenMazo: card.ordenMazo ?? false,
      genOro: card.genOro ?? false,
      redCoste: card.redCoste ?? false,
      ganaControl: card.ganaControl ?? false,
      redirec: card.redirec ?? false,
      rDestrucción: card.rDestrucción ?? false,
      rDestierro: card.rDestierro ?? false,
      rBaraje: card.rBaraje ?? false,
      rTopBot: card.rTopBot ?? false,
      rMano: card.rMano ?? false,
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
      // Atributos booleanos para filtros avanzados
      errante: card.errante ?? false,
      soloAtacNoBloq: card.soloAtacNoBloq ?? false,
      soloBloqNoAtac: card.soloBloqNoAtac ?? false,
      bloquarVarios: card.bloquarVarios ?? false,
      pacej: card.pacej ?? false,
      imblo: card.imblo ?? false,
      bloqImblo: card.bloqImblo ?? false,
      noArmas: card.noArmas ?? false,
      mas1arma: card.mas1arma ?? false,
      indestructible: card.indestructible ?? false,
      indestrerrable: card.indestrerrable ?? false,
      exhumar: card.exhumar ?? false,
      controlCementerio: card.controlCementerio ?? false,
      lookDeck: card.lookDeck ?? false,
      desafio: card.desafio ?? false,
      sBuff: card.sBuff ?? false,
      sNerf: card.sNerf ?? false,
      noJugar: card.noJugar ?? false,
      quitaHab: card.quitaHab ?? false,
      copiaHabil: card.copiaHabil ?? false,
      anulación: card.anulación ?? false,
      nPSA: card.nPSA ?? false,
      cancelación: card.cancelación ?? false,
      prevencion: card.prevencion ?? false,
      redDaño: card.redDaño ?? false,
      ramp: card.ramp ?? false,
      destierroDirec: card.destierroDirec ?? false,
      dañoDirec: card.dañoDirec ?? false,
      buscador: card.buscador ?? false,
      invocador: card.invocador ?? false,
      transformador: card.transformador ?? false,
      limitador: card.limitador ?? false,
      taunt: card.taunt ?? false,
      movimiento: card.movimiento ?? false,
      evitAtacar: card.evitAtacar ?? false,
      evitBloq: card.evitBloq ?? false,
      inmuni: card.inmuni ?? false,
      baraje: card.baraje ?? false,
      Robo: card.Robo ?? false,
      descartaMano: card.descartaMano ?? false,
      ordenMazo: card.ordenMazo ?? false,
      genOro: card.genOro ?? false,
      redCoste: card.redCoste ?? false,
      ganaControl: card.ganaControl ?? false,
      redirec: card.redirec ?? false,
      rDestrucción: card.rDestrucción ?? false,
      rDestierro: card.rDestierro ?? false,
      rBaraje: card.rBaraje ?? false,
      rTopBot: card.rTopBot ?? false,
      rMano: card.rMano ?? false,
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
      // Atributos booleanos para filtros avanzados
      errante: card.errante ?? false,
      soloAtacNoBloq: card.soloAtacNoBloq ?? false,
      soloBloqNoAtac: card.soloBloqNoAtac ?? false,
      bloquarVarios: card.bloquarVarios ?? false,
      pacej: card.pacej ?? false,
      imblo: card.imblo ?? false,
      bloqImblo: card.bloqImblo ?? false,
      noArmas: card.noArmas ?? false,
      mas1arma: card.mas1arma ?? false,
      indestructible: card.indestructible ?? false,
      indestrerrable: card.indestrerrable ?? false,
      exhumar: card.exhumar ?? false,
      controlCementerio: card.controlCementerio ?? false,
      lookDeck: card.lookDeck ?? false,
      desafio: card.desafio ?? false,
      sBuff: card.sBuff ?? false,
      sNerf: card.sNerf ?? false,
      noJugar: card.noJugar ?? false,
      quitaHab: card.quitaHab ?? false,
      copiaHabil: card.copiaHabil ?? false,
      anulación: card.anulación ?? false,
      nPSA: card.nPSA ?? false,
      cancelación: card.cancelación ?? false,
      prevencion: card.prevencion ?? false,
      redDaño: card.redDaño ?? false,
      ramp: card.ramp ?? false,
      destierroDirec: card.destierroDirec ?? false,
      dañoDirec: card.dañoDirec ?? false,
      buscador: card.buscador ?? false,
      invocador: card.invocador ?? false,
      transformador: card.transformador ?? false,
      limitador: card.limitador ?? false,
      taunt: card.taunt ?? false,
      movimiento: card.movimiento ?? false,
      evitAtacar: card.evitAtacar ?? false,
      evitBloq: card.evitBloq ?? false,
      inmuni: card.inmuni ?? false,
      baraje: card.baraje ?? false,
      Robo: card.Robo ?? false,
      descartaMano: card.descartaMano ?? false,
      ordenMazo: card.ordenMazo ?? false,
      genOro: card.genOro ?? false,
      redCoste: card.redCoste ?? false,
      ganaControl: card.ganaControl ?? false,
      redirec: card.redirec ?? false,
      rDestrucción: card.rDestrucción ?? false,
      rDestierro: card.rDestierro ?? false,
      rBaraje: card.rBaraje ?? false,
      rTopBot: card.rTopBot ?? false,
      rMano: card.rMano ?? false,
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
