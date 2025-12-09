import { redirect } from "next/navigation"

interface PageProps {
  params: Promise<{ code: string }>
}

export default async function ShareCodePage({ params }: PageProps) {
  const { code } = await params
  
  // Redirigir a la API que maneja la redirección
  const apiUrl = `/api/share/${code}`
  redirect(apiUrl)
}







