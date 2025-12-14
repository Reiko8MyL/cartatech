"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { getTemporaryDeck } from "@/lib/deck-builder/utils"
import { useCards } from "@/hooks/use-cards"
import { Spinner } from "@/components/ui/spinner"
import { optimizeCloudinaryUrl, detectDeviceType } from "@/lib/deck-builder/cloudinary-utils"
import { Logo } from "@/components/ui/logo"
import { checkUsername, checkEmail } from "@/lib/api/auth"

export default function RegistroPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle")
  const [emailStatus, setEmailStatus] = useState<"idle" | "available" | "taken">("idle")
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])

  // Detectar tipo de dispositivo para optimizar URLs de Cloudinary
  useEffect(() => {
    function updateDeviceType() {
      setDeviceType(detectDeviceType(window.innerWidth))
    }
    updateDeviceType()
    window.addEventListener('resize', updateDeviceType)
    return () => window.removeEventListener('resize', updateDeviceType)
  }, [])

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

  // Validar contraseña en tiempo real
  useEffect(() => {
    const errors: string[] = []
    if (formData.password.length > 0) {
      if (formData.password.length < 8) {
        errors.push("Al menos 8 caracteres")
      }
      if (!/[A-Z]/.test(formData.password)) {
        errors.push("Una letra mayúscula")
      }
      if (!/\d/.test(formData.password)) {
        errors.push("Un número")
      }
    }
    setPasswordErrors(errors)
  }, [formData.password])

  // Verificar username
  const handleCheckUsername = async () => {
    if (!formData.username.trim()) {
      setError("Por favor ingresa un nombre de usuario")
      return
    }

    setUsernameStatus("checking")
    setError("")

    const result = await checkUsername(formData.username.trim())
    
    if (result.error) {
      setError(result.error)
      setUsernameStatus("idle")
    } else if (result.available) {
      setUsernameStatus("available")
    } else {
      setUsernameStatus("taken")
      setError("Este nombre de usuario ya está en uso")
    }
  }

  // Verificar email después de intentar registrarse
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validaciones básicas
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Por favor completa todos los campos")
      return
    }

    // Validar que el username haya sido verificado
    if (usernameStatus !== "available") {
      setError("Por favor verifica que el nombre de usuario esté disponible")
      return
    }

    // Validar contraseña
    if (passwordErrors.length > 0) {
      setError(`La contraseña debe tener: ${passwordErrors.join(", ")}`)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (!agreedToTerms) {
      setError("Debes aceptar los términos de servicio")
      return
    }

    // Verificar email antes de registrar
    setEmailStatus("idle")
    const emailCheck = await checkEmail(formData.email.trim())
    if (!emailCheck.available) {
      setEmailStatus("taken")
      setError(emailCheck.error || "Este email ya está en uso")
      return
    }
    setEmailStatus("available")

    setIsLoading(true)

    const result = await register(
      formData.username.trim(),
      formData.email.trim(),
      formData.password
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
      // Si el error es de email, actualizar estado
      if (result.error?.includes("email")) {
        setEmailStatus("taken")
      }
      // Si el error es de username, actualizar estado
      if (result.error?.includes("nombre de usuario") || result.error?.includes("username")) {
        setUsernameStatus("taken")
      }
      setError(result.error || "Error al registrar usuario")
    }
  }

  // Resetear estado de username cuando cambia
  useEffect(() => {
    if (formData.username.trim().length > 0 && usernameStatus !== "idle") {
      setUsernameStatus("idle")
    }
  }, [formData.username])

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo - Promocional */}
      <div 
        className="hidden lg:flex lg:w-2/5 p-8 lg:p-12 flex-col justify-between relative overflow-hidden"
        style={{
          backgroundImage: `url(${optimizeCloudinaryUrl('https://res.cloudinary.com/dpbmbrekj/image/upload/v1761435879/FONDO_WEBPP_etcgej.webp', deviceType, true)})`, // isBanner=true
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
            <Logo
              width={200}
              height={67}
              className="h-16 w-auto scale-[1.2]"
              priority={true}
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
          <p>© 2025 CartaTech. <Link href="/terminos-de-servicio" className="hover:underline">Términos de Servicio</Link> · <Link href="/politica-de-privacidad" className="hover:underline">Política de Privacidad</Link></p>
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

          <h1 className="text-3xl font-bold mb-8">Registro en CartaTech</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                Nombre de Usuario
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className={`w-full pr-10 ${
                      usernameStatus === "available" ? "border-green-500" : 
                      usernameStatus === "taken" ? "border-red-500" : ""
                    }`}
                placeholder="Ingresa tu nombre de usuario"
                required
                aria-required="true"
                autoComplete="username"
              />
                  {usernameStatus === "available" && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                  {usernameStatus === "taken" && (
                    <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCheckUsername}
                  disabled={usernameStatus === "checking" || !formData.username.trim()}
                >
                  {usernameStatus === "checking" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Verificar"
                  )}
                </Button>
              </div>
              {usernameStatus === "available" && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  ✓ Nombre de usuario disponible
                </p>
              )}
              {usernameStatus === "taken" && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  ✗ Este nombre de usuario ya está en uso
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <div className="relative">
              <Input
                id="email"
                type="email"
                value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value })
                    setEmailStatus("idle")
                  }}
                  className={`w-full pr-10 ${
                    emailStatus === "available" ? "border-green-500" : 
                    emailStatus === "taken" ? "border-red-500" : ""
                  }`}
                placeholder="tu@email.com"
                required
                aria-required="true"
                autoComplete="email"
              />
                {emailStatus === "available" && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
                {emailStatus === "taken" && (
                  <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                )}
              </div>
              {emailStatus === "taken" && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  ✗ Este email ya está en uso
                </p>
              )}
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
              <div id="password-help" className="text-xs text-muted-foreground mt-1">
                <p className="mb-1">La contraseña debe tener:</p>
                <ul className="list-disc pl-5 space-y-0.5">
                  <li className={formData.password.length >= 8 ? "text-green-600 dark:text-green-400" : ""}>
                    {formData.password.length >= 8 ? "✓" : "○"} Al menos 8 caracteres
                  </li>
                  <li className={/[A-Z]/.test(formData.password) ? "text-green-600 dark:text-green-400" : ""}>
                    {/[A-Z]/.test(formData.password) ? "✓" : "○"} Una letra mayúscula
                  </li>
                  <li className={/\d/.test(formData.password) ? "text-green-600 dark:text-green-400" : ""}>
                    {/\d/.test(formData.password) ? "✓" : "○"} Un número
                  </li>
                </ul>
              </div>
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
                Acepto los{" "}
                <Link 
                  href="/terminos-de-servicio" 
                  className="text-primary hover:underline"
                  target="_blank"
                >
                  Términos de Servicio de CartaTech
                </Link>
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

