"use client"

import { useState, useEffect } from "react"
import type { Card } from "@/lib/deck-builder/types"
import { Card as CardComponent } from "@/components/ui/card"
import Image from "next/image"
import { EDITION_LOGOS } from "@/lib/deck-builder/utils"
import { EDITION_ORDER } from "@/lib/deck-builder/types"
import { optimizeCloudinaryUrl, isCloudinaryOptimized, detectDeviceType } from "@/lib/deck-builder/cloudinary-utils"

interface BanListSectionProps {
  title: string
  description: string
  cards: Card[]
  badgeColor: string
  badgeText: string
}

function groupCardsByEdition(cards: Card[]): Map<string, Card[]> {
  const grouped = new Map<string, Card[]>()
  
  for (const card of cards) {
    const edition = card.edition
    if (!grouped.has(edition)) {
      grouped.set(edition, [])
    }
    grouped.get(edition)!.push(card)
  }
  
  // Ordenar las cartas dentro de cada edición por ID
  for (const [edition, editionCards] of grouped.entries()) {
    editionCards.sort((a, b) => {
      const numA = parseInt(a.id.split("-")[1] || "0", 10)
      const numB = parseInt(b.id.split("-")[1] || "0", 10)
      return numA - numB
    })
  }
  
  return grouped
}

export function BanListSection({
  title,
  description,
  cards,
  badgeColor,
  badgeText,
}: BanListSectionProps) {
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

  const cardsByEdition = groupCardsByEdition(cards)
  
  // Ordenar las ediciones según el orden definido
  const sortedEditions = Array.from(cardsByEdition.keys()).sort((a, b) => {
    const indexA = EDITION_ORDER.indexOf(a as typeof EDITION_ORDER[number])
    const indexB = EDITION_ORDER.indexOf(b as typeof EDITION_ORDER[number])
    if (indexA === -1 && indexB === -1) return a.localeCompare(b)
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })

  return (
    <CardComponent className="overflow-hidden">
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${badgeColor}`}
          >
            {badgeText}
          </span>
        </div>

        <div className="space-y-6">
          {sortedEditions.map((edition) => {
            const editionCards = cardsByEdition.get(edition)!
            const editionLogo = EDITION_LOGOS[edition]
            
            return (
              <div key={edition} className="space-y-3">
                <div className="flex items-center gap-3 border-b border-border pb-2">
                  {editionLogo && (
                    <div className="relative h-12 w-12 sm:h-14 sm:w-14">
                      {(() => {
                        const optimizedLogoUrl = optimizeCloudinaryUrl(editionLogo, deviceType)
                        const isOptimized = isCloudinaryOptimized(optimizedLogoUrl)
                        return (
                          <Image
                            src={optimizedLogoUrl}
                            alt={edition}
                            fill
                            className="object-contain rounded-full"
                            sizes="(max-width: 640px) 48px, 56px"
                            unoptimized={isOptimized}
                          />
                        )
                      })()}
                    </div>
                  )}
                  <h3 className="text-lg font-semibold">{edition}</h3>
                  <span className="text-sm text-muted-foreground">
                    ({editionCards.length} {editionCards.length === 1 ? "carta" : "cartas"})
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
                  {editionCards.map((card) => {
                    const optimizedImageUrl = optimizeCloudinaryUrl(card.image, deviceType)
                    const isOptimized = isCloudinaryOptimized(optimizedImageUrl)
                    return (
                      <div
                        key={card.id}
                        className="group relative aspect-[2/3] overflow-hidden rounded-lg border border-border bg-card transition-transform hover:scale-105"
                      >
                        <Image
                          src={optimizedImageUrl}
                          alt={card.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, (max-width: 1280px) 16vw, 12vw"
                          unoptimized={isOptimized}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </CardComponent>
  )
}
