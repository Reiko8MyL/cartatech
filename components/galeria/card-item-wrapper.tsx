"use client"

import { memo } from "react"
import { CardItem } from "@/components/deck-builder/card-item"
import type { Card } from "@/lib/deck-builder/types"

// Componente memoizado para cada carta - reduce re-renders
export const CardItemWrapper = memo(function CardItemWrapper({
  card,
  isCollected,
  maxQuantity,
  hasPriority,
  isCollectionMode,
  loadingCards,
  onCardClick,
  onCardRightClick,
  onToggleCollection,
}: {
  card: Card
  isCollected: boolean
  maxQuantity: number
  hasPriority: boolean
  isCollectionMode: boolean
  loadingCards: Set<string>
  onCardClick: (card: Card) => void
  onCardRightClick: (e: React.MouseEvent, card: Card) => void
  onToggleCollection: (cardId: string) => void
}) {
  return (
    <div className="relative group/card">
      <div className="w-full">
        <CardItem
          card={card}
          quantity={0}
          maxQuantity={maxQuantity}
          canAddMore={true}
          onCardClick={onCardClick}
          onCardRightClick={onCardRightClick}
          priority={hasPriority}
          showBanListIndicator={false}
        />
      </div>
      {/* Toggle de colección - visible cuando está en modo colección */}
      {isCollectionMode && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleCollection(card.id)
          }}
          disabled={loadingCards.has(card.id)}
          className={`absolute top-1 left-1/2 -translate-x-1/2 z-30 size-6 rounded-full border-2 transition-all duration-200 flex items-center justify-center shadow-lg ${
            isCollected
              ? "bg-green-500 border-background hover:bg-green-600"
              : "bg-background/80 border-border hover:bg-background"
          } ${loadingCards.has(card.id) ? "opacity-50 cursor-not-allowed animate-pulse" : ""}`}
          aria-label={
            isCollected
              ? "Marcar como no tengo"
              : "Marcar como la tengo"
          }
          title={
            isCollected
              ? "Marcar como no tengo"
              : "Marcar como la tengo"
          }
        >
          {isCollected && (
            <svg
              className="size-3 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
          {!isCollected && (
            <svg
              className="size-3 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          )}
        </button>
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  // Comparación optimizada para evitar re-renders innecesarios
  const prevLoading = prevProps.loadingCards.has(prevProps.card.id)
  const nextLoading = nextProps.loadingCards.has(nextProps.card.id)
  
  return (
    prevProps.card.id === nextProps.card.id &&
    prevProps.isCollected === nextProps.isCollected &&
    prevProps.maxQuantity === nextProps.maxQuantity &&
    prevProps.hasPriority === nextProps.hasPriority &&
    prevProps.isCollectionMode === nextProps.isCollectionMode &&
    prevLoading === nextLoading
  )
})
