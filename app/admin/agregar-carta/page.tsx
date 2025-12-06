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
  Search,
  Edit2,
  Trash2,
  Sparkles,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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

type CardMode = "original" | "alternative";
type ViewMode = "create" | "edit" | "list";

export default function AgregarCartaPage() {
  const { user } = useAuth();
  const { cards: allCards } = useCards(true);

  const [viewMode, setViewMode] = useState<ViewMode>("create");
  const [cardMode, setCardMode] = useState<CardMode>("original");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCardForEdit, setSelectedCardForEdit] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);

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

  // Obtener cartas originales (no alternativas)
  const originalCards = useMemo(() => {
    return allCards.filter((card) => !card.isCosmetic);
  }, [allCards]);

  // Obtener cartas alternativas
  const alternativeCards = useMemo(() => {
    return allCards.filter((card) => card.isCosmetic);
  }, [allCards]);

  // Calcular siguiente ID recomendado para cartas originales
  const getNextOriginalCardId = useMemo(() => {
    if (originalCards.length === 0) return "MYL-0001";
    
    const ids = originalCards
      .map((card) => {
        const match = card.id.match(/^MYL-(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((num) => num > 0)
      .sort((a, b) => b - a);
    
    const nextNum = ids.length > 0 ? ids[0] + 1 : 1;
    return `MYL-${nextNum.toString().padStart(4, "0")}`;
  }, [originalCards]);

  // Calcular siguiente ID recomendado para cartas alternativas
  const getNextAlternativeCardId = useMemo(() => {
    if (!formData.baseCardId) return "";
    
    const baseId = formData.baseCardId;
    const existingAlternatives = alternativeCards.filter(
      (card) => getBaseCardId(card.id) === baseId
    );
    
    if (existingAlternatives.length === 0) {
      return `${baseId}-01`;
    }
    
    const variantNumbers = existingAlternatives
      .map((card) => {
        const match = card.id.match(/^MYL-\d+-(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((num) => num > 0)
      .sort((a, b) => b - a);
    
    const nextVariant = variantNumbers.length > 0 ? variantNumbers[0] + 1 : 1;
    return `${baseId}-${nextVariant.toString().padStart(2, "0")}`;
  }, [formData.baseCardId, alternativeCards]);

  // Aplicar ID recomendado cuando cambia el modo o la carta base
  useEffect(() => {
    if (cardMode === "original" && !formData.id) {
      setFormData((prev) => ({ ...prev, id: getNextOriginalCardId }));
    } else if (cardMode === "alternative" && formData.baseCardId && !formData.id) {
      const recommendedId = getNextAlternativeCardId;
      if (recommendedId) {
        setFormData((prev) => ({ ...prev, id: recommendedId }));
      }
    }
  }, [cardMode, getNextOriginalCardId, getNextAlternativeCardId, formData.baseCardId, formData.id]);

  // Validar campos según el tipo de carta
  const validationRules = useMemo(() => {
    const rules: Record<string, (value: any) => string | null> = {};

    // ID siempre requerido
    rules.id = (value: string) => {
      if (!value.trim()) return "ID es requerido";
      if (cardMode === "original") {
        if (!/^MYL-\d{4}$/.test(value)) {
          return "ID debe tener formato MYL-XXXX";
        }
      } else {
        if (!/^MYL-\d{4}(-\d{2})$/.test(value)) {
          return "ID debe tener formato MYL-XXXX-XX";
        }
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

    // Cost: requerido para Aliado, Arma, Tótem y Talismán, no permitido para Oro
    rules.cost = (value: string) => {
      if (
        formData.type === "Aliado" ||
        formData.type === "Arma" ||
        formData.type === "Tótem" ||
        formData.type === "Talismán"
      ) {
        if (!value.trim()) return "Cost es requerido para este tipo";
        const num = parseInt(value, 10);
        if (isNaN(num) || num < 0) return "Cost debe ser un número >= 0";
      } else if (formData.type === "Oro") {
        if (value.trim()) return `${formData.type} no puede tener cost`;
      }
      return null;
    };

    // Power: requerido solo para Aliado, no permitido para Arma, Tótem, Talismán y Oro
    rules.power = (value: string) => {
      if (formData.type === "Aliado") {
        if (!value.trim()) return "Power es requerido para este tipo";
        const num = parseInt(value, 10);
        if (isNaN(num) || num < 0) return "Power debe ser un número >= 0";
      } else if (
        formData.type === "Arma" ||
        formData.type === "Talismán" ||
        formData.type === "Tótem" ||
        formData.type === "Oro"
      ) {
        if (value.trim()) return `${formData.type} no puede tener power`;
      }
      return null;
    };

    // Race: requerido solo para Aliado, no permitido para Arma, Tótem, Talismán y Oro
    rules.race = (value: string) => {
      if (formData.type === "Aliado") {
        if (!value) return "Raza es requerida para este tipo";
      } else if (
        formData.type === "Arma" ||
        formData.type === "Talismán" ||
        formData.type === "Tótem" ||
        formData.type === "Oro"
      ) {
        if (value) return `${formData.type} no puede tener raza`;
      }
      return null;
    };

    // baseCardId: requerido si es alternativa
    rules.baseCardId = (value: string) => {
      if (cardMode === "alternative") {
        if (!value.trim()) return "Carta base es requerida para cartas alternativas";
        const baseExists = originalCards.some((card) => card.id === value);
        if (!baseExists) {
          return "La carta base no existe";
        }
        const expectedBaseId = getBaseCardId(formData.id);
        if (value !== expectedBaseId) {
          return `baseCardId debe ser ${expectedBaseId} para esta carta`;
        }
      }
      return null;
    };

    return rules;
  }, [formData.type, cardMode, formData.id, originalCards]);

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

  // Auto-calcular baseCardId cuando cambia el ID y es alternativa
  useEffect(() => {
    if (cardMode === "alternative" && formData.id) {
      const baseId = getBaseCardId(formData.id);
      setFormData((prev) => ({ ...prev, baseCardId: baseId }));
    }
  }, [formData.id, cardMode]);

  // Obtener cartas base disponibles para el selector
  const baseCardsOptions = useMemo(() => {
    return originalCards
      .map((card) => ({
        id: card.id,
        name: card.name,
      }))
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [originalCards]);

  // Filtrar cartas para búsqueda
  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return allCards.filter(
      (card) =>
        card.id.toLowerCase().includes(query) ||
        card.name.toLowerCase().includes(query)
    );
  }, [searchQuery, allCards]);

  const resetForm = () => {
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
    setSelectedCardForEdit(null);
  };

  const loadCardForEdit = (card: any) => {
    setFormData({
      id: card.id,
      name: card.name,
      type: card.type,
      cost: card.cost?.toString() || "",
      power: card.power?.toString() || "",
      race: card.race || "",
      edition: card.edition,
      image: card.image,
      description: card.description || "",
      isCosmetic: card.isCosmetic || false,
      isRework: card.isRework || false,
      isUnique: card.isUnique || false,
      isOroIni: card.isOroIni || false,
      banListRE: card.banListRE ?? 3,
      banListRL: card.banListRL ?? 3,
      banListLI: card.banListLI ?? 3,
      baseCardId: card.baseCardId || "",
    });
    setCardMode(card.isCosmetic ? "alternative" : "original");
    setViewMode("edit");
    setSelectedCardForEdit(card);
  };

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
          formData.type === "Oro"
            ? null
            : formData.cost
            ? parseInt(formData.cost, 10)
            : null,
        power:
          formData.type === "Arma" ||
          formData.type === "Talismán" ||
          formData.type === "Tótem" ||
          formData.type === "Oro"
            ? null
            : formData.power
            ? parseInt(formData.power, 10)
            : null,
        race:
          formData.type === "Arma" ||
          formData.type === "Talismán" ||
          formData.type === "Tótem" ||
          formData.type === "Oro"
            ? null
            : formData.race || null,
        edition: formData.edition,
        image: formData.image.trim(),
        description: formData.description.trim(),
        isCosmetic: cardMode === "alternative",
        isRework: formData.isRework,
        isUnique: formData.isUnique,
        isOroIni: formData.isOroIni,
        banListRE: formData.banListRE,
        banListRL: formData.banListRL,
        banListLI: formData.banListLI,
        baseCardId: cardMode === "alternative" ? formData.baseCardId.trim() : null,
      };

      const isEdit = viewMode === "edit";
      const url = "/api/admin/cards";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          card: cardData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Error al ${isEdit ? "actualizar" : "crear"} carta`);
      }

      toastSuccess(`Carta ${cardData.id} ${isEdit ? "actualizada" : "creada"} exitosamente`);

      // Limpiar cache del cliente
      const { clearCardsCache } = await import("@/hooks/use-cards");
      clearCardsCache();

      // Resetear formulario
      resetForm();
      setViewMode("create");
    } catch (error) {
      console.error(`Error al ${viewMode === "edit" ? "actualizar" : "crear"} carta:`, error);
      toastError(
        error instanceof Error ? error.message : `Error al ${viewMode === "edit" ? "actualizar" : "crear"} carta`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user?.id || !cardToDelete) return;

    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/admin/cards?userId=${user.id}&cardId=${cardToDelete}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al eliminar carta");
      }

      toastSuccess(`Carta ${cardToDelete} eliminada exitosamente`);

      // Limpiar cache del cliente
      const { clearCardsCache } = await import("@/hooks/use-cards");
      clearCardsCache();

      setDeleteDialogOpen(false);
      setCardToDelete(null);
      if (selectedCardForEdit?.id === cardToDelete) {
        resetForm();
        setViewMode("create");
      }
    } catch (error) {
      console.error("Error al eliminar carta:", error);
      toastError(
        error instanceof Error ? error.message : "Error al eliminar carta"
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

  const handleCardModeChange = (mode: CardMode) => {
    setCardMode(mode);
    resetForm();
    if (mode === "original") {
      setFormData((prev) => ({ ...prev, isCosmetic: false, baseCardId: "" }));
    } else {
      setFormData((prev) => ({ ...prev, isCosmetic: true }));
    }
  };

  // Determinar qué campos mostrar según el tipo
  // Aliados: coste, fuerza, raza
  // Arma, Tótem, Talismán: coste (solo)
  // Oro: ninguno
  const showCost =
    formData.type === "Aliado" ||
    formData.type === "Arma" ||
    formData.type === "Tótem" ||
    formData.type === "Talismán";
  const showPower = formData.type === "Aliado";
  const showRace = formData.type === "Aliado";

  return (
    <AdminGuard requiredRole="ADMIN">
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gestión de Cartas</h1>
          <p className="text-muted-foreground">
            Crea, edita o elimina cartas de la base de datos
          </p>
        </div>

        {/* Tabs de navegación */}
        <div className="mb-6">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => {
              if (value) {
                setViewMode(value as ViewMode);
                if (value === "create") {
                  resetForm();
                }
              }
            }}
            className="w-full"
          >
            <ToggleGroupItem value="create" aria-label="Crear carta" className="flex-1">
              <Plus className="size-4 mr-2" />
              Crear Carta
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="Buscar cartas" className="flex-1">
              <Search className="size-4 mr-2" />
              Buscar Cartas
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Vista de búsqueda */}
        {viewMode === "list" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Buscar Cartas</CardTitle>
              <CardDescription>
                Busca cartas por ID o nombre para editarlas o eliminarlas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Buscar por ID o nombre..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                </div>

                {filteredCards.length > 0 && (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredCards.map((card) => (
                      <div
                        key={card.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{card.id}</div>
                          <div className="text-sm text-muted-foreground">{card.name}</div>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline">{card.type}</Badge>
                            {card.isCosmetic && (
                              <Badge variant="secondary">Arte Alternativo</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadCardForEdit(card)}
                          >
                            <Edit2 className="size-4 mr-2" />
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setCardToDelete(card.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="size-4 mr-2" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {searchQuery && filteredCards.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No se encontraron cartas
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vista de creación/edición */}
        {(viewMode === "create" || viewMode === "edit") && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selector de tipo de carta */}
            <Card>
              <CardHeader>
                <CardTitle>Tipo de Carta</CardTitle>
                <CardDescription>
                  Selecciona si es una carta original o con arte alternativo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ToggleGroup
                  type="single"
                  value={cardMode}
                  onValueChange={(value) => {
                    if (value) handleCardModeChange(value as CardMode);
                  }}
                  disabled={viewMode === "edit"}
                >
                  <ToggleGroupItem value="original" aria-label="Carta original" className="flex-1">
                    Carta Original
                  </ToggleGroupItem>
                  <ToggleGroupItem value="alternative" aria-label="Arte alternativo" className="flex-1">
                    Arte Alternativo
                  </ToggleGroupItem>
                </ToggleGroup>
              </CardContent>
            </Card>

            {/* Información Básica */}
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
                <CardDescription>
                  Datos principales de la carta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {cardMode === "alternative" && (
                  <div className="space-y-2">
                    <Label htmlFor="baseCardId">
                      Carta Base <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.baseCardId}
                      onValueChange={(value) => {
                        handleFieldChange("baseCardId", value);
                        // Auto-calcular ID recomendado
                        const baseId = value;
                        const existingAlternatives = alternativeCards.filter(
                          (card) => getBaseCardId(card.id) === baseId
                        );
                        const variantNumbers = existingAlternatives
                          .map((card) => {
                            const match = card.id.match(/^MYL-\d+-(\d+)$/);
                            return match ? parseInt(match[1], 10) : 0;
                          })
                          .filter((num) => num > 0)
                          .sort((a, b) => b - a);
                        const nextVariant = variantNumbers.length > 0 ? variantNumbers[0] + 1 : 1;
                        const recommendedId = `${baseId}-${nextVariant.toString().padStart(2, "0")}`;
                        handleFieldChange("id", recommendedId);
                      }}
                      disabled={viewMode === "edit"}
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
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="id">
                        ID de la Carta <span className="text-red-500">*</span>
                      </Label>
                      {cardMode === "original" && !formData.id && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFieldChange("id", getNextOriginalCardId)}
                          className="h-auto p-1"
                        >
                          <Sparkles className="size-3 mr-1" />
                          Usar recomendado: {getNextOriginalCardId}
                        </Button>
                      )}
                    </div>
                    <Input
                      id="id"
                      placeholder={cardMode === "original" ? "MYL-0001" : "MYL-0001-01"}
                      value={formData.id}
                      onChange={(e) => handleFieldChange("id", e.target.value)}
                      className={errors.id ? "border-red-500" : ""}
                      disabled={viewMode === "edit"}
                    />
                    {errors.id && (
                      <p className="text-sm text-red-500">{errors.id}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {cardMode === "original"
                        ? "Formato: MYL-XXXX"
                        : "Formato: MYL-XXXX-XX"}
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
                        if (value === "Oro") {
                          handleFieldChange("cost", "");
                        }
                        if (
                          value === "Arma" ||
                          value === "Talismán" ||
                          value === "Tótem" ||
                          value === "Oro"
                        ) {
                          handleFieldChange("power", "");
                        }
                        if (
                          value === "Arma" ||
                          value === "Talismán" ||
                          value === "Tótem" ||
                          value === "Oro"
                        ) {
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

                {/* Campos según tipo */}
                {showCost && (
                  <div className={`grid gap-4 ${showPower ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
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

                    {showPower && (
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
                    )}
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
                  resetForm();
                  setViewMode("create");
                }}
              >
                Limpiar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    {viewMode === "edit" ? "Actualizando..." : "Guardando..."}
                  </>
                ) : (
                  <>
                    <Save className="size-4 mr-2" />
                    {viewMode === "edit" ? "Actualizar Carta" : "Crear Carta"}
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Dialog de confirmación de eliminación */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Eliminar carta?</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer. La carta {cardToDelete} será eliminada permanentemente.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setCardToDelete(null);
                }}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4 mr-2" />
                    Eliminar
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminGuard>
  );
}
