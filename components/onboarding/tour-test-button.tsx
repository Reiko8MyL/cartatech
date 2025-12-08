"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, X } from "lucide-react"
import { WelcomeTour } from "./welcome-tour"

export function TourTestButton() {
  const [showVisitorTour, setShowVisitorTour] = useState(false)
  const [showNewUserTour, setShowNewUserTour] = useState(false)
  const [key, setKey] = useState(0) // Key para forzar re-render del tour

  // Resetear cuando se cierra
  useEffect(() => {
    if (!showVisitorTour && !showNewUserTour) {
      setKey(prev => prev + 1)
    }
  }, [showVisitorTour, showNewUserTour])

  return (
    <>
      <div className="fixed top-20 left-4 z-50 flex flex-col gap-2">
        <div className="bg-background/95 backdrop-blur-sm border-2 rounded-lg p-2 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">TEST TOURS</span>
            {(showVisitorTour || showNewUserTour) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowVisitorTour(false)
                  setShowNewUserTour(false)
                }}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowVisitorTour(true)
                setShowNewUserTour(false)
                setKey(prev => prev + 1)
              }}
              className="text-xs"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Tour Visitante
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowNewUserTour(true)
                setShowVisitorTour(false)
                setKey(prev => prev + 1)
              }}
              className="text-xs"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Tour Usuario Nuevo
            </Button>
          </div>
        </div>
      </div>
      
      {showVisitorTour && (
        <WelcomeTour key={`visitor-${key}`} forceOpen={true} tourType="visitor" />
      )}
      {showNewUserTour && (
        <WelcomeTour key={`newuser-${key}`} forceOpen={true} tourType="newUser" />
      )}
    </>
  )
}

