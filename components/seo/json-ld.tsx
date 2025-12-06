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
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Carta Tech - MyL Deck Builder",
    description: "Deck Builder para el TCG chileno Mitos y Leyendas en formato Primer Bloque",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://cartatech.cl",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || "https://cartatech.cl"}/galeria?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }

  return <JsonLd data={data} />
}







