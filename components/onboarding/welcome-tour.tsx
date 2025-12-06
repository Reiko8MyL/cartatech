"use client"

import { useState, useEffect } from "react"
import { X, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

interface TourStep {
  id: string
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
}

const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "¡Bienvenido a Carta Tech!",
    description: "La mejor plataforma para construir y compartir mazos de Mitos y Leyendas Primer Bloque.",
  },
  {
    id: "deck-builder",
    title: "Crea tus mazos",
    description: "Usa el Deck Builder para crear mazos personalizados. Busca cartas, agrega las que necesites y guarda tus creaciones.",
    action: {
      label: "Ir al Deck Builder",
      href: "/deck-builder",
    },
  },
  {
    id: "community",
    title: "Explora la comunidad",
    description: "Descubre mazos creados por otros jugadores, dales like y compártelos con tus amigos.",
    action: {
      label: "Ver mazos de la comunidad",
      href: "/mazos-comunidad",
    },
  },
  {
    id: "gallery",
    title: "Explora la galería",
    description: "Navega por todas las cartas disponibles, busca por edición, tipo o raza, y marca tus favoritas.",
    action: {
      label: "Ver galería",
      href: "/galeria",
    },
  },
]

export function WelcomeTour() {
  const { user } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!user) return

    // Verificar si el usuario ya completó el tour
    const hasCompletedTour = localStorage.getItem(`cartatech_tour_completed_${user.id}`)
    
    if (!hasCompletedTour) {
      // Esperar un poco antes de mostrar el tour
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [user])

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    if (user) {
      localStorage.setItem(`cartatech_tour_completed_${user.id}`, "true")
    }
    setIsOpen(false)
  }

  const handleAction = (href: string) => {
    handleComplete()
    router.push(href)
  }

  if (!isOpen || !user) return null

  const step = tourSteps[currentStep]
  const isLastStep = currentStep === tourSteps.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 animate-in fade-in zoom-in duration-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{step.title}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-1 mt-4">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded ${
                  index === currentStep
                    ? "bg-primary"
                    : index < currentStep
                    ? "bg-primary/50"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <CardDescription className="text-base">
            {step.description}
          </CardDescription>
          <div className="flex gap-2">
            {step.action && (
              <Button onClick={() => handleAction(step.action!.href)} className="flex-1">
                {step.action.label}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            <Button
              variant={isLastStep ? "default" : "outline"}
              onClick={handleNext}
              className={step.action ? "" : "flex-1"}
            >
              {isLastStep ? "Comenzar" : "Siguiente"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}






