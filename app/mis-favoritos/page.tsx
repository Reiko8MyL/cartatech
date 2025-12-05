"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import {
  getFavoriteDecks,
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
} from "@/lib/deck-builder/utils"
import { useCards } from "@/hooks/use-cards"
import type { SavedDeck } from "@/lib/deck-builder/types"
import { Globe, Eye, Grid3x3, List, Search, X, ArrowUp, ArrowDown, Calendar, Heart, Copy, Star } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { DeckCardSkeleton } from "@/components/ui/deck-card-skeleton"
import { toastSuccess, toastError } from "@/lib/toast"
import { useBannerSettings, getBannerStyle, getOverlayStyle, useDeviceType, useBannerSettingsMap } from "@/hooks/use-banner-settings"
import { getBackgroundImageId } from "@/lib/deck-builder/banner-utils"
import { optimizeCloudinaryUrl, isCloudinaryOptimized } from "@/lib/deck-builder/cloudinary-utils"

type ViewMode = "grid" | "list"
type SortBy = "name" | "edition" | "date" | "race" | "likes"
type SortDirection = "asc" | "desc"

interface DeckFilters {
  search: string
  race: string
  edition: string
}

export default function MisFavoritosPage() {
  const { user } = useAuth()
  const [favoriteDecks, setFavoriteDecks] = useState<SavedDeck[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const deviceType = useDeviceType()
  
  // Obtener todas las cartas
  const { cards: allCards } = useCards(false);
  
  // Obtener todos los IDs de imágenes únicos de los decks
  const deckImageIds = useMemo(() => {
    if (!allCards.length || !favoriteDecks.length) return [];
    const uniqueIds = new Set<string | null>();
    favoriteDecks.forEach(deck => {
      const race = getDeckRace(deck.cards, allCards);
      const backgroundImage = getDeckBackgroundImage(race);
      if (backgroundImage) {
        uniqueIds.add(getBackgroundImageId(backgroundImage));
      } else {
        uniqueIds.add(null);
      }
    });
    return Array.from(uniqueIds);
  }, [favoriteDecks, allCards]);
  
  // Obtener ajustes para todas las imágenes
  const { settingsMap, isLoading: isLoadingBannerSettings } = useBannerSettingsMap("favoritos", viewMode, deviceType, deckImageIds);
  
  // Ajuste por defecto (para compatibilidad)
  const { setting: bannerSetting } = useBannerSettings("favoritos", viewMode, deviceType)
  const [sortBy, setSortBy] = useState<SortBy>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [filters, setFilters] = useState<DeckFilters>({
    search: "",
    race: "",
    edition: "",
  })
  const [likes, setLikes] = useState<Record<string, string[]>>({})
  const [favorites, setFavorites] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Cargar favoritos y likes al iniciar
  useEffect(() => {
    if (user) {
      setIsLoading(true)
      const loadFavorites = async () => {
        try {
          // Intentar cargar desde la API primero
          const { getUserFavoriteDecks } = await import("@/lib/api/favorites");
          const result = await getUserFavoriteDecks(user.id);
          setFavoriteDecks(result.decks);
          
          // Actualizar el estado de favoritos con los IDs
          setFavorites(result.favoriteDeckIds);
        } catch (error) {
          console.error("Error al cargar favoritos desde API:", error);
          // Fallback a localStorage si la API falla
          const decks = getFavoriteDecks(user.id);
          setFavoriteDecks(decks);
          const userFavorites = getUserFavoriteDecksFromLocalStorage(user.id);
          setFavorites(userFavorites);
        }
        
        try {
          // Cargar likes desde la API
          const { getDeckLikesFromStorage } = await import("@/lib/deck-builder/utils");
          const deckLikes = await getDeckLikesFromStorage();
          setLikes(deckLikes);
        } catch (error) {
          console.error("Error al cargar likes:", error);
          // Fallback a localStorage
          const deckLikes = getDeckLikesFromLocalStorage();
          setLikes(deckLikes);
        } finally {
          setIsLoading(false);
        }
      };
      
      loadFavorites();
    } else {
      setIsLoading(false)
    }
  }, [user])

  // Calcular raza, edición, likes y favoritos para cada mazo
  const decksWithMetadata = useMemo(() => {
    return favoriteDecks.map((deck) => {
      const race = getDeckRace(deck.cards, allCards)
      const edition = getDeckEdition(deck.cards, allCards)
      // Usar el estado likes directamente para actualización inmediata
      const likeCount = deck.id ? (likes[deck.id]?.length || 0) : 0
      const userLiked = user && deck.id ? (likes[deck.id]?.includes(user.id) || false) : false
      // Usar el estado favorites directamente en lugar de leer de localStorage para actualización inmediata
      const isFavorite = user && deck.id ? favorites.includes(deck.id) : false
      // Usar viewCount del mazo si viene de la API, sino usar localStorage como fallback
      const viewCount = deck.viewCount !== undefined ? deck.viewCount : (deck.id ? getDeckViewCount(deck.id) : 0)
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
  }, [favoriteDecks, allCards, likes, favorites, user])

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

  const clearFilters = () => {
    setFilters({
      search: "",
      race: "",
      edition: "",
    })
  }

  const hasActiveFilters = filters.search || filters.race || filters.edition

  const handleToggleLike = async (deckId: string) => {
    if (!user) return

    // Actualización optimista
    const currentLikes = likes[deckId] || [];
    const isCurrentlyLiked = currentLikes.includes(user.id);
    const newLikes = { ...likes };
    
    if (isCurrentlyLiked) {
      newLikes[deckId] = currentLikes.filter((id) => id !== user.id);
    } else {
      newLikes[deckId] = [...currentLikes, user.id];
    }
    setLikes(newLikes);

    try {
      const { toggleDeckLikeFromStorage } = await import("@/lib/deck-builder/utils");
      await toggleDeckLikeFromStorage(deckId, user.id);
      
      // Actualizar desde la API
      const { getDeckLikesFromStorage } = await import("@/lib/deck-builder/utils");
      const updatedLikes = await getDeckLikesFromStorage();
      setLikes(updatedLikes);
    } catch (error) {
      console.error("Error al alternar like:", error);
      // Revertir actualización optimista
      setLikes(likes);
    }
  }

  const handleToggleFavorite = async (deckId: string) => {
    if (!user) return

    // Guardar el estado anterior para poder revertir si hay error
    const previousFavorites = [...favorites]
    const previousDecks = [...favoriteDecks]
    
    // Actualización optimista: actualizar el estado inmediatamente
    const isCurrentlyFavorite = favorites.includes(deckId)
    const newFavorites = isCurrentlyFavorite
      ? favorites.filter((id) => id !== deckId)
      : [...favorites, deckId]
    setFavorites(newFavorites)
    
    // Si se quitó de favoritos, también quitarlo de la lista de mazos
    if (isCurrentlyFavorite) {
      const newDecks = favoriteDecks.filter((deck) => deck.id !== deckId)
      setFavoriteDecks(newDecks)
    }

    try {
      const added = await toggleFavoriteDeck(deckId, user.id)
      
      // Actualizar favoritos desde la API
      const { getUserFavoriteDecks } = await import("@/lib/api/favorites");
      const result = await getUserFavoriteDecks(user.id);
      setFavorites(result.favoriteDeckIds);
      setFavoriteDecks(result.decks);
      
      if (added) {
        toastSuccess("Mazo agregado a favoritos")
      } else {
        toastSuccess("Mazo eliminado de favoritos")
      }
    } catch (error) {
      console.error("Error al alternar favorito:", error);
      // Revertir la actualización optimista en caso de error
      setFavorites(previousFavorites)
      setFavoriteDecks(previousDecks)
      toastError("Error al actualizar favoritos. Por favor intenta de nuevo.");
    }
  }

  const totalCards = useMemo(() => {
    return filteredDecks.reduce((sum, deck) => {
      return sum + deck.cards.reduce((cardSum, dc) => cardSum + dc.quantity, 0)
    }, 0)
  }, [filteredDecks])

  if (!user) {
    return (
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Mis Favoritos</h1>
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Inicia sesión para ver tus favoritos</CardTitle>
              <CardDescription>
                Debes tener una cuenta para guardar y gestionar tus mazos favoritos.
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
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Mis Favoritos
            </h1>
            <p className="mt-2 text-muted-foreground">
              {filteredDecks.length} {filteredDecks.length === 1 ? "mazo favorito" : "mazos favoritos"}
              {hasActiveFilters && ` (de ${favoriteDecks.length} total)`} · {totalCards} cartas en total
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
            <Button asChild variant="outline">
              <Link href="/mazos-comunidad">Explorar Mazos</Link>
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filtros de Búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                {hasActiveFilters ? "No se encontraron mazos" : "No tienes mazos favoritos"}
              </CardTitle>
              <CardDescription>
                {hasActiveFilters
                  ? "Intenta ajustar los filtros para encontrar tus mazos favoritos."
                  : "Explora los mazos de la comunidad y marca tus favoritos para acceder a ellos rápidamente desde aquí."}
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
                    <Link href="/mazos-comunidad">Explorar Mazos</Link>
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

              // Obtener raza e imagen de fondo del deck
              const race = getDeckRace(deck.cards, allCards);
              const backgroundImage = getDeckBackgroundImage(race);
              const deckImageId = backgroundImage ? getBackgroundImageId(backgroundImage) : null;
              const deckBannerSetting = settingsMap.get(deckImageId) || bannerSetting;

              return (
                <Card key={deck.id} className="flex flex-col overflow-hidden group">
                  <div
                    className="relative overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20"
                    style={getBannerStyle(backgroundImage, deckBannerSetting)}
                  >
                    <div className="absolute inset-0" style={getOverlayStyle(deckBannerSetting)} />
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
                            {(() => {
                              const logoUrl = EDITION_LOGOS[deck.edition]
                              const optimizedLogoUrl = optimizeCloudinaryUrl(logoUrl, deviceType)
                              const isOptimized = isCloudinaryOptimized(optimizedLogoUrl)
                              return (
                                <Image
                                  src={optimizedLogoUrl}
                                  alt={deck.edition}
                                  fill
                                  className="object-contain"
                                  sizes="96px"
                                  unoptimized={isOptimized}
                                />
                              )
                            })()}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <Link href={deck.id ? `/mazo/${deck.id}` : "#"}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={deck.id ? `/deck-builder?load=${deck.id}` : "#"}>
                            <Copy className="h-4 w-4" aria-hidden="true" />
                            <span className="sr-only">Copiar Mazo</span>
                          </Link>
                        </Button>
                        <Button
                          variant={deck.userLiked ? "default" : "outline"}
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => deck.id && handleToggleLike(deck.id)}
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
                          onClick={() => deck.id && handleToggleFavorite(deck.id)}
                          title={deck.isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                        >
                          <Star
                            className={`h-3 w-3 ${deck.isFavorite ? "fill-current" : ""}`}
                          />
                        </Button>
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

              // Obtener raza e imagen de fondo del deck
              const race = getDeckRace(deck.cards, allCards);
              const backgroundImage = getDeckBackgroundImage(race);
              const deckImageId = backgroundImage ? getBackgroundImageId(backgroundImage) : null;
              const deckBannerSetting = settingsMap.get(deckImageId) || bannerSetting;

              return (
                <Card key={deck.id} className="overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    <div
                      className="relative w-full sm:w-48 sm:h-auto flex-shrink-0 bg-gradient-to-br from-primary/20 to-secondary/20"
                      style={getBannerStyle(backgroundImage, deckBannerSetting)}
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
                          <Button
                            variant={deck.userLiked ? "default" : "outline"}
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => deck.id && handleToggleLike(deck.id)}
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
                            onClick={() => deck.id && handleToggleFavorite(deck.id)}
                            title={deck.isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                          >
                            <Star
                              className={`h-3 w-3 ${deck.isFavorite ? "fill-current" : ""}`}
                            />
                          </Button>
                          <div className="relative flex gap-2">
                            {/* Logo de edición sobre los botones */}
                            {deck.edition && EDITION_LOGOS[deck.edition] && (
                              <div className="absolute -top-32 right-0 z-10">
                                <div className="relative w-12 h-12" title={deck.edition}>
                                  {(() => {
                                    const logoUrl = EDITION_LOGOS[deck.edition]
                                    const optimizedLogoUrl = optimizeCloudinaryUrl(logoUrl, deviceType)
                                    const isOptimized = isCloudinaryOptimized(optimizedLogoUrl)
                                    return (
                                      <Image
                                        src={optimizedLogoUrl}
                                        alt={deck.edition}
                                        fill
                                        className="object-contain"
                                        sizes="48px"
                                        unoptimized={isOptimized}
                                      />
                                    )
                                  })()}
                                </div>
                              </div>
                            )}
                            <Button variant="outline" size="sm" asChild>
                              <Link href={deck.id ? `/mazo/${deck.id}` : "#"}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={deck.id ? `/deck-builder?load=${deck.id}` : "#"}>
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

