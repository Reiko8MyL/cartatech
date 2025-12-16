import type { Metadata } from "next"
import { generateMetadata as genMeta } from "@/lib/metadata"

export const metadata: Metadata = genMeta({
  title: "Mis Mazos",
  description: "Gestiona tus mazos guardados de Mitos y Leyendas. Edita, elimina y publica tus mazos. Organiza tu colección de mazos.",
  keywords: ["mis mazos", "mazos guardados", "gestionar mazos", "mis decks", "colección de mazos"],
  path: "/mis-mazos",
  noindex: true, // Página privada del usuario
})

export default function MisMazosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}




























