"use client"

import { ErrorBoundary as ReactErrorBoundary, type FallbackProps } from "react-error-boundary"
import type { ErrorInfo } from "react"
import { AlertCircle, Home, RefreshCw, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface ErrorFallbackProps extends FallbackProps {
  showDetails?: boolean
}

function ErrorFallback({ error, resetErrorBoundary, showDetails = false }: ErrorFallbackProps) {
  const router = useRouter()
  const [showStack, setShowStack] = useState(false)
  const isDevelopment = process.env.NODE_ENV === "development"

  // Log del error
  if (isDevelopment) {
    console.error("Error capturado por ErrorBoundary:", error)
  } else {
    // En producción, podrías enviar a un servicio de logging
    // Ejemplo: logErrorToService(error)
  }

  const handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload()
    }
  }

  const handleGoHome = () => {
    router.push("/")
  }

  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
            </div>
            <CardTitle className="text-xl">Algo salió mal</CardTitle>
          </div>
          <CardDescription>
            Por favor, intenta recargar la página. Si el problema persiste, contacta al soporte.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleReload} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
              Recargar página
            </Button>
            <Button onClick={handleGoHome} variant="outline" className="flex-1">
              <Home className="h-4 w-4 mr-2" aria-hidden="true" />
              Volver al inicio
            </Button>
            {resetErrorBoundary && (
              <Button onClick={resetErrorBoundary} variant="outline" className="flex-1">
                Reintentar
              </Button>
            )}
          </div>

          {/* Detalles del error solo en desarrollo */}
          {isDevelopment && error && (
            <div className="mt-4 space-y-2">
              <button
                onClick={() => setShowStack(!showStack)}
                className="flex w-full items-center justify-between rounded-md border bg-muted/50 p-2 text-sm font-medium transition-colors hover:bg-muted"
                aria-expanded={showStack}
              >
                <span>Detalles del error (solo desarrollo)</span>
                {showStack ? (
                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
              {showStack && (
                <div className="rounded-md border bg-muted/30 p-3">
                  <div className="mb-2">
                    <p className="text-sm font-semibold text-destructive">
                      {error.name}: {error.message}
                    </p>
                  </div>
                  {error.stack && (
                    <pre className="max-h-64 overflow-auto text-xs text-muted-foreground whitespace-pre-wrap break-words">
                      {error.stack}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<FallbackProps>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  onReset?: () => void
  resetKeys?: Array<string | number>
  showDetails?: boolean
}

export function ErrorBoundary({
  children,
  fallback,
  onError,
  onReset,
  resetKeys,
  showDetails = false,
}: ErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    // Log del error
    if (process.env.NODE_ENV === "development") {
      console.error("Error capturado por ErrorBoundary:", error, errorInfo)
    } else {
      // En producción, podrías enviar a un servicio de logging
      // Ejemplo: logErrorToService(error, errorInfo)
    }

    // Llamar al callback personalizado si existe
    onError?.(error, errorInfo)
  }

  const FallbackComponent = fallback || ((props: FallbackProps) => <ErrorFallback {...props} showDetails={showDetails} />)

  return (
    <ReactErrorBoundary
      FallbackComponent={FallbackComponent}
      onError={handleError}
      onReset={onReset}
      resetKeys={resetKeys}
    >
      {children}
    </ReactErrorBoundary>
  )
}

// Exportar también ErrorFallback para uso directo
export { ErrorFallback }

