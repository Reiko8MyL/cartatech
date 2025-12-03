import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

/**
 * GET /api/cards/[cardId]/metadata
 * Obtiene los metadatos de una carta específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params

    if (!cardId) {
      return NextResponse.json(
        { error: "cardId es requerido" },
        { status: 400 }
      )
    }

    const metadata = await (prisma as any).cardMetadata.findUnique({
      where: { cardId },
    })

    return NextResponse.json({
      metadata: metadata || null,
    })
  } catch (error) {
    console.error("Error al obtener metadatos de carta:", error)

    if (error && typeof error === 'object' && 'code' in error) {
      console.error("Prisma error code:", error.code)
    }

    return NextResponse.json(
      {
        error: "Error al obtener metadatos de la carta",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/cards/[cardId]/metadata
 * Actualiza o crea los metadatos de una carta
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params
    const body = await request.json()

    if (!cardId) {
      return NextResponse.json(
        { error: "cardId es requerido" },
        { status: 400 }
      )
    }

    const { backgroundPositionY } = body

    // Validar que backgroundPositionY sea un número entre 0 y 70 si se proporciona
    if (backgroundPositionY !== undefined && backgroundPositionY !== null) {
      if (typeof backgroundPositionY !== "number" || backgroundPositionY < 0 || backgroundPositionY > 70) {
        return NextResponse.json(
          { error: "backgroundPositionY debe ser un número entre 0 y 70" },
          { status: 400 }
        )
      }
    }

    // Upsert: actualizar si existe, crear si no existe
    // Nota: Si obtienes un error "Cannot read properties of undefined (reading 'upsert')",
    // necesitas reiniciar el servidor de desarrollo después de ejecutar "npx prisma generate"
    const metadata = await (prisma as any).cardMetadata.upsert({
      where: { cardId },
      update: {
        backgroundPositionY: backgroundPositionY !== undefined ? backgroundPositionY : null,
      },
      create: {
        cardId,
        backgroundPositionY: backgroundPositionY !== undefined ? backgroundPositionY : null,
      },
    })

    return NextResponse.json({
      metadata,
    })
  } catch (error) {
    console.error("Error al actualizar metadatos de carta:", error)

    if (error && typeof error === 'object' && 'code' in error) {
      console.error("Prisma error code:", error.code)
    }

    return NextResponse.json(
      {
        error: "Error al actualizar metadatos de la carta",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/cards/[cardId]/metadata
 * Elimina los metadatos de una carta
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params

    if (!cardId) {
      return NextResponse.json(
        { error: "cardId es requerido" },
        { status: 400 }
      )
    }

    await (prisma as any).cardMetadata.delete({
      where: { cardId },
    }).catch(() => {
      // Si no existe, no hacer nada (idempotente)
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("Error al eliminar metadatos de carta:", error)

    return NextResponse.json(
      {
        error: "Error al eliminar metadatos de la carta",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    )
  }
}

