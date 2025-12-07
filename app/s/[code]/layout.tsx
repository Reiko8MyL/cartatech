import type { Metadata } from "next"
import { generateMetadata as genMeta } from "@/lib/metadata"

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ code: string }>
}

export async function generateMetadata(
  { params }: { params: Promise<{ code: string }> }
): Promise<Metadata> {
  const { code } = await params
  
  return genMeta({
    title: "Compartir Mazo",
    description: "Accede al mazo compartido de Mitos y Leyendas Primer Bloque",
    keywords: ["compartir", "mazo", "deck compartido"],
    path: `/s/${code}`,
    noindex: true, // No indexar códigos de compartir
  })
}

export default async function ShareCodeLayout({ children, params }: LayoutProps) {
  return <>{children}</>
}

