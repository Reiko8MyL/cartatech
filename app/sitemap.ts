import { MetadataRoute } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cartatech.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Obtener mazos públicos para el sitemap
  let deckUrls: MetadataRoute.Sitemap = []
  
  try {
    const { prisma } = await import('@/lib/db/prisma')
    const publicDecks = await prisma.deck.findMany({
      where: {
        isPublic: true,
        publishedAt: { not: null },
      },
      select: {
        id: true,
        updatedAt: true,
      },
      take: 1000, // Limitar a 1000 mazos más recientes
      orderBy: {
        updatedAt: 'desc',
      },
    })

    deckUrls = publicDecks.map((deck) => ({
      url: `${baseUrl}/mazo/${deck.id}`,
      lastModified: deck.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch (error) {
    console.error('Error al obtener mazos públicos para sitemap:', error)
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/deck-builder`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/galeria`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/mazos-comunidad`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/mis-mazos`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/mis-favoritos`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/utilidad`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/utilidad/ban-list`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/utilidad/pbx-101`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/utilidad/comunidad-vota`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/inicio-sesion`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/registro`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    ...deckUrls,
  ]
}


