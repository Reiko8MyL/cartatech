"use client"

import { useState, useMemo, useCallback } from "react"
import { CardInfoModal } from "./card-info-modal"
import { CardItem } from "./card-item"
import type { Card, DeckCard, DeckFormat } from "@/lib/deck-builder/types"
import { getAlternativeArtsForCard } from "@/lib/deck-builder/utils"

interface CardsPanelProps {
  cards: Card[]
  deckCards: DeckCard[]
  onAddCard: (cardId: string) => void
  onRemoveCard: (cardId: string) => void
  deckFormat: DeckFormat
}

export function CardsPanel({
  cards,
  deckCards,
  onAddCard,
  onRemoveCard,
  deckFormat,
}: CardsPanelProps) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const deckCardMap = useMemo(
    () => new Map(deckCards.map((dc) => [dc.cardId, dc.quantity])),
    [deckCards]
  )

  const handleCardRightClick = useCallback((e: React.MouseEvent, card: Card) => {
    e.preventDefault()
    setSelectedCard(card)
    setIsModalOpen(true)
  }, [])

  const handleCardClick = useCallback((card: Card) => {
    const quantity = deckCardMap.get(card.id) || 0
    const maxQuantity = deckFormat === "RE" ? card.banListRE : deckFormat === "RL" ? card.banListRL : card.banListLI

    if (quantity < maxQuantity) {
      onAddCard(card.id)
    }
  }, [deckCardMap, onAddCard, deckFormat])

  const getCardQuantity = useCallback((cardId: string): number => {
    return deckCardMap.get(cardId) || 0
  }, [deckCardMap])

  const getMaxQuantity = useCallback((card: Card): number => {
    return deckFormat === "RE" ? card.banListRE : deckFormat === "RL" ? card.banListRL : card.banListLI
  }, [deckFormat])

  // Agrupar cartas por edición - memoizado
  const cardsByEdition = useMemo(() => {
    const map = new Map<string, Card[]>()
    for (const card of cards) {
      if (!map.has(card.edition)) {
        map.set(card.edition, [])
      }
      map.get(card.edition)!.push(card)
    }
    return map
  }, [cards])

  const editionOrder = [
    "Espada Sagrada",
    "Helénica",
    "Hijos de Daana",
    "Dominios de Ra",
    "Drácula",
  ]

  return (
    <>
      <div className="h-full overflow-y-auto">
        <div className="space-y-4 sm:space-y-6 p-2 sm:p-3 lg:p-4">
          {editionOrder.map((edition) => {
            const editionCards = cardsByEdition.get(edition)
            if (!editionCards || editionCards.length === 0) return null

            return (
              <div key={edition} className="space-y-3">
                <h2 className="text-lg font-semibold sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
                  {edition}
                </h2>
                <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 2xl:grid-cols-6 gap-2 sm:gap-3">
                  {editionCards.map((card) => {
                    const quantity = getCardQuantity(card.id)
                    const maxQuantity = getMaxQuantity(card)
                    const canAddMore = quantity < maxQuantity

                    return (
                      <CardItem
                        key={card.id}
                        card={card}
                        quantity={quantity}
                        maxQuantity={maxQuantity}
                        canAddMore={canAddMore}
                        onCardClick={handleCardClick}
                        onCardRightClick={handleCardRightClick}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal de información de carta */}
      {selectedCard && (
        <CardInfoModal
          card={selectedCard}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          alternativeArts={getAlternativeArtsForCard(selectedCard.id)}
          quantityInDeck={getCardQuantity(selectedCard.id)}
          maxQuantity={getMaxQuantity(selectedCard)}
          onAddCard={() => {
            onAddCard(selectedCard.id)
          }}
          onRemoveCard={() => {
            onRemoveCard(selectedCard.id)
          }}
        />
      )}
    </>
  )
}

