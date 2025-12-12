"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { optimizeCloudinaryUrl, detectDeviceType } from "@/lib/deck-builder/cloudinary-utils"
import type { Card } from "@/lib/deck-builder/types"

interface LazyCardImageProps {
  card: Card
  priority?: boolean
  className?: string
  fill?: boolean
  sizes?: string
  onLoad?: () => void
}

/**
 * Componente de imagen lazy-loaded para cartas
 * Solo carga la imagen cuando entra en el viewport usando IntersectionObserver
 */
export function LazyCardImage({
  card,
  priority = false,
  className = "",
  fill = false,
  sizes,
  onLoad,
}: LazyCardImageProps) {
  const [shouldLoad, setShouldLoad] = useState(priority) // Cargar inmediatamente si es priority
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const imgRef = useRef<HTMLDivElement>(null)

  // Detectar tipo de dispositivo una sola vez
  useEffect(() => {
    function updateDeviceType() {
      setDeviceType(detectDeviceType(window.innerWidth))
    }
    
    updateDeviceType()
    // No escuchar resize para cada imagen - usar el tipo inicial
  }, [])

  // IntersectionObserver para lazy loading
  useEffect(() => {
    if (shouldLoad || priority) return // Ya está cargando o es priority

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: "100px", // Cargar 100px antes de que sea visible
        threshold: 0.1,
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [shouldLoad, priority])

  // Optimizar URL de Cloudinary
  const optimizedImageUrl = optimizeCloudinaryUrl(card.image, deviceType)
  const isCloudinaryOptimized = optimizedImageUrl.includes('/w_') || 
                                 optimizedImageUrl.includes('/c_') || 
                                 optimizedImageUrl.includes('/f_')

  if (!shouldLoad && !priority) {
    // Placeholder mientras no se carga
    return (
      <div
        ref={imgRef}
        className={`bg-muted animate-pulse ${className}`}
        style={fill ? { width: "100%", height: "100%" } : undefined}
      />
    )
  }

  return (
    <div ref={imgRef} className={fill ? "relative w-full h-full" : ""}>
      <Image
        src={optimizedImageUrl}
        alt={card.name}
        fill={fill}
        width={fill ? undefined : 200}
        height={fill ? undefined : 280}
        className={className}
        sizes={sizes || "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 200px"}
        priority={priority}
        unoptimized={isCloudinaryOptimized}
        onLoad={onLoad}
        loading={priority ? undefined : "lazy"}
      />
    </div>
  )
}
