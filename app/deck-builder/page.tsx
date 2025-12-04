"use client"

import { useState, useMemo, useCallback, useEffect, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { FiltersPanel } from "@/components/deck-builder/filters-panel"
import { CardsPanel } from "@/components/deck-builder/cards-panel"
import { DeckManagementPanel } from "@/components/deck-builder/deck-management-panel"
import {
  getBaseCardId,
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
import { useCards } from "@/hooks/use-cards"
import { getDeckById } from "@/lib/api/decks"
import type {
  Card,
  DeckCard,
  DeckFilters,
  SavedDeck,
  DeckFormat,
} from "@/lib/deck-builder/types"
import { toastSuccess, toastError } from "@/lib/toast"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useAuth, type User } from "@/contexts/auth-context"
import { CardGridSkeleton } from "@/components/ui/card-grid-skeleton"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorBoundary } from "@/components/ui/error-boundary"

function DeckBuilderContent() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  
  // Cargar todas las cartas desde la API con cache
  const { cards: allCardsRaw, isLoading: isLoadingCardsFromAPI } = useCards(true) // Incluir alternativas
  const allCards = useMemo(() => {
    return sortCardsByEditionAndId(allCardsRaw)
  }, [allCardsRaw])

  // Actualizar estado de carga
  useEffect(() => {
    if (!isLoadingCardsFromAPI && allCards.length > 0) {
      const timer = setTimeout(() => setIsLoadingCards(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isLoadingCardsFromAPI, allCards.length])

  // Estado del mazo
  const [deckName, setDeckName] = useState("Mi Mazo")
  const [deckCards, setDeckCards] = useState<DeckCard[]>([])
  const [deckFormat, setDeckFormat] = useState<DeckFormat>("RE")
  const [currentDeck, setCurrentDeck] = useState<SavedDeck | null>(null) // Guardar el mazo completo cuando se carga desde URL
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

  // Crear un mapa de cartas para búsqueda rápida (incluyendo alternativas)
  // allCards ya incluye alternativas porque useCards(true) las incluye
  const cardLookupMap = useMemo(() => {
    return new Map(allCards.map((c) => [c.id, c]))
  }, [allCards])

  // Funciones para gestionar el mazo - optimizadas
  const addCardToDeck = useCallback((cardId: string) => {
    const card = cardLookupMap.get(cardId)
    if (!card) return

    // Calcular total de cartas actual ANTES de actualizar el estado
    const currentTotal = deckCards.reduce((sum, dc) => sum + dc.quantity, 0)
    
    // Verificar límite total de 50 cartas
    if (currentTotal >= 50) {
      return
    }

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
  }, [cardLookupMap, deckFormat, deckCards])

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

  // Estado para rastrear qué cartas han sido reemplazadas por alternativas
  const [cardReplacements, setCardReplacements] = useState<Map<string, string>>(new Map())

  // Función para reemplazar una carta por otra versión (arte alternativo)
  const replaceCardInDeck = useCallback((oldCardId: string, newCardId: string) => {
    setDeckCards((prevDeckCards) => {
      // Buscar la carta original en el mazo
      const oldCardIndex = prevDeckCards.findIndex((dc) => dc.cardId === oldCardId)
      if (oldCardIndex === -1) return prevDeckCards // No existe la carta original

      const oldCardQuantity = prevDeckCards[oldCardIndex].quantity

      // Buscar si la nueva carta ya existe en el mazo
      const newCardIndex = prevDeckCards.findIndex((dc) => dc.cardId === newCardId)

      // Crear nuevo array sin la carta original
      const newDeckCards = prevDeckCards.filter((_, index) => index !== oldCardIndex)

      if (newCardIndex !== -1 && newCardIndex < oldCardIndex) {
        // La nueva carta ya existe y está antes de la original
        // Sumar la cantidad a la existente
        const updatedIndex = newCardIndex
        newDeckCards[updatedIndex] = {
          ...newDeckCards[updatedIndex],
          quantity: newDeckCards[updatedIndex].quantity + oldCardQuantity,
        }
      } else if (newCardIndex !== -1 && newCardIndex > oldCardIndex) {
        // La nueva carta ya existe pero está después de la original
        // Ajustar el índice porque removimos la original
        const adjustedIndex = newCardIndex - 1
        newDeckCards[adjustedIndex] = {
          ...newDeckCards[adjustedIndex],
          quantity: newDeckCards[adjustedIndex].quantity + oldCardQuantity,
        }
      } else {
        // La nueva carta no existe, agregarla en la posición de la original
        newDeckCards.splice(oldCardIndex, 0, {
          cardId: newCardId,
          quantity: oldCardQuantity,
        })
      }

      // Actualizar el mapa de reemplazos
      setCardReplacements((prev) => {
        const baseId = getBaseCardId(oldCardId)
        const newMap = new Map(prev)
        newMap.set(baseId, newCardId)
        return newMap
      })

      return newDeckCards
    })
  }, [])

  // Limpiar reemplazos cuando se borra el mazo
  useEffect(() => {
    if (deckCards.length === 0) {
      setCardReplacements(new Map())
    }
  }, [deckCards.length])

  function clearDeck() {
    setClearDeckDialogOpen(true)
  }

  function confirmClearDeck() {
    setDeckCards([])
    setCurrentDeck(null) // Resetear el mazo actual al limpiar
    setDeckName("Mi Mazo") // Resetear el nombre al valor por defecto
    toastSuccess("Mazo borrado correctamente")
  }

  function loadDeck(deck: SavedDeck) {
    setDeckName(deck.name)
    setDeckCards(deck.cards)
    setDeckFormat(deck.format || "RE")
    setCurrentDeck(deck) // Guardar el mazo completo para poder actualizarlo después
    
    // Detectar cartas alternativas en el mazo y establecer reemplazos
    // allCards ya incluye alternativas, buscar por isCosmetic
    const altCardIds = new Set(
      allCards.filter((c) => c.isCosmetic).map((c) => c.id)
    )
    const replacements = new Map<string, string>()
    
    for (const deckCard of deck.cards) {
      if (altCardIds.has(deckCard.cardId)) {
        // Esta es una carta alternativa, establecer el reemplazo
        const baseId = getBaseCardId(deckCard.cardId)
        replacements.set(baseId, deckCard.cardId)
      }
    }
    
    setCardReplacements(replacements)
  }

  // Cargar mazo desde URL si existe el parámetro load
  useEffect(() => {
    if (hasLoadedFromUrl) return // Evitar cargar múltiples veces
    
    const loadDeckId = searchParams.get("load")
    if (loadDeckId) {
      const loadDeck = async () => {
        let deckToLoad: SavedDeck | null = null
        
        // Primero intentar cargar desde la API
        try {
          deckToLoad = await getDeckById(loadDeckId)
        } catch (error) {
          console.error("Error al obtener mazo desde API:", error)
        }
        
        // Si no se encuentra en la API, buscar en localStorage como fallback
        if (!deckToLoad) {
          const allDecks = getSavedDecksFromLocalStorage()
          deckToLoad = allDecks.find((d) => d.id === loadDeckId) || null
        }
        
        if (deckToLoad) {
          console.log("[DeckBuilder] Mazo cargado desde URL:", {
            id: deckToLoad.id,
            name: deckToLoad.name,
            hasId: !!deckToLoad.id,
            cards: deckToLoad.cards.length,
            format: deckToLoad.format,
          });
          setDeckName(deckToLoad.name)
          setDeckCards(deckToLoad.cards)
          setDeckFormat(deckToLoad.format || "RE")
          setCurrentDeck(deckToLoad) // Guardar el mazo completo con ID y metadatos
          setHasLoadedFromUrl(true)
          
          // Detectar cartas alternativas en el mazo y establecer reemplazos
          // allCards ya incluye alternativas, buscar por isCosmetic
          const altCardIds = new Set(
            allCards.filter((c) => c.isCosmetic).map((c) => c.id)
          )
          const replacements = new Map<string, string>()
          
          for (const deckCard of deckToLoad.cards) {
            if (altCardIds.has(deckCard.cardId)) {
              // Esta es una carta alternativa, establecer el reemplazo
              const baseId = getBaseCardId(deckCard.cardId)
              replacements.set(baseId, deckCard.cardId)
            }
          }
          
          setCardReplacements(replacements)
        } else {
          console.warn("[DeckBuilder] No se encontró el mazo con ID:", loadDeckId);
        }
      }
      
      loadDeck()
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
      
      // Detectar cartas alternativas en el mazo y establecer reemplazos
      // allCards ya incluye alternativas, buscar por isCosmetic
      const altCardIds = new Set(
        allCards.filter((c) => c.isCosmetic).map((c) => c.id)
      )
      const replacements = new Map<string, string>()
      
      for (const deckCard of temporaryDeck.cards) {
        if (altCardIds.has(deckCard.cardId)) {
          // Esta es una carta alternativa, establecer el reemplazo
          const baseId = getBaseCardId(deckCard.cardId)
          replacements.set(baseId, deckCard.cardId)
        }
      }
      
      setCardReplacements(replacements)
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
        
        // Detectar cartas alternativas en el mazo y establecer reemplazos
        // allCards ya incluye alternativas, buscar por isCosmetic
        const altCardIds = new Set(
          allCards.filter((c) => c.isCosmetic).map((c) => c.id)
        )
        const replacements = new Map<string, string>()
        
        for (const deckCard of temporaryDeck.cards) {
          if (altCardIds.has(deckCard.cardId)) {
            // Esta es una carta alternativa, establecer el reemplazo
            const baseId = getBaseCardId(deckCard.cardId)
            replacements.set(baseId, deckCard.cardId)
          }
        }
        
        setCardReplacements(replacements)
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
                  onReplaceCard={replaceCardInDeck}
                  deckFormat={deckFormat}
                  cardReplacements={cardReplacements}
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
                currentDeck={currentDeck}
                onCurrentDeckChange={setCurrentDeck}
                cardReplacements={cardReplacements}
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

export default function DeckBuilderPage() {
  return (
    <Suspense fallback={
      <main className="w-full h-[calc(100vh-4rem)] flex flex-col px-2 sm:px-4 lg:px-6 py-4">
        <div className="mb-3">
          <div className="h-20 bg-muted animate-pulse rounded-lg" />
        </div>
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_450px] gap-3 min-h-0">
          <div className="border rounded-lg bg-card overflow-hidden">
            <CardGridSkeleton count={12} columns={6} />
          </div>
          <div className="border rounded-lg bg-card overflow-hidden p-4 space-y-4">
            <Skeleton className="h-8 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        </div>
      </main>
    }>
      <DeckBuilderContent />
    </Suspense>
  )
}
