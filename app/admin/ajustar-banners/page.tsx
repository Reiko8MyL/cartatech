"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
  deleteBannerSetting,
  type BannerSetting,
} from "@/lib/api/banner-settings";
import { toastSuccess, toastError } from "@/lib/toast";
import { Save, RotateCcw, Loader2, Image as ImageIcon, Globe, Lock, Eye, Trash2 } from "lucide-react";
import { getDeckBackgroundImage, EDITION_LOGOS, getDeckFormatName } from "@/lib/deck-builder/utils";
import { getAllBackgroundImages } from "@/lib/deck-builder/banner-utils";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";

const CONTEXT_LABELS: Record<string, string> = {
  "mis-mazos": "Mis Mazos",
  "mazos-comunidad": "Mazos de la Comunidad",
  favoritos: "Favoritos",
  "deck-builder": "Deck Builder (Cargar Mazo)",
  "mazo-individual": "Página Individual de Mazo",
};

const CONTEXT_DESCRIPTIONS: Record<string, string> = {
  "mis-mazos": "Ajusta cómo se ven los banners en la página 'Mis Mazos'",
  "mazos-comunidad": "Ajusta cómo se ven los banners en la página 'Mazos de la Comunidad'",
  favoritos: "Ajusta cómo se ven los banners en la página 'Mis Favoritos'",
  "deck-builder": "Ajusta cómo se ven los banners en el panel de cargar mazo del Deck Builder",
  "mazo-individual": "Ajusta cómo se ve el banner hero en la página individual de cada mazo (solo por imagen)",
};

// Contextos que comparten la misma forma de mostrar paneles
const CONTEXT_GROUPS: Record<string, string[]> = {
  "listas-mazos": ["mis-mazos", "mazos-comunidad", "favoritos"],
};

const DEVICE_LABELS: Record<string, string> = {
  desktop: "Desktop",
  tablet: "Tablet",
  mobile: "Móvil",
};

export default function AjustarBannersPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Selectores
  const [selectedContexts, setSelectedContexts] = useState<string[]>(["mis-mazos"]);
  const [selectedViewMode, setSelectedViewMode] = useState<string>("grid");
  const [selectedDevice, setSelectedDevice] = useState<string>("desktop");
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  
  // Para compatibilidad, usar el primer contexto seleccionado para cargar ajustes
  const selectedContext = selectedContexts[0] || "mis-mazos";
  
  // Valores locales para edición
  const [localValues, setLocalValues] = useState({
    backgroundPositionX: 50,
    backgroundPositionY: 50,
    backgroundSize: "cover",
    height: 128,
    overlayOpacity: 0.6,
    overlayGradient: "to-t",
  });

  const [settings, setSettings] = useState<BannerSetting[]>([]);
  const [backgroundImages, setBackgroundImages] = useState(getAllBackgroundImages());

  // Cargar ajustes al cambiar filtros
  useEffect(() => {
    async function loadSettings() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const loadedSettings = await getBannerSettings(
          user.id,
          selectedContext,
          selectedViewMode,
          selectedDevice,
          selectedImageId
        );
        setSettings(loadedSettings);
        
        // Cargar ajuste actual o usar valores por defecto
        const currentSetting = loadedSettings.find(
          s => s.backgroundImageId === selectedImageId
        ) || loadedSettings.find(s => s.backgroundImageId === null);

        if (currentSetting) {
          setLocalValues({
            backgroundPositionX: currentSetting.backgroundPositionX,
            backgroundPositionY: currentSetting.backgroundPositionY,
            backgroundSize: currentSetting.backgroundSize,
            height: currentSetting.height,
            overlayOpacity: currentSetting.overlayOpacity,
            overlayGradient: currentSetting.overlayGradient,
          });
        } else {
          // Valores por defecto
          const defaults: Record<string, typeof localValues> = {
            "mis-mazos": {
              backgroundPositionX: 50,
              backgroundPositionY: 50,
              backgroundSize: "cover",
              height: selectedViewMode === "grid" ? 128 : 128,
              overlayOpacity: 0.6,
              overlayGradient: "to-t",
            },
            "mazos-comunidad": {
              backgroundPositionX: 50,
              backgroundPositionY: 50,
              backgroundSize: "cover",
              height: selectedViewMode === "grid" ? 128 : 128,
              overlayOpacity: 0.6,
              overlayGradient: "to-t",
            },
            favoritos: {
              backgroundPositionX: 50,
              backgroundPositionY: 50,
              backgroundSize: "cover",
              height: selectedViewMode === "grid" ? 128 : 128,
              overlayOpacity: 0.6,
              overlayGradient: "to-t",
            },
            "deck-builder": {
              backgroundPositionX: 50,
              backgroundPositionY: 50,
              backgroundSize: "cover",
              height: 80,
              overlayOpacity: 0.7,
              overlayGradient: "to-t",
            },
          };
          setLocalValues(defaults[selectedContext] || defaults["mis-mazos"]);
        }
      } catch (error) {
        console.error("Error al cargar ajustes:", error);
        toastError("Error al cargar los ajustes");
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, [user, selectedContext, selectedViewMode, selectedDevice, selectedImageId]);

  async function handleSave() {
    if (!user?.id || selectedContexts.length === 0) return;

    setIsSaving(true);
    try {
      // Crear ajustes para todos los contextos seleccionados
      const settingsToSave = selectedContexts.map(context => ({
        context,
        viewMode: context === "mazo-individual" ? "grid" : selectedViewMode, // mazo-individual no tiene viewMode
        device: selectedDevice,
        backgroundImageId: selectedImageId,
        ...localValues,
      }));

      await updateBannerSettings(user.id, settingsToSave);

      toastSuccess(`Ajustes guardados correctamente para ${selectedContexts.length} contexto(s)`);
      
      // Recargar ajustes del primer contexto para mostrar
      const loadedSettings = await getBannerSettings(
        user.id,
        selectedContext,
        selectedViewMode,
        selectedDevice,
        selectedImageId
      );
      setSettings(loadedSettings);
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
    if (!user?.id || selectedContexts.length === 0) return;

    setIsSaving(true);
    try {
      // Eliminar ajustes personalizados para todos los contextos seleccionados
      for (const context of selectedContexts) {
        const contextSettings = await getBannerSettings(
          user.id,
          context,
          context === "mazo-individual" ? "grid" : selectedViewMode,
          selectedDevice,
          selectedImageId
        );
        
        const currentSetting = contextSettings.find(
          s => s.backgroundImageId === selectedImageId && s.id
        );
        
        if (currentSetting?.id) {
          await deleteBannerSetting(user.id, currentSetting.id);
        }
      }

      // Restaurar valores por defecto
      const defaults: Record<string, typeof localValues> = {
        "mis-mazos": {
          backgroundPositionX: 50,
          backgroundPositionY: 50,
          backgroundSize: "cover",
          height: selectedViewMode === "grid" ? 128 : 128,
          overlayOpacity: 0.6,
          overlayGradient: "to-t",
        },
        "mazos-comunidad": {
          backgroundPositionX: 50,
          backgroundPositionY: 50,
          backgroundSize: "cover",
          height: selectedViewMode === "grid" ? 128 : 128,
          overlayOpacity: 0.6,
          overlayGradient: "to-t",
        },
        favoritos: {
          backgroundPositionX: 50,
          backgroundPositionY: 50,
          backgroundSize: "cover",
          height: selectedViewMode === "grid" ? 128 : 128,
          overlayOpacity: 0.6,
          overlayGradient: "to-t",
        },
        "deck-builder": {
          backgroundPositionX: 50,
          backgroundPositionY: 50,
          backgroundSize: "cover",
          height: 80,
          overlayOpacity: 0.7,
          overlayGradient: "to-t",
        },
        "mazo-individual": {
          backgroundPositionX: 50,
          backgroundPositionY: 50,
          backgroundSize: "cover",
          height: 256, // h-64 = 256px
          overlayOpacity: 0.8,
          overlayGradient: "to-t",
        },
      };

      setLocalValues(defaults[selectedContext] || defaults["mis-mazos"]);
      toastSuccess(`Ajustes restaurados a valores por defecto para ${selectedContexts.length} contexto(s)`);
      
      // Recargar ajustes
      const loadedSettings = await getBannerSettings(
        user.id,
        selectedContext,
        selectedViewMode,
        selectedDevice,
        selectedImageId
      );
      setSettings(loadedSettings);
    } catch (error) {
      console.error("Error al resetear:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error al resetear los ajustes";
      toastError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }

  // Función para manejar selección de contextos
  function handleContextToggle(context: string, checked: boolean) {
    if (checked) {
      setSelectedContexts(prev => [...prev, context]);
    } else {
      setSelectedContexts(prev => prev.filter(c => c !== context));
    }
  }

  // Función para seleccionar grupo de contextos
  function handleGroupSelect(groupKey: string) {
    const group = CONTEXT_GROUPS[groupKey];
    if (group) {
      setSelectedContexts(group);
    }
  }

  // Componente para subir imágenes
  function ButtonUploadBannerImage({ onUploadSuccess }: { onUploadSuccess: (image: { id: string; url: string; race: string }) => void }) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (!file || !user?.id) return;

      // Validar tipo de archivo
      if (!file.type.startsWith("image/")) {
        toastError("Por favor selecciona un archivo de imagen");
        return;
      }

      // Validar tamaño (máx 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toastError("La imagen no puede ser mayor a 10MB");
        return;
      }

      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("userId", user.id);
        formData.append("race", "Custom");

        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
        const url = API_BASE_URL
          ? `${API_BASE_URL}/api/admin/upload-banner-image`
          : `/api/admin/upload-banner-image`;

        const response = await fetch(url, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al subir la imagen");
        }

        const data = await response.json();
        const newImage = {
          id: data.url,
          url: data.url,
          race: data.race || "Custom",
        };

        // Agregar a la lista de imágenes
        setBackgroundImages(prev => [...prev, newImage]);
        onUploadSuccess(newImage);
      } catch (error) {
        console.error("Error al subir imagen:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al subir la imagen";
        toastError(errorMessage);
      } finally {
        setIsUploading(false);
        // Resetear input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }

    return (
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="banner-image-upload"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Subir Nueva Imagen
            </>
          )}
        </Button>
      </div>
    );
  }

  // Obtener imagen de fondo para vista previa
  const previewImage = selectedImageId 
    ? backgroundImages.find(img => img.id === selectedImageId)?.url 
    : getDeckBackgroundImage("Caballero");

  // Generar estilo del banner para la vista previa
  const previewBannerStyle = {
    backgroundImage: `url(${previewImage})`,
    backgroundPosition: `${localValues.backgroundPositionX}% ${localValues.backgroundPositionY}%`,
    backgroundSize: localValues.backgroundSize,
    height: `${localValues.height}px`,
  };

  const overlayStyle = {
    background: `linear-gradient(${localValues.overlayGradient === "to-t" ? "to top" : localValues.overlayGradient === "to-b" ? "to bottom" : localValues.overlayGradient === "to-l" ? "to left" : "to right"}, rgba(0,0,0,${localValues.overlayOpacity}) 0%, transparent 100%)`,
  };

  // Determinar si los contextos seleccionados soportan vista grid/list
  const supportsViewMode = selectedContexts.some(c => c !== "deck-builder" && c !== "mazo-individual");
  // Para mazo-individual, no mostrar selector de vista
  const showViewModeSelector = supportsViewMode && !selectedContexts.includes("mazo-individual");

  return (
    <AdminGuard requiredRole="ADMIN">
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Ajustar Banners de Deck Panels</h1>
          <p className="text-muted-foreground">
            Ajusta cómo se ven los banners de los deck panels en diferentes secciones, vistas y dispositivos.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel de configuración */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configuración</CardTitle>
                  <CardDescription>
                    Selecciona el contexto y ajusta los parámetros
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Selector múltiple de contextos */}
                  <div className="space-y-2">
                    <Label>Contextos (puedes seleccionar varios)</Label>
                    <div className="space-y-2 border rounded-md p-3">
                      {/* Botón para seleccionar grupo de listas */}
                      <div className="mb-3 pb-3 border-b">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleGroupSelect("listas-mazos")}
                          className="w-full"
                        >
                          Seleccionar Listas de Mazos
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1">
                          Selecciona Mis Mazos, Mazos de la Comunidad y Favoritos
                        </p>
                      </div>
                      
                      {/* Checkboxes de contextos */}
                      {Object.entries(CONTEXT_LABELS).map(([context, label]) => {
                        const isChecked = selectedContexts.includes(context);
                        const isMazoIndividual = context === "mazo-individual";
                        return (
                          <div key={context} className="flex items-start space-x-2">
                            <Checkbox
                              id={`context-${context}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => handleContextToggle(context, checked as boolean)}
                              disabled={isMazoIndividual && selectedContexts.length > 0 && !isChecked && selectedContexts.some(c => c !== "mazo-individual")}
                            />
                            <div className="flex-1">
                              <label
                                htmlFor={`context-${context}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {label}
                              </label>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {CONTEXT_DESCRIPTIONS[context]}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {selectedContexts.length === 0 && (
                      <p className="text-xs text-destructive">
                        Debes seleccionar al menos un contexto
                      </p>
                    )}
                  </div>

                  {/* Selector de vista (solo para algunos contextos) */}
                  {showViewModeSelector && (
                    <div className="space-y-2">
                      <Label>Vista</Label>
                      <Select value={selectedViewMode} onValueChange={setSelectedViewMode}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grid">Grid (Cuadrícula)</SelectItem>
                          <SelectItem value="list">List (Lista)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Selector de dispositivo */}
                  <div className="space-y-2">
                    <Label>Dispositivo</Label>
                    <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(DEVICE_LABELS).map(([device, label]) => (
                          <SelectItem key={device} value={device}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Selector de imagen */}
                  <div className="space-y-2">
                    <Label>Imagen de Fondo</Label>
                    <Select 
                      value={selectedImageId || "all"} 
                      onValueChange={(value) => setSelectedImageId(value === "all" ? null : value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las imágenes (Genérico)</SelectItem>
                        {backgroundImages.map((img) => (
                          <SelectItem key={img.id} value={img.id}>
                            {img.race}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <ButtonUploadBannerImage 
                      onUploadSuccess={(newImage) => {
                        // Agregar nueva imagen a la lista
                        backgroundImages.push(newImage);
                        setSelectedImageId(newImage.id);
                        toastSuccess("Imagen subida correctamente");
                      }}
                    />
                  </div>

                  {/* Posición X */}
                  <div className="space-y-2">
                    <Label htmlFor="positionX">
                      Posición X: {localValues.backgroundPositionX.toFixed(1)}%
                    </Label>
                    <Input
                      id="positionX"
                      type="range"
                      min="0"
                      max="100"
                      step="0.5"
                      value={localValues.backgroundPositionX}
                      onChange={(e) =>
                        setLocalValues((prev) => ({
                          ...prev,
                          backgroundPositionX: Number(e.target.value),
                        }))
                      }
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Izquierda (0%)</span>
                      <span>Centro (50%)</span>
                      <span>Derecha (100%)</span>
                    </div>
                  </div>

                  {/* Posición Y */}
                  <div className="space-y-2">
                    <Label htmlFor="positionY">
                      Posición Y: {localValues.backgroundPositionY.toFixed(1)}%
                    </Label>
                    <Input
                      id="positionY"
                      type="range"
                      min="0"
                      max="100"
                      step="0.5"
                      value={localValues.backgroundPositionY}
                      onChange={(e) =>
                        setLocalValues((prev) => ({
                          ...prev,
                          backgroundPositionY: Number(e.target.value),
                        }))
                      }
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Arriba (0%)</span>
                      <span>Centro (50%)</span>
                      <span>Abajo (100%)</span>
                    </div>
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
                        <SelectItem value="200%">200%</SelectItem>
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
            </div>

            {/* Panel de vista previa */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Vista Previa</CardTitle>
                  <CardDescription>
                    Previsualiza cómo se verá el banner con los ajustes actuales
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Vista previa según el modo */}
                  {selectedViewMode === "grid" || !supportsViewMode ? (
                    <div className="border rounded-lg overflow-hidden">
                      <Card className="flex flex-col overflow-hidden group">
                        <div
                          className="relative overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20"
                          style={previewBannerStyle}
                        >
                          <div className="absolute inset-0" style={overlayStyle} />
                          <div className="absolute bottom-2 left-2 right-2 z-10">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-white text-lg line-clamp-1 drop-shadow-lg">
                                Nombre del Mazo
                              </CardTitle>
                              <Globe className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        </div>
                        <CardContent className="flex-1 flex flex-col p-4">
                          <div className="flex-1 space-y-2 mb-4">
                            <div className="flex flex-wrap gap-2 text-xs items-center">
                              <span className="px-2 py-1 bg-primary/10 text-primary rounded-md">
                                Caballero
                              </span>
                              <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded-md">
                                RE
                              </span>
                              <span className="px-2 py-1 bg-secondary/50 text-secondary-foreground rounded-md">
                                Competitivo
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              40 cartas
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-2">
                              <span>Por Usuario · 15 ene 2024</span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                42
                              </span>
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <Card className="overflow-hidden">
                        <div className="flex flex-col sm:flex-row">
                          <div
                            className="relative w-full sm:w-48 sm:h-auto flex-shrink-0 bg-gradient-to-br from-primary/20 to-secondary/20"
                            style={previewBannerStyle}
                          >
                            <div className="absolute inset-0" style={overlayStyle} />
                            <div className="absolute bottom-2 left-2 right-2 z-10">
                              <CardTitle className="text-white text-lg line-clamp-1 drop-shadow-lg">
                                Nombre del Mazo
                              </CardTitle>
                            </div>
                          </div>
                          <div className="flex-1 p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <CardTitle className="text-xl">Nombre del Mazo</CardTitle>
                                  <Globe className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs mb-2 items-center">
                                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-md">
                                    Caballero
                                  </span>
                                  <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded-md">
                                    RE
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  40 cartas
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Por Usuario · 15 ene 2024 · <Eye className="h-3 w-3 inline" /> 42
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}

                  {/* Información de configuración */}
                  <div className="text-xs text-muted-foreground space-y-1 p-4 bg-muted rounded-lg">
                    <div>
                      <strong>Contexto:</strong> {CONTEXT_LABELS[selectedContext]}
                    </div>
                    {supportsViewMode && (
                      <div>
                        <strong>Vista:</strong> {selectedViewMode === "grid" ? "Grid" : "List"}
                      </div>
                    )}
                    <div>
                      <strong>Dispositivo:</strong> {DEVICE_LABELS[selectedDevice]}
                    </div>
                    <div>
                      <strong>Imagen:</strong> {selectedImageId ? backgroundImages.find(img => img.id === selectedImageId)?.race : "Todas (Genérico)"}
                    </div>
                    <div>
                      <strong>Posición:</strong> X: {localValues.backgroundPositionX.toFixed(1)}%, Y: {localValues.backgroundPositionY.toFixed(1)}%
                    </div>
                    <div>
                      <strong>Tamaño:</strong> {localValues.backgroundSize}
                    </div>
                    <div>
                      <strong>Altura:</strong> {localValues.height}px
                    </div>
                    <div>
                      <strong>Opacidad Overlay:</strong> {Math.round(localValues.overlayOpacity * 100)}%
                    </div>
                    <div>
                      <strong>Gradiente:</strong> {localValues.overlayGradient}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}
