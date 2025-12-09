import type { Metadata } from "next"
import { generateMetadata as genMeta } from "@/lib/metadata"

export const metadata: Metadata = genMeta({
  title: "Mazos de la Comunidad",
  description: "Explora mazos públicos compartidos por la comunidad de Mitos y Leyendas Primer Bloque. Descubre estrategias, comparte ideas y encuentra inspiración para tus propios mazos.",
  keywords: ["mazos públicos", "comunidad", "mazos compartidos", "decks de la comunidad", "mazos populares"],
  path: "/mazos-comunidad",
})

export default function MazosComunidadLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}














