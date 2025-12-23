"use client"

import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DeckFormat } from "@/lib/deck-builder/types"
import { getDeckFormatName } from "@/lib/deck-builder/utils"

const FORMATS: DeckFormat[] = ["RE", "RL", "LI"]

interface FavoriteFormatSelectorProps {
  favoriteFormat: DeckFormat | null
  onChange: (format: DeckFormat | null) => void
}

export function FavoriteFormatSelector({
  favoriteFormat,
  onChange,
}: FavoriteFormatSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>Formato Favorito</Label>
      <div className="flex gap-2 flex-wrap">
        {FORMATS.map((format) => {
          const isSelected = favoriteFormat === format
          return (
            <Button
              key={format}
              type="button"
              variant={isSelected ? "default" : "outline"}
              onClick={() => onChange(isSelected ? null : format)}
              className={cn(
                "flex items-center gap-2",
                isSelected && "bg-primary text-primary-foreground"
              )}
            >
              {isSelected && <Check className="h-4 w-4" />}
              {getDeckFormatName(format)}
            </Button>
          )
        })}
      </div>
      {favoriteFormat && (
        <p className="text-sm text-muted-foreground">
          Formato seleccionado: {getDeckFormatName(favoriteFormat)}
        </p>
      )}
    </div>
  )
}
