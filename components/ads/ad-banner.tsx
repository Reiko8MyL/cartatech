"use client"

import { AdContainer } from "./ad-container"
import { AD_POSITIONS } from "@/lib/ads/config"

interface AdBannerProps {
  position?: "top" | "footer"
  className?: string
}

export function AdBanner({ position = "top", className = "" }: AdBannerProps) {
  const adPosition = position === "top" ? AD_POSITIONS.TOP : AD_POSITIONS.FOOTER

  return (
    <div className={`ad-banner-wrapper ${className}`}>
      <AdContainer position={adPosition} />
    </div>
  )
}











