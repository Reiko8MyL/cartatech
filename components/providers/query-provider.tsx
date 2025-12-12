"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useState, useEffect } from "react"

// Variable global para almacenar el QueryClient (para uso fuera de componentes)
let globalQueryClient: QueryClient | null = null

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Crear QueryClient una sola vez por instancia del componente
  // Esto evita recrear el cliente en cada render
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache por 5 minutos (300000ms)
            staleTime: 5 * 60 * 1000,
            // Mantener datos en cache por 10 minutos
            gcTime: 10 * 60 * 1000,
            // Reintentar automáticamente en caso de error
            retry: 1,
            // Refetch cuando la ventana recupera el foco (útil para datos que pueden cambiar)
            refetchOnWindowFocus: false,
            // No refetch automático en reconexión (evita requests innecesarios)
            refetchOnReconnect: false,
          },
          mutations: {
            // Reintentar mutaciones fallidas
            retry: 1,
          },
        },
      })
  )

  // Guardar referencia global para uso fuera de componentes
  useEffect(() => {
    globalQueryClient = queryClient

    // Escuchar eventos de invalidación de cache
    const handleClearCache = () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] })
    }

    window.addEventListener("clearCardsCache", handleClearCache)
    window.addEventListener("invalidateCardsCache", handleClearCache)

    return () => {
      window.removeEventListener("clearCardsCache", handleClearCache)
      window.removeEventListener("invalidateCardsCache", handleClearCache)
      globalQueryClient = null
    }
  }, [queryClient])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* React Query Devtools - Solo en desarrollo */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}

/**
 * Función helper para invalidar cache desde fuera de componentes
 * Útil para funciones que no tienen acceso a useQueryClient
 */
export function invalidateCardsCache() {
  if (globalQueryClient) {
    globalQueryClient.invalidateQueries({ queryKey: ["cards"] })
  } else {
    // Fallback: disparar evento que el provider escuchará
    window.dispatchEvent(new CustomEvent("clearCardsCache"))
  }
}
