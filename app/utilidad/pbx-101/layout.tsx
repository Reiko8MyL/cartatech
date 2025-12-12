import type { Metadata } from "next"
import { generateMetadata as genMeta } from "@/lib/metadata"

export const metadata: Metadata = genMeta({
  title: "PBX 101",
  description: "Guía completa sobre el formato Primer Bloque Extendido (PBX) de Mitos y Leyendas. Aprende las reglas, cartas permitidas y estrategias básicas para nuevos jugadores.",
  keywords: ["PBX", "Primer Bloque", "guía", "tutorial", "nuevos jugadores", "formato", "reglas"],
  path: "/utilidad/pbx-101",
})

export default function Pbx101Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
