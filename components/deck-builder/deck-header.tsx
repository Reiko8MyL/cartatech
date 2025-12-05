"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Edit2, Check, X, Lock, ArrowRight } from "lucide-react"
import type { SavedDeck, DeckFormat } from "@/lib/deck-builder/types"
import type { Card as CardType } from "@/lib/deck-builder/types"
import { getDeckRace, getDeckBackgroundImage } from "@/lib/deck-builder/utils"

interface DeckHeaderProps {
  deckName: string
  onDeckNameChange: (name: string) => void
  deckFormat: DeckFormat
  onDeckFormatChange: (format: DeckFormat) => void
  currentDeck?: SavedDeck | null
  allCards: CardType[]
  onDragStart?: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => void
  isMobile?: boolean
}

export function DeckHeader({
  deckName,
  onDeckNameChange,
  deckFormat,
  onDeckFormatChange,
  currentDeck,
  allCards,
  onDragStart,
  isMobile = false,
}: DeckHeaderProps) {
  const router = useRouter()
  const [isEditingName, setIsEditingName] = useState(false)
  const [tempName, setTempName] = useState(deckName)

  const handleSaveName = () => {
    if (tempName.trim()) {
      onDeckNameChange(tempName.trim())
    }
    setIsEditingName(false)
  }

  const handleCancelEdit = () => {
    setTempName(deckName)
    setIsEditingName(false)
  }

  return (
    <div className="p-2 sm:p-3 lg:p-4 border-b space-y-3">
      {/* Panel de mazo activo - solo se muestra cuando se está editando un mazo existente */}
      {currentDeck && currentDeck.id && (() => {
        const race = getDeckRace(currentDeck.cards, allCards)
        const backgroundImage = getDeckBackgroundImage(race)
        
        return (
          <div
            className={`relative rounded-lg overflow-hidden ${isMobile && onDragStart ? 'cursor-grab active:cursor-grabbing touch-none select-none' : ''}`}
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              ...(isMobile && onDragStart ? { touchAction: 'none' } : {}),
            }}
            onMouseDown={isMobile && onDragStart ? onDragStart : undefined}
            onTouchStart={isMobile && onDragStart ? onDragStart : undefined}
            onTouchMove={isMobile && onDragStart ? (e) => e.preventDefault() : undefined}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="relative p-2 sm:p-3">
              {/* Tag Público en la esquina superior derecha */}
              {currentDeck.isPublic && (
                <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5 bg-blue-500/30 backdrop-blur-sm text-white text-xs rounded">
                  Público
                </div>
              )}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-white/90">
                  <div className="size-2 rounded-full bg-blue-400 animate-pulse" />
                  <span>Mazo en edición</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-1">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{currentDeck.name}</p>
                </div>
                {/* Botón para ir a la página del mazo */}
                <div className="ml-2 mt-0.5">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => router.push(`/mazo/${currentDeck.id}`)}
                    className="h-5 px-1 text-[10px] font-medium bg-white/30 hover:bg-white/50 text-white shadow-md backdrop-blur-sm rounded-full border border-white/20"
                  >
                    <span className="hidden sm:inline">Página del Mazo</span>
                    <span className="sm:hidden">Página</span>
                    <ArrowRight className="size-2.5 ml-0.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
      
      <div className="flex items-center gap-2">
        {isEditingName && !currentDeck?.id ? (
          <>
            <Input
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="flex-1"
              autoFocus
            />
            <Button size="icon" variant="ghost" onClick={handleSaveName}>
              <Check className="size-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={handleCancelEdit}>
              <X className="size-4" />
            </Button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold flex-1 truncate">
              {deckName || "Mazo sin nombre"}
            </h2>
            {!currentDeck?.id && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setTempName(deckName)
                  setIsEditingName(true)
                }}
                title="Editar nombre del mazo"
              >
                <Edit2 className="size-4" />
              </Button>
            )}
            {currentDeck?.id && (
              <Button
                size="icon"
                variant="ghost"
                disabled
                title="El nombre del mazo se edita desde el modal de guardar"
                className="cursor-not-allowed"
              >
                <Lock className="size-4 text-muted-foreground" />
              </Button>
            )}
          </>
        )}
      </div>
      
      {/* Selector de formato */}
      <div className="space-y-1 sm:space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">Formato</label>
          {currentDeck?.id && (
            <Lock className="size-2.5 sm:size-3 text-muted-foreground" />
          )}
        </div>
        <ToggleGroup
          type="single"
          value={deckFormat}
          onValueChange={(value) => {
            if (!currentDeck?.id && value) {
              onDeckFormatChange(value as DeckFormat)
            }
          }}
          className="w-full"
          variant="outline"
          spacing={0}
          disabled={!!currentDeck?.id}
        >
          <ToggleGroupItem 
            value="RE" 
            className="flex-1 rounded-r-none text-[10px] sm:text-sm py-1.5 sm:py-2"
            disabled={!!currentDeck?.id}
          >
            <span className="hidden sm:inline">Racial Edición</span>
            <span className="sm:hidden">RE</span>
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="RL" 
            className="flex-1 rounded-none border-x text-[10px] sm:text-sm py-1.5 sm:py-2"
            disabled={!!currentDeck?.id}
          >
            <span className="hidden sm:inline">Racial Libre</span>
            <span className="sm:hidden">RL</span>
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="LI" 
            className="flex-1 rounded-l-none text-[10px] sm:text-sm py-1.5 sm:py-2"
            disabled={!!currentDeck?.id}
          >
            <span className="hidden sm:inline">Formato Libre</span>
            <span className="sm:hidden">LI</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  )
}

