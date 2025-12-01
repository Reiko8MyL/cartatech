"use client"

import { useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { Toggle } from "@/components/ui/toggle"
import { Button } from "@/components/ui/button"
import { BookOpen } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import type { Card } from "@/lib/deck-builder/types"
import { EDITION_ORDER } from "@/lib/deck-builder/types"
import { EDITION_LOGOS } from "@/lib/deck-builder/utils"

interface CollectionModePanelProps {
  isCollectionMode: boolean
  onToggleCollectionMode: (enabled: boolean) => void
  allCards: Card[]
  collectedCards: Set<string>
}

export function CollectionModePanel({
  isCollectionMode,
  onToggleCollectionMode,
  allCards,
  collectedCards,
}: CollectionModePanelProps) {
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
      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="size-5 text-muted-foreground" />
            <span className="text-sm font-medium">Modo Colección</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Inicia sesión para activar el modo coleccionista y llevar un registro de tus cartas.
          </p>
          <Button asChild size="sm" className="w-full sm:w-auto">
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
        >
          <BookOpen className="size-4" />
          <span className="text-sm font-medium">Modo Colección</span>
        </Toggle>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <Toggle
          pressed={isCollectionMode}
          onPressedChange={onToggleCollectionMode}
          aria-label="Desactivar modo colección"
        >
          <BookOpen className="size-4" />
          <span className="text-sm font-medium">Modo Colección</span>
        </Toggle>
        <div className="text-sm font-semibold">
          {totalCollected} / {totalCards} cartas
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {EDITION_ORDER.map((edition) => {
          const stat = collectionStats[edition]
          if (!stat) return null

          const percentage = stat.total > 0 
            ? Math.round((stat.collected / stat.total) * 100) 
            : 0

          return (
            <div
              key={edition}
              className="rounded-lg border bg-muted/50 p-2 sm:p-3 flex items-center gap-2 sm:gap-3"
            >
              {EDITION_LOGOS[edition] && (
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                  <Image
                    src={EDITION_LOGOS[edition]}
                    alt={edition}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 64px, 80px"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium mb-1 truncate">
                  {edition}
                </div>
                <div className="text-lg sm:text-xl font-bold">
                  {stat.collected} / {stat.total}
                </div>
                <div className="text-xs text-muted-foreground">
                  {percentage}%
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

