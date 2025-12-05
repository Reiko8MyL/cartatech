"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { Eye, EyeOff } from "lucide-react"
import { getTemporaryDeck } from "@/lib/deck-builder/utils"
import { useCards } from "@/hooks/use-cards"
import { Spinner } from "@/components/ui/spinner"
import { optimizeCloudinaryUrl, isCloudinaryOptimized, detectDeviceType } from "@/lib/deck-builder/cloudinary-utils"

export default function InicioSesionPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Cargar cartas para contar (incluyendo alternativas)
  const { cards: allCards } = useCards(true)
  
  // Contar cartas para mostrar en la lista de características
  const cardCounts = useMemo(() => {
    const baseCards = allCards.filter(c => !c.isCosmetic)
    const altArtCards = allCards.filter(c => c.isCosmetic)
    return {
      base: baseCards.length,
      variants: altArtCards.length,
    }
  }, [allCards])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.username || !formData.password) {
      setError("Por favor completa todos los campos")
      return
    }

    setIsLoading(true)

    const result = await login(formData.username, formData.password)

    setIsLoading(false)

    if (result.success) {
      // Si hay un mazo temporal, redirigir al deck builder
      const temporaryDeck = getTemporaryDeck()
      if (temporaryDeck && temporaryDeck.cards.length > 0) {
        router.push("/deck-builder")
      } else {
        router.push("/")
      }
    } else {
      setError(result.error || "Usuario o contraseña incorrectos")
    }
  }

  return (
    <div className="min-h-screen flex flex-row-reverse">
      {/* Panel derecho - Promocional */}
      <div 
        className="hidden lg:flex lg:w-1/3 p-8 lg:p-12 flex-col justify-between relative overflow-hidden"
        style={{
          backgroundImage: 'url(https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435879/FONDO_WEBPP_etcgej.webp)',
          backgroundSize: 'cover',
          backgroundPosition: '15% center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Capa de difuminado */}
        <div className="absolute inset-0 backdrop-blur-[2px]" />
        {/* Overlay con transparencia para mejorar legibilidad del texto */}
        <div className="absolute inset-0 bg-black/40 dark:bg-black/50" />
        {/* Gradiente difuminado en el borde izquierdo (que toca con el panel de datos) */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background via-background/50 to-transparent z-0" />
        <div className="relative z-10 flex flex-col items-end text-right">
          <Link href="/" className="inline-block mb-8">
            {(() => {
              const logoUrl = "https://res.cloudinary.com/dpbmbrekj/image/upload/v1764480944/noseaun_jll4ef.webp"
              const optimizedLogoUrl = optimizeCloudinaryUrl(logoUrl, deviceType)
              const isOptimized = isCloudinaryOptimized(optimizedLogoUrl)
              return (
                <Image
                  src={optimizedLogoUrl}
                  alt="Carta Tech Logo"
                  width={200}
                  height={67}
                  className="h-16 w-auto ml-auto scale-[1.2]"
                  priority
                  unoptimized={isOptimized}
                />
              )
            })()}
          </Link>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            El mejor constructor de<br />
            mazos de PBX
          </h2>
          <ul className="space-y-3 text-white/90">
            <li className="flex items-center justify-end gap-2">
              <span>{cardCounts.base} cartas de PBX</span>
              <span className="text-white">✓</span>
            </li>
            <li className="flex items-center justify-end gap-2">
              <span>{cardCounts.variants} variantes de cartas</span>
              <span className="text-white">✓</span>
            </li>
            <li className="flex items-center justify-end gap-2">
              <span>Crea, guarda y modifica tus Mazos</span>
              <span className="text-white">✓</span>
            </li>
            <li className="flex items-center justify-end gap-2">
              <span>Comparte tus Mazos favoritos con la comunidad!</span>
              <span className="text-white">✓</span>
            </li>
            <li className="flex items-center justify-end gap-2">
              <span>Activa el Modo Coleccionista en Galería</span>
              <span className="text-white">✓</span>
            </li>
            <li className="flex items-center justify-end gap-2">
              <span>Vota por tus cartas preferidas, revisa Utilidades</span>
              <span className="text-white">✓</span>
            </li>
            <li className="flex items-center justify-end gap-2">
              <span>Y MÁS!</span>
              <span className="text-white">✓</span>
            </li>
          </ul>
        </div>
        <div className="relative z-10 text-sm text-white/70 text-right">
          <p>© 2025 Carta Tech. Términos de Servicio · Política de Privacidad</p>
        </div>
      </div>

      {/* Panel izquierdo - Formulario */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="mb-6 text-right">
            <Link
              href="/registro"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ¿No tienes cuenta? <span className="text-primary font-medium">Regístrate ahora</span>
            </Link>
          </div>

          <h1 className="text-3xl font-bold mb-8">Iniciar sesión en Carta Tech</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                Nombre de Usuario
              </label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full"
                placeholder="Ingresa tu nombre de usuario"
                required
                aria-required="true"
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pr-10"
                  placeholder="Ingresa tu contraseña"
                  required
                  aria-required="true"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm" role="alert" aria-live="polite">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>

            <div className="text-center">
              <Link
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

