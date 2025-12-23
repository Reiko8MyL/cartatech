"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import { RACES } from "@/lib/deck-builder/types"

interface FavoriteRacesSelectorProps {
  favoriteRaces: string[]
  onChange: (races: string[]) => void
}

const MAX_RACES = 3

export function FavoriteRacesSelector({
  favoriteRaces,
  onChange,
}: FavoriteRacesSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const availableRaces = RACES.filter((race) => !favoriteRaces.includes(race))
  const filteredRaces = availableRaces.filter((race) =>
    race.toLowerCase().includes(search.toLowerCase())
  )

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-race-selector]')) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const handleToggleRace = (race: string) => {
    if (favoriteRaces.includes(race)) {
      // Remover raza
      onChange(favoriteRaces.filter((r) => r !== race))
    } else {
      // Agregar raza (si no se ha alcanzado el máximo)
      if (favoriteRaces.length < MAX_RACES) {
        onChange([...favoriteRaces, race])
      }
    }
  }

  const handleRemoveRace = (race: string) => {
    onChange(favoriteRaces.filter((r) => r !== race))
  }

  return (
    <div className="space-y-2">
      <Label>
        Razas Favoritas {favoriteRaces.length > 0 && `(${favoriteRaces.length}/${MAX_RACES})`}
      </Label>
      
      {/* Razas seleccionadas */}
      {favoriteRaces.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {favoriteRaces.map((race) => (
            <Badge key={race} variant="secondary" className="px-3 py-1">
              {race}
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 h-auto p-0 hover:bg-transparent"
                onClick={() => handleRemoveRace(race)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Selector de razas */}
      {favoriteRaces.length < MAX_RACES && (
        <div className="relative" data-race-selector>
          <Input
            type="text"
            placeholder="Buscar raza..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
          />
          {open && filteredRaces.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredRaces.map((race) => (
                <button
                  key={race}
                  type="button"
                  className="w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground"
                  onClick={() => {
                    handleToggleRace(race)
                    setSearch("")
                    if (favoriteRaces.length + 1 >= MAX_RACES) {
                      setOpen(false)
                    }
                  }}
                >
                  {race}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {favoriteRaces.length >= MAX_RACES && (
        <p className="text-sm text-muted-foreground">
          Has alcanzado el máximo de {MAX_RACES} razas favoritas.
        </p>
      )}
    </div>
  )
}
