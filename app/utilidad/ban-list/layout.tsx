import type { Metadata } from "next"
import { generateMetadata as genMeta } from "@/lib/metadata"

export const metadata: Metadata = genMeta({
  title: "Ban List",
  description: "Consulta las cartas prohibidas y restringidas en el formato Primer Bloque de Mitos y Leyendas. Filtra por formato RE, RL o LI.",
  keywords: ["ban list", "cartas prohibidas", "restricciones", "formato", "RE", "RL", "LI"],
  path: "/utilidad/ban-list",
})

export default function BanListLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

