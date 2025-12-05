"use client";

import { useState, useEffect } from "react";
import { AdminGuard } from "@/components/admin/admin-guard";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getBannerSettings,
  updateBannerSettings,
  type BannerSetting,
} from "@/lib/api/banner-settings";
import { toastSuccess, toastError } from "@/lib/toast";
import { Save, RotateCcw, Loader2, Image as ImageIcon } from "lucide-react";
import { getDeckBackgroundImage } from "@/lib/deck-builder/utils";

const CONTEXT_LABELS: Record<string, string> = {
  "mis-mazos": "Mis Mazos",
  "mazos-comunidad": "Mazos de la Comunidad",
  favoritos: "Favoritos",
  "deck-builder": "Deck Builder (Cargar Mazo)",
};

const CONTEXT_DESCRIPTIONS: Record<string, string> = {
  "mis-mazos": "Ajusta cómo se ven los banners en la página 'Mis Mazos'",
  "mazos-comunidad": "Ajusta cómo se ven los banners en la página 'Mazos de la Comunidad'",
  favoritos: "Ajusta cómo se ven los banners en la página 'Mis Favoritos'",
  "deck-builder": "Ajusta cómo se ven los banners en el panel de cargar mazo del Deck Builder",
};

export default function AjustarBannersPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<BannerSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedContext, setSelectedContext] = useState<string>("mis-mazos");

  // Cargar ajustes al montar
  useEffect(() => {
    async function loadSettings() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const loadedSettings = await getBannerSettings(user.id);
        setSettings(loadedSettings);
        if (loadedSettings.length > 0 && !selectedContext) {
          setSelectedContext(loadedSettings[0].context);
        }
      } catch (error) {
        console.error("Error al cargar ajustes:", error);
        toastError("Error al cargar los ajustes");
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, [user]);

  // Obtener el ajuste actual seleccionado
  const currentSetting = settings.find((s) => s.context === selectedContext);

  // Valores locales para edición
  const [localValues, setLocalValues] = useState({
    backgroundPosition: "center",
    backgroundSize: "cover",
    height: 128,
    overlayOpacity: 0.6,
    overlayGradient: "to-t",
  });

  // Actualizar valores locales cuando cambia el contexto seleccionado
  useEffect(() => {
    if (currentSetting) {
      setLocalValues({
        backgroundPosition: currentSetting.backgroundPosition,
        backgroundSize: currentSetting.backgroundSize,
        height: currentSetting.height,
        overlayOpacity: currentSetting.overlayOpacity,
        overlayGradient: currentSetting.overlayGradient,
      });
    }
  }, [currentSetting]);

  async function handleSave() {
    if (!user?.id || !currentSetting) return;

    setIsSaving(true);
    try {
      const updatedSettings = await updateBannerSettings(user.id, [
        {
          context: selectedContext,
          backgroundPosition: localValues.backgroundPosition,
          backgroundSize: localValues.backgroundSize,
          height: localValues.height,
          overlayOpacity: localValues.overlayOpacity,
          overlayGradient: localValues.overlayGradient,
        },
      ]);

      // Actualizar el estado local
      setSettings((prev) =>
        prev.map((s) => {
          const updated = updatedSettings.find((us) => us.context === s.context);
          return updated || s;
        })
      );

      toastSuccess(
        `Ajustes de ${CONTEXT_LABELS[selectedContext]} guardados correctamente`
      );
    } catch (error) {
      console.error("Error al guardar:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error al guardar los ajustes";
      toastError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReset() {
    if (!user?.id || !currentSetting) return;

    setIsSaving(true);
    try {
      // Valores por defecto según el contexto
      const defaults: Record<string, typeof localValues> = {
        "mis-mazos": {
          backgroundPosition: "center",
          backgroundSize: "cover",
          height: 128,
          overlayOpacity: 0.6,
          overlayGradient: "to-t",
        },
        "mazos-comunidad": {
          backgroundPosition: "center",
          backgroundSize: "cover",
          height: 128,
          overlayOpacity: 0.6,
          overlayGradient: "to-t",
        },
        favoritos: {
          backgroundPosition: "center",
          backgroundSize: "cover",
          height: 128,
          overlayOpacity: 0.6,
          overlayGradient: "to-t",
        },
        "deck-builder": {
          backgroundPosition: "center",
          backgroundSize: "cover",
          height: 80,
          overlayOpacity: 0.7,
          overlayGradient: "to-t",
        },
      };

      const defaultValues = defaults[selectedContext] || defaults["mis-mazos"];

      const updatedSettings = await updateBannerSettings(user.id, [
        {
          context: selectedContext,
          ...defaultValues,
        },
      ]);

      // Actualizar el estado local
      setSettings((prev) =>
        prev.map((s) => {
          const updated = updatedSettings.find((us) => us.context === s.context);
          return updated || s;
        })
      );

      setLocalValues(defaultValues);

      toastSuccess(
        `Ajustes de ${CONTEXT_LABELS[selectedContext]} restaurados a valores por defecto`
      );
    } catch (error) {
      console.error("Error al resetear:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error al resetear los ajustes";
      toastError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }

  // Generar estilo del banner para la vista previa
  const previewStyle = {
    backgroundImage: `url(${getDeckBackgroundImage("Caballero")})`,
    backgroundPosition: localValues.backgroundPosition,
    backgroundSize: localValues.backgroundSize,
    height: `${localValues.height}px`,
  };

  const overlayStyle = {
    background: `linear-gradient(${localValues.overlayGradient === "to-t" ? "to top" : localValues.overlayGradient === "to-b" ? "to bottom" : localValues.overlayGradient === "to-l" ? "to left" : "to right"}, rgba(0,0,0,${localValues.overlayOpacity}) 0%, transparent 100%)`,
  };

  return (
    <AdminGuard requiredRole="ADMIN">
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Ajustar Banners de Deck Panels</h1>
          <p className="text-muted-foreground">
            Ajusta cómo se ven los banners de los deck panels en diferentes secciones de la plataforma.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel de configuración */}
            <Card>
              <CardHeader>
                <CardTitle>Configuración</CardTitle>
                <CardDescription>
                  Selecciona el contexto y ajusta los parámetros del banner
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Selector de contexto */}
                <div className="space-y-2">
                  <Label>Contexto</Label>
                  <Select value={selectedContext} onValueChange={setSelectedContext}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CONTEXT_LABELS).map(([context, label]) => (
                        <SelectItem key={context} value={context}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {CONTEXT_DESCRIPTIONS[selectedContext]}
                  </p>
                </div>

                {/* Posición del fondo */}
                <div className="space-y-2">
                  <Label htmlFor="backgroundPosition">
                    Posición del Fondo: {localValues.backgroundPosition}
                  </Label>
                  <Select
                    value={localValues.backgroundPosition}
                    onValueChange={(value) =>
                      setLocalValues((prev) => ({ ...prev, backgroundPosition: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="center">Centro</SelectItem>
                      <SelectItem value="top">Arriba</SelectItem>
                      <SelectItem value="bottom">Abajo</SelectItem>
                      <SelectItem value="left">Izquierda</SelectItem>
                      <SelectItem value="right">Derecha</SelectItem>
                      <SelectItem value="center top">Centro Arriba</SelectItem>
                      <SelectItem value="center bottom">Centro Abajo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tamaño del fondo */}
                <div className="space-y-2">
                  <Label htmlFor="backgroundSize">
                    Tamaño del Fondo: {localValues.backgroundSize}
                  </Label>
                  <Select
                    value={localValues.backgroundSize}
                    onValueChange={(value) =>
                      setLocalValues((prev) => ({ ...prev, backgroundSize: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cover">Cover (Cubrir)</SelectItem>
                      <SelectItem value="contain">Contain (Contener)</SelectItem>
                      <SelectItem value="100%">100%</SelectItem>
                      <SelectItem value="120%">120%</SelectItem>
                      <SelectItem value="135%">135%</SelectItem>
                      <SelectItem value="150%">150%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Altura */}
                <div className="space-y-2">
                  <Label htmlFor="height">
                    Altura: {localValues.height}px
                  </Label>
                  <Input
                    id="height"
                    type="range"
                    min="60"
                    max="200"
                    step="4"
                    value={localValues.height}
                    onChange={(e) =>
                      setLocalValues((prev) => ({
                        ...prev,
                        height: Number(e.target.value),
                      }))
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>60px</span>
                    <span>130px</span>
                    <span>200px</span>
                  </div>
                </div>

                {/* Opacidad del overlay */}
                <div className="space-y-2">
                  <Label htmlFor="overlayOpacity">
                    Opacidad del Overlay: {Math.round(localValues.overlayOpacity * 100)}%
                  </Label>
                  <Input
                    id="overlayOpacity"
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={localValues.overlayOpacity * 100}
                    onChange={(e) =>
                      setLocalValues((prev) => ({
                        ...prev,
                        overlayOpacity: Number(e.target.value) / 100,
                      }))
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Dirección del gradiente */}
                <div className="space-y-2">
                  <Label htmlFor="overlayGradient">
                    Dirección del Gradiente: {localValues.overlayGradient}
                  </Label>
                  <Select
                    value={localValues.overlayGradient}
                    onValueChange={(value) =>
                      setLocalValues((prev) => ({ ...prev, overlayGradient: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="to-t">Hacia Arriba (to-t)</SelectItem>
                      <SelectItem value="to-b">Hacia Abajo (to-b)</SelectItem>
                      <SelectItem value="to-l">Hacia Izquierda (to-l)</SelectItem>
                      <SelectItem value="to-r">Hacia Derecha (to-r)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="size-4 mr-2" />
                        Guardar
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleReset}
                    disabled={isSaving}
                    variant="outline"
                  >
                    <RotateCcw className="size-4 mr-2" />
                    Resetear
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Panel de vista previa */}
            <Card>
              <CardHeader>
                <CardTitle>Vista Previa</CardTitle>
                <CardDescription>
                  Previsualiza cómo se verá el banner con los ajustes actuales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg overflow-hidden">
                  <div
                    className="relative overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20"
                    style={previewStyle}
                  >
                    <div
                      className="absolute inset-0"
                      style={overlayStyle}
                    />
                    <div className="absolute bottom-2 left-2 right-2 z-10">
                      <div className="flex items-center justify-between">
                        <h3 className="text-white text-lg font-semibold drop-shadow-lg">
                          Nombre del Mazo
                        </h3>
                        <ImageIcon className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground space-y-1 p-4 bg-muted rounded-lg">
                  <div>
                    <strong>Contexto:</strong> {CONTEXT_LABELS[selectedContext]}
                  </div>
                  <div>
                    <strong>Posición:</strong> {localValues.backgroundPosition}
                  </div>
                  <div>
                    <strong>Tamaño:</strong> {localValues.backgroundSize}
                  </div>
                  <div>
                    <strong>Altura:</strong> {localValues.height}px
                  </div>
                  <div>
                    <strong>Opacidad Overlay:</strong>{" "}
                    {Math.round(localValues.overlayOpacity * 100)}%
                  </div>
                  <div>
                    <strong>Gradiente:</strong> {localValues.overlayGradient}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}

