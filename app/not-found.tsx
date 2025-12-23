"use client"

import Link from "next/link"
import { Home, Search, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <span className="text-4xl font-bold text-muted-foreground">404</span>
          </div>
          <CardTitle className="text-2xl">Página no encontrada</CardTitle>
          <CardDescription>
            Lo sentimos, la página que buscas no existe o ha sido movida.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button asChild variant="default">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Ir al inicio
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/mazos-comunidad">
                <Search className="h-4 w-4 mr-2" />
                Explorar mazos
              </Link>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.history.back()
                }
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver atrás
            </Button>
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              ¿Buscas algo específico? Prueba con:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>
                <Link href="/deck-builder" className="hover:text-foreground underline">
                  Deck Builder
                </Link>
              </li>
              <li>
                <Link href="/galeria" className="hover:text-foreground underline">
                  Galería de Cartas
                </Link>
              </li>
              <li>
                <Link href="/mazos-comunidad" className="hover:text-foreground underline">
                  Mazos de la Comunidad
                </Link>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

