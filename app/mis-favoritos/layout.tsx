import type { Metadata } from "next"
import { generateMetadata as genMeta } from "@/lib/metadata"

export const metadata: Metadata = genMeta({
  title: "Mis Favoritos",
  description: "Mazos favoritos de Mitos y Leyendas. Accede rápidamente a los mazos de la comunidad que has marcado como favoritos.",
  keywords: ["favoritos", "mazos favoritos", "mis favoritos", "mazos guardados", "colección"],
  path: "/mis-favoritos",
  noindex: true, // Página privada del usuario
})

export default function MisFavoritosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>}




















