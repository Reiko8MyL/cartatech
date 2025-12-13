"use client"

import { useRef, useMemo } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import type { Card } from "@/lib/deck-builder/types"

interface VirtualizedCardGridProps {
  cards: Card[]
  collectedCards: Map<string, number>
  loadingCards: Set<string>
  isCollectionMode: boolean
  onCardClick: (card: Card) => void
  onCardRightClick: (e: React.MouseEvent, card: Card) => void
  onToggleCollection: (cardId: string) => void
  columns?: number
  cardHeight?: number
  gap?: number
}

/**
 * Componente de grid virtualizado para renderizar solo las cartas visibles
 * Mejora significativamente el rendimiento cuando hay muchas cartas
 */
export function VirtualizedCardGrid({
  cards,
  collectedCards,
  loadingCards,
  isCollectionMode,
  onCardClick,
  onCardRightClick,
  onToggleCollection,
  columns = 8,
  cardHeight = 200,
  gap = 12,
}: VirtualizedCardGridProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  // Calcular número de filas basado en columnas
  const rowCount = Math.ceil(cards.length / columns)

  // Crear virtualizador para filas
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => cardHeight + gap,
    overscan: 2, // Renderizar 2 filas adicionales fuera de la vista
  })

  // Agrupar cartas por filas
  const rows = useMemo(() => {
    const rows: Card[][] = []
    for (let i = 0; i < rowCount; i++) {
      const start = i * columns
      const end = Math.min(start + columns, cards.length)
      rows.push(cards.slice(start, end))
    }
    return rows
  }, [cards, columns, rowCount])

  return (
    <div
      ref={parentRef}
      className="h-full overflow-auto"
      style={{
        contain: "strict", // Optimización de CSS para mejor rendimiento
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const rowCards = rows[virtualRow.index] || []
          
          return (
            <div
              key={virtualRow.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div
                className="grid gap-3 px-3"
                style={{
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                }}
              >
                {rowCards.map((card) => {
                  const quantity = collectedCards.get(card.id) || 0
                  const maxQuantity = card.banListRE
                  
                  return (
                    <div
                      key={card.id}
                      className="relative group/card"
                      style={{ height: `${cardHeight}px` }}
                    >
                      {/* Aquí iría el CardItemWrapper, pero lo simplificamos por ahora */}
                      <div
                        className="w-full h-full cursor-pointer rounded-2xl overflow-hidden"
                        onClick={() => onCardClick(card)}
                        onContextMenu={(e) => onCardRightClick(e, card)}
                      >
                        {/* Placeholder - se reemplazará con CardItem real */}
                        <div className="w-full h-full bg-muted animate-pulse" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
