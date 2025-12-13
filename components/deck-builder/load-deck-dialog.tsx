"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Loader2, Globe, Lock, Calendar, Trash2 } from "lucide-react"
import Image from "next/image"
import type { SavedDeck, Card } from "@/lib/deck-builder/types"
import { getDeckEditionLogo, getPrioritizedDeckTags } from "@/lib/deck-builder/utils"
import { useBannerSettings, getBannerStyle, getOverlayStyle, useDeviceType } from "@/hooks/use-banner-settings"
import { optimizeCloudinaryUrl, isCloudinaryOptimized } from "@/lib/deck-builder/cloudinary-utils"

interface DeckWithMetadata extends SavedDeck {
  race?: string
  edition?: string
  backgroundImage?: string
  stats?: any
  cardCount?: number
  formattedDate?: string
}

interface LoadDeckDialogProps {
  isOpen: boolean
  onClose: () => void
  decks: DeckWithMetadata[]
  isLoading: boolean
  allCards: Card[]
  onLoadDeck: (deck: SavedDeck) => void
  onDeleteDeck: (deckId: string) => void
}

export function LoadDeckDialog({
  isOpen,
  onClose,
  decks,
  isLoading,
  allCards,
  onLoadDeck,
  onDeleteDeck,
}: LoadDeckDialogProps) {
  const deviceType = useDeviceType()
  const { setting: bannerSetting } = useBannerSettings("deck-builder", "grid", deviceType)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Mazos guardados</DialogTitle>
          <DialogDescription>
            Selecciona un mazo guardado para cargarlo en el constructor.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Cargando mazos...</span>
            </div>
          ) : decks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay mazos guardados
            </p>
          ) : (
            decks.map((deck) => (
              <div
                key={deck.id}
                className="group relative border rounded-lg overflow-hidden bg-card hover:border-primary/50 transition-colors"
              >
                {/* Imagen de fondo */}
                <div
                  className="relative overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20"
                  style={getBannerStyle(deck.backgroundImage, bannerSetting, deviceType, "grid")}
                >
                  <div className="absolute inset-0" style={getOverlayStyle(bannerSetting)} />
                  
                  {/* Logo de edición */}
                  {(() => {
                    const logoUrl = getDeckEditionLogo(deck.cards, allCards)
                    if (!logoUrl) return null
                    const optimizedLogoUrl = optimizeCloudinaryUrl(logoUrl, deviceType)
                    const isOptimized = isCloudinaryOptimized(optimizedLogoUrl)
                    return (
                      <div className="absolute top-1.5 right-1.5 z-10">
                        <div className="relative w-12 h-12" title={deck.edition || "Múltiples ediciones"}>
                          <Image
                            src={optimizedLogoUrl}
                            alt={deck.edition || "Múltiples ediciones"}
                            fill
                            className="object-contain drop-shadow-lg"
                            sizes="48px"
                            unoptimized={isOptimized}
                          />
                        </div>
                      </div>
                    )
                  })()}

                  {/* Información del mazo en la parte inferior */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 z-10">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-base line-clamp-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                          {deck.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          {deck.isPublic ? (
                            <div className="flex items-center gap-1 text-white/90 text-xs" title="Público">
                              <Globe className="h-3 w-3" />
                              <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Público</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-white/80 text-xs" title="Privado">
                              <Lock className="h-3 w-3" />
                              <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Privado</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contenido del mazo */}
                <div className="p-3 space-y-2">
                  {/* Tags y raza */}
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {deck.race && (
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-xs font-medium">
                        {deck.race}
                      </span>
                    )}
                    {getPrioritizedDeckTags(deck.tags).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-secondary/50 text-secondary-foreground rounded-md text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Descripción */}
                  {deck.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {deck.description}
                    </p>
                  )}

                  {/* Fecha de creación */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{deck.formattedDate}</span>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => onLoadDeck(deck)}
                      className="flex-1"
                    >
                      <Loader2 className="size-4 mr-2" />
                      Cargar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deck.id && onDeleteDeck(deck.id)}
                      className="px-3"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

