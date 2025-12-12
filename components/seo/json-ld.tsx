import Script from "next/script"

interface JsonLdProps {
  data: Record<string, any>
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <Script
      id="json-ld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// Schema.org para un mazo
export function DeckJsonLd({
  deckId,
  name,
  description,
  author,
  publishedAt,
  viewCount,
  likeCount,
}: {
  deckId: string
  name: string
  description?: string
  author?: string
  publishedAt?: number
  viewCount?: number
  likeCount?: number
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: name,
    description: description || `Mazo ${name} de Mitos y Leyendas Primer Bloque`,
    author: {
      "@type": "Person",
      name: author || "Anónimo",
    },
    datePublished: publishedAt ? new Date(publishedAt).toISOString() : undefined,
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://cartatech.cl"}/mazo/${deckId}`,
    ...(viewCount && { interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/ViewAction",
      userInteractionCount: viewCount,
    }}),
    ...(likeCount && { aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: likeCount,
      ratingCount: likeCount,
    }}),
  }

  return <JsonLd data={data} />
}

// Schema.org para el sitio web
export function WebsiteJsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.cartatech.cl"
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "CartaTech",
    alternateName: "Carta Tech - MyL Deck Builder",
    description: "Deck Builder para el TCG chileno Mitos y Leyendas en formato Primer Bloque. Construye, comparte y explora mazos de la comunidad.",
    url: siteUrl,
    logo: "https://res.cloudinary.com/dpbmbrekj/image/upload/v1765333391/minilogo2_kwjkwt.webp",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/galeria?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    sameAs: [
      // Agregar redes sociales cuando estén disponibles
      // "https://twitter.com/cartatech",
      // "https://facebook.com/cartatech",
    ],
  }

  return <JsonLd data={data} />
}

// Schema.org para un usuario (Person)
export function PersonJsonLd({
  username,
  name,
  description,
  url,
}: {
  username: string
  name?: string
  description?: string
  url: string
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.cartatech.cl"
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: name || username,
    url,
    description: description || `Perfil de ${username} en CartaTech`,
    identifier: {
      "@type": "PropertyValue",
      name: "username",
      value: username,
    },
    sameAs: [
      `${siteUrl}/perfil/${username}`,
    ],
  }

  return <JsonLd data={data} />
}

// Schema.org para una lista de mazos (ItemList)
export function DeckListJsonLd({
  name,
  description,
  url,
  items,
}: {
  name: string
  description?: string
  url: string
  items: Array<{
    name: string
    url: string
    description?: string
  }>
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    description: description || `Lista de mazos: ${name}`,
    url,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Article",
        name: item.name,
        url: item.url,
        description: item.description,
      },
    })),
  }

  return <JsonLd data={data} />
}

// Schema.org para Breadcrumbs (BreadcrumbList)
export function BreadcrumbJsonLd({
  items,
}: {
  items: Array<{
    name: string
    url: string
  }>
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return <JsonLd data={data} />
}


















