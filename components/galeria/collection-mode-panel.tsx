"use client"

import { useMemo, memo } from "react"
import Image from "next/image"
import Link from "next/link"
import { Toggle } from "@/components/ui/toggle"
import { Button } from "@/components/ui/button"
import { BookOpen } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import type { Card } from "@/lib/deck-builder/types"
import { EDITION_ORDER } from "@/lib/deck-builder/types"
import { EDITION_LOGOS } from "@/lib/deck-builder/utils"
import { optimizeCloudinaryUrl, isCloudinaryOptimized } from "@/lib/deck-builder/cloudinary-utils"
import { useDeviceType } from "@/contexts/device-context"

interface CollectionModePanelProps {
  isCollectionMode: boolean
  onToggleCollectionMode: (enabled: boolean) => void
  allCards: Card[]
  collectedCards: Set<string>
}

export const CollectionModePanel = memo(function CollectionModePanel({
  isCollectionMode,
  onToggleCollectionMode,
  allCards,
  collectedCards,
}: CollectionModePanelProps) {
  // Obtener tipo de dispositivo para optimizar URLs
  const deviceType = useDeviceType()

  // Calcular cartas por edición
  const collectionStats = useMemo(() => {
    const stats: Record<string, { collected: number; total: number }> = {}

    for (const card of allCards) {
      if (!stats[card.edition]) {
        stats[card.edition] = { collected: 0, total: 0 }
      }
      stats[card.edition].total++
      if (collectedCards.has(card.id)) {
        stats[card.edition].collected++
      }
    }

    return stats
  }, [allCards, collectedCards])

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
        <div className="text-sm font-semibold whitespace-nowrap">
          {totalCollected} / {totalCards}
        </div>
      </div>

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
    </div>
  )
}, (prevProps, nextProps) => {
  // Comparación optimizada para evitar re-renders innecesarios
  return (
    prevProps.isCollectionMode === nextProps.isCollectionMode &&
    prevProps.allCards.length === nextProps.allCards.length &&
    prevProps.collectedCards.size === nextProps.collectedCards.size &&
    prevProps.onToggleCollectionMode === nextProps.onToggleCollectionMode
  )
})

