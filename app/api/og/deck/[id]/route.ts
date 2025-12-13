import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getAllCardsFromDB } from "@/lib/deck-builder/cards-db"
import { calculateDeckStats, getDeckRace, getDeckFormatName, getDeckBackgroundImage } from "@/lib/deck-builder/utils"

// Usar nodejs runtime para compatibilidad con Prisma

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // Obtener estadísticas adicionales (likes y favoritos)
    const [likeCount, favoriteCount] = await Promise.all([
      prisma.deckLike.count({
        where: { deckId: id },
      }).catch(() => 0),
      prisma.favoriteDeck.count({
        where: { deckId: id },
      }).catch(() => 0),
    ])

    if (!deck || !deck.isPublic || !deck.publishedAt) {
      // Retornar imagen por defecto si el mazo no existe o no es público
      return new NextResponse(null, {
        status: 404,
      })
    }

    // Obtener cartas y calcular estadísticas
    const allCards = await getAllCardsFromDB()
    const deckCards = (deck.cards as Array<{ cardId: string; quantity: number }>) || []
    const stats = calculateDeckStats(deckCards, allCards)
    const race = getDeckRace(deckCards, allCards)
    const formatName = getDeckFormatName(deck.format as "RE" | "RL" | "LI" | undefined)
    const backgroundImage = getDeckBackgroundImage(race)

    const deckName = deck.name || "Mazo sin nombre"
    const author = deck.user?.username || "usuario"

    // Generar imagen SVG dinámica
    const svg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#2d2d2d;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="1200" height="630" fill="url(#bg)"/>
        ${backgroundImage ? `<image href="${backgroundImage}" x="0" y="0" width="1200" height="630" opacity="0.3" preserveAspectRatio="xMidYMid slice"/>` : ""}
        <rect width="1200" height="630" fill="rgba(0,0,0,0.5)"/>
        
        <!-- Logo/Título del sitio -->
        <text x="60" y="80" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#ffffff">
          Carta Tech
        </text>
        
        <!-- Nombre del mazo -->
        <text x="60" y="200" font-family="Arial, sans-serif" font-size="56" font-weight="bold" fill="#ffffff" width="1080">
          ${deckName.length > 40 ? deckName.substring(0, 40) + "..." : deckName}
        </text>
        
        <!-- Estadísticas -->
        <g transform="translate(60, 280)">
          <text x="0" y="0" font-family="Arial, sans-serif" font-size="28" fill="#a0a0a0">
            ${stats.totalCards} cartas
          </text>
          <text x="200" y="0" font-family="Arial, sans-serif" font-size="28" fill="#a0a0a0">
            Coste: ${stats.averageCost}
          </text>
          ${race ? `<text x="400" y="0" font-family="Arial, sans-serif" font-size="28" fill="#a0a0a0">Raza: ${race}</text>` : ""}
        </g>
        
        <g transform="translate(60, 330)">
          <text x="0" y="0" font-family="Arial, sans-serif" font-size="24" fill="#888888">
            Formato: ${formatName}
          </text>
          <text x="300" y="0" font-family="Arial, sans-serif" font-size="24" fill="#888888">
            Por: ${author}
          </text>
        </g>
        
        <!-- Estadísticas de interacción -->
        <g transform="translate(60, 380)">
          <text x="0" y="0" font-family="Arial, sans-serif" font-size="22" fill="#888888">
            ${deck.viewCount > 0 ? `${deck.viewCount} vistas` : ""}${deck.viewCount > 0 && (likeCount > 0 || favoriteCount > 0) ? " • " : ""}${likeCount > 0 ? `${likeCount} ${likeCount === 1 ? 'like' : 'likes'}` : ""}${likeCount > 0 && favoriteCount > 0 ? " • " : ""}${favoriteCount > 0 ? `${favoriteCount} ${favoriteCount === 1 ? 'favorito' : 'favoritos'}` : ""}
          </text>
        </g>
        
        <!-- Tipos de cartas -->
        <g transform="translate(60, 450)">
          <text x="0" y="0" font-family="Arial, sans-serif" font-size="20" fill="#666666">
            Aliados: ${stats.cardsByType["Aliado"] || 0} | 
            Armas: ${stats.cardsByType["Arma"] || 0} | 
            Talismanes: ${stats.cardsByType["Talismán"] || 0} | 
            Tótems: ${stats.cardsByType["Tótem"] || 0} | 
            Oros: ${stats.cardsByType["Oro"] || 0}
          </text>
        </g>
        
        <!-- URL del sitio -->
        <text x="60" y="580" font-family="Arial, sans-serif" font-size="20" fill="#444444">
          www.cartatech.cl
        </text>
      </svg>
    `.trim()

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    })
  } catch (error) {
    console.error("Error al generar imagen OG para mazo:", error)
    return new NextResponse(null, {
      status: 500,
    })
  }
}

