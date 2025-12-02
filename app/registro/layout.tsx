import type { Metadata } from "next"
import { generateMetadata as genMeta } from "@/lib/metadata"

export const metadata: Metadata = genMeta({
  title: "Registro",
  description: "Crea tu cuenta en Carta Tech y accede a todas las funcionalidades: guardar mazos, modo colección, votaciones de la comunidad y más.",
  keywords: ["registro", "crear cuenta", "sign up", "nueva cuenta"],
  path: "/registro",
  noindex: true, // Página de autenticación
})

export default function RegistroLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}




