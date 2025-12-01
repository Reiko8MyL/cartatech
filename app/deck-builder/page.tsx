"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { FiltersPanel } from "@/components/deck-builder/filters-panel"
import { CardsPanel } from "@/components/deck-builder/cards-panel"
import { DeckManagementPanel } from "@/components/deck-builder/deck-management-panel"
import {
  getAllCards,
  sortCardsByEditionAndId,
  filterCards,
  calculateDeckStats,
  getUniqueEditions,
  getUniqueTypes,
  getUniqueRaces,
  getUniqueCosts,
  getSavedDecksFromLocalStorage,
  saveTemporaryDeck,
  getTemporaryDeck,
  clearTemporaryDeck,
} from "@/lib/deck-builder/utils"
import type {
  Card,
  DeckCard,
  DeckFilters,
  SavedDeck,
  DeckFormat,
} from "@/lib/deck-builder/types"
import { toastSuccess } from "@/lib/toast"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useAuth, type User } from "@/contexts/auth-context"
import { CardGridSkeleton } from "@/components/ui/card-grid-skeleton"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorBoundary } from "@/components/ui/error-boundary"

export default function DeckBuilderPage() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  
  // Cargar todas las cartas
  const allCards = useMemo(() => {
    const cards = getAllCards()
    const sorted = sortCardsByEditionAndId(cards)
    // Simular carga asíncrona para mostrar skeleton
    setTimeout(() => setIsLoadingCards(false), 300)
    return sorted
  }, [])

  // Estado del mazo
  const [deckName, setDeckName] = useState("Mi Mazo")
  const [deckCards, setDeckCards] = useState<DeckCard[]>([])
  const [deckFormat, setDeckFormat] = useState<DeckFormat>("RE")
  const [hasLoadedFromUrl, setHasLoadedFromUrl] = useState(false)
  const [clearDeckDialogOpen, setClearDeckDialogOpen] = useState(false)
  const [hasLoadedTemporaryDeck, setHasLoadedTemporaryDeck] = useState(false)
  const previousUserRef = useRef<User | null>(null)
  const [isLoadingCards, setIsLoadingCards] = useState(true)

  // Estado de filtros
  const [filters, setFilters] = useState<DeckFilters>({
    search: "",
    edition: "",
    type: "",
    race: "",
    cost: "",
  })

  // Filtrar cartas según los filtros
  const filteredCards = useMemo(() => {
    return filterCards(allCards, filters)
  }, [allCards, filters])

  // Calcular estadísticas del mazo - optimizado
  const deckStats = useMemo(() => {
    if (deckCards.length === 0) {
      return {
        totalCards: 0,
        totalCost: 0,
        averageCost: 0,
        cardsByType: {},
        cardsByEdition: {},
        hasOroIni: false,
      }
    }
    return calculateDeckStats(deckCards, allCards)
  }, [deckCards, allCards])

  // Obtener opciones para los filtros
  const availableEditions = useMemo(
    () => getUniqueEditions(allCards),
    [allCards]
  )
  const availableTypes = useMemo(() => getUniqueTypes(allCards), [allCards])
  const availableRaces = useMemo(() => getUniqueRaces(allCards), [allCards])
  const availableCosts = useMemo(() => getUniqueCosts(allCards), [allCards])

  // Crear un mapa de cartas para búsqueda rápida
  const cardLookupMap = useMemo(
    () => new Map(allCards.map((c) => [c.id, c])),
    [allCards]
  )

  // Funciones para gestionar el mazo - optimizadas
  const addCardToDeck = useCallback((cardId: string) => {
    const card = cardLookupMap.get(cardId)
    if (!card) return

    // Usar startTransition para actualizaciones no urgentes
    setDeckCards((prevDeckCards) => {
      // Búsqueda rápida con Map
      const existingIndex = prevDeckCards.findIndex((dc) => dc.cardId === cardId)
      const existingCard = existingIndex >= 0 ? prevDeckCards[existingIndex] : null
      const currentQuantity = existingCard?.quantity || 0

      // Verificar límites según el formato seleccionado
      const maxQuantity = deckFormat === "RE" ? card.banListRE : deckFormat === "RL" ? card.banListRL : card.banListLI
      if (currentQuantity >= maxQuantity) return prevDeckCards
      if (card.isUnique && currentQuantity >= 1) return prevDeckCards

      if (existingCard) {
        // Actualizar existente - crear nuevo array solo con el cambio
        const newDeckCards = [...prevDeckCards]
        newDeckCards[existingIndex] = { cardId, quantity: currentQuantity + 1 }
        return newDeckCards
      } else {
        // Agregar nuevo
        return [...prevDeckCards, { cardId, quantity: 1 }]
      }
    })
  }, [cardLookupMap])

  const removeCardFromDeck = useCallback((cardId: string) => {
    setDeckCards((prevDeckCards) =>
      prevDeckCards
        .map((dc) =>
          dc.cardId === cardId
            ? { ...dc, quantity: Math.max(0, dc.quantity - 1) }
            : dc
        )
        .filter((dc) => dc.quantity > 0)
    )
  }, [])

  function clearDeck() {
    setClearDeckDialogOpen(true)
  }

  function confirmClearDeck() {
    setDeckCards([])
    toastSuccess("Mazo borrado correctamente")
  }

  function loadDeck(deck: SavedDeck) {
    setDeckName(deck.name)
    setDeckCards(deck.cards)
    setDeckFormat(deck.format || "RE")
  }

  // Cargar mazo desde URL si existe el parámetro load
  useEffect(() => {
    if (hasLoadedFromUrl) return // Evitar cargar múltiples veces
    
    const loadDeckId = searchParams.get("load")
    if (loadDeckId) {
      const allDecks = getSavedDecksFromLocalStorage()
      const deckToLoad = allDecks.find((d) => d.id === loadDeckId)
      
      if (deckToLoad) {
        setDeckName(deckToLoad.name)
        setDeckCards(deckToLoad.cards)
        setDeckFormat(deckToLoad.format || "RE")
        setHasLoadedFromUrl(true)
      }
    }
  }, [searchParams, hasLoadedFromUrl])

  // Cargar mazo temporal al iniciar (solo una vez)
  useEffect(() => {
    if (hasLoadedTemporaryDeck || hasLoadedFromUrl) return
    
    const temporaryDeck = getTemporaryDeck()
    if (temporaryDeck && temporaryDeck.cards.length > 0) {
      setDeckName(temporaryDeck.name)
      setDeckCards(temporaryDeck.cards)
      setDeckFormat(temporaryDeck.format || "RE")
      setHasLoadedTemporaryDeck(true)
    }
  }, [hasLoadedTemporaryDeck, hasLoadedFromUrl])

  // Cargar mazo temporal cuando el usuario se autentica (después de login/registro)
  useEffect(() => {
    // Detectar cuando el usuario cambia de null a un usuario (autenticación)
    const justLoggedIn = !previousUserRef.current && user
    
    if (justLoggedIn && !hasLoadedFromUrl) {
      const temporaryDeck = getTemporaryDeck()
      if (temporaryDeck && temporaryDeck.cards.length > 0) {
        setDeckName(temporaryDeck.name)
        setDeckCards(temporaryDeck.cards)
        setDeckFormat(temporaryDeck.format || "RE")
        clearTemporaryDeck()
        toastSuccess("Mazo restaurado. Ahora puedes guardarlo.")
      }
    }
    
    // Actualizar la referencia del usuario anterior
    previousUserRef.current = user
  }, [user, hasLoadedFromUrl])

  // Guardar mazo temporal automáticamente cuando no hay usuario
  useEffect(() => {
    if (!user && (deckCards.length > 0 || deckName !== "Mi Mazo")) {
      saveTemporaryDeck(deckName, deckCards, deckFormat)
    }
  }, [deckName, deckCards, deckFormat, user])

  return (
    <>
      <ConfirmDialog
        open={clearDeckDialogOpen}
        onOpenChange={setClearDeckDialogOpen}
        title="Borrar Mazo"
        description="¿Estás seguro de que quieres borrar todo el mazo? Esta acción no se puede deshacer."
        confirmText="Borrar"
        cancelText="Cancelar"
        onConfirm={confirmClearDeck}
        variant="default"
      />
      <main className="w-full h-[calc(100vh-4rem)] flex flex-col px-2 sm:px-4 lg:px-6 py-4">
        <h1 className="sr-only">Deck Builder - Constructor de Mazos</h1>
        {/* Panel de filtros */}
      <div className="mb-3">
        <FiltersPanel
          filters={filters}
          onFiltersChange={setFilters}
          availableEditions={availableEditions}
          availableTypes={availableTypes}
          availableRaces={availableRaces}
          availableCosts={availableCosts}
        />
      </div>

      {/* Contenedor principal con dos paneles */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_450px] gap-3 min-h-0">
        {/* Panel izquierdo: Cartas disponibles */}
        <ErrorBoundary>
          <div className="border rounded-lg bg-card overflow-hidden">
            {isLoadingCards ? (
              <div className="h-full overflow-y-auto">
                <CardGridSkeleton count={12} columns={6} />
              </div>
            ) : (
              <div className="animate-in fade-in duration-300 h-full">
                <CardsPanel
                  cards={filteredCards}
                  deckCards={deckCards}
                  onAddCard={addCardToDeck}
                  onRemoveCard={removeCardFromDeck}
                  deckFormat={deckFormat}
                />
              </div>
            )}
          </div>
        </ErrorBoundary>

        {/* Panel derecho: Gestión del mazo */}
        <ErrorBoundary>
          <div className="border rounded-lg bg-card overflow-hidden">
            {isLoadingCards ? (
              <div className="flex flex-col h-full p-4 space-y-4">
                <Skeleton className="h-8 w-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-full" />
                  ))}
                </div>
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-20" />
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in duration-300 h-full">
                <DeckManagementPanel
                deckName={deckName}
                onDeckNameChange={setDeckName}
                deckCards={deckCards}
                allCards={allCards}
                stats={deckStats}
                onClearDeck={clearDeck}
                onLoadDeck={loadDeck}
                onAddCard={addCardToDeck}
                onRemoveCard={removeCardFromDeck}
                deckFormat={deckFormat}
                onDeckFormatChange={setDeckFormat}
              />
              </div>
            )}
          </div>
        </ErrorBoundary>
      </div>
    </main>
    </>
  )
}
