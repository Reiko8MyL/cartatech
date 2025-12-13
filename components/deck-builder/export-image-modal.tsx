"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Download, Loader2 } from "lucide-react"
import type { DeckCard, DeckStats, Card } from "@/lib/deck-builder/types"
import { generateHorizontalImage, generateVerticalImage } from "@/lib/deck-builder/export-image-utils"
import { toastSuccess } from "@/lib/toast"

interface ExportImageModalProps {
  isOpen: boolean
  onClose: () => void
  deckName: string
  deckCards: DeckCard[]
  stats: DeckStats
  allCards: Card[]
  cardMap: Map<string, Card>
  currentDeckId?: string
}

export function ExportImageModal({
  isOpen,
  onClose,
  deckName,
  deckCards,
  stats,
  allCards,
  cardMap,
  currentDeckId,
}: ExportImageModalProps) {
  const [exportType, setExportType] = useState<"horizontal" | "vertical">("horizontal")
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)

  // Generar vista previa cuando se abre el modal o cambia el tipo
  useEffect(() => {
    if (!isOpen) return

    let cancelled = false
    setIsGeneratingPreview(true)
    setPreviewImageUrl(null)

    const generatePreview = async () => {
      const imageUrl = exportType === "horizontal" 
        ? await generateHorizontalImage(deckName, deckCards, stats, allCards, cardMap)
        : await generateVerticalImage(deckName, deckCards, stats, allCards, cardMap)
      
      if (!cancelled) {
        setPreviewImageUrl(imageUrl)
        setIsGeneratingPreview(false)
      }
    }

    generatePreview()

    return () => {
      cancelled = true
    }
  }, [isOpen, exportType, deckName, deckCards, stats, allCards, cardMap])

  // Descargar imagen
  async function handleDownloadImage() {
    if (!previewImageUrl) return

    const link = document.createElement("a")
    link.href = previewImageUrl
    link.download = `${deckName || "mazo"}-${exportType}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Tracking de analytics
    if (currentDeckId) {
      const { trackDeckExported } = await import("@/lib/analytics/events")
      trackDeckExported(currentDeckId, "image")
    }
    
    toastSuccess("Imagen del mazo exportada correctamente")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Exportar Imagen del Mazo</DialogTitle>
          <DialogDescription>
            Personaliza y descarga la imagen de tu mazo
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Selector de tipo */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Formato de imagen</label>
            <ToggleGroup
              type="single"
              value={exportType}
              onValueChange={(value) => {
                if (value === "horizontal" || value === "vertical") {
                  setExportType(value)
                }
              }}
              className="w-full"
            >
              <ToggleGroupItem value="horizontal" className="flex-1">
                Horizontal (1920x1080)
              </ToggleGroupItem>
              <ToggleGroupItem value="vertical" className="flex-1">
                Vertical (1080x1080) - Instagram
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Vista previa */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Vista previa</label>
            <div className="border rounded-lg p-4 bg-muted/50 flex items-center justify-center min-h-[400px]">
              {isGeneratingPreview ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Generando vista previa...</span>
                </div>
              ) : previewImageUrl ? (
                <div className="relative w-full flex items-center justify-center">
                  <img
                    src={previewImageUrl}
                    alt="Vista previa del mazo"
                    className="max-w-full max-h-[500px] rounded-lg shadow-lg"
                    style={{
                      maxHeight: exportType === "vertical" ? "500px" : "400px",
                    }}
                  />
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center">
                  No se pudo generar la vista previa
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleDownloadImage}
            disabled={!previewImageUrl || isGeneratingPreview}
          >
            <Download className="size-4 mr-2" />
            Descargar Imagen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

