"use client"

import { useState, useMemo, useCallback, useEffect, Suspense, useTransition, memo, useDeferredValue } from "react"
import { useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import { FiltersPanel } from "@/components/deck-builder/filters-panel"
import { CollectionModePanel } from "@/components/galeria/collection-mode-panel"
import { CardItemWrapper } from "@/components/galeria/card-item-wrapper"
import { EDITION_LOGOS } from "@/lib/deck-builder/utils"
import Image from "next/image"

// Lazy load del modal pesado - solo se carga cuando se necesita
const CardInfoModal = dynamic(
  () => import("@/components/deck-builder/card-info-modal").then((mod) => ({ default: mod.CardInfoModal })),
  {
    loading: () => null // No mostrar loading, el modal se abre después
  }
)
import { useAuth } from "@/contexts/auth-context"
import { CardGridSkeleton } from "@/components/ui/card-grid-skeleton"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import {
  sortCardsByEditionAndId,
  filterCards,
  getUniqueEditions,
  getUniqueTypes,
  getUniqueRaces,
  getUniqueCosts,
  getBaseCardId,
} from "@/lib/deck-builder/utils"
import { useCards } from "@/hooks/use-cards"
import { useQuery } from "@tanstack/react-query"
import { getAllCardsFromAPI } from "@/lib/api/cards"
import type { Card, DeckCard, DeckFilters } from "@/lib/deck-builder/types"

const COLLECTION_STORAGE_KEY = "myl_collection"


/**
 * Carga la colección desde localStorage (fallback)
 */
function loadCollectionFromLocalStorage(): Set<string> {
  if (typeof window === "undefined") return new Set()

  try {
    const data = localStorage.getItem(COLLECTION_STORAGE_KEY)
    if (!data) return new Set()
    const cardIds = JSON.parse(data) as string[]
    return new Set(cardIds)
  } catch {
    return new Set()
  }
}

/**
 * Guarda la colección en localStorage (fallback)
 */
function saveCollectionToLocalStorage(cardIds: Set<string>): void {
  if (typeof window === "undefined") return

  try {
    const array = Array.from(cardIds)
    localStorage.setItem(COLLECTION_STORAGE_KEY, JSON.stringify(array))
  } catch {
    // Ignorar errores de localStorage
  }
}

/**
 * Carga la colección desde la API con fallback a localStorage
 */
async function loadCollectionFromStorage(userId: string): Promise<Set<string>> {
  if (typeof window === "undefined") return new Set()

  try {
    const { getUserCollection } = await import("@/lib/api/collection");
    const cardIds = await getUserCollection(userId);
    return new Set(cardIds);
  } catch (error) {
    console.error("Error al cargar colección desde API, usando localStorage:", error);
    return loadCollectionFromLocalStorage();
  }
}

/**
 * Alterna una carta en la colección usando API con fallback a localStorage
 */
async function toggleCardInCollectionStorage(
  userId: string,
  cardId: string,
  currentCollection: Set<string>
): Promise<Set<string>> {
  if (typeof window === "undefined") return currentCollection

  try {
    const { toggleCardInCollection } = await import("@/lib/api/collection");
    const result = await toggleCardInCollection(userId, cardId);
    return new Set(result.cardIds);
  } catch (error) {
    console.error("Error al actualizar colección en API, usando localStorage:", error);
    // Fallback: actualizar localStorage
    const newCollection = new Set(currentCollection);
    if (newCollection.has(cardId)) {
      newCollection.delete(cardId);
    } else {
      newCollection.add(cardId);
    }
    saveCollectionToLocalStorage(newCollection);
    return newCollection;
  }
}

function GaleriaContent() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [isPending, startTransition] = useTransition()
  
  // Cargar solo cartas originales (sin alternativas) para mejorar rendimiento inicial
  // Las alternativas se cargarán solo cuando se abra el modal
  const { cards: allCards, isLoading: isLoadingCardsFromAPI } = useCards(false) // NO incluir alternativas inicialmente
  
  // Ordenar cartas por edición e ID - memoizado
  const sortedCards = useMemo(() => {
    if (allCards.length === 0) return []
    return sortCardsByEditionAndId(allCards)
  }, [allCards])
  
  // Estado del modal (declarar antes de usarlo en useQuery)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Precargar alternativas cuando se abre el modal (usando React Query para cache)
  const { data: allCardsWithAlternatives = [] } = useQuery<Card[]>({
    queryKey: ["cards", "with-alternatives"],
    queryFn: () => getAllCardsFromAPI(true),
    enabled: isModalOpen, // Solo cargar cuando el modal está abierto
    staleTime: 10 * 60 * 1000, // Cache por 10 minutos
    gcTime: 30 * 60 * 1000,
  })
  
  // Estado de carga - sin delay artificial
  const isLoading = isLoadingCardsFromAPI || sortedCards.length === 0

  // Leer el parámetro de búsqueda de la URL
  const searchFromUrl = searchParams.get("search") || ""

  // Estado de filtros
  const [filters, setFilters] = useState<DeckFilters>({
    search: searchFromUrl,
    descriptionSearch: "",
    edition: [],
    type: [],
    race: [],
    cost: [],
    showOnlyUnique: false,
    showOnlyBanned: false,
    showOnlyRework: false,
  })
  
  // Usar deferred value para búsquedas de texto - no bloquea la UI
  const deferredFilters = useDeferredValue(filters)

  // Actualizar filtros cuando cambie el parámetro de búsqueda en la URL
  useEffect(() => {
    setFilters((prev) => {
      if (prev.search !== searchFromUrl) {
        return {
          ...prev,
          search: searchFromUrl,
        }
      }
      return prev
    })
  }, [searchFromUrl])

  // Estado del modo colección - solo disponible para usuarios autenticados
  const [isCollectionMode, setIsCollectionMode] = useState(false)
  const [collectedCards, setCollectedCards] = useState<Set<string>>(() =>
    user ? loadCollectionFromLocalStorage() : new Set()
  )
  const [isLoadingCollection, setIsLoadingCollection] = useState(false)
  const [loadingCards, setLoadingCards] = useState<Set<string>>(new Set())

  // Cargar colección desde la API cuando el usuario se autentica
  useEffect(() => {
    if (user) {
      setIsLoadingCollection(true);
      loadCollectionFromStorage(user.id)
        .then((collection) => {
          setCollectedCards(collection);
          // Sincronizar con localStorage como backup
          saveCollectionToLocalStorage(collection);
        })
        .catch((error) => {
          console.error("Error al cargar colección:", error);
          // Ya se hizo fallback en loadCollectionFromStorage
        })
        .finally(() => {
          setIsLoadingCollection(false);
        });
    } else {
      // Si no hay usuario, limpiar la colección
      setCollectedCards(new Set());
    }
  }, [user])

  // Desactivar modo colección si el usuario cierra sesión
  useEffect(() => {
    if (!user && isCollectionMode) {
      setIsCollectionMode(false)
    }
  }, [user, isCollectionMode])

  // Filtrar cartas según los filtros - optimizado con deferred value y startTransition
  // En galería usamos formato RE por defecto para el filtro de ban list
  const filteredCards = useMemo(() => {
    if (sortedCards.length === 0) return []
    return filterCards(sortedCards, deferredFilters, "RE")
  }, [sortedCards, deferredFilters])

  // Obtener opciones para los filtros
  const availableEditions = useMemo(
    () => getUniqueEditions(sortedCards),
    [sortedCards]
  )
  const availableTypes = useMemo(() => getUniqueTypes(sortedCards), [sortedCards])
  const availableRaces = useMemo(() => getUniqueRaces(sortedCards), [sortedCards])
  const availableCosts = useMemo(() => getUniqueCosts(sortedCards), [sortedCards])

  // Funciones para manejar el modo colección (solo si el usuario está autenticado)
  const toggleCardCollection = useCallback(async (cardId: string) => {
    if (!user) return
    
    // Prevenir múltiples clicks
    if (loadingCards.has(cardId)) return;
    setLoadingCards((prev) => new Set(prev).add(cardId));
    
    // Guardar el estado anterior para poder revertir si falla
    let previousCollection: Set<string> = new Set();
    
    // Actualización optimista: actualizar UI inmediatamente
    setCollectedCards((prev) => {
      previousCollection = new Set(prev); // Guardar estado anterior
      const newSet = new Set(prev)
      if (newSet.has(cardId)) {
        newSet.delete(cardId)
      } else {
        newSet.add(cardId)
      }
      return newSet
    })

    // Actualizar en la API (con fallback a localStorage)
    try {
      const updatedCollection = await toggleCardInCollectionStorage(
        user.id,
        cardId,
        previousCollection
      );
      // Actualizar con la respuesta de la API (por si hay diferencias)
      setCollectedCards(updatedCollection);
      // Sincronizar con localStorage como backup
      saveCollectionToLocalStorage(updatedCollection);
    } catch (error) {
      console.error("Error al actualizar colección:", error);
      // Revertir cambio optimista si falla
      setCollectedCards(previousCollection);
      const { toastError } = await import("@/lib/toast");
      toastError("Error al actualizar la colección. Por favor, intenta nuevamente.");
    } finally {
      setLoadingCards((prev) => {
        const next = new Set(prev);
        next.delete(cardId);
        return next;
      });
    }
  }, [user, loadingCards])

  // Manejar click derecho en carta (abrir modal) - memoizado
  const handleCardRightClick = useCallback((e: React.MouseEvent, card: Card) => {
    e.preventDefault()
    setSelectedCard(card)
    setIsModalOpen(true)
  }, [])

  // Manejar click izquierdo en carta - memoizado
  const handleCardClick = useCallback(
    (card: Card) => {
      // Siempre abrir modal con click izquierdo
      setSelectedCard(card)
      setIsModalOpen(true)
      // React Query cargará las alternativas automáticamente cuando isModalOpen sea true
    },
    []
  )
  
  // Memoizar toggleCardCollection para evitar re-renders
  const memoizedToggleCardCollection = useCallback(
    (cardId: string) => {
      toggleCardCollection(cardId)
    },
    [toggleCardCollection]
  )

  // Agrupar cartas por edición - optimizado
  const cardsByEdition = useMemo(() => {
    if (filteredCards.length === 0) return new Map<string, Card[]>()
    const map = new Map<string, Card[]>()
    for (const card of filteredCards) {
      if (!map.has(card.edition)) {
        map.set(card.edition, [])
      }
      map.get(card.edition)!.push(card)
    }
    return map
  }, [filteredCards])

  const editionOrder = [
    "Espada Sagrada",
    "Helénica",
    "Hijos de Daana",
    "Dominios de Ra",
    "Drácula",
  ]

  // Contador de cartas filtradas
  const filteredCount = filteredCards.length
  const totalCount = allCards.length
  const hasActiveFilters = filters.search.trim() !== "" || 
    (filters.descriptionSearch && filters.descriptionSearch.trim() !== "") ||
    filters.edition.length > 0 ||
    filters.type.length > 0 ||
    filters.race.length > 0 ||
    filters.cost.length > 0 ||
    filters.showOnlyUnique === true ||
    filters.showOnlyBanned === true ||
    filters.showOnlyRework === true

  return (
    <main className="w-full min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-4 px-4 sm:px-6 md:px-8 lg:px-6 xl:px-8 py-4 max-w-[1920px] mx-auto">
      {/* Sidebar izquierdo - Filtros y opciones - 20% más estrecho */}
      <aside className="w-full lg:w-64 xl:w-[307px] flex-shrink-0 space-y-4">
        {/* Header con título y contador - Solo visible en móvil */}
        <div className="lg:hidden mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">
            Galería de Cartas
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {hasActiveFilters ? (
              <>
                Mostrando <span className="font-semibold text-foreground">{filteredCount}</span> de{" "}
                <span className="font-semibold text-foreground">{totalCount}</span> cartas
              </>
            ) : (
              <>
                <span className="font-semibold text-foreground">{totalCount}</span> cartas disponibles
              </>
            )}
          </p>
        </div>

        {/* Panel de modo colección */}
        <div className="lg:sticky lg:top-4">
          <CollectionModePanel
            isCollectionMode={isCollectionMode}
            onToggleCollectionMode={setIsCollectionMode}
            allCards={sortedCards}
            collectedCards={collectedCards}
          />
        </div>

        {/* Panel de filtros */}
        <div className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pb-4">
          <FiltersPanel
            filters={filters}
            onFiltersChange={setFilters}
            availableEditions={availableEditions}
            availableTypes={availableTypes}
            availableRaces={availableRaces}
            availableCosts={availableCosts}
            defaultExpanded={true}
            searchFieldsInRow={false}
            showFiltersExpanded={true}
            deckFormat="RE"
          />
          {isPending && (
            <div className="mt-2 text-xs text-muted-foreground animate-pulse">
              Filtrando cartas...
            </div>
          )}
        </div>
      </aside>

      {/* Área principal - Galería de cartas */}
      <div className="flex-1 min-w-0">
        {/* Header con título y contador - Solo visible en desktop */}
        <div className="hidden lg:block mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">
            Galería de Cartas
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {hasActiveFilters ? (
              <>
                Mostrando <span className="font-semibold text-foreground">{filteredCount}</span> de{" "}
                <span className="font-semibold text-foreground">{totalCount}</span> cartas
              </>
            ) : (
              <>
                <span className="font-semibold text-foreground">{totalCount}</span> cartas disponibles
              </>
            )}
          </p>
        </div>

        <ErrorBoundary>
          <div className="flex-1 border rounded-lg bg-card overflow-hidden shadow-sm min-h-[600px]">
            {isLoading ? (
              <div className="p-3 sm:p-4 lg:p-6">
                <CardGridSkeleton count={24} columns={8} />
              </div>
            ) : filteredCards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <svg
                    className="size-8 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">No se encontraron cartas</h3>
                <p className="text-muted-foreground max-w-md">
                  {hasActiveFilters
                    ? "Intenta ajustar los filtros para ver más resultados."
                    : "No hay cartas disponibles en este momento."}
                </p>
              </div>
              ) : (
                // Renderizado normal por ahora - la virtualización se puede activar después
                <div className="space-y-6 sm:space-y-8 p-3 sm:p-4 lg:p-6 animate-in fade-in duration-300">
                  {editionOrder.map((edition, editionIndex) => {
                    const editionCards = cardsByEdition.get(edition)
                    if (!editionCards || editionCards.length === 0) return null

                    // Marcar solo las primeras 2 imágenes de la primera edición como priority (above the fold)
                    const isFirstEdition = editionIndex === 0
                    const priorityCount = 2

                    return (
                      <div key={edition} className="space-y-4">
                        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b pb-3 -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6">
                          <div className="flex items-center gap-3">
                            {EDITION_LOGOS[edition] && (
                              <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                                <Image
                                  src={EDITION_LOGOS[edition]}
                                  alt={edition}
                                  fill
                                  className="object-contain"
                                  sizes="(max-width: 640px) 40px, 48px"
                                />
                              </div>
                            )}
                            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
                              {edition}
                              <span className="text-sm font-normal text-muted-foreground">
                                ({editionCards.length})
                              </span>
                            </h2>
                          </div>
                        </div>
                        {/* Grid optimizado con CSS contain */}
                        <div 
                          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2 sm:gap-2.5 lg:gap-3"
                          style={{ 
                            contain: "layout style paint",
                            contentVisibility: "auto",
                          }}
                        >
                          {editionCards.map((card, cardIndex) => {
                            const isCollected = collectedCards.has(card.id)
                            const maxQuantity = card.banListRE
                            const hasPriority = isFirstEdition && cardIndex < priorityCount

                            return (
                              <CardItemWrapper
                                key={card.id}
                                card={card}
                                isCollected={isCollected}
                                maxQuantity={maxQuantity}
                                hasPriority={hasPriority}
                                isCollectionMode={isCollectionMode}
                                loadingCards={loadingCards}
                                onCardClick={handleCardClick}
                                onCardRightClick={handleCardRightClick}
                                onToggleCollection={memoizedToggleCardCollection}
                              />
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
          </div>
        </ErrorBoundary>
      </div>

      {/* Modal de información de carta - Lazy loaded con Suspense */}
      {isModalOpen && selectedCard && (
        <Suspense fallback={null}>
          <CardInfoModal
            card={selectedCard}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            alternativeArts={(() => {
              // Obtener cartas alternativas desde el cache (cargado bajo demanda)
              const baseId = getBaseCardId(selectedCard.id)
              return allCardsWithAlternatives.filter(
                (card) => card.isCosmetic && getBaseCardId(card.id) === baseId
              )
            })()}
            quantityInDeck={
              isCollectionMode && collectedCards.has(selectedCard.id) ? 1 : 0
            }
            maxQuantity={isCollectionMode ? 1 : selectedCard.banListRE}
            deckCards={[]}
            onAddCard={(cardId: string) => {
              if (isCollectionMode) {
                toggleCardCollection(cardId)
              }
            }}
            onRemoveCard={(cardId: string) => {
              if (isCollectionMode) {
                toggleCardCollection(cardId)
              }
            }}
            onReplaceCard={(_oldCardId: string, _newCardId: string) => {
              // No disponible en modo galería
            }}
            filteredCards={filteredCards}
            onCardChange={(newCard) => {
              setSelectedCard(newCard)
            }}
          />
        </Suspense>
      )}
    </main>
  )
}

export default function GaleriaPage() {
  return (
    <Suspense fallback={
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="h-20 bg-muted animate-pulse rounded-lg" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          <CardGridSkeleton count={12} columns={6} />
        </div>
      </main>
    }>
      <GaleriaContent />
    </Suspense>
  )
}
