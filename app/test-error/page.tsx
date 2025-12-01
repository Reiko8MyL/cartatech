"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorBoundary } from "@/components/ui/error-boundary"

// Componente que lanza un error intencionalmente
function ErrorThrower({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Este es un error de prueba para verificar el ErrorBoundary")
  }
  return (
    <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-md">
      <p className="text-green-800 dark:text-green-200">
        ✓ Componente funcionando correctamente
      </p>
    </div>
  )
}

// Componente que lanza un error con stack trace más detallado
function ErrorThrowerWithStack({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    const error = new Error("Error con stack trace detallado")
    error.stack = `Error: Error con stack trace detallado
    at ErrorThrowerWithStack (test-error/page.tsx:25:11)
    at renderWithHooks (react-dom.development.js:16305:1)
    at updateFunctionComponent (react-dom.development.js:19588:1)
    at beginWork (react-dom.development.js:21601:1)
    at performUnitOfWork (react-dom.development.js:25447:1)
    at workLoop (react-dom.development.js:25547:1)
    at renderRoot (react-dom.development.js:25650:1)
    at performWorkOnRoot (react-dom.development.js:26557:1)
    at performWork (react-dom.development.js:26466:1)
    at performSyncWork (react-dom.development.js:26438:1)`
    throw error
  }
  return (
    <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-md">
      <p className="text-green-800 dark:text-green-200">
        ✓ Componente funcionando correctamente
      </p>
    </div>
  )
}

export default function TestErrorPage() {
  const [shouldThrow1, setShouldThrow1] = useState(false)
  const [shouldThrow2, setShouldThrow2] = useState(false)
  const [shouldThrow3, setShouldThrow3] = useState(false)

  return (
    <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-2">
            Prueba de Error Boundaries
          </h1>
          <p className="text-muted-foreground">
            Esta página permite probar los Error Boundaries implementados en la aplicación.
            Haz clic en los botones para lanzar errores intencionalmente y ver cómo se manejan.
          </p>
        </div>

        {/* Prueba 1: ErrorBoundary global */}
        <Card>
          <CardHeader>
            <CardTitle>Prueba 1: ErrorBoundary Global</CardTitle>
            <CardDescription>
              Este error será capturado por el ErrorBoundary del layout principal.
              Si lanzas este error, toda la página será reemplazada por el fallback.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => setShouldThrow1(!shouldThrow1)}
              variant={shouldThrow1 ? "destructive" : "default"}
            >
              {shouldThrow1 ? "Desactivar Error" : "Lanzar Error Global"}
            </Button>
            {shouldThrow1 && <ErrorThrower shouldThrow={true} />}
            {!shouldThrow1 && <ErrorThrower shouldThrow={false} />}
          </CardContent>
        </Card>

        {/* Prueba 2: ErrorBoundary específico */}
        <Card>
          <CardHeader>
            <CardTitle>Prueba 2: ErrorBoundary Específico</CardTitle>
            <CardDescription>
              Este error será capturado por un ErrorBoundary específico.
              Solo esta sección mostrará el fallback, el resto de la página seguirá funcionando.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => setShouldThrow2(!shouldThrow2)}
              variant={shouldThrow2 ? "destructive" : "default"}
            >
              {shouldThrow2 ? "Desactivar Error" : "Lanzar Error Específico"}
            </Button>
            <ErrorBoundary>
              {shouldThrow2 ? (
                <ErrorThrower shouldThrow={true} />
              ) : (
                <ErrorThrower shouldThrow={false} />
              )}
            </ErrorBoundary>
          </CardContent>
        </Card>

        {/* Prueba 3: ErrorBoundary con stack trace */}
        <Card>
          <CardHeader>
            <CardTitle>Prueba 3: ErrorBoundary con Stack Trace</CardTitle>
            <CardDescription>
              Este error incluye un stack trace detallado que se mostrará en desarrollo.
              En producción, solo se mostrará el mensaje amigable.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => setShouldThrow3(!shouldThrow3)}
              variant={shouldThrow3 ? "destructive" : "default"}
            >
              {shouldThrow3 ? "Desactivar Error" : "Lanzar Error con Stack Trace"}
            </Button>
            <ErrorBoundary>
              {shouldThrow3 ? (
                <ErrorThrowerWithStack shouldThrow={true} />
              ) : (
                <ErrorThrowerWithStack shouldThrow={false} />
              )}
            </ErrorBoundary>
          </CardContent>
        </Card>

        {/* Información adicional */}
        <Card>
          <CardHeader>
            <CardTitle>Información</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              • Los Error Boundaries capturan errores de renderizado, en los métodos del ciclo de vida,
              y en los constructores de todo el árbol de componentes debajo de ellos.
            </p>
            <p>
              • Los Error Boundaries NO capturan errores en:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Manejadores de eventos</li>
              <li>Código asíncrono (setTimeout, promesas, etc.)</li>
              <li>Renderizado del servidor</li>
              <li>Errores lanzados en el propio ErrorBoundary</li>
            </ul>
            <p>
              • En desarrollo, los detalles del error se muestran en un panel colapsable.
            </p>
            <p>
              • En producción, solo se muestra un mensaje amigable con opciones para recargar o volver al inicio.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

