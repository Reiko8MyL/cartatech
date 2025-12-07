"use client"

import { memo, useRef, useState, useEffect } from "react"
import Image from "next/image"
import type { Card } from "@/lib/deck-builder/types"
import { optimizeCloudinaryUrl, detectDeviceType } from "@/lib/deck-builder/cloudinary-utils"

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
}: CardItemProps) {
  const touchStartTimeRef = useRef<number | null>(null)
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  
  // Detectar tipo de dispositivo para optimizar URLs de Cloudinary
  useEffect(() => {
    function updateDeviceType() {
      setDeviceType(detectDeviceType(window.innerWidth))
    }
    
    updateDeviceType()
    window.addEventListener('resize', updateDeviceType)
    return () => window.removeEventListener('resize', updateDeviceType)
  }, [])
  
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
      className="group relative aspect-[63/88] cursor-pointer rounded-2xl overflow-hidden select-none"
      role="button"
      tabIndex={0}
      aria-label={`${card.name} - ${quantity > 0 ? `Cantidad: ${quantity}` : 'No está en el mazo'}`}
      onClick={() => {
        // Solo ejecutar click si no se activó el long press
        if (!touchTimeoutRef.current || Date.now() - (touchStartTimeRef.current || 0) < 800) {
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
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        touchAction: 'manipulation',
      }}
    >
      {/* Contenedor que se anima en hover (imagen + nombre) */}
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
        {quantity > 0 && (
          <>
            <div
              className="absolute inset-0 bg-black"
              style={{ opacity: overlayOpacity }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-neutral-100 font-bold text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {quantity}
            </div>
          </>
        )}

        {/* Tooltip con nombre - escala junto con la imagen */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-xs p-1 rounded-b opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out truncate text-center">
          {card.name}
        </div>
      </div>

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
  // Si las funciones cambian, no re-renderizar (son estables con useCallback)
  return true
})

