"use client"

import { useQuery } from "@tanstack/react-query"
import { getAllCardsFromAPI } from "@/lib/api/cards"
import { getAllCards, getAlternativeArtCards } from "@/lib/deck-builder/utils"
import type { Card } from "@/lib/deck-builder/types"

/**
 * Hook para obtener todas las cartas usando React Query
 * Incluye fallback automático a archivos JS si la API falla
 * 
 * @param includeAlternatives - Si incluir cartas alternativas
 * @returns Objeto con cards, isLoading, error
 */
export function useCardsQuery(includeAlternatives: boolean = false) {
  // Fallback inmediato a archivos JS mientras carga
  const fallbackCards = includeAlternatives
    ? [...getAllCards(), ...getAlternativeArtCards()]
    : getAllCards()

  const queryKey = includeAlternatives ? ["cards", "with-alternatives"] : ["cards"]

  const query = useQuery<Card[]>({
    queryKey,
    queryFn: () => getAllCardsFromAPI(includeAlternatives),
    // Usar datos de fallback mientras carga
    placeholderData: fallbackCards,
    // Cache por 10 minutos (las cartas no cambian frecuentemente)
    staleTime: 10 * 60 * 1000,
    // Mantener datos en cache por 30 minutos
    gcTime: 30 * 60 * 1000,
    // Reintentar una vez en caso de error
    retry: 1,
    // No refetch automático (las cartas son datos relativamente estáticos)
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  })

  return {
    cards: query.data || fallbackCards,
    isLoading: query.isLoading && !query.data,
    error: query.error,
    // Exponer funciones de React Query para invalidación manual si es necesario
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  }
}

/**
 * Función para invalidar el cache de cartas (útil después de actualizaciones)
 * Usar con useQueryClient de React Query
 */
export const CARDS_QUERY_KEYS = {
  all: ["cards"] as const,
  withAlternatives: ["cards", "with-alternatives"] as const,
  withoutAlternatives: ["cards"] as const,
}
