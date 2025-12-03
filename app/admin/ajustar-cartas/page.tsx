"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { getAllCardsMetadata, updateCardMetadata, getCardMetadata } from "@/lib/api/cards"
import { getAllCards } from "@/lib/deck-builder/utils"
import type { Card as CardType } from "@/lib/deck-builder/types"
import { toastSuccess, toastError } from "@/lib/toast"
import { Search, Save, RotateCcw, Loader2, Filter } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AjustarCartasPage() {
  const [allCards, setAllCards] = useState<CardType[]>([])
  const [metadataMap, setMetadataMap] = useState<Record<string, number>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"id" | "name" | "type">("id")
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null)
  const [positionY, setPositionY] = useState<number>(25)
  const [previewPositionY, setPreviewPositionY] = useState<number>(25) // Para vista previa fluida
  const [isDragging, setIsDragging] = useState(false) // Para arrastrar sobre la vista previa
  const [dragStartY, setDragStartY] = useState<number>(0) // Posición Y inicial del drag
  const [dragStartPosition, setDragStartPosition] = useState<number>(25) // Posición Y inicial del valor
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  // Cargar cartas y metadatos al montar
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const cards = getAllCards()
        setAllCards(cards)
        
        const metadata = await getAllCardsMetadata()
        setMetadataMap(metadata)
      } catch (error) {
        console.error("Error al cargar datos:", error)
        toastError("Error al cargar los datos")
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Filtrar y ordenar cartas
  const filteredAndSortedCards = useMemo(() => {
    let filtered = [...allCards]

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (card) =>
          card.id.toLowerCase().includes(term) ||
          card.name.toLowerCase().includes(term)
      )
    }

    // Filtrar por tipo
    if (typeFilter !== "all") {
      filtered = filtered.filter((card) => card.type === typeFilter)
    }

    // Ordenar
    filtered.sort((a, b) => {
      if (sortBy === "id") {
        return a.id.localeCompare(b.id)
      } else if (sortBy === "name") {
        return a.name.localeCompare(b.name)
      } else {
        // sortBy === "type"
        const typeCompare = a.type.localeCompare(b.type)
        if (typeCompare !== 0) return typeCompare
        return a.id.localeCompare(b.id)
      }
    })

    return filtered
  }, [allCards, searchTerm, typeFilter, sortBy])

  // Obtener tipos únicos para el filtro
  const uniqueTypes = useMemo(() => {
    const types = new Set(allCards.map((card) => card.type))
    return Array.from(types).sort()
  }, [allCards])

  // Cuando se selecciona una carta, cargar su posición actual
  useEffect(() => {
    if (selectedCard) {
      const currentPosition = metadataMap[selectedCard.id]
      if (currentPosition !== undefined) {
        setPositionY(currentPosition)
        setPreviewPositionY(currentPosition)
      } else {
        // Valor por defecto según tipo
        const defaults: Record<string, number> = {
          Aliado: 20,
          Arma: 25,
          Talismán: 30,
          Tótem: 28,
          Oro: 35,
        }
        const defaultPos = defaults[selectedCard.type] || 25
        setPositionY(defaultPos)
        setPreviewPositionY(defaultPos)
      }
    }
  }, [selectedCard, metadataMap])

  async function handleSave() {
    if (!selectedCard) return

    setIsSaving(true)
    try {
      await updateCardMetadata(selectedCard.id, positionY)
      
      // Actualizar el mapa local
      setMetadataMap((prev) => ({
        ...prev,
        [selectedCard.id]: positionY,
      }))
      
      toastSuccess(`Posición Y de ${selectedCard.name} guardada: ${positionY}%`)
    } catch (error) {
      console.error("Error al guardar:", error)
      const errorMessage = error instanceof Error ? error.message : "Error al guardar la posición"
      toastError(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleReset() {
    if (!selectedCard) return

    setIsSaving(true)
    try {
      await updateCardMetadata(selectedCard.id, null)
      
      // Eliminar del mapa local
      setMetadataMap((prev) => {
        const newMap = { ...prev }
        delete newMap[selectedCard.id]
        return newMap
      })
      
      // Restaurar valor por defecto
      const defaults: Record<string, number> = {
        Aliado: 20,
        Arma: 25,
        Talismán: 30,
        Tótem: 28,
        Oro: 35,
      }
      setPositionY(defaults[selectedCard.type] || 25)
      
      toastSuccess(`Ajuste personalizado de ${selectedCard.name} eliminado`)
    } catch (error) {
      console.error("Error al resetear:", error)
      const errorMessage = error instanceof Error ? error.message : "Error al resetear la posición"
      toastError(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  // Funciones para arrastrar sobre la vista previa
  function handlePreviewMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(true)
    setDragStartY(e.clientY)
    setDragStartPosition(previewPositionY)
  }

  function handlePreviewTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(true)
    if (e.touches[0]) {
      setDragStartY(e.touches[0].clientY)
      setDragStartPosition(previewPositionY)
    }
  }

  function updatePositionFromMouse(clientY: number) {
    if (!previewRef.current) return
    
    const rect = previewRef.current.getBoundingClientRect()
    const deltaY = clientY - dragStartY // Movimiento desde el inicio del drag
    const deltaPercentage = (deltaY / rect.height) * 100
    
    // Factor de sensibilidad: reducir a 0.5 para hacerlo menos sensible
    const sensitivityFactor = 0.5
    const adjustedDelta = deltaPercentage * sensitivityFactor
    
    // Aplicar el cambio incremental desde la posición inicial
    const newPosition = Math.max(0, Math.min(70, dragStartPosition + adjustedDelta))
    setPreviewPositionY(newPosition)
  }

  // Manejar movimiento del mouse/touch mientras se arrastra
  useEffect(() => {
    if (!isDragging) return

    function handleMouseMove(e: MouseEvent) {
      if (isDragging) {
        updatePositionFromMouse(e.clientY)
      }
    }

    function handleTouchMove(e: TouchEvent) {
      if (isDragging && e.touches[0]) {
        e.preventDefault()
        updatePositionFromMouse(e.touches[0].clientY)
      }
    }

    function handleMouseUp() {
      if (isDragging) {
        setIsDragging(false)
        setPositionY(previewPositionY)
      }
    }

    function handleTouchEnd() {
      if (isDragging) {
        setIsDragging(false)
        setPositionY(previewPositionY)
      }
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("touchmove", handleTouchMove, { passive: false })
    document.addEventListener("touchend", handleTouchEnd)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isDragging, previewPositionY])

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Ajustar Posición Y de Cartas</h1>
        <p className="text-muted-foreground">
          Ajusta la posición vertical de la imagen de fondo para cada carta en la lista del mazo.
          Los valores van de 0% (arriba) a 70% (abajo).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Panel de lista de cartas */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Cartas ({filteredAndSortedCards.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filtros y búsqueda */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
                <Input
                  placeholder="Buscar por ID o nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Filtrar por tipo</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {uniqueTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs">Ordenar por</Label>
                  <Select value={sortBy} onValueChange={(value: "id" | "name" | "type") => setSortBy(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id">ID</SelectItem>
                      <SelectItem value="name">Nombre</SelectItem>
                      <SelectItem value="type">Tipo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Lista de cartas */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredAndSortedCards.length > 0 ? (
              <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-2">
                {filteredAndSortedCards.map((card) => {
                  const hasCustomPosition = metadataMap[card.id] !== undefined
                  return (
                    <button
                      key={card.id}
                      onClick={() => setSelectedCard(card)}
                      className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
                        selectedCard?.id === card.id
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{card.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {card.id} • {card.type}
                          </div>
                        </div>
                        {hasCustomPosition && (
                          <div className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded font-medium shrink-0">
                            {metadataMap[card.id]}%
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No se encontraron cartas con los filtros aplicados
              </p>
            )}
          </CardContent>
        </Card>

        {/* Panel de ajuste */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedCard ? `Ajustar: ${selectedCard.name}` : "Selecciona una carta"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedCard ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="positionY">Posición Y: {previewPositionY}%</Label>
                  <Input
                    id="positionY"
                    type="range"
                    min="0"
                    max="70"
                    step="1"
                    value={previewPositionY}
                    onChange={(e) => {
                      const newValue = Number(e.target.value)
                      setPreviewPositionY(newValue)
                    }}
                    onMouseUp={(e) => {
                      // Cuando se suelta el mouse, actualizar el valor guardado
                      setPositionY(previewPositionY)
                    }}
                    onTouchEnd={(e) => {
                      // Cuando se suelta el touch, actualizar el valor guardado
                      setPositionY(previewPositionY)
                    }}
                    className="w-full cursor-pointer accent-primary"
                    style={{
                      transition: "none", // Sin transición para respuesta inmediata
                    }}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0% (Arriba)</span>
                    <span>35% (Centro)</span>
                    <span>70% (Abajo)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Valor numérico:</Label>
                  <Input
                    type="number"
                    min="0"
                    max="70"
                    step="1"
                    value={previewPositionY}
                    onChange={(e) => {
                      const value = Number(e.target.value)
                      if (value >= 0 && value <= 70) {
                        setPreviewPositionY(value)
                        setPositionY(value)
                      }
                    }}
                  />
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm font-semibold mb-2">
                    Vista previa: <span className="text-xs text-muted-foreground">(arrastra verticalmente para ajustar)</span>
                  </div>
                  <div 
                    ref={previewRef}
                    className={`relative h-16 flex items-center px-3 overflow-hidden cursor-ns-resize select-none ${
                      isDragging ? "cursor-grabbing" : "cursor-grab"
                    }`}
                    onMouseDown={handlePreviewMouseDown}
                    onTouchStart={handlePreviewTouchStart}
                    style={{
                      userSelect: "none",
                      WebkitUserSelect: "none",
                    }}
                  >
                    {/* Imagen de fondo recortada - parte del medio de la carta */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage: `url(${selectedCard.image})`,
                          backgroundPosition: `center ${previewPositionY}%`,
                          backgroundSize: "135% auto",
                          backgroundRepeat: "no-repeat",
                          clipPath: "inset(5% 0% 5% 0%)",
                          transform: "scaleX(1)",
                          transformOrigin: "left center",
                          transition: isDragging ? "none" : "background-position 0.1s ease-out",
                        }}
                      />
                    </div>
                    {/* Overlay oscuro para mejor legibilidad del texto */}
                    <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none" />
                    {/* Nombre de la carta */}
                    <span className="relative text-lg font-semibold text-white z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] pointer-events-none">
                      {selectedCard.name}
                    </span>
                    {/* Indicador visual de que se puede arrastrar */}
                    {!isDragging && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="bg-black/50 text-white text-xs px-2 py-1 rounded">
                          Arrastra para ajustar
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="size-4 mr-2" />
                        Guardar
                      </>
                    )}
                  </Button>
                  {metadataMap[selectedCard.id] !== undefined && (
                    <Button
                      onClick={handleReset}
                      disabled={isSaving}
                      variant="outline"
                    >
                      <RotateCcw className="size-4 mr-2" />
                      Resetear
                    </Button>
                  )}
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <div>
                    <strong>Tipo:</strong> {selectedCard.type}
                  </div>
                  <div>
                    <strong>Posición por defecto:</strong>{" "}
                    {selectedCard.type === "Aliado"
                      ? "20%"
                      : selectedCard.type === "Arma"
                      ? "25%"
                      : selectedCard.type === "Talismán"
                      ? "30%"
                      : selectedCard.type === "Tótem"
                      ? "28%"
                      : "35%"}
                  </div>
                  {metadataMap[selectedCard.id] !== undefined && (
                    <div className="text-primary">
                      <strong>Posición personalizada:</strong> {metadataMap[selectedCard.id]}%
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Selecciona una carta de la lista para ajustar su posición
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

