"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Minus, GripVertical } from "lucide-react"
import type { DeckCard, Card, DeckFormat } from "@/lib/deck-builder/types"
import { getCardBackgroundPositionY } from "@/lib/deck-builder/utils"
import { getBaseCardId } from "@/lib/deck-builder/utils"
import { optimizeCloudinaryUrl } from "@/lib/deck-builder/cloudinary-utils"
import { useDeviceType } from "@/hooks/use-banner-settings"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

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
  onReorderCards?: (startIndex: number, endIndex: number) => void
  isMobile?: boolean
  panelHeight?: number
  minHeight?: number
}

// Componente para cada carta sortable
function SortableCardItem({
  deckCard,
  card,
  baseCardQuantityMap,
  cardMetadataMap,
  deckFormat,
  stats,
  onAddCard,
  onRemoveCard,
  deviceType,
}: {
  deckCard: DeckCard
  card: Card
  baseCardQuantityMap: Map<string, number>
  cardMetadataMap: Record<string, number>
  deckFormat: DeckFormat
  stats: { totalCards: number }
  onAddCard: (cardId: string) => void
  onRemoveCard: (cardId: string) => void
  deviceType: "mobile" | "tablet" | "desktop"
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deckCard.cardId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center rounded-lg overflow-hidden border border-border/50 ${isDragging ? "ring-2 ring-primary" : ""}`}
    >
      {/* Handle de arrastre */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-center px-2 py-2.5 bg-muted/50 cursor-grab active:cursor-grabbing hover:bg-muted/70 transition-colors"
        title="Arrastrar para reordenar"
      >
        <GripVertical className="size-4 text-muted-foreground" />
      </div>

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
  onReorderCards,
  isMobile = false,
  panelHeight = 200,
  minHeight = 120,
}: DeckCardsListProps) {
  const deviceType = useDeviceType()

  // Sensores para drag & drop (solo si está habilitado)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Requiere 8px de movimiento antes de activar
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Crear mapa de cardId -> índice global en el array original
  // Necesitamos esto para calcular los índices correctos al reordenar
  const globalIndexMap = useMemo(() => {
    const map = new Map<string, number>()
    let globalIndex = 0
    
    // Recorrer todos los grupos y sus cartas para crear el mapa
    for (const group of cardsByTypeGrouped) {
      for (const deckCard of group.typeCards) {
        map.set(deckCard.cardId, globalIndex)
        globalIndex++
      }
    }
    
    return map
  }, [cardsByTypeGrouped])

  // Manejar el final del drag & drop dentro de un grupo
  const handleDragEnd = (event: DragEndEvent, groupType: string) => {
    if (!onReorderCards) return

    const { active, over } = event
    if (!over || active.id === over.id) return

    // Encontrar el grupo actual
    const currentGroup = cardsByTypeGrouped.find((g) => g.type === groupType)
    if (!currentGroup) return

    // Encontrar índices dentro del grupo
    const oldIndex = currentGroup.typeCards.findIndex((dc) => dc.cardId === active.id)
    const newIndex = currentGroup.typeCards.findIndex((dc) => dc.cardId === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    // Calcular índices globales
    // Primero, encontrar el índice global del primer elemento del grupo
    let groupStartIndex = 0
    for (const group of cardsByTypeGrouped) {
      if (group.type === groupType) break
      groupStartIndex += group.typeCards.length
    }

    const globalOldIndex = groupStartIndex + oldIndex
    const globalNewIndex = groupStartIndex + newIndex

    // Llamar a la función de reordenamiento con índices globales
    onReorderCards(globalOldIndex, globalNewIndex)
  }

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

        // Solo habilitar drag & drop si hay más de una carta en el grupo
        const canDrag = typeCards.length > 1 && !!onReorderCards

        return (
          <div key={type} className="space-y-2">
            <h4 className="text-sm font-bold text-foreground">
              {type} ({typeTotal})
            </h4>
            {canDrag ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => handleDragEnd(event, type)}
              >
                <SortableContext
                  items={typeCards.map((dc) => dc.cardId)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1.5">
                    {typeCards.map((deckCard: DeckCard) => {
                      const card = cardMap.get(deckCard.cardId)
                      if (!card) return null

                      return (
                        <SortableCardItem
                          key={deckCard.cardId}
                          deckCard={deckCard}
                          card={card}
                          baseCardQuantityMap={baseCardQuantityMap}
                          cardMetadataMap={cardMetadataMap}
                          deckFormat={deckFormat}
                          stats={stats}
                          onAddCard={onAddCard}
                          onRemoveCard={onRemoveCard}
                          deviceType={deviceType}
                        />
                      )
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
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
            )}
          </div>
        )
      })}
    </div>
  )
}
