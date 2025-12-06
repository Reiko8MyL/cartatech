"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getUserProfile, type UserProfile } from "@/lib/api/users"
import { getDeckRace, getDeckEdition, getDeckBackgroundImage, EDITION_LOGOS, getDeckFormatName } from "@/lib/deck-builder/utils"
import { useCards } from "@/hooks/use-cards"
import type { DeckFormat } from "@/lib/deck-builder/types"
import { Eye, Calendar, Heart, Globe, User, ArrowLeft } from "lucide-react"
import { DeckCardSkeleton } from "@/components/ui/deck-card-skeleton"
import { optimizeCloudinaryUrl, detectDeviceType } from "@/lib/deck-builder/cloudinary-utils"

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  
  // Cargar todas las cartas desde la API con cache
  const { cards: allCards } = useCards(false)

  // Detectar tipo de dispositivo para optimizar URLs de Cloudinary
  useEffect(() => {
    function updateDeviceType() {
      setDeviceType(detectDeviceType(window.innerWidth))
    }
    updateDeviceType()
    window.addEventListener('resize', updateDeviceType)
    return () => window.removeEventListener('resize', updateDeviceType)
  }, [])

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
          <Skeleton className="h-32 w-full mb-6" />
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
      <div className="mx-auto max-w-6xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        {/* Header del perfil */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold">
                {profile.user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl">{profile.user.username}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4" />
                  Miembro desde {joinDate}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{profile.stats.totalDecks}</p>
                <p className="text-sm text-muted-foreground">Mazos Totales</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{profile.stats.publicDecks}</p>
                <p className="text-sm text-muted-foreground">Mazos Públicos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{profile.stats.totalLikes}</p>
                <p className="text-sm text-muted-foreground">Likes Recibidos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{profile.stats.totalViews}</p>
                <p className="text-sm text-muted-foreground">Vistas Totales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mazos públicos */}
        <div>
          <h2 className="text-2xl font-bold mb-4">
            Mazos Públicos ({profile.publicDecks.length})
          </h2>
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
                  <Card key={deck.id} className="flex flex-col overflow-hidden group">
                    <div
                      className="relative h-32 overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20"
                      style={{
                        backgroundImage: `url(${optimizeCloudinaryUrl(backgroundImage, deviceType, true)})`, // isBanner=true
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-white text-lg line-clamp-1">
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
                            {formattedDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {deck.viewCount || 0}
                          </span>
                        </p>
                      </div>
                      <div className="relative">
                        {edition && EDITION_LOGOS[edition] && (
                          <div className="absolute -top-32 right-0 z-10">
                            <div className="relative w-24 h-24" title={edition}>
                              <Image
                                src={EDITION_LOGOS[edition]}
                                alt={edition}
                                fill
                                className="object-contain"
                                sizes="96px"
                              />
                            </div>
                          </div>
                        )}
                        <Button variant="outline" size="sm" className="w-full" asChild>
                          <Link href={`/mazo/${deck.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Mazo
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
      </div>
    </main>
  )
}

