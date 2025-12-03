import type { Metadata } from "next"
import { generateMetadata as genMeta } from "@/lib/metadata"

export const metadata: Metadata = genMeta({
  title: "Iniciar Sesión",
  description: "Inicia sesión en Carta Tech para acceder a todas las funcionalidades: guardar mazos, modo colección, votaciones y más.",
  keywords: ["iniciar sesión", "login", "acceso", "cuenta"],
  path: "/inicio-sesion",
  noindex: true, // Página de autenticación
})

export default function InicioSesionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}





