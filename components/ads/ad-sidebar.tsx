"use client"

import { AdContainer } from "./ad-container"
import { AD_POSITIONS } from "@/lib/ads/config"

interface AdSidebarProps {
  className?: string
}

export function AdSidebar({ className = "" }: AdSidebarProps) {
  return (
    <div className={`ad-sidebar-wrapper ${className}`}>
      <AdContainer position={AD_POSITIONS.SIDEBAR} />
    </div>
  )
}







