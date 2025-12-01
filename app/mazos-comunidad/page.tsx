"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import {
  getPublicDecksFromLocalStorage,
  getAllCards,
  getDeckRace,
  getDeckEdition,
  getDeckBackgroundImage,
  EDITION_LOGOS,
  getDeckLikeCount,
  hasUserLikedDeck,
  toggleDeckLike,
  getDeckLikesFromLocalStorage,
  getDeckViewCount,
  isDeckFavorite,
  toggleFavoriteDeck,
  getUserFavoriteDecksFromLocalStorage,
  getPrioritizedDeckTags,
  getDeckFormatName,
} from "@/lib/deck-builder/utils"
import type { SavedDeck, DeckFormat } from "@/lib/deck-builder/types"
import { Globe, Eye, Grid3x3, List, Search, X, ArrowUp, ArrowDown, Calendar, Heart, Copy, Star } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { DeckCardSkeleton } from "@/components/ui/deck-card-skeleton"
import { toastSuccess } from "@/lib/toast"

type ViewMode = "grid" | "list"
type SortBy = "name" | "edition" | "date" | "race" | "likes"
type SortDirection = "asc" | "desc"

interface DeckFilters {
  search: string
  race: string
  edition: string
  format: string
  favorites: string
  liked: string
}

export default function MazosComunidadPage() {
  const { user } = useAuth()
  const [publicDecks, setPublicDecks] = useState<SavedDeck[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [sortBy, setSortBy] = useState<SortBy>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [filters, setFilters] = useState<DeckFilters>({
    search: "",
    race: "",
    edition: "",
    format: "",
    favorites: "",
    liked: "",
  })
  const [likes, setLikes] = useState<Record<string, string[]>>({})
  const [favorites, setFavorites] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const allCards = useMemo(() => getAllCards(), [])

  // Cargar likes y favoritos al iniciar
  useEffect(() => {
    const deckLikes = getDeckLikesFromLocalStorage()
    setLikes(deckLikes)
    if (user) {
      const userFavorites = getUserFavoriteDecksFromLocalStorage(user.id)
      setFavorites(userFavorites)
    }
  }, [user])

  useEffect(() => {
    setIsLoading(true)
    // Simular carga asíncrona para mostrar skeleton
    setTimeout(() => {
      const decks = getPublicDecksFromLocalStorage()
      setPublicDecks(decks)
      setIsLoading(false)
    }, 300)
  }, [])

  // Calcular raza, edición, likes y favoritos para cada mazo
  const decksWithMetadata = useMemo(() => {
    return publicDecks.map((deck: SavedDeck) => {
      const race = getDeckRace(deck.cards, allCards)
      const edition = getDeckEdition(deck.cards, allCards)
      const likeCount = likes[deck.id]?.length || 0
      const userLiked = user ? hasUserLikedDeck(deck.id, user.id) : false
      const isFavorite = user ? isDeckFavorite(deck.id, user.id) : false
      const viewCount = getDeckViewCount(deck.id)
      return {
        ...deck,
        race,
        edition,
        backgroundImage: getDeckBackgroundImage(race),
        likeCount,
        userLiked,
        isFavorite,
        viewCount,
      }
    })
  }, [publicDecks, allCards, likes, favorites, user])

  // Filtrar mazos
  const filteredDecks = useMemo(() => {
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
      if (filters.favorites === "favorites" && !deck.isFavorite) return false
      if (filters.liked === "liked" && !deck.userLiked) return false

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
          const dateA = a.publishedAt || a.createdAt
          const dateB = b.publishedAt || b.createdAt
          comparison = dateA - dateB
          break
        case "race":
          const raceA = a.race || ""
          const raceB = b.race || ""
          comparison = raceA.localeCompare(raceB, "es", { sensitivity: "base" })
          break
        case "likes":
          comparison = (a.likeCount || 0) - (b.likeCount || 0)
          break
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

    return filtered
  }, [decksWithMetadata, filters, sortBy, sortDirection])

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

  const clearFilters = () => {
    setFilters({
      search: "",
      race: "",
      edition: "",
      format: "",
      favorites: "",
      liked: "",
    })
  }

  const hasActiveFilters = filters.search || filters.race || filters.edition || filters.format || filters.favorites || filters.liked

  const handleToggleLike = (deckId: string) => {
    if (!user) return

    const newLiked = toggleDeckLike(deckId, user.id)
    const updatedLikes = getDeckLikesFromLocalStorage()
    setLikes(updatedLikes)
  }

  const handleToggleFavorite = (deckId: string) => {
    if (!user) return

    const added = toggleFavoriteDeck(deckId, user.id)
    const updatedFavorites = getUserFavoriteDecksFromLocalStorage(user.id)
    setFavorites(updatedFavorites)
    
    if (added) {
      toastSuccess("Mazo agregado a favoritos")
    } else {
      toastSuccess("Mazo eliminado de favoritos")
    }
  }

  return (
    <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Mazos de la Comunidad
            </h1>
            <p className="mt-2 text-muted-foreground">
              {filteredDecks.length} {filteredDecks.length === 1 ? "mazo público" : "mazos públicos"}
              {hasActiveFilters && ` (de ${publicDecks.length} total)`}
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
                  <SelectItem value="likes">Más gustados</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                title={sortDirection === "asc" ? "Orden ascendente" : "Orden descendente"}
              >
                {sortDirection === "asc" ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowDown className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                className="rounded-r-none"
                onClick={() => setViewMode("grid")}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                className="rounded-l-none"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
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
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o descripción..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={filters.race || "all"}
                  onValueChange={(value) => setFilters({ ...filters, race: value === "all" ? "" : value })}
                >
                  <SelectTrigger>
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
                  <SelectTrigger>
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
                  <SelectTrigger>
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
              {user && (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
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
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium text-muted-foreground">Likes:</Label>
                    <Button
                      variant={filters.liked === "liked" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilters({ ...filters, liked: filters.liked === "liked" ? "" : "liked" })}
                      aria-label={filters.liked === "liked" ? "Mostrar todos los mazos" : "Solo con like"}
                    >
                      <Heart className={`h-3 w-3 mr-1 ${filters.liked === "liked" ? "fill-current" : ""}`} />
                      Solo con Like
                    </Button>
                  </div>
                </div>
              )}
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
                {hasActiveFilters ? "No se encontraron mazos" : "No hay mazos públicos aún"}
              </CardTitle>
              <CardDescription>
                {hasActiveFilters
                  ? "Intenta ajustar los filtros para encontrar mazos."
                  : "Sé el primero en compartir tu mazo con la comunidad. Crea un mazo en el Deck Builder y publícalo desde \"Mis Mazos\"."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hasActiveFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  Limpiar Filtros
                </Button>
              ) : (
                <div className="flex gap-3">
                  <Button asChild>
                    <Link href="/deck-builder">Crear Mazo</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/mis-mazos">Mis Mazos</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-300">
            {filteredDecks.map((deck) => {
              const cardCount = deck.cards.reduce((sum, dc) => sum + dc.quantity, 0)
              const publishedDate = deck.publishedAt
                ? new Date(deck.publishedAt)
                : new Date(deck.createdAt)
              const formattedDate = publishedDate.toLocaleDateString("es-ES", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })

              return (
                <Card key={deck.id} className="flex flex-col overflow-hidden group">
                  <div
                    className="relative h-32 overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20"
                    style={{
                      backgroundImage: `url(${deck.backgroundImage})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white text-lg line-clamp-1">{deck.name}</CardTitle>
                        <div title="Público">
                          <Globe className="h-4 w-4 text-white" aria-label="Público" />
                        </div>
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
                      <p className="text-sm text-muted-foreground">
                        {cardCount} {cardCount === 1 ? "carta" : "cartas"}
                      </p>
                      {deck.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {deck.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Por {deck.author || "Anónimo"} · {formattedDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {deck.viewCount || 0}
                        </span>
                      </p>
                    </div>
                    <div className="relative">
                      {/* Logo de edición sobre el botón */}
                      {deck.edition && EDITION_LOGOS[deck.edition] && (
                        <div className="absolute -top-32 right-0 z-10">
                          <div className="relative w-24 h-24" title={deck.edition}>
                            <Image
                              src={EDITION_LOGOS[deck.edition]}
                              alt={deck.edition}
                              fill
                              className="object-contain"
                              sizes="96px"
                            />
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <Link href={`/mazo/${deck.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/deck-builder?load=${deck.id}`}>
                            <Copy className="h-4 w-4" aria-hidden="true" />
                            <span className="sr-only">Copiar Mazo</span>
                          </Link>
                        </Button>
                        {user && (
                          <>
                            <Button
                              variant={deck.userLiked ? "default" : "outline"}
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => handleToggleLike(deck.id)}
                            >
                              <Heart
                                className={`h-3 w-3 mr-1 ${deck.userLiked ? "fill-current" : ""}`}
                              />
                              {deck.likeCount || 0}
                            </Button>
                            <Button
                              variant={deck.isFavorite ? "default" : "outline"}
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => handleToggleFavorite(deck.id)}
                              title={deck.isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                            >
                              <Star
                                className={`h-3 w-3 ${deck.isFavorite ? "fill-current" : ""}`}
                              />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-300">
            {filteredDecks.map((deck) => {
              const cardCount = deck.cards.reduce((sum, dc) => sum + dc.quantity, 0)
              const publishedDate = deck.publishedAt
                ? new Date(deck.publishedAt)
                : new Date(deck.createdAt)
              const formattedDate = publishedDate.toLocaleDateString("es-ES", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })

              return (
                <Card key={deck.id} className="overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    <div
                      className="relative w-full sm:w-48 h-32 sm:h-auto flex-shrink-0 bg-gradient-to-br from-primary/20 to-secondary/20"
                      style={{
                        backgroundImage: `url(${deck.backgroundImage})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-xl">{deck.name}</CardTitle>
                            <div title="Público">
                              <Globe className="h-4 w-4 text-primary" aria-label="Público" />
                            </div>
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
                      {deck.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {deck.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          <p className="flex items-center gap-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {cardCount} {cardCount === 1 ? "carta" : "cartas"} · Por{" "}
                              {deck.author || "Anónimo"} · {formattedDate}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {deck.viewCount || 0}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {user ? (
                            <>
                              <Button
                                variant={deck.userLiked ? "default" : "outline"}
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => handleToggleLike(deck.id)}
                              >
                                <Heart
                                  className={`h-3 w-3 mr-1 ${deck.userLiked ? "fill-current" : ""}`}
                                />
                                {deck.likeCount || 0}
                              </Button>
                              <Button
                                variant={deck.isFavorite ? "default" : "outline"}
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => handleToggleFavorite(deck.id)}
                                title={deck.isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                              >
                                <Star
                                  className={`h-3 w-3 ${deck.isFavorite ? "fill-current" : ""}`}
                                />
                              </Button>
                            </>
                          ) : (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground px-2 py-1">
                              <Heart className="h-3 w-3" />
                              {deck.likeCount || 0}
                            </div>
                          )}
                          <div className="relative flex gap-2">
                            {/* Logo de edición sobre los botones */}
                            {deck.edition && EDITION_LOGOS[deck.edition] && (
                              <div className="absolute -top-32 right-0 z-10">
                                <div className="relative w-12 h-12" title={deck.edition}>
                                  <Image
                                    src={EDITION_LOGOS[deck.edition]}
                                    alt={deck.edition}
                                    fill
                                    className="object-contain"
                                    sizes="48px"
                                  />
                                </div>
                              </div>
                            )}
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/mazo/${deck.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/deck-builder?load=${deck.id}`}>
                                <Copy className="h-4 w-4" aria-hidden="true" />
                                <span className="sr-only">Copiar Mazo</span>
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
