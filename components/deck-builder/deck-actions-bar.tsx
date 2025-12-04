"use client"

import { Button } from "@/components/ui/button"
import {
  Copy,
  Save,
  Trash2,
  Download,
  FileText,
  Check,
  Loader2,
} from "lucide-react"
import type { SavedDeck } from "@/lib/deck-builder/types"

interface DeckActionsBarProps {
  copied: boolean
  currentDeck?: SavedDeck | null
  user: { id: string } | null
  onCopyCode: () => void
  onSave: () => void
  onLoad: () => void
  onClear: () => void
  onExportImage: () => void
  onExportList: () => void
}

export function DeckActionsBar({
  copied,
  currentDeck,
  user,
  onCopyCode,
  onSave,
  onLoad,
  onClear,
  onExportImage,
  onExportList,
}: DeckActionsBarProps) {
  return (
    <div className="p-2 sm:p-3 lg:p-4 border-b space-y-2">
      <div className="flex flex-row gap-1 overflow-x-auto lg:grid lg:grid-cols-2 lg:gap-2 lg:overflow-visible">
        <Button
          variant="outline"
          size="sm"
          onClick={onCopyCode}
          className="lg:w-full flex-shrink-0 text-[10px] px-1.5 h-7 gap-0.5 lg:text-sm lg:px-3 lg:h-8 lg:gap-1.5"
        >
          {copied ? (
            <>
              <Check className="size-3 lg:size-4" />
              <span className="hidden lg:inline">Copiado</span>
            </>
          ) : (
            <>
              <Copy className="size-3 lg:size-4" />
              <span className="hidden lg:inline">Código TTS</span>
              <span className="lg:hidden">TTS</span>
            </>
          )}
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onSave}
          className="flex-shrink-0 text-[10px] px-1.5 h-7 gap-0.5 lg:text-sm lg:px-3 lg:h-8 lg:gap-1.5"
        >
          <Save className="size-3 lg:size-4" />
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
          onClick={onLoad}
          disabled={!user}
          title={!user ? "Debes iniciar sesión para cargar mazos" : ""}
          className="flex-shrink-0 text-[10px] px-1.5 h-7 gap-0.5 lg:text-sm lg:px-3 lg:h-8 lg:gap-1.5"
        >
          <Loader2 className="size-3 lg:size-4" />
          <span className="hidden lg:inline">Cargar</span>
          <span className="lg:hidden">Cargar</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          className="flex-shrink-0 text-[10px] px-1.5 h-7 gap-0.5 text-destructive lg:text-sm lg:px-3 lg:h-8 lg:gap-1.5"
        >
          <Trash2 className="size-3 lg:size-4" />
          <span className="hidden lg:inline">Borrar</span>
          <span className="lg:hidden">Borrar</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onExportImage}
          className="flex-shrink-0 text-[10px] px-1.5 h-7 gap-0.5 lg:text-sm lg:px-3 lg:h-8 lg:gap-1.5"
        >
          <Download className="size-3 lg:size-4" />
          <span className="hidden lg:inline">Exportar imagen</span>
          <span className="lg:hidden">Exp. Img</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onExportList}
          className="flex-shrink-0 text-[10px] px-1.5 h-7 gap-0.5 lg:text-sm lg:px-3 lg:h-8 lg:gap-1.5"
        >
          <FileText className="size-3 lg:size-4" />
          <span className="hidden lg:inline">Exportar lista</span>
          <span className="lg:hidden">Exp. List</span>
        </Button>
      </div>
    </div>
  )
}

