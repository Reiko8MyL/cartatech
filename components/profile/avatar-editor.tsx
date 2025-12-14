"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { ZoomIn, ZoomOut, RotateCcw, Check, X } from "lucide-react"
import type { Card } from "@/lib/deck-builder/types"
import { optimizeCloudinaryUrl } from "@/lib/deck-builder/cloudinary-utils"

interface AvatarEditorProps {
  card: Card
  initialZoom?: number
  initialPositionX?: number
  initialPositionY?: number
  onSave: (zoom: number, positionX: number, positionY: number) => void
  onCancel: () => void
}

export function AvatarEditor({
  card,
  initialZoom = 1.0,
  initialPositionX = 50,
  initialPositionY = 50,
  onSave,
  onCancel,
}: AvatarEditorProps) {
  const [zoom, setZoom] = useState(initialZoom)
  const [positionX, setPositionX] = useState(initialPositionX)
  const [positionY, setPositionY] = useState(initialPositionY)
  const [isDragging, setIsDragging] = useState(false)
  const [circlePosition, setCirclePosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const circleRef = useRef<HTMLDivElement>(null)

  const optimizedImageUrl = optimizeCloudinaryUrl(card.image, 'desktop')

  // Tamaños constantes
  const previewSize = 128 // h-32 = 128px (tamaño del avatar final)
  const containerSize = 400 // Tamaño del contenedor del editor
  const baseCircleSize = 128 // h-32 = 128px (tamaño base del círculo)

  // Valores actuales
  const currentZoom = zoom || 1.0
  const currentPositionX = positionX ?? 50
  const currentPositionY = positionY ?? 50

  // Calcular tamaño de la imagen con zoom (para la vista previa - mismo tamaño que avatar final)
  const previewImageWidth = previewSize * 2 * currentZoom
  const previewImageHeight = (previewSize * 2 * 88 / 63) * currentZoom

  // Calcular tamaño de la imagen en el editor
  // Para que el círculo de 128px cubra la misma área relativa que en la vista previa,
  // la imagen en el editor debe tener el mismo tamaño absoluto que en la vista previa
  // Vista previa: imagen de 256*zoom en contenedor de 256px
  // Editor: imagen debe ser también de 256*zoom (mismo tamaño absoluto) en contenedor de 400px
  // Esto hace que el círculo de 128px cubra exactamente la misma área de la imagen en ambos casos
  const editorImageWidth = previewImageWidth // 256 * zoom (mismo tamaño que vista previa)
  const editorImageHeight = previewImageHeight // (256 * 88 / 63) * zoom

  // El círculo en el editor debe mantener la misma relación visual que en la vista previa
  // En la vista previa: círculo de 128px sobre imagen de 256*zoom
  // En el editor: necesitamos escalar el círculo para mantener la misma relación
  // Relación en vista previa: 128 / (256 * zoom) = 0.5 / zoom
  // En editor: circleSize / (400 * zoom) debería ser igual
  // circleSize = (0.5 / zoom) * (400 * zoom) = 200
  // Pero mejor mantener el círculo fijo y ajustar la lógica de posición
  // El círculo siempre es de 128px (igual que la vista previa)
  const circleSize = baseCircleSize

  // Calcular posición del círculo en el editor basada en positionX/Y
  const minCenterX = circleSize / 2
  const maxCenterX = containerSize - circleSize / 2
  const minCenterY = circleSize / 2
  const maxCenterY = containerSize - circleSize / 2
  
  // Calcular el centro del círculo basado en positionX/Y
  const calculatedCenterX = maxCenterX > minCenterX 
    ? minCenterX + ((currentPositionX / 100) * (maxCenterX - minCenterX))
    : containerSize / 2
  const calculatedCenterY = maxCenterY > minCenterY 
    ? minCenterY + ((currentPositionY / 100) * (maxCenterY - minCenterY))
    : containerSize / 2
  
  // Convertir centro a posición de la esquina superior izquierda del círculo
  const calculatedCircleX = calculatedCenterX - circleSize / 2
  const calculatedCircleY = calculatedCenterY - circleSize / 2

  // Usar posición del estado si está arrastrando, sino usar la calculada
  const circleLeft = isDragging ? circlePosition.x : calculatedCircleX
  const circleTop = isDragging ? circlePosition.y : calculatedCircleY

  // Calcular dónde está el centro del círculo en el editor
  const circleCenterX = circleLeft + circleSize / 2
  const circleCenterY = circleTop + circleSize / 2

  // LÓGICA UNIFICADA: positionX/Y representa qué parte de la imagen (0-100%) está en el centro del círculo
  // Esta misma lógica se usa tanto en el editor como en la vista previa y en AvatarCard
  
  // Calcular qué parte de la imagen (en píxeles desde el borde izquierdo/superior) debe estar en el centro del círculo
  const imagePointAtCircleCenterX = (currentPositionX / 100) * editorImageWidth
  const imagePointAtCircleCenterY = (currentPositionY / 100) * editorImageHeight

  // Calcular la posición de la imagen para que ese punto esté en el centro del círculo
  const editorImageLeft = circleCenterX - imagePointAtCircleCenterX
  const editorImageTop = circleCenterY - imagePointAtCircleCenterY

  // Vista previa: mismo cálculo pero con el círculo siempre centrado
  const previewCircleCenterX = previewSize / 2
  const previewCircleCenterY = previewSize / 2
  const previewImagePointAtCircleCenterX = (currentPositionX / 100) * previewImageWidth
  const previewImagePointAtCircleCenterY = (currentPositionY / 100) * previewImageHeight
  const previewImageLeft = previewCircleCenterX - previewImagePointAtCircleCenterX
  const previewImageTop = previewCircleCenterY - previewImagePointAtCircleCenterY

  // Sincronizar posición del círculo cuando cambia positionX/Y o zoom (solo si no está arrastrando)
  useEffect(() => {
    if (!isDragging) {
      const minCenterX = circleSize / 2
      const maxCenterX = containerSize - circleSize / 2
      const minCenterY = circleSize / 2
      const maxCenterY = containerSize - circleSize / 2
      
      const calculatedCenterX = maxCenterX > minCenterX 
        ? minCenterX + ((currentPositionX / 100) * (maxCenterX - minCenterX))
        : containerSize / 2
      const calculatedCenterY = maxCenterY > minCenterY 
        ? minCenterY + ((currentPositionY / 100) * (maxCenterY - minCenterY))
        : containerSize / 2
      
      const newX = calculatedCenterX - circleSize / 2
      const newY = calculatedCenterY - circleSize / 2
      setCirclePosition({ x: newX, y: newY })
    }
  }, [currentPositionX, currentPositionY, currentZoom, isDragging, containerSize, circleSize])

  const handleCircleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!containerRef.current || !circleRef.current) return
    setIsDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    // Calcular nueva posición del círculo centrado en el mouse
    const newCircleX = Math.max(0, Math.min(containerSize - circleSize, mouseX - circleSize / 2))
    const newCircleY = Math.max(0, Math.min(containerSize - circleSize, mouseY - circleSize / 2))
    
    setCirclePosition({ x: newCircleX, y: newCircleY })
    
    // Calcular el centro del círculo dentro del contenedor
    const newCircleCenterX = newCircleX + circleSize / 2
    const newCircleCenterY = newCircleY + circleSize / 2
    
    // Calcular dónde está la imagen actualmente basado en positionX/Y actual
    // Usamos la posición actual del círculo (antes del movimiento) para calcular dónde está la imagen
    const currentCircleCenterX = circleLeft + circleSize / 2
    const currentCircleCenterY = circleTop + circleSize / 2
    const currentImagePointX = (currentPositionX / 100) * editorImageWidth
    const currentImagePointY = (currentPositionY / 100) * editorImageHeight
    const currentImageLeft = currentCircleCenterX - currentImagePointX
    const currentImageTop = currentCircleCenterY - currentImagePointY
    
    // Ahora, con el círculo en la nueva posición, calcular qué parte de la imagen está en el nuevo centro
    // El punto en la imagen que está en el nuevo centro del círculo
    const imagePointAtNewCenterX = newCircleCenterX - currentImageLeft
    const imagePointAtNewCenterY = newCircleCenterY - currentImageTop
    
    // Convertir a porcentaje (0-100) de la imagen completa
    const newPositionX = Math.max(0, Math.min(100, (imagePointAtNewCenterX / editorImageWidth) * 100))
    const newPositionY = Math.max(0, Math.min(100, (imagePointAtNewCenterY / editorImageHeight) * 100))
    
    setPositionX(newPositionX)
    setPositionY(newPositionY)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleReset = () => {
    setZoom(1.0)
    setPositionX(50)
    setPositionY(50)
    const centerX = containerSize / 2 - circleSize / 2
    const centerY = containerSize / 2 - circleSize / 2
    setCirclePosition({ x: centerX, y: centerY })
  }

  const handleSave = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Guardando avatar con valores:', {
        zoom: currentZoom,
        positionX: currentPositionX,
        positionY: currentPositionY,
        editorImageWidth,
        editorImageHeight,
        previewImageWidth,
        previewImageHeight,
      })
    }
    onSave(currentZoom, currentPositionX, currentPositionY)
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Arrastra el círculo sobre la carta y ajusta el zoom para personalizar tu avatar
      </div>

      {/* Vista previa del avatar circular - usa el mismo tamaño que el avatar final */}
      <div className="flex items-center justify-center py-4">
        <div className="relative">
          <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-primary/20 bg-primary/10 shadow-lg">
            <div
              className="relative w-full h-full"
              style={{
                overflow: 'hidden',
              }}
            >
              <div
                className="absolute"
                style={{
                  width: `${previewImageWidth}px`,
                  height: `${previewImageHeight}px`,
                  left: `${previewImageLeft}px`,
                  top: `${previewImageTop}px`,
                  transition: isDragging ? 'none' : 'all 0.15s ease-out',
                }}
              >
                <Image
                  src={optimizedImageUrl}
                  alt={card.name}
                  width={previewImageWidth}
                  height={previewImageHeight}
                  className="object-contain"
                  unoptimized={optimizedImageUrl.includes('res.cloudinary.com')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editor interactivo con círculo arrastrable */}
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground text-center">
          Arrastra el círculo sobre la carta para seleccionar la parte que quieres mostrar
        </div>
        <div
          ref={containerRef}
          className="relative w-full h-80 rounded-lg overflow-hidden border-2 border-border bg-gradient-to-br from-muted to-muted/50"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ touchAction: 'none' }}
        >
          {/* Imagen completa con zoom y posición */}
          <div
            className="absolute"
            style={{
              width: `${editorImageWidth}px`,
              height: `${editorImageHeight}px`,
              left: `${editorImageLeft}px`,
              top: `${editorImageTop}px`,
              transition: isDragging ? 'none' : 'all 0.15s ease-out',
            }}
          >
            <Image
              src={optimizedImageUrl}
              alt={card.name}
              width={editorImageWidth}
              height={editorImageHeight}
              className="object-contain"
              unoptimized={optimizedImageUrl.includes('res.cloudinary.com')}
              draggable={false}
              style={{ userSelect: 'none', pointerEvents: 'none' }}
            />
          </div>

          {/* Círculo arrastrable */}
          <div
            ref={circleRef}
            className={`absolute h-32 w-32 rounded-full border-4 border-primary ring-4 ring-primary/30 shadow-2xl bg-primary/5 cursor-move ${
              isDragging ? 'ring-primary/50' : ''
            }`}
            style={{
              left: `${circleLeft}px`,
              top: `${circleTop}px`,
              transition: isDragging ? 'none' : 'all 0.1s ease-out',
            }}
            onMouseDown={handleCircleMouseDown}
          >
            {/* Indicador visual cuando se arrastra */}
            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controles - Solo Zoom */}
      <div className="space-y-4 pt-4 border-t">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <ZoomIn className="h-4 w-4" />
              Zoom
            </label>
            <span className="text-sm text-muted-foreground font-mono">
              {Math.round(currentZoom * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setZoom(Math.max(0.5, currentZoom - 0.1))}
              disabled={currentZoom <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Slider
              value={[currentZoom]}
              onValueChange={(value) => setZoom(value[0])}
              min={0.5}
              max={3.0}
              step={0.1}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setZoom(Math.min(3.0, currentZoom + 0.1))}
              disabled={currentZoom >= 3.0}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex items-center justify-between gap-2 pt-4 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Restablecer
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            Guardar
          </Button>
        </div>
      </div>
    </div>
  )
}
