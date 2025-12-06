import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

// GET - Redirigir desde código corto al mazo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

    // Buscar el código de compartir
    const shareCode = await prisma.shareCode.findUnique({
      where: { code },
      include: {
        deck: {
          select: {
            id: true,
            isPublic: true,
            publishedAt: true,
          },
        },
      },
    })

    if (!shareCode) {
      // Redirigir a página de error o home si el código no existe
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.cartatech.cl"
      return NextResponse.redirect(`${siteUrl}/mazos-comunidad`)
    }

    // Verificar si el código ha expirado
    if (shareCode.expiresAt && shareCode.expiresAt < new Date()) {
      // Eliminar código expirado
      await prisma.shareCode.delete({
        where: { id: shareCode.id },
      })
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.cartatech.cl"
      return NextResponse.redirect(`${siteUrl}/mazos-comunidad`)
    }

    // Verificar que el mazo sigue siendo público
    if (!shareCode.deck.isPublic || !shareCode.deck.publishedAt) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.cartatech.cl"
      return NextResponse.redirect(`${siteUrl}/mazos-comunidad`)
    }

    // Incrementar contador de clics
    await prisma.shareCode.update({
      where: { id: shareCode.id },
      data: { clickCount: { increment: 1 } },
    })

    // Redirigir al mazo
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.cartatech.cl"
    return NextResponse.redirect(`${siteUrl}/mazo/${shareCode.deckId}`)
  } catch (error) {
    console.error("Error al redirigir desde código corto:", error)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.cartatech.cl"
    return NextResponse.redirect(`${siteUrl}/mazos-comunidad`)
  }
}


