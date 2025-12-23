"use client"

import Image from "next/image"
import type { Card } from "@/lib/deck-builder/types"
import { optimizeCloudinaryUrl } from "@/lib/deck-builder/cloudinary-utils"
import { AVATAR_BLUR_PLACEHOLDER } from "@/lib/utils/image-blur"

interface AvatarCardProps {
  card: Card | null
  size?: number
  className?: string
  username?: string
  zoom?: number
  positionX?: number
  positionY?: number
}

/**
 * Componente que muestra un avatar circular con extracto de carta
 * Si no hay carta, muestra la inicial del username
 */
export function AvatarCard({ 
  card, 
  size = 96, 
  className = "", 
  username,
  zoom = 1.0,
  positionX = 50,
  positionY = 50,
}: AvatarCardProps) {
  if (!card) {
    return (
      <div 
        className={`rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold overflow-hidden ${className}`}
        style={{ width: size, height: size }}
      >
        {username ? username.charAt(0).toUpperCase() : "?"}
      </div>
    )
  }

  // Crear URL optimizada de Cloudinary
  const optimizedImageUrl = optimizeCloudinaryUrl(card.image, 'desktop')
  
  // IMPORTANTE: Usar el mismo tamaño base de imagen que en el editor y vista previa
  // El editor y vista previa usan previewSize * 2 = 128 * 2 = 256px como tamaño base
  // Esto asegura que positionX/Y y zoom funcionen igual en todos los contextos
  const baseImageSize = 128 * 2 // 256px (mismo que previewSize * 2 en el editor)
  const imageWidth = baseImageSize * zoom
  const imageHeight = (baseImageSize * 88 / 63) * zoom // Aspect ratio 63:88
  
  // El contenedor del avatar es el tamaño del círculo (size)
  const containerSize = size
  
  // LÓGICA UNIFICADA: positionX/Y representa qué parte de la imagen (0-100%) está en el centro del círculo
  // Esta misma lógica se usa tanto en el editor como en la vista previa
  const safePositionX = Math.max(0, Math.min(100, positionX ?? 50))
  const safePositionY = Math.max(0, Math.min(100, positionY ?? 50))
  
  // El círculo está centrado en el contenedor
  const circleCenterX = containerSize / 2
  const circleCenterY = containerSize / 2
  
  // Calcular qué parte de la imagen (en píxeles desde el borde izquierdo/superior) debe estar en el centro del círculo
  const imagePointAtCircleCenterX = (safePositionX / 100) * imageWidth
  const imagePointAtCircleCenterY = (safePositionY / 100) * imageHeight
  
  // Calcular la posición de la imagen para que ese punto esté en el centro del círculo
  const imageLeft = circleCenterX - imagePointAtCircleCenterX
  const imageTop = circleCenterY - imagePointAtCircleCenterY
  
  // Debug en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.log('AvatarCard render:', {
      size,
      zoom,
      positionX: safePositionX,
      positionY: safePositionY,
      imageWidth,
      imageHeight,
      containerSize,
      imageLeft,
      imageTop,
    })
  }

  return (
    <div 
      className={`rounded-full overflow-hidden bg-primary/10 flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <div 
        className="relative w-full h-full"
        style={{
          overflow: 'hidden',
        }}
      >
        <div
          className="absolute"
          style={{
            width: `${imageWidth}px`,
            height: `${imageHeight}px`,
            left: `${imageLeft}px`,
            top: `${imageTop}px`,
          }}
        >
          <Image
            src={optimizedImageUrl}
            alt={card.name}
            width={imageWidth}
            height={imageHeight}
            className="object-contain"
            unoptimized={optimizedImageUrl.includes('res.cloudinary.com')}
            placeholder="blur"
            blurDataURL={AVATAR_BLUR_PLACEHOLDER}
            sizes={`${size}px`}
          />
        </div>
      </div>
    </div>
  )
}

