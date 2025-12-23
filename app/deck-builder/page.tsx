"use client"

import { useState, useMemo, useCallback, useEffect, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import { FiltersPanel } from "@/components/deck-builder/filters-panel"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core"

// Lazy load componentes pesados - DeckManagementPanel es muy grande (1810 líneas)
const CardsPanel = dynamic(
  () => import("@/components/deck-builder/cards-panel").then((mod) => ({ default: mod.CardsPanel })),
  {
    loading: () => <CardGridSkeleton count={12} columns={6} />
  }
)

const DeckManagementPanel = dynamic(
  () => import("@/components/deck-builder/deck-management-panel").then((mod) => ({ default: mod.DeckManagementPanel })),
  {
    loading: () => (
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
    )
  }
)
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
import { useQuery } from "@tanstack/react-query"
import { getAllCardsFromAPI } from "@/lib/api/cards"
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
import Image from "next/image"
import { optimizeCloudinaryUrl } from "@/lib/deck-builder/cloudinary-utils"

function DeckBuilderContent() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  
  // Sensores para drag & drop (optimizado para respuesta rápida)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Reducido a 3px para activación más rápida
      },
    }),
    useSensor(KeyboardSensor)
  )
  
  // Estado para el overlay de drag
  const [activeCardId, setActiveCardId] = useState<string | null>(null)
  
  // Cargar solo cartas originales (sin alternativas) para mejorar rendimiento inicial
  // Las alternativas se cargarán solo cuando se abra el modal en CardsPanel
  const { cards: allCardsRaw, isLoading: isLoadingCardsFromAPI } = useCards(false) // NO incluir alternativas inicialmente
  const allCards = useMemo(() => {
    return sortCardsByEditionAndId(allCardsRaw)
  }, [allCardsRaw])

  // Estado del mazo
  const [deckName, setDeckName] = useState("Mi Mazo")
  const [deckCards, setDeckCards] = useState<DeckCard[]>([])

  // Cargar cartas alternativas cuando hay cartas en el mazo (para calcular estadísticas correctamente)
  const hasCardsInDeck = deckCards.length > 0
  const { data: allCardsWithAlternatives = [] } = useQuery({
    queryKey: ["cards", "with-alternatives"],
    queryFn: () => getAllCardsFromAPI(true),
    enabled: hasCardsInDeck, // Solo cargar cuando hay cartas en el mazo
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  // Usar cartas con alternativas para calcular estadísticas si hay cartas en el mazo
  const allCardsForStats = useMemo(() => {
    if (hasCardsInDeck && allCardsWithAlternatives.length > 0) {
      return sortCardsByEditionAndId(allCardsWithAlternatives)
    }
    return allCards
  }, [hasCardsInDeck, allCardsWithAlternatives, allCards])

  // Actualizar estado de carga
  useEffect(() => {
    if (!isLoadingCardsFromAPI && allCards.length > 0) {
      const timer = setTimeout(() => setIsLoadingCards(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isLoadingCardsFromAPI, allCards.length])
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
    descriptionSearch: "",
    edition: [],
    type: [],
    race: [],
    cost: [],
    showOnlyUnique: false,
    showOnlyBanned: false,
    showOnlyRework: false,
    showOnlyAvailable: false,
  })

  // Filtrar cartas según los filtros (solo cartas originales, no alternativas)
  const filteredCards = useMemo(() => {
    // Filtrar solo cartas originales (no isCosmetic)
    const originalCardsOnly = allCards.filter((card) => !card.isCosmetic)
    return filterCards(originalCardsOnly, filters, deckFormat)
  }, [allCards, filters, deckFormat])

  // Calcular estadísticas del mazo - optimizado
  // Usar allCardsForStats que incluye alternativas cuando hay cartas en el mazo
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
    return calculateDeckStats(deckCards, allCardsForStats)
  }, [deckCards, allCardsForStats])

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
        // Agregar nuevo - tracking de analytics
        if (typeof window !== "undefined") {
          import("@/lib/analytics/events").then(({ trackCardAddedToDeck }) => {
            trackCardAddedToDeck(cardId, card.name);
          });
        }
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
  const reorderCards = useCallback((startIndex: number, endIndex: number) => {
    setDeckCards((prevDeckCards) => {
      // Filtrar solo cartas con cantidad > 0 para obtener el array ordenado
      const filteredCards = prevDeckCards.filter((dc) => dc.quantity > 0)
      
      // Reordenar en el array filtrado
      const [removed] = filteredCards.splice(startIndex, 1)
      filteredCards.splice(endIndex, 0, removed)
      
      // Crear un mapa de cardId -> nueva posición
      const newOrderMap = new Map(filteredCards.map((dc, index) => [dc.cardId, index]))
      
      // Reordenar el array completo manteniendo las cartas con cantidad 0 al final
      const cardsWithQuantity = prevDeckCards.filter((dc) => dc.quantity > 0)
      const cardsWithoutQuantity = prevDeckCards.filter((dc) => dc.quantity === 0)
      
      // Ordenar las cartas con cantidad según el nuevo orden
      const reorderedCardsWithQuantity = cardsWithQuantity.sort((a, b) => {
        const indexA = newOrderMap.get(a.cardId) ?? Infinity
        const indexB = newOrderMap.get(b.cardId) ?? Infinity
        return indexA - indexB
      })
      
      // Combinar: cartas reordenadas primero, luego las sin cantidad
      return [...reorderedCardsWithQuantity, ...cardsWithoutQuantity]
    })
  }, [])

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
          // Verificar si el usuario actual es el creador del mazo
          const isOwner = user && deckToLoad.userId && user.id === deckToLoad.userId
          
          // Si el usuario NO es el creador (o no está autenticado), crear una copia sin ID para que se guarde como nuevo mazo
          if (!isOwner && deckToLoad.id) {
            console.log("[DeckBuilder] Usuario no es el creador, creando copia del mazo:", {
              originalId: deckToLoad.id,
              originalName: deckToLoad.name,
              userId: user?.id,
              deckOwnerId: deckToLoad.userId,
            });
            
            // Crear una copia del mazo sin ID y con nombre modificado
            const copiedDeck: SavedDeck = {
              ...deckToLoad,
              id: undefined, // Eliminar el ID para que se guarde como nuevo mazo
              name: `${deckToLoad.name} (Copia)`, // Agregar "(Copia)" al nombre
              description: undefined, // Resetear descripción
              userId: user?.id || "", // Asignar al usuario actual
              author: undefined, // Resetear autor (será el usuario actual al guardar)
              isPublic: false, // Por defecto, las copias son privadas
              publishedAt: undefined, // Eliminar fecha de publicación
              techCardId: undefined, // Resetear carta tech
              tags: undefined, // Resetear tags
              viewCount: 0, // Resetear contador de vistas
            }
            
            console.log("[DeckBuilder] Copia del mazo creada:", {
              name: copiedDeck.name,
              hasId: !!copiedDeck.id,
              cards: copiedDeck.cards.length,
              format: copiedDeck.format,
            });
            
            setDeckName(copiedDeck.name)
            setDeckCards(copiedDeck.cards)
            setDeckFormat(copiedDeck.format || "RE")
            setCurrentDeck(copiedDeck) // Guardar la copia sin ID
            setHasLoadedFromUrl(true)
            
            // Detectar cartas alternativas en el mazo y establecer reemplazos
            const altCardIds = new Set(
              allCards.filter((c) => c.isCosmetic).map((c) => c.id)
            )
            const replacements = new Map<string, string>()
            
            for (const deckCard of copiedDeck.cards) {
              if (altCardIds.has(deckCard.cardId)) {
                const baseId = getBaseCardId(deckCard.cardId)
                replacements.set(baseId, deckCard.cardId)
              }
            }
            
            setCardReplacements(replacements)
            
            // Mostrar mensaje informativo
            if (user) {
              toastSuccess("Mazo copiado. Puedes editarlo y guardarlo como tu propio mazo.")
            } else {
              toastSuccess("Mazo copiado. Inicia sesión para guardarlo como tu propio mazo.")
            }
          } else {
            // El usuario es el creador, cargar el mazo normalmente para edición
            console.log("[DeckBuilder] Mazo cargado desde URL:", {
              id: deckToLoad.id,
              name: deckToLoad.name,
              hasId: !!deckToLoad.id,
              cards: deckToLoad.cards.length,
              format: deckToLoad.format,
              isOwner,
            });
            
            setDeckName(deckToLoad.name)
            setDeckCards(deckToLoad.cards)
            setDeckFormat(deckToLoad.format || "RE")
            setCurrentDeck(deckToLoad) // Guardar el mazo completo con ID y metadatos
            setHasLoadedFromUrl(true)
            
            // Detectar cartas alternativas en el mazo y establecer reemplazos
            const altCardIds = new Set(
              allCards.filter((c) => c.isCosmetic).map((c) => c.id)
            )
            const replacements = new Map<string, string>()
            
            for (const deckCard of deckToLoad.cards) {
              if (altCardIds.has(deckCard.cardId)) {
                const baseId = getBaseCardId(deckCard.cardId)
                replacements.set(baseId, deckCard.cardId)
              }
            }
            
            setCardReplacements(replacements)
          }
        } else {
          console.warn("[DeckBuilder] No se encontró el mazo con ID:", loadDeckId);
        }
      }
      
      loadDeck()
    }
  }, [searchParams, hasLoadedFromUrl, user, allCards])

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
      <main id="main-content" className="w-full h-full flex flex-col px-2 sm:px-4 lg:px-6 pb-0">
        <h1 className="sr-only">Deck Builder - Constructor de Mazos</h1>
        
        {/* Panel de filtros - Solo visible en móvil/tablet */}
        <div className="mb-0 lg:hidden">
          <FiltersPanel
            filters={filters}
            onFiltersChange={setFilters}
            availableEditions={availableEditions}
            availableTypes={availableTypes}
            availableRaces={availableRaces}
            availableCosts={availableCosts}
            deckFormat={deckFormat}
          />
        </div>

        {/* Contenedor principal con dos paneles */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          autoScroll={{ threshold: { x: 0.2, y: 0.2 }, acceleration: 10, interval: 5 }}
          onDragStart={(event) => {
            if (event.active.data.current?.type === "card") {
              setActiveCardId(event.active.id as string)
            }
          }}
          onDragEnd={(event: DragEndEvent) => {
            setActiveCardId(null)
            const { active, over } = event
            
            if (!over || active.id === over.id) return
            
            // Si se arrastra una carta al panel del mazo
            if (active.data.current?.type === "card" && over.id === "deck-panel") {
              const cardId = active.id as string
              addCardToDeck(cardId)
            }
          }}
          onDragCancel={() => {
            setActiveCardId(null)
          }}
        >
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_450px] gap-0 min-h-0">
          {/* Panel izquierdo: Filtros compactos (solo desktop) + Cartas disponibles */}
          <div className="flex flex-col min-h-0">
            {/* Panel de filtros compacto - Solo visible en desktop */}
            <div className="hidden lg:block mb-0">
              <FiltersPanel
                filters={filters}
                onFiltersChange={setFilters}
                availableEditions={availableEditions}
                availableTypes={availableTypes}
                availableRaces={availableRaces}
                availableCosts={availableCosts}
                deckFormat={deckFormat}
              />
            </div>
            
            {/* Panel de cartas - Con Suspense para mejor manejo de carga */}
            <ErrorBoundary>
              <div className="flex-1 border rounded-lg bg-card overflow-hidden min-h-0">
                {isLoadingCards ? (
                  <div className="h-full overflow-y-auto">
                    <CardGridSkeleton count={12} columns={6} />
                  </div>
                ) : (
                  <Suspense fallback={<CardGridSkeleton count={12} columns={6} />}>
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
                  </Suspense>
                )}
              </div>
            </ErrorBoundary>
          </div>

          {/* Panel derecho: Gestión del mazo - Con Suspense y lazy loading */}
          <ErrorBoundary>
            <div className="border rounded-lg bg-card overflow-hidden lg:h-full">
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
                <Suspense fallback={
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
                }>
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
                  onReorderCards={reorderCards}
                  deckFormat={deckFormat}
                  onDeckFormatChange={setDeckFormat}
                  currentDeck={currentDeck}
                  onCurrentDeckChange={setCurrentDeck}
                  cardReplacements={cardReplacements}
                />
                </div>
                </Suspense>
              )}
            </div>
          </ErrorBoundary>
        </div>
        
        {/* Drag Overlay - Muestra la carta mientras se arrastra (sin animaciones para mejor rendimiento) */}
        <DragOverlay dropAnimation={null}>
          {activeCardId ? (() => {
            const card = allCards.find(c => c.id === activeCardId)
            if (!card) return null
            return (
              <div className="aspect-[63/88] w-32 rounded-2xl overflow-hidden opacity-95 rotate-3 shadow-2xl" style={{ willChange: 'transform' }}>
                <Image
                  src={optimizeCloudinaryUrl(card.image, "desktop")}
                  alt={card.name}
                  width={200}
                  height={280}
                  className="w-full h-full object-cover"
                  unoptimized
                  priority
                />
              </div>
            )
          })() : null}
        </DragOverlay>
        </DndContext>
      </main>
    </>
  )
}

export default function DeckBuilderPage() {
  return (
    <Suspense fallback={
      <main id="main-content" className="w-full h-full flex flex-col px-2 sm:px-4 lg:px-6 pb-0">
        {/* Panel de filtros - Solo visible en móvil/tablet */}
        <div className="mb-0 lg:hidden">
          <div className="h-20 bg-muted animate-pulse rounded-lg" />
        </div>
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_450px] gap-0 min-h-0">
          {/* Panel izquierdo: Filtros compactos (solo desktop) + Cartas */}
          <div className="flex flex-col min-h-0">
            {/* Panel de filtros compacto - Solo visible en desktop */}
            <div className="hidden lg:block mb-0">
              <div className="h-20 bg-muted animate-pulse rounded-lg" />
            </div>
            <div className="flex-1 border rounded-lg bg-card overflow-hidden min-h-0">
              <CardGridSkeleton count={12} columns={6} />
            </div>
          </div>
          {/* Panel derecho: Gestión del mazo */}
          <div className="border rounded-lg bg-card overflow-hidden lg:h-full p-4 space-y-4">
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
