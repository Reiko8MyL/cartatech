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
      <main className="w-full min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-4 px-4 sm:px-6 md:px-8 lg:px-6 xl:px-8 py-4 max-w-[1920px] mx-auto">
        <aside className="w-full lg:w-80 xl:w-96 flex-shrink-0 space-y-4">
          <div className="h-20 bg-muted animate-pulse rounded-lg" />
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </aside>
        <div className="flex-1 min-w-0">
          <div className="h-20 bg-muted animate-pulse rounded-lg mb-4 hidden lg:block" />
          <div className="flex-1 border rounded-lg bg-card overflow-hidden">
            <div className="h-full overflow-y-auto p-6">
              <CardGridSkeleton count={24} columns={8} />
            </div>
          </div>
        </div>
      </main>
    }>
      {children}
    </Suspense>
  )
}



