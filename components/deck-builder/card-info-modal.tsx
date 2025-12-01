"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus, Minus } from "lucide-react"
import type { Card } from "@/lib/deck-builder/types"
import { EDITION_LOGOS } from "@/lib/deck-builder/utils"

interface CardInfoModalProps {
  card: Card | null
  isOpen: boolean
  onClose: () => void
  alternativeArts: Card[]
  quantityInDeck: number
  maxQuantity: number
  onAddCard: () => void
  onRemoveCard: () => void
}

export function CardInfoModal({
  card,
  isOpen,
  onClose,
  alternativeArts,
  quantityInDeck,
  maxQuantity,
  onAddCard,
  onRemoveCard,
}: CardInfoModalProps) {
  if (!card) return null

  const [displayImage, setDisplayImage] = useState<string>(card.image)

  // Cuando cambia la carta, resetear al arte original
  useEffect(() => {
    setDisplayImage(card.image)
  }, [card.id, card.image])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto [&]:!animate-none [&[data-state=open]]:!animate-none [&[data-state=closed]]:!animate-none [&]:!transition-none">
        <DialogHeader className="pb-2">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <DialogTitle className="text-2xl md:text-3xl font-bold tracking-tight">
              {card.name}
            </DialogTitle>
            <div className="flex flex-wrap gap-2">
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
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(220px,280px)_minmax(0,1fr)] gap-6 md:gap-8 items-start">
          {/* Columna izquierda: carta principal + controles */}
          <div className="space-y-4 flex flex-col items-center md:items-start">
            <div className="relative aspect-[63/88] w-full max-w-[280px] mx-auto">
              <Image
                src={displayImage}
                alt={card.name}
                fill
                className="object-contain rounded-lg"
                sizes="(max-width: 768px) 70vw, 280px"
              />
            </div>

            {/* Controles de cantidad bajo la carta */}
            <div className="flex flex-col gap-2 w-full max-w-[280px]">
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
                    onClick={onRemoveCard}
                    disabled={quantityInDeck === 0}
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
                    onClick={onAddCard}
                    disabled={quantityInDeck >= maxQuantity}
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
            </div>
          </div>

          {/* Columna derecha: controles, info y arte alternativo */}
          <div className="space-y-5">
            {/* Datos de la carta en layout horizontal */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Tipo
                </span>
                <span>{card.type}</span>
              </div>
              {card.race && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Raza
                  </span>
                  <span>{card.race}</span>
                </div>
              )}
              {card.cost !== null && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Coste
                  </span>
                  <span>{card.cost}</span>
                </div>
              )}
              {card.power !== null && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Fuerza
                  </span>
                  <span>{card.power}</span>
                </div>
              )}
              <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Edición
                </span>
                <div className="flex items-center gap-2">
                  {EDITION_LOGOS[card.edition] ? (
                    <div className="relative w-20 h-20">
                      <Image
                        src={EDITION_LOGOS[card.edition]}
                        alt={card.edition}
                        fill
                        className="object-contain rounded-full bg-background"
                        sizes="80px"
                      />
                    </div>
                  ) : (
                    <span>{card.edition}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div className="pt-1">
              <h3 className="text-sm font-semibold mb-1.5">Texto de la carta</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {card.description}
              </p>
            </div>

            {/* Arte alternativo en fila horizontal */}
            {alternativeArts.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Arte alternativo</h3>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {alternativeArts.map((altCard) => (
                    <button
                      key={altCard.id}
                      className="relative aspect-[63/88] w-24 sm:w-28 md:w-32 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity duration-200 ease-out"
                      onClick={() => setDisplayImage(altCard.image)}
                      aria-label={`Ver variante de ${altCard.name}`}
                      role="button"
                    >
                      <Image
                        src={altCard.image}
                        alt={`${altCard.name} - Variante`}
                        fill
                        className="object-contain rounded"
                        sizes="128px"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

