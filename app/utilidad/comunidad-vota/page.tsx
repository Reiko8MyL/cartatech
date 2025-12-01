"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { VotePanel } from "@/components/voting/vote-panel"
import { getAllRaces, getRaceVotingData } from "@/lib/voting/utils"

export default function ComunidadVotaPage() {
  const { user } = useAuth()
  const [races, setRaces] = useState<string[]>([])
  const [updateKey, setUpdateKey] = useState(0)

  useEffect(() => {
    const allRaces = getAllRaces()
    // Tomar las primeras 12 razas o todas si hay menos de 12
    setRaces(allRaces.slice(0, 12))
  }, [])

  const handleVoteUpdate = () => {
    setUpdateKey((prev) => prev + 1)
  }

  if (!user) {
    return (
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            La Comunidad Vota
          </h1>
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Inicia sesión para votar</CardTitle>
              <CardDescription>
                Debes tener una cuenta para participar en las votaciones de la comunidad.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button asChild>
                  <Link href="/inicio-sesion">Iniciar Sesión</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/registro">Registrarse</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          La Comunidad Vota
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Participa en las votaciones de la comunidad. Vota por tu aliado favorito de cada raza.
        </p>
        <div className="mt-8 space-y-6">
          {races.map((race) => {
            const initialData = getRaceVotingData(race, user.id)
            return (
              <VotePanel
                key={`${race}-${updateKey}`}
                race={race}
                userId={user.id}
                initialData={initialData}
                onVoteUpdate={handleVoteUpdate}
              />
            )
          })}
        </div>
      </div>
    </main>
  )
}
