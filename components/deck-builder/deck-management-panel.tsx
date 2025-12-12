"use client"

import { useState, useMemo, useRef, useEffect, Suspense } from "react"
import dynamic from "next/dynamic"
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
  DialogDescription,
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
  GripVertical,
  ArrowRight,
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
  getDeckEditionLogo,
  getDeckBackgroundImage,
  calculateDeckStats,
  EDITION_LOGOS,
  getPrioritizedDeckTags,
  getSavedDecksFromStorage,
  getBaseCardId,
  getAllyIconUrl,
} from "@/lib/deck-builder/utils"
import { useCards } from "@/hooks/use-cards"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

// Lazy load SaveDeckModal - solo se carga cuando se necesita abrir
const SaveDeckModal = dynamic(
  () => import("./save-deck-modal").then((mod) => ({ default: mod.SaveDeckModal })),
  {
    loading: () => null // No mostrar loading, el modal se abre después
  }
)
import { useAuth } from "@/contexts/auth-context"
import { toastSuccess, toastError } from "@/lib/toast"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { getAllCardsMetadata } from "@/lib/api/cards"
import { DeckHeader } from "./deck-header"
import { DeckStatsSection } from "./deck-stats-section"
import { DeckActionsBar } from "./deck-actions-bar"
import { useBannerSettings, getBannerStyle, getOverlayStyle, useDeviceType } from "@/hooks/use-banner-settings"
import { optimizeCloudinaryUrl, isCloudinaryOptimized, detectDeviceType } from "@/lib/deck-builder/cloudinary-utils"

/**
 * Determina la posición Y óptima para mostrar la imagen de fondo de una carta
 * basándose en su tipo, características y metadatos personalizados de la base de datos.
 * 
 * @param card - La carta para la cual calcular la posición
 * @param cardMetadataMap - Mapa de metadatos personalizados por cardId (opcional)
 * @returns Porcentaje de posición Y (0% = arriba, 100% = abajo)
 */
function getCardBackgroundPositionY(
  card: CardType,
  cardMetadataMap?: Record<string, number>
): string {
  // Primero verificar si hay un ajuste personalizado en la base de datos
  if (cardMetadataMap && cardMetadataMap[card.id] !== undefined) {
    const customPosition = cardMetadataMap[card.id]
    return `${customPosition}%`
  }

  // Si no hay ajuste personalizado, usar valores por defecto basados en el tipo
  const typePositions: Record<string, number> = {
    "Aliado": 20,    // Arte generalmente en la parte superior
    "Arma": 25,      // Arte en la parte superior-media
    "Talismán": 30,   // Arte más hacia el centro
    "Tótem": 28,     // Similar a Talismán
    "Oro": 35,       // Arte más hacia el centro-inferior (más espacio para texto)
  }

  // Posición base según el tipo
  let positionY = typePositions[card.type] || 25

  // Ajuste basado en la longitud del nombre
  // Nombres largos pueden necesitar mostrar más arriba para evitar que el texto tape el arte
  const nameLength = card.name.length
  if (nameLength > 20) {
    positionY -= 3 // Mover un poco hacia arriba para nombres muy largos
  } else if (nameLength < 10) {
    positionY += 2 // Mover un poco hacia abajo para nombres cortos
  }

  // Ajuste basado en si tiene descripción (cartas con descripción suelen tener más contenido visual abajo)
  if (card.description && card.description.length > 50) {
    positionY += 2 // Mover un poco hacia abajo si tiene descripción larga
  }

  // Asegurar que la posición esté en un rango válido (entre 0% y 70%)
  positionY = Math.max(0, Math.min(70, positionY))

  return `${positionY}%`
}

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
  currentDeck?: SavedDeck | null // Mazo actual si se está editando uno existente
  onCurrentDeckChange?: (deck: SavedDeck | null) => void // Callback para actualizar el mazo actual después de guardar
  cardReplacements: Map<string, string> // Mapa de baseId -> alternativeCardId
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
  currentDeck,
  onCurrentDeckChange,
  cardReplacements,
}: DeckManagementPanelProps) {
  const deviceType = useDeviceType()
  const { setting: bannerSetting } = useBannerSettings("deck-builder", "grid", deviceType)
  
  // Debug: Log cuando currentDeck cambia
  useEffect(() => {
    if (currentDeck) {
      console.log("[DeckManagementPanel] currentDeck establecido:", {
        id: currentDeck.id,
        name: currentDeck.name,
        hasId: !!currentDeck.id,
      });
    } else {
      console.log("[DeckManagementPanel] currentDeck es null");
    }
  }, [currentDeck]);

  // Precargar metadatos de cartas al montar el componente
  useEffect(() => {
    async function loadCardMetadata() {
      try {
        const metadata = await getAllCardsMetadata()
        setCardMetadataMap(metadata)
      } catch (error) {
        console.error("Error al cargar metadatos de cartas:", error)
        // Continuar sin metadatos, usar valores por defecto
      }
    }
    loadCardMetadata()
  }, [])
  const { user } = useAuth()
  const router = useRouter()
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>([])
  const [isLoadingDecks, setIsLoadingDecks] = useState(false)
  const [copied, setCopied] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deckToDelete, setDeckToDelete] = useState<string | null>(null)
  
  // Estados para el modal de exportación
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportType, setExportType] = useState<"horizontal" | "vertical">("horizontal")
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  
  // Metadatos de cartas (ajustes personalizados de posición Y)
  const [cardMetadataMap, setCardMetadataMap] = useState<Record<string, number>>({})
  
  // Estados para el panel deslizable (solo en pantallas < 1024px)
  const [panelHeight, setPanelHeight] = useState(200) // Altura inicial en px
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartY, setDragStartY] = useState(0)
  const [dragStartHeight, setDragStartHeight] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  
  // Alturas mínima y máxima del panel
  const MIN_HEIGHT = 120 // Solo muestra el header cuando está colapsado
  const getMaxHeight = () => typeof window !== "undefined" ? window.innerHeight * 0.85 : 800

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

  async function handleSaveDeckConfirm(deckData: Omit<SavedDeck, "id" | "createdAt">) {
    if (!user) return

    try {
      // Si estamos editando un mazo existente (tiene ID), actualizarlo directamente
      const isEditing = currentDeck && currentDeck.id
      
      if (!isEditing) {
        // Solo verificar duplicados si es un mazo nuevo
        // Verificar si ya existe un mazo con ese nombre para este usuario
        let userDecks: SavedDeck[] = []
        try {
          const { getUserDecks } = await import("@/lib/api/decks");
          const response = await getUserDecks(user.id);
          userDecks = response.data || [];
        } catch {
          // Fallback a localStorage si la API falla
          userDecks = getUserDecksFromLocalStorage(user.id);
        }

        // Verificar duplicados excluyendo el mazo actual si existe
        const exists = userDecks.some(
          (d) => d.id !== currentDeck?.id && d.name.trim().toLowerCase() === deckData.name.trim().toLowerCase()
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
      }

      // Construir el objeto del mazo
      // Si estamos editando, preservar el ID y createdAt original
      const deck: SavedDeck = {
        ...(isEditing && currentDeck ? {
          id: currentDeck.id, // Preservar ID para actualizar
          createdAt: currentDeck.createdAt, // Preservar fecha de creación
        } : {
          createdAt: Date.now(), // Nueva fecha para mazos nuevos
        }),
        name: deckData.name,
        description: deckData.description,
        cards: deckData.cards,
        userId: deckData.userId,
        author: deckData.author || user.username,
        isPublic: deckData.isPublic,
        publishedAt: deckData.publishedAt,
        tags: deckData.tags,
        format: deckFormat,
        techCardId: deckData.techCardId, // Usar la carta tech del modal (puede ser undefined para eliminar)
      }

      // Usar la función que guarda en la API si hay usuario
      // Esta función detectará si tiene ID y actualizará en lugar de crear
      const { saveDeckToStorage } = await import("@/lib/deck-builder/utils");
      const savedDeck = await saveDeckToStorage(deck, user.id);

      if (savedDeck) {
        // Tracking de analytics
        const { trackDeckCreated, trackDeckSaved, trackDeckPublished } = await import("@/lib/analytics/events");
        
        if (!isEditing && savedDeck.id) {
          // Mazo nuevo creado
          trackDeckCreated(savedDeck.name, savedDeck.id);
        } else if (isEditing && savedDeck.id) {
          // Mazo existente guardado/actualizado
          trackDeckSaved(savedDeck.id, savedDeck.name, savedDeck.isPublic || false);
        }
        
        // Si se publicó el mazo
        if (deckData.isPublic && deckData.publishedAt && savedDeck.id) {
          trackDeckPublished(savedDeck.id, savedDeck.name);
        }
        
        onDeckNameChange(deckData.name)
        // Actualizar currentDeck con el mazo guardado para mantener la referencia actualizada
        if (isEditing && savedDeck.id) {
          // El mazo se actualizó, actualizar la referencia en el componente padre
          if (onCurrentDeckChange) {
            onCurrentDeckChange(savedDeck)
          }
        } else if (!isEditing && savedDeck.id) {
          // Si se creó un nuevo mazo y ahora tiene ID, establecerlo como currentDeck
          if (onCurrentDeckChange) {
            onCurrentDeckChange(savedDeck)
          }
        }
        toastSuccess(isEditing ? "Mazo actualizado correctamente" : "Mazo guardado correctamente")
        // Actualizar la lista de mazos guardados desde la API
        if (user) {
          try {
            const decks = await getSavedDecksFromStorage(user.id)
            setSavedDecks(decks)
          } catch (error) {
            console.error("Error al actualizar lista de mazos:", error)
            // Fallback a localStorage
            setSavedDecks(getUserDecksFromLocalStorage(user.id))
          }
        } else {
          setSavedDecks(getSavedDecksFromLocalStorage())
        }
      } else {
        toastError("Error al guardar el mazo. Por favor intenta de nuevo.")
      }
    } catch (error) {
      console.error("Error al guardar mazo:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      toastError(`Error al guardar el mazo: ${errorMessage}`)
    }
  }

  function handleLoadDeck(deck: SavedDeck) {
    onLoadDeck(deck)
    setShowLoadDialog(false)
  }

  function handleDeleteDeck(deckId: string) {
    setDeckToDelete(deckId)
    setDeleteDialogOpen(true)
  }

  async function confirmDeleteDeck() {
    if (!deckToDelete || !user) return

    try {
      // Obtener información del mazo antes de eliminarlo para analytics
      const deckToDeleteObj = savedDecks.find(d => d.id === deckToDelete);
      const deckName = deckToDeleteObj?.name || "Mazo sin nombre";
      
      // Usar la función que elimina de la API si hay usuario
      const { deleteDeckFromStorage } = await import("@/lib/deck-builder/utils")
      await deleteDeckFromStorage(deckToDelete, user.id)
      
      // Tracking de analytics
      const { trackDeckDeleted } = await import("@/lib/analytics/events");
      trackDeckDeleted(deckToDelete, deckName);
      
      // Recargar la lista de mazos
      const decks = await getSavedDecksFromStorage(user.id)
      setSavedDecks(decks)
      
      toastSuccess("Mazo eliminado correctamente")
    } catch (error) {
      console.error("Error al eliminar mazo:", error)
      // Fallback a localStorage si hay error
      deleteDeckFromLocalStorage(deckToDelete)
      setSavedDecks(getUserDecksFromLocalStorage(user.id))
      toastSuccess("Mazo eliminado correctamente")
    } finally {
      setDeckToDelete(null)
    }
  }

  async function handleExportList() {
    // Usar cardMap que ya incluye las alternativas
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
    
    // Tracking de analytics (no bloqueante)
    if (currentDeck?.id) {
      const deckId = currentDeck.id;
      import("@/lib/analytics/events").then(({ trackDeckExported }) => {
        trackDeckExported(deckId, "list");
      }).catch(() => {
        // Silenciar errores de analytics
      });
    }
    
    const a = document.createElement("a")
    a.href = url
    a.download = `${deckName || "mazo"}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Función auxiliar para cargar imágenes
  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image()
      img.crossOrigin = "anonymous"
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })

  // Función auxiliar para dibujar badges redondeados
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

  // Función auxiliar para dibujar título y badges
  async function drawTitleAndBadges(
    ctx: CanvasRenderingContext2D,
    width: number,
    deckName: string,
    stats: DeckStats,
    cropFromRight: boolean = false
  ) {
    const backgroundUrl =
      "https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435880/EXPORTADO_WEBPPP_jxcgox.webp"
    const bg = await loadImage(backgroundUrl)
    
    if (cropFromRight) {
      // Cortar desde la derecha: la imagen de fondo es 1920x1080, queremos cortar una sección cuadrada 1080x1080 desde la izquierda
      // Calcular qué parte de la imagen fuente usar (mantener altura completa, cortar ancho)
      const sourceAspectRatio = bg.width / bg.height // 1920/1080 = 1.777...
      const targetAspectRatio = width / ctx.canvas.height // 1080/1080 = 1.0
      
      if (sourceAspectRatio > targetAspectRatio) {
        // La imagen fuente es más ancha, cortar desde la derecha
        const sourceWidth = bg.height * targetAspectRatio // altura * 1.0 = altura
        ctx.drawImage(
          bg,
          0, 0, // origen en la imagen fuente (esquina superior izquierda)
          sourceWidth, bg.height, // tamaño del área a copiar (cuadrado desde la izquierda)
          0, 0, // destino en el canvas
          width, ctx.canvas.height // tamaño en el canvas (1080x1080)
        )
      } else {
        // Si la imagen fuente no es lo suficientemente ancha, escalar normalmente
        ctx.drawImage(bg, 0, 0, width, ctx.canvas.height)
      }
    } else {
      // Escalar normalmente
      ctx.drawImage(bg, 0, 0, width, ctx.canvas.height)
    }

    // Título del mazo
    ctx.fillStyle = "white"
    ctx.textBaseline = "top"
    ctx.font = "bold 28px system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    ctx.fillText(deckName || "Mazo sin nombre", 40, 20)

    // Contadores por tipo en óvalos con iconos
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
    const labelFont = "bold 18px system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    const countFont = "16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif"

    // Mapa de URLs de iconos por tipo (icono de Aliado es dinámico)
    const iconUrls: Record<string, string> = {
      Aliado: getAllyIconUrl(deckCards, allCards),
      Arma: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764396472/arma_icono_dgmgej.webp",
      Talismán: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764396473/talisman_icono_kco7k9.webp",
      Tótem: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764396473/totem_icono_fk5p2k.webp",
      Oro: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764396472/Oro_icono_godhwp.webp",
    }

    // Cargar todos los iconos
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

      // Texto (tipo y cantidad) centrado
      const textCenterX = badgeX + horizontalPadding + textBlockWidth / 2
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

      // Restaurar alineación por defecto
      ctx.textAlign = "left"
      ctx.textBaseline = "top"

      badgeX += badgeWidth + badgeGapX
    }

    return badgeTop + 48 + 20 // Retornar la posición Y donde empiezan las cartas
  }

  // Generar imagen horizontal (versión original)
  async function generateHorizontalImage(): Promise<string | null> {
    if (typeof document === "undefined") return null

    const canvas = document.createElement("canvas")
    const width = 1920
    const height = 1080
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"

    try {
      const layoutTop = await drawTitleAndBadges(ctx, width, deckName, stats)

      // Dibujar logo de edición en la esquina superior derecha
      const editionLogoUrl = getDeckEditionLogo(deckCards, allCards)
      if (editionLogoUrl) {
        try {
          const editionLogo = await loadImage(editionLogoUrl)
          const logoSize = 80 // Tamaño del logo
          const logoMargin = 20 // Margen desde los bordes
          const logoX = width - logoSize - logoMargin
          const logoY = logoMargin
          ctx.drawImage(editionLogo, logoX, logoY, logoSize, logoSize)
        } catch {
          // Si falla la carga del logo, continuar sin él
        }
      }

      // Preparar cartas a dibujar, agrupadas por tipo
      interface CardToDraw {
        card: CardType
        quantity: number
      }

      const typeOrder = ["Aliado", "Arma", "Talismán", "Tótem", "Oro"]
      const cardsByTypeForImage = new Map<string, CardToDraw[]>()
      
      // Orden por tipo y costo ascendente (excepto para Oros que se ordenan por cantidad)
      const deckCardsOrdered = [...deckCards].sort((a, b) => {
        const ca = cardMap.get(a.cardId)
        const cb = cardMap.get(b.cardId)
        if (!ca || !cb) return 0
        const ta = typeOrder.indexOf(ca.type)
        const tb = typeOrder.indexOf(cb.type)
        if (ta !== tb) return ta - tb
        
        // Para Oros, ordenar por cantidad (mayor a menor) y luego oro inicial al final
        if (ca.type === "Oro" && cb.type === "Oro") {
          // Si uno es oro inicial y el otro no, el inicial va al final
          if (ca.isOroIni && !cb.isOroIni) return 1
          if (!ca.isOroIni && cb.isOroIni) return -1
          // Si ambos son del mismo tipo (inicial o normal), ordenar por cantidad
          return b.quantity - a.quantity
        }
        
        // Para otros tipos, ordenar por costo
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
      
      // Asegurar que los Oros estén ordenados correctamente dentro de su grupo
      const oroGroup = cardsByTypeForImage.get("Oro")
      if (oroGroup) {
        const orosIniciales: CardToDraw[] = []
        const orosNormales: CardToDraw[] = []
        
        // Separar oros iniciales de oros normales
        for (const oroCard of oroGroup) {
          if (oroCard.card.isOroIni) {
            orosIniciales.push(oroCard)
          } else {
            orosNormales.push(oroCard)
          }
        }
        
        // Ordenar cada grupo por cantidad (mayor a menor)
        orosNormales.sort((a, b) => b.quantity - a.quantity)
        orosIniciales.sort((a, b) => b.quantity - a.quantity)
        
        // Reemplazar el grupo de oros con el orden correcto
        cardsByTypeForImage.set("Oro", [...orosNormales, ...orosIniciales])
      }

      // Parámetros base de layout de cartas
      const baseCardWidth = 100
      const baseCardHeight = 150
      const gapX = 18
      const baseGapY = 12
      const baseStackOffset = 10

      const marginLeft = 80
      const marginRight = 80
      const usableRight = width - marginRight

      // Simular layout para calcular escala
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

      // Calcular factor de escala
      const availableHeight = height - layoutTop - 40
      const usedHeight = simulatedCurrentY - layoutTop
      let scale = 1
      if (usedHeight > 0 && availableHeight > 0) {
        const factor = availableHeight / usedHeight
        if (factor > 1) {
          scale = Math.min(factor, 1.4)
        }
      }

      const cardWidth = baseCardWidth * scale
      const cardHeight = baseCardHeight * scale
      const gapY = baseGapY * scale
      const stackOffset = baseStackOffset * scale

      // Dibujar cartas
      let currentY = layoutTop
      for (const type of typeOrder) {
        const group = cardsByTypeForImage.get(type)
        if (!group || group.length === 0) continue

        currentY += 4
        let rowY = currentY
        let currentX = marginLeft
        
        const groupOrdered = [...group].sort((a, b) => {
          const costA = a.card.cost ?? 0
          const costB = b.card.cost ?? 0
          return costA - costB
        })
        
        for (const { card, quantity } of groupOrdered) {
          const stackWidth = cardWidth + (quantity - 1) * stackOffset
          if (currentX + stackWidth > usableRight) {
            currentX = marginLeft
            rowY += cardHeight + gapY
          }

          const baseX = currentX
          const baseY = rowY
          for (let i = 0; i < quantity; i++) {
            const x = baseX + i * stackOffset
            const y = baseY
            try {
              const img = await loadImage(card.image)
              ctx.drawImage(img, x, y, cardWidth, cardHeight)
            } catch {
              // ignore
            }
          }

          currentX += stackWidth + gapX
        }

        currentY = rowY + cardHeight + gapY
      }

      return canvas.toDataURL("image/png", 1.0)
    } catch {
      return null
    }
  }

  // Generar imagen vertical (Instagram)
  async function generateVerticalImage(): Promise<string | null> {
    if (typeof document === "undefined") return null

    const canvas = document.createElement("canvas")
    const width = 1080
    const height = 1080
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"

    try {
      // Dibujar fondo cortado desde la derecha
      const layoutTop = await drawTitleAndBadges(ctx, width, deckName, stats, true)

      // Dibujar logo de edición en la esquina superior derecha
      const editionLogoUrl = getDeckEditionLogo(deckCards, allCards)
      if (editionLogoUrl) {
        try {
          const editionLogo = await loadImage(editionLogoUrl)
          const logoSize = 80 // Tamaño del logo
          const logoMargin = 20 // Margen desde los bordes
          const logoX = width - logoSize - logoMargin
          const logoY = logoMargin
          ctx.drawImage(editionLogo, logoX, logoY, logoSize, logoSize)
        } catch {
          // Si falla la carga del logo, continuar sin él
        }
      }

      // Crear mapa de cantidad por carta
      const cardQuantityMap = new Map<string, number>()
      for (const deckCard of deckCards) {
        if (deckCard.quantity <= 0) continue
        const card = cardMap.get(deckCard.cardId)
        if (!card) continue
        cardQuantityMap.set(card.id, deckCard.quantity)
      }

      // Obtener todas las cartas únicas agrupadas por tipo
      const cardsByType = new Map<string, Array<{ card: CardType; quantity: number }>>()
      const seenCardIds = new Set<string>()
      
      // Orden de tipos (oros al final)
      const typeOrder = ["Aliado", "Arma", "Talismán", "Tótem", "Oro"]
      
      // Agrupar cartas por tipo
      for (const deckCard of deckCards) {
        if (deckCard.quantity <= 0) continue
        const card = cardMap.get(deckCard.cardId)
        if (!card) continue
        
        // Solo agregar una vez cada carta, pero guardar la cantidad
        if (!seenCardIds.has(card.id)) {
          const quantity = cardQuantityMap.get(card.id) || 1
          const type = card.type
          
          if (!cardsByType.has(type)) {
            cardsByType.set(type, [])
          }
          cardsByType.get(type)!.push({ card, quantity })
          seenCardIds.add(card.id)
        }
      }
      
      // Ordenar cartas dentro de cada tipo por costo, y luego ordenar por tipo (oros al final)
      const uniqueCards: Array<{ card: CardType; quantity: number }> = []
      
      // Primero agregar todos los tipos excepto Oro
      for (const type of typeOrder) {
        if (type === "Oro") continue
        
        const typeCards = cardsByType.get(type) || []
        // Ordenar por costo dentro del tipo
        typeCards.sort((a, b) => {
          const costA = a.card.cost ?? 0
          const costB = b.card.cost ?? 0
          return costA - costB
        })
        uniqueCards.push(...typeCards)
      }
      
      // Finalmente agregar los Oros ordenados por cantidad (mayor a menor), con oro inicial al final
      const oroCards = cardsByType.get("Oro") || []
      const orosIniciales: Array<{ card: CardType; quantity: number }> = []
      const orosNormales: Array<{ card: CardType; quantity: number }> = []
      
      // Separar oros iniciales de oros normales
      for (const oroCard of oroCards) {
        if (oroCard.card.isOroIni) {
          orosIniciales.push(oroCard)
        } else {
          orosNormales.push(oroCard)
        }
      }
      
      // Ordenar oros normales por cantidad (mayor a menor)
      orosNormales.sort((a, b) => b.quantity - a.quantity)
      
      // Ordenar oros iniciales por cantidad (mayor a menor)
      orosIniciales.sort((a, b) => b.quantity - a.quantity)
      
      // Agregar primero los oros normales, luego los oros iniciales
      uniqueCards.push(...orosNormales, ...orosIniciales)

      // Calcular grid cuadrado
      const cardCount = uniqueCards.length
      const cols = Math.ceil(Math.sqrt(cardCount))
      const rows = Math.ceil(cardCount / cols)

      // Márgenes más generosos
      const marginLeft = 40
      const marginRight = 40
      const marginBottom = 40
      
      // Calcular tamaño de carta para que quepa en el espacio disponible
      const availableHeight = height - layoutTop - marginBottom
      const availableWidth = width - marginLeft - marginRight
      const gap = 8
      
      const maxCardWidth = (availableWidth - (cols - 1) * gap) / cols
      const maxCardHeight = (availableHeight - (rows - 1) * gap) / rows
      
      // Calcular tamaño manteniendo proporción de carta (ancho:alto = 1:1.5)
      // Ajustar para que quepa tanto en ancho como en alto
      let actualCardWidth = Math.min(maxCardWidth, maxCardHeight / 1.5)
      let actualCardHeight = actualCardWidth * 1.5
      
      // Si el alto calculado excede el disponible, ajustar
      if (actualCardHeight > maxCardHeight) {
        actualCardHeight = maxCardHeight
        actualCardWidth = actualCardHeight / 1.5
      }

      // Centrar el grid horizontalmente
      const totalGridWidth = cols * actualCardWidth + (cols - 1) * gap
      const startX = (width - totalGridWidth) / 2
      const startY = layoutTop

      // Dibujar cartas en grid con contadores
      for (let i = 0; i < uniqueCards.length; i++) {
        const { card, quantity } = uniqueCards[i]
        const col = i % cols
        const row = Math.floor(i / cols)

        const x = startX + col * (actualCardWidth + gap)
        const y = startY + row * (actualCardHeight + gap)

        try {
          const img = await loadImage(card.image)
          ctx.drawImage(img, x, y, actualCardWidth, actualCardHeight)
          
          // Dibujar contador si hay más de una copia
          if (quantity > 1) {
            // Fondo del contador (círculo más pequeño y más transparente, sin borde)
            const counterRadius = 15
            const counterX = x + actualCardWidth / 2
            const counterY = y + counterRadius
            
            ctx.beginPath()
            ctx.arc(counterX, counterY, counterRadius, 0, Math.PI * 2)
            ctx.fillStyle = "rgba(0, 0, 0, 0.4)"
            ctx.fill()
            
            // Texto del contador
            ctx.fillStyle = "white"
            ctx.font = "bold 16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.fillText(String(quantity), counterX, counterY)
            
            // Restaurar alineación por defecto
            ctx.textAlign = "left"
            ctx.textBaseline = "top"
          }
        } catch {
          // ignore
        }
      }

      return canvas.toDataURL("image/png", 1.0)
    } catch {
      return null
    }
  }

  // Abrir modal de exportación
  function handleExportImage() {
    setShowExportModal(true)
    setExportType("horizontal")
    setPreviewImageUrl(null)
  }

  // Generar vista previa cuando se abre el modal o cambia el tipo
  useEffect(() => {
    if (!showExportModal) return

    let cancelled = false
    setIsGeneratingPreview(true)
    setPreviewImageUrl(null)

    const generatePreview = async () => {
      const imageUrl = exportType === "horizontal" 
        ? await generateHorizontalImage()
        : await generateVerticalImage()
      
      if (!cancelled) {
        setPreviewImageUrl(imageUrl)
        setIsGeneratingPreview(false)
      }
    }

    generatePreview()

    return () => {
      cancelled = true
    }
  }, [showExportModal, exportType])

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
    if (currentDeck?.id) {
      const { trackDeckExported } = await import("@/lib/analytics/events");
      trackDeckExported(currentDeck.id, "image");
    }
    
    toastSuccess("Imagen del mazo exportada correctamente")
  }

  async function openLoadDialog() {
    if (!user) {
      toastError("Debes iniciar sesión para cargar mazos guardados")
      return
    }
    
    setIsLoadingDecks(true)
    setShowLoadDialog(true)
    
    try {
      // Usar la función que obtiene de la API primero, luego fallback a localStorage
      const decks = await getSavedDecksFromStorage(user.id)
      setSavedDecks(decks)
    } catch (error) {
      console.error("Error al cargar mazos:", error)
      // Fallback a localStorage si hay error
      setSavedDecks(getUserDecksFromLocalStorage(user.id))
    } finally {
      setIsLoadingDecks(false)
    }
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

  // Cargar cartas alternativas desde la API con cache
  const { cards: allCardsWithAlternatives } = useCards(true) // Incluir alternativas
  
  // Crear mapa de cartas que incluya alternativas para mostrar cartas reemplazadas en el mazo
  const cardMap = useMemo(() => {
    // allCardsWithAlternatives ya incluye todas las cartas (principales + alternativas)
    return new Map(allCardsWithAlternatives.map((card) => [card.id, card]))
  }, [allCardsWithAlternatives])

  // Crear mapa de cantidad total por baseId (considerando todas las variantes)
  const baseCardQuantityMap = useMemo(() => {
    const baseQuantityMap = new Map<string, number>()
    
    for (const deckCard of deckCards) {
      const baseId = getBaseCardId(deckCard.cardId)
      const currentQuantity = baseQuantityMap.get(baseId) || 0
      baseQuantityMap.set(baseId, currentQuantity + deckCard.quantity)
    }
    
    return baseQuantityMap
  }, [deckCards])

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

  // Detectar si estamos en móvil
  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth >= 1024) {
        setPanelHeight(200) // Reset cuando vuelve a desktop
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handlers para el drag del panel (solo en pantallas < 1024px)
  function handleDragStart(e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) {
    if (!isMobile) return
    
    setIsDragging(true)
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    setDragStartY(clientY)
    setDragStartHeight(panelHeight)
    
    // Prevenir scroll del fondo
    e.preventDefault()
    e.stopPropagation()
    
    // Prevenir scroll del body
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
  }

  function handleDragMove(e: MouseEvent | TouchEvent) {
    if (!isDragging || !isMobile) return
    
    // Prevenir scroll del fondo
    e.preventDefault()
    e.stopPropagation()
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const deltaY = dragStartY - clientY // Negativo cuando arrastra hacia arriba
    const maxHeight = getMaxHeight()
    const newHeight = Math.max(MIN_HEIGHT, Math.min(maxHeight, dragStartHeight + deltaY))
    setPanelHeight(newHeight)
  }

  function handleDragEnd() {
    if (!isDragging || !isMobile) return
    
    setIsDragging(false)
    
    // Restaurar scroll del body
    document.body.style.overflow = ''
    document.body.style.touchAction = ''
    
    const maxHeight = getMaxHeight()
    // Snap a posiciones cercanas
    const threshold = (maxHeight - MIN_HEIGHT) / 3
    if (panelHeight < MIN_HEIGHT + threshold) {
      setPanelHeight(MIN_HEIGHT)
    } else if (panelHeight > maxHeight - threshold) {
      setPanelHeight(maxHeight)
    } else {
      // Snap al medio
      setPanelHeight((MIN_HEIGHT + maxHeight) / 2)
    }
  }

  // Efectos para manejar eventos globales de drag
  useEffect(() => {
    if (isDragging && isMobile) {
      document.addEventListener('mousemove', handleDragMove)
      document.addEventListener('mouseup', handleDragEnd)
      document.addEventListener('touchmove', handleDragMove, { passive: false })
      document.addEventListener('touchend', handleDragEnd)
      
      return () => {
        document.removeEventListener('mousemove', handleDragMove)
        document.removeEventListener('mouseup', handleDragEnd)
        document.removeEventListener('touchmove', handleDragMove)
        document.removeEventListener('touchend', handleDragEnd)
      }
    }
  }, [isDragging, isMobile, dragStartY, dragStartHeight, panelHeight])

  // Actualizar altura cuando cambia el tamaño de la ventana
  useEffect(() => {
    if (!isMobile) return
    
    function updateMaxHeight() {
      const newMaxHeight = window.innerHeight * 0.85
      if (panelHeight > newMaxHeight) {
        setPanelHeight(newMaxHeight)
      }
    }
    
    window.addEventListener('resize', updateMaxHeight)
    return () => window.removeEventListener('resize', updateMaxHeight)
  }, [panelHeight, isMobile])

  // Prevenir scroll del fondo cuando el panel está expandido en móvil
  // PERO solo cuando el usuario está arrastrando el handle
  useEffect(() => {
    if (!isMobile) return
    
    if (isDragging && panelHeight > MIN_HEIGHT + 50) {
      // Solo prevenir scroll cuando se está arrastrando activamente
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    } else {
      // Permitir scroll del fondo siempre que no se esté arrastrando
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
    
    return () => {
      // Limpiar al desmontar o cambiar a desktop
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
  }, [isDragging, panelHeight, isMobile])

  const maxHeight = getMaxHeight()
  const overlayOpacity = isMobile && panelHeight > MIN_HEIGHT + 50 
    ? (panelHeight - MIN_HEIGHT) / (maxHeight - MIN_HEIGHT)
    : 0

  return (
    <>
      {/* Overlay cuando el panel está expandido en móvil */}
      {isMobile && panelHeight > MIN_HEIGHT + 50 && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity duration-300"
          onClick={() => setPanelHeight(MIN_HEIGHT)}
          onTouchMove={(e) => {
            // Solo prevenir si se está tocando el overlay, no el contenido debajo
            if (e.target === e.currentTarget) {
              e.preventDefault()
            }
          }}
          style={{
            opacity: overlayOpacity,
            pointerEvents: panelHeight > MIN_HEIGHT + 50 ? 'auto' : 'none',
          }}
        />
      )}
      
      <div 
        ref={panelRef}
        className="flex flex-col h-full lg:h-full bg-card overflow-hidden"
        style={{
          ...(isMobile ? {
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${panelHeight}px`,
            maxHeight: '85vh',
            zIndex: 40,
            transition: isDragging ? 'none' : 'height 0.3s ease-out',
            borderTopLeftRadius: '1rem',
            borderTopRightRadius: '1rem',
            boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
          } : {})
        }}
      >
        {/* Handle para arrastrar (solo visible en pantallas < 1024px) */}
        {isMobile && (
          <div
            className="flex items-center justify-center py-2 cursor-grab active:cursor-grabbing touch-none lg:hidden select-none"
            style={{ touchAction: 'none' }}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            onTouchMove={(e) => e.preventDefault()}
          >
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
            <GripVertical className="size-4 text-muted-foreground/50 ml-2" />
          </div>
        )}
        
        {/* Encabezado con nombre del mazo */}
        <DeckHeader
          deckName={deckName}
          onDeckNameChange={onDeckNameChange}
          deckFormat={deckFormat}
          onDeckFormatChange={onDeckFormatChange}
          currentDeck={currentDeck}
          allCards={allCards}
          onDragStart={isMobile ? handleDragStart : undefined}
          isMobile={isMobile}
        />

        {/* Estadísticas */}
        <DeckStatsSection stats={stats} />

        {/* Botones de acción */}
        <DeckActionsBar
          copied={copied}
          currentDeck={currentDeck}
          user={user}
          onCopyCode={handleCopyCode}
          onSave={handleSaveDeck}
          onLoad={openLoadDialog}
          onClear={onClearDeck}
          onExportImage={handleExportImage}
          onExportList={handleExportList}
        />

      {/* Lista de cartas del mazo */}
      <div 
        className="flex-1 overflow-y-auto p-2 sm:p-3 lg:p-4"
        onTouchStart={(e) => {
          // Prevenir que el scroll del fondo se active cuando se toca dentro del panel
          if (isMobile && panelHeight > MIN_HEIGHT + 50) {
            e.stopPropagation()
          }
        }}
        onWheel={(e) => {
          // Prevenir scroll del fondo cuando se hace scroll dentro del panel en móvil
          if (isMobile && panelHeight > MIN_HEIGHT + 50) {
            e.stopPropagation()
          }
        }}
      >
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
                              disabled={(() => {
                                // Verificar límite total de 50 cartas
                                if (stats.totalCards >= 50) return true
                                
                                // Verificar cantidad total considerando todas las variantes
                                const baseId = getBaseCardId(deckCard.cardId)
                                const totalQuantity = baseCardQuantityMap.get(baseId) || 0
                                const maxQuantity = deckFormat === "RE" ? card.banListRE : deckFormat === "RL" ? card.banListRL : card.banListLI
                                return totalQuantity >= maxQuantity
                              })()}
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
                                  backgroundImage: `url(${optimizeCloudinaryUrl(card.image, deviceType)})`,
                                  backgroundPosition: `center ${getCardBackgroundPositionY(card, cardMetadataMap)}`,
                                  backgroundSize: "135% auto",
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
            <DialogDescription>
              Selecciona un mazo guardado para cargarlo en el constructor.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {isLoadingDecks ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Cargando mazos...</span>
              </div>
            ) : decksWithMetadata.length === 0 ? (
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
                    className="relative overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20"
                    style={getBannerStyle(deck.backgroundImage, bannerSetting, deviceType)}
                  >
                    <div className="absolute inset-0" style={getOverlayStyle(bannerSetting)} />
                    
                    {/* Logo de edición */}
                          {(() => {
                      const logoUrl = getDeckEditionLogo(deck.cards, allCards)
                      if (!logoUrl) return null
                            const optimizedLogoUrl = optimizeCloudinaryUrl(logoUrl, deviceType)
                            const isOptimized = isCloudinaryOptimized(optimizedLogoUrl)
                            return (
                        <div className="absolute top-1.5 right-1.5 z-10">
                          <div className="relative w-12 h-12" title={deck.edition || "Múltiples ediciones"}>
                              <Image
                                src={optimizedLogoUrl}
                              alt={deck.edition || "Múltiples ediciones"}
                                fill
                                className="object-contain drop-shadow-lg"
                                sizes="48px"
                                unoptimized={isOptimized}
                              />
                        </div>
                      </div>
                      )
                    })()}

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
                        onClick={() => deck.id && handleDeleteDeck(deck.id)}
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
      {/* SaveDeckModal con lazy loading y Suspense */}
      {showSaveModal && (
        <Suspense fallback={null}>
      <SaveDeckModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveDeckConfirm}
        initialName={deckName}
        deckCards={deckCards}
        deckFormat={deckFormat}
        existingDeck={currentDeck || undefined}
        allCards={allCards}
      />
        </Suspense>
      )}

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
            <DialogDescription>
              Tu mazo ha sido guardado temporalmente. Para guardarlo permanentemente y acceder a todas las funciones, necesitas iniciar sesión o crear una cuenta.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
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

      {/* Modal de exportación de imagen */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
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
            <Button variant="outline" onClick={() => setShowExportModal(false)}>
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
      </div>
    </>
  )
}

