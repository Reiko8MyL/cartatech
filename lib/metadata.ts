import type { Metadata } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://cartatech.cl"
const DEFAULT_OG_IMAGE = "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764381679/logo_CT_2_txcqch.webp"

interface MetadataOptions {
  title: string
  description: string
  keywords?: string[]
  path?: string
  ogImage?: string
  type?: "website" | "article"
  noindex?: boolean
}

export function generateMetadata({
  title,
  description,
  keywords = [],
  path = "",
  ogImage = DEFAULT_OG_IMAGE,
  type = "website",
  noindex = false,
}: MetadataOptions): Metadata {
  const fullTitle = `${title} | CartaTech`
  const url = `${SITE_URL}${path}`
  const defaultKeywords = [
    "Mitos y Leyendas",
    "MyL",
    "Deck Builder",
    "TCG",
    "Primer Bloque",
    "Chile",
    "cartas",
    "mazos",
  ]

  return {
    title: fullTitle,
    description,
    keywords: [...defaultKeywords, ...keywords],
    authors: [{ name: "CartaTech" }],
    creator: "CartaTech",
    publisher: "CartaTech",
    robots: noindex ? "noindex, nofollow" : "index, follow",
    openGraph: {
      type,
      url,
      title: fullTitle,
      description,
      siteName: "CartaTech",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "es_ES",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
      creator: "@cartatech",
    },
    alternates: {
      canonical: url,
    },
  }
}







