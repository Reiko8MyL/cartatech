"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus, Minus, ChevronLeft, ChevronRight, Sword, Users, Coins, Zap, BookOpen } from "lucide-react"
import type { Card, DeckCard } from "@/lib/deck-builder/types"
import { EDITION_LOGOS } from "@/lib/deck-builder/utils"
import { toastSuccess } from "@/lib/toast"
import { optimizeCloudinaryUrl, isCloudinaryOptimized, detectDeviceType } from "@/lib/deck-builder/cloudinary-utils"

interface CardInfoModalProps {
  card: Card | null
  isOpen: boolean
  onClose: () => void
  alternativeArts: Card[]
  quantityInDeck: number
  maxQuantity: number
  deckCards: DeckCard[]
  onAddCard: (cardId: string) => void
  onRemoveCard: (cardId: string) => void
  onReplaceCard: (oldCardId: string, newCardId: string) => void
  filteredCards?: Card[] // Lista de cartas filtradas para navegación
  onCardChange?: (card: Card) => void // Función para cambiar la carta actual
}

export function CardInfoModal({
  card,
  isOpen,
  onClose,
  alternativeArts,
  quantityInDeck,
  maxQuantity,
  deckCards,
  onAddCard,
  onRemoveCard,
  onReplaceCard,
  filteredCards = [],
  onCardChange,
}: CardInfoModalProps) {
  if (!card) return null

  // Determinar si se debe mostrar la sección "En el mazo" (solo si hay deckCards)
  const showDeckSection = deckCards.length > 0

  // Navegación entre cartas filtradas
  const navigateToCard = useMemo(() => {
    if (!filteredCards.length || !onCardChange) return null

    const currentIndex = filteredCards.findIndex((c) => c.id === card.id)
    if (currentIndex === -1) return null

    return {
      currentIndex,
      total: filteredCards.length,
      hasPrevious: currentIndex > 0,
      hasNext: currentIndex < filteredCards.length - 1,
      previousCard: currentIndex > 0 ? filteredCards[currentIndex - 1] : null,
      nextCard: currentIndex < filteredCards.length - 1 ? filteredCards[currentIndex + 1] : null,
    }
  }, [filteredCards, card.id, onCardChange])

  const handlePreviousCard = useCallback(() => {
    if (navigateToCard?.previousCard && onCardChange) {
      onCardChange(navigateToCard.previousCard)
    }
  }, [navigateToCard, onCardChange])

  const handleNextCard = useCallback(() => {
    if (navigateToCard?.nextCard && onCardChange) {
      onCardChange(navigateToCard.nextCard)
    }
  }, [navigateToCard, onCardChange])

  const [displayImage, setDisplayImage] = useState<string>(card.image)
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  // Detectar tipo de dispositivo para optimizar URLs de Cloudinary
  useEffect(() => {
    function updateDeviceType() {
      setDeviceType(detectDeviceType(window.innerWidth))
    }
    updateDeviceType()
    window.addEventListener('resize', updateDeviceType)
    return () => window.removeEventListener('resize', updateDeviceType)
  }, [])

  // Cuando cambia la carta, resetear al arte original
  useEffect(() => {
    setDisplayImage(card.image)
  }, [card.id, card.image])

  // Navegación con teclado (flechas izquierda/derecha)
  useEffect(() => {
    if (!isOpen || !navigateToCard) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && navigateToCard.hasPrevious) {
        e.preventDefault()
        handlePreviousCard()
      } else if (e.key === "ArrowRight" && navigateToCard.hasNext) {
        e.preventDefault()
        handleNextCard()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, navigateToCard, handlePreviousCard, handleNextCard])

  // Encontrar qué carta alternativa está siendo mostrada actualmente
  const selectedAlternativeCard = alternativeArts.find((altCard) => altCard.image === displayImage)
  const isShowingAlternative = selectedAlternativeCard !== undefined && displayImage !== card.image

  // Encontrar qué carta está realmente en el mazo (original o alternativa)
  const cardInDeck = useMemo(() => {
    // Buscar si la carta original está en el mazo
    const originalInDeck = deckCards.find((dc) => dc.cardId === card.id)
    if (originalInDeck && originalInDeck.quantity > 0) {
      return { cardId: card.id, quantity: originalInDeck.quantity }
    }
    // Si no está la original, buscar alternativas
    for (const altCard of alternativeArts) {
      const altInDeck = deckCards.find((dc) => dc.cardId === altCard.id)
      if (altInDeck && altInDeck.quantity > 0) {
        return { cardId: altCard.id, quantity: altInDeck.quantity }
      }
    }
    return null
  }, [deckCards, card.id, alternativeArts])

  // Función para agregar carta (agrega la alternativa si está seleccionada, sino la original)
  const handleAddCard = () => {
    // Calcular total de cartas en el mazo
    const totalCards = deckCards.reduce((sum, dc) => sum + dc.quantity, 0)
    
    // Verificar límite total de 50 cartas
    if (totalCards >= 50) {
      return // No permitir agregar más cartas si ya hay 50
    }
    
    if (isShowingAlternative && selectedAlternativeCard) {
      // Si se está mostrando una alternativa, agregar esa alternativa
      if (cardInDeck && cardInDeck.cardId !== selectedAlternativeCard.id) {
        // Si hay una carta diferente en el mazo (original), reemplazarla primero
        // Esto mantendrá la cantidad y cambiará a la alternativa
        onReplaceCard(cardInDeck.cardId, selectedAlternativeCard.id)
        // Luego agregar una copia adicional de la alternativa
        // Usar un pequeño delay para asegurar que el reemplazo se complete primero
        setTimeout(() => {
          onAddCard(selectedAlternativeCard.id)
        }, 50)
      } else {
        // Si no hay carta o ya es la misma alternativa, agregar normalmente
        onAddCard(selectedAlternativeCard.id)
      }
    } else {
      // Si se está mostrando la original, agregar la original
      onAddCard(card.id)
    }
  }

  // Función para eliminar carta (elimina la que está realmente en el mazo)
  const handleRemoveCard = () => {
    if (!cardInDeck) return
    onRemoveCard(cardInDeck.cardId)
  }

  // Función para reemplazar la carta en el mazo por la alternativa
  const handleReplaceCard = () => {
    if (!selectedAlternativeCard) return
    if (quantityInDeck === 0) {
      toastSuccess("No hay cartas en el mazo para reemplazar")
      return
    }

    // Encontrar qué carta está en el mazo para reemplazarla
    const cardToReplace = cardInDeck?.cardId || card.id
    onReplaceCard(cardToReplace, selectedAlternativeCard.id)
  }

  // Función para reemplazar la carta alternativa por la versión original
  const handleReplaceToOriginal = () => {
    if (!cardInDeck) return
    if (quantityInDeck === 0) {
      toastSuccess("No hay cartas en el mazo para reemplazar")
      return
    }

    // Reemplazar la alternativa por la original
    onReplaceCard(cardInDeck.cardId, card.id)
  }

  // Determinar si la alternativa mostrada está en el mazo
  const isAlternativeInDeck = isShowingAlternative && selectedAlternativeCard && cardInDeck?.cardId === selectedAlternativeCard.id
  
  // Determinar si hay una alternativa en el mazo (aunque se esté mostrando la original)
  const hasAlternativeInDeck = !isShowingAlternative && cardInDeck && cardInDeck.cardId !== card.id && alternativeArts.some(alt => alt.id === cardInDeck.cardId)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto [&]:!animate-none [&[data-state=open]]:!animate-none [&[data-state=closed]]:!animate-none [&]:!transition-none">
        <DialogHeader className="pb-2">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Botón de navegación anterior */}
              {navigateToCard && navigateToCard.hasPrevious && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePreviousCard}
                  className="flex-shrink-0"
                  aria-label="Carta anterior"
                >
                  <ChevronLeft className="size-5" />
                </Button>
              )}
              <DialogTitle className="text-2xl md:text-3xl font-bold tracking-tight flex-1 min-w-0">
                {card.name}
              </DialogTitle>
              {/* Botón de navegación siguiente */}
              {navigateToCard && navigateToCard.hasNext && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextCard}
                  className="flex-shrink-0"
                  aria-label="Carta siguiente"
                >
                  <ChevronRight className="size-5" />
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {navigateToCard && navigateToCard.total > 0 && (
                <span className="text-xs text-muted-foreground">
                  {navigateToCard.currentIndex + 1} / {navigateToCard.total}
                </span>
              )}
              {card.isUnique && (
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs md:text-sm font-semibold">
                  Carta Única
                </span>
              )}
              {card.isRework && (
                <span className="px-3 py-1 bg-orange-500/10 text-orange-500 rounded-full text-xs md:text-sm font-semibold">
                  Rework
                </span>
              )}
            </div>
          </div>
          <DialogDescription className="sr-only">
            Información detallada de la carta {card.name}. {card.type}{card.race ? ` - ${card.race}` : ""}. {card.description || "Sin descripción disponible."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(220px,280px)_minmax(0,1fr)] gap-6 md:gap-8 items-start">
          {/* Columna izquierda: carta principal + controles */}
          <div className="space-y-4 flex flex-col items-center md:items-start">
            <div className="relative aspect-[63/88] w-full max-w-[280px] mx-auto">
              {(() => {
                const optimizedImageUrl = optimizeCloudinaryUrl(displayImage, deviceType)
                const isOptimized = isCloudinaryOptimized(optimizedImageUrl)
                return (
                  <Image
                    src={optimizedImageUrl}
                    alt={card.name}
                    fill
                    className="object-contain rounded-lg"
                    sizes="(max-width: 768px) 70vw, 280px"
                    unoptimized={isOptimized}
                  />
                )
              })()}
            </div>

            {/* Controles de cantidad bajo la carta - solo se muestra si hay deckCards */}
            <div className="flex flex-col gap-2 w-full max-w-[280px]">
              {showDeckSection && (
                <>
                  <div className="flex items-center justify-between gap-3 p-3 bg-muted rounded-lg">
                    <span className="text-xs font-medium">
                      En el mazo:{" "}
                      <span className="font-semibold">
                        {quantityInDeck} / {maxQuantity}
                      </span>
                    </span>
                    <div className="flex items-center gap-2" role="group" aria-label="Cantidad de cartas en el mazo">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleRemoveCard}
                        disabled={quantityInDeck === 0}
                        className="transition-all duration-200 hover:scale-110 active:scale-95 disabled:scale-100 disabled:opacity-50"
                        aria-label={`Quitar una copia de ${card.name}`}
                      >
                        <Minus className="size-4" aria-hidden="true" />
                      </Button>
                      <span className="text-base font-semibold w-8 text-center" aria-live="polite" aria-atomic="true">
                        {quantityInDeck}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleAddCard}
                        disabled={quantityInDeck >= maxQuantity}
                        className="transition-all duration-200 hover:scale-110 active:scale-95 disabled:scale-100 disabled:opacity-50"
                        aria-label={`Agregar una copia de ${card.name}`}
                      >
                        <Plus className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>

                  {/* Botón para volver al arte original si se ha seleccionado uno alternativo */}
                  {displayImage !== card.image && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => setDisplayImage(card.image)}
                      aria-label="Volver al arte original de la carta"
                    >
                      Volver al arte original
                    </Button>
                  )}

                  {/* Botón para usar la versión alternativa en el mazo (solo si NO está ya en el mazo) */}
                  {isShowingAlternative && quantityInDeck > 0 && !isAlternativeInDeck && (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full text-xs"
                      onClick={handleReplaceCard}
                      aria-label={`Usar esta versión de ${selectedAlternativeCard?.name} en el mazo`}
                    >
                      Usar esta versión en el Mazo
                    </Button>
                  )}

                  {/* Botón para usar la versión original en el mazo (cuando hay una alternativa en el mazo) */}
                  {quantityInDeck > 0 && (isAlternativeInDeck || hasAlternativeInDeck) && (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full text-xs"
                      onClick={handleReplaceToOriginal}
                      aria-label="Usar versión original en el mazo"
                    >
                      Usar versión original en el Mazo
                    </Button>
                  )}
                </>
              )}

              {/* Botón para volver al arte original si se ha seleccionado uno alternativo (solo si no hay deckCards) */}
              {!showDeckSection && displayImage !== card.image && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setDisplayImage(card.image)}
                  aria-label="Volver al arte original de la carta"
                >
                  Volver al arte original
                </Button>
              )}
            </div>
          </div>

          {/* Columna derecha: controles, info y arte alternativo */}
          <div className="space-y-6">
            {/* Datos de la carta en layout horizontal */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sword className="size-5 text-primary" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    Tipo
                  </span>
                  <span className="text-base font-semibold">{card.type}</span>
                </div>
              </div>
              {card.race && (
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="size-5 text-primary" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      Raza
                    </span>
                    <span className="text-base font-semibold">{card.race}</span>
                  </div>
                </div>
              )}
              {card.cost !== null && (
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Coins className="size-5 text-primary" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      Coste
                    </span>
                    <span className="text-base font-semibold">{card.cost}</span>
                  </div>
                </div>
              )}
              {card.power !== null && (
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="size-5 text-primary" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      Fuerza
                    </span>
                    <span className="text-base font-semibold">{card.power}</span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 col-span-2">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="size-5 text-primary" />
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Edición
                  </span>
                  <div className="flex items-center gap-3">
                    {EDITION_LOGOS[card.edition] ? (
                      <div className="relative w-28 h-28 sm:w-32 sm:h-32">
                        {(() => {
                          const logoUrl = EDITION_LOGOS[card.edition]
                          const optimizedLogoUrl = optimizeCloudinaryUrl(logoUrl, deviceType)
                          const isOptimized = isCloudinaryOptimized(optimizedLogoUrl)
                          return (
                            <Image
                              src={optimizedLogoUrl}
                              alt={card.edition}
                              fill
                              className="object-contain rounded-full bg-background"
                              sizes="128px"
                              unoptimized={isOptimized}
                            />
                          )
                        })()}
                      </div>
                    ) : (
                      <span className="text-lg font-semibold">{card.edition}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="size-4 text-primary" />
                <h3 className="text-base font-semibold">Habilidad de la carta</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                {card.description}
              </p>
            </div>

            {/* Arte alternativo en fila horizontal */}
            {alternativeArts.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Arte alternativo</h3>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {alternativeArts.map((altCard) => {
                    const optimizedAltImageUrl = optimizeCloudinaryUrl(altCard.image, deviceType)
                    const isAltOptimized = isCloudinaryOptimized(optimizedAltImageUrl)
                    return (
                      <button
                        key={altCard.id}
                        className="relative aspect-[63/88] w-24 sm:w-28 md:w-32 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity duration-200 ease-out"
                        onClick={() => setDisplayImage(altCard.image)}
                        aria-label={`Ver variante de ${altCard.name}`}
                        role="button"
                      >
                        <Image
                          src={optimizedAltImageUrl}
                          alt={`${altCard.name} - Variante`}
                          fill
                          className="object-contain rounded"
                          sizes="128px"
                          unoptimized={isAltOptimized}
                        />
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
