"use client"

import { useState, useMemo, useCallback } from "react"
import { CardInfoModal } from "./card-info-modal"
import { CardItem } from "./card-item"
import type { Card, DeckCard, DeckFormat } from "@/lib/deck-builder/types"
import { getAlternativeArtsForCard, getBaseCardId, getAlternativeArtCards, getAllCards } from "@/lib/deck-builder/utils"

interface CardsPanelProps {
  cards: Card[]
  deckCards: DeckCard[]
  onAddCard: (cardId: string) => void
  onRemoveCard: (cardId: string) => void
  onReplaceCard: (oldCardId: string, newCardId: string) => void
  deckFormat: DeckFormat
  cardReplacements: Map<string, string> // Mapa de baseId -> alternativeCardId
}

export function CardsPanel({
  cards,
  deckCards,
  onAddCard,
  onRemoveCard,
  onReplaceCard,
  deckFormat,
  cardReplacements,
}: CardsPanelProps) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const deckCardMap = useMemo(
    () => new Map(deckCards.map((dc) => [dc.cardId, dc.quantity])),
    [deckCards]
  )

  // Crear mapa de cartas alternativas para búsqueda rápida
  const altCardsMap = useMemo(() => {
    const altCards = getAlternativeArtCards()
    return new Map(altCards.map((card) => [card.id, card]))
  }, [])

  // Crear mapa de IDs base para agrupar cartas originales y alternativas
  const baseCardQuantityMap = useMemo(() => {
    const altCardMap = new Map(Array.from(altCardsMap.keys()).map((id) => [id, getBaseCardId(id)]))
    const baseQuantityMap = new Map<string, number>()
    
    for (const deckCard of deckCards) {
      const baseId = altCardMap.get(deckCard.cardId) || getBaseCardId(deckCard.cardId)
      const currentQuantity = baseQuantityMap.get(baseId) || 0
      baseQuantityMap.set(baseId, currentQuantity + deckCard.quantity)
    }
    
    return baseQuantityMap
  }, [deckCards, altCardsMap])

  // Función para obtener la carta a mostrar (original o alternativa si está reemplazada)
  const getCardToDisplay = useCallback((card: Card): Card => {
    const baseId = getBaseCardId(card.id)
    const replacementId = cardReplacements.get(baseId)
    
    if (replacementId) {
      const altCard = altCardsMap.get(replacementId)
      if (altCard) {
        return altCard
      }
    }
    
    return card
  }, [cardReplacements, altCardsMap])

  // Función para obtener el ID de la carta que se debe agregar al hacer clic
  const getCardIdToAdd = useCallback((card: Card): string => {
    const baseId = getBaseCardId(card.id)
    const replacementId = cardReplacements.get(baseId)
    return replacementId || card.id
  }, [cardReplacements])

  const handleCardRightClick = useCallback((e: React.MouseEvent, card: Card) => {
    e.preventDefault()
    // Si la carta mostrada es una alternativa, encontrar la carta original para el modal
    // Esto permite mostrar todas las opciones en el modal
    const allMainCards = getAllCards()
    const baseId = getBaseCardId(card.id)
    const originalCard = allMainCards.find((c) => getBaseCardId(c.id) === baseId) || card
    setSelectedCard(originalCard)
    setIsModalOpen(true)
  }, [])

  const handleCardClick = useCallback((card: Card, displayedCard?: Card) => {
    // Si se pasa displayedCard, usar esa (puede ser alternativa)
    // Si no, usar la carta original
    const cardToCheck = displayedCard || card
    
    // Obtener la carta que realmente se debe agregar (puede ser alternativa si está reemplazada)
    const cardIdToAdd = getCardIdToAdd(card)
    const cardToAdd = altCardsMap.get(cardIdToAdd) || cardToCheck
    
    // Verificar cantidad considerando todas las variantes (original + alternativas)
    const baseId = getBaseCardId(card.id)
    const totalQuantity = baseCardQuantityMap.get(baseId) || 0
    const maxQuantity = deckFormat === "RE" ? cardToAdd.banListRE : deckFormat === "RL" ? cardToAdd.banListRL : cardToAdd.banListLI

    if (totalQuantity < maxQuantity) {
      onAddCard(cardIdToAdd)
    }
  }, [baseCardQuantityMap, onAddCard, deckFormat, getCardIdToAdd, altCardsMap])

  const getCardQuantity = useCallback((cardId: string): number => {
    // Retornar la cantidad total considerando todas las variantes (original + alternativas)
    const baseId = getBaseCardId(cardId)
    return baseCardQuantityMap.get(baseId) || 0
  }, [baseCardQuantityMap])

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
                <h2 className="text-lg font-semibold sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-30 border-b border-border/50">
                  {edition}
                </h2>
                <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 2xl:grid-cols-6 gap-2 sm:gap-3">
                  {editionCards.map((card) => {
                    // Obtener la carta a mostrar (puede ser alternativa si está reemplazada)
                    const cardToDisplay = getCardToDisplay(card)
                    const quantity = getCardQuantity(card.id)
                    const maxQuantity = getMaxQuantity(cardToDisplay)
                    const canAddMore = quantity < maxQuantity

                    return (
                      <CardItem
                        key={card.id}
                        card={cardToDisplay}
                        quantity={quantity}
                        maxQuantity={maxQuantity}
                        canAddMore={canAddMore}
                        onCardClick={() => handleCardClick(card, cardToDisplay)}
                        onCardRightClick={(e) => handleCardRightClick(e, card)}
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
          deckCards={deckCards}
          onAddCard={(cardId) => {
            onAddCard(cardId)
          }}
          onRemoveCard={(cardId) => {
            onRemoveCard(cardId)
          }}
          onReplaceCard={onReplaceCard}
        />
      )}
    </>
  )
}

