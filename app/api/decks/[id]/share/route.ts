import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

// Generar código corto aleatorio
function generateShortCode(length: number = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// POST - Crear código corto para compartir un mazo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId } = body as { userId?: string }

    // Verificar que el mazo existe y es público
    const deck = await prisma.deck.findUnique({
      where: { id },
      select: {
        id: true,
        isPublic: true,
        publishedAt: true,
        userId: true,
      },
    })

    if (!deck) {
      return NextResponse.json(
        { error: "Mazo no encontrado" },
        { status: 404 }
      )
    }

    if (!deck.isPublic || !deck.publishedAt) {
      return NextResponse.json(
        { error: "El mazo debe ser público para generar un código de compartir" },
        { status: 403 }
      )
    }

    // Verificar que el usuario es el dueño del mazo (opcional, puede ser cualquiera para mazos públicos)
    // Por ahora, permitimos que cualquiera genere códigos para mazos públicos

    // Generar código único
    let code: string
    let attempts = 0
    const maxAttempts = 10

    do {
      code = generateShortCode(6)
      const existing = await prisma.shareCode.findUnique({
        where: { code },
      })
      if (!existing) break
      attempts++
    } while (attempts < maxAttempts)

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: "Error al generar código único. Intenta nuevamente." },
        { status: 500 }
      )
    }

    // Crear código de compartir (sin expiración por defecto)
    const shareCode = await prisma.shareCode.create({
      data: {
        code,
        deckId: id,
      },
    })

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.cartatech.cl"
    const shortUrl = `${siteUrl}/s/${code}`

    return NextResponse.json({
      shareCode: {
        id: shareCode.id,
        code: shareCode.code,
        shortUrl,
        clickCount: shareCode.clickCount,
        createdAt: shareCode.createdAt.getTime(),
      },
    })
  } catch (error) {
    console.error("Error al crear código de compartir:", error)
    return NextResponse.json(
      {
        error: "Error al crear código de compartir",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    )
  }
}

// GET - Obtener códigos de compartir de un mazo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      )
    }

    // Verificar que el mazo existe y pertenece al usuario
    const deck = await prisma.deck.findUnique({
      where: { id },
      select: {
        userId: true,
      },
    })

    if (!deck) {
      return NextResponse.json(
        { error: "Mazo no encontrado" },
        { status: 404 }
      )
    }

    if (deck.userId !== userId) {
      return NextResponse.json(
        { error: "No tienes permiso para ver los códigos de compartir de este mazo" },
        { status: 403 }
      )
    }

    // Obtener todos los códigos de compartir del mazo
    const shareCodes = await prisma.shareCode.findMany({
      where: { deckId: id },
      orderBy: { createdAt: "desc" },
    })

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.cartatech.cl"

    return NextResponse.json({
      shareCodes: shareCodes.map((sc) => ({
        id: sc.id,
        code: sc.code,
        shortUrl: `${siteUrl}/s/${sc.code}`,
        clickCount: sc.clickCount,
        createdAt: sc.createdAt.getTime(),
        expiresAt: sc.expiresAt?.getTime(),
      })),
    })
  } catch (error) {
    console.error("Error al obtener códigos de compartir:", error)
    return NextResponse.json(
      {
        error: "Error al obtener códigos de compartir",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    )
  }
}






















