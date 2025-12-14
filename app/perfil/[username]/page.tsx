"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getUserProfile, type UserProfile } from "@/lib/api/users"
import { 
  getDeckRace, 
  getDeckEdition, 
  getDeckBackgroundImage, 
  getDeckEditionLogo,
  getPrioritizedDeckTags,
  getDeckFormatName,
} from "@/lib/deck-builder/utils"
import { useCards } from "@/hooks/use-cards"
import type { DeckFormat } from "@/lib/deck-builder/types"
import { Eye, Calendar, Heart, Globe, User, ArrowLeft, Star, TrendingUp, BookOpen } from "lucide-react"
import { DeckCardSkeleton } from "@/components/ui/deck-card-skeleton"
import { optimizeCloudinaryUrl, detectDeviceType, isCloudinaryOptimized } from "@/lib/deck-builder/cloudinary-utils"
import { AvatarCard } from "@/components/ui/avatar-card"
import { useBannerSettings, getBannerStyle, getOverlayStyle, useDeviceType, useBannerSettingsMap } from "@/hooks/use-banner-settings"
import { getBackgroundImageId } from "@/lib/deck-builder/banner-utils"

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const deviceType = useDeviceType()
  
  // Cargar todas las cartas desde la API con cache
  const { cards: allCards } = useCards(false)

  // Obtener todos los IDs de imágenes únicos de los decks
  const deckImageIds = useMemo(() => {
    if (!allCards.length || !profile?.publicDecks.length) return [];
    const uniqueIds = new Set<string | null>();
    profile.publicDecks.forEach(deck => {
      const race = getDeckRace(deck.cards, allCards);
      const backgroundImage = getDeckBackgroundImage(race);
      if (backgroundImage) {
        uniqueIds.add(getBackgroundImageId(backgroundImage));
      } else {
        uniqueIds.add(null);
      }
    });
    return Array.from(uniqueIds);
  }, [profile?.publicDecks, allCards]);
  
  // Obtener ajustes para todas las imágenes
  const { settingsMap, isLoading: isLoadingBannerSettings } = useBannerSettingsMap("mazos-comunidad", "grid", deviceType, deckImageIds);

  useEffect(() => {
    if (username) {
      loadProfile()
    }
  }, [username])

  const loadProfile = async () => {
    setIsLoading(true)
    try {
      const data = await getUserProfile(username)
      setProfile(data)
    } catch (error) {
      console.error("Error al cargar perfil:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Skeleton className="h-48 w-full mb-6 rounded-lg" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <DeckCardSkeleton key={i} viewMode="grid" />
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
              <CardTitle>Usuario no encontrado</CardTitle>
              <CardDescription>
                El usuario que buscas no existe o ha sido eliminado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/mazos-comunidad")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Mazos de la Comunidad
              </Button>
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
        {/* Botón de volver */}
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
              <div className="relative">
                {/* Efecto de resplandor detrás del avatar */}
                <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl animate-pulse" />
                <div className="absolute inset-0 bg-secondary/20 rounded-full blur-xl" />
                <AvatarCard
                  card={profile.user.avatarCardId ? allCards.find((c) => c.id === profile.user.avatarCardId) || null : null}
                  size={140}
                  username={profile.user.username}
                  zoom={profile.user.avatarZoom ?? 1.0}
                  positionX={profile.user.avatarPositionX ?? 50}
                  positionY={profile.user.avatarPositionY ?? 50}
                  className="relative ring-4 ring-background shadow-2xl z-10"
                />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">
                    {profile.user.username}
                  </h1>
                  <div className="flex items-center gap-2 mt-3 text-muted-foreground">
                    <div className="p-1.5 rounded-full bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">Miembro desde {joinDate}</span>
                  </div>
                </div>
                {profile.user.bio && (
                  <div className="mt-4 p-4 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50">
                    <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
                      {profile.user.bio}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Estadísticas mejoradas */}
          <CardContent className="p-6 sm:p-8 bg-gradient-to-b from-transparent to-muted/20">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
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

        {/* Mazos públicos con el mismo diseño que mis-mazos/mazos-comunidad */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">
                Mazos Públicos
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {profile.publicDecks.length} {profile.publicDecks.length === 1 ? "mazo publicado" : "mazos publicados"}
              </p>
            </div>
          </div>

          {profile.publicDecks.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No hay mazos públicos</CardTitle>
                <CardDescription>
                  Este usuario aún no ha publicado ningún mazo.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profile.publicDecks.map((deck) => {
                const race = getDeckRace(deck.cards, allCards)
                const edition = getDeckEdition(deck.cards, allCards)
                const backgroundImage = getDeckBackgroundImage(race)
                const backgroundImageId = backgroundImage ? getBackgroundImageId(backgroundImage) : null
                const deckBannerSetting = backgroundImageId ? settingsMap.get(backgroundImageId) ?? null : null
                const cardCount = Array.isArray(deck.cards)
                  ? deck.cards.reduce((sum: number, dc: any) => sum + (dc.quantity || 0), 0)
                  : 0
                const publishedDate = deck.publishedAt
                  ? new Date(deck.publishedAt)
                  : new Date(deck.createdAt)
                const formattedDate = publishedDate.toLocaleDateString("es-ES", {
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
                          <div title="Público">
                            <Globe className="h-4 w-4 text-white" aria-label="Público" />
                          </div>
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
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href={`/mazo/${deck.id}`}>
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
      </div>
    </main>
  )
}
