"use client"

import { memo, useRef } from "react"
import Image from "next/image"
import { Plus, Minus, X, Info } from "lucide-react"
import type { Card } from "@/lib/deck-builder/types"
import { optimizeCloudinaryUrl } from "@/lib/deck-builder/cloudinary-utils"
import { useDeviceType } from "@/contexts/device-context"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"

interface CardItemProps {
  card: Card
  quantity: number
  maxQuantity: number
  canAddMore: boolean
  onCardClick: (card: Card) => void
  onCardRightClick: (e: React.MouseEvent, card: Card) => void
  onCardHover?: () => void
  onCardHoverEnd?: () => void
  onCardLongPress?: () => void
  onCardTouchEnd?: () => void
  priority?: boolean
  showBanListIndicator?: boolean
  onAddCard?: (card: Card) => void
  onRemoveCard?: (card: Card) => void
  onRemoveAllCards?: (card: Card) => void
  onOpenCardModal?: (card: Card) => void
}

export const CardItem = memo(function CardItem({
  card,
  quantity,
  maxQuantity,
  canAddMore,
  onCardClick,
  onCardRightClick,
  onCardHover,
  onCardHoverEnd,
  onCardLongPress,
  onCardTouchEnd,
  priority = false,
  showBanListIndicator = true,
  onAddCard,
  onRemoveCard,
  onRemoveAllCards,
  onOpenCardModal,
}: CardItemProps) {
  const touchStartTimeRef = useRef<number | null>(null)
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Drag & Drop
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: card.id,
    data: {
      type: "card",
      card,
    },
  })
  
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.6 : 1,
    transition: isDragging ? 'none' : undefined, // Sin transición durante el drag para mejor rendimiento
    userSelect: 'none' as const,
    WebkitUserSelect: 'none' as const,
    WebkitTouchCallout: 'none' as const,
    touchAction: 'manipulation' as const,
  }
  
  // Obtener tipo de dispositivo desde contexto (compartido, sin overhead)
  const deviceType = useDeviceType()
  
  // Optimizar URL de Cloudinary con transformaciones fijas
  const optimizedImageUrl = optimizeCloudinaryUrl(card.image, deviceType)
  
  // Si la URL ya tiene transformaciones de Cloudinary, deshabilitar optimización de Next.js
  // para evitar transformaciones duplicadas que consumen créditos
  const isCloudinaryOptimized = optimizedImageUrl.includes('/w_') || 
                                 optimizedImageUrl.includes('/c_') || 
                                 optimizedImageUrl.includes('/f_')
  
  const fillRatio =
    maxQuantity > 0 ? Math.min(quantity / maxQuantity, 1) : 0
  const overlayOpacity = fillRatio * 0.6

  const handleTouchStart = (e: React.TouchEvent) => {
    if (onCardLongPress) {
      touchStartTimeRef.current = Date.now()
      // Iniciar el long press después de 800ms
      touchTimeoutRef.current = setTimeout(() => {
        if (onCardLongPress) {
          onCardLongPress()
        }
      }, 800)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (onCardTouchEnd) {
      // Cancelar el long press si se suelta antes de tiempo
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current)
        touchTimeoutRef.current = null
      }
      onCardTouchEnd()
    }
    touchStartTimeRef.current = null
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`group relative aspect-[63/88] cursor-grab active:cursor-grabbing rounded-2xl overflow-hidden select-none ${isDragging ? "z-50" : ""}`}
      role="button"
      tabIndex={0}
      aria-label={`${card.name} - ${quantity > 0 ? `Cantidad: ${quantity}` : 'No está en el mazo'}`}
      onClick={() => {
        // Solo ejecutar click si no se activó el long press y no se está arrastrando
        if (!isDragging && (!touchTimeoutRef.current || Date.now() - (touchStartTimeRef.current || 0) < 800)) {
          onCardClick(card)
        }
        // Limpiar timeout si existe
        if (touchTimeoutRef.current) {
          clearTimeout(touchTimeoutRef.current)
          touchTimeoutRef.current = null
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCardClick(card);
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        onCardRightClick(e, card)
      }}
      onMouseEnter={onCardHover}
      onMouseLeave={onCardHoverEnd}
      onTouchStart={onCardLongPress ? handleTouchStart : undefined}
      onTouchEnd={onCardTouchEnd ? handleTouchEnd : undefined}
    >
      {/* Contenedor que se anima en hover (imagen + nombre + todos los elementos superiores) */}
      <div
        className={`relative w-full h-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          canAddMore ? "group-hover:scale-105 group-hover:shadow-lg" : ""
        }`}
      >
        <Image
          src={optimizedImageUrl}
          alt={card.name}
          fill
          className={`object-contain rounded ${
            canAddMore ? "" : "opacity-50"
          }`}
          // Deshabilitar optimización de Next.js si Cloudinary ya tiene transformaciones
          // Esto evita que Next.js agregue transformaciones adicionales (w=640&q=75) que consumen créditos
          unoptimized={isCloudinaryOptimized}
          // Usar tamaños más simples ya que las transformaciones están en la URL
          sizes={isCloudinaryOptimized ? undefined : "(max-width: 640px) 200px, (max-width: 768px) 250px, (max-width: 1024px) 300px, 300px"}
          loading={priority ? "eager" : "lazy"}
          priority={priority}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
          onError={(e) => {
            // Si la imagen falla, intentar recargar después de un delay
            const target = e.target as HTMLImageElement
            if (target && target.src) {
              setTimeout(() => {
                if (target.src) {
                  target.src = target.src + (target.src.includes('?') ? '&' : '?') + '_retry=' + Date.now()
                }
              }, 2000)
            }
          }}
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
            touchAction: 'manipulation',
          }}
        />

        {/* Sombreado y cantidad centrada según copias en el mazo */}
        {/* En deck builder: solo mostrar cuando quantity > 0 */}
        {/* En modo colección (maxQuantity === 100): mostrar siempre que haya callbacks */}
        {((maxQuantity === 100 && (onAddCard || onRemoveCard)) || quantity > 0) && (
          <>
            {/* Sombreado: siempre mostrar cuando quantity > 0 (tanto en deck builder como en modo colección) */}
            {quantity > 0 && (
              <div
                className="absolute inset-0 bg-black"
                style={{ opacity: overlayOpacity }}
              />
            )}
            
            {/* Botón de quitar todas las copias en el centro de la parte superior */}
            {onRemoveAllCards && quantity > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveAllCards(card)
                }}
                className="absolute top-1.5 sm:top-2 left-1/2 -translate-x-1/2 z-20 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
                aria-label={`Quitar todas las copias de ${card.name}`}
                disabled={quantity === 0}
              >
                <X className="size-3 sm:size-3.5 text-gray-800" />
              </button>
            )}
            
            {/* Contenedor central con fracción y controles */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-2">
              {/* Indicador de cantidad: "cantidad / maxQuantity" o solo "cantidad" en modo colección */}
              {/* En deck builder: solo mostrar cuando quantity > 0 */}
              {/* En modo colección: mostrar siempre */}
              {((maxQuantity === 100 && (onAddCard || onRemoveCard)) || quantity > 0) && (
                <div className="text-white font-bold text-lg sm:text-xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  {maxQuantity === 100 ? quantity : maxQuantity === 1 ? quantity : `${quantity} / ${maxQuantity}`}
                </div>
              )}
              
              {/* Controles de cantidad en rectángulo redondeado */}
              {(onAddCard || onRemoveCard) && (
                <div className="bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center gap-0 overflow-hidden shadow-lg">
                  {/* Botón de decremento */}
                  {onRemoveCard && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveCard(card)
                      }}
                      disabled={quantity === 0}
                      className="flex items-center justify-center p-1.5 sm:p-2 hover:bg-gray-200 active:bg-gray-300 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={`Quitar una copia de ${card.name}`}
                    >
                      <Minus className="size-3.5 sm:size-4 text-gray-800" />
                    </button>
                  )}
                  
                  {/* Separador vertical */}
                  {onAddCard && onRemoveCard && (
                    <div className="w-px h-6 bg-gray-300" />
                  )}
                  
                  {/* Botón de incremento */}
                  {onAddCard && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onAddCard(card)
                      }}
                      disabled={quantity >= maxQuantity || !canAddMore}
                      className="flex items-center justify-center p-1.5 sm:p-2 hover:bg-gray-200 active:bg-gray-300 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={`Agregar una copia de ${card.name}`}
                    >
                      <Plus className="size-3.5 sm:size-4 text-gray-800" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}


      {/* Botón de información en la esquina inferior derecha - siempre visible */}
      {onOpenCardModal && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onOpenCardModal(card)
          }}
          className="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 z-20 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
          aria-label={`Ver información de ${card.name}`}
        >
          <Info className="size-3 sm:size-3.5 text-gray-800" />
        </button>
      )}

      {/* Indicadores en el centro del lado derecho */}
      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-20 items-end text-[9px]">
        {/* Única (arriba) */}
        <div
          className={`px-2 py-0.5 rounded-full font-semibold whitespace-nowrap shadow-lg bg-yellow-500 text-white ${
            card.isUnique ? "opacity-100" : "opacity-0"
          }`}
        >
          Única
        </div>

        {/* Banlist (centro) - usa maxQuantity que ya viene calculado según el formato */}
        {showBanListIndicator && (
          <div
            className={`px-2 py-0.5 rounded-full font-semibold whitespace-nowrap shadow-lg text-white ${
              maxQuantity === 0
                ? "bg-red-600 opacity-100"
                : maxQuantity === 1 && !card.isUnique
                ? "bg-red-500 opacity-100"
                : maxQuantity === 2
                ? "bg-red-500 opacity-100"
                : "opacity-0"
            }`}
          >
            {maxQuantity === 0
              ? "BAN"
              : maxQuantity === 1 && !card.isUnique
              ? "Max 1"
              : maxQuantity === 2
              ? "Max 2"
              : ""}
          </div>
        )}

        {/* Rework (abajo) */}
        <div
          className={`px-2 py-0.5 rounded-full font-semibold whitespace-nowrap shadow-lg bg-purple-500 text-white ${
            card.isRework ? "opacity-100" : "opacity-0"
          }`}
        >
          Rework
          </div>
        </div>
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Comparación personalizada para evitar re-renders innecesarios
  // Solo re-renderizar si cambian las props relevantes
  if (prevProps.card.id !== nextProps.card.id) return false
  if (prevProps.quantity !== nextProps.quantity) return false
  if (prevProps.maxQuantity !== nextProps.maxQuantity) return false
  if (prevProps.canAddMore !== nextProps.canAddMore) return false
  if (prevProps.priority !== nextProps.priority) return false
  if (prevProps.showBanListIndicator !== nextProps.showBanListIndicator) return false
  // Comparar propiedades de la carta que afectan los indicadores
  if (prevProps.card.isUnique !== nextProps.card.isUnique) return false
  if (prevProps.maxQuantity !== nextProps.maxQuantity) return false
  if (prevProps.card.isRework !== nextProps.card.isRework) return false
  // Comparar handlers de hover
  if (prevProps.onCardHover !== nextProps.onCardHover) return false
  if (prevProps.onCardHoverEnd !== nextProps.onCardHoverEnd) return false
  // Comparar handlers de long press
  if (prevProps.onCardLongPress !== nextProps.onCardLongPress) return false
  if (prevProps.onCardTouchEnd !== nextProps.onCardTouchEnd) return false
  // Comparar handlers de agregar/quitar cartas
  if (prevProps.onAddCard !== nextProps.onAddCard) return false
  if (prevProps.onRemoveCard !== nextProps.onRemoveCard) return false
  if (prevProps.onRemoveAllCards !== nextProps.onRemoveAllCards) return false
  if (prevProps.onOpenCardModal !== nextProps.onOpenCardModal) return false
  // Si las funciones cambian, no re-renderizar (son estables con useCallback)
  return true
})

