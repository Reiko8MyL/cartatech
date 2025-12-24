"use client"

import { useQuery } from "@tanstack/react-query"
import { getFeed, type FeedResponse } from "@/lib/api/feed"

/**
 * Hook para obtener el feed de actividad usando React Query
 */
export function useFeedQuery(
  userId: string | undefined,
  page: number = 1,
  limit: number = 20
) {
  return useQuery<FeedResponse | null>({
    queryKey: ["feed", userId, page, limit],
    queryFn: async () => {
      if (!userId) return null
      return await getFeed(userId, page, limit)
    },
    enabled: !!userId, // Solo ejecutar si hay userId
    staleTime: 1 * 60 * 1000, // 1 minuto (el feed cambia frecuentemente)
    gcTime: 5 * 60 * 1000, // 5 minutos en cache
    retry: 1,
    refetchOnWindowFocus: true, // Refrescar cuando el usuario vuelve a la pestaña
    refetchInterval: 5 * 60 * 1000, // Refrescar cada 5 minutos automáticamente
  })
}

