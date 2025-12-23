"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { Lock, Globe, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface PrivacySettingsProps {
  showLocation: boolean
  showFavoriteRaces: boolean
  showFavoriteFormat: boolean
  showTeam: boolean
  showPreferredStore: boolean
  onShowLocationChange: (value: boolean) => void
  onShowFavoriteRacesChange: (value: boolean) => void
  onShowFavoriteFormatChange: (value: boolean) => void
  onShowTeamChange: (value: boolean) => void
  onShowPreferredStoreChange: (value: boolean) => void
}

export function PrivacySettings({
  showLocation,
  showFavoriteRaces,
  showFavoriteFormat,
  showTeam,
  showPreferredStore,
  onShowLocationChange,
  onShowFavoriteRacesChange,
  onShowFavoriteFormatChange,
  onShowTeamChange,
  onShowPreferredStoreChange,
}: PrivacySettingsProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                <CardTitle>Configuración de Privacidad</CardTitle>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  isOpen && "transform rotate-180"
                )}
              />
            </div>
            <CardDescription>
              Controla qué información quieres mostrar en tu perfil público
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="show-location" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Ubicación
            </Label>
            <p className="text-sm text-muted-foreground">
              Mostrar país, región y ciudad
            </p>
          </div>
          <Switch
            id="show-location"
            checked={showLocation}
            onCheckedChange={onShowLocationChange}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="show-favorite-races">Razas Favoritas</Label>
            <p className="text-sm text-muted-foreground">
              Mostrar tus razas favoritas
            </p>
          </div>
          <Switch
            id="show-favorite-races"
            checked={showFavoriteRaces}
            onCheckedChange={onShowFavoriteRacesChange}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="show-favorite-format">Formato Favorito</Label>
            <p className="text-sm text-muted-foreground">
              Mostrar tu formato favorito
            </p>
          </div>
          <Switch
            id="show-favorite-format"
            checked={showFavoriteFormat}
            onCheckedChange={onShowFavoriteFormatChange}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="show-team">Team</Label>
            <p className="text-sm text-muted-foreground">
              Mostrar el team al que perteneces
            </p>
          </div>
          <Switch
            id="show-team"
            checked={showTeam}
            onCheckedChange={onShowTeamChange}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="show-preferred-store">Tienda TCG Preferida</Label>
            <p className="text-sm text-muted-foreground">
              Mostrar tu tienda TCG preferida
            </p>
          </div>
          <Switch
            id="show-preferred-store"
            checked={showPreferredStore}
            onCheckedChange={onShowPreferredStoreChange}
          />
          </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
