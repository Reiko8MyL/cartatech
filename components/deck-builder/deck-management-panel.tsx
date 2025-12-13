"use client"

import { useState, useMemo, useRef, useEffect, Suspense } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  GripVertical,
} from "lucide-react"
import type { DeckCard, DeckStats, SavedDeck, DeckFormat } from "@/lib/deck-builder/types"
import type { Card as CardType } from "@/lib/deck-builder/types"
import {
  generateDeckCode,
  getUserDecksFromLocalStorage,
  getSavedDecksFromLocalStorage,
  deleteDeckFromLocalStorage,
  saveTemporaryDeck,
  getDeckRace,
  getDeckEdition,
  getDeckBackgroundImage,
  calculateDeckStats,
  getSavedDecksFromStorage,
  getBaseCardId,
  getCardBackgroundPositionY,
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

// Lazy load componentes pesados
const ExportImageModal = dynamic(
  () => import("./export-image-modal").then((mod) => ({ default: mod.ExportImageModal })),
  {
    loading: () => null
  }
)

const LoadDeckDialog = dynamic(
  () => import("./load-deck-dialog").then((mod) => ({ default: mod.LoadDeckDialog })),
  {
    loading: () => null
  }
)

import { useAuth } from "@/contexts/auth-context"
import { toastSuccess, toastError } from "@/lib/toast"
import { getAllCardsMetadata } from "@/lib/api/cards"
import { DeckHeader } from "./deck-header"
import { DeckStatsSection } from "./deck-stats-section"
import { DeckActionsBar } from "./deck-actions-bar"
import { DeckCardsList } from "./deck-cards-list"
import { useMobilePanelDrag } from "@/hooks/use-mobile-panel-drag"
import { useBannerSettings, useDeviceType } from "@/hooks/use-banner-settings"

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
  
  // Metadatos de cartas (ajustes personalizados de posición Y)
  const [cardMetadataMap, setCardMetadataMap] = useState<Record<string, number>>({})
  
  // Estados para el panel deslizable (solo en pantallas < 1024px)
  const [isMobile, setIsMobile] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  
  // Alturas mínima y máxima del panel
  const MIN_HEIGHT = 120 // Solo muestra el header cuando está colapsado
  const getMaxHeight = () => typeof window !== "undefined" ? window.innerHeight * 0.85 : 800
  
  // Usar hook para drag del panel móvil
  const {
    panelHeight,
    isDragging,
    overlayOpacity,
    handleDragStart: handleMobileDragStart,
    collapsePanel,
  } = useMobilePanelDrag({
    minHeight: MIN_HEIGHT,
    getMaxHeight,
    isMobile,
  })

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

  // Funciones de exportación de imágenes movidas a lib/deck-builder/export-image-utils.ts

  // Abrir modal de exportación
  function handleExportImage() {
    setShowExportModal(true)
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
        race: race ?? undefined,
        edition: edition ?? undefined,
        backgroundImage: backgroundImage ?? undefined,
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
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const maxHeight = getMaxHeight()

  return (
    <>
      {/* Overlay cuando el panel está expandido en móvil */}
      {isMobile && panelHeight > MIN_HEIGHT + 50 && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity duration-300"
          onClick={collapsePanel}
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
            onMouseDown={handleMobileDragStart}
            onTouchStart={handleMobileDragStart}
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
          onDragStart={isMobile ? handleMobileDragStart : undefined}
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
      >
        <DeckCardsList
          cardsByTypeGrouped={cardsByTypeGrouped}
          cardMap={cardMap}
          baseCardQuantityMap={baseCardQuantityMap}
          cardMetadataMap={cardMetadataMap}
          deckFormat={deckFormat}
          stats={stats}
          onAddCard={onAddCard}
          onRemoveCard={onRemoveCard}
          isMobile={isMobile}
          panelHeight={panelHeight}
          minHeight={MIN_HEIGHT}
        />
      </div>

      {/* Dialog para cargar mazos guardados */}
      <LoadDeckDialog
        isOpen={showLoadDialog}
        onClose={() => setShowLoadDialog(false)}
        decks={decksWithMetadata}
        isLoading={isLoadingDecks}
        allCards={allCards}
        onLoadDeck={handleLoadDeck}
        onDeleteDeck={handleDeleteDeck}
      />

      {/* Modal para guardar mazo */}
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

      {/* Modal de exportación de imagen */}
      {showExportModal && (
        <Suspense fallback={null}>
          <ExportImageModal
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            deckName={deckName}
            deckCards={deckCards}
            stats={stats}
            allCards={allCards}
            cardMap={cardMap}
            currentDeckId={currentDeck?.id}
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
      </div>
    </>
  )
}
