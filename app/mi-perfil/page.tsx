"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/contexts/auth-context"
import { getMyProfile, updateMyProfile, type MyProfile } from "@/lib/api/users"
import { Save, User, Mail, Calendar, Globe, Lock, ArrowLeft, Loader2, ImageIcon, X, Eye, BookOpen, Heart, TrendingUp, Star, Edit2 } from "lucide-react"
import { toast } from "sonner"
import { useCards } from "@/hooks/use-cards"
import { AvatarCard } from "@/components/ui/avatar-card"
import { AvatarCardSelector } from "@/components/profile/avatar-card-selector"
import { AvatarEditor } from "@/components/profile/avatar-editor"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import type { Card as CardType } from "@/lib/deck-builder/types"
import { 
  getDeckRace, 
  getDeckEdition, 
  getDeckBackgroundImage, 
  getDeckEditionLogo,
  getPrioritizedDeckTags,
  getDeckFormatName,
} from "@/lib/deck-builder/utils"
import { useBannerSettings, getBannerStyle, getOverlayStyle, useDeviceType, useBannerSettingsMap } from "@/hooks/use-banner-settings"
import { getBackgroundImageId } from "@/lib/deck-builder/banner-utils"
import { optimizeCloudinaryUrl, isCloudinaryOptimized } from "@/lib/deck-builder/cloudinary-utils"
import type { DeckFormat } from "@/lib/deck-builder/types"

export default function MiPerfilPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState<MyProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedBio, setEditedBio] = useState("")
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false)
  const [isAvatarEditorOpen, setIsAvatarEditorOpen] = useState(false)
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const deviceType = useDeviceType()
  
  // Cargar todas las cartas para el selector
  const { cards: allCards } = useCards(false)

  // Obtener todos los IDs de imágenes únicos de los decks recientes y favoritos
  const recentDeckImageIds = useMemo(() => {
    if (!allCards.length || !profile) return [];
    const uniqueIds = new Set<string | null>();
    
    // Mazos recientes
    profile.recentDecks.forEach(deck => {
      const race = getDeckRace(deck.cards, allCards);
      const backgroundImage = deck.backgroundImage || getDeckBackgroundImage(race);
      if (backgroundImage) {
        uniqueIds.add(getBackgroundImageId(backgroundImage));
      } else {
        uniqueIds.add(null);
      }
    });
    
    // Favoritos recientes
    profile.recentFavorites.forEach(fav => {
      const race = getDeckRace(fav.deck.cards, allCards);
      const backgroundImage = fav.deck.backgroundImage || getDeckBackgroundImage(race);
      if (backgroundImage) {
        uniqueIds.add(getBackgroundImageId(backgroundImage));
      } else {
        uniqueIds.add(null);
      }
    });
    
    return Array.from(uniqueIds);
  }, [profile?.recentDecks, profile?.recentFavorites, allCards]);

  // Obtener ajustes para todas las imágenes de mazos recientes y favoritos
  const { settingsMap: recentDeckSettingsMap } = useBannerSettingsMap("mis-mazos", "grid", deviceType, recentDeckImageIds);

  useEffect(() => {
    if (!currentUser) {
      router.push("/inicio-sesion")
      return
    }
    if (currentUser.id) {
      loadProfile()
    } else {
      console.error("Usuario sin ID:", currentUser)
      toast.error("Error: Usuario no válido. Por favor, inicia sesión nuevamente.")
    }
  }, [currentUser])

  const loadProfile = async () => {
    if (!currentUser?.id) {
      console.error("loadProfile: currentUser.id no disponible", currentUser)
      toast.error("No se pudo identificar tu usuario. Por favor, inicia sesión nuevamente.")
      return
    }
    
    console.log("loadProfile: Cargando perfil para userId:", currentUser.id)
    setIsLoading(true)
    try {
      const data = await getMyProfile(currentUser.id)
      console.log("loadProfile: Respuesta recibida:", data ? "OK" : "null")
      if (data) {
        setProfile(data)
        setEditedBio(data.user.bio || "")
      } else {
        console.error("loadProfile: No se recibieron datos del perfil")
        toast.error("No se pudo cargar tu perfil. Por favor, intenta nuevamente.")
      }
    } catch (error) {
      console.error("Error al cargar perfil:", error)
      toast.error("Error al cargar tu perfil")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!currentUser?.id || !profile) return

    setIsSaving(true)
    try {
      const result = await updateMyProfile(currentUser.id, {
        bio: editedBio,
      })

      if (result.success && result.user) {
        setProfile({
          ...profile,
          user: result.user,
        })
        setIsEditing(false)
        toast.success("Perfil actualizado correctamente")
      } else {
        toast.error(result.error || "Error al actualizar el perfil")
      }
    } catch (error) {
      console.error("Error al guardar perfil:", error)
      toast.error("Error al guardar el perfil")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSelectAvatarCard = (cardId: string) => {
    // Abrir editor en lugar de guardar directamente
    setEditingCardId(cardId)
    setIsAvatarSelectorOpen(false)
    setIsAvatarEditorOpen(true)
  }

  const handleSaveAvatar = async (zoom: number, positionX: number, positionY: number) => {
    if (!currentUser?.id || !profile || !editingCardId) return

    // Validar y asegurar que los valores estén en el rango correcto
    const validZoom = Math.max(0.5, Math.min(3.0, zoom))
    const validPositionX = Math.max(0, Math.min(100, positionX))
    const validPositionY = Math.max(0, Math.min(100, positionY))

    console.log("Guardando avatar con valores:", {
      zoom: validZoom,
      positionX: validPositionX,
      positionY: validPositionY,
    })

    setIsUpdatingAvatar(true)
    try {
      const result = await updateMyProfile(currentUser.id, {
        avatarCardId: editingCardId,
        avatarZoom: validZoom,
        avatarPositionX: validPositionX,
        avatarPositionY: validPositionY,
      })

      if (result.success && result.user) {
        setProfile({
          ...profile,
          user: result.user,
        })
        setIsAvatarEditorOpen(false)
        setEditingCardId(null)
        toast.success("Avatar actualizado correctamente")
      } else {
        toast.error(result.error || "Error al actualizar el avatar")
      }
    } catch (error) {
      console.error("Error al actualizar avatar:", error)
      toast.error("Error al actualizar el avatar")
    } finally {
      setIsUpdatingAvatar(false)
    }
  }

  const handleEditAvatar = () => {
    if (profile?.user.avatarCardId) {
      setEditingCardId(profile.user.avatarCardId)
      setIsAvatarEditorOpen(true)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!currentUser?.id || !profile) return

    setIsUpdatingAvatar(true)
    try {
      const result = await updateMyProfile(currentUser.id, {
        avatarCardId: null,
        avatarZoom: null,
        avatarPositionX: null,
        avatarPositionY: null,
      })

      if (result.success && result.user) {
        setProfile({
          ...profile,
          user: result.user,
        })
        toast.success("Avatar eliminado")
      } else {
        toast.error(result.error || "Error al eliminar el avatar")
      }
    } catch (error) {
      console.error("Error al eliminar avatar:", error)
      toast.error("Error al eliminar el avatar")
    } finally {
      setIsUpdatingAvatar(false)
    }
  }

  // Obtener la carta del avatar si existe
  const avatarCard = profile?.user.avatarCardId
    ? allCards.find((card) => card.id === profile.user.avatarCardId) ?? null
    : null

  if (!currentUser) {
    return null
  }

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Skeleton className="h-48 w-full mb-6 rounded-lg" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Card>
            <CardHeader>
              <CardTitle>Error al cargar perfil</CardTitle>
              <CardDescription>
                No se pudo cargar tu información de perfil.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={loadProfile}>Reintentar</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const joinDate = new Date(profile.user.createdAt).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
  })

  return (
    <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        {/* Header del perfil mejorado */}
        <Card className="overflow-hidden border-2 shadow-xl">
          <div className="relative bg-gradient-to-br from-primary/30 via-secondary/20 to-primary/10 p-8 sm:p-10">
            {/* Patrón de fondo sutil */}
            <div className="absolute inset-0 opacity-[0.03]">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
                backgroundSize: '24px 24px'
              }} />
            </div>
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-8">
              {/* Avatar con controles */}
              <div className="relative group">
                {/* Efecto de resplandor detrás del avatar */}
                <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl animate-pulse" />
                <div className="absolute inset-0 bg-secondary/20 rounded-full blur-xl" />
                <AvatarCard
                  card={avatarCard}
                  size={140}
                  username={profile.user.username}
                  zoom={profile.user.avatarZoom ?? 1.0}
                  positionX={profile.user.avatarPositionX ?? 50}
                  positionY={profile.user.avatarPositionY ?? 50}
                  className="relative ring-4 ring-background shadow-2xl z-10"
                />
                {/* Controles de avatar */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center z-20">
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-9 w-9"
                      onClick={() => setIsAvatarSelectorOpen(true)}
                      disabled={isUpdatingAvatar}
                      title="Cambiar carta"
                    >
                      {isUpdatingAvatar ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ImageIcon className="h-4 w-4" />
                      )}
                    </Button>
                    {profile.user.avatarCardId && (
                      <>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-9 w-9"
                          onClick={handleEditAvatar}
                          disabled={isUpdatingAvatar}
                          title="Editar zoom y posición"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-9 w-9"
                          onClick={handleRemoveAvatar}
                          disabled={isUpdatingAvatar}
                          title="Eliminar avatar"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Información del usuario */}
              <div className="flex-1 space-y-3">
                <div>
                  <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">
                    {profile.user.username}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-full bg-primary/10">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium">{profile.user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-full bg-primary/10">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium">Miembro desde {joinDate}</span>
                    </div>
                  </div>
                </div>
                {/* Biografía */}
                <div className="mt-4">
                  {isEditing ? (
                    <div className="space-y-3 p-4 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="bio" className="text-sm font-semibold">Biografía</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsEditing(false)
                            setEditedBio(profile.user.bio || "")
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                      <Textarea
                        id="bio"
                        value={editedBio}
                        onChange={(e) => setEditedBio(e.target.value)}
                        placeholder="Escribe algo sobre ti..."
                        maxLength={500}
                        rows={4}
                        className="resize-none"
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {editedBio.length}/500 caracteres
                        </p>
                        <Button
                          size="sm"
                          onClick={handleSaveProfile}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Guardando...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Guardar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-semibold">Biografía</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditing(true)}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                      </div>
                      <p className="text-sm sm:text-base text-foreground/90 leading-relaxed min-h-[3rem]">
                        {profile.user.bio || "No has agregado una biografía aún. Haz clic en Editar para agregar una."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas mejoradas */}
          <CardContent className="p-6 sm:p-8 bg-gradient-to-b from-transparent to-muted/20">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
              <div className="text-center p-5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 hover:shadow-lg transition-all duration-300 group">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 rounded-full bg-primary/20 group-hover:bg-primary/30 transition-colors">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <p className="text-4xl font-extrabold text-foreground mb-1">{profile.stats.totalDecks}</p>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Mazos Totales</p>
              </div>
              <div className="text-center p-5 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 hover:border-blue-500/40 hover:shadow-lg transition-all duration-300 group">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 rounded-full bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                    <Globe className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
                <p className="text-4xl font-extrabold text-foreground mb-1">{profile.stats.publicDecks}</p>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Mazos Públicos</p>
              </div>
              <div className="text-center p-5 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 hover:border-purple-500/40 hover:shadow-lg transition-all duration-300 group">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 rounded-full bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                    <Lock className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
                <p className="text-4xl font-extrabold text-foreground mb-1">{profile.stats.privateDecks}</p>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Mazos Privados</p>
              </div>
              <div className="text-center p-5 rounded-xl bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 hover:border-yellow-500/40 hover:shadow-lg transition-all duration-300 group">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 rounded-full bg-yellow-500/20 group-hover:bg-yellow-500/30 transition-colors">
                    <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                  </div>
                </div>
                <p className="text-4xl font-extrabold text-foreground mb-1">{profile.stats.favoriteCount}</p>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Favoritos</p>
              </div>
              <div className="text-center p-5 rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 hover:border-red-500/40 hover:shadow-lg transition-all duration-300 group">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 rounded-full bg-red-500/20 group-hover:bg-red-500/30 transition-colors">
                    <Heart className="h-6 w-6 text-red-500 fill-red-500" />
                  </div>
                </div>
                <p className="text-4xl font-extrabold text-foreground mb-1">{profile.stats.totalLikes}</p>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Likes Recibidos</p>
              </div>
              <div className="text-center p-5 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 hover:border-green-500/40 hover:shadow-lg transition-all duration-300 group">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 rounded-full bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                    <TrendingUp className="h-6 w-6 text-green-500" />
                  </div>
                </div>
                <p className="text-4xl font-extrabold text-foreground mb-1">{profile.stats.totalViews}</p>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Vistas Totales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mazos Recientes con el mismo diseño que mis-mazos */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Mazos Recientes</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {profile.recentDecks.length} {profile.recentDecks.length === 1 ? "mazo reciente" : "mazos recientes"}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/mis-mazos">
                Ver Todos
              </Link>
            </Button>
          </div>

          {profile.recentDecks.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No hay mazos</CardTitle>
                <CardDescription>
                  Aún no has creado ningún mazo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/deck-builder">Crear Mi Primer Mazo</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profile.recentDecks.map((deck) => {
                const race = getDeckRace(deck.cards, allCards)
                const edition = getDeckEdition(deck.cards, allCards)
                const backgroundImage = deck.backgroundImage || getDeckBackgroundImage(race)
                const backgroundImageId = backgroundImage ? getBackgroundImageId(backgroundImage) : null
                const deckBannerSetting = backgroundImageId ? recentDeckSettingsMap.get(backgroundImageId) ?? null : null
                const updatedDate = new Date(deck.updatedAt)
                const formattedDate = updatedDate.toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })

                return (
                  <Card key={deck.id} className="flex flex-col overflow-hidden group hover:shadow-lg transition-shadow">
                    <div
                      className="relative overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20"
                      style={getBannerStyle(backgroundImage, deckBannerSetting, deviceType, "grid")}
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
                            <div className="relative w-[72px] h-[72px]" title={edition || "Múltiples ediciones"}>
                              <Image
                                src={optimizedLogoUrl}
                                alt={edition || "Múltiples ediciones"}
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
                          <CardTitle className="text-white text-lg line-clamp-1 drop-shadow-lg">
                            {deck.name}
                          </CardTitle>
                          {deck.isPublic ? (
                            <span title="Público">
                              <Globe className="h-4 w-4 text-white" />
                            </span>
                          ) : (
                            <span title="Privado">
                              <Lock className="h-4 w-4 text-white/80" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <CardContent className="flex-1 flex flex-col p-4">
                      <div className="flex-1 space-y-2 mb-4">
                        <div className="flex flex-wrap gap-2 text-xs items-center">
                          {race && (
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded-md">
                              {race}
                            </span>
                          )}
                          <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded-md">
                            {getDeckFormatName(deck.format as DeckFormat)}
                          </span>
                          {getPrioritizedDeckTags(deck.tags || []).map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-secondary/50 text-secondary-foreground rounded-md">
                              {tag}
                            </span>
                          ))}
                        </div>
                        {deck.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {deck.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formattedDate}
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
                            <Edit2 className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Favoritos Recientes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Favoritos Recientes</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {profile.recentFavorites.length} {profile.recentFavorites.length === 1 ? "favorito reciente" : "favoritos recientes"}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/mis-favoritos">
                Ver Todos
              </Link>
            </Button>
          </div>

          {profile.recentFavorites.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No hay favoritos</CardTitle>
                <CardDescription>
                  Aún no has marcado ningún mazo como favorito.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/mazos-comunidad">Explorar Mazos</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profile.recentFavorites.map((favorite) => {
                const race = getDeckRace(favorite.deck.cards, allCards)
                const edition = getDeckEdition(favorite.deck.cards, allCards)
                const backgroundImage = favorite.deck.backgroundImage || getDeckBackgroundImage(race)
                const backgroundImageId = backgroundImage ? getBackgroundImageId(backgroundImage) : null
                const deckBannerSetting = backgroundImageId ? recentDeckSettingsMap.get(backgroundImageId) ?? null : null
                const favoriteDate = new Date(favorite.createdAt)
                const formattedDate = favoriteDate.toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })

                return (
                  <Card key={favorite.id} className="flex flex-col overflow-hidden group hover:shadow-lg transition-shadow">
                    <div
                      className="relative overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20"
                      style={getBannerStyle(backgroundImage, deckBannerSetting, deviceType, "grid")}
                    >
                      <div className="absolute inset-0" style={getOverlayStyle(deckBannerSetting)} />
                      {/* Logo de edición en esquina superior izquierda */}
                      {(() => {
                        const logoUrl = getDeckEditionLogo(favorite.deck.cards, allCards)
                        if (!logoUrl) return null
                        const optimizedLogoUrl = optimizeCloudinaryUrl(logoUrl, deviceType)
                        const isOptimized = isCloudinaryOptimized(optimizedLogoUrl)
                        return (
                          <div className="absolute top-2 left-2 z-20">
                            <div className="relative w-[72px] h-[72px]" title={edition || "Múltiples ediciones"}>
                              <Image
                                src={optimizedLogoUrl}
                                alt={edition || "Múltiples ediciones"}
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
                          <CardTitle className="text-white text-lg line-clamp-1 drop-shadow-lg">
                            {favorite.deck.name}
                          </CardTitle>
                          {favorite.deck.isPublic ? (
                            <span title="Público">
                              <Globe className="h-4 w-4 text-white" />
                            </span>
                          ) : (
                            <span title="Privado">
                              <Lock className="h-4 w-4 text-white/80" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <CardContent className="flex-1 flex flex-col p-4">
                      <div className="flex-1 space-y-2 mb-4">
                        <div className="flex flex-wrap gap-2 text-xs items-center">
                          {race && (
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded-md">
                              {race}
                            </span>
                          )}
                          <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded-md">
                            {getDeckFormatName(favorite.deck.format as DeckFormat)}
                          </span>
                          {getPrioritizedDeckTags(favorite.deck.tags || []).map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-secondary/50 text-secondary-foreground rounded-md">
                              {tag}
                            </span>
                          ))}
                        </div>
                        {favorite.deck.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {favorite.deck.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <Link 
                            href={`/perfil/${favorite.deck.user.username}`}
                            className="hover:underline font-semibold"
                          >
                            {favorite.deck.user.username}
                          </Link>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formattedDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {favorite.deck.viewCount || 0}
                          </span>
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href={`/mazo/${favorite.deck.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Mazo
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Selector de cartas para avatar */}
        <AvatarCardSelector
          isOpen={isAvatarSelectorOpen}
          onClose={() => setIsAvatarSelectorOpen(false)}
          onSelect={handleSelectAvatarCard}
          allCards={allCards}
          currentCardId={profile.user.avatarCardId}
          onEdit={handleSelectAvatarCard}
        />

        {/* Editor de avatar */}
        {editingCardId && (
          <Dialog open={isAvatarEditorOpen} onOpenChange={setIsAvatarEditorOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Avatar</DialogTitle>
                <DialogDescription>
                  Ajusta el zoom y la posición de la carta para personalizar tu avatar
                </DialogDescription>
              </DialogHeader>
              {(() => {
                const card = allCards.find((c) => c.id === editingCardId)
                if (!card) return null
                
                return (
                  <AvatarEditor
                    card={card}
                    initialZoom={profile.user.avatarZoom ?? 1.0}
                    initialPositionX={profile.user.avatarPositionX ?? 50}
                    initialPositionY={profile.user.avatarPositionY ?? 50}
                    onSave={handleSaveAvatar}
                    onCancel={() => {
                      setIsAvatarEditorOpen(false)
                      setEditingCardId(null)
                    }}
                  />
                )
              })()}
            </DialogContent>
          </Dialog>
        )}
      </div>
    </main>
  )
}
