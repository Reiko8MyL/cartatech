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
  return (
    <div className="relative min-h-screen">
      {/* Fondo con logo muy transparente */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'url(https://res.cloudinary.com/dpbmbrekj/image/upload/v1765218635/minilogo_pc0v1m.webp)',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.05, // Opacidad muy baja (5%)
        }}
      />
      {/* Contenido */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}














