"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { DeckCard, SavedDeck, DeckFormat, Card } from "@/lib/deck-builder/types"
import { DECK_TAGS } from "@/lib/deck-builder/types"
import { useAuth } from "@/contexts/auth-context"
import { toastError } from "@/lib/toast"
import { getAllBackgroundImages } from "@/lib/deck-builder/banner-utils"
import { optimizeCloudinaryUrl, isCloudinaryOptimized, detectDeviceType } from "@/lib/deck-builder/cloudinary-utils"
import { calculateDeckStats } from "@/lib/deck-builder/utils"

interface SaveDeckModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (deck: Omit<SavedDeck, "id" | "createdAt">) => void
  initialName?: string
  deckCards: DeckCard[]
  deckFormat: DeckFormat
  existingDeck?: SavedDeck // Mazo existente si se está editando
  allCards: Card[] // Todas las cartas disponibles para el selector de carta tech
}

export function SaveDeckModal({
  isOpen,
  onClose,
  onSave,
  initialName = "",
  deckCards,
  deckFormat,
  existingDeck,
  allCards,
}: SaveDeckModalProps) {
  const { user } = useAuth()
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  // Pre-llenar campos con datos del mazo existente si se está editando
  const [deckName, setDeckName] = useState(existingDeck?.name || initialName)
  const [description, setDescription] = useState(existingDeck?.description || "")
  const [isPublic, setIsPublic] = useState(existingDeck?.isPublic || false)
  const [tags, setTags] = useState<string[]>(existingDeck?.tags || [])
  const [techCardId, setTechCardId] = useState<string | undefined>(existingDeck?.techCardId)
  const [techCardSelectorOpen, setTechCardSelectorOpen] = useState(false)
  const [backgroundImage, setBackgroundImage] = useState<string | undefined>(existingDeck?.backgroundImage)

  // Detectar tipo de dispositivo para optimizar URLs de Cloudinary
  useEffect(() => {
    function updateDeviceType() {
      setDeviceType(detectDeviceType(window.innerWidth))
    }
    updateDeviceType()
    window.addEventListener('resize', updateDeviceType)
    return () => window.removeEventListener('resize', updateDeviceType)
  }, [])
  
  // Obtener la carta tech seleccionada
  const techCard = useMemo(() => {
    if (!techCardId || allCards.length === 0) return null
    return allCards.find((card) => card.id === techCardId) || null
  }, [techCardId, allCards])

  // Calcular estadísticas del mazo
  const deckStats = useMemo(() => {
    if (deckCards.length === 0 || allCards.length === 0) {
      return {
        totalCards: 0,
        totalCost: 0,
        averageCost: 0,
        cardsByType: {},
        cardsByEdition: {},
        hasOroIni: false,
      }
    }
    return calculateDeckStats(deckCards, allCards)
  }, [deckCards, allCards])

  const totalCards = deckStats.totalCards
  const aliadosCount = deckStats.cardsByType["Aliado"] || 0
  const hasOroIni = deckStats.hasOroIni

  // Obtener todas las cartas únicas del mazo para el selector, ordenadas por tipo y coste
  const deckUniqueCards = useMemo(() => {
    if (allCards.length === 0 || deckCards.length === 0) return []
    const cardMap = new Map(allCards.map((card) => [card.id, card]))
    const uniqueCards: Card[] = []
    const seenIds = new Set<string>()

    for (const deckCard of deckCards) {
      const card = cardMap.get(deckCard.cardId)
      if (card && !seenIds.has(card.id)) {
        uniqueCards.push(card)
        seenIds.add(card.id)
      }
    }

    // Ordenar por tipo primero, luego por coste
    const typeOrder = ["Aliado", "Arma", "Talismán", "Tótem", "Oro"]
    return uniqueCards.sort((a, b) => {
      const typeA = typeOrder.indexOf(a.type)
      const typeB = typeOrder.indexOf(b.type)
      
      if (typeA !== typeB) {
        return typeA - typeB
      }
      
      // Si son del mismo tipo, ordenar por coste
      const costA = a.cost ?? 999
      const costB = b.cost ?? 999
      return costA - costB
    })
  }, [deckCards, allCards])
  
  // Actualizar campos cuando cambia existingDeck o cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      if (existingDeck) {
        setDeckName(existingDeck.name || initialName)
        setDescription(existingDeck.description || "")
        setIsPublic(existingDeck.isPublic || false)
        setTags(existingDeck.tags || [])
        setTechCardId(existingDeck.techCardId)
        setBackgroundImage(existingDeck.backgroundImage)
      } else {
        setDeckName(initialName)
        setDescription("")
        setIsPublic(false)
        setTags([])
        setTechCardId(undefined)
        setBackgroundImage(undefined)
      }
    }
  }, [existingDeck, initialName, isOpen])

  const handleSave = () => {
    if (!deckName.trim()) {
      toastError("Por favor ingresa un nombre para el mazo")
      return
    }

    if (!user) {
      toastError("Debes iniciar sesión para guardar mazos")
      return
    }

    onSave({
      name: deckName.trim(),
      description: description.trim() || undefined,
      cards: deckCards,
      userId: user.id,
      author: user.username,
      isPublic,
      publishedAt: isPublic ? Date.now() : undefined,
      tags: tags.length > 0 ? tags : undefined,
      format: deckFormat,
      techCardId: techCardId || undefined,
      backgroundImage: backgroundImage || undefined,
    })

    // Reset form solo si no se está editando un mazo existente
    if (!existingDeck) {
      setDeckName(initialName)
      setDescription("")
      setIsPublic(false)
      setTags([])
      setTechCardId(undefined)
      setBackgroundImage(undefined)
    }
    onClose()
  }

  const handleSelectTechCard = (cardId: string) => {
    setTechCardId(cardId)
    setTechCardSelectorOpen(false)
  }

  const handleRemoveTechCard = () => {
    setTechCardId(undefined)
  }

  if (!user) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[1000px] lg:max-w-[1100px] max-h-[85vh] sm:max-h-[90vh] overflow-y-auto top-[5%] sm:top-[50%] translate-y-0 sm:translate-y-[-50%]">
        <DialogHeader>
          <DialogTitle>{existingDeck ? "Actualizar Mazo" : "Guardar Mazo"}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {existingDeck 
              ? "Actualiza tu mazo con un nombre, descripción opcional y etiquetas para organizarlo mejor."
              : "Guarda tu mazo con un nombre, descripción opcional y etiquetas para organizarlo mejor."
            }
          </DialogDescription>
        </DialogHeader>
        
        {/* Total de cartas y alertas minimalistas */}
        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b flex-wrap">
          <div className="text-xs sm:text-sm text-muted-foreground">
            Total de cartas: <span className="font-semibold text-foreground">{totalCards}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {totalCards < 50 && (
              <div className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Mazo incompleto ({totalCards}/50)</span>
              </div>
            )}
            {aliadosCount < 16 && (
              <div className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Mínimo de aliados: {aliadosCount}/16</span>
              </div>
            )}
            {!hasOroIni && (
              <div className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Falta Oro Inicial</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 lg:gap-6 py-1 sm:py-2">
          {/* Columna izquierda: Campos principales */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label htmlFor="deck-name" className="text-sm">Nombre del Mazo</Label>
              <Input
                id="deck-name"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                placeholder="Ingresa un nombre para tu mazo"
                className="mt-1.5 sm:mt-2"
                autoFocus
              />
            </div>

            <div>
              <Label htmlFor="deck-description" className="text-sm">Descripción (opcional)</Label>
              <Textarea
                id="deck-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe tu mazo, estrategia, o cualquier información relevante..."
                className="mt-1.5 sm:mt-2"
                rows={3}
                style={{ minHeight: '80px' }}
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-1.5 sm:mb-2 block">Tags del Mazo</Label>
              <div className="grid grid-cols-4 sm:grid-cols-4 gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                {DECK_TAGS.map((tag) => (
                  <div key={tag} className="flex items-center space-x-1.5 sm:space-x-2">
                    <Checkbox
                      id={`tag-${tag}`}
                      checked={tags.includes(tag)}
                      onCheckedChange={() => {
                        setTags((prev) => {
                          if (prev.includes(tag)) {
                            return prev.filter((t) => t !== tag)
                          } else {
                            return [...prev, tag]
                          }
                        })
                      }}
                    />
                    <Label
                      htmlFor={`tag-${tag}`}
                      className="text-xs sm:text-sm font-normal leading-none cursor-pointer"
                    >
                      {tag}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-public"
                checked={isPublic}
                onCheckedChange={(checked) => setIsPublic(checked === true)}
                className="mt-0.5"
              />
              <div className="space-y-0.5 sm:space-y-1">
                <Label
                  htmlFor="is-public"
                  className="text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Publicar en la comunidad
                </Label>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Al publicar, tu mazo será visible para todos los usuarios en "Mazos de la Comunidad"
                </p>
              </div>
            </div>

            {/* Selector de Banner */}
            <div>
              <Label className="text-sm font-medium mb-1.5 sm:mb-2 block">Imagen de Fondo del Banner (opcional)</Label>
              <Select
                value={backgroundImage || "default"}
                onValueChange={(value) => setBackgroundImage(value === "default" ? undefined : value)}
              >
                <SelectTrigger className="mt-1.5 sm:mt-2">
                  <SelectValue placeholder="Selecciona una imagen de fondo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Por defecto (según raza)</SelectItem>
                  {getAllBackgroundImages().map((img) => (
                    <SelectItem key={img.id} value={img.url}>
                      {img.race}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {backgroundImage && (
                <div className="mt-2 relative w-full h-32 rounded-lg overflow-hidden border">
                  <Image
                    src={backgroundImage}
                    alt="Banner preview"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 800px"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha: Carta Tech */}
          <div className="space-y-3 sm:space-y-4 lg:space-y-3">
            {/* Selector de Carta Tech */}
            <div>
              <Label className="text-sm font-medium mb-1.5 sm:mb-2 block">La Carta Tech (opcional)</Label>
              {techCard ? (
                <div className="flex flex-col gap-2 mt-1.5 sm:mt-2 p-2 border rounded-lg bg-muted/50">
                  <div className="relative w-40 h-56 lg:w-48 lg:h-[268px] mx-auto rounded overflow-hidden">
                    {(() => {
                      const optimizedImageUrl = optimizeCloudinaryUrl(techCard.image, deviceType)
                      const isOptimized = isCloudinaryOptimized(optimizedImageUrl)
                      return (
                        <Image
                          src={optimizedImageUrl}
                          alt={techCard.name}
                          fill
                          className="object-contain"
                          sizes="(max-width: 1024px) 160px, 192px"
                          unoptimized={isOptimized}
                        />
                      )
                    })()}
                  </div>
                  <div className="flex-1 min-w-0 text-center">
                    <p className="text-xs font-semibold line-clamp-2">{techCard.name}</p>
                    <p className="text-[10px] text-muted-foreground">{techCard.type}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveTechCard}
                    className="w-full h-7 text-xs"
                  >
                    Eliminar carta tech
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTechCardSelectorOpen(true)}
                  className="w-full mt-1.5 sm:mt-2 text-xs sm:text-sm h-9 sm:h-10"
                  disabled={deckUniqueCards.length === 0}
                >
                  {deckUniqueCards.length === 0 ? "Agrega cartas al mazo primero" : "Seleccionar La Carta Tech"}
                </Button>
              )}
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="text-xs sm:text-sm h-8 sm:h-9">
            Cancelar
          </Button>
          <Button onClick={handleSave} className="text-xs sm:text-sm h-8 sm:h-9">
            {existingDeck ? "Actualizar" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Modal para seleccionar carta tech */}
      <Dialog open={techCardSelectorOpen} onOpenChange={setTechCardSelectorOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Seleccionar La Carta Tech</DialogTitle>
            <DialogDescription>
              Selecciona una carta de tu mazo para destacarla como "La Carta Tech"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-6">
              {(() => {
                // Agrupar cartas por tipo
                const cardsByType = new Map<string, Card[]>()
                for (const card of deckUniqueCards) {
                  if (!cardsByType.has(card.type)) {
                    cardsByType.set(card.type, [])
                  }
                  cardsByType.get(card.type)!.push(card)
                }

                const typeOrder = ["Aliado", "Arma", "Talismán", "Tótem", "Oro"]
                return typeOrder.map((type) => {
                  const typeCards = cardsByType.get(type)
                  if (!typeCards || typeCards.length === 0) return null

                  return (
                    <div key={type}>
                      <h3 className="text-sm font-semibold mb-3">{type}</h3>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                        {typeCards.map((card) => {
                          const isSelected = techCardId === card.id
                          return (
                            <button
                              key={card.id}
                              type="button"
                              onClick={() => handleSelectTechCard(card.id)}
                              className={`relative aspect-[63/88] rounded-lg overflow-hidden border-2 transition-all ${
                                isSelected
                                  ? "border-primary shadow-lg scale-105"
                                  : "border-border hover:border-primary/50 hover:scale-105"
                              }`}
                            >
                              {(() => {
                                const optimizedImageUrl = optimizeCloudinaryUrl(card.image, deviceType)
                                const isOptimized = isCloudinaryOptimized(optimizedImageUrl)
                                return (
                                  <Image
                                    src={optimizedImageUrl}
                                    alt={card.name}
                                    fill
                                    className="object-contain p-1"
                                    sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
                                    unoptimized={isOptimized}
                                  />
                                )
                              })()}
                              {isSelected && (
                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                    ✓
                                  </div>
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTechCardSelectorOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}

