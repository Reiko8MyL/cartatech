"use client"

import { Button } from "@/components/ui/button"
import {
  Save,
  Trash2,
  Download,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { SavedDeck } from "@/lib/deck-builder/types"

interface DeckActionsBarProps {
  currentDeck?: SavedDeck | null
  user: { id: string } | null
  onSave: () => void
  onLoad: () => void
  onClear: () => void
  onExportImage: () => void
}

export function DeckActionsBar({
  currentDeck,
  user,
  onSave,
  onLoad,
  onClear,
  onExportImage,
}: DeckActionsBarProps) {
  return (
    <div className="p-2 sm:p-3 lg:p-2 border-b">
      <div className="flex flex-row gap-1 overflow-x-auto lg:grid lg:grid-cols-2 lg:gap-1.5 lg:overflow-visible">
        {/* Fila 1: Guardar Cambios - Borrar */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onSave}
          aria-label={currentDeck?.id ? "Guardar cambios en el mazo" : "Guardar mazo"}
          className={cn(
            "flex-shrink-0 text-[10px] px-1.5 h-7 gap-0.5 lg:text-xs lg:px-2 lg:h-7 lg:gap-1 lg:w-full transition-all duration-200 hover:bg-accent/80 active:scale-[0.97]",
            currentDeck?.id && "hover:ring-2 hover:ring-primary/20"
          )}
        >
          <Save className="size-3 lg:size-3.5" />
          <span className="hidden lg:inline">
            {currentDeck?.id ? "Guardar Cambios" : "Guardar"}
          </span>
          <span className="lg:hidden">
            {currentDeck?.id ? "Cambios" : "Guardar"}
          </span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          aria-label="Borrar todas las cartas del mazo"
          className="flex-shrink-0 text-[10px] px-1.5 h-7 gap-0.5 text-destructive lg:text-xs lg:px-2 lg:h-7 lg:gap-1 lg:w-full transition-all duration-200 hover:bg-destructive/10 hover:ring-2 hover:ring-destructive/20 active:bg-destructive/20 active:scale-[0.97]"
        >
          <Trash2 className="size-3 lg:size-3.5" />
          <span className="hidden lg:inline">Borrar</span>
          <span className="lg:hidden">Borrar</span>
        </Button>
        {/* Fila 2: Cargar - Exportar Deck */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onLoad}
          disabled={!user}
          aria-label={!user ? "Cargar mazo (requiere iniciar sesión)" : "Cargar mazo guardado"}
          title={!user ? "Debes iniciar sesión para cargar mazos" : ""}
          className="flex-shrink-0 text-[10px] px-1.5 h-7 gap-0.5 lg:text-xs lg:px-2 lg:h-7 lg:gap-1 lg:w-full transition-all duration-200 hover:bg-accent/80 active:scale-[0.97]"
        >
          <Loader2 className="size-3 lg:size-3.5" />
          <span className="hidden lg:inline">Cargar</span>
          <span className="lg:hidden">Cargar</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onExportImage}
          aria-label="Exportar mazo"
          className="flex-shrink-0 text-[10px] px-1.5 h-7 gap-0.5 lg:text-xs lg:px-2 lg:h-7 lg:gap-1 lg:w-full transition-all duration-200 hover:bg-accent/80 active:scale-[0.97]"
        >
          <Download className="size-3 lg:size-3.5" />
          <span className="hidden lg:inline">Exportar Deck</span>
          <span className="lg:hidden">Exp. Deck</span>
        </Button>
      </div>
    </div>
  )
}

