"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getAllCardsFromAPI } from "@/lib/api/cards";
import { getAllCards, getAlternativeArtCards } from "@/lib/deck-builder/utils";
import type { Card } from "@/lib/deck-builder/types";

/**
 * Hook para obtener todas las cartas usando React Query
 * Incluye fallback automático a archivos JS si la API falla
 * 
 * Este hook ahora usa React Query internamente para mejor cache y sincronización
 * Mantiene la misma API para compatibilidad con componentes existentes
 */
export function useCards(includeAlternatives: boolean = false) {
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
    error: query.error as Error | null,
  }
}

/**
 * Función para limpiar el cache (útil después de actualizaciones)
 * Ahora usa React Query para invalidar el cache
 * 
 * Esta función dispara un evento que el QueryProvider escucha para invalidar el cache.
 * También puede usar invalidateCardsCache() directamente si se importa desde query-provider.
 */
export function clearCardsCache() {
  if (typeof window !== "undefined") {
    // Disparar evento que el QueryProvider escuchará
    window.dispatchEvent(new CustomEvent("clearCardsCache"))
  }
}

/**
 * Hook para invalidar el cache de cartas usando React Query
 * Usar este hook en componentes que necesiten invalidar el cache manualmente
 * 
 * @example
 * const clearCache = useClearCardsCache()
 * clearCache() // Invalidar cache de cartas
 */
export function useClearCardsCache() {
  const queryClient = useQueryClient()
  
  return () => {
    // Invalidar todas las queries relacionadas con cartas
    queryClient.invalidateQueries({ queryKey: ["cards"] })
  }
}

