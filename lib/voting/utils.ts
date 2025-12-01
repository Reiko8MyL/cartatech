import { CARDS } from "@/lib/data/cards"
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
 * Obtiene todas las razas únicas de los aliados
 */
export function getAllRaces(): string[] {
  const races = new Set<string>()
  CARDS.forEach((card) => {
    if (card.type === "Aliado" && card.race) {
      races.add(card.race)
    }
  })
  return Array.from(races).sort()
}

/**
 * Obtiene todos los aliados de una raza específica
 */
export function getAlliesByRace(race: string): Card[] {
  return CARDS.filter(
    (card) => card.type === "Aliado" && card.race === race && !card.isCosmetic
  )
}

/**
 * Obtiene todas las votaciones desde localStorage
 */
export function getVotesFromStorage(): Vote[] {
  if (typeof window === "undefined") return []
  try {
    const data = localStorage.getItem("cartatech_votes")
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

/**
 * Guarda una votación en localStorage
 */
export function saveVoteToStorage(vote: Vote): void {
  if (typeof window === "undefined") return

  const votes = getVotesFromStorage()
  
  // Eliminar votación previa del usuario para esta raza
  const filteredVotes = votes.filter(
    (v) => !(v.userId === vote.userId && v.race === vote.race)
  )
  
  // Agregar nueva votación
  filteredVotes.push(vote)
  
  localStorage.setItem("cartatech_votes", JSON.stringify(filteredVotes))
}

/**
 * Obtiene la votación del usuario para una raza específica
 */
export function getUserVoteForRace(userId: string, race: string): string | null {
  const votes = getVotesFromStorage()
  const userVote = votes.find((v) => v.userId === userId && v.race === race)
  return userVote ? userVote.cardId : null
}

/**
 * Calcula los resultados de votación para una raza
 */
export function calculateVoteResults(race: string, allies: Card[]): VoteResult[] {
  const votes = getVotesFromStorage()
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
 * Obtiene todos los datos de votación para una raza
 */
export function getRaceVotingData(race: string, userId: string): RaceVotingData {
  const allies = getAlliesByRace(race)
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



