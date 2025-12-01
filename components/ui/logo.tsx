"use client"

import Image from "next/image"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface LogoProps {
  width?: number
  height?: number
  className?: string
  priority?: boolean
  alt?: string
}

const LOGO_DARK = "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764480944/noseaun_jll4ef.webp"
const LOGO_LIGHT = "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764480944/noseaun_jll4ef.webp"

export function Logo({
  width = 150,
  height = 50,
  className,
  priority = false,
  alt = "Carta Tech Logo",
}: LogoProps) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Determinar qué tema está activo (resuelve "system" a "light" o "dark")
  const currentTheme = mounted ? (resolvedTheme || theme) : "dark"
  const logoSrc = currentTheme === "light" ? LOGO_LIGHT : LOGO_DARK

  return (
    <Image
      src={logoSrc}
      alt={alt}
      width={width}
      height={height}
      className={cn("w-auto", className)}
      priority={priority}
    />
  )
}

