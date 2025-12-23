"use client"

import { useEffect } from "react"
import { AlertCircle, Home, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log del error en producción (puedes enviarlo a un servicio de logging)
    console.error("Error global capturado:", error)
    
    // En producción, podrías enviar a un servicio de logging
    // Ejemplo: logErrorToService(error)
  }, [error])

  const handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload()
    }
  }

  const handleGoHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/"
    }
  }

  return (
    <html lang="es">
      <body>
        <div className="flex min-h-screen items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                  <AlertCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
                </div>
                <CardTitle className="text-xl">Algo salió mal</CardTitle>
              </div>
              <CardDescription>
                Ha ocurrido un error inesperado. Por favor, intenta recargar la página o volver al inicio.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === "development" && error.message && (
                <div className="rounded-md bg-muted p-3">
                  <p className="text-sm font-mono text-muted-foreground break-all">
                    {error.message}
                  </p>
                  {error.digest && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Error ID: {error.digest}
                    </p>
                  )}
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={reset} variant="default" className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Intentar de nuevo
                </Button>
                <Button onClick={handleReload} variant="outline" className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recargar página
                </Button>
                <Button onClick={handleGoHome} variant="outline" className="flex-1">
                  <Home className="h-4 w-4 mr-2" />
                  Ir al inicio
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  )
}

