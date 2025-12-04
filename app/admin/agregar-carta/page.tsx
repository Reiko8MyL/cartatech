"use client";

import { useState, useEffect, useMemo } from "react";
import { AdminGuard } from "@/components/admin/admin-guard";
import { useAuth } from "@/contexts/auth-context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Save,
  Plus,
  X,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { toastSuccess, toastError } from "@/lib/toast";
import { CARD_TYPES, RACES, EDITION_ORDER } from "@/lib/deck-builder/types";
import { useCards } from "@/hooks/use-cards";
import { getBaseCardId } from "@/lib/deck-builder/utils";
import Image from "next/image";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface CardFormData {
  id: string;
  name: string;
  type: string;
  cost: string;
  power: string;
  race: string;
  edition: string;
  image: string;
  description: string;
  isCosmetic: boolean;
  isRework: boolean;
  isUnique: boolean;
  isOroIni: boolean;
  banListRE: number;
  banListRL: number;
  banListLI: number;
  baseCardId: string;
}

const BAN_LIST_OPTIONS = [
  { value: 0, label: "BAN (0 copias)" },
  { value: 1, label: "Max 1 copia" },
  { value: 2, label: "Max 2 copias" },
  { value: 3, label: "Libre (3 copias)" },
];

export default function AgregarCartaPage() {
  const { user } = useAuth();
  const { cards: allCards } = useCards(true); // Cargar todas las cartas para validar baseCardId

  const [formData, setFormData] = useState<CardFormData>({
    id: "",
    name: "",
    type: "",
    cost: "",
    power: "",
    race: "",
    edition: "",
    image: "",
    description: "",
    isCosmetic: false,
    isRework: false,
    isUnique: false,
    isOroIni: false,
    banListRE: 3,
    banListRL: 3,
    banListLI: 3,
    baseCardId: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validar campos según el tipo de carta
  const validationRules = useMemo(() => {
    const rules: Record<string, (value: any) => string | null> = {};

    // ID siempre requerido
    rules.id = (value: string) => {
      if (!value.trim()) return "ID es requerido";
      if (!/^MYL-\d{4}(-\d{2})?$/.test(value)) {
        return "ID debe tener formato MYL-XXXX o MYL-XXXX-XX";
      }
      return null;
    };

    // Name siempre requerido
    rules.name = (value: string) => {
      if (!value.trim()) return "Nombre es requerido";
      return null;
    };

    // Type siempre requerido
    rules.type = (value: string) => {
      if (!value) return "Tipo es requerido";
      return null;
    };

    // Edition siempre requerida
    rules.edition = (value: string) => {
      if (!value) return "Edición es requerida";
      return null;
    };

    // Image siempre requerida
    rules.image = (value: string) => {
      if (!value.trim()) return "URL de imagen es requerida";
      try {
        new URL(value);
      } catch {
        return "URL de imagen no válida";
      }
      return null;
    };

    // Cost: requerido para Aliado y Arma, no permitido para Oro y Tótem
    rules.cost = (value: string) => {
      if (formData.type === "Aliado" || formData.type === "Arma") {
        if (!value.trim()) return "Cost es requerido para este tipo";
        const num = parseInt(value, 10);
        if (isNaN(num) || num < 0) return "Cost debe ser un número >= 0";
      } else if (formData.type === "Oro" || formData.type === "Tótem") {
        if (value.trim()) return `${formData.type} no puede tener cost`;
      }
      return null;
    };

    // Power: requerido para Aliado y Arma, no permitido para Talismán, Tótem y Oro
    rules.power = (value: string) => {
      if (formData.type === "Aliado" || formData.type === "Arma") {
        if (!value.trim()) return "Power es requerido para este tipo";
        const num = parseInt(value, 10);
        if (isNaN(num) || num < 0) return "Power debe ser un número >= 0";
      } else if (
        formData.type === "Talismán" ||
        formData.type === "Tótem" ||
        formData.type === "Oro"
      ) {
        if (value.trim()) return `${formData.type} no puede tener power`;
      }
      return null;
    };

    // Race: requerido para Aliado y Arma, no permitido para Talismán, Tótem y Oro
    rules.race = (value: string) => {
      if (formData.type === "Aliado" || formData.type === "Arma") {
        if (!value) return "Raza es requerida para este tipo";
      } else if (
        formData.type === "Talismán" ||
        formData.type === "Tótem" ||
        formData.type === "Oro"
      ) {
        if (value) return `${formData.type} no puede tener raza`;
      }
      return null;
    };

    // baseCardId: requerido si es cosmética
    rules.baseCardId = (value: string) => {
      if (formData.isCosmetic) {
        if (!value.trim()) return "baseCardId es requerido para cartas alternativas";
        // Verificar que la carta base existe
        const baseExists = allCards.some(
          (card) => !card.isCosmetic && card.id === value
        );
        if (!baseExists) {
          return "La carta base no existe";
        }
        // Verificar que el baseCardId coincide con el ID base de la carta
        const expectedBaseId = getBaseCardId(formData.id);
        if (value !== expectedBaseId) {
          return `baseCardId debe ser ${expectedBaseId} para esta carta`;
        }
      }
      return null;
    };

    return rules;
  }, [formData.type, formData.isCosmetic, formData.id, allCards]);

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    Object.keys(validationRules).forEach((key) => {
      const rule = validationRules[key];
      const value = formData[key as keyof CardFormData];
      const error = rule(value);
      if (error) {
        newErrors[key] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Actualizar preview de imagen
  useEffect(() => {
    if (formData.image && formData.image.trim()) {
      try {
        new URL(formData.image);
        setPreviewImage(formData.image);
      } catch {
        setPreviewImage(null);
      }
    } else {
      setPreviewImage(null);
    }
  }, [formData.image]);

  // Auto-calcular baseCardId cuando cambia el ID y es cosmética
  useEffect(() => {
    if (formData.isCosmetic && formData.id) {
      const baseId = getBaseCardId(formData.id);
      setFormData((prev) => ({ ...prev, baseCardId: baseId }));
    }
  }, [formData.id, formData.isCosmetic]);

  // Obtener cartas base disponibles para el selector
  const baseCardsOptions = useMemo(() => {
    return allCards
      .filter((card) => !card.isCosmetic)
      .map((card) => ({
        id: card.id,
        name: card.name,
      }))
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [allCards]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toastError("Por favor corrige los errores en el formulario");
      return;
    }

    if (!user?.id) {
      toastError("Debes estar autenticado para crear cartas");
      return;
    }

    setIsSaving(true);

    try {
      // Preparar datos para enviar
      const cardData = {
        id: formData.id.trim(),
        name: formData.name.trim(),
        type: formData.type,
        cost:
          formData.type === "Oro" || formData.type === "Tótem"
            ? null
            : formData.cost
            ? parseInt(formData.cost, 10)
            : null,
        power:
          formData.type === "Talismán" ||
          formData.type === "Tótem" ||
          formData.type === "Oro"
            ? null
            : formData.power
            ? parseInt(formData.power, 10)
            : null,
        race:
          formData.type === "Talismán" ||
          formData.type === "Tótem" ||
          formData.type === "Oro"
            ? null
            : formData.race || null,
        edition: formData.edition,
        image: formData.image.trim(),
        description: formData.description.trim(),
        isCosmetic: formData.isCosmetic,
        isRework: formData.isRework,
        isUnique: formData.isUnique,
        isOroIni: formData.isOroIni,
        banListRE: formData.banListRE,
        banListRL: formData.banListRL,
        banListLI: formData.banListLI,
        baseCardId: formData.isCosmetic ? formData.baseCardId.trim() : null,
      };

      const response = await fetch("/api/admin/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          card: cardData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear carta");
      }

      toastSuccess(`Carta ${cardData.id} creada exitosamente`);

      // Limpiar cache del cliente para que aparezca inmediatamente
      const { clearCardsCache } = await import("@/hooks/use-cards");
      clearCardsCache();

      // Resetear formulario
      setFormData({
        id: "",
        name: "",
        type: "",
        cost: "",
        power: "",
        race: "",
        edition: "",
        image: "",
        description: "",
        isCosmetic: false,
        isRework: false,
        isUnique: false,
        isOroIni: false,
        banListRE: 3,
        banListRL: 3,
        banListLI: 3,
        baseCardId: "",
      });
      setPreviewImage(null);
      setErrors({});
    } catch (error) {
      console.error("Error al crear carta:", error);
      toastError(
        error instanceof Error ? error.message : "Error al crear carta"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (
    field: keyof CardFormData,
    value: any
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando se modifica
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Determinar qué campos mostrar según el tipo
  const showCost = formData.type === "Aliado" || formData.type === "Arma";
  const showPower =
    formData.type === "Aliado" || formData.type === "Arma";
  const showRace =
    formData.type === "Aliado" || formData.type === "Arma";

  return (
    <AdminGuard requiredRole="ADMIN">
      <div className="container mx-auto p-6 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Agregar Nueva Carta</h1>
          <p className="text-muted-foreground">
            Completa el formulario para agregar una nueva carta a la base de datos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>
                Datos principales de la carta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="id">
                    ID de la Carta <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="id"
                    placeholder="MYL-0001 o MYL-0001-01"
                    value={formData.id}
                    onChange={(e) => handleFieldChange("id", e.target.value)}
                    className={errors.id ? "border-red-500" : ""}
                  />
                  {errors.id && (
                    <p className="text-sm text-red-500">{errors.id}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Formato: MYL-XXXX para cartas principales, MYL-XXXX-XX para alternativas
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nombre <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Nombre de la carta"
                    value={formData.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">
                    Tipo <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => {
                      handleFieldChange("type", value);
                      // Limpiar campos que no aplican al nuevo tipo
                      if (value === "Oro" || value === "Tótem") {
                        handleFieldChange("cost", "");
                      }
                      if (
                        value === "Talismán" ||
                        value === "Tótem" ||
                        value === "Oro"
                      ) {
                        handleFieldChange("power", "");
                        handleFieldChange("race", "");
                      }
                    }}
                  >
                    <SelectTrigger className={errors.type ? "border-red-500" : ""}>
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {CARD_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-sm text-red-500">{errors.type}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edition">
                    Edición <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.edition}
                    onValueChange={(value) =>
                      handleFieldChange("edition", value)
                    }
                  >
                    <SelectTrigger className={errors.edition ? "border-red-500" : ""}>
                      <SelectValue placeholder="Selecciona la edición" />
                    </SelectTrigger>
                    <SelectContent>
                      {EDITION_ORDER.map((edition) => (
                        <SelectItem key={edition} value={edition}>
                          {edition}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.edition && (
                    <p className="text-sm text-red-500">{errors.edition}</p>
                  )}
                </div>
              </div>

              {showCost && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cost">
                      Cost <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="cost"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.cost}
                      onChange={(e) => handleFieldChange("cost", e.target.value)}
                      className={errors.cost ? "border-red-500" : ""}
                    />
                    {errors.cost && (
                      <p className="text-sm text-red-500">{errors.cost}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="power">
                      Power <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="power"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.power}
                      onChange={(e) => handleFieldChange("power", e.target.value)}
                      className={errors.power ? "border-red-500" : ""}
                    />
                    {errors.power && (
                      <p className="text-sm text-red-500">{errors.power}</p>
                    )}
                  </div>
                </div>
              )}

              {showRace && (
                <div className="space-y-2">
                  <Label htmlFor="race">
                    Raza <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.race}
                    onValueChange={(value) => handleFieldChange("race", value)}
                  >
                    <SelectTrigger className={errors.race ? "border-red-500" : ""}>
                      <SelectValue placeholder="Selecciona la raza" />
                    </SelectTrigger>
                    <SelectContent>
                      {RACES.map((race) => (
                        <SelectItem key={race} value={race}>
                          {race}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.race && (
                    <p className="text-sm text-red-500">{errors.race}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Imagen */}
          <Card>
            <CardHeader>
              <CardTitle>Imagen</CardTitle>
              <CardDescription>
                URL de la imagen de la carta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image">
                  URL de la Imagen <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="image"
                    type="url"
                    placeholder="https://..."
                    value={formData.image}
                    onChange={(e) => handleFieldChange("image", e.target.value)}
                    className={errors.image ? "border-red-500" : ""}
                  />
                  {previewImage && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPreviewImage(null)}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
                {errors.image && (
                  <p className="text-sm text-red-500">{errors.image}</p>
                )}
              </div>

              {previewImage && (
                <div className="relative w-48 h-64 border rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={previewImage}
                    alt="Preview"
                    fill
                    className="object-contain"
                    onError={() => setPreviewImage(null)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Descripción */}
          <Card>
            <CardHeader>
              <CardTitle>Descripción</CardTitle>
              <CardDescription>
                Texto descriptivo de la carta (opcional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="description"
                placeholder="Descripción de la carta..."
                value={formData.description}
                onChange={(e) =>
                  handleFieldChange("description", e.target.value)
                }
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Propiedades Especiales */}
          <Card>
            <CardHeader>
              <CardTitle>Propiedades Especiales</CardTitle>
              <CardDescription>
                Características especiales de la carta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isCosmetic">Carta Alternativa (Arte Alternativo)</Label>
                  <p className="text-sm text-muted-foreground">
                    Marca si esta carta es una variante con arte alternativo
                  </p>
                </div>
                <Switch
                  id="isCosmetic"
                  checked={formData.isCosmetic}
                  onCheckedChange={(checked) => {
                    handleFieldChange("isCosmetic", checked);
                    if (checked && formData.id) {
                      const baseId = getBaseCardId(formData.id);
                      handleFieldChange("baseCardId", baseId);
                    }
                  }}
                />
              </div>

              {formData.isCosmetic && (
                <div className="space-y-2 pl-6 border-l-2">
                  <Label htmlFor="baseCardId">
                    Carta Base <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.baseCardId}
                    onValueChange={(value) =>
                      handleFieldChange("baseCardId", value)
                    }
                  >
                    <SelectTrigger className={errors.baseCardId ? "border-red-500" : ""}>
                      <SelectValue placeholder="Selecciona la carta base" />
                    </SelectTrigger>
                    <SelectContent>
                      {baseCardsOptions.map((card) => (
                        <SelectItem key={card.id} value={card.id}>
                          {card.id} - {card.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.baseCardId && (
                    <p className="text-sm text-red-500">{errors.baseCardId}</p>
                  )}
                  <Alert>
                    <Info className="size-4" />
                    <AlertTitle>Nota</AlertTitle>
                    <AlertDescription>
                      El baseCardId se calcula automáticamente desde el ID de la carta.
                      Asegúrate de que coincida con la carta base seleccionada.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isUnique">Carta Única</Label>
                  <p className="text-sm text-muted-foreground">
                    Solo puede haber 1 copia en el mazo (mecánica del juego)
                  </p>
                </div>
                <Switch
                  id="isUnique"
                  checked={formData.isUnique}
                  onCheckedChange={(checked) =>
                    handleFieldChange("isUnique", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isRework">Rework</Label>
                  <p className="text-sm text-muted-foreground">
                    Carta que ha sido reworkeada
                  </p>
                </div>
                <Switch
                  id="isRework"
                  checked={formData.isRework}
                  onCheckedChange={(checked) =>
                    handleFieldChange("isRework", checked)
                  }
                />
              </div>

              {formData.type === "Oro" && (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isOroIni">Oro Inicial</Label>
                    <p className="text-sm text-muted-foreground">
                      Oro que se puede usar como carta inicial
                    </p>
                  </div>
                  <Switch
                    id="isOroIni"
                    checked={formData.isOroIni}
                    onCheckedChange={(checked) =>
                      handleFieldChange("isOroIni", checked)
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ban List */}
          <Card>
            <CardHeader>
              <CardTitle>Ban List</CardTitle>
              <CardDescription>
                Configuración de ban list para cada formato
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="banListRE">Racial Edición (RE)</Label>
                  <Select
                    value={formData.banListRE.toString()}
                    onValueChange={(value) =>
                      handleFieldChange("banListRE", parseInt(value, 10))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BAN_LIST_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value.toString()}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banListRL">Racial Libre (RL)</Label>
                  <Select
                    value={formData.banListRL.toString()}
                    onValueChange={(value) =>
                      handleFieldChange("banListRL", parseInt(value, 10))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BAN_LIST_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value.toString()}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banListLI">Formato Libre (LI)</Label>
                  <Select
                    value={formData.banListLI.toString()}
                    onValueChange={(value) =>
                      handleFieldChange("banListLI", parseInt(value, 10))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BAN_LIST_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value.toString()}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botones de acción */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData({
                  id: "",
                  name: "",
                  type: "",
                  cost: "",
                  power: "",
                  race: "",
                  edition: "",
                  image: "",
                  description: "",
                  isCosmetic: false,
                  isRework: false,
                  isUnique: false,
                  isOroIni: false,
                  banListRE: 3,
                  banListRL: 3,
                  banListLI: 3,
                  baseCardId: "",
                });
                setPreviewImage(null);
                setErrors({});
              }}
            >
              Limpiar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="size-4 mr-2" />
                  Crear Carta
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdminGuard>
  );
}

