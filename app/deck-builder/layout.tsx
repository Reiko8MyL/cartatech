import type { Metadata } from "next"
import { generateMetadata as genMeta } from "@/lib/metadata"

export const metadata: Metadata = genMeta({
  title: "Deck Builder",
  description: "Construye tu mazo de Mitos y Leyendas Primer Bloque. Agrega cartas, calcula estadísticas, exporta tu mazo y compártelo con la comunidad.",
  keywords: ["constructor de mazos", "deck builder", "crear mazo", "construir mazo", "exportar mazo"],
  path: "/deck-builder",
})

export default function DeckBuilderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}











