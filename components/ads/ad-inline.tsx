"use client"

import { AdContainer } from "./ad-container"
import { AD_POSITIONS } from "@/lib/ads/config"

interface AdInlineProps {
  className?: string
}

export function AdInline({ className = "" }: AdInlineProps) {
  return (
    <div className={`ad-inline-wrapper ${className}`}>
      <AdContainer position={AD_POSITIONS.INLINE} />
    </div>
  )
}



















