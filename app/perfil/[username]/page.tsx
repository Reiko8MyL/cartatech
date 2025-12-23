"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function UserProfilePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirigir a la página principal ya que la vista pública solo está disponible desde el perfil privado
    router.push("/")
  }, [router])

  return (
    <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle>Vista Pública No Disponible</CardTitle>
            <CardDescription>
              La vista pública del perfil solo está disponible desde tu perfil privado. 
              Ve a "Mi Perfil" y usa el botón "Vista Público" para ver cómo otros usuarios verán tu perfil.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/mi-perfil")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Ir a Mi Perfil
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
