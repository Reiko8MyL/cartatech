"use client"

import { memo } from "react"
import { CardItem } from "@/components/deck-builder/card-item"
import { Plus, Minus } from "lucide-react"
import type { Card } from "@/lib/deck-builder/types"

// Componente memoizado para cada carta - reduce re-renders
export const CardItemWrapper = memo(function CardItemWrapper({
  card,
  quantity,
  maxQuantity,
  hasPriority,
  isCollectionMode,
  loadingCards,
  onCardClick,
  onCardRightClick,
  onToggleCollection,
  onIncrementQuantity,
  onDecrementQuantity,
}: {
  card: Card
  quantity: number
  maxQuantity: number
  hasPriority: boolean
  isCollectionMode: boolean
  loadingCards: Set<string>
  onCardClick: (card: Card) => void
  onCardRightClick: (e: React.MouseEvent, card: Card) => void
  onToggleCollection: (cardId: string) => void
  onIncrementQuantity: (cardId: string) => void
  onDecrementQuantity: (cardId: string) => void
}) {
  const isCollected = quantity > 0
  const isLoading = loadingCards.has(card.id)

  return (
    <div className="relative group/card">
      <div className={`w-full transition-opacity duration-200 ${isCollected && isCollectionMode ? "opacity-60" : "opacity-100"}`}>
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
      {/* Controles de colección - visible cuando está en modo colección */}
      {isCollectionMode && (
        <>
          {/* Botón toggle cuando quantity === 0 */}
          {!isCollected && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleCollection(card.id)
              }}
              disabled={isLoading}
              className={`absolute top-1 left-1/2 -translate-x-1/2 z-30 size-6 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg bg-background/80 hover:bg-background ${
                isLoading ? "opacity-50 cursor-not-allowed animate-pulse" : ""
              }`}
              aria-label="Marcar como la tengo"
              title="Marcar como la tengo"
            >
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
            </button>
          )}
          
          {/* Controles de cantidad cuando quantity > 0 */}
          {isCollected && (
            <>
              {/* Contador - en la parte superior, no bloquea clics */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                <div className="bg-green-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full shadow-lg min-w-[1.5rem] text-center">
                  {quantity}
                </div>
              </div>
              
              {/* Botones de incremento/decremento - centrados en la carta, solo capturan clics en su área */}
              <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                <div className="bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center gap-0 overflow-hidden shadow-lg pointer-events-auto">
                  {/* Botón de decremento */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDecrementQuantity(card.id)
                    }}
                    disabled={isLoading || quantity <= 0}
                    className="flex items-center justify-center p-1.5 hover:bg-gray-200 active:bg-gray-300 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`Quitar una copia de ${card.name}`}
                  >
                    <Minus className="size-3.5 text-gray-800" />
                  </button>
                  
                  {/* Separador vertical */}
                  <div className="w-px h-6 bg-gray-300" />
                  
                  {/* Botón de incremento - sin restricciones en modo colección */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onIncrementQuantity(card.id)
                    }}
                    disabled={isLoading}
                    className="flex items-center justify-center p-1.5 hover:bg-gray-200 active:bg-gray-300 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`Agregar una copia de ${card.name}`}
                  >
                    <Plus className="size-3.5 text-gray-800" />
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  // Comparación optimizada para evitar re-renders innecesarios
  const prevLoading = prevProps.loadingCards.has(prevProps.card.id)
  const nextLoading = nextProps.loadingCards.has(nextProps.card.id)
  
  return (
    prevProps.card.id === nextProps.card.id &&
    prevProps.quantity === nextProps.quantity &&
    prevProps.maxQuantity === nextProps.maxQuantity &&
    prevProps.hasPriority === nextProps.hasPriority &&
    prevProps.isCollectionMode === nextProps.isCollectionMode &&
    prevLoading === nextLoading
  )
})
