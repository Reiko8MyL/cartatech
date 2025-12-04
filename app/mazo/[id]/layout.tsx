import type { Metadata } from "next"
import { generateMetadata as genMeta } from "@/lib/metadata"

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  
  try {
    const { prisma } = await import("@/lib/db/prisma")
    const { getAllCardsFromDB } = await import("@/lib/deck-builder/cards-db")
    const { calculateDeckStats, getDeckRace, getDeckFormatName } = await import("@/lib/deck-builder/utils")
    
    const deck = await prisma.deck.findUnique({
      where: { id },
      select: {
        name: true,
        description: true,
        format: true,
        isPublic: true,
        publishedAt: true,
        cards: true,
        viewCount: true,
        user: {
          select: {
            username: true,
          },
        },
      },
    })

    if (!deck || !deck.isPublic || !deck.publishedAt) {
      return genMeta({
        title: "Mazo no encontrado",
        description: "El mazo que buscas no existe o no está disponible.",
        path: `/mazo/${id}`,
        noindex: true,
      })
    }

    // Obtener cartas y calcular estadísticas para metadata mejorada
    const allCards = await getAllCardsFromDB()
    const deckCards = (deck.cards as Array<{ cardId: string; quantity: number }>) || []
    const stats = calculateDeckStats(deckCards, allCards)
    const race = getDeckRace(deckCards, allCards)
    const formatName = getDeckFormatName(deck.format as "RE" | "RL" | "LI" | undefined)

    const deckName = deck.name || "Mazo sin nombre"
    
    // Construir descripción mejorada con estadísticas
    const statsText = `${stats.totalCards} cartas • Coste promedio: ${stats.averageCost}`
    const raceText = race ? ` • Raza: ${race}` : ""
    const formatText = ` • Formato: ${formatName}`
    const authorText = ` • Por: ${deck.user?.username || "usuario"}`
    const viewsText = deck.viewCount > 0 ? ` • ${deck.viewCount} vistas` : ""
    
    const description = deck.description 
      ? `${deck.description.substring(0, 80)}... | ${statsText}${raceText}${formatText}${authorText}${viewsText}`
      : `Mazo de ${formatName}${raceText ? ` (${race})` : ""} con ${statsText}${authorText}${viewsText}. Explora las cartas y estrategias de este mazo.`
    
    // Generar URL de imagen OG con información del mazo
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.cartatech.cl"
    const ogImageUrl = `${siteUrl}/api/og/deck/${id}`
    
    return genMeta({
      title: deckName,
      description,
      keywords: [
        "mazo",
        "deck",
        deck.format || "RE",
        formatName,
        race || "",
        deck.user?.username || "",
        "Mitos y Leyendas",
        "Primer Bloque",
      ].filter(Boolean),
      path: `/mazo/${id}`,
      type: "article",
      ogImage: ogImageUrl,
    })
  } catch (error) {
    console.error("Error al generar metadata para mazo:", error)
    return genMeta({
      title: "Mazo",
      description: "Visualiza y explora mazos de Mitos y Leyendas Primer Bloque.",
      path: `/mazo/${id}`,
    })
  }
}

export default async function DeckLayout({ children, params }: LayoutProps) {
  return <>{children}</>
}
