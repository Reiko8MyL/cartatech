"use client"

import Image from "next/image"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { optimizeCloudinaryUrl, isCloudinaryOptimized, detectDeviceType } from "@/lib/deck-builder/cloudinary-utils"

interface LogoProps {
  width?: number
  height?: number
  className?: string
  priority?: boolean
  alt?: string
}

const LOGO_DARK = "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764480944/noseaun_jll4ef.webp"
const LOGO_LIGHT = "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765218635/logoxdd_nh6iqf.webp"

export function Logo({
  width = 150,
  height = 50,
  className,
  priority = false,
  alt = "Carta Tech Logo",
}: LogoProps) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  useEffect(() => {
    setMounted(true)
    function updateDeviceType() {
      setDeviceType(detectDeviceType(window.innerWidth))
    }
    updateDeviceType()
    window.addEventListener('resize', updateDeviceType)
    return () => window.removeEventListener('resize', updateDeviceType)
  }, [])

  // Determinar qué tema está activo (resuelve "system" a "light" o "dark")
  const currentTheme = mounted ? (resolvedTheme || theme) : "dark"
  const logoSrc = currentTheme === "light" ? LOGO_LIGHT : LOGO_DARK
  
  // Optimizar URL de Cloudinary
  const optimizedLogoSrc = optimizeCloudinaryUrl(logoSrc, deviceType)
  const isOptimized = isCloudinaryOptimized(optimizedLogoSrc)

  return (
    <Image
      src={optimizedLogoSrc}
      alt={alt}
      width={width}
      height={height}
      className={cn("w-auto", className)}
      priority={priority}
      fetchPriority={priority ? "high" : "auto"}
      loading={priority ? "eager" : "lazy"}
      unoptimized={isOptimized}
    />
  )
}

