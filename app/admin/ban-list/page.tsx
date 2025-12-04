"use client";

import { useEffect, useState, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Search,
  Save,
  RefreshCw,
  AlertCircle,
  Minus,
  Plus,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toastSuccess, toastError } from "@/lib/toast";
import type { DeckFormat } from "@/lib/deck-builder/types";

interface BanListCard {
  id: string;
  name: string;
  type: string;
  edition: string;
  banListRE: number;
  banListRL: number;
  banListLI: number;
  alternativeArtsCount: number;
}

const BAN_LIST_LABELS: Record<number, { label: string; color: string; bgColor: string }> = {
  0: { label: "BAN", color: "text-red-600", bgColor: "bg-red-600/10 border-red-600/20" },
  1: { label: "Max 1", color: "text-orange-600", bgColor: "bg-orange-600/10 border-orange-600/20" },
  2: { label: "Max 2", color: "text-yellow-600", bgColor: "bg-yellow-600/10 border-yellow-600/20" },
  3: { label: "Libre", color: "text-green-600", bgColor: "bg-green-600/10 border-green-600/20" },
};

export default function AdminBanListPage() {
  const { user } = useAuth();
  const [format, setFormat] = useState<DeckFormat>("RE");
  const [cards, setCards] = useState<BanListCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<BanListCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<number | null>(null);
  const [savingCardId, setSavingCardId] = useState<string | null>(null);

  async function loadBanList() {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/ban-list?userId=${user.id}&format=${format}`);

      if (!response.ok) {
        throw new Error("Error al cargar ban list");
      }

      const data = await response.json();
      setCards(data.cards || []);
    } catch (error) {
      console.error("Error al cargar ban list:", error);
      toastError("Error al cargar ban list");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    loadBanList();
  }, [user, format]);

  // Filtrar cartas por búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCards(cards);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = cards.filter(
      (card) =>
        card.id.toLowerCase().includes(term) ||
        card.name.toLowerCase().includes(term) ||
        card.type.toLowerCase().includes(term) ||
        card.edition.toLowerCase().includes(term)
    );
    setFilteredCards(filtered);
  }, [searchTerm, cards]);

  async function handleSaveBanList(cardId: string, newValue: number) {
    if (!user?.id) return;

    setSavingCardId(cardId);

    try {
      const response = await fetch(`/api/admin/ban-list`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          cardId,
          format,
          value: newValue,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar ban list");
      }

      toastSuccess(
        `Ban list actualizada para ${cardId} y todas sus versiones alternativas`
      );

      // Actualizar estado local
      setCards((prev) =>
        prev.map((card) => {
          if (card.id === cardId) {
            return {
              ...card,
              [`banList${format}`]: newValue,
            };
          }
          return card;
        })
      );

      setEditingCard(null);
      setEditingValue(null);
    } catch (error) {
      console.error("Error al actualizar ban list:", error);
      toastError(
        error instanceof Error
          ? error.message
          : "Error al actualizar ban list"
      );
    } finally {
      setSavingCardId(null);
    }
  }

  function getBanListValue(card: BanListCard): number {
    return format === "RE"
      ? card.banListRE
      : format === "RL"
      ? card.banListRL
      : card.banListLI;
  }

  function getBanListLabel(value: number) {
    return BAN_LIST_LABELS[value] || BAN_LIST_LABELS[3];
  }

  // Agrupar cartas por estado de ban list para mejor visualización
  const groupedCards = useMemo(() => {
    const groups: Record<number, BanListCard[]> = {
      0: [],
      1: [],
      2: [],
      3: [],
    };

    filteredCards.forEach((card) => {
      const value = getBanListValue(card);
      groups[value].push(card);
    });

    return groups;
  }, [filteredCards, format]);

  return (
    <AdminGuard requiredRole="ADMIN">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gestión de Ban List</h1>
            <p className="text-muted-foreground">
              Actualiza la lista de cartas prohibidas y restringidas para cada formato
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setIsRefreshing(true);
              loadBanList();
            }}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw
              className={`size-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>
        </div>

        {/* Selector de formato */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Formato</CardTitle>
            <CardDescription>
              Selecciona el formato para gestionar su ban list
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ToggleGroup
              type="single"
              value={format}
              onValueChange={(value) => {
                if (value) setFormat(value as DeckFormat);
              }}
              className="w-full max-w-md"
            >
              <ToggleGroupItem value="RE" className="flex-1">
                Racial Edición
              </ToggleGroupItem>
              <ToggleGroupItem value="RL" className="flex-1">
                Racial Libre
              </ToggleGroupItem>
              <ToggleGroupItem value="LI" className="flex-1">
                Formato Libre
              </ToggleGroupItem>
            </ToggleGroup>
          </CardContent>
        </Card>

        {/* Búsqueda */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
              <Input
                placeholder="Buscar por ID, nombre, tipo o edición..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cartas agrupadas por estado */}
            {[0, 1, 2, 3].map((banValue) => {
              const groupCards = groupedCards[banValue];
              if (groupCards.length === 0) return null;

              const label = getBanListLabel(banValue);

              return (
                <Card key={banValue}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle>{label.label}</CardTitle>
                        <Badge variant="outline" className={label.bgColor}>
                          {groupCards.length} carta{groupCards.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <Badge variant="outline" className={label.bgColor}>
                        {label.label}
                      </Badge>
                    </div>
                    <CardDescription>
                      {banValue === 0
                        ? "Cartas completamente prohibidas (0 copias permitidas)"
                        : banValue === 1
                        ? "Cartas restringidas a máximo 1 copia por mazo"
                        : banValue === 2
                        ? "Cartas restringidas a máximo 2 copias por mazo"
                        : "Cartas libres (sin restricciones)"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {groupCards.map((card) => {
                        const currentValue = getBanListValue(card);
                        const isEditing = editingCard === card.id;
                        const displayValue = isEditing
                          ? editingValue ?? currentValue
                          : currentValue;

                        return (
                          <Card
                            key={card.id}
                            className="border-l-4"
                            style={{
                              borderLeftColor:
                                displayValue === 0
                                  ? "#dc2626"
                                  : displayValue === 1
                                  ? "#ea580c"
                                  : displayValue === 2
                                  ? "#ca8a04"
                                  : "#16a34a",
                            }}
                          >
                            <CardContent className="pt-6">
                              <div className="space-y-3">
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-sm">
                                      {card.name}
                                    </span>
                                    {card.alternativeArtsCount > 0 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{card.alternativeArtsCount} alt
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {card.id} • {card.type} • {card.edition}
                                  </div>
                                </div>

                                {isEditing ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          if (displayValue > 0) {
                                            setEditingValue(displayValue - 1);
                                          }
                                        }}
                                        disabled={displayValue === 0}
                                      >
                                        <Minus className="size-3" />
                                      </Button>
                                      <div className="flex-1 text-center">
                                        <Badge
                                          variant="outline"
                                          className={getBanListLabel(displayValue).bgColor}
                                        >
                                          {getBanListLabel(displayValue).label}
                                        </Badge>
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          if (displayValue < 3) {
                                            setEditingValue(displayValue + 1);
                                          }
                                        }}
                                        disabled={displayValue === 3}
                                      >
                                        <Plus className="size-3" />
                                      </Button>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        className="flex-1"
                                        onClick={() =>
                                          handleSaveBanList(
                                            card.id,
                                            editingValue ?? currentValue
                                          )
                                        }
                                        disabled={savingCardId === card.id}
                                      >
                                        {savingCardId === card.id ? (
                                          <Loader2 className="size-3 mr-1 animate-spin" />
                                        ) : (
                                          <Save className="size-3 mr-1" />
                                        )}
                                        Guardar
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setEditingCard(null);
                                          setEditingValue(null);
                                        }}
                                      >
                                        Cancelar
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    <Badge
                                      variant="outline"
                                      className={getBanListLabel(currentValue).bgColor}
                                    >
                                      {getBanListLabel(currentValue).label}
                                    </Badge>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingCard(card.id);
                                        setEditingValue(currentValue);
                                      }}
                                    >
                                      Editar
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredCards.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="size-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    No se encontraron cartas con los filtros aplicados
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AdminGuard>
  );
}

