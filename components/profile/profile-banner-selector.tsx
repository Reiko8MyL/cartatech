"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { getAllBackgroundImages } from "@/lib/deck-builder/banner-utils"
import { Check, Loader2 } from "lucide-react"
import { isCloudinaryOptimized, optimizeCloudinaryUrl } from "@/lib/deck-builder/cloudinary-utils"
import { useDeviceType } from "@/hooks/use-banner-settings"

interface ProfileBannerSelectorProps {
  isOpen: boolean
  onClose: () => void
  currentBannerImage: string | null
  onSelect: (bannerUrl: string | null) => Promise<void>
}

const DEFAULT_BANNER_URL = "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765218635/minilogo_pc0v1m.webp"

export function ProfileBannerSelector({
  isOpen,
  onClose,
  currentBannerImage,
  onSelect,
}: ProfileBannerSelectorProps) {
  const [isSaving, setIsSaving] = useState(false)
  const deviceType = useDeviceType()
  
  const allBanners = getAllBackgroundImages()
  // Agregar el banner por defecto al inicio de la lista
  const banners = [
    {
      id: DEFAULT_BANNER_URL,
      url: DEFAULT_BANNER_URL,
      race: "Banner por Defecto",
    },
    ...allBanners,
  ]

  const handleSelect = async (bannerUrl: string | null) => {
    setIsSaving(true)
    try {
      await onSelect(bannerUrl)
      onClose()
    } catch (error) {
      console.error("Error al seleccionar banner:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const selectedBanner = currentBannerImage || DEFAULT_BANNER_URL

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Seleccionar Banner de Perfil</DialogTitle>
          <DialogDescription>
            Elige un banner para personalizar el fondo de tu perfil. Todos los banners se mostrarán con 70% de opacidad.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
          {banners.map((banner) => {
            const optimizedUrl = optimizeCloudinaryUrl(banner.url, deviceType)
            const isOptimized = isCloudinaryOptimized(optimizedUrl)
            const isSelected = selectedBanner === banner.url

            return (
              <button
                key={banner.id}
                onClick={() => handleSelect(banner.url === DEFAULT_BANNER_URL ? null : banner.url)}
                disabled={isSaving}
                className={`
                  relative aspect-video rounded-lg overflow-hidden border-2 transition-all
                  ${isSelected 
                    ? 'border-primary ring-2 ring-primary ring-offset-2' 
                    : 'border-border hover:border-primary/50'
                  }
                  ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {/* Banner con opacidad 70% */}
                <div 
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${optimizedUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    opacity: 0.7,
                  }}
                />
                {/* Overlay oscuro para mejor visibilidad */}
                <div className="absolute inset-0 bg-black/20" />
                
                {/* Indicador de selección */}
                {isSelected && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className="bg-primary text-primary-foreground rounded-full p-1.5">
                      <Check className="h-4 w-4" />
                    </div>
                  </div>
                )}

                {/* Nombre del banner */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-xs text-white font-medium text-left line-clamp-1">
                    {banner.race}
                  </p>
                </div>

                {/* Loading overlay */}
                {isSaving && isSelected && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
