"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { CardInfoModal } from "./card-info-modal"
import { CardItem } from "./card-item"
import type { Card, DeckCard, DeckFormat } from "@/lib/deck-builder/types"
import { getBaseCardId } from "@/lib/deck-builder/utils"
import { useCards } from "@/hooks/use-cards"

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
  const [isMobile, setIsMobile] = useState(false)
  const hoverTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  
  // Detectar si estamos en móvil/tablet
  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Cargar cartas alternativas desde la API con cache (solo cuando se necesiten)
  const { cards: allCardsWithAlternatives } = useCards(true) // Incluir alternativas
  
  // Filtrar solo cartas originales (no alternativas) de las cartas recibidas
  const originalCards = useMemo(() => {
    return cards.filter((card) => !card.isCosmetic)
  }, [cards])

  // Crear mapa de cartas alternativas para búsqueda rápida (desde la BD)
  const altCardsMap = useMemo(() => {
    const altCards = allCardsWithAlternatives.filter((card) => card.isCosmetic)
    return new Map(altCards.map((card) => [card.id, card]))
  }, [allCardsWithAlternatives])

  const deckCardMap = useMemo(
    () => new Map(deckCards.map((dc) => [dc.cardId, dc.quantity])),
    [deckCards]
  )

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
    const baseId = getBaseCardId(card.id)
    // Buscar la carta original en las cartas recibidas (que ya están filtradas a originales)
    const originalCard = originalCards.find((c) => getBaseCardId(c.id) === baseId) || card
    setSelectedCard(originalCard)
    setIsModalOpen(true)
  }, [originalCards])

  // Handler para hover en móvil/tablet
  const handleCardHover = useCallback((card: Card) => {
    if (!isMobile) return // Solo en móvil/tablet
    
    // Limpiar timeout anterior para esta carta si existe
    const baseId = getBaseCardId(card.id)
    const existingTimeout = hoverTimeoutRef.current.get(baseId)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }
    
    // Abrir modal después de 800ms de hover
    const timeout = setTimeout(() => {
      const baseId = getBaseCardId(card.id)
      const originalCard = originalCards.find((c) => getBaseCardId(c.id) === baseId) || card
      setSelectedCard(originalCard)
      setIsModalOpen(true)
      hoverTimeoutRef.current.delete(baseId)
    }, 800)
    
    hoverTimeoutRef.current.set(baseId, timeout)
  }, [isMobile, originalCards])

  // Handler para cuando se sale del hover
  const handleCardHoverEnd = useCallback((card: Card) => {
    if (!isMobile) return
    
    const baseId = getBaseCardId(card.id)
    const timeout = hoverTimeoutRef.current.get(baseId)
    if (timeout) {
      clearTimeout(timeout)
      hoverTimeoutRef.current.delete(baseId)
    }
  }, [isMobile])

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      hoverTimeoutRef.current.forEach((timeout) => clearTimeout(timeout))
      hoverTimeoutRef.current.clear()
    }
  }, [])

  const handleCardClick = useCallback((card: Card, displayedCard?: Card) => {
    // Si se pasa displayedCard, usar esa (puede ser alternativa)
    // Si no, usar la carta original
    const cardToCheck = displayedCard || card
    
    // Calcular total de cartas en el mazo
    const totalCards = deckCards.reduce((sum, dc) => sum + dc.quantity, 0)
    
    // Verificar límite total de 50 cartas
    if (totalCards >= 50) {
      return // No permitir agregar más cartas si ya hay 50
    }
    
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
  }, [baseCardQuantityMap, onAddCard, deckFormat, getCardIdToAdd, altCardsMap, deckCards])

  const getCardQuantity = useCallback((cardId: string): number => {
    // Retornar la cantidad total considerando todas las variantes (original + alternativas)
    const baseId = getBaseCardId(cardId)
    return baseCardQuantityMap.get(baseId) || 0
  }, [baseCardQuantityMap])

  const getMaxQuantity = useCallback((card: Card): number => {
    return deckFormat === "RE" ? card.banListRE : deckFormat === "RL" ? card.banListRL : card.banListLI
  }, [deckFormat])

  // Agrupar cartas por edición - memoizado (solo cartas originales)
  const cardsByEdition = useMemo(() => {
    const map = new Map<string, Card[]>()
    for (const card of originalCards) {
      if (!map.has(card.edition)) {
        map.set(card.edition, [])
      }
      map.get(card.edition)!.push(card)
    }
    return map
  }, [originalCards])

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
                    
                    // Calcular total de cartas en el mazo
                    const totalCards = deckCards.reduce((sum, dc) => sum + dc.quantity, 0)
                    
                    // Verificar si se puede agregar más: debe cumplir límite individual Y límite total de 50
                    const canAddMore = quantity < maxQuantity && totalCards < 50

                    return (
                      <CardItem
                        key={card.id}
                        card={cardToDisplay}
                        quantity={quantity}
                        maxQuantity={maxQuantity}
                        canAddMore={canAddMore}
                        onCardClick={() => handleCardClick(card, cardToDisplay)}
                        onCardRightClick={(e) => handleCardRightClick(e, card)}
                        onCardHover={isMobile ? () => handleCardHover(card) : undefined}
                        onCardHoverEnd={isMobile ? () => handleCardHoverEnd(card) : undefined}
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
      {selectedCard && (() => {
        // Obtener cartas alternativas desde el cache (ya cargado con useCards)
        const baseId = getBaseCardId(selectedCard.id)
        const alternativeArts = allCardsWithAlternatives.filter(
          (card) => card.isCosmetic && getBaseCardId(card.id) === baseId
        )
        
        return (
          <CardInfoModal
            card={selectedCard}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            alternativeArts={alternativeArts}
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
        )
      })()}
    </>
  )
}

