"use client"

import { Button } from "@/components/ui/button"
import { Plus, Minus } from "lucide-react"
import type { DeckCard, Card, DeckFormat } from "@/lib/deck-builder/types"
import { getCardBackgroundPositionY } from "@/lib/deck-builder/utils"
import { getBaseCardId } from "@/lib/deck-builder/utils"
import { optimizeCloudinaryUrl } from "@/lib/deck-builder/cloudinary-utils"
import { useDeviceType } from "@/hooks/use-banner-settings"

interface CardsByTypeGroup {
  type: string
  typeCards: DeckCard[]
  typeTotal: number
}

interface DeckCardsListProps {
  cardsByTypeGrouped: CardsByTypeGroup[]
  cardMap: Map<string, Card>
  baseCardQuantityMap: Map<string, number>
  cardMetadataMap: Record<string, number>
  deckFormat: DeckFormat
  stats: { totalCards: number }
  onAddCard: (cardId: string) => void
  onRemoveCard: (cardId: string) => void
  isMobile?: boolean
  panelHeight?: number
  minHeight?: number
}

export function DeckCardsList({
  cardsByTypeGrouped,
  cardMap,
  baseCardQuantityMap,
  cardMetadataMap,
  deckFormat,
  stats,
  onAddCard,
  onRemoveCard,
  isMobile = false,
  panelHeight = 200,
  minHeight = 120,
}: DeckCardsListProps) {
  const deviceType = useDeviceType()

  if (cardsByTypeGrouped.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No hay cartas en el mazo
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {/* Agrupar cartas por tipo */}
      {cardsByTypeGrouped.map((group) => {
        if (!group) return null
        const { type, typeCards, typeTotal } = group

        return (
          <div key={type} className="space-y-2">
            <h4 className="text-sm font-bold text-foreground">
              {type} ({typeTotal})
            </h4>
            <div className="space-y-1.5">
              {typeCards.map((deckCard: DeckCard) => {
                const card = cardMap.get(deckCard.cardId)
                if (!card) return null

                return (
                  <div
                    key={deckCard.cardId}
                    className="flex items-center rounded-lg overflow-hidden border border-border/50"
                  >
                    {/* Controles de cantidad */}
                    <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-2.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 rounded-full bg-background/80 hover:bg-background text-foreground"
                        onClick={() => {
                          onRemoveCard(deckCard.cardId)
                        }}
                        disabled={deckCard.quantity === 0}
                      >
                        <Minus className="size-3" />
                      </Button>
                      <span className="text-sm font-semibold text-foreground min-w-[1.5rem] text-center">
                        {deckCard.quantity}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 rounded-full bg-background/80 hover:bg-background text-foreground"
                        onClick={() => {
                          onAddCard(deckCard.cardId)
                        }}
                        disabled={(() => {
                          // Verificar límite total de 50 cartas
                          if (stats.totalCards >= 50) return true
                          
                          // Verificar cantidad total considerando todas las variantes
                          const baseId = getBaseCardId(deckCard.cardId)
                          const totalQuantity = baseCardQuantityMap.get(baseId) || 0
                          const maxQuantity = deckFormat === "RE" ? card.banListRE : deckFormat === "RL" ? card.banListRL : card.banListLI
                          return totalQuantity >= maxQuantity
                        })()}
                      >
                        <Plus className="size-3" />
                      </Button>
                    </div>

                    {/* Nombre de la carta con imagen de fondo */}
                    <div className="flex-1 relative h-12 flex items-center px-3 overflow-hidden">
                      {/* Imagen de fondo recortada - parte del medio de la carta */}
                      <div className="absolute inset-0 overflow-hidden">
                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundImage: `url(${optimizeCloudinaryUrl(card.image, deviceType)})`,
                            backgroundPosition: `center ${getCardBackgroundPositionY(card, cardMetadataMap)}`,
                            backgroundSize: "135% auto",
                            backgroundRepeat: "no-repeat",
                            clipPath: "inset(5% 0% 5% 0%)",
                            transform: "scaleX(1)",
                            transformOrigin: "left center",
                          }}
                        />
                      </div>
                      {/* Overlay oscuro para mejor legibilidad del texto */}
                      <div className="absolute inset-0 bg-black/40 z-0" />
                      {/* Nombre de la carta */}
                      <span className="relative text-lg font-semibold text-white z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        {card.name}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

