"use client"

import { useRef, useMemo, useState, useEffect } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import Image from "next/image"
import type { Card } from "@/lib/deck-builder/types"
import { CardItemWrapper } from "@/components/galeria/card-item-wrapper"
import { EDITION_LOGOS } from "@/lib/deck-builder/utils"

interface EditionSection {
  edition: string
  cards: Card[]
  startIndex: number
  endIndex: number
}

interface VirtualizedEditionGridProps {
  cardsByEdition: Map<string, Card[]>
  editionOrder: string[]
  collectedCards: Map<string, number>
  loadingCards: Set<string>
  isCollectionMode: boolean
  onCardClick: (card: Card) => void
  onCardRightClick: (e: React.MouseEvent, card: Card) => void
  onToggleCollection: (cardId: string) => void
  onIncrementQuantity: (cardId: string) => void
  onDecrementQuantity: (cardId: string) => void
  columns?: number
  cardHeight?: number
  gap?: number
  headerHeight?: number
}

/**
 * Componente de grid virtualizado que maneja múltiples secciones (ediciones)
 * Renderiza solo las cartas visibles para mejorar significativamente el rendimiento
 */
export function VirtualizedEditionGrid({
  cardsByEdition,
  editionOrder,
  collectedCards,
  loadingCards,
  isCollectionMode,
  onCardClick,
  onCardRightClick,
  onToggleCollection,
  onIncrementQuantity,
  onDecrementQuantity,
  columns = 8,
  cardHeight = 200,
  gap = 12,
  headerHeight = 80,
}: VirtualizedEditionGridProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  // Crear secciones con índices para virtualización
  const sections = useMemo(() => {
    const sections: EditionSection[] = []
    let currentIndex = 0

    for (const edition of editionOrder) {
      const cards = cardsByEdition.get(edition) || []
      if (cards.length === 0) continue

      const rows = Math.ceil(cards.length / columns)
      const sectionHeight = headerHeight + (rows * (cardHeight + gap))

      sections.push({
        edition,
        cards,
        startIndex: currentIndex,
        endIndex: currentIndex + rows + 1, // +1 para el header
      })

      currentIndex += rows + 1
    }

    return sections
  }, [cardsByEdition, editionOrder, columns, cardHeight, gap, headerHeight])

  // Aplanar todas las filas para virtualización
  const allRows = useMemo(() => {
    const rows: Array<{ type: "header" | "cards"; edition?: string; cards?: Card[]; sectionIndex?: number }> = []

    sections.forEach((section, sectionIndex) => {
      // Agregar header
      rows.push({
        type: "header",
        edition: section.edition,
        sectionIndex,
      })

      // Agregar filas de cartas
      const cardRows = Math.ceil(section.cards.length / columns)
      for (let i = 0; i < cardRows; i++) {
        const start = i * columns
        const end = Math.min(start + columns, section.cards.length)
        rows.push({
          type: "cards",
          cards: section.cards.slice(start, end),
          sectionIndex,
        })
      }
    })

    return rows
  }, [sections, columns])

  // Crear virtualizador
  const rowVirtualizer = useVirtualizer({
    count: allRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const row = allRows[index]
      if (row.type === "header") {
        return headerHeight
      }
      return cardHeight + gap
    },
    overscan: 3, // Renderizar 3 filas adicionales fuera de la vista
  })

  return (
    <div
      ref={parentRef}
      className="h-full w-full overflow-auto"
      style={{
        contain: "strict",
        minHeight: "600px",
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
          const row = allRows[virtualRow.index]
          if (!row) return null

          if (row.type === "header") {
            const edition = row.edition!
            const section = sections[row.sectionIndex!]
            
            return (
              <div
                key={`header-${edition}`}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b pb-3 px-3 sm:px-4 lg:px-6">
                  <div className="flex items-center gap-3">
                    {EDITION_LOGOS[edition] && (
                      <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                        <Image
                          src={EDITION_LOGOS[edition]}
                          alt={edition}
                          fill
                          className="object-contain"
                          sizes="(max-width: 640px) 40px, 48px"
                        />
                      </div>
                    )}
                    <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
                      {edition}
                      <span className="text-sm font-normal text-muted-foreground">
                        ({section.cards.length})
                      </span>
                    </h2>
                  </div>
                </div>
              </div>
            )
          }

          // Renderizar fila de cartas
          const cards = row.cards!
          const sectionIndex = row.sectionIndex!
          const section = sections[sectionIndex]
          const isFirstEdition = sectionIndex === 0
          const cardIndexInSection = (virtualRow.index - section.startIndex - 1) * columns
          const priorityCount = 2

          return (
            <div
              key={`row-${sectionIndex}-${virtualRow.index}`}
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
                className="grid gap-2 sm:gap-2.5 lg:gap-3 px-3 sm:px-4 lg:px-6"
                style={{
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                }}
              >
                {cards.map((card, cardIndex) => {
                  const quantity = collectedCards.get(card.id) || 0
                  const maxQuantity = card.banListRE
                  const globalCardIndex = cardIndexInSection + cardIndex
                  const hasPriority = isFirstEdition && globalCardIndex < priorityCount

                  return (
                    <CardItemWrapper
                      key={card.id}
                      card={card}
                      quantity={quantity}
                      maxQuantity={maxQuantity}
                      hasPriority={hasPriority}
                      isCollectionMode={isCollectionMode}
                      loadingCards={loadingCards}
                      onCardClick={onCardClick}
                      onCardRightClick={onCardRightClick}
                      onToggleCollection={onToggleCollection}
                      onIncrementQuantity={onIncrementQuantity}
                      onDecrementQuantity={onDecrementQuantity}
                    />
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
