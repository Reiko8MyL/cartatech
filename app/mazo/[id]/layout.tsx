import type { Metadata } from "next"
import { prisma } from "@/lib/db/prisma"
import { generateMetadata as genMeta } from "@/lib/metadata"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params

  try {
    // Usar Prisma directamente desde el servidor en lugar de fetch
    const deck = await prisma.deck.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })

    if (!deck || !deck.isPublic) {
      return genMeta({
        title: "Mazo no encontrado",
        description: "El mazo que buscas no existe o es privado.",
        path: `/mazo/${id}`,
        noindex: true,
      })
    }

    const cards = deck.cards as Array<{ cardId: string; quantity: number }>
    const description = deck.description
      ? `${deck.description.substring(0, 150)}...`
      : `Mazo ${deck.name} de Mitos y Leyendas Primer Bloque. ${cards.length} cartas.`

    return genMeta({
      title: deck.name,
      description,
      keywords: [
        deck.name,
        "mazo",
        "deck",
        deck.format || "RE",
        ...(deck.tags || []),
      ],
      path: `/mazo/${id}`,
      type: "article",
      ogImage: deck.techCardId
        ? `https://res.cloudinary.com/dpbmbrekj/image/upload/v1764396472/${deck.techCardId}.webp`
        : undefined,
    })
  } catch (error) {
    console.error("Error al generar metadata del mazo:", error)
    return genMeta({
      title: "Mazo",
      description: "Mazo de Mitos y Leyendas Primer Bloque",
      path: `/mazo/${id}`,
    })
  }
}

export default function DeckLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
