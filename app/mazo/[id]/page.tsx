"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getAllCards,
  getSavedDecksFromLocalStorage,
  calculateDeckStats,
  getDeckRace,
  getDeckEdition,
  getDeckBackgroundImage,
  EDITION_LOGOS,
  sortCardsByEditionAndId,
  getDeckLikeCount,
  hasUserLikedDeck,
  toggleDeckLike,
  getDeckLikesFromLocalStorage,
  saveDeckToLocalStorage,
  saveDeckToStorage,
  incrementDeckView,
  getDeckViewCount,
  getDeckFormatName,
} from "@/lib/deck-builder/utils"
import { getDeckById } from "@/lib/api/decks"
import type { SavedDeck, Card as CardType } from "@/lib/deck-builder/types"
import { DECK_TAGS } from "@/lib/deck-builder/types"
import { 
  ArrowLeft, 
  Calendar, 
  Heart, 
  Globe, 
  Lock,
  Copy,
  Edit2,
  Trash2,
  X,
  Eye,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toastSuccess, toastError } from "@/lib/toast"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { SocialShare } from "@/components/sharing/social-share"
import { CommentsSection } from "@/components/deck/comments-section"
import { DeckJsonLd } from "@/components/seo/json-ld"
import { trackDeckViewed, trackDeckLiked, trackDeckCopied } from "@/lib/analytics/events"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"

export default function ViewDeckPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const deckId = params.id as string

  const [deck, setDeck] = useState<SavedDeck | null>(null)
  const [allCards, setAllCards] = useState<CardType[]>([])
  const [likes, setLikes] = useState<Record<string, string[]>>({})
  const [viewCount, setViewCount] = useState<number>(0)
  const [editingDeck, setEditingDeck] = useState<SavedDeck | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editIsPublic, setEditIsPublic] = useState(false)
  const [editTags, setEditTags] = useState<string[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [techCardSelectorOpen, setTechCardSelectorOpen] = useState(false)

  // Cargar datos
  useEffect(() => {
    const loadDeck = async () => {
      // Primero intentar obtener desde la API
      let foundDeck: SavedDeck | null = null
      
      try {
        foundDeck = await getDeckById(deckId)
      } catch (error) {
        console.error("Error al obtener mazo desde API:", error)
      }
      
      // Si no se encuentra en la API, buscar en localStorage como fallback
      if (!foundDeck) {
        const allDecks = getSavedDecksFromLocalStorage()
        foundDeck = allDecks.find((d) => d.id === deckId) || null
      }
      
      // Si no se encuentra en ningún lugar, redirigir
      if (!foundDeck) {
        router.push("/mazos-comunidad")
        return
      }

      setDeck(foundDeck)
      setAllCards(getAllCards())
      
      // Track analytics
      if (foundDeck && foundDeck.id) {
        trackDeckViewed(foundDeck.id, foundDeck.name)
      }
      
      // Cargar likes desde la API
      try {
        const { getDeckLikesFromStorage } = await import("@/lib/deck-builder/utils");
        const deckLikes = await getDeckLikesFromStorage();
        setLikes(deckLikes);
      } catch (error) {
        console.error("Error al cargar likes:", error);
        // Fallback a localStorage
        const deckLikes = getDeckLikesFromLocalStorage();
        setLikes(deckLikes);
      }
      
      // Cargar contador de visitas actual
      // Si el mazo viene de la API, usar el viewCount del mazo
      if (foundDeck.viewCount !== undefined) {
        setViewCount(foundDeck.viewCount)
      } else {
        const currentViews = getDeckViewCount(deckId)
        setViewCount(currentViews)
        
        // Incrementar contador de visitas solo si no viene de la API
        // (la API ya incrementa el contador automáticamente)
        const newViews = incrementDeckView(deckId)
        setViewCount(newViews)
      }
    }
    
    loadDeck()
  }, [deckId, router])

  // Calcular metadata del mazo
  const deckMetadata = useMemo(() => {
    if (!deck || allCards.length === 0) return null

    const race = getDeckRace(deck.cards, allCards)
    const edition = getDeckEdition(deck.cards, allCards)
    const stats = calculateDeckStats(deck.cards, allCards)
    const likeCount = deck.id ? (likes[deck.id]?.length || 0) : 0
    const userLiked = user && deck.id ? hasUserLikedDeck(deck.id, user.id) : false
    const backgroundImage = getDeckBackgroundImage(race)

    return {
      race,
      edition,
      stats,
      likeCount,
      userLiked,
      backgroundImage,
    }
  }, [deck, allCards, likes, user])

  // Organizar cartas por tipo y edición
  const organizedCards = useMemo(() => {
    if (!deck || allCards.length === 0) return []

    const cardMap = new Map(allCards.map((card) => [card.id, card]))
    const cardsByType: Record<string, Array<{ card: CardType; quantity: number }>> = {}

    for (const deckCard of deck.cards) {
      const card = cardMap.get(deckCard.cardId)
      if (!card) continue

      if (!cardsByType[card.type]) {
        cardsByType[card.type] = []
      }

      const existing = cardsByType[card.type].find((c) => c.card.id === card.id)
      if (existing) {
        existing.quantity += deckCard.quantity
      } else {
        cardsByType[card.type].push({ card, quantity: deckCard.quantity })
      }
    }

    // Ordenar cartas dentro de cada tipo
    const typeOrder = ["Aliado", "Arma", "Talismán", "Tótem", "Oro"]
    const result: Array<{
      type: string
      cards: Array<{ card: CardType; quantity: number }>
    }> = []

    for (const type of typeOrder) {
      if (cardsByType[type]) {
        const sorted = sortCardsByEditionAndId(
          cardsByType[type].map((c) => c.card)
        )
        result.push({
          type,
          cards: sorted.map((card) => {
            const found = cardsByType[type].find((c) => c.card.id === card.id)
            return { card, quantity: found?.quantity || 0 }
          }),
        })
      }
    }

    return result
  }, [deck, allCards])

  // Calcular distribución de costes para el gráfico
  const costDistribution = useMemo(() => {
    if (!deck || allCards.length === 0) return []

    const cardMap = new Map(allCards.map((card) => [card.id, card]))
    const costCounts: Record<number, number> = {}

    for (const deckCard of deck.cards) {
      const card = cardMap.get(deckCard.cardId)
      if (!card || card.cost === null) continue

      const cost = card.cost
      costCounts[cost] = (costCounts[cost] || 0) + deckCard.quantity
    }

    return Object.entries(costCounts)
      .map(([cost, count]) => ({ cost: parseInt(cost, 10), count }))
      .sort((a, b) => a.cost - b.cost)
  }, [deck, allCards])

  // Iconos de tipos de cartas
  const typeIcons: Record<string, string> = {
    Aliado: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764396472/Aliado_icono_lvsirg.webp",
    Arma: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764396472/arma_icono_dgmgej.webp",
    Talismán: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764396473/talisman_icono_kco7k9.webp",
    Tótem: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764396473/totem_icono_fk5p2k.webp",
    Oro: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764396472/Oro_icono_godhwp.webp",
  }

  const typeLabels: Record<string, string> = {
    Aliado: "Aliados",
    Arma: "Armas",
    Talismán: "Talismanes",
    Tótem: "Tótems",
    Oro: "Oros",
  }

  const handleToggleLike = async () => {
    if (!user || !deck) return

    if (!deck.id) return;
    
    // Actualización optimista
    const currentLikes = likes[deck.id] || [];
    const isCurrentlyLiked = currentLikes.includes(user.id);
    const newLikes = { ...likes };
    
    if (isCurrentlyLiked) {
      newLikes[deck.id] = currentLikes.filter((id) => id !== user.id);
    } else {
      newLikes[deck.id] = [...currentLikes, user.id];
    }
    setLikes(newLikes);

    try {
      const { toggleDeckLikeFromStorage } = await import("@/lib/deck-builder/utils");
      await toggleDeckLikeFromStorage(deck.id, user.id);
      
      // Track analytics
      if (!isCurrentlyLiked) {
        trackDeckLiked(deck.id)
      }
      
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

  const handleEditDescription = () => {
    if (!deck) return
    if (!user || deck.userId !== user.id) {
      toastError("Solo puedes editar tus propios mazos")
      return
    }

    setEditingDeck(deck)
    setEditName(deck.name)
    setEditDescription(deck.description || "")
    setEditIsPublic(deck.isPublic || false)
    setEditTags(deck.tags || [])
  }

  const handleEditDeck = () => {
    if (!deck || !deck.id) return
    router.push(`/deck-builder?load=${deck.id}`)
  }

  const handleSaveEdit = async () => {
    if (!editingDeck || !editName.trim() || !user) {
      toastError("El nombre del mazo no puede estar vacío")
      return
    }

    const updatedDeck: SavedDeck = {
      ...editingDeck,
      name: editName.trim(),
      description: editDescription.trim() || undefined,
      isPublic: editIsPublic,
      publishedAt: editIsPublic && !editingDeck.publishedAt ? Date.now() : editingDeck.publishedAt,
      author: user.username || editingDeck.author,
      tags: editTags.length > 0 ? editTags : undefined,
    }

    try {
      // Guardar en la base de datos si hay usuario, o en localStorage como fallback
      const savedDeck = await saveDeckToStorage(updatedDeck, user.id)
      if (savedDeck) {
        setDeck(savedDeck)
        setEditingDeck(null)
        setEditName("")
        setEditDescription("")
        setEditIsPublic(false)
        setEditTags([])
        toastSuccess("Mazo actualizado correctamente")
      } else {
        // Fallback a localStorage si falla la API
        saveDeckToLocalStorage(updatedDeck)
        setDeck(updatedDeck)
        setEditingDeck(null)
        setEditName("")
        setEditDescription("")
        setEditIsPublic(false)
        setEditTags([])
        toastSuccess("Mazo actualizado correctamente (guardado local)")
      }
    } catch (error) {
      console.error("Error al guardar mazo:", error)
      // Fallback a localStorage si hay error
      saveDeckToLocalStorage(updatedDeck)
      setDeck(updatedDeck)
      setEditingDeck(null)
      setEditName("")
      setEditDescription("")
      setEditIsPublic(false)
      setEditTags([])
      toastSuccess("Mazo actualizado correctamente (guardado local)")
    }
  }

  const handleToggleTag = (tag: string) => {
    setEditTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag)
      } else {
        return [...prev, tag]
      }
    })
  }

  const handleDeleteDeck = () => {
    if (!deck || !user || deck.userId !== user.id) {
      toastError("Solo puedes eliminar tus propios mazos")
      return
    }
    setDeleteDialogOpen(true)
  }

  const confirmDeleteDeck = () => {
    if (!deck || !user) return

    if (!deck.id) return;
    
    const allSavedDecks = getSavedDecksFromLocalStorage()
    const updatedAllDecks = allSavedDecks.filter((d) => d.id !== deck.id)
    localStorage.setItem("myl_saved_decks", JSON.stringify(updatedAllDecks))
    
    toastSuccess("Mazo eliminado correctamente")
    router.push("/mis-mazos")
  }

  const handleCopyDeck = () => {
    if (!deck || !deck.id) return
    trackDeckCopied(deck.id)
    router.push(`/deck-builder?load=${deck.id}`)
  }

  // Obtener la carta tech del mazo
  const techCard = useMemo(() => {
    if (!deck?.techCardId || allCards.length === 0) return null
    return allCards.find((card) => card.id === deck.techCardId) || null
  }, [deck, allCards])

  // Obtener todas las cartas únicas del mazo para el selector, ordenadas por tipo y coste
  const deckUniqueCards = useMemo(() => {
    if (!deck || allCards.length === 0) return []
    const cardMap = new Map(allCards.map((card) => [card.id, card]))
    const uniqueCards: CardType[] = []
    const seenIds = new Set<string>()

    for (const deckCard of deck.cards) {
      const card = cardMap.get(deckCard.cardId)
      if (card && !seenIds.has(card.id)) {
        uniqueCards.push(card)
        seenIds.add(card.id)
      }
    }

    // Ordenar por tipo primero, luego por coste
    const typeOrder = ["Aliado", "Arma", "Talismán", "Tótem", "Oro"]
    return uniqueCards.sort((a, b) => {
      const typeA = typeOrder.indexOf(a.type)
      const typeB = typeOrder.indexOf(b.type)
      
      if (typeA !== typeB) {
        return typeA - typeB
      }
      
      // Si son del mismo tipo, ordenar por coste
      const costA = a.cost ?? 999
      const costB = b.cost ?? 999
      return costA - costB
    })
  }, [deck, allCards])

  const handleSelectTechCard = async (cardId: string) => {
    if (!deck || !user || deck.userId !== user.id) return

    const updatedDeck: SavedDeck = {
      ...deck,
      techCardId: cardId,
    }

    try {
      // Guardar en la base de datos si hay usuario, o en localStorage como fallback
      const savedDeck = await saveDeckToStorage(updatedDeck, user.id)
      if (savedDeck) {
        setDeck(savedDeck)
        setTechCardSelectorOpen(false)
        toastSuccess("La Carta Tech ha sido actualizada")
      } else {
        // Fallback a localStorage si falla la API
        saveDeckToLocalStorage(updatedDeck)
        setDeck(updatedDeck)
        setTechCardSelectorOpen(false)
        toastSuccess("La Carta Tech ha sido actualizada")
      }
    } catch (error) {
      console.error("Error al guardar carta tech:", error)
      // Fallback a localStorage si hay error
      saveDeckToLocalStorage(updatedDeck)
      setDeck(updatedDeck)
      setTechCardSelectorOpen(false)
      toastSuccess("La Carta Tech ha sido actualizada (guardado local)")
    }
  }

  const handleRemoveTechCard = async () => {
    if (!deck || !user || deck.userId !== user.id) return

    const updatedDeck: SavedDeck = {
      ...deck,
      techCardId: undefined,
    }

    try {
      // Guardar en la base de datos si hay usuario, o en localStorage como fallback
      const savedDeck = await saveDeckToStorage(updatedDeck, user.id)
      if (savedDeck) {
        setDeck(savedDeck)
        toastSuccess("La Carta Tech ha sido eliminada")
      } else {
        // Fallback a localStorage si falla la API
        saveDeckToLocalStorage(updatedDeck)
        setDeck(updatedDeck)
        toastSuccess("La Carta Tech ha sido eliminada")
      }
    } catch (error) {
      console.error("Error al eliminar carta tech:", error)
      // Fallback a localStorage si hay error
      saveDeckToLocalStorage(updatedDeck)
      setDeck(updatedDeck)
      toastSuccess("La Carta Tech ha sido eliminada (guardado local)")
    }
  }

  if (!deck || !deckMetadata) {
    return (
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl animate-pulse">
          {/* Skeleton del botón de volver */}
          <div className="mb-6">
            <Skeleton className="h-9 w-24" />
          </div>

          {/* Skeleton del hero section */}
          <Skeleton className="h-64 w-full rounded-lg mb-6" />

          {/* Skeleton de acciones */}
          <div className="flex flex-wrap gap-2 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-32" />
            ))}
          </div>

          {/* Skeleton de descripción */}
          <div className="mb-6 space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-20 w-full" />
          </div>

          {/* Skeleton de estadísticas */}
          <div className="mb-6 space-y-4">
            <Skeleton className="h-6 w-48" />
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-5 w-32" />
                  <div className="flex flex-wrap gap-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-24 rounded-full" />
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="aspect-[63/88] max-w-[160px] rounded-lg" />
              </div>
            </div>
          </div>

          {/* Skeleton de lista de cartas */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[63/88] rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </main>
    )
  }

  const isOwner = user && deck.userId === user.id
  const publishedDate = deck.publishedAt
    ? new Date(deck.publishedAt)
    : new Date(deck.createdAt)
  const formattedDate = publishedDate.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <>
      {deck && deck.id && (
        <DeckJsonLd
          deckId={deck.id}
          name={deck.name}
          description={deck.description}
          author={deck.author}
          publishedAt={deck.publishedAt}
          viewCount={viewCount}
          likeCount={deckMetadata.likeCount}
        />
      )}
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
        {/* Header con botón de volver */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>

        {/* Hero Section con imagen de fondo */}
        <div
          className="relative h-64 rounded-lg overflow-hidden mb-6"
          style={{
            backgroundImage: `url(${deckMetadata.backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold sm:text-4xl">{deck.name}</h1>
                  {deck.isPublic ? (
                    <div title="Público">
                      <Globe className="h-5 w-5" aria-label="Público" />
                    </div>
                  ) : (
                    <div title="Privado">
                      <Lock className="h-5 w-5" aria-label="Privado" />
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {deckMetadata.race && (
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-md text-sm">
                      {deckMetadata.race}
                    </span>
                  )}
                  <span className="px-3 py-1 bg-blue-500/30 backdrop-blur-sm rounded-md text-sm">
                    {getDeckFormatName(deck?.format)}
                  </span>
                  {deck?.tags && deck.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-md text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
                  <div className="flex items-center gap-3 text-sm text-white/90">
                    <p className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Por {deck.author || "Anónimo"} · {formattedDate}
                    </p>
                    <p className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {viewCount} {viewCount === 1 ? "visita" : "visitas"}
                    </p>
                  </div>
              </div>
              {deckMetadata.edition && EDITION_LOGOS[deckMetadata.edition] && (
                <div className="relative w-24 h-24 flex-shrink-0">
                  <Image
                    src={EDITION_LOGOS[deckMetadata.edition]}
                    alt={deckMetadata.edition}
                    fill
                    className="object-contain"
                    sizes="96px"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Acciones del mazo */}
        <div className="flex flex-wrap gap-2 mb-6">
          {isOwner ? (
            <>
              <Button variant="outline" onClick={handleEditDeck}>
                <Edit2 className="h-4 w-4 mr-2" />
                Editar Mazo
              </Button>
              <Button variant="outline" onClick={handleEditDescription}>
                <Edit2 className="h-4 w-4 mr-2" />
                Editar Descripción
              </Button>
              <Button variant="outline" onClick={handleDeleteDeck} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleCopyDeck}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar Mazo
            </Button>
          )}
          {deck.isPublic && (
            <>
              <Button
                variant={deckMetadata.userLiked ? "default" : "outline"}
                onClick={handleToggleLike}
                disabled={!user}
              >
                <Heart
                  className={`h-4 w-4 mr-2 ${deckMetadata.userLiked ? "fill-current" : ""}`}
                />
                {deckMetadata.likeCount || 0}
              </Button>
              <SocialShare
                url={deck.id ? `/mazo/${deck.id}` : ""}
                title={deck.name}
                description={deck.description}
              />
            </>
          )}
        </div>

        {/* Descripción */}
        {deck.description && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{deck.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Estadísticas */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Estadísticas del Mazo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6">
              {/* Sección izquierda: Estadísticas principales */}
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Cartas</p>
                    <p className="text-2xl font-bold">{deckMetadata.stats.totalCards}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Costo Promedio</p>
                    <p className="text-2xl font-bold">{deckMetadata.stats.averageCost.toFixed(1)}</p>
                  </div>
                  {/* Gráfico de Coste vs Cantidad */}
                  {costDistribution.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Distribución por Coste</p>
                      <div className="flex flex-wrap items-end gap-2">
                        {costDistribution.map(({ cost, count }) => {
                          const maxCount = Math.max(...costDistribution.map((c) => c.count))
                          const percentage = (count / maxCount) * 100
                          return (
                            <div key={cost} className="flex flex-col items-center gap-1">
                              <div className="text-xs font-bold">{count}</div>
                              <div className="relative w-8 bg-muted rounded-t overflow-hidden" style={{ height: `${Math.max(percentage * 0.8, 20)}px` }}>
                                <div
                                  className="absolute bottom-0 left-0 right-0 bg-primary transition-all duration-500"
                                  style={{ height: `${percentage}%` }}
                                />
                              </div>
                              <div className="text-xs font-medium text-muted-foreground">{cost}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Cartas por Tipo con Óvalos */}
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-3">Cartas por Tipo</p>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(deckMetadata.stats.cardsByType).map(([type, count]) => (
                      <div
                        key={type}
                        className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-full border border-border"
                      >
                        <div className="flex flex-col items-center min-w-[40px]">
                          <span className="text-xs font-medium text-muted-foreground mb-0.5">
                            {typeLabels[type] || type}:
                          </span>
                          <span className="text-lg font-bold">{count}</span>
                        </div>
                        {typeIcons[type] && (
                          <div className="relative w-10 h-10 flex-shrink-0">
                            <Image
                              src={typeIcons[type]}
                              alt={type}
                              fill
                              className="object-contain"
                              sizes="40px"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sección derecha: La Carta Tech */}
              <div className="lg:border-l lg:pl-6">
                <div className="mb-3">
                  <p className="text-sm font-medium">La Carta Tech</p>
                </div>
                {techCard ? (
                  <div className="relative group">
                    <div className="relative aspect-[63/88] rounded-lg overflow-hidden border-2 border-primary/50 bg-card shadow-lg max-w-[160px] w-full">
                      <Image
                        src={techCard.image}
                        alt={techCard.name}
                        fill
                        className="object-contain p-2"
                        sizes="160px"
                      />
                      {/* Efecto de brillo especial */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <p className="text-lg font-bold line-clamp-2 flex-1">{techCard.name}</p>
                      {isOwner && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleRemoveTechCard}
                          className="flex-shrink-0 h-8 w-8 p-0"
                          aria-label="Eliminar carta tech"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="relative aspect-[63/88] rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 flex items-center justify-center max-w-[160px] w-full">
                    <div className="text-center p-4">
                      <p className="text-sm text-muted-foreground mb-3">
                        {isOwner ? "Selecciona una carta" : "Sin carta tech"}
                      </p>
                      {isOwner && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTechCardSelectorOpen(true)}
                        >
                          Seleccionar
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Cartas */}
        <Card>
          <CardHeader>
            <CardTitle>Cartas del Mazo</CardTitle>
            <CardDescription>
              {deckMetadata.stats.totalCards} cartas en total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {organizedCards.map((section) => (
                <div key={section.type}>
                  <h3 className="text-xl font-semibold mb-4 pb-3 border-b">
                    {section.type} <span className="text-muted-foreground font-normal">({section.cards.reduce((sum, c) => sum + c.quantity, 0)})</span>
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {section.cards.map(({ card, quantity }) => (
                      <div
                        key={card.id}
                        className="group relative aspect-[63/88] rounded-lg overflow-hidden border border-border bg-card transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 cursor-pointer"
                      >
                        {/* Imagen de la carta completa */}
                        <Image
                          src={card.image}
                          alt={card.name}
                          fill
                          className="object-contain p-1"
                          sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, (max-width: 1280px) 16vw, 12vw"
                        />
                        
                        {/* Overlay con información al hacer hover */}
                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-3">
                          <p className="text-white font-semibold text-sm text-center mb-2 line-clamp-2">
                            {card.name}
                          </p>
                          <p className="text-white/80 text-xs text-center">
                            {card.edition}
                          </p>
                          {card.type !== "Oro" && (
                            <p className="text-white/80 text-xs text-center mt-1">
                              Costo: {card.cost ?? "N/A"}
                            </p>
                          )}
                        </div>

                        {/* Badge de cantidad centrado en la parte superior */}
                        {quantity > 1 && (
                          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg z-10">
                            {quantity}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sección de Comentarios */}
        {deck.isPublic && deck.id && (
          <div className="mt-6">
            <CommentsSection deckId={deck.id} deckName={deck.name} />
          </div>
        )}

        {/* Modal de edición */}
        <Dialog open={!!editingDeck} onOpenChange={() => setEditingDeck(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Editar Descripción del Mazo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-name">Nombre del Mazo</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Descripción (opcional)</Label>
                <Textarea
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="mt-2"
                  rows={4}
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Tags del Mazo</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {DECK_TAGS.map((tag) => (
                    <div key={tag} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag}`}
                        checked={editTags.includes(tag)}
                        onCheckedChange={() => handleToggleTag(tag)}
                      />
                      <Label
                        htmlFor={`tag-${tag}`}
                        className="text-sm font-normal leading-none cursor-pointer"
                      >
                        {tag}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="edit-public"
                  checked={editIsPublic}
                  onCheckedChange={(checked) => setEditIsPublic(checked === true)}
                />
                <div className="space-y-1">
                  <Label htmlFor="edit-public" className="text-sm font-medium leading-none cursor-pointer">
                    Publicar en la comunidad
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Al publicar, tu mazo será visible para todos los usuarios en "Mazos de la Comunidad"
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingDeck(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit}>Guardar Cambios</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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

        {/* Modal selector de La Carta Tech */}
        <Dialog open={techCardSelectorOpen} onOpenChange={setTechCardSelectorOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Seleccionar La Carta Tech</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Selecciona una carta de tu mazo para destacarla como "La Carta Tech"
              </p>
              <div className="space-y-6">
                {(() => {
                  // Agrupar cartas por tipo
                  const cardsByType = new Map<string, CardType[]>()
                  for (const card of deckUniqueCards) {
                    if (!cardsByType.has(card.type)) {
                      cardsByType.set(card.type, [])
                    }
                    cardsByType.get(card.type)!.push(card)
                  }

                  const typeOrder = ["Aliado", "Arma", "Talismán", "Tótem", "Oro"]
                  return typeOrder.map((type) => {
                    const typeCards = cardsByType.get(type)
                    if (!typeCards || typeCards.length === 0) return null

                    return (
                      <div key={type}>
                        <h3 className="text-sm font-semibold mb-3">{type}</h3>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                          {typeCards.map((card) => {
                            const isSelected = techCard?.id === card.id
                            return (
                              <button
                                key={card.id}
                                onClick={() => handleSelectTechCard(card.id)}
                                className={`relative aspect-[63/88] rounded-lg overflow-hidden border-2 transition-all ${
                                  isSelected
                                    ? "border-primary shadow-lg scale-105"
                                    : "border-border hover:border-primary/50 hover:scale-105"
                                }`}
                              >
                                <Image
                                  src={card.image}
                                  alt={card.name}
                                  fill
                                  className="object-contain p-1"
                                  sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
                                />
                                {isSelected && (
                                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                      ✓
                                    </div>
                                  </div>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTechCardSelectorOpen(false)}>
                Cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
    </>
  )
}
