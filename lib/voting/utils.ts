import type { Card } from "@/lib/deck-builder/types"

export interface Vote {
  race: string
  cardId: string
  userId: string
  timestamp: number
}

export interface VoteResult {
  cardId: string
  cardName: string
  votes: number
  percentage: number
}

export interface RaceVotingData {
  race: string
  allies: Card[]
  userVote: string | null
  results: VoteResult[]
  totalVotes: number
}

/**
 * Obtiene todas las razas únicas de los aliados desde la API
 */
export async function getAllRaces(): Promise<string[]> {
  try {
    // Intentar obtener desde la API
    const { getAllCardsFromAPI } = await import("@/lib/api/cards");
    const cards = await getAllCardsFromAPI(false); // Solo principales
    
    const races = new Set<string>()
    cards.forEach((card) => {
      if (card.type === "Aliado" && card.race) {
        races.add(card.race)
      }
    })
    return Array.from(races).sort()
  } catch (error) {
    console.error("Error al obtener razas desde API, usando fallback:", error);
    // Fallback a archivos JS
    const { getAllCards } = await import("@/lib/deck-builder/utils");
    const cards = getAllCards();
    const races = new Set<string>()
    cards.forEach((card) => {
      if (card.type === "Aliado" && card.race) {
        races.add(card.race)
      }
    })
    return Array.from(races).sort()
  }
}

/**
 * Obtiene todas las razas únicas de los aliados (versión síncrona para compatibilidad)
 * Usa fallback a archivos JS
 */
export function getAllRacesSync(): string[] {
  const { getAllCards } = require("@/lib/deck-builder/utils");
  const cards = getAllCards();
  const races = new Set<string>()
  cards.forEach((card: Card) => {
    if (card.type === "Aliado" && card.race) {
      races.add(card.race)
    }
  })
  return Array.from(races).sort()
}

/**
 * Obtiene todos los aliados de una raza específica desde la API
 */
export async function getAlliesByRace(race: string): Promise<Card[]> {
  try {
    // Intentar obtener desde la API
    const { getAllCardsFromAPI } = await import("@/lib/api/cards");
    const cards = await getAllCardsFromAPI(false); // Solo principales
    
    return cards.filter(
      (card) => card.type === "Aliado" && card.race === race && !card.isCosmetic
    )
  } catch (error) {
    console.error("Error al obtener aliados desde API, usando fallback:", error);
    // Fallback a archivos JS
    const { getAllCards } = await import("@/lib/deck-builder/utils");
    const cards = getAllCards();
    return cards.filter(
      (card) => card.type === "Aliado" && card.race === race && !card.isCosmetic
    )
  }
}

/**
 * Obtiene todos los aliados de una raza específica (versión síncrona para compatibilidad)
 * Usa fallback a archivos JS
 */
export function getAlliesByRaceSync(race: string): Card[] {
  const { getAllCards } = require("@/lib/deck-builder/utils");
  const cards = getAllCards();
  return cards.filter(
    (card: Card) => card.type === "Aliado" && card.race === race && !card.isCosmetic
  )
}

/**
 * Obtiene todas las votaciones. Usa API si está disponible.
 */
export async function getVotesFromStorage(): Promise<Vote[]> {
  if (typeof window === "undefined") return []
  
  // Intentar usar API primero
  try {
    const { getAllVotes } = await import("@/lib/api/votes");
    return await getAllVotes();
  } catch {
    // Fallback a localStorage
    return getVotesFromLocalStorage();
  }
}

/**
 * Obtiene todas las votaciones desde localStorage (fallback)
 */
export function getVotesFromLocalStorage(): Vote[] {
  if (typeof window === "undefined") return []
  try {
    const data = localStorage.getItem("cartatech_votes")
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

/**
 * Guarda una votación. Usa API si está disponible.
 */
export async function saveVoteToStorage(vote: Vote): Promise<void> {
  if (typeof window === "undefined") return

  // Intentar usar API primero
  try {
    const { saveVote } = await import("@/lib/api/votes");
    await saveVote(vote.userId, vote.race, vote.cardId);
    return;
  } catch (error) {
    console.error("Error al guardar voto en API:", error);
    // Fallback a localStorage
  }

  // Fallback a localStorage
  saveVoteToLocalStorage(vote);
}

/**
 * Guarda una votación en localStorage (fallback)
 */
export function saveVoteToLocalStorage(vote: Vote): void {
  if (typeof window === "undefined") return

  const votes = getVotesFromLocalStorage()
  
  // Eliminar votación previa del usuario para esta raza
  const filteredVotes = votes.filter(
    (v) => !(v.userId === vote.userId && v.race === vote.race)
  )
  
  // Agregar nueva votación
  filteredVotes.push(vote)
  
  localStorage.setItem("cartatech_votes", JSON.stringify(filteredVotes))
}

/**
 * Obtiene la votación del usuario para una raza específica. Usa API si está disponible.
 */
export async function getUserVoteForRaceFromStorage(userId: string, race: string): Promise<string | null> {
  if (typeof window === "undefined") return null
  
  // Intentar usar API primero
  try {
    const { getUserVoteForRace: apiGetUserVote } = await import("@/lib/api/votes");
    return await apiGetUserVote(userId, race);
  } catch {
    // Fallback a localStorage
    return getUserVoteForRace(userId, race);
  }
}

/**
 * Obtiene la votación del usuario para una raza específica desde localStorage (fallback)
 */
export function getUserVoteForRace(userId: string, race: string): string | null {
  const votes = getVotesFromLocalStorage()
  const userVote = votes.find((v) => v.userId === userId && v.race === race)
  return userVote ? userVote.cardId : null
}

/**
 * Calcula los resultados de votación para una raza. Usa API si está disponible.
 */
export async function calculateVoteResultsFromStorage(race: string, allies: Card[]): Promise<VoteResult[]> {
  if (typeof window === "undefined") {
    return allies.map((ally) => ({
      cardId: ally.id,
      cardName: ally.name,
      votes: 0,
      percentage: 0,
    }));
  }
  
  let votes: Vote[] = [];
  
  // Intentar usar API primero
  try {
    const { getVotesByRace } = await import("@/lib/api/votes");
    votes = await getVotesByRace(race);
  } catch {
    // Fallback a localStorage
    votes = getVotesFromLocalStorage().filter((v) => v.race === race);
  }
  
  const totalVotes = votes.length;

  if (totalVotes === 0) {
    return allies.map((ally) => ({
      cardId: ally.id,
      cardName: ally.name,
      votes: 0,
      percentage: 0,
    }))
  }

  const voteCounts = new Map<string, number>()
  allies.forEach((ally) => {
    voteCounts.set(ally.id, 0)
  })

  votes.forEach((vote) => {
    const current = voteCounts.get(vote.cardId) || 0
    voteCounts.set(vote.cardId, current + 1)
  })

  return allies
    .map((ally) => {
      const voteCount = voteCounts.get(ally.id) || 0
      return {
        cardId: ally.id,
        cardName: ally.name,
        votes: voteCount,
        percentage: totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0,
      }
    })
    .sort((a, b) => b.votes - a.votes)
}

/**
 * Calcula los resultados de votación para una raza desde localStorage (fallback)
 */
export function calculateVoteResults(race: string, allies: Card[]): VoteResult[] {
  const votes = getVotesFromLocalStorage()
  const raceVotes = votes.filter((v) => v.race === race)
  const totalVotes = raceVotes.length

  if (totalVotes === 0) {
    return allies.map((ally) => ({
      cardId: ally.id,
      cardName: ally.name,
      votes: 0,
      percentage: 0,
    }))
  }

  const voteCounts = new Map<string, number>()
  allies.forEach((ally) => {
    voteCounts.set(ally.id, 0)
  })

  raceVotes.forEach((vote) => {
    const current = voteCounts.get(vote.cardId) || 0
    voteCounts.set(vote.cardId, current + 1)
  })

  return allies
    .map((ally) => {
      const votes = voteCounts.get(ally.id) || 0
      return {
        cardId: ally.id,
        cardName: ally.name,
        votes,
        percentage: totalVotes > 0 ? (votes / totalVotes) * 100 : 0,
      }
    })
    .sort((a, b) => b.votes - a.votes)
}

/**
 * Obtiene todos los datos de votación para una raza. Usa API si está disponible.
 */
export async function getRaceVotingDataFromStorage(race: string, userId: string): Promise<RaceVotingData> {
  const allies = await getAlliesByRace(race)
  
  let userVote: string | null = null;
  let results: VoteResult[] = [];
  
  if (typeof window !== "undefined") {
    // Intentar usar API primero
    try {
      const { getUserVoteForRace: apiGetUserVote } = await import("@/lib/api/votes");
      const { calculateVoteResultsFromStorage } = await import("./utils");
      userVote = await apiGetUserVote(userId, race);
      results = await calculateVoteResultsFromStorage(race, allies);
    } catch {
      // Fallback a localStorage
      userVote = getUserVoteForRace(userId, race);
      results = calculateVoteResults(race, allies);
    }
  } else {
    // Server-side: usar funciones síncronas
    userVote = getUserVoteForRace(userId, race);
    results = calculateVoteResults(race, allies);
  }
  
  const totalVotes = results.reduce((sum, r) => sum + r.votes, 0)

  return {
    race,
    allies,
    userVote,
    results,
    totalVotes,
  }
}

/**
 * Obtiene todos los datos de votación para una raza desde localStorage (fallback)
 */
export function getRaceVotingData(race: string, userId: string): RaceVotingData {
  const allies = getAlliesByRaceSync(race)
  const userVote = getUserVoteForRace(userId, race)
  const results = calculateVoteResults(race, allies)
  const totalVotes = results.reduce((sum, r) => sum + r.votes, 0)

  return {
    race,
    allies,
    userVote,
    results,
    totalVotes,
  }
}




