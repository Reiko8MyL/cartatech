"use client"

import { useState, useMemo, useCallback, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { FiltersPanel } from "@/components/deck-builder/filters-panel"
import { CardInfoModal } from "@/components/deck-builder/card-info-modal"
import { CardItem } from "@/components/deck-builder/card-item"
import { CollectionModePanel } from "@/components/galeria/collection-mode-panel"
import { useAuth } from "@/contexts/auth-context"
import { CardGridSkeleton } from "@/components/ui/card-grid-skeleton"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import {
  getAllCards,
  sortCardsByEditionAndId,
  filterCards,
  getUniqueEditions,
  getUniqueTypes,
  getUniqueRaces,
  getUniqueCosts,
  getAlternativeArtsForCard,
} from "@/lib/deck-builder/utils"
import type { Card, DeckFilters } from "@/lib/deck-builder/types"

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
  
  // Cargar todas las cartas
  const allCards = useMemo(() => {
    const cards = getAllCards()
    const sorted = sortCardsByEditionAndId(cards)
    // Simular carga asíncrona para mostrar skeleton
    setTimeout(() => setIsLoading(false), 300)
    return sorted
  }, [])

  // Leer el parámetro de búsqueda de la URL
  const searchFromUrl = searchParams.get("search") || ""

  // Estado de filtros
  const [filters, setFilters] = useState<DeckFilters>({
    search: searchFromUrl,
    edition: "",
    type: "",
    race: "",
    cost: "",
  })

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

  // Filtrar cartas según los filtros
  const filteredCards = useMemo(() => {
    return filterCards(allCards, filters)
  }, [allCards, filters])

  // Obtener opciones para los filtros
  const availableEditions = useMemo(
    () => getUniqueEditions(allCards),
    [allCards]
  )
  const availableTypes = useMemo(() => getUniqueTypes(allCards), [allCards])
  const availableRaces = useMemo(() => getUniqueRaces(allCards), [allCards])
  const availableCosts = useMemo(() => getUniqueCosts(allCards), [allCards])

  // Estado del modal
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

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

  // Manejar click derecho en carta (abrir modal)
  const handleCardRightClick = useCallback((e: React.MouseEvent, card: Card) => {
    e.preventDefault()
    setSelectedCard(card)
    setIsModalOpen(true)
  }, [])

  // Manejar click izquierdo en carta
  const handleCardClick = useCallback(
    (card: Card) => {
      // Siempre abrir modal con click izquierdo
      setSelectedCard(card)
      setIsModalOpen(true)
    },
    []
  )

  // Agrupar cartas por edición
  const cardsByEdition = useMemo(() => {
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

  return (
    <main className="w-full min-h-[calc(100vh-4rem)] flex flex-col px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24 py-4">
      <h1 className="sr-only">Galería de Cartas - Mitos y Leyendas Primer Bloque</h1>
      {/* Panel de modo colección */}
      <div className="mb-3">
        <CollectionModePanel
          isCollectionMode={isCollectionMode}
          onToggleCollectionMode={setIsCollectionMode}
          allCards={allCards}
          collectedCards={collectedCards}
        />
      </div>

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

      {/* Galería de cartas */}
      <ErrorBoundary>
        <div className="flex-1 border rounded-lg bg-card overflow-hidden">
          <div className="h-full overflow-y-auto">
            {isLoading ? (
              <CardGridSkeleton count={12} columns={6} />
            ) : (
              <div className="space-y-4 sm:space-y-6 p-2 sm:p-3 lg:p-4 animate-in fade-in duration-300">
                {editionOrder.map((edition, editionIndex) => {
                const editionCards = cardsByEdition.get(edition)
                if (!editionCards || editionCards.length === 0) return null

                // Marcar las primeras 12 imágenes de la primera edición como priority (above the fold)
                const isFirstEdition = editionIndex === 0
                const priorityCount = 12

                return (
                  <div key={edition} className="space-y-3">
                    <h2 className="text-lg font-semibold sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
                      {edition}
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-2 sm:gap-3">
                      {editionCards.map((card, cardIndex) => {
                        const isCollected = collectedCards.has(card.id)
                        const maxQuantity = card.banListRE
                        // Solo las primeras imágenes de la primera edición tienen priority
                        const hasPriority = isFirstEdition && cardIndex < priorityCount

                        return (
                          <div key={card.id} className="relative group/card">
                            <CardItem
                              card={card}
                              quantity={0}
                              maxQuantity={maxQuantity}
                              canAddMore={true}
                              onCardClick={handleCardClick}
                              onCardRightClick={handleCardRightClick}
                              priority={hasPriority}
                              showBanListIndicator={false}
                            />
                            {/* Toggle de colección - visible cuando está en modo colección */}
                            {isCollectionMode && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleCardCollection(card.id)
                                }}
                                disabled={loadingCards.has(card.id)}
                                className={`absolute top-1 left-1/2 -translate-x-1/2 z-30 size-7 rounded-full border-2 transition-all duration-200 flex items-center justify-center shadow-lg ${
                                  isCollected
                                    ? "bg-green-500 border-background hover:bg-green-600"
                                    : "bg-background/80 border-border hover:bg-background"
                                } ${loadingCards.has(card.id) ? "opacity-50 cursor-not-allowed animate-pulse" : ""}`}
                                aria-label={
                                  isCollected
                                    ? "Marcar como no tengo"
                                    : "Marcar como la tengo"
                                }
                                title={
                                  isCollected
                                    ? "Marcar como no tengo"
                                    : "Marcar como la tengo"
                                }
                              >
                                {isCollected && (
                                  <svg
                                    className="size-4 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={3}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                                {!isCollected && (
                                  <svg
                                    className="size-4 text-muted-foreground"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 4v16m8-8H4"
                                    />
                                  </svg>
                                )}
                              </button>
                            )}
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
        </div>
      </ErrorBoundary>

      {/* Modal de información de carta */}
      {selectedCard && (
        <CardInfoModal
          card={selectedCard}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          alternativeArts={getAlternativeArtsForCard(selectedCard.id)}
          quantityInDeck={
            isCollectionMode && collectedCards.has(selectedCard.id) ? 1 : 0
          }
          maxQuantity={isCollectionMode ? 1 : selectedCard.banListRE}
          onAddCard={() => {
            if (isCollectionMode) {
              toggleCardCollection(selectedCard.id)
            }
          }}
          onRemoveCard={() => {
            if (isCollectionMode) {
              toggleCardCollection(selectedCard.id)
            }
          }}
        />
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
