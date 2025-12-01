"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Copy,
  Save,
  Trash2,
  Download,
  FileText,
  Edit2,
  Check,
  X,
  Loader2,
  Plus,
  Minus,
  Globe,
  Lock,
  Calendar,
} from "lucide-react"
import type { DeckCard, DeckStats, SavedDeck, DeckFormat } from "@/lib/deck-builder/types"
import type { Card as CardType } from "@/lib/deck-builder/types"
import {
  generateDeckCode,
  exportDeckList,
  saveDeckToLocalStorage,
  getSavedDecksFromLocalStorage,
  getUserDecksFromLocalStorage,
  deleteDeckFromLocalStorage,
  saveTemporaryDeck,
  getDeckRace,
  getDeckEdition,
  getDeckBackgroundImage,
  calculateDeckStats,
  EDITION_LOGOS,
  getPrioritizedDeckTags,
} from "@/lib/deck-builder/utils"
import { SaveDeckModal } from "./save-deck-modal"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useAuth } from "@/contexts/auth-context"
import { toastSuccess, toastError } from "@/lib/toast"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

interface DeckManagementPanelProps {
  deckName: string
  onDeckNameChange: (name: string) => void
  deckCards: DeckCard[]
  allCards: CardType[]
  stats: DeckStats
  onClearDeck: () => void
  onLoadDeck: (deck: SavedDeck) => void
  onAddCard: (cardId: string) => void
  onRemoveCard: (cardId: string) => void
  deckFormat: DeckFormat
  onDeckFormatChange: (format: DeckFormat) => void
}

export function DeckManagementPanel({
  deckName,
  onDeckNameChange,
  deckCards,
  allCards,
  stats,
  onClearDeck,
  onLoadDeck,
  onAddCard,
  onRemoveCard,
  deckFormat,
  onDeckFormatChange,
}: DeckManagementPanelProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [isEditingName, setIsEditingName] = useState(false)
  const [tempName, setTempName] = useState(deckName)
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>([])
  const [copied, setCopied] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deckToDelete, setDeckToDelete] = useState<string | null>(null)
  const [showAliadosTooltip, setShowAliadosTooltip] = useState(false)
  const [showOrosTooltip, setShowOrosTooltip] = useState(false)

  function handleSaveName() {
    onDeckNameChange(tempName)
    setIsEditingName(false)
  }

  function handleCancelEdit() {
    setTempName(deckName)
    setIsEditingName(false)
  }

  function handleCopyCode() {
    const code = generateDeckCode(deckCards)
    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        void navigator.clipboard.writeText(code)
      } else if (typeof document !== "undefined") {
        const textarea = document.createElement("textarea")
        textarea.value = code
        textarea.style.position = "fixed"
        textarea.style.opacity = "0"
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        try {
          document.execCommand("copy")
        } finally {
          document.body.removeChild(textarea)
        }
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toastSuccess("Código TTS copiado al portapapeles")
    } catch {
      toastError("No se pudo copiar el código TTS. Por favor cópialo manualmente.")
    }
  }

  function handleSaveDeck() {
    if (!user) {
      // Guardar el mazo temporalmente antes de mostrar el diálogo
      saveTemporaryDeck(deckName, deckCards, deckFormat)
      setShowLoginDialog(true)
      return
    }
    setShowSaveModal(true)
  }

  function handleSaveDeckConfirm(deckData: Omit<SavedDeck, "id" | "createdAt">) {
    if (!user) return

    // Verificar si ya existe un mazo con ese nombre para este usuario
    const userDecks = getUserDecksFromLocalStorage(user.id)
    const exists = userDecks.some(
      (d) => d.name.trim().toLowerCase() === deckData.name.trim().toLowerCase()
    )

    if (exists) {
      const newName = typeof window !== "undefined"
        ? window.prompt(
            "Ya existe un mazo con ese nombre. Escribe un nombre diferente:",
            `${deckData.name} (copia)`
          )
        : null
      if (!newName || !newName.trim()) return
      deckData.name = newName.trim()
    }

    const deck: SavedDeck = {
      id: Date.now().toString(),
      name: deckData.name,
      description: deckData.description,
      cards: deckData.cards,
      createdAt: Date.now(),
      userId: deckData.userId,
      author: deckData.author || user.username,
      isPublic: deckData.isPublic,
      publishedAt: deckData.publishedAt,
      tags: deckData.tags,
      format: deckFormat,
    }
    saveDeckToLocalStorage(deck)
    onDeckNameChange(deckData.name)
    toastSuccess("Mazo guardado correctamente")
  }

  function handleLoadDeck(deck: SavedDeck) {
    onLoadDeck(deck)
    setShowLoadDialog(false)
  }

  function handleDeleteDeck(deckId: string) {
    setDeckToDelete(deckId)
    setDeleteDialogOpen(true)
  }

  function confirmDeleteDeck() {
    if (!deckToDelete) return

    deleteDeckFromLocalStorage(deckToDelete)
    setSavedDecks(getSavedDecksFromLocalStorage())
    toastSuccess("Mazo eliminado correctamente")
    setDeckToDelete(null)
  }

  function handleExportList() {
    const typeOrder = ["Aliado", "Arma", "Talismán", "Tótem", "Oro"]
    const lookup = new Map(allCards.map((c) => [c.id, c]))
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
  }

  async function handleExportImage() {
    if (typeof document === "undefined") return

    const canvas = document.createElement("canvas")
    const width = 1920
    const height = 1080
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Configurar alta calidad de renderizado
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"

    const loadImage = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new window.Image()
        img.crossOrigin = "anonymous"
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
      })

    const backgroundUrl =
      "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435880/EXPORTADO_WEBPPP_jxcgox.webp"

    try {
      const bg = await loadImage(backgroundUrl)
      ctx.drawImage(bg, 0, 0, width, height)

      // Título del mazo (fuente más pequeña y cercano a los contadores)
      ctx.fillStyle = "white"
      ctx.textBaseline = "top"
      ctx.font = "bold 28px system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
      ctx.fillText(deckName || "Mazo sin nombre", 40, 20)

      // Contadores por tipo en óvalos con iconos vectoriales
      const typeOrder = ["Aliado", "Arma", "Talismán", "Tótem", "Oro"]

      interface TypeBadge {
        key: string
        label: string
      }

      const typeBadges: TypeBadge[] = [
        { key: "Aliado", label: "Aliados" },
        { key: "Arma", label: "Armas" },
        { key: "Talismán", label: "Talismanes" },
        { key: "Tótem", label: "Tótems" },
        { key: "Oro", label: "Oros" },
      ]

      const badgeTop = 52
      let badgeX = 40
      const badgeGapX = 14

      const labelFont =
        "bold 18px system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
      const countFont =
        "16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif"

      function drawRoundedRectPath(
        ctx2: CanvasRenderingContext2D,
        x: number,
        y: number,
        w: number,
        h: number,
        r: number
      ) {
        const radius = Math.min(r, h / 2, w / 2)
        ctx2.beginPath()
        ctx2.moveTo(x + radius, y)
        ctx2.lineTo(x + w - radius, y)
        ctx2.quadraticCurveTo(x + w, y, x + w, y + radius)
        ctx2.lineTo(x + w, y + h - radius)
        ctx2.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
        ctx2.lineTo(x + radius, y + h)
        ctx2.quadraticCurveTo(x, y + h, x, y + h - radius)
        ctx2.lineTo(x, y + radius)
        ctx2.quadraticCurveTo(x, y, x + radius, y)
        ctx2.closePath()
      }

      // Mapa de URLs de iconos por tipo
      const iconUrls: Record<string, string> = {
        Aliado: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764396472/Aliado_icono_lvsirg.webp",
        Arma: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764396472/arma_icono_dgmgej.webp",
        Talismán: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764396473/talisman_icono_kco7k9.webp",
        Tótem: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764396473/totem_icono_fk5p2k.webp",
        Oro: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764396472/Oro_icono_godhwp.webp",
      }

      // Cargar todos los iconos antes de dibujar los badges
      const iconImages = new Map<string, HTMLImageElement>()
      for (const [key, url] of Object.entries(iconUrls)) {
        try {
          const img = await loadImage(url)
          iconImages.set(key, img)
        } catch {
          // Si falla la carga, continuamos sin ese icono
        }
      }

      for (const badge of typeBadges) {
        const count = stats.cardsByType[badge.key] || 0

        // Medir texto
        ctx.font = labelFont
        const labelText = `${badge.label}:`
        const labelWidth = ctx.measureText(labelText).width

        ctx.font = countFont
        const countText = String(count)
        const countWidth = ctx.measureText(countText).width

        const textBlockWidth = Math.max(labelWidth, countWidth)
        const iconBoxSize = 40
        const horizontalPadding = 18
        const innerGap = 14

        const badgeWidth =
          horizontalPadding + textBlockWidth + innerGap + iconBoxSize + horizontalPadding
        const badgeHeight = 48
        const radius = badgeHeight / 2

        // Dibuja óvalo de fondo
        drawRoundedRectPath(ctx, badgeX, badgeTop, badgeWidth, badgeHeight, radius)
        ctx.fillStyle = "#302146"
        ctx.fill()

        // Texto (tipo y cantidad) centrado en el bloque de texto del óvalo
        const textCenterX = badgeX + horizontalPadding + textBlockWidth / 2
        // Bajamos ligeramente el texto dentro del óvalo
        const labelY = badgeTop + badgeHeight * 0.42
        const countY = badgeTop + badgeHeight * 0.78

        ctx.fillStyle = "white"
        ctx.textAlign = "center"
        ctx.textBaseline = "alphabetic"
        ctx.font = labelFont
        ctx.fillText(labelText, textCenterX, labelY)

        ctx.font = countFont
        ctx.fillText(countText, textCenterX, countY)

        // Icono de imagen a la derecha del óvalo
        const iconCenterX = badgeX + badgeWidth - horizontalPadding - iconBoxSize / 2
        const iconCenterY = badgeTop + badgeHeight / 2
        const iconSize = iconBoxSize * 0.7
        const iconImg = iconImages.get(badge.key)
        if (iconImg) {
          const iconX = iconCenterX - iconSize / 2
          const iconY = iconCenterY - iconSize / 2
          ctx.drawImage(iconImg, iconX, iconY, iconSize, iconSize)
        }

        // Restaurar alineación por defecto para el resto del canvas
        ctx.textAlign = "left"
        ctx.textBaseline = "top"

        badgeX += badgeWidth + badgeGapX
      }

      // Preparar cartas a dibujar, agrupadas por tipo
      interface CardToDraw {
        card: CardType
        quantity: number
      }

      const cardsByTypeForImage = new Map<string, CardToDraw[]>()
      // Orden por tipo y costo ascendente
      const deckCardsOrdered = [...deckCards].sort((a, b) => {
        const ca = cardMap.get(a.cardId)
        const cb = cardMap.get(b.cardId)
        if (!ca || !cb) return 0
        const ta = typeOrder.indexOf(ca.type)
        const tb = typeOrder.indexOf(cb.type)
        if (ta !== tb) return ta - tb
        const costA = ca.cost ?? 0
        const costB = cb.cost ?? 0
        return costA - costB
      })
      for (const deckCard of deckCardsOrdered) {
        if (deckCard.quantity <= 0) continue
        const card = cardMap.get(deckCard.cardId)
        if (!card) continue
        const list = cardsByTypeForImage.get(card.type) || []
        list.push({ card, quantity: deckCard.quantity })
        cardsByTypeForImage.set(card.type, list)
      }

      // Parámetros base de layout de cartas (antes de escalar)
      const baseCardWidth = 100
      const baseCardHeight = 150
      const gapX = 18
      const baseGapY = 12
      const baseStackOffset = 10 // separación horizontal entre copias apiladas

      const marginLeft = 80
      const marginRight = 80
      const usableRight = width - marginRight

      // Simular layout con tamaños base para saber cuánta altura usaría
      const layoutTop = badgeTop + 48 + 20
      let simulatedCurrentY = layoutTop

      for (const type of typeOrder) {
        const group = cardsByTypeForImage.get(type)
        if (!group || group.length === 0) continue

        simulatedCurrentY += 4

        let rowY = simulatedCurrentY
        let currentX = marginLeft

        const groupOrdered = [...group].sort((a, b) => {
          const costA = a.card.cost ?? 0
          const costB = b.card.cost ?? 0
          return costA - costB
        })

        for (const { quantity } of groupOrdered) {
          const stackWidth = baseCardWidth + (quantity - 1) * baseStackOffset

          if (currentX + stackWidth > usableRight) {
            currentX = marginLeft
            rowY += baseCardHeight + baseGapY
          }

          currentX += stackWidth + gapX
        }

        simulatedCurrentY = rowY + baseCardHeight + baseGapY
      }

      // Calcular factor de escala para aprovechar la altura disponible sin desbordar
      const availableHeight = height - layoutTop - 40
      const usedHeight = simulatedCurrentY - layoutTop

      let scale = 1
      if (usedHeight > 0 && availableHeight > 0) {
        const factor = availableHeight / usedHeight
        // Solo escalar hacia arriba, hasta un límite razonable
        if (factor > 1) {
          scale = Math.min(factor, 1.4)
        }
      }

      const cardWidth = baseCardWidth * scale
      const cardHeight = baseCardHeight * scale
      const gapY = baseGapY * scale
      const stackOffset = baseStackOffset * scale

      // Posición inicial para el layout real
      let currentY = layoutTop

      for (const type of typeOrder) {
        const group = cardsByTypeForImage.get(type)
        if (!group || group.length === 0) continue

        // Antes dibujábamos un subtítulo con el nombre del tipo.
        // Lo removemos para ganar espacio vertical.
        currentY += 4

        // Posicionamiento por filas con espaciado horizontal uniforme entre conjuntos
        let rowY = currentY
        let currentX = marginLeft
        const groupOrdered = [...group].sort((a, b) => {
          const costA = a.card.cost ?? 0
          const costB = b.card.cost ?? 0
          return costA - costB
        })
        for (const { card, quantity } of groupOrdered) {
          const stackWidth = cardWidth + (quantity - 1) * stackOffset

          // Si no cabe en la fila actual, saltar a la siguiente fila
          if (currentX + stackWidth > usableRight) {
            currentX = marginLeft
            rowY += cardHeight + gapY
          }

          const baseX = currentX
          const baseY = rowY
          for (let i = 0; i < quantity; i++) {
            const x = baseX + i * stackOffset
            const y = baseY // solo desplazamiento horizontal, sin diagonal
            try {
              const img = await loadImage(card.image)
              ctx.drawImage(img, x, y, cardWidth, cardHeight)
            } catch {
              // ignore
            }
          }

          // Espaciado horizontal uniforme entre el borde derecho del conjunto
          // actual y el borde izquierdo del siguiente conjunto.
          currentX += stackWidth + gapX
        }

        // avanzar Y según la última fila usada por este tipo
        currentY = rowY + cardHeight + gapY
      }

      // Exportar con máxima calidad
      const dataUrl = canvas.toDataURL("image/png", 1.0)
      const link = document.createElement("a")
      link.href = dataUrl
      link.download = `${deckName || "mazo"}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toastSuccess("Imagen del mazo exportada correctamente")
    } catch {
      toastError("No se pudo generar la imagen del mazo. Intenta nuevamente.")
    }
  }

  function openLoadDialog() {
    if (!user) {
      toastError("Debes iniciar sesión para cargar mazos guardados")
      return
    }
    setSavedDecks(getUserDecksFromLocalStorage(user.id))
    setShowLoadDialog(true)
  }

  // Calcular información adicional para cada mazo guardado
  const decksWithMetadata = useMemo(() => {
    return savedDecks.map((deck) => {
      const race = getDeckRace(deck.cards, allCards)
      const edition = getDeckEdition(deck.cards, allCards)
      const backgroundImage = getDeckBackgroundImage(race)
      const stats = calculateDeckStats(deck.cards, allCards)
      const cardCount = deck.cards.reduce((sum, dc) => sum + dc.quantity, 0)
      const createdDate = new Date(deck.createdAt)
      const formattedDate = createdDate.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
      
      return {
        ...deck,
        race,
        edition,
        backgroundImage,
        stats,
        cardCount,
        formattedDate,
      }
    })
  }, [savedDecks, allCards])

  // Agrupar cartas del mazo por ID - memoizado
  const deckCardsGrouped = useMemo(
    () => deckCards.filter((dc) => dc.quantity > 0),
    [deckCards]
  )

  const cardMap = useMemo(
    () => new Map(allCards.map((card) => [card.id, card])),
    [allCards]
  )

  // Agrupar cartas por tipo - memoizado fuera del JSX y optimizado
  const cardsByTypeGrouped = useMemo(() => {
    if (deckCardsGrouped.length === 0) return []
    
    const cardsByType = new Map<string, DeckCard[]>()
    
    for (const deckCard of deckCardsGrouped) {
      const card = cardMap.get(deckCard.cardId)
      if (!card) continue
      
      if (!cardsByType.has(card.type)) {
        cardsByType.set(card.type, [])
      }
      cardsByType.get(card.type)!.push(deckCard)
    }

    const typeOrder = ["Aliado", "Talismán", "Oro", "Tótem", "Arma"]
    
    return typeOrder
      .map((type) => {
        const typeCards = cardsByType.get(type)
        if (!typeCards || typeCards.length === 0) return null

        const typeTotal = typeCards.reduce((sum: number, dc: DeckCard) => sum + dc.quantity, 0)

        return {
          type,
          typeCards,
          typeTotal,
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
  }, [deckCardsGrouped, cardMap])

  return (
    <div className="flex flex-col h-full">
      {/* Encabezado con nombre del mazo */}
      <div className="p-2 sm:p-3 lg:p-4 border-b space-y-3">
        <div className="flex items-center gap-2">
          {isEditingName ? (
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
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setTempName(deckName)
                  setIsEditingName(true)
                }}
              >
                <Edit2 className="size-4" />
              </Button>
            </>
          )}
        </div>
        {/* Selector de formato */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Formato</label>
          <ToggleGroup
            type="single"
            value={deckFormat}
            onValueChange={(value) => {
              if (value) onDeckFormatChange(value as DeckFormat)
            }}
            className="w-full"
            variant="outline"
            spacing={0}
          >
            <ToggleGroupItem value="RE" className="flex-1 rounded-r-none">
              Racial Edición
            </ToggleGroupItem>
            <ToggleGroupItem value="RL" className="flex-1 rounded-none border-x">
              Racial Libre
            </ToggleGroupItem>
            <ToggleGroupItem value="LI" className="flex-1 rounded-l-none">
              Formato Libre
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="p-2 sm:p-3 lg:p-4 border-b space-y-2">
        <h3 className="text-sm font-semibold">Estadísticas</h3>
        <div className="space-y-1.5 text-sm">
          <div className="flex gap-4">
            <div>
              <span className="text-muted-foreground">Total cartas: </span>
              <span className="font-medium">{stats.totalCards}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Coste promedio: </span>
              <span className="font-medium">{stats.averageCost}</span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-1 text-center">
            {/* Aliados */}
            <span className="text-xs relative inline-flex items-center gap-0.5">
              Aliados:{" "}
              <span
                className={`font-semibold ${
                  stats.totalCards === 50 ? "text-destructive" : ""
                }`}
              >
                {stats.cardsByType["Aliado"] || 0}
              </span>
              {stats.totalCards === 50 &&
                (stats.cardsByType["Aliado"] || 0) < 16 && (
                  <div className="relative inline-block">
                    <button
                      type="button"
                      className="text-destructive hover:text-destructive/80 transition-colors text-[0.7rem] leading-none align-super"
                      onMouseEnter={() => setShowAliadosTooltip(true)}
                      onMouseLeave={() => setShowAliadosTooltip(false)}
                      onClick={() => setShowAliadosTooltip(!showAliadosTooltip)}
                      aria-label="Información sobre Aliados"
                    >
                      (?)
                    </button>
                    {showAliadosTooltip && (
                      <div
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50"
                        onMouseEnter={() => setShowAliadosTooltip(true)}
                        onMouseLeave={() => setShowAliadosTooltip(false)}
                      >
                        <div className="bg-popover text-popover-foreground text-xs rounded-md border shadow-md px-3 py-2 max-w-[200px] whitespace-nowrap">
                          El mínimo de Aliados por mazo es de 16
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                            <div className="border-4 border-transparent border-t-popover" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
            </span>
            <span className="text-xs">
              Arma: <span className="font-semibold">{stats.cardsByType["Arma"] || 0}</span>
            </span>
            <span className="text-xs">
              Talismán: <span className="font-semibold">{stats.cardsByType["Talismán"] || 0}</span>
            </span>
            <span className="text-xs">
              Tótem: <span className="font-semibold">{stats.cardsByType["Tótem"] || 0}</span>
            </span>
            {/* Oros */}
            <span className="text-xs relative inline-flex items-center gap-0.5">
              Oros:{" "}
              <span
                className={`font-semibold ${
                  stats.totalCards === 50 ? "text-destructive" : ""
                }`}
              >
                {stats.cardsByType["Oro"] || 0}
              </span>
              {stats.totalCards === 50 && !stats.hasOroIni && (
                <div className="relative inline-block">
                    <button
                      type="button"
                      className="text-destructive hover:text-destructive/80 transition-colors text-[0.7rem] leading-none align-super"
                      onMouseEnter={() => setShowOrosTooltip(true)}
                      onMouseLeave={() => setShowOrosTooltip(false)}
                      onClick={() => setShowOrosTooltip(!showOrosTooltip)}
                      aria-label="Información sobre Oros"
                    >
                      (?)
                    </button>
                  {showOrosTooltip && (
                    <div
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50"
                      onMouseEnter={() => setShowOrosTooltip(true)}
                      onMouseLeave={() => setShowOrosTooltip(false)}
                    >
                      <div className="bg-popover text-popover-foreground text-xs rounded-md border shadow-md px-3 py-2 max-w-[200px] whitespace-nowrap">
                        Agrega un Oro Inicial (Sin habilidad)
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                          <div className="border-4 border-transparent border-t-popover" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="p-2 sm:p-3 lg:p-4 border-b space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyCode}
            className="w-full"
          >
            {copied ? (
              <>
                <Check className="size-4 mr-2" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="size-4 mr-2" />
                Código TTS
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSaveDeck}
          >
            <Save className="size-4 mr-2" />
            Guardar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={openLoadDialog}
            disabled={!user}
            title={!user ? "Debes iniciar sesión para cargar mazos" : ""}
          >
            <Loader2 className="size-4 mr-2" />
            Cargar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearDeck}
            className="text-destructive"
          >
            <Trash2 className="size-4 mr-2" />
            Borrar
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportImage}>
            <Download className="size-4 mr-2" />
            Exportar imagen
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportList}>
            <FileText className="size-4 mr-2" />
            Exportar lista
          </Button>
        </div>
      </div>

      {/* Lista de cartas del mazo */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 lg:p-4">
        {deckCardsGrouped.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay cartas en el mazo
          </p>
        ) : (
          <div className="space-y-4">
            {/* Agrupar cartas por tipo */}
            {cardsByTypeGrouped.map((group) => {
              if (!group) return null
              const { type, typeCards, typeTotal } = group

              return (
                <div key={type} className="space-y-2">
                  <h4 className="text-sm font-bold text-foreground">
                    {type} ({typeTotal})
                  </h4>
                  <div className="space-y-1.5">
                    {typeCards.map((deckCard: DeckCard) => {
                      const card = cardMap.get(deckCard.cardId)
                      if (!card) return null

                      return (
                        <div
                          key={deckCard.cardId}
                          className="flex items-center rounded-lg overflow-hidden border border-border/50"
                        >
                          {/* Controles de cantidad */}
                          <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-2.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 rounded-full bg-background/80 hover:bg-background text-foreground"
                              onClick={() => {
                                onRemoveCard(deckCard.cardId)
                              }}
                              disabled={deckCard.quantity === 0}
                            >
                              <Minus className="size-3" />
                            </Button>
                            <span className="text-sm font-semibold text-foreground min-w-[1.5rem] text-center">
                              {deckCard.quantity}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 rounded-full bg-background/80 hover:bg-background text-foreground"
                              onClick={() => {
                                onAddCard(deckCard.cardId)
                              }}
                              disabled={deckCard.quantity >= (deckFormat === "RE" ? card.banListRE : deckFormat === "RL" ? card.banListRL : card.banListLI)}
                            >
                              <Plus className="size-3" />
                            </Button>
                          </div>

                          {/* Nombre de la carta con imagen de fondo */}
                          <div className="flex-1 relative h-12 flex items-center px-3 overflow-hidden">
                            {/* Imagen de fondo recortada - parte del medio de la carta */}
                            <div className="absolute inset-0 overflow-hidden">
                              <div
                                className="absolute inset-0"
                                style={{
                                  backgroundImage: `url(${card.image})`,
                                  backgroundPosition: "center 23%",
                                  backgroundSize: "200% auto",
                                  backgroundRepeat: "no-repeat",
                                  clipPath: "inset(5% 0% 5% 0%)",
                                  transform: "scaleX(1)",
                                  transformOrigin: "left center",
                                }}
                              />
                            </div>
                            {/* Overlay oscuro para mejor legibilidad del texto */}
                            <div className="absolute inset-0 bg-black/40 z-0" />
                            {/* Nombre de la carta */}
                            <span className="relative text-lg font-semibold text-white z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                              {card.name}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Dialog para cargar mazos guardados */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Mazos guardados</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {decksWithMetadata.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay mazos guardados
              </p>
            ) : (
              decksWithMetadata.map((deck) => (
                <div
                  key={deck.id}
                  className="group relative border rounded-lg overflow-hidden bg-card hover:border-primary/50 transition-colors"
                >
                  {/* Imagen de fondo */}
                  <div
                    className="relative h-20 overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20"
                    style={{
                      backgroundImage: `url(${deck.backgroundImage})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
                    
                    {/* Logo de edición */}
                    {deck.edition && EDITION_LOGOS[deck.edition] && (
                      <div className="absolute top-1.5 right-1.5 z-10">
                        <div className="relative w-12 h-12" title={deck.edition}>
                          <Image
                            src={EDITION_LOGOS[deck.edition]}
                            alt={deck.edition}
                            fill
                            className="object-contain drop-shadow-lg"
                            sizes="48px"
                          />
                        </div>
                      </div>
                    )}

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
                        onClick={() => handleLoadDeck(deck)}
                        className="flex-1"
                      >
                        <Loader2 className="size-4 mr-2" />
                        Cargar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteDeck(deck.id)}
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
            <Button variant="outline" onClick={() => setShowLoadDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para guardar mazo */}
      <SaveDeckModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveDeckConfirm}
        initialName={deckName}
        deckCards={deckCards}
        deckFormat={deckFormat}
      />

      {/* Modal de confirmación de eliminación */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Eliminar Mazo"
        description="¿Estás seguro de que quieres eliminar este mazo? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDeleteDeck}
        variant="destructive"
      />

      {/* Dialog para invitar a iniciar sesión o registrarse */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inicia sesión para guardar tu mazo</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Tu mazo ha sido guardado temporalmente. Para guardarlo permanentemente y acceder a todas las funciones, necesitas iniciar sesión o crear una cuenta.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => {
                  setShowLoginDialog(false)
                  router.push("/inicio-sesion")
                }}
                className="flex-1"
              >
                Iniciar Sesión
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowLoginDialog(false)
                  router.push("/registro")
                }}
                className="flex-1"
              >
                Registrarse
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowLoginDialog(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

