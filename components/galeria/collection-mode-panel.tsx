"use client"

import { useMemo, memo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Toggle } from "@/components/ui/toggle"
import { Button } from "@/components/ui/button"
import { BookOpen, Flame, ChevronDown, ChevronUp } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import type { Card } from "@/lib/deck-builder/types"
import { EDITION_ORDER } from "@/lib/deck-builder/types"
import { EDITION_LOGOS } from "@/lib/deck-builder/utils"
import { optimizeCloudinaryUrl, isCloudinaryOptimized } from "@/lib/deck-builder/cloudinary-utils"
import { useDeviceType } from "@/contexts/device-context"
import { getBaseCardId } from "@/lib/deck-builder/utils"

interface CollectionModePanelProps {
  isCollectionMode: boolean
  onToggleCollectionMode: (enabled: boolean) => void
  isHardcoreMode: boolean
  onToggleHardcoreMode: (enabled: boolean) => void
  allCards: Card[]
  collectedCards: Map<string, number>
}

export const CollectionModePanel = memo(function CollectionModePanel({
  isCollectionMode,
  onToggleCollectionMode,
  isHardcoreMode,
  onToggleHardcoreMode,
  allCards,
  collectedCards,
}: CollectionModePanelProps) {
  // Estado para minimizar/expandir el panel
  const [isMinimized, setIsMinimized] = useState(false)
  
  // Obtener tipo de dispositivo para optimizar URLs
  const deviceType = useDeviceType()

  // Calcular cartas por edición
  // En modo hardcore, contar todas las cartas (incluyendo alternativas)
  // En modo normal, solo contar cartas principales (no alternativas)
  // Las cartas alternativas son completamente independientes de las originales
  const collectionStats = useMemo(() => {
    const stats: Record<string, { collected: number; total: number }> = {}

    for (const card of allCards) {
      // En modo normal, solo contar cartas principales (no alternativas)
      if (!isHardcoreMode && card.isCosmetic) {
        continue
      }
      
      if (!stats[card.edition]) {
        stats[card.edition] = { collected: 0, total: 0 }
      }
      stats[card.edition].total++
      
      // Verificar si la carta está en la colección
      // Las cartas alternativas son independientes: solo cuentan si están marcadas directamente
      const quantity = collectedCards.get(card.id) || 0
      const isCollected = quantity > 0
      
      if (isCollected) {
        stats[card.edition].collected++
      }
    }

    return stats
  }, [allCards, collectedCards, isHardcoreMode])

  // Calcular totales
  const totalCollected = useMemo(() => {
    return Object.values(collectionStats).reduce(
      (sum, stat) => sum + stat.collected,
      0
    )
  }, [collectionStats])

  const totalCards = useMemo(() => {
    return Object.values(collectionStats).reduce(
      (sum, stat) => sum + stat.total,
      0
    )
  }, [collectionStats])

  const { user } = useAuth()

  if (!user) {
    return (
      <div className="rounded-lg border bg-card p-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Modo Colección</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Inicia sesión para activar el modo coleccionista y llevar un registro de tus cartas.
          </p>
          <Button asChild size="sm" className="w-full">
            <Link href="/inicio-sesion">Iniciar Sesión</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!isCollectionMode) {
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
        <Toggle
          pressed={isCollectionMode}
          onPressedChange={onToggleCollectionMode}
          aria-label="Activar modo colección"
          className="w-full justify-start"
        >
          <BookOpen className="size-4" />
          <span className="text-sm font-medium">Modo Colección</span>
        </Toggle>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center justify-between gap-3 mb-3">
        <Toggle
          pressed={isCollectionMode}
          onPressedChange={onToggleCollectionMode}
          aria-label="Desactivar modo colección"
          className="flex-1 justify-start"
        >
          <BookOpen className="size-4" />
          <span className="text-sm font-medium">Modo Colección</span>
        </Toggle>
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold whitespace-nowrap">
            {totalCollected} / {totalCards}
          </div>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-muted rounded transition-colors"
            aria-label={isMinimized ? "Expandir panel" : "Minimizar panel"}
            title={isMinimized ? "Expandir panel" : "Minimizar panel"}
          >
            {isMinimized ? (
              <ChevronDown className="size-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="size-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Contenido expandible - solo visible cuando no está minimizado */}
      {!isMinimized && (
        <>
          {/* Toggle de Modo Hardcore - solo visible cuando modo colección está activo */}
          {isCollectionMode && (
            <div className="mb-3">
              <Toggle
                pressed={isHardcoreMode}
                onPressedChange={onToggleHardcoreMode}
                aria-label={isHardcoreMode ? "Desactivar modo hardcore" : "Activar modo hardcore"}
                className="w-full justify-start"
              >
                <Flame className="size-4 text-orange-500" />
                <span className="text-sm font-medium">Modo Hardcore</span>
              </Toggle>
              <p className="text-xs text-muted-foreground mt-1 ml-7">
                Muestra todas las cartas incluyendo artes alternativos
              </p>
            </div>
          )}

          {/* Grid vertical más compacto para el sidebar */}
          <div className="space-y-2">
            {EDITION_ORDER.map((edition) => {
              const stat = collectionStats[edition]
              if (!stat) return null

              const percentage = stat.total > 0 
                ? ((stat.collected / stat.total) * 100).toFixed(2)
                : '0.00'

              return (
                <div
                  key={edition}
                  className="rounded-lg border bg-muted/50 p-2 flex items-center gap-2"
                >
                  {EDITION_LOGOS[edition] && (() => {
                    const logoUrl = EDITION_LOGOS[edition]
                    const optimizedLogoUrl = optimizeCloudinaryUrl(logoUrl, deviceType)
                    const isOptimized = isCloudinaryOptimized(optimizedLogoUrl)
                    return (
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <Image
                          src={optimizedLogoUrl}
                          alt={edition}
                          fill
                          className="object-contain"
                          sizes="48px"
                          unoptimized={isOptimized}
                        />
                      </div>
                    )
                  })()}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium mb-0.5 truncate">
                      {edition}
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold">
                        {stat.collected} / {stat.total}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({percentage}%)
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  // Comparación optimizada para evitar re-renders innecesarios
  return (
    prevProps.isCollectionMode === nextProps.isCollectionMode &&
    prevProps.isHardcoreMode === nextProps.isHardcoreMode &&
    prevProps.allCards.length === nextProps.allCards.length &&
    prevProps.collectedCards.size === nextProps.collectedCards.size &&
    prevProps.onToggleCollectionMode === nextProps.onToggleCollectionMode &&
    prevProps.onToggleHardcoreMode === nextProps.onToggleHardcoreMode &&
    // Comparar si las cantidades son iguales (comparación simple)
    Array.from(prevProps.collectedCards.entries()).every(([id, qty]) => 
      nextProps.collectedCards.get(id) === qty
    ) &&
    Array.from(nextProps.collectedCards.entries()).every(([id, qty]) => 
      prevProps.collectedCards.get(id) === qty
    )
  )
})

