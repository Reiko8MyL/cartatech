"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { RaceVotingData } from "@/lib/voting/utils"
import { saveVoteToStorage, getRaceVotingData, getRaceVotingDataFromStorage } from "@/lib/voting/utils"
import Image from "next/image"
import { CheckCircle2, Search, X, Grid3x3, List, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { optimizeCloudinaryUrl, isCloudinaryOptimized, detectDeviceType } from "@/lib/deck-builder/cloudinary-utils"

interface VotePanelProps {
  race: string
  userId: string
  initialData: RaceVotingData
  onVoteUpdate: () => void
}

export function VotePanel({ race, userId, initialData, onVoteUpdate }: VotePanelProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(initialData.userVote)
  const [hasVoted, setHasVoted] = useState(!!initialData.userVote)
  const [data, setData] = useState<RaceVotingData>(initialData)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const [isExpanded, setIsExpanded] = useState(false)

  // Detectar tipo de dispositivo para optimizar URLs de Cloudinary
  useEffect(() => {
    function updateDeviceType() {
      setDeviceType(detectDeviceType(window.innerWidth))
    }
    updateDeviceType()
    window.addEventListener('resize', updateDeviceType)
    return () => window.removeEventListener('resize', updateDeviceType)
  }, [])

  const refreshData = useCallback(async () => {
    try {
      const updatedData = await getRaceVotingDataFromStorage(race, userId)
      setData(updatedData)
      setSelectedCardId(updatedData.userVote)
      setHasVoted(!!updatedData.userVote)
    } catch (error) {
      console.error("Error al actualizar datos de votación:", error)
      // Fallback a función síncrona
      const updatedData = getRaceVotingData(race, userId)
      setData(updatedData)
      setSelectedCardId(updatedData.userVote)
      setHasVoted(!!updatedData.userVote)
    }
  }, [race, userId])

  useEffect(() => {
    void refreshData()
  }, [refreshData])


  const handleVote = async () => {
    if (!selectedCardId) return

    try {
      await saveVoteToStorage({
        race,
        cardId: selectedCardId,
        userId,
        timestamp: Date.now(),
      })
      
      setIsExpanded(true) // Mantener el panel abierto después de votar
      await refreshData()
      onVoteUpdate()
    } catch (error) {
      console.error("Error al guardar voto:", error)
      // Fallback a localStorage
      const { saveVoteToLocalStorage } = await import("@/lib/voting/utils");
      saveVoteToLocalStorage({
        race,
        cardId: selectedCardId,
        userId,
        timestamp: Date.now(),
      })
      setIsExpanded(true) // Mantener el panel abierto después de votar
      await refreshData()
      onVoteUpdate()
    }
  }

  const handleChangeVote = () => {
    setHasVoted(false)
    setSelectedCardId(data.userVote)
    setSearchQuery("")
  }

  const filteredAllies = data.allies.filter((ally) =>
    ally.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedAlly = data.allies.find((a) => a.id === selectedCardId)

  const bannerUrls: Record<string, string> = {
    "Caballero": "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765589335/banner_caballerosss_lnfe6d.webp",
    "Defensor": "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765596334/banner_defesss_fkqn0y.webp",
    "Desafiante": "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765596334/banner_desfisss_llhdbq.webp",
    "Dragón": "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765596334/banner_drags_mqfui2.webp",
    "Eterno": "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765596334/banner_etersss_hnszgu.webp",
    "Faerie": "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765596334/banner_faeriesss_qppfr3.webp",
    "Faraón": "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765596335/banner_farasss_mny04h.webp",
    "Héroe": "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765596334/banner_herosss_ozpzri.webp",
    "Olímpico": "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765596334/banner_olimpicsss_venvjm.webp",
    "Sacerdote": "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765596334/banner_sacersss_jmqbxc.webp",
    "Sombra": "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765596335/banner_sombrasss_intx2e.webp",
    "Titán": "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765596339/banner_titanss_klfaas.webp",
  }

  const hasBanner = race in bannerUrls
  const bannerUrl = bannerUrls[race]

  return (
    <Card className="w-full relative overflow-hidden">
      {hasBanner && (
        <div 
          className={cn(
            "absolute left-0 right-0 bg-center bg-no-repeat pointer-events-none",
            !isExpanded 
              ? "inset-0 bg-cover" 
              : "-top-4 min-h-[200px] bg-contain"
          )}
          style={{
            backgroundImage: `url(${bannerUrl})`,
            opacity: 0.25,
            zIndex: 0,
          }}
        />
      )}
      <div className={cn("relative", hasBanner && "z-10")}>
        <CardHeader className={cn("pb-3", hasBanner && isExpanded && "relative overflow-hidden min-h-[200px]")}>
        <div className={cn("flex gap-2", hasBanner && isExpanded && "relative z-10", !isExpanded ? "items-center" : "items-start justify-between")}>
          <div className="flex-1 min-w-0">
            <CardTitle className={cn("text-lg sm:text-xl", !isExpanded && "text-left")}>
              ¿Cuál es tu Aliado de {race} favorito?
            </CardTitle>
            <CardDescription className={cn("mt-1", !isExpanded && "text-left")}>
              {hasVoted
                ? `Total de votos: ${data.totalVotes}`
                : "Selecciona tu aliado favorito de esta raza"}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0"
            aria-label={isExpanded ? "Colapsar" : "Expandir"}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          {!hasVoted ? (
          <>
            {/* Buscador y controles */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <Input
                    placeholder="Buscar aliado..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-9 h-9"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Limpiar búsqueda"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="flex gap-1 border rounded-md p-0.5">
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "p-1.5 rounded transition-colors",
                      viewMode === "list"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-label="Vista de lista"
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "p-1.5 rounded transition-colors",
                      viewMode === "grid"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-label="Vista de grid"
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Vista de lista desplegable */}
              {viewMode === "list" ? (
                <div className="space-y-2">
                  <Select
                    value={selectedCardId || ""}
                    onValueChange={setSelectedCardId}
                  >
                    <SelectTrigger className="h-auto min-h-[70px] py-2">
                      {selectedAlly ? (
                        <div className="flex items-center gap-3 w-full">
                          <div className="relative aspect-[63/88] w-14 h-20 flex-shrink-0 rounded overflow-hidden border border-border">
                            {(() => {
                              const optimizedImageUrl = optimizeCloudinaryUrl(selectedAlly.image, deviceType)
                              const isOptimized = isCloudinaryOptimized(optimizedImageUrl)
                              return (
                                <Image
                                  src={optimizedImageUrl}
                                  alt={selectedAlly.name}
                                  fill
                                  className="object-contain"
                                  sizes="56px"
                                  unoptimized={isOptimized}
                                />
                              )
                            })()}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <div className="font-medium truncate">{selectedAlly.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Coste: {selectedAlly.cost} | Fuerza: {selectedAlly.power}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <SelectValue placeholder="Selecciona un aliado..." />
                      )}
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px]">
                      {filteredAllies.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground px-2">
                          No se encontraron aliados
                        </div>
                      ) : (
                        filteredAllies.map((ally) => (
                          <SelectItem 
                            key={ally.id} 
                            value={ally.id}
                            className="cursor-pointer py-2"
                          >
                            <div className="flex items-center gap-3 w-full">
                              <div className="relative aspect-[63/88] w-12 h-16 flex-shrink-0 rounded overflow-hidden border border-border">
                                {(() => {
                                  const optimizedImageUrl = optimizeCloudinaryUrl(ally.image, deviceType)
                                  const isOptimized = isCloudinaryOptimized(optimizedImageUrl)
                                  return (
                                    <Image
                                      src={optimizedImageUrl}
                                      alt={ally.name}
                                      fill
                                      className="object-contain"
                                      sizes="48px"
                                      unoptimized={isOptimized}
                                    />
                                  )
                                })()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{ally.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  Coste: {ally.cost} | Fuerza: {ally.power}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {searchQuery && (
                    <div className="text-xs text-muted-foreground px-1">
                      {filteredAllies.length} resultado{filteredAllies.length !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              ) : (
                /* Vista de grid */
                <div className="space-y-2">
                  {filteredAllies.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        No se encontraron aliados con "{searchQuery}"
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="text-xs text-muted-foreground px-1">
                        {filteredAllies.length} aliado{filteredAllies.length !== 1 ? "s" : ""} disponible{filteredAllies.length !== 1 ? "s" : ""}
                      </div>
                      <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-3">
                        {filteredAllies.map((ally) => {
                          const isSelected = selectedCardId === ally.id
                          return (
                            <button
                              key={ally.id}
                              onClick={() => setSelectedCardId(ally.id)}
                              className={cn(
                                "group relative aspect-[63/88] rounded-lg overflow-hidden transition-all duration-200",
                                "hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                                isSelected
                                  ? "ring-2 ring-primary ring-offset-1 shadow-md scale-105"
                                  : "border border-border hover:border-primary/50"
                              )}
                              aria-label={`Seleccionar ${ally.name}`}
                            >
                              {(() => {
                                const optimizedImageUrl = optimizeCloudinaryUrl(ally.image, deviceType)
                                const isOptimized = isCloudinaryOptimized(optimizedImageUrl)
                                return (
                                  <Image
                                    src={optimizedImageUrl}
                                    alt={ally.name}
                                    fill
                                    className={cn(
                                      "object-contain transition-opacity",
                                      isSelected ? "opacity-100" : "opacity-90 group-hover:opacity-100"
                                    )}
                                    sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 15vw"
                                    unoptimized={isOptimized}
                                  />
                                )
                              })()}
                              {isSelected && (
                                <>
                                  <div className="absolute inset-0 bg-primary/10 border-2 border-primary rounded-lg" />
                                  <div className="absolute inset-0 flex items-center justify-center z-20">
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleVote()
                                      }}
                                      size="sm"
                                      className="shadow-lg"
                                    >
                                      Votar
                                    </Button>
                                  </div>
                                </>
                              )}
                              <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-[10px] p-1 rounded-b opacity-0 group-hover:opacity-100 transition-opacity duration-200 truncate text-center">
                                {ally.name}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            {viewMode === "list" && (
              <div className="flex justify-center pt-1">
                <Button
                  onClick={handleVote}
                  disabled={!selectedCardId}
                  className="min-w-[100px]"
                  size="sm"
                >
                  Votar
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">Ya has votado en esta encuesta</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_3fr] gap-4">
              {/* Voto del usuario - Izquierda */}
              {data.userVote && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Tu voto:</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg border border-primary">
                      <div className="flex flex-col items-center gap-2">
                        <div className="relative aspect-[63/88] w-36 h-48 rounded overflow-hidden border border-primary">
                          {(() => {
                            const userVoteAlly = data.allies.find((a) => a.id === data.userVote)
                            if (!userVoteAlly) return null
                            const optimizedImageUrl = optimizeCloudinaryUrl(userVoteAlly.image, deviceType)
                            const isOptimized = isCloudinaryOptimized(optimizedImageUrl)
                            return (
                              <Image
                                src={optimizedImageUrl}
                                alt={userVoteAlly.name}
                                fill
                                className="object-contain"
                                sizes="144px"
                                unoptimized={isOptimized}
                              />
                            )
                          })()}
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-sm sm:text-base">
                            {data.allies.find((a) => a.id === data.userVote)?.name}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Resultados - Derecha */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Resultados:</h4>
                {data.results.filter((r) => r.votes > 0).length === 0 ? (
                  <p className="text-muted-foreground text-center py-3 text-xs">
                    Aún no hay votos para esta raza
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {data.results
                      .filter((r) => r.votes > 0)
                      .map((result) => {
                        const ally = data.allies.find((a) => a.id === result.cardId)
                        return (
                          <div
                            key={result.cardId}
                            className="p-2 rounded-lg border bg-card"
                          >
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="relative aspect-[63/88] w-12 h-16 flex-shrink-0 rounded overflow-hidden border border-border">
                                {ally && (() => {
                                  const optimizedImageUrl = optimizeCloudinaryUrl(ally.image, deviceType)
                                  const isOptimized = isCloudinaryOptimized(optimizedImageUrl)
                                  return (
                                    <Image
                                      src={optimizedImageUrl}
                                      alt={ally.name}
                                      fill
                                      className="object-contain"
                                      sizes="48px"
                                      unoptimized={isOptimized}
                                    />
                                  )
                                })()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-xs sm:text-sm truncate">
                                  {result.cardName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {result.votes} voto{result.votes !== 1 ? "s" : ""} (
                                  {result.percentage.toFixed(1)}%)
                                </div>
                              </div>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${result.percentage}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-center pt-1">
              <Button
                onClick={handleChangeVote}
                variant="outline"
                className="min-w-[120px]"
                size="sm"
              >
                Cambiar mi voto
              </Button>
            </div>
          </div>
          )}
        </CardContent>
      )}
      </div>
    </Card>
  )
}

