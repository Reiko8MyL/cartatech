"use client"

import { useEffect, useRef } from "react"
import { getAdConfig, type AdPosition } from "@/lib/ads/config"

interface AdContainerProps {
  position: AdPosition
  className?: string
}

export function AdContainer({ position, className = "" }: AdContainerProps) {
  const adRef = useRef<HTMLDivElement>(null)
  const config = getAdConfig(position)

  useEffect(() => {
    // Solo cargar AdSense si está configurado y en el cliente
    if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_ADSENSE_ID) {
      return
    }

    // Verificar si AdSense ya está cargado
    if ((window as any).adsbygoogle) {
      try {
        // Intentar push del anuncio
        ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
      } catch (error) {
        console.error("Error al cargar anuncio:", error)
      }
    }
  }, [])

  // No mostrar anuncios si no hay ID configurado
  if (!process.env.NEXT_PUBLIC_ADSENSE_ID) {
    return null
  }

  return (
    <div
      ref={adRef}
      className={`ad-container ${className}`}
      style={config.style}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_ID}
        data-ad-slot={config.adSlot}
        data-ad-format={config.adFormat}
        data-full-width-responsive={config.responsive ? "true" : "false"}
      />
    </div>
  )
}

