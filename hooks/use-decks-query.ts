"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getPublicDecks, getUserDecks, type PublicDecksFilters } from "@/lib/api/decks"
import { getPublicDecksFromStorage, getUserDecksFromStorage } from "@/lib/deck-builder/utils"
import type { SavedDeck } from "@/lib/deck-builder/types"
import type { PaginatedResponse } from "@/lib/api/decks"

/**
 * Hook para obtener mazos públicos usando React Query
 * Usa getPublicDecks que incluye filtros del servidor y fallback a localStorage
 */
export function usePublicDecksQuery(
  page: number = 1,
  limit: number = 12,
  filters?: PublicDecksFilters
) {
  return useQuery<{ decks: SavedDeck[]; pagination?: { page: number; limit: number; total: number; totalPages: number } }>({
    queryKey: ["decks", "public", page, limit, filters],
    queryFn: async () => {
      // Intentar obtener de la API primero
      try {
        const result = await getPublicDecks(page, limit, filters);
        return {
          decks: result.data,
          pagination: result.pagination,
        };
      } catch (error) {
        console.warn("Error al obtener mazos de API, usando localStorage:", error);
        // Fallback a localStorage (sin filtros del servidor)
        return getPublicDecksFromStorage(page, limit);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos (aumentado para reducir operaciones de BD)
    gcTime: 10 * 60 * 1000, // 10 minutos en cache (aumentado)
    retry: 1,
    refetchOnWindowFocus: false,
    // Usar datos de localStorage como placeholder mientras carga
    placeholderData: (previousData) => previousData,
  })
}

/**
 * Hook para obtener mazos del usuario usando React Query
 * Usa getUserDecksFromStorage que incluye fallback a localStorage
 */
export function useUserDecksQuery(userId: string | undefined, page: number = 1, limit: number = 100) {
  return useQuery<{ decks: SavedDeck[]; pagination?: { page: number; limit: number; total: number; totalPages: number } }>({
    queryKey: ["decks", "user", userId, page, limit],
    queryFn: () => {
      if (!userId) throw new Error("userId es requerido")
      return getUserDecksFromStorage(userId, page, limit)
    },
    enabled: !!userId, // Solo ejecutar si hay userId
    staleTime: 2 * 60 * 1000, // 2 minutos (aumentado para reducir operaciones de BD)
    gcTime: 10 * 60 * 1000, // 10 minutos en cache (aumentado)
    retry: 1,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  })
}

/**
 * Hook para obtener un mazo específico por ID usando React Query
 */
export function useDeckQuery(deckId: string | undefined) {
  return useQuery<SavedDeck | null>({
    queryKey: ["deck", deckId],
    queryFn: async () => {
      if (!deckId) return null
      const { getDeckById } = await import("@/lib/api/decks")
      return getDeckById(deckId)
    },
    enabled: !!deckId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook para invalidar cache de mazos
 */
export function useInvalidateDecks() {
  const queryClient = useQueryClient()
  
  return {
    invalidatePublic: () => queryClient.invalidateQueries({ queryKey: ["decks", "public"] }),
    invalidateUser: (userId?: string) => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["decks", "user", userId] })
      } else {
        queryClient.invalidateQueries({ queryKey: ["decks", "user"] })
      }
    },
    invalidateDeck: (deckId: string) => {
      queryClient.invalidateQueries({ queryKey: ["deck", deckId] })
    },
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: ["decks"] }),
  }
}
