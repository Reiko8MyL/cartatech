"use client"

import { useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { Eye, Calendar, Heart, Globe, User, Star, TrendingUp, BookOpen, Users, UserPlus } from "lucide-react"
import { optimizeCloudinaryUrl, isCloudinaryOptimized } from "@/lib/deck-builder/cloudinary-utils"
import { AvatarCard } from "@/components/ui/avatar-card"
import { useBannerSettingsMap, useDeviceType } from "@/hooks/use-banner-settings"
import { getBackgroundImageId } from "@/lib/deck-builder/banner-utils"
import type { UserProfile } from "@/lib/api/users"

interface PublicProfileViewProps {
  profile: UserProfile
  currentUserId?: string | null
  onFollowChange?: (isFollowing: boolean, followerCount: number) => void
}

export function PublicProfileView({ profile, currentUserId, onFollowChange }: PublicProfileViewProps) {
  const deviceType = useDeviceType()
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
  const { settingsMap } = useBannerSettingsMap("mazos-comunidad", "grid", deviceType, deckImageIds);

  const joinDate = new Date(profile.user.createdAt).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
  })

  // Banner por defecto con opacidad 70%
  const defaultBannerUrl = "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765218635/minilogo_pc0v1m.webp"
  const bannerImage = profile.user.profileBannerImage || defaultBannerUrl

  return (
    <div className="space-y-8">
      {/* Header del perfil mejorado */}
      <Card className="overflow-hidden shadow-xl">
        <div 
          className="relative bg-gradient-to-br from-primary/30 via-secondary/20 to-primary/10 p-8 sm:p-10"
        >
          {/* Imagen de fondo con opacidad */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${bannerImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: 0.7,
            }}
          />
          {/* Overlay oscuro adicional para mejor contraste */}
          <div className="absolute inset-0 bg-black/20" />
          
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
                size={168}
                username={profile.user.username}
                zoom={profile.user.avatarZoom ?? 1.0}
                positionX={profile.user.avatarPositionX ?? 50}
                positionY={profile.user.avatarPositionY ?? 50}
                className="relative ring-4 ring-background shadow-2xl z-10"
              />
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
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
              </div>
              {profile.user.bio && (
                <div className="mt-4 p-4 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50">
                  <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
                    {profile.user.bio}
                  </p>
                </div>
              )}
              
              {/* Información adicional */}
              {(profile.user.country || profile.user.region || profile.user.city || 
                (Array.isArray(profile.user.favoriteRaces) && profile.user.favoriteRaces.length > 0) ||
                profile.user.favoriteFormat || profile.user.team || profile.user.preferredStore) && (
                <div className="mt-4 p-4 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {(profile.user.country || profile.user.region || profile.user.city) && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-semibold">Ubicación</p>
                        <p className="text-sm">
                          {[profile.user.city, profile.user.region, profile.user.country]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    )}
                    
                    {Array.isArray(profile.user.favoriteRaces) && profile.user.favoriteRaces.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-semibold">Razas Favoritas</p>
                        <div className="flex flex-wrap gap-2">
                          {profile.user.favoriteRaces.map((race) => (
                            <span key={race} className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs">
                              {race}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {profile.user.favoriteFormat && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-semibold">Formato Favorito</p>
                        <p className="text-sm">{getDeckFormatName(profile.user.favoriteFormat as DeckFormat)}</p>
                      </div>
                    )}
                    
                    {profile.user.team && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-semibold">Team</p>
                        <p className="text-sm">{profile.user.team}</p>
                      </div>
                    )}
                    
                    {profile.user.preferredStore && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-semibold">Tienda TCG Preferida</p>
                        <p className="text-sm">{profile.user.preferredStore}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
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
            <div className="text-center p-5 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 hover:border-purple-500/40 hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 rounded-full bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                  <Users className="h-6 w-6 text-purple-500" />
                </div>
              </div>
              <p className="text-4xl font-extrabold text-foreground mb-1">{profile.stats.followerCount || 0}</p>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">Seguidores</p>
            </div>
            <div className="text-center p-5 rounded-xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 hover:border-cyan-500/40 hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 rounded-full bg-cyan-500/20 group-hover:bg-cyan-500/30 transition-colors">
                  <UserPlus className="h-6 w-6 text-cyan-500" />
                </div>
              </div>
              <p className="text-4xl font-extrabold text-foreground mb-1">{profile.stats.followingCount || 0}</p>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">Siguiendo</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mazos públicos */}
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
                    style={{
                      backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
                      backgroundSize: deckBannerSetting?.backgroundSize || 'cover',
                      backgroundPosition: `${deckBannerSetting?.backgroundPositionX || 50}% ${deckBannerSetting?.backgroundPositionY || 50}%`,
                      height: `${deckBannerSetting?.height || 128}px`,
                    }}
                  >
                    {deckBannerSetting && (
                      <div 
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(${deckBannerSetting.overlayGradient === 'to-t' ? 'to top' : deckBannerSetting.overlayGradient === 'to-b' ? 'to bottom' : deckBannerSetting.overlayGradient === 'to-l' ? 'to left' : 'to right'}, rgba(0,0,0,${deckBannerSetting.overlayOpacity || 0.6}), transparent)`,
                        }}
                      />
                    )}
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
  )
}
