"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import type { Card } from "@/lib/deck-builder/types"
import { optimizeCloudinaryUrl } from "@/lib/deck-builder/cloudinary-utils"
import { AvatarCard } from "@/components/ui/avatar-card"

interface AvatarCardSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (cardId: string) => void
  allCards: Card[]
  currentCardId: string | null
  onEdit?: (cardId: string) => void // Callback para editar avatar después de seleccionar
}

export function AvatarCardSelector({
  isOpen,
  onClose,
  onSelect,
  allCards,
  currentCardId,
  onEdit,
}: AvatarCardSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")

  // Filtrar cartas por búsqueda (solo cartas principales, no alternativas)
  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) {
      return allCards.filter((card) => !card.isCosmetic)
    }

    const query = searchQuery.toLowerCase().trim()
    return allCards.filter(
      (card) =>
        !card.isCosmetic &&
        (card.name.toLowerCase().includes(query) ||
          card.id.toLowerCase().includes(query) ||
          card.race?.toLowerCase().includes(query) ||
          card.type.toLowerCase().includes(query))
    )
  }, [allCards, searchQuery])

  const handleSelectCard = (cardId: string) => {
    if (onEdit) {
      // Si hay callback de edición, abrir editor en lugar de cerrar
      onEdit(cardId)
    } else {
      // Si no hay editor, solo seleccionar y cerrar
      onSelect(cardId)
      onClose()
      setSearchQuery("")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Seleccionar Carta como Avatar</DialogTitle>
          <DialogDescription>
            Elige una carta de la base de datos para usarla como tu foto de perfil. Se mostrará un extracto circular de la carta.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Barra de búsqueda */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nombre, ID, raza o tipo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Grid de cartas */}
          <div className="flex-1 overflow-y-auto">
            {filteredCards.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No se encontraron cartas que coincidan con tu búsqueda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 p-1">
                {filteredCards.map((card) => {
                  const optimizedImageUrl = optimizeCloudinaryUrl(card.image, 'desktop')
                  const isSelected = card.id === currentCardId

                  return (
                    <button
                      key={card.id}
                      onClick={() => handleSelectCard(card.id)}
                      className={`relative aspect-[63/88] rounded-lg overflow-hidden border-2 transition-all hover:scale-105 hover:shadow-lg ${
                        isSelected
                          ? "border-primary ring-2 ring-primary ring-offset-2"
                          : "border-border hover:border-primary/50"
                      }`}
                      title={card.name}
                    >
                      <Image
                        src={optimizedImageUrl}
                        alt={card.name}
                        fill
                        className="object-contain p-1"
                        sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
                        loading="lazy"
                        unoptimized={optimizedImageUrl.includes('res.cloudinary.com')}
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="bg-primary text-primary-foreground rounded-full p-1">
                            <X className="h-4 w-4" />
                          </div>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Información */}
          <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
            <p>
              {filteredCards.length} {filteredCards.length === 1 ? "carta encontrada" : "cartas encontradas"}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

