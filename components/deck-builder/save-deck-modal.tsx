"use client"

import { useState } from "react"
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
import type { DeckCard, SavedDeck, DeckFormat } from "@/lib/deck-builder/types"
import { DECK_TAGS } from "@/lib/deck-builder/types"
import { useAuth } from "@/contexts/auth-context"
import { toastError } from "@/lib/toast"

interface SaveDeckModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (deck: Omit<SavedDeck, "id" | "createdAt">) => void
  initialName?: string
  deckCards: DeckCard[]
  deckFormat: DeckFormat
}

export function SaveDeckModal({
  isOpen,
  onClose,
  onSave,
  initialName = "",
  deckCards,
  deckFormat,
}: SaveDeckModalProps) {
  const { user } = useAuth()
  const [deckName, setDeckName] = useState(initialName)
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [tags, setTags] = useState<string[]>([])

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
    })

    // Reset form
    setDeckName(initialName)
    setDescription("")
    setIsPublic(false)
    setTags([])
    onClose()
  }

  if (!user) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Guardar Mazo</DialogTitle>
          <DialogDescription>
            Guarda tu mazo con un nombre, descripción opcional y etiquetas para organizarlo mejor.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="deck-name">Nombre del Mazo</Label>
            <Input
              id="deck-name"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="Ingresa un nombre para tu mazo"
              className="mt-2"
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="deck-description">Descripción (opcional)</Label>
            <Textarea
              id="deck-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe tu mazo, estrategia, o cualquier información relevante..."
              className="mt-2"
              rows={4}
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Tags del Mazo</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {DECK_TAGS.map((tag) => (
                <div key={tag} className="flex items-center space-x-2">
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
                    className="text-sm font-normal leading-none cursor-pointer"
                  >
                    {tag}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="is-public"
              checked={isPublic}
              onCheckedChange={(checked) => setIsPublic(checked === true)}
            />
            <div className="space-y-1">
              <Label
                htmlFor="is-public"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Publicar en la comunidad
              </Label>
              <p className="text-xs text-muted-foreground">
                Al publicar, tu mazo será visible para todos los usuarios en "Mazos de la Comunidad"
              </p>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Total de cartas: {deckCards.reduce((sum, dc) => sum + dc.quantity, 0)}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

