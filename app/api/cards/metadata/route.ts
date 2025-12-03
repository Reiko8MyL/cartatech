import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

/**
 * GET /api/cards/metadata
 * Obtiene todos los metadatos de cartas (útil para precargar en el cliente)
 */
export async function GET(request: NextRequest) {
  try {
    const metadataList = await (prisma as any).cardMetadata.findMany({
      select: {
        cardId: true,
        backgroundPositionY: true,
      },
    })

    // Convertir a un mapa para fácil acceso
    const metadataMap: Record<string, number | null> = {}
    for (const meta of metadataList) {
      if (meta.backgroundPositionY !== null) {
        metadataMap[meta.cardId] = meta.backgroundPositionY
      }
    }

    return NextResponse.json({
      metadata: metadataMap,
    })
  } catch (error) {
    console.error("Error al obtener metadatos de cartas:", error)

    if (error && typeof error === 'object' && 'code' in error) {
      console.error("Prisma error code:", error.code)
    }

    // Retornar objeto vacío en lugar de error para no romper la UX
    return NextResponse.json({
      metadata: {},
    })
  }
}

