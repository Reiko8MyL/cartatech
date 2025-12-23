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
import { Label } from "@/components/ui/label"
import { Download, Loader2, FileText, Image as ImageIcon, Code } from "lucide-react"
import type { DeckCard, DeckStats, Card, DeckFormat } from "@/lib/deck-builder/types"
import { generateHorizontalImage, generateVerticalImage } from "@/lib/deck-builder/export-image-utils"
import { generateDeckCode } from "@/lib/deck-builder/utils"
import { toastSuccess, toastError } from "@/lib/toast"

interface ExportDeckModalProps {
  isOpen: boolean
  onClose: () => void
  deckName: string
  deckCards: DeckCard[]
  stats: DeckStats
  allCards: Card[]
  cardMap: Map<string, Card>
  deckFormat: DeckFormat
  description?: string
  tags?: string[]
  techCardId?: string
  backgroundImage?: string
  currentDeckId?: string
}

type ExportFormat = "image" | "list" | "tts"

export function ExportDeckModal({
  isOpen,
  onClose,
  deckName,
  deckCards,
  stats,
  allCards,
  cardMap,
  deckFormat,
  description,
  tags,
  techCardId,
  backgroundImage,
  currentDeckId,
}: ExportDeckModalProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>("image")
  const [imageType, setImageType] = useState<"horizontal" | "vertical">("horizontal")
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Generar vista previa cuando se abre el modal o cambia el tipo (solo para imágenes)
  useEffect(() => {
    if (!isOpen || exportFormat !== "image") {
      setPreviewImageUrl(null)
      return
    }

    let cancelled = false
    setIsGeneratingPreview(true)
    setPreviewImageUrl(null)

    const generatePreview = async () => {
      const imageUrl = imageType === "horizontal" 
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
  }, [isOpen, exportFormat, imageType, deckName, deckCards, stats, allCards, cardMap])

  // Descargar exportación
  async function handleExport() {
    setIsExporting(true)
    
    try {
      // Tracking de analytics (no bloqueante)
      if (currentDeckId) {
        import("@/lib/analytics/events").then(({ trackDeckExported }) => {
          trackDeckExported(currentDeckId, exportFormat)
        }).catch(() => {
          // Silenciar errores de analytics
        })
      }

      switch (exportFormat) {
        case "image": {
          if (!previewImageUrl) {
            toastError("No se pudo generar la imagen")
            setIsExporting(false)
            return
          }

          // Convertir data URL a blob y descargar
          const response = await fetch(previewImageUrl)
          const blob = await response.blob()
          const url = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.download = `${deckName || "mazo"}-${imageType}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
          
          toastSuccess("Imagen del mazo exportada correctamente")
          break
        }
        
        case "list": {
          // Misma lógica que handleExportList del deck-management-panel
          const typeOrder = ["Aliado", "Arma", "Talismán", "Tótem", "Oro"]
          const lookup = cardMap
          const ordered = [...deckCards]
            .filter((d) => d.quantity > 0)
            .sort((a, b) => {
              const ca = lookup.get(a.cardId)
              const cb = lookup.get(b.cardId)
              if (!ca || !cb) return 0
              const ta = typeOrder.indexOf(ca.type)
              const tb = typeOrder.indexOf(cb.type)
              if (ta !== tb) return ta - tb
              const costA = ca.cost ?? 0
              const costB = cb.cost ?? 0
              return costA - costB
            })

          const lines: string[] = []
          for (const d of ordered) {
            const c = lookup.get(d.cardId)
            if (c) lines.push(`${d.quantity}x ${c.name}`)
          }
          
          const blob = new Blob([lines.join("\n")], { type: "text/plain" })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `${deckName || "mazo"}.txt`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          
          toastSuccess("Lista del mazo exportada correctamente")
          break
        }
        
        case "tts": {
          // Misma lógica que generateDeckCode
          const code = generateDeckCode(deckCards)
          const blob = new Blob([code], { type: "text/plain" })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `${deckName || "mazo"}-tts.txt`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          
          toastSuccess("Código TTS del mazo exportado correctamente")
          break
        }
      }
    } catch (error) {
      console.error("Error al exportar mazo:", error)
      toastError("Error al exportar el mazo. Por favor, intenta de nuevo.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Exportar Mazo</DialogTitle>
          <DialogDescription>
            Elige el formato y personaliza las opciones de exportación
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Selector de formato */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Formato de exportación</Label>
            <ToggleGroup
              type="single"
              value={exportFormat}
              onValueChange={(value) => {
                if (value && ["image", "list", "tts"].includes(value)) {
                  setExportFormat(value as ExportFormat)
                }
              }}
              className="w-full grid grid-cols-3 gap-2"
            >
              <ToggleGroupItem value="image" className="flex-1 flex-col gap-1 h-auto py-3">
                <ImageIcon className="size-5" />
                <span className="text-xs">Imagen</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="list" className="flex-1 flex-col gap-1 h-auto py-3">
                <FileText className="size-5" />
                <span className="text-xs">Lista (Texto)</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="tts" className="flex-1 flex-col gap-1 h-auto py-3">
                <Code className="size-5" />
                <span className="text-xs">TTS Code</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Opciones específicas por formato */}
          {exportFormat === "image" && (
            <>
              {/* Selector de tipo de imagen */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tipo de imagen</Label>
                <ToggleGroup
                  type="single"
                  value={imageType}
                  onValueChange={(value) => {
                    if (value === "horizontal" || value === "vertical") {
                      setImageType(value)
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
                <Label className="text-sm font-medium">Vista previa</Label>
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
                          maxHeight: imageType === "vertical" ? "500px" : "400px",
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
            </>
          )}

          {/* Información del formato seleccionado */}
          <div className="text-sm text-muted-foreground space-y-1">
            {exportFormat === "image" && (
              <p>Exporta el mazo como una imagen de alta calidad, perfecta para compartir en redes sociales.</p>
            )}
            {exportFormat === "list" && (
              <p>Exporta el mazo como una lista de texto con los nombres de las cartas y sus cantidades, ordenadas por tipo y costo.</p>
            )}
            {exportFormat === "tts" && (
              <p>Exporta el código del mazo para Tabletop Simulator. Copia este código en TTS para cargar el mazo.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            disabled={
              isExporting ||
              (exportFormat === "image" && (!previewImageUrl || isGeneratingPreview))
            }
          >
            {isExporting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="size-4 mr-2" />
                Exportar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

