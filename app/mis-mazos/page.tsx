"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import {
  getUserDecksFromLocalStorage,
  getDeckRace,
  getDeckEdition,
  getDeckEditionLogo,
  getDeckBackgroundImage,
  EDITION_LOGOS,
  getDeckViewCount,
  isDeckFavorite,
  toggleFavoriteDeck,
  getUserFavoriteDecksFromLocalStorage,
  getPublicDecksFromLocalStorage,
  getFavoriteDecks,
  getPrioritizedDeckTags,
  getDeckFormatName,
} from "@/lib/deck-builder/utils"
import { useCards } from "@/hooks/use-cards"
import type { SavedDeck, DeckFormat } from "@/lib/deck-builder/types"
import { Globe, Lock, Trash2, Edit2, Eye, Grid3x3, List, Search, X, ArrowUpDown, ArrowUp, ArrowDown, Copy, Star, Heart } from "lucide-react"
import { toastSuccess, toastError } from "@/lib/toast"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DeckCardSkeleton } from "@/components/ui/deck-card-skeleton"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { Pagination } from "@/components/ui/pagination"
import { useBannerSettings, getBannerStyle, getOverlayStyle, useDeviceType, useBannerSettingsMap } from "@/hooks/use-banner-settings"
import { getBackgroundImageId } from "@/lib/deck-builder/banner-utils"
import { optimizeCloudinaryUrl, isCloudinaryOptimized } from "@/lib/deck-builder/cloudinary-utils"

type ViewMode = "grid" | "list"
type SortBy = "name" | "edition" | "date" | "race"
type SortDirection = "asc" | "desc"

interface DeckFilters {
  search: string
  race: string
  edition: string
  format: string
  isPublic: string
  favorites: string
}

export default function MisMazosPage() {
  const { user } = useAuth()
  const [decks, setDecks] = useState<SavedDeck[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [sortBy, setSortBy] = useState<SortBy>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const deviceType = useDeviceType()
  const [filters, setFilters] = useState<DeckFilters>({
    search: "",
    race: "",
    edition: "",
    format: "",
    isPublic: "",
    favorites: "",
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deckToDelete, setDeckToDelete] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [favorites, setFavorites] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  // Cargar todas las cartas desde la API con cache
  const { cards: allCards } = useCards(false)
  
  // Obtener todos los IDs de imágenes únicos de los decks
  const deckImageIds = useMemo(() => {
    if (!allCards.length || !decks.length) return [];
    const uniqueIds = new Set<string | null>();
    decks.forEach(deck => {
      const race = getDeckRace(deck.cards, allCards);
      const backgroundImage = getDeckBackgroundImage(race);
      if (backgroundImage) {
        uniqueIds.add(getBackgroundImageId(backgroundImage));
      } else {
        uniqueIds.add(null);
      }
    });
    return Array.from(uniqueIds);
  }, [decks, allCards]);
  
  // Obtener ajustes para todas las imágenes
  const { settingsMap, isLoading: isLoadingBannerSettings } = useBannerSettingsMap("mis-mazos", viewMode, deviceType, deckImageIds);
  
  // Ajuste por defecto (para compatibilidad)
  const { setting: bannerSetting } = useBannerSettings("mis-mazos", viewMode, deviceType)
  
  // Pre-cargar todas las imágenes de fondo cuando se carguen los mazos
  useEffect(() => {
    if (decks.length > 0 && allCards.length > 0 && typeof window !== 'undefined') {
      const imagesToPreload = new Set<string>();
      decks.forEach(deck => {
        const race = getDeckRace(deck.cards, allCards);
        const backgroundImage = getDeckBackgroundImage(race);
        if (backgroundImage) {
          const optimizedImage = optimizeCloudinaryUrl(backgroundImage, deviceType, true);
          imagesToPreload.add(optimizedImage);
        }
      });
      
      // Pre-cargar todas las imágenes
      imagesToPreload.forEach(imageUrl => {
        const img = new window.Image();
        img.src = imageUrl;
      });
    }
  }, [decks, allCards, deviceType]);

  useEffect(() => {
    if (user) {
      setIsLoading(true)
      // Cargar mazos desde la API
      const loadDecks = async () => {
        try {
          // Intentar cargar desde la API (cargar todos para aplicar filtros en cliente)
          const { getUserDecksFromStorage } = await import("@/lib/deck-builder/utils");
          // Cargar todos los mazos (página 1 con límite alto) para aplicar filtros en cliente
          const result = await getUserDecksFromStorage(user.id, 1, 1000);
          
          // Asegurar que los mazos tengan el autor si no lo tienen
          const decksWithAuthor = result.decks.map((deck) => ({
            ...deck,
            author: deck.author || user.username,
          }))
          setDecks(decksWithAuthor)
          
          // Cargar favoritos desde la API
          const { getUserFavoriteDecksFromStorage } = await import("@/lib/deck-builder/utils");
          const userFavorites = await getUserFavoriteDecksFromStorage(user.id);
          setFavorites(userFavorites)
        } catch (error) {
          console.error("Error al cargar mazos:", error);
          // Fallback a localStorage si la API falla
          const userDecks = getUserDecksFromLocalStorage(user.id)
          const decksWithAuthor = userDecks.map((deck) => ({
            ...deck,
            author: deck.author || user.username,
          }))
          setDecks(decksWithAuthor)
          const userFavorites = getUserFavoriteDecksFromLocalStorage(user.id)
          setFavorites(userFavorites)
        } finally {
          setIsLoading(false)
        }
      }
      
      loadDecks()
    } else {
      setIsLoading(false)
    }
  }, [user])

  // Calcular raza, edición y favoritos para cada mazo
  const decksWithMetadata = useMemo(() => {
    return decks.map((deck) => {
      const race = getDeckRace(deck.cards, allCards)
      const edition = getDeckEdition(deck.cards, allCards)
      // Usar viewCount del mazo si viene de la API, sino usar localStorage como fallback
      const viewCount = deck.viewCount !== undefined ? deck.viewCount : (deck.id ? getDeckViewCount(deck.id) : 0)
      // Usar el estado favorites directamente en lugar de leer de localStorage
      const isFavorite = user && deck.id ? favorites.includes(deck.id) : false
      return {
        ...deck,
        race,
        edition,
        backgroundImage: getDeckBackgroundImage(race),
        viewCount,
        isFavorite,
      }
    })
  }, [decks, allCards, favorites, user])

  // Filtrar mazos
  const filteredDecks = useMemo(() => {
    // Filtrado normal para mazos propios
    let filtered = decksWithMetadata.filter((deck) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesName = deck.name.toLowerCase().includes(searchLower)
        const matchesDescription = deck.description?.toLowerCase().includes(searchLower) || false
        if (!matchesName && !matchesDescription) return false
      }

      if (filters.race && deck.race !== filters.race) return false
      if (filters.edition && deck.edition !== filters.edition) return false
      if (filters.format && (deck.format || "RE") !== filters.format) return false
      if (filters.isPublic === "public" && !deck.isPublic) return false
      if (filters.isPublic === "private" && deck.isPublic) return false
      // Filtrar por favoritos: mostrar solo los mazos que están en favoritos
      if (filters.favorites === "favorites" && !deck.isFavorite) return false

      return true
    })

    // Ordenar mazos
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name, "es", { sensitivity: "base" })
          break
        case "edition":
          const editionA = a.edition || ""
          const editionB = b.edition || ""
          comparison = editionA.localeCompare(editionB, "es", { sensitivity: "base" })
          break
        case "date":
          comparison = a.createdAt - b.createdAt
          break
        case "race":
          const raceA = a.race || ""
          const raceB = b.race || ""
          comparison = raceA.localeCompare(raceB, "es", { sensitivity: "base" })
          break
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

    return filtered
  }, [decksWithMetadata, filters, sortBy, sortDirection])

  // Paginación en el cliente (después de filtros)
  const ITEMS_PER_PAGE = 12
  const totalFilteredPages = Math.ceil(filteredDecks.length / ITEMS_PER_PAGE)
  const paginatedDecks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    return filteredDecks.slice(start, end)
  }, [filteredDecks, currentPage])

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [filters, sortBy, sortDirection])

  // Obtener valores únicos para los filtros
  const availableRaces = useMemo(() => {
    const races = new Set<string>()
    decksWithMetadata.forEach((deck) => {
      if (deck.race) races.add(deck.race)
    })
    return Array.from(races).sort()
  }, [decksWithMetadata])

  const availableEditions = useMemo(() => {
    const editions = new Set<string>()
    decksWithMetadata.forEach((deck) => {
      if (deck.edition) editions.add(deck.edition)
    })
    return Array.from(editions).sort()
  }, [decksWithMetadata])

  const availableFormats = useMemo(() => {
    const formats = new Set<DeckFormat>()
    decksWithMetadata.forEach((deck) => {
      formats.add(deck.format || "RE")
    })
    return Array.from(formats).sort()
  }, [decksWithMetadata])

  const handleDeleteDeck = (deckId: string) => {
    setDeckToDelete(deckId)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteDeck = () => {
    if (!deckToDelete) return

    const updatedDecks = decks.filter((d) => d.id !== deckToDelete)
    setDecks(updatedDecks)

    const allSavedDecks = JSON.parse(
      localStorage.getItem("myl_saved_decks") || "[]"
    ) as SavedDeck[]
    const updatedAllDecks = allSavedDecks.filter((d) => d.id !== deckToDelete)
    localStorage.setItem("myl_saved_decks", JSON.stringify(updatedAllDecks))
    
    toastSuccess("Mazo eliminado correctamente")
    setDeckToDelete(null)
  }


  const clearFilters = () => {
    setFilters({
      search: "",
      race: "",
      edition: "",
      format: "",
      isPublic: "",
      favorites: "",
    })
  }

  const hasActiveFilters = filters.search || filters.race || filters.edition || filters.format || filters.isPublic || filters.favorites

  const handleToggleFavorite = async (deckId: string) => {
    if (!user) return

    // Solo permitir favoritos en mazos públicos
    // Buscar el mazo en la lista actual de mazos
    const deck = decks.find((d) => d.id === deckId)
    
    if (!deck || !deck.isPublic) {
      toastError("Solo puedes agregar mazos públicos a favoritos")
      return
    }

    // Guardar el estado anterior para poder revertir si hay error
    const previousFavorites = [...favorites]
    
    // Actualización optimista: actualizar el estado inmediatamente
    const isCurrentlyFavorite = favorites.includes(deckId)
    const newFavorites = isCurrentlyFavorite
      ? favorites.filter((id) => id !== deckId)
      : [...favorites, deckId]
    setFavorites(newFavorites)

    try {
      const added = await toggleFavoriteDeck(deckId, user.id)
      
      // Actualizar favoritos desde la API
      const { getUserFavoriteDecksFromStorage } = await import("@/lib/deck-builder/utils");
      const updatedFavorites = await getUserFavoriteDecksFromStorage(user.id);
      setFavorites(updatedFavorites);
      
      if (added) {
        toastSuccess("Mazo agregado a favoritos")
      } else {
        toastSuccess("Mazo eliminado de favoritos")
      }
    } catch (error) {
      console.error("Error al alternar favorito:", error);
      // Revertir la actualización optimista en caso de error
      setFavorites(previousFavorites)
      toastError("Error al actualizar favoritos. Por favor intenta de nuevo.");
    }
  }

  if (!user) {
    return (
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Mis Mazos</h1>
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Inicia sesión para ver tus mazos</CardTitle>
              <CardDescription>
                Debes tener una cuenta para guardar y gestionar tus mazos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button asChild>
                  <Link href="/inicio-sesion">Iniciar Sesión</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/registro">Registrarse</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Mis Mazos</h1>
            <p className="mt-2 text-muted-foreground">
              {filteredDecks.length} {filteredDecks.length === 1 ? "mazo" : "mazos"}
              {hasActiveFilters && ` (de ${decks.length} total)`}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Alfabético</SelectItem>
                  <SelectItem value="edition">Edición</SelectItem>
                  <SelectItem value="date">Fecha</SelectItem>
                  <SelectItem value="race">Raza</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                aria-label={sortDirection === "asc" ? "Cambiar a orden descendente" : "Cambiar a orden ascendente"}
                title={sortDirection === "asc" ? "Orden ascendente" : "Orden descendente"}
              >
                {sortDirection === "asc" ? (
                  <ArrowUp className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
            </div>
            <div className="flex border rounded-md" role="group" aria-label="Vista de mazos">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                className="rounded-r-none"
                onClick={() => setViewMode("grid")}
                aria-label="Vista de cuadrícula"
                aria-pressed={viewMode === "grid"}
              >
                <Grid3x3 className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                className="rounded-l-none"
                onClick={() => setViewMode("list")}
                aria-label="Vista de lista"
                aria-pressed={viewMode === "list"}
              >
                <List className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            <Button asChild>
              <Link href="/deck-builder">Crear Nuevo Mazo</Link>
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filtros de Búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="relative">
                  <Label htmlFor="search-decks" className="sr-only">Buscar mazos</Label>
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="search-decks"
                    placeholder="Buscar por nombre o descripción..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-9"
                    aria-label="Buscar mazos por nombre o descripción"
                  />
                </div>
                <Select 
                  value={filters.race || "all"} 
                  onValueChange={(value) => setFilters({ ...filters, race: value === "all" ? "" : value })}
                >
                  <Label htmlFor="filter-race" className="sr-only">Filtrar por raza</Label>
                  <SelectTrigger id="filter-race" aria-label="Filtrar por raza">
                    <SelectValue placeholder="Todas las razas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las razas</SelectItem>
                    {availableRaces.map((race) => (
                      <SelectItem key={race} value={race}>
                        {race}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.edition || "all"}
                  onValueChange={(value) => setFilters({ ...filters, edition: value === "all" ? "" : value })}
                >
                  <Label htmlFor="filter-edition" className="sr-only">Filtrar por edición</Label>
                  <SelectTrigger id="filter-edition" aria-label="Filtrar por edición">
                    <SelectValue placeholder="Todas las ediciones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las ediciones</SelectItem>
                    {availableEditions.map((edition) => (
                      <SelectItem key={edition} value={edition}>
                        {edition}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.format || "all"}
                  onValueChange={(value) => setFilters({ ...filters, format: value === "all" ? "" : value })}
                >
                  <Label htmlFor="filter-format" className="sr-only">Filtrar por formato</Label>
                  <SelectTrigger id="filter-format" aria-label="Filtrar por formato">
                    <SelectValue placeholder="Todos los formatos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los formatos</SelectItem>
                    {availableFormats.map((format) => (
                      <SelectItem key={format} value={format}>
                        {getDeckFormatName(format)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Label className="text-sm font-medium text-muted-foreground">Visibilidad:</Label>
                <div className="flex border rounded-md">
                  <Button
                    variant={filters.isPublic === "" ? "default" : "ghost"}
                    size="sm"
                    className="rounded-r-none"
                    onClick={() => setFilters({ ...filters, isPublic: "" })}
                    aria-label="Todos los mazos"
                  >
                    Todos
                  </Button>
                  <Button
                    variant={filters.isPublic === "public" ? "default" : "ghost"}
                    size="sm"
                    className="rounded-none border-x"
                    onClick={() => setFilters({ ...filters, isPublic: "public" })}
                    aria-label="Solo mazos públicos"
                  >
                    <Globe className="h-3 w-3 mr-1" />
                    Públicos
                  </Button>
                  <Button
                    variant={filters.isPublic === "private" ? "default" : "ghost"}
                    size="sm"
                    className="rounded-l-none"
                    onClick={() => setFilters({ ...filters, isPublic: "private" })}
                    aria-label="Solo mazos privados"
                  >
                    <Lock className="h-3 w-3 mr-1" />
                    Privados
                  </Button>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Label className="text-sm font-medium text-muted-foreground">Favoritos:</Label>
                  <Button
                    variant={filters.favorites === "favorites" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilters({ ...filters, favorites: filters.favorites === "favorites" ? "" : "favorites" })}
                    aria-label={filters.favorites === "favorites" ? "Mostrar todos los mazos" : "Solo favoritos"}
                  >
                    <Star className={`h-3 w-3 mr-1 ${filters.favorites === "favorites" ? "fill-current" : ""}`} />
                    Solo favoritos
                  </Button>
                </div>
              </div>
            </div>
            {hasActiveFilters && (
              <div className="mt-4 flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Limpiar Filtros
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <ErrorBoundary>
          {isLoading ? (
          <div className={`${viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-4"} animate-in fade-in duration-300`}>
            {Array.from({ length: 6 }).map((_, i) => (
              <DeckCardSkeleton key={i} viewMode={viewMode} />
            ))}
          </div>
        ) : filteredDecks.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>
                {hasActiveFilters ? "No se encontraron mazos" : "No tienes mazos guardados"}
              </CardTitle>
              <CardDescription>
                {hasActiveFilters
                  ? "Intenta ajustar los filtros para encontrar tus mazos."
                  : "Crea tu primer mazo en el Deck Builder y guárdalo para acceder a él desde aquí."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hasActiveFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  Limpiar Filtros
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/deck-builder">Ir al Deck Builder</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-300">
            {paginatedDecks.map((deck) => {
              const cardCount = deck.cards.reduce((sum, dc) => sum + dc.quantity, 0)
              const createdDate = new Date(deck.createdAt)
              const formattedDate = createdDate.toLocaleDateString("es-ES", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })

              // Obtener raza e imagen de fondo del deck
              const race = getDeckRace(deck.cards, allCards);
              const backgroundImage = getDeckBackgroundImage(race);
              const deckImageId = backgroundImage ? getBackgroundImageId(backgroundImage) : null;
              const deckBannerSetting = settingsMap.get(deckImageId) || bannerSetting;

              return (
                <Card key={deck.id} className="flex flex-col overflow-hidden group">
                  <div
                    className="relative overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20"
                    style={getBannerStyle(backgroundImage, deckBannerSetting, deviceType, viewMode)}
                  >
                    <div className="absolute inset-0" style={getOverlayStyle(deckBannerSetting)} />
                    {/* Logo de edición en esquina superior izquierda */}
                    {(() => {
                      const logoUrl = getDeckEditionLogo(deck.cards, allCards)
                      if (!logoUrl) return null
                      const optimizedLogoUrl = optimizeCloudinaryUrl(logoUrl, deviceType)
                      const isOptimized = isCloudinaryOptimized(optimizedLogoUrl)
                      return (
                        <div className="absolute top-2 left-2 z-20">
                          <div className="relative w-[72px] h-[72px]" title={deck.edition || "Múltiples ediciones"}>
                            <Image
                              src={optimizedLogoUrl}
                              alt={deck.edition || "Múltiples ediciones"}
                              fill
                              className="object-contain drop-shadow-lg"
                              sizes="72px"
                              loading="lazy"
                              decoding="async"
                              unoptimized={isOptimized}
                            />
                          </div>
                        </div>
                      )
                    })()}
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white text-lg line-clamp-1">{deck.name}</CardTitle>
                        {deck.isPublic ? (
                          <div title="Público">
                            <Globe className="h-4 w-4 text-white" aria-label="Público" />
                          </div>
                        ) : (
                          <div title="Privado">
                            <Lock className="h-4 w-4 text-white/80" aria-label="Privado" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <CardContent className="flex-1 flex flex-col p-4">
                    <div className="flex-1 space-y-2 mb-4">
                      <div className="flex flex-wrap gap-2 text-xs items-center">
                        {deck.race && (
                          <span className="px-2 py-1 bg-primary/10 text-primary rounded-md">
                            {deck.race}
                          </span>
                        )}
                        <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded-md">
                          {getDeckFormatName(deck.format)}
                        </span>
                        {getPrioritizedDeckTags(deck.tags).map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-secondary/50 text-secondary-foreground rounded-md">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>Por {deck.author || user.username} · {formattedDate}</span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {deck.viewCount || 0}
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link href={deck.id ? `/mazo/${deck.id}` : "#"} aria-label={`Ver mazo ${deck.name}`}>
                          <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
                          Ver
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild
                        aria-label={`Editar mazo ${deck.name}`}
                      >
                        <Link href={deck.id ? `/deck-builder?load=${deck.id}` : "#"}>
                          <Edit2 className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only">Editar Mazo</span>
                        </Link>
                      </Button>
                      {deck.isPublic && (
                        <Button
                          variant={deck.isFavorite ? "default" : "outline"}
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => deck.id && handleToggleFavorite(deck.id)}
                          title={deck.isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                          aria-label={deck.isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                        >
                          <Star
                            className={`h-3 w-3 ${deck.isFavorite ? "fill-current" : ""}`}
                          />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deck.id && handleDeleteDeck(deck.id)}
                        className="text-destructive hover:text-destructive"
                        aria-label={`Eliminar mazo ${deck.name}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-300">
            {paginatedDecks.map((deck) => {
              const cardCount = deck.cards.reduce((sum, dc) => sum + dc.quantity, 0)
              const createdDate = new Date(deck.createdAt)
              const formattedDate = createdDate.toLocaleDateString("es-ES", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })

              // Obtener raza e imagen de fondo del deck
              const race = getDeckRace(deck.cards, allCards);
              const backgroundImage = getDeckBackgroundImage(race);
              const deckImageId = backgroundImage ? getBackgroundImageId(backgroundImage) : null;
              const deckBannerSetting = settingsMap.get(deckImageId) || bannerSetting;

              return (
                <Card key={deck.id} className="overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    <div
                      className="relative w-full sm:w-64 flex-shrink-0 bg-gradient-to-br from-primary/20 to-secondary/20"
                      style={getBannerStyle(backgroundImage, deckBannerSetting, deviceType, viewMode)}
                    >
                      <div className="absolute inset-0" style={getOverlayStyle(deckBannerSetting)} />
                      <div className="absolute bottom-2 left-2 right-2 z-10">
                        <CardTitle className="text-white text-lg line-clamp-1 drop-shadow-lg">{deck.name}</CardTitle>
                      </div>
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-xl">{deck.name}</CardTitle>
                            {deck.isPublic ? (
                              <div title="Público">
                                <Globe className="h-4 w-4 text-primary" aria-label="Público" />
                              </div>
                            ) : (
                              <div title="Privado">
                                <Lock className="h-4 w-4 text-muted-foreground" aria-label="Privado" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs mb-2 items-center">
                            {deck.race && (
                              <span className="px-2 py-1 bg-primary/10 text-primary rounded-md">
                                {deck.race}
                              </span>
                            )}
                            <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded-md">
                              {getDeckFormatName(deck.format)}
                            </span>
                            {getPrioritizedDeckTags(deck.tags).map((tag) => (
                              <span key={tag} className="px-2 py-1 bg-secondary/50 text-secondary-foreground rounded-md">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          <p className="flex items-center gap-2">
                            <span>
                              Por{" "}
                              {deck.author || user.username} · {formattedDate}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {deck.viewCount || 0}
                            </span>
                          </p>
                        </div>
                        <div className="relative flex gap-2">
                          {/* Logo de edición sobre los botones de editar y borrar */}
                                {(() => {
                            const logoUrl = getDeckEditionLogo(deck.cards, allCards)
                            if (!logoUrl) return null
                                  const optimizedLogoUrl = optimizeCloudinaryUrl(logoUrl, deviceType)
                                  const isOptimized = isCloudinaryOptimized(optimizedLogoUrl)
                                  return (
                              <div className="absolute -top-20 right-0 z-10">
                                <div className="relative w-16 h-16" title={deck.edition || "Múltiples ediciones"}>
                                    <Image
                                      src={optimizedLogoUrl}
                                    alt={deck.edition || "Múltiples ediciones"}
                                      fill
                                      className="object-contain"
                                      sizes="64px"
                                      loading="lazy"
                                      decoding="async"
                                      unoptimized={isOptimized}
                                    />
                              </div>
                            </div>
                            )
                          })()}
                          <Button variant="outline" size="sm" asChild>
                            <Link href={deck.id ? `/mazo/${deck.id}` : "#"} aria-label={`Ver mazo ${deck.name}`}>
                              <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
                              Ver
                            </Link>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            asChild
                            aria-label={`Editar mazo ${deck.name}`}
                          >
                            <Link href={deck.id ? `/deck-builder?load=${deck.id}` : "#"}>
                              <Edit2 className="h-4 w-4 mr-2" aria-hidden="true" />
                              Editar Mazo
                            </Link>
                          </Button>
                          {deck.isPublic && (
                            <Button
                              variant={deck.isFavorite ? "default" : "outline"}
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => deck.id && handleToggleFavorite(deck.id)}
                              title={deck.isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                              aria-label={deck.isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                            >
                              <Star
                                className={`h-3 w-3 ${deck.isFavorite ? "fill-current" : ""}`}
                              />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deck.id && handleDeleteDeck(deck.id)}
                            className="text-destructive hover:text-destructive"
                            aria-label={`Eliminar mazo ${deck.name}`}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
          )}
          
          {/* Paginación */}
          {totalFilteredPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalFilteredPages}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  // Scroll al inicio de la lista
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </div>
          )}
        </ErrorBoundary>

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

      </div>
    </main>
  )
}
