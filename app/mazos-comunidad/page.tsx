"use client"

import { useState, useEffect, useMemo, Suspense, Fragment, memo, useCallback, useTransition } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import {
  getPublicDecksFromLocalStorage,
  getDeckRace,
  getDeckEdition,
  getDeckEditionLogo,
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
import { useCards } from "@/hooks/use-cards"
import { usePublicDecksQuery } from "@/hooks/use-decks-query"
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
import { toastSuccess, toastError } from "@/lib/toast"
import { Pagination } from "@/components/ui/pagination"
import { useBannerSettings, getBannerStyle, getOverlayStyle, useDeviceType, useBannerSettingsMap } from "@/hooks/use-banner-settings"
import { getBackgroundImageId } from "@/lib/deck-builder/banner-utils"
import { optimizeCloudinaryUrl, isCloudinaryOptimized } from "@/lib/deck-builder/cloudinary-utils"
import { DeckFiltersPanel, type DeckFiltersState } from "@/components/deck/deck-filters-panel"
import type { PublicDecksFilters } from "@/lib/api/decks"

// Lazy load componentes de anuncios - no críticos para render inicial
const AdInline = dynamic(
  () => import("@/components/ads/ad-inline").then((mod) => ({ default: mod.AdInline })),
  { loading: () => null }
)

const AdSidebar = dynamic(
  () => import("@/components/ads/ad-sidebar").then((mod) => ({ default: mod.AdSidebar })),
  { loading: () => null }
)

type ViewMode = "grid" | "list"

// Filtros del cliente (raza, edición, favoritos, liked) - se calculan en el cliente
interface ClientFilters {
  race: string
  edition: string
  favorites: string
  liked: string
}

function MazosComunidadPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // Leer parámetros de la URL
  const searchFromUrl = searchParams.get("search") || ""
  const formatFromUrl = searchParams.get("format") || ""
  const authorFromUrl = searchParams.get("author") || ""
  const dateFromUrl = searchParams.get("dateFrom") || ""
  const dateToUrl = searchParams.get("dateTo") || ""
  const sortByFromUrl = (searchParams.get("sortBy") || "publishedAt") as "publishedAt" | "viewCount" | "createdAt" | "likeCount" | "favoriteCount"
  const sortOrderFromUrl = (searchParams.get("sortOrder") || "desc") as "asc" | "desc"
  const minLikesFromUrl = searchParams.get("minLikes") || ""
  const minFavoritesFromUrl = searchParams.get("minFavorites") || ""
  
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const deviceType = useDeviceType()
  
  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(1)
  
  // Filtros del servidor (se envían a la API)
  const [serverFilters, setServerFilters] = useState<DeckFiltersState>({
    search: searchFromUrl,
    format: formatFromUrl,
    author: authorFromUrl,
    dateFrom: dateFromUrl,
    dateTo: dateToUrl,
    sortBy: sortByFromUrl,
    sortOrder: sortOrderFromUrl,
    minLikes: minLikesFromUrl,
    minFavorites: minFavoritesFromUrl,
  })
  
  // Filtros del cliente (raza, edición, favoritos, liked) - se aplican después de recibir datos
  const [clientFilters, setClientFilters] = useState<ClientFilters>({
    race: "",
    edition: "",
    favorites: "",
    liked: "",
  })
  
  // Obtener todas las cartas
  const { cards: allCards } = useCards(false);
  
  // Convertir serverFilters a formato de API
  const apiFilters: PublicDecksFilters = useMemo(() => ({
    search: serverFilters.search || undefined,
    format: (serverFilters.format as "RE" | "RL" | "LI") || undefined,
    author: serverFilters.author || undefined,
    dateFrom: serverFilters.dateFrom || undefined,
    dateTo: serverFilters.dateTo || undefined,
    sortBy: serverFilters.sortBy,
    sortOrder: serverFilters.sortOrder,
    minLikes: serverFilters.minLikes ? parseInt(serverFilters.minLikes, 10) : undefined,
    minFavorites: serverFilters.minFavorites ? parseInt(serverFilters.minFavorites, 10) : undefined,
  }), [serverFilters])
  
  // Obtener mazos públicos usando React Query con filtros del servidor
  const ITEMS_PER_PAGE = 12
  const { data: decksData, isLoading: isLoadingDecks } = usePublicDecksQuery(currentPage, ITEMS_PER_PAGE, apiFilters)
  const publicDecks = decksData?.decks || []
  const serverPagination = decksData?.pagination || null
  
  // Obtener todos los IDs de imágenes únicos de los decks
  const deckImageIds = useMemo(() => {
    if (!allCards.length || !publicDecks.length) return [];
    const uniqueIds = new Set<string | null>();
    publicDecks.forEach(deck => {
      const race = getDeckRace(deck.cards, allCards);
      const backgroundImage = getDeckBackgroundImage(race);
      if (backgroundImage) {
        uniqueIds.add(getBackgroundImageId(backgroundImage));
      } else {
        uniqueIds.add(null);
      }
    });
    return Array.from(uniqueIds);
  }, [publicDecks, allCards]);
  
  // Obtener ajustes para todas las imágenes
  const { settingsMap, isLoading: isLoadingBannerSettings } = useBannerSettingsMap("mazos-comunidad", viewMode, deviceType, deckImageIds);
  
  // Ajuste por defecto (para compatibilidad)
  const { setting: bannerSetting } = useBannerSettings("mazos-comunidad", viewMode, deviceType)
  
  // Pre-cargar todas las imágenes de fondo cuando se carguen los mazos
  useEffect(() => {
    if (publicDecks.length > 0 && allCards.length > 0 && typeof window !== 'undefined') {
      const imagesToPreload = new Set<string>();
      publicDecks.forEach(deck => {
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
  }, [publicDecks, allCards, deviceType]);
  
  // Estado de carga combinado
  const isLoading = isLoadingDecks || isPending
  
  // Actualizar filtros del servidor cuando cambien los parámetros de la URL
  useEffect(() => {
    setServerFilters({
      search: searchFromUrl,
      format: formatFromUrl,
      author: authorFromUrl,
      dateFrom: dateFromUrl,
      dateTo: dateToUrl,
      sortBy: sortByFromUrl,
      sortOrder: sortOrderFromUrl,
      minLikes: minLikesFromUrl,
      minFavorites: minFavoritesFromUrl,
    })
    // Resetear página cuando cambian los filtros de la URL
    setCurrentPage(1)
  }, [searchFromUrl, formatFromUrl, authorFromUrl, dateFromUrl, dateToUrl, sortByFromUrl, sortOrderFromUrl, minLikesFromUrl, minFavoritesFromUrl])
  
  // Función para actualizar URL con filtros
  const updateURLFilters = useCallback((newFilters: DeckFiltersState) => {
    startTransition(() => {
      const params = new URLSearchParams()
      
      if (newFilters.search) params.set("search", newFilters.search)
      if (newFilters.format) params.set("format", newFilters.format)
      if (newFilters.author) params.set("author", newFilters.author)
      if (newFilters.dateFrom) params.set("dateFrom", newFilters.dateFrom)
      if (newFilters.dateTo) params.set("dateTo", newFilters.dateTo)
      if (newFilters.sortBy && newFilters.sortBy !== "publishedAt") params.set("sortBy", newFilters.sortBy)
      if (newFilters.sortOrder && newFilters.sortOrder !== "desc") params.set("sortOrder", newFilters.sortOrder)
      if (newFilters.minLikes) params.set("minLikes", newFilters.minLikes)
      if (newFilters.minFavorites) params.set("minFavorites", newFilters.minFavorites)
      
      const queryString = params.toString()
      router.push(`/mazos-comunidad${queryString ? `?${queryString}` : ""}`, { scroll: false })
    })
  }, [router])
  
  // Manejar cambios en filtros del servidor
  const handleServerFiltersChange = useCallback((newFilters: DeckFiltersState) => {
    setServerFilters(newFilters)
    setCurrentPage(1) // Resetear a página 1 cuando cambian los filtros
    updateURLFilters(newFilters)
  }, [updateURLFilters])
  
  // Limpiar filtros del servidor
  const handleClearServerFilters = useCallback(() => {
    const clearedFilters: DeckFiltersState = {
      search: "",
      format: "",
      author: "",
      dateFrom: "",
      dateTo: "",
      sortBy: "publishedAt",
      sortOrder: "desc",
      minLikes: "",
      minFavorites: "",
    }
    setServerFilters(clearedFilters)
    setCurrentPage(1)
    router.push("/mazos-comunidad", { scroll: false })
  }, [router])
  
  const [likes, setLikes] = useState<Record<string, string[]>>({})
  const [favorites, setFavorites] = useState<string[]>([])
  const [loadingLikes, setLoadingLikes] = useState<Set<string>>(new Set())
  const [loadingFavorites, setLoadingFavorites] = useState<Set<string>>(new Set())

  // Cargar likes y favoritos al iniciar
  useEffect(() => {
    const loadData = async () => {
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
      }
      
      if (user) {
        try {
          const { getUserFavoriteDecksFromStorage } = await import("@/lib/deck-builder/utils");
          const userFavorites = await getUserFavoriteDecksFromStorage(user.id);
          setFavorites(userFavorites);
        } catch (error) {
          console.error("Error al cargar favoritos:", error);
          // Fallback a localStorage
          const userFavorites = getUserFavoriteDecksFromLocalStorage(user.id);
          setFavorites(userFavorites);
        }
      }
    };
    
    loadData();
  }, [user])

  // Calcular raza, edición, likes y favoritos para cada mazo
  const decksWithMetadata = useMemo(() => {
    return publicDecks.map((deck: SavedDeck & { likeCount?: number; favoriteCount?: number }) => {
      const race = getDeckRace(deck.cards, allCards)
      const edition = getDeckEdition(deck.cards, allCards)
      // Usar likeCount de la API si está disponible, sino usar el estado local
      const likeCount = deck.likeCount !== undefined ? deck.likeCount : (deck.id ? (likes[deck.id]?.length || 0) : 0)
      const userLiked = user && deck.id ? (likes[deck.id]?.includes(user.id) || false) : false
      // Usar el estado favorites en lugar de leer de localStorage para actualización inmediata
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
  }, [publicDecks, allCards, likes, favorites, user])

  // Filtrar mazos con filtros del cliente (raza, edición, favoritos, liked)
  // Los filtros del servidor ya se aplicaron en la API
  const filteredDecks = useMemo(() => {
    let filtered = decksWithMetadata.filter((deck) => {
      // Filtros del cliente
      if (clientFilters.race && deck.race !== clientFilters.race) return false
      if (clientFilters.edition && deck.edition !== clientFilters.edition) return false
      // Filtrar por favoritos: solo mostrar si el usuario está logueado y el mazo está en favoritos
      if (clientFilters.favorites === "favorites") {
        if (!user || !deck.isFavorite) return false
      }
      if (clientFilters.liked === "liked" && !deck.userLiked) return false

      return true
    })

    return filtered
  }, [decksWithMetadata, clientFilters, user])

  // Usar los mazos filtrados directamente (ya están paginados por el servidor)
  const paginatedDecks = filteredDecks

  // Pre-calcular valores para cada deck - optimización de rendimiento
  const decksWithComputedValues = useMemo(() => {
    return paginatedDecks.map((deck) => {
      const cardCount = deck.cards.reduce((sum, dc) => sum + dc.quantity, 0)
      const publishedDate = deck.publishedAt
        ? new Date(deck.publishedAt)
        : new Date(deck.createdAt)
      const formattedDate = publishedDate.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
      const race = getDeckRace(deck.cards, allCards)
      const backgroundImage = getDeckBackgroundImage(race)
      const deckImageId = backgroundImage ? getBackgroundImageId(backgroundImage) : null
      const deckBannerSetting = settingsMap.get(deckImageId) || bannerSetting
      const logoUrl = getDeckEditionLogo(deck.cards, allCards)
      
      return {
        ...deck,
        cardCount,
        formattedDate,
        race,
        backgroundImage,
        deckImageId,
        deckBannerSetting,
        logoUrl,
      }
    })
  }, [paginatedDecks, allCards, settingsMap, bannerSetting])

  // Resetear página cuando cambian los filtros del cliente
  useEffect(() => {
    setCurrentPage(1)
  }, [clientFilters])

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

  const clearClientFilters = () => {
    setClientFilters({
      race: "",
      edition: "",
      favorites: "",
      liked: "",
    })
  }

  const hasActiveClientFilters = clientFilters.race || clientFilters.edition || clientFilters.favorites || clientFilters.liked

  const handleToggleLike = async (deckId: string) => {
    if (!user) return

    // Prevenir múltiples clicks
    if (loadingLikes.has(deckId)) return;
    setLoadingLikes((prev) => new Set(prev).add(deckId));

    // Actualización optimista
    const currentLikes = likes[deckId] || [];
    const isCurrentlyLiked = currentLikes.includes(user.id);
    const previousLikes = { ...likes };
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
      
      // Actualizar desde la API para sincronizar
      const { getDeckLikesFromStorage } = await import("@/lib/deck-builder/utils");
      const updatedLikes = await getDeckLikesFromStorage();
      setLikes(updatedLikes);
    } catch (error) {
      console.error("Error al alternar like:", error);
      // Revertir actualización optimista
      setLikes(previousLikes);
      const { toastError } = await import("@/lib/toast");
      toastError("Error al actualizar el like. Por favor, intenta nuevamente.");
    } finally {
      setLoadingLikes((prev) => {
        const next = new Set(prev);
        next.delete(deckId);
        return next;
      });
    }
  }

  const handleToggleFavorite = async (deckId: string) => {
    if (!user) return

    // Prevenir múltiples clicks
    if (loadingFavorites.has(deckId)) return;
    setLoadingFavorites((prev) => new Set(prev).add(deckId));

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
      
      // Verificar que el resultado coincida con la actualización optimista
      // Si no coincide, actualizar desde la API
      if (added !== !isCurrentlyFavorite) {
        const { getUserFavoriteDecksFromStorage } = await import("@/lib/deck-builder/utils");
        const updatedFavorites = await getUserFavoriteDecksFromStorage(user.id);
        setFavorites(updatedFavorites);
      }
      
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
    } finally {
      setLoadingFavorites((prev) => {
        const next = new Set(prev);
        next.delete(deckId);
        return next;
      });
    }
  }

  return (
    <main id="main-content" className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Sidebar de anuncios en desktop */}
        {/* DESACTIVADO TEMPORALMENTE - Para reactivar, descomentar la sección siguiente */}
        {/* {process.env.NEXT_PUBLIC_ADSENSE_ID && (
          <div className="hidden lg:block fixed right-4 top-24 w-48 z-10">
            <AdSidebar />
          </div>
        )} */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Mazos de la Comunidad
            </h1>
            <p className="mt-2 text-muted-foreground">
              {serverPagination?.total ?? filteredDecks.length} {serverPagination?.total === 1 ? "mazo público" : "mazos públicos"}
              {hasActiveClientFilters && ` (${filteredDecks.length} después de filtros del cliente)`}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
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

        {/* Filtros del servidor */}
        <DeckFiltersPanel
          filters={serverFilters}
          onFiltersChange={handleServerFiltersChange}
          onClearFilters={handleClearServerFilters}
          totalResults={serverPagination?.total}
          className="mb-6"
        />

        {/* Filtros del cliente (raza, edición, favoritos, liked) */}
        {hasActiveClientFilters && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Filtros Adicionales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Select
                    value={clientFilters.race || "all"}
                    onValueChange={(value) => setClientFilters({ ...clientFilters, race: value === "all" ? "" : value })}
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
                    value={clientFilters.edition || "all"}
                    onValueChange={(value) => setClientFilters({ ...clientFilters, edition: value === "all" ? "" : value })}
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
                  {user && (
                    <>
                      <Button
                        variant={clientFilters.favorites === "favorites" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setClientFilters({ ...clientFilters, favorites: clientFilters.favorites === "favorites" ? "" : "favorites" })}
                        className="w-full"
                      >
                        <Star className={`h-4 w-4 mr-2 ${clientFilters.favorites === "favorites" ? "fill-current" : ""}`} />
                        Solo favoritos
                      </Button>
                      <Button
                        variant={clientFilters.liked === "liked" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setClientFilters({ ...clientFilters, liked: clientFilters.liked === "liked" ? "" : "liked" })}
                        className="w-full"
                      >
                        <Heart className={`h-4 w-4 mr-2 ${clientFilters.liked === "liked" ? "fill-current" : ""}`} />
                        Solo con Like
                      </Button>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={clearClientFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Limpiar Filtros Adicionales
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                {(hasActiveClientFilters || serverFilters.search || serverFilters.format || serverFilters.author || serverFilters.dateFrom || serverFilters.dateTo) ? "No se encontraron mazos" : "No hay mazos públicos aún"}
              </CardTitle>
              <CardDescription>
                {(hasActiveClientFilters || serverFilters.search || serverFilters.format || serverFilters.author || serverFilters.dateFrom || serverFilters.dateTo)
                  ? "Intenta ajustar los filtros para encontrar mazos."
                  : "Sé el primero en compartir tu mazo con la comunidad. Crea un mazo en el Deck Builder y publícalo desde \"Mis Mazos\"."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(hasActiveClientFilters || serverFilters.search || serverFilters.format || serverFilters.author || serverFilters.dateFrom || serverFilters.dateTo) ? (
                <div className="flex gap-2">
                  {(hasActiveClientFilters) && (
                    <Button variant="outline" onClick={clearClientFilters}>
                      Limpiar Filtros Adicionales
                    </Button>
                  )}
                  {(serverFilters.search || serverFilters.format || serverFilters.author || serverFilters.dateFrom || serverFilters.dateTo) && (
                    <Button variant="outline" onClick={handleClearServerFilters}>
                      Limpiar Filtros Principales
                    </Button>
                  )}
                </div>
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
            {decksWithComputedValues.map((deck, index) => {
              // Insertar anuncio inline cada 6 mazos
              // DESACTIVADO TEMPORALMENTE - Para reactivar, descomentar la línea siguiente y el bloque de anuncio
              // const shouldShowAd = index > 0 && index % 6 === 0 && process.env.NEXT_PUBLIC_ADSENSE_ID

              return (
                <Fragment key={`deck-wrapper-${deck.id}`}>
                  {/* DESACTIVADO TEMPORALMENTE - Para reactivar, descomentar el bloque siguiente */}
                  {/* {shouldShowAd && (
                    <div className="hidden lg:flex col-span-full justify-center my-4">
                      <AdInline />
                    </div>
                  )} */}
                  <Card className="flex flex-col overflow-hidden group">
                  <div
                        className="relative overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20"
                        style={getBannerStyle(deck.backgroundImage, deck.deckBannerSetting, deviceType, viewMode)}
                  >
                        <div className="absolute inset-0" style={getOverlayStyle(deck.deckBannerSetting)} />
                    {/* Logo de edición en esquina superior izquierda */}
                    {deck.logoUrl && (() => {
                      const optimizedLogoUrl = optimizeCloudinaryUrl(deck.logoUrl, deviceType)
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
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Por{" "}
                          {deck.author ? (
                            <Link
                              href={`/perfil/${deck.author}`}
                              className="hover:underline font-semibold"
                            >
                              {deck.author}
                            </Link>
                          ) : (
                            "Anónimo"
                          )}{" "}
                          · {deck.formattedDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {deck.viewCount || 0}
                        </span>
                      </p>
                    </div>
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
                          </>
                        )}
                    </div>
                  </CardContent>
                </Card>
                </Fragment>
              )
            })}
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-300">
            {decksWithComputedValues.map((deck) => {

              return (
                <Card key={deck.id} className="overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    <div
                      className="relative w-full sm:w-64 flex-shrink-0 bg-gradient-to-br from-primary/20 to-secondary/20"
                      style={getBannerStyle(deck.backgroundImage, deck.deckBannerSetting, deviceType, viewMode)}
                    >
                      <div className="absolute inset-0" style={getOverlayStyle(deck.deckBannerSetting)} />
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
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Por{" "}
                              {deck.author ? (
                                <Link
                                  href={`/perfil/${deck.author}`}
                                  className="hover:underline font-semibold"
                                >
                                  {deck.author}
                                </Link>
                              ) : (
                                "Anónimo"
                              )}{" "}
                              · {deck.formattedDate}
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
                                onClick={() => deck.id && handleToggleLike(deck.id)}
                                disabled={!deck.id || loadingLikes.has(deck.id)}
                              >
                                <Heart
                                  className={`h-3 w-3 mr-1 ${deck.userLiked ? "fill-current" : ""} ${deck.id && loadingLikes.has(deck.id) ? "animate-pulse" : ""}`}
                                />
                                {deck.likeCount || 0}
                              </Button>
                              <Button
                                variant={deck.isFavorite ? "default" : "outline"}
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => deck.id && handleToggleFavorite(deck.id)}
                                title={deck.isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                                disabled={!deck.id || loadingFavorites.has(deck.id)}
                              >
                                <Star
                                  className={`h-3 w-3 ${deck.isFavorite ? "fill-current" : ""} ${deck.id && loadingFavorites.has(deck.id) ? "animate-pulse" : ""}`}
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
                            {deck.logoUrl && (() => {
                                    const optimizedLogoUrl = optimizeCloudinaryUrl(deck.logoUrl, deviceType)
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
                                        unoptimized={isOptimized}
                                      />
                                </div>
                              </div>
                              )
                            })()}
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
        
        {/* Paginación */}
        {serverPagination && serverPagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={serverPagination.totalPages}
              onPageChange={(page) => {
                setCurrentPage(page);
                // Scroll al inicio de la lista
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        )}
      </div>
    </main>
  )
}

export default function MazosComunidadPageWrapper() {
  return (
    <Suspense fallback={
      <main id="main-content" className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <DeckCardSkeleton key={i} viewMode="grid" />
            ))}
          </div>
        </div>
      </main>
    }>
      <MazosComunidadPage />
    </Suspense>
  )
}
