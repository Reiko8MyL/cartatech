"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { Eye, EyeOff, Info } from "lucide-react"
import { getAllCards, getAlternativeArtCards, getTemporaryDeck } from "@/lib/deck-builder/utils"
import { Spinner } from "@/components/ui/spinner"

export default function RegistroPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    month: "",
    day: "",
    year: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Contar cartas para mostrar en la lista de características
  const cardCounts = useMemo(() => {
    const baseCards = getAllCards()
    const altArtCards = getAlternativeArtCards()
    return {
      base: baseCards.length,
      variants: altArtCards.length,
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validaciones
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Por favor completa todos los campos")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (formData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    if (!formData.month || !formData.day || !formData.year) {
      setError("Por favor completa tu fecha de nacimiento")
      return
    }

    if (!agreedToTerms) {
      setError("Debes aceptar los términos de servicio")
      return
    }

    setIsLoading(true)

    const result = await register(
      formData.username,
      formData.email,
      formData.password,
      {
        month: formData.month,
        day: formData.day,
        year: formData.year,
      }
    )

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
      setError(result.error || "El usuario o email ya existe, o no cumples con la edad mínima (13 años)")
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo - Promocional */}
      <div 
        className="hidden lg:flex lg:w-2/5 p-8 lg:p-12 flex-col justify-between relative overflow-hidden"
        style={{
          backgroundImage: 'url(https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435879/FONDO_WEBPP_etcgej.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'right center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Capa de difuminado */}
        <div className="absolute inset-0 backdrop-blur-[2px]" />
        {/* Overlay con transparencia para mejorar legibilidad del texto */}
        <div className="absolute inset-0 bg-black/40 dark:bg-black/50" />
        {/* Gradiente difuminado en el borde derecho (que toca con el panel de datos) */}
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background via-background/50 to-transparent z-0" />
        <div className="relative z-10">
          <Link href="/" className="inline-block mb-8">
            <Image
              src="https://res.cloudinary.com/dpbmbrekj/image/upload/v1764480944/noseaun_jll4ef.webp"
              alt="Carta Tech Logo"
              width={200}
              height={67}
              className="h-16 w-auto scale-[1.2]"
              priority
            />
          </Link>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            El mejor constructor de<br />
            mazos de PBX
          </h2>
          <ul className="space-y-3 text-white/90">
            <li className="flex items-center gap-2">
              <span className="text-white">✓</span>
              <span>{cardCounts.base} cartas de PBX</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-white">✓</span>
              <span>{cardCounts.variants} variantes de cartas</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-white">✓</span>
              <span>Crea, guarda y modifica tus Mazos</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-white">✓</span>
              <span>Comparte tus Mazos favoritos con la comunidad!</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-white">✓</span>
              <span>Activa el Modo Coleccionista en Galería</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-white">✓</span>
              <span>Vota por tus cartas preferidas, revisa Utilidades</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-white">✓</span>
              <span>Y MÁS!</span>
            </li>
          </ul>
        </div>
        <div className="relative z-10 text-sm text-white/70">
          <p>© 2025 Carta Tech. Términos de Servicio · Política de Privacidad</p>
        </div>
      </div>

      {/* Panel derecho - Formulario */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="mb-6 text-right">
            <Link
              href="/inicio-sesion"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ¿Ya tienes cuenta? <span className="text-primary font-medium">Inicia sesión</span>
            </Link>
          </div>

          <h1 className="text-3xl font-bold mb-8">Registro en Carta Tech</h1>

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
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full"
                placeholder="tu@email.com"
                required
                aria-required="true"
                autoComplete="email"
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
                placeholder="Mínimo 8 caracteres"
                required
                aria-required="true"
                autoComplete="new-password"
                aria-describedby="password-help"
              />
              <p id="password-help" className="text-xs text-muted-foreground mt-1">
                La contraseña debe tener al menos 8 caracteres
              </p>
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pr-10"
                  placeholder="Confirma tu contraseña"
                  required
                  aria-required="true"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirmPassword ? "Ocultar confirmación de contraseña" : "Mostrar confirmación de contraseña"}
                  aria-pressed={showConfirmPassword}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                Fecha de Nacimiento
                <Info className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </label>
              <div className="flex gap-2" role="group" aria-label="Fecha de nacimiento">
                <label htmlFor="birth-month" className="sr-only">Mes</label>
                <Input
                  id="birth-month"
                  type="text"
                  placeholder="MM"
                  maxLength={2}
                  value={formData.month}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 2)
                    setFormData({ ...formData, month: value })
                  }}
                  className="w-20"
                  required
                  aria-label="Mes de nacimiento"
                  aria-required="true"
                />
                <label htmlFor="birth-day" className="sr-only">Día</label>
                <Input
                  id="birth-day"
                  type="text"
                  placeholder="DD"
                  maxLength={2}
                  value={formData.day}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 2)
                    setFormData({ ...formData, day: value })
                  }}
                  className="w-20"
                  required
                  aria-label="Día de nacimiento"
                  aria-required="true"
                />
                <label htmlFor="birth-year" className="sr-only">Año</label>
                <Input
                  id="birth-year"
                  type="text"
                  placeholder="YYYY"
                  maxLength={4}
                  value={formData.year}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 4)
                    setFormData({ ...formData, year: value })
                  }}
                  className="flex-1"
                  required
                  aria-label="Año de nacimiento"
                  aria-required="true"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1" id="birth-date-help">
                Debes tener al menos 13 años para registrarte
              </p>
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1"
                required
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground">
                Acepto los Términos de Servicio de Carta Tech
              </label>
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
                  Registrando...
                </>
              ) : (
                "Registrarse"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

