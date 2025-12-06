import type { Metadata } from "next"
import { generateMetadata as genMeta } from "@/lib/metadata"

export const metadata: Metadata = genMeta({
  title: "La Comunidad Vota",
  description: "Participa en las votaciones de la comunidad de Mitos y Leyendas. Vota por tu aliado favorito de cada raza y ayuda a decidir los favoritos de la comunidad.",
  keywords: ["votaciones", "comunidad", "votos", "encuestas", "aliados favoritos"],
  path: "/utilidad/comunidad-vota",
})

export default function ComunidadVotaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}








