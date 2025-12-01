import type { Metadata } from "next"
import { Suspense } from "react"
import { generateMetadata as genMeta } from "@/lib/metadata"
import { CardGridSkeleton } from "@/components/ui/card-grid-skeleton"

export const metadata: Metadata = genMeta({
  title: "Galería de Cartas",
  description: "Explora la galería completa de cartas de Mitos y Leyendas Primer Bloque. Busca por edición, tipo, raza y costo. Marca tus cartas en modo colección.",
  keywords: ["galería", "cartas", "colección", "base de datos", "búsqueda de cartas", "catálogo"],
  path: "/galeria",
})

export default function GaleriaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={
      <main className="w-full min-h-[calc(100vh-4rem)] flex flex-col px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24 py-4">
        <div className="flex-1 border rounded-lg bg-card overflow-hidden">
          <div className="h-full overflow-y-auto">
            <CardGridSkeleton count={12} columns={6} />
          </div>
        </div>
      </main>
    }>
      {children}
    </Suspense>
  )
}



