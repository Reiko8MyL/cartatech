import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Prueba de Error Boundaries",
  description: "Página de prueba para verificar el funcionamiento de los Error Boundaries",
  robots: {
    index: false,
    follow: false,
  },
}

export default function TestErrorLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}

