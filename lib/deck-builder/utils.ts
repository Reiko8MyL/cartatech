import type { Card, DeckCard, DeckFilters, DeckStats, SavedDeck, DeckFormat } from "./types";

// Importar los datos de las cartas (fallback)
// @ts-ignore - Los archivos JS no tienen tipos
import { CARDS } from "../data/cards.js";
// @ts-ignore
import { AAcards } from "../data/AAcards.js";

// NO importar cards-db directamente aquí porque contiene Prisma que no funciona en el cliente
// Las funciones de BD se importan dinámicamente solo cuando se necesitan en el servidor

// Logos de ediciones
export const EDITION_LOGOS: Record<string, string> = {
  "Espada Sagrada":
    "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764381680/ESPADA-SAGRADA-CRUZADAS-1024x1024_wsd1ei.webp",
  Helénica:
    "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764381679/HELENICA-IMPERIO-min-1024x1024_cxahmi.webp",
  "Hijos de Daana":
    "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764381679/PRESENTACION-DAANA-TIERRAS-ALTAS-min-1024x1024_bjyb00.webp",
  "Dominios de Ra":
    "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764381680/RA-ENCRUCIJADA-min1-1024x1024_gvuptu.webp",
  Drácula:
    "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764388786/Dr_3Fcula_Logo_kfnuue.webp",
};

// Logo para mazos con múltiples ediciones
export const ALL_EDITIONS_LOGO = "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765218635/logo_all_ed_ty0esh.webp";

// Cache síncrono para uso inmediato (se actualiza desde BD en background)
let syncCardsCache: Card[] | null = null;
let syncAltCardsCache: Card[] | null = null;

// Inicializar cache con archivos JS (fallback inmediato)
if (typeof window === "undefined") {
  // Solo en servidor, inicializar cache
  syncCardsCache = CARDS as Card[];
  syncAltCardsCache = AAcards as Card[];
  
  // En background, intentar cargar desde BD usando importación dinámica
  // Esto evita que Prisma se incluya en el bundle del cliente
  if (typeof require !== "undefined") {
    import("./cards-db").then(({ getAllCardsFromDB, getAlternativeArtCardsFromDB }) => {
      getAllCardsFromDB().then((cards) => {
        syncCardsCache = cards;
      }).catch(() => {
        // Si falla, mantener archivos JS
      });
      
      getAlternativeArtCardsFromDB().then((cards) => {
        syncAltCardsCache = cards;
      }).catch(() => {
        // Si falla, mantener archivos JS
      });
    }).catch(() => {
      // Si falla la importación, mantener archivos JS
    });
  }
}

/**
 * Obtiene todas las cartas principales
 * En servidor: intenta BD primero, fallback a archivos JS
 * En cliente: usa cache o archivos JS
 */
export function getAllCards(): Card[] {
  // En cliente, siempre usar archivos JS (más rápido)
  if (typeof window !== "undefined") {
    return CARDS as Card[];
  }
  
  // En servidor, intentar usar cache de BD si está disponible
  if (syncCardsCache) {
    return syncCardsCache;
  }
  
  // Fallback a archivos JS
  return CARDS as Card[];
}

/**
 * Obtiene todas las cartas alternativas
 * En servidor: intenta BD primero, fallback a archivos JS
 * En cliente: usa cache o archivos JS
 */
export function getAlternativeArtCards(): Card[] {
  // En cliente, siempre usar archivos JS (más rápido)
  if (typeof window !== "undefined") {
    return AAcards as Card[];
  }
  
  // En servidor, intentar usar cache de BD si está disponible
  if (syncAltCardsCache) {
    return syncAltCardsCache;
  }
  
  // Fallback a archivos JS
  return AAcards as Card[];
}

/**
 * Función async para obtener cartas desde BD (para APIs)
 * Solo funciona en servidor, usa importación dinámica para evitar incluir Prisma en el cliente
 */
export async function getAllCardsAsync(): Promise<Card[]> {
  // En cliente, retornar archivos JS directamente
  if (typeof window !== "undefined") {
    return CARDS as Card[];
  }

  try {
    // Importación dinámica solo en servidor
    const { getAllCardsFromDB } = await import("./cards-db");
    return await getAllCardsFromDB();
  } catch (error) {
    return CARDS as Card[];
  }
}

/**
 * Función async para obtener cartas alternativas desde BD (para APIs)
 * Solo funciona en servidor, usa importación dinámica para evitar incluir Prisma en el cliente
 */
export async function getAlternativeArtCardsAsync(): Promise<Card[]> {
  // En cliente, retornar archivos JS directamente
  if (typeof window !== "undefined") {
    return AAcards as Card[];
  }

  try {
    // Importación dinámica solo en servidor
    const { getAlternativeArtCardsFromDB } = await import("./cards-db");
    return await getAlternativeArtCardsFromDB();
  } catch (error) {
    return AAcards as Card[];
  }
}

/**
 * Limpia el cache de cartas (solo en servidor)
 * Usa importación dinámica para evitar incluir Prisma en el cliente
 * También limpia el cache síncrono para forzar recarga desde BD
 */
export async function clearCardsCache(): Promise<void> {
  if (typeof window !== "undefined") {
    return; // No hacer nada en cliente
  }

  // Limpiar cache síncrono
  syncCardsCache = null;
  syncAltCardsCache = null;

  try {
    const { clearCardsCache: clearCache } = await import("./cards-db");
    clearCache();
    
    // Recargar cache síncrono desde BD en background
    const { getAllCardsFromDB, getAlternativeArtCardsFromDB } = await import("./cards-db");
    getAllCardsFromDB().then((cards) => {
      syncCardsCache = cards;
    }).catch(() => {
      // Si falla, mantener archivos JS como fallback
      syncCardsCache = CARDS as Card[];
    });
    
    getAlternativeArtCardsFromDB().then((cards) => {
      syncAltCardsCache = cards;
    }).catch(() => {
      // Si falla, mantener archivos JS como fallback
      syncAltCardsCache = AAcards as Card[];
    });
  } catch (error) {
    // Si falla, no hacer nada
  }
}

export function getBaseCardId(cardId: string): string {
  // Extrae el ID base (MYL-XXXX) de IDs con variantes (MYL-XXXX-XX)
  return cardId.split("-").slice(0, 2).join("-");
}

/**
 * Obtiene las cartas alternativas para una carta específica (versión síncrona)
 * Usa fallback a archivos JS
 */
export function getAlternativeArtsForCard(cardId: string): Card[] {
  const baseId = getBaseCardId(cardId);
  const altCards = getAlternativeArtCards(); // Usa fallback a archivos JS
  return altCards.filter((card) => getBaseCardId(card.id) === baseId);
}

/**
 * Obtiene las cartas alternativas para una carta específica desde la API (versión async)
 */
export async function getAlternativeArtsForCardAsync(cardId: string): Promise<Card[]> {
  try {
    const { getAllCardsFromAPI } = await import("@/lib/api/cards");
    const allCards = await getAllCardsFromAPI(true); // Incluir alternativas
    const baseId = getBaseCardId(cardId);
    return allCards.filter((card) => card.isCosmetic && getBaseCardId(card.id) === baseId);
  } catch (error) {
    console.error("Error al obtener cartas alternativas desde API, usando fallback:", error);
    // Fallback a función síncrona
    return getAlternativeArtsForCard(cardId);
  }
}

export function sortCardsByEditionAndId(cards: Card[]): Card[] {
  const editionOrder = [
    "Espada Sagrada",
    "Helénica",
    "Hijos de Daana",
    "Dominios de Ra",
    "Drácula",
  ];

  return [...cards].sort((a, b) => {
    const editionA = editionOrder.indexOf(a.edition);
    const editionB = editionOrder.indexOf(b.edition);

    if (editionA !== editionB) {
      return editionA - editionB;
    }

    // Extraer el número del ID (MYL-XXXX -> XXXX)
    const numA = parseInt(a.id.split("-")[1] || "0", 10);
    const numB = parseInt(b.id.split("-")[1] || "0", 10);
    return numA - numB;
  });
}

export function filterCards(cards: Card[], filters: DeckFilters, deckFormat?: DeckFormat): Card[] {
  let filtered = [...cards];

  // Filtrar por búsqueda de nombre
  if (filters.search.trim()) {
    const searchLower = filters.search.toLowerCase().trim();
    filtered = filtered.filter((card) =>
      card.name.toLowerCase().includes(searchLower)
    );
  }

  // Filtrar por búsqueda en descripción
  if (filters.descriptionSearch && filters.descriptionSearch.trim()) {
    const descriptionSearchLower = filters.descriptionSearch.toLowerCase().trim();
    filtered = filtered.filter((card) =>
      card.description.toLowerCase().includes(descriptionSearchLower)
    );
  }

  // Filtrar por edición (múltiples valores)
  if (filters.edition.length > 0) {
    filtered = filtered.filter((card) => filters.edition.includes(card.edition));
  }

  // Filtrar por tipo (múltiples valores)
  if (filters.type.length > 0) {
    filtered = filtered.filter((card) => filters.type.includes(card.type));
  }

  // Filtrar por raza (múltiples valores)
  if (filters.race.length > 0) {
    filtered = filtered.filter((card) => 
      card.race !== null && filters.race.includes(card.race)
    );
  }

  // Filtrar por coste (múltiples valores)
  if (filters.cost.length > 0) {
    filtered = filtered.filter((card) => 
      card.cost !== null && filters.cost.includes(String(card.cost))
    );
  }

  // Filtrar solo cartas únicas
  if (filters.showOnlyUnique) {
    filtered = filtered.filter((card) => card.isUnique);
  }

  // Filtrar solo cartas disponibles según ban list (según el formato del deck)
  // Muestra solo cartas que NO están baneadas (banListValue > 0)
  if (filters.showOnlyAvailable && deckFormat) {
    filtered = filtered.filter((card) => {
      // Obtener el valor de ban list según el formato, con fallback a 3 (Libre) si es null/undefined
      const banListValue = deckFormat === "RE" 
        ? (card.banListRE ?? 3)
        : deckFormat === "RL" 
        ? (card.banListRL ?? 3)
        : (card.banListLI ?? 3);
      
      // Solo mostrar cartas disponibles (no baneadas)
      return banListValue > 0;
    });
  }

  // Filtrar solo cartas afectadas por ban list (según el formato del deck)
  // Debe mostrar solo las cartas que tienen el tag rojo visible, igual que en card-item.tsx
  // Tag rojo se muestra cuando: banListValue === 0 (BAN), banListValue === 1 && !isUnique (Max 1), banListValue === 2 (Max 2)
  if (filters.showOnlyBanned && deckFormat) {
    filtered = filtered.filter((card) => {
      // Obtener el valor de ban list según el formato, con fallback a 3 (Libre) si es null/undefined
      const banListValue = deckFormat === "RE" 
        ? (card.banListRE ?? 3)
        : deckFormat === "RL" 
        ? (card.banListRL ?? 3)
        : (card.banListLI ?? 3);
      
      // Replicar la lógica exacta de card-item.tsx para mostrar tag rojo
      if (banListValue === 0) return true; // BAN (siempre muestra tag rojo)
      if (banListValue === 1 && !card.isUnique) return true; // Max 1 (solo si no es única)
      if (banListValue === 2) return true; // Max 2 (siempre muestra tag rojo)
      return false; // banListValue === 3 (Libre) o banListValue === 1 con isUnique (no muestra tag rojo)
    });
  }

  // Filtrar solo cartas con rework
  if (filters.showOnlyRework) {
    filtered = filtered.filter((card) => card.isRework);
  }

  // Filtrar por atributos booleanos (si se especifican)
  if (filters.attributes && filters.attributes.length > 0) {
    filtered = filtered.filter((card) => {
      // La carta debe tener TODOS los atributos seleccionados activos (true)
      // Manejar undefined como false para compatibilidad con datos antiguos
      const hasAllAttributes = filters.attributes!.every((attrKey) => {
        // Acceder al atributo de forma segura
        const attrValue = (card as any)[attrKey];
        
        // Debug temporal: loggear primera carta para verificar atributos
        if (process.env.NODE_ENV === "development" && filtered.length > 0 && card.id === filtered[0]?.id) {
          console.log(`[DEBUG FILTER] Carta ${card.id} - Atributo ${attrKey}:`, attrValue, "Tipo:", typeof attrValue);
        }
        
        // Considerar true solo si el valor es explícitamente true
        // undefined, null, false se consideran como false
        return attrValue === true;
      });
      
      return hasAllAttributes;
    });
    
    // Debug temporal: loggear resultado del filtrado
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEBUG FILTER] Filtros activos:`, filters.attributes, "Cartas encontradas:", filtered.length);
      if (filtered.length > 0) {
        console.log(`[DEBUG FILTER] Primera carta encontrada:`, filtered[0].id, filtered[0].name);
        filters.attributes.forEach(attrKey => {
          console.log(`  - ${attrKey}:`, (filtered[0] as any)[attrKey]);
        });
      }
    }
  }

  return filtered;
}

export function calculateDeckStats(
  deckCards: DeckCard[],
  allCards: Card[]
): DeckStats {
  // allCards ya debería incluir alternativas si viene del hook useCards(true)
  // Si no las incluye, usar solo allCards (las alternativas se manejan por baseCardId)
  const cardMap = new Map(allCards.map((card) => [card.id, card]));
  let totalCards = 0;
  let totalCost = 0;
  let totalCardsForAverage = 0; // Cartas excluyendo Oro para el cálculo del promedio
  const cardsByType: Record<string, number> = {};
  const cardsByEdition: Record<string, number> = {};
  let hasOroIni = false;

  for (const deckCard of deckCards) {
    const card = cardMap.get(deckCard.cardId);
    if (!card) continue;

    totalCards += deckCard.quantity;
    const cardCost = card.cost ?? 0;
    totalCost += cardCost * deckCard.quantity;

    // Solo contar cartas que no son de tipo "Oro" para el cálculo del promedio
    if (card.type !== "Oro") {
      totalCardsForAverage += deckCard.quantity;
    }

    cardsByType[card.type] = (cardsByType[card.type] || 0) + deckCard.quantity;
    cardsByEdition[card.edition] =
      (cardsByEdition[card.edition] || 0) + deckCard.quantity;

    if (card.isOroIni) {
      hasOroIni = true;
    }
  }

  // Calcular el costo promedio excluyendo las cartas de Oro
  // Necesitamos calcular el costo total solo de las cartas que no son Oro
  let totalCostForAverage = 0;
  for (const deckCard of deckCards) {
    const card = cardMap.get(deckCard.cardId);
    if (!card || card.type === "Oro") continue;
    const cardCost = card.cost ?? 0;
    totalCostForAverage += cardCost * deckCard.quantity;
  }

  const averageCost =
    totalCardsForAverage > 0 ? Number((totalCostForAverage / totalCardsForAverage).toFixed(2)) : 0;

  return {
    totalCards,
    totalCost,
    averageCost,
    cardsByType,
    cardsByEdition,
    hasOroIni,
  };
}

export function generateDeckCode(deckCards: DeckCard[]): string {
  const codes: string[] = [];
  for (const deckCard of deckCards) {
    for (let i = 0; i < deckCard.quantity; i++) {
      codes.push(deckCard.cardId);
    }
  }
  return codes.join(" ");
}

export function exportDeckList(
  deckCards: DeckCard[],
  allCards: Card[]
): string {
  const cardMap = new Map(allCards.map((card) => [card.id, card]));
  const lines: string[] = [];

  for (const deckCard of deckCards) {
    const card = cardMap.get(deckCard.cardId);
    if (card) {
      lines.push(`${deckCard.quantity}x ${card.name}`);
    }
  }

  return lines.join("\n");
}

/**
 * Guarda un mazo. Si el usuario está autenticado, usa la API.
 * Si no, guarda en localStorage como mazo temporal.
 */
export async function saveDeckToStorage(deck: SavedDeck, userId?: string): Promise<SavedDeck | null> {
  if (typeof window === "undefined") return null;

  // Si hay usuario, usar API
  if (userId) {
    const { saveDeck } = await import("@/lib/api/decks");
    return await saveDeck(userId, deck);
  }

  // Fallback a localStorage para usuarios no autenticados
  return saveDeckToLocalStorage(deck);
}

/**
 * Guarda un mazo en localStorage (para usuarios no autenticados o fallback)
 */
export function saveDeckToLocalStorage(deck: SavedDeck): SavedDeck | null {
  if (typeof window === "undefined") return null;

  const savedDecks = getSavedDecksFromLocalStorage();
  
  // Si el mazo no tiene ID, generar uno para localStorage
  const deckWithId: SavedDeck = {
    ...deck,
    id: deck.id || Date.now().toString(),
  };
  
  const existingIndex = savedDecks.findIndex((d) => d.id === deckWithId.id);

  if (existingIndex >= 0) {
    savedDecks[existingIndex] = deckWithId;
  } else {
    savedDecks.push(deckWithId);
  }

  localStorage.setItem("myl_saved_decks", JSON.stringify(savedDecks));
  return deckWithId;
}

/**
 * Obtiene mazos guardados. Si el usuario está autenticado, usa la API.
 * Si no, obtiene de localStorage.
 */
export async function getSavedDecksFromStorage(userId?: string): Promise<SavedDeck[]> {
  if (typeof window === "undefined") return [];

  // Si hay usuario, usar API primero
  if (userId) {
    try {
      const { getUserDecks } = await import("@/lib/api/decks");
      const result = await getUserDecks(userId);
      // Si la API devuelve mazos, usarlos
      if (result && result.data && result.data.length >= 0) {
        return result.data;
      }
    } catch (error) {
      console.warn("Error al obtener mazos de la API, usando localStorage:", error);
      // Fallback a localStorage si la API falla
    }
    // Fallback a localStorage si no hay mazos o si hubo error
    return getUserDecksFromLocalStorage(userId);
  }

  // Fallback a localStorage para usuarios no autenticados
  return getSavedDecksFromLocalStorage();
}

/**
 * Obtiene mazos de localStorage (para usuarios no autenticados o fallback)
 */
export function getSavedDecksFromLocalStorage(): SavedDeck[] {
  if (typeof window === "undefined") return [];

  try {
    const data = localStorage.getItem("myl_saved_decks");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Elimina un mazo. Si el usuario está autenticado, usa la API.
 * Si no, elimina de localStorage.
 */
export async function deleteDeckFromStorage(deckId: string, userId?: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // Si hay usuario, usar API
  if (userId) {
    const { deleteDeck } = await import("@/lib/api/decks");
    return await deleteDeck(userId, deckId);
  }

  // Fallback a localStorage
  deleteDeckFromLocalStorage(deckId);
  return true;
}

/**
 * Elimina un mazo de localStorage (para usuarios no autenticados o fallback)
 */
export function deleteDeckFromLocalStorage(deckId: string): void {
  if (typeof window === "undefined") return;

  const savedDecks = getSavedDecksFromLocalStorage();
  const filtered = savedDecks.filter((d) => d.id !== deckId);
  localStorage.setItem("myl_saved_decks", JSON.stringify(filtered));
}

export function getUniqueEditions(cards: Card[]): string[] {
  const editions = new Set(cards.map((card) => card.edition));
  return Array.from(editions).sort();
}

export function getUniqueTypes(cards: Card[]): string[] {
  const types = new Set(cards.map((card) => card.type));
  return Array.from(types).sort();
}

export function getUniqueRaces(cards: Card[]): string[] {
  const races = new Set(
    cards.map((card) => card.race).filter((race): race is string => race !== null)
  );
  return Array.from(races).sort();
}

export function getUniqueCosts(cards: Card[]): number[] {
  const costs = new Set(
    cards
      .map((card) => card.cost)
      .filter((cost): cost is number => cost !== null)
  );
  return Array.from(costs).sort((a, b) => a - b);
}

/**
 * Obtiene mazos de un usuario específico. Usa API si está disponible.
 */
/**
 * Obtiene mazos del usuario. Usa API si está disponible.
 * @param userId - ID del usuario
 * @param page - Número de página (default: 1)
 * @param limit - Cantidad de mazos por página (default: 12)
 */
export async function getUserDecksFromStorage(
  userId: string,
  page: number = 1,
  limit: number = 12
): Promise<{ decks: SavedDeck[]; pagination?: { page: number; limit: number; total: number; totalPages: number } }> {
  if (typeof window === "undefined") return { decks: [] };
  
  // Intentar usar API primero
  try {
    const { getUserDecks } = await import("@/lib/api/decks");
    const result = await getUserDecks(userId, page, limit);
    return {
      decks: result.data,
      pagination: result.pagination,
    };
  } catch {
    // Fallback a localStorage (sin paginación)
    const allDecks = getSavedDecksFromLocalStorage();
    const userDecks = allDecks.filter((deck) => deck.userId === userId);
    // Aplicar paginación manualmente en el cliente
    const start = (page - 1) * limit;
    const end = start + limit;
    return {
      decks: userDecks.slice(start, end),
      pagination: {
        page,
        limit,
        total: userDecks.length,
        totalPages: Math.ceil(userDecks.length / limit),
      },
    };
  }
}

/**
 * Obtiene mazos públicos. Usa API si está disponible.
 * @param page - Número de página (default: 1)
 * @param limit - Cantidad de mazos por página (default: 12)
 */
export async function getPublicDecksFromStorage(
  page: number = 1,
  limit: number = 12
): Promise<{ decks: SavedDeck[]; pagination?: { page: number; limit: number; total: number; totalPages: number } }> {
  if (typeof window === "undefined") return { decks: [] };
  
  // Intentar usar API primero
  try {
    const { getPublicDecks } = await import("@/lib/api/decks");
    const result = await getPublicDecks(page, limit);
    return {
      decks: result.data,
      pagination: result.pagination,
    };
  } catch {
    // Fallback a localStorage (sin paginación)
    const allDecks = getSavedDecksFromLocalStorage();
    const publicDecks = allDecks.filter((deck) => deck.isPublic === true);
    // Aplicar paginación manualmente en el cliente
    const start = (page - 1) * limit;
    const end = start + limit;
    return {
      decks: publicDecks.slice(start, end),
      pagination: {
        page,
        limit,
        total: publicDecks.length,
        totalPages: Math.ceil(publicDecks.length / limit),
      },
    };
  }
}

/**
 * @deprecated Usar getUserDecksFromStorage en su lugar
 */
export function getUserDecksFromLocalStorage(userId: string): SavedDeck[] {
  if (typeof window === "undefined") return [];
  const allDecks = getSavedDecksFromLocalStorage();
  return allDecks.filter((deck) => deck.userId === userId);
}

/**
 * @deprecated Usar getPublicDecksFromStorage en su lugar
 */
export function getPublicDecksFromLocalStorage(): SavedDeck[] {
  if (typeof window === "undefined") return [];
  const allDecks = getSavedDecksFromLocalStorage();
  return allDecks.filter((deck) => deck.isPublic === true);
}

/**
 * Calcula la raza del mazo si todos los aliados son de la misma raza
 * @returns La raza si todos los aliados son de la misma, null en caso contrario
 */
export function getDeckRace(deckCards: DeckCard[], allCards: Card[]): string | null {
  const cardMap = new Map(allCards.map((card) => [card.id, card]));
  const allyRaces = new Set<string>();

  for (const deckCard of deckCards) {
    const card = cardMap.get(deckCard.cardId);
    if (!card) continue;
    
    // Solo considerar aliados
    if (card.type === "Aliado" && card.race) {
      allyRaces.add(card.race);
    }
  }

  // Si hay exactamente una raza, retornarla
  if (allyRaces.size === 1) {
    return Array.from(allyRaces)[0];
  }

  return null;
}

/**
 * Obtiene el icono de raza para una carta individual
 * @param race - Raza de la carta
 * @returns URL del icono correspondiente a la raza
 */
export function getRaceIconUrl(race: string | null): string {
  if (!race) {
    return "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765250219/aliado_g3lv1c.webp";
  }

  const raceIcons: Record<string, string> = {
    Caballero: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765218636/icon_caballero_edplpa.webp",
    Dragón: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765250219/drag_psd49t.webp",
    Faerie: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765250219/faerie_ddfcsx.webp",
    Héroe: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764396472/Aliado_icono_lvsirg.webp",
    Olímpico: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765250219/olimpico_nvwqv0.webp",
    Títan: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765250225/titan_wl8gxy.webp",
    Defensor: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765250219/defe_mztno2.webp",
    Desafiante: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765218636/icon_vikingo_sgcbh3.webp",
    Sombra: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765250225/sombra_p4u2rh.webp",
    Eterno: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765250219/eterno_xefcre.webp",
    Faraón: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765218635/icon_faraon_rmz0c2.webp",
    Sacerdote: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765250220/sacer_qidnv4.webp",
  };

  return raceIcons[race] || "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765250219/aliado_g3lv1c.webp";
}

/**
 * Determina el icono dinámico para aliados basado en la raza dominante del mazo
 * @param deckCards - Array de cartas del mazo
 * @param allCards - Array de todas las cartas disponibles
 * @returns URL del icono correspondiente
 */
export function getAllyIconUrl(deckCards: DeckCard[], allCards: Card[]): string {
  const cardMap = new Map(allCards.map((card) => [card.id, card]));
  
  // Mapa de iconos por raza
  const raceIcons: Record<string, string> = {
    Caballero: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765218636/icon_caballero_edplpa.webp",
    Dragón: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765250219/drag_psd49t.webp",
    Faerie: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765250219/faerie_ddfcsx.webp",
    Héroe: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764396472/Aliado_icono_lvsirg.webp",
    Olímpico: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765250219/olimpico_nvwqv0.webp",
    Títan: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765250225/titan_wl8gxy.webp",
    Defensor: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765250219/defe_mztno2.webp",
    Desafiante: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765218636/icon_vikingo_sgcbh3.webp",
    Sombra: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765250225/sombra_p4u2rh.webp",
    Eterno: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765250219/eterno_xefcre.webp",
    Faraón: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765218635/icon_faraon_rmz0c2.webp",
    Sacerdote: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765250220/sacer_qidnv4.webp",
  };
  
  const iconDracula = "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765218635/icon_dracula_ms7dq4.webp";
  const iconDefault = "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765250219/aliado_g3lv1c.webp";
  
  // Contar aliados por raza y edición
  const raceCounts: Record<string, number> = {};
  let draculaCount = 0;
  let totalAllies = 0;
  
  for (const deckCard of deckCards) {
    const card = cardMap.get(deckCard.cardId);
    if (!card || card.type !== "Aliado") continue;
    
    totalAllies += deckCard.quantity;
    
    // Contar por edición Drácula
    if (card.edition === "Drácula") {
      draculaCount += deckCard.quantity;
    }
    
    // Contar por raza
    if (card.race) {
      raceCounts[card.race] = (raceCounts[card.race] || 0) + deckCard.quantity;
    }
  }
  
  // Si no hay aliados, retornar icono por defecto
  if (totalAllies === 0) {
    return iconDefault;
  }
  
  // Verificar si hay muchas cartas de la edición Drácula (más del 30% de los aliados)
  const draculaThreshold = totalAllies * 0.3;
  if (draculaCount > draculaThreshold) {
    return iconDracula;
  }
  
  // Encontrar la raza dominante
  let dominantRace: string | null = null;
  let maxCount = 0;
  
  for (const [race, count] of Object.entries(raceCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantRace = race;
    }
  }
  
  // Si hay una raza dominante (más del 40% de los aliados), usar su icono
  if (dominantRace && maxCount > totalAllies * 0.4) {
    return raceIcons[dominantRace] || iconDefault;
  }
  
  // Si no hay raza dominante, usar icono por defecto
  return iconDefault;
}

/**
 * Obtiene el nombre del formato del mazo
 * @returns El nombre del formato
 */
export function getDeckFormatName(format?: DeckFormat): string {
  if (!format) return "Racial Edición"
  const formatNames: Record<DeckFormat, string> = {
    RE: "Racial Edición",
    RL: "Racial Libre",
    LI: "Formato Libre",
  }
  return formatNames[format]
}

/**
 * Calcula la edición del mazo si todas las cartas son de la misma edición
 * @returns La edición si todas las cartas son de la misma, null en caso contrario
 */
export function getDeckEdition(deckCards: DeckCard[], allCards: Card[]): string | null {
  const cardMap = new Map(allCards.map((card) => [card.id, card]));
  const editions = new Set<string>();

  for (const deckCard of deckCards) {
    const card = cardMap.get(deckCard.cardId);
    if (!card) continue;
    editions.add(card.edition);
  }

  // Si hay exactamente una edición, retornarla
  if (editions.size === 1) {
    return Array.from(editions)[0];
  }

  return null;
}

/**
 * Obtiene la URL del logo de edición apropiado para el mazo
 * @param deckCards - Array de cartas del mazo
 * @param allCards - Array de todas las cartas disponibles
 * @returns URL del logo de edición (logo específico si hay una sola edición, logo de todas las ediciones si hay múltiples)
 */
export function getDeckEditionLogo(deckCards: DeckCard[], allCards: Card[]): string | null {
  const edition = getDeckEdition(deckCards, allCards);
  
  // Si hay una sola edición, retornar su logo
  if (edition && EDITION_LOGOS[edition]) {
    return EDITION_LOGOS[edition];
  }
  
  // Si hay múltiples ediciones (o ninguna), retornar logo de todas las ediciones
  const cardMap = new Map(allCards.map((card) => [card.id, card]));
  const editions = new Set<string>();
  
  for (const deckCard of deckCards) {
    const card = cardMap.get(deckCard.cardId);
    if (!card) continue;
    editions.add(card.edition);
  }
  
  // Si hay múltiples ediciones, usar el logo de todas las ediciones
  if (editions.size > 1) {
    return ALL_EDITIONS_LOGO;
  }
  
  // Si no hay cartas o no se puede determinar, retornar null
  return null;
}

/**
 * Obtiene la URL de la imagen de fondo según la raza del mazo
 * @param race La raza del mazo o null
 * @returns La URL de la imagen de fondo en Cloudinary
 */
export function getDeckBackgroundImage(race: string | null): string {
  if (!race) {
    // Imagen por defecto cuando no hay raza específica
    return "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765312691/banner_generico_qsmscv.webp";
  }

  // Mapeo de razas a URLs de Cloudinary
  const raceToImage: Record<string, string> = {
    "Caballero": "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435845/Caballero_Lancelot_yktyqi.webp",
    "Dragón": "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435846/dragon_dem_iuixsa.webp",
    "Faerie": "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435846/faerie_nim_elqmid.webp",
    "Héroe": "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435846/heroe_leonidas_fhiwcj.webp",
    "Olímpico": "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435846/olimpico_zeus_xcq0lg.webp",
    "Titán": "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435849/titan_cron_whvnwe.webp",
    "Defensor": "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435846/Defensor_Fergus_mwqmua.webp",
    "Desafiante": "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435846/desafiante_mac_fcx7cl.webp",
    "Sombra": "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435847/SOMBRA_CAO_z0awvj.webp",
    "Eterno": "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435845/eterno_heka_pks5d3.webp",
    "Faraón": "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435846/faraon_necho_1_zn7zuy.webp",
    "Sacerdote": "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435846/sacer_quika_gv4nzi.webp",
  };

  return raceToImage[race] || "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765312691/banner_generico_qsmscv.webp";
}

/**
 * Determina si un mazo contiene cartas "Auto" (cartas que pueden o deben atacar cuando entran en juego)
 * @param deckCards Las cartas del mazo
 * @param allCards Todas las cartas disponibles
 * @returns true si el mazo contiene al menos una carta Auto
 */
export function hasAutoCards(deckCards: DeckCard[], allCards: Card[]): boolean {
  const cardMap = new Map(allCards.map((card) => [card.id, card]));
  
  for (const deckCard of deckCards) {
    const card = cardMap.get(deckCard.cardId);
    if (!card) continue;
    
    // Buscar en la descripción si la carta puede o debe atacar cuando entra en juego
    const description = card.description.toLowerCase();
    if (
      description.includes("puede atacar cuando entra en juego") ||
      description.includes("debe atacar cuando entra en juego") ||
      description.includes("pueden atacar cuando entran en juego")
    ) {
      return true;
    }
  }
  
  return false;
}

/**
 * Guarda un mazo temporal en localStorage para usuarios no autenticados
 */
export function saveTemporaryDeck(deckName: string, deckCards: DeckCard[], format?: DeckFormat): void {
  if (typeof window === "undefined") return;
  
  const temporaryDeck = {
    name: deckName,
    cards: deckCards,
    format: format || "RE",
    savedAt: Date.now(),
  };
  
  localStorage.setItem("cartatech_temporary_deck", JSON.stringify(temporaryDeck));
}

/**
 * Obtiene el mazo temporal guardado en localStorage
 */
export function getTemporaryDeck(): { name: string; cards: DeckCard[]; format?: DeckFormat } | null {
  if (typeof window === "undefined") return null;
  
  try {
    const data = localStorage.getItem("cartatech_temporary_deck");
    if (!data) return null;
    
    const temporaryDeck = JSON.parse(data);
    return {
      name: temporaryDeck.name || "Mi Mazo",
      cards: temporaryDeck.cards || [],
      format: temporaryDeck.format || "RE",
    };
  } catch {
    return null;
  }
}

/**
 * Elimina el mazo temporal de localStorage
 */
export function clearTemporaryDeck(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("cartatech_temporary_deck");
}

/**
 * Obtiene todos los likes de los mazos. Usa API si está disponible.
 * @returns Un objeto que mapea deckId -> userId[]
 */
export async function getDeckLikesFromStorage(): Promise<Record<string, string[]>> {
  if (typeof window === "undefined") return {};
  
  // Intentar usar API primero
  try {
    const { getAllDeckLikes } = await import("@/lib/api/likes");
    return await getAllDeckLikes();
  } catch {
    // Fallback a localStorage
    return getDeckLikesFromLocalStorage();
  }
}

/**
 * Obtiene todos los likes de los mazos desde localStorage (fallback)
 * @returns Un objeto que mapea deckId -> userId[]
 */
export function getDeckLikesFromLocalStorage(): Record<string, string[]> {
  if (typeof window === "undefined") return {};

  try {
    const data = localStorage.getItem("cartatech_deck_likes");
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

/**
 * Guarda los likes de los mazos en localStorage
 * @param likes Objeto que mapea deckId -> userId[]
 */
export function saveDeckLikesToLocalStorage(likes: Record<string, string[]>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("cartatech_deck_likes", JSON.stringify(likes));
}

/**
 * Obtiene el número de likes de un mazo. Usa API si está disponible.
 * @param deckId ID del mazo
 * @returns Número de likes
 */
export async function getDeckLikeCountFromStorage(deckId: string): Promise<number> {
  if (typeof window === "undefined") return 0;
  
  // Intentar usar API primero
  try {
    const { getDeckLikeCount } = await import("@/lib/api/likes");
    return await getDeckLikeCount(deckId);
  } catch {
    // Fallback a localStorage
    return getDeckLikeCount(deckId);
  }
}

/**
 * Obtiene el número de likes de un mazo desde localStorage (fallback)
 * @param deckId ID del mazo
 * @returns Número de likes
 */
export function getDeckLikeCount(deckId: string): number {
  const likes = getDeckLikesFromLocalStorage();
  return likes[deckId]?.length || 0;
}

/**
 * Verifica si un usuario ha dado like a un mazo. Usa API si está disponible.
 * @param deckId ID del mazo
 * @param userId ID del usuario
 * @returns true si el usuario ha dado like al mazo
 */
export async function hasUserLikedDeckFromStorage(deckId: string, userId: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  
  // Intentar usar API primero
  try {
    const { hasUserLikedDeck: apiHasUserLiked } = await import("@/lib/api/likes");
    return await apiHasUserLiked(userId, deckId);
  } catch {
    // Fallback a localStorage
    return hasUserLikedDeck(deckId, userId);
  }
}

/**
 * Verifica si un usuario ha dado like a un mazo desde localStorage (fallback)
 * @param deckId ID del mazo
 * @param userId ID del usuario
 * @returns true si el usuario ha dado like al mazo
 */
export function hasUserLikedDeck(deckId: string, userId: string): boolean {
  const likes = getDeckLikesFromLocalStorage();
  return likes[deckId]?.includes(userId) || false;
}

/**
 * Alterna el like de un usuario en un mazo. Usa API si está disponible.
 * @param deckId ID del mazo
 * @param userId ID del usuario
 * @returns true si se agregó el like, false si se quitó
 */
export async function toggleDeckLikeFromStorage(deckId: string, userId: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  
  // Intentar usar API primero
  try {
    const { toggleDeckLike: apiToggleLike } = await import("@/lib/api/likes");
    return await apiToggleLike(userId, deckId);
  } catch {
    // Fallback a localStorage
    return toggleDeckLike(deckId, userId);
  }
}

/**
 * Alterna el like de un usuario en un mazo desde localStorage (fallback)
 * @param deckId ID del mazo
 * @param userId ID del usuario
 * @returns true si se agregó el like, false si se quitó
 */
export function toggleDeckLike(deckId: string, userId: string): boolean {
  const likes = getDeckLikesFromLocalStorage();
  const deckLikes = likes[deckId] || [];
  const hasLiked = deckLikes.includes(userId);

  if (hasLiked) {
    // Quitar like
    likes[deckId] = deckLikes.filter((id) => id !== userId);
    if (likes[deckId].length === 0) {
      delete likes[deckId];
    }
  } else {
    // Agregar like
    likes[deckId] = [...deckLikes, userId];
  }

  saveDeckLikesToLocalStorage(likes);
  return !hasLiked;
}

/**
 * Obtiene el contador de visitas de los mazos desde localStorage
 * @returns Un objeto que mapea deckId -> viewCount
 */
export function getDeckViewsFromLocalStorage(): Record<string, number> {
  if (typeof window === "undefined") return {};

  try {
    const data = localStorage.getItem("cartatech_deck_views");
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

/**
 * Guarda el contador de visitas de los mazos en localStorage
 * @param views Objeto que mapea deckId -> viewCount
 */
export function saveDeckViewsToLocalStorage(views: Record<string, number>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("cartatech_deck_views", JSON.stringify(views));
}

/**
 * Incrementa el contador de visitas de un mazo. 
 * Nota: Si el mazo viene de la API, el viewCount se incrementa automáticamente al obtenerlo.
 * Esta función solo se usa como fallback para mazos en localStorage.
 * @param deckId ID del mazo
 * @returns El nuevo número de visitas
 */
export function incrementDeckView(deckId: string): number {
  const views = getDeckViewsFromLocalStorage();
  views[deckId] = (views[deckId] || 0) + 1;
  saveDeckViewsToLocalStorage(views);
  return views[deckId];
}

/**
 * Obtiene el número de visitas de un mazo. Usa API si está disponible.
 * @param deckId ID del mazo
 * @returns Número de visitas
 */
export async function getDeckViewCountFromStorage(deckId: string): Promise<number> {
  if (typeof window === "undefined") return 0;
  
  // Intentar obtener desde la API primero
  try {
    const { getDeckById } = await import("@/lib/api/decks");
    const deck = await getDeckById(deckId);
    if (deck && deck.viewCount !== undefined) {
      return deck.viewCount;
    }
  } catch {
    // Fallback a localStorage
  }
  
  return getDeckViewCount(deckId);
}

/**
 * Obtiene el número de visitas de un mazo desde localStorage (fallback)
 * @param deckId ID del mazo
 * @returns Número de visitas
 */
export function getDeckViewCount(deckId: string): number {
  const views = getDeckViewsFromLocalStorage();
  return views[deckId] || 0;
}

/**
 * Obtiene los tags prioritarios de un mazo (máximo 4)
 * Prioriza: Agro, MidRange, Control, Combo
 * @param tags Array de tags del mazo
 * @returns Array con máximo 4 tags priorizados
 */
export function getPrioritizedDeckTags(tags: string[] | undefined): string[] {
  if (!tags || tags.length === 0) return [];
  
  const priorityTags = ["Agro", "MidRange", "Control", "Combo"];
  const prioritized: string[] = [];
  const otherTags: string[] = [];
  
  // Separar tags prioritarios de los demás
  for (const tag of tags) {
    if (priorityTags.includes(tag)) {
      prioritized.push(tag);
    } else {
      otherTags.push(tag);
    }
  }
  
  // Ordenar los tags prioritarios según el orden definido
  prioritized.sort((a, b) => {
    const indexA = priorityTags.indexOf(a);
    const indexB = priorityTags.indexOf(b);
    return indexA - indexB;
  });
  
  // Combinar: primero los prioritarios, luego los demás hasta completar 4
  const result = [...prioritized];
  for (const tag of otherTags) {
    if (result.length >= 4) break;
    result.push(tag);
  }
  
  return result.slice(0, 4);
}

/**
 * Obtiene todos los IDs de mazos favoritos desde localStorage
 * @returns Array de IDs de mazos favoritos
 */
export function getFavoriteDecksFromLocalStorage(): string[] {
  if (typeof window === "undefined") return [];
  
  try {
    const data = localStorage.getItem("myl_favorite_decks");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Obtiene los IDs de mazos favoritos de un usuario. Usa API si está disponible.
 * @param userId ID del usuario
 * @returns Array de IDs de mazos favoritos del usuario
 */
export async function getUserFavoriteDecksFromStorage(userId: string): Promise<string[]> {
  if (typeof window === "undefined") return [];
  
  // Intentar usar API primero
  try {
    const { getUserFavoriteDecks } = await import("@/lib/api/favorites");
    const result = await getUserFavoriteDecks(userId);
    return result.favoriteDeckIds;
  } catch {
    // Fallback a localStorage
    return getUserFavoriteDecksFromLocalStorage(userId);
  }
}

/**
 * Obtiene los IDs de mazos favoritos de un usuario específico desde localStorage
 * @deprecated Usar getUserFavoriteDecksFromStorage en su lugar
 */
export function getUserFavoriteDecksFromLocalStorage(userId: string): string[] {
  if (typeof window === "undefined") return [];
  
  try {
    const key = `myl_favorite_decks_${userId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Guarda los IDs de mazos favoritos de un usuario en localStorage
 * @deprecated Los favoritos ahora se manejan individualmente con toggleFavoriteDeck
 */
export function saveUserFavoriteDecksToLocalStorage(userId: string, favoriteDeckIds: string[]): void {
  if (typeof window === "undefined") return;
  
  const key = `myl_favorite_decks_${userId}`;
  localStorage.setItem(key, JSON.stringify(favoriteDeckIds));
}

/**
 * Alterna el estado de favorito de un mazo para un usuario. Usa API si está disponible.
 * @param deckId ID del mazo
 * @param userId ID del usuario
 * @returns true si se agregó a favoritos, false si se quitó
 */
export async function toggleFavoriteDeck(deckId: string, userId: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  
  // Intentar usar API primero
  try {
    const { toggleFavoriteDeck: apiToggleFavorite } = await import("@/lib/api/favorites");
    const isFavorite = await apiToggleFavorite(userId, deckId);
    
    // Tracking de analytics solo cuando se agrega a favoritos
    if (isFavorite) {
      const { trackDeckFavorited } = await import("@/lib/analytics/events");
      trackDeckFavorited(deckId);
    }
    
    return isFavorite;
  } catch {
    // Fallback a localStorage
    const isFavorite = toggleFavoriteDeckLocalStorage(deckId, userId);
    
    // Tracking de analytics solo cuando se agrega a favoritos
    if (isFavorite && typeof window !== "undefined") {
      import("@/lib/analytics/events").then(({ trackDeckFavorited }) => {
        trackDeckFavorited(deckId);
      });
    }
    
    return isFavorite;
  }
}

/**
 * Alterna el estado de favorito de un mazo en localStorage (fallback)
 */
function toggleFavoriteDeckLocalStorage(deckId: string, userId: string): boolean {
  if (typeof window === "undefined") return false;
  
  const favorites = getUserFavoriteDecksFromLocalStorage(userId);
  const isFavorite = favorites.includes(deckId);
  
  if (isFavorite) {
    // Quitar de favoritos
    const updated = favorites.filter((id) => id !== deckId);
    saveUserFavoriteDecksToLocalStorage(userId, updated);
    return false;
  } else {
    // Agregar a favoritos
    const updated = [...favorites, deckId];
    saveUserFavoriteDecksToLocalStorage(userId, updated);
    return true;
  }
}

/**
 * Verifica si un mazo está marcado como favorito por un usuario
 * @param deckId ID del mazo
 * @param userId ID del usuario
 * @returns true si el mazo está en favoritos
 */
export function isDeckFavorite(deckId: string, userId: string): boolean {
  if (typeof window === "undefined") return false;
  
  const favorites = getUserFavoriteDecksFromLocalStorage(userId);
  return favorites.includes(deckId);
}

/**
 * Obtiene los mazos favoritos completos de un usuario. Usa API si está disponible.
 * @param userId ID del usuario
 * @returns Array de mazos favoritos (SavedDeck[])
 */
export async function getFavoriteDecksFromStorage(userId: string): Promise<SavedDeck[]> {
  if (typeof window === "undefined") return [];
  
  // Intentar usar API primero
  try {
    const { getUserFavoriteDecks } = await import("@/lib/api/favorites");
    const result = await getUserFavoriteDecks(userId);
    return result.decks;
  } catch {
    // Fallback a localStorage
    return getFavoriteDecks(userId);
  }
}

/**
 * Obtiene los mazos favoritos completos de un usuario desde localStorage (fallback)
 * @param userId ID del usuario
 * @returns Array de mazos favoritos (SavedDeck[])
 */
export function getFavoriteDecks(userId: string): SavedDeck[] {
  if (typeof window === "undefined") return [];
  
  const favoriteIds = getUserFavoriteDecksFromLocalStorage(userId);
  const allDecks = getSavedDecksFromLocalStorage();
  
  // Filtrar solo los mazos que están en favoritos y son públicos
  return allDecks.filter((deck) => deck.id && favoriteIds.includes(deck.id) && deck.isPublic === true);
}

/**
 * Determina la posición Y óptima para mostrar la imagen de fondo de una carta
 * basándose en su tipo, características y metadatos personalizados de la base de datos.
 * 
 * @param card - La carta para la cual calcular la posición
 * @param cardMetadataMap - Mapa de metadatos personalizados por cardId (opcional)
 * @returns Porcentaje de posición Y (0% = arriba, 100% = abajo)
 */
export function getCardBackgroundPositionY(
  card: Card,
  cardMetadataMap?: Record<string, number>
): string {
  // Primero verificar si hay un ajuste personalizado en la base de datos
  if (cardMetadataMap && cardMetadataMap[card.id] !== undefined) {
    const customPosition = cardMetadataMap[card.id]
    return `${customPosition}%`
  }

  // Si no hay ajuste personalizado, usar valores por defecto basados en el tipo
  const typePositions: Record<string, number> = {
    "Aliado": 20,    // Arte generalmente en la parte superior
    "Arma": 25,      // Arte en la parte superior-media
    "Talismán": 30,   // Arte más hacia el centro
    "Tótem": 28,     // Similar a Talismán
    "Oro": 35,       // Arte más hacia el centro-inferior (más espacio para texto)
  }

  // Posición base según el tipo
  let positionY = typePositions[card.type] || 25

  // Ajuste basado en la longitud del nombre
  // Nombres largos pueden necesitar mostrar más arriba para evitar que el texto tape el arte
  const nameLength = card.name.length
  if (nameLength > 20) {
    positionY -= 3 // Mover un poco hacia arriba para nombres muy largos
  } else if (nameLength < 10) {
    positionY += 2 // Mover un poco hacia abajo para nombres cortos
  }

  // Ajuste basado en si tiene descripción (cartas con descripción suelen tener más contenido visual abajo)
  if (card.description && card.description.length > 50) {
    positionY += 2 // Mover un poco hacia abajo si tiene descripción larga
  }

  // Asegurar que la posición esté en un rango válido (entre 0% y 70%)
  positionY = Math.max(0, Math.min(70, positionY))

  return `${positionY}%`
}

