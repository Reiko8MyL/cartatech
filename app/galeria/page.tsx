"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
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

function loadCollectionFromStorage(): Set<string> {
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

function saveCollectionToStorage(cardIds: Set<string>): void {
  if (typeof window === "undefined") return

  try {
    const array = Array.from(cardIds)
    localStorage.setItem(COLLECTION_STORAGE_KEY, JSON.stringify(array))
  } catch {
    // Ignorar errores de localStorage
  }
}

export default function GaleriaPage() {
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
    user ? loadCollectionFromStorage() : new Set()
  )

  // Desactivar modo colección si el usuario cierra sesión
  useEffect(() => {
    if (!user && isCollectionMode) {
      setIsCollectionMode(false)
    }
  }, [user, isCollectionMode])

  // Guardar colección en localStorage cuando cambie (solo si el usuario está autenticado)
  useEffect(() => {
    if (user) {
      saveCollectionToStorage(collectedCards)
    }
  }, [collectedCards, user])

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
  const toggleCardCollection = useCallback((cardId: string) => {
    if (!user) return
    setCollectedCards((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(cardId)) {
        newSet.delete(cardId)
      } else {
        newSet.add(cardId)
      }
      return newSet
    })
  }, [user])

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
                {editionOrder.map((edition) => {
                const editionCards = cardsByEdition.get(edition)
                if (!editionCards || editionCards.length === 0) return null

                return (
                  <div key={edition} className="space-y-3">
                    <h2 className="text-lg font-semibold sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
                      {edition}
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-2 sm:gap-3">
                      {editionCards.map((card) => {
                        const isCollected = collectedCards.has(card.id)
                        const maxQuantity = card.banListRE

                        return (
                          <div key={card.id} className="relative group/card">
                            <CardItem
                              card={card}
                              quantity={0}
                              maxQuantity={maxQuantity}
                              canAddMore={true}
                              onCardClick={handleCardClick}
                              onCardRightClick={handleCardRightClick}
                            />
                            {/* Toggle de colección - visible cuando está en modo colección */}
                            {isCollectionMode && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleCardCollection(card.id)
                                }}
                                className={`absolute top-1 left-1/2 -translate-x-1/2 z-30 size-7 rounded-full border-2 transition-all duration-200 flex items-center justify-center shadow-lg ${
                                  isCollected
                                    ? "bg-green-500 border-background hover:bg-green-600"
                                    : "bg-background/80 border-border hover:bg-background"
                                }`}
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
