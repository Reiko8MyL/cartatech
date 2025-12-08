"use client"

import { useState, useEffect } from "react"
import { X, ArrowRight, ArrowLeft, Sparkles, Users, BookOpen, Heart, Star, Zap, Shield, Sword, Crown, Scroll } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/ui/logo"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { getDeckBackgroundImage } from "@/lib/deck-builder/utils"

interface TourStep {
  id: string
  title: string
  description: string
  icon?: React.ReactNode
  gradient?: string
  backgroundRace?: string | null // Raza para el fondo del banner
  action?: {
    label: string
    href: string
  }
}

// Tour para visitantes no registrados
const visitorTourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "¡Bienvenido, Mitero! 🎴",
    description: "Adéntrate en la plataforma más completa para construir y compartir mazos de Mitos y Leyendas Primer Bloque. Descubre todas las cartas, forja tus estrategias y únete a una comunidad de jugadores apasionados.",
    icon: <Crown className="h-8 w-8" />,
    gradient: "from-amber-500 via-yellow-400 to-amber-600",
    backgroundRace: "Caballero", // Lancelot como fondo épico
  },
  {
    id: "explore",
    title: "Explora el Grimorio Completo",
    description: "Navega por nuestra base de datos, la más completa de cartas de Primer Bloque Extendido. Busca por nombre, descripción, edición, tipo o raza. Cada carta tiene su historia y una tech esperando ser descubierta.",
    icon: <Scroll className="h-8 w-8" />,
    gradient: "from-blue-500 via-indigo-500 to-purple-600",
    backgroundRace: "Faerie", // Ambiente mágico
    action: {
      label: "Abrir Galería",
      href: "/galeria",
    },
  },
  {
    id: "build",
    title: "Forja tus Estrategias",
    description: "Usa nuestro Deck Builder para crear mazos legendarios. Combina cartas, prueba sinergias, valida tus tácticas y experimenta con todas las posibilidades que ofrece el Primer Bloque Extendido.",
    icon: <Sword className="h-8 w-8" />,
    gradient: "from-red-500 via-orange-500 to-red-600",
    backgroundRace: "Dragón", // Fuerza y poder
    action: {
      label: "Ir al Deck Builder",
      href: "/deck-builder",
    },
  },
  {
    id: "community",
    title: "Únete a la Comunidad",
    description: "Descubre mazos creados por otros Miteros, aprende de sus estrategias y comparte tus propias creaciones. Nuestra geografía nos separan físicamente, pero el amor por las mititos nos une.",
    icon: <Users className="h-8 w-8" />,
    gradient: "from-green-500 via-emerald-500 to-teal-600",
    backgroundRace: "Héroe", // Heroísmo y comunidad
    action: {
      label: "Ver Mazos de la Comunidad",
      href: "/mazos-comunidad",
    },
  },
  {
    id: "register",
    title: "¡Desbloquea tu Potencial!",
    description: "Regístrate gratis y desbloquea todas las funcionalidades: guarda tus mazos, marca favoritos, interactúa con la comunidad, recibe notificaciones y mucho más. ¡Tu aventura comienza ahora!",
    icon: <Shield className="h-8 w-8" />,
    gradient: "from-purple-500 via-pink-500 to-rose-600",
    backgroundRace: "Olímpico", // Poder divino
    action: {
      label: "Crear Cuenta Gratis",
      href: "/registro",
    },
  },
]

// Tour para usuarios nuevos (recién registrados)
const newUserTourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "¡Bienvenido a la Hermandad, Mitero! 🎉",
    description: "Tu cuenta está activa. Ahora tienes acceso a todas las funcionalidades exclusivas de CartaTech. Prepárate para forjar leyendas y compartir tus estrategias con la comunidad.",
    icon: <Crown className="h-8 w-8" />,
    gradient: "from-amber-500 via-yellow-400 to-amber-600",
    backgroundRace: "Titán", // Poder y grandeza
  },
  {
    id: "save-decks",
    title: "Guarda tus Mazos Legendarios",
    description: "Crea y guarda todos los mazos que quieras. Tus estrategias se sincronizan automáticamente y estarán disponibles en todos tus dispositivos. ¡Nunca pierdas una combinación ganadora!",
    icon: <BookOpen className="h-8 w-8" />,
    gradient: "from-blue-500 via-indigo-500 to-purple-600",
    backgroundRace: "Eterno", // Sabiduría y conocimiento
    action: {
      label: "Crear mi Primer Mazo",
      href: "/deck-builder",
    },
  },
  {
    id: "favorites",
    title: "Marca tus Favoritos",
    description: "Guarda los mazos que más te inspiren de la comunidad. Accede rápidamente a tus favoritos y compártelos con tus aliados cuando quieras.",
    icon: <Heart className="h-8 w-8" />,
    gradient: "from-pink-500 via-rose-500 to-red-600",
    backgroundRace: "Sacerdote", // Devoción y favoritos
    action: {
      label: "Ver Mis Favoritos",
      href: "/mis-favoritos",
    },
  },
  {
    id: "interact",
    title: "Interactúa con la Hermandad",
    description: "Da likes a los mazos que te gusten, comenta tus opiniones, responde a otros Miteros y comparte tus creaciones. La comunidad está esperando tu sabiduría.",
    icon: <Users className="h-8 w-8" />,
    gradient: "from-green-500 via-emerald-500 to-teal-600",
    backgroundRace: "Defensor", // Protección y comunidad
    action: {
      label: "Explorar Comunidad",
      href: "/mazos-comunidad",
    },
  },
  {
    id: "notifications",
    title: "Mantente Conectado",
    description: "Recibe notificaciones cuando alguien comente tus mazos, te dé like o responda a tus comentarios. Nunca te pierdas una interacción importante con la comunidad.",
    icon: <Star className="h-8 w-8" />,
    gradient: "from-yellow-500 via-amber-500 to-orange-600",
    backgroundRace: "Faraón", // Majestuosidad y notificaciones
  },
  {
    id: "collection",
    title: "Gestiona tu Colección",
    description: "Marca las cartas que tienes en tu colección física. Lleva un registro completo y organiza tu inventario de manera fácil y visual. ¡Sé el maestro de tu colección!",
    icon: <Zap className="h-8 w-8" />,
    gradient: "from-purple-500 via-violet-500 to-indigo-600",
    backgroundRace: "Desafiante", // Fuerza y colección
    action: {
      label: "Ver Mi Colección",
      href: "/galeria",
    },
  },
]

interface WelcomeTourProps {
  forceOpen?: boolean
  tourType?: "visitor" | "newUser"
}

export function WelcomeTour({ forceOpen = false, tourType }: WelcomeTourProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [detectedTourType, setDetectedTourType] = useState<"visitor" | "newUser" | null>(null)

  // Determinar qué tour mostrar
  useEffect(() => {
    if (forceOpen && tourType) {
      setDetectedTourType(tourType)
      setIsOpen(true)
      setCurrentStep(0)
      return
    }

    if (!user) {
      const hasSeenVisitorTour = localStorage.getItem("cartatech_visitor_tour_seen")
      if (!hasSeenVisitorTour) {
        setDetectedTourType("visitor")
        const timer = setTimeout(() => {
          setIsOpen(true)
        }, 2000)
        return () => clearTimeout(timer)
      }
    } else {
      const hasCompletedNewUserTour = localStorage.getItem(`cartatech_new_user_tour_completed_${user.id}`)
      const userCreatedAt = user.createdAt
      const isNewUser = !hasCompletedNewUserTour && userCreatedAt && (Date.now() - userCreatedAt < 24 * 60 * 60 * 1000)
      
      if (isNewUser) {
        setDetectedTourType("newUser")
        const timer = setTimeout(() => {
          setIsOpen(true)
        }, 2000)
        return () => clearTimeout(timer)
      }
    }
  }, [user, forceOpen, tourType])

  const tourSteps = detectedTourType === "newUser" ? newUserTourSteps : visitorTourSteps

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    if (!forceOpen) {
      if (detectedTourType === "visitor") {
        localStorage.setItem("cartatech_visitor_tour_seen", "true")
      } else if (detectedTourType === "newUser" && user) {
        localStorage.setItem(`cartatech_new_user_tour_completed_${user.id}`, "true")
      }
    }
    setIsOpen(false)
    setCurrentStep(0)
  }

  const handleAction = (href: string) => {
    handleComplete()
    router.push(href)
  }

  if (!isOpen || !detectedTourType) return null

  const step = tourSteps[currentStep]
  const isLastStep = currentStep === tourSteps.length - 1
  const gradientClass = step.gradient || "from-primary via-primary/80 to-primary"
  const backgroundImage = step.backgroundRace ? getDeckBackgroundImage(step.backgroundRace) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-500">
      {/* Efecto de brillo de fondo */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 animate-pulse" />
      
      <Card className="relative w-full max-w-2xl mx-4 animate-in fade-in zoom-in duration-500 shadow-2xl border-2 border-primary/20 overflow-hidden bg-card">
        {/* Logo en la esquina superior izquierda */}
        <div className="absolute top-4 left-4 z-20">
          <Logo 
            width={300} 
            height={100} 
            className="h-20 sm:h-24 opacity-90"
            priority={false}
          />
        </div>
        
        {/* Botón de cerrar en la esquina superior derecha */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          className="absolute top-4 right-4 z-20 h-8 w-8 p-0 hover:bg-destructive/10 rounded-full transition-all bg-background/90"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* 1. Imagen - más sutil */}
        {backgroundImage && (
          <div className="relative h-32 sm:h-40 overflow-hidden opacity-60">
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                filter: 'blur(1px)',
              }}
            />
            {/* Overlay sutil para mejorar legibilidad */}
            <div className="absolute inset-0 bg-gradient-to-b from-card/50 via-card/30 to-card/50" />
          </div>
        )}

        {/* 2. Título */}
        <CardHeader className="space-y-4 pb-4 pt-6">
          <div className="flex items-center gap-3">
            {/* Icono con fondo gradiente */}
            {step.icon && (
              <div className={`relative p-3 rounded-lg bg-gradient-to-br ${gradientClass} shadow-md flex-shrink-0`}>
                <div className="text-white drop-shadow-md">
                  {step.icon}
                </div>
              </div>
            )}
            <CardTitle className="text-2xl sm:text-3xl font-bold text-foreground">
              {step.title}
            </CardTitle>
          </div>
          
          {/* Indicador de progreso */}
          <div className="flex gap-1.5">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  index === currentStep
                    ? `bg-gradient-to-r ${gradientClass} shadow-md`
                    : index < currentStep
                    ? "bg-primary/40"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>
        </CardHeader>

        {/* 3. Contenido */}
        <CardContent className="space-y-6 pb-6">
          <CardDescription className="text-base sm:text-lg leading-relaxed text-muted-foreground min-h-[3rem]">
            {step.description}
          </CardDescription>
        </CardContent>

        {/* 4. Botones */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            {/* Botón anterior - solo se muestra si no es el primer paso */}
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="h-9 w-9 p-0 border-2 hover:bg-primary/10 transition-all duration-300 flex-shrink-0"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
              {step.action && (
                <Button 
                  onClick={() => handleAction(step.action!.href)} 
                  className={`flex-1 bg-gradient-to-r ${gradientClass} hover:opacity-90 text-white shadow-md hover:shadow-lg transition-all duration-300`}
                  size="lg"
                >
                  <span className="font-semibold">{step.action.label}</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
              <Button
                variant={isLastStep ? "default" : "outline"}
                onClick={handleNext}
                className={`${step.action ? "" : "flex-1"} ${
                  isLastStep 
                    ? `bg-gradient-to-r ${gradientClass} text-white shadow-md hover:shadow-lg` 
                    : "border-2 hover:bg-primary/10"
                } transition-all duration-300`}
                size="lg"
              >
                <span className="font-semibold">
                  {isLastStep 
                    ? (detectedTourType === "visitor" ? "¡Explorar!" : "¡Comenzar Aventura!") 
                    : "Siguiente"}
                </span>
                {!isLastStep && <ArrowRight className="h-4 w-4 ml-2" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Decoración inferior */}
        <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${gradientClass} opacity-60`} />
      </Card>
    </div>
  )
}
